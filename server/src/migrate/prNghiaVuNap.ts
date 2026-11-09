/**
 * SỔ NGHĨA VỤ — NẠP DỮ LIỆU CŨ (spec 2.4): dựng sổ cho mọi lượt Test (mọi ô bắt buộc) + mọi việc có hạn của từng chi nhánh, theo lô. Upsert theo khoá →
 * chạy lặp không nhân đôi, không đổi. Chạy MỘT lần sau migrate (`npm run nap-so`); về sau đối chiếu đêm (`doiChieuSo`) giữ sổ khớp gốc.
 * Không đặt trong migrate.ts: nạp đọc qua `db()` (kết nối chính), migrate chạy trên kết nối được truyền vào.
 */
import { db } from '../db.ts';
import { ghiSoLuot, ghiSoViecChiNhanh } from '../phanTich/soNghiaVu.ts';

const LUOT_MOI_LO = 300;

export function napSoNghiaVu(): { bai: number; viec: number } {
  const conn = db();
  const ids = (conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id IS NOT NULL ORDER BY id`).all() as any[]).map((r) => r.id as number);
  for (let i = 0; i < ids.length; i += LUOT_MOI_LO) ghiSoLuot(ids.slice(i, i + LUOT_MOI_LO));
  for (const b of conn.prepare(`SELECT id FROM branches ORDER BY id`).all() as any[]) ghiSoViecChiNhanh(b.id);
  const dem = (loai: string) => (conn.prepare(`SELECT COUNT(*) AS n FROM nghia_vu WHERE loai = ?`).get(loai) as any).n as number;
  return { bai: dem('bai'), viec: dem('viec') };
}
