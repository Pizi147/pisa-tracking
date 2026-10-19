/**
 * KIỂM TRƯỚC TD7b — CHỈ ĐỌC: đếm theo chi nhánh số lượt "đang có ô chờ điểm mà tuần thi đã tới" (cờ `o_cho_tu <= hôm nay`, tính bằng CHÍNH biểu thức của migrate
 * `prTd7b` / `conOCho.ts`) và SO với cách tính cũ (`CON_O_SQL` trước TD7b). Hai số phải KHỚP 100 % từng lượt — lệch thì lệnh thoát mã 1 và in vài lượt lệch.
 * Không ghi câu nào; chạy được cả trước khi có cột mới (tính tại chỗ). Có cột thì in thêm số lượt cờ đang lưu lệch giá trị tính lại.
 *
 * Chạy: `npm run kiem-truoc-td7b` — file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso); hoặc nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { demoToday } from '../demoConfig.ts';
import { CON_O_SQL_TRUOC_TD7B, O_CHO_TU_SQL } from '../fasttrack/conOCho.ts';

if (process.argv[1] && /kiemTruocTd7b\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-td7b] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const conn = db();
    const homNay = demoToday();
    const tu = `FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
                LEFT JOIN branches b ON b.id = c.branch_id`;
    const moiSql = `a.status != 'cancelled' AND ${O_CHO_TU_SQL} <= ?`;
    const dong = conn.prepare(
      `SELECT COALESCE(b.code, '—') AS cn, COUNT(*) AS tong,
              SUM(CASE WHEN ${O_CHO_TU_SQL} IS NOT NULL THEN 1 ELSE 0 END) AS conO,
              SUM(CASE WHEN ${moiSql} THEN 1 ELSE 0 END) AS moi,
              SUM(CASE WHEN ${CON_O_SQL_TRUOC_TD7B} THEN 1 ELSE 0 END) AS cu
         ${tu} GROUP BY COALESCE(b.code, '—') ORDER BY 1`,
    ).all(homNay, homNay, homNay, homNay, homNay) as any[];
    console.log(`\nHôm nay ${homNay}. Lượt đang có ô chờ điểm mà tuần thi đã tới (cờ = 1), theo chi nhánh:`);
    console.log('  chi nhánh   tổng lượt   còn ô chờ (mọi tuần)   cờ=1 (mới)   cách cũ');
    let tm = 0, tc = 0;
    for (const r of dong) {
      tm += r.moi; tc += r.cu;
      console.log(`  ${String(r.cn).padEnd(10)}  ${String(r.tong).padStart(9)}   ${String(r.conO).padStart(19)}   ${String(r.moi).padStart(10)}   ${String(r.cu).padStart(7)}${r.moi === r.cu ? '' : '   ← LỆCH'}`);
    }
    console.log(`  Tổng: cờ=1 ${tm} · cách cũ ${tc}`);
    const lech = conn.prepare(
      `SELECT a.id, moi, cu FROM (SELECT a.id, CASE WHEN ${moiSql} THEN 1 ELSE 0 END AS moi, CASE WHEN ${CON_O_SQL_TRUOC_TD7B} THEN 1 ELSE 0 END AS cu ${tu})
        AS a WHERE moi != cu ORDER BY a.id LIMIT 10`,
    ).all(homNay, homNay, homNay, homNay, homNay) as any[];
    const coCot = (conn.prepare("SELECT name FROM pragma_table_info('assessment_attempts')").all() as any[]).some((c) => c.name === 'o_cho_tu');
    if (coCot) {
      const l = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts a WHERE a.o_cho_tu IS NOT ${O_CHO_TU_SQL}`).get() as any).n;
      console.log(`\nCột o_cho_tu đã có: ${l} lượt có cờ lưu khác giá trị tính lại${l ? ' — chạy `npm run migrate` (hoặc kiểm đường ghi nào quên cập nhật cờ).' : ' (khớp).'}`);
      if (l) process.exitCode = 1;
    } else {
      console.log('\nCột o_cho_tu chưa có — chạy `npm run migrate` sẽ thêm cột, chỉ mục và tính lại cờ cho mọi lượt.');
    }
    if (tm !== tc || lech.length) {
      console.log(`\nKHÔNG KHỚP 100 %: ${lech.length ? `vd lượt ${lech.map((r) => `#${r.id} (mới ${r.moi}, cũ ${r.cu})`).join(', ')}` : 'tổng khác nhau'}`);
      process.exitCode = 1;
    } else {
      console.log('\nKHỚP 100 %: cờ mới ≡ cách tính cũ trên từng lượt.');
    }
  } catch (e) {
    console.error(`[kiem-truoc-td7b] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
