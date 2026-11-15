/**
 * "BẠN ĐÃ GHI" (overhaul V6 đợt 4 — H1 / H2, mockup ⑫ khung A, B, E1, E2): câu GV đã ghi trên web (nhận xét bài Test, kết quả PA, mô tả Case, vi phạm / xử lý,
 * Tình hình học tập) gợi ý cho ô chữ Báo cáo PH / bàn giao. KHÔNG AI, KHÔNG tự điền: GV bấm "Chèn". Máy chủ: `GET /classes/:id/chu-da-ghi` (một lần cho lớp).
 */
import { t } from '../i18n/index.ts';
import { tuanLich } from './hienThiNgay.ts';
import { INTERVENTION_KIND_LABEL, outcomeLabelFor, type InterventionKind } from './cases.ts';
import { nhanLoaiXuLy } from './yThuc.ts';
import { tenMonNgan } from './normal.ts';

/**
 * Một câu đã ghi. `loai`: nx-mt (nhận xét bài Test) · kq-pa (kết quả PA) · case (mô tả Case đang mở) · vi-pham · xu-ly · tinh-hinh (Tình hình học tập GV báo TVV
 * / GVCN trả lời TVV). `ngay` ISO; `tuan` thứ Hai tuần thi (nx-mt). Nguồn (web ghép chữ, dịch được): `luot` "MT2" · `diem` band hoặc "18/25" (nx-mt) ·
 * `pa` { kind, moTa } + `tienTrien` (kq-pa) · `xuLy` { kind, ten } (xu-ly) · `nguoiId` / `nguoi` người ghi.
 */
export type ChuDaGhi = {
  loai: 'nx-mt' | 'kq-pa' | 'case' | 'vi-pham' | 'xu-ly' | 'tinh-hinh'; ngay: string; chu: string;
  tuan?: string | null; luot?: string | null; diem?: string | null; pa?: { kind: string; moTa: string | null } | null; tienTrien?: string | null;
  xuLy?: { kind: string; ten: string | null } | null; nguoiId: number | null; nguoi: string | null;
};
/** Một em: câu theo mã kỹ năng (`writing1`, `reading`…) + phần Chung (vi phạm · xử lý · tình hình · Case tổng hợp). */
export type ChuDaGhiEm = { id: number; kyNang: Record<string, ChuDaGhi[]>; chung: ChuDaGhi[] };
export type DuLieuChuDaGhi = { khoang: { tu: string; den: string }; em: ChuDaGhiEm[] };

/** Câu cho MỘT phần (khoá phần Báo cáo PH / môn bàn giao): `chung` → phần Chung; `writing` gồm W1 + W2. Trùng chữ → một dòng (giữ dòng mới nhất). Mới nhất trước. */
export function chuCuaPhan(em: ChuDaGhiEm | null | undefined, khoa: string): ChuDaGhi[] {
  if (!em) return [];
  const ds = khoa === 'chung' ? em.chung
    : (khoa === 'writing' ? ['writing', 'writing1', 'writing2'] : [khoa]).flatMap((k) => em.kyNang[k] ?? []);
  const da = new Set<string>();
  return [...ds].sort((a, b) => b.ngay.localeCompare(a.ngay)).filter((x) => !da.has(x.chu) && !!da.add(x.chu));
}

/** Dòng nguồn: phần đậm (lượt / tên PA / loại) + phần phụ (tuần · điểm / Tiến triển / người khác ghi). `toiId`: người đang xem — chính mình ghi thì không ghi tên. */
export function nguonChuDaGhi(x: ChuDaGhi, toiId: number | null, homNay: string, mon?: string | null): { dau: string; phu: string[] } {
  const tuan = tuanLich(x.tuan ?? x.ngay, homNay);
  const ai = x.nguoi && x.nguoiId !== toiId ? t('{ten} ghi', { ten: x.nguoi }) : null;
  const phu = (...a: (string | null | undefined)[]) => [...a, ai].filter((s): s is string => !!s);
  /* kq-pa: tên LOẠI PA (ngắn, như mockup A1 "PA Bổ trợ Reading"), không mô tả PA — dòng nguồn một dòng còn chỗ cho tuần · Tiến triển. */
  switch (x.loai) {
    case 'nx-mt': return { dau: x.luot ?? t('Test'), phu: phu(tuan, x.diem ? [mon ? tenMonNgan(null, mon) : null, x.diem].filter(Boolean).join(' ') : null) };
    case 'kq-pa': return { dau: (x.pa && INTERVENTION_KIND_LABEL[x.pa.kind as InterventionKind]) || t('Kết quả PA'), phu: phu(tuan, x.tienTrien ? outcomeLabelFor(x.tienTrien) : null) };
    case 'case': return { dau: t('Mô tả Case'), phu: phu(tuan) };
    case 'vi-pham': return { dau: t('Vi phạm'), phu: phu(tuan) };
    case 'xu-ly': return { dau: x.xuLy ? nhanLoaiXuLy(x.xuLy.kind, x.xuLy.ten) : t('Xử lý'), phu: phu(tuan) };
    default: return { dau: t('Tình hình học tập'), phu: phu(tuan) };
  }
}

/** Chèn câu vào CUỐI ô (không đè chữ đang có): ô trống → câu; có chữ → thêm một dấu cách (đã có dấu xuống dòng cuối thì giữ). */
export const chenCau = (chu: string, cau: string): string => (!chu.trim() ? cau : /\s$/.test(chu) ? chu + cau : `${chu} ${cau}`);
/** "Hoàn tác chèn": gỡ đúng đoạn đã chèn (lần cuối nó xuất hiện, kèm dấu cách đã thêm); GV đã sửa mất đoạn đó → giữ nguyên ô. */
export function goCau(chu: string, cau: string): string {
  const i = chu.lastIndexOf(cau);
  if (i < 0) return chu;
  const truoc = chu.slice(0, i), sau = chu.slice(i + cau.length);
  return (sau ? truoc + sau.replace(/^ /, '') : truoc.replace(/ $/, ''));
}
