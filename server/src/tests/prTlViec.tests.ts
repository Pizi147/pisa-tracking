/**
 * PHÉP KIỂM TL-VIEC (TRANG-LON S3, kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`): `myWork` nạp chung một lần mỗi request —
 * không đổi con số, thứ tự, nội dung việc (`TV · giống hệt bản chụp`, so với bản chụp `origin/main` — `soGoc.ts`).
 */
import { chupHoacSo } from './soGoc.ts';

export async function runPrTlViecTests(t: any) {
  const { check, P } = t;
  console.log('\nTL-VIEC · myWork nạp chung một lần mỗi request');
  const { db } = await import('../db.ts');
  const { chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const { can, loadPrincipal } = await import('../permissions.ts');
  const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
  const { myWork, viecCuaNguoi, NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { phamViXemViec } = await import('../worklist/xemViec.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');

  const c = () => db() as any;
  const ids = (sql: string, ...a: unknown[]) => (c().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
  const motTrongRequest = (fn: () => unknown) => chayTrongRequest('GET', () => {
    try { return fn(); } catch (e: any) { if (e?.status === 403) return '403'; throw e; }
  });

  check('TV · giống hệt bản chụp', () => chupHoacSo('tl-viec', () => {
    const out: Record<string, unknown> = {};
    const nguoi = ids(`SELECT id FROM users WHERE status = 'active' AND deleted_at IS NULL ORDER BY id`);
    const chiNhanh = [null, ...ids('SELECT id FROM branches ORDER BY id')];
    for (const uid of nguoi) {
      const p = loadPrincipal(uid);
      const coKhu = can(p, PERMISSIONS.WORK_VIEW, { anyScope: true });
      for (const branchId of chiNhanh) {
        const b = branchId ?? '-';
        out[`myWork:${uid}:toi:${b}`] = motTrongRequest(() => myWork(p, { branchId, ...(coKhu ? {} : { chiNhom: NHOM_VIEC_TVV }) }));
        if (coKhu && phamViXemViec(p)) out[`myWork:${uid}:tat-ca:${b}`] = motTrongRequest(() => myWork(p, { branchId, nguoi: 'tat-ca' }));
      }
    }
    const ql = P.mbManager.userId as number;
    const gvMb = ids(`SELECT DISTINCT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN branches b ON b.id = c.branch_id
       WHERE b.code = 'MB' ORDER BY 1`);
    for (const gv of gvMb) out[`viecCuaNguoi:${ql}:${gv}`] = motTrongRequest(() => viecCuaNguoi(loadPrincipal(ql), gv));
    const tvv = ids(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY 1 LIMIT 1`)[0];
    const vai = [ql, P.admin.userId, P.coreTeacher.userId, P.subjectTeacher.userId, P.normalCoreTeacher.userId, tvv];
    for (const lop of ids(`SELECT id FROM classes WHERE status = 'active' ORDER BY id`)) {
      for (const uid of vai) out[`viecTheoEm:${uid}:${lop}`] = motTrongRequest(() => viecTheoEmCuaLop(loadPrincipal(uid), lop));
    }
    return out;
  }));
}
