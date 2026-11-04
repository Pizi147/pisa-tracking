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

  const trang = () => perm.loadPrincipal(P.sTeacher.userId);

  /* OV-14c thay dòng gộp theo tuần bằng MỘT việc "Chấm Speaking · n bài" (từ thứ Hai tuần thi) — OV13g-1 / -5 cũ chuyển sang prOv14c. */
  check('OV13g-1 · GV Speaking: MỘT việc "Chấm Speaking" = đúng bài S Mock chờ chấm lớp FT chi nhánh (Nợ điểm, tới tuần này); không quá hạn, không hạn', () => {
    const p = trang();
    const lopS = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    const ky = scoreDebtCells(perm.loadPrincipal(P.admin.userId), TODAY, null)
      .filter((c) => c.chamCheo && lopS.has(c.classId) && d.canChamCheo(true, tuanS(c.attemptId), tuanNay));
    assert(ky.length > 0, 'dữ liệu demo: phải có bài S Mock chờ chấm ở lớp FT cùng chi nhánh');
    const ds = dongCc(p);
    assert(ds.length === 1 && ds[0].key === d.KHOA_CHAM_SPEAKING, `phải đúng một việc Chấm Speaking (${ds.length})`);
    const r = ds[0];
    assert(r.tieuDe === `${d.VIEC_CHAM_CHEO} · ${ky.length} bài` && r.soBai === ky.length, `số bài ${r.tieuDe} ≠ Nợ điểm ${ky.length}`);
    assert(r.urgency === 'normal' && r.due === null, 'không đỏ / quá hạn, không hạn');
  });

  check('OV13g-2 · chi nhánh khác không thấy; GV không dạy S không có dòng', () => {
    const p = trang();
    const lopS = new Set<number>(perm.lopFtChoGvSpeaking(p, TODAY));
    const ngoai = scoreDebtCells(perm.loadPrincipal(P.admin.userId), TODAY, null).filter((c) => c.chamCheo && !lopS.has(c.classId));
    assert(ngoai.length > 0, 'dữ liệu demo: phải có bài S Mock chờ chấm ở chi nhánh khác');
    const lopQ = new Set(svc.baiChamSpeaking(p, TODAY).rows.map((x: any) => x.classId));
    assert(!ngoai.some((c) => lopQ.has(c.classId)), 'lớp chi nhánh khác lọt vào hàng đợi');
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
    svc.saveScore(p, c.attemptId, 'speaking', { criteria: [9, 9, 9, 9], nhanXet: 'Fluent, good range of vocabulary.', gvCham: { performerSelf: true } }, TODAY);   // V5 SV-SO1: xong = band + đủ nhận xét
    xoaNho();
    const sau = dongCc(trang());
    assert((sau.length ? baiCua(sau[0]) : 0) === truoc - 1, `${truoc} → ${sau.length ? baiCua(sau[0]) : 0}`);
  }));

  /* SUA-LOI-CV (chủ SP 05/11, thay "Của một GV không tính" của OV-13g): QL xem GV Speaking thấy đúng việc "Chấm Speaking" GV đó thấy — không dòng theo lớp. */
  check('OV13g-4 · không đổi luật ai chấm: QL "Tất cả" giữ dòng chấm chéo theo lớp (u0); "Của một GV" chỉ có việc Chấm Speaking của GV đó', () => {
    const ql = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).dong as any[];
    assert(ql.every((x) => !laCc(x) || x.ownerId === null) && !ql.some((x) => x.tieuDe.startsWith('Speaking chấm chéo'))
      && ql.some((x) => (x.con ?? [x]).some((c: any) => c.key.endsWith('|u0|cc'))), 'QL: dòng chấm chéo u0 như cũ (theo lớp, không người giữ)');
    const gv = (mywork.viecCuaNguoi(P.mbManager, P.sTeacher.userId).items as any[]).filter(laCc);
    assert(gv.length === 1 && gv[0].key === d.KHOA_CHAM_SPEAKING, `Của một GV: ${gv.map((x) => x.key)}`);
  });
}
