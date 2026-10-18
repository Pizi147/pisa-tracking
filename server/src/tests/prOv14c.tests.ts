/**
 * PHÉP KIỂM OV-14c (chủ SP 18/10; thiết kế OV-14 mục 0) — Chấm Speaking theo vai:
 *  · GV Speaking = vai GV có `SCORE_EDIT` + (kỹ năng `speaking` ở hồ sơ HOẶC phân công S lớp FT) — không cần phân công từng lớp;
 *  · phạm vi = mọi lớp FT ở chi nhánh grant vai GV phủ (toàn hệ thống → mọi chi nhánh); nhập được ô S Mock, KHÔNG ô L/R/W;
 *  · bài S Mock vào Công việc từ thứ Hai tuần thi (`canChamCheo`), MỘT việc "Chấm Speaking · n bài" = đúng hàng đợi `/my-work/cham-speaking`;
 *  · GV không có kỹ năng S không thấy; Quản trị › Tài khoản có cờ `chamSpeaking` cùng hàm.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv14cTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const perm: any = await import('../permissions.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-14c · Chấm Speaking: GV Speaking theo kỹ năng hồ sơ, mọi lớp FT chi nhánh mình, từ thứ Hai tuần thi');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const MB = cn('MB');
  const ftCua = (b: number) => new Set<number>((conn.prepare('SELECT id FROM classes WHERE branch_id = ? AND is_fast_track = 1').all(b) as any[]).map((r) => r.id));
  const ftMb = ftCua(MB);
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[], skills: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov14c.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov14c', fullName: `Thử OV14c ${seq}`, roles, skills }).userId as number;
  };
  /* GV nước ngoài: chỉ có kỹ năng Speaking ở hồ sơ, KHÔNG một phân công nào. */
  const idS = tao([{ role: 'teacher', branches: ['MB'] }], ['speaking']);
  const idW = tao([{ role: 'teacher', branches: ['MB'] }], ['writing1']);
  /* Grant GV toàn hệ thống (`branch_id` NULL) — màn tạo tài khoản bắt chọn chi nhánh, dữ liệu vẫn có thể có (luật quyền đọc theo grant). */
  const idToan = tao([{ role: 'teacher', branches: ['MB'] }], ['speaking']);
  conn.prepare(`UPDATE user_roles SET branch_id = NULL WHERE user_id = ?`).run(idToan);
  const gvS = () => perm.loadPrincipal(idS);
  const viecCs = (p: any) => ((mywork.myWork(p).dong ?? []) as any[]).filter((x) => x.key === d.KHOA_CHAM_SPEAKING);

  check('OV14c-1 · luật thuần: bài chấm chéo cần chấm từ thứ Hai tuần thi (không chờ hết tuần); tuần sau chưa; không chấm chéo không', () => {
    const nay = d.mondayOfDate(TODAY);
    assert(d.canChamCheo(true, nay, nay), 'trong tuần thi phải thấy');
    assert(d.canChamCheo(true, d.addDaysIso(nay, -21), nay), 'tuần cũ chưa chấm vẫn còn');
    assert(!d.canChamCheo(true, d.addDaysIso(nay, 7), nay), 'tuần sau chưa tới');
    assert(!d.canChamCheo(false, nay, nay) && !d.canChamCheo(true, null, nay), 'không chấm chéo / không tuần');
  });

  check('OV14c-2 · GV chỉ có kỹ năng S (không phân công) = GV Speaking: mọi lớp FT chi nhánh MB, không chi nhánh khác; GV Writing không', () => {
    const p = gvS();
    assert(!p.assignments.length && p.kyNang.includes('speaking'), 'dữ liệu: GV không phân công, có kỹ năng S');
    assert(perm.laGvSpeaking(p, TODAY), 'phải là GV Speaking');
    const lop = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    assert(lop.size === ftMb.size && [...ftMb].every((id) => lop.has(id)), `phải đúng mọi lớp FT của MB (${lop.size}/${ftMb.size})`);
    const w = perm.loadPrincipal(idW);
    assert(!perm.laGvSpeaking(w, TODAY) && !perm.lopFtChoGvSpeaking(w, TODAY).length, 'GV Writing không phải GV Speaking');
    /* Grant toàn hệ thống → mọi lớp FT mọi chi nhánh. */
    const tat = perm.lopFtChoGvSpeaking(perm.loadPrincipal(idToan), TODAY).length;
    assert(tat === (one('SELECT COUNT(*) n FROM classes WHERE is_fast_track = 1').n as number), `toàn hệ thống: ${tat} lớp`);
    /* Kỹ năng S nhưng không có vai GV (chỉ QL) → không phải GV Speaking (luật vai giữ nguyên). */
    const ql = perm.loadPrincipal(P.mbManager.userId);
    assert(!perm.laGvSpeaking({ ...ql, kyNang: ['speaking'] }, TODAY), 'QL không phải GV Speaking');
  });

  check('OV14c-3 · hàng đợi Chấm Speaking = việc "Chấm Speaking · n bài" ở Công việc; chỉ lớp FT MB; không hạn, không quá hạn', () => {
    const p = gvS();
    const q = svc.baiChamSpeaking(p, TODAY);
    assert(q.soBai > 0, 'dữ liệu demo: phải có bài S Mock chờ chấm ở lớp FT MB');
    assert(q.rows.every((r: any) => ftMb.has(r.classId)), 'lọt lớp ngoài MB');
    assert(q.rows.every((r: any) => r.cell.skill === 'speaking' && r.cell.canEdit !== undefined), 'mỗi dòng một ô S');
    const ds = viecCs(p);
    assert(ds.length === 1, `phải MỘT việc Chấm Speaking (${ds.length})`);
    const v = ds[0];
    assert(v.tieuDe === `${d.VIEC_CHAM_CHEO} · ${q.soBai} bài` && v.soBai === q.soBai, `số bài Công việc ≠ hàng đợi: ${v.tieuDe} / ${q.soBai}`);
    assert(v.urgency === 'normal' && v.due === null, 'không hạn / quá hạn (T18)');
    assert(d.laViecChamCheo(v) && v.group === 'score', 'khoá chấm chéo');
    /* Không còn dòng gộp "theo tuần" cũ của OV-13g cho GV này. */
    assert(!(mywork.myWork(p).dong as any[]).some((x) => d.laViecChamCheo(x) && x.key !== d.KHOA_CHAM_SPEAKING), 'còn dòng chấm chéo cũ');
  });

  check('OV14c-4 · GV Speaking nhập được S Mock lớp FT MB; KHÔNG L/R/W; KHÔNG lớp FT chi nhánh khác', () => thu(() => {
    const p = gvS();
    const truoc = svc.baiChamSpeaking(p, TODAY);
    const tuanTruoc = d.addDaysIso(d.mondayOfDate(TODAY), -7);
    /* Bài thi từ tuần trước: chấm xong vẫn ở hàng đợi ("Nhập bởi …"); bài còn tồn cũ hơn rời hàng đợi (web giữ chỗ dòng vừa lưu). */
    const r = truoc.rows.find((x: any) => x.cho && x.cell.canEdit && (x.weekStart ?? '').slice(0, 10) >= tuanTruoc)
      ?? truoc.rows.find((x: any) => x.cho && x.cell.canEdit);
    assert(r, 'cần một bài S chờ chấm sửa được');
    svc.saveScore(p, r.attemptId, 'speaking', { criteria: [6, 6.5, 6, 7], nhanXet: 'Fluent, good range of vocabulary.', gvCham: { performerSelf: true } }, TODAY);
    xoaNho();
    const sau = svc.baiChamSpeaking(gvS(), TODAY);
    assert(sau.soBai === truoc.soBai - 1, `số bài ${truoc.soBai} → ${sau.soBai}`);
    const dong = sau.rows.find((x: any) => x.attemptId === r.attemptId);
    if ((r.weekStart ?? '').slice(0, 10) >= tuanTruoc) {
      assert(dong && !dong.cho && dong.cell.band !== null && dong.cell.enteredById === idS,
        `bài vừa chấm còn trong hàng đợi, có điểm, "Nhập bởi" là GV này: ${JSON.stringify(dong && { cho: dong.cho, band: dong.cell.band, by: dong.cell.enteredById })}`);
    } else assert(!dong, 'bài còn tồn cũ đã chấm phải rời hàng đợi');
    assert(viecCs(gvS())[0]?.soBai === sau.soBai, 'Công việc giảm cùng hàng đợi');
    assertThrows(() => svc.saveScore(gvS(), r.attemptId, 'listening', { rawScore: 30 }, TODAY), /./, 'GV Speaking nhập L');
    assertThrows(() => svc.saveScore(gvS(), r.attemptId, 'writing1', { criteria: [6, 6, 6, 6] }, TODAY), /./, 'GV Speaking nhập W1');
    const ngoai = one(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
        WHERE c.is_fast_track = 1 AND c.branch_id != ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, MB);
    assert(ngoai, 'dữ liệu: cần lượt Mock ở chi nhánh khác');
    assertThrows(() => svc.saveScore(gvS(), ngoai.id, 'speaking', { criteria: [6, 6, 6, 6] }, TODAY), /./, 'GV Speaking MB nhập S lớp chi nhánh khác');
  }));

  check('OV14c-5 · GV không có kỹ năng S: không hàng đợi, không việc Chấm Speaking, không nhập S Mock lớp FT không dạy', () => {
    for (const p of [perm.loadPrincipal(idW), P.lrTeacher, P.w1Teacher]) {
      assert(!svc.baiChamSpeaking(p, TODAY).rows.length && !viecCs(p).length, `${p.fullName} thấy Chấm Speaking`);
    }
    const r = svc.baiChamSpeaking(gvS(), TODAY).rows.find((x: any) => x.cho);
    thu(() => assertThrows(() => svc.saveScore(perm.loadPrincipal(idW), r.attemptId, 'speaking', { criteria: [6, 6, 6, 6] }, TODAY), /./, 'GV Writing nhập S'));
  });

  check('OV14c-6 · trong tuần thi: bài S Mock thi TUẦN NÀY (chưa hết tuần) đã vào hàng đợi và Công việc', () => thu(() => {
    const nay = d.mondayOfDate(TODAY);
    const pid = one('SELECT id FROM report_periods WHERE week_start = ?', nay)?.id;
    assert(pid, 'dữ liệu: cần tuần hiện tại');
    const r = svc.baiChamSpeaking(gvS(), TODAY).rows.find((x: any) => x.cho);
    /* Dời ô S của một bài chờ chấm sang tuần này. */
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(pid, r.attemptId);
    xoaNho();
    const sau = svc.baiChamSpeaking(gvS(), TODAY);
    const x = sau.rows.find((y: any) => y.attemptId === r.attemptId);
    assert(x?.cho && x.weekStart?.slice(0, 10) === nay, `bài thi tuần này phải chờ chấm: ${JSON.stringify(x && { cho: x.cho, w: x.weekStart })}`);
    assert(viecCs(gvS())[0]?.soBai === sau.soBai, 'Công việc cùng số');
  }));

  check('OV14c-7 · Quản trị › Tài khoản: cờ chamSpeaking cùng hàm (GV S hồ sơ: có; GV Writing: không; GV dạy S lớp FT: có)', () => {
    const ds = accounts.listAccounts(P.admin) as any[];
    const cua = (id: number) => ds.find((u) => u.id === id)?.chamSpeaking;
    assert(cua(idS) === true && cua(idToan) === true, 'GV có kỹ năng S');
    assert(cua(idW) === false && cua(P.mbManager.userId) === false, 'GV Writing / QL');
    assert(cua(P.sTeacher.userId) === true, 'GV dạy S lớp FT');
  });

  check('OV14c-8 · OV-13k giữ nguyên: GV Speaking chấm chéo KHÔNG thành GV phụ trách S của lớp', () => {
    const lop = [...ftMb][0];
    assert(!svc.quyenPhuTrachS(gvS(), lop), 'GV Speaking không phân công mà thành GV phụ trách');
  });

  await checkAsync('OV14c-9 · HTTP /my-work/cham-speaking theo vai: GV S thấy (200, đúng số), GV Writing rỗng; lớp chi nhánh khác 403 ở bảng chấm', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const s = await goi(idS, '/my-work/cham-speaking');
      assert(s.status === 200 && s.json.soBai === svc.baiChamSpeaking(gvS(), TODAY).soBai && s.json.rows.length > 0, `GV S: ${s.status}`);
      const w = await goi(idW, '/my-work/cham-speaking');
      assert(w.status === 200 && w.json.rows.length === 0, `GV Writing: ${w.status} ${w.json?.rows?.length}`);
      const lopNgoai = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND branch_id != ? ORDER BY id LIMIT 1`, MB).id;
      const b = await goi(idS, `/classes/${lopNgoai}/diem-theo-luot/mt:1`);
      assert(b.status === 403, `bảng chấm lớp chi nhánh khác phải 403: ${b.status}`);
    } finally { may.close(); }
  });
}
