/**
 * PHÉP KIỂM MT-QUA-THI (chủ SP 26/11): MT chưa thi xếp SAU ngày thi → việc "MT sau ngày thi · {em}" của Head CN (`mt-thi:` ở `mywork.ts`).
 *  · MT sau ngày thi → có việc (tab Việc quản lý, mở Lịch MT tại chỗ); dời MT về trước / đổi ngày thi → hết.
 *  · em Lưu trữ, lộ trình đã có KQ thi thật, MT huỷ → không có; người không phải Head CN đó (QL chi nhánh khác, GVCN) không thấy.
 *  · Bỏ qua → ẩn, vào "Đã bỏ qua"; đổi ngày thi → hiện lại; khôi phục được. Trần câu đường ghi.
 * Mỗi ca dựng trong một giao dịch rồi cuộn lại (`thu`).
 */
export async function runPrMtQuaThiTests(t: { check: any; assert: any; conn: any; P: any; classId: (c: string) => number }) {
  const { check, assert, conn, P, classId } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { tabCuaViec } = await import('../../../shared/domain/index.ts');
  console.log('\nMT-QUA-THI · MT xếp sau ngày thi → việc Head');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number => { try { fn(); return 0; } catch (e: any) { return e?.status ?? -1; } };
  const QL = P.mbManager;
  const viec = (p = QL) => { xoaNho(); return mywork.myWork(p, { nguoi: 'tat-ca' }); };
  const tim = (key: string, p = QL) => (viec(p).items as any[]).find((x) => x.key === key);
  const truoc1 = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

  /* Một MT chưa thi có tuần của em MB FT 101; ngày thi = hôm trước tuần đó → MT sau ngày thi. */
  const dung = () => {
    const a = one(`SELECT a.id, a.cycle_id, a.student_id, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        JOIN learning_cycles lc ON lc.id = a.cycle_id JOIN students s ON s.id = a.student_id
       WHERE a.class_id = ? AND a.kind = 'mock' AND a.status = 'planned' AND a.lich_su = 0 AND lc.route IS NOT NULL AND lc.status = 'active'
         AND s.status = 'active' AND s.archived_at IS NULL
         AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled')
       ORDER BY a.id LIMIT 1`, classId('MB FT 101'));
    assert(a, 'bộ thử thiếu MT chưa thi có tuần ở MB FT 101');
    conn.prepare(`UPDATE learning_cycles SET exam_date = ?, thi_that_ngay = NULL, thi_that_khong_thi = 0, thi_that_l = NULL, thi_that_r = NULL,
        thi_that_w = NULL, thi_that_s = NULL, outcome_score = NULL, outcome = NULL WHERE id = ?`).run(truoc1(a.week_start), a.cycle_id);
    return { key: `mt-thi:${a.cycle_id}`, cycle: a.cycle_id as number, sid: a.student_id as number, attempt: a.id as number, tuan: a.week_start as string };
  };

  check('MT-1 · MT sau ngày thi → việc của Head (Việc quản lý, Lịch MT tại chỗ, Bỏ qua được); đổi ngày thi / dời MT về trước → hết', () => thu(() => {
    const d = dung();
    const it = tim(d.key);
    assert(it && it.group === 'missing_data' && tabCuaViec(it) === 'van-hanh' && it.cycleId === d.cycle && it.boQuaDuoc && it.mine,
      `thiếu việc / sai dáng: ${JSON.stringify(it)}`);
    assert(/^MT\d+(, MT\d+)* sau ngày thi · /.test(it.tieuDe) && /^MT\d+ W\d [A-Z]{3}.* sau ngày thi \d\d\/\d\d\/\d{4}/.test(it.reason) && /^Thi \d\d\/\d\d\/\d{4}$/.test(it.contextLabel), `chữ: ${JSON.stringify(it)}`);
    /* Ngày thi = thứ Hai tuần MT (MT không còn SAU ngày thi) → hết. */
    conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = ?').run(d.tuan, d.cycle);
    assert(!tim(d.key), 'ngày thi không còn trước MT mà việc còn');
    conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = ?').run(truoc1(d.tuan), d.cycle);
    assert(tim(d.key), 'việc chưa hiện lại khi ngày thi về trước MT');
    const som = one(`SELECT id FROM report_periods WHERE week_start < ? ORDER BY week_start DESC LIMIT 1`, truoc1(d.tuan));
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE cycle_id = ? AND kind = 'mock' AND status = 'planned'`).run(som.id, d.cycle);
    assert(!tim(d.key), 'dời MT về trước ngày thi mà việc còn');
  }));

  check('MT-2 · lộ trình có KQ thi thật / MT huỷ / em Lưu trữ → không có việc', () => thu(() => {
    const d = dung();
    assert(tim(d.key), 'dựng xong phải có việc');
    conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE id = ?').run(d.cycle);
    assert(!tim(d.key), 'có KQ thi thật (Không thi) mà việc còn');
    conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = 0 WHERE id = ?').run(d.cycle);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = ? AND kind = 'mock' AND status = 'planned'`).run(d.cycle);
    assert(!tim(d.key), 'MT huỷ mà việc còn');
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned' WHERE id = ?`).run(d.attempt);
    assert(tim(d.key), 'MT chưa huỷ lại phải có việc');
    conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run('2026-11-01T00:00:00Z', d.sid);
    assert(!tim(d.key), 'em Lưu trữ mà việc còn');
  }));

  check('MT-3 · người không phải Head CN của em không thấy (QL chi nhánh khác, GVCN); bỏ qua 403', () => thu(() => {
    const d = dung();
    assert(tim(d.key), 'Head CN phải thấy');
    assert(!tim(d.key, P.cpManager), 'QL chi nhánh khác thấy việc');
    assert(!tim(d.key, P.coreTeacher), 'GVCN thấy việc');
    assert(ma(() => mywork.boQuaViec(P.cpManager, d.key, true)) === 403, 'QL chi nhánh khác bỏ qua phải 403');
    assert(ma(() => mywork.boQuaViec(P.coreTeacher, d.key, true)) === 403, 'GVCN bỏ qua phải 403');
    assert(ma(() => mywork.boQuaViec(QL, 'mt-thi:999999999', true)) === 404, 'lộ trình không có phải 404');
  }));

  check('MT-4 · Bỏ qua → "Đã bỏ qua" + nhật ký; đổi ngày thi → hiện lại; khôi phục được', () => thu(() => {
    const d = dung();
    mywork.boQuaViec(QL, d.key, true);
    assert(!tim(d.key), 'việc còn sau khi bỏ qua');
    const bq = (viec().daBoQua ?? []).find((x: any) => x.key === d.key);
    assert(bq && bq.boi && bq.luc && / sau ngày thi · /.test(bq.tieuDe), `daBoQua: ${JSON.stringify(bq)}`);
    const nk = () => all(`SELECT 1 FROM audit_logs WHERE action = 'viec.bo_qua' AND entity_type = 'learning_cycle' AND entity_id = ?`, d.cycle).length;
    assert(nk() === 1, 'thiếu nhật ký bỏ qua');
    mywork.boQuaViec(QL, d.key, true);
    assert(nk() === 1, 'bấm lại ghi nhật ký lần hai');
    conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = ?').run(truoc1(truoc1(d.tuan)), d.cycle);
    assert(tim(d.key), 'đổi ngày thi mà việc vẫn ẩn');
    mywork.boQuaViec(QL, d.key, true);
    mywork.boQuaViec(P.admin, d.key, false);
    assert(tim(d.key), 'khôi phục mà việc chưa hiện');
  }));

  check(`MT-5 · trần câu SQL: bỏ qua ≤ ${TRAN_GHI_LO.boQuaViec}`, () => thu(() => {
    const d = dung();
    xoaNho(); const s0 = soCauSql(); mywork.boQuaViec(QL, d.key, true); const n = soCauSql() - s0;
    assert(n <= TRAN_GHI_LO.boQuaViec, `${n} > ${TRAN_GHI_LO.boQuaViec}`);
  }));
}
