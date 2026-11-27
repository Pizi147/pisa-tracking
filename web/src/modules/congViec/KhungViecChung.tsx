import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { BocThanPanel } from '../../ui/KhungPanel.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { KhoiGiaoViec, dongLichSuGiao, useGiaoViec, useHn, type LoaiKhung } from './KhoiGiaoViec.tsx';
import { MucViecCon } from './MucViecCon.tsx';
import { lucVn } from './gioVn.ts';

/**
 * LPB-3 (N73 ⑤, mockup v28 L6a–L6d): KHUNG VIỆC CHUNG trên panel SẴN CÓ của việc TVV (Chốt ngày thi · Bước tiếp · KQ thi thật), Bàn giao (lớp · môn · đổi GV) và
 * việc Head (Chốt lộ trình · Xét lại · Xếp lịch MT). Dòng Công việc mang `khungViec` (máy chủ LPB-1) → `BocThan` → `KhungPanel` bọc thân panel chính:
 * khối Phụ trách · Hạn · Theo dõi trên cùng, thân panel giữ nguyên, rồi Việc con + Lịch sử giao. Panel mở ở chỗ khác (hồ sơ lớp / HV) → không bọc.
 * Bàn giao môn chưa có dòng (`id` null) → `POST /giao-viec/ban_giao_mon/mo` một lần khi mở (máy chủ kiểm quyền; lỗi → không vẽ khối, thân panel vẫn dùng được).
 */
/** Khe cuối khung: phần cuối riêng của panel (link Lịch sử của panel) nằm SAU Việc con (mockup L6a: Việc con → Lịch sử). */
const KheCuoi = createContext<((n: ReactNode) => void) | null>(null);
/** Trong khung: đưa `children` xuống khe cuối; ngoài khung (hồ sơ HV / lớp): vẽ tại chỗ như cũ. */
export function CuoiThan({ children }: { children: ReactNode }) {
  const dat = useContext(KheCuoi);
  useEffect(() => { if (!dat) return undefined; dat(children); return () => dat(null); });
  return dat ? null : <>{children}</>;
}

export type KhungCuaViec = { loai: LoaiKhung; id: number | null; lopId?: number | null; mon?: string | null };

export function BocThan({ k, children }: { k: KhungCuaViec | null; children: ReactNode }) {
  const boc = useMemo(() => (k ? (than: ReactNode) => <KhungViecChung k={k}>{than}</KhungViecChung> : null), [k]);
  return <BocThanPanel.Provider value={boc}>{children}</BocThanPanel.Provider>;
}

function KhungViecChung({ k, children }: { k: KhungCuaViec; children: ReactNode }) {
  const [idMo, setIdMo] = useState<number | null>(null);
  const [cuoi, setCuoi] = useState<ReactNode>(null);
  const canMo = k.id === null && k.loai === 'ban_giao_mon' && !!k.lopId && !!k.mon;
  useEffect(() => {
    if (!canMo) return;
    let huy = false;
    api.post<{ id: number }>('/giao-viec/ban_giao_mon/mo', { lopId: k.lopId, mon: k.mon }).then((r) => { if (!huy) setIdMo(r.id); }).catch(() => undefined);
    return () => { huy = true; };
  }, [canMo, k.lopId, k.mon]);
  const gv = useGiaoViec(k.loai, k.id ?? idMo);
  const hn = useHn();
  const g = gv.g;
  if (!g) return <KheCuoi.Provider value={null}>{children}</KheCuoi.Provider>;
  const lichSu = dongLichSuGiao(g, hn).sort((a, b) => b.luc.localeCompare(a.luc));
  const conDuoc = g.mo && (!!g.viecCon?.length || !!g.quanViecCon);
  return (
    <>
      <div className="pt-4"><KhoiGiaoViec g={g} dat={gv.dat} reload={gv.reload} onDaDoi={() => invalidate('/my-work')} /></div>
      <KheCuoi.Provider value={setCuoi}>{children}</KheCuoi.Provider>
      {(conDuoc || lichSu.length > 0 || cuoi) && (
        <div className="flex flex-col gap-4 pt-4">
          {g.mo && <MucViecCon g={g} onDoi={gv.reload} />}
          <LichSuGap so={lichSu.length}>
            <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
          </LichSuGap>
          {cuoi}
        </div>
      )}
    </>
  );
}
