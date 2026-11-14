/**
 * TQ-VIEC-CUA-TOI ([XM 3] rà toàn bộ 11/11, chủ SP "Ok"): ô "Việc của tôi ›" ở Tổng quan cho TVV / QL / Admin (như GV) — số = `summary.viec` của `/my-work`
 * (cùng `demDongViec` với badge / Công việc), đọc chung GET `/my-work` khung App đã tải (`workSupport`) — không request mới.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrTqViecCuaToiTests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nTQ-VIEC-CUA-TOI · ô "Việc của tôi ›" ở Tổng quan mọi vai có Công việc');
  const { navOf } = await import('../platform/nav.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const s = fs.readFileSync(path.join(ROOT, 'web/src/modules/worklist/TongQuanV5.tsx'), 'utf8');
  const nguoi = (email: string) => loadPrincipal((conn.prepare('SELECT id FROM users WHERE email = ?').get(email) as any).id);

  check('XM 3 · Tổng quan QL · TVV · Admin (dải Mock Test) đều có ô "Việc của tôi ›" (một component, số từ `/my-work` khung App — không GET thêm)', () => {
    const than = (ten: string) => s.slice(s.indexOf(`export function ${ten}(`), s.indexOf('\n}\n', s.indexOf(`export function ${ten}(`)));
    /* GD-4 e: TVV dùng ô của dải mỏng (`<OViecCuaToi dai />`) — cùng component, cùng nguồn số. */
    /* GD-8: TVV — dải 5 chỉ số nay ở đầu Công việc (`DaiChiSoTvv`), ô Việc không link (đang ở Công việc). */
    for (const ten of ['TongQuanQlV5', 'DaiChiSoTvv']) assert(/<OViecCuaToi( dai)?( khongBam)? \/>/.test(than(ten)), `${ten} thiếu ô Việc của tôi`);
    /* Admin: ô đứng đầu dải ô Mock Test (4 ô một hàng). */
    assert(/<OViecCuaToi \/>/.test(fs.readFileSync(path.join(ROOT, 'web/src/modules/worklist/MockTestAdmin.tsx'), 'utf8')), 'MockTestAdmin (Tổng quan Admin) thiếu ô Việc của tôi');
    /* Không GET /my-work riêng: đọc `summary` khung App đã tải cho badge (context) — hết lần gọi đôi. */
    assert(/function OViecCuaToi\([^)]*\)[\s\S]{0,300}useSoViecCuaToi\(\)/.test(s) && !/useApi<[^>]*>\([^)]*'\/my-work'/.test(s), 'ô đọc số từ khung App, Tổng quan không GET /my-work');
    assert(/<ViecCuaToiCtx\.Provider value=\{viecGv\?\.summary \?\? null\}>/.test(fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8')), 'App cấp số Việc của tôi');
  });

  check('XM 3 · TVV · QL · Admin seed có `workSupport` (khung App đã tải /my-work cho badge → ô không thêm request)', () => {
    for (const [ten, p] of [['TVV', nguoi('mai.phan.pisa@gmail.com')], ['QL', P.mbManager], ['Admin', nguoi('xuan.pham.pisa@gmail.com')]] as const) {
      assert(navOf(p).workSupport === true, `${ten}: workSupport`);
    }
  });
}
