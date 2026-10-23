/**
 * LUẬT THUẦN CỦA TAB HÀNH TRÌNH (PR-Qb, spec §3.8) — trục tuần, tầng khối phương án, badge hộp kỹ năng,
 * chuỗi điểm, nhãn ghim đợt Test, nhãn giai đoạn. Giao diện chỉ vẽ theo những gì các hàm này trả về;
 * máy chủ (`server/src/students/hanhTrinh.ts`) chỉ truy vấn dữ liệu rồi gọi các hàm này.
 *
 * Chỉ nhận chuỗi ISO `yyyy-mm-dd` (không giờ, không múi giờ — máy chủ đã quy về ngày trước khi gọi).
 */
import { outcomeLabelFor } from './cases.ts';
import { tuanHocFt, tuanLich } from './hienThiNgay.ts';
import { tenMonNgan, nhanBaiThuong, ATTEMPT_KIND_NGAN } from './normal.ts';
import { nhanGoiY, type BoTroMienPhi } from './cuoiKhoa.ts';
import { RATIO_PASS_THRESHOLD } from './normal.ts';
import { addDaysIso } from './sos.ts';
import { ASSESSED_SKILL_LABEL } from './skills.ts';
import { mondayOfDate, owningMonthOf, weekNumberInMonthOf, MONTH_CODE } from './week.ts';
import type { TrangThai } from './trangThai.ts';
import { dich, kem, t, type ChuKhoa } from '../i18n/index.ts';

const DAY_MS = 86_400_000;
const ngayThu = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY_MS;

/** `addDays` riêng của module này — cùng cách `cases.ts`/`sos.ts` đã làm, không kéo một tiện ích chung. */
function addDays(iso: string, n: number): string {
  return new Date(ngayThu(iso) * DAY_MS + n * DAY_MS).toISOString().slice(0, 10);
}

// ====================================================================== khoảng đang xem (Q3)

export type CheDoKhoang = '3-thang' | 'ca-giai-doan';

/**
 * KHOẢNG NGÀY ĐANG XEM trên trục — luôn khoá về thứ Hai đầu tuần và thứ Hai cuối tuần (một cột trục =
 * một tuần trọn vẹn, không cắt nửa tuần).
 *
 *   3-thang        `den` = tuần SAU tuần này (13 tuần); giai đoạn đã kết thúc → `den` = tuần kết thúc
 *                  giai đoạn đó. `tu` = `den` − 12 tuần, kẹp không sớm hơn tuần bắt đầu giai đoạn.
 *   ca-giai-doan   `tu` = tuần bắt đầu giai đoạn; `den` như trên.
 */
export function khoangTruc(
  gd: { tu: string; den: string | null },
  homNay: string,
  cheDo: CheDoKhoang,
): { tu: string; den: string } {
  const batDau = mondayOfDate(gd.tu);
  const den = gd.den ? mondayOfDate(gd.den) : addDays(mondayOfDate(homNay), 7);
  if (cheDo === 'ca-giai-doan') return { tu: batDau, den };
  const tu12 = addDays(den, -12 * 7);
  return { tu: tu12 < batDau ? batDau : tu12, den };
}

// ====================================================================== trục tuần/tháng (Q2, Q20)

export type TrucTuan = {
  tuan: { thuHai: string; nhan: string; dauThang: boolean; homNay: boolean }[];
  thang: { nhan: string; tu: number; so: number }[];
};

/**
 * DỰNG TRỤC: một cột = một tuần thật theo lịch (`week.ts`), không ép 4 tuần/tháng. Hàng tháng ghi
 * mã tháng (không năm — trục hiếm khi dài quá một năm; vắt năm thì DEC/JAN vẫn là hai mã khác nhau
 * nên không lặp). Hàng tuần ghi số thứ tự tuần TRONG tháng sở hữu của nó ("W5" ở tháng 5 tuần).
 */
export function trucTuan(tu: string, den: string, homNay: string): TrucTuan {
  const tuTuan = mondayOfDate(tu);
  const denTuan = mondayOfDate(den);
  const homNayTuan = mondayOfDate(homNay);
  const tuan: TrucTuan['tuan'] = [];
  let cursor = tuTuan;
  let thangTruoc: string | null = null;
  while (cursor <= denTuan) {
    const { year, month } = owningMonthOf(cursor);
    const khoaThang = `${year}-${month}`;
    tuan.push({
      thuHai: cursor,
      nhan: `W${weekNumberInMonthOf(cursor)}`,
      dauThang: khoaThang !== thangTruoc,
      homNay: cursor === homNayTuan,
    });
    thangTruoc = khoaThang;
    cursor = addDays(cursor, 7);
  }
  const thang: TrucTuan['thang'] = [];
  tuan.forEach((w, i) => {
    if (w.dauThang) thang.push({ nhan: MONTH_CODE[owningMonthOf(w.thuHai).month - 1], tu: i, so: 1 });
    else thang[thang.length - 1].so += 1;
  });
  return { tuan, thang };
}

/** Cột (chỉ số 0-based) của tuần chứa `ngay` trên `truc`; ngoài trục thì kẹp về cột đầu/cuối. */
export function cotCua(ngay: string, truc: TrucTuan): number {
  if (truc.tuan.length === 0) return 0;
  const tuan = mondayOfDate(ngay);
  const idx = truc.tuan.findIndex((w) => w.thuHai === tuan);
  if (idx >= 0) return idx;
  return tuan < truc.tuan[0].thuHai ? 0 : truc.tuan.length - 1;
}

/**
 * `tu..den` có GIAO khoảng đang xem không (sửa sau rà #75, vấn đề 2) — `cotCua` một mình chỉ biết
 * KẸP về mép, không biết một mục NẰM HẲN NGOÀI khoảng để giao diện ẨN thay vì vẽ dính mép giả (mục
 * hoàn toàn ở tháng 12 vẽ dính vào JAN W5 trông như nó đang chạy ở tuần đó). Gọi hàm này TRƯỚC
 * `cotCua` để quyết định ẩn hay vẽ; mục còn mở (`den` = null) luôn coi là chạy tới hết khoảng đang xem.
 */
export function giaoKhoangXem(tu: string, den: string | null, khoang: { tu: string; den: string }): boolean {
  const batDau = mondayOfDate(tu);
  const ketThuc = den ? mondayOfDate(den) : khoang.den;
  return batDau <= khoang.den && ketThuc >= khoang.tu;
}

// ====================================================================== tầng khối phương án (Q5)

export type KhoiThoiGian = { id: number; tu: string; den: string | null; noiTiepTu?: number | null };

/**
 * XẾP TẦNG THAM LAM theo ngày bắt đầu: khối chồng thời gian với khối đang đứng đầu một tầng thì
 * xuống tầng tiếp theo. "Chồng" tính theo TUẦN — hai khối chạm nhau trong cùng một tuần cũng coi là
 * chồng (không chỉ đè ngày lên ngày). PA nối tiếp (`noiTiepTu` trỏ id đã có tầng) LUÔN giữ tầng của
 * khối trước, dù có "chồng" theo nghĩa trên hay không — đây là một chuỗi kể lại, không phải hai việc
 * chạy song song.
 */
export function xepTang<T extends { id: number; tu: string; den: string | null; noiTiepTu?: number | null }>(
  khoi: readonly T[],
): Map<number, number> {
  const sorted = [...khoi].sort((a, b) => a.tu.localeCompare(b.tu) || a.id - b.id);
  const tang = new Map<number, number>();
  const tangDenTuan: string[] = [];
  const denCua = (k: T) => mondayOfDate(k.den ?? '9999-12-31');
  for (const k of sorted) {
    if (k.noiTiepTu != null && tang.has(k.noiTiepTu)) {
      const t = tang.get(k.noiTiepTu)!;
      tang.set(k.id, t);
      tangDenTuan[t] = denCua(k);
      continue;
    }
    const tuTuan = mondayOfDate(k.tu);
    let dat = -1;
    for (let i = 0; i < tangDenTuan.length; i++) {
      if (tuTuan > tangDenTuan[i]) { dat = i; break; }
    }
    if (dat === -1) { dat = tangDenTuan.length; tangDenTuan.push(denCua(k)); }
    else tangDenTuan[dat] = denCua(k);
    tang.set(k.id, dat);
  }
  return tang;
}

// ====================================================================== nhãn khối PA (Q5, chú thích g8-133; PR-UX5 Q2/Q4/Q11)

export type ToneKhoiPa = 'ok' | 'part' | 'bad' | 'run' | 'late' | 'done';
export type NhanKhoiPa = { ten: string; dau: '✓' | '◐' | '✗' | '▶' | '⚠' | '■'; tone: ToneKhoiPa; day: string };

/** Khối PA ngắn hơn ngưỡng này (px) thì chỉ vẽ dấu kết quả, không vẽ tên (Q3) — tên đủ nằm ở tooltip `day`. */
export const KHOI_PA_CO_TEN = 130;

/**
 * KHỐI PA ĐANG CHẠY KẾT THÚC Ở TUẦN HÔM NAY, không kéo tới cột cuối trục (Q4, sửa lỗi Qb). PA chưa tới ngày bắt
 * đầu thì kết thúc ở tuần bắt đầu của chính nó.
 */
export function denKhoiPa(p: { tu: string; den: string | null }, homNay: string): string {
  return p.den ?? (p.tu > homNay ? p.tu : homNay);
}

/**
 * NHÃN MỘT KHỐI PHƯƠNG ÁN. Chữ hiện trên khối chỉ là tên PA (`ten`) + dấu kết quả (`dau`); câu đủ vào tooltip
 * (`day`). Kết quả lấy nguyên nhãn từ `outcomeLabelFor` (`cases.ts`) — không gõ lại chữ ở đây. Xanh lá chỉ dành cho
 * kết quả (Q11): PA đã kết thúc mà chưa ghi kết quả là họ `done` (xám) với dấu ■.
 */
export function nhanKhoiPa(
  pa: {
    ten: string; status: string; lastOutcome: string | null; followupOverdue: boolean;
    soNgayQuaHan?: number | null; tu?: string; den?: string | null;
  },
  homNay?: string,
): NhanKhoiPa {
  const ten = dich(pa.ten);
  /* PR-VAI-b (Q19): khoảng PA nói MÃ TUẦN, không dd/mm. */
  const khoang = pa.tu
    ? (pa.den ? `${tuanLich(pa.tu, homNay)} → ${tuanLich(pa.den, homNay)}` : t('từ {tuan}', { tuan: tuanLich(pa.tu, homNay) }))
    : null;
  const ghep = (...phan: (string | null)[]) => phan.filter(Boolean).join(' · ');
  if (pa.status === 'completed') {
    const ketQua: { dau: NhanKhoiPa['dau']; tone: ToneKhoiPa } | null =
      pa.lastOutcome === 'improved' ? { dau: '✓', tone: 'ok' }
        : pa.lastOutcome === 'partial' ? { dau: '◐', tone: 'part' }
          : pa.lastOutcome === 'unchanged' || pa.lastOutcome === 'worse' ? { dau: '✗', tone: 'bad' }
            : null;
    if (ketQua) {
      return { ten, dau: ketQua.dau, tone: ketQua.tone, day: ghep(ten, `${ketQua.dau} ${dich(outcomeLabelFor(pa.lastOutcome!))}`, khoang) };
    }
    return { ten, dau: '■', tone: 'done', day: ghep(ten, t('■ Chờ kết quả'), khoang) };
  }
  if (pa.followupOverdue) {
    const quaHan = pa.soNgayQuaHan ? t('Quá hạn · {n} ngày', { n: pa.soNgayQuaHan }) : t('Quá hạn');
    return { ten, dau: '⚠', tone: 'late', day: ghep(ten, t('▶ Đang thực hiện'), quaHan, khoang) };
  }
  return { ten, dau: '▶', tone: 'run', day: ghep(ten, t('▶ Đang thực hiện'), khoang) };
}

// ====================================================================== badge hộp kỹ năng (Q6)

export type ToneHop = 'ok' | 'warn' | 'danger';
/** `t`: nhãn chung §7.3 (`NhanTrangThai`) — cùng kiểu chip với tab Học thuật (OV-11d CA2-3: "Đang làm" một màu, quá hạn đỏ). */
export type TrangThaiHop = { chu: string; ngan: string; tone: ToneHop; t: TrangThai } | null;

const soTuanTron = (tu: string, den: string): number => Math.max(0, Math.ceil((ngayThu(den) - ngayThu(tu)) / 7));

/**
 * BADGE ĐẦU HỘP KỸ NĂNG — nhãn §7.3 (PR-SOS K3-29), thứ tự ưu tiên CỐ ĐỊNH: chờ nguyên nhân → chờ Quản lý duyệt → chưa có PA → đang làm.
 * `null` = chưa từng có Case (giao diện tự vẽ chữ mờ "Không có Case"). `ngan` = phần trước " · " của `chu` — chỗ hẹp (Xem gọn, 375px)
 * hiện `ngan`, `chu` đủ để ở tooltip. Tone: đang làm mà điểm cuối chưa đạt → `danger`.
 */
export function trangThaiHop(
  i: {
    caseMo: { mo: string; soPa: number; choNguyenNhan?: boolean; /** OV-12c: Case MT cũ, bài chưa nhận xét. */ choNhanXet?: boolean; choDuyet?: boolean; /** OV-11d: quá hạn xác nhận (cùng `trangThaiCaseV4`). */ quaHan?: 'nguyen-nhan' | 'xac-nhan-pa' | null }[]; coTungCase: boolean;
    diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; huyGanNhat?: boolean;
  },
  homNay: string,
): TrangThaiHop {
  const dung = (chu: string, tone: ToneHop, t: TrangThai): NonNullable<TrangThaiHop> => ({ chu, ngan: chu.split(' · ')[0], tone, t });
  if (i.caseMo.length > 0) {
    const qh = i.caseMo.find((c) => c.quaHan);
    if (qh) return dung(qh.quaHan === 'xac-nhan-pa' ? t('Quá hạn · chờ xác nhận PA') : qh.choNhanXet ? t('Quá hạn · chờ ghi nhận xét') : t('Quá hạn · chờ xác nhận Case'), 'danger', 'qua-han');   // web thêm ⚠ (SVG)
    if (i.caseMo.some((c) => c.choNguyenNhan)) return dung(t('Cần làm · chờ xác nhận Case'), 'warn', 'can-lam');
    if (i.caseMo.some((c) => c.choNhanXet)) return dung(t('Cần làm · chờ ghi nhận xét'), 'warn', 'can-lam');
    if (i.caseMo.some((c) => c.choDuyet)) return dung(t('Chờ duyệt'), 'warn', 'cho-duyet');
    if (i.caseMo.some((c) => c.soPa === 0)) return dung(t('Cần làm · chưa có PA'), 'warn', 'can-lam');
    const somNhat = i.caseMo.reduce((a, b) => (b.mo < a ? b.mo : a), i.caseMo[0].mo);
    return dung(t('Đang làm · {n} tuần', { n: soTuanTron(somNhat, homNay) }), 'warn', 'dang-lam');   // OV-11d (CA2-3): một màu như tab Học thuật
  }
  if (i.coTungCase && i.huyGanNhat) return dung(t('Đã huỷ'), 'ok', 'da-huy');
  if (i.coTungCase && i.xongGanNhat) return dung(t('Xong {tuan}', { tuan: tuanLich(i.xongGanNhat, homNay) }), 'ok', 'xong');   // PR-VAI-b (Q19): mã tuần
  return null;
}
/** Dòng phụ của một vấn đề (G-3, ≤ 60 ký tự) — PR-VAI-b (Q19): mã tuần `từ W2 SEP · 1 PA` / `W3 JUL → W2 SEP · 2 PA`. */
export function dongPhuVanDe(v: { mo: string; dong: string | null; soPa: number }, homNay: string): string {
  const pa = v.soPa === 0 ? t('chưa có PA') : `${v.soPa} PA`;
  const s = v.dong ? `${tuanLich(v.mo, homNay)} → ${tuanLich(v.dong, homNay)} · ${pa}` : t('từ {tuan} · {pa}', { tuan: tuanLich(v.mo, homNay), pa });
  return s.slice(0, 60);
}

/**
 * KHỐI "CHỜ" trên hàng PA của một Case (Q18, sửa R5-2) — một kiểu khối viền đứt tím, chữ nói rõ chờ gì:
 * Case Progress chờ Xác nhận Case → "Chờ xác nhận Case" · Case MT cũ bài chưa nhận xét → "Chờ ghi nhận xét" (OV-12c) · Case chưa có PA nào →
 * "Chưa có PA". Có PA đang vẽ được → null (khối PA tự nói).
 */
export function khoiCho(v: { cho?: 'nguyen-nhan' | 'nhan-xet' | null; soPa: number; pa: readonly unknown[] }): string | null {
  if (v.cho === 'nguyen-nhan') return t('Chờ xác nhận Case');
  if (v.cho === 'nhan-xet') return t('Chờ ghi nhận xét');
  if (v.soPa === 0) return t('Chưa có PA');
  return v.pa.length ? null : t('Chờ xác nhận PA');
}

/** Hàng Tuần học / Tuần học của trục (Q31-11): FT = tuần học n của em (bỏ tuần Tạm dừng, tuần dừng → null); lớp thường = tuần khoá 1…n. */
export function soTuanCot(
  t: { loai: 'ft'; ds: readonly { batDau: string; tu: string; den: string | null }[] } | { loai: 'khoa'; ds: readonly { batDau: string; tong: number | null; tu: string; den: string | null }[] } | null,
  dung: readonly { tu: string; den: string | null }[],
  thuHai: string,
): number | null {
  if (!t) return null;
  /* Đoạn chứa tuần này (đoạn sau thắng đoạn trước khi chạm nhau ở tuần chuyển). */
  const c = [...t.ds].filter((x) => mondayOfDate(x.tu) <= thuHai && (!x.den || thuHai <= mondayOfDate(x.den))).at(-1);
  if (!c) return null;
  if (t.loai === 'ft') return tuanHocFt(c.batDau, thuHai, dung);
  const n = Math.floor((ngayThu(thuHai) - ngayThu(mondayOfDate(c.batDau))) / 7) + 1;
  const tong = (c as { tong: number | null }).tong;
  return n < 1 || (tong !== null && n > tong) ? null : n;
}

/**
 * Chữ khoảng Tạm dừng bằng mã tuần — `den` là ngày QUAY LẠI, tuần đó em đã học lại nên chữ dừng ở tuần TRƯỚC (cùng luật `tuanHocFt`):
 * dừng W4 JUL, quay lại W1 AUG → "W4 JUL – W5 JUL"; dừng và quay lại cùng tuần / tuần liền sau → một tuần; chưa quay lại → "từ W4 JUL".
 */
export function chuKhoangDung(k: { tu: string; den: string | null }, homNay?: string): string {
  if (!k.den) return t('từ {tuan}', { tuan: tuanLich(k.tu, homNay) });
  const cuoi = addDaysIso(mondayOfDate(k.den), -7);
  return cuoi <= mondayOfDate(k.tu) ? tuanLich(k.tu, homNay) : `${tuanLich(k.tu, homNay)} – ${tuanLich(cuoi, homNay)}`;
}

// ====================================================================== chuỗi điểm (Q16; PR-UX5 Q1/Q7/Q8)

export type DotRef = { cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; maLop?: string | null };

/** Nhãn một đợt: Fast Track `MT2`; lớp thường `Giữa khoá MB FOU 03` / `Cuối khoá` (không bao giờ chữ "MT"). */
export function nhanDotTest(d: DotRef): string {
  if (d.cheDo === 'ielts') return `MT${d.attemptNo}`;
  const kind = nhanBaiThuong(d.kind === 'checkpoint' ? `checkpoint:${d.attemptNo}` : d.kind);   // OV-6b2: "Checkpoint 2"
  return d.maLop ? `${kind} ${d.maLop}` : kind;
}

/** Một mốc điểm máy chủ gửi — trường mới tuỳ chọn để phép kiểm cũ vẫn gọi được. */
export type DiemMoc = {
  gt: number; tong?: number | null; chuaDat: boolean;
  /** OV-6b1: ngưỡng đạt của lớp (lớp thường) — chữ "ngưỡng n%" của tooltip. */
  nguong?: number;
  attemptNo?: number; kind?: string; maLop?: string | null; kyVong?: number | null;
  /** PR-VAI-b (G5): lượt của mốc — mốc điểm mở hồ sơ Mock cuộn tới kỹ năng. */
  attemptId?: number;
  /** PR-S6F-b: lớp của lượt — mốc lượt lớp thường (kể cả chưa xếp tuần) đi đường bảng điểm lớp thường, không tra lại ghim. */
  classId?: number | null;
};
export type LechDiem = { dau: 'len' | 'xuong' | 'bang'; chu: string };
export type MocDiem = { chu: string; xau: boolean; cho: boolean; lech: LechDiem | null; title: string; /** PR-VAI-b (G5): lượt của mốc. */ attemptId?: number | null; kind?: string | null; classId?: number | null };

/**
 * XU HƯỚNG GIỮA HAI MỐC LIỀN NHAU (Q8; OV-15a C05: bằng CHỮ "Tăng 0.5 / Giảm 0.5 / Không đổi", không ▲ ▼ =). Fast Track chênh band
 * 1 chữ số lẻ; lớp thường chênh điểm % tính từ % ĐÃ LÀM TRÒN của hai mốc — số đang hiện và mức chênh không bao giờ lệch nhau.
 */
export function lechDiem(truoc: number, sau: number, cheDo: 'ielts' | 'ratio'): LechDiem {
  const d = cheDo === 'ratio' ? Math.round(sau) - Math.round(truoc) : Math.round((sau - truoc) * 10) / 10;
  if (d === 0) return { dau: 'bang', chu: t('Không đổi') };
  const so = cheDo === 'ratio' ? String(Math.abs(d)) : Math.abs(d).toFixed(1);
  return d > 0 ? { dau: 'len', chu: t('Tăng {so}', { so }) } : { dau: 'xuong', chu: t('Giảm {so}', { so }) };
}

/**
 * CHUỖI ĐIỂM của một hộp kỹ năng — `toiDa` mốc gần nhất (mặc định 5, tính cả mốc "?"). Fast Track ghi band một chữ
 * số lẻ; lớp thường ghi % (làm tròn; `chuaDat` đã tính sẵn từ `evaluateRegular`, không tính lại 70% ở đây).
 * `conCho` thêm một mốc "?" ở cuối khi có đợt đã lên lịch mà chưa có điểm môn này. Mũi tên chỉ tính giữa các mốc
 * ĐANG HIỆN liền nhau (cắt rồi mới tính); mốc đầu và mốc "?" không có mũi tên.
 */
export function chuoiDiem(
  diem: readonly DiemMoc[],
  cheDo: 'ielts' | 'ratio',
  conCho: boolean,
  o: { toiDa?: number; dotCho?: DotRef | null } = {},
): MocDiem[] {
  const soDiem = Math.max(0, (o.toiDa ?? 5) - (conCho ? 1 : 0));
  const lay = diem.slice(Math.max(0, diem.length - soDiem));
  let giaTriTruoc: number | null = null;
  const moc: MocDiem[] = lay.map((d) => {
    const phanTram = cheDo === 'ratio' && d.tong ? Math.round((d.gt / d.tong) * 100) : null;
    const gia = phanTram ?? d.gt;
    const chu = phanTram !== null ? `${phanTram}%` : cheDo === 'ielts' ? d.gt.toFixed(1) : String(d.gt);
    const nhan = d.attemptNo != null
      ? nhanDotTest({ cheDo, attemptNo: d.attemptNo, kind: d.kind ?? '', maLop: d.maLop })
      : null;
    let phan: (string | null)[];
    if (cheDo === 'ratio') {
      const cauDung = d.tong ? ` (${d.gt}/${d.tong})` : '';
      phan = [nhan, `${chu}${cauDung}`, d.chuaDat ? t('Chưa đạt — ngưỡng {pt}%', { pt: Math.round((d.nguong ?? RATIO_PASS_THRESHOLD) * 100) }) : t('Đạt')];
    } else {
      const ky = d.kyVong != null ? (d.chuaDat ? t('dưới kỳ vọng {kv}', { kv: d.kyVong.toFixed(1) }) : t('kỳ vọng {kv}', { kv: d.kyVong.toFixed(1) })) : null;
      phan = [nhan, chu, ky];
    }
    const lech = giaTriTruoc === null ? null : lechDiem(giaTriTruoc, gia, cheDo);
    giaTriTruoc = gia;
    return { chu, xau: d.chuaDat, cho: false, lech, title: phan.filter(Boolean).join(' · '), attemptId: d.attemptId ?? null, kind: d.kind ?? null, classId: d.classId ?? null };
  });
  if (conCho) {
    moc.push({ chu: '?', xau: false, cho: true, lech: null, title: o.dotCho ? t('{dot} · chưa chấm', { dot: nhanDotTest(o.dotCho) }) : t('Đợt sắp tới · chưa chấm') });
  }
  return moc;
}

/** Bề rộng ước (px) của chuỗi điểm — tính bằng số ký tự, KHÔNG đo DOM (tránh vòng đo ↔ đổi bố cục). */
export function uocRongChuoi(moc: readonly MocDiem[]): number {
  let px = 0;
  for (const m of moc) {
    /* "%" rộng gần gấp rưỡi chữ số (lớp thường `60%`) — đo thật 5 mốc % hụt ~20 px, chuỗi tràn sang lưới (PR-VAI-b bấm thử). */
    px += m.chu.length * 7.6 + (m.chu.endsWith('%') ? 5 : 0);
    if (m.lech) px += m.lech.chu.length * 6.2 + 12;
  }
  if (moc.some((m) => m.cho)) px += 16;
  return Math.ceil(px);
}

// ====================================================================== nhãn ghim đợt Test (Q16 hàng "Đợt Test"; N-1b)

/** Màu kết quả Test (N-1b): Đạt xanh lá · SOS 1 vàng · SOS 2 cam · SOS 3 đỏ · tạm thời / chưa đủ điểm xám viền đứt. */
export type MauKetQua = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam';
export type NhanGhim = { chu: string; gon: string; day: string; mau: MauKetQua; /** PR-VAI-b: hai dòng trong một cột tuần — `MT1 / 5.5`, `Giữa / 3/4`, `Cuối / 80%`. */ hai: [string, string];
  /** Nhãn ghim ở CHƯƠNG (mockup 26 bản 2) khi khác `chu` của trục — lớp thường Giữa/Cuối khoá theo môn: "Giữa khoá · 3/4 môn". */
  chuong?: string };

const mauTuSos = (sos: number): MauKetQua => (sos <= 0 ? 'dat' : sos === 1 ? 'sos1' : sos === 2 ? 'sos2' : 'sos3');

/**
 * NHÃN GHIM một đợt Test trên trục — không mũi tên trên ghim (mũi tên ở chuỗi điểm). Fast Track luôn có tiền tố
 * `MT{n}`; lớp thường KHÔNG BAO GIỜ có chữ "MT" — chỉ "Giữa"/"Cuối", đủ chữ ở `day` (tooltip). `gon` là nhãn của
 * chế độ Xem gọn. Màu theo N-1b: thiếu điểm hoặc chưa có kỳ vọng → `tam`.
 */
export function nhanGhim(a: {
  cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string;
  overall: number | null; sosLevel: number | null;
  soDat: number | null; soYeuCau: number; soCoDiem: number;
  /** OV-1c: lượt FT đã chốt (máy chủ) — thiếu điểm mà đã chốt thì ghim theo mức SOS, không "đang chấm". Thiếu = đủ điểm mới chốt. */
  chot?: boolean;
  maLop?: string | null; kyNangChuaDat?: string[]; kyVong?: number | null; tuan?: string; homNay?: string;
  /** MH7: Pre FOU không chia môn — ghim là `Cuối · 68%` (đủ điểm mới có `tyLe`), không SOS. */
  khongChiaMon?: boolean; tyLe?: number | null;
  /** PR-LT2b: hướng gợi ý Cuối khoá đủ điểm (`goiYCuoiKhoa`) — ghim `Cuối · 64% → lên + bổ trợ`. */
  goiY?: { dai: string; nhan: string; nhanK?: ChuKhoa; nhanNgan: string } | null;
  /** PR-MT (T34): MT lịch sử — nhãn nhỏ "lịch sử" cạnh "MT2". */
  lichSu?: boolean;
  /** PR-MT0: nhãn máy chủ (`nhanMt0`) — `MT0 · không dùng` thắng mọi chữ tiến độ. */
  nhanNgan?: string;
}): NhanGhim {
  const ghep = (...phan: (string | null | undefined)[]) => phan.filter(Boolean).join(' · ');
  if (a.cheDo === 'ielts') {
    const so = `MT${a.attemptNo}`;
    const mt = so;   // SV-NX-CASE (N8): không ghi chữ "cũ" 
    const tuan = a.tuan ? tuanLich(a.tuan, a.homNay) : null;
    if (a.kind === 'mt0' && a.nhanNgan && a.nhanNgan !== so) return { chu: dich(a.nhanNgan), gon: so, day: ghep(dich(a.nhanNgan), tuan), mau: 'tam', hai: [so, ''] };
    if (a.soCoDiem === 0) return { chu: mt, gon: so, day: ghep(mt, tuan, a.lichSu ? t('nhập bù, không tính hạn') : t('chưa có điểm')), mau: 'tam', hai: [so, ''] };
    if (a.soCoDiem < a.soYeuCau && !a.chot) {
      return { chu: t('{mt} · đang chấm', { mt }), gon: so, day: ghep(mt, tuan, t('đang chấm {a}/{b} kỹ năng', { a: a.soCoDiem, b: a.soYeuCau })), mau: 'tam', hai: [so, `${a.soCoDiem}/${a.soYeuCau}`] };
    }
    const band = a.overall != null ? a.overall.toFixed(1) : '—';
    const overall = `Overall ${band}`;
    if (a.sosLevel == null) {
      return { chu: `${mt} · ${band}`, gon: `${so} ${band}`, day: ghep(mt, tuan, overall, t('chưa có kỳ vọng')), mau: 'tam', hai: [so, band] };
    }
    const mau = mauTuSos(a.sosLevel);
    if (a.sosLevel <= 0) {
      return { chu: t('{mt} · {band} · Đạt', { mt, band }), gon: `${so} ${band}`, day: ghep(mt, tuan, overall, t('Đạt kỳ vọng')), mau, hai: [so, band] };
    }
    const ky = (a.kyNangChuaDat ?? []).map((k) => (ASSESSED_SKILL_LABEL as Record<string, string>)[k] ?? k);
    const sos = `SOS ${a.sosLevel}`;
    return {
      chu: `${mt} · ${band} · ${sos}`, gon: `${so} ${band}`,
      day: ghep(mt, tuan, overall, ky.length ? t('{sos} — {ky} dưới kỳ vọng', { sos, ky: ky.join(', ') }) : sos), mau, hai: [so, band],
    };
  }
  const daiKind = nhanBaiThuong(a.kind);
  const ngan = ATTEMPT_KIND_NGAN[a.kind === 'final' ? 'final' : 'progress'];
  const dai = a.maLop ? `${daiKind} ${a.maLop}` : daiKind;
  if (a.soCoDiem === 0) return { chu: ngan, gon: ngan, day: dai, mau: 'tam', hai: [ngan, ''] };
  if (a.khongChiaMon && a.tyLe != null) {
    const pt = `${Math.round(a.tyLe * 100)}%`;
    const dat = (a.sosLevel ?? 1) <= 0;
    return { chu: `${ngan} · ${pt}${a.goiY ? ` ${dich(a.goiY.nhanNgan)}` : ''}`, gon: ngan, day: ghep(dai, t('{pt} tổng', { pt }), (a.goiY ? nhanGoiY(a.goiY) : null) ?? (dat ? t('Đạt') : t('Chưa đạt'))), mau: dat ? 'dat' : 'sos1', hai: [ngan, pt] };
  }
  if (a.soCoDiem < a.soYeuCau) {
    return { chu: t('{ngan} · tạm thời', { ngan }), gon: ngan, day: ghep(dai, t('mới chấm {a}/{b} môn', { a: a.soCoDiem, b: a.soYeuCau }), t('tạm thời')), mau: 'tam', hai: [ngan, `${a.soCoDiem}/${a.soYeuCau}`] };
  }
  const soDat = a.soDat ?? 0;
  const sos = a.sosLevel ?? (soDat >= a.soYeuCau ? 0 : Math.min(3, a.soYeuCau - soDat));
  const mau = mauTuSos(sos);
  const datMon = t('{a}/{b} môn đạt', { a: soDat, b: a.soYeuCau });
  /* PR-LT2a (T58): lớp thường KHÔNG có chữ SOS — Giữa khoá `2/4 môn đạt`, Cuối khoá `64%` (màu vẫn theo số môn trượt). */
  if (a.kind === 'final' && a.tyLe != null) {
    const pt = `${Math.round(a.tyLe * 100)}%`;
    return { chu: `${ngan} · ${pt}${a.goiY ? ` ${dich(a.goiY.nhanNgan)}` : ''}`, gon: ngan, day: ghep(dai, t('{pt} tổng', { pt }), (a.goiY ? nhanGoiY(a.goiY) : null) ?? datMon), mau: a.goiY?.dai === 'dat' ? 'dat' : mau, hai: [ngan, pt] };
  }
  /* Mockup 26 bản 2: ghim CHƯƠNG nói đủ chữ — "Giữa khoá · 3/4 môn" (trục giữ bản ngắn "Giữa · 3/4 môn đạt"). */
  return { chu: `${ngan} · ${datMon}`, gon: ngan, day: ghep(dai, datMon, sos <= 0 ? t('Đạt') : t('{n} môn trượt', { n: Math.min(sos, 3) })), mau, hai: [ngan, `${soDat}/${a.soYeuCau}`],
    chuong: t('{dai} · {a}/{b} môn', { dai: daiKind, a: soDat, b: a.soYeuCau }) };
}

/**
 * GOM GHIM THEO TUẦN (Q9): hai đợt rơi vào cùng một tuần (kể cả hai ngày khác nhau trong tuần) thành MỘT nhóm,
 * ghim xếp theo `attemptNo`; nhóm xếp theo tuần tăng dần. `tuan` của nhóm là thứ Hai đầu tuần.
 */
export function gomGhimTheoTuan<T extends { tuan: string; attemptNo: number }>(g: readonly T[]): { tuan: string; ghim: T[] }[] {
  const theoTuan = new Map<string, T[]>();
  for (const x of g) {
    const thuHai = mondayOfDate(x.tuan);
    const list = theoTuan.get(thuHai) ?? [];
    list.push(x);
    theoTuan.set(thuHai, list);
  }
  return [...theoTuan.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tuan, ghim]) => ({ tuan, ghim: [...ghim].sort((a, b) => a.attemptNo - b.attemptNo) }));
}

// ====================================================================== bố cục một lưới (PR-UX5 Q5/Q7/Q15)

/** Bề rộng (px) dành cho tên kỹ năng ở hàng đầu hộp — chuỗi điểm bắt đầu ngay sau đó (mockup 18 `--knw`). */
export const RONG_TEN_KY_NANG = { ielts: 118, ratio: 96 } as const;

export type BoCuc = { cotTen: number; cotTuan: string; xuongDong: boolean; toiDaMoc: number };

const COT = { ten: 300, tenRong: 320, tenToiDa: 440, tenHep: 160, tuanToiThieu: 48, tuanGon: 40, tuanGonThuong: 60 } as const;

/**
 * BỐ CỤC CỘT: Xem gọn → cột tên 148px, tuần 40px (lớp thường 60px: ghim "Progress" cần ~59px — rà #235 I3), chuỗi điểm xuống dòng dưới tên, 3 mốc. Ngược lại cột tên rộng
 * `RONG_TEN_KY_NANG + rongChuoi + 18` kẹp [300 (≥ 1800px: 320), 440]; nếu không đủ chỗ cho `soTuan` cột ≥ 48px thì
 * rơi về dạng hẹp (148px, chuỗi xuống dòng, 3 mốc) nhưng cột tuần vẫn co giãn.
 */
export function boCucHanhTrinh(i: { rong: number; soTuan: number; xemGon: boolean; rongChuoi: number; cheDo: 'ielts' | 'ratio' }): BoCuc {
  if (i.xemGon) return { cotTen: COT.tenHep, cotTuan: `${i.cheDo === 'ratio' ? COT.tuanGonThuong : COT.tuanGon}px`, xuongDong: true, toiDaMoc: 3 };
  const san = i.rong >= 1800 ? COT.tenRong : COT.ten;
  const ten = Math.min(COT.tenToiDa, Math.max(san, RONG_TEN_KY_NANG[i.cheDo] + i.rongChuoi + 18));
  const cotTuan = `minmax(${COT.tuanToiThieu}px, 1fr)`;
  if (i.rong < ten + i.soTuan * COT.tuanToiThieu) return { cotTen: COT.tenHep, cotTuan, xuongDong: true, toiDaMoc: 3 };
  return { cotTen: ten, cotTuan, xuongDong: false, toiDaMoc: 5 };
}

/** Bề rộng (px) thật của một cột tuần — để quyết định khối PA có đủ chỗ vẽ tên (`KHOI_PA_CO_TEN`). */
export function rongCotTuan(b: BoCuc, rong: number, soTuan: number): number {
  const co = /^(\d+)px$/.exec(b.cotTuan);   // cột cố định (xem gọn); còn lại minmax(48px, 1fr)
  if (co) return Number(co[1]);
  return Math.max(COT.tuanToiThieu, (rong - b.cotTen) / Math.max(1, soTuan));
}

export type HangLuoi = {
  hangTuanHoc: number | null; hangLop: number | null; hangGhim: number | null; hangCuoi: number; mau: string;
  hop: { khung: [number, number]; dau: number; vanDe: { khung: number; tu: number; so: number }[]; dongAn: number | null }[];
};

/**
 * SỐ HÀNG CỦA LƯỚI DUY NHẤT (1-based; PR-VAI-b, mockup 26 bản 1): hàng 1 tháng, 2 tuần, [Tuần học / Tuần học], [Lớp], [Đợt Test]; mỗi hộp
 * một hàng khe 10px, một hàng đầu, rồi mỗi Case MỘT HÀNG KHUNG (Case = khung rỗng) + `so` hàng tầng PA (PA = khối đặc; tầng đầu
 * `minmax(30px, auto)`, tầng thêm 30px; Case chưa có PA vẫn một hàng cho khối "chờ"); cuối hộp thêm một hàng `auto` nếu có "+n vấn đề cũ hơn".
 * `khung` = [hàng đầu, hàng sau cùng + 1). `hangCuoi` = hàng sau cùng của cả lưới + 1.
 */
export function xepHangLuoi(i: { coTuanHoc: boolean; coLop: boolean; coGhim: boolean; hop: { soTangVanDe: number[]; coDongAn?: boolean }[] }): HangLuoi {
  const mau: string[] = ['auto', 'auto'];
  let hang = 2;
  const them = (m: string) => { mau.push(m); return ++hang; };
  const hangTuanHoc = i.coTuanHoc ? them('auto') : null;
  const hangLop = i.coLop ? them('minmax(34px, auto)') : null;
  const hangGhim = i.coGhim ? them('minmax(44px, auto)') : null;
  const hop: HangLuoi['hop'] = i.hop.map((h) => {
    them('10px');
    const dau = them('minmax(42px, auto)');
    const vanDe = h.soTangVanDe.map((so) => {
      const khung = them('minmax(34px, auto)');
      const tu = hang + 1;
      const n = Math.max(1, so);
      for (let k = 0; k < n; k++) them(k === 0 ? 'minmax(30px, auto)' : '30px');
      return { khung, tu, so: n };
    });
    const dongAn = h.coDongAn ? them('auto') : null;
    return { khung: [dau, hang + 1] as [number, number], dau, vanDe, dongAn };
  });
  return { hangTuanHoc, hangLop, hangGhim, hangCuoi: hang + 1, mau: mau.join(' '), hop };
}

// ====================================================================== chương theo lớp (PR-VAI-b Task 9, mockup 26 bản 2, Q14)

export type TonePaChuong = 'ok' | 'part' | 'bad' | 'run' | 'wait' | 'done';
/** Một ghi danh (lớp) em đã học — máy chủ dựng sẵn nhãn, GVCN, tuần học; `chiaChuong` chỉ chia Test / Case / PA vào đúng chương. */
export type LopChuong = {
  enrollmentId: number; classId: number; code: string; ngan: string; nhan: string; ct: string | null; ft: boolean;
  tu: string; den: string | null; dangHoc: boolean; soTuan: number | null; tuanHoc: { tu: number | null; den: number | null; dangDung: boolean } | null;
  gvcn: string | null; endKind: string | null; status: string; endReason: string | null;
  /** Quyết định chuyển lớp (đã chuyển) RỜI lớp này — Quản lý ra lệnh; `xacNhan` = GVCN lớp cũ đã xác nhận bàn giao. */
  lenh: { id: number; xacNhan: boolean } | null;
};
export type CaseChuongVao = {
  caseId: number; ten: string; kyNang: string; sos: number | null; mo: string; dong: string | null;
  pa: { id: number; ten: string; tu: string | null; tone: TonePaChuong }[];
};
export type CaseChuong = {
  caseId: number; ten: string; kyNang: string; sos: number | null;
  /** Đợt Test mà Case xong ở đó (`MT2`, `Cuối khoá`) — chỉ ở chương Case đóng. */
  xongO: string | null;
  /** Case còn đi tiếp sang lớp sau — ghi ở chương cũ ("Case bàn giao sang MB FT 101"). */
  diTheoSang: string | null;
  pa: { id: number; ten: string; tone: TonePaChuong }[];
};
export type RaChuong = {
  loai: 'len' | 'chuyen' | 'hoc-lai' | 'bao-luu' | 'dung' | 'ket-thuc' | null;
  /** `khoa` + `bien`: PR-EN-c (máy chủ dựng, web dịch bằng `dichChu`). */
  chu: string; khoa?: string; bien?: ChuKhoa['bien']; how: string | null; tu: string | null;
  docBanGiao: { lenhId: number; lopNguonId: number } | null;
};
export type Chuong<G> = Omit<LopChuong, 'endKind' | 'status' | 'endReason' | 'lenh'> & {
  tamDung: { tu: string; den: string | null }[]; ghim: G[]; caseDong: CaseChuong[]; ra: RaChuong | null;
};

const RA_THEO_END_KIND: Record<string, RaChuong['loai']> = {
  len_lop: 'len', sang_ft: 'len', chuyen_lop: 'chuyen', hoc_lai: 'hoc-lai', bao_luu: 'bao-luu', dung_hoc: 'dung', ket_thuc: 'ket-thuc',
};

/**
 * CHIA ĐƯỜNG ĐI CỦA EM THÀNH CHƯƠNG (Q14) — một chương = một ghi danh, cũ → mới.
 *   Case thuộc chương chứa NGÀY MỞ; còn mở qua chương sau / đóng ở chương sau → hiện ở chương sau, chương cũ ghi `diTheoSang`.
 *   PA thuộc chương chứa ngày BẮT ĐẦU PA. Ghim Test theo `class_id` của lượt. Không việc, hạn, người giữ việc.
 *   "Vì sao sang lớp sau" (`ra`) = kết thúc vì (`end_kind`) + quyết định chuyển lớp đã thi hành ("Quản lý ra lệnh").
 */
/** Chân chương "lên lớp" (mockup 26): "Lên FT" · "Lên BE" · kèm bổ trợ miễn phí "Lên FT + bổ trợ S" (tên môn ngắn theo chương trình lớp cũ). */
export function chuLen(sau: { ft: boolean; ct: string | null } | null, bo: BoTroMienPhi | null, ctCu: string | null): string {
  return chuLenK(sau, bo, ctCu).chu;
}
/** PR-EN-c: `chuLen` kèm khoá (máy chủ dựng, web dịch). */
function chuLenK(sau: { ft: boolean; ct: string | null } | null, bo: BoTroMienPhi | null, ctCu: string | null): ChuKhoa {
  const len = sau?.ft || sau?.ct ? kem('Lên {ct}', { ct: sau.ft ? 'FT' : sau.ct! }) : { chu: 'Lên lớp sau' };
  if (!bo) return len;
  return bo.theoMon && bo.mon.length ? kem('{len} + bổ trợ {mon}', { len, mon: bo.mon.map((m) => tenMonNgan(ctCu, m)).join(', ') }) : kem('{len} + bổ trợ', { len });
}

export function chiaChuong<G extends { classId: number | null; tuan: string | null; nhanNgan: string; kind?: string; goiY?: unknown }>(i: {
  lop: readonly LopChuong[]; ghim: readonly G[]; cases: readonly CaseChuongVao[];
  tamDung: readonly { tu: string; den: string | null }[]; homNay: string;
}): Chuong<G>[] {
  const lop = [...i.lop].sort((a, b) => a.tu.localeCompare(b.tu) || a.enrollmentId - b.enrollmentId);
  if (!lop.length) return [];
  const chuongCua = (d: string | null): number => {
    if (!d) return lop.length - 1;
    let k = 0;
    for (let j = 0; j < lop.length; j++) if (lop[j].tu <= d) k = j;
    return k;
  };
  const caseDong: CaseChuong[][] = lop.map(() => []);
  for (const c of i.cases) {
    const goc = chuongCua(c.mo);
    const cuoi = c.dong ? chuongCua(c.dong) : lop.length - 1;
    const paO = (k: number) => c.pa.filter((p) => chuongCua(p.tu ?? c.mo) === k).map(({ id, ten, tone }) => ({ id, ten, tone }));
    const xongO = (k: number) => {
      if (!c.dong) return null;
      const g = i.ghim.filter((x) => x.classId === lop[k].classId && x.tuan && x.tuan <= c.dong!).sort((a, b) => a.tuan!.localeCompare(b.tuan!)).at(-1);
      return g ? g.nhanNgan : null;
    };
    caseDong[goc].push({
      caseId: c.caseId, ten: c.ten, kyNang: c.kyNang, sos: c.sos, pa: paO(goc),
      xongO: cuoi === goc ? xongO(goc) : null, diTheoSang: cuoi > goc ? lop[goc + 1].code : null,
    });
    if (cuoi > goc) caseDong[cuoi].push({ caseId: c.caseId, ten: c.ten, kyNang: c.kyNang, sos: c.sos, pa: paO(cuoi), xongO: xongO(cuoi), diTheoSang: null });
  }
  /* Bổ trợ miễn phí kèm khi lên lớp — gợi ý Cuối khoá (`goiYCuoiKhoa.boTroNeuLen`) của ghim Cuối khoá lớp đó. */
  const boTroCuaChuong = (classId: number): BoTroMienPhi | null =>
    (i.ghim.filter((g) => g.classId === classId && g.kind === 'final').at(-1)?.goiY as { boTroNeuLen?: BoTroMienPhi | null } | null | undefined)?.boTroNeuLen ?? null;
  return lop.map((l, k) => {
    const sau = lop[k + 1] ?? null;
    /* OV-11d (HV-12): ghi danh `completed` không `end_kind` (dữ liệu trước PR-LT) mà còn lớp sau = em sang lớp sau, không phải Kết thúc học. */
    const sangLopSau = !l.endKind && l.status === 'completed' && !!sau;
    const loai = l.endKind ? RA_THEO_END_KIND[l.endKind] ?? null : l.status === 'transferred' || sangLopSau ? 'chuyen' : l.status === 'completed' ? 'ket-thuc' : null;
    const ra: RaChuong | null = l.dangHoc ? null : {
      loai,
      ...(loai === 'len' ? chuLenK(sau, boTroCuaChuong(l.classId), l.ct) : sangLopSau ? kem('Sang {lop}', { lop: sau!.code }) : { chu: loai === 'chuyen' ? 'Chuyển lớp' : loai === 'hoc-lai' ? 'Học lại'
        : loai === 'bao-luu' ? 'Tạm dừng học (bảo lưu)' : loai === 'dung' ? 'Dừng học hẳn' : loai === 'ket-thuc' ? 'Kết thúc học' : l.status === 'paused' ? 'Tạm dừng học' : 'Rời lớp' }),
      how: l.lenh ? 'Quản lý quyết định' : loai === 'len' ? 'theo Final Test' : l.endReason,
      tu: sau?.tu ?? null,
      docBanGiao: l.lenh?.xacNhan ? { lenhId: l.lenh.id, lopNguonId: l.classId } : null,
    };
    const { endKind: _e, status: _s, endReason: _r, lenh: _l, ...goc } = l;
    const den = l.den ?? i.homNay;
    return {
      ...goc,
      tamDung: i.tamDung.filter((t) => t.tu <= den && (t.den === null || t.den >= l.tu)),
      ghim: i.ghim.filter((g) => g.classId === l.classId),
      caseDong: caseDong[k],
      ra,
    };
  });
}

/** "Lặp lại qua các lớp" (mockup 26): kỹ năng có Case ở ≥ 2 chương — máy tự viết dòng cảnh báo. */
export function lapLaiQuaLop(chuong: readonly { code: string; caseDong: readonly { caseId: number; kyNang: string }[] }[]): { kyNang: string; lop: string[] }[] {
  /* Case bàn giao sang lớp sau vẫn là MỘT Case — chỉ tính ở chương nó mở (lần gặp đầu, chương xếp cũ → mới). */
  const daGap = new Set<number>();
  const theoKn = new Map<string, string[]>();
  for (const c of chuong) {
    const kn = new Set(c.caseDong.filter((x) => !daGap.has(x.caseId)).map((x) => x.kyNang));
    for (const x of c.caseDong) daGap.add(x.caseId);
    for (const k of kn) theoKn.set(k, [...(theoKn.get(k) ?? []), c.code]);
  }
  return [...theoKn.entries()].filter(([, ds]) => ds.length >= 2).map(([kyNang, lop]) => ({ kyNang, lop }));
}
