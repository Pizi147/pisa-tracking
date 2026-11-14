/**
 * DON-NGUOI-CHAM-S (chủ SP 14/11 sáng "2. dọn đi") — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy. Trước #1545, QL / Admin nhập điểm S chấm chéo (Mock, MT0) mà không
 * chọn ai thì máy ghi NGẦM người nhập là người chấm (`examiner_user_id = entered_by`). Luật #1545 (2.4): người không phải GV Speaking phải chọn "GV chấm" —
 * nên các ô đó về "chưa ghi người chấm" (`examiner_user_id` NULL). GV Speaking tự nhập → giữ.
 * Ô dọn: S chấm chéo có điểm, người chấm = người nhập, không có tên người ngoài, người nhập KHÔNG là GV Speaking (N7: S hồ sơ — hiện tại hoặc lịch sử
 * `user_skill_lich_su` tại ngày nhập — HOẶC dạy S một lớp FT tại ngày nhập).
 * Sổ nghĩa vụ đi theo như `tinhBai`: dòng `bai:<lượt>:speaking` về `nguoi` NULL, `khong_tinh` 'khong-ghi-nguoi-cham' (giữ lý do không tính đã có).
 * Nhật ký `audit_logs` (`score.nhan_xet`, người ghi NULL = migrate, `after.migrate` = 'don-nguoi-cham') giữ người chấm cũ — hiện ở Lịch sử thay đổi của ô
 * (dòng GV chấm) → `khoiPhucNguoiChamS` trả lại (`npm run khoi-phuc-nguoi-cham-s`). Khoá `demo_config`; DB mới ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';

export const KHOA_DON_NGUOI_CHAM_S = 'pr_don_nguoi_cham_s_da_chay';
const DAU = 'don-nguoi-cham';

type O = { id: number; attemptId: number; examiner: number; comment: string | null; nhom: string | null };

/** Ô cần dọn — CHỈ ĐỌC. Một câu (chỉ mục một phần `idx_score_examiner`). */
export function oNguoiChamNgam(conn: any): O[] {
  return conn.prepare(
    `SELECT s.id AS id, s.attempt_id AS attemptId, s.examiner_user_id AS examiner, s.comment AS comment, s.nhom_nguyen_nhan AS nhom
       FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id
      WHERE s.examiner_user_id IS NOT NULL AND s.examiner_user_id = s.entered_by AND s.examiner_name IS NULL
        AND s.skill = 'speaking' AND a.kind IN ('mock', 'mt0') AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)
        AND NOT EXISTS (SELECT 1 FROM user_skills us WHERE us.user_id = s.entered_by AND us.skill = 'speaking')
        AND NOT EXISTS (SELECT 1 FROM user_skill_lich_su l WHERE l.user_id = s.entered_by AND l.skill = 'speaking'
                          AND l.tu <= substr(s.entered_at, 1, 10) AND (l.den IS NULL OR l.den > substr(s.entered_at, 1, 10)))
        AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id AND c.is_fast_track = 1
                          WHERE ta.user_id = s.entered_by AND ta.skill = 'speaking' AND ta.status IN ('active', 'ended')
                            AND ta.effective_from <= substr(s.entered_at, 1, 10) AND (ta.effective_to IS NULL OR ta.effective_to >= substr(s.entered_at, 1, 10)))
      ORDER BY s.id`,
  ).all() as O[];
}

/** Dọn — không khoá (phép kiểm gọi thẳng). Trả ô đã dọn. */
export function donNguoiChamS(conn: any): O[] {
  const ds = oNguoiChamNgam(conn);
  const luc = nowIso();
  const up = conn.prepare('UPDATE assessment_scores SET examiner_user_id = NULL WHERE id = ? AND examiner_user_id = ?');
  const nv = conn.prepare(`UPDATE nghia_vu SET nguoi = NULL, khong_tinh = COALESCE(khong_tinh, 'khong-ghi-nguoi-cham'), cap_nhat = ? WHERE khoa = ? AND nguoi = ?`);
  const ls = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
    VALUES (NULL, 'score.nhan_xet', 'assessment_attempt', ?, 'speaking', ?, ?, ?)`);
  for (const o of ds) {
    up.run(o.id, o.examiner);
    nv.run(luc, `bai:${o.attemptId}:speaking`, o.examiner);
    const chung = { comment: o.comment, examinerName: null, nhom: o.nhom, scoreId: o.id };
    ls.run(o.attemptId, JSON.stringify({ ...chung, examinerUserId: o.examiner }), JSON.stringify({ ...chung, examinerUserId: null, migrate: DAU }), luc);
  }
  return ds;
}

/**
 * Khôi phục: mỗi ô về người chấm cũ theo nhật ký — chỉ khi ô còn trống người chấm VÀ người nhập vẫn là người đó (ai đã chọn GV chấm / người khác nhập
 * lại sau đó thì giữ); dòng nhật ký đổi action
 * `score.nhan_xet_khoi_phuc` để không trả hai lần. Đọc cột bằng bí danh (bản chính có cột viết hoa — #1198). Trả id ô đã trả.
 */
export function khoiPhucNguoiChamS(conn: any): number[] {
  const ra: number[] = [];
  const luc = nowIso();
  for (const h of conn.prepare(`SELECT id AS id, entity_id AS luot, before_json AS cu FROM audit_logs
      WHERE action = 'score.nhan_xet' AND actor_user_id IS NULL AND json_valid(after_json) AND json_extract(after_json, '$.migrate') = ? ORDER BY id DESC`).all(DAU) as any[]) {
    const cu = JSON.parse(h.cu);
    if (conn.prepare('UPDATE assessment_scores SET examiner_user_id = ? WHERE id = ? AND examiner_user_id IS NULL AND examiner_name IS NULL AND entered_by = ?').run(cu.examinerUserId, cu.scoreId, cu.examinerUserId).changes) {
      ra.push(cu.scoreId);
      conn.prepare(`UPDATE nghia_vu SET nguoi = ?, khong_tinh = CASE WHEN khong_tinh = 'khong-ghi-nguoi-cham' THEN NULL ELSE khong_tinh END, cap_nhat = ?
          WHERE khoa = ? AND nguoi IS NULL`).run(cu.examinerUserId, luc, `bai:${h.luot}:speaking`);
    }
    conn.prepare(`UPDATE audit_logs SET action = 'score.nhan_xet_khoi_phuc' WHERE id = ?`).run(h.id);
  }
  return ra;
}

export function migratePrDonNguoiChamS(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_DON_NGUOI_CHAM_S)) return;
  const ds = donNguoiChamS(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_DON_NGUOI_CHAM_S, demoToday(), nowIso());
  if (ds.length) applied.push(`DON-NGUOI-CHAM-S: ${ds.length} ô S chấm chéo cũ bỏ người chấm ghi ngầm (người nhập không phải GV Speaking; khôi phục: npm run khoi-phuc-nguoi-cham-s).`);
}
