/**
 * LUẬT THUẦN CỦA KẾ HOẠCH TEST — khu vực Test (spec §3.5 "Kế hoạch Test").
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE và KHÔNG TỰ ĐỌC NGÀY GIỜ: trạng thái một kỹ năng (và nhóm kỹ năng) trên lưới,
 * gộp chip L · R · W · S theo tuần, nhãn tuần trong khoá, tuần đa số, đợt đã hoàn tất hay chưa (R11), tiêu đề tab theo
 * phạm vi lớp, tóm tắt màn xem trước của Xếp lịch hàng loạt, và "vào muộn". Máy chủ và giao diện cùng gọi một nơi.
 */

import { studyWeekOf } from './fasttrack.ts';
import { tuanKhoa, tuanLich } from './hienThiNgay.ts';
import { MT_TOI_DA, dongHeQuaVuot, kiemSoMtMoi, soMtKeTiep, type LuotSeHuyLich, type LuotSo } from './lichMt.ts';
import { tenMonNgan } from './normal.ts';
import { addDaysIso } from './sos.ts';
import { mondayOfDate } from './week.ts';

/** PR-XLMT (K4-11, K4-18(3)) thêm `vang` · `cho-duyet` · `tre` · `da-huy`. */
export type TrangThaiO = 'xong' | 'da-xep' | 'da-doi' | 'chua-xep' | 'khong-yeu-cau' | 'vang' | 'cho-duyet' | 'tre' | 'da-huy';

/**
 * Trạng thái một Ô NHÓM của một đợt, thứ tự cố định: không có kỹ năng bắt buộc → `khong-yeu-cau` · mọi kỹ năng bắt buộc
 * `xong` → `xong` · có chờ Quản lý duyệt dời → `cho-duyet` · có vắng → `vang` · có kỹ năng chưa có tuần → `chua-xep` · có
 * phần thi đã huỷ → `da-huy` · có trễ → `tre` · có dời vì vắng (Q5) → `da-doi` · còn lại `da-xep`. Cờ PR-XLMT tuỳ chọn —
 * vắng mặt = kết quả cũ.
 */
export function trangThaiNhom(
  kn: Array<{ batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean; huy?: boolean; vang?: boolean; choDuyet?: boolean; tre?: boolean }>,
): TrangThaiO {
  const batBuoc = kn.filter((k) => k.batBuoc);
  if (batBuoc.length === 0) return 'khong-yeu-cau';
  if (batBuoc.every((k) => k.xong)) return 'xong';
  if (batBuoc.some((k) => k.choDuyet)) return 'cho-duyet';
  if (batBuoc.some((k) => k.vang)) return 'vang';
  if (batBuoc.some((k) => k.tuan === null)) return 'chua-xep';
  if (batBuoc.some((k) => k.huy)) return 'da-huy';
  if (batBuoc.some((k) => k.tre)) return 'tre';
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
/** Mọi ô xếp lịch được: 4 kỹ năng (FT, FOU/BE/ELE) + ô `tong_hop` của Pre FOU (PF6). Lớp thường dùng đúng bộ môn chương trình. */
export const O_KE_HOACH = [...KY_NANG_KE_HOACH, 'tong_hop'] as const;
export type KyNangKH = (typeof O_KE_HOACH)[number];
export const CHU_KY_NANG: Record<KyNangKH, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S', tong_hop: 'Tổng hợp' };

/**
 * Một kỹ năng của một đợt: `khoa` != null → dòng chỉ đọc (đã có điểm / đã thi / đã huỷ phần thi). `periodId` là tuần hiện có
 * — hộp sửa dùng nó làm giá trị ban đầu của bộ chọn tuần (Bổ sung sau rà #87: không để bộ chọn tự phát "tuần này").
 */
export type OKyNang = {
  trangThai: TrangThaiO; tuan: string | null; periodId: number | null; doiTu: string | null; batBuoc: boolean;
  khoa: 'đã có điểm' | 'đã thi' | 'đã huỷ phần thi' | null;
  /** PR-XLMT: trạng thái thi thô, Chủ nhật tuần thi, đang có đề nghị dời chờ duyệt — hộp và menu thao tác cần. */
  sit: string | null; tuanKetThuc: string | null; choDuyet: boolean;
  /** T3 (PR-MTa): huỷ vì vắng 2 lần — ô MT "S huỷ" (PR-MTb). */
  huyVang?: boolean;
  /** T6 (PR-MTb): hạn chấm hiệu lực (ngày) — null: không yêu cầu, MT cũ, đã huỷ phần thi, chưa có tuần. */
  hanCham: string | null;
};

export type ChipKH = { kyNang: KyNangKH[]; tuan: string | null; trangThai: TrangThaiO; doiTu: string | null };

/** Trạng thái MỘT kỹ năng = trạng thái nhóm chỉ có nó (không có luật thứ hai). */
export function trangThaiKyNang(k: Parameters<typeof trangThaiNhom>[0][number]): TrangThaiO {
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
  const co = O_KE_HOACH
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
  /** PR-XLMT (khung FT): việc máy chọn cho em, số MT, MT lịch sử, cần lý do, kỹ năng đã có điểm (web hỏi thi lại). */
  viec?: ViecXep['loai'] | 'thi-lai'; attemptNo?: number; lichSu?: boolean; canLyDo?: boolean; coDiem?: KyNangKH[];
  /** T2 (PR-MTa): lượt sau bị vượt — bỏ lịch; `soDiem > 0` thì lưu cần xác nhận + lý do (popup gộp, PR-MTb). */
  seHuyLich?: LuotSeHuyLich[];
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
  const thuTu = (k: KyNangKH) => O_KE_HOACH.indexOf(k);
  const nhom = new Map<string, Omit<BaiXemTruoc, 'skill'> & { kyNang: KyNangKH[] }>();
  for (const b of [...bai].sort((x, y) => thuTu(x.skill) - thuTu(y.skill))) {
    const key = `${b.tu ?? ''}|${b.den ?? ''}|${b.ghiChu}`;
    const c = nhom.get(key);
    if (c) { c.kyNang.push(b.skill); if (!c.cau && b.cau) c.cau = b.cau; }
    else nhom.set(key, { kyNang: [b.skill], tu: b.tu, den: b.den, ghiChu: b.ghiChu, cau: b.cau });
  }
  return [...nhom.values()];
}

/** Dòng tóm tắt của một lớp Fast Track (Q12): `MT3 đang thi · MT4 chưa xếp 4 em · 2 em cần xếp lại`, bỏ vế trống. */
export function tomTatLopFT(i: { dangThi: number | null; chuaXep: { dot: number; soEm: number } | null; canXepLai?: number }): string {
  const ve: string[] = [];
  if (i.dangThi !== null) ve.push(`MT${i.dangThi} đang thi`);
  if (i.chuaXep && i.chuaXep.soEm > 0) ve.push(`MT${i.chuaXep.dot} chưa xếp ${i.chuaXep.soEm} em`);
  if (i.canXepLai) ve.push(`${i.canXepLai} em cần xếp lại`);
  return ve.join(' · ');
}

// ---------------------------------------------------------------- PR-XLMT: xếp lịch MT nhiều lớp, việc từng em

/** K4-14, M9: đợt mới — 4 kỹ năng CÙNG tuần tới (thứ Hai sau thứ Hai tuần này). Hộp kỹ năng và ngăn Xếp lịch MT dùng chung. */
export function tuanMacDinhDotMoi(homNay: string): string { return addDaysIso(mondayOfDate(homNay), 7); }

/** `coTuan` (PR-MTb): kỹ năng đã có tuần thi — "MT mới" tìm đợt mà mọi kỹ năng bắt buộc còn chưa có tuần. */
export type KnXep = { skill: KyNangKH; batBuoc: boolean; coDiem: boolean; daThi: boolean; huyPhan: boolean; choDuyet: boolean; coTuan: boolean };
export type LuotXep = { no: number; huy: boolean; lichSu: boolean; kn: KnXep[] };
export type ViecXep =
  | { loai: 'tao'; no: number } | { loai: 'doi'; no: number } | { loai: 'xep-not'; no: number; kyNang: KyNangKH[] }
  | { loai: 'da-du'; no: number; coDiem: KyNangKH[] } | { loai: 'chan'; no: number; cau: string };

/**
 * K4-17 · T37 · M9 · T13b (PR-MTb): việc đúng cho ĐÚNG đợt `chon` — KHÔNG tự sang đợt khác. Đợt đã đủ → `da-du` nếu `ep` (Quản lý
 * bấm chip CHÍNH đợt đó cho riêng em: web hỏi thi lại), không thì chặn "MT{n} đã xong."; MT cũ → chặn (nhập điểm bù), không xét `ep`.
 * Thứ tự kiểm cố định — không đảo: huỷ → MT cũ → còn kỹ năng phải thi.
 */
export function viecXepMt(ds: LuotXep[], chon: number, so: LuotSo[], ep = false): ViecXep {
  const n = chon;
  if (n > MT_TOI_DA) return { loai: 'chan', no: MT_TOI_DA, cau: `Đã đủ MT${MT_TOI_DA} — tối đa của một lộ trình.` };
  const a = ds.find((x) => x.no === n && !x.huy);
  if (!a) { const loi = kiemSoMtMoi(so, n); return loi ? { loai: 'chan', no: n, cau: loi } : { loai: 'tao', no: n }; }
  if (a.lichSu) return { loai: 'chan', no: n, cau: `MT${n} là MT cũ — nhập điểm bù.` };
  const can = a.kn.filter((k) => k.batBuoc && !k.huyPhan);
  const conThi = can.filter((k) => !k.coDiem && !k.daThi && !k.choDuyet);
  if (!conThi.length) {
    if (can.some((k) => k.choDuyet)) return { loai: 'chan', no: n, cau: `MT${n} còn kỹ năng chờ Quản lý duyệt dời — trả lời đề nghị trước.` };
    const cd = can.filter((k) => k.coDiem).map((k) => k.skill);
    if (!ep) return { loai: 'chan', no: n, cau: `MT${n} đã xong.` };
    return cd.length ? { loai: 'da-du', no: n, coDiem: cd } : { loai: 'chan', no: n, cau: `MT${n} đã thi, đang chờ chấm.` };
  }
  if (can.some((k) => k.coDiem || k.daThi)) return { loai: 'xep-not', no: n, kyNang: conThi.map((k) => k.skill) };
  return { loai: 'doi', no: n };
}

/**
 * "MT mới" (T13b, PR-MTb): đợt nhỏ nhất còn hiệu lực mà mọi kỹ năng bắt buộc CHƯA có tuần (lượt đã huỷ lịch); không có → số kế
 * tiếp của lộ trình. MT cũ bị bỏ qua (chỉ nhập điểm bù — không xếp được).
 */
export function dotMtMoi(ds: LuotXep[], so: LuotSo[]): number {
  const chuaCoLich = ds
    .filter((x) => !x.huy && !x.lichSu && x.kn.every((k) => !k.batBuoc || !k.coTuan))
    .map((x) => x.no);
  return chuaCoLich.length ? Math.min(...chuaCoLich) : soMtKeTiep(so);
}

const dsMon = (ct: string | null, ks: readonly KyNangKH[]) => ks.map((k) => tenMonNgan(ct, k)).join(' ');

/**
 * Cột "Sẽ xếp" của ngăn Xếp lịch MT (M9): `Dời MT3 · W3 OCT → W2 OCT` · `Xếp nốt W S · MT3` · `Tạo MT4 · W2 OCT` ·
 * `Tạo MT4 · W3 AUG · MT cũ` · `Thi lại L · MT3` · câu chặn. Tuần khác nhau giữa các kỹ năng → ghi theo từng nhóm.
 * Dòng có lượt bị vượt (T2) thêm hệ quả: `… · MT2: huỷ 4 điểm` / `… · MT3: bỏ lịch`.
 */
export function chuSeXep(d: DongHangLoat, ct: string | null): string {
  if (d.hanhDong === 'loi') return d.loi ?? 'Không xếp được.';
  const mt = `MT${d.attemptNo ?? ''}`;
  const bai = d.bai.filter((b) => b.ghiChu !== 'giu');
  if (d.hanhDong === 'giu' && d.coDiem?.length) return `${mt} đã có điểm ${dsMon(ct, d.coDiem)} — thi lại?`;
  if (d.hanhDong === 'giu' || !bai.length) return 'Giữ nguyên — không có gì để xếp.';
  const nhom = gomBaiXemTruoc(bai);
  const tuanMoi = nhom.length === 1 ? tuanLich(nhom[0].den) : nhom.map((g) => `${dsMon(ct, g.kyNang)} ${tuanLich(g.den)}`).join(' · ');
  if (d.viec === 'thi-lai') return `Thi lại ${dsMon(ct, bai.map((b) => b.skill))} · ${mt}`;
  if (d.viec === 'xep-not') return `Xếp nốt ${dsMon(ct, bai.map((b) => b.skill))} · ${mt}`;
  if (d.hanhDong === 'tao') return `Tạo ${mt} · ${tuanMoi}${d.lichSu ? ' · MT cũ' : ''}`;
  const doi = nhom.length === 1
    ? `${tuanLich(nhom[0].tu)} → ${tuanLich(nhom[0].den)}`
    : nhom.map((g) => `${dsMon(ct, g.kyNang)} ${tuanLich(g.tu)} → ${tuanLich(g.den)}`).join(' · ');
  return `Dời ${mt} · ${doi}${d.seHuyLich?.length ? ` · ${d.seHuyLich.map(dongHeQuaVuot).join(' · ')}` : ''}`;
}

/** Dòng xem trước chân ngăn (C4): đếm EM theo việc; `soEm`/`soBai` = em/bài sẽ lưu (em chặn không lưu, bài `giu` không tính). */
export function tomTatXepMt(dong: DongHangLoat[]): {
  doi: number; xepNot: number; tao: number; thiLai: number; canhBao: number; chan: number; soEm: number; soBai: number;
} {
  const t = { doi: 0, xepNot: 0, tao: 0, thiLai: 0, canhBao: 0, chan: 0, soEm: 0, soBai: 0 };
  for (const d of dong) {
    if (d.hanhDong === 'loi') { t.chan += 1; continue; }
    if (d.hanhDong === 'giu') continue;
    if (d.viec === 'thi-lai') t.thiLai += 1;
    else if (d.viec === 'xep-not') t.xepNot += 1;
    else if (d.hanhDong === 'tao') t.tao += 1;
    else t.doi += 1;
    if (d.bai.some((b) => b.ghiChu === 'canh-bao')) t.canhBao += 1;
    t.soEm += 1;
    t.soBai += d.bai.filter((b) => b.ghiChu !== 'giu' && b.ghiChu !== 'chan').length;
  }
  return t;
}

// ---------------------------------------------------------------- PR-MTb: cột "Sẽ xếp" MỘT dòng, ba màu (mockup phần 1)

export type ToneSeXep = 'ok' | 'soon' | 'bad';

/**
 * Cột "Sẽ xếp" của panel Xếp lịch Mock Test (mockup bản 4, phần 1): MỘT dòng ngắn + màu. `ok` = xếp thẳng · `soon` = cần xem (xếp
 * nốt, cảnh báo, dời vượt, MT cũ, thi lại / đã đủ) · `bad` = "Không xếp được". `phu` = chữ nhỏ sau (`· trùng MT2`); `title` =
 * câu đầy đủ (`chuSeXep` + câu cảnh báo) cho tooltip. Em có lượt bị vượt (T2) luôn `soon` — popup nói hệ quả.
 */
export function nhanSeXep(d: DongHangLoat, ct: string | null): { tone: ToneSeXep; chu: string; phu: string | null; title: string } {
  if (d.hanhDong === 'loi') return { tone: 'bad', chu: 'Không xếp được', phu: null, title: chuSeXep(d, ct) };
  const mt = d.attemptNo ? `MT${d.attemptNo}` : 'MT';
  const bai = d.bai.filter((b) => b.ghiChu !== 'giu');
  const canhBao = [...new Set(bai.filter((b) => b.ghiChu === 'canh-bao' && b.cau).map((b) => b.cau as string))];
  const title = [chuSeXep(d, ct), ...canhBao].join(' · ');
  if (d.hanhDong === 'giu' || !bai.length) {
    return { tone: 'soon', chu: d.coDiem?.length ? `${mt} · đã có điểm` : 'Giữ nguyên', phu: null, title };
  }
  const nhom = gomBaiXemTruoc(bai);
  const tuanChung = nhom.length === 1 ? tuanLich(nhom[0].den) : nhom.map((g) => `${dsMon(ct, g.kyNang)} ${tuanLich(g.den)}`).join(' · ');
  const phanMon = d.viec === 'xep-not' || d.viec === 'thi-lai';   // chỉ một vài kỹ năng: ghi rõ kỹ năng nào
  const chu = phanMon && nhom.length === 1 ? `${mt} · ${dsMon(ct, bai.map((b) => b.skill))} · ${tuanChung}` : `${mt} · ${tuanChung}`;
  const trung = canhBao.map((c) => /^Trùng tuần .* với (MT\d+)/.exec(c)?.[1]).find(Boolean);
  const phu = trung ? `· trùng ${trung}` : d.hanhDong === 'tao' && d.lichSu ? '· cũ' : null;
  const soon = phanMon || !!canhBao.length || !!d.seHuyLich?.length || (d.hanhDong === 'tao' && !!d.lichSu);
  return { tone: soon ? 'soon' : 'ok', chu, phu, title };
}

/** Ba chip tóm tắt của panel: `✓ Sẽ xếp n` · `! Cần xem n` · `✕ Không xếp được n` — đếm EM theo màu từng dòng. */
export function demSeXep(dong: DongHangLoat[]): Record<ToneSeXep, number> {
  const t: Record<ToneSeXep, number> = { ok: 0, soon: 0, bad: 0 };
  for (const d of dong) t[nhanSeXep(d, null).tone] += 1;
  return t;
}
