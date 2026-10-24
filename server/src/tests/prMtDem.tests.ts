/**
 * PHÉP KIỂM P2 MT-DEM (chủ SP 24/10, R4.1 — đặc tả cải tiến 24/10 mục 3.7):
 *  · bộ đếm MT Học viên & Lớp = lượt MT đã xong / lượt MT đã tạo (MT0, lượt huỷ, lượt mọi phần huỷ không tính);
 *  · thôi nhắc xếp thêm MT khi em đã xong đủ MT mặc định của lớp; gợi ý "MT{b} chưa xếp" theo lịch của lớp (RF 2), không hằng 3.
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrMtDemTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const tq: any = await import('../worklist/tongQuanMt.ts');
  const perm: any = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  console.log('\nP2 MT-DEM — bộ đếm MT đã xong / đã tạo, thôi nhắc xếp thêm khi đủ MT mặc định');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const tuanNay = week.mondayOf(TODAY);
  const MB_FT = classId('MB FT 101');
  const RF = classId('MB FT RF 12');
  let seq = 0;
  /** Em mới của lớp, lịch tự tạo bỏ. `luot(no, opt)` tạo MT{no} qua `createAttempt`; `xong` → done, `tuan: null` → chưa xếp tuần. */
  const em = (lop: number) => {
    const ten = `MTDEM HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `mtdem-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const luot = (no: number, o: { xong?: boolean; tuan?: string | null } = {}) => {
      const a = svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: no, periodId: week.ensurePeriod(o.tuan ?? t.addDays(tuanNay, 7 * no)).id });
      if (o.xong) conn.prepare("UPDATE assessment_attempts SET status = 'done' WHERE id = ?").run(a.id);
      if (o.tuan === null) conn.prepare('UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?').run(a.id);
      return a.id as number;
    };
    return { sid, luot };
  };
  const loTrinh = (sid: number) => { xoaNho(); return hvl.danhSachHocVienLop(P.mbManager, {}).hocVien.find((x: any) => x.id === sid)?.hang?.loTrinh; };
  const lopKh = (id: number) => { xoaNho(); return kh.danhSachLop(P.mbManager).lop.find((l: any) => l.id === id); };

  check('MTD-1 · demMtHocVien: 3 xong + MT4 chưa điểm → 3/4; lượt huỷ, mọi phần huỷ, MT0 không tính; planned đủ điểm = xong', () => {
    const L = (status: string, o: Partial<{ kind: string; huyHet: boolean; coDiem: number; yeuCau: number }> = {}) =>
      ({ kind: 'mock', status, huyHet: false, coDiem: 0, yeuCau: 4, ...o });
    const ds = [L('done'), L('done'), L('done'), L('planned')];
    assert(JSON.stringify(d.demMtHocVien(ds)) === '{"xong":3,"tong":4}', JSON.stringify(d.demMtHocVien(ds)));
    const them = [...ds, L('cancelled'), L('planned', { huyHet: true }), L('done', { kind: 'mt0' })];
    assert(JSON.stringify(d.demMtHocVien(them)) === '{"xong":3,"tong":4}', JSON.stringify(d.demMtHocVien(them)));
    assert(JSON.stringify(d.demMtHocVien([L('planned', { coDiem: 4 })])) === '{"xong":1,"tong":1}', 'planned đủ điểm');
    assert(JSON.stringify(d.demMtHocVien([])) === '{"xong":0,"tong":0}', 'rỗng');
  });

  check('MTD-2 · daDuMtMacDinh: (3,3) (2,2) đủ · (2,3) chưa · lớp không lịch (5,0) không', () => {
    assert(d.daDuMtMacDinh(3, 3) && d.daDuMtMacDinh(2, 2) && !d.daDuMtMacDinh(2, 3) && !d.daDuMtMacDinh(5, 0), 'daDuMtMacDinh');
  });

  check('MTD-3 · Học viên & Lớp: MT1–3 xong + MT4 chưa xếp tuần → loTrinh 3/4; huỷ MT4 → 3/3; em chưa có lượt → 0/0', () => thu(() => {
    const a = em(MB_FT);
    for (const n of [1, 2, 3]) a.luot(n, { xong: true, tuan: t.addDays(tuanNay, -7 * (8 - n)) });
    const mt4 = a.luot(4, { tuan: null });
    let lt = loTrinh(a.sid);
    assert(lt?.mt === 3 && lt.soMt === 4, JSON.stringify(lt));
    conn.prepare("UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?").run(mt4);
    lt = loTrinh(a.sid);
    assert(lt?.mt === 3 && lt.soMt === 3, `huỷ MT4: ${JSON.stringify(lt)}`);
    const b = em(MB_FT);
    lt = loTrinh(b.sid);
    assert(lt?.mt === 0 && lt.soMt === 0, `chưa có lượt: ${JSON.stringify(lt)}`);
  }));

  check('MTD-4 · "chưa có MT tiếp theo": em xong đủ 3 MT mặc định (kể cả có MT4 chưa xếp tuần) không đếm; em xong 2/3 vẫn đếm', () => thu(() => {
    const goc = lopKh(MB_FT).chuaCoLichTiep as number;
    const a = em(MB_FT);
    for (const n of [1, 2, 3]) a.luot(n, { xong: true, tuan: t.addDays(tuanNay, -7 * (8 - n)) });
    a.luot(4, { tuan: null });
    assert(lopKh(MB_FT).chuaCoLichTiep === goc, `đủ 3 MT: ${lopKh(MB_FT).chuaCoLichTiep} ≠ ${goc}`);
    const b = em(MB_FT);
    for (const n of [1, 2]) b.luot(n, { xong: true, tuan: t.addDays(tuanNay, -7 * (8 - n)) });
    assert(lopKh(MB_FT).chuaCoLichTiep === goc + 1, `2/3: ${lopKh(MB_FT).chuaCoLichTiep} ≠ ${goc + 1}`);
  }));

  check('MTD-5 · lớp RF (lịch 2): đang làm MT2 → KHÔNG gợi ý "MT3 chưa xếp"; QL tạo MT3 cho một em → có "MT3 chưa xếp"', () => thu(() => {
    /* Mọi MT1 của lớp coi như xong, mọi em đều có MT2 đã xếp tuần → MT đang làm = 2, MT kế = 3. */
    conn.prepare("UPDATE assessment_attempts SET status = 'done' WHERE class_id = ? AND kind = 'mock' AND attempt_no = 1 AND status = 'planned'").run(RF);
    const a = em(RF);
    a.luot(1, { xong: true, tuan: t.addDays(tuanNay, -14) });
    a.luot(2, { tuan: tuanNay });
    let tt = lopKh(RF).tomTat as string;
    assert(/MT2 đang làm bài/.test(tt) && !/MT3 chưa xếp/.test(tt), tt);
    a.luot(3, { tuan: null });
    tt = lopKh(RF).tomTat as string;
    assert(/MT3 chưa xếp \d+ em/.test(tt), `có MT3: ${tt}`);
  }));

  check('MTD-6 · Tổng quan Admin "HV chưa có MT tiếp theo" = Σ chuaCoLichTiep lớp FT; em đủ MT mặc định không làm tăng', () => thu(() => {
    const { loadPrincipal } = perm;
    const id = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = 'office_admin' AND b.code = 'MB' ORDER BY ur.user_id LIMIT 1`)?.id;
    assert(id, 'seed thiếu Admin MB');
    const ad = loadPrincipal(id);
    xoaNho();
    const goc = tq.tongQuanMt(ad).chuaXepLich as number;
    const a = em(MB_FT);
    for (const n of [1, 2, 3]) a.luot(n, { xong: true, tuan: t.addDays(tuanNay, -7 * (8 - n)) });
    xoaNho();
    const sau = tq.tongQuanMt(ad).chuaXepLich as number;
    xoaNho();
    const tong = kh.danhSachLop(ad).lop.filter((l: any) => l.loai === 'ft').reduce((n: number, l: any) => n + l.chuaCoLichTiep, 0);
    assert(sau === goc && sau === tong, `trước ${goc} · sau ${sau} · Σ ${tong}`);
  }));
}
