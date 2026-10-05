import { db, theoLo, tx } from '../db.ts';
import {
  CO_DIEM_SQL, KCK, LY_DO_TOI_THIEU, PERMISSIONS, cauMtSeDoi, cotLuoiNhap, type VanDeNhap,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { HttpError, badRequest, forbidden, kiemKieuO, notFound, nowIso } from '../util.ts';
import { chuanHoaSuaHoSo, updateStudent } from '../students/students.ts';
import {
  CHI_QL_SUA, docDiemXuatPhat, docDuKienThi, docTarget, docTuanBatDau, reviseTarget, setBaseline, updateCycle,
} from '../fasttrack/cycles.ts';
import { donKhoaGuiCu, laLopThuong } from './intake.ts';

/**
 * PR-SL (Q-0310-3): SỬA THÔNG TIN CẢ LỚP — Họ tên, Ngày sinh, Email, Tuần bắt đầu, Dự kiến thi, Target, Điểm đầu vào. Mỗi dòng chỉ gửi
 * trường ĐÃ ĐỔI. Luật kiểm là của đường sửa một em (`chuanHoaSuaHoSo`, `docTuanBatDau`, `docDuKienThi`, `docTarget`, `docDiemXuatPhat`),
 * không viết lại. Lưu: kiểm HẾT (thuộc lớp, quyền theo trường, dữ liệu) trước khi ghi, rồi MỘT giao dịch gọi lần lượt các hàm ghi sẵn có
 * (giao dịch lồng = savepoint, `db.ts`) — lỗi ở bất kỳ dòng nào cuộn lại cả lô. Cột theo `cotLuoiNhap(lopThuong)`: lớp thường không có
 * điểm đầu vào (chủ sản phẩm 04/10: có Target + Dự kiến thi + Tuần bắt đầu).
 */
export type DongSua = {
  studentId: number; fullName?: string; dob?: string | null; email?: string | null; startWeek?: string;
  examDate?: string | null; target?: number | string | null; baseline?: number | null;
};
type DauVao = { rows: DongSua[]; lyDoTarget?: string };

export const TOI_DA_DONG_SUA_CA_LOP = 60;
const HO_SO = ['fullName', 'dob', 'email'] as const;
const LO_TRINH = ['startWeek', 'examDate', 'target', 'baseline'] as const;
const NHAN: Record<string, string> = { fullName: 'Họ tên', dob: 'Ngày sinh', email: 'Email', startWeek: 'Tuần bắt đầu', examDate: 'Dự kiến thi', target: 'Target', baseline: 'Điểm đầu vào' };

/**
 * Em ĐANG HỌC lớp `classId` (`ids` = chỉ những em này; `null` = cả lớp) + lộ trình hiện tại (đang chạy, seq lớn nhất — như
 * `currentCycle`), đọc theo lô. Chung cho panel (đọc) và kiểm lô — panel hiện đúng lộ trình mà lưu sẽ sửa.
 */
function emVaLoTrinh(classId: number, ids: number[] | null) {
  const conn = db();
  const em = new Map<number, any>();
  const loTrinh = new Map<number, any>();
  const dsEm = ids === null
    ? (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id
        WHERE e.class_id = ? AND e.status = 'active'`).all(classId) as any[]).map((r) => r.id as number)
    : [...new Set(ids)];
  theoLo(dsEm, (lo, ph) => {
    for (const s of conn.prepare(`SELECT s.id, s.full_name, s.dob, s.email FROM students s JOIN enrollments e ON e.student_id = s.id
        WHERE e.class_id = ? AND e.status = 'active' AND s.id IN (${ph})`).all(classId, ...lo) as any[]) em.set(s.id, s);
    for (const c of conn.prepare(`SELECT * FROM learning_cycles WHERE student_id IN (${ph}) ORDER BY (status = 'active') ASC, seq ASC`)
      .all(...lo) as any[]) loTrinh.set(c.student_id, c);
  });
  return { em, loTrinh };
}

/**
 * Dữ liệu panel "Sửa thông tin học viên": mọi em đang học, A→Z, giá trị HIỆN TẠI của bảy ô (Q-0310-3). `coTheSuaTarget` chỉ để panel
 * khoá cột Target (máy chủ vẫn kiểm `cycle.edit` từng em khi lưu).
 */
export function duLieuSuaCaLop(p: Principal, classId: number) {
  const conn = db();
  const cls = conn.prepare('SELECT id, code, programme_code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id }, `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền.`);
  const { em, loTrinh } = emVaLoTrinh(cls.id, null);
  const tuan = new Map<number, string>();
  theoLo([...new Set([...loTrinh.values()].map((c) => c.start_period_id).filter((v): v is number => v != null))], (lo, ph) => {
    for (const w of conn.prepare(`SELECT id, week_start FROM report_periods WHERE id IN (${ph})`).all(...lo) as any[]) tuan.set(w.id, w.week_start);
  });
  const rows = [...em.values()].map((s) => {
    const c = loTrinh.get(s.id) ?? null;
    return {
      studentId: s.id as number, fullName: s.full_name as string, dob: (s.dob ?? null) as string | null, email: (s.email ?? null) as string | null,
      coLoTrinh: !!c,
      startWeek: (c?.start_period_id != null ? tuan.get(c.start_period_id) ?? null : null) as string | null,
      examDate: (c ? c.exam_date ?? c.exam_month ?? null : null) as string | null,
      target: (c ? (c.khong_cam_ket ? KCK : c.target_score ?? null) : null) as number | string | null,
      baseline: (c?.baseline_score ?? null) as number | null,
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
  return {
    lop: { id: cls.id as number, code: cls.code as string }, lopThuong: laLopThuong(cls.programme_code ?? null),
    coTheSuaTarget: can(p, PERMISSIONS.CYCLE_EDIT, { classId: cls.id }), rows,
  };
}

/** Kiểm cả lô, KHÔNG ghi gì. Ném 400 (dạng lô, em ngoài lớp) / 403 (quyền theo trường); lỗi dữ liệu từng ô → `issues`. */
function kiemLo(p: Principal, classId: number, input: DauVao) {
  if (!Array.isArray(input?.rows) || input.rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) {
    throw badRequest('Dữ liệu sửa không hợp lệ — cần danh sách dòng.');
  }
  if (input.rows.length > TOI_DA_DONG_SUA_CA_LOP) throw badRequest(`Tối đa ${TOI_DA_DONG_SUA_CA_LOP} học viên một lần sửa.`);
  const conn = db();
  const cls = conn.prepare('SELECT id, code, programme_code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id }, `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền.`);
  const cot = new Set<string>(cotLuoiNhap(laLopThuong(cls.programme_code ?? null)).map((c) => c.key));

  const ids = input.rows.map((r) => Number(r.studentId));
  const lap = ids.find((id, i) => ids.indexOf(id) !== i);
  if (lap !== undefined) throw badRequest(`Học viên #${lap} có hai dòng trong lô.`);
  const { em, loTrinh } = emVaLoTrinh(cls.id, ids.filter(Number.isInteger));

  const dong = input.rows.map((r, i) => {
    const s = em.get(ids[i]);
    if (!s) throw badRequest(`Học viên #${r.studentId} không thuộc lớp này.`);
    kiemKieuO(r as Record<string, unknown>, ['fullName', 'dob', 'email', 'startWeek', 'examDate'], ['target', 'baseline'],
      (k) => `${s.full_name} · ${NHAN[k] ?? k}`);
    const c = loTrinh.get(s.id) ?? null;
    const issues: VanDeNhap[] = [];
    const thu = <T>(field: string, fn: () => T): T | undefined => {
      try { return fn(); } catch (e) {
        if (!(e instanceof HttpError) || e.status !== 400) throw e;
        issues.push({ row: i + 1, field, message: e.message, muc: 'loi' });
        return undefined;
      }
    };
    /* QUYỀN THEO TRƯỜNG, trước mọi lần ghi: hồ sơ + lộ trình (trừ Target) cần `student.edit`; đổi Target THẬT cần `cycle.edit`. */
    const coSua = [...HO_SO, ...LO_TRINH].some((k) => k !== 'target' && r[k] !== undefined);
    if (coSua && !can(p, PERMISSIONS.STUDENT_EDIT, { studentId: s.id })) throw forbidden(`Bạn không có quyền sửa học viên ${s.full_name}.`);
    let doiTarget = false;
    if (r.target !== undefined) {
      const t = thu('target', () => docTarget(r.target));
      doiTarget = !t || !c || t.target !== (c.target_score ?? null) || t.kck !== !!c.khong_cam_ket;
      if (doiTarget && !can(p, PERMISSIONS.CYCLE_EDIT, { studentId: s.id })) throw new HttpError(403, CHI_QL_SUA);
    }

    const hoSo = Object.fromEntries(HO_SO.filter((k) => r[k] !== undefined).map((k) => [k, r[k]]));
    for (const k of Object.keys(hoSo)) thu(k, () => chuanHoaSuaHoSo({ [k]: hoSo[k] }));
    if (LO_TRINH.some((k) => r[k] !== undefined) && !c) issues.push({ row: i + 1, field: 'studentId', message: 'Học viên chưa có lộ trình.', muc: 'loi' });
    let tuanMoi: string | undefined;
    if (c && r.startWeek !== undefined) tuanMoi = thu('startWeek', () => docTuanBatDau(c, r.startWeek));
    if (c && r.examDate !== undefined) thu('examDate', () => docDuKienThi(c, r.examDate));
    if (r.baseline !== undefined) {
      if (!cot.has('baselineScore')) issues.push({ row: i + 1, field: 'baseline', message: 'Lớp thường không có điểm đầu vào.', muc: 'loi' });
      else if (r.baseline !== null) thu('baseline', () => docDiemXuatPhat(r.baseline));
    }
    const cuTuan = c?.start_period_id ?? null;
    return { r, s, c, issues, hoSo, doiTarget, tuanMoi, cuTuan };
  });

  /* Cảnh báo MT sẽ dời (M6) — cùng câu với panel Thông tin HV (`cauMtSeDoi`). Lượt của mọi lộ trình đổi tuần đọc MỘT câu theo lô. */
  const doiTuan = dong.filter((x) => x.c?.route && x.tuanMoi);
  const luotOf = new Map<number, any[]>();
  theoLo(doiTuan.map((x) => x.c.id as number), (lo, ph) => {
    for (const a of conn.prepare(`SELECT a.cycle_id, a.attempt_no AS attemptNo, a.status, a.plan_source AS planSource, ${CO_DIEM_SQL('a')} AS coDiem
        FROM assessment_attempts a WHERE a.cycle_id IN (${ph})`).all(...lo) as any[]) {
      if (!luotOf.has(a.cycle_id)) luotOf.set(a.cycle_id, []);
      luotOf.get(a.cycle_id)!.push({ ...a, scored: !!a.coDiem });
    }
  });
  const tuanCu = new Map<number, string | null>();
  theoLo([...new Set(doiTuan.map((x) => x.cuTuan).filter((v): v is number => v != null))], (lo, ph) => {
    for (const w of conn.prepare(`SELECT id, week_start FROM report_periods WHERE id IN (${ph})`).all(...lo) as any[]) tuanCu.set(w.id, w.week_start);
  });
  const canhBaoMt: Array<{ studentId: number; cau: string }> = [];
  for (const x of doiTuan) {
    if (x.tuanMoi === (x.cuTuan != null ? tuanCu.get(x.cuTuan) : null)) continue;
    const cau = cauMtSeDoi(x.c.route, luotOf.get(x.c.id) ?? [], x.tuanMoi!, demoToday());
    if (cau) canhBaoMt.push({ studentId: x.s.id, cau });
  }
  return { cls, dong, canhBaoMt };
}

export function xemTruocSuaCaLop(p: Principal, classId: number, input: DauVao) {
  const { dong, canhBaoMt } = kiemLo(p, classId, input);
  return { rows: dong.map((x) => ({ studentId: x.s.id as number, issues: x.issues })), canhBaoMt };
}

export function luuSuaCaLop(p: Principal, classId: number, input: DauVao & { idempotencyKey?: string }): { daSua: number } {
  const conn = db();
  const { cls, dong } = kiemLo(p, classId, input);
  /* Chống gửi trùng như `commitIntake`: khoá gắn NGƯỜI GỬI + LỚP, kiểm sau quyền; đọc lại trong giao dịch. */
  const k = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim().slice(0, 100) : '';
  const key = k ? `suacalop:${p.userId}:${cls.id}:${k}` : null;
  const daGhi = () => (key ? (conn.prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as any) : null);
  const seen = daGhi();
  if (seen) return JSON.parse(seen.value);

  const loi = dong.find((x) => x.issues.length);
  if (loi) throw badRequest(`${loi.s.full_name} · ${NHAN[loi.issues[0].field] ?? loi.issues[0].field}: ${loi.issues[0].message}`,
    { rows: dong.filter((x) => x.issues.length).map((x) => ({ studentId: x.s.id, issues: x.issues })) });
  const lyDo = typeof input.lyDoTarget === 'string' ? input.lyDoTarget.trim() : '';
  if (dong.some((x) => x.doiTarget)) {
    if (!lyDo) throw badRequest('Ghi lý do đổi Target.');
    if (lyDo.length < LY_DO_TOI_THIEU) throw badRequest(`Lý do đổi Target cần ít nhất ${LY_DO_TOI_THIEU} ký tự.`);
  }

  return tx(() => {
    const vuaGhi = daGhi();
    if (vuaGhi) return JSON.parse(vuaGhi.value);
    let daSua = 0;
    for (const { r, s, c, hoSo, doiTarget } of dong) {
      try {
        if (Object.keys(hoSo).length) updateStudent(p, s.id, hoSo);
        const ct = { ...(r.startWeek !== undefined ? { startWeek: r.startWeek } : {}), ...(r.examDate !== undefined ? { examDate: r.examDate } : {}) };
        if (Object.keys(ct).length) updateCycle(p, c.id, ct);
        if (r.baseline !== undefined) setBaseline(p, c.id, r.baseline === null ? { source: null } : { source: 'manual', score: r.baseline });
        if (doiTarget) reviseTarget(p, c.id, { newTarget: r.target ?? null, reason: lyDo });
      } catch (e) {
        /* Cả lô cuộn lại (giao dịch ngoài); câu lỗi nói rõ em nào. */
        if (e instanceof HttpError) throw new HttpError(e.status, `${s.full_name}: ${e.message}`, { studentId: s.id });
        throw e;
      }
      if (Object.keys(r).some((f) => f !== 'studentId')) daSua += 1;
    }
    const out = { daSua };
    if (key) {
      donKhoaGuiCu(conn, nowIso());
      conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(key, JSON.stringify(out), nowIso());
    }
    return out;
  });
}
