import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDienThoai } from '../../ui/TheDong.tsx';
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
import { boMonLich, chuanHoaMaLop, kyHieuLop, mondayOfDate, tenMon, tenMonNgan, tuanLich } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { Data as LichSapToiData } from '../worklist/Highlights.tsx';
import { TimKeHoach, type KetQuaTim } from './keHoach/TimKeHoach.tsx';
import { NganXuatTest } from './NganXuatTest.tsx';
import type { DanhSachLop, LopKH, SoLoc } from './keHoach/kieu.ts';
import { DaiChiSo, ODai, SoTinh } from '../../ui/DaiChiSo.tsx';

/** Phần dải BPXL của `GET /tong-quan/mock-test` (`server/src/worklist/tongQuanMt.ts`, nhánh BPXL). */
type TongQuanMt = { luotTuanNay: { so: number }; oChuaNhap: { so: number }; lopCo?: { bai: Record<number, number>; luot: number[] } };
import { t } from '@shared/i18n/index.ts';

/**
 * TEST › KẾ HOẠCH TEST (mockup 14, PR-UX2) — Quản lý xếp; GV xem lớp mình dạy (chỉ xem, chủ SP 28/10). Một hàng điều khiển: Chi nhánh · ô tìm lớp · tab nhỏ
 * `Fast Track · Lớp thường` · ⓘ luật · nút `Xếp nhiều MT…` / `Xếp lịch Test…` (PR-XLMT: ngăn `NganXepLichMt` nhiều lớp · `NganXepHangLoat` một lớp thường); dưới là danh sách lớp (`LopKeHoach`), mỗi lớp một hàng
 * lớn mở ra lưới học viên × đợt — lớp thường làm y như Fast Track. Hộp kỹ năng (neo cạnh chip) và ngăn hàng loạt không
 * bao giờ mở chồng nhau (G-8): hộp mở thì nút hàng loạt tắt.
 */
export function KeHoachTestTab() {
  const [params, setParams] = useSearchParams();
  const { branchCount, session } = useSession();
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const loaiParam = params.get('loai') as 'ft' | 'thuong' | null;
  const classIdParam = params.get('classId') ? Number(params.get('classId')) : null;
  /* OV-15c (C18): em vừa chọn ở ô tìm — lưới lớp đó cuộn tới hàng em và đánh dấu hàng. */
  const hvParam = params.get('hv') ? Number(params.get('hv')) : null;
  const [xuat, setXuat] = useState(false);

  const { data, loading, error, reload } = useApi<DanhSachLop>(`/ke-hoach-test/lop${branchId ? `?branchId=${branchId}` : ''}`);
  const [chu, setChu] = useState('');
  const [moLoc, setMoLoc] = useState(false);
  const [moList, setMoList] = useState<number[]>([]);
  const [daMoSan, setDaMoSan] = useState(false);
  const [hopMo, setHopMo] = useState(false);
  /* PR-XLMT (M9): ngăn Xếp lịch — khung FT (nhiều lớp) hoặc Lớp thường (một lớp); không cần mở lớp trước. */
  const [xep, setXep] = useState<'ft' | 'thuong' | null>(null);
  /* BPXL-2 (N57, mockup v22): số đang lọc danh sách lớp ở URL `?so=` — "chua-xep" (chip "Chưa xếp lịch MT" của vai khác / số đầu dải BPXL) ·
     "vang" · "bai" · "luot" (dải BPXL). `lopLoc`: lớp chọn ở ô tìm, ô số của hàng lớp hoặc tin chuông (`?lop=`) → chip "Lớp: … ✕". */
  const so = (['chua-xep', 'vang', 'bai', 'luot'] as const).find((k) => k === params.get('so')) ?? null;
  const lopParam = params.get('lop') ? Number(params.get('lop')) : null;
  const [lopLoc, setLopLoc] = useState<number | null>(lopParam);
  /* Tin chuông khi đang ở sẵn trang: lọc + mở đúng lớp đó (lần đầu vào trang thì `?classId=` tự mở như cũ). */
  useEffect(() => { if (lopParam) { setLopLoc(lopParam); setMoList((m) => (m.includes(lopParam) ? m : [...m, lopParam])); } }, [lopParam]);
  const bpxl = !!session?.nav?.trangDauTest;
  /* Dải số BPXL: hai số từ `GET /tong-quan/mock-test` (một request, chỉ BPXL); hai số kia cộng từ danh sách lớp đã nạp. Lưu ở lưới không gọi lại. */
  const tq = useApi<TongQuanMt>(bpxl ? `/tong-quan/mock-test${branchId ? `?branchId=${branchId}` : ''}` : null, [bpxl, branchId]);
  const dienThoai = useDienThoai();
  const { homNay } = useNgayNghiepVu();
  /* Đầu trang (mockup U05; G1-08): Xuất Excel… · Xếp nhiều MT… cạnh tiêu đề "Test" — TestPage chừa chỗ `#test-nut-trang`. Điện thoại cùng chỗ
     (bỏ ⋯ "Thao tác trang": chỉ còn một mục — luật không ⋯ một mục). */
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
    next.set('loai', k); next.delete('classId'); next.delete('so'); next.delete('lop');   // số lọc chỉ của Fast Track
    setParams(next, { replace: true });
    const trongLoai = k === 'ft' ? lopFT : lopThuong;
    if (trongLoai.length === 1 && !moList.includes(trongLoai[0].id)) {
      setMoList((m) => [...m, trongLoai[0].id]);
    }
  };

  /* Luật khung Lớp thường nói theo môn của chương trình các lớp đang có (MH2) — không viết cứng L R W S, không W1/W2.
     MON-CT-1311 PR 2: `boMonLich` đọc bộ môn phiên mang xuống — tính lại khi phiên đổi bộ môn. */
  const boMonPhien = session?.boMonCt;
  const monTheoCt = useMemo(() => [...new Set(lopThuong.map((l) => l.chuongTrinh).filter((c): c is string => !!c))].sort()
    .map((ct) => [kyHieuLop(ct, null) ?? ct, boMonLich(ct).map((k) => {
      const ngan = tenMonNgan(ct, k), dai = tenMon(ct, k);
      return ngan === dai ? ngan : `${ngan} (${dai})`;
    }).join(', ')] as const), [lopThuong, boMonPhien]);   // eslint-disable-line react-hooks/exhaustive-deps
  const tuanXem = tuan ? hl.data?.weeks.find((w) => w.weekStart === tuan) ?? null : null;
  const lopTrongTuan = tuanXem ? new Set<number | null>(loai === 'ft'
    ? tuanXem.ft.mockClasses.map((m) => m.id)
    : [...tuanXem.normal.progressClasses, ...tuanXem.normal.finalClasses].map((r) => r.id)) : null;
  const boTuan = () => { const next = new URLSearchParams(params); next.delete('tuan'); setParams(next, { replace: true }); };
  /* Chủ SP 28/10: GV chỉ xem lớp mình dạy — không có lớp xếp được thì bỏ Chưa xếp lịch MT, Xuất, Xếp (máy chủ vẫn chặn ghi). */
  const coXep = (data?.lop ?? []).some((l) => !l.chiXem);
  const soChuaCoKe = coXep ? lopFT.reduce((n, l) => n + (l.chiXem ? 0 : l.chuaCoLichTiep), 0) : 0;
  /* Lớp khớp một số — cùng tập với chính số đó (bấm số ra đúng các lớp đã đếm). */
  const lopCo = tq.data?.lopCo;
  const khopSo: Record<SoLoc, (l: LopKH) => boolean> = {
    'chua-xep': (l) => !l.chiXem && l.chuaCoLichTiep > 0,
    vang: (l) => l.vangTuanNay > 0,
    bai: (l) => (lopCo?.bai[l.id] ?? 0) > 0,
    luot: (l) => !!lopCo?.luot.includes(l.id),
  };
  const locSo = loai === 'ft' && so ? so : null;
  /* Chữ ở ô tìm lọc danh sách lớp chỉ khi khớp mã lớp nào đó — gõ tên / email học viên thì danh sách giữ nguyên (chọn em ở gợi ý). */
  const khopMa = chu.trim() ? (loai === 'ft' ? lopFT : lopThuong).filter((l) => chuanHoaMaLop(l.code).includes(chuanHoaMaLop(chu))) : [];
  const danhSach = (loai === 'ft' ? lopFT : lopThuong)
    .filter((l) => !khopMa.length || khopMa.includes(l))
    .filter((l) => lopLoc === null || l.id === lopLoc)
    .filter((l) => !locSo || khopSo[locSo](l))
    .filter((l) => !lopTrongTuan || lopTrongTuan.has(l.id));
  /** Bật / bỏ một số lọc (`?so=`, một số một lúc): bật thì về Fast Track và mở lớp đầu khớp (`moHet` = mở mọi lớp khớp — chip cũ của vai khác). */
  const doiSo = (k: SoLoc | null, opts: { lop?: number; moHet?: boolean } = {}) => {
    const next = new URLSearchParams(params);
    if (k) { next.set('so', k); next.set('loai', 'ft'); } else next.delete('so');
    if (k && opts.lop !== undefined) next.set('lop', String(opts.lop)); else next.delete('lop');
    setParams(next, { replace: true });
    setLopLoc(opts.lop ?? null);
    if (!k) return;
    const khop = lopFT.filter((l) => (opts.lop === undefined || l.id === opts.lop) && khopSo[k](l));
    const mo = opts.moHet ? khop : khop.slice(0, 1);
    setMoList((m) => [...m.filter((id) => !mo.some((l) => l.id === id)), ...mo.map((l) => l.id)]);
  };
  const boLopLoc = () => {
    setLopLoc(null);
    if (params.has('lop')) { const next = new URLSearchParams(params); next.delete('lop'); setParams(next, { replace: true }); }
  };
  const NHAN_SO: Record<SoLoc, string> = { 'chua-xep': t('Chưa xếp lịch MT'), vang: t('Vắng tuần này'), bai: t('Bài chưa có điểm'), luot: t('Lượt thi tuần này') };
  const soDai: Array<{ k: SoLoc; n: number | null }> = [
    { k: 'chua-xep', n: soChuaCoKe },
    { k: 'vang', n: lopFT.reduce((n, l) => n + l.vangTuanNay, 0) },
    { k: 'bai', n: tq.data ? tq.data.oChuaNhap.so : null },
    { k: 'luot', n: tq.data ? tq.data.luotTuanNay.so : null },
  ];
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

  /* MO-TAT-CA (2D, mockup v13 D1): một nút "Mở tất cả lớp" ↔ "Thu gọn tất cả" — lớp đang hiện trong khung; chỉ QL / QT (`testPlan`). Mặc định vẫn gập. */
  const moHet = danhSach.length > 0 && danhSach.every((l) => moList.includes(l.id));
  const nutMoHet = !!session?.nav?.testPlan && danhSach.length > 0 && (
    /* GD-11b (mockup ⑦ B1, G2 "nút là nút"): nút nhỏ, không chữ link. */
    <button type="button" className="btn btn-sm max-sm:min-h-[44px]" aria-pressed={moHet}
      onClick={() => setMoList((m) => [...m.filter((id) => !danhSach.some((l) => l.id === id)), ...(moHet ? [] : danhSach.map((l) => l.id))])}>{moHet ? t('Thu gọn tất cả') : t('Mở tất cả lớp')}</button>
  );
  const lopChon = [...moList].reverse().map((id) => data?.lop.find((l) => l.id === id)).find((l) => l && l.loai === loai) ?? null;
  const lyDoTat = hopMo ? t('Đóng hộp kỹ năng trước') : undefined;

  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data || (tuan && hl.loading && !hl.data)) return <div className="space-y-3"><Skeleton rows={8} /></div>;
  if (!data.lop.length) return <div className="card"><Empty title={t('Bạn không có lớp nào để xem lịch Test')} /></div>;

  return (
    <div className="space-y-3">
      {/* BPXL-2 (N57, mockup v22 K1–K5): dải 4 số LẶNG chỉ BPXL — chữ xám, không đỏ, không badge, không cộng vào số menu. Bấm số = lọc danh sách lớp
          ngay dưới (ô số = mở tại chỗ), bấm lại / "Lọc: … ✕" = bỏ; số 0 mờ, không bấm. */}
      {bpxl && lopFT.length > 0 && (
        <DaiChiSo nhan={t('Số cần xếp')} className="dai-cs-lang">
          {soDai.map(({ k, n }) => (
            <ODai key={k} nhan={NHAN_SO[k]}>
              {n ? (
                <button type="button" className="so-lang" aria-pressed={locSo === k} aria-label={`${NHAN_SO[k]} ${n}`}
                  onClick={() => doiSo(locSo === k ? null : k)}>{n}</button>
              ) : <SoTinh n={n === null ? (tq.error ? '—' : '…') : 0} />}
            </ODai>
          ))}
        </DaiChiSo>
      )}
      {/* U05 (mockup V11 `.thanh-cu`): Fast Track / Lớp thường · chip "Chưa đủ MT" · Chi nhánh · ô tìm · chip "Lớp: … ✕" · ⓘ · phải: n HV.
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
          /* Vai khác: chip "Chưa xếp lịch MT n" (BPXL-2: một tên với ô số hàng lớp). BPXL: số này nằm ở dải → chip "Lọc: … ✕" khi đang lọc. */
          const locChuaXep = locSo === 'chua-xep';
          const coChipKe = !bpxl && loai === 'ft' && soChuaCoKe > 0;
          const chipKe = !coChipKe && !(locSo && (bpxl || !locChuaXep)) ? null : (
            <>
              {coChipKe && (
                <button type="button" className="nut-loc" aria-pressed={locChuaXep} onClick={() => doiSo(locChuaXep ? null : 'chua-xep', { moHet: true })}
                  title={t('Lộ trình chưa đủ MT (3 · RF 2) — Head xếp tiếp')}>
                  {t('Chưa xếp lịch MT')} <b className="tabular-nums">{soChuaCoKe}</b>{locChuaXep && <span aria-label={t('Bỏ lọc')}> ✕</span>}
                </button>
              )}
              {locSo && (bpxl || !locChuaXep) && (
                <button type="button" className="nut-loc nut-loc-dang max-sm:min-h-[44px]" onClick={() => doiSo(null)} aria-label={t('Bỏ lọc {x}', { x: NHAN_SO[locSo] })}>
                  {t('Lọc: {x}', { x: NHAN_SO[locSo] })} <span aria-hidden>✕</span>
                </button>
              )}
            </>
          );
          const doiCn = (id: number | null) => {
            const next = new URLSearchParams(params);
            next.delete('branchId'); if (id) next.set('cn', String(id)); else next.delete('cn');
            next.delete('classId'); next.delete('lop'); setLopLoc(null);
            setParams(next, { replace: true });
          };
          return dienThoai ? (
            <>
              {/* GD-11b (mockup ⑦ B7): 375 — Fast Track / Lớp thường đủ rộng, ô tìm một hàng, chip "Chưa đủ MT" hiện thẳng; "Lọc" chỉ còn khi
                  có nhiều chi nhánh (chi nhánh nằm trong đó). */}
              <div className="flex basis-full [&>*]:flex-1"><CongTacKhung v8 trang="ke-hoach-test" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }}
                onChange={(k) => { if (k !== 'tat-ca') { setLopLoc(null); setLoai(k); } }} /></div>
              <TimKeHoach branchId={branchId} value={chu} onChange={setChu} onChonLop={chonLop} onChonHv={chonHv} className={`min-w-0 flex-1 ${branchCount > 1 ? '' : 'basis-full'}`} />
              {branchCount > 1 && (
                /* KIEM-TAY-1011 (6): nút + khối là con trực tiếp của hàng flex — khối "Lọc" xuống dòng riêng (`basis-full`). */
                <button type="button" className="btn min-h-[44px]" aria-expanded={moLoc} aria-controls="kht-loc-them" onClick={() => setMoLoc((v) => !v)}>{t('Lọc')}</button>
              )}
              {moLoc && branchCount > 1 && (
                <div id="kht-loc-them" className="order-1 flex basis-full flex-wrap items-center gap-2">
                  <BranchFilter branchId={branchId} onBranch={doiCn} />
                </div>
              )}
              {chipKe && <div className="order-2">{chipKe}</div>}
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
          <button type="button" className="nut-loc nut-loc-dang" onClick={boLopLoc} aria-label={t('Bỏ lọc lớp')}>
            {t('Lớp: {ma}', { ma: data.lop.find((l) => l.id === lopLoc)?.code ?? '' })} ✕
          </button>
        )}
        <span className="inline-flex max-sm:order-2"><NutLuat label={t('Luật xếp lịch Test')}>
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
          {loai !== 'ft' && <span className="block">{t('Lớp thường ghi thêm tuần trong khoá')} (<b>{t('tuần {n}/{tong}', { n: 5, tong: 10 })}</b>).</span>}
          <span className="block">{t('Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại để xác nhận.')}</span>
        </NutLuat></span>
        <span className="ml-auto inline-flex items-center gap-3.5 text-[13px] text-dim max-sm:order-2 max-sm:ml-auto">
          {/* BPXL-2 (mockup v22 K2): đang lọc em (Vắng / Chưa xếp lịch MT) → số em khớp; còn lại → HV của các lớp đang hiện. */}
          <span><b className="tabular-nums text-slate-100">{danhSach.reduce((n, l) => n + (locSo === 'vang' ? l.vangTuanNay : locSo === 'chua-xep' ? l.chuaCoLichTiep : l.soHv), 0)}</b> HV</span>
          {nutMoHet}
        </span>
      </div>
      {choNut && (coXep || session?.nav?.xuatMt) && createPortal(
        <span className="flex flex-nowrap items-center gap-2">
          {session?.nav?.xuatMt && (
            <button type="button" className="btn h-9 text-sm font-semibold max-sm:min-h-[44px] max-sm:px-2.5" aria-haspopup="dialog" data-hd="test-xuat" disabled={!!lyDoTat} title={lyDoTat}
              onClick={() => setXuat(true)}>{t('Xuất Excel…')}</button>
          )}
          {coXep && <button type="button" className="btn btn-primary h-9 text-sm max-sm:min-h-[44px] max-sm:px-2.5" disabled={!!lyDoTat} title={lyDoTat} onClick={() => setXep(loai)}>
            {loai === 'ft' ? t('Xếp nhiều MT…') : t('Xếp lịch Test…')}
          </button>}
        </span>, choNut)}

      {danhSach.length === 0 ? (
        <div className="card"><Empty title={locSo ? t('Không lớp nào khớp "{x}"', { x: NHAN_SO[locSo] }) : chu ? t('Không có lớp nào khớp "{chu}"', { chu }) : t('Không có lớp nào có đợt Test trong tuần này')}
          action={locSo || lopLoc !== null ? <button type="button" className="btn btn-sm" onClick={() => doiSo(null)}>{t('Bỏ lọc')}</button> : undefined} /></div>
      ) : (
        <div className="bang-kh">
          {danhSach.map((l) => (
            <LopKeHoach key={l.id} lop={l} mo={moList.includes(l.id)} onToggle={() => toggle(l.id)} onHienDien={setHopMo} loc={locSo}
              hvChon={l.id === classIdParam ? hvParam : null}
              onLocLop={(k) => doiSo(k, { lop: l.id })} />
          ))}
        </div>
      )}

      {xep === 'ft' && (
        <NganXepLichMt chiNhanhDau={branchId} lopDs={data.lop} lopMoSan={lopChon?.loai === 'ft' ? lopChon.id : null} coThuong={lopThuong.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
      {xuat && (
        /* G1-08: một ngăn — mở sẵn Lịch Test theo bộ lọc đang xem (như ngăn Kế hoạch cũ); tab Điểm: lớp đang mở → MT1–MT4 của lớp ("Theo lớp (nhiều MT)" cũ), không → tuần này. */
        <NganXuatTest dau={loai === 'ft' ? 'lich' : 'diem'} onDong={() => setXuat(false)}
          lich={{ branchId, classIds: loai === 'ft' && danhSach.length !== lopFT.length ? danhSach.map((l) => l.id) : [] }}
          diem={{ khung: loai, chiNhanh: branchId, lop: lopChon ? { id: lopChon.id, ma: lopChon.code } : null,
            thoiGianMacDinh: lopChon && loai === 'ft' ? { kieu: 'dot', dot: ['mt:1', 'mt:2', 'mt:3', 'mt:4'] }
              : { kieu: 'tuan', tu: mondayOfDate(homNay), den: mondayOfDate(homNay) } }} />
      )}
      {xep === 'thuong' && (
        <NganXepHangLoat lopThuong={lopThuong} classIdBanDau={lopChon?.loai === 'thuong' ? lopChon.id : null} coFt={lopFT.length > 0}
          onDoiKhung={setXep} onClose={() => setXep(null)} onDone={reload} />
      )}
    </div>
  );
}
