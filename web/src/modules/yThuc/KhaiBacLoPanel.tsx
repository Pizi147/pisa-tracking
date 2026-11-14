import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { IconKhoa } from '../../ui/BieuTuong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BAC_0_NHAN, THANG, dsLoi, nhanLoaiXuLy, ngay, quyCheKhaiBac } from '@shared/domain/index.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';
import { CO_LO, guiTheoLo } from './LoYThucPanel.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type EmLo, type KqEm } from './kieu.ts';
import { invalidate } from '../../lib/api.ts';

/** Bậc khai được: 0 "Chưa có xử lý vi phạm" + sáu bậc mạch chính (khai tối đa WL 2). */
const BAC = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));
/** MOCKUP-1111 màn 2: tên ngắn trên chip (tên đủ ở `title`). */
const NGAN_BAC = [t('Không'), 'R1', 'R2', 'WL1', 'R4', 'R5', 'WL2'];
export const nganBac = (b: number) => NGAN_BAC[b] ?? dich(BAC[b] ?? '');

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
  const [loc, setLoc] = useState<'tat' | 'chua' | 'co'>('tat');
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
  const lf = useLoiForm();
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
  const chonRieng = (sid: number, v: string) => {
    setBacMoi((b) => { const n = { ...b }; if (v === '') delete n[sid]; else n[sid] = Number(v); return n; });
    setRieng((r) => { const n = new Set(r); if (v === '') n.delete(sid); else n.add(sid); return n; });
    boKq([sid]);
  };

  /* Luật N1: bấm Lưu khi chưa đổi em nào → báo còn thiếu "Bậc mới" (không tắt nút im lặng). */
  const loi = dsLoi([{ khoa: 'bac', nhan: t('Bậc mới'), chon: true }], { bac: gui.length ? 'co' : '' });
  const luu = async () => {
    lf.bam();
    if (loi.length) return;
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
  /* Mockup: khoá một dòng ngay chỗ chọn — "Nhờ QL sửa" (có xử lý trên web) / "Chỉ QL sửa" (đã khai); lý do đủ ở `title`. */
  const lyDoKhoa = (e: EmLo) => (e.capBac.lyDo ? dichChu(e.capBac.lyDo) : t('chỉ QL sửa'));
  const ngan = nganBac;
  /** Hiện tại MỘT dòng: bậc · nguồn ngắn; đang đổi em đã có bậc → "R2 → R1 ↓". Chưa khai mà đổi → giữ "Chưa khai" (chip nền đặc đã nói). */
  const hienTai = (e: EmLo, doi: boolean) => {
    const cu = e.capBac.khai;
    if (doi && cu !== null) return `${ngan(cu)} → ${ngan(bacMoi[e.studentId])}${bacMoi[e.studentId] < cu ? ' ↓' : ''}`;
    return cu !== null ? `${ngan(cu)}${e.capBac.luc ? ` · ${t('khai {ngay}', { ngay: ngay(e.capBac.luc, homNay) })}` : ''}`
      : e.bacNhan ? `${dich(e.bacNhan)} · ${t('trên web')}` : t('Chưa khai');
  };
  const coXuLy = (e: EmLo) => e.capBac.khai !== null || !!e.bacNhan;
  const dsLoc = loc === 'chua' ? ds.filter((e) => !coXuLy(e)) : loc === 'co' ? ds.filter(coXuLy) : ds;
  const duocLoc = dsLoc.filter((e) => e.capBac.duoc);
  const tickLoc = duocLoc.filter((e) => tick.has(e.studentId)).length;
  /* "Đặt bậc": bấm chip là áp ngay cho các em đã tick (bỏ bước "Áp cho n em"); thanh không giữ chip sáng — bấm lại không đè em đã sửa riêng. */
  const datBac = (b: number) => {
    const ids = duoc.filter((e) => tick.has(e.studentId)).map((e) => e.studentId);
    setBacMoi((m) => { const n = { ...m }; for (const sid of ids) n[sid] = b; return n; });
    setRieng((r) => { const n = new Set(r); for (const sid of ids) n.delete(sid); return n; });
    boKq(ids);
  };
  const chonMot = (e: EmLo, b: number) => chonRieng(e.studentId, bacMoi[e.studentId] === b ? '' : String(b));
  const chiaBac = [...gui.reduce((m, e) => m.set(bacMoi[e.studentId], (m.get(bacMoi[e.studentId]) ?? 0) + 1), new Map<number, number>())]
    .sort((a, b) => a[0] - b[0]).map(([b, n]) => `${n} ${ngan(b)}`).join(' · ');
  const soHa = gui.filter((e) => e.capBac.khai !== null && bacMoi[e.studentId] < e.capBac.khai).length;
  const nutLoc = (k: typeof loc, nhan: string, n: number) => (
    <button type="button" aria-pressed={loc === k} onClick={() => setLoc(k)}
      className={`inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap border-0 px-3 text-[13px] sm:min-h-[32px] ${loc === k ? 'bg-[color:var(--accent-soft)] font-bold text-slate-100 shadow-[inset_0_-2px_0_var(--accent)]' : 'bg-transparent font-medium text-dim'}`}>
      {nhan} <span className="text-xs tabular-nums text-faint">{n}</span>
    </button>
  );

  const COT = '[@container(min-width:600px)]:grid-cols-[28px_minmax(0,1fr)_150px_316px] [@container(min-width:600px)]:items-center';
  return (
    <KhungPanel tieuDe={tieuDe} onDong={onClose} rong="rong" quyChe={quyCheKhaiBac()}
      dau={{ loai: han ? t('Việc') : undefined, han: han ? <ChipHan loai="xu-ly-vi-pham" han={han} /> : undefined,
        dong2: [lop ?? data.classCode, t('{n} HV', { n: ds.length }),
          <NutLuat key="luat" label={t('Bậc khai là gì')}>{t('Bậc cao nhất em đã bị xử lý trước khi dùng web. R = Report · WL = thư cảnh cáo · R4 = Report 4 + Meeting CX/GĐCN.')}</NutLuat>] }}
      chan={{
        daSua: gui.length > 0,
        conThieu: lf.conThieu(loi),
        trai: busy ? <span role="status" className="text-[13px] text-dim">{t('Đang lưu…')}</span>
          : loiLuu ? <span role="alert" className="text-[13px] font-semibold text-bad">{loiLuu}</span>
          : gui.length ? (
            <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-dim">
              <b className="font-semibold text-slate-100">{t('Đổi {n} em', { n: gui.length })}</b><span>{chiaBac}</span>
              {soHa > 0 && <span className="font-semibold text-soon">· {t('{n} em hạ bậc', { n: soHa })}</span>}
            </span>
          ) : <span className="text-[13px] text-dim">{t('Chưa đổi em nào')}{soKhoa ? ` · ${t('{n} em khoá (chỉ QL sửa)', { n: soKhoa })}` : ''}</span>,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>
            {gui.length ? t('Lưu · {n} em', { n: gui.length }) : t('Lưu')}</button>
        ),
      }}>
      <div className="-mx-4 [container-type:inline-size] sm:-mx-5">
        {soOk > 0 && (
          <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-ok-bg px-4 py-2.5 text-[13px] font-semibold text-ok border-ok-line sm:px-5">
            <span>✓ {t('Đã lưu {n} em: {tom}', { n: soOk, tom: tomTatOk() })}</span>
            <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] font-semibold underline underline-offset-2 appearance-none sm:min-h-0" disabled={busy} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
            {soLoi > 0 && <span className="font-normal text-bad">{t('{n} em chưa lưu', { n: soLoi })}</span>}
          </div>
        )}
        {/* Tháng + ghi chú chung — một hàng đầu panel (375: nhãn cột 96 px thẳng hàng). */}
        <div className="surface-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 text-[13px] sm:px-5" style={{ borderColor: 'var(--line)' }}>
          <span className="grid grid-cols-[96px_auto] items-center font-semibold text-dim max-sm:w-full sm:inline-flex sm:gap-2">{t('Tháng xử lý')}
            <ONgay kieu="thang" value={thang} onChange={(v) => { setThang(v); setThangCham(true); }} toiDa={homNay ? homNay.slice(0, 7) : null} ariaLabel={t('Tháng xử lý')} gon />
          </span>
          <label className="grid min-w-0 flex-[1_1_14rem] grid-cols-[96px_minmax(0,1fr)] items-center font-semibold text-dim sm:flex sm:gap-2">
            <span>{t('Ghi chú chung')}</span>
            <input className="field min-h-[44px] min-w-0 flex-1 py-1 text-[13px] font-normal sm:min-h-0" value={ghiChu} maxLength={500}
              onChange={(e) => setGhiChu(e.target.value)} placeholder={t('Tuỳ chọn')} aria-label={t('Ghi chú chung')} />
          </label>
        </div>
        {/* Hàng công cụ (ngoài tiêu đề cột — G9): chưa tick → Chọn tất cả + lọc; có tick → "n em đã chọn · Đặt bậc [chip]". */}
        {tickDuoc > 0 ? (
          <div className="group/dong flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-[color:var(--accent-soft)] px-4 py-2.5 sm:px-5" style={{ borderColor: 'var(--accent)' }}>
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold sm:min-h-0">
              <input ref={tatCaRef} type="checkbox" className="h-4 w-4" checked onChange={() => setTick(new Set())} aria-label={t('Bỏ chọn')} />
              {t('{n} em đã chọn', { n: tickDuoc })}
            </label>
            <span className="text-[13px] font-semibold text-dim">{t('Đặt bậc')}</span>
            <span className="max-sm:w-full">{<ChipBac chon={undefined} cu={null} onPick={datBac} nhan={t('Đặt bậc cho các em đã chọn')} />}</span>
            <button type="button" className="link ml-auto min-h-[44px] border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setTick(new Set())}>{t('Bỏ chọn')}</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 sm:px-5" style={{ borderColor: 'var(--line)' }}>
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold sm:min-h-0">
              <input ref={tatCaRef} type="checkbox" className="h-4 w-4" checked={false} disabled={!duocLoc.length}
                onChange={() => setTick(new Set(duocLoc.map((e) => e.studentId)))} />
              {loc === 'tat' ? t('Chọn tất cả') : t('Chọn {n} em đang lọc', { n: duocLoc.length })}
            </label>
            <span role="group" aria-label={t('Lọc')} className="ml-auto inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
              {nutLoc('tat', t('Tất cả'), ds.length)}{nutLoc('chua', t('Chưa khai'), ds.filter((e) => !coXuLy(e)).length)}{nutLoc('co', t('Đã có xử lý'), ds.filter(coXuLy).length)}
            </span>
          </div>
        )}
        <div className={`hidden gap-x-2.5 border-b px-4 py-2 text-[12px] font-semibold text-dim sm:px-5 [@container(min-width:600px)]:grid ${COT}`} aria-hidden style={{ borderColor: 'var(--line)' }}>
          <span /><span>{t('Học viên')}</span><span>{t('Hiện tại')}</span><span>{t('Bậc khai')}</span>
        </div>
        <ul className="m-0 list-none p-0">
          {dsLoc.map((e) => {
            const khoa = !e.capBac.duoc;
            const k = kq.get(e.studentId);
            const kh = kqHoanTac.get(e.studentId);
            const doi = bacMoi[e.studentId] !== undefined && bacMoi[e.studentId] !== e.capBac.khai;
            const vuaLuu = loVua.some((x) => x.studentId === e.studentId) && !doi;
            const ha = doi && e.capBac.khai !== null && bacMoi[e.studentId] < e.capBac.khai;
            const loiDong = kh?.loi ? t('Chưa hoàn tác: {loi}', { loi: dichChu(kh.loi) }) : k && !k.ok && k.loi ? t('Chưa lưu: {loi}', { loi: dichChu(k.loi) }) : null;
            const chuHt = loiDong ?? (vuaLuu ? '✓' : hienTai(e, doi));
            return (
              <li key={e.studentId} className={`group/dong grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 border-b px-4 py-2.5 sm:px-5 [@container(min-width:600px)]:h-11 [@container(min-width:600px)]:py-0 ${COT} ${tick.has(e.studentId) && !khoa ? 'bg-[color:var(--accent-soft)]' : ''}`}
                style={{ borderColor: 'var(--line)' }}>
                <span className="flex">
                  {!khoa && (
                    /* Vùng bấm 44 px (cả nhãn bọc ô tick), ô 16 px như mockup. */
                    <label className="-m-3.5 inline-flex h-11 w-11 cursor-pointer items-center justify-center sm:m-0 sm:h-auto sm:w-auto">
                      <input type="checkbox" className="h-4 w-4 cursor-pointer" checked={tick.has(e.studentId)}
                        onChange={() => doiTick(e.studentId)} aria-label={t('Chọn {ten}', { ten: e.ten })} />
                    </label>
                  )}
                </span>
                <span className={`truncate text-[15px] font-semibold ${khoa ? 'font-medium text-dim' : 'text-slate-100'}`}>{e.ten}</span>
                <span role={loiDong ? 'alert' : undefined} title={chuHt}
                  className={`truncate text-[13px] ${loiDong ? 'font-semibold text-bad' : vuaLuu ? 'font-semibold text-ok' : ha ? 'font-semibold text-soon' : doi ? 'font-semibold text-[color:var(--accent)]' : e.capBac.khai === null && !e.bacNhan ? 'text-faint' : 'text-dim'}`}>
                  {loiDong ? `⚠ ${chuHt}` : chuHt}
                </span>
                <span className="col-span-3 min-w-0 [@container(min-width:600px)]:col-span-1">
                  {khoa ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-faint" title={lyDoKhoa(e)}>
                      <IconKhoa />{/QL/.test(lyDoKhoa(e)) && /nhờ/i.test(lyDoKhoa(e)) ? t('Nhờ QL sửa') : t('Chỉ QL sửa')}
                    </span>
                  ) : <ChipBac chon={bacMoi[e.studentId]} cu={vuaLuu ? (loVua.find((x) => x.studentId === e.studentId)?.bac ?? e.capBac.khai) : e.capBac.khai} onPick={(b) => chonMot(e, b)} nhan={t('Bậc khai của {ten}', { ten: e.ten })} />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </KhungPanel>
  );
}

/** Hàng 7 chip một bấm (MOCKUP-1111 màn 2): chưa chọn = chữ (viền khi rê / focus dòng, 375 luôn viền mảnh) · bậc đang có = nền nhạt · vừa chọn = nền đặc.
 *  Bấm lại chip đang chọn = bỏ đổi. Tên đủ ở `title` + tên đọc màn. */
export function ChipBac({ chon, cu, onPick, nhan, lon = false }: { chon: number | undefined | null; cu: number | null; onPick: (b: number) => void; nhan: string; lon?: boolean }) {
  return (
    <span role="group" aria-label={nhan} className={`grid grid-cols-[1.25fr_repeat(6,minmax(0,1fr))] gap-1.5 sm:inline-flex sm:gap-1 ${lon ? 'sm:gap-1.5' : ''}`}>
      {BAC.map((b, i) => {
        const dang = chon === i;
        return (
          <button key={i} type="button" aria-pressed={dang} title={dich(b)} aria-label={dich(b)} onClick={() => onPick(i)}
            className={`min-h-[44px] rounded-md border px-1.5 text-[13px] font-semibold tabular-nums transition-colors sm:min-w-[38px] ${lon ? 'sm:h-9 sm:min-w-[44px] sm:px-2.5 sm:text-sm' : 'sm:h-[30px] sm:min-h-0'} ${
              dang ? 'btn-primary'   /* nền đặc = nút chính (token `--nut-chinh-*`) */
                : cu === i ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                : `border-[color:var(--line)] text-slate-300 hover:border-[color:var(--accent)] ${lon ? '' : 'sm:border-transparent sm:group-hover/dong:border-[color:var(--line-strong)] sm:group-focus-within/dong:border-[color:var(--line-strong)]'}`}`}>
            {nganBac(i)}
          </button>
        );
      })}
    </span>
  );
}
