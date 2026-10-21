import { useState } from 'react';
import type { DinhNghiaCot } from '@shared/domain/index.ts';
import { Card } from '../../ui/ui.tsx';
import { Bang } from '../../ui/Bang.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';

/**
 * BẢNG MẪU (BANG-0, 04 mục 18 phần 4): `Bang` đủ kiểu cột + `ODiem` đủ biến thể, dữ liệu dày, trạng thái thật — chủ SP duyệt một lần;
 * BANG-1 chuyển lưới điểm theo đúng mẫu này. Đo bằng `do-bang` (CONG-CU) ở 1440 / 1280 / 375.
 */

type Kq = 'vuot' | 'bang' | 'duoi' | null;
type O = { so: string | null; kq?: Kq; kck?: boolean; luu?: 'dang-luu' | 'da-luu' | 'loi'; phu?: string; sua?: boolean };
type HangFt = { id: number; ten: string; lop?: string; o: Record<'l' | 'r' | 'w1' | 'w2' | 'w' | 's', O>; kv: string; ovr: O; sos: number | null; thi: string; viec: string; han: string };

const KY: Array<[keyof HangFt['o'], string]> = [['l', 'L'], ['r', 'R'], ['w1', 'W1'], ['w2', 'W2'], ['w', 'W'], ['s', 'S']];
const COT_FT: DinhNghiaCot[] = [
  { key: 'ten', nhan: 'Học viên', kieu: 'ten' },
  ...KY.map(([key, nhan]) => ({ key, nhan, kieu: 'diem' as const, nhom: 'MT2 · W2 OCT' })),
  { key: 'kv', nhan: 'Kỳ vọng', kieu: 'noi-bat' },
  { key: 'ovr', nhan: 'Overall', kieu: 'noi-bat' },
  { key: 'kq', nhan: 'Kết quả', kieu: 'chip' },
  { key: 'thi', nhan: 'Thi', kieu: 'tuan' },
  { key: 'viec', nhan: 'Việc tiếp', kieu: 'viec' },
  { key: 'nut', nhan: '', kieu: 'nut' },
];
const HANG_FT: HangFt[] = [
  { id: 1, ten: 'Nguyễn Thị Phương Thảo', o: { l: { so: '7.0', kq: 'vuot' }, r: { so: '6.5', kq: 'bang' }, w1: { so: '6.0', kq: 'duoi' }, w2: { so: '6.5', kq: 'bang' }, w: { so: '6.0', kq: 'duoi' }, s: { so: '7.5', kq: 'vuot' } },
    kv: '6.5', ovr: { so: '6.5', kq: 'bang' }, sos: 1, thi: 'W3 OCT', viec: 'Lập PA', han: 'hạn 18/10' },
  { id: 2, ten: 'Đỗ Vũ Tuấn Phong', lop: 'MB FT 101 · vào W1 SEP', o: { l: { so: '5.5', kq: 'duoi', phu: '30 câu' }, r: { so: null, sua: true }, w1: { so: '6.5', kq: 'bang', sua: true, luu: 'da-luu' }, w2: { so: '6.0', kq: 'duoi', sua: true, luu: 'loi' }, w: { so: '6.0', kq: 'duoi' }, s: { so: '6.5', kq: 'bang', sua: true, luu: 'dang-luu' } },
    kv: '6.5', ovr: { so: null }, sos: null, thi: 'W3 OCT', viec: 'Nhập điểm', han: 'hạn 16/10' },
  { id: 3, ten: 'Trần Hoàng Bảo Ngọc Anh Thư Nguyễn Lê Phương', o: { l: { so: '5.0', kq: 'duoi', kck: true }, r: { so: '6.0', kq: 'duoi' }, w1: { so: '5.5', kq: 'duoi' }, w2: { so: '5.5', kq: 'duoi' }, w: { so: '5.5', kq: 'duoi' }, s: { so: '5.0', kq: 'duoi' } },
    kv: '6.5', ovr: { so: '5.5', kq: 'duoi' }, sos: 3, thi: 'W4 OCT', viec: 'Cập nhật PA', han: 'hạn 21/10' },
  { id: 4, ten: 'Lê Minh Khoa', o: { l: { so: '6.0' }, r: { so: '6.5' }, w1: { so: null }, w2: { so: null }, w: { so: null }, s: { so: null } },
    kv: '—', ovr: { so: null }, sos: null, thi: 'W1 NOV', viec: '', han: '' },
];

type HangThuong = { id: number; ten: string; gv: [string | null, number]; r: [string | null, number]; w: [string | null, number]; s: [string | null, number]; pt: string; dat: boolean | null };
const COT_THUONG: DinhNghiaCot[] = [
  { key: 'ten', nhan: 'Học viên', kieu: 'ten' },
  { key: 'gv', nhan: 'G+V', kieu: 'diem-ti-le', phu: '/25', nhom: 'Progress' },
  { key: 'r', nhan: 'R', kieu: 'diem-ti-le', phu: '/25', nhom: 'Progress' },
  { key: 'w', nhan: 'W', kieu: 'diem-ti-le', phu: '/20', nhom: 'Progress' },
  { key: 's', nhan: 'S', kieu: 'diem-ti-le', phu: '/20', nhom: 'Progress' },
  { key: 'pt', nhan: '% tổng', kieu: 'phan-tram', nhom: 'Final' },
  { key: 'kq', nhan: 'Kết quả', kieu: 'chip', rong: 176 },
];
const TONG: Record<'gv' | 'r' | 'w' | 's', number> = { gv: 25, r: 25, w: 20, s: 20 };
const HANG_THUONG: HangThuong[] = [
  { id: 1, ten: 'Lưu Bảo Ngân', gv: ['17', 25], r: ['21', 25], w: ['15', 20], s: ['14', 20], pt: '62 %', dat: false },
  { id: 2, ten: 'Phạm Quốc Huy', gv: ['22', 25], r: ['9', 12], w: ['16', 20], s: ['17', 20], pt: '78 %', dat: true },
  { id: 3, ten: 'Vũ Thị Mai Anh', gv: ['20', 25], r: [null, 25], w: [null, 20], s: ['15', 20], pt: '—', dat: null },
];
/** Lớp thường: đạt ≥ 70 % trên số chưa làm tròn (Rulebook) — mẫu chỉ để vẽ. */
const kqTiLe = (dung: string | null, tong: number): Kq => (dung === null ? null : Number(dung) / tong >= 0.7 ? 'vuot' : 'duoi');

export function BangMau() {
  const [mo, setMo] = useState<number | null>(1);
  const oFt = (h: HangFt, c: DinhNghiaCot) => {
    if (c.key === 'ten') return <span className="font-semibold">{h.ten}</span>;
    const k = c.key as keyof HangFt['o'];
    if (h.o[k]) {
      const o = h.o[k];
      return o.sua
        ? <ODiem kieu="sua" so={o.so} kq={o.kq} luu={o.luu} nhan={c.nhan} kyVong={h.kv} onBam={() => undefined} onLuuLai={() => undefined} />
        : <ODiem so={o.so} kq={o.kq} kck={o.kck} nhan={c.nhan} kyVong={h.kv} />;
    }
    if (c.key === 'kv') return <span className="font-extrabold tabular-nums">{h.kv}</span>;
    if (c.key === 'ovr') return <ODiem so={h.ovr.so} kq={h.ovr.kq} nhan="Overall" kyVong={h.kv} />;
    if (c.key === 'kq') return h.sos ? <ChipSos muc={h.sos} kyNang={h.sos >= 3 ? ['L', 'R', 'W', 'S'] : ['W']} dot="MT2" /> : <span className="px-2 text-faint">—</span>;
    if (c.key === 'thi') return <span className="tabular-nums">{h.thi}</span>;
    if (c.key === 'viec') return h.viec ? <span><span className="font-semibold">{h.viec}</span> <span className="text-[13px] text-slate-400">{h.han}</span></span> : null;
    return <MenuDong muc={[{ key: 'ho-so', nhan: 'Mở hồ sơ', onChon: () => undefined }]} />;
  };
  const phuFt = (h: HangFt, c: DinhNghiaCot) => (c.key === 'ten' ? h.lop : h.o[c.key as keyof HangFt['o']]?.phu);
  const oThuong = (h: HangThuong, c: DinhNghiaCot) => {
    if (c.key === 'ten') return <span className="font-semibold">{h.ten}</span>;
    if (c.key === 'pt') return <span className={`text-[15px] font-bold tabular-nums ${h.dat === null ? '' : h.dat ? 'text-kq-vuot' : 'text-kq-duoi'}`}>{h.pt}</span>;
    if (c.key === 'kq') return h.dat === null ? <span className="px-2 text-slate-300">Chưa đủ điểm</span>
      : h.dat ? <span className="px-2 font-semibold text-kq-vuot">✓ Đạt</span> : <ChipSos muc={1} kyNang={['Speaking']} dot="Progress Test" thuong />;
    const k = c.key as 'gv' | 'r' | 'w' | 's';
    const [dung, tong] = h[k];
    return <ODiem kieu="ti-le" so={dung} kq={kqTiLe(dung, tong)} tong={tong} tongCot={TONG[k]} nhan={c.nhan} />;
  };
  return (
    <Card className="bang-mau" title="Bảng mẫu — một Bang, kiểu cột quyết định căn; ô điểm một mẫu">
      <div className="space-y-6">
        <Bang ten="Bảng mẫu FT" cot={COT_FT} hang={HANG_FT} khoa={(h) => h.id} oCua={oFt} phuCua={phuFt}
          onHang={(h) => setMo(h.id === mo ? null : h.id)} dangMo={(h) => h.id === mo} day
          congCu={<>
            <button type="button" className="nut-loc" aria-pressed="false">Chỉ ô còn trống</button>
            <span className="flex-1" />
            <button type="button" className="btn btn-sm">Xuất</button>
          </>} />
        <Bang ten="Bảng mẫu lớp thường" cot={COT_THUONG} hang={HANG_THUONG} khoa={(h) => h.id} oCua={oThuong} />
        <Bang ten="Bảng mẫu rỗng" cot={COT_THUONG} hang={[] as HangThuong[]} khoa={(h) => h.id} oCua={oThuong}
          rong={{ tieuDe: 'Chưa có học viên', goiY: 'Thêm học viên vào lớp để nhập điểm.' }} />
      </div>
    </Card>
  );
}
