import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChonTuan } from '../../ui/ChonNgay.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { addDaysIso, mondayOfDate, tuanLich } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** FT-LOP-NGHI: `GET /classes/:id/lop-nghi?tuan=` — khớp `XemTruocLopNghi` của máy chủ. */
type EmLopNghi = {
  studentId: number; ten: string; mt: string | null; tuCu: string | null; tuMoi: string | null;
  giu: string | null; canhBao: string | null; soPa: number; soCase: number;
};
type XemTruoc = {
  lop: string; tuan: { batDau: string; ma: string }; em: EmLopNghi[];
  soEmDoi: number; soEmGiu: number; soEmKhongMt: number; soPa: number; soCase: number;
};

const lamMoi = () => { for (const k of ['/classes', '/hoc-vien-lop', '/cham', '/tong-quan', '/my-work', '/cases']) invalidate(k); };

/**
 * ⋯ HỒ SƠ LỚP FT › LỚP NGHỈ 1 TUẦN (chủ SP 06/11). Một hộp: chọn tuần nghỉ (+ lý do tuỳ chọn), xem trước NGAY số em / mốc dời, bấm một lần.
 * MT kế tiếp chưa thi của mỗi em +1 tuần; hạn PA / hạn báo kết quả Case từ tuần nghỉ +7 ngày; Báo cáo PH, Ý thức, bàn giao không dời.
 * Lưu xong có Hoàn tác (toast) — máy chủ trả lại đúng giá trị cũ.
 */
export function LopNghiPanel({ classId, classCode, onClose, onDone }: { classId: number; classCode: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  /* Mặc định tuần SAU — lớp thường báo nghỉ trước một tuần. */
  const macDinh = homNay ? addDaysIso(mondayOfDate(homNay), 7) : '';
  const [chon, setChon] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const tuan = chon || macDinh;
  const xt = useApi<XemTruoc>(tuan ? `/classes/${classId}/lop-nghi?tuan=${tuan}` : null, [classId, tuan]);
  const d = xt.data;
  const doi = d?.em.filter((e) => e.mt && !e.giu) ?? [];
  const giu = d?.em.filter((e) => e.giu) ?? [];
  const coViec = !!d && (doi.length > 0 || d.soPa > 0 || d.soCase > 0);

  const luu = async () => {
    if (!d) return;
    setBusy(true);
    try {
      const r = await api.post<{ lanId: number; soEmDoi: number }>(`/classes/${classId}/lop-nghi`, { tuan, lyDo: lyDo.trim() || undefined });
      lamMoi();
      toast.hoanTac(t('Lớp {classCode} nghỉ 1 tuần — {n} em dời MT', { classCode, n: r.soEmDoi }), async () => {
        try {
          await api.post(`/classes/${classId}/lop-nghi/hoan-tac`, { lanId: r.lanId });
          lamMoi(); toast.push('ok', t('Đã hoàn tác')); onDone();
        } catch (e: any) { toast.push('error', e.message); }
      }, { key: `lop-nghi:${classId}` });
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const ma = (w: string | null) => (w ? tuanLich(w, homNay) : '—');
  return (
    <KhungPanel tieuDe={t('Lớp nghỉ 1 tuần')} lop={classCode} rong="hep" onDong={onClose}
      chan={{ daSua: !!lyDo.trim() || !!chon,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !coViec} onClick={luu}>{t('Cho lớp nghỉ')}</button> }}>
      <Khoi tieuDe={t('Tuần và lý do')}>
        <Truong nhan={t('Tuần nghỉ')} batBuoc>
          <ChonTuan value={tuan} onChange={setChon} lui={0} toi={8} ariaLabel={t('Tuần nghỉ')} />
        </Truong>
        <Truong nhan={t('Lý do')} tuyChon>
          <input className="field w-full" maxLength={200} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
        </Truong>
      </Khoi>

      <Khoi tieuDe={t('Sẽ dời')}>
        {xt.error ? <ErrorState message={xt.error.message} hint={xt.error.hint} status={xt.error.status} onRetry={xt.reload} />
          : !d ? <Skeleton rows={4} /> : (
            <div className="space-y-3 text-sm" aria-live="polite">
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-slate-200">
                <dt className="text-right font-bold tabular-nums">{doi.length}</dt><dd className="m-0">{t('em: MT kế tiếp chưa thi +1 tuần')}</dd>
                <dt className="text-right font-bold tabular-nums">{d.soPa}</dt><dd className="m-0">{t('hạn PA +7 ngày')}</dd>
                <dt className="text-right font-bold tabular-nums">{d.soCase}</dt><dd className="m-0">{t('hạn báo kết quả Case +7 ngày')}</dd>
              </dl>
              {doi.length > 0 && (
                <ul className="m-0 list-none space-y-1 p-0">
                  {doi.map((e) => (
                    <li key={e.studentId} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-slate-100">{e.ten}</span>
                      <span className="tabular-nums text-slate-300">{e.mt} · {ma(e.tuCu)} → {ma(e.tuMoi)}</span>
                      {e.canhBao && <span className="text-[13px] text-slate-400">{dich(e.canhBao)}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {giu.length > 0 && (
                <div>
                  <p className="m-0 mb-1 font-semibold text-slate-100">{t('{n} em giữ nguyên MT', { n: giu.length })}</p>
                  <ul className="m-0 list-none space-y-1 p-0">
                    {giu.map((e) => (
                      <li key={e.studentId} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-slate-100">{e.ten}</span><span className="text-slate-300">{e.mt} — {dich(e.giu!)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.soEmKhongMt > 0 && <p className="m-0 text-slate-400">{t('{n} em không có MT chưa thi từ tuần này', { n: d.soEmKhongMt })}</p>}
              {!coViec && <p className="m-0 text-slate-300">{t('Không có MT hay hạn nào cần dời từ tuần này.')}</p>}
              <p className="m-0 text-slate-400">{t('Không dời: Báo cáo PH · Ý thức · bàn giao chuyển lớp')}</p>
            </div>
          )}
      </Khoi>
    </KhungPanel>
  );
}
