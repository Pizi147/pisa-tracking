/**
 * TU-b — Hướng dẫn Head tutor (đặc tả Tutor mục 9): chỉ trang Tutor — xem Cần chú ý · ghi nhận xét · tải danh sách · gộp tên gõ tay · thêm / sửa tutor.
 * Hồ sơ cá nhân, Hướng dẫn dùng lại của TVV (như Admin).
 */
import { MAN_HO_SO_TVV } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

export const HD_HT: HuongDan = {
  viec: [
    {
      id: 'ht-chu-y', ten: 'Xem tutor Cần chú ý', khi: 'mỗi tuần',
      buoc: ['Trang <b>Tutor</b> mở sẵn <b>Cần chú ý</b>: tutor có buổi "Không" hoặc đánh giá ≤ 2/5 sau lần nhận xét gần nhất.',
        'Cột <b>Cần chú ý vì</b> nói lý do; bấm số màu cam mở đúng các buổi "Không".'],
      chi: { hd: 'tutor-loc', duong: '/tutor', chu: 'Lọc Cần chú ý ở hàng này.' },
    },
    {
      id: 'ht-nhan-xet', ten: 'Ghi nhận xét về tutor', khi: 'sau khi rà buổi dạy',
      buoc: ['Bấm tên tutor mở panel › khối <b>Nhận xét</b>.',
        'Chọn <b>Kết luận</b> (Ổn · Cần cải thiện · Ngừng hợp tác), ghi ít nhất 10 ký tự, <b>Lưu nhận xét</b> — tutor rời Cần chú ý.',
        'Sửa / xoá nhận xét của mình trong 24 giờ.'],
      chi: { hd: 'tutor-loc', duong: '/tutor', chu: 'Bấm tên một tutor trong bảng bên dưới.' },
    },
    {
      id: 'ht-tai', ten: 'Tải danh sách tutor', khi: 'khi có tutor mới hoặc đổi thông tin',
      buoc: ['<b>Tải danh sách</b>: chọn tệp Excel hoặc dán; cột Tên · SĐT · Nơi dạy · Kỹ năng (bấm <b>Tải mẫu</b>).',
        'Xem trước: <b>Mới</b> · <b>Cập nhật</b> · <b>Lỗi</b>; sửa ô lỗi ngay trong bảng.',
        '<b>Lưu n dòng</b>: lưu mọi dòng hợp lệ; tutor không có trong tệp giữ nguyên.'],
      chi: { hd: 'tutor-tai', duong: '/tutor', chu: 'Mở panel Tải danh sách.' },
    },
    {
      id: 'ht-gop', ten: 'Gộp tên gõ tay', khi: 'khi có dải "tên gõ tay"',
      buoc: ['GV chọn <b>Tutor khác</b> khi tutor chưa có trong danh sách — tên đó hiện ở dải <b>tên gõ tay</b>.',
        '<b>Gộp…</b>: mỗi tên chọn một tutor, hoặc <b>Thêm vào danh sách</b>; nhầm thì bấm <b>Hoàn tác</b> trên thông báo.'],
    },
    {
      id: 'ht-them', ten: 'Thêm, sửa tutor', khi: 'khi cần',
      buoc: ['<b>Thêm tutor</b>: bắt buộc Tên + Kỹ năng; SĐT, Nơi dạy để trống được (hiện <b>Thiếu SĐT</b> / <b>Thiếu nơi dạy</b>).',
        'Panel tutor › <b>Sửa</b> / <b>Bổ sung</b>; <b>Xoá tutor</b> chỉ khi chưa có buổi — đã có buổi thì kết luận <b>Ngừng hợp tác</b>.'],
      chi: { hd: 'tutor-them', duong: '/tutor', chu: 'Thêm một tutor.' },
    },
  ],
  man: [
    {
      id: 'tutor', ten: 'Tutor', duong: ['/tutor'],
      muc: [
        { id: 'ht-tutor-loc', ten: 'Bộ lọc và thời gian',
          buoc: ['<b>Cần chú ý</b> · <b>Đang dạy</b> · <b>Ngừng hợp tác</b> · <b>Thiếu thông tin</b> · <b>Tất cả</b>; lọc Nơi dạy, Kỹ năng, tìm tên / SĐT.',
            'Một <b>Khoảng thời gian</b> như Phân tích (mặc định 2 tuần vừa qua): số buổi, tỉ lệ tính trong khoảng; Cần chú ý tính mọi thời gian.'],
          chi: { hd: 'pt-thoi-gian', duong: '/tutor', chu: 'Đổi khoảng thời gian ở đây.' } },
        { id: 'ht-tutor-panel', ten: 'Panel một tutor',
          buoc: ['5 ô số: bấm để lọc bảng <b>Buổi dạy</b>; nút <b>Chỉ buổi chưa đạt</b>.', 'Mỗi buổi: học viên, lớp, người ghi, 3 dấu ✓ / ✗, đánh giá, nhận xét.'] },
      ],
    },
    ...MAN_HO_SO_TVV.filter((m) => m.id === 'ho-so-ca-nhan' || m.id === 'huong-dan'),
  ],
  luat: [
    { id: 'ht-luat-chu-y', ten: 'Cần chú ý',
      buoc: ['Tutor có ít nhất một buổi có ô "Không" hoặc đánh giá ≤ 2/5, ghi sau nhận xét gần nhất của Head tutor / Quản trị.',
        'Ghi nhận xét → rời nhóm; buổi "Không" mới → vào lại. Kết luận Ngừng hợp tác → không vào.'] },
    { id: 'ht-luat-ty-le', ten: 'Tỉ lệ 3 tiêu chí',
      buoc: ['Số buổi "Có" / số buổi có trả lời ô đó; buổi ghi trước khi có 3 ô không tính.', 'Đánh giá = trung bình các buổi có đánh giá.'] },
    { id: 'ht-luat-quyen', ten: 'Ai thấy gì',
      buoc: ['Head tutor, Quản trị: mọi chi nhánh, sửa được. QL: tutor dạy em chi nhánh mình, chỉ xem.', 'Head tutor không mở hồ sơ học viên, Case, điểm.'] },
  ],
  tu: [
    { ten: 'Tên gõ tay', nghia: 'Tên tutor GV gõ ở "Tutor khác" khi tutor chưa có trong danh sách.' },
    { ten: 'Kết luận', nghia: 'Ổn · Cần cải thiện · Ngừng hợp tác — kết luận mới nhất hiện cạnh tên tutor.' },
  ],
};
