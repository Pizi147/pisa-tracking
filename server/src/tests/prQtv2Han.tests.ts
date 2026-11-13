/**
 * PHÉP KIỂM QTV2-HAN (chủ SP 11/11, Quản trị V2 PR-4): Hạn mặc định có phiên bản.
 *  · bảng rỗng = bản gốc: 14 hàm hạn ra ĐÚNG giá trị cũ (ngày đầu không đổi hành vi);
 *  · lưu: chỉ Quản trị; giá trị sai → 400 nêu hạn; `tuPhienBan` cũ → 409; giống hệt → không thêm bản;
 *  · chỉ áp cho việc sinh sau: việc có mốc trước ngày sửa giữ hạn cũ, từ ngày sửa theo hạn mới; Hoàn tác (khôi phục) = bản mới, việc sau về hạn cũ.
 */
export async function runPrQtv2HanTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any }) {
  const { check, assert, assertThrows, conn, P } = t;
  const ch: any = await import('../platform/cauHinh.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const wk: any = await import('../platform/week.ts');
  const dm: any = await import('../demoConfig.ts');
  const fs: any = await import('node:fs');
  const { huongDanNhomViec } = await import('../worklist/mywork.ts');
  console.log('\nQTV2-HAN — Hạn mặc định có phiên bản, chỉ áp cho việc sinh sau');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { ch.xoaNhoHan(); return fn(); } finally { conn.exec('ROLLBACK'); ch.xoaNhoHan(); } };
  const goc = () => JSON.parse(JSON.stringify(d.HAN_MAC_DINH_GOC));

  check('QTV2-H-1 · bảng rỗng = bản gốc: hạn ra đúng giá trị cũ', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    assert(d.hanBaoPh('2026-09-14') === '2026-09-18', `Báo PH ${d.hanBaoPh('2026-09-14')}`);   // N2: lưu T2 14/09 → hết T6 18/09
    assert(d.mocLoTrinh('2026-09-21').hanChot === '2026-09-17', 'chốt lộ trình T5 tuần trước Final');
    assert(wk.defaultScoreDeadline('2026-09-14') === '2026-09-23' && d.hanChamMt0('2026-09-16') === '2026-09-23', 'chấm T4 tuần sau');
    assert(d.soNgayHanXacNhan({ sosLevel: 3 }) === 3 && d.soNgayHanXacNhan({ sosLevel: 1 }) === 5 && d.soNgayHanXacNhan({ sosLevel: 3, thuong: true }) === 5, 'xác nhận 5 / 3');
    assert(d.hanDuyetNgay() === 5 && d.hanBanGiao('2026-09-14').gvcn === d.hanTheoNgay('2026-09-14', 7), 'duyệt 5, bàn giao 7');
    assert(d.hanKyGhiKetQua('2026-09-17') === '2026-09-29', 'ghi KQ PA kỳ 1 hạn 29/09');
    assert(d.hanXetLai({ ma: 'a', tuanBatDau: '2026-09-14', moc: '2026-09-14' }) === '2026-09-27', 'xét lại CN tuần 2');
    assert(!('meeting_cx' in d.HAN_MAC_DINH_GOC) && d.MA_HAN.length === 14, 'Meeting CX / GĐCN phải ở Case & SOS (một hạn một chỗ sửa)');
  }));

  check('QTV2-H-2 · lưu: chỉ Quản trị; sai → 400 nêu hạn; tuPhienBan cũ → 409; giống hệt → không thêm bản', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    assertThrows(() => ch.luuHanMacDinh(P.mbManager, { han: goc(), tuPhienBan: 0 }), /Quản trị/, 'QL sửa được');
    assert(ch.xemHanMacDinh(P.mbManager).suaDuoc === false && ch.xemHanMacDinh(P.admin).suaDuoc === true, 'cờ suaDuoc');
    assertThrows(() => ch.xemHanMacDinh(P.lrTeacher), /Quản trị/, 'GV xem được');
    const sai = goc(); sai.xu_ly_vi_pham.ngay = 0;
    assertThrows(() => ch.luuHanMacDinh(P.admin, { han: sai, tuPhienBan: 0 }), /từ 1 đến 60/, 'hạn 0 ngày lưu được');
    const gap = goc(); gap.xac_nhan_case.ngayGap = 9;
    assertThrows(() => ch.luuHanMacDinh(P.admin, { han: gap, tuPhienBan: 0 }), /gấp/, 'gấp dài hơn thường lưu được');
    assert(ch.luuHanMacDinh(P.admin, { han: goc(), tuPhienBan: 0 }).id === 0, 'giống hệt vẫn thêm bản');
    const moi = goc(); moi.xu_ly_vi_pham.ngay = 7;
    const r = ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(r.id > 0 && r.doi.length === 1 && r.doi[0].ma === 'xu_ly_vi_pham', JSON.stringify(r.doi));
    assertThrows(() => ch.luuHanMacDinh(P.admin, { han: goc(), tuPhienBan: 0 }), /Vừa có người sửa/, '409 không chặn');
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE entity_type = 'cau_hinh.han_mac_dinh' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(nk?.action === 'cau_hinh.han_mac_dinh.sua', 'thiếu nhật ký');
  }));

  check('QTV2-H-3 · chỉ áp cho việc sinh sau; Hoàn tác = bản mới, việc sau về hạn cũ', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    const homNay = dm.nowNghiepVu().slice(0, 10);
    const truoc = d.addDaysIso(homNay, -3); const sau = d.addDaysIso(homNay, 2);
    const moi = goc(); moi.bao_ph_vi_pham.ngay = 7;
    const r = ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(d.hanBaoPh(truoc) === d.addDaysIso(truoc, 4), `việc cũ đổi hạn: ${d.hanBaoPh(truoc)}`);
    assert(d.hanBaoPh(sau) === d.addDaysIso(sau, 6) && d.hanBaoPh(homNay) === d.addDaysIso(homNay, 6), `việc sau không theo hạn mới: ${d.hanBaoPh(sau)}`);
    const h = ch.luuHanMacDinh(P.admin, { han: r.truocHan, tuPhienBan: r.id, khoiPhucTu: r.truocId });
    assert(h.id > r.id && d.hanBaoPh(sau) === d.addDaysIso(sau, 4), 'Hoàn tác không về hạn cũ');
    assert((conn.prepare(`SELECT COUNT(*) n FROM cau_hinh_phien_ban`).get() as any).n === 2, 'Hoàn tác xoá bản thay vì thêm');
    const nk = conn.prepare(`SELECT action FROM audit_logs WHERE entity_type = 'cau_hinh.han_mac_dinh' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(nk?.action === 'cau_hinh.han_mac_dinh.khoi_phuc', `Hoàn tác về bản gốc (id 0) ghi "${nk?.action}"`);
  }));

  check('QTV2-H-4 · khoá lạ (kể cả tên của prototype) bị chặn; ngày hiệu lực theo giờ VN; dòng hỏng / thiếu trường không làm sập', () => thu(() => {
    for (const x of [{ ...goc(), constructor: 1 }, { ...goc(), toString: 1 }]) assert(d.kiemHanMacDinh(x)?.loi?.startsWith('Hạn không có'), 'khoá lạ lọt');
    const con = goc(); con.cham_test.toString = 1;
    assert(d.kiemHanMacDinh(con)?.loi === 'Có trường lạ.', 'trường lạ lọt');
    conn.exec('DELETE FROM cau_hinh_phien_ban');
    const them = conn.prepare(`INSERT INTO cau_hinh_phien_ban (loai, du_lieu, tao_luc) VALUES ('han_mac_dinh', ?, ?)`);
    them.run('{hỏng', '2026-11-09T03:00:00.000Z');
    them.run(JSON.stringify({ ...goc(), xac_nhan_case: { ngay: 6 } }), '2026-11-10T20:00:00.000Z');   // 03:00 sáng 11/11 giờ VN; thiếu ngayGap
    ch.xoaNhoHan();
    const ds = ch.dsBanHan();
    assert(ds.length === 2 && ds[1].tu === '2026-11-11', `tu ${ds.at(-1)?.tu} · ${ds.length} bản`);
    assert(d.hanTai('xac_nhan_case', '2026-11-10').ngay === 5 && d.hanTai('xac_nhan_case', '2026-11-11').ngay === 6, 'áp ngược cho hôm trước');
    assert(d.hanTai('xac_nhan_case', '2026-11-11').ngayGap === 3, 'thiếu trường không lấy gốc');
    assert(d.hanTai('xac_nhan_case', '2026-11-10T20:00:00.000Z').ngay === 6 && d.hanTai('xac_nhan_case', '2026-11-10T16:00:00.000Z').ngay === 5, 'mốc ISO UTC không đổi về ngày VN');
  }));
  /* QTV2 việc để lại (PTA): Báo PH sinh TRƯỚC ngày đổi hạn mà hạn rơi SAU ngày đổi → vẫn theo bản lúc sinh (Tạm dừng / Quay lại tính đúng ngày sinh). */
  check('QTV2-H-5 · hanBaoPhHieuLuc chọn bản LÚC SINH việc: việc sinh trước ngày đổi hạn (hạn sau ngày đổi) giữ N cũ khi tính Quay lại học', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    const homNay = dm.nowNghiepVu().slice(0, 10);
    const sinh = d.addDaysIso(homNay, -2);
    const han = d.hanBaoPh(sinh);   // bản gốc: sinh + 4 → sau ngày đổi
    const moi = goc(); moi.bao_ph_vi_pham.ngay = 9;
    ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(han === d.addDaysIso(sinh, 4) && d.hanBaoPh(sinh) === han, 'tiền đề: việc cũ giữ hạn cũ');
    /* Tạm dừng từ ngày sinh tới hôm nay → hạn mới = ngày quay lại + N lúc sinh (4), không + 8 của bản mới. */
    const kq = d.hanBaoPhHieuLuc(han, [{ tu: sinh, den: homNay }]);
    assert(kq === [han, d.addDaysIso(homNay, 4)].sort()[1], `Quay lại học theo N lúc sinh: ${kq}`);
  }));

  check('QTV2-H-7 · đổi hạn chung: Không cần theo dõi + Đề xuất chuyển lớp sinh sau theo hạn mới; PA khác quy chế theo dòng riêng; thẻ cũ giữ hạn', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    const homNay = dm.nowNghiepVu().slice(0, 10);
    const cu = d.addDaysIso(homNay, -3);
    assert(d.hanDuyetMacDinh('khong_theo_doi', homNay) === d.addDaysIso(homNay, 4) && d.hanDuyetMacDinh('de_xuat_chuyen_lop', homNay) === d.addDaysIso(homNay, 4)
      && d.hanDuyetMacDinh('giu_pa_gv', homNay) === d.addDaysIso(homNay, 3), 'gốc: 5 / 5 / gửi + 3');
    const moi = goc(); moi.ql_duyet_pa.ngay = 8;
    ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(d.hanDuyetMacDinh('khong_theo_doi', homNay) === d.addDaysIso(homNay, 7) && d.hanDuyetMacDinh('de_xuat_chuyen_lop', homNay) === d.addDaysIso(homNay, 7), 'hai thẻ không theo hạn chung mới');
    assert(d.hanDuyetMacDinh('khong_theo_doi', cu) === d.addDaysIso(cu, 4), 'thẻ cũ đổi hạn');
    assert(d.hanDuyetMacDinh('giu_pa_gv', homNay) === d.addDaysIso(homNay, 3), 'giu_pa_gv đổi theo hạn chung');
    const r2 = goc(); r2.ql_duyet_pa.ngay = 8; r2.giu_pa_gv.ngay = 6;
    ch.luuHanMacDinh(P.admin, { han: r2, tuPhienBan: (ch.xemHanMacDinh(P.admin) as any).id });
    assert(d.hanDuyetMacDinh('giu_pa_gv', homNay) === d.addDaysIso(homNay, 6) && d.hanDuyetMacDinh('giu_pa_gv', cu) === d.addDaysIso(cu, 3), 'giu_pa_gv theo dòng riêng / thẻ cũ giữ hạn');
  }));

  check('QTV2-H-8 · L1–L3 (PTA 13/11): chữ hạn trên web / máy chủ lấy từ Hạn mặc định — đổi hạn thì chữ đổi, không còn 2/3 ngày', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    const bg = () => huongDanNhomViec('ban_giao'); const bt = () => huongDanNhomViec('buoc_tiep');
    assert(/Hạn tối thiểu 7 ngày/.test(bg()) && !/2 ngày|3 ngày/.test(bg()), 'bàn giao gốc: ' + bg());
    assert(/Hạn 7 ngày/.test(bt()) && /Lộ trình mới hoặc Tạm dừng \/ Kết thúc học/.test(bt()) && !/Thôi học/.test(bt()), 'bước tiếp gốc: ' + bt());
    const moi = goc(); moi.ban_giao_chuyen_lop.ngay = 9; moi.buoc_tiep_sau_thi.ngay = 10; moi.ql_duyet_pa.ngay = 8;
    ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(/Hạn tối thiểu 9 ngày/.test(bg()) && /Hạn 10 ngày/.test(bt()), 'đổi hạn → chữ đổi: ' + bg() + ' | ' + bt());
    assert(d.hanDuyetNgay() === 8, 'panel Xác nhận xử lý đọc hanDuyetNgay → 8');   // web: soNgayQl = hanDuyetNgay(homNay)
  }));

  check('QTV2-H-6 · lỗi máy chủ "Lên từ" phải dưới "Đạt từ"… có khoá dịch + biến (web tiếng Anh dịch được)', () => {
    const src = fs.readFileSync('server/src/platform/cauHinh.ts', 'utf8') as string;
    assert(/loiDich\(400, loi\.khoa, loi\.bien/.test(src) && /khoa, bien: \{ dat \}/.test(src), 'câu có biến chưa gửi khoá dịch');
  });
}
