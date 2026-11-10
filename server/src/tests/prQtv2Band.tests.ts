/**
 * PHÉP KIỂM QTV2-BAND (chủ SP 11/11, Quản trị V2 PR-5; PTA XM-1): Kỳ vọng MT FT + Ngưỡng lớp thường có phiên bản.
 *  · bảng rỗng = bản gốc: kỳ vọng MT1 −1.0 · MT2 −0.5 · MT3+ 0 · RF 0; dải Cuối khoá 50 / 60; Mini Test 70 % (ngày đầu không đổi hành vi);
 *  · lưu: chỉ Quản trị; giá trị sai → 400 nêu trường; `tuPhienBan` cũ → 409; giống hệt → không thêm bản; nhật ký mục Band;
 *  · chỉ áp cho cái sinh sau: lượt MT tạo trước ngày sửa giữ kỳ vọng cũ; Final nhập điểm đầu trước ngày sửa giữ dải cũ; Mini Test theo ngày làm;
 *  · `evaluateRegular` mang ngày nhập điểm đầu (`mocNguong`); SQL Mini Test theo bản (CASE).
 */
export async function runPrQtv2BandTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any }) {
  const { check, assert, assertThrows, conn, P } = t;
  const ch: any = await import('../platform/cauHinh.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const reg: any = await import('../normal/regular.ts');
  const sc: any = await import('../fasttrack/scoring.ts');
  const dm: any = await import('../demoConfig.ts');
  const th: any = await import('../phanTich/tongHop.ts');
  const prof: any = await import('../students/profile.ts');
  console.log('\nQTV2-BAND — Kỳ vọng MT FT + Ngưỡng lớp thường có phiên bản, chỉ áp cho cái sinh sau');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { ch.xoaNhoHan(); return fn(); } finally { conn.exec('ROLLBACK'); ch.xoaNhoHan(); } };
  const xoa = () => { conn.exec(`DELETE FROM cau_hinh_phien_ban WHERE loai IN ('ky_vong_ft', 'nguong_thuong')`); ch.xoaNhoHan(); };
  const kv = () => ({ ...d.KY_VONG_FT_GOC }), ng = () => ({ ...d.NGUONG_THUONG_GOC });

  check('QTV2-B-1 · bảng rỗng = bản gốc: kỳ vọng, dải Cuối khoá, Mini Test đúng giá trị cũ', () => thu(() => {
    xoa();
    assert(d.expectationDelta(1) === 1 && d.expectationDelta(2) === 0.5 && d.expectationDelta(3) === 0 && d.expectationDelta(7) === 0 && d.expectationDelta(1, 'RF') === 0, 'kỳ vọng gốc');
    assert(sc.expectationFor(6.5, 1, null, '2026-01-01') === 5.5, 'expectationFor gốc');
    assert(d.daiCuoiKhoa(0.4999) === 'duoi_50' && d.daiCuoiKhoa(0.5) === '50_59' && d.daiCuoiKhoa(0.5999) === '50_59' && d.daiCuoiKhoa(0.6) === '60_69'
      && d.daiCuoiKhoa(0.7) === 'dat' && d.daiCuoiKhoa(0.72, 0.725) === '60_69', 'dải gốc');
    assert(d.nguongMiniTest() === 0.7 && d.nguongMiniTest('2026-01-01') === 0.7, 'Mini Test gốc');
    assert(ch.sqlNguongMiniTest('m.ngay_lam') === '0.7', `SQL gốc ${ch.sqlNguongMiniTest('m.ngay_lam')}`);
    assert(d.khoangDai('50_59', 0.7) === '50–59%' && d.khoangDai('60_69', 0.7) === '60–69%' && d.khoangDai('duoi_50', 0.7) === '< 50%', 'nhãn dải gốc');
  }));

  check('QTV2-B-2 · lưu: chỉ Quản trị; sai → 400 nêu trường; tuPhienBan cũ → 409; giống hệt → không thêm bản; nhật ký mục Band', () => thu(() => {
    xoa();
    assertThrows(() => ch.luuBand(P.mbManager, 'ky-vong-ft', { giaTri: kv(), tuPhienBan: 0 }), /Quản trị/, 'QL sửa được');
    assert(ch.xemBand(P.mbManager, 'nguong-thuong').suaDuoc === false && ch.xemBand(P.admin, 'nguong-thuong').suaDuoc === true, 'cờ suaDuoc');
    assertThrows(() => ch.xemBand(P.lrTeacher, 'ky-vong-ft'), /Quản trị/, 'GV xem được');
    assertThrows(() => ch.xemBand(P.admin, 'han'), /Không có mục/, 'loại lạ');
    assertThrows(() => ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: { ...kv(), mt1: 0.3 }, tuPhienBan: 0 }), /bước 0.5/, '0.3 lưu được');
    assertThrows(() => ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: { ...kv(), mt1: 3.5 }, tuPhienBan: 0 }), /0 đến 3/, '3.5 lưu được');
    assertThrows(() => ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: { ...kv(), constructor: 1 }, tuPhienBan: 0 }), /không có/, 'khoá lạ lọt');
    assertThrows(() => ch.luuBand(P.admin, 'nguong-thuong', { giaTri: { ...ng(), hocLai: 60, len: 60 }, tuPhienBan: 0 }), /lớn hơn/, 'học lại ≥ lên');
    assertThrows(() => ch.luuBand(P.admin, 'nguong-thuong', { giaTri: { ...ng(), miniTest: 70.5 }, tuPhienBan: 0 }), /số nguyên/, '70.5 lưu được');
    assert(ch.luuBand(P.admin, 'nguong-thuong', { giaTri: ng(), tuPhienBan: 0 }).id === 0, 'giống hệt vẫn thêm bản');
    const r = ch.luuBand(P.admin, 'nguong-thuong', { giaTri: { ...ng(), len: 55 }, tuPhienBan: 0 });
    assert(r.id > 0 && r.doi.length === 1 && r.doi[0].ma === 'len', JSON.stringify(r.doi));
    assertThrows(() => ch.luuBand(P.admin, 'nguong-thuong', { giaTri: ng(), tuPhienBan: 0 }), /Vừa có người sửa/, '409 không chặn');
    const nk = conn.prepare(`SELECT action, after_json FROM audit_logs WHERE entity_type = 'cau_hinh.nguong_thuong' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(nk?.action === 'cau_hinh.nguong_thuong.sua' && /Lên từ/.test(nk.after_json), `nhật ký ${JSON.stringify(nk)}`);
    const muc = (ch.xemBand(P.admin, 'nguong-thuong') as any).lichSu;
    assert(muc.length === 1 && muc[0].doi[0].sau === 55, 'lịch sử');
  }));

  check('QTV2-B-3 · chỉ áp cho cái sinh sau: lượt MT / Final / Mini Test trước ngày sửa giữ bản cũ; Hoàn tác = bản mới', () => thu(() => {
    xoa();
    const sau = '2999-01-01T00:00:00.000Z';   // lượt tạo SAU lúc lưu (giờ thật — cùng đồng hồ `created_at`)
    const truoc = '2020-01-01T00:00:00.000Z';
    const k = ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: { ...kv(), mt1: 0.5, rf: 0.5 }, tuPhienBan: 0 });
    assert(d.expectationDelta(1, null, truoc) === 1 && d.expectationDelta(1, null, sau) === 0.5 && d.expectationDelta(1) === 0.5, 'kỳ vọng MT1 trước / sau');
    assert(d.expectationDelta(3, 'RF', truoc) === 0 && d.expectationDelta(3, 'RF', sau) === 0.5, 'RF trước / sau');
    const r = sc.evaluateAttempt(6.5, 1, { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.5 }, [], null, [], false, truoc);
    const r2 = sc.evaluateAttempt(6.5, 1, { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.5 }, [], null, [], false, sau);
    assert(r.expectation === 5.5 && r.sosLevel === 0 && r2.expectation === 6 && r2.sosLevel === 3, `SOS theo bản lúc tạo lượt: ${r.sosLevel} / ${r2.sosLevel}`);
    ch.luuBand(P.admin, 'nguong-thuong', { giaTri: { hocLai: 45, len: 55, miniTest: 65 }, tuPhienBan: 0 });
    assert(d.daiCuoiKhoa(0.57, 0.7, truoc) === '50_59' && d.daiCuoiKhoa(0.57, 0.7, sau) === '60_69' && d.daiCuoiKhoa(0.47, 0.7, sau) === '50_59', 'dải trước / sau');
    assert(d.nguongMiniTest(truoc) === 0.7 && d.nguongMiniTest(sau) === 0.65, 'Mini Test theo lúc ghi');
    const g = d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.57, monTruot: ['listening'], nguong: 0.7, moc: truoc });
    const g2 = d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.57, monTruot: ['listening'], nguong: 0.7, moc: sau });
    assert(g?.dai === '50_59' && g?.canQuanLy && g2?.dai === '60_69' && !g2?.canQuanLy, 'gợi ý Cuối khoá theo bản');
    const sql = ch.sqlNguongMiniTest('m.ghi_luc');
    assert(sql === `(CASE WHEN m.ghi_luc >= '${ch.dsBanNguong().at(-1).luc}' THEN 0.65 ELSE 0.7 END)`, sql);
    const ly = d.lyDoXetLai({ huong: 'hoc_lai', tyLe: 0.57, du: true, ngayRaLenh: truoc, mocFinal: sau, ngayFinal: '2999-01-01', miniTest: null, quyetLuc: null, mocNguong: truoc });
    assert(ly === null, `học lại 57 % theo bản cũ (lên từ 60) không có Xét lại: ${JSON.stringify(ly)}`);
    const ly2 = d.lyDoXetLai({ huong: 'hoc_lai', tyLe: 0.57, du: true, ngayRaLenh: truoc, mocFinal: sau, ngayFinal: '2999-01-01', miniTest: null, quyetLuc: null, mocNguong: sau });
    assert(ly2?.ma === 'c', 'học lại 57 % theo bản mới (lên từ 55) phải Xét lại');
    const h = ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: k.truocGiaTri, tuPhienBan: k.id, khoiPhucTu: k.truocId });
    assert(h.id > k.id && d.expectationDelta(1, null, sau) === 1, 'Hoàn tác không về kỳ vọng cũ');
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE entity_type = 'cau_hinh.ky_vong_ft' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(nk?.action === 'cau_hinh.ky_vong_ft.khoi_phuc', `Hoàn tác ghi ${nk?.action}`);
  }));

  check('QTV2-B-4 · mốc = created_at của lượt, so cả GIỜ (lượt 9:00, lưu 15:00 → giữ bản cũ); dòng hỏng không làm sập', () => thu(() => {
    xoa();
    const r = reg.evaluateRegular(['listening'], [{ skill: 'listening', raw_score: 6, raw_total: 10 }], 'FOU', 0.7, '2026-09-14T02:00:00.000Z');
    assert(r.mocNguong === '2026-09-14T02:00:00.000Z', `mocNguong ${r.mocNguong}`);
    const them = conn.prepare(`INSERT INTO cau_hinh_phien_ban (loai, du_lieu, tao_luc) VALUES (?, ?, ?)`);
    them.run('ky_vong_ft', JSON.stringify({ ...kv(), mt1: 0 }), '2026-09-14T08:00:00.000Z');   // 15:00 giờ VN
    them.run('nguong_thuong', JSON.stringify({ ...ng(), len: 55 }), '2026-09-14T08:00:00.000Z');
    ch.xoaNhoHan();
    assert(d.expectationDelta(1, null, '2026-09-14T02:00:00.000Z') === 1 && d.expectationDelta(1, null, '2026-09-14T09:00:00.000Z') === 0, 'kỳ vọng lưu cùng ngày áp ngược');
    assert(d.daiCuoiKhoa(0.57, 0.7, '2026-09-14T02:00:00.000Z') === '50_59' && d.daiCuoiKhoa(0.57, 0.7, '2026-09-14T09:00:00.000Z') === '60_69', 'ngưỡng lưu cùng ngày áp ngược');
    them.run('nguong_thuong', '{hỏng', '2026-09-15T03:00:00.000Z');
    ch.xoaNhoHan();
    assert(ch.dsBanNguong().length === 2 && d.nguongMiniTest() === 0.7, 'dòng hỏng làm sập');
    assertThrows(() => ch.luuBand(P.admin, 'nguong-thuong', { giaTri: { ...ng(), len: 70 }, tuPhienBan: ch.dsBanNguong().at(-1).id }), /Đạt từ/, 'Lên từ ≥ Đạt từ lưu được');
  }));

  check('QTV2-B-5 · một lượt MT thật: lưu kỳ vọng mới SAU lúc tạo lượt → Tổng hợp (phanLoaiCacLuot ∘ luotTrongKhoang) = hồ sơ (typedResult), giữ SOS cũ', () => thu(() => {
    xoa();
    const a = conn.prepare(`SELECT a.* FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id
       WHERE a.kind = 'mock' AND a.attempt_no = 1 AND a.status != 'cancelled' AND a.planned_period_id IS NOT NULL AND a.target_at_attempt IS NOT NULL AND cy.khong_cam_ket = 0
         AND (SELECT COUNT(*) FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL) >= 4 ORDER BY a.id LIMIT 1`).get() as any;
    assert(!!a, 'seed thiếu lượt MT1 đủ điểm');
    const sos = () => {
      const tong = th.phanLoaiCacLuot(th.luotTrongKhoang('a.id = ?', [a.id])).get(a.id)?.sosLevel ?? null;
      const hs = prof.typedResult(conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(a.id)).ft?.sosLevel ?? null;
      return { tong, hs };
    };
    const truoc = sos();
    assert(truoc.tong === truoc.hs, `trước: Tổng hợp ${truoc.tong} ≠ hồ sơ ${truoc.hs}`);
    ch.luuBand(P.admin, 'ky-vong-ft', { giaTri: { ...kv(), mt1: 0 }, tuPhienBan: 0 });   // lưu BÂY GIỜ — sau created_at của lượt seed
    const sau = sos();
    assert(sau.tong === truoc.tong && sau.hs === truoc.hs, `lượt tạo trước lúc sửa đổi SOS: ${JSON.stringify({ truoc, sau })}`);
    conn.prepare('UPDATE assessment_attempts SET created_at = ? WHERE id = ?').run('2999-01-01T00:00:00.000Z', a.id);   // lượt "mở sau" lúc sửa
    ch.xoaNhoHan();
    const moi = sos();
    assert(moi.tong === moi.hs, `lượt mở sau: Tổng hợp ${moi.tong} ≠ hồ sơ ${moi.hs}`);
  }));
}
