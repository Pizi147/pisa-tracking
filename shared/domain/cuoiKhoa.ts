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
import { CHUONG_TRINH_KHONG_CHIA_MON, RATIO_PASS_THRESHOLD, REGULAR_SKILLS, laChuongTrinhGoc, programmeOf, tenMonNgan, type RegularSkill } from './normal.ts';
import { roundToHalf } from './tongKetLoTrinh.ts';
import { NORMAL_LADDER } from './fasttrack.ts';
import type { ProgrammeCode } from './normal.ts';
import { kyHieuLop } from './tenLop.ts';
import { ngay } from './hienThiNgay.ts';
import { dich as dichChuoi, dichChu, kem, t, type ChuKhoa } from '../i18n/index.ts';

export type DaiCuoiKhoa = 'duoi_50' | '50_59' | '60_69' | 'dat';
/** Ngưỡng dưới của hai dải giữa; ngưỡng Pass là ngưỡng đạt của LỚP (OV-6b1, mặc định `RATIO_PASS_THRESHOLD`). */
const NGUONG_HOC_LAI = 0.5;
const NGUONG_LEN = 0.6;
/** Mini Test ≥ 70 % là đạt (= `RATIO_PASS_THRESHOLD`). PR-Pb2-a: chuyển lên shared — ghi Mini Test, Hiệu quả PA và Tổng hợp Test đọc chung. */
export const NGUONG_MINI_TEST = RATIO_PASS_THRESHOLD;

export function daiCuoiKhoa(tyLe: number, nguong: number = RATIO_PASS_THRESHOLD): DaiCuoiKhoa {
  if (tyLe >= nguong) return 'dat';
  if (tyLe >= NGUONG_LEN) return '60_69';
  return tyLe >= NGUONG_HOC_LAI ? '50_59' : 'duoi_50';
}

/**
 * SV-LOP (V5 `08` R3a): ĐÁNH GIÁ ĐẦU RA lớp thường — CHỈ khi bài Final đủ điểm mọi môn (`du`); trước đó `cho-final` ("Chờ Final"), không Đạt / Chưa đạt
 * tạm. Đủ thì Đạt khi % tổng (chưa làm tròn) ≥ ngưỡng của lớp — cùng ngưỡng với dải Cuối khoá. Lớp FT không qua hàm này (luật hiện có).
 */
export type DanhGiaDauRa = { trangThai: 'cho-final' | 'dat' | 'chua-dat'; tyLe: number | null; scored: number; required: number };
export function danhGiaDauRa(e: { du: boolean; tyLe: number | null; scored: number; required: number; nguong: number | null } | null | undefined): DanhGiaDauRa {
  if (!e || !e.du || e.tyLe === null) return { trangThai: 'cho-final', tyLe: null, scored: e?.scored ?? 0, required: e?.required ?? 0 };
  return { trangThai: e.tyLe >= (e.nguong ?? RATIO_PASS_THRESHOLD) ? 'dat' : 'chua-dat', tyLe: e.tyLe, scored: e.scored, required: e.required };
}

/**
 * PR-CL (B5, §7): "Kết quả không phù hợp lộ trình" — đã chốt lên (lên lớp / Lên FT) mà Final < 50%, hoặc học lại mà Final ≥ 70%.
 * Tỷ lệ CHƯA làm tròn; `null` (chưa đủ môn) hoặc hướng khác → false.
 */
export function khongPhuHopLoTrinh(huong: string, tyLe: number | null, nguong: number = RATIO_PASS_THRESHOLD): boolean {
  if (tyLe === null) return false;
  return ((huong === 'len_lop' || huong === 'fast_track') && tyLe < NGUONG_HOC_LAI) || (huong === 'hoc_lai' && tyLe >= nguong);
}

export type BoTroMienPhi = { soBuoi: number; soTuan: 1 | 2; theoMon: boolean; mon: string[] /* ô chuẩn của lớp CŨ */ };
/** 'len' = lên bậc kế hoặc sang FT; null = 50–59, Quản lý cân nhắc. */
export type HuongGoiY = 'hoc_lai' | 'len' | null;
export type GoiYCuoiKhoa = {
  dai: DaiCuoiKhoa; tyLe: number; huong: HuongGoiY;
  /** 50–59%: chip "Quản lý cân nhắc" ở màn Chuyển lớp, bắt chọn trước khi gửi. */
  canQuanLy: boolean;
  boTroNeuLen: BoTroMienPhi | null;     // 50–59 (nếu Quản lý cho lên) và 60–69
  baoPhTvv: boolean;                    // < 50 (50–59 mà Quản lý chọn học lại thì máy chủ tự thêm — Q6)
  nhan: string;
  /** PR-EN-c: khoá của `nhan` (máy chủ dựng, web dịch bằng `nhanGoiY`). */
  nhanK?: ChuKhoa;
  nhanNgan: string;
  /** Chữ ô "Hướng gợi ý" ở Excel: `Học lại FOU` · `QL cân nhắc` · `Lên BE + bổ trợ` · `Pass`. */
  nhanExcel: string;
  /** PR-S5F-a (mockup 20, cột "Hệ thống gợi ý" của màn Chuyển lớp): HƯỚNG — `Lên BE` · `Lên BE + bổ trợ` · `Học lại FOU` · `Quản lý cân nhắc`. */
  nhanHuong: string;
};

/** Tên hiện của chương trình đích: lớp kế theo bậc, ELE → FT. */
export const tenBacKe = (ct: ProgrammeCode): string => {
  const ke = NORMAL_LADDER[ct];
  return ke ? kyHieuLop(ke, null) ?? ke : 'FT';
};
const tenBac = (ct: ProgrammeCode): string => kyHieuLop(ct, null) ?? ct;

/** "L, G+V": tên ngắn các môn trượt theo chương trình cũ. */
export const chuMonTruot = (ct: string, mon: readonly string[]): string => mon.map((m) => tenMonNgan(ct, m)).join(', ');

/**
 * PF3 / §6.3 / V: Pre FOU không chia môn — 4 buổi (50–59) hoặc 2 buổi (60–69) một ô Tổng hợp.
 * FOU/BE: PR-CT2 (§8) — mỗi môn trượt (< 70%) 1 buổi/tuần: 50–59 → 2 buổi/môn · 2 tuần, 60–69 → 1 buổi/môn · 1 tuần.
 * ELE không bổ trợ ("lên" = FT; `goiYCuoiKhoa` trả null).
 */
function boTro(ct: ProgrammeCode, dai: '50_59' | '60_69', monTruot: readonly string[]): BoTroMienPhi | null {
  const soTuan = dai === '50_59' ? 2 : 1;
  if (CHUONG_TRINH_KHONG_CHIA_MON.includes(ct)) return { soBuoi: dai === '50_59' ? 4 : 2, soTuan, theoMon: false, mon: ['tong_hop'] };
  return monTruot.length ? { soBuoi: monTruot.length * soTuan, soTuan, theoMon: true, mon: [...monTruot] } : null;
}

/** `null` khi chưa đủ điểm (không gợi ý, không đoán) hoặc không phải lớp thường. `monTruot` = ô chuẩn của lớp cũ dưới ngưỡng; `nguong` = ngưỡng đạt của lớp. */
export function goiYCuoiKhoa(x: { ct: string | null; tyLe: number | null; monTruot: readonly string[]; nguong?: number }): GoiYCuoiKhoa | null {
  /* OV-6b2: chỉ chương trình có bậc kế (FOU/BE/ELE/Pre FOU) — chương trình Quản trị tạo không có luật % Cuối khoá. */
  const ct = programmeOf(x.ct) as ProgrammeCode | null;
  if (!ct || ct === 'FT' || !laChuongTrinhGoc(ct) || x.tyLe === null || !Number.isFinite(x.tyLe)) return null;
  const dai = daiCuoiKhoa(x.tyLe, x.nguong);
  const ke = tenBacKe(ct);
  const chung = { dai, tyLe: x.tyLe };
  const dong = (huong: HuongGoiY, canQuanLy: boolean, bo: BoTroMienPhi | null, baoPhTvv: boolean, nhanK: ChuKhoa, nhanNgan: string, nhanExcel: string): GoiYCuoiKhoa => ({
    ...chung, huong, canQuanLy, boTroNeuLen: bo, baoPhTvv, nhan: dichChu(nhanK), nhanK, nhanNgan: dichChuoi(nhanNgan), nhanExcel,
    nhanHuong: canQuanLy ? 'Quản lý cân nhắc' : huong === 'hoc_lai' ? `Học lại ${tenBac(ct)}` : `Lên ${ke}${dai === '60_69' && bo ? ' + bổ trợ' : ''}`,
  });
  if (dai === 'dat') return dong('len', false, null, false, { chu: 'Pass' }, '→ Pass', 'Pass');
  if (dai === 'duoi_50') return dong('hoc_lai', false, null, true, kem('Học lại {bac}', { bac: tenBac(ct) }), '→ học lại', `Học lại ${tenBac(ct)}`);
  const bo = ct === 'ELE' ? null : boTro(ct, dai, x.monTruot);   // PR-CT2 (§8): ELE lên = FT, không bổ trợ
  const chuBo: ChuKhoa = !bo ? { chu: '' } : bo.theoMon
    ? kem(' + bổ trợ miễn phí {n} buổi ({mon}) · {tuan} tuần · Mini Test sau buổi cuối', { n: bo.soBuoi, mon: chuMonTruot(ct, bo.mon), tuan: bo.soTuan })
    : kem(' + bổ trợ miễn phí {n} buổi · {tuan} tuần · Mini Test sau buổi cuối', { n: bo.soBuoi, tuan: bo.soTuan });
  if (dai === '50_59') {
    return dong(null, true, bo, false, kem('Quản lý cân nhắc: học lại {bac} hoặc lên {ke}{bo}', { bac: tenBac(ct), ke, bo: chuBo }), '→ QL cân nhắc', 'QL cân nhắc');
  }
  return dong('len', false, bo, false, kem('Lên {ke}{bo}', { ke, bo: chuBo }), bo ? '→ lên + bổ trợ' : '→ lên', bo ? `Lên ${ke} + bổ trợ` : `Lên ${ke}`);
}

/** PR-EN-c: chữ gợi ý theo tiếng của trang — gợi ý máy chủ dựng mang `nhanK`. */
export function nhanGoiY(g: { nhan: string; nhanK?: ChuKhoa }): string {
  return g.nhanK ? dichChu(g.nhanK) : dichChuoi(g.nhan);
}

/** PR-CT2 (§8): BE/ELE sang FT thì không bổ trợ Final (FT có lộ trình riêng); còn lại theo `goiYCuoiKhoa`. */
export const coBoTroFinal = (ct: string | null, toFt: boolean): boolean => !(toFt && (ct === 'BE' || ct === 'ELE'));

/** Lúc thi hành lệnh Cuối khoá: lên (lớp kế / FT) + bổ trợ (60–69 %, hoặc 50–59 % QL cho lên) → mỗi môn trượt một Case bổ trợ; BE/ELE → FT không (PR-CT2). */
export const coBoTroKhiChot = (huong: string | null, goiY: GoiYCuoiKhoa | null, ct: string | null, toFt: boolean): boolean =>
  (huong === 'len_lop' || huong === 'fast_track') && !!goiY?.boTroNeuLen && coBoTroFinal(ct, toFt);
/** Báo PH qua TVV: Final < 50 % LUÔN (kể cả QL cho lên — PTA Plan 25/10), 50–59 % mà QL chọn học lại (Q6). Tạm dừng / Dừng học không qua đây. */
export const coBaoPhKhiChot = (huong: string | null, goiY: GoiYCuoiKhoa | null): boolean =>
  !!goiY && (huong === 'len_lop' || huong === 'fast_track' || huong === 'hoc_lai') && (goiY.baoPhTvv || (huong === 'hoc_lai' && goiY.dai === '50_59'));

/**
 * TÓM TẮT CHÂN trang Cuối khoá (GPT 3, N17) — CÙNG luật máy chủ chạy lúc thi hành (`sauChuyenCuoiKhoa`: `coBoTroKhiChot`, `coBaoPhKhiChot`, Case Kỳ vọng).
 * Case Tutor = mỗi kỹ năng Không đạt Kỳ vọng do Trung tâm; Học viên = ghi phương án, không Case (N17).
 */
export type DongTacDong = { huong: string | null; goiY: GoiYCuoiKhoa | null; ct: string | null; toFt: boolean;
  kyVong: { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: readonly string[] } | null };
export function tacDongChot(ds: readonly DongTacDong[]): { caseBoTro: number; baoPh: number; caseTutor: number; chuaHuong: number } {
  let caseBoTro = 0, baoPh = 0, caseTutor = 0, chuaHuong = 0;
  for (const d of ds) {
    if (!d.huong) { chuaHuong += 1; continue; }
    if (coBoTroKhiChot(d.huong, d.goiY, d.ct, d.toFt)) caseBoTro += d.goiY!.boTroNeuLen!.mon.length;
    if (coBaoPhKhiChot(d.huong, d.goiY)) baoPh += 1;
    if (d.huong === 'fast_track' && d.kyVong && !d.kyVong.dat && d.kyVong.nguyenNhan === 'trung_tam') caseTutor += d.kyVong.mon.length;
  }
  return { caseBoTro, baoPh, caseTutor, chuaHuong };
}

/** M-05, Q4: buổi cuối = Chủ nhật của tuần cuối PA (`batDau` là thứ Hai); Mini Test hạn +2 ngày LỊCH (không phải `hanTheoNgay`). */
export function lichBoTro(x: { batDau: string; soTuan: 1 | 2 }): { ngayMiniTest: string; hanMiniTest: string } {
  const cong = (d: string, n: number) => new Date(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const ngayMiniTest = cong(x.batDau, 7 * x.soTuan - 1);
  return { ngayMiniTest, hanMiniTest: cong(ngayMiniTest, 2) };
}

/** M-21: lên FT thì Writing của lớp thường → Writing 2 (FT tách W1/W2); các ô khác giữ, `tong_hop` giữ. */
export const kyNangLopDich = (mon: string, denFt: boolean): string => (denFt && mon === 'writing' ? 'writing2' : mon);

/** PR-KV (đặc tả 08/10 §3): Đạt Kết quả đầu ra = Overall MT0 ≥ ngưỡng của chương trình lớp nguồn. OV-3b: FOU "Overall > 3.5" = ≥ 4 (Overall làm tròn 0.5). */
export const NGUONG_KY_VONG: Readonly<Record<string, number>> = { FOU: 4, BE: 4, ELE: 4.5 };
export type GoiYKyVong = { overall: number; dat: boolean; monTruot: RegularSkill[] };
/**
 * Gợi ý điền sẵn từ band MT0 (L R W S): Overall = trung bình các kỹ năng CÓ band, làm tròn 0.5 (cần ≥ 3/4 kỹ năng có band — chủ SP 10/10; W có band khi đủ W1 + W2);
 * `monTruot` chỉ gồm kỹ năng có band dưới ngưỡng — kỹ năng thiếu là "chưa thi", không tự thành trượt. Dưới 3 band / không BE-ELE → null.
 */
export function goiYKyVong(ct: string | null | undefined, bands: Partial<Record<RegularSkill, number | null>>): GoiYKyVong | null {
  const nguong = NGUONG_KY_VONG[programmeOf(ct) ?? ''];
  const co = REGULAR_SKILLS.filter((k) => typeof bands[k] === 'number');
  if (nguong === undefined || co.length < 3) return null;
  const overall = roundToHalf(co.reduce((a, k) => a + bands[k]!, 0) / co.length);
  return { overall, dat: overall >= nguong, monTruot: co.filter((k) => bands[k]! < nguong) };
}

/** FOU IELTS > 3.5 · BE IELTS 4.0 · ELE IELTS 4.5–5.0 (§6.4, OV-3b, quy chế lớp thường) — chỉ nhắc chữ, không lưu Placement. */
export const KY_VONG_DAU_RA: Readonly<Record<string, string>> = { FOU: 'FOU IELTS > 3.5', BE: 'BE IELTS 4.0', ELE: 'ELE IELTS 4.5–5.0' };

/**
 * P9b (N17): chữ cột "Kết quả đầu ra" máy ghi ở trang Cuối khoá — Pass · Lên BE + bổ trợ · Quản lý cân nhắc · Học lại FOU · Quản lý báo phụ huynh qua TVV.
 * Không nút, không nguyên nhân; cùng dải `goiYCuoiKhoa`.
 */
export function chuDaiKetQua(g: GoiYCuoiKhoa): string {
  if (g.dai === 'dat') return 'Pass';
  if (g.dai === 'duoi_50') return t('{nhan} · Quản lý báo phụ huynh qua TVV', { nhan: dichChuoi(g.nhanHuong) });
  return dichChuoi(g.nhanHuong);
}

export type HopKetLuanVao = {
  ct: string | null; tyLe: number | null; scored: number; required: number;
  mon: readonly { skill: string; ratio: number | null }[];
  goiY: GoiYCuoiKhoa | null;
  quyetDinh: { huong: string; luc: string } | null;
  ketLuanFt: { dat: boolean | null; nguyenNhan: string | null; mon: readonly string[] } | null;
  homNay?: string | null;
  /** OV-11d (HV-17): em có lệnh / lộ trình Lên FT từ lớp này — chỉ khi đó có dòng Kỳ vọng. */
  lenFt?: boolean;
};
export type HopKetLuan = {
  /** Dòng 1, tầng 1: `Cuối khoá 64%` (thiếu môn: `Cuối khoá · 3/4 môn có điểm`). */
  chinh: string;
  /** Chữ phụ cạnh số: `L 70 · R 58 · G+V 66 · P 62`. */
  phu: string | null;
  /** Dòng 2: MỘT nhãn trạng thái/hướng; null khi chưa đủ điểm. */
  nhan: string | null;
  tone: 'ok' | 'warn' | 'bad' | 'muted';
  /** FOU/BE/ELE lên FT: dòng Kỳ vọng (T49, N22 ②) — null với chương trình khác. */
  kyVong: { nhan: string; trangThai: string; daDanhDau: boolean } | null;
};

/** Chữ hộp "Kết luận khoá" ở hồ sơ HV (K3 §4b, K3-43) — MỘT hàm, sáu trạng thái: thiếu môn · Pass · lên + bổ trợ · QL cân nhắc · QL đã quyết · học lại. */
export function chuHopKetLuan(x: HopKetLuanVao): HopKetLuan {
  const ct = programmeOf(x.ct) as ProgrammeCode | null;   // có gợi ý (`x.goiY`) chỉ khi là chương trình gốc — xem `goiYCuoiKhoa`
  const kyVong = ct && KY_VONG_DAU_RA[ct] && x.lenFt
    ? {
      nhan: t('Kỳ vọng {kv}', { kv: KY_VONG_DAU_RA[ct] }),
      daDanhDau: x.ketLuanFt?.dat !== null && x.ketLuanFt?.dat !== undefined,
      trangThai: x.ketLuanFt?.dat === true ? t('Đạt')
        : x.ketLuanFt?.dat === false
          ? `${t('Không đạt')} · ${x.ketLuanFt.nguyenNhan === 'hoc_sinh' ? t('Học viên') : `${t('Trung tâm')}${x.ketLuanFt.mon.length ? ` · ${x.ketLuanFt.mon.map((m) => tenMonNgan(ct, m)).join(', ')}` : ''}`}`
          : t('Chưa đánh dấu'),
    }
    : null;
  const g = x.goiY;
  if (x.tyLe === null || !g || !ct) {
    return { chinh: `Final Test · ${x.required ? t('{a}/{b} môn có điểm', { a: x.scored, b: x.required }) : t('chưa có điểm')}`, phu: null, nhan: null, tone: 'muted', kyVong };
  }
  const phu = x.mon.map((m) => `${tenMonNgan(ct, m.skill)} ${m.ratio === null ? '—' : Math.round(m.ratio * 100)}`).join(' · ');
  const chinh = `Final Test ${Math.round(x.tyLe * 100)}%`;
  if (g.dai === 'dat') return { chinh, phu, nhan: 'Pass', tone: 'ok', kyVong };
  if (g.dai === '60_69') return { chinh, phu, nhan: nhanGoiY(g), tone: 'warn', kyVong };
  if (g.dai === 'duoi_50') return { chinh, phu, nhan: t('{nhan} · Quản lý báo phụ huynh qua TVV', { nhan: nhanGoiY(g) }), tone: 'bad', kyVong };
  /* 50–59%: chưa quyết → Quản lý cân nhắc; đã chuyển thì hiện điều Quản lý đã quyết (Q30-3, không còn thẻ). */
  if (!x.quyetDinh) return { chinh, phu, nhan: t('Quản lý cân nhắc: học lại hoặc lên (chọn khi chuyển lớp)'), tone: 'warn', kyVong };
  const dich = x.quyetDinh.huong === 'hoc_lai' ? t('Học lại {bac}', { bac: tenBac(ct) })
    : g.boTroNeuLen && coBoTroFinal(ct, x.quyetDinh.huong === 'fast_track') ? t('Lên {bac} + bổ trợ', { bac: tenBacKe(ct) }) : t('Lên {bac}', { bac: tenBacKe(ct) });   // PR-CT2: ELE / BE → FT không bổ trợ
  return { chinh, phu, nhan: t('QL đã quyết: {kl} · {ngay}', { kl: dich, ngay: ngay(x.quyetDinh.luc.slice(0, 10), x.homNay) }), tone: 'warn', kyVong };
}
