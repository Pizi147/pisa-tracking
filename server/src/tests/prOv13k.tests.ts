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
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
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
  let gvPT = phanCongDangHieuLuc([FT101], TODAY).get(`${FT101}|speaking`)?.userId as number;
  /* Cuối run.ts: phép kiểm trước có thể đã kết thúc phân công Speaking của MB FT 101 → phân công tạm GV Speaking khác của chi nhánh (gỡ ở cuối). */
  let pcTam: number | null = null;
  if (!gvPT) {
    const mau = one(`SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.skill = 'speaking' AND ta.status = 'active' AND c.branch_id = ? AND ta.effective_to IS NULL ORDER BY ta.id LIMIT 1`, MB);
    assert(mau, 'dữ liệu demo: chi nhánh MB phải có GV Speaking');
    pcTam = Number(run(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
        VALUES (?, ?, 'speaking', 0, '2000-01-01', 'active', ?)`, mau.user_id, FT101, new Date().toISOString()).lastInsertRowid);
    xoaNho();
    gvPT = mau.user_id as number;
  }
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
  /** Xếp mọi kỹ năng của lượt `aid` vào tuần `w`, kỳ vọng 6.5. */
  const xepLuot = (aid: number, w: string) => {
    const Wp = week.ensurePeriod(w).id as number;
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    run(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`, Wp, aid);
    run(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, target_at_attempt = ? WHERE id = ?`,
      Wp, 6.5 + dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a)), aid);
    xoaNho();
  };
  /** Em mới ở MB FT 101; `aids` = các lượt Mock theo thứ tự; lượt cuối xếp tuần trước (mẫu prOv13h `emFt`). */
  const emMoi = (n: number) => {
    const sid = intake.commitIntake(P.admin, { classId: FT101, rows: [{ fullName: `OV13k Em ${n}`, target: 7, email: `ov13k${n}@demo.test`, dob: '2010-01-01' }],
      idempotencyKey: `ov13k-${n}` }).studentIds[0] as number;
    const aids = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number);
    const aid = aids.at(-1)!;
    xepLuot(aid, W);
    return { sid, aid, aids };
  };
  const { sid, aid } = emMoi(1);
  const mt = `MT${one('SELECT attempt_no FROM assessment_attempts WHERE id = ?', aid).attempt_no}`;
  const [n1, n2, n3] = dm.issuesForTopic('speaking').map((i: any) => i.code);
  const NX = 'Part 2 dừng sau 1 phút, ít từ nối; phát âm đuôi -ed chưa rõ.';
  const o = () => one(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, aid);
  const viec = (u: number) => (mywork.myWork(loadPrincipal(u)).items as any[]).filter((x) => x.group === 'xem_nx_s' && x.attemptId === aid);
  const nk2 = (id: number) => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.nhan_xet_phu_trach' AND entity_id = ?`, id).n as number;
  const nk = (u: number) => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.nhan_xet_phu_trach' AND actor_user_id = ? AND entity_id = ?`, u, aid).n as number;

  await checkAsync('OV13k-1 · người chấm chéo lưu ô S có nhận xét → GV phụ trách S: thông báo + việc "Xem nhận xét Speaking · {em} · MT{n}" (không hạn, không đỏ); người chấm không có việc', () => voiMayChu(async (goi) => {
    assert(!viec(gvPT).length, 'chưa chấm mà đã có việc');
    await ma(await goi(gvCheo, `/attempts/${aid}/scores/speaking`, put({ criteria: [5, 5, 5, 5], nhanXet: NX, nhomNguyenNhan: [n1], gvCham: { performerSelf: true } })), 200, 'người chấm chéo lưu S');
    xoaNho();
    const v = viec(gvPT);
    assert(v.length === 1 && v[0].tieuDe === `Xem nhận xét Speaking · OV13k Em 1 · ${mt}` && v[0].urgency === 'normal' && v[0].due === null && v[0].mine, JSON.stringify(v));
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

  await checkAsync('OV13k-9 · QL nhập hộ, ghi người chấm là GV phụ trách → không sinh việc / thông báo (không có gì để xem)', () => voiMayChu(async (goi) => {
    const x = emMoi(2);
    await ma(await goi(QL.userId, `/attempts/${x.aid}/scores/speaking`, put({ criteria: [5, 5, 5, 5], nhanXet: NX, nhomNguyenNhan: [n1], gvCham: { performerUserId: gvPT } })), 200, 'QL nhập hộ');
    xoaNho();
    assert(!(mywork.myWork(loadPrincipal(gvPT)).items as any[]).some((v) => v.group === 'xem_nx_s' && v.attemptId === x.aid)
      && !one(`SELECT COUNT(*) n FROM notifications WHERE dedup_key = ?`, `nxs:${x.aid}`).n, 'không được sinh việc khi người chấm là GV phụ trách');
  }));

  check('OV13k-10 · migrate ĐẦY ĐỦ trên DB đang có (bản sao DB demo, bỏ 4 cột OV-13k): xanh, đủ cột, lần hai không áp lại OV-13k', () => {
    const fs = require('node:fs') as typeof import('node:fs'), os = require('node:os') as typeof import('node:os');
    const pathMod = require('node:path') as typeof import('node:path'), cp = require('node:child_process') as typeof import('node:child_process');
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-ov13k-'));
    try {
      const f = pathMod.join(dir, 'cu.sqlite');
      conn.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
      /* DB "trước OV-13k": dựng lại assessment_scores từ chính câu CREATE đang có, bỏ 4 cột (DROP COLUMN không được với cột có REFERENCES). */
      const c = new Database(f);
      const BON = ['nhan_xet_phu_trach', 'nhan_xet_phu_trach_by', 'nhan_xet_phu_trach_at', 'cho_phu_trach_xem'];
      const sql = (c.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'assessment_scores'`).get() as any).sql as string;
      const cu = sql.split('\n').filter((d) => !BON.some((k) => new RegExp(`^\\s*${k}\\s`).test(d)) && !/^\s*-- OV-13k|^\s*-- `cho_phu_trach_xem`/.test(d)).join('\n')
        .replace(/CREATE TABLE "?assessment_scores"?/, 'CREATE TABLE assessment_scores_cu');
      const giu = (c.prepare('PRAGMA table_info(assessment_scores)').all() as any[]).map((x) => x.name as string).filter((k) => !BON.includes(k)).join(', ');
      c.exec(`PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON; ${cu};
        INSERT INTO assessment_scores_cu (${giu}) SELECT ${giu} FROM assessment_scores; DROP TABLE assessment_scores;
        ALTER TABLE assessment_scores_cu RENAME TO assessment_scores; CREATE INDEX IF NOT EXISTS idx_score_attempt ON assessment_scores(attempt_id);`);
      assert(!(c.prepare('PRAGMA table_info(assessment_scores)').all() as any[]).some((x) => BON.includes(x.name)), 'chưa bỏ được 4 cột');
      c.close();
      const lib = require('node:url').pathToFileURL(pathMod.join(process.cwd(), 'dist-server/server/src/migrate.js')).href;
      const goi = () => cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(lib)}); console.log('APPLIED' + JSON.stringify(m.migrate().applied));`],
        { env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BAN_CHINH: '', PISA_DB: f }, encoding: 'utf8', timeout: 120_000 });
      const doc = (r: any): string[] => { assert(r.status === 0, `migrate lỗi: ${String(r.stderr).slice(-400)}`); return JSON.parse(String(r.stdout).split('APPLIED').pop()!); };
      const a1 = doc(goi());
      const c2 = new Database(f);
      const cot = (c2.prepare('PRAGMA table_info(assessment_scores)').all() as any[]).map((x) => x.name);
      c2.close();
      assert(BON.every((k) => cot.includes(k)) && a1.some((x) => x.startsWith('OV-13k')), `lần 1: ${JSON.stringify(a1)} · ${cot}`);
      const a2 = doc(goi());
      assert(!a2.some((x) => x.startsWith('OV-13k')), `lần 2 áp lại OV-13k: ${JSON.stringify(a2)}`);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  await checkAsync('OV13k-11 · MT trượt lại: PA của lượt trước đã xác nhận → lượt sau chấm chéo có nhận xét VẪN có việc; việc quay lại → chuông chưa đọc; lưu không đổi gì → không nhật ký', () => voiMayChu(async (goi) => {
    const x = emMoi(3);
    const [m1, m2] = x.aids;
    for (const id of x.aids.slice(2)) xepLuot(id, addDays(W, 14));   // lượt sau nữa ra khỏi tuần này
    xepLuot(m1, addDays(W, -14)); xepLuot(m2, W);
    const chot = async (luot: number) => {
      await ma(await goi(gvCheo, `/attempts/${luot}/scores/speaking`, put({ criteria: [5, 5, 5, 5], nhanXet: NX, nhomNguyenNhan: [n1], gvCham: { performerSelf: true } })), 200, 'chấm chéo S');
      for (const k of ['listening', 'reading', 'writing1', 'writing2']) {
        await ma(await goi(QL.userId, `/attempts/${luot}/scores/${k}`, put({ ...(k === 'listening' || k === 'reading' ? { band: 6.5 } : { criteria: [6.5, 6.5, 6.5, 6.5] }), nhanXet: 'Làm bài ổn định, đúng yêu cầu.' })), 200, `QL ${k}`);
      }
      xoaNho();
    };
    await chot(m1);
    const iv = one(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id = ? AND sc.topic = 'speaking'
        AND iv.preset IS NOT NULL AND iv.confirmed_at IS NULL AND iv.status = 'planned' AND iv.kind != 'bo_tro'`, x.sid);
    assert(iv, 'MT trước phải có PA quy chế chờ xác nhận');
    await ma(await goi(gvPT, `/interventions/${iv.id}/xac-nhan-pa`, post({ description: 'Luyện Part 2 hai buổi mỗi tuần, GV phụ trách kèm.', performerSelf: true, soBuoi: 2 })), 200, 'Xác nhận PA lượt trước');
    xoaNho();
    const viec2 = () => (mywork.myWork(loadPrincipal(gvPT)).items as any[]).filter((v) => v.group === 'xem_nx_s' && v.attemptId === m2);
    await chot(m2);
    assert(one(`SELECT COUNT(*) n FROM case_milestones m JOIN sos_cases sc ON sc.id = m.case_id WHERE m.attempt_id = ? AND sc.topic = 'speaking'`, m2).n > 0, 'lượt sau phải có mốc Case Speaking');
    assert(viec2().length === 1, `lượt sau phải còn việc Xem nhận xét (PA cũ của lượt trước không tính): ${JSON.stringify(viec2())}`);
    /* Chuông: đọc rồi, người chấm sửa nhận xét → chưa đọc lại. */
    run(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND dedup_key = ?`, '2026-01-01T00:00:00Z', gvPT, `nxs:${m2}`);
    await ma(await goi(gvCheo, `/attempts/${m2}/scores/speaking`, put({ nhanXet: `${NX} Cần mở rộng ý.` })), 200, 'người chấm sửa nhận xét');
    assert(one(`SELECT read_at FROM notifications WHERE user_id = ? AND dedup_key = ?`, gvPT, `nxs:${m2}`).read_at === null, 'chuông phải chưa đọc lại khi việc quay lại');
    /* Lưu không đổi gì → hết việc, không nhật ký. */
    const truoc = nk2(m2);
    await ma(await goi(gvPT, `/attempts/${m2}/scores/speaking/phu-trach`, put({ nhanXetPhuTrach: null })), 200, 'lưu không đổi');
    xoaNho();
    assert(nk2(m2) === truoc && !viec2().length, `không đổi gì: nhật ký ${truoc} → ${nk2(m2)}, việc ${viec2().length}`);
  }));

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

  if (pcTam) { run('DELETE FROM teacher_assignments WHERE id = ?', pcTam); xoaNho(); }
}
