import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker } from '../../ui/Filters.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useManHinhHep } from '../cham/LuoiChamLop.tsx';
import { mondayOfDate, tuanLich } from '@shared/domain/index.ts';
import type { DongNo, LichTest, LopLichTest } from './lichTest/kieu.ts';
import { DaiSo, type OSo } from './lichTest/DaiSo.tsx';
import { KhoiNo } from './lichTest/KhoiNo.tsx';
import { HangLop } from './lichTest/HangLop.tsx';
import { dangMo, docMo, ghiMo } from './lichTest/moLop.ts';

type Loai = 'ft' | 'thuong';
const loaiCua = (l: LopLichTest): Loai => (l.mode === 'ielts_band' ? 'ft' : 'thuong');

/** Gộp tải lại dải số sau lần lưu cuối (Q14) — tải lại mỗi ô làm nặng Turso. */
const GOP_TAI_LAI_MS = 1500;

/**
 * TEST › LỊCH TEST (PR-UX1, mockup 13 phương án B) — gộp tab Cần chấm cũ: chấm ngay tại chỗ.
 *
 *   hàng lọc   tuần · "Lớp tôi dạy | Tất cả" (chỉ khi hai tập khác nhau) · chi nhánh · chip "Đang lọc: lớp …"
 *   dải số     đã chấm x/y · còn phải chấm · nợ tuần trước · quá hạn — bấm được (G-10)
 *   khối Nợ    bài còn nợ các tuần trước, bấm Chấm mở lưới ngay dưới dòng
 *   tab nhỏ    Fast Track · n lớp | Lớp thường · n lớp; mỗi lớp một hàng lớn thu gọn, tự mở lớp còn bài của người xem
 *
 * Mọi trạng thái nằm trên đường dẫn (replace): `periodId`, `branchId`, `phamVi`, `loai`, `classId`, `kn` — F5 và Back
 * giữ đúng chỗ. Máy chủ trả đủ trong MỘT lời gọi; không có `periodId` thì máy chủ tự lấy tuần hiện tại.
 */
export function LichTestTab() {
  const { session, branchCount } = useSession();
  const { homNay } = useNgayNghiepVu();
  const hep = useManHinhHep();
  const [params, setParams] = useSearchParams();
  const so = (k: string) => (params.get(k) ? Number(params.get(k)) : null);
  const periodParam = so('periodId');
  const branchId = so('branchId');
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
  const [dongMo, setDongMo] = useState<{ d: DongNo; viTri: number; conTro: boolean } | null>(null);

  /* Khởi tạo MỘT LẦN cho mỗi (tuần, lớp đang lọc): đọc lớp đã nhớ; lớp trên đường dẫn thì mở dòng Nợ đầu của lớp
     đó nếu có, không thì mở hàng lớp của nó. */
  const daKhoiTao = useRef<string | null>(null);
  useEffect(() => {
    if (!data?.tuan) return;
    const khoa = `${data.tuan.id}|${urlClassId ?? ''}`;
    if (daKhoiTao.current === khoa) return;
    daKhoiTao.current = khoa;
    setNho(docMo(data.tuan.id));
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
  }, [data, urlClassId]);

  const moCua = (l: LopLichTest) => dangMo(l, nho, epMo);
  const doiMo = (l: LopLichTest) => {
    const moi = { ...nho, [l.key]: !moCua(l) };
    setNho(moi);
    if (tuanId) ghiMo(tuanId, moi);
    if (epMo.has(l.key)) setEpMo((s) => { const n = new Set(s); n.delete(l.key); return n; });
    if (moi[l.key]) setConTro((s) => new Set(s).add(l.key));
  };

  const tabs = useMemo(() => {
    const dem = (k: Loai) => (data?.lop ?? []).filter((l) => loaiCua(l) === k).length;
    return ([['ft', `Fast Track · ${dem('ft')} lớp`], ['thuong', `Lớp thường · ${dem('thuong')} lớp`]] as const)
      .filter(([k]) => dem(k) > 0).map(([key, label]) => ({ key: key as Loai, label }));
  }, [data?.lop]);
  const loai: Loai | null = useMemo(() => {
    if (!data) return null;
    const co = (k: Loai | null | undefined) => !!k && tabs.some((t) => t.key === k);
    if (co(loaiParam)) return loaiParam;
    const theoLop = data.lop.find((l) => l.classId === urlClassId);
    if (theoLop && co(loaiCua(theoLop))) return loaiCua(theoLop);
    /* Tab đầu (theo thứ tự tab FT → thường) có lớp tự mở, rồi tab đầu có lớp. */
    return tabs.find((t) => data.lop.some((l) => l.moSan && loaiCua(l) === t.key))?.key ?? tabs[0]?.key ?? null;
  }, [data, tabs, loaiParam, urlClassId]);
  const lopTab = (data?.lop ?? []).filter((l) => loaiCua(l) === loai);

  const cuon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  const bamSo = (o: OSo) => {
    if (!data) return;
    if (o === 'da-cham') { cuon('lich-test-lop'); return; }
    if (o === 'con-phai-cham') {
      setEpMo((s) => new Set([...s, ...lopTab.filter((l) => l.conBai > 0).map((l) => l.key)]));
      cuon('lich-test-lop'); return;
    }
    if (o === 'no') { setMoNo(true); cuon(data.no.length ? 'lich-test-no' : 'lich-test-lop'); return; }
    /* Quá hạn: khối Nợ chỉ bài quá hạn + mở các lớp tuần này có bài quá hạn. */
    setMoNo(true); setChiQuaHan(data.no.some((d) => d.quaHan));
    setEpMo((s) => new Set([...s, ...data.lop.filter((l) => l.quaHan).map((l) => l.key)]));
    cuon(data.no.some((d) => d.quaHan) ? 'lich-test-no' : 'lich-test-lop');
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <Skeleton rows={6} />;
  if (data.scopeEmpty) return <div className="card"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>;

  const laTuanNay = !!data.tuan && data.tuan.weekStart === mondayOfDate(homNay || data.tuan.weekStart);
  const tenTuan = !data.tuan ? 'Tuần này' : laTuanNay ? 'Tuần này' : `Tuần ${tuanLich(data.tuan.weekStart, homNay)}`;
  const trong = data.lop.length === 0 && data.no.length === 0 && !dongMo;

  return (
    <div className="space-y-3">
      {/* Hàng lọc — một hàng; < 768px tự xuống dòng. */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[26rem] max-w-full">
          <WeekPicker periodId={periodParam ?? data.tuan?.id ?? null} label="Tuần"
            onPeriod={(id) => datThamSo({ periodId: id ? String(id) : null })} />
        </div>
        {data.coPhamViRong && (
          <div className="inline-flex overflow-hidden rounded-md border" role="group" aria-label="Lớp"
            style={{ borderColor: 'var(--line-strong)' }}>
            {([['cua-toi', 'Lớp tôi dạy'], ['tat-ca', 'Tất cả']] as const).map(([k, nhan]) => (
              <button key={k} type="button" aria-pressed={data.phamVi === k}
                onClick={() => datThamSo({ phamVi: k })}
                className={`min-h-[36px] px-3 text-xs font-semibold ${data.phamVi === k
                  ? 'bg-[color:var(--accent-soft)] text-slate-100' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
                {nhan}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={(id) => datThamSo({ branchId: id ? String(id) : null })} />
      </div>
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
          <DaiSo tq={data.tongQuan} tenTuan={tenTuan} onBam={bamSo} />
          <KhoiNo no={data.no} mo={moNo} onMo={() => setMoNo((v) => !v)}
            chiQuaHan={chiQuaHan} onBoQuaHan={() => setChiQuaHan(false)}
            dongMo={dongMo} onMoDong={(d, viTri) => setDongMo(d ? { d, viTri, conTro: true } : null)}
            hep={hep} homNay={homNay} onDaLuu={baoDaLuu} knUrl={dongMo?.d.classId === urlClassId ? urlKn : null} />

          <div id="lich-test-lop" className="space-y-2">
            {tabs.length > 0 && loai && (
              <div className="flex items-end gap-2">
                <div className="min-w-0">
                  <HangTab cap="con" ariaLabel="Loại lớp" value={loai} tabs={tabs}
                    onChange={(k) => datThamSo({ loai: k })} />
                </div>
                {tabs.some((t) => t.key === 'thuong') && (
                  <span className="pb-2">
                    <NutLuat label="Luật lưới lớp thường">
                      <span className="block">
                        Mỗi ô hai số: số câu đúng / tổng số câu (Writing, Speaking chấm theo thang điểm thì điểm đạt / tổng
                        điểm). Ô tổng đầu cột + nút ↓ điền nhanh cả cột; em làm đề khác thì sửa riêng ô đó — viền vàng khi
                        khác tổng của cột.
                      </span>
                      <span className="block">Dưới 70% là chưa đạt (tô đỏ nhẹ). Thiếu điểm khác chưa đạt.</span>
                      <span className="block">Gõ "-" khi em vắng: môn đó tự dời sang tuần sau, môn khác không đổi.</span>
                    </NutLuat>
                  </span>
                )}
                <div className="flex-1" />
                {lopTab.length > 1 && (
                  <button type="button" className="min-h-[36px] px-1 pb-2 text-xs text-slate-400 hover:text-slate-100"
                    onClick={() => {
                      const moHet = !lopTab.every(moCua);
                      const moi = { ...nho, ...Object.fromEntries(lopTab.map((l) => [l.key, moHet])) };
                      setNho(moi); if (tuanId) ghiMo(tuanId, moi);
                      if (!moHet) setEpMo(new Set());
                    }}>
                    {lopTab.every(moCua) ? 'Thu tất cả' : 'Mở tất cả'}
                  </button>
                )}
              </div>
            )}
            {lopTab.length > 0 && data.tuan ? (
              <HangLop lop={lopTab} moCua={moCua} onMo={doiMo} coChiNhanh={branchCount > 1 && !branchId} hep={hep}
                periodId={data.tuan.id} tuanDangXem={data.tuan.weekStart} urlClassId={urlClassId} urlKn={urlKn}
                conTro={conTro} onDaLuu={baoDaLuu} />
            ) : (
              <div className="card"><Empty title={`${tenTuan} không có lượt Test nào`} hint="Bài còn nợ các tuần trước nằm ở khối trên." /></div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
