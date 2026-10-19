import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ConfirmDialog, Modal } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { KN_TUTOR, ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { boDau, type ChiNhanh, type DongTutor } from './kieu.ts';

type LoiO = Partial<Record<'ten' | 'sdt' | 'noiDay' | 'kyNang', string>>;

/**
 * HỘP THÊM / SỬA TUTOR (TU-b, đặc tả mục 8, mockup mục 5) — 4 ô như cột Excel; chỉ Tên + Kỹ năng bắt buộc (13.2). SĐT trùng → lỗi tại ô (máy chủ);
 * tên trùng tutor khác → dòng nhắc, vẫn lưu được. "Xoá tutor" chỉ khi tutor chưa có buổi nào (có buổi → kết luận "Ngừng hợp tác").
 */
export function HopTutor({ dsChiNhanh, ds, tutor, coBuoi = true, tenSan, onDong, onXong, onXoa }: {
  dsChiNhanh: ChiNhanh[]; ds: DongTutor[]; tutor?: DongTutor; coBuoi?: boolean; tenSan?: string;
  onDong: () => void; onXong: (id: number) => void; onXoa?: () => void;
}) {
  const toast = useToast();
  const [ten, setTen] = useState(tutor?.ten ?? tenSan ?? '');
  const [sdt, setSdt] = useState(tutor?.sdt ?? '');
  const [noi, setNoi] = useState(tutor?.noiDay === 'online' ? 'online' : tutor?.noiDay ? String(tutor.noiDay.id) : '');
  const [kn, setKn] = useState<string[]>(tutor?.kyNang ?? []);
  const [loi, setLoi] = useState<LoiO & { chung?: string }>({});
  const [gui, setGui] = useState(false);
  const [hoiXoa, setHoiXoa] = useState(false);
  const trungTen = !!ten.trim() && ds.some((d) => d.id !== tutor?.id && boDau(d.ten) === boDau(ten));

  async function luu() {
    const l: LoiO = { ten: ten.trim() ? undefined : t('Nhập tên tutor.'), kyNang: kn.length ? undefined : t('Chọn ít nhất một kỹ năng.') };
    if (l.ten || l.kyNang) { setLoi(l); return; }
    setGui(true);
    try {
      const than = { ten: ten.trim(), sdt: sdt.trim() || null, noiDay: noi === '' ? null : noi === 'online' ? 'online' : Number(noi), kyNang: kn };
      const kq = tutor ? await api.patch<{ id: number }>(`/tutors/${tutor.id}`, than) : await api.post<{ id: number }>('/tutors', than);
      invalidate('/tutors');
      toast.push('ok', tutor ? t('Đã lưu tutor') : t('Đã thêm tutor {ten}', { ten: than.ten }));
      onXong(kq.id);
    } catch (e) {
      const d = e instanceof ApiError ? e.details?.loi : null;
      setLoi(d && typeof d === 'object' ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, dich(String(v))])) : { chung: e instanceof Error ? e.message : t('Không lưu được — thử lại.') });
    } finally { setGui(false); }
  }
  async function xoa() {
    if (!tutor) return;
    setGui(true);
    try {
      await api.del(`/tutors/${tutor.id}`);
      invalidate('/tutors');
      toast.push('ok', t('Đã xoá tutor {ten}', { ten: tutor.ten }));
      onXoa?.();
    } catch (e) {
      setHoiXoa(false);
      setLoi({ chung: e instanceof Error ? e.message : t('Không xoá được — thử lại.') });
    } finally { setGui(false); }
  }

  return (
    <Modal open onClose={onDong} z="z-[60]" title={tutor ? t('Sửa tutor') : t('Thêm tutor')}
      footer={<>
        {tutor && !coBuoi && <button type="button" className="btn mr-auto min-h-[44px] text-late sm:min-h-0" onClick={() => setHoiXoa(true)}>{t('Xoá tutor')}</button>}
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui} onClick={luu}>{t('Lưu')}</button>
      </>}>
      <div className="space-y-3">
        <Truong nhan={t('Tên')} batBuoc loi={loi.ten}>
          <input className="field w-full" value={ten} maxLength={100} autoFocus onChange={(e) => { setTen(e.target.value); setLoi({ ...loi, ten: undefined }); }} />
        </Truong>
        {trungTen && <p className="-mt-2 mb-0 text-xs text-slate-400">{t('Đã có tutor tên này — thêm SĐT để phân biệt.')}</p>}
        <Truong nhan={t('SĐT')} loi={loi.sdt} phu={t('Để trống được, bổ sung sau.')}>
          <input className="field w-full tabular-nums" inputMode="tel" value={sdt} onChange={(e) => { setSdt(e.target.value); setLoi({ ...loi, sdt: undefined }); }} />
        </Truong>
        <Truong nhan={t('Nơi dạy chính')} loi={loi.noiDay}>
          <select className="field w-full" value={noi} onChange={(e) => setNoi(e.target.value)}>
            <option value="">{t('Chưa có')}</option>
            {dsChiNhanh.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
            <option value="online">{t('Chỉ online')}</option>
          </select>
        </Truong>
        <Truong nhan={t('Kỹ năng')} batBuoc as="div" loi={loi.kyNang}>
          <span className="flex flex-wrap gap-1.5">
            {KN_TUTOR.map((k) => (
              <NutChon key={k} nho chon={kn.includes(k)} className="min-w-[52px]"
                onClick={() => { setKn(kn.includes(k) ? kn.filter((x) => x !== k) : [...kn, k]); setLoi({ ...loi, kyNang: undefined }); }}>{k}</NutChon>
            ))}
          </span>
        </Truong>
        {loi.chung && <p role="alert" className="m-0 text-xs text-late">{loi.chung}</p>}
      </div>
      <ConfirmDialog open={hoiXoa} onClose={() => setHoiXoa(false)} onConfirm={xoa} busy={gui} danger z="z-[70]"
        title={t('Xoá tutor {ten}?', { ten: tutor?.ten ?? '' })} body={t('Tutor chưa có buổi dạy nào. Nhận xét về tutor này cũng bị xoá.')} confirmLabel={t('Xoá tutor')} />
    </Modal>
  );
}

type GoTay = { khoa: string; ten: string; soBuoi: number; lop: string[]; ngay: string[] };

/**
 * HỘP GỘP TÊN GÕ TAY (TU-b, đặc tả mục 8, mockup mục 5) — mỗi tên "Tutor khác" một dòng: chọn tutor có sẵn hoặc "Thêm vào danh sách" (mở hộp Thêm điền
 * sẵn tên). Gộp = các buổi đó trỏ về tutor đã chọn (giữ tên đã ghi), một giao dịch; thông báo có Hoàn tác.
 */
export function HopGop({ ds, onDong, onThem }: { ds: DongTutor[]; onDong: () => void; onThem: (ten: string, xong: (id: number) => void) => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<GoTay[]>('/tutors/go-tay', []);
  const [chon, setChon] = useState<Record<string, string>>({});
  const [gui, setGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const muc = Object.entries(chon).filter(([, v]) => /^\d+$/.test(v)).map(([khoa, v]) => ({ khoa, tutorId: Number(v) }));
  const tutors = [...ds].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));

  async function gop() {
    setGui(true);
    try {
      const kq = await api.post<{ nhatKyId: number }>('/tutors/gop', { muc });
      invalidate('/tutors');
      toast.hoanTac(t('Đã gộp {n} tên', { n: muc.length }), async () => {
        try { await api.post('/tutors/gop/hoan-tac', { nhatKyId: kq.nhatKyId }); invalidate('/tutors'); toast.push('ok', t('Đã hoàn tác gộp tên')); }
        catch (e) { toast.push('error', e instanceof Error ? e.message : t('Không hoàn tác được — thử lại.')); }
      });
      onDong();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t('Không gộp được — thử lại.'));
    } finally { setGui(false); }
  }

  return (
    <Modal open onClose={onDong} width="max-w-xl" title={t('Gộp tên gõ tay · {n} tên', { n: data?.length ?? 0 })}
      footer={<>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui || !muc.length} onClick={gop}>{t('Gộp {n} tên', { n: muc.length })}</button>
      </>}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={4} />
        : !data.length ? <p className="m-0 text-sm text-slate-400">{t('Không còn tên gõ tay nào.')}</p> : (
          <ul className="m-0 list-none space-y-2 p-0">
            {data.map((g) => (
              <li key={g.khoa} className="flex flex-wrap items-center gap-2 border-b pb-2 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                <span className="min-w-0 flex-1">
                  <b className="font-semibold text-slate-100">{g.ten}</b>
                  <span className="block text-xs text-slate-400">{[t('{n} buổi', { n: g.soBuoi }), g.lop.join(', '), g.ngay.slice(-3).map((d) => ngay(d, homNay)).join(', ')].filter(Boolean).join(' · ')}</span>
                </span>
                <select className="field w-full text-sm sm:w-56 max-sm:min-h-[44px]" aria-label={t('Gộp "{ten}" vào', { ten: g.ten })} value={chon[g.khoa] ?? ''}
                  onChange={(e) => {
                    if (e.target.value === 'them') onThem(g.ten, (id) => setChon((c) => ({ ...c, [g.khoa]: String(id) })));
                    else setChon({ ...chon, [g.khoa]: e.target.value });
                  }}>
                  <option value="">{t('— Chưa gộp —')}</option>
                  {tutors.map((d) => <option key={d.id} value={d.id}>{d.ten}{d.sdt ? ` · …${d.sdt.slice(-3)}` : ''}</option>)}
                  <option value="them">{t('+ Thêm vào danh sách')}</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      {loi && <p role="alert" className="mb-0 mt-2 text-xs text-late">{loi}</p>}
    </Modal>
  );
}
