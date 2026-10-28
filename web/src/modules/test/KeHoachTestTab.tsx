import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ChuGiaiGon } from './keHoach/ChipKyNang.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NganXepHangLoat } from './keHoach/NganXepHangLoat.tsx';
import { NganXepLichMt } from './keHoach/NganXepLichMt.tsx';
import { LopKeHoach } from './keHoach/LopKeHoach.tsx';
import { boMonLich, chuanHoaMaLop, kyHieuLop, tenMon, tenMonNgan, tuanLich } from '@shared/domain/index.ts';
import type { Data as LichSapToiData } from '../worklist/Highlights.tsx';
import { TimKeHoach, type KetQuaTim } from './keHoach/TimKeHoach.tsx';
import { NganXuatKeHoach } from './keHoach/NganXuatKeHoach.tsx';
import { NganXuatDiem } from './keHoach/NganXuatDiem.tsx';
import type { DanhSachLop } from './keHoach/kieu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TEST › KẾ HOẠCH TEST (mockup 14, PR-UX2) — Quản lý xếp; GV xem lớp mình dạy (chỉ xem, chủ SP 28/10). Một hàng điều khiển: Chi nhánh · ô tìm lớp · tab nhỏ
 * `Fast Track · Lớp thường` · ⓘ luật · nút `Xếp nhiều MT…` / `Xếp lịch Test…` (PR-XLMT: ngăn `NganXepLichMt` nhiều lớp · `NganXepHangLoat` một lớp thường); dưới là danh sách lớp (`LopKeHoach`), mỗi lớp một hàng
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
  /* OV-15c (C18): em vừa chọn ở ô tìm — lưới lớp đó cuộn tới hàng em và đánh dấu hàng. */
  const hvParam = params.get('hv') ? Number(params.get('hv')) : null;
  const [xuat, setXuat] = useState<'ke-hoach' | 'diem' | null>(null);

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

  /* OV-6a: `?tuan=` (Tổng quan › Lịch sắp tới › Xem toàn bộ lịch) — chỉ lớp có đợt Test trong tuần đó; cùng `/highlights`. */
  const tuan = params.get('tuan');
  const hl = useApi<LichSapToiData>(tuan ? `/highlights?${branchId ? `branchId=${branchId}&` : ''}ct=${loai}` : null, [tuan, branchId, loai]);

  /* Mặc định THU GỌN mọi lớp; chỉ tự mở `?classId=` hoặc khung chỉ có một lớp. */
  useEffect(() => {
    if (!data || daMoSan || !data.lop.length) return;
    const theoUrl = classIdParam ? data.lop.find((l) => l.id === classIdParam) : undefined;
    const trongLoai = loai === 'ft' ? lopFT : lopThuong;
    const chon = theoUrl ?? (trongLoai.length === 1 ? trongLoai[0] : undefined);
    if (chon) setMoList([chon.id]);
    setDaMoSan(true);
  }, [data, daMoSan]);   // eslint-disable-line react-hooks/exhaustive-deps

  const setLoai = (k: 'ft' | 'thuong') => {
    setChu('');      // chữ tìm của loại lớp này không có nghĩa với loại kia
    const next = new URLSearchParams(params);
    next.set('loai', k); next.delete('classId');
    setParams(next, { replace: true });
    const trongLoai = k === 'ft' ? lopFT : lopThuong;
    if (trongLoai.length === 1 && !moList.includes(trongLoai[0].id)) {
      setMoList((m) => [...m, trongLoai[0].id]);
    }
  };

  /* Luật khung Lớp thường nói theo môn của chương trình các lớp đang có (MH2) — không viết cứng L R W S, không W1/W2. */
  const monTheoCt = useMemo(() => [...new Set(lopThuong.map((l) => l.chuongTrinh).filter((c): c is string => !!c))].sort()
    .map((ct) => [kyHieuLop(ct, null) ?? ct, boMonLich(ct).map((k) => {
      const ngan = tenMonNgan(ct, k), dai = tenMon(ct, k);
      return ngan === dai ? ngan : `${ngan} (${dai})`;
    }).join(', ')] as const), [lopThuong]);
  const tuanXem = tuan ? hl.data?.weeks.find((w) => w.weekStart === tuan) ?? null : null;
  const lopTrongTuan = tuanXem ? new Set<number | null>(loai === 'ft'
    ? tuanXem.ft.mockClasses.map((m) => m.id)
    : [...tuanXem.normal.progressClasses, ...tuanXem.normal.finalClasses].map((r) => r.id)) : null;
  const boTuan = () => { const next = new URLSearchParams(params); next.delete('tuan'); setParams(next, { replace: true }); };
  /* Chủ SP 28/10: GV chỉ xem lớp mình dạy — không có lớp xếp được thì bỏ Cần xếp lại, Xuất, Xếp (máy chủ vẫn chặn ghi). */
  const coXep = (data?.lop ?? []).some((l) => !l.chiXem);
  const soCanXepLai = coXep ? lopFT.reduce((n, l) => n + (l.canXepLai ?? 0), 0) : 0;
  const locXepLai = loai === 'ft' && chiXepLai && soCanXepLai > 0;
  /* Chữ ở ô tìm lọc danh sách lớp chỉ khi khớp mã lớp nào đó — gõ tên / email học viên thì danh sách giữ nguyên (chọn em ở gợi ý). */
  const khopMa = chu.trim() ? (loai === 'ft' ? lopFT : lopThuong).filter((l) => chuanHoaMaLop(l.code).includes(chuanHoaMaLop(chu))) : [];
  const danhSach = (loai === 'ft' ? lopFT : lopThuong)
    .filter((l) => !khopMa.length || khopMa.includes(l))
    .filter((l) => !locXepLai || l.canXepLai > 0)
    .filter((l) => !lopTrongTuan || lopTrongTuan.has(l.id));
  const toggle = (id: number) => setMoList((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  /* C18: chọn lớp → mở lớp đó (lớp khung kia thì tự đổi khung, không hỏi); chọn em → mở lớp của em, cuộn tới hàng em. */
  const moLop = (id: number, loaiLop: 'ft' | 'thuong', hv: number | null) => {
    setMoList((m) => [...m.filter((x) => x !== id), id]);
    const next = new URLSearchParams(params);
    next.set('loai', loaiLop); next.set('classId', String(id));
    if (hv) next.set('hv', String(hv)); else next.delete('hv');
    next.delete('tuan'); setChiXepLai(false);
    setParams(next, { replace: true });
  };
  const chonLop = (l: KetQuaTim['lop'][number]) => { setChu(l.code); moLop(l.id, l.loai, null); };
  const chonHv = (h: KetQuaTim['hocVien'][number]) => { setChu(h.ten); moLop(h.classId, h.loai, h.studentId); };

  const lopChon = [...moList].reverse().map((id) => data?.lop.find((l) => l.id === id)).find((l) => l && l.loai === loai) ?? null;
  const lyDoTat = hopMo ? 'Đóng hộp kỹ năng trước' : undefined;

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data || (tuan && hl.loading && !hl.data)) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) return <div className="card"><Empty title="Bạn không có lớp nào để xem lịch Test" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2" data-hd="kht-loc">
        {/* MH4: công tắc khung đứng ĐẦU hàng lọc (chỉ hiện khi có cả hai khung). */}
        <CongTacKhung trang="ke-hoach-test" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }} donVi="lớp"
          onChange={(k) => { if (k !== 'tat-ca') setLoai(k); }} />
        {tuanXem && (
          <span className="pb-1">
            <NutChon nho chon onClick={boTuan} title="Bỏ lọc tuần — xem mọi lớp">
              Tuần <span className="tabular-nums">{tuanLich(tuanXem.weekStart)}</span> · <span className="tabular-nums">{lopTrongTuan!.size}</span> lớp
            </NutChon>
          </span>
        )}
        {loai === 'ft' && soCanXepLai > 0 && (
          <span className="pb-1">
            <NutChon nho chon={locXepLai} onClick={() => {
              const bat = !locXepLai;
              setChiXepLai(bat);
              if (bat) setMoList(lopFT.filter((l) => l.canXepLai > 0).map((l) => l.id));
            }} title="Học viên có kỹ năng vắng hoặc đã huỷ — Quản lý cần xếp lại">
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
        <TimKeHoach branchId={branchId} value={chu} onChange={setChu} onChonLop={chonLop} onChonHv={chonHv} className="min-w-0 basis-full sm:basis-auto sm:w-72" />
        <span className="pb-2">
          <NutLuat label="Luật xếp lịch Test">
            {loai === 'ft' ? (
              <span className="block">
                Mỗi đợt xếp riêng <b>L</b> (Listening), <b>R</b> (Reading), <b>W</b> (Writing), <b>S</b> (Speaking). <b>W = chấm cả
                W1 và W2</b> — một lịch W đặt cho cả hai. Kỹ năng khác tuần trong cùng đợt ghi riêng (<b>S riêng · W3 DEC</b>).
              </span>
            ) : (
              <span className="block">
                Mỗi đợt (Progress Test, Final Test) xếp riêng từng môn của chương trình lớp
                {monTheoCt.length ? ': ' : '.'}
                {monTheoCt.map(([ct, mon], i) => (
                  <span key={ct}>{i ? ' · ' : ''}<b>{ct}</b> {mon}</span>
                ))}
                {monTheoCt.length ? '.' : ''} Môn khác tuần trong cùng đợt ghi riêng.
              </span>
            )}
            {/* KHT-GON (mockup #659): chú giải dựng bằng chính ô gọn. */}
            <ChuGiaiGon />
            {loai !== 'ft' && <span className="block">Lớp thường ghi thêm tuần trong khoá (<b>W5/10</b>).</span>}
            <span className="block">Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại để xác nhận.</span>
          </NutLuat>
        </span>
        <span className="flex-1" />
        {loai === 'ft' && coXep && (
          /* OV-15c: Xuất Excel Kế hoạch Test 13 cột (C17) theo bộ lọc đang xem + Xuất điểm Test (mockup 6 khung 9). */
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs tabular-nums text-slate-400">{t('{n} học viên', { n: danhSach.reduce((n, l) => n + l.soHv, 0) })}</span>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!!lyDoTat || !danhSach.length} title={lyDoTat} onClick={() => setXuat('ke-hoach')}>{t('Xuất Excel')}</button>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!!lyDoTat} title={lyDoTat} onClick={() => setXuat('diem')}>{t('Xuất điểm Test')}</button>
          </span>
        )}
        {coXep && (
          <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={!!lyDoTat} title={lyDoTat}
            onClick={() => setXep(loai)}>
            {loai === 'ft' ? 'Xếp nhiều MT…' : 'Xếp lịch Test…'}
          </button>
        )}
      </div>

      {danhSach.length === 0 ? (
        <div className="card"><Empty title={chu ? `Không có lớp nào khớp "${chu}"` : 'Không có lớp nào có đợt Test trong tuần này'} /></div>
      ) : (
        <div className="space-y-3">
          {danhSach.map((l) => (
            <LopKeHoach key={l.id} lop={l} mo={moList.includes(l.id)} onToggle={() => toggle(l.id)} onHienDien={setHopMo} chiCanXepLai={locXepLai}
              hvChon={l.id === classIdParam ? hvParam : null} />
          ))}
        </div>
      )}

      {xep === 'ft' && (
        <NganXepLichMt chiNhanhDau={branchId} lopDs={data.lop} lopMoSan={lopChon?.loai === 'ft' ? lopChon.id : null} coThuong={lopThuong.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
      {xuat === 'ke-hoach' && (
        <NganXuatKeHoach branchId={branchId} classIds={danhSach.length === lopFT.length ? [] : danhSach.map((l) => l.id)} chiXepLai={locXepLai} onDong={() => setXuat(null)} />
      )}
      {xuat === 'diem' && (
        <NganXuatDiem branchId={branchId} lopFt={lopFT} lopDau={lopChon?.loai === 'ft' ? lopChon.id : null} onDong={() => setXuat(null)} />
      )}
      {xep === 'thuong' && (
        <NganXepHangLoat lopThuong={lopThuong} classIdBanDau={lopChon?.loai === 'thuong' ? lopChon.id : null} coFt={lopFT.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
    </div>
  );
}
