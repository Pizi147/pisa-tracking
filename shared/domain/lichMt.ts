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

export type LuotSo = { attempt_no: number; status: string; coDiem: boolean };

/** Số MT kế tiếp của lộ trình. Lượt huỷ CÒN ĐIỂM (dữ liệu cũ) vẫn giữ số của nó; huỷ không điểm thì số được dùng lại. */
export function soMtKeTiep(ds: LuotSo[]): number {
  return Math.max(0, ...ds.filter((x) => x.status !== 'cancelled' || x.coDiem).map((x) => x.attempt_no)) + 1;
}

/** `null` = tạo được MT(n); còn lại là câu lỗi tiếng Việt cho người dùng. Đếm lượt CÒN HIỆU LỰC (`status != 'cancelled'`). */
export function kiemSoMtMoi(ds: LuotSo[], n: number): string | null {
  const con = ds.filter((x) => x.status !== 'cancelled');
  if (!Number.isInteger(n) || n < 1) return 'Số MT không hợp lệ.';
  if (con.some((x) => x.attempt_no === n)) return `Lộ trình này đã có MT${n}. Đổi tuần thay vì tạo mới.`;
  const ke = soMtKeTiep(ds);
  if (n > ke) return `Chưa có MT${ke} — tạo MT${ke} trước rồi mới tới MT${n}.`;
  if (ds.some((x) => x.attempt_no === n && x.status === 'cancelled' && x.coDiem)) return `MT${n} đã huỷ và còn điểm — số này không dùng lại.`;
  return null;
}

export type CachHuy = 'ca-luot' | 'phan-con-lai' | null;

/** Q-B, M-12: "Huỷ cả lượt" chỉ với lượt LỚN NHẤT còn hiệu lực và chưa có điểm nào; còn lại "Huỷ phần còn lại". */
export function cachHuyLuot(l: LuotSo, ds: LuotSo[]): CachHuy {
  if (l.status === 'cancelled') return null;
  return !l.coDiem && l.attempt_no === Math.max(...ds.filter((x) => x.status !== 'cancelled').map((x) => x.attempt_no)) ? 'ca-luot' : 'phan-con-lai';
}

/** T42, K4-04: hạn duyệt đề nghị dời lần 2 = Chủ nhật của TUẦN CHỨA NGÀY GỬI (không phải tuần đích). */
export function hanDuyetDoiLan2(ngayGui: string): string {
  const d = new Date(`${ngayGui.slice(0, 10)}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDaysIso(ngayGui.slice(0, 10), 6 - dow);
}

/** Điều kiện SQL "lượt tính nợ/hạn" — chèn vào WHERE mọi nơi đếm nợ, hạn, quá hạn, chờ chấm (Task 5). */
export const LUOT_TINH_NO_SQL = (a: string) => `${a}.lich_su = 0`;

/** Mốc đánh giá kế tiếp (K2-05, K2-31): lượt `planned`, không lịch sử, tuần từ thứ Hai tuần này trở đi — sớm nhất. */
export function mocKeTiep<T extends { status: string; lich_su: number; weekStart: string | null; attempt_no: number }>(
  ds: T[], homNay: string,
): T | null {
  const tuanNay = mondayOfDate(homNay);
  const con = ds.filter((x) => x.status === 'planned' && !x.lich_su && !!x.weekStart && x.weekStart.slice(0, 10) >= tuanNay);
  con.sort((a, b) => a.weekStart!.localeCompare(b.weekStart!) || a.attempt_no - b.attempt_no);
  return con[0] ?? null;
}
