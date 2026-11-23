// T8 (rà 24/11): Công việc — panel việc đang mở thì lưu xong KHÔNG tải lại `/my-work`; đóng panel tải lại MỘT lần và danh sách là bản mới.
// Chạy trên dev server có DB thử (tạo 3 việc Vận hành cho QL 2 + 1 việc "người khác vừa giao" giữa chuỗi; GHI vào DB đang chạy):
//   KHUNG_BASE=http://localhost:<WEB_PORT> API_BASE=http://localhost:<PORT>/api node scripts/kiem-t8-cong-viec.mjs [ảnh giữa chuỗi.png]
// Playwright: `npm i --no-save playwright` hoặc PW=<đường tới playwright>.
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const BASE = process.env.KHUNG_BASE ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const API = process.env.API_BASE ?? `http://localhost:${process.env.PORT ?? 4000}/api`;
const QL = 2;
const ma = `T8k${Date.now() % 100000}`;

const r = await fetch(`${API}/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: QL }) });
const ck = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
const taoViec = async (ten) => {
  const x = await fetch(`${API}/mgmt-tasks`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify({ title: ten, assigneeUserId: QL, due: '2026-11-20', taskType: 'in_period' }) });
  assert.equal(x.status, 200, `tạo việc ${ten}: ${await x.text()}`);
};
for (const i of [1, 2, 3]) await taoViec(`${ma} ${i}`);

const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
const p = await (await trinh.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })).newPage();
await p.goto(BASE);
await p.evaluate((id) => fetch('/api/demo/session', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: id }) }), QL);
await p.goto(`${BASE}/cong-viec?nhom=van-hanh`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
let myWork = 0;
p.on('request', (q) => { if (q.method() === 'GET' && /\/api\/my-work(\?|$)/.test(q.url())) myWork += 1; });
const dong = (i) => p.locator('main [data-khoa]').getByText(`${ma} ${i}`, { exact: true });
const xong = async (i) => {
  await dong(i).first().click();
  await p.waitForTimeout(900);
  const panel = p.locator('section[tabindex]').last();
  await panel.getByRole('button', { name: 'Cập nhật tiến độ' }).click();
  await panel.getByRole('radio', { name: 'Hoàn thành' }).or(panel.getByRole('button', { name: 'Hoàn thành', exact: true })).first().click();
  await panel.getByRole('button', { name: 'Lưu', exact: true }).click();
  await p.waitForTimeout(1500);
};

await xong(1);
await taoViec(`${ma} moi`);   // người khác vừa giao (client khác — trang không biết)
await xong(2);
if (process.argv[2]) await p.screenshot({ path: process.argv[2] });
assert.equal(myWork, 0, 'panel mở: lưu xong không GET /my-work');
assert.equal(await dong(3).count(), 1, 'việc chưa làm vẫn ở danh sách');
assert.equal(await dong('moi').count(), 0, 'chưa tải lại: việc mới giao chưa hiện');
await p.waitForTimeout(10_000);   // dải ✓ hết giờ
assert.equal(await dong(1).count() + await dong(2).count(), 0, 'việc vừa xong không hiện lại khi dải hết (danh sách chưa tải lại)');

await p.locator('section[tabindex]').last().getByRole('button', { name: 'Đóng', exact: true }).last().click();
await p.waitForTimeout(2500);
assert.equal(myWork, 1, 'đóng panel: tải lại /my-work đúng MỘT lần');
assert.equal(await dong('moi').count(), 1, 'đóng panel: danh sách mới (việc vừa giao hiện)');
assert.equal(await dong(1).count() + await dong(2).count(), 0, 'đóng panel: việc đã xong không còn');
console.log(`T8 đạt: chuỗi 2 việc 0 GET /my-work · đóng panel 1 GET · danh sách mới (${ma})`);
await trinh.close();
