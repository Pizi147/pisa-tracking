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
  }));

  check('QTV2-H-2 · lưu: chỉ Quản trị; sai → 400 nêu hạn; tuPhienBan cũ → 409; giống hệt → không thêm bản', () => thu(() => {
    conn.exec('DELETE FROM cau_hinh_phien_ban'); ch.xoaNhoHan();
    assertThrows(() => ch.luuHanMacDinh(P.mbManager, { han: goc(), tuPhienBan: 0 }), /Quản trị/, 'QL sửa được');
    assert(ch.xemHanMacDinh(P.mbManager).suaDuoc === false && ch.xemHanMacDinh(P.admin).suaDuoc === true, 'cờ suaDuoc');
    assertThrows(() => ch.xemHanMacDinh(P.lrTeacher), /Quản trị/, 'GV xem được');
    const sai = goc(); sai.meeting_cx.ngay = 0;
    assertThrows(() => ch.luuHanMacDinh(P.admin, { han: sai, tuPhienBan: 0 }), /từ 1 đến 60/, 'hạn 0 ngày lưu được');
    const gap = goc(); gap.xac_nhan_case.ngayGap = 9;
    assertThrows(() => ch.luuHanMacDinh(P.admin, { han: gap, tuPhienBan: 0 }), /gấp/, 'gấp dài hơn thường lưu được');
    assert(ch.luuHanMacDinh(P.admin, { han: goc(), tuPhienBan: 0 }).id === 0, 'giống hệt vẫn thêm bản');
    const moi = goc(); moi.meeting_cx.ngay = 7;
    const r = ch.luuHanMacDinh(P.admin, { han: moi, tuPhienBan: 0 });
    assert(r.id > 0 && r.doi.length === 1 && r.doi[0].ma === 'meeting_cx', JSON.stringify(r.doi));
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
  }));
}
