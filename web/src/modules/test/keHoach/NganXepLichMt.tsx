import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { KhungPanel, Khoi } from '../../../ui/KhungPanel.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { BoLocDoan, NutChon } from '../../../ui/ui.tsx';
import { BranchFilter } from '../../../ui/Filters.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { OMt } from '../../../ui/OMt.tsx';
import { HopXacNhanHuyLich } from './HopXacNhanHuyLich.tsx';
import {
  CAU_TUAN_DA_QUA, KY_NANG_KE_HOACH, MT_TOI_DA, chuXepVuotGop, demSeXep, mondayOfDate, nhanSeXep, tenMon, tenMonNgan, tomTatXepMt, tuanLich, tuanMacDinhDotMoi,
  type DongHangLoat, type KyNangKH, type ToneSeXep,
} from '@shared/domain/index.ts';
import type { DanhSachLop, HangFT, LopKH, LuoiFTData } from './kieu.ts';
import { TuanNho, resolveTuan, type Tuan } from './TuanNho.tsx';

/** Công tắc khung ĐẦU NGĂN (M9): đổi khung = đổi thân ngăn (FT ↔ Lớp thường). Không nhớ theo máy — khung trang Kế hoạch Test giữ nguyên. */
export function KhungXepLich({ value, onChange, coFt, coThuong }: {
  value: 'ft' | 'thuong'; onChange: (k: 'ft' | 'thuong') => void; coFt: boolean; coThuong: boolean;
}) {
  if (!coFt || !coThuong) return null;
  return (
    <div className="py-2">
      <BoLocDoan<'ft' | 'thuong'> ariaLabel="Khung lớp" value={value} onChange={onChange}
        muc={[{ key: 'ft', nhan: 'Fast Track', so: null }, { key: 'thuong', nhan: 'Lớp thường', so: null }]} />
    </div>
  );
}

type Hang = HangFT & { classId: number; classCode: string };
const KY = KY_NANG_KE_HOACH;
const DAU: Record<ToneSeXep, string> = { ok: '✓', soon: '!', bad: '✕' };
const MAU_DAU: Record<ToneSeXep, string> = { ok: 'text-ok', soon: 'text-soon', bad: 'text-bad' };

/**
 * XẾP LỊCH MOCK TEST NHIỀU LỚP (mockup MT bản 4 phần 1 · M9 · T13b · T37 · K4-17/18/19 · C4) — Test › Kế hoạch Test › nút "Xếp lịch MT…",
 * ngăn rộng bên phải (điện thoại: toàn màn, chân dính). Từ trên xuống: Lọc (chi nhánh · lớp nhiều lựa chọn · tìm em) → 1 Đợt ("MT mới"
 * mặc định = mỗi em đợt kế của riêng em; hoặc MT1…) → 2 Tuần và kỹ năng (tuần chung · tick L R W S · "Lịch riêng" từng kỹ năng) → 3 Học viên
 * (chip đếm ✓ ! ✕ cũng là bộ lọc · MỘT bảng cuộn ngang, cột chọn + tên đứng yên) → chân "Đóng" / "Xếp lịch n em · m bài".
 * Cột "Sẽ xếp" do MÁY CHỦ chọn qua `viecXepMt`; web chỉ vẽ `nhanSeXep`. Xem trước / lưu gọi `/ke-hoach-test/hang-loat` MỖI LỚP một lần
 * (xem trước song song, lưu tuần tự); lưu luôn `force: true` (dòng vàng vẫn lưu); R9b: sau lưu chỉ còn em lỗi. Em dời vượt MT có điểm →
 * MỘT popup gộp (Q2). Panel này chỉ của Quản lý nên `TuanNho` không khoá tuần đã qua — chỉ báo chip vàng "Tuần đã qua".
 */
export function NganXepLichMt({ chiNhanhDau, lopDs, lopMoSan, coThuong, onDoiKhung, onClose, onDone }: {
  /** PR-NV (T9): chi nhánh trang đang lọc — giá trị đầu của ô chi nhánh trong panel. */
  chiNhanhDau: number | null; lopDs: LopKH[]; lopMoSan: number | null; coThuong: boolean; onDoiKhung: (k: 'ft' | 'thuong') => void;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const homNay = useNgayNghiepVu().homNay || null;
  /* Chi nhánh (QL một chi nhánh thì `BranchFilter` tự ẩn): danh sách lớp để "+ lớp" tải lại theo chi nhánh; lớp đã chọn giữ nguyên. */
  const [branchId, setBranchId] = useState<number | null>(chiNhanhDau);
  const dsLop = useApi<DanhSachLop>(branchId ? `/ke-hoach-test/lop?branchId=${branchId}` : null);
  const lopFT = useMemo(() => lopDs.filter((l) => l.loai === 'ft'), [lopDs]);
  const lopTheoChiNhanh = useMemo(() => (branchId ? (dsLop.data?.lop ?? []).filter((l) => l.loai === 'ft') : lopFT), [lopFT, branchId, dsLop.data]);
  const [lopChon, setLopChon] = useState<number[]>(() => {
    const dau = lopMoSan ?? lopFT.find((l) => l.canXepLai > 0 || l.chuaCoLichTiep > 0)?.id ?? lopFT[0]?.id;
    return dau ? [dau] : [];
  });
  const [themLop, setThemLop] = useState('');
  const [tim, setTim] = useState('');

  /* Lưới từng lớp đã chọn — route GET có sẵn (Q4), không route mới. */
  const [luoi, setLuoi] = useState<Map<number, LuoiFTData>>(new Map());
  const [taiLai, setTaiLai] = useState(0);
  useEffect(() => {
    let huy = false;
    Promise.all(lopChon.map((id) => api.get<LuoiFTData>(`/ke-hoach-test/ft/${id}`).then((d) => [id, d] as const)))
      .then((ds) => { if (!huy) setLuoi(new Map(ds)); })
      .catch((e) => { if (!huy) toast.push('error', e.message ?? 'Không tải được lớp.'); });
    return () => { huy = true; };
  }, [lopChon.join(','), taiLai]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Một danh sách: thứ tự lớp rồi tên (không còn nhóm "đã chọn / chưa chọn"). */
  const hangs: Hang[] = useMemo(() => lopChon.flatMap((id) => {
    const l = luoi.get(id);
    return l ? l.hang.map((h) => ({ ...h, classId: id, classCode: l.classCode })) : [];
  }).sort((a, b) => a.classCode.localeCompare(b.classCode, 'vi') || a.ten.localeCompare(b.ten, 'vi')), [luoi, lopChon]);
  const soCot = Math.min(MT_TOI_DA, Math.max(0, ...[...luoi.values()].map((l) => l.cot.length)) + 1);
  const cot = Array.from({ length: soCot }, (_, i) => i + 1);

  /* 1 Đợt: "MT mới" (mặc định) = mỗi em MỘT đợt riêng do máy chủ chọn (`dotMtMoi`); hoặc đúng đợt MT{n}. */
  const [dot, setDot] = useState<'moi' | number>('moi');

  /* 2 Tuần và kỹ năng: tuần chung (mặc định tuần tới, K4-14) · kỹ năng tick · lịch riêng (dòng nào chưa sửa tay thì theo tuần chung). */
  const [tuanChung, setTuanChung] = useState<Tuan | null>(null);
  const [rieng, setRieng] = useState<Partial<Record<KyNangKH, Tuan>>>({});
  const [kyChon, setKyChon] = useState<KyNangKH[]>([...KY]);
  const [moRieng, setMoRieng] = useState(false);
  useEffect(() => {
    if (!homNay || tuanChung) return;
    void resolveTuan(tuanMacDinhDotMoi(homNay)).then(setTuanChung).catch(() => { /* chọn tay */ });
  }, [homNay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const tuanKn = (k: KyNangKH) => rieng[k] ?? tuanChung;
  const tuanGui = useMemo(() => {
    const o: Partial<Record<KyNangKH, number>> = {};
    for (const k of kyChon) { const t = tuanKn(k); if (t) o[k] = t.periodId; }
    return o;
  }, [tuanChung, rieng, kyChon]);   // eslint-disable-line react-hooks/exhaustive-deps
  const doiKy = (k: KyNangKH, v: boolean) => setKyChon((s) => KY.filter((x) => (x === k ? v : s.includes(x))));
  const quaTuan = (t: Tuan | null | undefined) => !!homNay && !!t?.weekStart && t.weekStart < mondayOfDate(homNay);

  const [dotTheoEm, setDotTheoEm] = useState<Record<number, number>>({});
  const [thiLai, setThiLai] = useState<Record<number, KyNangKH[]>>({});
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [giuLoi, setGiuLoi] = useState<number[] | null>(null);
  const [loc, setLoc] = useState<ToneSeXep | null>(null);

  /* Xem trước MỌI em của các lớp đã chọn (để cột "Sẽ xếp" có cả em chưa tick và để tick mặc định) — mỗi lớp một lời gọi. */
  const [dong, setDong] = useState<Map<number, DongHangLoat>>(new Map());
  const [dangXem, setDangXem] = useState(false);
  /* Khoá (đợt, bộ lớp) mà `dong` đang giữ — tick mặc định chỉ đặt khi xem trước đã khớp đợt đang chọn (không dùng kết quả cũ). */
  const [khoaDong, setKhoaDong] = useState('');
  const khoaTick = `${dot}|${lopChon.join(',')}`;
  const soXem = useRef(0);
  const thanChung = { attemptNo: dot, tuan: tuanGui, kyNang: kyChon, dotTheoEm, thiLai };
  const khoaXem = JSON.stringify([dot, tuanGui, kyChon, dotTheoEm, thiLai, hangs.map((h) => h.studentId)]);
  useEffect(() => {
    if (!hangs.length || !kyChon.length || kyChon.some((k) => !tuanGui[k])) { setDong(new Map()); setDangXem(false); return; }
    const seq = ++soXem.current;
    setDangXem(true);
    const t = setTimeout(() => {
      Promise.all(lopChon.filter((id) => luoi.has(id)).map((id) => api.post<{ dong: DongHangLoat[] }>('/ke-hoach-test/hang-loat', {
        classId: id, studentIds: hangs.filter((h) => h.classId === id).map((h) => h.studentId), xemTruoc: true, ...thanChung,
      }))).then((ds) => {
        if (seq !== soXem.current) return;
        setDong(new Map(ds.flatMap((r) => r.dong).map((d) => [d.studentId, d])));
        setKhoaDong(khoaTick);
        setDangXem(false);
      }).catch(() => { if (seq === soXem.current) { setDong(new Map()); setDangXem(false); } });
    }, 300);
    return () => clearTimeout(t);
  }, [khoaXem]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Tick mặc định: mọi em có việc để làm (không phải "Không xếp được" / "Giữ nguyên") — đặt MỘT LẦN mỗi (đợt, bộ lớp); R9b không bị ghi đè. */
  const daTick = useRef<string | null>(null);
  useEffect(() => {
    if (!dong.size || khoaDong !== khoaTick || daTick.current === khoaTick || giuLoi) return;
    daTick.current = khoaTick;
    setTicked(new Set([...dong.values()].filter((d) => d.hanhDong === 'tao' || d.hanhDong === 'doi').map((d) => d.studentId)));
  }, [dong, khoaDong, khoaTick]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Dòng "Không xếp được" tự bỏ tick và không tick được: `duocTick` / `dangTick` là phép suy ra, không cần effect dọn `ticked`. */
  const duocTick = (id: number) => { const d = dong.get(id); return !!d && d.hanhDong !== 'loi'; };
  const dangTick = (id: number) => ticked.has(id) && duocTick(id);

  const khopTim = (h: Hang) => !tim.trim() || `${h.ten} ${h.ma}`.toLowerCase().includes(tim.trim().toLowerCase());
  const trongLoc = hangs.filter((h) => khopTim(h) && (!giuLoi || giuLoi.includes(h.studentId)));
  const dem = demSeXep(trongLoc.map((h) => dong.get(h.studentId)).filter((d): d is DongHangLoat => !!d));
  const hienThi = trongLoc.filter((h) => { const d = dong.get(h.studentId); return !loc || (!!d && nhanSeXep(d, null).tone === loc); });
  const tickDuoc = hienThi.filter((h) => duocTick(h.studentId));
  const soTick = tickDuoc.filter((h) => ticked.has(h.studentId)).length;
  const tatCa = tickDuoc.length > 0 && soTick === tickDuoc.length;
  const dongChon = hangs.filter((h) => dangTick(h.studentId)).map((h) => dong.get(h.studentId)).filter((d): d is DongHangLoat => !!d);
  const tt = tomTatXepMt(dongChon);
  const [busy, setBusy] = useState(false);
  /* Q2 (PR-MTb T6): MỘT popup gộp cho mọi em có lượt bị vượt CÓ ĐIỂM. Lý do giữ ở đây — mở lại (em lỗi / số điểm đổi) không mất chữ. */
  const [moGop, setMoGop] = useState(false);
  const [lyDoGop, setLyDoGop] = useState('');
  const [loiMayGop, setLoiMayGop] = useState<string | null>(null);
  const gop = chuXepVuotGop(dongChon.map((d) => ({ ten: d.ten, seHuyLich: d.seHuyLich })), tt.soEm);

  const doiTick = (id: number, v: boolean) => setTicked((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });
  const doiTatCa = (v: boolean) => setTicked((s) => { const n = new Set(s); for (const h of tickDuoc) { if (v) n.add(h.studentId); else n.delete(h.studentId); } return n; });
  const boEm = (id: number) => {
    doiTick(id, false);
    setDotTheoEm((s) => { const n = { ...s }; delete n[id]; return n; });
    setThiLai((s) => { const n = { ...s }; delete n[id]; return n; });
  };

  const luu = async (daXacNhan = false, lyDoVuot?: string) => {
    if (busy || !tt.soEm || !kyChon.length) return;
    if (gop.canPopup && !daXacNhan) { setLoiMayGop(null); setMoGop(true); return; }
    if (lyDoVuot !== undefined) setLyDoGop(lyDoVuot);
    setBusy(true); setLoiMayGop(null);
    let daLuu = 0;
    let loiMay: string | null = null;
    const loi: DongHangLoat[] = [];
    try {
      for (const id of lopChon) {
        const ids = hangs.filter((h) => h.classId === id && dangTick(h.studentId)).map((h) => h.studentId);
        if (!ids.length) continue;
        try {
          const r = await api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
            classId: id, studentIds: ids, force: true, xemTruoc: false, ...thanChung,
            /* Có điểm → đã qua popup (lý do ở popup); chưa điểm → lưu thẳng (dữ liệu vừa đổi có điểm → dòng lỗi, bấm lại sẽ thấy popup). */
            xacNhanHuyLich: daXacNhan, ...(lyDoVuot ? { lyDo: lyDoVuot } : {}),
          });
          daLuu += r.daLuu;
          loi.push(...r.dong.filter((d) => d.hanhDong === 'loi'));
        } catch (e: any) {
          loiMay = e.message ?? 'Không lưu được.';
          toast.push('error', `${luoi.get(id)?.classCode ?? 'Lớp'}: ${e.message ?? 'không lưu được'}`);
          loi.push(...ids.map((sid) => ({ studentId: sid, ten: '', hanhDong: 'loi' as const, bai: [], loi: e.message ?? 'Không lưu được.' })));
        }
      }
      /* Lỗi máy mà chưa lớp nào lưu được: popup vẫn mở, hiện lỗi, giữ chữ Lý do (chống mất dữ liệu). */
      if (daXacNhan && loiMay && daLuu === 0) { setLoiMayGop(loiMay); return; }
      setMoGop(false);
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      toast.push(daLuu > 0 ? 'ok' : 'error', `Đã xếp ${daLuu} em${loi.length ? `, còn ${loi.length} em lỗi` : ''}.`);
      onDone();
      if (!loi.length) { onClose(); return; }
      /* R9b: giữ ngăn, chỉ còn các em lỗi được tick sẵn. */
      const ids = loi.map((d) => d.studentId);
      setGiuLoi(ids); setTicked(new Set(ids)); setLoc(null); setTaiLai((n) => n + 1);
    } finally { setBusy(false); }
  };

  const nutChinh = (
    <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={busy || !tt.soEm || !kyChon.length}>
      {busy ? 'Đang lưu…' : `Xếp lịch ${tt.soEm} em · ${tt.soBai} bài`}
    </button>
  );
  const lopConLai = lopTheoChiNhanh.filter((l) => !lopChon.includes(l.id));

  return (
    <KhungPanel tieuDe="Xếp lịch Mock Test" rong="rong" onDong={onClose}
      tabs={<KhungXepLich value="ft" onChange={onDoiKhung} coFt coThuong={coThuong} />}
      chan={{ huy: { nhan: 'Đóng', onClick: onClose }, chinh: nutChinh }}>
      <Khoi tieuDe="Lọc">
        <div className="flex flex-wrap items-end gap-2">
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Lớp</span>
            <div role="group" aria-label="Lớp đã chọn" className="flex flex-wrap items-center gap-1.5">
              {lopChon.map((id) => {
                const l = lopFT.find((x) => x.id === id) ?? lopTheoChiNhanh.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex h-7 items-center gap-1 rounded border px-2 text-xs text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>
                    {l?.code ?? id}
                    <button type="button" className="btn btn-sm btn-ghost relative -mr-1 min-h-[28px] min-w-[28px] justify-center px-0 max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']" aria-label={`Bỏ lớp ${l?.code ?? id}`}
                      disabled={lopChon.length === 1} onClick={() => { setLopChon((s) => s.filter((x) => x !== id)); setGiuLoi(null); }}>✕</button>
                  </span>
                );
              })}
              {lopConLai.length > 0 && (
                <select className="field h-7 w-auto min-w-28 py-0 text-xs" value={themLop} aria-label="Thêm lớp"
                  onChange={(e) => { const id = Number(e.target.value); if (id) { setLopChon((s) => [...s, id]); setGiuLoi(null); } setThemLop(''); }}>
                  <option value="">+ lớp</option>
                  {lopConLai.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
                </select>
              )}
            </div>
          </div>
          <label className="block w-full sm:w-52">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Tìm học viên</span>
            <input className="field w-full" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tên hoặc mã" />
          </label>
        </div>
      </Khoi>

      <Khoi so={1} tieuDe="Đợt">
        <div role="group" aria-label="Đợt" className="flex flex-wrap gap-1.5">
          <NutChon nho chon={dot === 'moi'} onClick={() => setDot('moi')}
            title="Mỗi em một đợt riêng: đợt nhỏ nhất chưa có lịch của em; không có thì đợt kế tiếp.">MT mới</NutChon>
          {cot.map((n) => <NutChon key={n} nho chon={dot === n} onClick={() => setDot(n)}>MT{n}</NutChon>)}
        </div>
      </Khoi>

      <Khoi so={2} tieuDe="Tuần và kỹ năng">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] max-w-[380px] flex-1 items-center gap-2">
            <div className="min-w-0 flex-1">
              <TuanNho d={{ periodId: tuanChung?.periodId ?? null, weekStart: tuanChung?.weekStart ?? null }} goc={homNay} onTuan={setTuanChung} />
            </div>
            {quaTuan(tuanChung) && <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>Tuần đã qua</Nhan>}
          </div>
          <div role="group" aria-label="Kỹ năng" className="flex flex-wrap gap-1.5">
            {KY.map((k) => {
              const bat = kyChon.includes(k);
              return (
                <label key={k} title={k === 'writing' ? 'Writing = chấm cả W1 và W2' : tenMon(null, k)}
                  className={`relative inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] sm:min-h-[32px] ${
                    bat ? 'border-doing-line bg-doing-bg text-doing' : 'border-muted-line text-slate-500 line-through'}`}>
                  <input type="checkbox" className="sr-only" checked={bat} aria-label={tenMon(null, k)} onChange={(e) => doiKy(k, e.target.checked)} />
                  {bat && <span aria-hidden>✓ </span>}{tenMonNgan(null, k)}
                </label>
              );
            })}
          </div>
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" aria-expanded={moRieng} onClick={() => setMoRieng((v) => !v)}>
            {moRieng ? 'Lịch riêng ▾' : 'Lịch riêng ▸'}
          </button>
        </div>
        {moRieng && (
          <div className="space-y-2">
            {KY.filter((k) => kyChon.includes(k)).map((k) => (
              <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-2 max-sm:grid-cols-1 sm:max-w-[560px]">
                <span className="text-xs text-slate-200"><b>{tenMonNgan(null, k)}</b> <span className="text-slate-400">{tenMon(null, k)}</span></span>
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
                  <div className="min-w-[220px] flex-1 sm:min-w-0">
                    <TuanNho d={{ periodId: tuanKn(k)?.periodId ?? null, weekStart: tuanKn(k)?.weekStart ?? null }} goc={homNay}
                      onTuan={(t) => setRieng((s) => ({ ...s, [k]: t }))} />
                  </div>
                  {quaTuan(tuanKn(k)) && <Nhan tone="soon" title={CAU_TUAN_DA_QUA}>Tuần đã qua</Nhan>}
                </div>
                {rieng[k]
                  ? <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setRieng((s) => { const n = { ...s }; delete n[k]; return n; })}>Theo tuần chung</button>
                  : <span className="w-[1px] max-sm:hidden" />}
              </div>
            ))}
          </div>
        )}
      </Khoi>

      <Khoi so={3} tieuDe="Học viên">
        {!luoi.size ? <div className="text-xs text-slate-500">Đang tải lớp…</div> : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <ChipDem tone="ok" n={dem.ok} loc={loc} onLoc={setLoc}>✓ Sẽ xếp {dem.ok}</ChipDem>
              <ChipDem tone="soon" n={dem.soon} loc={loc} onLoc={setLoc}>! Cần xem {dem.soon}</ChipDem>
              <ChipDem tone="bad" n={dem.bad} loc={loc} onLoc={setLoc}>✕ Không xếp được {dem.bad}</ChipDem>
            </div>
            <div className="overflow-x-auto rounded-[10px] border" style={{ borderColor: 'var(--line)' }} aria-busy={dangXem}>
              <table aria-label="Học viên xếp lịch" className="w-full min-w-[960px] border-separate border-spacing-0 text-xs">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="sticky left-0 z-[2] w-[80px] px-2 py-2 font-semibold max-sm:w-[48px]" style={{ background: 'var(--surface-2)' }}>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input type="checkbox" className="h-4 w-4 accent-sky-400" aria-label="Chọn tất cả" checked={tatCa} disabled={!tickDuoc.length}
                          ref={(el) => { if (el) el.indeterminate = soTick > 0 && !tatCa; }} onChange={(e) => doiTatCa(e.target.checked)} />
                        <span className="whitespace-nowrap max-sm:sr-only">Tất cả</span>
                      </label>
                    </th>
                    <th className="sticky left-[80px] z-[2] px-2.5 py-2 font-semibold max-sm:left-[48px]" style={{ background: 'var(--surface-2)' }}>Học viên</th>
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold" style={{ background: 'var(--surface-2)' }}>Lớp</th>
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold" style={{ background: 'var(--surface-2)' }}>Mock Test</th>
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold" style={{ background: 'var(--surface-2)' }}>Sẽ xếp</th>
                  </tr>
                </thead>
                <tbody>
                  {hienThi.map((h) => (
                    <HangEm key={h.studentId} h={h} homNay={homNay} cot={cot} dot={dot} d={dong.get(h.studentId)} chon={dangTick(h.studentId)} dangXem={dangXem}
                      rieng={dotTheoEm[h.studentId]} thiLai={thiLai[h.studentId]}
                      onTick={(v) => doiTick(h.studentId, v)}
                      onDot={(n) => setDotTheoEm((s) => { const x = { ...s }; if (x[h.studentId] === n) delete x[h.studentId]; else x[h.studentId] = n; return x; })}
                      onThiLai={(ks) => { setThiLai((s) => ({ ...s, [h.studentId]: ks })); doiTick(h.studentId, true); }}
                      onKhong={() => boEm(h.studentId)} />
                  ))}
                  {!hienThi.length && <tr><td colSpan={5} className="px-2.5 py-3 text-slate-500">Không có em.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-[11px] text-slate-500">⇆ cuộn ngang</p>
          </>
        )}
      </Khoi>

      {moGop && (
        <HopXacNhanHuyLich tieuDe={gop.tieuDe} cau={gop.cau} dong={gop.dong} busy={busy} loiMay={loiMayGop} lyDoDau={lyDoGop}
          onDong={() => { setMoGop(false); setLoiMayGop(null); }} onXacNhan={(ly) => void luu(true, ly)} />
      )}
    </KhungPanel>
  );
}

/** Chip đếm của bước 3 (mockup: `.chip c-ok / c-soon / c-muted`): cũng là nút lọc — bấm = chỉ nhóm đó, bấm lại = bỏ lọc. */
function ChipDem({ tone, n, loc, onLoc, children }: { tone: ToneSeXep; n: number; loc: ToneSeXep | null; onLoc: (t: ToneSeXep | null) => void; children: ReactNode }) {
  const mau = tone === 'ok' ? 'bg-ok-bg text-ok' : tone === 'soon' ? 'bg-soon-bg text-soon' : n > 0 ? 'bg-bad-bg text-bad' : 'bg-muted-bg text-muted';
  const ten = tone === 'ok' ? 'Sẽ xếp' : tone === 'soon' ? 'Cần xem' : 'Không xếp được';
  return (
    <button type="button" aria-pressed={loc === tone} onClick={() => onLoc(loc === tone ? null : tone)} title={`Chỉ hiện nhóm "${ten}"`}
      className={`relative inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full px-[9px] text-xs font-semibold tabular-nums max-sm:after:absolute max-sm:after:-inset-y-[9px] max-sm:after:inset-x-0 max-sm:after:content-[''] ${mau} ${loc === tone ? 'ring-2 ring-current' : ''}`}>
      {children}
    </button>
  );
}

function HangEm({ h, homNay, cot, dot, d, chon, dangXem, rieng, thiLai, onTick, onDot, onThiLai, onKhong }: {
  h: Hang; homNay: string | null; cot: number[]; dot: 'moi' | number; d: DongHangLoat | undefined; chon: boolean; dangXem: boolean;
  rieng: number | undefined; thiLai: KyNangKH[] | undefined;
  onTick: (v: boolean) => void; onDot: (n: number) => void; onThiLai: (ks: KyNangKH[]) => void; onKhong: () => void;
}) {
  const nhan = d ? nhanSeXep(d, null) : null;
  const bad = d?.hanhDong === 'loi';
  /* Đợt SẼ xếp của em: máy chủ trả `attemptNo` (có cả "MT mới"); chưa có xem trước thì theo đợt chọn / đợt riêng. */
  const dich = d?.attemptNo ?? rieng ?? (dot === 'moi' ? undefined : dot);
  const seXep = !!d && (d.hanhDong === 'tao' || d.hanhDong === 'doi');
  /* Tuần sẽ xếp ghi trong ô đợt (chỉ khi tạo / dời cả đợt; "xếp nốt" giữ chữ trạng thái của ô, vd "vắng S"). */
  const chuTuan = d && (d.viec === 'tao' || d.viec === 'doi')
    ? [...new Set(d.bai.filter((b) => b.ghiChu !== 'giu' && b.den).map((b) => tuanLich(b.den)))].join(' · ') : undefined;
  const hoiThiLai = rieng !== undefined && d?.viec === 'da-du' && !!d.coDiem?.length && !thiLai;
  return (
    <>
      <tr className="align-middle">
        <td className="sticky left-0 z-[1] border-t px-2.5 py-1.5" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          <label className="flex min-h-[28px] cursor-pointer items-center max-sm:min-h-[44px]" title={bad ? (d?.loi ?? undefined) : undefined}>
            <input type="checkbox" className="h-4 w-4 accent-sky-400" checked={chon} disabled={!d || bad} onChange={(e) => onTick(e.target.checked)} aria-label={`Chọn ${h.ten}`} />
          </label>
        </td>
        <td className="sticky left-[80px] z-[1] min-w-[150px] max-w-[220px] border-r max-sm:left-[48px] max-sm:min-w-[112px] max-sm:max-w-[112px] border-t px-2.5 py-1.5" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div className="font-bold text-slate-100 sm:truncate max-sm:line-clamp-2" title={h.ten}>{h.ten}</div>
          <div className="text-[11px] text-slate-500">{h.ma}</div>
        </td>
        <td className="whitespace-nowrap border-t px-2.5 py-1.5 text-slate-300" style={{ borderColor: 'var(--line)' }}>{h.classCode}</td>
        <td className="border-t px-2.5 py-1.5" style={{ borderColor: 'var(--line)' }}>
          {homNay ? (
            <div className="flex flex-wrap gap-1">
              {cot.filter((n) => h.dot[n]?.attemptId || n === h.soKeTiep || n === dich).map((n) => {
                const o = h.dot[n];
                const laDich = n === dich && seXep;
                return (
                  <OMt key={n} v={{ so: n, attemptId: o?.attemptId ?? null, kn: o?.kn ?? {}, cu: !!o?.lichSu }} homNay={homNay}
                    chon={laDich} chuChon={laDich ? chuTuan : undefined} onClick={() => onDot(n)}
                    ghiChu={rieng === n ? 'Đợt riêng của em — bấm lại để bỏ' : 'Bấm để xếp đợt này cho riêng em'} />
                );
              })}
            </div>
          ) : <span className="text-slate-500">…</span>}
        </td>
        <td className={`whitespace-nowrap border-t px-2.5 py-1.5 text-[13px] transition-opacity ${dangXem ? 'opacity-50' : ''}`} style={{ borderColor: 'var(--line)' }} title={nhan?.title}>
          {nhan ? (
            <>
              <span aria-hidden className={`inline-block w-4 text-center font-bold ${MAU_DAU[nhan.tone]}`}>{DAU[nhan.tone]}</span>
              <span className={nhan.tone === 'bad' ? 'text-bad' : 'text-slate-100'}>{nhan.chu}</span>
              {nhan.phu && <span className={`ml-1 ${nhan.phu.startsWith('· bỏ lịch') ? 'text-soon' : 'text-slate-400'}`}>{nhan.phu}</span>}
            </>
          ) : <span className="text-slate-500">—</span>}
        </td>
      </tr>
      {hoiThiLai && <HopThiLai h={h} d={d!} onThiLai={onThiLai} onKhong={onKhong} />}
    </>
  );
}

/** Hộp thi lại (T37 "ép vào đợt trùng", câu 1 = A): hỏi rõ điểm đã có rồi mới cho thi lại; điểm cũ giữ trong Lịch sử. */
function HopThiLai({ h, d, onThiLai, onKhong }: { h: Hang; d: DongHangLoat; onThiLai: (ks: KyNangKH[]) => void; onKhong: () => void }) {
  const ks = d.coDiem ?? [];
  const [chon, setChon] = useState<KyNangKH[]>(ks.length === 1 ? ks : []);
  const o = d.attemptNo ? h.dot[d.attemptNo] : undefined;
  const mon = (k: KyNangKH) => tenMonNgan(null, k);
  const tuan = ks.map((k) => o?.kn[k]?.tuan).find(Boolean);
  return (
    <tr>
      {/* Bảng cuộn ngang: hộp dính trái để luôn nằm trong tầm nhìn (điện thoại), không trôi theo cột. */}
      <td colSpan={5} className="border-t px-2.5 pb-2 pt-1" style={{ borderColor: 'var(--line)' }}>
        <div className="sticky left-2.5 w-[min(640px,calc(100vw_-_4rem))] rounded border px-2.5 py-2 text-xs text-slate-200" style={{ borderColor: 'var(--wait-line, var(--line))' }}>
          <p className="m-0">
            Cho <b>{h.ten}</b> thi lại {ks.map(mon).join(' ')} của MT{d.attemptNo}? {ks.map(mon).join(' ')} đã có điểm{tuan ? ` (${tuanLich(tuan)})` : ''}.
            Chỉ dùng khi thật sự thi lại — điểm cũ giữ trong Lịch sử.
          </p>
          {ks.length > 1 && (
            <div className="mt-1.5 flex flex-wrap gap-3">
              {ks.map((k) => (
                <label key={k} className="flex min-h-[44px] items-center gap-1.5 sm:min-h-0">
                  <input type="checkbox" className="accent-sky-400" checked={chon.includes(k)}
                    onChange={(e) => setChon((s) => (e.target.checked ? [...s, k] : s.filter((x) => x !== k)))} />{tenMon(null, k)}
                </label>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!chon.length} onClick={() => onThiLai(chon)}>
              Thi lại {chon.length ? chon.map(mon).join(' ') : ''}
            </button>
            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onKhong}>Không</button>
          </div>
        </div>
      </td>
    </tr>
  );
}
