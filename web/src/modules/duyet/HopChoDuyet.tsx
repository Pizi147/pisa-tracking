import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { nhacTatCa } from '../../lib/nhacTatCa.ts';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { PHAN_LOAI, PHAN_LOAI_LABEL, laPhanLoai, type KhoaChip, type TheYeuCauDto } from '@shared/domain/index.ts';

type Hop = { the: TheYeuCauDto[]; dem: Record<KhoaChip, number>; homNay: string; lopDangLoc?: { id: number; code: string } | null };

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
 * CÔNG VIỆC › CHỜ DUYỆT (PR-DUYET, M8, Q27-3) — MỘT hộp cho mọi thứ "ai đó xin Quản lý quyết". Chip phân loại đủ 6 kể cả số 0 (Q12),
 * Đang chờ / Đã xử lý 30 ngày, chi nhánh. Thẻ quá hạn đứng đầu (máy chủ xếp). Duyệt nhiều (Q-B, 02/10): ở cả "Tất cả" lẫn từng phân loại,
 * chỉ các thẻ cùng MỘT loại cho phép hàng loạt (chọn khác loại thì bỏ lô cũ); "Chọn hết" lấy mọi thẻ cùng loại; thẻ lỗi báo riêng, thẻ khác vẫn xong.
 * Nhắc tất cả: thẻ Báo lên chưa nhắc hôm nay.
 */
export function HopChoDuyet() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const phan = laPhanLoai(params.get('phan')) ? (params.get('phan') as KhoaChip) : 'tat-ca';
  const xem = params.get('xem') === 'da-xu-ly' ? 'da-xu-ly' : 'cho';
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  /* PR-S4F #5: `?lop=` — từ badge "n chờ duyệt" của một lớp. */
  const lopId = Number(params.get('lop')) || null;
  /* PR-VAI-a (Q17): `?qua-han=1` — từ số "k quá hạn" của dải Chờ duyệt ở Tổng quan. */
  const quaHan = params.get('qua-han') === '1' && xem === 'cho';
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    next.delete('the');
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams({ hop: 'cho-duyet' });
  if (phan !== 'tat-ca') qs.set('phanLoai', phan);
  if (xem === 'da-xu-ly') qs.set('xem', xem);
  if (branchId) qs.set('branchId', String(branchId));
  if (lopId) qs.set('lop', String(lopId));
  if (quaHan) qs.set('quaHan', '1');
  const url = `/yeu-cau?${qs}`;
  const { data, loading, error, reload } = useApi<Hop>(url, [url]);
  const nhan = useTheNhanManh(data?.the);
  /* Mở từ chuông mà thẻ không còn trong danh sách đang xem (đã có người xử lý / tự đóng / khác chi nhánh đang lọc). */
  const theTuLink = Number(params.get('the')) || null;
  const theLac = !!data && !!theTuLink && !data.the.some((x) => x.id === theTuLink);

  /* Hàng loạt: một loại một lúc. */
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  useEffect(() => { setChon(new Set()); }, [url]);
  const ds = data?.the ?? [];
  const loaiChon = useMemo(() => ds.find((x) => chon.has(x.id))?.loai ?? null, [ds, chon]);
  const choHangLoat = xem === 'cho';
  const [ngan, setNgan] = useState<number | null>(null);

  const xong = () => { reload(); invalidate('/yeu-cau/dem'); };
  /* Chọn hết: mọi thẻ duyệt hàng loạt được CÙNG loại với lô đang chọn (chưa chọn gì → loại của thẻ đầu), tối đa 50 như máy chủ. */
  const duyetDuoc = ds.filter((x) => x.hangLoat && x.trangThai === 'cho');
  const loaiHet = loaiChon ?? duyetDuoc[0]?.loai ?? null;
  const cungLoai = duyetDuoc.filter((x) => x.loai === loaiHet).slice(0, 50);
  /* Nhắc tất cả: thẻ Báo lên có người nhận, chưa nhắc hôm nay. */
  const canNhac = xem === 'cho' ? ds.filter((x) => x.trangThai === 'cho' && x.kieuNut === 'nhac' && typeof x.duLieu?.ownerId === 'number'
    && typeof x.duLieu?.viecKey === 'string' && !x.duLieu?.daNhacLuc) : [];
  const [nhacLo, setNhacLo] = useState(false);
  const bamNhacTatCa = async () => {
    if (nhacLo) return;
    setNhacLo(true);
    await nhacTatCa(canNhac.map((x) => ({ key: x.duLieu!.viecKey as string, ownerId: x.duLieu!.ownerId as number })), toast);
    setNhacLo(false);
    xong();
  };
  const duyetNhieu = async () => {
    if (busy || !chon.size) return;
    setBusy(true);
    try {
      const r = await api.post<{ ok: number[]; loi: { id: number; loi: string }[] }>('/yeu-cau/duyet-nhieu', { ids: [...chon] });
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases');
      if (r.ok.length) toast.push('ok', `Đã duyệt ${r.ok.length} yêu cầu`);
      for (const l of r.loi) toast.push('error', `${ds.find((x) => x.id === l.id)?.hocVien ?? `Yêu cầu #${l.id}`}: ${l.loi}`);
      setChon(new Set());
      xong();
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy thẻ nào đã xong.');
      xong();
    } finally { setBusy(false); }
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const dem = data?.dem;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <BoLocDoan ariaLabel="Loại yêu cầu" value={phan} onChange={(k) => setParam('phan', k === 'tat-ca' ? null : k)}
          muc={[{ key: 'tat-ca' as KhoaChip, nhan: 'Tất cả', so: dem?.['tat-ca'] ?? null },
            ...PHAN_LOAI.map((k) => ({ key: k as KhoaChip, nhan: PHAN_LOAI_LABEL[k], so: dem?.[k] ?? null }))]} />
        <BoLocDoan ariaLabel="Trạng thái" value={xem} onChange={(k) => setParam('xem', k === 'cho' ? null : k)}
          muc={[{ key: 'cho', nhan: 'Chờ duyệt' }, { key: 'da-xu-ly', nhan: 'Đã xử lý (30 ngày)' }]} />
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
      {xem === 'cho' && ds.length > 1 && <p className="m-0 text-[12px] text-slate-400">Xếp: quá hạn trước → hạn gần nhất</p>}
      {(cungLoai.length > 1 || canNhac.length > 1) && (
        <div className="flex flex-wrap items-center gap-2">
          {cungLoai.length > 1 && chon.size < cungLoai.length && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setChon(new Set(cungLoai.map((x) => x.id)))}
              title="Chọn mọi yêu cầu cùng loại để duyệt một lần">
              Chọn hết {cungLoai.length} · {cungLoai[0].nhanLoai}
            </button>
          )}
          {canNhac.length > 1 && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={nhacLo} onClick={bamNhacTatCa}
              title="Gửi nhắc cho người phụ trách của mọi thẻ Báo lên chưa nhắc hôm nay">
              {nhacLo ? 'Đang nhắc…' : `Nhắc tất cả (${canNhac.length})`}
            </button>
          )}
        </div>
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
        <Card><Empty title={xem === 'cho' ? 'Không có yêu cầu nào đang chờ' : 'Chưa có yêu cầu nào được xử lý trong 30 ngày'} /></Card>
      )}
      {ds.length > 0 && (
        <div className="space-y-2">
          {ds.map((y) => (
            <TheYeuCau key={y.id} yc={y} nhanManh={nhan === y.id} onXong={xong} onThemPa={setNgan}
              chon={choHangLoat && y.hangLoat && y.trangThai === 'cho' ? {
                checked: chon.has(y.id),
                onChange: (v) => setChon((s) => {
                  const next = new Set(loaiChon && loaiChon !== y.loai ? [] : s);
                  if (v) next.add(y.id); else next.delete(y.id);
                  return next;
                }),
              } : null} />
          ))}
        </div>
      )}

      {chon.size > 0 && (
        <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 shadow-lg"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <span className="text-sm tabular-nums text-slate-300">Đã chọn {chon.size}</span>
          <div className="flex gap-1.5">
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
