/**
 * PHÉP KIỂM LO-TRINH-GIU-LICH (chủ SP 10/11: "HV chuyển lớp (ngoại trừ chuyển tiếp lộ trình) thì lịch MT giữ nguyên") — panel Lộ trình ›
 * "Lịch MT hệ thống đề xuất" + "Áp lịch": chỉ lượt CHƯA có lịch nhận tuần đề xuất, không bao giờ về tuần đã qua; lượt đã có lịch
 * "Giữ lịch hiện tại". Mỗi ca ghi trong giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrLoTrinhGiuLichTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t as any;
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const intake: any = await import('../classes/intake.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLO-TRINH-GIU-LICH · chuyển lớp giữ lịch MT · Áp lịch chỉ xếp lượt chưa có lịch · không về tuần đã qua');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const tuanNay = week.mondayOf(TODAY);
  let so = 970;
  const lopMoi = (kind: string, route: string | null, startWeek: string) => intake.createClass(P.admin, {
    code: `MB GL ${so++}`, branchId: MB, kind, route, isFastTrack: kind === 'FT', startDate: startWeek, startPeriodId: week.ensurePeriod(startWeek).id,
  }) as any;
  const them = (lop: number, ten: string, startWeek: string) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, startWeek, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  const khoa = (sid: number) => one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id as number;
  /** Tuần (thứ Hai) của từng MT còn hiệu lực — tuần lượt + tuần các kỹ năng, để thấy cả lượt lẫn kỹ năng không bị kéo. */
  const lichCua = (cy: number) => all(
    `SELECT a.attempt_no AS no, (SELECT week_start FROM report_periods WHERE id = a.planned_period_id) AS tuan,
            (SELECT group_concat(p.week_start) FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = a.id) AS kn
       FROM assessment_attempts a WHERE a.cycle_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.attempt_no`, cy);
  const hang = (cy: number) => keHoach.lichMtLoTrinh(cy, TODAY).hang as any[];

  check('GL-1 · chuyển lớp thường (FT → FT giữa khoá, lớp đích lịch 5/10/15): MT đã có lịch "Giữ lịch hiện tại", không đếm Áp lịch, Áp lịch không dời', () => thu(() => {
    const nguon = lopMoi('FT', 'LT1', tuanNay);
    const sid = them(nguon.id, 'GL Chuyển thường', tuanNay);
    const cy = khoa(sid);
    const truoc = JSON.stringify(lichCua(cy));
    /* Lớp đích tạo sau khi Quản trị đổi LT1 thành 5/10/15 → bản chụp lớp khác lịch em đang có (đề xuất đổi sau chuyển lớp). */
    const r = sysconfig.listRoutes(true).find((x: any) => x.code === 'LT1');
    sysconfig.saveRoute(P.admin, { code: 'LT1', name: r.name, note: r.note, status: r.status, lichMt: [5, 10, 15] });
    const dich = lopMoi('FT', 'LT1', tuanNay);
    luatLoTrinh.apDungMotDong(P.admin, { sid, toClassId: dich.id, ngay: tuanNay, lyDo: 'GL-1', boiCanh: 'giua-khoa' });
    xoaNho();
    assert(khoa(sid) === cy, 'FT → FT phải giữ lộ trình');
    const h = hang(cy).filter((x) => x.attemptNo >= 1 && x.attemptNo <= 3);
    assert(h.length === 3 && h.every((x) => x.existingPeriodId !== x.periodId), `tiền đề: đề xuất lớp mới khác lịch đang có ${JSON.stringify(h.map((x) => [x.existingPeriodId, x.periodId]))}`);
    assert(h.every((x) => x.apDuoc === false), `lượt đã có lịch không được đếm vào Áp lịch: ${JSON.stringify(h.map((x) => x.apDuoc))}`);
    const kq = schedule.applySuggestedMockWeeks(P.admin, cy);
    assert(kq.moved === 0 && kq.created === 0, `Áp lịch không dời: ${JSON.stringify(kq)}`);
    assert(JSON.stringify(lichCua(cy)) === truoc, `lịch đổi: ${truoc} → ${JSON.stringify(lichCua(cy))}`);
  }));

  check('GL-1b · ca ảnh chủ SP: MT3 dời tay từng kỹ năng (lượt vẫn `auto`) → "Giữ lịch hiện tại", Áp lịch không kéo về tuần đề xuất', () => thu(() => {
    const lop = lopMoi('FT', 'LT1', tuanNay);
    const sid = them(lop.id, 'GL Dời tay', tuanNay);
    const cy = khoa(sid);
    const mt3 = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 3`, cy).id as number;
    const sau = week.ensurePeriod(addDays(tuanNay, 7 * 17)).id;   // tuần học 18 thay vì 16
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(sau, mt3);
    skillSchedule.recomputeCompletionWeek(mt3, null);
    assert(one('SELECT plan_source FROM assessment_attempts WHERE id = ?', mt3).plan_source === 'auto', 'tiền đề: lượt vẫn auto');
    const h3 = hang(cy).find((x) => x.attemptNo === 3);
    assert(h3.existingPeriodId === sau && h3.periodId !== sau && h3.apDuoc === false, JSON.stringify(h3));
    const kq = schedule.applySuggestedMockWeeks(P.admin, cy);
    assert(kq.moved === 0, JSON.stringify(kq));
    assert(one('SELECT planned_period_id p FROM assessment_attempts WHERE id = ?', mt3).p === sau, 'MT3 bị kéo về tuần đề xuất');
  }));

  check('GL-2 · chuyển tiếp lộ trình (lớp thường → Lên FT cuối khoá): lộ trình FT mới, MT theo tuần đề xuất — "Đã đúng", không còn gì để áp', () => thu(() => {
    const ele = lopMoi('ELE', null, addDays(tuanNay, -7 * 9));
    const sid = them(ele.id, 'GL Lên FT', addDays(tuanNay, -7 * 9));
    const ft = lopMoi('FT', 'LT1', tuanNay);
    luatLoTrinh.apDungMotDong(P.admin, { sid, toClassId: ft.id, ngay: tuanNay, mucTieu: 6.5, lyDo: 'GL-2', boiCanh: 'cuoi-khoa' });
    xoaNho();
    const cy = khoa(sid);
    const h = hang(cy).filter((x) => x.attemptNo >= 1 && x.attemptNo <= 3);
    assert(h.length === 3 && h.every((x) => x.existingAttemptId && x.existingPeriodId === x.periodId && x.apDuoc === false),
      `MT lộ trình mới phải ở tuần đề xuất: ${JSON.stringify(h.map((x) => [x.existingPeriodId, x.periodId, x.apDuoc]))}`);
    const bd = one(`SELECT p.week_start w FROM learning_cycles cy JOIN report_periods p ON p.id = cy.start_period_id WHERE cy.id = ?`, cy).w;
    assert(lichCua(cy).map((x) => x.tuan).join() === [6, 12, 16].map((w) => addDays(bd, 7 * (w - 1))).join(), JSON.stringify(lichCua(cy)));
  }));

  check('GL-3 · tuần đề xuất đã qua: lượt chưa có lịch KHÔNG được xếp về tuần đã qua (không đếm, Áp lịch để trống)', () => thu(() => {
    const bd = addDays(tuanNay, -7 * 10);   // MT1 tuần học 6 = 5 tuần trước
    const lop = lopMoi('FT', 'LT1', bd);
    const sid = them(lop.id, 'GL Tuần qua', bd);
    const cy = khoa(sid);
    const mt1 = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 1`, cy).id as number;
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ?`).run(mt1);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL, plan_source = 'auto', status = 'planned' WHERE id = ?`).run(mt1);
    const h1 = hang(cy).find((x) => x.attemptNo === 1);
    assert(h1.weekStart < tuanNay && h1.existingPeriodId === null && h1.apDuoc === false, JSON.stringify(h1));
    const kq = schedule.applySuggestedMockWeeks(P.admin, cy);
    assert(kq.moved === 0, JSON.stringify(kq));
    assert(one('SELECT planned_period_id p FROM assessment_attempts WHERE id = ?', mt1).p === null, 'MT1 bị xếp về tuần đã qua');
  }));

  check('GL-4 · lượt CHƯA có lịch, tuần đề xuất chưa qua: được đếm và Áp lịch xếp đúng tuần đề xuất', () => thu(() => {
    const bd = addDays(tuanNay, -7 * 10);   // MT3 tuần học 16 = 5 tuần nữa
    const lop = lopMoi('FT', 'LT1', bd);
    const sid = them(lop.id, 'GL Chưa lịch', bd);
    const cy = khoa(sid);
    const mt3 = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 3`, cy).id as number;
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ?`).run(mt3);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?`).run(mt3);
    const h = hang(cy);
    assert(h.filter((x) => x.apDuoc).map((x) => x.attemptNo).join() === '3', `chỉ MT3 được đếm: ${JSON.stringify(h.map((x) => [x.attemptNo, x.apDuoc]))}`);
    const kq = schedule.applySuggestedMockWeeks(P.admin, cy);
    const de = addDays(bd, 7 * 15);
    assert(kq.moved === 1, JSON.stringify(kq));
    const l3 = lichCua(cy).find((x) => x.no === 3);
    assert(l3.tuan === de && String(l3.kn).split(',').every((w: string) => w === de), `MT3: ${JSON.stringify(l3)} ≠ ${de}`);
  }));
}
