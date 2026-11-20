/**
 * SỔ NGHĨA VỤ — ĐỐI CHIẾU ĐÊM (spec 2.3, lưới an toàn): mỗi chi nhánh tính lại từ gốc mọi bài có tuần thi trong 8 tuần gần nhất + mọi bài đang "Chưa làm",
 * và mọi việc. Dòng BÀI lệch (trước ≠ sau) ghi `nghia_vu_lech` — biết thao tác nào quên gọi `ghiSo`. Việc ở PR-1 chỉ ghi theo chi nhánh (không gắn từng
 * đường ghi) nên đổi của việc chỉ đếm (`doiViec`), không ghi nhật ký lệch.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { ghiSoLuot, ghiSoViecChiNhanh } from '../phanTich/soNghiaVu.ts';
import { xoaNhoHan } from '../platform/cauHinh.ts';
/* SUA-RA-1311: nạp nguồn cấu hình Case & SOS (`datNguonCauHinh` khi nạp module) — thiếu thì gói hàm đêm luôn đọc bản gốc. */
import { quenNhoCauHinh } from '../platform/cauHinhCaseSos.ts';
import { taoViecLap } from '../worklist/mgmttasks.ts';

const COT = 'khoa, loai, kieu, chi_nhanh, lop, hoc_vien, nguoi, s_cheo, pc_nhap_sau, han_goc, han, tuan, xong_luc, nguoi_lam, khong_tinh';
const BAI_CUA = `SELECT ${COT} FROM json_each(?) j JOIN nghia_vu n ON n.khoa >= 'bai:' || j.value || ':' AND n.khoa < 'bai:' || j.value || ';'`;

/**
 * `viecCn`: chi nhánh được tính lại lần này (mặc định: mọi chi nhánh) — cả BÀI lẫn VIỆC. Việc mỗi chi nhánh = một lượt Công việc "Tất cả" (bản chép 07/11: 140 – 1 330 câu) —
 * hàm định kỳ (`netlify/functions/doi-chieu-so.ts`) chạy 5 lần mỗi đêm, mỗi lần MỘT chi nhánh, để không quá giờ hàm.
 * TD-CHAM (17/11, Turso): trước đây bài của MỌI chi nhánh mỗi lần → 5 × 5 lượt bài một đêm (UPDATE "da-xoa" ~10 K dòng đọc mỗi chi nhánh, log 24 h: 29 lần);
 * tính lại lần hai cùng đêm không đổi sổ (cùng dữ liệu gốc) nên mỗi chi nhánh một lần là đủ. Lần đêm lỗi → đêm sau bắt lại (khung 8 tuần).
 */
/** Số lần hàm đêm chạy (`netlify.toml`: 19:20 – 23:20 UTC). */
export const SO_LUOT_DEM = 5;
/**
 * Chi nhánh của lượt đêm thứ `luot` (0 … SO_LUOT_DEM − 1): mỗi lượt một chi nhánh, lượt CUỐI nhận mọi chi nhánh còn lại — có hơn 5 chi nhánh thì chi nhánh
 * thứ 6+ vẫn được đối chiếu mỗi đêm (PTA 17/11). Ngoài khung giờ → [].
 */
export const cnCuaLuot = (cns: readonly number[], luot: number): number[] =>
  luot < 0 || luot >= SO_LUOT_DEM ? [] : cns.slice(luot, luot === SO_LUOT_DEM - 1 ? undefined : luot + 1);

/** `coLap`: tạo việc Vận hành lặp lại — MỘT lần mỗi đêm (hàm định kỳ: lượt đầu). */
export function doiChieuSo(homNay = demoToday(), viecCn?: readonly number[], coLap = true): { cn: number; bai: number; lechBai: number; doiViec: number; lap: { goc: number; tao: number; loi: number } | null } {
  const conn = db();
  xoaNhoHan();   // QTV2-HAN: hạn mặc định đọc lại một lần mỗi lượt (lambda ấm giữ bản cũ)
  quenNhoCauHinh();   // SUA-RA-1311: cấu hình Case & SOS cũng vậy
  /* VH-1 (N59): việc Vận hành lặp lại tới kỳ → bản mới — chạy lại không tạo trùng (khoá việc gốc × kỳ). Lỗi ở đây KHÔNG làm hỏng đối chiếu sổ (PTA mục 3). */
  let lap: { goc: number; tao: number; loi: number } | null = null;
  if (coLap) {
    try { lap = taoViecLap(homNay); } catch (e) { console.error('[doi-chieu-so] việc lặp lại lỗi', e); }
  }
  const tu = addDays(homNay, -56);
  let bai = 0, lechBai = 0, doiViec = 0, cn = 0;
  for (const b of conn.prepare(`SELECT id FROM branches ORDER BY id`).all() as any[]) {
    if (viecCn && !viecCn.includes(b.id)) continue;
    cn += 1;
    const ids = (conn.prepare(`SELECT a.id AS id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE c.branch_id = ? AND (rp.week_start >= ? OR EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
          WHERE k.attempt_id = a.id AND r2.week_start >= ?))
      UNION SELECT CAST(substr(khoa, 5, instr(substr(khoa, 5), ':') - 1) AS INTEGER) AS id FROM nghia_vu
        WHERE loai = 'bai' AND chi_nhanh = ? AND xong_luc IS NULL AND khong_tinh IS NULL AND han < ?`).all(b.id, tu, tu, b.id, homNay) as any[]).map((r) => r.id as number);
    bai += ids.length;
    const chup = (sql: string, ...a: unknown[]) => new Map((conn.prepare(sql).all(...a) as any[]).map((r) => [r.khoa as string, JSON.stringify(r)]));
    const truoc = chup(BAI_CUA, JSON.stringify(ids));
    const viecTruoc = chup(`SELECT ${COT} FROM nghia_vu WHERE loai = 'viec' AND chi_nhanh = ?`, b.id);
    ghiSoLuot(ids);
    ghiSoViecChiNhanh(b.id);
    const sau = chup(BAI_CUA, JSON.stringify(ids));
    const luc = new Date().toISOString();
    for (const [k, v] of sau) {
      if (truoc.get(k) === v) continue;
      lechBai += 1;
      conn.prepare(`INSERT INTO nghia_vu_lech (khoa, truoc, sau, luc) VALUES (?, ?, ?, ?)`).run(k, truoc.get(k) ?? null, v, luc);
    }
    for (const [k, v] of chup(`SELECT ${COT} FROM nghia_vu WHERE loai = 'viec' AND chi_nhanh = ?`, b.id)) if (viecTruoc.get(k) !== v) doiViec += 1;
  }
  return { cn, bai, lechBai, doiViec, lap };
}
