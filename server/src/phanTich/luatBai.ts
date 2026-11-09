/**
 * LUẬT GÁN BÀI dùng chung — bảng Phân tích GV (`giaoVien.ts` · `napBai`, `nguCanhCn`) và sổ nghĩa vụ (`soNghiaVu.ts`) gọi cùng các hàm này, không chép.
 * Hàm thuần: nơi gọi đã nạp phân công / ghi danh / tạm dừng theo lô.
 */
import { addDays } from '../util.ts';
import type { KhoangTamDung } from '../students/tamDung.ts';

/** Một dòng phân công của MỘT ô (lớp + kỹ năng, hoặc GVCN) — `tu` / `den` = effective_from / effective_to. */
export type DongPc = { id: number; gv: number; tu: string; den: string | null };

/** Người có phân công ở ô hiệu lực ngày `d` (`tu ≤ d ≤ den`; ngày đổi: dòng mới — id lớn — thắng). */
export function nguoiPcLuc(ds: readonly DongPc[], d: string): number | null {
  const co = ds.filter((a) => a.tu <= d && (!a.den || a.den >= d));
  return co.length ? co.reduce((x, y) => (y.id > x.id ? y : x)).gv : null;
}

/**
 * Sổ nghĩa vụ (spec 1.2 a, chủ SP 09/11): ngày `d` chưa có phân công (phân công nhập vào hệ thống SAU ngày thi) → phân công GẦN NHẤT có hiệu lực SAU `d`
 * (ngày bắt đầu sớm nhất > d; cùng ngày: id lớn). Không có → null ("Chưa phân công").
 */
export function nguoiPcSau(ds: readonly DongPc[], d: string): number | null {
  const sau = ds.filter((a) => a.tu > d);
  return sau.length ? sau.reduce((x, y) => (y.tu < x.tu || (y.tu === x.tu && y.id > x.id) ? y : x)).gv : null;
}

/** Ghi danh của một em (ngày ISO). */
export type GhiDanh = { lop: number; tu: string; den: string | null };

/** Lớp lúc thi: ghi danh bắt đầu trước hết tuần thi và chưa kết thúc trước tuần thi; nhiều dòng → dòng bắt đầu muộn nhất; không có → lớp của lượt. */
export function lopLucThi(ghiDanh: readonly GhiDanh[], tuan: string, lopLuot: number): number {
  const cuoi = addDays(tuan, 6);
  const ds = ghiDanh.filter((e) => e.tu && e.tu <= cuoi && (!e.den || e.den > tuan));
  return ds.length ? ds.reduce((x, y) => (y.tu > x.tu ? y : x)).lop : lopLuot;
}

/**
 * P12 (E8): em ĐANG HỌC TẠI NGÀY d (hạn nhập) — Q2 cùng nghĩa với `HV_DANG_HOC_SQL` nhưng theo ngày: chưa Kết thúc học / Lưu trữ trước d, không trong
 * khoảng Tạm dừng ở d. Lưu trữ hôm nay không xoá ô kỳ trước. Trạng thái không có ngày (Tạm dừng thiếu nhật ký, Kết thúc thiếu ngày) → không đang học như cũ.
 * `a`: dòng có `hv_status`, `hv_finished`, `hv_archived`.
 */
export function dangHocLuc(a: { hv_status?: string | null; hv_finished?: string | null; hv_archived?: string | null }, kd: readonly KhoangTamDung[], d: string): boolean {
  const fin = a.hv_finished ? String(a.hv_finished).slice(0, 10) : null;
  const arc = a.hv_archived ? String(a.hv_archived).slice(0, 10) : null;
  if ((fin && fin <= d) || (arc && arc <= d)) return false;
  if (kd.some((k) => k.tu.slice(0, 10) <= d && (!k.den || k.den.slice(0, 10) > d))) return false;
  if (a.hv_status === 'inactive' && !kd.some((k) => !k.den)) return false;
  return !(a.hv_status === 'finished' && !fin);
}
