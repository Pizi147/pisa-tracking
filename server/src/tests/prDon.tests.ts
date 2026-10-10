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
  const require_kv: any = await import('../normal/kyVong.ts');
  const require_kh: any = await import('../keHoach/keHoachTest.ts');
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

  check('DON-2 · dòng gộp: dòng phụ của từng em lấy từ `phu` của việc, không cắt tiêu đề — "Thêm PA học thuật Speaking" → "Speaking"; đổi chữ tiêu đề không đổi dòng phụ', () => {
    const v = (o: Record<string, unknown>) => ({
      key: 'k', group: 'no_plan', urgency: 'normal', due: null, studentId: 1, studentName: 'An', classId: 10, classCode: 'MB FOU 15', khung: 'thuong', ownerId: 7,
      tieuDe: 'Thêm PA học thuật Speaking', phu: 'Speaking', contextLabel: null, count: null, href: '/hoc-vien/1', actionLabel: 'Thêm PA', ...o,
    });
    const nhan = (g: string) => ({ no_plan: 'Thiếu PA học thuật', baoph: 'Báo phụ huynh qua TVV' } as any)[g] ?? g;
    const [g] = d.gopViecTheoLop([v({ key: 'support:1' }), v({ key: 'support:2', studentId: 2, studentName: 'Bình', tieuDe: 'Thêm PA học thuật Reading', phu: 'Reading' })], nhan) as any[];
    assert(g.con?.length === 2, 'phải gộp');
    const phu = Object.fromEntries(g.con.map((c: any) => [c.conTen, c.conPhu]));
    assert(phu.An === 'Speaking' && phu['Bình'] === 'Reading', `dòng phụ: ${JSON.stringify(phu)}`);
    const [h] = d.gopViecTheoLop([v({ key: 'a', tieuDe: 'Chữ mới hoàn toàn · An · Speaking' }), v({ key: 'b', studentId: 2, studentName: 'Bình', tieuDe: 'Chữ mới hoàn toàn · Bình · Speaking' })], nhan) as any[];
    assert(h.con.every((c: any) => c.conPhu === 'Speaking'), `đổi chữ tiêu đề: ${h.con.map((c: any) => c.conPhu)}`);
  });

  check('DON-3 · Kỳ vọng đầu ra: người không quyền → 403 cho cả lớp có thật lẫn id không tồn tại (không lộ lớp có hay không); Quản trị id lạ → 404', () => {
    const kv = require_kv;
    const be = (conn.prepare(`SELECT id FROM classes WHERE programme_code = 'BE' AND status = 'active' ORDER BY id LIMIT 1`).get() as any).id as number;
    const ma = (f: () => unknown) => { try { f(); return 200; } catch (e: any) { return e.status; } };
    const gv = P.coreTeacher;
    assert(ma(() => kv.panelKyVong(gv, be)) === 403, `lớp có thật: ${ma(() => kv.panelKyVong(gv, be))}`);
    assert(ma(() => kv.panelKyVong(gv, 9_999_999)) === 403, `id không tồn tại: ${ma(() => kv.panelKyVong(gv, 9_999_999))}`);
    assert(ma(() => kv.panelKyVong(P.admin, 9_999_999)) === 404, `Quản trị id lạ: ${ma(() => kv.panelKyVong(P.admin, 9_999_999))}`);
  });

  check('DON-5 · docFtTheoLo (xếp MT hàng loạt): mọi câu ≤ 900 tham số khi danh sách em / lượt lớn (Turso); kết quả như đọc một lần', () => {
    const kh: any = require_kh;
    const that = (conn.prepare('SELECT id FROM students ORDER BY id').all() as any[]).map((r) => r.id as number);
    const ids = [...that, ...Array.from({ length: Math.max(0, 1000 - that.length) }, (_, i) => 9_000_000 + i)];
    const goc = conn.prepare;
    let maxTs = 0;
    (conn as any).prepare = function (sql: string) { maxTs = Math.max(maxTs, (sql.match(/\?/g) ?? []).length); return goc.call(this, sql); };
    let lo: any;
    try { lo = kh.docFtTheoLo(ids); } finally { delete (conn as any).prepare; }
    assert(maxTs <= 900, `câu có ${maxTs} tham số`);
    const mot = kh.docFtTheoLo(that.slice(0, 50));
    assert(lo.cycleCua.size >= mot.cycleCua.size && [...mot.cycleCua].every(([sid, c]: any) => lo.cycleCua.get(sid)?.id === c.id), 'lộ trình hiện tại khác khi đọc theo lô');
  });
}
