/** SỔ NGHĨA VỤ PR-2 (chủ SP 09–10/11): 3 số Đúng hạn · Làm muộn · Chưa làm, S chéo chung, Chưa phân công, tổng mọi chi nhánh. Theo thiet-ke/THUAT_NGU_EN.md. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_SO_NGHIA_VU = {
  '{n} đúng hạn': (b) => `${b.n} on time`,
  '{n} làm muộn': (b) => `${b.n} late`,
  '{n} chưa làm': (b) => `${b.n} not done`,
  '+ {n} S chéo chung': (b) => `+ ${b.n} shared S cross-marking`,
  'Làm muộn': 'Late',
  'Tình trạng': 'Status',
  'Làm muộn {n} ngày': (b) => `${so(b.n, 'day', 'days')} late`,
  'Chưa làm · quá {n} ngày': (b) => `Not done · ${so(b.n, 'day', 'days')} overdue`,
  'phân công nhập sau': 'assignment entered later',
  'hạn gốc {ngay}': (b) => `original due ${b.ngay}`,
  'Bài của bạn': 'Your scripts',
  'S chéo chung · chưa ai nhận': 'Shared S cross-marking · unclaimed',
  'Giáo viên · tất cả chi nhánh': 'Teachers · all branches',
  'Mỗi số mở danh sách đúng tập (chỉ đọc), cùng nguồn Tổng quan › GV cần chú ý. Không xếp hạng, không màu ngưỡng — xếp theo tên. "—" = chưa có dữ liệu. Việc · Chấm Test: tỉ lệ = đúng hạn / (đúng hạn + làm muộn + chưa làm); "S chéo chung" = bài Speaking chấm chéo chưa ai nhận của chi nhánh, mọi GV có kỹ năng S cùng thấy, không tính vào tỉ lệ.':
    'Each number opens its exact list (read-only), same source as Overview › Teachers to watch. No ranking, no threshold colours — sorted by name. "—" = no data yet. Tasks · Test marking: rate = on time / (on time + late + not done); "shared S cross-marking" = unclaimed Speaking cross-marking scripts of the branch, shown to every teacher with the S skill, not counted in the rate.',
  'Số to: bài Test chấm đúng hạn / bài Test có hạn trong kỳ (đúng hạn + làm muộn + chưa làm quá hạn), tính cho người được phân công ở hạn. Bài Speaking chấm chéo chưa ai nhận ghi riêng "S chéo chung", không tính vào tỉ lệ. Việc: mọi việc có hạn trong kỳ (Case, PA, Kết quả PA, Mini Test, Báo PH, bàn giao…), cùng cách tính.':
    'Big number: Test scripts marked on time / Test scripts due in the period (on time + late + overdue not done), counted for the teacher assigned at the due date. Unclaimed Speaking cross-marking scripts are shown separately as "shared S cross-marking", not in the rate. Tasks: every task due in the period (Case, plan, plan result, Mini Test, parent report, handover…), same rule.',
  'Chấm Test đúng hạn': 'Test marking on time',
  'Bài, việc có hạn trong kỳ: Đúng hạn (xong trước / đúng hạn) · Làm muộn (xong sau hạn) · Chưa làm (quá hạn chưa xong). Tỉ lệ = đúng hạn / cả ba. Bài Speaking chấm chéo chưa ai nhận là việc chung của mọi GV có kỹ năng S ở chi nhánh — nhóm riêng, không tính vào tỉ lệ. Hạn gốc ghi khi đã đặt lại hạn. Việc / bài trước tuần W4 OCT 2026 đã làm = đúng hạn.':
    'Scripts and tasks due in the period: On time (done by the due date) · Late (done after) · Not done (overdue). Rate = on time / all three. Unclaimed Speaking cross-marking scripts belong to every teacher with the S skill in the branch — listed separately, not in the rate. Original due date shown when the due date was reset. Work due before W4 OCT 2026 and done counts as on time.',
} satisfies Record<string, Dich>;
