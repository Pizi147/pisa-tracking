/**
 * CAU-HINH-CASE-SOS (chủ SP 11/11, đặc tả `docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md`) — NGUỒN CẤU HÌNH của ba danh sách mà
 * Quản trị sửa được: nhóm nguyên nhân Case (FT / lớp thường riêng), nhóm phương án, việc theo mốc SOS (FT + lớp thường).
 *
 * Hàm cũ (`issuesForTopic`, `INTERVENTION_KIND_LABEL`, `academicSupportFor`, `sosCoordinationFor`…) đọc qua `cauHinh` / `cauHinhPb` ở đây. Máy chủ cấp
 * nguồn từ bảng `cau_hinh_phien_ban` (nhớ theo tiến trình), web cấp từ phiên đăng nhập; chưa ai cấp → BẢN GỐC = đúng hằng số trong mã, nên ngày đầu
 * hành vi không đổi. GỐC dựng LƯỜI (hàm), vì `cases.ts` / `sos.ts` cũng nhập file này — dựng lúc nạp module sẽ vướng vòng nhập.
 */
import { dich, NGON_NGU } from '../i18n/index.ts';
import { ISSUE_TAXONOMY, NHAN_LOAI_PA_GOC, SELF_SERVE_KINDS, ACADEMIC_PROPOSAL_KINDS, type IssueBranch } from './cases.ts';
import { DEFAULT_ACADEMIC_SUPPORT, DEFAULT_SOS_COORDINATION, NHAN_VIEC_GOC, HAN_MEETING_CX_NGAY, GHI_CHU_MEETING_TOI_THIEU, COORDINATION_KINDS,
  type AcademicSupportSpan } from './sos.ts';
import { programmeOf } from './normal.ts';
import { laKhac } from './khac.ts';

export type LoaiCauHinh = 'nguyen_nhan' | 'phuong_an' | 'moc_sos';
export const LOAI_CAU_HINH: readonly LoaiCauHinh[] = ['nguyen_nhan', 'phuong_an', 'moc_sos'];
export type BenLop = 'ft' | 'thuong';
export type NhanhNN = IssueBranch['key'];

export type MucNguyenNhan = { ma: string; ten: string; tenEn?: string; giaiThich?: string; an?: true };
export type NguyenNhan = { ft: Partial<Record<NhanhNN, MucNguyenNhan[]>>; thuong: Partial<Record<NhanhNN, MucNguyenNhan[]>> };

export type NhomPa = 'gv_tu_lam' | 'can_ql_duyet';
export type MucPa = { ma: string; ten: string; tenEn?: string; nhom: NhomPa; nguoiDay: boolean; soBuoi: boolean; an?: true };
export type PhuongAn = { muc: MucPa[] };

/** Việc phối hợp: người làm luôn GVCN (QL làm thẳng) — chủ SP 14/11 bỏ ô "Ai làm"; bản cấu hình cũ còn trường `aiLam` thì bỏ qua (không đọc, không kiểm). */
export type Viec = { ma: string; ten: string; tenEn?: string; hanNgay: number | null; ghiChu: 'khong' | 'bat_buoc'; toiThieu?: number;
  buocTvv?: { hanNgay: number; toiThieu: number }; an?: true };
export type OMoc = { pa: { loai: string; den: AcademicSupportSpan } | null; viec: string[] };
export const HANG_FT = ['mt1', 'mt2', 'mt3', 'mt4', 'mt5', 'rf'] as const;
/** `details` của lỗi 400 khi người dùng chọn nhóm / loại PA vừa bị Quản trị ẩn (web giữ cấu hình theo phiên) — web thấy thì tải lại phiên. */
export const DANH_MUC_DOI = { danhMucDoi: true } as const;
/** Mã do Quản trị thêm (`….m<n>`) — mã gốc (hằng số cũ) luôn coi là đang dùng: chỉ ẩn được. */
export const laMaThem = (ma: string): boolean => /\.m\d+$/.test(ma);
/** Số ô Mốc SOS FT có PA quy chế là `ma` (một bản mốc). */
export const soOMocCuaPa = (moc: MocSos, ma: string): number =>
  HANG_FT.reduce((n, h) => n + (['1', '2', '3'] as const).filter((s) => moc.ft[h]?.[s]?.pa?.loai === ma).length, 0);
export type HangFt = (typeof HANG_FT)[number];
export type MucSos = '1' | '2' | '3';
export type MocThuong = {
  progress: { viec: string[]; fou: number; beEle: number };          // Bổ trợ Giữa khoá: buổi / tuần
  final6069: { viec: string[]; tuan: number; preFou: number };       // Bổ trợ miễn phí: tuần × môn trượt; Pre FOU: buổi chung
  final5059Len: { viec: string[]; tuan: number; preFou: number };
  final5059HocLai: { viec: string[] };
  finalDuoi50: { viec: string[] };
  khongDatKyVong: { viec: string[]; tutor: number };                 // Tutor n buổi / kỹ năng
};
export type MocSos = { viec: Viec[]; ft: Record<HangFt, Record<MucSos, OMoc>>; thuong: MocThuong };

export type DuLieuCauHinh = { nguyen_nhan: NguyenNhan; phuong_an: PhuongAn; moc_sos: MocSos };
export type BanCauHinh<L extends LoaiCauHinh = LoaiCauHinh> = { id: number; du_lieu: DuLieuCauHinh[L] };

/**
 * Quy ước phiên bản: bảng rỗng = BẢN GỐC (id 0). Dòng mới luôn có id ≥ 2 (máy chủ đặt `MAX(MAX(id), 1) + 1`), nên con trỏ cũ
 * `case_issues.taxonomy_version = 1` (mặc định từ trước khi có cấu hình), NULL, 0 hay id không còn → đều là bản gốc.
 */
export const PB_GOC = 0;

const NHANH_FT: readonly NhanhNN[] = ['listening', 'reading', 'writing', 'speaking'];
const NHANH_THUONG: readonly NhanhNN[] = ['listening', 'reading', 'writing', 'speaking', 'gv', 'phat_am', 'tong_hop'];

let goc: DuLieuCauHinh | null = null;
/** BẢN GỐC — đúng hằng số đang chạy (nhãn tiếng Việt: máy chủ dựng, NGON_NGU = vi). */
export function cauHinhGoc(): DuLieuCauHinh {
  if (goc) return goc;
  const nhanh = (k: NhanhNN): MucNguyenNhan[] => (ISSUE_TAXONOMY.find((b) => b.key === k)?.items ?? [])
    .map((i) => ({ ma: i.code, ten: i.label, ...(i.hint ? { giaiThich: i.hint } : {}) }));
  const mucPa = (ma: string, nhom: NhomPa): MucPa => ({ ma, ten: NHAN_LOAI_PA_GOC[ma as keyof typeof NHAN_LOAI_PA_GOC] ?? ma, nhom,
    nguoiDay: ma === 'tutor', soBuoi: ma === 'tutor' || ma === 'self_study' });
  const o = (attemptNo: 1 | 2 | 3 | 4 | 5, sos: 1 | 2 | 3): OMoc => {
    const r = DEFAULT_ACADEMIC_SUPPORT[attemptNo][sos];
    return { pa: { loai: r.kind, den: r.span }, viec: [...DEFAULT_SOS_COORDINATION[Math.min(attemptNo, 4) as 1 | 2 | 3 | 4][sos]] };
  };
  const hang = (n: 1 | 2 | 3 | 4 | 5) => ({ '1': o(n, 1), '2': o(n, 2), '3': o(n, 3) });
  goc = {
    nguyen_nhan: {
      ft: Object.fromEntries(NHANH_FT.map((k) => [k, nhanh(k)])),
      thuong: Object.fromEntries(NHANH_THUONG.map((k) => [k, nhanh(k)])),
    },
    phuong_an: { muc: [...SELF_SERVE_KINDS.map((k) => mucPa(k, 'gv_tu_lam')), ...ACADEMIC_PROPOSAL_KINDS.map((k) => mucPa(k, 'can_ql_duyet'))] },
    moc_sos: {
      /* PHOI-HOP-V2 XM-1 (chủ SP 11/11 qua PTA): mọi việc GVCN làm (QL làm thẳng); Nội dung BẮT BUỘC khi xác nhận (≥ 1 ký tự) — trừ Meeting CX/GĐCN
         (nội dung gửi TVV tuỳ chọn) và Báo PH kết quả Test lớp thường (4 nội dung máy dựng). Meeting CX/GĐCN: GVCN xác nhận → bước TVV báo gia đình,
         sắp họp, ghi kết quả — hạn 5 ngày lịch, Nội dung ≥ 10 ký tự (luật OV-12h chuyển sang bước TVV). */
      viec: COORDINATION_KINDS.map((k) => {
        const meeting = k === 'cx_meeting_student' || k === 'cx_meeting_family';
        const batBuoc = !meeting && k !== 'bao_ph_tvv';
        return {
          ma: k, ten: NHAN_VIEC_GOC[k],
          hanNgay: meeting ? HAN_MEETING_CX_NGAY : null,
          ghiChu: batBuoc ? 'bat_buoc' as const : 'khong' as const,
          ...(batBuoc ? { toiThieu: 1 } : {}),
          ...(meeting ? { buocTvv: { hanNgay: HAN_MEETING_CX_NGAY, toiThieu: GHI_CHU_MEETING_TOI_THIEU } } : {}),
        };
      }),
      /* RF: mã cũ dùng hàng MT3 cho PA (≡ MT4 ≡ MT5) và hàng MT4 cho việc → hàng riêng = MT4. */
      ft: { mt1: hang(1), mt2: hang(2), mt3: hang(3), mt4: hang(4), mt5: hang(5), rf: hang(4) },
      thuong: {
        progress: { viec: ['bao_ph_tvv'], fou: 2, beEle: 1 },
        final6069: { viec: [], tuan: 1, preFou: 2 },
        final5059Len: { viec: [], tuan: 2, preFou: 4 },
        final5059HocLai: { viec: ['bao_ph_tvv'] },
        finalDuoi50: { viec: ['bao_ph_tvv'] },
        khongDatKyVong: { viec: [], tutor: 10 },
      },
    },
  };
  return goc;
}

// ---------------------------------------------------------------- nguồn

export type NguonCauHinh = {
  hienTai: <L extends LoaiCauHinh>(l: L) => BanCauHinh<L>;
  theoPb: <L extends LoaiCauHinh>(l: L, id: number) => BanCauHinh<L> | null;
};
const banGoc = <L extends LoaiCauHinh>(l: L): BanCauHinh<L> => ({ id: PB_GOC, du_lieu: cauHinhGoc()[l] });
const nguonGoc: NguonCauHinh = { hienTai: banGoc, theoPb: () => null };
let nguon: NguonCauHinh = nguonGoc;
/** Máy chủ (DB) / web (phiên) cấp nguồn; `null` → về bản gốc (phép kiểm). */
export function datNguonCauHinh(n: NguonCauHinh | null): void { nguon = n ?? nguonGoc; }
export const cauHinh = <L extends LoaiCauHinh>(l: L): BanCauHinh<L> => nguon.hienTai(l);
/** Bản `pb` mà Case / PA / việc chụp lúc sinh: `undefined` → bản đang dùng; NULL / 0 / 1 cũ / không thấy → bản gốc. */
export const cauHinhPb = <L extends LoaiCauHinh>(l: L, pb: number | null | undefined): BanCauHinh<L> =>
  pb === undefined ? nguon.hienTai(l) : (pb ? nguon.theoPb(l, pb) : null) ?? banGoc(l);

/** Tên hiện: giao diện tiếng Anh dùng `tenEn` nếu có, không thì từ điển (mục gốc) / chính tên. */
export const tenHien = (m: { ten: string; tenEn?: string }): string => (NGON_NGU === 'en' && m.tenEn ? m.tenEn : dich(m.ten));

/** Bên của chương trình: FT (hoặc không rõ) → 'ft'; mọi chương trình khác (FOU, BE, ELE, Pre FOU, KET, PET…) → 'thuong'. */
export function benCua(ct: string | null | undefined): BenLop {
  const c = programmeOf(ct);
  return !c || c === 'FT' ? 'ft' : 'thuong';
}

// ---------------------------------------------------------------- kiểm

export type LoiCauHinh = { duong: string; loi: string };
const chuan = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const chuHopLe = (v: unknown, max: number, bat = true) => (v == null || v === '' ? !bat : typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max);
const soNguyen = (v: unknown, a: number, b: number) => Number.isInteger(v) && (v as number) >= a && (v as number) <= b;

function kiemTen(ds: readonly { ma: unknown; ten: unknown; tenEn?: unknown }[], duong: string, loi: LoiCauHinh[]) {
  const da = new Map<string, string>();
  const ma = new Set<string>();
  ds.forEach((m, i) => {
    const d = `${duong}[${i}]`;
    if (typeof m.ma !== 'string' || !m.ma) loi.push({ duong: d, loi: 'Thiếu mã mục.' });
    else if (ma.has(m.ma)) loi.push({ duong: d, loi: `Mã "${m.ma}" lặp.` });
    else ma.add(m.ma);
    if (!chuHopLe(m.ten, 60)) { loi.push({ duong: `${d}.ten`, loi: 'Tên 1–60 ký tự.' }); return; }
    if (!chuHopLe(m.tenEn, 60, false)) loi.push({ duong: `${d}.tenEn`, loi: 'Tên tiếng Anh tối đa 60 ký tự.' });
    const k = chuan(m.ten as string);
    if (da.has(k)) loi.push({ duong: `${d}.ten`, loi: `Trùng tên với "${da.get(k)}" trong cùng nhóm — đổi tên khác.` });
    else da.set(k, (m.ten as string).trim());
  });
}

/**
 * Lỗi theo ô (rỗng = hợp lệ). Mục của BẢN GỐC (mã có hành vi trong mã) không được biến mất — chỉ ẩn. Mục Quản trị thêm: bỏ được khi CHƯA có gì dùng —
 * máy chủ kiểm bằng DB (`luuCauHinh`), ở đây không biết.
 */
export function kiemCauHinh<L extends LoaiCauHinh>(l: L, d: unknown): LoiCauHinh[] {
  const cu = cauHinhGoc()[l];
  const loi: LoiCauHinh[] = [];
  if (!d || typeof d !== 'object') return [{ duong: '', loi: 'Dữ liệu cấu hình không hợp lệ.' }];
  if (l === 'nguyen_nhan') {
    const x = d as NguyenNhan, c = cu as NguyenNhan;
    for (const ben of ['ft', 'thuong'] as const) {
      const nhanh = ben === 'ft' ? NHANH_FT : NHANH_THUONG;
      for (const k of nhanh) {
        const ds = x[ben]?.[k];
        const duong = `${ben}.${k}`;
        if (!Array.isArray(ds)) { loi.push({ duong, loi: 'Thiếu danh sách nhóm.' }); continue; }
        kiemTen(ds, duong, loi);
        ds.forEach((m, i) => {
          if (!chuHopLe(m.giaiThich, 160, false)) loi.push({ duong: `${duong}[${i}].giaiThich`, loi: 'Giải thích tối đa 160 ký tự.' });
          if (typeof m.ma === 'string' && m.ma && !m.ma.startsWith(`student.${k}.`)) loi.push({ duong: `${duong}[${i}]`, loi: 'Mã nhóm sai nhánh.' });
        });
        const cuoi = ds[ds.length - 1];
        if (!cuoi || !laKhac(cuoi.ma) || cuoi.an) loi.push({ duong, loi: '"Khác" phải có, đứng cuối và không ẩn.' });
        for (const m of c[ben]?.[k] ?? []) if (!ds.some((y) => y.ma === m.ma)) loi.push({ duong, loi: `Nhóm "${m.ten}" đã có — chỉ ẩn được, không xoá.` });
      }
    }
  } else if (l === 'phuong_an') {
    const x = d as PhuongAn, c = cu as PhuongAn;
    if (!Array.isArray(x.muc)) return [{ duong: 'muc', loi: 'Thiếu danh sách phương án.' }];
    kiemTen(x.muc, 'muc', loi);
    x.muc.forEach((m, i) => {
      if (m.nhom !== 'gv_tu_lam' && m.nhom !== 'can_ql_duyet') loi.push({ duong: `muc[${i}].nhom`, loi: 'Nhóm phải là GV tự làm hoặc Cần QL duyệt.' });
      if (typeof m.nguoiDay !== 'boolean' || typeof m.soBuoi !== 'boolean') loi.push({ duong: `muc[${i}]`, loi: 'Thiếu cờ người dạy / số buổi.' });
      const g = cauHinhGoc().phuong_an.muc.find((y) => y.ma === m.ma);
      if (g && (g.nhom !== m.nhom || g.nguoiDay !== m.nguoiDay || g.soBuoi !== m.soBuoi)) loi.push({ duong: `muc[${i}]`, loi: `"${m.ten}" có cách chạy cố định — chỉ đổi tên / thứ tự / ẩn.` });
      if (typeof m.ma === 'string' && !g && !/^pa\.m\d+$/.test(m.ma)) loi.push({ duong: `muc[${i}]`, loi: 'Mã phương án mới không hợp lệ.' });
    });
    if (x.muc.length && !laKhac(x.muc[x.muc.length - 1].ma)) loi.push({ duong: 'muc', loi: '"Khác" (cần QL duyệt) phải đứng cuối.' });
    if (x.muc.find((m) => laKhac(m.ma))?.an) loi.push({ duong: 'muc', loi: '"Khác" không ẩn được.' });
    /* PA đang là PA quy chế ở ô Mốc SOS: không ẩn / không chuyển sang Cần QL duyệt (bỏ khỏi ô trước). */
    const moc = cauHinh('moc_sos').du_lieu;
    for (const m of x.muc) {
      const so = soOMocCuaPa(moc, m.ma);
      if (so && (m.an || m.nhom !== 'gv_tu_lam')) loi.push({ duong: 'muc', loi: `"${m.ten}" đang ở ${so} ô Mốc SOS — bỏ khỏi ô trước.` });
    }
    for (const m of c.muc) if (!x.muc.some((y) => y.ma === m.ma)) loi.push({ duong: 'muc', loi: `Phương án "${m.ten}" đã có — chỉ ẩn được, không xoá.` });
  } else {
    const x = d as MocSos, c = cu as MocSos;
    if (!Array.isArray(x.viec)) return [{ duong: 'viec', loi: 'Thiếu danh mục việc.' }];
    kiemTen(x.viec, 'viec', loi);
    const maViec = new Map(x.viec.map((v) => [v.ma, v]));
    x.viec.forEach((v, i) => {
      const d0 = `viec[${i}]`;
      if (v.hanNgay !== null && !soNguyen(v.hanNgay, 1, 60)) loi.push({ duong: `${d0}.hanNgay`, loi: 'Hạn 1–60 ngày hoặc không hạn.' });
      if (v.ghiChu !== 'khong' && v.ghiChu !== 'bat_buoc') loi.push({ duong: `${d0}.ghiChu`, loi: 'Ghi chú: không bắt buộc / bắt buộc.' });
      if (v.ghiChu === 'bat_buoc' && !soNguyen(v.toiThieu, 1, 200)) loi.push({ duong: `${d0}.toiThieu`, loi: 'Tối thiểu 1–200 ký tự.' });
      if (v.buocTvv && (!soNguyen(v.buocTvv.hanNgay, 1, 60) || !soNguyen(v.buocTvv.toiThieu, 1, 200))) loi.push({ duong: `${d0}.buocTvv`, loi: 'Bước TVV: hạn 1–60 ngày, tối thiểu 1–200 ký tự.' });
      if (!(COORDINATION_KINDS as readonly string[]).includes(v.ma) && !/^viec\.m\d+$/.test(v.ma)) loi.push({ duong: d0, loi: 'Mã việc mới không hợp lệ.' });
    });
    for (const v of c.viec) if (!maViec.has(v.ma)) loi.push({ duong: 'viec', loi: `Việc "${v.ten}" đã có — chỉ ẩn được, không xoá.` });
    const kiemDs = (ds: unknown, duong: string) => {
      if (!Array.isArray(ds)) { loi.push({ duong, loi: 'Thiếu danh sách việc.' }); return; }
      for (const ma of ds) {
        const v = maViec.get(ma);
        if (!v) loi.push({ duong, loi: `Việc "${ma}" không có trong danh mục.` });
        else if (v.an) loi.push({ duong, loi: `"${v.ten}" đang ẩn — hiện lại hoặc bỏ khỏi ô.` });
      }
      if (new Set(ds).size !== ds.length) loi.push({ duong, loi: 'Việc lặp trong ô.' });
    };
    const pa = cauHinh('phuong_an').du_lieu.muc;
    for (const h of HANG_FT) for (const s of ['1', '2', '3'] as const) {
      const o = x.ft?.[h]?.[s];
      const duong = `ft.${h}.${s}`;
      if (!o) { loi.push({ duong, loi: 'Thiếu ô mốc.' }); continue; }
      kiemDs(o.viec, duong);
      if (o.pa !== null) {
        const m = pa.find((y) => y.ma === o.pa?.loai);
        if (!m || m.nhom !== 'gv_tu_lam') loi.push({ duong, loi: 'PA quy chế phải là phương án GV tự làm.' });
        else if (m.an) loi.push({ duong, loi: `"${m.ten}" đang ẩn — chọn PA khác.` });
        if (!['one_month', 'until_next_mt', 'until_exam'].includes(o.pa?.den as string)) loi.push({ duong, loi: 'Đến khi: 1 tháng / đến MT kế / đến lúc thi.' });
      }
    }
    const t = x.thuong;
    if (!t) loi.push({ duong: 'thuong', loi: 'Thiếu mốc lớp thường.' });
    else {
      for (const k of ['progress', 'final6069', 'final5059Len', 'final5059HocLai', 'finalDuoi50', 'khongDatKyVong'] as const) kiemDs(t[k]?.viec, `thuong.${k}`);
      const so = (v: unknown, duong: string) => { if (!soNguyen(v, 1, 60)) loi.push({ duong, loi: 'Số 1–60.' }); };
      so(t.progress?.fou, 'thuong.progress.fou'); so(t.progress?.beEle, 'thuong.progress.beEle');
      so(t.final6069?.tuan, 'thuong.final6069.tuan'); so(t.final6069?.preFou, 'thuong.final6069.preFou');
      so(t.final5059Len?.tuan, 'thuong.final5059Len.tuan'); so(t.final5059Len?.preFou, 'thuong.final5059Len.preFou');
      so(t.khongDatKyVong?.tutor, 'thuong.khongDatKyVong.tutor');
    }
  }
  return loi;
}

// ---------------------------------------------------------------- mô tả lần đổi (nhật ký)

export type ThayDoi = { viec: 'them' | 'sua' | 'an' | 'hien' | 'xoa' | 'thu_tu' | 'o_moc'; muc: string; truoc?: string; sau?: string };

function doiDs(ds0: readonly { ma: string; ten: string; an?: true }[], ds1: readonly { ma: string; ten: string; an?: true }[], nhom: string, r: ThayDoi[],
  them?: (a: any, b: any) => string[]) {
  const cu = new Map(ds0.map((m) => [m.ma, m]));
  for (const m of ds1) {
    const a = cu.get(m.ma);
    const ten = nhom ? `${nhom} · ${m.ten}` : m.ten;
    if (!a) { r.push({ viec: 'them', muc: ten }); continue; }
    if (a.ten !== m.ten) r.push({ viec: 'sua', muc: nhom ? `${nhom} · tên` : 'tên', truoc: a.ten, sau: m.ten });
    if (!a.an && m.an) r.push({ viec: 'an', muc: ten });
    if (a.an && !m.an) r.push({ viec: 'hien', muc: ten });
    for (const s of them?.(a, m) ?? []) r.push({ viec: 'sua', muc: ten, sau: s });
  }
  for (const a of ds0) if (!ds1.some((m) => m.ma === a.ma)) r.push({ viec: 'xoa', muc: nhom ? `${nhom} · ${a.ten}` : a.ten });
  const thu0 = ds0.filter((a) => ds1.some((m) => m.ma === a.ma)).map((a) => a.ma).join('|');
  const thu1 = ds1.filter((m) => cu.has(m.ma)).map((m) => m.ma).join('|');
  if (thu0 !== thu1) r.push({ viec: 'thu_tu', muc: nhom || 'danh sách' });
}

const TEN_NHANH_NK: Partial<Record<NhanhNN, string>> = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
  gv: 'G+V', phat_am: 'Pronunciation', tong_hop: 'Tổng hợp' };
export function thayDoi<L extends LoaiCauHinh>(l: L, a: DuLieuCauHinh[L], b: DuLieuCauHinh[L]): ThayDoi[] {
  const r: ThayDoi[] = [];
  if (l === 'nguyen_nhan') {
    const x = a as NguyenNhan, y = b as NguyenNhan;
    for (const ben of ['ft', 'thuong'] as const) for (const k of Object.keys(y[ben]) as NhanhNN[]) {
      doiDs(x[ben][k] ?? [], y[ben][k] ?? [], `${ben === 'ft' ? 'FT' : 'Lớp thường'} · ${TEN_NHANH_NK[k] ?? k}`, r,
        (p, q) => ((p.giaiThich ?? '') !== (q.giaiThich ?? '') ? ['giải thích'] : []).concat((p.tenEn ?? '') !== (q.tenEn ?? '') ? ['tên tiếng Anh'] : []));
    }
  } else if (l === 'phuong_an') {
    doiDs((a as PhuongAn).muc, (b as PhuongAn).muc, '', r,
      (p, q) => [p.nhom !== q.nhom ? 'nhóm' : '', p.nguoiDay !== q.nguoiDay ? 'người dạy' : '', p.soBuoi !== q.soBuoi ? 'số buổi' : '', (p.tenEn ?? '') !== (q.tenEn ?? '') ? 'tên tiếng Anh' : ''].filter(Boolean));
  } else {
    const x = a as MocSos, y = b as MocSos;
    doiDs(x.viec, y.viec, 'Việc', r, (p, q) => [p.hanNgay !== q.hanNgay ? 'hạn' : '',
      p.ghiChu !== q.ghiChu || p.toiThieu !== q.toiThieu ? 'ghi kết quả' : '', JSON.stringify(p.buocTvv ?? null) !== JSON.stringify(q.buocTvv ?? null) ? 'bước TVV' : '',
      (p.tenEn ?? '') !== (q.tenEn ?? '') ? 'tên tiếng Anh' : ''].filter(Boolean));
    for (const h of HANG_FT) for (const s of ['1', '2', '3'] as const) {
      if (JSON.stringify(x.ft[h][s]) !== JSON.stringify(y.ft[h][s])) r.push({ viec: 'o_moc', muc: `${h === 'rf' ? 'RF' : h.toUpperCase()} · SOS ${s}` });
    }
    for (const k of Object.keys(y.thuong) as (keyof MocThuong)[]) {
      if (JSON.stringify(x.thuong[k]) !== JSON.stringify(y.thuong[k])) r.push({ viec: 'o_moc', muc: `Lớp thường · ${k}` });
    }
  }
  return r;
}
