/**
 * Ý THỨC — VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (module thứ chín, chốt 21/09/2026).
 *
 * Đặc tả: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Luật: rule book mục 18. Nguồn của chủ sản phẩm:
 * `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md`.
 *
 * HAI HỆ HOÀN TOÀN KHÁC NHAU. Học thuật theo dõi một VẤN ĐỀ qua nhiều tuần bằng Case; Ý thức ghi từng SỰ VIỆC bằng một
 * Vi phạm độc lập rồi GVCN Ghi nhận hoặc Xác nhận xử lý theo thang (v4). Không ép hai hệ dùng chung một vòng đời — không có đợt,
 * không đo cải thiện; hạn Ý thức là 5 ngày (bắt buộc xử lý / vi phạm Mới).
 *
 * File này chỉ có TỪ VỰNG và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi.
 */

import { ENTRY_SKILLS } from './skills.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, boMonLich, programmeOf } from './normal.ts';
import { hanTheoNgay } from './cases.ts';
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';

/**
 * Y03 — ba khu vực Ý thức của GVCN nằm ở tab `Ý thức` của hồ sơ LỚP, cộng tab `Ý thức` ở hồ sơ học viên (không thêm khu vực cấp chính).
 * Y04 — năm nhóm vi phạm (`VIOLATION_CATEGORIES`), bỏ `Tham gia trên lớp`.
 * Y01, Y02, chuỗi Thư cảnh cáo 1→2→3, chín loại biện pháp, "Đang chuẩn bị" và cảnh báo mềm 5 ngày (W01–W06) của v3 đã THAY bằng luật v4
 * ở cuối file (PR-YT4, đặc tả 27/09 §5.4).
 */

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
 * Môn của một vi phạm — TÙY CHỌN (V02/V04). Lớp Fast Track phân công Writing thành hai task, lớp thường có một môn Writing
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
 * THANG BẮT BUỘC (V4-8, Q27-1; chủ sản phẩm sửa 02/10). Bậc = vị trí + 1 (Q3: không lưu cột bậc — bậc đọc từ `kind`). WL = thư cảnh cáo.
 * Mạch chính: Report 1 › Report 2 › WL 1 › Report 4 + Meeting CX/GĐCN › Report 5 › WL 2. Bậc 4 là MỘT lần xử lý (Report 4 kèm
 * Meeting CX/GĐCN). Không bậc nào trong thang cần QL.
 * SAU WL 2: Report 7, 8, 9… tăng số mãi (`report_N`, N ≥ 7, số = bậc) — KHÔNG liệt kê ở đây vì không có giới hạn trên.
 * WL 3 và mọi phương án khác chỉ đi bằng đề xuất QL duyệt (`NGOAI_THANG`).
 */
export const THANG = ['report_1', 'report_2', 'wl_1', 'report_4_meeting', 'report_5', 'wl_2'] as const;
/** Bậc đầu tiên sau `THANG` (Report 7). */
export const BAC_REPORT_TIEP = THANG.length + 1;
/** Ngoài thang (V4-9): luôn cần QL, KHÔNG đẩy bậc (T28, M-11). WL 3 nằm ở đây từ 02/10. */
export const NGOAI_THANG = ['wl_3', 'meeting_cx', 'suspension', 'other'] as const;
export const MEASURE_KINDS = [...THANG, ...NGOAI_THANG] as const;
export type MeasureKind = (typeof MEASURE_KINDS)[number];
export const MEASURE_KIND_LABEL: Record<MeasureKind, string> = {
  report_1: 'Report 1', report_2: 'Report 2', wl_1: 'WL 1', report_4_meeting: 'Report 4 + Meeting CX/GĐCN', report_5: 'Report 5', wl_2: 'WL 2',
  wl_3: 'WL 3', meeting_cx: 'Meeting CX/GĐCN', suspension: 'Đình chỉ học tạm thời', other: 'Khác',
};

/** `report_7`, `report_8`… (sau WL 2) → số; loại khác → 0. Số < 7 không hợp lệ (đã có trong `THANG`). */
const soReportTiep = (kind: string): number => {
  const m = /^report_(\d+)$/.exec(kind);
  return m && Number(m[1]) >= BAC_REPORT_TIEP ? Number(m[1]) : 0;
};

/** `kind` của một bậc (≥ 1): trong thang → tên cố định; sau WL 2 → `report_{bậc}`. */
export function kindCuaBac(bac: number): string {
  return bac <= THANG.length ? THANG[bac - 1] : `report_${bac}`;
}

/** Tên một lần xử lý. `Khác` có tên riêng thì dùng tên riêng. Loại lạ (dòng cũ còn sót trong DB thử — Q2) → `Xử lý (loại cũ)`. */
export function nhanLoaiXuLy(kind: string, customName?: string | null): string {
  if (kind === 'other' && customName?.trim()) return customName.trim();
  if (kind === 'report_tiep') return `Report ${BAC_REPORT_TIEP} trở lên`;
  const n = soReportTiep(kind);
  if (n) return `Report ${n}`;
  return (MEASURE_KIND_LABEL as Record<string, string>)[kind] ?? 'Xử lý (loại cũ)';
}

/**
 * Khoá thống kê "theo loại" (Excel, `bien-phap-theo-loai`): mười loại + `report_tiep` (gộp Report 7 trở lên) + `loai-cu` cho dòng lạ
 * của dữ liệu cũ (Q2) — để tổng các loại luôn bằng tổng chỉ số.
 */
export const KHOA_LOAI_XU_LY = [...MEASURE_KINDS, 'report_tiep', 'loai-cu'] as const;
export type KhoaLoaiXuLy = (typeof KHOA_LOAI_XU_LY)[number];
export function khoaLoaiXuLy(kind: string): KhoaLoaiXuLy {
  if (soReportTiep(kind)) return 'report_tiep';
  return (MEASURE_KINDS as readonly string[]).includes(kind) ? (kind as MeasureKind) : 'loai-cu';
}

/** Bậc (≥ 1) của một loại trong thang, kể cả Report 7+; 0 khi ngoài thang hoặc loại lạ. */
export function bacCuaLoai(kind: string): number {
  const i = (THANG as readonly string[]).indexOf(kind);
  return i >= 0 ? i + 1 : soReportTiep(kind);
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

/**
 * PR-S3 (G-030): chữ "bậc" của em ở Phân tích Ý thức và ô Ý thức. Có bậc trên thang (kể cả bậc khai trước khi dùng web) → tên bậc; chưa có bậc nhưng đã bị
 * xử lý NGOÀI thang (Đình chỉ, Meeting CX/GĐCN, Khác) → lần xử lý đó; không có gì → `null` (màn ghi "Chưa xử lý lần nào").
 */
export function bacHoacNgoaiThang(bac: number, xuLy: readonly { kind: string; status: string; performedOn: string | null; customName?: string | null }[]): string | null {
  if (bac > 0) return nhanLoaiXuLy(kindCuaBac(bac));
  const ngoai = xuLy.filter((m) => m.status === 'done' && (NGOAI_THANG as readonly string[]).includes(m.kind))
    .sort((a, c) => (c.performedOn ?? '').localeCompare(a.performedOn ?? ''))[0];
  return ngoai ? nhanLoaiXuLy(ngoai.kind, ngoai.customName) : null;
}

/** Bậc kế tiếp — không bao giờ hết thang: sau WL 2 là Report 7, 8… (02/10). WL 3 và phương án khác chỉ qua đề xuất QL. */
export function bacKeTiep(bac: number): { kind: string; bac: number } {
  const b = Math.max(0, bac);
  return { kind: kindCuaBac(b + 1), bac: b + 1 };
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
 * MỘT DÒNG THANG: sáu bậc của mạch chính + Report 7 (luôn hiện, để thấy thang còn đi tiếp) và thêm một ô cho mỗi bậc em đã vượt
 * qua WL 2. Mỗi bậc một trạng thái — `qua` (đã xử lý trên web) · `khai` (khai trước khi dùng web, H5) · `lan-nay` (bậc kế tiếp) · `sau`.
 */
export function dongThang(bac: number, khai: { bac: number } | null): {
  kind: string; nhan: string; trangThai: 'qua' | 'khai' | 'lan-nay' | 'sau';
}[] {
  const tong = Math.max(BAC_REPORT_TIEP, bac + 1);
  return Array.from({ length: tong }, (_, i) => {
    const b = i + 1;
    const kind = kindCuaBac(b);
    const trangThai = b <= bac ? (khai && b <= khai.bac ? 'khai' : 'qua') : b === bac + 1 ? 'lan-nay' : 'sau';
    return { kind, nhan: nhanLoaiXuLy(kind), trangThai };
  });
}
