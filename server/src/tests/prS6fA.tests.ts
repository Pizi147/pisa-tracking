/** PHÉP KIỂM PR-S6F-a — sửa sau rà đợt 6 lượt 1, phần máy chủ / dữ liệu (kế hoạch 2026-10-01-pr-s6f-sua-sau-ra-dot-6, Task 1–4, 10, 11). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrS6fATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  /** Chạy `fn` với ngày nghiệp vụ `ngay` (demo_date), trả lại ngày cũ sau đó. */
  const voiNgay = <T>(ngay: string, fn: () => T): T => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', ngay);
    try { return fn(); } finally { setConfig('demo_date', cu); }
  };
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const toi = path.dirname(fileURLToPath(import.meta.url));
  /* Chạy từ dist-server (npm run check) hoặc thẳng từ nguồn — tìm gốc repo theo package.json. */
  const REPO = ['../../..', '../../../..'].map((x) => path.resolve(toi, x)).find((x) => fs.existsSync(path.join(x, 'package.json')))!;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `S6FA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `s6fa-${seq}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    return { sid: st.id as number, cy: cy?.id as number };
  };
  const o = (aid: number, skill: string) => get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);
  const MB = get(`SELECT branch_id FROM classes WHERE id = ?`, classId('MB FT 101')).branch_id as number;
  const tuanNay = week.mondayOf(TODAY);
  /** Dòng Chấm điểm của bảng GV (mọi GV) tại ngày `ngay`, khoảng một tuần `tuan`. */
  const dongCham = (ngay: string, tuan = tuanNay) => voiNgay(ngay, () => {
    const c = pt.nguCanhPtGv(P.mbManager, { ct: 'ft', tu: tuan, den: tuan });
    return pt.tapChamDiem(c, pt.napBai(P.mbManager, c)).dong as Map<number, any>;
  });

  // ------------------------------------------------------------------ khối 1 · P0 "lần nhập đầu" chỉ khi ô có điểm thật (Q18)
  console.log('\nPR-S6F-a · (1) Lần nhập đầu chỉ tính khi ô có điểm thật');
  /* Em mới MB FT 101, MT1 tuần W3 SEP; hạn Writing đặt đè 22/09 (Thứ Ba sau tuần thi). */
  const e1 = emMoi('MB FT 101');
  boLichTuTao(conn, e1.cy);
  const a1 = luotThu(conn, svc.createAttempt, P.admin, { studentId: e1.sid, cycleId: e1.cy, classId: classId('MB FT 101'), no: 1, periodId: week.ensurePeriod(tuanNay).id });
  conn.prepare(`UPDATE attempt_skills SET deadline_override = '2026-09-22' WHERE attempt_id = ? AND skill = 'writing'`).run(a1.id);

  check('S6F-a (1a) · W1 gõ 1/4 tiêu chí 20/09 → nhap_dau_ngay NULL; đủ 4 tiêu chí 28/09 → 28/09 → bảng GV tính TRỄ', () => {
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6, null, null, null] }, '2026-09-20');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === null, `một tiêu chí đã chốt ngày: ${o(a1.id, 'writing1').nhap_dau_ngay}`);
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6, 6, 6, 6] }, '2026-09-28');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === '2026-09-28', `đủ tiêu chí: ${o(a1.id, 'writing1').nhap_dau_ngay}`);
    const r = dongCham('2026-09-28').get(d.baiId(a1.id, 'writing1'));
    assert(r && !r.dung && r.nhapDau === '2026-09-28', `dòng Chấm điểm: ${JSON.stringify(r)}`);
  });
  check('S6F-a (1b) · bỏ bớt tiêu chí làm band về NULL → nhap_dau_ngay NULL; sửa điểm (band vẫn có) giữ ngày đầu', () => {
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6.5, 6, 6, 6], lyDo: 'Chấm lại tiêu chí 1' }, '2026-09-29');
    assert(o(a1.id, 'writing1').nhap_dau_ngay === '2026-09-28', 'sửa sau phải giữ ngày đầu');
    svc.saveScore(P.admin, a1.id, 'writing1', { criteria: [6.5, 6, null, null], lyDo: 'Nhập nhầm hai tiêu chí cuối' }, '2026-09-29');
    assert(o(a1.id, 'writing1').band === null && o(a1.id, 'writing1').nhap_dau_ngay === null, JSON.stringify(o(a1.id, 'writing1')));
  });
  check('S6F-a (1c) · lớp thường (khoá lại): lưu điểm ngày D → D; xoá điểm → NULL', () => {
    const { sid } = emMoi('MB FOU 12');
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, sid);
    regular.saveRegularScore(P.admin, a.id, 'reading', { score: 20, total: 40 }, TODAY);
    assert(o(a.id, 'reading').nhap_dau_ngay === TODAY, 'lần đầu');
    regular.saveRegularScore(P.admin, a.id, 'reading', { score: null, total: null, lyDo: 'Nhập nhầm em' }, TODAY);
    assert(o(a.id, 'reading').nhap_dau_ngay === null, 'xoá điểm phải NULL');
  });
  check('S6F-a (1d) · HAI ĐƯỜNG: ô W2 1/4 tiêu chí quá hạn nằm trong CẢ scoreDebtCells(...).overdue VÀ tập "chưa nhập & trễ" của bảng GV', () => {
    svc.saveScore(P.admin, a1.id, 'writing2', { criteria: [6, null, null, null] }, '2026-09-20');
    const no = voiNgay('2026-09-28', () => debt.scoreDebtCells(P.admin, '2026-09-28', [MB]) as any[]);
    assert(no.some((x) => x.attemptId === a1.id && x.skill === 'writing2' && x.overdue), 'Nợ điểm không có ô W2');
    const r = dongCham('2026-09-28').get(d.baiId(a1.id, 'writing2'));
    assert(r && !r.dung && r.nhapDau === null && r.tre === 6, `bảng GV: ${JSON.stringify(r)}`);
  });
}
