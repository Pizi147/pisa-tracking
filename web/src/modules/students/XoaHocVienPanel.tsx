import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { hoanTacXoa, lamMoiHocVien } from '../../lib/thungRac.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { CHU_XAC_NHAN_XOA, khopXacNhanXoa } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /students/:id/xoa` (chỉ Quản trị hệ thống) — `server/src/students/xoaHocVien.ts`. */
export type XemXoaHocVien = {
  id: number; ma: string; ten: string; lop: string | null; email: string | null; dangHoc: boolean;
  mat: { khoa: string; nhan: string; so: number }[];
  congViecGoLienKet: number;
};

/**
 * ⋮ HỒ SƠ HV › XOÁ HỌC VIÊN (PR-XOA, đặc tả §1) — chỉ Quản trị hệ thống; máy chủ kiểm quyền và kiểm lại mã. Panel nêu em là ai, bảng
 * "Những gì sẽ mất" (hai cột thẳng, số canh phải); chỉ khi GÕ XOÁ (OV-13f: mã HV không hiện — như Xoá nhiều em) thì nút đỏ "Xoá" mới bật.
 * Xoá xong về Học viên & Lớp + toast Hoàn tác (Q-RL2b: thùng rác 30 ngày, khôi phục ở Quản trị › Đã xoá hoặc Lưu trữ).
 */
export function XoaHocVienPanel({ studentId, studentName, lop, onClose }: {
  studentId: number; studentName: string; lop?: string | null; onClose: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const xem = useApi<XemXoaHocVien>(`/students/${studentId}/xoa`, [studentId]);
  const [go, setGo] = useState('');
  const [busy, setBusy] = useState(false);
  const d = xem.data;
  const khop = !!d && khopXacNhanXoa(go.trim());
  /* Nút Xoá chỉ sáng khi gõ khớp; rời ô mà còn lệch thì nói ngay dưới ô (YC-12.5.2). */
  const lf = useLoiForm();
  const loi = go.trim() && !khop ? [{ khoa: 'go-lai', nhan: t('Gõ {chu}', { chu: CHU_XAC_NHAN_XOA }), lyDo: t('Chưa khớp') }] : [];

  const xoa = async () => {
    if (!d) return;
    setBusy(true);
    try {
      const r = await api.post<{ thungRacId?: number }>(`/students/${studentId}/xoa`, { maXacNhan: go.trim() });
      lamMoiHocVien();
      hoanTacXoa(toast, r.thungRacId, t('Đã xoá học viên · {ten}', { ten: d.ten }), lamMoiHocVien);
      onClose();
      navigate('/hoc-vien', { replace: true });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Xoá học viên')} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !khop} onClick={xoa}>{t('Xoá')}</button>,
      }}>
      {xem.error ? <div className="pt-3"><ErrorState message={xem.error.message} hint={xem.error.hint} status={xem.error.status} onRetry={xem.reload} /></div>
        : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
          <>
            <Khoi tieuDe={t('Học viên')}>
              <p className="m-0 text-sm text-slate-200">
                {d.ten} · {d.lop ?? t('Chưa xếp lớp')} · {d.email ?? t('Chưa có email')}
                {d.dangHoc && <span className="text-soon"> · {t('đang học')}</span>}
              </p>
            </Khoi>
            <Khoi tieuDe={t('Những gì sẽ mất')}>
              {d.mat.length === 0 ? (
                <p className="m-0 text-sm text-slate-400">{t('Chưa có dữ liệu nào ngoài hồ sơ.')}</p>
              ) : (
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    {d.mat.map((m) => (
                      <tr key={m.khoa} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                        <td className="py-1 pr-3 text-slate-300">{dich(m.nhan)}</td>
                        <td className="w-20 py-1 text-right tabular-nums text-slate-100">{m.so}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {d.congViecGoLienKet > 0 && (
                <p className="m-0 text-xs text-slate-400">{t('{n} công việc giữ lại, bỏ liên kết với em.', { n: d.congViecGoLienKet })}</p>
              )}
            </Khoi>
            <Khoi tieuDe={t('Xác nhận')}>
              <p className="m-0 text-xs text-slate-400">{t('Khôi phục được trong 30 ngày (Quản trị › Đã xoá hoặc Lưu trữ).')}</p>
              <Truong nhan={t('Gõ {chu} để xác nhận', { chu: CHU_XAC_NHAN_XOA })} batBuoc loi={lf.loiCua(loi, 'go-lai')}>
                <input className="field w-full" {...lf.o(loi, 'go-lai')} value={go} onChange={(e) => setGo(e.target.value)} autoComplete="off" spellCheck={false} />
              </Truong>
            </Khoi>
          </>
        )}
    </KhungPanel>
  );
}
