import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { DongDiem } from '../../ui/SoLieu.tsx';
import { KhungPanel, KhungTaiCho, boChuRoi } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { useSession } from '../../lib/session.tsx';
import { BAC_1, IconNhom, KeBac2, NET_CAY, NguoiGiu, ThePhu, chuDau } from '../congViec/DanhSachViec.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import {
  LOAI_YC_META, PHAN_LOAI_CAN_QUYET, PHAN_LOAI_LABEL, TRAN_HANG_LOAT, chiaLo, chonHet, chonMot, laPhanLoai, nhanTrangThaiYc, tomTatKetQuaHangLoat, laDaXuLy,
  type KhoaChip, type LoaiYeuCau, type TheYeuCauDto,
} from '@shared/domain/index.ts';

type Hop = { the: TheYeuCauDto[]; dem: Record<KhoaChip, number>; demBiet: number; homNay: string; lopDangLoc?: { id: number; code: string } | null; khacChiNhanh?: number };

/** `?the=12` → cuộn tới thẻ, viền nhấn 2 giây. Dùng chung hộp và Yêu cầu của tôi. */
/** PR-LUI-a2: Từ chối nhiều gửi theo lô (mỗi thẻ ~16 câu SQL) — một request ≤ 200 câu. */
const LO_TU_CHOI = 6;

export function useTheNhanManh(ds: TheYeuCauDto[] | undefined): number | null {
  const [params] = useSearchParams();
  const the = Number(params.get('the')) || null;
  const [nhan, setNhan] = useState<number | null>(null);
  useEffect(() => {
    if (!the || !ds?.some((x) => x.id === the)) return;
    document.getElementById(`the-${the}`)?.scrollIntoView({ block: 'center' });
    setNhan(the);
    const t = setTimeout(() => setNhan(null), 2000);
    return () => clearTimeout(t);
  }, [the, ds]);
  return nhan;
}

/**
 * CÔNG VIỆC › CHỜ BẠN DUYỆT (PR-DUYET, M8, Q27-3 → AUDIT-UI B6, chủ SP 08/11: MỘT nơi làm việc — trang "Chờ duyệt" riêng đã bỏ, hộp là tab của Công việc).
 * HÀNG LỌC (mockup `.hang-loc .chip-loc`): phân loại phải quyết (đứng cố định kể cả số 0, Q12) · Báo QL · Đã xử lý · 30 ngày · Lớp ▾ (+ chip "Quá hạn ✕" từ
 * Tổng quan). Mọi bộ lọc trên URL (`xem` · `phan` · `lop` · `qua-han`; `cn` = chi nhánh của Công việc) — link cũ `/cong-viec/cho-duyet?…` giữ nguyên nghĩa.
 * Dưới hàng lọc: danh sách khối em (V8-CV) · panel duyệt ở cột phải (`?the=`). Thẻ quá hạn đứng đầu (máy chủ xếp).
 * Duyệt hàng loạt (PR-GVb D01/Q-B): chỉ ở Chờ duyệt, cùng MỘT loại `hangLoat`, tối đa `TRAN_HANG_LOAT`; kết quả một câu.
 */
export function HopChoDuyet({ branchId, khuPanel, khuLoc }: {
  /** AUDIT-UI B6: ô hàng lọc hết bề ngang dưới hàng tab của Công việc (không có → vẽ ngay trên danh sách). */
  khuLoc?: HTMLElement | null;
  /** V8-CV: cột panel phải của Công việc — panel duyệt (`?the=`) vẽ vào đây, cùng chỗ panel việc. */
  khuPanel?: HTMLElement | null;
  /** SL1 (A7-01): chi nhánh của Công việc — số trên hàng lọc và thẻ cùng một phạm vi. `null` = mọi chi nhánh trong quyền. */
  branchId: number | null;
}) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const thamXem = params.get('xem');
  const xem = thamXem === 'da-xu-ly' || thamXem === 'de-biet' ? thamXem : 'cho';
  /* Phân loại lọc ở Chờ duyệt và Đã xử lý; Báo QL chỉ có một phân loại. */
  const phan = xem !== 'de-biet' && laPhanLoai(params.get('phan')) && params.get('phan') !== 'bao-len' ? (params.get('phan') as KhoaChip) : 'tat-ca';
  /* PR-S4F #5: `?lop=` — từ badge "n chờ duyệt" của một lớp, hoặc ô "Lớp ▾". */
  const lopId = Number(params.get('lop')) || null;
  /* PR-VAI-a (Q17): `?qua-han=1` — từ số "k quá hạn" của dải Chờ duyệt ở Tổng quan. */
  const quaHan = params.get('qua-han') === '1' && xem !== 'da-xu-ly';
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.delete('the');
    setParams(next, { replace: true });
  };
  /* Một chip đổi `xem` (+ `phan`): Báo QL không chia loại. */
  const chonLoc = (x: typeof xem, p: KhoaChip | null) => {
    const next = new URLSearchParams(params);
    if (x === 'cho') next.delete('xem'); else next.set('xem', x);
    if (p && p !== 'tat-ca' && x !== 'de-biet') next.set('phan', p); else next.delete('phan');
    next.delete('the');
    setParams(next, { replace: true });
  };
  /* UI-CON-LAI k3: mở / đóng panel duyệt = `?the=` (giữ mọi bộ lọc). V8-CV: panel duyệt thay panel việc (`viec`) — một panel một lúc. */
  const moThe = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) { next.set('the', String(id)); next.delete('viec'); next.delete('panel'); } else next.delete('the');
    setParams(next, { replace: true });
  };
  /* PR-GVb (J5b): link cũ `?phan=bao-len` (thông báo, Tổng quan cũ) → lọc Báo QL, không gãy. */
  useEffect(() => {
    if (params.get('phan') !== 'bao-len') return;
    const next = new URLSearchParams(params); next.delete('phan'); next.set('xem', 'de-biet');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const qs = new URLSearchParams({ hop: 'cho-duyet' });
  if (phan !== 'tat-ca') qs.set('phanLoai', phan);
  if (xem !== 'cho') qs.set('xem', xem);
  if (branchId) qs.set('branchId', String(branchId));
  if (lopId) qs.set('lop', String(lopId));
  if (quaHan) qs.set('quaHan', '1');
  /* DUYET-QL: panel duyệt xin chip SOS + dòng điểm + số Lịch sử (PANEL-MC, +1 câu `latestAttempts`, Lịch sử đếm trong câu đọc thẻ). */
  qs.set('boiCanh', '1');
  const url = `/yeu-cau?${qs}`;
  const { data, loading, error, reload } = useApi<Hop>(url, [url]);
  /* Mở từ chuông mà thẻ không còn trong danh sách đang xem (đã có người xử lý / tự đóng / khác chi nhánh đang lọc). */
  const theTuLink = Number(params.get('the')) || null;
  const theMo = theTuLink ? data?.the.find((x) => x.id === theTuLink) ?? null : null;

  /* Hàng loạt: một loại một lúc (luật ở `chonMot` / `chonHet`). */
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  /* PR-LUI-a2: Từ chối nhiều — hàng lý do chung mở ngay trong thanh chọn. `null` = đang đóng. */
  const [lyDoTc, setLyDoTc] = useState<string | null>(null);
  const [tcDaBam, setTcDaBam] = useState(false);
  useEffect(() => { setChon(new Set()); }, [url]);
  useEffect(() => { if (!chon.size) { setLyDoTc(null); setTcDaBam(false); } }, [chon.size]);
  const ds = data?.the ?? [];
  const [soHien, setSoHien] = useState(5);
  const loaiChon = useMemo(() => (ds.find((x) => chon.has(x.id))?.loai ?? null) as LoaiYeuCau | null, [ds, chon]);
  /* CV-LOI (A1-14): "Chọn hết" chỉ lấy thẻ ĐANG HIỆN — không duyệt thẻ chưa đọc sau "Xem thêm". */
  const dsChonHet = ds.slice(0, soHien);
  const nHet = loaiChon ? chonHet(dsChonHet, loaiChon).size : 0;
  const biCatTran = !!loaiChon && ds.filter((x) => x.loai === loaiChon && x.hangLoat && x.trangThai === 'cho').length > TRAN_HANG_LOAT;
  const choHangLoat = xem === 'cho';
  const [ngan, setNgan] = useState<number | null>(null);
  /* V8-CV: nút của dòng mở panel với ô sẵn (Duyệt… / Từ chối… / Trả lời…); quyết xong ở panel → thẻ kết quả "✓ … · Yêu cầu tiếp ›" (V12). */
  const [moSan, setMoSan] = useState<{ id: number; o: MoSan } | null>(null);
  const [vuaXong, setVuaXong] = useState<{ id: number; yc: TheYeuCauDto; chu: string; huy: boolean; tiep: number | null } | null>(null);
  /* DUYET-QL (mockup v10 #cv nth=1): dòng vừa quyết giữ chỗ "✓ … · Hoàn tác" tại vị trí cũ — danh sách tải lại không làm dòng nhảy mắt. */
  const [giu, setGiu] = useState<{ y: TheYeuCauDto; i: number; chu: string; huy: boolean }[]>([]);
  const giuCho = (y: TheYeuCauDto, chu: string, huy: boolean) =>
    setGiu((g) => [...g.filter((x) => x.y.id !== y.id), { y, i: Math.max(ds.findIndex((x) => x.id === y.id), 0), chu, huy }]);
  useEffect(() => { setGiu([]); }, [url]);
  const [dangGui, setDangGui] = useState<number | null>(null);
  const { session } = useSession();

  const xong = () => { reload(); invalidate('/yeu-cau/dem'); };
  const lamMoi = () => { invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan'); };
  const moTheTu = (y: TheYeuCauDto, o?: MoSan) => {
    if (theTuLink === y.id && !o && !vuaXong) return;
    boChuRoi(() => { setMoSan(o ? { id: y.id, o } : null); setVuaXong(null); moThe(y.id); });
  };
  /* Quyết ở panel: giữ panel thành thẻ kết quả. Bị người khác xử lý trước (không `chu`) → đóng. */
  const xongPanel = (id: number, chu?: string, huy?: boolean, soLichSu?: number) => {
    if (chu) {
      const i = ds.findIndex((x) => x.id === id);
      const tiep = [...ds.slice(i + 1), ...ds.slice(0, Math.max(i, 0))].find((x) => x.trangThai === 'cho')?.id ?? null;
      const y = ds[i];
      /* "Lịch sử · n" của panel kết quả: số máy chủ trả kèm quyết định (đã gồm dòng vừa ghi) — không gọi lại. */
      if (y) { setVuaXong({ id, yc: soLichSu != null ? { ...y, soLichSu } : y, chu, huy: !!huy, tiep }); giuCho(y, chu, !!huy); }
    } else moThe(null);
    xong();
  };
  /* Huỷ quyết định vừa bấm (loại máy chủ cho huỷ — cùng đường "Huỷ quyết định" của Đã xử lý). */
  const huyQd = async (id: number) => {
    try {
      await api.post(`/yeu-cau/${id}/huy-quyet-dinh`);
      lamMoi();
      toast.push('ok', t('Đã huỷ quyết định · thẻ về Chờ duyệt'), { key: `yc-${id}` });   // thay toast "Hoàn tác (n)" của cùng yêu cầu
      setVuaXong((v) => (v?.id === id ? null : v));
      setGiu((g) => g.filter((x) => x.y.id !== id));
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối, chưa huỷ được. Kiểm tra mạng rồi bấm lại.'));
    }
  };
  /* Nút "Duyệt" trơn của dòng: quyết ngay tại dòng như thẻ cũ (Hoàn tác 5 s ở loại cho huỷ). */
  const duyetNgay = async (y: TheYeuCauDto) => {
    if (dangGui) return;
    setDangGui(y.id);
    try {
      const kq = await api.post<{ coTheHuy?: boolean }>(`/yeu-cau/${y.id}/duyet`, {});
      lamMoi();
      const chu = t('Đã duyệt: {tieuDe}', { tieuDe: y.tieuDe });
      if (kq?.coTheHuy) toast.hoanTac(chu, () => { void huyQd(y.id); }, { key: `yc-${y.id}` });
      else toast.push('ok', chu);
      giuCho(y, chu, !!kq?.coTheHuy);
    } catch (e: any) {
      /* Chủ SP 07/11 (mục 7): thẻ đã xử lý / chết — báo trung tính, danh sách làm mới (`xong`). */
      if (laDaXuLy(e)) { toast.push('info', t('Yêu cầu này đã được xử lý.')); lamMoi(); return; }
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại.'));
    } finally { setDangGui(null); xong(); }
  };
  /* Thẻ lỗi: một câu tổng + tối đa 3 dòng chi tiết, còn lại gộp — không dồn hàng chục toast. */
  const baoKetQua = (viec: 'duyet' | 'tu-choi', ok: number, loi: { id: number; loi: string; ma: number }[]) => {
    /* Chủ SP 07/11 (mục 7): thẻ đã được xử lý (người khác / tự đóng) không phải lỗi — chỉ đếm trong câu tổng, không toast đỏ riêng. */
    const chiTiet = loi.filter((l) => !laDaXuLy({ status: l.ma, message: l.loi }));
    toast.push(chiTiet.length ? 'error' : loi.length ? 'info' : 'ok', tomTatKetQuaHangLoat(viec, ok, loi));
    for (const l of chiTiet.slice(0, 3)) toast.push('error', `${ds.find((x) => x.id === l.id)?.hocVien ?? t('Yêu cầu #{id}', { id: l.id })}: ${dich(l.loi)}`);
    if (chiTiet.length > 3) toast.push('error', t('…và {n} thẻ khác', { n: chiTiet.length - 3 }));
  };
  const duyetNhieu = async () => {
    if (busy || !chon.size) return;
    setBusy(true);
    try {
      const r = await api.post<{ ok: number[]; loi: { id: number; loi: string; ma: number }[] }>('/yeu-cau/duyet-nhieu', { ids: [...chon] });
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');   // SL1 (A7-14): số "Chờ duyệt n" + dải
      baoKetQua('duyet', r.ok.length, r.loi);
      setChon(new Set());
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.'));
      xong();
    } finally { setBusy(false); }
  };
  const tuChoiNhieu = async () => {
    setTcDaBam(true);
    if (busy || !chon.size || !lyDoTc?.trim()) return;
    setBusy(true);
    try {
      /* Lô 6 thẻ mỗi request (~21 câu SQL mỗi thẻ, Case nhiều PA nhiều hơn → ≤ 200 câu, kịp trần 10 s). Lô lỗi mạng giữa chừng: báo, làm mới để thấy thẻ nào đã xong. */
      const r = { ok: [] as number[], loi: [] as { id: number; loi: string; ma: number }[] };
      for (const lo of chiaLo([...chon], LO_TU_CHOI)) {
        const k = await api.post<typeof r>('/yeu-cau/tu-choi-nhieu', { ids: lo, lyDo: lyDoTc.trim() });
        r.ok.push(...k.ok); r.loi.push(...k.loi);
      }
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      baoKetQua('tu-choi', r.ok.length, r.loi);
      setChon(new Set());
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.'));
      xong();
    } finally { setBusy(false); }
  };
  const dem = data?.dem;
  const dsHien = ds.slice(0, soHien);
  /* Dòng giữ chỗ chèn lại đúng vị trí cũ (bỏ nếu thẻ đã về danh sách — Hoàn tác / người khác huỷ). */
  const dsCay: (TheYeuCauDto & { giu?: { chu: string; huy: boolean } })[] = [...dsHien];
  for (const g of [...giu].sort((a, b) => a.i - b.i)) {
    if (!ds.some((x) => x.id === g.y.id)) dsCay.splice(Math.min(g.i, dsCay.length), 0, { ...g.y, giu: { chu: g.chu, huy: g.huy } });
  }
  const chonCua = (y: TheYeuCauDto) => (choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
    checked: chon.has(y.id), onChange: (v: boolean) => setChon((s) => chonMot(ds, s, y.id, v)),
  } : null);
  /* "Tiếp: …" ở chân panel — yêu cầu chờ kế sau thẻ đang mở (vòng về đầu), cùng luật `xongPanel`. */
  const tiepSau = (id: number) => {
    const i = ds.findIndex((x) => x.id === id);
    return [...ds.slice(i + 1), ...ds.slice(0, Math.max(i, 0))].find((x) => x.trangThai === 'cho' && x.id !== id) ?? null;
  };
  const tiepCua = (id: number | null) => ds.find((x) => x.id === id && x.trangThai === 'cho') ?? ds.find((x) => x.trangThai === 'cho' && x.id !== vuaXong?.id) ?? null;
  /* Đầu thẻ: số dòng đang xem + số quá hạn — cùng luật `demHop` (hạn < hôm nay), từ chính danh sách đã nạp. */
  const quaHanN = data ? ds.filter((x) => x.trangThai === 'cho' && !!x.hanDuyet && x.hanDuyet < data.homNay).length : 0;
  /* "Lớp ▾": lớp có trong danh sách đã nạp (không gọi thêm) + lớp đang lọc. */
  const dsLop = useMemo(() => {
    const m = new Map<number, string>();
    for (const y of ds) if (y.lopId != null && y.lop) m.set(y.lopId, y.lop);
    if (lopId && data?.lopDangLoc) m.set(data.lopDangLoc.id, data.lopDangLoc.code);
    return [...m].sort((a, b) => a[1].localeCompare(b[1], 'vi', { numeric: true }));
  }, [ds, lopId, data]);
  const xemDaXuLy = () => chonLoc('da-xu-ly', null);
  const hangLoc = (
    <>
      {/* AUDIT-UI B6 (mockup `.hang-loc`): một hàng chip — phân loại phải quyết · vạch · Báo QL · Đã xử lý · 30 ngày · Lớp ▾. Chip bật = nền nhấn nhạt + viền nhấn. */}
      {/* 375: một hàng cuộn ngang (như hàng tab), mép phải mờ — không gãy 4 dòng đẩy danh sách xuống. */}
      <div role="group" aria-label={t('Lọc yêu cầu')} data-hd="cd-loc"
        className="flex flex-wrap items-center gap-2 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4 max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] max-sm:[scrollbar-width:none]">
        {[{ key: 'tat-ca' as KhoaChip, nhan: t('Tất cả') }, ...PHAN_LOAI_CAN_QUYET.map((k) => ({ key: k as KhoaChip, nhan: PHAN_LOAI_LABEL[k] }))].map((c) => (
          <ChipLoc key={c.key} bat={xem !== 'de-biet' && phan === c.key} so={dem?.[c.key] ?? null} onClick={() => chonLoc(xem === 'de-biet' ? 'cho' : xem, c.key)}>{c.nhan}</ChipLoc>
        ))}
        <span aria-hidden className="h-6 w-px max-sm:hidden" style={{ background: 'var(--line-strong)' }} />
        <ChipLoc bat={xem === 'de-biet'} so={data?.demBiet ?? null} onClick={() => chonLoc(xem === 'de-biet' ? 'cho' : 'de-biet', null)}>{t('Báo QL')}</ChipLoc>
        <ChipLoc bat={xem === 'da-xu-ly'} onClick={() => chonLoc(xem === 'da-xu-ly' ? 'cho' : 'da-xu-ly', phan)}>{t('Đã xử lý · 30 ngày')}</ChipLoc>
        {(dsLop.length > 0 || lopId) && (
          <span className="relative inline-flex">
            <select aria-label={t('Lọc theo lớp')} value={lopId ? String(lopId) : ''} onChange={(e) => setParam('lop', e.target.value || null)}
              aria-pressed={!!lopId} className={`nut-loc appearance-none pr-7 [field-sizing:content] text-[14px] text-[color:var(--text)] ${lopId ? 'nut-loc-dang font-semibold' : 'font-medium'}`}>
              <option value="">{t('Lớp')}</option>
              {dsLop.map(([id, ma]) => <option key={id} value={id}>{ma}</option>)}
            </select>
            <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l3 3 3-3" /></svg>
          </span>
        )}
        {quaHan && (
          <button type="button" className="nut-loc nut-loc-dang" title={t('Bỏ lọc quá hạn')} onClick={() => setParam('qua-han', null)}>
            {t('Quá hạn')} · <span className="tabular-nums">{ds.length}</span> <span aria-hidden>✕</span>
          </button>
        )}
      </div>
    </>
  );
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  return (
    <div className="space-y-3">
      {khuLoc ? createPortal(hangLoc, khuLoc) : hangLoc}
      <section id="nhom-cho-duyet" className="card overflow-clip p-0" aria-label={t('Chờ bạn duyệt')}>
        <h3 className="m-0 flex min-h-[38px] items-center gap-2 px-4 py-[9px] text-[13px] font-bold" style={{ background: 'var(--surface-2)' }}>
          {t('{n} yêu cầu', { n: ds.length })}
          {quaHanN > 0 && <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: quaHanN })}</span>}
          {choHangLoat && <NutLuat label={t('Duyệt nhiều')}>{t('Đánh dấu ô ở dòng để duyệt nhiều yêu cầu cùng loại một lần.')}</NutLuat>}
        </h3>
        {loading && !data && <div className="px-4 py-3"><Skeleton rows={4} /></div>}
        {data && ds.length === 0 && (
          <div className="px-4 py-6">
            <Empty title={xem === 'cho' ? t('Không có yêu cầu nào đang chờ') : xem === 'de-biet' ? t('Không có thẻ Báo QL')
              : t('Chưa có yêu cầu nào được xử lý trong 30 ngày')} />
          </div>
        )}
        {dsCay.length > 0 && (
          <CayDuyet ds={dsCay} dang={theTuLink} chon={chonCua} onMo={moTheTu} onDuyet={(y) => void duyetNgay(y)} onHoanTac={(id) => void huyQd(id)}
            dangGui={dangGui} toi={session?.user?.id ?? null} />
        )}
        {data && (ds.length > soHien || !!data.khacChiNhanh) && (
          /* V8-CV: chân nhóm — Xem thêm · n ở chi nhánh khác · Xem › (AUDIT-UI B6: bỏ "Mở hộp duyệt ›" — hộp là chính tab này). */
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-[13px] max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
            {ds.length > soHien && (
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setSoHien((n) => n + 10)}>
                {t('Xem thêm {n} yêu cầu', { n: Math.min(10, ds.length - soHien) })}
              </button>
            )}
            {!!data.khacChiNhanh && (
              <span className="text-dim">{t('{n} yêu cầu ở chi nhánh khác', { n: data.khacChiNhanh })} · <button type="button"
                className="link appearance-none border-0 bg-transparent p-0 font-semibold max-sm:inline-block max-sm:py-3" onClick={() => setParam('cn', 'tat-ca')}>{t('Xem ›')}</button></span>
            )}
          </div>
        )}

        {chon.size > 0 && (
          <div className="sticky bottom-2 z-10 mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 shadow-lg"
            style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
            <span className="text-sm tabular-nums text-slate-300">
              {t('Đã chọn {n}', { n: chon.size })}{loaiChon ? ` · ${LOAI_YC_META[loaiChon]?.nhan ?? ''}` : ''}
              {biCatTran && <span className="ml-2 text-[12px] text-slate-400">{t('Tối đa {n} một lần', { n: TRAN_HANG_LOAT })}</span>}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {loaiChon && nHet > chon.size && (
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy}
                  onClick={() => setChon(chonHet(dsChonHet, loaiChon))}>{t('Chọn hết {n}', { n: nHet })}</button>
              )}
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setChon(new Set())} disabled={busy}>{t('Bỏ chọn')}</button>
              {loaiChon && LOAI_YC_META[loaiChon]?.kieuNut === 'duyet-tu-choi' && (
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-pressed={lyDoTc !== null} disabled={busy}
                  onClick={() => { setLyDoTc(lyDoTc === null ? '' : null); setTcDaBam(false); }}>{t('Từ chối {n}…', { n: chon.size })}</button>
              )}
              <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={duyetNhieu} disabled={busy || lyDoTc !== null}>
                {busy && lyDoTc === null ? t('Đang duyệt…') : t('Duyệt {n} yêu cầu', { n: chon.size })}
              </button>
            </div>
            {lyDoTc !== null && (
              <div className="w-full space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-slate-200">{t('Lý do từ chối (người gửi sẽ đọc)')}<span aria-hidden className="text-bad"> *</span></span>
                  <textarea className="field w-full" rows={2} maxLength={2000} autoFocus aria-label={t('Lý do từ chối')} value={lyDoTc} aria-invalid={tcDaBam && !lyDoTc.trim()}
                    onChange={(e) => setLyDoTc(e.target.value)} />
                </label>
                {tcDaBam && !lyDoTc.trim() && <span className="block text-xs text-late">{t('Chưa điền')}</span>}
                <div className="flex justify-end gap-1.5">
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => { setLyDoTc(null); setTcDaBam(false); }}>{t('Đóng')}</button>
                  <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void tuChoiNhieu()}>
                    {busy ? t('Đang từ chối…') : t('Gửi từ chối {n}', { n: chon.size })}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {ngan && <NganCase caseId={ngan} viec="them-pa" onClose={() => setNgan(null)} onChanged={xong} />}
      {khuPanel && theTuLink && createPortal(
        vuaXong?.id === theTuLink ? (
          /* DUYET-QL (mockup v10 #cv nth=1, V12): panel ở lại — khối "✓ Đã duyệt · Hoàn tác", chân "✓ Đã lưu · Tiếp: … · Yêu cầu tiếp ›". */
          <PanelDuyet yc={vuaXong.yc} tiep={tiepCua(vuaXong.tiep)} onDong={() => { setVuaXong(null); moThe(null); }} onXong={xongPanel} onThemPa={setNgan}
            xong={{ chu: vuaXong.chu, onHoanTac: vuaXong.huy ? () => void huyQd(vuaXong.id) : undefined, onTiep: (y) => moTheTu(y) }} />
        ) : theMo ? (
          <PanelDuyet key={`${theMo.id}:${moSan?.id === theMo.id ? moSan.o : ''}`} yc={theMo} moSan={moSan?.id === theMo.id ? moSan.o : undefined}
            tiep={tiepSau(theMo.id)} onDong={() => moThe(null)} onXong={xongPanel} onThemPa={setNgan} />
        ) : data ? (
          <div className="card space-y-3 px-5 py-5" role="status">
            <p className="m-0 text-sm text-slate-300">{xem === 'cho' ? t('Yêu cầu vừa mở không còn trong danh sách này — có thể đã được xử lý hoặc tự đóng.') : t('Yêu cầu vừa mở không còn trong danh sách này.')}</p>
            <div className="flex flex-wrap gap-2">
              {xem !== 'da-xu-ly' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={xemDaXuLy}>{t('Xem ở Đã xử lý')}</button>}
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => moThe(null)}>{t('Đóng')}</button>
            </div>
          </div>
        ) : null,
        khuPanel,
      )}
    </div>
  );
}

/** Chip lọc của hàng lọc Chờ bạn duyệt (mockup `.chip-loc`: viên 32 px, 14 / 500, số mờ 13; bật = nền nhấn nhạt + viền nhấn, 600). */
function ChipLoc({ bat, so, onClick, children }: { bat: boolean; so?: number | null; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={bat} onClick={onClick}
      className={`nut-loc gap-1.5 text-[14px] text-[color:var(--text)] ${bat ? 'font-semibold' : 'font-medium'}`}>
      {children}{so != null && <span className="text-[13px] font-medium tabular-nums text-dim">{so}</span>}
    </button>
  );
}

type MoSan = 'duyet' | 'tu-choi' | 'tra-loi';

/** PANEL DUYỆT (UI-CON-LAI k3, V8-CV) — một khuôn cho Hộp duyệt và Công việc: loại · tên · em · lớp · chip hạn, thân là thẻ ở dạng panel.
 *  DUYET-QL (mockup v10 #cv): thân cuộn, CHÂN DÍNH "Tiếp: {yêu cầu kế}" · Từ chối… · Duyệt (nút của thẻ vẽ vào chân qua portal); đầu có chip SOS;
 *  "Lịch sử · n" gập cuối thân. `xong` = vừa quyết ở panel: khối "✓ … · Hoàn tác", chân "✓ Đã lưu · Yêu cầu tiếp ›". */
export function PanelDuyet({ yc, moSan, tiep, xong, onDong, onXong, onThemPa }: {
  yc: TheYeuCauDto; moSan?: MoSan; tiep?: TheYeuCauDto | null; onDong: () => void; onXong: (id: number, chu?: string, huy?: boolean, soLichSu?: number) => void; onThemPa?: (caseId: number) => void;
  xong?: { chu: string; onHoanTac?: () => void; onTiep: (y: TheYeuCauDto) => void };
}) {
  const [chanEl, setChanEl] = useState<HTMLElement | null>(null);
  /* Thẻ đã xử lý (tab Đã xử lý · Sửa trả lời… · Huỷ quyết định) giữ nút trong thân như cũ — chân dính chỉ cho thẻ đang chờ quyết. */
  const cho = yc.trangThai === 'cho';
  const chuTiep = tiep ? t('Tiếp: {tieuDe}', { tieuDe: [dich(tiep.tieuDe), tiep.hocVien].filter(Boolean).join(' · ') }) : null;
  return (
    <KhungTaiCho.Provider value>
      <KhungPanel tieuDe={dich(yc.tieuDe)} loai={`${t('Việc · Duyệt')} · ${dich(yc.nhanPhanLoai)}`}
        dau={{ han: !xong && yc.trangThai === 'cho' && yc.hanDuyet ? <ChipHan loai="duyet" han={yc.hanDuyet} /> : undefined,
          dong2: [
            yc.hocVien && (yc.hocVienId != null ? <Link to={`/hoc-vien/${yc.hocVienId}`} className="link">{yc.hocVien}</Link> : yc.hocVien),
            yc.lop, yc.phu && dich(yc.phu),
            yc.sos && <ChipSos muc={yc.sos.muc} kyNang={yc.sos.kyNang} tam={yc.sos.tam} dot={yc.diemHv?.luot} ten={yc.hocVien} />,
          ].filter(Boolean) }}
        chan={xong ? {
          huy: tiep ? null : { nhan: t('Đóng'), onClick: onDong },
          trai: <span className="min-w-0 truncate text-dim"><b className="font-semibold text-dim">{t('✓ Đã lưu')}</b>{chuTiep && ` · ${chuTiep}`}</span>,
          chinh: tiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => xong.onTiep(tiep)}>{t('Yêu cầu tiếp ›')}</button> : undefined,
        } : !cho ? undefined : {
          huy: null,
          trai: chuTiep && <span className="min-w-0 truncate text-dim" title={chuTiep}>{chuTiep}</span>,
          chinh: <span ref={setChanEl} className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:[&>.btn]:flex-1 max-sm:[&>.btn]:justify-center" />,
        }}
        onDong={onDong}>
        {xong ? (
          <div role="status" className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-ok-line bg-ok-bg px-3 py-2.5 text-[13px]">
            <b className="min-w-0 flex-1 font-semibold text-ok">✓ {dich(xong.chu)}</b>
            {xong.onHoanTac && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={xong.onHoanTac}>{t('Hoàn tác')}</button>}
          </div>
        ) : null}
        {/* Mockup #cv nth=1: bối cảnh vẫn đọc được sau khi quyết (bản chụp thẻ lúc quyết — chỉ đọc). */}
        {xong && (
          <div className="mt-3 rounded-lg bg-[color:var(--surface-2)] px-3 py-2.5 text-[13px] leading-snug text-slate-300">
            {yc.dong.map((d, i) => <p key={i} className="m-0 whitespace-pre-line">{dich(d)}</p>)}
            {yc.diemHv && (
              <dl className="m-0 mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                <dt className="pt-1.5 text-[13px] text-dim">{t('Điểm')}</dt><dd className="m-0 min-w-0"><DongDiem d={yc.diemHv} /></dd>
              </dl>
            )}
          </div>
        )}
        {xong ? null : <TheYeuCau yc={yc} panel moSan={moSan} onXong={onXong} onThemPa={onThemPa} chanEl={cho ? chanEl : undefined} />}
        <LichSuYeuCau id={yc.id} n={yc.soLichSu ?? 0} />
      </KhungPanel>
    </KhungTaiCho.Provider>
  );
}

/** DUYET-QL: "Lịch sử · n ▸" gập cuối thân panel duyệt — bấm mở tại chỗ, CHỈ khi mở mới gọi `/lich-su?loai=yeu-cau` (≤ 3 câu, ≤ 50 dòng).
 *  `n` đổi (quyết xong — số máy chủ trả kèm) mà danh sách đang mở → tải lại đúng phần lịch sử; đang gập thì không gọi gì. */
function LichSuYeuCau({ id, n }: { id: number; n: number }) {
  const [mo, setMo] = useState(false);
  const { data, loading, error, reload } = useApi<{ dong: { luc: string; nguoi: string | null; chu: string }[] }>(mo ? `/lich-su?loai=yeu-cau&id=${id}` : null, [mo, id, n]);
  if (!n) return null;
  return (
    <div className="mt-4 grid gap-2 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
        className="min-h-[44px] justify-self-start appearance-none border-0 bg-transparent p-0 text-left text-sm font-semibold text-dim hover:text-[color:var(--text)] sm:min-h-0 sm:py-1">
        {t('Lịch sử · {n}', { n })} <span aria-hidden>{mo ? '▾' : '▸'}</span>
      </button>
      {mo && (error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading && !data ? <Skeleton rows={2} />
        : (
          <ol className="m-0 grid list-none gap-1.5 p-0 text-[13px] text-dim">
            {data?.dong.map((d, i) => (
              <li key={i}><span className="mr-2 tabular-nums text-faint">{lucNgan(d.luc)}</span>{d.nguoi && <b className="font-semibold text-[color:var(--text)]">{d.nguoi}</b>} {dich(d.chu)}</li>
            ))}
          </ol>
        ))}
    </div>
  );
}

/**
 * V8-CV (mockup `thiet-ke/v8/cong-viec-ql.html` A1–A2, 375 B1): "Chờ bạn duyệt" đầu Công việc — ba tầng như danh sách việc: khối em (chữ đầu ·
 * tên = link hồ sơ · lớp) → dòng yêu cầu [tên 15 · thẻ phụ | hạn 150 + người gửi | Duyệt + Từ chối… · Mở ›]; yêu cầu không gắn em (dời lịch cả lớp…)
 * là dòng có ô biểu tượng. Bấm chữ dòng = panel duyệt bên phải (một kiểu mở với dòng việc). v12: kẻ hai bậc như dòng việc (S12); "Nếu duyệt" ở `title`
 * và panel duyệt, không thành dòng (S4).
 */
function CayDuyet({ ds, ...dong }: { ds: (TheYeuCauDto & { giu?: { chu: string; huy: boolean } })[] } & ChungDongDuyet) {
  const khoi: TheYeuCauDto[][] = [];
  const viTri = new Map<number, number>();
  for (const y of ds) {
    const i = y.hocVienId == null ? undefined : viTri.get(y.hocVienId);
    if (i !== undefined) { khoi[i].push(y); continue; }
    if (y.hocVienId != null) viTri.set(y.hocVienId, khoi.length);
    khoi.push([y]);
  }
  return (
    <ul className="m-0 list-none p-0" aria-label={t('Yêu cầu chờ duyệt')}>
      {khoi.map((k) => (
        <li key={k[0].id} className="border-t first:border-t-0" style={BAC_1}>
          {k[0].hocVienId == null ? <DongDuyet y={k[0]} {...dong} /> : (
            <div className="pb-1.5 pt-3">
              <div className="flex min-h-[30px] items-center gap-2.5 px-4 pb-1 max-sm:px-3">
                <span aria-hidden className="h-7 w-7 shrink-0 rounded-full border text-center text-[12px] font-bold leading-[26px] text-dim"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--line-strong)' }}>{chuDau(k[0].hocVien ?? '')}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <Link to={`/hoc-vien/${k[0].hocVienId}`} title={t('Mở hồ sơ {ten}', { ten: k[0].hocVien ?? '' })}
                    className="whitespace-nowrap text-[15px] font-semibold leading-snug text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline">{k[0].hocVien}</Link>
                  {k[0].lop && <span className="whitespace-nowrap text-[13px] text-dim">{k[0].lop}</span>}
                  {/* DUYET-QL: SOS hiện tại của em (máy chủ gắn ở tab Chờ duyệt) — dòng duyệt không có cột điểm nên giữ "· S". */}
                  {k[0].sos && <ChipSos muc={k[0].sos.muc} kyNang={k[0].sos.kyNang} tam={k[0].sos.tam} dot={k[0].diemHv?.luot} ten={k[0].hocVien} />}
                </span>
              </div>
              <ul className="m-0 list-none p-0">{k.map((y, i) => <li key={y.id} className={NET_CAY}>{i > 0 && <KeBac2 />}<DongDuyet y={y} em {...dong} /></li>)}</ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

type ChungDongDuyet = {
  dang: number | null; dangGui: number | null; toi: number | null;
  chon: (y: TheYeuCauDto) => { checked: boolean; onChange: (v: boolean) => void } | null;
  onMo: (y: TheYeuCauDto, o?: MoSan) => void; onDuyet: (y: TheYeuCauDto) => void; onHoanTac: (id: number) => void;
};

/** Một dòng yêu cầu: ô tích (loại duyệt nhiều được) trong rãnh cây · chữ (bấm = panel) · chip hạn · Duyệt / Duyệt… / Trả lời… + Từ chối… · Mở ›. */
function DongDuyet({ y, em = false, dang, dangGui, toi, chon, onMo, onDuyet, onHoanTac }: { y: TheYeuCauDto & { giu?: { chu: string; huy: boolean } }; em?: boolean } & ChungDongDuyet) {
  const { ngan } = useNgayNghiepVu();
  /* DUYET-QL: dòng vừa quyết — giữ chỗ, nền ok, "✓ {kết quả}" + Hoàn tác (loại máy chủ cho huỷ). */
  if (y.giu) return (
    <div role="status" className={`grid min-h-[56px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 bg-ok-bg py-2 pr-3 sm:pr-4 ${em ? 'pl-[40px] sm:pl-[44px]' : 'pl-3 sm:pl-4'}`}
      style={{ boxShadow: dang === y.id ? 'inset 3px 0 0 var(--accent)' : undefined }}>
      <span aria-hidden className={em ? 'w-5' : 'w-7'} />
      <span className="grid min-w-0 gap-px">
        <span className="truncate text-[15px] leading-normal text-dim">{dich(y.tieuDe)}</span>
        <span className="min-w-0 truncate text-[13px] font-semibold leading-normal text-ok">✓ {dich(y.giu.chu)}</span>
      </span>
      {y.giu.huy && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => onHoanTac(y.id)}>{t('Hoàn tác')}</button>}
    </div>
  );
  const o = chon(y);
  const coBuoc = y.loai === 'lich_thi' || !!y.duLieu?.canGhiChu || !!y.duLieu?.moPanelChuyenLop;
  /* AUDIT-UI B6: lọc Đã xử lý / Báo QL ở cùng danh sách — dòng không còn phải quyết thì cột phải là trạng thái (+ ngày xử lý) và "Mở ›", không nút Duyệt. */
  const choQuyet = y.trangThai === 'cho' && y.kieuNut !== 'nhac';
  const tt = nhanTrangThaiYc(y.trangThai, y.tuDuyet);
  /* v12 S13: mỗi trường một dáng — loại = chip VIỀN, lượt / ngày gửi / lớp = chip nền nhạt (không ghép "a · b · c"), người gửi về cột người. */
  const phu = (em ? [y.phu ? dich(y.phu) : ngan(y.taoLuc)] : [y.lop, y.phu ? dich(y.phu) : null]).filter((x): x is string => !!x);
  /* v12 S4: "Nếu duyệt: …" không thành dòng (lặp tiêu đề, bị cắt) — xem khi rê chuột (`title`) hoặc bấm dòng mở panel duyệt. */
  const neuDuyet = y.neuDuyet ? t('Nếu duyệt: {neuDuyet}', { neuDuyet: dich(y.neuDuyet) }) : undefined;
  const dungLai = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div data-hd="cd-dong" onClick={() => onMo(y)} title={neuDuyet}
      className={`grid min-h-[56px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 py-2 pr-3 sm:grid-cols-[auto_minmax(0,1fr)_170px_118px] sm:pr-4 ${
        em ? 'pl-[40px] sm:pl-[44px]' : 'pl-3 sm:pl-4'} ${dang === y.id ? 'row-active' : 'bam'}`}>
      {em ? (
        <span className="relative mt-2.5 inline-flex w-5 justify-center self-start" onClick={dungLai}>
          {o && (
            <label className="relative inline-flex cursor-pointer max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={o.checked}
                onChange={(e) => o.onChange(e.target.checked)} aria-label={t('Chọn: {tieuDe}', { tieuDe: dich(y.tieuDe) })} />
            </label>
          )}
        </span>
      ) : (
        <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--accent)]" style={{ background: 'var(--accent-soft)' }}>
          <IconNhom k={y.loai === 'lich_thi' ? 'sau-thi' : 'lop'} />
        </span>
      )}
      <button type="button" onClick={(e) => { e.stopPropagation(); onMo(y); }} aria-current={dang === y.id ? 'true' : undefined}
        className="grid min-w-0 scroll-mt-14 appearance-none gap-px border-0 bg-transparent p-0 text-left">
        {/* v12 S1: tên yêu cầu 500 — chỉ tên em đậm. */}
        <span className="text-[15px] font-medium leading-snug text-[color:var(--text)]">{dich(y.tieuDe)}</span>
        <ThePhu vien={em && y.nhanPhanLoai ? [dich(y.nhanPhanLoai)] : []} ds={phu} />
      </button>
      <span className="col-start-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:col-start-auto sm:grid sm:justify-items-start">
        {y.trangThai === 'cho' ? y.hanDuyet && <ChipHan vien loai="duyet" han={y.hanDuyet} />
          : <span className="flex items-center gap-1.5"><NhanTrangThai t={tt.t} />{y.xuLyLuc && <span className="text-[12px] text-dim">{ngan(y.xuLyLuc)}</span>}</span>}
        {/* audit CV7: người gửi là chính người xem → "Bạn", không vai. */}
        {y.nguoiXin && (y.nguoiXinId != null && y.nguoiXinId === toi ? <NguoiGiu ten={t('Bạn')} /> : <NguoiGiu ten={y.nguoiXin} vai={y.vaiNguoiXin} />)}
      </span>
      <span className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 sm:col-start-auto sm:flex-col sm:items-stretch sm:gap-1" onClick={dungLai}>
        {!choQuyet ? null : y.kieuNut === 'duyet-tu-choi' ? (
          <button type="button" className="btn btn-sm min-h-[44px] justify-center font-semibold sm:h-auto sm:min-h-[30px] sm:w-full" disabled={dangGui === y.id}
            title={y.nguoiXinId != null && y.nguoiXinId === toi ? t('Bạn tự gửi · tự duyệt được') : undefined}
            onClick={() => (coBuoc ? onMo(y, 'duyet') : onDuyet(y))}>{dangGui === y.id ? t('Đang lưu…') : coBuoc ? t('Duyệt…') : t('Duyệt')}</button>
        ) : (
          <button type="button" className="btn btn-sm min-h-[44px] justify-center font-semibold sm:h-auto sm:min-h-[30px] sm:w-full" onClick={() => onMo(y, 'tra-loi')}>{t('Trả lời…')}</button>
        )}
        <span className="flex items-center gap-x-4 text-[13px] sm:justify-center sm:gap-x-2">
          {choQuyet && y.kieuNut === 'duyet-tu-choi' && (
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => onMo(y, 'tu-choi')}>{t('Từ chối…')}</button>
          )}
          {y.mo && <Link to={y.mo} className="link inline-flex min-h-[44px] items-center font-semibold sm:min-h-0">{t('Mở ›')}</Link>}
        </span>
      </span>
    </div>
  );
}
