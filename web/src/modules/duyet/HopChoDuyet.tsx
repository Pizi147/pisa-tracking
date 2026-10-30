import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { DongDiem } from '../../ui/SoLieu.tsx';
import { KhungPanel, KhungTaiCho, boChuRoi } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { useSession } from '../../lib/session.tsx';
import { IconNhom, NET_CAY, chuDau } from '../congViec/DanhSachViec.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import {
  LOAI_YC_META, PHAN_LOAI_CAN_QUYET, PHAN_LOAI_LABEL, TRAN_HANG_LOAT, chiaLo, chonHet, chonMot, laPhanLoai, nhanTrangThaiYc, tomTatKetQuaHangLoat,
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
 * CÔNG VIỆC › CHỜ DUYỆT (PR-DUYET, M8, Q27-3) — MỘT hộp cho mọi thứ "ai đó xin Quản lý quyết". Chip phân loại phải quyết đứng cố định kể cả
 * số 0 (Q12), ba tab Chờ duyệt · Báo QL (PR-GVb J5b; OV-12h bỏ Nhắc, đổi tên — mã `de-biet` giữ) · Đã xử lý 30 ngày, chi nhánh. Thẻ quá hạn đứng đầu (máy chủ xếp).
 * Duyệt hàng loạt (PR-GVb D01/Q-B): mọi tab phân loại (cả Tất cả), chỉ cùng MỘT loại `hangLoat`, tối đa `TRAN_HANG_LOAT`; kết quả một câu.
 */
export function HopChoDuyet({ gon = false, branchId: cnTrang, khuPanel }: {
  /** OV-15d: nhóm "Chờ bạn duyệt" đầu Công việc — chỉ thẻ đang chờ (mọi loại), không hàng lọc; vài dòng đầu + "Xem thêm", hộp đầy đủ ở `/cong-viec/cho-duyet`. */
  gon?: boolean;
  /** V8-CV: cột panel phải của Công việc — panel duyệt (`?the=`) vẽ vào đây, cùng chỗ panel việc. */
  khuPanel?: HTMLElement | null;
  /** SL1 (A7-01): chi nhánh của trang gọi (Tổng quan, Công việc) — số đầu nhóm và thẻ cùng một phạm vi. */
  branchId?: number | null;
} = {}) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const thamXem = params.get('xem');
  const xem = !gon && (thamXem === 'da-xu-ly' || thamXem === 'de-biet') ? thamXem : 'cho';
  /* Phân loại chỉ lọc ở tab Chờ duyệt; Báo QL chỉ có một phân loại. */
  const phan = !gon && xem !== 'de-biet' && laPhanLoai(params.get('phan')) && params.get('phan') !== 'bao-len' ? (params.get('phan') as KhoaChip) : 'tat-ca';
  /* SL1 (A7-01, X-03 — thay luật 06/10 "luôn mọi chi nhánh"): theo chi nhánh của trang; hộp đầy đủ dùng `cn` hoặc chi nhánh đã nhớ như mọi trang.
     `cn=tat-ca` (dòng "n thẻ ở chi nhánh khác · Xem") = mọi chi nhánh. */
  const macDinh = useChiNhanhMacDinh();
  const cnUrl = params.get('cn');
  const branchId = cnTrang !== undefined ? cnTrang : cnUrl === 'tat-ca' ? null : cnUrl ? Number(cnUrl) : macDinh;
  /* PR-S4F #5: `?lop=` — từ badge "n chờ duyệt" của một lớp. */
  const lopId = gon ? null : Number(params.get('lop')) || null;
  /* PR-VAI-a (Q17): `?qua-han=1` — từ số "k quá hạn" của dải Chờ duyệt ở Tổng quan. */
  const quaHan = !gon && params.get('qua-han') === '1' && xem !== 'da-xu-ly';
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.delete('the');
    setParams(next, { replace: true });
  };
  /* UI-CON-LAI k3: mở / đóng panel duyệt = `?the=` (giữ mọi bộ lọc). V8-CV: ở Công việc panel duyệt thay panel việc (`viec`) — một panel một lúc. */
  const moThe = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('the', String(id)); else next.delete('the');
    if (gon && id) { next.delete('viec'); next.delete('panel'); }
    setParams(next, { replace: true });
  };
  /* PR-GVb (J5b): link cũ `?phan=bao-len` (thông báo, Tổng quan cũ) → tab Báo QL, không gãy. */
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
  /* DUYET-QL: panel duyệt Công việc xin chip SOS + dòng điểm + số Lịch sử (PANEL-MC, +1 câu `latestAttempts`, Lịch sử đếm trong câu đọc thẻ). */
  if (gon) qs.set('boiCanh', '1');
  const url = `/yeu-cau?${qs}`;
  const { data, loading, error, reload } = useApi<Hop>(url, [url]);
  /* Mở từ chuông mà thẻ không còn trong danh sách đang xem (đã có người xử lý / tự đóng / khác chi nhánh đang lọc). */
  const theTuLink = Number(params.get('the')) || null;
  const theLac = !!data && !!theTuLink && !data.the.some((x) => x.id === theTuLink);
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
  /* CV-LOI (A1-14): bản gọn "Chọn hết" chỉ lấy thẻ ĐANG HIỆN — không duyệt thẻ chưa đọc sau "Xem thêm". */
  const dsChonHet = gon ? ds.slice(0, soHien) : ds;
  const nHet = loaiChon ? chonHet(dsChonHet, loaiChon).size : 0;
  const biCatTran = !!loaiChon && ds.filter((x) => x.loai === loaiChon && x.hangLoat && x.trangThai === 'cho').length > TRAN_HANG_LOAT;
  const choHangLoat = xem === 'cho';
  /* Gợi ý một lần: có ≥ 2 thẻ cùng loại hàng loạt mà chưa chọn gì. */
  const coCapHangLoat = choHangLoat && !chon.size && ds.some((a, i) => a.hangLoat && ds.some((b, j) => j !== i && b.loai === a.loai));
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
  /* Quyết ở panel: Công việc giữ panel thành thẻ kết quả; hộp đầy đủ đóng panel như cũ. Bị người khác xử lý trước (không `chu`) → đóng. */
  const xongPanel = (id: number, chu?: string, huy?: boolean) => {
    if (gon && chu) {
      const i = ds.findIndex((x) => x.id === id);
      const tiep = [...ds.slice(i + 1), ...ds.slice(0, Math.max(i, 0))].find((x) => x.trangThai === 'cho')?.id ?? null;
      const y = ds[i];
      if (y) { setVuaXong({ id, yc: y, chu, huy: !!huy, tiep }); giuCho(y, chu, !!huy); }
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
      toast.push('error', e instanceof ApiError ? e.message : t('Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại.'));
    } finally { setDangGui(null); xong(); }
  };
  /* Thẻ lỗi: một câu tổng + tối đa 3 dòng chi tiết, còn lại gộp — không dồn hàng chục toast. */
  const baoKetQua = (viec: 'duyet' | 'tu-choi', ok: number, loi: { id: number; loi: string; ma: number }[]) => {
    toast.push(loi.length ? 'error' : 'ok', tomTatKetQuaHangLoat(viec, ok, loi));
    const chiTiet = loi;
    for (const l of chiTiet.slice(0, 3)) toast.push('error', `${ds.find((x) => x.id === l.id)?.hocVien ?? `Yêu cầu #${l.id}`}: ${l.loi}`);
    if (chiTiet.length > 3) toast.push('error', `…và ${chiTiet.length - 3} thẻ khác`);
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
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.');
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
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.');
      xong();
    } finally { setBusy(false); }
  };
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  const dem = data?.dem;
  const dsHien = gon ? ds.slice(0, soHien) : ds;
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
  return (
    <div className={gon ? '' : 'space-y-3'}>
      {!gon && <>
      <div className="flex flex-wrap items-end gap-2" data-hd="cd-loc">
        <BoLocDoan ariaLabel="Trạng thái" value={xem} onChange={(k) => {
          const next = new URLSearchParams(params);
          if (k === 'cho') next.delete('xem'); else next.set('xem', k);
          if (k === 'de-biet') next.delete('phan');
          next.delete('the');
          setParams(next, { replace: true });
        }}
          muc={[{ key: 'cho', nhan: 'Chờ duyệt', so: xem === 'da-xu-ly' ? null : dem?.['tat-ca'] ?? null },
            { key: 'de-biet', nhan: 'Báo QL', so: xem === 'da-xu-ly' ? null : data?.demBiet ?? null },
            { key: 'da-xu-ly', nhan: 'Đã xử lý (30 ngày)' }]} />
        {/* VIEC-NHO-2 (phương án A): Trạng thái đứng đầu; nhóm Loại GIỮ CHỖ, mờ ở Báo QL — bấm Báo QL thì hàng lọc không nhảy. */}
        <span className="mx-1 hidden h-5 w-px self-center sm:block" style={{ background: 'var(--line)' }} />
        <BoLocDoan ariaLabel="Loại yêu cầu" value={phan} onChange={(k) => setParam('phan', k === 'tat-ca' ? null : k)}
          tat={xem === 'de-biet' ? 'Báo QL không chia loại' : undefined}
          muc={[{ key: 'tat-ca' as KhoaChip, nhan: 'Tất cả', so: dem?.['tat-ca'] ?? null },
            ...PHAN_LOAI_CAN_QUYET.map((k) => ({ key: k as KhoaChip, nhan: PHAN_LOAI_LABEL[k], so: dem?.[k] ?? null }))]} />
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : 'tat-ca')} />
        {quaHan && (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" title="Bỏ lọc quá hạn" onClick={() => setParam('qua-han', null)}>
            Quá hạn · <span className="tabular-nums">{ds.length}</span> ✕
          </button>
        )}
        {lopId && (
          <button type="button" className="btn btn-sm" title="Bỏ lọc lớp" onClick={() => setParam('lop', null)}>
            Lớp {data?.lopDangLoc?.code ?? lopId} ✕
          </button>
        )}
      </div>
      {xem !== 'da-xu-ly' && ds.length > 1 && <p className="m-0 text-[12px] text-slate-400">{t('{n} đề xuất · quá hạn trước → hạn gần nhất', { n: ds.length })}</p>}
      {coCapHangLoat && <p className="m-0 text-[12px] text-slate-400">Đánh dấu ô ở thẻ để duyệt nhiều cùng loại.</p>}
      {theLac && (
        <p role="status" className="m-0 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[13px] text-slate-300"
          style={{ borderColor: 'var(--line)' }}>
          Yêu cầu vừa mở không còn trong danh sách này{xem === 'cho' ? ' — có thể đã được xử lý hoặc tự đóng.' : '.'}
          {xem === 'cho' && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => {
              const next = new URLSearchParams(params); next.set('xem', 'da-xu-ly'); next.delete('phan'); setParams(next, { replace: true });
            }}>Xem ở Đã xử lý</button>
          )}
        </p>
      )}
      </>}
      {loading && (gon ? <div className="px-4 py-3"><Skeleton rows={4} /></div> : <Card><Skeleton rows={6} /></Card>)}
      {data && ds.length === 0 && !gon && (
        <Card><Empty title={xem === 'cho' ? 'Không có yêu cầu nào đang chờ' : xem === 'de-biet' ? 'Không có thẻ Báo QL'
          : 'Chưa có yêu cầu nào được xử lý trong 30 ngày'} /></Card>
      )}
      {/* UI-CON-LAI k3 (con-lai.html, chủ SP 24/10): hộp đầy đủ = DANH SÁCH dòng gọn (quá hạn / cũ trước) + PANEL duyệt bên phải (375: toàn màn).
          Bấm dòng = `?the=` (chuông / Quay lại mở đúng thẻ); quyết xong panel đóng, danh sách làm mới. Bản gọn đầu Công việc giữ thẻ tại chỗ. */}
      {ds.length > 0 && !gon && (
        /* Cùng mẫu Chấm Test: ≥ 1024 hai cột, panel TẠI CHỖ (không phủ, danh sách vẫn bấm được); < 1024 bấm dòng → panel thay danh sách. */
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ul className={`card m-0 list-none overflow-hidden p-0 ${theMo ? 'max-lg:hidden' : ''}`} aria-label="Danh sách yêu cầu">
            {ds.map((y) => (
              <DongYeuCau key={y.id} yc={y} dang={theTuLink === y.id} onMo={() => { if (theTuLink !== y.id) boChuRoi(() => moThe(y.id)); }}
                chon={choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
                  checked: chon.has(y.id),
                  onChange: (v) => setChon((s) => chonMot(ds, s, y.id, v)),
                } : null} />
            ))}
          </ul>
          <div className={`lg:sticky lg:top-3 ${theMo ? 'space-y-2' : 'max-lg:hidden'}`}>
            {theMo ? (
              <>
                <button type="button" className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden"
                  onClick={() => boChuRoi(() => moThe(null))}>‹ Chờ duyệt</button>
                <PanelDuyet key={theMo.id} yc={theMo} tiep={tiepSau(theMo.id)} onDong={() => moThe(null)} onXong={xongPanel} onThemPa={setNgan} />
              </>
            ) : <Card><Empty title={t('Chọn một đề xuất bên trái để xem và quyết')} /></Card>}
          </div>
        </div>
      )}
      {dsCay.length > 0 && gon && (
        <CayDuyet ds={dsCay} dang={theTuLink} chon={chonCua} onMo={moTheTu} onDuyet={(y) => void duyetNgay(y)} onHoanTac={(id) => void huyQd(id)}
          dangGui={dangGui} toi={session?.user?.id ?? null} />
      )}
      {!gon && !!data?.khacChiNhanh && (
        <p className="m-0 text-[13px] text-slate-400">
          {t('{n} yêu cầu ở chi nhánh khác', { n: data.khacChiNhanh })} · <Link to="/cong-viec/cho-duyet?cn=tat-ca" className="link max-sm:inline-block max-sm:py-3">{t('Xem ›')}</Link>
        </p>
      )}
      {gon && data && (
        /* V8-CV: chân nhóm — Xem thêm · Mở hộp duyệt › · n ở chi nhánh khác · Xem › ("thẻ" → "yêu cầu", một tên). */
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-[13px] max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
          {ds.length > soHien && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setSoHien((n) => n + 10)}>
              {t('Xem thêm {n} yêu cầu', { n: Math.min(10, ds.length - soHien) })}
            </button>
          )}
          <Link to="/cong-viec/cho-duyet" className="link font-semibold max-sm:py-3">{t('Mở hộp duyệt ›')}</Link>
          {!!data.khacChiNhanh && (
            <span className="text-dim">{t('{n} yêu cầu ở chi nhánh khác', { n: data.khacChiNhanh })} · <Link to="/cong-viec/cho-duyet?cn=tat-ca" className="link font-semibold max-sm:inline-block max-sm:py-3">{t('Xem ›')}</Link></span>
          )}
        </div>
      )}

      {chon.size > 0 && (
        <div className={`sticky bottom-2 z-10 ${gon ? 'mx-3 mb-3' : ''} flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 shadow-lg`}
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <span className="text-sm tabular-nums text-slate-300">
            Đã chọn {chon.size}{loaiChon ? ` · ${LOAI_YC_META[loaiChon]?.nhan ?? ''}` : ''}
            {biCatTran && <span className="ml-2 text-[12px] text-slate-400">Tối đa {TRAN_HANG_LOAT} một lần</span>}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {loaiChon && nHet > chon.size && (
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy}
                onClick={() => setChon(chonHet(dsChonHet, loaiChon))}>Chọn hết {nHet}</button>
            )}
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setChon(new Set())} disabled={busy}>Bỏ chọn</button>
            {loaiChon && LOAI_YC_META[loaiChon]?.kieuNut === 'duyet-tu-choi' && (
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-pressed={lyDoTc !== null} disabled={busy}
                onClick={() => { setLyDoTc(lyDoTc === null ? '' : null); setTcDaBam(false); }}>Từ chối {chon.size}…</button>
            )}
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={duyetNhieu} disabled={busy || lyDoTc !== null}>
              {busy && lyDoTc === null ? 'Đang duyệt…' : `Duyệt ${chon.size} yêu cầu`}
            </button>
          </div>
          {lyDoTc !== null && (
            <div className="w-full space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
              <label className="block">
                <span className="mb-1 block text-[12px] font-bold text-slate-200">Lý do từ chối (người gửi sẽ đọc)<span aria-hidden className="text-bad"> *</span></span>
                <textarea className="field w-full" rows={2} maxLength={2000} autoFocus aria-label="Lý do từ chối" value={lyDoTc} aria-invalid={tcDaBam && !lyDoTc.trim()}
                  onChange={(e) => setLyDoTc(e.target.value)} />
              </label>
              {tcDaBam && !lyDoTc.trim() && <span className="block text-xs text-late">Chưa điền</span>}
              <div className="flex justify-end gap-1.5">
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => { setLyDoTc(null); setTcDaBam(false); }}>Đóng</button>
                <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void tuChoiNhieu()}>
                  {busy ? 'Đang từ chối…' : `Gửi từ chối ${chon.size}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {ngan && <NganCase caseId={ngan} viec="them-pa" onClose={() => setNgan(null)} onChanged={xong} />}
      {gon && khuPanel && theTuLink && createPortal(
        vuaXong?.id === theTuLink ? (
          /* DUYET-QL (mockup v10 #cv nth=1, V12): panel ở lại — khối "✓ Đã duyệt · Hoàn tác", chân "✓ Đã lưu · Tiếp: … · Yêu cầu tiếp ›". */
          <PanelDuyet yc={vuaXong.yc} tiep={tiepCua(vuaXong.tiep)} onDong={() => { setVuaXong(null); moThe(null); }} onXong={xongPanel} onThemPa={setNgan}
            xong={{ chu: vuaXong.chu, onHoanTac: vuaXong.huy ? () => void huyQd(vuaXong.id) : undefined, onTiep: (y) => moTheTu(y) }} />
        ) : theMo ? (
          <PanelDuyet key={`${theMo.id}:${moSan?.id === theMo.id ? moSan.o : ''}`} yc={theMo} moSan={moSan?.id === theMo.id ? moSan.o : undefined}
            tiep={tiepSau(theMo.id)} onDong={() => moThe(null)} onXong={xongPanel} onThemPa={setNgan} />
        ) : data ? (
          <div className="card space-y-3 px-5 py-5" role="status">
            <p className="m-0 text-sm text-slate-300">{t('Yêu cầu vừa mở không còn trong danh sách này — có thể đã được xử lý hoặc tự đóng.')}</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/cong-viec/cho-duyet?xem=da-xu-ly" className="btn btn-sm min-h-[44px] sm:min-h-[32px]">{t('Xem ở Đã xử lý')}</Link>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => moThe(null)}>{t('Đóng')}</button>
            </div>
          </div>
        ) : null,
        khuPanel,
      )}
    </div>
  );
}

type MoSan = 'duyet' | 'tu-choi' | 'tra-loi';

/** PANEL DUYỆT (UI-CON-LAI k3, V8-CV) — một khuôn cho Hộp duyệt và Công việc: loại · tên · em · lớp · chip hạn, thân là thẻ ở dạng panel.
 *  DUYET-QL (mockup v10 #cv): thân cuộn, CHÂN DÍNH "Tiếp: {yêu cầu kế}" · Từ chối… · Duyệt (nút của thẻ vẽ vào chân qua portal); đầu có chip SOS;
 *  "Lịch sử · n" gập cuối thân. `xong` = vừa quyết ở panel: khối "✓ … · Hoàn tác", chân "✓ Đã lưu · Yêu cầu tiếp ›". */
function PanelDuyet({ yc, moSan, tiep, xong, onDong, onXong, onThemPa }: {
  yc: TheYeuCauDto; moSan?: MoSan; tiep?: TheYeuCauDto | null; onDong: () => void; onXong: (id: number, chu?: string, huy?: boolean) => void; onThemPa: (caseId: number) => void;
  xong?: { chu: string; onHoanTac?: () => void; onTiep: (y: TheYeuCauDto) => void };
}) {
  const [chanEl, setChanEl] = useState<HTMLElement | null>(null);
  /* Thẻ đã xử lý (tab Đã xử lý · Sửa trả lời… · Huỷ quyết định) giữ nút trong thân như cũ — chân dính chỉ cho thẻ đang chờ quyết. */
  const cho = yc.trangThai === 'cho';
  const chuTiep = tiep ? t('Tiếp: {tieuDe}', { tieuDe: [dich(tiep.tieuDe), tiep.hocVien].filter(Boolean).join(' · ') }) : null;
  return (
    <KhungTaiCho.Provider value>
      <KhungPanel tieuDe={dich(yc.tieuDe)} loai={`${t('VIỆC · DUYỆT')} · ${dich(yc.nhanPhanLoai).toLocaleUpperCase('vi')}`}
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

/** DUYET-QL: "Lịch sử · n ▸" gập cuối thân panel duyệt — bấm mở tại chỗ, CHỈ khi mở mới gọi `/lich-su?loai=yeu-cau` (≤ 3 câu, ≤ 50 dòng). */
function LichSuYeuCau({ id, n }: { id: number; n: number }) {
  const [mo, setMo] = useState(false);
  const { data, loading, error, reload } = useApi<{ dong: { luc: string; nguoi: string | null; chu: string }[] }>(mo ? `/lich-su?loai=yeu-cau&id=${id}` : null, [mo, id]);
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
 * tên = link hồ sơ · lớp) → dòng yêu cầu [tên 15 · loại · người gửi · ngày / "Nếu duyệt" một dòng | hạn 136 | Duyệt + Từ chối… · Mở ›]; yêu cầu
 * không gắn em (dời lịch cả lớp…) là dòng có ô biểu tượng. Bấm chữ dòng = panel duyệt bên phải (một kiểu mở với dòng việc).
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
        <li key={k[0].id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line-strong)' }}>
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
              <ul className="m-0 list-none p-0">{k.map((y) => <li key={y.id} className={NET_CAY}><DongDuyet y={y} em {...dong} /></li>)}</ul>
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
  const phu = (em ? [dich(y.nhanPhanLoai), y.nguoiXin, y.phu ? dich(y.phu) : ngan(y.taoLuc)]
    : [y.lop, y.nguoiXin ? t('{ai} gửi', { ai: y.nguoiXin }) : null, y.phu ? dich(y.phu) : null]).filter(Boolean).join(' · ');
  const neuDuyet = y.neuDuyet ? t('Nếu duyệt: {neuDuyet}', { neuDuyet: dich(y.neuDuyet) }) : null;
  const dungLai = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div data-hd="cd-dong" onClick={() => onMo(y)}
      className={`grid min-h-[56px] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 py-2 pr-3 sm:grid-cols-[auto_minmax(0,1fr)_136px_112px] sm:pr-4 ${
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
        <span className={`text-[15px] leading-snug text-[color:var(--text)] ${em ? 'font-medium' : 'font-semibold'}`}>{dich(y.tieuDe)}</span>
        {phu && <span className="min-w-0 break-words text-[13px] leading-snug text-dim">{phu}</span>}
        {neuDuyet && <span className="min-w-0 truncate text-[13px] leading-normal text-dim" title={neuDuyet}>{neuDuyet}</span>}
      </button>
      <span className="col-start-2 sm:col-start-auto">{y.hanDuyet && <ChipHan loai="duyet" han={y.hanDuyet} />}</span>
      <span className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 sm:col-start-auto sm:flex-col sm:items-stretch sm:gap-1" onClick={dungLai}>
        {y.kieuNut === 'duyet-tu-choi' ? (
          <button type="button" className="btn btn-sm min-h-[44px] sm:h-auto sm:min-h-[30px] sm:w-full" disabled={dangGui === y.id}
            title={y.nguoiXinId != null && y.nguoiXinId === toi ? t('Bạn tự gửi · tự duyệt được') : undefined}
            onClick={() => (coBuoc ? onMo(y, 'duyet') : onDuyet(y))}>{dangGui === y.id ? t('Đang lưu…') : coBuoc ? t('Duyệt…') : t('Duyệt')}</button>
        ) : (
          <button type="button" className="btn btn-sm min-h-[44px] sm:h-auto sm:min-h-[30px] sm:w-full" onClick={() => onMo(y, 'tra-loi')}>{t('Trả lời…')}</button>
        )}
        <span className="flex items-center gap-x-4 text-[13px] sm:justify-between sm:px-1">
          {y.kieuNut === 'duyet-tu-choi' && (
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => onMo(y, 'tu-choi')}>{t('Từ chối…')}</button>
          )}
          {y.mo && <Link to={y.mo} className="link inline-flex min-h-[44px] items-center font-semibold sm:min-h-0">{t('Mở ›')}</Link>}
        </span>
      </span>
    </div>
  );
}

/** UI-CON-LAI k3: MỘT dòng gọn của Hộp duyệt — loại · hạn (chữ, không chỉ màu) / việc · em · lớp / dòng đầu của lý do. Bấm = mở panel duyệt. */
function DongYeuCau({ yc, dang, onMo, chon }: {
  yc: TheYeuCauDto; dang: boolean; onMo: () => void; chon: { checked: boolean; onChange: (v: boolean) => void } | null;
}) {
  const { ngan } = useNgayNghiepVu();
  const cho = yc.trangThai === 'cho';
  const tt = nhanTrangThaiYc(yc.trangThai, yc.tuDuyet);
  const tieuDeDu = [dich(yc.tieuDe), yc.hocVien, yc.lop].filter(Boolean).join(' · ');
  /* CV-CHO-DUYET-375 (mockup V5 `con-lai.html` §3 `.the-duyet`, luật hình ảnh 28/10): đệm 12 / 16, nhãn loại 12 / 700 mờ (không IN HOA — luật K-CHU-3), chip hạn `ChipHan` (mẫu V7 cong-viec-2)
     (badge tiến độ `.bd-td`) bên phải, tiêu đề 14 / 700 cả tên em · lớp, dòng phụ 12 mờ; cách dòng 4 px. */
  return (
    <li className={`flex items-start gap-2 border-b px-4 py-3 last:border-b-0 ${dang ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : 'bam'}`}
      style={{ borderColor: 'var(--line)' }}>
      {chon && (
        <label className="relative mt-1 inline-flex shrink-0 cursor-pointer max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']">
          <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={chon.checked}
            onChange={(e) => chon.onChange(e.target.checked)} aria-label={t('Chọn: {tieuDe}', { tieuDe: dich(yc.tieuDe) })} />
        </label>
      )}
      <button type="button" className="min-h-[44px] min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left sm:min-h-0" aria-current={dang || undefined} onClick={onMo}>
        <span className="flex min-h-[22px] items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[12px] font-bold text-slate-400">{dich(yc.nhanPhanLoai)}</span>
          {cho ? <span className="shrink-0"><ChipHan loai="duyet" han={yc.hanDuyet} /></span>
            : <span className="flex shrink-0 items-center gap-1.5"><NhanTrangThai t={tt.t} />{yc.xuLyLuc && <span className="text-[12px] text-slate-400">{ngan(yc.xuLyLuc)}</span>}</span>}
        </span>
        {/* Điện thoại: xuống dòng (như #647 / #649), không cắt; từ `sm` một dòng `truncate` + `title` đủ chữ. Mã lớp không ngắt giữa ("MB FT 101"),
            "·" dính chữ trước (không đứng đầu dòng); tên em dài vẫn xuống dòng, không tràn khung. */}
        <b className="mt-1 block break-words text-sm font-bold text-slate-100 sm:truncate" title={tieuDeDu}>
          {dich(yc.tieuDe)}{[yc.hocVien, yc.lop].filter(Boolean).map((x, i) => (
            <span key={i}>{'\u00a0· '}<span className={x === yc.lop ? 'whitespace-nowrap' : undefined}>{x}</span></span>
          ))}
        </b>
        {yc.dong[0] && <span className="mt-1 block break-words text-[12px] text-slate-400 sm:truncate" title={dich(yc.dong[0])}>{dich(yc.dong[0])}</span>}
      </button>
    </li>
  );
}
