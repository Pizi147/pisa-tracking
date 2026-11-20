/**
 * PHÉP KIỂM GV-1 (N58, chủ SP 20/11 — giao việc liên phòng ban, máy chủ; thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` B, B2):
 *  · giao Báo PH cho Admin → Admin thấy ở /my-work ("{tên} giao"), ghi kết quả được; TVV cũ rời "Của tôi", thành người theo dõi, thấy ở /my-work/theo-doi.
 *  · Về mặc định · Hoàn tác (+ 409 sau thay đổi khác) · đổi song song · ngoài chi nhánh 400 · không quyền đổi 403 · người theo dõi ghi 403 · IDOR chi nhánh khác.
 *  · Người được giao bị xoá / hết vai → việc về người theo luật, người đó không ghi được · người nhận cũ không ghi được.
 *  · Tin chuông đúng người, không gửi chính người làm, không trùng tin N41 · id dùng lại sau Hoàn tác không thừa hưởng người theo dõi.
 *  · Meeting CX / GĐCN ba phần, TVV nhập hộ · Head "Tất cả" thấy Phối hợp đã giao · CX thuần: summary khớp dòng · đổi GVCN thật (+ Hoàn tác) / TVV ·
 *    xoá HV → khôi phục thùng rác giữ người theo dõi + lịch sử · migrate chạy hai lần.
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
  const th: any = await import('../yThuc/tinhHinh.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const pc: any = await import('../classes/phanCongGv.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const rac: any = await import('../platform/khoiPhucRac.ts');
  const xoaTK: any = await import('../platform/xoaTaiKhoan.ts');
  const students: any = await import('../students/students.ts');
  const { nguoiVaiCuaChiNhanh } = await import('../platform/audit.ts');
  const { myWork, NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { LUOT_SAU_THI_SQL } = await import('../students/tamDung.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const lop = classId('MB FT 101');
  const mbId = mot(`SELECT branch_id FROM classes WHERE id = ?`, lop).branch_id as number;
  let soTk = 0;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `giaoviec.${ten}.${++soTk}${accounts.EMAIL_SUFFIX}`, password: `matkhau-giaoviec-${ten}`, fullName: `GIAOVIEC ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const tvv = taiKhoan('tvv', 'consultant'); const tvv2 = taiKhoan('tvv2', 'consultant');
  const admin = taiKhoan('admin', 'office_admin'); const cx = taiKhoan('cx', 'cx'); const ngoai = taiKhoan('ngoai', 'consultant', 'CP');
  let dem = 0;
  const moiEm = (): number => {
    const ten = `GIAOVIEC em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `giaoviec-${ten}` } as any);
    const st = mot('SELECT id FROM students WHERE full_name = ?', ten);
    const cy = mot("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  /** Báo PH vi phạm: GVBM ghi một vi phạm, GVCN xác nhận xử lý → việc TVV. */
  const xuLy = (sid: number) => {
    const vid = viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, -1) }).violation.id;
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    return { mid: m.id as number, id: mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', m.id).id as number };
  };
  const baoPhViPham = (sid: number): number => xuLy(sid).id;
  const meeting = (sid: number) => {
    const att = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'cx_meeting_student')
        AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`).id;
    const aid = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'cx_meeting_student', 1, 'pending', ?)`)
      .run(att, sid, new Date().toISOString()).lastInsertRowid);
    ph.confirmCoordination(gvcn, aid, { performedOn: TODAY, note: 'Cần họp CX với em' });
    const phan = hang('SELECT * FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY phan', aid);
    return { aid, xep: phan.find((r) => r.phan === 'xep_lich'), kq: phan.find((r) => r.phan === 'ket_qua'), bpId: mot('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', aid)?.id as number };
  };
  const phoiHopViec = (sid: number, kind = 'talk_family') => {
    const att = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock' AND a.student_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = ?)
        AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`, kind).id;
    return Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, ?, 1, 'pending', ?)`)
      .run(att, sid, kind, new Date().toISOString()).lastInsertRowid);
  };
  const giao = (p: any, loai: string, id: number, userId: number | null) => gv.doiPhuTrach(p, loai, id, { userId, phuTrachCu: gv.xemGiaoViec(P.admin, loai, id).duocGiao ? gv.xemGiaoViec(P.admin, loai, id).phuTrach[0].id : null });
  const items = (p: any, f: Record<string, unknown> = {}) => { xoaNho(); return ((myWork(p, f) as any).items ?? []) as any[]; };
  const theoDoi = (loai: string, id: number) => hang('SELECT user_id, nguon FROM viec_theo_doi WHERE loai = ? AND ref_id = ? ORDER BY user_id', loai, id);
  const tin = (khoa: string) => hang(`SELECT user_id FROM notifications WHERE dedup_key LIKE ?`, `${khoa}%`).map((r) => r.user_id as number);
  const ma = async (fn: () => unknown): Promise<number | null> => { try { await fn(); return null; } catch (e: any) { return e?.status ?? e?.statusCode ?? -1; } };

  await checkAsync('GV1-1 · Báo PH vi phạm: theo dõi mặc định GVCN (gvcn) + GV ghi (gv_ghi) · TVV giao cho Admin → Admin thấy ("{tên} giao"), TVV rời "Của tôi", thành người theo dõi', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    const td0 = theoDoi('bao_ph', id);
    assert(td0.some((r) => r.user_id === gvcn.userId && r.nguon === 'gvcn') && td0.some((r) => r.user_id === gvbm.userId && r.nguon === 'gv_ghi') && !td0.some((r) => r.user_id === tvv.userId),
      `theo dõi mặc định: ${JSON.stringify(td0)}`);
    const k = giao(tvv, 'bao_ph', id, admin.userId);
    assert(k.duocGiao && k.phuTrach[0].id === admin.userId && k.hoanTac, JSON.stringify(k.phuTrach));
    const cuaAdmin = items(admin).find((x) => x.key === `bao-ph:${id}`);
    assert(cuaAdmin && cuaAdmin.mine && cuaAdmin.giaoBoi === 'GIAOVIEC TVV' && cuaAdmin.group === 'bao_ph_yt', `Admin: ${JSON.stringify(cuaAdmin)}`);
    assert(!items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `bao-ph:${id}`), 'TVV cũ không còn ở Của tôi');
    assert(theoDoi('bao_ph', id).some((r) => r.user_id === tvv.userId && r.nguon === 'tvv'), 'TVV cũ (người theo luật tự giao đi) theo dõi, giữ nguồn tvv');
    xoaNho();
    const d = gv.viecTheoDoi(tvv).nhom.find((g: any) => g.loai === 'bao_ph')?.mo.find((x: any) => x.refId === id);
    assert(d && d.phuTrach === 'GIAOVIEC ADMIN' && d.trangThai === 'mo', 'tab Đang theo dõi');
    assert(tin(`gv:bao_ph:${id}:giao:`).includes(admin.userId) && !tin(`gv:bao_ph:${id}:giao:`).includes(tvv.userId), 'Admin nhận tin, người làm (TVV) không');
    bp.ghiKetQuaBaoPh(admin, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
    assert(mot('SELECT trang_thai FROM viec_bao_ph WHERE id = ?', id).trang_thai === 'xong', 'Admin ghi xong');
    const nhan = tin(`gv:bao_ph:${id}:ket_qua:`);
    assert(nhan.includes(tvv.userId) && nhan.includes(gvbm.userId) && !nhan.includes(admin.userId) && !nhan.includes(gvcn.userId), `tin kết quả: ${JSON.stringify(nhan)}`);
    assert(JSON.stringify(tin(`bao-ph-vp:${id}`)) === JSON.stringify([gvcn.userId]), 'GVCN: đúng MỘT tin (tin N41 sẵn có)');
    xoaNho();
    assert(gv.viecTheoDoi(tvv).nhom.find((g: any) => g.loai === 'bao_ph')?.vuaXong.some((x: any) => x.refId === id), 'vừa xong 7 ngày');
  }));

  await checkAsync('GV1-2 · Về mặc định · Hoàn tác · 409 (sau thay đổi khác, đổi song song, phuTrachCu cũ) · 400 ngoài chi nhánh · 403 không quyền / người theo dõi / người nhận cũ', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    assert(await ma(() => gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: admin.userId })) === 400, 'thiếu phuTrachCu → 400');
    assert(await ma(() => giao(tvv, 'bao_ph', id, ngoai.userId)) === 400, 'người chỉ có vai ở CP → 400');
    assert(await ma(() => giao(gvbm, 'bao_ph', id, admin.userId)) === 403, 'GVBM (người theo dõi, không phụ trách) đổi → 403');
    giao(tvv, 'bao_ph', id, admin.userId);
    assert(await ma(() => gv.doiPhuTrach(tvv, 'bao_ph', id, { userId: tvv2.userId, phuTrachCu: admin.userId })) === 403, 'TVV hết là người phụ trách → 403');
    assert(await ma(() => gv.doiPhuTrach(admin, 'bao_ph', id, { userId: tvv2.userId, phuTrachCu: null })) === 409, 'phuTrachCu cũ → 409');
    /* Đổi song song: hai lượt cùng thấy Admin → lượt sau 409. */
    gv.doiPhuTrach(ql, 'bao_ph', id, { userId: tvv2.userId, phuTrachCu: admin.userId });
    assert(await ma(() => gv.doiPhuTrach(ql, 'bao_ph', id, { userId: cx.userId, phuTrachCu: admin.userId })) === 409, 'song song → 409');
    /* Người nhận cũ (Admin) hết quyền theo việc. */
    assert(await ma(() => bp.ghiKetQuaBaoPh(admin, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'Admin ghi sau khi mất việc' })) === 403, 'người nhận cũ ghi → 403');
    assert(await ma(() => bp.ghiKetQuaBaoPh(gvbm, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'GV ghi thử kết quả' })) === 403, 'người theo dõi ghi → 403');
    assert(await ma(() => gv.suaHan(gvbm, 'bao_ph', id, { han: addDays(TODAY, 3), hanCu: null })) === 403, 'người theo dõi sửa hạn → 403');
    assert(await ma(() => gv.themTheoDoi(gvbm, 'bao_ph', id, { userIds: [tvv2.userId] })) === 403, 'người theo dõi thêm theo dõi → 403');
    const xem = bp.xemViecBaoPh(gvbm, id);
    assert(!xem.coTheGhi && xem.lienHe.sdt === null, 'người theo dõi chỉ xem, không SĐT PH');
    /* IDOR: Head chi nhánh khác (xem học viên CP) không đọc được việc của em MB. */
    assert(await ma(() => gv.xemGiaoViec(P.cpManager, 'bao_ph', id)) === 403, 'Head CP đọc việc MB → 403');
    /* Về mặc định → TVV có lại việc; Hoàn tác → về TVV2; sửa hạn rồi Hoàn tác → 409. */
    const k = gv.doiPhuTrach(tvv2, 'bao_ph', id, { userId: null, phuTrachCu: tvv2.userId });
    assert(!k.duocGiao && k.phuTrach[0].id === tvv.userId, 'về mặc định');
    assert(tin(`gv:bao_ph:${id}:giao:`).some((u) => u === tvv.userId), 'TVV (người theo luật) nhận tin việc về lại');
    assert(items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `bao-ph:${id}` && x.mine && !x.giaoBoi), 'TVV có lại việc (theo luật)');
    gv.hoanTacGiao(tvv2, 'bao_ph', id);
    assert(mot('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?', id).phu_trach_id === tvv2.userId, 'Hoàn tác về TVV2');
    gv.suaHan(tvv2, 'bao_ph', id, { han: addDays(TODAY, 9), hanCu: null });
    assert(tin(`gv:bao_ph:${id}:han:`).includes(tvv.userId) && !tin(`gv:bao_ph:${id}:han:`).includes(tvv2.userId), 'tin đổi hạn tới người theo dõi, không tới người làm');
    gv.suaHan(tvv2, 'bao_ph', id, { han: addDays(TODAY, 10), hanCu: addDays(TODAY, 9) });
    gv.suaHan(tvv2, 'bao_ph', id, { han: addDays(TODAY, 9), hanCu: addDays(TODAY, 10) });
    assert(hang(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key LIKE ?`, tvv.userId, `gv:bao_ph:${id}:han:%`).length === 3, 'đổi hạn A→B→A: ba tin');
    assert(await ma(() => gv.hoanTacGiao(tvv2, 'bao_ph', id)) === 409, 'Hoàn tác sau thay đổi khác (hạn) → 409');
  }));

  await checkAsync('GV1-3 · người được giao bị xoá / hết vai ở chi nhánh → việc về người theo luật (lịch sử), không còn ghi được', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    const tam = taiKhoan('tam', 'office_admin');
    giao(tvv, 'bao_ph', id, tam.userId);
    accounts.setRoles(P.admin, tam.userId, [{ role: 'office_admin', branches: ['CP'] }]);
    assert(mot('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?', id).phu_trach_id === null, 'hết vai MB → NULL');
    assert(gv.xemGiaoViec(ql, 'bao_ph', id).lichSu.filter((l: any) => l.truong === 'phu_trach').length === 2, 'lịch sử đặt lại');
    assert(items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `bao-ph:${id}`), 'TVV có lại việc');
    assert(await ma(() => bp.ghiKetQuaBaoPh(loadPrincipal(tam.userId), { viecIds: [id], ketQua: 'da_bao', ghiChu: 'Người hết vai ghi thử' })) === 403, 'hết vai ghi → 403');
    /* Xoá tài khoản người được giao. */
    const tam2 = taiKhoan('tam2', 'office_admin');
    giao(tvv, 'bao_ph', id, tam2.userId);
    xoaTK.xoaTaiKhoan(P.admin, tam2.userId);
    assert(mot('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?', id).phu_trach_id === null, 'xoá tài khoản → NULL');
    /* Ghi đè còn trong DB mà hết hiệu lực (sửa tay) → đọc như NULL. */
    const tam3 = taiKhoan('tam3', 'office_admin');
    conn.prepare('UPDATE viec_bao_ph SET phu_trach_id = ? WHERE id = ?').run(tam3.userId, id);
    conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(tam3.userId);
    assert(gv.xemGiaoViec(ql, 'bao_ph', id).phuTrach[0].id === tvv.userId, 'đọc: người được giao hết hiệu lực → người theo luật');
  }));

  await checkAsync('GV1-4 · id dùng lại sau Hoàn tác (xử lý · tình hình) không thừa hưởng người theo dõi / lịch sử', () => thu(async () => {
    const sid = moiEm();
    const { mid, id } = xuLy(sid);
    gv.themTheoDoi(ql, 'bao_ph', id, { userIds: [tvv2.userId] });
    xu.hoanTacXuLy(gvcn, mid);
    assert(!hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ?`, id).length && !hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'bao_ph' AND ref_id = ?`, id).length, 'Hoàn tác xử lý: dọn theo dõi + lịch sử');
    const thId = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    gv.themTheoDoi(ql, 'tinh_hinh', thId, { userIds: [gvbm.userId] });
    th.rutTinhHinh(tvv, thId, { hoanTac: true });
    assert(!hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tinh_hinh' AND ref_id = ?`, thId).length, 'Hoàn tác gửi tình hình: dọn theo dõi');
  }));

  await checkAsync('GV1-5 · Hỏi tình hình + Phối hợp SOS giao đi: người được giao làm được, rời dòng GVCN; Head "Tất cả" + hồ sơ HV thấy, đứng tên người được giao; người theo dõi 403', () => thu(async () => {
    const sid = moiEm();
    const thId = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    assert(items(gvcn).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`), 'trước: GVCN giữ');
    giao(gvcn, 'tinh_hinh', thId, tvv2.userId);
    assert(!items(gvcn).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`) && items(tvv2, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `yt_hoi_tinh_hinh:${thId}`), 'GVCN rời, TVV2 có');
    assert(await ma(() => th.traLoiTinhHinh(gvbm, thId, { traLoi: 'GVBM trả lời thử nội dung' })) === 403, 'người theo dõi / ngoài việc trả lời → 403');
    th.traLoiTinhHinh(tvv2, thId, { traLoi: 'Em học tốt, chăm làm bài tập' });
    assert(mot('SELECT trang_thai FROM tinh_hinh_hoc_tap WHERE id = ?', thId).trang_thai === 'xong', 'TVV2 trả lời được');
    assert(hang(`SELECT 1 FROM notifications WHERE user_id = ? AND (dedup_key LIKE 'gv:tinh_hinh:%' OR dedup_key LIKE ?)`, tvv.userId, `tinh-hinh-tra-loi:${thId}`).length === 1, 'TVV hỏi: MỘT tin');
    /* Phối hợp SOS giao cho TVV2: TVV2 xác nhận được; Head "Tất cả" thấy dòng đứng tên TVV2; người theo dõi xác nhận → 403. */
    const x = phoiHopViec(sid);
    giao(gvcn, 'phoi_hop', x, tvv2.userId);
    const tatCa = items(ql, { nguoi: 'tat-ca' }).find((it) => it.key === `phoi_hop_viec:${x}`);
    assert(tatCa && tatCa.ownerId === tvv2.userId && !tatCa.mine, `Head Tất cả: ${JSON.stringify(tatCa)}`);
    assert(items(tvv2, { chiNhom: NHOM_VIEC_TVV }).some((it) => it.key === `phoi_hop_viec:${x}`), 'TVV2 có ở Của tôi');
    assert(await ma(() => ph.confirmCoordination(gvbm, x, { performedOn: TODAY, note: 'GVBM xác nhận thử' })) === 403, 'người ngoài việc xác nhận → 403');
    ph.confirmCoordination(tvv2, x, { performedOn: TODAY, note: 'Đã gọi gia đình em' });
    assert(mot('SELECT status FROM sos_coordination_actions WHERE id = ?', x).status === 'done', 'TVV2 xác nhận được');
    ph.confirmCoordination(tvv2, x, { performedOn: TODAY, note: 'Đã gọi gia đình em (sửa)' });
    assert(hang(`SELECT 1 FROM notifications WHERE dedup_key LIKE ?`, `gv:phoi_hop:${x}:ket_qua:%`).length === hang(`SELECT DISTINCT user_id FROM viec_theo_doi WHERE loai = 'phoi_hop' AND ref_id = ? AND user_id != ?`, x, tvv2.userId).length,
      'sửa việc đã xong không báo lại');
  }));

  const voiMeeting = async (fn: () => Promise<void>) => fn();   // GV-2: hai nhóm Meeting luôn bật ở /my-work
  await checkAsync('GV1-6 · Meeting CX/GĐCN: ba phần độc lập, TVV nhập hộ, người theo dõi 403, Hoàn tác, sửa có lịch sử, CX thuần summary khớp, IDOR panel', () => thu(() => voiMeeting(async () => {
    const sid = moiEm();
    const { aid, xep, kq, bpId } = meeting(sid);
    assert(xep && kq && xep.trang_thai === 'mo' && kq.trang_thai === 'mo' && bpId, 'ba phần');
    const coBpxl = nguoiVaiCuaChiNhanh(mbId, 'scheduler').length > 0;
    if (!coBpxl) assert(items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `meeting_xep_lich:${xep.id}`), 'chưa có BPXL → TVV của em xếp lịch');
    const wCx = myWork(cx, {}) as any;
    assert(wCx.items.some((x: any) => x.key === `meeting_ket_qua:${kq.id}` && x.mine), 'CX có Kết quả meeting');
    assert(wCx.summary.total === wCx.dong.length && wCx.summary.mine === wCx.dong.filter((d: any) => d.mine).length && wCx.summary.viec >= 1, `CX thuần: summary khớp số dòng ${JSON.stringify(wCx.summary)}`);
    assert(!items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `meeting_ket_qua:${kq.id}`), 'Kết quả meeting không phải việc của TVV');
    const td = theoDoi('meeting', kq.id);
    assert(td.some((r) => r.user_id === tvv.userId && r.nguon === 'tvv') && td.some((r) => r.user_id === gvcn.userId && r.nguon === 'gvcn') && td.some((r) => r.nguon === 'head'), `theo dõi Meeting: ${JSON.stringify(td)}`);
    assert(!theoDoi('bao_ph', bpId).some((r) => r.user_id === tvv.userId), 'người theo luật (TVV) không theo dõi chính việc Báo PH của mình');
    assert(items(ql, { nguoi: 'tat-ca' }).some((x) => x.key === `meeting_ket_qua:${kq.id}`), 'Head "Tất cả" thấy phần Meeting của CX');
    const k = gv.xongPhanMeeting(tvv, kq.id, { ketQua: 'Gia đình đồng ý kèm em thêm' });
    assert(k.meeting.trangThai === 'xong' && k.meeting.nhapHoBoi === 'GIAOVIEC TVV', 'TVV nhập hộ');
    assert(mot('SELECT trang_thai FROM viec_bao_ph WHERE id = ?', bpId).trang_thai === 'mo', 'Báo PH độc lập');
    assert(await ma(() => gv.xongPhanMeeting(gvbm, xep.id, {})) === 403, 'GVBM (không phụ trách) → 403');
    assert(await ma(() => gv.suaHan(gvbm, 'meeting', xep.id, { han: TODAY, hanCu: null })) === 403, 'GVBM sửa hạn phần Meeting → 403');
    gv.suaHan(gvcn, 'meeting', xep.id, { han: addDays(TODAY, 2), hanCu: null });   // N34 ①: GVCN sửa hạn được
    if (!coBpxl) {
      assert(await ma(() => gv.xongPhanMeeting(tvv, xep.id, { ngayGio: '2026-13-01' })) === 400, 'ngày giờ sai → 400');
      gv.xongPhanMeeting(tvv, xep.id, {});
      const k2 = gv.xongPhanMeeting(tvv, xep.id, { ngayGio: `${TODAY} 15:00` });
      assert(k2.meeting.ngayGio === `${TODAY} 15:00` && k2.lichSu.some((l: any) => l.truong === 'sua'), 'sửa có lịch sử');
      gv.moLaiPhanMeeting(tvv, xep.id);
      assert(mot('SELECT trang_thai FROM meeting_phan WHERE id = ?', xep.id).trang_thai === 'mo', 'Hoàn tác → chưa xong');
    }
    assert(tin(`gv:meeting:${kq.id}:ket_qua:`).includes(gvcn.userId) && !tin(`gv:meeting:${kq.id}:ket_qua:`).includes(tvv.userId), 'tin có kết quả: GVCN có, người làm không');
    assert(await ma(() => gv.xemMeeting(P.cpManager, aid)) === 403, 'IDOR: Head CP đọc panel Meeting MB → 403');
    ph.moLaiCoordination(gvcn, aid);
    const sau = hang('SELECT phan, trang_thai FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY phan', aid);
    assert(sau.find((r) => r.phan === 'ket_qua').trang_thai === 'xong' && sau.find((r) => r.phan === 'xep_lich').trang_thai === 'bo', JSON.stringify(sau));
    assert(!items(cx).some((x) => x.key === `meeting_xep_lich:${xep.id}`), 'phần đã đóng rời /my-work');
  })));

  await checkAsync('GV1-7 · đổi TVV / đổi GVCN thật (luuPhanCong + Hoàn tác): theo dõi `tvv` / `gvcn` chuyển theo, `gv_ghi` giữ', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    giao(ql, 'bao_ph', id, admin.userId);   // Head giao → TVV (người theo luật trước) theo dõi nguồn `tvv`
    assert(theoDoi('bao_ph', id).some((r) => r.user_id === tvv.userId && r.nguon === 'tvv'), 'TVV trước = theo dõi tvv');
    students.updateStudent(P.admin, sid, { consultantUserId: tvv2.userId });
    const td = theoDoi('bao_ph', id).map((r) => r.user_id);
    assert(td.includes(tvv2.userId) && !td.includes(tvv.userId), `đổi TVV: ${JSON.stringify(td)}`);
    const slots = hang(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, lop)
      .map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
    const moi = slots.filter((s) => !s.isCore).concat([{ userId: P.w2Teacher.userId, skill: null, isCore: true }]);
    const r = pc.luuPhanCong(ql, { lop: [{ classId: lop, slots: moi }] });
    const td2 = theoDoi('bao_ph', id);
    assert(td2.some((x) => x.user_id === P.w2Teacher.userId && x.nguon === 'gvcn') && !td2.some((x) => x.user_id === gvcn.userId) && td2.some((x) => x.user_id === gvbm.userId && x.nguon === 'gv_ghi'),
      `đổi GVCN: ${JSON.stringify(td2)}`);
    pc.hoanTacLuu(ql, { lo: r.lo });
    assert(theoDoi('bao_ph', id).some((x) => x.user_id === gvcn.userId && x.nguon === 'gvcn'), 'Hoàn tác phân công → GVCN cũ theo dõi lại');
  }));

  await checkAsync('GV1-8 · xoá HV → khôi phục từ thùng rác: người theo dõi + lịch sử giao trở lại', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    giao(tvv, 'bao_ph', id, admin.userId);
    const truoc = { td: theoDoi('bao_ph', id).length, ls: hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'bao_ph' AND ref_id = ?`, id).length };
    const ma2 = mot('SELECT student_code FROM students WHERE id = ?', sid).student_code;
    const x = xoaHV.xoaHocVien(P.admin, sid, { maXacNhan: ma2 });
    assert(!theoDoi('bao_ph', id).length, 'xoá HV: dọn theo dõi');
    rac.khoiPhucRac(P.admin, x.thungRacId);
    assert(theoDoi('bao_ph', id).length === truoc.td && hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'bao_ph' AND ref_id = ?`, id).length === truoc.ls, 'khôi phục: theo dõi + lịch sử');
  }));

  await checkAsync('GV1-10 · BPXL thuần (N57: không việc theo luật) được giao một việc Báo PH → thấy ở /my-work, ghi được; Xếp lịch họp ở chi nhánh có BPXL là của BPXL', () => thu(() => voiMeeting(async () => {
    const bpxl = taiKhoan('bpxl', 'scheduler');
    const sid = moiEm(); const id = baoPhViPham(sid);
    giao(tvv, 'bao_ph', id, bpxl.userId);
    const w = myWork(bpxl, {}) as any;
    assert(w.items.some((x: any) => x.key === `bao-ph:${id}` && x.mine) && w.summary.viec >= 1, `BPXL /my-work: ${JSON.stringify(w.items.map((x: any) => x.key))}`);
    bp.ghiKetQuaBaoPh(bpxl, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'BPXL đã gọi phụ huynh em' });
    assert(mot('SELECT trang_thai FROM viec_bao_ph WHERE id = ?', id).trang_thai === 'xong', 'BPXL ghi được');
    const { xep } = meeting(moiEm());
    xoaNho();
    assert(((myWork(bpxl, {}) as any).items as any[]).some((x) => x.key === `meeting_xep_lich:${xep.id}` && x.mine), 'BPXL có Xếp lịch họp');
    assert(!items(tvv, { chiNhom: NHOM_VIEC_TVV }).some((x) => x.key === `meeting_xep_lich:${xep.id}`), 'có BPXL → TVV không giữ Xếp lịch họp');
  })));

  const yc: any = await import('../duyet/yeuCau.ts');
  const snv: any = await import('../phanTich/soNghiaVu.ts');
  await checkAsync('GV1-11 · (A) Hoàn tác DUYỆT xoá việc Báo PH → dọn cả người theo dõi thêm tay + lịch sử (id dùng lại không rò)', () => thu(async () => {
    const sid = moiEm();
    const ids = [1, 2, 3].map((i) => viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `GV1-11 vi phạm ${i}`, occurredOn: addDays(TODAY, -i) }).violation.id);
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: ids, note: 'Em vi phạm nhiều lần, cần Head quyết' });
    (await import('../platform/attachments.ts') as any).addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    const ycId = mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id;
    yc.duyetYeuCau(ql, ycId);
    const v = mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', nhap.id);
    assert(v, 'duyệt sinh việc Báo PH');
    gv.themTheoDoi(ql, 'bao_ph', v.id, { userIds: [tvv2.userId] });
    yc.huyQuyetDinh(ql, ycId);
    assert(!mot('SELECT id FROM viec_bao_ph WHERE id = ?', v.id), 'Huỷ duyệt xoá việc');
    assert(!hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ?`, v.id).length && !hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'bao_ph' AND ref_id = ?`, v.id).length,
      'dọn theo dõi thêm tay + lịch sử');
  }));

  await checkAsync('GV1-12 · (B) phần Meeting: người giữ vai đọc MỘT lần mỗi request, không câu con theo dòng; một em → lọc ngay trong vế', () => thu(() => voiMeeting(async () => {
    for (let i = 0; i < 3; i++) meeting(moiEm());
    const { soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts') as any;
    let n = 0;
    chayTrongRequest('GET', () => { const truoc = soCauSql(); gv.viecGiaoChoToi(ql, { today: TODAY }); n = soCauSql() - truoc; });
    assert(n >= 1 && n <= 2, `viecGiaoChoToi (3 Meeting): ${n} câu (≤ 2: UNION + người giữ vai)`);
    const sid = moiEm(); const { kq } = meeting(sid);
    assert(gv.viecGiaoChoToi(cx, { today: TODAY, studentId: sid }).every((x: any) => x.studentId === sid) && gv.viecGiaoChoToi(cx, { today: TODAY, studentId: sid }).some((x: any) => x.key === `meeting_ket_qua:${kq.id}`), 'một em');
  })));

  await checkAsync('GV1-13 · (C) em đổi chi nhánh: phần Meeting còn mở theo chi nhánh mới; người được giao hết vai ở chi nhánh mới → về người theo luật', () => thu(() => voiMeeting(async () => {
    const sid = moiEm(); const { kq } = meeting(sid);
    const id = baoPhViPham(sid);
    giao(tvv, 'bao_ph', id, admin.userId);   // Admin chỉ có vai MB
    const lopCp = mot(`SELECT c.id, c.branch_id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.status = 'active' LIMIT 1`);
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND status = 'active'`).run(sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(sid, lopCp.id, TODAY, new Date().toISOString());
    conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(lopCp.branch_id, sid);
    gv.sauDoiChiNhanhEm([sid], ql.userId);
    assert(mot('SELECT branch_id FROM meeting_phan WHERE id = ?', kq.id).branch_id === lopCp.branch_id, 'branch_id phần Meeting = chi nhánh mới');
    assert(mot('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?', id).phu_trach_id === null, 'Admin MB hết vai ở CP → về người theo luật');
  })));

  check('GV1-14 · (D) sổ nghĩa vụ: Phối hợp đã giao — MỘT khoá mở → xong', () => {
    assert(snv.khoaDonVi('phoi_hop_viec:77', { due: '2026-11-01' }) === snv.khoaDonVi('phoi-hop-giao-xong:77', { due: '2026-11-02', classId: 5 }), 'khoá mở = khoá xong');
    assert(snv.khoaDonVi('phoi-hop-xong:77', { due: '2026-11-01', classId: 5 }) !== snv.khoaDonVi('phoi_hop_viec:77', { due: '2026-11-01' }), 'việc theo luật giữ đơn vị lớp');
  });

  await checkAsync('GV1-15 · (E) Hoàn tác phân công không bị chặn bởi dòng theo dõi đổi sau; người theo dõi gvcn tính lại theo GVCN sau khi đảo', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    const slots = hang(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, lop).map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
    const r = pc.luuPhanCong(ql, { lop: [{ classId: lop, slots: slots.filter((s) => !s.isCore).concat([{ userId: P.w2Teacher.userId, skill: null, isCore: true }]) }] });
    gv.boTheoDoi(gvbm, 'bao_ph', id, gvbm.userId);   // một dòng theo dõi đổi sau lần lưu
    baoPhViPham(moiEm());   // việc mới của lớp (dòng theo dõi mới)
    pc.hoanTacLuu(ql, { lo: r.lo });
    assert(theoDoi('bao_ph', id).some((x) => x.user_id === gvcn.userId && x.nguon === 'gvcn') && !theoDoi('bao_ph', id).some((x) => x.user_id === P.w2Teacher.userId), 'gvcn về GVCN cũ');
  }));

  await checkAsync('GV1-16 · (F) người theo dõi đã rời chi nhánh của việc: không thấy ở tab, không nhận tin, không đọc panel', () => thu(async () => {
    const sid = moiEm(); const id = baoPhViPham(sid);
    const roi = taiKhoan('roi', 'consultant');
    gv.themTheoDoi(ql, 'bao_ph', id, { userIds: [roi.userId] });
    accounts.setRoles(P.admin, roi.userId, [{ role: 'consultant', branches: ['CP'] }]);
    const p2 = loadPrincipal(roi.userId);
    xoaNho();
    assert(!gv.viecTheoDoi(p2).nhom.some((g: any) => g.mo.some((x: any) => x.refId === id)), 'tab Đang theo dõi bỏ việc');
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
    assert(!tin(`gv:bao_ph:${id}:ket_qua:`).includes(roi.userId), 'không nhận tin có kết quả');
    assert(await ma(() => bp.xemViecBaoPh(p2, id)) === 403, 'không đọc panel');
  }));

  await checkAsync('GV2-1 · Phối hợp giao cho Admin: cờ lamDuoc đúng TỪNG việc (việc khác của lượt không; canAct lượt vẫn chỉ người quản lý), người ngoài 403; Meeting: bối cảnh + SĐT PH chỉ người làm được; tab theo dõi ghi tên người theo luật; migrate sinh bù phần Meeting → có người theo dõi mặc định', () => thu(async () => {
    const { migratePrGiaoViec } = await import('../migrate/prGiaoViec.ts');
    const sid = moiEm(); const x = phoiHopViec(sid);
    const y = phoiHopViec(sid, 'talk_student');
    assert(!ph.coordinationOfStudent(admin, sid).rows.some((r: any) => r.canAct || r.actions.some((a: any) => a.lamDuoc)), 'Admin (không discipline.manage) chưa được giao → không làm được gì');
    giao(gvcn, 'phoi_hop', x, admin.userId);
    const the = ph.coordinationOfStudent(admin, sid);
    const ds = the.rows.flatMap((r: any) => r.actions);
    assert(ds.find((a: any) => a.id === x)?.lamDuoc === true, 'được giao → lamDuoc ở việc đó');
    assert(ds.find((a: any) => a.id === y)?.lamDuoc === false && !the.rows.some((r: any) => r.canAct), 'việc khác của em / thêm việc: không');
    assert(ph.coordinationOfStudent(gvcn, sid).rows.flatMap((r: any) => r.actions).every((a: any) => a.lamDuoc), 'GVCN làm được mọi việc');
    assert(await ma(() => ph.coordinationOfStudent(ngoai, sid)) === 403, 'người ngoài vẫn 403');
    const mt = meeting(moiEm());
    const { aid } = mt;
    const bcCx = gv.xemMeeting(cx, aid).boiCanh;
    assert(bcCx.phuHuynh !== null && bcCx.gvcn, `CX (làm Kết quả meeting) thấy PH + GVCN: ${JSON.stringify(bcCx)}`);
    assert(gv.xemMeeting(gvbm, aid).boiCanh.phuHuynh === null, 'GVBM chỉ xem (không làm phần nào) → không SĐT PH');
    xoaNho();
    const dTd = gv.viecTheoDoi(tvv).nhom.find((g: any) => g.loai === 'meeting')?.mo.find((d: any) => d.refId === mt.kq.id);
    assert(dTd && dTd.phuTrach && !/chi nhánh/.test(dTd.phuTrach), `tab theo dõi: tên người theo luật, không ghi vai: ${dTd?.phuTrach}`);
    const ids = hang('SELECT id FROM meeting_phan WHERE phoi_hop_id = ?', aid).map((r) => r.id);
    conn.prepare(`DELETE FROM viec_theo_doi WHERE loai = 'meeting' AND ref_id IN (${ids.join(',')})`).run();
    conn.prepare('DELETE FROM meeting_phan WHERE phoi_hop_id = ?').run(aid);
    const a: string[] = []; migratePrGiaoViec(conn, a);
    const moi = hang('SELECT id FROM meeting_phan WHERE phoi_hop_id = ?', aid).map((r) => r.id);
    assert(moi.length === 2 && moi.every((id) => hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'meeting' AND ref_id = ?`, id).length > 0), `phần sinh bù có người theo dõi: ${a.join(' | ')}`);
    const b: string[] = []; migratePrGiaoViec(conn, b);
    assert(!b.length, `lần 2 không đổi: ${b.join(' | ')}`);
  }));

  await checkAsync('GV2-2 · (PTA rà quyền #1930) người được giao không xem được em → thẻ Phối hợp CHỈ việc của mình · ô giao việc một chi nhánh, ngoài phạm vi [] · vai Tutor không nhận việc (ô chọn + máy chủ cùng danh sách)', () => thu(async () => {
    const tn: any = await import('../platform/timNguoi.ts');
    const gvk = taiKhoan('gvkhac', 'teacher');   // GV ở MB, không dạy lớp em → không student.view
    const sid = moiEm(); const x = phoiHopViec(sid); const y = phoiHopViec(sid, 'talk_student');
    assert(await ma(() => ph.coordinationOfStudent(gvk, sid)) === 403, 'chưa được giao → 403');
    giao(gvcn, 'phoi_hop', x, gvk.userId);
    const ds = ph.coordinationOfStudent(gvk, sid).rows.flatMap((r: any) => r.actions);
    assert(ds.length === 1 && ds[0].id === x && ds[0].lamDuoc, `chỉ việc được giao: ${ds.map((a: any) => a.id)} (y = ${y})`);
    const cnMb = tn.timNguoi(ql, { moiVai: true, chiNhanh: mbId, q: '' }) as any[];
    assert(cnMb.length > 0 && cnMb.every((r) => r.branches.length <= 1), 'một chi nhánh — không lộ chi nhánh khác của người đó');
    const cp = mot(`SELECT id FROM branches WHERE code = 'CP'`).id;
    assert(tn.timNguoi(ql, { moiVai: true, chiNhanh: cp, q: '' }).length === 0, 'chi nhánh ngoài phạm vi (Head MB hỏi CP) → []');
    assert(tn.timNguoi(ql, { moiVai: true, chiNhanh: null, q: '' }).length === 0, 'không chi nhánh → []');
    const tutor = taiKhoan('tutor', 'head_tutor');
    assert(!tn.timNguoi(ql, { moiVai: true, chiNhanh: mbId, q: 'GIAOVIEC TUTOR' }).some((r: any) => r.id === tutor.userId), 'ô chọn không có vai Tutor');
    const bp = baoPhViPham(moiEm());
    assert(await ma(() => gv.doiPhuTrach(tvv, 'bao_ph', bp, { userId: tutor.userId, phuTrachCu: null })) === 400, 'máy chủ không nhận vai Tutor (400)');
  }));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrGiaoViec } = await import('../migrate/prGiaoViec.ts');
  check('GV1-9 · migrate prGiaoViec: chạy hai lần không đổi; tự lành khi thiếu chỉ mục; DB cũ sau migrate có cột + bảng giống DB dựng từ schema.sql; DB mới không bị đổi', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    /* DB trước GV-1: cắt ba dòng cột giao việc + khối bảng GV-1 khỏi chữ schema.sql. */
    const cat = SCHEMA
      .replace(/,( +--[^\n]*)?\n {2}phu_trach_id INTEGER REFERENCES users\(id\), giao_boi INTEGER[^\n]*\n\)/g, '$1\n)')
      .replace(/-- GV-1 \(N58, chủ SP 20\/11\): GIAO VIỆC[\s\S]*?idx_meeting_phan_giao[^\n]*\n/, '');
    if (/giao_boi|viec_theo_doi|meeting_phan/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm GV1-9');
    const cu = new SqliteDb(':memory:'); cu.exec(cat);
    const a: string[] = []; migratePrGiaoViec(cu, a);
    const b: string[] = []; migratePrGiaoViec(cu, b);
    assert(a.length >= 7 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    cu.exec('DROP INDEX uq_viec_theo_doi'); cu.exec('DROP INDEX idx_meeting_phan_mo');
    const c2: string[] = []; migratePrGiaoViec(cu, c2);
    assert(c2.length === 2, `tự lành: ${c2.join(' | ')}`);
    const c: string[] = []; migratePrGiaoViec(conn, c);
    assert(!c.some((x) => !/sinh \d+ phần Meeting/.test(x)), `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (d: any, bang: string) => JSON.stringify((d.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((x) => `${x.name}:${x.type}:${x.notnull}`));
    const chiMuc = (d: any) => JSON.stringify((d.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'index' AND (name LIKE '%giao%' OR name LIKE '%theo_doi%' OR name LIKE '%meeting_phan%') ORDER BY name`).all() as any[]));
    for (const bang of ['viec_bao_ph', 'sos_coordination_actions', 'tinh_hinh_hoc_tap', 'viec_theo_doi', 'viec_giao_lan', 'meeting_phan']) {
      assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    }
    assert(chiMuc(cu).replace(/\s+/g, ' ') === chiMuc(moi).replace(/\s+/g, ' '), `chỉ mục: ${chiMuc(cu)} ≠ ${chiMuc(moi)}`);
  });
}
