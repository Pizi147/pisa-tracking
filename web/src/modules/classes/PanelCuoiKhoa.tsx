import { useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { chayHangLoat, hoanTacHangLoat } from '../students/hangLoatEm.ts';
import {
  CHU_CHUYEN_LOP, NORMAL_LADDER, RATIO_PASS_THRESHOLD, chonChuaGui, chonDongGui, chonDongLuu, chonLuuSauXacNhan, coMt0, hanChotLenFt, huongTiepKhaDung, khacGoiY, kiemDongLenh, kyHieuLop, maHocVienNgan,
  ngay, nhanHuongNgan, sauGhiPanel, targetLenFt, tuanLich, xepHuongTheoGoiY,
  type DongLuuCk, type GoiYCuoiKhoa, type Huong, type HuongLenh, type MucTieuLenh, type ProgrammeCode,
} from '@shared/domain/index.ts';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';
import { OMt0, OTuan } from './TransitionPanel.tsx';

/** Một dòng đang soạn. `lop` trống = theo lớp chọn ở hàng nhóm của hướng đó. */
type Dong = { huong: Huong | ''; lop: number | ''; tuan: string; mucTieu: string; lyDo: string; ngayXemLai: string; ghiChu: string };
type Lop = { id: number; code: string; ft: boolean; route: string | null; programmeCode: ProgrammeCode | null; branchCode: string; studentCount: number };
type Lenh = { id: number; huong: string; lopDichId: number | null; lopDichMa: string | null; ngayRaLenh: string | null; tuan: string;
  mucTieu: MucTieuLenh | null; lyDo: string | null; ngayXemLai: string | null; loi: string | null };
type Em = {
  id: number; studentCode: string; fullName: string; target: number | null; kck?: boolean;
  loTrinhTiep: { huong: Huong; lopDuKienId: number | null; mucTieu: number | null; ghiChu: string | null; huongGvcn?: Huong | null } | null;
  dienSan: { huong: HuongLenh; mucTieu: MucTieuLenh | null; lopDichId: number | null } | null;
  cuoiKhoa: { tyLe: number | null; scored: number; required: number; mon: { ratio: number | null }[]; goiY: GoiYCuoiKhoa | null } | null;
  lenh: Lenh | null; mt0: Parameters<typeof OMt0>[0]['mt0'];
};

/** Link chữ trong hàng (Đổi tuần, Huỷ quyết định): vùng bấm 44px ở điện thoại (audit T5). */
const CHAM_375 = 'max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center';
const CAN_LOP: readonly Huong[] = ['len_lop', 'fast_track', 'hoc_lai'];
const laLenh = (h: Huong | ''): h is Exclude<Huong, 'chua_quyet'> => h !== '' && h !== 'chua_quyet';
const SAU_LENH: readonly string[] = ['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc'];
/** Lỗi `kiemDongLenh` → chữ ngắn trong ngoặc ở "Chưa gửi — …". */
const LY_DO_CHUA_GUI: Record<string, string> = {
  'Chọn hướng cho em': 'chưa quyết', 'Chọn lớp chuyển đến': 'chưa có lớp', 'Ghi Target (hoặc KCK)': 'thiếu Target', 'Ghi lý do ngắn': 'thiếu lý do',
  'Chọn tuần xem lại': 'thiếu tuần xem lại',
};

/** QL 1440: ☐ · Học viên · Final Test · Gợi ý · GVCN · Hướng · Target · Lớp chuyển đến · Tuần · Ghi chú. GVCN: Học viên · Final Test · Gợi ý · Hướng · Target · Ghi chú. */
const LUOI_QL = 'grid-cols-[28px_minmax(150px,1.1fr)_96px_minmax(140px,.9fr)_minmax(180px,1.15fr)_96px_minmax(180px,1.1fr)_96px_minmax(170px,1fr)]';
const LUOI_GV = 'grid-cols-[minmax(160px,1.1fr)_110px_minmax(140px,.9fr)_minmax(230px,1.4fr)_80px_minmax(200px,1.2fr)]';

/**
 * LỘ TRÌNH TIẾP THEO · {lớp} (PR-LCb, mockup `mockup-panel-cuoi-khoa-2026-10-07.html` + `mockup-cuoi-khoa-2-2026-10-08.html` phần 1, đặc tả 08/10 §1 §7) —
 * MỘT panel cuối khoá cho lớp THƯỜNG, thay "Ghi lộ trình tiếp theo cả lớp" và "Chuyển lớp · {lớp}". Lớp FT giữ `TransitionPanel`.
 * Nguồn duy nhất `GET /classes/:id/transition`. Vai theo cờ máy chủ: `coTheRaLenh` = Quản lý (Soạn › Xác nhận = ra / sửa quyết định chuyển lớp);
 * `coTheGhiHuong` = GVCN (đề xuất Hướng + Ghi chú, `PUT /classes/:id/lo-trinh-tiep`); không cờ nào = chỉ xem.
 * Target giữ như cũ (§7): chỉ chữ; ô chỉ hiện khi em Lên FT chưa có Target nào. Không hỏi tháng thi — máy chủ giữ như cũ.
 */
export function PanelCuoiKhoa({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const dt = useDienThoai();
  const lf = useLoiForm();
  const { data, loading, error, reload, refreshing } = useApi<any>(`/classes/${classId}/transition`, [classId]);
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [tuanChung, setTuanChung] = useState('');
  const [dongs, setDongs] = useState<Record<number, Partial<Dong>>>({});
  const dongsMoi = useRef(dongs); dongsMoi.current = dongs;
  /** Em đã sửa phần QUYẾT ĐỊNH (không tính ghi chú) — lệnh cũ chỉ gửi lại khi có trong tập này. */
  const [daSua, setDaSua] = useState<ReadonlySet<number>>(new Set());
  const [nhomLop, setNhomLop] = useState<Partial<Record<Huong, number>>>({});
  const [chon, setChon] = useState<ReadonlySet<number>>(new Set());
  const [bulk, setBulk] = useState<Huong | ''>('');
  const [loiDong, setLoiDong] = useState<Record<number, string>>({});
  const [taoLop, setTaoLop] = useState<Huong | null>(null);
  const [huy, setHuy] = useState<{ sid: number; lyDo: string } | null>(null);
  const [huyNhieu, setHuyNhieu] = useState<{ lyDo: string } | null>(null);

  const ten = data ? `Lộ trình tiếp theo · ${data.from.code}` : 'Lộ trình tiếp theo';
  if (error) return <KhungPanel tieuDe={ten} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (loading || !data) return <KhungPanel tieuDe={ten} rong="toan" onDong={onClose}><Skeleton rows={8} /></KhungPanel>;

  const laQl: boolean = !!data.coTheRaLenh;
  const laGv = !laQl && !!data.coTheGhiHuong;
  const homNay: string = data.today;
  const students: Em[] = data.students ?? [];
  const candidates: Lop[] = data.candidates ?? [];
  const maTu = (data.from.programmeCode ?? null) as ProgrammeCode | null;
  const maKe = maTu ? NORMAL_LADDER[maTu] ?? null : null;
  const ctx = { ma: maTu, maKe };
  const tuanCh: string = tuanChung || data.tuanChon?.[0] || '';
  const tuanFinal: string | null = data.tuanCuoiKhoa ?? null;
  const cacHuong = huongTiepKhaDung(maTu);
  const TEN: Record<string, string> = {
    len_lop: `Lên ${kyHieuLop(maKe, null) ?? ''}`.trim(), fast_track: 'Lên FT', hoc_lai: 'Học lại', bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', chua_quyet: 'Chưa quyết',
  };
  const nhanH = (h: Huong) => nhanHuongNgan(h, ctx);

  const goc = (s: Em): Dong => {
    const ghiChu = s.loTrinhTiep?.ghiChu ?? '';
    const l = s.lenh;
    if (l && SAU_LENH.includes(l.huong)) {
      return { huong: l.huong as Huong, lop: l.lopDichId ?? '', tuan: l.tuan === tuanCh || l.tuan <= homNay ? '' : l.tuan, mucTieu: '', lyDo: l.lyDo ?? '', ngayXemLai: l.ngayXemLai ?? '', ghiChu };
    }
    if (s.dienSan) return { huong: s.dienSan.huong as Huong, lop: s.dienSan.lopDichId ?? '', tuan: '', mucTieu: '', lyDo: '', ngayXemLai: '', ghiChu };
    if (s.loTrinhTiep) return { huong: s.loTrinhTiep.huong, lop: '', tuan: '', mucTieu: '', lyDo: '', ngayXemLai: '', ghiChu };
    /* GVCN (như bảng cả lớp cũ): chưa ghi thì điền hướng Hệ thống gợi ý khi chỉ có MỘT hướng; QL để "Chọn hướng". */
    const { dau } = xepHuongTheoGoiY(cacHuong, s.cuoiKhoa?.goiY);
    return { huong: !laQl && dau.length === 1 ? dau[0] : '', lop: '', tuan: '', mucTieu: '', lyDo: '', ngayXemLai: '', ghiChu };
  };
  const dongCua = (s: Em): Dong => ({ ...goc(s), ...(dongs[s.id] ?? {}) });
  const sua = (sid: number, p: Partial<Dong>) => {
    if (Object.keys(p).some((k) => k !== 'ghiChu')) setDaSua((x) => (x.has(sid) ? x : new Set(x).add(sid)));
    setDongs((m) => ({ ...m, [sid]: { ...m[sid], ...p } }));
    setLoiDong((m) => { if (!(sid in m)) return m; const { [sid]: _, ...con } = m; return con; });
  };

  const lopHopLe = (h: Huong | ''): Lop[] => candidates.filter((c) =>
    h === 'fast_track' ? c.ft : h === 'len_lop' ? !c.ft && c.programmeCode === maKe : h === 'hoc_lai' ? !c.ft && c.programmeCode === maTu : false);
  const lopTheoId = (id: number | '' | undefined) => (id ? candidates.find((c) => c.id === id) ?? null : null);
  const phuLop = (c: Lop) => [c.ft ? `FT ${c.route ?? ''}`.trim() : kyHieuLop(c.programmeCode, null), c.branchCode, `${c.studentCount} em`].filter(Boolean).join(' · ');
  const dsLop = (h: Huong): NguoiTrongDs[] => lopHopLe(h).map((c) => ({ id: c.id, ten: c.code, phu: phuLop(c) }));
  /** Lớp thật của dòng: lớp riêng, không thì lớp hàng nhóm. Lệnh đã có giữ mã lớp máy chủ trả (GVCN không có `candidates`). */
  const lopCua = (d: Dong) => (CAN_LOP.includes(d.huong as Huong) ? (d.lop || nhomLop[d.huong as Huong] || '') : '');
  const maLop = (s: Em, d: Dong) => lopTheoId(lopCua(d))?.code ?? (s.lenh && lopCua(d) === s.lenh.lopDichId ? s.lenh.lopDichMa : null);

  /** Target hiện có (§7): lệnh → LTT → khoá. null = chưa có Target nào → hiện ô. */
  const targetCo = (s: Em): MucTieuLenh | null => s.lenh?.mucTieu ?? targetLenFt({ lt: s.loTrinhTiep, khoa: { target: s.target, kck: !!s.kck } });
  const oTarget = (s: Em, d: Dong) => d.huong === 'fast_track' && targetCo(s) === null;
  const mucTieuO = (d: Dong): MucTieuLenh | null => (d.mucTieu === 'KCK' ? 'KCK' : d.mucTieu.trim() === '' || Number.isNaN(Number(d.mucTieu)) ? null : Number(d.mucTieu));
  const mucTieuCua = (s: Em, d: Dong) => (oTarget(s, d) ? mucTieuO(d) : targetCo(s));
  const kiemTra = (s: Em, d: Dong): string | null => {
    if (!laLenh(d.huong)) return 'Chọn hướng cho em';
    const lop = lopTheoId(lopCua(d));
    return kiemDongLenh({
      huong: d.huong, lopDichId: lopCua(d) || null, lopDichFt: lop ? lop.ft : d.huong === 'fast_track', nguonFt: false, tuan: d.tuan || tuanCh, homNay,
      lyDo: d.lyDo || null, khacGoiY: khacGoiY(d.huong, s.cuoiKhoa?.goiY), mucTieu: mucTieuCua(s, d), ngayXemLai: d.ngayXemLai || null,
    });
  };

  /** Ghi chú đổi so với Lộ trình tiếp theo đã lưu. */
  const doiGhiChu = (s: Em, d: Dong) => d.ghiChu.trim() !== (s.loTrinhTiep?.ghiChu ?? '');
  /* Chọn dòng gửi / lưu: hàm thuần `shared/domain/chuyenLop.ts` (kiểm LCb-x) — panel chỉ tính sẵn từng dòng. */
  const rows = students.map((s) => {
    const d = dongCua(s);
    return {
      s, d, id: s.id, loi: kiemTra(s, d), huong: d.huong, lenh: s.lenh ? { huong: huongLenhGv(s), loi: !!s.lenh.loi } : null, daSua: daSua.has(s.id),
      huongLtt: s.loTrinhTiep?.huong ?? null, doiGhiChu: doiGhiChu(s, d), targetMoi: !s.lenh && oTarget(s, d) && typeof mucTieuO(d) === 'number',
    };
  });
  const canGui = chonDongGui(rows);
  const chuaGui = chonChuaGui(rows);
  const thieuTarget = rows.filter((r) => oTarget(r.s, r.d) && mucTieuO(r.d) === null).length;
  /** Dòng "Lưu hướng" / "Lưu n em". */
  const luuDuoc = chonDongLuu(rows, laQl);
  const itemLuu = ({ r: { s, d }, huong, target }: DongLuuCk<(typeof rows)[number]>) => ({
    studentId: s.id, huong, ghiChu: d.ghiChu.trim() || null, ...(target ? { mucTieu: mucTieuO(d) } : {}),
  });
  /* Sau await: dòng chưa đổi từ lúc gửi (`snap`) lấy bản đã trừ phần đã ghi (`sau`); dòng gõ thêm trong lúc chờ giữ nguyên. */
  const apSau = (snap: Record<number, Partial<Dong>>, sau: Record<number, Partial<Dong>>) => (cur: Record<number, Partial<Dong>>) =>
    Object.fromEntries(Object.entries(cur).flatMap(([k, x]) => { const g = x === snap[Number(k)] ? sau[Number(k)] : x; return g ? [[k, g]] : []; }));
  const lamMoi = () => { for (const k of ['/classes', '/students', '/hoc-vien-lop', '/my-work', '/lenh-chuyen', '/yeu-cau']) invalidate(k); };

  const luu = async () => {
    if (!luuDuoc.length) return;
    setBusy(true);
    try {
      await api.put(`/classes/${classId}/lo-trinh-tiep`, { items: luuDuoc.map(itemLuu) });
      lamMoi();
      toast.push('ok', laQl ? `Đã lưu hướng ${luuDuoc.length} em` : `Đã lưu ${luuDuoc.length} em`);
      /* QL: chỉ bỏ ghi chú của dòng ĐÃ lưu (rà cuối I1). GVCN: mọi dòng sửa được đều vào lô (chưa Hướng + ghi chú → Chưa quyết) nên đóng. */
      if (laQl) { setDongs(apSau(dongs, sauGhiPanel(dongs, daSua, { ok: [], failed: [] }, { ids: luuDuoc.map((x) => x.r.id), loi: false }).dongs)); reload(); }
      else { onDone(); onClose(); }
    } catch (e: any) {
      const sid = Number(e?.details?.studentId);
      if (sid) setLoiDong({ [sid]: e.status === 409 ? 'Quản lý đã quyết' : e.message });
      if (e.status === 409) reload();
      toast.push('error', `Chưa lưu em nào. ${e.message}`);
    } finally { setBusy(false); }
  };

  const gui = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ ok: number[]; failed: { studentId: number; message: string }[] }>(`/classes/${classId}/transition`, {
        tuanChung: tuanCh,
        dongs: canGui.map(({ s, d }) => ({
          studentId: s.id, huong: d.huong, toClassId: lopCua(d) || undefined, tuan: d.tuan || undefined,
          /* Target chỉ gửi khi có ô (em chưa có Target nào) — còn lại máy chủ tự điền (LCa-2). */
          mucTieu: oTarget(s, d) ? mucTieuO(d) ?? undefined : undefined, lyDo: d.lyDo || undefined,
          ngayXemLai: d.huong === 'bao_luu' ? d.ngayXemLai || undefined : undefined,
        })),
      });
      /*
       * Ghi chú đi đường Lộ trình tiếp theo (lệnh không mang ghi chú): em vừa xác nhận + mọi dòng lưu được ngoài lô gửi (ghi chú em đã có lệnh,
       * Hướng / ghi chú em "Chưa gửi") — một PUT (rà cuối I2). Lỗi → giữ hết ghi chú để Lưu hướng.
       */
      const luuSau = chonLuuSauXacNhan(rows, r.ok, laQl);
      let loiGc = false;
      if (luuSau.length) {
        try { await api.put(`/classes/${classId}/lo-trinh-tiep`, { items: luuSau.map(itemLuu) }); }
        catch (e: any) { loiGc = true; toast.push('error', `Chưa lưu ghi chú — bấm Lưu hướng để lưu lại. ${e.message}`); }
      }
      lamMoi();
      /* Em đã xác nhận rời panel; em lỗi + sửa chưa gửi được (lớp, tuần của em "Chưa gửi") ở lại — chỉ đóng khi không còn gì. */
      const sau = sauGhiPanel(dongs, daSua, r, { ids: luuSau.map((x) => x.r.id), loi: loiGc });
      /* Có chữ gõ thêm trong lúc chờ → không đóng, giữ lại cho em. */
      const coGoThem = Object.entries(dongsMoi.current).some(([k, x]) => x !== dongs[Number(k)]);
      if (sau.dong && !coGoThem) {
        toast.push('ok', `Đã xác nhận ${r.ok.length} em`);
        onDone(); onClose();
        return;
      }
      setDaSua((cur) => new Set([...cur].filter((id) => !r.ok.includes(id))));
      setDongs(apSau(dongs, sau.dongs));
      setLoiDong(Object.fromEntries(r.failed.map((f) => [f.studentId, f.message])));
      setBuoc(1);
      const con = Object.keys(apSau(dongs, sau.dongs)(dongsMoi.current)).length;
      if (r.failed.length) toast.push('error', `${r.failed.length} em chưa xác nhận được — xem lỗi ở từng hàng`);
      else toast.push('ok', `Đã xác nhận ${r.ok.length} em${!loiGc && con ? ` · ${con} em chưa gửi` : ''}`);
      reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const huyLenh = async () => {
    const s = huy && students.find((x) => x.id === huy.sid);
    if (!s?.lenh || busy) return;
    setBusy(true);
    try {
      await api.post(`/lenh-chuyen/${s.lenh.id}/huy`, { lyDo: huy!.lyDo });
      lamMoi();
      setDongs((m) => { const { [s.id]: _, ...con } = m; return con; });
      setHuy(null); reload();
      toast.push('ok', 'Đã huỷ quyết định');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const chonCoLenh = students.filter((s) => chon.has(s.id) && s.lenh);
  const huyNhieuLenh = async () => {
    if (!huyNhieu) return;
    setBusy(true);
    const kq = await chayHangLoat('huy-lenh', chonCoLenh.map((s) => s.id), { lyDo: huyNhieu.lyDo.trim() });
    setBusy(false); lamMoi(); reload();
    if (kq.failed.length) toast.push('error', `Đã huỷ ${kq.ok.length} quyết định · ${kq.failed.length} chưa huỷ — ${kq.failed[0].message}`);
    if (!kq.ok.length) return;
    setChon(new Set()); setHuyNhieu(null);
    toast.hoanTac(`Đã huỷ quyết định ${kq.ok.length} em`, async () => {
      const r = await hoanTacHangLoat('huy-lenh', kq.ok);
      lamMoi(); reload();
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? r.failed[0].message : 'Đã khôi phục quyết định');
    }, { key: 'huy-lenh-nhieu' });
  };
  const apChoNhieu = () => {
    if (!bulk) return;
    for (const sid of chon) sua(sid, { huong: bulk, lop: '' });
    setChon(new Set());
  };
  const tiepTuc = () => { lf.bam(); if (canGui.length) setBuoc(2); };

  // ------------------------------------------------------------------ dải đầu
  const han = tuanFinal ? hanChotLenFt(tuanFinal) : null;
  const conChuaLenh = students.some((s) => !s.lenh);
  const quaHan = han && homNay > han ? Math.round((Date.parse(homNay) - Date.parse(han)) / 86_400_000) : 0;
  const coLenh = students.filter((s) => s.lenh);
  const ngayXacNhan = coLenh.map((s) => s.lenh!.ngayRaLenh ?? '').sort().pop() || null;
  const dai = laQl && quaHan > 0 && conChuaLenh ? <Dai do nhan={`Quá hạn ${quaHan} ngày`}>Hạn chốt hết CN {ngay(han, homNay)}</Dai>
    : laGv && coLenh.length ? <Dai nhan={`Quản lý đã xác nhận${ngayXacNhan ? ` ${ngay(ngayXacNhan, homNay)}` : ''}`}>{dt ? 'Hướng khoá' : `${coLenh.length} em · Hướng khoá`}</Dai>
    : null;

  // ------------------------------------------------------------------ nhóm hướng (QL)
  const nhom = CAN_LOP.filter((h) => cacHuong.includes(h)).map((h) => {
    const em = rows.filter((r) => r.d.huong === h);
    const thieu = em.filter((r) => !lopCua(r.d)).length;
    /* Mọi em của nhóm đã có quyết định kèm lớp → không còn gì để chọn ở hàng nhóm (ô trống trông như việc còn dở — audit T5). */
    const xong = thieu === 0 && !nhomLop[h] && em.every((r) => r.s.lenh);
    return { h, n: em.length, thieu, xong };
  }).filter((x) => x.n > 0 && !x.xong);

  const demChan = (() => {
    const m = new Map<string, number>();
    for (const r of rows) { const k = laLenh(r.d.huong) ? TEN[r.d.huong] : TEN.chua_quyet; m.set(k, (m.get(k) ?? 0) + 1); }
    const thuTu = [TEN.len_lop, TEN.fast_track, TEN.hoc_lai, TEN.bao_luu, TEN.dung_hoc, TEN.chua_quyet];
    return [...m.entries()].sort((a, b) => thuTu.indexOf(a[0]) - thuTu.indexOf(b[0]));
  })();

  const tieuDe = dt ? ten : `${ten} · ${students.length} em`;
  const thanhDau = dt
    ? [`${students.length} em`, tuanFinal ? `Final ${tuanLich(tuanFinal, homNay)}` : null, laQl ? (buoc === 1 ? '1 Soạn' : '2 Xác nhận') : null]
    : [data.from.code, `${students.length} em`, tuanFinal ? `Final ${tuanLich(tuanFinal, homNay)}` : null];
  const btn = 'btn min-h-[44px] sm:min-h-0';
  /* Sau Lưu / Xác nhận, `reload` chạy nền: khoá nút gửi tới khi nạp xong — không để em vừa xác nhận lọt lại vào "Tiếp tục" (rà T4 m1). */
  const khoaGui = busy || refreshing;
  const daSuaGi = Object.keys(dongs).length > 0 || Object.values(nhomLop).some(Boolean) || !!tuanChung;

  const chan = !students.length || (!laQl && !laGv) ? undefined
    : laGv ? {
      huy: null,
      phu: <button type="button" className={`${btn} max-sm:hidden`} onClick={onClose} disabled={busy}>{Object.keys(dongs).length > 0 ? 'Huỷ thay đổi' : 'Đóng'}</button>,
      chinh: <button type="button" className={`${btn} btn-primary`} onClick={luu} disabled={khoaGui || !luuDuoc.length}>{busy ? 'Đang lưu…' : luuDuoc.length ? `Lưu ${luuDuoc.length} em` : 'Lưu'}</button>,
    }
    : buoc === 1 ? {
      huy: null,
      dongTren: (
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 pt-2 text-xs tabular-nums text-slate-400">
          <span>{demChan.map(([k, n], i) => <span key={k}>{i > 0 && ' · '}{k} <b className="text-slate-100">{n}</b></span>)}</span>
          {thieuTarget > 0 && <span className="text-late">{thieuTarget} em thiếu Target</span>}
        </div>
      ),
      phu: (
        <>
          {/* Luật S3 (KhungPanel): đã sửa → "Huỷ thay đổi", chưa → "Đóng". Tự vẽ để ba nút cùng phía phải như mockup. */}
          <button type="button" className={`${btn} max-sm:hidden`} onClick={onClose} disabled={busy}>{daSuaGi ? 'Huỷ thay đổi' : 'Đóng'}</button>
          <button type="button" className={btn} onClick={luu} disabled={khoaGui || !luuDuoc.length}>{busy ? 'Đang lưu…' : 'Lưu hướng'}</button>
        </>
      ),
      chinh: <button type="button" className={`${btn} btn-primary`} onClick={tiepTuc} disabled={khoaGui || !canGui.length}>Tiếp tục · {canGui.length} em</button>,
    }
    : {
      huy: { nhan: '← Quay lại', onClick: () => setBuoc(1), disabled: busy },
      chinh: <button type="button" className={`${btn} btn-primary`} onClick={gui} disabled={khoaGui}>{busy ? 'Đang xác nhận…' : `Xác nhận · ${canGui.length} em`}</button>,
    };

  return (
    <>
      <KhungPanel longTrong rong="toan" onDong={taoLop ? () => {} : onClose} tieuDe={tieuDe}
        ngCanh={laQl && !dt ? <span><BuocSo so={1} hien={buoc}>1 Soạn</BuocSo> › <BuocSo so={2} hien={buoc}>2 Xác nhận</BuocSo></span> : undefined} chan={chan}>
        <p className="m-0 mt-3 text-[13px] font-semibold tabular-nums text-slate-200">{thanhDau.filter(Boolean).join(' · ')}</p>
        {dai && <div className="mt-2">{dai}</div>}
        {!laQl && !laGv && <p className="mt-3 text-sm text-slate-400">Bạn chỉ xem được.</p>}

        {students.length === 0 ? <p className="mt-3 text-sm text-slate-400">Lớp chưa có học viên đang học.</p>
          : laQl && buoc === 2 ? (
            <BuocXacNhan rows={canGui} chuaGui={chuaGui} tenNhom={TEN} maLop={maLop} tuanCh={tuanCh} homNay={homNay}
              mt0={coMt0(maTu, 'fast_track')} lyDoChuaGui={(r) => LY_DO_CHUA_GUI[r.loi!] ?? r.loi!} />
          ) : (
            <div className="space-y-3 pt-3">
              {laQl && (
                <>
                  <div>
                    <span id="tuan-chung" className="mb-1 block text-[11.5px] font-bold text-slate-200">Tuần bắt đầu chung</span>
                    <div role="group" aria-labelledby="tuan-chung" className="flex flex-wrap gap-1.5">
                      {(data.tuanChon as string[]).map((t) => <NutChon key={t} chon={tuanCh === t} onClick={() => setTuanChung(t)}>{tuanLich(t, homNay)}</NutChon>)}
                    </div>
                  </div>
                  {nhom.length > 0 && (
                    <div className="surface-2 space-y-2 rounded-lg px-3 py-2.5" role="group" aria-label="Lớp chuyển đến theo hướng">
                      {nhom.map(({ h, n, thieu }) => (
                        <div key={h} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                          <b className="min-w-[8.5rem] pt-2 text-[12.5px] text-slate-100 max-sm:basis-full max-sm:pt-0">{TEN[h]} · {n} em</b>
                          <div className="w-full sm:w-80">
                            {nhomLop[h] && lopTheoId(nhomLop[h]) ? (
                              <div className="field flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate"><span className="text-slate-100">{lopTheoId(nhomLop[h])!.code}</span>
                                  <span className="text-xs text-slate-500"> · {phuLop(lopTheoId(nhomLop[h])!)}</span></span>
                                <button type="button" className="btn btn-sm btn-ghost -my-1 h-7 shrink-0 !py-0 max-sm:min-h-0" aria-label={`Bỏ lớp cho nhóm ${TEN[h]}`}
                                  onClick={() => setNhomLop((m) => ({ ...m, [h]: undefined }))}>✕</button>
                              </div>
                            ) : (
                              <ChonNguoi value={null} nhom="nhan_vien" choToi={false} choNgoai={false} ds={dsLop(h)} placeholder="Gõ tên lớp…"
                                ariaLabel={`Lớp chuyển đến cho nhóm ${TEN[h]}`} invalid={(lf.daBam || !canGui.length) && thieu > 0}
                                khongKhop={(go) => `Không có lớp khớp “${go}”`}
                                onChange={(v) => v?.kieu === 'tai_khoan' && setNhomLop((m) => ({ ...m, [h]: v.id }))} />
                            )}
                            {(lf.daBam || !canGui.length) && thieu > 0 && <span role="alert" className="mt-1 block text-[12px] text-late">Chọn lớp cho {thieu} em {TEN[h]}</span>}
                          </div>
                          {data.canEdit && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0 sm:mt-1" onClick={() => setTaoLop(h)}>+ Mở lớp mới…</button>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="surface-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" role="group" aria-label="Chọn nhiều em">
                    <span className="text-xs font-semibold tabular-nums text-slate-200">{chon.size} em đang chọn</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc'] as Huong[]).filter((h) => cacHuong.includes(h)).map((h) => (
                        <NutChon key={h} nho chon={bulk === h} onClick={() => setBulk(bulk === h ? '' : h)}>{TEN[h]}</NutChon>
                      ))}
                    </div>
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!bulk || !chon.size} onClick={apChoNhieu}>Áp cho {chon.size} em</button>
                    <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={!chonCoLenh.length || busy} onClick={() => setHuyNhieu({ lyDo: '' })}>{CHU_CHUYEN_LOP.huy}</button>
                  </div>
                  {huyNhieu && (
                    <div role="group" aria-label={CHU_CHUYEN_LOP.huy} className="surface-2 space-y-2 rounded-lg px-3 py-2">
                      <p className="m-0 text-sm font-semibold text-slate-100">{CHU_CHUYEN_LOP.huy} {chonCoLenh.length} em</p>
                      <input className="field w-full" aria-label="Lý do" placeholder="Lý do" maxLength={2000} value={huyNhieu.lyDo} onChange={(e) => setHuyNhieu({ lyDo: e.target.value })} />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setHuyNhieu(null)}>{CHU_CHUYEN_LOP.giu}</button>
                        <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !huyNhieu.lyDo.trim()} onClick={huyNhieuLenh}>{CHU_CHUYEN_LOP.huy} {chonCoLenh.length} em</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div role="table" aria-label={`Lộ trình tiếp theo lớp ${data.from.code}`} className={dt ? 'space-y-2' : 'surface-2 overflow-x-auto rounded-lg'}>
                {!dt && (
                  <div role="row" className={`grid min-w-max gap-x-3 border-b px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500 lg:min-w-0 ${laQl ? LUOI_QL : LUOI_GV}`} style={{ borderColor: 'var(--line)' }}>
                    {laQl && <span role="columnheader"><input type="checkbox" aria-label="Chọn cả lớp" checked={chon.size > 0 && chon.size === students.length}
                      onChange={(e) => setChon(e.target.checked ? new Set(students.map((s) => s.id)) : new Set())} /></span>}
                    <span role="columnheader">Học viên</span>
                    <span role="columnheader">Final Test</span>
                    <span role="columnheader">{laQl ? 'Gợi ý · GVCN' : 'Gợi ý'}</span>
                    <span role="columnheader">Hướng</span>
                    <span role="columnheader">Target</span>
                    {laQl && <span role="columnheader">Lớp chuyển đến</span>}
                    {laQl && <span role="columnheader">Tuần</span>}
                    <span role="columnheader">Ghi chú</span>
                  </div>
                )}
                <div className={dt ? 'space-y-2' : 'divide-y'} style={dt ? undefined : { borderColor: 'var(--line)' }}>
                  {rows.map(({ s, d, loi }) => {
                    const p: HangProps = {
                      s, d, laQl, laGv, dt, cacHuong, nhanH, homNay, tuanCh, tuanFinal, maTu, tuanChon: data.tuanChon, oTarget: oTarget(s, d), targetCo: targetCo(s),
                      loi: laQl && (lf.daBam || daSua.has(s.id)) && laLenh(d.huong) ? loi : null, loiMayChu: loiDong[s.id] ?? null,
                      maLop: maLop(s, d), lopRieng: d.lop || '', nhomCo: !!nhomLop[d.huong as Huong], ds: CAN_LOP.includes(d.huong as Huong) ? dsLop(d.huong as Huong) : [],
                      chon: chon.has(s.id), onChon: (v) => setChon((x) => { const nn = new Set(x); if (v) nn.add(s.id); else nn.delete(s.id); return nn; }),
                      sua: (pp) => sua(s.id, pp), busy,
                      huy: huy?.sid === s.id ? huy : null, moHuy: () => setHuy({ sid: s.id, lyDo: '' }), doiLyDoHuy: (v) => setHuy({ sid: s.id, lyDo: v }),
                      dongHuy: () => setHuy(null), xacNhanHuy: huyLenh,
                    };
                    return <HangEm key={s.id} {...p} />;
                  })}
                </div>
              </div>
            </div>
          )}
      </KhungPanel>
      {taoLop && (
        <ClassCreatePanel moHoSo={false}
          macDinh={{
            ...(data.goiYLopMoi ?? { branchId: data.from.branchId }), previousClassId: data.from.id,
            chuongTrinh: taoLop === 'fast_track' ? 'FT' : taoLop === 'len_lop' ? maKe ?? undefined : maTu ?? undefined,
            loTrinh: taoLop === 'fast_track' ? 'LT1' : null,
            so: data.goiYLopMoi && data.goiYLopMoi.chuongTrinh === (taoLop === 'fast_track' ? 'FT' : taoLop === 'len_lop' ? maKe : maTu) ? data.goiYLopMoi.so : undefined,
          }}
          onDone={(lop) => { const h = taoLop; reload(); setNhomLop((m) => ({ ...m, [h]: lop.id })); setTaoLop(null); }}
          onClose={() => setTaoLop(null)} />
      )}
    </>
  );
}

/** Bước của "1 Soạn › 2 Xác nhận": bước đang ở đậm + `aria-current` (audit T5 — trước đây hai bước như nhau). */
function BuocSo({ so, hien, children }: { so: 1 | 2; hien: 1 | 2; children: ReactNode }) {
  return so === hien ? <b className="text-slate-100" aria-current="step">{children}</b> : <span>{children}</span>;
}

function Dai({ nhan, do: doHan, children }: { nhan: string; do?: boolean; children: ReactNode }) {
  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border px-3 py-2 text-sm ${doHan ? 'border-late-line bg-late-bg' : ''}`}
      style={doHan ? undefined : { borderColor: 'var(--line)', background: 'var(--surface-2, transparent)' }}>
      <b className={doHan ? 'text-late' : 'text-slate-100'}>{nhan}</b>
      <span className="text-slate-300">{children}</span>
    </div>
  );
}

type HangProps = {
  s: Em; d: Dong; laQl: boolean; laGv: boolean; dt: boolean; cacHuong: Huong[]; nhanH: (h: Huong) => string; homNay: string; tuanCh: string;
  tuanFinal: string | null; maTu: ProgrammeCode | null; tuanChon: string[]; oTarget: boolean; targetCo: MucTieuLenh | null;
  loi: string | null; loiMayChu: string | null; maLop: string | null; lopRieng: number | ''; nhomCo: boolean; ds: NguoiTrongDs[];
  chon: boolean; onChon: (v: boolean) => void; sua: (p: Partial<Dong>) => void; busy: boolean;
  huy: { sid: number; lyDo: string } | null; moHuy: () => void; doiLyDoHuy: (v: string) => void; dongHuy: () => void; xacNhanHuy: () => void;
};

/** Một em: cùng các ô, 1440 xếp thành hàng lưới, 375 thành thẻ (mockup ④ / 1b / 1c). */
function HangEm(p: HangProps) {
  const { s, d, laQl, laGv, dt, nhanH, homNay, tuanCh } = p;
  const [doiTuan, setDoiTuan] = useState(false);
  const ck = s.cuoiKhoa;
  const du = !!ck && ck.tyLe !== null && ck.scored >= ck.required;
  const pct = du ? `${Math.round(ck!.tyLe! * 100)}%` : null;
  const monDat = du && ck!.required > 1 ? `${ck!.mon.filter((m) => m.ratio !== null && m.ratio >= RATIO_PASS_THRESHOLD).length}/${ck!.required} môn đạt` : null;
  const goiY = ck?.goiY;
  const huongGvcn = s.loTrinhTiep?.huongGvcn ?? null;
  const khoaHuong = !laQl && !!s.lenh;   // QM2: GVCN không đổi Hướng em Quản lý đã xác nhận
  const sua = !(laQl || laGv) || p.busy ? null : p.sua;
  const canLop = CAN_LOP.includes(d.huong as Huong);
  const lechGoiY = laLenh(d.huong) && khacGoiY(d.huong, goiY);
  const canLyDo = laQl && (d.huong === 'bao_luu' || d.huong === 'dung_hoc' || lechGoiY);
  const tuanRieng = !!d.tuan && d.tuan !== tuanCh;
  const coTarget = d.mucTieu === 'KCK' || (d.mucTieu.trim() !== '' && !Number.isNaN(Number(d.mucTieu)));
  const nhan = (t: string) => <span className="mb-0.5 block text-xs text-slate-500">{t}</span>;
  const nhanTb = (t: string) => (dt ? nhan(t) : null);
  /* Thiếu Target đã có chữ "Ghi Target" đỏ ngay dưới ô — không nhắc lần hai dưới hàng. */
  const loiHang = (p.oTarget && p.loi === 'Ghi Target (hoặc KCK)' ? null : p.loi) ?? p.loiMayChu ?? (s.lenh?.loi ? `Chưa chuyển được: ${s.lenh.loi.replace(/\.$/, '')}${laQl ? ' — chọn tuần hoặc lớp mới rồi Xác nhận, hoặc huỷ quyết định.' : ''}` : null);

  const oGoiY = !goiY ? <span className="text-slate-500">—</span>
    : goiY.canQuanLy ? <Nhan tone="soon" title={goiY.nhan}>Quản lý cân nhắc</Nhan>
    : <span className="text-slate-300" title={goiY.nhan}>{goiY.nhanHuong}</span>;
  const dongGvcn = laQl && (
    <span className={`mt-0.5 block text-xs ${huongGvcn && huongGvcn !== d.huong ? 'text-soon' : 'text-slate-400'}`}>
      {huongGvcn ? `GVCN: ${nhanH(huongGvcn)}` : 'GVCN: chưa đề xuất'}
    </span>
  );
  const { dau, khac } = xepHuongTheoGoiY(p.cacHuong, goiY);
  const opt = (h: Huong) => <option key={h} value={h}>{nhanH(h)}</option>;
  const mt0 = s.mt0 ? <OMt0 mt0={s.mt0} />
    : d.huong === 'fast_track' && coMt0(p.maTu, 'fast_track') && p.tuanFinal ? <small className="mt-1 block text-xs tabular-nums text-slate-400">MT0 · {tuanLich(p.tuanFinal, homNay)}</small> : null;

  const oHuong = khoaHuong ? (
    <span className="block">
      <span className="font-semibold text-slate-100">{[nhanH(huongLenhGv(s)), s.lenh!.lopDichMa].filter(Boolean).join(' · ')}</span>
      <span className="block text-xs tabular-nums text-slate-400">{[tuanLich(s.lenh!.tuan, homNay), s.mt0?.maTuan ? `MT0 ${s.mt0.maTuan}` : null].filter(Boolean).join(' · ')}</span>
      {huongGvcn && huongGvcn !== huongLenhGv(s) && <span className="block text-xs text-slate-400">Bạn đề xuất: {nhanH(huongGvcn)}</span>}
    </span>
  ) : !sua ? <span className="text-slate-200">{d.huong ? nhanH(d.huong) : '—'}</span> : (
    <>
      <span className="flex items-center gap-2">
        <select id={`lt-${s.id}`} className="field w-full min-w-0" aria-label={`Hướng của ${s.fullName}`} aria-invalid={!!loiHang}
          value={d.huong} onChange={(e) => sua({ huong: e.target.value as Huong | '', lop: '' })}>
          {!d.huong && <option value="">Chọn hướng</option>}
          {dau.length ? <><optgroup label="Hệ thống gợi ý">{dau.map(opt)}</optgroup><optgroup label="Hướng khác">{khac.map(opt)}</optgroup></> : p.cacHuong.map(opt)}
        </select>
        {laGv && goiY?.canQuanLy && <Nhan tone="soon" title="Final Test 50–59%: hướng bạn chọn là đề xuất, Quản lý quyết">QL quyết</Nhan>}
      </span>
      {mt0}
    </>
  );
  const oTarget = d.huong !== 'fast_track' ? <span className="text-slate-500">—</span>
    : !p.oTarget ? <span className="tabular-nums text-slate-200">{typeof p.targetCo === 'number' ? p.targetCo.toFixed(1) : p.targetCo ?? '—'}</span>
    : !laQl ? <span className="text-slate-500">—</span> : (
      <span className="block">
        <span className="flex items-center gap-1">
          <input className={`field w-16 tabular-nums ${coTarget ? '' : 'border-late'}`} inputMode="decimal" aria-label={`Target của ${s.fullName}`} disabled={!sua || d.mucTieu === 'KCK'}
            value={d.mucTieu === 'KCK' ? '' : d.mucTieu} onChange={(e) => sua?.({ mucTieu: e.target.value })} />
          <NutChon nho chon={d.mucTieu === 'KCK'} disabled={!sua} title="Không cam kết — không tính SOS" onClick={() => sua?.({ mucTieu: d.mucTieu === 'KCK' ? '' : 'KCK' })}>KCK</NutChon>
        </span>
        {!coTarget && <span className="mt-0.5 block text-[12px] text-late">Ghi Target</span>}
      </span>
    );
  const oLop = !canLop ? <span className="text-slate-500">—</span> : !sua ? <span className="text-slate-200">{p.maLop ?? '—'}</span> : (
    <ChonNguoi key={`${s.id}-${p.lopRieng || (p.maLop ?? '')}`} nhom="nhan_vien" choToi={false} choNgoai={false} ds={p.ds}
      value={p.maLop ? { kieu: 'tai_khoan', id: 0, ten: p.maLop } : null}
      placeholder={p.nhomCo ? 'Gõ tên lớp…' : 'Chọn ở hàng nhóm'} ariaLabel={`Lớp chuyển đến của ${s.fullName}`}
      khongKhop={(go) => `Không có lớp khớp “${go}”`}
      onChange={(v) => sua({ lop: v?.kieu === 'tai_khoan' ? v.id : '' })} />
  );
  const oTuan = !laLenh(d.huong) ? <span className="text-slate-500">—</span> : (
    <span className="block">
      <span className="tabular-nums text-slate-200">{tuanLich(d.tuan || tuanCh, homNay)}</span>
      {tuanRieng && <span className="text-xs text-slate-500"> riêng</span>}
      {sua && !doiTuan && !tuanRieng && <button type="button" className={`link ml-2 border-0 bg-transparent p-0 text-xs ${CHAM_375}`} onClick={() => setDoiTuan(true)} aria-label={`Đổi tuần của ${s.fullName}`}>Đổi</button>}
      {sua && (doiTuan || tuanRieng) && (
        <span className="mt-1 block max-w-[9.5rem]">
          <OTuan tuanChon={p.tuanChon} value={d.tuan || tuanCh} onChange={(v) => sua({ tuan: v === tuanCh ? '' : v })} ariaLabel={`Tuần bắt đầu của ${s.fullName}`} />
        </span>
      )}
    </span>
  );
  const oGhiChu = (
    <span className="block space-y-1.5">
      {(laQl || laGv) && !p.busy
        ? <input className="field w-full" aria-label={`Ghi chú của ${s.fullName}`} maxLength={200} value={d.ghiChu} onChange={(e) => p.sua({ ghiChu: e.target.value })} />
        : <span className="text-slate-300">{d.ghiChu || '—'}</span>}
      {canLyDo && (
        <label className="block">
          <span className="mb-0.5 block text-xs text-slate-500">Lý do <span className="text-bad">*</span></span>
          <input className="field w-full" aria-label={`Lý do của ${s.fullName}`} value={d.lyDo} disabled={!sua} onChange={(e) => sua?.({ lyDo: e.target.value })} />
        </label>
      )}
      {laQl && d.huong === 'bao_luu' && (
        <span className="block w-40">
          {nhan('Xem lại')}
          <OTuan tuanChon={p.tuanChon} rong value={d.ngayXemLai} onChange={(v) => sua?.({ ngayXemLai: v })} ariaLabel={`Tuần xem lại của ${s.fullName}`} chuaChon="Chọn tuần" />
        </span>
      )}
    </span>
  );
  const duoi = (
    <>
      {loiHang && <p role="alert" className="m-0 text-[12px] text-late">{loiHang}</p>}
      {laQl && s.lenh && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{CHU_CHUYEN_LOP.sapChuyen(tuanLich(s.lenh.tuan, homNay))}</span>
          {!p.huy && <button type="button" className={`link border-0 bg-transparent p-0 text-xs ${CHAM_375}`} onClick={p.moHuy} aria-label={`${CHU_CHUYEN_LOP.huy} của ${s.fullName}`}>{CHU_CHUYEN_LOP.huy}</button>}
          {p.huy && (
            <span className="flex flex-wrap items-center gap-1.5">
              <input className="field w-56" placeholder="Lý do huỷ" aria-label={`Lý do huỷ quyết định của ${s.fullName}`} value={p.huy.lyDo} onChange={(e) => p.doiLyDoHuy(e.target.value)} />
              <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={p.busy || !p.huy.lyDo.trim()} onClick={p.xacNhanHuy}>{CHU_CHUYEN_LOP.huy}</button>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={p.dongHuy}>{CHU_CHUYEN_LOP.giu}</button>
            </span>
          )}
        </div>
      )}
    </>
  );
  const oChon = laQl && <input type="checkbox" aria-label={`Chọn ${s.fullName}`} checked={p.chon} onChange={(e) => p.onChon(e.target.checked)} />;
  const oTen = (
    <>
      <span className="block truncate font-semibold text-slate-100 sm:font-normal" title={s.fullName}>{s.fullName}</span>
      <span className="block text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
    </>
  );

  if (dt) {
    return (
      <div role="row" className={`surface-2 space-y-2 rounded-lg px-3 py-2.5 text-sm ${loiHang ? 'ring-1 ring-late' : ''}`}>
        <div className="flex items-start gap-2">
          {oChon && <span role="cell" className="flex min-h-[44px] items-center">{oChon}</span>}
          <span role="cell" className="min-w-0 flex-1">{oTen}</span>
          <span role="cell" className="shrink-0 text-right">{pct ? <b className="tabular-nums text-slate-100">{pct}</b> : <span className="text-xs text-slate-500">Chưa đủ điểm</span>}</span>
        </div>
        {!khoaHuong && <div role="cell" className="text-xs text-slate-400">Gợi ý: {oGoiY}{dongGvcn}</div>}
        {khoaHuong ? <span role="cell" className="block">{oHuong}</span> : (
          <div className="grid grid-cols-2 gap-2">
            <span role="cell" className="min-w-0">{nhan('Hướng')}{oHuong}</span>
            <span role="cell" className="min-w-0">{nhan('Target')}{oTarget}</span>
          </div>
        )}
        {laQl && laLenh(d.huong) && (
          <>
            {canLop && <span role="cell" className="block">{nhan('Lớp chuyển đến')}{oLop}</span>}
            <span role="cell" className="block">{nhan('Tuần')}{oTuan}</span>
          </>
        )}
        <span role="cell" className="block">{nhan('Ghi chú')}{oGhiChu}</span>
        {(loiHang || (laQl && s.lenh)) && <div role="cell" className="space-y-1">{duoi}</div>}
      </div>
    );
  }
  return (
    <div role="row" className={`grid min-w-max gap-x-3 gap-y-2 px-3 py-2.5 text-sm lg:min-w-0 ${laQl ? LUOI_QL : LUOI_GV} ${loiHang ? 'bg-bad/10' : p.chon ? 'bg-ink-800/60' : ''}`}>
      {laQl && <span role="cell" className="pt-2">{oChon}</span>}
      <span role="cell" className="min-w-0">{oTen}</span>
      <span role="cell" className="min-w-0">
        {pct ? <><b className="block tabular-nums text-slate-100">{pct}</b><span className="block text-xs text-slate-400">{monDat}</span></> : <span className="text-xs text-slate-500">Chưa đủ điểm</span>}
      </span>
      <span role="cell" className="min-w-0 text-xs">{nhanTb('Gợi ý')}{oGoiY}{dongGvcn}</span>
      <span role="cell" className="min-w-0">{oHuong}</span>
      <span role="cell" className="min-w-0">{oTarget}</span>
      {laQl && <span role="cell" className="min-w-0">{oLop}</span>}
      {laQl && <span role="cell" className="min-w-0">{oTuan}</span>}
      <span role="cell" className="min-w-0">{oGhiChu}</span>
      {(loiHang || (laQl && s.lenh)) && <div role="cell" className="col-start-2 col-end-[-1] space-y-1">{duoi}</div>}
    </div>
  );
}

/** Hướng của em đã có quyết định (GVCN xem): theo lệnh. */
const huongLenhGv = (s: Em) => (SAU_LENH.includes(s.lenh!.huong) ? s.lenh!.huong : s.loTrinhTiep?.huong ?? 'chua_quyet') as Huong;

/** Bước 2 — mockup 08/10 1b: một dòng mỗi nhóm (hướng × lớp), tên em; "Chưa gửi — tên (lý do)". */
function BuocXacNhan({ rows, chuaGui, tenNhom, maLop, tuanCh, homNay, mt0, lyDoChuaGui }: {
  rows: { s: Em; d: Dong }[]; chuaGui: { s: Em; d: Dong; loi: string | null }[]; tenNhom: Record<string, string>;
  maLop: (s: Em, d: Dong) => string | null; tuanCh: string; homNay: string; mt0: boolean; lyDoChuaGui: (r: { loi: string | null }) => string;
}) {
  const thuTu = ['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc'];
  const nhom = new Map<string, { nhan: string; huong: string; ten: string[] }>();
  for (const r of [...rows].sort((a, b) => thuTu.indexOf(a.d.huong) - thuTu.indexOf(b.d.huong))) {
    const lop = CAN_LOP.includes(r.d.huong as Huong) ? maLop(r.s, r.d) : null;
    const k = `${r.d.huong}|${lop ?? ''}`;
    const g = nhom.get(k) ?? { nhan: [tenNhom[r.d.huong], lop].filter(Boolean).join(' · '), huong: r.d.huong, ten: [] };
    g.ten.push(r.d.tuan && r.d.tuan !== tuanCh ? `${r.s.fullName} (${tuanLich(r.d.tuan, homNay)})` : r.s.fullName);
    nhom.set(k, g);
  }
  return (
    <div className="space-y-3 pt-3">
      <ul className="surface-2 m-0 list-none space-y-1.5 rounded-lg p-3">
        {[...nhom.values()].map((g) => (
          <li key={g.nhan} className="text-sm text-slate-200">
            <b className="text-slate-100">{g.nhan}</b> — {g.ten.join(', ')}{g.huong === 'fast_track' && mt0 ? ' · MT0 tự xếp' : ''}
          </li>
        ))}
        {chuaGui.length > 0 && (
          <li className="text-sm"><b className="text-slate-100">Chưa gửi</b> — <span className="text-slate-400">{chuaGui.map((r) => `${r.s.fullName} (${lyDoChuaGui(r)})`).join(' · ')}</span></li>
        )}
      </ul>
      <p className="m-0 text-sm text-slate-400">Chuyển vào thứ Hai {tuanLich(tuanCh, homNay)}, không chờ điểm Final.</p>
    </div>
  );
}
