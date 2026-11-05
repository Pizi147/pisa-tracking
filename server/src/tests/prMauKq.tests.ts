/**
 * PHÉP KIỂM PR-6 MAU-THONG-NHAT (chủ SP 05/11): màu kết quả toàn web — đỏ = không đạt · xanh dương = vừa đạt · xanh lá = vượt (exceed).
 * Nhãn chỉ Đạt / Chưa đạt (không biết vượt) → Đạt xanh dương. Kiểm kê: docs/anh/mau-thong-nhat/kiem-ke.md.
 * Quét nguồn `web/src` (trừ `dev/` và vùng session khác đang sửa: `phanTich/`, `BangLuotPanel`, `OSo` — PTA chuyển PR-1..4).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8');
const taiTsx = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) taiTsx(p, out); else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
};
const MIEN = /[\\/](dev|phanTich)[\\/]|BangLuotPanel\.tsx$|OSo\.tsx$/;

export async function runPrMauKqTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-6 MAU-THONG-NHAT · màu kết quả (đỏ không đạt · xanh dương đạt · xanh lá vượt)');
  const tep = taiTsx(path.join(REPO, 'web/src')).filter((p) => !MIEN.test(p));

  check('MK-1 · lopKq: dat / bang → xanh dương, vuot → xanh lá, duoi → đỏ', () => {
    const s = doc('web/src/ui/BieuTuong.tsx');
    assert(/kq === 'bang' \|\| kq === 'dat' \? 'text-kq-bang'/.test(s) && /kq === 'vuot' \? 'text-kq-vuot'/.test(s) && /kq === 'duoi' \? 'text-kq-duoi'/.test(s), 'lopKq');
  });

  check('MK-2 · Hồ sơ GV: Fail đỏ · Pass xanh dương · Exceed xanh lá', () => {
    const s = doc('web/src/modules/giaoVien/HoSoGiaoVienPage.tsx');
    assert(s.includes("const MAU_THI = { chua: lopKq('duoi'), dat: lopKq('bang'), vuot: lopKq('vuot') }"), 'MAU_THI');
  });

  check('MK-3 · nhãn Đạt dùng chung (SCORE_CHIP / SCORE_TEXT emerald, NhanKq dat) xanh dương', () => {
    const ui = doc('web/src/ui/ui.tsx'), nhan = doc('web/src/ui/Nhan.tsx');
    assert(/emerald: 'bg-\[color:var\(--surface\)\] text-kq-bang border-doing-line'/.test(ui) && /emerald: 'text-kq-bang'/.test(ui), 'SCORE_CHIP / SCORE_TEXT');
    assert(/dat: \{ lop: 'text-kq-bang border-doing-line'/.test(nhan), 'NhanKq dat');
  });

  check('MK-4 · không còn nhãn "Đạt" / "Đạt Target" / pass tô xanh lá (text-ok, text-dat, kq-vuot, tone ok)', () => {
    const sai: string[] = [];
    const XANH_LA = /text-ok\b|text-dat\b|text-kq-vuot|tone=["{]['"]?ok\b|tone: 'ok'|\? 'ok'|\? 'vuot' :|'duoi' : 'vuot'/;
    const DAT = /t\('Đạt'\)|'Đạt Target'|t\('Đạt Target|ketLuan === 'reached'|ketQua === 'pass'|outcome === 'pass'|ketQua === 'dat'|\.dat \?|dat \? |muc <= 0|r\.missed/;
    for (const p of tep) {
      doc(path.relative(REPO, p)).split('\n').forEach((d, i) => { if (DAT.test(d) && XANH_LA.test(d)) sai.push(`${path.relative(REPO, p)}:${i + 1}`); });
    }
    assert(!sai.length, `còn Đạt xanh lá: ${sai.join(', ')}`);
  });

  check('MK-5 · "Chưa đạt" / không đạt không tô vàng (soon / warn)', () => {
    const sai: string[] = [];
    for (const p of tep) {
      doc(path.relative(REPO, p)).split('\n').forEach((d, i) => {
        if (/k\.dat === false \? 'bg-soon-bg|finalDat \? 'ok' : 'soon'|g\.dat === g\.tong \? '\w+' : 'soon'|d === 'dat' \? '\w+' : d \? 'soon'|dat \? 'ok' : 'warn'/.test(d)) sai.push(`${path.relative(REPO, p)}:${i + 1}`);
      });
    }
    assert(!sai.length, `chưa đạt còn vàng: ${sai.join(', ')}`);
  });

  check('MK-6 · lớp thường pass / fail: kqSo trả "dat" (xanh dương), ODiem đọc "Đạt"', () => {
    assert(/dat \? \(v >= kv - 1e-9 \? 'dat' : 'duoi'\)/.test(doc('web/src/modules/students/BieuDoD.tsx')), 'kqSo');
    assert(/kq === 'dat' \? t\('Đạt'\)/.test(doc('web/src/ui/ODiem.tsx')), 'ODiem chữ Đạt');
  });

  check('MK-7 · số tỉ lệ trung tính: ô "Đạt …%" đầu trang lớp không tô màu', () => {
    assert(!/text-dat\b/.test(doc('web/src/modules/classes/DauTrangLop.tsx')), 'DauTrangLop');
  });
}
