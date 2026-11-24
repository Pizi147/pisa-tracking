/**
 * PHÉP KIỂM VH-1 (N59, chủ SP 20/11 — việc Vận hành, máy chủ; thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` C):
 *  · CX tạo + giao được, GV thường 403 · người nhận ngoài chi nhánh 400, BPXL nhận được.
 *  · Nhóm tự đặt: tạo / đổi tên / sắp ▲▼ / ẩn (+ ô chọn bỏ nhóm ẩn, việc cũ giữ) · quyền chi nhánh · nhóm dùng chung chỉ người toàn hệ thống.
 *  · Theo dõi (người tạo tự vào) + chuông đúng người (không gửi người thao tác) · người phụ trách sửa hạn không lý do, không sửa được trường khác.
 *  · Lặp lại: đúng một bản mỗi kỳ (kèm việc con, người theo dõi), chạy lại không trùng, Dừng lặp / Hoàn tác · kỳ hằng tháng ngày 31.
 *  · Tệp: thêm / xoá / quyền xem · xoá tài khoản / hết vai → việc "Chưa giao" + lịch sử · id dùng lại không thừa hưởng người theo dõi.
 *  · /my-work (Việc được giao kèm nhóm, BPXL), /my-work/theo-doi, /mgmt-tasks có nhóm · migrate hai lần.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVanHanhTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t as any;
  console.log('\nVH-1 · việc Vận hành: nhóm tự đặt · CX giao · theo dõi + chuông · hạn · lặp lại · tệp');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const mg: any = await import('../worklist/mgmttasks.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const att: any = await import('../platform/attachments.ts');
  const xoaTK: any = await import('../platform/xoaTaiKhoan.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ma = async (fn: () => unknown) => { try { await fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const MB = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const CP = mot(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const ql = P.mbManager; const gvcn = P.coreTeacher;
  let soTk = 0;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `vanhanh.${ten}.${++soTk}${accounts.EMAIL_SUFFIX}`, password: `matkhau-vanhanh-${ten}`, fullName: `VANHANH ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const cx = taiKhoan('cx', 'cx'); const cxCp = taiKhoan('cxcp', 'cx', 'CP'); const tvv = taiKhoan('tvv', 'consultant');
  const bpxl = taiKhoan('bpxl', 'scheduler'); const ngoai = taiKhoan('ngoai', 'consultant', 'CP');
  const tin = (uid: number, id: number) => hang(`SELECT dedup_key FROM notifications WHERE user_id = ? AND dedup_key LIKE ?`, uid, `gv:van_hanh:${id}:%`).map((r) => r.dedup_key as string);
  const tao = (p: any, o: Record<string, unknown> = {}) => mg.createMgmtTask(p, { title: `VH việc ${++soTk}`, branchId: MB, ...o });

  await checkAsync('VH1-1 · CX tạo + giao (kể cả BPXL); GV thường 403; người nhận ngoài chi nhánh 400; CX chi nhánh khác 403', () => thu(async () => {
    const v = tao(cx, { assigneeUserId: bpxl.userId, due: addDays(TODAY, 5) });
    assert(v.assigneeUserId === bpxl.userId && v.theoDoi.some((x: any) => x.id === cx.userId), `CX tạo + tự theo dõi: ${JSON.stringify(v.theoDoi)}`);
    assert(await ma(() => tao(gvcn)) === 403, 'GV thường tạo → 403');
    assert(await ma(() => tao(cx, { assigneeUserId: ngoai.userId })) === 400, 'người nhận chi nhánh khác → 400');
    assert(await ma(() => tao(cx, { theoDoiIds: [ngoai.userId] })) === 400, 'người theo dõi chi nhánh khác → 400');
    assert(await ma(() => tao(cxCp)) === 403, 'CX CP tạo việc MB → 403');
    assert(await ma(() => mg.editMgmtTask(cxCp, v.id, { title: 'Sửa trộm' })) === 403, 'CX CP sửa việc MB → 403');
    assert(mg.listMgmtTasks(cx, {}).rows.some((r: any) => r.id === v.id), 'CX thấy bảng Vận hành chi nhánh mình');
    assert(!mg.listMgmtTasks(cxCp, {}).rows.some((r: any) => r.id === v.id), 'CX CP không thấy việc MB');
    assert(mg.listMgmtTasks(gvcn, {}).scopeEmpty === true, 'GV không thấy bảng');
  }));

  await checkAsync('C-5 (N63 ⑧) · 4 nhóm Vận hành khởi đầu chỉ Quản trị sửa: CX / Head toàn hệ thống 403 + coTheSua false; Quản trị 200', () => thu(async () => {
    const cxAll = loadPrincipal(accounts.createAccount(P.admin, { email: `vanhanh.cxall${accounts.EMAIL_SUFFIX}`, password: 'matkhau-vanhanh-cxall', fullName: 'VANHANH CXALL', roles: [{ role: 'cx', branches: [] }] }).userId as number);
    const g = mot(`SELECT id FROM task_groups WHERE khoa = 'teacher'`).id as number;
    assert(await ma(() => mg.suaNhom(cxAll, g, { ten: 'Đổi tên khởi đầu' })) === 403, 'CX toàn hệ thống sửa nhóm khởi đầu → 403');
    assert(mg.listNhom(cxAll).rows.filter((x: any) => x.khoa).every((x: any) => !x.coTheSua), 'CX toàn hệ thống: coTheSua phải false cho nhóm khởi đầu');
    assert(await ma(() => mg.suaNhom(P.admin, g, { an: false })) === 200, 'Quản trị sửa nhóm khởi đầu → 200');
    assert(mg.listNhom(P.admin).rows.filter((x: any) => x.khoa).every((x: any) => x.coTheSua), 'Quản trị: coTheSua true');
  }));

  await checkAsync('VH1-2 · nhóm: tạo / đổi tên / sắp ▲▼ / ẩn (ô chọn bỏ nhóm ẩn, việc cũ giữ) · quyền chi nhánh · nhóm dùng chung', () => thu(async () => {
    const a = mg.taoNhom(cx, { ten: 'Cơ sở vật chất', branchId: MB }).rows.find((g: any) => g.ten === 'Cơ sở vật chất');
    const b = mg.taoNhom(cx, { ten: 'Tuyển sinh', branchId: MB }).rows.find((g: any) => g.ten === 'Tuyển sinh');
    assert(a && b && a.thuTu < b.thuTu && a.coTheSua, `tạo: ${JSON.stringify([a, b])}`);
    assert(await ma(() => mg.taoNhom(cx, { ten: 'cơ sở vật chất', branchId: MB })) === 400, 'trùng tên → 400');
    assert(await ma(() => mg.taoNhom(ql, { ten: 'Chung mới', branchId: null })) === 403, 'Head một chi nhánh tạo nhóm dùng chung → 403');
    assert(mg.taoNhom(P.admin, { ten: 'Chung mới', branchId: null }).rows.some((g: any) => g.ten === 'Chung mới' && g.branchId === null), 'Quản trị tạo nhóm dùng chung');
    assert(await ma(() => mg.suaNhom(cxCp, a.id, { ten: 'X' })) === 403, 'CX CP sửa nhóm MB → 403');
    assert(await ma(() => mg.suaNhom(ql, mot(`SELECT id FROM task_groups WHERE khoa = 'teacher'`).id, { ten: 'X' })) === 403, 'Head MB sửa nhóm dùng chung → 403');
    mg.suaNhom(ql, a.id, { ten: 'CSVC' });
    const sau = mg.suaNhom(ql, b.id, { doi: -1 }).rows;
    const ia = sau.findIndex((g: any) => g.id === a.id); const ib = sau.findIndex((g: any) => g.id === b.id);
    assert(sau[ia].ten === 'CSVC' && ib < ia, `đổi tên + ▲: ${JSON.stringify(sau.map((g: any) => [g.id, g.ten, g.thuTu]))}`);
    const v = tao(cx, { groupId: a.id });
    assert(v.groupId === a.id && v.groupName === 'CSVC', 'việc vào nhóm');
    mg.suaNhom(cx, a.id, { an: true });
    assert(await ma(() => tao(cx, { groupId: a.id })) === 400, 'nhóm ẩn không chọn được cho việc mới');
    assert(mg.editMgmtTask(cx, v.id, { title: 'Đổi tên, giữ nhóm ẩn', groupId: a.id }).groupId === a.id, 'việc cũ giữ nhóm ẩn');
    const bang = mg.listMgmtTasks(cx, {});
    assert(bang.nhom.some((g: any) => g.id === a.id && g.an && g.n >= 1), `hàng nhóm ẩn còn việc: ${JSON.stringify(bang.nhom)}`);
    assert(await ma(() => tao(cx, { groupId: mg.taoNhom(cxCp, { ten: 'Riêng CP', branchId: CP }).rows.find((g: any) => g.ten === 'Riêng CP').id })) === 400, 'nhóm chi nhánh khác → 400');
    const k = tao(cx, {});
    assert(k.groupId === null && mg.listMgmtTasks(cx, { groupId: 'none' }).rows.some((r: any) => r.id === k.id), 'không chọn = Không phân loại');
    const cu = tao(cx, { group: 'curriculum' });
    assert(cu.group === 'curriculum' && cu.groupName === 'Giáo trình', 'web cũ gửi khoá nhóm khởi đầu');
  }));

  await checkAsync('VH1-3 · theo dõi + chuông đúng người (không gửi người thao tác) · người phụ trách sửa hạn không lý do · không sửa trường khác', () => thu(async () => {
    const v = tao(cx, { assigneeUserId: gvcn.userId, theoDoiIds: [tvv.userId], due: addDays(TODAY, 3) });
    assert(tin(gvcn.userId, v.id).length === 1 && tin(tvv.userId, v.id).length === 1 && tin(cx.userId, v.id).length === 0, 'giao: người phụ trách + người theo dõi, không người tạo');
    mg.updateMgmtTask(gvcn, v.id, { progress: 'doing', note: 'Đã liên hệ nhà cung cấp' });
    assert(tin(cx.userId, v.id).some((k) => /:tien_do:/.test(k)) && tin(tvv.userId, v.id).some((k) => /:tien_do:/.test(k)), 'tiến độ: người tạo + người theo dõi');
    assert(!tin(gvcn.userId, v.id).some((k) => /:tien_do:/.test(k)), 'không gửi chính người cập nhật');
    const d = mg.editMgmtTask(gvcn, v.id, { due: addDays(TODAY, 9) });
    assert(d.due === addDays(TODAY, 9) && d.dueHistory.at(-1).reason === null, 'người phụ trách dời hạn không lý do');
    assert(tin(cx.userId, v.id).some((k) => /:han:/.test(k)) && !tin(gvcn.userId, v.id).some((k) => /:han:/.test(k)), 'đổi hạn: báo người khác');
    mg.editMgmtTask(ql, v.id, { due: addDays(TODAY, 12) });
    assert(mot(`SELECT COUNT(*) n FROM task_history WHERE task_id = ? AND field = 'due_date'`, v.id).n === 2, 'Head dời không lý do, lịch sử giữ');
    assert(await ma(() => mg.editMgmtTask(gvcn, v.id, { title: 'Đổi tên' })) === 403, 'người phụ trách đổi tên → 403');
    assert(await ma(() => mg.editMgmtTask(tvv, v.id, { due: TODAY })) === 403, 'người theo dõi sửa hạn → 403');
    assert(await ma(() => mg.updateMgmtTask(tvv, v.id, { progress: 'done' })) === 403, 'người theo dõi cập nhật → 403');
    assert(mg.mgmtTaskDetail(tvv, v.id).viewer.canEdit === false, 'người theo dõi xem được');
    /* Đổi người: người trước theo dõi tiếp + nhận tin; người mới nhận tin. */
    mg.editMgmtTask(cx, v.id, { assigneeUserId: bpxl.userId });
    assert(tin(bpxl.userId, v.id).some((k) => /:giao:/.test(k)) && tin(gvcn.userId, v.id).filter((k) => /:giao:/.test(k)).length === 2, 'đổi người: người mới + người cũ');
    assert(mg.mgmtTaskDetail(cx, v.id).theoDoi.some((x: any) => x.id === gvcn.userId), 'người phụ trách trước theo dõi tiếp');
    mg.updateMgmtTask(bpxl, v.id, { progress: 'done' });
    assert(tin(cx.userId, v.id).some((k) => /:xong:/.test(k)) && tin(gvcn.userId, v.id).some((k) => /:xong:/.test(k)), 'xong: báo người theo dõi');
    /* Bớt người theo dõi (thay danh sách). */
    mg.editMgmtTask(cx, v.id, { theoDoiIds: [cx.userId] });
    assert(JSON.stringify(mg.mgmtTaskDetail(cx, v.id).theoDoi.map((x: any) => x.id)) === JSON.stringify([cx.userId]), 'thay danh sách theo dõi');
    assert(await ma(() => mg.mgmtTaskDetail(tvv, v.id)) === 403, 'bị bỏ theo dõi → không xem được');
  }));

  await checkAsync('VH1-4 · lặp lại: đúng một bản mỗi kỳ (kèm việc con + người theo dõi), chạy lại không trùng, Dừng lặp / Hoàn tác', () => thu(async () => {
    const goc = tao(cx, { title: 'Kiểm kê tủ hồ sơ', assigneeUserId: gvcn.userId, theoDoiIds: [tvv.userId], due: addDays(TODAY, 2), lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    const con = tao(cx, { title: 'Chụp ảnh tủ', parentTaskId: goc.id, assigneeUserId: bpxl.userId, due: addDays(TODAY, 1) });
    const ban = (ky: string) => hang(`SELECT * FROM tasks WHERE lap_goc_id IN (?, ?) AND lap_ky = ? ORDER BY id`, goc.id, con.id, ky);
    assert(mg.taoViecLap(TODAY).tao === 0, 'cùng kỳ với việc gốc → không tạo');
    const k1 = addDays(TODAY, 1);
    const r1 = mg.taoViecLap(k1);
    const b1 = ban(k1);
    assert(r1.tao === 2 && b1.length === 2, `kỳ mới: bản cha + bản con (${JSON.stringify(r1)})`);
    const cha = b1.find((x: any) => !x.parent_task_id); const conMoi = b1.find((x: any) => x.parent_task_id);
    assert(cha.progress === 'not_started' && cha.due_date === addDays(k1, 2) && cha.assignee_user_id === gvcn.userId && cha.lap_kieu === null, `bản cha: ${JSON.stringify(cha)}`);
    assert(conMoi.parent_task_id === cha.id && conMoi.due_date === addDays(k1, 1) && conMoi.assignee_user_id === bpxl.userId, 'bản con trỏ bản cha mới, hạn theo kỳ');
    assert(hang(`SELECT user_id FROM viec_theo_doi WHERE loai = 'van_hanh' AND ref_id = ?`, cha.id).some((r) => r.user_id === tvv.userId), 'người theo dõi chép theo');
    assert(hang(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?`, gvcn.userId, `vh:lap:${cha.id}`).length === 1, 'chuông người phụ trách bản mới');
    assert(mg.taoViecLap(k1).tao === 0 && ban(k1).length === 2, 'chạy lại cùng đêm → không trùng');
    assert(mg.mgmtTaskDetail(cx, cha.id).lap?.kieu === 'tuan', 'bản theo kỳ đọc lặp của việc gốc');
    mg.dungLap(cx, cha.id, true);
    assert(mot('SELECT lap_dung_luc FROM tasks WHERE id = ?', goc.id).lap_dung_luc && mg.taoViecLap(addDays(TODAY, 2)).tao === 0, 'Dừng lặp (từ bản theo kỳ) → không tạo');
    assert(cha.progress === 'not_started' && mot('SELECT progress FROM tasks WHERE id = ?', cha.id).progress === 'not_started', 'bản đang mở giữ nguyên');
    assert(await ma(() => mg.dungLap(gvcn, goc.id, false)) === 403, 'GV Hoàn tác Dừng lặp → 403');
    mg.dungLap(cx, goc.id, false);
    assert(mg.taoViecLap(addDays(TODAY, 2)).tao === 2, 'Hoàn tác Dừng lặp → tạo lại');
    assert(await ma(() => tao(cx, { parentTaskId: goc.id, lap: { kieu: 'tuan', ngay: [1] } })) === 400, 'việc con không đặt lặp riêng');
    assert(await ma(() => tao(cx, { lap: { kieu: 'tuan', ngay: [] } })) === 400 && await ma(() => tao(cx, { lap: { kieu: 'thang', ngay: [32] } })) === 400, 'lặp sai → 400');
  }));

  check('VH1-5 · kỳ gần nhất: hằng tháng ngày 31 → ngày cuối tháng ngắn · hằng tuần nhiều thứ', () => {
    assert(mg.kyGanNhat({ kieu: 'thang', ngay: [31] }, '2027-02-28') === '2027-02-28', 'tháng 2: ngày 31 → 28');
    assert(mg.kyGanNhat({ kieu: 'thang', ngay: [31] }, '2027-03-30') === '2027-02-28', 'trước ngày 31 tháng 3 → kỳ tháng 2');
    assert(mg.kyGanNhat({ kieu: 'thang', ngay: [15] }, '2027-03-15') === '2027-03-15', 'đúng ngày');
    /* 2026-11-23 là thứ Hai. */
    assert(mg.kyGanNhat({ kieu: 'tuan', ngay: [1, 3] }, '2026-11-24') === '2026-11-23', 'T3 → kỳ T2 hôm qua');
    assert(mg.kyGanNhat({ kieu: 'tuan', ngay: [1, 3] }, '2026-11-25') === '2026-11-25', 'T4 đúng kỳ');
  });

  await checkAsync('VH1-6 · tệp: người phụ trách thêm, người theo dõi xem không thêm, người ngoài không xem, người tạo xoá', () => thu(async () => {
    const v = tao(cx, { assigneeUserId: gvcn.userId, theoDoiIds: [tvv.userId] });
    const tep = att.addLink(gvcn, { ownerType: 'task', ownerId: v.id, url: 'https://example.com/bao-gia-vh1' });
    assert(tep.ownerType === 'task', 'người phụ trách thêm tệp');
    assert(att.listAttachments(tvv, 'task', v.id).length === 1, 'người theo dõi xem tệp');
    assert(await ma(() => att.addLink(tvv, { ownerType: 'task', ownerId: v.id, url: 'https://example.com/x' })) === 403, 'người theo dõi thêm → 403');
    assert(await ma(() => att.listAttachments(ngoai, 'task', v.id)) === 403, 'người ngoài xem → 403');
    assert(mg.mgmtTaskDetail(cx, v.id).tep.length === 1 && mg.listMgmtTasks(cx, {}).rows.find((r: any) => r.id === v.id).soTep === 1, 'chi tiết + bảng có tệp');
    assert(await ma(() => att.removeAttachment(tvv, tep.id)) === 403, 'người theo dõi xoá → 403');
    await att.removeAttachment(cx, tep.id);
    assert(att.listAttachments(cx, 'task', v.id).length === 0, 'người tạo xoá (vào thùng rác)');
  }));

  await checkAsync('VH1-7 · hết vai / xoá tài khoản → việc "Chưa giao" + lịch sử; id dùng lại không thừa hưởng người theo dõi', () => thu(async () => {
    const tam = taiKhoan('tam', 'teacher');
    const v = tao(cx, { assigneeUserId: tam.userId });
    accounts.setRoles(P.admin, tam.userId, [{ role: 'teacher', branches: ['CP'] }]);
    assert(mot('SELECT assignee_user_id FROM tasks WHERE id = ?', v.id).assignee_user_id === null, 'hết vai MB → không người phụ trách');
    assert(mot(`SELECT COUNT(*) n FROM task_history WHERE task_id = ? AND field = 'assignee_user_id' AND new_value IS NULL`, v.id).n === 1, 'có lịch sử');
    const tam2 = taiKhoan('tam2', 'scheduler');
    const w = tao(cx, { assigneeUserId: tam2.userId });
    xoaTK.xoaTaiKhoan(P.admin, tam2.userId);
    assert(mot('SELECT assignee_user_id FROM tasks WHERE id = ?', w.id).assignee_user_id === null, 'xoá tài khoản → không người phụ trách');
    /* Toàn hệ thống: người có vai ở chi nhánh nào cũng còn hiệu lực. */
    const tam3 = taiKhoan('tam3', 'teacher');
    const toan = mg.createMgmtTask(P.admin, { title: 'Việc toàn hệ thống VH1-7', assigneeUserId: tam3.userId });
    accounts.setRoles(P.admin, tam3.userId, [{ role: 'teacher', branches: ['CP'] }]);
    assert(mot('SELECT assignee_user_id FROM tasks WHERE id = ?', toan.id).assignee_user_id === tam3.userId, 'việc toàn hệ thống giữ người');
    /* id dùng lại (INTEGER PRIMARY KEY không AUTOINCREMENT): xoá dòng việc (đường ghi đảo dùng LOAI_CUA_BANG → donViec) rồi tạo lại cùng id. */
    assert(gv.LOAI_CUA_BANG.tasks === 'van_hanh', 'bảng tasks có loại van_hanh (ghi đảo gọi donViec)');
    const x = tao(ql, { theoDoiIds: [tvv.userId] });
    const maxId = mot('SELECT MAX(id) m FROM tasks').m;
    assert(x.id === maxId, 'việc thử là id lớn nhất');
    conn.prepare('DELETE FROM tasks WHERE id = ?').run(x.id); gv.donViec('van_hanh', [x.id]);
    const y = tao(cx, {});
    assert(y.id === x.id && !y.theoDoi.some((u: any) => u.id === tvv.userId || u.id === ql.userId), `id dùng lại không thừa hưởng: ${JSON.stringify(y.theoDoi)}`);
  }));

  await checkAsync('VH1-8 · /my-work "Việc được giao" kèm nhóm (GV, BPXL thuần); Head không lặp; /my-work/theo-doi có việc Vận hành', () => thu(async () => {
    const nhom = mot(`SELECT id, ten FROM task_groups WHERE khoa = 'teacher'`);
    const v = tao(cx, { assigneeUserId: bpxl.userId, groupId: nhom.id, theoDoiIds: [tvv.userId], due: addDays(TODAY, -1) });
    const c = tao(cx, { parentTaskId: v.id, title: 'Việc con VH1-8', assigneeUserId: gvcn.userId });
    xoaNho();
    const cuaBpxl = myWork(loadPrincipal(bpxl.userId) as any) as any;
    const d = cuaBpxl.items.find((x: any) => x.key === `mgmt:${v.id}`);
    assert(d && d.nhomViec?.id === nhom.id && d.urgency === 'overdue' && d.giaoBoi === cx.fullName, `BPXL thuần: ${JSON.stringify(d)}`);
    const dc = (myWork(gvcn) as any).items.find((x: any) => x.key === `mgmt:${c.id}`);
    assert(dc && dc.nhomViec?.id === nhom.id && /Việc con của/.test(dc.contextLabel), `GV: việc con theo nhóm việc cha: ${JSON.stringify(dc)}`);
    assert(!(myWork(ql) as any).items?.some((x: any) => x.key === `mgmt:${v.id}`), 'Head không lặp ở Công việc');
    const td = gv.viecTheoDoi(tvv).nhom.find((g: any) => g.loai === 'van_hanh');
    assert(td && td.mo.some((x: any) => x.refId === v.id && x.studentId === null && x.quaHan), `Đang theo dõi: ${JSON.stringify(td)}`);
    assert(!gv.viecTheoDoi(bpxl).nhom.some((g: any) => g.mo.some((x: any) => x.refId === v.id)), 'việc mình phụ trách không ở Đang theo dõi');
  }));

  // ---------------------------------------------------------------- rà sâu PTA #1929
  const meetingSvc: any = await import('../worklist/meeting.ts');
  const dcs: any = await import('../ops/doiChieuSo.ts');

  /* VH-2 (N59) → N63 ③: CX / Head có bảng Vận hành VÀ nhận mọi việc giao cho chính mình ở /my-work (Việc được giao); việc mình giao người khác không vào /my-work của mình. */
  await checkAsync('VH1-10 (PTA 1 → VH-2) · CX thuần + CX kèm GV có bảng Vận hành: việc giao cho mình (có / không hạng mục) ở /my-work; việc mình giao người khác thì không (N63 ③)', () => thu(async () => {
    const { navOf } = await import('../platform/nav.ts');
    const cxGv = loadPrincipal(accounts.createAccount(P.admin, { email: `vanhanh.cxgv.${++soTk}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-vanhanh-cxgv', fullName: 'VANHANH CXGV',
      roles: [{ role: 'cx', branches: ['MB'] }, { role: 'teacher', branches: ['MB'] }] }).userId as number);
    const a = tao(ql, { assigneeUserId: cx.userId }); const b = tao(ql, { assigneeUserId: cxGv.userId });
    const am = tao(ql, { assigneeUserId: cx.userId, hangMuc: 'bao-ph' });
    xoaNho();
    assert((navOf(loadPrincipal(cx.userId) as any) as any).vanHanh && (navOf(cxGv as any) as any).vanHanh, 'CX có bảng Vận hành (nav.vanHanh)');
    const viecCx = (myWork(loadPrincipal(cx.userId) as any) as any).items ?? [];   // không việc nào → máy chủ trả không có `items`
    assert(viecCx.some((x: any) => x.key === `mgmt:${a.id}`) && viecCx.some((x: any) => x.key === `mgmt:${am.id}`), 'CX thuần: việc giao cho mình (có / không hạng mục)');
    assert(((myWork(loadPrincipal(cxGv.userId) as any) as any).items ?? []).some((x: any) => x.key === `mgmt:${b.id}`), 'CX kèm GV: việc giao cho mình');
    const c = tao(cx, { assigneeUserId: ql.userId });
    assert((myWork(ql) as any).items.some((x: any) => x.key === `mgmt:${c.id}`), 'Head: việc CX giao cho mình');
    assert(!(myWork(ql) as any).items.some((x: any) => x.key === `mgmt:${a.id}`), 'Head: việc mình giao CX không vào /my-work của mình');
    assert(!(myWork(ql, { nguoi: 'tat-ca' }) as any).items.filter((x: any) => x.key === `mgmt:${c.id}`).slice(1).length, 'Head Tất cả: không hai dòng');
  }));

  await checkAsync('VH1-11 (PTA 2) · web cũ: thân PATCH như MgmtTasksPage — nhóm không đổi ngầm, MỘT người theo dõi = thay đúng người đó (null = bỏ), người khác giữ', () => thu(async () => {
    const tu = mg.taoNhom(cx, { ten: 'Nhóm VH1-11', branchId: MB }).rows.find((g: any) => g.ten === 'Nhóm VH1-11');
    const v = tao(cx, { groupId: tu.id, theoDoiIds: [tvv.userId, bpxl.userId] });
    const d0 = mg.mgmtTaskDetail(cx, v.id);
    const than = (watcherUserId: number | null) => ({ title: d0.title, group: d0.group ?? 'curriculum', assigneeUserId: null, assigneeName: null, watcherUserId, due: null, lyDoDoiHan: null, note: null });
    const w0 = d0.watcherUserId;
    assert(w0 === tvv.userId, `người web cũ thấy: ${w0}`);
    let d = mg.editMgmtTask(cx, v.id, than(w0));
    assert(d.groupId === tu.id, 'nhóm tự đặt giữ khi web cũ gửi mặc định curriculum');
    const k = tao(cx, {});
    assert(mg.editMgmtTask(cx, k.id, { ...than(null), title: k.title }).groupId === null, 'Không phân loại giữ');
    d = mg.editMgmtTask(cx, v.id, than(gvcn.userId));
    const ids = d.theoDoi.map((x: any) => x.id);
    assert(!ids.includes(tvv.userId) && ids.includes(gvcn.userId) && ids.includes(bpxl.userId) && ids.includes(cx.userId), `thay người: ${ids}`);
    const dangThay = d.watcherUserId;   // web cũ hiện người đầu tiên khác người tạo
    d = mg.editMgmtTask(cx, v.id, than(null));
    const con = d.theoDoi.map((x: any) => x.id);
    assert(!con.includes(dangThay) && con.length === ids.length - 1, `null = bỏ đúng người đang thấy (${dangThay}): ${con}`);
    assert(mg.editMgmtTask(cx, k.id, { ...than(null), title: k.title, group: 'teacher' }).group === 'teacher', 'chọn nhóm khác thì đổi');
  }));

  await checkAsync('VH1-12 (PTA 3, 6) · mã việc không trùng sau khi xoá dòng; lỗi việc lặp không hỏng đối chiếu; 5 lượt một đêm chỉ lượt đầu tạo', () => thu(async () => {
    const a = tao(cx, {}); const b = tao(cx, {});
    conn.prepare('DELETE FROM tasks WHERE id = ?').run(a.id); gv.donViec('van_hanh', [a.id]);
    const c = tao(cx, {});
    assert(c.code !== b.code && !hang('SELECT code FROM tasks GROUP BY code HAVING COUNT(*) > 1').length, 'mã không trùng');
    tao(cx, { lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    const dem = (ky: string) => mot(`SELECT COUNT(*) n FROM tasks WHERE lap_ky = ? AND lap_goc_id IS NOT NULL`, ky).n;
    const ngay = addDays(TODAY, 1);
    const kq = [0, 1, 2, 3, 4].map((l) => dcs.doiChieuSo(ngay, [], l === 0));
    assert(kq[0].lap?.tao >= 1 && kq.slice(1).every((k: any) => k.lap === null) && dem(ngay) === kq[0].lap.tao, `5 lượt: ${JSON.stringify(kq.map((k: any) => k.lap))}`);
    conn.exec('DROP INDEX idx_tasks_lap_mo');
    const loi = dcs.doiChieuSo(addDays(TODAY, 2), []);
    assert(loi.lap === null && typeof loi.bai === 'number', 'việc lặp lỗi → đối chiếu vẫn chạy');
  }));

  await checkAsync('VH1-13 (PTA 4, 8) · bản mới theo người của bản gần nhất (còn hiệu lực) → việc gốc → Chưa giao; đổi lịch / Hoàn tác không sinh kỳ đã qua; Dừng hẳn thôi lặp', () => thu(async () => {
    const x = taiKhoan('x', 'teacher'); const y = taiKhoan('y', 'teacher');
    const goc = tao(cx, { assigneeUserId: x.userId, lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    mg.taoViecLap(addDays(TODAY, 1));
    const b1 = mot('SELECT id FROM tasks WHERE lap_goc_id = ? AND lap_ky = ?', goc.id, addDays(TODAY, 1)).id;
    mg.editMgmtTask(cx, b1, { assigneeUserId: y.userId });
    mg.taoViecLap(addDays(TODAY, 2));
    const nguoi = (k: number) => mot('SELECT assignee_user_id u FROM tasks WHERE lap_goc_id = ? AND lap_ky = ?', goc.id, addDays(TODAY, k)).u;
    assert(nguoi(2) === y.userId, 'giao lại bản tuần này → bản sau theo người mới');
    accounts.setRoles(P.admin, y.userId, [{ role: 'teacher', branches: ['CP'] }]);
    mg.taoViecLap(addDays(TODAY, 3));
    assert(nguoi(3) === x.userId, 'người bản gần nhất hết vai → người của việc gốc');
    accounts.setRoles(P.admin, x.userId, [{ role: 'teacher', branches: ['CP'] }]);
    mg.taoViecLap(addDays(TODAY, 4));
    assert(nguoi(4) === null, 'cả hai hết vai → Chưa giao');
    /* Đổi lịch / Hoàn tác Dừng lặp: kỳ đã qua (TODAY − 2) không sinh bản. */
    const thu2 = ((new Date(`${addDays(TODAY, -2)}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
    const g2 = tao(cx, { lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    conn.prepare('UPDATE tasks SET lap_ky = ? WHERE id = ?').run(addDays(TODAY, -10), g2.id);
    mg.editMgmtTask(cx, g2.id, { lap: { kieu: 'tuan', ngay: [thu2] } });
    assert(mg.taoViecLap(TODAY).tao === 0, 'đổi lịch → không sinh kỳ đã qua');
    mg.dungLap(cx, g2.id, true); mg.dungLap(cx, g2.id, false);
    assert(mg.taoViecLap(TODAY).tao === 0, 'Hoàn tác Dừng lặp → không sinh kỳ đã qua');
    const g3 = tao(cx, { lap: { kieu: 'tuan', ngay: [1, 2, 3, 4, 5, 6, 7] } });
    mg.updateMgmtTask(cx, g3.id, { progress: 'stopped', reason: 'Không làm nữa' });
    assert(!hang('SELECT 1 FROM tasks WHERE lap_goc_id = ?', g3.id).length && mg.taoViecLap(addDays(TODAY, 5)).tao >= 0 && !hang('SELECT 1 FROM tasks WHERE lap_goc_id = ?', g3.id).length, 'Dừng hẳn → thôi lặp');
  }));

  await checkAsync('VH1-14 (PTA 5, 7) · phạm vi chi nhánh: lọc chi nhánh khác 403, đổi chi nhánh cần quyền chi nhánh mới (nhóm riêng → Không phân loại), Toàn hệ thống chỉ grant toàn hệ thống; người đã rời chi nhánh mất quyền theo việc', () => thu(async () => {
    assert(mg.listMgmtTasks(ql, { branchId: CP }).rows.length === 0 && mg.listMgmtTasks(cx, { branchId: CP }).nhom.length === 0 && mg.listNhom(ql, CP).rows.length === 0, 'lọc chi nhánh ngoài phạm vi → rỗng (không 403)');
    assert(Array.isArray(mg.listMgmtTasks(ql, { branchId: CP, hang: 'can-quyet-dinh', chiDem: true }).rows), 'chỉ số Tổng quan (metrics) không vỡ khi lọc chi nhánh khác');
    const nhomMb = mg.taoNhom(ql, { ten: 'Riêng MB VH1-14', branchId: MB }).rows.find((g: any) => g.ten === 'Riêng MB VH1-14');
    const v = tao(ql, { groupId: nhomMb.id });
    const con = tao(ql, { parentTaskId: v.id, title: 'Con VH1-14' });
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { branchId: CP })) === 403, 'Head MB chuyển sang CP → 403');
    assert(await ma(() => mg.editMgmtTask(P.admin, v.id, { branchId: 'CP' as any })) === 400, 'branchId sai kiểu → 400');
    const d = mg.editMgmtTask(P.admin, v.id, { branchId: CP });
    assert(d.branchId === CP && d.groupId === null && mot('SELECT branch_id, group_id FROM tasks WHERE id = ?', con.id).branch_id === CP, 'chuyển CP: nhóm riêng MB → Không phân loại, việc con theo');
    /* PTA rà lần 2 (rút quyết định): Head / CX một chi nhánh gửi branchId null (ô web mặc định) → việc của chi nhánh đó; người toàn hệ thống giữ Toàn hệ thống. */
    const webCu = mg.createMgmtTask(ql, { title: 'Web cũ VH1-14', group: 'curriculum', branchId: null, assigneeUserId: null, assigneeName: null, watcherUserId: null, due: null, note: null, parentTaskId: null, caseIds: [], unitReportId: null, idempotencyKey: 'vh1-14-web-cu' } as any);
    assert(webCu.branchId === MB && mg.createMgmtTask(cx, { title: 'CX null VH1-14' }).branchId === MB, 'một chi nhánh gửi null → chi nhánh đó');
    const toan = mg.createMgmtTask(P.admin, { title: 'Toàn hệ thống VH1-14' });
    assert(toan.branchId === null, 'Quản trị gửi null → Toàn hệ thống');
    assert(mg.editMgmtTask(ql, toan.id, { title: 'Head sửa' }).title === 'Head sửa' && mg.editMgmtTask(cx, toan.id, { title: 'CX sửa' }).title === 'CX sửa'
      && mg.listMgmtTasks(ql, {}).rows.find((r: any) => r.id === toan.id).canEdit === true, 'việc Toàn hệ thống: Head / CX sửa như main, canEdit khớp');
    const cpV = mg.createMgmtTask(P.admin, { title: 'Việc CP VH1-14', branchId: CP });
    assert(mg.listMgmtTasks(P.admin, {}).rows.find((r: any) => r.id === cpV.id).canEdit === true && !mg.listMgmtTasks(ql, {}).rows.some((r: any) => r.id === cpV.id), 'canEdit theo dòng');
    /* Người phụ trách rời chi nhánh: không cập nhật / xem / thêm tệp. */
    const roi = taiKhoan('roi', 'teacher');
    const w = tao(cx, { assigneeUserId: roi.userId });
    conn.prepare(`UPDATE user_roles SET branch_id = ? WHERE user_id = ?`).run(CP, roi.userId);
    const r2 = loadPrincipal(roi.userId);
    assert(await ma(() => mg.updateMgmtTask(r2, w.id, { progress: 'doing' })) === 403, 'rời chi nhánh → không cập nhật');
    assert(await ma(() => mg.mgmtTaskDetail(r2, w.id)) === 403, 'rời chi nhánh → không xem');
    assert(await ma(() => att.addLink(r2, { ownerType: 'task', ownerId: w.id, url: 'https://example.com/roi' })) === 403, 'rời chi nhánh → không thêm tệp');
    /* Người được giao việc con xem được việc cha. */
    const cha = tao(cx, {}); tao(cx, { parentTaskId: cha.id, assigneeUserId: bpxl.userId });
    assert(mg.createMgmtTask(cx, { title: 'Con không gửi chi nhánh', parentTaskId: cha.id }).branchId === MB, 'việc con không gửi branchId → chi nhánh việc cha');
    assert(mg.mgmtTaskDetail(bpxl, cha.id).id === cha.id, 'người làm việc con xem việc cha');
  }));

  await checkAsync('VH1-15 (PTA 9) · phienBan lệch → 409 (sửa + cập nhật tiến độ); không gửi → như cũ', () => thu(async () => {
    const v = tao(cx, { assigneeUserId: gvcn.userId });
    const d = mg.mgmtTaskDetail(cx, v.id);
    mg.editMgmtTask(ql, v.id, { title: 'Head A sửa', phienBan: d.updatedAt });
    assert(await ma(() => mg.editMgmtTask(cx, v.id, { title: 'Head B sửa', phienBan: d.updatedAt })) === 409, 'người sau, phiên bản cũ → 409');
    assert(await ma(() => mg.updateMgmtTask(gvcn, v.id, { progress: 'doing', phienBan: d.updatedAt })) === 409, 'cập nhật tiến độ phiên bản cũ → 409');
    assert(mg.editMgmtTask(cx, v.id, { title: 'Không gửi phiên bản' }).title === 'Không gửi phiên bản', 'web cũ không gửi → như cũ');
  }));

  await checkAsync('VH1-16 (PTA 11 + tệp thật) · /tasks giữ người theo dõi trong danh sách gửi, bớt có lịch sử; hết vai không gỡ người của teacher_task; tệp tải lên / tải xuống', () => thu(async () => {
    const v = tao(ql, { theoDoiIds: [tvv.userId] });
    meetingSvc.updateTask(ql, v.id, { followerIds: [tvv.userId] });
    assert(hang(`SELECT user_id FROM viec_theo_doi WHERE loai = 'van_hanh' AND ref_id = ?`, v.id).some((r) => r.user_id === tvv.userId), '/tasks giữ người trong danh sách');
    meetingSvc.updateTask(ql, v.id, { followerIds: [] });
    assert(!hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'van_hanh' AND ref_id = ? AND user_id = ?`, v.id, tvv.userId).length
      && hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'van_hanh' AND ref_id = ? AND truong = 'theo_doi' AND cu = ?`, v.id, String(tvv.userId)).length === 1, 'bớt có lịch sử');
    const gvTam = taiKhoan('gvtam', 'teacher');
    const tt = Number(conn.prepare(`INSERT INTO tasks (code, title, kind, branch_id, assignee_user_id, progress, created_by, created_at) VALUES (?, 'Giao GV VH1-16', 'teacher_task', ?, ?, 'not_started', ?, ?)`)
      .run(mg.nextCode(conn), MB, gvTam.userId, ql.userId, new Date().toISOString()).lastInsertRowid);
    accounts.setRoles(P.admin, gvTam.userId, [{ role: 'teacher', branches: ['CP'] }]);
    assert(mot('SELECT assignee_user_id u FROM tasks WHERE id = ?', tt).u === gvTam.userId, 'teacher_task giữ người');
    const w = tao(cx, { assigneeUserId: gvcn.userId });
    const duLieu = Buffer.from('%PDF-1.4 bao gia VH1-16');
    const f = await att.addFile(gvcn, { ownerType: 'task', ownerId: w.id, fileName: 'bao-gia.pdf', data: duLieu, mimeType: 'application/pdf' });
    const o = await att.openAttachment(cx, f.id);
    assert(o.kind === 'file' && Buffer.compare(o.duLieu, duLieu) === 0 && o.downloadName === 'bao-gia.pdf', 'tải xuống đúng tệp');
    assert(await ma(() => att.openAttachment(ngoai, f.id)) === 403, 'người ngoài không tải');
  }));

  await checkAsync('VH1-17 (PTA rà lần 2) · mã việc một câu khi đã ≥ 50 việc, không cấp lại mã; việc Toàn hệ thống giao cho tôi giữ ở bộ lọc chi nhánh; mục nhỏ', () => thu(async () => {
    for (let i = 0; i < 50; i++) tao(cx, {});
    let cau = 0;
    const dem = { prepare: (sql: string) => { cau += 1; return conn.prepare(sql); } };
    const ma1 = mg.nextCode(dem);
    assert(cau === 2 && !mot('SELECT 1 FROM tasks WHERE code = ?', ma1), `mã kế: ${cau} câu (${ma1})`);
    const cuoi = tao(cx, {});
    conn.prepare('DELETE FROM tasks WHERE id = ?').run(cuoi.id); gv.donViec('van_hanh', [cuoi.id]);
    assert(mg.nextCode(conn) !== cuoi.code || !mot('SELECT 1 FROM tasks WHERE code = ?', cuoi.code), 'không trùng mã đang có');
    /* Việc Toàn hệ thống giao cho tôi: lọc chi nhánh vẫn thấy. */
    const toan = mg.createMgmtTask(P.admin, { title: 'Toàn hệ thống VH1-17', assigneeUserId: bpxl.userId });
    xoaNho();
    assert((myWork(loadPrincipal(bpxl.userId) as any, { branchId: MB }) as any).items.some((x: any) => x.key === `mgmt:${toan.id}`), 'lọc chi nhánh vẫn có việc Toàn hệ thống');
    /* Chuyển chi nhánh không gửi người: người không có vai ở chi nhánh mới → Chưa giao + lịch sử. */
    const v = tao(cx, { assigneeUserId: gvcn.userId });
    const d = mg.editMgmtTask(P.admin, v.id, { branchId: CP });
    assert(d.assigneeUserId === null && mot(`SELECT COUNT(*) n FROM task_history WHERE task_id = ? AND field = 'assignee_user_id'`, v.id).n === 1, 'chuyển chi nhánh → Chưa giao');
    /* PATCH \`lap\` y như cũ không bỏ Dừng lặp. */
    const g = tao(cx, { lap: { kieu: 'tuan', ngay: [1] } });
    mg.dungLap(cx, g.id, true);
    mg.editMgmtTask(cx, g.id, { lap: { kieu: 'tuan', ngay: [1] } });
    assert(!!mot('SELECT lap_dung_luc FROM tasks WHERE id = ?', g.id).lap_dung_luc, 'lap không đổi → giữ Dừng lặp');
    /* Người làm việc con đã rời chi nhánh: không xem việc cha. */
    const roi = taiKhoan('roi2', 'teacher');
    const cha = tao(cx, {}); tao(cx, { parentTaskId: cha.id, assigneeUserId: roi.userId });
    const w = tao(cx, { assigneeUserId: roi.userId });
    conn.prepare('UPDATE user_roles SET branch_id = ? WHERE user_id = ?').run(CP, roi.userId);
    assert(await ma(() => mg.mgmtTaskDetail(loadPrincipal(roi.userId), cha.id)) === 403, 'rời chi nhánh → không xem việc cha');
    /* Đang theo dõi không liệt kê việc Giao GV theo lớp (teacher_task). */
    const tt = Number(conn.prepare(`INSERT INTO tasks (code, title, kind, branch_id, progress, created_by, created_at) VALUES (?, 'Giao GV VH1-17', 'teacher_task', ?, 'not_started', ?, ?)`)
      .run(mg.nextCode(conn), MB, ql.userId, new Date().toISOString()).lastInsertRowid);
    conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('van_hanh', ?, ?, 'head', ?)`).run(tt, tvv.userId, new Date().toISOString());
    assert(!gv.viecTheoDoi(tvv).nhom.some((n: any) => n.mo.some((x: any) => x.refId === tt)), 'teacher_task không vào Đang theo dõi');
    /* /tasks cũ: người phụ trách đã rời chi nhánh không mở lại việc. */
    assert(await ma(() => meetingSvc.updateTask(loadPrincipal(roi.userId), w.id, { progress: 'doing' })) === 403, '/tasks: rời chi nhánh → 403');
  }));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrVanHanh, KHOA_PR_VAN_HANH } = await import('../migrate/prVanHanh.ts');
  await checkAsync('VH2-1 · Loại việc Trong kỳ / Dài hạn (tạo + sửa, việc con theo cha, giá trị lạ 400) · chi tiết có lịch sử giao / đổi người / theo dõi', () => thu(async () => {
    const v = tao(cx, { taskType: 'in_period', assigneeUserId: tvv.userId });
    assert(mg.mgmtTaskDetail(cx, v.id).taskType === 'in_period', 'tạo Trong kỳ');
    assert(mg.mgmtTaskDetail(cx, tao(cx, {}).id).taskType === 'long_term', 'không gửi = Dài hạn như cũ');
    const con = tao(cx, { parentTaskId: v.id, taskType: 'long_term' });
    assert(mg.mgmtTaskDetail(cx, con.id).taskType === 'in_period', 'việc con theo việc cha');
    let loi = '';
    try { tao(cx, { taskType: 'tuan' }); } catch (e: any) { loi = e?.message ?? ''; }
    assert(/Loại việc/.test(loi), `giá trị lạ phải 400: ${loi}`);
    let d = mg.editMgmtTask(cx, v.id, { taskType: 'long_term', phienBan: mg.mgmtTaskDetail(cx, v.id).updatedAt });
    assert(d.taskType === 'long_term', 'sửa loại việc');
    d = mg.editMgmtTask(cx, v.id, { assigneeUserId: bpxl.userId, theoDoiIds: [gvcn.userId] });
    const truong = d.lichSu.map((l: any) => l.truong);
    assert(truong[0] === 'giao' && truong.includes('assignee_user_id') && truong.includes('theo_doi'), `lịch sử: ${truong.join(',')}`);
    const doi = d.lichSu.find((l: any) => l.truong === 'assignee_user_id');
    assert(doi.moi && doi.cu && !/^\d+$/.test(doi.moi), `tên người, không phải id: ${JSON.stringify(doi)}`);
  }));

  await checkAsync('VH2-2 · (AUDIT-2111 A2-04 / A2-09) Đổi người → Hoàn tác: người phụ trách + người theo dõi về đúng như trước (người cũ không bị thêm vào Theo dõi), tin "Đổi người" gỡ, không tin mới; có thay đổi sau → 409; form Sửa nhiều trường không có bản đảo', () => thu(async () => {
    const v = tao(cx, { assigneeUserId: tvv.userId, theoDoiIds: [bpxl.userId] });
    const td = () => JSON.stringify(mg.mgmtTaskDetail(cx, v.id).theoDoi.map((x: any) => x.id).sort());
    const truoc = td();
    const tinTruoc = [tvv, bpxl, cx].map((u) => tin(u.userId, v.id).length);
    const d = mg.editMgmtTask(ql, v.id, { assigneeUserId: gvcn.userId, phienBan: mg.mgmtTaskDetail(cx, v.id).updatedAt });
    assert(d.assigneeUserId === gvcn.userId && d.theoDoi.some((x: any) => x.id === tvv.userId), 'đổi: người cũ theo dõi tiếp');
    assert(tin(tvv.userId, v.id).length > tinTruoc[0], 'người cũ nhận tin đổi người');
    const h = mg.editMgmtTask(ql, v.id, { hoanTacGiao: true, phienBan: d.updatedAt });
    assert(h.assigneeUserId === tvv.userId && td() === truoc, `Hoàn tác: phụ trách + theo dõi như trước: ${td()} ≠ ${truoc}`);
    assert(JSON.stringify([tvv, bpxl, cx].map((u) => tin(u.userId, v.id).length)) === JSON.stringify(tinTruoc) && !tin(gvcn.userId, v.id).length,
      'tin "Đổi người" của lần đổi gỡ hết, không tin mới (kết quả không đổi)');
    assert(h.lichSu.filter((l: any) => l.truong === 'assignee_user_id').length === 2, 'lịch sử: đổi + hoàn tác');
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { hoanTacGiao: true, phienBan: h.updatedAt })) === 409, 'đã hoàn tác → 409');
    const d2 = mg.editMgmtTask(ql, v.id, { assigneeUserId: gvcn.userId, phienBan: h.updatedAt });
    assert(await ma(() => mg.editMgmtTask(P.admin, v.id, { hoanTacGiao: true, phienBan: d2.updatedAt })) === 403, 'Quản trị không phải người đổi → 403 (rà PTA #1954 ④)');
    const d3 = mg.editMgmtTask(ql, v.id, { due: addDays(TODAY, 4), phienBan: d2.updatedAt });
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { hoanTacGiao: true, phienBan: d3.updatedAt })) === 409, 'có thay đổi sau lần đổi → 409');
    assert(await ma(() => mg.editMgmtTask(tvv, v.id, { hoanTacGiao: true, phienBan: d3.updatedAt })) === 403, 'không quản lý → 403');
    const d4 = mg.editMgmtTask(ql, v.id, { assigneeUserId: tvv.userId, title: 'Đổi tên cùng lúc', phienBan: d3.updatedAt });
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { hoanTacGiao: true, phienBan: d4.updatedAt })) === 409, 'form Sửa nhiều trường: không có bản đảo mới');
    const d5 = mg.editMgmtTask(ql, v.id, { assigneeUserId: gvcn.userId, phienBan: d4.updatedAt });
    conn.prepare(`UPDATE ghi_dao SET luc = ? WHERE loai = 'van_hanh.giao' AND doi_tuong_id = ?`).run(new Date(Date.now() - 61_000).toISOString(), v.id);
    assert(await ma(() => mg.editMgmtTask(ql, v.id, { hoanTacGiao: true, phienBan: d5.updatedAt })) === 400, 'quá 60 giây → 400');
  }));

  await checkAsync('AU-2111 P1-01 (A2-01) · TVV được giao việc Vận hành / việc con / theo dõi mở + làm được qua HTTP (cổng khu Công việc); TVV không liên quan, hết vai 403; danh sách Vận hành vẫn 403', async () => {
    const { createApp } = await import('../app.ts');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const ck = new Map<number, string>();
    const vao = async (userId: number) => {
      const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      ck.set(userId, (res.headers.get('set-cookie') ?? '').split(';')[0]);
    };
    const goi = async (p: any, method: string, url: string, body?: unknown) => {
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie: ck.get(p.userId)! }, body: body === undefined ? undefined : JSON.stringify(body) });
      let json: any = null;
      try { json = await res.json(); } catch { /* không thân */ }
      return { status: res.status, json };
    };
    try {
      const nhan = taiKhoan('tvvnhan', 'consultant'); const nhanCon = taiKhoan('tvvcon', 'consultant'); const td = taiKhoan('tvvtd', 'consultant'); const la = taiKhoan('tvvla', 'consultant');
      for (const p of [nhan, nhanCon, td, la]) await vao(p.userId);
      const v = tao(cx, { assigneeUserId: nhan.userId, theoDoiIds: [td.userId], due: addDays(TODAY, 3) });
      const con = tao(cx, { title: 'Việc con của TVV', parentTaskId: v.id, assigneeUserId: nhanCon.userId, due: addDays(TODAY, 2) });
      const kq = (r: { status: number; json: any }) => `${r.status} ${r.json?.error ?? ''}`;
      let r = await goi(nhan, 'GET', `/mgmt-tasks/${v.id}`);
      assert(r.status === 200 && r.json.id === v.id, `người phụ trách mở: ${kq(r)}`);
      r = await goi(nhan, 'POST', `/mgmt-tasks/${v.id}/update`, { progress: 'doing', note: 'Đã gọi nhà cung cấp' });
      assert(r.status === 200 && mot('SELECT progress FROM tasks WHERE id = ?', v.id).progress === 'doing', `người phụ trách cập nhật: ${kq(r)}`);
      r = await goi(nhan, 'PATCH', `/mgmt-tasks/${v.id}`, { due: addDays(TODAY, 4) });
      assert(r.status === 200, `người phụ trách sửa hạn: ${kq(r)}`);
      r = await goi(nhanCon, 'GET', `/mgmt-tasks/${con.id}`);
      assert(r.status === 200, `phụ trách việc con mở việc con: ${kq(r)}`);
      r = await goi(nhanCon, 'GET', `/mgmt-tasks/${v.id}`);
      assert(r.status === 200, `phụ trách việc con mở việc cha: ${kq(r)}`);
      r = await goi(nhanCon, 'POST', `/mgmt-tasks/${con.id}/update`, { progress: 'done' });
      assert(r.status === 200, `phụ trách việc con hoàn thành: ${kq(r)}`);
      r = await goi(td, 'GET', `/mgmt-tasks/${v.id}`);
      assert(r.status === 200, `người theo dõi mở: ${kq(r)}`);
      r = await goi(td, 'POST', `/mgmt-tasks/${v.id}/update`, { progress: 'done' });
      assert(r.status === 403, `người theo dõi cập nhật → 403: ${kq(r)}`);
      for (const [m, u, b] of [['GET', `/mgmt-tasks/${v.id}`], ['GET', `/MGMT-TASKS/${v.id}`], ['POST', `/mgmt-tasks/${v.id}/update`, { progress: 'done' }], ['PATCH', `/mgmt-tasks/${v.id}`, { due: addDays(TODAY, 9) }],
        ['GET', '/mgmt-tasks'], ['GET', '/mgmt-tasks/nhom'], ['POST', `/mgmt-tasks/${v.id}/lap`, { dung: true }], ['GET', `/mgmt-tasks/999999`]] as [string, string, unknown?][]) {
        r = await goi(la, m, u, b);
        assert(r.status === 403, `TVV không liên quan ${m} ${u} → 403: ${kq(r)}`);
      }
      r = await goi(nhan, 'GET', '/mgmt-tasks');
      assert(r.status === 403, `danh sách Vận hành vẫn 403: ${kq(r)}`);
      accounts.setRoles(P.admin, td.userId, [{ role: 'consultant', branches: ['CP'] }]);
      await vao(td.userId);
      r = await goi(td, 'GET', `/mgmt-tasks/${v.id}`);
      assert(r.status === 403, `người theo dõi hết vai → 403: ${kq(r)}`);
    } finally {
      may.close();
    }
  });

  check('VH1-9 · migrate prVanHanh: group_key → nhóm, watcher + task_followers → viec_theo_doi; chạy hai lần không đổi; tự lành chỉ mục; khớp schema.sql', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    /* DB trước VH-1: cắt khối cột VH-1 của tasks, hai chỉ mục, bảng task_groups. */
    const cat = SCHEMA
      .replace(/idempotency_key TEXT,( +--[^\n]*)\n {2}\/\*\n {3}\* VH-1[\s\S]*?lap_tu TEXT(?:,\n[\s\S]*?hang_muc TEXT)?\n\)/, 'idempotency_key TEXT$1\n)')   // VH-1b: hang_muc là cột của bước sau (prHangMuc)
      .replace(/CREATE UNIQUE INDEX ux_tasks_lap_ky[^\n]*\n/, '').replace(/CREATE INDEX idx_tasks_lap_mo[^\n]*\n/, '').replace(/CREATE INDEX idx_task_giao_mo[^\n]*\n/, '')
      .replace(/\/\*\n \* VH-1 \(N59\): NHÓM VIỆC[\s\S]*?tao_luc TEXT NOT NULL\n\);\n/, '');
    if (/task_groups|lap_kieu|group_id INTEGER/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm VH1-9');
    const cu = new SqliteDb(':memory:'); cu.exec(cat);
    const luc = '2026-11-01T00:00:00.000Z';
    cu.exec(`INSERT INTO users (id, code, email, full_name, status, created_at) VALUES (1, 'U1', 'a@x', 'A', 'active', '${luc}'), (2, 'U2', 'b@x', 'B', 'active', '${luc}'), (3, 'U3', 'c@x', 'C', 'active', '${luc}')`);
    cu.exec(`INSERT INTO tasks (id, code, title, group_key, watcher_user_id, created_by, created_at) VALUES (1, 'CV0001', 'Cũ 1', 'teacher', 2, 1, '${luc}'), (2, 'CV0002', 'Cũ 2', NULL, NULL, 1, '${luc}')`);
    cu.exec(`INSERT INTO task_followers (task_id, user_id, source, created_at) VALUES (1, 3, 'auto', '${luc}'), (2, 2, 'manual', '${luc}')`);
    const a: string[] = []; migratePrVanHanh(cu, a);
    const b: string[] = []; migratePrVanHanh(cu, b);
    assert(a.length >= 5 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const g = cu.prepare(`SELECT t.id, g.khoa FROM tasks t LEFT JOIN task_groups g ON g.id = t.group_id ORDER BY t.id`).all() as any[];
    assert(g[0].khoa === 'teacher' && g[1].khoa === null, `nhóm: ${JSON.stringify(g)}`);
    const td = cu.prepare(`SELECT ref_id, user_id, nguon FROM viec_theo_doi WHERE loai = 'van_hanh' ORDER BY ref_id, user_id`).all() as any[];
    assert(JSON.stringify(td) === JSON.stringify([{ ref_id: 1, user_id: 2, nguon: 'tay' }, { ref_id: 1, user_id: 3, nguon: 'head' }, { ref_id: 2, user_id: 2, nguon: 'tay' }]), `theo dõi: ${JSON.stringify(td)}`);
    /* Một lần: người dùng bỏ theo dõi / đổi "Không phân loại" sau migrate — chạy lại không trả lại. */
    cu.exec(`DELETE FROM viec_theo_doi WHERE ref_id = 2`); cu.exec(`UPDATE tasks SET group_id = NULL WHERE id = 1`);
    migratePrVanHanh(cu, []);
    assert(!cu.prepare(`SELECT 1 FROM viec_theo_doi WHERE ref_id = 2`).get() && (cu.prepare(`SELECT group_id FROM tasks WHERE id = 1`).get() as any).group_id === null, 'đổi dữ liệu chỉ một lần');
    assert(!!cu.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_VAN_HANH), 'khoá một lần');
    cu.exec('DROP INDEX ux_tasks_lap_ky');
    const c2: string[] = []; migratePrVanHanh(cu, c2);
    assert(c2.length === 1 && /ux_tasks_lap_ky/.test(c2[0]), `tự lành: ${c2.join(' | ')}`);
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (d: any, bang: string) => JSON.stringify((d.prepare(`PRAGMA table_info(${bang})`).all() as any[]).filter((x) => x.name !== 'hang_muc').map((x) => `${x.name}:${x.type}:${x.notnull}`));
    for (const bang of ['tasks', 'task_groups']) assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    const chiMuc = (d: any) => JSON.stringify((d.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name IN ('ux_tasks_lap_ky', 'idx_tasks_lap_mo', 'idx_task_giao_mo') ORDER BY name`).all() as any[]));
    assert(chiMuc(cu).replace(/\s+/g, ' ').replace(/IF NOT EXISTS /g, '') === chiMuc(moi).replace(/\s+/g, ' '), `chỉ mục: ${chiMuc(cu)} ≠ ${chiMuc(moi)}`);
    /* DB dựng từ schema.sql + seed: không đổi cấu trúc. */
    const c: string[] = []; migratePrVanHanh(conn, c);
    assert(!c.some((x) => !/Một lần\./.test(x)), `DB seed bị đổi cấu trúc: ${c.join(' | ')}`);
  });
}
