import { gomChip, nhomKyNang, tenMon, tenMonNgan, nhanTuanKhoa, tuanLich, type ChipKH, type KyNangKH } from '@shared/domain/index.ts';
import { MAU_O_MT } from '../../../ui/OMt.tsx';
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
        className="flex h-[44px] w-full flex-col items-center justify-center rounded border border-dashed border-muted-line text-[11px] text-slate-500 hover:text-slate-200">
        <span>đề xuất {deXuat ? tuanLich(deXuat) : '—'}</span>
        {nhanDeXuat && <span className="text-[11px]">{nhanDeXuat}</span>}
      </button>
    );
  }

  const g = gomChip(kn);
  const tooltip = (chip: ChipKH) => chip.kyNang
    .map((k) => `${tenMon(ct, k)}: ${kn[k]?.tuan ? tuanLich(kn[k]!.tuan!) : 'chưa xếp'}${kn[k]?.doiTu ? ` (dời từ ${tuanLich(kn[k]!.doiTu!)})` : ''}${kn[k]?.khoa ? ` (${kn[k]!.khoa})` : ''}`)
    .join('\n');

  if (g.xong) {
    return (
      <div className={bao}>
        <button type="button" className={`${CHIP_CLS} bg-done-bg text-done border-done-line`} title="Đã thi — xem" onClick={(e) => onMo(null, e.currentTarget)}>
          <span className="font-bold">Xong</span>
          <span className="whitespace-nowrap tabular-nums">
            {g.tuanXong ? tuanLich(g.tuanXong) : ''}<span aria-hidden title="Đã thi"> ✓</span>
            <NhanKhoa tuan={g.tuanXong} khaiGiang={khaiGiang} tongTuan={tongTuan} />
          </span>
        </button>
      </div>
    );
  }

  if (!g.chip.length) {
    return <div className={bao}><span className="text-center text-[11px] text-slate-600" title="Đợt này không thi kỹ năng nào">—</span></div>;
  }

  const hienThi = g.chip.slice(0, 2);
  const conLai = g.chip.slice(2);
  const them = conLai.length;
  return (
    <div className={bao}>
      {hienThi.map((c, i) => (
        <Chip key={i} c={c} ct={ct} khaiGiang={khaiGiang} tongTuan={tongTuan}
          them={i === 1 && them > 0 ? { n: them, ds: conLai.map((x) => `${x.kyNang.map((k) => tenMonNgan(ct, k)).join(' ')} · ${x.tuan ? tuanLich(x.tuan) : 'chưa xếp'}`).join('\n') } : null}
          title={tooltip(c)} onMo={onMo} />
      ))}
    </div>
  );
}

const CHIP_CLS = 'flex h-[20px] w-full items-center justify-between gap-1 rounded border px-1.5 text-[11px] leading-none';

function NhanKhoa({ tuan, khaiGiang, tongTuan }: { tuan: string | null; khaiGiang?: string | null; tongTuan?: number | null }) {
  const n = nhanTuanKhoa(tuan, khaiGiang ?? null, tongTuan ?? null);
  return n ? <span className="ml-1 text-[11px] font-normal">{n}</span> : null;
}

/**
 * Màu theo trạng thái (N-1, token nghĩa): xong `done` · đã xếp `doing` · đã dời `soon` · vắng `late` · chờ Quản lý duyệt `wait` ·
 * trễ `bad` (viền mảnh, nền trong) · đã huỷ `done` gạch ngang · chưa xếp viền đứt. Chữ đuôi ngắn để chip 20px không xuống dòng;
 * câu đủ nằm ở tooltip.
 */
const MAU_TT: Record<string, { mau: string; duoi: string | null; nghia: string | null }> = {
  'da-doi': { mau: 'bg-soon-bg text-soon border-soon-line', duoi: 'dời', nghia: null },
  vang: { mau: 'bg-late-bg text-late border-late-line', duoi: 'vắng', nghia: 'vắng · Quản lý xếp lại' },
  'cho-duyet': { mau: 'bg-wait-bg text-wait border-wait-line', duoi: 'chờ duyệt', nghia: 'chờ Quản lý duyệt đề nghị dời' },
  tre: { mau: 'bg-transparent text-bad border-bad-line', duoi: 'trễ', nghia: 'trễ — tuần thi đã hết, chưa có điểm' },
  'da-huy': { mau: 'bg-done-bg text-done border-done-line line-through', duoi: 'đã huỷ', nghia: 'đã huỷ phần thi' },
  xong: { mau: 'bg-done-bg text-done border-done-line', duoi: null, nghia: null },
};

function Chip({ c, khaiGiang, tongTuan, them, title, onMo, ct = null }: {
  ct?: string | null;
  c: ChipKH; khaiGiang?: string | null; tongTuan?: number | null;
  them: { n: number; ds: string } | null; title: string; onMo: (skill: KyNangKH | null, el: HTMLElement) => void;
}) {
  const chua = c.trangThai === 'chua-xep' || c.tuan === null;
  const tt = MAU_TT[c.trangThai];
  const mau = chua ? 'border-dashed border-muted-line bg-transparent text-muted' : tt?.mau ?? 'bg-doing-bg text-doing border-doing-line';
  const chu = c.kyNang.map((k) => tenMonNgan(ct, k)).join(' ');
  return (
    <button type="button" className={`${CHIP_CLS} ${mau} text-left`} title={tt?.nghia ? `${title}\n${tt.nghia}` : title} onClick={(e) => onMo(c.kyNang[0], e.currentTarget)}>
      <span className="flex min-w-0 items-center truncate font-bold tracking-wide">
        {chu}{!chua && tt?.duoi && <span className="font-normal"> · {tt.duoi}</span>}
      </span>
      <span className="whitespace-nowrap tabular-nums">
        {chua ? 'chưa xếp' : tuanLich(c.tuan!)}
        {c.trangThai === 'xong' && <span aria-hidden title="Đã thi"> ✓</span>}
        {!chua && <NhanKhoa tuan={c.tuan} khaiGiang={khaiGiang} tongTuan={tongTuan} />}
        {them && <span className="ml-1 text-[11px]" title={them.ds}>+{them.n}</span>}
      </span>
    </button>
  );
}

/**
 * Ô MỘT ĐỢT của lớp FT ở lưới Kế hoạch Test (PR-OMT C6, mockup G1 — kiểu cũ): cả đợt cùng tuần + cùng trạng thái → MỘT chip
 * `L R W S · W4 SEP`; tách tuần / khác trạng thái → một chip mỗi nhóm (`L R W · W4 SEP`, `S · vắng · W4 SEP`); hiện đủ kỹ năng và trạng thái.
 * Ô dày (nhiều dòng) nhưng hẹp: xuống dòng theo nhóm, không kéo cột. Màu + chữ việc theo `nhomKyNang` (cùng luật ô MT). Mọi chip mở hộp cả đợt.
 */
export function ChipDotFT({ so, kn, cu, homNay, ct = null, chon, onMo }: {
  so: number; kn: KnO; cu: boolean; homNay: string; ct?: string | null; chon: boolean; onMo: (el: HTMLElement) => void;
}) {
  const nhom = nhomKyNang(kn, homNay, ct, cu);
  if (!nhom.length) return <span className="block text-center text-[11px] text-slate-600" title="Đợt này không thi kỹ năng nào">—</span>;
  return (
    <div className="mx-auto flex w-full max-w-[168px] flex-col gap-[3px]">
      {nhom.map((g) => (
        <button key={g.ten} type="button" onClick={(e) => onMo(e.currentTarget)} title={g.title}
          aria-label={`MT${so}, ${g.ten}${g.viec ? `, ${g.viec.replace(/^(chờ|trễ)$/, '$1 chấm')}` : ''}, ${g.tuan ?? 'chưa xếp'}`}
          className={`flex h-5 w-full items-center justify-between gap-1 rounded-md border px-1.5 text-left text-[11.5px] font-semibold leading-[18px] ${MAU_O_MT[g.kieu]} ${chon ? 'ring-2 ring-[var(--text)]' : ''}`}>
          <span className="min-w-0 truncate font-bold">
            {g.ten}{g.viec && <span className="font-medium"> · {g.viec}</span>}
          </span>
          <span className="whitespace-nowrap tabular-nums">{g.tuan ?? 'chưa xếp'}</span>
        </button>
      ))}
    </div>
  );
}
