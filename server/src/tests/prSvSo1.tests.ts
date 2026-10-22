/**
 * PHÉP KIỂM V5 · SV-SO1 (máy chủ số của Công việc — `08-ke-hoach-trien-khai.md` mục 6, 10; brief 7, 8.1):
 *  · đơn vị đếm `/my-work`: việc (loại × đối tượng × kỹ năng) · bài · nhóm, đếm trên việc thật trước gộp (T01, T02, T17);
 *  · Speaking chấm chéo không là việc / nợ của ai (T03, R2 — giữ `scoreDebt.ts`);
 *  · không gợi ý MT4 ở Kế hoạch Test (T04, C20);
 *  · xem việc người khác = theo dõi (`chiXem`) + `lamThay` theo quyền; chuông = tin chưa đọc.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSvSo1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const no: any = await import('../worklist/scoreDebt.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ops: any = await import('../ops/demThieuNhanXet.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const await_conOCho: any = await import('../fasttrack/conOCho.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  console.log('\nV5 · SV-SO1 — đơn vị đếm Công việc, S chéo không nợ, không gợi ý MT4, chế độ theo dõi, chuông = tin');

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

  check('SVSO1 (chủ SP 22/10) · ô có điểm thiếu nhận xét bắt buộc = nợ + việc Nhập điểm của người chấm, cùng hạn ô chưa điểm, kể cả lượt đủ điểm; ghi nhận xét → hết; lệnh đếm chỉ đọc thấy ô đó', () => thu(() => {
    const MB_FT = classId('MB FT 101');
    const ten = 'SVSO1 HV thiếu NX';
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: 'svso1-nx' });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(week.mondayOf(TODAY)).id });
    const ghi = (k: string, nx: string | null) => conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, comment) VALUES (?, ?, 30, 40, 6.5, ?)`).run(a.id, k, nx);
    ghi('listening', null);
    const capCo = () => { conn.prepare('UPDATE assessment_attempts SET o_cho_tu = \'\' WHERE id = ?').run(a.id); xoaNho(); };
    capCo();
    const o = (skill: string) => no.scoreDebtCells(P.admin, TODAY, null).find((c: any) => c.attemptId === a.id && c.skill === skill);
    const l = o('listening'), r = o('reading');
    assert(l && r && l.overdue === r.overdue && l.han === r.han, `L thiếu nhận xét phải còn nợ như R: ${JSON.stringify({ l, r })}`);
    xoaNho();
    const viec = mw.myWork(P.lrTeacher, {}).items.find((i: any) => i.group === 'score' && (i.emIds?.includes(sid) || i.studentId === sid) && i.kns?.includes('listening'));
    assert(viec, 'việc Nhập điểm của GV L phải gồm L của em');
    assert(ops.demThieuNhanXet(conn, TODAY).some((x: any) => x.bai > 0), 'lệnh đếm chỉ đọc phải thấy ô thiếu nhận xét');
    for (const k of ['reading', 'writing1', 'writing2', 'speaking']) ghi(k, 'Nhận xét đủ mười ký tự.');
    capCo();
    assert(o('listening'), 'lượt đủ điểm vẫn nợ ô thiếu nhận xét (chủ SP 22/10)');
    conn.prepare(`UPDATE assessment_scores SET comment = 'Nghe tốt phần 1, sai phần 4.' WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    capCo();
    assert(!o('listening'), 'đã ghi nhận xét → hết nợ');
    const co = () => conn.prepare(`SELECT o_cho_tu FROM assessment_attempts WHERE id = ?`).get(a.id).o_cho_tu;
    conn.prepare(`UPDATE assessment_scores SET comment = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    (await_conOCho).capNhatConOCho([a.id]);
    assert(co() !== null, 'cờ o_cho_tu phải còn ô chờ khi thiếu nhận xét');
  }));

  check('SVSO1 (T04, C20) · Kế hoạch Test không còn dòng "MT4+ chưa xếp"', () => {
    xoaNho();
    const ds = kh.danhSachLop(P.admin, {});
    const lop = (ds.lop ?? ds.rows ?? ds).filter?.((x: any) => typeof x.tomTat === 'string') ?? [];
    assert(lop.length > 0, 'không đọc được dòng tóm tắt lớp');
    /* Chỉ còn "MT4+ chưa xếp" ở lớp QL đã tạo lượt số đó cho ít nhất một em đang học. */
    for (const x of lop) {
      const m = /MT(\d+) chưa xếp/.exec(x.tomTat);
      if (!m || Number(m[1]) <= 3) continue;
      assert(conn.prepare(`SELECT 1 FROM assessment_attempts WHERE class_id = ? AND attempt_no = ? AND status != 'cancelled'`).get(x.id, Number(m[1])),
        `${x.code}: gợi ý "${x.tomTat}" mà lớp chưa có lượt MT${m[1]}`);
    }
    assert(d.tomTatLopFT({ dangThi: null, chuaXep: null }) === '', 'không vế trống');
  });

  check('SVSO1 (brief 7) · QL xem việc GV = theo dõi: chiXem, mọi dòng có lamThay; Nhập điểm làm thay được (nhập hộ — 06 điểm 1); GV không xem được', () => {
    xoaNho();
    const w = mw.viecCuaNguoi(P.mbManager, P.lrTeacher.userId);
    assert(w.chiXem === true && w.summary.mine === 0, 'chiXem');
    assert(w.items.every((i: any) => typeof i.lamThay === 'boolean'), 'mỗi việc phải có lamThay');
    const diem = w.items.filter((i: any) => i.group === 'score');
    assert(diem.every((i: any) => i.lamThay), 'QL nhập hộ được điểm');
    assert(w.items.filter((i: any) => d.nhomViecCua(i.group) === 'y-thuc' || i.ownerId === null).every((i: any) => !i.lamThay), 'Ý thức / chưa phân công: chỉ theo dõi');
    const tc = mw.myWork(P.mbManager, { nguoi: 'tat-ca' });
    assert(tc.items.filter((i: any) => !i.mine && i.ownerId === null).every((i: any) => i.lamThay === false), '"Tất cả": việc chưa phân công → lamThay false');
    /* Case: SOS_EDIT theo ngữ cảnh Case (như cases.ts) — QL chi nhánh được; GV khác kỹ năng KHÔNG. */
    const ca = tc.items.filter((i: any) => i.caseId && d.nhomViecCua(i.group) === 'case-hoc-thuat' && i.ownerId !== null && !i.mine);
    assert(ca.length > 0 && ca.every((i: any) => i.lamThay === true), `QL làm thay Case: ${ca.filter((i: any) => !i.lamThay).map((i: any) => i.key)}`);
    const khac = ca.filter((i: any) => i.ownerId !== P.w1Teacher.userId);
    const ltGv = mw.lamThayCua(P.w1Teacher, khac);
    assert(khac.some((i: any) => !ltGv(i)), 'GV không có quyền sửa Case của người khác → lamThay false');
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
    /* Hai tin chưa đọc của CÙNG một Case: hộp gộp một dòng Cần làm, nhưng số = 2 (= "2 chưa đọc" trong hộp — đếm trước gộp). */
    const mot = d.dongChuong([
      r(10, { kind: 'sos', entity_type: 'sos_case', entity_id: 77, con_viec: 1, han: '2026-09-20' }),
      r(11, { kind: 'case_chua_chot_pa', entity_type: 'sos_case', entity_id: 77, han: '2026-09-10' }),
    ]);
    assert(mot.canLam.length === 1 && mot.soNut === 2, JSON.stringify({ canLam: mot.canLam.length, n: mot.soNut }));
  });
}
