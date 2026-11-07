/** MO-SUA-LICH-TEST (chủ SP 06/11) — nhãn nhật ký + màn Quản trị. */
import type { Dich } from '../en.ts';

export const EN_MO_SUA_LICH_TEST = {
  'Mở sửa lịch Test': 'Open Test schedule editing',
  'Tắt mở sửa lịch Test': 'Close Test schedule editing',
  'Đã mở sửa lịch Test': 'Test schedule editing opened',
  'Đã tắt mở sửa lịch Test': 'Test schedule editing closed',
  'Đang mở': 'Open',
  'Đang tắt': 'Off',
  'Bật bởi {nguoi} lúc {luc}': (b) => `Turned on by ${b.nguoi} at ${b.luc}`,
  'Đang lưu…': 'Saving…',
} satisfies Record<string, Dich>;
