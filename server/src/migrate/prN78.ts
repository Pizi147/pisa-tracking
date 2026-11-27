/**
 * N78 (chủ SP 28/11) — chạy lặp không đổi gì: việc TVV "Trao đổi gia đình" đã sinh SỚM (trước khi GVCN xác nhận các việc của lượt — luật cũ BAOPH-0), CHƯA ai ghi,
 * còn mở → đóng lý do `system_cho_buoc_dau` (cùng hàm đồng bộ `dongBoViecTvvLuot`); GVCN xác nhận hết thì việc tự mở lại, hạn tính từ lúc đó. Việc TVV đã ghi một lần: giữ.
 * Nhật ký migrate: số việc theo mã chi nhánh (không tên).
 */
import { VIEC_TVV_BAO_PH } from '../../../shared/domain/index.ts';
import { CHI_NHANH_EM, dongBoViecTvvLuot } from '../yThuc/baoPhTvv.ts';

const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);

export function migratePrN78(conn: any, applied: string[]): void {
  if (!co(conn, 'viec_bao_ph') || !co(conn, 'viec_bao_ph_lan') || !co(conn, 'sos_coordination_actions')) return;
  const ds = conn.prepare(`SELECT x.attempt_id AS luot, b.code AS cn FROM viec_bao_ph v JOIN sos_coordination_actions x ON x.id = v.phoi_hop_id AND x.kind = 'talk_family' AND x.status = 'pending'
      JOIN students s ON s.id = v.student_id LEFT JOIN branches b ON b.id = ${CHI_NHANH_EM}
     WHERE v.trang_thai = 'mo' AND NOT EXISTS (SELECT 1 FROM viec_bao_ph_lan l WHERE l.viec_id = v.id)
       AND EXISTS (SELECT 1 FROM sos_coordination_actions g WHERE g.attempt_id = x.attempt_id AND g.status = 'pending' AND g.kind NOT IN (SELECT value FROM json_each(?)))`)
    .all(JSON.stringify(VIEC_TVV_BAO_PH)) as { luot: number; cn: string | null }[];
  if (!ds.length) return;
  const luot = [...new Set(ds.map((r) => r.luot))];
  for (let i = 0; i < luot.length; i += 200) dongBoViecTvvLuot(luot.slice(i, i + 200));
  const theoCn = new Map<string, number>();
  for (const r of ds) theoCn.set(r.cn ?? '?', (theoCn.get(r.cn ?? '?') ?? 0) + 1);
  applied.push(`N78: ${ds.length} việc TVV Trao đổi gia đình sinh trước khi GVCN xác nhận → chờ (${[...theoCn].map(([k, n]) => `${k} ${n}`).join(' · ')}).`);
}
