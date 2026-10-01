import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { metricSet } from './metrics.ts';
import { scoreDebtCells } from './scoreDebt.ts';

/**
 * "VIỆC CẦN LƯU Ý" — bảng trả lời câu hỏi AI PHẢI LÀM GÌ (mục 9.2).
 *
 * Khác hẳn bảng ở tab Thực trạng, vốn trả lời HỌC VIÊN ĐANG YẾU Ở ĐÂU. Owner giữ cả hai và
 * phân vai rõ (Q10), nên hai bảng cố tình không dùng chung bộ cột.
 *
 * Hai góc nhìn, đổi theo chỗ đứng của người xem:
 *
 *   CHƯA CHỌN CHI NHÁNH  → mỗi hàng một CHI NHÁNH, và một hàng tổng ở cuối.
 *   ĐÃ CHỌN CHI NHÁNH    → hàng đầu là tổng cả chi nhánh, dưới là hai nhóm Normal và FT
 *                          (mặc định thu gọn), mở ra mới thấy từng lớp.
 *
 * Bảng theo người CỐ TÌNH không có màu tốt/xấu và không xếp hạng. Một bảng "giáo viên nào
 * chậm nhất" là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào; nó biến một công cụ điều
 * phối thành một công cụ đánh giá, và giáo viên sẽ học cách làm đẹp số thay vì làm việc.
 */

/**
 * SÁU CON SỐ của một hàng lớp / nhóm / chi nhánh — và, kèm theo, CHÍNH TẬP ID tạo nên từng số.
 *
 * NĂM CỘT ĐẾM LÀ NĂM CHỈ SỐ CỦA SỔ (hợp đồng số liệu, PR-N N3). Số là `ids.length`; tập ID lấy từ `metricSet` — cùng hàm
 * mà ô số `<SoLieu>` ở Tổng quan gọi — rồi chỉ được CHIA về lớp / nhóm / chi nhánh, không lọc thêm và không đếm lại.
 * Trước PR-N bảng này tự đếm bằng bộ đếm riêng và chỉ khớp `<SoLieu>` nhờ may: trên dữ liệu demo nó ghi 79 case / 28
 * học viên / 27 thiếu phương án / 6 quá hạn còn chỉ số ghi 81 / 29 / 28 / 31 (hai case rơi khỏi bảng vì lớp không còn hoạt
 * động; "quá hạn cập nhật" đếm case trong khi chỉ số đếm phương án).
 *
 *   needSupport     ← hv-co-case-mo    HỌC VIÊN có case đang mở — một em ba case vẫn một lần
 *   cases           ← case-mo          CASE đang mở
 *   noPlan          ← case-thieu-pa    case chưa ai ghi sẽ làm gì
 *   overdueUpdate   ← pa-can-cap-nhat  PHƯƠNG ÁN quá hạn cập nhật kết quả tuần (đơn vị là phương án, không phải case)
 *   pendingApproval ← pa-cho-duyet     PHƯƠNG ÁN đang chờ Quản lý trả lời
 *
 * HÀNG TỔNG LÀ TẬP GỐC của chỉ số, không phải tổng các hàng con. Một em có case ở hai chi nhánh nằm ở CẢ HAI hàng chi
 * nhánh nhưng chỉ MỘT lần ở hàng tổng — nên cộng các hàng con có thể lớn hơn hàng tổng, và đó là đúng (luật 4).
 * "Sĩ số" không phải chỉ số của sổ: là số học viên đang học, cũng đếm duy nhất theo tập.
 */
export type PulseIds = {
  size: number[]; needSupport: number[]; cases: number[]; noPlan: number[]; overdueUpdate: number[]; pendingApproval: number[];
};
export type PulseMetrics = {
  /** Sĩ số — học viên đang học. */
  size: number;
  /** HỌC VIÊN cần hỗ trợ: một em có ba case vẫn chỉ đếm một lần. */
  needSupport: number;
  /** Tổng số CASE đang mở — đơn vị khác cột trên, và cố ý khác. */
  cases: number;
  /** Case chưa ai ghi sẽ làm gì. */
  noPlan: number;
  /** PHƯƠNG ÁN đã qua hạn cập nhật kết quả tuần mà chưa cập nhật. */
  overdueUpdate: number;
  /** Phương án giáo viên đề xuất, đang chờ Quản lý trả lời. */
  pendingApproval: number;
  /** Tập ID tạo nên từng số ở trên. Mỗi số bằng độ dài của tập tương ứng. */
  ids: PulseIds;
};

type Bucket = Record<keyof PulseIds, Set<number>>;
const bucket = (): Bucket => ({
  size: new Set(), needSupport: new Set(), cases: new Set(), noPlan: new Set(), overdueUpdate: new Set(), pendingApproval: new Set(),
});
const metricsOf = (b: Bucket): PulseMetrics => {
  const sorted = (x: Set<number>) => [...x].sort((a, c) => a - c);
  const ids: PulseIds = {
    size: sorted(b.size), needSupport: sorted(b.needSupport), cases: sorted(b.cases),
    noPlan: sorted(b.noPlan), overdueUpdate: sorted(b.overdueUpdate), pendingApproval: sorted(b.pendingApproval),
  };
  return {
    size: ids.size.length, needSupport: ids.needSupport.length, cases: ids.cases.length,
    noPlan: ids.noPlan.length, overdueUpdate: ids.overdueUpdate.length, pendingApproval: ids.pendingApproval.length, ids,
  };
};
const merge = (into: Bucket, from: Bucket) => {
  for (const k of Object.keys(into) as (keyof Bucket)[]) for (const id of from[k]) into[k].add(id);
};
/** Bộ tập ID gốc của một phạm vi, lấy thẳng từ các chỉ số của sổ. */
const rootBucket = (sets: Record<string, number[]>, size: Iterable<number>): Bucket => {
  const b = bucket();
  b.needSupport = new Set(sets['hv-co-case-mo']); b.cases = new Set(sets['case-mo']);
  b.noPlan = new Set(sets['case-thieu-pa']); b.overdueUpdate = new Set(sets['pa-can-cap-nhat']);
  b.pendingApproval = new Set(sets['pa-cho-duyet']); b.size = new Set(size);
  return b;
};

export function branchPulse(p: Principal, f: { branchId?: number | null } = {}) {
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return null;
  const today = demoToday();
  const branchId = f.branchId ?? null;

  /* NĂM TẬP ID GỐC — cùng hàm, cùng quyền với ô số. Bảng chỉ CHIA chúng, không đếm lại. */
  const sets: Record<string, number[]> = {};
  for (const id of ['hv-co-case-mo', 'case-mo', 'case-thieu-pa', 'pa-can-cap-nhat', 'pa-cho-duyet']) {
    sets[id] = metricSet(p, id, { branchId }).ids;
  }
  const cases = listCases(p, { branchId: branchId ?? undefined }).rows.filter((c) => c.state !== 'done');
  const caseById = new Map(cases.map((c) => [c.id as number, c]));

  /*
   * NƠI ĐANG CHĂM SÓC (rule book §11: hiện trạng theo nơi đang chăm sóc). Case chia về lớp và chi nhánh em ĐANG HỌC
   * (`homeClassId` / `homeBranchId`); em đã kết thúc khoá thì lấy nơi của lượt sinh ra case. Bảng cũ chia theo lớp LÚC ĐÁNH
   * GIÁ nên sĩ số (lớp hiện tại) và số HV cần hỗ trợ (lớp cũ) nói về hai nhóm người khác nhau.
   */
  const planCase = new Map<number, number>();
  const planIds = [...sets['pa-can-cap-nhat'], ...sets['pa-cho-duyet']];
  for (let i = 0; i < planIds.length; i += 400) {
    const chunk = planIds.slice(i, i + 400);
    for (const r of conn
      .prepare(`SELECT id, case_id FROM case_interventions WHERE id IN (${chunk.map(() => '?').join(',')})`)
      .all(...chunk) as any[]) planCase.set(r.id, r.case_id);
  }

  /*
   * LỚP TRONG PHẠM VI NGƯỜI ĐANG XEM — không phải mọi lớp của trung tâm.
   *
   * Trước vòng này câu lệnh lấy hết lớp đang hoạt động, nên Quản lý một chi nhánh mở bảng ra
   * thấy hàng của chi nhánh mình ghi 11 học viên mà hàng "Tất cả chi nhánh" ngay dưới ghi 40.
   * Hai con số ấy nói với người đọc rằng bảng này đếm sai — và họ đúng.
   */
  const scopeArgs: unknown[] = [];
  let scopeSql = '';
  if (!scope.all && scope.branchIds?.length) {
    scopeSql = ` AND c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`;
    scopeArgs.push(...scope.branchIds);
  }
  const classRows = conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, c.is_fast_track, b.name AS branch_name FROM classes c
         JOIN branches b ON b.id = c.branch_id WHERE c.status = 'active'${scopeSql} ORDER BY b.id, c.code`,
    )
    .all(...scopeArgs) as any[];
  const rosterOf = new Map<number, number[]>();
  for (const r of conn
    .prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.archived_at IS NULL`,
    )
    .all() as any[]) {
    if (!rosterOf.has(r.class_id)) rosterOf.set(r.class_id, []);
    rosterOf.get(r.class_id)!.push(r.student_id);
  }

  const perClass = new Map<number, Bucket>();
  const perBranch = new Map<number, Bucket>();
  const info = new Map<number, { id: number; code: string; branchId: number; branchName: string; isFt: boolean }>();
  const branchName = new Map<number, string>();
  for (const c of classRows) {
    perClass.set(c.id, bucket());
    for (const sid of rosterOf.get(c.id) ?? []) perClass.get(c.id)!.size.add(sid);
    info.set(c.id, { id: c.id, code: c.code, branchId: c.branch_id, branchName: c.branch_name, isFt: !!c.is_fast_track });
    branchName.set(c.branch_id, c.branch_name);
    if (!perBranch.has(c.branch_id)) perBranch.set(c.branch_id, bucket());
    for (const sid of rosterOf.get(c.id) ?? []) perBranch.get(c.branch_id)!.size.add(sid);
  }

  /* Chia mỗi phần tử của tập ID gốc về lớp và chi nhánh nơi case của nó đang được chăm sóc. */
  const place = (caseId: number, apply: (b: Bucket) => void) => {
    const c = caseById.get(caseId);
    if (!c) return;
    const cls = (c.homeClassId ?? c.classId) as number | null;
    const br = (c.homeBranchId ?? c.branchId) as number | null;
    if (cls && perClass.has(cls)) apply(perClass.get(cls)!);
    if (br) {
      if (!perBranch.has(br)) perBranch.set(br, bucket());
      apply(perBranch.get(br)!);
    }
  };
  for (const id of sets['case-mo']) place(id, (b) => b.cases.add(id));
  for (const id of sets['case-thieu-pa']) place(id, (b) => b.noPlan.add(id));
  for (const c of cases) {
    if (c.studentId) place(c.id, (b) => b.needSupport.add(c.studentId as number));
  }
  for (const id of sets['pa-can-cap-nhat']) { const cid = planCase.get(id); if (cid) place(cid, (b) => b.overdueUpdate.add(id)); }
  for (const id of sets['pa-cho-duyet']) { const cid = planCase.get(id); if (cid) place(cid, (b) => b.pendingApproval.add(id)); }

  /*
   * CHỈ GIỮ LỚP CÓ VIỆC. Bảng này tên là "Việc cần lưu ý" — một lớp đang chạy êm mà vẫn có
   * mặt ở đây thì mỗi sáng người đọc phải quét qua nó để kết luận "không có gì", đúng thứ
   * bảng này sinh ra để khỏi phải làm.
   */
  const busy = (m: PulseMetrics) => m.needSupport + m.cases + m.noPlan + m.overdueUpdate + m.pendingApproval > 0;

  /* ---------------------------------------------------------------- hai góc nhìn */
  let mode: 'branches' | 'groups';
  let rows: any[];
  let total: PulseMetrics;

  if (!branchId) {
    /* Chưa chọn chi nhánh: gộp thẳng lên mức chi nhánh, KHÔNG liệt kê từng lớp (mục 9.2). */
    mode = 'branches';
    const allSize = new Set<number>();
    for (const b of perBranch.values()) for (const sid of b.size) allSize.add(sid);
    total = metricsOf(rootBucket(sets, allSize));
    rows = [...perBranch.entries()]
      .map(([id, b]) => ({ id, label: branchName.get(id) ?? (conn.prepare('SELECT name FROM branches WHERE id = ?').get(id) as any)?.name ?? `#${id}`, metrics: metricsOf(b) }))
      .filter((r) => busy(r.metrics));
  } else {
    /*
     * Đã chọn chi nhánh: hai NHÓM LOẠI LỚP, mặc định thu gọn, mở ra mới thấy từng lớp.
     * Normal và FT vận hành khác nhau tới mức trộn chung một danh sách là bắt người đọc
     * tự phân loại lại bằng mắt ở mỗi dòng.
     */
    mode = 'groups';
    const groups: Record<'normal' | 'ft', { key: string; label: string; bucket: Bucket; classes: any[] }> = {
      normal: { key: 'normal', label: 'Normal', bucket: bucket(), classes: [] },
      ft: { key: 'ft', label: 'Fast Track', bucket: bucket(), classes: [] },
    };
    const allSize = new Set<number>();
    for (const [id, b] of perClass) {
      const i = info.get(id)!;
      if (i.branchId !== branchId) continue;
      for (const sid of b.size) allSize.add(sid);
      const g = groups[i.isFt ? 'ft' : 'normal'];
      merge(g.bucket, b);
      const m = metricsOf(b);
      if (busy(m)) g.classes.push({ id, label: i.code, metrics: m });
    }
    total = metricsOf(rootBucket(sets, allSize));
    rows = [groups.normal, groups.ft]
      .filter((g) => g.classes.length > 0)
      .map((g) => ({ key: g.key, label: g.label, metrics: metricsOf(g.bucket), classes: g.classes }));
  }

  return {
    mode,
    rows,
    total,
    people: peopleOf(p, conn, { caseById, sets, planCase }, today, branchId),
    /** Người xem có quyền trả lời đề xuất hay không — quyết định cột "Đề xuất chờ duyệt". */
    canApprove: can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true }),
  };
}

/** Bảng theo giáo viên — cột riêng, và chỉ tính dữ liệu trong chi nhánh đang xem (mục 9.2). */
function peopleOf(
  p: Principal, conn: any,
  src: { caseById: Map<number, any>; sets: Record<string, number[]>; planCase: Map<number, number> },
  today: string, branchId: number | null,
) {
  const cases = [...src.caseById.values()];
  const people = new Map<number, {
    id: number; name: string; classCount: number;
    mtPending: number; mtOverdue: number;
    cases: number; noPlan: number; overdueUpdate: number; pendingApproval: number;
  }>();
  const person = (id: number, name: string) => {
    if (!people.has(id)) {
      people.set(id, {
        id, name, classCount: 0, mtPending: 0, mtOverdue: 0,
        cases: 0, noPlan: 0, overdueUpdate: 0, pendingApproval: 0,
      });
    }
    return people.get(id)!;
  };
  const branchIds = [...new Set(cases.map((c) => c.branchId).filter(Boolean))] as number[];
  const scopeSql = branchId ? 'AND cl.branch_id = ?' : (branchIds.length
    ? `AND cl.branch_id IN (${branchIds.map(() => '?').join(',')})` : 'AND 1=0');
  const scopeArgs = branchId ? [branchId] : branchIds;

  /* Lớp của từng người TRONG chi nhánh đang xem — cùng một người ở chi nhánh khác không tính. */
  const classesOf = new Map<number, Set<number>>();
  for (const r of conn
    .prepare(
      `SELECT u.id, u.full_name, ta.class_id
         FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id
         JOIN classes cl ON cl.id = ta.class_id
        WHERE ta.status = 'active' AND u.status = 'active' ${scopeSql}
        ORDER BY u.full_name`,
    )
    .all(...scopeArgs) as any[]) {
    person(r.id, r.full_name);
    if (!classesOf.has(r.id)) classesOf.set(r.id, new Set());
    classesOf.get(r.id)!.add(r.class_id);
  }
  for (const [id, set] of classesOf) people.get(id)!.classCount = set.size;

  /*
   * MT CHƯA NHẬP và MT QUÁ HẠN NHẬP là HAI CỘT, không phải một. Cột đầu là khối lượng, cột sau là nợ.
   * Tập ô nợ lấy từ `scoreDebtCells` — CÙNG luật với ô ở bảng chấm (lớp thường: số câu đúng + hạn Chủ nhật; FT: band, dấu "-"
   * theo cặp W1/W2). Không còn câu SQL ước lượng riêng ở đây (S12, đặc tả §6).
   */
  const debtScope = branchId ? [branchId] : branchIds;
  for (const d of scoreDebtCells(p, today, debtScope)) {
    if (d.userId === null) continue;   // môn chưa phân công: không cộng cho ai (PR-UXF-a Q8 — hàng riêng ở bảng Theo giáo viên)
    const row = people.get(d.userId);
    if (!row) continue;
    row.mtPending += 1;
    if (d.overdue) row.mtOverdue += 1;
  }

  /*
   * CASE "ĐANG PHỤ TRÁCH" = case CÓ TÊN NGƯỜI NÀY LÀ NGƯỜI PHỤ TRÁCH (mục 2.3 · 3.4).
   *
   * Trước vòng này, một case được cộng cho MỌI giáo viên dạy lớp đó — một lớp bốn giáo viên
   * thì một case hoá thành bốn, và không ai trong bốn người thật sự chịu trách nhiệm. Từ khi
   * mỗi case có một người phụ trách, con số phải đi theo đúng người ấy.
   *
   * Case chưa có ai nhận thì KHÔNG cộng vào đầu ai cả — nó đã là một dòng việc riêng ở
   * Toàn cảnh ("Chưa có người phụ trách"), và gán bừa cho giáo viên dạy lớp là ghi sai
   * trách nhiệm cho cả trăm bản ghi.
   */
  const noPlanIds = new Set(src.sets['case-thieu-pa']);
  for (const c of cases) {
    const uid = (c as any).ownerUserId ?? null;
    if (!uid) continue;
    const row = people.get(uid);
    if (!row) continue;
    row.cases += 1;
    if (noPlanIds.has(c.id)) row.noPlan += 1;
  }
  /* "Quá hạn cập nhật" là PHƯƠNG ÁN (đơn vị của `pa-can-cap-nhat`), tính cho người phụ trách của case chứa phương án đó. */
  for (const planId of src.sets['pa-can-cap-nhat']) {
    const uid = (src.caseById.get(src.planCase.get(planId) ?? -1) as any)?.ownerUserId ?? null;
    if (uid && people.has(uid)) people.get(uid)!.overdueUpdate += 1;
  }

  /*
   * ĐỀ XUẤT CHỜ DUYỆT tính cho NGƯỜI ĐỀ XUẤT, không cho người nhập hộ (mục 3.4). Tập phương án lấy từ chỉ số
   * `pa-cho-duyet` (đã áp phạm vi) — không còn câu truy vấn riêng đọc mọi đề xuất rồi tự lọc chi nhánh.
   */
  const pending = src.sets['pa-cho-duyet'];
  for (let i = 0; i < pending.length; i += 400) {
    const chunk = pending.slice(i, i + 400);
    for (const r of conn
      .prepare(
        `SELECT COALESCE(iv.performer_user_id, iv.recorded_by) AS uid FROM case_interventions iv
          WHERE iv.id IN (${chunk.map(() => '?').join(',')})`,
      )
      .all(...chunk) as any[]) {
      if (r.uid && people.has(r.uid)) people.get(r.uid)!.pendingApproval += 1;
    }
  }

  return [...people.values()]
    .filter((x) => x.mtPending + x.mtOverdue + x.cases + x.pendingApproval > 0)
    .sort((a, b) => (b.mtOverdue + b.overdueUpdate) - (a.mtOverdue + a.overdueUpdate)
      || a.name.localeCompare(b.name, 'vi'));
}
