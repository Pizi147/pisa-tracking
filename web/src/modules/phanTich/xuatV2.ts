import { CHUONG_TRINH_LABEL, maTuan, ngay, nhanKhoang, type ChuongTrinh, type KhoangNgay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { api } from '../../lib/api.ts';
import { taiXlsxDep, type MauXlsx, type OXlsx, type SheetDep } from '../../lib/xlsxDep.ts';

/**
 * XUẤT EXCEL 4 BÁO CÁO (Phân tích V2 · PR-5, chủ SP 12/11 "format sẵn, bản đẹp, dùng được luôn"): Chi nhánh · Thi thật · SOS · Giáo viên.
 * Tệp "{Báo cáo} {chi nhánh} {tuần đầu}-{tuần cuối}.xlsx"; mỗi sheet mở đầu bằng tên báo cáo + "chi nhánh · chương trình · khoảng · dữ liệu đến";
 * mỗi bảng một sheet (bộ ghi `xlsxDep`), sheet cuối "Danh sách" = em / bài / việc sau các số. Bảng dựng từ dữ liệu ĐÃ NẠP của trang;
 * chỉ "Danh sách" gọi thêm một panel sẵn có lúc bấm Xuất (không thêm gì khi mở trang).
 */
export type DauXuat = { bao: string; cn: string | null; ct: ChuongTrinh | null; khoang: KhoangNgay; homNay: string };

const tenCn = (d: DauXuat) => d.cn ?? t('Tất cả chi nhánh');
export const moTaXuat = (d: DauXuat) =>
  [tenCn(d), d.ct ? CHUONG_TRINH_LABEL[d.ct] : null, nhanKhoang(d.khoang).chinh, t('dữ liệu đến {ngay}', { ngay: ngay(d.homNay) })].filter(Boolean).join(' · ');
export const tenTepXuat = (d: DauXuat) =>
  `${d.bao} ${tenCn(d)} ${d.khoang.kieu === 'toan-bo' ? t('Toàn bộ') : `${maTuan(d.khoang.tu).ma}-${maTuan(d.khoang.den).ma}`}.xlsx`;
export const xuatBaoCao = (d: DauXuat, sheets: SheetDep[]) => taiXlsxDep(tenTepXuat(d), d.bao, moTaXuat(d), sheets);

/** Tỉ lệ dạng % thật (số 0–1); không có mẫu → "—". */
export const ptX = (dat: number | null | undefined, mau: number | null | undefined): OXlsx => (mau ? { v: (dat ?? 0) / mau, dang: 'pt' } : '—');
/** Số có màu khi > 0 (Vượt / Chưa đạt / SOS…), 0 để trơn như web. */
export const soX = (n: number | null | undefined, mau?: MauXlsx): OXlsx => (n == null ? '—' : n && mau ? { v: n, mau } : n);
export const ngayX = (iso: string | null | undefined): OXlsx => (iso ? { v: iso.slice(0, 10), dang: 'ngay' } : '');

const MAU_KQ: Record<string, MauXlsx | undefined> = { vuot: 'vuot', bang: 'dat', dat: 'dat', duoi: 'chua-dat' };
const KN_LUOT = ['l', 'r', 'w1', 'w2', 's'] as const;

/**
 * Sheet "Danh sách" từ dòng panel (`{ rows }` của `/o`): dòng lượt (điểm từng kỹ năng, màu Vượt / Đạt / Dưới) · dòng việc / bài sổ nghĩa vụ
 * (Đúng hạn / Làm muộn / Chưa làm) · dòng khác (em · lớp · nội dung · kết quả).
 */
export function sheetDanhSach(rows: readonly any[], gv?: (r: any) => string | null): SheetDep {
  const ten = t('Danh sách');
  if (rows.length && rows.every((r) => r.luotDiem)) {
    const d = (o: any): OXlsx => (o ? { v: o.v, mau: MAU_KQ[o.kq ?? ''] } : '—');
    const kq = (o: any): OXlsx => (!o?.kq ? '' : o.kq === 'vuot' ? { v: t('Vượt'), mau: 'vuot' } : o.kq === 'duoi' ? { v: t('Chưa đạt'), mau: 'chua-dat' } : { v: t('Đạt'), mau: 'dat' });
    return { ten, coDinhCot: false, dau: [[t('Học viên'), t('Lớp'), t('Lượt'), t('Tuần'), 'L', 'R', 'W1', 'W2', 'S', 'Overall', t('Kỳ vọng'), t('Kết quả')]],
      hang: rows.map(({ luotDiem: x }) => [x.ten, x.lop, `MT${x.mt}`, /^\d{4}-\d{2}-\d{2}/.test(x.tuan ?? '') ? maTuan(x.tuan).ma : x.tuan ?? '',
        ...KN_LUOT.map((k) => d(x.kn?.[k])), d(x.ovr), x.kyVong ?? '—', kq(x.ovr)]) };
  }
  if (rows.length && rows.every((r) => r.baiThuong)) {
    /* Bài lớp thường: mỗi môn "đúng/tổng" (màu Đạt / Chưa đạt theo ngưỡng lớp) + % tổng (Final). Môn theo thứ tự xuất hiện. */
    const mon = [...new Set(rows.flatMap((r) => Object.keys(r.baiThuong.mon ?? {})))];
    const o = (x: any): OXlsx => (!x ? '—' : { v: `${x.dung}/${x.tong}`, mau: x.dat === true ? 'dat' : x.dat === false ? 'chua-dat' : undefined });
    return { ten, coDinhCot: false, dau: [[t('Học viên'), t('Lớp'), t('Bài'), t('Tuần'), ...mon, t('Tổng'), t('Kết quả')]],
      hang: rows.map(({ baiThuong: x }) => [x.ten, x.lop, x.nhanBai, /^\d{4}-\d{2}-\d{2}/.test(x.tuan ?? '') ? maTuan(x.tuan).ma : x.tuan ?? '', ...mon.map((m) => o(x.mon?.[m])),
        x.tong == null ? '—' : { v: x.tong / 100, dang: 'pt' }, x.datTong == null ? '' : x.datTong ? { v: t('Đạt'), mau: 'dat' } : { v: t('Chưa đạt'), mau: 'chua-dat' }]) };
  }
  if (rows.length && rows.every((r) => r.dongViec)) {
    const coCn = rows.some((r) => r.dongViec.chiNhanh);
    const tt = (v: any): OXlsx => (v.trangThai === 'dung' ? { v: t('Đúng hạn'), mau: 'dat' }
      : v.trangThai === 'muon' ? { v: t('Làm muộn {n} ngày', { n: v.treNgay ?? 0 }), mau: 'sos1' } : { v: t('Chưa làm · quá {n} ngày', { n: v.treNgay ?? 0 }), mau: 'chua-dat' });
    return { ten, coDinhCot: false,
      dau: [[...(gv ? [t('Giáo viên')] : []), t('Loại'), t('Việc'), t('Học viên'), t('Lớp'), t('Hạn'), t('Ngày làm'), t('Trạng thái'), ...(coCn ? [t('Chi nhánh')] : [])]],
      hang: rows.map((r) => { const v = r.dongViec; return [...(gv ? [gv(r) ?? t('Chưa phân công')] : []), v.tab === 'cham' ? t('Chấm Test') : t('Việc'), v.ten, v.em?.ten ?? '', v.lop?.ma ?? '',
        ngayX(v.han), ngayX(v.ngayXong), tt(v), ...(coCn ? [v.chiNhanh ?? ''] : [])]; }) };
  }
  const kq = (r: any): OXlsx => (r.vuot ? { v: t('Vượt'), mau: 'vuot' } : r.ketQua === 'dat' ? { v: t('Đạt'), mau: 'dat' } : r.ketQua === 'chua' ? { v: t('Chưa đạt'), mau: 'chua-dat' } : '');
  const coKq = rows.some((r) => r.ketQua);
  return { ten, coDinhCot: false, dau: [[t('Học viên'), t('Lớp'), t('Nội dung'), ...(coKq ? [t('Kết quả')] : [])]],
    hang: rows.map((r) => [r.em?.ten ?? r.title, r.lop ?? '', r.em ? r.sub : r.sub === r.title ? '' : r.sub, ...(coKq ? [kq(r)] : [])]) };
}

/** Dòng panel của MỘT đường `/o` (lúc bấm Xuất). Lỗi → sheet Danh sách bỏ trống kèm lý do, tệp vẫn tải (không mất bảng chính). */
export async function napDanhSach(duong: string): Promise<any[] | string> {
  try { return (await api.get<{ rows?: any[] }>(duong)).rows ?? []; } catch (e: any) { return e?.message ?? t('Không tải được danh sách'); }
}
export const sheetDanhSachHoacLoi = (r: any[] | string, gv?: (r: any) => string | null): SheetDep =>
  (typeof r === 'string' ? { ten: t('Danh sách'), dau: [[t('Không tải được danh sách')]], hang: [[r]], coDinhCot: false } : sheetDanhSach(r, gv));

/**
 * Bảng cũ dạng mảng hai chiều (`bangXuatTongHop`: dòng 0 mô tả, dòng 1 trống, dòng 2 nhóm cột, dòng 3 tên cột, cuối = Tổng) → sheet có định dạng.
 * Giữ ĐỦ cột cũ (Excel Test + SOS không mất cột); nhóm liền nhau cùng tên gộp ô; cột SOS 1 · 2 · 3 tô màu như web.
 */
export function sheetTuBangCu(ten: string, aoa: readonly (readonly (string | number)[])[]): SheetDep {
  const g = (aoa[2] ?? []).map((x) => String(x ?? ''));
  const cot = (aoa[3] ?? []).map((x) => String(x ?? ''));
  const mau = cot.map((c, i): MauXlsx | undefined => {
    const n = `${g[i] ?? ''} ${c}`;
    return /SOS 1/.test(n) ? 'sos1' : /SOS 2/.test(n) ? 'sos2' : /SOS 3/.test(n) ? 'sos3' : undefined;
  });
  const than = aoa.slice(4).map((r) => r.map((v, i) => (typeof v === 'number' ? soX(v, mau[i]) : v)));
  const tong = than.length ? [than.length - 1] : [];
  if (!g.some(Boolean)) return { ten, dau: [cot], hang: than, tong };
  /* Hàng nhóm: nhãn nhóm ở ô đầu, ô sau cùng nhóm = null (gộp ngang); cột không nhóm = tên cột ở hàng trên + null hàng dưới (gộp dọc). */
  const tren = cot.map((c, i) => (!g[i] ? c : i > 0 && g[i] === g[i - 1] ? null : g[i]));
  const duoi = cot.map((c, i) => (!g[i] ? null : c));
  return { ten, dau: [tren, duoi], hang: than, tong };
}
