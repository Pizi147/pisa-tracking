import { db, tx } from '../db.ts';
import {
  PERMISSIONS, PROGRAMME_TEMPLATES, kiemDongChuyenTiep, soSanhLop, luatDoiLop, nextStepsAfter, programmeOf, tuanKhoa,
  type DongChuyenTiep, type Huong, type LoaiLop, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, isIsoDate, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriod } from '../platform/week.ts';
import { classProgress, classProgressMany } from './schedule.ts';
import { createClass } from './intake.ts';
import { setStudentStatus } from '../students/students.ts';
import { apDungBaoLuuCaLop, apDungCaLop, dongLopNeuHet, type DongCaLop } from './luatLoTrinh.ts';
import { tiepTheoTheoHocVien } from './loTrinhTiep.ts';

/**
 * CHUYỂN TIẾP KHI MỘT LỚP HỌC HẾT CHƯƠNG TRÌNH — mục 6.1, đặc tả §3.9.2 (PR-LT thay khung cũ).
 *
 * Luồng mặc định: FOU → BE, và BE/ELE → Fast Track. Mỗi em CHỌN RIÊNG một hướng (lên lớp, học
 * lại, sang Fast Track, bảo lưu, dừng học, xếp sau) — hệ thống không tự chuyển ai.
 */

// ==================================================================== Kế hoạch (chỉ đọc)

/** Mã lớp gợi ý: `MB-BE 01`, tăng dần — MỘT câu LIKE, không dò từng số. */
function suggestClassCode(branchCode: string, programme: ProgrammeCode): string {
  const conn = db();
  const prefix = `${branchCode}-${programme} `;
  const rows = conn.prepare(`SELECT code FROM classes WHERE code LIKE ?`).all(`${prefix}%`) as any[];
  const used = new Set(rows.map((r) => Number(r.code.slice(prefix.length))).filter((n) => Number.isInteger(n)));
  let n = 1;
  while (used.has(n) && n <= 99) n += 1;
  return `${prefix}${String(n).padStart(2, '0')}`;
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
  const optionCodes = [...new Set(options.map((o) => o.code))];

  const students = conn
    .prepare(
      `SELECT s.id, s.student_code, s.full_name, s.status,
              cy.id AS cycle_id, cy.target_score
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND e.status = 'active'
          AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const sids = students.map((s) => s.id as number);

  /* Lộ trình tiếp theo đã ghi (điền sẵn) — một câu cho cả lớp. */
  const loTrinhTiepMap = tiepTheoTheoHocVien([classId]);

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
      .prepare(`SELECT cycle_id, COUNT(*) n FROM assessment_attempts WHERE cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND status = 'planned' GROUP BY cycle_id`)
      .all(...cycleIds) as any[])
    : [];
  const baiChuaLamByCycle = new Map(baiChuaLamRows.map((r) => [r.cycle_id, r.n as number]));

  /*
   * LỚP ĐÍCH GỢI Ý: lớp CÙNG CHI NHÁNH, đúng MỘT TRONG các chương trình ở `options` (bậc kế,
   * FT, hoặc cùng chương trình để học lại), còn đang chạy và chưa học quá nửa chương trình.
   * `classProgressMany` MỘT LẦN cho cả danh sách ứng viên — không classProgress trong vòng lặp (N+1).
   */
  const candidateRows = optionCodes.length
    ? (conn
      .prepare(
        `SELECT c.id, c.code, c.programme_code, c.is_fast_track,
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
      return !pr || pr.totalWeeks === null || pr.currentWeek === null || pr.currentWeek <= Math.ceil(pr.totalWeeks / 2);
    })
    .map((c) => {
      const pr = candidateProgress.get(c.id);
      return {
        id: c.id, code: c.code, programmeCode: c.programme_code as ProgrammeCode | null,
        programmeName: c.programme_code ? PROGRAMME_TEMPLATES[c.programme_code as ProgrammeCode]?.name ?? null : null,
        ft: !!c.is_fast_track,
        tuan: pr?.currentWeek && pr.totalWeeks && pr.currentWeek >= 1 ? tuanKhoa(pr.currentWeek, pr.totalWeeks) : null,
        studentCount: c.n as number,
      };
    });

  const suggestedCode = defaultProgramme ? suggestClassCode(cls.branch_code, defaultProgramme) : null;

  /* GVCN gợi ý cho ô "+ Mở lớp mới" — giáo viên đang hoạt động của chi nhánh. */
  const teachers = (conn
    .prepare(
      `SELECT DISTINCT u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        JOIN classes c ON c.id = ta.class_id
       WHERE c.branch_id = ? AND ta.status = 'active' ORDER BY u.full_name`,
    )
    .all(cls.branch_id) as any[]).map((t) => ({ id: t.id, name: t.full_name }));

  return {
    from: {
      id: cls.id, code: cls.code, branchId: cls.branch_id, branchCode: cls.branch_code,
      branchName: cls.branch_name,
      programmeCode: cls.programme_code, programmeName: progress.programmeName,
      phase: progress.phase, phaseLabel: progress.phaseLabel,
      totalWeeks: progress.totalWeeks, currentWeek: progress.currentWeek,
    },
    defaultProgramme,
    options,
    suggestedCode,
    candidates,
    teachers,
    tuanKetThuc: progress.finalWeekStart,
    students: students.map((s) => ({
      id: s.id, studentCode: s.student_code, fullName: s.full_name,
      cycleId: s.cycle_id ?? null, target: s.target_score ?? null,
      loTrinhTiep: loTrinhTiepMap.get(s.id) ?? null,
      caseMo: { tong: caseByStudent.get(s.id) ?? 0, seDongNeuSangFt: caseByStudent.get(s.id) ?? 0 },
      baiChuaLam: s.cycle_id ? (baiChuaLamByCycle.get(s.cycle_id) ?? 0) : 0,
    })),
    /** Lớp này đã từng chuyển tiếp sang đâu chưa — để không mở hai lớp kế tiếp cho một lớp. */
    alreadyLinked: (conn
      .prepare('SELECT id, code FROM classes WHERE previous_class_id = ? ORDER BY id')
      .all(classId) as any[]).map((c) => ({ id: c.id, code: c.code })),
    canEdit: can(p, PERMISSIONS.CLASS_EDIT, { classId }),
    today: demoToday(),
  };
}

// ==================================================================== Xác nhận (ghi)

export type TransitionDong = {
  studentId: number; huong?: Huong | null; toClassId?: number | null; toNewClass?: boolean;
  mucTieu?: number | null; thangThi?: string | null; lyDo?: string | null; ngayXemLai?: string | null; luuY?: string | null;
};
export type TransitionInput = {
  fromClassId: number;
  newClass?: { code: string; programme: string; startPeriodId?: number | null; startWeekStart?: string | null; gvcnUserId?: number | null } | null;
  dongs?: TransitionDong[];
  /** Dạng cũ (trước PR-LT) — vẫn nhận để phép kiểm cũ chạy; web mới chỉ gửi `dongs`. */
  moves?: { studentId: number; toClassId?: number | null; toNewClass?: boolean; handoverNote?: string | null; receiverUserId?: number | null }[];
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
 * `apDungBaoLuuCaLop`; `dung_hoc` → Kết thúc học (ngoại lệ đi từng em, hiếm gặp); `xep_sau` →
 * chỉ ghi dự định.
 */
export function applyTransition(p: Principal, input: TransitionInput) {
  const conn = db();
  const from = conn.prepare('SELECT * FROM classes WHERE id = ?').get(input.fromClassId) as any;
  if (!from) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: input.fromClassId }, 'Bạn không có quyền chuyển tiếp lớp này.');
  if (!isIsoDate(input.effectiveDate)) throw badRequest('Ngày chuyển không hợp lệ.');

  const maTu = (from.programme_code ?? null) as ProgrammeCode | null;

  return tx(() => {
    let created: any = null;
    if (input.newClass) {
      const prog = programmeOf(input.newClass.programme);
      if (!prog) throw badRequest('Chương trình của lớp mới không hợp lệ.');
      /* Sửa lỗi §6: web gửi startPeriodId (chọn tuần trực tiếp) — vẫn nhận startWeekStart cũ để tương thích. */
      const startPeriodId = input.newClass.startPeriodId
        ?? (input.newClass.startWeekStart ? ensurePeriod(input.newClass.startWeekStart).id : ensurePeriod(input.effectiveDate).id);
      created = createClass(p, {
        code: input.newClass.code, branchId: from.branch_id, kind: prog, isFastTrack: prog === 'FT',
        startDate: input.effectiveDate, startPeriodId,
        skills: [...PROGRAMME_TEMPLATES[prog].skills], previousClassId: from.id,
        note: `Học tiếp từ lớp ${from.code}`,
      });
      if (input.newClass.gvcnUserId) {
        conn
          .prepare(
            `INSERT INTO teacher_assignments (user_id, class_id, is_core, effective_from, status, created_at)
             VALUES (?, ?, 1, ?, 'active', ?)`,
          )
          .run(input.newClass.gvcnUserId, created.id, input.effectiveDate, new Date().toISOString());
      }
    }

    /*
     * TẬP HỌC VIÊN HỢP LỆ — đúng em còn ghi danh `active` ở LỚP NGUỒN (cùng tập `transitionPlan`
     * đọc), không phải "mọi id gửi lên". Không có kiểm này thì một `studentId` không thuộc lớp
     * (khác chi nhánh, đã rời lớp…) vẫn lọt qua bước 1 (đóng enrollment — 0 dòng khớp) rồi bị
     * bước 2 CHÈN THẲNG một enrollment mới vào lớp đích, xếp nhầm em chưa từng ở lớp này.
     */
    const eligibleIds = new Set(
      (conn
        .prepare(
          `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL`,
        )
        .all(input.fromClassId) as any[]).map((r) => r.id as number),
    );

    /*
     * Đọc thông tin lớp đích THEO LÔ — một câu cho mọi lớp đích khác nhau, không hỏi lại theo
     * từng em. Chỉ lớp CÒN HOẠT ĐỘNG và KHÁC lớp nguồn mới hợp lệ — lớp đã kết thúc/id không
     * tồn tại thì `classInfoOf` không có, dòng đó rơi vào "Lớp đích không hợp lệ" bên dưới.
     */
    const rawToClassIds = new Set<number>();
    for (const m of input.moves ?? []) if (!m.toNewClass && m.toClassId) rawToClassIds.add(m.toClassId);
    for (const d of input.dongs ?? []) if (!d.toNewClass && d.toClassId) rawToClassIds.add(d.toClassId);
    const classInfoOf = new Map<number, { ma: ProgrammeCode | null; ft: boolean; code: string; branchId: number }>();
    if (rawToClassIds.size) {
      const ids = [...rawToClassIds];
      for (const c of conn
        .prepare(
          `SELECT id, code, programme_code, is_fast_track, branch_id FROM classes
            WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'active' AND id != ?`,
        )
        .all(...ids, input.fromClassId) as any[]) {
        classInfoOf.set(c.id, { ma: (c.programme_code ?? null) as ProgrammeCode | null, ft: !!c.is_fast_track, code: c.code, branchId: c.branch_id });
      }
    }
    if (created) classInfoOf.set(created.id, { ma: (created.programme_code ?? null) as ProgrammeCode | null, ft: !!created.is_fast_track, code: created.code, branchId: created.branch_id });

    /* Dạng cũ → dạng mới: suy hướng từ luật lộ trình so với lớp đích đã chọn (giữ tương thích phép kiểm cũ). */
    const legacyDongs: TransitionDong[] = (input.moves ?? []).map((m) => {
      const toClassId = m.toNewClass ? created?.id ?? null : m.toClassId ?? null;
      const toClass = toClassId ? classInfoOf.get(toClassId) ?? null : null;
      /* Không có lớp đích thì vẫn cần một hướng cụ thể để kiemDongChuyenTiep báo đúng "thiếu lớp đích", không phải "thiếu hướng". */
      const huong: Huong = !toClass ? 'len_lop'
        : toClass.ft ? 'fast_track' : toClass.ma === maTu ? 'hoc_lai' : 'len_lop';
      return {
        studentId: m.studentId, huong, toClassId, toNewClass: m.toNewClass,
        luuY: (m.handoverNote ?? '').trim() || (input.handoverNote ?? '').trim() || null,
      };
    });
    const dongs: TransitionDong[] = input.dongs?.length ? input.dongs : legacyDongs;
    if (!dongs.length) throw badRequest('Chưa chọn học viên nào để chuyển.');

    const failed: { studentId: number; message: string }[] = [];
    const okChuyenLop: DongCaLop[] = [];
    const okBaoLuu: { sid: number; lyDo: string }[] = [];
    const okDungHoc: { sid: number; lyDo: string }[] = [];
    const okXepSau: { sid: number; lyDo: string; ngayXemLai: string }[] = [];
    const doneList: { studentId: number; toClassId: number }[] = [];

    for (const dg of dongs) {
      if (!eligibleIds.has(dg.studentId)) { failed.push({ studentId: dg.studentId, message: 'Học viên không thuộc lớp này.' }); continue; }
      const toClassId = dg.toNewClass ? created?.id ?? null : dg.toClassId ?? null;
      const toClass = toClassId ? classInfoOf.get(toClassId) ?? null : null;
      if (toClassId && !dg.toNewClass && !toClass) { failed.push({ studentId: dg.studentId, message: 'Lớp đích không hợp lệ.' }); continue; }
      const kiemTra: DongChuyenTiep = {
        huong: dg.huong ?? null, toClassId, toClass, toNewClass: dg.toNewClass,
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
      } else if (huong === 'xep_sau') {
        okXepSau.push({ sid: dg.studentId, lyDo: dg.lyDo!, ngayXemLai: dg.ngayXemLai! });
      }
    }

    if (okChuyenLop.length) apDungCaLop(p, { fromClass: { id: from.id, code: from.code }, ngay: input.effectiveDate, dongs: okChuyenLop });
    if (okBaoLuu.length) apDungBaoLuuCaLop(p, { fromClassId: from.id, ngay: input.effectiveDate, dongs: okBaoLuu });
    /* Dừng học = Kết thúc học — ngoại lệ đi từng em (hiếm, thường 0-1 em mỗi đợt), tái dùng đúng một luật S16. */
    for (const d of okDungHoc) setStudentStatus(p, d.sid, 'finished', input.effectiveDate, d.lyDo, 'dung_hoc');

    /* Lộ trình tiếp theo: ghi/cập nhật dự định cho MỌI dòng hợp lệ — một INSERT nhiều dòng, ON CONFLICT cập nhật. */
    const okAll = [...okChuyenLop.map((d) => ({ sid: d.sid, huong: d.huong as Huong, applied: true })),
      ...okBaoLuu.map((d) => ({ sid: d.sid, huong: 'bao_luu' as Huong, applied: false })),
      ...okDungHoc.map((d) => ({ sid: d.sid, huong: 'dung_hoc' as Huong, applied: true })),
      ...okXepSau.map((d) => ({ sid: d.sid, huong: 'xep_sau' as Huong, applied: false }))];
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
             huong = excluded.huong, muc_tieu = excluded.muc_tieu, thang_thi = excluded.thang_thi,
             ghi_chu = excluded.ghi_chu, ly_do = excluded.ly_do, ngay_xem_lai = excluded.ngay_xem_lai,
             da_ap_dung_luc = excluded.da_ap_dung_luc, updated_at = excluded.updated_at`,
        )
        .run(...params);
    }

    dongLopNeuHet([from.id], input.effectiveDate);
    const classSau = conn.prepare('SELECT status FROM classes WHERE id = ?').get(from.id) as any;

    const theoHuong: Record<string, number> = {};
    for (const o of okAll) theoHuong[o.huong] = (theoHuong[o.huong] ?? 0) + 1;
    writeAudit({
      actorUserId: p.userId, action: 'class.transition', entityType: 'class', entityId: from.id, entityLabel: from.code,
      after: { newClass: created?.code ?? null, theoHuong, failed: failed.length, effectiveDate: input.effectiveDate },
    });

    return {
      newClass: created ? { id: created.id, code: created.code } : null,
      done: doneList, failed, lopCuDaKetThuc: classSau?.status === 'finished',
    };
  });
}
