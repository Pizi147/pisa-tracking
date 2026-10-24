import { capNhatConOChoTatCa } from '../fasttrack/conOCho.ts';
import { buildOv2aDemo } from './ov2aSeed.ts';
import { buildHeadTutor, buildTutorDs } from './tuSeed.ts';
import { buildPetDemo } from './petSeed.ts';
import { buildUxDemo } from './uxSeed.ts';
import crypto from 'node:crypto';
import { db, recreateSchema, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, ENTRY_SKILLS, PROGRAMME_TEMPLATES,
  TUTOR_REPORT_CATEGORIES, programmeOf,
} from '../../../shared/domain/index.ts';
import { addDays, nowIso, padCode } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { ensurePeriod, mondayOf, weekInfo } from '../platform/week.ts';
import { BRANCHES } from './data.ts';
import { napDuLieuNen } from './duLieuNen.ts';
import { CLASSES, DEMO_DATE, TEACHERS } from './journeys.ts';
import { buildJourneys } from './build.ts';
import { buildYThuc } from './yThucSeed.ts';
import { buildKckDemo, buildSosV3Demo } from './sosV3Seed.ts';
import { buildPrMtDemo } from './prMtSeed.ts';
import { buildXlmtDemo } from './xlmtSeed.ts';
import { buildHsmDemo } from './hsmSeed.ts';
import { buildHvlDemo } from './hvlSeed.ts';
import { buildLt2aDemo } from './lt2aSeed.ts';
import { buildLt2bDemo } from './lt2bSeed.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { dienBanChupLop } from '../migrate/prOv6b1.ts';
import { napYeuCauTuNguonCu } from '../migrate/prDuyet.ts';
import { buildDuyetDemo } from './duyetSeed.ts';
import { buildCtDemo } from './ctSeed.ts';
import { buNgayPb2b, buildPb2bDemo } from './pb2bSeed.ts';
import { dienNguocBanChup } from '../migrate/prTk.ts';
import { migratePrOv1c } from '../migrate/prOv1c.ts';
import { migratePrOv11e } from '../migrate/prOv11e.ts';
import { migratePrOv12c } from '../migrate/prOv12c.ts';
import { migratePrOv12a } from '../migrate/prOv12a.ts';
import { ganChuCaseThieu } from '../cases/owner.ts';
import { MOC_LICH_SU } from '../migrate/prOv15g.ts';

const NOW = nowIso();

export function runSeed() {
  recreateSchema();
  const conn = db();

  return tx(() => {
    // ---------------------------------------------------------------- tổ chức
    const branchId = new Map<string, number>();
    for (const b of BRANCHES) {
      const info = conn.prepare('INSERT INTO branches (code, name, status, created_at) VALUES (?,?,?,?)')
        .run(b.code, b.name, 'active', NOW);
      branchId.set(b.code, Number(info.lastInsertRowid));
    }

    // Đơn vị báo cáo = 5 chi nhánh + Tutor part-time. Tutor KHÔNG phải chi nhánh thứ sáu.
    let seq = 0;
    for (const b of BRANCHES) {
      conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
        .run(b.code, b.name, branchId.get(b.code)!, 'branch', seq++, 'active');
    }
    conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
      .run('TUTOR', 'Tutor part-time', null, 'department', seq++, 'active');

    // ---------------------------------------------------------------- vai trò & quyền, lộ trình, chương trình học
    /* Dữ liệu nền dùng chung với `init-ban-chinh` (PR-Z2) — chuyển nguyên văn sang `seed/duLieuNen.ts`. */
    const { roleId } = napDuLieuNen(conn, NOW);

    // ---------------------------------------------------------------- người dùng
    let userSeq = 0;
    /*
     * MỌI TÀI KHOẢN DEMO ĐỀU ĐĂNG NHẬP ĐƯỢC THẬT.
     *
     * Email suy từ tên, đúng quy ước `ten.pisa@gmail.com` owner chốt ở mục 7.1. Mật khẩu
     * chung một chuỗi và ghi rõ ở README lẫn màn đăng nhập — bản demo nội bộ mà mỗi tài khoản
     * một mật khẩu riêng thì không ai thử được vai nào ngoài vai của mình.
     *
     * Có mật khẩu thật ngay ở dữ liệu mẫu là điều kiện để thử ĐÚNG luồng đăng nhập, chứ không
     * chỉ thử nút "Đổi tài khoản demo".
     */
    const usedEmails = new Set<string>();
    const emailFor = (name: string) => {
      const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd').toLowerCase().split(/\s+/).filter(Boolean);
      const stem = (base[base.length - 1] ?? 'gv') + (base[0] ? `.${base[0]}` : '');
      let local = stem.replace(/[^a-z0-9.]/g, '');
      let n = 1;
      while (usedEmails.has(local)) { n += 1; local = `${stem.replace(/[^a-z0-9.]/g, '')}${n}`; }
      usedEmails.add(local);
      return `${local}${EMAIL_SUFFIX}`;
    };
    const addUser = (name: string, title: string, email?: string) => {
      userSeq += 1;
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
      const info = conn
        .prepare(
          `INSERT INTO users (code, full_name, email, title, password_hash, password_salt,
                              approval_state, status, created_at)
           VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`,
        )
        .run(padCode('NV', userSeq, 3), name, email ?? emailFor(name), title, hash, salt, NOW);
      return Number(info.lastInsertRowid);
    };
    const grant = (userId: number, role: string, branch: string | null) =>
      conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)')
        .run(userId, roleId.get(role)!, branch ? branchId.get(branch)! : null, 'active', NOW);


    /* Tài khoản Quản trị hệ thống MẶC ĐỊNH của owner, đúng địa chỉ owner chỉ định (mục 7.1). */
    const adminId = addUser('Đỗ Vũ Tuấn Phong', 'Quản trị hệ thống', DEFAULT_ADMIN_EMAIL);
    grant(adminId, 'system_admin', null);

    /*
     * BỘ MÃ NGƯỜI DÙNG dùng chung với kịch bản hành trình.
     *
     *   T_*    giáo viên      MGR_*  Quản lý chi nhánh
     *
     * Kịch bản trong `students.ts` gọi người bằng những mã này, nên đổi một cái tên chỉ cần
     * sửa đúng một chỗ và mọi hành trình vẫn trỏ đúng người.
     *
     * KHÔNG CÒN MÃ `ADM_*`. Vai Admin chi nhánh đã bỏ sau PR15; những việc trước đây ghi
     * tên văn phòng nay ghi tên Quản lý chi nhánh, vì đó mới là người quyết định thật.
     */
    const userId = new Map<string, number>();
    const managers = new Map<string, number[]>();

    const MANAGER_NAME: Record<string, string> = {
      MB: 'Nguyễn Khánh Vy', BC: 'Trần Hải Đăng', CP: 'Lê Ngọc Mai',
      HD: 'Phạm Quang Anh', UB: 'Hoàng Thanh Bình',
    };

    for (const b of BRANCHES) {

      const m = addUser(MANAGER_NAME[b.code], `Quản lý ${b.name}`);
      grant(m, 'manager', b.code);
      managers.set(b.code, [m]);
      userId.set(`MGR_${b.code}`, m);
    }

    /*
     * CHÍN GIÁO VIÊN CHO CẢ TRUNG TÂM, và hai người trong số đó dạy ở HAI chi nhánh.
     *
     * Người dạy hai nơi nhận quyền ở CẢ HAI chi nhánh, nhưng số liệu của họ ở mỗi nơi phải
     * đứng riêng — đó chính là chỗ bảng "Theo giáo viên" phải chứng minh là mình đếm đúng.
     */
    for (const t of TEACHERS) {
      const id = addUser(t.name, 'Giáo viên');
      for (const b of t.branches) grant(id, 'teacher', b);
      userId.set(t.code, id);
    }

    // ---------------------------------------------------------------- kỳ báo cáo
    /*
     * Đủ tuần từ lớp mở sớm nhất (12/2025) tới ba tháng sau ngày demo. Lịch sử dài chín
     * tháng cần đủ tuần để mọi mốc cũ có chỗ đứng.
     */
    let cursor = mondayOf('2025-12-01');
    const lastWeek = mondayOf(addDays(DEMO_DATE, 140));
    while (cursor <= lastWeek) {
      ensurePeriod(cursor);
      cursor = addDays(cursor, 7);
    }
    const currentPeriod = ensurePeriod(DEMO_DATE);

    // ---------------------------------------------------------------- lớp & phân công
    const classId = new Map<string, number>();
    const classBranch = new Map<string, string>();
    for (const c of CLASSES) {
      /*
       * `kind` giữ nguyên chữ người dùng gõ (kể cả mã cũ "FOUND"); `programme_code` là mã đã
       * chuẩn hoá mà mọi tính toán đọc vào. KHÔNG đổi mã lớp lịch sử chỉ vì phần mềm muốn
       * chuẩn hoá — tên lớp là thứ của trung tâm, không phải của phần mềm.
       */
      const programme = programmeOf(c.kind);
      const info = conn
        .prepare(
          `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                                start_period_id, status, finished_at, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(c.code, branchId.get(c.branch)!, c.kind, programme, c.route, c.isFastTrack ? 1 : 0,
             c.startDate, ensurePeriod(c.startDate).id,
             c.status, c.finishedAt ?? null, c.note ?? null, NOW);
      const id = Number(info.lastInsertRowid);
      classId.set(c.code, id);
      classBranch.set(c.code, c.branch);

      const skills = programme ? PROGRAMME_TEMPLATES[programme as keyof typeof PROGRAMME_TEMPLATES].skills : ENTRY_SKILLS;
      for (const skill of skills) {
        conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,?)')
          .run(id, skill, skill === 'writing1' || skill === 'writing2' ? 1 : 2);
      }

      /*
       * PHÂN CÔNG VIẾT THẲNG TRONG KỊCH BẢN, không bốc theo thứ tự.
       *
       * Nhờ vậy "cô Hà dạy Listening và Reading ở lớp 101" là một sự thật cố định, và mọi
       * câu chuyện trong `students.ts` gọi đúng tên người đó mà không sợ lệch.
       */
      const assign = (uidNum: number, skill: string | null, isCore: boolean) =>
        conn
          .prepare(
            `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
             VALUES (?,?,?,?,?,?,?)`,
          )
          .run(uidNum, id, skill, isCore ? 1 : 0, c.startDate, 'active', NOW);

      for (const [skill, code] of Object.entries(c.teachers)) {
        const t = userId.get(code);
        if (t) assign(t, skill, false);
      }
      /* GVCN phải dạy ít nhất một kỹ năng ở chính lớp đó — luật ở `classes.ts`. */
      if (c.core && userId.has(c.core) && Object.values(c.teachers).includes(c.core)) {
        assign(userId.get(c.core)!, null, true);
      }
    }
    dienBanChupLop(conn);   // PF1 + OV-6b1: chụp số tuần, tuần MT, ngưỡng đạt vào lớp — seed không chạy migrate()
    /* PR-S5F-b: "Phụ trách được" (hồ sơ GV) đọc `user_skills` — GV demo khai đúng các kỹ năng đang được phân công.
       OV-11b (QT-10j): chỉ 5 ô MH1 (L R W1 W2 S) — mã ô lớp thường (`writing`, `tong_hop`…) không phải năng lực của người. */
    conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) SELECT DISTINCT user_id, skill FROM teacher_assignments
      WHERE skill IN ('listening', 'reading', 'writing1', 'writing2', 'speaking')`).run();

    // ---------------------------------------------------------------- học viên & hành trình
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 1)').run();
    const nextStudentCode = () => {
      const row = conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any;
      conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
      return padCode('PISA', row.next_value);
    };

    const studentIdByCode = new Map<string, number>();
    const counts = buildJourneys({
      conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode,
    });

    // ---------------------------------------------------------------- công việc quản lý
    const tasks = seedMeeting(conn, {
      branchId, managers, adminId, userId, currentPeriodId: currentPeriod.id,
    });

    setConfig('demo_date', DEMO_DATE);
    setConfig('scenario_mode', 'normal');
    setConfig('seeded_at', NOW);

    /*
     * BỘ DEMO RULEBOOK v3 (PR-T T8) — DỰNG SAU KHI ĐÃ ĐẶT NGÀY DEMO: nó đi qua chính các hàm nghiệp vụ (nhập điểm → SOS tự tạo Case + Phối hợp), mà mọi
     * hạn/ngày trong đó đọc `demoToday()`. Chỉ cho máy dev; bản chính dùng dữ liệu rỗng.
     */
    const sosV3 = buildSosV3Demo({
      conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode,
    });
    /* BỘ DEMO PR-MT (D1–D6, D16): lớp RF, HS cũ có MT lịch sử, dời do vắng, huỷ lượt — cũng qua hàm nghiệp vụ, sau ngày demo. */
    buildPrMtDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-XLMT (X1–X4): xếp lịch MT nhiều lớp, chờ duyệt, huỷ phần còn lại, MT lịch sử tuần đã qua, ⋯ ô lớp thường. */
    buildXlmtDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-HVL (H1–H2): Cần hỗ trợ theo kỹ năng (hai Case cùng Reading, Case chung, chờ duyệt), lớp FOU có Case G+V / P và bài Cuối khoá 58%. */
    buildHvlDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-KCK (Q29-1): hai em Target KCK — có MT, có điểm dưới band mà không SOS. */
    buildKckDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-HSM (H1–H2): nhận xét W/S + GV chấm Speaking (tài khoản và người ngoài) — qua `saveScore`. */
    buildHsmDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-LT2a (G1–G6): Giữa khoá lớp thường — Case tự tạo, PA bổ trợ chạy ngay khi Xác nhận Case (PR-CT2), Báo PH qua TVV. TRƯỚC `buildDuyetDemo` (quét Báo lên). */
    buildLt2aDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* BỘ DEMO PR-LT2b (D10–D13): Cuối khoá lớp thường — bốn dải, Mini Test, Pre FOU → FOU, kỳ vọng đầu ra lên FT. SAU bộ LT2a, TRƯỚC `buildDuyetDemo` (quét Báo lên). */
    buildLt2bDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /*
     * Ý THỨC v4 (PR-YT4, D14/D15/H5): SAU ngày demo (đề xuất QL duyệt đi qua hàm dịch vụ đọc `demoToday()`), TRƯỚC `buildDuyetDemo`
     * (lần `quetYeuCau` của nó sinh thẻ Báo lên Ý thức).
     */
    const yThuc = buildYThuc({
      conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode,
    });

    /*
     * S16 (chốt 21/09 đêm): em đã KẾT THÚC học mà còn Case mở → hệ thống tự đóng "Học viên kết thúc khoá". Bộ demo dựng hành trình
     * thẳng bằng SQL (không qua `setStudentStatus`), nên áp luật ở đây — nếu không bộ demo nói ngược luật (Tổng quan 29 / Thực trạng 28).
     * Đặt SAU mọi bước dựng Case (kể cả bộ demo rulebook v3) để không bước nào để lại Case mở cho em đã kết thúc.
     */
    for (const s of conn.prepare(`SELECT id, finished_at FROM students WHERE status = 'finished'`).all() as any[]) {
      closeCasesBySystem({ actorUserId: null, studentId: s.id, reason: 'course_ended', on: s.finished_at ?? DEMO_DATE });
    }
    /* PR-DUYET: PA chờ duyệt / đề nghị dời dựng thẳng bằng SQL ở trên cũng có thẻ ở hộp Chờ duyệt (seed không chạy migrate()). */
    napYeuCauTuNguonCu(conn);
    /* TU-a: danh sách tutor TRƯỚC các bộ demo ghi kết quả PA Tutor (duyệt, pb2b) — buổi trỏ được tutor. */
    buildTutorDs(conn, adminId);
    /* PR-DUYET (D17): mỗi phân loại có thẻ, có quá hạn, tự duyệt, tự đóng, Báo lên — dựng qua hàm dịch vụ. */
    const duyet = buildDuyetDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* PR-CT: lệnh chuyển lớp + bàn giao (6 kịch bản + 1 lệnh đã chuyển) — SAU bộ demo Chờ duyệt, tự quét Báo lên ở cuối. */
    const ct = buildCtDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* PR-Pb2-b (D18): bảng Phân tích giáo viên — 5 GV mới, MB FT 105, MB FOU 14 / 16 hai giáo viên. SAU bộ PR-CT, TRƯỚC phần bù ngày. */
    buildPb2bDemo({ conn, adminId, branchId, classId, userId, classBranch, nextStudentCode, studentIdByCode });
    /* PR-TK: bộ demo dựng lộ trình đã đóng bằng SQL thẳng — điền ngược bản chụp (cùng hàm với migrate). Đứng SAU mọi bộ demo. */
    dienNguocBanChup(conn);
    /* OV-1c: Case dựng bằng SQL thẳng theo luật cũ → đúng luật chốt / xoá SOS (cùng hàm với migrate; seed không chạy migrate()). */
    migratePrOv1c(conn, []);
    /* PR-Pb2-b: bù ngày nhập đầu ô điểm + hạn xử lý chốt / ngày phản hồi vi phạm cho dữ liệu dựng bằng SQL. LUÔN CUỐI. */
    buNgayPb2b(conn);
    /* PR-OV2a: tài khoản Admin · TVV · CX + em của TVV — CUỐI CÙNG để id người dùng cũ không đổi. */
    const ov2a = buildOv2aDemo(conn);
    /* OV-6b2: lớp MB PET 01 (3 em, Checkpoint 1 một Đạt · một SOS) — sau OV-2a để id học viên / người dùng cũ không đổi. */
    const pet = buildPetDemo(conn, { adminId, mbId: branchId.get('MB')!, userId });
    /* TU-a: tài khoản Head tutor + một kết luận "Ngừng hợp tác" — sau PET để id người dùng / học viên cũ không đổi. */
    buildHeadTutor(conn);
    /* SEED-UX: TVV / Admin VP / GV S không lớp, gán TVV + SĐT PH, thi thật, buổi tutor, lớp HD FT 306 + HD FOU 06 — sau Head tutor để id cũ không đổi. */
    const ux = buildUxDemo(conn, adminId);
    buNgayPb2b(conn);   // ô điểm / vi phạm bộ UX: bù ngày nhập đầu + hạn xử lý (chỉ điền ô NULL)
    /* OV-11e (Q8): lượt MT đã chốt dựng bằng SQL thẳng chưa có dấu KCK theo lượt — chụp theo cờ hiện tại (cùng hàm với migrate). Sau mọi bộ demo. */
    migratePrOv11e(conn, []);
    /* OV-12a: PA dựng bằng SQL thẳng với hạn kiểu cũ (Thứ Hai hằng tuần) → lịch kỳ hai tuần, hết Thứ Ba (cùng hàm với migrate; seed → migrate không đổi gì). */
    migratePrOv12a(conn, []);
    /* OV-12c: Case dựng bằng SQL thẳng theo luật cũ → nguyên nhân MT từ nhận xét, nhãn SOS Progress (cùng hàm với migrate). */
    migratePrOv12c(conn, []);
    /* CV-LOI: Case dựng thẳng SQL không khai người phụ trách → gán theo luật tạo Case (cùng hàm với migrate; migrate chạy một lần — khoá
       `napDuLieuNen` đã đặt — nên seed gọi thẳng bước gán). */
    ganChuCaseThieu({ actorId: null, luc: NOW });

    capNhatConOChoTatCa();   // TD7b: dữ liệu mẫu ghi thẳng SQL — tính cờ "còn ô chờ điểm" một lần cho mọi lượt
    conn.prepare('UPDATE demo_config SET value = ?, updated_at = ? WHERE key = ?').run(nowIso(), nowIso(), MOC_LICH_SU);   // OV-15g: bộ demo dựng thẳng SQL không có lịch sử — mốc SAU mọi dữ liệu mẫu
    return {
      'Chi nhánh': BRANCHES.length,
      'Thẻ Chờ duyệt (demo)': duyet.the,
      'Quyết định chuyển lớp (demo PR-CT)': ct.lenh,
      'Lớp': CLASSES.length,
      'Người dùng': userSeq,
      'Giáo viên': TEACHERS.length,
      'Học viên của TVV demo (PR-OV2a)': ov2a.soHv,
      'Học viên lớp PET demo (OV-6b2)': pet.soHv,
      'Bộ UX (SEED-UX) — HV có TVV · buổi tutor 4 tuần': `${ux.soHvTvv} · ${ux.buoiTutor}`,
      'Học viên': counts.students,
      'Lộ trình': counts.cycles,
      'Lượt đánh giá': counts.attempts,
      'Ô điểm': counts.scores,
      'Kỹ năng ngoài phạm vi': counts.skips,
      /*
       * TÍN HIỆU ĐẾM RIÊNG, KHÔNG GỘP VÀO CASE (mục 6.2). Một tín hiệu chưa ai xác minh
       * không phải một vấn đề đã được xác định; cộng chung là nói quá số việc đang có.
       */
      'Case chờ xác nhận nguyên nhân': (conn.prepare('SELECT COUNT(*) AS n FROM case_signals').get() as any).n,
      /*
       * ĐẾM TỪ CHÍNH DATABASE, không cộng dồn trong lúc dựng.
       *
       * Case sinh tự động qua engine chứ không qua kịch bản, nên bộ đếm nội bộ không biết tới
       * chúng — và một bản tóm tắt nói ít hơn sự thật thì tệ hơn là không có.
       */
      'Case': (conn.prepare('SELECT COUNT(*) AS n FROM sos_cases').get() as any).n,
      'Vi phạm': yThuc.violations,
      '— trong đó đã xoá (có dòng audit)': yThuc.deleted,
      'Lần xử lý Ý thức': yThuc.measures,
      '— trong đó xử lý theo thang (đã xong)': yThuc.done,
      '— trong đó đề xuất QL duyệt': yThuc.deXuat,
      'Khai bậc Ý thức (H5)': yThuc.khai,
      '— trong đó demo rulebook v3 (SOS tự tạo Case)': sosV3.cases,
      'Việc Phối hợp SOS': (conn.prepare('SELECT COUNT(*) AS n FROM sos_coordination_actions').get() as any).n,
      'Phương án': (conn.prepare('SELECT COUNT(*) AS n FROM case_interventions').get() as any).n,
      'Lần cập nhật kết quả': (conn.prepare('SELECT COUNT(*) AS n FROM case_followups').get() as any).n,
      'Mốc Case': (conn.prepare('SELECT COUNT(*) AS n FROM case_milestones').get() as any).n,
      'Tuần trong lịch': (conn.prepare('SELECT COUNT(*) AS n FROM report_periods').get() as any).n,
      'Công việc quản lý': tasks,
      'Ngày demo': DEMO_DATE,
    };
  });
}

export { weekInfo };

/**
 * BÁO CÁO TUẦN VÀ CÔNG VIỆC QUẢN LÝ.
 *
 * Hai thứ khác nhau nằm chung một hàm vì chúng dùng chung bộ đơn vị báo cáo:
 *
 *   BÁO CÁO TUẦN    mỗi đơn vị một ô tình trạng cho từng hạng mục, theo tuần.
 *   CÔNG VIỆC       việc vận hành của Quản lý — có nhóm, có việc con, có lịch sử cập nhật.
 */
function seedMeeting(conn: any, ctx: {
  branchId: Map<string, number>; managers: Map<string, number[]>; adminId: number;
  userId: Map<string, number>; currentPeriodId: number;
}) {
  const { branchId, adminId, userId, currentPeriodId } = ctx;
  const units = conn.prepare('SELECT * FROM reporting_units ORDER BY seq').all() as any[];
  const prev = conn
    .prepare('SELECT * FROM report_periods WHERE id < ? ORDER BY id DESC LIMIT 1')
    .get(currentPeriodId) as any;

  const NOTES: Record<string, string[]> = {
    ok: ['Không có vấn đề nổi bật trong tuần.', 'Lịch dạy chạy đúng kế hoạch.'],
    watch: ['Hai lớp thiếu giáo viên dự phòng khi có giáo viên nghỉ.', 'Một số học viên nghỉ nhiều, đã liên hệ phụ huynh.'],
    problem: ['Giáo trình Writing bản mới thiếu đáp án, cần in bổ sung.', 'Ba học viên chưa nộp bài Speaking hai tuần liền.'],
  };

  const cellsOf = (u: any) => (u.kind === 'branch' ? BRANCH_REPORT_CATEGORIES : TUTOR_REPORT_CATEGORIES);
  /*
   * NGÀY BÁO CÁO PHẢI LÀ NGÀY CỦA BỘ DEMO, không phải đồng hồ thật của máy.
   *
   * Ô báo cáo hiện "Người báo cáo: … · ngày". Lấy `nowIso()` thì bộ demo chạy ngày 14/09 lại
   * hiện một nhận định đề ngày 17/09 — một việc đã xảy ra ở tương lai, đúng thứ mục 18.2 cấm.
   * Nên ngày báo cáo là ngày CUỐI TUẦN đó, và không bao giờ vượt quá ngày demo.
   */
  const reportedAt = (periodId: number) => {
    const p = conn.prepare('SELECT week_end FROM report_periods WHERE id = ?').get(periodId) as any;
    const day = !p?.week_end || p.week_end > DEMO_DATE ? DEMO_DATE : p.week_end;
    return `${day}T09:00:00.000Z`;
  };
  const save = (
    unit: any, periodId: number, key: string, label: string, status: string | null, note: string | null,
    by: number, submittedAt: string | null, submittedBy: number | null,
  ) =>
    conn
      .prepare(
        `INSERT INTO unit_reports (period_id, reporting_unit_id, category_key, category_label,
                                   status, note, reporter_user_id, updated_at, submitted_at, submitted_by)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(periodId, unit.id, key, label, status, note, by, reportedAt(periodId), submittedAt, submittedBy);

  units.forEach((u, ui) => {
    const reporter = u.branch_id
      ? (ctx.managers.get([...branchId.entries()].find(([, id]) => id === u.branch_id)?.[0] ?? '')?.[0] ?? adminId)
      : adminId;
    /* Kỳ trước: báo cáo đầy đủ và ĐÃ NỘP, để so với kỳ hiện tại còn ô "Chưa báo cáo"/"Nháp". */
    if (prev) {
      cellsOf(u).forEach((cat, ci) => {
        const status = ci === 2 && ui % 2 === 0 ? 'problem' : ci === 1 ? 'watch' : 'ok';
        save(u, prev.id, cat.key, cat.label, status, NOTES[status][ci % 2], reporter, reportedAt(prev.id), reporter);
      });
    }
    /*
     * Kỳ hiện tại (Q12, phương án A): đơn vị đầu tiên bỏ TRỐNG hẳn (Chưa báo cáo); các đơn vị
     * còn lại vẫn để trống một ô như trước (Chưa báo cáo ở mức ô) — trong hai ô còn lại, đơn vị
     * lẻ đã NỘP cả hai (Đã nộp), đơn vị chẵn chỉ lưu NHÁP (Nháp · chưa nộp, có mức nhưng
     * submitted_at NULL — không được tự nộp giùm).
     */
    if (ui === 0) return;
    const submitted = ui % 2 === 1;
    cellsOf(u).forEach((cat, ci) => {
      if ((ui + ci) % 3 === 0) return;
      const status = (ui + ci) % 4 === 1 ? 'problem' : (ui + ci) % 4 === 2 ? 'watch' : 'ok';
      save(u, currentPeriodId, cat.key, cat.label, status, NOTES[status][ci % 2], reporter,
           submitted ? reportedAt(currentPeriodId) : null, submitted ? reporter : null);
    });
  });

  // ================================================================== công việc quản lý
  /*
   * TÁM CÔNG VIỆC CHÍNH, đủ bốn nhóm và trải trên nhiều chi nhánh (mục 11.5).
   *
   * Bộ này cố tình nhỏ nhưng phủ hết những gì bảng Tiến độ công việc phải chứng minh:
   * việc mới chưa bắt đầu · việc chạy qua ba tuần vẫn một định danh · việc tạm ngưng có lý do ·
   * việc từng tạm ngưng rồi tiếp tục · việc dừng hẳn có lý do · việc hoàn thành có kết quả ·
   * việc con quá hạn trong khi việc cha chưa tới hạn · người theo dõi khác người phụ trách ·
   * việc gắn Case làm căn cứ mà KHÔNG tự tạo phương án và KHÔNG tự đóng Case nào.
   */
  let n = 0;
  const unitOf = (code: string) => units.find((u) => u.code === code);
  const prevId = prev?.id ?? currentPeriodId;

  const addTask = (t: {
    title: string; unit?: any; branch?: string | null; assignee: string; due: string | null;
    progress: string; type: string; periodId: number | null; note?: string | null;
    completedAt?: string | null;
    group: string; parentId?: number | null; watcher?: string | null;
    stopReason?: string | null; reviewOn?: string | null;
    helpUser?: string | null; helpName?: string | null;
    updates?: { progress: string; note?: string | null; on: string; by?: string }[];
    cases?: number[];
  }): number => {
    n += 1;
    const id = Number(
      conn
        .prepare(
          `INSERT INTO tasks (code, period_id, task_type, title, reporting_unit_id, branch_id, assignee_user_id,
                              due_date, progress, note, source_type, created_by, created_at, completed_at,
                              group_key, parent_task_id, watcher_user_id, stop_reason, review_on,
                              help_user_id, help_name)
           VALUES (?,?,?,?,?,?,?,?,?,?, 'manual', ?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(padCode('CV', n, 4), t.periodId, t.type, t.title, t.unit?.id ?? null,
             t.branch ? branchId.get(t.branch)! : null, userId.get(t.assignee) ?? adminId,
             t.due, t.progress, t.note ?? null, adminId, NOW, t.completedAt ?? null,
             t.group, t.parentId ?? null, t.watcher ? userId.get(t.watcher) ?? null : null,
             t.stopReason ?? null, t.reviewOn ?? null,
             t.helpUser ? userId.get(t.helpUser) ?? null : null, t.helpName ?? null).lastInsertRowid,
    );
    for (const u of t.updates ?? []) {
      conn
        .prepare(
          `INSERT INTO task_updates (task_id, period_id, progress, note, actor_user_id, updated_on, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(id, t.periodId, u.progress, u.note ?? null,
             userId.get(u.by ?? t.assignee) ?? adminId, u.on, NOW);
    }
    for (const cid of t.cases ?? []) {
      conn.prepare('INSERT OR IGNORE INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)')
        .run(id, cid, NOW);
    }
    return id;
  };

  /* ── 1. Giáo trình: việc CHA chia bốn việc con theo kỹ năng, người và hạn khác nhau ── */
  const curriculum = addTask({
    title: 'Xây dựng giáo trình Beginner bản 2027', unit: unitOf('HD'), branch: 'HD',
    /*
     * NGƯỜI LÀM khác NGƯỜI THEO DÕI. Giáo viên biên soạn là người làm; Quản lý chi nhánh
     * theo dõi để biết việc còn kịp hạn không. Hai vai này phải tách được trên màn hình,
     * nếu không thì không ai biết hỏi ai khi việc chậm.
     */
    assignee: 'T_YEN', due: '2026-10-30', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'curriculum', watcher: 'MGR_HD',
    updates: [
      { progress: 'not_started', note: 'Đã chốt khung bốn kỹ năng và số buổi.', on: '2026-08-24' },
      { progress: 'doing', note: 'Listening và Reading xong bản nháp, đang soát.', on: '2026-08-31' },
      { progress: 'doing', note: 'Writing chậm vì thiếu đề mẫu, đã nhờ tutor hỗ trợ.', on: '2026-09-07' },
    ],
  });
  addTask({
    title: 'Giáo trình BE — Listening', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_YEN', due: '2026-09-11', progress: 'done', type: 'long_term',
    periodId: prevId, group: 'curriculum', parentId: curriculum,
    completedAt: '2026-09-10T10:00:00.000Z',
    updates: [{ progress: 'done', note: '10 bài nghe kèm transcript, đã gửi Quản lý duyệt.', on: '2026-09-10' }],
  });
  addTask({
    title: 'Giáo trình BE — Reading', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_YEN', due: '2026-09-18', progress: 'doing', type: 'long_term',
    periodId: currentPeriodId, group: 'curriculum', parentId: curriculum,
    updates: [{ progress: 'doing', note: 'Xong 6/10 bài.', on: '2026-09-11' }],
  });
  /* VIỆC CON QUÁ HẠN trong khi việc CHA còn hạn tới 30/10 — hai mốc độc lập với nhau. */
  addTask({
    title: 'Giáo trình BE — Writing', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_DUNG', due: '2026-09-04', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'curriculum', parentId: curriculum,
    updates: [{ progress: 'doing', note: 'Thiếu đề mẫu Task 1, đang nhờ tutor soạn thêm.', on: '2026-09-04' }],
  });
  addTask({
    title: 'Giáo trình BE — Speaking', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_DUNG', due: '2026-09-25', progress: 'not_started', type: 'long_term',
    periodId: currentPeriodId, group: 'curriculum', parentId: curriculum,
  });

  /* ── 2. Việc MỚI, chưa ai bắt đầu ── */
  addTask({
    title: 'Chuẩn bị bộ đề Progress Test cho lớp Elementary khoá tới',
    unit: unitOf('BC'), branch: 'BC', assignee: 'MGR_BC', due: '2026-10-09',
    progress: 'not_started', type: 'in_period', periodId: currentPeriodId, group: 'curriculum',
  });

  /* ── 3. Việc chạy qua BA TUẦN, vẫn MỘT định danh, không nhân bản theo tuần ── */
  /* VIỆC ĐÃ DỜI HẠN: hạn gốc 11/09, dời sang 18/09, có lý do — cột Hạn phải hiện "đã dời từ 11/09". */
  const callParents = addTask({
    title: 'Gọi phụ huynh xác nhận danh sách thi thật tháng 11',
    unit: unitOf('CP'), branch: 'CP', assignee: 'MGR_CP', due: '2026-09-18',
    progress: 'doing', type: 'in_period', periodId: currentPeriodId, group: 'student_parent',
    updates: [
      { progress: 'not_started', note: 'Đã lọc được 18 em đủ điều kiện đăng ký.', on: '2026-08-31' },
      { progress: 'doing', note: 'Gọi được 9/18 phụ huynh, 2 em xin lùi sang tháng 12.', on: '2026-09-07' },
      { progress: 'doing', note: 'Gọi thêm 3 em. Còn 6 em chưa liên lạc được.', on: '2026-09-11' },
    ],
  });
  conn.prepare(
    `INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at)
     VALUES (?, 'due_date', '2026-09-11', '2026-09-18', 'Còn nhiều phụ huynh chưa liên lạc được, xin thêm một tuần.', ?, ?)`,
  ).run(callParents, userId.get('MGR_CP') ?? adminId, '2026-09-11T09:00:00.000Z');

  /* ── 4. Việc TẠM NGƯNG có lý do và có ngày xem lại ── */
  addTask({
    title: 'Đổi phần mềm chấm Speaking', unit: unitOf('MB'), branch: 'MB',
    assignee: 'MGR_MB', due: '2026-09-11', progress: 'paused', type: 'in_period',
    periodId: prevId, group: 'teacher',
    stopReason: 'Chờ báo giá nhà cung cấp, dự kiến có trong tháng 10.', reviewOn: '2026-10-05',
    helpName: 'Tổ chuyên môn',
    updates: [
      { progress: 'doing', note: 'Đã thử hai phần mềm, cả hai đều thiếu phần chấm theo tiêu chí.', on: '2026-09-04' },
      { progress: 'paused', note: 'Chờ báo giá nhà cung cấp, dự kiến có trong tháng 10.', on: '2026-09-11' },
    ],
  });
  /* Việc TẠM NGƯNG đã TỚI/QUA ngày xem lại — rơi vào hàng số "Cần quyết định" (Q8), người cần hỗ trợ là một tài khoản. */
  addTask({
    title: 'Xin ngân sách in giáo trình Writing bản mới', unit: unitOf('CP'), branch: 'CP',
    assignee: 'MGR_CP', due: '2026-09-20', progress: 'paused', type: 'in_period',
    periodId: currentPeriodId, group: 'curriculum',
    stopReason: 'Chờ duyệt ngân sách từ kế toán.', reviewOn: '2026-09-11',
    helpUser: 'MGR_MB',
    updates: [
      { progress: 'doing', note: 'Đã gửi báo giá in cho kế toán.', on: '2026-09-07' },
      { progress: 'paused', note: 'Chờ duyệt ngân sách từ kế toán.', on: '2026-09-09' },
    ],
  });

  /* ── 5. Việc TỪNG TẠM NGƯNG rồi TIẾP TỤC — cùng một định danh, lịch sử giữ đủ cả hai chặng ── */
  addTask({
    title: 'Chuẩn hoá quy trình bàn giao lớp giữa các ca', unit: unitOf('UB'), branch: 'UB',
    assignee: 'T_KIEN', due: '2026-11-30', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'teacher', watcher: 'MGR_UB',
    updates: [
      { progress: 'doing', note: 'Viết xong bản nháp quy trình bốn bước.', on: '2026-07-20' },
      { progress: 'paused', note: 'Tạm ngưng vì đang vào mùa thi, giáo viên không họp được.', on: '2026-08-03' },
      { progress: 'doing', note: 'Qua mùa thi, họp lại và bắt đầu thử ở hai lớp.', on: '2026-09-07' },
    ],
  });

  /* ── 6. Việc DỪNG HẲN có lý do — không bao giờ hiện trong danh sách việc đang chạy ── */
  addTask({
    title: 'Mở lớp Speaking club tối thứ Sáu', unit: unitOf('BC'), branch: 'BC',
    assignee: 'MGR_BC', due: '2026-09-30', progress: 'stopped', type: 'long_term',
    periodId: prevId, group: 'student_parent',
    stopReason: 'Chỉ 4 em đăng ký, không đủ mở lớp. Gộp vào buổi tutor cuối tuần.',
    updates: [
      { progress: 'doing', note: 'Đã khảo sát ba lớp Fast Track.', on: '2026-08-24' },
      { progress: 'stopped', note: 'Chỉ 4 em đăng ký, không đủ mở lớp.', on: '2026-09-04' },
    ],
  });

  /* ── 7. Việc HOÀN THÀNH, có kết quả cụ thể chứ không chỉ một dấu tích ── */
  addTask({
    title: 'Rà soát lịch Mock Test tuần W2 SEP', unit: unitOf('MB'), branch: 'MB',
    assignee: 'MGR_MB', due: '2026-09-06', progress: 'done', type: 'in_period',
    periodId: prevId, group: 'teacher', completedAt: '2026-09-05T09:00:00.000Z',
    updates: [
      { progress: 'doing', note: 'Đối chiếu lịch của bốn lớp Fast Track.', on: '2026-09-02' },
      { progress: 'done', note: 'Khớp lịch xong. Dời MT2 của BC FT 205 sang W2 SEP theo yêu cầu Quản lý.', on: '2026-09-05' },
    ],
  });

  /* ── 8. Nhóm TUTOR — việc dài hạn không có hạn, nên không bao giờ tự tính quá hạn ── */
  addTask({
    title: 'Sưu tầm đề Speaking Part 2 theo chủ đề mới', unit: unitOf('TUTOR'), branch: null,
    assignee: 'MGR_MB', due: null, progress: 'doing', type: 'long_term',
    periodId: currentPeriodId, group: 'tutor',
    updates: [{ progress: 'doing', note: 'Đã gom 40 đề, đang phân theo chủ đề.', on: '2026-09-07' }],
  });
  addTask({
    title: 'Tuyển thêm 2 tutor part-time cho ca cuối tuần', unit: unitOf('TUTOR'), branch: null,
    assignee: 'MGR_MB', due: '2026-10-15', progress: 'not_started', type: 'long_term',
    periodId: currentPeriodId, group: 'tutor',
  });

  /*
   * ── 9. VIỆC GẮN CASE LÀM CĂN CỨ ──
   *
   * Nó liên kết tới những Case đang cần tutor để người đọc biết con số này từ đâu ra. Nhưng
   * nó KHÔNG tự tạo phương án trong Case nào và KHÔNG tự đóng Case nào: một việc quản lý và
   * một phương án hỗ trợ học viên là hai thứ khác nhau, gộp lại thì lịch sử của em sẽ có
   * những dòng không ai từng ghi.
   */
  const tutorCases = (conn
    .prepare(
      `SELECT sc.id FROM sos_cases sc
        WHERE sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_interventions iv
                       WHERE iv.case_id = sc.id AND iv.kind IN ('tutor','extra_support'))
        ORDER BY sc.id LIMIT 4`,
    )
    .all() as any[]).map((r) => r.id);
  const tutorSchedule = addTask({
    title: 'Xếp lịch tutor tháng 10 cho các em đang cần hỗ trợ',
    unit: unitOf('CP'), branch: 'CP', assignee: 'MGR_CP', due: '2026-09-25',
    progress: 'doing', type: 'in_period', periodId: currentPeriodId, group: 'student_parent',
    note: 'Căn cứ là các Case đang dùng PA Tutor — xem danh sách liên kết bên dưới.',
    cases: tutorCases,
    updates: [{ progress: 'doing', note: `Đã rà ${tutorCases.length} Case đang dùng Tutor, còn chờ phòng trống.`, on: '2026-09-11' }],
  });

  /* NỐI VIỆC ↔ BÁO CÁO ĐƠN VỊ (R6): việc trên là căn cứ cho ô báo cáo Học viên/Phụ huynh của CP kỳ này. */
  const cpReport = conn.prepare(
    `SELECT id FROM unit_reports WHERE reporting_unit_id = ? AND period_id = ? ORDER BY id LIMIT 1`,
  ).get(unitOf('CP').id, currentPeriodId) as any;
  if (cpReport) {
    conn.prepare(
      `INSERT INTO unit_report_task_links (unit_report_id, task_id, created_by, created_at) VALUES (?,?,?,?)`,
    ).run(cpReport.id, tutorSchedule, adminId, NOW);
  }

  return n;
}
