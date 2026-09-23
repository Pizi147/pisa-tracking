import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { NganXepHangLoat } from './keHoach/NganXepHangLoat.tsx';
import { LopKeHoach } from './keHoach/LopKeHoach.tsx';
import { TimLop, chuanHoaMa } from './keHoach/TimLop.tsx';
import type { DanhSachLop, LopKH } from './keHoach/kieu.ts';

/**
 * TEST › KẾ HOẠCH TEST (mockup 14, PR-UX2) — CHỈ Quản lý. Một hàng điều khiển: Chi nhánh · ô tìm lớp · tab nhỏ
 * `Fast Track · Lớp thường` · ⓘ luật · nút `Xếp lịch hàng loạt…`; dưới là danh sách lớp (`LopKeHoach`), mỗi lớp một hàng
 * lớn mở ra lưới học viên × đợt — lớp thường làm y như Fast Track. Hộp kỹ năng (neo cạnh chip) và ngăn hàng loạt không
 * bao giờ mở chồng nhau (G-8): hộp mở thì nút hàng loạt tắt.
 */
export function KeHoachTestTab() {
  const [params, setParams] = useSearchParams();
  const { branchCount } = useSession();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const loaiParam = params.get('loai') as 'ft' | 'thuong' | null;
  const classIdParam = params.get('classId') ? Number(params.get('classId')) : null;

  const { data, loading, error, reload } = useApi<DanhSachLop>(`/ke-hoach-test/lop${branchId ? `?branchId=${branchId}` : ''}`);
  const [chu, setChu] = useState('');
  const [moList, setMoList] = useState<number[]>([]);
  const [daMoSan, setDaMoSan] = useState(false);
  const [hopMo, setHopMo] = useState(false);
  const [hangLoat, setHangLoat] = useState<{ loai: 'ft' | 'thuong'; classId: number; code: string } | null>(null);

  const lopFT = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'ft'), [data]);
  const lopThuong = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'thuong'), [data]);
  const coCaHai = lopFT.length > 0 && lopThuong.length > 0;
  const loaiTheoLop = classIdParam ? data?.lop.find((l) => l.id === classIdParam)?.loai : undefined;
  const loai: 'ft' | 'thuong' = coCaHai
    ? (loaiParam === 'thuong' || loaiParam === 'ft' ? loaiParam : (loaiTheoLop ?? 'ft'))
    : (lopFT.length ? 'ft' : 'thuong');

  /* Q9: mở sẵn `?classId=` nếu có; không thì lớp đầu tiên có việc (FT chưa có lịch tiếp · thường có em chưa có bài). */
  const viecCua = (l: LopKH) => (l.loai === 'ft' ? l.chuaCoLichTiep > 0 : l.hvChuaCoLich > 0);
  useEffect(() => {
    if (!data || daMoSan || !data.lop.length) return;
    const theoUrl = classIdParam ? data.lop.find((l) => l.id === classIdParam) : undefined;
    const trongLoai = loai === 'ft' ? lopFT : lopThuong;
    const chon = theoUrl ?? trongLoai.find(viecCua) ?? trongLoai[0];
    if (chon) setMoList([chon.id]);
    setDaMoSan(true);
  }, [data, daMoSan]);   // eslint-disable-line react-hooks/exhaustive-deps

  const setLoai = (k: 'ft' | 'thuong') => {
    const next = new URLSearchParams(params);
    next.set('loai', k); next.delete('classId');
    setParams(next, { replace: true });
    const trongLoai = k === 'ft' ? lopFT : lopThuong;
    if (!trongLoai.some((l) => moList.includes(l.id)) && trongLoai.length) {
      setMoList((m) => [...m, (trongLoai.find(viecCua) ?? trongLoai[0]).id]);
    }
  };

  const danhSach = (loai === 'ft' ? lopFT : lopThuong).filter((l) => !chu.trim() || chuanHoaMa(l.code).includes(chuanHoaMa(chu)));
  const toggle = (id: number) => setMoList((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const chonLop = (l: LopKH) => {
    setChu(l.code);
    setMoList((m) => [...m.filter((x) => x !== l.id), l.id]);
    const next = new URLSearchParams(params);
    next.set('loai', l.loai); next.set('classId', String(l.id));
    setParams(next, { replace: true });
  };

  const lopChon = [...moList].reverse().map((id) => data?.lop.find((l) => l.id === id)).find((l) => l && l.loai === loai) ?? null;
  const lyDoTat = hopMo ? 'Đóng hộp kỹ năng trước' : !lopChon ? 'Mở một lớp trước' : undefined;

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) return <div className="card"><Empty title="Bạn không có lớp nào được xếp lịch Test" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        {branchCount > 1 && (
          <>
            <div className="hidden sm:block"><BranchFilter branchId={branchId} onBranch={(id) => {
              const next = new URLSearchParams(params);
              if (id) next.set('branchId', String(id)); else next.delete('branchId');
              next.delete('classId');
              setParams(next, { replace: true });
            }} /></div>
            <details className="sm:hidden">
              <summary className="btn btn-sm cursor-pointer list-none">Lọc ▾</summary>
              <div className="mt-2"><BranchFilter branchId={branchId} onBranch={(id) => {
                const next = new URLSearchParams(params);
                if (id) next.set('branchId', String(id)); else next.delete('branchId');
                next.delete('classId');
                setParams(next, { replace: true });
              }} /></div>
            </details>
          </>
        )}
        <TimLop lop={data.lop} value={chu} onChange={setChu} onChon={chonLop} className="min-w-[10rem] flex-1 sm:w-56 sm:flex-none" />
        {coCaHai && (
          <HangTab ariaLabel="Loại lớp" cap="con" value={loai} onChange={setLoai}
            tabs={[{ key: 'ft', label: 'Fast Track' }, { key: 'thuong', label: 'Lớp thường' }]} />
        )}
        <span className="pb-2">
          <NutLuat label="Luật xếp lịch Test">
            <span className="block">
              Mỗi đợt xếp riêng <b>L</b> (Listening), <b>R</b> (Reading), <b>W</b> (Writing), <b>S</b> (Speaking). <b>W = chấm cả
              W1 và W2</b> — một lịch W đặt cho cả hai. Kỹ năng cùng tuần thì gộp một chip (<b>L R W S · W3 SEP</b>), khác tuần
              thì tách dòng.
            </span>
            <span className="block">
              Xám = đã thi xong · xanh dương = đã xếp · vàng = đã dời vì vắng · nét đứt = chưa xếp. Lớp thường ghi thêm tuần
              trong khoá (<b>W5/10</b>).
            </span>
            <span className="block">Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại để xác nhận.</span>
          </NutLuat>
        </span>
        <span className="flex-1" />
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={!!lyDoTat} title={lyDoTat}
          onClick={() => lopChon && setHangLoat({ loai: lopChon.loai, classId: lopChon.id, code: lopChon.code })}>
          Xếp lịch hàng loạt…
        </button>
      </div>

      {danhSach.length === 0 ? (
        <div className="card"><Empty title={`Không có lớp nào khớp "${chu}"`} /></div>
      ) : (
        <div className="space-y-3">
          {danhSach.map((l) => (
            <LopKeHoach key={l.id} lop={l} mo={moList.includes(l.id)} onToggle={() => toggle(l.id)} onHienDien={setHopMo} />
          ))}
        </div>
      )}

      {hangLoat && (
        <NganXepHangLoat loai={hangLoat.loai} classId={hangLoat.classId} classCode={hangLoat.code}
          onClose={() => setHangLoat(null)} onDone={reload} />
      )}
    </div>
  );
}
