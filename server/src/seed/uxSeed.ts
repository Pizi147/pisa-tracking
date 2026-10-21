/**
 * BỘ DEMO SEED-UX (kế hoạch `docs/superpowers/plans/2026-10-21-pr-seed-ux.md`, `thiet-ke/v5/du-lieu-demo.md`) — THÊM dữ liệu để chụp đủ mockup V5:
 *
 *   U1  tài khoản: GV "Đỗ Thu Hương" (MB, L R) hồ sơ thêm S, không dạy lớp S nào (T03) · Admin VP Monbay · TVV MB (Phan Mai, Lê Thu) / BC / HD / UB.
 *   U2  gán TVV + SĐT phụ huynh cho đa số em đang học; mỗi chi nhánh chừa em đầu tiên không TVV (việc về QL); 4 em của TVV Hương giữ nguyên.
 *   U3  MT2 MB FT 101 của Bùi Thảo Vy · Tạ Minh Quân · Lương Bảo Anh theo mockup ov14-6 khung m3 (Trần Thu Hà, Vũ Hải Đăng đã có MT2 theo V5).
 *   U4  thi thật: UB FT 401 Dương Minh Quân (Đạt, chưa chốt bước tiếp) + Lý Thanh Trúc (Chưa đạt, đã chốt) có KQ 15/08 · CP FT 110 Đinh Ngọc Quyên thi 12/09,
 *       KQ 14/09, chưa chọn bước tiếp (T09) · UB FT 401 Phan Hải Anh thi 05/09 "Đã thi · chờ KQ". Em chưa chốt ngày thi = các em chỉ có tháng (sẵn có).
 *   U5  lớp mới HD FT 306 (GV mới Mạc Thùy Linh, TVV Vũ Hồng Nhung): MT1 cũ có "-" (S, ghi khi MT đã qua → Không dự thi); 3 em PA Tutor, 12 buổi
 *       17/08–13/09 (6 tutor danh sách + 1 tên gõ tay, một tutor có buổi "Không" → nhóm chú ý của trang Tutor); 2 em có lần xử lý vi phạm (11/09, 03/09).
 *   U6  lớp thường mới HD FOU 06: Giữa khoá W2 SEP — 4 em đủ điểm mọi môn đạt, 1 em "17/25" một môn trượt (Báo PH chưa làm), 1 em trượt đã Báo PH.
 *   U7  kẹp `notifications.created_at` về ≤ ngày demo (không gì ở tương lai).
 * Đi qua hàm dịch vụ; SQL thẳng chỉ để lùi ngày nghiệp vụ / gán TVV. Dựng SAU `buildHeadTutor` (id người dùng cũ không đổi). Tên, SĐT GIẢ.
 */
import crypto from 'node:crypto';
import { DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { padCode, addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { loadPrincipal } from '../permissions.ts';
import { commitIntake, createClass } from '../classes/intake.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { confirmCoordination } from '../yThuc/phoiHop.ts';
import { ghiKetQuaBaoPh } from '../yThuc/baoPhTvv.ts';
import { recordViolation } from '../yThuc/violations.ts';
import { xacNhanXuLy } from '../yThuc/xuLy.ts';
import { recordIntervention, reportIssue, updateResult } from '../cases/cases.ts';
import { datKetQuaThiThat } from '../loTrinh/thiThat.ts';
import { chonBuocTiep } from '../loTrinh/buocTiep.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { issuesForTopic } from '../../../shared/domain/index.ts';
import { DEMO_DATE } from './data.ts';
import { emailThu } from './emailThu.ts';
import { idTutor } from './tuSeed.ts';

export function buildUxDemo(conn: any, adminId: number): { tvv: number; soHvTvv: number; buoiTutor: number } {
  const now = `${DEMO_DATE}T09:00:00.000Z`;
  const admin = loadPrincipal(adminId);
  const cn = new Map((conn.prepare('SELECT id, code FROM branches').all() as any[]).map((b) => [b.code as string, b.id as number]));
  const mb = cn.get('MB')!;
  const taiKhoan = (ten: string, email: string, title: string, vai: string, branchId: number | null, kyNang: string[] = []) => {
    const n = (conn.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM users').get() as any).n as number;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    const id = Number(conn.prepare(
      `INSERT INTO users (code, full_name, email, title, password_hash, password_salt, approval_state, status, created_at)
       VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`).run(padCode('NV', n, 3), ten, `${email}${EMAIL_SUFFIX}`, title, hash, salt, now).lastInsertRowid);
    const roleId = (conn.prepare('SELECT id FROM roles WHERE key = ?').get(vai) as any).id as number;
    conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)').run(id, roleId, branchId, 'active', now);
    for (const k of kyNang) conn.prepare('INSERT INTO user_skills (user_id, skill) VALUES (?,?)').run(id, k);
    return id;
  };

  // ---------------------------------------------------------------- U1 · tài khoản
  /* T03 (V5): GV Đỗ Thu Hương (pb2b, dạy L R) — hồ sơ thêm S, không phân công S lớp nào → nhóm Chấm Speaking chéo. */
  conn.prepare(`INSERT INTO user_skills (user_id, skill) SELECT id, 'speaking' FROM users WHERE full_name = 'Đỗ Thu Hương'
                 AND NOT EXISTS (SELECT 1 FROM user_skills k WHERE k.user_id = users.id AND k.skill = 'speaking')`).run();
  taiKhoan('Phạm Thanh Xuân', 'xuan.pham', 'Admin VP Monbay', 'office_admin', mb);
  const tvvMb = taiKhoan('Phan Mai', 'mai.phan', 'Tư vấn viên Monbay', 'consultant', mb);
  const tvvMb2 = taiKhoan('Lê Thu', 'thu.le', 'Tư vấn viên Monbay', 'consultant', mb);
  const tvvCn: Record<string, number[]> = {
    MB: [tvvMb, tvvMb2],
    BC: [taiKhoan('Đỗ Minh Trang', 'trang.do', 'Tư vấn viên Bãi Cháy', 'consultant', cn.get('BC')!)],
    HD: [taiKhoan('Vũ Hồng Nhung', 'nhung.vu', 'Tư vấn viên Hải Dương', 'consultant', cn.get('HD')!)],
    UB: [taiKhoan('Trịnh Thu Thảo', 'thao.trinh', 'Tư vấn viên Uông Bí', 'consultant', cn.get('UB')!)],
  };
  const gvLinh = taiKhoan('Mạc Thùy Linh', 'linh.mac', 'Giáo viên', 'teacher', mb, ['listening', 'reading', 'writing1', 'writing2', 'speaking']);
  const hd = cn.get('HD')!;
  conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) SELECT ?, id, ?, 'active', ? FROM roles WHERE key = 'teacher'`).run(gvLinh, hd, now);

  // ---------------------------------------------------------------- U3 · MT2 MB FT 101 (mockup ov14-6 m3)
  const mt2 = (ten: string) => (conn.prepare(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id WHERE s.full_name = ? AND a.attempt_no = 2 AND a.kind = 'mock' AND a.status != 'cancelled'`,
  ).get(ten) as any)?.id as number | undefined;
  const ngayMt2 = '2026-08-14';
  const nhapMt2 = (ten: string, l: number, r: number, w1: number | null, w2: number | null, s: number | null) => {
    const id = mt2(ten);
    if (!id) return;
    saveScore(admin, id, 'listening', { rawScore: l, resultDate: ngayMt2 });
    saveScore(admin, id, 'reading', { rawScore: r, resultDate: ngayMt2 });
    if (w1 !== null) saveScore(admin, id, 'writing1', { criteria: [w1, w1, w1, w1], resultDate: ngayMt2 });
    if (w2 !== null) saveScore(admin, id, 'writing2', { criteria: [w2, w2, w2, w2], resultDate: ngayMt2 });
    if (s !== null) saveScore(admin, id, 'speaking', { criteria: [s, s, s, s], resultDate: ngayMt2 });
  };
  nhapMt2('Bùi Thảo Vy', 30, 28, 6.0, 6.5, 6.0);
  nhapMt2('Tạ Minh Quân', 27, 28, 6.5, 6.5, 6.5);
  nhapMt2('Lương Bảo Anh', 27, 27, 6.0, null, null);
  /* Số nghiệm thu T11 (08 mục 2): MT2 MB FT 101 = 20 em đủ dữ liệu · 15 đạt. 10 lượt MT2 còn trống dời về W3 AUG (tuần MT2 của lớp) rồi nhập:
     6 em Overall = kỳ vọng (Đạt), 4 em dưới kỳ vọng 0.5 (Chưa đạt). Kỳ vọng MT2 = Target − 0.5. */
  const w3Aug = ensurePeriod('2026-08-17').id;
  const BU_MT2: [string, boolean][] = [
    ['Hà Gia Bình', true], ['Ngô Thanh Tùng', true], ['Trịnh Gia Bảo', true], ['Đặng Thu Hà', true], ['Võ Minh Triết', true], ['Chu Nhật Minh', true],
    /* Chưa đạt → Case SOS tự tạo: chỉ em không thuộc kịch bản demo nào (phép kiểm cũ soi Case của em kịch bản). */
    ['Ngô Bảo Châu', false], ['Lý Thanh Tâm', false], ['Phạm Khánh Linh', false], ['Kiều Thảo Nhi', false],
  ];
  for (const [ten, dat] of BU_MT2) {
    const a = conn.prepare(`SELECT a.id, a.target_at_attempt AS t FROM assessment_attempts a JOIN students s ON s.id = a.student_id
                             WHERE s.full_name = ? AND a.attempt_no = 2 AND a.kind = 'mock' AND a.status != 'cancelled'`).get(ten) as any;
    if (!a?.t) continue;
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(w3Aug, a.id);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(w3Aug, a.id);
    const b = a.t - 0.5 - (dat ? 0 : 0.5);
    saveScore(admin, a.id, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(b), resultDate: '2026-08-21' });
    saveScore(admin, a.id, 'reading', { rawScore: READING_BY_RAW.indexOf(b), resultDate: '2026-08-21' });
    for (const k of ['writing1', 'writing2', 'speaking']) saveScore(admin, a.id, k, { criteria: [b, b, b, b], resultDate: '2026-08-22' });
  }

  // ---------------------------------------------------------------- U5 · HD FT 306 (lớp mới, GV mới)
  /* Ở HD, không ở MB: lớp FT thêm ở MB làm vỡ phép đo tốc độ QL MB ×3 (TD3-b-2, TD7) — quy tắc dừng của kế hoạch SEED-UX mục 2.4. */
  const khaiGiang = '2026-06-15';
  const ft = (createClass(admin, {
    code: 'HD FT 306', branchId: hd, kind: 'FT', route: 'LT1' as any, isFastTrack: true, startDate: khaiGiang, startPeriodId: ensurePeriod(khaiGiang).id,
  }) as any).id as number;
  const pc = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`);
  pc.run(gvLinh, ft, null, 1, khaiGiang, now);
  for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) pc.run(gvLinh, ft, k, 0, khaiGiang, now);
  const them = (classId: number, ten: string, o: { target?: number; startWeek?: string }) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target: o.target, startWeek: o.startWeek, email: emailThu(), dob: '2010-05-01' }], idempotencyKey: `ux-demo-${ten}` } as any);
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  };
  const emFt = ['Kiều Minh Ngọc', 'Lạc Gia Bảo', 'Thái Hồng Nhung', 'Văn Đức Mạnh', 'Hứa Thanh Mai', 'Quách Tuấn Kiệt']
    .map((ten) => them(ft, ten, { target: 6.5, startWeek: khaiGiang }));
  /* Kịch bản lên lịch từ đầu khoá → lượt thường, không phải MT lịch sử (như xlmtSeed). */
  conn.prepare(`UPDATE assessment_attempts SET lich_su = 0 WHERE class_id = ?`).run(ft);
  const mt1 = (sid: number) => (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND attempt_no = 1 AND kind = 'mock'`).get(sid) as any).id as number;
  const LR = (band: number) => LISTENING_BY_RAW.indexOf(band);
  emFt.forEach((sid, i) => {
    const a = mt1(sid);
    const b = [6.0, 6.0, 6.5, 6.0, 6.5, 6.0][i];   // ≥ kỳ vọng MT1 → không Case SOS tự tạo (Case Tutor là Case tay dưới)
    saveScore(admin, a, 'listening', { rawScore: LR(b), resultDate: '2026-07-24' });
    saveScore(admin, a, 'reading', { rawScore: LR(b), resultDate: '2026-07-24' });
    saveScore(admin, a, 'writing1', { criteria: [b, b, b, b], resultDate: '2026-07-25' });
    saveScore(admin, a, 'writing2', { criteria: [b, b, b, b], resultDate: '2026-07-25' });
    /* Em cuối: MT1 nhập bù sau khi tuần thi đã qua (MT cũ) có "-" S → LUAT-34 "Đã huỷ · vắng MT cũ", không vào luồng vắng. */
    if (i === 5) conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(a);
    saveScore(admin, a, 'speaking', i === 5 ? { noShow: true } : { criteria: [b, b, b, b], resultDate: '2026-07-25' });
  });
  const tvvAll = conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?');
  for (const sid of emFt) tvvAll.run(tvvCn.HD[0], sid);

  /* PA Tutor + buổi trong 4 tuần trước ngày demo — một lần ghi Kết quả mỗi tuần mỗi em, lùi `created_at` / `ghi_luc` về ngày buổi. */
  type Buoi = { tutor: string; danhGia: number; khong?: boolean };
  const buoiTutor = (sid: number, topic: string, tuan: [string, Buoi[]][]) => {
    const c = reportIssue(admin, {
      studentId: sid, topic, primaryCode: issuesForTopic(topic, null)[0].code, title: `${topic}: cần luyện thêm với tutor`, ownerUserId: gvLinh,
      detectedAt: '2026-08-14', summary: 'Em sai lặp lại cùng một dạng bài ở MT1 và bài trên lớp, cần tutor kèm riêng.', idempotencyKey: `ux-tutor-${sid}`,
    } as any) as any;
    recordIntervention(admin, c.id, {
      kind: 'tutor', description: 'Tutor kèm 1–2 buổi/tuần', status: 'started', startedDate: '2026-08-17', performerName: 'Tutor part-time', soBuoi: 12,
    } as any);
    const iv = (conn.prepare(`SELECT MAX(id) AS id FROM case_interventions WHERE case_id = ?`).get(c.id) as any).id as number;
    for (const [ngay, ds] of tuan) {
      updateResult(admin, iv, {
        decision: 'keep', outcome: 'partial', observedOn: ngay, note: 'Em theo kịp bài tutor giao, còn chậm ở dạng khó.',
        nguoiDay: { performerName: ds[0].tutor }, soBuoi: ds.length,
        buoi: ds.map((b) => ({
          tutorId: b.tutor === 'Ms Hoa' ? undefined : idTutor(conn, b.tutor), tutor: b.tutor, nhanXet: 'Luyện dạng bài em hay sai, làm lại bài tập về nhà',
          hinhThuc: 'offline', chuanBi: !b.khong, taiLieu: true, feedbackGv: !b.khong, danhGia: b.danhGia,
          ...(b.khong ? { nhanXetTutor: 'Đến muộn, chưa gửi nhận xét cho GV.' } : {}),
        })),
      } as any);
      const f = (conn.prepare('SELECT MAX(id) AS id FROM case_followups WHERE intervention_id = ?').get(iv) as any).id as number;
      conn.prepare('UPDATE case_followups SET created_at = ? WHERE id = ?').run(`${ngay}T10:00:00.000Z`, f);
      conn.prepare('UPDATE case_followup_buoi SET ghi_luc = ? WHERE followup_id = ?').run(`${ngay}T10:00:00.000Z`, f);
    }
    /* Mỗi lần ghi "Giữ nguyên" dời mốc kỳ về ngày ghi; kịch bản ghi bù nhiều tuần cùng lúc → mốc kỳ = ngày PA bắt đầu (không lần ghi nào trước mốc). */
    conn.prepare('UPDATE case_interventions SET cycle_started_on = ? WHERE id = ?').run('2026-08-17', iv);
  };
  buoiTutor(emFt[3], 'listening', [
    ['2026-08-21', [{ tutor: 'Nguyễn Thu Lan', danhGia: 4 }, { tutor: 'Nguyễn Thu Lan', danhGia: 5 }]],
    ['2026-08-28', [{ tutor: 'Phạm Đức Long', danhGia: 4 }]],
    ['2026-09-04', [{ tutor: 'Phạm Đức Long', danhGia: 2, khong: true }]],
    ['2026-09-11', [{ tutor: 'Nguyễn Thu Lan', danhGia: 4 }]],
  ]);
  buoiTutor(emFt[1], 'writing1', [
    ['2026-08-22', [{ tutor: 'Vũ Thanh Hằng', danhGia: 5 }]],
    ['2026-08-29', [{ tutor: 'Lê Lan Hương', danhGia: 4 }]],
    ['2026-09-05', [{ tutor: 'Vũ Thanh Hằng', danhGia: 4 }, { tutor: 'Ms Hoa', danhGia: 3 }]],
  ]);
  buoiTutor(emFt[5], 'reading', [
    ['2026-08-20', [{ tutor: 'Trần Mai Anh', danhGia: 3 }]],
    ['2026-09-03', [{ tutor: 'Hồ Ngọc Lan', danhGia: 4 }]],
    ['2026-09-10', [{ tutor: 'Hồ Ngọc Lan', danhGia: 5 }]],
  ]);

  /* Vi phạm + lần xử lý (GVCN Linh): em 1 xử lý 11/09 (gần đây), em 2 xử lý 03/09 (cũ hơn). */
  /** Vi phạm + lần xử lý do `gvId` lưu ngày `phanHoi` (lúc `luc` giờ UTC) — việc Báo PH (SV-YT-TVV) hạn = ngày lưu + 4. Trả id việc Báo PH. */
  const viPham = (sid: number, ngay: string[], phanHoi: string, gvId = gvLinh, luc = '09:00:00') => {
    const p = loadPrincipal(gvId);   // nạp mỗi lần: phân công lớp thêm sau lần nạp trước
    const ids = ngay.map((d) => (recordViolation(p, { studentId: sid, category: 'homework', description: 'Không làm bài tập về nhà', occurredOn: d }) as any).violation.id as number);
    xacNhanXuLy(p, sid, { violationIds: ids, performedOn: phanHoi, note: 'Đã trao đổi với em' } as any);
    const moc = `${phanHoi}T${luc}.000Z`;
    conn.prepare(`UPDATE violations SET reported_on = occurred_on, created_at = occurred_on || 'T09:00:00.000Z', ghi_nhan_luc = occurred_on, phan_hoi_ngay = ?
                   WHERE id IN (${ids.join(',')})`).run(phanHoi);
    const m = (conn.prepare(`SELECT measure_id AS id FROM measure_violations WHERE violation_id = ?`).get(ids[0]) as any).id as number;
    conn.prepare(`UPDATE discipline_measures SET created_at = ?, confirmed_at = ?, updated_at = NULL WHERE id = ?`).run(moc, moc, m);
    conn.prepare(`UPDATE viec_bao_ph SET han = ?, tao_luc = ? WHERE measure_id = ?`).run(addDays(phanHoi, 4), moc, m);
    return (conn.prepare('SELECT id FROM viec_bao_ph WHERE measure_id = ?').get(m) as any)?.id as number | undefined;
  };
  /** TVV ghi một lần Báo PH, lùi `ghi_luc` về giờ kịch bản. */
  const baoPh = (tvvId: number, viecId: number | undefined, ketQua: 'da_bao' | 'chua_lien_he', ngay: string, luc: string, ghiChu: string) => {
    if (!viecId) return;
    ghiKetQuaBaoPh(loadPrincipal(tvvId), { viecIds: [viecId], ketQua, ngay, ghiChu });
    conn.prepare('UPDATE viec_bao_ph_lan SET ghi_luc = ? WHERE id = (SELECT MAX(id) FROM viec_bao_ph_lan WHERE viec_id = ?)').run(`${ngay}T${luc}.000Z`, viecId);
  };
  viPham(emFt[0], ['2026-09-07', '2026-09-08', '2026-09-09'], '2026-09-11');
  viPham(emFt[2], ['2026-08-31', '2026-09-01', '2026-09-02'], '2026-09-03');   // CỐ Ý: việc Báo PH hạn 07/09 chưa ghi → ca "Báo PH quá hạn" của TVV HD

  // ---------------------------------------------------------------- U6 · HD FOU 06 (lớp thường, Giữa khoá đủ điểm) — ở HD cùng lý do U5
  const kgFou = '2026-08-17';
  const fou = (createClass(admin, {
    code: 'HD FOU 06', branchId: hd, kind: 'FOU', route: null, isFastTrack: false, startDate: kgFou, startPeriodId: ensurePeriod(kgFou).id,
  }) as any).id as number;
  pc.run(gvLinh, fou, null, 1, kgFou, now);
  for (const k of ['listening', 'reading', 'writing', 'speaking']) pc.run(gvLinh, fou, k, 0, kgFou, now);
  const ql = loadPrincipal((conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' AND ur.branch_id = ?`).get(hd) as any).id);
  const diemFou: [string, number[]][] = [
    ['Tôn Bảo Châu', [20, 21, 19, 22]], ['Mẫn Gia Hưng', [22, 19, 20, 21]], ['Ninh Khánh Linh', [19, 20, 21, 20]], ['Doãn Minh Triết', [21, 22, 20, 19]],
    ['Khúc Thảo My', [20, 19, 17, 21]], ['Giang Hải Nam', [16, 20, 19, 20]],
  ];
  const emFou = diemFou.map(([ten, d]) => {
    const sid = them(fou, ten, {});
    planRegularTests(ql, fou, { studentIds: [sid], kinds: ['progress'] });
    const a = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' AND status != 'cancelled' ORDER BY id LIMIT 1`).get(sid) as any)?.id;
    if (a) ['listening', 'reading', 'writing', 'speaking'].forEach((k, j) => saveRegularScore(admin, a, k, { score: d[j], total: 25 }, '2026-09-10'));
    tvvAll.run(tvvCn.HD[0], sid);
    return sid;
  });
  const bao = conn.prepare(`SELECT id FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status = 'pending'`).get(emFou[5]) as any;
  if (bao) confirmCoordination(loadPrincipal(gvLinh), bao.id, { performedOn: '2026-09-11', note: 'Đã gửi việc cho TVV, TVV đã gọi phụ huynh.' });
  /* Lần xử lý vi phạm: em đã Báo PH (Giang Hải Nam — TVV ghi 12/09) và em chưa Báo PH (Khúc Thảo My). */
  baoPh(tvvCn.HD[0], viPham(emFou[5], ['2026-09-08', '2026-09-09', '2026-09-10'], '2026-09-11'), 'da_bao', '2026-09-12', '03:00:00', 'Đã gọi mẹ em, mẹ hứa nhắc em làm bài.');
  viPham(emFou[4], ['2026-09-08', '2026-09-09', '2026-09-10'], '2026-09-12');

  /* T10 + K4 (08 mục 2): GVCN Nam lưu Report 1 của Ngô Hải Yến 10:00 T2 14/09 → việc Báo PH của TVV Hương, hạn 18/09; lần thử 1 "Chưa liên hệ được"
     14/09 15:30. Lý Tuấn Bình: việc Báo PH kế tiếp (chưa ghi). Giờ lưu UTC = giờ VN − 7. */
  const gvNam = (conn.prepare(`SELECT id FROM users WHERE full_name = 'Ngô Bảo Nam'`).get() as any)?.id as number | undefined;
  const tvvHuong = (conn.prepare(`SELECT id FROM users WHERE full_name = 'Nguyễn Thu Hương'`).get() as any)?.id as number | undefined;
  const hvCp = (ten: string) => (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any)?.id as number | undefined;
  const yen = hvCp('Ngô Hải Yến'), binh = hvCp('Lý Tuấn Bình');
  if (gvNam && tvvHuong && yen && binh) {
    baoPh(tvvHuong, viPham(yen, ['2026-09-09', '2026-09-10', '2026-09-11'], DEMO_DATE, gvNam, '03:00:00'), 'chua_lien_he', DEMO_DATE, '08:30:00', 'Gọi mẹ em hai lần không nghe máy.');
    viPham(binh, ['2026-09-09', '2026-09-10', '2026-09-11'], DEMO_DATE, gvNam, '03:10:00');
  }

  // ---------------------------------------------------------------- K3 (08 mục 2) · BC FT 205 MT2 thi 31/08 (W1 SEP) → hạn chấm 09/09, quá hạn 5 ngày
  const w1Sep = ensurePeriod('2026-08-31').id;
  const mt2Bc = (conn.prepare(`SELECT a.id, a.planned_period_id AS cu FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
                                 WHERE c.code = 'BC FT 205' AND a.kind = 'mock' AND a.attempt_no = 2 AND a.status != 'cancelled'`).all() as any[]);
  for (const a of mt2Bc) {
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(w1Sep, a.id);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND planned_period_id = ?').run(w1Sep, a.id, a.cu);
  }

  // ---------------------------------------------------------------- U4 · thi thật
  const cycleCua = (ten: string) => conn.prepare(
    `SELECT c.* FROM learning_cycles c JOIN students s ON s.id = c.student_id WHERE s.full_name = ? AND c.route IS NOT NULL ORDER BY c.id DESC LIMIT 1`,
  ).get(ten) as any;
  const datNgayThi = (cycleId: number, ngay: string) =>
    conn.prepare('UPDATE learning_cycles SET exam_date = ?, exam_month = ?, exam_period_id = ? WHERE id = ?').run(ngay, ngay.slice(0, 7), ensurePeriod(mondayOf(ngay)).id, cycleId);
  const thiThat = (ten: string, ngay: string, nhapLuc: string, d: { l: number; r: number; w: number; s: number }, buoc?: 'ket_thuc' | 'tam_dung') => {
    const c = cycleCua(ten);
    if (!c) return;
    datNgayThi(c.id, ngay);
    datKetQuaThiThat(admin, c.id, { ngayThi: ngay, ...d } as any);
    conn.prepare('UPDATE learning_cycles SET thi_that_nhap_luc = ? WHERE id = ?').run(`${nhapLuc}T09:00:00.000Z`, c.id);
    if (buoc) {
      chonBuocTiep(admin, c.id, { chon: buoc } as any);
      conn.prepare('UPDATE learning_cycles SET buoc_tiep_luc = ? WHERE id = ?').run(`${addDays(nhapLuc, 2)}T09:00:00.000Z`, c.id);
    }
  };
  thiThat('Dương Minh Quân', '2026-08-15', '2026-08-25', { l: 7.5, r: 7.5, w: 6.5, s: 6.5 });   // chưa chốt bước tiếp (việc TVV UB)
  thiThat('Lý Thanh Trúc', '2026-08-15', '2026-08-25', { l: 6.0, r: 6.5, w: 5.5, s: 6.0 }, 'ket_thuc');
  thiThat('Đinh Ngọc Quyên', '2026-09-12', DEMO_DATE, { l: 7.0, r: 7.5, w: 6.5, s: 7.0 });
  const choKq = cycleCua('Phan Hải Anh');
  if (choKq) datNgayThi(choKq.id, '2026-09-05');

  // ---------------------------------------------------------------- U2 · TVV + SĐT phụ huynh
  const dangHoc = conn.prepare(
    `SELECT DISTINCT s.id, s.consultant_user_id AS tvv, b.code AS cn FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE ${HV_DANG_HOC_SQL('s')} ORDER BY b.code, s.id`,
  ).all() as any[];
  const daChua = new Set<string>();
  let soHvTvv = 0;
  dangHoc.forEach((r, i) => {
    const sdt = `09${String(10000000 + r.id * 7919).slice(-8)}`;
    conn.prepare('UPDATE students SET parent_phone = COALESCE(parent_phone, ?) WHERE id = ?').run(sdt, r.id);
    if (r.tvv) { soHvTvv++; return; }
    const ds = tvvCn[r.cn];
    /* Mỗi chi nhánh chừa em đầu tiên chưa có TVV (việc rơi về QL); CP chỉ có TVV Hương với 4 em sẵn có. */
    if (!ds || !daChua.has(r.cn)) { daChua.add(r.cn); return; }
    tvvAll.run(ds[i % ds.length], r.id);
    soHvTvv++;
  });

  // ---------------------------------------------------------------- U7 · không gì sau ngày demo
  conn.prepare('UPDATE notifications SET created_at = ? WHERE created_at > ?').run(now, `${DEMO_DATE}T16:59:59.999Z`);
  const soBuoi = (conn.prepare(`SELECT COUNT(*) AS n FROM case_followup_buoi WHERE ghi_luc BETWEEN '2026-08-17' AND '2026-09-14'`).get() as any).n as number;
  return { tvv: 6, soHvTvv, buoiTutor: soBuoi };
}
