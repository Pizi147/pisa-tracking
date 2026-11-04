import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { fmtDate, fmtDateTime } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { t } from '@shared/i18n/index.ts';

type MucRac = {
  id: number; loai: 'case' | 'pa' | 'ket_qua_pa' | 'vi_pham' | 'tep' | 'hoc_vien'; nhan: string; hocVienId: number | null;
  xoaBoi: string | null; xoaLuc: string; khoiPhucBoi: string | null; khoiPhucLuc: string | null;
  hetHanLuc: string | null; xoaHanLuc: string; khoiPhucDuoc: boolean;
};

const nhanLoai = (l: MucRac['loai']) => (l === 'case' ? 'Case' : l === 'pa' ? t('PA') : l === 'ket_qua_pa' ? t('Kết quả PA') : l === 'vi_pham' ? t('Vi phạm') : l === 'hoc_vien' ? t('Học viên') : t('Tệp'));

/**
 * Q-RL2a THÙNG RÁC — Quản trị › Đã xoá: Case / PA / vi phạm / tệp đã xoá trong 30 ngày (`GET /thung-rac`, máy chủ lọc theo quyền).
 * Khôi phục tại dòng; mục đã khôi phục / hết hạn vẫn hiện để xem lịch sử (Quản trị).
 * Q-RL2b: `loai` = khối "Đã xoá" chỉ một loại (Lưu trữ › học viên): bỏ cột Loại, lọc theo `loc`, rỗng / đang tải thì không vẽ.
 */
export function DaXoaAdmin({ loai, loc = '' }: { loai?: MucRac['loai']; loc?: string } = {}) {
  const toast = useToast();
  const { data, error, reload } = useApi<MucRac[]>('/thung-rac');
  const [dang, setDang] = useState<number | null>(null);

  const khoiPhuc = async (m: MucRac) => {
    if (dang) return;
    setDang(m.id);
    try {
      await api.post(`/thung-rac/${m.id}/khoi-phuc`);
      for (const k of ['/thung-rac', '/cases', '/students', '/hoc-vien-lop', '/lenh-chuyen', '/my-work', '/tong-quan', '/yeu-cau', '/violations', '/measures', '/classes', '/y-thuc', '/attachments']) invalidate(k);
      reload();
      toast.push('ok', t('Đã khôi phục'));
    } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.')); } finally { setDang(null); }
  };

  const COT: CotBang[] = [
    ...(loai ? [] : [{ key: 'loai', nhan: t('Loại'), kieu: 'chu', rong: 96 } as CotBang]),
    { key: 'muc', nhan: t('Mục'), kieu: 'ten', rong: 400 },
    { key: 'ai', nhan: t('Người xoá'), kieu: 'chu', rong: 170 },
    { key: 'luc', nhan: t('Lúc xoá'), kieu: 'chu', rong: 150 },
    { key: 'den', nhan: t('Giữ đến'), kieu: 'tuan', rong: 110 },
    { key: 'nut', nhan: '', kieu: 'nut', rong: 280 },
  ];
  const oCua = (m: MucRac, c: CotBang) => {
    if (c.key === 'loai') return <span className="text-[13px] text-slate-400">{nhanLoai(m.loai)}</span>;
    if (c.key === 'muc') return m.hocVienId ? <Link className="ten-ho-so" to={`/hoc-vien/${m.hocVienId}`}>{m.nhan}</Link> : m.nhan;
    if (c.key === 'ai') return m.xoaBoi ?? '—';
    if (c.key === 'luc') return <span className="tabular-nums">{fmtDateTime(m.xoaLuc)}</span>;
    if (c.key === 'den') return <span className="tabular-nums">{m.khoiPhucLuc || m.hetHanLuc ? '—' : fmtDate(m.xoaHanLuc)}</span>;
    return m.khoiPhucDuoc ? (
      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dang !== null} onClick={() => void khoiPhuc(m)}>
        {dang === m.id ? t('Đang khôi phục…') : t('Khôi phục')}
      </button>
    ) : <span className="text-[13px] text-slate-500">{m.khoiPhucLuc
      ? t('Đã khôi phục · {ten} · {ngay}', { ten: m.khoiPhucBoi ?? '—', ngay: fmtDate(m.khoiPhucLuc) })
      : m.hetHanLuc ? t('Đã xoá hẳn') : '—'}</span>;
  };

  if (loai) {
    const tim = loc.trim().toLowerCase();
    const hang = (data ?? []).filter((m) => m.loai === loai && (!tim || m.nhan.toLowerCase().includes(tim)));
    if (!error && !hang.length) return null;
    return (
      <section className="space-y-2" aria-label={t('Đã xoá')}>
        <h2 className="m-0 text-[15px] font-bold text-slate-100">{t('Đã xoá')}</h2>
        <p className="m-0 text-xs text-slate-500">{t('Giữ 30 ngày, sau đó xoá hẳn.')}</p>
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : <Bang ten={t('Đã xoá')} cot={COT} hang={hang} khoa={(m) => m.id} oCua={oCua} lopHang={(m) => (m.khoiPhucDuoc ? '' : 'opacity-70')} />}
      </section>
    );
  }

  return (
    <div className="space-y-2">
      <p className="m-0 text-xs text-slate-500">{t('Giữ 30 ngày, sau đó xoá hẳn.')}</p>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /> : !data ? <Skeleton rows={6} /> : (
        <Bang ten={t('Đã xoá')} cot={COT} hang={data} khoa={(m) => m.id} oCua={oCua} lopHang={(m) => (m.khoiPhucDuoc ? '' : 'opacity-70')}
          rong={{ tieuDe: t('Không có mục nào đã xoá trong 30 ngày.') }} />
      )}
    </div>
  );
}
