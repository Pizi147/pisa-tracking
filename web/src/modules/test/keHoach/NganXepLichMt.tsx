import { useEffect, useMemo, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { useApi } from '../../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { KhungPanel, Khoi, Truong } from '../../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../../ui/loiForm.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { BoLocDoan, NutChon } from '../../../ui/ui.tsx';
import { BranchFilter } from '../../../ui/Filters.tsx';
import { ChipLichSu } from '../../../ui/Nhan.tsx';
import {
  KY_NANG_KE_HOACH, LY_DO_TOI_THIEU, MT_TOI_DA, chuSeXep, gomChip, kiemTruong, tenMon, tenMonNgan, tomTatXepMt, tuanLich, tuanMacDinhDotMoi,
  type DongHangLoat, type KyNangKH, type LoiTruong,
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

/** Dấu 10px bằng SVG (✓ ○ ◐) — ký tự nhỏ của Inter thành dấu chấm ở cỡ này (bẫy 28/09). */
function DauMt({ kieu }: { kieu: 'xong' | 'xep' | 'do' }) {
  const p = { width: 10, height: 10, viewBox: '0 0 10 10', 'aria-hidden': true, className: 'flex-none' } as const;
  if (kieu === 'xong') return <svg {...p}><path d="M1.5 5.2l2.3 2.3L8.5 2.8" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (kieu === 'do') return <svg {...p}><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M5 1a4 4 0 0 1 0 8z" fill="currentColor" /></svg>;
  return <svg {...p}><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

/**
 * XẾP LỊCH MOCK TEST NHIỀU LỚP (M9 · YC-13.4 · T37 · K4-17/18/19 · C4) — Test › Kế hoạch Test › nút "Xếp lịch MT…", ngăn rộng
 * bên phải. Một màn từ trên xuống: Lọc (chi nhánh · lớp nhiều lựa chọn · tìm em) → Đợt MT1…MT8 → Tuần chung cho 4 kỹ năng (sửa
 * riêng bên dưới) → Bảng học viên (đã chọn luôn ở trên; cột "Sẽ xếp" do MÁY CHỦ chọn qua `viecXepMt`, web chỉ vẽ `chuSeXep`) →
 * Thi lại (đợt đã đủ) → Lý do (khi cần) → chân dính: dòng xem trước + "Xếp lịch n em · m bài".
 * Xem trước / lưu gọi `/ke-hoach-test/hang-loat` MỖI LỚP một lần (xem trước song song, lưu tuần tự); R9b: sau lưu chỉ còn em lỗi.
 */
export function NganXepLichMt({ lopDs, lopMoSan, coThuong, onDoiKhung, onClose, onDone }: {
  lopDs: LopKH[]; lopMoSan: number | null; coThuong: boolean; onDoiKhung: (k: 'ft' | 'thuong') => void;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const homNay = useNgayNghiepVu().homNay || null;
  /* Chi nhánh (QL một chi nhánh thì `BranchFilter` tự ẩn): danh sách lớp để "+ lớp" tải lại theo chi nhánh; lớp đã chọn giữ nguyên. */
  const [branchId, setBranchId] = useState<number | null>(null);
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

  const hangs: Hang[] = useMemo(() => lopChon.flatMap((id) => {
    const l = luoi.get(id);
    return l ? l.hang.map((h) => ({ ...h, classId: id, classCode: l.classCode })) : [];
  }), [luoi, lopChon]);
  const soCot = Math.min(MT_TOI_DA, Math.max(0, ...[...luoi.values()].map((l) => l.cot.length)) + 1);
  const cot = Array.from({ length: soCot }, (_, i) => i + 1);

  /* C4: đợt mặc định = đợt NHỎ NHẤT còn em chưa xong trong các lớp đã chọn. */
  const dotMacDinh = useMemo(() => {
    for (const n of cot) {
      if (hangs.some((h) => {
        const o = h.dot[n];
        if (!o?.attemptId) return n === h.soKeTiep;
        return !o.lichSu && !gomChip(o.kn).xong;
      })) return n;
    }
    return cot[cot.length - 1] ?? 1;
  }, [hangs, cot.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [dotChon, setDotChon] = useState<number | null>(null);
  const dot = dotChon ?? dotMacDinh;

  /* Tuần chung (mặc định tuần tới, K4-14) + lịch riêng từng kỹ năng (dòng nào chưa sửa tay thì theo tuần chung). */
  const [tuanChung, setTuanChung] = useState<Tuan | null>(null);
  const [rieng, setRieng] = useState<Partial<Record<KyNangKH, Tuan>>>({});
  useEffect(() => {
    if (!homNay || tuanChung) return;
    void resolveTuan(tuanMacDinhDotMoi(homNay)).then(setTuanChung).catch(() => { /* chọn tay */ });
  }, [homNay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const tuanKn = (k: KyNangKH) => rieng[k] ?? tuanChung;
  const tuanGui = useMemo(() => {
    const o: Partial<Record<KyNangKH, number>> = {};
    for (const k of KY) { const t = tuanKn(k); if (t) o[k] = t.periodId; }
    return o;
  }, [tuanChung, rieng]);   // eslint-disable-line react-hooks/exhaustive-deps

  const [dotTheoEm, setDotTheoEm] = useState<Record<number, number>>({});
  const [thiLai, setThiLai] = useState<Record<number, KyNangKH[]>>({});
  const [lyDo, setLyDo] = useState('');
  const [force, setForce] = useState(true);
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  /* Điện thoại: bảng học viên gọn 3 cột (rà #126). Đọc một lần khi mở ngăn — ngăn không đổi cỡ giữa chừng. */
  const hep = typeof window !== 'undefined' && window.innerWidth < 640;
  const [giuLoi, setGiuLoi] = useState<number[] | null>(null);

  /* Xem trước MỌI em của các lớp đã chọn (để cột "Sẽ xếp" có cả em chưa chọn và để tick mặc định) — mỗi lớp một lời gọi. */
  const [dong, setDong] = useState<Map<number, DongHangLoat>>(new Map());
  const [dangXem, setDangXem] = useState(false);
  const soXem = useRef(0);
  const thanChung = { attemptNo: dot, tuan: tuanGui, dotTheoEm, thiLai, lyDo: lyDo.trim() || null };
  const khoaXem = JSON.stringify([dot, tuanGui, dotTheoEm, thiLai, hangs.map((h) => h.studentId)]);
  useEffect(() => {
    if (!hangs.length || Object.keys(tuanGui).length < KY.length) { setDong(new Map()); return; }
    const seq = ++soXem.current;
    setDangXem(true);
    const t = setTimeout(() => {
      Promise.all(lopChon.filter((id) => luoi.has(id)).map((id) => api.post<{ dong: DongHangLoat[] }>('/ke-hoach-test/hang-loat', {
        classId: id, studentIds: hangs.filter((h) => h.classId === id).map((h) => h.studentId), xemTruoc: true, ...thanChung,
      }))).then((ds) => {
        if (seq !== soXem.current) return;
        setDong(new Map(ds.flatMap((r) => r.dong).map((d) => [d.studentId, d])));
        setDangXem(false);
      }).catch(() => { if (seq === soXem.current) { setDong(new Map()); setDangXem(false); } });
    }, 300);
    return () => clearTimeout(t);
  }, [khoaXem]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Tick mặc định: em có việc ở đợt đang chọn — đặt MỘT LẦN mỗi (đợt, bộ lớp); R9b không bị ghi đè. */
  const daTick = useRef<string | null>(null);
  const khoaTick = `${dot}|${lopChon.join(',')}`;
  useEffect(() => {
    if (!dong.size || daTick.current === khoaTick || giuLoi) return;
    daTick.current = khoaTick;
    setTicked(new Set([...dong.values()].filter((d) => d.hanhDong === 'tao' || d.hanhDong === 'doi').map((d) => d.studentId)));
  }, [dong, khoaTick]);   // eslint-disable-line react-hooks/exhaustive-deps

  const khopTim = (h: Hang) => !tim.trim() || `${h.ten} ${h.ma}`.toLowerCase().includes(tim.trim().toLowerCase());
  const hienThi = hangs.filter((h) => khopTim(h) && (!giuLoi || giuLoi.includes(h.studentId)));
  const daChon = hienThi.filter((h) => ticked.has(h.studentId));
  const chuaChon = hienThi.filter((h) => !ticked.has(h.studentId));
  const dongChon = hangs.filter((h) => ticked.has(h.studentId)).map((h) => dong.get(h.studentId)).filter((d): d is DongHangLoat => !!d);
  const dongLuu = dongChon.map((d) => (!force && d.hanhDong !== 'loi' && d.bai.some((b) => b.ghiChu === 'canh-bao') ? { ...d, hanhDong: 'loi' as const } : d));
  const tt = tomTatXepMt(dongLuu);
  const coCanhBao = dongChon.some((d) => d.hanhDong !== 'loi' && d.bai.some((b) => b.ghiChu === 'canh-bao'));
  const canLyDo = dongChon.some((d) => d.canLyDo && d.hanhDong !== 'loi');
  const thieuLyDo = canLyDo && lyDo.trim().length < LY_DO_TOI_THIEU;
  const lf = useLoiForm();
  const loiForm: LoiTruong[] = thieuLyDo ? [{ khoa: 'ly-do', nhan: 'Lý do', lyDo: kiemTruong({ khoa: 'ly-do', nhan: 'Lý do', toiThieu: LY_DO_TOI_THIEU }, lyDo)! }] : [];
  const [busy, setBusy] = useState(false);

  const doiTick = (id: number, v: boolean) => setTicked((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });
  const boEm = (id: number) => {
    doiTick(id, false);
    setDotTheoEm((s) => { const n = { ...s }; delete n[id]; return n; });
    setThiLai((s) => { const n = { ...s }; delete n[id]; return n; });
  };

  const luu = async () => {
    lf.bam();
    if (busy || loiForm.length || !tt.soEm) return;
    setBusy(true);
    let daLuu = 0;
    const loi: DongHangLoat[] = [];
    try {
      for (const id of lopChon) {
        const ids = hangs.filter((h) => h.classId === id && ticked.has(h.studentId)).map((h) => h.studentId);
        if (!ids.length) continue;
        try {
          const r = await api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
            classId: id, studentIds: ids, force, xemTruoc: false, ...thanChung,
          });
          daLuu += r.daLuu;
          loi.push(...r.dong.filter((d) => d.hanhDong === 'loi'));
        } catch (e: any) {
          toast.push('error', `${luoi.get(id)?.classCode ?? 'Lớp'}: ${e.message ?? 'không lưu được'}`);
          loi.push(...ids.map((sid) => ({ studentId: sid, ten: '', hanhDong: 'loi' as const, bai: [], loi: e.message ?? 'Không lưu được.' })));
        }
      }
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      toast.push(daLuu > 0 ? 'ok' : 'error', `Đã xếp ${daLuu} em${loi.length ? `, còn ${loi.length} em lỗi` : ''}.`);
      onDone();
      if (!loi.length) { onClose(); return; }
      /* R9b: giữ ngăn, chỉ còn các em lỗi được tick sẵn. */
      const ids = loi.map((d) => d.studentId);
      setGiuLoi(ids); setTicked(new Set(ids)); lf.datLai(); setTaiLai((n) => n + 1);
    } finally { setBusy(false); }
  };

  const chuXemTruoc = `Xem trước: dời ${tt.doi} · xếp nốt ${tt.xepNot} · tạo ${tt.tao} · thi lại ${tt.thiLai} · cảnh báo ${tt.canhBao} · chặn ${tt.chan}`;
  const nutChinh = (
    <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={busy || !tt.soEm}>
      {busy ? 'Đang lưu…' : `Xếp lịch ${tt.soEm} em · ${tt.soBai} bài`}
    </button>
  );
  const lopConLai = lopTheoChiNhanh.filter((l) => !lopChon.includes(l.id));

  return (
    <KhungPanel tieuDe="Xếp lịch Mock Test" rong="rong" onDong={onClose}
      tabs={<KhungXepLich value="ft" onChange={onDoiKhung} coFt coThuong={coThuong} />}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose }, chinh: nutChinh, conThieu: lf.conThieu(loiForm),
        phu: <span className="hidden min-w-0 truncate text-[11px] tabular-nums text-slate-400 sm:block" title={chuXemTruoc}>{dangXem ? 'Đang tính…' : chuXemTruoc}</span>,
        /* Điện thoại: dòng xem trước là một dòng riêng trong chân ngăn, ngay trên nút — không dính đè lên danh sách em (rà #126). */
        dongTren: <div className="px-4 pt-2 text-[11px] tabular-nums text-slate-300 sm:hidden">{dangXem ? 'Đang tính…' : chuXemTruoc}</div>,
      }}>
      <Khoi tieuDe="Lọc">
        <div className="flex flex-wrap items-end gap-2">
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Lớp</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {lopChon.map((id) => {
                const l = lopFT.find((x) => x.id === id) ?? lopTheoChiNhanh.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex h-7 items-center gap-1 rounded border px-2 text-xs text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>
                    {l?.code ?? id}
                    <button type="button" className="btn btn-sm btn-ghost -mr-1 min-h-[28px] min-w-[28px] justify-center px-0" aria-label={`Bỏ lớp ${l?.code ?? id}`}
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

      <Khoi tieuDe="Đợt">
        <div className="flex flex-wrap gap-1.5">
          {cot.map((n) => <NutChon key={n} nho chon={dot === n} onClick={() => setDotChon(n)}>MT{n}</NutChon>)}
        </div>
        <p className="m-0 text-[11px] text-slate-500">Em đã đủ điểm đợt này tự sang đợt kế tiếp; đợt còn dở thì xếp nốt kỹ năng còn thiếu.</p>
      </Khoi>

      <Khoi tieuDe="Tuần thi">
        <div className="max-w-[360px]">
          <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Tuần chung cho 4 kỹ năng</span>
          <TuanNho d={{ periodId: tuanChung?.periodId ?? null, weekStart: tuanChung?.weekStart ?? null }} goc={homNay} onTuan={setTuanChung} />
        </div>
        <details className="text-sm" open={Object.keys(rieng).length > 0}>
          <summary className="cursor-pointer text-xs text-slate-300">Lịch riêng từng kỹ năng (nếu cần)</summary>
          <div className="mt-2 space-y-2">
            {KY.map((k) => (
              <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-2 sm:max-w-[460px]">
                <span className="text-xs text-slate-200">
                  <b>{tenMonNgan(null, k)}</b> <span className="text-slate-400">{tenMon(null, k)}</span>
                  {k === 'writing' && <span className="ml-1 cursor-help text-slate-500" title="W = chấm cả W1 và W2">ⓘ</span>}
                </span>
                <TuanNho d={{ periodId: tuanKn(k)?.periodId ?? null, weekStart: tuanKn(k)?.weekStart ?? null }} goc={homNay}
                  onTuan={(t) => setRieng((s) => ({ ...s, [k]: t }))} />
                {rieng[k]
                  ? <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setRieng((s) => { const n = { ...s }; delete n[k]; return n; })}>Theo tuần chung</button>
                  : <span className="w-[1px]" />}
              </div>
            ))}
          </div>
        </details>
      </Khoi>

      <Khoi tieuDe={`Học viên · ${daChon.length} đã chọn`}>
        {!luoi.size ? <div className="text-xs text-slate-500">Đang tải lớp…</div> : (
          <div className="overflow-x-auto">
            {/* Điện thoại (rà #126): bỏ cột Lớp và Sẽ xếp — lớp + "Sẽ xếp" xuống dưới tên em, bảng không còn giấu cột cuối ngoài màn. */}
            <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: hep ? undefined : 560 }}>
              <colgroup>
                <col style={{ width: 28 }} /><col style={{ width: hep ? undefined : 150 }} />{!hep && <col style={{ width: 84 }} />}
                <col style={{ width: cot.length * 40 + 8 }} />{!hep && <col />}
              </colgroup>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="py-1" aria-label="Chọn" /><th className="sticky-col py-1 font-bold">Học viên</th>{!hep && <th className="py-1 font-bold">Lớp</th>}
                  <th className="py-1 font-bold">Mock Test</th>{!hep && <th className="py-1 font-bold">Sẽ xếp</th>}
                </tr>
              </thead>
              {[{ ten: `Đã chọn ${daChon.length} — luôn ở trên`, ds: daChon }, { ten: `Chưa chọn · ${chuaChon.length}`, ds: chuaChon }].map((nhom) => (
                <tbody key={nhom.ten}>
                  <tr><td colSpan={hep ? 3 : 5} className="pb-1 pt-3 text-[11px] font-bold text-slate-400">{nhom.ten}</td></tr>
                  {nhom.ds.map((h) => (
                    <HangEm key={h.studentId} h={h} hep={hep} cot={cot} dot={dot} d={dong.get(h.studentId)} chon={ticked.has(h.studentId)}
                      rieng={dotTheoEm[h.studentId]} thiLai={thiLai[h.studentId]}
                      onTick={(v) => doiTick(h.studentId, v)}
                      onDot={(n) => setDotTheoEm((s) => { const x = { ...s }; if (x[h.studentId] === n) delete x[h.studentId]; else x[h.studentId] = n; return x; })}
                      onThiLai={(ks) => { setThiLai((s) => ({ ...s, [h.studentId]: ks })); doiTick(h.studentId, true); }}
                      onKhong={() => boEm(h.studentId)} />
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </Khoi>

      {canLyDo && (
        <Khoi tieuDe="Lý do">
          <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loiForm, 'ly-do')} dem={{ co: lyDo.trim().length, can: LY_DO_TOI_THIEU }}
            phu="Có bài dời khi tuần thi đã bắt đầu hoặc thi lại — ghi một lần cho cả lượt xếp.">
            <input className="field w-full" {...lf.o(loiForm, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
              placeholder="Ví dụ: lịch học đổi, thi lại vì đề lỗi" />
          </Truong>
        </Khoi>
      )}

      {coCanhBao && (
        <label className="mt-3 flex min-h-[44px] items-center gap-2 text-xs text-soon sm:min-h-0">
          <input type="checkbox" className="accent-sky-400" checked={force} onChange={(e) => setForce(e.target.checked)} />
          Vẫn xếp bài có cảnh báo (hai đợt cách nhau một tuần)
        </label>
      )}
    </KhungPanel>
  );
}

const MAU_VIEC: Record<string, string> = {
  tao: 'text-doing', doi: 'text-doing', 'xep-not': 'text-doing', 'thi-lai': 'text-wait', chan: 'text-bad', 'da-du': 'text-slate-300',
};

function HangEm({ h, hep, cot, dot, d, chon, rieng, thiLai, onTick, onDot, onThiLai, onKhong }: {
  h: Hang; hep: boolean; cot: number[]; dot: number; d: DongHangLoat | undefined; chon: boolean; rieng: number | undefined; thiLai: KyNangKH[] | undefined;
  onTick: (v: boolean) => void; onDot: (n: number) => void; onThiLai: (ks: KyNangKH[]) => void; onKhong: () => void;
}) {
  const dich = d?.attemptNo ?? rieng ?? dot;
  const chu = d ? chuSeXep(d, null) : '—';
  const canhBao = d && d.hanhDong !== 'loi' && d.bai.some((b) => b.ghiChu === 'canh-bao');
  const mau = !d ? 'text-slate-500' : d.hanhDong === 'loi' ? 'text-bad' : canhBao ? 'text-soon' : MAU_VIEC[d.viec ?? ''] ?? 'text-slate-300';
  const hoiThiLai = d?.viec === 'da-du' && !!d.coDiem?.length && !thiLai;
  return (
    <>
      <tr className="border-t align-top" style={{ borderColor: 'var(--line)' }}>
        <td className="py-1.5">
          <input type="checkbox" className="mt-1 accent-sky-400" checked={chon} onChange={(e) => onTick(e.target.checked)} aria-label={`Chọn ${h.ten}`} />
        </td>
        <td className="sticky-col py-1.5 pr-2">
          <div className="truncate font-bold text-slate-100" title={h.ten}>{h.ten}</div>
          <div className="text-[11px] text-slate-500">{h.ma}{hep && ` · ${h.classCode}`}</div>
          {hep && <div className={`mt-0.5 line-clamp-2 ${mau}`} title={d?.loi ?? chu}>{chu}</div>}
        </td>
        {!hep && <td className="truncate py-1.5 pr-2 text-slate-300" title={h.classCode}>{h.classCode}</td>}
        <td className="py-1.5">
          <div className="flex flex-wrap gap-1">
            {cot.map((n) => {
              const o = h.dot[n];
              if (!o?.attemptId && n !== h.soKeTiep) return <span key={n} className="w-9" />;
              const g = o?.attemptId ? gomChip(o.kn) : null;
              const choDuyet = !!o && Object.values(o.kn).some((k) => k?.choDuyet);
              const kieu = g?.xong ? 'xong' : o?.do ? 'do' : o?.attemptId ? 'xep' : null;
              const dac = n === dich;
              const mauChip = dac ? 'bg-doing text-ink-950 border-doing' : choDuyet ? 'text-wait border-wait-line' : 'text-slate-300 border-muted-line';
              return (
                <button key={n} type="button" onClick={() => onDot(n)}
                  className={`relative inline-flex h-5 w-9 items-center justify-center gap-0.5 rounded border text-[11px] tabular-nums after:absolute after:-inset-1.5 after:content-[""] sm:after:hidden ${mauChip} ${o?.huyPhan ? 'line-through' : ''} ${rieng === n ? 'ring-1 ring-doing' : ''}`}
                  title={`MT${n}${o?.lichSu ? ' · lịch sử' : ''}${g?.xong ? ' · xong' : o?.do ? ' · dở' : ''}${choDuyet ? ' · chờ Quản lý duyệt' : ''} — bấm để xếp đợt này cho riêng em`}>
                  {kieu && <DauMt kieu={kieu} />}{n}
                </button>
              );
            })}
          </div>
          {Object.values(h.dot).some((o) => o.lichSu) && <div className="mt-0.5"><ChipLichSu /></div>}
        </td>
        {!hep && (
          <td className={`py-1.5 ${mau}`}>
            <span className="line-clamp-2" title={d?.loi ?? chu}>{chu}</span>
          </td>
        )}
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
      <td />
      <td colSpan={4} className="pb-2">
        <div className="rounded border px-2.5 py-2 text-xs text-slate-200" style={{ borderColor: 'var(--wait-line, var(--line))' }}>
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
