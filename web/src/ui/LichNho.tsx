import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as PhimReact, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  addDaysIso, buocLich, chotTuan, docONgay, goiYGanDay, hienONgay, loiKhoangNgay, luoiThang, mondayOfDate, ngay, owningMonthOf, THU_NGAN, tuanLich,
  type KieuONgay, type LuatONgay,
} from '@shared/domain/index.ts';
import { useGiuFocus } from './giuFocus.ts';
import { useBamNgoai } from './useBamNgoai.ts';
import { t } from '@shared/i18n/index.ts';

/** Nhãn ô tháng (trong vòng lặp có biến `t` riêng). */
const THANG_NAM = (thang: string, nam: number) => t('Tháng {thang}/{nam}', { thang, nam });

/**
 * LỊCH TỰ VẼ (T11, YC-9, HE §9) — lõi lịch chung của `ONgay` và `WeekPicker`. Không ô lịch trình duyệt, không đọc đồng hồ
 * trình duyệt: mọi mốc "hôm nay" đến từ `homNay` (ngày nghiệp vụ).
 *
 * Vẽ qua PORTAL ra `document.body`, `position: fixed`, `z-[70]` — panel/modal cắt nội dung bằng `overflow` không cắt được nó.
 * Bám dưới `neo`, kẹp trong màn hình, thiếu chỗ phía dưới thì lật lên trên (cách đặt của `WeekPicker` cũ).
 * Esc nghe ở pha bắt + chặn lan: chỉ đóng lịch, không đóng panel đang chứa nó.
 *
 * Kiểu `ngay` · `ngay-hoac-thang` · `tuan`: lưới tháng T2 → CN. Kiểu `tuan` chọn cả hàng (giá trị Thứ Hai, hoặc Chủ nhật khi
 * `moc="cuoi"`). Kiểu `thang`: đầu là năm, thân Th1 … Th12. Ngày ngoài luật (`loiKhoangNgay`) mờ + gạch, không chọn được.
 * Bàn phím trong lưới: một ô nhận Tab (đang chọn / hôm nay), mũi tên theo `buocLich`; Enter/Space là bấm nút gốc (chọn).
 */

const THU = [...THU_NGAN.slice(1), THU_NGAN[0]];   // lưới T2 → CN
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const THANG = /^\d{4}-\d{2}$/;
const p2 = (x: number) => String(x).padStart(2, '0');
const NUT_DAU = 'btn btn-sm flex-none justify-center px-0 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]';

type ViTri = { top: number; left: number; width: number };

/** Bám dưới `neo`, kẹp trong màn hình; hết chỗ phía dưới thì lật lên trên. */
function tinhViTri(neo: HTMLElement | null, cao: number): ViTri | null {
  if (!neo) return null;
  const r = neo.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 16);
  const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
  const duoi = r.bottom + 4;
  const top = duoi + cao > window.innerHeight && r.top - cao - 4 > 8 ? r.top - cao - 4 : duoi;
  /* Màn thấp (điện thoại, ô ở giữa màn): trên dưới đều thiếu chỗ → kéo lên cho vừa đáy (đè lên ô), không tràn khỏi màn. */
  return { top: Math.max(8, Math.min(top, window.innerHeight - cao - 8)), left, width };
}

/** Cộng tháng cho (năm, tháng 1–12). */
function congThang(nam: number, thang: number, n: number): { nam: number; thang: number } {
  const k = nam * 12 + (thang - 1) + n;
  return { nam: Math.floor(k / 12), thang: (k % 12) + 1 };
}

export function LichNho({ kieu, value, homNay, luat, neo, onChon, onDong, goNgay }: {
  kieu: KieuONgay; value: string | null; homNay: string; luat: LuatONgay;
  neo: RefObject<HTMLElement>; onChon: (iso: string) => void; onDong: () => void; goNgay?: boolean;
}) {
  /* Ô khởi đầu: ngày đang chọn (tháng → ngày 1 của tháng đó), không có thì hôm nay. */
  const goc = value && NGAY.test(value) ? value : value && THANG.test(value) ? `${value}-01` : homNay;
  const [tro, setTro] = useState(goc);
  const [xem, setXem] = useState(() => ({ nam: Number(goc.slice(0, 4)), thang: Number(goc.slice(5, 7)) }));
  const [text, setText] = useState('');
  const [loiGo, setLoiGo] = useState<string | null>(null);
  const khung = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<ViTri | null>(() => tinhViTri(neo.current, 420));
  const dangGo = useRef(false);
  /* onDong của nơi gọi thường là hàm mới mỗi lần vẽ — giữ qua ref để không gỡ/gắn lại listener liên tục. */
  const dong = useRef(onDong);
  dong.current = onDong;
  const idGo = useId();
  useGiuFocus(khung);

  useLayoutEffect(() => { setViTri(tinhViTri(neo.current, khung.current?.offsetHeight ?? 420)); }, [neo, xem, loiGo]);

  useBamNgoai(true, () => dong.current(), khung, neo);
  useEffect(() => {
    /* ESC CHỈ ĐÓNG LỊCH, không đóng panel/modal chứa nó: pha bắt + chặn lan. */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      dong.current();
      neo.current?.focus();
    };
    const datLai = () => setViTri(tinhViTri(neo.current, khung.current?.offsetHeight ?? 420));
    document.addEventListener('keydown', esc, true);
    window.addEventListener('resize', datLai);
    window.addEventListener('scroll', datLai, true);
    return () => {
      document.removeEventListener('keydown', esc, true);
      window.removeEventListener('resize', datLai);
      window.removeEventListener('scroll', datLai, true);
    };
  }, [neo]);

  /* Mũi tên đổi ô → focus theo ô mới (sau khi tháng hiện đã đổi theo). */
  useEffect(() => {
    if (!dangGo.current) return;
    dangGo.current = false;
    khung.current?.querySelector<HTMLElement>(`[data-o="${tro}"]`)?.focus();
  }, [tro, xem]);

  if (!NGAY.test(goc)) return <></>;

  const laThang = kieu === 'thang';
  const giaTriO = (d: string) => (kieu === 'tuan' ? chotTuan(d, homNay, luat) : d);
  const ngoaiLuat = (gt: string) => loiKhoangNgay(gt, homNay, luat) !== null;
  const chon = (gt: string) => { if (!ngoaiLuat(gt)) onChon(gt); };
  const doiThangXem = (n: number) => setXem((x) => (laThang ? { ...x, nam: x.nam + n } : congThang(x.nam, x.thang, n)));

  /* Enter/Space không bắt ở đây: nút gốc tự bấm (onClick) — bắt thêm sẽ chọn hai lần. */
  const phimNgay = (e: PhimReact<HTMLButtonElement>, d: string) => {
    const moi = buocLich(d, e.key);
    if (!moi) return;
    e.preventDefault();
    dangGo.current = true;
    setTro(moi);
    setXem({ nam: Number(moi.slice(0, 4)), thang: Number(moi.slice(5, 7)) });
  };

  const phimThang = (e: PhimReact<HTMLButtonElement>, t: number) => {
    const buoc: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4, Home: 1 - t, End: 12 - t, PageUp: -12, PageDown: 12 };
    if (!(e.key in buoc)) return;
    e.preventDefault();
    const m = congThang(xem.nam, t, buoc[e.key]);
    dangGo.current = true;
    setTro(`${m.nam}-${p2(m.thang)}-01`);
    setXem({ nam: m.nam, thang: m.thang });
  };

  const goiY = goiYGanDay(kieu, homNay, luat);
  const chiThang = `${xem.nam}-${p2(xem.thang)}`;
  const tieuDe = laThang ? t('Chọn tháng') : kieu === 'tuan' ? t('Chọn tuần') : t('Chọn ngày');
  const tuanDangChon = kieu === 'tuan' && value && NGAY.test(value) ? mondayOfDate(value) : null;

  const thanNgay = () => {
    const hang = luoiThang(xem.nam, xem.thang);
    const trongThang = (d: string) => d.slice(0, 7) === chiThang;
    /* Ô nhận Tab: `tro` nếu nằm trong lưới đang xem, không thì ngày 1 của tháng. */
    const oTab = hang.flat().includes(tro) ? tro : `${chiThang}-01`;
    return (
      <div role="group" aria-label={t('Tháng {thang}/{nam}', { thang: xem.thang, nam: xem.nam })}>
        <div className="grid grid-cols-7 gap-0.5 mb-1 text-[12px] font-semibold text-slate-500" aria-hidden>
          {THU.map((t) => <span key={t} className="text-center">{t}</span>)}
        </div>
        <div className="space-y-0.5">
          {hang.map((h) => (
            <div key={h[0]} className={`grid grid-cols-7 gap-0.5 rounded ${tuanDangChon === h[0] ? 'bg-[color:var(--accent-soft)]' : ''}`}>
              {h.map((d) => {
                const gt = giaTriO(d);
                const tat = ngoaiLuat(gt);
                const dangChon = value === d;
                const homNayO = d === homNay;
                return (
                  <button key={d} type="button" data-o={d} tabIndex={d === oTab ? 0 : -1}
                    aria-disabled={tat || undefined} aria-pressed={dangChon} aria-current={homNayO ? 'date' : undefined}
                    aria-label={`${hienONgay(d, 'ngay')}${homNayO ? ` · ${t('hôm nay')}` : ''}`}
                    className={[
                      'min-h-[44px] sm:min-h-[32px] rounded text-center text-[13px] tabular-nums',
                      trongThang(d) ? 'text-slate-200' : 'text-slate-500',
                      homNayO ? 'font-semibold underline underline-offset-2' : '',
                      dangChon ? 'bg-[color:var(--accent-soft)] ring-1 ring-[color:var(--accent)] text-slate-100 font-semibold' : '',
                      tat ? 'cursor-not-allowed line-through opacity-40' : 'bam',
                    ].join(' ')}
                    onClick={() => chon(gt)} onKeyDown={(e) => phimNgay(e, d)}
                  >{Number(d.slice(8, 10))}</button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /*
   * UI-CON-LAI k2 (con-lai.html): kiểu `tuan` = danh sách MÃ TUẦN của tháng đang xem (tuần thuộc tháng chứa thứ Năm — `owningMonthOf`),
   * mỗi dòng "W1 SEP · 31/08"; tuần này chữ hồng nhận diện (không phải cảnh báo). ↑ ↓ đi từng tuần, qua tháng tự đổi tháng xem.
   */
  const thanTuan = () => {
    const tuan = luoiThang(xem.nam, xem.thang).map((h) => h[0]).filter((m) => owningMonthOf(m).month === xem.thang);
    const tuanNay = mondayOfDate(homNay);
    const oTab = tuan.includes(mondayOfDate(tro)) ? mondayOfDate(tro) : tuan[0];
    const phim = (e: PhimReact<HTMLButtonElement>, m: string) => {
      const n = e.key === 'ArrowDown' ? 7 : e.key === 'ArrowUp' ? -7 : 0;
      if (!n) return;
      e.preventDefault();
      const moi = addDaysIso(m, n);
      const th = owningMonthOf(moi);
      dangGo.current = true;
      setTro(moi);
      setXem({ nam: th.year, thang: th.month });
    };
    return (
      <div role="group" aria-label={t('Tháng {thang}/{nam}', { thang: xem.thang, nam: xem.nam })} className="flex flex-col gap-0.5">
        {tuan.map((m) => {
          const gt = giaTriO(m);
          const tat = ngoaiLuat(gt);
          const dangChon = tuanDangChon === m;
          const nay = m === tuanNay;
          return (
            <button key={m} type="button" data-o={m} tabIndex={m === oTab ? 0 : -1} aria-disabled={tat || undefined} aria-pressed={dangChon}
              aria-current={nay ? 'date' : undefined}
              className={[
                'flex min-h-[44px] items-center justify-between gap-2 rounded-md border px-2.5 text-left text-[13px] tabular-nums sm:min-h-[34px]',
                dangChon ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-semibold text-slate-100' : 'border-transparent text-slate-200',
                tat ? 'cursor-not-allowed line-through opacity-40' : 'bam',
              ].join(' ')}
              onClick={() => chon(gt)} onKeyDown={(e) => phim(e, m)}>
              <span>{tuanLich(m, homNay)}{nay && <span className="font-semibold text-[color:var(--hong-chu)]"> · {t('tuần này')}</span>}</span>
              <span className="text-xs text-slate-500">{ngay(m, homNay)}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const thanThang = () => {
    const thangNay = homNay.slice(0, 7);
    const troTrongNam = tro.slice(0, 4) === String(xem.nam);
    const oTab = troTrongNam ? Number(tro.slice(5, 7)) : 1;
    return (
      <div role="group" aria-label={t('Năm {nam}', { nam: xem.nam })} className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => {
          const gt = `${xem.nam}-${p2(t)}`;
          const tat = ngoaiLuat(gt);
          const dangChon = value === gt;
          return (
            <button key={t} type="button" data-o={`${gt}-01`} tabIndex={t === oTab ? 0 : -1}
              aria-disabled={tat || undefined} aria-pressed={dangChon} aria-label={THANG_NAM(p2(t), xem.nam)}
              className={[
                'min-h-[44px] sm:min-h-[34px] rounded-md border text-[13px] tabular-nums',
                dangChon ? 'bg-[color:var(--accent-soft)] border-[color:var(--accent)] text-slate-100 font-semibold' : 'text-slate-200',
                gt === thangNay ? 'underline underline-offset-2' : '',
                tat ? 'cursor-not-allowed line-through opacity-40' : 'bam',
              ].join(' ')}
              style={dangChon ? undefined : { borderColor: 'var(--line)' }}
              onClick={() => chon(gt)} onKeyDown={(e) => phimThang(e, t)}
            >Th{t}</button>
          );
        })}
      </div>
    );
  };

  return createPortal(
    <div
      ref={khung} role="dialog" aria-label={tieuDe} tabIndex={-1}
      className="fixed z-[70] surface-2 overflow-y-auto overscroll-contain rounded-lg border p-3 shadow-xl"
      style={{
        borderColor: 'var(--line-strong)', maxHeight: 'calc(100dvh - 16px)',
        top: viTri?.top ?? 0, left: viTri?.left ?? 0, width: viTri?.width ?? 'min(320px, calc(100vw - 16px))',
        visibility: viTri ? 'visible' : 'hidden',
      }}
    >
      {goNgay && (
        <div className="mb-2">
          <label className="label" htmlFor={idGo}>{t('Gõ tuần hoặc ngày')}</label>
          <input
            id={idGo} className="field tabular-nums" autoCapitalize="characters" autoComplete="off"
            placeholder={t('W4 SEP hoặc 28/09')} value={text} aria-invalid={!!loiGo || undefined}
            onChange={(e) => { setText(e.target.value); setLoiGo(null); }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const r = docONgay(text, 'tuan', homNay, luat);
              if (r.iso) onChon(r.iso); else setLoiGo(r.loi);
            }}
          />
          {loiGo && <span className="mt-1 block text-xs text-late" role="alert">{loiGo}</span>}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" className={NUT_DAU} onClick={() => doiThangXem(-1)} aria-label={laThang ? t('Năm trước') : t('Tháng trước')}><MuiTen lui /></button>
        <span className="text-[13px] font-semibold tabular-nums text-slate-200" aria-live="polite">
          {laThang ? xem.nam : t('Tháng {thang}/{nam}', { thang: xem.thang, nam: xem.nam })}
        </span>
        <button type="button" className={NUT_DAU} onClick={() => doiThangXem(1)} aria-label={laThang ? t('Năm sau') : t('Tháng sau')}><MuiTen /></button>
      </div>

      {laThang ? thanThang() : kieu === 'tuan' ? thanTuan() : thanNgay()}

      <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
        <span className="mb-0.5 w-full text-xs font-semibold text-slate-500">{t('Gần đây')}</span>
        {goiY.map((x) => (
          <button key={x.giaTri} type="button" className="btn btn-sm min-h-[44px] tabular-nums sm:min-h-0"
            aria-label={x.phu ? `${x.nhan} · ${x.phu}` : undefined} aria-pressed={value === x.giaTri}
            onClick={() => onChon(x.giaTri)}>{x.nhan}</button>
        ))}
        {kieu === 'ngay-hoac-thang' && !ngoaiLuat(chiThang) && (
          <button type="button" className="btn btn-sm min-h-[44px] tabular-nums sm:min-h-0" aria-pressed={value === chiThang}
            onClick={() => onChon(chiThang)}>{t('Chỉ tháng {thang}/{nam}', { thang: p2(xem.thang), nam: xem.nam })}</button>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Mũi tên tháng trước/sau: SVG nét 1.5 px như biểu tượng lịch — ‹ › chữ 12 px mảnh và lệch tâm. */
function MuiTen({ lui }: { lui?: boolean }) {
  return <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round"><path d={lui ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'} /></svg>;
}
