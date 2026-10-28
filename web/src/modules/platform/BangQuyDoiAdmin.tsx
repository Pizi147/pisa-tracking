import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Forbidden, Skeleton } from '../../ui/ui.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { fmtBand, fmtDateTime } from '../../lib/format.ts';
import { BANG_IDP, BANG_QUY_DOI_GOC, kiemBangQuyDoi, type BangQuyDoi, type LoiTruong } from '@shared/domain/index.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';

type PhienBan = { id: number; luc: string | null; nguoi: string | null; lyDo: string | null; khoiPhucTu: number | null; doi: Record<string, [number, number]> };
type DuLieu = { bang: BangQuyDoi; phienBan: PhienBan[]; suaDuoc: boolean; truoc?: number };
type Ky = 'listening' | 'reading';

const KY: { k: Ky; nhan: string; ngan: string }[] = [{ k: 'listening', nhan: 'Listening', ngan: 'L' }, { k: 'reading', nhan: 'Reading', ngan: 'R' }];
/** Hai nửa 0–20 · 21–40: màn rộng đặt cạnh nhau, điện thoại nối thành một bảng (tiêu đề cột một lần). */
const NUA = [Array.from({ length: 21 }, (_, n) => n), Array.from({ length: 20 }, (_, n) => n + 21)];
const tenPb = (id: number) => (id === 0 ? 'Bảng gốc' : `Phiên bản ${id}`);
const chuDoi = (o: string, [cu, moi]: [number, number]) => `${o} câu: ${fmtBand(cu)} → ${fmtBand(moi)}`;
/** Ô lệch IDP: IDP có công bố và khác bảng đang xem. */
const lechIdp = (b: BangQuyDoi, k: Ky, n: number) => BANG_IDP[k][n] !== null && !Number.isNaN(b[k][n]) && BANG_IDP[k][n] !== b[k][n];
const demLech = (b: BangQuyDoi, k: Ky, bo: (n: number) => boolean = () => false) => b[k].filter((_, n) => !bo(n) && lechIdp(b, k, n)).length;
const ACCENT = 'var(--accent)';
/** Điện thoại: thẻ tràn hai mép (mockup E). */
const TRAN_MEP = 'max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0';
const CHIP_OK = `${CHIP_VUONG} border-ok-line bg-ok-bg text-ok`;
const CHIP_LECH = `${CHIP_VUONG} border-soon-line bg-soon-bg text-soon`;
const ChipIdp = ({ n, chu = 'Khớp IDP', nhan = 'IDP ' }: { n: number; chu?: string; nhan?: string }) => (n ? <span className={CHIP_LECH}>≠ {nhan}{n} ô</span> : <span className={CHIP_OK}>{chu}</span>);

/** Bảng của từng phiên bản: dựng lại từ bảng gốc + ô đổi của từng bản (máy chủ trả `doi` so với bản ngay trước) — hộp Khôi phục nêu ô sẽ đổi. */
function bangCacBan(ds: PhienBan[]): Map<number, BangQuyDoi> {
  const r = new Map<number, BangQuyDoi>();
  let b: BangQuyDoi = BANG_QUY_DOI_GOC;
  for (const pb of [...ds].reverse()) {
    b = { listening: [...b.listening], reading: [...b.reading] };
    for (const [o, [, moi]] of Object.entries(pb.doi)) { const [k, n] = o.split(' '); b[k === 'L' ? 'listening' : 'reading'][Number(n)] = moi; }
    r.set(pb.id, b);
  }
  return r;
}
const oKhac = (a: BangQuyDoi, b: BangQuyDoi) => KY.flatMap((x) => a[x.k].flatMap((v, n) => (v !== b[x.k][n] ? [`${x.ngan} ${n} câu: ${fmtBand(v)} → ${fmtBand(b[x.k][n])}`] : [])));

/**
 * QUẢN TRỊ › BẢNG QUY ĐỔI (BAND-QUY-DOI, chủ SP 28/10; mockup `thiet-ke/v7/bang-quy-doi-band.html` đã duyệt) — số câu đúng 0–40 → band L / R.
 *
 * 41 hàng số câu × Listening · IDP · Reading · IDP: mỗi ô một số như sheet gốc; cột IDP (hằng số `BANG_IDP`, chỉ đọc) tô vàng + "≠" ô lệch.
 * Quản trị sửa trong panel (cả bảng một lần Lưu) → toast Hoàn tác; mỗi lần lưu một phiên bản, Khôi phục bản bất kỳ (hộp nêu ô sẽ đổi).
 * Quản lý chỉ xem. Bảng mới áp cho điểm nhập SAU khi lưu — điểm đã nhập giữ band (máy chủ lưu band kèm điểm).
 */
export function BangQuyDoiAdmin() {
  const { data, error, loading, reload } = useApi<DuLieu>('/admin/bang-quy-doi');
  const toast = useToast();
  const [sua, setSua] = useState(false);
  const [khoiPhuc, setKhoiPhuc] = useState<PhienBan | null>(null);
  const [busy, setBusy] = useState(false);

  if (error && error.status === 403) return <Forbidden message="Phần này dành cho Quản trị hệ thống và Quản lý." />;
  if (error) return <Card title="Bảng quy đổi band"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>;
  if (loading || !data) return <Card><Skeleton rows={10} /></Card>;

  const dangDung = data.phienBan[0];
  const cacBan = bangCacBan(data.phienBan);
  const soLech = demLech(data.bang, 'listening') + demLech(data.bang, 'reading');
  /* Lưu xong (sửa / Hoàn tác / khôi phục): web lấy lại bảng đang dùng — hộp nhập điểm xem trước band theo bản mới. */
  const daLuu = () => { invalidate('/ref/bang-quy-doi'); reload(); };
  /** Hoàn tác / khôi phục = chép phiên bản `id` thành phiên bản MỚI (không xoá bản nào). */
  const chepLai = async (id: number, tuPhienBan: number, lyDo: string) => {
    const r = await api.put<DuLieu>('/admin/bang-quy-doi', { khoiPhucTu: id, tuPhienBan, lyDo });
    daLuu();
    return r;
  };
  const xongSua = (r: DuLieu) => {
    setSua(false);
    daLuu();
    if (r.truoc === undefined || r.phienBan[0].id === r.truoc) { toast.push('info', 'Bảng không đổi — không thêm phiên bản.'); return; }
    const truoc = r.truoc;
    toast.hoanTac('Đã lưu bảng quy đổi — áp cho điểm nhập từ bây giờ', () => {
      chepLai(truoc, r.phienBan[0].id, 'Hoàn tác')
        .then(() => toast.push('ok', `Đã hoàn tác — dùng lại ${tenPb(truoc).toLowerCase()}`))
        .catch((e) => toast.push('error', (e as Error).message));
    }, { key: 'bang-quy-doi' });
  };
  const sapDoi = khoiPhuc ? oKhac(data.bang, cacBan.get(khoiPhuc.id) ?? BANG_QUY_DOI_GOC) : [];

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Bảng quy đổi band" className={`min-w-0 ${TRAN_MEP}`} bodyClass="p-0"
          action={data.suaDuoc ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSua(true)}>Sửa</button> : undefined}>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b px-4 py-2.5 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)' }}>
            <span><span className="max-sm:hidden">Số câu đúng → band (số đậm = số câu đầu tiên lên band mới). </span>Đang dùng: <b className="font-semibold text-slate-100">{tenPb(dangDung.id)}</b>
              {dangDung.luc && <> · <span className="tabular-nums">{fmtDateTime(dangDung.luc)}</span>{dangDung.nguoi ? ` · ${dangDung.nguoi}` : ''}</>}</span>
            <span className="flex-1" />
            <ChipIdp n={soLech} />
          </div>
          <BangXem bang={data.bang} />
        </Card>

        <div className="grid min-w-0 gap-4">
          <Card title="Áp dụng" className={TRAN_MEP}>
            <ul className="m-0 grid list-disc gap-1.5 pl-4 text-[13px] text-slate-200">
              <li>Áp cho điểm L / R nhập <b className="font-semibold text-slate-100">từ lúc lưu</b>.</li>
              <li>Điểm đã nhập giữ band cũ — SOS, Case, kết quả không đổi.</li>
              <li>Sửa số câu đúng của một bài cũ → tính lại theo bảng đang dùng (như nhập mới).</li>
            </ul>
            <p className="m-0 mt-3 border-l-2 pl-2.5 text-xs text-slate-500" style={{ borderColor: 'var(--line-strong)' }}>
              IDP = bảng trung bình IDP công bố (tra 28/10/2026): Listening{' '}
              <a href="https://ielts.idp.com/vietnam/results/scores/listening" target="_blank" rel="noreferrer">ielts.idp.com/vietnam</a> · Academic Reading{' '}
              <a href="https://ielts.idp.com/southafrica/results/scores/reading" target="_blank" rel="noreferrer">ielts.idp.com/southafrica</a> (bảng chung mọi nước).
              Mỗi đề lệch khoảng ±1 câu. "—" = IDP không công bố.
            </p>
          </Card>

          <Card title="Lịch sử phiên bản" className={TRAN_MEP} bodyClass="p-0">
            <ul className="m-0 list-none p-0">
              {data.phienBan.map((pb, i) => (
                <li key={pb.id} className="grid gap-0.5 border-b px-4 py-2.5 text-xs text-slate-500 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    {tenPb(pb.id)}
                    {i === 0 && <span className={`${CHIP_VUONG} border-muted-line text-dim`}>đang dùng</span>}
                    <span className="flex-1" />
                    {data.suaDuoc && i > 0 && (
                      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={`Khôi phục ${tenPb(pb.id).toLowerCase()}`} onClick={() => setKhoiPhuc(pb)}>Khôi phục</button>
                    )}
                  </div>
                  <span className="tabular-nums">{pb.id === 0 ? 'Sheet "Bang quy doi" của trung tâm' : `${fmtDateTime(pb.luc)} · ${pb.nguoi ?? 'Hệ thống'}`}</span>
                  {(pb.lyDo || pb.khoiPhucTu !== null) && <span className="text-slate-200">Lý do: {pb.lyDo ?? `Khôi phục ${tenPb(pb.khoiPhucTu!).toLowerCase()}`}</span>}
                  <DsDoi doi={pb.doi} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {sua && <SuaBang key={dangDung.id} bang={data.bang} phienBan={dangDung.id} onClose={() => setSua(false)} onDone={xongSua} />}

      <ConfirmDialog open={!!khoiPhuc} onClose={() => setKhoiPhuc(null)} busy={busy} busyLabel="Đang khôi phục…"
        title={khoiPhuc ? `Khôi phục ${tenPb(khoiPhuc.id).toLowerCase()}?` : ''} confirmLabel="Khôi phục"
        body={(
          <div className="grid gap-2 text-[13px] text-slate-200">
            <p className="m-0">Bảng này thành bảng đang dùng, áp cho điểm nhập từ bây giờ. Điểm đã nhập giữ band. Bản hiện tại vẫn còn trong lịch sử.</p>
            {sapDoi.length > 0 && (
              <div className="grid max-h-[168px] gap-0.5 overflow-auto rounded-md px-2.5 py-2 text-xs tabular-nums" style={{ background: 'var(--surface-2)' }}>
                <b className="font-semibold text-slate-100">{sapDoi.length} ô sẽ đổi</b>
                {sapDoi.map((x) => <span key={x}>{x}</span>)}
              </div>
            )}
          </div>
        )}
        onConfirm={() => {
          if (!khoiPhuc) return;
          setBusy(true);
          chepLai(khoiPhuc.id, dangDung.id, `Khôi phục ${tenPb(khoiPhuc.id).toLowerCase()}`)
            .then(() => { toast.push('ok', `Đã khôi phục ${tenPb(khoiPhuc.id).toLowerCase()}`); setKhoiPhuc(null); })
            .catch((e) => toast.push('error', (e as Error).message))
            .finally(() => setBusy(false));
        }} />
    </>
  );
}

/** Ô đổi của một phiên bản — 3 ô đầu, "+n ô" mở hết tại chỗ. */
function DsDoi({ doi }: { doi: Record<string, [number, number]> }) {
  const [het, setHet] = useState(false);
  const ds = Object.entries(doi).map(([o, v]) => chuDoi(o, v));
  if (!ds.length) return null;
  return (
    <span className="tabular-nums">
      {(het ? ds : ds.slice(0, 3)).join(' · ')}
      {!het && ds.length > 3 && <> · <button type="button" className="border-0 bg-transparent p-0 text-xs underline underline-offset-2" style={{ color: ACCENT }}
        onClick={() => setHet(true)}>+{ds.length - 3} ô</button></>}
    </span>
  );
}

/**
 * Cột chung hai bảng (xem + sửa): Số câu · Listening · IDP · Reading · IDP — qua `Bang` (BANG-0): số căn GIỮA theo kiểu cột như mọi bảng
 * (mockup vẽ canh phải; PTA 28/10 chọn một nghĩa một dáng). Rộng px để hai nửa và 375 thẳng cột; cột IDP vạch phải ngăn hai kỹ năng.
 */
const COT: CotBang[] = [
  { key: 'cau', nhan: 'Số câu', kieu: 'so', rong: 60 },
  { key: 'listening', nhan: 'Listening', kieu: 'so', rong: 80 },
  { key: 'listening-idp', nhan: 'IDP', kieu: 'so', rong: 60 },
  { key: 'reading', nhan: 'Reading', kieu: 'so', rong: 80, tach: true },
  { key: 'reading-idp', nhan: 'IDP', kieu: 'so', rong: 60 },
];
const cotCua = (key: string) => COT.find((c) => c.key === key)!;
/** Ô IDP: vàng + "≠" khi lệch (không chỉ màu); "—" = IDP không công bố. */
const OIdp = ({ b, k, n, lech, lop = '' }: { b: BangQuyDoi; k: Ky; n: number; lech: boolean; lop?: string }) => (
  <OBang c={cotCua(`${k}-idp`)} className={`text-[13px] ${lech ? 'bg-soon-bg font-semibold text-soon' : 'text-slate-500'} ${lop}`}
    title={lech ? `IDP ${fmtBand(BANG_IDP[k][n])} — bảng ${fmtBand(b[k][n])}` : undefined}>
    {lech && <span aria-label="lệch IDP">≠ </span>}{BANG_IDP[k][n] === null ? '—' : fmtBand(BANG_IDP[k][n])}
  </OBang>
);

/** Bảng chỉ đọc (`Bang chat`: hàng 32 px ≥ 640): số câu đầu tiên lên band mới đậm, band lặp mờ. */
function BangXem({ bang }: { bang: BangQuyDoi }) {
  return (
    <div className="grid sm:grid-cols-2 sm:[&>*+*]:border-l" style={{ borderColor: 'var(--line)' }}>
      {NUA.map((ds, i) => (
        <Bang key={i} ten={`Bảng quy đổi band, ${ds[0]}–${ds.at(-1)} câu`} cot={COT} hang={ds} khoa={(n) => n} khung={false} the375={false} chat
          hangRieng={(n) => (
            <tr>
              <OBang c={COT[0]} className="text-sm text-slate-500">{n}</OBang>
              {KY.map((x) => [
                <OBang key={x.k} c={cotCua(x.k)} className={`text-sm ${n > 0 && bang[x.k][n] === bang[x.k][n - 1] ? 'text-slate-500' : 'font-semibold text-slate-100'}`}>{fmtBand(bang[x.k][n])}</OBang>,
                <OIdp key={`${x.k}-idp`} b={bang} k={x.k} n={n} lech={lechIdp(bang, x.k, n)} />,
              ])}
            </tr>
          )} />
      ))}
    </div>
  );
}

const soCua = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')));
/** Khoá ô (`useLoiForm`: id DOM = `o-` + khoá). */
const khoaO = (k: Ky, n: number) => `bqd-${k}-${n}`;
const idO = (k: Ky, n: number) => `o-${khoaO(k, n)}`;
/** Tới ô: `giua` (nhảy tới lỗi / ô đã đổi) cuộn ô ra giữa — tiêu đề cột dính không che; ↑ ↓ thì để trình duyệt cuộn vừa đủ. */
const focusO = (k: Ky, n: number, giua = true) => {
  const el = document.getElementById(idO(k, n));
  el?.focus({ preventScroll: giua });
  if (giua) el?.scrollIntoView({ block: 'center' });
};

/**
 * PANEL SỬA cả bảng (mockup B, C, F, G): 82 ô + cột IDP + Lý do (tuỳ chọn). Kiểm cùng hàm máy chủ (`kiemBangQuyDoi`) khi rời ô / dán / bấm Lưu —
 * ô sai viền đỏ + lý do ngắn ngay dưới ô; bấm Lưu khi còn lỗi → danh sách lỗi bấm được. Ô đã đổi: viền xanh + "•" ở số câu + "trước x.x".
 * "Áp IDP · kỹ năng (n ô)" điền số IDP (ô IDP không công bố giữ số đang có) → dòng "Đã áp … · Hoàn tác" trả đúng các ô đó. ↑ ↓ / Enter chuyển ô;
 * dán một cột từ Excel vào một ô → điền xuống. Đóng khi còn ô đổi → hộp "Bỏ n ô đã đổi?" nêu đúng ô.
 */
function SuaBang({ bang, phienBan, onClose, onDone }: { bang: BangQuyDoi; phienBan: number; onClose: () => void; onDone: (r: DuLieu) => void }) {
  const toast = useToast();
  const [o, setO] = useState(() => ({ listening: bang.listening.map(fmtBand), reading: bang.reading.map(fmtBand) }));
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const [daAp, setDaAp] = useState<{ k: Ky; cu: Map<number, string>; chu: string } | null>(null);
  const [hoiDong, setHoiDong] = useState(false);
  const moi: BangQuyDoi = { listening: o.listening.map(soCua), reading: o.reading.map(soCua) };
  const loi = kiemBangQuyDoi(moi);
  const loiO = new Map(loi.filter((l) => l.cau !== null).map((l) => [idO(l.skill, l.cau!), l]));
  /* Lỗi theo ô cho `useLoiForm` (hiện khi đã rời ô / đã bấm Lưu); lỗi cả cột (thiếu ô) chỉ có ở dữ liệu hỏng — vẫn chặn Lưu. */
  const loiTruong: LoiTruong[] = loi.map((l) => ({ khoa: l.cau !== null ? khoaO(l.skill, l.cau) : l.skill, nhan: l.loi, lyDo: l.ngan }));
  const saiO = (k: Ky, n: number) => (lf.hien(khoaO(k, n)) ? loiO.get(idO(k, n)) ?? null : null);
  const doiO = (k: Ky, n: number) => moi[k][n] !== bang[k][n];
  const dsDoi = KY.flatMap((x) => moi[x.k].flatMap((_, n) => (doiO(x.k, n) ? [{ k: x.k, n, ten: `${x.ngan} ${n} câu` }] : [])));
  const daSua = dsDoi.length > 0 || !!lyDo.trim();
  const roi = (k: Ky, n: number) => lf.roi(khoaO(k, n))();
  const datCot = (k: Ky, cot: string[]) => setO((x) => ({ ...x, [k]: cot }));

  const dong = () => { if (busy) return; if (daSua) setHoiDong(true); else onClose(); };
  const toiDoiKe = () => {
    const dang = document.activeElement?.id;
    const i = dsDoi.findIndex((d) => idO(d.k, d.n) === dang);
    const d = dsDoi[(i + 1) % dsDoi.length];
    if (d) focusO(d.k, d.n);
  };
  const apIdp = (k: Ky) => {
    const cot = o[k].map((v, n) => (BANG_IDP[k][n] === null ? v : fmtBand(BANG_IDP[k][n])));
    const ds = cot.flatMap((v, n) => (v !== o[k][n] ? [n] : []));
    setDaAp({ k, cu: new Map(ds.map((n) => [n, o[k][n]])), chu: `Đã áp IDP · ${k === 'listening' ? 'Listening' : 'Reading'}: ${ds.length} ô (${ds.map((n) => `${n}`).join(', ')} câu)` });
    datCot(k, cot);
  };
  /** Dán nhiều dòng (một cột Excel) vào ô `n` → điền xuống từ ô đó; dán một số thì để trình duyệt tự làm. */
  const dan = (k: Ky, n: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    const hang = e.clipboardData.getData('text').replace(/\r/g, '').replace(/\n+$/, '').split('\n');
    if (hang.length < 2) return;
    e.preventDefault();
    const cot = [...o[k]];
    hang.forEach((x, i) => { if (n + i <= 40) cot[n + i] = x.split('\t')[0].trim(); });
    datCot(k, cot);
    for (let i = n; i <= Math.min(40, n + hang.length - 1); i += 1) roi(k, i);
  };
  const phim = (k: Ky, n: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    const toi = e.key === 'ArrowUp' ? n - 1 : e.key === 'ArrowDown' || e.key === 'Enter' ? n + 1 : null;
    if (toi === null || toi < 0 || toi > 40) return;
    e.preventDefault();
    focusO(k, toi, false);
  };

  const luu = async () => {
    lf.bam();
    if (loi.length || busy) {
      if (loi[0]?.cau != null) focusO(loi[0].skill, loi[0].cau);
      return;
    }
    if (!dsDoi.length) { onClose(); toast.push('info', 'Bảng không đổi — không thêm phiên bản.'); return; }
    setBusy(true);
    try {
      onDone(await api.put<DuLieu>('/admin/bang-quy-doi', { ...moi, lyDo: lyDo.trim() || null, tuPhienBan: phienBan }));
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  const loiHien = lf.daBam ? loi : [];
  return (
    <KhungPanel tieuDe="Sửa bảng quy đổi band" rong="rong" onDong={dong}
      ngCanh={<span className="text-[13px] text-slate-400">Áp cho điểm nhập sau khi lưu · điểm đã nhập giữ band cũ</span>}
      chan={{
        daSua, tuHoi: true, huy: { onClick: dong, disabled: busy },
        conThieu: lf.conThieu(loiTruong),
        trai: dsDoi.length > 0 ? <button type="button" className="btn btn-sm min-h-[44px] tabular-nums sm:min-h-0" title="Tới ô đã đổi kế tiếp" onClick={toiDoiKe}>{dsDoi.length} ô đã đổi ↓</button> : null,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="grid gap-3 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
          <span>IDP:</span>
          {KY.map((x) => <span key={x.k} className="inline-flex items-center gap-1.5">{x.nhan} <ChipIdp n={demLech(moi, x.k, (n) => !!loiO.get(idO(x.k, n)))} chu="khớp" nhan="" /></span>)}
          <span className="flex-1" />
          {KY.map((x) => {
            const n = demLech(moi, x.k, (c) => !!loiO.get(idO(x.k, c)));
            return n > 0 && <button key={x.k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => apIdp(x.k)}>Áp IDP · {x.nhan} ({n} ô)</button>;
          })}
        </div>
        {daAp && (
          <div role="status" className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-md bg-ok-bg px-3 py-1.5 text-[13px] text-ok">
            <span>✓ {daAp.chu}</span><span className="flex-1" />
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { datCot(daAp.k, o[daAp.k].map((v, n) => daAp.cu.get(n) ?? v)); setDaAp(null); }}>Hoàn tác</button>
          </div>
        )}
        <p className="m-0 -mt-1 text-xs text-slate-500">Dán một cột từ Excel vào một ô → điền xuống · ↑ ↓ / Enter chuyển ô · "5,5" hay "5.5" đều được · — = IDP không công bố</p>
        {loiHien.length > 0 && (
          <ul className="m-0 grid list-none gap-0.5 rounded-md bg-bad-bg px-2 py-1.5" role="alert">
            {loiHien.map((l) => (
              <li key={`${l.skill}-${l.cau}`}>
                <button type="button" className="w-full border-0 bg-transparent px-1 py-1 text-left text-[13px] text-bad underline underline-offset-[3px]"
                  onClick={() => l.cau !== null && focusO(l.skill, l.cau)}>{l.loi}</button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-2 sm:[&>*+*]:border-l" style={{ borderColor: 'var(--line-strong)' }}>
          {NUA.map((ds, i) => (
            <Bang key={i} ten={`Sửa bảng quy đổi, ${ds[0]}–${ds.at(-1)} câu`} cot={COT} hang={ds} khoa={(n) => n} khung={false} the375={false}
              hangRieng={(n) => {
                const coDoi = KY.some((x) => doiO(x.k, n));
                return (
                  <tr>
                    <OBang c={COT[0]} className={coDoi ? 'font-semibold' : 'text-slate-500'} style={coDoi ? { color: ACCENT } : undefined}>
                      {coDoi && <span aria-label="đã đổi">• </span>}{n}
                    </OBang>
                    {KY.map((x) => {
                      const sai = saiO(x.k, n);
                      const doi = doiO(x.k, n);
                      const v = moi[x.k][n];
                      const moc = !(n > 0 && v === moi[x.k][n - 1]);
                      return [
                        <OBang key={x.k} c={cotCua(x.k)}>
                          <input id={idO(x.k, n)} className={`field h-8 w-14 px-1.5 text-center tabular-nums max-sm:h-11 ${moc ? 'font-bold' : 'text-slate-400'}`}
                            style={sai ? { borderColor: 'var(--danger)', boxShadow: 'inset 0 0 0 1px var(--danger)', background: 'rgb(var(--bad-bg-rgb))' }
                              : doi ? { borderColor: ACCENT, boxShadow: `inset 0 0 0 1px ${ACCENT}` } : undefined}
                            inputMode="decimal" autoComplete="off" aria-label={`${x.nhan} ${n} câu`} aria-invalid={!!sai}
                            aria-describedby={sai ? `${idO(x.k, n)}-ly` : undefined}
                            value={o[x.k][n]}
                            onBlur={() => roi(x.k, n)} onKeyDown={phim(x.k, n)} onPaste={dan(x.k, n)}
                            onChange={(e) => datCot(x.k, o[x.k].map((s, j) => (j === n ? e.target.value : s)))} />
                          {/* Dòng phụ của ô (Bang: hàng có dòng phụ cao 64): lý do lỗi ngắn hoặc số trước khi sửa. */}
                          {sai ? <span id={`${idO(x.k, n)}-ly`} className="bang-phu whitespace-nowrap text-bad" data-phu-odiem="" title={sai.loi}><span aria-hidden>{sai.ngan}</span><span className="sr-only">{sai.loi}</span></span>
                            : doi ? <span className="bang-phu whitespace-nowrap tabular-nums" data-phu-odiem="">trước {fmtBand(bang[x.k][n])}</span> : null}
                        </OBang>,
                        <OIdp key={`${x.k}-idp`} b={moi} k={x.k} n={n} lech={!sai && !loiO.get(idO(x.k, n)) && lechIdp(moi, x.k, n)} />,
                      ];
                    })}
                  </tr>
                );
              }} />
          ))}
        </div>
        <Field label="Lý do (không bắt buộc)">
          <textarea className="field w-full" rows={2} maxLength={500} value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Vd: theo bảng IDP" />
        </Field>
      </div>
      <ConfirmDialog open={hoiDong} onClose={() => setHoiDong(false)} onConfirm={() => { setHoiDong(false); onClose(); }} danger
        title={dsDoi.length ? `Bỏ ${dsDoi.length} ô đã đổi?` : 'Bỏ lý do đã gõ?'} closeLabel="Ở lại" confirmLabel="Bỏ thay đổi"
        body={<p className="m-0 text-[13px] text-slate-200">Bảng chưa lưu.{dsDoi.length ? <> Đóng thì bỏ: <span className="tabular-nums">{dsDoi.slice(0, 8).map((d) => d.ten).join(' · ')}{dsDoi.length > 8 ? ` · +${dsDoi.length - 8} ô` : ''}</span></> : ''}{lyDo.trim() ? ' và lý do đã gõ' : ''}.</p>} />
    </KhungPanel>
  );
}
