import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { kindCuaBac, ngay, nguoiThanhPayload, nguoiThieu, nhanLoaiXuLy, type NguoiChon } from '@shared/domain/index.ts';
import { lamMoiYThuc, type XuLyView } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * XEM MỘT LẦN XỬ LÝ — `GET /y-thuc/xu-ly/:id`. Lần xử lý đã xong, đề xuất đang chờ / đã duyệt / bị từ chối (lý do từ chối nằm ở thẻ — Q13). Tệp/liên kết vẫn
 * bổ sung được khi người xem xử lý được Ý thức của em (quyền do máy chủ kiểm).
 *
 * PR-LUI-a1 (mockup 16–17): `Sửa vi phạm` (thêm / bỏ vi phạm của lần xử lý, còn ≥ 1) và `Xoá lần xử lý` (chỉ lần mới nhất của chuỗi; hỏi một dòng,
 * bậc tự tính lại). Quyền do máy chủ tính: `coTheSua` / `coTheXoa` — nút chỉ hiện khi máy chủ cho.
 * OV-7a: lần đã thực hiện `Sửa` ngày / người / mô tả; đề xuất QL đã duyệt mà bấm nhầm "Đã thực hiện" → `Chưa thực hiện`; đề xuất còn chờ: người gửi
 * `Sửa` mô tả (thẻ Chờ duyệt đổi theo) hoặc `Rút đề xuất` (thay Xoá lần xử lý — thẻ đóng "Người gửi đã rút").
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
  /* OV-7a: sửa thông tin (ngày / người / mô tả) — `null` = không sửa. */
  const [tt, setTt] = useState<{ ngay: string; nguoi: NguoiChon | null; moTa: string } | null>(null);
  const { session } = useSession();
  if (measureId === null) return null;
  const the = d?.the;
  const laNguoiGui = !!the && the.trangThai === 'cho' && the.nguoiXinId === session?.user?.id;
  const rutDuoc = d?.status === 'cho_duyet' && laNguoiGui;

  const moSua = () => { if (d) { setChon(d.viPham.map((v) => v.id)); setDaBam(false); setLoiMay(null); setTt(null); setSua(true); } };
  const moSuaTt = () => {
    if (!d) return;
    setSua(false); setDaBam(false); setLoiMay(null);
    setTt({ ngay: d.performedOn ?? '', moTa: d.note ?? '', nguoi: d.nguoiNgoai ? { kieu: 'ngoai', ten: d.nguoiNgoai } : d.nguoiId ? { kieu: 'tai_khoan', id: d.nguoiId, ten: d.nguoi ?? '' } : null });
  };
  const dong = () => { setSua(false); setTt(null); setHoiXoa(false); setLoiMay(null); onClose(); };
  const loiTt = tt ? (tt.moTa.trim().length < 10 ? t('Mô tả cần ít nhất 10 ký tự') : d?.status === 'done' && !tt.ngay ? t('Chọn ngày thực hiện') : d?.status === 'done' ? nguoiThieu(tt.nguoi, true) : null) : null;

  const luuTt = async () => {
    setDaBam(true);
    if (!d || !tt || loiTt) return;
    setBusy(true); setLoiMay(null);
    try {
      if (d.status === 'done') await api.patch(`/discipline-measures/${d.id}`, { note: tt.moTa.trim(), performedOn: tt.ngay, ...nguoiThanhPayload(tt.nguoi) });
      else await api.put(`/yeu-cau/${the!.id}`, { note: tt.moTa.trim() });
      lamMoiYThuc(); invalidate('/yeu-cau'); onDone?.(); reload();
      toast.push('ok', t('Đã lưu lần xử lý'));
      setTt(null); setDaBam(false);
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  const chuaThucHien = async () => {
    if (!d) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/y-thuc/xu-ly/${d.id}/chua-thuc-hien`);
      lamMoiYThuc(); onDone?.(); reload();
      toast.push('ok', t('{nhan}: về Đã duyệt · chờ thực hiện', { nhan: d.nhan }));
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  const doi = (id: number) => setChon((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const luu = async () => {
    setDaBam(true);
    if (!chon.length || !d) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.patch(`/discipline-measures/${d.id}/vi-pham`, { violationIds: chon });
      lamMoiYThuc(); onDone?.(); reload();
      toast.push('ok', t('Đã lưu lần xử lý'));
      setSua(false);
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  const xoa = async () => {
    if (!d) return;
    setBusy(true); setLoiMay(null);
    try {
      if (rutDuoc) await api.post(`/yeu-cau/${the!.id}/rut`);
      else await api.del(`/discipline-measures/${d.id}`);
      lamMoiYThuc(); invalidate('/yeu-cau'); toast.push('ok', rutDuoc ? t('Đã rút đề xuất {nhan}', { nhan: d.nhan }) : t('Đã xoá {nhan}', { nhan: d.nhan }));
      setHoiXoa(false); dong(); onDone?.();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  /* Mọi vi phạm để chọn: đang gắn (đã chọn sẵn) + chưa xử lý của em, cũ trước mới sau. */
  const dsChon = d ? [...d.viPham, ...d.chuaXuLy].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id) : [];
  const dangGan = new Set(d?.viPham.map((v) => v.id));
  const bacVe = d?.bacVe ? nhanLoaiXuLy(kindCuaBac(d.bacVe)) : t('chưa có bậc');

  return (
    <>
      <KhungPanel tieuDe={d ? dich(d.nhan) : t('Lần xử lý')} hocVien={d?.ten} onDong={dong}
        ngCanh={d ? <span className="truncate">{dich(d.statusLabel)}{d.bac ? t(' · bậc {bac} trên thang', { bac: d.bac }) : t(' · ngoài thang, không đổi bậc')}</span> : undefined}
        chan={{
          huy: sua || tt ? { nhan: t('Huỷ thay đổi'), onClick: () => { setSua(false); setTt(null); setLoiMay(null); }, disabled: busy } : { nhan: t('Đóng'), onClick: dong },
          xoa: (d?.coTheXoa || rutDuoc) && !sua && !tt ? { nhan: rutDuoc ? t('Rút đề xuất') : t('Xoá lần xử lý'), onClick: () => { setLoiMay(null); setHoiXoa(true); } } : undefined,
          phu: d?.status === 'done' && d.quyetLuc && d.coTheSua && !sua && !tt
            ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void chuaThucHien()}>{t('Chưa thực hiện')}</button> : undefined,
          conThieu: tt && daBam && loiTt ? [{ nhan: t('Lần xử lý'), lyDo: loiTt }] : undefined,
          chinh: sua
            ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
            : tt
              ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luuTt()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
              : d?.status === 'da_duyet' && d.canManage && onDaThucHien
                ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => onDaThucHien(d.id)}>{t('Đã thực hiện…')}</button> : undefined,
        }}>
        {error ? <div className="pt-3"><ErrorState message={error.message} onRetry={reload} /></div> : !d ? <div className="pt-3"><Skeleton rows={4} /></div> : (
          <>
            {d.status === 'done' && tt ? (
              <Khoi tieuDe={t('Đã thực hiện')}>
                <Hang2>
                  <Truong nhan={t('Ngày thực hiện')} batBuoc loi={daBam && !tt.ngay ? t('Chọn ngày thực hiện') : null}>
                    <ChonNgayGan value={tt.ngay} onChange={(v) => setTt({ ...tt, ngay: v })} />
                  </Truong>
                  <Truong nhan={t('Người thực hiện')} batBuoc as="div" loi={daBam ? nguoiThieu(tt.nguoi, true) : null}>
                    <ChonNguoi nhom="nhan_vien" value={tt.nguoi} onChange={(v) => setTt({ ...tt, nguoi: v })} studentId={d.studentId} />
                  </Truong>
                </Hang2>
                <Truong nhan={t('Mô tả')} batBuoc loi={daBam && tt.moTa.trim().length < 10 ? t('Cần ít nhất 10 ký tự') : null} dem={{ co: tt.moTa.trim().length, can: 10 }}>
                  <textarea className="field w-full" rows={3} value={tt.moTa} onChange={(e) => setTt({ ...tt, moTa: e.target.value })} />
                </Truong>
                {loiMay && <p className="m-0 text-xs text-late" role="alert">{loiMay}</p>}
              </Khoi>
            ) : d.status === 'done' ? (
              <Khoi tieuDe={t('Đã thực hiện')}>
                {d.coTheSua && !sua && <button type="button" className="btn btn-sm min-h-[44px] self-start sm:min-h-0" onClick={moSuaTt}>{t('Sửa')}</button>}
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <Truong nhan={t('Ngày thực hiện')} as="div">{ngay(d.performedOn, homNay)}</Truong>
                  <Truong nhan={t('Người thực hiện')} as="div">{d.nguoi ?? '—'}</Truong>
                </div>
                <Truong nhan={t('Mô tả')} as="div"><p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-200">{d.note ?? '—'}</p></Truong>
                {!tt && !sua && !hoiXoa && loiMay && <p className="m-0 text-xs text-late" role="alert">{loiMay}</p>}
              </Khoi>
            ) : (
              <Khoi tieuDe={t('Đề xuất QL duyệt')}>
                {rutDuoc && !tt && !sua && <button type="button" className="btn btn-sm min-h-[44px] self-start sm:min-h-0" onClick={moSuaTt}>{t('Sửa')}</button>}
                {tt ? (
                  <Truong nhan={t('Mô tả')} batBuoc loi={daBam && tt.moTa.trim().length < 10 ? t('Cần ít nhất 10 ký tự') : null} dem={{ co: tt.moTa.trim().length, can: 10 }}>
                    <textarea className="field w-full" rows={3} value={tt.moTa} onChange={(e) => setTt({ ...tt, moTa: e.target.value })} />
                  </Truong>
                ) : <p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-200">{d.note ?? '—'}</p>}
                {tt && loiMay && <p className="m-0 text-xs text-late" role="alert">{loiMay}</p>}
                {the && (
                  <p className="m-0 text-xs text-slate-400">
                    {t('Gửi {ngay}{x}{x2}{x3}', { ngay: ngay(the.taoLuc, homNay), x: the.trangThai === 'cho' && the.hanDuyet ? t(' · QL trả lời trước {ngay}', { ngay: ngay(the.hanDuyet, homNay) }) : '', x2: the.trangThai === 'duyet' ? t(' · {x} đã duyệt {ngay} — ghi "Đã thực hiện" trong 5 ngày', { x: the.nguoiDuyet ?? 'QL', ngay: ngay(d.quyetLuc, homNay) }) : '', x3: the.trangThai === 'tu_choi' ? t(' · {x} từ chối {ngay}: “{x2}”', { x: the.nguoiDuyet ?? 'QL', ngay: ngay(d.quyetLuc, homNay), x2: the.lyDoTuChoi ?? '' }) : '' })}
                  </p>
                )}
              </Khoi>
            )}
            <Khoi tieuDe={t('Vi phạm · {length}', { length: d.viPham.length })}>
              {d.coTheSua && !sua && <button type="button" className="btn btn-sm self-start" onClick={moSua}>{t('Sửa vi phạm')}</button>}
              {sua ? (
                <>
                  <ul className="m-0 list-none space-y-0.5 p-0">
                    {dsChon.map((v) => (
                      <li key={v.id}>
                        <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 sm:min-h-0">
                          <input type="checkbox" className="mt-1" checked={chon.includes(v.id)} onChange={() => doi(v.id)} aria-label={`${ngay(v.occurredOn, homNay)} ${dich(v.categoryLabel)}: ${v.ten}`} />
                          <span className="min-w-0 flex-1 text-sm text-slate-200">
                            {v.ten}
                            <span className="block text-xs text-slate-500">{ngay(v.occurredOn, homNay)} · {dich(v.categoryLabel)}{dangGan.has(v.id) ? '' : t(' · chưa xử lý')}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {daBam && !chon.length && <p className="m-0 text-xs text-late" role="alert">{t('Còn ít nhất 1 vi phạm')}</p>}
                  {loiMay && <p className="m-0 text-xs text-late" role="alert">{loiMay}</p>}
                </>
              ) : d.viPham.length === 0 ? <p className="m-0 text-xs text-slate-400">{t('Vi phạm đã bị xoá — lần xử lý vẫn giữ, bậc không lùi.')}</p> : (
                <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-400">
                  {d.viPham.map((v) => <li key={v.id} className="break-words">{ngay(v.occurredOn, homNay)} · {dich(v.categoryLabel)} · {v.ten}</li>)}
                </ul>
              )}
            </Khoi>
            <Khoi tieuDe={t('Tệp hoặc liên kết')}>
              <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" />
            </Khoi>
          </>
        )}
      </KhungPanel>

      {/* Hộp hỏi MỘT DÒNG (mẫu `DeleteViolationConfirm`): panel con, lớp z trên, không đóng panel này. */}
      {hoiXoa && d && (
        <KhungPanel tieuDe={rutDuoc ? t('Rút đề xuất này?') : t('Xoá lần xử lý này?')} longTrong z="z-[60]" onDong={() => !busy && setHoiXoa(false)}
          chan={{
            huy: { onClick: () => setHoiXoa(false), disabled: busy },
            chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoa()}>
              {busy ? (rutDuoc ? t('Đang rút…') : t('Đang xoá…')) : rutDuoc ? t('Rút đề xuất') : t('Xoá lần xử lý')}</button>,
          }}>
          <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">
            {rutDuoc ? t('{nhan} · {length} vi phạm về chưa xử lý · {soTep} tệp bằng chứng bị xoá', { nhan: d.nhan, length: d.viPham.length, soTep: d.soTep }) : t('{nhan} · {length} vi phạm · bậc về {bacVe}', { nhan: d.nhan, length: d.viPham.length, bacVe })}
          </p>
          {loiMay && <p className="m-0 mt-2 text-xs text-late" role="alert">{loiMay}</p>}
        </KhungPanel>
      )}
    </>
  );
}
