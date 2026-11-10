/**
 * PHÉP KIỂM PR-5 MO-TAT-CA (chủ SP 05/11, đặc tả 2D, mockup v13 D1–D3):
 * Kế hoạch Test + Lịch Test tuần có MỘT nút "Mở tất cả lớp" ↔ "Thu gọn tất cả", chỉ QL / Quản trị (`nav.testPlan`, cùng quyền máy chủ PLAN_WEEK);
 * Tổng quan GV: ô "Việc của tôi" là link `/cong-viec` (góc Của tôi). Kế hoạch: docs/superpowers/plans/2026-11-05-mo-tat-ca.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8');

export async function runPrMoTatCaTests(t: YThucTestKit) {
  const { check, assert, P } = t;
  const { navOf } = await import('../platform/nav.ts');
  const { EN } = await import('../../../shared/i18n/en.ts') as any;
  console.log('\nPR-5 MO-TAT-CA · nút Mở tất cả lớp + ô Việc của tôi → Công việc');

  check('MTC-1 · cờ quyền: QL / Quản trị có testPlan, GV không', () => {
    assert(navOf(P.admin).testPlan && navOf(P.mbManager).testPlan, 'QT, QL: có testPlan');
    assert(!navOf(P.lrTeacher).testPlan && !navOf(P.coreTeacher).testPlan, 'GV: không testPlan');
  });

  for (const [ten, tep, dsLop] of [['Kế hoạch Test', 'web/src/modules/test/KeHoachTestTab.tsx', 'danhSach'], ['Lịch Test tuần', 'web/src/modules/test/LichTestTab.tsx', 'lopTab']] as const) {
    check(`MTC-2 · ${ten}: nút chỉ QL / QT, đổi chữ Mở tất cả lớp ↔ Thu gọn tất cả`, () => {
      const s = doc(tep);
      assert(new RegExp(`const nutMoHet = !!session\\?\\.nav\\?\\.testPlan && ${dsLop}\\.length > 0`).test(s), 'nút gác bởi nav.testPlan');
      assert(/\{moHet(Lop)? \? t\('Thu gọn tất cả'\) : t\('Mở tất cả lớp'\)\}/.test(s), 'một nút đổi chữ');
      assert(/\{nutMoHet\}/.test(s), 'nút có trên trang');
    });
  }

  check('MTC-3 · Lịch Test: thu gọn khi còn ô chưa lưu thì hỏi trước (chống mất dữ liệu)', () => {
    const s = doc('web/src/modules/test/LichTestTab.tsx');
    const f = s.slice(s.indexOf('const doiMoHet'), s.indexOf('const nutMoHet'));
    assert(/chuaLuu\[khoaHang\(l\)\]/.test(f) && /setHoiBo\(/.test(f), 'đếm ô chưa lưu + hộp hỏi');
  });

  check('MTC-4 · Tổng quan GV: ô Việc của tôi là link /cong-viec', () => {
    const s = doc('web/src/modules/worklist/TongQuanV5.tsx');
    /* XM 3 (rà 11/11): ô là component chung `OViecCuaToi` (GV · QL · TVV · Admin) — Link ở đó, GV dùng component. */
    const gv = s.slice(s.indexOf('export function TongQuanGvV5'), s.indexOf('/* ───────────── TVV'));
    const o = s.slice(s.indexOf('export function OViecCuaToi'), s.indexOf('/* ───────────── GV'));
    assert(/<OViecCuaToi \/>/.test(gv) && /<Link to="\/cong-viec"[^\n]*>\{o\}<\/Link>/.test(o), 'cả ô bọc Link /cong-viec');
  });

  check('MTC-5 · EN có đủ chữ mới', () => {
    for (const k of ['Mở tất cả lớp', 'Thu gọn tất cả', 'Thu gọn tất cả?', 'Bỏ, thu gọn']) assert(!!EN[k], `thiếu EN: ${k}`);
  });
}
