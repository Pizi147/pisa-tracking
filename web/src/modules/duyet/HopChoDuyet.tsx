import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import {
  LOAI_YC_META, PHAN_LOAI_CAN_QUYET, PHAN_LOAI_LABEL, TRAN_HANG_LOAT, chiaLo, chonHet, chonMot, laPhanLoai, tomTatKetQuaHangLoat,
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
export function HopChoDuyet({ gon = false, branchId: cnTrang }: {
  /** OV-15d: nhóm "Chờ bạn duyệt" đầu Công việc — chỉ thẻ đang chờ (mọi loại), không hàng lọc; vài thẻ đầu + "Xem thêm", hộp đầy đủ ở `/cong-viec/cho-duyet`. */
  gon?: boolean;
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
  const url = `/yeu-cau?${qs}`;
  const { data, loading, error, reload } = useApi<Hop>(url, [url]);
  const nhan = useTheNhanManh(data?.the);
  /* Mở từ chuông mà thẻ không còn trong danh sách đang xem (đã có người xử lý / tự đóng / khác chi nhánh đang lọc). */
  const theTuLink = Number(params.get('the')) || null;
  const theLac = !!data && !!theTuLink && !data.the.some((x) => x.id === theTuLink);

  /* Hàng loạt: một loại một lúc (luật ở `chonMot` / `chonHet`). */
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  /* PR-LUI-a2: Từ chối nhiều — hàng lý do chung mở ngay trong thanh chọn. `null` = đang đóng. */
  const [lyDoTc, setLyDoTc] = useState<string | null>(null);
  const [tcDaBam, setTcDaBam] = useState(false);
  useEffect(() => { setChon(new Set()); }, [url]);
  useEffect(() => { if (!chon.size) { setLyDoTc(null); setTcDaBam(false); } }, [chon.size]);
  const ds = data?.the ?? [];
  const [soHien, setSoHien] = useState(3);
  const loaiChon = useMemo(() => (ds.find((x) => chon.has(x.id))?.loai ?? null) as LoaiYeuCau | null, [ds, chon]);
  /* CV-LOI (A1-14): bản gọn "Chọn hết" chỉ lấy thẻ ĐANG HIỆN — không duyệt thẻ chưa đọc sau "Xem thêm". */
  const dsChonHet = gon ? ds.slice(0, soHien) : ds;
  const nHet = loaiChon ? chonHet(dsChonHet, loaiChon).size : 0;
  const biCatTran = !!loaiChon && ds.filter((x) => x.loai === loaiChon && x.hangLoat && x.trangThai === 'cho').length > TRAN_HANG_LOAT;
  const choHangLoat = xem === 'cho';
  /* Gợi ý một lần: có ≥ 2 thẻ cùng loại hàng loạt mà chưa chọn gì. */
  const coCapHangLoat = choHangLoat && !chon.size && ds.some((a, i) => a.hangLoat && ds.some((b, j) => j !== i && b.loai === a.loai));
  const [ngan, setNgan] = useState<number | null>(null);

  const xong = () => { reload(); invalidate('/yeu-cau/dem'); };
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
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const dem = data?.dem;
  const dsHien = gon ? ds.slice(0, soHien) : ds;
  return (
    <div className="space-y-3">
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
      {xem !== 'da-xu-ly' && ds.length > 1 && <p className="m-0 text-[12px] text-slate-400">Xếp: quá hạn trước → hạn gần nhất</p>}
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
      {gon && coCapHangLoat && <p className="m-0 text-[12px] text-slate-400">Đánh dấu ô ở thẻ để duyệt nhiều cùng loại.</p>}
      {loading && <Card><Skeleton rows={6} /></Card>}
      {data && ds.length === 0 && !gon && (
        <Card><Empty title={xem === 'cho' ? 'Không có yêu cầu nào đang chờ' : xem === 'de-biet' ? 'Không có thẻ Báo QL'
          : 'Chưa có yêu cầu nào được xử lý trong 30 ngày'} /></Card>
      )}
      {ds.length > 0 && (
        <div className="space-y-2">
          {dsHien.map((y) => (
            <TheYeuCau key={y.id} yc={y} nhanManh={nhan === y.id} onXong={xong} onThemPa={setNgan}
              chon={choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
                checked: chon.has(y.id),
                onChange: (v) => setChon((s) => chonMot(ds, s, y.id, v)),
              } : null} />
          ))}
        </div>
      )}
      {!!data?.khacChiNhanh && (
        <p className="m-0 text-[13px] text-slate-400">
          {data.khacChiNhanh} thẻ ở chi nhánh khác · <Link to="/cong-viec/cho-duyet?cn=tat-ca" className="link max-sm:inline-block max-sm:py-3">Xem</Link>
        </p>
      )}
      {gon && data && (
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {ds.length > soHien && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSoHien((n) => n + 10)}>
              Xem thêm {Math.min(10, ds.length - soHien)} thẻ
            </button>
          )}
          <Link to="/cong-viec/cho-duyet" className="link max-sm:py-3">Mở hộp duyệt ›</Link>
        </div>
      )}

      {chon.size > 0 && (
        <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 shadow-lg"
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
                <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Lý do từ chối (người gửi sẽ đọc)<span aria-hidden className="text-bad"> *</span></span>
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
    </div>
  );
}
