/**
 * QUAY LẠI ĐÚNG NƠI BẮT ĐẦU (PR-OV5b, đặc tả OV mục 4 "Quay lại", mockup M1 §6).
 *
 * Bấm từ một trang nguồn (Tổng quan, Công việc, Test, Phân tích, Học viên & Lớp…) sang một hồ sơ → ghi nguồn = URL đầy đủ (bộ lọc,
 * tab, cách xem đều nằm trên URL) + vị trí cuộn + tên. Đi tiếp hồ sơ → hồ sơ thì thêm bước; nút "‹ {tên nguồn}" luôn về bước đầu,
 * menu cạnh nút về từng bước. Chồng tối đa 5. Hàm ở đây thuần — giao diện (`web/src/lib/quayLai.ts`) chỉ gọi.
 */
import { NHOM_VIEC_LABEL, type NhomViec } from './tongQuan.ts';
import { LOC_NHANH_LABEL, type LocNhanh } from './congViec.ts';
import { GOC_NHIN_LABEL, GOC_NHIN_MAC_DINH, type GocNhin } from './phanTich.ts';
import { DUONG_TAB_TEST, TAB_CONG_VIEC_LABEL, tabCongViecTuDuong } from './dieuHuong.ts';

export type BuocVe = { url: string; ten: string; chiTiet?: string; cuon: number };
export type TenTrang = { ten: string; chiTiet?: string };
export type LoaiHoSo = 'hoc-vien' | 'lop' | 'mt' | 'gv' | 'case' | 'nhap-diem';
/** `POP` = lùi / tiến trình duyệt (hoặc nút Quay lại về trang cha): chỉ cắt chồng khi về đúng một bước, không ghi thêm. */
export type KieuDi = 'PUSH' | 'REPLACE' | 'POP';

export const CHONG_TOI_DA = 5;

const HO_SO: [RegExp, LoaiHoSo][] = [
  [/^\/hoc-vien\/\d+$/, 'hoc-vien'], [/^\/hoc-vien\/lop\/\d+$/, 'lop'], [/^\/mock-test\/\d+$/, 'mt'],
  [/^\/giao-vien\/\d+$/, 'gv'], [/^\/hoc-thuat\/case\/\d+$/, 'case'], [/^\/(nhap-diem|bang-diem-thuong)\/\d+$/, 'nhap-diem'],
];
const TEN_HO_SO: Record<LoaiHoSo, string> = {
  'hoc-vien': 'Hồ sơ học viên', lop: 'Hồ sơ lớp', mt: 'Hồ sơ Mock Test', gv: 'Hồ sơ giáo viên', case: 'Case', 'nhap-diem': 'Nhập điểm',
};

/** Trang Nhập điểm tính như hồ sơ: có nút Quay lại theo nguồn (Đầu ra 6), bấm em trong lưới là đi tiếp hồ sơ → hồ sơ. */
export function loaiHoSo(pathname: string): LoaiHoSo | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return HO_SO.find(([re]) => re.test(p))?.[1] ?? null;
}

const tachUrl = (url: string) => {
  const i = url.indexOf('?');
  return { path: i < 0 ? url : url.slice(0, i), q: new URLSearchParams(i < 0 ? '' : url.slice(i + 1)) };
};

/** Chỉ đường dẫn trong app: bắt đầu bằng một `/`, không `//` hay `/\` (trình duyệt hiểu là trang ngoài), không ký tự điều khiển. */
export function urlTrongApp(x: unknown): x is string {
  return typeof x === 'string' && /^\/(?![/\\])/.test(x) && !/[\\\s]/.test(x) && x.length <= 2000;
}

/** Chồng đọc lại từ `sessionStorage` là dữ liệu ngoài: bỏ bước sai dạng / URL lạ, cắt còn 5 bước. */
export function docChong(x: unknown): BuocVe[] {
  if (!Array.isArray(x)) return [];
  const ra: BuocVe[] = [];
  for (const o of x as Partial<BuocVe>[]) {
    if (!o || !urlTrongApp(o.url) || typeof o.ten !== 'string' || !o.ten) continue;
    ra.push({ url: o.url, ten: o.ten, ...(typeof o.chiTiet === 'string' && o.chiTiet ? { chiTiet: o.chiTiet } : {}),
      cuon: typeof o.cuon === 'number' && Number.isFinite(o.cuon) && o.cuon > 0 ? o.cuon : 0 });
  }
  return ra.slice(0, CHONG_TOI_DA);
}

/**
 * Một lần chuyển trang `tu` → `den` làm chồng đổi thế nào. `cuonVe` ≠ null: vừa về đúng một bước → khôi phục vị trí cuộn đó.
 *   về đúng URL một bước          → cắt từ bước đó (bước 0 = nguồn → chồng rỗng)
 *   nguồn → hồ sơ                  → chồng = [nguồn] (bắt đầu lại)
 *   hồ sơ → hồ sơ khác (PUSH)      → thêm bước; quá 5 thì bỏ bước cũ nhất SAU nguồn (nút luôn về nguồn đầu)
 *   hồ sơ lớp → Điểm theo lớp (PUSH) → thêm bước hồ sơ lớp (OV-11e, HL-6: Điểm theo lớp có "‹ Hồ sơ lớp {mã}")
 *   còn lại (POP, REPLACE giữa hai hồ sơ = Trước/Sau hoặc Case chuyển thẳng, cùng hồ sơ đổi query, sang trang nguồn) → giữ nguyên
 */
export function buocMoi(chong: BuocVe[], o: { tu: BuocVe | null; den: string; kieu: KieuDi }): { chong: BuocVe[]; cuonVe: number | null } {
  const k = chong.findIndex((b) => b.url === o.den);
  if (k >= 0) return { chong: chong.slice(0, k), cuonVe: chong[k].cuon };
  const giu = { chong, cuonVe: null };
  if (o.kieu === 'POP' || !o.tu) return giu;
  const tuPath = tachUrl(o.tu.url).path;
  const vaoDiemLop = o.kieu === 'PUSH' && loaiHoSo(tuPath) === 'lop' && tachUrl(o.den).path === DUONG_TAB_TEST['diem-lop'];
  if (!loaiHoSo(tachUrl(o.den).path) && !vaoDiemLop) return giu;
  if (tuPath === tachUrl(o.den).path) return giu;
  if (!loaiHoSo(tuPath)) return { chong: [o.tu], cuonVe: null };
  if (o.kieu === 'REPLACE') return giu;
  const moi = [...chong, o.tu];
  return { chong: moi.length > CHONG_TOI_DA ? [moi[0], ...moi.slice(-(CHONG_TOI_DA - 1))] : moi, cuonVe: null };
}

/** Mở thẳng bằng link / tải lại trang: về trang cha như trước PR này. */
export function trangCha(loai: LoaiHoSo, o: { studentId?: number | null; tenHv?: string | null; nav?: { phanTichGv?: boolean; admin?: boolean } | null } = {}): TenTrang & { url: string } {
  const hvLop = { url: '/hoc-vien', ten: 'Học viên & Lớp' };
  switch (loai) {
    case 'mt': case 'case':
      return o.studentId ? { url: `/hoc-vien/${o.studentId}`, ten: o.tenHv ? `Hồ sơ ${o.tenHv}` : TEN_HO_SO['hoc-vien'] } : hvLop;
    case 'gv':
      if (o.nav?.phanTichGv) return { url: '/phan-tich?goc=giao-vien', ten: 'Phân tích', chiTiet: GOC_NHIN_LABEL['giao-vien'] };
      return o.nav?.admin ? { url: '/quan-tri', ten: 'Quản trị' } : { url: '/', ten: 'Tổng quan' };
    case 'nhap-diem': return { url: '/test', ten: 'Test' };
    default: return hvLop;
  }
}

const TEN_TAB_TEST: Record<string, string> = { lich: 'Lịch Test', 'diem-lop': 'Điểm theo lớp', 'ke-hoach': 'Kế hoạch Test' };
const noi = (...x: (string | null | undefined | false)[]) => x.filter(Boolean).join(' · ') || undefined;
const nhan = <K extends string>(bang: Record<K, string>, v: string | null, boQua?: K) => (v && v !== boQua && v in bang ? bang[v as K] : null);

/**
 * OV-11i (P1-3, Q14 — WCAG 2.4.2): tiêu đề tab "{tên màn} · PISA Tracking". Tên trống / không rõ ("Trang trước" của `tenNguon`) → "PISA Tracking".
 * App đặt theo `tenNguon`; hồ sơ đặt tên riêng qua `useTenTrang` (tên em, mã lớp…).
 */
export function tieuDeTab(ten: string | null | undefined): string {
  const t = (ten ?? '').trim();
  return t && t !== 'Trang trước' ? `${t} · PISA Tracking` : 'PISA Tracking';
}

/** Tên một trang theo URL (trang tự đặt tên chi tiết hơn — tuần, tên em — qua `web/src/lib/quayLai.ts › useTenTrang`). */
export function tenNguon(url: string): TenTrang {
  const { path, q } = tachUrl(url);
  const p = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const hs = loaiHoSo(p);
  if (hs) return { ten: TEN_HO_SO[hs] };
  if (p === '/') return { ten: 'Tổng quan' };
  if (p === '/phan-tich') return { ten: 'Phân tích', chiTiet: nhan<GocNhin>(GOC_NHIN_LABEL, q.get('goc')) ?? GOC_NHIN_LABEL[GOC_NHIN_MAC_DINH] };
  const cv = /^\/cong-viec(?:\/([^/]+))?$/.exec(p);
  if (cv) {
    const tab = tabCongViecTuDuong(cv[1]);
    return { ten: 'Công việc', chiTiet: noi(tab && tab !== 'ho-tro' && TAB_CONG_VIEC_LABEL[tab],
      nhan<LocNhanh>(LOC_NHANH_LABEL, q.get('loc'), 'tat-ca'), nhan<NhomViec>(NHOM_VIEC_LABEL, q.get('nhom'))) };
  }
  const test = /^\/test(?:\/([^/]+))?$/.exec(p);
  if (test) return { ten: TEN_TAB_TEST[test[1] ?? ''] ?? 'Test' };
  if (p === '/hoc-vien') return { ten: 'Học viên & Lớp', chiTiet: q.get('q') ? `“${q.get('q')}”` : undefined };
  if (p === '/hoc-vien/luu-tru') return { ten: 'Lưu trữ' };
  if (p === '/quan-tri') return { ten: 'Quản trị' };
  if (p === '/ho-so-ca-nhan') return { ten: 'Hồ sơ cá nhân' };
  return { ten: 'Trang trước' };
}
