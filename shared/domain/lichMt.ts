/**
 * LỊCH MT FAST TRACK — một nguồn cho web, máy chủ và lệnh ops (PR-MT, đặc tả 27/09 §5.2 M1–M8, T33–T36, T42, Q-B).
 *
 *   lịch mặc định   LT1/LT2: MT1/MT2/MT3 ở tuần học 6/12/16 · RF: MT1/MT2 ở tuần học 4/8 · lớp thường: không có
 *   MT cũ           (PR-MTa T1) lượt XẾP vào tuần thi cách tuần hiện tại ≥ 2 tuần — cờ `lich_su` tính lúc xếp/dời, không suy lại khi đọc
 *   cửa sổ Case     chỉ lượt lịch sử có tuần thi trong 4 tuần trước ngày tạo mới sinh Case/PA quy chế/Phối hợp (M4)
 *   đánh số         liền mạch: MT(n) chỉ tạo khi đã có MT(n−1); số huỷ KHÔNG điểm được dùng lại (Q-B)
 */
import { MOCK_FT_STUDY_WEEK } from './fasttrack.ts';
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';
import { tuanLich } from './hienThiNgay.ts';

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
  if (!Number.isInteger(n) || n < 1) return 'Số MT không hợp lệ.';
  if (n > MT_TOI_DA) return `Tối đa MT${MT_TOI_DA} cho một lộ trình.`;
  if (con.some((x) => x.attempt_no === n)) return `Lộ trình này đã có MT${n}. Đổi tuần thay vì tạo mới.`;
  const ke = soMtKeTiep(ds);
  if (n > ke) return `Chưa có MT${ke} — xếp MT${ke} trước rồi mới xếp MT${n}.`;
  if (ds.some((x) => x.attempt_no === n && x.status === 'cancelled' && x.coDiem)) return `MT${n} đã huỷ nhưng còn điểm — không dùng lại số này.`;
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
  return { cau: !o.quanLy && quaTuan ? 'Chọn tuần từ tuần này trở đi.' : null, quaTuan, mtCu };
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

/**
 * M6, K2-33(2): câu "MT2, MT3 sẽ dời sang W2 OCT, W2 NOV" khi đổi tuần bắt đầu lộ trình FT — lượt hệ thống tự xếp (`auto`), chưa làm, chưa
 * có điểm dời theo tuần học `tuanHocCuaMt`; lượt QL chốt tay / đã có điểm đứng yên. Một nguồn cho Thông tin HV và Sửa cả lớp (PR-SL).
 * `undefined` = không lượt nào dời (lớp thường, chưa chọn tuần).
 */
export function cauMtSeDoi(route: string | null, luot: readonly { attemptNo: number; status: string; planSource: string | null; scored: boolean }[],
  tuanMoi: string, homNay: string): string | undefined {
  if (!route || !tuanMoi) return undefined;
  const seDoi = luot.filter((a) => a.status === 'planned' && a.planSource === 'auto' && !a.scored).sort((a, b) => a.attemptNo - b.attemptNo);
  return seDoi.length
    ? `${seDoi.map((a) => `MT${a.attemptNo}`).join(', ')} sẽ dời sang `
      + seDoi.map((a) => tuanLich(addDaysIso(tuanMoi, (tuanHocCuaMt(route, a.attemptNo) - 1) * 7), homNay)).join(', ')
    : undefined;
}

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

/** Một lượt khác trong cùng lộ trình, đủ để biết lượt đang dời có VƯỢT nó không (PR-LM, chủ sản phẩm 03/10). */
export type LuotLanCan = { attemptId: number; attemptNo: number; kind: string; tuanDau: string | null; coDiem: boolean; daThi: boolean; huy: boolean };

/**
 * Q-0310-1 + D1 + T2 (PR-MTa): dời lượt `attemptNo` tới tuần cuối `tuanCuoiMoi` thì mọi lượt SAU có tuần sớm nhất ≤ tuần đó là "bị vượt"
 * — bỏ lịch; có điểm thì kết quả bị huỷ (lưu ở `ket_qua_huy`, khôi phục được), không còn chặn.
 * Bỏ qua lượt trước, lượt đã huỷ, lượt chưa xếp tuần (`tuanDau` null — không có gì để vượt).
 */
export function luotBiVuot(ds: readonly LuotLanCan[], o: { attemptNo: number; tuanCuoiMoi: string }): { biVuot: LuotLanCan[] } {
  return {
    biVuot: ds
      .filter((x) => x.attemptNo > o.attemptNo && !x.huy && x.tuanDau !== null && x.tuanDau.slice(0, 10) <= o.tuanCuoiMoi.slice(0, 10))
      .sort((a, b) => a.attemptNo - b.attemptNo),
  };
}

/** Một lượt sẽ bị vượt — popup dời vượt (mockup phần 4). `soDiem` = số KỸ NĂNG có điểm (W1/W2 tính một). */
export type LuotSeHuyLich = { attemptId: number; nhan: string; tuan: string; soDiem: number; soCase: number };

/** 'MT2: huỷ 4 điểm, đóng 1 Case' · 'MT2: huỷ 1 điểm' · 'MT3: bỏ lịch'. */
export function dongHeQuaVuot(x: LuotSeHuyLich): string {
  if (!x.soDiem) return `${x.nhan}: bỏ lịch`;
  return `${x.nhan}: huỷ ${x.soDiem} điểm${x.soCase ? `, đóng ${x.soCase} Case` : ''}`;
}

/** Popup + lý do chỉ khi có lượt bị vượt đã có điểm (T2 — chưa điểm thì chỉ dòng vàng). */
export function canLyDoVuot(ds: readonly LuotSeHuyLich[]): boolean {
  return ds.some((x) => x.soDiem > 0);
}

/** Nhãn "MT2, MT3" của các lượt (ghép bằng dấu phẩy). */
const ghepNhan = (ds: readonly { nhan: string }[]) => ds.map((x) => x.nhan).join(', ');

/** Chip vàng: không popup → "Bỏ lịch MT2, MT3"; có popup → "Huỷ điểm MT2" (chỉ lượt có điểm); rỗng → ''. */
export function chipVuot(ds: readonly LuotSeHuyLich[]): string {
  if (!ds.length) return '';
  return canLyDoVuot(ds) ? `Huỷ điểm ${ghepNhan(ds.filter((x) => x.soDiem > 0))}` : `Bỏ lịch ${ghepNhan(ds)}`;
}

/**
 * Chữ popup dời vượt (PR-MTb T6, mockup phần 4). `canPopup = canLyDoVuot(ds)` — lượt bị vượt chưa có điểm thì KHÔNG popup, chỉ chip vàng.
 * `chip`: không popup → "Bỏ lịch MT2, MT3" (các lượt bị bỏ lịch); có popup → "Huỷ điểm MT2" (chỉ các lượt có điểm; hộp đã nói đủ, chip là chữ ngắn
 * dự phòng cạnh nút Lưu). `ds` rỗng → chip ''.
 */
export function chuDoiVuot(i: { nhan: string; tuanMoi: string; ds: readonly LuotSeHuyLich[] }, homNay?: string | null):
  { canPopup: boolean; tieuDe: string; cau: string; dong: string[]; chip: string } {
  return {
    canPopup: canLyDoVuot(i.ds),
    tieuDe: i.tuanMoi ? `Dời ${i.nhan} sang ${tuanLich(i.tuanMoi, homNay)}?` : `Dời ${i.nhan}?`,   // chưa biết tuần mới (kiểm trước lỗi, 409 lúc lưu)
    cau: `${i.nhan} muộn hơn ${ghepNhan(i.ds)}.`,
    dong: i.ds.map(dongHeQuaVuot),
    chip: chipVuot(i.ds),
  };
}

/** Toast sau khi lưu dời vượt: "Đã lưu lịch · huỷ kết quả MT2 · bỏ lịch MT3" (lượt có điểm → huỷ kết quả; còn lại → bỏ lịch). Không vượt gì → chỉ `dau` ("Đã lưu lịch" hoặc câu của hộp mẹ). */
export function chuLuuVuot(ds: readonly LuotSeHuyLich[], dau = 'Đã lưu lịch'): string {
  const co = ds.filter((x) => x.soDiem > 0);
  const khong = ds.filter((x) => !x.soDiem);
  return [dau, ...(co.length ? [`huỷ kết quả ${ghepNhan(co)}`] : []), ...(khong.length ? [`bỏ lịch ${ghepNhan(khong)}`] : [])].join(' · ');
}

/**
 * Popup GỘP của panel "Xếp lịch Mock Test" (Q2, T6): mỗi em có lượt bị vượt CÓ ĐIỂM một dòng "Tú · MT2: huỷ 4 điểm, đóng 1 Case";
 * em chỉ bỏ lịch không điểm không vào popup (cột "Sẽ xếp" ghi "· bỏ lịch MT2"). `soEm` = số em đang xếp (tiêu đề).
 */
export function chuXepVuotGop(dong: readonly { ten: string; seHuyLich?: readonly LuotSeHuyLich[] }[], soEm: number):
  { canPopup: boolean; tieuDe: string; cau: string; dong: string[] } {
  const co = dong.filter((x) => canLyDoVuot(x.seHuyLich ?? []));
  return {
    canPopup: co.length > 0,
    tieuDe: `Xếp lịch ${soEm} em?`,
    cau: '',
    dong: co.map((x) => `${x.ten} · ${(x.seHuyLich ?? []).map(dongHeQuaVuot).join('; ')}`),
  };
}

/** Kết quả đã huỷ (chưa khôi phục) của một lượt (T2). `vuotBoi` = nhãn lượt đã vượt ("MT1"). */
export type KetQuaHuy = { id: number; attemptId: number; luc: string; lyDo: string; nguoi: string | null; soDiem: number; vuotBoi: string | null };

/** Dòng đỏ trên hộp xếp lịch (PR-LM): "Lưu sẽ huỷ lịch MT2 (W3 JUL) và MT3 (W1 SEP) — hai lượt này về Chưa xếp lịch." */
export function cauSeHuyLich(ds: readonly { nhan: string; tuan: string }[], homNay?: string | null): string {
  if (!ds.length) return '';
  const ten = ds.map((x) => `${x.nhan} (${tuanLich(x.tuan, homNay)})`);
  const ghep = ten.length === 1 ? ten[0] : `${ten.slice(0, -1).join(', ')} và ${ten[ten.length - 1]}`;
  const so = ds.length === 1 ? 'lượt này' : ds.length === 2 ? 'hai lượt này' : `${ds.length} lượt này`;
  return `Lưu sẽ huỷ lịch ${ghep} — ${so} về Chưa xếp lịch.`;
}

/**
 * Dòng phụ ô điểm của kỹ năng ĐÃ DỜI DO VẮNG (hồ sơ MT, I5 — PR-LM LM-6): tuần thi bù là tuần đang xem → "Thi bù tuần này (lần N)";
 * tuần khác → "vắng · dời sang W4 SEP · lần N" (mã tuần, không ngày). `title` giữ câu đầy đủ "Dời từ … sang …".
 */
export function chuDoiVang(l: { weekStart: string | null; doiTu: string | null; absenceMoveCount: number }, homNay: string): { chu: string; title: string } {
  const tuan = tuanLich(l.weekStart, homNay);
  const title = `Dời từ ${l.doiTu} sang ${tuan} (vắng lần ${l.absenceMoveCount}).`;
  if (l.weekStart && homNay && mondayOfDate(l.weekStart) === mondayOfDate(homNay)) return { chu: `Thi bù tuần này (lần ${l.absenceMoveCount})`, title };
  return { chu: `vắng · dời sang ${tuan} · lần ${l.absenceMoveCount}`, title };
}
