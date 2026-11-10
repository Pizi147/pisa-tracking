/**
 * `npm run check` / `npm test` (GON-MA-2, CN-2): chạy `run.js` chia PISA_SO_NHOM nhóm song song (tệp độc lập chia tham lam theo thời gian —
 * `chiaThamLam` trong dbGoc.ts; nhóm 1 còn phần chuỗi; `=1` một tiến trình), cùng lúc với `tocDo.run.js` (database riêng sẵn). In log từng tiến trình theo thứ tự, rồi một
 * dòng tổng như `run.js` cũ. Mã thoát ≠ 0 khi một tiến trình đỏ / chết.
 * Ghi `dist-server/data/lan-cuoi.json` (thời gian + số phép kiểm theo tệp; `PISA_DEM_DONG=1` thêm số dòng mỗi tệp thêm vào DB) để so lần sau.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const N = Math.max(1, Number(process.env.PISA_SO_NHOM) || 3);
const t0 = Date.now();

/*
 * DỌN-TEMP: mọi thư mục / tệp tạm của các tiến trình con (`mkdtempSync(os.tmpdir()…)` trong tests/) vào MỘT gốc của lần chạy này —
 * TEMP/TMP/TMPDIR của con trỏ vào gốc — rồi xoá cả gốc khi mọi con đã thoát (kết nối libsql đã đóng, Windows xoá được).
 * Đầu lần chạy: xoá gốc `pisa-check-*` và thư mục tiền tố cũ (`z2-`, `deploy-`, `pj-legacy-`, `prso-` — trước DỌN-TEMP) quá 2 giờ
 * (lần trước bị giết giữa chừng; < 2 giờ có thể của lần check khác đang chạy). Xoá lỗi chỉ cảnh báo.
 */
const TMP = os.tmpdir();
const RAC = /^(pisa-check-\d+|z2-.+|deploy-[A-Za-z0-9]{6}|pj-legacy-[A-Za-z0-9]{6}|prso-[A-Za-z0-9]{6})$/;
let soRac = 0;
for (const ten of fs.readdirSync(TMP)) {
  if (!RAC.test(ten)) continue;
  const p = path.join(TMP, ten);
  try {
    const tt = fs.statSync(p);
    if (tt.isDirectory() && t0 - tt.mtimeMs > 2 * 3600_000) { fs.rmSync(p, { recursive: true, force: true }); soRac++; }
  } catch { /* tiến trình khác đang giữ / đã xoá */ }
}
if (soRac) console.log(`(dọn ${soRac} thư mục tạm cũ của lần check trước)`);
const GOC = path.join(TMP, `pisa-check-${process.pid}`);
fs.mkdirSync(GOC, { recursive: true });
const ENV_TMP = { TEMP: GOC, TMP: GOC, TMPDIR: GOC };

type Ket = { ten: string; ma: number; ra: string; giay: number };
function chay(ten: string, tep: string, env: Record<string, string>): Promise<Ket> {
  const c = spawn(process.execPath, [path.join(DIR, tep)], { env: { ...process.env, ...ENV_TMP, ...env } });
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
const soPhep: Record<string, number> = {};
const dongThem: Record<string, number> = {};
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
  Object.assign(dongThem, kq.dongThem);
  for (const [t, n] of Object.entries(kq.soPhep as Record<string, number>)) soPhep[t] = (soPhep[t] ?? 0) + n;
  tomTat.push(`${k.ten} ${k.giay} s · ${kq.maxRssMb} MB · doc lap: ${kq.docLap} tệp`);
}
try { fs.rmSync(GOC, { recursive: true, force: true, maxRetries: 3 }); } catch (e) { console.warn(`(cảnh báo: chưa xoá được ${GOC}: ${(e as Error).message})`); }
fs.writeFileSync(path.resolve(DIR, '../../../data/lan-cuoi.json'), JSON.stringify({ thoiGian, soPhep, dongThem }));

console.log(`\n${'='.repeat(60)}`);
console.log(loi.length === 0
  ? `TẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT`
  : `${dat} đạt, ${loi.length} KHÔNG ĐẠT:\n` + loi.map((f) => '  - ' + f).join('\n'));
console.log(`${tomTat.join(' | ')} | tổng ${Math.round((Date.now() - t0) / 1000)} s`);
console.log('='.repeat(60));
process.exit(loi.length === 0 ? 0 : 1);
