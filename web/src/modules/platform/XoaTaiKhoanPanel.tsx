import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /admin/accounts/:id/xoa` (chỉ Quản trị hệ thống) — `server/src/platform/xoaTaiKhoan.ts`. */
/** E-5 (N69): câu báo số việc máy đã tự chuyển khi xoá tài khoản / gỡ hết vai — null khi không chuyển gì. */
export function nhanDaChuyen(c: { soCase: number; soPa: number; soTinHieu: number; soXuLy: number } | null | undefined): string | null {
  if (!c) return null;
  const ds = [c.soCase && t('{n} Case', { n: c.soCase }), c.soPa && t('{n} PA', { n: c.soPa }), c.soTinHieu && t('{n} Case chờ xác nhận nguyên nhân', { n: c.soTinHieu }), c.soXuLy && t('{n} lần xử lý', { n: c.soXuLy })].filter(Boolean);
  return ds.length ? `${t('Đã chuyển')} ${ds.join(' · ')}` : null;
}

export type XemXoaTaiKhoan = {
  id: number; ten: string; email: string | null; vai: string[]; chiNhanh: string[];
  soDauVet: number; chiTiet: { nhan: string; so: number }[];
  cach: 'mem'; chan: string | null; canhBao: string[];
};

/**
 * QUẢN TRỊ HỆ THỐNG › TÀI KHOẢN › ⋯ › XOÁ TÀI KHOẢN (PR-XOA, đặc tả §3). Rà 11/11 G5-10: luôn khoá và ẩn (xoá mềm), khôi phục ở Đã xoá + Hoàn tác
 * ngay sau xoá. Bị chặn (tự xoá, QT cuối) thì nói lý do + bước tiếp và tắt nút; đang là GVCN → máy chủ hỏi một câu. DUONG-LUI-2 (B1-11): không gõ lại
 * email / họ tên (xoá mềm, Hoàn tác được) — giữ câu hậu quả (dấu vết, cảnh báo). Máy chủ kiểm lại tất cả.
 */
export function XoaTaiKhoanPanel({ userId, onClose, onDone }: { userId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const xem = useApi<XemXoaTaiKhoan>(`/admin/accounts/${userId}/xoa`, [userId]);
  const [busy, setBusy] = useState(false);
  const d = xem.data;

  const xoa = async () => {
    if (!d) return;
    setBusy(true);
    try {
      const kq = await api.post<{ chuyen?: Parameters<typeof nhanDaChuyen>[0] }>(`/admin/accounts/${userId}/xoa`, {});
      const daChuyen = nhanDaChuyen(kq?.chuyen);
      const lamMoi = () => { invalidate('/admin/accounts'); invalidate('/demo/accounts'); };
      lamMoi();
      /* G5-10: Hoàn tác = Khôi phục (Đã xoá) — mật khẩu đặt lại như mọi lần khôi phục. */
      toast.hoanTac(`${t('Đã xoá tài khoản {ten}', { ten: d.ten })}${daChuyen ? ` · ${daChuyen}` : ''}`, async () => {
        let canhBao: string[] = [];
        try { canhBao = (await api.post<{ canhBao: string[] }>(`/admin/accounts/${userId}/khoi-phuc`))?.canhBao ?? []; } catch (e: any) { toast.push('error', e.message); return; }
        lamMoi(); toast.push('ok', t('Đã khôi phục tài khoản {ten}', { ten: d.ten }));
        for (const c of canhBao) toast.push('info', dich(c));   // #1418: chỗ không trả lại được (lớp đã có người khác, email đã dùng…)
      }, { key: `xoa-tk:${userId}` });
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Xoá tài khoản')} hocVien={d?.ten ?? null} onDong={onClose}
      chan={{
        chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !d || !!d.chan} onClick={xoa}>{t('Xoá tài khoản')}</button>,
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
                          <td className="w-20 py-1 text-center tabular-nums text-slate-100">{c.so}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="m-0 text-sm text-slate-200">{t('Chưa có dấu vết → tài khoản bị khoá và ẩn, khôi phục được ở Đã xoá')}</p>
              )}
              {d.canhBao.map((c) => <p key={c} className="m-0 text-xs text-soon">{c}</p>)}
              {!d.chan && d.soDauVet > 0 && <p className="m-0 text-xs text-slate-400">{t('Nên sao lưu dữ liệu trước lần xoá đầu.')}</p>}
            </Khoi>
          </>
        )}
    </KhungPanel>
  );
}
