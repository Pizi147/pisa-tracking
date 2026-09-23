import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { demLanSua, nhanLichSuViPham } from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

export type ViolationDetail = {
  id: number; studentId: number;
  category: string; skill: string | null; occurredOn: string; description: string;
  canEdit: boolean; attachmentCount: number;
  measures: { id: number; kindLabel: string; status: string; statusLabel: string }[];
  history: { id: number; field: string; oldValue: string | null; newValue: string | null; actorUserId: number | null; actorName: string | null; createdAt: string }[];
};

/**
 * CHI TIẾT MỘT VI PHẠM — vẽ ngay dưới dòng khi mở tại chỗ (YT-1, YT-13; kế hoạch Task 3).
 * Bốn khối: Bằng chứng · Phương án (nút mở đúng PA) · Đã sửa {n} lần · Xem · Sửa/Xoá tại dòng.
 */
export function ChiTietViPham({
  violationId, canManage, boQuaPhuongAnId, choSua, choXoa, onSua, onDaXoa, onMoPhuongAn,
}: {
  violationId: number;
  /** Chưa dùng trực tiếp — quyền Sửa/Xoá lấy từ `d.canEdit` do máy chủ tính đúng theo người ghi/GVCN/Quản lý; giữ tham số để nơi gọi truyền cho khớp chữ ký kế hoạch. */
  canManage: boolean;
  /** PA đang mở sẵn (không hiện nút mở lại chính nó). */
  boQuaPhuongAnId?: number | null;
  /** `false` khi PA cha đang có thay đổi chưa lưu — khoá Sửa (Q3). Mặc định cho sửa. */
  choSua?: boolean;
  /** `false` khi PA cha đang có thay đổi chưa lưu, HOẶC đây là vi phạm duy nhất của PA — khoá Xoá (không khoá Sửa). Mặc định cho xoá. */
  choXoa?: boolean;
  onSua: (v: ViolationDetail) => void;
  onDaXoa: () => void;
  onMoPhuongAn: (m: { id: number; status: string }) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, reload } = useApi<ViolationDetail>(`/violations/${violationId}`, [violationId]);
  const [hoiXoa, setHoiXoa] = useState(false);
  const [errXoa, setErrXoa] = useState<string | null>(null);
  const [xemLichSu, setXemLichSu] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!d) return <Skeleton rows={3} />;

  const soLanSua = demLanSua(d.history);
  const suaDuoc = d.canEdit && choSua !== false;
  const xoaDuoc = d.canEdit && choXoa !== false;

  const xoa = async () => {
    setBusy(true); setErrXoa(null);
    try {
      await api.del(`/violations/${violationId}`);
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã xoá vi phạm');
      onDaXoa();
    } catch (e: any) {
      /* Q15: lỗi 400 hiện ngay dưới, KHÔNG đóng hộp hỏi — người dùng vừa đọc lý do vừa quyết định bước tiếp theo. */
      setErrXoa(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2.5 text-sm">
      <div>
        <p className="text-[11px] text-slate-500 m-0 mb-1">Bằng chứng</p>
        <BangChung ownerType="violation" ownerId={d.id} canEdit={d.canEdit} tieuDe="" onChanged={reload} />
      </div>

      <div>
        <p className="text-[11px] text-slate-500 m-0 mb-1">Phương án</p>
        {d.measures.filter((m) => m.id !== boQuaPhuongAnId).length === 0 ? <p className="text-slate-400 m-0">—</p> : (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {d.measures.filter((m) => m.id !== boQuaPhuongAnId).map((m) => (
              <button key={m.id} type="button" className="text-sky-300 hover:underline" onClick={() => onMoPhuongAn(m)}>
                {m.kindLabel} · {m.statusLabel.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {soLanSua > 0 && (
        <div>
          <button type="button" className="text-[11px] text-slate-500 hover:underline underline-offset-2" aria-expanded={xemLichSu}
            onClick={() => setXemLichSu((v) => !v)}>
            Đã sửa {soLanSua} lần · Xem
          </button>
          {xemLichSu && (
            <ul className="list-none p-0 m-0 mt-1 space-y-0.5 text-[11px] text-slate-400">
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

      <div className="flex items-center gap-2 pt-1">
        {suaDuoc && <button type="button" className="btn btn-sm" onClick={() => onSua(d)}>Sửa</button>}
        {xoaDuoc && (!hoiXoa ? (
          <button type="button" className="btn btn-sm btn-ghost text-rose-200" onClick={() => setHoiXoa(true)}>Xoá</button>
        ) : (
          <span className="flex flex-wrap items-center gap-2 text-xs text-amber-200/90">
            Xoá vi phạm này? Nó sẽ bị gỡ khỏi {d.measures.length} phương án.
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => { setHoiXoa(false); setErrXoa(null); }}>Huỷ</button>
            <button type="button" className="btn btn-sm text-rose-200" disabled={busy} onClick={xoa}>Xoá</button>
          </span>
        ))}
        {/* Chỉ dirty (chưa lưu) mới nói "lưu phương án trước" — vi phạm duy nhất (chỉ khoá Xoá) không có gì chưa lưu thì im lặng. */}
        {d.canEdit && choSua === false && <span className="text-[11px] text-amber-200/80" title="Lưu phương án trước">Sửa · Xoá — lưu phương án trước</span>}
      </div>
      {errXoa && <p className="text-xs text-rose-300 m-0">{errXoa}</p>}
    </div>
  );
}
