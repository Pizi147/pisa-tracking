/**
 * PHÉP KIỂM V5 · SV-SO1 (máy chủ số của Công việc — `08-ke-hoach-trien-khai.md` mục 6, 10; brief 7, 8.1):
 *  · đơn vị đếm `/my-work`: S11 (UI-CV-V12, chủ SP 05/11, thay "việc = loại × đối tượng × kỹ năng") — MỘT DÒNG VIỆC = 1 (`demDongViec`);
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

  check('S11 (UI-CV-V12, T03) · demDongViec: một dòng = 1 — Case R + Case W cùng em = 2; dòng "Cả lớp" Nhập điểm L, R × 18 em = 1 (không nhân kỹ năng × em); dòng gộp của MỘT em = từng việc; chấm chéo 0', () => {
    const ca = (k: string, u = 'normal') => ({ key: `cause:${k}`, group: 'cause', studentId: 7, urgency: u });
    const con = Array.from({ length: 18 }, (_, i) => ({ key: `score:${i}`, group: 'score', studentId: 100 + i, urgency: i ? 'normal' : 'overdue' }));
    const caLop = { key: 'gop:score:1:u5', group: 'score', studentId: null, urgency: 'overdue', kns: ['listening', 'reading'], soBai: 36, con };
    const motEm = { key: 'gop:xac_nhan_pa:1:u5', group: 'xac_nhan_pa', studentId: null, urgency: 'today', con: [{ key: 'x:1', studentId: 9, urgency: 'today' }, { key: 'x:2', studentId: 9, urgency: 'normal' }] };
    const cheo = { key: d.KHOA_CHAM_SPEAKING, group: 'score', studentId: null, urgency: 'overdue', kns: ['speaking'], soBai: 40 };
    const r = d.demDongViec([ca('1', 'overdue'), ca('2'), caLop, motEm, cheo]);
    assert(r.n === 5 && r.quaHan === 2 && r.homNay === 1 && r.canLamNgay === 3, JSON.stringify(r));
    assert(JSON.stringify(d.demDongViec([cheo])) === JSON.stringify({ n: 0, quaHan: 0, homNay: 0, canLamNgay: 0 }), 'Speaking chấm chéo phải 0 việc');
  });

  check('S11 (UI-CV-V12) · /my-work GV: viec / viecQuaHan / canLamNgay = demDongViec trên DÒNG của chính GV; chỉ bài của chính GV; summary dòng vẫn = số dòng', () => {
    for (const p of [P.lrTeacher, P.w1Teacher, P.sTeacher, P.coreTeacher]) {
      xoaNho();
      const w = mw.myWork(p, {});
      const dem = d.demDongViec(w.dong.filter((i: any) => i.mine));   // UI-CON-LAI (nợ #528): chỉ việc của chính GV
      assert(w.summary.viec === dem.n && w.summary.viecQuaHan === dem.quaHan && w.summary.canLamNgay === dem.canLamNgay, `${JSON.stringify(w.summary)} ≠ ${JSON.stringify(dem)}`);
      assert(w.summary.total === w.dong.length, 'total = số dòng hiển thị');
      const cuaNguoiKhac = w.items.filter((i: any) => i.group === 'score' && !d.laViecChamCheo(i) && i.ownerId !== p.userId);
      assert(!cuaNguoiKhac.length, `GV thấy bài của người khác: ${cuaNguoiKhac.map((i: any) => i.key)}`);
    }
  });

  check('SVSO1 (T03, R2) · ô S Mock chấm chéo trong nợ điểm không có người giữ (userId null) — không là nợ của GV S', () => {
    xoaNho();
    const cheo = no.scoreDebtCells(P.admin, TODAY, null).filter((c: any) => c.chamCheo);
    assert(cheo.every((c: any) => c.userId === null && c.skill === 'speaking'), 'ô chấm chéo phải userId null');
  });

  check('SVSO1 → LUAT-NX-MT (chủ SP 22/10, `10` mục 7.2) · ô có band thiếu nhận xét = XONG: không nợ, cờ o_cho_tu hết; vẫn nhắc (thieuNhanXet)', () => thu(() => {
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
    assert(!o('listening') && o('reading'), 'L có band (thiếu nhận xét) không còn nợ; R chưa điểm vẫn nợ');
    const oL = svc.attemptDetail(P.admin, a.id).cells.find((c: any) => c.skill === 'listening');
    assert(oL.xong === true && oL.thieuNhanXet === 'ghi-nhan-xet', `ô L: xong + nhắc — ${JSON.stringify({ xong: oL.xong, t: oL.thieuNhanXet })}`);
    for (const k of ['reading', 'writing1', 'writing2', 'speaking']) ghi(k, null);
    (await_conOCho).capNhatConOCho([a.id]);
    assert(conn.prepare(`SELECT o_cho_tu FROM assessment_attempts WHERE id = ?`).get(a.id).o_cho_tu === null, 'đủ band (không nhận xét) → cờ o_cho_tu hết ô chờ');
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
