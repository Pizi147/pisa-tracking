/**
 * SỔ NGHĨA VỤ — ĐỐI CHIẾU ĐÊM (spec 2.3, lưới an toàn): mỗi chi nhánh tính lại từ gốc mọi bài có tuần thi trong 8 tuần gần nhất + mọi bài đang "Chưa làm",
 * và mọi việc. Dòng BÀI lệch (trước ≠ sau) ghi `nghia_vu_lech` — biết thao tác nào quên gọi `ghiSo`. Việc ở PR-1 chỉ ghi theo chi nhánh (không gắn từng
 * đường ghi) nên đổi của việc chỉ đếm (`doiViec`), không ghi nhật ký lệch.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { ghiSoLuot, ghiSoViecChiNhanh } from '../phanTich/soNghiaVu.ts';

const COT = 'khoa, loai, kieu, chi_nhanh, lop, hoc_vien, nguoi, s_cheo, pc_nhap_sau, han_goc, han, tuan, xong_luc, nguoi_lam, khong_tinh';
const BAI_CUA = `SELECT ${COT} FROM json_each(?) j JOIN nghia_vu n ON n.khoa >= 'bai:' || j.value || ':' AND n.khoa < 'bai:' || j.value || ';'`;

/**
 * `viecCn`: chi nhánh được tính lại VIỆC lần này (mặc định: mọi chi nhánh). Việc mỗi chi nhánh = một lượt Công việc "Tất cả" (bản chép 07/11: 140 – 1 330 câu) —
 * hàm định kỳ (`netlify/functions/doi-chieu-so.ts`) chạy 5 lần mỗi đêm, mỗi lần việc của MỘT chi nhánh, để không quá giờ hàm.
 */
export function doiChieuSo(homNay = demoToday(), viecCn?: readonly number[]): { cn: number; bai: number; lechBai: number; doiViec: number } {
  const conn = db();
  const tu = addDays(homNay, -56);
  let bai = 0, lechBai = 0, doiViec = 0, cn = 0;
  for (const b of conn.prepare(`SELECT id FROM branches ORDER BY id`).all() as any[]) {
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
    const coViec = !viecCn || viecCn.includes(b.id);
    if (coViec) ghiSoViecChiNhanh(b.id);
    const sau = chup(BAI_CUA, JSON.stringify(ids));
    const luc = new Date().toISOString();
    for (const [k, v] of sau) {
      if (truoc.get(k) === v) continue;
      lechBai += 1;
      conn.prepare(`INSERT INTO nghia_vu_lech (khoa, truoc, sau, luc) VALUES (?, ?, ?, ?)`).run(k, truoc.get(k) ?? null, v, luc);
    }
    if (coViec) for (const [k, v] of chup(`SELECT ${COT} FROM nghia_vu WHERE loai = 'viec' AND chi_nhanh = ?`, b.id)) if (viecTruoc.get(k) !== v) doiViec += 1;
  }
  return { cn, bai, lechBai, doiViec };
}
