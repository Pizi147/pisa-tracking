import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { fmtDateTime } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import type { GhiChuLich } from './kieu.ts';

/** Khoá một ghi chú: em × đợt (`dot` = `khoaDot`), hoặc cả lớp (không `studentId`). */
export type KhoaGhiChu = { classId: number; studentId?: number | null; dot?: string | null };

/** POST /ke-hoach-test/ghi-chu — chữ trống = xoá. CHỈ ghi chú, không dời lịch (C21). */
export async function luuGhiChu(k: KhoaGhiChu, noiDung: string): Promise<GhiChuLich | null> {
  const r = await api.post<{ ghiChu: GhiChuLich | null }>('/ke-hoach-test/ghi-chu', { ...k, noiDung });
  invalidate('/ke-hoach-test');
  return r.ghiChu;
}

export const GHI_CHU_TOI_DA = 500;
/** `Nguyễn Khánh Vy · 12/09/2026 10:20` */
export const chuTacGia = (g: GhiChuLich) => [g.ai, fmtDateTime(g.luc)].filter(Boolean).join(' · ');

/**
 * Ghi chú SỬA TẠI CHỖ (OV-15c, C21 — mockup 4 khung 1): một dòng (dài thì "…", rê chuột / chạm xem đủ); bấm = ô gõ, Enter lưu · Esc huỷ.
 * Đang lưu / lỗi hiện ngay dưới ô, chữ đang gõ KHÔNG mất khi lỗi. `them` = chữ nút khi chưa có ghi chú (ghi chú lớp); không có thì không vẽ gì.
 */
export function GhiChuTaiCho({ khoa, ghiChu, onDoi, them, nhan, className = '' }: {
  khoa: KhoaGhiChu; ghiChu: GhiChuLich | null; onDoi: () => void; them?: string; nhan: string; className?: string;
}) {
  const [sua, setSua] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const o = useRef<HTMLInputElement>(null);
  useEffect(() => { if (sua !== null) o.current?.focus(); }, [sua !== null]);   // eslint-disable-line react-hooks/exhaustive-deps

  const luu = async () => {
    if (sua === null || busy) return;
    if (sua.trim() === (ghiChu?.noiDung ?? '')) { setSua(null); return; }
    setBusy(true); setLoi(null);
    try { await luuGhiChu(khoa, sua); setSua(null); onDoi(); } catch (e: any) { setLoi(e.message ?? t('Chưa lưu — thử lại')); } finally { setBusy(false); }
  };

  if (sua !== null) {
    return (
      <div className={className}>
        <input ref={o} className="field w-full min-h-[44px] py-0.5 text-xs sm:min-h-[28px]" value={sua} maxLength={GHI_CHU_TOI_DA} disabled={busy} aria-label={nhan}
          onChange={(e) => setSua(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); void luu(); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSua(null); setLoi(null); }
          }} />
        <div className="mt-0.5 text-left text-[11px] text-slate-500" role="status">
          {busy ? t('Đang lưu…') : loi ? <span className="text-bad">{loi}</span> : t('Enter lưu · Esc huỷ')}
        </div>
      </div>
    );
  }
  if (!ghiChu) {
    return them ? (
      <button type="button" className={`btn btn-sm btn-ghost min-h-[44px] sm:min-h-0 ${className}`} onClick={() => setSua('')}>{them}</button>
    ) : null;
  }
  return (
    <button type="button" onClick={() => setSua(ghiChu.noiDung)} title={`${ghiChu.noiDung}\n${chuTacGia(ghiChu)}`} aria-label={`${nhan}: ${ghiChu.noiDung}`}
      className={`block w-full min-h-[24px] max-sm:min-h-[44px] truncate border-0 bg-transparent p-0 text-left text-[11.5px] italic text-slate-400 hover:text-slate-200 ${className}`}>
      {ghiChu.noiDung}
    </button>
  );
}
