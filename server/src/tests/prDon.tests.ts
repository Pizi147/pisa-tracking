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
  const { loadPrincipal } = await import('../permissions.ts');
  const require_kv: any = await import('../normal/kyVong.ts');
  const require_kh: any = await import('../keHoach/keHoachTest.ts');
  console.log('\nPR-DON · dọn ghi chú cũ');

  const homNay = `nhac:%:${TODAY}`;
  const xoaNhac = () => conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  const demNhac = () => (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).get(homNay) as any).n as number;

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
