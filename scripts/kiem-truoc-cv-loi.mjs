// CV-LOI — KIỂM TRƯỚC (CHỈ ĐỌC, chỉ SELECT): Case còn mở mà chưa có người phụ trách, và người migrate CV-LOI (`server/src/migrate/prCvLoi.ts`) sẽ gán
// theo luật tạo Case (`suggestCaseOwner`: GV dạy đúng môn ở lớp → GVCN; không ai → để trống, Công việc của QL hiện "Phân công GV …").
// Chạy: node scripts/kiem-truoc-cv-loi.mjs — DB demo theo PISA_DB (mặc định data/pisa-demo.sqlite); bản chính: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
const { default: Database } = await import('libsql');
const url = process.env.TURSO_DATABASE_URL;
const db = url ? new Database(url, { authToken: process.env.TURSO_AUTH_TOKEN }) : new Database(process.env.PISA_DB ?? 'data/pisa-demo.sqlite', { readonly: true });

/* Cùng bảng `CASE_CATEGORY_SKILL` (shared/domain/cases.ts): nhóm có môn → GV môn trước; nhóm khác → GVCN. */
const CO_MON = ['listening', 'reading', 'speaking', 'writing1', 'writing2', 'writing', 'tong_hop', 'listening_speaking', 'reading_writing'];

const rows = db.prepare(`
  SELECT sc.id, sc.category, sc.tam, s.full_name AS hv, k.code AS lop,
         (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
           WHERE ta.class_id = k.id AND ta.status = 'active' AND ta.skill = sc.category AND sc.category IN (${CO_MON.map(() => '?').join(',')}) LIMIT 1) AS gv_mon,
         (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
           WHERE ta.class_id = k.id AND ta.status = 'active' AND ta.is_core = 1 LIMIT 1) AS gvcn
    FROM sos_cases sc
    LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
    LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
    LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
    LEFT JOIN classes k ON k.id = COALESCE(a.class_id, cur.class_id)
   WHERE sc.status != 'done' AND sc.owner_user_id IS NULL
   ORDER BY k.code, sc.id`).all(...CO_MON);

const ganDuoc = rows.filter((r) => r.gv_mon || r.gvcn);
console.log(`Case mở chưa có người phụ trách: ${rows.length} · migrate sẽ gán: ${ganDuoc.length} · còn trống (lớp thiếu GV môn và GVCN / không có lớp): ${rows.length - ganDuoc.length}`);
for (const r of rows) {
  const se = r.gv_mon ? `GV môn: ${r.gv_mon}` : r.gvcn ? `GVCN: ${r.gvcn}` : r.lop ? 'trống → QL "Phân công GV …"' : 'trống — em không có lớp';
  console.log(`  Case ${r.id} · ${r.lop ?? '—'} · ${r.category ?? '—'} · ${r.hv ?? '—'}${r.tam ? ' · tạm' : ''} → ${se}`);
}
