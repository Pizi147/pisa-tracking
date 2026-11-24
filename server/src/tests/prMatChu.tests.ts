/**
 * PHÉP KIỂM MẤT CHỮ (bảng kê ra luật 25/11, mục 2): đọc nguồn khi không kiểm được hành vi (hành vi đã bấm thử bằng Playwright, ảnh trong PR).
 *   MC-1 (C-1)  PanelMeeting: Kết quả / ngày giờ gõ chưa lưu báo `useBaoDangSua` → Đóng panel hỏi "Bỏ chữ đang gõ?"
 *   MC-2 (C-2)  Chờ duyệt mở tại dòng: đổi bộ lọc (`setParam` / `chonLoc`) hỏi `HopBoChu` khi còn ô lý do đang mở / lý do Từ chối nhiều
 *   MC-3 (C-3)  Thẻ Sửa cấp bậc (N70): người gửi có nút Rút trên thẻ (`chiRut` gồm `sua_khai_bac`), máy chủ cho rút (`khiRut`)
 *   MC-4 (E-6)  `Modal` chung có `daSua` (nền / Esc / ✕ / NutDongHop hỏi `HopBoChu`); S Ex, Tạm dừng / Kết thúc, Khôi phục KQ truyền `daSua`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8').replace(/\r\n/g, '\n');

export async function runPrMatChuTests(t: any) {
  const { check, assert } = t;
  console.log('\nMẤT CHỮ (C-1 · C-2 · C-3 · E-6)');
  check('MC-1 · PanelMeeting: chữ Kết quả / ngày giờ chưa lưu → useBaoDangSua', () => {
    const s = doc('web/src/modules/congViec/PanelMeeting.tsx');
    assert(/import \{ KhungPanel, useBaoDangSua \}/.test(s), 'chưa nhập useBaoDangSua');
    assert(/useBaoDangSua\(!!mo && \(kq\.trim\(\) !== \(m\.ketQua \?\? ''\)\.trim\(\)/.test(s), 'chưa báo chữ chưa lưu của Kết quả');
    assert(/ngay !== \(m\.ngayGio\?\.slice\(0, 10\)/.test(s) && /gio !== \(m\.ngayGio\?\.slice\(11, 16\)/.test(s), 'chưa tính ngày / giờ họp');
  });
  check('MC-2 · Chờ duyệt mở tại dòng: đổi bộ lọc có ô lý do đang mở thì hỏi HopBoChu', () => {
    const s = doc('web/src/modules/duyet/HopChoDuyet.tsx');
    assert(/const hoiTruocKhiDoi = \(chay: \(\) => void\) => \{ if \(dangO\.size > 0 \|\| !!lyDoTc\?\.trim\(\)\)/.test(s), 'chưa có cổng hỏi theo dangO / lyDoTc');
    assert(/const setParam = \(k: string, v: string \| null\) => hoiTruocKhiDoi\(/.test(s), 'setParam chưa qua cổng hỏi');
    assert(/const chonLoc = \(x: typeof xem, p: KhoaChip \| null\) => hoiTruocKhiDoi\(/.test(s), 'chonLoc chưa qua cổng hỏi');
    assert(/<HopBoChu[^>]*Bỏ chữ, đổi bộ lọc/.test(s.replace(/\n/g, ' ')), 'chưa vẽ HopBoChu');
  });
  check('MC-3 · Thẻ Sửa cấp bậc N70: người gửi Rút được trên thẻ; máy chủ cho rút', () => {
    const s = doc('web/src/modules/duyet/TheYeuCau.tsx');
    assert(/const chiRut = cho && yc\.nguoiXinId != null && yc\.nguoiXinId === session\?\.user\?\.id && \(yc\.loai === 'xin_xoa' \|\| yc\.loai === 'sua_khai_bac'\)/.test(s), 'chiRut chưa gồm sua_khai_bac (người gửi)');
    assert(/\(nguoiGuiSua \|\| chiRut\) && <button[\s\S]{0,260}?t\('Rút'\)/.test(s), 'nút Rút trên thẻ không đi theo chiRut');
    const y = doc('shared/domain/yeuCauDuyet.ts');
    assert(!/LOAI_NGUOI_XIN_SUA: readonly LoaiYeuCau\[\] = \[[^\]]*sua_khai_bac/.test(y), 'sua_khai_bac không được vào LOAI_NGUOI_XIN_SUA (không có khiSua)');
    assert(/khiRut/.test(doc('server/src/duyet/loaiYeuCau.ts').split("loai: 'sua_khai_bac'")[1] ?? ''), 'máy chủ sua_khai_bac phải có khiRut');
  });
  check('MC-4 · Modal chung: daSua hỏi HopBoChu; ba hộp (S Ex, Tạm dừng / Kết thúc, Khôi phục KQ) truyền daSua', () => {
    const d = doc('web/src/ui/Drawer.tsx');
    assert(/daSua\?: boolean;/.test(d) && /const dong = hoi \? \(\) => \{\} : daSua \? \(\) => setHoi\(true\) : onClose;/.test(d), 'Modal chưa có đường đóng có hỏi');
    assert(/<KhungModal onClose=\{dong\}/.test(d) && /\{hoi && <HopBoChu/.test(d), 'nền / ✕ chưa qua dong có hỏi hoặc chưa vẽ HopBoChu');
    assert(/export function NutDongHop/.test(d), 'thiếu NutDongHop cho nút Đóng ở chân hộp');
    assert(/daSua=\{!busy && \(nhanXet\.trim\(\)/.test(doc('web/src/modules/test/keHoach/HopSEx.tsx')), 'HopSEx chưa truyền daSua');
    assert(/daSua=\{!busy && !!lyDo\.trim\(\)\}/.test(doc('web/src/modules/students/HopTamDungKetThuc.tsx')), 'HopTamDungKetThuc chưa truyền daSua');
    assert(/daSua=\{!!lyDo\.trim\(\)\}/.test(doc('web/src/modules/test/keHoach/HopKhoiPhucKetQua.tsx')), 'HopKhoiPhucKetQua chưa truyền daSua');
  });
}
