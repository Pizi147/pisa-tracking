/**
 * `npm run chay-thu:n1` — CHẠY THỬ CHỈ ĐỌC trước bước migrate của PR-N1 (R-PA5, K5-19, K5-58).
 *
 * Mở cùng database như `migrate/run.ts` (`db()`: file cục bộ, hoặc Turso khi có TURSO_DATABASE_URL) nhưng KHÔNG gọi
 * `migrate()` và không ghi gì — chỉ SELECT, để người deploy biết trước bước migrate sẽ đổi bao nhiêu dòng. In ba con số:
 *   (1) số PA đang chạy sẽ dời hạn ghi kết quả Chủ nhật → Thứ Hai (cùng điều kiện với `migratePrN1`) + tối đa 20 dòng mẫu;
 *   (2) số PA chưa xong/chưa huỷ mà KHÔNG có hạn ghi kết quả (sẽ không có nhắc) — > 0 thì báo planning;
 *   (3) số PA đã huỷ mà vẫn "chờ duyệt" (K5-58, thẻ chết — chỉ để biết, không sửa).
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { demPaDoiHanThuHai } from './prN1.ts';

const ddmm = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');

console.log(`[chay-thu:n1] CHỈ ĐỌC — không nâng cấp, không ghi. Database: ${DB_PATH}`);

/* File cục bộ chưa có thì db() sẽ TẠO file rỗng — chạy thử không được để lại dấu vết, nên dừng trước khi mở. */
if (!laDbTuXa() && !fs.existsSync(DB_PATH)) {
  console.log('[chay-thu:n1] Không có file database ở đường dẫn trên — không có gì để chạy thử.');
  process.exit(0);
}
if (!isInitialised()) {
  console.log('[chay-thu:n1] Database chưa có bảng nào — không có gì để chạy thử.');
  closeDb();
  process.exit(0);
}

const conn = db();

/* (1) PA đang chạy sẽ dời hạn CN → T2. */
const { soPa, mau } = demPaDoiHanThuHai(conn);
console.log(`\n(1) ${soPa} PA sẽ dời hạn CN → T2`);
for (const x of mau.slice(0, 20)) console.log(`    #${x.id} · ${x.hocVien ?? '(không rõ học viên)'} · ${ddmm(x.hanCu)} → ${ddmm(x.hanMoi)}`);
if (soPa > 20) console.log(`    … và ${soPa - 20} PA nữa`);

/*
 * (2) PA chưa xong/chưa huỷ mà hạn ghi kết quả trống. Tách theo lý do để đọc nhanh: chờ duyệt thì trống là đúng luật; PA quy chế
 * SOS gợi ý tự động chưa xác nhận (`preset = 1`) chưa chạy nên chưa có hạn (sosAuto.ts). Phần còn lại mới là chỗ đáng hỏi.
 */
const thieu = conn.prepare(
  `SELECT COUNT(*) AS n,
          SUM(CASE WHEN COALESCE(approval_state, '') = 'pending' THEN 1 ELSE 0 END) AS choDuyet,
          SUM(CASE WHEN COALESCE(approval_state, '') != 'pending' AND preset = 1 AND confirmed_at IS NULL THEN 1 ELSE 0 END) AS choXacNhan,
          SUM(CASE WHEN status = 'started' AND COALESCE(approval_state, '') != 'pending'
                    AND NOT (preset = 1 AND confirmed_at IS NULL) THEN 1 ELSE 0 END) AS dangChay
     FROM case_interventions
    WHERE status IN ('planned', 'started') AND action_due IS NULL`).get() as any;
const nThieu = Number(thieu?.n ?? 0);
console.log(`\n(2) ${nThieu} PA chưa xong mà không có hạn ghi kết quả (sẽ không có nhắc)`
  + (nThieu ? ` — trong đó ${Number(thieu.choDuyet ?? 0)} đang chờ duyệt, ${Number(thieu.choXacNhan ?? 0)} PA quy chế SOS chờ xác nhận,`
    + ` ${Number(thieu.dangChay ?? 0)} đang chạy` : ''));
if (nThieu) console.log('    → > 0: báo planning trước khi migrate.');

/* (3) K5-58: PA đã huỷ mà còn "chờ duyệt" — chỉ để biết. */
const huyCho = Number((conn.prepare(
  `SELECT COUNT(*) AS n FROM case_interventions WHERE status = 'cancelled' AND approval_state = 'pending'`).get() as any)?.n ?? 0);
console.log(`\n(3) ${huyCho} PA đã huỷ mà vẫn ở trạng thái chờ duyệt (chỉ để biết)`);

console.log('\n[chay-thu:n1] Xong — database không bị đổi.');
closeDb();
