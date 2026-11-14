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

  check('SH-1 · web: mỗi S Ex một ô dẹt THẲNG CỘT MT (S Ex i dưới cột MTi, dư dồn ô cuối); ô trống "+ S Ex" chỉ khi onThem (không chiXem), không thì trống nhạt; 375 thẻ ≥ 3 ô; chip S Ex rời cột Thêm', () => {
    const h = doc('web/src/modules/test/keHoach/HangSEx.tsx');
    assert(/return onThem\s*\?[\s\S]*?'\+ S Ex \{n\}'/.test(h) && /if \(onThem && soKe != null && so !== soKe\) return null;/.test(h), 'ô trống: + S Ex / không vẽ (GD-11b)');
    assert(/onMo && \(x\.sua \|\| x\.cham\)/.test(h) && /Math\.max\(3, xep\.length\)/.test(h), 'ô có lượt bấm khi sửa / chấm được; 375 ≥ 3 ô');
    const l = doc('web/src/modules/test/keHoach/LuoiKeHoach.tsx');
    assert(/cots\.map\(\(c, ci\) => \([\s\S]*?<OSEx x=\{xep\[ci\] \?\? null\} so=\{ci \+ 1\}/.test(l), 'S Ex i dưới cột MT i');
    assert(/xep\.slice\(cots\.length\)/.test(l), 'lượt dư dồn dưới ô cuối');
    assert(/const them = chiXem \? undefined :/.test(l), '+ S Ex chỉ khi không chỉ xem (GD-11b: 375 cùng lưới 1440)');
    assert(!/border-\[var\(--hong\)\]/.test(l), 'chip S Ex cũ ở cột Thêm đã bỏ');
    assert((l.match(/<HopSEx /g) ?? []).length === 1, 'hộp S Ex một chỗ (GD-11b: 375 cùng lưới 1440)');
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
