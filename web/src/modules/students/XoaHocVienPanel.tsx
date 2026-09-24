import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';

/** `GET /students/:id/xoa` (chỉ Quản trị hệ thống) — `server/src/students/xoaHocVien.ts`. */
export type XemXoaHocVien = {
  id: number; ma: string; ten: string; lop: string | null; dangHoc: boolean;
  mat: { khoa: string; nhan: string; so: number }[];
  congViecGoLienKet: number;
};

/**
 * ⋮ HỒ SƠ HV › XOÁ HỌC VIÊN (PR-XOA, đặc tả §1) — chỉ Quản trị hệ thống; máy chủ kiểm quyền và kiểm lại mã. Panel nêu em là ai, bảng
 * "Những gì sẽ mất" (hai cột thẳng, số canh phải), "Không khôi phục được"; chỉ khi GÕ LẠI ĐÚNG MÃ HV thì nút đỏ "Xoá vĩnh viễn" mới bật.
 * Xoá xong về Học viên & Lớp (hồ sơ không còn).
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
  const khop = !!d && go.trim() === d.ma;

  const xoa = async () => {
    if (!d) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/xoa`, { maXacNhan: go.trim() });
      invalidate('/students'); invalidate('/hoc-vien-lop'); invalidate('/classes');
      invalidate('/overview'); invalidate('/my-work'); invalidate('/cases');
      toast.push('ok', `Đã xoá học viên ${d.ma}`);
      onClose();
      navigate('/hoc-vien', { replace: true });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xoá học viên" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !khop} onClick={xoa}>Xoá vĩnh viễn</button>,
      }}>
      {xem.error ? <div className="pt-3"><ErrorState message={xem.error.message} hint={xem.error.hint} onRetry={xem.reload} /></div>
        : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
          <>
            <Khoi tieuDe="Học viên">
              <p className="m-0 text-sm text-slate-200">
                {d.ten} · {d.ma} · {d.lop ?? 'Chưa xếp lớp'}
                {d.dangHoc && <span className="text-soon"> · đang học</span>}
              </p>
            </Khoi>
            <Khoi tieuDe="Những gì sẽ mất">
              {d.mat.length === 0 ? (
                <p className="m-0 text-sm text-slate-400">Chưa có dữ liệu nào ngoài hồ sơ.</p>
              ) : (
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    {d.mat.map((m) => (
                      <tr key={m.khoa} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                        <td className="py-1 pr-3 text-slate-300">{m.nhan}</td>
                        <td className="w-20 py-1 text-right tabular-nums text-slate-100">{m.so}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {d.congViecGoLienKet > 0 && (
                <p className="m-0 text-xs text-slate-400">{d.congViecGoLienKet} công việc giữ lại, bỏ liên kết với em.</p>
              )}
            </Khoi>
            <Khoi tieuDe="Xác nhận">
              <p className="m-0 text-sm text-soon">Không khôi phục được (trừ từ bản sao lưu).</p>
              <p className="m-0 text-xs text-slate-400">Nên sao lưu trước lần xoá đầu (npm run sao-luu)</p>
              <Truong nhan="Gõ lại mã học viên" batBuoc phu={`Mã: ${d.ma}`}>
                <input className="field w-full" value={go} onChange={(e) => setGo(e.target.value)} autoComplete="off" spellCheck={false} />
              </Truong>
            </Khoi>
          </>
        )}
    </KhungPanel>
  );
}
