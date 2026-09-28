import { Link } from 'react-router-dom';
import { gomChip, tenMon, tenMonNgan, nhanTuanKhoa, tuanLich, type ChipKH, type KyNangKH } from '@shared/domain/index.ts';
import type { KnO } from './kieu.ts';

/**
 * Ô MỘT ĐỢT của một em (mockup 14 phương án B): gộp chip cùng tuần + cùng trạng thái, khác tuần tách dòng, đợt xong gọn
 * `Xong W3 SEP ✓`. Ô cao CỐ ĐỊNH 44px = 2 dòng chip (G-2) nên mọi hàng bằng nhau; hiếm khi hơn 2 nhóm thì dòng 2 ghi `+n`.
 * Màu chỉ dùng token nghĩa (N-1): xong `--done` · đã xếp `--doing` · đã dời `--soon` · chưa xếp viền đứt `--muted`.
 * `onMo(kỹ năng, phần tử)` mở hộp sửa neo cạnh chip vừa bấm.
 */
export function ChipKyNang({ kn, attemptId, loai, khaiGiang, tongTuan, deXuat, nhanDeXuat, tenDot, onMo, ct = null }: {
  /** Mã chương trình lớp (MH3: Kế hoạch Test khung lớp thường gọi tên môn theo chương trình — FOU G+V/P). */
  ct?: string | null;
  kn: KnO; attemptId: number | null; loai: 'ft' | 'thuong';
  khaiGiang?: string | null; tongTuan?: number | null;
  /** Lớp thường chưa có bài: tuần đề xuất (thứ Hai) và nhãn tuần khoá của nó. */
  deXuat?: string | null; nhanDeXuat?: string | null;
  tenDot: string;
  onMo: (skill: KyNangKH | null, el: HTMLElement) => void;
}) {
  const bao = 'flex h-[44px] w-full flex-col justify-center gap-[3px]';

  if (attemptId === null) {
    if (loai === 'ft') {
      return (
        <button type="button" onClick={(e) => onMo(null, e.currentTarget)} title={`Xếp ${tenDot} cho em này`}
          className="flex h-[44px] w-full items-center justify-center rounded border border-dashed border-muted-line text-[11px] text-slate-500 hover:text-slate-200">
          + xếp
        </button>
      );
    }
    return (
      <button type="button" onClick={(e) => onMo(null, e.currentTarget)} title={`Xếp ${tenDot} cho em này (đang là đề xuất)`}
        className="flex h-[44px] w-full flex-col items-center justify-center rounded border border-dashed border-muted-line text-[10.5px] text-slate-500 hover:text-slate-200">
        <span>đề xuất {deXuat ? tuanLich(deXuat) : '—'}</span>
        {nhanDeXuat && <span className="text-[10px] opacity-80">{nhanDeXuat}</span>}
      </button>
    );
  }

  const g = gomChip(kn);
  const tooltip = (chip: ChipKH) => chip.kyNang
    .map((k) => `${tenMon(ct, k)}: ${kn[k]?.tuan ? tuanLich(kn[k]!.tuan!) : 'chưa xếp'}${kn[k]?.doiTu ? ` (dời từ ${tuanLich(kn[k]!.doiTu!)})` : ''}${kn[k]?.khoa ? ` (${kn[k]!.khoa})` : ''}`)
    .join('\n');

  if (g.xong) {
    const noiDung = (
      <>
        <span className="font-bold">Xong</span>
        <span className="whitespace-nowrap tabular-nums">
          {g.tuanXong ? tuanLich(g.tuanXong) : ''}<span aria-hidden title="Đã thi"> ✓</span>
          {loai === 'thuong' && <NhanKhoa tuan={g.tuanXong} khaiGiang={khaiGiang} tongTuan={tongTuan} />}
        </span>
      </>
    );
    const cls = `${CHIP_CLS} bg-done-bg text-done border-done-line`;
    return (
      <div className={bao}>
        {loai === 'ft' ? (
          <Link to={`/mock-test/${attemptId}`} className={`${cls} no-underline`} title="Đã thi — mở hồ sơ đợt">{noiDung}</Link>
        ) : (
          <button type="button" className={cls} title="Đã thi — xem" onClick={(e) => onMo(null, e.currentTarget)}>{noiDung}</button>
        )}
      </div>
    );
  }

  if (!g.chip.length) {
    return <div className={bao}><span className="text-center text-[11px] text-slate-600" title="Đợt này không thi kỹ năng nào">—</span></div>;
  }

  const hienThi = g.chip.slice(0, 2);
  const conLai = g.chip.slice(2);
  return (
    <div className={bao}>
      {hienThi.map((c, i) => (
        <Chip key={i} c={c} loai={loai} ct={ct} khaiGiang={khaiGiang} tongTuan={tongTuan}
          them={i === 1 && g.them > 0 ? { n: g.them, ds: conLai.map((x) => `${x.kyNang.map((k) => tenMonNgan(ct, k)).join(' ')} · ${x.tuan ? tuanLich(x.tuan) : 'chưa xếp'}`).join('\n') } : null}
          title={tooltip(c)} onMo={onMo} />
      ))}
    </div>
  );
}

const CHIP_CLS = 'flex h-[20px] w-full items-center justify-between gap-1 rounded border px-1.5 text-[10.5px] leading-none';

function NhanKhoa({ tuan, khaiGiang, tongTuan }: { tuan: string | null; khaiGiang?: string | null; tongTuan?: number | null }) {
  const n = nhanTuanKhoa(tuan, khaiGiang ?? null, tongTuan ?? null);
  return n ? <span className="ml-1 text-[10px] font-normal opacity-70">{n}</span> : null;
}

function Chip({ c, loai, khaiGiang, tongTuan, them, title, onMo, ct = null }: {
  ct?: string | null;
  c: ChipKH; loai: 'ft' | 'thuong'; khaiGiang?: string | null; tongTuan?: number | null;
  them: { n: number; ds: string } | null; title: string; onMo: (skill: KyNangKH | null, el: HTMLElement) => void;
}) {
  const daDoi = c.trangThai === 'da-doi';
  const chua = c.trangThai === 'chua-xep' || c.tuan === null;
  const mau = chua ? 'border-dashed border-muted-line bg-transparent text-muted'
    : daDoi ? 'bg-soon-bg text-soon border-soon-line'
      : c.trangThai === 'xong' ? 'bg-done-bg text-done border-done-line'
        : 'bg-doing-bg text-doing border-doing-line';
  const chu = c.kyNang.map((k) => tenMonNgan(ct, k)).join(' ');
  return (
    <button type="button" className={`${CHIP_CLS} ${mau} text-left`} title={title} onClick={(e) => onMo(c.kyNang[0], e.currentTarget)}>
      <span className="font-bold tracking-wide">{chu}{daDoi && <span className="font-normal"> · dời</span>}</span>
      <span className="whitespace-nowrap tabular-nums">
        {chua ? 'chưa xếp' : tuanLich(c.tuan!)}
        {c.trangThai === 'xong' && <span aria-hidden title="Đã thi"> ✓</span>}
        {loai === 'thuong' && !chua && <NhanKhoa tuan={c.tuan} khaiGiang={khaiGiang} tongTuan={tongTuan} />}
        {them && <span className="ml-1 text-[10px] opacity-80" title={them.ds}>+{them.n}</span>}
      </span>
    </button>
  );
}
