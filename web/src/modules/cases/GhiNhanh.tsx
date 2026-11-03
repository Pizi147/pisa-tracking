import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { NutChon } from '../../ui/ui.tsx';
import { CanLam, NutChu } from '../../ui/KhuonViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { DemChu, useChoHoanTac, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { FOLLOWUP_OUTCOMES, GOI_Y_KET_QUA_PA, TRAN_CHU, ketQuaNhanh, luuRoiTiep, outcomeLabelFor } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Chữ đã gõ ở dòng ghi nhanh → panel lớn ("Điều chỉnh / Kết thúc…" mang chữ sang, mockup OV-13 §1). `GhiKetQuaPanel` đọc rồi xoá. */
export const nhapKetQua = new Map<number, NhapKetQua>();
/** Nháp Ghi kết quả: dòng ghi nhanh chỉ có `outcome` + `note`; panel lớn (Hoàn tác) lưu thêm mọi ô khác (`GhiKetQuaPanel`). */
export type NhapKetQua = { outcome: string; note: string; khac?: Record<string, any> };
/** Mockup OV-13 §1: "Hoàn tác 10 giây" ở dòng đã lưu. */
const HOAN_TAC_DONG_MS = 10_000;

export type DaLuuNhanh = { paId: number; followupId: number | null; outcome: string; note: string; hanKe: string | null };

const lamMoi = () => { for (const k of ['/cases', '/my-work', '/students', '/tong-quan', '/hoc-vien-lop', '/followups']) invalidate(k); };

/** Hoàn tác một lần ghi nhanh (`POST /followups/:id/hoan-tac`) — dòng đã lưu và dải việc vừa lưu ở Công việc (6b-3) dùng chung; chữ trả về ô ghi nhanh. */
export async function hoanTacNhanh(kq: DaLuuNhanh): Promise<void> {
  await api.post(`/followups/${kq.followupId}/hoan-tac`);
  lamMoi();
  nhapKetQua.set(kq.paId, { outcome: kq.outcome, note: kq.note });
}

/**
 * GHI KẾT QUẢ GỌN TRÊN DÒNG (OV-13b, mockup OV-13 §1) — Công việc · ngăn Case · panel một em: 5 chip Tiến triển (2 tuần) * · Nhận xét * · Lưu; Quyết định
 * mặc định Giữ nguyên (`ketQuaNhanh`, cùng `POST /interventions/:id/result` với panel). "Điều chỉnh / Kết thúc…" mở panel lớn, chữ mang theo. Trạng
 * thái: Đang lưu (khoá nút) · lỗi (chữ giữ, nút Thử lại) · thiếu ô ("⚠ Còn thiếu n ô"). Lưu xong nơi gọi vẽ `DongDaLuu`.
 */
export function GhiNhanh({ paId, batBuoc = false, onDaLuu, onMoPanel, onTiep, tenTiep = null, trongDong = false }: {
  paId: number; batBuoc?: boolean;
  /** M6 6b-3 (V12 ⑥): "Tiếp: {việc} · {em}" dưới hàng nút. */
  tenTiep?: string | null;
  /** NEN-PANEL: có việc kế (hàng đợi Công việc) → thêm "Lưu · việc tiếp ›" (R1-LUU-TIEP) — chỉ sang việc kế sau khi lưu xong. */
  onTiep?: (() => void) | null;
  onDaLuu: (kq: DaLuuNhanh) => void;
  /** Mở panel lớn (Điều chỉnh / Kết thúc) — chữ đã gõ nằm ở `nhapKetQua`. */
  onMoPanel?: () => void;
  trongDong?: boolean;
}) {
  const dau = nhapKetQua.get(paId);
  const [outcome, setOutcome] = useNhap(`ghi-nhanh-kq:${paId}`, dau?.outcome ?? '');
  const [note, setNote] = useNhap(`ghi-nhanh-nx:${paId}`, dau?.note ?? '');
  const xoaNhap = useXoaNhap();
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { nhapKetQua.delete(paId); }, [paId]);
  const thieuMuc = !outcome;
  const thieuNx = note.trim().length < 8;
  const daiNx = note.trim().length > TRAN_CHU.ketQuaPa;   // N35: quá trần → không lưu, chữ giữ trong ô
  const soThieu = Number(thieuMuc) + Number(thieuNx || daiNx);
  const luu = async (): Promise<boolean> => {
    setDaBam(true);
    if (soThieu) return false;
    setBusy(true); setLoi(null);
    try {
      const ct = await api.post<any>(`/interventions/${paId}/result`, ketQuaNhanh(outcome, note));
      lamMoi();
      const f = (ct?.followups ?? []).find((x: any) => x.interventionId === paId) ?? null;
      xoaNhap();
      onDaLuu({ paId, followupId: f?.id ?? null, outcome, note, hanKe: (ct?.interventions ?? []).find((x: any) => x.id === paId)?.actionDue ?? null });
      return true;
    } catch (e: any) {
      setLoi(e?.message ?? t('mất kết nối'));
      return false;
    } finally { setBusy(false); }
  };
  const idTt = `nhanh-tt-${paId}`;
  return (
    <CanLam trongDong={trongDong}>
      <div>
        <span id={idTt} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Tiến triển (2 tuần)')}<span aria-hidden className="text-bad"> *</span></span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={idTt} aria-invalid={daBam && thieuMuc}>
          {FOLLOWUP_OUTCOMES.map((x) => (
            <NutChon key={x} nho chon={outcome === x} disabled={busy} onClick={() => setOutcome(x)} className="rounded-full px-3">{dich(outcomeLabelFor(x))}</NutChon>
          ))}
        </div>
        {daBam && thieuMuc && <span className="mt-1 block text-xs text-late">{t('Chọn một mức')}</span>}
      </div>
      <label className="block">
        <span className="mb-1 flex items-baseline gap-2 text-[13px] font-semibold text-slate-300"><span className="flex-1">{t('Nhận xét')}<span aria-hidden className="text-bad"> *</span></span><DemChu n={note.trim().length} toiDa={TRAN_CHU.ketQuaPa} /></span>
        <textarea className={`field w-full ${(daBam && thieuNx) || daiNx ? 'border-late ring-1 ring-late/40' : ''}`} rows={2} value={note} readOnly={busy} aria-invalid={(daBam && thieuNx) || daiNx}
          onChange={(e) => setNote(e.target.value)} placeholder={dich(GOI_Y_KET_QUA_PA)} />
        {daBam && thieuNx && <span className="mt-1 block text-xs text-late">{t('Ghi rõ hơn — ít nhất 8 ký tự')}</span>}
        {daiNx && <span className="mt-1 block text-xs text-late">{t('Tối đa {toiDa} ký tự (đang có {n})', { toiDa: TRAN_CHU.ketQuaPa, n: note.trim().length })}</span>}
      </label>
      {loi && <p role="alert" className="m-0 text-[13px] font-semibold text-bad">⚠ {t('Không lưu được — {loi}', { loi })}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`btn min-h-[48px] px-5 font-bold max-sm:w-full max-sm:justify-center sm:min-h-[40px] ${onTiep ? '' : 'btn-primary'}`} disabled={busy} onClick={() => void luu()}>
          {busy ? t('Đang lưu…') : loi ? t('Thử lại') : t('Lưu')}
        </button>
        {onTiep && (
          <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold max-sm:w-full max-sm:justify-center sm:min-h-[40px]" disabled={busy} onClick={() => void luuRoiTiep(luu, onTiep)}>
            {t('Lưu · việc tiếp ›')}
          </button>
        )}
        {!loi && <span className="text-[13px] text-slate-400">{daBam && soThieu ? <span className="font-semibold text-late">⚠ {t('Còn thiếu {n} ô', { n: soThieu })}</span> : t('Giữ nguyên PA')}</span>}
        <span className="flex-1" />
        {onMoPanel && (
          <NutChu onClick={() => { nhapKetQua.set(paId, { outcome, note }); onMoPanel(); }}>
            {batBuoc ? t('Điều chỉnh…') : t('Điều chỉnh / Kết thúc…')}
          </NutChu>
        )}
      </div>
      {onTiep && tenTiep && <p className="m-0 -mt-1.5 truncate text-[13px] text-slate-400" title={tenTiep}>{t('Tiếp: {x}', { x: tenTiep })}</p>}
    </CanLam>
  );
}

/** Dòng đã lưu: "✓ Đã lưu · Tiến bộ một phần · Giữ nguyên · hạn kế T3 03/11 · Hoàn tác" — Hoàn tác 10 giây (`POST /followups/:id/hoan-tac`). */
export function DongDaLuu({ kq, onHoanTac }: { kq: DaLuuNhanh; onHoanTac: (kq: DaLuuNhanh) => void }) {
  const { ngan } = useNgayNghiepVu();
  const [con, setCon] = useState(!!kq.followupId);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useChoHoanTac(con);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), HOAN_TAC_DONG_MS);
    return () => clearTimeout(h);
  }, [con]);
  const hoanTac = async () => {
    setBusy(true); setLoi(null);
    try {
      await hoanTacNhanh(kq);
      onHoanTac(kq);
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-[13px] text-slate-300" role="status">
      <b className="font-bold text-done">✓ {t('Đã lưu')}</b>
      <span>· {dich(outcomeLabelFor(kq.outcome))} · {t('Giữ nguyên')}</span>
      {kq.hanKe && <span className="text-slate-400">· {t('hạn kế {ngay}', { ngay: ngan(kq.hanKe) })}</span>}
      {con && (
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void hoanTac()}>
          {busy ? t('Đang lưu…') : t('Hoàn tác')}
        </button>
      )}
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
    </p>
  );
}
