import { db, tx } from '../db.ts';
import { LUAT_LO_TRINH_HIEN, PERMISSIONS, PROGRAMME_TEMPLATES, ROUTES as BUILTIN_ROUTES, ROUTE_NAME } from '../../../shared/domain/index.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { clearScoringModeCache } from '../fasttrack/skillSchedule.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';

/**
 * CẤU HÌNH HỆ THỐNG — mục 7.3: Quản trị hệ thống SỬA lộ trình và chương trình.
 *
 * KHÔNG THÊM MÃ MỚI (K1-48): tên lớp, lịch MT và kỳ vọng đang gắn với các mã có sẵn, nên một mã
 * thêm ở đây sẽ không có tên lớp / lịch / kỳ vọng nào đi kèm. Mã mới đi bằng một PR.
 *
 * ĐIỀU KHÔNG CHO PHÉP: XOÁ một lộ trình hay loại lớp đang có lớp/học viên dùng. Xoá nó thì
 * mọi lớp cũ mất chỗ tựa, và lịch sử đọc lại thành vô nghĩa. Thay vào đó là NGỪNG DÙNG:
 * biến mất khỏi các ô chọn khi tạo mới, nhưng lớp cũ vẫn đọc được.
 */

const KHONG_THEM_MA = 'Không thêm lộ trình/chương trình mới ở đây — tên lớp, lịch MT và kỳ vọng đang gắn với các mã có sẵn.';

/* ------------------------------------------------------------------ lộ trình */

/** `includeInactive` = bản Quản trị: cả mã đã ngừng, kèm `inUse`. Bản chọn (`/ref/routes`) không có `inUse` (PR-Dọn, quét #10). */
export function listRoutes(includeInactive = false) {
  const conn = db();
  const rows = conn
    .prepare(`SELECT * FROM routes ${includeInactive ? '' : "WHERE status = 'active'"} ORDER BY seq, code`)
    .all() as any[];
  return rows.map((r) => ({
    code: r.code, name: r.name, note: r.note, seq: r.seq, status: r.status,
    /* Hai cột chỉ đọc (K1-47) — chữ hiển thị, luật thật là PR-MT. */
    kyVong: LUAT_LO_TRINH_HIEN[r.code]?.kyVong ?? null,
    lichMt: LUAT_LO_TRINH_HIEN[r.code]?.lichMt ?? null,
    /* Đang có bao nhiêu lộ trình học viên dùng mã này — con số quyết định có ngừng được không. */
    ...(includeInactive ? {
      inUse: (conn.prepare('SELECT COUNT(*) n FROM learning_cycles WHERE route = ?').get(r.code) as any).n
        + (conn.prepare('SELECT COUNT(*) n FROM classes WHERE route = ?').get(r.code) as any).n,
    } : {}),
  }));
}

export function saveRoute(p: Principal, input: {
  code: string; name: string; note?: string | null; seq?: number; status?: string;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống sửa được lộ trình.');
  const conn = db();
  const code = String(input.code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) throw badRequest('Mã lộ trình dùng chữ in hoa, số và gạch ngang, 2–12 ký tự.');
  const name = String(input.name ?? '').trim();
  if (!name) throw badRequest('Đặt tên cho lộ trình.');
  const status = input.status === 'inactive' ? 'inactive' : 'active';

  const had = conn.prepare('SELECT * FROM routes WHERE code = ?').get(code) as any;
  if (!had) throw badRequest(KHONG_THEM_MA);
  /* Ngừng dùng thì được; XOÁ thì không — xem chú thích đầu file. */
  conn.prepare('UPDATE routes SET name=?, note=?, seq=?, status=? WHERE code=?')
    .run(name, input.note ?? null, input.seq ?? had.seq, status, code);
  writeAudit({
    actorUserId: p.userId, action: 'route_updated',
    entityType: 'routes', entityLabel: code, after: { name, status },
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ chương trình */

export function listProgrammes(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được cấu hình chương trình.');
  const conn = db();
  return (conn.prepare('SELECT * FROM programmes ORDER BY code').all() as any[]).map((r) => ({
    code: r.code, name: r.name, weeks: r.weeks, scoringMode: r.scoring_mode, status: r.status,
    skills: (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq')
      .all(r.code) as any[]).map((x) => x.skill),
    checkpoints: (conn.prepare('SELECT kind, study_week FROM programme_checkpoints WHERE programme_code = ? ORDER BY study_week')
      .all(r.code) as any[]).map((x) => ({ kind: x.kind, studyWeek: x.study_week })),
    classes: (conn.prepare("SELECT COUNT(*) n FROM classes WHERE programme_code = ?").get(r.code) as any).n,
    /* Chương trình gốc không cho đổi cách chấm hay bộ kỹ năng — xem `saveProgramme`. */
    builtin: Object.prototype.hasOwnProperty.call(PROGRAMME_TEMPLATES, r.code),
  }));
}

/**
 * SỬA CHƯƠNG TRÌNH — không thêm mã mới (K1-48).
 *
 * Hai thứ CỐ Ý KHOÁ với các chương trình gốc (FT, Pre FOU, FOU, BE, ELE):
 *
 *   cách chấm (`scoring_mode`) — đổi nó là đổi ý nghĩa của MỌI điểm đã nhập từ trước;
 *   bộ kỹ năng               — bỏ một kỹ năng là bỏ chỗ tựa của những ô điểm đã có.
 *
 * Tên, số tuần và hai mốc kiểm tra thì sửa được: chỉ áp cho lớp tạo sau khi lưu — lớp đang học giữ
 * số tuần chụp lúc tạo (PF1). Trả `lopGiuSoCu` để màn Quản trị nói bao nhiêu lớp giữ số cũ.
 */
export function saveProgramme(p: Principal, input: {
  code: string; name: string; weeks?: number | null; scoringMode?: string;
  skills?: string[]; progressWeek?: number | null; finalWeek?: number | null;
  status?: string;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống sửa được chương trình.');
  const conn = db();
  const code = String(input.code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) throw badRequest('Mã chương trình dùng chữ in hoa, số và gạch ngang, 2–12 ký tự.');
  const name = String(input.name ?? '').trim();
  if (!name) throw badRequest('Đặt tên cho chương trình.');

  const had = conn.prepare('SELECT * FROM programmes WHERE code = ?').get(code) as any;
  if (!had) throw badRequest(KHONG_THEM_MA);
  const builtin = Object.prototype.hasOwnProperty.call(PROGRAMME_TEMPLATES, code);
  const scoring = builtin ? had.scoring_mode
    : (input.scoringMode === 'ratio' ? 'ratio' : 'ielts_band');
  const weeks = input.weeks === null || input.weeks === undefined ? null : Number(input.weeks);
  if (weeks !== null && (!Number.isInteger(weeks) || weeks < 1 || weeks > 104)) {
    throw badRequest('Số tuần phải là số nguyên từ 1 đến 104, hoặc để trống nếu khoá không cố định.');
  }
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  /* Tuần Cuối khoá bỏ trống = số tuần. Chương trình không có bài Giữa khoá (Pre FOU) không nhận tuần Giữa khoá;
     chương trình có thì bắt buộc — bỏ trống là xoá mất mốc mà màn này không thêm lại được. */
  const finalWeek = input.finalWeek || weeks;
  const progressWeek = input.progressWeek || null;
  const coGiuaKhoa = !!conn.prepare("SELECT 1 FROM programme_checkpoints WHERE programme_code = ? AND kind = 'progress'").get(code);
  if (progressWeek && !coGiuaKhoa) throw badRequest('Chương trình này không có bài Giữa khoá.');
  if (weeks !== null && coGiuaKhoa && !progressWeek) throw badRequest('Chọn tuần Giữa khoá.');
  if (progressWeek && finalWeek && Number(progressWeek) >= Number(finalWeek)) throw badRequest('Giữa khoá phải ở trước Cuối khoá.');

  return tx(() => {
    /*
     * Cách chấm quyết định hạn chấm của từng môn, và câu trả lời đó được nhớ lại theo lớp
     * để danh sách không phải hỏi từng dòng. Sửa chương trình thì bỏ hết phần đã nhớ.
     */
    clearScoringModeCache();
    conn.prepare('UPDATE programmes SET name=?, weeks=?, scoring_mode=?, status=? WHERE code=?')
      .run(name, weeks, scoring, status, code);

    if (!builtin && input.skills) {
      const skills = input.skills.map((s) => String(s)).filter(Boolean);
      if (!skills.length) throw badRequest('Chương trình phải có ít nhất một kỹ năng.');
      conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(code);
      skills.forEach((s, i) => {
        conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(code, s, i);
      });
    }

    /* Hai mốc kiểm tra chỉ có nghĩa với khoá có số tuần cố định. */
    if (weeks !== null && finalWeek) {
      for (const [kind, w] of [['progress', progressWeek], ['final', finalWeek]] as const) {
        if (!w) continue;
        const n = Number(w);
        if (!Number.isInteger(n) || n < 1 || n > weeks) {
          throw badRequest(`Tuần ${kind === 'progress' ? 'Giữa khoá' : 'Cuối khoá'} phải nằm trong 1–${weeks}.`);
        }
      }
      conn.prepare('DELETE FROM programme_checkpoints WHERE programme_code = ?').run(code);
      if (progressWeek) {
        conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?, 'progress', ?)")
          .run(code, Number(progressWeek));
      }
      conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?, 'final', ?)")
        .run(code, Number(finalWeek));
    }

    writeAudit({
      actorUserId: p.userId, action: 'programme_updated',
      entityType: 'programmes', entityLabel: code, after: { name, weeks, scoring, status },
    });
    /* PF1: lớp đang học giữ số tuần chụp lúc tạo — đếm để màn Quản trị nói "N lớp đang học giữ X tuần". */
    const giu = conn.prepare(`SELECT COUNT(*) n, MIN(so_tuan) lo, MAX(so_tuan) hi FROM classes
      WHERE programme_code = ? AND status = 'active' AND so_tuan IS NOT NULL AND so_tuan <> ?`).get(code, weeks ?? -1) as any;
    return { ok: true, lopGiuSoCu: Number(giu.n), soTuanCu: giu.lo === giu.hi ? (giu.lo as number | null) : null };
  });
}

/**
 * Nạp bảng `routes` lần đầu từ danh sách viết cứng, nếu bảng còn trống.
 *
 * Gọi khi seed và khi nâng cấp, nên một database đã chạy vẫn có đủ LT1/LT2 sau khi cập nhật.
 * Bảng trống → nạp đủ LT1, LT2, RF.
 */
export function seedRoutes(conn: any) {
  const n = (conn.prepare('SELECT COUNT(*) n FROM routes').get() as any).n;
  if (n > 0) return 0;
  BUILTIN_ROUTES.forEach((code, i) => {
    conn.prepare('INSERT INTO routes (code, name, note, seq, status, created_at) VALUES (?,?,?,?,?,?)')
      .run(code, ROUTE_NAME[code], null, i + 1, 'active', nowIso());
  });
  return BUILTIN_ROUTES.length;
}

/** Mã lộ trình đang dùng được — thay cho hằng số `ROUTES` ở những chỗ cần danh sách sống. */
export function activeRouteCodes(): string[] {
  const conn = db();
  const rows = conn.prepare("SELECT code FROM routes WHERE status = 'active' ORDER BY seq, code").all() as any[];
  return rows.length ? rows.map((r) => r.code) : [...BUILTIN_ROUTES];
}

export function requireRoute(code: string) {
  const list = activeRouteCodes();
  if (!list.includes(code)) throw notFound(`Không có lộ trình "${code}".`);
  return code;
}

// ==================================================================== quyền theo vai

/**
 * HAI QUYỀN KHÔNG GỠ ĐƯỢC KHỎI QUẢN TRỊ HỆ THỐNG.
 *
 * Bỏ tick `admin.config` của vai Quản trị hệ thống là tự khoá mình ra khỏi chính màn hình
 * đang đứng, và không còn đường nào vào lại ngoài sửa thẳng cơ sở dữ liệu. `student.view` là
 * điều kiện để còn nhìn thấy học viên — mất nó thì hệ thống vẫn chạy nhưng không ai vận hành
 * được nữa.
 */
const LOCKED: Record<string, string[]> = {
  system_admin: [PERMISSIONS.ADMIN_CONFIG, PERMISSIONS.STUDENT_VIEW],
};

/**
 * Bật/tắt MỘT ô trong bảng quyền theo vai.
 *
 * Cố ý làm từng ô một chứ không phải "lưu cả bảng": một lần lưu cả bảng là một lần có thể
 * ghi đè thay đổi của người khác mà không ai biết, và cũng khó ghi nhật ký cho tử tế.
 */
export function setRolePermission(p: Principal, input: {
  roleKey: string; permissionKey: string; granted: boolean;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true },
    'Chỉ Quản trị hệ thống mới sửa được bảng quyền.');
  const conn = db();
  const role = conn.prepare('SELECT id, key, name_vi AS name FROM roles WHERE key = ?').get(input.roleKey) as any;
  if (!role) throw notFound(`Không có vai trò "${input.roleKey}".`);
  const perm = conn.prepare('SELECT id, key, name_vi AS name FROM permissions WHERE key = ?')
    .get(input.permissionKey) as any;
  if (!perm) throw notFound(`Không có quyền "${input.permissionKey}".`);

  if (!input.granted && (LOCKED[role.key] ?? []).includes(perm.key)) {
    throw badRequest(
      `Không gỡ được quyền "${perm.name}" khỏi vai ${role.name} — gỡ xong thì không còn ai vào được màn này.`,
    );
  }

  return tx(() => {
    const had = !!conn
      .prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
      .get(role.id, perm.id);
    if (had === input.granted) return { ok: true, changed: false };

    if (input.granted) {
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(role.id, perm.id);
    } else {
      conn.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(role.id, perm.id);
    }
    writeAudit({
      actorUserId: p.userId,
      action: input.granted ? 'role.permission.grant' : 'role.permission.revoke',
      entityType: 'role', entityId: role.id,
      entityLabel: `${role.name} · ${perm.name}`,
      /* Ghi cả hai đầu để tra lại được ai đổi cái gì, không chỉ trạng thái hiện tại. */
      before: had ? 'có' : 'không', after: input.granted ? 'có' : 'không',
    });
    return { ok: true, changed: true };
  });
}
