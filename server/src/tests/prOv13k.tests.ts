/**
 * PHÉP KIỂM OV-13k (chủ SP 15/10) — Speaking chấm chéo: GV phụ trách Speaking của lớp được báo, ghi "Nhận xét GV phụ trách", sửa nhóm, chốt Case.
 * Gọi QUA HTTP như bản chính (mẫu prOv13h); trạng thái dùng chung trả lại trong `finally`; chạy cuối `run.ts` (không bọc giao dịch).
 *  1 · người chấm chéo lưu ô S có nhận xét → GV phụ trách S có thông báo + việc "Xem nhận xét Speaking · {em} · MT{n}" (không hạn, không đỏ)
 *  2 · quyền: người chấm chéo / GV môn khác 403; GV phụ trách · GVCN · QL 200
 *  3 · nhận xét phụ trách không bắt buộc, lưu riêng (không đè nhận xét người chấm), có nhật ký; sửa nhóm → nguyên nhân Case đổi; việc hết khi lưu
 *  4 · người chấm sửa lại nhận xét → việc quay lại; Xác nhận PA bởi GV phụ trách → việc hết
 *  5 · hồ sơ MT / hộp chấm đọc được nhận xét phụ trách; Excel có cột "Nhận xét GV phụ trách S"
 *  6 · migrate hai lần không đổi · 7 · "còn tồn từ" = tuần cũ nhất của (lớp, lượt)
 */
import Database from 'libsql';
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13kTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const xm: any = await import('../phanTich/xuatMt.ts');
  const { loadPrincipal, lopFtChoGvSpeaking } = await import('../permissions.ts');
  const { migratePrOv13k } = await import('../migrate/prOv13k.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nOV-13k · Speaking chấm chéo — GV phụ trách được báo, ghi nhận xét riêng, sửa nhóm, chốt Case (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const QL = P.mbManager;
  const FT101 = classId('MB FT 101');
  const MB = one(`SELECT branch_id FROM classes WHERE id = ?`, FT101).branch_id as number;
  const { phanCongDangHieuLuc } = await import('../worklist/scoreDebt.ts');
  const gvPT = phanCongDangHieuLuc([FT101], TODAY).get(`${FT101}|speaking`)?.userId as number;
  assert(gvPT, 'MB FT 101 phải có GV phụ trách Speaking');
  /** Người chấm chéo: GV Speaking lớp FT khác cùng chi nhánh — chấm được S của MB FT 101 nhưng không phụ trách nó, không GVCN. */
  const gvCheo = all(`SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.skill = 'speaking' AND ta.status = 'active' AND c.branch_id = ? AND ta.user_id != ?
        AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY ta.user_id`, MB, gvPT, FT101)
    .map((r) => r.user_id as number).find((u) => lopFtChoGvSpeaking(loadPrincipal(u), TODAY).includes(FT101))!;
  assert(gvCheo, 'dữ liệu demo: phải có GV Speaking chi nhánh MB ngoài MB FT 101');
  const gvcn = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, FT101).user_id as number;
  const gvW = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'writing1' AND status = 'active'
      AND user_id NOT IN (?, ?) LIMIT 1`, FT101, gvPT, gvcn)?.user_id as number;

  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { setConfig('demo_date', TODAY); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });
  const post = (body: unknown = {}) => ({ method: 'POST', body: JSON.stringify(body) });
  const ma = async (r: Response, mong: number, viec: string) => { const s = r.status; const txt = s === mong ? '' : await r.text(); assert(s === mong, `${viec}: ${s} (mong ${mong}) ${txt}`); };

  /* Em mới ở MB FT 101, lượt Mock mọi kỹ năng ở tuần trước (mẫu prOv13h `emFt`), kỳ vọng 6.5. */
  const W = addDays(dm.mondayOfDate(TODAY), -7);
  const sid = intake.commitIntake(P.admin, { classId: FT101, rows: [{ fullName: 'OV13k Em', target: 7, email: 'ov13k@demo.test', dob: '2010-01-01' }],
    idempotencyKey: 'ov13k-1' }).studentIds[0] as number;
  const aid = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number).pop()!;
  {
    const Wp = week.ensurePeriod(W).id as number;
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    run(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`, Wp, aid);
    run(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, target_at_attempt = ? WHERE id = ?`,
      Wp, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), aid);
    xoaNho();
  }
  const mt = `MT${one('SELECT attempt_no FROM assessment_attempts WHERE id = ?', aid).attempt_no}`;
  const [n1, n2, n3] = dm.issuesForTopic('speaking').map((i: any) => i.code);
  const NX = 'Part 2 dừng sau 1 phút, ít từ nối; phát âm đuôi -ed chưa rõ.';
  const o = () => one(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, aid);
  const viec = (u: number) => (mywork.myWork(loadPrincipal(u)).items as any[]).filter((x) => x.group === 'xem_nx_s' && x.attemptId === aid);
  const nk = (u: number) => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.nhan_xet_phu_trach' AND actor_user_id = ? AND entity_id = ?`, u, aid).n as number;

  await checkAsync('OV13k-1 · người chấm chéo lưu ô S có nhận xét → GV phụ trách S: thông báo + việc "Xem nhận xét Speaking · {em} · MT{n}" (không hạn, không đỏ); người chấm không có việc', () => voiMayChu(async (goi) => {
    assert(!viec(gvPT).length, 'chưa chấm mà đã có việc');
    await ma(await goi(gvCheo, `/attempts/${aid}/scores/speaking`, put({ criteria: [5, 5, 5, 5], nhanXet: NX, nhomNguyenNhan: [n1], gvCham: { performerSelf: true } })), 200, 'người chấm chéo lưu S');
    xoaNho();
    const v = viec(gvPT);
    assert(v.length === 1 && v[0].tieuDe === `Xem nhận xét Speaking · OV13k Em · ${mt}` && v[0].urgency === 'normal' && v[0].due === null && v[0].mine, JSON.stringify(v));
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, gvPT, `nxs:${aid}`).n === 1, 'GV phụ trách chưa có thông báo');
    assert(!viec(gvCheo).length && !one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, gvCheo, `nxs:${aid}`).n, 'người chấm không nhận việc / thông báo của chính mình');
  }));

  await checkAsync('OV13k-2 · quyền: người chấm chéo, GV môn khác → 403; GV phụ trách, GVCN, QL → 200; không đụng điểm', () => voiMayChu(async (goi) => {
    const url = `/attempts/${aid}/scores/speaking/phu-trach`;
    await ma(await goi(gvCheo, url, put({ nhanXetPhuTrach: 'x' })), 403, 'người chấm chéo');
    if (gvW) await ma(await goi(gvW, url, put({ nhanXetPhuTrach: 'x' })), 403, 'GV W1');
    const band = o().band;
    await ma(await goi(gvcn, url, put({ nhanXetPhuTrach: null })), 200, 'GVCN');
    await ma(await goi(QL.userId, url, put({ nhanXetPhuTrach: null })), 200, 'QL');
    await ma(await goi(gvPT, url, put({ band: 9, nhanXetPhuTrach: null })), 200, 'GV phụ trách (khoá band bỏ qua)');
    assert(o().band === band, 'điểm bị đổi');
    run(`UPDATE assessment_scores SET cho_phu_trach_xem = 1 WHERE attempt_id = ? AND skill = 'speaking'`, aid); xoaNho();   // trả việc cho phép kiểm sau
  }));

  await checkAsync('OV13k-3 · GV phụ trách: nhận xét không bắt buộc, lưu riêng (nhận xét người chấm giữ), nhật ký; sửa nhóm → nguyên nhân Case đổi; bỏ hết nhóm → 400; việc hết', () => voiMayChu(async (goi) => {
    const url = `/attempts/${aid}/scores/speaking/phu-trach`;
    const truoc = nk(gvPT);
    await ma(await goi(gvPT, url, put({ nhomNguyenNhan: [] })), 400, 'bỏ hết nhóm khi dưới kỳ vọng');
    await ma(await goi(gvPT, url, put({ nhanXetPhuTrach: 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.', nhomNguyenNhan: [n2, n1] })), 200, 'GV phụ trách lưu');
    const r = o();
    assert(r.comment === NX && r.nhan_xet_phu_trach === 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.' && r.nhan_xet_phu_trach_by === gvPT && r.cho_phu_trach_xem === 0,
      JSON.stringify({ c: r.comment, pt: r.nhan_xet_phu_trach, by: r.nhan_xet_phu_trach_by, cho: r.cho_phu_trach_xem }));
    assert(JSON.stringify(dm.docNhomNguyenNhan(r.nhom_nguyen_nhan)) === JSON.stringify([n2, n1]), `nhóm: ${r.nhom_nguyen_nhan}`);
    assert(nk(gvPT) === truoc + 1, 'thiếu nhật ký score.nhan_xet_phu_trach');
    xoaNho();
    assert(!viec(gvPT).length, 'việc phải hết khi GV phụ trách đã lưu');
    const sc = one(`SELECT id FROM sos_cases WHERE attempt_id = ? AND topic = 'speaking' AND status != 'done'`, aid);
    if (sc) {
      const cs = ((await (await goi(gvPT, `/cases/${sc.id}`)).json()) as any);
      const chinh = (cs.issues ?? []).find((i: any) => i.role === 'primary');
      assert(chinh?.code === n2 && chinh?.observation === NX && chinh?.nhanXetPhuTrach === 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.', `Case: ${JSON.stringify(cs.issues)}`);
    }
    /* Nhận xét phụ trách không bắt buộc: chỉ đổi nhóm, không gửi nhận xét → nhận xét giữ. */
    await ma(await goi(gvPT, url, put({ nhomNguyenNhan: [n3] })), 200, 'chỉ đổi nhóm');
    assert(o().nhan_xet_phu_trach === 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.', 'nhận xét phụ trách bị mất khi chỉ đổi nhóm');
  }));

  await checkAsync('OV13k-4 · người chấm sửa nhận xét → việc quay lại; chốt lượt → Xác nhận PA (panel OV-13b) bởi GV phụ trách → việc hết', () => voiMayChu(async (goi) => {
    await ma(await goi(gvCheo, `/attempts/${aid}/scores/speaking`, put({ nhanXet: `${NX} Cần mở rộng ý.` })), 200, 'người chấm sửa nhận xét');
    xoaNho();
    assert(viec(gvPT).length === 1, 'việc phải quay lại khi người chấm sửa nhận xét');
    /* Chốt lượt: QL nhập L R W1 W2 đúng kỳ vọng 6.5 (Overall dưới Target) → Case MT Speaking có PA quy chế chờ xác nhận. */
    for (const s of ['listening', 'reading', 'writing1', 'writing2']) {
      await ma(await goi(QL.userId, `/attempts/${aid}/scores/${s}`, put({ ...(s === 'listening' || s === 'reading' ? { band: 6.5 } : { criteria: [6.5, 6.5, 6.5, 6.5] }), nhanXet: 'Làm bài ổn định, đúng yêu cầu.' })), 200, `QL nhập ${s}`);
    }
    const iv = one(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.attempt_id = ? AND sc.topic = 'speaking' AND iv.preset IS NOT NULL AND iv.confirmed_at IS NULL AND iv.status = 'planned' AND iv.kind != 'bo_tro'`, aid);
    assert(iv, `lượt chốt phải có Case MT Speaking với PA quy chế chờ xác nhận: ${JSON.stringify(all(`SELECT sc.id, sc.topic, sc.status, sc.sos_level, iv.kind, iv.preset, iv.status ivs, iv.confirmed_at FROM sos_cases sc LEFT JOIN case_interventions iv ON iv.case_id = sc.id WHERE sc.attempt_id = ?`, aid))} ${JSON.stringify(one('SELECT status FROM assessment_attempts WHERE id = ?', aid))}`);
    xoaNho();
    assert(viec(gvPT).length === 1, 'việc còn trước khi Xác nhận PA');
    await ma(await goi(gvPT, `/interventions/${iv.id}/xac-nhan-pa`, post({ description: 'Luyện Part 2 hai buổi mỗi tuần, GV phụ trách kèm.', performerSelf: true, soBuoi: 2 })), 200, 'GV phụ trách Xác nhận PA');
    xoaNho();
    assert(!viec(gvPT).length, 'việc phải hết khi PA đã xác nhận');
  }));

  await checkAsync('OV13k-5 · hồ sơ MT: ô S có "Nhận xét GV phụ trách" + cờ phuTrachS (GV phụ trách có, người chấm chéo không); Excel có cột "Nhận xét GV phụ trách S"', () => voiMayChu(async (goi) => {
    const d = (await (await goi(gvCheo, `/attempts/${aid}`)).json()) as any;
    const s = d.cells.find((c: any) => c.skill === 'speaking');
    assert(s.nhanXetPhuTrach?.chu === 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.' && d.phuTrachS === false, JSON.stringify({ n: s.nhanXetPhuTrach, p: d.phuTrachS }));
    assert(((await (await goi(gvPT, `/attempts/${aid}`)).json()) as any).phuTrachS === true, 'GV phụ trách phải có cờ phuTrachS');
    const loc = dm.docBoLocXuatMt({ tg: 'dot', dot: ['mt:1', 'mt:2', 'mt:3', 'mt:4', 'mt:5', 'mt:6', 'mt:7', 'mt:8'].join(','), lop: String(FT101), cot: 'day-du' });
    assert(typeof loc !== 'string', String(loc));
    const x = xm.duLieuXuatMt(QL, loc);
    const [tieuDe, ...dong] = x.sheets[0].aoa;
    const i = tieuDe.indexOf('Nhận xét GV phụ trách S');
    const hv = one('SELECT student_code FROM students WHERE id = ?', sid).student_code;
    const r = dong.find((h: any[]) => h[0] === hv && h[5] === mt);
    assert(i > tieuDe.indexOf('Nhận xét S') && r?.[i] === 'Em cần luyện Part 2 thêm 2 phút mỗi buổi.', `Excel: ${i} ${JSON.stringify(r?.[i])}`);
  }));

  check('OV13k-8 · trần câu SQL: lưu nhận xét GV phụ trách ≤ TRAN_GHI_LO.nhanXetPhuTrach', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      const doCau = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); fn(); return soCauSql() - s0; };
      const n = doCau(() => attempts.luuNhanXetPhuTrach(loadPrincipal(gvPT), aid, { nhanXetPhuTrach: 'Đo câu SQL của đường lưu.' }));
      assert(n <= TRAN_GHI_LO.nhanXetPhuTrach, `${n} > ${TRAN_GHI_LO.nhanXetPhuTrach}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('OV13k-6 · migrate chỉ thêm cột, chạy hai lần không đổi (DB mới + DB đã có cột)', () => {
    const m = new Database(':memory:');
    m.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE assessment_scores (id INTEGER PRIMARY KEY, attempt_id INTEGER, skill TEXT); INSERT INTO assessment_scores VALUES (1, 1, \'speaking\')');
    const a1: string[] = [], a2: string[] = [];
    migratePrOv13k(m, a1); migratePrOv13k(m, a2);
    const cot = (m.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).map((c) => c.name);
    assert(a1.length === 1 && !a2.length && ['nhan_xet_phu_trach', 'nhan_xet_phu_trach_by', 'nhan_xet_phu_trach_at', 'cho_phu_trach_xem'].every((c) => cot.includes(c)), `${a1} / ${a2} / ${cot}`);
    assert((m.prepare('SELECT cho_phu_trach_xem FROM assessment_scores WHERE id = 1').get() as any).cho_phu_trach_xem === 0, 'dữ liệu cũ phải 0 (không sinh việc)');
    const a3: string[] = [];
    migratePrOv13k(conn, a3);
    assert(!a3.length, 'DB đã có cột: không đổi');
  });

  check('OV13k-7 · "còn tồn từ" của dòng Speaking chấm chéo = tuần thi CŨ NHẤT của (lớp, lượt), bài đầu nhóm thi tuần trước hay tuần cũ đều vậy', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      const p = loadPrincipal(gvCheo);
      const tuanTruoc = addDays(dm.mondayOfDate(TODAY), -7), cu = addDays(tuanTruoc, -14);
      /* Một lượt của MB FT 101 có ≥ 2 em đang học: chỉ giữ ô S của hai em (bỏ S các em khác) — nhóm (lớp, lượt) chỉ còn hai bài. */
      const ds = all(`SELECT a.id, a.attempt_no FROM assessment_attempts a JOIN students s ON s.id = a.student_id
          WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND s.status = 'active' AND s.archived_at IS NULL ORDER BY a.attempt_no, a.id`, FT101);
      const theoLuot = new Map<number, number[]>();
      for (const r of ds) (theoLuot.get(r.attempt_no) ?? theoLuot.set(r.attempt_no, []).get(r.attempt_no)!).push(r.id);
      const [luot, ids] = [...theoLuot].find(([, v]) => v.length >= 2)!;
      const [x, y] = ids;
      const khac = ds.filter((r) => r.attempt_no === luot && r.id !== x && r.id !== y).map((r) => r.id);
      if (khac.length) run(`UPDATE attempt_skills SET required = 0 WHERE skill = 'speaking' AND attempt_id IN (${khac.map(() => '?').join(',')})`, ...khac);
      run(`DELETE FROM assessment_scores WHERE skill = 'speaking' AND attempt_id IN (?, ?)`, x, y);
      run(`UPDATE assessment_attempts SET status = 'planned' WHERE id IN (?, ?)`, x, y);
      for (const [wx, wy] of [[tuanTruoc, cu], [cu, tuanTruoc]]) {
        for (const [id, w] of [[x, wx], [y, wy]] as const) {
          run(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1 WHERE attempt_id = ? AND skill = 'speaking'`, week.ensurePeriod(w).id, id);
        }
        xoaNho();
        const dong = (mywork.myWork(p).items as any[]).filter((v) => dm.laViecChamCheo(v) && v.classId === FT101 && v.attemptNo === luot);
        assert(dong.length === 1 && dong[0].soBai === 2 && dong[0].contextLabel === `còn tồn từ ${dm.tuanLich(cu)}`,
          `${wx}/${wy}: ${JSON.stringify(dong.map((v) => [v.key, v.soBai, v.contextLabel]))}`);
      }
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });
}
