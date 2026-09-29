/** PHÉP KIỂM PR-XUAT — xuất Excel kết quả Test (T40, K4-35, K5-35, YC-13.9). Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrXuatTests(t: YThucTestKit) {
  const { check, checkAsync, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-XUAT · Xuất Excel kết quả Mock Test');

  // ------------------------------------------------------------------ khối 1: luật thuần
  check('PR-XUAT (1) · docBoLocXuatMt: câu lỗi tiếng Việt cho mọi tham số sai; bộ lọc sạch (bỏ trùng) cho mỗi kiểu thời gian', () => {
    const tuan = { tg: 'tuan', tu: '2026-09-07', den: '2026-09-28' };
    const sai = (o: Record<string, unknown>, re: RegExp) => {
      const r = d.docBoLocXuatMt(o);
      assert(typeof r === 'string' && re.test(r), `${JSON.stringify(o)} → ${JSON.stringify(r)}`);
    };
    sai({ tg: 'tuan', tu: '2026-09-28', den: '2026-09-07' }, /trước hoặc bằng/);
    sai({ tg: 'tuan', tu: '2026-09-08', den: '2026-09-28' }, /thứ Hai/);           // thứ Ba
    sai({ tg: 'tuan', tu: '2026-02-30', den: '2026-09-28' }, /thứ Hai/);           // ngày không tồn tại
    sai({ tg: 'thang', tu: '2026-13', den: '2026-12' }, /YYYY-MM/);
    sai({ tg: 'tuan', tu: '2026-01-05', den: '2028-01-10' }, /104 tuần/);           // 105 tuần
    sai({ tg: 'thang', tu: '2026-01', den: '2028-01' }, /24 tháng/);
    sai({ tg: 'dot', dot: 'mt:9' }, /MT1 đến MT8/);
    sai({ tg: 'dot', dot: 'giua' }, /MT1 đến MT8/);                                // giữa khoá ở khung FT
    sai({ tg: 'dot', dot: 'mt:1', khung: 'thuong' }, /Giữa khoá và Cuối khoá/);
    sai({ tg: 'dot', dot: '' }, /ít nhất một đợt/);
    sai({ ...tuan, chiNhanh: 'abc' }, /Chi nhánh không hợp lệ/);
    sai({ ...tuan, lop: '-1' }, /Lớp không hợp lệ/);
    sai({ ...tuan, chiNhanh: Array.from({ length: 51 }, (_, i) => i + 1).join(',') }, /tối đa 50/);
    sai({ ...tuan, khung: 'x' }, /Khung/);
    sai({ ...tuan, cot: 'x' }, /Cột/);
    sai({}, /cách lọc thời gian/);

    const a = d.docBoLocXuatMt({ ...tuan, chiNhanh: '1,2,2', lop: [3, '3', 4], du: '1', cot: 'day-du' });
    assert(typeof a !== 'string' && a.chiNhanh.join() === '1,2' && a.lop.join() === '3,4' && a.chiDuDiem && a.cot === 'day-du'
      && a.khung === 'ft' && a.thoiGian.kieu === 'tuan', JSON.stringify(a));
    const b = d.docBoLocXuatMt({ tg: 'thang', tu: '2026-09', den: '2026-11' });
    assert(typeof b !== 'string' && b.thoiGian.kieu === 'thang' && !b.chiDuDiem && b.cot === 'gon', JSON.stringify(b));
    const c = d.docBoLocXuatMt({ tg: 'dot', dot: ['mt:1', 'mt:3', 'mt:1'] });
    assert(typeof c !== 'string' && c.thoiGian.kieu === 'dot' && c.thoiGian.dot.join() === 'mt:1,mt:3', JSON.stringify(c));
    const th = d.docBoLocXuatMt({ khung: 'thuong', tg: 'dot', dot: 'giua,cuoi' });
    assert(typeof th !== 'string' && th.khung === 'thuong', JSON.stringify(th));
    // bodyXuatMt → docBoLocXuatMt và queryXuatMt → docBoLocXuatMt trả lại đúng bộ lọc (web gửi, máy chủ đọc)
    const f = a as import('../../../shared/domain/xuatMt.ts').BoLocXuatMt;
    assert(JSON.stringify(d.docBoLocXuatMt(d.bodyXuatMt(f))) === JSON.stringify(f), 'vòng body');
    assert(JSON.stringify(d.docBoLocXuatMt(Object.fromEntries(new URLSearchParams(d.queryXuatMt(f))))) === JSON.stringify(f), 'vòng query');
  });

  const dong = (o: Partial<import('../../../shared/domain/xuatMt.ts').DongFT> = {}): import('../../../shared/domain/xuatMt.ts').DongFT => ({
    ma: 'PISA-000001', ten: 'Nguyễn Minh An', chiNhanh: 'Monbay', lop: 'MB FT 101', loTrinh: 'Lộ trình A', mt: 3, tuan: 'W3 SEP 2026', tuanBd: '2026-09-14',
    l: 6, r: 6.5, w: null, s: null, overall: null, target: 7, kyVong: 6.5, sos: 2, trangThai: 'Thiếu điểm 2/4 · SOS tạm thời',
    w1: null, w2: null, tieuChi: { writing1: [null, null, null, null], writing2: [null, null, null, null], speaking: [null, null, null, null] },
    tuanKn: { listening: 'W3 SEP 2026', reading: 'W3 SEP 2026', writing: null, speaking: null }, nguoiNhap: 'Trần Ngọc Hà', ...o,
  });

  check('PR-XUAT (1) · bangFT: 16 cột gọn đúng thứ tự T40; đầy đủ = 16 + COT_FT_THEM, 16 cột đầu không đổi', () => {
    const gon = d.bangFT([dong()], 'gon');
    assert(gon[0].join('|') === 'Mã|Tên|Chi nhánh|Lớp|Lộ trình|MT|Tuần|L|R|W|S|Overall|Target|Kỳ vọng|SOS|Trạng thái lượt', gon[0].join('|'));
    assert(gon[0].length === 16 && gon[1].length === 16 && gon[1][5] === 'MT3', 'gọn 16 cột, MT là chữ MT3');
    const day = d.bangFT([dong()], 'day-du');
    assert(day[0].length === 16 + d.COT_FT_THEM.length && day[1].length === day[0].length, `đầy đủ ${day[0].length} cột`);
    assert(day[0].slice(0, 16).join() === gon[0].join() && day[1].slice(0, 16).join() === gon[1].join(), '16 cột đầu giữ vị trí');
    assert(day[0].includes('W2 TR') && day[0].includes('W1 TA') && day[0].includes('S FC') && day[0].at(-1) === 'Người nhập', 'tiêu chí T39');
  });

  check('PR-XUAT (1) · ô thiếu là null (không "—", không ""); điểm là number; KCK → Target "KCK", Kỳ vọng/SOS null', () => {
    const [, r] = d.bangFT([dong()], 'gon');
    assert(r[9] === null && r[10] === null && r[11] === null, `W/S/Overall thiếu phải null: ${JSON.stringify(r.slice(9, 12))}`);
    assert(typeof r[7] === 'number' && typeof r[8] === 'number' && r[7] === 6, 'L, R là số');
    assert(!r.some((x) => x === '—' || x === ''), 'không ô nào là "—" hay ""');
    const kck = d.bangFT([dong({ target: 'KCK', kyVong: null, sos: null })], 'gon')[1];
    assert(kck[12] === 'KCK' && kck[13] === null && kck[14] === null, JSON.stringify(kck.slice(12, 15)));
    const day = d.bangFT([dong()], 'day-du')[1];
    assert(day.slice(16).every((x) => x === null || typeof x === 'string' || typeof x === 'number'), 'đầy đủ chỉ chữ/số/null');
  });

  check('PR-XUAT (1) · trangThaiLuotXuat: đủ · thiếu · chưa có · lịch sử + thiếu · huỷ phần + tạm thời (KCK bỏ "SOS tạm thời")', () => {
    const b = { coDiem: 4, yeuCau: 4, du: true, lichSu: false, huyPhan: false, tamThoi: false, kck: false };
    assert(d.trangThaiLuotXuat(b) === 'Đủ điểm', 'đủ');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false }) === 'Thiếu điểm 2/4', 'thiếu');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 0, du: false }) === 'Chưa có điểm', 'chưa có');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false, lichSu: true }) === 'Thiếu điểm 2/4 · lịch sử', 'lịch sử');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 3, yeuCau: 3, du: false, huyPhan: true, tamThoi: true }) === 'Thiếu điểm 3/3 · đã huỷ phần còn lại · SOS tạm thời', 'huỷ phần');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false, tamThoi: true, kck: true }) === 'Thiếu điểm 2/4 · không cam kết', 'KCK');
  });

  check('PR-XUAT (1) · tenTepXuatMt chỉ [A-Za-z0-9_.-]; bỏ dấu; > 3 chi nhánh → "4-chi-nhanh"; không chọn → "tat-ca"; đợt liền → MT1-MT3', () => {
    const tg = { kieu: 'tuan' as const, tu: '2026-09-07', den: '2026-09-28' };
    const a = d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: ['Cầu Giấy'], lopMa: [], thoiGian: tg });
    assert(a === 'Pisa-Tracking_MT_Cau-Giay_W2SEP-W1OCT.xlsx', a);   // 28/09/2026: thứ Năm của tuần đó là 01/10 → W1 OCT
    assert(/^[A-Za-z0-9_.-]+$/.test(a), 'ASCII');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: ['a', 'b', 'c', 'd'], lopMa: [], thoiGian: tg }).includes('_4-chi-nhanh_'), '4 chi nhánh');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: [], thoiGian: tg }).includes('_tat-ca_'), 'tất cả');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: ['MB FT 101'], thoiGian: { kieu: 'dot', dot: ['mt:3', 'mt:1', 'mt:2'] } })
      === 'Pisa-Tracking_MT_MB-FT-101_MT1-MT3.xlsx', 'lớp + đợt');
    assert(d.tenTepXuatMt({ khung: 'thuong', chiNhanhTen: [], lopMa: [], thoiGian: { kieu: 'dot', dot: ['giua', 'cuoi'] } })
      === 'Pisa-Tracking_Test-lop-thuong_tat-ca_Giua-khoa-Cuoi-khoa.xlsx', 'lớp thường');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: [], thoiGian: { kieu: 'thang', tu: '2026-09', den: '2026-11' } })
      .endsWith('_2026-09-den-2026-11.xlsx'), 'tháng');
  });

  check('PR-XUAT (1) · dongXemTruoc theo mẫu M11; bangBoLoc + moTaBoLoc: đủ mục, lớp thường không nhắc SOS/Overall (T58)', () => {
    const x = d.dongXemTruoc(dong(), '2026-09-29');
    assert(x === 'PISA-000001 Nguyễn Minh An · MB FT 101 · MT3 · W3 SEP · L 6.0 · R 6.5 · W — · S — · SOS 2 tạm thời', x);
    const f = d.docBoLocXuatMt({ tg: 'tuan', tu: '2026-09-07', den: '2026-09-28', cot: 'day-du' }) as import('../../../shared/domain/xuatMt.ts').BoLocXuatMt;
    const moTa = d.moTaBoLoc(f, { chiNhanh: ['Monbay'], lop: [] });
    const bl = d.bangBoLoc({ khung: 'ft', nguoiXuat: 'Nguyễn Khánh Vy', luc: '2026-09-29T03:05:00.000Z', moTa, soLuot: 312 });
    const chu = bl.map((r) => r.join(' | ')).join('\n');
    assert(bl[0].join() === 'Mục,Giá trị' && chu.includes('Lúc | 29/09/2026 10:05'), chu);
    assert(/Chi nhánh \| Monbay/.test(chu) && /Lớp \| Mọi lớp trong phạm vi/.test(chu) && /Thời gian \| Theo tuần: W2 SEP 2026 – W1 OCT 2026/.test(chu)
      && /Lượt \| Mọi lượt/.test(chu) && /Cột \| Cột đầy đủ/.test(chu) && /Số lượt \| 312/.test(chu), chu);
    assert(/tuần sớm nhất/.test(chu) && /SOS: 0 = đạt kỳ vọng/.test(chu) && /Ô trống = chưa có điểm/.test(chu), 'cách đọc FT');
    assert(bl.find((r) => r[0] === 'Số lượt')![1] === 312, 'số lượt là số');
    const th = d.bangBoLoc({ khung: 'thuong', nguoiXuat: 'A', luc: '2026-09-29T03:05:00.000Z', moTa, soLuot: 1 }).map((r) => r.join(' ')).join('\n');
    assert(!/SOS|Overall/.test(th), 'lớp thường không có chữ SOS/Overall');
  });

  await checkAsync('PR-XUAT (1) · Excel mở đúng dấu: dựng sổ bằng xlsx ở Node → đọc lại — tên sheet có dấu, ô chữ, ô số, ô thiếu không tồn tại', async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d.bangFT([dong()], 'gon')), 'Mock Test');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d.bangBoLoc({
      khung: 'ft', nguoiXuat: 'Nguyễn Khánh Vy', luc: '2026-09-29T03:05:00.000Z', moTa: [], soLuot: 1,
    })), 'Bộ lọc đã dùng');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const doc = XLSX.read(buf);
    assert(doc.SheetNames.join() === 'Mock Test,Bộ lọc đã dùng', doc.SheetNames.join());
    const ws = doc.Sheets['Mock Test'];
    assert(ws['B2'].v === 'Nguyễn Minh An' && ws['B2'].t === 's', 'ô tên giữ dấu');
    assert(ws['H2'].t === 'n' && ws['H2'].v === 6 && ws['I2'].t === 'n', 'điểm L, R là ô số');
    assert(ws['J2'] === undefined && ws['K2'] === undefined && ws['L2'] === undefined, 'W/S/Overall thiếu → không có ô (không phải chuỗi rỗng)');
    assert(doc.Sheets['Bộ lọc đã dùng']['B2'].v === 'Nguyễn Khánh Vy', 'sheet Bộ lọc giữ dấu');
  });
}
