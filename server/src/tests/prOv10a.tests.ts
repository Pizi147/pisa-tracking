/**
 * PHÉP KIỂM PR-OV10a — nút / link đúng quyền cho TVV · CX · Admin (chủ SP 13/10, mockup vai mục 6 "Sửa luôn").
 * Bảng (vai × nút): khoá quyền mà nút dùng TRÙNG khoá đường API kiểm; vai thiếu khoá thì gọi thẳng đường đó vẫn 403 (không nới quyền máy chủ);
 * mã web chỉ hiện nút khi `can(PERMISSIONS.…)` / cờ máy chủ cho. Quét nguồn web theo mẫu C23 (prHk2).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export async function runPrOv10aTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal, editableSkills } = await import('../permissions.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { navOf } = await import('../platform/nav.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const cases: any = await import('../cases/cases.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const yThucPt: any = await import('../phanTich/yThucPhanTich.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nPR-OV10a · nút / link đúng quyền: TVV · CX · Admin');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov10a.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov10a', fullName: `Thử OV10a ${seq}`, roles }).userId as number;
  };
  const V = {
    TVV: loadPrincipal(tao([{ role: 'consultant', branches: ['CP'] }])),
    CX: loadPrincipal(tao([{ role: 'cx', branches: [] }])),
    Admin: loadPrincipal(tao([{ role: 'office_admin', branches: ['CP'] }])),
  };
  const em = one(`SELECT e.student_id id, e.class_id lop FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
      JOIN students s ON s.id = e.student_id AND s.status = 'active'
      WHERE b.code = 'CP' AND c.is_fast_track = 1 AND c.status = 'active' AND e.status = 'active' ORDER BY e.student_id LIMIT 1`);
  const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, em?.id, em?.lop)?.id;

  check('OV10a-0 · dữ liệu thử đủ (em FT CP, lượt MT)', () => { assert(em?.id && luot, JSON.stringify({ em, luot })); });

  /* ---- Bảng (vai × nút → khoá): vai thiếu khoá thì máy chủ 403, nút phải dùng đúng khoá đó ---- */
  check('OV10a-1 · "+ Case cho {kỹ năng}" (khoá sos.report): TVV · CX · Admin không có khoá, báo Case → 403; nút theo cờ máy chủ `canReport`', () => {
    for (const [vai, p] of Object.entries(V)) {
      const goc = vai === 'TVV' ? 'consultant' : vai === 'CX' ? 'cx' : 'office_admin';
      assert(!ROLE_PERMISSIONS[goc].includes('sos.report'), `${vai} không được có sos.report`);
      assert(loi(() => cases.reportIssue(p, { studentId: em.id, summary: 'thử' }))?.status === 403, `${vai} báo Case phải 403`);
    }
    const s = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(/onReport=\{data\.viewer\.canReport[^}]*\?[^}]*:\s*undefined\}/.test(s), 'SkillBoard chỉ nhận onReport khi canReport (cùng cờ nút "+ Case")');
  });

  check('OV10a-2 · "Nhập điểm" ở hồ sơ lượt MT (khoá score.edit / score.override): TVV · CX không có → lưu điểm 403; nút chỉ hiện khi `editableSkills`', () => {
    for (const vai of ['TVV', 'CX'] as const) {
      assert(editableSkills(V[vai], em.lop, ['listening', 'reading', 'writing1', 'writing2', 'speaking']).length === 0, `${vai} không sửa được kỹ năng nào`);
      assert(loi(() => attempts.saveScore(V[vai], luot, 'listening', { rawScore: 20 }))?.status === 403, `${vai} lưu điểm phải 403`);
    }
    const s = doc('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(/d\.classId && d\.viewer\.editableSkills\.length > 0 &&/.test(s), 'link Nhập điểm phải gắn editableSkills');
  });

  check('OV10a-3 · Admin: "Chọn nhiều học viên" (cycle.edit), "Huỷ kỹ năng / Đưa lại" (attempt.skip_skill), "Dời hạn chấm" (deadline.override) — máy chủ 403, nút ẩn', () => {
    const qa = ROLE_PERMISSIONS.office_admin;
    for (const k of ['cycle.edit', 'attempt.skip_skill', 'deadline.override']) assert(!qa.includes(k), `Admin không được có ${k}`);
    assert(loi(() => attempts.setSkillSkip(V.Admin, luot, 'listening', true, 'x'))?.status === 403, 'Huỷ kỹ năng → 403');
    assert(loi(() => attempts.duaLaiCaLuot(V.Admin, luot))?.status === 403, 'Đưa lại → 403');
    assert(loi(() => skillSchedule.setSkillDeadline(V.Admin, luot, 'listening', demoToday(), 'x'))?.status === 403, 'Dời hạn chấm → 403');
    assert(loi(() => hangLoat.xemTruoc(V.Admin, { viec: 'luu-tru', studentIds: [em.id] }))?.status === 403, 'hàng loạt (Lưu trữ) → 403');
    assert(/can\(PERMISSIONS\.CYCLE_EDIT\)/.test(doc('web/src/modules/classes/TabHocVienLop.tsx')), 'TabHocVienLop: chọn nhiều gắn cycle.edit');
  });

  check('OV10a-4 · thaoTacKyNang: quyền Huỷ / Đưa lại (huy) và Dời hạn (han) tách khỏi quanLy; không khai thì giữ nguyên như cũ', () => {
    const TT = ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su', 'huy-vang'];
    for (const tt of TT) for (const laFt of [true, false]) {
      const goc = { nhapDiem: false, quanLy: true, gvcn: false, laFt, dotHoanTat: false };
      assert(JSON.stringify(d.thaoTacKyNang(tt, goc)) === JSON.stringify(d.thaoTacKyNang(tt, { ...goc, huy: true, han: true })), `QL phải giữ nguyên ở ${tt}`);
      const a = d.thaoTacKyNang(tt, { ...goc, huy: false, han: false });
      const tat = [a.chinh, ...a.menu];
      for (const x of ['bo-ky-nang', 'dua-lai', 'doi-han']) assert(!tat.includes(x), `Admin không được thấy "${x}" ở ${tt}${laFt ? ' (FT)' : ''}`);
    }
    const a = d.thaoTacKyNang('dang-thi', { nhapDiem: false, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false, huy: false, han: false });
    assert(a.menu.includes('bao-vang') && a.menu.includes('doi-lich'), 'Admin vẫn Báo vắng / Dời lịch (plan.week)');
    for (const f of ['web/src/modules/cham/LuoiThuong.tsx', 'web/src/modules/test/keHoach/HopKyNang.tsx']) {
      assert(/huy: can\(PERMISSIONS\.ATTEMPT_SKIP_SKILL\)/.test(doc(f)) && /han: can\(PERMISSIONS\.DEADLINE_OVERRIDE\)/.test(doc(f)), `${f}: truyền huy / han theo can(PERMISSIONS…)`);
    }
    assert(/huy: d\.viewer\.canSkipSkill, han: d\.viewer\.canOverrideDeadline/.test(doc('web/src/modules/fasttrack/MockDetailPage.tsx')), 'MockDetailPage: huy / han theo cờ máy chủ');
  });

  check('OV10a-5 · link vào Test / Công việc: TVV · CX không có khu (nav.test / nav.work), Admin có Test + Công việc nhưng không Chờ duyệt; web gắn link theo nav', () => {
    for (const vai of ['TVV', 'CX'] as const) { const n = navOf(V[vai]); assert(!n.test && !n.work, `${vai}: không Test, không Công việc`); }
    const n = navOf(V.Admin);
    assert(n.test && n.work && !n.workApprove, 'Admin: có Test, Công việc, không Chờ duyệt');
    const lop = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(/x\.key === 'cham' && session\?\.nav\?\.test\b/.test(lop) && /x\.key === 'cho-duyet' && session\?\.nav\?\.workApprove\b/.test(lop), 'DauTrangLop: badge chờ chấm / chờ duyệt theo nav');
    const ds = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/x\.key === 'cham' && session\?\.nav\?\.test\b/.test(ds) && /x\.key === 'cho-duyet' && session\?\.nav\?\.workApprove\b/.test(ds), 'StudentsPage: như trên');
    assert(/session\?\.nav\?\.work\b/.test(doc('web/src/modules/phanTich/TongHopVanDeHv.tsx')), 'Tổng hợp vấn đề HV: link Công việc theo nav.work');
    assert(/session\?\.nav\?\.testPlan\b/.test(doc('web/src/modules/classes/ClassProgressPanel.tsx')), 'ClassProgressPanel: link Kế hoạch Test theo nav.testPlan');
  });

  check('OV10a-6 · Phân tích › Ý thức (discipline.stats): TVV · CX · Admin không có khoá, đường API 403; góc Ý thức ẩn', () => {
    for (const [vai, p] of Object.entries(V)) {
      assert(loi(() => yThucPt.yThucPhanTich(p, { branchId: null, ct: null, classId: null, from: '2026-08-01', to: '2026-09-14' }))?.status === 403, `${vai}: Ý thức phân tích phải 403`);
    }
    for (const k of ['consultant', 'cx', 'office_admin']) assert(!ROLE_PERMISSIONS[k].includes('discipline.stats'), `${k} không được có discipline.stats`);
    assert(/DISCIPLINE_STATS/.test(doc('web/src/modules/phanTich/PhanTich.tsx')), 'PhanTich: góc Ý thức gắn discipline.stats');
  });

  check('OV10a-7 · Admin: tên GV là link (như QL, có analysis.view_teacher); TVV · CX không', () => {
    assert(navOf(V.Admin).phanTichGv && !navOf(V.TVV).phanTichGv && !navOf(V.CX).phanTichGv, 'phanTichGv: Admin có, TVV / CX không');
    assert(/session\?\.nav\?\.phanTichGv/.test(doc('web/src/modules/classes/TenGiaoVien.tsx')), 'TenGiaoVien: link theo nav.phanTichGv');
  });

  check('OV10a-8 · Admin › Công việc: tab đổi tên "Chấm điểm"; vai khác giữ "Hỗ trợ học viên"', () => {
    assert(d.nhanTabCongViec('ho-tro', navOf(V.Admin)) === 'Chấm điểm', 'Admin: Chấm điểm');
    assert(d.nhanTabCongViec('ho-tro', navOf(P.cpManager)) === 'Hỗ trợ học viên', 'QL / Quản trị: Hỗ trợ học viên');
    assert(d.nhanTabCongViec('yeu-cau', navOf(V.Admin)) === 'Yêu cầu của tôi', 'tab khác giữ tên');
    assert(/nhanTabCongViec\(/.test(doc('web/src/modules/congViec/CongViecPage.tsx')), 'CongViecPage dùng nhanTabCongViec');
  });

  check('OV10a-9 · TVV / CX: ẩn "Đề xuất sửa" (sửa thẳng được); GVCN giữ — cờ `coTheDeXuatSua`', () => {
    const s = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(/onDeXuatSua=\{data\.viewer\.coTheDeXuatSua \?/.test(s), 'Panel Lộ trình chỉ nhận onDeXuatSua khi coTheDeXuatSua');
  });
}
