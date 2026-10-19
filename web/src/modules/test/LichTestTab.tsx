import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useGopTaiLai } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useTenTrang } from '../../lib/quayLai.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { BranchFilter, WeekPicker, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, phamViCoHaiKhung } from '../../ui/CongTacKhung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
import { useManHinhHep } from '../cham/LuoiChamLop.tsx';
import { addDaysIso, chuOChuaLuu, demLopConBai, khungLichTestMacDinh, mondayOfDate, ngay, tenMon, tuanDauThangCua, tuanLich } from '@shared/domain/index.ts';
import { khoaHang, type DongNo, type LichTest, type LopLichTest } from './lichTest/kieu.ts';
import { DaiSo, type OSo } from './lichTest/DaiSo.tsx';
import { KhoiNo } from './lichTest/KhoiNo.tsx';
import { HangLop } from './lichTest/HangLop.tsx';
import { dangMo, docMo, ghiMo } from './lichTest/moLop.ts';
import { NganXuatMt } from './NganXuatMt.tsx';
import { DanhSachNguon } from '../../ui/SoLieuO.tsx';
import { t } from '@shared/i18n/index.ts';

type Loai = 'ft' | 'thuong';
/* PR-MT0: MT0 chấm band nhưng ở lớp thường → khung Lớp thường (cùng luật `khungDong` máy chủ). */
const loaiCua = (l: { mode: LopLichTest['mode']; kind?: string | null }): Loai => (l.mode === 'ielts_band' && l.kind !== 'mt0' ? 'ft' : 'thuong');

/**
 * TEST › LỊCH TEST (PR-UX1, mockup 13 phương án B; PR-LT3 ba khối, mockup lich-test-ba-khoi 06/10) — chấm ngay tại chỗ.
 *
 *   hàng lọc   tuần · "Lớp tôi dạy | Tất cả" (chỉ khi hai tập khác nhau) · chi nhánh · chip "Đang lọc: lớp …"
 *   dải số     Tuần này đã chấm x/y · Còn phải chấm · Quá hạn chấm n · m lớp — bấm được (G-10, Q1; UX-2: Quá hạn chấm mở danh sách ô)
 *   khối 1     Test quá hạn chấm — theo hôm nay, không đổi khi đổi tuần; bấm Nhập điểm mở lưới ngay dưới dòng (mục con)
 *   khối 2     Test chấm tuần này — chỉ khi xem tuần hiện tại; lớp đã chấm xong thu gọn, chữ nhạt, cuối (Q4)
 *   khối 3     Lịch Test tuần này / Lịch Test W1 OCT (tuần khác: mở sẵn — Q2)
 *   công tắc   Tất cả · Fast Track · n lớp | Lớp thường · n lớp ở HÀNG LỌC (MH4, K4-05) — áp cho dải số và ba khối;
 *              `loai` trên đường dẫn thắng; mặc định khung có bài của người xem, cả hai có bài → Tất cả (OV-15b, C14); chỉ một khung có lớp thì ẩn.
 *
 * Mọi trạng thái nằm trên đường dẫn (replace): `periodId`, `branchId`, `phamVi`, `loai`, `classId`, `kn` — F5 và Back
 * giữ đúng chỗ. Máy chủ trả đủ trong MỘT lời gọi; không có `periodId` thì máy chủ tự lấy tuần hiện tại.
 */
export function LichTestTab() {
  const { session, branchCount } = useSession();
  const nguoiId = session?.user?.id ?? null;
  const { homNay } = useNgayNghiepVu();
  const hep = useManHinhHep();
  /* Điện thoại (UX-D8, mockup 13 mục 4): hàng lọc gọn — tuần + công tắc khung ở trên, phần còn lại gom vào nút "Lọc". */
  const dienThoai = useDienThoai();
  const [moLoc, setMoLoc] = useState(false);
  const nutLoc = useRef<HTMLButtonElement>(null);
  /* Esc đóng khối Lọc và trả focus về nút — nghe ở tài liệu vì đổi chi nhánh làm trang tải lại, ô đang focus mất. Có hộp thoại mở thì nhường Esc. */
  useEffect(() => {
    if (!moLoc) return undefined;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
      setMoLoc(false); nutLoc.current?.focus();
    };
    document.addEventListener('keydown', phim);
    return () => document.removeEventListener('keydown', phim);
  }, [moLoc]);
  const [params, setParams] = useSearchParams();
  const so = (k: string) => (params.get(k) ? Number(params.get(k)) : null);
  const periodParam = so('periodId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = so('cn') ?? so('branchId') ?? macDinh;
  const urlClassId = so('classId');
  const urlKn = params.get('kn');
  const phamViParam = params.get('phamVi');
  const loaiParam = params.get('loai') as Loai | null;

  const qs = new URLSearchParams();
  if (periodParam) qs.set('periodId', String(periodParam));
  if (branchId) qs.set('branchId', String(branchId));
  if (phamViParam === 'cua-toi' || phamViParam === 'tat-ca') qs.set('phamVi', phamViParam);
  if (urlClassId) qs.set('classId', String(urlClassId));
  const { data, error, reload } = useApi<LichTest>(`/cham/lich-test?${qs}`);

  const datThamSo = (doi: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(doi)) { if (v) next.set(k, v); else next.delete(k); }
    setParams(next, { replace: true });
  };

  /* Q14 — lưu một ô: gộp 1,5 s sau lần lưu cuối rồi mới tải lại dải số + nhãn. */
  const baoDaLuu = useGopTaiLai(reload);

  /* Hàng đang mở: nhớ theo tuần xem (localStorage, khoá `khoaHang`) + hàng bị "ép mở" bởi đường dẫn / dải số. Khối 2: hàng đã chấm
     xong KHÔNG nhớ qua lần tải lại (Q4 — luôn thu gọn). `moXong` = hàng khối 2 đang mở TRONG PHIÊN — hàng vừa chấm xong ô cuối vẫn mở
     (Q14: lưới không biến mất giữa lúc gõ), tới khi người dùng thu. */
  const tuanId = data?.tuan?.id ?? null;
  useTenTrang(null, data?.tuan ? tuanLich(data.tuan.weekStart, homNay) : null);   // PR-OV5b: "‹ Lịch Test · W2 OCT"
  const [nho, setNho] = useState<Record<string, boolean>>({});
  const [moXong, setMoXong] = useState<Set<string>>(new Set());
  const [epMo, setEpMo] = useState<Set<string>>(new Set());
  const [conTro, setConTro] = useState<Set<string>>(new Set());
  const [moKhoi, setMoKhoi] = useState({ k1: false, k2: true, k3: false });
  const [moXuat, setMoXuat] = useState(false);
  const [dongMo, setDongMo] = useState<{ d: DongNo; viTri: number; conTro: boolean } | null>(null);
  /* Số ô lưu hỏng theo hàng lớp / dòng khối 1 (PR-UX1) — badge của hàng nói "n ô chưa lưu" tới khi hết. */
  const [chuaLuu, setChuaLuu] = useState<Record<string, number>>({});
  const baoChuaLuu = useCallback((khoa: string, n: number) => setChuaLuu((x) => {
    if ((x[khoa] ?? 0) === n) return x;
    const moi = { ...x };
    if (n) moi[khoa] = n; else delete moi[khoa];
    return moi;
  }), []);

  /* Khởi tạo MỘT LẦN cho mỗi (tuần, lớp đang lọc): khối mặc định (khối 1 thu, khối 2 mở, khối 3 thu; tuần khác khối 3 mở — Q2), hàng đã
     nhớ, rồi lối vào từ đường dẫn (`classId`, `kn` — Việc cần làm, badge, chuông): dòng khối 1 khớp → mở khối 1 + lưới dòng đó; không thì
     hàng lớp khối 2 → mở khối 2 + ép mở hàng; không thì khối 3. */
  const daKhoiTao = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.tuan) return;
    const khoa = `${nguoiId ?? 0}|${data.tuan.id}|${urlClassId ?? ''}`;
    if (daKhoiTao.current === khoa) return;
    daKhoiTao.current = khoa;
    const nhoMoi = docMo(nguoiId, data.tuan.id);
    setNho(nhoMoi);
    const khoi = { k1: false, k2: true, k3: !data.laTuanNay };
    const khopKn = (k: string) => !!urlKn && (k === urlKn || (urlKn === 'writing' && k.startsWith('writing')));
    const noCuaLop = urlClassId ? data.no.filter((d) => d.classId === urlClassId) : [];
    const hang2 = urlClassId ? (data.chamTuanNay ?? []).filter((l) => l.classId === urlClassId && l.conBai > 0) : [];
    const hang3 = urlClassId ? data.lop.filter((l) => l.classId === urlClassId) : [];
    const noDau = noCuaLop.find((d) => d.kyNang.some(khopKn))
      ?? (urlKn && (hang2.length || hang3.length) ? undefined : noCuaLop.find((d) => d.cuaToi) ?? noCuaLop[0]);
    let ep: string[] = [];
    if (noDau) {
      setDongMo({ d: noDau, viTri: data.no.indexOf(noDau), conTro: true });
      khoi.k1 = true;
    } else {
      setDongMo(null);
      if (hang2.length) { khoi.k2 = true; ep = hang2.map(khoaHang); }
      else if (hang3.length) { khoi.k3 = true; ep = hang3.map(khoaHang); }
    }
    setMoKhoi(khoi);
    setEpMo(new Set(ep)); setConTro(new Set(ep));
    /* Hàng khối 2 còn bài đang mở lúc vào trang — giữ mở trong phiên dù chấm xong (hàng đã xong từ trước thì thu: Q4). */
    setMoXong(new Set((data.chamTuanNay ?? []).filter((l) => l.conBai > 0 && dangMo({ key: khoaHang(l), moSan: l.moSan }, nhoMoi, new Set(ep)))
      .map(khoaHang)));
  }, [data, urlClassId, urlKn, nguoiId]);

  const laXong2 = (l: LopLichTest, khoi2: boolean) => khoi2 && l.conBai === 0;
  const moCua = (khoi2: boolean) => (l: LopLichTest) => {
    const k = khoaHang(l);
    return laXong2(l, khoi2) ? moXong.has(k) : dangMo({ key: k, moSan: l.moSan }, nho, epMo);
  };
  const doiMo = (khoi2: boolean) => (l: LopLichTest) => {
    const k = khoaHang(l);
    const dangMoHang = moCua(khoi2)(l);
    if (!dangMoHang) setConTro((s) => new Set(s).add(k));
    if (khoi2) setMoXong((s) => { const n = new Set(s); if (dangMoHang) n.delete(k); else n.add(k); return n; });
    if (laXong2(l, khoi2)) return;
    const moi = { ...nho, [k]: !dangMoHang };
    setNho(moi);
    if (tuanId) ghiMo(nguoiId, tuanId, moi);
    if (epMo.has(k)) setEpMo((s) => { const n = new Set(s); n.delete(k); return n; });
  };

  /* Số lớp theo khung = lớp có ở BẤT KỲ khối nào (khung không có gì thì công tắc không mời chọn nó). */
  const tatCaHang = useMemo(() => [...(data?.no ?? []), ...(data?.chamTuanNay ?? []), ...(data?.lop ?? [])], [data]);
  const dem = useMemo(() => {
    const lop = (k: Loai) => new Set(tatCaHang.filter((x) => loaiCua(x) === k).map((x) => x.classId)).size;
    return { ft: lop('ft'), thuong: lop('thuong') };
  }, [tatCaHang]);
  /* OV-15b (C14): `null` = cả hai khung. Mặc định khung có bài của người xem; cả hai có bài → hiện cả hai (`khungLichTestMacDinh`). */
  const loai: Loai | null = useMemo(() => {
    if (!data) return null;
    const theoLop = tatCaHang.find((l) => l.classId === urlClassId);
    const coBai = { ft: 0, thuong: 0 };
    /* Bài của người xem: có phân công thì phần của mình (`phan`), Quản lý / Quản trị thì cả hàng — như badge khối. */
    for (const l of tatCaHang) coBai[loaiCua(l)] += 'conBaiCuaToi' in l ? (l.phan ? l.conBaiCuaToi : l.conBai) : (l.phan ? l.phan.toi?.con ?? 0 : l.conBai);
    return khungLichTestMacDinh({ param: loaiParam, theoLop: theoLop ? loaiCua(theoLop) : null, coBai, dem, phamViHai: phamViCoHaiKhung() });
  }, [data, dem, tatCaHang, loaiParam, urlClassId]);
  const theoKhung = <T extends { mode: LopLichTest['mode']; kind?: string | null }>(ds: T[]) => ds.filter((x) => !loai || loaiCua(x) === loai);
  const noTab = theoKhung(data?.no ?? []);
  const k2Tab = theoKhung(data?.chamTuanNay ?? []);
  const lopTab = theoKhung(data?.lop ?? []);
  /* Luật lưới lớp thường nói đúng tên môn chấm theo thang điểm của các lớp đang xem (BE: Writing, Speaking · FOU: Grammar +
     Vocabulary, Pronunciation) — không viết cứng. */
  const monThangDiem = [...new Set([...k2Tab, ...lopTab].flatMap((l) => l.boMon
    .filter((k) => k === 'writing' || k === 'speaking').map((k) => tenMon(l.chuongTrinh, k))))];

  /* Thu một khối là bỏ lưới đang mở trong đó — còn ô chưa lưu thì hỏi trước (Q14). */
  const thuKhoi = (k: 'k1' | 'k2' | 'k3') => {
    if (!moKhoi[k]) { setMoKhoi((m) => ({ ...m, [k]: true })); return; }
    const khoa = k === 'k1' ? (dongMo ? [`no:${dongMo.d.key}`] : []) : (k === 'k2' ? k2Tab : lopTab).map(khoaHang);
    const n = khoa.reduce((s, x) => s + (chuaLuu[x] ?? 0), 0);
    if (n > 0 && !window.confirm(t('Còn {chuOChuaLuu}. Thu khối này thì mất các giá trị đó — vẫn thu?', { chuOChuaLuu: chuOChuaLuu(n) }))) return;
    setMoKhoi((m) => ({ ...m, [k]: false }));
  };

  /*
   * UX-2 (1): ô "Quá hạn chấm" = Tổng quan "Bài quá hạn" (mọi ô có cờ quá hạn, cả ô tuần trước) — đường riêng, không theo tuần.
   * OV-14b: theo khung đang xem như hai ô kia và các khối (cùng hàm `oQuaHanCham`, lọc khung) — hết "58 · 4 lớp" trên khối "53 · 2 lớp".
   */
  const qsQuaHan = new URLSearchParams([...qs].filter(([k]) => k !== 'periodId'));
  if (loai) qsQuaHan.set('khung', loai);
  const quaHan = useApi<{ n: number; lop: number; khac: number }>(`/cham/lich-test/qua-han?${qsQuaHan}`).data;
  const [moQuaHan, setMoQuaHan] = useState(false);
  const cuon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  const bamSo = (o: OSo) => {
    if (!data) return;
    /* UX-2 (1): "Quá hạn chấm" mở DANH SÁCH đúng các ô đã đếm (cả ô tuần trước ở khối 2) — không còn chỉ một khối. */
    if (o === 'no') { setMoQuaHan(true); return; }
    /* Hai ô đầu: khối 2 ở tuần hiện tại, khối 3 ở tuần khác. "Còn phải chấm" ép mở hàng còn bài (không đụng hàng đã xong — Q4). */
    const k = data.laTuanNay ? 'k2' : 'k3';
    setMoKhoi((m) => ({ ...m, [k]: true }));
    if (o === 'con-phai-cham') {
      const ep = (data.laTuanNay ? k2Tab : lopTab).filter((l) => l.conBai > 0).map(khoaHang);
      setEpMo((s) => new Set([...s, ...ep]));
      if (data.laTuanNay) setMoXong((s) => new Set([...s, ...ep]));
    }
    cuon(data.laTuanNay ? 'lich-test-k2' : 'lich-test-k3');
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <Skeleton rows={6} />;
  if (data.scopeEmpty) return <div className="card"><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></div>;

  const maTuan = data.tuan ? tuanLich(data.tuan.weekStart, homNay) : t('Tuần này');
  const tenTuan = data.laTuanNay ? t('Tuần này') : maTuan;
  const trong = data.lop.length === 0 && data.no.length === 0 && !(data.chamTuanNay ?? []).length && !dongMo;
  /* OV-14b (14): khung đang chọn (vd `loai=thuong`) không có lớp ở khối nào mà khung kia có → rỗng + nút chuyển khung (không tự nhảy). */
  const khungKhac: Loai | null = loai && dem[loai] === 0 ? (loai === 'ft' ? 'thuong' : 'ft') : null;
  const tenKhung = (k: Loai) => (k === 'ft' ? 'Fast Track' : t('Lớp thường'));
  /* OV-11e (TE-7): badge khối của người có phân công = phần của họ (cùng số dải số). */
  const conCua = (l: LopLichTest) => (l.phan ? l.conBaiCuaToi : l.conBai);
  const conBai = (ds: LopLichTest[]) => ds.reduce((n, l) => n + conCua(l), 0);
  /* UX-1: "n lớp" chỉ đếm lớp CÒN bài (cùng số bài của badge), lớp đã xong ghi riêng. */
  const soLop = (ds: LopLichTest[]) => {
    const d = demLopConBai(ds.map((l) => ({ classId: l.classId, con: conCua(l) })));
    return d.con ? `${t('{n} lớp còn bài', { n: d.con })}${d.xong ? ` · ${t('{n} xong', { n: d.xong })}` : ''}` : t('{n} lớp xong', { n: d.xong });
  };
  /* Tuần chính của khối (hàng của tuần khác ghi Đợt kèm mã tuần): khối 2 = tuần trước, khối 3 = tuần đang xem. */
  const tuanXem = data.tuan?.weekStart ?? '';
  const hangLop = (ds: LopLichTest[], khoi2: boolean) => (
    <HangLop lop={ds} moCua={moCua(khoi2)} onMo={doiMo(khoi2)} coChiNhanh={branchCount > 1 && !branchId} hep={hep} homNay={homNay}
      tuanChinh={khoi2 && tuanXem ? addDaysIso(tuanXem, -7) : tuanXem} kieuQuaHan={khoi2 ? 'badge' : undefined} urlClassId={urlClassId} urlKn={urlKn}
      conTro={conTro} onDaLuu={baoDaLuu} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu} />
  );
  /* Khối 2 / khối 3 (hàng lớp): khối rỗng vẫn hiện tiêu đề + 0, không mở được (D1). */
  const khoiLop = (id: string, k: 'k2' | 'k3', tieuDe: string, ds: LopLichTest[], phuThem?: ReactNode) => (
    <div id={id} className="card overflow-clip p-0" data-hd={k === 'k2' ? 'lich-test-tuan' : undefined}>
      <KhoiNhom id={`${id}-than`} phang rong={!ds.length} mo={moKhoi[k] && ds.length > 0} onMo={() => thuKhoi(k)} nhan={tieuDe} tieuDe={tieuDe}
        dem={conBai(ds)} phu={ds.length ? <>{soLop(ds)}{phuThem}</> : undefined}>
        {hangLop(ds, k === 'k2')}
      </KhoiNhom>
    </div>
  );

  /* Khối "Test chấm tuần này": hạn chấm mặc định = thứ Tư tuần này (xám trước · vàng đúng hôm đó · đỏ từ thứ Năm). */
  const hanT4 = homNay ? addDaysIso(mondayOfDate(homNay), 2) : null;
  const chipHan = hanT4 && homNay && (
    homNay < hanT4 ? <Nhan tone="muted">{t('hạn {ngan}', { ngan: ngay(hanT4, homNay) })}</Nhan>
      : homNay === hanT4 ? <Nhan tone="soon">{t('hạn hôm nay')}</Nhan>
        : <Nhan tone="late">{t('Quá hạn')} · {ngay(hanT4, homNay)}</Nhan>
  );
  const phuK2 = <> · {t('bài thi {tuan}', { tuan: tuanLich(addDaysIso(tuanXem, -7), homNay) })} {chipHan}</>;

  /* Các phần của hàng lọc — máy tính xếp một hàng, điện thoại gom vào khối "Lọc". */
  const tuanPicker = (
    <WeekPicker periodId={periodParam ?? data.tuan?.id ?? null} label={t('Tuần')}
      onPeriod={(id) => datThamSo({ periodId: id ? String(id) : null })} />
  );
  const congTacKhung = (dem.ft > 0 || dem.thuong > 0) && (
    <CongTacKhung trang="lich-test" value={loai ?? 'tat-ca'} coTatCa dem={{ ...dem, 'tat-ca': dem.ft + dem.thuong }} donVi={dienThoai ? '' : t('lớp')}
      onChange={(k) => datThamSo({ loai: k })} />
  );
  const nutLuatLuoi = loai !== 'ft' && dem.thuong > 0 && (
    <span className="inline-flex min-h-[44px] items-center sm:min-h-[32px]">
      <NutLuat label={t('Luật lưới lớp thường')}>
        <span className="block">
          {t('Mỗi ô hai số: số câu đúng / tổng số câu')}{monThangDiem.length ? t(' ({x} chấm theo thang điểm thì điểm đạt / tổng\n          điểm)', { x: monThangDiem.join(', ') }) : ''}{t('. Ô tổng đầu cột + nút ↓ điền nhanh cả cột; em làm đề khác thì sửa riêng ô đó — viền vàng khi khác tổng của cột.')}
        </span>
        <span className="block">{t('Dưới 70% là chưa đạt (tô đỏ nhẹ). Thiếu điểm khác chưa đạt.')}</span>
        <span className="block">{t('Gõ "-" khi em vắng: môn đó tự dời sang tuần sau, môn khác không đổi.')}</span>
      </NutLuat>
    </span>
  );
  const nhomPhamVi = data.coPhamViRong && (
    <div className="inline-flex overflow-hidden rounded-md border" role="group" aria-label={t('Lớp')}
      style={{ borderColor: 'var(--line-strong)' }}>
      {([['cua-toi', t('Lớp tôi dạy')], ['tat-ca', t('Tất cả')]] as const).map(([k, nhan]) => (
        <button key={k} type="button" aria-pressed={data.phamVi === k}
          onClick={() => datThamSo({ phamVi: k })}
          className={`min-h-[44px] px-3 text-xs font-semibold sm:min-h-[36px] ${data.phamVi === k
            ? 'bg-[color:var(--accent-soft)] text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
          {nhan}
        </button>
      ))}
    </div>
  );
  const nutXuat = session?.nav?.xuatMt && (
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoXuat(true)}>{t('Xuất Excel')}</button>
  );
  const locChiNhanh = <BranchFilter branchId={branchId} onBranch={(id) => datThamSo({ cn: id ? String(id) : null, branchId: null })} />;
  /* Số lựa chọn đang KHÁC mặc định: chi nhánh đã chọn, phạm vi "Tất cả" (máy chủ mặc định 'cua-toi' khi GV có lớp). */
  const soLoc = (branchId ? 1 : 0) + (data.coPhamViRong && data.phamVi !== 'cua-toi' ? 1 : 0);
  const coGiTrongLoc = branchCount > 1 || !!data.coPhamViRong || !!nutLuatLuoi || !!session?.nav?.xuatMt;

  return (
    <div className="space-y-3">
      {dienThoai ? (
        <div className="space-y-2">
          <div className="w-full">{tuanPicker}</div>
          <div className="flex items-center gap-2">
            {congTacKhung}
            <div className="flex-1" />
            {coGiTrongLoc && (
              <button ref={nutLoc} type="button" className="btn btn-sm min-h-[44px] shrink-0" aria-expanded={moLoc}
                onClick={() => setMoLoc((v) => !v)}>
                {t('Lọc')}{soLoc ? ` · ${soLoc}` : ''} <IconGap mo={moLoc} />
              </button>
            )}
          </div>
          {moLoc && coGiTrongLoc && (
            <div className="card grid gap-3 p-3">
              {locChiNhanh}
              {nhomPhamVi}
              {nutLuatLuoi}
              {nutXuat}
            </div>
          )}
        </div>
      ) : (
        /* Hàng lọc — một hàng; < 768px tự xuống dòng. */
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[26rem] max-w-full">{tuanPicker}</div>
          {congTacKhung}
          {nutLuatLuoi}
          {nhomPhamVi}
          <div className="flex-1" />
          {nutXuat}
          {locChiNhanh}
        </div>
      )}
      {urlClassId && (
        <div>
          <button type="button" onClick={() => datThamSo({ classId: null, kn: null })} title={t('Bỏ lọc lớp')}
            className="nut-loc nut-loc-dang">
            {t('Đang lọc: lớp')}{' '}{data.lopDangLoc?.code ?? `#${urlClassId}`} <span aria-hidden>✕</span>
          </button>
        </div>
      )}

      {khungKhac && dem[khungKhac] > 0 && !trong ? (
        <div className="card">
          <Empty title={t('{khung} · {maTuan} không có Test nào', { khung: tenKhung(loai!), maTuan })}
            action={<button type="button" className="btn btn-sm" onClick={() => datThamSo({ loai: khungKhac })}>{tenKhung(khungKhac)} · {t('{n} lớp', { n: dem[khungKhac] })} ›</button>} />
        </div>
      ) : trong ? (
        <div className="card">
          <Empty title={t('{maTuan} không có Test nào', { maTuan })}
            hint={session?.nav?.testPlan ? t('Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch.') : t('Đổi tuần ở trên để xem tuần khác.')} />
        </div>
      ) : (
        <>
          {/* UX-2 (1): ô "Quá hạn chấm" lấy từ `/cham/lich-test/qua-han`, theo khung đang xem (OV-14b) như hai ô đầu. */}
          <DaiSo tq={((tq) => ({ ...tq, no: { bai: quaHan?.n ?? 0, lop: quaHan?.lop ?? 0 }, khac: { ...tq.khac, no: quaHan?.khac ?? 0 } }))(loai ? data.tongQuanKhung[loai] : data.tongQuan)}
            tenTuan={tenTuan} onBam={bamSo} dangTaiNo={!quaHan} />
          <DanhSachNguon nguon={`/cham/lich-test/qua-han?${qsQuaHan}&rows=1`} tieuDe={t('Quá hạn chấm')} open={moQuaHan} onClose={() => setMoQuaHan(false)} />
          <KhoiNo no={noTab} mo={moKhoi.k1} onMo={() => thuKhoi('k1')}
            dongMo={dongMo && (!loai || loaiCua(dongMo.d) === loai) ? dongMo : null} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu}
            onMoDong={(d, viTri) => {
              /* Dòng đang mở còn ô chưa lưu: đóng nó là mất giá trị đã gõ — hỏi trước. */
              const n = dongMo ? chuaLuu[`no:${dongMo.d.key}`] ?? 0 : 0;
              if (n > 0 && !window.confirm(t('Lớp {classCode} còn {chuOChuaLuu}. Đóng lưới thì mất các giá trị đó — vẫn đóng?', { classCode: dongMo!.d.classCode, chuOChuaLuu: chuOChuaLuu(n) }))) return;
              setDongMo(d ? { d, viTri, conTro: true } : null);
            }}
            hep={hep} homNay={homNay} onDaLuu={baoDaLuu} knUrl={dongMo?.d.classId === urlClassId ? urlKn : null} />
          {data.laTuanNay && khoiLop('lich-test-k2', 'k2', t('Test chấm tuần này'), k2Tab, phuK2)}
          {khoiLop('lich-test-k3', 'k3', data.laTuanNay ? t('Lịch Test tuần này') : t('Lịch Test {maTuan}', { maTuan }), lopTab, data.laTuanNay ? <> · {maTuan}</> : undefined)}
        </>
      )}
      {moXuat && data.tuan && (
        <NganXuatMt khung={loai ?? 'ft'} chiNhanh={branchId} lop={urlClassId ? { id: urlClassId, ma: data.lopDangLoc?.code ?? `#${urlClassId}` } : null}
          thoiGianMacDinh={{ kieu: 'tuan', tu: tuanDauThangCua(data.tuan.weekStart), den: data.tuan.weekStart }} onDong={() => setMoXuat(false)} />
      )}
      {/* PR-MT (K2-32): nhắc MỜ — không số đỏ, không vào dải số hay Nợ, không hạn. Chỉ GVCN của lớp / Quản lý thấy. */}
      {data.nhacLichSu.length > 0 && (
        <div className="space-y-1 px-1">
          {/* OV-11e (TE-8): mỗi lượt một link → Điểm theo lớp đúng lượt, "Chỉ ô còn trống"; số em = số hàng ở đó. */}
          {data.nhacLichSu.map((n) => (
            <p key={n.classId} className="m-0 text-[12.5px] text-slate-500 tabular-nums">
              {t('MT cũ chưa nhập · {classCode}', { classCode: n.classCode })}
              {n.luot.map((x) => (
                <Fragment key={x.so}>
                  {' · '}
                  <Link to={x.href} className="link inline-flex min-h-[44px] items-center sm:min-h-0" aria-label={t('Nhập MT{so} cũ lớp {classCode}', { so: x.so, classCode: n.classCode })}>
                    MT{x.so} · {x.soEm} em
                  </Link>
                </Fragment>
              ))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
