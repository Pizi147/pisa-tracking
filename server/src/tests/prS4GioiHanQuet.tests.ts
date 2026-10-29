/**
 * PHÉP KIỂM S4 (giảm dòng đọc Turso, PTA 30/10): lượt quét ở đường đọc (`quetYeuCau`, dời lịch quá hạn ở /my-work) giới hạn theo tiến trình —
 * bỏ qua khi đã quét < 60 s VÀ từ đó không có ghi nào ngoài request GET. Ghi (request ghi, lệnh, phép kiểm) → lần đọc kế quét ngay.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
const ngu = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function runPrS4GioiHanQuetTests(t: any) {
  const { check, checkAsync, assert, conn } = t;
  console.log('\nS4 · giới hạn lượt quét ở đường đọc (không quét lại khi chưa có ghi, < 60 s)');
  const ng: any = await import('../platform/nguCanhRequest.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { demoToday }: any = await import('../demoConfig.ts');
  const get = <T,>(fn: () => T): T => ng.chayTrongRequest('GET', fn);
  /* Ghi vô hại: không dòng nào khớp nhưng vẫn là `run` / `exec`. */
  const ghiRun = () => conn.prepare('UPDATE users SET id = id WHERE id = -1').run();

  await checkAsync('S4-1 · quetGioiHan: GET lặp không ghi → chạy MỘT lần; ghi ngoài GET (run / exec) → chạy lại ngay; hết hạn → chạy lại', async () => {
    let n = 0;
    const quet = () => get(() => ng.quetGioiHan('s4-thu', () => { n++; }, 200));
    quet(); quet(); quet();
    assert(n === 1, `GET lặp không ghi: ${n} lần`);
    ghiRun(); quet();
    assert(n === 2, `sau run ngoài GET: ${n}`);
    conn.exec('SELECT 1'); quet();
    assert(n === 3, `sau exec ngoài GET: ${n}`);
    quet();
    assert(n === 3, `không ghi thêm: ${n}`);
    await ngu(260); quet();
    assert(n === 4, `hết hạn 200 ms: ${n}`);
  });

  check('S4-2 · ghi TRONG request GET (chính lượt quét, mốc phiên) không làm quét lại; ghi trong request POST thì có', () => {
    let n = 0;
    const quet = () => get(() => ng.quetGioiHan('s4-get', () => { n++; }));
    quet();
    get(() => ghiRun()); quet();
    assert(n === 1, `ghi trong GET làm quét lại: ${n}`);
    ng.chayTrongRequest('POST', () => ghiRun()); quet();
    assert(n === 2, `ghi trong POST không làm quét lại: ${n}`);
  });

  check('S4-3 · quetYeuCau: GET thứ hai không ghi gì → 0 câu SQL; sau một lần ghi → quét lại (có câu); ngày khác → quét', () => {
    const cau = (fn: () => void) => { const a = ng.soCauSql(); fn(); return ng.soCauSql() - a; };
    const homNay = demoToday();
    const quet = (ngay?: string) => cau(() => get(() => yc.quetYeuCau(ngay ?? homNay)));
    ghiRun();
    const dau = quet();
    assert(dau > 0, `lần đầu sau ghi phải quét: ${dau} câu`);
    const lai = quet();
    assert(lai === 0, `GET lặp không ghi vẫn quét: ${lai} câu`);
    ghiRun();
    assert(quet() > 0, 'sau ghi không quét lại');
    assert(quet('2099-01-05') > 0, 'ngày khác không quét');
  });

  check('S4-4 · nối đúng chỗ: quetYeuCau + dời quá hạn ở /my-work qua quetGioiHan; lệnh định kỳ (chot-vang) vẫn quét thẳng; db.ts đếm ghi ở run + exec', () => {
    assert(/quetGioiHan\(`yeu-cau:\$\{homNay\}`, \(\) => quetThat\(homNay\)\)/.test(doc('server/src/duyet/yeuCau.ts')), 'quetYeuCau');
    assert(/quetGioiHan\('doi-qua-han', \(\) => \{ sweepExpiredMoves\(\); \}\)/.test(doc('server/src/worklist/mywork.ts')), 'mywork');
    assert(/try \{ sweepExpiredMoves\(\); \}/.test(doc('server/src/ops/chotVangDinhKy.ts')), 'chot-vang phải quét thẳng');
    const d = doc('server/src/db.ts');
    assert(/if \(ten === 'run'\) \{ xoaNho\(\); daGhiDb\(\); \}/.test(d) && /Database\.prototype\.exec = function[\s\S]{0,80}daGhiDb\(\)/.test(d), 'db.ts đếm ghi');
  });
}
