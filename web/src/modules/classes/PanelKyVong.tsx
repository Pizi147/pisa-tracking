import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { REGULAR_SKILLS, tenMonNgan, type GoiYKyVong, type RegularSkill } from '@shared/domain/index.ts';

type Em = {
  id: number; ma: string; ten: string; lopFt: string | null;
  mt0: (Record<RegularSkill, number> & { overall: number }) | null;
  goiY: GoiYKyVong | null;
  ketLuan: { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null } | null;
};
type DuLieu = { lop: { id: number; code: string; ct: string }; nguong: number; lopFt: string[]; em: Em[]; gvCu: Record<RegularSkill, string | null> };
/** Một hàng đang soạn: điền sẵn từ kết luận đã lưu, chưa có thì từ gợi ý MT0 (Đạt / Không đạt · Trung tâm · kỹ năng dưới ngưỡng). */
type Dong = { dat: boolean; nn: 'trung_tam' | 'hoc_sinh'; mon: RegularSkill[]; lyDo: string };

const dienSan = (e: Em): Dong => (e.ketLuan
  ? { dat: e.ketLuan.dat, nn: e.ketLuan.nguyenNhan ?? 'trung_tam', mon: (e.ketLuan.mon as RegularSkill[]).length ? e.ketLuan.mon as RegularSkill[] : e.goiY?.monTruot ?? [], lyDo: e.ketLuan.ghiChu ?? '' }
  : { dat: !!e.goiY?.dat, nn: 'trung_tam', mon: e.goiY?.monTruot ?? [], lyDo: '' });
const giong = (a: Dong, b: Dong) => a.dat === b.dat && (a.dat || (a.nn === b.nn && a.mon.join() === b.mon.join() && a.lyDo.trim() === b.lyDo.trim()));
const b1 = (n: number) => n.toFixed(1);
const NGAN: Record<RegularSkill, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/**
 * KỲ VỌNG ĐẦU RA · {lớp} (PR-KV, đặc tả 08/10 §3, mockup `mockup-cuoi-khoa-2-2026-10-08.html` phần 3) — em BE/ELE Lên FT. Điền sẵn theo MT0
 * (Đạt khi Overall ≥ ngưỡng); Không đạt → Trung tâm (mỗi kỹ năng một Case + Tutor 10 buổi) hoặc Học viên (Lý do bắt buộc, Case không PA).
 * Lưu một lần (`PUT /classes/:id/ky-vong`): em chưa kết luận + em đã sửa. Em thiếu MT0: "Chờ MT0", không sửa được. 1440 bảng, 375 thẻ.
 */
export function PanelKyVong({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const dt = useDienThoai();
  const { data, loading, error, reload, refreshing } = useApi<DuLieu>(`/classes/${classId}/ky-vong`, [classId]);
  const [sua, setSua] = useState<Record<number, Dong>>({});
  /* Lỗi chỉ hiện sau khi bấm Lưu; chân ghi "n em thiếu lý do" như mockup (không dùng dòng "n ô cần sửa"). */
  const lf = useLoiForm();
  const daBam = lf.daBam;
  const [busy, setBusy] = useState(false);

  const ten = data ? `Kỳ vọng đầu ra · ${data.lop.code}` : 'Kỳ vọng đầu ra';
  if (error) return <KhungPanel tieuDe={ten} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (loading || !data) return <KhungPanel tieuDe={ten} rong="toan" onDong={onClose}><Skeleton rows={6} /></KhungPanel>;

  const ct = data.lop.ct;
  const dongCua = (e: Em) => sua[e.id] ?? dienSan(e);
  const doi = (e: Em, p: Partial<Dong>) => setSua((s) => ({ ...s, [e.id]: { ...dongCua(e), ...p } }));
  const coMt0 = data.em.filter((e) => e.mt0);
  /* Gửi: em chưa kết luận (điền sẵn) + em đã kết luận mà vừa sửa khác bản đã lưu. */
  const gui = coMt0.filter((e) => !e.ketLuan || !giong(dongCua(e), dienSan(e)));
  const loiCua = (e: Em): string | null => {
    const d = dongCua(e);
    if (d.dat) return null;
    if (!d.mon.length) return 'Chọn kỹ năng';
    if (d.nn === 'hoc_sinh' && !d.lyDo.trim()) return 'Ghi lý do';
    return null;
  };
  const thieuLyDo = gui.filter((e) => loiCua(e) === 'Ghi lý do').length;
  const coLoi = gui.some((e) => loiCua(e));
  const dem = { dat: coMt0.filter((e) => dongCua(e).dat).length, khong: coMt0.filter((e) => !dongCua(e).dat).length, cho: data.em.length - coMt0.length };

  /* Khối "Lưu sẽ": đếm lại mỗi lần đổi — chỉ em sẽ gửi và chưa từng có Case. */
  const tt = gui.filter((e) => !dongCua(e).dat && dongCua(e).nn === 'trung_tam');
  const hs = gui.filter((e) => !dongCua(e).dat && dongCua(e).nn === 'hoc_sinh');
  const soCaseTt = tt.reduce((n, e) => n + dongCua(e).mon.length, 0);
  const gvTt = [...new Set(tt.flatMap((e) => dongCua(e).mon))].map((k) => `${data.gvCu[k] ?? 'chưa có GV'} (${NGAN[k]})`);

  const luu = async () => {
    lf.bam();
    if (coLoi || !gui.length) return;
    setBusy(true);
    try {
      const r: any = await api.put(`/classes/${classId}/ky-vong`, {
        dong: gui.map((e) => { const d = dongCua(e); return d.dat ? { sid: e.id, dat: true } : { sid: e.id, dat: false, nguyenNhan: d.nn, mon: d.mon, lyDo: d.nn === 'hoc_sinh' ? d.lyDo.trim() : null }; }),
      });
      invalidate('/my-work'); invalidate('/cases'); invalidate('/students');
      toast.push('ok', `Đã lưu ${r.luu} em${r.taoCase ? ` · tạo ${r.taoCase} Case` : ''}${r.boQua ? ` · ${r.boQua} em đã có Case cùng kỹ năng` : ''}`);
      setSua({}); lf.datLai();
      onDone(); reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const btn = 'btn min-h-[44px] sm:min-h-0';
  const daSuaGi = Object.keys(sua).length > 0;
  const chan = !coMt0.length ? undefined : {
    huy: null,
    dongTren: (
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 pt-2 text-xs tabular-nums text-slate-400">
        <span>Đạt <b className="text-slate-100">{dem.dat}</b> · Không đạt <b className="text-slate-100">{dem.khong}</b>{dem.cho > 0 && <> · Chờ MT0 <b className="text-slate-100">{dem.cho}</b></>}</span>
        {daBam && thieuLyDo > 0 && <span className="text-late">{thieuLyDo} em thiếu lý do</span>}
      </div>
    ),
    phu: <button type="button" className={`${btn} max-sm:hidden`} onClick={onClose} disabled={busy}>{daSuaGi ? 'Huỷ thay đổi' : 'Đóng'}</button>,
    chinh: <button type="button" className={`${btn} btn-primary`} onClick={luu} disabled={busy || refreshing || !gui.length}>{busy ? 'Đang lưu…' : `Lưu · ${gui.length} em`}</button>,
  };

  /** Overall (đỏ khi dưới ngưỡng) + L R W S; thẻ 375 đã có Overall ở đầu thẻ → `coOverall = false`. */
  const oMt0 = (e: Em, coOverall = true) => (e.mt0 ? (
    <span className="tabular-nums">
      {coOverall && <><b className={`text-[15px] ${e.mt0.overall < data.nguong ? 'text-late' : 'text-slate-100'}`}>{b1(e.mt0.overall)}</b>{' '}</>}
      <span className="text-xs text-slate-400">{REGULAR_SKILLS.map((k, i) => (
        <span key={k}>{i > 0 && ' · '}<span className={e.mt0![k] < data.nguong ? 'text-late' : ''}>{NGAN[k]} {b1(e.mt0![k])}</span></span>
      ))}</span>
    </span>
  ) : <Nhan tone="muted">Chờ MT0</Nhan>);

  const oKetQua = (e: Em) => {
    const d = dongCua(e);
    return (
      <div role="group" aria-label={`Kết quả · ${e.ten}`} className="grid grid-cols-2 gap-1.5">
        <NutChon nho chon={d.dat} onClick={() => doi(e, { dat: true })}>Đạt</NutChon>
        <NutChon nho chon={!d.dat} onClick={() => doi(e, { dat: false })}>Không đạt</NutChon>
      </div>
    );
  };
  const oNguyenNhan = (e: Em) => {
    const d = dongCua(e);
    return (
      <div role="group" aria-label={`Nguyên nhân · ${e.ten}`} className="grid grid-cols-2 gap-1.5">
        <NutChon nho chon={d.nn === 'trung_tam'} onClick={() => doi(e, { nn: 'trung_tam' })}>Trung tâm</NutChon>
        <NutChon nho chon={d.nn === 'hoc_sinh'} onClick={() => doi(e, { nn: 'hoc_sinh' })}>Học viên</NutChon>
      </div>
    );
  };
  const oKyNang = (e: Em) => {
    const d = dongCua(e);
    const loi = daBam && loiCua(e) === 'Chọn kỹ năng';
    return (
      <div>
        <div role="group" aria-label={`Kỹ năng chưa đạt · ${e.ten}`} aria-invalid={loi} className="flex flex-wrap gap-1.5">
          {REGULAR_SKILLS.map((k) => (
            <NutChon key={k} nho chon={d.mon.includes(k)} title={tenMonNgan(ct, k)}
              onClick={() => doi(e, { mon: d.mon.includes(k) ? d.mon.filter((x) => x !== k) : REGULAR_SKILLS.filter((x) => x === k || d.mon.includes(x)) })}>{NGAN[k]}</NutChon>
          ))}
        </div>
        {loi && <span role="alert" className="mt-1 block text-[12px] text-late">Chọn kỹ năng</span>}
      </div>
    );
  };
  const oLyDo = (e: Em, nhan = false) => {
    const loi = daBam && loiCua(e) === 'Ghi lý do';
    return (
      <div>
        {nhan && <label htmlFor={`ly-do-${e.id}`} className="mb-1 block text-[11.5px] font-bold text-slate-200">Lý do <span className="text-late">*</span></label>}
        <input id={`ly-do-${e.id}`} className={`field w-full ${loi ? 'border-late ring-1 ring-late/40' : ''}`} aria-label={`Lý do · ${e.ten}`} aria-invalid={loi} maxLength={2000}
          value={dongCua(e).lyDo} onChange={(ev) => doi(e, { lyDo: ev.target.value })} />
        {loi && <span role="alert" className="mt-1 block text-[12px] text-late">Ghi lý do</span>}
      </div>
    );
  };
  const tenEm = (e: Em) => (
    <span className="min-w-0">
      <span className={`block truncate font-semibold ${e.mt0 ? 'text-slate-100' : 'text-slate-400'}`}>{e.ten}</span>
      <span className="text-xs tabular-nums text-slate-500">{e.ma}</span>
    </span>
  );
  const LUOI = 'grid-cols-[minmax(170px,1.1fr)_minmax(220px,1.3fr)_176px_196px_minmax(190px,1fr)_minmax(200px,1.2fr)]';

  return (
    <KhungPanel rong="toan" onDong={onClose} tieuDe={dt ? ten : `${ten} · ${data.em.length} em`} chan={chan}>
      <p className="m-0 mt-3 text-[13px] font-semibold tabular-nums text-slate-200">
        {ct} · Đạt khi Overall MT0 ≥ {b1(data.nguong)}{!dt && data.lopFt.length > 0 && ` · lớp FT ${data.lopFt.join(', ')}`}
      </p>
      {data.em.length === 0 ? <p className="mt-3 text-sm text-slate-400">Lớp chưa có em Lên FT.</p> : dt ? (
        <div className="space-y-2 pt-3">
          {data.em.map((e) => {
            const d = dongCua(e);
            return (
              <section key={e.id} aria-label={e.ten} className="surface-2 space-y-2 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">{tenEm(e)}<span className="flex-1" />{e.mt0 ? <b className={`tabular-nums ${e.mt0.overall < data.nguong ? 'text-late' : 'text-slate-100'}`}>{b1(e.mt0.overall)}</b> : <Nhan tone="muted">Chờ MT0</Nhan>}</div>
                {e.mt0 && (
                  <>
                    {oMt0(e, false)}
                    {oKetQua(e)}
                    {!d.dat && oNguyenNhan(e)}
                    {!d.dat && oKyNang(e)}
                    {!d.dat && d.nn === 'hoc_sinh' && oLyDo(e, true)}
                  </>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div role="table" aria-label={ten} className="surface-2 mt-3 overflow-x-auto rounded-lg">
          <div role="row" className={`grid min-w-max gap-x-3 border-b px-3 py-2 text-xs font-extrabold uppercase tracking-[.06em] text-slate-500 lg:min-w-0 ${LUOI}`} style={{ borderColor: 'var(--line)' }}>
            {['Học viên', 'MT0', 'Kết quả', 'Nguyên nhân', 'Kỹ năng trượt', 'Lý do'].map((x) => <span key={x} role="columnheader">{x}</span>)}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.em.map((e) => {
              const d = dongCua(e);
              const tru = <span className="text-slate-500">—</span>;
              return (
                <div key={e.id} role="row" className={`grid min-w-max items-center gap-x-3 px-3 py-2.5 text-sm lg:min-w-0 ${LUOI}`}>
                  <span role="cell">{tenEm(e)}</span>
                  <span role="cell">{oMt0(e)}</span>
                  <span role="cell">{e.mt0 ? oKetQua(e) : tru}</span>
                  <span role="cell">{e.mt0 && !d.dat ? oNguyenNhan(e) : tru}</span>
                  <span role="cell">{e.mt0 && !d.dat ? oKyNang(e) : tru}</span>
                  <span role="cell">{e.mt0 && !d.dat && d.nn === 'hoc_sinh' ? oLyDo(e) : tru}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(tt.length > 0 || hs.length > 0) && (
        <div className="surface-2 mt-3 rounded-lg px-3 py-2.5 text-[13px]">
          <b className="text-[11.5px] uppercase tracking-[.06em] text-slate-400">Lưu sẽ</b>
          <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-slate-300">
            {tt.length > 0 && <li className="tabular-nums">Tạo {soCaseTt} Case · Tutor 10 buổi · GV cũ: {gvTt.join(', ')}{data.lopFt.length > 0 && ` · Kết quả: GVBM ${data.lopFt.join(', ')}`}</li>}
            {hs.map((e) => <li key={e.id}>{e.ten}: 1 Case, chưa có PA</li>)}
          </ul>
        </div>
      )}
    </KhungPanel>
  );
}
