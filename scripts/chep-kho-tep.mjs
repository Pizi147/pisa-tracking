// Chép kho tệp bằng chứng (Netlify Blobs) từ database cũ sang database mới khi deploy bằng khoi-phuc.
// Kho đi theo tên database (server/src/platform/khoTep.ts tenKhoTep): bang-chung-<tên máy chủ trước dấu chấm đầu>.
// Chỉ ĐỌC kho cũ; kho mới: chỉ thêm tệp còn thiếu (chạy lại được, không đè).
// Dùng: $env:NETLIFY_SITE_ID, $env:NETLIFY_AUTH_TOKEN, $env:DB_CU, $env:DB_MOI (URL libsql://… của hai database) → node scripts/chep-kho-tep.mjs
import { getStore } from '@netlify/blobs';

const { NETLIFY_SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token, DB_CU, DB_MOI } = process.env;
if (!siteID || !token || !DB_CU || !DB_MOI) {
  console.error('[chep-kho-tep] Thiếu biến: NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN, DB_CU, DB_MOI.');
  process.exit(1);
}
const ten = (url) => `bang-chung-${url.replace(/^[a-z]+:\/\//i, '').split('.')[0]}`.slice(0, 64);
const cu = ten(DB_CU), moi = ten(DB_MOI);
if (cu === moi) { console.error(`[chep-kho-tep] Hai kho trùng tên (${cu}) — kiểm lại DB_CU / DB_MOI.`); process.exit(1); }
const khoCu = getStore({ name: cu, siteID, token });
const khoMoi = getStore({ name: moi, siteID, token });
console.log(`[chep-kho-tep] ${cu} → ${moi}`);
const { blobs } = await khoCu.list();
let chep = 0, coSan = 0;
for (const { key } of blobs) {
  if (await khoMoi.getMetadata(key)) { coSan += 1; continue; }
  const r = await khoCu.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!r) continue;
  await khoMoi.set(key, r.data, { metadata: r.metadata ?? {} });
  chep += 1;
}
console.log(`[chep-kho-tep] Xong. Kho cũ ${blobs.length} tệp · đã chép ${chep} · có sẵn ${coSan}.`);
