/**
 * LUẬT THUẦN CỦA TAB HÀNH TRÌNH (PR-Qb, spec §3.8) — trục tuần, tầng khối phương án, badge hộp kỹ năng,
 * chuỗi điểm, nhãn ghim đợt Test, nhãn giai đoạn. Giao diện chỉ vẽ theo những gì các hàm này trả về;
 * máy chủ (`server/src/students/hanhTrinh.ts`) chỉ truy vấn dữ liệu rồi gọi các hàm này.
 *
 * Chỉ nhận chuỗi ISO `yyyy-mm-dd` (không giờ, không múi giờ — máy chủ đã quy về ngày trước khi gọi).
 */
import { outcomeLabelFor } from './cases.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { RATIO_PASS_THRESHOLD } from './normal.ts';
import { ASSESSED_SKILL_LABEL } from './skills.ts';
import { mondayOfDate, owningMonthOf, weekNumberInMonthOf, MONTH_CODE } from './week.ts';

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
  const { ten } = pa;
  const khoang = pa.tu
    ? (pa.den ? `${ngay(pa.tu, homNay)} → ${ngay(pa.den, homNay)}` : `từ ${ngay(pa.tu, homNay)}`)
    : null;
  const ghep = (...phan: (string | null)[]) => phan.filter(Boolean).join(' · ');
  if (pa.status === 'completed') {
    const ketQua: { dau: NhanKhoiPa['dau']; tone: ToneKhoiPa } | null =
      pa.lastOutcome === 'improved' ? { dau: '✓', tone: 'ok' }
        : pa.lastOutcome === 'partial' ? { dau: '◐', tone: 'part' }
          : pa.lastOutcome === 'unchanged' || pa.lastOutcome === 'worse' ? { dau: '✗', tone: 'bad' }
            : null;
    if (ketQua) {
      return { ten, dau: ketQua.dau, tone: ketQua.tone, day: ghep(ten, `${ketQua.dau} ${outcomeLabelFor(pa.lastOutcome!)}`, khoang) };
    }
    return { ten, dau: '■', tone: 'done', day: ghep(ten, '■ Đã kết thúc, chưa ghi kết quả', khoang) };
  }
  if (pa.followupOverdue) {
    const quaHan = `⚠ Quá hạn cập nhật${pa.soNgayQuaHan ? ` ${pa.soNgayQuaHan} ngày` : ''}`;
    return { ten, dau: '⚠', tone: 'late', day: ghep(ten, '▶ Đang thực hiện', quaHan, khoang) };
  }
  return { ten, dau: '▶', tone: 'run', day: ghep(ten, '▶ Đang thực hiện', khoang) };
}

// ====================================================================== badge hộp kỹ năng (Q6)

export type ToneHop = 'ok' | 'warn' | 'danger';
export type TrangThaiHop = { chu: string; ngan: string; tone: ToneHop } | null;

const soTuanTron = (tu: string, den: string): number => Math.max(0, Math.ceil((ngayThu(den) - ngayThu(tu)) / 7));

/**
 * BADGE ĐẦU HỘP KỸ NĂNG — nhãn §7.3 (PR-SOS K3-29), thứ tự ưu tiên CỐ ĐỊNH: chờ nguyên nhân → chờ Quản lý duyệt → chưa có PA → đang làm.
 * `null` = chưa từng có Case (giao diện tự vẽ chữ mờ "Không có Case"). `ngan` = phần trước " · " của `chu` — chỗ hẹp (Xem gọn, 375px)
 * hiện `ngan`, `chu` đủ để ở tooltip. Tone: đang làm mà điểm cuối chưa đạt → `danger`.
 */
export function trangThaiHop(
  i: {
    caseMo: { mo: string; soPa: number; choNguyenNhan?: boolean; choDuyet?: boolean }[]; coTungCase: boolean;
    diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; huyGanNhat?: boolean;
  },
  homNay: string,
): TrangThaiHop {
  const dung = (chu: string, tone: ToneHop): NonNullable<TrangThaiHop> => ({ chu, ngan: chu.split(' · ')[0], tone });
  if (i.caseMo.length > 0) {
    if (i.caseMo.some((c) => c.choNguyenNhan)) return dung('Cần làm · chờ nguyên nhân', 'warn');
    if (i.caseMo.some((c) => c.choDuyet)) return dung('Chờ duyệt', 'warn');
    if (i.caseMo.some((c) => c.soPa === 0)) return dung('Cần làm · chưa có PA', 'warn');
    const somNhat = i.caseMo.reduce((a, b) => (b.mo < a ? b.mo : a), i.caseMo[0].mo);
    return dung(`Đang làm · ${soTuanTron(somNhat, homNay)} tuần`, i.diemCuoiChuaDat ? 'danger' : 'warn');
  }
  if (i.coTungCase && i.huyGanNhat) return dung('Đã huỷ', 'ok');
  if (i.coTungCase && i.xongGanNhat) return dung(`Xong ${i.xongGanNhat.slice(8, 10)}/${i.xongGanNhat.slice(5, 7)}`, 'ok');
  return null;
}
/** Dòng phụ của một vấn đề (G-3, ≤ 60 ký tự; G-6 ngày `dd/mm`, năm chỉ khi khác năm nay). */
export function dongPhuVanDe(v: { mo: string; dong: string | null; soPa: number }, homNay: string): string {
  const pa = v.soPa === 0 ? 'chưa có PA' : `${v.soPa} PA`;
  const s = v.dong ? `${ngay(v.mo, homNay)} → ${ngay(v.dong, homNay)} · ${pa}` : `từ ${ngay(v.mo, homNay)} · ${pa}`;
  return s.slice(0, 60);
}

// ====================================================================== chuỗi điểm (Q16; PR-UX5 Q1/Q7/Q8)

export type DotRef = { cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; maLop?: string | null };

/** Nhãn một đợt: Fast Track `MT2`; lớp thường `Giữa khoá MB FOU 03` / `Cuối khoá` (không bao giờ chữ "MT"). */
export function nhanDotTest(d: DotRef): string {
  if (d.cheDo === 'ielts') return `MT${d.attemptNo}`;
  const kind = d.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá';
  return d.maLop ? `${kind} ${d.maLop}` : kind;
}

/** Một mốc điểm máy chủ gửi — trường mới tuỳ chọn để phép kiểm cũ vẫn gọi được. */
export type DiemMoc = {
  gt: number; tong?: number | null; chuaDat: boolean;
  attemptNo?: number; kind?: string; maLop?: string | null; kyVong?: number | null;
};
export type LechDiem = { dau: 'len' | 'xuong' | 'bang'; chu: string };
export type MocDiem = { chu: string; xau: boolean; cho: boolean; lech: LechDiem | null; title: string };

const DAU_TRU = '−';

/**
 * MŨI TÊN GIỮA HAI MỐC LIỀN NHAU (Q8). Fast Track chênh band 1 chữ số lẻ; lớp thường chênh điểm % tính từ % ĐÃ LÀM
 * TRÒN của hai mốc — số đang hiện và mức chênh không bao giờ lệch nhau. Dấu trừ là U+2212.
 */
export function lechDiem(truoc: number, sau: number, cheDo: 'ielts' | 'ratio'): LechDiem {
  const d = cheDo === 'ratio' ? Math.round(sau) - Math.round(truoc) : Math.round((sau - truoc) * 10) / 10;
  if (d === 0) return { dau: 'bang', chu: '=' };
  const so = cheDo === 'ratio' ? String(Math.abs(d)) : Math.abs(d).toFixed(1);
  return d > 0 ? { dau: 'len', chu: `▲+${so}` } : { dau: 'xuong', chu: `▼${DAU_TRU}${so}` };
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
  const nguong = Math.round(RATIO_PASS_THRESHOLD * 100);
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
      phan = [nhan, `${chu}${cauDung}`, d.chuaDat ? `Chưa đạt — ngưỡng ${nguong}%` : 'Đạt'];
    } else {
      const ky = d.kyVong != null ? (d.chuaDat ? `dưới kỳ vọng ${d.kyVong.toFixed(1)}` : `kỳ vọng ${d.kyVong.toFixed(1)}`) : null;
      phan = [nhan, chu, ky];
    }
    const lech = giaTriTruoc === null ? null : lechDiem(giaTriTruoc, gia, cheDo);
    giaTriTruoc = gia;
    return { chu, xau: d.chuaDat, cho: false, lech, title: phan.filter(Boolean).join(' · ') };
  });
  if (conCho) {
    moc.push({ chu: '?', xau: false, cho: true, lech: null, title: `${o.dotCho ? nhanDotTest(o.dotCho) : 'Đợt sắp tới'} · chưa chấm` });
  }
  return moc;
}

/** Bề rộng ước (px) của chuỗi điểm — tính bằng số ký tự, KHÔNG đo DOM (tránh vòng đo ↔ đổi bố cục). */
export function uocRongChuoi(moc: readonly MocDiem[]): number {
  let px = 0;
  for (const m of moc) {
    px += m.chu.length * 7.6;
    if (m.lech) px += m.lech.chu.length * 6.2 + 12;
  }
  if (moc.some((m) => m.cho)) px += 16;
  return Math.ceil(px);
}

// ====================================================================== nhãn ghim đợt Test (Q16 hàng "Đợt Test"; N-1b)

/** Màu kết quả Test (N-1b): Đạt xanh lá · SOS 1 vàng · SOS 2 cam · SOS 3 đỏ · tạm thời / chưa đủ điểm xám viền đứt. */
export type MauKetQua = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam';
export type NhanGhim = { chu: string; gon: string; day: string; mau: MauKetQua };

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
  maLop?: string | null; kyNangChuaDat?: string[]; kyVong?: number | null; tuan?: string; homNay?: string;
  /** MH7: Pre FOU không chia môn — ghim là `Cuối · 68%` (đủ điểm mới có `tyLe`), không SOS. */
  khongChiaMon?: boolean; tyLe?: number | null;
  /** PR-LT2b: hướng gợi ý Cuối khoá đủ điểm (`goiYCuoiKhoa`) — ghim `Cuối · 64% → lên + bổ trợ`. */
  goiY?: { dai: string; nhan: string; nhanNgan: string } | null;
  /** PR-MT (T34): MT lịch sử — nhãn nhỏ "lịch sử" cạnh "MT2". */
  lichSu?: boolean;
}): NhanGhim {
  const ghep = (...phan: (string | null | undefined)[]) => phan.filter(Boolean).join(' · ');
  if (a.cheDo === 'ielts') {
    const so = `MT${a.attemptNo}`;   // bản gọn (điện thoại) không kèm "lịch sử"
    const mt = a.lichSu ? `${so} lịch sử` : so;
    const tuan = a.tuan ? tuanLich(a.tuan, a.homNay) : null;
    if (a.soCoDiem === 0) return { chu: mt, gon: so, day: ghep(mt, tuan, a.lichSu ? 'nhập bù, không có hạn' : 'chưa có điểm'), mau: 'tam' };
    if (a.soCoDiem < a.soYeuCau) {
      return { chu: `${mt} · đang chấm`, gon: so, day: ghep(mt, tuan, `đang chấm ${a.soCoDiem}/${a.soYeuCau} kỹ năng`), mau: 'tam' };
    }
    const band = a.overall != null ? a.overall.toFixed(1) : '—';
    const overall = `Overall ${band}`;
    if (a.sosLevel == null) {
      return { chu: `${mt} · ${band}`, gon: `${so} ${band}`, day: ghep(mt, tuan, overall, 'chưa có kỳ vọng'), mau: 'tam' };
    }
    const mau = mauTuSos(a.sosLevel);
    if (a.sosLevel <= 0) {
      return { chu: `${mt} · ${band} · Đạt`, gon: `${so} ${band}`, day: ghep(mt, tuan, overall, 'Đạt kỳ vọng'), mau };
    }
    const ky = (a.kyNangChuaDat ?? []).map((k) => (ASSESSED_SKILL_LABEL as Record<string, string>)[k] ?? k);
    const sos = `SOS ${a.sosLevel}`;
    return {
      chu: `${mt} · ${band} · ${sos}`, gon: `${so} ${band}`,
      day: ghep(mt, tuan, overall, ky.length ? `${sos} — ${ky.join(', ')} dưới kỳ vọng` : sos), mau,
    };
  }
  const daiKind = a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá';
  const ngan = a.kind === 'final' ? 'Cuối' : 'Giữa';
  const dai = a.maLop ? `${daiKind} ${a.maLop}` : daiKind;
  if (a.soCoDiem === 0) return { chu: ngan, gon: ngan, day: dai, mau: 'tam' };
  if (a.khongChiaMon && a.tyLe != null) {
    const pt = `${Math.round(a.tyLe * 100)}%`;
    const dat = (a.sosLevel ?? 1) <= 0;
    return { chu: `${ngan} · ${pt}${a.goiY ? ` ${a.goiY.nhanNgan}` : ''}`, gon: ngan, day: ghep(dai, `${pt} tổng`, a.goiY?.nhan ?? (dat ? 'Đạt' : 'Chưa đạt')), mau: dat ? 'dat' : 'sos1' };
  }
  if (a.soCoDiem < a.soYeuCau) {
    return { chu: `${ngan} · tạm thời`, gon: ngan, day: ghep(dai, `mới chấm ${a.soCoDiem}/${a.soYeuCau} môn`, 'tạm thời'), mau: 'tam' };
  }
  const soDat = a.soDat ?? 0;
  const sos = a.sosLevel ?? (soDat >= a.soYeuCau ? 0 : Math.min(3, a.soYeuCau - soDat));
  const mau = mauTuSos(sos);
  const datMon = `${soDat}/${a.soYeuCau} môn đạt`;
  /* PR-LT2a (T58): lớp thường KHÔNG có chữ SOS — Giữa khoá `2/4 môn đạt`, Cuối khoá `64%` (màu vẫn theo số môn trượt). */
  if (a.kind === 'final' && a.tyLe != null) {
    const pt = `${Math.round(a.tyLe * 100)}%`;
    return { chu: `${ngan} · ${pt}${a.goiY ? ` ${a.goiY.nhanNgan}` : ''}`, gon: ngan, day: ghep(dai, `${pt} tổng`, a.goiY?.nhan ?? datMon), mau: a.goiY?.dai === 'dat' ? 'dat' : mau };
  }
  return { chu: `${ngan} · ${datMon}`, gon: ngan, day: ghep(dai, datMon, sos <= 0 ? 'Đạt' : `${Math.min(sos, 3)} môn trượt`), mau };
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

// ====================================================================== nhãn hai nút giai đoạn (Q1)

/** Nhãn nút chọn giai đoạn: "Lớp thường · W2 JUN – W4 SEP" (đã xong) hoặc "Fast Track · từ W1 OCT" (đang chạy). */
export function nhanGiaiDoan(gd: { loai: 'thuong' | 'ft'; tu: string; den: string | null }, homNay: string): string {
  const nhan = gd.loai === 'thuong' ? 'Lớp thường' : 'Fast Track';
  if (gd.den) return `${nhan} · ${tuanLich(gd.tu, homNay)} – ${tuanLich(gd.den, homNay)}`;
  return `${nhan} · từ ${tuanLich(gd.tu, homNay)}`;
}

// ====================================================================== bố cục một lưới (PR-UX5 Q5/Q7/Q15)

/** Bề rộng (px) dành cho tên kỹ năng ở hàng đầu hộp — chuỗi điểm bắt đầu ngay sau đó (mockup 18 `--knw`). */
export const RONG_TEN_KY_NANG = { ielts: 118, ratio: 96 } as const;

export type BoCuc = { cotTen: number; cotTuan: string; xuongDong: boolean; toiDaMoc: number };

const COT = { ten: 300, tenRong: 320, tenToiDa: 440, tenHep: 148, tuanToiThieu: 48, tuanGon: 40 } as const;

/**
 * BỐ CỤC CỘT: Xem gọn → cột tên 148px, tuần 40px, chuỗi điểm xuống dòng dưới tên, 3 mốc. Ngược lại cột tên rộng
 * `RONG_TEN_KY_NANG + rongChuoi + 18` kẹp [300 (≥ 1800px: 320), 440]; nếu không đủ chỗ cho `soTuan` cột ≥ 48px thì
 * rơi về dạng hẹp (148px, chuỗi xuống dòng, 3 mốc) nhưng cột tuần vẫn co giãn.
 */
export function boCucHanhTrinh(i: { rong: number; soTuan: number; xemGon: boolean; rongChuoi: number; cheDo: 'ielts' | 'ratio' }): BoCuc {
  if (i.xemGon) return { cotTen: COT.tenHep, cotTuan: `${COT.tuanGon}px`, xuongDong: true, toiDaMoc: 3 };
  const san = i.rong >= 1800 ? COT.tenRong : COT.ten;
  const ten = Math.min(COT.tenToiDa, Math.max(san, RONG_TEN_KY_NANG[i.cheDo] + i.rongChuoi + 18));
  const cotTuan = `minmax(${COT.tuanToiThieu}px, 1fr)`;
  if (i.rong < ten + i.soTuan * COT.tuanToiThieu) return { cotTen: COT.tenHep, cotTuan, xuongDong: true, toiDaMoc: 3 };
  return { cotTen: ten, cotTuan, xuongDong: false, toiDaMoc: 5 };
}

/** Bề rộng (px) thật của một cột tuần — để quyết định khối PA có đủ chỗ vẽ tên (`KHOI_PA_CO_TEN`). */
export function rongCotTuan(b: BoCuc, rong: number, soTuan: number): number {
  if (b.cotTuan === `${COT.tuanGon}px`) return COT.tuanGon;
  return Math.max(COT.tuanToiThieu, (rong - b.cotTen) / Math.max(1, soTuan));
}

export type HangLuoi = {
  hangDoan: number | null; hangGhim: number | null; hangCuoi: number; mau: string;
  hop: { khung: [number, number]; dau: number; vanDe: { tu: number; so: number }[]; dongAn: number | null }[];
};

/**
 * SỐ HÀNG CỦA LƯỚI DUY NHẤT (1-based): hàng 1 tháng, 2 tuần, [đoạn], [ghim]; mỗi hộp một hàng khe 10px, một hàng đầu,
 * rồi mỗi vấn đề `so` hàng (tầng đầu `minmax(40px, auto)`, tầng thêm 30px), cuối hộp thêm một hàng `auto` nếu có
 * "+n vấn đề cũ hơn". `khung` = [hàng đầu, hàng sau cùng + 1) — khe không nằm trong khung. `hangCuoi` = hàng sau
 * cùng của cả lưới + 1 (cận mở, dùng trực tiếp làm `gridRow: 1 / hangCuoi`).
 */
export function xepHangLuoi(i: { coDoan: boolean; coGhim: boolean; hop: { soTangVanDe: number[]; coDongAn?: boolean }[] }): HangLuoi {
  const mau: string[] = ['auto', 'auto'];
  let hang = 2;
  const hangDoan = i.coDoan ? ++hang : null;
  if (i.coDoan) mau.push('auto');
  const hangGhim = i.coGhim ? ++hang : null;
  if (i.coGhim) mau.push('auto');
  const hop: HangLuoi['hop'] = i.hop.map((h) => {
    mau.push('10px');
    hang += 1;
    const dau = ++hang;
    mau.push('minmax(42px, auto)');
    const vanDe = h.soTangVanDe.map((so) => {
      const tu = hang + 1;
      for (let k = 0; k < so; k++) { hang += 1; mau.push(k === 0 ? 'minmax(40px, auto)' : '30px'); }
      return { tu, so };
    });
    let dongAn: number | null = null;
    if (h.coDongAn) { dongAn = ++hang; mau.push('auto'); }
    return { khung: [dau, hang + 1] as [number, number], dau, vanDe, dongAn };
  });
  return { hangDoan, hangGhim, hangCuoi: hang + 1, mau: mau.join(' '), hop };
}
