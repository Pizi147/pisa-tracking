/**
 * VE-LOP-LUC-THI (N71, chủ SP 26/11 "việc chấm của GV cũ, tính hạn theo lớp cũ") — ĐỔI DỮ LIỆU lúc deploy: chuyển lớp GIỮ khoá trước #2175 kéo MỌI lượt
 * `planned` sang lớp mới, cả lượt còn ô thi ở lớp cũ → Công việc / nợ điểm (theo lớp của lượt) giao ô đó cho GV lớp mới. Nay `luatLoTrinh` giữ lượt đó ở
 * lớp lúc thi; bước này áp cùng luật cho dữ liệu cũ: lượt còn ô chờ (`o_cho_tu`) mà lớp lúc thi của ô chờ sớm nhất (`lopLucThi` — MỘT luật với sổ nghĩa vụ,
 * Phân tích GV) khác lớp của lượt → về lớp lúc thi. Khi ô cũ xong, `veLopDangHoc` (#2190) tự đưa lượt về lớp em đang học như lượt mới.
 * Nhật ký `audit_logs` (action `attempt.ve_lop_luc_thi`, người ghi NULL = migrate) giữ lớp cũ → `khoiPhucVeLopLucThi` trả lại. Chạy lại: không còn lượt lệch → không đổi.
 * ponytail: không tính lại `o_cho_tu` — lượt giữ khoá chỉ đổi giữa lớp cùng chương trình (FT → FT, lớp thường cùng mã) nên cờ không đổi.
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { theoLo } from '../db.ts';
import { lopLucThi, type GhiDanh } from '../phanTich/luatBai.ts';

export const KHOA_VE_LOP_LUC_THI = 'pr_ve_lop_luc_thi_da_chay';
const VIEC = 'attempt.ve_lop_luc_thi';

type Doi = { id: number; cu: number; moi: number };

/** Lượt cần đổi — CHỈ ĐỌC. Ứng viên: lượt `planned` còn ô chờ của em từng chuyển khỏi một lớp khác lớp của lượt. */
export function luotVeLopLucThi(conn: any): Doi[] {
  const ds = conn.prepare(`SELECT a.id, a.class_id, a.student_id, a.o_cho_tu FROM assessment_attempts a
     WHERE a.status = 'planned' AND a.class_id IS NOT NULL AND a.o_cho_tu IS NOT NULL AND a.o_cho_tu != ''
       AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = a.student_id AND e.class_id != a.class_id AND e.status = 'transferred')
     ORDER BY a.id`).all() as { id: number; class_id: number; student_id: number; o_cho_tu: string }[];
  if (!ds.length) return [];
  const gd = new Map<number, GhiDanh[]>();
  theoLo([...new Set(ds.map((r) => r.student_id))], (lo, ph) => {
    for (const e of conn.prepare(`SELECT student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${ph})`).all(...lo) as any[])
      (gd.get(e.student_id) ?? gd.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, den: e.den ?? null });
  });
  return ds.flatMap((r) => {
    const moi = lopLucThi(gd.get(r.student_id) ?? [], r.o_cho_tu.slice(0, 10), r.class_id);
    return moi !== r.class_id ? [{ id: r.id, cu: r.class_id, moi }] : [];
  });
}

/** Đổi — không khoá (phép kiểm gọi thẳng). Trả lượt đã đổi. */
export function doiVeLopLucThi(conn: any): Doi[] {
  const ds = luotVeLopLucThi(conn);
  const up = conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ?');
  const ls = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
    VALUES (NULL, '${VIEC}', 'assessment_attempt', ?, 'migrate', ?, ?, ?)`);
  for (const d of ds) {
    up.run(d.moi, d.id);
    ls.run(d.id, JSON.stringify({ classId: d.cu }), JSON.stringify({ classId: d.moi }), nowIso());
  }
  return ds;
}

/** Khôi phục: lượt về lớp cũ theo nhật ký — chỉ khi lớp hiện tại còn đúng lớp migrate đặt; dòng nhật ký đổi `…_khoi_phuc` để không trả hai lần. Bí danh cột (#1198). */
export function khoiPhucVeLopLucThi(conn: any): number[] {
  const ra: number[] = [];
  for (const h of conn.prepare(`SELECT id AS id, entity_id AS a, before_json AS cu, after_json AS moi FROM audit_logs WHERE action = '${VIEC}' ORDER BY id DESC`).all() as any[]) {
    if (conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ? AND class_id = ?').run(JSON.parse(h.cu).classId, h.a, JSON.parse(h.moi).classId).changes) ra.push(h.a);
    conn.prepare(`UPDATE audit_logs SET action = '${VIEC}_khoi_phuc' WHERE id = ?`).run(h.id);
  }
  return ra;
}

export function migratePrVeLopLucThi(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_VE_LOP_LUC_THI)) return;
  const ds = doiVeLopLucThi(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_VE_LOP_LUC_THI, demoToday(), nowIso());
  if (ds.length) applied.push(`VE-LOP-LUC-THI: ${ds.length} lượt về lớp lúc thi (N71; khôi phục: khoiPhucVeLopLucThi). Sau migrate: npm run nap-so.`);
}
