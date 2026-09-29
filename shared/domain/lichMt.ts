/**
 * LỊCH MT FAST TRACK — một nguồn cho web, máy chủ và lệnh ops (PR-MT, đặc tả 27/09 §5.2 M1–M8, T33–T36, T42, Q-B).
 *
 *   lịch mặc định   LT1/LT2: MT1/MT2/MT3 ở tuần học 6/12/16 · RF: MT1/MT2 ở tuần học 4/8 · lớp thường: không có
 *   MT lịch sử      lượt có tuần thi kết thúc TRƯỚC ngày tạo lượt — cờ `lich_su` lưu lúc tạo, không suy lại khi đọc (M-13)
 *   cửa sổ Case     chỉ lượt lịch sử có tuần thi trong 4 tuần trước ngày tạo mới sinh Case/PA quy chế/Phối hợp (M4)
 *   đánh số         liền mạch: MT(n) chỉ tạo khi đã có MT(n−1); số huỷ KHÔNG điểm được dùng lại (Q-B)
 */
import { MOCK_FT_STUDY_WEEK } from './fasttrack.ts';
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';

export const CUA_SO_CASE_LICH_SU_NGAY = 28;
/** T37: một lộ trình tối đa MT8. */
export const MT_TOI_DA = 8;

/** Tuần HỌC của từng MT mặc định theo lộ trình. `null` = lớp thường (không có MT). */
export function lichMtMacDinh(route: string | null): number[] {
  if (!route) return [];
  return route === 'RF' ? [4, 8] : [6, 12, 16];
}

/** Tuần học của MT(n) — ngoài lịch mặc định (QL tự xếp, "đã thi tới MT") thì RF cách 4 tuần, LT theo bảng rồi cách 4 tuần (Q1). */
export function tuanHocCuaMt(route: string | null, n: number): number {
  const md = lichMtMacDinh(route);
  if (n >= 1 && n <= md.length) return md[n - 1];
  if (route === 'RF') return 8 + 4 * (n - 2);
  return MOCK_FT_STUDY_WEEK[n] ?? 16 + 4 * (n - 3);
}

/** T34: Chủ nhật tuần thi muộn nhất đã qua trước ngày tạo lượt. So NGÀY KẾT THÚC tuần, không so tuần bắt đầu. */
export function laLichSu(tuanKetThucMuonNhat: string, ngayTao: string): boolean {
  return tuanKetThucMuonNhat.slice(0, 10) < ngayTao.slice(0, 10);
}

/** M4: tuần thi kết thúc trong 28 ngày trước ngày tạo (biên tính là trong). */
export function trongCuaSoCase(tuanKetThucMuonNhat: string, ngayTao: string): boolean {
  return tuanKetThucMuonNhat.slice(0, 10) >= addDaysIso(ngayTao.slice(0, 10), -CUA_SO_CASE_LICH_SU_NGAY);
}

/** Lượt này có sinh Case/PA quy chế/Phối hợp không: lượt thường luôn có; lượt lịch sử chỉ khi trong cửa sổ 4 tuần (M4, M-14). */
export function luotSinhViec(a: { lich_su: number; tuanKetThuc: string | null; created_at: string }): boolean {
  if (!a.lich_su) return true;
  return !!a.tuanKetThuc && trongCuaSoCase(a.tuanKetThuc, a.created_at);
}

/** `daThi`: có kỹ năng đã thi (`sat`) mà chưa chấm — "Huỷ cả lượt" chặn như đã có điểm (còn nghĩa vụ chấm). */
export type LuotSo = { attempt_no: number; status: string; coDiem: boolean; daThi?: boolean };

/** Số MT kế tiếp của lộ trình. Lượt huỷ CÒN ĐIỂM (dữ liệu cũ) vẫn giữ số của nó; huỷ không điểm thì số được dùng lại. */
export function soMtKeTiep(ds: LuotSo[]): number {
  return Math.max(0, ...ds.filter((x) => x.status !== 'cancelled' || x.coDiem).map((x) => x.attempt_no)) + 1;
}

/** `null` = tạo được MT(n); còn lại là câu lỗi tiếng Việt cho người dùng. Đếm lượt CÒN HIỆU LỰC (`status != 'cancelled'`). */
export function kiemSoMtMoi(ds: LuotSo[], n: number): string | null {
  const con = ds.filter((x) => x.status !== 'cancelled');
  if (!Number.isInteger(n) || n < 1) return 'Số MT không hợp lệ.';
  if (n > MT_TOI_DA) return `Tối đa MT${MT_TOI_DA} cho một lộ trình.`;
  if (con.some((x) => x.attempt_no === n)) return `Lộ trình này đã có MT${n}. Đổi tuần thay vì tạo mới.`;
  const ke = soMtKeTiep(ds);
  if (n > ke) return `Chưa có MT${ke} — xếp MT${ke} trước rồi mới xếp MT${n}.`;
  if (ds.some((x) => x.attempt_no === n && x.status === 'cancelled' && x.coDiem)) return `MT${n} đã huỷ nhưng còn điểm — không dùng lại số này.`;
  return null;
}

/**
 * K2-33(1), Q8: tuần đã qua CHỈ để TẠO MT lịch sử — mọi kỹ năng đều tuần đã qua VÀ em vào web sau các tuần đó.
 * `ketThuc` = Chủ nhật tuần thi của từng kỹ năng (so Chủ nhật, không so thứ Hai).
 */
export function kiemTuanDaQua(o: { ketThuc: string[]; ngayVaoWeb: string; homNay: string; taoMoi: boolean }): { cau: string | null; lichSu: boolean } {
  const qua = o.ketThuc.filter((w) => laLichSu(w, o.homNay));
  if (!qua.length) return { cau: null, lichSu: false };
  if (!o.taoMoi) return { cau: 'Không dời vào tuần đã qua — chọn tuần từ tuần này trở đi.', lichSu: false };
  if (qua.length < o.ketThuc.length) return { cau: 'Tuần đã qua chỉ dùng để nhập MT lịch sử — chọn tuần đã qua cho mọi kỹ năng.', lichSu: false };
  const muonNhat = [...qua].sort()[qua.length - 1];
  if (o.ngayVaoWeb.slice(0, 10) <= muonNhat.slice(0, 10)) {
    return { cau: 'Em đã có trên web từ trước tuần này — không xếp MT lịch sử vào tuần em đã học trên web.', lichSu: false };
  }
  return { cau: null, lichSu: true };
}

/** Rà #120: "Đã thi tới MT" = d mà MT1…MT(d) có MT rơi vào tuần chưa qua → số các MT đó (để nhắc lùi Tuần bắt đầu). */
export function mtDaThiChuaQua(route: string | null, tuanBatDau: string, daThiToiMt: number, homNay: string): number[] {
  return Array.from({ length: daThiToiMt }, (_, i) => i + 1)
    .filter((n) => !laLichSu(addDaysIso(tuanBatDau.slice(0, 10), (tuanHocCuaMt(route, n) - 1) * 7 + 6), homNay));
}

export type CachHuy = 'ca-luot' | 'phan-con-lai' | null;

/** Q-B, M-12: "Huỷ cả lượt" chỉ với lượt LỚN NHẤT còn hiệu lực, chưa có điểm và chưa thi kỹ năng nào; còn lại "Huỷ phần còn lại". */
export function cachHuyLuot(l: LuotSo, ds: LuotSo[]): CachHuy {
  if (l.status === 'cancelled') return null;
  return !l.coDiem && !l.daThi && l.attempt_no === Math.max(...ds.filter((x) => x.status !== 'cancelled').map((x) => x.attempt_no)) ? 'ca-luot' : 'phan-con-lai';
}

/** T42, K4-04: hạn duyệt đề nghị dời lần 2 = Chủ nhật của TUẦN CHỨA NGÀY GỬI (không phải tuần đích). */
export function hanDuyetDoiLan2(ngayGui: string): string {
  const d = new Date(`${ngayGui.slice(0, 10)}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDaysIso(ngayGui.slice(0, 10), 6 - dow);
}

/** Điều kiện SQL "lượt tính nợ/hạn" — chèn vào WHERE mọi nơi đếm nợ, hạn, quá hạn, chờ chấm (Task 5). */
export const LUOT_TINH_NO_SQL = (a: string) => `${a}.lich_su = 0`;
/** "Lượt đã có điểm" (Q-B, K2-33): ít nhất một ô có band hoặc điểm thô. Dấu "-" không phải điểm. Trả 0/1. */
export const CO_DIEM_SQL = (a: string) =>
  `EXISTS (SELECT 1 FROM assessment_scores sx WHERE sx.attempt_id = ${a}.id AND (sx.band IS NOT NULL OR sx.raw_score IS NOT NULL))`;

/** Mốc đánh giá kế tiếp (K2-05, K2-31): lượt `planned`, không lịch sử, tuần từ thứ Hai tuần này trở đi — sớm nhất. */
export function mocKeTiep<T extends { status: string; lich_su: number; weekStart: string | null; attempt_no: number }>(
  ds: T[], homNay: string,
): T | null {
  const tuanNay = mondayOfDate(homNay);
  const con = ds.filter((x) => x.status === 'planned' && !x.lich_su && !!x.weekStart && x.weekStart.slice(0, 10) >= tuanNay);
  con.sort((a, b) => a.weekStart!.localeCompare(b.weekStart!) || a.attempt_no - b.attempt_no);
  return con[0] ?? null;
}

/** Cùng luật `mocKeTiep` cho câu đếm theo lô (không N+1). Tham số `?` = thứ Hai của tuần này. */
export const MOC_KE_TIEP_SQL = (a: string, rp: string) => `${a}.status = 'planned' AND ${a}.lich_su = 0 AND ${rp}.week_start >= ?`;

/** K2-05: em FT "có mốc đánh giá tiếp theo" = có mốc kế tiếp, HOẶC đã qua MT cuối của lịch mặc định và đã có ngày/tháng thi. */
export function coMocTiepTheo(o: { coMoc: boolean; route: string | null; mtCuoi: number; coNgayThi: boolean }): boolean {
  return o.coMoc || (lichMtMacDinh(o.route).length > 0 && o.mtCuoi >= lichMtMacDinh(o.route).length && o.coNgayThi);
}
