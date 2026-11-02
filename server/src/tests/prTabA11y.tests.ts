/**
 * PHÉP KIỂM TAB-A11Y (backlog plan.md, nguồn rà #736 + #754). Đọc nguồn khi không kiểm được hành vi:
 *   TA-1  thành phần tab chung: ←/→/Home/End + tabindex luân chuyển + aria-controls theo `panelId`
 *   TA-2  mọi `role="tab"` trong web đi qua phím chung (`phimHangTab`), không tab nào còn thiếu tabindex luân chuyển
 *   TA-3  panel Chưa đạt · Đạt (SoLieu) có tabpanel đúng id; đóng ô Từ chối / Trả lời trả focus về nút còn trên trang
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8').replace(/\r\n/g, '\n');
const quet = (d: string, ra: string[] = []): string[] => {
  for (const e of fs.readdirSync(path.join(REPO, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) quet(p, ra); else if (p.endsWith('.tsx')) ra.push(p);
  }
  return ra;
};

export async function runPrTabA11yTests(t: any) {
  const { check, assert } = t;
  console.log('\nTAB-A11Y');
  check('TA-1 · HangTab: phím chung, tabIndex luân chuyển, aria-controls khi có panelId', () => {
    const s = doc('web/src/ui/HangTab.tsx');
    assert(/export function phimHangTab/.test(s), 'thiếu phimHangTab');
    for (const k of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) assert(s.includes(`'${k}'`), `thiếu ${k}`);
    assert(/onKeyDown=\{phimHangTab\}/.test(s), 'tablist chưa gắn phim');
    assert(/tabIndex=\{active \? 0 : -1\}/.test(s), 'tab chưa tabIndex luân chuyển');
    assert(/aria-controls=\{panelId\}/.test(s), 'tab chưa aria-controls');
  });
  check('TA-2 · mọi tablist trong web gắn phimHangTab; mọi role="tab" có tabIndex luân chuyển', () => {
    for (const f of quet('web/src')) {
      const s = doc(f);
      if (!/role="tablist"/.test(s) && !/role="tab"/.test(s)) continue;
      assert(/phimHangTab|phimTab/.test(s), `${f}: tablist chưa có phím ← →`);
      for (const m of s.matchAll(/<button[^>]*role="tab"[\s\S]*?>/g)) assert(/tabIndex=/.test(m[0]), `${f}: tab thiếu tabIndex`);
    }
  });
  check('TA-3 · SoLieu: tabpanel id khớp aria-controls; TheYeuCau: đóng ô trả focus nút còn trên trang', () => {
    const s = doc('web/src/ui/SoLieu.tsx');
    assert(/aria-controls=\{idPanel\}/.test(s) && /id=\{coTab \? idPanel : undefined\} role=\{coTab \? 'tabpanel'/.test(s), 'SoLieu thiếu cặp tab/tabpanel');
    const y = doc('web/src/modules/duyet/TheYeuCau.tsx');
    assert(/const traFocus = /.test(y) && /isConnected/.test(y), 'TheYeuCau chưa có traFocus (nút gốc còn trên trang?)');
    assert(!/setTimeout\(\(\) => nutMo\.current\?\.focus\(\), 0\)/.test(y), 'còn focus thẳng nutMo');
  });
}
