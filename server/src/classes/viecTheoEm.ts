/**
 * SV-LOP (V5 `08` mục 6 · brief C19 · `thiet-ke/v5/ho-so-lop-truy-vet.md` C19): VIỆC THEO EM của hồ sơ lớp — lấy NGUYÊN từng việc của `/my-work`
 * (`myWork().items`, chưa gộp dòng), không dựng luật việc thứ hai (thay `viecTiepCuaEm` ở hồ sơ lớp; UI-HO-SO-LOP đọc route này). Một em nhiều việc →
 * đủ từng việc, việc của CHÍNH người xem trước (`mine`), việc người khác (chỉ QL / Admin) kèm tên người giữ (`owner`), rồi giữ thứ tự của Công việc.
 * Nguồn: QL / Admin = "Tất cả trong phạm vi" (`phamViXemViec`); GV = CHỈ việc của mình (`mine` — P11 VIEC-DUNG-VAI, chủ SP 24/10 mục 6.1);
 * vai không có khu Công việc (TVV / CX) chỉ nhóm việc của TVV của chính mình — như Tổng quan TVV.
 */
import { PERMISSIONS, demDongViec, gopViecTheoLop, laVaiQuanLy, vaiXemHocVien, type ViecTiepTheo } from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { myWork, nhanNhomViec, NHOM_VIEC_TVV, type WorkItem } from '../worklist/mywork.ts';
import { phamViXemViec } from '../worklist/xemViec.ts';
import { listCases } from '../cases/cases.ts';
import { programmeOfClass } from '../normal/regular.ts';
import { nhapDiemTheoEm, viecHocVienTheoLop } from './dongHocVien.ts';

export type ViecEmLop = Omit<WorkItem, 'con' | 'emIds'>;

const itemsCua = (w: unknown) => ((w as { items?: WorkItem[] }).items ?? []);

/** LOP-1-LOP: chỉ phép kiểm bật — `myWork` đọc lượt cả chi nhánh như trước PR (so "giống hệt đường đủ"). */
export const viecLopDayDuKhiKiem = { bat: false };

/**
 * GET /classes/:id/viec-theo-em → `{ theoEm: { [studentId]: ViecEmLop[] }, cuaToi: ViecEmLop[], soQuaHanLop }` — chỉ em đang học lớp, chỉ việc gắn lớp này (hoặc không gắn lớp).
 * UI-HO-SO-LOP: `cuaToi` = thanh "Việc cần làm" đầu hồ sơ lớp — việc CỦA NGƯỜI XEM ở lớp này (việc của em + việc cấp lớp như Chấm MTn), cùng thứ tự.
 * LOP-1-LOP: `myWork` chỉ đọc lượt của lớp (`classIds`) — việc từ lượt mang `classId` của lượt, lượt `class_id NULL` đã bị `chiDangHoc` loại, nên
 * `cuaLop` không mất việc nào; mọi khối khác của `myWork` y như cũ. `chiToi` (`?chi=toi`, web chỉ đọc `cuaToi`) → `theoEm = {}`.
 * `soQuaHanLop` = badge "n việc quá hạn" đầu hồ sơ lớp — dòng việc quá hạn gắn lớp (`demDongViec`, S11), trên `items` của `myWork` trước lọc;
 * GV chỉ `mine`); vai không có badge `qua-han` (TVV / CX / Admin — `badgeHienTheoVai`) → `null`.
 */
export function viecTheoEmCuaLop(p: Principal, classId: number, o: { chiToi?: boolean } = {}):
  { theoEm: Record<number, ViecEmLop[]>; cuaToi: ViecEmLop[]; soQuaHanLop: number | null } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const lop = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as { branch_id: number | null } | undefined;
  const em = new Set((conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(classId) as any[]).map((r) => r.student_id as number));
  const theoEm: Record<number, ViecEmLop[]> = {};
  const ql = laVaiQuanLy(p.roleKeys), coBadge = ql || vaiXemHocVien(p.roleKeys) === null;
  /* Lớp không em vẫn có badge (việc cấp lớp) — trước PR web đọc `/my-work` bất kể sĩ số. */
  if (!lop || (!em.size && !coBadge)) return { theoEm, cuaToi: [], soQuaHanLop: coBadge ? 0 : null };
  const f = { branchId: lop.branch_id ?? undefined, ...(viecLopDayDuKhiKiem.bat ? {} : { classIds: [classId] }) };
  const cuaLop = (it: WorkItem) => it.studentId !== null && em.has(it.studentId) && (it.classId === null || it.classId === classId);
  const capLop = (it: WorkItem) => it.studentId === null && it.classId === classId && it.mine;

  let w: WorkItem[];
  if (!can(p, PERMISSIONS.WORK_VIEW, { anyScope: true })) w = itemsCua(myWork(p, { ...f, chiNhom: NHOM_VIEC_TVV }));
  else if (phamViXemViec(p)) w = itemsCua(myWork(p, { ...f, nguoi: 'tat-ca' }));
  /* P11 VIEC-DUNG-VAI: GV chỉ việc CỦA MÌNH — việc của GV khác xem ở Công việc › Của một GV (quyền không đổi). Không còn nạp `/my-work` từng GV dạy lớp. */
  else w = itemsCua(myWork(p, f)).filter((it) => it.mine);
  /* S11 (chủ SP 05/11): đếm DÒNG việc như Công việc (`demDongViec` trên dòng gộp của chính các việc đó — "Cả lớp" = 1). */
  const soQuaHanLop = coBadge ? demDongViec(gopViecTheoLop(w.filter((it) => it.urgency === 'overdue' && it.classId === classId && (ql || it.mine)), nhanNhomViec)).n : null;
  if (!em.size) return { theoEm, cuaToi: [], soQuaHanLop };
  const items = w.filter(cuaLop), lopToi = w.filter(capLop);
  /* `sort` ổn định: trong mỗi phần giữ thứ tự của Công việc (quá hạn → hôm nay → hạn sớm). */
  const hang = (it: WorkItem) => ({ overdue: 0, today: 1, normal: 2 })[it.urgency] ?? 2;
  items.sort((a, b) => Number(b.mine) - Number(a.mine) || hang(a) - hang(b) || (a.due ?? '9').localeCompare(b.due ?? '9'));
  const gon = ({ con: _c, emIds: _e, ...it }: WorkItem): ViecEmLop => it;
  if (!o.chiToi) for (const it of items) (theoEm[it.studentId!] ??= []).push(gon(it));
  const cuaToi = [...lopToi, ...items.filter((it) => it.mine)].sort((a, b) => hang(a) - hang(b) || (a.due ?? '9').localeCompare(b.due ?? '9')).map(gon);
  return { theoEm, cuaToi, soQuaHanLop };
}

/**
 * Việc tiếp theo theo em của MỘT lớp — CÙNG hàm `viecHocVienTheoLop` của badge lớp (thay `viecTiepTheo` đã gỡ khỏi `/roster` — UI-HO-SO-LOP). Chỉ em đang học lớp.
 * UI-HV-LOP: web không còn gọi (`?kieu=tiep` gỡ khỏi route); giữ làm cửa phép kiểm luật `viecTiepCuaEm` (`tests/viecTiepLop.ts`, HSL-2b).
 */
export function viecTiepTheoCuaLop(p: Principal, classId: number): { viecTiep: Record<number, ViecTiepTheo[]> } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const em = (db().prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(classId) as any[]).map((r) => r.student_id as number);
  const homNay = demoToday();
  const vl = viecHocVienTheoLop(p, {
    emTheoLop: new Map([[classId, em]]), cases: listCases(p, { classId }).rows, homNay,
    chuongTrinhTheoLop: new Map([[classId, programmeOfClass(classId)?.code ?? null]]),
    nhapDiemTheoEm: nhapDiemTheoEm(p, [classId], homNay, () => classId),
  });
  return { viecTiep: Object.fromEntries([...vl.theoEm].map(([id, v]) => [id, v.viec])) };
}
