/**
 * PR-DON · dọn ghi chú cũ (plan.md "BẢN TIẾP THEO" dòng 3 + 4): nhắc một lần/ngày (GOP) · dòng phụ dòng gộp từ dữ liệu việc (GOP) ·
 * kỳ vọng đầu ra 403 trước 404 (KV) · `docFtTheoLo` chia lô · Final huỷ lượt sau khi sinh sớm bổ trợ (CT2) · CT2 tự đóng Mini Test khi sang FT ·
 * HOP1-d kiểm hành vi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDonTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const nv: any = await import('../worklist/nhacViec.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nPR-DON · dọn ghi chú cũ');

  const homNay = `nhac:%:${TODAY}`;
  const xoaNhac = () => conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  const demNhac = () => (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).get(homNay) as any).n as number;

  check('DON-1 · một việc nhắc một lần/ngày: khoá từng việc và khoá gop: dùng chung — nhắc qua khoá này thì khoá kia "đã nhắc", không thêm chuông', () => {
    xoaNhac();
    const ql = P.mbManager;
    /* Việc lẻ của GV khác thuộc một dòng gộp được (lớp đó chỉ còn MỘT việc cùng loại) — hiện là dòng lẻ với khoá riêng. */
    const viec = (mywork.myWork(ql, { nguoi: 'tat-ca' }).items as any[]).find((it) => {
      const k = d.khoaGopCua(it);
      if (!it.nhac || !k) return false;
      const cua = mywork.myWork(loadPrincipal(it.nhac.ownerId)) as any;
      return !(cua.dong as any[]).some((x) => x.key === k) && (cua.items as any[]).some((x) => x.key === it.key);
    });
    assert(!!viec, 'seed có việc lẻ để thử');
    const kGop = d.khoaGopCua(viec), ai = viec.nhac.ownerId;
    for (const [dau, sau] of [[kGop, viec.key], [viec.key, kGop]]) {
      xoaNhac();
      const r1 = nv.nhacViecNhieu(ql, [{ the: null, key: dau, ownerId: ai }], { boQuaDaNhacTruoc: false });
      assert(r1.ok.length === 1 && r1.ok[0].moi, `lần đầu (${dau}): ${JSON.stringify(r1)}`);
      const truoc = demNhac();
      const r2 = nv.nhacViecNhieu(ql, [{ the: null, key: sau, ownerId: ai }], { boQuaDaNhacTruoc: false });
      assert(r2.ok.length === 1 && !r2.ok[0].moi && r2.ok[0].daNhacLuc === r1.ok[0].daNhacLuc, `lần hai (${sau}) nhắc lại: ${JSON.stringify(r2)}`);
      assert(demNhac() === truoc, `thêm chuông: ${demNhac() - truoc}`);
      const lai = (mywork.myWork(ql, { nguoi: 'tat-ca' }).dong as any[]).find((x) => x.key === viec.key);
      assert(lai?.nhac?.daNhacLuc, `dòng việc phải hiện đã nhắc sau khi nhắc qua ${dau}`);
    }
    xoaNhac();
  });
}
