/**
 * CV-LOI (02 mục 4.7 A13, X-63): ghi bù chủ cho Case cũ còn mở mà chưa có người phụ trách — theo đúng luật lúc tạo Case (GV môn → GVCN),
 * mỗi Case một dòng lịch sử + một dòng nhật ký nguồn "migrate prCvLoi". Chỉ chạm Case `owner_user_id IS NULL`.
 * SUA-NO-RA (CV-LOI-b): ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prOv13p`) — deploy sau không tự gán chủ cho Case trống vì lý do khác.
 * Lớp chưa có cả GV môn lẫn GVCN thì để trống (Công việc của QL hiện "Phân công GV {môn}").
 */
import { ganChuCaseThieu } from '../cases/owner.ts';
import { nowIso } from '../util.ts';

export const KHOA_PR_CV_LOI = 'pr_cv_loi_gan_chu_case_at';
export const NGUON_PR_CV_LOI = 'migrate prCvLoi';

export function migratePrCvLoi(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_CV_LOI)) return;
  const n = ganChuCaseThieu({ actorId: null, luc: nowIso(), nguon: NGUON_PR_CV_LOI });
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_CV_LOI, nowIso(), nowIso());
  if (n) applied.push(`CV-LOI: gán người phụ trách cho ${n} Case chưa có (GV môn → GVCN, có lịch sử, nguồn "${NGUON_PR_CV_LOI}"). Một lần.`);
}
