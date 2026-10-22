import { NHAN_KIEU_O_MT, gomChip, nhomKyNang, tenMon, tenMonNgan, nhanTuanKhoa, tuanNamChu, type ChipKH, type KieuOMt, type KyNangKH } from '@shared/domain/index.ts';
import { MAU_O_MT } from '../../../ui/OMt.tsx';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import type { KnO } from './kieu.ts';

/**
 * Ô MỘT ĐỢT của lớp THƯỜNG (Giữa khoá / Cuối khoá — mockup 14 phương án B): gộp chip cùng tuần + cùng trạng thái, khác tuần tách dòng,
 * đợt xong gọn `Xong W3 SEP ✓`. Lớp FT: ô đợt đã có lịch = `ChipDotFT` ở cuối tệp (PR-OMT C6); ô chưa có đợt = `OMt`. Ô cao CỐ ĐỊNH 44px = 2 dòng chip (G-2) nên mọi hàng bằng
 * nhau; hiếm khi hơn 2 nhóm thì dòng 2 ghi `+n`. Màu chỉ dùng token nghĩa (N-1): xong `--done` · đã xếp `--doing` · đã dời `--soon` ·
 * chưa xếp viền đứt `--muted`. `onMo(kỹ năng, phần tử)` mở hộp sửa neo cạnh chip vừa bấm.
 */
export function ChipKyNang({ kn, attemptId, khaiGiang, tongTuan, deXuat, nhanDeXuat, tenDot, onMo, ct = null }: {
  /** Mã chương trình lớp (MH3: Kế hoạch Test khung lớp thường gọi tên môn theo chương trình — FOU G+V/P). */
  ct?: string | null;
  kn: KnO; attemptId: number | null;
  khaiGiang?: string | null; tongTuan?: number | null;
  /** Lớp thường chưa có bài: tuần đề xuất (thứ Hai) và nhãn tuần khoá của nó. */
  deXuat?: string | null; nhanDeXuat?: string | null;
  tenDot: string;
  onMo: (skill: KyNangKH | null, el: HTMLElement) => void;
}) {
  const bao = 'flex h-[44px] w-full flex-col justify-center gap-[3px]';

  if (attemptId === null) {
    return (
      <button type="button" onClick={(e) => onMo(null, e.currentTarget)} title={`Xếp ${tenDot} cho em này (đang là đề xuất)`}
        className="flex h-[44px] w-full flex-col items-center justify-center rounded border border-dashed border-muted-line text-[12px] text-slate-500 hover:text-slate-200">
        <span>đề xuất {deXuat ? tuanNamChu(deXuat) : '—'}</span>
        {nhanDeXuat && <span className="text-[12px]">{nhanDeXuat}</span>}
      </button>
    );
  }

  const g = gomChip(kn);
  const tooltip = (chip: ChipKH) => chip.kyNang
    .map((k) => `${tenMon(ct, k)}: ${kn[k]?.tuan ? tuanNamChu(kn[k]!.tuan!) : 'chưa xếp'}${kn[k]?.doiTu ? ` (dời từ ${tuanNamChu(kn[k]!.doiTu!)})` : ''}${kn[k]?.khoa ? ` (${kn[k]!.khoa})` : ''}`)
    .join('\n');

  if (g.xong) {
    return (
      <div className={bao}>
        <button type="button" className={`${CHIP_CLS} bg-done-bg text-done border-done-line`} title="Đã làm bài — xem" onClick={(e) => onMo(null, e.currentTarget)}>
          <span className="font-bold">Xong</span>
          <span className="whitespace-nowrap tabular-nums">
            {g.tuanXong ? tuanNamChu(g.tuanXong) : ''}<span aria-hidden title="Đã làm bài"> ✓</span>
            <NhanKhoa tuan={g.tuanXong} khaiGiang={khaiGiang} tongTuan={tongTuan} />
          </span>
        </button>
      </div>
    );
  }

  if (!g.chip.length) {
    return <div className={bao}><span className="text-center text-[12px] text-slate-500" title="Đợt này không có kỹ năng nào">—</span></div>;
  }

  const hienThi = g.chip.slice(0, 2);
  const conLai = g.chip.slice(2);
  const them = conLai.length;
  return (
    <div className={bao}>
      {hienThi.map((c, i) => (
        <Chip key={i} c={c} ct={ct} khaiGiang={khaiGiang} tongTuan={tongTuan}
          them={i === 1 && them > 0 ? { n: them, ds: conLai.map((x) => `${x.kyNang.map((k) => tenMonNgan(ct, k)).join(' ')} · ${x.tuan ? tuanNamChu(x.tuan) : 'chưa xếp'}`).join('\n') } : null}
          title={tooltip(c)} onMo={onMo} />
      ))}
    </div>
  );
}

const CHIP_CLS = 'flex h-[20px] w-full items-center justify-between gap-1 rounded border px-1.5 text-[12px] leading-none';

function NhanKhoa({ tuan, khaiGiang, tongTuan }: { tuan: string | null; khaiGiang?: string | null; tongTuan?: number | null }) {
  const n = nhanTuanKhoa(tuan, khaiGiang ?? null, tongTuan ?? null);
  return n ? <span className="ml-1 text-[12px] font-normal">{n}</span> : null;
}

/**
 * Màu theo trạng thái (N-1, token nghĩa): xong `done` · đã xếp `doing` · đã dời `soon` · vắng `late` · chờ Quản lý duyệt `muted` ·
 * trễ `bad` (viền mảnh, nền trong) · đã huỷ `done` gạch ngang · chưa xếp viền đứt. Chữ đuôi ngắn để chip 20px không xuống dòng;
 * câu đủ nằm ở tooltip.
 */
const MAU_TT: Record<string, { mau: string; duoi: string | null; nghia: string | null }> = {
  'da-doi': { mau: 'bg-soon-bg text-soon border-soon-line', duoi: 'dời', nghia: null },
  vang: { mau: 'bg-late-bg text-late border-late-line', duoi: 'vắng', nghia: 'vắng · Quản lý xếp lại' },
  'cho-duyet': { mau: 'bg-muted-bg text-muted border-muted-line', duoi: 'chờ duyệt', nghia: 'chờ Quản lý duyệt đề nghị dời' },
  tre: { mau: 'bg-transparent text-bad border-bad-line', duoi: 'trễ', nghia: 'trễ — tuần Test đã hết, chưa có điểm' },
  'da-huy': { mau: 'bg-done-bg text-done border-done-line line-through', duoi: 'đã huỷ', nghia: 'đã huỷ' },
  xong: { mau: 'bg-done-bg text-done border-done-line', duoi: null, nghia: null },
};

/** Chữ chú giải từng trạng thái chip lớp thường (cùng khoá `MAU_TT`). */
const NHAN_TT: Record<keyof typeof MAU_TT, string> = {
  'da-doi': 'Đã dời', vang: 'Vắng', 'cho-duyet': 'Chờ duyệt dời', tre: 'Trễ (chưa có điểm)', 'da-huy': 'Đã huỷ', xong: 'Đã làm bài ✓',
};

/**
 * CHÚ GIẢI MÀU (KHUNG-LOI, TST-05) — sinh từ CHÍNH bảng màu của chip (`MAU_O_MT` cho FT, `MAU_TT` cho lớp thường), không viết tay chữ màu
 * (trước: "Xám = đã thi xong" trong khi chip xong là xanh lá). `cho-cham-cu` cùng màu `cho-cham` → bỏ trùng.
 */
export function ChuGiaiMau({ ft }: { ft: boolean }) {
  const mau: [string, string, string][] = ft
    ? (Object.keys(MAU_O_MT) as KieuOMt[]).filter((k) => k !== 'cho-cham-cu').map((k) => [k, MAU_O_MT[k], NHAN_KIEU_O_MT[k]])
    : [['chua', 'border-dashed border-muted-line bg-transparent text-muted', 'Chưa xếp'], ['co', 'bg-doing-bg text-doing border-doing-line', 'Đã xếp'],
      ...(Object.keys(MAU_TT) as (keyof typeof MAU_TT)[]).map((k): [string, string, string] => [k, MAU_TT[k].mau, NHAN_TT[k]])];
  return (
    <span className="flex flex-wrap gap-1.5">
      {mau.map(([k, lop, nhan]) => <span key={k} className={`inline-flex h-5 items-center rounded-md border px-1.5 text-xs font-semibold ${lop}`}>{nhan}</span>)}
    </span>
  );
}

function Chip({ c, khaiGiang, tongTuan, them, title, onMo, ct = null }: {
  ct?: string | null;
  c: ChipKH; khaiGiang?: string | null; tongTuan?: number | null;
  them: { n: number; ds: string } | null; title: string; onMo: (skill: KyNangKH | null, el: HTMLElement) => void;
}) {
  const chua = c.trangThai === 'chua-xep' || c.tuan === null;
  /* OV-11a: Không dự thi — chữ riêng, không ✓ (không phải "đã thi"). */
  const tt = c.khongDuThi ? { mau: 'border-muted-line bg-muted-bg text-muted', duoi: 'vắng', nghia: 'Vắng — không dời, không nợ' } : MAU_TT[c.trangThai];
  const mau = chua ? 'border-dashed border-muted-line bg-transparent text-muted' : tt?.mau ?? 'bg-doing-bg text-doing border-doing-line';
  const chu = c.kyNang.map((k) => tenMonNgan(ct, k)).join(' ');
  return (
    <button type="button" className={`${CHIP_CLS} ${mau} text-left`} title={tt?.nghia ? `${title}\n${tt.nghia}` : title} onClick={(e) => onMo(c.kyNang[0], e.currentTarget)}>
      <span className="flex min-w-0 items-center truncate font-bold tracking-wide">
        {chu}{!chua && tt?.duoi && <span className="font-normal"> · {tt.duoi}</span>}
      </span>
      <span className="whitespace-nowrap tabular-nums">
        {chua ? 'chưa xếp' : tuanNamChu(c.tuan!)}
        {c.trangThai === 'xong' && !c.khongDuThi && <span aria-hidden title="Đã làm bài"> ✓</span>}
        {!chua && <NhanKhoa tuan={c.tuan} khaiGiang={khaiGiang} tongTuan={tongTuan} />}
        {them && <span className="ml-1 text-[12px]" title={them.ds}>+{them.n}</span>}
      </span>
    </button>
  );
}

/** Viền ô đợt FT theo trạng thái chính (mockup V5 `dieu-chinh-cuoi.html` `.o-kh`): khung viền, không chip nền màu; trạng thái còn ghi bằng chữ. */
const VIEN_O: Partial<Record<KieuOMt, string>> = {
  xong: 'border-ok-line', 'dang-thi': 'border-doing-line shadow-[inset_3px_0_0_rgb(var(--doing-rgb))]', 'tre-cham': 'border-bad-line bg-bad-bg',
  'con-viec': 'border-soon-line', 'chua-lich': 'border-dashed border-muted-line',
};
const CHU_TT: Partial<Record<KieuOMt, string>> = { xong: t('xong'), 'dang-thi': t('Tuần này'), 'co-lich': t('đã xếp'), 'chua-lich': t('chưa xếp') };
const MAU_TT_O: Partial<Record<KieuOMt, string>> = { xong: 'text-ok', 'dang-thi': 'text-doing', 'tre-cham': 'text-bad', 'con-viec': 'text-soon' };
/** Nhóm "chính" của ô — việc gấp nhất quyết viền + dòng trạng thái. */
const UU_TIEN: KieuOMt[] = ['tre-cham', 'con-viec', 'dang-thi', 'cho-cham', 'cho-cham-cu', 'co-lich', 'chua-lich', 'xong'];

/**
 * Ô MỘT ĐỢT của lớp FT ở lưới Kế hoạch Test (UI-CHAM-TEST theo mockup V5 khu a, thay chip màu PR-OMT C6): MỘT khung viền, ba dòng —
 * kỹ năng (nhóm khác trạng thái / tuần ghi kèm chữ việc: `L R W · S vắng`) · tuần `W3 SEP 2026` · trạng thái (`Tuần này`, `đã xếp`, `trễ chấm`…;
 * đợt xong = `✓ / ✗ Overall 6.0`). Màu + chữ việc vẫn theo `nhomKyNang` (cùng luật ô MT). Bấm mở hộp cả đợt.
 */
export function ChipDotFT({ so, kn, cu, homNay, ct = null, chon, ovr, kyVong, onMo }: {
  so: number; kn: KnO; cu: boolean; homNay: string; ct?: string | null; chon: boolean;
  /** Đợt xong: Overall + kỳ vọng của lượt (máy chủ `luoiFT`). */
  ovr?: number; kyVong?: number | null;
  onMo: (el: HTMLElement) => void;
}) {
  const nhom = nhomKyNang(kn, homNay, ct, cu);
  /* C20: tuần của nhóm (nhóm "xong" = tuần muộn nhất) đọc lại từ `kn`, cùng luật gom của `nhomKyNang`. */
  const tuanCua = (ks: readonly KyNangKH[]) => ks.map((k) => kn[k]?.tuan).filter((x): x is string => !!x).sort().pop() ?? null;
  if (!nhom.length) return <span className="block text-center text-[12px] text-slate-500" title="Đợt này không có kỹ năng nào">—</span>;
  const chinh = [...nhom].sort((a, b) => UU_TIEN.indexOf(a.kieu) - UU_TIEN.indexOf(b.kieu))[0];
  const tuan = chinh.tuan ? tuanNamChu(tuanCua(chinh.kyNang)) : null;
  const dat = ovr !== undefined && kyVong != null ? ovr >= kyVong : null;
  const tt = chinh.kieu === 'xong' && ovr !== undefined
    ? `${dat === null ? '' : dat ? '✓ ' : '✗ '}${t('Overall')} ${fmtBand(ovr)}`
    : chinh.viec ? chuViec(chinh.viec) : CHU_TT[chinh.kieu] ?? null;
  return (
    <button type="button" onClick={(e) => onMo(e.currentTarget)} title={nhom.map((g) => g.title).join('\n')}
      aria-label={`MT${so}, ${nhom.map((g) => g.doc).join('; ')}${ovr !== undefined ? `, Overall ${fmtBand(ovr)}` : ''}`}
      className={`mx-auto flex w-full max-w-[168px] flex-col items-start gap-px rounded-md border bg-[var(--surface)] px-2 py-1 text-left max-sm:min-h-[44px] ${dat === false && chinh.kieu === 'xong' ? 'border-bad-line' : VIEN_O[chinh.kieu] ?? 'border-[var(--line)]'} ${chon ? 'ring-2 ring-[var(--text)]' : ''}`}>
      <span className="flex flex-wrap gap-x-1.5 text-xs font-bold tracking-wide text-slate-300">
        {nhom.map((g, i) => (
          <span key={g.ten}>{i > 0 && <span aria-hidden className="font-normal opacity-60">· </span>}{g.ten}
            {g !== chinh && g.viec && <span className="font-medium"> {g.viec}</span>}
            {g !== chinh && g.kieu === 'xong' && <span aria-hidden> ✓</span>}
            {g !== chinh && g.tuan && chinh.tuan && tuanCua(g.kyNang) !== tuanCua(chinh.kyNang) && <span className="font-medium"> {g.tuan}</span>}</span>
        ))}
      </span>
      <span className="whitespace-nowrap text-sm font-bold tabular-nums text-slate-100">{tuan ?? t('chưa xếp')}</span>
      {tt && <span className={`text-xs font-semibold tabular-nums ${dat === false && chinh.kieu === 'xong' ? 'text-bad' : MAU_TT_O[chinh.kieu] ?? 'text-slate-400'}`}>{tt}</span>}
    </button>
  );
}

/** Chữ việc trên ô ("chờ" → "chờ chấm", "trễ" → "trễ chấm") — câu đủ như dòng kỹ năng hộp một đợt. */
const chuViec = (v: string) => (v === t('chờ') ? t('chờ chấm') : v === t('trễ') ? t('trễ chấm') : v);
