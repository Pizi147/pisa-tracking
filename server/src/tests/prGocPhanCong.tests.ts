/**
 * PHÉP KIỂM PC-GV-C (kế hoạch 2026-10-30-phan-cong-gv.md · PR-C): hàm thuần của góc "Phân công GV" ở Học viên & Lớp — lọc / tìm, Thiếu GV,
 * nhóm bảng lớp, cột môn, hai bảng tổng hợp (một nguồn `demPhanCong`), số "cũ → mới" khi có nháp, kiểm dòng nháp. Dữ liệu = 16 lớp mockup v9.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrGocPhanCongTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPC-GV-C · góc Phân công GV (hàm thuần)');

  /* ---------------------------------------------------------------- dữ liệu mockup v9 (`thiet-ke/v9/phan-cong-gv.html` LOP, GV) */
  const FT = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const LRWS = ['listening', 'reading', 'writing', 'speaking'];
  const TEN: Record<string, string> = {
    dung: 'Mr. Dũng Nguyễn', hang: 'Ms. Thanh Hằng Trần', phong: 'Mr. Phong Đỗ', miguel: 'Mr. Miguel', ha: 'Ms. Hà Hoàng', thea: 'Ms. Gemino Thea',
    yen: 'Ms. Yến Nguyễn', uyen: 'Ms. Uyên Lưu', linh: 'Ms. Linh Nguyễn', anh: 'Ms. Ánh Nguyễn', duy: 'Mr. Duy Anh Nguyễn', lien: 'Ms. Liên Vũ', chau: 'Ms. Châu Nguyễn',
  };
  const ID: Record<string, number> = Object.fromEntries(Object.keys(TEN).map((k, i) => [k, i + 1]));
  const gv = Object.keys(TEN).map((k) => ({ id: ID[k], ten: TEN[k], kyNang: [], nghi: k === 'lien' ? 'nghi' : null }));
  const COT: Record<string, Record<string, string>> = {
    FT: { L: 'listening', R: 'reading', W1: 'writing1', W2: 'writing2', S: 'speaking' },
    FOU: { L: 'listening', R: 'reading', 'G+V': 'writing', P: 'speaking' }, BE: { L: 'listening', R: 'reading', W: 'writing', S: 'speaking' }, PREFOU: {},
  };
  const LOP: [string, string, Record<string, string>][] = [
    ['CP FT 116', 'FT', { L: 'ha', R: 'ha', W1: 'miguel', W2: 'miguel', S: 'thea', CN: 'ha' }], ['CP FT 130', 'FT', { L: 'dung', R: 'hang', W1: 'yen', W2: 'yen', S: 'miguel', CN: 'dung' }],
    ['CP FT 131', 'FT', { L: 'ha', R: 'phong', W1: 'uyen', W2: 'lien', S: 'thea', CN: 'phong' }], ['CP FT 137', 'FT', { L: 'ha', R: 'linh', W1: 'duy', W2: 'duy', S: 'miguel', CN: 'ha' }],
    ['CP FT 138', 'FT', { L: 'phong', R: 'ha', W1: 'yen', W2: 'anh', S: 'thea', CN: 'anh' }], ['CP FT 139', 'FT', { L: 'hang', R: 'hang', W1: 'miguel', W2: 'uyen', S: '', CN: 'hang' }],
    ['CP FT 140', 'FT', { L: 'dung', R: 'ha', W1: 'linh', W2: 'linh', S: 'miguel', CN: 'linh' }], ['CP FT 141', 'FT', { L: 'ha', R: 'dung', W1: 'duy', W2: 'yen', S: 'thea', CN: 'duy' }],
    ['CP FT 142', 'FT', { L: 'phong', R: 'linh', W1: 'anh', W2: 'anh', S: 'miguel', CN: 'phong' }], ['CP RF 01', 'FT', { L: 'uyen', R: 'uyen', W1: '', W2: '', S: 'thea', CN: 'uyen' }],
    ['CP FOU 12', 'FOU', { L: 'anh', R: 'anh', 'G+V': 'anh', P: 'miguel', CN: 'anh' }], ['CP FOU 14', 'FOU', { L: 'yen', R: 'yen', 'G+V': 'yen', P: 'thea', CN: 'yen' }],
    ['CP BE 07', 'BE', { L: 'linh', R: 'linh', W: 'duy', S: 'thea', CN: 'linh' }], ['CP BE 09', 'BE', { L: 'dung', R: 'hang', W: 'hang', S: 'miguel', CN: 'hang' }],
    ['CP PreFOU 03', 'PREFOU', { CN: 'uyen' }], ['CP PreFOU 05', 'PREFOU', { CN: 'ha' }],
  ];
  const lop = LOP.map(([code, ct, o], i) => {
    const kyNang = ct === 'FT' ? FT : ct === 'PREFOU' ? ['tong_hop'] : LRWS;
    const slots = Object.entries(o).filter(([, g]) => g)
      .map(([k, g]) => (k === 'CN' ? { userId: ID[g], skill: null, isCore: true } : { userId: ID[g], skill: COT[ct][k], isCore: false }));
    return { id: 100 + i, code, ct, ft: ct === 'FT', route: null, soHv: 12, tuan: null, kyNang, slots: d.moRongPhanCong(ct, kyNang, slots), phienBan: 'x', cho: [] };
  });
  const lopMa = (ma: string) => lop.find((l) => l.code === ma)!;
  /* mockup `oThieu`: ô môn trống / của người nghỉ + GVCN trống — tính tay: 139 S · 131 W2 · RF 01 W1, W2 = 4 */
  const O_THIEU_MOCKUP = 4;

  /* ---------------------------------------------------------------- C1 */
  check('C1 · docGoc("phan-cong") → góc phan-cong, không lọc phụ; GOC_HOC_VIEN có phan-cong', () => {
    const r = d.docGoc('phan-cong', null);
    assert(r.goc === 'phan-cong' && r.loc === null, JSON.stringify(r));
    assert(d.GOC_HOC_VIEN.includes('phan-cong'), 'GOC_HOC_VIEN');
  });
  check('C1 · locLopPc: tìm "Hà Hoàng" (có / không dấu) giữ đúng 7 lớp có cô; tìm mã lớp; khung thường bỏ FT; dòng ghim (nháp) luôn còn', () => {
    const o = { q: '', khung: 'tat-ca', thieu: false, ghim: new Set<number>() };
    const ha = d.locLopPc(lop, gv, { ...o, q: 'Hà Hoàng' }).map((l: any) => l.code);
    assert(ha.length === 7 && ha.includes('CP PreFOU 05') && !ha.includes('CP FT 130'), ha.join(','));
    assert(d.locLopPc(lop, gv, { ...o, q: 'ha hoang' }).length === 7, 'không dấu');
    assert(d.locLopPc(lop, gv, { ...o, q: 'be 07' }).map((l: any) => l.code).join() === 'CP BE 07', 'mã lớp');
    assert(d.locLopPc(lop, gv, { ...o, khung: 'thuong' }).length === 6, 'khung thường');
    const g = d.locLopPc(lop, gv, { ...o, q: 'be 07', ghim: new Set([lopMa('CP FT 137').id]) }).map((l: any) => l.code);
    assert(g.includes('CP FT 137') && g.includes('CP BE 07') && g.length === 2, g.join(','));
  });
  check(`C1 · oThieuPc dữ liệu mockup = ${O_THIEU_MOCKUP} (ô Chưa có + ô người đã nghỉ); Thiếu GV lọc ra đúng 3 lớp`, () => {
    assert(d.oThieuPc(lop, gv) === O_THIEU_MOCKUP, String(d.oThieuPc(lop, gv)));
    const l = d.locLopPc(lop, gv, { q: '', khung: 'tat-ca', thieu: true, ghim: new Set() }).map((x: any) => x.code).sort();
    assert(l.join() === 'CP FT 131,CP FT 139,CP RF 01', l.join());
  });

  /* ---------------------------------------------------------------- C2 */
  check('C2 · nhomLopPc dữ liệu mockup → FT 10, nhóm FOU 2 · BE 2 · PREFOU 2 đúng thứ tự', () => {
    const n = d.nhomLopPc([...lop].reverse());
    assert(n.ft.length === 10 && n.ft[0].code === 'CP FT 116', n.ft.map((l: any) => l.code).join());
    assert(n.thuong.map((g: any) => `${g.ct}:${g.lop.length}`).join() === 'FOU:2,BE:2,PREFOU:2', JSON.stringify(n.thuong.map((g: any) => g.ct)));
    assert(n.thuong[0].ten === 'Foundation' && n.thuong[2].ten === 'Pre Foundation' && n.thuong[0].lop[0].code === 'CP FOU 12', 'tên + thứ tự trong nhóm');
  });
  check('C2 · cotLop FT = 5 ô, BE = 4 ô + null, Pre FOU = []', () => {
    const ft = d.cotLop(lopMa('CP FT 116'));
    assert(ft.length === 5 && ft.every(Boolean) && ft.map((o: any) => o.nhan).join() === 'L,R,W1,W2,S', ft.map((o: any) => o?.nhan).join());
    const be = d.cotLop(lopMa('CP BE 07'));
    assert(be.length === 5 && be[4] === null && be.slice(0, 4).every(Boolean), JSON.stringify(be));
    assert(d.cotLop(lopMa('CP PreFOU 03')).length === 0, 'Pre FOU');
  });

  /* ---------------------------------------------------------------- C3 */
  check('C3 · hangTongHop mockup: Giảng dạy dòng đầu Tổng lớn nhất, Châu tong 0 có mặt, Tổng 47 / 18; GVCN bỏ Liên Vũ (nghỉ, 0), Tổng 10 / 6', () => {
    const dem = d.demPhanCong(lop);
    const day = d.hangTongHop(dem, gv, 'day', 'tong');
    const max = Math.max(...day.map((r: any) => r.tong));
    assert(day[0].tong === max && day.every((r: any, i: number) => i === 0 || day[i - 1].tong >= r.tong), 'xếp Tổng giảm dần');
    const chau = day.find((r: any) => r.id === ID.chau);
    assert(chau && chau.tong === 0 && day[day.length - 1].id === ID.chau, 'Châu 0 cuối bảng');
    assert(day.reduce((n: number, r: any) => n + r.a, 0) === 47 && day.reduce((n: number, r: any) => n + r.b, 0) === 18, 'Tổng Giảng dạy');
    const cn = d.hangTongHop(dem, gv, 'cn', 'tong');
    assert(!cn.some((r: any) => r.id === ID.lien) && cn.some((r: any) => r.id === ID.chau), 'cn bỏ người nghỉ 0, giữ người trống');
    assert(cn.reduce((n: number, r: any) => n + r.a, 0) === 10 && cn.reduce((n: number, r: any) => n + r.b, 0) === 6, 'Tổng GVCN');
    const ten = d.hangTongHop(dem, gv, 'day', 'ten').map((r: any) => r.ten);
    assert(ten.join() === [...ten].sort((a: string, b: string) => a.localeCompare(b, 'vi')).join(), 'xếp tên');
  });
  check('C3 · nháp đổi L CP FT 137 Hà → Phong: Hà FT 7 → 6, Phong +1 (demPhanCong hai lần: đã lưu / tính cả nháp)', () => {
    const l = lopMa('CP FT 137');
    const nhap = { [l.id]: { ...d.chonCuaLop(l), listening: ID.phong } };
    const cu = d.demPhanCong(lop); const moi = d.demPhanCong(d.lopSauNhap(lop, nhap));
    assert(cu.get(ID.ha).ft === 7 && moi.get(ID.ha).ft === 6, `Hà ${cu.get(ID.ha).ft} → ${moi.get(ID.ha).ft}`);
    assert(moi.get(ID.phong).ft === cu.get(ID.phong).ft + 1, 'Phong +1');
    assert(cu.get(ID.ha).cnFt === moi.get(ID.ha).cnFt, 'GVCN không đổi');
  });

  /* ---------------------------------------------------------------- C4 */
  check('C4 · RF1-web: dòng không nháp có ô người nghỉ — luồng hiển thị không kiểm (chỉ dòng nháp); dòng nháp còn ô nghỉ → lỗi đúng ô W2', () => {
    const l = lopMa('CP FT 131');
    const c = d.chonCuaLop(l);
    const loi = d.kiemDongPc(l, { ...c, listening: ID.dung }, gv);
    assert(loi.length === 1 && loi[0].khoa === 'writing2' && /Đã nghỉ/.test(loi[0].lyDo), JSON.stringify(loi));
    assert(d.kiemDongPc(l, { ...c, writing2: ID.yen }, gv).length === 0, 'đổi ô nghỉ → hết lỗi');
    assert(d.kiemDongPc(l, { ...c, writing2: '' }, gv).length === 0, 'Bỏ trống ô nghỉ → hết lỗi');
  });
  check('C4 · kiemDongPc CP FT 137 đổi L sang Phong, GVCN còn Hà → lỗi gvcn "GVCN phải dạy ít nhất một kỹ năng…"; đổi GVCN sang Phong → hợp lệ', () => {
    const l = lopMa('CP FT 137');
    const c = { ...d.chonCuaLop(l), listening: ID.phong };
    const loi = d.kiemDongPc(l, c, gv);
    assert(loi.length === 1 && loi[0].khoa === 'gvcn' && /^GVCN phải dạy ít nhất một kỹ năng/.test(loi[0].lyDo), JSON.stringify(loi));
    assert(d.kiemDongPc(l, { ...c, gvcn: ID.phong }, gv).length === 0, 'GVCN Phong');
  });
  check('C4 · slotsDongPc: Pre FOU chỉ gửi GVCN; FT gửi GVCN + 5 ô; ô trống không gửi; chonCuaLop ↔ slotsDongPc khớp doiTheoO = []', () => {
    const p = lopMa('CP PreFOU 03');
    assert(JSON.stringify(d.slotsDongPc(p, d.chonCuaLop(p))) === JSON.stringify([{ userId: ID.uyen, skill: null, isCore: true }]), 'Pre FOU');
    const r = lopMa('CP RF 01');
    assert(d.slotsDongPc(r, d.chonCuaLop(r)).length === 4, 'RF 01: GVCN + L R S');
    for (const l of lop) {
      const doi = d.doiTheoO(l.ct, l.kyNang, l.slots, d.moRongPhanCong(l.ct, l.kyNang, d.slotsDongPc(l, d.chonCuaLop(l))));
      assert(doi.length === 0, `${l.code}: ${JSON.stringify(doi)}`);
    }
  });
  check('C6 · rutGonThe: 3 thẻ đầu + thẻ ghim (giữ thứ tự), con = phần gom; nhóm ≤ 3 thẻ không gom', () => {
    const r = d.rutGonThe([1, 2, 3, 4, 5, 6, 7], (x: number) => x === 6);
    assert(r.hien.join() === '1,2,3,6' && r.con === 3, JSON.stringify(r));
    assert(d.rutGonThe([1, 2], () => false).con === 0, 'nhóm nhỏ');
  });
}
