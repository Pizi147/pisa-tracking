import { DS_JSON, db, theoLoJson } from './db.ts';
import { C02_GVCN_XU_LY_CASE_TRAI_MON, PERMISSIONS, type WorkScope } from '../../shared/domain/index.ts';
import { demoToday } from './demoConfig.ts';
import { forbidden } from './util.ts';
import { coKhoa, coNho, datNho, nho } from './platform/nguCanhRequest.ts';
import { nhoThamChieu } from './platform/mocHeThong.ts';

/**
 * Quyền = Permission của role × Phạm vi chi nhánh của CHÍNH grant đó × Phân công lớp/kỹ năng.
 *
 * Không có role nào mặc định thấy toàn hệ thống: chỉ grant có branch_id = NULL mới toàn hệ thống,
 * và điều đó do dữ liệu quyết định chứ không suy từ tên role.
 */

export type Grant = {
  id: number;
  roleKey: string;
  roleName: string;
  branchId: number | null;      // null = toàn hệ thống
  branchName: string | null;
  permissions: Set<string>;
};

export type Assignment = {
  id: number;
  classId: number;
  skill: string | null;
  isCore: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type Principal = {
  userId: number;
  code: string;
  fullName: string;
  title: string | null;
  grants: Grant[];
  roleKeys: string[];
  assignments: Assignment[];
  /** PR-OV2a: vai đang chọn khi đổi góc nhìn (null/không có = làm việc bằng mọi vai). */
  gocNhin?: string | null;
  /** PR-OV2a: mọi vai tài khoản đang nắm — khác `roleKeys` khi đang ở một góc nhìn. */
  vaiGoc?: string[];
  /** PR-EN: ngôn ngữ đã chọn của tài khoản ('vi' | 'en'; null = chưa chọn). Đọc cùng câu phiên — không thêm lượt hỏi. */
  ngonNgu?: string | null;
  /** HD-a: đã mở Hướng dẫn / bấm Ẩn dải "Mới dùng PISA?" (`users.da_xem_huong_dan`). Đọc cùng câu phiên. */
  daXemHuongDan?: boolean;
  /** OV-14c: kỹ năng khai ở hồ sơ (`user_skills`, Quản trị › Kỹ năng) — `speaking` = GV Speaking chấm chéo. Đọc cùng câu phiên. */
  kyNang?: string[];
  /** PC-GV-A: lớp vừa bị ĐỔI khỏi (A → B; bỏ người không có) — CHỈ XEM (`ATTEMPT_VIEW`, `STUDENT_VIEW`) từ hiệu lực tới `den`. Đọc cùng câu phiên. */
  xemTam?: { classId: number; tu: string; den: string; doiId: number }[];
  /** CHUONG-NHE: mốc đồng bộ thông báo tự động gần nhất (`users.chuong_dong_bo_luc`, NULL = lần mở chuông kế đồng bộ ngay). Đọc cùng câu phiên. */
  chuongDongBoLuc?: string | null;
};

export type Ctx = {
  branchId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  skill?: string | null;
  /** Kiểm tra ở mức màn hình: nội dung bên trong vẫn được lọc lại theo phạm vi. */
  anyScope?: boolean;
  date?: string;
};

/**
 * PR-TD2-d: principal đọc bằng MỘT câu (trước: 5 câu nối tiếp, mỗi câu một lượt mạng Turso). Các cột dưới đây gắn vào câu có
 * `users u` — `loadPrincipal` (theo id) và `resolveSession` (phiên JOIN users) dùng chung, đọc lại MỖI request (thu quyền có
 * hiệu lực ngay). Ba khối JSON giữ đúng câu cũ (lọc, JOIN, thứ tự): vai (kèm quyền theo vai), quyền cấp riêng, phân công.
 * `json(...)` vì cột con lấy qua truy vấn con mất kiểu JSON — không bọc thì quyền thành chuỗi.
 */
export const COT_PRINCIPAL = `u.id AS u_id, u.code AS u_code, u.full_name AS u_full_name, u.title AS u_title, u.ngon_ngu AS u_ngon_ngu, u.da_xem_huong_dan AS u_da_xem_hd, u.chuong_dong_bo_luc AS u_chuong_luc,
  (SELECT json_group_array(json_array(g.id, g.branch_id, g.role_key, g.role_name, g.branch_name, json(g.perms))) FROM (
     SELECT ur.id, ur.branch_id, r.key AS role_key, r.name_vi AS role_name, b.name AS branch_name,
            (SELECT json_group_array(p.key) FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
              WHERE rp.role_id = r.id) AS perms
       FROM user_roles ur JOIN roles r ON r.id = ur.role_id
       LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE ur.user_id = u.id AND ur.status = 'active' ORDER BY ur.id) g) AS u_grants,
  (SELECT json_group_array(json_array(up.branch_id, p.key, b.name))
     FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     LEFT JOIN branches b ON b.id = up.branch_id
    WHERE up.user_id = u.id) AS u_rieng,
  (SELECT json_group_array(json_array(ta.id, ta.class_id, ta.skill, ta.is_core, ta.effective_from, ta.effective_to))
     FROM teacher_assignments ta WHERE ta.user_id = u.id AND ta.status = 'active') AS u_phan_cong,
  (SELECT json_group_array(us.skill) FROM user_skills us WHERE us.user_id = u.id) AS u_ky_nang,
  (SELECT json_group_array(json_array(d.class_id, d.hieu_luc, d.xem_den, d.id)) FROM (SELECT x.class_id, x.hieu_luc, x.id,
       CASE WHEN EXISTS (SELECT 1 FROM ban_giao_gv b WHERE b.class_id = x.class_id AND b.nguoi_cu = x.nguoi_cu AND b.trang_thai = 'mo') THEN '9999-12-31' ELSE x.xem_den END AS xem_den
     FROM doi_phan_cong x WHERE x.nguoi_cu = u.id AND x.trang_thai = 'da_ap' AND x.xem_den IS NOT NULL ORDER BY x.id) d) AS u_xem_tam`;   // PR-B: còn việc bàn giao mở → xem tới khi xong (lâu hơn của hai mốc)

export function loadPrincipal(userId: number): Principal {
  const row = db().prepare(`SELECT ${COT_PRINCIPAL} FROM users u WHERE u.id = ?`).get(userId) as any;
  if (!row) throw forbidden('Tài khoản không tồn tại');
  return principalTuDong(row);
}

/** Dòng có các cột `COT_PRINCIPAL` → Principal. */
export function principalTuDong(row: any): Principal {
  const grants: Grant[] = (JSON.parse(row.u_grants) as any[][]).map(([id, branchId, roleKey, roleName, branchName, perms]) => ({
    id, roleKey, roleName, branchId, branchName, permissions: new Set<string>(perms),
  }));

  /*
   * QUYỀN CẤP RIÊNG CHO CÁ NHÂN (mục 7.3) — thêm vào dưới dạng một GRANT nữa.
   *
   * Ví dụ owner đưa ra: một Quản lý CN Monbay được cấp thêm quyền quan sát toàn hệ thống.
   * Đưa chúng vào cùng danh sách `grants` chứ không thành một đường kiểm tra thứ hai: mọi
   * chỗ hỏi quyền đã đi qua `grants`, nên thêm một đường song song là chắc chắn có chỗ quên
   * kiểm — và chỗ quên kiểm ở một hệ thống phân quyền thì không ai phát hiện ra cho tới lúc
   * ai đó nhìn thấy thứ họ không được nhìn.
   */
  for (const [branchId, permKey, branchName] of JSON.parse(row.u_rieng) as any[][]) {
    grants.push({
      id: -1,
      roleKey: 'granted',
      roleName: 'Quyền cấp riêng',
      branchId,
      branchName,
      permissions: new Set<string>([permKey]),
    });
  }

  const assignments: Assignment[] = (JSON.parse(row.u_phan_cong) as any[][]).map(
    ([id, classId, skill, isCore, effectiveFrom, effectiveTo]) => ({ id, classId, skill, isCore: isCore === 1, effectiveFrom, effectiveTo }),
  );

  return {
    userId: row.u_id,
    code: row.u_code,
    fullName: row.u_full_name,
    title: row.u_title,
    ngonNgu: row.u_ngon_ngu ?? null,
    daXemHuongDan: row.u_da_xem_hd === 1,
    chuongDongBoLuc: row.u_chuong_luc ?? null,
    kyNang: row.u_ky_nang ? JSON.parse(row.u_ky_nang) : [],
    xemTam: (row.u_xem_tam ? JSON.parse(row.u_xem_tam) as any[][] : []).map(([classId, tu, den, doiId]) => ({ classId, tu, den, doiId })),
    grants,
    /* `granted` không phải một vai trò — nó chỉ là chỗ chứa quyền cấp riêng. */
    roleKeys: [...new Set(grants.map((g) => g.roleKey).filter((k) => k !== 'granted'))],
    assignments,
  };
}

/** Phân công còn hiệu lực ở ngày này. Xuất ra cho Lịch Test ("Lớp tôi dạy") — không viết lại luật. */
export const activeAt = (a: Assignment, date: string) =>
  a.effectiveFrom <= date && (!a.effectiveTo || a.effectiveTo >= date);

/**
 * PR-TD: bảng lớp CẢ BẢNG, nạp một câu lần đầu cần trong request (bảng nhỏ, vài trăm dòng — khác hẳn ghi danh, lớn
 * dần theo năm, nên KHÔNG nạp cả bảng đó). `branchOfClass`/`classIsFastTrack` không nhận `p` (đặc tả hàm cũ) nên
 * không đi qua đối tượng principal được — đọc thẳng bộ nhớ request qua `nho`/`coNho`. TL-NEN: nhớ theo tiến trình, khoá phiên bản DB (`nhoThamChieu`).
 */
export function bangLop(): Map<number, { branchId: number | null; isFastTrack: boolean; ct: string | null }> {
  return nhoThamChieu('bang-lop', () => {
    const map = new Map<number, { branchId: number | null; isFastTrack: boolean; ct: string | null }>();
    for (const r of db().prepare('SELECT id, branch_id, is_fast_track, programme_code FROM classes').all() as any[]) {
      map.set(r.id, { branchId: r.branch_id, isFastTrack: !!r.is_fast_track, ct: r.programme_code ?? null });
    }
    return map;
  });
}

function branchOfClass(classId: number): number | null {
  if (coNho()) return bangLop().get(classId)?.branchId ?? null;
  const r = db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any;
  return r?.branch_id ?? null;
}

/** Fast Track hay Normal — sổ SCH-01: quyền dời lịch của giáo viên chỉ mở cho lớp thường. */
function classIsFastTrack(classId: number): boolean {
  if (coNho()) return bangLop().get(classId)?.isFastTrack ?? false;
  const r = db().prepare('SELECT is_fast_track FROM classes WHERE id = ?').get(classId) as any;
  return !!r?.is_fast_track;
}

/**
 * Chi nhánh của HV cho luật quyền — ưu tiên CHI NHÁNH ĐANG HỌC (quyết định planning 23/09):
 * còn ghi danh `active` thì chỉ tính chi nhánh của các lớp ĐANG HỌC (+ `students.branch_id`) —
 * ghi danh cũ đã `transferred`/`paused`/`completed` không còn giữ quyền xem ở chi nhánh cũ nữa,
 * để QL chi nhánh MỚI thấy em ngay sau khi chuyển (PR-LT). Em đã nghỉ hẳn/lưu trữ (không còn
 * ghi danh `active` nào) thì giữ luật cũ — mọi chi nhánh từng học, để lịch sử vẫn tra được.
 */
export function branchesOfStudent(studentId: number): number[] {
  return nho('hv-cn:' + studentId, () => {
    const conn = db();
    const activeRows = conn
      .prepare(
        `SELECT DISTINCT c.branch_id AS b FROM enrollments e JOIN classes c ON c.id = e.class_id
          WHERE e.student_id = ? AND e.status = 'active'`,
      )
      .all(studentId) as any[];
    const rows = activeRows.length
      ? activeRows
      : (conn
        .prepare(`SELECT DISTINCT c.branch_id AS b FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ?`)
        .all(studentId) as any[]);
    const set = new Set<number>(rows.map((r) => r.b).filter((b) => b != null));
    const studentBranch = (conn.prepare('SELECT branch_id AS b FROM students WHERE id = ?').get(studentId) as any)?.b;
    if (studentBranch != null) set.add(studentBranch);
    return [...set];
  });
}

function classesOfStudent(studentId: number): number[] {
  return nho('hv-lop:' + studentId, () =>
    (db().prepare('SELECT DISTINCT class_id FROM enrollments WHERE student_id = ?').all(studentId) as any[])
      .map((r) => r.class_id));
}

/**
 * K5-34 (PR-YT4): lớp em ĐANG HỌC — quyền xử lý Ý thức và sửa hồ sơ chỉ theo lớp này, không theo lớp em đã rời.
 * OV-11d (HV-10): ghi danh `paused` (Tạm dừng giữ lớp) vẫn tính — GVCN lớp đó vẫn Quay lại học / Thôi học / sửa hồ sơ / xử lý Ý thức —
 * nhưng CHỈ khi em không có ghi danh `active` nào (em đã sang lớp khác thì lớp giữ cũ không còn quyền).
 */
function classesOfStudentDangHoc(studentId: number): number[] {
  return nho('hv-lop-dh:' + studentId, () =>
    lopDangHocTu(db().prepare(`SELECT class_id, status FROM enrollments WHERE student_id = ? AND status IN ('active', 'paused')`).all(studentId) as any[]));
}

/** Lớp `active`; không có thì lớp `paused` (cùng luật cho `classesOfStudentDangHoc` và `napTruocPhamVi`). */
function lopDangHocTu(rows: { class_id: number; status: string }[]): number[] {
  const active = rows.filter((r) => r.status === 'active');
  return [...new Set((active.length ? active : rows.filter((r) => r.status === 'paused')).map((r) => r.class_id))];
}

/**
 * NẠP TRƯỚC PHẠM VI của một lô HV — chỉ có tác dụng TRONG một request GET (`coNho()` mở); ngoài đó `return` ngay,
 * không tốn một câu SQL nào (phép kiểm gọi thẳng `listCases`/`can` ngoài request vẫn đi từng dòng như trước PR này).
 *
 * Nạp ĐÚNG hai thứ mà `classesOfStudent`/`branchesOfStudent` tính — cùng luật, chỉ đổi nguồn dữ liệu:
 *   · lớp của HV = MỌI ghi danh, mọi trạng thái (không lọc status, y hệt `classesOfStudent`).
 *   · chi nhánh của HV = CHI NHÁNH ĐANG HỌC nếu còn ghi danh `active` (chi nhánh các lớp `active`
 *     ∪ `students.branch_id`), không có ghi danh `active` nào thì lùi về chi nhánh MỌI ghi danh
 *     ∪ `students.branch_id` — đúng luật mới của `branchesOfStudent` (planning 23/09).
 * Mỗi id trong lô ĐỀU được `datNho` (kể cả em không có ghi danh nào → mảng rỗng `[]`), để lần gọi
 * `classesOfStudent`/`branchesOfStudent` sau đó (cùng request) không hỏi DB nữa dù kết quả rỗng. Theo lô 900 id một
 * lần hỏi (giới hạn tham số của một câu `IN`); bỏ id rỗng/trùng/đã có trong bộ nhớ trước khi hỏi.
 */
export function napTruocPhamVi(studentIds: readonly (number | null | undefined)[]): void {
  if (!coNho()) return;
  const idsCanNap = [...new Set(studentIds.filter((id): id is number => id != null))]
    .filter((id) => !coKhoa('hv-lop:' + id) || !coKhoa('hv-cn:' + id) || !coKhoa('hv-lop-dh:' + id));
  if (!idsCanNap.length) return;

  const lopCua = new Map<number, number[]>();
  const lopDangHoc = new Map<number, { class_id: number; status: string }[]>();
  const cnDangHoc = new Map<number, Set<number>>();
  const cnMoiGhiDanh = new Map<number, Set<number>>();
  /* Id nào có ÍT NHẤT MỘT ghi danh `active` — quyết định dùng `cnDangHoc` hay lùi về `cnMoiGhiDanh`,
     tách riêng khỏi hai Set trên vì cả hai đều được cộng thêm `students.branch_id` bên dưới (nếu
     dùng `.size` của `cnDangHoc` để quyết thì một em CHỈ có `students.branch_id`, không ghi danh
     active nào, sẽ bị tính nhầm là "đang học"). */
  const coActive = new Set<number>();
  for (const id of idsCanNap) { lopCua.set(id, []); lopDangHoc.set(id, []); cnDangHoc.set(id, new Set()); cnMoiGhiDanh.set(id, new Set()); }

  theoLoJson(idsCanNap, (json) => {   // S5: một tham số JSON (trước TD4: lô 900 tham số)
    /* TD4: ghi danh + `students.branch_id` MỘT câu (trước hai câu mỗi lô) — em không ghi danh nào vẫn ra một dòng (`trang_thai` NULL). */
    for (const r of db()
      .prepare(
        `SELECT s.id AS sid, s.branch_id AS sbid, e.class_id AS cid, e.status AS trang_thai, c.branch_id AS bid
           FROM students s LEFT JOIN enrollments e ON e.student_id = s.id LEFT JOIN classes c ON c.id = e.class_id
          WHERE s.id IN (${DS_JSON})`,
      )
      .all(json) as any[]) {
      if (r.sbid != null) { cnMoiGhiDanh.get(r.sid)!.add(r.sbid); cnDangHoc.get(r.sid)!.add(r.sbid); }
      if (r.trang_thai == null) continue;
      lopCua.get(r.sid)!.push(r.cid);
      if (r.trang_thai === 'active') coActive.add(r.sid);
      if (r.trang_thai === 'active' || r.trang_thai === 'paused') lopDangHoc.get(r.sid)!.push({ class_id: r.cid, status: r.trang_thai });   // cùng luật `classesOfStudentDangHoc`
      if (r.bid != null) {
        cnMoiGhiDanh.get(r.sid)!.add(r.bid);
        if (r.trang_thai === 'active') cnDangHoc.get(r.sid)!.add(r.bid);
      }
    }
  });

  for (const id of idsCanNap) {
    datNho('hv-lop:' + id, lopCua.get(id)!);
    datNho('hv-lop-dh:' + id, lopDangHocTu(lopDangHoc.get(id)!));
    datNho('hv-cn:' + id, [...(coActive.has(id) ? cnDangHoc.get(id)! : cnMoiGhiDanh.get(id)!)]);
  }
}

/**
 * GV SPEAKING CHẤM CHÉO (PR-HSM 30/09; OV-14c chủ SP chốt 18/10): GV Speaking nhập được ô **S** Mock của MỌI lớp Fast Track ở các chi nhánh mà
 * grant vai Giáo viên (có `SCORE_EDIT`) của tài khoản phủ — grant toàn hệ thống → mọi chi nhánh. Không cần phân công từng lớp.
 * Đây chỉ là QUYỀN: `mySkills` (việc / nợ điểm) không đổi — ô S của lớp khác không thành nợ của người này. Lớp thường không áp.
 */
export function lopFtChoGvSpeaking(p: Principal, date = demoToday()): number[] {
  if (!laGvSpeaking(p, date)) return [];
  const gv = grantGvNhapDiem(p);
  const toanHt = gv.some((g) => g.branchId === null);
  const cn = new Set(gv.map((g) => g.branchId));
  return [...bangLop()].filter(([, l]) => l.isFastTrack && l.branchId != null && (toanHt || cn.has(l.branchId))).map(([id]) => id);
}
export const grantGvNhapDiem = (p: Pick<Principal, 'grants'>) => p.grants.filter((g) => g.roleKey === 'teacher' && g.permissions.has(PERMISSIONS.SCORE_EDIT));
/**
 * OV-14c: AI LÀ GV SPEAKING — vai Giáo viên có `SCORE_EDIT`, và có kỹ năng `speaking` ở hồ sơ (`user_skills`) HOẶC đang có phân công
 * `speaking` ở một lớp FT. Một luật cho quyền (`lopFtChoGvSpeaking`) và chip "Chấm Speaking" ở Quản trị › Tài khoản.
 */
export function laGvSpeaking(p: Pick<Principal, 'grants' | 'kyNang' | 'assignments'>, date = demoToday()): boolean {
  if (!grantGvNhapDiem(p).length) return false;
  if (p.kyNang?.includes('speaking')) return true;
  return p.assignments.some((a) => a.skill === 'speaking' && activeAt(a, date) && !!bangLop().get(a.classId)?.isFastTrack);
}
const laGvSpeakingLop = (p: Principal, classId: number, date?: string) => lopFtChoGvSpeaking(p, date).includes(classId);

/** PR-S4F: xem lượt MT để CHẤM — `ATTEMPT_VIEW` hoặc GV Speaking chấm S chéo lớp FT cùng chi nhánh. Chỉ dùng ở đường chấm. */
export function coTheXemLuotCham(p: Principal, ctx: Ctx): boolean {
  return can(p, PERMISSIONS.ATTEMPT_VIEW, ctx) || !!(ctx.classId && laGvSpeakingLop(p, ctx.classId, ctx.date));
}
export function requireXemLuotCham(p: Principal, ctx: Ctx, message: string) {
  if (!coTheXemLuotCham(p, ctx)) require_(p, PERMISSIONS.ATTEMPT_VIEW, ctx, message);
}
/** Phạm vi DANH SÁCH của đường chấm (Lịch Test, Test › Điểm theo lớp): `scopeFor(ATTEMPT_VIEW)` + lớp FT GV Speaking chấm S chéo. */
export function scopeXemLuotCham(p: Principal, date = demoToday()): Scope {
  const s = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const lopS = s.all ? [] : lopFtChoGvSpeaking(p, date);
  /* OV-14c: GV Speaking không phân công lớp nào (`scopeFor` rỗng) vẫn có phạm vi chấm = các lớp FT này. */
  return lopS.length ? { ...s, none: false, classIds: [...new Set([...s.classIds, ...lopS])] } : s;
}

/** Chi nhánh mà ngữ cảnh đang nói tới. */
function ctxBranches(ctx: Ctx): number[] {
  const set = new Set<number>();
  if (ctx.branchId) set.add(ctx.branchId);
  if (ctx.classId) { const b = branchOfClass(ctx.classId); if (b) set.add(b); }
  if (ctx.studentId) for (const b of branchesOfStudent(ctx.studentId)) set.add(b);
  return [...set];
}

/** Giáo viên có được phân công đúng lớp (và đúng kỹ năng nếu ngữ cảnh nêu kỹ năng) không? */
export function hasAssignment(p: Principal, ctx: Ctx, need: 'any' | 'skill' | 'core'): boolean {
  const date = ctx.date ?? demoToday();
  const classIds = ctx.classId ? [ctx.classId] : ctx.studentId ? classesOfStudent(ctx.studentId) : [];
  if (!classIds.length) return false;
  const mine = p.assignments.filter((a) => activeAt(a, date) && classIds.includes(a.classId));
  if (!mine.length) return false;
  if (need === 'core') return mine.some((a) => a.isCore);
  /* PR-MT0: lớp thường phân công `writing` (một môn) — MT0 nhập W1, W2 như Mock nên GV Writing của lớp nhập cả hai ô. */
  if (need === 'skill') return ctx.skill ? mine.some((a) => a.skill === ctx.skill || (a.skill === 'writing' && (ctx.skill === 'writing1' || ctx.skill === 'writing2'))) : false;
  return true;
}

/**
 * K5-34, M-08 (PR-YT4): GVCN của lớp em ĐANG HỌC. Ngữ cảnh chỉ có `studentId` → chỉ lớp có ghi danh `active` / `paused` (GVCN lớp cũ mất quyền
 * ngay khi em chuyển lớp; em Tạm dừng vẫn có GVCN lớp giữ chỗ — OV-11d). Ngữ cảnh có `classId` → như `hasAssignment`.
 */
function coreDangHoc(p: Principal, ctx: Ctx): boolean {
  if (ctx.classId || !ctx.studentId) return hasAssignment(p, ctx, 'core');
  const lop = classesOfStudentDangHoc(ctx.studentId);
  const date = ctx.date ?? demoToday();
  return p.assignments.some((a) => a.isCore && activeAt(a, date) && lop.includes(a.classId));
}

/** Grant này có phủ ngữ cảnh không? Grant toàn hệ thống phủ mọi thứ. */
function grantCovers(g: Grant, ctx: Ctx): boolean {
  if (g.branchId === null) return true;
  const branches = ctxBranches(ctx);
  if (!branches.length) return ctx.anyScope === true;
  return branches.every((b) => b === g.branchId);
}

/**
 * PC-GV-A: GV CŨ CHỈ XEM lớp cũ (chủ SP 30/10) — tối thiểu 1 tuần từ hiệu lực (PR-B kéo tới khi xong bàn giao). Ngữ cảnh lớp, hoặc em
 * (mọi lớp em từng ghi danh, như `hasAssignment`), trong [hiệu lực, `den`]. Chỉ mở `ATTEMPT_VIEW` + `STUDENT_VIEW` — mọi quyền sửa không đổi.
 */
export function xemTamCo(p: Principal, ctx: Ctx): boolean {
  if (!p.xemTam?.length) return false;
  const date = ctx.date ?? demoToday();
  const lop = ctx.classId ? [ctx.classId] : ctx.studentId ? classesOfStudent(ctx.studentId) : [];
  return p.xemTam.some((x) => x.tu <= date && date <= x.den && lop.includes(x.classId));
}

/** PC-GV-A: lớp GV cũ CHỈ XEM ở ngày này (còn hạn, không còn phân công nào ở lớp đó) — mỗi lớp một dòng, `den` muộn nhất. */
export function lopXemTam(p: Principal, date = demoToday()): { classId: number; den: string }[] {
  const dang = new Set(p.assignments.filter((a) => activeAt(a, date)).map((a) => a.classId));
  const m = new Map<number, string>();
  for (const x of p.xemTam ?? []) {
    if (x.tu > date || date > x.den || dang.has(x.classId)) continue;
    if (!m.has(x.classId) || m.get(x.classId)! < x.den) m.set(x.classId, x.den);
  }
  return [...m].map(([classId, den]) => ({ classId, den }));
}

/**
 * Ràng buộc thêm cho vai trò Giáo viên. Giáo viên không có quyền nào về lịch, và GVCN
 * không vì chủ nhiệm mà có quyền sửa mọi kỹ năng.
 */
function teacherAllows(p: Principal, permission: string, ctx: Ctx): boolean {
  switch (permission) {
    // Nhập điểm: phải đúng kỹ năng được phân công ở đúng lớp.
    case PERMISSIONS.SCORE_EDIT:
    case PERMISSIONS.ESTIMATE_EDIT:
      return hasAssignment(p, ctx, 'skill');

    // Xem: chỉ trong lớp được phân công, bất kỳ môn nào (xem KHÔNG cần đúng môn).
    case PERMISSIONS.ATTEMPT_VIEW:
      /* PR-S4F: GV Speaking chấm S chéo KHÔNG mở ở đây (mở cho mọi lần kiểm có classId: Case, tín hiệu, roster…) — chỉ mở ở hai đường
         chấm `attemptDetail` / `classScoreSheet` (`requireXemLuotCham`) và Lịch Test (`lopFtChoGvSpeaking`). */
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any') || xemTamCo(p, ctx);
    case PERMISSIONS.STUDENT_VIEW:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any') || xemTamCo(p, ctx);

    /*
     * BÁO VẤN ĐỀ MỚI (sổ §13.12: "GV trong lớp có thể báo vấn đề") — rộng, bất kỳ môn nào
     * trong lớp, khớp `ATTEMPT_VIEW`/`STUDENT_VIEW`. Đây KHÔNG phải AUTH-01 — báo được không
     * có nghĩa sửa/xử lý được, đó là `SOS_EDIT` ngay dưới.
     */
    case PERMISSIONS.SOS_REPORT:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any');

    /*
     * SỬA/XỬ LÝ MỘT CASE ĐÃ CÓ (AUTH-01) — tách khỏi cụm "xem", siết đúng phạm vi:
     *
     *   Học thuật (ctx.skill có giá trị)  → đúng kỹ năng mình dạy (`hasAssignment(..., 'skill')`)
     *   Ý thức (ctx.skill rỗng)           → chỉ GVCN (`hasAssignment(..., 'core')`)
     *
     * C02: GVCN cũng chỉ qua được nhánh Học thuật ở đúng kỹ năng mình dạy (trước đây GVCN qua cả hai nhánh). `hasAssignment`
     * với `need='skill'` đã tự trả `false` khi `ctx.skill` rỗng — nên thiếu truyền `ctx.skill`
     * ở nơi gọi là KHOÁ HẾT chứ không phải MỞ HẾT; nơi gọi phải truyền đúng.
     */
    case PERMISSIONS.SOS_EDIT:
      if (ctx.anyScope === true) return true;
      /* C02 (đã chốt 20/09/2026): GVCN KHÔNG xử lý Case học thuật trái môn — chỉ đúng kỹ năng mình dạy. */
      if (C02_GVCN_XU_LY_CASE_TRAI_MON === ('gvcn-ca-lop' as string)) {
        return hasAssignment(p, ctx, 'core') || hasAssignment(p, ctx, 'skill');
      }
      return ctx.skill ? hasAssignment(p, ctx, 'skill') : hasAssignment(p, ctx, 'core');

    /*
     * Ý THỨC (PR-J, thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md mục 6). C02 KHÔNG áp ở đây — vi phạm không thuộc kỹ năng nào.
     *
     *   Ghi vi phạm (V01)     mọi giáo viên có phân công dạy lớp đó, kể cả trái môn
     *   Xử lý (V10, B01)      chỉ GVCN của lớp đó: sửa/hủy vi phạm của người khác, tạo · sửa · xác nhận · xóa biện pháp
     */
    case PERMISSIONS.VIOLATION_RECORD:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any');
    case PERMISSIONS.DISCIPLINE_MANAGE:
      return ctx.anyScope === true || coreDangHoc(p, ctx);

    /*
     * SỬA HỒ SƠ HỌC VIÊN: CHỈ GVCN, và chỉ học viên của chính lớp mình chủ nhiệm.
     *
     * Trước PR15 việc này thuộc Admin chi nhánh. Vai đó đã bỏ, và người thật sự nắm tình
     * hình từng em là giáo viên chủ nhiệm, nên quyền về tay họ. GVBM thì KHÔNG: dạy một kỹ
     * năng không cho ai căn cứ để sửa target, đầu vào hay kế hoạch thi của học viên.
     *
     * Đây cũng không phải cửa sau để nhập điểm hay chốt lịch MT — hai quyền đó vẫn đứng
     * riêng và vẫn theo phân công kỹ năng / vai Quản lý như cũ.
     */
    case PERMISSIONS.STUDENT_EDIT:
    case PERMISSIONS.STUDENT_EDIT_INFO:
    case PERMISSIONS.STUDENT_ADD:
      return ctx.anyScope === true || coreDangHoc(p, ctx);

    /*
     * DỜI LỊCH MỘT KỸ NĂNG (sổ SCH-01) — CHỈ lớp thường, và CHỈ GVCN (mọi môn của lớp mình
     * chủ nhiệm) hoặc GVBM (đúng môn mình dạy). Fast Track chủ động vẫn là việc của Quản lý —
     * `PLAN_WEEK` giữ nguyên, không đụng ở đây.
     */
    case PERMISSIONS.SCHEDULE_MOVE: {
      const classIds = ctx.classId ? [ctx.classId] : ctx.studentId ? classesOfStudent(ctx.studentId) : [];
      if (!classIds.length || classIds.some((id) => classIsFastTrack(id))) return false;
      return hasAssignment(p, ctx, 'core') || hasAssignment(p, ctx, 'skill');
    }

    /*
     * PR-QU (chủ sản phẩm 04/10) — HOÀN THÀNH CASE: Case học thuật (`ctx.skill` có) → GV dạy ĐÚNG kỹ năng đó ở lớp của em; GVCN cũng chỉ
     * khi chính mình dạy kỹ năng đó (C02). Case Ý thức (không kỹ năng) → GVCN lớp em đang học. Nơi gọi PHẢI truyền `skill` của Case.
     */
    case PERMISSIONS.CASE_CLOSE:
      return ctx.skill ? hasAssignment(p, ctx, 'skill') : coreDangHoc(p, ctx);

    /* PR-QU (A): GVCN phân công GV bộ môn — chỉ lớp mình chủ nhiệm, phải nêu `classId` (không có lớp thì không suy được). */
    case PERMISSIONS.CLASS_ASSIGN_SUBJECT:
      return !!ctx.classId && isCoreTeacherOf(p, ctx.classId, ctx.date ?? demoToday());

    default:
      return true;
  }
}

export function can(p: Principal, permission: string, ctx: Ctx = {}): boolean {
  /* `class.assign_subject` là quyền SUY RA: không vai nào được cấp, grant `teacher` mang nó ngầm và `teacherAllows` siết về GVCN lớp đó. */
  const suyRaGv = permission === PERMISSIONS.CLASS_ASSIGN_SUBJECT;
  for (const g of p.grants) {
    if (!g.permissions.has(permission) && !(suyRaGv && g.roleKey === 'teacher')) continue;
    if (!grantCovers(g, ctx)) continue;
    if (g.roleKey === 'teacher' && !teacherAllows(p, permission, ctx)) continue;
    return true;
  }
  return false;
}

export function require_(p: Principal, permission: string, ctx: Ctx = {}, message?: string) {
  if (!can(p, permission, ctx)) {
    throw forbidden(message ?? 'Bạn không có quyền thực hiện thao tác này.', {
      hint: explain(p, permission, ctx),
    });
  }
}

export function explain(p: Principal, permission: string, ctx: Ctx): string {
  const holders = p.grants.filter((g) => g.permissions.has(permission));
  if (!holders.length) {
    if (permission === PERMISSIONS.PLAN_WEEK) return 'Chỉ Quản lý mới chốt được tuần MT.';
    return 'Vai trò hiện tại của bạn không có chức năng này.';
  }
  if (holders.every((g) => g.roleKey === 'teacher')) {
    if (permission === PERMISSIONS.SCORE_EDIT) return 'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.';
    if (permission === PERMISSIONS.ESTIMATE_EDIT) return 'Bạn chỉ ước lượng được kỹ năng mình được phân công.';
    if (permission === PERMISSIONS.SOS_EDIT) {
      return 'Bạn chỉ sửa/xử lý được Case đúng kỹ năng mình dạy — Case Ý thức thì chỉ GVCN.';
    }
    if (permission === PERMISSIONS.SCHEDULE_MOVE) {
      return 'Bạn chỉ dời được lịch lớp thường mình phụ trách — Fast Track vẫn do Quản lý xếp.';
    }
    if (permission === PERMISSIONS.VIOLATION_RECORD) return 'Bạn chỉ ghi được vi phạm của học viên trong lớp mình được phân công.';
    if (permission === PERMISSIONS.CASE_CLOSE) {
      return 'Bạn chỉ hoàn thành được Case đúng môn mình dạy — Case Ý thức thì chỉ GVCN của lớp.';
    }
    if (permission === PERMISSIONS.DISCIPLINE_MANAGE) {
      return 'Chỉ giáo viên chủ nhiệm của lớp (hoặc Quản lý) mới xử lý được Ý thức; giáo viên bộ môn chỉ ghi và xem.';
    }
    return 'Bạn chỉ thao tác được trong lớp mình được phân công.';
  }
  return 'Đối tượng này nằm ngoài chi nhánh bạn được cấp quyền.';
}

// ---------------------------------------------------------------- phạm vi cho danh sách

export type Scope = { all: boolean; branchIds: number[]; classIds: number[]; none: boolean };

/** Tập chi nhánh/lớp người dùng được xem với một permission. */
export function scopeFor(p: Principal, permission: string, date = demoToday()): Scope {
  const branchIds = new Set<number>();
  const classIds = new Set<number>();
  let all = false;
  let found = false;

  for (const g of p.grants) {
    if (!g.permissions.has(permission)) continue;
    found = true;
    if (g.roleKey === 'teacher') {
      /* PC-GV-A (PTA 30/10): lớp GV cũ chỉ xem (`xemTam`) KHÔNG vào phạm vi danh sách — không tính vào việc / chỉ số của GV cũ; trang
         Học viên & Lớp liệt kê riêng (`lopXemTam`, "Chỉ xem · đã bàn giao"), mở hồ sơ qua `can` (`xemTamCo`). */
      for (const a of p.assignments) if (activeAt(a, date)) classIds.add(a.classId);
      continue;
    }
    if (g.branchId === null) all = true;
    else branchIds.add(g.branchId);
  }
  return {
    all,
    branchIds: [...branchIds],
    classIds: [...classIds],
    none: !found || (!all && !branchIds.size && !classIds.size),
  };
}

/** Mảnh SQL lọc theo phạm vi, dùng alias lớp `c`. */
export function classScopeSql(scope: Scope, alias = 'c'): { sql: string; params: unknown[] } {
  if (scope.all) return { sql: '1=1', params: [] };
  const parts: string[] = [];
  const params: unknown[] = [];
  /*
   * S5: GIỮ danh sách `?,?,…` — đổi sang json_each làm SQLite đổi kế hoạch: `classes` theo idx_class_status thay idx_class_branch, và câu
   * "Chốt tuần MT" của Công việc (OR với `o_cho_tu`) bỏ chỉ mục cờ idx_attempt_o_cho_lop (TD7b đỏ). Danh sách ngắn (số lớp / chi nhánh của người xem).
   */
  if (scope.branchIds.length) {
    parts.push(`${alias}.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.classIds.length) {
    parts.push(`${alias}.id IN (${scope.classIds.map(() => '?').join(',')})`);
    params.push(...scope.classIds);
  }
  return parts.length ? { sql: '(' + parts.join(' OR ') + ')', params } : { sql: '1=0', params: [] };
}

/**
 * Các kỹ năng người dùng được nhập điểm ở một lớp.
 * Gồm cả đường nhập bù (`score.override`) để văn phòng còn sửa được khi GVBM vắng — xem O05.
 */
export function editableSkills(p: Principal, classId: number, skills: readonly string[], luot?: LuotQuyen,
  /** PR-XLMT (rà #126): dựng "VIỆC nhập điểm" — bỏ vế Quản lý sửa mọi lúc (quyền sửa ô không phải việc của Quản lý). */
  chiViec = false): string[] {
  const lichSu = !!luot?.lich_su;
  const qlLichSu = lichSu && can(p, PERMISSIONS.PLAN_WEEK, { classId });
  /* `today` từ nơi gọi (danh sách) — không hỏi ngày nghiệp vụ lại cho từng lượt. */
  const gvcnLichSu = lichSu && !qlLichSu && isCoreTeacherOf(p, classId, luot!.today);
  return skills.filter(
    (skill) => can(p, PERMISSIONS.SCORE_EDIT, { classId, skill })
      || qlLichSu || gvcnLichSu
      || can(p, PERMISSIONS.SCORE_OVERRIDE, { classId })
      /* PR-XLMT (chủ sản phẩm chốt 29/09): Quản lý sửa/xoá điểm có lý do (RB-5) ở MỌI lúc, không chỉ sau hoàn tất. */
      || (!chiViec && can(p, PERMISSIONS.PLAN_WEEK, { classId }))
      /* PR-HSM (chủ sản phẩm 30/09): GV Speaking chấm S chéo lớp FT cùng chi nhánh — quyền, không phải việc. */
      || (!chiViec && skill === 'speaking' && laGvSpeakingLop(p, classId, luot?.today)),
  );
}

/**
 * PR-MT (K5-31, Q8, T34): lượt MT cụ thể đang xét quyền — MT cũ thì GVCN của lớp và Quản lý (xếp tuần được lớp đó) nhập / sửa / xoá
 * mọi ô ở cả bốn kỹ năng (PR-MTa T22 thay "GVCN chỉ ô trống"); lý do tuỳ chọn.
 */
export type LuotQuyen = { lich_su: number; today?: string };

/**
 * KỸ NĂNG LÀ VIỆC CỦA CHÍNH NGƯỜI NÀY — chỉ đường PHÂN CÔNG, không tính đường sửa hộ.
 *
 * Khác `editableSkills` ở đúng một chỗ, và chỗ đó là cả vấn đề (mục 3.3):
 *
 *   ĐƯỢC PHÉP SỬA  Quản trị hệ thống và Quản lý có quyền sửa điểm mọi kỹ năng để gỡ sự cố.
 *   LÀ VIỆC CỦA TÔI  chỉ kỹ năng người đó được PHÂN CÔNG dạy ở chính lớp đó.
 *
 * Trộn hai thứ này lại thì mở màn Tổng quan lên, Quản trị hệ thống thấy mình đang nợ điểm
 * của cả trung tâm — kể cả những lớp chưa phân công ai. Một danh sách việc như thế không ai
 * đọc, và lớp thật sự thiếu giáo viên thì chìm nghỉm trong đó. Lớp thiếu người đã có nhãn
 * "Thiếu GV ..." riêng ở danh sách lớp; đó mới là việc cần làm, và nó là việc PHÂN CÔNG.
 */
export function mySkills(p: Principal, classId: number, skills: readonly string[]): string[] {
  return skills.filter((skill) => can(p, PERMISSIONS.SCORE_EDIT, { classId, skill }));
}

/**
 * CÁC KỸ NĂNG dời được lịch ở một lớp (sổ SCH-01) — Quản lý/Quản trị dời được mọi kỹ năng
 * (kể cả Fast Track); giáo viên chỉ dời được ở lớp thường, đúng phần mình phụ trách
 * (`SCHEDULE_MOVE` đã tự chặn Fast Track và khớp GVCN/GVBM — xem `teacherAllows`).
 */
export function moveableSkills(p: Principal, classId: number, skills: readonly string[]): string[] {
  if (can(p, PERMISSIONS.PLAN_WEEK, { classId })) return [...skills];
  return skills.filter((skill) => can(p, PERMISSIONS.SCHEDULE_MOVE, { classId, skill }));
}

/**
 * PHẠM VI MỞ RA MẶC ĐỊNH. Ai có dạy thì thấy việc của mình trước — người vừa dạy vừa quản
 * vẫn mở ở "việc của tôi", vì việc của mình mới là thứ không ai làm thay được.
 */
export function defaultWorkScope(p: Principal): WorkScope {
  const today = demoToday();
  return p.assignments.some((a) => activeAt(a, today)) ? 'mine' : 'managed';
}

/** Người dùng đang sửa điểm bằng đường nào — dùng để ghi nhật ký cho đúng. 'lich_su' = lượt MT cũ + (Quản lý lớp, hoặc GVCN lớp — mọi ô, PR-MTa T22). */
export function scoreEditPath(p: Principal, classId: number, skill: string,
  attempt?: { lich_su: number }): 'assigned' | 'lich_su' | 'override' | null {
  if (can(p, PERMISSIONS.SCORE_EDIT, { classId, skill })) return 'assigned';
  /* PR-HSM: GV Speaking chấm S chéo lớp FT cùng chi nhánh — nhật ký như nhập điểm thường (`score.edit`), tên GV chấm ghi ở ô. */
  if (skill === 'speaking' && laGvSpeakingLop(p, classId)) return 'assigned';
  if (attempt?.lich_su === 1 && (can(p, PERMISSIONS.PLAN_WEEK, { classId }) || isCoreTeacherOf(p, classId))) return 'lich_su';
  /* PR-XLMT (chủ sản phẩm chốt 29/09): Quản lý (xếp lịch được lớp đó) sửa điểm qua đường `override` ở mọi lúc — RB-5 vẫn đòi lý do. */
  if (can(p, PERMISSIONS.SCORE_OVERRIDE, { classId }) || can(p, PERMISSIONS.PLAN_WEEK, { classId })) return 'override';
  return null;
}

export function isCoreTeacherOf(p: Principal, classId: number, date = demoToday()): boolean {
  return p.assignments.some((a) => a.classId === classId && a.isCore && activeAt(a, date));
}

/**
 * Người này CÓ DẠY lớp đó không — chủ nhiệm hay bộ môn đều tính.
 *
 * Khác hẳn "có quyền ghi nhận xử lý": Admin chi nhánh ghi hộ được việc CS gọi phụ huynh,
 * nhưng không phải người quyết phương án học thuật cho một em. Màn việc dùng đúng cái này
 * để không giao cho văn phòng một việc chuyên môn mà họ không có căn cứ để làm.
 */
export function teachesClass(p: Principal, classId: number | null, date = demoToday()): boolean {
  if (!classId) return false;
  return p.assignments.some((a) => a.classId === classId && activeAt(a, date));
}

export function permissionSummary(p: Principal) {
  return p.grants.map((g) => ({
    id: g.id,
    role: g.roleKey,
    roleName: g.roleName,
    branchId: g.branchId,
    branchName: g.branchName,
    permissions: [...g.permissions].sort(),
  }));
}

/**
 * BƯỚC TIẾP SAU THI THẬT (OV-12a, chủ SP 14/10): Quản lý (`cycle.edit`) HOẶC TVV của chi nhánh em (`student.edit_more` của vai TVV — CX không).
 * Một hàm cho `loTrinh/buocTiep.ts` (chọn / bỏ / việc / nút) và danh sách lớp của panel Học lại mở từ Bước tiếp.
 */
export function coQuyenBuocTiep(p: Principal, studentId: number): boolean {
  return can(p, PERMISSIONS.CYCLE_EDIT, { studentId })
    || can({ ...p, grants: p.grants.filter((g) => g.roleKey === 'consultant') }, PERMISSIONS.STUDENT_EDIT_MORE, { studentId });
}
