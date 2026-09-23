import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, invalidate } from '../../../lib/api.ts';
import { useSession } from '../../../lib/session.tsx';
import { addDaysStr } from '../../../lib/format.ts';
import { WeekPicker, resolveWeek } from '../../../ui/Filters.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import {
  gomBaiXemTruoc, mondayOfDate, nhanTuanKhoa, tuanLich, type BaiXemTruoc, type DongHangLoat, type KyNangKH, type OKyNang,
} from '@shared/domain/index.ts';
import { KY, TEN_KY_NANG, chuKyNang, thanDot, type DotChon, type KnO } from './kieu.ts';

type Dong = { tick: boolean; periodId: number | null };

/**
 * HỘP KỸ NĂNG (mockup 14 (1), Q19) — hộp nhỏ NEO CẠNH chip vừa bấm (portal, `position: fixed`, kẹp trong màn); 375px thì
 * là tấm dưới đáy rộng hết màn. Bốn dòng `ô tích · L Listening · tuần`, mỗi dòng đổi tuần riêng:
 *   · dòng chỉ đọc (`khoa`: đã có điểm / đã thi / đã huỷ phần thi) — ghi lý do mờ, không đổi được;
 *   · FT: bỏ tích = bỏ kỹ năng khỏi đợt (`Bỏ khỏi đợt`, bắt buộc lý do); lớp thường không có ô tích (luôn đủ 4 môn);
 *   · mỗi lần đổi tuần gọi `/ke-hoach-test/dot/kiem` (đợt đã có) hoặc xem trước hàng loạt một em (đợt chưa có) → MỘT dòng
 *     trạng thái: `Chặn: …` (Lưu tắt) · cảnh báo (nút đổi thành `Vẫn xếp vào tuần này`) · `S: W4 SEP → W1 OCT · không trùng đợt khác.`
 * Bộ chọn tuần KHỞI TẠO bằng TUẦN HIỆN CÓ của từng kỹ năng (Bổ sung sau rà #87): không để bộ chọn tự phát "tuần này" làm
 * nút Lưu mở ngay — Lưu mờ cho tới khi đổi tuần.
 */
export function HopKyNang({ anchor, tieuDe, loai, classId, studentId, dot, attemptId, kn, kyNangDau, deXuat, khaiGiang, tongTuan, onClose, onSaved, onHienDien }: {
  anchor: HTMLElement; tieuDe: string; loai: 'ft' | 'thuong'; classId: number; studentId: number; dot: DotChon;
  attemptId: number | null; kn: KnO; kyNangDau: KyNangKH | null;
  deXuat?: string | null; khaiGiang?: string | null; tongTuan?: number | null;
  onClose: () => void; onSaved: () => void; onHienDien: (open: boolean) => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const moi = attemptId === null;
  const homNay = session?.demoDate ? mondayOfDate(session.demoDate) : null;

  const khoiTao = (): Record<KyNangKH, Dong> => {
    const o = {} as Record<KyNangKH, Dong>;
    for (const k of KY) o[k] = moi ? { tick: true, periodId: null } : { tick: kn[k]?.batBuoc ?? false, periodId: kn[k]?.periodId ?? null };
    return o;
  };
  const [rows, setRows] = useState<Record<KyNangKH, Dong>>(khoiTao);
  const [lyDo, setLyDo] = useState('');
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bai, setBai] = useState<BaiXemTruoc[] | null>(null);
  const seq = useRef(0);

  useEffect(() => { onHienDien(true); return () => onHienDien(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Đợt CHƯA CÓ: đặt sẵn tuần mặc định (Q18) — FT: L R W = tuần này, S = tuần sau; lớp thường: cả 4 = tuần đề xuất. */
  useEffect(() => {
    if (!moi) return;
    let huy = false;
    const lam = async () => {
      const goc = loai === 'thuong' ? (deXuat ?? homNay) : homNay;
      if (!goc) return;
      const lrw = (await resolveWeek(goc)).id;
      const s = loai === 'thuong' ? lrw : (await resolveWeek(addDaysStr(goc, 7))).id;
      if (!huy) setRows({ listening: { tick: true, periodId: lrw }, reading: { tick: true, periodId: lrw }, writing: { tick: true, periodId: lrw }, speaking: { tick: true, periodId: s } });
    };
    void lam().catch(() => { /* người dùng vẫn chọn tay được */ });
    return () => { huy = true; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const laKhoa = (k: KyNangKH) => !moi && !!kn[k]?.khoa;
  const cauHinh = (k: KyNangKH) => rows[k];
  const daDoi = (k: KyNangKH) => {
    if (laKhoa(k)) return false;
    const o = kn[k];
    if (moi) return true;
    const batBuoc = o?.batBuoc ?? false;
    if (batBuoc !== rows[k].tick) return true;
    return rows[k].tick && rows[k].periodId !== null && rows[k].periodId !== (o?.periodId ?? null);
  };
  const coDoi = KY.some(daDoi);
  const bo = KY.filter((k) => !moi && !laKhoa(k) && (kn[k]?.batBuoc ?? false) && !rows[k].tick);
  const coTuan = KY.filter((k) => !laKhoa(k) && rows[k].tick && rows[k].periodId);
  const thieuTuan = moi && KY.some((k) => !rows[k].periodId);

  /* Kiểm mỗi lần đổi tuần (trễ nhẹ, bỏ kết quả lượt cũ). */
  const khoaKiem = JSON.stringify(coTuan.map((k) => [k, rows[k].periodId, daDoi(k)]));
  useEffect(() => {
    setForce(false);
    const mySeq = ++seq.current;
    if (moi) {
      if (thieuTuan) { setBai(null); return; }
      const t = setTimeout(() => {
        const tuan: Record<string, number> = {};
        for (const k of KY) tuan[k] = rows[k].periodId!;
        api.post<{ dong: DongHangLoat[] }>('/ke-hoach-test/hang-loat', {
          classId, ...thanDot(dot), studentIds: [studentId], tuan, xemTruoc: true,
        }).then((r) => {
          if (mySeq !== seq.current) return;
          const d0 = r.dong[0];
          /* Em lỗi không có bài chặn cụ thể (vd chưa có lộ trình) → hiện câu lỗi như một bài chặn. */
          setBai(d0 && d0.hanhDong === 'loi' && d0.loi && !d0.bai.some((b) => b.ghiChu === 'chan')
            ? [{ skill: 'listening', tu: null, den: null, ghiChu: 'chan', cau: d0.loi }] : d0?.bai ?? []);
        })
          .catch(() => { if (mySeq === seq.current) setBai(null); });
      }, 250);
      return () => clearTimeout(t);
    }
    const doi = coTuan.filter(daDoi);
    if (!doi.length) { setBai([]); return; }
    api.post<{ bai: BaiXemTruoc[] }>('/ke-hoach-test/dot/kiem', {
      attemptId, kyNang: doi.map((k) => ({ skill: k, periodId: rows[k].periodId })),
    }).then((r) => { if (mySeq === seq.current) setBai(r.bai); })
      .catch(() => { if (mySeq === seq.current) setBai(null); });
  }, [khoaKiem, moi]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chan = (bai ?? []).filter((b) => b.ghiChu === 'chan');
  const canhBao = !chan.length ? (bai ?? []).filter((b) => b.ghiChu === 'canh-bao') : [];
  const doiOk = (bai ?? []).filter((b) => b.ghiChu === 'moi' || b.ghiChu === 'doi');

  const dongTrangThai = useMemo(() => {
    if (!bai) return { tone: 'muted' as const, chu: moi ? 'Chọn tuần cho cả 4 kỹ năng.' : '' };
    if (chan.length) return { tone: 'bad' as const, chu: `Chặn: ${[...new Set(chan.map((b) => b.cau))].join(' ')}` };
    if (canhBao.length) return { tone: 'soon' as const, chu: [...new Set(canhBao.map((b) => b.cau))].join(' ') };
    if (!doiOk.length) return { tone: 'muted' as const, chu: coDoi ? '' : 'Chưa đổi gì.' };
    const nhom = gomBaiXemTruoc([...doiOk, ...canhBao]).map((g) => (
      `${g.kyNang.map(chuKyNang).join(' ')}: ${g.tu ? tuanLich(g.tu) : '—'} → ${g.den ? tuanLich(g.den) : '—'}`
    ));
    return { tone: 'muted' as const, chu: `${nhom.join(' · ')} · không trùng đợt khác.` };
  }, [bai, moi, coDoi]);   // eslint-disable-line react-hooks/exhaustive-deps

  const thieuLyDo = bo.length > 0 && !lyDo.trim();
  const luuDuoc = !busy && !chan.length && !thieuLyDo && (moi ? !thieuTuan && !!bai : coDoi);

  const luu = async () => {
    if (!luuDuoc) return;
    setBusy(true);
    const dungForce = force || canhBao.length > 0;
    try {
      if (moi) {
        const tuan: Record<string, number> = {};
        for (const k of KY) tuan[k] = rows[k].periodId!;
        if (dot.loai === 'ft') await api.post('/ke-hoach-test/xep-moi', { studentId, attemptNo: dot.attemptNo, tuan, force: dungForce });
        else await api.post('/ke-hoach-test/xep-moi', { classId, studentId, kind: dot.kind, tuan, force: dungForce });
      } else {
        const kyNang = KY.filter((k) => daDoi(k) || (bo.includes(k))).map((k) => (
          !rows[k].tick ? { skill: k, bo: true }
            : !(kn[k]?.batBuoc ?? false) ? { skill: k, bo: false, periodId: rows[k].periodId }
              : { skill: k, periodId: rows[k].periodId }
        ));
        await api.post('/ke-hoach-test/dot', { attemptId, kyNang, lyDoBo: bo.length ? lyDo.trim() : null, force: dungForce });
      }
      toast.push('ok', 'Đã lưu lịch.');
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  /* Vị trí: neo dưới chip, kẹp trong màn; hết chỗ thì lật lên. < 640px → tấm dưới đáy. */
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  const dat = () => {
    if (dienThoai) return;
    const r = anchor.getBoundingClientRect();
    const rong = 352;
    const cao = box.current?.offsetHeight ?? 360;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    const duoi = r.bottom + 4;
    const top = duoi + cao > window.innerHeight - 8 ? Math.max(8, r.top - cao - 4) : duoi;
    setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
  };
  useLayoutEffect(() => { dat(); });   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (box.current?.contains(t) || anchor.contains(t) || t.closest('[role="dialog"]')) return;
      onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); window.removeEventListener('resize', dat); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const nutLuu = canhBao.length && !force ? 'Vẫn xếp vào tuần này' : 'Lưu';
  return createPortal(
    <div ref={box} role="dialog" aria-label={`Lịch ${tieuDe}`}
      className={`surface-2 z-[60] border shadow-2xl ${dienThoai ? 'fixed inset-x-0 bottom-0 rounded-t-xl' : 'fixed w-[352px] rounded-lg'}`}
      style={{ borderColor: 'var(--line-strong)', ...(dienThoai ? {} : { top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }) }}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <div className="min-w-0 truncate text-sm font-bold text-slate-100" title={tieuDe}>{tieuDe}</div>
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[28px] sm:min-w-[28px]" onClick={onClose} aria-label="Đóng">✕</button>
      </div>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto px-3 py-2.5">
        {KY.map((k) => (
          <DongKyNangHop key={k} k={k} o={kn[k]} khoa={laKhoa(k)} moi={moi} loai={loai} d={cauHinh(k)}
            noiBat={k === kyNangDau} khaiGiang={khaiGiang} tongTuan={tongTuan}
            onTick={(v) => setRows((s) => ({ ...s, [k]: { ...s[k], tick: v } }))}
            onPeriod={(id) => setRows((s) => ({ ...s, [k]: { ...s[k], periodId: id } }))} />
        ))}
        {bo.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Lý do bỏ <span className="text-bad">*</span></span>
            <input className="field w-full" value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: đợt này không thi Speaking" />
          </label>
        )}
        <div className={`min-h-[16px] text-xs leading-relaxed ${dongTrangThai.tone === 'bad' ? 'text-bad' : dongTrangThai.tone === 'soon' ? 'text-soon' : 'text-slate-400'}`} role="status">
          {dongTrangThai.chu}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => { if (canhBao.length) setForce(true); void luu(); }} disabled={!luuDuoc}>
          {busy ? 'Đang lưu…' : nutLuu}
        </button>
      </div>
    </div>,
    document.body,
  );
}

function DongKyNangHop({ k, o, khoa, moi, loai, d, noiBat, khaiGiang, tongTuan, onTick, onPeriod }: {
  k: KyNangKH; o?: OKyNang; khoa: boolean; moi: boolean; loai: 'ft' | 'thuong'; d: Dong; noiBat: boolean;
  khaiGiang?: string | null; tongTuan?: number | null; onTick: (v: boolean) => void; onPeriod: (id: number | null) => void;
}) {
  const coTick = loai === 'ft' && !moi && !khoa;     // lớp thường luôn đủ 4 môn — không có ô tích (Q3)
  const bo = !d.tick;
  const nhanTuan = loai === 'thuong' && o?.tuan ? nhanTuanKhoa(o.tuan, khaiGiang ?? null, tongTuan ?? null) : null;
  return (
    <div className={`grid items-start gap-2 rounded px-1 py-0.5 ${noiBat ? 'bg-white/5' : ''}`} style={{ gridTemplateColumns: coTick ? '20px 88px minmax(0,1fr)' : '0px 88px minmax(0,1fr)' }}>
      {coTick ? (
        <input type="checkbox" className="mt-3 accent-sky-400" checked={d.tick} onChange={(e) => onTick(e.target.checked)}
          aria-label={`${TEN_KY_NANG[k]} — ${d.tick ? 'bỏ khỏi đợt' : 'đưa lại vào đợt'}`} title={d.tick ? 'Bỏ khỏi đợt' : 'Đưa lại vào đợt'} />
      ) : <span />}
      <div className="mt-2.5 text-xs text-slate-200">
        <b title={TEN_KY_NANG[k]}>{chuKyNang(k)}</b> <span className="text-slate-400">{TEN_KY_NANG[k]}</span>
        {k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title="W = chấm cả W1 và W2">ⓘ</span>}
      </div>
      <div className="min-w-0">
        {khoa ? (
          <div className="mt-2.5 text-xs text-slate-500">{o?.tuan ? tuanLich(o.tuan) : '—'} · {o?.khoa}</div>
        ) : bo ? (
          <div className="mt-2.5 text-xs text-slate-500">Bỏ khỏi đợt</div>
        ) : (
          <>
            <WeekPicker periodId={d.periodId} onPeriod={onPeriod} label={null} scope="planning" />
            {nhanTuan && <div className="mt-0.5 text-[11px] text-slate-500">{nhanTuan}</div>}
          </>
        )}
      </div>
    </div>
  );
}
