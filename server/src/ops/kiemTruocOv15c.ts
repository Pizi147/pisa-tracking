/**
 * KIỂM TRƯỚC OV-15c — CHỈ ĐỌC: đếm lượt ĐÃ HUỶ cũ (`assessment_attempts.status = 'cancelled'`) theo loại và chi nhánh, cùng số kỹ năng đang huỷ
 * vì vắng 2 lần (`attempt_skills.huy_vang = 1`). Sau OV-15c web không còn "Huỷ MT{n}" (Xóa = về Chưa xếp); dữ liệu cũ giữ nguyên như lịch sử —
 * chủ SP xem số này để quyết có cần xử lý gì không. Không ghi câu nào.
 *
 * Chạy: `npm run kiem-truoc-ov15c` — file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso); hoặc nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';

export function demHuyCu(conn: any): { luot: { kind: string; chiNhanh: string; n: number }[]; huyVang: number } {
  const theoCn = conn.prepare(
    `SELECT a.kind, COALESCE(b.name, '—') AS chi_nhanh, COUNT(*) AS n FROM assessment_attempts a
       LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN branches b ON b.id = c.branch_id
      WHERE a.status = 'cancelled' GROUP BY a.kind, b.name ORDER BY a.kind, b.name`).all() as any[];
  const gom = new Map<string, number>();
  for (const r of theoCn) gom.set(r.kind, (gom.get(r.kind) ?? 0) + r.n);
  return {
    luot: [...[...gom].map(([kind, n]) => ({ kind, chiNhanh: '', n })), ...theoCn.map((r) => ({ kind: r.kind, chiNhanh: r.chi_nhanh, n: r.n }))],
    huyVang: (conn.prepare(`SELECT COUNT(*) AS n FROM attempt_skills WHERE sit_status = 'cancelled' AND huy_vang = 1`).get() as any).n,
  };
}

if (process.argv[1] && /kiemTruocOv15c\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov15c] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const r = demHuyCu(db());
    const tong = r.luot.filter((x) => !x.chiNhanh);
    console.log(`\nLượt đã huỷ trước OV-15c (giữ như lịch sử): ${tong.reduce((s, x) => s + x.n, 0)}`);
    for (const x of tong) {
      console.log(`  ${x.kind}: ${x.n}`);
      for (const y of r.luot.filter((z) => z.chiNhanh && z.kind === x.kind)) console.log(`    ${y.chiNhanh}: ${y.n}`);
    }
    console.log(`Kỹ năng đang huỷ vì vắng 2 lần (vẫn khôi phục được): ${r.huyVang}`);
  } catch (e) {
    console.error(`[kiem-truoc-ov15c] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
