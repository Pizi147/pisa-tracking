/**
 * PHÉP KIỂM PR-Pb — Phân tích (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.3, kiểm kê §1.3 P7–P15).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPhanTichTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Pb · Phân tích');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);

  // ================================================================== Task 1 — luật thuần

  check('PR-Pb · tuDauKhoang: thứ Hai của tuần chứa homNay, lùi (soTuan-1) tuần', () => {
    eq(d.tuDauKhoang('2026-09-23', 8), '2026-08-03', '8 tuần từ 23/09 (thứ Hai tuần đó là 21/09)');
    eq(d.tuDauKhoang('2026-09-21', 1), '2026-09-21', '1 tuần = chính thứ Hai của tuần');
    eq(d.tuDauKhoang('2026-09-23', 4), '2026-08-31', '4 tuần');
  });

  check('PR-Pb · kyNangTheoCt: ba bộ đúng Q7 — không gộp W1/W2 vào W ở Cả hai', () => {
    eq(d.kyNangTheoCt('ft'), ['listening', 'reading', 'writing1', 'writing2', 'speaking'], 'FT');
    eq(d.kyNangTheoCt('thuong'), ['listening', 'reading', 'writing', 'speaking'], 'lớp thường');
    eq(d.kyNangTheoCt('ca-hai'), ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking'], 'Cả hai — hợp, không gộp');
  });

  check('PR-Pb · mucNhiet: đủ 5 mức Q12 (0, N=0, và ba biên 10%/25%/40%)', () => {
    eq(d.mucNhiet(0, 10), 0, 'n=0');
    eq(d.mucNhiet(3, 0), 0, 'N=0');
    eq(d.mucNhiet(1, 20), 1, '5% < 10% → mức 1');
    eq(d.mucNhiet(2, 20), 2, '10% chạm biên (không còn < 10%) → mức 2');
    eq(d.mucNhiet(5, 20), 3, '25% chạm biên (không còn < 25%) → mức 3');
    eq(d.mucNhiet(8, 20), 4, '40% chạm biên (không còn < 40%) → mức 4');
    eq(d.mucNhiet(15, 20), 4, '75% → vẫn mức 4 (mức cao nhất)');
  });

  check('PR-Pb · gocNhinTuThamSo: Q16 — hang-doi/tinh-hinh/ky-nang KHÔNG bị xoá khỏi URL', () => {
    const g = (qs: string) => d.gocNhinTuThamSo(new URLSearchParams(qs));
    eq(g('xem=tuan'), { goc: 'tong-hop', ct: null, boThamSo: ['xem'] }, '?xem=tuan → Tổng hợp, xoá xem');
    eq(g('goc=danh-sach&hang-doi=due'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'goc=danh-sach giữ hang-doi');
    eq(g('hang-doi=review'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có hang-doi cũng vào Danh sách Case');
    eq(g('tinh-hinh=no_plan'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có tinh-hinh cũng vào Danh sách Case');
    eq(g('ky-nang=listening'), { goc: 'danh-sach', ct: null, boThamSo: [] }, 'chỉ có ky-nang cũng vào Danh sách Case');
    eq(g('loai-lop=normal'), { goc: 'tong-hop', ct: 'thuong', boThamSo: ['loai-lop'] }, 'loai-lop=normal → ct=thuong, xoá loai-lop');
    eq(g('loai-lop=ft'), { goc: 'tong-hop', ct: 'ft', boThamSo: ['loai-lop'] }, 'loai-lop=ft → ct=ft');
    eq(g('goc=y-thuc'), { goc: 'y-thuc', ct: null, boThamSo: [] }, 'goc=y-thuc giữ nguyên');
    eq(g(''), { goc: 'tong-hop', ct: null, boThamSo: [] }, 'không tham số → mặc định Tổng hợp');
  });

  check('PR-Pb · nhanDot / khoaDot / thuTuDot: MT1…MT5, Giữa khoá, Cuối khoá đúng thứ tự', () => {
    eq(d.nhanDot('mock', 3), 'MT3', 'FT');
    eq(d.nhanDot('progress', null), 'Giữa khoá', 'lớp thường giữa khoá');
    eq(d.nhanDot('final', null), 'Cuối khoá', 'lớp thường cuối khoá');
    eq(d.khoaDot('mock', 2), 'mt:2', 'khoá MT2');
    eq(d.khoaDot('progress', null), 'giua', 'khoá giữa khoá');
    const khoa = ['cuoi', 'mt:2', 'giua', 'mt:1'];
    eq(khoa.slice().sort((a, b) => d.thuTuDot(a) - d.thuTuDot(b)), ['mt:1', 'mt:2', 'giua', 'cuoi'], 'sắp đúng thứ tự MT1, MT2, Giữa khoá, Cuối khoá');
  });

  check('PR-Pb · bangXuatTongHop: bỏ đúng nhóm cột ẩn, dòng con thụt, dòng Tổng cuối, không lộ khoá kỹ thuật, không ISO', () => {
    const kq = {
      theo: 'tuan', ct: 'ft', cot: ['luot', 'dat', 'kn:listening', 'case'],
      hang: [
        { khoa: 'w1', nhan: 'W3 SEP', phu: '21/09–27/09 · tuần này', o: { luot: 10, dat: 6, 'kn:listening': 2, case: 1 },
          con: [{ khoa: 'w1|c1', nhan: 'FT101', o: { luot: 5, dat: 3, 'kn:listening': 1, case: 1 } }] },
      ],
      tong: { luot: 10, dat: 6, 'kn:listening': 2, case: 1 },
      scopeEmpty: false,
    };
    const day = d.bangXuatTongHop(kq, new Set(['ket-qua']), 'Cả trung tâm · Fast Track · 8 tuần');
    const flat = JSON.stringify(day);
    assert(!flat.includes('kn:'), 'ẩn nhóm ky-nang thì không còn khoá kn: nào trong bảng xuất');
    assert(!/\d{4}-\d{2}-\d{2}/.test(flat), 'không có chuỗi ISO nào trong bảng xuất');
    assert(day[0][0].includes('Tổng hợp Test + SOS'), 'dòng 1 là tiêu đề + mô tả bộ lọc');
    const dongChinh = day.find((r: any[]) => r[0] === 'W3 SEP · 21/09–27/09 · tuần này');
    assert(!!dongChinh, 'dòng chính có nhãn + phụ');
    const dongCon = day.find((r: any[]) => typeof r[0] === 'string' && r[0].startsWith('  FT101'));
    assert(!!dongCon, 'dòng con thụt hai dấu cách');
    const dongTong = day[day.length - 1];
    eq(dongTong[0], 'Cộng 1 tuần', 'dòng Tổng cuối cùng, đúng danh từ theo trục tuần');
    const day2 = d.bangXuatTongHop(kq, new Set(['ket-qua', 'ky-nang', 'xu-ly']), 'x');
    const hangCot = day2[3];
    assert(hangCot.some((x: any) => x === 'L'), 'bật nhóm ky-nang thì cột hiện nhãn ngắn L, không phải kn:listening');
  });
}
