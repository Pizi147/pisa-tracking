import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../../lib/api.ts';
import { useBaoDangSua } from '../../ui/KhungPanel.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * CASE-PA-UI — THÀNH PHẦN DÙNG CHUNG của tuyến Case – Phương án – Kết quả PA (mockup `thiet-ke/v16/case-pa.html`, ghi chú mục 7–8, chủ SP duyệt 06/11 #1040).
 * Một mẫu cho mọi nơi: giá trị sửa được = ô khung nhẹ có dấu (▾ chọn · bút gõ) — bấm chính giá trị đang thấy để sửa; giá trị không sửa = chữ thường;
 * nút xoá viền đỏ nhỏ; xoá xong dải "Đã xoá … · Hoàn tác" ngay chỗ cũ (Thùng rác N28); lý do chặn cạnh nút (ⓘ lý do đủ).
 */

const IC_BUT = <svg className="ic-sd" viewBox="0 0 16 16" aria-hidden><path d="M10.5 2.5l3 3L6 13H3v-3z" /></svg>;
const IC_MUI = <svg className="ic-sd" viewBox="0 0 16 16" aria-hidden><path d="M4 6l4 4 4-4" /></svg>;

/** Giờ:phút của lần lưu ("14:02") — chân panel và dòng dưới ô cùng chữ. */
export const gioLuu = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/**
 * Trạng thái lưu tại chỗ của panel Case — ô tự lưu báo lên để chân panel nói "Đang lưu… / ✓ Đã lưu 14:02 / ⚠ Chưa lưu được" (mockup `pn-chan .trai`).
 * Không có nơi nghe (khối Case trong cột hồ sơ HV) thì bỏ qua.
 */
export type TtLuuCase = { tt: 'dang' | 'da' | 'loi'; luc?: string };
export const BaoLuuCase = createContext<(x: TtLuuCase) => void>(() => {});

/**
 * GIÁ TRỊ SỬA ĐƯỢC TẠI CHỖ (`.sd`): `kieu` 'chon' (▾, mở hộp chọn) · 'go' (bút, ô ngắn) · 'chu' (bút, đoạn dài — rộng hết hàng). Không `sua` → chữ thường (không bút,
 * không ▾). Tên trường cho trình đọc màn đứng trước giá trị ("Sửa người phụ trách: Nguyễn Khánh Vy").
 */
export function GiaTriSua({ kieu, nhan, sua = true, mo = false, tieu = false, onClick, children }: {
  kieu: 'chon' | 'go' | 'chu'; nhan: string; sua?: boolean; mo?: boolean;
  /** Tên Case ở đầu panel: chữ 17 / 700, khung chỉ hiện khi rê. */
  tieu?: boolean;
  onClick: () => void; children: ReactNode;
}) {
  if (!sua) return <span className="min-w-0">{children}</span>;
  return (
    <button type="button" className={`sd ${kieu === 'chu' ? 'chu' : ''} ${tieu ? 'tieu' : ''} ${mo ? 'mo-o' : ''}`} onClick={onClick}
      aria-haspopup={kieu === 'chon' ? 'listbox' : undefined} aria-expanded={kieu === 'chon' ? mo : undefined}>
      <span className="sr-only">{nhan}: </span>
      <span className="min-w-0">{children}</span>
      {kieu === 'chon' ? IC_MUI : IC_BUT}
    </button>
  );
}

/**
 * Ô GÕ TỰ LƯU (v16 b1 · b2 · k1 · k1b, [XM4]): lưu khi ngừng gõ ~1 giây hoặc rời ô, chỉ khi chữ khác bản đã lưu (không nhân câu theo phím gõ). Chưa đủ luật (ngắn /
 * quá trần N35 / `chan`) → KHÔNG lưu, báo tại ô, chữ giữ. Lỗi lưu → chữ giữ, "⚠ Chưa lưu được … · Thử lại". Esc = bỏ thay đổi chưa lưu. Rời ô khi đã lưu → đóng ô
 * (`onDong`). Chữ chưa lưu báo panel (`useBaoDangSua`) — đóng panel / đổi việc hỏi "Bỏ chữ?" như mọi form.
 */
export function OGoTuLuu({ dau, toiThieu, toiDa, nhan, mot = false, placeholder, chan = null, goiY, luu, onDong }: {
  dau: string; toiThieu: number; toiDa: number; nhan: string;
  /** Ô một dòng (Enter = lưu + đóng). */
  mot?: boolean; placeholder?: string;
  /** Lý do chưa lưu được nằm NGOÀI ô (vd "Chọn Nguyên nhân để lưu") — hết lý do thì tự lưu chữ đang chờ. */
  chan?: string | null;
  /** Dòng gợi ý khi chưa có gì để báo (vd "việc của bạn · hạn 16/09"). */
  goiY?: ReactNode;
  luu: (v: string) => Promise<unknown>; onDong: () => void;
}) {
  const bao = useContext(BaoLuuCase);
  const [v, setV] = useState(dau);
  const daLuu = useRef(dau.trim());
  const [tt, setTt] = useState<'go' | 'dang' | 'da' | 'loi'>('go');
  const [loi, setLoi] = useState<string | null>(null);
  const [luc, setLuc] = useState<string | null>(null);
  const dang = useRef(false);
  const khung = useRef<HTMLDivElement>(null);
  const o = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const n = v.trim().length;
  const ngan = n < toiThieu;
  const dai = n > toiDa;
  const chuaLuu = v.trim() !== daLuu.current;
  useBaoDangSua(chuaLuu);
  useEffect(() => { const el = o.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, []);

  /** Gửi bản đang gõ; `true` = máy chủ đã có đúng chữ này. */
  const gui = async (): Promise<boolean> => {
    const x = v.trim();
    if (x === daLuu.current) return true;
    if (ngan || dai || chan || dang.current) return false;
    dang.current = true; setTt('dang'); setLoi(null); bao({ tt: 'dang' });
    try {
      await luu(x);
      daLuu.current = x;
      const g = gioLuu();
      setTt('da'); setLuc(g); bao({ tt: 'da', luc: g });
      return true;
    } catch (e: any) {
      setTt('loi'); setLoi(e?.message ?? t('Không lưu được')); bao({ tt: 'loi' });
      return false;
    } finally { dang.current = false; }
  };
  useEffect(() => {
    if (!chuaLuu || tt === 'loi') return undefined;
    const h = setTimeout(() => { void gui(); }, 1000);
    return () => clearTimeout(h);
  }, [v, chan]);   // eslint-disable-line react-hooks/exhaustive-deps
  const roi = async (e: React.FocusEvent) => {
    if (khung.current?.contains(e.relatedTarget as Node | null)) return;   // bấm "Thử lại" trong ô
    if (await gui()) onDong();
  };
  const ban = () => { setV(daLuu.current); onDong(); };
  const lopO = 'field w-full';
  const coLoi = dai || tt === 'loi';
  return (
    <div ref={khung} className={`o-mo ${coLoi ? 'loi' : ''}`}>
      {mot ? (
        <input ref={o} className={lopO} aria-label={nhan} value={v} placeholder={placeholder} onChange={(e) => { setV(e.target.value); if (tt === 'loi') setTt('go'); }}
          onBlur={(e) => void roi(e)} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); ban(); } else if (e.key === 'Enter') { e.preventDefault(); void gui().then((ok) => ok && onDong()); } }} />
      ) : (
        <textarea ref={o} className={lopO} rows={3} aria-label={nhan} value={v} placeholder={placeholder} onChange={(e) => { setV(e.target.value); if (tt === 'loi') setTt('go'); }}
          onBlur={(e) => void roi(e)} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); ban(); } }} />
      )}
      <div className="duoi-o" aria-live="polite">
        {tt === 'dang' ? <span className="tt-luu dang">{t('Đang lưu…')}</span>
          : tt === 'loi' ? <><span className="tt-luu loi">⚠ {t('Chưa lưu được — {loi}. Chữ vẫn giữ.', { loi: loi ?? '' })}</span>
            <button type="button" className="link-nho" onClick={() => void gui()}>{t('Thử lại')}</button></>
          : dai ? <span className="tt-luu loi">⚠ {t('Dài quá {toiDa} — rút bớt {n} ký tự để lưu', { toiDa, n: n - toiDa })}</span>
          : chuaLuu && n > 0 && ngan ? <span className="tt-luu nhap">{t('Cần ít nhất {n} ký tự để lưu', { n: toiThieu })}</span>
          : chuaLuu && chan ? <span className="tt-luu nhap">{chan}</span>
          : tt === 'da' && !chuaLuu ? <span className="tt-luu da">✓ {t('Đã lưu {luc}', { luc: luc ?? '' })}</span>
          : <span>{goiY ?? t('Tự lưu khi ngừng gõ')}</span>}
        <span className="max-sm:hidden">{t('Esc: bỏ thay đổi')}</span>
        <span className={`dem-chu ${dai ? 'qua' : n > toiDa * 0.9 ? 'gan' : ''}`}>{n} / {toiDa}</span>
      </div>
    </div>
  );
}

/** NÚT XOÁ (chủ SP 06/11): nhỏ, viền 1 px đỏ, chữ đỏ, nền trong — "Xoá Case", "Xoá PA", "Đề nghị QL xoá…", "Xoá kết quả". */
export function NutXoa({ children, onClick, busy = false, title }: { children: ReactNode; onClick: () => void; busy?: boolean; title?: string }) {
  return <button type="button" className="nut-xoa" disabled={busy} title={title} onClick={onClick}>{busy ? t('Đang xoá…') : children}</button>;
}

/**
 * DẢI "ĐÃ XOÁ … · Hoàn tác" (v16 f2 · f4): thay đúng chỗ thứ vừa xoá, 10 giây rồi gọn đi (`onHet`); Thùng rác vẫn giữ (khôi phục được 30 ngày, N28).
 * Hoàn tác = `POST /thung-rac/:id/khoi-phuc` (máy chủ kiểm quyền, như toast cũ).
 */
export function DaiDaXoa({ chu, thungRacId, onKhoiPhuc, onHet, phu }: {
  chu: ReactNode; thungRacId: number | null | undefined; onKhoiPhuc: () => void; onHet: () => void; phu?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { const h = setTimeout(onHet, 10_000); return () => clearTimeout(h); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  const hoanTac = async () => {
    setBusy(true); setLoi(null);
    try { await api.post(`/thung-rac/${thungRacId}/khoi-phuc`); onKhoiPhuc(); } catch (e: any) { setLoi(e?.message ?? t('Chưa hoàn tác được — thử lại.')); setBusy(false); }
  };
  return (
    <div className="da-xoa" role="status">
      <span>{chu}</span>
      <span className="nho">{t('vào Thùng rác')}</span>
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
      {thungRacId ? <button type="button" className="link-nho" disabled={busy} onClick={() => void hoanTac()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button> : null}
      {phu && <span className="basis-full text-[13px] text-faint">{phu}</span>}
    </div>
  );
}

/**
 * NÚT BỊ CHẶN + LÝ DO NGAY CẠNH (v16 h1 · k2, thay dòng khoá đỏ): nút mờ (`aria-describedby` tới lý do ngắn) · ⓘ mở lý do đủ (+ "Tới PA ↑").
 * `chiTiet` cùng hàm tính lý do với máy chủ (`closeBlockers`) — không viết luật lần hai.
 */
export function LyDoChan({ nut, ngan, chiTiet, id }: { nut: string; ngan: string; chiTiet?: ReactNode; id: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled aria-describedby={id}>{nut}</button>
      <span className="ly-do" id={id}>{ngan}{chiTiet ? <NutLuat label={t('Vì sao chưa {x} được', { x: nut.toLocaleLowerCase('vi') })}>{chiTiet}</NutLuat> : null}</span>
    </span>
  );
}

/** "✓ Đã đổi · Hoàn tác" cạnh giá trị vừa đổi (v16 c2) — Hoàn tác 10 giây, gọi đường đảo của nơi gọi. */
export function DaDoi({ chu, hoanTac, onXong }: { chu: string; hoanTac?: () => Promise<unknown>; onXong: () => void }) {
  const [con, setCon] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { const h = setTimeout(() => setCon(false), 10_000); return () => clearTimeout(h); }, []);
  const bam = async () => {
    setBusy(true); setLoi(null);
    try { await hoanTac!(); onXong(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <span className="dai-hoan" role="status">✓ {chu}
      {con && hoanTac && <button type="button" className="link-nho" disabled={busy} onClick={() => void bam()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button>}
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
    </span>
  );
}
