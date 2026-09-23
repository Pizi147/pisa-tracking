/**
 * LUẬT THUẦN CỦA KẾ HOẠCH TEST — khu vực Test (spec §3.5 "Kế hoạch Test").
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE và KHÔNG TỰ ĐỌC NGÀY GIỜ: trạng thái một kỹ năng (và nhóm kỹ năng) trên lưới,
 * gộp chip L · R · W · S theo tuần, nhãn tuần trong khoá, tuần đa số, đợt đã hoàn tất hay chưa (R11), tiêu đề tab theo
 * phạm vi lớp, tóm tắt màn xem trước của Xếp lịch hàng loạt, và "vào muộn". Máy chủ và giao diện cùng gọi một nơi.
 */

import { studyWeekOf } from './fasttrack.ts';
import { tuanKhoa } from './hienThiNgay.ts';

export type TrangThaiO = 'xong' | 'da-xep' | 'da-doi' | 'chua-xep' | 'khong-yeu-cau';

/**
 * Trạng thái một Ô NHÓM (RLW hoặc S) của một đợt: không có kỹ năng bắt buộc nào trong nhóm → `khong-yeu-cau`;
 * mọi kỹ năng bắt buộc đã `xong` → `xong`; còn kỹ năng bắt buộc chưa có tuần → `chua-xep`; còn lại mà có kỹ năng
 * đã bị dời vì vắng (Q5) → `da-doi`; hết các trường hợp trên → `da-xep`.
 */
export function trangThaiNhom(
  kn: Array<{ batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean }>,
): TrangThaiO {
  const batBuoc = kn.filter((k) => k.batBuoc);
  if (batBuoc.length === 0) return 'khong-yeu-cau';
  if (batBuoc.every((k) => k.xong)) return 'xong';
  if (batBuoc.some((k) => k.tuan === null)) return 'chua-xep';
  if (batBuoc.some((k) => k.daDoi)) return 'da-doi';
  return 'da-xep';
}

/**
 * TUẦN NHIỀU EM NHẤT của một nhóm (dùng cho ô nhóm RLW khi L/R/W lệch tuần — Q6). Hoà phiếu thì chọn tuần SỚM HƠN:
 * một quyết định phải có, và "sớm hơn" là lựa chọn an toàn (không đẩy ai qua muộn hơn nhu cầu). `khac` liệt kê các
 * tuần còn lại kèm số em, để giao diện viết "+1" và tooltip từng kỹ năng.
 */
export function tuanDaSo(
  tuan: Array<string | null>,
): { tuan: string | null; khac: Array<{ tuan: string; n: number }> } {
  const dem = new Map<string, number>();
  for (const t of tuan) { if (t) dem.set(t, (dem.get(t) ?? 0) + 1); }
  if (dem.size === 0) return { tuan: null, khac: [] };
  let best: string | null = null;
  let bestN = -1;
  for (const [t, n] of dem) {
    if (n > bestN || (n === bestN && best !== null && t < best)) { best = t; bestN = n; }
  }
  const khac = [...dem.entries()]
    .filter(([t]) => t !== best)
    .map(([t, n]) => ({ tuan: t, n }))
    .sort((a, b) => a.tuan.localeCompare(b.tuan));
  return { tuan: best, khac };
}

/**
 * ĐỢT ĐÃ HOÀN TẤT (R11, Q2): mọi kỹ năng BẮT BUỘC, CHƯA HUỶ phần thi, đều có điểm (FT: đủ band theo `coDiem`; lớp
 * thường: có `raw_score` theo `coDiem`) hoặc — CHỈ Fast Track (`ielts_band`) — đã có dấu "-"/đã chốt vắng (`coDau`);
 * VÀ hôm nay đã qua Chủ nhật của tuần muộn nhất trong các kỹ năng đó. Kỹ năng đã huỷ phần thi không tính vào yêu
 * cầu — bỏ hết mọi kỹ năng bắt buộc (toàn bộ đã huỷ) thì KHÔNG BAO GIỜ coi là hoàn tất (an toàn hơn khoá nhầm).
 */
export function dotDaHoanTat(i: {
  cheDo: 'ielts_band' | 'ratio';
  kn: Array<{ batBuoc: boolean; huy: boolean; coDiem: boolean; coDau: boolean }>;
  chuNhatCuoi: string | null;
  homNay: string;
}): boolean {
  const batBuoc = i.kn.filter((k) => k.batBuoc && !k.huy);
  if (batBuoc.length === 0) return false;
  const xong = batBuoc.every((k) => k.coDiem || (i.cheDo === 'ielts_band' && k.coDau));
  if (!xong) return false;
  if (!i.chuNhatCuoi) return false;
  return i.homNay > i.chuNhatCuoi;
}

/** Tiêu đề trong tab (Q10): chỉ có lớp Fast Track thì gọi đúng tên "Mock Test"; có cả lớp thường thì gọi chung. */
export function tieuDeKeHoach(coFT: boolean, coThuong: boolean): string {
  return coFT && !coThuong ? 'Kế hoạch Mock Test' : 'Kế hoạch Test';
}

/** Ngày vào lớp (`enrollments.started_at`) muộn hơn khai giảng lớp quá 14 ngày (Q15). */
export function laVaoMuon(vaoLop: string | null, khaiGiang: string | null): boolean {
  if (!vaoLop || !khaiGiang) return false;
  const soNgay = Math.round(
    (Date.parse(`${vaoLop.slice(0, 10)}T00:00:00Z`) - Date.parse(`${khaiGiang.slice(0, 10)}T00:00:00Z`)) / 86400000,
  );
  return soNgay > 14;
}

// ---------------------------------------------------------------- PR-UX2: bốn kỹ năng L · R · W · S riêng

/** Bốn kỹ năng của Kế hoạch Test. W = chấm cả W1 và W2 — một lịch W đặt cho cả hai (G-7). */
export const KY_NANG_KE_HOACH = ['listening', 'reading', 'writing', 'speaking'] as const;
export type KyNangKH = (typeof KY_NANG_KE_HOACH)[number];
export const CHU_KY_NANG: Record<KyNangKH, 'L' | 'R' | 'W' | 'S'> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/**
 * Một kỹ năng của một đợt: `khoa` != null → dòng chỉ đọc (đã có điểm / đã thi / đã huỷ phần thi). `periodId` là tuần hiện có
 * — hộp sửa dùng nó làm giá trị ban đầu của bộ chọn tuần (Bổ sung sau rà #87: không để bộ chọn tự phát "tuần này").
 */
export type OKyNang = {
  trangThai: TrangThaiO; tuan: string | null; periodId: number | null; doiTu: string | null; batBuoc: boolean;
  khoa: 'đã có điểm' | 'đã thi' | 'đã huỷ phần thi' | null;
};

export type ChipKH = { kyNang: KyNangKH[]; tuan: string | null; trangThai: TrangThaiO; doiTu: string | null };

/** Trạng thái MỘT kỹ năng = trạng thái nhóm chỉ có nó (không có luật thứ hai). */
export function trangThaiKyNang(k: { batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean }): TrangThaiO {
  return trangThaiNhom([k]);
}

/**
 * GỘP CHIP của một ô (Q4, Q5): kỹ năng `khong-yeu-cau` không vẽ; mọi kỹ năng còn lại `xong` → một chip `Xong {tuần muộn
 * nhất} ✓`; còn lại gom theo cùng tuần + trạng thái + tuần dời, giữ thứ tự L→R→W→S. Ô chứa được 2 chip — `them` là số
 * chip vượt quá đó (dòng 2 ghi `+{n}`).
 */
export function gomChip(kn: Partial<Record<KyNangKH, OKyNang>>): {
  xong: boolean; tuanXong: string | null; chip: ChipKH[]; them: number;
} {
  const co = KY_NANG_KE_HOACH
    .map((k) => ({ k, o: kn[k] }))
    .filter((x): x is { k: KyNangKH; o: OKyNang } => !!x.o && x.o.trangThai !== 'khong-yeu-cau');
  if (co.length === 0) return { xong: false, tuanXong: null, chip: [], them: 0 };
  if (co.every((x) => x.o.trangThai === 'xong')) {
    const tuan = co.map((x) => x.o.tuan).filter((t): t is string => !!t).sort();
    return { xong: true, tuanXong: tuan.length ? tuan[tuan.length - 1] : null, chip: [], them: 0 };
  }
  const nhom = new Map<string, ChipKH>();
  for (const { k, o } of co) {
    const key = `${o.tuan ?? ''}|${o.trangThai}|${o.doiTu ?? ''}`;
    const c = nhom.get(key);
    if (c) c.kyNang.push(k);
    else nhom.set(key, { kyNang: [k], tuan: o.tuan, trangThai: o.trangThai, doiTu: o.doiTu });
  }
  const chip = [...nhom.values()];
  return { xong: false, tuanXong: null, chip, them: Math.max(0, chip.length - 2) };
}

/**
 * NHÃN TUẦN TRONG KHOÁ của lớp thường (Q6): `W5/10`; tuần sau hết khoá → `sau khoá`; trước khai giảng hoặc thiếu căn cứ
 * → null. Không tự đọc ngày.
 */
export function nhanTuanKhoa(tuan: string | null, khaiGiang: string | null, tongTuan: number | null): string | null {
  if (!tuan || !khaiGiang || !tongTuan) return null;
  const n = studyWeekOf(khaiGiang, tuan);
  if (n === null || n < 1) return null;
  if (n > tongTuan) return 'sau khoá';
  return tuanKhoa(n, tongTuan);
}

/** Một bài (một kỹ năng của một em) trên màn xem trước hàng loạt / hộp chip. */
export type BaiXemTruoc = {
  skill: KyNangKH; tu: string | null; den: string | null;
  ghiChu: 'moi' | 'doi' | 'giu' | 'canh-bao' | 'chan'; cau: string | null;
};
export type DongHangLoat = {
  studentId: number; ten: string; hanhDong: 'tao' | 'doi' | 'giu' | 'loi'; bai: BaiXemTruoc[]; loi: string | null;
};

/**
 * TÓM TẮT XEM TRƯỚC hàng loạt (Q1): lưu theo EM — em có bài bị chặn thì cả em không lưu (dòng `loi`), nên `luuDuoc` chỉ đếm
 * bài của dòng không `loi`. Bài `giu` (đã có điểm, đúng tuần) không tính là bài.
 */
export function tomTatHangLoat(dong: DongHangLoat[]): {
  tongBai: number; luuDuoc: number; coCanhBao: number; biChan: number; soEmLuu: number; soBaiLuu: number;
} {
  let tongBai = 0, luuDuoc = 0, coCanhBao = 0, biChan = 0, soEmLuu = 0;
  for (const d of dong) {
    if (d.hanhDong === 'giu') continue;
    for (const b of d.bai) {
      if (b.ghiChu === 'giu') continue;
      tongBai += 1;
      if (b.ghiChu === 'chan') biChan += 1;
      if (d.hanhDong !== 'loi' && (b.ghiChu === 'moi' || b.ghiChu === 'doi' || b.ghiChu === 'canh-bao')) {
        luuDuoc += 1;
        if (b.ghiChu === 'canh-bao') coCanhBao += 1;
      }
    }
    if (d.hanhDong === 'tao' || d.hanhDong === 'doi') soEmLuu += 1;
  }
  return { tongBai, luuDuoc, coCanhBao, biChan, soEmLuu, soBaiLuu: luuDuoc };
}

/** R9b: sau khi lưu, chỉ các em `loi` còn ở lại (còn tick) — các em khác đã lưu xong. */
export function emGiuLaiSauLuu(dong: DongHangLoat[]): number[] {
  return dong.filter((d) => d.hanhDong === 'loi').map((d) => d.studentId);
}

/** Gộp bài cùng `tu` + `den` + `ghiChu` thành một dòng xem trước (`L R W — → W1 OCT`), thứ tự L→S. */
export function gomBaiXemTruoc(bai: BaiXemTruoc[]): Array<Omit<BaiXemTruoc, 'skill'> & { kyNang: KyNangKH[] }> {
  const thuTu = (k: KyNangKH) => KY_NANG_KE_HOACH.indexOf(k);
  const nhom = new Map<string, Omit<BaiXemTruoc, 'skill'> & { kyNang: KyNangKH[] }>();
  for (const b of [...bai].sort((x, y) => thuTu(x.skill) - thuTu(y.skill))) {
    const key = `${b.tu ?? ''}|${b.den ?? ''}|${b.ghiChu}`;
    const c = nhom.get(key);
    if (c) { c.kyNang.push(b.skill); if (!c.cau && b.cau) c.cau = b.cau; }
    else nhom.set(key, { kyNang: [b.skill], tu: b.tu, den: b.den, ghiChu: b.ghiChu, cau: b.cau });
  }
  return [...nhom.values()];
}

/** Dòng tóm tắt của một lớp Fast Track (Q12): `MT3 đang thi · MT4 chưa xếp 4 em`, bỏ vế trống. */
export function tomTatLopFT(i: { dangThi: number | null; chuaXep: { dot: number; soEm: number } | null }): string {
  const ve: string[] = [];
  if (i.dangThi !== null) ve.push(`MT${i.dangThi} đang thi`);
  if (i.chuaXep && i.chuaXep.soEm > 0) ve.push(`MT${i.chuaXep.dot} chưa xếp ${i.chuaXep.soEm} em`);
  return ve.join(' · ');
}
