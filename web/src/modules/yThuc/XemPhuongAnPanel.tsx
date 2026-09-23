import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay } from '@shared/domain/index.ts';

/**
 * PANEL CHỈ ĐỌC MỘT PA XỬ LÝ (PR-HV, spec §4.3 — nút `Xem`; PR-UX3: cùng vỏ `KhungPanel`). Dữ liệu từ `GET /measures/:id`.
 * Không sửa gì ở đây, TRỪ ghi chú khi đã thực hiện (YT-10, Q9): GVCN/Quản lý bổ sung được sau khi việc đã xong; riêng
 * tệp/liên kết vẫn bổ sung được sau khi đã thực hiện (B10) — quyền do máy chủ kiểm.
 */
export function XemPhuongAnPanel({ measureId, onClose }: { measureId: number | null; onClose: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error, reload } = useApi<any>(measureId !== null ? `/measures/${measureId}` : null, [measureId]);
  const [suaGhiChu, setSuaGhiChu] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSuaGhiChu(false); }, [measureId]);

  if (measureId === null) return null;

  const luuGhiChu = async () => {
    setBusy(true);
    try {
      await api.patch(`/measures/${measureId}`, { note: note.trim() || null });
      invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã lưu ghi chú');
      setSuaGhiChu(false);
      reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={d ? d.kindLabel : 'Phương án xử lý'} hocVien={d?.studentName} onDong={onClose}
      ngCanh={d ? <span className="truncate">{d.statusLabel}{d.ownerName ? ` · phụ trách ${d.ownerName}` : ''}</span> : undefined}
      chan={{ huy: { nhan: 'Đóng', onClick: onClose } }}>
      {error ? <div className="pt-3"><ErrorState message={error.message} onRetry={reload} /></div> : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
        <>
          <Khoi tieuDe="Đã thực hiện">
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <Truong nhan="Ngày thực hiện" as="div">{ngay(d.performedOn, homNay)}</Truong>
              <Truong nhan="Người thực hiện" as="div">{d.performedByName ?? d.performerName ?? '—'}</Truong>
            </div>
            {d.participants && <Truong nhan="Người tham gia" as="div"><span className="text-sm text-slate-200">{d.participants}</span></Truong>}
            <Truong nhan="Lý do / nội dung" as="div">
              {suaGhiChu ? (
                <div className="space-y-2">
                  <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setSuaGhiChu(false)}>Huỷ</button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={luuGhiChu}>Lưu</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-200">{d.note ?? '—'}</p>
                  {d.status === 'done' && d.canManage && (
                    <button type="button" className="link mt-1 appearance-none border-0 bg-transparent p-0 text-xs"
                      onClick={() => { setNote(d.note ?? ''); setSuaGhiChu(true); }}>
                      Sửa ghi chú
                    </button>
                  )}
                </>
              )}
            </Truong>
          </Khoi>
          <Khoi tieuDe={`Vi phạm được xử lý · ${(d.violations ?? []).length}`}>
            <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-400">
              {(d.violations ?? []).map((v: any) => (
                <li key={v.id} className="break-words">{ngay(v.occurredOn, homNay)} · {v.categoryLabel} · {v.description}</li>
              ))}
            </ul>
          </Khoi>
          <Khoi tieuDe="Tệp hoặc liên kết">
            <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={!!d.canManage} tieuDe="" />
          </Khoi>
          {d.confirmedByName && (
            <p className="mt-3.5 text-[11px] text-slate-500">Xác nhận bởi {d.confirmedByName} · {ngay(d.confirmedAt, homNay)}</p>
          )}
        </>
      )}
    </KhungPanel>
  );
}
