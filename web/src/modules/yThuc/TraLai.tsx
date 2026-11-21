import { useEffect, useId, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Truong, useNhap } from '../../ui/KhungPanel.tsx';
import { NutDichGop, useDichGop } from '../../ui/ChuDich.tsx';
import { DsLichSu } from '../../ui/LichSuThayDoi.tsx';
import { CHU_TOI_THIEU, hanTraLai, nhanLichSuViPham, shortDate, tenMon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { ChipMon } from './BangLan.tsx';
import { BadgeHan, NhanChoGv } from '../../ui/Nhan.tsx';
import { lucVn } from '../congViec/gioVn.ts';

/**
 * TRẢ LẠI VI PHẠM (TL-2, luật N61; mockup `thiet-ke/v22/tra-lai-vi-pham.html` T1–T3, T6b, T7b, T8b) — phần dùng chung phía TVV:
 * ô Lý do (≥ 8, báo tại ô, nháp không mất) · khối "Trả lại" mở tại chỗ · dải "Chờ GV sửa" (Rút) · dải "✓ Đã …" (Hoàn tác 60 giây) ·
 * danh sách vi phạm của panel Báo PH (dòng bấm được, MỘT dòng mở một lúc, chi tiết ngay dưới dòng — không panel lồng panel).
 * Máy chủ: `POST /y-thuc/tra-lai`, `…/:id/rut`, `…/:id/hoan-tac` (TL-1). Quyền + luật chặn kiểm ở máy chủ; nút theo cờ máy chủ.
 */

/** Yêu cầu trả lại đang mở (`traLaiDangMo` máy chủ) — panel Báo PH / chi tiết vi phạm đọc cùng câu. */
export type TraLaiMo = { id: number; violationId: number | null; measureId: number | null; han: string; nguoiTra: number; lyDo: string; traLuc: string; nguoiNhan: string | null };
/** `GET /y-thuc/tra-lai/:id` (máy chủ `xemTraLai`). */
export type TraLaiView = {
  id: number; studentId: number; tenEm: string; violationId: number | null; measureId: number | null; nhanXuLy: string | null;
  lyDo: string; nguoiTra: { id: number; ten: string | null }; traLuc: string;
  han: string; hanMacDinh: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'rut'; ketQua: string | null; nhanKetQua: string | null;
  traLoi: string | null; xongLuc: string | null; xongBoi: string | null; phuTrach: { id: number; ten: string | null }[];
  viPham: { id: number; ten: string; moTa: string; skill: string | null; occurredOn: string; classCode: string | null }[];
  /** Lần xử lý chứa vi phạm (một vi phạm) / chính lần đó + số vi phạm của lần (T4c "Còn lại n vi phạm trong …"). */
  lanXuLy: { id: number; nhan: string; soViPham: number } | null;
  coTheRut: boolean; hoanTacDuoc: boolean; coTheLam: boolean; coTheXoa: boolean; coTheThuHoi: boolean;
};
export type ViPhamBaoPh = { id: number; ngay: string; ten: string; moTa: string; skill: string | null; nguoiGhi?: string | null; ghiLuc?: string | null; daSua?: boolean };

/** Sau mọi thao tác trả lại: danh sách việc + hồ sơ HV + tab Ý thức + chuông đọc lại. */
const KHOA_TRA_LAI = ['/my-work', '/tong-quan', '/students', '/y-thuc', '/classes', '/violations', '/notifications', '/giao-viec'];
export const lamMoiTraLai = () => { for (const k of KHOA_TRA_LAI) invalidate(k); };
export const HOAN_TAC_MS = 60_000;

export const guiTraLai = async (body: { violationId: number } | { measureId: number }, lyDo: string) => {
  const r = await api.post<TraLaiView>('/y-thuc/tra-lai', { ...body, lyDo });
  lamMoiTraLai();
  return r;
};
export const rutTraLai = async (id: number) => { const r = await api.post<TraLaiView>(`/y-thuc/tra-lai/${id}/rut`); lamMoiTraLai(); return r; };
export const hoanTacTraLai = async (id: number) => { await api.post(`/y-thuc/tra-lai/${id}/hoan-tac`); lamMoiTraLai(); };

/** "GV quá hạn n ngày" (T7b) — so hạn sửa với hôm nay nghiệp vụ; 0 = chưa quá. */
export const soNgayQua = (han: string, hn: string): number => (hn && han < hn ? Math.round((Date.parse(hn) - Date.parse(han)) / 86_400_000) : 0);
export const loiLyDo = (s: string): string | null => {
  const n = s.trim().length;
  return n >= CHU_TOI_THIEU ? null : t('Cần ít nhất {min} ký tự (đang {n})', { min: CHU_TOI_THIEU, n });
};

/** Thẻ chữ nền lam "Chờ GV sửa" (không chỉ màu — có chữ). */
export function TheChoGv({ chu }: { chu?: string }) {
  return <NhanChoGv>{chu ?? t('Chờ GV sửa')}</NhanChoGv>;
}

/**
 * Ô "Lý do" (T1, T2b, T2c): nháp theo việc (`useNhap`, không mất chữ khi đóng / mở lại), bộ đếm, lỗi báo TẠI Ô sau lần bấm đầu. Lỗi máy chủ hiện dưới ô.
 * Hàng nút: "Về {người nhận} · hạn sửa {ngày}" · Huỷ · Trả lại. Enter không gửi (ô nhiều dòng); Ctrl+Enter gửi.
 */
export function KhoiTraLai({ khoa, nhan = t('Lý do trả lại'), goiY, veAi, hn, onHuy, onGui, nutGui = t('Trả lại') }: {
  khoa: string; nhan?: string; goiY?: string; veAi: string | null; hn: string; onHuy: () => void; nutGui?: string;
  /** Gửi lý do đã kiểm ≥ 8 — ném lỗi = giữ chữ, báo lỗi máy chủ. */
  onGui: (lyDo: string) => Promise<void>;
}) {
  const [lyDo, setLyDo, daGui] = useNhap(`tra-lai-${khoa}`, '');
  const [bam, setBam] = useState(false);
  const [dang, setDang] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const loi = bam ? loiLyDo(lyDo) : null;
  const han = hn ? shortDate(hanTraLai(hn), hn) : null;
  const gui = async () => {
    setBam(true);
    if (loiLyDo(lyDo) || dang) return;
    setDang(true); setLoiMay(null);
    try { await onGui(lyDo.trim()); daGui(lyDo); setLyDo(''); }
    catch (e: any) { setLoiMay(e?.message ?? t('Không lưu được')); } finally { setDang(false); }
  };
  return (
    <div className="grid gap-2.5">
      <Truong nhan={nhan} batBuoc loi={loi ?? loiMay}>
        <textarea className="field w-full" name="ly-do-tra-lai" rows={2} maxLength={500} autoComplete="off" autoFocus value={lyDo} placeholder={goiY ?? t('Ghi rõ cần GV sửa gì — PH sẽ hỏi')}
          onChange={(e) => { setLyDo(e.target.value); if (loiMay) setLoiMay(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void gui(); } }} />
      </Truong>
      <div className="flex flex-wrap items-center gap-2">
        {(veAi || han) && <span className="min-w-0 text-xs text-dim">{[veAi && t('Về {ten}', { ten: veAi }), han && t('hạn sửa {ngay}', { ngay: han })].filter(Boolean).join(' · ')}</span>}
        <span className="ml-auto flex gap-2">
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" disabled={dang} onClick={onHuy}>{t('Đóng')}</button>
          <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[32px]" disabled={dang} onClick={() => void gui()}>{dang ? t('Đang lưu…') : nutGui}</button>
        </span>
      </div>
    </div>
  );
}

/** Dải "✓ Đã trả lại cho …" / "✓ Đã rút · …" + Hoàn tác (T3a, T3c) — tự ẩn sau `het`; lỗi Hoàn tác báo trong dải. */
export function DaiDaLam({ chu, het, onHet, onHoanTac }: { chu: string; het: number; onHet: () => void; onHoanTac: (() => Promise<void>) | null }) {
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { const h = setTimeout(onHet, Math.max(0, het - Date.now())); return () => clearTimeout(h); }, [het]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* A3-07 (AUDIT-2111): dải nằm đầu thân panel cuộn — lưu xong (ô lý do giữa panel) cuộn dải vào tầm nhìn để thấy "Hoàn tác". */
  const dai = useRef<HTMLDivElement>(null);
  useEffect(() => { dai.current?.scrollIntoView({ block: 'nearest' }); }, [het]);
  return (
    <div ref={dai} role="status" className="flex min-h-[40px] flex-wrap items-center gap-2.5 rounded-lg border border-ok-line bg-ok-bg py-1.5 pl-3 pr-2 text-sm">
      <b className="font-bold text-ok" aria-hidden>✓</b><span className="min-w-0 flex-1">{chu}</span>
      {loi && <span className="w-full text-[13px] text-bad">⚠ {loi}</span>}
      {onHoanTac && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={dang} onClick={() => {
        setDang(true); setLoi(null);
        onHoanTac().catch((e: any) => setLoi(e?.message ?? t('Không lưu được'))).finally(() => setDang(false));
      }}>{t('Hoàn tác')}</button>}
    </div>
  );
}

/**
 * Dải "Chờ GV sửa" (T3a; T7b khi GV quá hạn: viền đỏ + "GV quá hạn n ngày") — vi phạm nào · ai sửa · hạn sửa · «lý do» · Rút (phía TVV, một bấm + Hoàn tác).
 */
export function DaiChoGvSua({ y, moTa, hn, onRut }: { y: TraLaiMo; moTa: string; hn: string; onRut: (() => Promise<void>) | null }) {
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const qua = soNgayQua(y.han, hn);
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-[10px] border px-3 py-2.5 text-sm ${qua ? 'border-late-line bg-late-bg' : 'bg-doing-bg'}`}
      style={qua ? undefined : { borderColor: 'var(--line-strong)' }}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <b className="font-bold">{t('Chờ GV sửa')}</b>
        <span className="text-dim">{[moTa, y.nguoiNhan].filter(Boolean).join(' · ')}</span>
        {qua ? <BadgeHan muc="qua">{t('GV quá hạn {n} ngày', { n: qua })}</BadgeHan>
          : <span className="whitespace-nowrap text-[13px] tabular-nums text-dim">{t('hạn sửa {ngay}', { ngay: shortDate(y.han, hn) })}</span>}
      </div>
      {onRut ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={dang} onClick={() => {
        setDang(true); setLoi(null);
        onRut().catch((e: any) => setLoi(e?.message ?? t('Không lưu được'))).finally(() => setDang(false));
      }}>{t('Rút')}</button> : <span />}
      <p className="col-span-2 m-0 whitespace-pre-line break-words text-slate-200">«{y.lyDo}»</p>
      {loi && <p role="alert" className="col-span-2 m-0 text-[13px] text-bad">⚠ {loi}</p>}
    </div>
  );
}

/** Chi tiết vi phạm: lịch sử (cũ → mới) — MỘT request khi mở (`/violations/:id`), chỉ khi người dùng mở "Lịch sử vi phạm". */
export function LichSuViPham({ id, hn }: { id: number; hn: string }) {
  const [mo, setMo] = useState(false);
  const { data } = useApi<{ history: { id: number; field: string; oldValue: string | null; newValue: string | null; actorUserId: number | null; actorName: string | null; createdAt: string }[] }>(mo ? `/violations/${id}` : null, [id, mo]);
  const ma = useId();
  return (
    <div>
      <button type="button" aria-expanded={mo} aria-controls={ma} onClick={() => setMo((x) => !x)}
        className="inline-flex min-h-[44px] items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-dim hover:text-[color:var(--accent)] sm:min-h-0">
        <span aria-hidden className={`inline-block transition-transform ${mo ? 'rotate-90' : ''}`}>›</span>{t('Lịch sử vi phạm')}{data ? ` · ${data.history.length}` : ''}
      </button>
      {mo && <div id={ma} className="pt-1.5">
        {!data ? <span className="text-[13px] text-dim">{t('Đang tải…')}</span>
          : <DsLichSu dong={[...data.history].reverse().map((h) => {
            const n = nhanLichSuViPham(h, hn);
            return { key: h.id, gio: lucVn(h.createdAt), ai: h.actorName, viec: n.truong ? `${n.truong}` : n.moi, phu: n.truong ? [`${n.cu} → ${n.moi}`] : [] };
          })} />}
      </div>}
    </div>
  );
}

/**
 * DANH SÁCH VI PHẠM của panel Báo PH (T1, T3a, T6b, T8b): dòng bấm được (ngày · môn · tên · người ghi · ›), MỘT dòng mở một lúc, chi tiết ngay dưới dòng —
 * Ghi lúc (ngày giờ · người ghi · buổi) · Nội dung (+ Dịch) · Lịch sử vi phạm · "Trả lại" (phía TVV, việc còn mở, vi phạm chưa đang chờ). 375: bỏ cột người ghi.
 * Dữ liệu dòng = dữ liệu panel đã nạp (không request thêm khi mở dòng).
 */
export function DsViPhamBaoPh({ viPham, mo: dsMo, coTheTraLai, hn, onTraLai }: {
  viPham: ViPhamBaoPh[]; mo: TraLaiMo[]; coTheTraLai: boolean; hn: string;
  onTraLai: (vid: number, lyDo: string) => Promise<void>;
}) {
  const [moId, setMoId] = useState<number | null>(null);
  const [nhap, setNhap] = useState<number | null>(null);
  return (
    <ul className="m-0 list-none overflow-hidden rounded-[10px] border p-0" style={{ borderColor: 'var(--line)' }} aria-label={t('Vi phạm')}>
      {viPham.map((x, i) => (
        <DongVp key={x.id} x={x} dau={i === 0} mo={moId === x.id} cho={dsMo.find((y) => y.violationId === x.id) ?? null} hn={hn}
          traLaiDuoc={coTheTraLai && !dsMo.some((y) => y.violationId === x.id)} dangNhap={nhap === x.id}
          onBam={() => { setMoId(moId === x.id ? null : x.id); setNhap(null); }} onNhap={(b) => setNhap(b ? x.id : null)}
          onTraLai={async (lyDo) => { await onTraLai(x.id, lyDo); setNhap(null); }} />
      ))}
    </ul>
  );
}

function DongVp({ x, dau, mo, cho, hn, traLaiDuoc, dangNhap, onBam, onNhap, onTraLai }: {
  x: ViPhamBaoPh; dau: boolean; mo: boolean; cho: TraLaiMo | null; hn: string; traLaiDuoc: boolean; dangNhap: boolean;
  onBam: () => void; onNhap: (b: boolean) => void; onTraLai: (lyDo: string) => Promise<void>;
}) {
  const ma = useId();
  const d = useDichGop([
    { chu: x.ten, nguon: { bang: 'violations', id: x.id, cot: 'ten' } },
    { chu: x.moTa, nguon: { bang: 'violations', id: x.id, cot: 'mo_ta' } },
  ]);
  const ten = d.chu(0).trim() || t('Vi phạm');
  return (
    <li className={dau ? '' : 'border-t'} style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} aria-controls={mo ? ma : undefined} onClick={onBam}
        className="grid min-h-[44px] w-full appearance-none grid-cols-[48px_28px_minmax(0,1fr)_auto_16px] items-center gap-2 border-0 px-3 py-1.5 text-left font-[inherit] text-sm text-[color:var(--text)] hover:bg-[color:var(--accent-soft)] max-sm:grid-cols-[44px_26px_minmax(0,1fr)_16px]"
        style={mo ? { background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' } : { background: 'transparent' }}>
        <span className="text-[13px] font-medium tabular-nums text-dim">{shortDate(x.ngay, hn)}</span>
        <ChipMon skill={x.skill} />
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><span className="min-w-0 break-words">{ten}</span>
          {cho ? <TheChoGv /> : x.daSua ? <span className="inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 text-xs text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('đã sửa')}</span> : null}</span>
        <span className="whitespace-nowrap text-xs text-faint max-sm:hidden">{x.nguoiGhi ?? ''}</span>
        <span aria-hidden className={`text-faint transition-transform ${mo ? 'rotate-90' : ''}`}>›</span>
      </button>
      {mo && (
        <div id={ma} className="grid gap-2.5 border-t py-2.5 pl-[68px] pr-3 text-sm max-sm:pl-3" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--accent-soft) 40%, var(--surface))' }}>
          <dl className="m-0 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1 max-sm:grid-cols-1">
            <dt className="text-[13px] text-dim">{t('Ghi lúc')}</dt>
            <dd className="m-0 tabular-nums">{[x.ghiLuc ? lucVn(x.ghiLuc) : shortDate(x.ngay, hn), x.nguoiGhi, x.skill ? t('buổi {mon}', { mon: tenMon(null, x.skill) }) : null].filter(Boolean).join(' · ')}</dd>
            <dt className="text-[13px] text-dim">{t('Nội dung')}</dt>
            <dd className="m-0 whitespace-pre-wrap break-words">{ten}{x.moTa.trim() ? <><br /><span className="text-slate-300">{d.chu(1)}</span></> : null} <NutDichGop d={d} /></dd>
          </dl>
          {(x.daSua || cho) && <LichSuViPham id={x.id} hn={hn} />}
          {dangNhap
            ? <KhoiTraLai khoa={String(x.id)} veAi={x.nguoiGhi ?? null} hn={hn} onHuy={() => onNhap(false)} onGui={onTraLai} />
            : traLaiDuoc && <div className="flex justify-end"><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => onNhap(true)}>{t('Trả lại')}</button></div>}
        </div>
      )}
    </li>
  );
}
