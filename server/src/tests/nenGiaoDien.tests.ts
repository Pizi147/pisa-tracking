/**
 * PHÉP KIỂM PR-UX0 — nền giao diện: màu nghĩa (N-1), hàng lớn/nhỏ (N-2), badge gọn (N-3), khuôn panel (N-4).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database (trừ phép cần dữ liệu thật).
 * Spec: docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md §1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = path.join(ROOT, '..');

export async function runNenGiaoDienTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UX0 · Nền giao diện');

  const css = fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8');
  const mau = d.docMauCss(css);

  check('UX0 · N-1: tuongPhan đúng công thức', () => {
    assert(d.tuongPhan('#000000', '#ffffff') === 21, `đen/trắng = ${d.tuongPhan('#000000', '#ffffff')}`);
    const x = d.tuongPhan('#ff9a9a', '#3b2126');
    assert(Math.abs(x - 7.22) <= 0.05, `#ff9a9a/#3b2126 = ${x}`);
    assert(d.tuongPhan([0, 0, 0], [255, 255, 255]) === 21, 'nhận cả [r,g,b]');
  });

  check('UX0 · N-1: mọi chữ màu nghĩa ≥ 4.5:1 trên nền badge của nó và trên mọi nền trang', () => {
    const hong: string[] = [];
    const cap = (chu: string, nen: string) => {
      const a = mau[chu], b = mau[nen];
      if (!a || !b) { hong.push(`thiếu token ${!a ? chu : nen}`); return; }
      const r = d.tuongPhan(a, b);
      if (r < 4.5) hong.push(`${chu} trên ${nen} = ${r}`);
    };
    const coNen = ['ok-rgb', 'done-rgb', 'bad-rgb', 'late-rgb', 'soon-rgb', 'doing-rgb', 'wait-rgb', 'muted-rgb'];
    for (const c of coNen) cap(c, c.replace('-rgb', '-bg-rgb'));
    const chu = [...coNen, 'text-dim-rgb', 'text-faint-rgb'];
    for (const c of chu) for (const n of ['bg', 'surface', 'surface-2', 'hang-lon-bg', 'hang-con-bg']) cap(c, n);
    assert(hong.length === 0, hong.join(' · '));
  });

  check('UX0 · N-1b: --dat/--sos1/--sos2/--sos3 là bí danh của ok/soon/late/bad (một bảng màu kết quả Test)', () => {
    const cung = (a: string, b: string) => mau[a] && mau[b] && mau[a].join() === mau[b].join();
    for (const [x, y] of [['dat', 'ok'], ['sos1', 'soon'], ['sos2', 'late'], ['sos3', 'bad']] as const) {
      for (const hau of ['-rgb', '-bg-rgb', '-line-rgb']) assert(cung(x + hau, y + hau), `--${x}${hau} phải bằng --${y}${hau}`);
      assert(css.includes(`--${x}-rgb: var(--${y}-rgb);`), `--${x}-rgb phải là var(--${y}-rgb), không chép hex`);
    }
    assert(!cung('sos1-rgb', 'sos2-rgb') && !cung('sos2-rgb', 'sos3-rgb'), 'SOS 1/2/3 phải khác màu nhau');
  });

  check('UX0 · N-1: một chỗ khai báo — component nền không chứa hex hay màu Tailwind cứng', () => {
    const hong: string[] = [];
    for (const f of ['web/src/ui/ui.tsx', 'web/src/ui/Han.tsx', 'web/src/ui/Nhan.tsx', 'web/src/ui/HangNhom.tsx', 'web/src/ui/KhungPanel.tsx']) {
      const p = path.join(REPO, f);
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, 'utf8');
      if (/#[0-9a-f]{6}\b/i.test(text)) hong.push(`${f}: có mã hex`);
      const m = /\b(rose|amber|sky|emerald)-\d/.exec(text);
      if (m) hong.push(`${f}: có "${m[0]}"`);
    }
    assert(hong.length === 0, hong.join(' · '));
  });

  const KINDS = ['xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'thuc-hien-y-thuc', 'hoan-thanh-y-thuc', 'nhap-diem', 'du-kien-ket-thuc', 'viec-van-hanh'] as const;

  check('UX0 · N-3: hạn hôm nay là "hôm nay", không quá hạn, không ⚠', () => {
    const v = d.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-23' });
    assert(v.homNay === true && v.tone !== 'overdue' && v.quaHan === null, `homNay=${v.homNay} tone=${v.tone}`);
    assert(!/⚠/.test(v.text) && /hôm nay/.test(v.text), `text: "${v.text}"`);
    assert(d.deadlineView({ kind: 'du-kien-ket-thuc', due: '2026-09-23', today: '2026-09-23' }).homNay === false, 'dự kiến không có "hôm nay"');
  });

  check('UX0 · N-3: không mảnh nào lặp chữ "quá hạn" hai lần và không có năm khi cùng năm', () => {
    for (const kind of KINDS) {
      for (const due of ['2026-10-05', '2026-09-23', '2026-09-08']) {
        const v = d.deadlineView({ kind, due, reschedule: '2026-10-12', today: '2026-09-23' });
        assert((v.text.match(/quá hạn/g) ?? []).length <= 1, `${kind} ${due}: "${v.text}"`);
        assert(!/\/2026/.test(v.text) && !/\/2026/.test(v.han), `${kind} ${due}: có năm trong "${v.text}"`);
      }
    }
  });
}
