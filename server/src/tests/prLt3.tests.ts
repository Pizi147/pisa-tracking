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
  check('LT3-1 laChamCheo chỉ Speaking của Mock', () => {
    assert(d.laChamCheo('mock', 'speaking') && !d.laChamCheo('mock', 'writing1') && !d.laChamCheo('mt0', 'speaking')
      && !d.laChamCheo('progress', 'speaking') && !d.laChamCheo(null, 'speaking'), 'cờ sai');
  });

  // ------------------------------------------------------------------ dữ liệu thử
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  const att: any = await import('../fasttrack/attempts.ts');
  const { luotThu } = await import('./luotThu.ts');
  const cls: any = await import('../classes/classes.ts');
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
    const k23 = [...nay.chamTuanNay, ...nay.lop];
    assert(qn.tong === k23.reduce((n: number, l: any) => n + l.tong, 0) && qn.conPhaiCham === k23.reduce((n: number, l: any) => n + l.conBai, 0)
      && !('quaHan' in qn), 'tuần này: dải số = khối 2 + khối 3, không còn ô Quá hạn');
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
      .filter((i) => i.group === 'score' && i.classId === LOP && /\bMT5\b/.test(i.contextLabel ?? '') && i.mine && /Speaking/.test(i.reason));   // OV-13c: việc gom theo tuần thi
    assert(!viec(P.sTeacher).length && !viec(P.coreTeacher).length, 'Việc cần làm còn dòng "của tôi" cho ô S Mock');
    const c = debt.scoreDebtCells(P.mbManager, TODAY, null).find((x: any) => x.attemptId === aid && x.skill === 'speaking');
    assert(c && c.userId === null && c.chamCheo === true && c.overdue === true, JSON.stringify(c));
    /* Quản lý › "Tất cả trong phạm vi": dòng S Mock ghi "GV chấm chéo", không của ai. */
    const tc = mw.myWork(P.mbManager, { nguoi: 'tat-ca' }).items.find((i: any) => i.group === 'score' && i.classId === LOP && /\bMT5\b/.test(i.contextLabel ?? '')
      && /Speaking/.test(i.reason));
    assert(tc && tc.statusLabel === d.CHAM_CHEO && !tc.mine, `"Tất cả trong phạm vi": ${JSON.stringify(tc && [tc.statusLabel, tc.mine])}`);
  });
  check('LT3-3 (c) khối 1: cột GV chấm ghi "GV chấm chéo", không tên GVBM S; GVBM S không "Chờ bạn chấm"', () => {
    const aid = emMoi(6, HAI, true);   // MT6: dòng khối 1 chỉ có ô S (MT5 tuần HAI còn em khác đủ L/R/W)
    const dong = xem(NAY).no.find((x: any) => x.attemptIds.includes(aid));
    assert(dong && dong.gvNo.includes(d.CHAM_CHEO) && !dong.gvNo.includes(P.sTeacher.fullName) && !dong.gvNo.includes('chưa phân công'),
      JSON.stringify(dong?.gvNo));
    const gv = cham.lichTest(P.sTeacher, pid(NAY), null, TODAY, { classId: LOP }).no.find((x: any) => x.attemptIds.includes(aid));
    assert(gv && gv.cuaToi === false && gv.duocCham === true && gv.coDayLop === false, JSON.stringify(gv && [gv.cuaToi, gv.duocCham, gv.coDayLop]));
    /* GVCN (dạy lớp): dòng chỉ còn ô S Mock → "Chờ chấm" (coDayLop false), không "Chờ GV khác". */
    const cn = cham.lichTest(P.coreTeacher, pid(NAY), null, TODAY, { classId: LOP }).no.find((x: any) => x.attemptIds.includes(aid));
    assert(cn && cn.cuaToi === false && cn.coDayLop === false, JSON.stringify(cn && [cn.cuaToi, cn.coDayLop]));
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
      return [...ptgv.tapChamDiem(c, ptgv.napBai(P.mbManager, c)).dong.values()];
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
    att.saveScore(cheo, aid, 'speaking', { criteria: S4, gvCham: { performerUserId: P.w1Teacher.userId } }, TODAY);
    const khac = cuaLuot(aid);
    assert(khac.length === 1 && khac[0].gv === P.w1Teacher.userId && khac[0].dung === false, `trễ của GV được chọn: ${JSON.stringify(khac)}`);
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

  check('LT3-3 (f) GV chấm chéo lớp khác, "Tất cả": thấy S Mock quá hạn ở khối 1 (cùng phạm vi khối 2/3 — rà #218 I2); không thấy lớp chi nhánh khác', () => {
    assert(cheoId, 'dữ liệu demo: cần một GV Speaking lớp FT khác cùng chi nhánh');
    const cheo = perm.loadPrincipal(cheoId);
    const aid = emMoi(7, HAI, true);
    const r = cham.lichTest(cheo, pid(NAY), null, TODAY, { classId: LOP, phamVi: 'tat-ca' });
    const dong = r.no.find((x: any) => x.attemptIds.includes(aid));
    assert(dong && dong.duocCham === true && dong.cuaToi === false, `khối 1 của GV chấm chéo: ${JSON.stringify(r.no.map((x: any) => x.key))}`);
    const cp = cham.lichTest(cheo, pid(NAY), null, TODAY, { classId: classId('CP FT 110'), phamVi: 'tat-ca' });
    assert(!cp.no.length && cp.lopDangLoc === null, 'lớp chi nhánh khác không lộ');
  });

  // ------------------------------------------------------------------ LT3-4 chuông
  const chamCheo: any = await import('../cham/chamCheo.ts');
  const ops: any = await import('../ops/chotVangDinhKy.ts');
  check('LT3-4 chuông "Speaking quá hạn chấm": GVBM S + GVCN, một lần; không GVBM W; S tuần trước không chuông; lượt quét thứ Hai gọi', () => {
    const don = () => conn.prepare(`DELETE FROM notifications WHERE kind = 'cham_cheo_qua_han'`).run();
    don();
    try {
      const aid = emMoi(5, HAI, true);
      const key = `chamcheo:${LOP}:5:${pid(HAI)}`;
      const nhan = () => (conn.prepare('SELECT user_id, title, body, duong FROM notifications WHERE dedup_key = ?').all(key) as any[]);
      assert(chamCheo.baoChamCheoQuaHan(TODAY) > 0, 'phải ghi chuông');
      const ds = nhan();
      const ids = new Set(ds.map((x) => x.user_id));
      /* Người nhận = GV đang phụ trách S của lớp (luật phân công chung) + GVCN đang hiệu lực — đọc lại lúc kiểm (phép kiểm trước có đổi phân công). */
      const gvS = debt.phanCongDangHieuLuc([LOP], TODAY).get(`${LOP}|speaking`)?.userId;
      const gvcn = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'
          AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`).all(LOP, TODAY, TODAY) as any[]).map((r) => r.user_id);
      const mong = new Set([gvS, ...gvcn].filter(Boolean));
      assert(mong.size > 0 && [...mong].every((id) => ids.has(id)) && ids.size === mong.size && ds.length === ids.size,
        `người nhận ${JSON.stringify([...ids])} ≠ GV S + GVCN ${JSON.stringify([...mong])}`);
      assert(ds[0].title === 'Speaking MT5 quá hạn chấm' && /MB FT 101 · W\d [A-Z]{3} · \d+ bài · GV chấm chéo$/.test(ds[0].body), ds[0].body);
      assert(ds[0].duong === `/test/lich?classId=${LOP}&kn=speaking`, ds[0].duong);
      chamCheo.baoChamCheoQuaHan(TODAY);
      assert(nhan().length === ds.length, 'chạy lại không gửi trùng');
      if (!mong.has(P.w1Teacher.userId)) assert(!ids.has(P.w1Teacher.userId), 'GVBM W1 không nhận');
      void aid;
      emMoi(5, TRUOC, true);
      don();
      chamCheo.baoChamCheoQuaHan(TODAY);
      assert(!(conn.prepare('SELECT 1 FROM notifications WHERE dedup_key = ?').get(`chamcheo:${LOP}:5:${pid(TRUOC)}`)), 'S tuần trước (khối 2) không chuông');
      /* Tuần thi cũ hơn 4 tuần (rà #218): không chuông — lần đầu chạy trên bản chính không dồn nợ cũ. */
      const CU = t.addDays(NAY, -7 * 5);
      emMoi(5, CU, true);
      don();
      chamCheo.baoChamCheoQuaHan(TODAY);
      assert(!(conn.prepare('SELECT 1 FROM notifications WHERE dedup_key = ?').get(`chamcheo:${LOP}:5:${pid(CU)}`)), 'S Mock thi 5 tuần trước không chuông');
      const BON = t.addDays(NAY, -7 * 4);
      emMoi(5, BON, true);
      chamCheo.baoChamCheoQuaHan(TODAY);
      assert(conn.prepare('SELECT 1 FROM notifications WHERE dedup_key = ?').get(`chamcheo:${LOP}:5:${pid(BON)}`), 'S Mock thi 4 tuần trước vẫn chuông');
      emMoi(5, HAI, true);
      don();
      ops.chotVangDinhKy({ ngay: TODAY, chuyen: () => 0, daKhoiTao: () => true });
      assert(nhan().length > 0, 'lượt quét thứ Hai phải gọi chuông');
    } finally { don(); }
  });
}
