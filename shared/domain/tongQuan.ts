/**
 * LUẬT THUẦN CỦA TỔNG QUAN (PR-Pa, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10).
 *
 * Nằm ở `shared` để harness máy chủ kiểm được (web không có bộ kiểm thử) và để máy chủ lẫn giao diện đọc CÙNG một bảng:
 * chương trình đang chọn, 4 nhóm việc của GV, thứ tự dòng Cần xử lý, luật chọn Điểm đáng chú ý.
 * Không có con số nào được tính ở đây — số luôn đến từ `metricSet` (hợp đồng số liệu luật 1).
 */
import type { DeadlineKind } from './display.ts';
import type { LoaiBoQuen } from './phanTich.ts';

// ------------------------------------------------------------------ chương trình
/* PR-Pb2-a (Q31-1, T60): chỉ còn hai khung, FT trước. Nút "Cả hai" đã bỏ — khối không theo kỹ năng gộp bằng `null`. */
export const CHUONG_TRINH = ['ft', 'thuong'] as const;
export type ChuongTrinh = (typeof CHUONG_TRINH)[number];
export const CHUONG_TRINH_LABEL: Record<ChuongTrinh, string> = { ft: 'Fast Track', thuong: 'Lớp thường' };

/** Q31-1: tham số `ct` vắng / lạ / giá trị của link cũ (đã bỏ "Cả hai") → `macDinh` (Quản lý: FT). */
export function chuongTrinhTuThamSo(s: string | null | undefined, macDinh: ChuongTrinh = 'ft'): ChuongTrinh {
  return s === 'thuong' || s === 'ft' ? s : macDinh;
}
/** Khối gộp (Ý thức, lịch, hồ sơ GV): `ct` hợp lệ → lọc, vắng / lạ → `null` = không lọc khung. */
export function ctTuyChon(s: string | null | undefined): ChuongTrinh | null {
  return s === 'thuong' || s === 'ft' ? s : null;
}
/** Chuỗi gắn vào URL; `null` (khối gộp) → rỗng. */
export const thamSoCt = (ct: ChuongTrinh | null, dau: '?' | '&' = '&'): string => (ct ? `${dau}ct=${ct}` : '');

// ------------------------------------------------------------------ 4 nhóm việc của GV (§3.2)
export const NHOM_VIEC = ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'] as const;
export type NhomViec = (typeof NHOM_VIEC)[number];
export const NHOM_VIEC_LABEL: Record<NhomViec, string> = {
  'cham-diem': 'Chấm điểm', 'case-hoc-thuat': 'Case học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'van-hanh': 'Vận hành',
};
/** Loại việc của `mywork.ts` → 4 nhóm (PR-DUYET bỏ `decide`, `decide_move` — thẻ ở hộp Chờ duyệt). PR-YT4: ba loại việc Ý thức có hạn thật; Phối hợp SOS vẫn là nhắc mềm. */
const NHOM_CUA_LOAI: Record<string, NhomViec> = {
  score: 'cham-diem',
  cause: 'case-hoc-thuat', xac_nhan_pa: 'case-hoc-thuat', ke_hoach_bo_tro: 'case-hoc-thuat', phoi_hop: 'case-hoc-thuat', mini_test: 'case-hoc-thuat', no_plan: 'case-hoc-thuat', result: 'case-hoc-thuat',
  do_plan: 'case-hoc-thuat', no_owner: 'case-hoc-thuat',
  placement: 'van-hanh', next_step: 'van-hanh', mgmt: 'van-hanh', missing_data: 'van-hanh',
  yt_xu_ly: 'y-thuc', yt_xem: 'y-thuc', yt_thuc_hien: 'y-thuc',
  ban_giao: 'van-hanh',   // PR-CT (Q19): thuộc nhóm hiển thị Vận hành có sẵn
};
export function nhomViecCua(loai: string): NhomViec { return NHOM_CUA_LOAI[loai] ?? 'van-hanh'; }

/** Loại hạn của từng loại việc — để dòng việc hiện hạn qua `<Han>` (G-10). Loại không có ở đây: hạn là ngày trơn. */
export const LOAI_HAN_CUA_VIEC: Partial<Record<string, DeadlineKind>> = {
  cause: 'xac-minh-sos', xac_nhan_pa: 'xac-minh-sos', ke_hoach_bo_tro: 'ke-hoach-bo-tro', mini_test: 'mini-test', no_plan: 'lap-pa', result: 'cap-nhat-pa', score: 'nhap-diem',
  yt_xu_ly: 'xu-ly-vi-pham', yt_xem: 'xu-ly-vi-pham', yt_thuc_hien: 'xu-ly-vi-pham',
  ban_giao: 'viec-van-hanh',
};

export type ViecGom = { group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null };
export type NhomViecXem<T> = {
  key: NhomViec; label: string; items: T[];
  /** Số việc (nhóm Ý thức & Phối hợp: việc Ý thức + số dòng nhắc Phối hợp SOS). */
  n: number; quaHan: number; homNay: number;
  /** Nhóm có việc quá hạn tự mở (§3.2). PR-YT4: Ý thức có hạn thật nên cũng tự mở khi quá hạn (bỏ luật W02). */
  moSan: boolean;
};
export function gomNhomViec<T extends ViecGom>(items: T[], soNhacYThuc = 0): NhomViecXem<T>[] {
  const w = (u: ViecGom['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
  return NHOM_VIEC.map((key) => {
    const list = items.filter((i) => nhomViecCua(i.group) === key)
      .sort((a, b) => w(a.urgency) - w(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
    const quaHan = list.filter((i) => i.urgency === 'overdue').length;
    return {
      key, label: NHOM_VIEC_LABEL[key], items: list,
      n: list.length + (key === 'y-thuc' ? soNhacYThuc : 0),
      quaHan, homNay: list.filter((i) => i.urgency === 'today').length,
      moSan: quaHan > 0,
    };
  }).filter((g) => g.n > 0);
}

// ------------------------------------------------------------------ Cần xử lý (Quản lý)
export type MaCanXuLy =
  | 'case-xac-dinh-nguyen-nhan-qua-han' | 'pa-cho-duyet' | 'case-chua-co-nguoi-phu-trach'
  | 'case-thieu-pa' | 'pa-can-cap-nhat' | 'bai-qua-han-nhap-diem' | 'hv-can-xu-ly'
  | 'hv-can-ho-tro-2-lan-chua-case';

/**
 * MỖI DÒNG LÀ MỘT CHỈ SỐ TRONG SỔ — bấm số hay bấm nút đều mở đúng tập đó (G-10).
 * Thứ tự theo design plan §4.1: quá hạn xác minh/duyệt → thiếu người phụ trách → thiếu PA → thiếu kết quả; hai dòng
 * cuối là bài quá hạn nhập điểm và vi phạm để lâu. `mau`: đỏ = quá hạn, vàng = đang chờ người quyết, xanh = nhắc.
 */
export const CAN_XU_LY: readonly {
  metricId: MaCanXuLy; nhan: string; nut: 'Mở' | 'Xem' | 'Duyệt'; mau: 'do' | 'vang' | 'xanh'; canQuyenDuyet?: true;
  /** PR-UX4: nút Xem mở Danh sách Case với bộ lọc `hang-doi=<denLoc>` (Phân tích › Danh sách Case), không mở ngăn số. */
  denLoc?: LoaiBoQuen;
}[] = [
  /* PR-DUYET (K1-01): "PA chờ Quản lý duyệt" và "Case quá hạn xác định nguyên nhân" không còn ở đây — chúng là thẻ ở hộp Chờ duyệt
     (dải "Chờ duyệt n · k quá hạn · Báo lên m" trên đầu khối). Hai chỉ số vẫn sống cho Phân tích / branch-pulse. */
  { metricId: 'case-chua-co-nguoi-phu-trach', nhan: 'Case chưa có người phụ trách', nut: 'Xem', mau: 'vang' },
  { metricId: 'hv-can-ho-tro-2-lan-chua-case', nhan: 'học viên cần hỗ trợ 2 lần Test liền, chưa có Case mở', nut: 'Xem', mau: 'vang', denLoc: 'can-ho-tro-2-lan' },
  { metricId: 'case-thieu-pa', nhan: 'Case thiếu PA học thuật', nut: 'Xem', mau: 'vang' },
  { metricId: 'pa-can-cap-nhat', nhan: 'PA học thuật quá hạn cập nhật', nut: 'Xem', mau: 'do' },
  { metricId: 'bai-qua-han-nhap-diem', nhan: 'bài chưa nhập điểm quá hạn', nut: 'Xem', mau: 'do' },
  /* PR-YT4 (giao kèo #117): "vi phạm quá 5 ngày chưa xử lý" nay là thẻ Báo lên `bao_len_y_thuc` ở hộp Chờ duyệt. Chỉ số `hv-can-xu-ly` vẫn sống. */
];
export const CAN_XU_LY_TOI_DA = 10;
export type DongCanXuLyGoc = {
  metricId: MaCanXuLy; n: number; nhan: string; nut: 'Mở' | 'Xem' | 'Duyệt'; mau: 'do' | 'vang' | 'xanh'; denLoc?: LoaiBoQuen;
};
export function sapCanXuLy(dem: Partial<Record<MaCanXuLy, number>>, coQuyenDuyet: boolean): DongCanXuLyGoc[] {
  return CAN_XU_LY
    .filter((x) => (dem[x.metricId] ?? 0) > 0 && (!x.canQuyenDuyet || coQuyenDuyet))
    .slice(0, CAN_XU_LY_TOI_DA)
    .map((x) => ({ metricId: x.metricId, n: dem[x.metricId]!, nhan: x.nhan, nut: x.nut, mau: x.mau, ...(x.denLoc ? { denLoc: x.denLoc } : {}) }));
}

// ------------------------------------------------------------------ Điểm đáng chú ý (Quản lý)
export const NGUONG_DANG_CHU_Y = { hvToiThieu: 3, mauToiThieu: 5, dungHanDuoi: 0.8, toiDa: 3 } as const;
export type UngVienChuY = {
  loai: 'mon-duoi-ky-vong' | 'pa-cai-thien' | 'dung-han';
  metricId: string; extra?: Record<string, string>;
  /** Tử số và mẫu số lấy từ chỉ số (`n` / `denominator` hoặc `numerator` / `n`). */
  tu: number; mau: number; nhanMon?: string;
};
export type DiemChuY = {
  loai: UngVienChuY['loai']; metricId: string; extra?: Record<string, string>;
  cau: string; lienKet: string;
  /** Số dòng panel sẽ mở — phải bằng độ dài tập ID của chỉ số (kiểm ở phép kiểm máy chủ). */
  soDanhSach: number;
};
/** Ba luật (plan PR-Pa Q6). Mỗi điểm có số và một link mở đúng tập tạo ra số đó. */
export function chonDiemDangChuY(ds: UngVienChuY[], ct: ChuongTrinh): DiemChuY[] {
  const N = NGUONG_DANG_CHU_Y;
  const out: DiemChuY[] = [];
  /* MH5: "môn dưới kỳ vọng" là câu của khung Fast Track — Lớp thường không có câu này. */
  const mon = ct !== 'ft' ? undefined : ds.filter((x) => x.loai === 'mon-duoi-ky-vong' && x.tu >= N.hvToiThieu && x.mau > 0)
    .sort((a, b) => b.tu / b.mau - a.tu / a.mau || b.tu - a.tu)[0];
  if (mon) {
    out.push({ loai: mon.loai, metricId: mon.metricId, extra: mon.extra,
      cau: `${mon.nhanMon}: ${mon.tu}/${mon.mau} học viên dưới kỳ vọng`,
      lienKet: `xem ${mon.tu} học viên`, soDanhSach: mon.tu });
  }
  const pa = ds.find((x) => x.loai === 'pa-cai-thien' && x.mau >= N.mauToiThieu);
  if (pa) {
    out.push({ loai: pa.loai, metricId: pa.metricId, extra: pa.extra,
      cau: `${pa.tu}/${pa.mau} PA học thuật đã kết thúc có cải thiện`, lienKet: `xem ${pa.mau} PA học thuật`, soDanhSach: pa.mau });
  }
  const dh = ds.find((x) => x.loai === 'dung-han' && x.mau >= N.mauToiThieu && x.tu / x.mau < N.dungHanDuoi);
  if (dh) {
    out.push({ loai: dh.loai, metricId: dh.metricId, extra: dh.extra,
      cau: `${dh.tu}/${dh.mau} lần cập nhật PA đúng hạn (30 ngày qua)`, lienKet: `xem ${dh.mau} lần`, soDanhSach: dh.mau });
  }
  return out.slice(0, N.toiDa);
}

// ------------------------------------------------------------------ bảng Theo chi nhánh (mockup 02 phương án A)
export const COT_BANG = ['hocVien', 'duoiKyVong', 'sos', 'caseMo', 'thieuPa', 'duDuLieu'] as const;
export type CotBang = (typeof COT_BANG)[number];
export const COT_BANG_DON_VI: Record<CotBang, 'hoc-vien' | 'case'> = {
  hocVien: 'hoc-vien', duoiKyVong: 'hoc-vien', sos: 'hoc-vien', caseMo: 'case', thieuPa: 'case', duDuLieu: 'hoc-vien',
};
