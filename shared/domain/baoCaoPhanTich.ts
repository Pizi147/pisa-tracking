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
  /** V5 `05` #1 (K9): Đạt MT theo HV — lượt mới nhất CHỐT trong kỳ của mỗi em; `mau` = em đủ Overall; `chuaDu` ngoài mẫu. Chỉ Fast Track. */
  datMt: { dat: number; mau: number; chuaDu: number } | null;
  /** `sosHienTai` (SL2): chỉ số `hv-sos-hien-tai` — cùng số Tổng quan · Đang SOS, số hôm nay. */
  /** `thiThangNay` (P4): HV có ngày thi thật trong tháng hiện tại — số hôm nay, panel `o=thi-thang-nay`. */
  chuY: { chuaDiemHv: number; chuaDiemBai: number; caseChuaChotHv: number; caseChuaChot: number; sosHienTai: number; thiThangNay: number };
  casePa: { caseMo: number; paKetQua: number; quaHanChotPa: number; quaHanKetQuaPa: number };
  /** SV-SO3 (`10` mục 5): bảng "Kết quả MT" — luôn đủ 5 hàng MT0 · MT1 · MT2 · MT3+ · Thi thật. Chỉ Fast Track. */
  kqMt: DongKqMt[] | null;
};

/**
 * KẾT QUẢ MT (SV-SO3, `10` mục 5, `thiet-ke/v5/phan-tich.html`) — mỗi HV một lần mỗi hàng: lượt MỚI NHẤT của em thuộc hàng đó có tuần thi trong kỳ (P8);
 * Thi thật theo ngày thi. Overall so với TARGET đầu ra của chính em (không phải kỳ vọng MT). `hv` = số em của hàng; `mau` = em có Overall (mẫu số %);
 * mẫu 0 → web ghi "Chưa có dữ liệu". `soTruoc`: Overall so lượt trước của em trong cùng lộ trình (Thi thật: so MT cuối) — em không có lượt trước có Overall
 * không vào. Em KCK (không Target cam kết) không vào bảng. Bấm số → `o=kq-mt:<luot>:<cot>`.
 */
export const LUOT_KQ_MT = ['mt0', 'mt1', 'mt2', 'mt3+', 'thi'] as const;
export type LuotKqMt = (typeof LUOT_KQ_MT)[number];
export const NHAN_LUOT_KQ_MT: Record<LuotKqMt, string> = { mt0: 'MT0', mt1: 'MT1', mt2: 'MT2', 'mt3+': 'MT3+', thi: t('Thi thật') };
export const COT_KQ_MT = ['dat', 'thieu-0.5', 'thieu-1.0', 'thieu-1.5', 'chua-du'] as const;
export type CotKqMt = (typeof COT_KQ_MT)[number];
export const NHAN_COT_KQ_MT: Record<CotKqMt, string> = {
  dat: t('Đạt Target'), 'thieu-0.5': t('Thiếu 0.5'), 'thieu-1.0': t('Thiếu 1.0'), 'thieu-1.5': t('Thiếu ≥ 1.5'), 'chua-du': t('Chưa đủ'),
};
export type DongKqMt = { luot: LuotKqMt; hv: number; mau: number; dem: Record<CotKqMt, number>; soTruoc: { tang: number; bang: number; giam: number } };

/** MT3, MT4… gộp một hàng "MT3+". */
export const luotKqMt = (mt: number): LuotKqMt => (mt >= 3 ? 'mt3+' : mt === 2 ? 'mt2' : mt === 1 ? 'mt1' : 'mt0');

/** Cột của một em: chưa có Overall (hoặc chưa có Target) → Chưa đủ; khoảng thiếu làm tròn bậc 0.5 (band) trước khi so. */
export function cotKqMt(ovr: number | null, target: number | null): CotKqMt {
  if (ovr === null || target === null) return 'chua-du';
  const thieu = Math.round((target - ovr) * 2) / 2;
  return thieu <= 0 ? 'dat' : thieu <= 0.5 ? 'thieu-0.5' : thieu <= 1 ? 'thieu-1.0' : 'thieu-1.5';
}

/** "So 2 tuần trước": chữ trung tính, nói rõ đơn vị — "Tăng 2 HV" · "Giảm 1 HV" · "Không đổi" (không mũi tên, không màu). */
export function chuSoTruoc(nay: number, truoc: number): string {
  if (nay === truoc) return t('Không đổi');
  return nay > truoc ? t('Tăng {n} HV', { n: nay - truoc }) : t('Giảm {n} HV', { n: truoc - nay });
}

/** Tỷ lệ đạt Mock = Đạt ÷ (Đạt + Chưa đạt); Chưa đủ điểm không vào mẫu số. Không có mẫu → null. */
export const tyLeDatMock = (m: { dat: number; chuaDat: number }): number | null =>
  m.dat + m.chuaDat > 0 ? Math.round((100 * m.dat) / (m.dat + m.chuaDat)) : null;
