import { db, theoLo, THAM_SO_TOI_DA } from '../db.ts';
import { docNhomNguyenNhan, issuesForTopic, laKhac } from '../../../shared/domain/index.ts';
import { LA_CASE_MT, dongBoTrangThaiCaseLo } from './sosState.ts';

/**
 * OV-12c (chủ SP 14/10) — NGUYÊN NHÂN CASE SOS MOCK TEST = NHẬN XÉT + NHÓM CỦA Ô (liên kết sống, không bước "Xác nhận nguyên nhân").
 *
 * Ô của Case = (`sc.attempt_id`, `sc.topic`) — lượt Case đang theo (trượt lại thì là lượt mới) và đúng bài (W1 / W2 là hai Case). Nhóm thứ nhất
 * = `case_issues` primary (quan sát = nhận xét), nhóm sau = secondary; ô có nhận xét mà chưa chọn nhóm (MT cũ / nhập bù) → nhóm "Khác" của kỹ năng.
 * Ô chưa có nhận xét → giữ nguyên nhân đang có; Case chưa có nguyên nhân nào → "Chờ ghi nhận xét". Không chép nhận xét sang `summary` — dòng mô tả của Case sinh từ điểm vẫn suy ra
 * từ dữ liệu; nhận xét là quan sát của nguyên nhân chính (một nguồn).
 *
 * Chỉ đồng bộ nguyên nhân DO MÁY ghi (`created_by IS NULL`): Case MT cũ mà GV đã tự xác nhận nguyên nhân (luật trước) giữ nguyên chữ của GV.
 * Gọi sau mọi lần ô đổi nhận xét / nhóm (`saveScore`), lúc Case MT ra đời / trượt lại (`sos.ts`), và migrate `prOv12c`. Trả số Case đã đổi.
 */
export function dongBoNguyenNhanMt(theo: { caseIds?: readonly number[]; attemptId?: number; skill?: string }): number {
  const conn = db();
  const chon = `SELECT sc.id, sc.topic, s.comment, s.nhom_nguyen_nhan
      FROM sos_cases sc LEFT JOIN assessment_scores s ON s.attempt_id = sc.attempt_id AND s.skill = sc.topic
     WHERE sc.status != 'done' AND ${LA_CASE_MT('sc')}
       AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.created_by IS NOT NULL)`;
  const rows: any[] = [];
  if (theo.attemptId != null) {
    rows.push(...conn.prepare(`${chon} AND sc.attempt_id = ?${theo.skill ? ' AND sc.topic = ?' : ''}`)
      .all(...[theo.attemptId, ...(theo.skill ? [theo.skill] : [])]) as any[]);
  }
  if (theo.caseIds?.length) {
    theoLo([...new Set(theo.caseIds)], (lo, ph) => { rows.push(...conn.prepare(`${chon} AND sc.id IN (${ph})`).all(...lo) as any[]); }, THAM_SO_TOI_DA);
  }
  const doi: number[] = [];
  for (const r of rows) {
    const nx = String(r.comment ?? '').trim() || null;
    const boNhom = issuesForTopic(r.topic ?? '');
    const hopLe = new Set(boNhom.map((i) => i.code));
    const nhom = docNhomNguyenNhan(r.nhom_nguyen_nhan).filter((c) => hopLe.has(c));
    const khac = boNhom.find((i) => laKhac(i.code))?.code ?? null;
    /* Ô chưa có nhận xét (MT cũ / nhập bù): không xoá nguyên nhân đang có (vd của lượt trước khi trượt lại) — chỉ Case chưa có gì mới "Chờ ghi nhận xét". */
    if (!nx) continue;
    const muon = nhom.length ? nhom : khac ? [khac] : [];
    const co = conn.prepare(`SELECT role, taxonomy_code, observation FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`).all(r.id) as any[];
    const giongNhau = co.length === muon.length && co.every((x, i) => x.taxonomy_code === muon[i] && x.role === (i ? 'secondary' : 'primary')
      && (i ? true : (x.observation ?? null) === nx));
    if (giongNhau) continue;
    const luc = new Date().toISOString();
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(r.id);
    muon.forEach((code, i) => conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
        VALUES (?,?,?,1,?,?,NULL,?)`).run(r.id, i ? 'secondary' : 'primary', code, r.topic ?? null, i ? null : nx, luc));
    conn.prepare('UPDATE sos_cases SET updated_at = ? WHERE id = ?').run(luc, r.id);
    doi.push(r.id as number);
  }
  if (doi.length) dongBoTrangThaiCaseLo(doi);
  return doi.length;
}
