/**
 * LỊCH MT FAST TRACK — một nguồn cho web, máy chủ và lệnh ops (PR-MT, đặc tả 27/09 §5.2 M1–M8, T33–T36, T42, Q-B).
 *
 *   lịch mặc định   OV-6b1: Quản trị cấu hình theo lộ trình (`routes.lich_mt`), chép vào lớp lúc tạo (`classes.lich_mt`) — mọi hàm nhận
 *                   DANH SÁCH TUẦN của lớp, không tự đoán theo mã lộ trình. Gốc (nạp lần đầu): LT 6/12/16 · RF 4/8 · lớp thường: không có
 *   MT cũ           (PR-MTa T1) lượt XẾP vào tuần thi cách tuần hiện tại ≥ 2 tuần — cờ `lich_su` tính lúc xếp/dời, không suy lại khi đọc
 *   cửa sổ Case     chỉ lượt lịch sử có tuần thi trong 4 tuần trước ngày tạo mới sinh Case/PA quy chế/Phối hợp (M4)
 *   đánh số         liền mạch: MT(n) chỉ tạo khi đã có MT(n−1); số huỷ KHÔNG điểm được dùng lại (Q-B)
 */
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';
import { tuanLich } from './hienThiNgay.ts';
import { t } from '../i18n/index.ts';

export const CUA_SO_CASE_LICH_SU_NGAY = 28;
/** T37: một lộ trình tối đa MT8. */
export const MT_TOI_DA = 8;

/** Lịch MT GỐC (luật viết cứng trước OV-6b1) — CHỈ để nạp cấu hình lần đầu (seed, migrate). `null` = lớp thường (không có MT). */
export function lichMtGoc(route: string | null): number[] {
  if (!route) return [];
  return route === 'RF' ? [4, 8] : [6, 12, 16];
}

/** `classes.lich_mt` / `routes.lich_mt` ("[6,12,16]") → danh sách tuần học; trống hoặc hỏng → null. */
export function docLichMt(s: string | null | undefined): number[] | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) && v.length > 0 && v.every((x) => Number.isInteger(x) && x > 0) ? v : null;
  } catch { return null; }
}

/** Tuần học của MT(n) theo lịch của lớp — ngoài lịch (QL tự xếp, "đã thi tới MT") thì cách 4 tuần sau MT cuối của lịch (Q1). */
export function tuanHocCuaMt(lich: readonly number[], n: number): number {
  if (n >= 1 && n <= lich.length) return lich[n - 1];
  return (lich.at(-1) ?? 0) + 4 * (n - lich.length);
}

/** Tuần (Chủ nhật `tuanKetThucMuonNhat`) đã kết thúc trước ngày `ngayTao`. So NGÀY KẾT THÚC tuần. Không phân loại MT — dùng `laMtCu`. */
export function laLichSu(tuanKetThucMuonNhat: string, ngayTao: string): boolean {
  return tuanKetThucMuonNhat.slice(0, 10) < ngayTao.slice(0, 10);
}

/** T1 (PR-MTa): Chủ nhật tuần thi muộn nhất < thứ Hai của tuần trước (tuần thi cách tuần hiện tại ≥ 2 tuần). Tuần trước = MT thường. */
export function laMtCu(tuanKetThucMuonNhat: string, homNay: string): boolean {
  return tuanKetThucMuonNhat.slice(0, 10) < addDaysIso(mondayOfDate(homNay), -7);
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
  if (!Number.isInteger(n) || n < 1) return t('Số MT không hợp lệ.');
  if (n > MT_TOI_DA) return t('Tối đa MT{MT_TOI_DA} cho một lộ trình.', { MT_TOI_DA });
  if (con.some((x) => x.attempt_no === n)) return t('Lộ trình này đã có MT{n}. Đổi tuần thay vì tạo mới.', { n });
  const ke = soMtKeTiep(ds);
  if (n > ke) return t('Chưa có MT{ke} — xếp MT{ke2} trước rồi mới xếp MT{n}.', { ke, ke2: ke, n });
  if (ds.some((x) => x.attempt_no === n && x.status === 'cancelled' && x.coDiem)) return t('MT{n} đã huỷ nhưng còn điểm — không dùng lại số này.', { n });
  return null;
}

/**
 * T1/T4 (PR-MTa, thay `kiemTuanDaQua`): tuần đã qua chỉ Quản lý / Quản trị (`quanLy` = có PLAN_WEEK) xếp được — không chặn theo ngày
 * em vào web, không chặn trộn tuần qua / tới. `ketThuc` = Chủ nhật tuần thi từng kỹ năng. `quaTuan` → web vẽ một dòng vàng;
 * `mtCu` = lượt sẽ là MT cũ (theo tuần muộn nhất).
 */
export function kiemTuanXep(o: { ketThuc: string[]; homNay: string; quanLy: boolean }): { cau: string | null; quaTuan: boolean; mtCu: boolean } {
  const quaTuan = o.ketThuc.some((w) => laLichSu(w, o.homNay));
  const mtCu = o.ketThuc.length > 0 && laMtCu([...o.ketThuc].sort()[o.ketThuc.length - 1], o.homNay);
  return { cau: !o.quanLy && quaTuan ? t('Chọn tuần từ tuần này trở đi.') : null, quaTuan, mtCu };
}

/** Tooltip chip vàng "Tuần đã qua" (T4) — panel Xếp lịch, hộp một đợt: Quản lý xếp MT chưa thi về tuần đã qua. */
export const CAU_TUAN_DA_QUA = t('MT chưa thi xếp về tuần đã qua — tuần cách ≥ 2 tuần thì là MT cũ.');

/** Rà #120: "Đã thi tới MT" = d mà MT1…MT(d) có MT rơi vào tuần chưa qua → số các MT đó (để nhắc lùi Tuần bắt đầu). */
export function mtDaThiChuaQua(lich: readonly number[], tuanBatDau: string, daThiToiMt: number, homNay: string): number[] {
  return Array.from({ length: daThiToiMt }, (_, i) => i + 1)
    .filter((n) => !laLichSu(addDaysIso(tuanBatDau.slice(0, 10), (tuanHocCuaMt(lich, n) - 1) * 7 + 6), homNay));
}

export type CachHuy = 'ca-luot' | null;

/** PR-MTGON (luật 4, chủ sản phẩm 08/10): Quản lý "Huỷ MT{n}" mọi lượt còn hiệu lực, mọi lúc — điểm của lượt xoá theo. Đã huỷ → null. */
export function cachHuyLuot(l: LuotSo, _ds?: LuotSo[]): CachHuy {
  return l.status === 'cancelled' ? null : 'ca-luot';
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

/**
 * M6, K2-33(2): câu "MT2, MT3 sẽ dời sang W2 OCT, W2 NOV" khi đổi tuần bắt đầu lộ trình FT — lượt hệ thống tự xếp (`auto`), chưa làm, chưa
 * có điểm dời theo tuần học `tuanHocCuaMt`; lượt QL chốt tay / đã có điểm đứng yên. Một nguồn cho Thông tin HV và Sửa cả lớp (PR-SL).
 * `lich` = tuần MT của lớp (rỗng = lớp thường). `undefined` = không lượt nào dời (lớp thường, chưa chọn tuần).
 */
export function cauMtSeDoi(lich: readonly number[], luot: readonly { attemptNo: number; status: string; planSource: string | null; scored: boolean }[],
  tuanMoi: string, homNay: string): string | undefined {
  if (!lich.length || !tuanMoi) return undefined;
  const seDoi = luot.filter((a) => a.status === 'planned' && a.planSource === 'auto' && !a.scored).sort((a, b) => a.attemptNo - b.attemptNo);
  return seDoi.length
    ? t('{x} sẽ dời sang ', { x: seDoi.map((a) => `MT${a.attemptNo}`).join(', ') })
      + seDoi.map((a) => tuanLich(addDaysIso(tuanMoi, (tuanHocCuaMt(lich, a.attemptNo) - 1) * 7), homNay)).join(', ')
    : undefined;
}

/** Mốc đánh giá kế tiếp (K2-05, K2-31): lượt `planned`, không lịch sử, tuần từ thứ Hai tuần này trở đi — sớm nhất. */
export function mocKeTiep<T extends { status: string; lich_su: number; weekStart: string | null; attempt_no: number; huyHet?: number | boolean }>(
  ds: T[], homNay: string,
): T | null {
  const tuanNay = mondayOfDate(homNay);
  /* OV-1b: lượt mọi phần thi đã huỷ (`huyHet`, `LUOT_HUY_HET_SQL`) không chiếm chỗ mốc kế tiếp. */
  const con = ds.filter((x) => x.status === 'planned' && !x.lich_su && !x.huyHet && !!x.weekStart && x.weekStart.slice(0, 10) >= tuanNay);
  con.sort((a, b) => a.weekStart!.localeCompare(b.weekStart!) || a.attempt_no - b.attempt_no);
  return con[0] ?? null;
}

/** OV-1b: lượt có dòng kỹ năng mà KHÔNG còn kỹ năng bắt buộc nào chưa huỷ (mọi phần thi đã huỷ / bỏ khỏi đợt) — 1/0. */
export const LUOT_HUY_HET_SQL = (a: string) => `(EXISTS (SELECT 1 FROM attempt_skills hk WHERE hk.attempt_id = ${a}.id)
  AND NOT EXISTS (SELECT 1 FROM attempt_skills hk WHERE hk.attempt_id = ${a}.id AND hk.required = 1 AND hk.sit_status != 'cancelled'))`;
/** Cùng luật `mocKeTiep` cho câu đếm theo lô (không N+1). Tham số `?` = thứ Hai của tuần này. */
export const MOC_KE_TIEP_SQL = (a: string, rp: string) =>
  `${a}.status = 'planned' AND ${a}.lich_su = 0 AND NOT ${LUOT_HUY_HET_SQL(a)} AND ${rp}.week_start >= ?`;

/** K2-05: em FT "có mốc đánh giá tiếp theo" = có mốc kế tiếp, HOẶC đã qua MT cuối của lịch lớp (`soMt` = số MT của lịch) và đã có ngày/tháng thi. */
export function coMocTiepTheo(o: { coMoc: boolean; soMt: number; mtCuoi: number; coNgayThi: boolean }): boolean {
  return o.coMoc || (o.soMt > 0 && o.mtCuoi >= o.soMt && o.coNgayThi);
}

/** Một lượt khác trong cùng lộ trình, đủ để biết lượt đang dời có VƯỢT nó không (PR-LM, chủ sản phẩm 03/10). */
export type LuotLanCan = { attemptId: number; attemptNo: number; kind: string; tuanDau: string | null; coDiem: boolean; daThi: boolean; huy: boolean };

/**
 * Q-0310-1 + D1: dời lượt `attemptNo` tới tuần cuối `tuanCuoiMoi` thì mọi lượt SAU có tuần sớm nhất ≤ tuần đó là "bị vượt".
 * PR-MTGON (luật 1): bị vượt = tuần mới KHÔNG HỢP LỆ — máy chủ chặn (`kiemVuotTu`), không còn bỏ lịch / huỷ kết quả lượt bị vượt.
 * Bỏ qua lượt trước, lượt đã huỷ, lượt chưa xếp tuần (`tuanDau` null — không có gì để vượt).
 */
export function luotBiVuot(ds: readonly LuotLanCan[], o: { attemptNo: number; tuanCuoiMoi: string }): { biVuot: LuotLanCan[] } {
  return {
    biVuot: ds
      .filter((x) => x.attemptNo > o.attemptNo && !x.huy && x.tuanDau !== null && x.tuanDau.slice(0, 10) <= o.tuanCuoiMoi.slice(0, 10))
      .sort((a, b) => a.attemptNo - b.attemptNo),
  };
}

/** Kết quả đã huỷ (chưa khôi phục) của một lượt (T2). `vuotBoi` = nhãn lượt đã vượt ("MT1"). */
export type KetQuaHuy = { id: number; attemptId: number; luc: string; lyDo: string; nguoi: string | null; soDiem: number; vuotBoi: string | null };

/**
 * Dòng phụ ô điểm của kỹ năng ĐÃ DỜI DO VẮNG (hồ sơ MT, I5 — PR-LM LM-6): tuần thi bù là tuần đang xem → "Thi bù tuần này (lần N)";
 * tuần khác → "vắng · dời sang W4 SEP · lần N" (mã tuần, không ngày). `title` giữ câu đầy đủ "Dời từ … sang …".
 */
export function chuDoiVang(l: { weekStart: string | null; doiTu: string | null; absenceMoveCount: number }, homNay: string): { chu: string; title: string } {
  const tuan = tuanLich(l.weekStart, homNay);
  const title = t('Dời từ {doiTu} sang {tuan} (vắng lần {x}).', { doiTu: l.doiTu, tuan, x: l.absenceMoveCount });
  if (l.weekStart && homNay && mondayOfDate(l.weekStart) === mondayOfDate(homNay)) return { chu: t('Thi bù tuần này (lần {x})', { x: l.absenceMoveCount }), title };
  return { chu: t('vắng · dời sang {tuan} · lần {x}', { tuan, x: l.absenceMoveCount }), title };
}

/** Một lượt cần lưu ở tab "Xếp theo học viên" (PR-XTHV): tuần sớm nhất trước / sau khi sửa; `taoMoi` = lượt chưa có (đi `/xep-moi`). */
export type BuocLuuLuot = { attemptNo: number; cu: string | null; moi: string; taoMoi: boolean };

/**
 * PR-XTHV: thứ tự lưu an toàn nhiều lượt của MỘT em — mỗi lần lưu đều qua kiểm "MT(n) sau MT(n−1)" của máy chủ, nên lượt dời lùi (sang
 * tuần sau) đi từ MT lớn xuống, rồi lượt dời tiến (sang tuần trước, hoặc chưa có tuần) từ MT nhỏ lên, cuối cùng tạo lượt mới từ nhỏ lên.
 * Trạng thái đầu và cuối hợp lệ thì mọi bước giữa cũng hợp lệ.
 */
export function thuTuLuuLuot<T extends BuocLuuLuot>(ds: readonly T[]): T[] {
  const lui = ds.filter((x) => !x.taoMoi && x.cu !== null && x.moi.slice(0, 10) > x.cu.slice(0, 10)).sort((a, b) => b.attemptNo - a.attemptNo);
  const tien = ds.filter((x) => !x.taoMoi && !lui.includes(x)).sort((a, b) => a.attemptNo - b.attemptNo);
  const moi = ds.filter((x) => x.taoMoi).sort((a, b) => a.attemptNo - b.attemptNo);
  return [...lui, ...tien, ...moi];
}
