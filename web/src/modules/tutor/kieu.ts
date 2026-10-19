/** TU-b: kiểu dữ liệu trang Tutor (khớp `server/src/tutors/trang.ts`) + nhãn dùng chung bảng / panel / hộp. */
import { t } from '@shared/i18n/index.ts';

export type KetLuan = 'on' | 'can_cai_thien' | 'ngung';
export type TyLe = [number, number];
export type NoiDay = { id: number; ten: string } | 'online' | null;
export type SoTutor = { buoi: number; chuanBi: TyLe; taiLieu: TyLe; feedbackGv: TyLe; danhGia: number | null };
export type DongTutor = SoTutor & {
  id: number; ten: string; sdt: string | null; noiDay: NoiDay; kyNang: string[];
  ketLuan: { kl: KetLuan; luc: string } | null; chuY: string | null; thieu: ('sdt' | 'noiDay')[];
};
export type ChiNhanh = { id: number; ten: string };
export type BangTutor = { dong: DongTutor[]; goTay: { soTen: number; soBuoi: number } | null; coSua: boolean; chiNhanh: string | null; dsChiNhanh: ChiNhanh[] };
export type BuoiDay = {
  id: number; ngay: string; hocVien: string; lop: string | null; nguoiGhi: string | null; kn: string; hinhThuc: 'offline' | 'online' | null;
  chuanBi: boolean | null; taiLieu: boolean | null; feedbackGv: boolean | null; danhGia: number | null; nhanXet: string; nhanXetTutor: string | null;
};
export type NhanXet = { id: number; kl: KetLuan; noiDung: string; luc: string; suaLuc: string | null; nguoi: string; coSua: boolean };
export type PanelTutorKq = { tutor: DongTutor; so: SoTutor; coSua: boolean; coBuoi: boolean; nhanXet: NhanXet[]; buoi: BuoiDay[] };
/** Ba tiêu chí (cùng thứ tự `TIEU_CHI_TUTOR` của TU-a): khoá dữ liệu + nhãn cột. */
export type TieuChi = 'chuanBi' | 'taiLieu' | 'feedbackGv';
export const TIEU_CHI: { k: TieuChi; nhan: string }[] = [
  { k: 'chuanBi', nhan: t('Chuẩn bị') }, { k: 'taiLieu', nhan: t('Tài liệu đúng hạn') }, { k: 'feedbackGv', nhan: t('Feedback GV') },
];

export const NHAN_KET_LUAN: Record<KetLuan, string> = { on: t('Ổn'), can_cai_thien: t('Cần cải thiện'), ngung: t('Ngừng hợp tác') };
export const KET_LUAN: KetLuan[] = ['on', 'can_cai_thien', 'ngung'];
export const nhanNoiDay = (n: NoiDay) => (n === 'online' ? t('Chỉ online') : n ? n.ten : '—');
/** "W1 · W2" gọn thành "W" khi đủ cả hai (mockup). */
export const nhanKyNang = (ks: string[]) => (ks.includes('W1') && ks.includes('W2') ? ks.filter((k) => k !== 'W2').map((k) => (k === 'W1' ? 'W' : k)) : ks).join(' · ');
/** Bỏ dấu + chữ thường — ô tìm tên. */
export const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
/** "0912 345 678" — đọc dễ. */
export const nhanSdt = (s: string | null) => (s && s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s ?? '');
