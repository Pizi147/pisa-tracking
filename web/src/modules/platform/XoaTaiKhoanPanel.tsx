import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';

/** `GET /admin/accounts/:id/xoa` (chỉ Quản trị hệ thống) — `server/src/platform/xoaTaiKhoan.ts`. */
export type XemXoaTaiKhoan = {
  id: number; ten: string; email: string | null; vai: string[]; chiNhanh: string[];
  soDauVet: number; chiTiet: { nhan: string; so: number }[];
  cach: 'han' | 'mem'; chan: string | null; canhBao: string[];
};

/**
 * QUẢN TRỊ HỆ THỐNG › TÀI KHOẢN › ⋯ › XOÁ TÀI KHOẢN (PR-XOA, đặc tả §3). Panel nói trước cách xoá: CÓ DẤU VẾT → khoá và ẩn, lịch sử giữ tên
 * kèm "(đã xoá)"; CHƯA CÓ → xoá hẳn. Bị chặn (tự xoá, QT cuối, đang là GVCN) thì nói lý do và tắt nút. Gõ lại đúng email (không phân biệt
 * hoa thường) mới bật nút đỏ; máy chủ kiểm lại tất cả.
 */
export function XoaTaiKhoanPanel({ userId, onClose, onDone }: { userId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const xem = useApi<XemXoaTaiKhoan>(`/admin/accounts/${userId}/xoa`, [userId]);
  const [go, setGo] = useState('');
  const [busy, setBusy] = useState(false);
  const d = xem.data;
  const khop = !!d?.email && go.trim().toLowerCase() === d.email.toLowerCase();
  /* Nút Xoá chỉ sáng khi gõ khớp; rời ô mà còn lệch thì nói ngay dưới ô (YC-12.5.2). */
  const lf = useLoiForm();
  const loi = go.trim() && !khop ? [{ khoa: 'go-lai', nhan: 'Gõ lại email', lyDo: 'Chưa khớp email' }] : [];

  const xoa = async () => {
    if (!d) return;
    setBusy(true);
    try {
      await api.post(`/admin/accounts/${userId}/xoa`, { emailXacNhan: go.trim() });
      invalidate('/admin/accounts'); invalidate('/demo/accounts');
      toast.push('ok', `Đã xoá tài khoản ${d.ten}`);
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xoá tài khoản" hocVien={d?.ten ?? null} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !khop || !!d?.chan} onClick={xoa}>Xoá tài khoản</button>,
      }}>
      {xem.error ? <div className="pt-3"><ErrorState message={xem.error.message} hint={xem.error.hint} onRetry={xem.reload} /></div>
        : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
          <>
            <Khoi tieuDe="Tài khoản">
              <p className="m-0 text-sm text-slate-200">
                {[d.email ?? 'chưa có email', d.vai.join(', ') || 'chưa có vai trò', d.chiNhanh.join(', ') || 'toàn hệ thống'].join(' · ')}
              </p>
            </Khoi>
            <Khoi tieuDe="Cách xoá">
              {d.chan ? (
                <p className="m-0 text-sm text-late">{d.chan}</p>
              ) : d.cach === 'mem' ? (
                <>
                  <p className="m-0 text-sm text-slate-200">
                    Có dấu vết ({d.soDauVet} dòng) → tài khoản bị khoá và ẩn, lịch sử giữ tên kèm (đã xoá)
                  </p>
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      {d.chiTiet.slice(0, 4).map((c) => (
                        <tr key={c.nhan} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                          <td className="py-1 pr-3 text-slate-300 first-letter:uppercase">{c.nhan}</td>
                          <td className="w-20 py-1 text-right tabular-nums text-slate-100">{c.so}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="m-0 text-sm text-slate-200">Chưa có dấu vết → xoá hẳn</p>
              )}
              {d.canhBao.map((c) => <p key={c} className="m-0 text-xs text-soon">{c}</p>)}
            </Khoi>
            {!d.chan && (
              <Khoi tieuDe="Xác nhận">
                <p className="m-0 text-xs text-slate-400">Nên sao lưu dữ liệu trước lần xoá đầu.</p>
                <Truong nhan="Gõ lại email" batBuoc phu={d.email ? `Email: ${d.email}` : undefined} loi={lf.loiCua(loi, 'go-lai')}>
                  <input className="field w-full" {...lf.o(loi, 'go-lai')} value={go} onChange={(e) => setGo(e.target.value)} autoComplete="off" spellCheck={false} />
                </Truong>
              </Khoi>
            )}
          </>
        )}
    </KhungPanel>
  );
}
