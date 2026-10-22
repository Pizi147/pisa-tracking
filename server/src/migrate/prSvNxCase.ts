/**
 * SV-NX-CASE (plan.md 1.6 N8, chủ SP 23/10) — MÔ TẢ CASE ↔ NHẬN XÉT MT. Hai phần:
 *
 *   `themCotPrSvNxCase` (ĐẦU migrate, chỉ thêm): cột `sos_cases.mo_ta_attempt_id` (nguồn mô tả) + chỉ mục một phần.
 *   `migratePrSvNxCase` (ĐỔI DỮ LIỆU, chạy lặp không đổi, KHÔNG đổi nội dung mô tả nào):
 *     A. Case MT đang lấy mô tả từ nhận xét (có nguyên nhân, mọi dòng `case_issues.created_by` NULL) mà chưa có nguồn → nguồn = lượt Case đang theo
 *        (`sc.attempt_id` — đúng ô luật OV-12c đã chép). Nội dung giữ nguyên; từ nay đi theo nhận xét ô đó tới khi có người sửa riêng.
 *     B. Ô S chấm chéo còn việc "Xem nhận xét Speaking" (OV-13k, `cho_phu_trach_xem` = 1): PA Case S của lượt đã xác nhận (việc cũ đã hết) → hạ cờ
 *        (không sinh việc mới); còn lại giữ cờ → thành việc "Xác nhận Case" của GV phụ trách S khi có Case S thật của lượt (không có Case: không việc).
 *
 * `kiemTruocSvNxCase` = CÙNG danh sách mà KHÔNG ghi gì (lệnh `npm run kiem-truoc-sv-nx-case`).
 */
import { LA_CASE_MT } from '../cases/sosState.ts';

export function themCotPrSvNxCase(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_cases') as any[];
  if (!cot.length) return;
  if (!cot.some((c) => c.name === 'mo_ta_attempt_id')) {
    conn.exec('ALTER TABLE sos_cases ADD COLUMN mo_ta_attempt_id INTEGER');
    applied.push('SV-NX-CASE: thêm cột sos_cases.mo_ta_attempt_id (nguồn mô tả Case MT). Dữ liệu cũ giữ nguyên.');
  }
  conn.exec('CREATE INDEX IF NOT EXISTS idx_case_mo_ta_attempt ON sos_cases(mo_ta_attempt_id) WHERE mo_ta_attempt_id IS NOT NULL');
}

export type DongSvNxCase = { phan: 'A' | 'B-ha-co' | 'B-xac-nhan-case' | 'B-chua-co-case'; id: number; hocVien: string; luot: string; ghi: string };

const DONG_A = `SELECT sc.id, sc.topic, sc.attempt_id, a.attempt_no, st.full_name FROM sos_cases sc
    JOIN assessment_attempts a ON a.id = sc.attempt_id LEFT JOIN students st ON st.id = sc.student_id
   WHERE sc.mo_ta_attempt_id IS NULL AND ${LA_CASE_MT('sc')}
     AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
     AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.created_by IS NOT NULL)
   ORDER BY sc.id`;

/* Cùng vế "hết việc" của câu xem_nx_s cũ (OV-13k): PA Case S của CHÍNH lượt đã xác nhận sau mốc mở / trượt lại. */
const DONG_B = `SELECT s.id, s.attempt_id, a.attempt_no, st.full_name,
      EXISTS (SELECT 1 FROM case_milestones m JOIN sos_cases sc ON sc.id = m.case_id AND sc.topic = 'speaking'
                JOIN case_interventions iv ON iv.case_id = sc.id
               WHERE m.attempt_id = a.id AND m.kind IN ('opened', 'repeat') AND iv.confirmed_at >= m.created_at) AS pa_xong,
      EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.attempt_id = a.id AND sc.topic = 'speaking' AND sc.status != 'done' AND sc.tam = 0) AS co_case
    FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id LEFT JOIN students st ON st.id = a.student_id
   WHERE s.skill = 'speaking' AND s.cho_phu_trach_xem = 1 ORDER BY s.id`;

function lapDanhSach(conn: any): DongSvNxCase[] {
  const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_cases') as any[]).map((c) => c.name);
  const coCot = cot.includes('mo_ta_attempt_id');
  const ra: DongSvNxCase[] = [];
  /* Chưa có cột (kiểm trước trên DB chưa migrate): mọi Case MT có mô tả từ nhận xét đều thuộc phần A. */
  for (const r of conn.prepare(coCot ? DONG_A : DONG_A.replace('sc.mo_ta_attempt_id IS NULL AND ', '')).all() as any[]) {
    ra.push({ phan: 'A', id: r.id, hocVien: r.full_name ?? '?', luot: `MT${r.attempt_no}`, ghi: `Case ${r.topic} · mô tả giữ nguyên, nguồn = nhận xét MT${r.attempt_no}` });
  }
  if ((conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).some((c) => c.name === 'cho_phu_trach_xem')) {
    for (const r of conn.prepare(DONG_B).all() as any[]) {
      const phan = r.pa_xong ? 'B-ha-co' : r.co_case ? 'B-xac-nhan-case' : 'B-chua-co-case';
      ra.push({ phan, id: r.id, hocVien: r.full_name ?? '?', luot: `MT${r.attempt_no}`,
        ghi: phan === 'B-ha-co' ? 'Xem nhận xét Speaking đã hết (PA xác nhận) — hạ cờ' : phan === 'B-xac-nhan-case' ? 'Xem nhận xét Speaking → Xác nhận Case' : 'Chưa có Case S — việc Xác nhận Case khi có Case' });
    }
  }
  return ra;
}

export function kiemTruocSvNxCase(conn: any): DongSvNxCase[] {
  return lapDanhSach(conn);
}

export function migratePrSvNxCase(conn: any, applied: string[]): DongSvNxCase[] {
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_cases') as any[]).some((c) => c.name === 'mo_ta_attempt_id')) return [];
  const ra = lapDanhSach(conn);
  const a = ra.filter((d) => d.phan === 'A');
  for (const d of a) conn.prepare('UPDATE sos_cases SET mo_ta_attempt_id = attempt_id WHERE id = ? AND mo_ta_attempt_id IS NULL').run(d.id);
  for (const d of ra.filter((x) => x.phan === 'B-ha-co')) conn.prepare('UPDATE assessment_scores SET cho_phu_trach_xem = 0 WHERE id = ?').run(d.id);
  const ghi = ra.filter((d) => d.phan !== 'B-chua-co-case' && d.phan !== 'B-xac-nhan-case');
  if (ghi.length) {
    const dem = (p: DongSvNxCase['phan']) => ra.filter((d) => d.phan === p).length;
    applied.push(`SV-NX-CASE: ${dem('A')} Case MT gắn nguồn mô tả (nội dung giữ nguyên) · ${dem('B-ha-co')} ô S hạ cờ (việc cũ đã hết) · `
      + `${dem('B-xac-nhan-case')} việc "Xem nhận xét Speaking" → "Xác nhận Case" · ${dem('B-chua-co-case')} ô S chờ Case.`);
  }
  return ra;
}
