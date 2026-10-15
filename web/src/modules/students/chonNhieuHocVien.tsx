import { useState, type ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';

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

/**
 * Thanh thao tác DÍNH ĐÁY: `3 đã chọn` · các việc · `Bỏ chọn`. Chỉ hiện khi đã chọn ít nhất một học viên.
 * OV-13d: việc có thể là nút chính (`chinh`) hoặc nhạt khi không em nào làm được (`tat`); `dongTren` = một dòng trạng thái (đã lưu · Hoàn tác).
 */
export function ThanhChonNhieu({ chon, viec, onViec, dongTren }: {
  chon: ChonNhieu; viec: { key: string; nhan: string; chinh?: boolean; tat?: boolean }[]; onViec: (key: string) => void; dongTren?: ReactNode;
}) {
  if (!chon.bat || (chon.chon.size === 0 && !dongTren)) return null;
  return (
    <div role="toolbar" aria-label={t('Việc cho học viên đã chọn')}
      className="sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 shadow-xl sm:mx-0 sm:rounded-lg sm:border"
      style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
      {dongTren && <div role="status" className="flex basis-full flex-wrap items-center gap-2 text-sm">{dongTren}</div>}
      <b className="mr-1 text-sm tabular-nums text-slate-100">{t('{n} đã chọn', { n: chon.chon.size })}</b>
      {viec.map((v) => (
        <button key={v.key} type="button" className={v.chinh ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0'} disabled={v.tat}
          onClick={() => onViec(v.key)}>{v.nhan}</button>
      ))}
      <span className="flex-1" />
      <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={chon.bo}>{t('Bỏ chọn')}</button>
    </div>
  );
}
