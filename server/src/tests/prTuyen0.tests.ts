/**
 * PHÉP KIỂM TUYEN-0 (N72 ①–④, chủ SP 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 4.5, 7):
 *  · mỗi loại tuyến một ca: vi phạm mặc định / khác mặc định / thu hồi / trả lại · Phối hợp có / không bước TVV · Meeting hai phần, Kết quả meeting cuối,
 *    em SOS 3 chỉ một Báo PH · Tình hình hai chiều · sửa cấp bậc.
 *  · C1 theo dõi theo tuyến (người làm bước giữa theo dõi, người làm bước cuối không, người giữ bước đang ở không) · Bỏ theo dõi / theo dõi lại.
 *  · C2 bước chưa tới lượt không thành việc / số / chuông · C3 BPXL thấy khung, không nhận `noiDung` · em Lưu trữ chỉ xem · trần câu (`TRAN_TUYEN`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrTuyen0Tests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nTUYEN-0 · tuyến việc Ý thức & Phối hợp: dựng tuyến · bước tương lai · quyền nội dung · theo dõi theo tuyến');

  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const th: any = await import('../yThuc/tinhHinh.ts');
  const tl: any = await import('../yThuc/traLai.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const tu: any = await import('../yThuc/tuyen.ts');
  const att: any = await import('../platform/attachments.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho, soCauSql, soDongSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts') as any;
  const { LUOT_SAU_THI_SQL } = await import('../students/tamDung.ts');
  const { TRAN_TUYEN } = await import('./tocDoDuong.ts');
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /* Tệp ĐỘC LẬP: bản chép DB gốc riêng — mỗi phép một em mới, không cần ROLLBACK. */
  const thu = async (fn: () => void | Promise<void>) => { try { await fn(); } finally { xoaNho(); } };
  const ma = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const lop = classId('MB FT 101');
  let soTk = 0;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `tuyen0.${ten}.${++soTk}${accounts.EMAIL_SUFFIX}`, password: `matkhau-tuyen0-${ten}`, fullName: `TUYEN0 ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const tvv = taiKhoan('tvv', 'consultant'); const bpxl = taiKhoan('bpxl', 'scheduler');
  let dem = 0;
  const moiEm = (): number => {
    const ten = `TUYEN0 em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `tuyen0-${ten}` } as any);
    const st = mot('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, mot("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  const viPham = (sid: number, i = 1) => viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: `Nói chuyện riêng lần ${i}`, occurredOn: addDays(TODAY, -i) }).violation.id as number;
  const xuLy = (sid: number) => {
    const vid = viPham(sid);
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    return { vid, mid: m.id as number, bpId: mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', m.id).id as number };
  };
  const tuyen = (p: any, loai: string, khoa: string | number) => { xoaNho(); return tu.dungTuyen(p, { loai, khoa: String(khoa) }); };
  const ten = (x: any) => x.buoc.map((b: any) => `${b.ten}:${b.trangThai}`).join(' → ');
  const theoDoi = (p: any) => { xoaNho(); return tu.theoDoiTuyen(p).tuyen as any[]; };
  const luot = (sid: number, kinds: string[]) => {
    const att = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock' AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id)
        AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`).id as number;
    /* Lượt mượn của bộ demo — gắn cho em mới (một em × một lượt). */
    conn.prepare('UPDATE assessment_attempts SET student_id = ? WHERE id = ?').run(sid, att);
    const ids = kinds.map((k) => Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, ?, 1, 'pending', ?)`)
      .run(att, sid, k, new Date().toISOString()).lastInsertRowid));
    return { att, ids };
  };
  const soViec = (p: any) => { xoaNho(); return ((myWork(loadPrincipal(p.userId), {}) as any).items ?? []).length as number; };
  const soTin = () => mot('SELECT COUNT(*) AS n FROM notifications').n as number;

  await checkAsync('TUYEN0-1 · vi phạm MẶC ĐỊNH: GV ghi → Xử lý (xong) → Báo PH (TVV, đang); GVCN theo dõi cả tuyến, TVV (đang giữ) không', () => thu(() => {
    const sid = moiEm();
    const vid = viPham(sid);
    /* Trước khi xử lý: tuyến "đang chờ xử lý" của em — Báo PH chưa tới lượt (○), TVV KHÔNG có việc (C2). */
    viPham(sid, 2); viPham(sid, 3);   // luật 3 vi phạm / 2 tuần → bắt buộc xử lý
    const cho = tuyen(gvcn, 'vi_pham', `em${sid}`);
    assert(ten(cho) === 'GV ghi 3 vi phạm:xong → Xử lý vi phạm:dang → Báo PH:cho', `chờ xử lý: ${ten(cho)}`);
    assert(cho.buoc[2].nguoi === tvv.fullName && cho.buoc[2].chiTiet === 'sau khi xử lý' && cho.buoc[1].laToi, `bước sau: ${JSON.stringify(cho.buoc[2])}`);
    /* TUYEN-1 (N74): tuyến chờ xử lý trả tên MỘT Head chi nhánh em (`headCua`) — web xem trước ○ Head duyệt khi chọn khác mặc định; tuyến lần xử lý không có trường này. */
    assert(cho.head === ql.fullName, `head: ${cho.head} ≠ ${ql.fullName}`);
    const viecTvv = soViec(tvv); const tinTruoc = soTin();
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vid], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    const x = tuyen(gvcn, 'vi_pham', m.id);
    assert(ten(x) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Báo PH:dang', `mặc định: ${ten(x)}`);
    assert(x.dangO?.ten === 'Báo PH' && x.dangO.nguoi === tvv.fullName && x.xong === 2 && x.tong === 3 && !x.ketThuc, `đang ở: ${JSON.stringify(x.dangO)}`);
    /* C1: GVCN làm xong phần mình → Đang theo dõi một dòng "Đang ở Báo PH · TVV"; TVV giữ bước đang ở → không. */
    const d = theoDoi(gvcn).find((r) => r.loai === 'vi_pham' && r.khoa === String(m.id));
    assert(d && d.nhan === `Đang ở Báo PH · ${tvv.fullName}` && d.chuoi.join(',') === 'xong,xong,dang', `GVCN Đang theo dõi: ${JSON.stringify(d)}`);
    assert(!theoDoi(tvv).some((r) => r.khoa === String(m.id)), 'TVV đang giữ bước → không ở Đang theo dõi');
    /* GVBM (theo dõi mặc định N58 của Báo PH) → một dòng tuyến gom việc Báo PH. */
    const g = theoDoi(gvbm).find((r) => r.khoa === String(m.id));
    assert(g && g.viec.includes(`bao_ph:${x.buoc[2].viec.id}`), `GVBM gom việc N58: ${JSON.stringify(g)}`);
    /* Số việc / chuông: đọc tuyến không ghi gì; việc TVV tăng đúng một (việc Báo PH thật, không thêm bước ○ nào). */
    const tin = soTin(); tuyen(tvv, 'vi_pham', m.id); theoDoi(gvcn); theoDoi(tvv);
    assert(soTin() === tin, 'đọc tuyến / Đang theo dõi không sinh tin');
    assert(soViec(tvv) === viecTvv + 1 && soTin() >= tinTruoc, `TVV: ${viecTvv} → ${soViec(tvv)} việc`);
    /* TVV báo PH xong → tuyến xong; GVCN thấy ở "vừa xong", nội dung Báo PH đọc được (GVCN xem Ý thức em). */
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [x.buoc[2].viec.id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
    const xong = tuyen(gvcn, 'vi_pham', m.id);
    assert(xong.ketThuc && xong.buoc[2].trangThai === 'xong' && xong.buoc[2].noiDung === 'Đã gọi mẹ em, mẹ hứa nhắc em', `xong: ${JSON.stringify(xong.buoc[2])}`);
    assert(theoDoi(gvcn).find((r) => r.khoa === String(m.id))?.ketThuc === true, 'GVCN: tuyến xong vẫn ở Vừa xong (7 ngày)');
    assert(!theoDoi(tvv).some((r) => r.khoa === String(m.id)), 'TVV làm bước CUỐI → không theo dõi');
  }));

  await checkAsync('TUYEN0-2 · vi phạm KHÁC MẶC ĐỊNH: đề xuất → Head duyệt (đang) → Đã thực hiện / Báo PH chưa tới lượt; Head duyệt → Đã thực hiện đang', () => thu(() => {
    const sid = moiEm();
    const vid = viPham(sid);
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: [vid], note: 'Em vi phạm nhiều lần, cần Head quyết' });
    /* Ngoài thang cần bằng chứng — một liên kết (như GV1-11). */
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    const a = tuyen(gvcn, 'vi_pham', nhap.id);
    assert(ten(a) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Head duyệt:dang → Đã thực hiện:cho → Báo PH:cho', `chờ Head: ${ten(a)}`);
    assert(a.buoc[2].nguoi && a.buoc[2].han && a.buoc[4].chiTiet === 'sau khi Head duyệt', `Head duyệt: ${JSON.stringify(a.buoc[2])} · ${JSON.stringify(a.buoc[4])}`);
    /* TUYEN-1 (mockup v27 T2): Đã thực hiện ‖ Báo PH cùng lúc; các bước trước không. */
    assert(a.buoc[3].cungLuc && a.buoc[4].cungLuc && !a.buoc[2].cungLuc && !a.buoc[1].cungLuc, `cùng lúc: ${a.buoc.map((x: any) => x.cungLuc).join(',')}`);
    assert(theoDoi(gvcn).find((r) => r.khoa === String(nhap.id))?.nhan.startsWith('Đang ở Head duyệt'), 'GVCN theo dõi: Đang ở Head duyệt');
    yc.duyetYeuCau(ql, mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id);
    const b = tuyen(ql, 'vi_pham', nhap.id);
    assert(ten(b) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Head duyệt:xong → Đã thực hiện:dang → Báo PH:dang', `sau duyệt: ${ten(b)}`);
    assert(b.buoc[2].laToi && b.buoc[3].han, `Head = Bạn; hạn Đã thực hiện: ${JSON.stringify(b.buoc[3])}`);
    assert(b.buoc[3].cungLuc && b.buoc[4].cungLuc, 'sau duyệt: Đã thực hiện ‖ Báo PH cùng lúc');
    /* Head làm bước giữa → theo dõi; GVCN đang giữ "Đã thực hiện" → rời Đang theo dõi (ở Của tôi). */
    assert(theoDoi(ql).some((r) => r.khoa === String(nhap.id)) && !theoDoi(gvcn).some((r) => r.khoa === String(nhap.id)), 'Head theo dõi · GVCN giữ bước');
  }));

  await checkAsync('TUYEN0-3 · THU HỒI sau khi đã báo PH: … Báo PH xong → Đã thu hồi ✕ → Báo lại PH (đang, TVV)', () => thu(() => {
    const sid = moiEm();
    const { mid, bpId } = xuLy(sid);
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [bpId], ketQua: 'chua_lien_he', ghiChu: 'Gọi mẹ em không nghe máy' });
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [bpId], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em lần hai' });
    xu.thuHoiXuLy(ql, mid, { lyDo: 'Ghi nhầm em, thu hồi lần xử lý', baoLai: true });
    const x = tuyen(gvcn, 'vi_pham', mid);
    assert(ten(x) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Báo PH:xong → Báo PH:xong → Đã thu hồi:bo → Báo lại PH:dang', `thu hồi: ${ten(x)}`);
    assert(x.buoc[2].chiTiet === 'Chưa liên hệ được · lần 1' && x.buoc[3].chiTiet === 'Đã báo PH', 'vòng lặp "Chưa liên hệ được" thêm dòng, không ghi đè');
    assert(x.dangO?.ten === 'Báo lại PH' && x.dangO.nguoi === tvv.fullName, `đang ở: ${JSON.stringify(x.dangO)}`);
  }));

  await checkAsync('TUYEN0-4 · TRẢ LẠI: TVV trả lần xử lý → "Lần xử lý bị trả lại" (GVCN, đang) + Báo PH ⏸ Chờ GV sửa; gửi lại → Báo PH chạy tiếp', () => thu(() => {
    const sid = moiEm();
    const { mid, bpId } = xuLy(sid);
    const r = tl.traLai(tvv, { measureId: mid, lyDo: 'Ghi rõ em nói chuyện vào lúc nào trong giờ' });
    const a = tuyen(tvv, 'vi_pham', mid);
    assert(ten(a) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Lần xử lý bị trả lại:dang → Báo PH:tam_dung', `trả lại: ${ten(a)}`);
    assert(a.buoc[2].nguoi === gvcn.fullName && a.buoc[3].chiTiet === 'Chờ GV sửa' && a.buoc[3].han === null, `bước trả lại / tạm dừng: ${JSON.stringify(a.buoc.slice(2))}`);
    assert(tu.tuyenCuaViec(tvv, 'tra_lai', r.id)?.khoa === String(mid) && tu.tuyenCuaViec(tvv, 'bao_ph', bpId)?.khoa === String(mid), 'việc trả lại / Báo PH → cùng tuyến lần xử lý');
    tl.guiLaiTraLai(gvcn, r.id, {});
    const b = tuyen(gvcn, 'vi_pham', mid);
    assert(ten(b) === 'GV ghi 1 vi phạm:xong → Xử lý vi phạm:xong → Lần xử lý bị trả lại:xong → Báo PH:dang', `gửi lại: ${ten(b)}`);
    assert(theoDoi(gvcn).find((d) => d.khoa === String(mid))?.nhan === `Đang ở Báo PH · ${tvv.fullName}`, 'GVCN gửi lại → theo dõi tuyến');
  }));

  await checkAsync('TUYEN0-5 · Phối hợp KHÔNG bước TVV (Trao đổi ngắn): một bước GVCN; xác nhận → tuyến xong', () => thu(() => {
    const sid = moiEm();
    const { att, ids } = luot(sid, ['talk_student']);
    const a = tuyen(gvcn, 'phoi_hop', att);
    assert(a.buoc.length === 1 && a.buoc[0].trangThai === 'dang' && a.buoc[0].nguoi === gvcn.fullName && !a.buoc[0].cungLuc, `một bước: ${ten(a)}`);
    ph.confirmCoordination(gvcn, ids[0], { performedOn: TODAY, note: 'Đã nói chuyện với em sau giờ' });
    const b = tuyen(gvcn, 'phoi_hop', att);
    assert(b.ketThuc && b.buoc[0].trangThai === 'xong' && b.buoc[0].noiDung === 'Đã nói chuyện với em sau giờ', `xong: ${JSON.stringify(b.buoc[0])}`);
    assert(!theoDoi(gvcn).some((d) => d.loai === 'phoi_hop' && d.khoa === String(att)), 'GVCN làm bước cuối → không theo dõi');
  }));

  await checkAsync('TUYEN0-6 · Phối hợp CÓ bước TVV · Meeting hai phần, Kết quả meeting cuối · BPXL thấy khung, không nhận noiDung (C3)', () => thu(() => {
    /* VAI-0 (N74 / N77): Xếp lịch họp về MỘT người — CVXL đã nhận lớp; chi nhánh MB của bộ demo đã có BPXL khác nên cho BPXL thử nhận lớp. */
    conn.prepare('INSERT OR REPLACE INTO lop_xep_lich (class_id, user_id, gan_luc) VALUES (?, ?, ?)').run(lop, bpxl.userId, '2026-01-01');
    const sid = moiEm();
    const { att, ids } = luot(sid, ['cx_meeting_student']);
    const a = tuyen(tvv, 'phoi_hop', att);
    /* PTA rà #2231 P2-6: bước ○ Xếp lịch giữ theo VAI (mọi BPXL chi nhánh) không làm BPXL "có mặt" — 404 như không có tuyến (P2-10). */
    assert(ma(() => tuyen(bpxl, 'phoi_hop', att)) === 404, 'BPXL trước xác nhận (chỉ ○ theo vai) → 404');
    /* Chưa xác nhận: TVV thấy trước Báo PH / Xếp lịch / Kết quả (○ chờ GVCN xác nhận) — không có việc nào (C2). */
    assert(ten(a).endsWith('Xếp lịch họp:cho → Báo PH:cho → Kết quả meeting:cho') && a.buoc.slice(1).every((b: any) => b.cha === `x${ids[0]}` && b.chiTiet === 'chờ GVCN xác nhận'),
      `trước xác nhận: ${ten(a)}`);
    const viecTvv = soViec(tvv); const viecBpxl = soViec(bpxl);
    ph.confirmCoordination(gvcn, ids[0], { performedOn: TODAY, note: 'Cần họp CX với em, PH đồng ý dự' });
    assert(soViec(bpxl) === viecBpxl + 1, 'BPXL: đúng một việc thật (Xếp lịch họp) sau xác nhận');
    const b = tuyen(gvcn, 'phoi_hop', att);
    assert(ten(b) === 'Meeting CX/GĐCN (sau Mock) · HV:xong → Xếp lịch họp:dang → Báo PH:dang → Kết quả meeting:dang', `sau xác nhận: ${ten(b)}`);
    assert(b.buoc.at(-1).ten === 'Kết quả meeting' && b.soDang === 3 && b.dangO?.ten === '3 bước cùng lúc', `Kết quả cuối · đang ở: ${JSON.stringify(b.dangO)}`);
    assert(soViec(tvv) >= viecTvv, 'TVV: việc Báo PH thật');
    /* BPXL (giữ Xếp lịch họp): thấy khung; đọc được phần mình, KHÔNG đọc nội dung GVCN xác nhận / Báo PH. */
    const baoPhId = b.buoc[2].viec.id;
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [baoPhId], ketQua: 'da_bao', ghiChu: 'Đã báo mẹ em lịch họp' });
    const c = tuyen(bpxl, 'phoi_hop', att);
    assert(c.buoc[0].khongQuyen && !('noiDung' in c.buoc[0]), `BPXL: bước GVCN không noiDung: ${JSON.stringify(c.buoc[0])}`);
    assert(c.buoc[2].trangThai === 'xong' && c.buoc[2].khongQuyen && !('noiDung' in c.buoc[2]) && !c.buoc[2].coNoiDung, `BPXL: Báo PH không noiDung: ${JSON.stringify(c.buoc[2])}`);
    assert(c.buoc[1].laToi && c.dangO?.ten === 'Xếp lịch họp', `BPXL: Xếp lịch là của mình: ${JSON.stringify(c.dangO)}`);
    /* BPXL ngoài tuyến (lượt khác) → 403. */
    const khac = luot(moiEm(), ['talk_student']);
    assert(ma(() => tuyen(bpxl, 'phoi_hop', khac.att)) === 404, 'BPXL ngoài tuyến → 404 (cùng mã "không có")');
    /* Kết quả meeting xong → Xếp lịch tự xong (N67); BPXL không còn ở "đang" — tuyến xong. */
    const kq = b.buoc[3].viec.id;
    gv.xongPhanMeeting(ql, kq, { ketQua: 'Em hứa đi học đều' });
    const d = tuyen(gvcn, 'phoi_hop', att);
    assert(d.ketThuc && d.buoc[1].chiTiet === 'tự xong' && d.buoc[3].noiDung === 'Em hứa đi học đều', `sau Kết quả: ${ten(d)} · ${JSON.stringify(d.buoc[1])}`);
  }));

  await checkAsync('TUYEN0-7 · em SOS 3 (Trao đổi gia đình + Meeting GĐCN): ĐÚNG MỘT bước Báo PH (TVV, BAOPH-0 C8) · Meeting không Báo PH riêng · Kết quả meeting dưới cùng', () => thu(() => {
    const sid = moiEm();
    const { att, ids } = luot(sid, ['cx_meeting_family', 'talk_student', 'talk_family']);
    bp.dongBoViecTvvLuot([att]);   // như syncSosCoordination: nguồn Trao đổi gia đình → việc TVV
    const a = tuyen(tvv, 'phoi_hop', att);
    const baoPh = a.buoc.filter((b: any) => b.ten.startsWith('Báo PH'));
    assert(baoPh.length === 1 && baoPh[0].ten === 'Báo PH · Trao đổi với gia đình' && baoPh[0].trangThai === 'dang' && baoPh[0].nguoi === tvv.fullName && !baoPh[0].cha,
      `một lần Báo PH (TVV): ${ten(a)}`);
    assert(!a.buoc.some((b: any) => b.ten.startsWith('Trao đổi với gia đình')), `GVCN không giữ Trao đổi gia đình: ${ten(a)}`);
    assert(a.buoc.at(-1).ten === 'Kết quả meeting' && a.buoc.filter((b: any) => !b.cha).every((b: any) => b.cungLuc), `Kết quả cuối, các việc cùng lúc: ${ten(a)}`);
    /* GVCN xác nhận Meeting → hai phần Xếp lịch → Kết quả; vẫn không có Báo PH Meeting. */
    ph.confirmCoordination(gvcn, ids[0], { performedOn: TODAY, note: 'Cần họp GĐCN với em và phụ huynh' });
    const b = tuyen(gvcn, 'phoi_hop', att);
    assert(b.buoc.filter((x: any) => x.ten.startsWith('Báo PH')).length === 1 && b.buoc.at(-1).ten === 'Kết quả meeting' && b.buoc.some((x: any) => x.ten === 'Xếp lịch họp' && x.trangThai === 'dang'),
      `sau xác nhận: ${ten(b)}`);
    /* TVV báo xong → bước Báo PH xong (người, nội dung). */
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [baoPh[0].viec.id], ketQua: 'da_bao', ghiChu: 'Đã báo mẹ em kết quả và lịch họp GĐCN' });
    const c = tuyen(gvcn, 'phoi_hop', att);
    const x = c.buoc.find((y: any) => y.ten === 'Báo PH · Trao đổi với gia đình');
    assert(x.trangThai === 'xong' && x.noiDung === 'Đã báo mẹ em kết quả và lịch họp GĐCN', `TVV xong: ${JSON.stringify(x)}`);
  }));

  await checkAsync('TUYEN2-1 · Meeting: BPXL mở panel chỉ nhận phần Xếp lịch (không lộ phần Kết quả, không 403); bước GVCN xác nhận kèm Phụ huynh — chỉ người xem được em; việc TVV từ nguồn `nguonTvv`', () => thu(() => {
    const sid = moiEm();
    conn.prepare(`UPDATE students SET parent_name = 'Nguyễn Thu Hà', parent_relation = 'mẹ', parent_phone = '0912345678' WHERE id = ?`).run(sid);
    const { att, ids } = luot(sid, ['cx_meeting_family', 'talk_family']);
    bp.dongBoViecTvvLuot([att]);
    ph.confirmCoordination(gvcn, ids[0], { performedOn: TODAY, note: 'Cần họp GĐCN với em và phụ huynh' });
    xoaNho();
    /* (a) xemMeeting — BPXL giữ Xếp lịch họp: một phần, không phần Kết quả meeting (trước: 403 cả panel). GVCN: đủ hai phần. */
    const mB = gv.xemMeeting(bpxl, ids[0]);
    assert(mB.phan.length === 1 && mB.phan[0].meeting.phan === 'xep_lich', `BPXL: ${mB.phan.map((g: any) => g.meeting.phan).join(',')}`);
    xoaNho();
    assert(gv.xemMeeting(gvcn, ids[0]).phan.length === 2, 'GVCN đọc đủ hai phần');
    /* (b) bước GVCN xác nhận: "Nội dung gửi" + Phụ huynh — GVCN (xem được em) đọc; BPXL thấy khung, không nội dung. */
    const a = tuyen(gvcn, 'phoi_hop', att);
    const xn = a.buoc.find((x: any) => x.ten.startsWith('Meeting CX/GĐCN'));
    assert(xn?.noiDung?.includes('Nội dung gửi: Cần họp GĐCN') && xn.noiDung.includes('Phụ huynh: Mẹ · Nguyễn Thu Hà · 0912345678'), `GVCN: ${JSON.stringify(xn)}`);
    /* Chủ SP 27/11 (P1 "Có, khi đang giữ việc"): BPXL ĐANG GIỮ phần Xếp lịch họp còn mở thấy PH + ghi chú (tuyến + boiCanh panel); BPXL khác / đã giao đi → không. */
    const xl = mot(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'xep_lich'`, ids[0]).id as number;
    const bpxl2 = taiKhoan('bpxl2', 'scheduler');
    xoaNho(); gv.doiPhuTrach(ql, 'meeting', xl, { userId: bpxl.userId, phuTrachCu: null });
    const buocXn = (p: any) => tuyen(p, 'phoi_hop', att).buoc.find((x: any) => x.ten.startsWith('Meeting CX/GĐCN'));
    const c = buocXn(bpxl);
    assert(c?.noiDung?.includes('Phụ huynh: Mẹ · Nguyễn Thu Hà') && c.noiDung.includes('Nội dung gửi'), `BPXL giữ việc: tuyến có PH: ${JSON.stringify(c)}`);
    xoaNho(); const bc = gv.xemMeeting(bpxl, ids[0]).boiCanh;
    assert(bc.phuHuynh?.sdt === '0912345678' && bc.ghiChu, `BPXL giữ việc: boiCanh PH: ${JSON.stringify(bc)}`);
    const c2 = buocXn(bpxl2);
    assert(!c2?.noiDung?.includes('Phụ huynh'), `BPXL khác: không PH trong tuyến: ${JSON.stringify(c2)}`);
    xoaNho(); assert(ma(() => { const b2 = gv.xemMeeting(bpxl2, ids[0]).boiCanh; if (b2.phuHuynh || b2.ghiChu) throw Object.assign(new Error('lộ'), { status: 999 }); }) !== 999, 'BPXL khác: boiCanh không PH');
    xoaNho(); gv.doiPhuTrach(ql, 'meeting', xl, { userId: bpxl2.userId, phuTrachCu: bpxl.userId });
    const c3 = buocXn(bpxl);
    assert(!c3?.noiDung?.includes('Phụ huynh'), `BPXL đã giao đi: không PH trong tuyến: ${JSON.stringify(c3)}`);
    xoaNho(); assert(ma(() => { const b3 = gv.xemMeeting(bpxl, ids[0]).boiCanh; if (b3.phuHuynh || b3.ghiChu) throw Object.assign(new Error('lộ'), { status: 999 }); }) !== 999, 'BPXL đã giao đi: boiCanh không PH');
    assert(buocXn(bpxl2)?.noiDung?.includes('Phụ huynh'), 'BPXL mới giữ việc: thấy PH');
    /* (c) việc TVV Trao đổi gia đình: panel biết là việc từ nguồn (không vẽ hai phần Meeting) — Progress / Final cùng cờ (`laViecTvvBaoPh`). */
    const v = mot('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', ids[1]);
    xoaNho();
    const vb = bp.xemViecBaoPh(tvv, v.id);
    assert(vb.nguonTvv === true && vb.phoiHopId === ids[1], `nguonTvv: ${vb.nguonTvv}`);
    const nguon = mot(`SELECT v.id FROM viec_bao_ph v JOIN sos_coordination_actions x ON x.id = v.phoi_hop_id WHERE x.kind = 'bao_ph_tvv' ORDER BY v.id LIMIT 1`);
    if (nguon) { xoaNho(); assert(bp.xemViecBaoPh(P.admin, nguon.id).nguonTvv === true, 'Kết quả Progress / Final: nguonTvv'); }
  }));

  await checkAsync('TUYEN0-15 · BAOPH-0 hai việc giao được (xu_ly · da_thuc_hien): người theo dõi N58 thấy MỘT dòng tuyến ở Đang theo dõi; người được giao thành người giữ', () => thu(() => {
    const admin = taiKhoan('admin', 'office_admin');
    /* Xử lý vi phạm (việc theo em): Head thêm người theo dõi → dòng tuyến "đang chờ xử lý" của em. */
    const sid = moiEm();
    for (const i of [1, 2, 3]) viPham(sid, i);
    gv.themTheoDoi(ql, 'xu_ly', sid, { userIds: [admin.userId] });
    const d = theoDoi(admin).find((r) => r.loai === 'vi_pham' && r.khoa === `em${sid}`);
    assert(d && d.viec.includes(`xu_ly:${sid}`) && d.nhan === `Đang ở Xử lý vi phạm · ${gvcn.fullName}`, `xu_ly: ${JSON.stringify(d)}`);
    assert(tu.tuyenCuaViec(admin, 'xu_ly', sid)?.khoa === `em${sid}`, 'khối giao việc xu_ly → tuyến chờ xử lý');
    /* Đã thực hiện: Head duyệt đề xuất → giao cho Admin → Admin là người giữ bước; Head (người giao) theo dõi. */
    const s2 = moiEm();
    const vid = viPham(s2);
    const nhap = xu.deXuat(gvcn, s2, { kind: 'wl_3', violationIds: [vid], note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    yc.duyetYeuCau(ql, mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id);
    gv.doiPhuTrach(ql, 'da_thuc_hien', nhap.id, { userId: admin.userId, phuTrachCu: null });
    const x = tuyen(ql, 'vi_pham', nhap.id);
    const th = x.buoc.find((b: any) => b.khoa === 'thuc_hien');
    assert(th.trangThai === 'dang' && th.nguoi === admin.fullName && th.viec?.loai === 'da_thuc_hien', `Đã thực hiện giao: ${JSON.stringify(th)}`);
    const g = theoDoi(gvcn).find((r) => r.khoa === String(nhap.id));
    /* Sau Head duyệt: Đã thực hiện (Admin) và Báo PH (TVV) cùng đang — GVCN (người giữ trước, giờ theo dõi) thấy MỘT dòng, gom cả hai việc N58. */
    assert(g && g.nhan === "Đang ở 2 bước cùng lúc" && g.viec.includes(`da_thuc_hien:${nhap.id}`), `GVCN theo dõi (giao đi): ${JSON.stringify(g)}`);
    assert(!theoDoi(admin).some((r) => r.khoa === String(nhap.id)), 'người được giao giữ bước → không ở Đang theo dõi');
  }));

  await checkAsync('TUYEN0-8 · Tình hình HAI CHIỀU: GV → TVV (Báo PH) · TVV → GVCN (trả lời); người gửi theo dõi tuyến', () => thu(() => {
    const sid = moiEm();
    const a = th.guiTinhHinh(gvbm, { chieu: 'gv_tvv', studentIds: [sid], noiDung: 'Em dạo này hay quên làm bài tập về nhà' }).ids[0];
    const x = tuyen(gvbm, 'tinh_hinh', a);
    assert(ten(x) === 'GV gửi tình hình:xong → Báo PH:dang' && x.buoc[1].nguoi === tvv.fullName, `GV → TVV: ${ten(x)}`);
    assert(theoDoi(gvbm).find((d) => d.loai === 'tinh_hinh' && d.khoa === String(a))?.nhan === `Đang ở Báo PH · ${tvv.fullName}`, 'GV gửi → theo dõi');
    const b = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    const y = tuyen(tvv, 'tinh_hinh', b);
    assert(ten(y) === 'TVV hỏi tình hình:xong → Tình hình học tập:dang' && y.buoc[1].nguoi === gvcn.fullName && y.buoc[1].han, `TVV → GVCN: ${ten(y)}`);
    xoaNho();
    const g = gv.xemGiaoViec(gvcn, 'tinh_hinh', b);
    assert(tu.tuyenCuaViec(gvcn, 'tinh_hinh', g.id)?.khoa === String(b), 'khối giao việc Tình hình → tuyến');
    th.traLoiTinhHinh(gvcn, b, { traLoi: 'Em học tốt, chăm làm bài tập' });
    const z = tuyen(tvv, 'tinh_hinh', b);
    assert(z.ketThuc && z.buoc[1].noiDung === 'Em học tốt, chăm làm bài tập', `trả lời: ${JSON.stringify(z.buoc[1])}`);
  }));

  await checkAsync('TUYEN0-9 · SỬA CẤP BẬC (N70): GVCN gửi → Head duyệt (đang); Head duyệt → xong', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, thang: TODAY.slice(0, 7), ghiChu: 'Report 2 tháng trước, cô Hà gửi' });
    xu.suaKhaiBac(gvcn, sid, { bac: 1, thang: TODAY.slice(0, 7), ghiChu: 'Thực ra mới Report 1', bacCu: 2 });
    const id = mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'sua_khai_bac' AND doi_tuong_id = ? AND trang_thai = 'cho'`, sid).id;
    const a = tuyen(gvcn, 'cap_bac', id);
    assert(ten(a) === 'Sửa cấp bậc:xong → Head duyệt:dang' && a.buoc[0].chiTiet === 'bậc 2 → 1', `sửa bậc: ${ten(a)} · ${a.buoc[0].chiTiet}`);
    assert(theoDoi(gvcn).some((d) => d.loai === 'cap_bac' && d.khoa === String(id)), 'GVCN gửi → theo dõi');
    yc.duyetYeuCau(ql, id);
    const b = tuyen(gvcn, 'cap_bac', id);
    assert(b.ketThuc && b.buoc[1].trangThai === 'xong' && b.buoc[1].nguoi === ql.fullName, `duyệt: ${ten(b)}`);
  }));

  await checkAsync('TUYEN0-10 · Bỏ theo dõi cả tuyến → rời Đang theo dõi; theo dõi lại (Hoàn tác) → về; em Lưu trữ → chỉ xem', () => thu(() => {
    const sid = moiEm();
    const { mid } = xuLy(sid);
    assert(theoDoi(gvcn).some((d) => d.khoa === String(mid)), 'trước: có');
    tu.boTheoDoiTuyen(gvcn, { loai: 'vi_pham', khoa: String(mid) });
    assert(!theoDoi(gvcn).some((d) => d.khoa === String(mid)), 'bỏ theo dõi → rời');
    tu.theoDoiLaiTuyen(gvcn, { loai: 'vi_pham', khoa: String(mid) });
    assert(theoDoi(gvcn).some((d) => d.khoa === String(mid)), 'theo dõi lại → về');
    assert(ma(() => tu.docKhoaTuyen('vi_pham', '1; DROP')) === 400 && ma(() => tu.docKhoaTuyen('xx', '1')) === 400 && ma(() => tuyen(gvcn, 'vi_pham', 99_999_999)) === 404, 'khoá sai 400 · không có 404');
    conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(TODAY, sid);
    assert(tuyen(gvcn, 'vi_pham', mid).chiXem === true, 'em Lưu trữ → tuyến chỉ xem');
  }));

  await checkAsync('TUYEN0-11 · trần câu: GET /tuyen (vi phạm · Phối hợp Meeting) · Đang theo dõi tuyến — không N+1', () => thu(() => {
    const sid = moiEm();
    const { mid } = xuLy(sid);
    const { att, ids } = luot(sid, ['cx_meeting_student', 'talk_student']);
    ph.confirmCoordination(gvcn, ids[0], { performedOn: TODAY, note: 'Cần họp CX với em, PH đồng ý dự' });
    const doTrong = (fn: () => unknown) => { let c = 0; let d = 0; chayTrongRequest('GET', () => { const c0 = soCauSql(); const d0 = soDongSql(); fn(); c = soCauSql() - c0; d = soDongSql() - d0; }); return { c, d }; };
    const vp = doTrong(() => tu.dungTuyen(gvcn, { loai: 'vi_pham', khoa: String(mid) }));
    const pho = doTrong(() => tu.dungTuyen(gvcn, { loai: 'phoi_hop', khoa: String(att) }));
    const td = doTrong(() => tu.theoDoiTuyen(gvcn));
    /* P2-9: số câu THÊM của trường `tuyen` trên đường panel thật (sau `xemViecBaoPh` cùng request — bộ nhớ phạm vi dùng lại). */
    const bpId = mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', mid).id;
    let panel = { c: 0, d: 0 };
    chayTrongRequest('GET', () => { const v = bp.xemViecBaoPh(tvv, bpId); const c0 = soCauSql(); const d0 = soDongSql(); tu.tuyenTheoKhoa(tvv, tu.khoaBaoPh(v)); panel = { c: soCauSql() - c0, d: soDongSql() - d0 }; });
    console.log(`    đo: /tuyen vi_pham ${vp.c} câu · ${vp.d} dòng | phoi_hop ${pho.c} · ${pho.d} | theo dõi ${td.c} · ${td.d} | panel Báo PH +${panel.c} · ${panel.d}`);
    assert(vp.c <= TRAN_TUYEN.mot.cau && pho.c <= TRAN_TUYEN.mot.cau && panel.c <= TRAN_TUYEN.panel.cau && panel.c <= 4, `câu: ${vp.c} / ${pho.c} / panel ${panel.c}`);
    assert(td.c <= TRAN_TUYEN.theoDoi.cau && td.d <= TRAN_TUYEN.theoDoi.dong, `theo dõi: ${td.c} câu / ${td.d} dòng`);
    /* Không N+1: Đang theo dõi với nhiều tuyến hơn giữ nguyên số câu. */
    for (let i = 0; i < 3; i++) xuLy(moiEm());
    const td2 = doTrong(() => tu.theoDoiTuyen(gvcn));
    assert(td2.c === td.c, `theo dõi nhiều tuyến hơn: ${td.c} → ${td2.c} câu`);
    /* P2-8: câu tìm tuyến theo dõi đi chỉ mục — không quét bảng nguồn nào (yeu_cau_duyet, discipline_measures, …). */
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${tu.SQL_TUYEN_THEO_DOI}`).all(gvcn.userId, '2026-01-01', '2026-01-01') as any[]).map((r) => String(r.detail));
    assert(!plan.some((d) => /^SCAN /.test(d)), `có SCAN: ${plan.filter((d) => /^SCAN /.test(d)).join(' | ')}`);
  }));

  await checkAsync('TUYEN0-12 · P1-1 quyền theo tuyến chỉ khi CÒN vai ở chi nhánh em: người theo dõi mất vai · chi nhánh khác · GV ngoài lớp → 404; GVCN rời lớp thấy khung, không nội dung người khác', () => thu(() => {
    const sid = moiEm();
    const { mid, bpId } = xuLy(sid);
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [bpId], ketQua: 'chua_lien_he', ghiChu: 'Gọi mẹ em không nghe máy' });
    const theoDoiViec = (u: any) => conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) VALUES ('bao_ph', ?, ?, 'tay', ?, ?)`).run(bpId, u.userId, ql.userId, new Date().toISOString());
    /* BPXL (không xem Ý thức em) theo dõi tay việc Báo PH: còn vai → thấy khung + nội dung Báo PH (quyền người theo dõi sẵn có); mất vai → 404, rời Đang theo dõi. */
    const bp2 = taiKhoan('bpxl2', 'scheduler'); theoDoiViec(bp2);
    const a = tuyen(bp2, 'vi_pham', mid);
    assert(a.buoc.find((b: any) => b.ten === 'Báo PH')?.noiDung === 'Gọi mẹ em không nghe máy' && a.buoc[0].khongQuyen, `còn vai: ${JSON.stringify(a.buoc.map((b: any) => [b.ten, b.coNoiDung]))}`);
    assert(theoDoi(bp2).some((d) => d.khoa === String(mid)), 'còn vai → Đang theo dõi');
    conn.prepare("UPDATE user_roles SET status = 'inactive' WHERE user_id = ?").run(bp2.userId);
    const mat = loadPrincipal(bp2.userId);
    assert(ma(() => tuyen(mat, 'vi_pham', mid)) === 404 && !theoDoi(mat).length && tu.tuyenCuaViec(mat, 'bao_ph', bpId) === null, 'mất vai → 404 · không dòng · panel null');
    /* Chi nhánh khác: theo dõi tay việc của em MB nhưng chỉ có vai ở CP. */
    const cp = taiKhoan('bpxlcp', 'scheduler', 'CP'); theoDoiViec(cp);
    assert(ma(() => tuyen(cp, 'vi_pham', mid)) === 404 && !theoDoi(cp).length, 'chi nhánh khác → 404');
    /* GV ngoài lớp (vai GV ở MB, không dạy lớp em, không có mặt) → 404. */
    const gvKhac = taiKhoan('gvkhac', 'teacher');
    assert(ma(() => tuyen(gvKhac, 'vi_pham', mid)) === 404 && ma(() => tuyen(gvKhac, 'vi_pham', `em${sid}`)) === 404, 'GV ngoài lớp → 404');
    /* GVCN rời lớp (hết phân công, còn vai ở chi nhánh): đã làm bước → còn thấy khung; nội dung bước của mình đọc được, Báo PH của TVV thì không. */
    const pcIds = (conn.prepare(`SELECT id FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = 'active'`).all(gvcn.userId, lop) as any[]).map((r) => r.id);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id IN (SELECT value FROM json_each(?))`).run(JSON.stringify(pcIds));
    /* Đổi GVCN thật: dòng theo dõi nguồn `gvcn` chuyển sang GVCN mới (`theoGvcnHienTai`) — ở đây lớp chưa có GVCN mới nên bỏ dòng cũ như chuyển. */
    conn.prepare(`DELETE FROM viec_theo_doi WHERE user_id = ? AND nguon = 'gvcn' AND loai = 'bao_ph' AND ref_id = ?`).run(gvcn.userId, bpId);
    try {
      const roi = loadPrincipal(gvcn.userId);
      const b = tuyen(roi, 'vi_pham', mid);
      const xl = b.buoc.find((x: any) => x.khoa === 'xu_ly'); const ph = b.buoc.find((x: any) => x.ten === 'Báo PH');
      assert(xl.coNoiDung && ph.khongQuyen && !('noiDung' in ph), `GVCN rời lớp: ${JSON.stringify([xl, ph])}`);
    } finally { conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (SELECT value FROM json_each(?))`).run(JSON.stringify(pcIds)); }
  }));

  await checkAsync('TUYEN0-13 · P1-2 / P1-3: Bỏ theo dõi → người KHÁC làm bước sau → vẫn ẩn; việc N58 của tuyến đã bỏ không hiện lẻ ở nhom', () => thu(() => {
    const sid = moiEm();
    const { mid, bpId } = xuLy(sid);
    tu.boTheoDoiTuyen(gvcn, { loai: 'vi_pham', khoa: String(mid) });
    bp.ghiKetQuaBaoPh(ql, { viecIds: [bpId], ketQua: 'chua_lien_he', ghiChu: 'Head gọi thử, chưa được' });
    conn.prepare('UPDATE discipline_measures SET updated_at = ? WHERE id = ?').run(new Date(Date.now() + 60_000).toISOString(), mid);   // người khác sửa lần xử lý
    assert(!theoDoi(gvcn).some((d) => d.khoa === String(mid)), 'người khác làm bước sau → vẫn ẩn');
    /* GVBM (theo dõi mặc định N58 của Báo PH) bỏ theo dõi tuyến → dòng Báo PH không hiện lẻ ở nhom. */
    tu.boTheoDoiTuyen(gvbm, { loai: 'vi_pham', khoa: String(mid) });
    xoaNho();
    const r = tu.voiTuyen(gvbm, gv.viecTheoDoi(gvbm));
    assert(!r.tuyen.some((d: any) => d.khoa === String(mid)) && !r.nhom.some((g: any) => [...g.mo, ...g.vuaXong].some((d: any) => d.loai === 'bao_ph' && d.refId === bpId)),
      `nhom còn việc của tuyến đã bỏ: ${JSON.stringify(r.nhom.map((g: any) => g.mo.map((d: any) => d.refId)))}`);
    tu.theoDoiLaiTuyen(gvbm, { loai: 'vi_pham', khoa: String(mid) });
    xoaNho();
    assert(tu.voiTuyen(gvbm, gv.viecTheoDoi(gvbm)).nhom.some((g: any) => g.mo.some((d: any) => d.refId === bpId)), 'theo dõi lại → nhom về');
  }));

  await checkAsync('TUYEN0-14 · P2-5 em vào Lưu trữ: thẻ Head tự đóng "Đóng — em vào Lưu trữ" · Tình hình "Hệ thống rút (Lưu trữ)" · không bước đang', () => thu(async () => {
    const { dongViecLuuTru } = await import('../students/dongLuuTru.ts') as any;
    const sid = moiEm();
    const vid = viPham(sid);
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: [vid], note: 'Em vi phạm nhiều lần, cần Head quyết' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    const thId = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Em dạo này học thế nào ạ?' }).ids[0];
    dongViecLuuTru(null, sid, TODAY, 'luu_tru');
    conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(TODAY, sid);
    const a = tuyen(gvcn, 'vi_pham', nhap.id);
    assert(a.chiXem && a.ketThuc && a.buoc.some((b: any) => b.chiTiet === 'Đóng — em vào Lưu trữ') && !a.buoc.some((b: any) => b.trangThai === 'dang' || b.trangThai === 'cho'), `lần xử lý: ${ten(a)}`);
    const b = tuyen(tvv, 'tinh_hinh', thId);
    assert(b.buoc[0].chiTiet === 'Hệ thống rút (Lưu trữ)' && b.ketThuc, `tình hình: ${JSON.stringify(b.buoc[0])}`);
  }));
}
