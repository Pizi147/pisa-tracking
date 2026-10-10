/** PHÉP KIỂM PR-TD3 — tốc độ đợt 2: đọc ít dòng (kế hoạch 2026-10-09-pr-td3-toc-do-doc-it-dong.md). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTd3Tests(t: YThucTestKit) {
  const { check, assert, P, TODAY } = t;
  const ngu: any = await import('../platform/nguCanhRequest.ts');
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  console.log('\nPR-TD3 · Đọc ít dòng');

  check('TD3-0-1 · bộ đếm request giữ top 3 câu đọc nhiều dòng nhất (Lịch Test, QL): ≤ 3, giảm dần, tổng ≤ dem.dong', () => {
    const dem = ngu.chayTrongRequest('GET', () => {
      cham.lichTest(P.mbManager, week.ensurePeriod(TODAY).id, null, TODAY, { phamVi: null, classId: null });
      return ngu.demHienTai();
    });
    const top = dem.top as Array<{ sql: string; dong: number }>;
    assert(Array.isArray(top) && top.length > 0 && top.length <= 3, `top phải có 1–3 câu: ${JSON.stringify(top)}`);
    for (let i = 1; i < top.length; i++) assert(top[i - 1].dong >= top[i].dong, `top phải giảm dần: ${JSON.stringify(top)}`);
    assert(top.every((c) => c.sql.length <= 80 && !/\s\s/.test(c.sql)), `sql = 80 ký tự đầu, gộp khoảng trắng: ${JSON.stringify(top)}`);
    const tong = top.reduce((s, c) => s + c.dong, 0);
    assert(tong <= dem.dong, `tổng top ${tong} > dem.dong ${dem.dong}`);
  });
}
