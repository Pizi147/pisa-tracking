import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, api, invalidate } from '../../../lib/api.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../../lib/format.ts';
import { useToast } from '../../../ui/Toast.tsx';
import {
  CHU_THAO_TAC, canLyDoVuot, cauSeHuyLich, dongHeQuaVuot, gomBaiXemTruoc, mondayOfDate, nhanTuanKhoa, tenMon, tenMonNgan, thaoTacKyNang, trangThaiTT, tuanLich,
  tuanMacDinhDotMoi, type BaiXemTruoc, type DongHangLoat, type KyNangKH, type OKyNang, type ThaoTac,
} from '@shared/domain/index.ts';
import { KY, thanDot, type DotChon, type KnO } from './kieu.ts';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';
import { MenuDong } from '../../../ui/MenuDong.tsx';
import { HopThaoTacMt } from '../../fasttrack/HopThaoTacMt.tsx';
import { HopXacNhanHuyLich, type LuotSeHuyLich } from './HopXacNhanHuyLich.tsx';

type Dong = { tick: boolean; periodId: number | null; weekStart: string | null };

/**
 * HỘP KỸ NĂNG (mockup 14 (1), Q19) — hộp nhỏ NEO CẠNH chip vừa bấm (portal, `position: fixed`, kẹp trong màn); 375px thì
 * là tấm dưới đáy rộng hết màn. Bốn dòng `ô tích · L Listening · tuần`, mỗi dòng đổi tuần riêng:
 *   · dòng chỉ đọc chỉ còn `khoa` = đã huỷ phần thi; đã có điểm / đã thi vẫn dời được, điểm đi theo (PR-MTa T20);
 *   · FT: bỏ tích = bỏ kỹ năng khỏi đợt (`Bỏ khỏi đợt`, bắt buộc lý do); lớp thường không có ô tích (luôn đủ 4 môn);
 *   · mỗi lần đổi tuần gọi `/ke-hoach-test/dot/kiem` (đợt đã có) hoặc xem trước hàng loạt một em (đợt chưa có) → MỘT dòng
 *     trạng thái: `Chặn: …` (Lưu tắt) · cảnh báo (nút đổi thành `Vẫn xếp vào tuần này`) · `S: W4 SEP → W1 OCT · không trùng đợt khác.`
 *   · PR-LM (Q-0310-1): dời vượt lượt sau → dòng ĐỎ "Lưu sẽ huỷ lịch MT2 (W3 JUL) …"; Lưu mở hộp xác nhận nêu từng lượt bị huỷ lịch.
 *     Hộp chỉ dành cho Quản lý / Quản trị: chọn được tuần đã qua ở mọi lượt (T4, T20 — rà #212).
 * Bộ chọn tuần KHỞI TẠO bằng TUẦN HIỆN CÓ của từng kỹ năng (Bổ sung sau rà #87): không để bộ chọn tự phát "tuần này" làm
 * nút Lưu mở ngay — Lưu mờ cho tới khi đổi tuần.
 */
export function HopKyNang({ anchor, tieuDe, loai, classId, studentId, dot, attemptId, kn, kyNangDau, deXuat, khaiGiang, tongTuan, onClose, onSaved, onHienDien, ky = KY, ct = null, lichSu = false }: {
  anchor: HTMLElement; tieuDe: string; loai: 'ft' | 'thuong'; classId: number; studentId: number; dot: DotChon;
  /** Lớp thường: bộ môn của chương trình (Pre FOU một dòng Tổng hợp — PF6); FT: 4 kỹ năng. `ct` = mã chương trình (tên FOU G+V/P). */
  ky?: readonly KyNangKH[]; ct?: string | null;
  attemptId: number | null; kn: KnO; kyNangDau: KyNangKH | null;
  /** PR-XLMT: MT lịch sử — menu thao tác theo trạng thái `lich-su`. PR-LM (D3): tuần đổi được kể cả kỹ năng đã có điểm, cần lý do. */
  lichSu?: boolean;
  deXuat?: string | null; khaiGiang?: string | null; tongTuan?: number | null;
  onClose: () => void; onSaved: () => void; onHienDien: (open: boolean) => void;
}) {
  const toast = useToast();
  const moi = attemptId === null;
  const nghiepVu = useNgayNghiepVu().homNay;
  const homNay = nghiepVu ? mondayOfDate(nghiepVu) : null;
  const ngayNghiepVu = nghiepVu || null;
  const [thaoTac, setThaoTac] = useState<{ t: ThaoTac; k: KyNangKH } | null>(null);

  const khoiTao = (): Record<KyNangKH, Dong> => {
    const o = {} as Record<KyNangKH, Dong>;
    for (const k of ky) o[k] = moi ? { tick: true, periodId: null, weekStart: null } : { tick: kn[k]?.batBuoc ?? false, periodId: kn[k]?.periodId ?? null, weekStart: kn[k]?.tuan ?? null };
    return o;
  };
  const [rows, setRows] = useState<Record<KyNangKH, Dong>>(khoiTao);
  const [lyDo, setLyDo] = useState('');
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bai, setBai] = useState<BaiXemTruoc[] | null>(null);
  const [seHuyLich, setSeHuyLich] = useState<LuotSeHuyLich[]>([]);
  /** Hộp "Huỷ lịch MT2?" đang mở với danh sách nào (kiểm trước, hoặc 409 khi dữ liệu đổi giữa chừng). */
  const [xacNhan, setXacNhan] = useState<LuotSeHuyLich[] | null>(null);
  const seq = useRef(0);

  useEffect(() => { onHienDien(true); return () => onHienDien(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Đợt CHƯA CÓ: đặt sẵn tuần mặc định — FT: cả 4 kỹ năng CÙNG tuần tới (K4-14, M9 `tuanMacDinhDotMoi`); lớp thường: tuần đề xuất. */
  useEffect(() => {
    if (!moi) return;
    let huy = false;
    const lam = async () => {
      const goc = loai === 'thuong' ? (deXuat ?? homNay) : ngayNghiepVu ? tuanMacDinhDotMoi(ngayNghiepVu) : null;
      if (!goc) return;
      const t = await resolveTuan(goc);
      if (!huy) setRows(Object.fromEntries(ky.map((k) => [k, { tick: true, periodId: t.periodId, weekStart: t.weekStart }])) as Record<KyNangKH, Dong>);
    };
    void lam().catch(() => { /* người dùng vẫn chọn tay được */ });
    return () => { huy = true; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* PR-MTa T20: Quản lý dời được kỹ năng đã có điểm / đã thi (điểm đi theo) — chỉ phần đã huỷ là chỉ đọc. */
  const laKhoa = (k: KyNangKH) => !moi && kn[k]?.khoa === 'đã huỷ phần thi';
  const cauHinh = (k: KyNangKH) => rows[k];
  const daDoi = (k: KyNangKH) => {
    if (laKhoa(k)) return false;
    const o = kn[k];
    if (moi) return true;
    const batBuoc = o?.batBuoc ?? false;
    if (batBuoc !== rows[k].tick) return true;
    return rows[k].tick && rows[k].periodId !== null && rows[k].periodId !== (o?.periodId ?? null);
  };
  const coDoi = ky.some(daDoi);
  const bo = ky.filter((k) => !moi && !laKhoa(k) && (kn[k]?.batBuoc ?? false) && !rows[k].tick);
  const coTuan = ky.filter((k) => !laKhoa(k) && rows[k].tick && rows[k].periodId);
  const thieuTuan = moi && ky.some((k) => !rows[k].periodId);

  /* Kiểm mỗi lần đổi tuần (trễ nhẹ, bỏ kết quả lượt cũ). */
  const khoaKiem = JSON.stringify(coTuan.map((k) => [k, rows[k].periodId, daDoi(k)]));
  useEffect(() => {
    setForce(false);
    const mySeq = ++seq.current;
    if (moi) {
      if (thieuTuan) { setBai(null); return; }
      const t = setTimeout(() => {
        const tuan: Record<string, number> = {};
        for (const k of ky) tuan[k] = rows[k].periodId!;
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
    if (!doi.length) { setBai([]); setSeHuyLich([]); return; }
    api.post<{ bai: BaiXemTruoc[]; seHuyLich?: LuotSeHuyLich[] }>('/ke-hoach-test/dot/kiem', {
      attemptId, kyNang: doi.map((k) => ({ skill: k, periodId: rows[k].periodId })),
    }).then((r) => { if (mySeq === seq.current) { setBai(r.bai); setSeHuyLich(r.seHuyLich ?? []); } })
      .catch(() => { if (mySeq === seq.current) { setBai(null); setSeHuyLich([]); } });
  }, [khoaKiem, moi]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chan = (bai ?? []).filter((b) => b.ghiChu === 'chan');
  const canhBao = !chan.length ? (bai ?? []).filter((b) => b.ghiChu === 'canh-bao') : [];
  const doiOk = (bai ?? []).filter((b) => b.ghiChu === 'moi' || b.ghiChu === 'doi');

  const dongTrangThai = useMemo(() => {
    if (!bai) return { tone: 'muted' as const, chu: moi ? (loai === 'thuong' ? `Chọn tuần cho ${ky.length === 1 ? 'môn' : `cả ${ky.length} môn`}.` : 'Chọn tuần cho cả 4 kỹ năng.') : '' };
    if (chan.length) return { tone: 'bad' as const, chu: `Chặn: ${[...new Set(chan.map((b) => b.cau))].join(' ')}` };
    if (canhBao.length) return { tone: 'soon' as const, chu: [...new Set(canhBao.map((b) => b.cau))].join(' ') };
    if (!doiOk.length) return { tone: 'muted' as const, chu: coDoi ? '' : 'Chưa đổi gì.' };
    const nhom = gomBaiXemTruoc([...doiOk, ...canhBao]).map((g) => (
      `${g.kyNang.map((k) => tenMonNgan(ct, k)).join(' ')}: ${g.tu ? tuanLich(g.tu) : '—'} → ${g.den ? tuanLich(g.den) : '—'}`
    ));
    /* PR-LM: có lượt sau sẽ bị huỷ lịch thì dòng đỏ bên dưới nói — không ghi "không trùng đợt khác" mâu thuẫn với nó. */
    return { tone: 'muted' as const, chu: seHuyLich.length ? `${nhom.join(' · ')}.` : `${nhom.join(' · ')} · không trùng đợt khác.` };
  }, [bai, moi, coDoi, seHuyLich]);   // eslint-disable-line react-hooks/exhaustive-deps

  const tuanDaBatDau = (k: KyNangKH) => !!homNay && !!kn[k]?.tuan && kn[k]!.tuan!.slice(0, 10) <= homNay;
  const suaLichSu = lichSu && !moi && coDoi;
  /* T7 (PR-MTa): bỏ kỹ năng / dời lịch — ô lý do tuỳ chọn, không tối thiểu ký tự. */
  const canLyDo = bo.length > 0 || (!moi && coDoi);
  /* Menu ⋯ từng dòng theo `thaoTacKyNang` (T38). Dòng đã có ô tuần và ô tích nên bỏ "Dời lịch thi" / "Bỏ kỹ năng khỏi đợt" /
   * "Đưa lại vào đợt" khỏi ⋯; dòng đã huỷ phần thi có "Khôi phục và đặt tuần". Kế hoạch Test là màn của Quản lý. */
  const tatCua = (k: KyNangKH) => {
    const o = kn[k];
    if (moi || !o || !ngayNghiepVu) return null;
    const tt = trangThaiTT({ batBuoc: o.batBuoc, tuanBatDau: o.tuan, coDiem: o.khoa === 'đã có điểm', sit: o.sit, choDuyet: o.choDuyet, lichSu, homNay: ngayNghiepVu });
    return thaoTacKyNang(tt, { nhapDiem: true, quanLy: true, gvcn: false, laFt: loai === 'ft', dotHoanTat: false });
  };
  const menuTick = (k: KyNangKH) => !!tatCua(k)?.menu.includes('bo-ky-nang');
  const menuCua = (k: KyNangKH): ThaoTac[] => {
    const tat = tatCua(k);
    if (!tat) return [];
    return [...(tat.chinh === 'khoi-phuc' ? ['khoi-phuc' as ThaoTac] : []),
      ...tat.menu.filter((x) => x !== 'doi-lich' && x !== 'bo-ky-nang' && x !== 'dua-lai')];
  };
  const luuDuoc = !busy && !chan.length && (moi ? !thieuTuan && !!bai : coDoi);

  /** `lyDoVuot` = lý do ở hộp dời vượt (T2) — chỉ có khi đã xác nhận huỷ kết quả. */
  const luu = async (daXacNhan = false, lyDoVuot?: string) => {
    if (!luuDuoc) return;
    if (!moi && canLyDoVuot(seHuyLich) && !daXacNhan) { setXacNhan(seHuyLich); return; }
    setBusy(true);
    const dungForce = force || canhBao.length > 0;
    try {
      if (moi) {
        const tuan: Record<string, number> = {};
        for (const k of ky) tuan[k] = rows[k].periodId!;
        if (dot.loai === 'ft') await api.post('/ke-hoach-test/xep-moi', { studentId, attemptNo: dot.attemptNo, tuan, force: dungForce });
        else await api.post('/ke-hoach-test/xep-moi', { classId, studentId, kind: dot.kind, tuan, force: dungForce });
      } else {
        const kyNang = ky.filter((k) => daDoi(k) || (bo.includes(k))).map((k) => (
          !rows[k].tick ? { skill: k, bo: true }
            : !(kn[k]?.batBuoc ?? false) ? { skill: k, bo: false, periodId: rows[k].periodId }
              : { skill: k, periodId: rows[k].periodId }
        ));
        await api.post('/ke-hoach-test/dot', {
          attemptId, kyNang, lyDoBo: bo.length ? lyDo.trim() : null, reason: lyDoVuot || lyDo.trim() || null, force: dungForce,
          xacNhanHuyLich: daXacNhan,
        });
      }
      toast.push('ok', daXacNhan && xacNhan?.length ? `Đã lưu lịch · ${xacNhan.map(dongHeQuaVuot).join(' · ')}.` : 'Đã lưu lịch.');
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      /* Dữ liệu đổi giữa lúc kiểm và lúc lưu: máy chủ trả 409 kèm danh sách mới → mở lại hộp xác nhận với danh sách đó. */
      if (e instanceof ApiError && e.status === 409 && e.details?.seHuyLich?.length) { setSeHuyLich(e.details.seHuyLich); setXacNhan(e.details.seHuyLich); }
      else toast.push('error', e.message ?? 'Không lưu được — thử lại.');
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
    const rong = Math.min(520, window.innerWidth - 32);
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
      if (box.current?.contains(t) || anchor.contains(t) || t.closest('[role="dialog"], [role="menu"]')) return;
      onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[aria-modal="true"]')) onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); window.removeEventListener('resize', dat); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const nutLuu = canhBao.length && !force ? 'Vẫn xếp vào tuần này' : 'Lưu';
  return createPortal(
    <div ref={box} role="dialog" aria-label={`Lịch ${tieuDe}`}
      className={`surface-2 z-[60] border shadow-2xl ${dienThoai ? 'fixed inset-x-0 bottom-0 rounded-t-xl' : 'fixed w-[min(520px,calc(100vw-32px))] rounded-lg'}`}
      style={{ borderColor: 'var(--line-strong)', ...(dienThoai ? {} : { top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }) }}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <div className="min-w-0 truncate text-sm font-bold text-slate-100" title={tieuDe}>{tieuDe}</div>
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center sm:min-h-[28px] sm:min-w-[28px]" onClick={onClose} aria-label="Đóng">✕</button>
      </div>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto px-3 py-2.5">
        {ky.map((k) => (
          <DongKyNangHop key={k} k={k} o={kn[k]} khoa={laKhoa(k)} moi={moi} loai={loai} d={cauHinh(k)} ct={ct}
            menu={menuCua(k)} onThaoTac={(t) => setThaoTac({ t, k })}
            coTickBo={loai === 'ft' && (!(kn[k]?.batBuoc ?? false) || menuTick(k))}
            noiBat={k === kyNangDau} khaiGiang={khaiGiang} tongTuan={tongTuan}
            onTick={(v) => setRows((s) => ({ ...s, [k]: { ...s[k], tick: v } }))}
            onTuan={(t) => setRows((s) => ({ ...s, [k]: { ...s[k], periodId: t.periodId, weekStart: t.weekStart } }))} goc={homNay} />
        ))}
        {canLyDo && (
          <label className="block">
            <span className="mb-1 flex items-baseline gap-2 text-[11.5px] font-bold text-slate-200">
              <span className="flex-1">{bo.length ? 'Lý do bỏ' : suaLichSu ? 'Lý do sửa tuần' : 'Lý do dời'} <span className="font-normal text-slate-500">(tuỳ chọn)</span></span>
            </span>
            <input className="field w-full" value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder={bo.length ? 'Ví dụ: đợt này không thi Speaking' : 'Ví dụ: trùng lịch phòng thi'} />
            {suaLichSu && !bo.length && <span className="mt-1 block text-xs text-slate-400">MT cũ — đổi tuần là sửa hồ sơ, điểm giữ nguyên.</span>}
          </label>
        )}
        <div className={`min-h-[16px] text-xs leading-relaxed ${dongTrangThai.tone === 'bad' ? 'text-bad' : dongTrangThai.tone === 'soon' ? 'text-soon' : 'text-slate-400'}`} role="status">
          {dongTrangThai.chu}
        </div>
        {!chan.length && seHuyLich.length > 0 && (
          <p className="m-0 text-xs font-semibold leading-relaxed text-bad" role="alert">{cauSeHuyLich(seHuyLich, nghiepVu)}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => { if (canhBao.length) setForce(true); void luu(); }} disabled={!luuDuoc}>
          {busy ? 'Đang lưu…' : nutLuu}
        </button>
      </div>
      {xacNhan && (
        <HopXacNhanHuyLich ds={xacNhan} busy={busy} onQuayLai={() => setXacNhan(null)}
          onXacNhan={(ly) => { void luu(true, ly); }} />
      )}
      {thaoTac && attemptId !== null && (
        <HopThaoTacMt key={`${thaoTac.t}:${thaoTac.k}`} thaoTac={thaoTac.t} attemptId={attemptId} skill={thaoTac.k} ct={ct} laThuong={loai === 'thuong'}
          tuanDaBatDau={tuanDaBatDau(thaoTac.k)} row={{ periodId: kn[thaoTac.k]?.periodId ?? null, weekStart: kn[thaoTac.k]?.tuan ?? null }}
          oCoDiem={thaoTac.k === 'writing' && loai === 'ft' ? ['writing1', 'writing2'] : [thaoTac.k]}
          trongHop hocVien={tieuDe}
          onClose={() => setThaoTac(null)} onDone={() => { onSaved(); onClose(); }} />
      )}
    </div>,
    document.body,
  );
}

function DongKyNangHop({ k, o, khoa, moi, loai, d, noiBat, khaiGiang, tongTuan, onTick, onTuan, goc, ct = null, menu, onThaoTac, coTickBo }: {
  ct?: string | null; menu: ThaoTac[]; onThaoTac: (t: ThaoTac) => void;
  /** PR-XLMT (K4-13): ô tích bỏ kỹ năng chỉ khi bảng thao tác cho "Bỏ kỹ năng khỏi đợt" (chưa tới tuần thi, chưa điểm) hoặc để đưa lại. */
  coTickBo: boolean;
  k: KyNangKH; o?: OKyNang; khoa: boolean; moi: boolean; loai: 'ft' | 'thuong'; d: Dong; noiBat: boolean;
  khaiGiang?: string | null; tongTuan?: number | null; onTick: (v: boolean) => void; onTuan: (t: Tuan) => void; goc: string | null;
}) {
  const coTick = loai === 'ft' && !moi && !khoa && coTickBo;     // lớp thường luôn đủ 4 môn — không có ô tích (Q3)
  const bo = !d.tick;
  const nhanTuan = loai === 'thuong' && d.weekStart ? nhanTuanKhoa(d.weekStart, khaiGiang ?? null, tongTuan ?? null) : null;
  return (
    <div className={`grid items-start gap-2 rounded px-1 py-0.5 ${noiBat ? 'bg-white/5' : ''}`} style={{ gridTemplateColumns: `${coTick ? '20px' : '0px'} 96px minmax(0,1fr) auto` }}>
      {coTick ? (
        <input type="checkbox" className="mt-3 accent-sky-400" checked={d.tick} onChange={(e) => onTick(e.target.checked)}
          aria-label={`${tenMon(ct, k)} — ${d.tick ? 'bỏ khỏi đợt' : 'đưa lại vào đợt'}`} title={d.tick ? 'Bỏ kỹ năng khỏi đợt' : 'Đưa lại vào đợt'} />
      ) : <span />}
      <div className="mt-2.5 text-xs text-slate-200">
        <b title={tenMon(ct, k)}>{tenMonNgan(ct, k)}</b>
        {tenMonNgan(ct, k) !== tenMon(ct, k) && <> <span className="text-slate-400">{tenMon(ct, k)}</span></>}
        {loai === 'ft' && k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title="W = chấm cả W1 và W2">ⓘ</span>}
      </div>
      <div className="min-w-0">
        {khoa ? (
          <div className="mt-2.5 text-xs text-slate-500">{o?.tuan ? tuanLich(o.tuan) : '—'} · {o?.khoa}</div>
        ) : bo ? (
          <div className="mt-2.5 text-xs text-slate-500">Bỏ kỹ năng khỏi đợt</div>
        ) : (
          <>
            {/* Rà #212 (T4/T20): hộp chỉ mở cho Quản lý / Quản trị (PLAN_WEEK) — chọn được cả tuần đã qua, máy chủ đã cho. */}
            <TuanNho d={d} goc={goc} onTuan={onTuan} nhanKhoa={nhanTuan} />
          </>
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <MenuDong nhan={`Thao tác khác · ${tenMon(ct, k)}`} muc={menu.map((x) => ({
          key: x, nhan: CHU_THAO_TAC[x], onChon: () => onThaoTac(x), nguyHiem: x === 'huy-diem',
        }))} />
      </div>
    </div>
  );
}
