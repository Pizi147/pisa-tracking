/**
 * PHÉP KIỂM PR-Dọn-b — giao diện quản trị, Vận hành, lưu trữ và việc nhỏ (kế hoạch 2026-10-01-pr-don-ma-thua-quyen, Task 11–14,
 * mục "Bổ sung 02/10 cho PR-Dọn-b" A/B/C). Quét chữ bỏ chú thích; phần máy chủ gọi thẳng hàm dịch vụ.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
});
const webSrc = () => walk(path.join(ROOT, 'web/src')).map((f) => ({ f: path.relative(ROOT, f).replace(/\\/g, '/'), s: boChuThich(fs.readFileSync(f, 'utf8')) }));

export async function runPrDonBTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const loiCua = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const students: any = await import('../students/students.ts');
  const xkt: any = await import('../classes/xoaKetThucLop.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const mgmt: any = await import('../worklist/mgmttasks.ts');
  const meeting: any = await import('../worklist/meeting.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');

  // ------------------------------------------------------------------ khối 11 · form dùng useLoiForm, hộp Vận hành thành panel (O5)
  console.log('\nPR-Dọn-b · (11) Form: useLoiForm, hộp Vận hành thành panel');
  /* OV-11d (HV-15): panel Lộ trình FT chỉ còn lịch MT (không ô nhập) — bỏ khỏi danh sách form. */
  const FORM = ['platform/AccountsAdmin.tsx', 'platform/CatalogAdmin.tsx', 'students/IntakePanel.tsx',
    'classes/ClassProgressPanel.tsx', 'worklist/MgmtTasksPage.tsx'].map((f) => `web/src/modules/${f}`);
  check('Dọn-b (11a) · 5 panel form đều dùng useLoiForm: lf.o( trên ô, lf.bam() trước khi gửi', () => {
    for (const f of FORM) {
      const s = doc(f);
      assert(/import \{[^}]*useLoiForm/.test(s), `${f}: chưa import useLoiForm`);
      assert(s.includes('lf.o(') && s.includes('lf.bam()'), `${f}: thiếu lf.o( / lf.bam()`);
    }
  });
  check('Dọn-b (11b) · Vận hành: Cập nhật tiến độ / Sửa / Giao việc là panel, không còn <Modal (MgmtTasksPage, ManagerTasks)', () => {
    for (const f of ['web/src/modules/worklist/MgmtTasksPage.tsx', 'web/src/modules/worklist/ManagerTasks.tsx']) assert(!doc(f).includes('<Modal'), `${f} còn <Modal`);
  });

  // ------------------------------------------------------------------ khối 12 · Vận hành
  console.log('\nPR-Dọn-b · (12) Vận hành: nhãn trạng thái, một cửa Giao việc, Tutor ở ChonViec');
  check('Dọn-b (12a) · nhãn Vận hành = Chưa bắt đầu · Đang xử lý · Tạm ngưng · Dừng hẳn · Xong (THUAT_NGU C-069…C-073); web không còn "Tiếp tục xử lý"', () => {
    assert(JSON.stringify(d.TASK_PROGRESS_LABEL) === JSON.stringify({ not_started: 'Chưa bắt đầu', doing: 'Đang xử lý', done: 'Xong', paused: 'Tạm ngưng', stopped: 'Dừng hẳn' }),
      JSON.stringify(d.TASK_PROGRESS_LABEL));
    const sot = webSrc().filter((x) => x.s.includes('Tiếp tục xử lý')).map((x) => x.f);
    assert(sot.length === 0, sot.join(', '));
  });
  check('Dọn-b (12b) · cột trạng thái Vận hành dùng NhanTrangThai (nhãn chung), không còn <Status', () => {
    const s = doc('web/src/modules/worklist/MgmtTasksPage.tsx');
    assert(s.includes('<NhanTrangThai') && !s.includes('<Status'), 'MgmtTasksPage');
  });
  check('Dọn-b (12c) · Câu 1 = A: MỘT nút "+ Giao việc" (ở Vận hành); Báo cáo đơn vị chỉ còn link; form chọn Việc chi nhánh / Giao GV theo lớp + kỹ năng, gọi /mgmt-tasks và /tasks', () => {
    const co = webSrc().filter((x) => x.s.includes('+ Giao việc')).map((x) => `${x.f}×${x.s.split('+ Giao việc').length - 1}`);
    assert(co.length === 1 && co[0] === 'web/src/modules/worklist/MgmtTasksPage.tsx×1', co.join(', '));
    const hop = doc('web/src/modules/worklist/MeetingPage.tsx');
    assert(!hop.includes('<ManagerTasks ') && !hop.includes('<ManagerTasks\n') && hop.includes('Giao việc ở Vận hành'), 'MeetingPage');
    const vh = doc('web/src/modules/worklist/MgmtTasksPage.tsx');
    assert(vh.includes("'/mgmt-tasks'") && vh.includes("'/tasks'") && vh.includes('Việc chi nhánh') && vh.includes('Giao GV theo lớp + kỹ năng'), 'form Giao việc');
  });
  check('Dọn-b (12d) · ChonViec của đơn vị không chi nhánh (Tutor) chỉ liệt kê việc "Toàn hệ thống" — không trộn việc mọi chi nhánh', () => {
    const s = doc('web/src/modules/worklist/MeetingPage.tsx');
    assert(/branchId !== null \|\| r\.branchId === null/.test(s), 'ChonViec chưa lọc việc Tutor');
  });

  // ------------------------------------------------------------------ khối 13 · bảng quyền, Bỏ lưu trữ, Kết thúc lớp
  console.log('\nPR-Dọn-b · (13) Bảng quyền có chế độ Sửa, Bỏ lưu trữ có Hoàn tác, Kết thúc lớp');
  const quyenChuaCo = (role: string) => conn.prepare(`SELECT p.key FROM permissions p WHERE p.key NOT IN
      (SELECT pp.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions pp ON pp.id = rp.permission_id WHERE r.key = ?) ORDER BY p.key LIMIT 2`)
    .all(role).map((r: any) => r.key as string);
  const coQuyen = (role: string, perm: string) => !!get(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
      WHERE r.key = ? AND p.key = ?`, role, perm);
  const soNhatKy = () => get(`SELECT COUNT(*) n FROM audit_logs WHERE action LIKE 'role.permission.%'`).n as number;
  check('Dọn-b (13a) · Q23: PUT role-permissions nhận thayDoi[] — một giao dịch, mỗi ô một dòng nhật ký; một dòng sai khoá → 400, không ghi gì; không phải Quản trị → 403; trần 200; dạng một ô cũ vẫn nhận', () => {
    assert(typeof sysconfig.setRolePermissions === 'function', 'chưa có setRolePermissions');
    const [a, b] = quyenChuaCo('teacher');
    assert(a && b, 'seed: vai teacher thiếu quyền để thử');
    const truoc = soNhatKy();
    const sai = maLoi(() => sysconfig.setRolePermissions(P.admin, [{ roleKey: 'teacher', permissionKey: a, granted: true }, { roleKey: 'teacher', permissionKey: 'khong.co', granted: true }]));
    assert(sai === 400 && !coQuyen('teacher', a) && soNhatKy() === truoc, `sai khoá: ${sai}`);
    assert(maLoi(() => sysconfig.setRolePermissions(P.coreTeacher, [{ roleKey: 'teacher', permissionKey: a, granted: true }])) === 403, 'GV → 403');
    assert(maLoi(() => sysconfig.setRolePermissions(P.admin, Array.from({ length: 201 }, () => ({ roleKey: 'teacher', permissionKey: a, granted: true })))) === 400, 'trần 200');
    const r = sysconfig.setRolePermissions(P.admin, [{ roleKey: 'teacher', permissionKey: a, granted: true }, { roleKey: 'teacher', permissionKey: b, granted: true }]);
    assert(r.changed === 2 && coQuyen('teacher', a) && coQuyen('teacher', b) && soNhatKy() === truoc + 2, JSON.stringify(r));
    sysconfig.setRolePermission(P.admin, { roleKey: 'teacher', permissionKey: a, granted: false });
    sysconfig.setRolePermission(P.admin, { roleKey: 'teacher', permissionKey: b, granted: false });
    assert(!coQuyen('teacher', a) && !coQuyen('teacher', b), 'dạng một ô cũ');
    const route = fs.readFileSync(path.join(ROOT, 'server/src/routes/index.ts'), 'utf8');
    assert(/role-permissions[\s\S]{0,300}thayDoi/.test(route), 'route chưa đọc thayDoi');
  });
  check('Dọn-b (13b) · bảng quyền: nút "Sửa quyền" mở chế độ sửa; chân "n thay đổi · Huỷ thay đổi · Lưu"; ô không bấm được khi chưa sửa', () => {
    const s = doc('web/src/modules/platform/AdminPage.tsx');
    assert(s.includes('Sửa quyền') && s.includes('thay đổi') && /'Lưu'|>Lưu</.test(s) && s.includes("'Huỷ thay đổi'") && s.includes('disabled={!dangSua'), 'AdminPage');
    assert(s.includes('thayDoi'), 'Lưu gửi thayDoi');
  });
  check('Dọn-b (13c/13e) · Lưu trữ: Bỏ lưu trữ có Hoàn tác (lưu trữ lại em); dòng không mờ opacity-70', () => {
    const s = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(s.includes('hoanTac(') && s.includes('/archive`') && !s.includes('opacity-70'), 'LuuTruPage');
    const em = get(`SELECT id FROM students WHERE status = 'finished' ORDER BY id LIMIT 1`);
    assert(em, 'seed thiếu em đã kết thúc');
    students.archiveStudent(P.admin, em.id);
    students.unarchiveStudent(P.admin, em.id);
    assert(!get('SELECT archived_at a FROM students WHERE id = ?', em.id).a, 'bỏ lưu trữ');
    students.archiveStudent(P.admin, em.id);
    assert(get('SELECT archived_at a FROM students WHERE id = ?', em.id).a, 'hoàn tác → trở lại Lưu trữ');
  });
  check('Dọn-b (13d) · Kết thúc lớp còn em: lớp FT nói "chuyển lớp từng em hoặc chuyển nhiều em" (không "chuyển tiếp lớp"); lớp thường nói "Còn n em chưa chốt Lộ trình tiếp theo" (OV-11g); quyết định chờ → "Sắp chuyển · từ W…"', () => {
    const ft = xkt.xemXoaKetThuc(P.admin, classId('MB FT 101'));
    assert(/chuyển lớp từng em hoặc chuyển nhiều em/.test(ft.lyDoChanKetThuc ?? '') && !/chuyển tiếp lớp/.test(ft.lyDoChanKetThuc), ft.lyDoChanKetThuc);
    const th = xkt.xemXoaKetThuc(P.admin, classId('MB FOU 12'));
    assert(/^Còn \d+ em (chưa chốt Lộ trình tiếp theo|chờ tới tuần chuyển lớp)\.$/.test(th.lyDoChanKetThuc ?? ''), th.lyDoChanKetThuc);   // OV-11g CA2-4
    const cho = get(`SELECT lop_nguon_id id FROM lenh_chuyen_lop WHERE trang_thai = 'cho' ORDER BY id LIMIT 1`);
    assert(cho, 'seed thiếu quyết định chuyển lớp đang chờ');
    const c = xkt.xemXoaKetThuc(P.admin, cho.id);
    assert(/Sắp chuyển · từ W\d [A-Z]{3}/.test(c.conTreo ?? '') && !/lệnh/.test(c.conTreo), String(c.conTreo));
  });

  // ------------------------------------------------------------------ khối 14 · việc nhỏ
  console.log('\nPR-Dọn-b · (14) Hạn theo giờ VN, kéo thả tệp, nhận xét ở dòng thời gian lượt');
  check('Dọn-b (14a) · deadlineView: hạn 2026-09-21T18:30:00Z (= 01:30 22/09 giờ VN) không quá hạn ngày 22/09, là "hôm nay"', () => {
    const v = d.deadlineView({ kind: 'viec-van-hanh', due: '2026-09-21T18:30:00Z', today: '2026-09-22' });
    assert(v.quaHan === null && v.homNay === true, JSON.stringify(v));
  });
  check('Dọn-b (14b) · BangChung: rời khung chỉ khi ra khỏi khung ngoài (không nhấp nháy khi rê qua phần tử con)', () => {
    assert(/contains\(e\.relatedTarget/.test(doc('web/src/ui/BangChung.tsx')), 'onDragLeave');
  });
  check('Dọn-b (14c) · Dn7: ghi nhận xét W/S → lịch sử lượt có dòng kind "nhan_xet" (trước → sau rút gọn 80 ký tự); web có loại "Nhận xét"', () => {
    const a = get(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.kind = 'mock' AND a.status != 'cancelled' AND c.code = 'MB FT 101' ORDER BY a.id DESC LIMIT 1`);
    assert(a, 'seed thiếu lượt Mock');
    const dai = 'Bài viết ổn định, ý rõ. '.repeat(10);
    attempts.saveScore(P.admin, a.id, 'writing2', { nhanXet: dai });
    const h = attempts.scoreHistoryOf(a.id).find((x: any) => x.kind === 'nhan_xet' && x.skill === 'writing2');
    assert(h && h.after.length <= 80 && h.after.endsWith('…') && h.actorName, JSON.stringify(h));
    assert(doc('web/src/modules/fasttrack/DongThoiGianLuot.tsx').includes("'Nhận xét'"), 'DongThoiGianLuot');
  });

  // ------------------------------------------------------------------ khối 14b · sửa sau rà UXF-b (mục B)
  console.log('\nPR-Dọn-b · (14b) Sửa sau rà UXF-b');
  check('Dọn-b (B2) · Báo PH đã làm giữ nội dung: chỉ bỏ môn có Case đóng TRƯỚC ngày làm; việc chưa làm bỏ mọi môn đã "Không cần theo dõi"', () => {
    assert(typeof phoiHop.monTinhBaoPh === 'function', 'chưa có monTinhBaoPh');
    const bo = new Map([['reading', '2026-09-20'], ['grammar_vocab', '2026-09-10']]);
    const mon = ['reading', 'grammar_vocab', 'listening'];
    assert(JSON.stringify(phoiHop.monTinhBaoPh(mon, bo, '2026-09-15')) === JSON.stringify(['reading', 'listening']), 'đã làm 15/09');
    assert(JSON.stringify(phoiHop.monTinhBaoPh(mon, bo, null)) === JSON.stringify(['listening']), 'chưa làm');
  });
  check('Dọn-b (B3) · gõ mã tuần không năm → tuần GẦN hôm nay nhất (±6 tháng): cuối 12/2026 gõ "W1 JAN" = 04/01/2027; tuần xa hơn nửa năm hiện kèm năm để gõ lại vẫn đúng', () => {
    assert(d.docTuanLich('W1 JAN', '2026-12-28') === '2027-01-04', String(d.docTuanLich('W1 JAN', '2026-12-28')));
    assert(d.docTuanLich('W4 DEC', '2027-01-11') === '2026-12-21', String(d.docTuanLich('W4 DEC', '2027-01-11')));
    assert(d.docTuanLich('W5 SEP', '2026-09-14') === null, 'W5 SEP 2026 không có thật — không nhảy sang 2027');
    assert(d.tuanLich('2026-01-05', '2026-09-14') === 'W2 JAN 2026', d.tuanLich('2026-01-05', '2026-09-14'));
    assert(d.tuanLich('2026-09-21', '2026-09-14') === 'W4 SEP', 'tuần gần không thêm năm');
  });
  check('Dọn-b (B4) · ô tuần trên điện thoại gõ được chữ: ONgay kiểu tuần inputMode text; ô gõ của LichNho không còn numeric', () => {
    assert(/inputMode=\{kieu === 'tuan' \? 'text' : 'numeric'\}/.test(doc('web/src/ui/ONgay.tsx')), 'ONgay');
    assert(!doc('web/src/ui/LichNho.tsx').includes('inputMode="numeric"'), 'LichNho');
  });
  check('Dọn-b (B5) · "Tạm dừng từ" dùng hàm ngày chung (năm khác có năm)', () => {
    const hang = [{ short: 'R', label: 'Reading', category: 'reading', missed: true, cases: [{ status: 'open', trangThaiV4: { t: 'can-lam' }, plans: [] }] }];
    const nhan = d.oHocThuat(hang, '2025-12-10', '2026-09-14').dong[0].nhan;
    assert(nhan === 'Tạm dừng từ 10/12/2025', nhan);
    assert(!/const ngayNgan/.test(doc('shared/domain/hoSoHocVien.ts')), 'còn ngayNgan');
  });
  check('Dọn-b (B6) · không đưa mã tuần có năm (period.code) lên màn: vắng lớp thường, dời lịch FT, "Tuần … chưa bắt đầu"', () => {
    assert(!/tuanMoi: moi\.code/.test(doc('server/src/normal/regular.ts')), 'regular.ts');
    assert(!/Tuần \$\{period\.code/.test(doc('server/src/fasttrack/absence.ts')), 'absence.ts');
    assert(!/period\.code/.test(doc('server/src/platform/week.ts').split('export function reportEditWindow')[1] ?? ''), 'week.ts');
    assert(!/Tuần \$\{period\.code/.test(doc('server/src/worklist/meeting.ts')), 'meeting.ts');
    assert(/tuanLich\(r\.tuanMoi, homNay\)/.test(doc('web/src/modules/fasttrack/HopThaoTacMt.tsx')), 'HopThaoTacMt');
  });

  // ------------------------------------------------------------------ khối 14c · sửa sau rà Dọn-a / tích hợp (mục C, P2 rẻ)
  console.log('\nPR-Dọn-b · (14c) Sửa sau rà Dọn-a và tích hợp');
  check('Dọn-b (C1) · chặn bấm đúp không gộp hai việc KHÁC nhau: cùng tiêu đề nhưng khác người phụ trách / khác kỹ năng → hai việc', () => {
    const mb = get(`SELECT id FROM branches WHERE code = 'MB'`).id;
    const u2 = get(`SELECT ur.user_id id FROM user_roles ur WHERE ur.branch_id = ? AND ur.user_id != ? ORDER BY ur.user_id LIMIT 1`, mb, P.mbManager.userId).id;
    const v1 = mgmt.createMgmtTask(P.mbManager, { title: 'Dọn-b C1 kiểm sổ', group: 'curriculum', branchId: mb, assigneeUserId: P.mbManager.userId });
    const v2 = mgmt.createMgmtTask(P.mbManager, { title: 'Dọn-b C1 kiểm sổ', group: 'curriculum', branchId: mb, assigneeUserId: u2 });
    assert(v1.id !== v2.id, 'việc Vận hành bị gộp');
    const lop = classId('MB FT 101');
    const g1 = meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lop, topic: 'listening', title: 'Dọn-b C1 luyện thêm', idempotencyKey: 'donb-c1-g1' });
    const g2 = meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lop, topic: 'reading', title: 'Dọn-b C1 luyện thêm', idempotencyKey: 'donb-c1-g2' });
    assert(g1.id !== g2.id, 'việc giao GV bị gộp');
    /* PR-GVa: bấm đúp = gửi lại cùng khoá của lần mở form. */
    const g3 = meeting.createTask(P.mbManager, { kind: 'teacher_task', classId: lop, topic: 'reading', title: 'Dọn-b C1 luyện thêm', idempotencyKey: 'donb-c1-g2' });
    assert(g3.id === g2.id, 'bấm đúp vẫn trả việc cũ');
  });
  check('Dọn-b (C2) · lý do đổi Target và lý do đề xuất chuyển lớp đi qua chuTuDo (trần 2 000 ký tự)', () => {
    const cy = get(`SELECT cy.id, cy.target_score t FROM learning_cycles cy JOIN students s ON s.id = cy.student_id WHERE cy.status = 'active' AND s.status = 'active' ORDER BY cy.id LIMIT 1`);
    assert(/Tối đa 2000 ký tự/.test(loiCua(() => cycles.reviseTarget(P.admin, cy.id, { newTarget: cy.t === 8 ? 7.5 : 8, reason: 'x'.repeat(2001) }))), 'reviseTarget');
    const em = get(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.status = 'active' AND s.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho') ORDER BY e.student_id LIMIT 1`);
    assert(/Tối đa 2000 ký tự/.test(loiCua(() => lenh.guiDeXuatChuyenLop(P.admin, em.id, { lyDo: 'y'.repeat(2001) }))), 'guiDeXuatChuyenLop');
  });
  check('Dọn-b (C3) · điện thoại: bấm chuông / tài khoản đóng ô tìm (không chồng hai khung); web không còn invalidate(\'/overview\') (route đã xoá)', () => {
    const h = doc('web/src/modules/platform/Header.tsx');
    assert(/notifications\.reload\(\);[^\n]*setMoTimDt\(false\)/.test(h) && /'account'\); setMoTimDt\(false\)/.test(h), 'Header: chuông + tài khoản phải đóng ô tìm');
    const sot = webSrc().filter((x) => x.s.includes("invalidate('/overview')")).map((x) => x.f);
    assert(sot.length === 0, sot.join(', '));
  });

  // ------------------------------------------------------------------ khối YT · Ý thức hồ sơ HV (chủ sản phẩm 02/10)
  console.log('\nPR-Dọn-b · (YT) Ý thức: chữ cấp bậc, Đã ghi nhận, nút xử lý đồng bộ hồ sơ HV / hồ sơ lớp');
  check('Dọn-b (YT1) · không còn chữ "Khai bậc" / "đã khai" trên màn; dùng "Đã có mức độ vi phạm từ trước?" + "Xác nhận cấp bậc vi phạm"', () => {
    const sot = webSrc().filter((x) => /[Kk]hai bậc|[Đđ]ã khai|bậc khai/.test(x.s)).map((x) => x.f);
    assert(sot.length === 0, sot.join(', '));
    const svSot = ['server/src/worklist/mywork.ts', 'server/src/yThuc/xuLy.ts', 'shared/domain/nhatKy.ts'].filter((f) => /[Kk]hai bậc|bậc khai/.test(doc(f)));
    assert(svSot.length === 0, svSot.join(', '));
    const th = doc('web/src/modules/yThuc/ThangYThuc.tsx');
    assert(th.includes('Đã có mức độ vi phạm từ trước?') && th.includes('Xác nhận cấp bậc vi phạm'), 'ThangYThuc');
  });
  check('Dọn-b (YT2) · nhãn vi phạm đã xem chỉ "Đã ghi nhận" (không "· vẫn tính"); toast không nhắc "vẫn tính"', () => {
    const sot = webSrc().filter((x) => x.f.includes('/yThuc/') && /vẫn tính|vẫn đếm/.test(x.s)).map((x) => x.f);
    assert(sot.length === 0, sot.join(', '));
  });
  check('Dọn-b (YT3–5) · khối Thang có hai nút cùng cỡ "Xác nhận xử lý" + "Đề xuất QL duyệt"; nút không kèm tên bậc; hồ sơ HV và hồ sơ lớp cùng truyền onXuLy (xử lý được cả khi mới 1 vi phạm)', () => {
    const th = doc('web/src/modules/yThuc/ThangYThuc.tsx');
    assert(/className="btn btn-primary[^"]*" onClick=\{onXuLy\}>Xác nhận xử lý</.test(th) && /onClick=\{onDeXuat\}>Đề xuất QL duyệt</.test(th) && !th.includes('Đề xuất QL duyệt…'), 'ThangYThuc');
    const sotBac = webSrc().filter((x) => x.f.includes('/yThuc/') && /Xác nhận xử lý\$\{|`Xác nhận xử lý ·|Xác nhận xử lý · \$\{/.test(x.s)).map((x) => x.f);
    assert(sotBac.length === 0, sotBac.join(', '));
    for (const f of ['web/src/modules/yThuc/StudentYThucSection.tsx', 'web/src/modules/yThuc/ClassYThucCard.tsx']) assert(/<ThangYThuc[\s\S]{0,400}onXuLy=/.test(doc(f)), f);
    /* OV-12e (mockup panel v3 §8, chủ SP 14/10): trong panel "Đề xuất QL duyệt" là nút chữ ngay sau nút chính Xác nhận xử lý (khối Cần làm). */
    assert(/cheDo === 'xu-ly' && d\.canManage[\s\S]{0,300}Đề xuất QL duyệt<\/NutChu>/.test(doc('web/src/modules/yThuc/XacNhanXuLyPanel.tsx')), 'panel: Đề xuất là nút chữ sau nút chính');
  });

  // ------------------------------------------------------------------ khối A · mã cũ Dọn-a / S3 để lại
  console.log('\nPR-Dọn-b · (A) Mã cũ để lại');
  check('Dọn-b (A1) · web không gửi trongPhamVi (máy chủ đã luôn lọc theo phạm vi)', () => {
    const sot = webSrc().filter((x) => x.s.includes('trongPhamVi')).map((x) => x.f);
    assert(sot.length === 0, sot.join(', '));
  });
  check('Dọn-b (A2) · bỏ 4 cờ quyền cũ mocks/meeting/academic/mgmtTasks, NEXT_STEP_HINT, import chết JOURNEY_EVENT_LABEL', () => {
    assert(!/mocks: boolean|mgmtTasks/.test(doc('shared/domain/dieuHuong.ts')), 'dieuHuong.ts');
    assert(!/mocks:|mgmtTasks:/.test(doc('server/src/platform/nav.ts')), 'nav.ts');
    assert(d.NEXT_STEP_HINT === undefined, 'NEXT_STEP_HINT');
    assert(!doc('web/src/modules/students/StudentDetailPage.tsx').includes('JOURNEY_EVENT_LABEL'), 'StudentDetailPage');
  });
}
