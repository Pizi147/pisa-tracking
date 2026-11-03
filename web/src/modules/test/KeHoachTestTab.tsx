import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Menu } from '../../ui/Menu.tsx';
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
  /* U05 (G5, N32 ⑤): chip "Chưa có MT kế tiếp · n" thay "Cần xếp lại" — vắng lần 1 tự dời (N4) và ô ghi "Vắng · xếp lại S" (vàng); chỉ lớp / em
     chưa có lượt MT kế tiếp. `lopLoc`: lớp chọn ở ô tìm (hoặc ô số của hàng lớp) → chip "Lớp: … ✕". */
  const [chiChuaCoKe, setChiChuaCoKe] = useState(false);
  const [lopLoc, setLopLoc] = useState<number | null>(null);
  const dienThoai = useDienThoai();
  /* Đầu trang (mockup U05): Xuất Excel · Xuất điểm Test · Xếp nhiều MT… cạnh tiêu đề "Test" — TestPage chừa chỗ `#test-nut-trang`. */
  const [choNut, setChoNut] = useState<HTMLElement | null>(null);
  useEffect(() => { setChoNut(document.getElementById('test-nut-trang')); }, []);

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
  const soChuaCoKe = coXep ? lopFT.reduce((n, l) => n + (l.chiXem ? 0 : l.chuaCoLichTiep), 0) : 0;
  const locChuaCoKe = loai === 'ft' && chiChuaCoKe && soChuaCoKe > 0;
  /* Chữ ở ô tìm lọc danh sách lớp chỉ khi khớp mã lớp nào đó — gõ tên / email học viên thì danh sách giữ nguyên (chọn em ở gợi ý). */
  const khopMa = chu.trim() ? (loai === 'ft' ? lopFT : lopThuong).filter((l) => chuanHoaMaLop(l.code).includes(chuanHoaMaLop(chu))) : [];
  const danhSach = (loai === 'ft' ? lopFT : lopThuong)
    .filter((l) => !khopMa.length || khopMa.includes(l))
    .filter((l) => lopLoc === null || l.id === lopLoc)
    .filter((l) => !locChuaCoKe || (!l.chiXem && l.chuaCoLichTiep > 0))
    .filter((l) => !lopTrongTuan || lopTrongTuan.has(l.id));
  const toggle = (id: number) => setMoList((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  /* C18: chọn lớp → mở lớp đó (lớp khung kia thì tự đổi khung, không hỏi); chọn em → mở lớp của em, cuộn tới hàng em. */
  const moLop = (id: number, loaiLop: 'ft' | 'thuong', hv: number | null) => {
    setMoList((m) => [...m.filter((x) => x !== id), id]);
    const next = new URLSearchParams(params);
    next.set('loai', loaiLop); next.set('classId', String(id));
    if (hv) next.set('hv', String(hv)); else next.delete('hv');
    next.delete('tuan');
    setParams(next, { replace: true });
  };
  const chonLop = (l: KetQuaTim['lop'][number]) => { setChu(''); setLopLoc(l.id); moLop(l.id, l.loai, null); };
  const chonHv = (h: KetQuaTim['hocVien'][number]) => { setChu(h.ten); moLop(h.classId, h.loai, h.studentId); };

  const lopChon = [...moList].reverse().map((id) => data?.lop.find((l) => l.id === id)).find((l) => l && l.loai === loai) ?? null;
  const lyDoTat = hopMo ? t('Đóng hộp kỹ năng trước') : undefined;

  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data || (tuan && hl.loading && !hl.data)) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) return <div className="card"><Empty title={t('Bạn không có lớp nào để xem lịch Test')} /></div>;

  return (
    <div className="space-y-3">
      {/* U05 (mockup V11 `.thanh-cu`): Fast Track / Lớp thường · chip "Chưa có MT kế tiếp" · Chi nhánh · ô tìm · chip "Lớp: … ✕" · ⓘ · phải: n HV.
          375 (khu E): ô tìm + "Lọc" + ⋯ (Xuất, Xếp nhiều MT…); chip, Chi nhánh trong "Lọc". */}
      <div className="loc-hv flex flex-wrap items-center gap-2" data-hd="kht-loc">
        {!dienThoai && <CongTacKhung v8 trang="ke-hoach-test" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }}
          onChange={(k) => { if (k !== 'tat-ca') { setLopLoc(null); setLoai(k); } }} />}
        {tuanXem && (
          <NutChon nho chon onClick={boTuan} title={t('Bỏ lọc tuần — xem mọi lớp')}>
            {t('Tuần')} <span className="tabular-nums">{tuanLich(tuanXem.weekStart)}</span> · <span className="tabular-nums">{lopTrongTuan!.size}</span> {t('lớp')}
          </NutChon>
        )}
        {(() => {
          const chipKe = loai === 'ft' && soChuaCoKe > 0 ? (
            <button type="button" className="nut-loc" aria-pressed={locChuaCoKe} onClick={() => {
              const bat = !locChuaCoKe;
              setChiChuaCoKe(bat);
              if (bat) setMoList(lopFT.filter((l) => !l.chiXem && l.chuaCoLichTiep > 0).map((l) => l.id));
            }} title={t('Em chưa có lượt MT kế tiếp — Quản lý xếp tiếp')}>
              {t('Chưa có MT kế tiếp')} <b className="tabular-nums">{soChuaCoKe}</b>{locChuaCoKe && <span aria-label={t('Bỏ lọc')}> ✕</span>}
            </button>
          ) : null;
          const doiCn = (id: number | null) => {
            const next = new URLSearchParams(params);
            next.delete('branchId'); if (id) next.set('cn', String(id)); else next.delete('cn');
            next.delete('classId'); setLopLoc(null);
            setParams(next, { replace: true });
          };
          const nutTrang = coXep ? (
            <MenuDong nhan={t('Thao tác trang')} lopNut="btn h-11 w-11 shrink-0 justify-center !px-0 font-bold" muc={[
              { key: 'xep', nhan: loai === 'ft' ? t('Xếp nhiều MT…') : t('Xếp lịch Test…'), tat: !!lyDoTat, onChon: () => setXep(loai) },
              ...(loai === 'ft' ? [
                { key: 'xuat', nhan: t('Xuất Excel'), tat: !!lyDoTat || !danhSach.length, onChon: () => setXuat('ke-hoach') },
                { key: 'diem', nhan: t('Xuất điểm Test'), tat: !!lyDoTat, onChon: () => setXuat('diem') },
              ] : []),
            ]} />
          ) : null;
          return dienThoai ? (
            <>
              <TimKeHoach branchId={branchId} value={chu} onChange={setChu} onChonLop={chonLop} onChonHv={chonHv} className="min-w-0 flex-1" />
              <details className="contents">
                <summary className="btn min-h-[44px] cursor-pointer list-none">{t('Lọc')}</summary>
                <div className="flex basis-full flex-wrap items-center gap-2">
                  <CongTacKhung v8 trang="ke-hoach-test" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }}
                    onChange={(k) => { if (k !== 'tat-ca') { setLopLoc(null); setLoai(k); } }} />
                  {chipKe}
                  {branchCount > 1 && <BranchFilter branchId={branchId} onBranch={doiCn} />}
                </div>
              </details>
              {nutTrang}
            </>
          ) : (
            <>
              {chipKe}
              {branchCount > 1 && <BranchFilter branchId={branchId} onBranch={doiCn} />}
              <TimKeHoach branchId={branchId} value={chu} onChange={setChu} onChonLop={chonLop} onChonHv={chonHv} className="w-[280px]" />
            </>
          );
        })()}
        {lopLoc !== null && (
          <button type="button" className="nut-loc nut-loc-dang" onClick={() => setLopLoc(null)} aria-label={t('Bỏ lọc lớp')}>
            {t('Lớp: {ma}', { ma: data.lop.find((l) => l.id === lopLoc)?.code ?? '' })} ✕
          </button>
        )}
        <NutLuat label={t('Luật xếp lịch Test')}>
          {loai === 'ft' ? (
            <span className="block">
              {t('Mỗi đợt xếp riêng')} <b>L</b> (Listening), <b>R</b> (Reading), <b>W</b> (Writing), <b>S</b> (Speaking). <b>{t('W = chấm cả W1 và W2')}</b>
              {' '}{t('— một lịch W đặt cho cả hai.')} {t('Kỹ năng khác tuần trong cùng đợt ghi riêng')} (<b>{t('S riêng · W3 DEC')}</b>).
            </span>
          ) : (
            <span className="block">
              {t('Mỗi đợt (Progress Test, Final Test) xếp riêng từng môn của chương trình lớp')}
              {monTheoCt.length ? ': ' : '.'}
              {monTheoCt.map(([ct, mon], i) => (
                <span key={ct}>{i ? ' · ' : ''}<b>{ct}</b> {mon}</span>
              ))}
              {monTheoCt.length ? '.' : ''} {t('Môn khác tuần trong cùng đợt ghi riêng.')}
            </span>
          )}
          {loai !== 'ft' && <span className="block">{t('Lớp thường ghi thêm tuần trong khoá')} (<b>W5/10</b>).</span>}
          <span className="block">{t('Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại để xác nhận.')}</span>
        </NutLuat>
        <span className="ml-auto text-[13px] text-dim max-sm:basis-full max-sm:text-right">
          <b className="tabular-nums text-slate-100">{danhSach.reduce((n, l) => n + l.soHv, 0)}</b> HV
        </span>
      </div>
      {choNut && !dienThoai && coXep && createPortal(
        <span className="flex flex-wrap items-center gap-2">
          {loai === 'ft' && <>
            <button type="button" className="btn h-9 text-sm font-semibold" disabled={!!lyDoTat || !danhSach.length} title={lyDoTat} onClick={() => setXuat('ke-hoach')}>{t('Xuất Excel')}</button>
            <button type="button" className="btn h-9 text-sm font-semibold" disabled={!!lyDoTat} title={lyDoTat} onClick={() => setXuat('diem')}>{t('Xuất điểm Test')}</button>
          </>}
          <button type="button" className="btn btn-primary h-9 text-sm" disabled={!!lyDoTat} title={lyDoTat} onClick={() => setXep(loai)}>
            {loai === 'ft' ? t('Xếp nhiều MT…') : t('Xếp lịch Test…')}
          </button>
        </span>, choNut)}

      {danhSach.length === 0 ? (
        <div className="card"><Empty title={locChuaCoKe ? t('Không lớp nào chưa có MT kế tiếp') : chu ? t('Không có lớp nào khớp "{chu}"', { chu }) : t('Không có lớp nào có đợt Test trong tuần này')}
          action={locChuaCoKe || lopLoc !== null ? <button type="button" className="btn btn-sm" onClick={() => { setChiChuaCoKe(false); setLopLoc(null); }}>{t('Bỏ lọc')}</button> : undefined} /></div>
      ) : (
        <div className="bang-kh">
          {danhSach.map((l) => (
            <LopKeHoach key={l.id} lop={l} mo={moList.includes(l.id)} onToggle={() => toggle(l.id)} onHienDien={setHopMo} chiChuaCoKe={locChuaCoKe}
              hvChon={l.id === classIdParam ? hvParam : null}
              onLocLop={() => { setChiChuaCoKe(true); setLopLoc(l.id); setMoList((m) => [...m.filter((x) => x !== l.id), l.id]); }} />
          ))}
        </div>
      )}

      {xep === 'ft' && (
        <NganXepLichMt chiNhanhDau={branchId} lopDs={data.lop} lopMoSan={lopChon?.loai === 'ft' ? lopChon.id : null} coThuong={lopThuong.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
      {xuat === 'ke-hoach' && (
        <NganXuatKeHoach branchId={branchId} classIds={danhSach.length === lopFT.length ? [] : danhSach.map((l) => l.id)} chiXepLai={false} onDong={() => setXuat(null)} />
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
