/**
 * PHÉP KIỂM M6 · 6b-3 PILOT-VIEC (kế hoạch `docs/superpowers/plans/2026-10-27-m6-code.md` mục 6b-3, mockup `thiet-ke/v7/panel-pilot.html` khu ②):
 *  · "Xem Case" = view kế TRONG panel việc (ngăn xếp `useXem`), "‹ {việc}" về đúng form — form giữ nguyên (không dựng lại), không "← ‹ Việc" lặp;
 *  · "Xác nhận · việc tiếp ›" một bấm (Xác nhận PA, Xác nhận Case) — chỉ sang việc kế khi máy chủ đã nhận;
 *  · dải "✓ Đã lưu … · Hoàn tác" của việc vừa làm ở đầu việc kế / thẻ "Hết việc" (`choDaiVuaLuu`);
 *  · chữ GV nhập (nội dung PA) qua `ChuDich`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

export async function runPrPilotViecTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const en: any = await import('../../../shared/i18n/en.ts');
  console.log('\nM6 · 6b-3 PILOT-VIEC — Xem Case trong panel việc, Xác nhận · việc tiếp ›, dải Hoàn tác việc trước');

  check('6b-3 · choDaiVuaLuu: dải ở đầu việc KẾ (việc "· việc tiếp ›" đưa tới) hoặc thẻ "Hết việc"; mở việc khác bằng tay → không hiện', () => {
    const v = { tu: 'a', den: 'b' };
    assert(d.choDaiVuaLuu(v, 'b', false) === 'viec', 'việc kế không hiện dải');
    assert(d.choDaiVuaLuu(v, 'c', false) === null, 'việc mở bằng tay vẫn hiện dải của việc khác');
    assert(d.choDaiVuaLuu(v, 'a', false) === null, 'quay lại việc vừa lưu vẫn hiện dải ở đầu');
    assert(d.choDaiVuaLuu(v, 'b', true) === null, 'thẻ Hết việc hiện dải của lần chuyển việc trước');
    assert(d.choDaiVuaLuu({ tu: 'a', den: null }, 'a', true) === 'het', 'việc cuối nhóm: thẻ Hết việc thiếu dải');
    assert(d.choDaiVuaLuu({ tu: 'a', den: null }, 'a', false) === null, 'Xem lại việc vừa lưu vẫn hiện dải');
    assert(d.choDaiVuaLuu({ tu: 'a', den: 'a' }, 'a', false) === 'viec', 'việc kế cùng Case (PA kế) không hiện dải');
    assert(d.choDaiVuaLuu(null, 'a', false) === null && d.choDaiVuaLuu(v, null, false) === null, 'không có gì vẫn hiện');
  });

  check('6b-3 · PanelViec: ngăn xếp view (`useXem`), "Xem Case" = view kế, form việc giữ gắn (ẩn) — không "‹ Việc", không mở Case dưới bối cảnh', () => {
    const pv = docSach('web/src/modules/congViec/PanelViec.tsx');
    const goc = pv.slice(pv.indexOf('export function PanelViec'), pv.indexOf('function PanelMotViec'));
    assert(/useXem\(\{\s*url:\s*p\.xemUrl,\s*dau:\s*\['viec'\]/.test(goc), 'PanelViec không dùng ngăn xếp view của 6b-1');
    /* V19 (critique P1): ở Công việc view Case là mục lịch sử `?panel=case` — Back lùi một view; đóng / đổi việc tính cả các mục đã push. */
    const tab = docSach('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/<PanelViec [^>]*xemUrl/.test(tab), 'Công việc không ghi view Case lên URL (Back rời trang)');
    assert(/navigate\(-1 - soMucPanel\(stLs\)\)/.test(tab), 'đóng panel từ view Case không lùi đủ số mục');
    assert(/next\.delete\('panel'\)/.test(tab.slice(tab.indexOf('const mo = '), tab.indexOf('const dong = '))), 'đổi việc vẫn mở view Case của việc trước');
    assert(/xem\.vao\('case'\)/.test(goc) && /XemCaseViec\.Provider/.test(goc), '"Xem Case" không vào view kế');
    assert(/hidden=\{/.test(goc), 'form việc bị gỡ khi xem Case — chữ / lựa chọn mất');
    assert(/<NganCase[\s\S]*veNguon=\{\{\s*nhan:\s*tenBoEm\(p\.it\),\s*onClick:\s*xem\.lui/.test(goc), '‹ ở view Case không về đúng tên việc (không lặp tên em)');
    assert(/<NganCase caseId=\{caseId\} viecBanDau=\{\{ loai: 'case' \}\}/.test(goc), 'view Case tự nhảy sang Xác nhận Case / Mô tả Case (tuDong)');
    assert(!/nhan: t\('Việc'\)/.test(pv.slice(pv.indexOf('function PanelKetQuaNhanh'))), 'còn nhãn lặp "‹ Việc"');
    assert(!/setMoCase|setViecCase/.test(pv), 'còn mở Case dưới bối cảnh / thay panel bằng Ngăn Case');
  });

  check('6b-3 · Ngăn Case trong Công việc: view việc đầu chuỗi có "Xem Case" (vào view kế), không "‹ {Case}" thay view; lưu xong về Case bằng thay view', () => {
    const ng = docSach('web/src/modules/students/NganCase.tsx');
    assert(/useContext\(XemCaseViec\)/.test(ng), 'Ngăn Case không đọc XemCaseViec');
    assert(/nhan: t\('Xem Case'\), onClick: xemCaseViec, xem: true/.test(ng), 'view việc đầu chuỗi không có "Xem Case"');
    assert(/if \(quayLai\?\.xem\) veCase\(\)/.test(ng), 'lưu xong (xong) đi "Xem Case" — chồng Case lên view việc');
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(/quayLai\?\.xem/.test(kp) && /const lui = quayLai && !quayLai\.xem/.test(kp), 'khung vẽ "Xem Case" thành nút ‹');
    assert(/HienLaiPanel/.test(kp), 'panel việc đang ẩn hỏi "Bỏ chữ?" mà không hiện lại');
  });

  check('6b-3 · "Xác nhận · việc tiếp ›" (Xác nhận PA, Xác nhận Case): gọi việc tiếp SAU khi máy chủ nhận, dải nhận kết quả', () => {
    const cs = docSach('web/src/modules/yThuc/CaseSosControls.tsx');
    for (const ten of ['XacNhanPaPanel', 'XacNhanCasePanel']) {
      const i = cs.indexOf(`export function ${ten}`);
      const f = cs.slice(i, cs.indexOf('\nexport function', i + 10));
      assert(/<NutVaTiep [^>]*chuTiep=\{t\('Xác nhận · việc tiếp ›'\)\}[^>]*tiep=\{tiep\}/.test(f), `${ten}: thiếu nút "Xác nhận · việc tiếp ›"`);
      const sauGui = f.slice(f.search(/await api\.post/));
      assert(/tiep\.lam\(/.test(sauGui), `${ten}: sang việc kế trước khi máy chủ nhận`);
      assert(/<DongTiep tiep=\{tiep\} \/>/.test(f) && /<DongTiep tiep=\{tiep\} chan \/>/.test(f), `${ten}: thiếu "Tiếp: …" (V12 ⑥) ở khối Cần làm / chân 375`);
      /* XM-3: máy chủ chưa có đường đảo Xác nhận PA / Case → dải không được có nút Hoàn tác giả. */
      const xacNhan = sauGui.slice(sauGui.search(/\/xac-nhan/));
      assert(!/hoanTac/.test(xacNhan.slice(0, xacNhan.search(/tiep\.lam\(/))), `${ten}: dải có Hoàn tác giả (chưa có đường đảo máy chủ)`);
    }
    assert(/useState\(!!hoanTac\)/.test(docSach('web/src/ui/KhuonViec.tsx')), 'dải vẽ nút Hoàn tác khi việc không có đường đảo');
    const kv = docSach('web/src/ui/KhuonViec.tsx');
    const nut = kv.slice(kv.indexOf('export function NutVaTiep'), kv.indexOf('export function DongTiep'));
    assert(/tiep && <button[\s\S]*luu\(true\)[\s\S]*chuTiep/.test(nut), 'NutVaTiep không có nút "· việc tiếp ›"');
    assert(/t\('Tiếp: \{x\}'/.test(kv.slice(kv.indexOf('export function DongTiep'))), 'DongTiep không in "Tiếp: …"');
    const tc = docSach('web/src/modules/cases/ThaoTacCase.tsx');
    assert(/chuTiep=\{t\('Thêm PA · việc tiếp ›'\)\}/.test(tc) && /if \(diTiep && tiep\) tiep\.lam\(x\)/.test(tc), 'Thêm PA thiếu "· việc tiếp ›" (chuỗi việc gãy sau dải)');
    const ng = docSach('web/src/modules/students/NganCase.tsx');
    assert(/useContext\(ViecVuaLuu\)/.test(ng) && /cv\?\.bao\(/.test(ng), 'Ngăn Case không báo việc vừa lưu cho dải');
  });

  check('6b-3 · Ghi kết quả gọn: "Lưu · việc tiếp ›" báo dải (có Hoàn tác — đường đảo /followups/:id/hoan-tac), PA qua ChuDich', () => {
    const pv = docSach('web/src/modules/congViec/PanelViec.tsx');
    const kq = pv.slice(pv.indexOf('function PanelKetQuaNhanh'));
    assert(/cv\?\.bao\(/.test(kq) && /hoanTacNhanh\(/.test(kq), 'Lưu · việc tiếp › mất Hoàn tác của việc vừa lưu');
    assert(/<ChuDich chu=\{iv\.description\}/.test(kq), 'nội dung PA (chữ GV) in chuỗi trần');
    const gn = docSach('web/src/modules/cases/GhiNhanh.tsx');
    assert(/export async function hoanTacNhanh/.test(gn) && /hoanTacNhanh\(kq\)/.test(gn), 'Hoàn tác dòng đã lưu không dùng chung một đường');
  });

  check('6b-3 · Công việc: dải việc vừa lưu ở đầu thân việc kế + thẻ Hết việc; Hoàn tác mở lại việc đó', () => {
    const tab = docSach('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/ViecVuaLuu\.Provider/.test(tab) && /choDaiVuaLuu\(/.test(tab), 'trang Công việc không giữ việc vừa lưu');
    assert(/dai: noiDai === 'viec'/.test(tab) && /dai=\{noiDai === 'het'/.test(tab), 'dải không vẽ ở việc kế / thẻ Hết việc');
    const kp = docSach('web/src/ui/KhungPanel.tsx');
    assert(/cvNgoai\?\.dai/.test(kp), 'khung không vẽ dải ở đầu thân');
    for (const k of ['Đã lưu kết quả']) assert(typeof en.EN[k] === 'string', `thiếu bản tiếng Anh: ${k}`);
  });
}
