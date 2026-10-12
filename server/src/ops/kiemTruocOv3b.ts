/**
 * KIỂM TRƯỚC OV-3b — CHỈ ĐỌC (chỉ `prepare(...).all()`): (1) Lộ trình tiếp theo sẽ thành nháp của Quản lý theo lớp (cùng điều kiện migrate
 * `prOv3b`, nếu bảng nháp chưa có); (2) lệnh chuyển lớp đang chờ theo hạn bàn giao (lệnh đã có giữ hạn đã lưu — không migrate hạn).
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-truoc-ov3b`. Không biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { LTT_THANH_NHAP_SQL } from '../migrate/prOv3b.ts';

export function kiemTruocOv3b(conn: any): {
  nhap: { lopId: number; lop: string; n: number }[];
  lenhCho: { lop: string; hanGvcn: string | null; n: number; daXacNhan: number }[];
} {
  return {
    nhap: conn.prepare(`SELECT c.id AS lopId, c.code AS lop, COUNT(*) AS n ${LTT_THANH_NHAP_SQL} GROUP BY c.id ORDER BY c.code`).all(),
    lenhCho: conn.prepare(
      `SELECT c.code AS lop, l.han_gvcn AS hanGvcn, COUNT(*) AS n, SUM(l.xac_nhan_luc IS NOT NULL) AS daXacNhan
         FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id WHERE l.trang_thai = 'cho'
        GROUP BY c.id, l.han_gvcn ORDER BY l.han_gvcn, c.code`,
    ).all(),
  };
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /kiemTruocOv3b\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov3b] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  const r = kiemTruocOv3b(db());
  closeDb();
  console.log('\n1. Lộ trình tiếp theo sẽ thành nháp của Quản lý (khi chạy migrate OV-3b lần đầu):');
  for (const x of r.nhap) console.log(`  ${x.lop}: ${x.n} em`);
  console.log(`  Tổng: ${r.nhap.reduce((a, x) => a + x.n, 0)} em`);
  console.log('\n2. Quyết định chuyển lớp đang chờ, theo hạn bàn giao GVCN (giữ hạn đã lưu):');
  for (const x of r.lenhCho) console.log(`  ${x.lop} · hạn ${x.hanGvcn ?? '—'}: ${x.n} em (${x.daXacNhan} đã xác nhận)`);
}
