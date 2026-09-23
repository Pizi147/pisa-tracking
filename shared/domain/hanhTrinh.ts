/**
 * LUẬT THUẦN CỦA TAB HÀNH TRÌNH (PR-Qb, spec §3.8) — trục tuần, tầng khối phương án, badge hộp kỹ năng,
 * chuỗi điểm, nhãn ghim đợt Test, nhãn giai đoạn. Giao diện chỉ vẽ theo những gì các hàm này trả về;
 * máy chủ (`server/src/students/hanhTrinh.ts`) chỉ truy vấn dữ liệu rồi gọi các hàm này.
 *
 * Chỉ nhận chuỗi ISO `yyyy-mm-dd` (không giờ, không múi giờ — máy chủ đã quy về ngày trước khi gọi).
 */
import { outcomeLabelFor } from './cases.ts';
import type { ProgressTone } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
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

// ====================================================================== nhãn khối PA (Q5, chú thích g8-133)

export type ToneKhoiPa = 'ok' | 'part' | 'bad' | 'run' | 'late';
export type NhanKhoiPa = { chu: string; tone: ToneKhoiPa };

/**
 * NHÃN MỘT KHỐI PHƯƠNG ÁN. Kết quả lấy nguyên nhãn từ `outcomeLabelFor` (`cases.ts`) — không gõ lại
 * chữ ở đây để hai chỗ không lệch nhau khi owner đổi chữ.
 */
export function nhanKhoiPa(pa: { ten: string; status: string; lastOutcome: string | null; followupOverdue: boolean }): NhanKhoiPa {
  if (pa.status === 'completed') {
    if (pa.lastOutcome === 'improved') return { chu: `${pa.ten} · ✓ ${outcomeLabelFor('improved')}`, tone: 'ok' };
    if (pa.lastOutcome === 'partial') return { chu: `${pa.ten} · ◐ ${outcomeLabelFor('partial')}`, tone: 'part' };
    if (pa.lastOutcome === 'unchanged' || pa.lastOutcome === 'worse') {
      return { chu: `${pa.ten} · ✗ ${outcomeLabelFor(pa.lastOutcome)}`, tone: 'bad' };
    }
    return { chu: `${pa.ten} · Đã kết thúc`, tone: 'part' };
  }
  if (pa.followupOverdue) return { chu: `${pa.ten} · Đang thực hiện · Quá hạn cập nhật`, tone: 'late' };
  return { chu: `${pa.ten} · Đang thực hiện`, tone: 'run' };
}

// ====================================================================== badge hộp kỹ năng (Q6)

export type ToneHop = 'ok' | 'warn' | 'danger';
export type TrangThaiHop = { chu: string; tone: ToneHop } | null;

const soTuanTron = (tu: string, den: string): number => Math.max(0, Math.ceil((ngayThu(den) - ngayThu(tu)) / 7));

/**
 * BADGE ĐẦU HỘP KỸ NĂNG — thứ tự ưu tiên CỐ ĐỊNH (Q6): thiếu PA nói trước, đang xấu điểm nói trước
 * "đang theo dõi" chung chung. `null` = chưa từng có Case (giao diện tự vẽ chữ mờ "Không có Case").
 */
export function trangThaiHop(
  i: { caseMo: { mo: string; soPa: number }[]; coTungCase: boolean; diemCuoiChuaDat: boolean | null; xongGanNhat: string | null },
  homNay: string,
): TrangThaiHop {
  if (i.caseMo.length > 0) {
    const somNhat = i.caseMo.reduce((a, b) => (b.mo < a ? b.mo : a), i.caseMo[0].mo);
    const n = soTuanTron(somNhat, homNay);
    if (i.caseMo.some((c) => c.soPa === 0)) return { chu: `Chưa có PA · ${n} tuần`, tone: 'warn' };
    if (i.diemCuoiChuaDat) return { chu: `Cần hỗ trợ · ${n} tuần`, tone: 'danger' };
    return { chu: `Đang theo dõi · ${n} tuần`, tone: 'warn' };
  }
  if (i.coTungCase && i.xongGanNhat) {
    return { chu: `Đã ổn · xong ${i.xongGanNhat.slice(8, 10)}/${i.xongGanNhat.slice(5, 7)}`, tone: 'ok' };
  }
  return null;
}

// ====================================================================== chuỗi điểm (Q16)

export type MocDiem = { chu: string; xau: boolean };

/**
 * CHUỖI ĐIỂM của một hộp kỹ năng — tối đa 5 mốc gần nhất. Fast Track ghi band; lớp thường ghi %
 * (làm tròn, `outcome` đã tính sẵn từ `evaluateRegular` chứ không tính lại 70% ở đây). `conCho` thêm
 * một mốc "?" ở cuối khi có đợt đã lên lịch nhưng chưa có điểm môn này.
 */
export function chuoiDiem(
  diem: readonly { gt: number; tong?: number | null; chuaDat: boolean }[],
  cheDo: 'ielts' | 'ratio',
  conCho: boolean,
): MocDiem[] {
  const moc: MocDiem[] = diem.slice(-5).map((d) => ({
    chu: cheDo === 'ratio' && d.tong ? `${Math.round((d.gt / d.tong) * 100)}%` : String(d.gt),
    xau: d.chuaDat,
  }));
  if (conCho) moc.push({ chu: '?', xau: false });
  return moc;
}

// ====================================================================== nhãn ghim đợt Test (Q16 hàng "Đợt Test")

export type NhanGhim = { ngan: string; day: string; tone: ProgressTone };

/**
 * NHÃN GHIM một đợt Test trên trục. Fast Track luôn có tiền tố `MT{n}`; lớp thường KHÔNG BAO GIỜ có
 * chữ "MT" (Q Bảng quyết định) — chỉ "Giữa"/"Cuối" ngắn gọn, đủ chữ ở `day` (tooltip).
 */
export function nhanGhim(a: {
  cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string;
  overall: number | null; sosLevel: number | null;
  soDat: number | null; soYeuCau: number; soCoDiem: number;
}): NhanGhim {
  if (a.cheDo === 'ielts') {
    const mt = `MT${a.attemptNo}`;
    if (a.soCoDiem === 0) return { ngan: mt, day: mt, tone: 'muted' };
    if (a.soCoDiem < a.soYeuCau) {
      const t = `${mt} · đang chấm`;
      return { ngan: t, day: t, tone: 'info' };
    }
    const soSos = a.sosLevel && a.sosLevel > 0;
    const band = a.overall != null ? a.overall.toFixed(1) : '—';
    const t = soSos ? `${mt} · ${band} · SOS ${a.sosLevel}` : `${mt} · ${band}`;
    return { ngan: t, day: t, tone: soSos ? 'danger' : 'ok' };
  }
  const daiKind = a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá';
  const ngan = a.kind === 'final' ? 'Cuối' : 'Giữa';
  if (a.soCoDiem === 0) return { ngan, day: daiKind, tone: 'muted' };
  if (a.soCoDiem < a.soYeuCau) return { ngan, day: `${daiKind} · còn ${a.soYeuCau - a.soCoDiem} môn`, tone: 'info' };
  const chuaDat = (a.soDat ?? 0) < a.soYeuCau;
  return { ngan, day: `${daiKind} · Đạt ${a.soDat ?? 0}/${a.soYeuCau} môn`, tone: chuaDat ? 'danger' : 'ok' };
}

// ====================================================================== nhãn hai nút giai đoạn (Q1)

/** Nhãn nút chọn giai đoạn: "Lớp thường · W2 JUN – W4 SEP" (đã xong) hoặc "Fast Track · từ W1 OCT" (đang chạy). */
export function nhanGiaiDoan(gd: { loai: 'thuong' | 'ft'; tu: string; den: string | null }, homNay: string): string {
  const nhan = gd.loai === 'thuong' ? 'Lớp thường' : 'Fast Track';
  if (gd.den) return `${nhan} · ${tuanLich(gd.tu, homNay)} – ${tuanLich(gd.den, homNay)}`;
  return `${nhan} · từ ${tuanLich(gd.tu, homNay)}`;
}
