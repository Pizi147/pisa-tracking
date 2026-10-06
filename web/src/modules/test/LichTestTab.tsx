import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useGopTaiLai } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
import { useManHinhHep } from '../cham/LuoiChamLop.tsx';
import { chuOChuaLuu, tenMon, tuanDauThangCua, tuanLich } from '@shared/domain/index.ts';
import { khoaHang, type DongNo, type LichTest, type LopLichTest } from './lichTest/kieu.ts';
import { DaiSo, type OSo } from './lichTest/DaiSo.tsx';
import { KhoiNo } from './lichTest/KhoiNo.tsx';
import { HangLop } from './lichTest/HangLop.tsx';
import { dangMo, docMo, ghiMo } from './lichTest/moLop.ts';
import { NganXuatMt } from './NganXuatMt.tsx';

type Loai = 'ft' | 'thuong';
const loaiCua = (l: { mode: LopLichTest['mode'] }): Loai => (l.mode === 'ielts_band' ? 'ft' : 'thuong');

/**
 * TEST › LỊCH TEST (PR-UX1, mockup 13 phương án B; PR-LT3 ba khối, mockup lich-test-ba-khoi 06/10) — chấm ngay tại chỗ.
 *
 *   hàng lọc   tuần · "Lớp tôi dạy | Tất cả" (chỉ khi hai tập khác nhau) · chi nhánh · chip "Đang lọc: lớp …"
 *   dải số     Tuần này đã chấm x/y · Còn phải chấm · Quá hạn chấm n · m lớp — bấm được (G-10, Q1)
 *   khối 1     Test quá hạn chấm — theo hôm nay, không đổi khi đổi tuần; bấm Nhập điểm mở lưới ngay dưới dòng (mục con)
 *   khối 2     Test chấm tuần này — chỉ khi xem tuần hiện tại; lớp đã chấm xong thu gọn, chữ nhạt, cuối (Q4)
 *   khối 3     Lịch Test tuần này / Lịch Test W1 OCT (tuần khác: mở sẵn — Q2)
 *   công tắc   Fast Track · n lớp | Lớp thường · n lớp ở HÀNG LỌC (MH4, K4-05) — áp cho dải số và ba khối;
 *              nhớ theo máy, `loai` trên đường dẫn thắng; chỉ một khung có lớp thì ẩn.
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
     xong KHÔNG nhớ qua lần tải lại (Q4 — luôn thu gọn), mở tay chỉ trong phiên (`moXong`). */
  const tuanId = data?.tuan?.id ?? null;
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
    setNho(docMo(nguoiId, data.tuan.id));
    setMoXong(new Set());
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
    if (laXong2(l, khoi2)) {
      setMoXong((s) => { const n = new Set(s); if (dangMoHang) n.delete(k); else n.add(k); return n; });
      return;
    }
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
  const loai: Loai | null = useMemo(() => {
    if (!data) return null;
    const co = (k: string | null | undefined): k is Loai => (k === 'ft' || k === 'thuong') && dem[k] > 0;
    if (co(loaiParam)) return loaiParam;
    const theoLop = tatCaHang.find((l) => l.classId === urlClassId);
    if (theoLop && co(loaiCua(theoLop))) return loaiCua(theoLop);
    const daNho = khungDaNho('lich-test');
    if (co(daNho)) return daNho;
    /* Khung đầu (FT → thường) có lớp tự mở, rồi khung đầu có lớp. */
    return (['ft', 'thuong'] as const).find((k) => [...(data.chamTuanNay ?? []), ...data.lop].some((l) => l.moSan && loaiCua(l) === k))
      ?? (['ft', 'thuong'] as const).find((k) => dem[k] > 0) ?? null;
  }, [data, dem, tatCaHang, loaiParam, urlClassId]);
  const theoKhung = <T extends { mode: LopLichTest['mode'] }>(ds: T[]) => ds.filter((x) => !loai || loaiCua(x) === loai);
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
    if (n > 0 && !window.confirm(`Còn ${chuOChuaLuu(n)}. Thu khối này thì mất các giá trị đó — vẫn thu?`)) return;
    setMoKhoi((m) => ({ ...m, [k]: false }));
  };

  const cuon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  const bamSo = (o: OSo) => {
    if (!data) return;
    if (o === 'no') { setMoKhoi((m) => ({ ...m, k1: true })); cuon('lich-test-no'); return; }
    /* Hai ô đầu: khối 2 ở tuần hiện tại, khối 3 ở tuần khác. "Còn phải chấm" ép mở hàng còn bài (không đụng hàng đã xong — Q4). */
    const k = data.laTuanNay ? 'k2' : 'k3';
    setMoKhoi((m) => ({ ...m, [k]: true }));
    if (o === 'con-phai-cham') {
      setEpMo((s) => new Set([...s, ...(data.laTuanNay ? k2Tab : lopTab).filter((l) => l.conBai > 0).map(khoaHang)]));
    }
    cuon(data.laTuanNay ? 'lich-test-k2' : 'lich-test-k3');
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <Skeleton rows={6} />;
  if (data.scopeEmpty) return <div className="card"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>;

  const maTuan = data.tuan ? tuanLich(data.tuan.weekStart, homNay) : 'Tuần này';
  const tenTuan = data.laTuanNay ? 'Tuần này' : maTuan;
  const trong = data.lop.length === 0 && data.no.length === 0 && !(data.chamTuanNay ?? []).length && !dongMo;
  const soLop = (ds: LopLichTest[]) => `${new Set(ds.map((l) => l.classId)).size} lớp`;
  const conBai = (ds: LopLichTest[]) => ds.reduce((n, l) => n + l.conBai, 0);
  const hangLop = (ds: LopLichTest[], khoi2: boolean) => (
    <HangLop lop={ds} moCua={moCua(khoi2)} onMo={doiMo(khoi2)} coChiNhanh={branchCount > 1 && !branchId} hep={hep} homNay={homNay}
      tuanChinh={ds[0]?.weekStart ?? ''} kieuQuaHan={khoi2 ? 'badge' : undefined} urlClassId={urlClassId} urlKn={urlKn}
      conTro={conTro} onDaLuu={baoDaLuu} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu} />
  );
  /* Khối 2 / khối 3 (hàng lớp): khối rỗng vẫn hiện tiêu đề + 0, không mở được (D1). */
  const khoiLop = (id: string, k: 'k2' | 'k3', tieuDe: string, ds: LopLichTest[]) => (
    <div id={id} className="card overflow-hidden p-0">
      <KhoiNhom id={`${id}-than`} phang rong={!ds.length} mo={moKhoi[k] && ds.length > 0} onMo={() => thuKhoi(k)} nhan={tieuDe} tieuDe={tieuDe}
        dem={conBai(ds)} phu={ds.length ? soLop(ds) : undefined}>
        {hangLop(ds, k === 'k2')}
      </KhoiNhom>
    </div>
  );

  /* Các phần của hàng lọc — máy tính xếp một hàng, điện thoại gom vào khối "Lọc". */
  const tuanPicker = (
    <WeekPicker periodId={periodParam ?? data.tuan?.id ?? null} label="Tuần"
      onPeriod={(id) => datThamSo({ periodId: id ? String(id) : null })} />
  );
  const congTacKhung = loai && (
    <CongTacKhung trang="lich-test" value={loai} dem={dem} donVi={dienThoai ? '' : 'lớp'}
      onChange={(k) => datThamSo({ loai: k === 'tat-ca' ? null : k })} />
  );
  const nutLuatLuoi = loai === 'thuong' && (
    <span className="inline-flex min-h-[44px] items-center sm:min-h-[32px]">
      <NutLuat label="Luật lưới lớp thường">
        <span className="block">
          Mỗi ô hai số: số câu đúng / tổng số câu{monThangDiem.length ? ` (${monThangDiem.join(', ')} chấm theo thang điểm thì điểm đạt / tổng
          điểm)` : ''}. Ô tổng đầu cột + nút ↓ điền nhanh cả cột; em làm đề khác thì sửa riêng ô đó — viền vàng khi
          khác tổng của cột.
        </span>
        <span className="block">Dưới 70% là chưa đạt (tô đỏ nhẹ). Thiếu điểm khác chưa đạt.</span>
        <span className="block">Gõ "-" khi em vắng: môn đó tự dời sang tuần sau, môn khác không đổi.</span>
      </NutLuat>
    </span>
  );
  const nhomPhamVi = data.coPhamViRong && (
    <div className="inline-flex overflow-hidden rounded-md border" role="group" aria-label="Lớp"
      style={{ borderColor: 'var(--line-strong)' }}>
      {([['cua-toi', 'Lớp tôi dạy'], ['tat-ca', 'Tất cả']] as const).map(([k, nhan]) => (
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
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoXuat(true)}>Xuất Excel</button>
  );
  const locChiNhanh = <BranchFilter branchId={branchId} onBranch={(id) => datThamSo({ cn: id ? String(id) : null, branchId: null })} />;
  /* Số lựa chọn đang KHÁC mặc định: chi nhánh đã chọn, phạm vi "Tất cả" (máy chủ mặc định 'cua-toi' khi GV có lớp). */
  const soLoc = (branchId ? 1 : 0) + (data.coPhamViRong && data.phamVi !== 'cua-toi' ? 1 : 0);
  const coGiTrongLoc = branchCount > 1 || !!data.coPhamViRong || loai === 'thuong' || !!session?.nav?.xuatMt;

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
                Lọc{soLoc ? ` · ${soLoc}` : ''} <IconGap mo={moLoc} />
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
          <button type="button" onClick={() => datThamSo({ classId: null, kn: null })} title="Bỏ lọc lớp"
            className="inline-flex min-h-[28px] items-center gap-1 rounded-full border px-2.5 text-xs text-slate-200"
            style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
            Đang lọc: lớp {data.lopDangLoc?.code ?? `#${urlClassId}`} <span aria-hidden>✕</span>
          </button>
        </div>
      )}

      {trong ? (
        <div className="card">
          <Empty title={`${maTuan} không có Test nào`}
            hint={session?.nav?.testPlan ? 'Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch.' : 'Đổi tuần ở trên để xem tuần khác.'} />
        </div>
      ) : (
        <>
          <DaiSo tq={loai ? data.tongQuanKhung[loai] : data.tongQuan} tenTuan={tenTuan} onBam={bamSo} />
          <KhoiNo no={noTab} mo={moKhoi.k1} onMo={() => thuKhoi('k1')}
            dongMo={dongMo && (!loai || loaiCua(dongMo.d) === loai) ? dongMo : null} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu}
            onMoDong={(d, viTri) => {
              /* Dòng đang mở còn ô chưa lưu: đóng nó là mất giá trị đã gõ — hỏi trước. */
              const n = dongMo ? chuaLuu[`no:${dongMo.d.key}`] ?? 0 : 0;
              if (n > 0 && !window.confirm(`Lớp ${dongMo!.d.classCode} còn ${chuOChuaLuu(n)}. Đóng lưới thì mất các giá trị đó — vẫn đóng?`)) return;
              setDongMo(d ? { d, viTri, conTro: true } : null);
            }}
            hep={hep} homNay={homNay} onDaLuu={baoDaLuu} knUrl={dongMo?.d.classId === urlClassId ? urlKn : null} />
          {data.laTuanNay && khoiLop('lich-test-k2', 'k2', 'Test chấm tuần này', k2Tab)}
          {khoiLop('lich-test-k3', 'k3', data.laTuanNay ? 'Lịch Test tuần này' : `Lịch Test ${maTuan}`, lopTab)}
        </>
      )}
      {moXuat && data.tuan && (
        <NganXuatMt khung={loai ?? 'ft'} chiNhanh={branchId} lop={urlClassId ? { id: urlClassId, ma: data.lopDangLoc?.code ?? `#${urlClassId}` } : null}
          thoiGianMacDinh={{ kieu: 'tuan', tu: tuanDauThangCua(data.tuan.weekStart), den: data.tuan.weekStart }} onDong={() => setMoXuat(false)} />
      )}
      {/* PR-MT (K2-32): nhắc MỜ — không số đỏ, không vào dải số hay Nợ, không hạn. Chỉ GVCN của lớp / Quản lý thấy. */}
      {data.nhacLichSu.length > 0 && (
        <div className="space-y-1 px-1">
          {data.nhacLichSu.map((n) => (
            <p key={n.classId} className="m-0 text-[12.5px] text-slate-500 tabular-nums">
              MT cũ chưa nhập · {n.soEm} em · {n.classCode}{' '}
              <Link to={n.href} className="link inline-flex min-h-[44px] items-center sm:min-h-0" aria-label={`Nhập MT cũ lớp ${n.classCode}`}>Nhập điểm</Link>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
