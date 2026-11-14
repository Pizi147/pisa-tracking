/**
 * LUẬT THUẦN CỦA TỔNG QUAN (PR-Pa, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10).
 *
 * Nằm ở `shared` để harness máy chủ kiểm được (web không có bộ kiểm thử) và để máy chủ lẫn giao diện đọc CÙNG một bảng:
 * chương trình đang chọn, 4 nhóm việc của GV, thứ tự dòng Cần xử lý, luật chọn Điểm đáng chú ý.
 * Không có con số nào được tính ở đây — số luôn đến từ `metricSet` (hợp đồng số liệu luật 1).
 */
import { kyGhiKetQua, type DeadlineKind } from './display.ts';
import { t } from '../i18n/index.ts';
import { KHOA_CHAM_SPEAKING, laViecChamCheo } from './gopViec.ts';

// ------------------------------------------------------------------ chương trình
/* PR-Pb2-a (Q31-1, T60): chỉ còn hai khung, FT trước. Nút "Cả hai" đã bỏ — khối không theo kỹ năng gộp bằng `null`. */
export const CHUONG_TRINH = ['ft', 'thuong'] as const;
export type ChuongTrinh = (typeof CHUONG_TRINH)[number];
export const CHUONG_TRINH_LABEL: Record<ChuongTrinh, string> = { ft: 'Fast Track', thuong: t('Lớp thường') };

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
  'cham-diem': t('Chấm điểm'), 'case-hoc-thuat': t('Case học thuật'), 'y-thuc': t('Ý thức & Phối hợp'), 'van-hanh': t('Vận hành'),
};
/**
 * Loại việc của `mywork.ts` → 4 nhóm (PR-DUYET bỏ `decide`, `decide_move` — thẻ ở hộp Chờ duyệt). PR-YT4: ba loại việc Ý thức có hạn thật.
 * PR-VAI-a: `result` → `ghi_ket_qua_pa` (V3); bỏ `next_step` (Q27); Phối hợp SOS thành việc thật `phoi_hop_sos` (K5-10); `khai_bac`, `ky_vong_dau_ra` mới.
 */
const NHOM_CUA_LOAI: Record<string, NhomViec> = {
  score: 'cham-diem',
  cause: 'case-hoc-thuat', ghi_nhan_xet: 'case-hoc-thuat', xac_nhan_pa: 'case-hoc-thuat', xem_nx_s: 'case-hoc-thuat', mini_test: 'case-hoc-thuat', no_plan: 'case-hoc-thuat', ghi_ket_qua_pa: 'case-hoc-thuat',
  /* PHOI-HOP-V2 (mockup #1368): Phối hợp SOS sang tab "Ý thức & Phối hợp". */
  do_plan: 'case-hoc-thuat', no_owner: 'case-hoc-thuat', phoi_hop_sos: 'y-thuc', phoi_hop_tvv: 'y-thuc',
  /* GD-4a (chủ SP 14/11 "tất nhiên nó phải ở ý thức phối hợp rồi"): "Báo PH kết quả Test" sang tab Ý thức & Phối hợp — badge tab, chip Ý thức, hồ sơ GV cùng hàm này. */
  phoi_hop: 'y-thuc',
  mgmt: 'van-hanh', missing_data: 'van-hanh', ky_vong_dau_ra: 'van-hanh', thi_that: 'van-hanh', buoc_tiep: 'van-hanh',
  yt_xu_ly: 'y-thuc', yt_xem: 'y-thuc', yt_thuc_hien: 'y-thuc', khai_bac: 'y-thuc', yt_hoi_tinh_hinh: 'y-thuc',
  ban_giao: 'van-hanh',   // PR-CT (Q19): thuộc nhóm hiển thị Vận hành có sẵn
  chot_len_ft: 'van-hanh',   // PR-MT0 → PR-LCb: Chốt lộ trình
  xet_lai_lo_trinh: 'van-hanh',   // PR-CL: Xét lại lộ trình
  xuat_bc_ph: 'van-hanh',   // BAO-CAO-PH b: Admin xuất báo cáo PH
  bao_cao_ph: 'van-hanh',   // LG-3 (chủ SP 20 ý 4): GV viết Báo cáo PH — tab Vận hành, mục "Báo cáo PH"
};
export function nhomViecCua(loai: string): NhomViec { return NHOM_CUA_LOAI[loai] ?? 'van-hanh'; }

/**
 * S11 (chủ SP 05/11, mockup `thiet-ke/v12/cong-viec.html` bảng D — thay SV-SO1 "Nhập điểm = số kỹ năng"): ĐƠN VỊ ĐẾM = MỘT DÒNG VIỆC NHÌN THẤY.
 * Nhận DÒNG hiển thị (`dong` sau `gopViecTheoLop`, chưa mở `con`): dòng gộp "Cả lớp" = 1 (không nhân kỹ năng × em); dòng gộp mà mọi việc là của MỘT em
 * được vẽ thành từng việc dưới tên em (`xepTheoEm`) nên đếm từng việc. Bài Speaking chấm chéo không là việc của ai (T03) → không đếm.
 * MỌI số việc (badge, Công việc, Tổng quan, hồ sơ GV / lớp) đi qua hàm này — cùng số mọi nơi. `canLamNgay` = quá hạn + hạn hôm nay (badge, ô "Của tôi").
 */
export type DongDem = { key: string; studentId: number | null; urgency: string; con?: readonly DongDem[] | null };
export const dongNhinThay = <T extends DongDem>(ds: readonly T[]): T[] =>
  ds.flatMap((d) => (d.con?.length && d.con.every((c) => c.studentId !== null && c.studentId === d.con![0].studentId) ? (d.con as T[]) : [d]));
export type DemDongViec = { n: number; quaHan: number; homNay: number; canLamNgay: number };
export function demDongViec(ds: readonly DongDem[]): DemDongViec {
  const la = dongNhinThay(ds).filter((x) => !laViecChamCheo(x));
  const quaHan = la.filter((x) => x.urgency === 'overdue').length, homNay = la.filter((x) => x.urgency === 'today').length;
  return { n: la.length, quaHan, homNay, canLamNgay: quaHan + homNay };
}

/** Loại hạn của từng loại việc — để dòng việc hiện hạn qua `<Han>` (G-10). Loại không có ở đây: hạn là ngày trơn. */
export const LOAI_HAN_CUA_VIEC: Partial<Record<string, DeadlineKind>> = {
  cause: 'xac-minh-sos', ghi_nhan_xet: 'xac-minh-sos', xac_nhan_pa: 'xac-minh-sos', mini_test: 'mini-test', no_plan: 'lap-pa', ghi_ket_qua_pa: 'cap-nhat-pa', score: 'nhap-diem',
  yt_xu_ly: 'xu-ly-vi-pham', yt_xem: 'xu-ly-vi-pham', yt_thuc_hien: 'xu-ly-vi-pham',
  ban_giao: 'viec-van-hanh', mgmt: 'viec-van-hanh', chot_len_ft: 'chot-len-ft', phoi_hop_sos: 'phoi-hop',
  thi_that: 'sau-thi', buoc_tiep: 'sau-thi',   // OV-13q
};

/**
 * UI-CV-TVV (mockup `thiet-ke/v5/tvv.html`): Công việc của TVV chia theo VIỆC của TVV, không theo 4 nhóm GV — Báo PH · Sau thi (KQ thi thật → bước tiếp) ·
 * Chốt ngày thi · Bổ sung hồ sơ. `missing_data` của TVV chỉ có Chốt ngày thi (máy chủ `NHOM_VIEC_TVV`).
 */
export const NHOM_CV_TVV = ['bao-ph', 'sau-thi', 'chot-ngay-thi', 'bo-sung'] as const;
export type NhomViecTvv = (typeof NHOM_CV_TVV)[number];
export const NHOM_CV_TVV_LABEL: Record<NhomViecTvv, string> = {
  'bao-ph': t('Báo PH'), 'sau-thi': t('Sau thi'), 'chot-ngay-thi': t('Chốt ngày thi'), 'bo-sung': t('Bổ sung hồ sơ'),
};
const NHOM_TVV_CUA_LOAI: Record<string, NhomViecTvv> = { bao_ph_yt: 'bao-ph', phoi_hop_tvv: 'bao-ph', thi_that: 'sau-thi', buoc_tiep: 'sau-thi', missing_data: 'chot-ngay-thi', bo_sung_ho_so: 'bo-sung' };
export const nhomViecTvvCua = (loai: string): NhomViecTvv => NHOM_TVV_CUA_LOAI[loai] ?? 'bo-sung';

export type ViecGom = { group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null; key?: string };
export type NhomViecXem<T> = {
  key: NhomViec | NhomViecTvv; label: string; items: T[];
  /** Số việc — mọi số đếm từ `items` (PR-VAI-a: không còn dòng nhắc mềm cộng tay). */
  n: number; quaHan: number; homNay: number;
  /** Nhóm có việc quá hạn tự mở (§3.2). PR-YT4: Ý thức có hạn thật nên cũng tự mở khi quá hạn (bỏ luật W02). */
  moSan: boolean;
};
export function gomNhomViec<T extends ViecGom>(items: T[], tvv = false): NhomViecXem<T>[] {
  const w = (u: ViecGom['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
  const cua: (g: string) => string = tvv ? nhomViecTvvCua : nhomViecCua;
  const nhan = (k: string) => (tvv ? NHOM_CV_TVV_LABEL[k as NhomViecTvv] : NHOM_VIEC_LABEL[k as NhomViec]);
  return (tvv ? NHOM_CV_TVV : NHOM_VIEC).map((key) => {
    const list = items.filter((i) => cua(i.group) === key)
      /* OV-14c: việc "Chấm Speaking · n bài" của GV Speaking đứng đầu nhóm (chủ SP 18/10). */
      .sort((a, b) => Number(b.key === KHOA_CHAM_SPEAKING) - Number(a.key === KHOA_CHAM_SPEAKING)
        || w(a.urgency) - w(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
    const quaHan = list.filter((i) => i.urgency === 'overdue').length;
    return {
      key, label: nhan(key), items: list,
      n: list.length,
      quaHan, homNay: list.filter((i) => i.urgency === 'today').length,
      moSan: quaHan > 0,
    };
  }).filter((g) => g.n > 0);
}

// ------------------------------------------------------------------ CV-TAB (chủ SP 06/11, mockup `thiet-ke/v17-nhap/`): Công việc chia TAB theo hạng mục
/**
 * Tab = nhóm việc sẵn có (`NHOM_VIEC` / TVV `NHOM_CV_TVV`), thứ tự cố định; bài Speaking chấm chéo (T03, không là việc của ai) là tab riêng
 * "Chấm Speaking" (chủ SP 14/11, lời 19 — thay "Speaking chấm chéo") ngay sau Chấm điểm. Web thêm tab "Chờ bạn duyệt" (thẻ duyệt, không phải dòng việc) ở đầu.
 */
export const TAB_CV = ['cham-diem', 'cham-cheo', 'case-hoc-thuat', 'y-thuc', 'van-hanh'] as const;
export const tabCuaViec = (it: { group: string; key: string }, tvv = false): string =>
  (tvv ? nhomViecTvvCua(it.group) : laViecChamCheo(it) ? 'cham-cheo' : nhomViecCua(it.group));
export const nhanTabCv = (k: string, tvv = false): string =>
  (k === 'cham-cheo' ? t('Chấm Speaking') : tvv ? NHOM_CV_TVV_LABEL[k as NhomViecTvv] ?? k : NHOM_VIEC_LABEL[k as NhomViec] ?? k);

/**
 * MỤC trong tab (chủ SP 06/11 "mô tả case, phương án, kết quả…"): mục theo LOẠI VIỆC, thứ tự `MUC_CV`; mục rỗng ẩn.
 * AUDIT-UI B4 (chủ SP 08/11): MỘT trục — không còn mục "Quá hạn" riêng; việc quá hạn lên đầu mục của nó (V11).
 * Chấm điểm chia theo loại bài (`kind` của việc Nhập điểm). Loại lạ → "Khác" (không bao giờ mất việc).
 */
const MUC_CV = [
  ['mock', t('Mock Test')], ['pf', t('Progress / Final Test')], ['cp', t('Checkpoint')], ['cham-cheo', t('Chấm Speaking')],
  ['mo-ta', t('Mô tả Case')], ['pa', t('Phương án')], ['kq-pa', t('Kết quả PA')], ['bao-ph', t('Báo PH')], ['vi-pham', t('Vi phạm')], ['tinh-hinh', t('Tình hình học tập')], ['phoi-hop', t('Phối hợp SOS')],
  /* GD-4b (PTA Plan 15/11): "Báo PH kết quả Test" của GVCN (không hạn) đứng SAU Phối hợp SOS — việc có hạn lên trước. Mục riêng, cùng tên "Báo PH":
     TVV giữ mục `bao-ph` (Báo PH vi phạm · tình hình) ở chỗ cũ, thứ tự tab Báo PH của TVV không đổi. */
  ['bao-ph-test', t('Báo PH')], ['phan-cong', t('Phân công')],
  ['ban-giao', t('Bàn giao')], ['sau-thi', t('Sau thi')], ['lo-trinh', t('Lộ trình')], ['chot-ngay', t('Chốt ngày thi')], ['thieu', t('Thiếu dữ liệu')],
  ['bo-sung', t('Bổ sung hồ sơ')], ['giao', t('Việc được giao')], ['bc-ph', t('Báo cáo PH')], ['khac', t('Khác')],
] as const;
type MaMuc = (typeof MUC_CV)[number][0];
const MUC_CUA_LOAI: Record<string, MaMuc> = {
  cause: 'mo-ta', ghi_nhan_xet: 'mo-ta', xem_nx_s: 'mo-ta',
  no_plan: 'pa', xac_nhan_pa: 'pa', do_plan: 'pa', mini_test: 'pa',
  ghi_ket_qua_pa: 'kq-pa', phoi_hop_sos: 'phoi-hop', phoi_hop_tvv: 'phoi-hop', phoi_hop: 'bao-ph-test', bao_ph_yt: 'bao-ph', no_owner: 'phan-cong',
  /* PHOI-HOP-V2 (mockup #1368 K1): việc Ý thức chung MỘT mục "Vi phạm" — tên dòng nói loại việc, không lặp tên mục. */
  yt_xu_ly: 'vi-pham', yt_xem: 'vi-pham', yt_thuc_hien: 'vi-pham', khai_bac: 'vi-pham', yt_hoi_tinh_hinh: 'tinh-hinh',
  ban_giao: 'ban-giao', thi_that: 'sau-thi', buoc_tiep: 'sau-thi', chot_len_ft: 'lo-trinh', xet_lai_lo_trinh: 'lo-trinh', ky_vong_dau_ra: 'lo-trinh',
  missing_data: 'thieu', bo_sung_ho_so: 'bo-sung', mgmt: 'giao', xuat_bc_ph: 'bc-ph', bao_cao_ph: 'bc-ph',
};
/** Mã mục của một việc (`MUC_CV`). */
export function mucCuaViec(it: { group: string; key: string; kind?: string | null }, tvv = false): MaMuc {
  if (laViecChamCheo(it)) return 'cham-cheo';
  if (it.group === 'score') return it.kind === 'progress' || it.kind === 'final' ? 'pf' : it.kind === 'checkpoint' ? 'cp' : 'mock';
  if (tvv && it.group === 'missing_data') return 'chot-ngay';   // việc `missing_data` của TVV chỉ có Chốt ngày thi
  return MUC_CUA_LOAI[it.group] ?? 'khac';
}

/**
 * Dòng NHÌN THẤY của một tab (cùng luật `xepTheoEm` / `dongNhinThay`): dòng gộp mà mọi việc là của MỘT em tách thành từng việc, trừ dòng làm cả dòng
 * (`caDong`: Xác nhận PA cùng lúc, Nhập điểm theo tuần). Số trên badge / đầu mục đếm đúng các dòng này.
 */
export function dongTab<T extends { studentId: number | null; con?: readonly T[] | null }>(ds: readonly T[], caDong: (it: T) => boolean = () => false): T[] {
  return ds.flatMap((it) => (it.con?.length && !caDong(it) && it.con.every((c) => c.studentId !== null && c.studentId === it.con![0].studentId) ? [...it.con] : [it]));
}
export type MucTab<T> = { key: string; label: string; items: T[]; /** Số dòng quá hạn trong mục (đầu mục "⚠ n quá hạn"). */ quaHan: number };
/** Chia dòng của một tab theo mục loại việc (thứ tự `MUC_CV`); trong mục: quá hạn trước, rồi hôm nay, rồi hạn sớm trước (AUDIT-UI B4). */
export function chiaMucTab<T extends ViecGom & { key: string; kind?: string | null }>(dong: readonly T[], tvv = false): MucTab<T>[] {
  const w = (u: ViecGom['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
  const xep = (a: T, b: T) => Number(b.key === KHOA_CHAM_SPEAKING) - Number(a.key === KHOA_CHAM_SPEAKING) || w(a.urgency) - w(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999');
  const out: MucTab<T>[] = [];
  for (const [m, nhan] of MUC_CV) {
    const ds = dong.filter((x) => mucCuaViec(x, tvv) === m).sort(xep);
    if (ds.length) out.push({ key: m, label: nhan, items: ds, quaHan: ds.filter((x) => x.urgency === 'overdue').length });
  }
  return out;
}

/**
 * BADGE TAB — AUDIT-UI B3 (chủ SP 08/11, thay CV-TAB 06/11 "đỏ / vàng / trắng"): MỘT nghĩa như badge menu V13 — số dòng CẦN LÀM NGAY (quá hạn + hạn hôm nay);
 * đỏ khi có quá hạn, vàng khi chỉ có hạn hôm nay; 0 → không badge. Tổng dòng chỉ ở đầu trang. Nhận dòng nhìn thấy (`dongTab`); dữ liệu đã nạp, không gọi máy chủ.
 */
/** `bai`: tab "Chấm Speaking" (chủ SP lời 33, `04-thiet-ke.md` mục 15) — badge MỜ đếm bài + ⚠ khi có bài quá hạn; không đỏ, không vào badge menu / chuông. */
export type BadgeTab = { so: number; n: number; quaHan: number; homNay: number; bai?: { n: number; quaHan: number } };
export function badgeTab(dong: readonly { urgency: string; key?: string }[]): BadgeTab {
  /* Rà 11/11 #2 (G5-02): S chấm chéo ghi "quá hạn" ở dòng nhưng KHÔNG đếm (T18 06/11) — tab không đỏ khi số đầu trang không có (cùng `demDongViec`). */
  const tinh = dong.filter((x) => !(x.key && laViecChamCheo({ key: x.key })));
  const quaHan = tinh.filter((x) => x.urgency === 'overdue').length, homNay = tinh.filter((x) => x.urgency === 'today').length;
  return { so: quaHan + homNay, n: dong.length, quaHan, homNay };
}
/** Mở trang (chưa chọn tab): tab đầu tiên có việc quá hạn, không có thì tab đầu. */
export const tabMacDinh = (ds: readonly { key: string; badge: BadgeTab | null }[]): string | null => (ds.find((x) => (x.badge?.quaHan ?? 0) > 0) ?? ds[0])?.key ?? null;

// ------------------------------------------------------------------ Cần xử lý (Quản lý)
export type MaCanXuLy =
  | 'bai-qua-han-nhap-diem' | 'pa-can-cap-nhat' | 'phoi-hop-qua-han'
  | 'van-hanh-can-quyet-dinh' | 'lop-thieu-gv-mon' | 'hv-len-ft-chua-ky-vong'
  | 'lop-chua-chot-len-ft' | 'case-xac-dinh-nguyen-nhan-qua-han';
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
  { metricId: 'bai-qua-han-nhap-diem', nhan: t('bài quá hạn chưa nhập điểm'), nut: 'Xem', cuaNguoiXem: false, quaHan: true },
  { metricId: 'pa-can-cap-nhat', nhan: t('PA chưa có Kết quả'), nut: 'Xem', cuaNguoiXem: false, quaHan: true },
  /* UX-2 (2, chủ SP 16/10): Case quá hạn chốt PA trở lại Cần xử lý (UX-1 đổi tên "Case chưa chốt PA") — việc GV phụ trách Case đang trễ. */
  { metricId: 'case-xac-dinh-nguyen-nhan-qua-han', nhan: t('Case chưa chốt PA quá hạn'), nut: 'Xem', cuaNguoiXem: false, quaHan: true },
  /* OV-12h: meeting CX / GĐCN quá 5 ngày chưa xác nhận — việc GVCN trễ, cùng tập với dòng Phối hợp SOS quá hạn ở Công việc. */
  { metricId: 'phoi-hop-qua-han', nhan: t('lượt có Meeting CX/GĐCN (sau Mock) quá hạn xác nhận'), nut: 'Xem', cuaNguoiXem: false, quaHan: true },
  /* PR-VAI-a Q8: bốn việc "của Bạn" — mỗi dòng một chỉ số gọi đúng hàm màn khác đang dùng. */
  { metricId: 'van-hanh-can-quyet-dinh', nhan: t('việc Vận hành cần quyết định'), nut: t('Mở Vận hành'), cuaNguoiXem: true },
  /* PR-LCb: MỘT dòng "lớp cần Chốt lộ trình" (thay "em chưa có quyết định chuyển lớp" + "lớp cần Chốt lên FT") — cùng hàm với việc "Chốt lộ trình · lớp". */
  { metricId: 'lop-chua-chot-len-ft', nhan: t('lớp cần Chốt lộ trình'), nut: t('Cuối khoá ›'), cuaNguoiXem: true },
  { metricId: 'lop-thieu-gv-mon', nhan: t('lớp thiếu GV môn'), nut: t('Sửa phân công'), cuaNguoiXem: true },
  { metricId: 'hv-len-ft-chua-ky-vong', nhan: t('học viên lên FT chưa chốt Kết quả đầu ra'), nut: t('Mở hồ sơ'), cuaNguoiXem: true },
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
 * Q25 → OV-12a: "kỳ W3–W4 SEP" — KỲ (hai tuần) của hạn ghi kết quả cũ nhất (hạn = hết Thứ Ba sau kỳ). Một chỗ cho dòng Cần xử lý và ô số.
 */
export function tuanCuaHanGhiKetQua(han: string, homNay: string): string {
  return t('kỳ {kyGhiKetQua}', { kyGhiKetQua: kyGhiKetQua(han, homNay) });
}

/** Cột Người giữ việc (Q4): "Bạn", hoặc "n giáo viên" + tên sắp theo tên, quá 3 thì "+k". */
export function nguoiGiuViecChu(ten: readonly string[]): { dau: string; phu: string } {
  const ds = [...new Set(ten)].sort((a, b) => a.localeCompare(b, 'vi'));
  if (!ds.length) return { dau: t('chưa phân công'), phu: '' };
  return { dau: t('{length} giáo viên', { length: ds.length }), phu: [...ds.slice(0, 3), ...(ds.length > 3 ? [`+${ds.length - 3}`] : [])].join(' · ') };
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
      cau: t('{nhanMon}: {tu}/{mau} học viên dưới kỳ vọng', { nhanMon: mon.nhanMon, tu: mon.tu, mau: mon.mau }),
      lienKet: t('xem {tu} học viên', { tu: mon.tu }), soDanhSach: mon.tu });
  }
  const lop = ct === 'thuong' ? nhieuNhat('lop-chua-dat') : undefined;
  if (lop) {
    out.push({ loai: lop.loai, metricId: lop.metricId, extra: lop.extra, muc: 'can-chu-y',
      cau: t('{nhanMon}: {tu}/{mau} học viên chưa đạt {x}', { nhanMon: lop.nhanMon, tu: lop.tu, mau: lop.mau, x: lop.tenBai ?? t('ở bài gần nhất') }),
      lienKet: t('xem {tu} học viên', { tu: lop.tu }), soDanhSach: lop.tu });
  }
  const pa = ds.find((x) => x.loai === 'pa-cai-thien' && x.mau >= N.mauToiThieu);
  if (pa) {
    out.push({ loai: pa.loai, metricId: pa.metricId, extra: pa.extra, muc: pa.tu / pa.mau >= 0.5 ? 'tot' : 'can-chu-y',
      cau: t('{tu}/{mau} PA học thuật đã kết thúc có cải thiện', { tu: pa.tu, mau: pa.mau }), lienKet: t('xem {mau} PA học thuật', { mau: pa.mau }), soDanhSach: pa.mau });
  }
  const dh = ds.find((x) => x.loai === 'dung-han' && x.mau >= N.mauToiThieu && x.tu / x.mau < N.dungHanDuoi);
  if (dh) {
    out.push({ loai: dh.loai, metricId: dh.metricId, extra: dh.extra, muc: 'can-chu-y',
      cau: t('{tu}/{mau} lần cập nhật PA đúng hạn (30 ngày qua)', { tu: dh.tu, mau: dh.mau }), lienKet: t('xem {mau} lần', { mau: dh.mau }), soDanhSach: dh.mau });
  }
  return out.slice(0, N.toiDa);
}

// ------------------------------------------------------------------ bảng Theo chi nhánh (mockup 02 phương án A)
/* OV-15d: + "Case chưa chốt PA" hai vùng bấm (HV / Case) — cột của Lớp cần chú ý (mockup 3). */
/* OV-15h1: + cột "Lớp cần chú ý" (mockup 3) — Chưa điểm · SOS 1 / 2 / 3 · Đã thi · chờ KQ; chỉ tính khi bảng ở chế độ chú ý (rỗng ở bảng chi nhánh). */
export const COT_BANG = ['hocVien', 'duoiKyVong', 'sos', 'caseMo', 'thieuPa', 'duDuLieu', 'caseChuaChotHv', 'caseChuaChot',
  'chuaDiem', 'sos1', 'sos2', 'sos3', 'daThiChoKq'] as const;
export type CotBang = (typeof COT_BANG)[number];
export const COT_BANG_DON_VI: Record<CotBang, 'hoc-vien' | 'case'> = {
  hocVien: 'hoc-vien', duoiKyVong: 'hoc-vien', sos: 'hoc-vien', caseMo: 'case', thieuPa: 'case', duDuLieu: 'hoc-vien',
  caseChuaChotHv: 'hoc-vien', caseChuaChot: 'case',
  chuaDiem: 'hoc-vien', sos1: 'hoc-vien', sos2: 'hoc-vien', sos3: 'hoc-vien', daThiChoKq: 'hoc-vien',
};
/**
 * OV-15h1 (C23): phân rã "Case chưa chốt PA" — mỗi Case đúng MỘT nhóm (`trangThaiCaseV4` + PA), cộng đúng tổng. Thứ tự = thứ tự trong `?`.
 * `khongTheoDoi` (thẻ "Không cần theo dõi" chờ QL) không có trong mockup — chỉ hiện khi > 0.
 */
export const NHOM_CASE_CHUA_CHOT = ['trongPa', 'choNhanXet', 'choXacNhanPa', 'choDuyetPa', 'paXong', 'khongTheoDoi'] as const;
export type NhomCaseChuaChot = (typeof NHOM_CASE_CHUA_CHOT)[number];
export const NHOM_CASE_CHUA_CHOT_LABEL: Record<NhomCaseChuaChot, string> = {
  trongPa: t('Case trống PA'), choNhanXet: t('Chờ mô tả / nguyên nhân'), choXacNhanPa: t('PA chờ xác nhận'), choDuyetPa: t('PA chờ duyệt đổi'),
  paXong: t('PA xong · chờ đóng Case'), khongTheoDoi: t('Chờ duyệt không theo dõi'),
};

/** M6 6b-2 (Q3): danh sách "Case chưa chốt PA" theo 6 nhóm máy chủ — thứ tự `NHOM_CASE_CHUA_CHOT`, nhóm rỗng không vẽ, quá hạn lên đầu nhóm (giữ thứ tự máy chủ). */
export function xepNhomCase<T extends { nhom?: string | null }>(ds: readonly T[], tre: (x: T) => boolean): { nhom: NhomCaseChuaChot; ten: string; dong: T[] }[] {
  return NHOM_CASE_CHUA_CHOT.map((nhom) => {
    const cua = ds.filter((x) => x.nhom === nhom);
    return { nhom, ten: NHOM_CASE_CHUA_CHOT_LABEL[nhom], dong: [...cua.filter(tre), ...cua.filter((x) => !tre(x))] };
  }).filter((g) => g.dong.length > 0);
}

/**
 * M6 6b-2 (Q7): "Case tiếp ›" — Case kế sau `hienTai` theo thứ tự danh sách mà người xem làm được (`lam`) và chưa xử lý (`xong`); hết đuôi thì vòng lên đầu.
 * `hienTai` đã ra khỏi danh sách → Case đầu còn chờ. Không còn Case nào khác → null.
 */
export function caseTiep(ds: readonly { id: number; lam?: boolean; xong?: unknown }[], hienTai: number): number | null {
  const i = ds.findIndex((x) => x.id === hienTai);
  const vong = [...ds.slice(i + 1), ...ds.slice(0, Math.max(i, 0))];
  return vong.find((x) => x.lam && !x.xong && x.id !== hienTai)?.id ?? null;
}
