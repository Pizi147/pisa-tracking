/**
 * ĐẾM BÀI THIẾU NHẬN XÉT BẮT BUỘC THEO GV (V5 SV-SO1) — CHỈ ĐỌC: chỉ `prepare(...).all()`, không ghi câu nào. Chủ SP chạy trên bản chính TRƯỚC khi
 * deploy SV-SO1 để biết mỗi GV sẽ có thêm bao nhiêu bài "chưa xong" (có band nhưng thiếu nhận xét ≥ 10 ký tự / nhóm nguyên nhân khi dưới kỳ vọng).
 *
 * Tập = ô MT thường (không MT cũ, không MT0) có band, lượt không huỷ, lớp đang mở, em đang học, `O_FT_XONG_SQL` sai — cùng biểu thức cờ `o_cho_tu`
 * dùng; KHÔNG đọc cờ (bản chính chưa migrate thì cờ còn theo luật cũ). Người giữ = phân công ĐANG HIỆU LỰC của (lớp, kỹ năng) — cùng luật Nợ điểm
 * (`phanCongDangHieuLuc`); S Mock = "S chấm chéo" (không là nợ của ai). "quá hạn" = hạn của lượt đã qua (ước lượng: `deadline_override` hoặc tuần thi
 * + 9 ngày = thứ Tư tuần sau) — số chính xác theo từng ô xem ở Công việc sau deploy.
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run dem-thieu-nhan-xet`. Không có biến Turso → DB cục bộ.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { O_FT_XONG_SQL, laChamCheo } from '../../../shared/domain/index.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';

export type DongGv = { gv: string; bai: number; quaHan: number; lop: string[] };

export function demThieuNhanXet(conn: any, today: string): DongGv[] {
  const rows = conn.prepare(
    `SELECT a.class_id, a.kind, sc.skill, c.code AS lop, a.deadline_override,
            (SELECT MIN(rp.week_start) FROM report_periods rp WHERE rp.id = a.planned_period_id) AS tuan
       FROM assessment_scores sc
       JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN classes c ON c.id = a.class_id
       JOIN students s ON s.id = a.student_id
      WHERE sc.band IS NOT NULL AND a.kind = 'mock' AND COALESCE(a.lich_su, 0) = 0 AND a.status != 'cancelled'
        AND c.status = 'active' AND ${HV_DANG_HOC_SQL('s')} AND NOT ${O_FT_XONG_SQL('sc', 'a')}`).all() as any[];
  const nguoi = phanCongDangHieuLuc([...new Set(rows.map((r) => r.class_id as number))], today);
  const theoGv = new Map<string, DongGv>();
  for (const r of rows) {
    const gv = laChamCheo(r.kind, r.skill) ? 'S chấm chéo (không là nợ của ai)' : nguoi.get(`${r.class_id}|${r.skill}`)?.ten ?? 'Chưa phân công';
    const d = theoGv.get(gv) ?? theoGv.set(gv, { gv, bai: 0, quaHan: 0, lop: [] }).get(gv)!;
    d.bai += 1;
    const han = r.deadline_override ?? (r.tuan ? addDays(String(r.tuan).slice(0, 10), 9) : null);
    if (han && han < today) d.quaHan += 1;
    if (!d.lop.includes(r.lop)) d.lop.push(r.lop);
  }
  return [...theoGv.values()].sort((x, y) => y.bai - x.bai || x.gv.localeCompare(y.gv, 'vi'));
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /demThieuNhanXet\.[jt]s$/.test(process.argv[1])) {
  console.log(`[dem-thieu-nhan-xet] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const ds = demThieuNhanXet(db(), demoToday());
    console.log(`\nBài có điểm mà thiếu nhận xét bắt buộc: ${ds.reduce((n, d) => n + d.bai, 0)} bài · ${ds.length} người giữ`);
    for (const d of ds) console.log(`  ${d.gv.padEnd(36)} ${String(d.bai).padStart(5)} bài · ${String(d.quaHan).padStart(5)} quá hạn · ${d.lop.join(', ')}`);
  } catch (e) {
    console.error(`[dem-thieu-nhan-xet] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
