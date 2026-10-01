/**
 * TỪ VỰNG NGHIỆP VỤ DÙNG CHUNG cho API và giao diện.
 *
 * Trước đây tất cả nằm trong MỘT file 1200 dòng, nên câu hỏi "luật này ở đâu" không có câu
 * trả lời ngắn nào. Nay chia đúng theo chín module nghiệp vụ của hệ thống; file này chỉ gom
 * lại để mọi chỗ vẫn `import { X } from '@shared/domain/index.ts'` như cũ.
 *
 *   skills     năm ô nhập của Fast Track, bốn môn của Normal
 *   students   trạng thái học viên, lộ trình học, mốc hành trình
 *   fasttrack  lịch Mock Test, kỳ vọng theo lượt, mức SOS
 *   normal     chương trình FOU/BE/ELE, mốc kiểm tra, chấm theo tỷ lệ
 *   cases      hạng mục case, nhóm nguyên nhân, phương án, phê duyệt, kết quả
 *   worklist   báo cáo đơn vị, loại việc, nhãn thời hạn
 *   people     vai trò, quyền, bộ lọc học viên theo vai
 *   display    luật hiển thị dùng chung: hạn, tiến độ đợt Test, phần trăm, ngày nghiệp vụ
 */
export * from './skills.ts';
export * from './students.ts';
export * from './fasttrack.ts';
export * from './normal.ts';
export * from './cases.ts';
export * from './week.ts';
export * from './worklist.ts';
export * from './people.ts';
export * from './display.ts';
export * from './metrics.ts';
export * from './policy.ts';
export * from './attachments.ts';
export * from './yThuc.ts';
export * from './yThucGon.ts';
export * from './sos.ts';
export * from './sosV4.ts';
export * from './hoSoHocVien.ts';
export * from './hienThiNgay.ts';
export * from './dieuHuong.ts';
export * from './hocVienLop.ts';
export * from './tongQuan.ts';
export * from './nguoiThucHien.ts';
export * from './bangChung.ts';
export * from './chamDiem.ts';
export * from './phanTich.ts';
export * from './duongHoSo.ts';
export * from './hanhTrinh.ts';
export * from './keHoachTest.ts';
export * from './congViec.ts';
export * from './lenLop.ts';
export * from './mauNghia.ts';
export * from './khoPanel.ts';
export * from './chonNgay.ts';
export * from './oNgay.ts';
export * from './khac.ts';
export * from './trangThai.ts';
export * from './banPhim.ts';
export * from './quanLyHocVien.ts';
export * from './loiForm.ts';
export * from './hoanTac.ts';
export * from './nhatKy.ts';
export * from './tenLop.ts';
export * from './phanCong.ts';
export * from './yeuCauDuyet.ts';
export * from './lopThuong.ts';
export * from './lichMt.ts';
export * from './nhapHocVien.ts';
export * from './thaoTacMt.ts';
export * from './nhanXet.ts';
export * from './xuatMt.ts';
export * from './chuyenLop.ts';
export * from './cuoiKhoa.ts';
export * from './hoSoGiaoVien.ts';
export * from './phanTichGv.ts';
