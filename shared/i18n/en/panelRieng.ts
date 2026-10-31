/** PANEL-RIENG — panel một em, "PA chưa có kết quả", Xét lại "Khi lưu" ⓘ, bài quá hạn "Hà chấm". Khoá = chữ Việt. */
import type { Dich } from '../en.ts';

export const EN_PANEL_RIENG = {
  '{ten} chấm': (b) => `${b.ten} marking`,
  'HỌC VIÊN': 'STUDENT',
  /* B6 — thay "Cần bổ sung đánh giá". */
  '{n} PA chưa có kết quả': (b) => `${b.n} ${Number(b.n) === 1 ? 'PA' : 'PAs'} with no result`,
  'PA chưa có kết quả': 'PAs with no result',
  'Không tính vào bảng hiệu quả tới khi có kết quả': 'Not counted in the effectiveness table until there is a result',
  'Không còn PA nào chưa có kết quả': 'No PA is missing a result',
} satisfies Record<string, Dich>;
