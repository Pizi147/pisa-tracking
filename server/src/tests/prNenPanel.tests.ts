/**
 * PHÉP KIỂM V5 · NEN-PANEL (`08` mục 6 dòng NEN-PANEL, K12; T15, T16, T21) — khung panel chung:
 *  · nháp theo khoá việc: ghi / đọc / bỏ theo đúng việc, kho hỏng không ném (T15, T16);
 *  · đổi việc / ✕ khi còn chữ → hộp "Bỏ chữ đang gõ?" trong panel (không `window.confirm`), Ở lại = nút chính (T16);
 *  · "Lưu và tiếp" chỉ sang việc kế sau khi lưu xong; lỗi → ở lại (07 mục 4.4);
 *  · chân lưu một bộ chữ: Chưa lưu / Đang lưu… / Đã lưu HH:MM / Không lưu được — Chữ đang gõ vẫn giữ (T15);
 *  · 375 + bàn phím: `visualViewport` → `--ban-phim`, chân dính trên bàn phím, thanh dưới ẩn (T21).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

/** Kho giả theo giao diện `Storage` (thứ tự khoá như trình duyệt: theo lúc thêm). */
function khoGia(hong = false) {
  const m = new Map<string, string>();
  return {
    m,
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => { if (hong) throw new Error('SecurityError'); return m.get(k) ?? null; },
    setItem: (k: string, v: string) => { if (hong) throw new Error('QuotaExceededError'); m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
}

export async function runPrNenPanelTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nV5 · NEN-PANEL — nháp theo việc, hộp bỏ chữ, Lưu và tiếp, chân lưu, 375 + bàn phím');

  check('NEN-PANEL T16 · nháp theo khoá việc: ghi rồi đọc lại đúng ô; việc khác không thấy; về giá trị đầu = xoá khoá', () => {
    const k = khoGia();
    d.ghiNhap(k, 'phoi_hop:12', 'ghi-chu', 'Đã gọi mẹ em Yến', false);
    d.ghiNhap(k, 'phoi_hop:12', 'kq', 'da-bao', false);
    assert(d.docNhap(k, 'phoi_hop:12', 'ghi-chu') === 'Đã gọi mẹ em Yến', 'đọc lại nháp');
    assert(d.docNhap(k, 'phoi_hop:1', 'ghi-chu') === undefined, 'khoá việc "phoi_hop:1" không được thấy nháp của "phoi_hop:12"');
    d.ghiNhap(k, 'phoi_hop:12', 'kq', 'da-bao', true);
    assert(d.docNhap(k, 'phoi_hop:12', 'kq') === undefined && k.m.size === 1, 'ô về giá trị đầu phải xoá khoá');
  });

  check('NEN-PANEL T15/T16 · lưu xong / Bỏ chữ: xoá MỌI ô của đúng việc, giữ nháp việc khác (cả khoá có tiền tố trùng)', () => {
    const k = khoGia();
    d.ghiNhap(k, 'mgmt:5', 'a', 'x', false); d.ghiNhap(k, 'mgmt:5', 'b', { n: 1 }, false);
    d.ghiNhap(k, 'mgmt:50', 'a', 'y', false); k.m.set('khac', '1');
    d.xoaNhapViec(k, 'mgmt:5');
    assert(d.docNhap(k, 'mgmt:5', 'a') === undefined && d.docNhap(k, 'mgmt:5', 'b') === undefined, 'nháp mgmt:5 còn');
    assert(d.docNhap(k, 'mgmt:50', 'a') === 'y' && k.m.get('khac') === '1', 'xoá lan sang việc / khoá khác');
  });

  check('NEN-PANEL T15 · kho hỏng (riêng tư / đầy) hoặc chữ hỏng: không ném — gõ / lưu không bị chặn', () => {
    const h = khoGia(true);
    d.ghiNhap(h, 'v', 'o', 'chữ', false);
    assert(d.docNhap(h, 'v', 'o') === undefined, 'kho hỏng phải trả undefined');
    d.xoaNhapViec(null, 'v'); d.ghiNhap(null, 'v', 'o', 'x', false);
    const k = khoGia(); k.m.set('pisa-nhap:v\u0001o', '{hỏng');
    assert(d.docNhap(k, 'v', 'o') === undefined, 'JSON hỏng phải bỏ qua');
  });

  check('NEN-PANEL rà #530 · chủ nháp đổi (đăng xuất / đổi tài khoản / đổi góc nhìn / người khác đăng nhập) → xoá MỌI nháp; cùng chủ → giữ', () => {
    const k = khoGia();
    d.datChuNhap(k, '7|');
    d.ghiNhap(k, 'phoi_hop:12', 'ghi-chu', 'chữ của cô Hà', false);
    d.datChuNhap(k, '7|');
    assert(d.docNhap(k, 'phoi_hop:12', 'ghi-chu') === 'chữ của cô Hà', 'cùng người + góc nhìn (tải lại trang) phải giữ nháp');
    k.m.set('pisa-giao-dien', 'light');
    d.datChuNhap(k, '9|');
    assert(d.docNhap(k, 'phoi_hop:12', 'ghi-chu') === undefined, 'người khác vào cùng thẻ vẫn thấy nháp của người trước');
    assert(k.m.get('pisa-giao-dien') === 'light', 'xoá lan sang khoá không phải nháp');
    d.ghiNhap(k, 'v', 'o', 'x', false); d.datChuNhap(k, '9|qlcn');
    assert(d.docNhap(k, 'v', 'o') === undefined, 'đổi góc nhìn phải xoá nháp');
    d.ghiNhap(k, 'v', 'o', 'x', false); d.datChuNhap(k, 'khach');
    assert(d.docNhap(k, 'v', 'o') === undefined, 'đăng xuất phải xoá nháp');
    d.datChuNhap(khoGia(true), 'x'); d.datChuNhap(null, 'x');
    const ss = docSach('web/src/lib/session.tsx');
    assert(/if \(session && !session\.loiKetNoi\) datChuNhap\(khoPhien\(\), session\.authenticated \? `\$\{session\.user\?\.id\}\|\$\{session\.gocNhin\?\.dangChon \?\? ''\}` : 'khach'\)/.test(ss),
      'session.tsx phải đặt chủ nháp = người + góc nhìn khi phiên đã tải (không khi lỗi mạng — mất mạng không được xoá chữ)');
  });

  check('NEN-PANEL rà #530 · đang lưu: ô nháp chỉ đọc (chữ gõ thêm lúc gửi không bị xoaNhap xoá); bàn phím chỉ đo ở panel ngoài cùng; 375 toàn màn', () => {
    for (const [f, re] of [['web/src/modules/cases/GhiNhanh.tsx', /value=\{note\} readOnly=\{busy\}/], ['web/src/modules/cases/CapNhatTuan.tsx', /value=\{progress\} readOnly=\{busy\}/],
      ['web/src/modules/yThuc/XacNhanXuLyPanel.tsx', /value=\{moTa\} readOnly=\{busy\}/], ['web/src/modules/yThuc/LoYThucPanel.tsx', /value=\{moTa\} readOnly=\{busy\}/],
      ['web/src/modules/yThuc/CaseSosControls.tsx', /value=\{moTa\} disabled=\{busy\}[\s\S]*value=\{nx\} disabled=\{busy\}/]] as const) {
      assert(re.test(docSach(f)), `${f}: ô nháp chưa khoá khi đang lưu`);
    }
    assert(/chon=\{outcome === x\} disabled=\{busy\}/.test(docSach('web/src/modules/cases/GhiNhanh.tsx')), 'GhiNhanh: chip Tiến triển chưa khoá khi đang lưu');
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(/useBanPhim\(!trongKhung\)/.test(kp) && /if \(!bat \|\| !vv\) return undefined;/.test(kp), 'useBanPhim phải chỉ chạy ở panel ngoài cùng');
    assert(/max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0/.test(kp), 'panel tại chỗ ở 375 chưa toàn màn');
  });

  await t.checkAsync('NEN-PANEL · "Lưu và tiếp": chỉ sang việc kế sau khi lưu xong; lưu lỗi / còn thiếu → ở lại', async () => {
    const { luuRoiTiep } = d;
    let sang = 0;
    await luuRoiTiep(async () => true, () => { sang++; });
    await luuRoiTiep(async () => false, () => { sang++; });
    await luuRoiTiep(async () => { throw new Error('mất mạng'); }, () => { sang++; }).catch(() => undefined);
    assert(sang === 1, `sang việc kế ${sang} lần (phải 1: chỉ lần lưu được)`);
    assert(/luuRoiTiep\(luu, onTiep\)/.test(docSach('web/src/modules/cases/GhiNhanh.tsx')), 'GhiNhanh: Lưu và tiếp phải qua luuRoiTiep');
  });

  check('NEN-PANEL T16 · đổi việc / ✕ khi còn chữ: hộp trong panel (Ở lại nhận focus), không window.confirm; Công việc đi qua boChuRoi', () => {
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(!/window\.confirm/.test(kp), 'KhungPanel còn window.confirm');
    assert(/t\('Bỏ chữ đang gõ\?'\)/.test(kp) && /ref=\{oLai\}[^>]*btn-primary[^>]*>\{t\('Ở lại'\)\}/.test(kp) && /oLai\.current\?\.focus\(\)/.test(kp), 'hộp Bỏ chữ: Ở lại nút chính + focus');
    assert(/const boChu = \(\) => \{[^}]*nhap\?\.xoa\(\)/.test(kp) && /xoaNhapViec\(khoNhap\(\), khoa\)/.test(kp), 'Bỏ chữ phải xoá nháp của việc');
    const cv = docSach('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(!/window\.confirm/.test(cv) && (cv.match(/boChuRoi\(/g) ?? []).length >= 4, 'Công việc: đổi việc / ‹ Công việc / việc vừa xong / mở việc khác phải qua boChuRoi');
    assert(/<NhapViec khoa=\{p\.it\.key\}>/.test(docSach('web/src/modules/congViec/PanelViec.tsx')), 'PanelViec phải đặt khoá nháp = khoá việc');
  });

  check('NEN-PANEL K12 · ô chữ của panel Công việc giữ nháp (useNhap) và bỏ nháp khi lưu xong (useXoaNhap)', () => {
    for (const f of ['web/src/modules/cases/GhiNhanh.tsx', 'web/src/modules/cases/CapNhatTuan.tsx', 'web/src/modules/yThuc/XacNhanXuLyPanel.tsx',
      'web/src/modules/yThuc/LoYThucPanel.tsx', 'web/src/modules/yThuc/CaseSosControls.tsx']) {
      const s = docSach(f);
      assert(/useNhap\(/.test(s) && /xoaNhap\(\)/.test(s), `${f}: thiếu useNhap / xoaNhap()`);
    }
  });

  check('NEN-PANEL T15 · chân lưu một bộ chữ + ký hiệu; SaveIndicator dùng cùng ChuLuu', () => {
    const kv = docSach('web/src/ui/KhuonViec.tsx');
    for (const c of ["t('Chưa lưu')", "t('Đang lưu…')", "t('Đã lưu')", "t('Không lưu được')", "t('Chữ đang gõ vẫn giữ.')"]) assert(kv.includes(c), `ChuLuu thiếu ${c}`);
    assert(/<ChuLuu tt=/.test(docSach('web/src/ui/SaveState.tsx')), 'SaveIndicator chưa dùng ChuLuu');
    assert(!/function TrangThaiLuu/.test(docSach('web/src/modules/yThuc/CaseSosControls.tsx')), 'CaseSosControls còn bản TrangThaiLuu riêng');
  });

  check('NEN-PANEL T21 · 375 + bàn phím: visualViewport → --ban-phim; panel phủ co lên; chân dính trên bàn phím; thanh dưới ẩn', () => {
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(/window\.visualViewport/.test(kp) && /setProperty\('--ban-phim'/.test(kp) && /bottom: 'var\(--ban-phim, 0px\)'/.test(kp), 'panel phủ chưa co theo bàn phím');
    const css = docSach('web/src/index.css');
    assert(/html\[data-ban-phim\] \.chan-dinh-375 \{ bottom: calc\(var\(--ban-phim\) - 80px\); \}/.test(css), 'chân tại chỗ chưa dính trên bàn phím');
    assert(/html\[data-ban-phim\] \[data-thanh-duoi\] \{ display: none; \}/.test(css) && /<nav data-thanh-duoi/.test(docSach('web/src/App.tsx')), 'thanh dưới chưa ẩn khi bàn phím mở');
  });

  check('NEN-PANEL · dòng loại (vạch hồng): panel việc mặc định "VIỆC"; panel số không dòng làm được = "BÁO CÁO · CHỈ ĐỌC"', () => {
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(/loai === undefined \? \(cvNgoai\?\.loai \?\? \(dau \? t\('VIỆC'\) : null\)\) : loai/.test(kp) && /bg-\[color:var\(--hong\)\]/.test(kp), 'dòng loại');
    assert(/t\('BÁO CÁO · CHỈ ĐỌC'\)/.test(docSach('web/src/ui/SoLieu.tsx')), 'SoLieu chưa đặt loại báo cáo');
  });
}
