/**
 * PHÉP KIỂM OV-13g (đặc tả OV-13 §0 Q7, §3 dòng 7; mockup OV-13 §3b) — Speaking chấm chéo trong Công việc của GV Speaking:
 *  · GV có `lopFtChoGvSpeaking` thấy MỘT dòng gộp "Speaking chấm chéo · {tuần} · n bài": bài S Mock tuần trước + mọi bài còn tồn (khối 1 + 2 của
 *    `khoiCham`) ở lớp FT cùng chi nhánh — đúng tập Nợ điểm (`scoreDebtCells`, cờ `chamCheo`); không đỏ / quá hạn, không hạn (T18).
 *  · chi nhánh khác không thấy; GV không dạy S không có dòng; chấm xong một bài → dòng giảm một bài.
 *  · không đổi luật ai chấm: QL "Tất cả" giữ dòng chấm chéo cũ (u0); "Của một GV" (QL xem GV) không tính dòng này là việc của GV.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13gTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const perm: any = await import('../permissions.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13g · Speaking chấm chéo trong Công việc của GV Speaking');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const tuanNay = d.mondayOfDate(TODAY);
  /** Tuần thi của ô S — lịch riêng của kỹ năng, không có thì tuần của lượt. */
  const tuanS = (aid: number): string => (get(
    `SELECT COALESCE((SELECT r.week_start FROM attempt_skills k JOIN report_periods r ON r.id = k.planned_period_id
                       WHERE k.attempt_id = a.id AND k.skill = 'speaking'), rp.week_start) AS w
       FROM assessment_attempts a LEFT JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.id = ?`, aid)?.w ?? '').slice(0, 10);
  /** Bài S Mock chờ chấm theo Nợ điểm (nguồn độc lập với Công việc), khối 1 + 2. */
  const noCheo = () => scoreDebtCells(perm.loadPrincipal(P.admin.userId), TODAY, null)
    .filter((c) => c.chamCheo && d.khoiCham({ tuanThi: tuanS(c.attemptId), tuanHomNay: tuanNay, quaHan: c.overdue }) !== 'lich');
  const laCc = (x: any) => d.laViecChamCheo(x);
  const dongCc = (p: any) => (mywork.myWork(p).dong as any[]).filter(laCc);
  const baiCua = (r: any) => (r.con ?? [r]).reduce((n: number, c: any) => n + (c.soBai ?? 0), 0);
  const lopCua = (r: any) => new Set<number>((r.con ?? [r]).map((c: any) => c.classId));

  const trang = () => perm.loadPrincipal(P.sTeacher.userId);

  check('OV13g-1 · GV Speaking: MỘT dòng "Speaking chấm chéo" = đúng bài chờ chấm lớp FT cùng chi nhánh (Nợ điểm, khối 1 + 2); không quá hạn, không hạn', () => {
    const p = trang();
    const lopS = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    const ky = noCheo().filter((c) => lopS.has(c.classId));
    assert(ky.length > 0, 'dữ liệu demo: phải có bài S Mock chờ chấm ở lớp FT cùng chi nhánh');
    const ds = dongCc(p);
    assert(ds.length === 1, `phải đúng một dòng chấm chéo (${ds.length})`);
    const r = ds[0];
    assert(r.tieuDe.startsWith('Speaking chấm chéo · ') && r.group === 'score', `tiêu đề: ${r.tieuDe}`);
    assert(r.urgency === 'normal' && r.due === null && (r.con ?? []).every((c: any) => c.urgency === 'normal' && c.due === null), 'không đỏ / quá hạn, không hạn');
    assert(baiCua(r) === ky.length, `số bài ${baiCua(r)} ≠ Nợ điểm ${ky.length}`);
    assert([...lopCua(r)].sort().join() === [...new Set(ky.map((c) => c.classId))].sort().join(), 'đúng tập lớp');
    assert(r.tieuDe === `Speaking chấm chéo · ${d.tuanLich(d.addDaysIso(tuanNay, -7))} · ${ky.length} bài`, `tuần trên dòng = tuần trước: ${r.tieuDe}`);
    /* Mở được tại chỗ: mỗi lớp một panel nhập điểm S (không lưới tuần). */
    assert(!d.laViecChamCheo({ key: 'score:3|mock|p1|u9' }) && (r.con ?? [r]).every((c: any) => c.kn === 'speaking' && c.luot && c.classId), 'con mở PanelNhapDiem kỹ năng S');
  });

  check('OV13g-2 · chi nhánh khác không thấy; GV không dạy S không có dòng', () => {
    const p = trang();
    const lopS = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    const ngoai = scoreDebtCells(perm.loadPrincipal(P.admin.userId), TODAY, null).filter((c) => c.chamCheo && !lopS.has(c.classId));
    assert(ngoai.length > 0, 'dữ liệu demo: phải có bài S Mock chờ chấm ở chi nhánh khác');
    const r = dongCc(p)[0];
    assert(!ngoai.some((c) => lopCua(r).has(c.classId)), 'lớp chi nhánh khác lọt vào dòng');
    for (const k of ['w1Teacher', 'lrTeacher', 'normalCoreTeacher'] as const) {
      const x = (P as any)[k];
      assert(!perm.lopFtChoGvSpeaking(x, TODAY).length && dongCc(x).length === 0, `${k} không dạy S mà có dòng chấm chéo`);
    }
  });

  check('OV13g-3 · chấm xong một bài → dòng giảm một bài', () => thu(() => {
    const p = trang();
    const truoc = baiCua(dongCc(p)[0]);
    const lopS = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    const c = noCheo().find((x) => lopS.has(x.classId))!;
    svc.saveScore(p, c.attemptId, 'speaking', { criteria: [6, 6.5, 6, 7], gvCham: { performerSelf: true } }, TODAY);
    xoaNho();
    const sau = dongCc(trang());
    assert((sau.length ? baiCua(sau[0]) : 0) === truoc - 1, `${truoc} → ${sau.length ? baiCua(sau[0]) : 0}`);
  }));

  check('OV13g-4 · không đổi luật ai chấm: QL "Tất cả" giữ dòng chấm chéo theo lớp (u0); "Của một GV" không tính dòng chấm chéo', () => {
    const ql = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).dong as any[];
    assert(ql.every((x) => !laCc(x) || x.ownerId === null) && !ql.some((x) => x.tieuDe.startsWith('Speaking chấm chéo'))
      && ql.some((x) => (x.con ?? [x]).some((c: any) => c.key.endsWith('|u0|cc'))), 'QL: dòng chấm chéo u0 như cũ (theo lớp, không người giữ)');
    const gv = mywork.viecCuaNguoi(P.mbManager, P.sTeacher.userId).items as any[];
    assert(!gv.some(laCc), 'Của một GV: không có việc chấm chéo');
  });

  check('OV13g-5 · gopViec: chấm chéo của GV gom theo tuần (khoá OV-13c), tách khỏi Nhập điểm của chính GV cùng tuần', () => {
    const v = (o: Record<string, unknown>) => ({
      key: 'score:10|mock|p1|u9|cc', group: 'score', urgency: 'normal', due: null, studentId: null, studentName: 'Lớp MB FT 101', classId: 10, classCode: 'MB FT 101',
      khung: 'ft', ownerId: 9, tieuDe: 'Speaking chấm chéo · MT2', contextLabel: null, count: 3, href: '/test', actionLabel: 'Nhập điểm',
      phu: 'MT2', soBai: 3, tuanThi: '2026-09-07', ...o,
    });
    const nhan = (g: string) => (g === 'score' ? 'Nhập điểm' : g);
    const g = d.gopViecTheoLop([
      v({}), v({ key: 'score:11|mock|p0|u9|cc', classId: 11, classCode: 'MB FT 102', contextLabel: 'còn tồn từ W4 AUG', soBai: 2 }),
      v({ key: 'score:10|mock|p1|u9', tieuDe: 'Nhập điểm Reading', phu: 'Reading', soBai: 4 }),
      v({ key: 'score:12|mock|p1|u9', classId: 12, classCode: 'MB FT RF 12', tieuDe: 'Nhập điểm Reading', phu: 'Reading', soBai: 1 }),
    ], nhan);
    const cc = g.filter(laCc), minh = g.filter((x: any) => !laCc(x));
    assert(cc.length === 1 && cc[0].tieuDe === 'Speaking chấm chéo · W2 SEP · 5 bài' && cc[0].contextLabel === '2 lớp', `dòng cc: ${JSON.stringify(cc.map((x: any) => [x.tieuDe, x.contextLabel]))}`);
    assert(cc[0].con.some((c: any) => c.conTen === 'MB FT 102 · MT2 · còn tồn từ W4 AUG'), `con: ${cc[0].con.map((c: any) => c.conTen)}`);
    assert(minh.length === 1 && minh[0].tieuDe === 'Nhập điểm · W2 SEP · 5 bài', `dòng của GV: ${minh.map((x: any) => x.tieuDe)}`);
  });
}
