import { THAM_SO_TOI_DA, db, theoLo, tx } from '../db.ts';
import {
  PERMISSIONS, luatDoiLop, type LoaiLop, type LuatDoiLop, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { chuyenCaseSangLoTrinh, closeCasesOnProgrammeSwitch } from '../cases/systemClose.ts';
import { taoMtMacDinh, taoMtMacDinhLo } from '../fasttrack/mtMacDinh.ts';
import { classProgressMany } from './schedule.ts';
import { programmeByCode } from '../normal/regular.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';

/**
 * LUẬT LỘ TRÌNH — MỘT CHỖ (PR-LT, §3.9) dùng chung cho Chuyển lớp một em (`students.ts`) và
 * Chuyển tiếp lớp cả lớp (`transition.ts`). `luatDoiLop` (shared/domain/lenLop.ts) trả lời
 * "đóng/mở khoá thế nào, Case đi đâu"; các hàm ở đây THI HÀNH câu trả lời đó trên database.
 */

// ---------------------------------------------------------------- lớp hiện tại + quyền (Q3)

/** Enrollment `active` hiện tại của em, kèm thông tin lớp — dùng cho mọi luồng chuyển lớp. */
export function lopHienTaiCua(studentId: number): any {
  return db()
    .prepare(
      `SELECT e.*, c.code, c.programme_code, c.is_fast_track, c.route, c.branch_id, c.status AS class_status,
              b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`,
    )
    .get(studentId) as any;
}

/** Q3: quyền kiểm Ở LỚP NGUỒN — GVCN lớp đó (hoặc QL phạm vi lớp đó), KHÔNG đòi quyền ở lớp đích. */
export function coTheChuyenLop(p: Principal, sid: number): { enr: any } | null {
  const enr = lopHienTaiCua(sid);
  if (!enr) return null;
  if (!can(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id })) return null;
  return { enr };
}

/** Lớp đích hợp lệ: tồn tại, `status='active'`, khác lớp nguồn. Không kiểm quyền ở đây (Q3). */
export function lopDichHopLe(toClassId: number, lopNguonId: number): any | null {
  const lop = db().prepare('SELECT * FROM classes WHERE id = ?').get(toClassId) as any;
  if (!lop || lop.status !== 'active' || lop.id === lopNguonId) return null;
  return lop;
}

// ---------------------------------------------------------------- GET /chuyen-lop/lop-dich (Q3)

/** Danh sách lớp đích cho GVCN chọn — MỌI chi nhánh, không lộ số/tên học viên lớp khác. */
export function lopDichChoChuyen(p: Principal, sid: number) {
  const enr = lopHienTaiCua(sid);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền chuyển lớp học viên này.');
  const conn = db();
  const branches = conn.prepare(`SELECT id, name FROM branches WHERE status = 'active' ORDER BY name`).all() as any[];
  const lopRows = conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, c.programme_code, c.is_fast_track,
              (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
                WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1) AS gvcn
         FROM classes c WHERE c.status = 'active' AND c.id != ?`,
    )
    .all(enr.class_id) as any[];
  const tienDo = classProgressMany(lopRows.map((r) => r.id));
  return {
    chiNhanh: branches.map((b) => ({ id: b.id, name: b.name })),
    lop: lopRows.map((r) => {
      const pr = tienDo.get(r.id);
      return {
        id: r.id, code: r.code, chiNhanhId: r.branch_id, ma: (r.programme_code ?? null) as ProgrammeCode | null,
        ft: !!r.is_fast_track,
        tenChuongTrinh: r.programme_code ? (programmeByCode(r.programme_code)?.name ?? null) : null,
        tuan: pr?.currentWeek && pr.totalWeeks && pr.currentWeek >= 1 ? `W${pr.currentWeek}/${pr.totalWeeks}` : null,
        gvcn: r.gvcn ?? null,
      };
    }),
  };
}

// ---------------------------------------------------------------- người nhận Case gợi ý (Q14)

/** Mỗi Case đang mở → người gợi ý nhận ở lớp đích: GV đúng môn → GVCN lớp đích → giữ người cũ (null). */
export function nguoiNhanGoiY(caseRows: readonly { id: number; category: string | null }[], toClassId: number): Map<number, { id: number; ten: string } | null> {
  const out = new Map<number, { id: number; ten: string } | null>();
  if (!caseRows.length) return out;
  const conn = db();
  const bySkill = new Map<string, { id: number; ten: string }>();
  for (const r of conn
    .prepare(
      `SELECT ta.skill, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.status = 'active' AND ta.skill IS NOT NULL`,
    )
    .all(toClassId) as any[]) {
    bySkill.set(r.skill, { id: r.id, ten: r.full_name });
  }
  const gvcnRow = conn
    .prepare(
      `SELECT u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1`,
    )
    .get(toClassId) as any;
  const gvcn = gvcnRow ? { id: gvcnRow.id, ten: gvcnRow.full_name } : null;
  for (const c of caseRows) {
    out.set(c.id, (c.category ? bySkill.get(c.category) : null) ?? gvcn ?? null);
  }
  return out;
}

// ---------------------------------------------------------------- thông báo nơi nhận (Q21)

/** GVCN lớp đích (luôn) + mọi QL có grant chi nhánh đích (chỉ khi đổi chi nhánh) — trừ chính người bấm. */
export function thongBaoChuyenVao(i: {
  sid: number; tenHocVien: string; enrollmentMoiId: number; actorUserId: number | null;
  tuMa: string; tuChiNhanh: string; doiChiNhanh: boolean; lyDo: string | null;
  denLop: { id: number; code: string; branchId: number };
}) {
  const conn = db();
  const doiChiNhanh = i.doiChiNhanh;
  const nguoiNhan = new Map<number, true>();
  for (const r of conn
    .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`)
    .all(i.denLop.id) as any[]) nguoiNhan.set(r.user_id, true);
  const branchDest = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(i.denLop.id) as any;
  const ql = conn
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE r.key = 'manager' AND ur.status = 'active' AND (ur.branch_id = ? OR ur.branch_id IS NULL)`,
    )
    .all(branchDest?.branch_id ?? i.denLop.branchId) as any[];
  const body = `Từ ${i.tuMa} (${i.tuChiNhanh})${i.lyDo ? ` · ${i.lyDo}` : ''}`;
  for (const userId of nguoiNhan.keys()) {
    if (userId === i.actorUserId) continue;
    notify({
      userId, kind: 'transfer_in', title: `${i.tenHocVien} chuyển vào lớp ${i.denLop.code}`, body,
      entityType: 'student', entityId: i.sid, dedupKey: `transfer:${i.enrollmentMoiId}`,
    });
  }
  if (doiChiNhanh) {
    for (const q of ql) {
      if (q.user_id === i.actorUserId || nguoiNhan.has(q.user_id)) continue;
      notify({
        userId: q.user_id, kind: 'transfer_in', title: `${i.tenHocVien} chuyển vào lớp ${i.denLop.code}`, body,
        entityType: 'student', entityId: i.sid, dedupKey: `transfer:${i.enrollmentMoiId}`,
      });
    }
  }
}

// ---------------------------------------------------------------- lớp hết khoá (Q16)

/** Lớp thường đã hết khoá và không còn enrollment `active` nào → `finished`. Một câu, dùng cho cả lô. */
export function dongLopNeuHet(classIds: readonly number[], ngay: string) {
  const ids = [...new Set(classIds)];
  if (!ids.length) return;
  const conn = db();
  const tienDo = classProgressMany(ids as number[]);
  const xong = ids.filter((id) => {
    const pr = tienDo.get(id);
    return pr && pr.phase === 'finished';
  });
  if (!xong.length) return;
  const ph = xong.map(() => '?').join(',');
  const r = conn
    .prepare(
      `UPDATE classes SET status = 'finished', finished_at = ?
        WHERE id IN (${ph}) AND status = 'active'
          AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = classes.id AND e.status = 'active')`,
    )
    .run(ngay, ...xong);
  if (r.changes) {
    writeAudit({ actorUserId: null, action: 'class.finished', entityType: 'class', entityId: null,
      after: { classIds: xong, on: ngay, count: r.changes } });
  }
}

// ---------------------------------------------------------------- thi hành luật (Task 4, Task 5)

export type DongApDung = {
  sid: number;
  toClassId: number;
  ngay: string;
  lyDo?: string | null;
  luuY?: string | null;
  mucTieu?: number | null;
  thangThi?: string | null;
  /** caseId → userId người nhận (Q14). */
  nguoiNhan?: Record<number, number> | null;
  boiCanh: 'giua-khoa' | 'cuoi-khoa';
};

/**
 * ÁP DỤNG luật lộ trình cho một dòng — dùng chung Chuyển lớp một em (Task 4, một dòng) và
 * Chuyển tiếp lớp cả lớp (Task 5, nhiều dòng). Giả định dòng đã qua kiểm hợp lệ ở nơi gọi.
 */
export function apDungMotDong(p: Principal, d: DongApDung): { luat: LuatDoiLop | null; toClassCode: string } {
  const conn = db();
  const enr = lopHienTaiCua(d.sid);
  const toClass = conn.prepare('SELECT * FROM classes WHERE id = ?').get(d.toClassId) as any;
  if (!toClass) throw notFound('Không tìm thấy lớp đích');

  /* Xếp lớp LẦN ĐẦU (chưa từng ghi danh) — không có khoá cũ để đóng, không luật lộ trình nào áp dụng. */
  if (!enr) {
    return tx((): { luat: LuatDoiLop | null; toClassCode: string } => {
      const insEnr = conn
        .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(d.sid, d.toClassId, d.ngay, nowIso());
      conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, d.sid);
      addJourney({
        studentId: d.sid, eventType: 'transfer', eventDate: d.ngay, title: `Chuyển sang lớp ${toClass.code}`,
        detail: [d.lyDo, d.luuY].filter(Boolean).join(' — ') || null, createdBy: p.userId,
      });
      writeAudit({
        actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: d.sid, entityLabel: toClass.code,
        before: { classId: null }, after: { classId: d.toClassId },
      });
      thongBaoChuyenVao({
        sid: d.sid, tenHocVien: (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(d.sid) as any).full_name,
        enrollmentMoiId: Number(insEnr.lastInsertRowid), actorUserId: p.userId,
        tuMa: '—', tuChiNhanh: '—', doiChiNhanh: true, lyDo: d.lyDo ?? null,
        denLop: { id: d.toClassId, code: toClass.code, branchId: toClass.branch_id },
      });
      return { luat: null, toClassCode: toClass.code };
    });
  }

  const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route };
  const denLop: LoaiLop = { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route };
  const luat = luatDoiLop(tuLop, denLop, d.boiCanh);

  return tx((): { luat: LuatDoiLop; toClassCode: string } => {
  conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ?, end_reason = ?, end_kind = ? WHERE id = ?`)
    .run(d.ngay, d.lyDo ?? null, luat.endKind, enr.id);
  const insEnr = conn
    .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
    .run(d.sid, d.toClassId, d.ngay, nowIso());
  conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, d.sid);

  const curCycle = conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(d.sid) as any;
  /*
   * PR-DUYET (T44): target mới chỉ nhận khi giao diện hỏi (sang FT — `canMucTieu`) hoặc người gọi có `cycle.edit` (Quản lý).
   * GVCN gửi `mucTieu` thẳng qua API lúc FT → FT mở lộ trình mới thì BỎ QUA — giữ target cũ như giao diện.
   */
  const mucTieu = luat.canMucTieu || can(p, PERMISSIONS.CYCLE_EDIT, { studentId: d.sid }) ? d.mucTieu : undefined;
  if (luat.khoa === 'dong-mo') {
    if (curCycle) conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(d.ngay, curCycle.id);
    const seq = ((conn.prepare('SELECT MAX(seq) n FROM learning_cycles WHERE student_id = ?').get(d.sid) as any)?.n ?? 0) + 1;
    const route = denLop.ft ? (toClass.route ?? curCycle?.route ?? 'LT1') : null;   // lộ trình mới = lộ trình lớp đích (M-20)
    const startPeriodId = denLop.ft ? ensurePeriod(mondayOf(d.ngay)).id : (toClass.start_period_id ?? null);
    const moiId = Number(conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, khong_cam_ket, exam_month, start_period_id, started_at, status, created_at)
         VALUES (?,?,?,?,?,?,?,?,?, 'active', ?)`,
      )
      .run(d.sid, seq, route, denLop.ma, mucTieu ?? (tuLop.ft && denLop.ft ? curCycle?.target_score ?? null : null),   // Q7: FT → FT giữ target cũ
        mucTieu == null && tuLop.ft && denLop.ft && curCycle?.khong_cam_ket ? 1 : 0,   // … kể cả KCK (Q29-1)
        d.thangThi ?? null, startPeriodId, d.ngay, nowIso()).lastInsertRowid);
    if (denLop.ft) {
      taoMtMacDinh(moiId, { actorUserId: p.userId });   // M1: vào lớp FT / đổi LT ↔ RF = lộ trình mới có lịch MT mặc định
      if (tuLop.ft && curCycle) chuyenCaseSangLoTrinh(p.userId, d.sid, curCycle.id, moiId, route, d.ngay);   // K5-60
    }
  }

  /* Q12: bài chưa làm CHỈ đi theo em khi GIỮ khoá — đóng khoá thì lượt planned ở lại lớp cũ. */
  if (luat.khoa === 'giu' && curCycle) {
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE cycle_id = ? AND status = 'planned'`).run(d.toClassId, curCycle.id);
  }

  if (luat.dongCase) closeCasesOnProgrammeSwitch(p.userId, d.sid, luat.dongCase, d.ngay);

  if (d.nguoiNhan) {
    for (const [caseIdStr, userId] of Object.entries(d.nguoiNhan)) {
      const caseId = Number(caseIdStr);
      const c = conn.prepare('SELECT owner_user_id FROM sos_cases WHERE id = ? AND status != \'done\'').get(caseId) as any;
      if (!c) continue;
      conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ?').run(userId, nowIso(), caseId);
      conn
        .prepare(
          `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
           VALUES (?, 'owner', ?, 'bàn giao khi chuyển lớp', ?, ?)`,
        )
        .run(caseId, c.owner_user_id, p.userId, nowIso());
    }
  }

  addJourney({
    studentId: d.sid, eventType: d.boiCanh === 'cuoi-khoa' ? 'promote' : 'transfer', eventDate: d.ngay,
    title: d.boiCanh === 'cuoi-khoa' ? `Lên lớp ${toClass.code}` : `Chuyển sang lớp ${toClass.code}`,
    detail: [d.lyDo, d.luuY].filter(Boolean).join(' — ') || null, createdBy: p.userId,
  });
  writeAudit({
    actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: d.sid, entityLabel: toClass.code,
    before: { classId: enr.class_id, endKind: null }, after: { classId: d.toClassId, endKind: luat.endKind },
  });
  thongBaoChuyenVao({
    sid: d.sid, tenHocVien: (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(d.sid) as any).full_name,
    enrollmentMoiId: Number(insEnr.lastInsertRowid), actorUserId: p.userId,
    tuMa: enr.code, tuChiNhanh: enr.branch_name, doiChiNhanh: enr.branch_id !== toClass.branch_id,
    lyDo: d.lyDo ?? null, denLop: { id: d.toClassId, code: toClass.code, branchId: toClass.branch_id },
  });

  return { luat, toClassCode: toClass.code };
  });
}

// ---------------------------------------------------------------- GET /students/:id/chuyen-lop

/** Case đang mở + luật áp dụng nếu đã chọn lớp đích — bày sẵn cho panel Chuyển lớp (Q13, Q14). */
export function xemChuyenLop(p: Principal, sid: number, toClassId?: number | null) {
  const enr = lopHienTaiCua(sid);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền chuyển lớp học viên này.');
  const conn = db();
  const openCases = conn
    .prepare(
      `SELECT sc.id, sc.title, sc.category, u.full_name AS owner FROM sos_cases sc
         LEFT JOIN users u ON u.id = sc.owner_user_id
        WHERE sc.student_id = ? AND sc.status != 'done' ORDER BY sc.id`,
    )
    .all(sid) as any[];

  let luat: LuatDoiLop | null = null;
  let goiY = new Map<number, { id: number; ten: string } | null>();
  let doiChiNhanh = false;
  if (toClassId) {
    const toClass = lopDichHopLe(toClassId, enr.class_id);
    if (!toClass) throw badRequest('Lớp đích không hợp lệ.');
    const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route };
    const denLop: LoaiLop = { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route };
    luat = luatDoiLop(tuLop, denLop, 'giua-khoa');
    goiY = nguoiNhanGoiY(openCases, toClassId);
    doiChiNhanh = enr.branch_id !== toClass.branch_id;
  }

  return {
    hienTai: {
      lop: { id: enr.class_id, code: enr.code }, ma: (enr.programme_code ?? null) as ProgrammeCode | null,
      ft: !!enr.is_fast_track, chiNhanhId: enr.branch_id,
    },
    caseMo: openCases.map((c) => ({
      id: c.id, title: c.title, category: c.category, owner: c.owner ?? null,
      seDong: toClassId ? luat!.dongCase !== null : false,
      goiY: toClassId ? (goiY.get(c.id) ?? null) : null,
    })),
    luat, canLuuY: openCases.length === 0, doiChiNhanh,
  };
}

// ---------------------------------------------------------------- Chuyển tiếp CẢ LỚP (Task 5, Q20 — ghi theo nhóm)

export type DongCaLop = {
  sid: number; huong: 'len_lop' | 'hoc_lai' | 'fast_track';
  toClassId: number; toClass: { ma: ProgrammeCode | null; ft: boolean; branchId: number; code: string; route?: string | null };
  mucTieu?: number | null;
  thangThi?: string | null;
};

/**
 * ÁP DỤNG "lên lớp / học lại / sang Fast Track" cho CẢ LÔ học viên của một lớp đã hết khoá —
 * ghi THEO NHÓM (Q20), không một câu SQL nào lặp theo từng em, TRỪ `closeCasesOnProgrammeSwitch`
 * của những em sang FT (ngoại lệ duy nhất được phép, S17).
 *
 * Mọi dòng trong `dongs` đứng CÙNG lớp nguồn (`boiCanh = 'cuoi-khoa'`, từ luôn là lớp thường) —
 * nên `luatDoiLop` luôn ra `khoa = 'dong-mo'` bất kể lớp đích, và lượt Test chưa làm luôn Ở LẠI
 * lớp cũ (Q12) — không cần đọc/ghi `assessment_attempts` ở đây.
 */
export function apDungCaLop(p: Principal, o: {
  fromClass: { id: number; code: string };
  ngay: string;
  dongs: DongCaLop[];
}): void {
  if (!o.dongs.length) return;
  const conn = db();
  const now = nowIso();

  // 1) Đóng enrollment cũ — nhóm theo end_kind (tối đa 3 câu, không phụ thuộc số em).
  for (const huong of ['len_lop', 'hoc_lai', 'fast_track'] as const) {
    const ids = o.dongs.filter((d) => d.huong === huong).map((d) => d.sid);
    if (!ids.length) continue;
    const endKind = huong === 'fast_track' ? 'sang_ft' : huong;
    const ph = ids.map(() => '?').join(',');
    conn
      .prepare(
        `UPDATE enrollments SET status = 'transferred', ended_at = ?, end_kind = ?
          WHERE class_id = ? AND status = 'active' AND student_id IN (${ph})`,
      )
      .run(o.ngay, endKind, o.fromClass.id, ...ids);
  }

  // 2) Mở enrollment mới — MỘT INSERT nhiều dòng.
  {
    const rows = o.dongs.map(() => '(?,?,\'active\',?,?)').join(',');
    const params = o.dongs.flatMap((d) => [d.sid, d.toClassId, o.ngay, now]);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES ${rows}`).run(...params);
  }

  // 3) students.branch_id — nhóm theo chi nhánh đích (thường chỉ 1).
  {
    const byBranch = new Map<number, number[]>();
    for (const d of o.dongs) {
      if (!byBranch.has(d.toClass.branchId)) byBranch.set(d.toClass.branchId, []);
      byBranch.get(d.toClass.branchId)!.push(d.sid);
    }
    for (const [branchId, ids] of byBranch) {
      const ph = ids.map(() => '?').join(',');
      conn.prepare(`UPDATE students SET branch_id = ? WHERE id IN (${ph})`).run(branchId, ...ids);
    }
  }

  // 4) Đóng khoá đang chạy — MỘT UPDATE (mọi dòng ở đây đều dong-mo).
  {
    const sids = o.dongs.map((d) => d.sid);
    const ph = sids.map(() => '?').join(',');
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE student_id IN (${ph}) AND status = 'active'`)
      .run(o.ngay, ...sids);
  }

  // 5) Mở khoá mới — đọc seq theo lô (MỘT câu), rồi MỘT INSERT nhiều dòng.
  {
    const sids = o.dongs.map((d) => d.sid);
    const ph = sids.map(() => '?').join(',');
    const seqRows = conn
      .prepare(`SELECT student_id, MAX(seq) n FROM learning_cycles WHERE student_id IN (${ph}) GROUP BY student_id`)
      .all(...sids) as any[];
    const seqOf = new Map(seqRows.map((r) => [r.student_id, r.n as number]));
    const toClassIds = [...new Set(o.dongs.map((d) => d.toClassId))];
    const ph2 = toClassIds.map(() => '?').join(',');
    const toClassRows = conn.prepare(`SELECT id, start_period_id FROM classes WHERE id IN (${ph2})`).all(...toClassIds) as any[];
    const startPeriodOf = new Map(toClassRows.map((r) => [r.id, r.start_period_id as number | null]));
    /* Cùng một ngày hiệu lực cho cả lớp — chỉ cần MỘT lần ensurePeriod cho mọi em sang FT. */
    const ftPeriodId = o.dongs.some((d) => d.toClass.ft) ? ensurePeriod(mondayOf(o.ngay)).id : null;

    const rows = o.dongs.map(() => '(?,?,?,?,?,?,?,?,\'active\',?)').join(',');
    /* PR-DUYET (T44): target chỉ nhận khi sang FT (bắt buộc có) hoặc người gọi có `cycle.edit` — như Chuyển lớp một em. */
    /* Mọi em cùng MỘT lớp nguồn → kiểm quyền một lần theo lớp (không truy vấn theo từng em, Q20). */
    const coSuaTarget = can(p, PERMISSIONS.CYCLE_EDIT, { classId: o.fromClass.id });
    const params = o.dongs.flatMap((d) => [
      d.sid, (seqOf.get(d.sid) ?? 0) + 1, d.toClass.ft ? (d.toClass.route ?? 'LT1') : null, d.toClass.ma,
      d.toClass.ft || coSuaTarget ? d.mucTieu ?? null : null, d.thangThi ?? null,
      d.toClass.ft ? ftPeriodId : (startPeriodOf.get(d.toClassId) ?? null), o.ngay, now,
    ]);
    conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_month, start_period_id, started_at, status, created_at)
         VALUES ${rows}`,
      )
      .run(...params);
    /* M1: em sang FT có lịch MT mặc định. INSERT nhiều dòng không trả id → đọc lại MỘT câu; tạo lượt theo lô (PR-TOC). */
    const ftSids = o.dongs.filter((d) => d.toClass.ft).map((d) => d.sid);
    if (ftSids.length) {
      const ftCycles = conn.prepare(
        `SELECT id FROM learning_cycles WHERE student_id IN (${ftSids.map(() => '?').join(',')}) AND status = 'active' AND route IS NOT NULL`,
      ).all(...ftSids) as any[];
      taoMtMacDinhLo(ftCycles.map((c) => ({ cycleId: c.id })), { actorUserId: p.userId });
    }
  }

  // 6) Case: chỉ em sang FT đóng Case lớp thường — ngoại lệ per-em DUY NHẤT được phép (S17).
  /* PR-TOC: lọc trước MỘT câu — chỉ em còn Case mở / tín hiệu chờ mới đi từng em (em không có gì thì hàm đóng vốn không làm gì). */
  const sangFt = o.dongs.filter((d) => d.huong === 'fast_track').map((d) => d.sid);
  const coViecMo = new Set<number>();
  theoLo(sangFt, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT COALESCE(sc.student_id, a.student_id) AS sid FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.status != 'done' AND COALESCE(sc.student_id, a.student_id) IN (${ph})
       UNION SELECT student_id FROM case_signals WHERE status = 'pending' AND student_id IN (${ph})`).all(...lo, ...lo) as any[]) {
      coViecMo.add(r.sid);
    }
  }, THAM_SO_TOI_DA / 2);
  for (const sid of sangFt) {
    if (coViecMo.has(sid)) closeCasesOnProgrammeSwitch(p.userId, sid, 'ft', o.ngay);
  }

  // 7) Hành trình — MỘT INSERT nhiều dòng.
  {
    const rows = o.dongs.map(() => '(?,?,?,?,NULL,NULL,?,?)').join(',');
    const params = o.dongs.flatMap((d) => [
      d.sid, 'promote', o.ngay,
      d.huong === 'fast_track' ? `Chuyển sang Fast Track ${d.toClass.code}`
        : d.huong === 'hoc_lai' ? `Học lại ${d.toClass.code}` : `Lên lớp ${d.toClass.code}`,
      p.userId, now,
    ]);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
         VALUES ${rows}`,
      )
      .run(...params);
  }
}

/**
 * Bảo lưu cả lô — MỘT UPDATE học viên, ghi `end_reason` THEO NHÓM lý do (số nhóm bị chặn bởi số
 * lý do KHÁC NHAU trong lô, không phải theo từng em), MỘT INSERT hành trình. Ghi `created_by`
 * đúng người bấm xác nhận (sửa sau rà PR #86, vấn đề 7c — trước đây ghi NULL).
 */
export function apDungBaoLuuCaLop(p: Principal, o: { fromClassId: number; ngay: string; dongs: { sid: number; lyDo: string }[] }): void {
  if (!o.dongs.length) return;
  const conn = db();
  const now = nowIso();
  const ids = o.dongs.map((d) => d.sid);
  const ph = ids.map(() => '?').join(',');
  conn.prepare(`UPDATE students SET status = 'inactive' WHERE id IN (${ph})`).run(...ids);
  const byLyDo = new Map<string, number[]>();
  for (const d of o.dongs) {
    if (!byLyDo.has(d.lyDo)) byLyDo.set(d.lyDo, []);
    byLyDo.get(d.lyDo)!.push(d.sid);
  }
  for (const [lyDo, sids] of byLyDo) {
    const ph2 = sids.map(() => '?').join(',');
    conn
      .prepare(
        `UPDATE enrollments SET status = 'paused', end_kind = 'bao_luu', end_reason = ?
          WHERE class_id = ? AND status = 'active' AND student_id IN (${ph2})`,
      )
      .run(lyDo, o.fromClassId, ...sids);
  }
  const rows = o.dongs.map(() => '(?,?,?,?,NULL,NULL,?,?)').join(',');
  const params = o.dongs.flatMap((d) => [d.sid, 'pause', o.ngay, `Bảo lưu — ${d.lyDo}`, p.userId, now]);
  conn
    .prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
       VALUES ${rows}`,
    )
    .run(...params);
}
