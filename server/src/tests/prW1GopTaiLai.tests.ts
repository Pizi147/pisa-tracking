/**
 * PHÉP KIỂM W1 (giảm dòng đọc Turso, PTA 30/10): lưu MỖI ô điểm từng vô hiệu ngay /classes, /my-work, /students, /tong-quan, /attempts → mỗi ô
 * kéo cả lưới lớp + /my-work tải lại. Nay gộp: một tiền tố vô hiệu MỘT lần 1,5 s sau lần lưu cuối; trang gắn / đổi đường khớp thì xả ngay.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
const ngu = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function runPrW1GopTaiLaiTests(t: YThucTestKit) {
  const { check, checkAsync, assert } = t;
  console.log('\nW1 · gộp tải lại sau khi lưu điểm (≤ 1 lần vô hiệu mỗi tiền tố trong 1,5 s)');
  const api: any = await import('../../../web/src/lib/api.ts');
  const DS = ['/attempts', '/tong-quan', '/classes', '/students', '/my-work'];

  await checkAsync('W1-1 · 5 ô lưu liên tiếp → mỗi tiền tố vô hiệu ĐÚNG MỘT lần, sau 1,5 s yên; trước đó 0 lần', async () => {
    const dem = new Map<string, number>();
    const go = api.onInvalidate((p: string | null) => { if (p) dem.set(p, (dem.get(p) ?? 0) + 1); });
    try {
      for (let i = 0; i < 5; i++) { api.invalidateGop(...DS); await ngu(100); }
      assert(dem.size === 0, `chưa hết 1,5 s đã vô hiệu: ${JSON.stringify([...dem])}`);
      await ngu(api.GOP_VO_HIEU_MS + 200);
      assert(DS.every((p) => dem.get(p) === 1) && dem.size === DS.length, `sau 1,5 s: ${JSON.stringify([...dem])}`);
    } finally { go(); }
  });

  await checkAsync('W1-2 · trang gắn đường khớp (xaGop(path)) → xả NGAY đúng tiền tố đó; tiền tố khác vẫn chờ tới hẹn; xaGop() xả hết', async () => {
    const dem = new Map<string, number>();
    const go = api.onInvalidate((p: string | null) => { if (p) dem.set(p, (dem.get(p) ?? 0) + 1); });
    try {
      api.invalidateGop(...DS);
      api.xaGop('/my-work?nguoi=7');
      assert(dem.get('/my-work') === 1 && dem.size === 1, `xả theo đường: ${JSON.stringify([...dem])}`);
      api.xaGop();
      assert(DS.every((p) => dem.get(p) === 1), `xả hết: ${JSON.stringify([...dem])}`);
      await ngu(api.GOP_VO_HIEU_MS + 200);
      assert(DS.every((p) => dem.get(p) === 1), `hẹn cũ không được vô hiệu lần hai: ${JSON.stringify([...dem])}`);
    } finally { go(); }
  });

  check('W1-3 · nối đúng chỗ: ô điểm FT + lớp thường gộp (vắng / khôi phục vẫn ngay); useApi xả khi gắn / đổi đường; App xả khi đổi trang', () => {
    const se = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(/invalidateGop\(\.\.\.ds\)/.test(se) && /patch\.noShow !== undefined \|\| patch\.khoiPhuc \|\| r\?\.goVang\) ds\.forEach\(invalidate\)/.test(se), 'ScoreEntry');
    assert(!/invalidate\('\/my-work'\);\s*\/\/ PR-S6F-a/.test(se), 'ScoreEntry còn vô hiệu /my-work ngay mỗi ô');
    const lt = doc('web/src/modules/cham/LuoiThuong.tsx');
    assert(/'noShow' in body\) ds\.forEach\(invalidate\); else invalidateGop\(\.\.\.ds\)/.test(lt), 'LuoiThuong');
    assert(/if \(currentPath\.current !== path\) \{\s*xaGop\(path\)/.test(doc('web/src/lib/useApi.ts')), 'useApi.batDauTai phải xả trước khi dùng bản lưu');
    assert(/useEffect\(\(\) => \{ xaGop\(\); \}, \[location\.pathname\]\)/.test(doc('web/src/App.tsx')), 'App phải xả khi đổi trang');
  });
}
