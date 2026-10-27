import { db, theoLo, THAM_SO_TOI_DA } from '../db.ts';
import { docNhomNguyenNhan, issuesForTopic, laKhac } from '../../../shared/domain/index.ts';
import { LA_CASE_MT, dongBoTrangThaiCaseLo } from './sosState.ts';

/**
 * OV-12c (chủ SP 14/10) → SV-NX-CASE (plan.md 1.6 N8 ②③, chủ SP 23/10) — MÔ TẢ (nguyên nhân) CASE SOS MOCK TEST LẤY TỪ NHẬN XÉT + NHÓM CỦA Ô.
 *
 * Case là của KỸ NĂNG. Nhận xét của ô (lượt × `sc.topic`) thành mô tả Case CHỈ KHI Case CHƯA CÓ MÔ TẢ; từ đó mô tả ĐI THEO nhận xét của đúng ô đó
 * (`sos_cases.mo_ta_attempt_id` — nguồn) tới khi có người sửa riêng mô tả ở Case (`case_issues.created_by` có người → tách hẳn, không bao giờ bị đè).
 * Trượt lại ở MT sau mà Case đã có mô tả → giữ mô tả (vẫn theo nhận xét MT cũ). Case chưa có mô tả → lấy từ ô của lượt Case đang theo (`sc.attempt_id`).
 * Nhóm thứ nhất = `case_issues` primary (quan sát = nhận xét), nhóm sau = secondary; ô có nhận xét mà chưa chọn nhóm → nhóm "Khác" của kỹ năng.
 * Ô chưa có nhận xét → giữ mô tả đang có; Case chưa có gì → "Chờ mô tả Case" (GV ghi mô tả ở Case — MO-TA-CASE).
 * S chấm chéo (N8 ③): ô S đang chờ GV phụ trách "Xác nhận Case" (`cho_phu_trach_xem` = 1) KHÔNG tự thành mô tả — GV phụ trách chọn (`xacNhanCaseS`).
 *
 * Gọi sau mọi lần ô đổi nhận xét / nhóm (`saveScore`), lúc Case MT ra đời / trượt lại (`sos.ts`), và migrate. Trả số Case đã đổi.
 */
export function dongBoNguyenNhanMt(theo: { caseIds?: readonly number[]; attemptId?: number; skill?: string }): number {
  const conn = db();
  const chon = `SELECT sc.id, sc.topic, sc.mo_ta_attempt_id, s.attempt_id AS nguon, s.comment, s.nhom_nguyen_nhan, s.cho_phu_trach_xem,
        EXISTS (SELECT 1 FROM case_issues ci0 WHERE ci0.case_id = sc.id) AS co_mo_ta
      FROM sos_cases sc LEFT JOIN assessment_scores s ON s.attempt_id = COALESCE(sc.mo_ta_attempt_id, sc.attempt_id) AND s.skill = sc.topic
     WHERE sc.status != 'done' AND ${LA_CASE_MT('sc')}
       AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.created_by IS NOT NULL)`;
  const rows: any[] = [];
  if (theo.attemptId != null) {
    const k = theo.skill ? ' AND sc.topic = ?' : '';
    const ts = theo.skill ? [theo.skill] : [];
    rows.push(...conn.prepare(`${chon} AND sc.mo_ta_attempt_id = ?${k}`).all(theo.attemptId, ...ts) as any[]);
    rows.push(...conn.prepare(`${chon} AND sc.mo_ta_attempt_id IS NULL AND sc.attempt_id = ?${k}`).all(theo.attemptId, ...ts) as any[]);
  }
  if (theo.caseIds?.length) {
    theoLo([...new Set(theo.caseIds)], (lo, ph) => { rows.push(...conn.prepare(`${chon} AND sc.id IN (${ph})`).all(...lo) as any[]); }, THAM_SO_TOI_DA);
  }
  const doi: number[] = [];
  for (const r of rows) {
    /* Case đã có mô tả mà không có nguồn (không theo nhận xét nào) → giữ nguyên. */
    if (r.mo_ta_attempt_id == null && r.co_mo_ta) continue;
    if (r.cho_phu_trach_xem) continue;   // S chấm chéo chờ GV phụ trách Xác nhận Case
    const nx = String(r.comment ?? '').trim() || null;
    /* Ô chưa có nhận xét (MT cũ / nhập bù): không xoá mô tả đang có — chỉ Case chưa có gì mới "Chờ mô tả Case". */
    if (!nx) continue;
    if (ganMoTaTuO(conn, r.id, r.topic, r.nguon, nx, r.nhom_nguyen_nhan)) doi.push(r.id as number);
  }
  if (doi.length) dongBoTrangThaiCaseLo(doi);
  return doi.length;
}

/** Ghi mô tả + nhóm của Case từ nhận xét + nhóm của ô (`created_by` NULL = đi theo nhận xét), nguồn = lượt của ô. Trả true khi có đổi. */
export function ganMoTaTuO(conn: any, caseId: number, topic: string | null, nguon: number, nx: string, nhomJson: string | null): boolean {
  const boNhom = issuesForTopic(topic ?? '');
  const hopLe = new Set(boNhom.map((i) => i.code));
  const nhom = docNhomNguyenNhan(nhomJson).filter((c) => hopLe.has(c));
  const khac = boNhom.find((i) => laKhac(i.code))?.code ?? null;
  const muon = nhom.length ? nhom : khac ? [khac] : [];
  const co = conn.prepare(`SELECT role, taxonomy_code, observation, created_by FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`).all(caseId) as any[];
  const nguonCu = (conn.prepare('SELECT mo_ta_attempt_id FROM sos_cases WHERE id = ?').get(caseId) as any)?.mo_ta_attempt_id ?? null;
  const giongNhau = nguonCu === nguon && co.length === muon.length && co.every((x, i) => x.created_by == null && x.taxonomy_code === muon[i] && x.role === (i ? 'secondary' : 'primary')
    && (i ? true : (x.observation ?? null) === nx));
  if (giongNhau) return false;
  const luc = new Date().toISOString();
  conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(caseId);
  muon.forEach((code, i) => conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
      VALUES (?,?,?,1,?,?,NULL,?)`).run(caseId, i ? 'secondary' : 'primary', code, topic ?? null, i ? null : nx, luc));
  conn.prepare('UPDATE sos_cases SET mo_ta_attempt_id = ?, updated_at = ? WHERE id = ?').run(nguon, luc, caseId);
  return true;
}
