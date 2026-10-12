import crypto from 'node:crypto';
import { batBuocTu, hanTheoNgay, HAN_Y_THUC_NGAY, type ViPhamVao } from '../../../shared/domain/index.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { DEMO_DATE } from './journeys.ts';
import { criteriaFor, rawFor, type BuildCtx } from './build.ts';
import { loadPrincipal } from '../permissions.ts';
import { padCode } from '../util.ts';
import { ensurePeriod } from '../platform/week.ts';
import { DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { commitIntake, createClass } from '../classes/intake.ts';
import { createAttempt, saveScore } from '../fasttrack/attempts.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { recordViolation } from '../yThuc/violations.ts';
import { xacNhanXuLy } from '../yThuc/xuLy.ts';
import { recordIntervention, reportIssue, updateResult } from '../cases/cases.ts';
import { issuesForTopic } from '../../../shared/domain/index.ts';

/**
 * PR-Pb2-b (Task 1) — BÙ ba cột ngày nghiệp vụ cho dữ liệu seed dựng thẳng bằng SQL (không qua `saveScore` / `recordViolation` / xử lý).
 * CHỈ seed: migrate không chép dữ liệu cũ (DB reset trước bản chính). Chạy CUỐI `runSeed`, sau mọi bộ demo.
 *   · `nhap_dau_ngay` = ngày có kết quả (hoặc ngày nhập) của ô có điểm, không quá ngày demo.
 *   · `phan_hoi_ngay` = lần xử lý / đề xuất sớm nhất có vi phạm đó.
 *   · `han_xu_ly`: vi phạm đang bắt buộc → `chotHanXuLy` (đúng luật); vi phạm đã xử lý → hạn nó CÓ LÚC chưa xử lý = cùng `batBuocTu` bỏ các lần
 *     xử lý đã đóng. ponytail: bỏ qua mốc vào lớp / Quay lại học và Tạm dừng ở bước dựng lại này — dữ liệu seed không có ca đó.
 */
export function buNgayPb2b(conn: any): void {
  conn.prepare(
    `UPDATE assessment_scores SET nhap_dau_ngay = MIN(COALESCE(result_date, substr(entered_at, 1, 10), ?), ?)
      WHERE nhap_dau_ngay IS NULL
        AND (raw_score IS NOT NULL OR band IS NOT NULL)`,   // PR-S6F-a (Q18): ô thiếu tiêu chí (band NULL) chưa có lần nhập đầu
  ).run(DEMO_DATE, DEMO_DATE);
  conn.prepare(
    `UPDATE violations SET phan_hoi_ngay = (
       SELECT MIN(MIN(COALESCE(m.performed_on, substr(m.created_at, 1, 10)), ?))
         FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
        WHERE mv.violation_id = violations.id AND m.status != 'nhap')
      WHERE phan_hoi_ngay IS NULL`,
  ).run(DEMO_DATE);

  const rows = conn.prepare(
    `SELECT v.id, v.student_id, v.occurred_on, v.reported_on, v.ghi_nhan_luc, m.status, m.quyet_luc
       FROM violations v LEFT JOIN measure_violations mv ON mv.violation_id = v.id
       LEFT JOIN discipline_measures m ON m.id = mv.measure_id AND m.status = 'tu_choi'
      ORDER BY v.student_id, v.id`,
  ).all() as any[];
  const theoEm = new Map<number, Map<number, ViPhamVao>>();
  for (const r of rows) {
    const em = theoEm.get(r.student_id) ?? new Map<number, ViPhamVao>(); theoEm.set(r.student_id, em);
    const v: ViPhamVao = em.get(r.id) ?? { id: r.id, occurredOn: r.occurred_on, reportedOn: r.reported_on, ghiNhanLuc: r.ghi_nhan_luc ?? null, xuLy: [] };
    em.set(r.id, v);
    if (r.status) v.xuLy.push({ id: 0, kind: 'report_1', status: 'tu_choi', performedOn: null, quyetLuc: r.quyet_luc });
  }
  chotHanXuLy([...theoEm.keys()]);
  const dat = conn.prepare('UPDATE violations SET han_xu_ly = ? WHERE id = ? AND han_xu_ly IS NULL AND phan_hoi_ngay IS NOT NULL');
  for (const em of theoEm.values()) {
    for (const [id, tu] of batBuocTu([...em.values()])) dat.run(hanTheoNgay(tu, HAN_Y_THUC_NGAY), id);
  }
}

/**
 * BỘ DEMO PR-Pb2-b (D18, kế hoạch Phần B Task 6) — bảng Phân tích giáo viên + lớp FOU hai giáo viên, chi nhánh MB, W1 SEP – W3 SEP. Dựng qua CHÍNH
 * hàm nghiệp vụ (`createClass`, `commitIntake`, `createAttempt`, `saveScore`, `saveRegularScore`, `recordViolation`, `xacNhanXuLy`); chỉ ngày
 * nghiệp vụ / nhật ký chỉnh bằng SQL cho đúng kịch bản. Chỉ máy dev. SAU `buildCtDemo`, TRƯỚC `buNgayPb2b`.
 *
 *   4 GV mới (vai Giáo viên MB): Đỗ Thu Hương (L R), Võ Mỹ Duyên (W1 W2 · GVCN + L R G+V MB FOU 16), Lâm Quang Vinh (S · GVCN),
 *   Lê Thanh Bình (GVCN + L R G+V MB FOU 14), Ngô Bích Ngọc (P ở MB FOU 14 và MB FOU 16).
 *   MB FT 105  7 em · MT1 W4 AUG (bài trước, 3 em) · MT2 W1 SEP: L 5/7 đạt (xanh) · R 4/7 (vàng) · W1 2/7 (đỏ) · W2 3/7 · S chỉ 3 em có điểm (mẫu nhỏ),
 *              4 ô S quá hạn chưa nhập (trễ) · 2 ô L nhập trễ · 1 ô L nhập đúng hạn rồi sửa sau hạn (vẫn đúng hạn) · tiến bộ so MT1.
 *              ponytail: bộ demo GỌN (≈ 20 lượt) — phép đo PR-TD "nhân dữ liệu ×3" của tocDo.run.ts nhạy với mốc lô 900 lượt của `loadBundle`.
 *              Vi phạm: em 1 ba vi phạm xử lý ĐÚNG hạn, em 2 ba vi phạm xử lý TRỄ (GVCN Vinh).
 *              PR-DEPLOY: 2 PA GV thêm có kết quả cuối 11/09 (Hương · Listening em 3, Duyên · W1 em 1) → cột "PA hiệu quả" có số.
 *   MB FOU 14  5 em · Giữa khoá W2 SEP: Bình L R G+V (L 5/5 · R 3/5 · G+V 2/5), Ngọc P — một ô P chưa nhập (trễ).
 */
export function buildPb2bDemo(ctx: BuildCtx): { gv: number; lop: number } {
  const { conn } = ctx;
  const mb = ctx.branchId.get('MB');
  if (!mb || !ctx.userId.get('MGR_MB')) return { gv: 0, lop: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const now = `${DEMO_DATE}T09:00:00.000Z`;
  const teacherRole = (conn.prepare(`SELECT id FROM roles WHERE key = 'teacher'`).get() as any).id as number;
  const gvMoi = (ten: string, email: string, kyNang: string[]) => {
    const n = (conn.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM users').get() as any).n as number;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    const id = Number(conn.prepare(
      `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, approval_state, status, created_at)
       VALUES (?,?,?, 'Giáo viên', ?,?, 'approved', 'active', ?)`).run(padCode('NV', n, 3), ten, `${email}${EMAIL_SUFFIX}`, hash, salt, now).lastInsertRowid);
    conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)').run(id, teacherRole, mb, 'active', now);
    for (const k of kyNang) conn.prepare('INSERT INTO user_skills (user_id, skill) VALUES (?,?)').run(id, k);
    return id;
  };
  const huong = gvMoi('Đỗ Thu Hương', 'huong.do', ['listening', 'reading']);
  const duyen = gvMoi('Võ Mỹ Duyên', 'duyen.vo', ['writing1', 'writing2']);
  const vinh = gvMoi('Lâm Quang Vinh', 'vinh.lam', ['speaking']);
  const binh = gvMoi('Lê Thanh Bình', 'binh.le', ['listening', 'reading', 'writing1']);
  const ngoc = gvMoi('Ngô Bích Ngọc', 'ngoc.ngo', ['speaking']);

  const lop = (code: string, kind: string, route: string | null, batDau: string, core: number, mon: Record<string, number>) => {
    const r = createClass(admin, {
      code, branchId: mb, kind, route: route as any, isFastTrack: kind === 'FT', startDate: batDau, startPeriodId: ensurePeriod(batDau).id,
    }) as any;
    const pc = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`);
    pc.run(core, r.id, null, 1, batDau, now);
    for (const [skill, u] of Object.entries(mon)) pc.run(u, r.id, skill, 0, batDau, now);
    return r.id as number;
  };
  const hv = (classId: number, ten: string, target: number) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `pb2b-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy?.id as number };
  };

  // ---------------------------------------------------------------- MB FT 105
  const ft = lop('MB FT 105', 'FT', 'LT1', '2026-07-27', vinh, { listening: huong, reading: huong, writing1: duyen, writing2: duyen, speaking: vinh });
  const TEN = ['Phan Gia Bảo', 'Trịnh Ngọc Ánh', 'Đoàn Minh Khang', 'Hồ Thảo Nhi', 'Mạc Đức Thắng', 'La Khánh Chi', 'Ông Tuấn Hưng'];
  const em = TEN.map((t) => hv(ft, t, 6.5));
  /* Kỳ vọng theo ĐÚNG số MT của bài (MT1 / MT2 khác nhau). */
  const kyVong = (no: number) => expectationFor(6.5, no, 'LT1')!;
  const W4AUG = ensurePeriod('2026-08-24').id;
  const W1SEP = ensurePeriod('2026-08-31').id;
  const luu = (aid: number, skill: string, band: number, ngay: string, lyDo?: string) => (
    skill === 'listening' || skill === 'reading'
      ? saveScore(admin, aid, skill, { rawScore: rawFor(skill, band), ...(lyDo ? { lyDo } : {}) }, ngay)
      : saveScore(admin, aid, skill, { criteria: criteriaFor(band), ...(lyDo ? { lyDo } : {}) }, ngay));
  em.forEach((e, i) => {
    /* Lịch MT tự tạo của em mới không theo kịch bản này — dọn rồi xếp MT1 W4 AUG, MT2 W1 SEP qua `createAttempt`. */
    const q = 'SELECT id FROM assessment_attempts WHERE cycle_id = ?';
    conn.prepare(`DELETE FROM attempt_schedule_history WHERE attempt_id IN (${q})`).run(e.cycleId);
    conn.prepare(`DELETE FROM attempt_skills WHERE attempt_id IN (${q})`).run(e.cycleId);
    conn.prepare('DELETE FROM assessment_attempts WHERE cycle_id = ?').run(e.cycleId);
    /* MT1 (bài trước của cột HV tiến bộ) chỉ 3 em; em khác MT2 là bài đầu tiên của kịch bản. */
    const mt1 = i < 3 ? createAttempt(admin, { studentId: e.id, cycleId: e.cycleId, attemptNo: 1, periodId: W4AUG }) as any : null;
    const mt2 = createAttempt(admin, { studentId: e.id, cycleId: e.cycleId, attemptNo: mt1 ? 2 : 1, periodId: W1SEP }) as any;
    /* MT2 là bài THẬT của tuần W1 SEP (không phải MT lịch sử nhập bù) — `createAttempt` tự đánh dấu lịch sử vì tuần đã qua. */
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(mt2.id);
    const kv = kyVong(mt1 ? 2 : 1);
    /* MT1 đủ năm kỹ năng (bài trước của cột HV tiến bộ): thấp hơn MT2 nửa band ở em chẵn, bằng ở em lẻ. */
    const truoc = (b: number) => (i % 2 === 0 ? b - 0.5 : b);
    if (mt1) for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) luu(mt1.id, k, truoc(kv), '2026-08-27');
    const dat = (n: number) => (i < n ? kv : kv - 1);
    /* L: 5/7 đạt; em 5, 6 nhập TRỄ (11/09 > hạn 09/09); em 0 nhập đúng hạn 03/09 rồi SỬA 12/09 (lần sửa không tính). */
    luu(mt2.id, 'listening', dat(5), i >= 5 ? '2026-09-11' : '2026-09-03');
    if (i === 0) luu(mt2.id, 'listening', kv + 0.5, '2026-09-12', 'Chấm lại phần 4 — cộng sót 2 câu');
    luu(mt2.id, 'reading', dat(4), '2026-09-04');
    luu(mt2.id, 'writing1', dat(2), '2026-09-05');
    luu(mt2.id, 'writing2', dat(3), '2026-09-05');
    if (i < 3) luu(mt2.id, 'speaking', dat(2), '2026-09-06');   // 4 ô S còn lại: quá hạn chưa nhập
  });
  /* Ngày nhật ký của lần sửa = ngày nghiệp vụ của kịch bản (nhật ký ghi giờ máy). */
  conn.prepare(`UPDATE audit_logs SET created_at = '2026-09-12T09:00:00.000Z'
                 WHERE entity_type = 'assessment_attempt' AND entity_label = 'listening' AND after_json LIKE '%"lyDo"%'
                   AND entity_id IN (SELECT id FROM assessment_attempts WHERE class_id = ?)`).run(ft);

  /* Vi phạm (GVCN Vinh): em 1 — 3 vi phạm hạn 07/09, xử lý 05/09 (đúng hạn); em 2 — 3 vi phạm hạn 09/09, xử lý 11/09 (trễ). */
  const pVinh = loadPrincipal(vinh);
  const viPham = (sid: number, ngay: string[], han: string, phanHoi: string) => {
    const ids = ngay.map((d) => (recordViolation(pVinh, { studentId: sid, category: 'homework', description: 'Không làm bài tập về nhà Writing', occurredOn: d }) as any).violation.id as number);
    xacNhanXuLy(pVinh, sid, { violationIds: ids, performedOn: phanHoi, note: 'Đã trao đổi với em và phụ huynh' });
    conn.prepare(`UPDATE violations SET reported_on = occurred_on, created_at = occurred_on || 'T09:00:00.000Z', ghi_nhan_luc = occurred_on,
                    han_xu_ly = ?, phan_hoi_ngay = ? WHERE id IN (${ids.join(',')})`).run(han, phanHoi);
    /* Ngày nhật ký của lần xử lý = ngày xử lý của kịch bản (bộ demo không có gì sau ngày demo — YT4 (11)). */
    conn.prepare(`UPDATE discipline_measures SET created_at = ?, confirmed_at = ?, updated_at = NULL
                   WHERE id IN (SELECT measure_id FROM measure_violations WHERE violation_id IN (${ids.join(',')}))`).run(`${phanHoi}T09:00:00.000Z`, `${phanHoi}T09:00:00.000Z`);
  };
  viPham(em[1].id, ['2026-09-01', '2026-09-02', '2026-09-03'], '2026-09-07', '2026-09-05');
  viPham(em[2].id, ['2026-09-02', '2026-09-03', '2026-09-05'], '2026-09-09', '2026-09-11');

  /*
   * PR-DEPLOY (DEP-5, rà pb2-b.md:117-120): cột "PA hiệu quả" cần PA GIÁO VIÊN THÊM (`preset = 0`) có KẾT QUẢ CUỐI trong W1–W3 SEP — không thì
   * phải mở 13 tuần mới thấy. Hương: Case tay Listening em 3 (em đạt L ở MT2, không vướng Case SOS) → PA Tutor xong 11/09 "Có tiến bộ".
   * Duyên: Case tay Writing Task 1 em 1 → PA Bài tập thêm xong 11/09 "Tiến bộ một phần". Dựng bằng hàm nghiệp vụ (báo Case → PA → ghi kết quả).
   */
  const paGvThem = (sid: number, topic: string, chu: number, kind: string, tieuDe: string, outcome: string) => {
    const nn = issuesForTopic(topic, null)[0].code;
    const c = reportIssue(admin, {
      studentId: sid, topic, primaryCode: nn, title: tieuDe, ownerUserId: chu, detectedAt: '2026-09-07',
      summary: 'Em làm sai lặp lại cùng một dạng bài trong hai tuần liền, cần luyện riêng.', idempotencyKey: `pb2b-pa-${sid}-${topic}`,
    } as any) as any;
    const iv = recordIntervention(admin, c.id, {
      kind, description: `${tieuDe} — luyện riêng 2 buổi/tuần`, status: 'started', startedDate: '2026-09-07', performerUserId: chu,
    }) as any;
    const ivId = (iv?.interventions?.[0]?.id ?? (conn.prepare('SELECT MAX(id) AS id FROM case_interventions WHERE case_id = ?').get(c.id) as any).id) as number;
    updateResult(admin, ivId, { decision: 'end', outcome, observedOn: '2026-09-11', completedOn: '2026-09-11', note: 'Bài kiểm tra nhỏ cuối đợt làm tốt hơn hẳn.' } as any);
  };
  paGvThem(em[3].id, 'listening', huong, 'tutor', 'Listening: nghe sót số và tên riêng', 'improved');
  paGvThem(em[1].id, 'writing1', duyen, 'extra_homework', 'Writing Task 1: mô tả xu hướng chưa đủ số liệu', 'partial');

  // ---------------------------------------------------------------- MB FOU 14 + MB FOU 16 (FOU hai giáo viên, mockup 25 màn B)
  const fou14 = lop('MB FOU 14', 'FOU', null, '2026-08-17', binh, { listening: binh, reading: binh, writing: binh, speaking: ngoc });
  lop('MB FOU 16', 'FOU', null, '2026-08-24', duyen, { listening: duyen, reading: duyen, writing: duyen, speaking: ngoc });
  const TEN_FOU = ['Tô Gia Hân', 'Lưu Bảo Ngân', 'Vương Đức Anh', 'Thạch Minh Tú', 'Quan Hải Đăng'];
  TEN_FOU.forEach((t, i) => {
    const e = hv(fou14, t, 6);
    /* Giữa khoá (tuần học 4 = W2 SEP) đã qua lúc ghi danh nên không tự xếp — Quản lý xếp bù như `ctSeed` làm với Cuối khoá. */
    planRegularTests(loadPrincipal(ctx.userId.get('MGR_MB')!), fou14, { studentIds: [e.id], kinds: ['progress'] });
    const a = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' AND status != 'cancelled' ORDER BY id LIMIT 1`).get(e.id) as any;
    if (!a) return;
    const d = [[22, 20, 18, 21], [20, 19, 17, 20], [19, 16, 15, 19], [18, 21, 12, 18], [20, 14, 19, null]][i];
    ['listening', 'reading', 'writing', 'speaking'].forEach((k, j) => {
      if (d[j] !== null) saveRegularScore(admin, a.id, k, { score: d[j]!, total: 25 }, '2026-09-10');
    });
  });
  return { gv: 5, lop: 3 };
}
