import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import {
  LOAI_YC_META, PHAN_LOAI_CAN_QUYET, PHAN_LOAI_LABEL, TRAN_HANG_LOAT, chonHet, chonMot, laPhanLoai, tomTatKetQuaHangLoat,
  type KhoaChip, type LoaiYeuCau, type TheYeuCauDto,
} from '@shared/domain/index.ts';

type Hop = { the: TheYeuCauDto[]; dem: Record<KhoaChip, number>; demBiet: number; homNay: string; lopDangLoc?: { id: number; code: string } | null };

/** `?the=12` → cuộn tới thẻ, viền nhấn 2 giây. Dùng chung hộp và Yêu cầu của tôi. */
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
 * số 0 (Q12), ba tab Chờ duyệt · Nhắc việc (PR-GVb J5b; PR-NV đổi tên, mã `de-biet` giữ) · Đã xử lý 30 ngày, chi nhánh. Thẻ quá hạn đứng đầu (máy chủ xếp).
 * Duyệt hàng loạt (PR-GVb D01/Q-B): mọi tab phân loại (cả Tất cả), chỉ cùng MỘT loại `hangLoat`, tối đa `TRAN_HANG_LOAT`; kết quả một câu.
 * Nhắc việc: "Nhắc tất cả (n)" — máy chủ kiểm quyền từng thẻ, không nhắc lặp trong ngày; hết giờ giữa chừng → thẻ chưa nhắc bấm lại được.
 */
export function HopChoDuyet() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const thamXem = params.get('xem');
  const xem = thamXem === 'da-xu-ly' || thamXem === 'de-biet' ? thamXem : 'cho';
  /* Phân loại chỉ lọc ở tab Chờ duyệt; Nhắc việc chỉ có một phân loại. */
  const phan = xem !== 'de-biet' && laPhanLoai(params.get('phan')) && params.get('phan') !== 'bao-len' ? (params.get('phan') as KhoaChip) : 'tat-ca';
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* PR-S4F #5: `?lop=` — từ badge "n chờ duyệt" của một lớp. */
  const lopId = Number(params.get('lop')) || null;
  /* PR-VAI-a (Q17): `?qua-han=1` — từ số "k quá hạn" của dải Chờ duyệt ở Tổng quan. */
  const quaHan = params.get('qua-han') === '1' && xem !== 'da-xu-ly';
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.delete('the');
    setParams(next, { replace: true });
  };
  /* PR-GVb (J5b): link cũ `?phan=bao-len` (thông báo, Tổng quan cũ) → tab Nhắc việc, không gãy. */
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
  useEffect(() => { setChon(new Set()); }, [url]);
  const ds = data?.the ?? [];
  const loaiChon = useMemo(() => (ds.find((x) => chon.has(x.id))?.loai ?? null) as LoaiYeuCau | null, [ds, chon]);
  const nHet = loaiChon ? chonHet(ds, loaiChon).size : 0;
  const biCatTran = !!loaiChon && ds.filter((x) => x.loai === loaiChon && x.hangLoat && x.trangThai === 'cho').length > TRAN_HANG_LOAT;
  const choHangLoat = xem === 'cho';
  /* Gợi ý một lần: có ≥ 2 thẻ cùng loại hàng loạt mà chưa chọn gì. */
  const coCapHangLoat = choHangLoat && !chon.size && ds.some((a, i) => a.hangLoat && ds.some((b, j) => j !== i && b.loai === a.loai));
  /* Nhắc việc (G5): thẻ có người nhận + khoá việc, chưa nhắc hôm nay. `daNhacNgoai` = vừa nhắc hàng loạt. */
  const [daNhacNgoai, setDaNhacNgoai] = useState<Record<number, string>>({});
  /* Thẻ vừa nhắc lỗi (việc không còn, ngoài phạm vi…) không tính lại vào n — bấm lại cũng lỗi y hệt. Trừ 503 (chưa kịp): bấm lại được. */
  const [nhacLoi, setNhacLoi] = useState<Set<number>>(new Set());
  useEffect(() => { setDaNhacNgoai({}); setNhacLoi(new Set()); }, [url]);
  const nhacDuoc = xem === 'de-biet'
    ? ds.filter((x) => typeof x.duLieu?.ownerId === 'number' && typeof x.duLieu?.viecKey === 'string' && !x.duLieu?.daNhacLuc && !daNhacNgoai[x.id] && !nhacLoi.has(x.id))
    : [];
  const [ngan, setNgan] = useState<number | null>(null);

  const xong = () => { reload(); invalidate('/yeu-cau/dem'); };
  /* Thẻ lỗi: một câu tổng + tối đa 3 dòng chi tiết, còn lại gộp — không dồn hàng chục toast. */
  const baoKetQua = (viec: 'duyet' | 'nhac', ok: number, loi: { id: number; loi: string; ma: number }[]) => {
    toast.push(loi.length ? 'error' : 'ok', tomTatKetQuaHangLoat(viec, ok, loi));
    const chiTiet = loi.filter((l) => l.ma !== 503);   // "chưa nhắc, bấm lại" đã nói trong câu tổng
    for (const l of chiTiet.slice(0, 3)) toast.push('error', `${ds.find((x) => x.id === l.id)?.hocVien ?? `Yêu cầu #${l.id}`}: ${l.loi}`);
    if (chiTiet.length > 3) toast.push('error', `…và ${chiTiet.length - 3} thẻ khác`);
  };
  const duyetNhieu = async () => {
    if (busy || !chon.size) return;
    setBusy(true);
    try {
      const r = await api.post<{ ok: number[]; loi: { id: number; loi: string; ma: number }[] }>('/yeu-cau/duyet-nhieu', { ids: [...chon] });
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases');
      baoKetQua('duyet', r.ok.length, r.loi);
      setChon(new Set());
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.');
      xong();
    } finally { setBusy(false); }
  };
  const nhacTatCa = async () => {
    if (busy || !nhacDuoc.length) return;
    setBusy(true);
    try {
      const r = await api.post<{ ok: { id: number; daNhacLuc: string }[]; loi: { id: number; loi: string; ma: number }[] }>(
        '/yeu-cau/nhac-nhieu', { ids: nhacDuoc.slice(0, TRAN_HANG_LOAT).map((x) => x.id) });
      setDaNhacNgoai((s) => ({ ...s, ...Object.fromEntries(r.ok.map((x) => [x.id, x.daNhacLuc])) }));
      setNhacLoi((s) => new Set([...s, ...r.loi.filter((l) => l.ma !== 503).map((l) => l.id)]));
      baoKetQua('nhac', r.ok.length, r.loi);
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã nhắc.');
      xong();
    } finally { setBusy(false); }
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const dem = data?.dem;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        {xem !== 'de-biet' && (
          <BoLocDoan ariaLabel="Loại yêu cầu" value={phan} onChange={(k) => setParam('phan', k === 'tat-ca' ? null : k)}
            muc={[{ key: 'tat-ca' as KhoaChip, nhan: 'Tất cả', so: dem?.['tat-ca'] ?? null },
              ...PHAN_LOAI_CAN_QUYET.map((k) => ({ key: k as KhoaChip, nhan: PHAN_LOAI_LABEL[k], so: dem?.[k] ?? null }))]} />
        )}
        <BoLocDoan ariaLabel="Trạng thái" value={xem} onChange={(k) => {
          const next = new URLSearchParams(params);
          if (k === 'cho') next.delete('xem'); else next.set('xem', k);
          if (k === 'de-biet') next.delete('phan');
          next.delete('the');
          setParams(next, { replace: true });
        }}
          muc={[{ key: 'cho', nhan: 'Chờ duyệt', so: xem === 'da-xu-ly' ? null : dem?.['tat-ca'] ?? null },
            { key: 'de-biet', nhan: 'Nhắc việc', so: xem === 'da-xu-ly' ? null : data?.demBiet ?? null },
            { key: 'da-xu-ly', nhan: 'Đã xử lý (30 ngày)' }]} />
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
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
      {xem === 'de-biet' && nhacDuoc.length > 0 && (
        <div><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={nhacTatCa}>
          {busy ? 'Đang nhắc…' : nhacDuoc.length > TRAN_HANG_LOAT ? `Nhắc ${TRAN_HANG_LOAT} thẻ đầu` : `Nhắc tất cả (${nhacDuoc.length})`}
        </button></div>
      )}

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
      {loading && <Card><Skeleton rows={6} /></Card>}
      {data && ds.length === 0 && (
        <Card><Empty title={xem === 'cho' ? 'Không có yêu cầu nào đang chờ' : xem === 'de-biet' ? 'Không có việc cần nhắc'
          : 'Chưa có yêu cầu nào được xử lý trong 30 ngày'} /></Card>
      )}
      {ds.length > 0 && (
        <div className="space-y-2">
          {ds.map((y) => (
            <TheYeuCau key={y.id} yc={y} nhanManh={nhan === y.id} onXong={xong} onThemPa={setNgan} daNhacNgoai={daNhacNgoai[y.id]}
              chon={choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
                checked: chon.has(y.id),
                onChange: (v) => setChon((s) => chonMot(ds, s, y.id, v)),
              } : null} />
          ))}
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
                onClick={() => setChon(chonHet(ds, loaiChon))}>Chọn hết {nHet}</button>
            )}
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setChon(new Set())} disabled={busy}>Bỏ chọn</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={duyetNhieu} disabled={busy}>
              {busy ? 'Đang duyệt…' : `Duyệt ${chon.size} yêu cầu`}
            </button>
          </div>
        </div>
      )}

      {ngan && <NganCase caseId={ngan} viec="them-pa" onClose={() => setNgan(null)} onChanged={xong} />}
    </div>
  );
}
