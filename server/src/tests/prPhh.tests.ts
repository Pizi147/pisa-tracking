/**
 * PR-PHH (Báo phụ huynh lưu bản chụp nội dung) — kế hoạch docs/superpowers/plans/2026-10-04-pr-phh-bao-ph-ban-chup.md.
 *   PHH-1 · cột `noi_dung_luc_bao`, migrate chỉ thêm, bản chụp ghi lúc xác nhận, đọc lại bản đã lưu.
 *   PHH-2 · web hiện "đã báo" và câu cho dòng cũ (quét nguồn — web chưa có trình chạy React test).
 */
import type { AnToanTestKit } from './anToan.tests.ts';

export async function runPrPhhTests(t: AnToanTestKit) {
  const { check, assert, conn, TODAY, P } = t;
  console.log('\nPR-PHH · Báo phụ huynh: bản chụp 4 nội dung lúc xác nhận');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const doc = (rel: string) => fsMod.readFileSync(pathMod.join(REPO, rel), 'utf8');
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (mẫu prGva.tests.ts). */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { if (k === 'then') return undefined; throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
  const ph: any = await import('../yThuc/phoiHop.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const mig: any = await load('../migrate/prPhh.ts');
  const { default: Database } = await import('libsql');
  const CAU_LUOT = 'Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại';

  const viec = (id: number) => conn.prepare('SELECT * FROM sos_coordination_actions WHERE id = ?').get(id) as any;
  const doc1 = (sid: number, aid: number, id: number) =>
    ph.coordinationOfStudent(P.admin, sid).rows.find((x: any) => x.attemptId === aid).actions.find((x: any) => x.id === id);

  // ================================================================== PHH-1 · cột + bản chụp
  check('PHH-1a · migratePrPhh thêm cột noi_dung_luc_bao một lần; chạy lặp không đổi gì; schema.sql đã có cột', () => {
    const c = new Database(':memory:');
    c.exec('CREATE TABLE sos_coordination_actions (id INTEGER PRIMARY KEY)');
    const lan1: string[] = []; mig.migratePrPhh(c, lan1);
    assert(lan1.length === 1, `lần 1: ${lan1}`);
    assert((c.prepare('SELECT name FROM pragma_table_info(?)').all('sos_coordination_actions') as any[]).some((x) => x.name === 'noi_dung_luc_bao'), 'thiếu cột');
    const lan2: string[] = []; mig.migratePrPhh(c, lan2);
    assert(lan2.length === 0, `lần 2 phải rỗng: ${lan2}`);
    assert((conn.prepare('SELECT name FROM pragma_table_info(?)').all('sos_coordination_actions') as any[]).some((x) => x.name === 'noi_dung_luc_bao'), 'schema.sql thiếu cột');
    assert(/migratePrPhh\(conn, applied\)/.test(doc('server/src/migrate.ts')), 'migrate.ts chưa gọi migratePrPhh');
  });

  check('PHH-1b..d · xác nhận Báo PH → cột = 4 nội dung lúc xác nhận; sửa sau đó không đổi; dòng cũ (cột NULL/hỏng) → nội dung hiện tại + cờ', () => {
    const bai = conn.prepare(`SELECT a.id, a.student_id sid, co.id vid FROM assessment_attempts a
        JOIN sos_coordination_actions co ON co.attempt_id = a.id AND co.kind = 'bao_ph_tvv' AND co.status = 'pending'
      WHERE a.kind = 'progress' AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM case_signals cs WHERE cs.attempt_id = a.id AND cs.status != 'withdrawn' AND cs.case_id IS NOT NULL)
        AND NOT EXISTS (SELECT 1 FROM case_signals cs JOIN sos_cases c ON c.id = cs.case_id WHERE cs.attempt_id = a.id AND c.status = 'done') LIMIT 1`).get() as any;
    assert(bai, 'seed không có việc Báo PH chờ có Case chưa đóng');
    const truoc = doc1(bai.sid, bai.id, bai.vid);
    assert(truoc.noiDung?.length === 4 && truoc.noiDungLaHienTai === false, `trước xác nhận: ${JSON.stringify(truoc)}`);
    ph.confirmCoordination(P.admin, bai.vid, { performedOn: TODAY });
    const cot = viec(bai.vid).noi_dung_luc_bao;
    assert(typeof cot === 'string' && JSON.stringify(JSON.parse(cot)) === JSON.stringify(truoc.noiDung), `cột ≠ nội dung lúc xác nhận: ${cot}`);
    /* Sửa sau xác nhận: rút tín hiệu (môn hết trượt), đổi nguyên nhân, QL duyệt "Không cần theo dõi" một Case. */
    const cs = conn.prepare(`SELECT case_id FROM case_signals WHERE attempt_id = ? AND case_id IS NOT NULL`).all(bai.id) as any[];
    conn.prepare(`UPDATE sos_cases SET summary = 'nguyên nhân đã đổi sau khi báo' WHERE id = ?`).run(cs[0].case_id);
    sosAuto.apDungKhongTheoDoi(conn, { doi_tuong_id: cs[0].case_id, du_lieu: null, ly_do: 'PHH-1c' }, P.mbManager.userId);
    conn.prepare(`UPDATE case_signals SET status = 'withdrawn' WHERE attempt_id = ?`).run(bai.id);
    const sau = doc1(bai.sid, bai.id, bai.vid);
    assert(JSON.stringify(sau.noiDung) === JSON.stringify(truoc.noiDung) && sau.noiDungLaHienTai === false, `bản chụp đổi: ${JSON.stringify(sau.noiDung)}`);
    /* Dòng cũ: cột NULL → nội dung hiện tại (đã đổi) + cờ; JSON hỏng cũng vậy, không làm sập trang. */
    for (const xau of [null, 'không phải JSON', '{"a":1}']) {
      conn.prepare('UPDATE sos_coordination_actions SET noi_dung_luc_bao = ? WHERE id = ?').run(xau, bai.vid);
      const cu = doc1(bai.sid, bai.id, bai.vid);
      assert(cu.noiDungLaHienTai === true && cu.noiDung?.length === 4, `cột ${xau}: ${JSON.stringify(cu)}`);
      assert(JSON.stringify(cu.noiDung) !== JSON.stringify(truoc.noiDung), 'nội dung hiện tại phải khác bản chụp (đã sửa dữ liệu)');
    }
  });

  check('PHH-1e · việc loại khác: cột NULL, noiDung null, không cờ', () => {
    const v = conn.prepare(`SELECT co.id, co.student_id sid, co.attempt_id aid FROM sos_coordination_actions co JOIN assessment_attempts a ON a.id = co.attempt_id
      WHERE co.kind != 'bao_ph_tvv' AND co.status = 'pending' AND a.status != 'cancelled' LIMIT 1`).get() as any;
    assert(v, 'seed không có việc phối hợp loại khác đang chờ');
    ph.confirmCoordination(P.admin, v.id, { performedOn: TODAY });
    const x = doc1(v.sid, v.aid, v.id);
    assert(viec(v.id).noi_dung_luc_bao === null && x.noiDung === null && x.noiDungLaHienTai === false, JSON.stringify(x));
  });

  check('PHH-1f · việc chờ đọc nội dung hiện tại, không cờ (như trước PR)', () => {
    const v = conn.prepare(`SELECT co.id, co.student_id sid, co.attempt_id aid FROM sos_coordination_actions co JOIN assessment_attempts a ON a.id = co.attempt_id
      WHERE co.kind = 'bao_ph_tvv' AND co.status = 'pending' AND a.status != 'cancelled' LIMIT 1`).get() as any;
    if (!v) return;   // ponytail: các phép kiểm trên có thể đã xác nhận hết việc chờ trong seed nhỏ
    const x = doc1(v.sid, v.aid, v.id);
    assert(x.noiDung?.length === 4 && x.noiDungLaHienTai === false, JSON.stringify(x));
  });

  // ================================================================== PHH-2 · web (quét nguồn)
  check('PHH-2 · PhoiHopSosSection: câu cho dòng cũ đúng nguyên văn + đọc noiDungLaHienTai + tiêu đề "đã báo" cho việc xong', () => {
    const w = doc('web/src/modules/yThuc/PhoiHopSosSection.tsx');
    assert(w.includes(CAU_LUOT), 'thiếu câu dòng cũ');
    assert(/noiDungLaHienTai/.test(w), 'chưa đọc noiDungLaHienTai');
    assert(w.includes('Nội dung đã báo TVV') && w.includes('Nội dung gửi TVV'), 'thiếu tiêu đề đã báo / gửi');
  });
}
