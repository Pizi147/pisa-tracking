/**
 * PHÉP KIỂM V5 · SV-SO1 (máy chủ số của Công việc — `08-ke-hoach-trien-khai.md` mục 6, 10; brief 7, 8.1):
 *  · đơn vị đếm `/my-work`: việc (loại × đối tượng × kỹ năng) · bài · nhóm, đếm trên việc thật trước gộp (T01, T02, T17);
 *  · Speaking chấm chéo không là việc / nợ của ai (T03, R2 — giữ `scoreDebt.ts`);
 *  · ô có điểm mà thiếu nhận xét bắt buộc chưa xong (brief 8.1);
 *  · không gợi ý MT4 ở Kế hoạch Test (T04, C20);
 *  · xem việc người khác = theo dõi (`chiXem`) + `lamThay` theo quyền; chuông = tin chưa đọc.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvSo1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const no: any = await import('../worklist/scoreDebt.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nV5 · SV-SO1 — đơn vị đếm Công việc, S chéo không nợ, thiếu nhận xét ≠ xong, không gợi ý MT4, chế độ theo dõi, chuông = tin');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('SVSO1 (T01, T03) · demViec: Case R + Case W cùng em = 2 việc 1 HV; Nhập điểm L, R × 18 em = 2 việc 36 bài; Chấm Speaking chéo không vào số nào', () => {
    const ca = (k: string, topic: string) => ({ key: `cause:${k}`, group: 'cause', studentId: 7, kn: topic });
    const cham = { key: 'score:1|mock|p9|u5', group: 'score', studentId: null, emIds: Array.from({ length: 18 }, (_, i) => 100 + i), kns: ['listening', 'reading'], soBai: 36 };
    const cheo = { key: d.KHOA_CHAM_SPEAKING, group: 'score', studentId: null, kns: ['speaking'], soBai: 40 };
    const r = d.demViec([ca('1', 'reading'), ca('2', 'writing'), cham, cheo]);
    assert(r.viec === 4 && r.bai === 36 && r.nhom === 2 && r.hv === 19, JSON.stringify(r));
    assert(JSON.stringify(d.demViec([cheo])) === JSON.stringify({ viec: 0, bai: 0, nhom: 0, hv: 0 }), 'Speaking chấm chéo phải 0 việc');
  });

  check('SVSO1 (T02, T17) · /my-work GV: số việc / bài đếm trên việc thật (trước gộp), chỉ bài của chính GV; summary dòng vẫn = số dòng', () => {
    for (const p of [P.lrTeacher, P.w1Teacher, P.sTeacher, P.coreTeacher]) {
      xoaNho();
      const w = mw.myWork(p, {});
      const dem = d.demViec(w.items);
      for (const k of ['viec', 'bai', 'nhom', 'hv'] as const) assert(w.summary[k] === dem[k], `${k}: ${w.summary[k]} ≠ ${dem[k]}`);
      assert(w.summary.total === w.dong.length, 'total = số dòng hiển thị');
      assert(w.summary.viecQuaHan === d.demViec(w.items.filter((i: any) => i.urgency === 'overdue')).viec, 'viecQuaHan');
      const cuaNguoiKhac = w.items.filter((i: any) => i.group === 'score' && !d.laViecChamCheo(i) && i.ownerId !== p.userId);
      assert(!cuaNguoiKhac.length, `GV thấy bài của người khác: ${cuaNguoiKhac.map((i: any) => i.key)}`);
    }
  });

  check('SVSO1 (T03, R2) · ô S Mock chấm chéo trong nợ điểm không có người giữ (userId null) — không là nợ của GV S', () => {
    xoaNho();
    const cheo = no.scoreDebtCells(P.admin, TODAY, null).filter((c: any) => c.chamCheo);
    assert(cheo.every((c: any) => c.userId === null && c.skill === 'speaking'), 'ô chấm chéo phải userId null');
  });

  check('SVSO1 (brief 8.1) · ô có điểm thiếu nhận xét bắt buộc = nợ + việc Nhập điểm, cùng hạn ô chưa điểm; ghi nhận xét / lượt đủ điểm → hết', () => thu(() => {
    const MB_FT = classId('MB FT 101');
    const ten = 'SVSO1 HV thiếu NX';
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: 'svso1-nx' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(week.mondayOf(TODAY)).id });
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, comment) VALUES (?, 'listening', 30, 40, 6.5, NULL)`).run(a.id);
    const o = (skill: string) => { xoaNho(); return no.scoreDebtCells(P.admin, TODAY, null).find((c: any) => c.attemptId === a.id && c.skill === skill); };
    const l = o('listening'), r = o('reading');
    assert(l && r && l.overdue === r.overdue && l.han === r.han, `L thiếu nhận xét phải còn nợ như R: ${JSON.stringify({ l, r })}`);
    xoaNho();
    const viec = mw.myWork(P.lrTeacher, {}).items.find((i: any) => i.group === 'score' && (i.emIds?.includes(sid) || i.studentId === sid));
    assert(viec?.kns?.includes('listening'), `việc Nhập điểm của GV L phải gồm L: ${JSON.stringify(viec?.kns)}`);
    conn.prepare(`UPDATE assessment_scores SET comment = 'Nghe tốt phần 1, sai phần 4.' WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    assert(!o('listening'), 'đã ghi nhận xét → hết nợ');
    conn.prepare(`UPDATE assessment_scores SET comment = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    for (const k of ['reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, comment) VALUES (?, ?, 30, 40, 6.5, 'Nhận xét đủ mười ký tự.')`).run(a.id, k);
    }
    assert(!o('listening'), 'lượt đủ điểm → ô thiếu nhận xét không đòi lại (rà #383)');
  }));

  check('SVSO1 (T04, C20) · Kế hoạch Test không còn dòng "MT4+ chưa xếp"', () => {
    xoaNho();
    const ds = kh.danhSachLop(P.admin, {});
    const lop = (ds.lop ?? ds.rows ?? ds).filter?.((x: any) => typeof x.tomTat === 'string') ?? [];
    assert(lop.length > 0, 'không đọc được dòng tóm tắt lớp');
    const goiY = lop.filter((x: any) => /MT([4-9]) chưa xếp/.test(x.tomTat));
    assert(!goiY.length, `còn gợi ý MT4+: ${goiY.map((x: any) => x.tomTat)}`);
    assert(d.tomTatLopFT({ dangThi: null, chuaXep: null }) === '', 'không vế trống');
  });

  check('SVSO1 (brief 7) · QL xem việc GV = theo dõi: chiXem, mọi dòng có lamThay; Nhập điểm làm thay được (nhập hộ — 06 điểm 1); GV không xem được', () => {
    xoaNho();
    const w = mw.viecCuaNguoi(P.mbManager, P.lrTeacher.userId);
    assert(w.chiXem === true && w.summary.mine === 0, 'chiXem');
    assert(w.items.every((i: any) => typeof i.lamThay === 'boolean'), 'mỗi việc phải có lamThay');
    const diem = w.items.filter((i: any) => i.group === 'score');
    assert(diem.every((i: any) => i.lamThay), 'QL nhập hộ được điểm');
    assert(w.items.filter((i: any) => d.nhomViecCua(i.group) === 'y-thuc').every((i: any) => !i.lamThay), 'Ý thức: chỉ theo dõi');
    let chan = false;
    try { mw.viecCuaNguoi(P.w1Teacher, P.lrTeacher.userId); } catch { chan = true; }
    assert(chan, 'GV không xem được việc người khác');
  });

  check('SVSO1 (brief 7) · chuông: số = tin chưa đọc (cả Cần làm lẫn Để biết), không phải số việc', () => {
    const r = (id: number, o: Record<string, unknown>) => ({ id, entity_type: 'class', entity_id: id, kind: 'cham_qua_han', read_at: null, han: null, ...o });
    const kq = d.dongChuong([
      r(1, { read_at: '2026-09-12T00:00:00Z' }),
      r(2, {}),
      r(3, { kind: 'sos', entity_type: 'assessment_attempt' }),
      r(4, { kind: 'sos', entity_type: 'assessment_attempt', read_at: '2026-09-12T00:00:00Z' }),
    ]);
    assert(kq.soNut === 2, JSON.stringify({ n: kq.soNut }));
  });
}
