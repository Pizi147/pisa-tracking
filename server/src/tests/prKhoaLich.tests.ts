/**
 * PHÉP KIỂM P6 KHOA-LICH (chủ SP 24–25/10, N15 — đặc tả cải tiến 24/10 mục 3.5):
 *  T6 → CN (giờ VN) không thêm / huỷ / dời lịch MT (MT0, S Ex; không lớp thường) có tuần gốc / đích thuộc tuần trước / này / sau,
 *  trừ Quản trị hệ thống (vai gốc); ngoại lệ nhập điểm, "-" và vắng, duyệt thẻ dời, khôi phục; đường gián tiếp cho chạy.
 */
export async function runPrKhoaLichTests(t: any) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nP6 KHOA-LICH — khoá đổi lịch MT thứ Sáu → Chủ nhật');

  check('KHL-1 · khoaCuoiTuan: T5 được; T6–CN khoá 3 tuần; tuần ngoài được; Quản trị miễn; T2 mở lại', () => {
    const k = (tuan: (string | null)[], homNay: string, quanTri = false) => d.khoaCuoiTuan({ tuan, homNay, quanTri });
    assert(k(['2026-09-14'], '2026-09-17') === null, 'T5 tuần này được');
    assert(k(['2026-09-14'], '2026-09-18') === d.LOI_KHOA_CUOI_TUAN, 'T6 tuần này khoá');
    assert(k(['2026-09-07'], '2026-09-18') && k(['2026-09-21'], '2026-09-18'), 'T6 tuần trước / sau khoá');
    assert(k(['2026-10-05'], '2026-09-18') === null, 'tuần +3 được');
    assert(k(['2026-10-05', '2026-09-21'], '2026-09-18') !== null, '+3 → tuần sau khoá');
    assert(k([null, '2026-10-05'], '2026-09-18') === null, 'null bỏ qua');
    assert(k(['2026-09-14'], '2026-09-18', true) === null, 'Quản trị miễn');
    assert(k(['2026-09-14'], '2026-09-20') !== null, 'CN khoá');
    assert(k(['2026-09-14', '2026-09-21'], '2026-09-21') === null, 'T2 mở lại');
  });
  if (!t.conn) return;   // chạy riêng luật thuần (không DB)

  const { conn, P, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const sEx: any = await import('../cham/sExpert.ts');
  const sch: any = await import('../classes/schedule.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const T6 = '2026-09-18';
  const W = { truoc: '2026-09-07', nay: '2026-09-14', sau: '2026-09-21', c2: '2026-09-28', c3: '2026-10-05', c4: '2026-10-12' };
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  /** Giao dịch cuộn lại; tạo dữ liệu trước (ngày gốc thứ Hai), rồi `doiNgay()` đặt "hôm nay" = thứ Sáu. */
  const thu = <T>(fn: (doiNgay: () => void) => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(() => datNgay(T6)); }
    finally { conn.exec('ROLLBACK'); datNgay(cu); }
  };
  const loi = (fn: () => unknown): string | null => { try { fn(); return null; } catch (e: any) { return e?.message ?? String(e); } };
  const MB_FT = classId('MB FT 101');
  let seq = 0;
  /** Em mới lớp MB FT 101 (lịch tự tạo bỏ); `luot(no, tuan)` tạo MT{no} ở tuần đó bằng Quản trị. */
  const em = () => {
    const ten = `KHOALICH HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `khoalich-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const luot = (no: number, w: string) => svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: no, periodId: pid(w) }).id as number;
    return { sid, cy, luot };
  };
  const QL = P.mbManager;
  const L = d.LOI_KHOA_CUOI_TUAN;

  check('KHL-2a · T6: QL dời MT tuần này → khoá; Quản trị được; Quản trị "xem như" QL vẫn được (vai gốc)', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.nay);
    doiNgay();
    assert(loi(() => ss.setSkillWeek(QL, m1, 'listening', pid(W.c3), {})) === L, 'QL phải bị khoá');
    const xemNhu = { ...P.admin, roleKeys: ['manager'], gocNhin: 'manager', vaiGoc: ['system_admin'] };
    assert(loi(() => ss.setSkillWeek(xemNhu, m1, 'listening', pid(W.c3), {})) !== L, 'Quản trị xem như QL vẫn miễn');
    const e = loi(() => ss.setSkillWeek(P.admin, m1, 'reading', pid(W.c3), {}));
    assert(e === null, `Quản trị: ${e}`);
  }));

  check('KHL-2b · T6: +3 → tuần sau khoá; +2 → +3 được; Thứ Năm được', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.c3);
    const b = em(); const n1 = b.luot(1, W.c2);
    const c = em(); const k1 = c.luot(1, W.nay);
    datNgay('2026-09-17');
    const e0 = loi(() => ss.setSkillWeek(QL, k1, 'listening', pid(W.c3), {}));
    assert(e0 === null, `Thứ Năm: ${e0}`);
    doiNgay();
    assert(loi(() => ss.setSkillWeek(QL, m1, 'listening', pid(W.sau), {})) === L, '+3 → tuần sau khoá');
    const e = loi(() => ss.setSkillWeek(QL, n1, 'listening', pid(W.c3), {}));
    assert(e === null, `+2 → +3: ${e}`);
  }));

  check('KHL-2c · T6: tạo MT vào tuần sau, huỷ lịch / huỷ lượt / bỏ kỹ năng MT tuần này, S Ex tuần này → khoá', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.nay);
    const b = em(); b.luot(1, W.truoc);
    const c = em(); const h1 = c.luot(1, W.nay); svc.huyLuot(P.admin, h1, {});
    const sx = sEx.themSEx(P.admin, { studentId: c.sid, tuan: W.nay }).id;
    doiNgay();
    assert(loi(() => svc.reopenAttempt(QL, h1)) === L, 'reopenAttempt');
    assert(loi(() => sEx.suaSEx(QL, sx, { tuan: W.c3 })) === L, 'suaSEx');
    assert(loi(() => sEx.xoaSEx(QL, sx)) === L, 'xoaSEx');
    const e0 = loi(() => sEx.suaSEx(QL, sx, { diem: 6.5 }));
    assert(e0 === null, `chấm S Ex vẫn được: ${e0}`);
    assert(loi(() => svc.createAttempt(QL, { studentId: b.sid, cycleId: b.cy, attemptNo: 2, periodId: pid(W.sau) })) === L, 'createAttempt');
    assert(loi(() => ss.boTuanLuot(QL, m1, {})) === L, 'boTuanLuot');
    assert(loi(() => svc.huyLuot(QL, m1, {})) === L, 'huyLuot');
    assert(loi(() => svc.setSkillSkip(QL, m1, 'speaking', true, 'thử')) === L, 'bỏ kỹ năng');
    assert(loi(() => sEx.themSEx(QL, { studentId: a.sid, tuan: W.nay })) === L, 'themSEx');
    const e = loi(() => svc.createAttempt(QL, { studentId: b.sid, cycleId: b.cy, attemptNo: 2, periodId: pid(W.c3) }));
    assert(e === null, `MT vào +3 được: ${e}`);
  }));

  check('KHL-2d · Hàng loạt T6: em MT1 tuần này lỗi đúng dòng; em MT1 tuần +4 → +3 vẫn xếp', () => thu((doiNgay) => {
    const a = em(); a.luot(1, W.nay);
    const b = em(); b.luot(1, W.c4);
    doiNgay();
    const tuan = Object.fromEntries(['listening', 'reading', 'writing', 'speaking'].map((k) => [k, pid(W.c3)]));
    const vao = { classId: MB_FT, attemptNo: 1, studentIds: [a.sid, b.sid], tuan, force: true };
    const dong = (ds: any[], sid: number) => ds.find((x: any) => x.studentId === sid);
    const xt = kh.xepHangLoat(QL, { ...vao, xemTruoc: true }, T6).dong;
    assert(dong(xt, a.sid)?.loi?.includes(L), `xem trước em 1: ${JSON.stringify(dong(xt, a.sid))}`);
    assert(!dong(xt, b.sid)?.loi, `xem trước em 2: ${JSON.stringify(dong(xt, b.sid))}`);
    const r = kh.xepHangLoat(QL, vao, T6);
    assert(r.daLuu === 1 && dong(r.dong, a.sid).hanhDong === 'loi' && dong(r.dong, b.sid).hanhDong !== 'loi',
      JSON.stringify(r.dong.map((x: any) => [x.hanhDong, x.loi])));
  }));

  check('KHL-3 · T6 ngoại lệ: "-" ở MT tuần này dời theo luật vắng; duyệt thẻ dời; khôi phục phần thi vắng; Không mock lại; lớp thường', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.nay);
    doiNgay();
    const e1 = loi(() => svc.saveScore(P.lrTeacher, m1, 'listening', { noShow: true }, T6));
    assert(e1 === null, `"-": ${e1}`);
    const s = get(`SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`, m1);
    assert(s.n === 1, `"-" phải tự dời lần 1: ${JSON.stringify(s)}`);
    conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
      VALUES (?, 'speaking', 2, ?, ?, ?, ?, 'pending', ?)`).run(m1, pid(W.nay), pid(W.sau), T6, '2026-09-20', T6);
    const yc = get(`SELECT id FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`, m1).id;
    const e2 = loi(() => absence.decideAbsenceMove(QL, yc, { approve: true }));
    assert(e2 === null, `duyệt thẻ dời: ${e2}`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ? AND skill = 'reading'`).run(m1);
    const e3 = loi(() => absence.restoreCancelledSkill(QL, m1, 'reading', pid(W.sau)));
    assert(e3 === null, `khôi phục: ${e3}`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'writing'`).run(m1);
    const e4 = loi(() => absence.khongMockLai(QL, m1, 'writing', null));
    assert(e4 === null, `Không mock lại: ${e4}`);
    assert(loi(() => ss.chanCuoiTuan(QL, { kind: 'progress' }, [W.nay])) === null, 'lớp thường không khoá');
    assert(loi(() => ss.chanCuoiTuan(QL, { kind: 'mt0' }, [W.nay])) === L, 'MT0 khoá');
  }));

  check('KHL-4 · T6 đường gián tiếp cho chạy: đổi tuần bắt đầu lớp FT có MT tuần này', () => thu((doiNgay) => {
    const a = em(); a.luot(1, W.nay);
    doiNgay();
    const e = loi(() => sch.setClassProgress(QL, MB_FT, { startPeriodId: pid(W.sau) }));
    assert(e === null, `setClassProgress: ${e}`);
  }));
}
