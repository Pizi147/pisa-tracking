import { useEffect, useRef, useState } from 'react';
import { chenCau, goCau, nguonChuDaGhi, type ChuDaGhi } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * KHỐI "BẠN ĐÃ GHI" (overhaul V6 đợt 4 — mockup ⑫ A1 · A2 · A6 · B3 · B4 · E1): câu đã ghi trên web cạnh ô chữ, mỗi câu một nút "Chèn" (chỉ câu, không kèm nguồn —
 * [XM-5]). Không AI, không tự điền ô. Không có câu → không vẽ (A3). `gap` (ô đã có chữ / em đã đủ — A6): một dòng "… · n" + "Xem".
 * Dùng chung: Báo cáo PH (GD-20a) và bàn giao (GD-20b) — không dựng bản thứ hai.
 */
export function KhoiDaGhi({ nhan, ds, toiId, homNay, mon, daChen, onChen, gapDau = false, chu = '' }: {
  nhan: string; ds: readonly ChuDaGhi[]; toiId: number | null; homNay: string; mon?: string | null;
  daChen: ReadonlySet<string>; onChen: (x: ChuDaGhi) => void; gapDau?: boolean;
  /** Chữ đang có trong ô: câu đã nằm trong ô (chèn hàng loạt, chèn trước đó) cũng hiện "✓ Đã chèn" — không chèn trùng. */
  chu?: string;
}) {
  const [gap, setGap] = useState(gapDau);
  if (!ds.length) return null;
  if (gap) {
    return (
      <section className="da-ghi gap" aria-label={nhan}>
        <div className="dg-dau">{nhan} · <span className="so">{ds.length}</span></div>
        <button type="button" className="mo" aria-expanded="false" onClick={() => setGap(false)}>{t('Xem')}</button>
      </section>
    );
  }
  return (
    <section className="da-ghi" aria-label={nhan}>
      <div className="dg-dau">{nhan}</div>
      {ds.map((x, i) => {
        const n = nguonChuDaGhi(x, toiId, homNay, mon);
        const da = daChen.has(x.chu) || (!!chu && chu.includes(x.chu));
        return (
          <div key={i} className={`muc${da ? ' da-chen' : ''}`}>
            <span className="nguon" title={[n.dau, ...n.phu].join(' · ')}><b>{n.dau}</b>{n.phu.map((s) => ` · ${s}`).join('')}</span>
            {da ? <span className="dau-chen">✓ {t('Đã chèn')}</span>
              : <button type="button" className="nut-chen" aria-label={t('Chèn câu {nguon}', { nguon: [n.dau, ...n.phu].join(' · ') })} onClick={() => onChen(x)}>{t('Chèn')}</button>}
            <span className="cau">{x.chu}</span>
          </div>
        );
      })}
    </section>
  );
}

/** Dòng nhỏ dưới ô chữ: đang tải (không giữ chỗ — A4) · lỗi + Thử lại · "✓ Đã chèn câu … · Hoàn tác chèn" (10 giây — A2). Không có gì thì không vẽ. */
export function DuoiOChu({ tai, loi, onThuLai, chen, onHoanTac }: {
  tai: boolean; loi: boolean; onThuLai: () => void; chen: { dau: string } | null; onHoanTac: () => void;
}) {
  if (chen) return <div className="duoi-o" role="status"><span className="da">✓ {t('Đã chèn câu {nguon}', { nguon: chen.dau })}</span><button type="button" className="link-nho" onClick={onHoanTac}>{t('Hoàn tác chèn')}</button></div>;
  if (loi) return <div className="duoi-o" role="status"><span>⚠ {t('Không tải được chữ đã ghi')}</span><button type="button" className="link-nho" onClick={onThuLai}>{t('Thử lại')}</button></div>;
  if (tai) return <div className="duoi-o" role="status"><span>{t('Đang tải chữ đã ghi…')}</span></div>;
  return null;
}

/**
 * Chèn + Hoàn tác chèn cho MỘT ô: `datChu` ghi chữ mới (nơi gọi tự lưu như gõ; lần Hoàn tác có thêm câu vừa gỡ). Hoàn tác trong 10 giây gỡ đúng đoạn vừa chèn (`goCau`); "✓ Đã chèn" ở khối chỉ ở giao
 * diện, trong phiên (đổi em / mở lại panel thì mất — [XM-2]).
 */
export function useChen(chu: string, datChu: (chu: string, hoanTacCau?: string) => void, homNay: string, toiId: number | null, khoa?: unknown) {
  const [daChen, setDaChen] = useState<ReadonlySet<string>>(new Set());
  const [gan, setGan] = useState<{ dau: string; cau: string } | null>(null);
  const hen = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(hen.current), []);
  /* `khoa` (em đang mở ở panel không dựng lại theo em): đổi em → quên "Đã chèn" + Hoàn tác của em trước. */
  useEffect(() => { clearTimeout(hen.current); setDaChen(new Set()); setGan(null); }, [khoa]);
  const chen = (x: ChuDaGhi) => {
    datChu(chenCau(chu, x.chu));
    setDaChen((s) => new Set(s).add(x.chu));
    setGan({ dau: nguonChuDaGhi(x, toiId, homNay).dau, cau: x.chu });
    clearTimeout(hen.current);
    hen.current = setTimeout(() => setGan(null), 10_000);
  };
  const hoanTac = () => {
    if (!gan) return;
    datChu(goCau(chu, gan.cau), gan.cau);   // `hoanTacCau`: ô về rỗng mà máy chủ không nhận chữ rỗng (bàn giao) → nơi gọi gỡ câu bằng đường riêng
    setDaChen((s) => { const m = new Set(s); m.delete(gan.cau); return m; });
    setGan(null);
  };
  return { daChen, chen, gan, hoanTac };
}

/**
 * "CHÈN CHO N EM" (GD-20b, mockup ⑫ B1 · B2 · B3 · B4): chèn một lần câu đầu (`cauBanGiao`) cho mọi ô còn trống, tự lưu như gõ; dải "✓ Đã chèn n em · Hoàn tác"
 * 10 giây — Hoàn tác gỡ đúng các câu vừa chèn (ô đã sửa thì giữ). `chen` / `go`: nơi gọi lưu / gỡ một ô (bảng GVBM, panel GVCN, panel đổi GV mỗi nơi một cách lưu).
 */
export function useChenLo<T>(chen: (c: T) => Promise<unknown> | void, go: (c: T) => Promise<unknown> | void) {
  const [vua, setVua] = useState<T[] | null>(null);
  const hen = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(hen.current), []);
  const chenLo = async (ds: T[]) => {
    if (!ds.length) return;
    setVua(ds);
    clearTimeout(hen.current);
    hen.current = setTimeout(() => setVua(null), 10_000);
    await Promise.all(ds.map((c) => chen(c)));
  };
  const hoanTac = async () => {
    const ds = vua;
    if (!ds) return;
    clearTimeout(hen.current);
    setVua(null);
    await Promise.all(ds.map((c) => go(c)));
  };
  return { vua, chenLo, hoanTac };
}

/** Dải sau "Chèn cho n em": "✓ Đã chèn n em" + Hoàn tác (10 giây). */
export function DaiChenLo({ n, onHoanTac }: { n: number; onHoanTac: () => void }) {
  return (
    <div className="bao-chen" role="status">
      <b>✓ {t('Đã chèn {n} em', { n })}</b>
      <button type="button" className="link-nho" onClick={onHoanTac}>{t('Hoàn tác')}</button>
    </div>
  );
}
