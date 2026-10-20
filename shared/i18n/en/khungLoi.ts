/** KHUNG-LOI — thanh trên / dưới ("Thêm"), chú giải màu ô MT. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_KHUNG_LOI = {
  'Chưa xếp': 'Not scheduled',
  'Đã xếp': 'Scheduled',
  'Chờ nhập bù (MT cũ)': 'Awaiting late entry (old MT)',
  'Vắng · huỷ · chờ duyệt': 'Absent · cancelled · awaiting approval',
} satisfies Record<string, Dich>;
