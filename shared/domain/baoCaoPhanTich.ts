/**
 * BÁO CÁO (OV-15e, C24–C26, mockup 3 mục 3) — tab đầu của Phân tích, mặc định 2 tuần hoàn chỉnh vừa qua. Kiểu chung máy chủ (`server/src/phanTich/baoCao.ts`)
 * ↔ web (`web/src/modules/phanTich/BaoCao.tsx`). Test, SOS, Kết quả Mock, PA có kết quả = TRONG KỲ; HV cần chú ý, Case mở = TẠI LÚC XEM.
 * Không có khung Đã thi – Chờ KQ (C25). Mỗi số bấm được mở ĐÚNG tập sinh ra nó (`/phan-tich/bao-cao/o?o=…` hoặc chỉ số trong sổ).
 */
import { t } from '../i18n/index.ts';

/** `khoa` mở panel (`o=gv:<khoa>`): id GV · 0 chưa phân công · -1 Speaking chấm chéo (chưa ai chấm — không phải nợ của GV nào). */
export type GvQuaHanBc = { khoa: number; gvId: number | null; ten: string; kyNang: string[]; bai: number; lop: string[] };
/** SOS TRONG KỲ (SL2): HV theo mức cao nhất — cùng luật tab Kết quả thi (gồm SOS tạm); `tam` = HV chỉ có lượt SOS chưa chốt. */
export type DongSosBc = { classId: number; lop: string; sos1: number; sos2: number; sos3: number; nay: number; tam: number; truoc: number };
export type BaoCaoKq = {
  tu: string; den: string; ct: 'ft' | 'thuong'; homNay: string;
  test: { hvDaThi: number; luotLop: number; baiDaCham: number; baiTong: number; quaHan: number; gvQuaHan: GvQuaHanBc[] };
  /** Chỉ Fast Track (lớp thường không có SOS / Mock). */
  sos: { hang: DongSosBc[]; tong: DongSosBc } | null;
  mock: { dat: number; chuaDat: number; chuaDu: number } | null;
  /** `sosHienTai` (SL2): chỉ số `hv-sos-hien-tai` — cùng số Tổng quan · Đang SOS, số hôm nay. */
  chuY: { chuaLich: number | null; chuaDiemHv: number; chuaDiemBai: number; caseChuaChotHv: number; caseChuaChot: number; sosHienTai: number };
  casePa: { caseMo: number; paKetQua: number; quaHanChotPa: number; quaHanKetQuaPa: number };
};

/** "So 2 tuần trước": chữ trung tính, nói rõ đơn vị — "Tăng 2 HV" · "Giảm 1 HV" · "Không đổi" (không mũi tên, không màu). */
export function chuSoTruoc(nay: number, truoc: number): string {
  if (nay === truoc) return t('Không đổi');
  return nay > truoc ? t('Tăng {n} HV', { n: nay - truoc }) : t('Giảm {n} HV', { n: truoc - nay });
}

/** Tỷ lệ đạt Mock = Đạt ÷ (Đạt + Chưa đạt); Chưa đủ điểm không vào mẫu số. Không có mẫu → null. */
export const tyLeDatMock = (m: { dat: number; chuaDat: number }): number | null =>
  m.dat + m.chuaDat > 0 ? Math.round((100 * m.dat) / (m.dat + m.chuaDat)) : null;
