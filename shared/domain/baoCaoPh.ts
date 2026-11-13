/**
 * BÁO CÁO PH (đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md`, mockup `thiet-ke/v15/bao-cao-ph.html`, chủ SP duyệt 06/11).
 * Báo cáo gửi phụ huynh: lớp FT mỗi tháng (mở ngày 20, hạn 30 — tháng 2 hạn 28); lớp thường tuần Progress / Final (mở thứ Hai, hạn Chủ nhật).
 * Phần, tiêu chí, thang là DỮ LIỆU ở đây (đặc tả §3, §11) — đổi chữ không sửa màn. Chữ tiêu chí chép hai mẫu (CP FT 131.xlsx, NORMAL.pdf), cả EN.
 */
import { NGON_NGU, t } from '../i18n/index.ts';
import { addDaysIso } from './sos.ts';
import { programmeOf } from './normal.ts';
import { tuanLich } from './hienThiNgay.ts';
import { soKyVong } from './chipSos.ts';
import { chuDiem } from './diemDong.ts';

/** Thang mọi tiêu chí (đặc tả §3). Excel ghi "Khá (Sound)". */
export const MUC_BC = ['xuat_sac', 'tot', 'kha', 'yeu'] as const;
export type MucBc = (typeof MUC_BC)[number];
export const MUC_BC_VI: Record<MucBc, string> = { xuat_sac: 'Xuất sắc', tot: 'Tốt', kha: 'Khá', yeu: 'Yếu' };
export const MUC_BC_EN: Record<MucBc, string> = { xuat_sac: 'Outstanding', tot: 'Good', kha: 'Sound', yeu: 'Basic' };
export const nhanMucBc = (m: MucBc): string => (NGON_NGU === 'en' ? MUC_BC_EN[m] : MUC_BC_VI[m]);
/** Ô mức trong Excel — song ngữ như mẫu: "Khá (Sound)". */
export const chuMucExcel = (m: MucBc): string => `${MUC_BC_VI[m]} (${MUC_BC_EN[m]})`;

export type TieuChiBc = { khoa: string; vi: string; en: string };
export type NhomTieuChi = { vi: string | null; en: string | null; ds: readonly TieuChiBc[] };
/** Chữ tiêu chí / đầu mục theo tiếng của trang (dữ liệu song ngữ, không qua từ điển). */
export const chuBc = (x: { vi: string | null; en: string | null }): string => (NGON_NGU === 'en' ? x.en ?? x.vi ?? '' : x.vi ?? '');

const tc = (khoa: string, vi: string, en: string): TieuChiBc => ({ khoa, vi, en });

const CHUNG: readonly NhomTieuChi[] = [
  { vi: 'Trách nhiệm học tập', en: 'Learning profile', ds: [
    tc('i1', 'Chuyên cần & Đúng giờ', 'Attendance & Punctuality'),
    tc('i2', 'Chuẩn bị trước khi đến lớp', 'Preparation for class'),
    tc('i3', 'Hoàn thành bài tập về nhà', 'Homework completion'),
  ] },
  { vi: 'Thái độ học tập', en: 'Learning attitude', ds: [
    tc('ii1', 'Thể hiện sự tôn trọng', 'Respect'),
    tc('ii2', 'Hứng thú học tập & Làm việc nhóm', 'Engagement and Cooperation'),
    tc('ii3', 'Động lực học tập', 'Motivation'),
    tc('ii4', 'Sự kiên trì khi gặp khó khăn trong học tập', 'Persistence'),
  ] },
];
/* Chính tả EN của mẫu (lexcial, acccuracy, "t increase", cohension) sửa khi chép — tệp gửi phụ huynh. */
const L: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [
  tc('c1', 'Nghe hiểu từ vựng và ngôn ngữ diễn đạt theo ngữ cảnh', 'Comprehends lexical resources and expressions according to spoken context.'),
  tc('c2', 'Nắm bắt các thông tin cụ thể trong bài', 'Grasps specific information in the recording'),
  tc('c3', 'Nhận biết các âm trong bài', 'Identifies phonemes'),
  tc('c4', 'Nghe hiểu đại ý chung của bài', 'Understands the main ideas in the recording'),
] }];
const R: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [
  tc('c1', 'Đọc hiểu ý chính trong bài, nắm bắt suy luận và ý nghĩa ngụ ý', 'Reads for gist to understand inferences and implied meaning.'),
  tc('c2', 'Định vị từ khoá trong bài và câu hỏi', 'Locates keywords in reading passage and questions.'),
  tc('c3', 'Từ vựng và ngữ pháp', 'Vocabulary and grammar'),
  tc('c4', 'Kĩ năng làm bài', 'Exam techniques.'),
] }];
const W_CHUNG = [
  tc('c1', 'Áp dụng ngữ pháp đa dạng với sự linh hoạt và chính xác', 'Applies diverse grammatical range with flexibility and accuracy'),
  tc('c2', 'Sử dụng ngôn ngữ phù hợp và chính xác', 'Uses appropriate language with accuracy.'),
  tc('c3', 'Sử dụng đa dạng cụm từ nối để tăng tính liên kết và mạch lạc', 'Uses a variety of linking devices to increase coherence and cohesion.'),
];
const W1: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [...W_CHUNG,
  tc('c4', 'Sắp xếp, trình bày và so sánh dữ liệu và thông tin theo yêu cầu của đề bài', 'Organises, presents and compares data and information as required by the tasks.')] }];
const W2: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [...W_CHUNG,
  tc('c4', 'Xác định chủ đề và phân tích yêu cầu của đề bài', 'Identifies topics and analyses requirements in the tasks.')] }];
const PREP: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [
  tc('c1', 'Sử dụng đa dạng cấu trúc ngữ pháp với độ chính xác ngày càng cao, nắm được các điểm ngữ pháp quan trọng',
    'Uses a range of grammar structures with increasing accuracy and shows awareness of key grammar points.'),
  tc('c2', 'Trả lời đúng yêu cầu đề bài, bám sát chủ đề và phản hồi đầy đủ các phần', 'Addresses the prompt clearly, stays on topic, and responds to all parts of the task.'),
  tc('c3', 'Kết nối ý mạch lạc bằng cách sử dụng từ nối và phương tiện liên kết phù hợp', 'Connects ideas clearly using appropriate linking words and cohesive devices.'),
  tc('c4', 'Sử dụng chính xác, đa dạng từ vựng học thuật và theo đúng dạng từ, cụm từ',
    'Uses a variety of academic and topic-related vocabulary accurately, with awareness of word forms and collocations.'),
  tc('c5', 'Sắp xếp ý tưởng hợp lý với câu chủ đề và thông tin hỗ trợ rõ ràng', 'Organizes ideas logically with clear topic sentences and supporting details.'),
] }];
const S: readonly NhomTieuChi[] = [{ vi: null, en: null, ds: [
  tc('c1', 'Độ trôi chảy và mạch lạc', 'Fluency and coherence'),
  tc('c2', 'Sử dụng từ ngữ đa dạng và chính xác', 'Lexical Resource'),
  tc('c3', 'Sử dụng linh hoạt chính xác cấu trúc ngữ pháp', 'Grammatical Range and Accuracy'),
  tc('c4', 'Phát âm', 'Pronunciation'),
] }];

/**
 * MỘT PHẦN của báo cáo. `khoa` = kỹ năng phân công (`teacher_assignments.skill`) — GV phân công đúng kỹ năng viết phần đó; 'chung' = GVCN.
 * Điểm tự điền đọc ô điểm cùng `khoa` của lượt (FT `writing1` / `writing2`; lớp thường `writing` = W / G+V, `speaking` = S / P).
 * `ngan` / `ten`: tên trên web; `excelVi` / `excelEn`: dòng "Giáo viên … (… Teacher)" của tệp.
 */
export type PhanBc = {
  khoa: string; ngan: string; ten: string; coDiem: boolean; nhom: readonly NhomTieuChi[];
  excelVi: string; excelEn: string;
};
const phan = (khoa: string, ngan: string, ten: string, nhom: readonly NhomTieuChi[], excelVi: string, excelEn: string, coDiem = true): PhanBc =>
  ({ khoa, ngan, ten, coDiem, nhom, excelVi, excelEn });
const P_CHUNG = phan('chung', 'Chung', 'Nhận xét chung', CHUNG, 'Giáo viên chủ nhiệm', 'Core teacher', false);
const P_L = phan('listening', 'L', 'Listening', L, 'Giáo viên nghe', 'Listening Teacher');
const P_R = phan('reading', 'R', 'Reading', R, 'Giáo viên đọc', 'Reading Teacher');
const P_S = phan('speaking', 'S', 'Speaking', S, 'Giáo viên nói', 'Speaking Teacher');

/** Bộ phần theo chương trình (đặc tả §11: FOU = L · R · W (PREP-Writing) · P — P chưa có tiêu chí; BE, ELE = L · R · W · S). Chương trình khác: chưa có mẫu → null. */
const BO_PHAN: Record<string, readonly PhanBc[]> = {
  FT: [P_CHUNG, P_L, P_R,
    phan('writing1', 'W1', 'Writing 1', W1, 'Giáo viên viết 1', 'Writing 1 Teacher'),
    phan('writing2', 'W2', 'Writing 2', W2, 'Giáo viên viết 2', 'Writing 2 Teacher'), P_S],
  FOU: [P_CHUNG, P_L, P_R,
    phan('writing', 'W', 'Writing', PREP, 'Giáo viên viết · PREP - Writing task', 'Writing Teacher'),
    phan('speaking', 'P', 'Pronunciation', [], 'Giáo viên phát âm', 'Pronunciation Teacher')],
  BE: [P_CHUNG, P_L, P_R, phan('writing', 'W', 'Writing', PREP, 'Giáo viên viết · PREP - Writing task', 'Writing Teacher'), P_S],
};
BO_PHAN.ELE = BO_PHAN.BE;

export function boPhanBc(ct: string | null | undefined): readonly PhanBc[] | null {
  return BO_PHAN[programmeOf(ct) ?? ''] ?? null;
}
/** Vai ĐỌC mọi lớp + XUẤT Excel báo cáo PH ở chi nhánh lớp (QL · QT · Admin · TVV — chủ SP 05/11). Một nguồn cho máy chủ (`quyenBc`) và web (mẫu Xuất Excel). */
export const VAI_XUAT_BC: readonly string[] = ['manager', 'system_admin', 'office_admin', 'consultant'];
export const tieuChiPhan = (p: PhanBc): TieuChiBc[] => p.nhom.flatMap((n) => n.ds);
/** Ô chữ của phần: GVCN "Nhận xét chung", kỹ năng "Đề xuất cải thiện". */
export const nhanOChu = (p: Pick<PhanBc, 'khoa'>): string => (p.khoa === 'chung' ? t('Nhận xét chung') : t('Đề xuất cải thiện'));

/**
 * Bản ghi một (đợt, em, phần). `datSan`: tiêu chí còn mức đặt sẵn theo đợt trước (GV chưa đổi) — vẽ viền đứt.
 * `diemSua`: điểm sửa tay — số, hoặc (FT, chủ SP 07/11) CHỮ tự do như mẫu PDF ("6.5 - 7.0"); cột REAL của SQLite giữ chữ dạng TEXT.
 */
export type BanGhiBc = { muc: Record<string, MucBc>; datSan: string[]; chu: string; diemSua: number | string | null };

/** Em ĐỦ ở một phần (đặc tả §5.1 + ghi chú mockup mục 5): mọi tiêu chí có mức (đặt sẵn cũng tính) + ô chữ không trống. Điểm không bắt buộc. */
export function phanDu(p: PhanBc, b: Pick<BanGhiBc, 'muc' | 'chu'> | null | undefined): boolean {
  if (!b || !b.chu.trim()) return false;
  return tieuChiPhan(p).every((x) => MUC_BC.includes(b.muc[x.khoa]));
}

// ---------------------------------------------------------------- đợt

export type LoaiDotBc = 'thang' | 'progress' | 'final' | 'them';
/**
 * `ma`: 'thang:2026-11' · 'progress:2026-11-16' · 'final:2026-12-07' (thứ Hai tuần thi) · 'them:12' (đợt QL / Admin thêm bất chợt, BC-DOT-QL).
 * `mo` / `han`: ngày ISO (hạn = cuối ngày đó, giờ VN). `ten`: tên ngắn của đợt 'them' (trống → "Đợt {mã tuần}").
 */
export type DotBc = { ma: string; loai: LoaiDotBc; mo: string; han: string; ten?: string | null };
/** Quyết định của QL / Admin cho MỘT lớp (bảng `bao_cao_ph_dot`): `bo` = mã đợt tính không cần báo cáo; `them` = đợt thêm (chưa xoá). */
export type TuyChinhDot = { bo: ReadonlySet<string>; them: readonly DotBc[] };

const pad = (n: number) => String(n).padStart(2, '0');
/** Đợt tháng FT (chủ SP 05/11): mở ngày 20, hạn ngày 30; tháng 2 hạn ngày 28 (cả năm nhuận). */
export function dotThang(nam: number, thang: number): DotBc {
  const ym = `${nam}-${pad(thang)}`;
  return { ma: `thang:${ym}`, loai: 'thang', mo: `${ym}-20`, han: `${ym}-${thang === 2 ? '28' : '30'}` };
}
/** Đợt Progress / Final lớp thường: mở thứ Hai tuần thi, hạn Chủ nhật tuần đó. */
export const dotTuan = (loai: 'progress' | 'final', thuHai: string): DotBc => ({ ma: `${loai}:${thuHai}`, loai, mo: thuHai, han: addDaysIso(thuHai, 6) });

export function docMaDot(ma: string): DotBc | null {
  const m = /^thang:(\d{4})-(\d{2})$/.exec(ma);
  if (m) { const th = Number(m[2]); return th >= 1 && th <= 12 ? dotThang(Number(m[1]), th) : null; }
  const w = /^(progress|final):(\d{4}-\d{2}-\d{2})$/.exec(ma);
  return w ? dotTuan(w[1] as 'progress' | 'final', w[2]) : null;
}

/** "Tháng 11" (khác năm hôm nay: "Tháng 11/2025") · "Progress · W3 NOV" · "Final · W2 DEC" · đợt thêm: tên QL đặt hoặc "Đợt W3 NOV". */
export function nhanDotBc(d: Pick<DotBc, 'loai' | 'mo'> & { ten?: string | null }, homNay: string): string {
  if (d.loai === 'them') return d.ten?.trim() || t('Đợt {tuan}', { tuan: tuanLich(d.mo, homNay) });
  if (d.loai === 'thang') {
    const [y, m] = d.mo.split('-').map(Number);
    return y === Number(homNay.slice(0, 4)) ? t('Tháng {m}', { m }) : t('Tháng {m}/{y}', { m, y });
  }
  return `${d.loai === 'progress' ? 'Progress' : 'Final'} · ${tuanLich(d.mo, homNay)}`;
}

/** Lịch của lớp đủ để tính đợt: FT ngày khai giảng; lớp thường thứ Hai tuần Progress / Final (`classProgress`). */
export type LichLopBc = { ft: boolean; batDau: string | null; progress: string | null; final: string | null };

/**
 * MỌI đợt của lớp (tính khi đọc, không lưu — đặc tả §10: dời tuần thi thì đợt dời theo), MỚI NHẤT TRƯỚC, kèm đợt đầu chưa mở.
 * FT: mỗi tháng từ tháng có hạn ≥ ngày khai giảng tới tháng đã mở gần nhất (tối đa 12 tháng gần nhất). Lớp thường: Progress, Final đã tới thứ Hai.
 */
export function dsDotLop(l: LichLopBc, homNay: string, tc?: TuyChinhDot): { ds: DotBc[]; dau: DotBc | null; daBo: DotBc[]; sapMo: DotBc[] } {
  const r = dsDotTinh(l, homNay);
  if (!tc || (!tc.bo.size && !tc.them.length)) return { ...r, daBo: [], sapMo: [] };
  /* LG-2 (chủ SP 14/11): đợt thêm có ngày mở ở tương lai = "sắp mở" (gần nhất trước) — chưa vào `ds` (chưa viết, chưa chip / việc); tới ngày mở tự vào `ds`. */
  const sapMo = tc.them.filter((d) => d.mo > homNay).sort((a, b) => a.mo.localeCompare(b.mo));
  /* BC-DOT-QL: đợt tính + đợt thêm (đã tới ngày mở) − đợt QL / Admin bỏ; mới nhất trước. `daBo` = đợt bỏ (để khôi phục). */
  const tatCa = [...r.ds, ...tc.them.filter((d) => d.mo <= homNay)];
  const theoMo = (a: DotBc, b: DotBc) => b.mo.localeCompare(a.mo);
  const ds = tatCa.filter((d) => !tc.bo.has(d.ma)).sort(theoMo);
  const daBo = tatCa.filter((d) => tc.bo.has(d.ma)).sort(theoMo);
  return { ds, dau: ds.length || daBo.length ? null : r.dau, daBo, sapMo };
}

/** Đợt TÍNH từ lịch lớp (chưa qua quyết định của QL / Admin). */
function dsDotTinh(l: LichLopBc, homNay: string): { ds: DotBc[]; dau: DotBc | null } {
  if (l.ft) {
    let y = Number(homNay.slice(0, 4)), m = Number(homNay.slice(5, 7));
    if (homNay < dotThang(y, m).mo) { m -= 1; if (!m) { m = 12; y -= 1; } }
    const ds: DotBc[] = [];
    while (ds.length < 12) {
      const d = dotThang(y, m);
      if (l.batDau && d.han < l.batDau) break;
      ds.push(d);
      m -= 1; if (!m) { m = 12; y -= 1; }
    }
    if (ds.length) return { ds, dau: null };
    const b = l.batDau ?? homNay;
    let by = Number(b.slice(0, 4)), bm = Number(b.slice(5, 7));
    if (dotThang(by, bm).han < b) { bm += 1; if (bm > 12) { bm = 1; by += 1; } }
    return { ds, dau: dotThang(by, bm) };
  }
  const tat = [l.progress && dotTuan('progress', l.progress), l.final && dotTuan('final', l.final)].filter((d): d is DotBc => !!d);
  const ds = tat.filter((d) => d.mo <= homNay).sort((a, b) => b.mo.localeCompare(a.mo));
  const dau = ds.length ? null : tat.sort((a, b) => a.mo.localeCompare(b.mo))[0] ?? null;
  return { ds, dau };
}

/** Đợt mở sẵn ở tab: đợt đang mở (mở ≤ hôm nay ≤ hạn), không có thì đợt gần nhất. */
export const dotMacDinh = (ds: readonly DotBc[], homNay: string): DotBc | null => ds.find((d) => d.mo <= homNay && homNay <= d.han) ?? ds[0] ?? null;
/** Đợt ngay trước `d` (đặt sẵn tiêu chí "như {đợt trước}"): FT tháng trước; lớp thường đợt cũ hơn kế tiếp trong danh sách. */
export function dotTruoc(d: DotBc, ds: readonly DotBc[]): DotBc | null {
  if (d.loai === 'thang') {
    const y = Number(d.mo.slice(0, 4)), m = Number(d.mo.slice(5, 7));
    return m === 1 ? dotThang(y - 1, 12) : dotThang(y, m - 1);
  }
  const i = ds.findIndex((x) => x.ma === d.ma);
  return i >= 0 ? ds[i + 1] ?? null : null;
}
/** Số ngày quá hạn (0 = chưa quá). */
export function soNgayQuaHan(d: Pick<DotBc, 'han'>, homNay: string): number {
  return homNay <= d.han ? 0 : Math.round((Date.parse(homNay) - Date.parse(d.han)) / 86_400_000);
}

// ---------------------------------------------------------------- điểm tự điền

/**
 * ĐIỂM GỐC của một phần (đặc tả §6, §10): FT = band kỹ năng của lượt Mock gần nhất có điểm trong tháng; lớp thường = điểm / tổng của lượt Progress / Final.
 * `kyVong` (FT) / `nguong` (lớp thường, 0–1): để tô ✓ / ✗ cả điểm sửa tay bằng CÙNG luật. `luot` "MT4" · "Progress"; `tuan` thứ Hai tuần thi.
 */
export type DiemGocBc = { so: number; tong: number | null; kyVong: number | null; nguong: number | null; luot: string; tuan: string | null };

/** Kết quả tô màu (cùng `ODiem`): FT so kỳ vọng của lượt (`soKyVong`); lớp thường đạt / dưới ngưỡng. */
export function kqDiemBc(so: number | null, g: Pick<DiemGocBc, 'tong' | 'kyVong' | 'nguong'> | null): 'vuot' | 'bang' | 'dat' | 'duoi' | null {
  if (so == null || !g) return null;
  if (g.tong != null) return g.nguong == null || !g.tong ? null : so / g.tong >= g.nguong ? 'dat' : 'duoi';
  return soKyVong(so, g.kyVong);
}
/** Tối đa ký tự điểm FT sửa thành chữ ("6.5 - 7.0"). */
export const DIEM_CHU_TOI_DA = 20;
/**
 * Đọc ô điểm sửa tay (web + máy chủ cùng luật): trống → null; chữ số ("6,5", "7") → số và kiểm như `loiDiemSua`;
 * chữ khác → chỉ FT (`ft`), ≤ 20 ký tự. Trả { gt, loi }.
 */
export function docDiemSua(v: unknown, ft: boolean, tong: number | null): { gt: number | string | null; loi: string | null } {
  if (v == null) return { gt: null, loi: null };
  const s = String(v).trim().replace(',', '.');
  if (!s) return { gt: null, loi: null };
  if (/^\d+(\.\d+)?$/.test(s)) { const so = Number(s); return { gt: so, loi: loiDiemSua(so, ft ? null : tong) }; }
  if (!ft) return { gt: null, loi: t('Điểm không hợp lệ') };
  const chu = String(v).trim();
  return chu.length > DIEM_CHU_TOI_DA ? { gt: null, loi: t('Tối đa {n} ký tự', { n: DIEM_CHU_TOI_DA }) } : { gt: chu, loi: null };
}
/** Chữ điểm in PDF như mẫu: FT band ("6.5") hoặc chữ sửa ("6.5 - 7.0"); lớp thường "29/40 - ĐẠT" / "20/40 - CHƯA ĐẠT". Không điểm → null. */
export function chuDiemPdf(sua: number | string | null, goc: DiemGocBc | null): string | null {
  if (typeof sua === 'string') return sua;
  const so = sua ?? goc?.so ?? null;
  if (so == null) return null;
  if (goc?.tong == null) return chuDiem(so);
  const kq = kqDiemBc(so, goc);
  return `${so}/${goc.tong}${kq === 'dat' ? ' - ĐẠT' : kq === 'duoi' ? ' - CHƯA ĐẠT' : ''}`;
}

/**
 * NỘI DUNG PDF MỘT EM (BCPH-PDF) — máy chủ dựng cùng nguồn Excel (`xuatBaoCaoPh.ts`), web vẽ (`pdfBaoCaoPh.ts`).
 * `ngan`: Chung · L · R · W1 · W2 · W · S · P (tiêu đề khối). `diem`: chữ đã định dạng (`chuDiemPdf`). `muc`: null = chưa chọn.
 */
export type BaoCaoPdf = {
  ft: boolean; diaChi: string | null; soDienThoai: string | null; hocVien: string; lop: string;
  phan: {
    khoa: string; ngan: string; gv: string; chu: string; diem: string | null;
    nhom: { vi: string | null; en: string | null; ds: { vi: string; en: string; muc: MucBc | null }[] }[];
  }[];
};

/** Kiểm điểm sửa tay (ghi chú mockup mục 5): FT band 0–9 bước 0.5; lớp thường số nguyên 0 → tổng. Trả câu lỗi hoặc null. */
export function loiDiemSua(so: number, tong: number | null): string | null {
  if (!Number.isFinite(so) || so < 0) return t('Điểm không hợp lệ');
  if (tong != null) return Number.isInteger(so) && so <= tong ? null : t('Điểm từ 0 đến {tong}', { tong });
  return so <= 9 && Math.round(so * 2) === so * 2 ? null : t('Band từ 0 đến 9, bước 0.5');
}
