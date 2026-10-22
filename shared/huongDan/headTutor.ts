/**
 * Hướng dẫn Head tutor. AN-TUTOR (chủ SP 22/10): trang Tutor ẩn khỏi web — chỉ còn Hồ sơ cá nhân, Hướng dẫn (dùng lại của TVV, như Admin).
 */
import { MAN_HO_SO_TVV } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

export const HD_HT: HuongDan = {
  viec: [],
  man: MAN_HO_SO_TVV.filter((m) => m.id === 'ho-so-ca-nhan' || m.id === 'huong-dan'),
  luat: [],
  tu: [],
};
