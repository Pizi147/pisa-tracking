import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { xoaViPham } from './DeleteViolationConfirm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { demLanSua, nhanLichSuViPham } from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { NutDichGop, useDichGop } from '../../ui/ChuDich.tsx';
import { DaiChoGvSua, DaiDaLam, HOAN_TAC_MS, KhoiTraLai, guiTraLai, hoanTacTraLai, type TraLaiMo } from './TraLai.tsx';

export type ViolationDetail = {
  id: number; studentId: number;
  category: string; skill: string | null; occurredOn: string; ten: string; moTa: string; description: string;
  /** TINH-HINH: "Chỉ nhắc nhở". */ chiNhac?: boolean;
  canEdit: boolean; attachmentCount: number;
  measures: { id: number; kindLabel: string; status: string; statusLabel: string }[];
  history: { id: number; field: string; oldValue: string | null; newValue: string | null; actorUserId: number | null; actorName: string | null; createdAt: string }[];
  /** TL-2 (N61): "Trả lại" cho người xem phía TVV (máy chủ kiểm luật chặn) · yêu cầu đang mở. */
  reportedByName?: string | null;
  traLai?: { coThe: boolean; dangMo: TraLaiMo | null };
};

/**
 * CHI TIẾT MỘT VI PHẠM — vẽ ngay dưới dòng khi mở tại chỗ (YT-1, YT-13).
 * Bốn khối: Bằng chứng · Lần xử lý (nút mở đúng lần xử lý) · Đã sửa {n} lần · Xem · Sửa/Xoá tại dòng. Quyền Sửa/Xoá = `d.canEdit` (máy chủ).
 */
export function ChiTietViPham({ violationId, onSua, onDaXoa, onMoXuLy }: {
  violationId: number;
  onSua: (v: ViolationDetail) => void;
  onDaXoa: () => void;
  onMoXuLy: (id: number) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error: loiTai, reload } = useApi<ViolationDetail>(`/violations/${violationId}`, [violationId]);
  const [errXoa, setErrXoa] = useState<string | null>(null);
  const [xemLichSu, setXemLichSu] = useState(false);
  const [busy, setBusy] = useState(false);
  /* TL-2: ô lý do mở tại chỗ (như panel Báo PH T1) · dải "✓ Đã trả lại" + Hoàn tác 60 giây. */
  const [traLai, setTraLai] = useState(false);
  const [vua, setVua] = useState<{ chu: string; het: number; id: number } | null>(null);
  /* VI-PHAM-MO: MỘT nút Dịch cho tên + mô tả — chữ tên ở dòng cha đọc cùng bộ nhớ (`TenDich`), đổi theo nút này. */
  const dg = useDichGop([
    { chu: d?.ten, nguon: { bang: 'violations', id: violationId, cot: 'ten' } },
    { chu: d?.moTa, nguon: { bang: 'violations', id: violationId, cot: 'mo_ta' } },
  ]);

  if (loiTai) return <ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} />;
  if (!d) return <Skeleton rows={3} />;

  const soLanSua = demLanSua(d.history);
  const suaDuoc = d.canEdit;
  const xoaDuoc = d.canEdit;

  const xoa = async () => {
    setBusy(true); setErrXoa(null);
    try {
      await xoaViPham(toast, violationId);
      onDaXoa();
    } catch (e: any) {
      /* Q15: lỗi 400 hiện ngay dưới, KHÔNG đóng hộp hỏi — người dùng vừa đọc lý do vừa quyết định bước tiếp theo. */
      setErrXoa(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2.5 text-sm">
      {/* VI-PHAM-MO: mô tả + MỘT nút Dịch (dịch cả tên ở dòng cha). Chữ rỗng: không vẽ nút Dịch. */}
      <div>
        <p className="text-xs text-slate-500 m-0 mb-1">{t('Mô tả')}</p>
        <p className="m-0 whitespace-pre-wrap break-words">{d.moTa.trim() ? dg.chu(1) : <span className="text-slate-500">{t('Không có mô tả thêm')}</span>}{' '}<NutDichGop d={dg} /></p>
      </div>
      {/* U10.8: nhãn cùng dòng với "+ Tệp · + Liên kết" (mockup `.bc`). */}
      <BangChung ownerType="violation" ownerId={d.id} canEdit={d.canEdit} onChanged={reload} />

      <div>
        <p className="text-xs text-slate-500 m-0 mb-1">{t('Lần xử lý')}</p>
        {d.measures.length === 0 ? <p className="text-slate-400 m-0">{t('Chưa nằm trong lần xử lý nào')}</p> : (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {d.measures.map((m) => (
              <button key={m.id} type="button" className="link" onClick={() => onMoXuLy(m.id)}>
                {dich(m.kindLabel)} · {m.statusLabel.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {soLanSua > 0 && (
        <div>
          <button type="button" className="text-xs text-slate-500 hover:underline underline-offset-2" aria-expanded={xemLichSu}
            onClick={() => setXemLichSu((v) => !v)}>
            {t('Đã sửa {soLanSua} lần · Xem', { soLanSua })}
          </button>
          {xemLichSu && (
            <ul className="list-none p-0 m-0 mt-1 space-y-0.5 text-xs text-slate-400">
              {d.history.map((h) => {
                const nhan = nhanLichSuViPham(h, homNay);
                return (
                  <li key={h.id}>
                    {nhan.truong ? `${nhan.truong}: ${nhan.cu} → ${nhan.moi}` : nhan.moi}
                    {' · '}{h.actorName ?? '—'} · {fmtDate(h.createdAt)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {d.traLai?.dangMo && <DaiChoGvSua y={d.traLai.dangMo} hn={homNay ?? ''} moTa={t('Vi phạm này')} onRut={null} />}
      {vua && <DaiDaLam chu={vua.chu} het={vua.het} onHet={() => setVua(null)}
        onHoanTac={async () => { await hoanTacTraLai(vua.id); setVua(null); reload(); toast.push('ok', t('Đã hoàn tác')); }} />}
      {traLai && (
        <KhoiTraLai khoa={`vp-${d.id}`} veAi={d.reportedByName ?? null} hn={homNay ?? ''} onHuy={() => setTraLai(false)} onGui={async (lyDo) => {
          const r = await guiTraLai({ violationId: d.id }, lyDo);
          setTraLai(false); reload();
          setVua({ chu: t('Đã trả lại cho {ten}', { ten: r.phuTrach.map((x) => x.ten).filter(Boolean).join(', ') || t('GV') }), het: Date.now() + HOAN_TAC_MS, id: r.id });
        }} />
      )}
      <div className="flex items-center gap-2 pt-1">
        {suaDuoc && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => onSua(d)}>{t('Sửa')}</button>}
        {/* B1-10: xoá thẳng + toast Hoàn tác (không hỏi lại). */}
        {xoaDuoc && <button type="button" className="btn btn-sm max-sm:min-h-[44px] btn-ghost text-rose-200" disabled={busy} onClick={xoa}>{t('Xoá')}</button>}
        {d.traLai?.coThe && !traLai && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => setTraLai(true)}>{t('Trả lại')}</button>}
      </div>
      {errXoa && <p className="text-xs text-rose-300 m-0">{errXoa}</p>}
    </div>
  );
}
