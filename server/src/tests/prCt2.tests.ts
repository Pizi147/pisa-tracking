/**
 * PR-CT2 (§8, chủ sản phẩm 08/10) — chế tài cuối khoá. Task 1: Người dạy tuần này không bắt buộc · điền bù buổi đã dạy Tutor kỳ vọng · bộ đếm ký tự ẩn khi đạt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');

export async function runPrCt2Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const { migratePrCt2 } = await import('../migrate/prCt2.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-CT2 · chế tài cuối khoá — Task 1 (Người dạy không bắt buộc, điền bù buổi, bộ đếm)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const KQ = { decision: 'keep', outcome: 'partial', note: 'Em nghe chép đều hơn tuần trước' };

  check('CT2-0 · Kết quả PA Tutor 10 buổi: 2 buổi không người dạy → lưu, phu_trach_* NULL; loiKetQuaTuan không lỗi nguoi-day; tên ngoài 1 ký tự vẫn lỗi', () => {
    const cid = classId('MB FT 101');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: 'CT2 KQ', target: 7, email: 'hv@demo.test' }], idempotencyKey: 'ct2-kq' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', 'CT2 KQ').id;
    const c = cases.reportIssue(P.lrTeacher, {
      title: 'CT2 thử Kết quả', primaryCode: 'student.listening.technique', studentId: sid, topic: 'listening',
      summary: 'Case dựng cho phép kiểm PR-CT2.', idempotencyKey: 'ct2-case-kq', parallel: true,
    }) as any;
    const dto = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'tutor', description: 'Tutor nghe chép 10 buổi', soBuoi: 10, status: 'started', startedDate: t.addDays(TODAY, -7),
    }) as any;
    const iv = Math.max(...dto.interventions.map((x: any) => x.id));
    cases.updateResult(P.lrTeacher, iv, { ...KQ, ...d.thanKetQuaTuan({ kind: 'tutor', soBuoi: 10 }, '2', null) });
    const f = all('SELECT * FROM case_followups WHERE intervention_id = ?', iv);
    assert(f.length === 1 && f[0].so_buoi === 2 && f[0].phu_trach_user_id === null && f[0].phu_trach_ten === null, JSON.stringify(f));
    const khoa = (tuan: string, ng: any) => d.loiKetQuaTuan({ kind: 'tutor', soBuoi: 10 }, tuan, ng).map((l: any) => l.khoa).join();
    assert(khoa('2', null) === '' && khoa('10', null) === '', `không người: ${khoa('2', null)}`);
    assert(khoa('2', { kieu: 'ngoai', ten: 'A' }) === 'nguoi-day', 'tên ngoài 1 ký tự phải lỗi');
    let loi: any = null;
    try { cases.updateResult(P.lrTeacher, iv, { ...KQ, soBuoi: 1, nguoiDay: { performerName: 'A' } }); } catch (e: any) { loi = e; }
    assert(loi?.status === 400 && /người dạy tuần này/i.test(String(loi?.message)), `máy chủ vẫn kiểm tên ngoài: ${loi?.message}`);
    assert(all('SELECT 1 FROM case_followups WHERE intervention_id = ?', iv).length === 1, 'lỗi mà vẫn ghi');
  });

  check('CT2-0b · migratePrCt2: Tutor kỳ vọng Kết quả so_buoi NULL → 1 (0 giữ); một lần nhờ khoá; Bổ trợ miễn phí giữ NULL; không bảng demo_config thì thoát', () => {
    const tam = new SqliteDb(':memory:');
    tam.exec(`CREATE TABLE sos_cases (id INTEGER PRIMARY KEY, origin_kind TEXT, title TEXT);
      CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER, kind TEXT, so_buoi INTEGER);
      CREATE TABLE case_followups (id INTEGER PRIMARY KEY, intervention_id INTEGER, so_buoi INTEGER);`);
    tam.exec(`INSERT INTO sos_cases VALUES (1, 'chuyen_cap', 'Kỳ vọng đầu ra · Listening'), (2, 'chuyen_cap', 'Kỳ vọng đầu ra · Reading');
      INSERT INTO case_interventions VALUES (10, 1, 'tutor', 10), (20, 2, 'bo_tro_mien_phi', 4);
      INSERT INTO case_followups VALUES (1, 10, NULL), (2, 10, NULL), (3, 10, 0), (4, 20, NULL);`);
    const so = () => (tam.prepare('SELECT so_buoi FROM case_followups ORDER BY id').all() as any[]).map((x) => x.so_buoi ?? '').join();
    const x: string[] = []; migratePrCt2(tam, x);
    assert(x.length === 0 && so() === ',,0,', `không demo_config: ${so()}`);
    tam.exec('CREATE TABLE demo_config (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)');
    const a: string[] = []; migratePrCt2(tam, a);
    assert(so() === '1,1,0,' && a.length === 1 && a[0].includes('2'), `lần 1: ${so()} · ${a.join('; ')}`);
    tam.exec('UPDATE case_followups SET so_buoi = NULL WHERE id = 1');   // dòng mới không so_buoi từ đường khác: lần sau không đụng
    const b: string[] = []; migratePrCt2(tam, b);
    assert(b.length === 0 && so() === ',1,0,', `lần 2: ${so()} · ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrCt2(conn, c);
    assert(c.length === 0 && !!get("SELECT 1 FROM demo_config WHERE key = 'pr_ct2_dien_buoi'"), `DB thật: ${c.join('; ')}`);
  });

  check('CT2-0c · Truong: bộ đếm co/can chỉ hiện khi co < can', () => {
    const khung = fs.readFileSync(path.join(REPO, 'web/src/ui/KhungPanel.tsx'), 'utf8');
    assert(/\{dem && dem\.co < dem\.can && <span/.test(khung), 'Truong còn hiện bộ đếm khi đã đạt');
  });

  check('CT2-1 · số buổi bổ trợ theo dải × chương trình; ELE không bổ trợ; coBoTroFinal', () => {
    const bo = (ct: string, tyLe: number, monTruot: string[]) => d.goiYCuoiKhoa({ ct, tyLe, monTruot })?.boTroNeuLen ?? null;
    const s = (b: any) => b && `${b.soBuoi}·${b.soTuan}`;
    assert(s(bo('PREFOU', 0.55, [])) === '4·2' && s(bo('PREFOU', 0.65, [])) === '2·1', `Pre FOU ${s(bo('PREFOU', 0.55, []))} ${s(bo('PREFOU', 0.65, []))}`);
    assert(s(bo('FOU', 0.55, ['listening', 'writing'])) === '4·2', `FOU 55% ${s(bo('FOU', 0.55, ['listening', 'writing']))}`);
    assert(s(bo('FOU', 0.65, ['listening', 'writing'])) === '2·1', `FOU 65% ${s(bo('FOU', 0.65, ['listening', 'writing']))}`);
    assert(s(bo('BE', 0.55, ['reading'])) === '2·2', `BE 55% ${s(bo('BE', 0.55, ['reading']))}`);
    assert(bo('ELE', 0.55, ['reading']) === null && bo('ELE', 0.65, ['reading']) === null, 'ELE phải không bổ trợ');
    assert(!d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.65, monTruot: ['reading'] }).nhan.includes('bổ trợ'), 'nhãn ELE còn "bổ trợ"');
    for (const ct of ['PREFOU', 'FOU', 'BE', 'ELE']) {
      assert(bo(ct, 0.45, ['reading']) === null && bo(ct, 0.72, []) === null, `${ct} < 50 / ≥ 70`);
    }
    const hop = d.chuHopKetLuan({ ct: 'ELE', tyLe: 0.55, scored: 4, required: 4, mon: [], goiY: d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.55, monTruot: ['reading'] }), quyetDinh: { huong: 'len_lop', luc: '2026-10-05' }, ketLuanFt: null });
    assert(!hop.nhan.includes('bổ trợ'), `hộp Kết luận ELE: ${hop.nhan}`);
    assert(d.coBoTroFinal('BE', true) === false && d.coBoTroFinal('ELE', true) === false, 'BE/ELE → FT');
    assert(d.coBoTroFinal('BE', false) === true && d.coBoTroFinal('FOU', true) === true && d.coBoTroFinal('PREFOU', false) === true, 'còn lại');
  });

  check('CT2-2 · hạn chấm MT0 = thứ Tư tuần sau tuần thi', () => {
    assert(d.hanChamMt0('2026-10-19') === '2026-10-28' && d.hanChamMt0('2026-10-22') === '2026-10-28', d.hanChamMt0('2026-10-19'));
  });
}
