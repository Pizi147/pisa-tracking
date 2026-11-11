/**
 * PR-LT3 — Lịch Test ba khối (T15–T17) + Speaking Mock chấm chéo (T18).
 *
 * Hôm nay demo = thứ Hai: NAY = tuần này, TRUOC = tuần trước (khối 2), HAI = hai tuần trước (quá hạn → khối 1).
 * Em thử: em cuối của MB FT 101, bỏ lịch tự tạo rồi dựng MT{n} ở tuần cần (như prMt). Mỗi lần dựng xoá lượt cũ của em.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt3Tests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LT3 · Lịch Test ba khối + Speaking chấm chéo');

  // ------------------------------------------------------------------ LT3-1 luật thuần
  check('LT3-1 khoiCham: tuần trước ở khối 2 kể cả quá hạn; cũ hơn quá hạn → khối 1; hạn riêng dời xa → khối 2', () => {
    const nay = '2026-10-05';
    assert(d.khoiCham({ tuanThi: '2026-10-05', tuanHomNay: nay, quaHan: false }) === 'lich', 'tuần này');
    assert(d.khoiCham({ tuanThi: '2026-10-12', tuanHomNay: nay, quaHan: false }) === 'lich', 'tuần sau');
    assert(d.khoiCham({ tuanThi: '2026-09-28', tuanHomNay: nay, quaHan: false }) === 'tuan-nay', 'tuần trước chưa quá hạn');
    assert(d.khoiCham({ tuanThi: '2026-09-28', tuanHomNay: nay, quaHan: true }) === 'tuan-nay', 'tuần trước đã quá hạn (thứ Năm) vẫn khối 2');
    assert(d.khoiCham({ tuanThi: '2026-09-21', tuanHomNay: nay, quaHan: true }) === 'qua-han', 'sang tuần thứ hai + quá hạn');
    assert(d.khoiCham({ tuanThi: '2026-09-21', tuanHomNay: nay, quaHan: false }) === 'tuan-nay', 'hạn riêng dời xa');
  });
  check('LT3-1 laChamCheo chỉ Speaking của Mock + MT0 (LOP-THUONG-QUYEN, chủ SP 08/11)', () => {
    assert(d.laChamCheo('mock', 'speaking') && !d.laChamCheo('mock', 'writing1') && d.laChamCheo('mt0', 'speaking') && !d.laChamCheo('mt0', 'listening')
      && !d.laChamCheo('progress', 'speaking') && !d.laChamCheo(null, 'speaking'), 'cờ sai');
  });

  // ------------------------------------------------------------------ dữ liệu thử
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const att: any = await import('../fasttrack/attempts.ts');
  const { luotThu } = await import('./luotThu.ts');
  const cls: any = await import('../classes/classes.ts');
  const { capNhatConOCho } = await import('../fasttrack/conOCho.ts');
  const NAY = d.mondayOfDate(TODAY), TRUOC = t.addDays(NAY, -7), HAI = t.addDays(NAY, -14);
  const LOP = classId('MB FT 101');
  const pid = (ws: string) => week.ensurePeriod(ws).id as number;
  /** Em MỚI của LOP (chép lộ trình của một em đang học), MT{no} thi tuần `ws`, mọi kỹ năng cùng tuần, chưa điểm. `chiS` → chỉ Speaking bắt buộc. */
  let stt = 0;
  const NOW = new Date().toISOString();
  const emMoi = (no: number, ws: string, chiS = false) => {
    stt += 1;
    const tag = `PRLT3-${stt}`;   // lenLop dùng tiền tố `LT3-`
    const mau: any = conn.prepare(`SELECT cy.* FROM enrollments e JOIN learning_cycles cy ON cy.student_id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND cy.status = 'active' ORDER BY e.student_id LIMIT 1`).get(LOP);
    const branch = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP) as any).b;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(sid, LOP, mau.started_at, NOW);
    const cid = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
       VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`,
    ).run(sid, mau.route, mau.programme_code, mau.target_score, mau.started_at, NOW).lastInsertRowid);
    const a = luotThu(conn, att.createAttempt, P.admin, { studentId: sid, cycleId: cid, classId: LOP, no, periodId: pid(ws) });
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(pid(ws), a.id);
    /* Lượt tạo sau khi tuần thi đã hết tự thành MT cũ (T34) — ở đây là lượt thật của tuần đó (tạo đúng tuần, chưa chấm). */
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.id);
    if (chiS) conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill != 'speaking'`).run(a.id);
    capNhatConOCho([a.id]);   // TURSO-LOG-1311: cờ "còn ô chờ" xét `lich_su` (MT lịch sử FT không chờ) — ghi SQL thẳng thì tính lại như đường thật
    return a.id as number;
  };
  const xem = (ws: string, p: any = P.mbManager) => cham.lichTest(p, pid(ws), null, TODAY, { classId: LOP, phamVi: 'tat-ca' });
  const oCua = (r: any, aid: number, ws: string) => ({
    k1: r.no.filter((x: any) => x.attemptIds.includes(aid)).reduce((n: number, x: any) => n + x.conBai, 0),
    k2: (r.chamTuanNay ?? []).filter((l: any) => l.weekStart === ws).reduce((n: number, l: any) => n + l.conBai, 0),
  });

  // ------------------------------------------------------------------ LT3-2 ba khối ở máy chủ
  check('LT3-2 (a) MỘT bài đúng MỘT khối: thi tuần trước → khối 2, không ở khối 1 dù đã quá hạn', () => {
    const aid = emMoi(4, TRUOC);
    conn.prepare(`UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ? AND skill = 'listening'`).run(t.addDays(TRUOC, 3), aid);
    const r = xem(NAY);
    assert(r.laTuanNay && r.chamTuanNay, 'khối 2 có ở tuần hiện tại');
    assert(!r.no.some((x: any) => x.attemptIds.includes(aid)), 'bài thi tuần trước không vào khối 1');
    const h = r.chamTuanNay.find((l: any) => l.classId === LOP && l.weekStart === TRUOC);
    assert(h && h.quaHan && h.periodId === pid(TRUOC), `khối 2 có hàng lớp, cờ quá hạn: ${JSON.stringify(h && [h.quaHan, h.periodId])}`);
    assert(r.lop.every((l: any) => l.weekStart === NAY && l.periodId === pid(NAY)), 'khối 3 chỉ tuần đang xem');
  });
  check('LT3-2 (b) sang tuần thứ hai + quá hạn → khối 1; hạn riêng dời xa → khối 2', () => {
    const aid = emMoi(5, HAI);
    let r = xem(NAY);
    assert(oCua(r, aid, HAI).k1 > 0 && oCua(r, aid, HAI).k2 === 0, `khối 1: ${JSON.stringify(oCua(r, aid, HAI))}`);
    conn.prepare('UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ?').run(t.addDays(TODAY, 3), aid);
    r = xem(NAY);
    assert(oCua(r, aid, HAI).k1 === 0 && oCua(r, aid, HAI).k2 > 0, `hạn riêng → khối 2: ${JSON.stringify(oCua(r, aid, HAI))}`);
    const h = r.chamTuanNay.find((l: any) => l.weekStart === HAI);
    assert(h.periodId === pid(HAI) && h.conBai === h.tong, `hàng hạn riêng chỉ các ô còn nợ: ${h.conBai}/${h.tong}`);
    /* W1 đã chấm, W2 còn: hàng hạn riêng không kéo W1 vào (lọc theo Ô NHẬP, không theo kỹ năng gộp). */
    att.saveScore(P.admin, aid, 'writing1', { criteria: [9, 9, 9, 9], nhanXet: 'Nhận xét đủ mười ký tự.' }, TODAY);   // V5 SV-SO1: xong = band + nhận xét
    const h2 = xem(NAY).chamTuanNay.find((l: any) => l.weekStart === HAI);
    assert(h2 && h2.conBai === h2.tong && h2.tong === h.tong - 1, `W1 đã chấm không vào hàng hạn riêng: ${h2?.conBai}/${h2?.tong} (trước ${h.tong})`);
  });
  check('LT3-2 (c) lùi / tiến tuần: khối 1 không đổi, khối 2 ẩn, khối 3 theo tuần xem', () => {
    emMoi(5, HAI);
    const k1 = (ws: string) => JSON.stringify(xem(ws).no.map((x: any) => [x.key, x.conBai]));
    assert(xem(NAY).no.length > 0, 'phải có khối 1 để so');
    assert(k1(NAY) === k1(TRUOC) && k1(NAY) === k1(t.addDays(NAY, 7)) && k1(NAY) === k1(HAI), 'khối 1 đổi theo tuần xem');
    const truoc = xem(TRUOC);
    assert(!truoc.laTuanNay && truoc.chamTuanNay === null, 'khối 2 chỉ ở tuần hiện tại');
    assert(truoc.lop.every((l: any) => l.weekStart === TRUOC), 'khối 3 = tuần đang xem');
    const q = truoc.tongQuan;
    assert(q.tong === truoc.lop.reduce((n: number, l: any) => n + l.tong, 0) && q.no.bai === truoc.no.reduce((n: number, x: any) => n + x.conBai, 0),
      'tuần khác: dải số = khối 3 + khối 1');
    const nay = xem(NAY), qn = nay.tongQuan;
    /* UI-LICH-TUAN (C13): Lịch tuần một tuần — tuần này cũng chỉ cộng khối 3 (khối 2 không còn trên màn). */
    assert(qn.tong === nay.lop.reduce((n: number, l: any) => n + l.tong, 0) && qn.conPhaiCham === nay.lop.reduce((n: number, l: any) => n + l.conBai, 0)
      && !('quaHan' in qn), 'tuần này: dải số = khối 3, không còn ô Quá hạn');
  });
  check('LT3-2 (d) G-10: tổng ba khối = badge "n bài chờ chấm" ở tuần hiện tại (mỗi lớp FT)', () => {
    emMoi(4, TRUOC);
    const tom = cls.listClassSummaries(P.mbManager, { scope: 'managed' });
    const ds = (Array.isArray(tom) ? tom : tom.classes ?? tom.rows ?? []) as any[];
    const ft = ds.filter((c: any) => c.scoringMode !== 'ratio' && c.needScores !== undefined);
    assert(ft.some((c: any) => c.needScores > 0), 'Seed: phải có lớp FT còn bài chờ chấm');
    for (const s of ft) {
      const r = cham.lichTest(P.mbManager, pid(NAY), null, TODAY, { classId: s.id, phamVi: 'tat-ca' });
      const k = [r.no.reduce((n: number, x: any) => n + x.conBai, 0), (r.chamTuanNay ?? []).reduce((n: number, l: any) => n + l.conBai, 0),
        r.lop.reduce((n: number, l: any) => n + l.conBai, 0)];
      /* Rà 11/11 #2 (G1-01): S chấm chéo quá hạn vào khối 1 — ba khối cộng đúng badge. */
      if (k[0] + k[1] + k[2] !== s.needScores) {
        /* In chi tiết khi lệch (giữ từ G-10 cũ): ô chờ chấm theo khối của chính ô. */
        const cells = att.listAttempts(P.mbManager, { classId: s.id, scope: 'managed', chiDangHoc: true }).rows
          .filter((a: any) => a.status !== 'cancelled').flatMap((a: any) => a.pendingDetail ?? []);
        const dem: Record<string, number> = {};
        for (const x of cells) {
          const kh = x.weekStart ? d.khoiCham({ tuanThi: x.weekStart, tuanHomNay: NAY, quaHan: x.overdue }) : 'khong-tuan';
          dem[kh] = (dem[kh] ?? 0) + 1;
        }
        throw new Error(`${s.code}: ba khối ${k.join(' + ')} ≠ badge ${s.needScores} · pendingDetail theo khối ${JSON.stringify(dem)}`);
      }
    }
  });

  // ------------------------------------------------------------------ LT3-3 Speaking Mock chấm chéo (T18)
  const debt: any = await import('../worklist/scoreDebt.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const ptgv: any = await import('../phanTich/giaoVien.ts');
  const soCu: any = await import('./soCu.ts');   // PR-3 sổ nghĩa vụ: thay tapChamDiem / oChamDiemGv / viecQuaHanMo cũ
  const metrics: any = await import('../worklist/metrics.ts');
  const perm: any = await import('../permissions.ts');
  const MB = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(LOP) as any).branch_id as number;
  /* GV Speaking lớp FT KHÁC cùng chi nhánh, không dạy S ở LOP — người chấm chéo. */
  const cheoId = (conn.prepare(`SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.skill = 'speaking' AND ta.status = 'active' AND c.branch_id = ? AND c.is_fast_track = 1 AND c.id != ?
        AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active')
      ORDER BY ta.id LIMIT 1`).get(MB, LOP, LOP) as any)?.user_id as number | undefined;
  const dongS = (aid: number) => conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).get(aid) as any;
  const S4 = [6, 6, 6, 6];

  check('LT3-3 (a) ô S Mock: không ai được phân công (mine/viec = false) nhưng GVBM S vẫn sửa được', () => {
    const aid = emMoi(5, HAI, true);
    const s = att.attemptDetail(P.sTeacher, aid).cells.find((c: any) => c.skill === 'speaking');
    assert(s.mine === false && s.viec === false && s.canEdit === true, JSON.stringify([s.mine, s.viec, s.canEdit]));
  });
  check('LT3-3 (b) S Mock quá hạn không là nợ của GVBM S / GVCN: badge, Việc cần làm, Nợ điểm (userId null + chamCheo)', () => {
    /* Badge "n bài chờ chấm" ở Học viên & Lớp (`listClassSummaries`, rà #218 I1) — đếm trước / sau khi thêm một ô S Mock quá hạn. */
    const badge = (p: any) => ((cls.listClassSummaries(p).rows ?? []) as any[]).find((c) => c.id === LOP)?.needScores ?? 0;
    const truoc = { s: badge(P.sTeacher), cn: badge(P.coreTeacher), ql: badge(P.mbManager) };
    const aid = emMoi(5, HAI, true);
    const sau = { s: badge(P.sTeacher), cn: badge(P.coreTeacher), ql: badge(P.mbManager) };
    assert(sau.s === truoc.s && sau.cn === truoc.cn && sau.ql === truoc.ql + 1, `badge trước ${JSON.stringify(truoc)} → sau ${JSON.stringify(sau)} (GVBM S, GVCN không đổi; QL +1)`);
    const a = att.listAttempts(P.sTeacher, { classId: LOP }).rows.find((x: any) => x.id === aid);
    assert(a && !a.pendingSkills.includes('speaking'), `danh sách cần chấm GVBM S đếm ô S: ${JSON.stringify(a?.pendingSkills)}`);
    const viec = (p: any) => (mw.myWork(p).items as any[])
      .filter((i) => i.group === 'score' && i.classId === LOP && i.tuanThi === HAI && i.mine && /Speaking/.test(i.reason));   // OV-13c: việc gom theo tuần thi
    assert(!viec(P.sTeacher).length && !viec(P.coreTeacher).length, 'Việc cần làm còn dòng "của tôi" cho ô S Mock');
    const c = debt.scoreDebtCells(P.mbManager, TODAY, null).find((x: any) => x.attemptId === aid && x.skill === 'speaking');
    assert(c && c.userId === null && c.chamCheo === true && c.overdue === true, JSON.stringify(c));
    /* Quản lý › "Tất cả trong phạm vi": dòng S Mock ghi "GV chấm chéo", không của ai. */
    const tc = mw.myWork(P.mbManager, { nguoi: 'tat-ca' }).items.find((i: any) => i.group === 'score' && i.classId === LOP && i.tuanThi === HAI
      && /Speaking/.test(i.reason));
    assert(tc && tc.statusLabel === d.CHAM_CHEO && !tc.mine, `"Tất cả trong phạm vi": ${JSON.stringify(tc && [tc.statusLabel, tc.mine])}`);
  });
  check('LT3-3 (c) khối 1 CÓ S Mock chấm chéo quá hạn (rà 11/11 #2, G1-01: cùng tập với dải số), ghi "GV chấm chéo"; GVBM S không "Chờ bạn chấm" ở khối 2', () => {
    const aid = emMoi(6, HAI, true);   // MT6: chỉ ô S
    for (const p of [P.mbManager, P.sTeacher, P.coreTeacher]) {
      const dong = cham.lichTest(p, pid(NAY), null, TODAY, { classId: LOP, phamVi: 'tat-ca' }).no.find((x: any) => x.attemptIds.includes(aid));
      assert(dong && dong.gvNo.includes(d.CHAM_CHEO) && !dong.cuaToi, `${p.fullName}: S chấm chéo quá hạn phải ở khối 1: ${JSON.stringify(dong && [dong.gvNo, dong.cuaToi])}`);
    }
    /* Khối 2/3: S Mock không là "bài của tôi" của GVBM S (nhãn "Chờ bạn chấm" / tự mở). */
    emMoi(5, TRUOC, true);
    const h = xem(NAY, P.sTeacher).chamTuanNay.find((l: any) => l.classId === LOP && l.weekStart === TRUOC);
    assert(h && h.conBai > 0 && h.conBaiCuaToi === 0 && h.nhan.loai !== 'cho-ban', JSON.stringify(h && [h.conBai, h.conBaiCuaToi, h.nhan]));
    /* Việc cần làm trỏ Lịch Test KHÔNG kèm tuần (tuần hiện tại có đủ ba khối). */
    const viecS = (mw.myWork(P.mbManager, { nguoi: 'tat-ca' }).items as any[]).filter((i) => i.group === 'score' && i.classId === LOP);
    assert(viecS.length > 0 && viecS.every((i) => !/periodId=/.test(i.href)), JSON.stringify(viecS.map((i) => i.href)));
  });
  check('LT3-3 (d) Phân tích GV: GV chấm chéo lưu muộn (không chọn GV chấm) → ghi người lưu, trễ của người đó; người ngoài → không ai; chưa nhập → GVBM S không trễ', () => {
    assert(cheoId, 'dữ liệu demo: cần một GV Speaking lớp FT khác cùng chi nhánh');
    const cheo = perm.loadPrincipal(cheoId);
    const pt = () => {
      const c = ptgv.nguCanhPtGv(P.mbManager, { cn: MB, ct: 'ft', tu: HAI, den: NAY });
      return [...soCu.dongChamSo(c).values()];
    };
    const cuaLuot = (aid: number) => pt().filter((x: any) => Math.floor(x.id / 10) === aid);
    let aid = emMoi(5, HAI, true);
    assert(!cuaLuot(aid).length, 'ô S chưa nhập: không trễ cho ai (GVBM S không bị tính)');
    att.saveScore(cheo, aid, 'speaking', { criteria: S4 }, TODAY);
    assert(dongS(aid).examiner_user_id === cheoId, `Q3: lưu S không chọn GV chấm → ghi người lưu: ${dongS(aid).examiner_user_id}`);
    const o = cuaLuot(aid);
    assert(o.length === 1 && o[0].gv === cheoId && o[0].dung === false, `trễ của GV chấm chéo: ${JSON.stringify(o)}`);
    /* Chủ sản phẩm 06/10: người lưu chọn GV chấm là tài khoản khác → trễ tính cho người được chọn. */
    aid = emMoi(5, HAI, true);
    /* Chủ SP 10/11 (sổ nghĩa vụ 1.2 c): người được chọn chấm S chéo phải là GV có kỹ năng S — chọn một GV S khác người lưu. */
    const gvS = (conn.prepare(`SELECT u.id FROM users u JOIN user_skills us ON us.user_id = u.id AND us.skill = 'speaking' JOIN user_roles ur ON ur.user_id = u.id
        AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher' WHERE u.status = 'active' AND u.id != ? ORDER BY u.id LIMIT 1`).get(cheoId) as any).id as number;
    att.saveScore(cheo, aid, 'speaking', { criteria: S4, gvCham: { performerUserId: gvS } }, TODAY);
    const khac = cuaLuot(aid);
    assert(khac.length === 1 && khac[0].gv === gvS && khac[0].dung === false, `trễ của GV được chọn: ${JSON.stringify(khac)}`);
    aid = emMoi(5, HAI, true);
    att.saveScore(cheo, aid, 'speaking', { criteria: S4, gvCham: { performerName: 'Cô Lan (ngoài)' } }, TODAY);
    assert(dongS(aid).examiner_user_id === null && dongS(aid).examiner_name === 'Cô Lan (ngoài)', 'người ngoài');
    assert(!cuaLuot(aid).length, 'GV chấm là người ngoài → không ô nào cho ai');
    /* Đợt đã đủ điểm + qua Chủ nhật = hoàn tất (R11): chỉ Quản lý / Quản trị sửa — lưu lại không kèm GV chấm vẫn giữ người ngoài. */
    att.saveScore(P.admin, aid, 'speaking', { criteria: [7, 7, 7, 7], lyDo: 'Chấm lại' }, TODAY);
    assert(dongS(aid).examiner_user_id === null && dongS(aid).examiner_name === 'Cô Lan (ngoài)', 'đã có GV chấm thì lưu lại không ghi đè');
  });
  check('LT3-3 (e) chỉ số "bài quá hạn nhập điểm" của QL vẫn đếm ô S Mock (người giữ việc = GV chấm chéo, không "chưa có người chấm")', () => {
    const aid = emMoi(5, HAI, true);
    const m = metrics.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB });
    const x = [...(m.chiTiet?.entries() ?? [])].find(([id]) => Math.floor(id / 10) === aid);
    assert(x && x[1].chamCheo === true && x[1].nguoi.length === 0, JSON.stringify(x));
  });

  check('LT3-3 (f) GV chấm chéo lớp khác, "Tất cả": thấy S Mock quá hạn ở khối 1 (rà 11/11 #2); không thấy lớp chi nhánh khác', () => {
    assert(cheoId, 'dữ liệu demo: cần một GV Speaking lớp FT khác cùng chi nhánh');
    const cheo = perm.loadPrincipal(cheoId);
    const aid = emMoi(7, HAI, true);
    const r = cham.lichTest(cheo, pid(NAY), null, TODAY, { classId: LOP, phamVi: 'tat-ca' });
    assert(r.no.some((x: any) => x.attemptIds.includes(aid)), 'rà 11/11 #2: S chấm chéo quá hạn vào khối 1');
    const cp = cham.lichTest(cheo, pid(NAY), null, TODAY, { classId: classId('CP FT 110'), phamVi: 'tat-ca' });
    assert(!cp.no.length && cp.lopDangLoc === null, 'lớp chi nhánh khác không lộ');
  });

  // ------------------------------------------------------------------ LT3-4 "quá hạn" chỉ ghi (chủ SP 06/11)
  const ops: any = await import('../ops/chotVangDinhKy.ts');
  check('LT3-4 S chấm chéo quá hạn: GV phụ trách S + GV S chấm chéo thấy "quá hạn" ở Công việc / Chấm Speaking; KHÔNG chuông, KHÔNG vào số quá hạn / badge', () => {
    const aid = emMoi(5, HAI, true);
    const gvS = debt.phanCongDangHieuLuc([LOP], TODAY).get(`${LOP}|speaking`)?.userId;
    const gvcn = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'
        AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`).all(LOP, TODAY, TODAY) as any[]).map((r) => r.user_id as number);
    /* CV-SUA-1011 (chủ SP 10/11, thay T18 06/11 phần GVCN): chỉ người chấm được S (GV Speaking) có việc — GVCN không S kiểm riêng bên dưới. */
    const ai = [...new Set([gvS, ...gvcn, cheoId].filter((x): x is number => !!x && perm.lopFtChoGvSpeaking(perm.loadPrincipal(x), TODAY).includes(LOP)))];
    assert(ai.length >= 2, `cần ≥ 2 người: ${JSON.stringify(ai)}`);
    const nhoTruoc = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind IN ('cham_cheo_qua_han')`).get() as any).n;
    for (const uid of ai) {
      const p = perm.loadPrincipal(uid);
      const w = mw.myWork(p);
      const it = (w.items as any[]).find((x) => x.key === d.KHOA_CHAM_SPEAKING);
      assert(it && it.urgency === 'overdue' && !!it.due, `${uid}: việc Chấm Speaking phải "quá hạn" có hạn: ${JSON.stringify(it && [it.urgency, it.due])}`);
      /* Không tính: số quá hạn đầu nhóm / badge / Tổng quan (demDongViec), tóm tắt máy chủ, chuông. */
      const khac = (w.items as any[]).filter((x) => x.key !== d.KHOA_CHAM_SPEAKING && !d.laViecChamCheo(x));
      assert(d.demDongViec(w.items as any[]).quaHan === d.demDongViec(khac).quaHan, `${uid}: demDongViec đếm việc chấm chéo`);
      assert(d.gomViecChuong([it]).length === 0, `${uid}: việc chấm chéo quá hạn sinh chuông "cham_qua_han"`);
      /* Hàng đợi (Chấm Test + panel): bài quá hạn có cờ + hạn. */
      const h = att.baiChamSpeaking(p, TODAY).rows.find((r: any) => r.attemptId === aid);
      assert(h && h.cho && h.cell.overdue === true && !!h.cell.deadline, `${uid}: Chấm Test thiếu bài quá hạn`);
    }
    /* CV-SUA-1011: GVCN không là GV Speaking — không việc "Chấm Speaking", không hàng đợi (kể cả bài quá hạn của lớp mình). */
    const chiCn = gvcn.find((id) => id !== gvS && !perm.lopFtChoGvSpeaking(perm.loadPrincipal(id), TODAY).includes(LOP));
    if (chiCn) {
      const x = perm.loadPrincipal(chiCn);
      assert(!(mw.myWork(x).items as any[]).some((i) => i.key === d.KHOA_CHAM_SPEAKING), 'GVCN không S vẫn có việc Chấm Speaking');
      assert(att.baiChamSpeaking(x, TODAY).rows.length === 0, 'GVCN không S vẫn có hàng đợi Chấm Speaking');
    }
    /* Chuông: không còn (lượt quét thứ Hai cũng không gọi). */
    ops.chotVangDinhKy({ ngay: TODAY, chuyen: () => 0, daKhoiTao: () => true });
    const nhoSau = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind IN ('cham_cheo_qua_han')`).get() as any).n;
    assert(nhoSau === nhoTruoc && nhoSau === 0, `chuông chấm chéo: ${nhoTruoc} → ${nhoSau}`);
  });
}
