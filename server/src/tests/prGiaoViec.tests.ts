/**
 * PHÉP KIỂM GV-1 (N58, chủ SP 20/11 — giao việc liên phòng ban, máy chủ; thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` B, B2):
 *  · giao Báo PH cho Admin → Admin thấy ở /my-work ("{tên} giao"), ghi kết quả được; TVV cũ rời "Của tôi", thành người theo dõi, thấy ở /my-work/theo-doi.
 *  · Về mặc định · Hoàn tác · người ngoài chi nhánh 400 · không quyền đổi 403 · người theo dõi ghi 403 · tin chuông đúng người (không trùng tin N41).
 *  · Meeting CX / GĐCN: ba phần độc lập, TVV nhập hộ Kết quả meeting · đổi GVCN / TVV chuyển dòng theo dõi `auto` · migrate chạy hai lần.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrGiaoViecTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nGV-1 · giao việc liên phòng ban: phụ trách · theo dõi · hạn · Meeting ba phần · /my-work');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const students: any = await import('../students/students.ts');
  const { nguoiVaiCuaChiNhanh } = await import('../platform/audit.ts');
  const { myWork, NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const lop = classId('MB FT 101');
  const mbId = (conn.prepare(`SELECT branch_id FROM classes WHERE id = ?`).get(lop) as any).branch_id as number;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `giaoviec.${ten}${accounts.EMAIL_SUFFIX}`, password: `matkhau-giaoviec-${ten}`, fullName: `GIAOVIEC ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const tvv = taiKhoan('tvv', 'consultant'); const tvv2 = taiKhoan('tvv2', 'consultant');
  const admin = taiKhoan('admin', 'office_admin'); const cx = taiKhoan('cx', 'cx'); const ngoai = taiKhoan('ngoai', 'consultant', 'CP');
  let dem = 0;
  const moiEm = (): number => {
    const ten = `GIAOVIEC em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `giaoviec-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  /** Báo PH vi phạm: GVBM ghi một vi phạm, GVCN xác nhận xử lý → việc TVV. */
  const baoPhViPham = (sid: number): number => {
    const vid = viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, -1) }).violation.id;
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    return (conn.prepare('SELECT id FROM viec_bao_ph WHERE measure_id = ?').get(m.id) as any).id as number;
  };
  const items = (p: any, f: Record<string, unknown> = {}) => { xoaNho(); return ((myWork(p, f) as any).items ?? []) as any[]; };
  const theoDoi = (loai: string, id: number) => hang('SELECT user_id, nguon FROM viec_theo_doi WHERE loai = ? AND ref_id = ? ORDER BY user_id', loai, id);
  const tin = (khoa: string) => hang(`SELECT user_id FROM notifications WHERE dedup_key LIKE ?`, `${khoa}%`).map((r) => r.user_id as number);
  const ma = async (fn: () => unknown): Promise<number | null> => { try { await fn(); return null; } catch (e: any) { return e?.status ?? e?.statusCode ?? -1; } };

  await checkAsync('GV1-1 · Báo PH vi phạm: theo dõi mặc định GVCN + GV ghi · TVV giao cho Admin → Admin thấy ("{tên} giao"), TVV rời "Của tôi", thành người theo dõi', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    const td0 = theoDoi('bao_ph', id).map((r) => r.user_id);
    assert(td0.includes(gvcn.userId) && td0.includes(gvbm.userId) && !td0.includes(tvv.userId), `theo dõi mặc định: ${JSON.stringify(td0)}`);
    const k = gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: admin.userId });
    assert(k.duocGiao && k.phuTrach[0].id === admin.userId && k.hoanTac, JSON.stringify(k.phuTrach));
    const cuaAdmin = items(admin).find((x) => x.key === `bao-ph:${id}`);
    assert(cuaAdmin && cuaAdmin.mine && cuaAdmin.giaoBoi === 'GIAOVIEC TVV' && cuaAdmin.group === 'bao_ph_yt', `Admin: ${JSON.stringify(cuaAdmin)}`);
    assert(!items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `bao-ph:${id}`), 'TVV cũ không còn ở Của tôi');
    assert(theoDoi('bao_ph', id).some((r) => r.user_id === tvv.userId), 'TVV cũ (người giao) thành người theo dõi');
    xoaNho();
    const tab = gv.viecTheoDoi(tvv);
    const d = tab.nhom.find((g: any) => g.loai === 'bao_ph')?.mo.find((x: any) => x.refId === id);
    assert(d && d.phuTrach === 'GIAOVIEC ADMIN' && d.trangThai === 'mo', `tab Đang theo dõi: ${JSON.stringify(tab)}`);
    assert(tin(`gv:bao_ph:${id}:giao:`).includes(admin.userId), 'Admin nhận tin được giao');
    /* Admin (vai thường không ghi Báo PH) ghi được đúng việc này; người theo dõi nhận một tin, GVCN không nhận thêm tin N41. */
    bp.ghiKetQuaBaoPh(admin, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
    assert((conn.prepare('SELECT trang_thai FROM viec_bao_ph WHERE id = ?').get(id) as any).trang_thai === 'xong', 'Admin ghi xong');
    const nhan = tin(`gv:bao_ph:${id}:ket_qua:`);
    assert(nhan.includes(tvv.userId) && nhan.includes(gvbm.userId) && !nhan.includes(admin.userId) && !nhan.includes(gvcn.userId), `tin kết quả: ${JSON.stringify(nhan)}`);
    assert(JSON.stringify(tin(`bao-ph-vp:${id}`)) === JSON.stringify([gvcn.userId]), 'GVCN: đúng MỘT tin (tin N41 sẵn có, không thêm tin theo dõi)');
    xoaNho();
    assert(gv.viecTheoDoi(tvv).nhom.find((g: any) => g.loai === 'bao_ph')?.vuaXong.some((x: any) => x.refId === id), 'vừa xong 7 ngày');
  }));

  await checkAsync('GV1-2 · Về mặc định · Hoàn tác · ngoài chi nhánh 400 · không quyền đổi 403 · người theo dõi ghi 403 / đọc được', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    assert(await ma(() => gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: ngoai.userId })) === 400, 'người chỉ có vai ở CP → 400');
    assert(await ma(() => gv.doiPhuTrach(gvbm, 'bao_ph', id, { userId: admin.userId })) === 403, 'GVBM (người theo dõi, không phụ trách) đổi → 403');
    gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: admin.userId });
    assert(await ma(() => gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: tvv2.userId })) === 403, 'TVV hết là người phụ trách → 403');
    assert(await ma(() => gv.doiPhuTrach(admin, 'bao_ph', id, { userId: tvv2.userId, phuTrachCu: null })) === 409, 'phuTrachCu cũ → 409');
    assert(await ma(() => bp.ghiKetQuaBaoPh(gvbm, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'GV ghi thử kết quả' })) === 403, 'người theo dõi ghi → 403');
    const xem = bp.xemViecBaoPh(gvbm, id);
    assert(!xem.coTheGhi && xem.lienHe.sdt === null, 'người theo dõi chỉ xem, không SĐT PH');
    assert(gv.xemGiaoViec(gvbm, 'bao_ph', id).toiTheoDoi, 'khối giao việc đọc được');
    /* Admin trả về mặc định → TVV có lại việc; Hoàn tác (của Admin) → về Admin. */
    const k = gv.doiPhuTrach(admin, 'bao_ph', id, { userId: null });
    assert(!k.duocGiao && k.phuTrach[0].id === tvv.userId, 'về mặc định');
    assert(items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `bao-ph:${id}` && x.mine && !x.giaoBoi), 'TVV có lại việc (theo luật)');
    gv.hoanTacGiao(admin, 'bao_ph', id);
    assert((conn.prepare('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?').get(id) as any).phu_trach_id === admin.userId, 'Hoàn tác về Admin');
    assert(gv.xemGiaoViec(ql, 'bao_ph', id).lichSu.filter((l: any) => l.truong === 'phu_trach').length === 3, 'lịch sử đủ 3 lần đổi');
    /* Hạn: người giao (TVV) + người phụ trách (Admin) sửa được; Head sửa → tin cho người theo dõi. */
    gv.suaHan(admin, 'bao_ph', id, { han: addDays(TODAY, 9), hanCu: null });
    assert(tin(`gv:bao_ph:${id}:han:${addDays(TODAY, 9)}`).includes(tvv.userId), 'tin đổi hạn tới TVV (người theo dõi)');
  }));

  await checkAsync('GV1-3 · Hỏi tình hình + Phối hợp SOS giao cho TVV: người được giao làm được, rời dòng GVCN', () => thu(async () => {
    const sid = moiEm();
    const th: any = await import('../yThuc/tinhHinh.ts');
    const thId = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    assert(items(gvcn).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`), 'trước: GVCN giữ');
    gv.doiPhuTrach(gvcn, 'tinh_hinh', thId, { userId: tvv2.userId });
    assert(!items(gvcn).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`) && items(tvv2, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`), 'GVCN rời, TVV2 có');
    th.traLoiTinhHinh(tvv2, thId, { traLoi: 'Em học tốt, chăm làm bài tập' });
    assert((conn.prepare('SELECT trang_thai FROM tinh_hinh_hoc_tap WHERE id = ?').get(thId) as any).trang_thai === 'xong', 'TVV2 trả lời được');
  }));

  await checkAsync('GV1-4 · Meeting CX/GĐCN: ba phần độc lập (Xếp lịch · Kết quả · Báo PH), TVV nhập hộ, Hoàn tác, sửa có lịch sử', () => thu(async () => {
    const sid = moiEm();
    const att = (conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'cx_meeting_student') LIMIT 1`).get() as any).id;
    const aid = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'cx_meeting_student', 1, 'pending', ?)`)
      .run(att, sid, new Date().toISOString()).lastInsertRowid);
    ph.confirmCoordination(gvcn, aid, { performedOn: TODAY, note: 'Cần họp CX với em' });
    const phan = hang('SELECT * FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY phan', aid);
    const xep = phan.find((r) => r.phan === 'xep_lich'); const kq = phan.find((r) => r.phan === 'ket_qua');
    const bpId = (conn.prepare('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?').get(aid) as any).id;
    assert(xep && kq && xep.trang_thai === 'mo' && kq.trang_thai === 'mo' && bpId, JSON.stringify(phan));
    const coBpxl = nguoiVaiCuaChiNhanh(mbId, 'scheduler').length > 0;
    if (!coBpxl) assert(items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `meeting_xep_lich:${xep.id}`), 'chưa có BPXL → TVV của em xếp lịch');
    assert(items(cx).some((x) => x.key === `meeting_ket_qua:${kq.id}` && x.mine), 'CX có Kết quả meeting ở /my-work');
    assert(!items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `meeting_ket_qua:${kq.id}`), 'Kết quả meeting không phải việc của TVV');
    const td = theoDoi('meeting', kq.id).map((r) => r.user_id);
    assert(td.includes(tvv.userId) && td.includes(gvcn.userId) && td.includes(ql.userId), `theo dõi mặc định Meeting: ${JSON.stringify(td)}`);
    /* TVV nhập hộ CX — trước khi xếp lịch, Báo PH vẫn mở: không phần nào chờ phần nào. */
    const k = gv.xongPhanMeeting(tvv, kq.id, { ketQua: 'Gia đình đồng ý kèm em thêm' });
    assert(k.meeting.trangThai === 'xong' && k.meeting.nhapHoBoi === 'GIAOVIEC TVV', JSON.stringify(k.meeting));
    assert((conn.prepare('SELECT trang_thai FROM viec_bao_ph WHERE id = ?').get(bpId) as any).trang_thai === 'mo', 'Báo PH của TVV giữ, độc lập');
    assert(await ma(() => gv.xongPhanMeeting(gvbm, xep.id, {})) === 403, 'GVBM không xếp lịch → 403');
    assert(await ma(() => gv.xongPhanMeeting(tvv, xep.id, { ngayGio: '2026-13-01' })) === (coBpxl ? 403 : 400), 'ngày giờ sai → 400');
    if (!coBpxl) {
      gv.xongPhanMeeting(tvv, xep.id, {});   // ngày giờ tuỳ chọn
      const k2 = gv.xongPhanMeeting(tvv, xep.id, { ngayGio: `${TODAY} 15:00` });   // sửa sau khi xong
      assert(k2.meeting.ngayGio === `${TODAY} 15:00` && k2.lichSu.some((l: any) => l.truong === 'sua'), 'sửa có lịch sử');
      gv.moLaiPhanMeeting(tvv, xep.id);
      assert((conn.prepare('SELECT trang_thai FROM meeting_phan WHERE id = ?').get(xep.id) as any).trang_thai === 'mo', 'Hoàn tác → chưa xong');
    }
    assert(tin(`gv:meeting:${kq.id}:ket_qua:`).includes(gvcn.userId), 'GVCN (theo dõi) nhận tin có kết quả');
    /* GVCN đưa Meeting về Cần xử lý → phần chưa xong đóng (hệ thống), phần đã xong giữ. */
    ph.moLaiCoordination(gvcn, aid);
    const sau = hang('SELECT phan, trang_thai FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY phan', aid);
    assert(sau.find((r) => r.phan === 'ket_qua').trang_thai === 'xong' && (coBpxl || sau.find((r) => r.phan === 'xep_lich').trang_thai === 'bo'), JSON.stringify(sau));
    const mt = gv.xemMeeting(ql, aid);
    assert(mt.phan.length === 2 && mt.baoPhId === bpId, 'panel Meeting: hai phần + việc Báo PH');
  }));

  await checkAsync('GV1-5 · đổi TVV / đổi GVCN → dòng theo dõi auto của việc còn mở chuyển theo', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    gv.doiPhuTrach(ql, 'bao_ph', id, { userId: admin.userId });   // Head giao → TVV (người theo luật trước) theo dõi `auto`
    assert(theoDoi('bao_ph', id).some((r) => r.user_id === tvv.userId && r.nguon === 'auto'), 'TVV trước = theo dõi auto');
    students.updateStudent(P.admin, sid, { consultantUserId: tvv2.userId });
    const td = theoDoi('bao_ph', id).map((r) => r.user_id);
    assert(td.includes(tvv2.userId) && !td.includes(tvv.userId), `đổi TVV: ${JSON.stringify(td)}`);
    gv.chuyenTheoDoiGvcn(lop, gvcn.userId, P.w2Teacher.userId);
    const td2 = theoDoi('bao_ph', id).map((r) => r.user_id);
    assert(td2.includes(P.w2Teacher.userId) && !td2.includes(gvcn.userId) && td2.includes(gvbm.userId), `đổi GVCN: ${JSON.stringify(td2)}`);
  }));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrGiaoViec } = await import('../migrate/prGiaoViec.ts');
  check('GV1-6 · migrate prGiaoViec: chạy hai lần không đổi; DB cũ sau migrate có cột + bảng giống DB dựng từ schema.sql; DB mới không bị đổi', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    /* DB trước GV-1: cắt ba dòng cột giao việc + khối bảng GV-1 khỏi chữ schema.sql. */
    const cat = SCHEMA
      .replace(/,( +--[^\n]*)?\n {2}phu_trach_id INTEGER REFERENCES users\(id\), giao_boi INTEGER[^\n]*\n\)/g, '$1\n)')
      .replace(/-- GV-1 \(N58, chủ SP 20\/11\): GIAO VIỆC[\s\S]*?idx_meeting_phan_giao[^\n]*\n/, '');
    if (/giao_boi|viec_theo_doi|meeting_phan/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm GV1-6');
    const cu = new SqliteDb(':memory:'); cu.exec(cat);
    const a: string[] = []; migratePrGiaoViec(cu, a);
    const b: string[] = []; migratePrGiaoViec(cu, b);
    assert(a.length >= 7 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const c: string[] = []; migratePrGiaoViec(conn, c);
    assert(c.length === 0, `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (d: any, bang: string) => JSON.stringify((d.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((x) => `${x.name}:${x.type}:${x.notnull}`));
    const chiMuc = (d: any) => JSON.stringify((d.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'index' AND (name LIKE '%giao%' OR name LIKE '%theo_doi%' OR name LIKE '%meeting_phan%') ORDER BY name`).all() as any[]));
    for (const bang of ['viec_bao_ph', 'sos_coordination_actions', 'tinh_hinh_hoc_tap', 'viec_theo_doi', 'viec_giao_lan', 'meeting_phan']) {
      assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    }
    assert(chiMuc(cu).replace(/\s+/g, ' ') === chiMuc(moi).replace(/\s+/g, ' '), `chỉ mục: ${chiMuc(cu)} ≠ ${chiMuc(moi)}`);
  });
}
