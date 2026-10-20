import { ENTRY_SKILLS, ENTRY_SKILL_SHORT, type EntrySkill } from './skills.ts';
import { bandTuSoCau, criteriaPatchFrom, kiemBand, type PatchDiem } from './chamDiem.ts';
import { canNhomNguyenNhan, CAU_THIEU_NHAN_XET, kiemNhanXet, thieuNhanXetMt } from './nhanXet.ts';
import { chuanTieuDe } from './nhapHocVien.ts';
import { t } from '../i18n/index.ts';

/**
 * DÁN TỪ EXCEL (OV-15b mục 2, C15; mockup 2 khung 1d) — hàm thuần cho panel xem trước. Ba bước, mỗi bước một hàm:
 *   `docBangDan`  chữ dán (TSV của Excel) → các dòng `Tên | điểm | nhận xét | …`, có / không hàng tiêu đề;
 *   `khopHocVien` tên (bỏ dấu) hoặc email trong ô tên → đúng một lượt; trùng tên → ứng viên, KHÔNG đoán;
 *   `xetODan`     một ô dán × ô hiện có → bỏ qua (trống) / lỗi / lệnh `saveScore` + trước → sau. Trống ≠ 0 ≠ "-".
 * Máy chủ kiểm lại mọi luật trong `saveScore` (`POST /attempts/scores/lo`) — đây chỉ là xem trước.
 */

/**
 * Cỡ lô: mỗi ô một `saveScore` (~30 câu SQL, đo ở prOv15b-2d) — một dòng 5 ô ~150 câu, trên Turso 3–7 s; Netlify cắt 10 s (như PR-SL).
 * Web gửi `LO_DAN` dòng mỗi request, lần lượt; máy chủ nhận tối đa `DAN_TOI_DA_DONG` dòng một lần.
 */
export const LO_DAN = 1;
export const DAN_TOI_DA_DONG = 5;

/** Tách chữ Excel chép ra: tab giữa ô, xuống dòng giữa hàng; ô có tab / xuống dòng / ngoặc kép nằm trong "…" ("" = một "). */
export function tachTsv(text: string): string[][] {
  const hang: string[][] = [];
  let o = '', dong: string[] = [], trongNgoac = false;
  const s = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (trongNgoac) {
      if (c === '"' && s[i + 1] === '"') { o += '"'; i++; }
      else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"' && o === '') trongNgoac = true;
    else if (c === '\t') { dong.push(o); o = ''; }
    else if (c === '\n') { dong.push(o); hang.push(dong); dong = []; o = ''; }
    else o += c;
  }
  if (o !== '' || dong.length) { dong.push(o); hang.push(dong); }
  return hang;
}

const TEN_COT: Record<EntrySkill, string[]> = {
  listening: ['l', 'listening', 'nghe'],
  reading: ['r', 'reading', 'doc'],
  writing1: ['w1', 'writing 1', 'writing task 1', 'task 1', 'wt1'],
  writing2: ['w2', 'writing 2', 'writing task 2', 'task 2', 'wt2'],
  speaking: ['s', 'speaking', 'noi'],
};
const COT_TEN = ['ten', 'ho ten', 'ho va ten', 'hoc vien', 'ten hoc vien', 'name', 'full name', 'email'];

/**
 * Bộ môn của lưới đang dán: mọi môn có thể có (để nhận ra cột tiêu đề), tên cột chấp nhận của từng môn (đã `chuanTieuDe`), chữ ngắn hiện trên màn.
 * Fast Track: `COT_FT`; lớp thường (OV-15h2 ý 10): `cotThuong` theo môn của chương trình (FOU L · R · G+V · P; BE / ELE L · R · W · S; Pre FOU Tổng hợp).
 */
export type CotDan = { kyNang: readonly string[]; ten: (k: string) => readonly string[]; ngan: (k: string) => string };
export const COT_FT: CotDan = { kyNang: ENTRY_SKILLS, ten: (k) => TEN_COT[k as EntrySkill] ?? [], ngan: (k) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k };
const TEN_COT_THUONG: Record<string, string[]> = {
  listening: TEN_COT.listening, reading: TEN_COT.reading, speaking: TEN_COT.speaking, writing: ['w', 'writing', 'viet'], tong_hop: ['tong hop', 'tong', 'diem'],
};
/** Lớp thường: tên cột = chữ ngắn + tên đầy đủ của môn trong chương trình (`tenMonNgan` / `tenMon` máy chủ gửi) + tên chung của mã môn. */
export function cotThuong(mon: readonly string[], nhan: { ngan: (k: string) => string; ten: (k: string) => string }): CotDan {
  return {
    kyNang: mon, ngan: nhan.ngan,
    ten: (k) => [...new Set([chuanTieuDe(nhan.ngan(k)), chuanTieuDe(nhan.ten(k)), ...(TEN_COT_THUONG[k] ?? [chuanTieuDe(k)])].filter(Boolean))],
  };
}

export type ODanTho = { skill: string; diem: string; nhanXet: string };
export type DongDan = { so: number; ten: string; o: ODanTho[] };
export type BangDan = { coTieuDe: boolean; cot: string[]; dong: DongDan[] };

/**
 * Chữ dán → các dòng. `cotMo` = kỹ năng đang mở ở lưới, theo thứ tự (Tất cả: L R W1 W2 S; một kỹ năng: một cột).
 * Có tiêu đề (một ô ngoài ô đầu là tên kỹ năng / "Nhận xét …"): map theo tên cột; cột kỹ năng không đang mở → bỏ. "Nhận xét" không ghi
 * kỹ năng gắn với cột điểm ngay trước. Không tiêu đề: `Tên | điểm | nhận xét` theo `cotMo`; đúng 1 + n cột → chỉ điểm, không nhận xét.
 * `so` = số dòng trong Excel (1 = dòng đầu dán) để người dùng tìm lại.
 */
export function docBangDan(text: string, cotMo: readonly string[], bo: CotDan = COT_FT): BangDan {
  const kyNangCua = (h: string): string | null => bo.kyNang.find((k) => bo.ten(k).includes(h)) ?? null;
  /** "Nhận xét L", "NX W1", "Comment" → kỹ năng (null = cột nhận xét không ghi kỹ năng); không phải cột nhận xét → undefined. */
  const nhanXetCua = (h: string): string | null | undefined => {
    const m = /^(nhan xet|nx|comment|comments|feedback)(?: (.+))?$/.exec(h);
    return m ? (m[2] ? kyNangCua(m[2]) : null) : undefined;
  };
  const hang = tachTsv(text);
  const dau = hang.findIndex((h) => h.some((o) => o.trim()));
  if (dau < 0) return { coTieuDe: false, cot: [], dong: [] };
  const tieuDe = hang[dau].map(chuanTieuDe);
  const coTieuDe = tieuDe.some((h, i) => i > 0 && (kyNangCua(h) !== null || nhanXetCua(h) !== undefined));
  /* Vị trí cột: điểm / nhận xét của từng kỹ năng đang mở, và cột tên. */
  const viDiem = new Map<string, number>(), viNx = new Map<string, number>();
  let viTen = 0;
  if (coTieuDe) {
    const iTen = tieuDe.findIndex((h) => COT_TEN.includes(h));
    viTen = iTen >= 0 ? iTen : 0;
    let truoc: string | null = null;
    tieuDe.forEach((h, i) => {
      if (i === viTen) return;
      const k = kyNangCua(h);
      if (k) { truoc = k; if (cotMo.includes(k) && !viDiem.has(k)) viDiem.set(k, i); return; }
      const nx = nhanXetCua(h);
      const kn = nx === null ? truoc : nx;
      if (kn && cotMo.includes(kn) && !viNx.has(kn)) viNx.set(kn, i);
    });
  } else {
    const rong = Math.max(...hang.slice(dau).map((h) => h.length));
    const coNx = rong !== 1 + cotMo.length;
    cotMo.forEach((k, j) => {
      viDiem.set(k, coNx ? 1 + j * 2 : 1 + j);
      if (coNx) viNx.set(k, 2 + j * 2);
    });
  }
  const kn = cotMo.filter((k) => viDiem.has(k) || viNx.has(k));
  const cot = [t('Tên'), ...kn.flatMap((k) => [
    ...(viDiem.has(k) ? [bo.ngan(k)] : []),
    ...(viNx.has(k) ? [t('Nhận xét {k}', { k: bo.ngan(k) })] : []),
  ])];
  const lay = (h: string[], i: number | undefined) => (i === undefined ? '' : (h[i] ?? '').trim());
  const dong: DongDan[] = [];
  hang.forEach((h, i) => {
    if (i < dau || (coTieuDe && i === dau) || !h.some((o) => o.trim())) return;
    dong.push({ so: i + 1, ten: lay(h, viTen), o: kn.map((k) => ({ skill: k, diem: lay(h, viDiem.get(k)), nhanXet: lay(h, viNx.get(k)) })) });
  });
  return { coTieuDe, cot, dong };
}

/** Tên so khớp: bỏ dấu, đ → d, hoa thường, khoảng trắng thừa. */
export const chuanTen = (s: string) => chuanTieuDe(s);
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export type KhopHocVien = { attemptId: number; trung?: undefined; khongCo?: undefined }
  | { trung: number[]; attemptId?: undefined; khongCo?: undefined } | { khongCo: true; attemptId?: undefined; trung?: undefined };
/** Ô tên → một lượt của lớp. Ô có email → khớp email (không phân biệt hoa thường) trước; rồi tên bỏ dấu. Trùng tên → ứng viên. */
export function khopHocVien(ten: string, ds: readonly { attemptId: number; ten: string; email?: string | null }[]): KhopHocVien {
  const email = EMAIL.exec(ten)?.[0].toLowerCase();
  if (email) {
    const theoEmail = ds.filter((h) => h.email?.trim().toLowerCase() === email);
    if (theoEmail.length === 1) return { attemptId: theoEmail[0].attemptId };
  }
  const k = chuanTen(ten.replace(EMAIL, ''));
  if (!k) return { khongCo: true };
  const cung = ds.filter((h) => chuanTen(h.ten) === k);
  return cung.length === 1 ? { attemptId: cung[0].attemptId } : cung.length ? { trung: cung.map((h) => h.attemptId) } : { khongCo: true };
}

/** Phần của ô lưới (`Cell` ở web) mà xem trước cần. */
export type ODanHienCo = {
  skill: string; required: boolean; canEdit: boolean; rawScore: number | null; band: number | null; criteria: (number | null)[];
  bandThang: boolean; batBuocNhanXet?: boolean; kyVong?: number | null; nhanXet?: string | null; nhomNguyenNhan?: string[];
  lyDoKhoa?: string; progress?: string; khongVang?: string | null;
  /** Dấu "-" còn trên ô (chưa chốt / đã chốt) — như `coDau` của lưới. */
  noShow?: unknown; daChot?: unknown;
};
/** Lệnh của một ô gửi `POST /attempts/scores/lo` (cùng trường với `PUT /attempts/:id/scores/:skill`). */
export type PatchDan = PatchDiem & { nhanXet?: string | null; nhomNguyenNhan?: string[] };
export type XetODan = { loai: 'bo' } | { loai: 'loi'; loi: string }
  | { loai: 'ghi'; patch: PatchDan; band: number | null; truoc: string | null; sau: string; canNhom: boolean; canhBao?: string };
/** L / R: cả lô là số câu (0–40) hay band (0–9). */
export type CheDoLR = 'cau' | 'band';

/** Ô W / S MT thường dán một band: chữ ngắn ở ô xem trước. */
export const LOI_DAN_BAND = t('Dán 4 tiêu chí — Band tự tính');
const so = (s: string) => (/^\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : NaN);
const chuBand = (b: number) => b.toFixed(1);
const chuO = (c: { rawScore: number | null; band: number | null }) => (c.rawScore !== null ? String(c.rawScore) : c.band !== null ? chuBand(c.band) : null);
const coDauO = (c: { noShow?: unknown; daChot?: unknown }) => !!c.noShow || !!c.daChot;

/** Một ô dán × ô hiện có → xem trước. Không đoán: chữ lạ là lỗi có lý do, ô trống là bỏ qua. */
export function xetODan(raw: { diem: string; nhanXet: string }, cell: ODanHienCo, cheDo: CheDoLR): XetODan {
  const d = raw.diem.trim(), nx = raw.nhanXet.trim();
  if (!d && !nx) return { loai: 'bo' };
  if (!cell.required) return { loai: 'loi', loi: t('Lượt này không thi kỹ năng này') };
  if (cell.progress === 'cancelled' || cell.progress === 'absent') return { loai: 'loi', loi: t('Phần thi đã huỷ / đã xác nhận vắng') };
  if (!cell.canEdit) return { loai: 'loi', loi: cell.lyDoKhoa ?? t('Bạn không được phân công kỹ năng này') };
  const kx = kiemNhanXet(nx);
  if ('loi' in kx) return { loai: 'loi', loi: kx.loi };
  /* Ô đang "-" (chưa có điểm): trước = "-" — dán điểm lên hiện "- → x" (máy chủ: điểm thật thắng dấu). */
  const diemCu = chuO(cell);
  const truoc = diemCu ?? (coDauO(cell) ? '-' : null);
  if (d === '-') {
    if (diemCu !== null) return { loai: 'loi', loi: t('Ô đã có điểm — "-" không xoá được điểm') };
    if (truoc === '-') return { loai: 'bo' };
    if (cell.khongVang) return { loai: 'loi', loi: cell.khongVang };
    return { loai: 'ghi', patch: { noShow: true }, band: null, truoc: null, sau: '-', canNhom: false, ...(nx ? { canhBao: t('Ô "-": nhận xét bị bỏ') } : {}) };
  }
  let patch: PatchDan | null = null, band: number | null = null, sau = '';
  if (!d) {
    band = cell.band;
    sau = truoc ?? '';
  } else if (cell.skill === 'listening' || cell.skill === 'reading') {
    const v = so(d);
    if (cheDo === 'cau') {
      if (!Number.isInteger(v) || v > 40) return { loai: 'loi', loi: t('Ngoài 0–40 câu') };
      patch = { rawScore: v }; band = bandTuSoCau(cell.skill, v); sau = String(v);
    } else {
      const loi = kiemBand(v);
      if (loi) return { loai: 'loi', loi };
      patch = { band: v }; band = v; sau = chuBand(v);
    }
  } else {
    const tok = d.replace(/,(?=\d)/g, '.').split(/[\s/;|]+/).filter(Boolean);
    if (tok.length === 1) {
      /* OV-4c: MT thường không nhận band thẳng ở W1 / W2 / S (máy chủ `LOI_BAND_TU_TINH`) — chỉ MT cũ / MT0. */
      if (!cell.bandThang) return { loai: 'loi', loi: LOI_DAN_BAND };
      const r = criteriaPatchFrom(['', '', '', ''], {}, tok[0], true);
      if (!r.patch || r.loi) return { loai: 'loi', loi: r.loi ?? LOI_DAN_BAND };
      patch = r.patch; band = r.preview;
    } else if (tok.length === 4) {
      const r = criteriaPatchFrom(tok, {});
      if (r.loi || r.dash || r.preview === null || tok.some((x) => kiemBand(Number(x)))) {
        return { loai: 'loi', loi: t('Bốn tiêu chí, mỗi tiêu chí 0–9 bậc 0.5 (ví dụ 5.5 6 6 5.5)') };
      }
      patch = r.patch; band = r.preview;
    } else return { loai: 'loi', loi: t('Bốn tiêu chí, mỗi tiêu chí 0–9 bậc 0.5 (ví dụ 5.5 6 6 5.5)') };
    sau = chuBand(band!);
  }
  const nhanXetSau = nx || cell.nhanXet || null;
  const doiNx = !!nx && nx !== (cell.nhanXet ?? '');
  /* Giống hệt điểm + nhận xét đang có → không gửi gì (dán lại cả bảng không ghi đè lịch sử). */
  if (truoc !== null && sau === truoc && !doiNx) return { loai: 'bo' };
  if (!patch && !doiNx) return { loai: 'bo' };
  const coDiem = band !== null || (patch?.rawScore ?? cell.rawScore) !== null;
  const thieu = thieuNhanXetMt({ batBuoc: !!cell.batBuocNhanXet, coDiem, band, kyVong: cell.kyVong ?? null, nhanXet: nhanXetSau, nhom: ['?'] });
  if (thieu) return { loai: 'loi', loi: CAU_THIEU_NHAN_XET[thieu] };
  /* Nhóm nguyên nhân chỉ bắt buộc ở MT thường (`batBuocNhanXet`, như `thieuNhanXetMt` của máy chủ); MT cũ / MT0 không hỏi. */
  const canNhom = !!cell.batBuocNhanXet && canNhomNguyenNhan(band, cell.kyVong) && !cell.nhomNguyenNhan?.length;
  const p: PatchDan = { ...(patch && sau !== truoc ? patch : {}), ...(doiNx ? { nhanXet: nx } : {}) };
  return { loai: 'ghi', patch: p, band, truoc: patch && sau !== truoc ? truoc : null, sau, canNhom };
}

/**
 * HOÀN TÁC một ô vừa dán: ô trước khi lưu → các lệnh trả lại như cũ, theo thứ tự (gửi cùng `POST /attempts/scores/lo`). Ô trống → xoá; vừa dán
 * "-" → gỡ dấu; ô "-" bị điểm đè → xoá điểm rồi đặt lại "-"; L / R giữ dạng cũ (số câu / band), W / S giữ tiêu chí (hoặc band MT cũ);
 * nhận xét trả khi lần dán có gửi; nhóm nguyên nhân cũ LUÔN gửi lại (điểm cũ dưới kỳ vọng thiếu nhóm thì máy chủ từ chối).
 */
export function patchTruoc(c: Pick<ODanHienCo, 'skill' | 'rawScore' | 'band' | 'criteria' | 'nhanXet' | 'nhomNguyenNhan' | 'noShow' | 'daChot'>, p: PatchDan): PatchDan[] {
  if (p.noShow) return [{ noShow: false }];
  const nx: PatchDan = p.nhanXet !== undefined ? { nhanXet: c.nhanXet ?? null } : {};
  const nhom: PatchDan = c.nhomNguyenNhan?.length ? { nhomNguyenNhan: c.nhomNguyenNhan } : p.nhomNguyenNhan !== undefined ? { nhomNguyenNhan: [] } : {};
  if (p.rawScore === undefined && p.band === undefined && p.criteria === undefined) return [{ ...nx, ...nhom }];
  const lr = c.skill === 'listening' || c.skill === 'reading';
  const xoa: PatchDan = lr ? { rawScore: null } : { criteria: [null, null, null, null] };
  if (chuO(c) === null && coDauO(c)) return [{ ...xoa, ...nx }, { noShow: true }];
  const diem: PatchDan = lr
    ? (c.rawScore !== null ? { rawScore: c.rawScore } : c.band !== null ? { band: c.band } : xoa)
    : (c.criteria.some((v) => v !== null) ? { criteria: c.criteria } : c.band !== null ? { band: c.band } : xoa);
  return [{ ...diem, ...nx, ...nhom }];
}

/** Trước khi Hoàn tác: ô (sau khi tải lại) còn đúng giá trị đã dán không — đã ai sửa thì không trả ngược. */
export function oConNhuDan(c: Pick<ODanHienCo, 'rawScore' | 'band' | 'criteria' | 'nhanXet' | 'nhomNguyenNhan' | 'noShow' | 'daChot'>, p: PatchDan): boolean {
  const cung = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return (p.noShow !== true || coDauO(c))
    && (p.rawScore === undefined || c.rawScore === p.rawScore)
    && (p.band === undefined || c.band === p.band)
    && (p.criteria === undefined || cung(c.criteria, p.criteria))
    && (p.nhanXet === undefined || (c.nhanXet ?? null) === p.nhanXet)
    && (p.nhomNguyenNhan === undefined || cung(c.nhomNguyenNhan ?? [], p.nhomNguyenNhan));
}

// ---------------------------------------------------------------- Lớp thường (OV-15h2 ý 10)

/** Phần của ô lưới lớp thường (`oThuong` ở web) mà xem trước cần. `tongCot` = tổng câu hay gặp nhất của cột (ô "tổng" đầu cột của lưới). */
export type ODanThuong = {
  skill: string; canEdit: boolean; diem: number | null; tong: number | null; tongCot: number | null; dau: boolean; nhanXet: string | null;
  progress?: string; chuaToiTuan?: boolean; lyDoKhoa?: string; khongVang?: string | null; nhanXetDuoc?: boolean;
};
/** Một lệnh `saveRegularScore` — một lệnh một việc: điểm (đúng + tổng), hoặc dấu "-", hoặc nhận xét. */
export type PatchThuong = { score?: number | null; total?: number | null; noShow?: boolean; nhanXet?: string | null };
export type XetOThuong = { loai: 'bo' } | { loai: 'loi'; loi: string } | { loai: 'ghi'; lenh: PatchThuong[]; truoc: string | null; sau: string; canhBao?: string };
const chuThuong = (c: { diem: number | null; tong: number | null }) => (c.diem === null ? null : `${c.diem}/${c.tong ?? '?'}`);

/**
 * Một ô dán × ô lớp thường. Điểm = SỐ CÂU ĐÚNG ("24", tổng lấy từ ô / cột) hoặc "24/40"; "-" = em không làm bài (máy chủ dời môn sang tuần sau, C08);
 * trống = bỏ qua (≠ 0 ≠ "-"). Máy chủ kiểm lại mọi luật trong `saveRegularScore` (quyền theo môn, "-", đúng ≤ tổng).
 */
export function xetOThuong(raw: { diem: string; nhanXet: string }, c: ODanThuong): XetOThuong {
  const d = raw.diem.trim(), nx = raw.nhanXet.trim();
  if (!d && !nx) return { loai: 'bo' };
  if (c.progress === 'cancelled' || c.progress === 'absent') return { loai: 'loi', loi: t('Phần thi đã huỷ / đã xác nhận vắng') };
  if (!(c.canEdit || (!d && c.nhanXetDuoc))) return { loai: 'loi', loi: c.lyDoKhoa ?? t('Bạn không được phân công môn này') };
  const kx = kiemNhanXet(nx);
  if ('loi' in kx) return { loai: 'loi', loi: kx.loi };
  const truoc = chuThuong(c) ?? (c.dau ? '-' : null);
  const doiNx = !!nx && nx !== (c.nhanXet ?? '');
  const lenhNx: PatchThuong[] = doiNx ? [{ nhanXet: nx }] : [];
  if (d === '-') {
    if (c.diem !== null) return { loai: 'loi', loi: t('Ô đã có điểm — "-" không xoá được điểm') };
    if (c.dau) return lenhNx.length ? { loai: 'ghi', lenh: lenhNx, truoc: null, sau: '-' } : { loai: 'bo' };
    if (c.khongVang) return { loai: 'loi', loi: c.khongVang };
    if (c.chuaToiTuan) return { loai: 'loi', loi: t('Chưa tới tuần thi') };
    return { loai: 'ghi', lenh: [{ noShow: true }], truoc: null, sau: '-', ...(nx ? { canhBao: t('Ô "-": nhận xét bị bỏ') } : {}) };
  }
  if (!d) return lenhNx.length ? { loai: 'ghi', lenh: lenhNx, truoc: null, sau: truoc ?? '' } : { loai: 'bo' };
  if (c.dau) return { loai: 'loi', loi: t('Ô đang "-" (đã dời tuần) — gỡ dấu ở lưới trước') };
  if (c.chuaToiTuan) return { loai: 'loi', loi: t('Chưa tới tuần thi') };
  const m = /^(\d+)(?:\s*\/\s*(\d+))?$/.exec(d);
  if (!m) return { loai: 'loi', loi: t('Số câu đúng là số nguyên (vd 24 hoặc 24/40)') };
  const score = Number(m[1]), total = m[2] !== undefined ? Number(m[2]) : c.tong ?? c.tongCot;
  if (total === null) return { loai: 'loi', loi: t('Chưa có tổng câu — dán dạng 24/40') };
  if (total <= 0) return { loai: 'loi', loi: t('Tổng câu phải lớn hơn 0') };
  if (score > total) return { loai: 'loi', loi: t('Số câu đúng ({a}) lớn hơn tổng ({b})', { a: score, b: total }) };
  const sau = `${score}/${total}`;
  const doiDiem = sau !== truoc;
  if (!doiDiem && !doiNx) return { loai: 'bo' };
  return { loai: 'ghi', lenh: [...(doiDiem ? [{ score, total }] : []), ...lenhNx], truoc: doiDiem ? truoc : null, sau };
}

/** HOÀN TÁC các lệnh vừa dán của một ô lớp thường (ô trước khi lưu): "-" → gỡ dấu; điểm → điểm cũ (hoặc xoá); nhận xét → nhận xét cũ. */
export function patchTruocThuong(c: Pick<ODanThuong, 'diem' | 'tong' | 'nhanXet'>, lenh: readonly PatchThuong[]): PatchThuong[] {
  return lenh.map((p) => (p.noShow ? { noShow: false }
    : p.nhanXet !== undefined ? { nhanXet: c.nhanXet ?? null }
      : { score: c.diem, total: c.diem === null ? null : c.tong }));
}

/** Trước khi Hoàn tác: ô lớp thường (sau khi tải lại) còn đúng lệnh đã dán không. */
export function oConNhuDanThuong(c: Pick<ODanThuong, 'diem' | 'tong' | 'nhanXet' | 'dau'>, p: PatchThuong): boolean {
  return p.noShow ? c.dau : p.nhanXet !== undefined ? (c.nhanXet ?? null) === p.nhanXet : c.diem === (p.score ?? null) && c.tong === (p.total ?? null);
}
