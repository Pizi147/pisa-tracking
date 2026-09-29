/**
 * Ý THỨC — VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (module thứ chín, chốt 21/09/2026).
 *
 * Đặc tả: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Luật: rule book mục 18. Nguồn của chủ sản phẩm:
 * `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md`.
 *
 * HAI HỆ HOÀN TOÀN KHÁC NHAU. Học thuật theo dõi một VẤN ĐỀ qua nhiều tuần bằng Case; Ý thức ghi từng SỰ VIỆC bằng một
 * Vi phạm độc lập rồi GVCN chọn Biện pháp xử lý. Không ép hai hệ dùng chung một vòng đời — không có đợt, không có hạn
 * 3/5/7 ngày, không đo cải thiện, chỉ một cảnh báo mềm 5 ngày.
 *
 * File này chỉ có TỪ VỰNG và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi.
 */

import { ENTRY_SKILLS } from './skills.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, boMonLich, programmeOf } from './normal.ts';
import { hanTheoNgay } from './cases.ts';
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';

// ---------------------------------------------------------------- lời chốt Y01–Y04

/**
 * Y01 — ĐÃ CHỐT 21/09/2026. Ai xác nhận biện pháp nặng (Thư cảnh cáo 1/2/3, Đình chỉ học, CX/GĐCN meeting)?
 *   'gvcn-tu-lam'  : GVCN tự làm hết, kể cả biện pháp nặng. KHÔNG có bước Quản lý duyệt cho bất kỳ loại nào. Quản lý
 *                    nhận THÔNG BÁO khi một Thư cảnh cáo hoặc Đình chỉ học được xác nhận — để biết, không phải cửa duyệt.  ← đã chốt
 *   'ql-duyet-nang': biện pháp nặng phải chờ Quản lý duyệt — KHÔNG dùng.
 */
export const Y01_AI_XAC_NHAN_BIEN_PHAP_NANG = 'gvcn-tu-lam' as const;

/**
 * Y02 — ĐÃ CHỐT 21/09/2026. Chuỗi Thư cảnh cáo 1 → 2 → 3 đếm trong phạm vi nào?
 *   'theo-lo-trinh': theo LỘ TRÌNH HỌC (`learning_cycles.id`). Em học lại hoặc lên lộ trình mới thì chuỗi reset về lần 1.  ← đã chốt
 *   'theo-hoc-vien': cả đời học viên — KHÔNG dùng.
 */
export const Y02_PHAM_VI_CHUOI_THU_CANH_CAO = 'theo-lo-trinh' as const;

/**
 * Y03 — ĐÃ CHỐT 21/09/2026, là quyết định giao diện nên không cần hằng số: ba khu vực Ý thức của GVCN nằm ở tab `Ý thức`
 * của hồ sơ LỚP, cộng một tab `Ý thức` gọn ở hồ sơ học viên. KHÔNG thêm khu vực cấp chính thứ năm.
 *
 * Y04 — ĐÃ CHỐT 21/09/2026: năm nhóm vi phạm (`VIOLATION_CATEGORIES`), bỏ `Tham gia trên lớp`.
 */

/**
 * CẢNH BÁO MỀM: học viên còn vi phạm chưa gắn vào biện pháp nào mà cái cũ nhất đã QUÁ ngần này ngày (nguồn mục 30).
 * Chỉ để nhắc — không tự tạo case, không tự tạo biện pháp, không đặt hạn, không tính là quá hạn của ai.
 */
export const CANH_BAO_NGAY = 5;

// ---------------------------------------------------------------- vi phạm

/** NĂM NHÓM (Y04), xếp theo thứ tự bày ra. Không chỗ nào dựa vào vị trí trong mảng. */
export const VIOLATION_CATEGORIES = ['attendance', 'homework', 'conduct', 'classroom', 'other'] as const;
export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];
export const VIOLATION_CATEGORY_LABEL: Record<ViolationCategory, string> = {
  attendance: 'Chuyên cần',
  homework: 'BTVN',
  conduct: 'Thái độ / hành vi',
  classroom: 'Kỷ luật lớp học',
  other: 'Khác',
};

/** Đổi nhóm của dữ liệu cũ: `Tham gia trên lớp` (participation) đã bỏ, đổi sang `Thái độ / hành vi` (Y04). */
export function legacyTopicToViolationCategory(topic: string | null | undefined): ViolationCategory {
  switch (topic) {
    case 'attendance': return 'attendance';
    case 'homework': return 'homework';
    case 'participation': return 'conduct';
    default: return 'other';
  }
}

/** V02: mô tả tối thiểu. V05 (bản T13): nhóm Khác cần ô Ghi rõ ≥ 3 ký tự (`kiemGhiRoKhac`, `./khac.ts`). */
export const VIOLATION_DESCRIPTION_MIN = 10;

/**
 * Môn của một vi phạm — TÙY CHỌN (V02/V04). Lớp Fast Track phân công Writing thành hai task, lớp Normal có một môn Writing
 * và Pronunciation, nên danh sách này là hợp của hai bộ.
 */
export const VIOLATION_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking', 'pronunciation'] as const;
export const VIOLATION_SKILL_LABEL: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing1: 'Writing Task 1', writing2: 'Writing Task 2',
  writing: 'Writing', speaking: 'Speaking', pronunciation: 'Pronunciation',
};

/** K5-47: DANH SÁCH CHỌN môn vi phạm theo chương trình của lớp. FT/không rõ: 5 ô nhập · lớp thường: bộ môn · Pre FOU: không chọn môn.
 *  `VIOLATION_SKILLS` giữ nguyên để máy chủ vẫn nhận dữ liệu cũ. */
export function monViPham(ct: string | null | undefined): readonly string[] {
  const c = programmeOf(ct);
  if (!c || c === 'FT') return ENTRY_SKILLS;
  if (CHUONG_TRINH_KHONG_CHIA_MON.includes(c)) return [];
  return boMonLich(c);
}

// ================================================================ LUẬT v4 (PR-YT4, đặc tả 27/09 §5.4) — MỘT HÀM TRẠNG THÁI

/**
 * THANG BẮT BUỘC (V4-8, Q27-1). Bậc = vị trí + 1 (Q3: không lưu cột bậc — bậc đọc từ `kind`). WL = thư cảnh cáo.
 * Bậc 4 là MỘT lần xử lý (Report 4 kèm Meeting CX/GĐCN), không cần QL. Bậc 6 (WL 3) cần QL duyệt.
 */
export const THANG = ['report_1', 'report_2', 'wl_1', 'report_4_meeting', 'wl_2', 'wl_3'] as const;
/** Ngoài thang (V4-9): luôn cần QL, KHÔNG đẩy bậc (T28, M-11). */
export const NGOAI_THANG = ['meeting_cx', 'suspension', 'other'] as const;
export const MEASURE_KINDS = [...THANG, ...NGOAI_THANG] as const;
export type MeasureKind = (typeof MEASURE_KINDS)[number];
export type BacThang = (typeof THANG)[number];
export const MEASURE_KIND_LABEL: Record<MeasureKind, string> = {
  report_1: 'Report 1', report_2: 'Report 2', wl_1: 'WL 1', report_4_meeting: 'Report 4 + Meeting CX/GĐCN', wl_2: 'WL 2', wl_3: 'WL 3',
  meeting_cx: 'Meeting CX/GĐCN', suspension: 'Đình chỉ học tạm thời', other: 'Khác',
};

/** Tên một lần xử lý. `Khác` có tên riêng thì dùng tên riêng. Loại lạ (dòng cũ còn sót trong DB thử — Q2) → `Xử lý (loại cũ)`. */
export function nhanLoaiXuLy(kind: string, customName?: string | null): string {
  if (kind === 'other' && customName?.trim()) return customName.trim();
  return (MEASURE_KIND_LABEL as Record<string, string>)[kind] ?? 'Xử lý (loại cũ)';
}

/**
 * Khoá thống kê "theo loại" (Excel, `bien-phap-theo-loai`): chín loại v4 + `loai-cu` cho dòng lạ của dữ liệu cũ (Q2) — để tổng các loại
 * luôn bằng tổng chỉ số.
 */
export const KHOA_LOAI_XU_LY = [...MEASURE_KINDS, 'loai-cu'] as const;
export type KhoaLoaiXuLy = (typeof KHOA_LOAI_XU_LY)[number];
export function khoaLoaiXuLy(kind: string): KhoaLoaiXuLy {
  return (MEASURE_KINDS as readonly string[]).includes(kind) ? (kind as MeasureKind) : 'loai-cu';
}

/** Cần QL duyệt: WL 3 và mọi loại ngoài thang (V4-8, V4-9). */
export function canQl(kind: MeasureKind): boolean {
  return kind === 'wl_3' || (NGOAI_THANG as readonly string[]).includes(kind);
}

/** Bậc (1–6) của một loại trong thang; 0 khi ngoài thang hoặc loại lạ. */
export function bacCuaLoai(kind: string): number {
  return (THANG as readonly string[]).indexOf(kind) + 1;
}

/**
 * Trạng thái một lần xử lý. `done` = đã xong (tự làm, hoặc QL duyệt rồi GVCN bấm Đã thực hiện) · `nhap` = đề xuất đang soạn để tải
 * bằng chứng (NỘI BỘ, không bao giờ hiện, không vào trạng thái — Q10) · `cho_duyet` · `da_duyet` (chờ Đã thực hiện) · `tu_choi`.
 */
export const MEASURE_STATUSES = ['done', 'nhap', 'cho_duyet', 'da_duyet', 'tu_choi'] as const;
export type MeasureStatus = (typeof MEASURE_STATUSES)[number];
export const XU_LY_STATUS_LABEL: Record<MeasureStatus, string> = {
  done: 'Đã xử lý', nhap: 'Đang soạn', cho_duyet: 'Chờ QL duyệt', da_duyet: 'Đã duyệt · chờ thực hiện', tu_choi: 'QL từ chối',
};

/** Hạn Ý thức: 5 ngày, tính cả ngày bắt đầu (T26, M-16). */
export const HAN_Y_THUC_NGAY = 5;

export const TRANG_THAI_VP = ['moi', 'da_ghi_nhan', 'can_xu_ly', 'qua_han', 'cho_duyet', 'da_xu_ly'] as const;
export type TrangThaiVp = (typeof TRANG_THAI_VP)[number];
export const TRANG_THAI_VP_LABEL: Record<TrangThaiVp, string> = {
  moi: 'Mới', da_ghi_nhan: 'Đã ghi nhận', can_xu_ly: 'Cần xử lý', qua_han: 'Quá hạn', cho_duyet: 'Chờ QL duyệt', da_xu_ly: 'Đã xử lý',
};

export type ViPhamVao = {
  id: number; occurredOn: string; reportedOn: string; ghiNhanLuc: string | null;
  xuLy: { id: number; kind: string; status: MeasureStatus; performedOn: string | null; quyetLuc: string | null }[];
};
/** `mocLop` = max(ngày vào lớp đang học, ngày Quay lại học) — hạn đặt lại từ đây (M-08). `tamDung`: em đang Tạm dừng (T65). */
export type NguCanhHan = { homNay: string; mocLop: string | null; tamDung: boolean };

const DONG_VP: ReadonlySet<string> = new Set(['done', 'cho_duyet', 'da_duyet']);
/** Vi phạm "đã đóng bằng xử lý": nằm trong một lần xử lý xong, đang chờ QL, hoặc đã duyệt. Từ chối / nháp không tính. */
const daDong = (v: Pick<ViPhamVao, 'xuLy'>) => v.xuLy.some((x) => DONG_VP.has(x.status));
const maxNgay = (...ds: (string | null | undefined)[]) => ds.filter((d): d is string => !!d).map((d) => d.slice(0, 10)).sort().pop() ?? null;
const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

/**
 * BẮT BUỘC XỬ LÝ TỪ NGÀY NÀO (T25, V4-2, K5-23, M-10) — Map id vi phạm → ngày; vi phạm không bắt buộc thì không có trong Map.
 *
 *   · Chỉ xét vi phạm CHƯA XỬ LÝ (không nằm trong lần xử lý done | cho_duyet | da_duyet). "Đã ghi nhận" VẪN đếm (V4-6).
 *   · Xét từng v theo `reportedOn` tăng dần: đếm vi phạm chưa xử lý có `occurredOn ∈ [Thứ Hai tuần của v.reportedOn − 7, v.reportedOn]`
 *     và `reportedOn ≤ v.reportedOn`. Đủ ≥ 3 thì mọi vi phạm đó nhận `min(hiện có, v.reportedOn)` — hạn tính từ NGÀY GHI (Q4).
 *   · Vi phạm nằm trong lần xử lý bị QL từ chối → `min(…, quyetLuc)` (V4-10: từ chối → về Cần xử lý).
 *   · Tính từ `reportedOn`, không đọc hôm nay, nên "dính" tự nhiên: tuần sau vẫn bắt buộc. Sửa/xoá vi phạm thì tự tính lại (Q1).
 */
export function batBuocTu(ds: readonly ViPhamVao[]): Map<number, string> {
  const out = new Map<number, string>();
  const dat = (id: number, ngay: string) => { const cu = out.get(id); if (!cu || ngay < cu) out.set(id, ngay); };
  const chua = ds.filter((v) => !daDong(v)).sort((a, b) => a.reportedOn.localeCompare(b.reportedOn) || a.id - b.id);
  for (const v of chua) {
    const tu = addDaysIso(mondayOfDate(v.reportedOn), -7);
    const cung = chua.filter((u) => u.reportedOn <= v.reportedOn && u.occurredOn >= tu && u.occurredOn <= v.reportedOn);
    if (cung.length >= 3) for (const u of cung) dat(u.id, v.reportedOn);
  }
  for (const v of chua) {
    for (const x of v.xuLy) if (x.status === 'tu_choi' && x.quyetLuc) dat(v.id, x.quyetLuc.slice(0, 10));
  }
  return out;
}

export type TrangThaiViPhamKq = {
  t: TrangThaiVp; nhan: string; han: string | null; quaHanNgay: number | null; lyDoQuaHan: 'xu-ly' | 'xem' | null;
};

/**
 * TRẠNG THÁI MỘT VI PHẠM — ĐÚNG MỘT NHÃN (bảng §5.4). Thứ tự (M-10):
 *   da_xu_ly (trong lần xử lý done) › cho_duyet (cho_duyet: "Chờ QL duyệt"; da_duyet: "Đã duyệt · chờ thực hiện", hạn = ngày quyết + 4)
 *   › bắt buộc: hạn = hanTheoNgay(max(batBuoc, mocLop), 5) → qua_han ('xu-ly') khi hôm nay > hạn, còn lại can_xu_ly
 *   › chưa ghi nhận: hạn = hanTheoNgay(max(reportedOn, mocLop), 5) → qua_han ('xem', V4-5) / moi
 *   › da_ghi_nhan.
 * Em Tạm dừng (T65): không bao giờ qua_han, không hạn.
 */
export function trangThaiViPham(v: ViPhamVao, batBuoc: string | null, n: NguCanhHan): TrangThaiViPhamKq {
  const xong = v.xuLy.filter((x) => x.status === 'done')
    .sort((a, b) => (a.performedOn ?? '').localeCompare(b.performedOn ?? '') || a.id - b.id).pop();
  if (xong) return { t: 'da_xu_ly', nhan: `Đã xử lý · ${nhanLoaiXuLy(xong.kind)}`, han: null, quaHanNgay: null, lyDoQuaHan: null };
  if (v.xuLy.some((x) => x.status === 'cho_duyet')) return { t: 'cho_duyet', nhan: 'Chờ QL duyệt', han: null, quaHanNgay: null, lyDoQuaHan: null };
  const duyet = v.xuLy.find((x) => x.status === 'da_duyet');
  if (duyet) {
    const han = duyet.quyetLuc && !n.tamDung ? hanTheoNgay(duyet.quyetLuc.slice(0, 10), HAN_Y_THUC_NGAY) : null;
    return {
      t: 'cho_duyet', nhan: 'Đã duyệt · chờ thực hiện', han,
      quaHanNgay: han && n.homNay > han ? ngayCach(han, n.homNay) : null, lyDoQuaHan: null,
    };
  }
  const tinh = (t: 'can_xu_ly' | 'moi', batDau: string, lyDo: 'xu-ly' | 'xem'): TrangThaiViPhamKq => {
    if (n.tamDung) return { t, nhan: TRANG_THAI_VP_LABEL[t], han: null, quaHanNgay: null, lyDoQuaHan: null };
    const han = hanTheoNgay(maxNgay(batDau, n.mocLop)!, HAN_Y_THUC_NGAY);
    if (n.homNay > han) {
      const q = ngayCach(han, n.homNay);
      return { t: 'qua_han', nhan: `Quá hạn ${q} ngày`, han, quaHanNgay: q, lyDoQuaHan: lyDo };
    }
    return { t, nhan: TRANG_THAI_VP_LABEL[t], han, quaHanNgay: null, lyDoQuaHan: null };
  };
  if (batBuoc) return tinh('can_xu_ly', batBuoc, 'xu-ly');
  if (!v.ghiNhanLuc) return tinh('moi', v.reportedOn, 'xem');
  return { t: 'da_ghi_nhan', nhan: 'Đã ghi nhận', han: null, quaHanNgay: null, lyDoQuaHan: null };
}

/**
 * CHUỖI ĐẾM THANG (T27, Q-C, M-07) — id các lộ trình cùng chuỗi với `hienTai`, theo `seq`.
 * FT (`route` có) = đúng một lộ trình. Lớp thường (`route` null) đếm LIÊN TỤC qua các lộ trình lớp thường liền nhau; chuỗi gãy
 * ở lộ trình FT và SAU lộ trình `abandoned` (nghỉ học rồi quay lại là chuỗi mới).
 */
export function chuoiThang(cycles: readonly { id: number; seq: number; route: string | null; status: string }[], hienTai: number): number[] {
  const ds = [...cycles].sort((a, b) => a.seq - b.seq || a.id - b.id);
  let nhom: number[] = [];
  for (let i = 0; i < ds.length; i++) {
    const c = ds[i];
    const truoc = ds[i - 1];
    if (!truoc || c.route || truoc.route || truoc.status === 'abandoned') {
      if (nhom.includes(hienTai)) return nhom;
      nhom = [];
    }
    nhom.push(c.id);
  }
  return nhom.includes(hienTai) ? nhom : [hienTai];
}

/** Bậc hiện tại = max(bậc các lần xử lý đã xong trong chuỗi, bậc khai trước khi dùng web — H5); 0 = chưa bậc nào. Ngoài thang không đẩy. */
export function bacHienTai(xuLyDone: readonly { kind: string }[], khaiBac: number | null): number {
  return Math.max(0, khaiBac ?? 0, ...xuLyDone.map((x) => bacCuaLoai(x.kind)));
}

/** Bậc kế tiếp; `null` = hết thang (đã WL 3 — Q11: chỉ còn đề xuất ngoài thang). */
export function bacKeTiep(bac: number): { kind: BacThang; bac: number; canQl: boolean } | null {
  const b = Math.max(0, bac);
  if (b >= THANG.length) return null;
  const kind = THANG[b];
  return { kind, bac: b + 1, canQl: canQl(kind) };
}

export type NhomEm = 'qua_han' | 'bat_buoc' | 'cho_duyet' | 'moi' | 'da_xu_ly';
/** Nhãn Ý thức ở dòng em (danh sách lớp, Tổng quan — K1-17): chỉ hai nhóm cần hành động. */
export type NhanYThucEm = { nhom: 'qua_han' | 'bat_buoc'; so: number; han: string | null; quaHanNgay: number | null };
export const NHOM_EM: readonly NhomEm[] = ['qua_han', 'bat_buoc', 'cho_duyet', 'moi', 'da_xu_ly'];
export const NHOM_EM_LABEL: Record<NhomEm, string> = {
  qua_han: 'Quá hạn', bat_buoc: 'Bắt buộc xử lý', cho_duyet: 'Chờ QL duyệt', moi: 'Mới, chưa ghi nhận', da_xu_ly: 'Đã xử lý (7 ngày)',
};

/**
 * MỖI EM ĐÚNG MỘT NHÓM (K2-38(4)): qua_han › bat_buoc › cho_duyet › moi › da_xu_ly (lần xử lý xong trong 7 ngày gần nhất, tính cả
 * hôm nay). Không thuộc nhóm nào → null.
 */
export function nhomEm(e: { ds: readonly TrangThaiVp[]; coDeXuatCho: boolean; xuLyGanNhat: string | null }, homNay: string): NhomEm | null {
  if (e.ds.includes('qua_han')) return 'qua_han';
  if (e.ds.includes('can_xu_ly')) return 'bat_buoc';
  if (e.coDeXuatCho || e.ds.includes('cho_duyet')) return 'cho_duyet';
  if (e.ds.includes('moi')) return 'moi';
  if (e.xuLyGanNhat && ngayCach(e.xuLyGanNhat, homNay) <= 6) return 'da_xu_ly';
  return null;
}

/**
 * TICK MẶC ĐỊNH của panel Xác nhận xử lý (K3-36, M5): vi phạm chưa xử lý xảy ra từ Thứ Hai tuần trước trở đi + mọi vi phạm Mới +
 * mọi vi phạm bắt buộc (Cần xử lý / Quá hạn — phải xử lý dù cũ). "Đã ghi nhận" cũ hơn vào `cuHon` (không tick, nhóm gập).
 */
export function macDinhTick(ds: readonly { id: number; t: TrangThaiVp; occurredOn: string }[], homNay: string): { tick: number[]; cuHon: number[] } {
  const tu = addDaysIso(mondayOfDate(homNay), -7);
  const tick: number[] = [];
  const cuHon: number[] = [];
  for (const v of ds) {
    if (v.t === 'da_xu_ly' || v.t === 'cho_duyet') continue;
    if (v.t !== 'da_ghi_nhan' || v.occurredOn >= tu) tick.push(v.id); else cuHon.push(v.id);
  }
  return { tick, cuHon };
}

/**
 * MỘT DÒNG THANG: sáu bậc, mỗi bậc một trạng thái — `qua` (đã xử lý trên web) · `khai` (khai trước khi dùng web, H5) · `lan-nay`
 * (bậc kế tiếp) · `sau`.
 */
export function dongThang(bac: number, khai: { bac: number } | null): {
  kind: BacThang; nhan: string; trangThai: 'qua' | 'khai' | 'lan-nay' | 'sau'; canQl: boolean;
}[] {
  return THANG.map((kind, i) => {
    const b = i + 1;
    const trangThai = b <= bac ? (khai && b <= khai.bac ? 'khai' : 'qua') : b === bac + 1 ? 'lan-nay' : 'sau';
    return { kind, nhan: MEASURE_KIND_LABEL[kind], trangThai, canQl: canQl(kind) };
  });
}

// ================================================================ v3 (PR-J/YT2) — còn dùng tới khi mã cũ được thay ở Task 4–10 của PR-YT4

/**
 * BA TRẠNG THÁI NGƯỜI DÙNG THẤY của một vi phạm — SUY RA từ bảng nối `measure_violations`, không lưu (đặc tả §4.1).
 *
 * Trước rulebook v3 (21/09/2026 tối) còn trạng thái thứ tư `Không còn hiệu lực` (đánh dấu không chính xác). Nay ghi sai thì sửa hoặc XOÁ thẳng
 * (V11′–V14′), nên chỉ còn ba. Lưu trạng thái xử lý ở chính vi phạm là cách chắc chắn nhất để nó lệch với bảng nối.
 */
export const VIOLATION_STATES = ['unhandled', 'preparing', 'handled'] as const;
export type ViolationState = (typeof VIOLATION_STATES)[number];
export const VIOLATION_STATE_LABEL: Record<ViolationState, string> = {
  unhandled: 'Chưa xử lý',
  preparing: 'Đang chuẩn bị xử lý',
  handled: 'Đã xử lý',
};

/**
 * Trạng thái hiển thị của một vi phạm. Thứ tự ưu tiên: đã xử lý (nằm ít nhất một biện pháp đã thực hiện) > đang chuẩn bị xử lý > chưa xử lý.
 * "Đã xử lý" KHÔNG có nghĩa là xoá hay ẩn khỏi lịch sử (nguồn mục 32).
 */
export function violationState(v: { inDone: boolean; inPreparing: boolean }): ViolationState {
  if (v.inDone) return 'handled';
  if (v.inPreparing) return 'preparing';
  return 'unhandled';
}

// ---------------------------------------------------------------- biện pháp xử lý

/**
 * CHÍN LOẠI, xếp nhẹ đến nặng để BÀY RA. Thứ tự KHÔNG phải workflow bắt buộc (nguồn mục 20): đi thẳng tới biện pháp nặng là
 * hợp lệ. Ngoại lệ cứng duy nhất là chuỗi Thư cảnh cáo (`WARNING_CHAIN`).
 */
export const MEASURE_KINDS_V3 = [
  'talk_short', 'meeting_student', 'family_report', 'warning_1', 'meeting_cx', 'warning_2', 'suspension', 'warning_3', 'other',
] as const;
export type MeasureKindV3 = (typeof MEASURE_KINDS_V3)[number];
export const MEASURE_KIND_LABEL_V3: Record<MeasureKindV3, string> = {
  talk_short: 'GV trao đổi ngắn với HV',
  meeting_student: 'GV meeting với HV',
  family_report: 'Report cho gia đình',
  warning_1: 'Thư cảnh cáo lần 1',
  meeting_cx: 'CX / GĐCN meeting với HV / PH',
  warning_2: 'Thư cảnh cáo lần 2',
  suspension: 'Đình chỉ học',
  warning_3: 'Thư cảnh cáo lần 3',
  other: 'Khác',
};

/** HAI TRẠNG THÁI, KHÔNG BA. Không có `pending_approval`: Y01 chốt GVCN tự làm hết, không có cửa duyệt. */
export const MEASURE_STATUSES_V3 = ['preparing', 'done'] as const;
export type MeasureStatusV3 = (typeof MEASURE_STATUSES_V3)[number];
export const MEASURE_STATUS_LABEL: Record<MeasureStatusV3, string> = { preparing: 'Đang chuẩn bị', done: 'Đã thực hiện' };

/** Quản lý nhận thông báo khi những loại này được xác nhận (Y01) — để biết chuyện nặng đã xảy ra, không phải để duyệt. */
export function measureNotifiesManager(kind: MeasureKindV3): boolean {
  return kind === 'warning_1' || kind === 'warning_2' || kind === 'warning_3' || kind === 'suspension';
}

/**
 * NGOẠI LỆ CỨNG DUY NHẤT VỀ TRÌNH TỰ (nguồn mục 21): Thư cảnh cáo phải đúng 1 → 2 → 3. Trong CÙNG MỘT lộ trình (Y02) không tạo
 * và không xác nhận được lần 2 nếu chưa có lần 1 đã thực hiện; lần 3 cần lần 2. Kiểm ở MÁY CHỦ, không chỉ ẩn nút.
 */
export const WARNING_CHAIN = ['warning_1', 'warning_2', 'warning_3'] as const;
export type WarningKind = (typeof WARNING_CHAIN)[number];

/** Loại thư phải ở trạng thái `done` trước khi loại này được tạo hoặc xác nhận; `null` nghĩa là đi thẳng được. */
export function warningPrerequisite(kind: MeasureKindV3): WarningKind | null {
  const i = (WARNING_CHAIN as readonly string[]).indexOf(kind);
  return i > 0 ? WARNING_CHAIN[i - 1] : null;
}

export function isWarningKind(kind: string): kind is WarningKind {
  return (WARNING_CHAIN as readonly string[]).includes(kind);
}

/**
 * Ô BẮT BUỘC THEO TỪNG LOẠI (đặc tả §5.4, nguồn mục 28). MỘT form tự đổi ô bắt buộc — không dựng chín form.
 * Ngày thực hiện và nội dung luôn bắt buộc; khác nhau ở tệp/liên kết, người tham gia và tên biện pháp.
 */
export type MeasureFieldSpec = {
  date: 'required';
  content: 'required';
  attachment: 'required' | 'optional';
  participants?: 'optional';
  customName?: 'required';
};
export const MEASURE_REQUIRED_FIELDS: Record<MeasureKindV3, MeasureFieldSpec> = {
  talk_short: { date: 'required', content: 'required', attachment: 'optional' },
  meeting_student: { date: 'required', content: 'required', attachment: 'optional' },
  family_report: { date: 'required', content: 'required', attachment: 'optional' },
  warning_1: { date: 'required', content: 'required', attachment: 'required' },
  meeting_cx: { date: 'required', content: 'required', attachment: 'optional', participants: 'optional' },
  warning_2: { date: 'required', content: 'required', attachment: 'required' },
  suspension: { date: 'required', content: 'required', attachment: 'required' },
  warning_3: { date: 'required', content: 'required', attachment: 'required' },
  other: { date: 'required', content: 'required', attachment: 'optional', customName: 'required' },
};

/**
 * CÂU NÓI THIẾU GÌ khi xác nhận — nút `Xác nhận đã thực hiện` mờ đi kèm đúng câu này, không bao giờ để bấm rồi báo lỗi đỏ.
 * Trả `null` khi đủ. Máy chủ dùng CHÍNH hàm này để từ chối, nên giao diện và máy chủ không thể nói hai điều khác nhau.
 */
export function measureMissing(kind: MeasureKindV3, f: {
  performedOn: string | null | undefined; content: string | null | undefined;
  attachments: number; customName?: string | null;
  /** Đã chọn tài khoản hoặc ghi tên người thực hiện chưa. Bỏ qua (không truyền) thì không kiểm. */
  performer?: boolean;
}): string | null {
  const spec = MEASURE_REQUIRED_FIELDS[kind];
  if (!spec) return 'Loại phương án xử lý không hợp lệ';
  if (spec.customName === 'required' && !(f.customName ?? '').trim()) return 'Cần ghi tên phương án xử lý';
  if (!f.performedOn) return 'Cần chọn ngày thực hiện';
  if (f.performer === false) return 'Cần chọn hoặc ghi tên người thực hiện';
  if (!(f.content ?? '').trim()) return 'Cần ghi nội dung hoặc ghi chú';
  if (spec.attachment === 'required' && f.attachments < 1) {
    return kind === 'suspension'
      ? 'Cần đính kèm tệp hoặc liên kết quyết định đình chỉ học'
      : 'Cần đính kèm tệp hoặc liên kết thư cảnh cáo';
  }
  return null;
}

// ---------------------------------------------------------------- cảnh báo 5 ngày

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Số ngày từ ngày xảy ra tới ngày nghiệp vụ hôm nay. */
export function violationAgeDays(occurredOn: string, today: string): number {
  return daysBetween(occurredOn, today);
}

/**
 * CẢNH BÁO 5 NGÀY — ĐỊNH NGHĨA CHÍNH XÁC (đặc tả §5.5, W01–W04).
 *
 *   Tập cần xử lý của một học viên = vi phạm còn hiệu lực VÀ chưa nằm trong bất kỳ biện pháp nào.
 *   Cảnh báo bật khi tập KHÔNG rỗng và (hôm nay − ngày xảy ra cũ nhất) > 5 ngày.
 *
 * Hàm thuần nhận NGÀY XẢY RA của các vi phạm thuộc tập cần xử lý — việc lọc tập nằm ở máy chủ (`canhBao.ts`), là MỘT hàm
 * duy nhất cho cả ba nơi hiển thị (W05).
 */
export function violationWarning(unhandledDates: readonly string[], today: string) {
  const count = unhandledDates.length;
  if (count === 0) return { active: false, count: 0, oldestOn: null as string | null, oldestAgeDays: 0, message: '' };
  const oldestOn = [...unhandledDates].sort()[0].slice(0, 10);
  const oldestAgeDays = daysBetween(oldestOn, today);
  const active = oldestAgeDays > CANH_BAO_NGAY;
  return {
    active, count, oldestOn, oldestAgeDays,
    message: active ? `Chưa xử lý ${count} vi phạm · cũ nhất ${oldestAgeDays} ngày` : '',
  };
}

/** W06: tuổi `9 ngày` (không ⚠ — nhắc mềm, không phải quá hạn) cạnh TỪNG vi phạm chưa xử lý quá 5 ngày — để không ai phải tự trừ ngày. */
export function violationAgeLabel(ageDays: number): string {
  return ageDays > CANH_BAO_NGAY ? `${ageDays} ngày` : '';
}
