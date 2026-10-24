/**
 * Hướng dẫn Head tutor. AN-TUTOR (chủ SP 22/10): trang Tutor ẩn khỏi web — chỉ còn Hồ sơ cá nhân, Hướng dẫn (dùng lại của TVV, như Admin).
 * UI-TONG-QUAN (chủ SP 23/10): Tổng quan tạm dùng góc nhìn GV.
 */
import { MAN_HO_SO_TVV } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

export const HD_HT: HuongDan = {
  viec: [],
  man: [
    { id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [{ id: 'ht-tong-quan', ten: 'Trang đầu', buoc: ['Trang đầu tạm dùng góc nhìn GV (Case đang xử lý; khối lớp khi bạn có lớp dạy); trang Tutor tạm ẩn, dữ liệu tutor vẫn giữ nguyên.'] }] },
    ...MAN_HO_SO_TVV.filter((m) => m.id === 'ho-so-ca-nhan' || m.id === 'huong-dan'),
  ],
  luat: [],
  tu: [],
};
