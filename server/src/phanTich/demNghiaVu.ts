/**
 * ĐẾM SỔ NGHĨA VỤ (spec `2026-11-09-so-nghia-vu-design.md` mục 1.3 · 1.6 · 1.7): mọi nơi (Phân tích GV, hồ sơ GV, Tổng quan — PR-2) đọc 3 số
 * Đúng hạn · Làm muộn · Chưa làm qua các hàm này. Trạng thái tính lúc đọc từ `han` / `han_goc` / `tuan` / `xong_luc`; mốc W4 OCT CHỈ áp ở `trangThai`.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { truocMoc } from './soNghiaVu.ts';

export type So3 = { dung: number; muon: number; chua: number };
export type TrangThaiNv = 'dung' | 'muon' | 'chua' | 'chua-toi';
/**
 * `chiNhanh`: một chi nhánh · nhiều (hồ sơ GV: phạm vi người xem) · null = mọi chi nhánh. `khung` (Phân tích GV): bài / việc của lớp khung đó + việc không
 * gắn lớp (như Công việc); vắng = mọi khung. `nguoi`: chỉ dòng của người đó (+ bài S chéo chung của chi nhánh) — đọc theo chỉ mục (nguoi, han).
 */
type Q = { chiNhanh: number | readonly number[] | null; tu: string; den: string; loai: 'bai' | 'viec'; homNay: string; khung?: 'ft' | 'thuong' | null; nguoi?: number };

const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

/**
 * Bốn ô (spec 1.3): xong ≤ hạn hiện tại → Đúng hạn; xong sau → Làm muộn; chưa xong và hôm nay > hạn → Chưa làm; còn lại → Chưa tới hạn.
 * Mốc (spec 1.6): đã xong mà hạn gốc (bài: Thứ Hai tuần thi) trước thứ Hai W4 OCT 2026 → Đúng hạn. Chưa xong thì mốc không cứu.
 */
export function trangThai(d: { han: string | null; hanGoc?: string | null; tuan?: string | null; xongLuc: string | null }, homNay: string): TrangThaiNv {
  if (!d.han) return 'chua-toi';
  if (d.xongLuc) return d.xongLuc <= d.han || truocMoc(d.tuan ?? d.hanGoc ?? d.han) ? 'dung' : 'muon';
  return homNay > d.han ? 'chua' : 'chua-toi';
}

type DongDoc = { khoa: string; loai: string; kieu: string; chi_nhanh: number; lop: number | null; hoc_vien: number | null; nguoi: number | null; s_cheo: number;
  pc_nhap_sau: number; han_goc: string | null; han: string | null; tuan: string | null; xong_luc: string | null; nguoi_lam: number | null };
const COT_DOC = 'khoa, loai, kieu, chi_nhanh, lop, hoc_vien, nguoi, s_cheo, pc_nhap_sau, han_goc, han, tuan, xong_luc, nguoi_lam';
const tt = (r: DongDoc, homNay: string) => trangThai({ han: r.han, hanGoc: r.han_goc, tuan: r.tuan, xongLuc: r.xong_luc }, homNay);

/**
 * GV có kỹ năng S (hồ sơ GV) có vai giáo viên ở chi nhánh — TẠI NGÀY HẠN (lịch sử `user_skill_lich_su`, chủ SP 10/11; người chưa có dòng lịch sử nào:
 * kỹ năng hiện tại). Bỏ S → bài hạn sau ngày bỏ không còn tính cho người đó; bài đã quá hạn trước vẫn tính. Một câu cho mọi chi nhánh của các dòng.
 * ponytail: vai giáo viên ở chi nhánh đọc theo HIỆN TẠI (`user_roles` không có lịch sử) — GV rời chi nhánh thôi bị tính bài S chéo cũ; cần lịch sử vai thì thêm.
 */
function nhomS(cns: readonly number[]): (cn: number, ngay: string) => number[] {
  if (!cns.length) return () => [];
  const rows = db().prepare(`SELECT ur.branch_id AS cn, ur.user_id AS gv, l.tu, l.den, (us.user_id IS NOT NULL) AS hien_co
      FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
      LEFT JOIN user_skill_lich_su l ON l.user_id = ur.user_id AND l.skill = 'speaking'
      LEFT JOIN user_skills us ON us.user_id = ur.user_id AND us.skill = 'speaking'
     WHERE ur.status = 'active' AND ur.branch_id IN (SELECT value FROM json_each(?))`).all(JSON.stringify([...new Set(cns)])) as any[];
  return (cn, ngay) => [...new Set(rows.filter((r) => r.cn === cn && (r.tu != null ? r.tu <= ngay && (!r.den || r.den > ngay) : !!r.hien_co)).map((r) => r.gv as number))];
}

/**
 * Dòng đang tính (không `khong_tinh`) có hạn trong kỳ — một câu. Theo chỉ mục (chi_nhanh, han): mọi chi nhánh = `chi_nhanh IN (mọi chi nhánh)` (không quét
 * cả bảng). Có `nguoi`: hai nhánh UNION ALL theo chỉ mục (nguoi, han) — dòng của người đó + dòng S chéo chưa ai nhận (`nguoi IS NULL`).
 */
function docKy(q: Q): DongDoc[] {
  const cn = q.chiNhanh == null ? null : JSON.stringify(typeof q.chiNhanh === 'number' ? [q.chiNhanh] : q.chiNhanh);
  const dk = `n.loai = ? AND n.khong_tinh IS NULL AND n.han BETWEEN ? AND ?
    AND n.chi_nhanh IN (${cn ? 'SELECT value FROM json_each(?)' : 'SELECT id FROM branches'})
    ${q.khung ? `AND (n.lop IS NULL OR n.lop IN (SELECT c.id FROM classes c WHERE c.is_fast_track = ?${cn ? ' AND c.branch_id IN (SELECT value FROM json_each(?))' : ''}))` : ''}`;
  const tham = [q.loai, q.tu, q.den, ...(cn ? [cn] : []), ...(q.khung ? [q.khung === 'ft' ? 1 : 0, ...(cn ? [cn] : [])] : [])];
  if (q.nguoi == null) return db().prepare(`SELECT ${COT_DOC} FROM nghia_vu n WHERE ${dk}`).all(...tham) as DongDoc[];
  return db().prepare(`SELECT ${COT_DOC} FROM nghia_vu n WHERE n.nguoi = ? AND ${dk}
      UNION ALL SELECT ${COT_DOC} FROM nghia_vu n WHERE n.nguoi IS NULL AND n.s_cheo = 1 AND ${dk}`).all(q.nguoi, ...tham, ...tham) as DongDoc[];
}

/** Người chịu dòng (spec 1.2): người đã ghi; S chéo chưa ai nhận → mọi GV có S của chi nhánh tại ngày hạn; chưa phân công → không ai. */
function nguoiCua(rows: readonly DongDoc[]): (r: DongDoc) => number[] {
  const s = nhomS(rows.some((r) => r.s_cheo && r.nguoi == null) ? rows.filter((r) => r.s_cheo && r.nguoi == null).map((r) => r.chi_nhanh) : []);
  return (r) => (r.nguoi != null ? [r.nguoi] : r.s_cheo ? s(r.chi_nhanh, r.han!) : []);
}
/** Dòng S chéo chưa ai nhận — đếm riêng ("+ n S chéo chung", chủ SP 10/11), không cộng vào 3 số riêng. */
const sChung = (r: DongDoc) => !!r.s_cheo && r.nguoi == null;

/**
 * 3 số RIÊNG của mỗi người trong kỳ + `sChung` = số bài S chéo chung chưa làm (mọi GV có S cùng số; hiển thị dòng phụ). `chiNhanh = null` → mọi chi nhánh,
 * một người một dòng (tổng). ≤ 2 câu.
 */
export function demTheoNguoi(q: Q): Map<number, So3 & { sChung: number }> {
  const rows = docKy(q);
  const ai = nguoiCua(rows);
  const out = new Map<number, So3 & { sChung: number }>();
  for (const r of rows) {
    const t = tt(r, q.homNay);
    if (t === 'chua-toi') continue;
    for (const g of ai(r)) {
      if (q.nguoi != null && g !== q.nguoi) continue;
      const x = out.get(g) ?? out.set(g, { dung: 0, muon: 0, chua: 0, sChung: 0 }).get(g)!;
      if (sChung(r)) { if (t === 'chua') x.sChung += 1; } else x[t] += 1;
    }
  }
  return out;
}

export type DongNvXem = {
  khoa: string; loai: string; kieu: string; chiNhanh: number; lop: number | null; hocVien: number | null; sCheo: boolean; pcNhapSau: boolean;
  han: string; hanGoc: string | null; tuan: string | null; xongLuc: string | null; nguoiLam: number | null; trangThai: Exclude<TrangThaiNv, 'chua-toi'>;
  /** Bài S chéo chưa ai nhận (của cả nhóm GV có S — không vào 3 số riêng; panel nhóm riêng "S chéo chung"). */
  sChung: boolean;
  /** Làm muộn: số ngày muộn · Chưa làm: số ngày quá hạn. */
  soNgay: number | null;
};
const xem = (r: DongDoc, t: Exclude<TrangThaiNv, 'chua-toi'>, homNay: string): DongNvXem => ({
  khoa: r.khoa, loai: r.loai, kieu: r.kieu, chiNhanh: r.chi_nhanh, lop: r.lop, hocVien: r.hoc_vien, sCheo: !!r.s_cheo, pcNhapSau: !!r.pc_nhap_sau,
  han: r.han!, hanGoc: r.han_goc && r.han_goc !== r.han ? r.han_goc : null, tuan: r.tuan, xongLuc: r.xong_luc, nguoiLam: r.nguoi_lam, trangThai: t, sChung: sChung(r),
  soNgay: t === 'muon' ? ngayCach(r.han!, r.xong_luc!) : t === 'chua' ? ngayCach(r.han!, homNay) : null,
});
const THU_TU: Record<string, number> = { chua: 0, muon: 1, dung: 2 };

/** Dòng của MỘT người trong kỳ (panel): Chưa làm trước (quá lâu nhất đầu), rồi Làm muộn, Đúng hạn. Cùng tập với `demTheoNguoi`. */
export function dongCuaNguoi(q: Q & { nguoi: number }): DongNvXem[] {
  const rows = docKy(q);
  const ai = nguoiCua(rows);
  const out: DongNvXem[] = [];
  for (const r of rows) {
    const t = tt(r, q.homNay);
    if (t !== 'chua-toi' && ai(r).includes(q.nguoi)) out.push(xem(r, t, q.homNay));
  }
  return out.sort((a, b) => THU_TU[a.trangThai] - THU_TU[b.trangThai] || (b.soNgay ?? 0) - (a.soNgay ?? 0) || a.han.localeCompare(b.han));
}

/**
 * Bài / việc không có người (spec 1.2 a, "Chưa phân công") của một chi nhánh trong kỳ — cho QL. Gồm bài S chéo chưa ai nhận mà chi nhánh không còn GV nào có
 * kỹ năng S tại ngày hạn (chủ SP 10/11).
 */
export function chuaPhanCong(chiNhanh: number, tu: string, den: string, homNay = demoToday(), khung?: 'ft' | 'thuong' | null): DongNvXem[] {
  const rows = db().prepare(`SELECT ${COT_DOC} FROM nghia_vu WHERE chi_nhanh = ? AND han BETWEEN ? AND ? AND khong_tinh IS NULL AND nguoi IS NULL
      ${khung ? 'AND (lop IS NULL OR lop IN (SELECT id FROM classes WHERE branch_id = ? AND is_fast_track = ?))' : ''}`)
    .all(chiNhanh, tu, den, ...(khung ? [chiNhanh, khung === 'ft' ? 1 : 0] : [])) as DongDoc[];
  const ai = nguoiCua(rows);
  return rows.flatMap((r) => { const t = tt(r, homNay); return t === 'chua-toi' || ai(r).length ? [] : [xem(r, t, homNay)]; });
}
