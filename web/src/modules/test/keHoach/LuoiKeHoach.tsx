import { useEffect, useMemo, useRef, useState } from 'react';
import { Empty, Th } from '../../../ui/ui.tsx';
import type { KyNangKH } from '@shared/domain/index.ts';
import { ChipKyNang } from './ChipKyNang.tsx';
import { HopKyNang } from './HopKyNang.tsx';
import {
  dotCuaEm, emXongDot, nhanDot,
  type DotChon, type HangFT, type HangThuong, type KnO, type LuoiFTData, type LuoiThuongData,
} from './kieu.ts';

type Cot = { key: string; dot: DotChon; tieu: string; phu: string | null; deXuat: string | null; nhanDeXuat: string | null };
type Hop = { anchor: HTMLElement; hang: HangFT | HangThuong; cot: Cot; kyNangDau: KyNangKH | null };

const RONG_TEN = 180;

/**
 * LƯỚI DÙNG CHUNG CHO CẢ LỚP FT VÀ LỚP THƯỜNG (mockup 14 (1), (4)): hàng = học viên, cột = đợt (FT `MT1…MT5[+]`, lớp
 * thường `Giữa khoá` · `Cuối khoá` kèm `đề xuất W4/8`). Bảng `table-layout: fixed` + `colgroup` (G-2), cuộn ngang TRONG
 * thẻ, cột tên dính trái (G-11); trên điện thoại tự cuộn tới đợt đang tới (đợt nhỏ nhất còn em chưa xong). Ô = `ChipKyNang`;
 * bấm chip mở `HopKyNang` neo cạnh chip.
 */
export function LuoiKeHoach({ loai, data, onReload, onHienDien }: {
  loai: 'ft' | 'thuong'; data: LuoiFTData | LuoiThuongData; onReload: () => void; onHienDien: (open: boolean) => void;
}) {
  const [hop, setHop] = useState<Hop | null>(null);
  const cuon = useRef<HTMLDivElement>(null);

  const cots: Cot[] = useMemo(() => {
    if (loai === 'ft') {
      return (data as LuoiFTData).cot.map((n) => ({
        key: `mt${n}`, dot: { loai: 'ft', attemptNo: n } as DotChon, tieu: `MT${n}`, phu: null, deXuat: null, nhanDeXuat: null,
      }));
    }
    return (data as LuoiThuongData).cot.map((c) => ({
      key: c.kind, dot: { loai: 'thuong', kind: c.kind } as DotChon, tieu: c.nhan,
      phu: c.nhanDeXuat ? `đề xuất ${c.nhanDeXuat}` : null, deXuat: c.deXuat, nhanDeXuat: c.nhanDeXuat,
    }));
  }, [loai, data]);

  const rongDot = loai === 'ft' ? 176 : 208;
  const dotDenLuot = useMemo(() => cots.findIndex((c) => (data.hang as Array<HangFT | HangThuong>).some((h) => (
    !emXongDot(dotCuaEm(loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot))
  ))), [cots, data, loai]);

  /* 375px: mở sẵn ở đợt đang tới — MT trước đó nằm bên trái ngoài khung nhìn. */
  useEffect(() => {
    const el = cuon.current;
    if (!el || window.innerWidth >= 640 || dotDenLuot <= 0) return;
    el.scrollLeft = dotDenLuot * rongDot;
  }, [dotDenLuot, rongDot]);

  if (data.hang.length === 0) return <div className="p-3"><Empty title="Lớp này chưa có học viên đang học" /></div>;

  const khaiGiang = loai === 'thuong' ? (data as LuoiThuongData).khaiGiang : null;
  const tongTuan = loai === 'thuong' ? (data as LuoiThuongData).tongTuan : null;
  const hangs = data.hang as Array<HangFT | HangThuong>;
  const o = (h: HangFT | HangThuong, c: Cot): { attemptId: number | null; kn: KnO } => dotCuaEm(
    loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot,
  );

  return (
    <div ref={cuon} className="overflow-x-auto">
      <table className="text-sm" style={{ tableLayout: 'fixed', width: RONG_TEN + cots.length * rongDot, minWidth: '100%' }}>
        <colgroup>
          <col style={{ width: RONG_TEN }} />
          {cots.map((c) => <col key={c.key} style={{ width: rongDot }} />)}
        </colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th>
            {cots.map((c) => (
              <Th key={c.key} align="center">
                <span className="block">{c.tieu}</span>
                {c.phu && <span className="block text-[10px] font-normal normal-case tracking-normal text-slate-500">{c.phu}</span>}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hangs.map((h) => (
            <tr key={h.studentId} className="row-hover">
              <td className="td sticky-col py-1.5 align-middle">
                <div className="truncate text-slate-100" title={h.ten}>{h.ten}</div>
                <div className="text-[11px] text-slate-500">
                  {h.ma}{'vaoMuon' in h && h.vaoMuon && <span> · vào muộn</span>}
                </div>
              </td>
              {cots.map((c) => {
                const dot = o(h, c);
                return (
                  <td key={c.key} className="td py-1.5 align-middle">
                    <ChipKyNang kn={dot.kn} attemptId={dot.attemptId} loai={loai} khaiGiang={khaiGiang} tongTuan={tongTuan}
                      deXuat={c.deXuat} nhanDeXuat={c.nhanDeXuat} tenDot={nhanDot(c.dot)}
                      onMo={(skill, el) => setHop({ anchor: el, hang: h, cot: c, kyNangDau: skill })} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {hop && (() => {
        const dot = o(hop.hang, hop.cot);
        return (
          <HopKyNang key={`${hop.hang.studentId}-${hop.cot.key}`} anchor={hop.anchor}
            tieuDe={`${hop.hang.ten} · ${nhanDot(hop.cot.dot)}`} loai={loai} classId={data.classId} studentId={hop.hang.studentId}
            dot={hop.cot.dot} attemptId={dot.attemptId} kn={dot.kn} kyNangDau={hop.kyNangDau}
            deXuat={hop.cot.deXuat} khaiGiang={khaiGiang} tongTuan={tongTuan}
            onClose={() => setHop(null)} onSaved={onReload} onHienDien={onHienDien} />
        );
      })()}
    </div>
  );
}
