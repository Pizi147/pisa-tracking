/**
 * `npm run check` / `npm test` (GON-MA-2): chạy `run.js` chia PISA_SO_NHOM nhóm (mặc định 3) song song, cùng lúc với `tocDo.run.js`
 * (database riêng sẵn). In log từng tiến trình theo thứ tự, rồi một dòng tổng như `run.js` cũ. Mã thoát ≠ 0 khi một tiến trình đỏ / chết.
 * `PISA_GHI_THOI_GIAN=1`: ghi lại `thoiGianTep.ts` từ lần chạy này (cân lại nhóm khi tệp mới làm lệch).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const N = Math.max(1, Number(process.env.PISA_SO_NHOM) || 3);
const t0 = Date.now();

type Ket = { ten: string; ma: number; ra: string; giay: number };
function chay(ten: string, tep: string, env: Record<string, string>): Promise<Ket> {
  const c = spawn(process.execPath, [path.join(DIR, tep)], { env: { ...process.env, ...env } });
  let ra = '';
  c.stdout.on('data', (d) => { ra += d; });
  c.stderr.on('data', (d) => { ra += d; });
  return new Promise((r) => c.on('close', (ma, tinHieu) => r({ ten, ma: ma ?? (tinHieu ? 1 : 0), ra, giay: Math.round((Date.now() - t0) / 1000) })));
}

const viec = Array.from({ length: N }, (_, i) => chay(`nhóm ${i + 1}/${N}`, 'run.js', { PISA_NHOM: `${i + 1}/${N}` }));
viec.push(chay('tốc độ', 'tocDo.run.js', {}));

let dat = 0;
const loi: string[] = [];
const thoiGian: Record<string, number> = {};
const tomTat: string[] = [];
for (const v of viec) {
  const k = await v;
  const dongKq = k.ra.split('\n').find((d) => d.startsWith('@@KQ '));
  process.stdout.write(k.ra.split('\n').filter((d) => !d.startsWith('@@KQ ')).join('\n'));
  console.log(`\n--- ${k.ten}: xong sau ${k.giay} s, mã ${k.ma}`);
  if (k.ten === 'tốc độ') { if (k.ma !== 0) loi.push(`tocDo.run.js đỏ (mã ${k.ma})`); continue; }
  if (!dongKq) { loi.push(`${k.ten} chết giữa chừng (mã ${k.ma}) — xem log ngay trên`); continue; }
  const kq = JSON.parse(dongKq.slice(5));
  dat += kq.dat;
  loi.push(...kq.loi);
  Object.assign(thoiGian, kq.thoiGian);
  tomTat.push(`${k.ten} ${k.giay} s · ${kq.maxRssMb} MB`);
}

if (process.env.PISA_GHI_THOI_GIAN === '1' && loi.length === 0) {
  const tep = path.resolve(DIR, '../../../../server/src/tests/thoiGianTep.ts');
  const cu = fs.readFileSync(tep, 'utf8');
  const dong = Object.entries(thoiGian).sort((a, b) => b[1] - a[1]).map(([ten, ms]) => `  ${ten}: ${Math.max(1, Math.round(ms / 100))},`);
  fs.writeFileSync(tep, cu.replace(/= \{[\s\S]*\};\s*$/, `= {\n${dong.join('\n')}\n};\n`));
  console.log(`Đã ghi ${dong.length} tệp vào ${tep}`);
}

console.log(`\n${'='.repeat(60)}`);
console.log(loi.length === 0
  ? `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`
  : `${dat} đạt, ${loi.length} KHÔNG ĐẠT:\n` + loi.map((f) => '  - ' + f).join('\n'));
console.log(`${tomTat.join(' | ')} | tổng ${Math.round((Date.now() - t0) / 1000)} s`);
console.log('='.repeat(60));
process.exit(loi.length === 0 ? 0 : 1);
