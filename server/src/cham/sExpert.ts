/**
 * S EXPERT (SV-S-EXPERT, V5 `10` mục 2 · `08` mục 5) — lượt Speaking với chuyên gia bổ sung riêng từng HV. KHÔNG phải lượt MT: bảng riêng `s_expert`,
 * không thay S MT, không vào luồng S chấm chéo; điểm chỉ lưu (band + nhận xét), KHÔNG vào Overall / SOS / Case / KPI / Phân tích / nợ chấm / đếm việc
 * tới khi chủ SP chốt luật điểm (XM-1). Hiện ở Lịch Test tuần (`lichTest().sEx`) + Kế hoạch Test (`hang[].sEx`), đánh dấu `loai: 's-ex'`.
 *
 * QUYỀN (máy chủ, mỗi lần ghi): thêm / đổi ngày / xoá = `plan.week` của HV (QL, Admin, QT — như "chỉ QL thêm MT tay"); chấm (điểm, nhận xét) =
 * GV Speaking cùng chi nhánh như S MT (N7: phân công hoặc hồ sơ `user_skills`) hoặc người có `plan.week` (nhập hộ). Lịch sử: `audit_logs` s_expert.*.
 */
import { db, theoLo, tx } from '../db.ts';
import { kiemBand, NHAN_XET_TOI_DA, PERMISSIONS, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso, toInt } from '../util.ts';
import { branchesOfStudent, can, coTheXemLuotCham, grantGvNhapDiem, laGvSpeaking, require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { mondayOf } from '../platform/week.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

export type DongSEx = {
  id: number; loai: 's-ex'; studentId: number; ten: string; ma: string; classId: number | null; classCode: string | null;
  tuan: string; tuanMa: string; ngay: string | null; diem: number | null; nhanXet: string | null;
  nguoiCham: string | null; chamLuc: string | null; themBoi: string | null; themLuc: string;
  /** Đổi ngày / xoá (QL / Admin) · nhập điểm + nhận xét. */
  sua: boolean; cham: boolean;
};

const QL_MSG = 'Chỉ Quản lý / Admin thêm, dời hoặc xoá lượt S Expert.';
const laQl = (p: Principal, studentId: number) => can(p, PERMISSIONS.PLAN_WEEK, { studentId });

/** GV Speaking cùng chi nhánh với em (như S MT chấm chéo, N7) — hoặc QL / Admin nhập hộ. */
export function chamDuoc(p: Principal, studentId: number): boolean {
  if (laQl(p, studentId)) return true;
  if (!laGvSpeaking(p)) return false;
  const cn = branchesOfStudent(studentId);
  return grantGvNhapDiem(p).some((g) => g.branchId === null || cn.includes(g.branchId));
}

/** Lớp đang học (một lớp, id nhỏ nhất) của em — để Lịch Test lọc theo phạm vi / lớp và hiện mã lớp. */
const COT = `x.*, s.full_name AS ten, s.student_code AS ma, c.id AS lop_id, c.code AS lop_code, c.branch_id AS lop_cn,
  uc.full_name AS cham_ten, ut.full_name AS them_ten
  FROM s_expert x JOIN students s ON s.id = x.student_id
  LEFT JOIN classes c ON c.id = (SELECT e.class_id FROM enrollments e WHERE e.student_id = x.student_id AND e.status = 'active' ORDER BY e.class_id LIMIT 1)
  LEFT JOIN users uc ON uc.id = x.cham_boi LEFT JOIN users ut ON ut.id = x.them_boi`;

function dong(p: Principal, r: any, today: string): DongSEx & { branchId: number | null } {
  return {
    id: r.id, loai: 's-ex', studentId: r.student_id, ten: r.ten, ma: r.ma, classId: r.lop_id ?? null, classCode: r.lop_code ?? null, branchId: r.lop_cn ?? null,
    tuan: r.tuan, tuanMa: tuanLich(r.tuan, today), ngay: r.ngay ?? null, diem: r.diem ?? null, nhanXet: r.nhan_xet ?? null,
    nguoiCham: r.cham_ten ?? null, chamLuc: r.cham_luc ?? null, themBoi: r.them_ten ?? null, themLuc: r.them_luc,
    sua: laQl(p, r.student_id), cham: chamDuoc(p, r.student_id),
  };
}

/** Kế hoạch Test: lượt S Ex của các em (mới trước) — lưới đã lọc quyền theo lớp. */
export function sExCuaHv(p: Principal, studentIds: readonly number[], today: string = demoToday()): Map<number, DongSEx[]> {
  const m = new Map<number, DongSEx[]>();
  theoLo([...studentIds], (lo, ph) => {
    for (const r of db().prepare(`SELECT ${COT} WHERE x.student_id IN (${ph}) ORDER BY x.tuan DESC, x.id DESC`).all(...lo) as any[]) {
      const { branchId: _b, ...d } = dong(p, r, today);
      (m.get(d.studentId) ?? m.set(d.studentId, []).get(d.studentId)!).push(d);
    }
  });
  return m;
}

/** Lịch Test tuần: lượt S Ex của tuần, em đang học, cùng bộ lọc lớp / chi nhánh với hàng lớp; người xem thấy lớp (đường chấm) hoặc chấm được em. */
export function sExTuan(p: Principal, weekStart: string, o: { branchId?: number | null; giuLop: (classId: number) => boolean }, today: string): DongSEx[] {
  return (db().prepare(`SELECT ${COT} WHERE x.tuan = ? AND ${HV_DANG_HOC_SQL('s')} ORDER BY c.code, s.full_name, x.id`).all(weekStart) as any[])
    .map((r) => dong(p, r, today))
    .filter((d) => d.classId && (!o.branchId || d.branchId === o.branchId) && o.giuLop(d.classId)
      && (d.cham || coTheXemLuotCham(p, { classId: d.classId })))
    .map(({ branchId: _b, ...d }) => d);
}

// ------------------------------------------------------------------ ghi

type Than = { tuan: string; ngay: string | null; diem: number | null; nhanXet: string | null };

function docLich(body: Record<string, unknown>): Pick<Than, 'tuan' | 'ngay'> {
  if (body.ngay != null) {
    if (!isIsoDate(body.ngay)) throw badRequest('Ngày không hợp lệ.');
    return { tuan: mondayOf(body.ngay), ngay: body.ngay };
  }
  if (!isIsoDate(body.tuan)) throw badRequest('Thiếu ngày / tuần của lượt S Expert.');
  return { tuan: mondayOf(body.tuan), ngay: null };
}

/** Thân yêu cầu gộp lên bản cũ: khoá có mặt mới đổi. Band 0..9 bậc 0.5 — không suy luật điểm nào khác (XM-1). */
function docThan(body: Record<string, unknown>, cu: Than | null, today: string): Than {
  const lich = cu && !('ngay' in body) && !('tuan' in body) ? { tuan: cu.tuan, ngay: cu.ngay } : docLich(body);
  let diem = cu?.diem ?? null;
  if ('diem' in body) {
    if (body.diem !== null && kiemBand(body.diem)) throw badRequest(kiemBand(body.diem)!);
    diem = body.diem as number | null;
  }
  const nhanXet = 'nhanXet' in body ? chuTuDo(body.nhanXet, 'Nhận xét', NHAN_XET_TOI_DA) : cu?.nhanXet ?? null;
  if (diem !== null && lich.tuan > mondayOf(today)) throw badRequest('Chưa tới tuần của lượt S Expert — chưa nhập điểm được.');
  return { ...lich, diem, nhanXet };
}

const anh = (id: number, t: Than) => ({ id, ...t });
const nhan = (studentId: number, tuan: string, today: string) => {
  const s = db().prepare('SELECT student_code AS ma FROM students WHERE id = ?').get(studentId) as { ma: string };
  return `${s.ma} · ${tuanLich(tuan, today)} · S Expert`;
};

/** POST /s-expert { studentId, ngay | tuan, diem?, nhanXet? } — chỉ QL / Admin (máy chủ kiểm, vai khác 403). */
export function themSEx(p: Principal, body: Record<string, unknown>) {
  const today = demoToday();
  const studentId = toInt(body.studentId);
  if (!studentId) throw badRequest('Thiếu học viên.');
  if (!db().prepare('SELECT 1 AS c FROM students WHERE id = ?').get(studentId)) throw notFound('Không tìm thấy học viên.');
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, QL_MSG);
  const t = docThan(body, null, today);
  const luc = nowIso();
  const chamBoi = t.diem !== null || t.nhanXet ? p.userId : null;
  return tx(() => {
    const id = Number(db().prepare(
      'INSERT INTO s_expert (student_id, tuan, ngay, diem, nhan_xet, cham_boi, cham_luc, them_boi, them_luc) VALUES (?,?,?,?,?,?,?,?,?)',
    ).run(studentId, t.tuan, t.ngay, t.diem, t.nhanXet, chamBoi, chamBoi ? luc : null, p.userId, luc).lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 's_expert.them', entityType: 'student', entityId: studentId, entityLabel: nhan(studentId, t.tuan, today), before: null, after: anh(id, t) });
    return { id, themBoi: p.fullName, themLuc: luc };
  });
}

function docLuot(id: number) {
  const r = db().prepare('SELECT id, student_id, tuan, ngay, diem, nhan_xet FROM s_expert WHERE id = ?').get(id) as any;
  if (!r) throw notFound('Không tìm thấy lượt S Expert.');
  return { studentId: r.student_id as number, t: { tuan: r.tuan, ngay: r.ngay ?? null, diem: r.diem ?? null, nhanXet: r.nhan_xet ?? null } as Than };
}

/**
 * PUT /s-expert/:id { ngay | tuan?, diem?, nhanXet? } — khoá có mặt mới đổi. Đổi ngày → QL / Admin; điểm / nhận xét → GV Speaking cùng chi nhánh
 * hoặc QL / Admin (ghi người chấm). Lưu y nguyên = không ghi.
 */
export function suaSEx(p: Principal, id: number, body: Record<string, unknown>) {
  const today = demoToday();
  const { studentId, t: cu } = docLuot(id);
  const t = docThan(body, cu, today);
  const doiLich = t.tuan !== cu.tuan || t.ngay !== cu.ngay;
  const doiDiem = t.diem !== cu.diem || t.nhanXet !== cu.nhanXet;
  if (!doiLich && !doiDiem) return { id, doi: false };
  if (doiLich) require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, QL_MSG);
  if (doiDiem && !chamDuoc(p, studentId)) throw forbidden('Chỉ GV Speaking cùng chi nhánh hoặc Quản lý / Admin chấm được S Expert của học viên này.');
  const luc = nowIso();
  return tx(() => {
    db().prepare(`UPDATE s_expert SET tuan = ?, ngay = ?, diem = ?, nhan_xet = ?, sua_boi = ?, sua_luc = ?
      ${doiDiem ? ', cham_boi = ?, cham_luc = ?' : ''} WHERE id = ?`)
      .run(t.tuan, t.ngay, t.diem, t.nhanXet, p.userId, luc, ...(doiDiem ? [p.userId, luc] : []), id);
    writeAudit({
      actorUserId: p.userId, action: doiLich ? 's_expert.sua' : 's_expert.cham', entityType: 'student', entityId: studentId,
      entityLabel: nhan(studentId, t.tuan, today), before: anh(id, cu), after: anh(id, t),
    });
    return { id, doi: true, suaBoi: p.fullName, suaLuc: luc };
  });
}

/** DELETE /s-expert/:id — chỉ QL / Admin; xoá hẳn dòng, nhật ký giữ bản trước khi xoá. */
export function xoaSEx(p: Principal, id: number) {
  const today = demoToday();
  const { studentId, t } = docLuot(id);
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, QL_MSG);
  return tx(() => {
    db().prepare('DELETE FROM s_expert WHERE id = ?').run(id);
    writeAudit({ actorUserId: p.userId, action: 's_expert.xoa', entityType: 'student', entityId: studentId, entityLabel: nhan(studentId, t.tuan, today), before: anh(id, t), after: null });
    return { id, xoa: true };
  });
}
