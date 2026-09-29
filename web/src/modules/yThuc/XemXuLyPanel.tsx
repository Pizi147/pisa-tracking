import { useApi } from '../../lib/useApi.ts';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay } from '@shared/domain/index.ts';
import type { XuLyView } from './kieu.ts';

/**
 * XEM MỘT LẦN XỬ LÝ (chỉ đọc) — `GET /y-thuc/xu-ly/:id`. Lần xử lý đã xong, đề xuất đang chờ / đã duyệt / bị từ chối (lý do từ chối nằm
 * ở thẻ — Q13). Tệp/liên kết vẫn bổ sung được khi người xem xử lý được Ý thức của em (quyền do máy chủ kiểm).
 */
export function XemXuLyPanel({ measureId, onClose, onDaThucHien }: {
  measureId: number | null; onClose: () => void;
  /** Đề xuất đã duyệt, chờ "Đã thực hiện" → nút mở panel Đã thực hiện. */
  onDaThucHien?: (id: number) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data: d, error, reload } = useApi<XuLyView>(measureId !== null ? `/y-thuc/xu-ly/${measureId}` : null, [measureId]);
  if (measureId === null) return null;
  const the = d?.the;
  return (
    <KhungPanel tieuDe={d ? d.nhan : 'Lần xử lý'} hocVien={d?.ten} onDong={onClose}
      ngCanh={d ? <span className="truncate">{d.statusLabel}{d.bac ? ` · bậc ${d.bac} trên thang` : ' · ngoài thang, không đổi bậc'}</span> : undefined}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose },
        chinh: d?.status === 'da_duyet' && d.canManage && onDaThucHien
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => onDaThucHien(d.id)}>Đã thực hiện…</button> : undefined,
      }}>
      {error ? <div className="pt-3"><ErrorState message={error.message} onRetry={reload} /></div> : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
        <>
          {d.status === 'done' ? (
            <Khoi tieuDe="Đã thực hiện">
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <Truong nhan="Ngày thực hiện" as="div">{ngay(d.performedOn, homNay)}</Truong>
                <Truong nhan="Người thực hiện" as="div">{d.nguoi ?? '—'}</Truong>
              </div>
              <Truong nhan="Mô tả" as="div"><p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-200">{d.note ?? '—'}</p></Truong>
            </Khoi>
          ) : (
            <Khoi tieuDe="Đề xuất QL duyệt">
              <p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-200">{d.note ?? '—'}</p>
              {the && (
                <p className="m-0 text-xs text-slate-400">
                  Gửi {ngay(the.taoLuc, homNay)}
                  {the.trangThai === 'cho' && the.hanDuyet ? ` · QL trả lời trước ${ngay(the.hanDuyet, homNay)}` : ''}
                  {the.trangThai === 'duyet' ? ` · ${the.nguoiDuyet ?? 'QL'} đã duyệt ${ngay(d.quyetLuc, homNay)} — ghi "Đã thực hiện" trong 5 ngày` : ''}
                  {the.trangThai === 'tu_choi' ? ` · ${the.nguoiDuyet ?? 'QL'} từ chối ${ngay(d.quyetLuc, homNay)}: “${the.lyDoTuChoi ?? ''}”` : ''}
                </p>
              )}
            </Khoi>
          )}
          <Khoi tieuDe={`Vi phạm · ${d.viPham.length}`}>
            {d.viPham.length === 0 ? <p className="m-0 text-xs text-slate-400">Vi phạm đã bị xoá — lần xử lý vẫn giữ, bậc không lùi.</p> : (
              <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-400">
                {d.viPham.map((v) => <li key={v.id} className="break-words">{ngay(v.occurredOn, homNay)} · {v.categoryLabel} · {v.description}</li>)}
              </ul>
            )}
          </Khoi>
          <Khoi tieuDe="Tệp hoặc liên kết">
            <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" />
          </Khoi>
        </>
      )}
    </KhungPanel>
  );
}
