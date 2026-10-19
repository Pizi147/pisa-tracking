import { ENTRY_SKILL_SHORT, type EntrySkill } from './skills.ts';
import { LOI_BAND_TU_TINH, LOI_SO_CAU_KHOANG, bandTuSoCau, criteriaPatchFrom, kiemBand, type PatchDiem } from './chamDiem.ts';
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
const kyNangCua = (h: string): EntrySkill | null =>
  (Object.keys(TEN_COT) as EntrySkill[]).find((k) => TEN_COT[k].includes(h)) ?? null;
/** "Nhận xét L", "NX W1", "Comment" → kỹ năng (null = cột nhận xét không ghi kỹ năng); không phải cột nhận xét → undefined. */
function nhanXetCua(h: string): EntrySkill | null | undefined {
  const m = /^(nhan xet|nx|comment|comments|feedback)(?: (.+))?$/.exec(h);
  return m ? (m[2] ? kyNangCua(m[2]) : null) : undefined;
}

export type ODanTho = { skill: EntrySkill; diem: string; nhanXet: string };
export type DongDan = { so: number; ten: string; o: ODanTho[] };
export type BangDan = { coTieuDe: boolean; cot: string[]; dong: DongDan[] };

/**
 * Chữ dán → các dòng. `cotMo` = kỹ năng đang mở ở lưới, theo thứ tự (Tất cả: L R W1 W2 S; một kỹ năng: một cột).
 * Có tiêu đề (một ô ngoài ô đầu là tên kỹ năng / "Nhận xét …"): map theo tên cột; cột kỹ năng không đang mở → bỏ. "Nhận xét" không ghi
 * kỹ năng gắn với cột điểm ngay trước. Không tiêu đề: `Tên | điểm | nhận xét` theo `cotMo`; đúng 1 + n cột → chỉ điểm, không nhận xét.
 * `so` = số dòng trong Excel (1 = dòng đầu dán) để người dùng tìm lại.
 */
export function docBangDan(text: string, cotMo: readonly EntrySkill[]): BangDan {
  const hang = tachTsv(text);
  const dau = hang.findIndex((h) => h.some((o) => o.trim()));
  if (dau < 0) return { coTieuDe: false, cot: [], dong: [] };
  const tieuDe = hang[dau].map(chuanTieuDe);
  const coTieuDe = tieuDe.some((h, i) => i > 0 && (kyNangCua(h) !== null || nhanXetCua(h) !== undefined));
  /* Vị trí cột: điểm / nhận xét của từng kỹ năng đang mở, và cột tên. */
  const viDiem = new Map<EntrySkill, number>(), viNx = new Map<EntrySkill, number>();
  let viTen = 0;
  if (coTieuDe) {
    const iTen = tieuDe.findIndex((h) => COT_TEN.includes(h));
    viTen = iTen >= 0 ? iTen : 0;
    let truoc: EntrySkill | null = null;
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
    ...(viDiem.has(k) ? [ENTRY_SKILL_SHORT[k]] : []),
    ...(viNx.has(k) ? [t('Nhận xét {k}', { k: ENTRY_SKILL_SHORT[k] })] : []),
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
};
/** Lệnh của một ô gửi `POST /attempts/scores/lo` (cùng trường với `PUT /attempts/:id/scores/:skill`). */
export type PatchDan = PatchDiem & { nhanXet?: string; nhomNguyenNhan?: string[] };
export type XetODan = { loai: 'bo' } | { loai: 'loi'; loi: string }
  | { loai: 'ghi'; patch: PatchDan; band: number | null; truoc: string | null; sau: string; canNhom: boolean };
/** L / R: cả lô là số câu (0–40) hay band (0–9). */
export type CheDoLR = 'cau' | 'band';

const so = (s: string) => (/^\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : NaN);
const chuBand = (b: number) => b.toFixed(1);
const chuO = (c: { rawScore: number | null; band: number | null }) => (c.rawScore !== null ? String(c.rawScore) : c.band !== null ? chuBand(c.band) : null);

/** Một ô dán × ô hiện có → xem trước. Không đoán: chữ lạ là lỗi có lý do, ô trống là bỏ qua. */
export function xetODan(raw: { diem: string; nhanXet: string }, cell: ODanHienCo, cheDo: CheDoLR): XetODan {
  const d = raw.diem.trim(), nx = raw.nhanXet.trim();
  if (!d && !nx) return { loai: 'bo' };
  if (!cell.required) return { loai: 'loi', loi: t('Lượt này không thi kỹ năng này') };
  if (cell.progress === 'cancelled' || cell.progress === 'absent') return { loai: 'loi', loi: t('Phần thi đã huỷ / đã xác nhận vắng') };
  if (!cell.canEdit) return { loai: 'loi', loi: cell.lyDoKhoa ?? t('Bạn không được phân công kỹ năng này') };
  const kx = kiemNhanXet(nx);
  if ('loi' in kx) return { loai: 'loi', loi: kx.loi };
  const truoc = chuO(cell);
  if (d === '-') {
    if (truoc !== null) return { loai: 'loi', loi: t('Ô đã có điểm — "-" không xoá được điểm') };
    if (cell.khongVang) return { loai: 'loi', loi: cell.khongVang };
    return { loai: 'ghi', patch: { noShow: true }, band: null, truoc: null, sau: '-', canNhom: false };
  }
  let patch: PatchDan | null = null, band: number | null = null, sau = '';
  if (!d) {
    band = cell.band;
    sau = truoc ?? '';
  } else if (cell.skill === 'listening' || cell.skill === 'reading') {
    const v = so(d);
    if (cheDo === 'cau') {
      if (!Number.isInteger(v) || v > 40) return { loai: 'loi', loi: t('Số câu: {x}', { x: LOI_SO_CAU_KHOANG }) };
      patch = { rawScore: v }; band = bandTuSoCau(cell.skill, v); sau = String(v);
    } else {
      const loi = kiemBand(v);
      if (loi) return { loai: 'loi', loi };
      patch = { band: v }; band = v; sau = chuBand(v);
    }
  } else {
    const tok = d.replace(/,(?=\d)/g, '.').split(/[\s/;|]+/).filter(Boolean);
    if (tok.length === 1) {
      if (!cell.bandThang) return { loai: 'loi', loi: LOI_BAND_TU_TINH };
      const r = criteriaPatchFrom(['', '', '', ''], {}, tok[0], true);
      if (!r.patch || r.loi) return { loai: 'loi', loi: r.loi ?? LOI_BAND_TU_TINH };
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
  const canNhom = canNhomNguyenNhan(band, cell.kyVong) && !cell.nhomNguyenNhan?.length;
  const p: PatchDan = { ...(patch && sau !== truoc ? patch : {}), ...(doiNx ? { nhanXet: nx } : {}) };
  return { loai: 'ghi', patch: p, band, truoc: patch && sau !== truoc ? truoc : null, sau, canNhom };
}
