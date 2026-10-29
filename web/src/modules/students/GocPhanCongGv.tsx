import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { ApiError, api, invalidate, invalidateGop } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useDienThoai, useManHinh } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { HopChoDoi, HopLuuPhanCong, luuThang, type LopLuuPc } from '../classes/HopLuuPhanCong.tsx';
import { BangLopPc } from './phanCongGv/BangLopPc.tsx';
import { ChonGvPc, OGv, type TrangThaiO } from './phanCongGv/OGv.tsx';
import { DaiToPc, TongHopPc } from './phanCongGv/TongHopPc.tsx';
import { TheLopPc } from './phanCongGv/TheLopPc.tsx';
import { ThanhLuuPc } from './phanCongGv/ThanhLuuPc.tsx';
import {
  chonCuaLop, demPhanCong, doiTheoO, duongHoSoGiaoVien, gopChonSau409, kiemDongPc, laCapBanGiao, laVaiQuanLy, locLopPc, lopSauNhap, moRongPhanCong,
  nhanDayDuoc, oDongPc, oPhanCong, oThieuPc, slotsDongPc, tenMonNgan, tuanLich,
  type ChonDongPc, type DemGv, type GvPc, type KetQuaLuuPc, type LopPc, type SlotPhanCong, type TrangPhanCongGv,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

const KHONG: DemGv = { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
const bang = (a: ChonDongPc, b: ChonDongPc) => Object.keys({ ...a, ...b }).every((k) => (a[k] ?? '') === (b[k] ?? ''));

/**
 * GÓC "PHÂN CÔNG GV" ở Học viên & Lớp (PC-GV-C, đặc tả 2026-10-30-phan-cong-gv-design.md, mockup `thiet-ke/v9/phan-cong-gv.html`).
 * Tải MỘT lần theo chi nhánh (`GET /hoc-vien-lop/phan-cong`); số tổng hợp, dòng phụ ô chọn, dải tô đều từ `demPhanCong` (một nguồn) — có nháp thì
 * "cũ → mới". Sửa theo DÒNG: đổi ô → dòng nháp (kiểm ba luật ngay, `kiemDongPc` = hàm máy chủ) → Lưu (hộp hiệu lực + bàn giao khi có cặp A → B).
 * Sau lưu KHÔNG tải lại cả bảng: dòng nhận bức tranh vừa gửi, `invalidateGop` khớp lại một lần. 409 / 400 có `classId` → giữ MỌI nháp, lỗi đúng dòng.
 * QL / Quản trị sửa; CX chỉ xem (máy chủ 403 với GV / TVV).
 */
export function GocPhanCongGv({ branchId, khung, q, onQ, coTheTaoLop, onTaoLop, onNhap, chonCn }: {
  branchId: number | null; khung: 'tat-ca' | 'ft' | 'thuong'; q: string; onQ: (q: string) => void;
  coTheTaoLop?: boolean; onTaoLop?: () => void;
  /** Số dòng nháp — trang hỏi một lần trước khi đổi tab / chi nhánh. */
  onNhap?: (n: number) => void;
  /** Quản trị ở phạm vi toàn hệ thống: ô chọn chi nhánh trong khung rỗng (góc cần MỘT chi nhánh). */
  chonCn?: ReactNode;
}) {
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const hep = useManHinh('(max-width: 1023px)');
  const dt = useDienThoai();
  const duong = `/hoc-vien-lop/phan-cong${branchId ? `?branchId=${branchId}` : ''}`;
  const trang = useApi<TrangPhanCongGv>(duong, [duong], { giuCu: true });
  const data = trang.data;

  const [nhap, setNhap] = useState<Record<number, ChonDongPc>>({});
  const [ghiDe, setGhiDe] = useState<Record<number, SlotPhanCong[]>>({});
  const [daLuu, setDaLuu] = useState<Set<number>>(new Set());
  const [loiHang, setLoiHang] = useState<Record<number, string>>({});
  const [khacDoi, setKhacDoi] = useState<Record<number, string[]>>({});
  const cho409 = useRef<Record<number, ChonDongPc>>({});
  const [to, setTo] = useState<number | null>(null);
  const [thieu, setThieu] = useState(false);
  const [mo, setMo] = useState<{ classId: number; khoa: string } | null>(null);
  const [hop, setHop] = useState<{ ids: number[]; tuan: string | null; neo: HTMLElement | null } | null>(null);
  const [hopCho, setHopCho] = useState<{ classId: number; neo: HTMLElement | null } | null>(null);
  const [dangSuaThe, setDangSuaThe] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const oRef = useRef(new Map<string, HTMLButtonElement>());
  const thanhLuu = useRef<HTMLButtonElement>(null);

  /* Bản mới về (sau lần vô hiệu gộp / 409): bỏ phần tự cập nhật tại chỗ; dòng 409 gộp ba bản (`gopChonSau409`) — ô đã sửa giữ, ô chưa sửa theo bản mới. */
  useEffect(() => {
    if (!data) return;
    setGhiDe({});
    const ds = cho409.current;
    cho409.current = {};
    if (!Object.keys(ds).length) return;
    const moi: Record<number, ChonDongPc> = {};
    const khac: Record<number, string[]> = {};
    for (const [id, cu] of Object.entries(ds)) {
      const l = data.lop.find((x) => x.id === Number(id));
      if (!l) continue;
      const m = chonCuaLop(l);
      moi[l.id] = gopChonSau409(cu, m, nhap[l.id] ?? m).chon;
      khac[l.id] = Object.keys(m).filter((k) => (m[k] ?? '') !== (cu[k] ?? ''));
    }
    setNhap((n) => ({ ...n, ...moi }));
    setKhacDoi((k) => ({ ...k, ...khac }));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const soNhap = Object.keys(nhap).length;
  useEffect(() => { onNhap?.(soNhap); }, [soNhap]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!soNhap) return undefined;
    const chan = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', chan);
    return () => window.removeEventListener('beforeunload', chan);
  }, [soNhap]);

  const lop = useMemo(() => (data?.lop ?? []).map((l) => (ghiDe[l.id] ? { ...l, slots: ghiDe[l.id], cho: [] } : l)), [data, ghiDe]);
  const gv = data?.gv ?? [];
  const gvMap = useMemo(() => new Map(gv.map((g) => [g.id, g])), [gv]);
  const ten = (id: number | null) => (id === null ? t('Chưa có') : gvMap.get(id)?.ten ?? '…');
  const dem = useMemo(() => demPhanCong(lop), [lop]);
  const demNhap = useMemo(() => demPhanCong(lopSauNhap(lop, nhap)), [lop, nhap]);
  const ghim = useMemo(() => new Set(Object.keys(nhap).map(Number)), [nhap]);
  const hien = locLopPc(lop, gv, { q, khung, thieu, ghim });
  const chiXem = !data?.sua;
  const coTheMoHoSo = (id: number) => duongHoSoGiaoVien(id, { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) || !!session?.nav?.phanTichGv });

  const goc = (l: LopPc) => chonCuaLop(l);
  const chonDong = (l: LopPc) => nhap[l.id] ?? goc(l);
  const loiCua = (l: LopPc) => (nhap[l.id] ? kiemDongPc(l, nhap[l.id], gv) : []);
  const soDoi = (l: LopPc) => { const a = goc(l); const b = chonDong(l); return oDongPc(l).filter((k) => (a[k] ?? '') !== (b[k] ?? '')).length; };
  const nhanO = (l: LopPc, k: string) => (k === 'gvcn' ? t('GVCN') : tenMonNgan(l.ct, k));

  const setO = (l: LopPc, khoa: string, v: number | '') => {
    const moi = { ...chonDong(l), [khoa]: v };
    setNhap((n) => { const x = { ...n }; if (bang(moi, goc(l))) delete x[l.id]; else x[l.id] = moi; return x; });
    setDaLuu((s) => { if (!s.has(l.id)) return s; const x = new Set(s); x.delete(l.id); return x; });
    setKhacDoi((k) => (k[l.id] ? { ...k, [l.id]: k[l.id].filter((x) => x !== khoa) } : k));
  };
  const huyDong = (ids: number[]) => {
    setNhap((n) => { const x = { ...n }; ids.forEach((id) => delete x[id]); return x; });
    setLoiHang((n) => { const x = { ...n }; ids.forEach((id) => delete x[id]); return x; });
    setKhacDoi((n) => { const x = { ...n }; ids.forEach((id) => delete x[id]); return x; });
    if (dangSuaThe !== null && ids.includes(dangSuaThe)) setDangSuaThe(null);
  };

  /* ------------------------------------------------------------ lưu */
  const lopLuu = (ids: number[]): LopLuuPc[] => ids.map((id) => lop.find((l) => l.id === id)!).filter(Boolean)
    .map((l) => ({ classId: l.id, code: l.code, slots: slotsDongPc(l, chonDong(l)), phienBan: l.phienBan }));
  const loiLuu = (e: unknown, ids: number[]) => {
    setBusy(false);
    setHop(null);
    if (e instanceof ApiError && e.details?.classId && ids.includes(Number(e.details.classId))) {
      const id = Number(e.details.classId);
      setLoiHang((x) => ({ ...x, [id]: e.message }));
      if (e.status === 409) {
        const l = lop.find((x) => x.id === id);
        if (l) cho409.current = { ...cho409.current, [id]: goc(l) };
        invalidate('/hoc-vien-lop/phan-cong');
      }
      return;
    }
    toast.push('error', (e as any)?.message ?? t('Không lưu được'));
  };
  const daLuuXong = (kq: KetQuaLuuPc & { viec: number; nguoiCu: string | null }, ds: LopLuuPc[]) => {
    setBusy(false);
    setHop(null);
    const ids = ds.map((l) => l.classId);
    const coCho = kq.lop.some((x) => x.cho);
    setGhiDe((g) => {
      const x = { ...g };
      for (const l of ds) {
        if (kq.lop.find((r) => r.classId === l.classId)?.cho) continue;
        const goc0 = lop.find((y) => y.id === l.classId)!;
        x[l.classId] = moRongPhanCong(goc0.ct, goc0.kyNang, l.slots);
      }
      return x;
    });
    huyDong(ids);
    setDaLuu((s) => new Set([...s, ...kq.lop.filter((x) => !x.cho).map((x) => x.classId)]));
    const chu = ds.length > 1 ? t('{n} lớp', { n: ds.length }) : ds[0].code;
    const text = kq.viec
      ? (kq.nguoiCu ? t('Đã lưu phân công {lop} · tạo {n} việc bàn giao cho {gv}', { lop: chu, n: kq.viec, gv: kq.nguoiCu }) : t('Đã lưu phân công {lop} · tạo {n} việc bàn giao', { lop: chu, n: kq.viec }))
      : t('Đã lưu phân công {lop}', { lop: chu });
    if (kq.lo !== null) {
      toast.hoanTac(text, () => {
        api.post('/phan-cong/hoan-tac', { lo: kq.lo })
          .then(() => { invalidate('/hoc-vien-lop/phan-cong'); invalidateGop('/my-work', '/classes'); setDaLuu(new Set()); toast.push('ok', t('Đã hoàn tác')); })
          .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
      });
    } else toast.push('ok', text);
    /* Lịch chờ cần id thật (nút Chờ đổi) → tải lại ngay; đổi ngay thì dòng đã tự cập nhật, khớp lại một lần sau (gộp). */
    if (coCho) invalidate('/hoc-vien-lop/phan-cong');
    invalidateGop('/hoc-vien-lop/phan-cong', '/my-work', '/classes');
  };
  const luu = async (ids: number[], neo: HTMLElement | null) => {
    if (busy) return;
    const loi = ids.map((id) => lop.find((l) => l.id === id)!).find((l) => l && loiCua(l).length);
    if (loi) {
      const k = loiCua(loi)[0].khoa;
      oRef.current.get(`${loi.id}|${k}`)?.focus();
      return;
    }
    const ds = lopLuu(ids);
    let tuan: string | null = null;
    const coCap = ds.some((x) => {
      const l = lop.find((y) => y.id === x.classId)!;
      const doi = doiTheoO(l.ct, l.kyNang, l.slots, moRongPhanCong(l.ct, l.kyNang, x.slots));
      for (const d of doi) tuan ??= l.cho.find((c) => c.khoa === d.khoa)?.hieuLuc ?? null;
      return doi.some(laCapBanGiao);
    });
    setLoiHang((x) => { const y = { ...x }; ids.forEach((id) => delete y[id]); return y; });
    if (coCap || tuan) { setHop({ ids, tuan, neo }); return; }
    setBusy(true);
    try { daLuuXong({ ...(await luuThang(ds)), viec: 0, nguoiCu: null }, ds); } catch (e) { loiLuu(e, ids); }
  };

  /* ------------------------------------------------------------ ô + danh sách chọn */
  const tenCn = data?.chiNhanh?.code ?? '';
  const soNguoi = (id: number) => {
    const a = dem.get(id) ?? KHONG; const b = demNhap.get(id) ?? KHONG;
    const s = (x: number, y: number) => (x === y ? `${x}` : `${x} → ${y}`);
    return t('dạy {a} · GVCN {b}', { a: s(a.ft + a.th, b.ft + b.th), b: s(a.cnFt + a.cnTh, b.cnFt + b.cnTh) });
  };
  const dsChon = (l: LopPc, khoa: string): NguoiTrongDs[] => {
    const ung = gv.filter((g) => !g.nghi);
    const c = chonDong(l);
    const hienTai = (g: GvPc) => (c[khoa] === g.id ? `${t('hiện tại')} · ` : '');
    if (khoa === 'gvcn') {
      const dayLop = (g: GvPc) => oDongPc(l).filter((k) => k !== 'gvcn' && c[k] === g.id).map((k) => tenMonNgan(l.ct, k));
      const a = ung.filter((g) => dayLop(g).length);
      return [
        ...a.map((g) => ({ id: g.id, ten: g.ten, phu: `${hienTai(g)}${t('{mon} lớp này', { mon: dayLop(g).join(', ') })} · ${soNguoi(g.id)}`, nhom: t('Đang dạy lớp này') })),
        ...ung.filter((g) => !dayLop(g).length).map((g) => ({ id: g.id, ten: g.ten, phu: `${hienTai(g)}${soNguoi(g.id)}`, ...(a.length ? { nhom: t('GV khác · {cn}', { cn: tenCn }) } : {}) })),
      ];
    }
    const o = oPhanCong(l.ct, l.kyNang).find((x) => x.khoa === khoa);
    const duoc = (g: GvPc) => (o ? nhanDayDuoc(l.ct, o, g.kyNang) : []);
    return [...ung].sort((x, y) => Number(duoc(y).length > 0) - Number(duoc(x).length > 0))
      .map((g) => ({ id: g.id, ten: g.ten, phu: [`${hienTai(g)}${soNguoi(g.id)}`, duoc(g).length ? t('dạy được {ds}', { ds: duoc(g).join(', ') }) : ''].filter(Boolean).join(' · ') }));
  };
  const oCua = (l: LopPc, khoa: string, h?: number, c?: number) => {
    const a = goc(l)[khoa] ?? ''; const v = chonDong(l)[khoa] ?? '';
    const g = v ? gvMap.get(Number(v)) ?? null : null;
    const loi = loiCua(l).find((x) => x.khoa === khoa)?.lyDo;
    const cho = l.cho.find((x) => x.khoa === khoa);
    const khac = !!khacDoi[l.id]?.includes(khoa);
    const doi = v !== a;
    const trangThai: TrangThaiO = loi ? 'loi' : khac ? 'khac-doi' : doi ? 'doi' : cho ? 'cho-doi' : !g ? 'trong' : g.nghi ? 'nghi' : 'binh-thuong';
    const phu = khac ? t('↻ người khác vừa đổi') : doi ? t('trước: {ten}', { ten: a ? ten(Number(a)) : t('Chưa có') })
      : g?.nghi ? (g.nghi === 'nghi' ? t('⚠ đã nghỉ') : t('⚠ ngoài chi nhánh')) : cho ? `→ ${ten(cho.nguoiMoi)}` : undefined;
    const k = `${l.id}|${khoa}`;
    return (
      <OGv ref={(el) => { if (el) oRef.current.set(k, el); else oRef.current.delete(k); }}
        nhanO={`${nhanO(l, khoa)} ${l.code}`} ten={g?.ten ?? null} trangThai={trangThai} to={to !== null && g?.id === to} phu={phu}
        loi={loi ? dich(loi) : undefined} idLoi={`pc-loi-${l.id}-${khoa}`} chiXem={chiXem}
        mo={mo?.classId === l.id && mo.khoa === khoa} dataO={h !== undefined ? `${h},${c}` : undefined}
        onMo={() => setMo(mo?.classId === l.id && mo.khoa === khoa ? null : { classId: l.id, khoa })} />
    );
  };
  const phuDong = (l: LopPc) => {
    if (nhap[l.id]) return <span className="pc-nhan-nhap">{t('Nháp · {n} ô đổi', { n: soDoi(l) })}</span>;
    if (l.cho.length) return <span className="pc-nhan-cho">{t('Chờ đổi · {tuan}', { tuan: tuanLich(l.cho[0].hieuLuc, homNay) })}{l.cho.some((c) => c.loi) && !chiXem ? ` · ⚠ ${t('chưa đổi được')}` : ''}</span>;
    return <span className="pc-phu">{[l.ft ? l.route : l.tuan ? t('tuần {n}/{tong}', { n: l.tuan.n, tong: l.tuan.tong }) : null, t('{n} HV', { n: l.soHv })].filter(Boolean).join(' · ')}</span>;
  };
  const nutCuoi = (l: LopPc, the = false) => {
    if (chiXem) return null;
    if (nhap[l.id] || (the && dangSuaThe === l.id)) {
      const loi = loiCua(l);
      const lyDo = loi.length ? `${nhanO(l, loi[0].khoa)}: ${dich(loi[0].lyDo)}` : undefined;
      return (
        <div className={the ? 'pc-hai-nut' : 'pc-hang-nut'}>
          <button type="button" className="btn btn-sm" aria-label={t('Huỷ sửa {lop}', { lop: l.code })} onClick={() => { huyDong([l.id]); if (the) setDangSuaThe(null); }}>{t('Huỷ')}</button>
          <button type="button" className="btn btn-sm btn-primary" aria-label={t('Lưu {lop}', { lop: l.code })} aria-disabled={!!loi.length || !nhap[l.id] || busy || undefined}
            aria-describedby={loi.length ? `pc-loi-${l.id}-${loi[0].khoa}` : undefined} title={lyDo}
            onClick={(e) => { if (nhap[l.id]) void luu([l.id], e.currentTarget); }}>{t('Lưu')}</button>
        </div>
      );
    }
    if (daLuu.has(l.id)) return <div className="pc-hang-nut"><span className="pc-phu-luu">✓ {t('Đã lưu')}</span></div>;
    if (l.cho.length) {
      return (
        <div className="pc-hang-nut">
          <button type="button" className="btn btn-sm" aria-haspopup="dialog" aria-expanded={hopCho?.classId === l.id}
            onClick={(e) => setHopCho({ classId: l.id, neo: e.currentTarget })}>{t('Chờ đổi')}</button>
        </div>
      );
    }
    return null;
  };
  const onPhim = (l: LopPc, e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (nhap[l.id]) void luu([l.id], e.target as HTMLElement); return; }
    const o = (e.target as HTMLElement).dataset?.o;
    if (!o || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const [h, c] = o.split(',').map(Number);
    const di = (dh: number, dc: number) => {
      for (let i = 1; i < 30; i++) {
        const el = document.querySelector<HTMLElement>(`[data-o="${h + dh * i},${c + dc * i}"]`);
        if (el) return el;
        if (dc !== 0 && (c + dc * i < 0 || c + dc * i > 8)) return null;
      }
      return null;
    };
    const dich2 = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key as 'ArrowLeft']!;
    const el = di(dich2[0], dich2[1]);
    if (el) { e.preventDefault(); el.focus(); }
  };

  /* ------------------------------------------------------------ tô sáng */
  const gvTo = to !== null ? gvMap.get(to) ?? null : null;
  const lopCuaTo = to !== null ? lop.filter((l) => l.slots.some((s) => s.userId === to)) : [];
  const batTo = (id: number | null) => {
    setTo(id);
    if (id !== null) requestAnimationFrame(() => document.querySelector('[data-to="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  if (trang.error) return <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />;
  if (!data) return <div className="card p-4"><Skeleton rows={8} /></div>;
  if (data.canChonChiNhanh) {
    return <div className="card pc-rong"><span className="tieu">{t('Chọn chi nhánh để xem phân công')}</span>{chonCn}</div>;
  }

  const soLopNhap = Object.keys(nhap).length;
  const soONhap = lop.filter((l) => nhap[l.id]).reduce((n, l) => n + soDoi(l), 0);
  const loiNhap = lop.filter((l) => nhap[l.id]).find((l) => loiCua(l).length);
  const oThieu = oThieuPc(lop, gv);
  const soNghi = gv.filter((g) => g.nghi).length;
  const lopMo = mo ? lop.find((l) => l.id === mo.classId) : null;
  const lopCho = hopCho ? lop.find((l) => l.id === hopCho.classId) : null;
  const tim = (
    <input className="field pc-tim" aria-label={t('Tìm lớp, GV')} placeholder={t('Tìm lớp, GV')} autoComplete="off" spellCheck={false} value={q} onChange={(e) => onQ(e.target.value)} />
  );
  const nutThieu = (
    <button type="button" className="nut-loc" aria-pressed={thieu} title={t('Ô Chưa có + ô của GV đã nghỉ')} onClick={() => setThieu((v) => !v)}>
      {t('Thiếu GV · {n} ô', { n: oThieu })}
    </button>
  );
  const rong = !lop.length
    ? <div className="pc-rong"><span className="tieu">{t('Chi nhánh chưa có lớp nào')}</span>{coTheTaoLop && onTaoLop && <button type="button" className="btn btn-primary" onClick={onTaoLop}>{t('+ Lớp mới')}</button>}</div>
    : !hien.length
      ? <div className="pc-rong"><span className="tieu">{q.trim() ? t('Không có lớp hay GV khớp “{q}”', { q: q.trim() }) : t('Không có lớp khớp bộ lọc')}</span>
          <button type="button" className="btn btn-ghost" onClick={() => { onQ(''); setThieu(false); }}>{t('Xoá tìm · {n} lớp', { n: lop.length })}</button></div>
      : null;

  return (
    <div className="space-y-3">
      {chiXem && (
        <div className="pc-bao-chi-xem" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          <span>{t('Chỉ xem — đổi phân công là việc của Quản lý chi nhánh.')}</span>
        </div>
      )}
      <section className="card pc-the-lop-bang" aria-label={t('Phân công theo lớp')}>
        <div className="pc-cong-cu">
          {tim}
          <div className="pc-cong-cu-2">
            {nutThieu}
            <span className="phai">
              <span><b>{lop.length}</b> {t('lớp')} · <b>{gv.length}</b> {t('GV')}{soNghi > 0 && !hep && <span className="pc-phu"> {t('({n} đã nghỉ)', { n: soNghi })}</span>}</span>
              {!hep && (
                <NutLuat label={t('Cách dùng')} phai>{chiXem
                  ? t('Bấm tên GV ở bảng tổng hợp để tô các ô của GV đó.')
                  : t('Cách dùng: bấm một ô để đổi GV — đổi xong bấm Lưu cuối dòng (sửa nhiều lớp: Lưu cả n lớp ở chân bảng). Bấm tên GV ở bảng tổng hợp để tô các ô của GV đó. Bàn phím: mũi tên đi giữa ô, Enter mở danh sách, Esc đóng.')}</NutLuat>
              )}
            </span>
          </div>
        </div>
        {gvTo && (
          <DaiToPc g={gvTo} dem={dem.get(gvTo.id)} demNhap={demNhap.get(gvTo.id)} soLop={lopCuaTo.length} hoSo={coTheMoHoSo(gvTo.id)} gon={hep}
            onChiHien={() => onQ(gvTo.ten)} onBo={() => setTo(null)} />
        )}
        {rong ?? (hep
          ? <TheLopPc lop={hien} tong={lop} chiXem={chiXem} chon={chonDong} ten={(id) => ten(id)} nghi={(id) => !!gvMap.get(id)?.nghi} to={to}
              dangSua={dangSuaThe} phu={phuDong} o={(l, k) => oCua(l, k)} cuoi={(l) => nutCuoi(l, true)}
              lopThe={(l) => (nhap[l.id] || dangSuaThe === l.id ? 'nhap' : daLuu.has(l.id) ? 'da-luu' : '')}
              onSua={(l) => { if (dangSuaThe !== null && dangSuaThe !== l.id && nhap[dangSuaThe]) { oRef.current.get(`${dangSuaThe}|gvcn`)?.scrollIntoView({ block: 'center' }); return; } setDangSuaThe(l.id); }} />
          : <BangLopPc lop={hien} tong={lop} chiXem={chiXem}
              ve={{ o: oCua, phu: phuDong, cuoi: (l) => nutCuoi(l), lop: (l) => (nhap[l.id] ? 'nhap' : daLuu.has(l.id) ? 'da-luu' : ''),
                loiHang: (l) => (loiHang[l.id] ? <span><b>⚠ {loiHang[l.id]}</b>{khacDoi[l.id]?.length ? ` ${t('Ô {o} theo bản mới — kiểm lại rồi bấm Lưu.', { o: khacDoi[l.id].map((k) => nhanO(l, k)).join(', ') })}` : ''}</span> : null),
                onPhim }} />)}
        {soLopNhap >= 2 && !chiXem && (
          <ThanhLuuPc ref={thanhLuu} soLop={soLopNhap} soO={soONhap} mo={!!hop && hop.ids.length > 1} busy={busy}
            loi={loiNhap ? t('{lop}: sửa ô báo lỗi trước khi lưu', { lop: loiNhap.code }) : null}
            onHuyHet={() => huyDong(Object.keys(nhap).map(Number))} onLuu={() => void luu(Object.keys(nhap).map(Number), thanhLuu.current)} />
        )}
        {hep && Object.entries(loiHang).map(([id, m]) => <p key={id} className="pc-loi-the" role="alert">⚠ {lop.find((l) => l.id === Number(id))?.code}: {m}</p>)}
      </section>

      <TongHopPc dem={dem} demNhap={demNhap} gv={gv} to={to} onTo={batTo} gon={dt} />

      {lopMo && mo && !chiXem && (
        <ChonGvPc neo={oRef.current.get(`${mo.classId}|${mo.khoa}`) ?? null} nhanO={`${nhanO(lopMo, mo.khoa)} ${lopMo.code}`} ds={dsChon(lopMo, mo.khoa)} tamDuoi={dt}
          onChon={(v) => setO(lopMo, mo.khoa, v)} onDong={() => setMo(null)} />
      )}
      {hop && (
        <HopLuuPhanCong lop={lopLuu(hop.ids)} tuanMacDinh={hop.tuan} neoEl={hop.neo} neo={dt || hep ? 'tam-duoi' : 'dong'} ten={ten}
          onQuayLai={() => setHop(null)} onLoi={(e) => loiLuu(e, hop.ids)} onDaLuu={(kq) => daLuuXong(kq, lopLuu(hop.ids))} />
      )}
      {lopCho && hopCho && (
        <HopChoDoi code={lopCho.code} cho={lopCho.cho} nhanO={(k) => nhanO(lopCho, k)} ten={ten} neoEl={hopCho.neo} tamDuoi={dt}
          onDong={() => setHopCho(null)}
          onXong={(viec, kq) => {
            setHopCho(null);
            invalidate('/hoc-vien-lop/phan-cong');
            invalidateGop('/my-work', '/classes');
            toast.hoanTac(viec === 'huy' ? t('Đã huỷ lịch đổi {lop}', { lop: lopCho.code }) : t('Đã đổi mốc {lop}', { lop: lopCho.code }), () => {
              api.post('/phan-cong/hoan-tac', { dao: kq.dao })
                .then(() => { invalidate('/hoc-vien-lop/phan-cong'); toast.push('ok', t('Đã hoàn tác')); })
                .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
            });
          }} />
      )}
    </div>
  );
}
