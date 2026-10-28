import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Forbidden, Info, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { fmtBand, fmtDateTime } from '../../lib/format.ts';
import { kiemBangQuyDoi, type BangQuyDoi, type LoiBangQuyDoi } from '@shared/domain/index.ts';

type PhienBan = { id: number; luc: string | null; nguoi: string | null; lyDo: string | null; khoiPhucTu: number | null; doi: Record<string, [number, number]> };
type DuLieu = { bang: BangQuyDoi; phienBan: PhienBan[]; suaDuoc: boolean; truoc?: number };
type Ky = 'listening' | 'reading';

const KY: { k: Ky; nhan: string }[] = [{ k: 'listening', nhan: 'Listening' }, { k: 'reading', nhan: 'Reading' }];
/** Hai nửa 0–20 · 21–40: màn rộng đặt cạnh nhau (bảng không dài hơn màn hình), điện thoại xếp dọc. */
const NUA = [Array.from({ length: 21 }, (_, n) => n), Array.from({ length: 20 }, (_, n) => n + 21)];
const tenPb = (id: number) => (id === 0 ? 'Bảng gốc' : `Phiên bản ${id}`);
/** "L 18" → "L 18 câu: 5.0 → 5.5". */
const chuDoi = (o: string, [cu, moi]: [number, number]) => `${o} câu: ${fmtBand(cu)} → ${fmtBand(moi)}`;

/**
 * QUẢN TRỊ › BẢNG QUY ĐỔI (BAND-QUY-DOI, chủ SP 28/10) — số câu đúng 0–40 → band Listening / Reading.
 *
 * 41 hàng số câu (không phải hàng theo mốc band): mỗi ô một số như sheet "Bang quy doi" gốc, sửa một ô không kéo theo ô khác, lỗi chỉ đúng ô.
 * Quản trị sửa trong panel (cả bảng một lần lưu, lý do tuỳ chọn) → Hoàn tác ngắn ở toast; mỗi lần lưu một phiên bản, khôi phục được bản bất kỳ.
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
  /* Lưu xong (sửa / Hoàn tác / khôi phục): web lấy lại bảng đang dùng — hộp nhập điểm xem trước band theo bản mới. */
  const daLuu = () => { invalidate('/ref/bang-quy-doi'); reload(); };
  /** Hoàn tác / khôi phục = chép phiên bản `id` thành phiên bản mới (không xoá gì). */
  const chepLai = async (id: number, tuPhienBan: number, lyDo: string) => {
    const r = await api.put<DuLieu>('/admin/bang-quy-doi', { khoiPhucTu: id, tuPhienBan, lyDo });
    daLuu();
    return r;
  };
  const xongSua = (r: DuLieu) => {
    setSua(false);
    daLuu();
    if (r.truoc === undefined || r.phienBan[0].id === r.truoc) { toast.push('info', 'Bảng không đổi — chưa lưu phiên bản mới.'); return; }
    const truoc = r.truoc;
    toast.hoanTac('Đã lưu bảng quy đổi — áp cho điểm nhập từ bây giờ', () => {
      chepLai(truoc, r.phienBan[0].id, 'Hoàn tác')
        .then(() => toast.push('ok', `Đã hoàn tác — dùng lại ${tenPb(truoc).toLowerCase()}`))
        .catch((e) => toast.push('error', (e as Error).message));
    }, { key: 'bang-quy-doi' });
  };

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Bảng quy đổi band" className="min-w-0" bodyClass="p-0"
          action={data.suaDuoc ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSua(true)}>Sửa</button> : undefined}>
          <p className="m-0 border-b px-4 py-2.5 text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
            Số câu đúng (0–40) → band. Đang dùng: <span className="text-slate-200">{tenPb(dangDung.id)}</span>
            {dangDung.luc && <> · {fmtDateTime(dangDung.luc)}{dangDung.nguoi ? ` · ${dangDung.nguoi}` : ''}</>}
          </p>
          <BangLuoi bang={data.bang} />
        </Card>

        <div className="min-w-0 space-y-4">
          <Card title="Áp dụng">
            <ul className="m-0 list-disc space-y-1.5 pl-4 text-sm text-slate-300">
              <li>Áp cho điểm L / R nhập <b className="font-semibold text-slate-100">từ lúc lưu</b>.</li>
              <li>Điểm đã nhập giữ band cũ — SOS, Case, kết quả không đổi. Sửa số câu của bài cũ thì tính theo bảng đang dùng.</li>
            </ul>
            <div className="mt-3">
              <SectionNote>
                Mốc trung bình chính thức (ielts.org): Listening 16 câu = 5 · 23 = 6 · 30 = 7 · 35 = 8; Reading Academic 15 = 5 · 23 = 6 · 30 = 7 · 35 = 8.
                Bảng thật của mỗi đề lệch khoảng ±1 câu.
              </SectionNote>
            </div>
          </Card>

          <Card title="Lịch sử phiên bản" bodyClass="p-0">
            <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
              {data.phienBan.map((pb, i) => (
                <li key={pb.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{tenPb(pb.id)}</span>
                    {i === 0 && <Info>đang dùng</Info>}
                    <span className="flex-1" />
                    {data.suaDuoc && i > 0 && (
                      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={`Khôi phục ${tenPb(pb.id).toLowerCase()}`} onClick={() => setKhoiPhuc(pb)}>Khôi phục</button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {pb.id === 0 ? 'Sheet "Bang quy doi" của trung tâm' : `${fmtDateTime(pb.luc)}${pb.nguoi ? ` · ${pb.nguoi}` : ''}`}
                  </div>
                  {pb.khoiPhucTu !== null && <div className="text-xs text-slate-400">Khôi phục {tenPb(pb.khoiPhucTu).toLowerCase()}</div>}
                  {pb.lyDo && <div className="text-xs text-slate-300">Lý do: {pb.lyDo}</div>}
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
        body={<p className="m-0 text-sm text-slate-300">Bảng này thành bảng đang dùng, áp cho điểm nhập từ bây giờ. Điểm đã nhập giữ band. Bản hiện tại vẫn còn trong lịch sử.</p>}
        onConfirm={() => {
          if (!khoiPhuc) return;
          setBusy(true);
          chepLai(khoiPhuc.id, dangDung.id, '')
            .then(() => { toast.push('ok', `Đã khôi phục ${tenPb(khoiPhuc.id).toLowerCase()}`); setKhoiPhuc(null); })
            .catch((e) => toast.push('error', (e as Error).message))
            .finally(() => setBusy(false));
        }} />
    </>
  );
}

/** Ô đổi của một phiên bản — 3 ô đầu, còn lại gộp "+n ô". */
function DsDoi({ doi }: { doi: Record<string, [number, number]> }) {
  const ds = Object.entries(doi);
  if (!ds.length) return null;
  return (
    <div className="mt-0.5 text-xs tabular-nums text-slate-400" title={ds.map(([o, v]) => chuDoi(o, v)).join('\n')}>
      {ds.slice(0, 3).map(([o, v]) => chuDoi(o, v)).join(' · ')}{ds.length > 3 ? ` · +${ds.length - 3} ô` : ''}
    </div>
  );
}

/** Bảng chỉ đọc: band lặp lại ô trên mờ đi — mắt thấy ngay số câu nào lên mốc. */
function BangLuoi({ bang }: { bang: BangQuyDoi }) {
  return (
    <div className="grid sm:grid-cols-2 sm:divide-x" style={{ borderColor: 'var(--line)' }}>
      {NUA.map((ds, i) => (
        <table key={i} className="w-full text-sm">
          <thead>
            <tr><th className="th w-20">Số câu</th>{KY.map((x) => <th key={x.k} className="th text-right">{x.nhan}</th>)}</tr>
          </thead>
          <tbody>
            {ds.map((n) => (
              <tr key={n}>
                <td className="td py-1 tabular-nums text-slate-400">{n}</td>
                {KY.map((x) => {
                  const v = bang[x.k][n];
                  return <td key={x.k} className={`td py-1 text-right tabular-nums ${n > 0 && v === bang[x.k][n - 1] ? 'text-slate-500' : 'font-medium text-slate-100'}`}>{fmtBand(v)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

const soCua = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')));

/**
 * PANEL SỬA cả bảng: 82 ô số + Lý do (tuỳ chọn). Kiểm cùng hàm máy chủ (`kiemBangQuyDoi`): đủ 0–40, band 0–9 bậc 0.5, không giảm khi số câu tăng —
 * ô sai viền đỏ, câu lỗi nói đúng ô (hiện sau khi rời ô / bấm Lưu). Ô đã đổi so với bảng đang dùng có viền vàng + chữ "trước" ở tooltip.
 */
function SuaBang({ bang, phienBan, onClose, onDone }: { bang: BangQuyDoi; phienBan: number; onClose: () => void; onDone: (r: DuLieu) => void }) {
  const toast = useToast();
  const [o, setO] = useState(() => ({ listening: bang.listening.map(String), reading: bang.reading.map(String) }));
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [daBam, setDaBam] = useState(false);
  const [daRoi, setDaRoi] = useState<ReadonlySet<string>>(new Set());
  const moi: BangQuyDoi = { listening: o.listening.map(soCua), reading: o.reading.map(soCua) };
  const loi = kiemBangQuyDoi(moi);
  const khoa = (k: Ky, n: number) => `${k}-${n}`;
  const loiO = new Map(loi.filter((l) => l.cau !== null).map((l) => [khoa(l.skill, l.cau!), l]));
  const hien = (l: LoiBangQuyDoi) => daBam || (l.cau !== null && daRoi.has(khoa(l.skill, l.cau)));
  const loiHien = loi.filter(hien);
  const soDoi = KY.reduce((s, x) => s + moi[x.k].filter((v, n) => v !== bang[x.k][n]).length, 0);
  const daSua = soDoi > 0 || o.listening.some((v, n) => v !== String(bang.listening[n])) || o.reading.some((v, n) => v !== String(bang.reading[n])) || !!lyDo.trim();

  const luu = async () => {
    setDaBam(true);
    if (loi.length || busy) {
      if (loi[0]?.cau != null) document.getElementById(`bqd-${khoa(loi[0].skill, loi[0].cau)}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      onDone(await api.put<DuLieu>('/admin/bang-quy-doi', { ...moi, lyDo: lyDo.trim() || null, tuPhienBan: phienBan }));
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa bảng quy đổi band" rong="rong" onDong={onClose}
      ngCanh={<span className="text-xs text-slate-400">Áp cho điểm nhập sau khi lưu · điểm đã nhập giữ band cũ</span>}
      chan={{
        daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: daBam && loi.length ? loi.map((l) => ({ nhan: l.loi, oId: l.cau !== null ? `bqd-${khoa(l.skill, l.cau)}` : undefined })) : undefined,
        trai: soDoi > 0 ? <span className="tabular-nums text-slate-400">{soDoi} ô đã đổi</span> : null,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="space-y-4 pt-3">
        <div className="grid gap-x-6 sm:grid-cols-2">
          {NUA.map((ds, i) => (
            <table key={i} className="w-full text-sm">
              <thead>
                <tr><th className="th w-20">Số câu</th>{KY.map((x) => <th key={x.k} className="th text-right">{x.nhan}</th>)}</tr>
              </thead>
              <tbody>
                {ds.map((n) => (
                  <tr key={n}>
                    <td className="td px-2 py-1 tabular-nums text-slate-400">{n}</td>
                    {KY.map((x) => {
                      const l = loiO.get(khoa(x.k, n));
                      const sai = !!l && hien(l);
                      const doi = !Number.isNaN(moi[x.k][n]) && moi[x.k][n] !== bang[x.k][n];
                      return (
                        <td key={x.k} className="td px-2 py-1 text-right">
                          <input id={`bqd-${khoa(x.k, n)}`} className={`field w-16 text-right tabular-nums ${doi && !sai ? 'border-amber-400/80' : ''}`}
                            inputMode="decimal" autoComplete="off" aria-label={`${x.nhan} ${n} câu`} aria-invalid={sai}
                            title={doi ? `Trước: ${fmtBand(bang[x.k][n])}` : undefined}
                            value={o[x.k][n]}
                            onBlur={() => setDaRoi((s) => (s.has(khoa(x.k, n)) ? s : new Set(s).add(khoa(x.k, n))))}
                            onChange={(e) => setO({ ...o, [x.k]: o[x.k].map((v, j) => (j === n ? e.target.value : v)) })} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        {loiHien.length > 0 && (
          <ul className="m-0 list-none space-y-1 p-0 text-xs text-late" role="alert">
            {loiHien.map((l) => <li key={`${l.skill}-${l.cau}`}>{l.loi}</li>)}
          </ul>
        )}
        <Field label="Lý do (không bắt buộc)">
          <textarea className="field w-full" rows={2} aria-label="Lý do" maxLength={500} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
            placeholder="Vd: theo bảng đề Cambridge 19" />
        </Field>
      </div>
    </KhungPanel>
  );
}
