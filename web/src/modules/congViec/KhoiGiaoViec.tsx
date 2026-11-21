import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { DongHan } from '../../ui/DongHan.tsx';
import { NUT_DONG } from '../../ui/KhungPanel.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { CHIP_NGUOI, NUT_X_CHIP } from '../../ui/Nhan.tsx';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { locNguoiChon, shortDate, type NguoiChon } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { lucVn } from './gioVn.ts';

/**
 * KHỐI PHỤ TRÁCH · HẠN · THEO DÕI (GV-2, N58; mockup `thiet-ke/v22/giao-viec.html` G1–G4, G7) — đầu thân MỌI panel việc giao được (Báo PH vi phạm · tình hình ·
 * Meeting, Phối hợp SOS một việc, Báo PH kết quả Test, Hỏi tình hình, phần Meeting). Một nguồn: `GET /giao-viec/:loai/:id`; nút theo cờ máy chủ
 * (`coTheDoiNguoi` · `coTheSuaHan` · `coTheSuaTheoDoi`), không tự suy. Hạn = `DongHan` (một chỗ sửa hạn). Mỗi thao tác máy chủ trả lại khối → vẽ ngay, không GET thêm.
 */
export type LoaiGiao = 'bao_ph' | 'phoi_hop' | 'tinh_hinh' | 'meeting';
type Nguoi = { id: number; ten: string | null };
export type KhoiGv = {
  loai: LoaiGiao; id: number; tieuDe: string; studentId: number; mo: boolean; branchId: number | null;
  phuTrach: Nguoi[]; macDinh: Nguoi[]; duocGiao: boolean; giaoBoi: Nguoi | null; giaoLuc: string | null;
  han: string | null; hanMacDinh: string | null; hanChon: string | null; coTheSuaHan: boolean;
  /** Báo PH "Chờ GV sửa" (TL-1): hạn tạm dừng — không tô quá hạn. */ tamDung?: boolean;
  theoDoi: (Nguoi & { nguon: string })[]; toiTheoDoi: boolean; coTheDoiNguoi: boolean; coTheSuaTheoDoi: boolean; hoanTacDuoc: boolean;
  lichSu: { truong: string; cu: string | null; moi: string | null; cuTen: string | null; moiTen: string | null; nguoi: string | null; luc: string }[];
  meeting?: { phan: 'xep_lich' | 'ket_qua'; ten: string; phoiHopId: number; trangThai: 'mo' | 'xong' | 'bo'; ngayGio: string | null; ketQua: string | null;
    xongBoi: string | null; xongLuc: string | null; nhapHoBoi: string | null; coTheLam: boolean };
};
export const duongGiaoViec = (loai: LoaiGiao, id: number) => `/giao-viec/${loai}/${id}`;
/** Sau mọi thao tác giao việc: danh sách việc + tab Đang theo dõi + hồ sơ HV đọc lại. */
export const lamMoiGiaoViec = () => { for (const k of ['/my-work', '/students', '/y-thuc', '/classes']) invalidate(k); };

/** Đọc khối + bản máy chủ vừa trả sau thao tác (`dat`) — không GET lại. */
export function useGiaoViec(loai: LoaiGiao, id: number | null | undefined) {
  const { data, error, reload } = useApi<KhoiGv>(id ? duongGiaoViec(loai, id) : null, [loai, id]);
  const [ban, setBan] = useState<KhoiGv | null>(null);
  useEffect(() => setBan(null), [data]);
  return { g: ban ?? data, error, reload, dat: setBan };
}

const NHAN_NGUON: Record<string, string> = { gvcn: 'GVCN', tvv: 'TVV', gv_ghi: 'GV ghi', head: 'Head', cx: 'CX' };
const O = 'flex min-h-[46px] min-w-0 items-center gap-2 border-t px-3 py-[7px] max-sm:min-h-[52px] max-sm:px-2.5';
const NHAN = `${O} whitespace-nowrap pr-0 text-[13px] font-medium text-dim`;
const THE_VIEN = 'inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 text-xs text-dim';

/** Lỗi thao tác: 409 = người khác vừa đổi → báo tại chỗ + tải lại khối (thao tác người dùng không mất: hộp giữ lựa chọn). */
type Loi = { chu: string; xungDot: boolean };
const loiCua = (e: any): Loi => ({ chu: e?.message ?? t('Không lưu được'), xungDot: e instanceof ApiError && e.status === 409 });

export function KhoiGiaoViec({ g, dat, reload, gon, chiHan, anTheoDoi, onDaDoi }: {
  g: KhoiGv; dat: (g: KhoiGv) => void; reload: () => void;
  /** Phần Meeting (G8): ô hẹp hơn, chỉ hai dòng Phụ trách · Hạn — Theo dõi gộp một dòng cho cả việc (`DongTheoDoiChung`). */
  gon?: boolean;
  /** Không vẽ dòng Phụ trách (phần Meeting của người khác — gọn một dòng). */ chiHan?: boolean;
  anTheoDoi?: boolean;
  /** Đổi người / hạn xong — nơi gọi báo danh sách (dòng việc rời "Của tôi"). */
  onDaDoi?: () => void;
}) {
  const { session } = useSession();
  const toi = session?.user?.id;
  const toast = useToast();
  const [hop, setHop] = useState(false);
  const nutDoi = useRef<HTMLButtonElement>(null);
  const [vuaGiao, setVuaGiao] = useState<{ ten: string; het: number } | null>(null);
  const [loi, setLoi] = useState<Loi | null>(null);
  const daDoi = (moi: KhoiGv) => { dat(moi); lamMoiGiaoViec(); onDaDoi?.(); };

  const ten = (n: Nguoi) => n.ten ?? t('(đã xoá)');
  const nguoiPt = g.phuTrach.length ? g.phuTrach.map(ten).join(', ') : t('Head chi nhánh');
  const laToi = toi != null && g.phuTrach.some((x) => x.id === toi);
  const theGiao = g.duocGiao
    ? <span className={THE_VIEN} style={{ borderColor: 'var(--line-strong)' }}>{g.giaoBoi?.id === toi ? t('bạn giao') : t('{ten} giao', { ten: g.giaoBoi?.ten ?? '—' })}</span>
    : <span className={THE_VIEN} style={{ borderColor: 'var(--line-strong)' }}>{t('mặc định')}</span>;
  const suaHan = async (han: string | null) => {
    const moi = await api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/han`, { han, hanCu: g.loai === 'tinh_hinh' ? g.han : g.hanChon });
    toast.push('ok', t('Đã lưu hạn'));
    daDoi(moi);
  };
  const hoanTac = async () => {
    setVuaGiao(null);
    try { daDoi(await api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/phu-trach/hoan-tac`)); toast.push('ok', t('Đã hoàn tác')); }
    catch (e: any) { setLoi(loiCua(e)); if (loiCua(e).xungDot) reload(); }
  };

  return (
    <div className="relative flex flex-col gap-2">
      {vuaGiao && <DaiVuaGiao ten={vuaGiao.ten} het={vuaGiao.het} onHet={() => setVuaGiao(null)} onHoanTac={() => void hoanTac()} />}
      {loi && (
        <p role="alert" className="m-0 flex flex-wrap items-center gap-2 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-sm">
          <b className="text-late">{t('Chưa lưu.')}</b><span className="min-w-0 flex-1">{loi.chu}</span>
          <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setLoi(null)}>{t('Đóng')}</button>
        </p>
      )}
      <div role="group" aria-label={t('Phụ trách, hạn, theo dõi')}
        className={`grid rounded-[10px] border [&>*:nth-child(-n+3)]:border-t-0 ${gon ? 'grid-cols-[72px_minmax(0,1fr)_auto]' : 'grid-cols-[84px_minmax(0,1fr)_auto] max-sm:grid-cols-[80px_minmax(0,1fr)_auto]'}`}
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        {!chiHan && <>
          <div className={NHAN} style={{ borderColor: 'var(--line)' }}>{t('Phụ trách')}</div>
          <div className={`${O} flex-wrap gap-y-1.5 text-sm`} style={{ borderColor: 'var(--line)' }}>
            <b className="font-semibold text-[color:var(--text)]">{nguoiPt}</b>
            {laToi && <span className="text-[13px] text-faint">{t('bạn')}</span>}
            {theGiao}
          </div>
          <div className={`${O} justify-end pl-0`} style={{ borderColor: 'var(--line)' }}>
            {g.coTheDoiNguoi && <button ref={nutDoi} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" aria-haspopup="dialog" aria-expanded={hop}
              onClick={() => setHop(true)}>{t('Đổi')}</button>}
          </div>
        </>}
        <div className={NHAN} style={{ borderColor: 'var(--line)' }}>{t('Hạn')}</div>
        <DongHan khoi tamDung={g.tamDung} han={g.han} hanMacDinh={g.hanMacDinh} hanChon={g.hanChon} xong={!g.mo} suaDuoc={g.coTheSuaHan} onLuu={suaHan} onTaiLai={reload} />
        {!anTheoDoi && <DongTheoDoi ds={[g]} dat={(x) => daDoi(x[0])} reload={reload} />}
      </div>
      {hop && (
        <HopNho nhan={t('Đổi người phụ trách')} tren="top-[52px]" onDong={() => { setHop(false); nutDoi.current?.focus(); }}>
          <HopDoiNguoi g={g} onDong={() => { setHop(false); nutDoi.current?.focus(); }} onXong={(moi, tenMoi) => {
            setHop(false); daDoi(moi);
            if (moi.duocGiao) setVuaGiao({ ten: tenMoi, het: Date.now() + 10_000 });
            else toast.push('ok', t('Đã về người phụ trách mặc định'));
          }} onXungDot={reload} />
        </HopNho>
      )}
    </div>
  );
}

/** Dải "✓ Đã giao cho … · Hoàn tác · n giây" (mockup G3b) — 10 giây, đếm lùi trên nút. */
function DaiVuaGiao({ ten, het, onHet, onHoanTac }: { ten: string; het: number; onHet: () => void; onHoanTac: () => void }) {
  const [con, setCon] = useState(Math.ceil((het - Date.now()) / 1000));
  useEffect(() => {
    const h = setInterval(() => { const s = Math.ceil((het - Date.now()) / 1000); if (s <= 0) onHet(); else setCon(s); }, 500);
    return () => clearInterval(h);
  }, [het]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="status" className="flex min-h-[40px] items-center gap-2.5 rounded-lg border border-ok-line bg-ok-bg py-1.5 pl-3 pr-2 text-sm">
      <b className="font-bold text-ok" aria-hidden>✓</b><span className="min-w-0 flex-1">{t('Đã giao cho {ten}', { ten })}</span>
      <button type="button" className="btn btn-sm min-h-[44px] tabular-nums sm:min-h-[30px]" onClick={onHoanTac}>{t('Hoàn tác · {n} giây', { n: con })}</button>
    </div>
  );
}

/**
 * Nguồn ô chọn người (N45, mockup G3a): "Liên quan" (người theo luật · đang phụ trách · người giao · người theo dõi — đã có trong khối) trước, rồi người có vai
 * ở chi nhánh của việc (`/ref/nguoi`, có LIMIT). Không request khi chỉ mở hộp ngoài lần tìm đầu (ô `ChonNguoi` trễ 250 ms).
 */
function nguonNguoi(g: KhoiGv[], tenCn: () => ReadonlyMap<string, string>, bo: ReadonlySet<number> = new Set()): (q: string) => Promise<NguoiTrongDs[]> {
  const lq = new Map<number, NguoiTrongDs>();
  const them = (n: Nguoi | null, phu: string) => { if (n?.ten && !lq.has(n.id) && !bo.has(n.id)) lq.set(n.id, { id: n.id, ten: n.ten, phu, nhom: t('Liên quan') }); };
  for (const x of g) {
    x.macDinh.forEach((n) => them(n, t('mặc định')));
    x.phuTrach.forEach((n) => them(n, t('đang phụ trách')));
    them(x.giaoBoi, t('người giao'));
    x.theoDoi.forEach((n) => them(n, NHAN_NGUON[n.nguon] ? dich(NHAN_NGUON[n.nguon]) : t('đang theo dõi')));
  }
  const cn = g[0]?.branchId ?? null;
  return async (q) => {
    const qs = new URLSearchParams({ q: q.trim(), nhom: 'giao_viec' });
    if (cn) qs.set('chiNhanh', String(cn));
    const ds = await api.get<{ id: number; name: string; role: string | null; branches: string[] }[]>(`/ref/nguoi?${qs}`);
    const dau = locNguoiChon([...lq.values()], q);
    return [...dau, ...ds.filter((r) => !lq.has(r.id) && !bo.has(r.id)).map((r) => ({ id: r.id, ten: r.name, phu: [r.role, r.branches.join('/')].filter(Boolean).join(' · '),
      nhom: (r.branches[0] && tenCn().get(r.branches[0])) ?? r.branches[0] ?? t('Chi nhánh'), anSoNhom: true as const }))];
  };
}

/**
 * HỘP NHỎ nổi ngay dưới khối (mockup G3a / G4a): đặt tuyệt đối trong khối (không portal — danh sách đổi cao không làm hộp nhảy), mép phải thẳng nút.
 * Bấm ngoài / Esc (khi ô chọn người không tự xử lý Esc) → đóng, focus về nút mở. < 640 px: hết bề ngang khối.
 */
function HopNho({ nhan, tren, onDong, children }: { nhan: string; tren: string; onDong: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const bam = useBamNgoai(true, onDong, ref);
  /* Hộp mở sát đáy vùng cuộn của panel → cuộn vừa đủ để thấy cả hộp (danh sách + chân Giao). */
  useEffect(() => {
    const cuon = () => ref.current?.scrollIntoView({ block: 'nearest' });
    cuon();
    const h = setTimeout(cuon, 400);   // danh sách tải sau ~250 ms (ô chọn trễ) — hộp cao thêm
    return () => clearTimeout(h);
  }, []);
  return (
    <div ref={ref} {...bam} role="dialog" aria-label={nhan} aria-modal="false"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); e.stopPropagation(); onDong(); return; }
        /* Tab vòng trong hộp — focus không lọt ra panel phía sau (PTA rà #1930). */
        if (e.key !== 'Tab') return;
        const ds = [...(ref.current?.querySelectorAll<HTMLElement>('input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [])].filter((x) => x.offsetParent !== null);
        if (!ds.length) return;
        const dau = ds[0], cuoi = ds[ds.length - 1];
        if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi.focus(); }
        else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau.focus(); }
      }}
      className={`absolute right-0 z-30 mt-1 w-[420px] max-w-full rounded-xl border ${tren}`}
      style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)', boxShadow: 'var(--bong-noi)' }}>{children}</div>
  );
}

/** Hộp vừa mở: con trỏ vào ô tìm (danh sách mở theo focus — G3a / G4a). `HopNeo` focus nút đầu (✕) SAU effect của con → hẹn một nhịp. */
function useConTroO() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = setTimeout(() => ref.current?.querySelector<HTMLInputElement>('input')?.focus()); return () => clearTimeout(h); }, []);
  return ref;
}

/** Mã → tên chi nhánh ("MB" → "Monbay", mockup G3a) — `/ref/branches` là đường tĩnh có bản nhớ (thường đã nạp: 0 request); chưa có thì giữ mã. */
function useTenCn(): () => ReadonlyMap<string, string> {
  const ds = useApi<{ code: string; name: string }[]>('/ref/branches').data;
  const ref = useRef<ReadonlyMap<string, string>>(new Map());
  ref.current = new Map((ds ?? []).map((b) => [b.code, b.name]));
  return () => ref.current;
}

/** HỘP NHỎ "Đổi người phụ trách" (mockup G3a / G3c): ô tìm + chọn, Liên quan trước, "Về mặc định · {tên}", không lý do. */
function HopDoiNguoi({ g, onDong, onXong, onXungDot }: { g: KhoiGv; onDong: () => void; onXong: (g: KhoiGv, ten: string) => void; onXungDot: () => void }) {
  const [chon, setChon] = useState<NguoiChon | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<Loi | null>(null);
  const tenCn = useTenCn();
  const [tim] = useState(() => ({ goi: nguonNguoi([g], tenCn), toiThieu: 0 }));
  const lechMacDinh = g.duocGiao;
  const tenMd = g.macDinh.map((x) => x.ten).filter(Boolean).join(', ') || t('Head chi nhánh');
  const gui = async (userId: number | null, ten: string) => {
    setDang(true); setLoi(null);
    try {
      const moi = await api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/phu-trach`, { userId, phuTrachCu: g.duocGiao ? g.phuTrach[0]?.id ?? null : null });
      onXong(moi, ten);
    } catch (e: any) { const l = loiCua(e); setLoi(l); if (l.xungDot) onXungDot(); } finally { setDang(false); }
  };
  const id = chon?.kieu === 'tai_khoan' ? chon.id : null;
  const o = useConTroO();
  return (
    <div ref={o} className="grid">
      <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <b className="text-[15px] font-bold">{t('Đổi người phụ trách')}</b>
          <span className="text-[13px] text-dim">{g.tieuDe}</span>
        </div>
        <button type="button" className={NUT_DONG} aria-label={t('Đóng')} onClick={onDong}>✕</button>
      </div>
      <div className="grid gap-2 px-4 py-3">
        <ChonNguoi value={chon} onChange={(v) => setChon(v)} nhom="nhan_vien" tim={tim} tinh tuMo choToi={false} choNgoai={false}
          placeholder={t('Gõ tên người')} ariaLabel={t('Người phụ trách mới')} tieuDe={t('Đổi người phụ trách')} />
        {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi.chu}{loi.xungDot && ` ${t('Đã tải lại — bấm Giao lần nữa.')}`}</p>}
      </div>
      {/* Nhấn nút chân không làm ô tìm mất focus — danh sách không co lại, nút không dời chỗ dưới con trỏ (cú bấm trượt). */}
      <div onMouseDown={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" disabled={!lechMacDinh || dang} onClick={() => void gui(null, tenMd)}>
          {lechMacDinh ? t('Về mặc định · {ten}', { ten: tenMd }) : t('Về mặc định')}</button>
        <span className="ml-auto flex gap-2">
          <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" disabled={dang} onClick={onDong}>{t('Đóng')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={!id || dang || g.phuTrach.some((x) => x.id === id)}
            onClick={() => id && void gui(id, chon?.kieu === 'tai_khoan' ? chon.ten : '')}>{dang ? t('Đang lưu…') : t('Giao')}</button>
        </span>
      </div>
    </div>
  );
}

/**
 * DÒNG THEO DÕI (mockup G1 / G4; G8: một dòng cho cả việc Meeting — `ds` nhiều phần, "+" thêm cho mọi phần, ✕ bỏ ở mọi phần có người đó).
 * Chip tên + vai; ✕ khi được sửa theo dõi (hoặc chính mình — tự bỏ); "+" mở hộp chọn nhiều. Bỏ → toast Hoàn tác (thêm lại).
 */
export function DongTheoDoi({ ds, dat, reload, rieng }: { ds: KhoiGv[]; dat: (ds: KhoiGv[]) => void; reload: () => void;
  /** Dòng đứng riêng (G8, dưới các phần Meeting) — tự vẽ khung. */ rieng?: boolean }) {
  const { session } = useSession();
  const toi = session?.user?.id;
  const toast = useToast();
  const [hop, setHop] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const nguoi = new Map<number, Nguoi & { nguon: string }>();
  for (const g of ds) for (const n of g.theoDoi) if (!nguoi.has(n.id)) nguoi.set(n.id, n);
  const suaDuoc = ds.some((g) => g.coTheSuaTheoDoi);
  const goi = async (f: (g: KhoiGv) => Promise<KhoiGv | { ok: true }> | null) => {
    const moi = await Promise.all(ds.map(async (g) => { const r = await f(g); return r && 'loai' in r ? r : g; }));
    dat(moi); lamMoiGiaoViec();
  };
  const bo = async (n: Nguoi) => {
    try {
      await goi((g) => (g.theoDoi.some((x) => x.id === n.id) ? api.del<KhoiGv | { ok: true }>(`${duongGiaoViec(g.loai, g.id)}/theo-doi/${n.id}`) : null));
      toast.hoanTac(n.id === toi ? t('Đã bỏ theo dõi') : t('Đã bỏ {ten} khỏi theo dõi', { ten: n.ten ?? '' }), () => {
        void goi((g) => (g.coTheSuaTheoDoi && g.mo ? api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/theo-doi`, { userIds: [n.id] }) : null)).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
      }, { key: `bo-theo-doi:${n.id}` });
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); if (loiCua(e).xungDot) reload(); }
  };
  const chip = (n: Nguoi & { nguon: string }) => {
    const xBo = suaDuoc || n.id === toi;
    const vai = n.id === toi ? t('bạn') : NHAN_NGUON[n.nguon] ? dich(NHAN_NGUON[n.nguon]) : null;
    return (
      <span key={n.id} className={`${CHIP_NGUOI} ${xBo ? 'pr-[3px]' : 'pr-2.5'}`}
        style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
        {n.ten ?? t('(đã xoá)')}{vai && <small className="text-xs text-faint">{vai}</small>}
        {xBo && <button type="button" className={NUT_X_CHIP}
          aria-label={n.id === toi ? t('Bỏ theo dõi') : t('Bỏ {ten} khỏi theo dõi', { ten: n.ten ?? '' })} onClick={() => void bo(n)}>✕</button>}
      </span>
    );
  };
  const dong = <>
    <div className={NHAN} style={{ borderColor: 'var(--line)' }}>{t('Theo dõi')}</div>
    <div className={`${O} flex-wrap gap-y-1.5`} style={{ borderColor: 'var(--line)' }}>
      {nguoi.size ? [...nguoi.values()].map(chip) : <span className="text-sm text-faint">{t('Chưa có')}</span>}
    </div>
    <div className={`${O} justify-end pl-0`} style={{ borderColor: 'var(--line)' }}>
      {suaDuoc && ds.some((g) => g.mo) && <button ref={nut} type="button" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center px-0 text-[17px] font-medium sm:h-[30px] sm:min-h-[30px] sm:w-[30px] sm:min-w-[30px]"
        aria-label={t('Thêm người theo dõi')} aria-haspopup="dialog" aria-expanded={hop} onClick={() => setHop(true)}>+</button>}
    </div>
    {hop && (
      <HopNho nhan={t('Thêm người theo dõi')} tren="top-full" onDong={() => { setHop(false); nut.current?.focus(); }}>
        <HopThemTheoDoi ds={ds} da={new Set(nguoi.keys())} onDong={() => { setHop(false); nut.current?.focus(); }}
          onThem={async (ids) => { await goi((g) => (g.coTheSuaTheoDoi && g.mo ? api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/theo-doi`, { userIds: ids }) : null)); setHop(false); nut.current?.focus(); }} />
      </HopNho>
    )}
  </>;
  if (!rieng) return dong;
  return (
    <div className="relative grid grid-cols-[84px_minmax(0,1fr)_auto] rounded-[10px] border max-sm:grid-cols-[80px_minmax(0,1fr)_auto] [&>*]:border-t-0"
      style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>{dong}</div>
  );
}

/** Hộp "Thêm người theo dõi" (mockup G4a): chọn nhiều (chip trong ô), người đã theo dõi hiện mờ "đang theo dõi", "Thêm n người". */
function HopThemTheoDoi({ ds, da, onDong, onThem }: { ds: KhoiGv[]; da: ReadonlySet<number>; onDong: () => void; onThem: (ids: number[]) => Promise<void> }) {
  const [chon, setChon] = useState<NguoiTrongDs[]>([]);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const tenCn = useTenCn();
  const [tim] = useState(() => {
    const goc = nguonNguoi(ds, tenCn);
    return { toiThieu: 0, goi: async (q: string) => (await goc(q)).map((r) => (da.has(r.id) ? { ...r, tat: t('đang theo dõi') } : r)) };
  });
  const them = async () => {
    setDang(true); setLoi(null);
    try { await onThem(chon.map((x) => x.id)); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setDang(false); }
  };
  const o = useConTroO();
  return (
    <div ref={o} className="grid">
      <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="grid min-w-0 flex-1 gap-0.5"><b className="text-[15px] font-bold">{t('Thêm người theo dõi')}</b><span className="text-[13px] text-dim">{ds[0]?.tieuDe}</span></div>
        <button type="button" className={NUT_DONG} aria-label={t('Đóng')} onClick={onDong}>✕</button>
      </div>
      <div className="grid gap-2 px-4 py-3">
        <ChonNguoi value={null} onChange={() => {}} nhom="nhan_vien" tim={tim} tinh tuMo choToi={false} choNgoai={false} nhieu={{ chon, toiDa: 20, onDoi: setChon, donVi: t('người') }}
          placeholder={t('Gõ tên người')} ariaLabel={t('Người theo dõi')} tieuDe={t('Thêm người theo dõi')} />
        {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
      </div>
      <div onMouseDown={(e) => e.preventDefault()} className="flex justify-end gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
        <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" disabled={dang} onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={!chon.length || dang} onClick={() => void them()}>
          {chon.length ? t('Thêm {n} người', { n: chon.length }) : t('Thêm')}</button>
      </div>
    </div>
  );
}

/** Dải "Bạn đang theo dõi · chỉ xem · Bỏ theo dõi" (mockup G5) — panel mở từ tab Đang theo dõi. */
export function DaiChiXem({ g, onBo }: { g: KhoiGv; onBo: () => void }) {
  const { session } = useSession();
  const toast = useToast();
  const [dang, setDang] = useState(false);
  const bo = async () => {
    setDang(true);
    try { await api.del(`${duongGiaoViec(g.loai, g.id)}/theo-doi/${session?.user?.id}`); lamMoiGiaoViec(); toast.push('ok', t('Đã bỏ theo dõi')); onBo(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDang(false); }
  };
  return (
    <div className="flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-dim" style={{ background: 'var(--surface-2)' }}>
      <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth={1.5}><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /></svg>
      <span className="min-w-0 flex-1">{t('Bạn đang theo dõi · chỉ xem')}</span>
      {g.toiTheoDoi && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={dang} onClick={() => void bo()}>{t('Bỏ theo dõi')}</button>}
    </div>
  );
}

/** Dòng lịch sử giao việc (đổi người · theo dõi · hạn · phần Meeting) cho `DsLichSu` — panel gộp cùng lịch sử sẵn có (một kiểu ⑤). */
export function dongLichSuGiao(g: KhoiGv | null | undefined, hn: string, ten?: string): { luc: string; tieu: ReactNode; nguoi: string | null; phu: string[] }[] {
  if (!g) return [];
  const md = t('mặc định');
  return g.lichSu.map((l) => {
    const dau = ten ? `${ten} · ` : '';
    const ngay = (s: string | null) => (s ? shortDate(s, hn) : t('không hạn'));
    if (l.truong === 'phu_trach') return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${t('Đổi người phụ trách')}`, phu: [`${l.cuTen ?? md} → ${l.moiTen ?? md}`] };
    if (l.truong === 'theo_doi') return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${l.moi ? t('Thêm theo dõi') : t('Bỏ theo dõi')}`, phu: [(l.moiTen ?? l.cuTen) ?? ''] };
    if (l.truong === 'han') return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${t('Sửa hạn')}`, phu: [`${ngay(l.cu)} → ${ngay(l.moi)}`] };
    const kq = (() => { try { const x = JSON.parse(l.moi ?? 'null'); return x ? [x.ngayGio ? t('họp {ngay}', { ngay: lucVn(x.ngayGio.replace(' ', 'T')) }) : null, x.ketQua].filter(Boolean) as string[] : []; } catch { return []; } })();
    return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${l.truong === 'xong' ? t('Hoàn thành') : l.truong === 'sua' ? t('Sửa kết quả') : t('Hoàn tác hoàn thành')}`, phu: kq };
  });
}

/** Ngày hôm nay nghiệp vụ (cho `dongLichSuGiao`). */
export const useHn = () => useNgayNghiepVu().homNay ?? '';
