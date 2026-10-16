/**
 * KIỂM TRƯỚC OV-13f — CHỈ ĐỌC (chủ SP 15/10, Q8): email học viên không trùng chỉ ràng buộc ở mã, dữ liệu cũ KHÔNG tự sửa. Lệnh này liệt kê
 * (1) nhóm em đang dùng chung một email (so sau cắt khoảng trắng + chữ thường — cùng luật `emailDangDung`) và (2) số em chưa Lưu trữ còn thiếu
 * email, theo chi nhánh. Em trùng vẫn mở / sửa được các ô khác; chỉ lần ĐỔI email bị kiểm trùng. Không ghi câu nào.
 *
 * Chạy: `npm run kiem-truoc-ov13f` — file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso); hoặc nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';

type Conn = ReturnType<typeof db>;
/** Chi nhánh của em = chi nhánh lớp đang học / tạm dừng, không có thì lớp cuối, không có lớp thì `students.branch_id`. */
const CHI_NHANH = `COALESCE((SELECT c.branch_id FROM enrollments x JOIN classes c ON c.id = x.class_id WHERE x.student_id = s.id
  ORDER BY x.status IN ('active', 'paused') DESC, x.id DESC LIMIT 1), s.branch_id)`;

export function kiemTruocOv13f(conn: Conn) {
  const dong = conn.prepare(
    `SELECT s.id, s.full_name AS ten, lower(trim(s.email)) AS email, s.archived_at, b.name AS chi_nhanh,
            (SELECT c.code FROM enrollments x JOIN classes c ON c.id = x.class_id WHERE x.student_id = s.id
              ORDER BY x.status IN ('active', 'paused') DESC, x.id DESC LIMIT 1) AS lop
       FROM students s LEFT JOIN branches b ON b.id = ${CHI_NHANH}
      ORDER BY s.id`).all() as { id: number; ten: string; email: string | null; archived_at: string | null; chi_nhanh: string | null; lop: string | null }[];
  const theoEmail = new Map<string, typeof dong>();
  const thieu = new Map<string, number>();
  for (const r of dong) {
    if (r.email) theoEmail.set(r.email, [...(theoEmail.get(r.email) ?? []), r]);
    else if (!r.archived_at) thieu.set(r.chi_nhanh ?? '—', (thieu.get(r.chi_nhanh ?? '—') ?? 0) + 1);
  }
  return {
    tongEm: dong.length,
    trung: [...theoEmail].filter(([, em]) => em.length > 1).map(([email, em]) => ({
      email, em: em.map((x) => ({ id: x.id, ten: x.ten, lop: x.lop, chiNhanh: x.chi_nhanh, luuTru: !!x.archived_at })),
    })),
    thieu: [...thieu].sort(([a], [b]) => a.localeCompare(b, 'vi')).map(([chiNhanh, soEm]) => ({ chiNhanh, soEm })),
  };
}

if (process.argv[1] && /kiemTruocOv13f\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov13f] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const r = kiemTruocOv13f(db());
    const soEmTrung = r.trung.reduce((n, x) => n + x.em.length, 0);
    console.log(`\n${r.tongEm} học viên · ${r.trung.length} email dùng chung (${soEmTrung} em)${r.trung.length ? ':' : '.'}`);
    for (const x of r.trung) {
      console.log(`  ${x.email}`);
      for (const e of x.em) console.log(`    #${e.id} ${e.ten} · ${e.lop ?? 'chưa có lớp'} · ${e.chiNhanh ?? '—'}${e.luuTru ? ' · Lưu trữ' : ''}`);
    }
    const tongThieu = r.thieu.reduce((n, x) => n + x.soEm, 0);
    console.log(`\nThiếu email (em chưa Lưu trữ): ${tongThieu}${r.thieu.length ? ':' : '.'}`);
    for (const x of r.thieu) console.log(`  ${x.chiNhanh}: ${x.soEm}`);
  } catch (e) {
    console.error(`[kiem-truoc-ov13f] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
