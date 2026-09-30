/**
 * CẦN HỖ TRỢ CỦA MỘT LỚP (PR-HVL, M4, T19, K2-36/37/42) — `GET /classes/:id/can-ho-tro`. Nằm ở: Học viên & Lớp → Hồ sơ lớp → tab Học viên →
 * nút chế độ `Điểm | Cần hỗ trợ`. Mỗi em có Case mở một KHỐI; web xếp Case vào hàng theo kỹ năng bằng `hangCanHoTro` (shared).
 *
 * Case lấy qua `listCases(p, { classId })` (đã lọc phạm vi — không đọc `sos_cases` trần) rồi `chiTietCaseMo` (theo lô: số câu SQL cố định,
 * không N+1). Mức SOS gần nhất / lộ trình / target của em KHÔNG đọc lại ở đây: tab Học viên đã tải `/classes/:id/roster` (cần `timeline` cho menu ⋯) —
 * web ghép `standing` + `cycle` từ đó, giữ trần câu SQL của đường này ≤ `/cases?classId=` + 8 (kế hoạch PR-HVL, Global Constraints).
 */
import { ENTRY_SKILLS, PERMISSIONS } from '../../../shared/domain/index.ts';
import { editableSkills, isCoreTeacherOf, can, require_, type Principal } from '../permissions.ts';
import { programmeOfClass } from '../normal/regular.ts';
import { listCases } from '../cases/cases.ts';
import { chiTietCaseMo, type CaseChiTiet } from '../cases/caseLop.ts';

export function canHoTroLop(p: Principal, classId: number) {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const prog = programmeOfClass(classId);
  const boMon = prog?.skills ?? [...ENTRY_SKILLS];
  /* Em ĐANG HỌC lớp này = lớp hiện tại của em (`homeClassId`, ghi danh `active`) — không tính em Tạm dừng (Case rơi về lớp lúc đánh giá). */
  const mo = listCases(p, { classId }).rows.filter((c) => c.status !== 'done' && c.studentId !== null && c.homeClassId === classId);
  const chiTiet = chiTietCaseMo(mo);
  const theoEm = new Map<number, { id: number; ten: string; ma: string; cases: CaseChiTiet[] }>();
  for (const c of mo) {
    const x = chiTiet.get(c.id);
    if (!x) continue;
    const e = theoEm.get(x.studentId) ?? { id: x.studentId, ten: c.studentName ?? '', ma: c.studentCode ?? '', cases: [] };
    e.cases.push(x);
    theoEm.set(x.studentId, e);
  }
  const em = [...theoEm.values()];
  const tatCa = em.flatMap((e) => e.cases);
  return {
    ct: (prog?.code ?? null) as string | null,
    boMon,
    /** Kỹ năng người xem sửa được ở lớp — công tắc "Chỉ kỹ năng tôi dạy". */
    kyNangToi: editableSkills(p, classId, boMon),
    /** GVBM thuần: không chủ nhiệm, không Quản lý — công tắc bật sẵn khi dạy 1–2 kỹ năng (Q12). */
    laGvbmThuan: !isCoreTeacherOf(p, classId) && !can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    tong: {
      soEm: em.length, soCase: tatCa.length,
      /** K2-42: Case "Chờ Quản lý duyệt · không theo dõi" + PA đang chờ Quản lý duyệt. */
      choDuyet: tatCa.filter((c) => c.trangThai.k === 'cho-duyet-khong-theo-doi').length + tatCa.reduce((n, c) => n + c.pas.filter((x) => x.choDuyet && !x.xong).length, 0),
      quaHan: tatCa.filter((c) => c.quaHan).length,
    },
    em,
  };
}
