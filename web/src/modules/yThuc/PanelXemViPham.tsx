import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { NutDongPanel } from '../../ui/KhuonViec.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay, quyCheXemViPham, bacDu } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { ChipMon, TienTrinh, chuMoc } from './BangLan.tsx';
import { CanLamEm } from './khoiYThuc.tsx';
import { XacNhanXuLyPanel } from './XacNhanXuLyPanel.tsx';
import { usePanelYThuc } from './panelYThuc.tsx';
import { DUONG_LAM_MOI_Y_THUC, type YThucHocVien } from './kieu.ts';

/**
 * PANEL "XEM VI PHẠM MỚI" ở trang Công việc (Y-THUC-V2, mockup K8b) — thay việc nhét cả tab Ý thức hồ sơ HV vào panel.
 * Dải ①②③ (bước GVCN là việc của người xem) · vi phạm mới (ngày · chip môn · tên; bấm mở tại chỗ: mô tả, bằng chứng, Sửa · Xoá) · "Hồ sơ Ý thức của em ›".
 * Chân: Xác nhận xử lý (mở panel xử lý ngay đây) · Đã xem · n (Hoàn tác ở thông báo). Một request như trước (`/students/:id/y-thuc`).
 */
export function PanelXemViPham({ studentId, dau, onDong, onDaLam, onTiep = null }: {
  studentId: number; dau: Parameters<typeof KhungPanel>[0]['dau']; onDong: () => void; onDaLam: () => void;
  /** Việc kế ở danh sách Công việc (GD-4d) — có thì chân thêm "Đã xem · việc tiếp ›". */
  onTiep?: (() => void) | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const { data: d, error, reload } = useApi<YThucHocVien>(`/students/${studentId}/y-thuc`, [studentId]);
  const [moId, setMoId] = useState<number | null>(null);
  const [xuLy, setXuLy] = useState(false);
  const [busy, setBusy] = useState(false);
  const { mo, panels } = usePanelYThuc({ onDone: () => { reload(); onDaLam(); } });
  const tieuDe = t('Xem vi phạm mới');
  if (xuLy) return <XacNhanXuLyPanel studentId={studentId} onClose={onDong} onDone={onDaLam} onTiep={onTiep} />;
  if (error) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={4} /></div></KhungPanel>;
  const moi = d.viPham.filter((v) => v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem')).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const ids = moi.map((v) => v.id);
  const lamMoi = () => { DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); reload(); onDaLam(); };
  /** `tiep`: lưu xong sang việc kế (GD-4d) thay vì đóng. */
  const daXem = async (tiep?: () => void) => {
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/y-thuc/ghi-nhan`, { violationIds: ids });
      lamMoi();
      toast.hoanTac(t('Đã xem {n} vi phạm · {gio}', { n: ids.length, gio: new Date().toTimeString().slice(0, 5) }), () => {
        api.post(`/students/${studentId}/y-thuc/bo-ghi-nhan`, { violationIds: ids }).then(lamMoi, (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
      }, { key: `da-xem:${studentId}` });
      (tiep ?? onDong)();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const nguoiGhi = [...new Set(moi.map((v) => v.reportedByName).filter(Boolean))].join(', ');
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong} quyChe={d.canManage && ids.length ? quyCheXemViPham() : null}
      chan={d.canManage && ids.length ? {
        huy: null, trai: null,
        phu: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setXuLy(true)}>{t('Xác nhận xử lý')}</button>,   // GD-4a (lời 28): NÚT, không chữ link
        chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={busy}
          onClick={() => void daXem()}>{busy ? t('Đang lưu…') : t('Đã xem · {n}', { n: ids.length })}</button>,
        /* GD-4d (lời 36, dòng 40c ⓪): còn việc kế → "Đóng" · Xác nhận xử lý · Đã xem · n · "Đã xem · việc tiếp ›" (chính); 375: Đóng qua ✕. */
        ...(onTiep ? {
          phu: <><NutDongPanel busy={busy} /><button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setXuLy(true)}>{t('Xác nhận xử lý')}</button>
            <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void daXem()}>{t('Đã xem · {n}', { n: ids.length })}</button></>,
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void daXem(onTiep)}>{busy ? t('Đang lưu…') : t('Đã xem · việc tiếp ›')}</button>,
        } : {}),
      } : undefined}>
      <div className="flex flex-col gap-4 pt-4">
        <TienTrinh nay={d.canManage ? 1 : null} buoc={[
          [t('{n} vi phạm', { n: moi.length }), nguoiGhi ? t('{ten} ghi', { ten: nguoiGhi }) : null],
          [<CanLamEm x={{ ...d, nhom: 'moi', deXuat: null }} homNay={homNay} />],
          [<span className="font-medium text-slate-400">—</span>, t('chỉ khi xử lý')],
        ]} />
        {moi.length === 0 ? <p className="m-0 text-sm text-slate-400">{t('Không còn vi phạm nào cần làm')}</p> : (
          <ul className="m-0 list-none p-0">
            {moi.map((v) => (
              <li key={v.id} className="border-t py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                <span className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-x-2">
                  <span className="pt-px text-[13px] font-semibold tabular-nums text-slate-400 max-sm:pt-3">{ngay(v.occurredOn, homNay)}</span>
                  <button type="button" aria-expanded={moId === v.id} onClick={() => setMoId((c) => (c === v.id ? null : v.id))}
                    className="flex min-w-0 appearance-none items-start border-0 bg-transparent p-0 text-left text-[15px] font-semibold text-slate-100 hover:text-[color:var(--accent)] hover:underline max-sm:min-h-[44px] max-sm:items-center">
                    <ChipMon skill={v.skill} /><span className="min-w-0 break-words">{v.ten}</span>
                  </button>
                </span>
                {moId !== v.id && v.moTa && <p className="m-0 mt-1 line-clamp-2 pl-[56px] text-sm text-slate-300">{v.moTa}</p>}
                {moId === v.id && <div className="mt-2"><ChiTietViPham violationId={v.id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: d.ten })} onDaXoa={() => { setMoId(null); lamMoi(); }} onMoXuLy={() => setXuLy(true)} /></div>}
              </li>
            ))}
          </ul>
        )}
        <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-y-1 text-sm">
          <dt className="text-slate-500">{t('Mốc')}</dt><dd className="m-0 text-slate-100">{chuMoc(d.bac)} · {t('Bậc kế')} <b>{bacDu(dich(d.keTiep.nhan))}</b></dd>
        </dl>
        <Link className="link self-start text-[13px] font-semibold" to={`/hoc-vien/${studentId}?tab=y-thuc`}>{t('Hồ sơ Ý thức của em ›')}</Link>
      </div>
      {panels}
    </KhungPanel>
  );
}
