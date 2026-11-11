/**
 * TURSO-1211: đo câu · dòng từng (tài khoản × đường) trên BẢN CHÉP DB thật — gọi HTTP thật (`createApp`, phiên từng người), ghi mọi câu SQL
 * (văn bản + tham số) để `scripts/do-it.py` chạy lại đếm dòng quét cả bảng / bước máy ảo.
 *
 *   npm run build:server
 *   node scripts/do-ban-chep.mjs <bản chép đã migrate .sqlite> <danh sách .json> <ra (không đuôi)>
 *   python -I scripts/do-it.py <ra>          (cần <ra>.sqlite: tự chép DB sau lượt đo vào đó)
 *
 * Danh sách: [{ "ten": "GV11 trang đầu", "user": 11, "goc": "manager", "urls": ["/my-work", …], "quet": true }] — `quet: true` = trả mốc quét nền về NULL trước lượt
 * (đo lượt quét toàn hệ thống). Mỗi url ghi một khoá "<ten> · <url>". Không ghi gì vào DB gốc: chỉ chạy trên bản chép.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [dbPath, dsPath, ra] = process.argv.slice(2);
if (!dbPath || !dsPath || !ra) { console.error('cách dùng: node scripts/do-ban-chep.mjs <db> <ds.json> <ra>'); process.exit(1); }
for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
process.env.PISA_DB = path.resolve(dbPath);
process.env.BAN_CHINH = '1';   // như Netlify: ngày thật, không đường demo
const goc = pathToFileURL(path.resolve('dist-server/server/src')).href;
const { db } = await import(`${goc}/db.js`);
const { createApp } = await import(`${goc}/app.js`);
const { createSession, datGocNhin, SESSION_COOKIE } = await import(`${goc}/auth.js`);

const conn = db();
const ghi = { bat: false, cau: [] };
{
  const proto = Object.getPrototypeOf(conn.prepare('SELECT 1'));
  for (const m of ['all', 'run']) {
    const g = proto[m];
    proto[m] = function (...args) {
      const out = g.apply(this, args);
      if (ghi.bat) ghi.cau.push({ sql: this.sql, args, dong: Array.isArray(out) ? out.length : 0 });
      return out;
    };
  }
}

const server = createApp().listen(0);
await new Promise((r) => server.once('listening', r));
const port = server.address().port;
const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
const kq = {};
for (const muc of ds) {
  const token = createSession(muc.user);
  if (muc.goc) datGocNhin(token, muc.goc);   // tài khoản nhiều vai: góc nhìn đang đo (manager, system_admin…)
  const cookie = `${SESSION_COOKIE}=${token}`;
  if (muc.quet) conn.prepare("UPDATE moc_he_thong SET luc = NULL, ngay = NULL WHERE khoa LIKE 'quet:%'").run();
  for (const url of muc.urls) {
    ghi.cau = []; ghi.bat = true;
    const t = Date.now();
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { headers: { cookie } });
    const body = await res.text();
    ghi.bat = false;
    const khoa = `${muc.ten} · ${url}`;
    kq[khoa] = { status: res.status, ms: Date.now() - t, kb: Math.round(body.length / 1024), n: ghi.cau.length,
      dong: ghi.cau.reduce((s, c) => s + c.dong, 0), cau: ghi.cau, ...(process.env.PISA_IN_JSON ? { body } : {}) };   // PISA_IN_JSON=1: giữ JSON trả về để so trước / sau
    console.log(`${res.status} ${String(kq[khoa].n).padStart(5)} câu ${String(kq[khoa].dong).padStart(6)} dòng ${String(kq[khoa].ms).padStart(5)} ms ${String(kq[khoa].kb).padStart(5)} KB  ${khoa}${res.ok ? '' : ` — ${body.slice(0, 120)}`}`);
  }
}
server.close();
conn.pragma('wal_checkpoint(TRUNCATE)');
fs.writeFileSync(`${ra}.json`, JSON.stringify(kq));
fs.copyFileSync(process.env.PISA_DB, `${ra}.sqlite`);
process.exit(0);
