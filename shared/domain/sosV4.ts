/**
 * SOS v4 (PR-SOS, đặc tả 27/09 §3.1d + §5.3 S4-1…S4-7, Q28-1…Q28-5) — LUẬT THUẦN, không đụng database.
 *
 * Mock FT dưới kỳ vọng → Case tự tạo + PA theo quy chế "Chờ xác nhận" (preset=1, planned, confirmed_at NULL — biểu diễn có sẵn).
 * GVBM có 3 ngày (tính cả ngày đầu) chọn MỘT trong hai: Xác nhận nguyên nhân (→ Xác nhận PA, PA chạy từ hôm đó) hoặc
 * Không cần theo dõi (thẻ Chờ duyệt). PA quy chế không thay, không kết thúc sớm; tới mốc → "Ghi kết quả cuối".
 */
import { hanTheoNgay, PLAN_DECISIONS, type PlanDecision } from './cases.ts';
import { sosPlanEndDate, type AcademicSupportSpan } from './sos.ts';
import type { DeadlineKind } from './display.ts';
import type { TrangThai } from './trangThai.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { mocChuBoTro } from './lopThuong.ts';

export const HAN_XAC_NHAN_NGAY = 3;
/** Hạn Xác nhận nguyên nhân / Xác nhận PA: 3 ngày tính cả ngày đầu ('2026-09-14' → '2026-09-16'). */
export const hanXacNhan = (ngay: string) => hanTheoNgay(ngay, HAN_XAC_NHAN_NGAY);

export const GOI_Y_MO_TA_PA = 'Nêu hướng dẫn và trọng tâm cụ thể; ai sẽ thực hiện / hỗ trợ / tutor';                       // Q28-1
export const GOI_Y_KET_QUA_PA = 'Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể; ai đã thực hiện / hỗ trợ / tutor';  // Q28-2

/** Mốc quy chế tính từ NGÀY XÁC NHẬN PA (§3.1d, K3-46): dùng lại `sosPlanEndDate` với createdOn = ngày xác nhận. */
export function mocQuyChe(span: AcademicSupportSpan, ctx: { ngayXacNhan: string; nextMtSunday?: string | null; examDate?: string | null }): string | null {
  return sosPlanEndDate(span, { createdOn: ctx.ngayXacNhan, nextMtSunday: ctx.nextMtSunday, examDate: ctx.examDate });
}

/**
 * CHỮ MỐC của PA quy chế: `đến MT2 · W2 OCT` · `1 tháng · đến 18/10` · `đến lúc thi · chưa có ngày thi`. PA chưa xác nhận: chỉ phần đầu
 * (mốc tính lúc xác nhận). `mtKe` = số MT kế tiếp của lượt đã sinh PA.
 */
export function mocChuPa(x: { span: string | null; followupDue: string | null; mtKe: number | null; daXacNhan: boolean }, homNay: string): string {
  if (x.span === 'mini_test') return x.daXacNhan && x.followupDue ? `đến Mini Test · ${ngay(x.followupDue, homNay)}` : 'đến Mini Test';   // PR-LT2b
  if (x.span === 'den_cuoi_khoa') return x.daXacNhan ? mocChuBoTro(x.followupDue, homNay) : 'đến Cuối khoá';   // PR-LT2a: PA bổ trợ
  const dau = x.span === 'one_month' ? '1 tháng' : x.span === 'until_next_mt' ? (x.mtKe ? `đến MT${x.mtKe}` : 'đến MT kế tiếp')
    : x.span === 'until_exam' ? 'đến lúc thi' : '';
  if (!dau || !x.daXacNhan) return dau;
  if (x.followupDue) return `${dau} · ${x.span === 'until_next_mt' ? tuanLich(x.followupDue, homNay) : `đến ${ngay(x.followupDue, homNay)}`}`;
  return `${dau} · ${x.span === 'until_exam' ? 'chưa có ngày thi' : 'chưa có lịch'}`;
}

/** Lần ghi này là lần CUỐI của PA bắt buộc (T22, K5-25, M-17): tuần đang ghi chạm/qua mốc, hoặc ghi sau mốc. */
export function laLanGhiCuoi(pa: { preset: boolean; followupDue: string | null; actionDue: string | null }, ngayGhi: string): boolean {
  if (!pa.preset || !pa.followupDue) return false;
  return (pa.actionDue !== null && pa.followupDue < pa.actionDue) || ngayGhi > pa.followupDue;
}

/** Quyết định được phép (T63, K3-12). Lần cuối: [] — form thành "Ghi kết quả cuối", không có khối Quyết định. */
export function quyetDinhChoPa(pa: { preset: boolean }, lanCuoi: boolean): PlanDecision[] {
  if (lanCuoi) return [];
  return pa.preset ? ['keep', 'adjust', 'ask_manager'] : [...PLAN_DECISIONS];
}

/** Tên Case SOS ở chỗ chỉ có chữ (thông báo, hành trình, Việc): `[MT1] Reading không đạt [SOS 3]` (T21). */
export function tenCaseSos(x: { mt: number | null; giua: string; sos: number | null }): string {
  return [x.mt ? `[MT${x.mt}]` : '', x.giua, x.sos ? `[SOS ${x.sos}]` : ''].filter(Boolean).join(' ');
}

export type TrangThaiCaseV4 = 'cho-nguyen-nhan' | 'cho-ke-hoach' | 'cho-duyet-ke-hoach' | 'cho-duyet-khong-theo-doi' | 'cho-xac-nhan-pa' | 'dang-lam' | 'xong' | 'huy-khong-theo-doi' | 'he-thong-dong';

export type CaseV4Input = {
  status: 'open' | 'in_progress' | 'done'; fromSos: boolean; hasCause: boolean; dismissed: boolean; systemClosed: boolean;
  choDuyetKhongTheoDoi: boolean; coPaChoXacNhan: boolean; hanXacNhan: string | null;
  /** Chữ lý do hệ thống đóng có sẵn (vd "Lượt Test đã huỷ") — chỉ dùng khi `systemClosed`. */
  lyDoHeThong?: string | null;
  /** PR-LT2a: Case Giữa khoá có PA bổ trợ chưa chạy — kế hoạch đang chờ nộp / chờ Quản lý duyệt. */
  boTro?: { choNop: boolean; choDuyet: boolean; hanKeHoach: string | null } | null;
};

/** MỘT nhãn trạng thái cho một Case (§7.3) — xét từ trên xuống. */
export function trangThaiCaseV4(c: CaseV4Input, homNay: string): { k: TrangThaiCaseV4; t: TrangThai; chu: string; han: string | null } {
  if (c.systemClosed) return { k: 'he-thong-dong', t: 'da-huy', chu: c.lyDoHeThong ? `Hệ thống đóng · ${c.lyDoHeThong}` : 'Hệ thống đóng', han: null };
  if (c.dismissed) return { k: 'huy-khong-theo-doi', t: 'da-huy', chu: 'Đã huỷ · không cần theo dõi', han: null };
  if (c.status === 'done') return { k: 'xong', t: 'xong', chu: 'Xong', han: null };
  if (c.choDuyetKhongTheoDoi) return { k: 'cho-duyet-khong-theo-doi', t: 'cho-duyet', chu: 'Chờ Quản lý duyệt · không theo dõi', han: null };
  const t: TrangThai = c.hanXacNhan && c.hanXacNhan < homNay ? 'qua-han' : 'can-lam';
  if (c.fromSos && !c.hasCause) return { k: 'cho-nguyen-nhan', t, chu: 'Chờ xác nhận nguyên nhân', han: c.hanXacNhan };
  if (c.boTro?.choDuyet) return { k: 'cho-duyet-ke-hoach', t: 'cho-duyet', chu: 'Chờ Quản lý duyệt · kế hoạch bổ trợ', han: null };
  if (c.boTro?.choNop) return { k: 'cho-ke-hoach', t: c.boTro.hanKeHoach && c.boTro.hanKeHoach < homNay ? 'qua-han' : 'can-lam', chu: 'Chờ nộp kế hoạch bổ trợ', han: c.boTro.hanKeHoach };
  if (c.fromSos && c.coPaChoXacNhan) return { k: 'cho-xac-nhan-pa', t, chu: 'Chờ xác nhận PA', han: c.hanXacNhan };
  return { k: 'dang-lam', t: 'dang-lam', chu: 'Đang làm', han: null };
}

/** Một PA như `viecTiepCuaCase` cần. Chỉ truyền PA CHƯA huỷ. */
export type PaViecTiep = {
  id: number; ten: string; batBuoc: boolean; choXacNhan: boolean; xong: boolean;
  actionDue: string | null; followupDue: string | null; choDuyet?: boolean;
  /** PR-S5F-a: PA bổ trợ Giữa khoá của lớp CŨ (Case đã đi theo em sang lớp mới) — người dạy cũ ghi tiếp; việc tiếp ưu tiên PA ở lớp mới. */
  lopCu?: boolean;
};
export type ViecTiepCase = { chu: string; loaiHan: DeadlineKind | null; han: string | null; paId?: number };

/**
 * VIỆC TIẾP của một Case (K3-07, thay `nextStepOf` và B1) — một việc. Không còn "Xác minh SOS", "Xác nhận PA gợi ý",
 * "Chờ QL trả lời". `hanLapPa`: hạn Đề ra PA của Case tay (nếu biết).
 */
export function viecTiepCuaCase(c: CaseV4Input, pas: PaViecTiep[], homNay: string, hanLapPa: string | null = null): ViecTiepCase | null {
  const s = trangThaiCaseV4(c, homNay);
  if (s.k === 'xong' || s.k === 'huy-khong-theo-doi' || s.k === 'he-thong-dong') return null;
  if (s.k === 'cho-nguyen-nhan') return { chu: 'Xác nhận nguyên nhân', loaiHan: 'xac-minh-sos', han: c.hanXacNhan };
  if (s.k === 'cho-duyet-khong-theo-doi') return { chu: 'Chờ Quản lý duyệt · không theo dõi', loaiHan: null, han: null };
  if (s.k === 'cho-ke-hoach') return { chu: 'Nộp kế hoạch bổ trợ', loaiHan: 'ke-hoach-bo-tro', han: s.han };
  if (s.k === 'cho-duyet-ke-hoach') return { chu: 'Chờ Quản lý duyệt kế hoạch', loaiHan: null, han: null };
  const choXn = pas.find((p) => p.choXacNhan && !p.xong);
  if (choXn) return { chu: `Xác nhận PA ${choXn.ten}`, loaiHan: 'xac-minh-sos', han: c.hanXacNhan, paId: choXn.id };
  const chayTatCa = pas.filter((p) => !p.xong && !p.choXacNhan && !p.choDuyet);
  /* PR-S5F-a: có PA ở lớp mới (bổ trợ miễn phí) thì việc tiếp là của PA đó; PA lớp cũ chỉ thành việc tiếp khi không còn PA nào khác, ghi rõ "(lớp cũ)". */
  const chay = chayTatCa.some((p) => !p.lopCu) ? chayTatCa.filter((p) => !p.lopCu) : chayTatCa;
  const cu = (p: PaViecTiep) => (p.lopCu ? ' (lớp cũ)' : '');
  const cuoi = chay.find((p) => laLanGhiCuoi({ preset: p.batBuoc, followupDue: p.followupDue, actionDue: p.actionDue }, homNay));
  if (cuoi) return { chu: `Ghi kết quả cuối ${cuoi.ten}${cu(cuoi)}`, loaiHan: 'cap-nhat-pa', han: cuoi.actionDue, paId: cuoi.id };
  const ganNhat = [...chay].sort((a, b) => (a.actionDue ?? '9999').localeCompare(b.actionDue ?? '9999'))[0];
  if (ganNhat) return { chu: `Ghi kết quả PA ${ganNhat.ten}${cu(ganNhat)}`, loaiHan: 'cap-nhat-pa', han: ganNhat.actionDue, paId: ganNhat.id };
  if (!pas.length) return { chu: 'Đề ra PA', loaiHan: 'lap-pa', han: hanLapPa };
  if (pas.every((p) => p.xong)) return { chu: 'Hoàn thành Case', loaiHan: null, han: null };
  return null;   // chỉ còn PA chờ Quản lý duyệt — việc của Quản lý
}

/**
 * CHẶN HOÀN THÀNH (K3 §4a, K3-09). Chỉ truyền PA chưa huỷ. PA bắt buộc chưa khép → ẩn nút Hoàn thành, hiện `dong`;
 * PA thường chưa khép / chờ duyệt → nút còn, `ly_do` như `closeBlockers` cũ.
 */
export function chanHoanThanh(pas: { batBuoc: boolean; xong: boolean; choDuyet: boolean; followupDue: string | null; mocChu: string }[]): { an: boolean; dong: string | null; ly_do: string[] } {
  const batBuoc = pas.find((p) => p.batBuoc && !p.xong);
  const ly_do: string[] = [];
  if (!pas.length) ly_do.push('Case chưa có phương án nào — chưa làm gì cho em thì chưa có gì để kết luận.');
  const choDuyet = pas.filter((p) => p.choDuyet).length;
  if (choDuyet) ly_do.push(`${choDuyet} phương án đang chờ Quản lý duyệt.`);
  const chay = pas.filter((p) => !p.xong && !p.choDuyet).length;
  if (chay) ly_do.push(`${chay} phương án chưa cập nhật kết quả cuối cùng.`);
  return { an: !!batBuoc, dong: batBuoc ? `Hoàn thành được sau khi PA theo quy chế kết thúc (${batBuoc.mocChu})` : null, ly_do };
}
