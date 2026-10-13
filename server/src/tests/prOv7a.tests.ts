/**
 * PHÉP KIỂM PR-OV7a — Sửa sau khi lưu (1/2): Bàn giao · Ý thức · Phối hợp / Báo PH · Mini Test · rút / sửa đề xuất đang chờ · sửa trả lời Xin ý kiến.
 * Mỗi nhóm: lưu → sửa → lưu lại đúng giá trị mới, nhật ký trước → sau, quyền (người lưu + QL được, người khác 403), giới hạn, hệ quả đếm lại, không chuông trùng.
 * Mọi nhóm chạy trong giao dịch cuộn lại (`thu`) — không để lại dữ liệu cho phép kiểm khác.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv7aTests(t: YThucTestKit) {
  const { checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nPR-OV7a · Sửa sau khi lưu (1/2)');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const nhatKy = (action: string, entityId: number) => all('SELECT before_json, after_json FROM audit_logs WHERE action = ? AND entity_id = ? ORDER BY id', action, entityId);
  const demChuong = (userId: number, kieu?: string) => get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ?${kieu ? ' AND kind = ?' : ''}`, ...(kieu ? [userId, kieu] : [userId])).n as number;

  const intake: any = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  let seq = 0;
  /** Em mới ở lớp `lop` (có lộ trình) — như `moiEm` của prLuiA1. */
  const moiEm = (lop = 'MB FT 101'): number => {
    seq += 1;
    const ten = `OV7a ${seq} ${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `ov7a-${ten}` } as any);
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    return st.id as number;
  };
  const gvcn = P.coreTeacher;
  const gvbm = P.subjectTeacher;

  // ==================================================================== 1 · BÀN GIAO
  const bg: any = await import('../classes/banGiao.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const week: any = await import('../platform/week.ts');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const TUAN = d.tuanChonDuoc(TODAY) as string[];
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB).map((r) => loadPrincipal(r.user_id));
  const dungBanGiao = () => {
    const lop = (kind: string, tuanHienTai: number) => {
      seq += 1;
      const bat = d.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
      return intake.createClass(P.admin, { code: `MB-OV7A${seq}`, branchId: MB, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
    };
    const nguon = lop('FOU', 8); const dich = lop('BE', 1);
    const gan = (l: number, u: number, skill: string | null, core: boolean) => conn.prepare(
      `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
    ).run(u, l, skill, core ? 1 : 0, new Date().toISOString());
    gan(nguon, GV[0].userId, null, true); gan(nguon, GV[1].userId, 'listening', false); gan(nguon, GV[2].userId, 'reading', false); gan(dich, GV[3].userId, null, true);
    const now = new Date().toISOString();
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV7A${seq}`, `Hoc vien OV7A${seq}`, `hoc vien ov7a${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, nguon, TODAY, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, TODAY, now);
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: dich, tuan: TUAN[0] }] });
    assert(r.ok.length === 1, JSON.stringify(r.failed));
    const l = get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
    return { nguon, dich, sid, l, gvcnBg: loadPrincipal(GV[0].userId), gvbmL: loadPrincipal(GV[1].userId), gvbmR: loadPrincipal(GV[2].userId), gvDich: loadPrincipal(GV[3].userId) };
  };

  await checkAsync('OV7a-1a · Bàn giao: sau "Xác nhận bàn giao" GVBM vẫn sửa câu môn mình, GVCN sửa nhận xét chung → chụp lại tự điền, Hành trình đổi khoá, không chuông trùng, việc không mở lại', () => thu(() => {
    const x = dungBanGiao();
    bg.ghiMon(x.gvbmL, x.l.id, 'listening', 'Nghe ý chính tốt.');
    bg.xacNhanBanGiao(x.gvcnBg, x.l.id, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    const truoc = get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', x.l.id);
    assert(JSON.parse(truoc.tu_dien).gvbmChuaBanGiao.includes(d.tenMonNgan('FOU', 'reading')), 'lúc xác nhận: Reading chưa bàn giao');
    /* GVBM môn khác ghi SAU xác nhận (chưa tới ngày thi hành) — được, danh sách "GVBM chưa bàn giao" đếm lại. */
    bg.ghiMon(x.gvbmR, x.l.id, 'reading', 'Đọc chậm với bài dài.');
    bg.ghiMon(x.gvbmL, x.l.id, 'listening', 'Nghe ý chính tốt, cần luyện điền bản đồ.');
    assert(get(`SELECT noi_dung FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'listening'`, x.l.id).noi_dung.endsWith('điền bản đồ.'), 'GVBM sửa câu môn mình');
    assert(!JSON.parse(get('SELECT tu_dien FROM lenh_chuyen_lop WHERE id = ?', x.l.id).tu_dien).gvbmChuaBanGiao.includes(d.tenMonNgan('FOU', 'reading')), 'Reading đã ghi → rời "chưa bàn giao"');
    assert(maLoi(() => bg.ghiMon(x.gvbmL, x.l.id, 'reading', 'Ghi môn người khác')) === 403, 'GVBM môn khác → 403');
    /* GVCN sửa nhận xét chung */
    bg.suaBanGiao(x.gvcnBg, x.l.id, 'Em chăm, đã mạnh dạn hơn khi nói. Mẹ theo sát qua Zalo.');
    const sau = get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', x.l.id);
    assert(sau.nhan_xet_chung.startsWith('Em chăm, đã mạnh dạn') && sau.xac_nhan_boi === x.gvcnBg.userId && sau.xac_nhan_luc === truoc.xac_nhan_luc, 'giữ người / lúc xác nhận đầu');
    assert(JSON.parse(sau.tu_dien).tuDien.ketQua, 'tự điền chụp lại');
    const nk = nhatKy('ban_giao.sua', x.sid);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).nhanXetChung.startsWith('Em chăm, ngại') && JSON.parse(nk[0].after_json).nhanXetChung.startsWith('Em chăm, đã'), 'nhật ký trước → sau');
    const ht = all(`SELECT dedup_key, detail FROM journey_events WHERE ref_table = 'lenh_chuyen_lop' AND ref_id = ? ORDER BY id`, x.l.id);
    assert(ht.length === 2 && ht[0].dedup_key.startsWith(`ban_giao:${x.l.id}:sua:`) && ht[1].dedup_key === `ban_giao:${x.l.id}` && ht[1].detail.startsWith('Em chăm, đã'), JSON.stringify(ht));
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, x.gvDich.userId, `ban_giao:${x.l.id}`).n === 1, 'GV lớp chuyển đến: không chuông trùng');
    assert(maLoi(() => bg.suaBanGiao(x.gvbmL, x.l.id, 'GVBM sửa nhận xét chung của GVCN')) === 403 && maLoi(() => bg.suaBanGiao(x.gvDich, x.l.id, 'GV lớp chuyển đến sửa nhận xét')) === 403, 'GVBM / GV lớp đích → 403');
    assert(maLoi(() => bg.suaBanGiao(x.gvcnBg, x.l.id, 'ngắn')) === 400, 'nhận xét < 15 ký tự → 400');
    assert(!bg.viecBanGiao(x.gvcnBg.userId).some((v: any) => v.lopId === x.nguon), 'việc Bàn giao không mở lại');
    const em = bg.phieuBanGiao(x.gvcnBg, { lopNguonId: x.nguon }).ds[0];
    assert(em.suaDuoc === true && em.xacNhan, 'phiếu: GVCN sửa được trước ngày thi hành');
  }));

  await checkAsync('OV7a-1b · Bàn giao: sau ngày thi hành lệnh GVCN / GVBM → 400 câu rõ, Quản lý sửa được; phiếu nói đúng ai sửa được', () => thu(() => {
    const x = dungBanGiao();
    bg.xacNhanBanGiao(x.gvcnBg, x.l.id, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    conn.prepare('UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE id = ?').run(addDays(TODAY, -7), x.l.id);   // đã qua ngày thi hành
    assertThrows(() => bg.suaBanGiao(x.gvcnBg, x.l.id, 'Sửa sau khi lệnh đã thi hành.'), /ngày chuyển lớp.*Quản lý/, 'GVCN sau ngày thi hành');
    assertThrows(() => bg.ghiMon(x.gvbmL, x.l.id, 'listening', 'Ghi sau ngày thi hành'), /ngày chuyển lớp.*Quản lý/, 'GVBM sau ngày thi hành');
    assert(bg.phieuBanGiao(x.gvcnBg, { lopNguonId: x.nguon }).ds[0].suaDuoc === false, 'phiếu GVCN: hết sửa');
    const ql = bg.phieuBanGiao(P.mbManager, { lopNguonId: x.nguon });
    assert(ql.ds[0].suaDuoc === true && ql.nguoiXem.ql === true, 'phiếu QL: sửa được');
    bg.suaBanGiao(P.mbManager, x.l.id, 'Quản lý sửa nhận xét sau ngày thi hành.');
    bg.ghiMon(P.mbManager, x.l.id, 'listening', 'Quản lý ghi thay môn L.');
    assert(get('SELECT nhan_xet_chung FROM lenh_chuyen_lop WHERE id = ?', x.l.id).nhan_xet_chung.startsWith('Quản lý sửa'), 'QL sửa được');
    assert(get(`SELECT dien_thay FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'listening'`, x.l.id).dien_thay === 1, 'QL ghi môn = điền thay');
  }));

  // ==================================================================== 2 · Ý THỨC
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const attachments: any = await import('../platform/attachments.ts');
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm OV7a ${i + 1}`, occurredOn: addDays(TODAY, -(i + 1)) }).violation.id as number);
  const trangThaiVp = (sid: number, vid: number) => xu.yThucHocVien(P.mbManager, sid).viPham.find((v: any) => v.id === vid)?.trangThai;
  /** Đề xuất WL 3 đã gửi QL (thẻ `y_thuc` đang chờ). */
  const guiWl3 = (sid: number, ids: number[]) => {
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: ids, note: 'Em vi phạm nhiều lần, cần QL quyết' });
    attachments.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    return { measureId: nhap.id as number, the: get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id) };
  };

  await checkAsync('OV7a-2a · Ý thức: lần xử lý ĐÃ THỰC HIỆN — GVCN sửa ghi chú / ngày / người + vi phạm (bỏ khoá status ≠ done), nhật ký trước → sau; GVBM / QL ngoài phạm vi 403; ngày tương lai 400', () => thu(() => {
    const sid = moiEm(); const [v1, v2] = nVp(sid, 2);
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [v1], performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
    assert(xu.xemXuLy(gvcn, m.id).coTheSua === true, 'GVCN: cờ coTheSua cho lần đã thực hiện');
    const kq = xu.suaXuLy(gvcn, m.id, { note: 'Đã gọi điện cho mẹ, gửi report qua Zalo', performedOn: addDays(TODAY, -1), performerName: 'Cô Hà' });
    assert(kq.note === 'Đã gọi điện cho mẹ, gửi report qua Zalo' && kq.performedOn === addDays(TODAY, -1) && kq.nguoi === 'Cô Hà', JSON.stringify(kq));
    const nk = nhatKy('discipline.edit_info', m.id);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).performerName === 'Cô Thu' && JSON.parse(nk[0].after_json).performerName === 'Cô Hà', JSON.stringify(nk));
    assert(xu.suaViPhamXuLy(gvcn, m.id, { violationIds: [v1, v2] }).viPham.length === 2, 'GVCN sửa vi phạm lần đã thực hiện');
    assert(xu.yThucHocVien(P.mbManager, sid).bac === 1, 'bậc tính lại như Sửa vi phạm');
    assertThrows(() => xu.suaXuLy(gvbm, m.id, { note: 'GVBM sửa ghi chú lần xử lý' }), /chủ nhiệm/, 'GVBM 403');
    assert(maLoi(() => xu.suaXuLy(P.cpManager, m.id, { note: 'QL chi nhánh khác sửa lần xử lý' })) === 403, 'QL chi nhánh khác 403');
    assert(maLoi(() => xu.suaXuLy(gvcn, m.id, { performedOn: addDays(TODAY, 2) })) === 400 && maLoi(() => xu.suaXuLy(gvcn, m.id, { note: 'ngắn' })) === 400, 'ngày tương lai / ghi chú ngắn 400');
    xu.suaXuLy(P.mbManager, m.id, { note: 'Quản lý sửa ghi chú lần xử lý' });
  }));

  await checkAsync('OV7a-2b · Ý thức: "Đã thực hiện" bấm nhầm → "Chưa thực hiện" về QL đã duyệt (ghi chú giữ); lần xác nhận thẳng (không qua QL) → 400', () => thu(() => {
    const sid = moiEm(); const [v1, v2] = nVp(sid, 2);
    const g = guiWl3(sid, [v1]);
    yc.duyetYeuCau(P.mbManager, g.the.id);
    xu.daThucHien(gvcn, g.measureId, { performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã họp PH' });
    assert(get('SELECT status FROM discipline_measures WHERE id = ?', g.measureId).status === 'done', 'đã thực hiện');
    const v = xu.chuaThucHien(gvcn, g.measureId);
    const m = get('SELECT * FROM discipline_measures WHERE id = ?', g.measureId);
    assert(v.status === 'da_duyet' && m.performed_on === null && m.performer_name === null && m.confirmed_by === null && m.quyet_luc && m.note.includes('Đã họp PH'), JSON.stringify(m));
    assert(nhatKy('discipline.not_performed', g.measureId).length === 1, 'nhật ký');
    assert(xu.yThucHocVien(P.mbManager, sid).deXuat?.status === 'da_duyet', 'thẻ Ý thức: đã duyệt, chờ thực hiện');
    assertThrows(() => xu.chuaThucHien(gvcn, g.measureId), /chưa ghi "Đã thực hiện"|không ở trạng thái/, 'bấm lần hai');
    assert(maLoi(() => xu.chuaThucHien(gvbm, g.measureId)) === 403, 'GVBM 403');
    const thang = xu.xacNhanXuLy(gvcn, sid, { violationIds: [v2], performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
    assertThrows(() => xu.chuaThucHien(gvcn, thang.id), /QL duyệt|Xoá/, 'lần xác nhận thẳng');
  }));

  await checkAsync('OV7a-2c · Ý thức: Khai bậc — GVCN sửa bậc đã khai (chưa có lần xử lý); có lần xử lý: GVCN 400, QL sửa được và thang tính lại', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2 tháng 8, cô Hà gửi' });
    assert(xu.yThucHocVien(gvcn, sid).canSuaKhai === true, 'GVCN thấy Sửa');
    xu.suaKhaiBac(gvcn, sid, { bac: 3, ghiChu: 'Report 3 tháng 8, cô Hà gửi' });
    assert(xu.yThucHocVien(P.mbManager, sid).bac === 3, 'GVCN sửa bậc khai');
    assert(nhatKy('discipline.declare_level_edit', sid).length === 1, 'nhật ký sửa khai');
    xu.xacNhanXuLy(gvcn, sid, { violationIds: [v1], performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
    assert(xu.yThucHocVien(P.mbManager, sid).bac === 4, 'xử lý tiếp: bậc 4');
    assert(maLoi(() => xu.suaKhaiBac(gvcn, sid, { bac: 5, ghiChu: 'GVCN sửa sau khi có lần xử lý' })) === 400, 'GVCN sau lần xử lý → 400');
    assert(xu.yThucHocVien(gvcn, sid).canSuaKhai === false && xu.yThucHocVien(P.mbManager, sid).canSuaKhai === true, 'cờ Sửa theo vai');
    xu.suaKhaiBac(P.mbManager, sid, { bac: 5, ghiChu: 'QL sửa: em đã qua Report 5 trước khi dùng web' });
    const hv = xu.yThucHocVien(P.mbManager, sid);
    assert(hv.bac === 5 && hv.keTiep.bac === 6, `thang tính lại từ bậc mới: ${hv.bac} → ${hv.keTiep.bac}`);
    assert(maLoi(() => xu.suaKhaiBac(gvbm, sid, { bac: 1, ghiChu: 'GVBM sửa khai bậc' })) === 403, 'GVBM 403');
  }));

  await checkAsync('OV7a-2d · Ý thức: Bỏ ghi nhận → vi phạm về Mới (xoá ghi_nhan_luc), nhật ký; GVBM 403', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    xu.ghiNhan(gvcn, sid, [v1]);
    assert(trangThaiVp(sid, v1) === 'da_ghi_nhan', 'đã ghi nhận');
    assert(maLoi(() => xu.boGhiNhan(gvbm, sid, [v1])) === 403, 'GVBM 403');
    assert(xu.boGhiNhan(gvcn, sid, [v1]).soBo === 1, 'bỏ một');
    assert(get('SELECT ghi_nhan_luc FROM violations WHERE id = ?', v1).ghi_nhan_luc === null && trangThaiVp(sid, v1) === 'moi', 'về Mới');
    assert(nhatKy('discipline.unacknowledge', sid).length === 1, 'nhật ký');
    assert(maLoi(() => xu.boGhiNhan(gvcn, sid, [v1])) === 400, 'chưa ghi nhận → 400');
  }));

  await checkAsync('OV7a-2e · Ý thức: đề xuất "Gửi QL" còn chờ — GVCN sửa ghi chú (thẻ + lần xử lý cùng đổi, đếm bằng chứng lại), Rút (thẻ đóng, không chuông, vi phạm về chưa xử lý); QL đã duyệt → 400', () => thu(() => {
    const sid = moiEm(); const [v1, v2] = nVp(sid, 2);
    const g = guiWl3(sid, [v1]);
    const chuongQl = demChuong(P.mbManager.userId);
    attachments.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: g.measureId, url: 'https://example.com/them', displayName: 'Ảnh thêm' });
    yc.suaYeuCau(gvcn, g.the.id, { note: 'Em vi phạm nhiều lần, đã nhắc ba buổi — cần QL quyết' });
    const the = get('SELECT * FROM yeu_cau_duyet WHERE id = ?', g.the.id);
    assert(the.trang_thai === 'cho' && the.ly_do.includes('ba buổi') && get('SELECT note FROM discipline_measures WHERE id = ?', g.measureId).note.includes('ba buổi'), 'thẻ + lần xử lý cùng đổi');
    assert(JSON.parse(the.du_lieu).soTep === 2 && JSON.parse(the.bang_chung).length === 2, `bằng chứng đếm lại: ${the.du_lieu}`);
    assert(nhatKy('request.edit', g.the.id).length === 1, 'nhật ký sửa thẻ');
    assert(demChuong(P.mbManager.userId) === chuongQl, 'sửa không chuông QL');
    assert(maLoi(() => yc.suaYeuCau(P.mbManager, g.the.id, { note: 'QL sửa thẻ người khác gửi' })) === 403 && maLoi(() => yc.rutYeuCau(gvbm, g.the.id)) === 403, 'không phải người gửi → 403');
    const chuongGv = demChuong(gvcn.userId);
    yc.rutYeuCau(gvcn, g.the.id);
    const sau = get('SELECT * FROM yeu_cau_duyet WHERE id = ?', g.the.id);
    assert(sau.trang_thai === 'tu_dong' && sau.ly_do_dong === 'Người gửi đã rút', JSON.stringify(sau));
    assert(demChuong(gvcn.userId) === chuongGv && demChuong(P.mbManager.userId) === chuongQl, 'rút không chuông');
    assert(!get('SELECT 1 FROM discipline_measures WHERE id = ?', g.measureId) && trangThaiVp(sid, v1) !== 'cho_duyet', 'đề xuất rút: lần xử lý xoá, vi phạm về chưa xử lý');
    assert(nhatKy('request.withdraw', g.the.id).length === 1, 'nhật ký rút');
    const g2 = guiWl3(sid, [v2]);
    yc.duyetYeuCau(P.mbManager, g2.the.id);
    assert(maLoi(() => yc.rutYeuCau(gvcn, g2.the.id)) === 400 && maLoi(() => yc.suaYeuCau(gvcn, g2.the.id, { note: 'Sửa sau khi QL đã duyệt' })) === 400, 'QL đã trả lời → như nay (400)');
  }));

  // ==================================================================== 3 · PHỐI HỢP / BÁO PH
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  /** Một việc Phối hợp của lượt Mock FT có SOS (bộ demo) + GVCN lớp em đang học. */
  const viecPhoiHop = (kind: string) => {
    const r = get(`SELECT x.*, e.class_id FROM sos_coordination_actions x JOIN enrollments e ON e.student_id = x.student_id AND e.status = 'active'
        JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled'
        WHERE x.kind = ? AND x.status = 'pending' AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active')
        ORDER BY x.id LIMIT 1`, kind);
    assert(r, `bộ demo thiếu việc ${kind} đang chờ`);
    const g = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, r.class_id).user_id;
    return { r, gv: loadPrincipal(g) };
  };
  await checkAsync('OV7a-3a · Phối hợp: việc "Đã xong" sửa được ngày / ghi chú / người (nhật ký trước → sau); "Đưa lại Cần xử lý"; việc đã Bỏ → Khôi phục; việc hệ thống bỏ → 400; GVBM 403', () => thu(() => {
    const { r, gv } = viecPhoiHop('talk_student');
    phoiHop.confirmCoordination(gv, r.id, { performedOn: TODAY, note: 'Đã nói chuyện với em', performerName: '' });
    const sua = phoiHop.confirmCoordination(gv, r.id, { performedOn: addDays(TODAY, -1), note: 'Đã nói chuyện với em sau giờ học', performerName: 'Cô CS' });
    assert(sua.status === 'done' && sua.performedOn === addDays(TODAY, -1) && sua.note.endsWith('sau giờ học') && sua.performerName === 'Cô CS', JSON.stringify(sua));
    const nk = nhatKy('sos_coordination.confirm', r.id);
    assert(nk.length === 2 && JSON.parse(nk[1].before_json).note === 'Đã nói chuyện với em' && JSON.parse(nk[1].before_json).status === 'done', JSON.stringify(nk[1]));
    assert(maLoi(() => phoiHop.moLaiCoordination(gvbm, r.id)) === 403, 'GVBM 403');
    const lai = phoiHop.moLaiCoordination(gv, r.id);
    assert(lai.status === 'pending' && lai.performedOn === null && lai.note === 'Đã nói chuyện với em sau giờ học', 'Đưa lại Cần xử lý (ghi chú giữ)');
    assert(nhatKy('sos_coordination.reopen', r.id).length === 1, 'nhật ký');
    phoiHop.removeCoordination(gv, r.id, { reasonCode: 'not_needed' });
    const kp = phoiHop.moLaiCoordination(gv, r.id);
    assert(kp.status === 'pending' && kp.removeReasonCode === null, 'Khôi phục việc đã bỏ');
    assertThrows(() => phoiHop.moLaiCoordination(gv, r.id), /Cần xử lý/, 'đang Cần xử lý → 400');
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed' WHERE id = ?`).run(r.id);
    assertThrows(() => phoiHop.moLaiCoordination(gv, r.id), /hệ thống/, 'việc hệ thống bỏ');
  }));

  await checkAsync('OV7a-3b · Phối hợp: số liệu đếm lại từ trạng thái hiện tại (không cộng dồn) — xong hết → Hoàn thành; Đưa lại một việc → Đang xử lý', () => thu(() => {
    const { r, gv } = viecPhoiHop('talk_student');
    const viec = all(`SELECT id, status FROM sos_coordination_actions WHERE attempt_id = ?`, r.attempt_id);
    for (const v of viec) if (v.status === 'pending') phoiHop.confirmCoordination(gv, v.id, { performedOn: TODAY });
    const tap = (id: string) => phoiHop.phoiHopMetric(P.admin, id, {}).ids as number[];
    assert(tap('phoi-hop-hoan-thanh').includes(r.attempt_id) && !tap('phoi-hop-dang-xu-ly').includes(r.attempt_id), 'xong hết → Hoàn thành');
    phoiHop.moLaiCoordination(gv, r.id);
    assert(!tap('phoi-hop-hoan-thanh').includes(r.attempt_id) && tap('phoi-hop-dang-xu-ly').includes(r.attempt_id), 'Đưa lại → Đang xử lý');
    phoiHop.confirmCoordination(gv, r.id, { performedOn: TODAY });
    assert(tap('phoi-hop-hoan-thanh').filter((x) => x === r.attempt_id).length === 1, 'không cộng dồn');
  }));

  await checkAsync('OV7a-3c · Báo PH qua TVV: lưu lại thì chụp lại nội dung đã báo (`noi_dung_luc_bao`)', () => thu(() => {
    const { r, gv } = viecPhoiHop('bao_ph_tvv');
    phoiHop.confirmCoordination(gv, r.id, { performedOn: TODAY });
    conn.prepare(`UPDATE sos_coordination_actions SET noi_dung_luc_bao = '["cũ","cũ","cũ","cũ"]' WHERE id = ?`).run(r.id);
    phoiHop.confirmCoordination(gv, r.id, { performedOn: TODAY, note: 'Đã nhờ TVV gọi lại' });
    const chup = JSON.parse(get('SELECT noi_dung_luc_bao FROM sos_coordination_actions WHERE id = ?', r.id).noi_dung_luc_bao);
    assert(Array.isArray(chup) && chup.length === 4 && chup[0] !== 'cũ', `chụp lại: ${JSON.stringify(chup)}`);
  }));

  // ==================================================================== 4 · MINI TEST
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const miniTestMo = () => {
    const mt = get(`SELECT m.*, (SELECT e.class_id FROM enrollments e WHERE e.student_id = m.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop FROM mini_test m
        WHERE m.ty_le IS NULL AND EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = m.nhom_bo_tro AND iv.status IN ('planned', 'started') AND sc.status != 'done')
          AND ? >= date(m.ngay_du_kien, '-14 days') ORDER BY m.id LIMIT 1`, TODAY);
    assert(mt && mt.lop, 'bộ demo thiếu Mini Test chưa ghi');
    const g = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, mt.lop)?.user_id;
    assert(g, 'lớp em đang học chưa có GVCN');
    return { mt, gv: loadPrincipal(g) };
  };
  const caseNhom = (nhom: string) => all(`SELECT DISTINCT sc.id, sc.status, sc.outcome_note FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = ?`, nhom);
  const theMt = (id: number) => all(`SELECT * FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ? ORDER BY id`, id);
  await checkAsync('OV7a-4 · Mini Test: người ghi (GVCN) sửa % và ngày như QL; < 70 → ≥ 70: Case Hoàn thành, thẻ Báo QL tự đóng; ≥ 70 → < 70: Case mở lại + thẻ Báo QL; PA giữ khép; người khác 403', () => thu(() => {
    const { mt, gv } = miniTestMo();
    ck.ghiMiniTest(gv, mt.id, { tyLe: 60, ngay: TODAY });
    assert(caseNhom(mt.nhom_bo_tro).every((c) => c.status !== 'done') && theMt(mt.id).filter((x) => x.trang_thai === 'cho').length === 1, '60%: Case mở + thẻ Báo QL');
    const chuongQl = demChuong(P.mbManager.userId);
    ck.ghiMiniTest(gv, mt.id, { tyLe: 55, ngay: TODAY });
    const the1 = theMt(mt.id).filter((x) => x.trang_thai === 'cho');
    assert(the1.length === 1 && the1[0].ly_do.includes('55%') && demChuong(P.mbManager.userId) === chuongQl, '60 → 55: thẻ cũ đổi chữ, không chuông trùng');
    ck.ghiMiniTest(gv, mt.id, { tyLe: 80, ngay: addDays(TODAY, -1) });
    const r = get('SELECT * FROM mini_test WHERE id = ?', mt.id);
    assert(r.ty_le === 0.8 && r.ngay_lam === addDays(TODAY, -1), 'GVCN sửa được % + ngày');
    assert(caseNhom(mt.nhom_bo_tro).every((c) => c.status === 'done' && c.outcome_note.startsWith('Mini Test 80%')), '≥ 70: Case Hoàn thành');
    assert(theMt(mt.id).every((x) => x.trang_thai !== 'cho'), 'thẻ Báo QL tự đóng');
    ck.ghiMiniTest(gv, mt.id, { tyLe: 62, ngay: TODAY });
    assert(caseNhom(mt.nhom_bo_tro).every((c) => c.status !== 'done'), '≥ 70 → < 70: Case mở lại');
    assert(theMt(mt.id).filter((x) => x.trang_thai === 'cho').length === 1, 'thẻ Báo QL mới');
    assert(!get(`SELECT 1 FROM case_interventions WHERE nhom_bo_tro = ? AND status IN ('planned', 'started')`, mt.nhom_bo_tro), 'PA bổ trợ giữ khép (không mở lại)');
    const nk = all(`SELECT before_json, after_json FROM audit_logs WHERE action = 'cuoi_khoa.mini_test' AND entity_label = 'Sửa Mini Test' AND entity_id = ? ORDER BY id`, mt.student_id);
    assert(nk.length === 3 && JSON.parse(nk[2].before_json).tyLe === 0.8 && JSON.parse(nk[2].after_json).tyLe === 0.62, 'nhật ký trước → sau');
    assert(maLoi(() => ck.ghiMiniTest(P.cpManager, mt.id, { tyLe: 90, ngay: TODAY })) === 403, 'QL chi nhánh khác 403');
    const gvKhac = get(`SELECT ta.user_id FROM teacher_assignments ta WHERE ta.status = 'active' AND ta.class_id != ? AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?)
        AND ta.user_id NOT IN (SELECT COALESCE(performer_user_id, 0) FROM case_interventions WHERE nhom_bo_tro = ?)
        AND ta.user_id NOT IN (SELECT COALESCE(sc.owner_user_id, 0) FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = ?) LIMIT 1`,
      mt.lop, mt.lop, mt.nhom_bo_tro, mt.nhom_bo_tro).user_id;
    assert(maLoi(() => ck.ghiMiniTest(loadPrincipal(gvKhac), mt.id, { tyLe: 90, ngay: TODAY })) === 403, 'GV không liên quan 403');
    ck.ghiMiniTest(P.mbManager, mt.id, { tyLe: 90, ngay: TODAY });
    assert(caseNhom(mt.nhom_bo_tro).every((c) => c.status === 'done'), 'QL sửa vẫn được');
    ck.ghiMiniTest(P.mbManager, mt.id, { tyLe: 85, ngay: addDays(TODAY, -2) });
    assert(caseNhom(mt.nhom_bo_tro).every((c) => c.status === 'done' && c.outcome_note === 'Mini Test 85% ≥ 70%'), '≥ 70 → ≥ 70: Case giữ Hoàn thành, chữ theo % mới');
  }));

  // ==================================================================== 5 · RÚT / SỬA ĐỀ XUẤT ĐANG CHỜ (phía người gửi)
  const dxs: any = await import('../duyet/deXuatSua.ts');
  const theCua = (id: number) => get('SELECT * FROM yeu_cau_duyet WHERE id = ?', id);
  await checkAsync('OV7a-5a · Đề xuất sửa: người gửi Sửa (giá trị + lý do, kiểm như lúc gửi) và Rút (thẻ đóng, không chuông); người khác 403; QL đã trả lời → 400', () => thu(() => {
    const sid = moiEm();
    const { id } = dxs.guiDeXuatSua(gvcn, sid, { truong: 'khac', moi: 'Sửa email phụ huynh', lyDo: 'PH đổi email' });
    const chuongQl = demChuong(P.mbManager.userId);
    yc.suaYeuCau(gvcn, id, { moi: 'Sửa email phụ huynh thành me@demo.test', lyDo: 'PH đổi email tuần này' });
    const the = theCua(id);
    assert(JSON.parse(the.du_lieu).moi === 'Sửa email phụ huynh thành me@demo.test' && the.ly_do === 'PH đổi email tuần này', the.du_lieu);
    assert(maLoi(() => yc.suaYeuCau(gvcn, id, { moi: 'x', lyDo: 'ngắn' })) === 400 && maLoi(() => yc.suaYeuCau(gvcn, id, { moi: 'Giá trị hợp lệ', lyDo: '' })) === 400, 'kiểm như lúc gửi');
    const nk = nhatKy('request.edit', id);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).lyDo === 'PH đổi email' && JSON.parse(nk[0].after_json).lyDo === 'PH đổi email tuần này', 'nhật ký trước → sau');
    assert(demChuong(P.mbManager.userId) === chuongQl, 'không chuông trùng');
    assert(maLoi(() => yc.suaYeuCau(gvbm, id, { moi: 'GVBM sửa', lyDo: 'x' })) === 403 && maLoi(() => yc.rutYeuCau(P.mbManager, id)) === 403, 'người khác 403');
    yc.rutYeuCau(gvcn, id);
    assert(theCua(id).trang_thai === 'tu_dong' && theCua(id).ly_do_dong === 'Người gửi đã rút', 'rút');
    assert(yc.yeuCauCuaToi(gvcn).the.find((x: any) => x.id === id)?.trangThai === 'tu_dong', 'Yêu cầu của tôi: đã đóng');
    assert(!yc.hopChoDuyet(P.mbManager, {}).the.some((x: any) => x.id === id), 'hộp Chờ duyệt: hết thẻ');
    const { id: id2 } = dxs.guiDeXuatSua(gvcn, sid, { truong: 'khac', moi: 'Sửa ngày sinh', lyDo: 'Nhập sai' });
    yc.tuChoiYeuCau(P.mbManager, id2, 'Cần giấy tờ');
    assert(maLoi(() => yc.rutYeuCau(gvcn, id2)) === 400, 'QL đã trả lời → 400');
  }));

  await checkAsync('OV7a-5b · Đề xuất chuyển lớp: Sửa lớp / tuần / lý do (lớp sai → 400) và Rút', () => thu(() => {
    const sid = moiEm();
    const { id } = lenh.guiDeXuatChuyenLop(gvcn, sid, { lyDo: 'Em theo không kịp lớp' });
    yc.suaYeuCau(gvcn, id, { toClassId: null, tuan: TUAN[1], lyDo: 'Em theo không kịp, PH đồng ý' });
    const du = JSON.parse(theCua(id).du_lieu);
    assert(du.tuan === TUAN[1] && theCua(id).ly_do === 'Em theo không kịp, PH đồng ý', theCua(id).du_lieu);
    assert(maLoi(() => yc.suaYeuCau(gvcn, id, { toClassId: classId('MB FT 101'), tuan: null, lyDo: 'Chuyển vào chính lớp đang học' })) === 400, 'lớp chuyển đến không hợp lệ');
    assert(maLoi(() => yc.suaYeuCau(gvcn, id, { tuan: TODAY, lyDo: 'Tuần hiện tại' })) === 400, 'tuần không hợp lệ');
    yc.rutYeuCau(gvcn, id);
    assert(theCua(id).trang_thai === 'tu_dong', 'rút');
    lenh.guiDeXuatChuyenLop(gvcn, sid, { lyDo: 'Gửi lại sau khi rút' });
  }));

  await checkAsync('OV7a-5c · "Không cần theo dõi": người gửi Sửa lý do (mốc Case đổi theo) và Rút → Case về chờ nguyên nhân, mốc xin gỡ, hạn giữ nguyên', async () => thu(async () => {
    const sosAuto: any = await import('../cases/sosAuto.ts');
    const sosState: any = await import('../cases/sosState.ts');
    let the = get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND trang_thai = 'cho' AND nguoi_xin IS NOT NULL ORDER BY id LIMIT 1`);
    if (!the) {
      for (const c of all(`SELECT id, owner_user_id FROM sos_cases WHERE status != 'done' AND owner_user_id IS NOT NULL ORDER BY id`)) {
        try { sosAuto.guiKhongTheoDoi(loadPrincipal(c.owner_user_id), c.id, { reasonCode: 'single_incident' }); } catch { continue; }
        the = get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? AND trang_thai = 'cho'`, c.id);
        break;
      }
    }
    assert(the, 'không dựng được thẻ Không cần theo dõi');
    const nguoi = loadPrincipal(the.nguoi_xin);
    const han = get('SELECT han_xac_nhan FROM sos_cases WHERE id = ?', the.doi_tuong_id).han_xac_nhan;
    yc.suaYeuCau(nguoi, the.id, { reasonCode: 'other', reasonText: 'Em ốm cả tuần thi' });
    const sau = theCua(the.id);
    assert(sau.ly_do === 'Khác — Em ốm cả tuần thi' && JSON.parse(sau.du_lieu).reasonCode === 'other', sau.ly_do);
    assert(maLoi(() => yc.suaYeuCau(nguoi, the.id, { reasonCode: 'bay-ba' })) === 400, 'lý do lạ → 400');
    assert(get(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'xin_khong_theo_doi' ORDER BY id DESC LIMIT 1`, the.doi_tuong_id).note === sau.ly_do, 'mốc Case đổi theo');
    yc.rutYeuCau(nguoi, the.id);
    assert(theCua(the.id).trang_thai === 'tu_dong' && !sosState.sosCaseState(the.doi_tuong_id).choDuyetKhongTheoDoi, 'Case thôi chờ QL');
    assert(!get(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'xin_khong_theo_doi'`, the.doi_tuong_id), 'mốc xin gỡ');
    assert(get('SELECT han_xac_nhan FROM sos_cases WHERE id = ?', the.doi_tuong_id).han_xac_nhan === han, 'hạn xác nhận giữ nguyên');
  }));

  const { dinhNghiaCua } = await import('../duyet/loaiYeuCau.ts');
  t.check('OV7a-5d · loại sửa / rút được: một danh sách cho máy chủ và giao diện, mỗi loại có khiSua + khiRut', () => {
    const ds: string[] = d.LOAI_NGUOI_XIN_SUA;
    assert(ds.length === 4 && ['sua_thong_tin', 'de_xuat_chuyen_lop', 'khong_theo_doi', 'y_thuc'].every((x) => ds.includes(x)), String(ds));
    assert(ds.every((x) => dinhNghiaCua(x as any)?.khiSua && dinhNghiaCua(x as any)?.khiRut), 'thiếu khiSua / khiRut');
  });

  // ==================================================================== 6 · SỬA TRẢ LỜI XIN Ý KIẾN
  await checkAsync('OV7a-6 · Xin ý kiến: QL sửa câu trả lời — người hỏi thấy bản mới + MỘT chuông "QL đã sửa câu trả lời"; trùng chữ không chuông; GV / QL ngoài phạm vi 403; thẻ chưa trả lời → 400', () => thu(() => {
    const iv = get(`SELECT iv.id, sc.student_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN students s ON s.id = sc.student_id
        WHERE iv.status IN ('planned', 'started') AND sc.status != 'done' AND s.branch_id = ?
          AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'xin_y_kien' AND y.doi_tuong_id = iv.id AND y.trang_thai = 'cho') ORDER BY iv.id LIMIT 1`, MB);
    assert(iv, 'thiếu PA đang chạy ở MB');
    const id = yc.taoYeuCau(conn, { loai: 'xin_y_kien', doiTuongLoai: 'intervention', doiTuongId: iv.id, hocVienId: iv.student_id, nguoiXin: gvbm.userId, lyDo: 'Em không tiến bộ, nên đổi PA?' });
    assert(maLoi(() => yc.suaTraLoi(P.mbManager, id, 'Chưa trả lời mà sửa')) === 400, 'chưa trả lời → 400');
    yc.traLoiYeuCau(P.mbManager, id, 'Giữ PA thêm 2 tuần');
    const truoc = demChuong(gvbm.userId);
    yc.suaTraLoi(P.mbManager, id, 'Giữ PA thêm 2 tuần, thêm 1 buổi Tutor');
    assert(theCua(id).tra_loi === 'Giữ PA thêm 2 tuần, thêm 1 buổi Tutor' && theCua(id).trang_thai === 'da_tra_loi', 'bản mới');
    assert(demChuong(gvbm.userId) === truoc + 1 && get(`SELECT title FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1`, gvbm.userId).title.includes('QL đã sửa câu trả lời'), 'một chuông');
    yc.suaTraLoi(P.mbManager, id, 'Giữ PA thêm 2 tuần, thêm 1 buổi Tutor');
    assert(demChuong(gvbm.userId) === truoc + 1, 'trùng chữ: không chuông');
    const nk = nhatKy('request.answer_edit', id);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).traLoi === 'Giữ PA thêm 2 tuần', 'nhật ký trước → sau');
    assert(maLoi(() => yc.suaTraLoi(gvcn, id, 'GV sửa câu trả lời')) === 403 && maLoi(() => yc.suaTraLoi(P.cpManager, id, 'QL chi nhánh khác')) === 403, 'GV / QL ngoài phạm vi 403');
    assert(maLoi(() => yc.suaTraLoi(P.mbManager, id, '   ')) === 400, 'rỗng → 400');
  }));
}
