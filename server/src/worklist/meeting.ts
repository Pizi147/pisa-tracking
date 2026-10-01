import { db, tx, vuaGhi } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  BRANCH_REPORT_CATEGORIES, ENTRY_SKILLS, PERMISSIONS, tenMon,
  TASK_PROGRESS, TASK_PROGRESS_LABEL, TASK_TYPES,
  TUTOR_REPORT_CATEGORIES, UNIT_STATUSES, trangThaiDonVi, trangThaiO, type DueState,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, diffDays, forbidden, isIsoDate, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, scopeFor, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { owningMonth, periodById, reportEditWindow } from '../platform/week.ts';
import { countAttachments } from '../platform/attachments.ts';

export const DUE_SOON_DAYS = 3;

/**
 * MỤC BÁO CÁO ↔ NHÓM CÔNG VIỆC.
 *
 * Bốn nhóm công việc và ba mục báo cáo chi nhánh không trùng tên nhau, nên chỗ nối phải nằm
 * ở đúng một nơi. Thiếu bảng này thì mỗi màn tự đoán lấy, và "Giáo trình" ở báo cáo sẽ hiện
 * việc của "Giáo viên".
 */
const TASK_GROUP_OF_CATEGORY: Record<string, string> = {
  teachers: 'teacher',
  students: 'student_parent',
  curriculum: 'curriculum',
  tutor_count: 'tutor',
  tutor_quality: 'tutor',
  tutor_other: 'tutor',
};

/** Nhóm báo cáo phụ thuộc loại đơn vị. Tutor part-time có bộ nhóm riêng. */
export function categoriesFor(unit: { kind: string }) {
  return unit.kind === 'branch' ? BRANCH_REPORT_CATEGORIES : TUTOR_REPORT_CATEGORIES;
}

export function visibleUnits(p: Principal) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return [];
  const conn = db();
  const all = conn.prepare(`SELECT * FROM reporting_units WHERE status='active' ORDER BY seq, name`).all() as any[];
  if (scope.all) return all;
  return all.filter((u) => u.branch_id === null || scope.branchIds.includes(u.branch_id));
}

/**
 * Tình hình các đơn vị trong một kỳ. Ô trống = CHƯA BÁO CÁO, khác hẳn "Ổn".
 *
 * KỲ TUẦN HAY KỲ THÁNG (mục 14.2). Báo cáo được GHI theo tuần — đó là nhịp thật của trung
 * tâm — còn kỳ tháng là một cách ĐỌC LẠI các tuần của tháng đó:
 *
 *   · Tình trạng hiện ở ô tháng là lần báo cáo GẦN NHẤT trong tháng, vì đó là điều đơn vị
 *     nói sau cùng.
 *   · Kèm theo là tình trạng NẶNG NHẤT đã xuất hiện trong tháng: một tuần "Có vấn đề" rồi
 *     ba tuần "Ổn" không phải là một tháng ổn, và giấu nó đi là giấu đúng thứ cần mang ra họp.
 *   · Kỳ tháng KHÔNG sửa được. Một nhận định thuộc về tuần người ta viết nó; cho sửa ở tầng
 *     tháng thì không biết phải ghi vào tuần nào.
 */
/**
 * PR-Ra: viết lại theo "một câu cho mỗi thứ", không còn một câu SQL mỗi Ô (mỗi đơn vị × mỗi
 * hạng mục trước đây tự hỏi báo cáo, tên người, việc gợi ý, lịch sử — bốn câu MỖI Ô, nhân với
 * cỡ chục ô là hàng chục câu):
 *
 *   (1) `visibleUnits` — đã một câu từ trước.
 *   (2) MỘT câu mọi `unit_reports` của mọi đơn vị trong (các) kỳ đang xem.
 *   (3) MỘT câu lịch sử (chỉ kỳ tuần đang xem — kỳ tháng không hiện lịch sử).
 *   (4) MỘT câu nối việc (JOIN `tasks` qua `unit_report_task_links`).
 *   (5) `countAttachments` — một câu đếm bằng chứng.
 *   (6) MỘT câu tên người (người báo cáo + người nộp).
 */
export function meetingBoard(p: Principal, periodId: number, opts: { month?: string | null } = {}) {
  require_(p, PERMISSIONS.MEETING_VIEW, { anyScope: true }, 'Bạn không có quyền xem họp tuần.');
  const period = periodById(periodId);
  if (!period) throw notFound('Không tìm thấy kỳ họp');
  const conn = db();
  const units = visibleUnits(p);

  /* Các tuần THUỘC tháng đang xem — tuần thuộc về tháng chứa ngày thứ Năm của nó. */
  const monthPeriods = opts.month
    ? (conn.prepare('SELECT id, week_start, code FROM report_periods ORDER BY week_start').all() as any[])
        .filter((r) => {
          const m = owningMonth(r.week_start);
          return `${m.year}-${String(m.month).padStart(2, '0')}` === opts.month;
        })
    : [];
  const monthIds = monthPeriods.map((r) => r.id);
  const soTuanDaBatDau = monthPeriods.filter((r) => r.week_start <= demoToday()).length;
  const scope = monthIds.length
    ? { kind: 'month' as const, month: opts.month!, weeks: monthPeriods.map((r) => r.code), editable: false }
    : { kind: 'week' as const, month: null, weeks: [period.code], editable: true };

  if (!units.length) {
    return { period, scope, units: [], totals: { total: 0, ok: 0, watch: 0, problem: 0, notReported: 0, daNop: 0, nhap: 0, chua: 0 } };
  }
  const unitIds = units.map((u) => u.id);
  const periodIdsToQuery = monthIds.length ? monthIds : [periodId];

  /*
   * (2) mọi unit_reports của mọi đơn vị trong (các) kỳ đang xem — PHẢI `ORDER BY` tuần tăng dần:
   * dòng (172) lấy "lần báo cáo GẦN NHẤT" của kỳ tháng bằng `mineAll[mineAll.length - 1]`, dựa
   * vào thứ tự hàng trả về. Không có `ORDER BY` thì SQLite không cam kết thứ tự gì cả — đúng
   * ngẫu nhiên hôm nay, sai ngày mai. Nối `report_periods` để sắp theo NGÀY (`week_start`), không
   * phải theo `period_id` (id tăng theo thứ tự TẠO kỳ, không chắc trùng thứ tự tuần).
   */
  const allReports = conn
    .prepare(
      `SELECT ur.* FROM unit_reports ur JOIN report_periods rp ON rp.id = ur.period_id
        WHERE ur.reporting_unit_id IN (${unitIds.map(() => '?').join(',')})
          AND ur.period_id IN (${periodIdsToQuery.map(() => '?').join(',')})
        ORDER BY rp.week_start`,
    )
    .all(...unitIds, ...periodIdsToQuery) as any[];
  const reportsByUnit = new Map<number, any[]>();
  for (const r of allReports) {
    (reportsByUnit.get(r.reporting_unit_id) ?? reportsByUnit.set(r.reporting_unit_id, []).get(r.reporting_unit_id)!).push(r);
  }

  // (3) lịch sử — chỉ kỳ TUẦN đang xem (kỳ tháng không hiện lịch sử, đọc `scope.editable`).
  const histByKey = new Map<string, any[]>();
  if (!monthIds.length && unitIds.length) {
    for (const h of conn
      .prepare(
        `SELECT h.reporting_unit_id, h.category_key, h.status, h.note, h.at, h.kind, us.full_name AS actor
           FROM unit_report_history h LEFT JOIN users us ON us.id = h.actor_user_id
          WHERE h.reporting_unit_id IN (${unitIds.map(() => '?').join(',')}) AND h.period_id = ?
          ORDER BY h.id DESC`,
      )
      .all(...unitIds, periodId) as any[]) {
      const key = `${h.reporting_unit_id}|${h.category_key}`;
      (histByKey.get(key) ?? histByKey.set(key, []).get(key)!).push(h);
    }
  }

  /*
   * Việc nối/bằng chứng cần TRUY VẤN sẵn cho MỌI dòng đã tải (không chỉ dòng "đại diện" của kỳ
   * tháng) — rẻ hơn nhiều so với một câu SQL riêng mỗi lần chọn dòng đại diện, và dữ liệu vẫn
   * đúng vì mỗi dòng chỉ đọc lại đúng khoá `reportId` của chính nó.
   */
  const repIds = allReports.map((r) => r.id);

  // (4) nối việc.
  const linksByReport = new Map<number, any[]>();
  if (repIds.length) {
    for (const l of conn
      .prepare(
        `SELECT l.unit_report_id, t.id, t.code, t.title, t.progress, t.due_date
           FROM unit_report_task_links l JOIN tasks t ON t.id = l.task_id
          WHERE l.unit_report_id IN (${repIds.map(() => '?').join(',')})
          ORDER BY l.unit_report_id, l.created_at`,
      )
      .all(...repIds) as any[]) {
      (linksByReport.get(l.unit_report_id) ?? linksByReport.set(l.unit_report_id, []).get(l.unit_report_id)!).push({
        id: l.id, code: l.code, title: l.title, progress: l.progress,
        progressLabel: TASK_PROGRESS_LABEL[l.progress as keyof typeof TASK_PROGRESS_LABEL] ?? l.progress,
        due: l.due_date ?? null,
        overdue: !['done', 'stopped'].includes(l.progress) && !!l.due_date && l.due_date < demoToday(),
      });
    }
  }

  // (5) bằng chứng.
  const evidenceOf = repIds.length ? countAttachments('unit_report', repIds) : new Map<number, number>();

  // (6) tên người — báo cáo + nộp, một câu cho cả hai.
  const peopleIds = [...new Set(allReports.flatMap((r) => [r.reporter_user_id, r.submitted_by]).filter((x): x is number => !!x))];
  const nameOf = new Map<number, string>();
  if (peopleIds.length) {
    for (const r of conn
      .prepare(`SELECT id, full_name FROM users WHERE id IN (${peopleIds.map(() => '?').join(',')})`)
      .all(...peopleIds) as any[]) nameOf.set(r.id, r.full_name);
  }

  const RANK: Record<string, number> = { ok: 1, watch: 2, problem: 3 };
  const unitRows = units.map((u) => {
    const cats = categoriesFor(u);
    const saved = reportsByUnit.get(u.id) ?? [];
    const cells = cats.map((c) => {
      const mineAll = saved.filter((x) => x.category_key === c.key);
      /* Kỳ tháng: lần báo cáo GẦN NHẤT là điều đơn vị nói sau cùng (đã tới theo period_id tăng dần từ query (2)). */
      const r = monthIds.length ? mineAll[mineAll.length - 1] : mineAll[0];
      /* PR-UXF-a (Q11): kỳ tháng chỉ tính tuần ĐÃ NỘP — nháp không phải điều đơn vị đã báo. */
      const daNopTuan = mineAll.filter((x) => trangThaiO({ status: x.status ?? null, note: x.note ?? null, submittedAt: x.submitted_at ?? null }) === 'da-nop');
      const worstStatus = monthIds.length
        ? daNopTuan.map((x) => x.status).filter(Boolean)
          .sort((a, b) => (RANK[b] ?? 0) - (RANK[a] ?? 0))[0] ?? null
        : null;
      const group = TASK_GROUP_OF_CATEGORY[c.key] ?? null;
      const hist = (histByKey.get(`${u.id}|${c.key}`) ?? [])
        .map((h) => ({ status: h.status ?? null, note: h.note ?? null, at: h.at, actor: h.actor ?? null, kind: h.kind ?? null }))
        .slice(0, 10);
      return {
        key: c.key, label: c.label, hint: c.hint,
        status: r?.status ?? null,          // null = chưa báo cáo
        note: r?.note ?? null,
        reporterName: r?.reporter_user_id ? nameOf.get(r.reporter_user_id) ?? null : null,
        updatedAt: r?.updated_at ?? null,
        /* Ngày báo cáo, tách khỏi dấu thời gian đầy đủ để giao diện khỏi tự cắt chuỗi. */
        reportedOn: r?.updated_at ? String(r.updated_at).slice(0, 10) : null,
        reportId: r?.id ?? null,
        /* PR-Ra Q12/Q13: trạng thái theo `submitted_at`, không theo `status` thô. */
        trangThai: trangThaiO({ status: r?.status ?? null, note: r?.note ?? null, submittedAt: r?.submitted_at ?? null }),
        submittedAt: r?.submitted_at ?? null,
        submittedBy: r?.submitted_by ? nameOf.get(r.submitted_by) ?? null : null,
        taskGroup: group,
        /* PR-Ra R6: việc NỐI THẬT qua `unit_report_task_links` — thay gợi ý tự động "cùng nhóm + CN". */
        linkedTasks: r ? linksByReport.get(r.id) ?? [] : [],
        evidenceCount: r ? evidenceOf.get(r.id) ?? 0 : 0,
        /* Chỉ có ở kỳ tháng: tuần nặng nhất đã xuất hiện, và đã báo cáo mấy tuần trên mấy. */
        worstStatus,
        /* PR-UXF-a (Q11): "n/m tuần" = tuần ĐÃ NỘP / tuần ĐÃ BẮT ĐẦU trong tháng (tuần tương lai chưa ai báo được). */
        weeksReported: monthIds.length ? daNopTuan.length : null,
        weeksTotal: monthIds.length ? soTuanDaBatDau : null,
        history: hist,
      };
    });
    return {
      unitId: u.id, unitName: u.name, unitCode: u.code, kind: u.kind, branchId: u.branch_id,
      cells,
      reported: cells.filter((c) => c.status !== null).length,
      total: cells.length,
      /* PR-Ra Q12: trạng thái hàng đơn vị suy từ trạng thái từng ô — theo Ô, không theo ô nào "đại diện". */
      trangThai: trangThaiDonVi(cells.map((c) => ({ status: c.status, note: c.note, submittedAt: c.submittedAt }))),
      canEdit: can(p, PERMISSIONS.MEETING_EDIT, { branchId: u.branch_id, anyScope: u.branch_id === null }),
    };
  });

  const totals = unitRows.reduce(
    (acc, u) => {
      for (const c of u.cells) {
        acc.total += 1;
        if (c.status === null) acc.notReported += 1;
        else if (c.status === 'problem') acc.problem += 1;
        else if (c.status === 'watch') acc.watch += 1;
        else acc.ok += 1;
      }
      /* PR-UXF-a F4 (Q11): `daNop`/`nhap`/`chua` đếm ĐƠN VỊ (trạng thái hàng) — đúng thứ mà chip bấm lọc ra (`u.trangThai.ma`). */
      acc[u.trangThai.ma === 'da-nop' ? 'daNop' : u.trangThai.ma === 'nhap' ? 'nhap' : 'chua'] += 1;
      return acc;
    },
    { total: 0, ok: 0, watch: 0, problem: 0, notReported: 0, daNop: 0, nhap: 0, chua: 0 },
  );

  return {
    period,
    /* Nói rõ mình đang đọc ở tầng nào, để không ai tưởng ô tháng sửa được. */
    scope,
    units: unitRows,
    totals,
  };
}

/**
 * PR-Ra Q13: LƯU NHÁP và NỘP là hai việc khác nhau, và `reportEditWindow` chỉ can thiệp vào
 * đúng hai chỗ:
 *
 *   NHÁP (không `nop`)  chỉ chặn khi tuần CHƯA BẮT ĐẦU, hoặc khi ô đang sửa ĐÃ NỘP mà cửa sổ
 *                        đã đóng (không được lén sửa một báo cáo đã nộp sau khi khoá).
 *   NỘP (`nop: true`)   luôn cần cửa sổ đang mở (hoặc Quản trị hệ thống đã mở lại), và phải
 *                        đã có mức — không nộp một ô rỗng.
 *
 * Nháp cho tuần đã khoá KHÔNG bị chặn — người dùng vẫn ghi lại được điều họ quan sát, chỉ là
 * không "chốt" được nữa; đó là lý do D04 tách nháp khỏi nộp thay vì chặn cả ô.
 */
export function saveUnitReport(
  p: Principal, unitId: number, periodId: number, categoryKey: string,
  patch: { status?: string | null; note?: string | null; nop?: boolean },
) {
  const conn = db();
  const unit = conn.prepare('SELECT * FROM reporting_units WHERE id = ?').get(unitId) as any;
  if (!unit) throw notFound('Không tìm thấy đơn vị');
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: unit.branch_id, anyScope: unit.branch_id === null },
    'Bạn không có quyền cập nhật báo cáo của đơn vị này.');
  const cat = categoriesFor(unit).find((c) => c.key === categoryKey);
  if (!cat) throw badRequest('Nhóm báo cáo không thuộc đơn vị này.');

  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần báo cáo');
  if (patch.status && !(UNIT_STATUSES as readonly string[]).includes(patch.status)) {
    throw badRequest('Tình trạng không hợp lệ.');
  }

  const before = conn
    .prepare('SELECT * FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?')
    .get(unitId, periodId, categoryKey) as any;
  const window = reportEditWindow(period);

  if (patch.nop) {
    if (!window.open) throw badRequest(window.reason ?? 'Ngoài thời gian nộp báo cáo tuần.');
    const effectiveStatus = patch.status !== undefined ? patch.status : (before?.status ?? null);
    if (!effectiveStatus) throw badRequest('Chọn mức trước khi nộp.');
  } else {
    if (demoToday() < period.week_start) {
      throw badRequest(window.reason ?? `Tuần ${period.code ?? ''} chưa bắt đầu — chưa có gì để báo cáo.`.trim());
    }
    if (before?.submitted_at && !window.open) {
      throw badRequest('Báo cáo này đã nộp và tuần đã khoá — chỉ Quản trị hệ thống mở lại được.');
    }
  }

  const submittedAt = patch.nop ? nowIso() : null;
  const submittedBy = patch.nop ? p.userId : null;
  conn
    .prepare(
      `INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note,
                                 reporter_user_id, updated_at, submitted_at, submitted_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(reporting_unit_id, period_id, category_key) DO UPDATE SET
         status = CASE WHEN excluded.status IS NOT NULL OR ? THEN excluded.status ELSE unit_reports.status END,
         note = CASE WHEN ? THEN excluded.note ELSE unit_reports.note END,
         reporter_user_id = excluded.reporter_user_id,
         updated_at = excluded.updated_at,
         submitted_at = excluded.submitted_at,
         submitted_by = excluded.submitted_by`,
    )
    .run(unitId, periodId, categoryKey, cat.label,
         patch.status ?? null, patch.note ?? null, p.userId, nowIso(), submittedAt, submittedBy,
         patch.status !== undefined ? 1 : 0, patch.note !== undefined ? 1 : 0);

  const after = conn
    .prepare('SELECT * FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?')
    .get(unitId, periodId, categoryKey) as any;
  /*
   * LỊCH SỬ CHỈNH SỬA (mục 14.2) — một dòng cho mỗi lần lưu, kèm `kind` (PR-Ra) để phân biệt
   * nháp/nộp. Một ô đổi từ "Có vấn đề" sang "Ổn" ngay trước giờ họp là chuyện phải truy lại
   * được, và nhật ký hệ thống thì người dùng không mở.
   */
  conn
    .prepare(
      `INSERT INTO unit_report_history (reporting_unit_id, period_id, category_key, status, note, actor_user_id, at, kind)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(unitId, periodId, categoryKey, after.status ?? null, after.note ?? null, p.userId, nowIso(),
         patch.nop ? 'nop' : 'nhap');
  writeAudit({ actorUserId: p.userId, action: 'unit_report.save', entityType: 'unit_report',
    entityId: (after as any).id, entityLabel: `${unit.name} · ${cat.label}`, before, after });
  return after;
}

function reportBranchCtx(reportId: number): { branchId: number | null; unitKind: string } {
  const row = db()
    .prepare(
      `SELECT ru.branch_id AS unit_branch_id, ru.kind AS unit_kind
         FROM unit_reports ur JOIN reporting_units ru ON ru.id = ur.reporting_unit_id WHERE ur.id = ?`,
    )
    .get(reportId) as any;
  if (!row) throw notFound('Không tìm thấy báo cáo đơn vị.');
  return { branchId: row.unit_branch_id, unitKind: row.unit_kind };
}

/**
 * NỐI MỘT VIỆC VẬN HÀNH THẬT vào một ô báo cáo (PR-Ra R6, Q14) — thay gợi ý tự động cũ.
 * Việc phải LÀ VIỆC VẬN HÀNH (`branch_ops`, không phải việc giao giáo viên) và CÙNG CHI NHÁNH
 * với đơn vị báo cáo (đơn vị Tutor không có chi nhánh, nên việc nối cũng phải là việc "Toàn
 * hệ thống" — `branch_id IS NULL`).
 */
export function linkReportTask(p: Principal, reportId: number, taskId: number) {
  const conn = db();
  const { branchId, unitKind } = reportBranchCtx(reportId);
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId, anyScope: branchId === null },
    'Bạn không có quyền nối việc vào báo cáo này.');
  const task = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) throw notFound('Không tìm thấy công việc.');
  if (task.kind !== 'branch_ops') throw badRequest('Chỉ nối được việc Vận hành.');
  const wantBranch = unitKind === 'department' ? null : branchId;
  if (task.branch_id !== wantBranch) throw badRequest('Việc phải cùng chi nhánh với đơn vị báo cáo.');
  conn
    .prepare('INSERT OR IGNORE INTO unit_report_task_links (unit_report_id, task_id, created_by, created_at) VALUES (?,?,?,?)')
    .run(reportId, taskId, p.userId, nowIso());
  writeAudit({ actorUserId: p.userId, action: 'unit_report.link_task', entityType: 'unit_report', entityId: reportId, entityLabel: task.title });
  return { ok: true };
}

export function unlinkReportTask(p: Principal, reportId: number, taskId: number) {
  const { branchId } = reportBranchCtx(reportId);
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId, anyScope: branchId === null },
    'Bạn không có quyền gỡ việc khỏi báo cáo này.');
  db().prepare('DELETE FROM unit_report_task_links WHERE unit_report_id = ? AND task_id = ?').run(reportId, taskId);
  writeAudit({ actorUserId: p.userId, action: 'unit_report.unlink_task', entityType: 'unit_report', entityId: reportId, entityLabel: String(taskId) });
  return { ok: true };
}

// ---------------------------------------------------------------- công việc

export function dueState(t: { progress: string; due_date: string | null }, today = demoToday()): DueState {
  if (t.progress === 'done') return 'closed';
  if (!t.due_date) return 'no_due';
  const d = diffDays(t.due_date, today);
  if (d < 0) return 'overdue';
  if (d <= DUE_SOON_DAYS) return 'due_soon';
  return 'on_track';
}

export type TaskFilters = { periodId?: number; view?: string; assigneeId?: number; unitId?: number; q?: string };

/**
 * Việc trong kỳ lọc theo kỳ. Việc dài hạn chưa xong và việc quá hạn/sắp đến hạn xét XUYÊN KỲ,
 * để đổi tuần không làm biến mất việc còn tồn.
 */
export function listTasks(p: Principal, f: TaskFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const where: string[] = [];
  const params: unknown[] = [];

  if (!scope.all) {
    const parts = ['t.assignee_user_id = ?'];
    params.push(p.userId);
    if (scope.branchIds.length) {
      parts.push(`t.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
      params.push(...scope.branchIds);
      parts.push('t.branch_id IS NULL');
    }
    where.push('(' + parts.join(' OR ') + ')');
  }
  if (f.assigneeId) { where.push('t.assignee_user_id = ?'); params.push(f.assigneeId); }
  if (f.unitId) { where.push('t.reporting_unit_id = ?'); params.push(f.unitId); }
  if (f.q) { where.push('(t.title LIKE ? OR t.code LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }

  const rows = conn
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, ru.name AS unit_name, pr.code AS period_code,
              pr.week_start AS period_start, cl.code AS class_code, cl.programme_code AS class_ct
         FROM tasks t
         LEFT JOIN classes cl ON cl.id = t.class_id
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN reporting_units ru ON ru.id = t.reporting_unit_id
         LEFT JOIN report_periods pr ON pr.id = t.period_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date, t.id DESC`,
    )
    .all(...params) as any[];

  const today = demoToday();
  const period = f.periodId ? periodById(f.periodId) : null;

  // Người theo dõi đọc một lượt cho cả danh sách, không hỏi lại theo từng việc.
  const followers = new Map<number, { userId: number; name: string; source: string }[]>();
  if (rows.length) {
    const ids = rows.map((t) => t.id);
    for (const r of conn
      .prepare(
        `SELECT f.task_id, f.user_id, f.source, u.full_name
           FROM task_followers f JOIN users u ON u.id = f.user_id
          WHERE f.task_id IN (${ids.map(() => '?').join(',')}) ORDER BY u.full_name`,
      )
      .all(...ids) as any[]) {
      if (!followers.has(r.task_id)) followers.set(r.task_id, []);
      followers.get(r.task_id)!.push({ userId: r.user_id, name: r.full_name, source: r.source });
    }
  }

  /* Việc giao giáo viên toả ra bao nhiêu em — để danh sách nói rõ nó chạm tới ai. */
  const studentCounts = new Map<number, number>();
  for (const r of conn
    .prepare('SELECT task_id, COUNT(*) n FROM task_students GROUP BY task_id')
    .all() as any[]) studentCounts.set(r.task_id, r.n);

  let mapped = rows.map((t) => ({
    id: t.id, code: t.code, title: t.title, taskType: t.task_type,
    kind: t.kind ?? 'branch_ops',
    classId: t.class_id ?? null, className: t.class_code ?? null,
    topic: t.topic ?? null,
    topicLabel: t.topic ? tenMon(t.class_ct, t.topic) : null,
    studentCount: studentCounts.get(t.id) ?? 0,
    followers: followers.get(t.id) ?? [],
    unitId: t.reporting_unit_id, unitName: t.unit_name, branchId: t.branch_id,
    assigneeId: t.assignee_user_id, assigneeName: t.assignee_name,
    dueDate: t.due_date, progress: t.progress, note: t.note,
    dueState: dueState(t, today),
    periodId: t.period_id, periodCode: t.period_code, periodStart: t.period_start,
    sourceType: t.source_type, sourceSosCaseId: t.source_sos_case_id,
    createdAt: t.created_at, completedAt: t.completed_at,
    canEdit: can(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: t.branch_id === null })
             || t.assignee_user_id === p.userId,
  }));

  if (period) {
    /*
     * Giữ lại: việc của kỳ này, và mọi việc quá hạn hoặc sắp đến hạn.
     *
     * Trước đây còn giữ "việc dài hạn chưa xong" theo trường `Loại`. Trường đó đã bỏ khỏi
     * form vì nó không đổi routing, quyền, hạn hay cách tổng hợp — chỉ thêm một ô phải
     * chọn. Việc còn hạn và chưa xong đã được chính hạn của nó nói lên rồi.
     */
    mapped = mapped.filter((t) =>
      t.periodId === period.id || t.dueState === 'overdue' || t.dueState === 'due_soon');
  }
  switch (f.view) {
    case 'mine': mapped = mapped.filter((t) => t.assigneeId === p.userId); break;
    case 'overdue': mapped = mapped.filter((t) => t.dueState === 'overdue'); break;
    case 'open': mapped = mapped.filter((t) => t.progress !== 'done'); break;
    case 'done': mapped = mapped.filter((t) => t.progress === 'done'); break;
  }
  return { rows: mapped, scopeEmpty: false };
}

/**
 * VIỆC QUẢN LÝ GIAO CHO GIÁO VIÊN, TOẢ RA THÀNH PHƯƠNG ÁN CỦA TỪNG EM.
 *
 * Quản lý giao "cả lớp MB FT 101 tăng luyện nghe chi tiết" thì việc đó phải xuất hiện trong
 * hồ sơ của từng em — nếu không, ba tháng sau đọc lại hành trình một em sẽ không thấy vì sao
 * cách dạy đổi. Nhưng nó vẫn là MỘT việc: giáo viên cập nhật một lần, không phải mười ba lần.
 *
 * Owner chốt: Quản lý giao việc cho một em TỨC LÀ em đó đang có vấn đề, kể cả khi chưa ai ghi
 * gì. Vấn đề mở kiểu này vào thẳng "đang xử lý" — nó đã có phương án rồi, chính là task này —
 * chứ không rơi vào danh sách "chưa có phương án hỗ trợ" và đội con số đó lên sai.
 *
 * KHÔNG cần duyệt: chính Quản lý tạo ra nó.
 */
function fanOutToStudents(
  conn: ReturnType<typeof db>, taskId: number, actorId: number | null,
  input: { classId?: number | null; studentIds?: unknown; topic?: string; title: string },
) {
  const topic = (input.topic ?? '').trim();
  if (!topic) throw badRequest('Việc giao giáo viên phải chọn kỹ năng.');
  if (!(ENTRY_SKILLS as readonly string[]).includes(topic)) throw badRequest('Kỹ năng không hợp lệ.');

  const ids = Array.isArray(input.studentIds) && input.studentIds.length
    ? input.studentIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : (conn
        .prepare(
          `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
        )
        .all(input.classId ?? 0) as any[]).map((r) => r.id as number);
  if (!ids.length) throw badRequest('Không có học viên nào để giao việc.');

  const today = demoToday();
  for (const studentId of ids) {
    const cycle = conn
      .prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
      .get(studentId) as any;
    /* Đã có vấn đề đang mở ở đúng kỹ năng đó thì DÙNG LẠI, không mở thêm cái thứ hai. */
    let c = conn
      .prepare(
        `SELECT id FROM sos_cases
          WHERE student_id = ? AND topic = ? AND status != 'done'
          ORDER BY id DESC LIMIT 1`,
      )
      .get(studentId, topic) as any;
    if (!c) {
      const info = conn
        .prepare(
          `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, origin_kind,
                                  detected_at, reported_by, summary, urgency, sos_level, status, created_at)
           VALUES (NULL, ?,?,?, 'manager_task', ?,?,?, 'normal', NULL, 'in_progress', ?)`,
        )
        .run(studentId, cycle?.id ?? null, topic, today, actorId, input.title.trim(), nowIso());
      c = { id: Number(info.lastInsertRowid) };
    }
    const iv = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, recorded_by, status, planned_date, created_at)
         VALUES (?, 'teaching_adjust', ?,?, 'planned', ?, ?)`,
      )
      .run(c.id, input.title.trim(), actorId, today, nowIso());
    conn
      .prepare(
        `INSERT INTO task_students (task_id, student_id, case_id, intervention_id, created_at)
         VALUES (?,?,?,?,?) ON CONFLICT(task_id, student_id) DO NOTHING`,
      )
      .run(taskId, studentId, c.id, Number(iv.lastInsertRowid), nowIso());
  }
  return ids.length;
}

export function createTask(p: Principal, input: any) {
  const conn = db();
  const branchId = input.branchId ?? (input.unitId
    ? (conn.prepare('SELECT branch_id FROM reporting_units WHERE id = ?').get(input.unitId) as any)?.branch_id ?? null
    : null);
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId, anyScope: branchId === null }, 'Bạn không có quyền tạo công việc.');
  if (!chuTuDo(input.title, 'Nội dung công việc', 200)) throw badRequest('Cần nội dung công việc.');   // PR-Dọn (Q4): kiểu + trần
  if (input.dueDate && !isIsoDate(input.dueDate)) throw badRequest('Hạn không hợp lệ.');
  // `Loại` đã bỏ khỏi form; cột cũ giữ nguyên giá trị lịch sử, việc mới ghi mặc định.
  const taskType = 'in_period';
  /*
   * HAI LOẠI VIỆC KHÁC HẲN NHAU. `branch_ops` là chuyện giáo trình/vận hành, không gắn học
   * viên nào. `teacher_task` gắn lớp và kỹ năng, và toả ra thành phương án của từng em.
   */
  const kind = input.kind === 'teacher_task' ? 'teacher_task' : 'branch_ops';
  if (kind === 'teacher_task' && !input.classId && !(input.studentIds ?? []).length) {
    throw badRequest('Việc giao giáo viên phải chọn lớp hoặc chọn học viên.');
  }

  return tx(() => {
    /* PR-Dọn (quét #26): bấm đúp → trả lại việc vừa tạo (việc giao GV toả PA cho từng em — gửi đôi là nhân đôi PA). */
    const cu = vuaGhi('tasks', { title: input.title.trim(), kind, class_id: input.classId ?? null, branch_id: branchId, created_by: p.userId });
    if (cu) return conn.prepare('SELECT * FROM tasks WHERE id = ?').get(cu);
    const n = (conn.prepare('SELECT COUNT(*) AS n FROM tasks').get() as any).n as number;
    const code = padCode('CV', n + 1, 4);
    const info = conn
      .prepare(
        `INSERT INTO tasks (code, period_id, task_type, kind, class_id, topic, title,
                            reporting_unit_id, branch_id, assignee_user_id,
                            due_date, progress, note, source_type, source_unit_report_id, source_sos_case_id,
                            created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?, 'not_started', ?,?,?,?,?,?)`,
      )
      .run(code, input.periodId ?? null, taskType, kind, input.classId ?? null,
           kind === 'teacher_task' ? (input.topic ?? null) : null,
           input.title.trim(), input.unitId ?? null, branchId,
           input.assigneeUserId ?? null, input.dueDate ?? null, input.note ?? null,
           input.sourceType ?? 'manual', input.sourceUnitReportId ?? null, input.sourceSosCaseId ?? null,
           p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    setFollowers(conn, id, p.userId, branchId, input.followerIds);
    const touched = kind === 'teacher_task' ? fanOutToStudents(conn, id, p.userId, { ...input, title: input.title }) : 0;
    writeAudit({ actorUserId: p.userId, action: 'task.create', entityType: 'task', entityId: id,
      entityLabel: code, after: { title: input.title, dueDate: input.dueDate, kind, students: touched } });
    return conn.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });
}

/**
 * Ghi danh sách người theo dõi.
 *
 * QUẢN LÝ CỦA CHÍNH CHI NHÁNH ĐÓ được thêm sẵn: việc thuộc chi nhánh nào thì quản lý chi
 * nhánh ấy đương nhiên cần biết, bắt người tạo chọn lại mỗi lần là bắt làm một việc mà
 * hệ thống đã biết câu trả lời. Người tạo vẫn thêm được người khác.
 */
function setFollowers(
  conn: ReturnType<typeof db>, taskId: number, actorId: number,
  branchId: number | null, manualIds: unknown,
) {
  const wanted = new Map<number, string>();
  if (branchId) {
    for (const r of conn
      .prepare(
        `SELECT DISTINCT ur.user_id FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE r.key = 'manager' AND ur.status = 'active'
            AND (ur.branch_id = ? OR ur.branch_id IS NULL)`,
      )
      .all(branchId) as any[]) {
      wanted.set(r.user_id, 'auto');
    }
  }
  for (const id of Array.isArray(manualIds) ? manualIds : []) {
    const n = Number(id);
    if (Number.isFinite(n) && n > 0) wanted.set(n, 'manual');
  }
  // Người theo dõi không phải người làm: nếu đã là người phụ trách thì không nhân đôi.
  const t = conn.prepare('SELECT assignee_user_id FROM tasks WHERE id = ?').get(taskId) as any;
  if (t?.assignee_user_id) wanted.delete(t.assignee_user_id);

  conn.prepare('DELETE FROM task_followers WHERE task_id = ?').run(taskId);
  for (const [userId, source] of wanted) {
    const ok = conn.prepare(`SELECT 1 FROM users WHERE id = ? AND status = 'active'`).get(userId);
    if (!ok) continue;
    conn.prepare('INSERT INTO task_followers (task_id, user_id, source, created_at) VALUES (?,?,?,?)')
      .run(taskId, userId, source, nowIso());
  }
  void actorId;
}

const ASSIGNEE_EDITABLE = new Set(['progress', 'note']);

export function updateTask(p: Principal, taskId: number, patch: any) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc');
  const manage = can(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: t.branch_id === null });
  if (!manage) {
    if (t.assignee_user_id !== p.userId) {
      require_(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id }, 'Bạn không có quyền cập nhật công việc này.');
    }
    const illegal = Object.keys(patch).filter((k) => !ASSIGNEE_EDITABLE.has(k));
    if (illegal.length) throw badRequest('Bạn chỉ cập nhật được tiến độ và ghi chú của công việc được giao.');
  }
  if (patch.progress && !(TASK_PROGRESS as readonly string[]).includes(patch.progress)) {
    throw badRequest('Tiến độ không hợp lệ.');
  }
  if (patch.dueDate && !isIsoDate(patch.dueDate)) throw badRequest('Hạn không hợp lệ.');

  const map: Record<string, string> = {
    title: 'title', progress: 'progress', dueDate: 'due_date', note: 'note',
    assigneeUserId: 'assignee_user_id', taskType: 'task_type', unitId: 'reporting_unit_id',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    if (t[map[k]] === v) continue;
    sets.push(`${map[k]} = ?`);
    params.push(v);
    conn.prepare('INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(taskId, map[k], t[map[k]] === null ? null : String(t[map[k]]), v === null ? null : String(v), p.userId, nowIso());
  }
  if (patch.followerIds !== undefined) {
    if (!manage) throw forbidden('Chỉ người quản lý công việc mới đổi được người theo dõi.');
    setFollowers(conn, taskId, p.userId, t.branch_id, patch.followerIds);
  }
  if (patch.progress === 'done' && t.progress !== 'done') { sets.push('completed_at = ?'); params.push(nowIso()); }
  if (patch.progress && patch.progress !== 'done' && t.progress === 'done') sets.push('completed_at = NULL');
  if (!sets.length) return t;
  sets.push('updated_at = ?');
  params.push(nowIso(), taskId);
  conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const after = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  writeAudit({ actorUserId: p.userId, action: 'task.update', entityType: 'task', entityId: taskId,
    entityLabel: t.code, before: t, after });
  return after;
}


/**
 * Danh sách người để chọn Người phụ trách / Người theo dõi.
 *
 * Trả về kèm vai trò và chi nhánh, vì trong một trung tâm có người trùng tên — một ô chọn
 * chỉ có tên là một ô chọn nhầm người. Gõ để lọc, không phải kéo một dropdown dài.
 */
export function searchPeople(p: Principal, q?: string, limit = 20) {
  require_(p, PERMISSIONS.MEETING_VIEW, { anyScope: true }, 'Bạn không có quyền xem danh sách người dùng.');
  const conn = db();
  const term = (q ?? '').trim();
  const params: unknown[] = [];
  let where = `u.status = 'active'`;
  if (term) { where += ' AND (u.full_name LIKE ? OR u.code LIKE ?)'; params.push(`%${term}%`, `%${term}%`); }
  const rows = conn
    .prepare(
      `SELECT u.id, u.full_name, u.title,
              (SELECT GROUP_CONCAT(DISTINCT r.name_vi) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = u.id AND ur.status = 'active') AS roles,
              (SELECT GROUP_CONCAT(DISTINCT b.code) FROM user_roles ur JOIN branches b ON b.id = ur.branch_id
                WHERE ur.user_id = u.id AND ur.status = 'active') AS branches
         FROM users u WHERE ${where} ORDER BY u.full_name LIMIT ?`,
    )
    .all(...params, limit) as any[];
  return rows.map((r) => ({
    id: r.id, name: r.full_name, title: r.title,
    role: (r.roles ?? '').split(',')[0] || null,
    branches: r.branches ? String(r.branches).split(',') : [],
  }));
}

/**
 * Tổng hợp Tutor part-time theo TỪNG TUTOR, không phải theo từng chi nhánh.
 *
 * Nhiều chi nhánh cùng làm việc với một tutor và cùng ghi nhận về người đó. Nếu mỗi chi
 * nhánh thành một bản ghi độc lập rồi cộng cơ học thì một tutor sẽ hoá thành ba tutor trên
 * dashboard. Báo cáo của chi nhánh là ĐẦU VÀO; tutor mới là đơn vị được tổng hợp.
 *
 * Ở bản demo, phần này giữ NHẸ: gom ghi nhận theo đơn vị Tutor, không dựng một hệ quản lý
 * nhân sự tutor.
 */
export function tutorRollup(p: Principal, periodId: number) {
  require_(p, PERMISSIONS.MEETING_VIEW, { anyScope: true }, 'Bạn không có quyền xem báo cáo tutor.');
  const conn = db();
  const unit = conn.prepare(`SELECT * FROM reporting_units WHERE code = 'TUTOR'`).get() as any;
  if (!unit) return { unit: null, categories: [], contributions: [] };

  const reports = conn
    .prepare(
      `SELECT ur.*, u.full_name AS reporter_name,
              (SELECT GROUP_CONCAT(DISTINCT b.code) FROM user_roles r2 JOIN branches b ON b.id = r2.branch_id
                WHERE r2.user_id = ur.reporter_user_id AND r2.status = 'active') AS reporter_branches
         FROM unit_reports ur
         LEFT JOIN users u ON u.id = ur.reporter_user_id
        WHERE ur.reporting_unit_id = ? AND ur.period_id = ?`,
    )
    .all(unit.id, periodId) as any[];

  const byCategory = new Map<string, any[]>();
  for (const r of reports) {
    if (!byCategory.has(r.category_key)) byCategory.set(r.category_key, []);
    byCategory.get(r.category_key)!.push({
      status: r.status, note: r.note,
      reporter: r.reporter_name,
      // Chi nhánh của người ghi nhận — để thấy nhận định đến từ đâu, không tách thành đơn vị riêng.
      fromBranches: r.reporter_branches ? String(r.reporter_branches).split(',') : [],
      updatedAt: r.updated_at,
    });
  }
  return {
    unit: { id: unit.id, name: unit.name },
    categories: TUTOR_REPORT_CATEGORIES.map((c) => ({
      key: c.key, label: c.label, entries: byCategory.get(c.key) ?? [],
    })),
    contributions: reports.length,
  };
}
