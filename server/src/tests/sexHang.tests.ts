/**
 * PHÉP KIỂM SEX-HANG (chủ SP 06/11 "Head là Quản Lý nhé và tất nhiên Admin cũng có thể xếp"): hàng S Ex mảnh dưới hàng MT ở Kế hoạch Test.
 * Quyền ghi giữ ở máy chủ (`requireSuaLichTest`): QL + Admin đúng chi nhánh xếp / dời / xoá; GV (công tắc tắt) 403. Web: ô 1 · 2 · 3, "Xếp" chỉ ô
 * trống kế tiếp và chỉ khi xếp được (`onThem` khi không `chiXem`); chip S Ex rời cột "Thêm"; dữ liệu = `sEx` lưới đã nạp (không câu đọc thêm).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

export async function runSexHangTests(t: any) {
  const { check, assert } = t;
  console.log('\nSEX-HANG — hàng S Ex mảnh dưới hàng MT (Kế hoạch Test)');

  check('SH-1 · web: HangSEx 3 ô cố định, "Xếp" chỉ ô trống kế tiếp khi có onThem; lưới gắn hàng cho FT (1440 + 375), onThem chỉ khi không chiXem; chip S Ex rời cột Thêm', () => {
    const h = doc('web/src/modules/test/keHoach/HangSEx.tsx');
    assert(/const SO_O = 3;/.test(h) && /i === xep\.length && onThem/.test(h), 'HangSEx: 3 ô, Xếp ô kế tiếp');
    assert(/onMo && \(x\.sua \|\| x\.cham\)/.test(h), 'ô có lượt bấm được khi sửa hoặc chấm được');
    const l = doc('web/src/modules/test/keHoach/LuoiKeHoach.tsx');
    assert((l.match(/<HangSEx /g) ?? []).length === 2, 'hai chỗ: bảng 1440 + thẻ 375');
    assert((l.match(/onThem=\{chiXem \? undefined :/g) ?? []).length === 2, 'Xếp chỉ khi không chỉ xem');
    assert(!/border-\[var\(--hong\)\]/.test(l), 'chip S Ex cũ ở cột Thêm đã bỏ');
    assert((l.match(/<HopSEx /g) ?? []).length === 2, 'hộp S Ex có ở cả 1440 và 375');
  });
  if (!t.conn) return;

  const { conn, P } = t;
  const sEx: any = await import('../cham/sExpert.ts');
  const perm: any = await import('../permissions.ts');
  const msl: any = await import('../platform/moSuaLichTest.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  check('SH-2 · máy chủ: QL MB + Admin MB xếp / dời / xoá S Ex em MB; GV bộ môn, QL CP → 403 (công tắc tắt)', () => thu(() => {
    if (msl.dangMoSuaLichTest()) msl.datMoSua(P.admin, false);
    const em = get(`SELECT e.student_id AS id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE c.code = 'MB FT 101' AND e.status = 'active' LIMIT 1`).id;
    const ad = perm.loadPrincipal(get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND b.code = 'MB' LIMIT 1`).id);
    const ngay = '2026-12-01';
    for (const [ten, p] of [['QL', P.mbManager], ['Admin', ad]] as const) {
      const r = sEx.themSEx(p, { studentId: em, ngay });
      const id = r.id ?? get('SELECT MAX(id) id FROM s_expert WHERE student_id = ?', em).id;
      sEx.suaSEx(p, id, { ngay: '2026-12-08' });
      sEx.xoaSEx(p, id);
      assert(get('SELECT xoa_luc FROM s_expert WHERE id = ?', id).xoa_luc, `${ten} xoá`);
    }
    assert(ma(() => sEx.themSEx(P.subjectTeacher, { studentId: em, ngay })) === 403, 'GV bộ môn 403');
    assert(ma(() => sEx.themSEx(P.cpManager, { studentId: em, ngay })) === 403, 'QL chi nhánh khác 403');
  }));
}
