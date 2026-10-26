import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useGopTaiLai } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useTenTrang } from '../../lib/quayLai.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, phamViCoHaiKhung } from '../../ui/CongTacKhung.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useManHinhHep } from '../cham/LuoiChamLop.tsx';
import { chuOChuaLuu, khungLichTestMacDinh, tuanLich, thangKeTiep } from '@shared/domain/index.ts';
import { khoaHang, type DongNo, type LichTest, type LopLichTest } from './lichTest/kieu.ts';
import { DaiSo, type OSo } from './lichTest/DaiSo.tsx';
import { KhoiNo } from './lichTest/KhoiNo.tsx';
import { HangLop } from './lichTest/HangLop.tsx';
import { NhomDau } from './lichTest/NhomDau.tsx';
import { dangMo, docMo, ghiMo } from './lichTest/moLop.ts';
import { NganXuatMt } from './NganXuatMt.tsx';
import { DanhSachNguon } from '../../ui/OSo.tsx';
import { t } from '@shared/i18n/index.ts';

type Loai = 'ft' | 'thuong';
/* PR-MT0: MT0 chấm band nhưng ở lớp thường → khung Lớp thường (cùng luật `khungDong` máy chủ). */
const loaiCua = (l: { mode: LopLichTest['mode']; kind?: string | null }): Loai => (l.mode === 'ielts_band' && l.kind !== 'mt0' ? 'ft' : 'thuong');

/**
 * TEST › LỊCH TUẦN (UI-LICH-TUAN, `thiet-ke/v5/dieu-chinh-cuoi.html` khu a; C13 một tuần + ‹ ›; gốc PR-UX1 / PR-LT3) — MỘT thẻ:
 *
 *   thanh tuần   ‹ W3 SEP 14/09 – 20/09 › · chip Tất cả · Fast Track · n · Lớp thường · n · (Lớp tôi dạy | Tất cả · chi nhánh) · Xuất Excel · Lịch thi thật ›
 *   dải số       n/m bài đã chấm · n bài còn chấm · n bài quá hạn — tuần đang xem (quá hạn theo hôm nay); bấm mở đúng tập
 *   ▸ Quá hạn chấm   theo hôm nay, không đổi khi đổi tuần; thu sẵn; mở dòng → lưới tại chỗ chỉ các em còn nợ
 *   ▸ Test tuần này  hàng lớp gọn một dòng (lớp · HV theo lượt · kỹ năng · tiến độ · hạn dd/mm · trạng thái · ↗ hồ sơ lớp); mở lớp → bảng
 *                    từng HV làm Test trong tuần (MT của em · L R W1 W2 W S · kỳ vọng · Overall · kết quả), sửa điểm tại chỗ theo quyền,
 *                    S Ex là dòng phụ của em (10 mục 6)
 *
 * Bỏ "ba khối" cũ (khối 2 "Test chấm tuần này" = tuần trước: xem bằng ‹). Mọi trạng thái trên đường dẫn (replace): `periodId`, `branchId`,
 * `phamVi`, `loai`, `classId`, `kn` — F5 và Back giữ đúng chỗ. Máy chủ trả đủ trong MỘT lời gọi.
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

  /* Hàng đang mở: nhớ theo tuần xem (localStorage, khoá `khoaHang`) + hàng bị "ép mở" bởi đường dẫn / dải số. */
  const tuanId = data?.tuan?.id ?? null;
  useTenTrang(null, data?.tuan ? tuanLich(data.tuan.weekStart, homNay) : null);   // PR-OV5b: "‹ Lịch Test · W2 OCT"
  const [nho, setNho] = useState<Record<string, boolean>>({});
  const [epMo, setEpMo] = useState<Set<string>>(new Set());
  const [conTro, setConTro] = useState<Set<string>>(new Set());
  const [moKhoi, setMoKhoi] = useState({ k1: false, k3: true });
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

  /* Khởi tạo MỘT LẦN cho mỗi (tuần, lớp đang lọc): Quá hạn chấm thu, Test tuần này mở; hàng đã nhớ; rồi lối vào từ đường dẫn (`classId`,
     `kn` — Việc cần làm, badge, chuông, `/nhap-diem/*` cũ): dòng Quá hạn khớp → mở nhóm đó + lưới dòng đó; không thì ép mở hàng lớp của tuần. */
  const daKhoiTao = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.tuan) return;
    const khoa = `${nguoiId ?? 0}|${data.tuan.id}|${urlClassId ?? ''}`;
    if (daKhoiTao.current === khoa) return;
    daKhoiTao.current = khoa;
    setNho(docMo(nguoiId, data.tuan.id));
    const khoi = { k1: false, k3: true };
    const khopKn = (k: string) => !!urlKn && (k === urlKn || (urlKn === 'writing' && k.startsWith('writing')));
    const noCuaLop = urlClassId ? data.no.filter((d) => d.classId === urlClassId) : [];
    const hang3 = urlClassId ? data.lop.filter((l) => l.classId === urlClassId) : [];
    const noDau = noCuaLop.find((d) => d.kyNang.some(khopKn))
      ?? (urlKn && hang3.length ? undefined : noCuaLop.find((d) => d.cuaToi) ?? (hang3.length ? undefined : noCuaLop[0]));
    let ep: string[] = [];
    if (noDau) {
      setDongMo({ d: noDau, viTri: data.no.indexOf(noDau), conTro: true });
      khoi.k1 = true;
    } else {
      setDongMo(null);
      ep = hang3.map(khoaHang);
    }
    setMoKhoi(khoi);
    setEpMo(new Set(ep)); setConTro(new Set(ep));
  }, [data, urlClassId, urlKn, nguoiId]);

  /* Mockup khu a: chỉ lớp ĐẦU TIÊN còn bài (của người xem — `moSan` máy chủ) tự mở; lớp khác thu, người dùng mở thì nhớ theo tuần.
     R1-LUU-TIEP: lớp tự mở GIỮ mở khi vừa chấm xong (không tự nhảy lớp — hộp báo "Đã xong phần của bạn" + "Lớp tiếp: {mã} ›"). */
  const dauGiu = useRef<{ tuan: number | null; key: string } | null>(null);
  const moCua = (l: LopLichTest) => {
    let dau = dauGiu.current?.tuan === tuanId && lopTab.some((x) => khoaHang(x) === dauGiu.current!.key) ? dauGiu.current.key : null;
    if (dau === null) {
      const x = lopTab.find((y) => y.moSan);   // gọi lúc vẽ — `lopTab` (theo khung đang xem) đã có
      dau = x ? khoaHang(x) : null;
      dauGiu.current = dau ? { tuan: tuanId, key: dau } : null;
    }
    return dangMo({ key: khoaHang(l), moSan: khoaHang(l) === dau }, nho, epMo);
  };
  /* "Lớp tiếp: {mã} ›" (hộp nhập điểm hết phần của người xem): thu lớp vừa xong, mở lớp kế, con trỏ vào ô trống đầu. */
  const lopTiep = (cu: LopLichTest, ke: LopLichTest) => {
    const moi = { ...nho, [khoaHang(cu)]: false, [khoaHang(ke)]: true };
    setNho(moi);
    if (tuanId) ghiMo(nguoiId, tuanId, moi);
    setConTro((s) => new Set(s).add(khoaHang(ke)));
    if (epMo.has(khoaHang(cu))) setEpMo((s) => { const n = new Set(s); n.delete(khoaHang(cu)); return n; });
  };
  const doiMo = (l: LopLichTest) => {
    const k = khoaHang(l);
    const dangMoHang = moCua(l);
    if (!dangMoHang) setConTro((s) => new Set(s).add(k));
    const moi = { ...nho, [k]: !dangMoHang };
    setNho(moi);
    if (tuanId) ghiMo(nguoiId, tuanId, moi);
    if (epMo.has(k)) setEpMo((s) => { const n = new Set(s); n.delete(k); return n; });
  };

  /* Số lớp theo khung = lớp có ở BẤT KỲ khối nào (khung không có gì thì công tắc không mời chọn nó). */
  const tatCaHang = useMemo(() => [...(data?.no ?? []), ...(data?.lop ?? [])], [data]);
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
  const lopTab = theoKhung(data?.lop ?? []);
  /* Thu một khối là bỏ lưới đang mở trong đó — còn ô chưa lưu thì hỏi trước (Q14). */
  const thuKhoi = (k: 'k1' | 'k3') => {
    if (!moKhoi[k]) { setMoKhoi((m) => ({ ...m, [k]: true })); return; }
    const khoa = k === 'k1' ? (dongMo ? [`no:${dongMo.d.key}`] : []) : lopTab.map(khoaHang);
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
    /* UX-2 (1): "bài quá hạn" mở DANH SÁCH đúng các ô đã đếm. Hai ô đầu → nhóm Test tuần này; "còn chấm" ép mở hàng còn bài. */
    if (o === 'no') { setMoQuaHan(true); return; }
    setMoKhoi((m) => ({ ...m, k3: true }));
    if (o === 'con-phai-cham') setEpMo((s) => new Set([...s, ...lopTab.filter((l) => l.conBai > 0).map(khoaHang)]));
    cuon('lich-test-k3');
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <Skeleton rows={6} />;
  if (data.scopeEmpty) return <div className="card"><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></div>;

  const maTuan = data.tuan ? tuanLich(data.tuan.weekStart, homNay) : t('Tuần này');
  const trong = data.lop.length === 0 && data.no.length === 0 && !dongMo;
  /* OV-14b (14): khung đang chọn (vd `loai=thuong`) không có lớp mà khung kia có → rỗng + nút chuyển khung (không tự nhảy). */
  const khungKhac: Loai | null = loai && dem[loai] === 0 ? (loai === 'ft' ? 'thuong' : 'ft') : null;
  const tenKhung = (k: Loai) => (k === 'ft' ? 'Fast Track' : t('Lớp thường'));
  /* R1-PHAN-CAP-TEST (M2 A2): "5 lớp · 15/39 bài đã chấm" — số bài cùng nguồn ô "bài đã chấm" của dải số (theo khung đang xem). */
  const tqKhung = loai ? data.tongQuanKhung[loai] : data.tongQuan;
  const tomTatTuan = lopTab.length
    ? t('{n} lớp · {daCham}/{tong} bài đã chấm', { n: new Set(lopTab.map((l) => l.classId)).size, daCham: tqKhung.daCham, tong: tqKhung.tong }) : t('Không có Test');

  const tuanPicker = (
    <WeekPicker gon periodId={periodParam ?? data.tuan?.id ?? null} onPeriod={(id) => datThamSo({ periodId: id ? String(id) : null })} />
  );
  const congTacKhung = (dem.ft > 0 || dem.thuong > 0) && (
    <CongTacKhung trang="lich-test" kieu="chip" value={loai ?? 'tat-ca'} coTatCa dem={{ ...dem, 'tat-ca': dem.ft + dem.thuong }}
      onChange={(k) => datThamSo({ loai: k })} />
  );
  const nhomPhamVi = data.coPhamViRong && (
    <div className="inline-flex overflow-hidden rounded-md border" role="group" aria-label={t('Lớp')}
      style={{ borderColor: 'var(--line-strong)' }}>
      {([['cua-toi', t('Lớp tôi dạy')], ['tat-ca', t('Tất cả')]] as const).map(([k, nhan]) => (
        <button key={k} type="button" aria-pressed={data.phamVi === k}
          onClick={() => datThamSo({ phamVi: k })}
          className={`min-h-[44px] px-3 text-xs font-semibold sm:min-h-8 ${data.phamVi === k
            ? 'bg-[color:var(--accent-soft)] text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
          {nhan}
        </button>
      ))}
    </div>
  );
  const nutXuat = session?.nav?.xuatMt && (
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoXuat(true)}>{t('Xuất Excel')}</button>
  );
  /* OV-15f: lối vào Học viên & Lớp › Lịch thi (rà soát thi thật), tháng kế tiếp; mang theo chi nhánh đang lọc. */
  const nutLichThi = session?.nav?.students && (
    <Link className="link inline-flex min-h-[44px] items-center whitespace-nowrap text-[13px] sm:min-h-0" data-hd="test-lich-thi-that"
      to={`/hoc-vien?view=lich-thi&thang=${thangKeTiep(homNay)}${branchId ? `&cn=${branchId}` : ''}`}>{t('Lịch thi thật ›')}</Link>
  );
  const locChiNhanh = <BranchFilter branchId={branchId} onBranch={(id) => datThamSo({ cn: id ? String(id) : null, branchId: null })} />;
  /* Số lựa chọn đang KHÁC mặc định: chi nhánh đã chọn, phạm vi "Tất cả" (máy chủ mặc định 'cua-toi' khi GV có lớp). */
  const soLoc = (branchId ? 1 : 0) + (data.coPhamViRong && data.phamVi !== 'cua-toi' ? 1 : 0) + (loaiParam ? 1 : 0);
  const coGiTrongLoc = branchCount > 1 || !!data.coPhamViRong || !!session?.nav?.xuatMt;

  return (
    <div className="space-y-3">
      <div className="card overflow-clip p-0">
        {/* Thanh tuần — máy tính một hàng (tự xuống dòng < 1024); điện thoại: tuần + chip, phần còn lại gom vào "Lọc". */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--line)] px-3 py-3 sm:px-4">
          {tuanPicker}
          {!dienThoai && <span className="ml-1 inline-flex flex-wrap items-center gap-2">{congTacKhung}{nhomPhamVi}</span>}
          {!dienThoai && locChiNhanh}
          <span className="ml-auto inline-flex items-center gap-3">
            {!dienThoai && nutXuat}
            {nutLichThi}
            {dienThoai && (coGiTrongLoc || !!congTacKhung) && (
              <button ref={nutLoc} type="button" className="btn btn-sm min-h-[44px] shrink-0" aria-expanded={moLoc}
                onClick={() => setMoLoc((v) => !v)}>
                {t('Lọc')}{soLoc ? ` · ${soLoc}` : ''} <IconGap mo={moLoc} />
              </button>
            )}
          </span>
          {/* Mockup 375: chip khung, phạm vi, chi nhánh, Xuất Excel gom vào "Lọc". */}
          {dienThoai && moLoc && (
            <div className="grid w-full gap-3 pt-1">
              {congTacKhung}
              {locChiNhanh}
              {nhomPhamVi}
              {nutXuat}
            </div>
          )}
          {urlClassId && (
            <div className="w-full">
              <button type="button" onClick={() => datThamSo({ classId: null, kn: null })} title={t('Bỏ lọc lớp')}
                className="nut-loc nut-loc-dang">
                {t('Đang lọc: lớp')}{' '}{data.lopDangLoc?.code ?? `#${urlClassId}`} <span aria-hidden>✕</span>
              </button>
            </div>
          )}
        </div>

        {khungKhac && dem[khungKhac] > 0 && !trong ? (
          <Empty title={t('{khung} · {maTuan} không có Test nào', { khung: tenKhung(loai!), maTuan })}
            action={<button type="button" className="btn btn-sm" onClick={() => datThamSo({ loai: khungKhac })}>{tenKhung(khungKhac)} · {t('{n} lớp', { n: dem[khungKhac] })} ›</button>} />
        ) : trong ? (
          <Empty title={t('{maTuan} không có Test nào', { maTuan })}
            hint={session?.nav?.testPlan ? t('Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch.') : t('Đổi tuần ở trên để xem tuần khác.')} />
        ) : (
          <>
            {/* UX-2 (1): ô "bài quá hạn" lấy từ `/cham/lich-test/qua-han`, theo khung đang xem (OV-14b) như hai ô đầu. */}
            <DaiSo tq={{ ...tqKhung, no: { bai: quaHan?.n ?? 0, lop: quaHan?.lop ?? 0 }, khac: { ...tqKhung.khac, no: quaHan?.khac ?? 0 } }}
              onBam={bamSo} dangTaiNo={!quaHan} />
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
            {/* M2 A2: khe 10 px nền thẻ giữa hai thanh nhóm. */}
            <div id="lich-test-k3" data-hd="lich-test-tuan" className="pt-2.5">
              <NhomDau id="lich-test-k3-than" rong={!lopTab.length} mo={moKhoi.k3 && lopTab.length > 0} onMo={() => thuKhoi('k3')}
                tieuDe={data.laTuanNay ? t('Test tuần này') : t('Test {maTuan}', { maTuan })} phu={tomTatTuan}>
                {/* shortcut: lượt S Ex của em ở lớp không có Test tuần đó không có hàng lớp để hiện (xem ở Kế hoạch Test) — thêm hàng riêng nếu chủ SP cần. */}
                <HangLop lop={lopTab} moCua={moCua} onMo={doiMo} onLopTiep={lopTiep} coChiNhanh={branchCount > 1 && !branchId} hep={hep}
                  urlClassId={urlClassId} urlKn={urlKn} conTro={conTro} onDaLuu={baoDaLuu} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu} sEx={data.sEx} />
              </NhomDau>
            </div>
          </>
        )}
      </div>
      {moXuat && data.tuan && (
        <NganXuatMt khung={loai ?? 'ft'} chiNhanh={branchId} lop={urlClassId ? { id: urlClassId, ma: data.lopDangLoc?.code ?? `#${urlClassId}` } : null}
          thoiGianMacDinh={{ kieu: 'tuan', tu: data.tuan.weekStart, den: data.tuan.weekStart }}   /* SL1 (V3B-07 #6): đúng tuần đang xem, không từ đầu tháng */ onDong={() => setMoXuat(false)} />
      )}
      {/* PR-MT (K2-32): nhắc MỜ — không số đỏ, không vào dải số hay Nợ, không hạn. Chỉ GVCN của lớp / Quản lý thấy. */}
      {data.nhacLichSu.length > 0 && (
        <div className="space-y-1 px-1">
          {/* OV-11e (TE-8): mỗi lượt một link → Điểm theo lớp đúng lượt, "Chỉ ô còn trống"; số em = số hàng ở đó. */}
          {data.nhacLichSu.map((n) => (
            <p key={n.classId} className="m-0 text-[13px] text-slate-500 tabular-nums">
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
