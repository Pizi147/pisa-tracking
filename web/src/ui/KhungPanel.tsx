import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { taoKhoPanel } from '@shared/domain/index.ts';
import { NutLuat } from './NutLuat.tsx';
import { DongCanSua, useNoiLoi, type MucThieu } from './loiForm.tsx';
import { useGiuFocus } from './giuFocus.ts';
import { BaoOTrongNhan, coOTuNhan } from './ONgay.tsx';
import { t } from '@shared/i18n/index.ts';

/** Kho dùng chung toàn web: mở panel này thì panel đang mở phải đóng (G-8, N-4). */
export const khoPanelChung = taoKhoPanel();
/** Panel đang mở, mở sau ở cuối — Esc chỉ đóng panel cuối (panel vẽ qua portal nên không còn lồng nhau trong DOM). */
const nganPanel: string[] = [];
/** PR-EN: panel đang sửa dở (`chan.daSua`) — đổi ngôn ngữ (tải lại trang) hỏi trước khi bỏ chữ đang gõ. */
const panelDangSua = new Set<string>();
export const coPanelDangSua = () => panelDangSua.size > 0;

/**
 * OV-5a: PANEL TẠI CHỖ — cột phải trang Công việc (mockup M1 §1). Panel nằm ngay trong context này vẽ trong luồng trang (thẻ dính, cao tối đa
 * một màn), không phủ nền, không khoá cuộn, không giữ focus, không vào `khoPanelChung` (mở việc khác = nơi gọi thay nội dung). Panel mở TỪ BÊN
 * TRONG nó (hộp con, ngăn phụ) vẫn phủ như cũ — context bị đặt lại `false` trong thân. Nơi gọi đặt cột dính (`sticky`) — thẻ cao tối đa vùng nhìn của
 * `<main>` (trừ thanh trên). Điện thoại: thẻ thay chỗ danh sách, nơi gọi có "‹ Công việc".
 */
export const KhungTaiCho = createContext(false);

/**
 * KHUÔN PANEL CHUNG (PR-UX0, N-4 — mockup 15 (1)). Ngăn phải 560px (form dạng bảng `rong` = 720px), 375px toàn màn.
 * Đầu 52px MỘT dòng: tiêu đề · tên HV · lớp (mờ, cắt "…") · ✕; tab (nếu có) dính dưới đầu; ngữ cảnh ≤ 1 dòng.
 * Thân chia KHỐI (`Khoi`, tiêu đề nhỏ, luật dài vào ⓘ), nhãn TRÊN ô (`Truong`), ≤ 2 ô một hàng (`Hang2`).
 * Chân CỐ ĐỊNH: trái Huỷ / Xoá (viền đỏ), phải nút phụ + MỘT nút chính; dòng xám "n ô cần sửa ↑" trên chân (PR-N1,
 * `DongCanSua`) — chỉ truyền `conThieu` SAU khi bấm Lưu; lý do từng ô nằm dưới ô (`Truong loi`). CHỈ thân cuộn, trang sau khoá cuộn. Mở việc khác thì THAY nội dung, không
 * chồng panel (`khoPanelChung`). Không chữ dev; chữ mẫu bắt đầu "Ví dụ:".
 */
export function KhungPanel({ tieuDe, hocVien, lop, rong = 'hep', tabs, ngCanh, quayLai, chan, longTrong, z = 'z-50', dau, onDong, children }: {
  tieuDe: string; hocVien?: string | null; lop?: string | null;
  /** OV-12c — ĐẦU PANEL v3 (mockup panel v3 §1): dòng 1 tên việc 17 px + MỘT chip hạn (`ChipHan`) + ✕; dòng 2 em (link ↗) · lớp · ngữ cảnh.
   *  Có `dau` thì `hocVien` / `lop` không vẽ ở đầu một dòng cũ. */
  dau?: { han?: ReactNode; dong2: ReactNode[] };
  /** Lớp z — panel mở từ một popover `z-[60]` (hộp xếp lịch `HopKyNang`) cần nằm trên popover đó (PR-LM). */
  z?: string;
  /** Không vào `khoPanelChung`: panel con mở đè (Chuyển tiếp → Tạo lớp) không đóng panel này, state giữ nguyên.
   *  Esc chỉ đóng panel mở sau cùng (`nganPanel`) — panel dưới không cần tự chặn Esc. */
  longTrong?: boolean;
  /** `toan`: lưới nhập hàng loạt nhiều cột (Thêm học viên) — rộng theo màn tới 1440px, không ép 10 cột vào ngăn hẹp. */
  rong?: 'hep' | 'rong' | 'toan';
  tabs?: ReactNode; ngCanh?: ReactNode; quayLai?: { nhan: string; onClick: () => void };
  chan?: {
    /** `null` = không vẽ nút trái (panel tự có nút Đóng ở `chinh`, ví dụ ngăn Tổng kết lộ trình). */
    huy?: { nhan?: string; onClick: () => void; disabled?: boolean } | null; xoa?: { onClick: () => void; nhan?: string };
    phu?: ReactNode; chinh?: ReactNode; conThieu?: (string | MucThieu)[];
    /** Luật S3 (I1): form đã sửa → nút trái mặc định "Huỷ thay đổi", chưa sửa → "Đóng". `huy.nhan` riêng (Xong, ‹ Sửa…) thắng. */
    daSua?: boolean;
    /** OV-14a (F12): nơi gọi tự hỏi khi đóng (hộp nêu đúng số em bị ảnh hưởng) — khung không hỏi thêm lần nữa ở ✕ / Esc / nền. */
    tuHoi?: boolean;
    /** Một dòng riêng NGAY TRÊN hàng nút (ví dụ dòng xem trước trên điện thoại — PR-XLMT). Nơi gọi tự ẩn/hiện theo cỡ màn. */
    dongTren?: ReactNode;
    /** OV-12c — CHÂN v3: không nút trái; ≥ 640 px nút chính nằm trong khối Cần làm (nơi gọi) nên chân chỉ hiện khi có `dongTren`
     *  (trạng thái lưu); 375: dòng trạng thái trên nút chính rộng hết khung, dính đáy. */
    v3?: boolean;
  };
  onDong: () => void; children: ReactNode;
}) {
  const id = useId();
  const khung = useRef<HTMLDivElement>(null);
  const dongRef = useRef(onDong);
  dongRef.current = onDong;
  /* Hotfix 15/10 (L5): ✕ / Esc / bấm nền đi chung một đường — đang sửa dở thì hỏi trước, không mất chữ âm thầm. */
  const daSuaRef = useRef(false);
  daSuaRef.current = !!chan?.daSua && !chan?.tuHoi;
  const dong = () => { if (!daSuaRef.current || window.confirm(t('Bỏ nội dung đang gõ?'))) dongRef.current(); };
  const taiCho = useContext(KhungTaiCho);

  useEffect(() => {
    if (longTrong || taiCho) return undefined;
    khoPanelChung.mo(id, () => dongRef.current());
    return () => khoPanelChung.dong(id);
  }, [id, longTrong, taiCho]);

  useEffect(() => {
    if (taiCho) return undefined;
    const cu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = cu; };
  }, [taiCho]);

  useEffect(() => {
    if (taiCho) return undefined;   // tại chỗ: Esc chỉ khi focus trong panel (`onKeyDown` dưới)
    /* Esc chỉ đóng lớp TRÊN CÙNG: panel mở sau cùng (`nganPanel`); `Modal` mở chồng trong panel (không portal) tự đóng bằng Esc — panel đứng yên. */
    nganPanel.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && nganPanel[nganPanel.length - 1] === id
        && !khung.current?.querySelector('[aria-modal="true"]')) dong();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); nganPanel.splice(nganPanel.indexOf(id), 1); };
  }, [id, taiCho]);

  const daSua = !!chan?.daSua;
  useEffect(() => {
    if (!daSua) return undefined;
    panelDangSua.add(id);
    return () => { panelDangSua.delete(id); };
  }, [id, daSua]);

  /* OV-12e (rà #395): "← Danh sách / ← tên em / ← Case" bỏ panel đang gõ — đang sửa dở thì hỏi trước (cùng cách hỏi khi đổi ngôn ngữ), không mất chữ âm thầm. */
  const veLai = () => {
    if (daSua && !window.confirm(t('Đang sửa dở — quay lại sẽ mất phần chưa lưu. Vẫn quay lại?'))) return;
    quayLai?.onClick();
  };
  const ngu = [hocVien, lop].filter(Boolean).join(' · ');
  const huy = chan?.huy === null ? null : chan?.huy ?? { onClick: onDong };
  useGiuFocus(khung, !taiCho);
  /* `!mt-0`: panel đứng trong trang có `space-y-*` thì bị cộng margin-top 12–16 px → lệch xuống, lộ dải demo bar/đầu trang (PR-DH, DH-13).
     Vẽ qua portal ra <body>: panel mở từ ô bảng (GV chấm ở tiêu đề cột dính, hộp bốn tiêu chí trong ô điểm) không bị kẹt dưới
     lớp xếp chồng của ô, không kế thừa chữ in hoa / căn phải của ô. Sự kiện React vẫn nổi theo cây React như cũ. */
  const than = (
    <>
        {dau ? (
          <header className="flex shrink-0 flex-col gap-1.5 border-b px-4 pb-3.5 pt-4 sm:px-5" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-start gap-2.5">
              <h2 className="m-0 min-w-0 flex-1 text-[17px] font-extrabold leading-6 text-slate-100">{tieuDe}</h2>
              {dau.han}
              <button type="button" className={`btn btn-sm btn-ghost -my-1 min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px] ${taiCho ? 'max-lg:hidden' : ''}`} onClick={dong} aria-label={t('Đóng')}>✕</button>
            </div>
            <p className="m-0 flex flex-wrap items-baseline text-sm leading-snug text-slate-400">
              {dau.dong2.filter(Boolean).map((x, i) => <span key={i} className="min-w-0">{i > 0 && <span aria-hidden className="mx-1.5 text-slate-500">·</span>}{x}</span>)}
            </p>
          </header>
        ) : (
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b px-4" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 min-w-0 truncate text-sm font-extrabold text-slate-100" title={tieuDe}>{tieuDe}</h2>
          {ngu && <span className="min-w-0 flex-1 truncate text-xs text-slate-400" title={ngu}>{ngu}</span>}
          {!ngu && <span className="flex-1" />}
          {/* Tại chỗ trên điện thoại: "‹ Công việc" của nơi gọi thay ✕. */}
          <button type="button" className={`btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px] ${taiCho ? 'max-lg:hidden' : ''}`} onClick={dong} aria-label={t('Đóng')}>✕</button>
        </header>
        )}
        {quayLai && (
          <div className="shrink-0 border-b px-4 py-1.5 text-xs" style={{ borderColor: 'var(--line)' }}>
            <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={veLai}>← {quayLai.nhan}</button>
          </div>
        )}
        {tabs && <div className="shrink-0 border-b px-4" style={{ borderColor: 'var(--line)' }}>{tabs}</div>}
        {/* PR-KHUNG: pb-2 — thân cuộn bắt đầu cách dòng ngữ cảnh; không có thì ô bị cắt ngay sát chữ, trông như đè nhãn (rà LUI-a1, 375). */}
        {ngCanh && <div className="shrink-0 truncate px-4 pb-2 pt-2 text-xs text-slate-400 max-sm:whitespace-normal">{ngCanh}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {chan?.v3 && (
          /* Tại chỗ ở 375 (thẻ trong `main` cuộn): chân dính đáy, sát trên thanh điều hướng dưới — mép dính tính từ đệm `pb-20` (80 px) của `main`,
             thanh dưới cao 57 px + vùng an toàn → lùi 23 px. */
          <footer className={`flex shrink-0 flex-col gap-2 border-t px-4 pb-3.5 pt-2.5 ${chan.dongTren || chan.conThieu?.length ? '' : 'sm:hidden'} ${taiCho ? 'max-sm:sticky max-sm:bottom-[calc(env(safe-area-inset-bottom)-23px)] max-sm:z-20' : ''}`} style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren && <div className="flex min-h-6 items-center gap-2 text-[13px] text-slate-400">{chan.dongTren}</div>}
            {chan.chinh && <div className="sm:hidden [&>button]:min-h-[48px] [&>button]:w-full [&>button]:justify-center [&>button]:text-[15px] [&>button]:font-bold">{chan.chinh}</div>}
          </footer>
        )}
        {chan && !chan.v3 && (
          <footer className="shrink-0 border-t" style={{ borderColor: 'var(--line)' }}>
            {chan.conThieu?.length ? <DongCanSua muc={chan.conThieu} /> : null}
            {chan.dongTren}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              {huy && <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={huy.onClick} disabled={huy.disabled}>{huy.nhan ?? (chan.daSua ? t('Huỷ thay đổi') : t('Đóng'))}</button>}
              {chan.xoa && <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" onClick={chan.xoa.onClick}>{chan.xoa.nhan ?? t('Xoá')}</button>}
              <span className="flex-1" />
              {chan.phu}
              {chan.chinh}
            </div>
          </footer>
        )}
    </>
  );
  if (taiCho) {
    /* OV-14c: Esc từ hộp nằm trong portal (hộp nhập điểm) nổi bọt qua cây React — chỉ đóng panel khi Esc phát ra TRONG khung panel. */
    return (
      <section ref={khung} tabIndex={-1} aria-label={tieuDe} onKeyDown={(e) => { if (e.key === 'Escape' && !e.defaultPrevented && khung.current?.contains(e.target as Node) && !khung.current.querySelector('[aria-modal="true"]')) dong(); }}
        className={`card flex flex-col -outline-offset-2 lg:max-h-[calc(100dvh-8rem)] ${chan?.v3 ? 'max-sm:overflow-visible sm:overflow-hidden' : 'overflow-hidden'}`}>
        <KhungTaiCho.Provider value={false}>{than}</KhungTaiCho.Provider>
      </section>
    );
  }
  return createPortal(
    <div className={`fixed inset-0 !mt-0 ${z} flex justify-end`} role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className="absolute inset-0 bg-black/60" onClick={dong} />
      <div ref={khung} tabIndex={-1} className={`relative flex h-full w-full flex-col rounded-none border-l shadow-2xl -outline-offset-2 ${rong === 'toan' ? 'max-w-[1440px]' : rong === 'rong' ? 'sm:w-[720px]' : 'sm:w-[560px]'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        {than}
      </div>
    </div>,
    document.body,
  );
}

/** Một KHỐI trong thân panel: tiêu đề nhỏ (luật dài vào ⓘ), khối sau có vạch trên. */
export function Khoi({ tieuDe, luat, so, children }: { tieuDe: string; luat?: ReactNode; /** Số bước trong vòng tròn nhỏ trước tiêu đề (panel nhiều bước, mockup MT phần 1). */ so?: number; children: ReactNode }) {
  return (
    <section className="mt-3.5 border-t pt-3.5 first:mt-0 first:border-t-0 first:pt-3.5" style={{ borderColor: 'var(--line)' }}>
      <h3 className="mb-2.5 mt-0 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500">
        {so !== undefined && <span aria-hidden className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-doing-bg text-[11px] font-bold tabular-nums text-doing">{so}</span>}
        {tieuDe}{luat && <NutLuat>{luat}</NutLuat>}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Một TRƯỜNG: nhãn ở TRÊN ô, `*` khi bắt buộc, chữ phụ ≤ 1 dòng, `loi` chỉ khi người gọi truyền (sau khi bấm Lưu / rời ô).
 * Có `loi` → ô viền đỏ + lý do dưới ô (YC-12.5.2; người gọi đặt `aria-invalid` lên ô). `dem` = bộ đếm ký tự `8/15` bên phải.
 */
export function Truong({ nhan, batBuoc, tuyChon, thieu, phu, loi, dem, as = 'label', children }: {
  /** OV-13f: ô bắt buộc mà trống vẫn lưu được (Email) — chữ "Thiếu" cam cạnh nhãn. */
  thieu?: boolean;
  nhan: string; batBuoc?: boolean; tuyChon?: boolean; phu?: string; loi?: string | null; dem?: { co: number; can: number };
  as?: 'label' | 'div'; children: ReactNode;
}) {
  /* Ô ngày / ô chọn người bên trong báo id → nhãn `<label htmlFor>`, không bọc nút lịch (`BaoOTrongNhan`). Thẻ khung chỉ theo props. */
  const [idO, setIdO] = useState<string | null>(null);
  const Vo = as === 'div' || coOTuNhan(children) ? 'div' : 'label';
  /* `as="div"` không có ô để nhãn trỏ vào (nhóm NutChon…) → nhóm mang tên của nhãn, trình đọc màn hình đọc "Mức độ, nhóm". */
  const idNhan = useId();
  const troO = Vo === 'div' ? idO : null;
  const nhom = Vo === 'div' && !idO ? { role: 'group', 'aria-labelledby': idNhan } : {};
  const chu = <>
    <span className="min-w-0 flex-1">
      {nhan}{batBuoc && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></>}
      {tuyChon && <span className="font-normal text-slate-500"> {t('(không bắt buộc)')}</span>}
      {thieu && <span className="ml-1.5 text-xs font-bold text-late">{t('Thiếu')}</span>}
    </span>
    {dem && dem.co < dem.can && <span className="text-xs font-normal tabular-nums text-slate-500">{dem.co}/{dem.can}</span>}
  </>;
  const lopNhan = 'mb-1 flex items-baseline gap-2 text-[11.5px] font-bold text-slate-200';
  const noi = useNoiLoi(loi);
  return (
    <BaoOTrongNhan.Provider value={setIdO}>
      <Vo className="block min-w-0" {...nhom}>
        {troO ? <label htmlFor={troO} className={lopNhan}>{chu}</label> : <span id={idNhan} className={lopNhan}>{chu}</span>}
        {/* Luôn cùng một lớp bọc (`contents`, không đổi bố cục): bọc/bỏ bọc theo `loi` làm ô dựng lại → mất focus khi đang gõ. */}
        <div ref={noi.ref} className={loi ? 'contents [&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40' : 'contents'}>{children}</div>
        {phu && <span className="mt-1 block truncate text-xs text-slate-500">{phu}</span>}
        {loi && <span id={noi.id} className="mt-1 block text-xs text-late">{loi}</span>}
      </Vo>
    </BaoOTrongNhan.Provider>
  );
}

/** Hai ô một hàng khi thật ngắn: 2 cột từ sm, 1 cột dưới sm. */
export function Hang2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
