import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { DongHan } from '../../ui/DongHan.tsx';
import { NUT_DONG, useBaoDangSua } from '../../ui/KhungPanel.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { NoiTren } from '../../ui/NoiTren.tsx';
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
export type LoaiGiao = 'bao_ph' | 'phoi_hop' | 'tinh_hinh' | 'meeting' | 'tra_lai';
type Nguoi = { id: number; ten: string | null };
export type KhoiGv = {
  /** `van_hanh` (VH-2): việc Vận hành — thao tác đi `/mgmt-tasks` qua `thaoTac`, không qua `/giao-viec`. */
  loai: LoaiGiao | 'van_hanh'; id: number; tieuDe: string; studentId: number; mo: boolean; branchId: number | null;
  phuTrach: Nguoi[]; macDinh: Nguoi[]; duocGiao: boolean; giaoBoi: Nguoi | null; giaoLuc: string | null;
  han: string | null; hanMacDinh: string | null; hanChon: string | null; coTheSuaHan: boolean;
  /** Báo PH "Chờ GV sửa" (TL-1): hạn tạm dừng — không tô quá hạn. */ tamDung?: boolean;
  /** TL-2: hạn do máy tính lại sau khi GV gửi lại (không "đã chỉnh"). */ hanTinhLai?: boolean;
  theoDoi: (Nguoi & { nguon: string; vai: string | null })[]; toiTheoDoi: boolean; coTheDoiNguoi: boolean; coTheSuaTheoDoi: boolean; hoanTacDuoc: boolean;
  /** GV-3 (N62): Mô tả tuỳ chọn — `noiDung` gửi lại làm `moTaCu` khi sửa (so-và-đổi); người theo dõi chỉ đọc (`coTheSuaMoTa` của máy chủ). */
  moTa: { noiDung: string; suaBoi: string | null; suaLuc: string } | null; coTheSuaMoTa: boolean;
  lichSu: { truong: string; cu: string | null; moi: string | null; cuTen: string | null; moiTen: string | null; nguoi: string | null; luc: string }[];
  meeting?: { phan: 'xep_lich' | 'ket_qua'; ten: string; phoiHopId: number; trangThai: 'mo' | 'xong' | 'bo'; ngayGio: string | null; ketQua: string | null;
    xongBoi: string | null; xongLuc: string | null; nhapHoBoi: string | null; coTheLam: boolean };
};
export const duongGiaoViec = (loai: KhoiGv['loai'], id: number) => `/giao-viec/${loai}/${id}`;

/**
 * VH-2: thao tác của khối cho loại việc có đường riêng (việc Vận hành: `PATCH /mgmt-tasks/:id`). Không truyền → đường chung `/giao-viec` (GV-2).
 * Mỗi hàm trả lại khối mới (máy chủ trả bản ghi sau khi lưu → vẽ ngay).
 */
export type ThaoTacKhoi = {
  doiNguoi: (g: KhoiGv, userId: number | null) => Promise<KhoiGv>;
  hoanTacNguoi: (g: KhoiGv) => Promise<KhoiGv>;
  suaHan: (g: KhoiGv, han: string | null) => Promise<KhoiGv>;
  themTheoDoi: (g: KhoiGv, ids: number[]) => Promise<KhoiGv>;
  boTheoDoi: (g: KhoiGv, userId: number) => Promise<KhoiGv>;
  /** Chữ khi chưa có người phụ trách (mặc định "Head chi nhánh" — người theo luật). */ trong?: string;
  /** Loại việc không có người phụ trách theo luật → hộp Đổi người không có "Về mặc định". */ khongMacDinh?: boolean;
};
const thaoTacChung: ThaoTacKhoi = {
  doiNguoi: (g, userId) => api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/phu-trach`, { userId, phuTrachCu: g.duocGiao ? g.phuTrach[0]?.id ?? null : null }),
  hoanTacNguoi: async (g) => { const r = await api.post<KhoiGv | { ok: true }>(`${duongGiaoViec(g.loai, g.id)}/phu-trach/hoan-tac`); return r && 'loai' in r ? r : g; },   // AU-2111: đã đảo, không còn quyền xem
  suaHan: (g, han) => api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/han`, { han, hanCu: g.loai === 'tinh_hinh' ? g.han : g.hanChon }),
  themTheoDoi: (g, ids) => api.post<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/theo-doi`, { userIds: ids }),
  boTheoDoi: async (g, userId) => { const r = await api.del<KhoiGv | { ok: true }>(`${duongGiaoViec(g.loai, g.id)}/theo-doi/${userId}`); return r && 'loai' in r ? r : g; },
};
/** Sau mọi thao tác giao việc: danh sách việc + tab Đang theo dõi + hồ sơ HV đọc lại. */
export const lamMoiGiaoViec = () => { for (const k of ['/my-work', '/tong-quan', '/students', '/y-thuc', '/classes']) invalidate(k); };
/** P1-02 (AUDIT-2111): Đổi người / Hoàn tác đổi người — báo danh sách Công việc giữ panel (việc rời "Của tôi"), KHÔNG qua `onDaDoi` (không tính "xong"). */
export const BaoDaGiao = createContext<(() => void) | null>(null);

/** Đọc khối + bản máy chủ vừa trả sau thao tác (`dat`) — không GET lại. */
export function useGiaoViec(loai: LoaiGiao, id: number | null | undefined) {
  const { data, error, reload } = useApi<KhoiGv>(id ? duongGiaoViec(loai, id) : null, [loai, id]);
  const [ban, setBan] = useState<KhoiGv | null>(null);
  useEffect(() => setBan(null), [data]);
  return { g: ban ?? data, error, reload, dat: setBan };
}

/** GV-3 (PTA chốt): nhãn chip theo VAI máy chủ trả (`theoDoi[].vai`), không theo nguồn — dòng người dùng thêm cũng có nhãn. */
const NHAN_VAI: Record<string, string> = { gvcn: 'GVCN', tvv: 'TVV', gv_ghi: 'GV ghi', head: 'Head', cx: 'CX', admin: 'Admin', qt: 'Quản trị', gv: 'GV' };
/** Trần chữ Mô tả — cùng số với máy chủ (`TRAN_MO_TA`, đếm sau khi bỏ khoảng trắng hai đầu). */
const TRAN_MO_TA = 500;
/** NHẸ HƠN PR-2b (chủ SP 22/11 mục 6.4): theo dõi đông → hiện chừng này tên + "+n người" bấm mở hết tại chỗ. */
export const TRAN_THEO_DOI = 3;
/** Khung khối (v23 `.pht1`): một dải nền phụ, không lưới viền từng dòng; các cụm dàn ngang, xuống dòng khi chật. */
const KHUNG_KHOI = 'relative flex flex-wrap items-center gap-x-7 gap-y-2 rounded-[10px] border px-4 py-2.5 text-sm max-sm:gap-y-0 max-sm:px-3 max-sm:py-1';
const NUT_NHO = 'btn btn-sm min-h-[44px] sm:h-[28px] sm:min-h-[28px]';
/**
 * MỘT CỤM của khối (v23 `.pht1 > span`): nhãn nhỏ · giá trị · nút. 1440: dàn ngang trong hàng; 375: lưới 64 px · giá trị · nút (mỗi cụm một dòng ≥ 44 px).
 * `rong` = cụm chiếm cả hàng (Theo dõi, Mô tả việc, ô đang sửa).
 */
function Cum({ nhan, nut, rong, children }: { nhan: ReactNode; nut?: ReactNode; rong?: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 items-center gap-x-2 gap-y-1 max-sm:grid max-sm:min-h-[44px] max-sm:basis-full max-sm:grid-cols-[64px_minmax(0,1fr)_auto] max-sm:py-1 ${rong ? 'basis-full' : ''}`}>
      <span className="self-center whitespace-nowrap text-xs font-semibold text-faint">{nhan}</span>
      {/* Không nút (ô đang sửa) → giá trị trải hết hàng; có nút → nút đứng ngay sau giá trị (v23: "+" sau tên người theo dõi). */}
      <span className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 ${rong && !nut ? 'flex-1' : ''}`}>{children}</span>
      {nut ?? <span className="hidden max-sm:block" />}
    </div>
  );
}
const THE_VIEN = 'inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 text-xs text-dim';

/** Lỗi thao tác: 409 = người khác vừa đổi → báo tại chỗ + tải lại khối (thao tác người dùng không mất: hộp giữ lựa chọn). */
type Loi = { chu: string; xungDot: boolean };
const loiCua = (e: any): Loi => ({ chu: e?.message ?? t('Không lưu được'), xungDot: e instanceof ApiError && e.status === 409 });

export function KhoiGiaoViec({ g: gGoc, mo = true, dat, reload, gon, chiHan, anTheoDoi, anDoi, onDaDoi, thaoTac = thaoTacChung }: {
  g: KhoiGv;
  /** A1-03 (AUDIT-2111): panel biết việc đã đóng (vd vi phạm trả lại đã xử lý) trước khi khối tải lại — khối chỉ đọc. */ mo?: boolean; dat: (g: KhoiGv) => void; reload: () => void;
  /** VH-2: đường lưu riêng (việc Vận hành). */ thaoTac?: ThaoTacKhoi;
  /** Phần Meeting (G8): ô hẹp hơn, chỉ hai dòng Phụ trách · Hạn — Theo dõi gộp một dòng cho cả việc (`DongTheoDoiChung`). */
  gon?: boolean;
  /** Không vẽ dòng Phụ trách (phần Meeting của người khác — gọn một dòng). */ chiHan?: boolean;
  anTheoDoi?: boolean;
  /** TL-2 (mockup v22 T4a, ghi chú mục 3): việc "Vi phạm bị trả lại" về đúng người ghi — không nút "Đổi" trên web. */ anDoi?: boolean;
  /** Sửa hạn / mô tả / theo dõi xong — nơi gọi báo danh sách. Đổi người đi đường `BaoDaGiao` (không phải "xong"). */
  onDaDoi?: () => void;
}) {
  const { session } = useSession();
  const toi = session?.user?.id;
  const toast = useToast();
  /* A1-03: việc không còn mở → Phụ trách · Hạn · Mô tả · Theo dõi chỉ đọc (không Đổi / Sửa hạn / + Thêm mô tả / ✕ + theo dõi, không "còn n ngày"). */
  const g: KhoiGv = gGoc.mo && mo ? gGoc : { ...gGoc, mo: false, coTheDoiNguoi: false, coTheSuaHan: false, coTheSuaTheoDoi: false };   // R2 C13: Mô tả sửa được cả khi đã đóng (cờ máy chủ giữ)
  const [hop, setHop] = useState(false);
  const nutDoi = useRef<HTMLButtonElement>(null);
  const [vuaGiao, setVuaGiao] = useState<{ chu: string; het: number } | null>(null);
  const [loi, setLoi] = useState<Loi | null>(null);
  const daDoi = (moi: KhoiGv) => { dat(moi); lamMoiGiaoViec(); onDaDoi?.(); };
  const baoDaGiao = useContext(BaoDaGiao);
  const daGiao = (moi: KhoiGv) => { dat(moi); lamMoiGiaoViec(); baoDaGiao?.(); };

  const ten = (n: Nguoi) => n.ten ?? t('(đã xoá)');
  const nguoiPt = g.phuTrach.length ? g.phuTrach.map(ten).join(', ') : thaoTac.trong ?? t('Head chi nhánh');
  const laToi = toi != null && g.phuTrach.some((x) => x.id === toi);
  /* N63 ⑦ (A2-15): "Báo PH kết quả Test" nằm ở "Của tôi" của Head (lời 11/11) — khối ghi "Phụ trách {GVCN} · Head làm được" để khỏi hiểu là việc người khác.
     `tieuDe` do máy chủ dựng (`tenViec('bao_ph_tvv')`), không dịch. */
  const headLam = !laToi && g.mo && g.loai === 'phoi_hop' && g.tieuDe.startsWith('Báo PH kết quả Test') && !!session?.nav?.workOps;
  const theGiao = g.duocGiao
    ? <span className={THE_VIEN} style={{ borderColor: 'var(--line-strong)' }}>{g.giaoBoi?.id === toi ? t('bạn giao') : t('{ten} giao', { ten: g.giaoBoi?.ten ?? '—' })}</span>
    : <span className={THE_VIEN} style={{ borderColor: 'var(--line-strong)' }}>{t('mặc định')}</span>;
  const suaHan = async (han: string | null) => {
    const moi = await thaoTac.suaHan(g, han);
    toast.push('ok', t('Đã lưu hạn'));
    daDoi(moi);
  };
  const hoanTac = async () => {
    setVuaGiao(null);
    try { daGiao(await thaoTac.hoanTacNguoi(g)); toast.push('ok', t('Đã hoàn tác')); }
    catch (e: any) { setLoi(loiCua(e)); if (loiCua(e).xungDot) reload(); }
  };

  return (
    <div className="relative flex flex-col gap-2">
      {vuaGiao && <DaiVuaGiao chu={vuaGiao.chu} het={vuaGiao.het} onHet={() => setVuaGiao(null)} onHoanTac={() => void hoanTac()} />}
      {loi && (
        <p role="alert" className="m-0 flex flex-wrap items-center gap-2 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-sm">
          <b className="text-late">{t('Chưa lưu.')}</b><span className="min-w-0 flex-1">{loi.chu}</span>
          <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setLoi(null)}>{t('Đóng')}</button>
        </p>
      )}
      <div role="group" aria-label={t('Phụ trách, hạn, theo dõi')} className={KHUNG_KHOI}
        style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        {!chiHan && <Cum nhan={t('Phụ trách')} nut={g.coTheDoiNguoi && !anDoi ? <button ref={nutDoi} type="button" className={NUT_NHO} aria-haspopup="dialog" aria-expanded={hop}
          onClick={() => setHop(true)}>{t('Đổi')}</button> : undefined}>
          <b className="font-semibold text-[color:var(--text)]">{nguoiPt}</b>
          {laToi && <span className="text-[13px] text-faint">{t('bạn')}</span>}
          {theGiao}
          {headLam && <span className="text-[13px] text-faint">{t('Head làm được')}</span>}
        </Cum>}
        <DongHan khoi={(giaTri, nut, sua) => <Cum nhan={t('Hạn')} nut={nut ?? undefined} rong={sua}>{giaTri}</Cum>}
          tamDung={g.tamDung} tinhLai={g.hanTinhLai} han={g.han} hanMacDinh={g.hanMacDinh} hanChon={g.hanChon} xong={!g.mo} suaDuoc={g.coTheSuaHan} onLuu={suaHan} onTaiLai={reload} />
        {!anTheoDoi && <DongTheoDoi ds={[g]} dat={(x) => daDoi(x[0])} reload={reload} thaoTac={thaoTac} />}
        {/* Việc Vận hành (VH-2) có ghi chú riêng (`tasks.note`) — không thêm dòng Mô tả việc của khối. */}
        {g.loai !== 'van_hanh' && (g.moTa || (g.coTheSuaMoTa && !chiHan)) && <DongMoTa g={g} daDoi={daDoi} reload={reload} />}
      </div>
      {hop && (
        <HopNho nhan={t('Đổi người phụ trách')} tren="top-[52px]" onDong={() => { setHop(false); nutDoi.current?.focus(); }}>
          <HopDoiNguoi g={g} thaoTac={thaoTac} onDong={() => { setHop(false); nutDoi.current?.focus(); }} onXong={(moi, tenMoi) => {
            setHop(false); daGiao(moi);
            /* B3-04 (AUDIT-2111): Về mặc định có cùng dải "✓ … · Hoàn tác" như Giao (máy chủ đã lưu bản đảo — `hoanTacDuoc`). */
            const chu = moi.duocGiao ? t('Đã giao cho {ten}', { ten: tenMoi }) : t('Đã về người phụ trách mặc định');
            if (moi.duocGiao || moi.hoanTacDuoc) setVuaGiao({ chu, het: Date.now() + 10_000 });
            else toast.push('ok', chu);
          }} onXungDot={reload} />
        </HopNho>
      )}
    </div>
  );
}

/**
 * GV-3 (N62): dòng "Mô tả" — xem: chữ (giữ xuống dòng) hoặc "Chưa có"; nút "Thêm" / "Sửa" theo cờ `coTheSuaMoTa`. Sửa TẠI CHỖ như "Sửa hạn" (ô chiếm hai cột):
 * ô chữ + bộ đếm "n / 500" · Lưu mô tả · Huỷ sửa · Esc (Ctrl + Enter = Lưu). Quá 500 → không lưu, báo tại ô, chữ giữ nguyên. Xoá hết chữ rồi lưu = bỏ mô tả.
 * 409 (người khác vừa sửa) → báo tại ô + tải lại khối; chữ đang gõ giữ trong ô, lần Lưu sau so với bản mới.
 */
function DongMoTa({ g, daDoi, reload }: { g: KhoiGv; daDoi: (g: KhoiGv) => void; reload: () => void }) {
  const toast = useToast();
  const [sua, setSua] = useState(false);
  const [nhap, setNhap] = useState('');
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<Loi | null>(null);
  const idO = useId();
  const nutSua = useRef<HTMLButtonElement>(null);
  const daMo = useRef(false);
  useEffect(() => {
    if (sua) document.getElementById(idO)?.focus();
    else if (daMo.current) nutSua.current?.focus();
    daMo.current = sua;
  }, [sua, idO]);
  const cu = g.moTa?.noiDung ?? null;
  const dai = nhap.trim().length;
  const qua = dai > TRAN_MO_TA;
  const khongDoi = nhap.trim() === (cu ?? '');
  useBaoDangSua(sua && !khongDoi);   // B3-05: gõ mô tả chưa lưu → Đóng panel hỏi "Bỏ chữ đang gõ?" như các form khác
  const luu = async () => {
    if (qua || khongDoi || dang) return;
    setDang(true); setLoi(null);
    try {
      const moi = await api.put<KhoiGv>(`${duongGiaoViec(g.loai, g.id)}/mo-ta`, { moTa: nhap.trim(), moTaCu: cu });
      setSua(false); daDoi(moi);
      toast.push('ok', nhap.trim() ? t('Đã lưu mô tả việc') : t('Đã bỏ mô tả việc'));
    } catch (e: any) {
      const l = loiCua(e); setLoi(l);
      if (l.xungDot) reload();
      document.getElementById(idO)?.focus();
    } finally { setDang(false); }
  };
  const moSua = () => { setNhap(cu ?? ''); setLoi(null); setSua(true); };
  /* Rà PTA (3): chưa có mô tả → một cụm thấp "Mô tả việc · + Thêm mô tả việc" (không ô trống cao). */
  if (!cu && !sua) return (
    <Cum nhan={t('Mô tả việc')} rong>
      <button ref={nutSua} type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={moSua}>{t('+ Thêm mô tả việc')}</button>
    </Cum>
  );
  if (!sua) return (
    <Cum nhan={t('Mô tả việc')} rong nut={g.coTheSuaMoTa ? <button ref={nutSua} type="button" className={NUT_NHO} onClick={moSua}>{t('Sửa')}</button> : undefined}>
      <span className="min-w-0 whitespace-pre-wrap break-words text-[color:var(--text)]">{cu}</span>
    </Cum>
  );
  return (
    <Cum nhan={<label htmlFor={idO}>{t('Mô tả việc')}</label>} rong>
      {/* Esc chỉ đóng ô sửa (giữ panel) — KhungPanel bỏ qua Esc đã `preventDefault`. */}
      <div className="flex w-full flex-col items-stretch gap-2 py-1" onKeyDown={(e) => { if (e.key === 'Escape' && !dang) { e.preventDefault(); setSua(false); } }}>
        <textarea id={idO} className="field min-h-[72px] w-full resize-y py-2 text-sm" rows={3} name="mo-ta" autoComplete="off" value={nhap} readOnly={dang}
          aria-invalid={qua || undefined} aria-describedby={`${idO}-dem`} placeholder={t('Cần làm gì, lưu ý gì (tuỳ chọn)')}
          onChange={(e) => setNhap(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }} />
        <span className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang || qua || khongDoi} onClick={() => void luu()}>{dang ? t('Đang lưu…') : t('Lưu mô tả việc')}</button>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang} onClick={() => setSua(false)}>{t('Huỷ sửa')}</button>
          <span id={`${idO}-dem`} aria-live="polite" className={`ml-auto text-xs tabular-nums ${qua ? 'font-semibold text-late' : 'text-faint'}`}>
            {qua && <>{t('Quá {n} ký tự — bớt chữ để lưu', { n: dai - TRAN_MO_TA })} · </>}<span className="whitespace-nowrap">{dai} / {TRAN_MO_TA}</span>
          </span>
        </span>
        {loi && (
          <span role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-sm">
            <b className="text-late">{t('Chưa lưu.')}</b><span className="min-w-0 flex-1">{loi.xungDot
              ? t('Người khác vừa sửa mô tả việc: “{chu}”. Chữ bạn gõ vẫn ở ô — bấm Lưu mô tả việc để thay.', { chu: cu ?? t('Chưa có') })
              : loi.chu}</span>
          </span>
        )}
      </div>
    </Cum>
  );
}

/** Dải "✓ Đã giao cho … · Hoàn tác · n giây" (mockup G3b) — 10 giây, đếm lùi trên nút. */
function DaiVuaGiao({ chu, het, onHet, onHoanTac }: { chu: string; het: number; onHet: () => void; onHoanTac: () => void }) {
  const [con, setCon] = useState(Math.ceil((het - Date.now()) / 1000));
  useEffect(() => {
    const h = setInterval(() => { const s = Math.ceil((het - Date.now()) / 1000); if (s <= 0) onHet(); else setCon(s); }, 500);
    return () => clearInterval(h);
  }, [het]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="status" className="flex min-h-[40px] items-center gap-2.5 rounded-lg border border-ok-line bg-ok-bg py-1.5 pl-3 pr-2 text-sm">
      <b className="font-bold text-ok" aria-hidden>✓</b><span className="min-w-0 flex-1">{chu}</span>
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
    x.theoDoi.forEach((n) => them(n, NHAN_VAI[n.vai ?? n.nguon] ? dich(NHAN_VAI[n.vai ?? n.nguon]) : t('đang theo dõi')));
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
 * HỘP NHỎ nổi ngay dưới khối (mockup G3a / G4a), mép phải thẳng nút. SUA-2211-A (chủ SP 22/11 ý 7): vẽ ra lớp trên cùng (`NoiTren`) neo một mốc vô hình
 * đúng chỗ cũ — thân panel cuộn không cắt hộp; thiếu chỗ dưới thì lật lên / thấp lại + cuộn trong.
 * Bấm ngoài / Esc (khi ô chọn người không tự xử lý Esc) → đóng, focus về nút mở. < 640 px: hết bề ngang khối.
 */
export function HopNho({ nhan, tren, onDong, children }: { nhan: string; tren: string; onDong: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const neo = useRef<HTMLSpanElement>(null);
  const bam = useBamNgoai(true, onDong, ref);
  return (
    <>
    {/* Mốc neo vô hình đúng chỗ hộp cũ (mép phải khối, rộng 420 / hết khối khi hẹp). */}
    <span ref={neo} aria-hidden className={`pointer-events-none absolute right-0 h-0 w-[420px] max-w-full ${tren}`} />
    <NoiTren ref={ref} neo={neo} canh="phai" cach={4} rongNeo {...bam} role="dialog" aria-label={nhan} aria-modal="false"
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
      className="rounded-xl border"
      style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)', boxShadow: 'var(--bong-noi)' }}>{children}</NoiTren>
    </>
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
function HopDoiNguoi({ g, thaoTac, onDong, onXong, onXungDot }: { g: KhoiGv; thaoTac: ThaoTacKhoi; onDong: () => void; onXong: (g: KhoiGv, ten: string) => void; onXungDot: () => void }) {
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
      onXong(await thaoTac.doiNguoi(g, userId), ten);
    } catch (e: any) { const l = loiCua(e); setLoi(l); if (l.xungDot) onXungDot(); } finally { setDang(false); }
  };
  const id = chon?.kieu === 'tai_khoan' ? chon.id : null;
  const o = useConTroO();
  return (
    <div ref={o} className="grid">
      <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <b className="text-[14px] font-bold">{t('Đổi người phụ trách')}</b>
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
        {!thaoTac.khongMacDinh && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" disabled={!lechMacDinh || dang} onClick={() => void gui(null, tenMd)}>
          {lechMacDinh ? t('Về mặc định · {ten}', { ten: tenMd }) : t('Về mặc định')}</button>}
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
export function DongTheoDoi({ ds, dat, reload, rieng, thaoTac = thaoTacChung }: { ds: KhoiGv[]; dat: (ds: KhoiGv[]) => void; reload: () => void; thaoTac?: ThaoTacKhoi;
  /** Dòng đứng riêng (G8, dưới các phần Meeting) — tự vẽ khung. */ rieng?: boolean }) {
  const { session } = useSession();
  const toi = session?.user?.id;
  const toast = useToast();
  const [hop, setHop] = useState(false);
  const [moHet, setMoHet] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const nguoi = new Map<number, Nguoi & { nguon: string; vai: string | null }>();
  /* A3-10 (AUDIT-2111): dòng Theo dõi chung của nhiều phần (Meeting) bỏ người đang phụ trách một phần của chính việc đó (theo dõi = người chỉ xem). */
  const dangPt = new Set(ds.flatMap((g) => g.phuTrach.map((x) => x.id)));
  for (const g of ds) for (const n of g.theoDoi) if (!nguoi.has(n.id) && !dangPt.has(n.id)) nguoi.set(n.id, n);
  const suaDuoc = ds.some((g) => g.coTheSuaTheoDoi);
  const goi = async (f: (g: KhoiGv) => Promise<KhoiGv> | null) => {
    const moi = await Promise.all(ds.map(async (g) => (await f(g)) ?? g));
    dat(moi); lamMoiGiaoViec();
  };
  const bo = async (n: Nguoi) => {
    try {
      await goi((g) => (g.theoDoi.some((x) => x.id === n.id) ? thaoTac.boTheoDoi(g, n.id) : null));
      toast.hoanTac(n.id === toi ? t('Đã bỏ theo dõi') : t('Đã bỏ {ten} khỏi theo dõi', { ten: n.ten ?? '' }), () => {
        void goi((g) => (g.coTheSuaTheoDoi && g.mo ? thaoTac.themTheoDoi(g, [n.id]) : null)).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
      }, { key: `bo-theo-doi:${n.id}` });
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); if (loiCua(e).xungDot) reload(); }
  };
  const chip = (n: Nguoi & { nguon: string; vai: string | null }) => {
    const xBo = suaDuoc || n.id === toi;
    const vai = n.id === toi ? t('bạn') : NHAN_VAI[n.vai ?? n.nguon] ? dich(NHAN_VAI[n.vai ?? n.nguon]) : null;   /* đường không trả vai (Vận hành /mgmt-tasks) → nhãn theo nguồn như trước */
    return (
      <span key={n.id} className={`${CHIP_NGUOI} ${xBo ? 'pr-[3px]' : 'pr-2.5'}`}
        style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
        {n.ten ?? t('(đã xoá)')}{vai && <small className="text-xs text-faint">{vai}</small>}
        {xBo && <button type="button" className={NUT_X_CHIP}
          aria-label={n.id === toi ? t('Bỏ theo dõi') : t('Bỏ {ten} khỏi theo dõi', { ten: n.ten ?? '' })} onClick={() => void bo(n)}>✕</button>}
      </span>
    );
  };
  const ds1 = [...nguoi.values()];
  const an = moHet ? 0 : Math.max(0, ds1.length - TRAN_THEO_DOI);
  const dong = <Cum nhan={t('Theo dõi')} rong nut={suaDuoc && ds.some((g) => g.mo)
    ? <button ref={nut} type="button" className="inline-grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-dashed bg-transparent p-0 text-base text-dim hover:text-[color:var(--text)] sm:h-[28px] sm:min-h-[28px] sm:w-[28px] sm:min-w-[28px]"
      style={{ borderColor: 'var(--line-strong)' }} aria-label={t('Thêm người theo dõi')} aria-haspopup="dialog" aria-expanded={hop} onClick={() => setHop(true)}>+</button> : undefined}>
    {ds1.length ? ds1.slice(0, ds1.length - an).map(chip) : <span className="text-sm text-faint">{t('Chưa có')}</span>}
    {/* Chủ SP 22/11 (6.4): chật → "+n người", bấm mở hết tại chỗ; mở rồi có "Thu gọn". */}
    {ds1.length > TRAN_THEO_DOI && <button type="button" className="link min-h-[44px] appearance-none whitespace-nowrap border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0"
      aria-expanded={moHet} onClick={() => setMoHet((x) => !x)}>{moHet ? t('Thu gọn') : t('+{n} người', { n: an })}</button>}
    {hop && (
      <HopNho nhan={t('Thêm người theo dõi')} tren="top-full" onDong={() => { setHop(false); nut.current?.focus(); }}>
        <HopThemTheoDoi ds={ds} da={new Set(nguoi.keys())} onDong={() => { setHop(false); nut.current?.focus(); }}
          onThem={async (ids) => { await goi((g) => (g.coTheSuaTheoDoi && g.mo ? thaoTac.themTheoDoi(g, ids) : null)); setHop(false); nut.current?.focus(); }} />
      </HopNho>
    )}
  </Cum>;
  if (!rieng) return dong;
  return <div className={KHUNG_KHOI} style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>{dong}</div>;
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
        <div className="grid min-w-0 flex-1 gap-0.5"><b className="text-[14px] font-bold">{t('Thêm người theo dõi')}</b><span className="text-[13px] text-dim">{ds[0]?.tieuDe}</span></div>
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
      {/* N63 ⑨ (B1-06): TVV của em vẫn ghi Báo PH sau khi việc giao người khác (quyền vai) — không nói "chỉ xem". */}
      <span className="min-w-0 flex-1">{g.loai === 'bao_ph' && g.theoDoi.some((x) => x.id === session?.user?.id && x.vai === 'tvv')
        ? t('Bạn đang theo dõi · TVV của em vẫn ghi Báo PH được') : t('Bạn đang theo dõi · chỉ xem')}</span>
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
    /* TL-2: hạn do máy tính lại khi GV gửi lại / trả lời (`mac_dinh` 2) — người = GV thao tác. */
    if (l.truong === 'han_tinh_lai') return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${t('Hạn tính lại sau khi GV gửi lại')}`, phu: [`${ngay(l.cu)} → ${ngay(l.moi)}`] };
    /* GV-3 (N62): mô tả — dòng phụ là chữ mới (cắt 160 ký tự); bỏ mô tả → chữ cũ. */
    if (l.truong === 'mo_ta') {
      const chu = (l.moi ?? l.cu ?? '').replace(/\s+/g, ' ');
      return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${!l.cu ? t('Thêm mô tả việc') : l.moi ? t('Sửa mô tả việc') : t('Bỏ mô tả việc')}`, phu: [chu.length > 160 ? `${chu.slice(0, 160)}…` : chu] };
    }
    const kq = (() => { try { const x = JSON.parse(l.moi ?? 'null'); return x ? [x.ngayGio ? t('họp {ngay}', { ngay: lucVn(x.ngayGio.replace(' ', 'T')) }) : null, x.ketQua].filter(Boolean) as string[] : []; } catch { return []; } })();
    return { luc: l.luc, nguoi: l.nguoi, tieu: `${dau}${l.truong === 'xong' ? t('Hoàn thành') : l.truong === 'sua' ? t('Sửa kết quả') : t('Hoàn tác hoàn thành')}`, phu: kq };
  });
}

/** Ngày hôm nay nghiệp vụ (cho `dongLichSuGiao`). */
export const useHn = () => useNgayNghiepVu().homNay ?? '';
