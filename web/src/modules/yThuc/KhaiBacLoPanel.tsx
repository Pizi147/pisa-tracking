import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BAC_0_NHAN, THANG, nhanLoaiXuLy, ngay } from '@shared/domain/index.ts';
import { dich, dichChu, t } from '@shared/i18n/index.ts';
import { CO_LO, guiTheoLo } from './LoYThucPanel.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type EmLo, type KqEm } from './kieu.ts';
import { invalidate } from '../../lib/api.ts';

/** Bậc khai được: 0 "Chưa có xử lý vi phạm" + sáu bậc mạch chính (khai tối đa WL 2). */
const BAC = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));

/**
 * KHAI / SỬA CẤP BẬC THEO LỚP — KHAI-BAC-LO (mockup `thiet-ke/v7/khai-bac-lo.html`, chủ SP duyệt 28/10): MỘT bảng mọi em (hoặc các em đã chọn),
 * "Chọn tất cả" một chạm + "Áp bậc … → Áp cho n em" (ô tick CHỈ để Áp), ô Bậc mới mỗi dòng sửa riêng được, tháng (mặc định tháng này) + ghi chú
 * chung TUỲ CHỌN, MỘT nút Lưu. Lưu theo ô Bậc mới ("— giữ nguyên —" không gửi). Sau lưu: "✓ Đã lưu n em · Hoàn tác" (cả lô), panel dùng tiếp;
 * em lỗi báo riêng dòng đó (dữ liệu mới cho thấy em đã khoá → dòng khoá kèm lý do). Quyền do máy chủ quyết (`capBac.duoc` / `lyDo`).
 */
export function KhaiBacLoPanel({ classId, lop, han, studentIds, onClose, onDone }: {
  classId: number; lop?: string | null; han?: string | null;
  /** Em đã chọn (Chọn nhiều); null = mọi em của lớp. */
  studentIds: number[] | null;
  onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<BangLo>(`/classes/${classId}/y-thuc/lo`, [classId]);
  const [tick, setTick] = useState<Set<number>>(new Set());
  const [apBac, setApBac] = useState<number | null>(null);
  const [bacMoi, setBacMoi] = useState<Record<number, number>>({});
  const [rieng, setRieng] = useState<Set<number>>(new Set());
  const [thang, setThang] = useState(homNay ? homNay.slice(0, 7) : '');
  /* Ô tháng mặc định tháng này cho em KHAI MỚI; em đã khai giữ tháng cũ trừ khi người dùng chạm ô tháng (rà KHAI-BAC-LO: không đè tháng cũ). */
  const [thangCham, setThangCham] = useState(false);
  const [kqHoanTac, setKqHoanTac] = useState<Map<number, KqEm>>(new Map());
  const [ghiChu, setGhiChu] = useState('');
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const [kq, setKq] = useState<Map<number, KqEm>>(new Map());
  /* Lô vừa lưu (em ok + bậc trước) — Hoàn tác cả lô. */
  const [loVua, setLoVua] = useState<KqEm[]>([]);
  const tatCaRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!thang && homNay) setThang(homNay.slice(0, 7)); }, [homNay]);

  const tieuDe = t('Khai / sửa cấp bậc vi phạm');
  const ds: EmLo[] = data ? (studentIds ? data.em.filter((e) => studentIds.includes(e.studentId)) : data.em) : [];
  const duoc = ds.filter((e) => e.capBac.duoc);
  const tickDuoc = duoc.filter((e) => tick.has(e.studentId)).length;
  useEffect(() => {
    if (tatCaRef.current) tatCaRef.current.indeterminate = tickDuoc > 0 && tickDuoc < duoc.length;
  });
  if (error) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-bad">{dich(error.message)}</p></KhungPanel>;
  if (!data) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><div className="pt-3"><Skeleton rows={4} /></div></KhungPanel>;

  /* Em gửi = em làm được, có ô Bậc mới khác bậc đã khai. */
  const gui = duoc.filter((e) => bacMoi[e.studentId] !== undefined && bacMoi[e.studentId] !== e.capBac.khai);
  const soKhoa = ds.length - duoc.length;
  const soOk = loVua.length;
  const soLoi = [...kq.values()].filter((x) => !x.ok).length;
  const boKq = (ids: Iterable<number>) => setKq((m) => { const n = new Map(m); for (const sid of ids) n.delete(sid); return n; });

  const doiTick = (sid: number) => setTick((s) => { const n = new Set(s); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });
  const tickHet = () => setTick(tickDuoc === duoc.length ? new Set() : new Set(duoc.map((e) => e.studentId)));
  const ap = () => {
    if (apBac === null) return;
    setBacMoi((b) => { const n = { ...b }; for (const e of duoc) if (tick.has(e.studentId)) n[e.studentId] = apBac; return n; });
    boKq(duoc.filter((e) => tick.has(e.studentId)).map((e) => e.studentId));
    setRieng((r) => { const n = new Set(r); for (const e of duoc) if (tick.has(e.studentId)) n.delete(e.studentId); return n; });
  };
  const chonRieng = (sid: number, v: string) => {
    setBacMoi((b) => { const n = { ...b }; if (v === '') delete n[sid]; else n[sid] = Number(v); return n; });
    setRieng((r) => { const n = new Set(r); if (v === '') n.delete(sid); else n.add(sid); return n; });
    boKq([sid]);
  };

  const luu = async () => {
    if (!gui.length) return;
    setBusy(true); setLoiLuu(null);
    const ids = gui.map((e) => e.studentId);
    const daGui = new Map(gui.map((e) => [e.studentId, bacMoi[e.studentId]]));
    /* Tháng từng em: bậc 0 không gắn tháng · em khai mới lấy ô tháng · em đã khai chỉ khi người dùng chạm ô tháng (không gửi = giữ tháng cũ). */
    const thangCua = (e: EmLo) => (daGui.get(e.studentId) === 0 ? null : e.capBac.khai === null || thangCham ? thang || null : undefined);
    const theoId = new Map(gui.map((e) => [e.studentId, e]));
    const okMoi: KqEm[] = [];
    setKqHoanTac(new Map());
    try {
      await guiTheoLo(ids, CO_LO['cap-bac'], (lo) => api.post<{ em: KqEm[] }>(`/classes/${classId}/y-thuc/lo/cap-bac`, {
        em: lo.map((sid) => ({ studentId: sid, bac: daGui.get(sid), thang: thangCua(theoId.get(sid)!) })), ghiChu: ghiChu.trim() || undefined,
      }), (em) => {
        okMoi.push(...em.filter((x) => x.ok));
        setKq((m) => { const n = new Map(m); for (const x of em) n.set(x.studentId, x); return n; });
        const xong = new Set(em.filter((x) => x.ok).map((x) => x.studentId));
        /* Chỉ xoá ô bậc khi vẫn đúng giá trị đã gửi — người dùng đổi lại trong lúc đang gửi thì giữ lần đổi đó. */
        setBacMoi((b) => { const n = { ...b }; for (const sid of xong) if (n[sid] === daGui.get(sid)) delete n[sid]; return n; });
        setRieng((r) => { const n = new Set(r); for (const sid of xong) n.delete(sid); return n; });
        setTick((s) => { const n = new Set(s); for (const sid of xong) n.delete(sid); return n; });
      });
    } catch (e: any) {
      setLoiLuu(e instanceof ApiError ? dich(e.message) : String(e?.message ?? e));
    } finally {
      setBusy(false);
      if (okMoi.length) { setLoVua(okMoi); onDone?.(); lamMoi(); reload(); }
    }
  };

  /* Hoàn tác cả lô: mỗi em về bậc trước — máy chủ chỉ trả khi bậc vẫn là bậc vừa lưu. */
  const hoanTac = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ em: KqEm[] }>(`/classes/${classId}/y-thuc/lo/cap-bac/hoan-tac`, {
        em: loVua.map((x) => ({ studentId: x.studentId, bac: x.bac, truoc: x.truoc ?? null })),
      });
      const hong = r.em.filter((x) => !x.ok);
      setLoVua([]); setKq(new Map()); setKqHoanTac(new Map(hong.map((x) => [x.studentId, x])));
      onDone?.(); lamMoi(); reload();
      if (hong.length) toast.push('error', t('{n} em chưa hoàn tác được — thử lại.', { n: hong.length }));
      else toast.push('ok', t('Đã hoàn tác'));
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? dich(e.message) : String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  const tomTatOk = () => {
    const dem = new Map<string, number>();
    for (const x of loVua) dem.set(x.nhan ?? '', (dem.get(x.nhan ?? '') ?? 0) + 1);
    return [...dem].map(([nhan, n]) => t('{nhan} ({n} em)', { nhan: dich(nhan), n })).join(' · ');
  };
  const nhanDoi = (e: EmLo) => {
    const moi = bacMoi[e.studentId];
    const cu = e.capBac.khai;
    const goc = cu === null ? t('Khai mới') : moi < cu ? t('↓ Hạ từ {bac}', { bac: dich(BAC[cu]) }) : t('Nâng từ {bac}', { bac: dich(BAC[cu]) });
    return rieng.has(e.studentId) ? `${goc} · ${t('sửa riêng')}` : goc;
  };
  const hienTai = (e: EmLo) => (e.capBac.khai !== null
    ? `${dich(BAC[e.capBac.khai])}${e.capBac.luc ? ` · ${t('khai {ngay}', { ngay: ngay(e.capBac.luc, homNay) })}` : ''}`
    : !e.capBac.duoc && e.bacNhan ? `${dich(e.bacNhan)} · ${t('có xử lý trên web')}` : t('Chưa khai'));

  const chonBac = (value: number | undefined | null, onChange: (v: string) => void, nhan: string, goiY: string, doi = false) => (
    <select className={`field min-h-[44px] w-full py-1 text-[13px] sm:min-h-0 ${doi ? 'border-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
      aria-label={nhan} value={value ?? ''} onChange={(ev) => onChange(ev.target.value)}>
      <option value="">{goiY}</option>
      {BAC.map((b, i) => <option key={i} value={i}>{dich(b)}</option>)}
    </select>
  );

  const COT = '[@container(min-width:600px)]:grid-cols-[56px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,13rem)_minmax(0,1fr)] [@container(min-width:600px)]:items-center';
  return (
    <KhungPanel tieuDe={tieuDe} onDong={onClose} rong="rong"
      dau={{ loai: han ? t('VIỆC') : undefined, han: han ? <ChipHan loai="xu-ly-vi-pham" han={han} /> : undefined,
        dong2: [lop ?? data.classCode, t('{n} HV', { n: ds.length }), t('bậc cao nhất em đã bị xử lý trước khi dùng web')] }}
      chan={{
        daSua: gui.length > 0,
        trai: busy ? <span role="status" className="text-[13px] text-dim">{t('Đang lưu…')}</span>
          : loiLuu ? <span role="alert" className="text-[13px] font-semibold text-bad">{loiLuu}</span>
          : <span className="text-[13px] text-dim">{gui.length ? t('{n} em đổi bậc', { n: gui.length }) : t('Chưa đổi em nào')}{soKhoa ? ` · ${t('{n} em khoá (chỉ QL sửa)', { n: soKhoa })}` : ''}</span>,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !gui.length} onClick={() => void luu()}>
          {gui.length ? t('Lưu {n} em', { n: gui.length }) : t('Lưu')}</button>,
      }}>
      <div className="-mx-4 [container-type:inline-size] sm:-mx-5">
        {soOk > 0 && (
          <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-ok-bg px-4 py-2.5 text-[13px] font-semibold text-ok border-ok-line sm:px-5">
            <span>✓ {t('Đã lưu {n} em: {tom}', { n: soOk, tom: tomTatOk() })}</span>
            <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] font-semibold appearance-none sm:min-h-0" disabled={busy} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
            {soLoi > 0 && <span className="font-normal text-dim">{t('{n} em chưa lưu — xem dòng đỏ', { n: soLoi })}</span>}
          </div>
        )}
        <div className="surface-2 grid gap-2.5 border-b px-4 py-3 text-[13px] sm:px-5" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-semibold sm:min-h-0">
              <input ref={tatCaRef} type="checkbox" className="h-4 w-4" checked={duoc.length > 0 && tickDuoc === duoc.length} disabled={!duoc.length} onChange={tickHet} />
              {t('Chọn tất cả ({n})', { n: duoc.length })}
            </label>
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{t('Áp bậc')}</span>
              <span className="w-[11rem] max-w-full">{chonBac(apBac, (v) => setApBac(v === '' ? null : Number(v)), t('Bậc áp cho các em đã tick'), t('Chọn bậc…'))}</span>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={apBac === null || !tickDuoc} onClick={ap}>{t('Áp cho {n} em', { n: tickDuoc })}</button>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2">{t('Tháng')}
              <ONgay kieu="thang" value={thang} onChange={(v) => { setThang(v); setThangCham(true); }} toiDa={homNay ? homNay.slice(0, 7) : null} ariaLabel={t('Tháng xử lý')} gon />
            </span>
            <label className="flex min-w-0 flex-[1_1_8rem] items-center gap-2">
              <span className="max-sm:sr-only">{t('Ghi chú')}</span>
              <input className="field min-h-[44px] min-w-0 flex-1 py-1 text-[13px] sm:min-h-0" value={ghiChu} maxLength={500}
                onChange={(e) => setGhiChu(e.target.value)} placeholder={t('Ghi chú (tuỳ chọn)')} aria-label={t('Ghi chú chung')} />
            </label>
          </div>
        </div>
        <div className={`hidden gap-x-2.5 border-b px-4 py-2 text-[12px] font-semibold text-dim sm:px-5 [@container(min-width:600px)]:grid ${COT}`} aria-hidden style={{ borderColor: 'var(--line)' }}>
          <span>{t('Áp cho')}</span><span>{t('Học viên')}</span><span>{t('Bậc hiện tại')}</span><span>{t('Bậc mới')}</span><span />
        </div>
        <ul className="m-0 list-none p-0">
          {ds.map((e) => {
            const khoa = !e.capBac.duoc;
            const k = kq.get(e.studentId);
            const kh = kqHoanTac.get(e.studentId);
            const doi = bacMoi[e.studentId] !== undefined && bacMoi[e.studentId] !== e.capBac.khai;
            const vuaLuu = loVua.some((x) => x.studentId === e.studentId) && !doi;
            const ha = doi && e.capBac.khai !== null && bacMoi[e.studentId] < e.capBac.khai;
            const ghi = khoa ? <span className="text-[12px] text-faint">{e.capBac.lyDo ? dichChu(e.capBac.lyDo) : t('chỉ QL sửa')}</span>
              : kh?.loi ? <span role="alert" className="text-[12px] font-semibold text-bad">{t('Chưa hoàn tác: {loi}', { loi: dichChu(kh.loi) })}</span>
              : k && !k.ok && k.loi ? <span role="alert" className="text-[12px] font-semibold text-bad">{t('Chưa lưu: {loi}', { loi: dichChu(k.loi) })}</span>
              : doi ? <span className={`text-[12px] font-semibold ${ha ? 'text-soon' : 'text-[color:var(--accent)]'}`}>{nhanDoi(e)}</span>
              : vuaLuu ? <span className="text-[12px] font-semibold text-ok">✓ {t('Đã lưu')}</span> : null;
            return (
              <li key={e.studentId} className={`grid grid-cols-[36px_minmax(0,1fr)] gap-x-2.5 gap-y-1 border-b px-4 py-2.5 sm:px-5 ${COT} ${tick.has(e.studentId) && !khoa ? 'bg-[color:var(--accent-soft)]' : ''}`}
                style={{ borderColor: 'var(--line)' }}>
                <span className="row-span-4 pt-0.5 [@container(min-width:600px)]:row-span-1 [@container(min-width:600px)]:pt-0">
                  {!khoa && (
                    /* Vùng bấm 44 px (cả nhãn bọc ô tick), ô 16 px như mockup. */
                    <label className="-m-3.5 inline-flex h-11 w-11 cursor-pointer items-center justify-center sm:m-0 sm:h-auto sm:w-auto">
                      <input type="checkbox" className="h-4 w-4 cursor-pointer" checked={tick.has(e.studentId)}
                        onChange={() => doiTick(e.studentId)} aria-label={t('Áp cho {ten}', { ten: e.ten })} />
                    </label>
                  )}
                </span>
                <span className={`truncate text-sm font-semibold ${khoa ? 'text-faint' : 'text-slate-100'}`}>{e.ten}</span>
                <span className="text-[13px] text-dim">
                  <span className="text-faint [@container(min-width:600px)]:sr-only">{t('Hiện tại')}: </span>{hienTai(e)}
                </span>
                <span className={`min-w-0 ${khoa ? 'max-[599px]:hidden' : ''}`}>
                  {khoa ? <span className="hidden text-faint [@container(min-width:600px)]:inline">—</span>
                    : chonBac(bacMoi[e.studentId], (v) => chonRieng(e.studentId, v), t('Bậc mới của {ten}', { ten: e.ten }), t('— giữ nguyên —'), doi)}
                </span>
                <span className="min-w-0">{ghi}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </KhungPanel>
  );
}
