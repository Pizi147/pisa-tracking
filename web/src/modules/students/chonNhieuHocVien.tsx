import { useState } from 'react';

/** Trạng thái "Chọn nhiều học viên" của MỘT danh sách (hồ sơ lớp, Lưu trữ). `bat` = đang ở chế độ chọn; `chon` = id đã tick. */
export function useChonNhieu() {
  const [bat, setBat] = useState(false);
  const [chon, setChon] = useState<Set<number>>(new Set());
  return {
    bat, chon,
    batTat: () => { setBat((b) => !b); setChon(new Set()); },
    doi: (id: number) => setChon((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    tatCa: (ids: number[], v: boolean) => setChon(v ? new Set(ids) : new Set()),
    bo: () => { setChon(new Set()); setBat(false); },
  };
}
export type ChonNhieu = ReturnType<typeof useChonNhieu>;

/** Ô tick một học viên — vùng bấm 44 px trên điện thoại. */
export function OChon({ chon, id, ten }: { chon: ChonNhieu; id: number; ten: string }) {
  return (
    <input type="checkbox" className="h-[18px] w-[18px] shrink-0 cursor-pointer max-sm:m-[13px]" aria-label={`Chọn ${ten}`}
      checked={chon.chon.has(id)} onChange={() => chon.doi(id)} />
  );
}

/** Ô tick cả cột — chọn / bỏ chọn mọi học viên đang hiện. */
export function OChonTatCa({ chon, ids }: { chon: ChonNhieu; ids: number[] }) {
  return (
    <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer" aria-label="Chọn cả danh sách"
      checked={ids.length > 0 && ids.every((i) => chon.chon.has(i))} onChange={(e) => chon.tatCa(ids, e.target.checked)} />
  );
}

/** Thanh thao tác DÍNH ĐÁY: `3 đã chọn` · các việc · `Bỏ chọn`. Chỉ hiện khi đã chọn ít nhất một học viên. */
export function ThanhChonNhieu({ chon, viec, onViec }: {
  chon: ChonNhieu; viec: { key: string; nhan: string }[]; onViec: (key: string) => void;
}) {
  if (!chon.bat || chon.chon.size === 0) return null;
  return (
    <div role="toolbar" aria-label="Việc cho học viên đã chọn"
      className="sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 shadow-xl sm:mx-0 sm:rounded-lg sm:border"
      style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
      <b className="mr-1 text-sm tabular-nums text-slate-100">{chon.chon.size} đã chọn</b>
      {viec.map((v) => (
        <button key={v.key} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onViec(v.key)}>{v.nhan}</button>
      ))}
      <span className="flex-1" />
      <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={chon.bo}>Bỏ chọn</button>
    </div>
  );
}
