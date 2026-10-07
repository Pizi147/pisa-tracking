import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NganXepHangLoat } from './keHoach/NganXepHangLoat.tsx';
import { NganXepLichMt } from './keHoach/NganXepLichMt.tsx';
import { LopKeHoach } from './keHoach/LopKeHoach.tsx';
import { boMonLich, chuanHoaMaLop, kyHieuLop, tenMon, tenMonNgan } from '@shared/domain/index.ts';
import { TimLop } from './keHoach/TimLop.tsx';
import type { DanhSachLop, LopKH } from './keHoach/kieu.ts';

/**
 * TEST › KẾ HOẠCH TEST (mockup 14, PR-UX2) — CHỈ Quản lý. Một hàng điều khiển: Chi nhánh · ô tìm lớp · tab nhỏ
 * `Fast Track · Lớp thường` · ⓘ luật · nút `Xếp lịch MT…` / `Xếp lịch Test…` (PR-XLMT: ngăn `NganXepLichMt` nhiều lớp · `NganXepHangLoat` một lớp thường); dưới là danh sách lớp (`LopKeHoach`), mỗi lớp một hàng
 * lớn mở ra lưới học viên × đợt — lớp thường làm y như Fast Track. Hộp kỹ năng (neo cạnh chip) và ngăn hàng loạt không
 * bao giờ mở chồng nhau (G-8): hộp mở thì nút hàng loạt tắt.
 */
export function KeHoachTestTab() {
  const [params, setParams] = useSearchParams();
  const { branchCount } = useSession();
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const loaiParam = params.get('loai') as 'ft' | 'thuong' | null;
  const classIdParam = params.get('classId') ? Number(params.get('classId')) : null;

  const { data, loading, error, reload } = useApi<DanhSachLop>(`/ke-hoach-test/lop${branchId ? `?branchId=${branchId}` : ''}`);
  const [chu, setChu] = useState('');
  const [moList, setMoList] = useState<number[]>([]);
  const [daMoSan, setDaMoSan] = useState(false);
  const [hopMo, setHopMo] = useState(false);
  /* PR-XLMT (M9): ngăn Xếp lịch — khung FT (nhiều lớp) hoặc Lớp thường (một lớp); không cần mở lớp trước. */
  const [xep, setXep] = useState<'ft' | 'thuong' | null>(null);
  /* PR-XLMT (K4-11, Q7): chip "Cần xếp lại (n)" — chỉ còn lớp / học viên có kỹ năng vắng hoặc phần thi đã huỷ. */
  const [chiXepLai, setChiXepLai] = useState(false);

  const lopFT = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'ft'), [data]);
  const lopThuong = useMemo(() => (data?.lop ?? []).filter((l) => l.loai === 'thuong'), [data]);
  const coCaHai = lopFT.length > 0 && lopThuong.length > 0;
  const loaiTheoLop = classIdParam ? data?.lop.find((l) => l.id === classIdParam)?.loai : undefined;
  /* Q8: `loai` trên đường dẫn thắng, rồi lớp đang mở, rồi lựa chọn đã nhớ trên máy, rồi Fast Track. */
  const daNho = khungDaNho('ke-hoach-test');
  const loai: 'ft' | 'thuong' = coCaHai
    ? (loaiParam === 'thuong' || loaiParam === 'ft' ? loaiParam
      : loaiTheoLop ?? (daNho === 'ft' || daNho === 'thuong' ? daNho : 'ft'))
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
    setChu('');      // chữ tìm của loại lớp này không có nghĩa với loại kia
    const next = new URLSearchParams(params);
    next.set('loai', k); next.delete('classId');
    setParams(next, { replace: true });
    const trongLoai = k === 'ft' ? lopFT : lopThuong;
    if (!trongLoai.some((l) => moList.includes(l.id)) && trongLoai.length) {
      setMoList((m) => [...m, (trongLoai.find(viecCua) ?? trongLoai[0]).id]);
    }
  };

  /* Luật khung Lớp thường nói theo môn của chương trình các lớp đang có (MH2) — không viết cứng L R W S, không W1/W2. */
  const monTheoCt = useMemo(() => [...new Set(lopThuong.map((l) => l.chuongTrinh).filter((c): c is string => !!c))].sort()
    .map((ct) => [kyHieuLop(ct, null) ?? ct, boMonLich(ct).map((k) => {
      const ngan = tenMonNgan(ct, k), dai = tenMon(ct, k);
      return ngan === dai ? ngan : `${ngan} (${dai})`;
    }).join(', ')] as const), [lopThuong]);
  const soCanXepLai = lopFT.reduce((n, l) => n + (l.canXepLai ?? 0), 0);
  const locXepLai = loai === 'ft' && chiXepLai && soCanXepLai > 0;
  const danhSach = (loai === 'ft' ? lopFT : lopThuong)
    .filter((l) => !chu.trim() || chuanHoaMaLop(l.code).includes(chuanHoaMaLop(chu)))
    .filter((l) => !locXepLai || l.canXepLai > 0);
  const toggle = (id: number) => setMoList((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const chonLop = (l: LopKH) => {
    setChu(l.code);
    setMoList((m) => [...m.filter((x) => x !== l.id), l.id]);
    const next = new URLSearchParams(params);
    next.set('loai', l.loai); next.set('classId', String(l.id));
    setParams(next, { replace: true });
  };

  const lopChon = [...moList].reverse().map((id) => data?.lop.find((l) => l.id === id)).find((l) => l && l.loai === loai) ?? null;
  const lyDoTat = hopMo ? 'Đóng hộp kỹ năng trước' : undefined;

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) return <div className="card"><Empty title="Bạn không có lớp nào được xếp lịch Test" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        {/* MH4: công tắc khung đứng ĐẦU hàng lọc (chỉ hiện khi có cả hai khung). */}
        <CongTacKhung trang="ke-hoach-test" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }} donVi="lớp"
          onChange={(k) => { if (k !== 'tat-ca') setLoai(k); }} />
        {loai === 'ft' && soCanXepLai > 0 && (
          <span className="pb-1">
            <NutChon nho chon={locXepLai} onClick={() => {
              const bat = !locXepLai;
              setChiXepLai(bat);
              if (bat) setMoList(lopFT.filter((l) => l.canXepLai > 0).map((l) => l.id));
            }} title="Học viên có kỹ năng vắng hoặc phần thi đã huỷ — Quản lý cần xếp lại">
              Cần xếp lại <span className="tabular-nums">({soCanXepLai})</span>
            </NutChon>
          </span>
        )}
        {branchCount > 1 && (
          <>
            <div className="hidden sm:block"><BranchFilter branchId={branchId} onBranch={(id) => {
              const next = new URLSearchParams(params);
              next.delete('branchId'); if (id) next.set('cn', String(id)); else next.delete('cn');
              next.delete('classId');
              setParams(next, { replace: true });
            }} /></div>
            <details className="sm:hidden">
              <summary className="btn btn-sm cursor-pointer list-none">Lọc ▾</summary>
              <div className="mt-2"><BranchFilter branchId={branchId} onBranch={(id) => {
                const next = new URLSearchParams(params);
                next.delete('branchId'); if (id) next.set('cn', String(id)); else next.delete('cn');
                next.delete('classId');
                setParams(next, { replace: true });
              }} /></div>
            </details>
          </>
        )}
        <TimLop lop={data.lop} value={chu} onChange={setChu} onChon={chonLop} className="min-w-0 basis-full sm:basis-auto sm:w-56" />
        <span className="pb-2">
          <NutLuat label="Luật xếp lịch Test">
            {loai === 'ft' ? (
              <span className="block">
                Mỗi đợt xếp riêng <b>L</b> (Listening), <b>R</b> (Reading), <b>W</b> (Writing), <b>S</b> (Speaking). <b>W = chấm cả
                W1 và W2</b> — một lịch W đặt cho cả hai. Kỹ năng cùng tuần thì gộp một chip (<b>L R W S · W3 SEP</b>), khác tuần
                thì tách dòng.
              </span>
            ) : (
              <span className="block">
                Mỗi đợt (Progress Test, Final Test) xếp riêng từng môn của chương trình lớp
                {monTheoCt.length ? ': ' : '.'}
                {monTheoCt.map(([ct, mon], i) => (
                  <span key={ct}>{i ? ' · ' : ''}<b>{ct}</b> {mon}</span>
                ))}
                {monTheoCt.length ? '.' : ''} Môn cùng tuần thì gộp một chip, khác tuần thì tách dòng.
              </span>
            )}
            <span className="block">
              Xám = đã thi xong · xanh dương = đã xếp · vàng = đã dời vì vắng · nét đứt = chưa xếp. Lớp thường ghi thêm tuần
              trong khoá (<b>W5/10</b>).
            </span>
            <span className="block">
              Cam = vắng, Quản lý xếp lại · tím = chờ Quản lý duyệt dời · viền đỏ = trễ (tuần thi đã hết, chưa có điểm) · gạch ngang =
              đã huỷ phần thi. Dấu nửa tròn trước chip = đợt dở, còn kỹ năng phải thi.
            </span>
            <span className="block">Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại để xác nhận.</span>
          </NutLuat>
        </span>
        <span className="flex-1" />
        <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={!!lyDoTat} title={lyDoTat}
          onClick={() => setXep(loai)}>
          {loai === 'ft' ? 'Xếp lịch MT…' : 'Xếp lịch Test…'}
        </button>
      </div>

      {danhSach.length === 0 ? (
        <div className="card"><Empty title={`Không có lớp nào khớp "${chu}"`} /></div>
      ) : (
        <div className="space-y-3">
          {danhSach.map((l) => (
            <LopKeHoach key={l.id} lop={l} mo={moList.includes(l.id)} onToggle={() => toggle(l.id)} onHienDien={setHopMo} chiCanXepLai={locXepLai} />
          ))}
        </div>
      )}

      {xep === 'ft' && (
        <NganXepLichMt chiNhanhDau={branchId} lopDs={data.lop} lopMoSan={lopChon?.loai === 'ft' ? lopChon.id : null} coThuong={lopThuong.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
      {xep === 'thuong' && (
        <NganXepHangLoat lopThuong={lopThuong} classIdBanDau={lopChon?.loai === 'thuong' ? lopChon.id : null} coFt={lopFT.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
    </div>
  );
}
