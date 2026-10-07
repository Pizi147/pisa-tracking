import { useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { kindCuaBac, ngay, nhanLoaiXuLy } from '@shared/domain/index.ts';
import { lamMoiYThuc, type XuLyView } from './kieu.ts';

/**
 * XEM MỘT LẦN XỬ LÝ — `GET /y-thuc/xu-ly/:id`. Lần xử lý đã xong, đề xuất đang chờ / đã duyệt / bị từ chối (lý do từ chối nằm ở thẻ — Q13). Tệp/liên kết vẫn
 * bổ sung được khi người xem xử lý được Ý thức của em (quyền do máy chủ kiểm).
 *
 * PR-LUI-a1 (mockup 16–17): `Sửa vi phạm` (thêm / bỏ vi phạm của lần xử lý, còn ≥ 1) và `Xoá lần xử lý` (chỉ lần mới nhất của chuỗi; hỏi một dòng,
 * bậc tự tính lại). Quyền do máy chủ tính: `coTheSua` / `coTheXoa` — nút chỉ hiện khi máy chủ cho.
 */
export function XemXuLyPanel({ measureId, onClose, onDaThucHien, onDone }: {
  measureId: number | null; onClose: () => void;
  /** Đề xuất đã duyệt, chờ "Đã thực hiện" → nút mở panel Đã thực hiện. */
  onDaThucHien?: (id: number) => void;
  /** Sau khi sửa / xoá: nơi gọi làm mới thang + danh sách. */
  onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error, reload } = useApi<XuLyView>(measureId !== null ? `/y-thuc/xu-ly/${measureId}` : null, [measureId]);
  const [sua, setSua] = useState(false);
  const [chon, setChon] = useState<number[]>([]);
  const [daBam, setDaBam] = useState(false);
  const [hoiXoa, setHoiXoa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  if (measureId === null) return null;
  const the = d?.the;

  const moSua = () => { if (d) { setChon(d.viPham.map((v) => v.id)); setDaBam(false); setLoiMay(null); setSua(true); } };
  const dong = () => { setSua(false); setHoiXoa(false); setLoiMay(null); onClose(); };
  const doi = (id: number) => setChon((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const luu = async () => {
    setDaBam(true);
    if (!chon.length || !d) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.patch(`/discipline-measures/${d.id}/vi-pham`, { violationIds: chon });
      lamMoiYThuc(); onDone?.(); reload();
      toast.push('ok', 'Đã lưu lần xử lý');
      setSua(false);
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  const xoa = async () => {
    if (!d) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.del(`/discipline-measures/${d.id}`);
      lamMoiYThuc(); toast.push('ok', `Đã xoá ${d.nhan}`);
      setHoiXoa(false); dong(); onDone?.();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  /* Mọi vi phạm để chọn: đang gắn (đã chọn sẵn) + chưa xử lý của em, cũ trước mới sau. */
  const dsChon = d ? [...d.viPham, ...d.chuaXuLy].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id) : [];
  const dangGan = new Set(d?.viPham.map((v) => v.id));
  const bacVe = d?.bacVe ? nhanLoaiXuLy(kindCuaBac(d.bacVe)) : 'chưa có bậc';

  return (
    <>
      <KhungPanel tieuDe={d ? d.nhan : 'Lần xử lý'} hocVien={d?.ten} onDong={dong}
        ngCanh={d ? <span className="truncate">{d.statusLabel}{d.bac ? ` · bậc ${d.bac} trên thang` : ' · ngoài thang, không đổi bậc'}</span> : undefined}
        chan={{
          huy: sua ? { nhan: 'Huỷ thay đổi', onClick: () => setSua(false), disabled: busy } : { nhan: 'Đóng', onClick: dong },
          xoa: d?.coTheXoa && !sua ? { nhan: 'Xoá lần xử lý', onClick: () => { setLoiMay(null); setHoiXoa(true); } } : undefined,
          chinh: sua
            ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
            : d?.status === 'da_duyet' && d.canManage && onDaThucHien
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
              {d.coTheSua && !sua && <button type="button" className="btn btn-sm self-start" onClick={moSua}>Sửa vi phạm</button>}
              {sua ? (
                <>
                  <ul className="m-0 list-none space-y-0.5 p-0">
                    {dsChon.map((v) => (
                      <li key={v.id}>
                        <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 sm:min-h-0">
                          <input type="checkbox" className="mt-1" checked={chon.includes(v.id)} onChange={() => doi(v.id)} aria-label={`${ngay(v.occurredOn, homNay)} ${v.categoryLabel}: ${v.ten}`} />
                          <span className="min-w-0 flex-1 text-sm text-slate-200">
                            {v.ten}
                            <span className="block text-xs text-slate-500">{ngay(v.occurredOn, homNay)} · {v.categoryLabel}{dangGan.has(v.id) ? '' : ' · chưa xử lý'}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {daBam && !chon.length && <p className="m-0 text-xs text-late" role="alert">Còn ít nhất 1 vi phạm</p>}
                  {loiMay && <p className="m-0 text-xs text-late" role="alert">{loiMay}</p>}
                </>
              ) : d.viPham.length === 0 ? <p className="m-0 text-xs text-slate-400">Vi phạm đã bị xoá — lần xử lý vẫn giữ, bậc không lùi.</p> : (
                <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-400">
                  {d.viPham.map((v) => <li key={v.id} className="break-words">{ngay(v.occurredOn, homNay)} · {v.categoryLabel} · {v.ten}</li>)}
                </ul>
              )}
            </Khoi>
            <Khoi tieuDe="Tệp hoặc liên kết">
              <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" />
            </Khoi>
          </>
        )}
      </KhungPanel>

      {/* Hộp hỏi MỘT DÒNG (mẫu `DeleteViolationConfirm`): panel con, lớp z trên, không đóng panel này. */}
      {hoiXoa && d && (
        <KhungPanel tieuDe="Xoá lần xử lý này?" longTrong z="z-[60]" onDong={() => !busy && setHoiXoa(false)}
          chan={{
            huy: { onClick: () => setHoiXoa(false), disabled: busy },
            chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoa()}>{busy ? 'Đang xoá…' : 'Xoá lần xử lý'}</button>,
          }}>
          <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">{d.nhan} · {d.viPham.length} vi phạm · bậc về {bacVe}</p>
          {loiMay && <p className="m-0 mt-2 text-xs text-late" role="alert">{loiMay}</p>}
        </KhungPanel>
      )}
    </>
  );
}
