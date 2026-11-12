/**
 * TINH-LUI-PC (chủ SP 12/11 "Duyệt, tính lùi" — sau #1505 hộp Tuần dạy) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: phân công trên bản chính chỉ khai từ 05/10
 * (ngày bắt đầu dùng hệ thống), lớp khai giảng sớm hơn → hộp Tuần dạy / Theo GV hiện phần lớn "Chưa phân công".
 * Mỗi lớp × kỹ năng (GVCN: `is_core = 1`, cùng bảng): (các) dòng `active` / `ended` có `effective_from` SỚM NHẤT mà muộn hơn ngày khai giảng → đặt bằng ngày
 * khai giảng. Không đụng dòng sau, không đụng dòng đã gỡ (`removed`…). Khai giảng = tuần khai giảng (`start_period_id`, cùng nguồn đầu trang lớp / Báo cáo
 * PH FT — #1502), chưa chọn tuần → `start_date`; không có cả hai → bỏ qua lớp.
 * Nhật ký `audit_logs` (action `phan_cong.tinh_lui`, người ghi NULL = migrate) giữ `effective_from` cũ → `khoiPhucTinhLuiPc` trả lại. Khoá `demo_config`.
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { theoLo } from '../db.ts';

export const KHOA_TINH_LUI_PC = 'pr_tinh_lui_phan_cong_da_chay';
const VIEC = 'phan_cong.tinh_lui';

type Doi = { id: number; classId: number; cu: string; moi: string };

/** Dòng cần đổi — CHỈ ĐỌC. */
export function phanCongTinhLui(conn: any): Doi[] {
  /* Mọi dòng mang ngày SỚM NHẤT của nhóm (hai GV cùng nhận từ đầu → cả hai lùi). Một câu: MIN theo nhóm rồi nối lại. */
  const dau = conn.prepare(
    `SELECT ta.id, ta.class_id, substr(ta.effective_from, 1, 10) AS tu
       FROM teacher_assignments ta
       JOIN (SELECT class_id, is_core, COALESCE(skill, '') AS kn, MIN(substr(effective_from, 1, 10)) AS tu FROM teacher_assignments
              WHERE status IN ('active', 'ended') GROUP BY class_id, is_core, COALESCE(skill, '')) m
         ON m.class_id = ta.class_id AND m.is_core = ta.is_core AND m.kn = COALESCE(ta.skill, '') AND m.tu = substr(ta.effective_from, 1, 10)
      WHERE ta.status IN ('active', 'ended')`,
  ).all() as { id: number; class_id: number; tu: string }[];
  if (!dau.length) return [];
  const lops = [...new Set(dau.map((r) => r.class_id))];
  const tienDo = classProgressMany(lops);
  const ngayLop = new Map<number, string | null>();
  theoLo(lops, (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, start_date FROM classes WHERE id IN (${ph})`).all(...lo) as any[])
      ngayLop.set(r.id, (tienDo.get(r.id)?.startWeekStart ?? r.start_date ?? null)?.slice(0, 10) ?? null);
  });
  return dau.flatMap((r) => {
    const kg = ngayLop.get(r.class_id);
    return kg && r.tu > kg ? [{ id: r.id, classId: r.class_id, cu: r.tu, moi: kg }] : [];
  }).sort((a, b) => a.id - b.id);
}

/** Đổi — không khoá (phép kiểm gọi thẳng). Trả dòng đã đổi. */
export function doiTinhLuiPc(conn: any): Doi[] {
  const ds = phanCongTinhLui(conn);
  const up = conn.prepare('UPDATE teacher_assignments SET effective_from = ? WHERE id = ?');
  const ls = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
    VALUES (NULL, '${VIEC}', 'teacher_assignment', ?, ?, ?, ?, ?)`);
  for (const d of ds) {
    up.run(d.moi, d.id);
    ls.run(d.id, `migrate · lớp ${d.classId}`, JSON.stringify({ effective_from: d.cu }), JSON.stringify({ effective_from: d.moi }), nowIso());
  }
  return ds;
}

/**
 * Khôi phục: mỗi dòng về `effective_from` cũ theo nhật ký — chỉ khi giá trị hiện tại còn đúng giá trị migrate đặt (người dùng đã sửa sau thì giữ); dòng nhật ký
 * đổi `…_khoi_phuc` để không trả hai lần. Đọc cột bằng bí danh (bản chính có cột viết hoa — #1198). Trả id dòng đã trả.
 */
export function khoiPhucTinhLuiPc(conn: any): number[] {
  const ra: number[] = [];
  for (const h of conn.prepare(`SELECT id AS id, entity_id AS ta, before_json AS cu, after_json AS moi FROM audit_logs WHERE action = '${VIEC}' ORDER BY id DESC`).all() as any[]) {
    const cu = JSON.parse(h.cu).effective_from, moi = JSON.parse(h.moi).effective_from;
    if (conn.prepare('UPDATE teacher_assignments SET effective_from = ? WHERE id = ? AND substr(effective_from, 1, 10) = ?').run(cu, h.ta, moi).changes) ra.push(h.ta);
    conn.prepare(`UPDATE audit_logs SET action = '${VIEC}_khoi_phuc' WHERE id = ?`).run(h.id);
  }
  return ra;
}

export function migratePrTinhLuiPc(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_TINH_LUI_PC)) return;
  const ds = doiTinhLuiPc(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_TINH_LUI_PC, demoToday(), nowIso());
  if (ds.length) applied.push(`TINH-LUI-PC: ${ds.length} phân công đầu tiên của lớp × kỹ năng tính lùi về ngày khai giảng (${new Set(ds.map((d) => d.classId)).size} lớp; khôi phục: khoiPhucTinhLuiPc).`);
}
