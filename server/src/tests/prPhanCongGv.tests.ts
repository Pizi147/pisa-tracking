/**
 * PHÉP KIỂM PC-GV-A (đặc tả 2026-10-30-phan-cong-gv-design.md · kế hoạch PR-A): luật thuần đổi người, lõi lưu nhiều lớp có hiệu lực,
 * chuyển Case / PA, áp lịch đổi tới hạn, Hoàn tác, GV cũ chỉ xem có hạn, đường đọc góc Phân công GV.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPhanCongGvTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPC-GV-A · Phân công GV có hiệu lực (máy chủ)');

  /* ---------------------------------------------------------------- A1 · luật thuần */
  const FT = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const LRWS = ['listening', 'reading', 'writing', 'speaking'];
  const s = (userId: number, skill: string | null) => ({ userId, skill, isCore: skill === null });

  check('A1 · demPhanCong dữ liệu mockup v9 (16 lớp): FT 47 · thường 18 · GVCN FT 10 · thường 6; Hà FT = 7; Châu không có', () => {
    const G: Record<string, number> = {};
    const id = (k: string) => (G[k] ??= Object.keys(G).length + 1);
    const COT: Record<string, Record<string, string>> = {
      FT: { L: 'listening', R: 'reading', W1: 'writing1', W2: 'writing2', S: 'speaking' },
      FOU: { L: 'listening', R: 'reading', 'G+V': 'writing', P: 'speaking' }, BE: { L: 'listening', R: 'reading', W: 'writing', S: 'speaking' }, PREFOU: {},
    };
    const LOP: [string, Record<string, string>][] = [
      ['FT', { L: 'ha', R: 'ha', W1: 'miguel', W2: 'miguel', S: 'thea', CN: 'ha' }], ['FT', { L: 'dung', R: 'hang', W1: 'yen', W2: 'yen', S: 'miguel', CN: 'dung' }],
      ['FT', { L: 'ha', R: 'phong', W1: 'uyen', W2: 'lien', S: 'thea', CN: 'phong' }], ['FT', { L: 'ha', R: 'linh', W1: 'duy', W2: 'duy', S: 'miguel', CN: 'ha' }],
      ['FT', { L: 'phong', R: 'ha', W1: 'yen', W2: 'anh', S: 'thea', CN: 'anh' }], ['FT', { L: 'hang', R: 'hang', W1: 'miguel', W2: 'uyen', S: '', CN: 'hang' }],
      ['FT', { L: 'dung', R: 'ha', W1: 'linh', W2: 'linh', S: 'miguel', CN: 'linh' }], ['FT', { L: 'ha', R: 'dung', W1: 'duy', W2: 'yen', S: 'thea', CN: 'duy' }],
      ['FT', { L: 'phong', R: 'linh', W1: 'anh', W2: 'anh', S: 'miguel', CN: 'phong' }], ['FT', { L: 'uyen', R: 'uyen', W1: '', W2: '', S: 'thea', CN: 'uyen' }],
      ['FOU', { L: 'anh', R: 'anh', 'G+V': 'anh', P: 'miguel', CN: 'anh' }], ['FOU', { L: 'yen', R: 'yen', 'G+V': 'yen', P: 'thea', CN: 'yen' }],
      ['BE', { L: 'linh', R: 'linh', W: 'duy', S: 'thea', CN: 'linh' }], ['BE', { L: 'dung', R: 'hang', W: 'hang', S: 'miguel', CN: 'hang' }],
      ['PREFOU', { CN: 'uyen' }], ['PREFOU', { CN: 'ha' }],
    ];
    id('chau');
    const lop = LOP.map(([ct, o]) => {
      const slots = Object.entries(o).filter(([, g]) => g).map(([k, g]) => (k === 'CN' ? s(id(g), null) : s(id(g), COT[ct][k])));
      return { ft: ct === 'FT', slots: d.moRongPhanCong(ct === 'FT' ? null : ct, ct === 'PREFOU' ? ['tong_hop'] : ct === 'FT' ? FT : LRWS, slots) };
    });
    const m = d.demPhanCong(lop);
    const tong = { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
    for (const x of m.values()) for (const k of Object.keys(tong) as (keyof typeof tong)[]) tong[k] += x[k];
    assert(tong.ft === 47 && tong.th === 18 && tong.cnFt === 10 && tong.cnTh === 6, `tổng ${JSON.stringify(tong)}`);
    assert(m.get(id('ha')).ft === 7, `Hà FT ${m.get(id('ha')).ft}`);
    assert(m.get(id('chau')) === undefined, 'Châu 0 lớp không có dòng');
  });

  const A = 1, B = 2, C = 3;
  check('A1 · doiTheoO FT đổi L: A dạy L + GVCN, L sang B → một dòng listening A → B', () => {
    const r = d.doiTheoO('FT', FT, [s(A, null), s(A, 'listening'), s(C, 'reading')], [s(A, null), s(B, 'listening'), s(C, 'reading')]);
    assert(JSON.stringify(r) === JSON.stringify([{ khoa: 'listening', nguoiCu: A, nguoiMoi: B }]), JSON.stringify(r));
  });
  check('A1 · doiTheoO Pre FOU đổi GVCN → đúng một dòng gvcn (không dòng tong_hop)', () => {
    const cu = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(A, null)]);
    const moi = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(B, null)]);
    const r = d.doiTheoO('PREFOU', ['tong_hop'], cu, moi);
    assert(r.length === 1 && r[0].khoa === 'gvcn' && r[0].nguoiCu === A && r[0].nguoiMoi === B, JSON.stringify(r));
  });
  check('A1 · doiTheoO bỏ người (A → Chưa có) và Chưa có → B: không phải cặp bàn giao', () => {
    const r = d.doiTheoO('FT', FT, [s(A, null), s(A, 'reading'), s(A, 'listening')], [s(A, null), s(A, 'reading')]);
    assert(r.length === 1 && r[0].nguoiCu === A && r[0].nguoiMoi === null && !d.laCapBanGiao(r[0]), JSON.stringify(r));
    const r2 = d.doiTheoO('FT', FT, [s(A, null), s(A, 'reading')], [s(A, null), s(A, 'reading'), s(B, 'speaking')]);
    assert(r2.length === 1 && r2[0].nguoiCu === null && r2[0].nguoiMoi === B && !d.laCapBanGiao(r2[0]), JSON.stringify(r2));
  });
  check('A1 · doiTheoO giữ môn gộp cũ: lớp PET có dòng listening_speaking cũ → không sinh dòng đổi; apDoi bỏ dòng đó (ghiPhanCong tự giữ)', () => {
    const cu = [s(A, null), s(A, 'listening'), s(C, 'listening_speaking')];
    const r = d.doiTheoO('PET', LRWS, cu, [s(A, null), s(A, 'listening')]);
    assert(r.length === 0, JSON.stringify(r));
    assert(!d.apDoi(cu, [], LRWS).some((x: any) => x.skill === 'listening_speaking'), 'apDoi bỏ dòng môn gộp cũ');
  });
  check('A1 · apDoi áp đổi L A → B + giữ ô khác', () => {
    const r = d.apDoi([s(A, null), s(A, 'listening'), s(C, 'reading')], [{ khoa: 'listening', nguoiCu: A, nguoiMoi: B }], FT);
    const k = r.map((x: any) => `${x.isCore ? 'gvcn' : x.skill}:${x.userId}`).sort().join(',');
    assert(k === `gvcn:${A},listening:${B},reading:${C}`, k);
  });
  check('A1 · caseThuocO: ô L → Case L, không R; ô GVCN (A còn dạy L) → Case R + không kỹ năng, không L; ô W1 → Case W1', () => {
    assert(d.caseThuocO('FT', 'listening', new Set(), 'listening') && !d.caseThuocO('FT', 'listening', new Set(), 'reading'), 'ô L');
    const con = new Set(['listening']);
    assert(d.caseThuocO('FT', 'gvcn', con, 'reading') && !d.caseThuocO('FT', 'gvcn', con, 'listening') && d.caseThuocO('FT', 'gvcn', con, null), 'ô GVCN');
    assert(d.caseThuocO('FT', 'writing1', new Set(), 'writing1') && !d.caseThuocO('FT', 'writing1', new Set(), 'writing2'), 'ô W1');
  });
  check('A1 · mốc: xemDen 30/10 → 06/11, 02/11 → 09/11; hạn bàn giao 30/10 → 03/11', () => {
    assert(d.xemDen('2026-10-30') === '2026-11-06' && d.xemDen('2026-11-02') === '2026-11-09', 'xemDen');
    assert(d.hanBanGiaoGv('2026-10-30') === '2026-11-03', d.hanBanGiaoGv('2026-10-30'));
  });
  check('A1 · nguoiVietBanGiao: A không nghỉ → gv-cu; A nghỉ → GVCN P; A nghỉ và là GVCN → QL', () => {
    const P0 = 9;
    const a = d.nguoiVietBanGiao({ cuNghi: false, nguoiCu: A, gvcn: P0, gvcnNghi: false });
    const b = d.nguoiVietBanGiao({ cuNghi: true, nguoiCu: A, gvcn: P0, gvcnNghi: false });
    const c = d.nguoiVietBanGiao({ cuNghi: true, nguoiCu: A, gvcn: A, gvcnNghi: true });
    assert(a.loai === 'gv-cu' && a.id === A && b.loai === 'gvcn' && b.id === P0 && c.loai === 'ql' && c.id === null, JSON.stringify([a, b, c]));
  });

  /* ---------------------------------------------------------------- dựng dữ liệu (một lần; mỗi phép kiểm ghi cuộn lại) */
  const { conn, P, TODAY, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const classes: any = await import('../classes/classes.ts');
  const pc: any = await import('../classes/phanCongGv.ts');
  const mig: any = await import('../migrate/prPhanCongGv.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  let seq = 0;
  const nguoi = (roles: any[] = [{ role: 'teacher', branches: ['MB'] }]) => accounts.createAccount(P.admin, {
    email: `pcgv.${++seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-pcgv', fullName: `Thử PCGV ${seq}`, roles,
  }).userId as number;
  const start = addDays(T2, -7 * 4);
  const lopMoi = (code: string) => intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  const gan = (l: number, u: number, skill: string | null) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,'2026-01-01','active',?)`,
  ).run(u, l, skill, skill === null ? 1 : 0, NOW);
  /* gA: GVCN + L + S · gC: R · gD: W1, W2 — lớp X, Y, Z cùng bức tranh. gB, gF: chưa dạy. */
  const [gA, gB, gC, gD, gF] = [nguoi(), nguoi(), nguoi(), nguoi(), nguoi()];
  const X = lopMoi('MB PCGV-X'), Y = lopMoi('MB PCGV-Y'), Z = lopMoi('MB PCGV-Z');
  for (const l of [X, Y, Z]) { gan(l, gA, null); gan(l, gA, 'listening'); gan(l, gC, 'reading'); gan(l, gD, 'writing1'); gan(l, gD, 'writing2'); gan(l, gA, 'speaking'); }
  xoaNho();
  const QL = P.mbManager;
  const slotsCua = (l: number) => all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, l)
    .map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
  const doiO = (l: number, khoa: string, u: number) => slotsCua(l).filter((x) => (x.isCore ? 'gvcn' : x.skill) !== khoa)
    .concat(khoa === 'gvcn' ? [{ userId: u, skill: null, isCore: true }] : [{ userId: u, skill: khoa, isCore: false }]);
  const ai = (l: number, khoa: string) => all(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND ${khoa === 'gvcn' ? 'is_core = 1' : 'skill = ?'}`,
    ...(khoa === 'gvcn' ? [l] : [l, khoa])).map((r) => r.user_id);
  const T14 = tuan(addDays(T2, 14));

  /* ---------------------------------------------------------------- A2 · bảng doi_phan_cong + luuPhanCong */
  check('A2 · migrate chạy hai lần không lỗi, bảng + 3 chỉ mục có', () => {
    mig.migratePrPhanCongGv(conn, []); mig.migratePrPhanCongGv(conn, []);
    const cm = all(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'doi_phan_cong' AND name LIKE 'ix_doi_pc_%'`).map((r) => r.name).sort().join(',');
    assert(cm === 'ix_doi_pc_cho,ix_doi_pc_cu,ix_doi_pc_lop', cm);
  });
  check('A2 · Ngay hôm nay: QL đổi L X → dòng da_ap; dòng cũ ended effective_to = hôm nay; người mới active từ hôm nay; xem_den = +7', () => thu(() => {
    const r = pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    const dong = one(`SELECT * FROM doi_phan_cong WHERE id = ?`, r.lo);
    assert(dong.trang_thai === 'da_ap' && dong.khoa === 'listening' && dong.nguoi_cu === gA && dong.nguoi_moi === gB && dong.lo === r.lo, JSON.stringify(dong));
    assert(dong.xem_den === addDays(TODAY, 7) && dong.tao_ban_giao === 1, `xem_den ${dong.xem_den}`);
    const cu = one(`SELECT * FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = 'listening' ORDER BY id DESC LIMIT 1`, X, gA);
    const moi = one(`SELECT * FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = 'listening' AND status = 'active'`, X, gB);
    assert(cu.status === 'ended' && cu.effective_to === TODAY && moi?.effective_from === TODAY, JSON.stringify({ cu, moi }));
    assert(ai(X, 'gvcn')[0] === gA, 'GVCN giữ');
  }));
  check('A2 · Từ tuần: dòng cho, teacher_assignments KHÔNG đổi; chọn tuần này → 400', () => thu(() => {
    const truoc = JSON.stringify(slotsCua(X));
    const r = pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }], hieuLuc: { loai: 'tuan', tuanId: T14 } });
    const dong = one(`SELECT * FROM doi_phan_cong WHERE id = ?`, r.lo);
    assert(dong.trang_thai === 'cho' && dong.hieu_luc === addDays(T2, 14) && r.lop[0].cho === true, JSON.stringify(dong));
    assert(JSON.stringify(slotsCua(X)) === truoc, 'phân công giữ nguyên');
    const e = maLoi(() => pc.luuPhanCong(QL, { lop: [{ classId: Y, slots: doiO(Y, 'listening', gB) }], hieuLuc: { loai: 'tuan', tuanId: tuan(T2) } }));
    assert(e?.status === 400 && /tuần sau tuần này/.test(e.message), e?.message);
  }));
  check('A2 · RF2 thay lịch đổi cùng ô: A→B từ tuần +14, rồi A→C cùng tuần → dòng B huỷ, còn đúng một dòng cho A→C', () => thu(() => {
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }], hieuLuc: { loai: 'tuan', tuanId: T14 } });
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gF) }], hieuLuc: { loai: 'tuan', tuanId: T14 } });
    const ds = all(`SELECT nguoi_moi, trang_thai, ly_do_huy FROM doi_phan_cong WHERE class_id = ? ORDER BY id`, X);
    assert(ds.length === 2 && ds[0].trang_thai === 'huy' && ds[0].ly_do_huy === 'thay bằng lần đổi sau' && ds[1].trang_thai === 'cho' && ds[1].nguoi_moi === gF, JSON.stringify(ds));
  }));
  check('A2 · RF5 hai lớp, lớp 2 sai phiên bản → 409 details.classId = lớp 2; lớp 1 không có dòng đổi, phân công giữ', () => thu(() => {
    const truoc = JSON.stringify(slotsCua(X));
    const e = maLoi(() => pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }, { classId: Y, slots: doiO(Y, 'reading', gB), phienBan: '1,2,3' }] }));
    assert(e?.status === 409 && e.details?.classId === Y, `${e?.status} ${JSON.stringify(e?.details)}`);
    assert(!one(`SELECT 1 FROM doi_phan_cong WHERE class_id IN (?, ?)`, X, Y) && JSON.stringify(slotsCua(X)) === truoc, 'không ghi lớp 1');
    const e2 = maLoi(() => pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }, { classId: Y, slots: doiO(Y, 'gvcn', gB) }] }));
    assert(e2?.status === 400 && e2.details?.classId === Y && e2.details?.khoa === 'gvcn' && e2.message.startsWith('MB PCGV-Y · '), `${e2?.message} ${JSON.stringify(e2?.details)}`);
    assert(!one(`SELECT 1 FROM doi_phan_cong WHERE class_id = ?`, X), 'sai luật lớp 2 → lớp 1 không ghi');
  }));
  check('A2 · RF1 GV nghỉ: người giữ W2 lớp X hết vai → lưu lớp Y (không có người đó) đạt; lưu X đổi ô khác mà giữ W2 → 400 "đã nghỉ"; đổi cả W2 → đạt', () => thu(() => {
    const gN = nguoi();
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill = 'writing2' AND status = 'active'`).run(gN, X);
    conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(gN);
    xoaNho();
    pc.luuPhanCong(QL, { lop: [{ classId: Y, slots: doiO(Y, 'speaking', gB) }] });
    const e = maLoi(() => pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'speaking', gB) }] }));
    assert(e?.status === 400 && /đã nghỉ/.test(e.message) && e.details?.khoa === 'writing2', `${e?.message} ${JSON.stringify(e?.details)}`);
    const moi = doiO(X, 'speaking', gB).filter((x: any) => x.skill !== 'writing2').concat([{ userId: gD, skill: 'writing2', isCore: false }]);
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: moi }] });
    assert(ai(X, 'writing2')[0] === gD && ai(X, 'speaking')[0] === gB, 'đổi cả W2 đạt');
  }));
  check('A2 · quyền: CX, TVV, GVBM → 403; GVCN đổi ô bộ môn lớp mình đạt, đổi ô GVCN → 403; PUT /teachers cũ vẫn trả bức tranh', () => thu(() => {
    const cx = loadPrincipal(nguoi([{ role: 'cx', branches: [] }]));
    const tvv = loadPrincipal(nguoi([{ role: 'consultant', branches: ['MB'] }]));
    for (const [ten, p] of [['CX', cx], ['TVV', tvv], ['GVBM', loadPrincipal(gC)]] as const) {
      assert(maLoi(() => pc.luuPhanCong(p, { lop: [{ classId: X, slots: doiO(X, 'speaking', gB) }] }))?.status === 403, `${ten} phải 403`);
    }
    const gvcn = loadPrincipal(gA);
    pc.luuPhanCong(gvcn, { lop: [{ classId: X, slots: doiO(X, 'speaking', gB) }] });
    assert(ai(X, 'speaking')[0] === gB, 'GVCN đổi S');
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE kind = 'phan_cong_gvcn' AND entity_id = ?`, X).n >= 1, 'QL nhận thông báo GVCN đổi');
    assert(maLoi(() => pc.luuPhanCong(gvcn, { lop: [{ classId: X, slots: doiO(X, 'gvcn', gC) }] }))?.status === 403, 'GVCN đổi GVCN 403');
    const v = classes.setClassTeachers(QL, Y, { slots: doiO(Y, 'reading', gF), phienBan: classes.classTeachers(QL, Y).phienBan });
    assert(v.bySkill.some((x: any) => x.skill === 'reading' && x.userId === gF) && v.core[0]?.userId === gA, 'PUT cũ trả bức tranh mới');
  }));

  /* ---------------------------------------------------------------- A3 · chuyển Case / PA sang người mới */
  const util: any = await import('../util.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const at: any = await import('../fasttrack/attempts.ts');
  const own: any = await import('../cases/owner.ts');
  let soEm = 0;
  const emMoi = (l: number) => {
    const ten = `Thử PCGV HV ${++soEm}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-PCGV-${soEm}`, ten, util.normalizeName(ten), MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, start, NOW);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`).run(sid, tuan(start), start, NOW);
    return sid;
  };
  const caseMoi = (sid: number, category: string | null, owner: number | null) => Number(conn.prepare(
    `INSERT INTO sos_cases (student_id, category, topic, owner_user_id, status, created_at, origin_kind) VALUES (?,?,?,?, 'open', ?, 'teacher_report')`,
  ).run(sid, category, category, owner, NOW).lastInsertRowid);
  const paMoi = (caseId: number, performer: number) => Number(conn.prepare(
    `INSERT INTO case_interventions (case_id, kind, status, performer_user_id, created_at) VALUES (?, 'teaching_adjust', 'started', ?, ?)`,
  ).run(caseId, performer, NOW).lastInsertRowid);
  const chu = (caseId: number) => one(`SELECT owner_user_id AS u FROM sos_cases WHERE id = ?`, caseId).u;
  const emX = emMoi(X);
  xoaNho();

  check('A3 · đổi L ngay: Case L mở của A → B (có lịch sử); Case R của A giữ A; PA L A thực hiện → B', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA), cR = caseMoi(emX, 'reading', gA), pa = paMoi(cL, gA);
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    assert(chu(cL) === gB && chu(cR) === gA, `L ${chu(cL)} R ${chu(cR)}`);
    const h = one(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' ORDER BY id DESC LIMIT 1`, cL);
    assert(h && h.old_value === String(gA) && h.new_value === String(gB) && h.actor_user_id === QL.userId, JSON.stringify(h));
    const p = one(`SELECT performer_user_id AS u, performer_name AS n FROM case_interventions WHERE id = ?`, pa);
    assert(p.u === gB && p.n === null, JSON.stringify(p));
    assert(one(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'pa_performer'`, cL), 'lịch sử PA');
  }));
  check('A3 · đổi GVCN, A còn dạy L: Case R (A giữ vì là GVCN) → B; Case L giữ A; Case không kỹ năng → B', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA), cR = caseMoi(emX, 'reading', gA), c0 = caseMoi(emX, null, gA);
    const moi = doiO(X, 'gvcn', gB).concat([{ userId: gB, skill: 'speaking', isCore: false }]).filter((x: any) => !(x.skill === 'speaking' && x.userId === gA));
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: moi }] });
    assert(ai(X, 'gvcn')[0] === gB, 'GVCN mới');
    assert(chu(cR) === gB && chu(cL) === gA && chu(c0) === gB, `R ${chu(cR)} L ${chu(cL)} 0 ${chu(c0)}`);
  }));
  check('A3 · điểm A đã nhập giữ entered_by A sau khi đổi L', () => thu(() => {
    const id = kh.xepMoi(QL, { studentId: emX, attemptNo: 1, tuan: Object.fromEntries(['listening', 'reading', 'writing', 'speaking'].map((k) => [k, tuan(T2)])), force: true }).id as number;
    at.saveScore(QL, id, 'listening', { band: 6 }, TODAY);
    conn.prepare(`UPDATE assessment_scores SET entered_by = ? WHERE attempt_id = ? AND skill = 'listening'`).run(gA, id);
    const truoc = JSON.stringify(one(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, id));
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    assert(JSON.stringify(one(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, id)) === truoc, 'ô điểm không đổi');
  }));
  check('A3 · B nhận MỘT thông báo phan_cong_moi (có số Case · PA); lưu lại cùng ô không báo lần hai', () => thu(() => {
    caseMoi(emX, 'listening', gA);
    const r = pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: slotsCua(X) }] });
    const tb = all(`SELECT * FROM notifications WHERE user_id = ? AND kind = 'phan_cong_moi'`, gB);
    assert(tb.length === 1 && tb[0].dedup_key === `phan_cong_moi:${r.lo}` && /MB PCGV-X · L · 1 Case/.test(tb[0].title) && tb[0].duong === `/hoc-vien/lop/${X}`, JSON.stringify(tb));
  }));
  check('A3 · bỏ người (A → Chưa có): không chuyển Case', () => thu(() => {
    const cR = caseMoi(emX, 'reading', gC);
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: slotsCua(X).filter((x: any) => x.skill !== 'reading') }] });
    assert(chu(cR) === gC, `R ${chu(cR)}`);
  }));
  check('A3 · chonViecChuyen trả cùng Case / PA mà chuyenViecKhiDoi ghi (không ghi gì khi chọn)', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA), pa = paMoi(cL, gA);
    const doi = [{ khoa: 'listening', nguoiCu: gA, nguoiMoi: gB }];
    const m = own.chonViecChuyen(X, 'FT', doi, () => new Set(['speaking']));
    assert(JSON.stringify(m.get('listening')) === JSON.stringify({ caseIds: [cL], paIds: [pa] }) && chu(cL) === gA, JSON.stringify([...m]));
  }));

  /* ---------------------------------------------------------------- A4 · tới hạn · Đổi mốc · Huỷ lịch đổi · Hoàn tác */
  const demTa = (l: number) => one(`SELECT COUNT(*) n FROM teacher_assignments WHERE class_id = ?`, l).n as number;
  const henL = (u: number) => pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', u) }], hieuLuc: { loai: 'tuan', tuanId: T14 } });
  check('A4 · tới hạn: lịch L A→B (giả tới hạn hôm nay) → apDoiDenHan áp: da_ap, effective_from = hiệu lực, Case L chuyển; chạy lần hai không làm gì', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA);
    const r = henL(gB);
    conn.prepare(`UPDATE doi_phan_cong SET hieu_luc = ? WHERE id = ?`).run(TODAY, r.lo);
    const k1 = pc.apDoiDenHan(TODAY);
    const dong = one(`SELECT * FROM doi_phan_cong WHERE id = ?`, r.lo);
    const moi = one(`SELECT effective_from FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = 'listening' AND status = 'active'`, X, gB);
    assert(k1.daAp === 1 && dong.trang_thai === 'da_ap' && dong.xem_den === addDays(TODAY, 7) && moi?.effective_from === TODAY && chu(cL) === gB, JSON.stringify({ k1, dong, moi }));
    const n = demTa(X);
    const k2 = pc.apDoiDenHan(TODAY);
    assert(k2.daAp === 0 && demTa(X) === n, JSON.stringify(k2));
  }));
  check('A4 · RF4: lịch L GVCN→B hợp lệ lúc lưu; đổi NGAY S GVCN→C; tới hạn → không áp, giữ cho + lỗi "GVCN phải dạy", thu_ngay; người tạo đúng 1 thông báo; quét lại không ghi', () => thu(() => {
    const r = henL(gB);
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'speaking', gC) }] });
    conn.prepare(`UPDATE doi_phan_cong SET hieu_luc = ? WHERE id = ?`).run(TODAY, r.lo);
    const truoc = JSON.stringify(slotsCua(X));
    pc.apDoiDenHan(TODAY);
    const dong = one(`SELECT * FROM doi_phan_cong WHERE id = ?`, r.lo);
    assert(dong.trang_thai === 'cho' && /GVCN phải dạy/.test(dong.loi ?? '') && dong.thu_ngay === TODAY && JSON.stringify(slotsCua(X)) === truoc, JSON.stringify(dong));
    const tb = () => one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'phan_cong_loi'`, QL.userId).n;
    const dongDoi = () => JSON.stringify(all(`SELECT * FROM doi_phan_cong WHERE class_id = ? ORDER BY id`, X));
    assert(tb() === 1, `thông báo ${tb()}`);
    const d0 = dongDoi();
    pc.apDoiDenHan(TODAY);
    assert(tb() === 1 && dongDoi() === d0, 'quét lại trong ngày không ghi');
  }));
  check('A4 · Hoàn tác lưu ngay: phân công, chủ Case, người thực hiện PA, thông báo về như trước; ghi_dao có dao_luc', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA), pa = paMoi(cL, gA);
    const truoc = JSON.stringify(all(`SELECT * FROM teacher_assignments WHERE class_id = ? ORDER BY id`, X));
    const r = pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    assert(chu(cL) === gB, 'đã chuyển');
    pc.hoanTacLuu(QL, { lo: r.lo });
    assert(JSON.stringify(all(`SELECT * FROM teacher_assignments WHERE class_id = ? ORDER BY id`, X)) === truoc, 'phân công về như trước');
    assert(chu(cL) === gA && one(`SELECT performer_user_id u FROM case_interventions WHERE id = ?`, pa).u === gA, 'Case / PA về A');
    assert(!one(`SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'phan_cong_moi'`, gB) && !one(`SELECT 1 FROM doi_phan_cong WHERE id = ?`, r.lo), 'thông báo + dòng đổi gỡ');
    assert(one(`SELECT dao_luc FROM ghi_dao WHERE loai = 'phan_cong.luu' AND doi_tuong_id = ?`, r.lo)?.dao_luc, 'dao_luc');
  }));
  check('A4 · RF3: lưu ngay → đổi chủ Case vừa chuyển → Hoàn tác 409, phân công KHÔNG đổi', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA);
    const r = pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    own.doiChuCase(QL, cL, { ownerId: gA, ownerCu: gB });
    const n = one(`SELECT COUNT(*) n FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, X).n;
    const e = maLoi(() => pc.hoanTacLuu(QL, { lo: r.lo }));
    assert(e?.status === 409 && /Không hoàn tác được/.test(e.message), `${e?.status} ${e?.message}`);
    assert(one(`SELECT COUNT(*) n FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, X).n === n && ai(X, 'listening')[0] === gB, 'không đảo nửa chừng');
  }));
  check('A4 · Huỷ lịch đổi → huy; Hoàn tác huỷ → cho lại; Đổi mốc sang Ngay hôm nay → áp ngay', () => thu(() => {
    const r = henL(gB);
    const h = pc.huyCho(QL, [r.lo]);
    assert(one(`SELECT trang_thai t FROM doi_phan_cong WHERE id = ?`, r.lo).t === 'huy', 'huỷ');
    pc.hoanTacLuu(QL, { dao: h.dao });
    assert(one(`SELECT trang_thai t FROM doi_phan_cong WHERE id = ?`, r.lo).t === 'cho', 'hoàn tác huỷ');
    const m = pc.doiMocCho(QL, [r.lo], { loai: 'hom-nay' });
    const dong = one(`SELECT * FROM doi_phan_cong WHERE id = ?`, r.lo);
    assert(dong.trang_thai === 'da_ap' && dong.hieu_luc === TODAY && ai(X, 'listening')[0] === gB && m.dao, JSON.stringify(dong));
    const r2 = pc.luuPhanCong(QL, { lop: [{ classId: Y, slots: doiO(Y, 'reading', gB) }], hieuLuc: { loai: 'tuan', tuanId: T14 } });
    pc.doiMocCho(QL, [r2.lo], { loai: 'tuan', tuanId: tuan(addDays(T2, 21)) });
    assert(one(`SELECT hieu_luc h FROM doi_phan_cong WHERE id = ?`, r2.lo).h === addDays(T2, 21), 'đổi mốc sang tuần khác');
  }));
  check('A4 · CX / GVBM gọi Hoàn tác, Huỷ / Đổi mốc lịch đổi → 403', () => thu(() => {
    const r = henL(gB);
    const cx = loadPrincipal(nguoi([{ role: 'cx', branches: [] }]));
    for (const [ten, p] of [['CX', cx], ['GVBM', loadPrincipal(gC)]] as const) {
      assert(maLoi(() => pc.hoanTacLuu(p, { lo: r.lo }))?.status === 403, `${ten} hoàn tác`);
      assert(maLoi(() => pc.huyCho(p, [r.lo]))?.status === 403, `${ten} huỷ`);
      assert(maLoi(() => pc.doiMocCho(p, [r.lo], { loai: 'hom-nay' }))?.status === 403, `${ten} đổi mốc`);
    }
  }));

  /* ---------------------------------------------------------------- A5 · GV cũ chỉ xem lớp cũ có hạn */
  const perm: any = await import('../permissions.ts');
  const PM = (await import('../../../shared/domain/index.ts')).PERMISSIONS;
  check('A5 · đổi R ngay (GV R không còn ô nào): xem lượt + học viên được; nhập điểm R, báo Case, ghi vi phạm không', () => thu(() => {
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'reading', gB) }] });
    const c = loadPrincipal(gC);
    assert(perm.can(c, PM.ATTEMPT_VIEW, { classId: X }) && perm.can(c, PM.STUDENT_VIEW, { classId: X }) && perm.can(c, PM.STUDENT_VIEW, { studentId: emX }), 'xem được');
    assert(!perm.can(c, PM.SCORE_EDIT, { classId: X, skill: 'reading' }) && !perm.can(c, PM.SOS_REPORT, { classId: X }) && !perm.can(c, PM.VIOLATION_RECORD, { classId: X }), 'không sửa');
  }));
  check('A5 · hết mốc (hiệu lực + 8 ngày): không xem; scopeFor(ATTEMPT_VIEW) hôm nay có lớp, +8 không', () => thu(() => {
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'reading', gB) }] });
    const c = loadPrincipal(gC);
    assert(!perm.can(c, PM.ATTEMPT_VIEW, { classId: X, date: addDays(TODAY, 8) }), '+8 không xem');
    assert(perm.scopeFor(c, PM.ATTEMPT_VIEW, TODAY).classIds.includes(X) && !perm.scopeFor(c, PM.ATTEMPT_VIEW, addDays(TODAY, 8)).classIds.includes(X), 'scopeFor');
  }));
  check('A5 · classOverview của GV cũ đọc được, không có quyền nhập điểm / + Case', () => thu(() => {
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'reading', gB) }] });
    const v = classes.classOverview(loadPrincipal(gC), X).viewer;
    assert(!v.canEnterScores && !v.canReportCase && !v.canRecordViolation, JSON.stringify(v));
  }));
  check('A5 · GV chi nhánh khác / TVV không được thêm quyền gì (scopeFor trước = sau lần đổi)', () => thu(() => {
    const cpGv = loadPrincipal(nguoi([{ role: 'teacher', branches: ['CP'] }]));
    const tvv = loadPrincipal(nguoi([{ role: 'consultant', branches: ['MB'] }]));
    const sc = (p: any) => JSON.stringify([perm.scopeFor(p, PM.ATTEMPT_VIEW), perm.scopeFor(p, PM.STUDENT_VIEW), perm.can(p, PM.ATTEMPT_VIEW, { classId: X })]);
    const truoc = [sc(cpGv), sc(tvv)];
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'reading', gB) }] });
    assert(sc(loadPrincipal(cpGv.userId)) === truoc[0] && sc(loadPrincipal(tvv.userId)) === truoc[1], 'không đổi');
  }));

  /* ---------------------------------------------------------------- A6 · GET góc theo chi nhánh · xem trước hộp Lưu · số câu cố định */
  const ngc: any = await import('../platform/nguCanhRequest.ts');
  check('A6 · QL MB: mọi lớp active của MB, slots đúng teacher_assignments, gv = ứng viên MB ∪ người giữ ô', () => thu(() => {
    const tr = pc.trangPhanCongGv(QL, MB);
    const lopSql = all(`SELECT id FROM classes WHERE branch_id = ? AND status = 'active' ORDER BY id`, MB).map((r) => r.id).join(',');
    assert(tr.sua === true && tr.chiNhanh?.id === MB && tr.lop.map((l: any) => l.id).sort((a: number, b: number) => a - b).join(',') === lopSql, 'tập lớp');
    const x = tr.lop.find((l: any) => l.id === X);
    const k = (ds: any[]) => ds.map((s: any) => `${s.isCore ? 'gvcn' : s.skill}:${s.userId}`).sort().join(',');
    assert(x && k(x.slots) === k(slotsCua(X)) && x.ft === true && x.soHv >= 1 && x.phienBan === classes.classTeachers(QL, X).phienBan, JSON.stringify(x));
    const ungVien = new Set(classes.teacherCandidatesBranch(MB).map((u: any) => u.id));
    const giu = new Set(tr.lop.flatMap((l: any) => l.slots.map((s: any) => s.userId)));
    assert(tr.gv.every((g: any) => ungVien.has(g.id) || giu.has(g.id)) && [...ungVien].every((id) => tr.gv.some((g: any) => g.id === id)), 'gv');
  }));
  check('A6 · CX đọc được (sua = false); GVCN, GVBM, TVV, Admin MT → 403', () => thu(() => {
    const cx = loadPrincipal(nguoi([{ role: 'cx', branches: [] }]));
    const tr = pc.trangPhanCongGv(cx, MB);
    assert(tr.sua === false && tr.lop.length > 0, 'CX xem');
    const adminMt = loadPrincipal(nguoi([{ role: 'office_admin', branches: ['MB'] }]));
    const tvv = loadPrincipal(nguoi([{ role: 'consultant', branches: ['MB'] }]));
    for (const [ten, p] of [['GVCN', loadPrincipal(gA)], ['GVBM', loadPrincipal(gC)], ['TVV', tvv], ['Admin MT', adminMt]] as const) {
      const e = maLoi(() => pc.trangPhanCongGv(p, MB));
      assert(e?.status === 403, `${ten} phải 403, được ${e?.status}`);
    }
    const tq = pc.trangPhanCongGv(P.admin, null);
    assert(tq.canChonChiNhanh === true && tq.chiNhanh === null && tq.lop.length === 0, 'Quản trị nhiều chi nhánh: chọn chi nhánh');
  }));
  check('A6 · demPhanCong(trang.lop) khớp đếm SQL trực tiếp (một nguồn)', () => thu(() => {
    const tr = pc.trangPhanCongGv(QL, MB);
    const m = d.demPhanCong(tr.lop);
    const sql = all(`SELECT ta.user_id u, SUM(ta.is_core = 0 AND c.is_fast_track = 1) ft, SUM(ta.is_core = 0 AND c.is_fast_track = 0) th,
        SUM(ta.is_core = 1 AND c.is_fast_track = 1) cnFt, SUM(ta.is_core = 1 AND c.is_fast_track = 0) cnTh
      FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.status = 'active' AND c.status = 'active' AND c.branch_id = ? GROUP BY ta.user_id`, MB);
    for (const r of sql) {
      const x = m.get(r.u);
      assert(x && x.ft === r.ft && x.th === r.th && x.cnFt === r.cnFt && x.cnTh === r.cnTh, `GV ${r.u}: ${JSON.stringify(x)} ≠ ${JSON.stringify(r)}`);
    }
    assert(m.size === sql.length, `${m.size} ≠ ${sql.length}`);
  }));
  check('A6 · xemTruocLuu đổi L có 1 Case L của A → soCase 1, người viết GV cũ, soEm; lưu thật chuyển đúng Case đó', () => thu(() => {
    const cL = caseMoi(emX, 'listening', gA);
    const xt = pc.xemTruocLuu(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    const cap = xt.lop[0].cap;
    assert(cap.length === 1 && cap[0].soCase === 1 && cap[0].soPa === 0 && cap[0].nhan === 'L' && cap[0].nguoiViet.loai === 'gv-cu' && cap[0].nguoiViet.id === gA, JSON.stringify(xt));
    assert(xt.lop[0].soEm >= 1 && xt.lop[0].code === 'MB PCGV-X' && chu(cL) === gA, 'không ghi');
    pc.luuPhanCong(QL, { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] });
    assert(chu(cL) === gB, 'cùng Case');
    assert(maLoi(() => pc.xemTruocLuu(loadPrincipal(gC), { lop: [{ classId: X, slots: doiO(X, 'listening', gB) }] }))?.status === 403, 'GVBM 403');
  }));
  check('A6 · số câu SQL của GET góc không tăng theo số lớp (thêm 2 lớp có phân công: chênh 0)', () => thu(() => {
    const dem = () => ngc.trongBoNho(() => { const a = ngc.soCauSql(); pc.trangPhanCongGv(QL, MB); return ngc.soCauSql() - a; });
    dem();
    const n1 = dem();
    for (const code of ['MB PCGV-T1', 'MB PCGV-T2']) { const l = lopMoi(code); gan(l, gA, null); gan(l, gA, 'listening'); gan(l, gF, 'reading'); }
    xoaNho();
    dem();
    const n2 = dem();
    assert(n1 === n2, `${n1} → ${n2}`);
  }));

  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  check('A6 · POST /phan-cong/luu 3 lớp một ô (hôm nay) ≤ TRAN_GHI_LO.luuPhanCong3Lop câu', () => {
    thu(() => {
      const vao = [X, Y, Z].map((l) => ({ classId: l, slots: doiO(l, 'listening', gB) }));
      const a = ngc.soCauSql();
      pc.luuPhanCong(QL, { lop: vao });
      const n = ngc.soCauSql() - a;
      console.log(`    (đo: lưu 3 lớp một ô = ${n} câu)`);
      assert(n <= (TRAN_GHI_LO as any).luuPhanCong3Lop, `${n} câu > trần ${(TRAN_GHI_LO as any).luuPhanCong3Lop}`);
    });
  });
}
