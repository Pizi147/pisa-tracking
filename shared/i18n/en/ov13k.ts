/** OV-13k — chữ MỚI: GV phụ trách Speaking xem nhận xét người chấm chéo, ghi "Nhận xét GV phụ trách". Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_OV13K = {
  'Nhận xét GV phụ trách': 'Lead teacher comment',
  'Nhận xét GV phụ trách S': 'Lead teacher comment S',
  'Xem nhận xét Speaking': 'Review Speaking comment',
  'Xem nhận xét Speaking · {ten} · MT{n}': 'Review Speaking comment · {ten} · MT{n}',
  'Xem nhận xét': 'Review comment',
  'Chờ GV phụ trách xem': 'Awaiting lead teacher',
  'Người chấm chéo đã ghi nhận xét Speaking': 'The cross-marker wrote a Speaking comment',
  'Người chấm chéo đã ghi nhận xét bài Speaking. Ghi thêm nhận xét GV phụ trách nếu cần, sửa nhóm nguyên nhân, Xác nhận PA nếu có Case.':
    'The cross-marker commented on the Speaking test. Add a lead teacher comment if needed, adjust the cause groups, confirm the plan if there is a case.',
  '{lop} · chấm bởi {ten}': '{lop} · marked by {ten}',
  'Chỉ bài Speaking Mock Test (chấm chéo) có nhận xét GV phụ trách.': 'Only Speaking Mock Tests (cross-marked) have a lead teacher comment.',
  'Chỉ GV phụ trách Speaking của lớp, GVCN hoặc Quản lý ghi được nhận xét GV phụ trách.': 'Only the class Speaking lead teacher, homeroom teacher or a manager can write the lead teacher comment.',
  'Bài Speaking này chưa có điểm — chờ người chấm.': 'This Speaking test has no score yet — wait for the marker.',
  'Không có gì để lưu.': 'Nothing to save.',
} satisfies Record<string, Dich>;
