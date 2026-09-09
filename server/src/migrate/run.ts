import { DB_PATH, closeDb } from '../db.ts';
import { migrate } from '../migrate.ts';

console.log(`[migrate] Nâng cấp dữ liệu đang có tại ${DB_PATH}`);
const { applied, skipped } = migrate();
for (const a of applied) console.log(`  ✓ ${a}`);
for (const s of skipped) console.log(`  · ${s}`);
console.log(applied.length
  ? '[migrate] Hoàn tất. Dữ liệu cũ được giữ nguyên, không xoá database.'
  : '[migrate] Không có gì để nâng cấp.');
closeDb();
