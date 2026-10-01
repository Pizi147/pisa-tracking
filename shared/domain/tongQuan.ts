/**
 * LUẬT THUẦN CỦA TỔNG QUAN (PR-Pa, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10).
 *
 * Nằm ở `shared` để harness máy chủ kiểm được (web không có bộ kiểm thử) và để máy chủ lẫn giao diện đọc CÙNG một bảng:
 * chương trình đang chọn, 4 nhóm việc của GV, thứ tự dòng Cần xử lý, luật chọn Điểm đáng chú ý.
 * Không có con số nào được tính ở đây — số luôn đến từ `metricSet` (hợp đồng số liệu luật 1).
 */
import type { DeadlineKind } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { tuanKetQuaCuaHan } from './week.ts';

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
/** T75 (PR-VAI-a Q13): "Ý thức" (Phối hợp SOS nay là việc thật ở Case học thuật), "Lớp & vận hành". */
export const NHOM_VIEC_LABEL: Record<NhomViec, string> = {
  'cham-diem': 'Chấm điểm', 'case-hoc-thuat': 'Case học thuật', 'y-thuc': 'Ý thức', 'van-hanh': 'Lớp & vận hành',
};
/**
 * Loại việc của `mywork.ts` → 4 nhóm (PR-DUYET bỏ `decide`, `decide_move` — thẻ ở hộp Chờ duyệt). PR-YT4: ba loại việc Ý thức có hạn thật.
 * PR-VAI-a: `result` → `ghi_ket_qua_pa` (V3); bỏ `next_step` (Q27); Phối hợp SOS thành việc thật `phoi_hop_sos` (K5-10); `khai_bac`, `ky_vong_dau_ra` mới.
 */
const NHOM_CUA_LOAI: Record<string, NhomViec> = {
  score: 'cham-diem',
  cause: 'case-hoc-thuat', xac_nhan_pa: 'case-hoc-thuat', ke_hoach_bo_tro: 'case-hoc-thuat', phoi_hop: 'case-hoc-thuat', mini_test: 'case-hoc-thuat', no_plan: 'case-hoc-thuat', ghi_ket_qua_pa: 'case-hoc-thuat',
  do_plan: 'case-hoc-thuat', no_owner: 'case-hoc-thuat', phoi_hop_sos: 'case-hoc-thuat',
  placement: 'van-hanh', mgmt: 'van-hanh', missing_data: 'van-hanh', ky_vong_dau_ra: 'van-hanh',
  yt_xu_ly: 'y-thuc', yt_xem: 'y-thuc', yt_thuc_hien: 'y-thuc', khai_bac: 'y-thuc',
  ban_giao: 'van-hanh',   // PR-CT (Q19): thuộc nhóm hiển thị Vận hành có sẵn
};
export function nhomViecCua(loai: string): NhomViec { return NHOM_CUA_LOAI[loai] ?? 'van-hanh'; }

/** Loại hạn của từng loại việc — để dòng việc hiện hạn qua `<Han>` (G-10). Loại không có ở đây: hạn là ngày trơn. */
export const LOAI_HAN_CUA_VIEC: Partial<Record<string, DeadlineKind>> = {
  cause: 'xac-minh-sos', xac_nhan_pa: 'xac-minh-sos', ke_hoach_bo_tro: 'ke-hoach-bo-tro', mini_test: 'mini-test', no_plan: 'lap-pa', ghi_ket_qua_pa: 'cap-nhat-pa', score: 'nhap-diem',
  yt_xu_ly: 'xu-ly-vi-pham', yt_xem: 'xu-ly-vi-pham', yt_thuc_hien: 'xu-ly-vi-pham',
  ban_giao: 'viec-van-hanh',
};

export type ViecGom = { group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null };
export type NhomViecXem<T> = {
  key: NhomViec; label: string; items: T[];
  /** Số việc — mọi số đếm từ `items` (PR-VAI-a: không còn dòng nhắc mềm cộng tay). */
  n: number; quaHan: number; homNay: number;
  /** Nhóm có việc quá hạn tự mở (§3.2). PR-YT4: Ý thức có hạn thật nên cũng tự mở khi quá hạn (bỏ luật W02). */
  moSan: boolean;
};
export function gomNhomViec<T extends ViecGom>(items: T[]): NhomViecXem<T>[] {
  const w = (u: ViecGom['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
  return NHOM_VIEC.map((key) => {
    const list = items.filter((i) => nhomViecCua(i.group) === key)
      .sort((a, b) => w(a.urgency) - w(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
    const quaHan = list.filter((i) => i.urgency === 'overdue').length;
    return {
      key, label: NHOM_VIEC_LABEL[key], items: list,
      n: list.length,
      quaHan, homNay: list.filter((i) => i.urgency === 'today').length,
      moSan: quaHan > 0,
    };
  }).filter((g) => g.n > 0);
}

// ------------------------------------------------------------------ Cần xử lý (Quản lý)
export type MaCanXuLy =
  | 'bai-qua-han-nhap-diem' | 'pa-can-cap-nhat'
  | 'van-hanh-can-quyet-dinh' | 'hv-chua-co-lenh-chuyen' | 'lop-thieu-gv-mon' | 'hv-ft-xong-mt-cuoi-chua-mt-ke' | 'hv-len-ft-chua-ky-vong';
/** Nhãn trạng thái một dòng Cần xử lý (§7.3) — chữ, không chấm màu. */
export type TrangThaiCanXuLy = 'qua-han' | 'can-lam';

/**
 * MỖI DÒNG LÀ MỘT CHỈ SỐ TRONG SỔ — bấm số hay bấm nút đều mở đúng tập đó (G-10). Cần xử lý GỘP HAI KHUNG (PR-VAI-a Q5).
 * PR-DUYET (K1-01) + PR-VAI-a Q3: việc Quản lý tự quyết (Case chờ nguyên nhân quá hạn, PA chờ duyệt, vi phạm quá 5 ngày) chỉ là thẻ
 * ở hộp Chờ duyệt, không lặp ở đây. PR-VAI-a Q7: bỏ "2 lần Test liền, chưa có Case" (K1-04) và "Case thiếu PA học thuật"; Q6: "Case
 * chưa có người phụ trách" đổi thành gốc của nó — lớp thiếu GV môn (nút Sửa phân công).
 */
export const CAN_XU_LY: readonly {
  metricId: MaCanXuLy; nhan: string; nut: string;
  /** Việc chính người xem (Quản lý) phải làm — cột Người giữ việc ghi "Bạn" (Q4). Còn lại là việc giáo viên đang trễ. */
  cuaNguoiXem: boolean;
  /** Tập của chỉ số là việc ĐÃ quá hạn theo định nghĩa (bài quá hạn nhập, PA quá hạn ghi kết quả). */
  quaHan?: true;
  canQuyenDuyet?: true;
}[] = [
  { metricId: 'bai-qua-han-nhap-diem', nhan: 'bài chưa nhập điểm quá hạn', nut: 'Xem và nhắc', cuaNguoiXem: false, quaHan: true },
  { metricId: 'pa-can-cap-nhat', nhan: 'PA chưa ghi kết quả', nut: 'Xem và nhắc', cuaNguoiXem: false, quaHan: true },
  /* PR-VAI-a Q8: bốn việc "của Bạn" — mỗi dòng một chỉ số gọi đúng hàm màn khác đang dùng. */
  { metricId: 'van-hanh-can-quyet-dinh', nhan: 'việc Vận hành cần quyết định', nut: 'Mở Vận hành', cuaNguoiXem: true },
  { metricId: 'hv-chua-co-lenh-chuyen', nhan: 'em chưa có quyết định chuyển lớp', nut: 'Mở chuyển lớp', cuaNguoiXem: true },
  { metricId: 'lop-thieu-gv-mon', nhan: 'lớp thiếu GV môn', nut: 'Sửa phân công', cuaNguoiXem: true },
  { metricId: 'hv-ft-xong-mt-cuoi-chua-mt-ke', nhan: 'học viên FT xong MT3, chưa có MT kế tiếp', nut: 'Kế hoạch Test', cuaNguoiXem: true },
  { metricId: 'hv-len-ft-chua-ky-vong', nhan: 'học viên lên FT chưa đánh dấu kỳ vọng đầu ra', nut: 'Mở hồ sơ', cuaNguoiXem: true },
];
export const CAN_XU_LY_TOI_DA = 10;
export type DongCanXuLyGoc = {
  metricId: MaCanXuLy; n: number; nhan: string; nut: string; cuaNguoiXem: boolean; trangThai: TrangThaiCanXuLy;
};
/**
 * Dòng có số > 0, sắp QUÁ HẠN lên đầu, rồi việc giáo viên đang trễ trước việc của Bạn, rồi theo thứ tự bảng (mockup 23 màn B).
 * `quaHan`: dòng không quá hạn theo định nghĩa nhưng có phần tử đã qua hạn (Vận hành) — máy chủ tính từ CÙNG tập.
 */
export function sapCanXuLy(dem: Partial<Record<MaCanXuLy, number>>, coQuyenDuyet: boolean, quaHan: Partial<Record<MaCanXuLy, boolean>> = {}): DongCanXuLyGoc[] {
  return CAN_XU_LY
    .filter((x) => (dem[x.metricId] ?? 0) > 0 && (!x.canQuyenDuyet || coQuyenDuyet))
    .map((x, i) => ({
      i, dong: {
        metricId: x.metricId, n: dem[x.metricId]!, nhan: x.nhan, nut: x.nut, cuaNguoiXem: x.cuaNguoiXem,
        trangThai: (x.quaHan || quaHan[x.metricId] ? 'qua-han' : 'can-lam') as TrangThaiCanXuLy,
      },
    }))
    .sort((a, b) => (a.dong.trangThai === 'qua-han' ? 0 : 1) - (b.dong.trangThai === 'qua-han' ? 0 : 1)
      || Number(a.dong.cuaNguoiXem) - Number(b.dong.cuaNguoiXem) || a.i - b.i)
    .slice(0, CAN_XU_LY_TOI_DA)
    .map((x) => x.dong);
}

/**
 * Q25: "tuần W4 SEP" — tuần KẾT QUẢ của hạn ghi kết quả cũ nhất (hạn = hết Thứ Hai tuần sau tuần kết quả). Một chỗ cho dòng Cần xử lý và ô số.
 */
export function tuanCuaHanGhiKetQua(han: string, homNay: string): string {
  return `tuần ${tuanLich(tuanKetQuaCuaHan(han), homNay)}`;
}

/** Cột Người giữ việc (Q4): "Bạn", hoặc "n giáo viên" + tên sắp theo tên, quá 3 thì "+k". */
export function nguoiGiuViecChu(ten: readonly string[]): { dau: string; phu: string } {
  const ds = [...new Set(ten)].sort((a, b) => a.localeCompare(b, 'vi'));
  if (!ds.length) return { dau: 'chưa phân công', phu: '' };
  return { dau: `${ds.length} giáo viên`, phu: [...ds.slice(0, 3), ...(ds.length > 3 ? [`+${ds.length - 3}`] : [])].join(' · ') };
}

// ------------------------------------------------------------------ Điểm đáng chú ý (Quản lý)
export const NGUONG_DANG_CHU_Y = { hvToiThieu: 3, mauToiThieu: 5, dungHanDuoi: 0.8, toiDa: 3 } as const;
export type UngVienChuY = {
  loai: 'mon-duoi-ky-vong' | 'lop-chua-dat' | 'pa-cai-thien' | 'dung-han';
  metricId: string; extra?: Record<string, string>;
  /** Tử số và mẫu số lấy từ chỉ số (`n` / `denominator` hoặc `numerator` / `n`). */
  tu: number; mau: number;
  /** Tên môn (FT) hoặc tên chương trình (lớp thường: "FOU"). */
  nhanMon?: string;
  /** Lớp thường: tên bài khi MỌI em trong câu cùng một loại bài ("Giữa khoá"); không thì "ở bài gần nhất". */
  tenBai?: string | null;
};
export type DiemChuY = {
  loai: UngVienChuY['loai']; metricId: string; extra?: Record<string, string>;
  /** Nhãn chữ thay chấm màu (Q11). */
  muc: 'can-chu-y' | 'tot';
  cau: string; lienKet: string;
  /** Số dòng panel sẽ mở — phải bằng độ dài tập ID của chỉ số (kiểm ở phép kiểm máy chủ). */
  soDanhSach: number;
};
/** Ba luật (plan PR-Pa Q6) + câu lớp thường theo chương trình (PR-VAI-a Q11). Mỗi điểm có số và một link mở đúng tập tạo ra số đó. */
export function chonDiemDangChuY(ds: UngVienChuY[], ct: ChuongTrinh): DiemChuY[] {
  const N = NGUONG_DANG_CHU_Y;
  const out: DiemChuY[] = [];
  const nhieuNhat = (loai: UngVienChuY['loai']) => ds.filter((x) => x.loai === loai && x.tu >= N.hvToiThieu && x.mau > 0)
    .sort((a, b) => b.tu / b.mau - a.tu / a.mau || b.tu - a.tu)[0];
  /* MH5: "môn dưới kỳ vọng" là câu của khung Fast Track — Lớp thường không trộn môn hai khung; lớp thường nói theo chương trình. */
  const mon = ct === 'ft' ? nhieuNhat('mon-duoi-ky-vong') : undefined;
  if (mon) {
    out.push({ loai: mon.loai, metricId: mon.metricId, extra: mon.extra, muc: 'can-chu-y',
      cau: `${mon.nhanMon}: ${mon.tu}/${mon.mau} học viên dưới kỳ vọng`,
      lienKet: `xem ${mon.tu} học viên`, soDanhSach: mon.tu });
  }
  const lop = ct === 'thuong' ? nhieuNhat('lop-chua-dat') : undefined;
  if (lop) {
    out.push({ loai: lop.loai, metricId: lop.metricId, extra: lop.extra, muc: 'can-chu-y',
      cau: `${lop.nhanMon}: ${lop.tu}/${lop.mau} học viên chưa đạt ${lop.tenBai ?? 'ở bài gần nhất'}`,
      lienKet: `xem ${lop.tu} học viên`, soDanhSach: lop.tu });
  }
  const pa = ds.find((x) => x.loai === 'pa-cai-thien' && x.mau >= N.mauToiThieu);
  if (pa) {
    out.push({ loai: pa.loai, metricId: pa.metricId, extra: pa.extra, muc: pa.tu / pa.mau >= 0.5 ? 'tot' : 'can-chu-y',
      cau: `${pa.tu}/${pa.mau} PA học thuật đã kết thúc có cải thiện`, lienKet: `xem ${pa.mau} PA học thuật`, soDanhSach: pa.mau });
  }
  const dh = ds.find((x) => x.loai === 'dung-han' && x.mau >= N.mauToiThieu && x.tu / x.mau < N.dungHanDuoi);
  if (dh) {
    out.push({ loai: dh.loai, metricId: dh.metricId, extra: dh.extra, muc: 'can-chu-y',
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
