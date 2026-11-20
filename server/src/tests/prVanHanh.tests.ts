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

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrVanHanh, KHOA_PR_VAN_HANH } = await import('../migrate/prVanHanh.ts');
  check('VH1-9 · migrate prVanHanh: group_key → nhóm, watcher + task_followers → viec_theo_doi; chạy hai lần không đổi; tự lành chỉ mục; khớp schema.sql', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    /* DB trước VH-1: cắt khối cột VH-1 của tasks, hai chỉ mục, bảng task_groups. */
    const cat = SCHEMA
      .replace(/idempotency_key TEXT,( +--[^\n]*)\n {2}\/\*\n {3}\* VH-1[\s\S]*?lap_dung_luc TEXT\n\)/, 'idempotency_key TEXT$1\n)')
      .replace(/CREATE UNIQUE INDEX ux_tasks_lap_ky[^\n]*\n/, '').replace(/CREATE INDEX idx_tasks_lap_mo[^\n]*\n/, '')
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
    const cot = (d: any, bang: string) => JSON.stringify((d.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((x) => `${x.name}:${x.type}:${x.notnull}`));
    for (const bang of ['tasks', 'task_groups']) assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    const chiMuc = (d: any) => JSON.stringify((d.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name IN ('ux_tasks_lap_ky', 'idx_tasks_lap_mo') ORDER BY name`).all() as any[]));
    assert(chiMuc(cu).replace(/\s+/g, ' ').replace(/IF NOT EXISTS /g, '') === chiMuc(moi).replace(/\s+/g, ' '), `chỉ mục: ${chiMuc(cu)} ≠ ${chiMuc(moi)}`);
    /* DB dựng từ schema.sql + seed: không đổi cấu trúc. */
    const c: string[] = []; migratePrVanHanh(conn, c);
    assert(!c.some((x) => !/Một lần\./.test(x)), `DB seed bị đổi cấu trúc: ${c.join(' | ')}`);
  });
}
