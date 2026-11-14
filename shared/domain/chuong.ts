/**
 * CHUÔNG V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-chuong-v2/`). Hai khối:
 *  · Việc cần làm — gom VIỆC CỦA TÔI theo loại (một loại một dòng), đếm CÙNG `demDongViec` như badge / Công việc. Nguồn: bản `/my-work` App đã tải.
 *  · Cập nhật — tin một chiều từ `/notifications` (đã duyệt / từ chối, chuyển lớp, đổi lịch…). Tin trỏ tới VIỆC không hiện ở đây: việc nằm ở khối trên.
 * Số trên chuông = badge Công việc (`summary.canLamNgay`) — "Dùng số chung".
 */
import { t } from '../i18n/index.ts';
import { dongNhinThay, type DongDem } from './tongQuan.ts';
import { laViecChamCheo } from './gopViec.ts';
import { ngayTheoGioVN } from './display.ts';
import { mondayOfDate } from './week.ts';
import { addDaysIso } from './sos.ts';
import { bacNgan } from './yThuc.ts';

/** Tên loại việc — CÙNG chữ `GROUP_META.label` của máy chủ (`mywork.ts`; phép kiểm CHUONG-V2-1 so hai bảng). */
export const NHAN_LOAI_VIEC: Record<string, string> = {
  cause: t('Xác nhận Case'), ghi_nhan_xet: t('Mô tả Case'), xac_nhan_pa: t('Xác nhận PA'), xem_nx_s: t('Xác nhận Case Speaking'),
  phoi_hop: t('Báo PH kết quả Test'), phoi_hop_sos: t('Phối hợp SOS'), phoi_hop_tvv: t('Báo PH · Meeting CX/GĐCN'), khai_bac: t('Xác nhận cấp bậc vi phạm HV cũ'), ky_vong_dau_ra: t('Kỳ vọng'),
  thi_that: t('Cập nhật kết quả thi thật'), buoc_tiep: t('Chọn bước tiếp'), bo_sung_ho_so: t('Bổ sung hồ sơ thiếu'), mini_test: t('Ghi Mini Test'),
  score: t('Nhập điểm'), no_plan: t('Thiếu PA học thuật'), ghi_ket_qua_pa: t('Kết quả PA'), no_owner: t('Chưa có người phụ trách'),
  chot_len_ft: t('Chốt lộ trình'), xet_lai_lo_trinh: t('Xét lại lộ trình'), missing_data: t('Thiếu dữ liệu đánh giá'), yt_xu_ly: t('Xử lý vi phạm'),
  yt_xem: t('Xem vi phạm mới'), bao_ph_yt: t('Báo PH vi phạm'), yt_hoi_tinh_hinh: t('Tình hình học tập'), yt_thuc_hien: t('Ghi "Đã thực hiện"'), ban_giao: t('Bàn giao'),
  xuat_bc_ph: t('Xuất báo cáo PH'), bao_cao_ph: t('Viết Báo cáo PH'), mgmt: t('Việc được giao'),
};

export type DongViecChuong = DongDem & { group: string; mine: boolean; cn?: number | null };
export type LoaiViecChuong = { loai: string; ten: string; n: number; quaHan: number; homNay: number; cn: Map<number, number>; keys: string[] };

/**
 * Gom việc của tôi theo loại. Cùng tập + cùng đơn vị với `demSo` (máy chủ): dòng của tôi (hoặc dòng gộp có con của tôi) → dòng nhìn thấy
 * (`dongNhinThay`) → bỏ chấm chéo. Tổng `n` các loại = `demDongViec(...).n`; tổng quá hạn + hôm nay = `canLamNgay` (badge, số chuông).
 * Xếp: loại có quá hạn → có hôm nay → nhiều việc.
 */
export function gomViecChuong<T extends DongViecChuong>(dong: readonly T[], cuaToi: (d: T) => boolean = (d) => d.mine): LoaiViecChuong[] {
  const ra = new Map<string, LoaiViecChuong>();
  for (const x of dongNhinThay(dongCuaToi(dong, cuaToi)) as T[]) {
    if (laViecChamCheo(x)) continue;
    const g: LoaiViecChuong = ra.get(x.group) ?? { loai: x.group, ten: NHAN_LOAI_VIEC[x.group] ?? x.group, n: 0, quaHan: 0, homNay: 0, cn: new Map(), keys: [] };
    g.n++;
    if (x.urgency === 'overdue') g.quaHan++;
    else if (x.urgency === 'today') g.homNay++;
    if (x.cn != null) g.cn.set(x.cn, (g.cn.get(x.cn) ?? 0) + 1);
    g.keys.push(x.key);
    ra.set(x.group, g);
  }
  return xepLoaiViec([...ra.values()]);
}

/**
 * GD-9 ([XM-9a]): DÒNG CỦA TÔI — dòng của tôi hoặc dòng gộp có con của tôi. MỘT hàm cho chuông (`gomViecChuong`) và đầu trang Công việc của GV / TVV
 * (trang đó còn liệt kê việc LÀM THAY — `mine: false` — nhưng không đếm vào "n việc", cùng số chuông · Tổng quan "Việc của tôi" · `summary.viec`).
 */
export const dongCuaToi = <T extends { mine: boolean; con?: readonly unknown[] | null }>(dong: readonly T[], cuaToi: (d: T) => boolean = (d) => d.mine): T[] =>
  dong.filter((d) => cuaToi(d) || !!(d.con as readonly T[] | null | undefined)?.some(cuaToi));

/** Thứ tự dòng loại: có quá hạn → có hôm nay → nhiều việc (dòng thêm từ Chờ duyệt / thông báo xếp chung một luật). */
export const xepLoaiViec = <L extends Pick<LoaiViecChuong, 'quaHan' | 'homNay' | 'n'>>(ds: L[]): L[] =>
  ds.sort((a, b) => Number(b.quaHan > 0) - Number(a.quaHan > 0) || Number(b.homNay > 0) - Number(a.homNay > 0) || b.n - a.n);

/** "● n mới" (chủ SP 11/11, XM-2): việc chưa có ở lần mở chuông trước. `daThay` null = chưa từng mở (máy mới) → không báo mới. */
export const soViecMoi = (keys: readonly string[], daThay: ReadonlySet<string> | null) => (daThay ? keys.filter((k) => !daThay.has(k)).length : 0);

type TinChuong = { kind: string | null; entity_type?: string | null; con_viec?: number | null };

/**
 * Tin trỏ tới VIỆC — không hiện ở Cập nhật (việc đã đếm ở khối trên, từ `/my-work`; việc xong thì không nơi nào còn báo).
 * `sos` gắn Case là việc (Mô tả / Xác nhận Case); `sos` gắn lượt (gửi GVCN) là tin.
 */
const KIND_VIEC = new Set(['cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh', 'bao_ph_xu_ly', 'xuat_bc_ph_qua_han', 'case_giao', 'sos_new',
  'discipline', 'phoi_hop', 'duyet_moi', 'duyet_qua_han', 'lam_lai_ban_giao', 'nhan_xet_speaking', 'dang_ky', 'schedule_move',
  'nhac_viec', 'nhac_ban_giao', 'overdue_score', 'overdue_task',
  'yt_da_duyet']);   // QL duyệt đề xuất Ý thức → việc "Ghi Đã thực hiện" (`yt_thuc_hien`) ở khối trên
export const laTinViec = (n: TinChuong) => KIND_VIEC.has(n.kind ?? '') || (n.kind === 'sos' && n.entity_type === 'sos_case');

/** Việc không có trong `/my-work` nhưng vẫn là việc của người nhận (thông báo còn chờ) — thêm một dòng loại ở khối Việc cần làm. */
export const VIEC_TU_TIN: Record<string, string> = { dang_ky: t('Duyệt tài khoản'), schedule_move: t('Xếp lại lịch Test') };
export const laViecTuTin = (n: TinChuong) => n.con_viec === 1 && n.kind != null && n.kind in VIEC_TU_TIN;

/** Nhãn loại tin ở hàng trên của một tin Cập nhật. */
const LOAI_TIN: Record<string, string> = {
  duyet_ket_qua: t('Yêu cầu'), duyet_tu_choi: t('Yêu cầu'), duyet_tu_duyet: t('Yêu cầu'), bao_len: t('Yêu cầu'),
  transfer_in: t('Chuyển lớp'), sap_nhan: t('Chuyển lớp'), huy_lenh: t('Chuyển lớp'), lenh_loi: t('Chuyển lớp'),
  ban_giao: t('Bàn giao'), ban_giao_gv: t('Bàn giao'),
  doi_lich_thuong: t('Lịch Test'), tu_doi_lich: t('Lịch Test'), doi_lich_lop: t('Lịch lớp'),
  phan_cong_gvcn: t('Phân công'), phan_cong_moi: t('Phân công'), phan_cong_loi: t('Phân công'),
  case_dong_gv: 'Case', bo_tro_mien_phi: 'Case', sos: 'SOS', discipline_de_biet: t('Ý thức'), buoc_tiep_loi: t('Lộ trình'),
  bc_ph_du: t('Báo cáo PH'),   // LG-3: Admin — lớp × đợt đủ báo cáo PH
};
export const loaiTin = (kind: string | null | undefined) => LOAI_TIN[kind ?? ''] ?? t('Thông báo');

export type KetQuaTin = { tone: 'ok' | 'bad' | 'trung'; chu: string };
/**
 * Tách một tin thành KẾT QUẢ (đứng đầu nội dung, chữ + màu — không chỉ màu) và phần còn lại. Chữ tiêu đề do máy chủ viết (`yeuCau.ts`, `xuLy.ts`):
 * "Yêu cầu {loại} · {em} · Đã duyệt | Bị từ chối: {lý do} | Đã trả lời: {…} | Tự đóng: {…}". Tin lỗi của chính thao tác
 * mình (lệnh chuyển / phân công / bước tiếp) → "Lỗi". Không khớp mẫu → không tách (giữ nguyên tiêu đề).
 */
const KQ_YC: [RegExp, KetQuaTin['tone'], string][] = [
  [/ · Đã duyệt$/, 'ok', t('Đã duyệt')], [/ · Bị từ chối:? ?/, 'bad', t('Từ chối')], [/ · Đã trả lời:? ?/, 'trung', t('Đã trả lời')], [/ · Tự đóng:? ?/, 'trung', t('Tự đóng')],
];
export function tachTin(n: { kind: string | null; title: string }): { kq: KetQuaTin | null; chu: string } {
  /* GD-4d (⓪ dòng 18, ⑤ H5): tên bậc trong tin (chuỗi máy chủ "Thu hồi Report 2") viết hoa, dạng tắt — một khái niệm một cách viết. */
  const tieuDe = bacNgan(n.title ?? '');
  if (n.kind === 'duyet_ket_qua' || n.kind === 'duyet_tu_choi') {
    for (const [re, tone, chu] of KQ_YC) {
      const m = re.exec(tieuDe);
      if (!m) continue;
      const truoc = tieuDe.slice(0, m.index).replace(/^Yêu cầu /, ''), sau = tieuDe.slice(m.index + m[0].length).trim();
      return { kq: { tone, chu }, chu: sau ? `${truoc} — ${sau}` : truoc };
    }
  }
  if (n.kind === 'duyet_tu_duyet' && tieuDe.startsWith('Quản lý tự duyệt · ')) return { kq: { tone: 'trung', chu: t('Tự duyệt') }, chu: tieuDe.slice('Quản lý tự duyệt · '.length) };
  if (n.kind === 'lenh_loi' || n.kind === 'phan_cong_loi' || n.kind === 'buoc_tiep_loi') return { kq: { tone: 'bad', chu: t('Lỗi') }, chu: tieuDe };
  return { kq: null, chu: tieuDe };
}

/** Nhóm ngày ở "Xem tất cả": Hôm nay · Hôm qua · Tuần này (từ T2) · Trước đó — theo giờ VN, so với ngày nghiệp vụ. */
export type NhomNgayTin = 'hom-nay' | 'hom-qua' | 'tuan-nay' | 'truoc';
export const NHAN_NHOM_NGAY: Record<NhomNgayTin, string> = { 'hom-nay': t('Hôm nay'), 'hom-qua': t('Hôm qua'), 'tuan-nay': t('Tuần này'), truoc: t('Trước đó') };
export function nhomNgayTin(iso: string | null | undefined, homNay: string): NhomNgayTin {
  const d = ngayTheoGioVN(iso);
  if (!d || d >= homNay) return 'hom-nay';
  if (d === addDaysIso(homNay, -1)) return 'hom-qua';
  return d >= mondayOfDate(homNay) ? 'tuan-nay' : 'truoc';
}
