import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { hoanTacXoa } from '../../lib/thungRac.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ConfirmDialog, Modal } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ChonNguoi, type KetQuaTutorChon, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { BoLocDoan, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { KN_TUTOR, ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { boDau, type ChiNhanh, type DongTutor } from './kieu.ts';

type LoiO = Partial<Record<'ten' | 'sdt' | 'noiDay' | 'kyNang', string>>;
/** Dòng phụ 13 px ngay dưới tiêu đề hộp (mockup Ⓣ2 H1–H3) — đặt đầu thân hộp để ✕ thẳng tâm dòng tiêu đề. */
const Phu = ({ chu }: { chu: string }) => <p className="-mt-3 mb-3 text-[13px] text-slate-400">{chu}</p>;

/**
 * HỘP THÊM / SỬA TUTOR (TU-b · TU2-6 R2.8, mockup H2) — 4 ô như cột Excel; chỉ Tên + Kỹ năng bắt buộc. SĐT trùng → lỗi tại ô (máy chủ "SĐT đã có: {tên}");
 * tên trùng → dòng nhắc, vẫn lưu được. Head (`chiNhanhDanhBa`): Nơi dạy = đoạn [chi nhánh mình · Chỉ online] (máy chủ chặn chi nhánh khác — TU13).
 * "Xoá tutor" chỉ khi chưa có buổi (có buổi → kết luận "Ngừng hợp tác").
 */
export function HopTutor({ dsChiNhanh, chiNhanhDanhBa, ds, tutor, coBuoi = true, tenSan, onDong, onXong, onXoa }: {
  dsChiNhanh: ChiNhanh[]; chiNhanhDanhBa: ChiNhanh[] | null; ds: DongTutor[]; tutor?: DongTutor; coBuoi?: boolean; tenSan?: string;
  onDong: () => void; onXong: (id: number) => void; onXoa?: () => void;
}) {
  const toast = useToast();
  const head = !!chiNhanhDanhBa;
  const [ten, setTen] = useState(tutor?.ten ?? tenSan ?? '');
  const [sdt, setSdt] = useState(tutor?.sdt ?? '');
  const noi0 = tutor?.noiDay === 'online' ? 'online' : tutor?.noiDay ? String(tutor.noiDay.id) : head ? String(chiNhanhDanhBa[0]?.id ?? 'online') : '';
  const [noi, setNoi] = useState(noi0);
  const [kn, setKn] = useState<string[]>(tutor?.kyNang ?? []);
  const [loi, setLoi] = useState<LoiO & { chung?: string }>({});
  const [gui, setGui] = useState(false);
  const [hoiXoa, setHoiXoa] = useState(false);
  const trung = ten.trim() ? ds.find((d) => d.id !== tutor?.id && boDau(d.ten) === boDau(ten)) : undefined;
  /* RA-2511 (N35): đóng hộp khi đã gõ → hỏi trước (Modal `daSua`), không mất chữ. */
  const daSua = ten !== (tutor?.ten ?? tenSan ?? '') || sdt !== (tutor?.sdt ?? '') || noi !== noi0 || kn.join() !== (tutor?.kyNang ?? []).join();

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
      /* Lỗi: giữ mọi ô đã gõ; lỗi theo ô (SĐT trùng…) đặt dưới ô đó. */
      const d = e instanceof ApiError ? e.details?.loi : null;
      setLoi(d && typeof d === 'object' ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, dich(String(v))])) : { chung: e instanceof Error ? e.message : t('Không lưu được — thử lại.') });
    } finally { setGui(false); }
  }
  async function xoa() {
    if (!tutor) return;
    setGui(true);
    try {
      const r = await api.del<{ thungRacId?: number }>(`/tutors/${tutor.id}`);
      invalidate('/tutors');
      /* R2 C3: xoá mềm — Hoàn tác = khôi phục Thùng rác (tutor + nhận xét). */
      hoanTacXoa(toast, r?.thungRacId, t('Đã xoá tutor {ten}', { ten: tutor.ten }), () => invalidate('/tutors'));
      onXoa?.();
    } catch (e) {
      setHoiXoa(false);
      setLoi({ chung: e instanceof Error ? e.message : t('Không xoá được — thử lại.') });
    } finally { setGui(false); }
  }

  return (
    <Modal open onClose={onDong} z="z-[60]" width="max-w-[330px]" daSua={daSua && !gui}
      title={tutor ? t('Sửa tutor') : t('Thêm tutor')}
      footer={<>
        {tutor && !coBuoi && <button type="button" className="btn mr-auto min-h-[44px] text-late sm:min-h-0" onClick={() => setHoiXoa(true)}>{t('Xoá tutor')}</button>}
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui} onClick={luu}>{gui ? t('Đang lưu…') : t('Lưu')}</button>
      </>}>
      {tutor && !coBuoi && <Phu chu={t('{ten} · chưa có buổi', { ten: tutor.ten })} />}
      <div className="space-y-3">
        <Truong nhan={t('Tên')} batBuoc loi={loi.ten}>
          <input className="field w-full" value={ten} maxLength={100} autoFocus onChange={(e) => { setTen(e.target.value); setLoi({ ...loi, ten: undefined }); }} />
        </Truong>
        {trung && <p className="-mt-2 mb-0 text-xs text-slate-400">{t('Đã có {ten}{sdt} — thêm SĐT để phân biệt', { ten: trung.ten, sdt: trung.sdt ? ` · …${trung.sdt.slice(-3)}` : '' })}</p>}
        <Truong nhan={t('SĐT')} loi={loi.sdt}>
          <input className="field w-full tabular-nums" type="tel" inputMode="tel" name="sdt-tutor" autoComplete="off" value={sdt} placeholder={t('Để trống được')} onChange={(e) => { setSdt(e.target.value); setLoi({ ...loi, sdt: undefined }); }} />
        </Truong>
        <Truong nhan={t('Nơi dạy chính')} loi={loi.noiDay} as={head ? 'div' : 'label'}>
          {head ? (
            <BoLocDoan<string> v8 ariaLabel={t('Nơi dạy chính')} value={noi} onChange={setNoi}
              muc={[...chiNhanhDanhBa.map((c) => ({ key: String(c.id), nhan: c.ten })), { key: 'online', nhan: t('Chỉ online') }]} />
          ) : (
            <select className="field w-full" value={noi} onChange={(e) => setNoi(e.target.value)}>
              <option value="">{t('Chưa có')}</option>
              {dsChiNhanh.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
              <option value="online">{t('Chỉ online')}</option>
            </select>
          )}
        </Truong>
        <Truong nhan={t('Kỹ năng')} batBuoc as="div" loi={loi.kyNang}>
          <span className="flex flex-wrap gap-1.5">
            {KN_TUTOR.map((k) => (
              <NutChon key={k} nho chon={kn.includes(k)} className="min-w-[48px] justify-center !rounded-full" dau={null}
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
/** Đích gộp của một tên: tutor danh bạ (`tutorId`, gồm dòng danh bạ của GV) hoặc GV chưa có dòng danh bạ (`gvId`). */
type Dich = { tutorId?: number; gvId?: number; ten: string };

/**
 * HỘP GỘP TÊN GÕ TAY (TU-b · TU2-6 R2.9, mockup H3) — mỗi tên "Tutor khác" một dòng: ô chọn có tìm (mẫu A, `/tutors/chon?gop=1` — gợi ý cả GV; Head: GV / tutor
 * chi nhánh mình) nhóm Tên gần giống · Giáo viên · Tutor, hoặc "+ Thêm «…» vào danh sách" (mở hộp Thêm điền sẵn tên). Gộp = các buổi đó trỏ về người đã chọn
 * (giữ tên đã ghi), một giao dịch; thông báo có Hoàn tác.
 */
export function HopGop({ onDong, onThem }: { onDong: () => void; onThem: (ten: string, xong: (id: number) => void) => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<GoTay[]>('/tutors/go-tay', []);
  const [chon, setChon] = useState<Record<string, Dich | null>>({});
  const [gui, setGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const muc = Object.entries(chon).flatMap(([khoa, v]) => (v ? [{ khoa, ...(v.gvId ? { gvId: v.gvId } : { tutorId: v.tutorId }) }] : []));
  const soBuoi = (data ?? []).filter((g) => chon[g.khoa]).reduce((a, g) => a + g.soBuoi, 0);
  /* Tên gần giống = cùng tên gọi (chữ cuối, không dấu) với tên gõ tay → nhóm đầu; rồi Giáo viên, Tutor (dòng cùng nhóm liền nhau). */
  const cuoi = (x: string) => boDau(x.trim().split(/\s+/).pop() ?? '');
  const tim = (tenGo: string) => ({
    goi: async (q: string): Promise<NguoiTrongDs[]> => {
      const kq = await api.get<KetQuaTutorChon>(`/tutors/chon?gop=1&q=${encodeURIComponent(q)}`);
      const nhom = (r: KetQuaTutorChon['ds'][number]) => (cuoi(r.ten) === cuoi(tenGo) ? 0 : r.loai === 'gv' ? 1 : 2);
      const NHOM = [t('Tên gần giống'), t('Giáo viên'), t('Tutor')];
      return [...kq.ds].sort((a, b) => nhom(a) - nhom(b)).map((r) => ({
        id: r.id, ten: r.ten, nhom: NHOM[nhom(r)],
        phu: [r.loai === 'gv' ? t('GV') : t('Tutor'), r.noiDay, r.kyNang.split(',').join(' '), r.sdtDuoi ? `…${r.sdtDuoi}` : null].filter(Boolean).join(' · '),
      }));
    },
  });

  async function gop() {
    setGui(true);
    setLoi(null);
    try {
      const kq = await api.post<{ nhatKyId: number; soBuoi: number }>('/tutors/gop', { muc });
      invalidate('/tutors');
      toast.hoanTac(t('Đã gộp {n} tên · {m} buổi', { n: muc.length, m: kq.soBuoi }), async () => {
        try { await api.post('/tutors/gop/hoan-tac', { nhatKyId: kq.nhatKyId }); invalidate('/tutors'); toast.push('ok', t('Đã hoàn tác gộp tên')); }
        catch (e) { toast.push('error', e instanceof Error ? e.message : t('Không hoàn tác được — thử lại.')); }
      });
      onDong();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t('Không gộp được — thử lại.'));
    } finally { setGui(false); }
  }

  return (
    <Modal open onClose={onDong} width="max-w-[620px]" daSua={muc.length > 0 && !gui}
      title={t('Gộp tên gõ tay · {n} tên', { n: data?.length ?? 0 })}
      footer={<>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui || !muc.length} onClick={gop} title={soBuoi ? t('{n} buổi', { n: soBuoi }) : undefined}>
          {gui ? t('Đang gộp…') : t('Gộp {n} tên', { n: muc.length })}</button>
      </>}>
      <Phu chu={t('Các buổi của tên gõ tay trỏ về người đã chọn; tên đã ghi giữ nguyên.')} />
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <Skeleton rows={4} />
        : !data.length ? <p className="m-0 text-sm text-slate-400">{t('Không còn tên gõ tay nào.')}</p> : (
          <ul className="m-0 list-none p-0">
            {data.map((g) => (
              <li key={g.khoa} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t py-3 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
                <span className="min-w-0 flex-1">
                  <b className="font-semibold text-slate-100">{g.ten}</b>
                  <span className="block text-xs text-slate-400">{[t('{n} buổi', { n: g.soBuoi }), g.lop.join(', '), g.ngay.length ? t('ghi {ngay}', { ngay: g.ngay.slice(-3).map((d) => ngay(d, homNay)).join(', ') }) : null].filter(Boolean).join(' · ')}</span>
                </span>
                <div className="w-full sm:w-[300px]">
                  <ChonNguoi value={chon[g.khoa] ? { kieu: 'tai_khoan', id: chon[g.khoa]!.tutorId ?? -chon[g.khoa]!.gvId!, ten: chon[g.khoa]!.ten } : null}
                    nhom="nhan_vien" choToi={false} choNgoai={false} choTrong={t('— Chưa gộp —')} macDinhTrong={t('— Chưa gộp —')} xBo
                    ariaLabel={t('Gộp "{ten}" vào', { ten: g.ten })} placeholder={t('Tìm GV, tutor…')} tim={tim(g.ten)} tinh
                    them={{ nhan: t('+ Thêm «{ten}» vào danh sách', { ten: g.ten }), onChon: () => onThem(g.ten, (id) => setChon((c) => ({ ...c, [g.khoa]: { tutorId: id, ten: g.ten } }))) }}
                    onChange={(v) => setChon((c) => ({ ...c, [g.khoa]: v?.kieu === 'tai_khoan' ? (v.id < 0 ? { gvId: -v.id, ten: v.ten } : { tutorId: v.id, ten: v.ten }) : null }))} />
                </div>
              </li>
            ))}
          </ul>
        )}
      {loi && <p role="alert" className="mb-0 mt-2 text-xs text-late">{loi}</p>}
    </Modal>
  );
}

/** Tháng "YYYY-MM" lùi n tháng. */
const lui = (th: string, n: number) => { const d = new Date(Date.UTC(Number(th.slice(0, 4)), Number(th.slice(5)) - 1 - n, 1)); return d.toISOString().slice(0, 7); };
const nhanThang = (th: string) => `T${Number(th.slice(5))}/${th.slice(0, 4)}`;
type Cell = string | number | null;

/**
 * HỘP XUẤT SỐ BUỔI (TU14 · R2.7, mockup H1) — chọn khoảng tháng (mặc định tháng này) → `GET /tutors/xuat-buoi` trả `{ sheets, tenTep, dem }` (người dạy × tháng,
 * theo phạm vi người xem — máy chủ ghi nhật ký) → web dựng .xlsx như Xuất kết quả Test. Lỗi: giữ khoảng đã chọn, Thử lại = bấm lại.
 */
export function HopXuat({ phamVi, onDong }: { phamVi: string | null; onDong: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const nay = homNay.slice(0, 7);
  const cacThang = Array.from({ length: 24 }, (_, i) => lui(nay, i));
  const [tu, setTu] = useState(nay);
  const [den, setDen] = useState(nay);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  async function xuat() {
    setDang(true);
    setLoi(null);
    try {
      const r = await api.get<{ sheets: { ten: string; aoa: Cell[][] }[]; tenTep: string; dem: { nguoiDay: number; buoi: number } }>(`/tutors/xuat-buoi?tu=${tu}&den=${den}`);
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      for (const s of r.sheets) {
        const ws = XLSX.utils.aoa_to_sheet(s.aoa);
        ws['!cols'] = (s.aoa[0] ?? []).map((_, c) => ({ wch: Math.min(40, Math.max(8, ...s.aoa.map((h) => String(h[c] ?? '').length + 2))) }));
        XLSX.utils.book_append_sheet(wb, ws, s.ten);
      }
      XLSX.writeFile(wb, `${r.tenTep}.xlsx`);
      toast.push('ok', t('Đã xuất {n} người dạy · {m} buổi', { n: r.dem.nguoiDay, m: r.dem.buoi }));
      onDong();
    } catch (e) {
      setLoi(e instanceof ApiError ? e.message : t('Không xuất được — thử lại. Khoảng tháng vẫn giữ.'));
    } finally { setDang(false); }
  }
  const o = (nhan: string, v: string, dat: (v: string) => void) => (
    <Truong nhan={nhan}>
      <select className="field w-full tabular-nums" value={v} onChange={(e) => dat(e.target.value)}>
        {cacThang.map((th) => <option key={th} value={th}>{nhanThang(th)}</option>)}
      </select>
    </Truong>
  );
  return (
    <Modal open onClose={onDong} width="max-w-[440px]" title={t('Xuất số buổi')}
      footer={<>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={dang || tu > den} onClick={xuat}>{dang ? t('Đang xuất…') : t('Xuất Excel')}</button>
      </>}>
      <Phu chu={t('Excel · người dạy × tháng')} />
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          {o(t('Từ tháng'), tu, (v) => { setTu(v); if (v > den) setDen(v); })}
          {o(t('Đến tháng'), den, (v) => { setDen(v); if (v < tu) setTu(v); })}
        </div>
        <p className="m-0 text-[13px] text-slate-400">{phamVi ? t('Chi nhánh {ten}', { ten: phamVi }) : t('Toàn hệ thống')} · {t('mỗi người dạy một dòng, mỗi tháng một cột')}</p>
        {loi && <p role="alert" className="m-0 rounded-lg border px-3 py-2 text-sm text-late" style={{ borderColor: 'var(--late-line, var(--line))' }}>⚠ {loi}</p>}
      </div>
    </Modal>
  );
}

