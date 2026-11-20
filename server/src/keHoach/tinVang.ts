/**
 * "VẮNG TUẦN NÀY" (N38, N57 — BPXL-2): MỘT luật cho số "Vắng · n em" của hàng lớp (`danhSachLop`), cờ hàng lưới (`luoiFT`) và tin chuông BPXL.
 * Em vắng tuần T = có ô điểm Mock mang dấu "-" ĐÃ CHỐT của tuần thi T (máy đã dời lần 1 / huỷ lần 2), trừ MT cũ "Không dự thi" (`no_show_cu`).
 * Chỉ là thông tin — không số / nhãn / việc "xếp lại" (chủ SP 20/11).
 */
import { db } from '../db.ts';
import { nowIso } from '../util.ts';
import { tuanLich } from '../../../shared/domain/index.ts';
import { nguoiVaiCuaChiNhanh } from '../platform/audit.ts';
import { nhoTheoBang } from '../platform/nguCanhRequest.ts';

/** Điều kiện SQL trên ô điểm `sc`; một tham số `?` = thứ Hai tuần thi (`YYYY-MM-DD`). */
export const VANG_TUAN_SQL = (sc: string) =>
  `(${sc}.no_show_settled_at IS NOT NULL AND ${sc}.no_show_cu = 0 AND ${sc}.no_show_period_id = (SELECT id FROM report_periods WHERE week_start = ?))`;

/** Cùng luật trên dòng điểm đã nạp (`diemCuaLuot` có `no_show_week_start`). */
export const laVangTuan = (s: { no_show_settled_at?: string | null; no_show_cu?: number | null; no_show_week_start?: string | null }, tuan: string) =>
  !!s.no_show_settled_at && !s.no_show_cu && String(s.no_show_week_start ?? '').slice(0, 10) === tuan;

/** Một em trong tin gộp — web dựng chữ (có bản EN) từ đây. */
export type EmVang = { ten: string; mt: number; kn: string[]; huy: boolean; tuanMoi: string | null; luc: string | null };

/**
 * TIN CHUÔNG "n em vắng · lớp · tuần" cho BPXL của chi nhánh lớp (+ BPXL toàn hệ thống): MỘT tin mỗi lớp × tuần (`dedup_key`), mỗi lần có em vắng mới
 * thì cập nhật số em và hiện lại là tin mới (`moi`); Bỏ vắng chỉ cập nhật lặng (hết em → xoá tin). Không vào "Việc cần làm", không nhắc lại.
 * Chi nhánh không có BPXL → dừng sau một câu (người giữ vai nhớ trong request).
 */
export function capNhatTinVang(classId: number | null, tuan: string, moi: boolean, today: string) {
  if (!classId) return;
  const conn = db();
  const lop = conn.prepare('SELECT code, branch_id FROM classes WHERE id = ?').get(classId) as { code: string; branch_id: number } | undefined;
  if (!lop) return;
  const nhan = nhoTheoBang(['user_roles', 'roles', 'users'], `bpxl-cn:${lop.branch_id}`, () => nguoiVaiCuaChiNhanh(lop.branch_id, 'scheduler'));
  if (!nhan.length) return;
  const khoa = `vang_lop:${classId}:${tuan}`;
  const dong = conn.prepare(
    `SELECT a.student_id, s.full_name, a.attempt_no, k.skill, k.sit_status, k.huy_vang, rp.week_start AS tuan_moi, MAX(sc.no_show_at) AS luc
       FROM assessment_attempts a
       JOIN assessment_scores sc ON sc.attempt_id = a.id AND ${VANG_TUAN_SQL('sc')}
       JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = CASE WHEN sc.skill IN ('writing1', 'writing2') THEN 'writing' ELSE sc.skill END
       JOIN students s ON s.id = a.student_id
       LEFT JOIN report_periods rp ON rp.id = k.planned_period_id
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled'
      GROUP BY a.id, k.skill
      ORDER BY a.student_id, a.attempt_no, k.skill`,
  ).all(tuan, classId) as any[];
  if (!dong.length) { conn.prepare('DELETE FROM notifications WHERE dedup_key = ?').run(khoa); return; }
  const em = new Map<string, EmVang>();
  for (const r of dong) {
    const k = `${r.student_id}:${r.attempt_no}`;
    const e = em.get(k) ?? em.set(k, { ten: r.full_name, mt: r.attempt_no, kn: [], huy: false, tuanMoi: null, luc: null }).get(k)!;
    e.kn.push(r.skill);
    if (r.sit_status === 'cancelled' && r.huy_vang) e.huy = true;
    else if (r.tuan_moi && r.tuan_moi !== tuan) e.tuanMoi = e.tuanMoi && e.tuanMoi > r.tuan_moi ? e.tuanMoi : r.tuan_moi;
    if (r.luc && (!e.luc || r.luc > e.luc)) e.luc = r.luc;
  }
  const ds = [...em.values()].sort((x, y) => (y.luc ?? '').localeCompare(x.luc ?? ''));
  const soEm = new Set(dong.map((r) => r.student_id)).size;
  const title = `${soEm} em vắng · ${lop.code} · ${tuanLich(tuan, today)}`;
  const body = JSON.stringify({ soEm, lop: lop.code, tuan, em: ds });
  const duong = `/test/ke-hoach?loai=ft&classId=${classId}&lop=${classId}&so=vang`;
  const ghi = conn.prepare(
    `INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)
     VALUES (?, 'vang_lop', ?, ?, 'class', ?, ?, ?, ?)
     ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body, duong = excluded.duong
       ${moi ? ', read_at = NULL, created_at = excluded.created_at' : ''}`,
  );
  const luc = nowIso();
  for (const u of nhan) ghi.run(u, title, body, classId, khoa, luc, duong);
}
