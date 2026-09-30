/** PHÉP KIỂM PR-CT — lệnh chuyển lớp do Quản lý quyết + bàn giao (đặc tả §3.1f Q30-1…Q30-4, kế hoạch 2026-09-30-pr-ct). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrCtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-CT · Chuyển lớp do Quản lý quyết + Bàn giao');

  // ------------------------------------------------------------------ khối 1 · luật thuần chuyenLop.ts
  const HOM_NAY = '2026-09-30';   // Thứ Tư; Thứ Hai tuần này = 2026-09-28
  const dong = (o: Record<string, unknown> = {}) => ({
    huong: 'len_lop', lopDichId: 5, lopDichFt: false, nguonFt: false, tuan: '2026-10-05', homNay: HOM_NAY,
    lyDo: null, khacGoiY: false, mucTieu: null, ngayXemLai: null, ...o,
  });

  check('CT (1a) · tuanChonDuoc từ Thứ Tư / Thứ Hai / Chủ nhật: không bao giờ ra tuần hiện tại, đủ 6 Thứ Hai liên tiếp', () => {
    for (const hn of ['2026-09-30', '2026-09-28', '2026-10-04']) {
      const ds: string[] = d.tuanChonDuoc(hn);
      assert(ds.length === 6, `${hn}: ${ds.length} tuần`);
      assert(ds[0] === '2026-10-05', `${hn}: tuần đầu ${ds[0]}`);
      assert(ds.every((x, i) => d.tuanHopLe(x, hn) && (i === 0 || Date.parse(x) - Date.parse(ds[i - 1]) === 7 * 86_400_000)), `${hn}: ${ds}`);
    }
    assert(d.tuanChonDuoc('2026-10-05', 2).join() === '2026-10-12,2026-10-19', 'n = 2 từ Thứ Hai');
  });
  check('CT (1b) · tuanHopLe: Thứ Hai tuần này / ngày không phải Thứ Hai / rỗng / sai dạng → false; Thứ Hai tuần sau → true', () => {
    assert(!d.tuanHopLe('2026-09-28', HOM_NAY), 'tuần hiện tại');
    assert(!d.tuanHopLe('2026-10-06', HOM_NAY), 'Thứ Ba');
    assert(!d.tuanHopLe(null, HOM_NAY) && !d.tuanHopLe('', HOM_NAY) && !d.tuanHopLe('05/10/2026', HOM_NAY), 'rỗng / sai dạng');
    assert(!d.tuanHopLe('2026-09-21', HOM_NAY), 'tuần đã qua');
    assert(d.tuanHopLe('2026-10-05', HOM_NAY), 'Thứ Hai tuần sau');
  });
  check('CT (1c) · hanBanGiao tính cả ngày ra lệnh: 30/09 → GVBM 01/10, GVCN 02/10', () => {
    const h = d.hanBanGiao('2026-09-30');
    assert(h.gvbm === '2026-10-01' && h.gvcn === '2026-10-02', JSON.stringify(h));
  });
  check('CT (1d) · coPhieu: mọi hướng trừ Dừng học · canLopDich: trừ Bảo lưu và Dừng học', () => {
    for (const h of d.HUONG_LENH) {
      assert(d.coPhieu(h) === (h !== 'dung_hoc'), `coPhieu ${h}`);
      assert(d.canLopDich(h) === (h !== 'dung_hoc' && h !== 'bao_luu'), `canLopDich ${h}`);
    }
  });
  check('CT (1e) · kiemDongLenh: dòng đủ → null; thiếu hướng → "Chọn hướng cho em"; thiếu lớp đích → "Chọn lớp đích"', () => {
    assert(d.kiemDongLenh(dong()) === null, 'dòng đủ');
    assert(d.kiemDongLenh(dong({ huong: null })) === 'Chọn hướng cho em', 'thiếu hướng');
    assert(d.kiemDongLenh(dong({ lopDichId: null })) === 'Chọn lớp đích', 'thiếu lớp đích');
    assert(d.kiemDongLenh(dong({ huong: 'bao_luu', lopDichId: null, lyDo: 'đi xa', ngayXemLai: '2026-11-02' })) === null, 'bảo lưu không cần lớp đích');
  });
  check('CT (1f) · kiemDongLenh: tuần hiện tại / trống / không phải Thứ Hai → "Tuần bắt đầu phải từ tuần sau trở đi"', () => {
    for (const tuan of ['2026-09-28', null, '2026-10-06']) {
      assert(d.kiemDongLenh(dong({ tuan })) === 'Tuần bắt đầu phải từ tuần sau trở đi', `tuần ${tuan}`);
    }
  });
  check('CT (1g) · kiemDongLenh: chọn khác gợi ý hoặc Chuyển lớp / Bảo lưu / Dừng học mà lý do < 3 ký tự → "Ghi lý do ngắn"', () => {
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: 'ab' })) === 'Ghi lý do ngắn', 'khác gợi ý');
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: '   ' })) === 'Ghi lý do ngắn', 'lý do toàn dấu cách');
    assert(d.kiemDongLenh(dong({ khacGoiY: true, lyDo: 'abc' })) === null, 'đủ 3 ký tự');
    assert(d.kiemDongLenh(dong({ huong: 'chuyen_lop' })) === 'Ghi lý do ngắn', 'chuyển lớp');
    assert(d.kiemDongLenh(dong({ huong: 'dung_hoc', lopDichId: null })) === 'Ghi lý do ngắn', 'dừng học');
    assert(d.kiemDongLenh(dong()) === null, 'lên lớp theo gợi ý không cần lý do');
  });
  check('CT (1h) · kiemDongLenh: lên FT thiếu / sai Target → "Ghi Target (hoặc KCK)"; số hợp lệ và KCK qua; FT → FT không cần Target', () => {
    const ft = { huong: 'fast_track', lopDichFt: true };
    assert(d.kiemDongLenh(dong(ft)) === 'Ghi Target (hoặc KCK)', 'thiếu');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 9.5 })) === 'Ghi Target (hoặc KCK)', '9.5');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 6.3 })) === 'Ghi Target (hoặc KCK)', 'không bước .5');
    assert(d.kiemDongLenh(dong({ ...ft, mucTieu: 6 })) === null && d.kiemDongLenh(dong({ ...ft, mucTieu: 'KCK' })) === null, '6.0 và KCK');
    assert(d.kiemDongLenh(dong({ huong: 'chuyen_lop', lopDichFt: true, nguonFt: true, lyDo: 'gộp lớp' })) === null, 'FT → FT');
  });
  check('CT (1i) · kiemDongLenh: bảo lưu thiếu tuần xem lại → "Chọn tuần xem lại"', () => {
    assert(d.kiemDongLenh(dong({ huong: 'bao_luu', lopDichId: null, lyDo: 'đi xa' })) === 'Chọn tuần xem lại', 'thiếu tuần xem lại');
  });
  check('CT (1j) · Q30-4: kiemDongLenh không có nhánh "thiếu điểm Cuối khoá" — dòng cùng dữ liệu vẫn null (mọi tham số đều không nhắc điểm)', () => {
    assert(d.kiemDongLenh(dong()) === null, 'em thiếu điểm P vẫn chuyển được');
    assert(!/điểm/i.test(String(d.kiemDongLenh(dong({ huong: null })))), 'câu lỗi không nói điểm');
  });
  check('CT (1k) · tomTatLenh: đúng 5 câu mockup C — 4 lên BE · 1 lên FT · 1 học lại · 1 bảo lưu · "Chưa gửi"', () => {
    const cau: string[] = d.tomTatLenh([
      { ten: 'Vũ Gia An', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Ngô Minh Huy', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05', ghiChu: 'có PA bổ trợ miễn phí P, 2 buổi, và Mini Test' },
      { ten: 'Lê Hải Mai', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Trịnh Đức Long', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'Đỗ Bảo Linh', huong: 'fast_track', lopDich: 'MB FT 105 · LT1', tuan: '2026-10-05', mucTieu: 6 },
      { ten: 'Hoàng Khánh Vy', huong: 'hoc_lai', lopDich: 'MB FOU 14', tuan: '2026-10-12' },
      { ten: 'Phan Quang Nam', huong: 'bao_luu', tuan: '2026-10-05', ngayXemLai: '2026-10-26' },
      { ten: 'Bùi Thu Trang', huong: null },
    ], HOM_NAY);
    assert(cau.length === 5, `${cau.length} câu: ${cau.join(' | ')}`);
    assert(cau[0].startsWith('4 em lên MB BE 04 từ W2 OCT (Vũ Gia An, Ngô Minh Huy, Lê Hải Mai, Trịnh Đức Long).'), cau[0]);
    assert(cau[0].includes('Ngô Minh Huy có PA bổ trợ miễn phí P'), cau[0]);
    assert(cau[1] === '1 em lên Fast Track MB FT 105 · LT1 từ W2 OCT (Đỗ Bảo Linh, target 6).', cau[1]);
    assert(cau[2] === '1 em học lại MB FOU 14 từ W3 OCT (Hoàng Khánh Vy).', cau[2]);
    assert(cau[3] === '1 em bảo lưu, xem lại W5 OCT (Phan Quang Nam).', cau[3]);
    assert(cau[4] === 'Chưa gửi: Bùi Thu Trang (chưa quyết).', cau[4]);
  });
  check('CT (1l) · tomTatLenh: cùng lớp đích khác tuần tách hai câu; danh sách rỗng → không câu nào', () => {
    const cau: string[] = d.tomTatLenh([
      { ten: 'A', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-05' },
      { ten: 'B', huong: 'len_lop', lopDich: 'MB BE 04', tuan: '2026-10-12' },
    ], HOM_NAY);
    assert(cau.length === 2 && cau[0].includes('W2 OCT') && cau[1].includes('W3 OCT'), cau.join(' | '));
    assert(d.tomTatLenh([], HOM_NAY).length === 0, 'rỗng');
  });
  check('CT (1m) · trangThaiPhieu: Đã xác nhận · Môn a/m · Chưa làm', () => {
    assert(d.trangThaiPhieu({ soMonDaGhi: 4, soMon: 4, daXacNhan: true }).nhan === 'Đã xác nhận', 'đã xác nhận (kể cả đủ môn)');
    const mon = d.trangThaiPhieu({ soMonDaGhi: 3, soMon: 4, daXacNhan: false });
    assert(mon.khoa === 'mon' && mon.nhan === 'Môn 3/4', JSON.stringify(mon));
    const chua = d.trangThaiPhieu({ soMonDaGhi: 0, soMon: 4, daXacNhan: false });
    assert(chua.khoa === 'chua-lam' && chua.nhan === 'Chưa làm', JSON.stringify(chua));
  });
}
