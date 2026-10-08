import { db, tx } from '../db.ts';
import {
  PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaHuong, dienSanChuyenTiep, kiemDongChuyenTiep, tuanChonDuoc, kyHieuLop, soSanhLop, tachSoLop, luatDoiLop, nextStepsAfter, programmeOf, tuanHocTai, tuanKhoa,
  type DongChuyenTiep, type Huong, type LoaiLop, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, isIsoDate, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { classProgress, classProgressMany } from './schedule.ts';
import { setStudentStatus } from '../students/students.ts';
import { apDungBaoLuuCaLop, apDungCaLop, dongLopNeuHet, type DongCaLop } from './luatLoTrinh.ts';
import { tiepTheoTheoHocVien } from './loTrinhTiep.ts';
import { coTheRaLenh } from './quyenChuyenLop.ts';
import { standingFor } from '../students/standing.ts';
import { cuoiKhoaTheoHocVien } from '../normal/cuoiKhoa.ts';
import { HV_DANG_HOC_SQL, khoangTamDung } from '../students/tamDung.ts';
import { mt0TheoHocVien } from '../fasttrack/mt0.ts';

/**
 * CHUYỂN TIẾP KHI MỘT LỚP HỌC HẾT CHƯƠNG TRÌNH — mục 6.1, đặc tả §3.9.2 (PR-LT thay khung cũ).
 *
 * Luồng mặc định: FOU → BE, và BE/ELE → Fast Track. Mỗi em CHỌN RIÊNG một hướng (lên lớp, học
 * lại, sang Fast Track, tạm dừng học (bảo lưu), dừng học hẳn, chưa quyết) — hệ thống không tự chuyển ai.
 */

// ==================================================================== Kế hoạch (chỉ đọc)

/** Số lớp gợi ý: số lớn nhất của các lớp CÙNG ký hiệu (`FT`, `FT RF`, `BE`…) trong chi nhánh + 1 — đọc cột, không `LIKE` tên (K2 §4d). */
export function soGoiY(branchCode: string, ct: string, route: string | null): string {
  const kh = kyHieuLop(ct, route);
  const rows = db().prepare(
    `SELECT c.code, c.programme_code, c.route FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = ? AND c.programme_code = ?`,
  ).all(branchCode, ct) as any[];
  const so = rows.filter((r) => kyHieuLop(r.programme_code, r.route) === kh)
    .map((r) => parseInt(tachSoLop(r.code, branchCode) ?? '', 10)).filter((n) => Number.isInteger(n));
  return String(Math.max(0, ...so) + 1);
}

export function transitionPlan(p: Principal, classId: number) {
  const conn = db();
  const cls = conn
    .prepare('SELECT c.*, b.code AS branch_code, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');

  const progress = classProgress(classId);
  const from = programmeOf(cls.programme_code ?? cls.kind);
  const steps = from ? nextStepsAfter(from) : [];
  const defaultProgramme = steps[0] ?? null;
  /* Q8: mỗi bước bậc kế/FT nói rõ hướng; "học lại" (cùng chương trình) luôn có, cạnh chúng — không phải mặc định. */
  const options = [
    ...(from ? [{ code: from, name: PROGRAMME_TEMPLATES[from].name, huong: 'hoc_lai' as Huong }] : []),
    ...steps.map((c) => ({ code: c, name: PROGRAMME_TEMPLATES[c].name, huong: (c === 'FT' ? 'fast_track' : 'len_lop') as Huong })),
  ];
  /* PR-CT (màn I): lớp FT chuyển giữa lộ trình — lớp chuyển đến là mọi lớp FT còn chạy (mọi lộ trình), không lọc "quá nửa". */
  const ft = !!cls.is_fast_track;
  const optionCodes = ft ? ['FT'] : [...new Set(options.map((o) => o.code))];
  /* PR-LCa (LCa-7): panel gộp — GVCN (không ra lệnh) không nhận ứng viên / lớp mới / tuần, và không tính chúng (`goiYLopMoi` ghi kỳ). */
  const raLenhDuoc = coTheRaLenh(p, classId);

  const students = conn
    .prepare(
      `SELECT s.id, s.student_code, s.full_name, s.status,
              cy.id AS cycle_id, cy.target_score, cy.khong_cam_ket, cy.route, sp.week_start AS start_week
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
         LEFT JOIN report_periods sp ON sp.id = cy.start_period_id
        WHERE e.class_id = ? AND e.status = 'active'
          AND ${HV_DANG_HOC_SQL('s')}
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const sids = students.map((s) => s.id as number);
  /* PR-UXF-a Q6: lớp FT — "tuần học n" của từng em (bỏ tuần Tạm dừng), MỘT câu khoảng dừng cho cả lớp. Lớp thường không cần. */
  const dungCua = ft && sids.length ? khoangTamDung(sids) : {};
  const tuanNay = mondayOf(demoToday());

  /* Lộ trình tiếp theo đã ghi (điền sẵn) — một câu cho cả lớp. */
  const loTrinhTiepMap = tiepTheoTheoHocVien([classId]);
  /* B9: kết quả gần nhất của từng em (cột Kết quả) — MỘT lần `standingFor` cho cả lớp. */
  const ketQua = sids.length ? standingFor(sids) : new Map();
  /* PR-LT2b: % Cuối khoá + hướng gợi ý của cả lớp — MỘT lần (PR-CT dựng cột "Hệ thống gợi ý" từ đây). */
  const cuoiKhoa = sids.length ? cuoiKhoaTheoHocVien(classId, sids) : new Map();

  /* PR-CT: quyết định chuyển lớp đang chờ của cả lớp — MỘT câu (chỉ mục duy nhất một phần: mỗi em tối đa một lệnh `cho`). */
  const lenhCho = new Map((conn.prepare(
    `SELECT id, student_id, huong, lop_dich_id, tuan_bat_dau, muc_tieu, khong_cam_ket, ngay_thi, ngay_xem_lai, ly_do, khac_goi_y, loi
       FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho'`,
  ).all(classId) as any[]).map((l) => [l.student_id as number, {
    id: l.id as number, huong: l.huong as string, lopDichId: (l.lop_dich_id ?? null) as number | null, tuan: l.tuan_bat_dau as string,
    mucTieu: l.khong_cam_ket ? 'KCK' : (l.muc_tieu ?? null) as number | 'KCK' | null, ngayThi: (l.ngay_thi ?? null) as string | null,
    ngayXemLai: (l.ngay_xem_lai ?? null) as string | null, lyDo: (l.ly_do ?? null) as string | null, khacGoiY: !!l.khac_goi_y,
    loi: (l.loi ?? null) as string | null,
  }]));

  /* Case đang mở + bài chưa làm — đọc theo lô, không hỏi lại theo từng em. */
  const caseRows = sids.length
    ? (conn
      .prepare(`SELECT id, student_id, category FROM sos_cases WHERE student_id IN (${sids.map(() => '?').join(',')}) AND status != 'done'`)
      .all(...sids) as any[])
    : [];
  const caseByStudent = new Map<number, number>();
  for (const c of caseRows) caseByStudent.set(c.student_id, (caseByStudent.get(c.student_id) ?? 0) + 1);
  const cycleIds = students.map((s) => s.cycle_id).filter(Boolean);
  const baiChuaLamRows = cycleIds.length
    ? (conn
      .prepare(`SELECT cycle_id, COUNT(*) n FROM assessment_attempts WHERE cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND status = 'planned' AND kind != 'mt0' GROUP BY cycle_id`)   /* PR-MT0: MT0 đi theo em, không là bài chưa làm */
      .all(...cycleIds) as any[])
    : [];
  const baiChuaLamByCycle = new Map(baiChuaLamRows.map((r) => [r.cycle_id, r.n as number]));

  /*
   * LỚP ĐÍCH GỢI Ý: lớp CÙNG CHI NHÁNH, đúng MỘT TRONG các chương trình ở `options` (bậc kế,
   * FT, hoặc cùng chương trình để học lại), còn đang chạy và chưa học quá nửa chương trình.
   * `classProgressMany` MỘT LẦN cho cả danh sách ứng viên — không classProgress trong vòng lặp (N+1).
   */
  const candidateRows = raLenhDuoc && optionCodes.length
    ? (conn
      .prepare(
        `SELECT c.id, c.code, c.programme_code, c.is_fast_track, c.route,
                (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status='active') AS n
           FROM classes c
          WHERE c.branch_id = ? AND c.status = 'active' AND c.id != ?
            AND c.programme_code IN (${optionCodes.map(() => '?').join(',')})
          ORDER BY c.code`,
      )
      .all(cls.branch_id, classId, ...optionCodes) as any[])
      .sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }))
    : [];
  const candidateProgress = classProgressMany(candidateRows.map((c) => c.id));
  const candidates = candidateRows
    .filter((c) => {
      const pr = candidateProgress.get(c.id);
      return ft || !pr || pr.totalWeeks === null || pr.currentWeek === null || pr.currentWeek <= Math.ceil(pr.totalWeeks / 2);
    })
    .map((c) => {
      const pr = candidateProgress.get(c.id);
      return {
        id: c.id, code: c.code, programmeCode: c.programme_code as ProgrammeCode | null,
        programmeName: c.programme_code ? PROGRAMME_TEMPLATES[c.programme_code as ProgrammeCode]?.name ?? null : null,
        ft: !!c.is_fast_track, route: (c.route ?? null) as string | null,
        tuan: pr?.currentWeek && pr.totalWeeks && pr.currentWeek >= 1 ? tuanKhoa(pr.currentWeek, pr.totalWeeks) : null,
        studentCount: c.n as number,
      };
    });

  /* "+ Mở lớp mới" (K2-16) mở panel Tạo lớp điền sẵn các giá trị này; panel tự nạp giáo viên. Tuần khai giảng = tuần sau ngày chuyển. */
  const loTrinhGoiY = defaultProgramme === 'FT' ? 'LT1' : null;
  const goiYLopMoi = raLenhDuoc && defaultProgramme ? {
    branchId: cls.branch_id as number, chuongTrinh: defaultProgramme, loTrinh: loTrinhGoiY,
    so: soGoiY(cls.branch_code, defaultProgramme, loTrinhGoiY),
    startPeriodId: ensurePeriod(addDays(mondayOf(demoToday()), 7)).id,
  } : null;

  const mt0Em = ft ? new Map() : mt0TheoHocVien(students.map((s) => s.id as number));
  return {
    from: {
      id: cls.id, code: cls.code, branchId: cls.branch_id, branchCode: cls.branch_code,
      branchName: cls.branch_name,
      programmeCode: cls.programme_code, programmeName: progress.programmeName, route: (cls.route ?? null) as string | null,
      phase: progress.phase, phaseLabel: progress.phaseLabel,
      totalWeeks: progress.totalWeeks, currentWeek: progress.currentWeek,
    },
    defaultProgramme,
    options,
    goiYLopMoi,
    candidates,
    /** Tuần Cuối khoá (đổi tên từ `tuanKetThuc` cũ) và tuần kết thúc = tuần học cuối (Q13): lớp thường tới hết tuần này mà còn em chưa có lệnh thì Báo QL. */
    tuanCuoiKhoa: progress.finalWeekStart,
    tuanKetThuc: progress.startWeekStart && progress.totalWeeks ? addDays(progress.startWeekStart, (progress.totalWeeks - 1) * 7) : null,
    cheDo: (ft ? 'ft' : 'thuong') as 'ft' | 'thuong',
    /** GVCN của lớp nguồn — câu "Sau khi gửi: GVCN … có việc Bàn giao" ở bước Xác nhận. */
    gvcn: ((conn.prepare(`SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1`).get(classId) as any)?.full_name ?? null) as string | null,
    tuanChon: raLenhDuoc ? tuanChonDuoc(demoToday()) : [],
    students: students.map((s) => ({
      id: s.id, studentCode: s.student_code, fullName: s.full_name,
      cycleId: s.cycle_id ?? null, target: s.target_score ?? null,
      /** PR-UXF-a (mockup 20 màn I): FT `{ tuan, tong: null }` — "LT1 · tuần học 9"; lớp thường null (cột Khoá đã có tuần của lớp). */
      route: (s.route ?? null) as string | null,
      tuanHoc: ft && s.start_week ? (() => { const th = tuanHocTai(s.start_week, tuanNay, dungCua[s.id] ?? []); return th ? { tuan: th.tuan, tong: null, dangDung: th.dangDung } : null; })() : null,
      loTrinhTiep: loTrinhTiepMap.get(s.id) ?? null,
      /** PR-LCa (LCa-4): dòng điền sẵn từ Lộ trình tiếp theo (Hướng, Target Lên FT, lớp chuyển đến) — lớp thường; lớp FT null. */
      dienSan: ft ? null : dienSanChuyenTiep(loTrinhTiepMap.get(s.id) ?? null,
        { target: s.target_score ?? null, kck: !!s.khong_cam_ket }, candidates, { maTu: from }),
      ketQua: ketQua.get(s.id) ?? null,
      cuoiKhoa: cuoiKhoa.get(s.id) ?? null,
      caseMo: { tong: caseByStudent.get(s.id) ?? 0, seDongNeuSangFt: caseByStudent.get(s.id) ?? 0 },
      baiChuaLam: s.cycle_id ? (baiChuaLamByCycle.get(s.cycle_id) ?? 0) : 0,
      lenh: lenhCho.get(s.id) ?? null,
      /** PR-MT0: ô MT0 (mockup ⑥) — trạng thái + chip SOS hiển thị; không có MT0 → null. */
      mt0: mt0Em.get(s.id) ?? null,
    })),
    /** Lớp này đã từng chuyển tiếp sang đâu chưa — để không mở hai lớp kế tiếp cho một lớp. */
    alreadyLinked: (conn
      .prepare('SELECT id, code FROM classes WHERE previous_class_id = ? ORDER BY id')
      .all(classId) as any[]).map((c) => ({ id: c.id, code: c.code })),
    canEdit: can(p, PERMISSIONS.CLASS_EDIT, { classId }),
    /** PR-LCa (LCa-7): GVCN ghi Hướng (STUDENT_EDIT); Quản lý ra quyết định (`coTheRaLenh`). */
    coTheGhiHuong: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
    coTheRaLenh: raLenhDuoc,
    today: demoToday(),
  };
}

// ==================================================================== Xác nhận (ghi)

export type TransitionDong = {
  studentId: number; huong?: Huong | null; toClassId?: number | null;
  mucTieu?: number | null; thangThi?: string | null; lyDo?: string | null; ngayXemLai?: string | null; luuY?: string | null;
};
export type TransitionInput = {
  fromClassId: number;
  dongs?: TransitionDong[];
  /** Dạng cũ (trước PR-LT) — vẫn nhận để phép kiểm cũ chạy; web mới chỉ gửi `dongs`. */
  moves?: { studentId: number; toClassId?: number | null; handoverNote?: string | null; receiverUserId?: number | null }[];
  effectiveDate: string;
  note?: string | null;
  handoverNote?: string | null;
  receiverUserId?: number | null;
};

/**
 * XÁC NHẬN CHUYỂN TIẾP. Mở lớp mới (nếu có) rồi chuyển từng em theo HƯỚNG đã chọn.
 *
 * Kiểm mỗi dòng bằng `kiemDongChuyenTiep` TRƯỚC — dòng lỗi vào `failed`, dòng đúng nhóm lại
 * theo hướng rồi ghi THEO LÔ (Q20): `len_lop/hoc_lai/fast_track` → `apDungCaLop`; `bao_luu` →
 * `apDungBaoLuuCaLop`; `dung_hoc` → Kết thúc học (ngoại lệ đi từng em, hiếm gặp); `chua_quyet` →
 * chỉ ghi dự định.
 */
export function applyTransition(p: Principal, input: TransitionInput, o?: { daDuyet?: true }) {
  const conn = db();
  const from = conn.prepare('SELECT * FROM classes WHERE id = ?').get(input.fromClassId) as any;
  if (!from) throw notFound('Không tìm thấy lớp');
  /* PR-CT: `daDuyet` chỉ do `thiHanhLenhDenHan` truyền — lệnh đã được kiểm quyền lúc ra; đường web cũ không tới đây nữa. */
  if (!o?.daDuyet) require_(p, PERMISSIONS.CLASS_EDIT, { classId: input.fromClassId }, 'Bạn không có quyền chuyển tiếp lớp này.');
  if (!isIsoDate(input.effectiveDate)) throw badRequest('Ngày chuyển không hợp lệ.');

  const maTu = (from.programme_code ?? null) as ProgrammeCode | null;

  return tx(() => {
    /* PR-Dọn (Q22): không còn mở lớp mới ở đây — web tạo lớp trước bằng panel Tạo lớp (`taoLopVaPhanCong`) rồi gán vào dòng. */

    /*
     * TẬP HỌC VIÊN HỢP LỆ — đúng em còn ghi danh `active` ở LỚP NGUỒN (cùng tập `transitionPlan`
     * đọc), không phải "mọi id gửi lên". Không có kiểm này thì một `studentId` không thuộc lớp
     * (khác chi nhánh, đã rời lớp…) vẫn lọt qua bước 1 (đóng enrollment — 0 dòng khớp) rồi bị
     * bước 2 CHÈN THẲNG một enrollment mới vào lớp chuyển đến, xếp nhầm em chưa từng ở lớp này.
     */
    const eligibleIds = new Set(
      (conn
        .prepare(
          `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
        )
        .all(input.fromClassId) as any[]).map((r) => r.id as number),
    );

    /*
     * Đọc thông tin lớp chuyển đến THEO LÔ — một câu cho mọi lớp chuyển đến khác nhau, không hỏi lại theo
     * từng em. Chỉ lớp CÒN HOẠT ĐỘNG và KHÁC lớp nguồn mới hợp lệ — lớp đã kết thúc/id không
     * tồn tại thì `classInfoOf` không có, dòng đó rơi vào "Lớp chuyển đến không hợp lệ" bên dưới.
     */
    const rawToClassIds = new Set<number>();
    for (const m of input.moves ?? []) if (m.toClassId) rawToClassIds.add(m.toClassId);
    for (const d of input.dongs ?? []) if (d.toClassId) rawToClassIds.add(d.toClassId);
    const classInfoOf = new Map<number, { ma: ProgrammeCode | null; ft: boolean; code: string; branchId: number; route: string | null }>();
    if (rawToClassIds.size) {
      const ids = [...rawToClassIds];
      for (const c of conn
        .prepare(
          `SELECT id, code, programme_code, is_fast_track, branch_id, route FROM classes
            WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'active' AND id != ?`,
        )
        .all(...ids, input.fromClassId) as any[]) {
        classInfoOf.set(c.id, { ma: (c.programme_code ?? null) as ProgrammeCode | null, ft: !!c.is_fast_track, code: c.code, branchId: c.branch_id, route: c.route ?? null });
      }
    }

    /* Dạng cũ → dạng mới: suy hướng từ luật lộ trình so với lớp chuyển đến đã chọn (giữ tương thích phép kiểm cũ). */
    const legacyDongs: TransitionDong[] = (input.moves ?? []).map((m) => {
      const toClassId = m.toClassId ?? null;
      const toClass = toClassId ? classInfoOf.get(toClassId) ?? null : null;
      /* Không có lớp chuyển đến thì vẫn cần một hướng cụ thể để kiemDongChuyenTiep báo đúng "thiếu lớp chuyển đến", không phải "thiếu hướng". */
      const huong: Huong = !toClass ? 'len_lop'
        : toClass.ft ? 'fast_track' : toClass.ma === maTu ? 'hoc_lai' : 'len_lop';
      return {
        studentId: m.studentId, huong, toClassId,
        luuY: (m.handoverNote ?? '').trim() || (input.handoverNote ?? '').trim() || null,
      };
    });
    /* PR-K26: form cũ còn gửi `xep_sau` → `chua_quyet`; hướng lạ → null ("Thiếu hướng"). */
    const dongs: TransitionDong[] = (input.dongs?.length ? input.dongs : legacyDongs)
      .map((d) => ({ ...d, huong: d.huong ? chuanHoaHuong(d.huong) : null }));
    if (!dongs.length) throw badRequest('Chưa chọn học viên nào để chuyển.');

    const failed: { studentId: number; message: string }[] = [];
    const okChuyenLop: DongCaLop[] = [];
    const okBaoLuu: { sid: number; lyDo: string }[] = [];
    const okDungHoc: { sid: number; lyDo: string }[] = [];
    const okChuaQuyet: { sid: number; lyDo: string; ngayXemLai: string }[] = [];
    const doneList: { studentId: number; toClassId: number }[] = [];

    for (const dg of dongs) {
      if (!eligibleIds.has(dg.studentId)) { failed.push({ studentId: dg.studentId, message: 'Học viên không thuộc lớp này.' }); continue; }
      const toClassId = dg.toClassId ?? null;
      const toClass = toClassId ? classInfoOf.get(toClassId) ?? null : null;
      if (toClassId && !toClass) { failed.push({ studentId: dg.studentId, message: 'Lớp chuyển đến không hợp lệ.' }); continue; }
      const kiemTra: DongChuyenTiep = {
        huong: dg.huong ?? null, toClassId, toClass,
        mucTieu: dg.mucTieu ?? null, thangThi: dg.thangThi ?? null, lyDo: dg.lyDo ?? null, ngayXemLai: dg.ngayXemLai ?? null,
      };
      const loi = kiemDongChuyenTiep(kiemTra, { maTu });
      if (loi) { failed.push({ studentId: dg.studentId, message: loi }); continue; }

      const huong = dg.huong as Huong;
      if (huong === 'len_lop' || huong === 'hoc_lai' || huong === 'fast_track') {
        okChuyenLop.push({ sid: dg.studentId, huong, toClassId: toClassId!, toClass: toClass!, mucTieu: dg.mucTieu ?? null, thangThi: dg.thangThi ?? null });
        doneList.push({ studentId: dg.studentId, toClassId: toClassId! });
      } else if (huong === 'bao_luu') {
        okBaoLuu.push({ sid: dg.studentId, lyDo: dg.lyDo! });
      } else if (huong === 'dung_hoc') {
        okDungHoc.push({ sid: dg.studentId, lyDo: dg.lyDo! });
        doneList.push({ studentId: dg.studentId, toClassId: input.fromClassId });
      } else if (huong === 'chua_quyet') {
        okChuaQuyet.push({ sid: dg.studentId, lyDo: dg.lyDo!, ngayXemLai: dg.ngayXemLai! });
      }
    }

    /* PR-LT2b (Q30-3): 50–59% không còn thẻ — Quản lý chuyển em là Quản lý ĐÃ QUYẾT. Đọc TRƯỚC `apDungCaLop` (đóng ghi danh). */
    const quyetCk = okChuyenLop.length && can(p, PERMISSIONS.REQUEST_APPROVE, { classId: from.id })
      ? cuoiKhoaTheoHocVien(from.id, okChuyenLop.map((d) => d.sid)) : null;
    if (okChuyenLop.length) apDungCaLop(p, { fromClass: { id: from.id, code: from.code }, ngay: input.effectiveDate, dongs: okChuyenLop });
    if (okBaoLuu.length) apDungBaoLuuCaLop(p, { fromClassId: from.id, ngay: input.effectiveDate, dongs: okBaoLuu });
    /* Dừng học hẳn = Kết thúc học — ngoại lệ đi từng em (hiếm, thường 0-1 em mỗi đợt), tái dùng đúng một luật S16. */
    for (const d of okDungHoc) setStudentStatus(p, d.sid, 'finished', input.effectiveDate, d.lyDo, 'dung_hoc');

    /*
     * Lộ trình tiếp theo: ghi/cập nhật dự định cho MỌI dòng hợp lệ — một INSERT nhiều dòng, ON CONFLICT cập nhật. PR-LCa (LCa-3): dòng đã có
     * chỉ đổi hướng, mốc áp dụng và Target thật; ghi chú, lý do, ngày xem lại, tháng thi trống thì GIỮ cái đã lưu (lệnh không mang chúng).
     */
    const okAll = [...okChuyenLop.map((d) => ({ sid: d.sid, huong: d.huong as Huong, applied: true })),
      ...okBaoLuu.map((d) => ({ sid: d.sid, huong: 'bao_luu' as Huong, applied: false })),
      ...okDungHoc.map((d) => ({ sid: d.sid, huong: 'dung_hoc' as Huong, applied: true })),
      ...okChuaQuyet.map((d) => ({ sid: d.sid, huong: 'chua_quyet' as Huong, applied: false }))];
    if (okAll.length) {
      const now = new Date().toISOString();
      const byId = new Map(dongs.map((d) => [d.studentId, d]));
      const rows = okAll.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const params = okAll.flatMap((o) => {
        const dg = byId.get(o.sid)!;
        return [
          o.sid, from.id, o.huong, dg.mucTieu ?? null, dg.thangThi ?? null, dg.luuY ?? null, dg.lyDo ?? null,
          dg.ngayXemLai ?? null, o.applied ? input.effectiveDate : null, now, now,
        ];
      });
      conn
        .prepare(
          `INSERT INTO lo_trinh_tiep_theo
             (student_id, class_id, huong, muc_tieu, thang_thi, ghi_chu, ly_do, ngay_xem_lai, da_ap_dung_luc, created_at, updated_at)
           VALUES ${rows}
           ON CONFLICT(student_id, class_id) DO UPDATE SET
             huong = excluded.huong, muc_tieu = COALESCE(excluded.muc_tieu, lo_trinh_tiep_theo.muc_tieu),
             thang_thi = COALESCE(excluded.thang_thi, lo_trinh_tiep_theo.thang_thi), ghi_chu = COALESCE(excluded.ghi_chu, lo_trinh_tiep_theo.ghi_chu),
             ly_do = COALESCE(excluded.ly_do, lo_trinh_tiep_theo.ly_do), ngay_xem_lai = COALESCE(excluded.ngay_xem_lai, lo_trinh_tiep_theo.ngay_xem_lai),
             da_ap_dung_luc = excluded.da_ap_dung_luc, updated_at = excluded.updated_at`,
        )
        .run(...params);
    }

    const sidsQuyet = quyetCk ? okChuyenLop.filter((d) => quyetCk.get(d.sid)?.goiY?.canQuanLy).map((d) => d.sid) : [];
    if (sidsQuyet.length) {
      const luc = new Date().toISOString();
      conn.prepare(`UPDATE lo_trinh_tiep_theo SET quyet_boi = ?, quyet_luc = ? WHERE class_id = ? AND student_id IN (${sidsQuyet.map(() => '?').join(',')})`)
        .run(p.userId, luc, from.id, ...sidsQuyet);
      writeAudit({
        actorUserId: p.userId, action: 'cuoi_khoa.quyet', entityType: 'class', entityId: from.id, entityLabel: from.code,
        after: { hocVien: sidsQuyet, huong: Object.fromEntries(okChuyenLop.filter((d) => sidsQuyet.includes(d.sid)).map((d) => [d.sid, d.huong])) },
      });
    }

    dongLopNeuHet([from.id], input.effectiveDate);
    const classSau = conn.prepare('SELECT status FROM classes WHERE id = ?').get(from.id) as any;

    const theoHuong: Record<string, number> = {};
    for (const o of okAll) theoHuong[o.huong] = (theoHuong[o.huong] ?? 0) + 1;
    /* PR-S5F-a: không em nào qua được luật (lệnh lỗi thử lại) → không có gì để ghi nhật ký. */
    if (okAll.length) writeAudit({
      actorUserId: p.userId, action: 'class.transition', entityType: 'class', entityId: from.id, entityLabel: from.code,
      after: { theoHuong, failed: failed.length, effectiveDate: input.effectiveDate },
    });

    return {
      done: doneList, failed, lopCuDaKetThuc: classSau?.status === 'finished',
    };
  });
}
