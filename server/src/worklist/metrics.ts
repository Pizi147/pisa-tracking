import { db, theoLo } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { t } from '../../../shared/i18n/index.ts';
/** dd/mm — hạn cụ thể trên dòng panel. */
const ngayNgan = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { ATTEMPT_KIND_SHORT, addDaysIso, khoaBai, nhanBai,chuViecChotLoTrinh, daiDienNhomBoTro, baiId, duongCase, duongDotTest, nhanLoaiXuLy, nhanTuanGhiKetQua, PERMISSIONS, VIOLATION_CATEGORY_LABEL, tachTenMoTa, metricById, tachBaiId, tenMon, tenMonNgan, tuanLich, vietMaLuot, CHU_THEM_PA, NHOM_CASE_CHUA_CHOT, type NhomCaseChuaChot, type AttemptKind, type DeadlineKind, type ChiSo, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, classScopeSql, isCoreTeacherOf, scopeFor, type Principal, type Scope } from '../permissions.ts';
import { badRequest, forbidden, HttpError, notFound } from '../util.ts';
import { ghiDuocPaMany, listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';
import { NOT_UNCONFIRMED_PRESET, sosCaseStateMany, xuLyCaseMany } from '../cases/sosState.ts';

/**
 * OV-15h1 (C23): phân rã "Case chưa chốt PA" theo `NHOM_CASE_CHUA_CHOT` — mỗi Case một nhóm, cùng `xuLyCaseMany` của tập. Case "đang làm" mà có PA chưa huỷ
 * nhưng không PA nào đang theo dõi: PA mới chờ Quản lý duyệt → "PA chờ duyệt"; còn lại PA đã xong → "PA xong · chờ đóng Case" (một câu cho cả lô).
 */
function phanRaCaseChuaChot(ids: number[], xl: ReturnType<typeof xuLyCaseMany>): Record<NhomCaseChuaChot, number[]> {
  const out = Object.fromEntries(NHOM_CASE_CHUA_CHOT.map((k) => [k, [] as number[]])) as Record<NhomCaseChuaChot, number[]>;
  for (const [id, k] of nhomCaseChuaChot(ids, xl)) out[k].push(id);
  return out;
}
/** Nhóm của từng Case chưa chốt PA (cùng luật phân rã) — Cần bạn quyết ghi nhãn dòng bằng hàm này. `xl` = `xuLyCaseMany` của chính các Case. */
export function nhomCaseChuaChot(ids: number[], xl: ReturnType<typeof xuLyCaseMany>): Map<number, NhomCaseChuaChot> {
  const coPa = ids.filter((id) => xl.get(id)?.k === 'dang-lam' && xl.get(id)!.coPa);
  const choDuyet = new Set<number>();
  theoLo(coPa, (lo, ph) => {
    for (const r of db().prepare(`SELECT DISTINCT case_id FROM case_interventions WHERE case_id IN (${ph}) AND status != 'cancelled' AND approval_state = 'pending'`).all(...lo) as any[]) choDuyet.add(r.case_id);
  });
  const out = new Map<number, NhomCaseChuaChot>();
  for (const id of ids) {
    const x = xl.get(id);
    if (!x) continue;
    out.set(id, x.k === 'cho-nhan-xet' || x.k === 'cho-nguyen-nhan' ? 'choNhanXet' : x.k === 'cho-xac-nhan-pa' ? 'choXacNhanPa'
      : x.k === 'cho-duyet-doi-pa' || choDuyet.has(id) ? 'choDuyetPa' : x.k === 'cho-duyet-khong-theo-doi' ? 'khongTheoDoi' : x.coPa ? 'paXong' : 'trongPa');
  }
  return out;
}

/** OV-12d: "Case chờ duyệt" của Tổng quan = cột "Chờ duyệt" của Tổng hợp — MỘT hàm `xuLyCaseMany`; `quaHan` = số ⚠ của cột đó. */
function choDuyetCaseIds(ids: number[], today: string, chiQuaHan = false): number[] {
  const xl = xuLyCaseMany(ids, today);
  const out = ids.filter((id) => xl.get(id)?.cot === 'choDuyet' && (!chiQuaHan || xl.get(id)!.quaHan));
  return chiQuaHan ? out.sort((a, b) => a - b) : out;   // quá hạn xếp theo id như trước
}
import { improvementRate, planOutcomes } from '../cases/effectiveness.ts';
import { doPhuDanhGia, hvDuoiKyVongMon, hvSosHienTai } from './danhGia.ts';
import { isYThucMetric, yThucMetric, YTHUC_METRIC_IDS } from '../yThuc/thongKe.ts';
import { PHOI_HOP_METRIC_IDS, isPhoiHopMetric, phoiHopMetric } from '../yThuc/phoiHop.ts';
import { locTheoChuongTrinh } from './chuongTrinh.ts';
import { scoreDebtCells } from './scoreDebt.ts';
import { boKetQuaChoMiniTest } from '../normal/cuoiKhoa.ts';
import { nguoiGiuKetQua } from '../cases/giuKetQua.ts';
import { caseChuaCoNguoi } from '../cases/owner.ts';
import { assessedSkillOf } from '../fasttrack/scoring.ts';
import { CO_MOC_KE_TIEP_SQL, XONG_MT_CUOI_SQL, missingForClasses } from '../classes/schedule.ts';
import { lopChoChotLoTrinh } from '../classes/lenhChuyen.ts';
import { lopKyVong } from '../normal/kyVong.ts';
import { listMgmtTasks } from './mgmttasks.ts';
import { mondayOf } from '../platform/week.ts';

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
  /**
   * PR-VAI-a (Q24–Q25): người giữ việc + hạn của TỪNG phần tử, đọc trong CÙNG câu sinh tập (bài: ô nợ điểm; PA: `action_due` + người thực
   * hiện). Cột "Người giữ việc", "Hạn" của Cần xử lý và `hanCu` của ô số đọc từ đây — không câu thứ hai, không luật thứ hai.
   */
  chiTiet?: Map<number, { nguoi: number[]; han: string[]; /** T18: ô Speaking Mock — người giữ việc "GV chấm chéo". */ chamCheo?: boolean }>;
  /** Hạn cũ nhất của tập (sau bộ lọc khung) — ô "PA quá hạn ghi kết quả" ghi "tuần W4 SEP" từ đây. */
  hanCu?: string | null;
  /** OV-11f (TQ-3): dòng phụ RIÊNG của chỉ số cho từng phần tử (lớp cần Chốt lộ trình: "2 em chưa chọn · hạn 20/09") — thay dòng phụ chung của đơn vị. */
  dongPhu?: Map<number, string>;
  /** Phạm vi rỗng — không có gì để đếm. KHÔNG được hiểu thành toàn hệ thống. */
  empty: boolean;
  note: string | null;
  today: string;
};

const EMPTY_NOTE = 'Không có dữ liệu trong phạm vi';

/**
 * OV-12e (P12): VIỆC CỦA MỘT DÒNG panel số liệu — bấm dòng mở rộng tại chỗ: việc ngắn (Xác nhận PA) làm ngay trong dòng, việc dài thay nội dung panel.
 * `lam` = người xem làm được (người giữ việc, QL làm thay) — chỉ để vẽ khối Cần làm hay câu tình trạng; máy chủ vẫn kiểm quyền khi lưu (403).
 */
export type ViecDong = {
  chu: string;
  loai: 'xac-nhan' | 'ghi-nhan-xet' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'nhap-diem' | 'van-hanh';
  loaiHan: DeadlineKind | null; han: string | null; lam: boolean;
  caseId?: number; paId?: number;
  /** Xác nhận PA ngay trong dòng: đúng PA cần chốt. */
  pa?: { kind: string; description: string | null; performer: string | null; performerUserId: number | null; soBuoi: number | null; mocChu: string | null };
  /** Nhập điểm: lớp · lượt (`mt:2`) · kỹ năng · em. */
  classId?: number; luot?: string; kn?: string; studentId?: number;
};

/** Một dòng của panel danh sách: đủ để người đọc nhận ra bản ghi và bấm sang đúng chỗ. */
export type MetricRow = {
  id: number; title: string; sub: string; href: string;
  /** PR-VAI-a (Q26): dòng Case/PA — người phụ trách/thực hiện và hạn (xác nhận nguyên nhân / ghi kết quả), 12 px ở panel. */
  nguoi?: string | null; han?: string | null;
  /** OV-12e: đầu dòng v3 — em (link hồ sơ) · lớp · ngữ cảnh; việc của dòng (null = không còn việc, ví dụ Case đã xong). */
  em?: { id: number; ten: string } | null; lop?: string | null; ngCanh?: string | null; nguoiId?: number | null;
  viec?: ViecDong | null;
  /** Câu tình trạng khi không có việc để làm (Chờ Quản lý duyệt · không theo dõi…). */
  tinhTrang?: string | null;
};

/** Ngữ cảnh quyền sửa một Case (cùng `sosEditCtx` ở cases.ts): lớp hiện tại của em trước, lớp của lượt sau. */
const ctxCase = (r: { lop_id: number | null; sid: number | null; topic: string | null }) =>
  ({ classId: r.lop_id ?? undefined, studentId: r.sid ?? undefined, skill: r.topic === 'tong_hop' ? undefined : r.topic ?? undefined });

/**
 * VIỆC TIẾP của các Case theo lô — CÙNG luật `chiTietCaseMo` (trạng thái v4 + `viecTiepCuaCase`), không hỏi DB từng Case. `p` có thì tính `lam`.
 * Trả theo id Case: việc (null = Case xong / huỷ) + câu trạng thái.
 */
function viecCuaCase(rows: any[], p: Principal | undefined): Map<number, { viec: ViecDong | null; tinhTrang: string | null }> {
  const gia = rows.map((r) => ({
    id: r.id, studentId: r.sid, status: r.status, detectedAt: r.detected_at, urgency: r.urgency, sosLevel: r.sos_level, kck: !!r.kck,
    originKind: r.origin_kind, classKind: 'normal', attemptNo: r.attempt_no ?? null, topic: r.topic, category: r.category, categoryLabel: null,
    topicLabel: null, title: r.title ?? '', primaryLabel: null, homeClassId: null, classId: r.lop_id, classCode: r.lop,
  })) as unknown as MappedCase[];
  const ct = chiTietCaseMo(gia);
  /* Ghi kết quả: CÙNG luật `ghiDuoc` của Ngăn Case (người giữ việc || quyền theo vai), theo lô — không tự viết luật thứ hai. */
  const ghiDuoc = p ? ghiDuocPaMany(p, rows.flatMap((r) => [...(r.pas?.entries() ?? [])].map(([id, pa]: [number, any]) => ({
    id, kind: pa.kind, performer_user_id: pa.performerUserId, case_id: r.id, nhom_bo_tro: pa.nhomBoTro,
    topic: r.topic ?? null, class_id: r.lop_id ?? null, eff_student_id: r.sid ?? null, owner_user_id: r.owner_user_id ?? null,
  })))) : new Map<number, boolean>();
  const out = new Map<number, { viec: ViecDong | null; tinhTrang: string | null }>();
  for (const r of rows) {
    const c = ct.get(r.id);
    const v = c?.viecTiep ?? null;
    const loai: ViecDong['loai'] | null = !v ? null : v.chu === 'Xác nhận Case' ? 'xac-nhan' : v.chu === 'Ghi nhận xét' ? 'ghi-nhan-xet'
      : v.chu.startsWith('Xác nhận PA') ? 'xac-nhan-pa' : v.loaiHan === 'cap-nhat-pa' ? 'ghi-ket-qua' : v.chu === CHU_THEM_PA ? 'them-pa'
        : v.chu === 'Hoàn thành Case' ? 'hoan-thanh' : null;
    if (!v || !loai) { out.set(r.id, { viec: null, tinhTrang: v?.chu ?? c?.trangThai.chu ?? null }); continue; }
    const sua = !!p && can(p, PERMISSIONS.SOS_EDIT, ctxCase(r));
    const pa = v.paId ? r.pas?.get(v.paId) : null;
    out.set(r.id, {
      tinhTrang: c!.trangThai.chu,
      viec: {
        chu: loai === 'ghi-ket-qua' ? (v.chu.startsWith('Kết quả cuối') ? t('Kết quả cuối') : t('Kết quả PA')) : loai === 'xac-nhan-pa' ? t('Xác nhận PA') : v.chu,
        loai, loaiHan: v.loaiHan, han: v.han, caseId: r.id, paId: v.paId,
        /* Cùng cờ máy chủ: Ghi kết quả = `ghiDuoc`; Xác nhận PA = SOS_EDIT; Xác nhận Case Progress = SOS_EDIT hoặc GVCN lớp em đang học (`coTheXacNhanCase`). */
        lam: loai === 'ghi-ket-qua' ? !!v.paId && !!ghiDuoc.get(v.paId)
          : sua || (!!p && loai === 'xac-nhan' && !!r.lop_id && isCoreTeacherOf(p, r.lop_id)),
        ...(loai === 'xac-nhan-pa' && pa ? { pa: { ...pa, mocChu: c!.pas.find((x) => x.id === v.paId)?.mocChu ?? null } } : {}),
      },
    });
  }
  return out;
}

/**
 * DỰNG DÒNG CHO MỘT TẬP ID — chỉ "tô màu" tập đã có (tên, lớp, đường dẫn), KHÔNG lọc thêm gì.
 * Tập ID đã qua quyền ở `metricSet`; hàm này không nhận phạm vi nên không thể mở rộng hay thu hẹp nó.
 */
export function rowsFor(unit: ChiSo['donVi'], ids: number[], metricId?: string, p?: Principal): MetricRow[] {
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
        byId.set(r.id, { id: r.id, title: r.full_name, sub: [r.class_code].filter(Boolean).join(' · '), href: `/hoc-vien/${r.id}` });
      }
    } else if (unit === 'case') {
      const ds = conn.prepare(
        `SELECT sc.id, sc.title, COALESCE(sc.category, sc.topic) AS mon, sc.category, sc.topic, cy.programme_code AS ct, s.id AS sid, s.full_name, s.student_code,
                sc.status, sc.detected_at, sc.urgency, sc.sos_level, sc.kck, sc.origin_kind, a.attempt_no, u.full_name AS nguoi, sc.owner_user_id,
                COALESCE(cur.class_id, a.class_id) AS lop_id, lc.code AS lop
           FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
           LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
           LEFT JOIN users u ON u.id = sc.owner_user_id
           LEFT JOIN enrollments cur ON cur.id = (SELECT e.id FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1)
           LEFT JOIN classes lc ON lc.id = COALESCE(cur.class_id, a.class_id)
          WHERE sc.id IN (${ph})`,
      ).all(...chunk) as any[];
      /* PA cần chốt (Xác nhận PA ngay trong dòng) + người dạy PA — một câu cho cả lô. */
      const paTheoCase = new Map<number, Map<number, any>>();
      for (const iv of conn.prepare(
        `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.so_buoi, iv.performer_user_id, iv.nhom_bo_tro, COALESCE(pu.full_name, NULLIF(iv.performer_name, '')) AS performer
           FROM case_interventions iv LEFT JOIN users pu ON pu.id = iv.performer_user_id WHERE iv.case_id IN (${ph}) AND iv.status != 'cancelled'`,
      ).all(...chunk) as any[]) {
        if (!paTheoCase.has(iv.case_id)) paTheoCase.set(iv.case_id, new Map());
        paTheoCase.get(iv.case_id)!.set(iv.id, { kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
          performerUserId: iv.performer_user_id ?? null, soBuoi: iv.so_buoi ?? null, nhomBoTro: iv.nhom_bo_tro ?? null });
      }
      const viec = viecCuaCase(ds.filter((r) => r.sid != null).map((r) => ({ ...r, pas: paTheoCase.get(r.id) })), p);
      for (const r of ds) {
        /* MH2: tên môn theo chương trình của lộ trình (FOU "G+V"), không chữ thô "listening". K1-06 (Q26): mở hồ sơ HV ở Ngăn Case. */
        const v = viec.get(r.id);
        const ten = r.title ?? (r.mon ? tenMon(r.ct ?? null, r.mon) : `Case ${r.id}`);
        byId.set(r.id, {
          id: r.id, title: ten, sub: [r.full_name].filter(Boolean).join(' · '),
          /* OV-12e (đặc tả mục 1, nghi lỗi): hạn = hạn của VIỆC TIẾP — Case xong / không còn việc thì không còn hạn (trước: luôn `han_xac_nhan`). */
          href: duongCase(r.sid, r.id), nguoi: r.nguoi ?? null, han: v?.viec?.han ?? null, nguoiId: r.owner_user_id ?? null,
          em: r.sid ? { id: r.sid, ten: r.full_name } : null, lop: r.lop ?? null, ngCanh: ten,
          viec: v?.viec ?? null, tinhTrang: v?.tinhTrang ?? null,
        });
      }
    } else if (unit === 'phuong-an') {
      const ds = conn.prepare(
        `SELECT iv.id, iv.case_id, COALESCE(NULLIF(iv.description, ''), iv.kind) AS title, s.id AS sid, s.full_name, s.student_code, iv.action_due,
                iv.status AS pa_status, iv.approval_state, iv.performer_user_id, iv.kind, iv.nhom_bo_tro, sc.owner_user_id,
                COALESCE(pu.full_name, NULLIF(iv.performer_name, ''), ou.full_name) AS nguoi, COALESCE(iv.performer_user_id, sc.owner_user_id) AS nguoi_id,
                sc.title AS case_title, sc.status, sc.detected_at, sc.urgency, sc.sos_level, sc.kck, sc.origin_kind, sc.topic, sc.category, a.attempt_no,
                COALESCE(cur.class_id, a.class_id) AS lop_id, lc.code AS lop
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           LEFT JOIN students s ON s.id = sc.student_id
           LEFT JOIN users pu ON pu.id = iv.performer_user_id
           LEFT JOIN users ou ON ou.id = sc.owner_user_id
           LEFT JOIN enrollments cur ON cur.id = (SELECT e.id FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1)
           LEFT JOIN classes lc ON lc.id = COALESCE(cur.class_id, a.class_id)
          WHERE iv.id IN (${ph})`,
      ).all(...chunk) as any[];
      /* Việc của PA = việc tiếp của Case khi nó trỏ đúng PA này (Xác nhận PA · Ghi kết quả); PA khác đang chạy có hạn → Ghi kết quả của chính PA. */
      const caseRows = [...new Map(ds.filter((r) => r.sid != null).map((r) => [r.case_id, { ...r, id: r.case_id, title: r.case_title }])).values()];
      const paTheoCase = new Map<number, Map<number, any>>();
      if (caseRows.length) {
        const phc = caseRows.map(() => '?').join(',');
        for (const iv of conn.prepare(
          `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.so_buoi, iv.performer_user_id, iv.nhom_bo_tro, COALESCE(pu.full_name, NULLIF(iv.performer_name, '')) AS performer
             FROM case_interventions iv LEFT JOIN users pu ON pu.id = iv.performer_user_id WHERE iv.case_id IN (${phc}) AND iv.status != 'cancelled'`,
        ).all(...caseRows.map((r) => r.id)) as any[]) {
          if (!paTheoCase.has(iv.case_id)) paTheoCase.set(iv.case_id, new Map());
          paTheoCase.get(iv.case_id)!.set(iv.id, { kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
            performerUserId: iv.performer_user_id ?? null, soBuoi: iv.so_buoi ?? null, nhomBoTro: iv.nhom_bo_tro ?? null });
        }
      }
      const vc = viecCuaCase(caseRows.map((r) => ({ ...r, pas: paTheoCase.get(r.id) })), p);
      const ghiDuoc = p ? ghiDuocPaMany(p, ds.filter((r) => r.sid != null).map((r) => ({
        id: r.id, kind: r.kind, performer_user_id: r.performer_user_id ?? null, case_id: r.case_id, nhom_bo_tro: r.nhom_bo_tro ?? null,
        topic: r.topic ?? null, class_id: r.lop_id ?? null, eff_student_id: r.sid, owner_user_id: r.owner_user_id ?? null,
      }))) : new Map<number, boolean>();
      for (const r of ds) {
        const cv = vc.get(r.case_id);
        const chay = r.pa_status !== 'completed' && r.pa_status !== 'cancelled' && r.approval_state !== 'pending';
        const viec: ViecDong | null = cv?.viec && cv.viec.paId === r.id ? cv.viec
          : chay && r.action_due && r.sid ? {
            chu: t('Kết quả PA'), loai: 'ghi-ket-qua', loaiHan: 'cap-nhat-pa', han: r.action_due, caseId: r.case_id, paId: r.id,
            lam: !!ghiDuoc.get(r.id),   // cùng `ghiDuoc` của Ngăn Case
          } : null;
        byId.set(r.id, {
          id: r.id, title: r.title, sub: [r.full_name].filter(Boolean).join(' · '),
          href: duongCase(r.sid, r.case_id), nguoi: r.nguoi ?? null, han: viec?.han ?? r.action_due ?? null, nguoiId: r.nguoi_id ?? null,
          em: r.sid ? { id: r.sid, ten: r.full_name } : null, lop: r.lop ?? null, ngCanh: r.title,
          viec, tinhTrang: viec ? null : r.approval_state === 'pending' ? t('Chờ Quản lý duyệt') : r.pa_status === 'completed' ? t('PA đã kết thúc') : cv?.tinhTrang ?? null,
        });
      }
    } else if (unit === 'bai') {
      /* PR-UXF-a Q7: một dòng = một BÀI (ô điểm). "MT2 · Tên em · R"; dòng phụ ghi TUẦN THI CỦA MÔN (`W2 SEP`), không tuần của lượt. */
      const tach = chunk.map((id) => ({ id, ...tachBaiId(id) }));
      const at = [...new Set(tach.map((x) => x.attemptId))];
      const pa = at.map(() => '?').join(',');
      const luot = new Map((conn.prepare(
        `SELECT a.id, a.kind, a.attempt_no, a.class_id, a.student_id, c.programme_code, c.code AS class_code, s.full_name, s.student_code, pr.week_start
           FROM assessment_attempts a JOIN students s ON s.id = a.student_id
           LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.id IN (${pa})`,
      ).all(...at) as any[]).map((r) => [r.id as number, r]));
      const tuanMon = new Map((conn.prepare(
        `SELECT k.attempt_id, k.skill, rp.week_start FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id IN (${pa})`,
      ).all(...at) as any[]).map((r) => [`${r.attempt_id}|${r.skill}`, r.week_start as string]));
      const homNay = demoToday();
      for (const x of tach) {
        const r = luot.get(x.attemptId);
        if (!r) continue;
        const tuan = tuanMon.get(`${x.attemptId}|${x.skill}`) ?? tuanMon.get(`${x.attemptId}|${assessedSkillOf(x.skill)}`) ?? r.week_start ?? null;
        const ten = r.kind === 'mock' ? `MT${r.attempt_no}` : ATTEMPT_KIND_SHORT[r.kind as AttemptKind] ?? r.kind;
        byId.set(x.id, {
          id: x.id, title: `${ten} · ${r.full_name} · ${tenMonNgan(r.programme_code ?? null, x.skill)}`,
          sub: [r.class_code, tuan ? tuanLich(tuan, homNay) : null].filter(Boolean).join(' · '),
          href: duongDotTest({ id: r.id, kind: r.kind, classId: r.class_id }, x.skill),   // PR-UXF-b: có kỹ năng → hồ sơ Mock cuộn tới đúng ô (lớp thường bỏ kn)
          em: { id: r.student_id, ten: r.full_name }, lop: r.class_code ?? null, ngCanh: `${ten} · ${tenMonNgan(r.programme_code ?? null, x.skill)}`,
          /* OV-12e: Nhập điểm tại chỗ — cùng bảng một lớp · một lượt · một kỹ năng của Công việc (`PanelNhapDiem`). */
          viec: r.class_id ? {
            chu: t('Nhập điểm'), loai: 'nhap-diem', loaiHan: 'nhap-diem', han: null, classId: r.class_id, kn: x.skill, studentId: r.student_id,
            luot: vietMaLuot(r.kind === 'mock' ? { loai: 'mt', so: r.attempt_no } : r.kind === 'checkpoint' ? { loai: 'cp', so: r.attempt_no }
              : { loai: 'thuong', kind: r.kind }),
            lam: !!p && can(p, PERMISSIONS.SCORE_EDIT, { classId: r.class_id, skill: x.skill }),
          } : null,
        });
      }
    } else if (unit === 'dot-test' || unit === 'bai-thi') {
      /* Lượt Test: FT mở hồ sơ Test; bài của lớp thường mở bảng điểm thường của lớp. */
      for (const r of conn.prepare(
        `SELECT a.id, a.kind, a.attempt_no, a.class_id, s.full_name, s.student_code, c.code AS class_code, pr.code AS period_code
           FROM assessment_attempts a JOIN students s ON s.id = a.student_id
           LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const name = r.kind === 'mock' ? `MT${r.attempt_no}` : r.kind === 'checkpoint' ? nhanBai(khoaBai(r.kind, r.attempt_no))   // OV-11h: "Checkpoint 1"
          : r.kind === 'final' ? 'Bài Final Test' : 'Bài Progress Test';
        byId.set(r.id, {
          id: r.id, title: `${name} · ${r.full_name}`,
          sub: [r.class_code, r.period_code].filter(Boolean).join(' · '),
          href: duongDotTest({ id: r.id, kind: r.kind, classId: r.class_id }),
        });
      }
    } else if (unit === 'nghia-vu') {
      /* Mã nghĩa vụ = id phương án × 1000 + chu kỳ; dòng nói rõ phương án nào, chu kỳ nào, của em nào. */
      const ivIds = [...new Set(chunk.map((id) => parseObligation(id).interventionId))];
      const phi = ivIds.map(() => '?').join(',');
      const byIv = new Map<number, any>();
      for (const r of conn.prepare(
        `SELECT iv.id, iv.case_id, COALESCE(NULLIF(iv.description, ''), iv.kind) AS title, s.id AS sid, s.full_name, s.student_code
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN students s ON s.id = sc.student_id WHERE iv.id IN (${phi})`,
      ).all(...ivIds) as any[]) byIv.set(r.id, r);
      for (const id of chunk) {
        const { interventionId, cycle, k } = parseObligation(id);
        const r = byIv.get(interventionId);
        if (!r) continue;
        byId.set(id, {
          id, title: `${r.title} · đợt ${cycle}${k ? ` · tuần ghi bù thứ ${k + 1}` : ''}`,
          sub: [r.full_name].filter(Boolean).join(' · '), href: duongCase(r.sid, r.case_id),
        });
      }
    } else if (unit === 'vi-pham') {
      /* Ý thức (PR-J): dòng vi phạm mở hồ sơ học viên — tab Ý thức là việc của PR-K. */
      for (const r of conn.prepare(
        `SELECT v.id, v.student_id, v.category, v.skill, v.occurred_on, v.ten, v.description, s.full_name, s.student_code
           FROM violations v JOIN students s ON s.id = v.student_id WHERE v.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const cat = VIOLATION_CATEGORY_LABEL[r.category as keyof typeof VIOLATION_CATEGORY_LABEL] ?? r.category;
        byId.set(r.id, {
          id: r.id, title: `${cat} · ${String(r.occurred_on).slice(8, 10)}/${String(r.occurred_on).slice(5, 7)}`,
          sub: [r.full_name, tachTenMoTa(r.ten, r.description, r.category).ten].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}`,
        });
      }
    } else if (unit === 'bien-phap') {
      for (const r of conn.prepare(
        `SELECT m.id, m.student_id, m.kind, m.custom_name, m.status, m.performed_on, s.full_name, s.student_code
           FROM discipline_measures m JOIN students s ON s.id = m.student_id WHERE m.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        const name = nhanLoaiXuLy(r.kind, r.custom_name);
        /* PR-S3F #12: nói đúng trạng thái thật — không còn "đang chuẩn bị" chung cho cả đề xuất chờ duyệt lẫn đã duyệt. */
        const state = r.status === 'done' ? `đã thực hiện ${String(r.performed_on ?? '').slice(8, 10)}/${String(r.performed_on ?? '').slice(5, 7)}`
          : r.status === 'cho_duyet' ? 'Chờ Quản lý duyệt' : r.status === 'da_duyet' ? 'Đã duyệt · chờ thực hiện' : 'nháp';
        byId.set(r.id, { id: r.id, title: name, sub: [r.full_name, state].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
      }
    } else if (unit === 'viec-van-hanh') {
      /* PR-VAI-a: việc Vận hành cần quyết định — dòng mở đúng việc (ngăn Vận hành ở Công việc). */
      for (const r of conn.prepare(
        `SELECT t.id, t.title, t.due_date, b.name AS branch_name FROM tasks t LEFT JOIN branches b ON b.id = t.branch_id WHERE t.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, {
          id: r.id, title: r.title, sub: [r.branch_name ?? 'Toàn hệ thống', r.due_date ? `hạn ${String(r.due_date).slice(8, 10)}/${String(r.due_date).slice(5, 7)}` : null].filter(Boolean).join(' · '), href: `/cong-viec?mo-viec=${r.id}`,
          /* OV-12e: việc Vận hành mở đúng ngăn Vận hành tại chỗ (chỉ số này chỉ Quản lý thấy; máy chủ kiểm lại khi lưu). */
          viec: { chu: t('Xử lý'), loai: 'van-hanh', loaiHan: 'viec-van-hanh', han: r.due_date ?? null, lam: !!p },
        });
      }
    } else if (unit === 'lop') {
      /* PR-VAI-a: dòng lớp thiếu GV môn mở hồ sơ lớp với panel Sửa phân công mở sẵn. */
      const thieu = missingForClasses(chunk);
      for (const r of conn.prepare(`SELECT id, code, programme_code AS ct FROM classes WHERE id IN (${ph})`).all(...chunk) as any[]) {
        const mon = (thieu.get(r.id)?.missingSkills ?? []).map((k) => tenMonNgan(r.ct ?? null, k)).join(', ');
        /* OV-11f (TQ-3): lớp cần Chốt lộ trình mở Lộ trình tiếp theo cả lớp (cùng việc "Chốt lộ trình · lớp" ở Công việc), không Sửa phân công. */
        byId.set(r.id, metricId === 'lop-chua-chot-len-ft'
          ? { id: r.id, title: r.code, sub: '', href: `/hoc-vien/lop/${r.id}?viec=lo-trinh-ca-lop` }
          : { id: r.id, title: r.code, sub: mon ? `thiếu ${mon}` : '', href: `/hoc-vien/lop/${r.id}?viec=phan-cong` });
      }
    } else if (unit === 'luot-sos') {
      /* Phối hợp SOS (PR-T): dòng lượt Mock có SOS mở hồ sơ học viên — sub-tab `Phối hợp SOS` là việc của PR-K. */
      for (const r of conn.prepare(
        `SELECT a.id, a.attempt_no, a.student_id, s.full_name, s.student_code, c.code AS class_code
           FROM assessment_attempts a JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id
          WHERE a.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: `MT${r.attempt_no} · ${r.full_name}`, sub: [r.class_code].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
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
export function metricResponse(r: MetricResult, withRows: boolean, p?: Principal) {
  const lean = {
    id: r.id, unit: r.unit, n: r.n,
    numerator: r.numeratorIds ? r.numeratorIds.length : null,
    denominator: r.denominatorIds ? r.denominatorIds.length : null,
    splits: r.splits ? { tamThoi: r.splits.tamThoi.length, ketQuaCuoi: r.splits.ketQuaCuoi.length } : null,
    byKind: r.byKind ? Object.fromEntries(Object.entries(r.byKind).map(([k, v]) => [k, v.length])) : null,
    ...(r.hanCu !== undefined ? { hanCu: r.hanCu } : {}),
    empty: r.empty, note: r.note, today: r.today,
  };
  if (!withRows) return lean;
  return {
    ...lean, ids: r.ids, numeratorIds: r.numeratorIds, denominatorIds: r.denominatorIds, splitIds: r.splits, byKindIds: r.byKind,
    rows: rowsFor(r.unit, r.ids, r.id, p).map((x) => (r.dongPhu?.has(x.id) ? { ...x, sub: r.dongPhu.get(x.id)! } : x)),
  };
}

/** Các chỉ số ĐÃ CÓ hàm tập ID. Chỉ số khác trong sổ chưa dùng được. */
export const LISTED_METRICS: readonly string[] = [
  'hv-sos-hien-tai', 'hv-duoi-ky-vong-mon', 'hv-co-case-mo', 'case-mo',
  'case-xac-dinh-nguyen-nhan-qua-han', 'bai-qua-han-nhap-diem', 'bai-qua-han-chua-phan-cong', 'case-chua-co-nguoi-phu-trach',
  'case-cho-xac-dinh-nguyen-nhan', 'case-thieu-pa', 'pa-can-cap-nhat', 'pa-cho-duyet', 'pa-co-ket-qua', 'ty-le-co-cai-thien',
  'dung-han-cap-nhat', 'do-phu-danh-gia', 'lop-thieu-gv-mon',
  'van-hanh-can-quyet-dinh', 'hv-ft-xong-mt-cuoi-chua-mt-ke', 'hv-len-ft-chua-ky-vong', 'lop-chua-chot-len-ft',
  ...YTHUC_METRIC_IDS,
  ...PHOI_HOP_METRIC_IDS,
];

/** Chỉ số không theo kỹ năng / khung (Q2): `metricSet` không lọc `program` cho chúng. */
export const CHI_SO_GOP = new Set<string>([...YTHUC_METRIC_IDS, ...PHOI_HOP_METRIC_IDS]);

/** Kỹ năng ĐÁNH GIÁ mà `hv-duoi-ky-vong-mon` nhận — chỉ số của khung Fast Track (MH5), không có môn lớp thường. */
const SKILLS_FOR_METRIC = ['listening', 'reading', 'writing', 'speaking'] as const;
/** PR-VAI-a (Q11): chương trình lớp thường nhận ở `ctLop`. */
export const CT_LOP = ['FOU', 'BE', 'ELE', 'PREFOU'] as const;

/**
 * NGHĨA VỤ CẬP NHẬT = MỘT PHƯƠNG ÁN × MỘT CHU KỲ. Mã số của nó là `id phương án × 1000 + số chu kỳ` (chu kỳ
 * không bao giờ tới 1000) để đi qua cùng đường `ids: number[]` như mọi chỉ số khác.
 */
/**
 * PR-UXF-a Q13 (U7/K3-17): một nghĩa vụ = (PA, đợt, tuần thứ k của khoảng ghi bù). Ghi bù N tuần = N nghĩa vụ trễ.
 * ponytail: ≤ 999 đợt mỗi PA và ≤ 999 tuần mỗi đợt (hệ số 1e3); vượt thì đổi hệ số.
 */
export const obligationId = (interventionId: number, cycle: number, k = 0) => interventionId * 1_000_000 + cycle * 1000 + k;
export const parseObligation = (id: number) => ({ interventionId: Math.floor(id / 1_000_000), cycle: Math.floor(id / 1000) % 1000, k: id % 1000 });

/**
 * NGHĨA VỤ CẬP NHẬT ĐÃ QUA HẠN của một tập Case (`dung-han-cap-nhat`).
 *
 *   ĐÃ CẬP NHẬT  — mỗi chu kỳ có ít nhất một dòng theo dõi (`case_followups`) mang hạn của chính chu kỳ đó.
 *                  Đúng hạn nếu có ít nhất một dòng không trễ. Bấm ghi chú thêm lần nữa KHÔNG sinh nghĩa vụ mới.
 *   CHƯA LÀM     — phương án đang chạy, không chờ duyệt, hạn cập nhật của chu kỳ hiện tại đã qua mà chưa có dòng
 *                  theo dõi nào cho chu kỳ đó.
 * "Đã qua hạn" là hạn < ngày dữ liệu — cùng luật với `pa-can-cap-nhat`. Không tính phương án chờ duyệt (chưa được
 * chạy nên chưa có nghĩa vụ) và không tính Case nhập bù (không có hạn cập nhật). Ý thức không còn Case (21/09/2026).
 */
/**
 * Các kỳ (k = 0…N−1, OV-12a: kỳ hai tuần) của khoảng ghi bù, N = `nhanTuanGhiKetQua(hạn, den).soKy` — cùng hàm với tiêu đề "ghi bù N kỳ" ở form ghi kết quả.
 * PR-S6F-b (Q21): kỳ k có hạn CHƯA qua lúc ghi (`due + 14k >= den`, ví dụ ghi đúng Thứ Ba hạn của kỳ cuối) là ĐÚNG hạn — không bỏ khỏi mẫu số.
 */
function tuanGhiBu(due: string, den: string): { k: number; dung: boolean }[] {
  return Array.from({ length: nhanTuanGhiKetQua(due, den).soKy }, (_, k) => ({ k, dung: addDaysIso(due, 14 * k) >= den }));
}

function obligations(caseIds: number[], today: string, from: string | null, to: string | null) {
  const inPeriod = (due: string) => (!from || due >= from) && (!to || due <= to);
  const den = new Map<number, boolean>();           // id nghĩa vụ → hoàn thành đúng hạn
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    const ph = chunk.map(() => '?').join(',');
    for (const r of db()
      .prepare(
        `SELECT f.intervention_id AS iv, f.cycle_no AS cycle, MIN(f.cycle_due) AS due, MIN(f.late) AS late, MIN(f.observed_on) AS ghi
           FROM case_followups f
          WHERE f.case_id IN (${ph}) AND f.intervention_id IS NOT NULL AND f.cycle_no IS NOT NULL AND f.cycle_due IS NOT NULL
          GROUP BY f.intervention_id, f.cycle_no`,
      )
      .all(...chunk) as any[]) {
      if (r.due >= today) continue;
      /* Đúng hạn: một nghĩa vụ đúng. Trễ: mỗi kỳ ghi bù là một nghĩa vụ trễ. */
      const ks = r.late === 0 ? [{ k: 0, dung: true }] : tuanGhiBu(r.due, r.ghi ?? today);
      for (const { k, dung } of ks) if (inPeriod(addDaysIso(r.due, 14 * k))) den.set(obligationId(r.iv, r.cycle, k), dung);
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
      /* Chưa ghi: mỗi kỳ đã bỏ quên là một nghĩa vụ trễ (PA bỏ quên nhiều kỳ không còn chỉ tính 1). */
      /* Tuần chưa tới hạn (`dung`) chưa phải nghĩa vụ — chưa ghi thì chỉ tuần đã qua hạn mới tính. */
      for (const { k } of tuanGhiBu(r.due, today).filter((x) => !x.dung)) if (inPeriod(addDaysIso(r.due, 14 * k))) den.set(obligationId(r.id, r.cycle, k), false);
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
function overdueUpdatePlans(caseIds: number[], today: string): { ids: number[]; chiTiet: NonNullable<MetricResult['chiTiet']> } {
  const rows: any[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    /*
     * PR-VAI-a (Q24–Q25): hạn trong CÙNG câu; người giữ việc = `nguoiGiuKetQua` (PR-PA, lớp hiện tại trước). PR-Dọn: CÙNG tập với việc
     * "Ghi kết quả PA" ở Công việc — em đang học (Tạm dừng dừng hạn, K3-41). PR-SO (D2): PA bổ trợ chung chọn đại diện nhóm
     * bằng `daiDienNhomBoTro` SAU khi gom mọi lô (nhóm có thể trải hai lô) — cùng hàm với Công việc.
     */
    rows.push(...db()
      .prepare(
        `SELECT iv.id, iv.kind, iv.nhom_bo_tro, iv.action_due, iv.followup_due, sc.topic, sc.owner_user_id,
                COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), a.class_id) AS class_id
           FROM case_interventions iv
           JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
          WHERE iv.case_id IN (${chunk.map(() => '?').join(',')})
            AND iv.status IN ${RUNNING}
            AND COALESCE(iv.approval_state, '') != 'pending'
            AND ${NOT_UNCONFIRMED_PRESET('iv')}
            AND iv.action_due IS NOT NULL AND iv.action_due < ?`,
      )
      .all(...chunk, today) as any[]);
  }
  /* PR-PA (§8): người giữ việc — cùng hàm với Công việc (2b) và quyền ghi Kết quả. */
  const daiDien = daiDienNhomBoTro(rows, boKetQuaChoMiniTest(rows, today)).sort((a, b) => a.id - b.id);   // OV-11c (CV-4): cùng tập với Công việc
  const giu = nguoiGiuKetQua(daiDien.map((r) => ({ id: r.id, topic: r.topic ?? null, nhomBoTro: r.nhom_bo_tro ?? null, classId: r.class_id ?? null, ownerUserId: r.owner_user_id ?? null })), today);
  const ids: number[] = [];
  const chiTiet: NonNullable<MetricResult['chiTiet']> = new Map();
  for (const r of daiDien) {
    ids.push(r.id);
    const nguoi = giu.get(r.id) ?? null;
    chiTiet.set(r.id, { nguoi: nguoi ? [nguoi] : [], han: [r.action_due] });
  }
  return { ids, chiTiet };
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
    /** PR-VAI-a (Q11): CHỈ `hv-duoi-ky-vong-mon` — chương trình lớp đang học (FOU · BE · ELE · PREFOU); mã lạ → 400. */
    ctLop?: string | null;
  } = {},
): MetricResult {
  /* OV-15h1: nhớ trong request — Tổng quan QL đọc cùng chỉ số ở Cần bạn quyết, Lớp cần chú ý, Trễ chấm trong MỘT lần gọi (không tính lại). */
  /* SL2: `pa-co-ket-qua` gán khung theo nơi em học LÚC làm PA (F03, cùng `paCoKetQua` của Hiệu quả PA) — khung đi vào tính, không lọc sau. */
  const khungLucLam = id === 'pa-co-ket-qua';
  const { program: _ct, ...goc0 } = f;
  const goc = khungLucLam ? { ...goc0, program: f.program ?? null } : goc0;
  const r = locKhung(id, nho(`chi-so:${p.userId}:${id}:${JSON.stringify(goc)}`, () => metricSetGoc(p, id, goc)), khungLucLam ? null : f.program ?? null);
  /* Q25: hạn cũ nhất tính SAU bộ lọc khung — "tuần W4 SEP" của ô Fast Track chỉ từ PA Fast Track. */
  return r.chiTiet ? { ...r, hanCu: r.ids.flatMap((x) => r.chiTiet!.get(x)?.han ?? []).sort()[0] ?? null } : r;
}

function locKhung(id: string, r: MetricResult, program: ChuongTrinh | null): MetricResult {
  /* PR-Pb2-a (Q2, K1-18): Ý thức + Phối hợp SOS là khối GỘP — bỏ qua khung ở đúng một chỗ này. */
  const ct = CHI_SO_GOP.has(id) ? null : program;
  if (!ct) return r;
  const moi = [...new Set([...r.ids, ...(r.numeratorIds ?? []), ...(r.denominatorIds ?? [])])];
  const giu = new Set(locTheoChuongTrinh(r.unit, moi, ct));
  const loc = (xs?: number[]) => xs?.filter((x) => giu.has(x));
  const ids = loc(r.ids)!;
  return {
    ...r, ids, n: ids.length,
    /* SL2 (a7 dòng 5): chi tiết (người giữ việc, hạn) cũng theo khung — dải "n GV" không đếm người của khung kia. */
    chiTiet: r.chiTiet && new Map([...r.chiTiet].filter(([k]) => giu.has(k))),
    numeratorIds: loc(r.numeratorIds), denominatorIds: loc(r.denominatorIds),
    splits: r.splits ? { tamThoi: loc(r.splits.tamThoi)!, ketQuaCuoi: loc(r.splits.ketQuaCuoi)! } : undefined,
    byKind: r.byKind ? Object.fromEntries(Object.entries(r.byKind).map(([k, v]) => [k, loc(v)!])) : undefined,
  };
}

/**
 * BÀI (ô điểm — PR-UXF-a Q7) QUÁ HẠN nhập, trong phạm vi; id = `baiId`. `scoreDebtCells` chỉ lọc theo chi nhánh; ở đây áp đúng luật của `classScopeSql`:
 * giữ ô khi lớp thuộc chi nhánh được cấp HOẶC là lớp mình dạy. Người vừa dạy lớp vừa có quyền chi nhánh không được nới thành
 * cả chi nhánh của lớp mình chỉ dạy.
 */
export function overdueScoreBai(p: Principal, branchId: number | null, today: string): {
  ids: number[]; chiTiet: NonNullable<MetricResult['chiTiet']>;
  /** UX-2 (1): lớp của từng bài — Lịch Test "Quá hạn chấm" lọc theo lớp đang xem trên CHÍNH tập này. */
  lopCua: Map<number, number>;
} {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const chiTiet: NonNullable<MetricResult['chiTiet']> = new Map();
  const lopCua = new Map<number, number>();
  if (sc.none) return { ids: [], chiTiet, lopCua };
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
  /* PR-VAI-a (Q24): người phụ trách và hạn của từng ô đã giữ — cột "Người giữ việc", "Hạn" của Cần xử lý. */
  /* PR-UXF-a Q7: khoá theo BÀI (`baiId`) — mỗi bài một người (môn chưa phân công: không có người, Q8) và một hạn. */
  const them = (x: (typeof cells)[number]) => {
    const id = baiId(x.attemptId, x.skill);
    ids.add(id);
    lopCua.set(id, x.classId);
    const c = chiTiet.get(id) ?? chiTiet.set(id, { nguoi: [], han: [] }).get(id)!;
    if (x.userId !== null && !c.nguoi.includes(x.userId)) c.nguoi.push(x.userId);
    if (x.chamCheo) c.chamCheo = true;
    if (x.han) c.han.push(x.han);
  };
  if (sc.all) {
    for (const x of cells) them(x);
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
      if (myClasses.has(x.classId) || myBranches.has(branchOf.get(x.classId) ?? -1)) them(x);
    }
  }
  return { ids: [...ids].sort((a, b) => a - b), chiTiet, lopCua };
}

/**
 * LỚP THIẾU GV MÔN (PR-VAI-a, K1-05): lớp đang mở trong phạm vi phân công, có môn chưa ai dạy — gọi đúng `missingForClasses`, hàm của badge
 * "Thiếu GV" ở Học viên & Lớp (Pre FOU không chia môn nên tự không tính). Môn thiếu cho dòng phụ / panel do `rowsFor('lop')` đọc lại.
 */
export function lopThieuGvMon(sc: Scope, branchId: number | null): number[] {
  const cs = classScopeSql(sc);
  const lop = (db().prepare(
    `SELECT c.id FROM classes c WHERE ${cs.sql} AND c.status = 'active'${branchId ? ' AND c.branch_id = ?' : ''} ORDER BY c.id`,
  ).all(...cs.params, ...(branchId ? [branchId] : [])) as any[]).map((c) => c.id as number);
  const thieu = missingForClasses(lop);
  return lop.filter((id) => (thieu.get(id)?.missingSkills.length ?? 0) > 0);
}

/**
 * LÕI CHƯA LỌC CHƯƠNG TRÌNH của `metricSet`: một chỉ số → một tập ID đã áp quyền của người gọi. Chỉ `metricSet` gọi hàm này;
 * mọi nơi khác đi qua `metricSet` để bộ lọc chương trình chỉ có một chỗ.
 */
function metricSetGoc(
  p: Principal, id: string,
  f: { branchId?: number | null; skill?: string | null; from?: string | null; to?: string | null; kind?: string | null; classId?: number | null; ctLop?: string | null;
    /** Chỉ `pa-co-ket-qua` (SL2) — các chỉ số khác lọc khung sau ở `locKhung`. */ program?: ChuongTrinh | null } = {},
): MetricResult {
  const metric = metricById(id);
  if (!metric) throw notFound(`Không tìm thấy chỉ số "${id}".`);
  if (!LISTED_METRICS.includes(id)) {
    throw new HttpError(501, `Chỉ số "${metric.ten}" đã được khai báo nhưng chưa có danh sách — chưa dùng được ở màn hình.`);
  }
  /* Q19: chỉ Ý thức và Phối hợp SOS lọc theo lớp — chỉ số khác nhận `classId` thì từ chối thẳng, không âm thầm bỏ qua. */
  if (f.classId && !isYThucMetric(id) && !isPhoiHopMetric(id)) throw badRequest('Chỉ số này chưa lọc theo lớp.');
  if (f.ctLop && (id !== 'hv-duoi-ky-vong-mon' || !(CT_LOP as readonly string[]).includes(f.ctLop))) {
    throw badRequest(`Chương trình "${f.ctLop}" không hợp lệ cho chỉ số này.`);
  }
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
    return done(r.ids, { ...(r.byKind ? { byKind: r.byKind } : {}), ...(r.chiTiet ? { chiTiet: r.chiTiet } : {}) });
  }

  const branchId = scope.branchId ?? undefined;
  const openCases = () => listCases(p, { branchId }).rows.filter((c: any) => c.state !== 'done');

  switch (id) {
    case 'case-mo':
      return done(openCases().map((c: any) => c.id as number));
    case 'hv-co-case-mo': {
      /* ĐẾM DUY NHẤT học viên, chỉ từ Case CHƯA kết luận (F02) — không gộp Case đã đóng. */
      const students = new Set<number>();
      for (const c of openCases()) if (c.studentId) students.add(c.studentId as number);
      return done([...students].sort((a, b) => a - b));
    }
    case 'case-thieu-pa':
      /* Case CHỜ DUYỆT có `state` riêng — không quy chậm cho giáo viên (hợp đồng §2). */
      return done(openCases().filter((c: any) => c.state === 'no_plan').map((c: any) => c.id as number));
    case 'case-xac-dinh-nguyen-nhan-qua-han': {
      const mo = openCases();
      const ids = choDuyetCaseIds(mo.map((c: any) => c.id as number), today, true);
      /* UX-2 (2): người giữ việc của dòng Cần xử lý = người phụ trách Case; hạn = hạn việc tiếp đã qua ("quá hạn n ngày"). */
      const chu = new Map(mo.map((c: any) => [c.id as number, c.ownerUserId as number | null]));
      const xl = xuLyCaseMany(ids, today);
      return done(ids, { chiTiet: new Map(ids.map((id) => [id, { nguoi: chu.get(id) ? [chu.get(id)!] : [], han: xl.get(id)?.han ? [xl.get(id)!.han!] : [] }])) });
    }
    case 'bai-qua-han-nhap-diem': {
      const r = overdueScoreBai(p, scope.branchId, today);
      return done(r.ids, { chiTiet: r.chiTiet });
    }
    case 'bai-qua-han-chua-phan-cong': {
      /* OV-11f (TQ-13): tập con của `bai-qua-han-nhap-diem` — ô không có người chấm (môn chưa phân công; chấm chéo có người: "GV chấm chéo"). */
      const r = overdueScoreBai(p, scope.branchId, today);
      return done(r.ids.filter((x) => !r.chiTiet.get(x)?.nguoi.length && !r.chiTiet.get(x)?.chamCheo), { chiTiet: r.chiTiet });
    }
    case 'case-chua-co-nguoi-phu-trach':
      /* CV-LOI: cùng tập với dòng "Phân công GV … / Chọn người phụ trách" ở Công việc (`caseChuaCoNguoi`) — số Tổng quan = số dòng việc. */
      return done(caseChuaCoNguoi(p, branchId ?? null).map((c) => c.id as number));
    case 'case-cho-xac-dinh-nguyen-nhan': {
      /* OV-12d: Case đang chờ người chốt (Tổng hợp › Chờ duyệt) — id giữ `case-cho-xac-dinh-nguyen-nhan` (đường, chuông, phép kiểm cũ). */
      const mo = openCases().map((c: any) => c.id as number);
      const xl = xuLyCaseMany(mo, today);
      const ids = mo.filter((id) => xl.get(id)?.cot === 'choDuyet');
      return done(ids, { byKind: phanRaCaseChuaChot(ids, xl) });
    }
    case 'pa-can-cap-nhat': {
      const r = overdueUpdatePlans(openCases().map((c: any) => c.id as number), today);
      return done(r.ids, { chiTiet: r.chiTiet });
    }
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
      if (!f.ctLop) return done(r.ids, { denominatorIds: r.denominatorIds });
      /* Q11: câu lớp thường theo chương trình ("FOU: 5/22 học viên chưa đạt") — lọc cả tử lẫn mẫu theo chương trình lớp em ĐANG học, theo lô. */
      const giu = new Set<number>();
      for (let i = 0; i < r.denominatorIds.length; i += 400) {
        const lo = r.denominatorIds.slice(i, i + 400);
        for (const x of db().prepare(
          `SELECT e.student_id FROM enrollments e JOIN classes c ON c.id = e.class_id
            WHERE e.status = 'active' AND c.programme_code = ? AND e.student_id IN (${lo.map(() => '?').join(',')})`,
        ).all(f.ctLop, ...lo) as any[]) giu.add(x.student_id);
      }
      return done(r.ids.filter((x) => giu.has(x)), { denominatorIds: r.denominatorIds.filter((x) => giu.has(x)) });
    }
    case 'do-phu-danh-gia': {
      const r = doPhuDanhGia(p, branchId ?? null, today);
      return done(r.ids, { numeratorIds: r.numeratorIds });
    }
    /* ---------------------------------------------- PR-VAI-a Q8: bốn việc "của Bạn" ở Cần xử lý — mỗi chỉ số gọi đúng hàm màn khác dùng */
    case 'van-hanh-can-quyet-dinh': {
      /* (a) cùng `listMgmtTasks` + `khopHang('can-quyet-dinh')` của hàng số tab Vận hành — không câu SQL mới. */
      const r = listMgmtTasks(p, { branchId: scope.branchId, hang: 'can-quyet-dinh' });
      if (r.scopeEmpty) return { ...done([]), empty: true, note: EMPTY_NOTE };
      return done(r.rows.map((x: any) => x.id as number));
    }
    case 'hv-ft-xong-mt-cuoi-chua-mt-ke': {
      /* (c) cùng hai điều kiện của `tomTatMt` (`XONG_MT_CUOI_SQL`, `CO_MOC_KE_TIEP_SQL`) + `coMocTiepTheo`: có ngày/tháng thi thì đã có mốc. */
      const sc = scopeFor(p, PERMISSIONS.PLAN_WEEK);
      if (sc.none) return { ...done([]), empty: true, note: EMPTY_NOTE };
      const cs = classScopeSql(sc);
      return done((db().prepare(
        `SELECT DISTINCT s.id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
           JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
          WHERE e.status = 'active' AND c.status = 'active' AND c.is_fast_track = 1 AND ${HV_DANG_HOC_SQL('s')}
            AND ${cs.sql}${scope.branchId ? ' AND c.branch_id = ?' : ''}
            AND cy.exam_month IS NULL AND cy.exam_period_id IS NULL AND cy.exam_date IS NULL
            AND ${XONG_MT_CUOI_SQL('cy', 'c')} AND NOT ${CO_MOC_KE_TIEP_SQL('cy')}
          ORDER BY s.id`,
      ).all(...cs.params, ...(scope.branchId ? [scope.branchId] : []), mondayOf(today)) as any[]).map((r) => r.id as number));
    }
    case 'hv-len-ft-chua-ky-vong':
      /* (d) PR-KV: em chưa kết luận kỳ vọng đầu ra ở lớp BE/ELE đã có em có điểm MT0 — cùng `lopKyVong` của việc QL (một dòng mỗi lớp). */
      if (scopeFor(p, PERMISSIONS.REQUEST_APPROVE).none) return { ...done([]), empty: true, note: EMPTY_NOTE };
      return done(lopKyVong(p, scope.branchId).flatMap((x) => x.chua).sort((a, b) => a - b));
    case 'lop-chua-chot-len-ft':
      /* PR-LCb: cùng `lopChoChotLoTrinh` của việc "Chốt lộ trình" (`myWork`); PR-LCb bỏ `hv-chua-co-lenh-chuyen` (gộp vào đây). */
    {
      /* OV-11f (TQ-3): dòng phụ = chữ của việc "Chốt lộ trình" (`chuViecChotLoTrinh`) + hạn — cùng hàm, không luật thứ hai. */
      const ds = lopChoChotLoTrinh(p, scope.branchId, today);
      return done(ds.map((x) => x.classId).sort((a, b) => a - b), {
        dongPhu: new Map(ds.map((x) => [x.classId, [chuViecChotLoTrinh(x), x.han ? `hạn ${ngayNgan(x.han)}` : null].filter(Boolean).join(' · ')])),
      });
    }
    case 'lop-thieu-gv-mon': {
      /* K1-05: phạm vi PHÂN CÔNG (Quản lý, Quản trị) — giáo viên không phân công được nên nhận tập rỗng có nhãn, như chỉ số QL khác. */
      const sc = scopeFor(p, PERMISSIONS.CLASS_ASSIGN);
      if (sc.none) return { ...done([]), empty: true, note: EMPTY_NOTE };
      return done(lopThieuGvMon(sc, scope.branchId));
    }
    case 'dung-han-cap-nhat': {
      /* Nghĩa vụ của MỌI Case học thuật trong phạm vi — kể cả Case đã đóng: nghĩa vụ đã đến hạn vẫn là chuyện đã xảy ra. */
      const caseIds = listCases(p, { branchId }).rows
        .filter((c: any) => c.originKind !== 'backfill')
        .map((c: any) => c.id as number);
      const r = obligations(caseIds, today, f.from ?? null, f.to ?? null);
      return done(r.ids, { numeratorIds: r.numeratorIds });
    }
    case 'pa-co-ket-qua': {
      const ids = new Set<number>();
      /* SL1 (A7-02): "trong kỳ" — theo ngày kết quả cuối của PA (luật `planOutcomes`, cùng tập Hiệu quả PA); không khoảng = mọi lúc. */
      for (const s of effectivenessScopes(p, scope.branchId)) {
        const ratio = f.program ? f.program === 'thuong' : null;
        for (const r of planOutcomes({ ...s, ratio, fromDate: f.from ?? null, toDate: f.to ?? null })) if (r.group !== 'undetermined') ids.add(r.id);
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
