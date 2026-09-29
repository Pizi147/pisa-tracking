import { db } from '../db.ts';
import { MEASURE_KIND_LABEL_V3, PERMISSIONS, VIOLATION_CATEGORY_LABEL, metricById, type ChiSo, type ChuongTrinh, type LoaiBoQuen } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden, HttpError, notFound } from '../util.ts';
import { listCases } from '../cases/cases.ts';
import { labelOf, listSignals, overdueNormalSignalIds } from '../cases/signals.ts';
import { NOT_UNCONFIRMED_PRESET, awaitingCauseCaseIds } from '../cases/sosState.ts';
import { improvementRate, planOutcomes } from '../cases/effectiveness.ts';
import { doPhuDanhGia, hvDuoiKyVongMon, hvSosHienTai } from './danhGia.ts';
import { isYThucMetric, yThucMetric, YTHUC_METRIC_IDS } from '../yThuc/thongKe.ts';
import { PHOI_HOP_METRIC_IDS, isPhoiHopMetric, phoiHopMetric } from '../yThuc/phoiHop.ts';
import { locTheoChuongTrinh } from './chuongTrinh.ts';
import { scoreDebtCells } from './scoreDebt.ts';
import { boQuen } from '../phanTich/boQuen.ts';

/**
 * TẬP ID CỦA TỪNG CHỈ SỐ — nơi duy nhất sinh ra cả CON SỐ lẫn DANH SÁCH KHI BẤM VÀO (hợp đồng số liệu).
 *
 * Mỗi hàm trả về một TẬP ID (`ids`); số là `ids.length`. Không có đường nào đếm riêng — nên không có
 * chuyện ô ghi 7 mà bấm vào ra 5 dòng, và cũng không có chuyện hai màn cùng tên số mà khác tập (F10).
 *
 * MỖI HÀM DỰA VÀO MỘT HÀM ĐÃ CÓ VÀ ĐÃ LỌC QUYỀN (`listCases`, `listSignals`, `planOutcomes`) chứ không
 * tự viết lại bộ lọc phạm vi. Bộ lọc quyền chỉ có một nơi, nên drill-down không thể xem được nhiều
 * hơn ô số tổng — đúng luật 6 của hợp đồng.
 *
 * CHỈ SỐ NÀO CHƯA CÓ HÀM Ở ĐÂY thì đã khai báo trong sổ (`shared/domain/metrics.ts`) nhưng chưa dùng
 * được: `metricSet` nói thẳng "chưa có danh sách" thay vì trả một con số không kiểm chứng được.
 */

export type MetricResult = {
  id: string;
  metric: ChiSo;
  /** Đơn vị của các phần tử trong `ids`. */
  unit: ChiSo['donVi'];
  /** TẬP ID sinh ra con số. Số = `ids.length` = `n`. */
  ids: number[];
  n: number;
  /** Chỉ số dạng tỷ lệ: tử số là tập con của `ids` (mẫu số). */
  numeratorIds?: number[];
  /** Chỉ số "n trên N" mà `ids` là phần được đếm: `denominatorIds` là mẫu số (`ids` ⊆ `denominatorIds`). */
  denominatorIds?: number[];
  /** Chỉ số có hai phần loại trừ nhau, cộng lại đúng bằng `ids` (ví dụ SOS tạm thời / kết quả cuối). */
  splits?: { tamThoi: number[]; ketQuaCuoi: number[] };
  /** Chỉ số chia theo loại (`bien-phap-theo-loai`): mỗi loại một tập; hợp của chúng đúng bằng `ids`. */
  byKind?: Record<string, number[]>;
  /** Phạm vi rỗng — không có gì để đếm. KHÔNG được hiểu thành toàn hệ thống. */
  empty: boolean;
  note: string | null;
  today: string;
};

const EMPTY_NOTE = 'Không có dữ liệu trong phạm vi';

/** Một dòng của panel danh sách: đủ để người đọc nhận ra bản ghi và bấm sang đúng chỗ. */
export type MetricRow = { id: number; title: string; sub: string; href: string };

/**
 * DỰNG DÒNG CHO MỘT TẬP ID — chỉ "tô màu" tập đã có (tên, lớp, đường dẫn), KHÔNG lọc thêm gì.
 * Tập ID đã qua quyền ở `metricSet`; hàm này không nhận phạm vi nên không thể mở rộng hay thu hẹp nó.
 */
export function rowsFor(unit: ChiSo['donVi'], ids: number[]): MetricRow[] {
  const conn = db();
  const byId = new Map<number, MetricRow>();
  const chunks = <T>(list: T[]) => Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
  for (const chunk of chunks(ids)) {
    const ph = chunk.map(() => '?').join(',');
    if (unit === 'hoc-vien') {
      for (const r of conn.prepare(
        `SELECT s.id, s.full_name, s.student_code,
                (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                  WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS class_code
           FROM students s WHERE s.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.full_name, sub: [r.student_code, r.class_code].filter(Boolean).join(' · '), href: `/hoc-vien/${r.id}` });
      }
    } else if (unit === 'case') {
      for (const r of conn.prepare(
        `SELECT sc.id, COALESCE(sc.title, sc.category, sc.topic) AS title, s.full_name, s.student_code, sc.status
           FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
          WHERE sc.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.title ?? `Case ${r.id}`, sub: [r.full_name, r.student_code].filter(Boolean).join(' · '), href: `/hoc-thuat/case/${r.id}` });
      }
    } else if (unit === 'phuong-an') {
      for (const r of conn.prepare(
        `SELECT iv.id, iv.case_id, COALESCE(NULLIF(iv.description, ''), iv.kind) AS title, s.full_name, s.student_code
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN students s ON s.id = sc.student_id
          WHERE iv.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.title, sub: [r.full_name, r.student_code].filter(Boolean).join(' · '), href: `/hoc-thuat/case/${r.case_id}` });
      }
    } else if (unit === 'dot-test' || unit === 'bai-thi') {
      /* Lượt Test: FT mở hồ sơ Test; bài của lớp Normal mở bảng điểm thường của lớp. */
      for (const r of conn.prepare(
        `SELECT a.id, a.kind, a.attempt_no, a.class_id, s.full_name, s.student_code, c.code AS class_code, pr.code AS period_code
           FROM assessment_attempts a JOIN students s ON s.id = a.student_id
           LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const name = r.kind === 'mock' ? `MT${r.attempt_no}` : r.kind === 'final' ? 'Bài cuối khoá' : 'Bài giữa khoá';
        byId.set(r.id, {
          id: r.id, title: `${name} · ${r.full_name}`,
          sub: [r.student_code, r.class_code, r.period_code].filter(Boolean).join(' · '),
          href: r.kind === 'mock' || !r.class_id ? `/mock-test/${r.id}` : `/bang-diem-thuong/${r.class_id}?kind=${r.kind}`,
        });
      }
    } else if (unit === 'nghia-vu') {
      /* Mã nghĩa vụ = id phương án × 1000 + chu kỳ; dòng nói rõ phương án nào, chu kỳ nào, của em nào. */
      const ivIds = [...new Set(chunk.map((id) => parseObligation(id).interventionId))];
      const phi = ivIds.map(() => '?').join(',');
      const byIv = new Map<number, any>();
      for (const r of conn.prepare(
        `SELECT iv.id, iv.case_id, COALESCE(NULLIF(iv.description, ''), iv.kind) AS title, s.full_name, s.student_code
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN students s ON s.id = sc.student_id WHERE iv.id IN (${phi})`,
      ).all(...ivIds) as any[]) byIv.set(r.id, r);
      for (const id of chunk) {
        const { interventionId, cycle } = parseObligation(id);
        const r = byIv.get(interventionId);
        if (!r) continue;
        byId.set(id, {
          id, title: `${r.title} · chu kỳ ${cycle}`,
          sub: [r.full_name, r.student_code].filter(Boolean).join(' · '), href: `/hoc-thuat/case/${r.case_id}`,
        });
      }
    } else if (unit === 'vi-pham') {
      /* Ý thức (PR-J): dòng vi phạm mở hồ sơ học viên — tab Ý thức là việc của PR-K. */
      for (const r of conn.prepare(
        `SELECT v.id, v.student_id, v.category, v.skill, v.occurred_on, v.description, s.full_name, s.student_code
           FROM violations v JOIN students s ON s.id = v.student_id WHERE v.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const cat = VIOLATION_CATEGORY_LABEL[r.category as keyof typeof VIOLATION_CATEGORY_LABEL] ?? r.category;
        byId.set(r.id, {
          id: r.id, title: `${cat} · ${String(r.occurred_on).slice(8, 10)}/${String(r.occurred_on).slice(5, 7)}`,
          sub: [r.full_name, r.student_code, String(r.description).slice(0, 60)].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}`,
        });
      }
    } else if (unit === 'bien-phap') {
      for (const r of conn.prepare(
        `SELECT m.id, m.student_id, m.kind, m.custom_name, m.status, m.performed_on, s.full_name, s.student_code
           FROM discipline_measures m JOIN students s ON s.id = m.student_id WHERE m.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const name = r.kind === 'other' && r.custom_name ? r.custom_name : MEASURE_KIND_LABEL_V3[r.kind as keyof typeof MEASURE_KIND_LABEL_V3] ?? r.kind;
        const state = r.status === 'done' ? `đã thực hiện ${String(r.performed_on ?? '').slice(8, 10)}/${String(r.performed_on ?? '').slice(5, 7)}` : 'đang chuẩn bị';
        byId.set(r.id, { id: r.id, title: name, sub: [r.full_name, r.student_code, state].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
      }
    } else if (unit === 'luot-sos') {
      /* Phối hợp SOS (PR-T): dòng lượt Mock có SOS mở hồ sơ học viên — sub-tab `Phối hợp SOS` là việc của PR-K. */
      for (const r of conn.prepare(
        `SELECT a.id, a.attempt_no, a.student_id, s.full_name, s.student_code, c.code AS class_code
           FROM assessment_attempts a JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id
          WHERE a.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: `MT${r.attempt_no} · ${r.full_name}`, sub: [r.student_code, r.class_code].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
      }
    } else if (unit === 'tin-hieu') {
      for (const r of conn.prepare(
        `SELECT sg.id, sg.student_id, sg.skill, sg.verify_due, s.full_name, s.student_code
           FROM case_signals sg JOIN students s ON s.id = sg.student_id WHERE sg.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: `Tín hiệu cần xác minh · ${labelOf(r)}`, sub: [r.full_name, r.student_code, `hạn ${String(r.verify_due).slice(8, 10)}/${String(r.verify_due).slice(5, 7)}`].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
      }
    }
  }
  /* Giữ đúng thứ tự của tập ID; ID không tra được vẫn hiện — không im lặng làm rơi bản ghi khỏi danh sách. */
  return ids.map((id) => byId.get(id) ?? { id, title: `#${id}`, sub: '', href: '#' });
}

/**
 * HÌNH DẠNG TRẢ VỀ CỦA `GET /metrics/:id` (N4). Ô số chỉ cần `n` — trả cả tập ID cho mỗi lần vẽ một ô là phí băng
 * thông với tập lớn. Chỉ khi xin `rows=1` (mở panel danh sách) mới kèm `ids` và các dòng; lúc đó cả ba — số, tập ID và
 * dòng — vẫn sinh ra từ CÙNG một `MetricResult`, nên không thể lệch nhau.
 */
export function metricResponse(r: MetricResult, withRows: boolean) {
  const lean = {
    id: r.id, unit: r.unit, n: r.n,
    numerator: r.numeratorIds ? r.numeratorIds.length : null,
    denominator: r.denominatorIds ? r.denominatorIds.length : null,
    splits: r.splits ? { tamThoi: r.splits.tamThoi.length, ketQuaCuoi: r.splits.ketQuaCuoi.length } : null,
    byKind: r.byKind ? Object.fromEntries(Object.entries(r.byKind).map(([k, v]) => [k, v.length])) : null,
    empty: r.empty, note: r.note, today: r.today,
  };
  if (!withRows) return lean;
  return {
    ...lean, ids: r.ids, numeratorIds: r.numeratorIds, denominatorIds: r.denominatorIds, splitIds: r.splits, byKindIds: r.byKind,
    rows: rowsFor(r.unit, r.ids),
  };
}

/** Các chỉ số ĐÃ CÓ hàm tập ID. Chỉ số khác trong sổ chưa dùng được. */
export const LISTED_METRICS: readonly string[] = [
  'hv-sos-hien-tai', 'hv-duoi-ky-vong-mon', 'hv-co-case-mo', 'case-mo', 'tin-hieu-cho-xac-minh', 'tin-hieu-qua-han',
  'case-xac-dinh-nguyen-nhan-qua-han', 'bai-qua-han-nhap-diem', 'case-chua-co-nguoi-phu-trach',
  'case-cho-xac-dinh-nguyen-nhan', 'case-thieu-pa', 'pa-can-cap-nhat', 'pa-cho-duyet', 'pa-co-ket-qua', 'ty-le-co-cai-thien',
  'dung-han-cap-nhat', 'do-phu-danh-gia', 'hv-can-ho-tro-2-lan-chua-case', 'hv-bo-qua-van-can-ho-tro',
  ...YTHUC_METRIC_IDS,
  ...PHOI_HOP_METRIC_IDS,
];

/** Kỹ năng ĐÁNH GIÁ mà `hv-duoi-ky-vong-mon` nhận — chỉ số của khung Fast Track (MH5), không có môn lớp thường. */
const SKILLS_FOR_METRIC = ['listening', 'reading', 'writing', 'speaking'] as const;

/**
 * NGHĨA VỤ CẬP NHẬT = MỘT PHƯƠNG ÁN × MỘT CHU KỲ. Mã số của nó là `id phương án × 1000 + số chu kỳ` (chu kỳ
 * không bao giờ tới 1000) để đi qua cùng đường `ids: number[]` như mọi chỉ số khác.
 */
export const obligationId = (interventionId: number, cycle: number) => interventionId * 1000 + cycle;
export const parseObligation = (id: number) => ({ interventionId: Math.floor(id / 1000), cycle: id % 1000 });

/**
 * NGHĨA VỤ CẬP NHẬT ĐÃ QUA HẠN của một tập case (`dung-han-cap-nhat`).
 *
 *   ĐÃ CẬP NHẬT  — mỗi chu kỳ có ít nhất một dòng theo dõi (`case_followups`) mang hạn của chính chu kỳ đó.
 *                  Đúng hạn nếu có ít nhất một dòng không trễ. Bấm ghi chú thêm lần nữa KHÔNG sinh nghĩa vụ mới.
 *   CHƯA LÀM     — phương án đang chạy, không chờ duyệt, hạn cập nhật của chu kỳ hiện tại đã qua mà chưa có dòng
 *                  theo dõi nào cho chu kỳ đó.
 * "Đã qua hạn" là hạn < ngày dữ liệu — cùng luật với `pa-can-cap-nhat`. Không tính phương án chờ duyệt (chưa được
 * chạy nên chưa có nghĩa vụ) và không tính case nhập bù (không có hạn cập nhật). Ý thức không còn case (21/09/2026).
 */
function obligations(caseIds: number[], today: string, from: string | null, to: string | null) {
  const inPeriod = (due: string) => (!from || due >= from) && (!to || due <= to);
  const den = new Map<number, boolean>();           // id nghĩa vụ → hoàn thành đúng hạn
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    const ph = chunk.map(() => '?').join(',');
    for (const r of db()
      .prepare(
        `SELECT f.intervention_id AS iv, f.cycle_no AS cycle, MIN(f.cycle_due) AS due, MIN(f.late) AS late
           FROM case_followups f
          WHERE f.case_id IN (${ph}) AND f.intervention_id IS NOT NULL AND f.cycle_no IS NOT NULL AND f.cycle_due IS NOT NULL
          GROUP BY f.intervention_id, f.cycle_no`,
      )
      .all(...chunk) as any[]) {
      if (r.due < today && inPeriod(r.due)) den.set(obligationId(r.iv, r.cycle), r.late === 0);
    }
    for (const r of db()
      .prepare(
        `SELECT iv.id, iv.cycle_no AS cycle, iv.action_due AS due FROM case_interventions iv
          WHERE iv.case_id IN (${ph}) AND iv.status IN ${RUNNING}
            AND COALESCE(iv.approval_state, '') != 'pending'
            AND ${NOT_UNCONFIRMED_PRESET('iv')}
            AND iv.action_due IS NOT NULL AND iv.action_due < ?
            AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = iv.id AND f.cycle_no = iv.cycle_no)`,
      )
      .all(...chunk, today) as any[]) {
      if (inPeriod(r.due)) den.set(obligationId(r.id, r.cycle), false);
    }
  }
  const ids = [...den.keys()].sort((x, y) => x - y);
  return { ids, numeratorIds: ids.filter((id) => den.get(id)) };
}

/** PHƯƠNG ÁN CHỜ DUYỆT của một tập case. */
function pendingApprovalPlans(caseIds: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db()
      .prepare(
        `SELECT iv.id FROM case_interventions iv
          WHERE iv.case_id IN (${chunk.map(() => '?').join(',')}) AND iv.approval_state = 'pending' ORDER BY iv.id`,
      )
      .all(...chunk) as any[]).map((r) => r.id as number));
  }
  return out;
}

/**
 * Phạm vi của người gọi ∩ chi nhánh được hỏi. Hỏi chi nhánh NGOÀI phạm vi thì TỪ CHỐI — không được
 * âm thầm trả một tập rút gọn (rỗng) như thể người đó có quyền mà không có dữ liệu.
 */
function resolveScope(p: Principal, branchId: number | null | undefined): { empty: boolean; branchId: number | null } {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (sc.none) return { empty: true, branchId: null };
  if (branchId && !sc.all) {
    const allowed = new Set<number>(sc.branchIds);
    /* Giáo viên có phạm vi theo LỚP: chi nhánh của các lớp mình phụ trách cũng là phạm vi của họ. */
    if (sc.classIds.length) {
      for (const r of db()
        .prepare(`SELECT DISTINCT branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
        .all(...sc.classIds) as any[]) allowed.add(r.branch_id);
    }
    if (!allowed.has(branchId)) {
      throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
    }
  }
  return { empty: false, branchId: branchId ?? null };
}

const RUNNING = `('planned','started')`;

/**
 * PHƯƠNG ÁN CẦN CẬP NHẬT: đang theo dõi, KHÔNG chờ duyệt, và quá hạn cập nhật tuần. Khác "quá hạn
 * làm" (F11) — đây là hạn cập nhật KẾT QUẢ, không phải hạn thực hiện.
 */
function overdueUpdatePlans(caseIds: number[], today: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db()
      .prepare(
        `SELECT iv.id FROM case_interventions iv
          WHERE iv.case_id IN (${chunk.map(() => '?').join(',')})
            AND iv.status IN ${RUNNING}
            AND COALESCE(iv.approval_state, '') != 'pending'
            AND ${NOT_UNCONFIRMED_PRESET('iv')}
            AND iv.action_due IS NOT NULL AND iv.action_due < ?
          ORDER BY iv.id`,
      )
      .all(...chunk, today) as any[]).map((r) => r.id as number));
  }
  return out;
}

/**
 * Phạm vi cho hàm hiệu quả — MỘT DANH SÁCH phạm vi, kết quả là hợp của chúng.
 *
 * Quyền theo CHI NHÁNH (Quản lý) cho một phạm vi chi nhánh; quyền theo LỚP (giáo viên) cho MỖI LỚP một phạm vi riêng.
 * Không được đổi quyền theo lớp thành quyền cả chi nhánh: giáo viên một lớp sẽ thấy phương án và tên học viên của mọi lớp
 * cùng chi nhánh. Không có phạm vi nào → danh sách rỗng → kết quả rỗng.
 */
function effectivenessScopes(p: Principal, branchId: number | null): Array<{ branchIds?: number[] | null; classId?: number | null }> {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const out: Array<{ branchIds?: number[] | null; classId?: number | null }> = [];
  if (sc.all) {
    out.push({ branchIds: branchId ? [branchId] : null });
    return out;
  }
  if (sc.branchIds.length) {
    const ids = branchId ? sc.branchIds.filter((b: number) => b === branchId) : sc.branchIds;
    if (ids.length) out.push({ branchIds: ids });
  }
  if (sc.classIds.length) {
    for (const c of db()
      .prepare(`SELECT id, branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
      .all(...sc.classIds) as any[]) {
      if (!branchId || c.branch_id === branchId) out.push({ classId: c.id as number });
    }
  }
  return out;
}

/**
 * MỘT CHỈ SỐ → MỘT TẬP ID, đã áp quyền của người gọi — và, nếu có, CHƯƠNG TRÌNH đang chọn ở Tổng quan (P6b). Đây là hàm
 * DUY NHẤT mà cả ô số lẫn panel danh sách gọi. Bộ lọc chương trình đặt ở ĐÂY, một lần, cho mọi chỉ số: lọc cả tập đếm lẫn
 * tử số/mẫu số/tập chia, nên "9 / 38 đánh giá được" và danh sách khi bấm vẫn cùng một phạm vi.
 */
export function metricSet(
  p: Principal, id: string,
  f: {
    branchId?: number | null; skill?: string | null; from?: string | null; to?: string | null; kind?: string | null;
    program?: ChuongTrinh | null;
    /** Q19 (P14) — CHỈ Ý thức và Phối hợp SOS nhận lớp; chỉ số khác có `classId` → 400 (không âm thầm bỏ qua). */
    classId?: number | null;
  } = {},
): MetricResult {
  const r = metricSetGoc(p, id, f);
  const ct = f.program ?? 'ca-hai';
  if (ct === 'ca-hai') return r;
  const moi = [...new Set([...r.ids, ...(r.numeratorIds ?? []), ...(r.denominatorIds ?? [])])];
  const giu = new Set(locTheoChuongTrinh(r.unit, moi, ct));
  const loc = (xs?: number[]) => xs?.filter((x) => giu.has(x));
  const ids = loc(r.ids)!;
  return {
    ...r, ids, n: ids.length,
    numeratorIds: loc(r.numeratorIds), denominatorIds: loc(r.denominatorIds),
    splits: r.splits ? { tamThoi: loc(r.splits.tamThoi)!, ketQuaCuoi: loc(r.splits.ketQuaCuoi)! } : undefined,
    byKind: r.byKind ? Object.fromEntries(Object.entries(r.byKind).map(([k, v]) => [k, loc(v)!])) : undefined,
  };
}

/** Case chờ xác định nguyên nhân mà hạn 3 ngày của tín hiệu đã nối (sớm nhất) đã qua — cùng hạn `mywork.ts` dùng cho dòng `cause`. */
function causeOverdue(caseIds: number[], today: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db().prepare(
      `SELECT case_id AS id FROM case_signals WHERE status = 'linked' AND case_id IN (${chunk.map(() => '?').join(',')})
        GROUP BY case_id HAVING MIN(verify_due) < ? ORDER BY case_id`,
    ).all(...chunk, today) as any[]).map((r) => r.id as number));
  }
  return out;
}

/**
 * Lượt có ô điểm QUÁ HẠN nhập, trong phạm vi. `scoreDebtCells` chỉ lọc theo chi nhánh; ở đây áp đúng luật của `classScopeSql`:
 * giữ ô khi lớp thuộc chi nhánh được cấp HOẶC là lớp mình dạy. Người vừa dạy lớp vừa có quyền chi nhánh không được nới thành
 * cả chi nhánh của lớp mình chỉ dạy.
 */
function overdueScoreAttempts(p: Principal, branchId: number | null, today: string): number[] {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (sc.none) return [];
  const conn = db();
  let branches: number[] | null = null;
  if (branchId) branches = [branchId];
  else if (!sc.all) {
    const set = new Set<number>(sc.branchIds);
    if (sc.classIds.length) {
      for (const r of conn.prepare(`SELECT DISTINCT branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
        .all(...sc.classIds) as any[]) set.add(r.branch_id);
    }
    branches = [...set];
  }
  const cells = scoreDebtCells(p, today, branches).filter((x) => x.overdue);
  const ids = new Set<number>();
  if (sc.all) {
    for (const x of cells) ids.add(x.attemptId);
  } else {
    const branchOf = new Map<number, number>();
    const classIds = [...new Set(cells.map((x) => x.classId))];
    for (let i = 0; i < classIds.length; i += 400) {
      const chunk = classIds.slice(i, i + 400);
      for (const r of conn.prepare(`SELECT id, branch_id FROM classes WHERE id IN (${chunk.map(() => '?').join(',')})`).all(...chunk) as any[]) {
        branchOf.set(r.id as number, r.branch_id as number);
      }
    }
    const myBranches = new Set<number>(sc.branchIds), myClasses = new Set<number>(sc.classIds);
    for (const x of cells) {
      if (myClasses.has(x.classId) || myBranches.has(branchOf.get(x.classId) ?? -1)) ids.add(x.attemptId);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

/**
 * LÕI CHƯA LỌC CHƯƠNG TRÌNH của `metricSet`: một chỉ số → một tập ID đã áp quyền của người gọi. Chỉ `metricSet` gọi hàm này;
 * mọi nơi khác đi qua `metricSet` để bộ lọc chương trình chỉ có một chỗ.
 */
function metricSetGoc(
  p: Principal, id: string,
  f: { branchId?: number | null; skill?: string | null; from?: string | null; to?: string | null; kind?: string | null; classId?: number | null } = {},
): MetricResult {
  const metric = metricById(id);
  if (!metric) throw notFound(`Không tìm thấy chỉ số "${id}".`);
  if (!LISTED_METRICS.includes(id)) {
    throw new HttpError(501, `Chỉ số "${metric.ten}" đã được khai báo nhưng chưa có danh sách — chưa dùng được ở màn hình.`);
  }
  /* Q19: chỉ Ý thức và Phối hợp SOS lọc theo lớp — chỉ số khác nhận `classId` thì từ chối thẳng, không âm thầm bỏ qua. */
  if (f.classId && !isYThucMetric(id) && !isPhoiHopMetric(id)) throw badRequest('Chỉ số này chưa lọc theo lớp.');
  const today = demoToday();
  const scope = resolveScope(p, f.branchId);
  const done = (ids: number[], extra: Partial<MetricResult> = {}): MetricResult => ({
    id, metric, unit: metric.donVi, ids, n: ids.length, empty: ids.length === 0 && scope.empty,
    note: scope.empty ? EMPTY_NOTE : null, today, ...extra,
  });
  if (scope.empty) return done([]);

  /* Ý thức (PR-J): phạm vi và hàm tập ID riêng — GVBM/GVCN không có quyền xem thống kê chi nhánh nên nhận tập rỗng có nhãn. */
  if (isYThucMetric(id)) {
    const r = yThucMetric(p, id, { branchId: scope.branchId, from: f.from ?? null, to: f.to ?? null, kind: f.kind ?? null, classId: f.classId ?? null });
    if (r.none) return { ...done([]), empty: true, note: EMPTY_NOTE };
    return done(r.ids, r.byKind ? { byKind: r.byKind } : {});
  }

  /* Phối hợp SOS (PR-T): cùng phạm vi thống kê với Ý thức — chỉ Quản lý và Quản trị; GVBM/GVCN nhận tập rỗng có nhãn. Đơn vị: lượt. */
  if (isPhoiHopMetric(id)) {
    const r = phoiHopMetric(p, id, { branchId: scope.branchId, from: f.from ?? null, to: f.to ?? null, kind: f.kind ?? null, classId: f.classId ?? null });
    if (r.none) return { ...done([]), empty: true, note: EMPTY_NOTE };
    return done(r.ids, r.byKind ? { byKind: r.byKind } : {});
  }

  const branchId = scope.branchId ?? undefined;
  const openCases = () => listCases(p, { branchId }).rows.filter((c: any) => c.state !== 'done');

  switch (id) {
    case 'case-mo':
      return done(openCases().map((c: any) => c.id as number));
    case 'hv-co-case-mo': {
      /* ĐẾM DUY NHẤT học viên, chỉ từ case CHƯA kết luận (F02) — không gộp case đã đóng. */
      const students = new Set<number>();
      for (const c of openCases()) if (c.studentId) students.add(c.studentId as number);
      return done([...students].sort((a, b) => a - b));
    }
    case 'case-thieu-pa':
      /* Case CHỜ DUYỆT có `state` riêng — không quy chậm cho giáo viên (hợp đồng §2). */
      return done(openCases().filter((c: any) => c.state === 'no_plan').map((c: any) => c.id as number));
    case 'tin-hieu-cho-xac-minh':
      return done(listSignals(p, { branchId, status: 'open' }).rows.map((s) => s.id));
    case 'tin-hieu-qua-han':
      return done(overdueNormalSignalIds(p, { branchId: branchId ?? null, today }));
    case 'case-xac-dinh-nguyen-nhan-qua-han':
      return done(causeOverdue(awaitingCauseCaseIds(openCases().map((c: any) => c.id as number)), today));
    case 'bai-qua-han-nhap-diem':
      return done(overdueScoreAttempts(p, scope.branchId, today));
    case 'case-chua-co-nguoi-phu-trach':
      return done(openCases().filter((c: any) => !c.ownerUserId).map((c: any) => c.id as number));
    case 'case-cho-xac-dinh-nguyen-nhan':
      /* Case TỪ SOS (rulebook v3) đang mở mà chưa có nguyên nhân HOẶC còn phương án điền sẵn chưa xác nhận — cùng định nghĩa với `caseDetail().sos`. */
      return done(awaitingCauseCaseIds(openCases().map((c: any) => c.id as number)));
    case 'pa-can-cap-nhat':
      return done(overdueUpdatePlans(openCases().map((c: any) => c.id as number), today));
    case 'pa-cho-duyet':
      return done(pendingApprovalPlans(openCases().map((c: any) => c.id as number)));
    case 'hv-sos-hien-tai': {
      const r = hvSosHienTai(p, branchId ?? null, today);
      return done(r.ids, { splits: r.splits });
    }
    case 'hv-duoi-ky-vong-mon': {
      const skill = f.skill ? String(f.skill) : null;
      if (skill && !(SKILLS_FOR_METRIC as readonly string[]).includes(skill)) {
        throw badRequest(`Môn "${skill}" không hợp lệ — chọn một trong Listening, Reading, Writing, Speaking.`);
      }
      const r = hvDuoiKyVongMon(p, branchId ?? null, today, skill);
      return done(r.ids, { denominatorIds: r.denominatorIds });
    }
    case 'do-phu-danh-gia': {
      const r = doPhuDanhGia(p, branchId ?? null, today);
      return done(r.ids, { numeratorIds: r.numeratorIds });
    }
    case 'hv-can-ho-tro-2-lan-chua-case':
    case 'hv-bo-qua-van-can-ho-tro': {
      /* PR-UX4: một hàm `boQuen` tính cả hai, nhớ trong request — số ở Cần xử lý, danh sách Danh sách Case và bảng đều cùng tập. */
      const loai: LoaiBoQuen = id === 'hv-bo-qua-van-can-ho-tro' ? 'bo-qua-van-can-ho-tro' : 'can-ho-tro-2-lan';
      return done(boQuen(p, branchId ?? null, today)[loai].map((r) => r.studentId).sort((a, b) => a - b));
    }
    case 'dung-han-cap-nhat': {
      /* Nghĩa vụ của MỌI case học thuật trong phạm vi — kể cả case đã đóng: nghĩa vụ đã đến hạn vẫn là chuyện đã xảy ra. */
      const caseIds = listCases(p, { branchId }).rows
        .filter((c: any) => c.originKind !== 'backfill')
        .map((c: any) => c.id as number);
      const r = obligations(caseIds, today, f.from ?? null, f.to ?? null);
      return done(r.ids, { numeratorIds: r.numeratorIds });
    }
    case 'pa-co-ket-qua': {
      const ids = new Set<number>();
      for (const s of effectivenessScopes(p, scope.branchId)) {
        for (const r of planOutcomes(s)) if (r.group !== 'undetermined') ids.add(r.id);
      }
      return done([...ids]);
    }
    case 'ty-le-co-cai-thien': {
      const den = new Set<number>(), num = new Set<number>();
      for (const s of effectivenessScopes(p, scope.branchId)) {
        const r = improvementRate(s);
        r.denominatorIds.forEach((x: number) => den.add(x));
        r.numeratorIds.forEach((x: number) => num.add(x));
      }
      return done([...den], { numeratorIds: [...num] });
    }
    default:
      throw new HttpError(501, `Chỉ số "${metric.ten}" chưa có danh sách.`);
  }
}
