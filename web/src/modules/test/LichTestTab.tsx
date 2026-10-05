import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useManHinhHep } from '../cham/LuoiChamLop.tsx';
import { chuOChuaLuu, mondayOfDate, tenMon, tuanDauThangCua, tuanLich } from '@shared/domain/index.ts';
import type { DongNo, LichTest, LopLichTest } from './lichTest/kieu.ts';
import { DaiSo, type OSo } from './lichTest/DaiSo.tsx';
import { KhoiNo } from './lichTest/KhoiNo.tsx';
import { HangLop } from './lichTest/HangLop.tsx';
import { dangMo, docMo, ghiMo } from './lichTest/moLop.ts';
import { NganXuatMt } from './NganXuatMt.tsx';

type Loai = 'ft' | 'thuong';
const loaiCua = (l: { mode: LopLichTest['mode'] }): Loai => (l.mode === 'ielts_band' ? 'ft' : 'thuong');

/** Gộp tải lại dải số sau lần lưu cuối (Q14) — tải lại mỗi ô làm nặng Turso. */
const GOP_TAI_LAI_MS = 1500;

/**
 * TEST › LỊCH TEST (PR-UX1, mockup 13 phương án B) — gộp tab Cần chấm cũ: chấm ngay tại chỗ.
 *
 *   hàng lọc   tuần · "Lớp tôi dạy | Tất cả" (chỉ khi hai tập khác nhau) · chi nhánh · chip "Đang lọc: lớp …"
 *   dải số     đã chấm x/y · còn phải chấm · nợ tuần trước · quá hạn — bấm được (G-10)
 *   khối Nợ    bài còn nợ các tuần trước, bấm Chấm mở lưới ngay dưới dòng
 *   công tắc   Fast Track · n lớp | Lớp thường · n lớp ở HÀNG LỌC (MH4, K4-05) — áp cho dải số, khối Nợ và danh sách lớp;
 *              nhớ theo máy, `loai` trên đường dẫn thắng; chỉ một khung có lớp/nợ thì ẩn. Mỗi lớp một hàng lớn thu gọn.
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
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baoDaLuu = () => {
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => { hen.current = null; reload(); }, GOP_TAI_LAI_MS);
  };
  useEffect(() => () => { if (hen.current) clearTimeout(hen.current); }, []);

  /* Lớp đang mở: nhớ theo tuần (localStorage) + lớp bị "ép mở" bởi đường dẫn / dải số. */
  const tuanId = data?.tuan?.id ?? null;
  const [nho, setNho] = useState<Record<string, boolean>>({});
  const [epMo, setEpMo] = useState<Set<string>>(new Set());
  const [conTro, setConTro] = useState<Set<string>>(new Set());
  const [moNo, setMoNo] = useState(true);
  const [chiQuaHan, setChiQuaHan] = useState(false);
  const [moXuat, setMoXuat] = useState(false);
  const [dongMo, setDongMo] = useState<{ d: DongNo; viTri: number; conTro: boolean } | null>(null);
  /* Số ô lưu hỏng theo hàng lớp / dòng Nợ (PR-UX1) — badge của hàng nói "n ô chưa lưu" tới khi hết. */
  const [chuaLuu, setChuaLuu] = useState<Record<string, number>>({});
  const baoChuaLuu = useCallback((khoa: string, n: number) => setChuaLuu((x) => {
    if ((x[khoa] ?? 0) === n) return x;
    const moi = { ...x };
    if (n) moi[khoa] = n; else delete moi[khoa];
    return moi;
  }), []);

  /* Khởi tạo MỘT LẦN cho mỗi (tuần, lớp đang lọc): đọc lớp đã nhớ; lớp trên đường dẫn thì mở dòng Nợ đầu của lớp
     đó nếu có, không thì mở hàng lớp của nó. */
  const daKhoiTao = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.tuan) return;
    const khoa = `${nguoiId ?? 0}|${data.tuan.id}|${urlClassId ?? ''}`;
    if (daKhoiTao.current === khoa) return;
    daKhoiTao.current = khoa;
    setNho(docMo(nguoiId, data.tuan.id));
    setChiQuaHan(false);
    /* Có `kn` (Việc cần làm › Chấm): dòng Nợ có môn đó; không có thì hàng lớp tuần này; không có hàng lớp thì dòng Nợ
       đầu của lớp. Không có `kn` (badge "n bài chờ chấm"): dòng Nợ đầu (ưu tiên dòng của mình), rồi hàng lớp. */
    const khopKn = (k: string) => !!urlKn && (k === urlKn || (urlKn === 'writing' && k.startsWith('writing')));
    const noCuaLop = urlClassId ? data.no.filter((d) => d.classId === urlClassId) : [];
    const coHangLop = data.lop.some((l) => l.classId === urlClassId);
    const noDau = noCuaLop.find((d) => d.kyNang.some(khopKn))
      ?? (urlKn && coHangLop ? undefined : noCuaLop.find((d) => d.cuaToi) ?? noCuaLop[0]);
    if (noDau) {
      setDongMo({ d: noDau, viTri: data.no.indexOf(noDau), conTro: true });
      setMoNo(true);
      setEpMo(new Set()); setConTro(new Set());
    } else {
      setDongMo(null);
      const ep = new Set(urlClassId ? data.lop.filter((l) => l.classId === urlClassId).map((l) => l.key) : []);
      setEpMo(ep); setConTro(new Set(ep));
    }
  }, [data, urlClassId, nguoiId]);

  const moCua = (l: LopLichTest) => dangMo(l, nho, epMo);
  const doiMo = (l: LopLichTest) => {
    const moi = { ...nho, [l.key]: !moCua(l) };
    setNho(moi);
    if (tuanId) ghiMo(nguoiId, tuanId, moi);
    if (epMo.has(l.key)) setEpMo((s) => { const n = new Set(s); n.delete(l.key); return n; });
    if (moi[l.key]) setConTro((s) => new Set(s).add(l.key));
  };

  /* Số lớp theo khung = lớp có lượt tuần này HOẶC còn nợ tuần trước (khung không có gì thì công tắc không mời chọn nó). */
  const dem = useMemo(() => {
    const lop = (k: Loai) => new Set([...(data?.lop ?? []), ...(data?.no ?? [])].filter((x) => loaiCua(x) === k).map((x) => x.classId)).size;
    return { ft: lop('ft'), thuong: lop('thuong') };
  }, [data?.lop, data?.no]);
  const loai: Loai | null = useMemo(() => {
    if (!data) return null;
    const co = (k: string | null | undefined): k is Loai => (k === 'ft' || k === 'thuong') && dem[k] > 0;
    if (co(loaiParam)) return loaiParam;
    const theoLop = [...data.lop, ...data.no].find((l) => l.classId === urlClassId);
    if (theoLop && co(loaiCua(theoLop))) return loaiCua(theoLop);
    const daNho = khungDaNho('lich-test');
    if (co(daNho)) return daNho;
    /* Khung đầu (FT → thường) có lớp tự mở, rồi khung đầu có lớp/nợ. */
    return (['ft', 'thuong'] as const).find((k) => data.lop.some((l) => l.moSan && loaiCua(l) === k))
      ?? (['ft', 'thuong'] as const).find((k) => dem[k] > 0) ?? null;
  }, [data, dem, loaiParam, urlClassId]);
  const lopTab = (data?.lop ?? []).filter((l) => loaiCua(l) === loai);
  const noTab = (data?.no ?? []).filter((d) => !loai || loaiCua(d) === loai);
  /* Luật lưới lớp thường nói đúng tên môn chấm theo thang điểm của các lớp đang xem (BE: Writing, Speaking · FOU: Grammar +
     Vocabulary, Pronunciation) — không viết cứng. */
  const monThangDiem = [...new Set(lopTab.flatMap((l) => l.boMon
    .filter((k) => k === 'writing' || k === 'speaking').map((k) => tenMon(l.chuongTrinh, k))))];

  const cuon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  const bamSo = (o: OSo) => {
    if (!data) return;
    if (o === 'da-cham') { cuon('lich-test-lop'); return; }
    if (o === 'con-phai-cham') {
      setEpMo((s) => new Set([...s, ...lopTab.filter((l) => l.conBai > 0).map((l) => l.key)]));
      cuon('lich-test-lop'); return;
    }
    if (o === 'no') { setMoNo(true); cuon(noTab.length ? 'lich-test-no' : 'lich-test-lop'); return; }
    /* Quá hạn: khối Nợ chỉ bài quá hạn + mở các lớp tuần này có bài quá hạn. */
    setMoNo(true); setChiQuaHan(noTab.some((d) => d.quaHan));
    setEpMo((s) => new Set([...s, ...lopTab.filter((l) => l.quaHan).map((l) => l.key)]));
    cuon(noTab.some((d) => d.quaHan) ? 'lich-test-no' : 'lich-test-lop');
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <Skeleton rows={6} />;
  if (data.scopeEmpty) return <div className="card"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>;

  const laTuanNay = !!data.tuan && data.tuan.weekStart === mondayOfDate(homNay || data.tuan.weekStart);
  const tenTuan = !data.tuan ? 'Tuần này' : laTuanNay ? 'Tuần này' : `Tuần ${tuanLich(data.tuan.weekStart, homNay)}`;
  const trong = data.lop.length === 0 && data.no.length === 0 && !dongMo;

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
          <Empty title={`${tenTuan} không có lượt Test nào`}
            hint={session?.nav?.testPlan ? 'Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch.' : 'Đổi tuần ở trên để xem tuần khác.'} />
        </div>
      ) : (
        <>
          <DaiSo tq={loai ? data.tongQuanKhung[loai] : data.tongQuan} tenTuan={tenTuan} onBam={bamSo} />
          <KhoiNo no={noTab} mo={moNo} onMo={() => setMoNo((v) => !v)}
            chiQuaHan={chiQuaHan} onBoQuaHan={() => setChiQuaHan(false)}
            dongMo={dongMo && (!loai || loaiCua(dongMo.d) === loai) ? dongMo : null} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu}
            onMoDong={(d, viTri) => {
              /* Dòng đang mở còn ô chưa lưu: đóng nó là mất giá trị đã gõ — hỏi trước. */
              const n = dongMo ? chuaLuu[`no:${dongMo.d.key}`] ?? 0 : 0;
              if (n > 0 && !window.confirm(`Lớp ${dongMo!.d.classCode} còn ${chuOChuaLuu(n)}. Đóng lưới thì mất các giá trị đó — vẫn đóng?`)) return;
              setDongMo(d ? { d, viTri, conTro: true } : null);
            }}
            hep={hep} homNay={homNay} onDaLuu={baoDaLuu} knUrl={dongMo?.d.classId === urlClassId ? urlKn : null} />

          <div id="lich-test-lop" className="space-y-2">
            {lopTab.length > 1 && (
              <div className="flex justify-end">
                <button type="button" className="min-h-[44px] px-1 text-xs text-slate-400 hover:text-slate-100 sm:min-h-[36px]"
                    onClick={() => {
                      const moHet = !lopTab.every(moCua);
                      const moi = { ...nho, ...Object.fromEntries(lopTab.map((l) => [l.key, moHet])) };
                      setNho(moi); if (tuanId) ghiMo(nguoiId, tuanId, moi);
                      if (!moHet) setEpMo(new Set());
                    }}>
                    {lopTab.every(moCua) ? 'Thu tất cả' : 'Mở tất cả'}
                  </button>
              </div>
            )}
            {lopTab.length > 0 && data.tuan ? (
              <HangLop lop={lopTab} moCua={moCua} onMo={doiMo} coChiNhanh={branchCount > 1 && !branchId} hep={hep}
                periodId={data.tuan.id} tuanDangXem={data.tuan.weekStart} urlClassId={urlClassId} urlKn={urlKn}
                conTro={conTro} onDaLuu={baoDaLuu} chuaLuu={chuaLuu} baoChuaLuu={baoChuaLuu} />
            ) : (
              <div className="card"><Empty title={`${tenTuan} không có lượt Test nào`} hint="Bài còn nợ các tuần trước nằm ở khối trên." /></div>
            )}
          </div>
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
              MT lịch sử chưa nhập · {n.soEm} em · {n.classCode}{' '}
              <Link to={n.href} className="link inline-flex min-h-[44px] items-center sm:min-h-0" aria-label={`Nhập MT lịch sử lớp ${n.classCode}`}>Nhập điểm</Link>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
