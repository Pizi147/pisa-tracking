/**
 * PHÉP KIỂM DON-HINH (`docs/superpowers/plans/2026-10-30-don.md`, PR DON-HINH): hình còn sót.
 * Hàm thuần (`boTenEm`, `gopVangHang`) + soi nguồn theo mẫu prS4f.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boTenEm, gopVangHang } from '../../../shared/domain/index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');

export async function runDonHinhTests(t: any) {
  const { check, assert } = t;
  console.log('\nDON-HINH · hình còn sót');

  check('DON-HINH · chữ phụ tối theo bảng màu D4', () => {
    const css = doc('web/src/index.css');
    assert(/--text-dim-rgb: 186 198 222;/.test(css) && /--text-faint-rgb: 158 172 200;/.test(css), 'token chữ phụ tối chưa đổi');
  });
  check("DON-HINH · tên nhóm cham-cheo = 'Speaking chấm chéo'", () => {
    assert(/key: 'cham-cheo' as never, label: t\('Speaking chấm chéo'\)/.test(doc('web/src/modules/congViec/DanhSachViec.tsx')), 'nhãn nhóm sai');
  });
  check('DON-HINH · boTenEm bỏ tên em ở mọi vị trí, không để chuỗi rỗng', () => {
    assert(!boTenEm('Nhắc Ánh nộp bài · Ánh', 'Ánh').includes('Ánh'), 'còn tên em');
    assert(boTenEm('Nhắc Ánh nộp bài · Ánh', 'Ánh') === 'Nhắc nộp bài', 'khoảng trắng / dấu · thừa');
    assert(boTenEm('Xác nhận Case R · Ánh · W2 SEP', 'Ánh') === 'Xác nhận Case R · W2 SEP', 'giữa chuỗi');
    assert(boTenEm('Ánh', 'Ánh') === 'Ánh' && boTenEm('Ghi kết quả', null) === 'Ghi kết quả', 'rỗng / không tên');
  });
  check('DON-HINH · gopVangHang: mọi ô cùng tuần → 1 chữ; khác tuần, thiếu ô, một ô → null', () => {
    assert(gopVangHang(['vắng W2 SEP', 'vắng W2 SEP', 'vắng W2 SEP']) === 'vắng W2 SEP', 'cùng tuần');
    assert(gopVangHang(['vắng W2 SEP', 'vắng W3 SEP']) === null && gopVangHang(['vắng W2 SEP', null]) === null, 'khác tuần');
    assert(gopVangHang(['vắng W2 SEP']) === null && gopVangHang([]) === null && gopVangHang([null, null]) === null, 'một ô / rỗng');
  });
  check('DON-HINH · QL mặc định "Của tôi", nhớ trong phiên; link tổng hợp ghi nguoi=tat-ca; việc mở từ link tìm cả danh sách', () => {
    const s = doc('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/nguoiDaNho\(uid\) \?\? 'toi'/.test(s) && /sessionStorage\.setItem\(khoaNguoi/.test(s), 'chưa có mặc định / nhớ phiên');
    assert(/phang\(dsGoc\)\.find\(\(y\) => y\.key === viec\)/.test(s), 'việc ngoài "Của tôi" không mở được');
    for (const m of doc('server/src/worklist/tongQuan.ts').matchAll(/`\/cong-viec\?[^`]*`/g)) assert(m[0].includes('nguoi=tat-ca'), `link thiếu nguoi=tat-ca: ${m[0]}`);
  });
  check('DON-HINH · Nhập điểm lớp 375 một thanh chip; Ý thức một kiểu nhãn; Tài khoản chip 0 không bấm', () => {
    assert(/chonMon && b && !motKyNang && <ChonMon/.test(doc('web/src/modules/cham/DiemTheoLop.tsx')), 'hai thanh chip');
    assert(!/NhanTrangThai/.test(doc('web/src/modules/phanTich/YThucPhoiHop.tsx')), 'Ý thức còn kiểu nhãn thứ hai');
    assert(/disabled=\{!phanLoai\[k\]/.test(doc('web/src/modules/platform/AccountsAdmin.tsx')), 'chip 0 còn bấm được');
  });
  check('CV-0611 · dòng việc gọn: tên "{mã lớp} · {việc}" (không "Cả lớp"), Xét lại lộ trình không liệt kê tên em, "›" chỉ khi dòng chưa có nút', () => {
    const s = doc('web/src/modules/congViec/DanhSachViec.tsx');
    assert(!/Cả lớp \{lop\}/.test(s) && /<b className="font-semibold">\{it\.classCode\}<\/b> · /.test(s), 'tên dòng cả lớp còn "Cả lớp"');
    assert(/it\.group === 'xet_lai_lo_trinh' \? null/.test(s), 'Xét lại lộ trình còn thẻ tên em');
    assert(/\$\{nut \? 'sm:hidden' : ''\}/.test(s) && /\u00A0/.test(s), '"›" chưa ẩn khi có nút / chưa dính chữ');
  });
  check('CV-0611 · Bổ sung hồ sơ thiếu mở TẠI CHỖ (panel Sửa thông tin từng em, "Lưu · em tiếp ›"), không đổi trang', () => {
    const pv = doc('web/src/modules/congViec/PanelViec.tsx');
    assert(/case 'bo_sung_ho_so': return !!it\.emIds\?\.length/.test(pv) && /<PanelBoSungHoSo key=\{it\.key\}/.test(pv), 'lamTaiCho / panel chưa nối');
    const sm = doc('web/src/modules/students/StudentManagePanel.tsx');
    assert(/tiep\?\.conLai \? t\('Lưu · em tiếp ›'\)/.test(sm) && /document\.getElementById\(lf\.oId\(khoa\)\)\?\.focus\(\)/.test(sm), 'nút em tiếp / con trỏ ô thiếu');
  });
}
