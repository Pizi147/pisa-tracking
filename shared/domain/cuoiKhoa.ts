/**
 * CUỐI KHOÁ LỚP THƯỜNG — luật thuần (T47, T48, T49, T54, §6.3, §6.4, PF3, M-05, M-21).
 *
 * MỘT nơi ra: % tổng → dải → hướng gợi ý → bổ trợ miễn phí nếu lên. Máy chủ (`normal/cuoiKhoa.ts`), lưới, hồ sơ HV,
 * Hành trình, Excel, việc, Case sau chuyển và màn Chuyển tiếp lớp (PR-CT) đều đọc hàm ở đây — không nơi nào gõ lại
 * con số 50 / 60 / 70.
 *
 * Dải xét trên tỷ lệ CHƯA làm tròn: 0.595 là 50–59, 0.6 là 60–69, 0.6999 là 60–69, 0.7 là Pass. Làm tròn chỉ để hiện.
 * Hướng gợi ý KHÔNG lưu (sửa điểm thì gợi ý đổi theo); Quản lý quyết ở màn Chuyển lớp (Q30-3: không còn thẻ duyệt).
 */
import { CHUONG_TRINH_KHONG_CHIA_MON, RATIO_PASS_THRESHOLD, programmeOf, tenMonNgan } from './normal.ts';
import { NORMAL_LADDER } from './fasttrack.ts';
import type { ProgrammeCode } from './normal.ts';
import { kyHieuLop } from './tenLop.ts';

export type DaiCuoiKhoa = 'duoi_50' | '50_59' | '60_69' | 'dat';
/** Ngưỡng dưới của hai dải giữa; ngưỡng Pass là `RATIO_PASS_THRESHOLD`. */
const NGUONG_HOC_LAI = 0.5;
const NGUONG_LEN = 0.6;

export function daiCuoiKhoa(tyLe: number): DaiCuoiKhoa {
  if (tyLe >= RATIO_PASS_THRESHOLD) return 'dat';
  if (tyLe >= NGUONG_LEN) return '60_69';
  return tyLe >= NGUONG_HOC_LAI ? '50_59' : 'duoi_50';
}

export type BoTroMienPhi = { soBuoi: number; soTuan: 1 | 2; theoMon: boolean; mon: string[] /* ô chuẩn của lớp CŨ */ };
/** 'len' = lên bậc kế hoặc sang FT; null = 50–59, Quản lý cân nhắc. */
export type HuongGoiY = 'hoc_lai' | 'len' | null;
export type GoiYCuoiKhoa = {
  dai: DaiCuoiKhoa; tyLe: number; huong: HuongGoiY;
  /** 50–59%: chip "Quản lý cân nhắc" ở màn Chuyển lớp, bắt chọn trước khi gửi. */
  canQuanLy: boolean;
  /** Bí danh của `canQuanLy` cho kế hoạch PR-CT viết trước chốt 30/09 — bỏ khi PR-CT đổi tên. */
  canQl: boolean;
  boTroNeuLen: BoTroMienPhi | null;     // 50–59 (nếu Quản lý cho lên) và 60–69
  baoPhTvv: boolean;                    // < 50 (50–59 mà Quản lý chọn học lại thì máy chủ tự thêm — Q6)
  nhan: string;
  nhanNgan: string;
  /** Chữ ô "Hướng gợi ý" ở Excel: `Học lại FOU` · `QL cân nhắc` · `Lên BE + bổ trợ` · `Pass`. */
  nhanExcel: string;
};

/** Tên hiện của chương trình đích: lớp kế theo bậc, ELE → FT. */
const tenBacKe = (ct: ProgrammeCode): string => {
  const ke = NORMAL_LADDER[ct];
  return ke ? kyHieuLop(ke, null) ?? ke : 'FT';
};
const tenBac = (ct: ProgrammeCode): string => kyHieuLop(ct, null) ?? ct;

/** "L, G+V": tên ngắn các môn trượt theo chương trình cũ. */
export const chuMonTruot = (ct: string, mon: readonly string[]): string => mon.map((m) => tenMonNgan(ct, m)).join(', ');

/**
 * PF3 / §6.3 / V: Pre FOU không chia môn — 4 buổi (50–59) hoặc 2 buổi (60–69) một ô Tổng hợp.
 * FOU/BE/ELE: 1 buổi cho MỖI môn trượt (< 70%); 50–59 → 2 tuần, 60–69 → 1 tuần.
 */
function boTro(ct: ProgrammeCode, dai: '50_59' | '60_69', monTruot: readonly string[]): BoTroMienPhi | null {
  const soTuan = dai === '50_59' ? 2 : 1;
  if (CHUONG_TRINH_KHONG_CHIA_MON.includes(ct)) return { soBuoi: dai === '50_59' ? 4 : 2, soTuan, theoMon: false, mon: ['tong_hop'] };
  return monTruot.length ? { soBuoi: monTruot.length, soTuan, theoMon: true, mon: [...monTruot] } : null;
}

/** `null` khi chưa đủ điểm (không gợi ý, không đoán) hoặc không phải lớp thường. `monTruot` = ô chuẩn của lớp cũ có % < 70. */
export function goiYCuoiKhoa(x: { ct: string | null; tyLe: number | null; monTruot: readonly string[] }): GoiYCuoiKhoa | null {
  const ct = programmeOf(x.ct);
  if (!ct || ct === 'FT' || x.tyLe === null || !Number.isFinite(x.tyLe)) return null;
  const dai = daiCuoiKhoa(x.tyLe);
  const ke = tenBacKe(ct);
  const chung = { dai, tyLe: x.tyLe };
  const dong = (huong: HuongGoiY, canQuanLy: boolean, bo: BoTroMienPhi | null, baoPhTvv: boolean, nhan: string, nhanNgan: string, nhanExcel: string): GoiYCuoiKhoa =>
    ({ ...chung, huong, canQuanLy, canQl: canQuanLy, boTroNeuLen: bo, baoPhTvv, nhan, nhanNgan, nhanExcel });
  if (dai === 'dat') return dong('len', false, null, false, 'Pass', '→ Pass', 'Pass');
  if (dai === 'duoi_50') return dong('hoc_lai', false, null, true, `Học lại ${tenBac(ct)}`, '→ học lại', `Học lại ${tenBac(ct)}`);
  const bo = boTro(ct, dai, x.monTruot);
  const chuBo = bo ? ` + bổ trợ miễn phí ${bo.soBuoi} buổi${bo.theoMon ? ` (${chuMonTruot(ct, bo.mon)})` : ''} · ${bo.soTuan} tuần · Mini Test sau buổi cuối` : '';
  if (dai === '50_59') {
    return dong(null, true, bo, false, `Quản lý cân nhắc: học lại ${tenBac(ct)} hoặc lên ${ke}${chuBo}`, '→ QL cân nhắc', 'QL cân nhắc');
  }
  return dong('len', false, bo, false, `Lên ${ke}${chuBo}`, bo ? '→ lên + bổ trợ' : '→ lên', bo ? `Lên ${ke} + bổ trợ` : `Lên ${ke}`);
}

/** M-05, Q4: buổi cuối = Chủ nhật của tuần cuối PA (`batDau` là thứ Hai); Mini Test hạn +2 ngày LỊCH (không phải `hanTheoNgay`). */
export function lichBoTro(x: { batDau: string; soTuan: 1 | 2 }): { ngayMiniTest: string; hanMiniTest: string } {
  const cong = (d: string, n: number) => new Date(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const ngayMiniTest = cong(x.batDau, 7 * x.soTuan - 1);
  return { ngayMiniTest, hanMiniTest: cong(ngayMiniTest, 2) };
}

/** M-21: lên FT thì Writing của lớp thường → Writing 2 (FT tách W1/W2); các ô khác giữ, `tong_hop` giữ. */
export const kyNangLopDich = (mon: string, denFt: boolean): string => (denFt && mon === 'writing' ? 'writing2' : mon);
