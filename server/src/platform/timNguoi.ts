import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { normalizeName } from '../util.ts';
import { bangLop, lopDayDu, require_, scopeFor, sqlGvSpeaking, type Principal } from '../permissions.ts';
import { activeClassOf } from '../yThuc/access.ts';
import { PERMISSIONS, type NhomNguoi } from '../../../shared/domain/index.ts';

/**
 * TÌM NGƯỜI CHO Ô CHỌN `ChonNguoi` — `GET /ref/nguoi` (PR-Form F-2, Q2).
 *
 * Khác `searchPeople` (`worklist/meeting.ts`, đòi `MEETING_VIEW`): route này chỉ cần đăng nhập — mọi giáo viên phải tự chọn
 * được người thực hiện cho Case của mình. Bấm là có danh sách (T14): chưa gõ → 20 người, GV cùng lớp đứng đầu; tìm không phân
 * biệt hoa thường / dấu. GV đang dạy lớp của học viên (Q6) — trường hợp thường gặp nhất — luôn đứng đầu.
 */

const ROLE_KEYS_OF: Record<NhomNguoi, readonly string[]> = {
  giao_vien: ['teacher'],
  nhan_vien: ['teacher', 'manager'],
  gv_speaking: ['teacher'],
};
/** `gv_speaking`: GV Speaking theo N7 — kỹ năng S ở hồ sơ HOẶC đang dạy S một lớp FT (`sqlGvSpeaking`, cùng luật `laGvSpeaking` của quyền chấm). */
const KY_NANG_S = (nhom: NhomNguoi, u = 'u') => (nhom === 'gv_speaking' ? ` AND ${sqlGvSpeaking(u)}` : '');

/**
 * Người này có thuộc nhóm `nhom` không: tài khoản đang hoạt động, có vai đúng nhóm đang hoạt động.
 * Không trả `true` cho tài khoản chỉ có vai `system_admin` — nhóm đó không nằm trong `ROLE_KEYS_OF`.
 * Dùng lại ở Task 3 (`server/src/cases/nguoiThucHien.ts`) để kiểm `performerUserId` gửi lên.
 * `branchId` (PR-S5F-b): vai đó phải ở ĐÚNG chi nhánh này — người dạy bổ trợ là GV cùng chi nhánh của lớp.
 */
export function laNguoiHopLe(userId: number, nhom: NhomNguoi, branchId?: number | null): boolean {
  const row = db().prepare(`SELECT ${sqlNguoiHopLe('?', nhom, !!branchId)} AS ok`).get(userId, ...(branchId ? [branchId] : [])) as any;
  return !!row?.ok;
}
/**
 * Luật của `laNguoiHopLe` thành mảnh SQL (EXISTS) để đặt trong câu sẵn có — không thêm một câu cho mỗi dòng (rà #1872 P2-15: điền sẵn tutor kỳ trước).
 * `cot` = cột / tham số id tài khoản; `coChiNhanh` thêm một tham số `?` chi nhánh sau `cot`.
 */
export const sqlNguoiHopLe = (cot: string, nhom: NhomNguoi, coChiNhanh = false): string =>
  `EXISTS (SELECT 1 FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id
     WHERE u.id = ${cot} AND u.status = 'active' AND r.key IN (${ROLE_KEYS_OF[nhom].map((k) => `'${k}'`).join(',')})${coChiNhanh ? ' AND ur.branch_id = ?' : ''}${KY_NANG_S(nhom)})`;

type HangDangDay = { userId: number; skill: string | null };

/** Người đang dạy lớp đó, hiệu lực HÔM NAY (mẫu truy vấn `yThuc/measures.ts` — `defaultOwner`). */
function dangDayLop(classId: number): HangDangDay[] {
  const today = demoToday();
  return db()
    .prepare(
      `SELECT user_id AS userId, skill FROM teacher_assignments
        WHERE class_id = ? AND status = 'active' AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
    )
    .all(classId, today, today) as HangDangDay[];
}

/** GD-5: `cungCn` — có vai ở chi nhánh tham chiếu (chi nhánh lớp của em / của việc / phạm vi người xem); `null` khi không có chi nhánh tham chiếu (Quản trị). */
type HangNguoi = { id: number; name: string; role: string | null; branches: string[]; cungLop: boolean; monDay: string[]; cungCn: boolean | null;
  /** GD-5: mã lớp của em (`studentId`) và mã chi nhánh tham chiếu (khi chỉ một) cho nhãn nhóm "GV của lớp · MB FT 101" / "Cùng chi nhánh MB" — từ bảng nhớ, 0 câu thêm. */
  lopMa: string | null; cnMa: string | null };

type HangNguoiTho = { id: number; full_name: string; code: string; role: string | null; branches: string | null };

/**
 * Vai + chi nhánh gộp thẳng vào câu truy vấn chính (mẫu `searchPeople`, `worklist/meeting.ts:594-599`) — trước đây gọi
 * riêng `roleAndBranchesOf` cho từng dòng kết quả, tốn một truy vấn mỗi dòng (~15 truy vấn mỗi lần gõ trên Turso).
 */
/** `vaiTaiCn` (GIAO-VIEC-CN): vai đúng nhóm phải ở ĐÚNG chi nhánh này — cùng luật `laNguoiHopLe(…, branchId)` máy chủ kiểm khi lưu. */
/**
 * GV-2 (N58): vai NHẬN được việc giao liên phòng ban — MỘT danh sách cho ô chọn (`timNguoiGiaoViec`) và máy chủ (`kiemNguoiNhan` ở `worklist/giaoViec.ts`).
 * Bỏ `tutor` / `head_tutor` (PTA rà quyền #1930 C): không có khu Công việc. Vai toàn hệ thống (chi nhánh trống, vd CX) tính là có ở mọi chi nhánh.
 */
export const VAI_GIAO_VIEC = ['teacher', 'manager', 'branch_director', 'consultant', 'lead_consultant', 'office_admin', 'cx', 'scheduler', 'system_admin'] as const;   // VAI-0: + GĐCN, Lead TVV
function nguoiHopLe(nhom: NhomNguoi, ids: readonly number[] | null, branchIds: readonly number[] | null, vaiTaiCn: number | null = null): HangNguoiTho[] {
  const keys = ROLE_KEYS_OF[nhom];
  const keyPlaceholders = keys.map(() => '?').join(',');
  const idClause = ids ? ` AND u.id IN (${ids.map(() => '?').join(',')})` : '';
  /* PR-Ra (Task 3), PR-Dọn Q2: chỉ người có vai đang hoạt động ở MỘT chi nhánh thuộc phạm vi người xem. */
  const branchClause = branchIds
    ? ` AND EXISTS (SELECT 1 FROM user_roles ur4 WHERE ur4.user_id = u.id AND ur4.status = 'active'
          AND ur4.branch_id IN (${branchIds.map(() => '?').join(',')}))`
    : '';
  return db()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.code,
              (SELECT r2.name_vi FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id
                WHERE ur2.user_id = u.id AND ur2.status = 'active' AND r2.key IN (${keyPlaceholders})
                ORDER BY ur2.id LIMIT 1) AS role,
              (SELECT GROUP_CONCAT(DISTINCT b.id || '|' || b.code) FROM user_roles ur3 JOIN branches b ON b.id = ur3.branch_id
                WHERE ur3.user_id = u.id AND ur3.status = 'active') AS branches
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 'active' AND r.key IN (${keyPlaceholders})${vaiTaiCn ? ' AND ur.branch_id = ?' : ''}${idClause}${branchClause}${KY_NANG_S(nhom)}`,
    )
    .all(...keys, ...keys, ...(vaiTaiCn ? [vaiTaiCn] : []), ...(ids ?? []), ...(branchIds ?? [])) as HangNguoiTho[];
}

export function timNguoi(
  p: Principal,
  opts: { q?: string; nhom?: NhomNguoi; studentId?: number | null; cungChiNhanh?: boolean;
    /** GIAO-VIEC-CN (chủ SP 10/11, B' 9): Việc quản lý — chỉ người có vai ở chi nhánh của việc (trong phạm vi người xem). */
    chiNhanh?: number | null;
    /** GV-2: ô giao việc — mọi vai ở chi nhánh `chiNhanh` (`nhom=giao_viec` ở `/ref/nguoi`). */
    moiVai?: boolean;
    /** LPB-1 (N73 ④, N63 ①): việc Head — chỉ người có quyền chốt lộ trình (`chot`: class.edit, trừ CX / Lead TVV) / xếp lịch MT (`xep_lich`: plan.week). */
    quyen?: 'chot' | 'xep_lich' | 'khong_bpxl' | 'nhan_tin' | null },
): HangNguoi[] {
  if (opts.moiVai) return timNguoiGiaoViec(p, opts.q ?? '', opts.chiNhanh ?? null, opts.quyen ?? null);
  const nhom: NhomNguoi = opts.nhom === 'nhan_vien' || opts.nhom === 'gv_speaking' ? opts.nhom : 'giao_vien';
  const term = (opts.q ?? '').trim();
  /* PR-Dọn (Q2): hỏi theo một em → phải xem được em đó, TRƯỚC khi đọc lớp / người dạy của em. */
  if (opts.studentId) require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: opts.studentId }, 'Bạn không có quyền xem học viên này.');
  const classId = opts.studentId ? activeClassOf(opts.studentId) : null;
  const gv = classId ? dangDayLop(classId) : [];
  const monDayOf = new Map<number, string[]>();
  for (const g of gv) {
    if (!g.skill) continue;
    monDayOf.set(g.userId, [...(monDayOf.get(g.userId) ?? []), g.skill]);
  }
  const cungLopIds = new Set(gv.map((g) => g.userId));

  /*
   * PR-Dọn (Q2): LUÔN theo phạm vi người xem (trước đây chỉ khi web gửi `trongPhamVi=1`). QT (`scope.all`) không giới hạn; Quản lý
   * thấy người của chi nhánh mình; GV thấy người của các chi nhánh có lớp mình đang dạy.
   */
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const bang = bangLop();
  const cnPhamVi = [...new Set([...scope.branchIds,
    ...scope.classIds.map((id) => bang.get(id)?.branchId).filter((b): b is number => b != null)])];
  /* PR-S5F-b: `cungChiNhanh` — chỉ GV ở chi nhánh của lớp em đang học (người dạy PA Bổ trợ ở FormPa — Sửa PA / Điều chỉnh; máy chủ kiểm lại ở `nguoiSauSua` → `chuanHoaNguoiThucHien({ branchId })`). */
  const cnLop = opts.cungChiNhanh && classId ? bang.get(classId)?.branchId ?? undefined : undefined;
  const cnViec = opts.chiNhanh ?? null;
  if (cnViec && !scope.all && !cnPhamVi.includes(cnViec)) return [];
  const branchIds = cnViec ? [cnViec] : cnLop ? [cnLop] : scope.all ? null : cnPhamVi;
  if (branchIds && !branchIds.length) return [];

  /* GD-5 (mockup ⑤ A5): nhóm "Cùng chi nhánh" → "Chi nhánh khác" — so chi nhánh của vai (đã đọc cùng câu, 0 câu thêm) với chi nhánh tham chiếu. */
  const cnLopEm = classId ? bang.get(classId)?.branchId ?? null : null;
  const cnThamChieu = new Set<number>(cnViec ? [cnViec] : cnLop ? [cnLop] : cnLopEm ? [cnLopEm] : cnPhamVi);
  const lopMa: string | null = classId ? lopDayDu().get(classId)?.code ?? null : null;
  const build = (row: HangNguoiTho): HangNguoi => {
    const cn = (row.branches ? row.branches.split(',') : []).map((x) => { const [id, ...ma] = x.split('|'); return { id: Number(id), ma: ma.join('|') }; });
    return {
      id: row.id, name: row.full_name, role: row.role,
      branches: [...new Set(cn.map((x) => x.ma))].sort(),
      cungLop: cungLopIds.has(row.id), monDay: monDayOf.get(row.id) ?? [],
      cungCn: cnThamChieu.size ? cn.some((x) => cnThamChieu.has(x.id)) : null, lopMa,
      cnMa: cnThamChieu.size === 1 ? cn.find((x) => cnThamChieu.has(x.id))?.ma ?? null : null,
    };
  };

  /* T14: chưa gõ → 20 người (GV cùng lớp → cùng chi nhánh → khác); có gõ (kể cả 1–2 ký tự) → 12 người khớp. */
  const needle = normalizeName(term);
  return nguoiHopLe(nhom, null, branchIds, cnViec)
    .filter((r) => !needle || normalizeName(r.full_name).includes(needle) || normalizeName(r.code).includes(needle))
    .map(build)
    .sort((a, b) => (a.cungLop !== b.cungLop ? (a.cungLop ? -1 : 1) : a.cungCn !== b.cungCn ? (a.cungCn ? -1 : 1) : a.name.localeCompare(b.name, 'vi') || a.id - b.id))
    .slice(0, needle ? 12 : 20);
}

/** Trần dòng đọc của ô giao việc mỗi lần gõ — người ĐANG HOẠT ĐỘNG có vai ở MỘT chi nhánh (đủ cho mọi chi nhánh hiện có; lọc không dấu ở JS rồi lấy 12 / 20). */
const TRAN_GIAO_VIEC = 300;
/**
 * GV-2 (N58, PTA rà quyền #1930 B): ô "Đổi người phụ trách" / "Thêm người theo dõi" — MỘT câu: người có vai trong `VAI_GIAO_VIEC` ở chi nhánh của việc (hoặc vai
 * toàn hệ thống), đang hoạt động, chưa xoá; vai + chi nhánh gom bằng GROUP BY (không câu con theo dòng), LIMIT ở SQL. Chi nhánh ngoài phạm vi người gọi → [].
 * Chỉ trả mã chi nhánh của VIỆC cho mọi dòng (không lộ chi nhánh khác của người đó; vai toàn hệ thống cùng nhóm). Lọc tên không dấu ở JS trên tập đã giới hạn (không có cột tên không dấu).
 * ponytail: chi nhánh > 300 người có vai thì người cuối danh sách chữ cái không tìm được — thêm cột tên không dấu + LIKE nếu chạm trần.
 */
function timNguoiGiaoViec(p: Principal, q: string, cnViec: number | null, quyen: 'chot' | 'xep_lich' | 'khong_bpxl' | 'nhan_tin' | null = null): HangNguoi[] {
  if (!cnViec) return [];
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const bang = bangLop();
  const cnPhamVi = new Set([...scope.branchIds, ...scope.classIds.map((id) => bang.get(id)?.branchId).filter((b): b is number => b != null)]);
  if (!scope.all && !cnPhamVi.has(cnViec)) return [];
  const rows = db().prepare(
    `SELECT u.id, u.full_name, u.code, MIN(r.name_vi) AS role, (SELECT b.code FROM branches b WHERE b.id = ?) AS ma
       FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id
      WHERE u.status = 'active' AND u.deleted_at IS NULL AND r.key IN (${VAI_GIAO_VIEC.map(() => '?').join(',')}) AND (ur.branch_id = ? OR ur.branch_id IS NULL${quyen === 'nhan_tin' ? ` OR r.key = 'scheduler'` : ''})   -- RA-2711 (N77): Nhận thông tin — BPXL mọi chi nhánh
        ${quyen === 'nhan_tin' ? '' : quyen === 'khong_bpxl' ? `AND r.key != 'scheduler'` : quyen ? `AND r.id IN (SELECT rp.role_id FROM role_permissions rp JOIN permissions pm ON pm.id = rp.permission_id WHERE pm.key = ?)${quyen === 'chot' ? ` AND r.key NOT IN ('cx', 'lead_consultant')` : ''}` : ''}
      GROUP BY u.id ORDER BY u.full_name, u.id LIMIT ${TRAN_GIAO_VIEC}`,
  ).all(cnViec, ...VAI_GIAO_VIEC, cnViec, ...(quyen && quyen !== 'khong_bpxl' && quyen !== 'nhan_tin' ? [quyen === 'chot' ? PERMISSIONS.CLASS_EDIT : PERMISSIONS.PLAN_WEEK] : [])) as { id: number; full_name: string; code: string; role: string | null; ma: string | null }[];
  const needle = normalizeName(q.trim());
  return rows.filter((r) => !needle || normalizeName(r.full_name).includes(needle) || normalizeName(r.code ?? '').includes(needle))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi') || a.id - b.id).slice(0, needle ? 12 : 20)
    .map((r) => ({ id: r.id, name: r.full_name, role: r.role, branches: r.ma ? [r.ma] : [], cungLop: false, monDay: [], cungCn: true, lopMa: null, cnMa: r.ma }));
}
