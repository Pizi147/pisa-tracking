/**
 * PR-PA (§8): MỘT mẫu PA cho mọi đường (tay, quy chế SOS, bổ trợ, tutor kỳ vọng). Luật thuần — web và máy chủ cùng gọi.
 * Số buổi chỉ với Tutor, Tự học, Bổ trợ, Bổ trợ miễn phí; không bắt buộc; số nguyên 1–60. Tự học không có ô người.
 */
import { dsLoi, type LoiTruong } from './loiForm.ts';
import { nguoiThanhPayload, nguoiThieu, type NguoiChon } from './nguoiThucHien.ts';
import { KHAC_TOI_THIEU } from './khac.ts';
import { INTERVENTION_KIND_LABEL } from './cases.ts';
import { ngayTheoGioVN } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { tuanKetQuaCuaHan } from './week.ts';

export const LOAI_CO_SO_BUOI = ['tutor', 'self_study', 'bo_tro', 'bo_tro_mien_phi'] as const;
const LOAI_NGUOI_DAY = new Set(['tutor', 'bo_tro', 'bo_tro_mien_phi']);
export const SO_BUOI_TOI_DA = 60;

export const coSoBuoi = (kind: string): boolean => (LOAI_CO_SO_BUOI as readonly string[]).includes(kind);
export const coNguoiDay = (kind: string): boolean => kind !== 'self_study';
export const nhanNguoiDay = (kind: string): 'Người dạy' | 'Người thực hiện' => (LOAI_NGUOI_DAY.has(kind) ? 'Người dạy' : 'Người thực hiện');

/** Ô trống (null, '', khoảng trắng) → null; còn lại → số (có thể NaN / không nguyên — hàm kiểm quyết). */
export function soBuoiTu(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  return Number(String(v).trim());
}
const nguyenTrong = (n: number, tu: number) => Number.isInteger(n) && n >= tu && n <= SO_BUOI_TOI_DA;

/** Số buổi của PA: trống được; 1–60 nguyên; không nhỏ hơn số buổi đã dạy. → câu lỗi | null. */
export function kiemSoBuoiPa(v: unknown, daDay = 0): string | null {
  const n = soBuoiTu(v);
  if (n === null) return null;
  if (!nguyenTrong(n, 1)) return 'Từ 1 đến 60 buổi, hoặc để trống';
  if (n < daDay) return `Đã dạy ${daDay} buổi — Số buổi từ ${daDay} trở lên, hoặc để trống`;
  return null;
}

/** Số buổi tuần này (Kết quả của PA có Số buổi): bắt buộc, số nguyên 0–60 (0 = em nghỉ). → câu lỗi | null. */
export function kiemSoBuoiTuan(v: unknown): string | null {
  const n = soBuoiTu(v);
  return n !== null && nguyenTrong(n, 0) ? null : 'Từ 0 đến 60 buổi';
}

/** Đếm buổi: đã dạy / tổng · còn · chưa đủ | đủ | vượt (đủ / vượt chỉ gợi ý "Kết thúc PA"). */
export function demBuoi(daDay: number, tong: number): { da: number; tong: number; con: number; tt: 'chua' | 'du' | 'vuot' } {
  return { da: daDay, tong, con: Math.max(0, tong - daDay), tt: daDay < tong ? 'chua' : daDay === tong ? 'du' : 'vuot' };
}

// ------------------------------------------------------------------ Kết quả tuần (web: GhiKetQuaPanel — khối đếm buổi, mockup §7)

/** Số buổi tuần này đã gõ: hợp lệ → số; trống / sai → 0 (khối đếm vẫn vẽ, lỗi nói riêng). */
const soTuan = (tuan: string): number => (kiemSoBuoiTuan(tuan) ? 0 : soBuoiTu(tuan)!);

/** "Đã dạy 3/10 → sau khi lưu 5/10 · còn 5 | đủ buổi | vượt n buổi": `truoc` = đã dạy, phần còn lại = `demBuoi` SAU khi lưu. */
export function demSauKetQua(daDay: number, tong: number, tuan: string) {
  const sau = demBuoi(daDay + soTuan(tuan), tong);
  return { ...sau, truoc: daDay, vuot: Math.max(0, sau.da - tong) };
}

/** Lỗi khối đếm: Số buổi tuần này (PA có Số buổi, 0–60) · Người dạy tuần này (Tự học không có; bắt buộc khi PA có Số buổi và ≥ 1). */
export function loiKetQuaTuan(pa: { kind: string; soBuoi?: number | null }, tuan: string, nguoi: NguoiChon | null): LoiTruong[] {
  const coDem = pa.soBuoi != null;
  const loi: LoiTruong[] = [];
  const sb = coDem ? kiemSoBuoiTuan(tuan) : null;
  if (sb) loi.push({ khoa: 'so-buoi-tuan', nhan: 'Số buổi tuần này', lyDo: sb });
  const n = coDem ? soTuan(tuan) : 0;
  const ng = coNguoiDay(pa.kind) ? nguoiThieu(nguoi, n >= 1) : null;
  if (ng) loi.push({ khoa: 'nguoi-day', nhan: 'Người dạy tuần này', lyDo: nguoi ? ng : `Dạy ${n} buổi — ghi ai dạy` });
  return loi;
}

/** Phần thân `POST /interventions/:id/result` của khối đếm: `soBuoi` chỉ khi PA có Số buổi; `nguoiDay` chỉ khi loại có người. */
export function thanKetQuaTuan(pa: { kind: string; soBuoi?: number | null }, tuan: string, nguoi: NguoiChon | null) {
  return {
    ...(pa.soBuoi != null ? { soBuoi: soBuoiTu(tuan) } : {}),
    ...(coNguoiDay(pa.kind) ? { nguoiDay: nguoiThanhPayload(nguoi) } : {}),
  };
}

// ------------------------------------------------------------------ form PA (web: FormPa — Thêm · Sửa · Thay · Xác nhận PA)

/** Giá trị form PA. Số buổi giữ dạng chữ người gõ; Tên đề xuất chỉ với PA "Khác". */
export type GiaTriPa = { kind: string; description: string; soBuoi: string; nguoi: NguoiChon | null; ghiRo: string };

/** Người mặc định theo Loại: Người dạy → trống; Người thực hiện → "Tôi"; Tự học không có người. */
export const nguoiMacDinh = (kind: string): NguoiChon | null => (!coNguoiDay(kind) || nhanNguoiDay(kind) === 'Người dạy' ? null : { kieu: 'toi' });
export const paMoi = (kind: string): GiaTriPa => ({ kind, description: '', soBuoi: '', nguoi: nguoiMacDinh(kind), ghiRo: '' });

/** Người hiện tại của PA thành giá trị ô chọn người: tài khoản nếu có, người ngoài nếu chỉ có tên, không có → `null`. */
export function nguoiCuaPa(pa: { performerUserId?: number | null; performer?: string | null }): NguoiChon | null {
  if (pa.performerUserId) return { kieu: 'tai_khoan', id: pa.performerUserId, ten: pa.performer ?? `#${pa.performerUserId}` };
  if (pa.performer) return { kieu: 'ngoai', ten: pa.performer };
  return null;
}
/** Giá trị form của PA hiện có (Sửa PA, Điều chỉnh trong Kết quả). */
export const giaTriCuaPa = (pa: { kind: string; description?: string | null; soBuoi?: number | null; performerUserId?: number | null; performer?: string | null }): GiaTriPa =>
  ({ kind: pa.kind, description: pa.description ?? '', soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi), nguoi: nguoiCuaPa(pa), ghiRo: '' });
export function khacNguoi(a: NguoiChon | null, b: NguoiChon | null): boolean {
  if (!a || !b) return a !== b;
  if (a.kieu !== b.kieu) return true;
  return a.kieu === 'tai_khoan' ? a.id !== (b as typeof a).id : a.kieu === 'ngoai' ? a.ten.trim() !== (b as typeof a).ten.trim() : false;
}

/** Lỗi của form PA. `tienTo`: khoá ô riêng khi form nằm trong panel khác (Thay PA trong Kết quả: 'moi-'). `goc` (Sửa PA): ô KHÔNG đổi thì không kiểm — PA vượt buổi (Số buổi < đã dạy), mô tả cũ ngắn vẫn sửa được ô khác. */
export function loiFormPa(v: GiaTriPa, o: { toiThieu?: number; daDay?: number; goc?: GiaTriPa; tienTo?: string } = {}): LoiTruong[] {
  const { goc } = o;
  const t = o.tienTo ?? '';
  const doi = (k: 'description' | 'soBuoi') => !goc || v[k].trim() !== goc[k].trim();
  const loi = dsLoi([
    ...(v.kind === 'other_proposal' && !goc ? [{ khoa: `${t}ghi-ro`, nhan: 'Tên đề xuất', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(doi('description') ? [{ khoa: `${t}noi-dung`, nhan: 'Nội dung', toiThieu: o.toiThieu ?? 8 }] : []),
  ], { [`${t}ghi-ro`]: v.ghiRo, [`${t}noi-dung`]: v.description });
  const sb = coSoBuoi(v.kind) && doi('soBuoi') ? kiemSoBuoiPa(v.soBuoi, o.daDay ?? 0) : null;
  if (sb) loi.push({ khoa: `${t}so-buoi`, nhan: 'Số buổi', lyDo: sb });
  const ng = coNguoiDay(v.kind) ? nguoiThieu(v.nguoi, false) : null;
  if (ng) loi.push({ khoa: `${t}nguoi`, nhan: nhanNguoiDay(v.kind), lyDo: ng });
  return loi;
}

/** Thân gửi máy chủ của PA mới (Thêm PA, Thay PA) — cũng dùng cho Xác nhận PA (máy chủ chỉ đọc Nội dung · Số buổi · người). */
export function paPayload(v: GiaTriPa) {
  return {
    kind: v.kind, description: v.description.trim(), soBuoi: coSoBuoi(v.kind) ? soBuoiTu(v.soBuoi) : null,
    ...(coNguoiDay(v.kind) ? nguoiThanhPayload(v.nguoi) : {}),
    ...(v.kind === 'other_proposal' ? { ghiRoKhac: v.ghiRo.trim() } : {}),
  };
}

/** Đặt lại người của PA (Sửa PA, Xác nhận PA): đủ ba khoá — máy chủ thấy khoá là đặt lại, cả ba trống = xoá người. */
export const datLaiNguoi = (v: NguoiChon | null) => ({ performerSelf: false, performerUserId: null, performerName: null, ...nguoiThanhPayload(v) });

/**
 * Thân `PATCH /interventions/:id` (Sửa PA): CHỈ ô đã đổi — ô không đổi không gửi, nên máy chủ không kiểm lại (người cũ đã nghỉ, PA vượt
 * buổi). Đổi người → gửi đủ ba khoá người (cả ba trống = xoá người). Số buổi xoá trắng → `null`. `{}` = chưa sửa gì.
 */
export function thanSuaPa(v: GiaTriPa, goc: GiaTriPa, ngay: { moi: string; cu: string | null }): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (v.description.trim() !== goc.description.trim()) body.description = v.description.trim();
  if (v.soBuoi.trim() !== goc.soBuoi.trim()) body.soBuoi = soBuoiTu(v.soBuoi);
  if (khacNguoi(v.nguoi, goc.nguoi)) Object.assign(body, datLaiNguoi(v.nguoi));
  if (ngay.moi && ngay.moi !== (ngay.cu ?? '')) body.startedDate = ngay.moi;
  return body;
}

// ------------------------------------------------------------------ Nhật ký PA (Sửa PA; dòng PA — "Nhật ký PA (n)")

type MatNhatKy = { description: string | null; performer: string | null; soBuoi?: number | null; startedDate?: string | null };
export type PaNhatKy = {
  id: number; kind: string; soBuoi?: number | null; performer: string | null; startedDate?: string | null;
  createdAt?: string | null; recordedBy?: string | null; nguonTao?: string | null;
  revisions?: readonly { id: number; on: string; source: string; by: string | null; reason: string; before: MatNhatKy; after: MatNhatKy }[];
};
export type KetQuaNhatKy = {
  id: number; interventionId: number; observedOn: string; observerName?: string | null; cycleDue?: string | null;
  soBuoi?: number | null; nguoiDay?: string | null;
};
/** Một dòng: `ngay` ISO, `ai` (đậm cùng ngày), `chu` phần sau. */
export type DongNhatKyPa = { khoa: string; ngay: string; ai: string; chu: string };

const NGUON_SUA_PA: Record<string, string> = { adjust: 'Điều chỉnh', confirm_edit: 'Sửa khi xác nhận PA', sua_pa: 'Sửa PA' };

/**
 * NHẬT KÝ PA (mockup pa-dong-bo §6), mới nhất lên trên: dòng Tạo (giá trị LÚC TẠO = bản cũ của lần sửa đầu) · mỗi tuần Kết quả
 * ("Kết quả W1 OCT · dạy 3 buổi") · mỗi lần Sửa PA / Điều chỉnh (cũ → mới, chỉ ô đổi).
 */
export function nhatKyPa(pa: PaNhatKy, ketQua: readonly KetQuaNhatKy[], homNay: string): DongNhatKyPa[] {
  const revs = pa.revisions ?? [];
  const nhanNguoi = nhanNguoiDay(pa.kind);
  const tuan = (d: string | null | undefined) => (d ? tuanLich(d, homNay) : 'chưa đặt');
  const dau = revs[0]?.before ?? { performer: pa.performer, soBuoi: pa.soBuoi ?? null };
  const nguoiTao = !coNguoiDay(pa.kind) ? null
    : nhanNguoi === 'Người dạy' ? (dau.performer ? `dạy ${dau.performer}` : 'người dạy trống') : dau.performer ? `thực hiện ${dau.performer}` : null;
  const dong: (DongNhatKyPa & { hang: number; id: number })[] = [{
    khoa: `tao-${pa.id}`, ngay: ngayTheoGioVN(pa.createdAt) ?? pa.startedDate ?? '', ai: pa.nguonTao || !pa.recordedBy ? 'Web' : pa.recordedBy,
    chu: [`Tạo "${INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind}"`,
      dau.soBuoi != null ? `${dau.soBuoi} buổi` : null, nguoiTao].filter(Boolean).join(' · '),
    hang: 0, id: pa.id,
  }];
  for (const f of ketQua) {
    if (f.interventionId !== pa.id) continue;
    dong.push({
      khoa: `kq-${f.id}`, ngay: f.observedOn, ai: f.observerName ?? '—',
      chu: [`Kết quả ${f.cycleDue ? tuan(tuanKetQuaCuaHan(f.cycleDue)) : tuan(f.observedOn)}`, f.soBuoi != null ? `dạy ${f.soBuoi} buổi` : null,
        f.nguoiDay && f.nguoiDay !== f.observerName ? `người dạy ${f.nguoiDay}` : null].filter(Boolean).join(' · '),
      hang: 1, id: f.id,
    });
  }
  for (const r of revs) {
    const a = r.before; const b = r.after;
    const doi = [
      (a.soBuoi ?? null) !== (b.soBuoi ?? null) ? `Số buổi ${a.soBuoi ?? 'trống'} → ${b.soBuoi ?? 'trống'}` : null,
      a.description !== b.description ? 'Nội dung đổi' : null,
      a.performer !== b.performer ? `${nhanNguoi} ${a.performer ?? 'trống'} → ${b.performer ?? 'trống'}` : null,
      (a.startedDate ?? null) !== (b.startedDate ?? null) ? `Bắt đầu ${tuan(a.startedDate)} → ${tuan(b.startedDate)}` : null,
      r.source !== 'sua_pa' && r.reason ? `Lý do: ${r.reason}` : null,
    ];
    dong.push({ khoa: `sua-${r.id}`, ngay: r.on, ai: r.by ?? 'Web', chu: [NGUON_SUA_PA[r.source] ?? 'Điều chỉnh', ...doi].filter(Boolean).join(' · '), hang: 2, id: r.id });
  }
  /* Cùng ngày: Tạo trước Kết quả trước lần sửa (Điều chỉnh ghi cùng lúc Kết quả). */
  dong.sort((x, y) => (x.ngay !== y.ngay ? (x.ngay < y.ngay ? 1 : -1) : x.hang !== y.hang ? y.hang - x.hang : y.id - x.id));
  return dong.map(({ khoa, ngay, ai, chu }) => ({ khoa, ngay, ai, chu }));
}
/** Số dòng Nhật ký PA — "Nhật ký PA (n)" ở dòng PA (Task 6), cùng danh sách `nhatKyPa` vẽ. */
export const soDongNhatKyPa = (pa: PaNhatKy, ketQua: readonly KetQuaNhatKy[]): number =>
  1 + ketQua.filter((f) => f.interventionId === pa.id).length + (pa.revisions?.length ?? 0);
