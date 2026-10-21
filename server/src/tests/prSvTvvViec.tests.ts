/**
 * PHÉP KIỂM SV-TVV-VIEC (luật 21/10-TVV, Q-A3, Q-D3 ①, Q-D4 ①) — 4 việc TVV, MỘT người giữ = TVV của em (không có → QL chi nhánh):
 * Chốt ngày thi (không hạn) · Chọn bước tiếp sau thi (hạn: ngày thi + 7; có KQ → muộn hơn của hạn gốc và ngày có KQ + 7) · Bổ sung hồ sơ thiếu
 * (4 trường, một dòng tổng) · Cập nhật KQ thi thật (GVCN → TVV, không hạn). Mỗi mục chạy trong giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvTvvViecTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nSV-TVV-VIEC · 4 việc TVV: một người giữ, hạn đúng luật');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const gvcn = P.coreTeacher; const ql = P.mbManager;
  const LOP = 'MB FT 101';
  let dem = 0;
  const tvvMoi = () => {
    dem += 1;
    const uid = accounts.createAccount(P.admin, { email: `svtv.tvv${dem}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svtv', fullName: `TVV SVTV ${dem}`, roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  };
  const moiEm = (tvv: any | null, hoSo: { email?: string | null; dob?: string | null } = {}): { sid: number; cy: number } => {
    const ten = `SVTV em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId(LOP), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `svtv-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv ? tvv.userId : null, st.id);
    if ('email' in hoSo) conn.prepare('UPDATE students SET email = ? WHERE id = ?').run(hoSo.email, st.id);
    if ('dob' in hoSo) conn.prepare('UPDATE students SET dob = ? WHERE id = ?').run(hoSo.dob, st.id);
    return { sid: st.id as number, cy: cy.id as number };
  };
  const thi = (cy: number, c: Record<string, unknown>) => {
    const k = Object.keys(c);
    conn.prepare(`UPDATE learning_cycles SET ${k.map((x) => `${x} = ?`).join(', ')} WHERE id = ?`).run(...k.map((x) => c[x]), cy);
  };
  const viec = (p: any, sid: number | null, nhom: string, o: any = {}) => {
    xoaNho();
    return ((myWork(p, o) as any).items as any[]).filter((x) => x.group === nhom && (sid === null || x.studentId === sid));
  };
  const chotNgay = (p: any, sid: number, o: any = {}) => viec(p, sid, 'missing_data', o).filter((x: any) => String(x.key).startsWith('chot-ngay-thi:'));
  const thangNay = TODAY.slice(0, 7);
  const kq = (p: any, cy: number, ngayThi: string | null) => thiThat.datKetQuaThiThat(p, cy, { ngayThi, l: 6.5, r: 7, w: 6, s: 6.5 });

  await checkAsync('SVTV-1 · Chốt ngày thi: người giữ = TVV của em (không hạn); GVCN không còn; em chưa có TVV → QL chi nhánh', () => thu(() => {
    const tvv = tvvMoi(); const a = moiEm(tvv); const b = moiEm(null);
    for (const x of [a, b]) thi(x.cy, { exam_month: thangNay, exam_date: null, exam_period_id: null });
    const it = chotNgay(tvv, a.sid);
    assert(it.length === 1 && it[0].mine && it[0].ownerId === tvv.userId && it[0].due === null && it[0].urgency === 'normal', 'TVV: ' + JSON.stringify(it));
    assert(chotNgay(gvcn, a.sid).length === 0 && chotNgay(gvcn, b.sid).length === 0, 'GVCN không còn việc Chốt ngày thi');
    assert(chotNgay(ql, a.sid).length === 0, 'QL "Của tôi" không có việc TVV giữ');
    assert(chotNgay(ql, a.sid, { nguoi: 'tat-ca' })[0]?.ownerId === tvv.userId, 'QL "Của GV" thấy việc của TVV');
    const q = chotNgay(ql, b.sid);
    assert(q.length === 1 && q[0].mine && q[0].ownerId === ql.userId, 'em chưa có TVV → QL: ' + JSON.stringify(q));
    assert(chotNgay(tvvMoi(), a.sid).length === 0, 'TVV khác cùng chi nhánh không có');
  }));

  await checkAsync('SVTV-2 · Cập nhật KQ thi thật: GVCN → TVV, KHÔNG hạn (thi đã 30 ngày vẫn không quá hạn); thiếu TVV → QL; lưu điểm riêng → hết việc, Bước tiếp mở', () => thu(() => {
    const tvv = tvvMoi(); const a = moiEm(tvv); const b = moiEm(null);
    for (const x of [a, b]) thi(x.cy, { exam_date: addDays(TODAY, -30) });
    const it = viec(tvv, a.sid, 'thi_that');
    assert(it.length === 1 && it[0].mine && it[0].ownerId === tvv.userId && it[0].due === null && it[0].urgency === 'normal', 'TVV: ' + JSON.stringify(it));
    assert(viec(gvcn, a.sid, 'thi_that').length === 0 && viec(gvcn, b.sid, 'thi_that').length === 0, 'GVCN không còn việc KQ thi thật');
    assert(viec(ql, b.sid, 'thi_that')[0]?.ownerId === ql.userId, 'thiếu TVV → QL');
    assert(viec(ql, a.sid, 'thi_that').length === 0 && viec(ql, a.sid, 'thi_that', { nguoi: 'tat-ca' })[0]?.ownerId === tvv.userId, 'QL Của tôi / Của GV');
    const s = d.trangThaiSauThi({ exam_date: addDays(TODAY, -30) }, TODAY);
    assert(s.giaiDoan === 'da_thi_cho_kq' && s.han === null && s.quaHan === false, 'trạng thái sau thi không hạn: ' + JSON.stringify(s));
    kq(tvv, a.cy, addDays(TODAY, -30));
    assert(viec(tvv, a.sid, 'thi_that').length === 0, 'lưu điểm → hết việc KQ');
    assert(viec(tvv, a.sid, 'buoc_tiep').length === 1, 'chưa chốt bước tiếp → việc Bước tiếp mở');
  }));

  await checkAsync('SVTV-3 · Chọn bước tiếp: một người giữ (TVV của em), TVV khác / QL "Của tôi" không còn; hạn = muộn hơn của (ngày thi + 7, ngày có KQ + 7); sửa KQ không dời; đổi TVV không reset', () => thu(() => {
    const tvv = tvvMoi(); const khac = tvvMoi(); const a = moiEm(tvv); const b = moiEm(null);
    thi(a.cy, { exam_date: addDays(TODAY, -3) }); thi(b.cy, { exam_date: addDays(TODAY, -3) });
    kq(tvv, a.cy, addDays(TODAY, -3)); kq(ql, b.cy, addDays(TODAY, -3));
    const it = viec(tvv, a.sid, 'buoc_tiep');
    assert(it.length === 1 && it[0].mine && it[0].ownerId === tvv.userId && it[0].due === addDays(TODAY, 7) && it[0].urgency === 'normal', 'TVV: ' + JSON.stringify(it));
    assert(viec(khac, a.sid, 'buoc_tiep').length === 0, 'TVV khác chi nhánh không còn');
    assert(viec(ql, a.sid, 'buoc_tiep').length === 0, 'QL "Của tôi" không còn việc TVV giữ');
    assert(viec(ql, a.sid, 'buoc_tiep', { nguoi: 'tat-ca' })[0]?.ownerId === tvv.userId, 'QL "Của GV" thấy');
    assert(viec(ql, b.sid, 'buoc_tiep')[0]?.ownerId === ql.userId, 'thiếu TVV → QL');
    kq(tvv, a.cy, addDays(TODAY, -3));
    assert(viec(tvv, a.sid, 'buoc_tiep')[0].due === addDays(TODAY, 7), 'sửa KQ không dời hạn');
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(khac.userId, a.sid);
    assert(viec(khac, a.sid, 'buoc_tiep')[0]?.due === addDays(TODAY, 7) && viec(tvv, a.sid, 'buoc_tiep').length === 0, 'đổi TVV: việc theo người mới, hạn giữ');
    /* Bảng hạn (hàm thuần): thi lâu, KQ muộn → KQ + 7; thi muộn hơn KQ + 7 → hạn gốc; quá hạn sau 7 ngày kể từ ngày có KQ. */
    const h = (c: any) => d.trangThaiSauThi({ thi_that_l: 6, thi_that_r: 6, thi_that_w: 6, thi_that_s: 6, ...c }, TODAY);
    assert(h({ exam_date: addDays(TODAY, -40), ngay_kq: addDays(TODAY, -2) }).han === addDays(TODAY, 5), 'KQ muộn → KQ + 7');
    assert(h({ exam_date: addDays(TODAY, -1), ngay_kq: addDays(TODAY, -5) }).han === addDays(TODAY, 6), 'hạn gốc muộn hơn');
    const q = h({ exam_date: addDays(TODAY, -40), ngay_kq: addDays(TODAY, -8) });
    assert(q.han === addDays(TODAY, -1) && q.quaHan, 'quá hạn sau 7 ngày từ ngày có KQ: ' + JSON.stringify(q));
    assert(!h({ exam_date: addDays(TODAY, -40), ngay_kq: addDays(TODAY, -7) }).quaHan, 'đúng ngày thứ 7 chưa quá hạn');
  }));

  check('SVTV-4 · "Thiếu" chỉ đếm 4 trường: Ngày sinh · Email · Tuần bắt đầu · Target FT (bỏ tháng thi, điểm đầu vào, mốc tiếp theo)', () => {
    const du = { start_period_id: 1, exam_month: null, target_score: 7, baseline: false };
    const k = (x: any) => schedule.missingForStudent(x).map((m: any) => m.key).sort().join(',');
    assert(k({ cycle: du, student: { dob: '2010-01-01', email: 'a@b.vn' }, isFastTrack: true, hasNextMilestone: false }) === '', 'đủ 4 trường → không thiếu');
    assert(k({ cycle: { ...du, start_period_id: null, target_score: null }, student: { dob: null, email: null }, isFastTrack: true }) === 'dob,email,start_week,target', 'thiếu cả 4');
    assert(k({ cycle: { ...du, target_score: null }, student: { dob: '2010-01-01', email: 'a@b.vn' }, isFastTrack: false }) === '', 'lớp thường không đếm Target');
  });

  await checkAsync('SVTV-5 · Bổ sung hồ sơ thiếu: MỘT dòng tổng mỗi người giữ (TVV — em của mình; QL — em chưa có TVV), đếm em thiếu 4 trường', () => thu(() => {
    const tvv = tvvMoi();
    const a = moiEm(tvv, { email: null }); const b = moiEm(tvv, { dob: null }); moiEm(tvv); const c = moiEm(null, { email: null });
    const it = viec(tvv, null, 'bo_sung_ho_so');
    assert(it.length === 1 && it[0].count === 2 && it[0].mine && it[0].ownerId === tvv.userId && it[0].due === null && /^Bổ sung hồ sơ thiếu · 2 em$/.test(it[0].tieuDe)
      && [a.sid, b.sid].every((x) => it[0].emIds.includes(x)), 'TVV: ' + JSON.stringify(it));
    const q = viec(ql, null, 'bo_sung_ho_so');
    assert(q.length === 1 && q[0].emIds.includes(c.sid) && !q[0].emIds.includes(a.sid) && q[0].ownerId === ql.userId, 'QL: ' + JSON.stringify(q.map((x: any) => x.emIds)));
    assert(viec(gvcn, null, 'bo_sung_ho_so').length === 0, 'GVCN không có');
  }));

  await checkAsync('SVTV-6 · câu hướng dẫn nhóm "Cập nhật kết quả thi thật" không còn "Hạn 4 tuần"', () => thu(() => {
    const tvv = tvvMoi(); const a = moiEm(tvv); thi(a.cy, { exam_date: addDays(TODAY, -3) });
    xoaNho();
    const g = ((myWork(tvv) as any).groups as any[]).find((x) => x.key === 'thi_that');
    assert(g && !/4 tuần|hạn/i.test(g.hint), 'hint: ' + g?.hint);
  }));
}
