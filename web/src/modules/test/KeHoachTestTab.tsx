import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { LuoiFT, type LuoiFTData } from './keHoach/LuoiFT.tsx';
import { NganXepHangLoat } from './keHoach/NganXepHangLoat.tsx';
import { BangThuong, type LopThuong } from './keHoach/BangThuong.tsx';

type DanhSachLop = {
  tieuDe: string;
  lop: Array<{ id: number; code: string; loai: 'ft' | 'thuong'; soHv: number; chuaCoLichTiep: number }>;
};

/**
 * TEST › KẾ HOẠCH TEST (spec §3.5, mockup 05b + 10b §4) — CHỈ Quản lý. Lớp Fast Track: lưới cả lớp
 * (`LuoiFT`) + xếp lịch hàng loạt (`NganXepHangLoat`). Lớp thường: bảng theo lớp (`BangThuong`), đổi lịch
 * qua `HopDoiLichThuong` (mở từ chính bảng).
 */
export function KeHoachTestTab() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const loaiParam = params.get('loai') as 'ft' | 'thuong' | null;
  const classIdParam = params.get('classId') ? Number(params.get('classId')) : null;
  const [hangLoatOpen, setHangLoatOpen] = useState(false);

  const { data, loading, error, reload } = useApi<DanhSachLop>(
    `/ke-hoach-test/lop${branchId ? `?branchId=${branchId}` : ''}`,
  );

  const lopFT = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'ft'), [data]);
  const lopThuong = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'thuong'), [data]);
  const coCaHai = lopFT.length > 0 && lopThuong.length > 0;
  const loai: 'ft' | 'thuong' = coCaHai ? (loaiParam === 'thuong' ? 'thuong' : 'ft') : (lopFT.length ? 'ft' : 'thuong');

  const classId = classIdParam ?? (loai === 'ft'
    ? (lopFT.find((l) => l.chuaCoLichTiep > 0)?.id ?? lopFT[0]?.id ?? null)
    : null);

  const setLoai = (k: 'ft' | 'thuong') => {
    const next = new URLSearchParams(params);
    next.set('loai', k); next.delete('classId');
    setParams(next, { replace: true });
  };
  const setClassId = (id: number) => {
    const next = new URLSearchParams(params);
    next.set('classId', String(id));
    setParams(next, { replace: true });
  };

  const ftSheet = useApi<LuoiFTData>(loai === 'ft' && classId ? `/ke-hoach-test/ft/${classId}` : null);
  const thuongData = useApi<{ lop: LopThuong[] }>(loai === 'thuong' ? `/ke-hoach-test/thuong${branchId ? `?branchId=${branchId}` : ''}` : null);

  const lopHienTai = lopFT.find((l) => l.id === classId);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) {
    return <div className="card"><Empty title="Bạn không có lớp nào được xếp lịch Test" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-slate-100 m-0">{data.tieuDe}</h2>
        <NutLuat label="Luật xếp lịch Test">
          <span className="block">
            Mỗi đợt MT có hai nhóm: <b>RLW</b> (Listening, Reading, Writing — cùng tuần) và <b>S</b> (Speaking — có
            thể khác tuần). Lịch mặc định MT1 ở tuần học thứ 6, MT2 thứ 12, MT3 thứ 16.
          </span>
          <span className="block">
            Xanh lá = đã thi xong (chỉ xem). Xanh dương = đã xếp. Vàng = đã dời vì vắng. Nét đứt = chưa xếp.
          </span>
          <span className="block">
            Hai đợt trùng tuần thì máy CHẶN, không xếp được. Cách đúng một tuần thì máy hỏi lại để xác nhận.
          </span>
        </NutLuat>
      </div>

      {coCaHai && (
        <HangTab ariaLabel="Loại lớp" cap="con" value={loai} onChange={setLoai}
          tabs={[{ key: 'ft', label: 'Fast Track' }, { key: 'thuong', label: 'Lớp thường' }]} />
      )}

      {loai === 'ft' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="block">
              <span className="label">Lớp</span>
              <select className="field w-48" value={classId ?? ''} onChange={(e) => setClassId(Number(e.target.value))}>
                {lopFT.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
              </select>
            </label>
            {lopHienTai && <span className="text-xs text-slate-400">{lopHienTai.soHv} học viên</span>}
            <div className="flex-1" />
            {classId && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setHangLoatOpen(true)}>
                Xếp lịch hàng loạt…
              </button>
            )}
          </div>

          <Card bodyClass="p-3">
            {ftSheet.error ? (
              <ErrorState message={ftSheet.error.message} hint={ftSheet.error.hint} onRetry={ftSheet.reload} />
            ) : ftSheet.loading || !ftSheet.data ? (
              <Skeleton rows={6} />
            ) : (
              <LuoiFT data={ftSheet.data} onReload={ftSheet.reload} />
            )}
          </Card>

          {hangLoatOpen && classId && lopHienTai && (
            <NganXepHangLoat classId={classId} classCode={lopHienTai.code} luoi={ftSheet.data}
              onClose={() => setHangLoatOpen(false)}
              onDone={() => { ftSheet.reload(); reload(); }} />
          )}
        </>
      ) : (
        <Card bodyClass="p-3">
          {thuongData.error ? (
            <ErrorState message={thuongData.error.message} hint={thuongData.error.hint} onRetry={thuongData.reload} />
          ) : thuongData.loading || !thuongData.data ? (
            <Skeleton rows={6} />
          ) : (
            <BangThuong lop={thuongData.data.lop} onReload={thuongData.reload} />
          )}
        </Card>
      )}
    </div>
  );
}
