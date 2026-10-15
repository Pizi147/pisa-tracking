import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { NutChon } from '../../ui/ui.tsx';
import { CanLam, NutChu } from '../../ui/KhuonViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { FOLLOWUP_OUTCOMES, GOI_Y_KET_QUA_PA, ketQuaNhanh, outcomeLabelFor } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Chữ đã gõ ở dòng ghi nhanh → panel lớn ("Điều chỉnh / Kết thúc…" mang chữ sang, mockup OV-13 §1). `GhiKetQuaPanel` đọc rồi xoá. */
export const nhapKetQua = new Map<number, { outcome: string; note: string }>();
/** Mockup OV-13 §1: "Hoàn tác 10 giây" ở dòng đã lưu. */
const HOAN_TAC_DONG_MS = 10_000;

export type DaLuuNhanh = { paId: number; followupId: number | null; outcome: string; note: string; hanKe: string | null };

const lamMoi = () => { for (const k of ['/cases', '/my-work', '/students', '/tong-quan', '/hoc-vien-lop', '/followups']) invalidate(k); };

/**
 * GHI KẾT QUẢ GỌN TRÊN DÒNG (OV-13b, mockup OV-13 §1) — Công việc · ngăn Case · panel một em: 5 chip Tiến triển (2 tuần) * · Nhận xét * · Lưu; Quyết định
 * mặc định Giữ nguyên (`ketQuaNhanh`, cùng `POST /interventions/:id/result` với panel). "Điều chỉnh / Kết thúc…" mở panel lớn, chữ mang theo. Trạng
 * thái: Đang lưu (khoá nút) · lỗi (chữ giữ, nút Thử lại) · thiếu ô ("⚠ Còn thiếu n ô"). Lưu xong nơi gọi vẽ `DongDaLuu`.
 */
export function GhiNhanh({ paId, batBuoc = false, onDaLuu, onMoPanel, trongDong = false }: {
  paId: number; batBuoc?: boolean;
  onDaLuu: (kq: DaLuuNhanh) => void;
  /** Mở panel lớn (Điều chỉnh / Kết thúc) — chữ đã gõ nằm ở `nhapKetQua`. */
  onMoPanel?: () => void;
  trongDong?: boolean;
}) {
  const dau = nhapKetQua.get(paId);
  const [outcome, setOutcome] = useState(dau?.outcome ?? '');
  const [note, setNote] = useState(dau?.note ?? '');
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { nhapKetQua.delete(paId); }, [paId]);
  const thieuMuc = !outcome;
  const thieuNx = note.trim().length < 8;
  const soThieu = Number(thieuMuc) + Number(thieuNx);
  const luu = async () => {
    setDaBam(true);
    if (soThieu) return;
    setBusy(true); setLoi(null);
    try {
      const ct = await api.post<any>(`/interventions/${paId}/result`, ketQuaNhanh(outcome, note));
      lamMoi();
      const f = (ct?.followups ?? []).find((x: any) => x.interventionId === paId) ?? null;
      onDaLuu({ paId, followupId: f?.id ?? null, outcome, note, hanKe: (ct?.interventions ?? []).find((x: any) => x.id === paId)?.actionDue ?? null });
    } catch (e: any) {
      setLoi(e?.message ?? t('mất kết nối'));
    } finally { setBusy(false); }
  };
  const idTt = `nhanh-tt-${paId}`;
  return (
    <CanLam trongDong={trongDong}>
      <div>
        <span id={idTt} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Tiến triển (2 tuần)')}<span aria-hidden className="text-bad"> *</span></span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={idTt} aria-invalid={daBam && thieuMuc}>
          {FOLLOWUP_OUTCOMES.map((x) => (
            <NutChon key={x} nho chon={outcome === x} onClick={() => setOutcome(x)} className="rounded-full px-3">{dich(outcomeLabelFor(x))}</NutChon>
          ))}
        </div>
        {daBam && thieuMuc && <span className="mt-1 block text-xs text-late">{t('Chọn một mức')}</span>}
      </div>
      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-slate-300">{t('Nhận xét')}<span aria-hidden className="text-bad"> *</span></span>
        <textarea className={`field w-full ${daBam && thieuNx ? 'border-late ring-1 ring-late/40' : ''}`} rows={2} value={note} aria-invalid={daBam && thieuNx}
          onChange={(e) => setNote(e.target.value)} placeholder={dich(GOI_Y_KET_QUA_PA)} />
        {daBam && thieuNx && <span className="mt-1 block text-xs text-late">{t('Ghi rõ hơn — ít nhất 8 ký tự')}</span>}
      </label>
      {loi && <p role="alert" className="m-0 text-[13px] font-semibold text-bad">⚠ {t('Không lưu được — {loi}', { loi })}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold max-sm:w-full max-sm:justify-center sm:min-h-[40px]" disabled={busy} onClick={() => void luu()}>
          {busy ? t('Đang lưu…') : loi ? t('Thử lại') : t('Lưu')}
        </button>
        {!loi && <span className="text-[13px] text-slate-400">{daBam && soThieu ? <span className="font-semibold text-late">⚠ {t('Còn thiếu {n} ô', { n: soThieu })}</span> : t('Giữ nguyên PA')}</span>}
        <span className="flex-1" />
        {onMoPanel && (
          <NutChu onClick={() => { nhapKetQua.set(paId, { outcome, note }); onMoPanel(); }}>
            {batBuoc ? t('Điều chỉnh…') : t('Điều chỉnh / Kết thúc…')}
          </NutChu>
        )}
      </div>
    </CanLam>
  );
}

/** Dòng đã lưu: "✓ Đã lưu · Tiến bộ một phần · Giữ nguyên · hạn kế T3 03/11 · Hoàn tác" — Hoàn tác 10 giây (`POST /followups/:id/hoan-tac`). */
export function DongDaLuu({ kq, onHoanTac }: { kq: DaLuuNhanh; onHoanTac: (kq: DaLuuNhanh) => void }) {
  const { ngan } = useNgayNghiepVu();
  const [con, setCon] = useState(!!kq.followupId);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), HOAN_TAC_DONG_MS);
    return () => clearTimeout(h);
  }, [con]);
  const hoanTac = async () => {
    setBusy(true); setLoi(null);
    try {
      await api.post(`/followups/${kq.followupId}/hoan-tac`);
      lamMoi();
      nhapKetQua.set(kq.paId, { outcome: kq.outcome, note: kq.note });
      onHoanTac(kq);
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-[13px] text-slate-300" role="status">
      <b className="font-bold text-ok">✓ {t('Đã lưu')}</b>
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
