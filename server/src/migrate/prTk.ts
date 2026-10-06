/**
 * PR-TK: bản chụp lộ trình lúc đóng. CHỈ THÊM — hai bảng `ban_chup_lo_trinh` / `ban_chup_luot`, tám cột thi thật ở `learning_cycles`,
 * rồi ĐIỀN NGƯỢC bản chụp cho lộ trình đã đóng mà chưa có (`nguon = 'dien_nguoc'`). Tự kiểm bảng / cột / bản chụp nên chạy lặp được;
 * lần hai không báo gì. Cùng định nghĩa nằm CUỐI `schema.sql`.
 */
import { ghiBanChup } from '../loTrinh/banChup.ts';
import { theoLo } from '../db.ts';
import type { LyDoDong } from '../../../shared/domain/index.ts';

const DDL = `
CREATE TABLE IF NOT EXISTS ban_chup_lo_trinh (
  id INTEGER PRIMARY KEY, cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id), student_id INTEGER NOT NULL REFERENCES students(id),
  lan INTEGER NOT NULL,                       -- 1, 2… (lần đóng thứ mấy; Học lại rồi đóng lại = lan 2)
  ly_do TEXT NOT NULL, dong_ngay TEXT NOT NULL, nguon TEXT NOT NULL,   -- nguon: 'luc_dong' | 'dien_nguoc'
  programme_code TEXT, programme_name TEXT, scoring_mode TEXT, route TEXT, mon_json TEXT,  -- môn của chương trình lúc đóng
  class_id INTEGER, class_code TEXT, branch_id INTEGER, gvcn_user_id INTEGER, gvcn_ten TEXT,   -- lớp cuối của lộ trình; không FK (lớp có thể bị xoá)
  bat_dau_ngay TEXT, target REAL, khong_cam_ket INTEGER,
  dau_vao REAL, dau_vao_nguon TEXT, dau_vao_l REAL, dau_vao_r REAL, dau_vao_w REAL, dau_vao_s REAL,
  thi_du_kien_thang TEXT, thi_du_kien_tuan INTEGER, thi_du_kien_ngay TEXT, thi_du_kien_nhan TEXT,   -- ĐÍCH: Target (cột target) + dự kiến thi lúc đóng
  thi_that_ngay TEXT, thi_that_l REAL, thi_that_r REAL, thi_that_w REAL, thi_that_s REAL, thi_that_ovr REAL,  -- KẾT QUẢ thi thật (FT)
  thi_that_khong_thi INTEGER NOT NULL DEFAULT 0, thi_that_nhap_boi INTEGER, thi_that_nhap_luc TEXT,
  ket_luan TEXT,                              -- reached | not_reached | unknown (máy so thi_that_ovr với target; chưa có / không thi = unknown)
  huong_tiep TEXT,                            -- hoc_lai | len_lt2 | ket_thuc | len_ft | len_lop | chuyen_lop | lo_trinh_moi | khong_ro
  ky_vong_dat INTEGER, ty_le_cuoi_khoa REAL, dai_cuoi_khoa TEXT,                       -- lớp thường
  so_luot INTEGER NOT NULL, lam_moi_luc TEXT, created_at TEXT NOT NULL,
  UNIQUE (cycle_id, lan));
CREATE TABLE IF NOT EXISTS ban_chup_luot (
  id INTEGER PRIMARY KEY, ban_chup_id INTEGER NOT NULL REFERENCES ban_chup_lo_trinh(id) ON DELETE CASCADE,
  attempt_id INTEGER, attempt_no INTEGER, kind TEXT, trang_thai TEXT,    -- done | planned | cancelled | khong_dung (MT0)
  huy_ly_do TEXT, lich_su INTEGER, class_id INTEGER, class_code TEXT, tuan_bat_dau TEXT,
  target_luc_thi REAL, ky_vong REAL, overall REAL, ty_le_tong REAL, sos INTEGER, ket_qua TEXT,   -- cấp lượt (lặp ở mỗi dòng kỹ năng)
  ky_nang TEXT NOT NULL, bat_buoc INTEGER, bo_qua INTEGER, diem REAL, diem_tho REAL, diem_tong REAL, dat INTEGER,
  vang INTEGER, han_cham TEXT, nhap_luc TEXT, nguoi_nhap_id INTEGER, gv_id INTEGER, gv_ten TEXT, case_id INTEGER,
  UNIQUE (ban_chup_id, attempt_id, ky_nang));
CREATE INDEX IF NOT EXISTS idx_bcl_student ON ban_chup_lo_trinh(student_id);
CREATE INDEX IF NOT EXISTS idx_bcl_class ON ban_chup_lo_trinh(class_id);
CREATE INDEX IF NOT EXISTS idx_bcluot_class ON ban_chup_luot(class_id);
`;

const COT_THI_THAT: [string, string][] = [
  ['thi_that_ngay', 'TEXT'], ['thi_that_l', 'REAL'], ['thi_that_r', 'REAL'], ['thi_that_w', 'REAL'], ['thi_that_s', 'REAL'],
  ['thi_that_khong_thi', 'INTEGER NOT NULL DEFAULT 0'], ['thi_that_nhap_boi', 'INTEGER'], ['thi_that_nhap_luc', 'TEXT'],
];

export function migratePrTk(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((x) => x.name as string));
  const them = COT_THI_THAT.filter(([c]) => !co.has(c));
  for (const [c, kieu] of them) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${c} ${kieu}`);
  if (them.length) applied.push(`PR-TK: ${them.length} cột kết quả thi thật ở learning_cycles`);
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ban_chup_lo_trinh'").get()) {
    conn.exec(DDL);
    applied.push('PR-TK: bảng ban_chup_lo_trinh, ban_chup_luot');
  }
  const n = dienNguocBanChup(conn);
  if (n > 0) applied.push(`PR-TK: điền ngược ${n} bản chụp lộ trình đã đóng`);
}

/**
 * ĐIỀN NGƯỢC: mọi lộ trình `status <> 'active'` chưa có bản chụp → ghi một bản (`nguon = 'dien_nguoc'`). Không có lịch sử nên dùng Target / route /
 * chương trình HIỆN TẠI — số có thể khác lúc đóng thật (cột `nguon` giữ dấu cho PR-NC). Lý do suy từ dữ liệu: `abandoned` → Kết thúc học; `completed` +
 * ghi danh kết thúc cùng ngày có `end_kind` → theo `end_kind`; có lộ trình sau bắt đầu cùng ngày → Lộ trình mới; còn lại không rõ. Chạy lặp: lần hai 0 dòng.
 */
export function dienNguocBanChup(conn: any): number {
  const chua = conn.prepare(`SELECT c.id, c.student_id, c.status, c.started_at, c.ended_at, c.seq FROM learning_cycles c
      WHERE c.status <> 'active' AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id) ORDER BY c.id`).all() as any[];
  if (!chua.length) return 0;
  const sids = [...new Set(chua.map((c) => c.student_id as number))];
  const ketThuc = new Map<string, string>();
  const tiep = new Map<number, any[]>();
  theoLo(sids, (lo, ph) => {
    for (const e of conn.prepare(`SELECT student_id, ended_at, end_kind FROM enrollments WHERE student_id IN (${ph}) AND end_kind IS NOT NULL AND ended_at IS NOT NULL`).all(...lo) as any[]) {
      ketThuc.set(`${e.student_id}:${e.ended_at}`, e.end_kind);
    }
    for (const c of conn.prepare(`SELECT student_id, seq, started_at FROM learning_cycles WHERE student_id IN (${ph})`).all(...lo) as any[]) {
      tiep.set(c.student_id, [...(tiep.get(c.student_id) ?? []), c]);
    }
  });
  const THEO_END_KIND: Record<string, LyDoDong> = { len_lop: 'len_lop', hoc_lai: 'hoc_lai', sang_ft: 'sang_ft', chuyen_lop: 'chuyen_lop', ket_thuc: 'ket_thuc', dung_hoc: 'ket_thuc' };
  const nhom = new Map<string, { lyDo: LyDoDong; ngay: string; ids: number[] }>();
  for (const c of chua) {
    const ngay = c.ended_at ?? c.started_at;
    const ek = ketThuc.get(`${c.student_id}:${c.ended_at}`);
    const lyDo: LyDoDong = c.status === 'abandoned' ? 'ket_thuc'
      : ek && THEO_END_KIND[ek] ? THEO_END_KIND[ek]
      : (tiep.get(c.student_id) ?? []).some((x) => x.seq > c.seq && x.started_at === c.ended_at) ? 'lo_trinh_moi' : 'khong_ro';
    const k = `${lyDo}|${ngay}`;
    nhom.set(k, { lyDo, ngay, ids: [...(nhom.get(k)?.ids ?? []), c.id as number] });
  }
  for (const g of nhom.values()) {
    for (let i = 0; i < g.ids.length; i += 200) ghiBanChup(conn, g.ids.slice(i, i + 200), { lyDo: g.lyDo, ngay: g.ngay, nguon: 'dien_nguoc' });
  }
  return chua.length;
}
