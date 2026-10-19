/**
 * PR-PA (§8): MỘT mẫu PA cho mọi đường (tay, quy chế SOS, bổ trợ, tutor kỳ vọng). Luật thuần — web và máy chủ cùng gọi.
 * Số buổi chỉ với Tutor, Tự học, Bổ trợ, Bổ trợ miễn phí; không bắt buộc; số nguyên 1–60. Tự học không có ô người.
 */
import { dsLoi, type LoiTruong } from './loiForm.ts';
import { nguoiThanhPayload, nguoiThieu, type NguoiChon } from './nguoiThucHien.ts';
import { KHAC_TOI_THIEU } from './khac.ts';
import { INTERVENTION_KIND_LABEL } from './cases.ts';
import { kyGhiKetQua, ngayTheoGioVN } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { addDaysIso } from './sos.ts';
import { t } from '../i18n/index.ts';

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
  if (!nguyenTrong(n, 1)) return t('Từ 1 đến 60 buổi, hoặc để trống');
  if (n < daDay) return t('Đã dạy {daDay} buổi — Số buổi từ {daDay2} trở lên, hoặc để trống', { daDay, daDay2: daDay });
  return null;
}

/** Số buổi kỳ này (Kết quả có ô số buổi — `coSoBuoiKy`): bắt buộc, số nguyên 0–60 (0 = em nghỉ). → câu lỗi | null. */
export function kiemSoBuoiTuan(v: unknown): string | null {
  const n = soBuoiTu(v);
  return n !== null && nguyenTrong(n, 0) ? null : t('Từ 0 đến 60 buổi');
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

/**
 * Kết quả có ô "Số buổi kỳ này" (0–60, bắt buộc): PA có Số buổi, và OV-12h — MỌI PA Tutor (kể cả không có Số buổi lúc tạo).
 * `cu`: sửa lần ghi CŨ của Tutor chưa từng có số buổi — giữ như trước (không hỏi).
 */
export type PaKetQua = { kind: string; soBuoi?: number | null; cu?: boolean };
export const coSoBuoiKy = (pa: PaKetQua): boolean => pa.soBuoi != null || (pa.kind === 'tutor' && !pa.cu);
/**
 * OV-13b (mockup OV-13 §1): GHI NHANH trên dòng (Tiến triển + Nhận xét, Giữ nguyên) — chỉ PA không đếm buổi, không phải lần ghi cuối, không Mini Test.
 * Còn lại (Tutor n buổi, Số buổi kỳ này, Kết quả cuối, Bổ trợ miễn phí) luôn mở panel. Công việc (máy chủ) và Case / panel một em (web) cùng hàm.
 */
export const ghiNhanhDuoc = (pa: { kind: string; soBuoi?: number | null; lanCuoi?: boolean }): boolean =>
  !pa.lanCuoi && pa.kind !== 'bo_tro_mien_phi' && !coSoBuoiKy({ kind: pa.kind, soBuoi: pa.soBuoi ?? null });
/** OV-13b: PA tới kỳ ghi kết quả — cùng ngưỡng việc "Ghi kết quả" hiện ở Công việc (`action_due ≤ hôm nay + 2`, mywork 2b). */
export const toiKyGhi = (actionDue: string | null | undefined, homNay: string): boolean => !!actionDue && actionDue <= addDaysIso(homNay, 2);

/** Lỗi khối đếm: Số buổi kỳ này (`coSoBuoiKy`, 0–60) · Người dạy tuần này (Tự học không có; PR-CT2: không bắt buộc, chỉ kiểm tên ngoài). */
export function loiKetQuaTuan(pa: PaKetQua, tuan: string, nguoi: NguoiChon | null): LoiTruong[] {
  const loi: LoiTruong[] = [];
  const sb = coSoBuoiKy(pa) ? kiemSoBuoiTuan(tuan) : null;
  if (sb) loi.push({ khoa: 'so-buoi-tuan', nhan: t('Số buổi kỳ này'), lyDo: sb });
  const ng = coNguoiDay(pa.kind) ? nguoiThieu(nguoi, false) : null;
  if (ng) loi.push({ khoa: 'nguoi-day', nhan: t('Người dạy tuần này'), lyDo: ng });
  return loi;
}

/**
 * OV-12h (chủ SP 14/10) + TU-a (đặc tả Tutor mục 5): một buổi của Kết quả PA Tutor. Bắt buộc: tutor (chọn từ danh sách → `tutorId` + tên chụp; "Tutor khác"
 * → chỉ tên), nhận xét buổi, 3 ô Có / Không. Tuỳ chọn: hình thức (tự suy, trống được), đánh giá 1–5, nhận xét về tutor.
 */
export type BuoiTutor = {
  tutorId?: number | null; tutor: string; nhanXet: string; hinhThuc?: HinhThuc | null;
  chuanBi?: boolean | null; taiLieu?: boolean | null; feedbackGv?: boolean | null;
  danhGia?: number | null; nhanXetTutor?: string | null;
};
export type HinhThuc = 'offline' | 'online';
/** Ba tiêu chí "Tutor buổi này" (Q3) — thứ tự hiện trên form, lịch sử, trang Tutor. */
export const TIEU_CHI_TUTOR = [
  { k: 'chuanBi', nhan: t('Có chuẩn bị bài'), ngan: t('Chuẩn bị') },
  { k: 'taiLieu', nhan: t('Xin tài liệu đúng hạn'), ngan: t('Tài liệu') },
  { k: 'feedbackGv', nhan: t('Gửi feedback về HV cho GV'), ngan: t('Feedback GV') },
] as const;
/** MỌI PA Tutor → Kết quả ghi theo buổi (n buổi kỳ này = n dòng; n = 0 không dòng). Chỉ sửa lần ghi cũ chưa có số buổi (`cu`) là không hỏi. */
export const canBuoiTutor = (pa: PaKetQua): boolean => pa.kind === 'tutor' && !pa.cu;
const laCoKhong = (v: unknown) => v === true || v === false;
/**
 * Đúng `n` dòng, mỗi dòng đủ tên tutor + nhận xét + 3 ô Có / Không → null; sai → câu lỗi (web và máy chủ cùng gọi). `cu3`: lần ghi đã có dòng buổi từ
 * trước TU-a (3 ô trống) — Sửa không bắt 3 ô (đặc tả mục 5, 11); có gửi thì vẫn phải đúng kiểu. `tutorId` có trong danh sách: máy chủ kiểm thêm.
 */
export function kiemBuoiTutor(n: number, buoi: unknown, cu3 = false): string | null {
  if (!Array.isArray(buoi) || buoi.length !== n) return t('cần đủ {n} dòng (mỗi buổi một dòng)', { n });
  for (const [i, b] of buoi.entries()) {
    const x = i + 1;
    const tutor = String(b?.tutor ?? '').trim(), nhanXet = String(b?.nhanXet ?? '').trim();
    if (!tutor) return t('buổi {x} chưa có tên tutor', { x });
    if (!nhanXet) return t('buổi {x} chưa có nhận xét', { x });
    if (tutor.length > 100 || nhanXet.length > 1000) return t('buổi {x} quá dài (tên ≤ 100, nhận xét ≤ 1000 ký tự)', { x });
    if (b.tutorId != null && !(Number.isInteger(b.tutorId) && b.tutorId > 0)) return t('buổi {x}: tutor không hợp lệ', { x });
    for (const { k } of TIEU_CHI_TUTOR) {
      if (cu3 ? b[k] != null && !laCoKhong(b[k]) : !laCoKhong(b[k])) return t('buổi {x}: chọn Có hoặc Không ở cả 3 ô "Tutor buổi này"', { x });
    }
    if (b.hinhThuc != null && b.hinhThuc !== 'offline' && b.hinhThuc !== 'online') return t('buổi {x}: hình thức là Offline hoặc Online', { x });
    if (b.danhGia != null && !(Number.isInteger(b.danhGia) && b.danhGia >= 1 && b.danhGia <= 5)) return t('buổi {x}: đánh giá từ 1 đến 5, hoặc để trống', { x });
    if (String(b.nhanXetTutor ?? '').length > 1000) return t('buổi {x}: nhận xét về tutor tối đa 1000 ký tự', { x });
  }
  return null;
}

/** Hình thức tự chọn (mục 5.2, 13): nơi dạy = chi nhánh lớp của em → Offline; chi nhánh khác / Chỉ online → Online; chưa có nơi dạy / "Tutor khác" → trống. */
export function hinhThucTuSuy(tutor: { noiDayBranchId: number | null; chiOnline: number | boolean } | null, branchIdLop: number | null): HinhThuc | null {
  if (!tutor) return null;
  if (tutor.chiOnline) return 'online';
  if (tutor.noiDayBranchId == null) return null;
  return tutor.noiDayBranchId === branchIdLop ? 'offline' : 'online';
}
/** Kỹ năng tutor (mã ngắn, thứ tự cố định — `ENTRY_SKILL_SHORT`, chủ SP 20/10 có W1 / W2). */
export const KN_TUTOR = ['L', 'R', 'W1', 'W2', 'S'] as const;
/** Kỹ năng PA lấy từ topic của Case → kỹ năng tutor khớp (đủ một là được). Writing → W1 hoặc W2 (mục 13.1). Rỗng = không lọc theo kỹ năng. */
export function knTutorCuaTopic(topic: string | null | undefined): string[] {
  if (topic === 'listening') return ['L'];
  if (topic === 'reading') return ['R'];
  if (topic === 'speaking' || topic === 'pronunciation') return ['S'];
  if (topic && /writing/.test(topic)) return ['W1', 'W2'];
  return [];
}

/** Phần thân `POST /interventions/:id/result` của khối đếm: `soBuoi` khi có ô Số buổi kỳ này (`coSoBuoiKy`); `nguoiDay` chỉ khi loại có người. */
export function thanKetQuaTuan(pa: PaKetQua, tuan: string, nguoi: NguoiChon | null) {
  return {
    ...(coSoBuoiKy(pa) ? { soBuoi: soBuoiTu(tuan) } : {}),
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
export function loiFormPa(v: GiaTriPa, o: { toiThieu?: number; daDay?: number; goc?: GiaTriPa; tienTo?: string;
  /** OV-13b (Xác nhận PA): Tutor Số buổi / 2 tuần *. Người dạy không bắt buộc (chủ SP 19/10). Cùng luật `xacNhanPaQuyChe`. */
  batBuoc?: boolean } = {}): LoiTruong[] {
  const { goc } = o;
  const tien = o.tienTo ?? '';
  const doi = (k: 'description' | 'soBuoi') => !goc || v[k].trim() !== goc[k].trim();
  const loi = dsLoi([
    ...(v.kind === 'other_proposal' && !goc ? [{ khoa: `${tien}ghi-ro`, nhan: t('Tên đề xuất'), toiThieu: KHAC_TOI_THIEU }] : []),
    ...(doi('description') ? [{ khoa: `${tien}noi-dung`, nhan: t('Nội dung'), toiThieu: o.toiThieu ?? 8 }] : []),
  ], { [`${tien}ghi-ro`]: v.ghiRo, [`${tien}noi-dung`]: v.description });
  const sb = coSoBuoi(v.kind) && doi('soBuoi') ? kiemSoBuoiPa(v.soBuoi, o.daDay ?? 0)
    ?? (o.batBuoc && v.kind === 'tutor' && !v.soBuoi.trim() ? t('Nhập số buổi') : null) : null;
  if (sb) loi.push({ khoa: `${tien}so-buoi`, nhan: t('Số buổi'), lyDo: sb });
  const ng = coNguoiDay(v.kind) ? nguoiThieu(v.nguoi, false) : null;
  if (ng) loi.push({ khoa: `${tien}nguoi`, nhan: nhanNguoiDay(v.kind), lyDo: ng });
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

const NGUON_SUA_PA: Record<string, string> = { adjust: t('Điều chỉnh'), confirm_edit: t('Sửa khi xác nhận PA'), sua_pa: t('Sửa PA') };

/**
 * NHẬT KÝ PA (mockup pa-dong-bo §6), mới nhất lên trên: dòng Tạo (giá trị LÚC TẠO = bản cũ của lần sửa đầu) · mỗi lần Kết quả
 * ("Kết quả W1–W2 OCT · dạy 3 buổi", OV-12a: kỳ của hạn) · mỗi lần Sửa PA / Điều chỉnh (cũ → mới, chỉ ô đổi).
 */
export function nhatKyPa(pa: PaNhatKy, ketQua: readonly KetQuaNhatKy[], homNay: string): DongNhatKyPa[] {
  const revs = pa.revisions ?? [];
  const nhanNguoi = nhanNguoiDay(pa.kind);
  const tuan = (d: string | null | undefined) => (d ? tuanLich(d, homNay) : t('chưa đặt'));
  const dau = revs[0]?.before ?? { performer: pa.performer, soBuoi: pa.soBuoi ?? null };
  const nguoiTao = !coNguoiDay(pa.kind) ? null
    : nhanNguoi === 'Người dạy' ? (dau.performer ? t('dạy {performer}', { performer: dau.performer }) : t('người dạy trống')) : dau.performer ? t('thực hiện {performer}', { performer: dau.performer }) : null;
  const dong: (DongNhatKyPa & { hang: number; id: number })[] = [{
    khoa: `tao-${pa.id}`, ngay: ngayTheoGioVN(pa.createdAt) ?? pa.startedDate ?? '', ai: pa.nguonTao || !pa.recordedBy ? 'Web' : pa.recordedBy,
    chu: [t('Tạo "{x}"', { x: INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind }),
      dau.soBuoi != null ? t('{soBuoi} buổi', { soBuoi: dau.soBuoi }) : null, nguoiTao].filter(Boolean).join(' · '),
    hang: 0, id: pa.id,
  }];
  for (const f of ketQua) {
    if (f.interventionId !== pa.id) continue;
    dong.push({
      khoa: `kq-${f.id}`, ngay: f.observedOn, ai: f.observerName ?? '—',
      chu: [t('Kết quả {x}', { x: f.cycleDue ? kyGhiKetQua(f.cycleDue, homNay) : tuan(f.observedOn) }), f.soBuoi != null ? t('dạy {soBuoi} buổi', { soBuoi: f.soBuoi }) : null,
        f.nguoiDay && f.nguoiDay !== f.observerName ? t('người dạy {nguoiDay}', { nguoiDay: f.nguoiDay }) : null].filter(Boolean).join(' · '),
      hang: 1, id: f.id,
    });
  }
  for (const r of revs) {
    const a = r.before; const b = r.after;
    const doi = [
      (a.soBuoi ?? null) !== (b.soBuoi ?? null) ? t('Số buổi {x} → {x2}', { x: a.soBuoi ?? t('trống'), x2: b.soBuoi ?? t('trống') }) : null,
      a.description !== b.description ? t('Nội dung đổi') : null,
      a.performer !== b.performer ? `${nhanNguoi} ${a.performer ?? t('trống')} → ${b.performer ?? t('trống')}` : null,
      (a.startedDate ?? null) !== (b.startedDate ?? null) ? t('Bắt đầu {tuan} → {tuan2}', { tuan: tuan(a.startedDate), tuan2: tuan(b.startedDate) }) : null,
      r.source !== 'sua_pa' && r.reason ? t('Lý do: {reason}', { reason: r.reason }) : null,
    ];
    dong.push({ khoa: `sua-${r.id}`, ngay: r.on, ai: r.by ?? 'Web', chu: [NGUON_SUA_PA[r.source] ?? t('Điều chỉnh'), ...doi].filter(Boolean).join(' · '), hang: 2, id: r.id });
  }
  /* Cùng ngày: Tạo trước Kết quả trước lần sửa (Điều chỉnh ghi cùng lúc Kết quả). */
  dong.sort((x, y) => (x.ngay !== y.ngay ? (x.ngay < y.ngay ? 1 : -1) : x.hang !== y.hang ? y.hang - x.hang : y.id - x.id));
  return dong.map(({ khoa, ngay, ai, chu }) => ({ khoa, ngay, ai, chu }));
}
/** Số dòng Nhật ký PA — "Nhật ký PA (n)" ở dòng PA (Task 6), cùng danh sách `nhatKyPa` vẽ. */
export const soDongNhatKyPa = (pa: PaNhatKy, ketQua: readonly KetQuaNhatKy[]): number =>
  1 + ketQua.filter((f) => f.interventionId === pa.id).length + (pa.revisions?.length ?? 0);

// ------------------------------------------------------------------ dòng PA ở panel Case (Task 6): nút Kết quả · ⋯ Sửa PA · Xoá PA

type PaDong = { kind: string; status: string; preset?: boolean; confirmedAt?: string | null; approvalState?: string | null; ghiDuoc?: boolean };

/** PA đang chạy — cùng chặn với máy chủ (`chanPaChuaChay`): chưa khép, không chờ Quản lý duyệt, PA quy chế đã xác nhận. */
export const paDangChay = (pa: PaDong): boolean =>
  (pa.status === 'planned' || pa.status === 'started') && pa.approvalState !== 'pending' && !(pa.preset && !pa.confirmedAt);

/**
 * Nút trên dòng PA: `ketQua` (nút Kết quả) và `sua` (⋯ Sửa PA) cùng luật — người xem ghi được Kết quả của PA (`ghiDuoc`) và PA đang chạy.
 * `xoa` (⋯ Xoá PA): Quản lý / Quản trị, Case chưa xong, không phải PA hệ thống sinh (quy chế, Bổ trợ) — luật PR-LUI-a2 cũ.
 * `ketThuc` (⋯ Kết thúc PA, OV-13a C): PA theo quy chế SOS đang chạy, người xem là GVCN lớp đang học / Quản lý (`coTheKetThucPa` của máy chủ).
 */
export function nutDongPa(pa: PaDong, xem: { canApprove: boolean; caseXong: boolean; coTheKetThucPa?: boolean }): { ketQua: boolean; sua: boolean; xoa: boolean; ketThuc: boolean } {
  const ghi = !!pa.ghiDuoc && paDangChay(pa);
  const heThong = !!pa.preset || pa.kind === 'bo_tro' || pa.kind === 'bo_tro_mien_phi';
  return {
    ketQua: ghi, sua: ghi, xoa: xem.canApprove && !xem.caseXong && !heThong,
    ketThuc: !!xem.coTheKetThucPa && !xem.caseXong && !!pa.preset && pa.kind !== 'bo_tro' && pa.kind !== 'bo_tro_mien_phi' && pa.status === 'started' && paDangChay(pa),
  };
}
