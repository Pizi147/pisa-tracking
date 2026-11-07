/**
 * PHÉP KIỂM XEP-MT-NHAC (chủ SP 07/11, plan.md mục 4 "07/11 — NHẮC XẾP MT CHỈ KHI THIẾU"):
 *  1. MỘT hàm "lộ trình thiếu MT" (`thieuMt` + `LUOT_MT_DA_CO_SQL`): số MT đã có < số MT mặc định của lộ trình (LT 3 · RF 2 · Khác 0).
 *     MT đã có = mọi lượt Mock đã tạo của lộ trình đang chạy — đã thi, có tuần, chưa tuần (máy đã tự xếp), MT QL chủ động xoá / huỷ.
 *  2. Chip / lọc "Chưa đủ MT" (`chuaCoLichTiep`, cờ hàng lưới `thieuMt`) và việc "Xếp lịch MTn" (`moc:`) chỉ khi thiếu.
 *  3. Không còn việc "Chốt tuần MT" (lượt chưa tuần) ở Công việc.
 *  4. MT kế đã chủ động xoá → không việc "Xếp lịch MTn" (đảo phần nhắc của #1158).
 *  5. Chủ SP 07/11 (nói rõ): MT / môn HUỶ DO VẮNG 2 LẦN (N38 L2, `huy_vang = 1`) cũng không sinh việc / chip / mốc nhắc xếp lại.
 *  6. PTA 07/11: "Cần xếp lại" chỉ còn môn VẮNG chưa dời — môn huỷ kiểu cũ (QL tự huỷ, không vì vắng: `cancelled`, `huy_vang = 0`) là chủ động, không đếm.
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrXepMtNhacTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  console.log('\nXEP-MT-NHAC — nhắc xếp MT chỉ khi lộ trình thiếu MT');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const tuanNay = week.mondayOf(TODAY);
  const MB_FT = classId('MB FT 101');
  const RF = classId('MB FT RF 12');
  const QL = P.mbManager;
  let seq = 0;
  /** Em mới của lớp, lịch tự tạo bỏ. `luot(no, opt)`: `xong` → done · `tuan: null` → chưa tuần · `xoa` → QL Xoá MT (mọi môn ra khỏi đợt) · `huy` → Huỷ MTn. */
  const em = (lop: number) => {
    const ten = `XEPMT HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `xepmt-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const luot = (no: number, o: { xong?: boolean; tuan?: null; xoa?: boolean; huy?: boolean; vang?: boolean } = {}) => {
      const a = svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: no, periodId: week.ensurePeriod(t.addDays(tuanNay, 7 * no)).id });
      ss.ensureSkillRows(a.id);
      if (o.xong) conn.prepare("UPDATE assessment_attempts SET status = 'done' WHERE id = ?").run(a.id);
      if (o.tuan === null) conn.prepare('UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?').run(a.id);
      if (o.xoa) conn.prepare('UPDATE attempt_skills SET required = 0, huy_vang = 0 WHERE attempt_id = ?').run(a.id);
      if (o.vang) conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ?`).run(a.id);   // N38 L2: vắng 2 lần → huỷ
      if (o.huy) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = 'Huỷ MT${no}' WHERE id = ?`).run(a.id);
      xoaNho();
      return a.id as number;
    };
    return { sid, cy, luot };
  };
  const chua = (lop: number) => { xoaNho(); return kh.danhSachLop(QL).lop.find((l: any) => l.id === lop).chuaCoLichTiep as number; };
  const hangThieu = (lop: number, sid: number) => { xoaNho(); return kh.luoiFT(QL, lop).hang.find((h: any) => h.studentId === sid)?.thieuMt as boolean; };

  check('XN-1 · thieuMt: thiếu khi số MT đã có < số mặc định; lộ trình không có MT mặc định (Khác, lớp thường) không bao giờ thiếu', () => {
    assert(d.thieuMt(2, 3) && !d.thieuMt(3, 3) && !d.thieuMt(5, 3), 'LT');
    assert(d.thieuMt(1, 2) && !d.thieuMt(2, 2), 'RF');
    assert(!d.thieuMt(0, 0), 'Khác / lớp thường');
  });
  if (!conn) return;

  check('XN-2 · LT (3 MT): MT1 xong + MT2 có tuần → thiếu (chip +1, hàng lưới thieuMt); thêm MT3 — có tuần / chưa tuần / đã xoá / đã huỷ / huỷ vắng 2 lần — đều đủ', () => {
    for (const kieu of [{}, { tuan: null }, { xoa: true }, { huy: true }, { vang: true }] as const) thu(() => {
      const goc = chua(MB_FT);
      const a = em(MB_FT);
      a.luot(1, { xong: true });
      a.luot(2);
      assert(chua(MB_FT) === goc + 1 && hangThieu(MB_FT, a.sid) === true, `2 MT: chip ${chua(MB_FT)} ≠ ${goc + 1} · hàng ${hangThieu(MB_FT, a.sid)}`);
      a.luot(3, kieu);
      assert(chua(MB_FT) === goc && hangThieu(MB_FT, a.sid) === false, `MT3 ${JSON.stringify(kieu)}: chip ${chua(MB_FT)} ≠ ${goc} · hàng ${hangThieu(MB_FT, a.sid)}`);
    });
  });

  check('XN-3 · RF (2 MT): chỉ MT1 → thiếu; MT1 + MT2 (kể cả MT2 đã xoá / huỷ vắng 2 lần) → đủ — không nhắc MT3', () => {
    for (const kieu of [{}, { xoa: true }, { vang: true }] as const) thu(() => {
      const goc = chua(RF);
      const a = em(RF);
      a.luot(1, { xong: true });
      assert(chua(RF) === goc + 1 && hangThieu(RF, a.sid) === true, `RF 1 MT: chip ${chua(RF)} ≠ ${goc + 1}`);
      a.luot(2, kieu);
      assert(chua(RF) === goc && hangThieu(RF, a.sid) === false, `RF MT2 ${JSON.stringify(kieu)}: chip ${chua(RF)} ≠ ${goc}`);
    });
  });

  check('XN-4 · Công việc QL không còn việc "Chốt tuần MT" (lượt chưa tuần)', () => thu(() => {
    const a = em(MB_FT);
    const id = a.luot(1, { tuan: null });
    xoaNho();
    const it = (mywork.myWork(QL, { nguoi: 'tat-ca' }).items as any[]);
    assert(!it.some((x) => x.key === `week:${id}`), 'còn việc week: của lượt chưa tuần');
    assert(!it.some((x) => x.tieuDe === 'Chốt tuần MT'), 'còn việc "Chốt tuần MT"');
  }));

  /* Việc `moc:` (PA quy chế "đến MT kế" chưa có lịch MT kế) — dựng như BO-QUA-XEP-MT. */
  const dungMoc = () => {
    const iv = get(`SELECT iv.id, a.cycle_id, a.attempt_no, a.class_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        JOIN assessment_attempts a ON a.id = sc.attempt_id
       WHERE iv.preset = 1 AND iv.status = 'started' AND sc.status != 'done' AND a.class_id = ? ORDER BY iv.id LIMIT 1`, MB_FT);
    assert(iv, 'bộ thử thiếu PA quy chế đang chạy ở MB FT 101');
    conn.prepare(`UPDATE case_interventions SET moc_quy_che = 'until_next_mt', followup_due = NULL WHERE id = ?`).run(iv.id);
    return { ...iv, key: `moc:${iv.id}` };
  };
  const coViec = (key: string) => { xoaNho(); return (mywork.myWork(QL, { nguoi: 'tat-ca' }).items as any[]).some((x) => x.key === key); };
  const soMtCo = (cy: number) => get(`SELECT COUNT(*) n FROM assessment_attempts a WHERE a.cycle_id = ? AND ${d.LUOT_MT_DA_CO_SQL('a')}`, cy).n as number;

  check('XN-5 · việc "Xếp lịch MTn" (moc:) chỉ khi lộ trình thiếu: lịch lớp n+1 MT → có việc; lịch n MT (đã đủ) → không', () => thu(() => {
    const iv = dungMoc();
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = ? AND attempt_no > ?`).run(iv.cycle_id, iv.attempt_no);
    const n = soMtCo(iv.cycle_id);
    const lich = (k: number) => conn.prepare('UPDATE classes SET lich_mt = ? WHERE id = ?').run(JSON.stringify(Array.from({ length: k }, (_, i) => 4 * (i + 1))), MB_FT);
    lich(n + 1);
    assert(coViec(iv.key), `lịch ${n + 1} MT, đã có ${n}: thiếu mà không có việc Xếp lịch MT`);
    lich(n);
    assert(!coViec(iv.key), `lịch ${n} MT, đã có ${n}: đủ mà vẫn nhắc Xếp lịch MT`);
  }));

  check('XN-6 · MT kế đã chủ động xoá (Xoá MT) hoặc huỷ vắng 2 lần (có / không tuần) → KHÔNG việc "Xếp lịch MTn" kể cả lộ trình thiếu', () => {
    for (const [ten, tuan, sua] of [
      ['đã xoá', false, `required = 0, huy_vang = 0, sit_status = 'scheduled', scope_reason = 'Xoá MT'`],
      ['huỷ vắng 2 lần, có tuần', true, `required = 1, sit_status = 'cancelled', huy_vang = 1`],
      ['huỷ vắng 2 lần, không tuần', false, `required = 1, sit_status = 'cancelled', huy_vang = 1`],
    ] as const) thu(() => {
      const iv = dungMoc();
      conn.prepare('UPDATE classes SET lich_mt = ? WHERE id = ?').run(JSON.stringify([4, 8, 12, 16, 20, 24, 28, 32]), MB_FT);
      const ke = get('SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?', iv.cycle_id, iv.attempt_no + 1);
      assert(ke, 'bộ thử thiếu lượt MT kế');
      const p = tuan ? get('SELECT id FROM report_periods ORDER BY week_start DESC LIMIT 1').id : null;
      conn.prepare(`UPDATE assessment_attempts SET status = 'planned', planned_period_id = ? WHERE id = ?`).run(p, ke.id);
      conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = ? AND attempt_no > ?`).run(iv.cycle_id, iv.attempt_no + 1);
      conn.prepare(`UPDATE attempt_skills SET ${sua}, planned_period_id = ? WHERE attempt_id = ?`).run(p, ke.id);
      assert(!coViec(iv.key), `MT kế ${ten} mà vẫn nhắc Xếp lịch MT`);
    });
  });

  check('XN-7 · một môn huỷ vắng 2 lần → không vào "cần xếp lại", Công việc QL không việc nào của lượt đó; (đối chứng: vắng lần 1 → cần xếp lại +1)', () => thu(() => {
    const lop = () => { xoaNho(); return kh.danhSachLop(QL).lop.find((l: any) => l.id === MB_FT); };
    const goc = lop().canXepLai as number;
    const a = em(MB_FT);
    a.luot(1, { xong: true }); a.luot(2);
    const id = a.luot(3);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'speaking'`).run(id);
    assert(lop().canXepLai === goc + 1, `vắng lần 1: cần xếp lại ${lop().canXepLai} ≠ ${goc + 1} (phép kiểm không nhạy)`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ? AND skill = 'speaking'`).run(id);
    assert(lop().canXepLai === goc, `huỷ vắng 2 lần: cần xếp lại ${lop().canXepLai} ≠ ${goc}`);
    assert(hangThieu(MB_FT, a.sid) === false, 'huỷ vắng 2 lần: hàng lưới báo thiếu MT');
    xoaNho();
    const it = (mywork.myWork(QL, { nguoi: 'tat-ca' }).items as any[]).filter((x) => x.attemptId === id);
    assert(!it.length, `còn việc của lượt huỷ vắng: ${it.map((x) => x.tieuDe).join(', ')}`);
  }));

  check('XN-8 · PTA 07/11: môn huỷ kiểu cũ (cancelled, không vì vắng) → KHÔNG "cần xếp lại"; môn vắng chưa dời vẫn đếm', () => thu(() => {
    const lop = () => { xoaNho(); return kh.danhSachLop(QL).lop.find((l: any) => l.id === MB_FT); };
    const goc = lop().canXepLai as number;
    const a = em(MB_FT);
    a.luot(1, { xong: true }); a.luot(2);
    const id = a.luot(3);
    const tomTat = lop().tomTat as string;
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 0 WHERE attempt_id = ? AND skill = 'writing'`).run(id);
    assert(lop().canXepLai === goc, `huỷ kiểu cũ: cần xếp lại ${lop().canXepLai} ≠ ${goc}`);
    assert(lop().tomTat === tomTat, `huỷ kiểu cũ: tóm tắt lớp đổi: ${tomTat} → ${lop().tomTat}`);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'writing'`).run(id);
    assert(lop().canXepLai === goc + 1, `vắng chưa dời: cần xếp lại ${lop().canXepLai} ≠ ${goc + 1}`);
  }));
}
