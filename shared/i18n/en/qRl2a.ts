/** Q-RL2a THÙNG RÁC (chủ SP + PTA duyệt): toast Hoàn tác sau xoá Case / PA / vi phạm / tệp + Quản trị › Đã xoá. */
import type { Dich } from '../en.ts';

export const EN_Q_RL2A = {
  'Đã xoá Case · {ten}': 'Case deleted · {ten}',
  'Đã gỡ tệp': 'File removed',
  'Người xoá': 'Deleted by',
  'Lúc xoá': 'Deleted at',
  'Còn đến': 'Kept until',
  'Đã khôi phục · {ten} · {ngay}': 'Restored · {ten} · {ngay}',
  'Đã xoá hẳn': 'Permanently deleted',
  'Không có mục nào đã xoá trong 30 ngày.': 'Nothing deleted in the last 30 days.',
  'Giữ 30 ngày, sau đó xoá hẳn.': 'Kept for 30 days, then permanently deleted.',
  /* Q-RL2b: xoá học viên (một em / hàng loạt) + khối Đã xoá ở Lưu trữ. */
  'Đã xoá học viên · {ten}': 'Student deleted · {ten}',
  'Khôi phục được trong 30 ngày (Quản trị › Đã xoá hoặc Lưu trữ).': 'Can be restored within 30 days (Admin › Deleted or Archive).',
  'Khôi phục {ok}, lỗi {loi}: {ly}': 'Restored {ok}, failed {loi}: {ly}',
  'Đã khôi phục {n} học viên': '{n} students restored',
  'Xoá hồ sơ và mọi dữ liệu của các em này.': 'Deletes the profile and all data of these students.',
} satisfies Record<string, Dich>;
