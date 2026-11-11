import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /admin/accounts/:id/xoa` (chỉ Quản trị hệ thống) — `server/src/platform/xoaTaiKhoan.ts`. */
export type XemXoaTaiKhoan = {
  id: number; ten: string; email: string | null; vai: string[]; chiNhanh: string[];
  soDauVet: number; chiTiet: { nhan: string; so: number }[];
  cach: 'mem'; chan: string | null; canhBao: string[];
  /** RKC-6: chưa có email → gõ lại họ tên để xác nhận. G5-10: chưa có dấu vết → `null`, không gõ. */
  goLai?: 'email' | 'ho-ten' | null;
};

/**
 * QUẢN TRỊ HỆ THỐNG › TÀI KHOẢN › ⋯ › XOÁ TÀI KHOẢN (PR-XOA, đặc tả §3). Rà 11/11 G5-10: luôn khoá và ẩn (xoá mềm), khôi phục ở Đã xoá + Hoàn tác
 * ngay sau xoá. Bị chặn (tự xoá, QT cuối, đang là GVCN) thì nói lý do + bước tiếp và tắt nút. Có dấu vết: gõ lại đúng email (không phân biệt hoa thường)
 * mới bật nút đỏ; chưa có dấu vết: bấm thẳng. Máy chủ kiểm lại tất cả.
 */
export function XoaTaiKhoanPanel({ userId, onClose, onDone }: { userId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const xem = useApi<XemXoaTaiKhoan>(`/admin/accounts/${userId}/xoa`, [userId]);
  const [go, setGo] = useState('');
  const [busy, setBusy] = useState(false);
  const d = xem.data;
  const chuGoLai = d ? (d.goLai === 'ho-ten' || !d.email ? d.ten : d.email) : '';   // RKC-6: chưa có email → họ tên
  const nhanGoLai = d && (d.goLai === 'ho-ten' || !d.email) ? t('Gõ lại họ tên') : t('Gõ lại email');
  const canGo = !!d && d.goLai !== null;
  const khop = !canGo || (!!chuGoLai && go.trim().toLowerCase() === chuGoLai.trim().toLowerCase());
  /* Nút Xoá chỉ sáng khi gõ khớp; rời ô mà còn lệch thì nói ngay dưới ô (YC-12.5.2). */
  const lf = useLoiForm();
  const loi = go.trim() && !khop ? [{ khoa: 'go-lai', nhan: nhanGoLai, lyDo: d?.email ? t('Chưa khớp email') : t('Chưa khớp họ tên') }] : [];

  const xoa = async () => {
    if (!d) return;
    setBusy(true);
    try {
      await api.post(`/admin/accounts/${userId}/xoa`, { emailXacNhan: go.trim() });
      const lamMoi = () => { invalidate('/admin/accounts'); invalidate('/demo/accounts'); };
      lamMoi();
      /* G5-10: Hoàn tác = Khôi phục (Đã xoá) — mật khẩu đặt lại như mọi lần khôi phục. */
      toast.hoanTac(t('Đã xoá tài khoản {ten}', { ten: d.ten }), async () => {
        let canhBao: string[] = [];
        try { canhBao = (await api.post<{ canhBao: string[] }>(`/admin/accounts/${userId}/khoi-phuc`))?.canhBao ?? []; } catch (e: any) { toast.push('error', e.message); return; }
        lamMoi(); toast.push('ok', t('Đã khôi phục tài khoản {ten}', { ten: d.ten }));
        for (const c of canhBao) toast.push('info', dich(c));   // #1418: chỗ không trả lại được (lớp đã có người khác, email đã dùng…)
      }, { key: `xoa-tk:${userId}` });
      onDone();
    } catch (e: any) {
      toast.push('error', e.message);
      /* #1418: tài khoản vừa có dấu vết (máy chủ đòi gõ lại) → tải lại xem trước để ô gõ hiện ra. */
      if (e?.status === 400 && d.goLai === null) xem.reload();
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Xoá tài khoản')} hocVien={d?.ten ?? null} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !khop || !!d?.chan} onClick={xoa}>{t('Xoá tài khoản')}</button>,
      }}>
      {xem.error ? <div className="pt-3"><ErrorState message={xem.error.message} hint={xem.error.hint} status={xem.error.status} onRetry={xem.reload} /></div>
        : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
          <>
            <Khoi tieuDe={t('Tài khoản')}>
              <p className="m-0 text-sm text-slate-200">
                {/* OV-11b (QT-10e): không vai thì không có phạm vi — bỏ "· toàn hệ thống". */}
                {[d.email ?? t('chưa có email'), d.vai.map((v) => dich(v)).join(', ') || t('chưa có vai trò'), d.chiNhanh.join(', ') || (d.vai.length ? t('toàn hệ thống') : null)]
                  .filter(Boolean).join(' · ')}
              </p>
            </Khoi>
            <Khoi tieuDe={t('Cách xoá')}>
              {d.chan ? (
                <p className="m-0 text-sm text-late">{d.chan}</p>
              ) : d.soDauVet > 0 ? (
                <>
                  <p className="m-0 text-sm text-slate-200">
                    {t('Có dấu vết ({n} dòng) → tài khoản bị khoá và ẩn, lịch sử giữ tên kèm (đã xoá)', { n: d.soDauVet })}
                  </p>
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                      {d.chiTiet.slice(0, 4).map((c) => (
                        <tr key={c.nhan} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                          <td className="py-1 pr-3 text-slate-300 first-letter:uppercase">{dich(c.nhan)}</td>
                          <td className="w-20 py-1 text-right tabular-nums text-slate-100">{c.so}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="m-0 text-sm text-slate-200">{t('Chưa có dấu vết → tài khoản bị khoá và ẩn, khôi phục được ở Đã xoá')}</p>
              )}
              {d.canhBao.map((c) => <p key={c} className="m-0 text-xs text-soon">{c}</p>)}
            </Khoi>
            {!d.chan && canGo && (
              <Khoi tieuDe={t('Xác nhận')}>
                <p className="m-0 text-xs text-slate-400">{t('Nên sao lưu dữ liệu trước lần xoá đầu.')}</p>
                <Truong nhan={nhanGoLai} batBuoc phu={d.email ? `Email: ${d.email}` : `${t('Họ tên')}: ${d.ten}`} loi={lf.loiCua(loi, 'go-lai')}>
                  <input className="field w-full" {...lf.o(loi, 'go-lai')} value={go} onChange={(e) => setGo(e.target.value)} autoComplete="off" spellCheck={false} />
                </Truong>
              </Khoi>
            )}
          </>
        )}
    </KhungPanel>
  );
}
