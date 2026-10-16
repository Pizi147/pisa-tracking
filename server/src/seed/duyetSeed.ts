/**
 * DEMO HỘP CHỜ DUYỆT (PR-DUYET, D17 phần DUYET, D15) — chỉ máy dev. Đi qua CHÍNH hàm dịch vụ (đề xuất PA, ghi kết quả, đề xuất sửa,
 * quyết định ở hộp) để thẻ là kết quả của luật. Hai chỗ chỉnh ngày bằng SQL vì ngày demo cố định: (a) hạn duyệt lùi 1 ngày để có
 * thẻ QUÁ HẠN; (f) hạn xác nhận nguyên nhân lùi 2 ngày để Case chờ nguyên nhân thành Báo lên.
 *
 *   (a) GVBM đề xuất PA Tutor, quá hạn 1 ngày → thẻ đỏ   (b) GVBM Phạm Thu Trang Xin ý kiến QL (PA vẫn chạy)
 *   (c) GVCN Trần Ngọc Hà đề xuất sửa target 6.5 → 7.0   (d) QL Nguyễn Khánh Vy tự ghi PA cần duyệt → "tự duyệt được"
 *   (e) Đề xuất PA của em đã kết thúc học → thẻ TỰ ĐÓNG  (f) Báo lên: Case chờ nguyên nhân quá hạn
 *   (g) Yêu cầu của tôi của Hà: một thẻ đã duyệt + một thẻ bị từ chối có lý do
 * Chip Ý thức = 0 tới PR-YT4; Dời lịch lần 2 để PR-MT (đề nghị `pending` có sẵn thì tự có thẻ qua `napYeuCauTuNguonCu`).
 */
import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { commitIntake } from '../classes/intake.ts';
import { recordIntervention, reportIssue, updateResult } from '../cases/cases.ts';
import { reviseTarget } from '../fasttrack/cycles.ts';
import { setStudentStatus } from '../students/students.ts';
import { guiDeXuatSua } from '../duyet/deXuatSua.ts';
import { duyetYeuCau, quetYeuCau, tuChoiYeuCau } from '../duyet/yeuCau.ts';
import { issuesForTopic } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';
import { emailThu } from './emailThu.ts';

export function buildDuyetDemo(ctx: BuildCtx): { the: number } {
  const { conn } = ctx;
  const classId = ctx.classId.get('MB FT 101');
  if (!classId) return { the: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const nguoi = (ten: string): Principal | null => {
    const r = conn.prepare('SELECT id FROM users WHERE full_name = ? ORDER BY id LIMIT 1').get(ten) as any;
    return r ? loadPrincipal(r.id) : null;
  };
  const ha = nguoi('Trần Ngọc Hà');
  const trang = nguoi('Phạm Thu Trang');
  const vy = nguoi('Nguyễn Khánh Vy') ?? admin;
  const truoc = (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n as number;
  /* Case đang mở ở MB FT 101 có người phụ trách, chưa có PA chờ duyệt — lấy lần lượt, không dùng lại. */
  const daDung = new Set<number>();
  const caseMo = (loaiTru: (number | undefined)[] = []) => {
    const r = conn.prepare(
      `SELECT sc.id, sc.owner_user_id, sc.topic FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.class_id = ? AND sc.status != 'done' AND sc.owner_user_id IS NOT NULL AND sc.topic IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.approval_state = 'pending')
        ORDER BY sc.id`).all(classId) as any[];
    const c = r.find((x) => !daDung.has(x.id) && !loaiTru.includes(x.owner_user_id));
    if (c) daDung.add(c.id);
    return c ?? null;
  };
  const deXuat = (p: Principal, caseId: number, moTa: string) => {
    const d = recordIntervention(p, caseId, { kind: 'tutor', description: moTa, status: 'planned', needsApproval: true }) as any;
    return d.interventions[d.interventions.length - 1].id as number;
  };

  // (a) GVBM đề xuất PA Tutor — quá hạn duyệt 1 ngày
  const ca = caseMo([ha?.userId]);
  if (ca) {
    const ivId = deXuat(loadPrincipal(ca.owner_user_id), ca.id, 'Tutor 1-1 hai buổi mỗi tuần đến Mock Test kế tiếp');
    const han = addDays(DEMO_DATE, -1);
    conn.prepare('UPDATE case_interventions SET approval_due = ? WHERE id = ?').run(han, ivId);
    conn.prepare(`UPDATE yeu_cau_duyet SET han_duyet = ? WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ? AND trang_thai = 'cho'`).run(han, ivId);
  }

  // (b) GVBM Trang Xin ý kiến QL — PA đang chạy của Case Trang phụ trách
  if (trang) {
    const ds = conn.prepare(
      `SELECT iv.id, iv.kind, iv.so_buoi FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.owner_user_id = ? AND sc.status != 'done' AND iv.status = 'started' AND COALESCE(iv.approval_state, '') != 'pending'
        ORDER BY iv.id`).all(trang.userId) as any[];
    for (const r of ds) {
      try {
        updateResult(trang, r.id, {
          decision: 'ask_manager', outcome: 'unchanged', observedOn: DEMO_DATE,
          note: 'Em vẫn nghe sót số và tên riêng ở Part 1, dù đã tự học đều.',
          decisionNote: 'Có nên chuyển em sang tutor 1-1 không, hay giữ tự học thêm một tuần?',
          /* OV-12h: PA Tutor (kể cả không có Số buổi) ghi Số buổi kỳ này + dòng buổi — giữ đúng PA được chọn như trước. */
          ...(r.kind === 'tutor' && r.so_buoi == null ? { soBuoi: 1, buoi: [{ tutor: 'Mr Long', nhanXet: 'Nghe số và tên riêng Part 1, vẫn sót 3/10' }] } : {}),
        } as any);
        break;
      } catch { /* PA này chưa ghi được (ví dụ chưa tới tuần) — thử PA kế */ }
    }
  }

  // (c) GVCN Hà đề xuất sửa target 6.5 → 7.0 (M8: Phạm Bảo Ngọc nếu có, không thì em đầu lớp MB FT 101)
  const hvLop = conn.prepare(
    `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       JOIN learning_cycles lc ON lc.student_id = s.id AND lc.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' ORDER BY (s.full_name = 'Phạm Bảo Ngọc') DESC, s.id`).all(classId) as any[];
  if (ha && hvLop.length) {
    const sid = hvLop[0].id as number;
    const cyc = conn.prepare(`SELECT id, target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
    if (cyc.target_score !== 6.5) reviseTarget(admin, cyc.id, { newTarget: 6.5, reason: 'Mục tiêu lúc tư vấn', effectiveFrom: addDays(DEMO_DATE, -30) });
    guiDeXuatSua(ha, sid, { truong: 'target', moi: 7, lyDo: 'PH đăng ký thi 12/2026, cần 7.0 để nộp hồ sơ du học.' });
    // (g) Yêu cầu của tôi của Hà: một đã duyệt, một bị từ chối
    const sid2 = (hvLop[1] ?? hvLop[0]).id as number;
    const ok = guiDeXuatSua(ha, sid2, { truong: 'khac', moi: 'Cập nhật số điện thoại phụ huynh', lyDo: 'PH đổi số, em báo lại trong buổi học hôm qua.' });
    duyetYeuCau(vy, ok.id, { ghiChu: 'Đã cập nhật ở Thông tin học viên' });
    const bo = guiDeXuatSua(ha, sid2, { truong: 'khac', moi: 'Em chuyển lịch học thêm sang tuần sau', lyDo: 'Em xin nghỉ thi đấu thể thao cấp tỉnh tuần đó.' });
    tuChoiYeuCau(vy, bo.id, 'Tuần sau trùng lịch Final của lớp — giữ lịch cũ, em thi bù tuần sau.');
  }

  // (d) QL Vy tự ghi một PA cần duyệt → thẻ "tự duyệt được"
  const cd = caseMo();
  if (cd) deXuat(vy, cd.id, 'Tutor Speaking 4 buổi, ghép nhóm hai em');

  // (e) Đề xuất PA của em đã kết thúc học → Case đóng hệ thống → thẻ tự đóng (D15)
  const lr = conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' LIMIT 1`)
    .get(classId) as any;
  if (lr) {
    const ten = 'Ngô Thanh Tùng';
    commitIntake(admin, { classId, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `duyet-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const gv = loadPrincipal(lr.id);
    const c = reportIssue(gv, { studentId: st.id, topic: 'listening', title: 'Nghe sót chi tiết số', summary: 'Em nghe sót số và tên riêng ở Part 1–2.',
      primaryCode: issuesForTopic('listening')[0].code } as any) as any;
    deXuat(gv, c.id, 'Tutor Listening hai buổi mỗi tuần');
    setStudentStatus(admin, st.id, 'finished', DEMO_DATE, 'Gia đình chuyển em sang cơ sở khác');
  }

  // (f) Case MT cũ bài chưa nhận xét (bộ SOS v3 — Đỗ Minh Khôi · W2) quá hạn 2 ngày → việc "Ghi nhận xét" quá hạn (OV-12c: Case MT không còn thẻ Báo lên nguyên nhân).
  conn.prepare(
    `UPDATE sos_cases SET han_xac_nhan = ? WHERE id IN (
       SELECT sc.id FROM sos_cases sc JOIN students s ON s.id = sc.student_id
        WHERE s.full_name = 'Đỗ Minh Khôi' AND sc.status != 'done'
          AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary'))`,
  ).run(addDays(DEMO_DATE, -2));

  /* Quét một lần để thẻ tự đóng (e) và Báo lên (f) có ngay trong DB demo, không đợi lần mở hộp đầu. */
  quetYeuCau(DEMO_DATE);
  return { the: (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n - truoc };
}
