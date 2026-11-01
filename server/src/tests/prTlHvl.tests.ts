/**
 * PHÉP KIỂM TL-HVL (TRANG-LON S3, kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`): `/hoc-vien-lop`, `overview`, `roster` dùng chung ghi danh / Case / lượt —
 * không đổi con số, danh sách (`HVL · giống hệt bản chụp`, so với bản chụp `origin/main` — `soGoc.ts`).
 */
import { chupHoacSo } from './soGoc.ts';

export async function runPrTlHvlTests(t: any) {
  const { check, P } = t;
  console.log('\nTL-HVL · Học viên & Lớp, hồ sơ lớp dùng chung ghi danh / Case / lượt');
  const { db } = await import('../db.ts');
  const { chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { classOverview, classRoster } = await import('../classes/classes.ts');
  const { danhSachHocVienLop } = await import('../classes/hocVienLop.ts');

  const c = () => db() as any;
  const ids = (sql: string, ...a: unknown[]) => (c().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
  const motTrongRequest = (fn: () => unknown) => chayTrongRequest('GET', () => {
    try { return fn(); } catch (e: any) { if (e?.status === 403) return '403'; throw e; }
  });
  const vaiDau = (key: string) => ids(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY 1 LIMIT 1`, key)[0];

  check('HVL · giống hệt bản chụp', () => chupHoacSo('tl-hvl', () => {
    const out: Record<string, unknown> = {};
    const hoSoLop = [P.mbManager.userId, P.admin.userId, P.coreTeacher.userId, P.subjectTeacher.userId, P.normalCoreTeacher.userId] as number[];
    const chiNhanh = [null, ...ids('SELECT id FROM branches ORDER BY id')];
    for (const uid of [...hoSoLop, vaiDau('consultant'), vaiDau('cx'), vaiDau('office_admin')]) {
      const p = loadPrincipal(uid);
      for (const them of [false, true]) {
        out[`hvl:${uid}:-:-:${+them}`] = motTrongRequest(() => danhSachHocVienLop(p, { them }));
        for (const branchId of chiNhanh) out[`hvl:${uid}:chi-nhanh:${branchId ?? '-'}:${+them}`] = motTrongRequest(() => danhSachHocVienLop(p, { phamVi: 'chi-nhanh', branchId, them }));
      }
    }
    /* Cả lớp đã kết thúc (nhánh `finished` của hai hàm) + `kemKetThuc` của Học viên & Lớp. */
    for (const lop of ids('SELECT id FROM classes ORDER BY id')) {
      for (const uid of hoSoLop) {
        const p = loadPrincipal(uid);
        out[`overview:${uid}:${lop}`] = motTrongRequest(() => classOverview(p, lop));
        out[`roster:${uid}:${lop}`] = motTrongRequest(() => classRoster(p, lop));
        out[`rosterKt:${uid}:${lop}`] = motTrongRequest(() => classRoster(p, lop, undefined, true));
      }
    }
    return out;
  }));
}
