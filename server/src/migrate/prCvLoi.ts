/**
 * CV-LOI (02 mục 4.7 A13, X-63): ghi bù chủ cho Case cũ còn mở mà chưa có người phụ trách — theo đúng luật lúc tạo Case (GV môn → GVCN),
 * mỗi Case một dòng lịch sử (người gán = hệ thống). Chạy lặp được: chỉ chạm Case `owner_user_id IS NULL`; lần hai không ghi gì.
 * Lớp chưa có cả GV môn lẫn GVCN thì để trống (Công việc của QL hiện "Phân công GV {môn}"). Kiểm trước: `scripts/kiem-truoc-cv-loi.mjs`.
 */
import { ganChuCaseThieu } from '../cases/owner.ts';
import { nowIso } from '../util.ts';

export function migratePrCvLoi(_conn: unknown, applied: string[]) {
  const n = ganChuCaseThieu({ actorId: null, luc: nowIso() });
  if (n) applied.push(`CV-LOI: gán người phụ trách cho ${n} Case chưa có (GV môn → GVCN, có lịch sử)`);
}
