import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Empty, ErrorState, OKck, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { chayHangLoat, hoanTacHangLoat } from '../students/hangLoatEm.ts';
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';
import { KHOI_VANG, NutHomNay, OTuan, guiTheoLo } from './chuyenLopChung.tsx';
import {
  CHUONG_TRINH_KHONG_CHIA_MON, KY_VONG_DAU_RA, LO_CHUYEN_NGAY_THUONG, NORMAL_LADDER, RATIO_PASS_THRESHOLD, REGULAR_SKILLS, addDaysIso, canLopDich, chuDaiKetQua,
  daysBetween, ghepMucTieu, khacGoiY, kiemDongLenh, laChuyenNgay, maHocLai, mocLoTrinh, nhanKetQuaThuong, shortDate, tachMucTieu, tacDongChot, tenMonNgan,
  thuNgay, tuanLich, type GoiYCuoiKhoa, type HuongLenh, type MucTieuLenh, type ProgrammeCode, type RegularSkill,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Lenh = {
  id: number; huong: HuongLenh; lopDichId: number | null; lopDichMa: string | null; tuan: string; mucTieu: MucTieuLenh | null;
  ngayXemLai: string | null; lyDo: string | null; loi: string | null;
  banGiao: { xacNhan: boolean; monXong: string[]; lamLai: boolean; hanGvbm: string | null; hanGvcn: string | null };
};
type Nhap = { huong: HuongLenh; lopDichId: number | null; tuan: string | null; mucTieu: MucTieuLenh | null; ngayXemLai: string | null; ghiChu: string | null };
type KetLuanKv = { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null };
type Em = {
  id: number; fullName: string; target: number | null; kck: boolean;
  cuoiKhoa: { tyLe: number | null; scored: number; required: number; nguong: number | null; mon: { skill: string; ratio: number | null }[]; goiY: GoiYCuoiKhoa | null } | null;
  progress: { tuan: string | null; scored: number; required: number; monTruot: string[]; tyLe: number | null } | null;
  lenh: Lenh | null; nhap?: Nhap | null; nhanXet: string | null; nhanXetLuc: string | null;
  kqdr: { goiY: { overall: number; dat: boolean; monTruot: RegularSkill[] } | null; mt0: { overall: number } | null; moTay: boolean;
    bands: Record<RegularSkill, number | null> | null; chot: KetLuanKv | null } | null;
};
type Lop = { id: number; code: string; ft: boolean; programmeCode: ProgrammeCode | null; studentCount: number };
type KeHoach = {
  from: { id: number; code: string; programmeCode: ProgrammeCode | null; branchId: number; branchCode: string; programmeName: string | null };
  candidates: Lop[]; tuanChon: string[]; tuanCuoiKhoa: string | null; students: Em[]; gvcn: string | null; goiYLopMoi: { startPeriodId: number } | null;
  coTheRaLenh: boolean; laGvcn: boolean; coTheChotKq: boolean;
};

/** Một lựa chọn ở ô Hướng. `dung` = "Tạm dừng/ Kết thúc học" (N11) — `bao_luu` khi tích "Có thể quay lại học", không thì `dung_hoc`. */
type ChonHuong = '' | 'len_lop' | 'fast_track' | 'hoc_lai' | 'dung';
type KySua = { dat: boolean; nn: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; phuongAn: string };
/** Phần QL đã đổi trên dòng (chưa lưu). Khoá vắng = lấy theo lệnh / nháp / gợi ý máy. */
type Sua = { huong?: ChonHuong; quayLai?: boolean; lop?: number | null; tuan?: string; lyDo?: string; target?: string; kck?: boolean; xemLai?: string; kv?: KySua; mo?: boolean };
type Dong = { huong: ChonHuong; quayLai: boolean; lop: number | null; tuan: string; lyDo: string; target: string; kck: boolean; xemLai: string; kv: KySua | null };

const NGAN: Record<RegularSkill, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const huongLenh = (d: Pick<Dong, 'huong' | 'quayLai'>): HuongLenh | null => (d.huong === 'dung' ? (d.quayLai ? 'bao_luu' : 'dung_hoc') : d.huong || null);
const chonCua = (h: HuongLenh | null | undefined): ChonHuong => (h === 'bao_luu' || h === 'dung_hoc' ? 'dung' : h === 'chuyen_lop' || !h ? '' : h);
const b1 = (n: number) => n.toFixed(1);

/** Lớp chuyển đến hợp lệ cho hướng: FT → lớp FT; Lên → chương trình kế; Học lại → cùng hoặc thấp hơn (`maHocLai`). Ứng viên máy chủ đã lọc cùng chi nhánh (N17). */
function lopTheoHuong(ds: readonly Lop[], huong: ChonHuong, ma: ProgrammeCode | null, ke: ProgrammeCode | null): Lop[] {
  if (huong === 'fast_track') return ds.filter((c) => c.ft);
  if (huong === 'len_lop') return ds.filter((c) => !c.ft && c.programmeCode === ke);
  if (huong === 'hoc_lai') return ds.filter((c) => !c.ft && !!c.programmeCode && maHocLai(ma).includes(c.programmeCode));
  return [];
}

/**
 * TRANG CUỐI KHOÁ · LỚP THƯỜNG (P9b, N17 · N20 · N22; mockup ĐÃ DUYỆT `thiet-ke/v6/cuoi-khoa.html`) — trang con `?xem=cuoi-khoa` của hồ sơ lớp,
 * thay tab "Lộ trình tiếp theo", tab "Đánh giá đầu ra", hộp Kết quả đầu ra và hộp "Lộ trình · em". MỘT lời gọi (`GET /classes/:id/transition`).
 * QL: chọn tất cả / nhóm → thanh "Áp cho n em" (Hướng · Lớp cùng chi nhánh + "+ Mở lớp mới…" · Tuần · Kỳ vọng FT) → sửa ngoại lệ trên dòng →
 * chân dính tóm tắt (`tacDongChot`, cùng luật máy chủ lúc thi hành) → "Chốt · n em" (một bước, theo lô; em lỗi giữ dòng + lý do, "Thử lại n em").
 * GVCN: xem + Nhận xét (không bắt buộc). Người khác: chỉ xem lộ trình đã chốt. 375: mỗi em một thẻ, thanh áp thành tấm dưới.
 */
export function CuoiKhoaLop({ classId, emMo, onDaMoEm, theoVai }: { classId: number; emMo: number | null; onDaMoEm: () => void; theoVai: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const kh = useApi<KeHoach>(`/classes/${classId}/transition`, [classId]);
  const [sua, setSua] = useState<Record<number, Sua>>({});
  const [chon, setChon] = useState<ReadonlySet<number>>(new Set());
  const [loc, setLoc] = useState<'' | 'chua-chot' | 'con-ban-giao' | 'loi'>('');
  const [loi, setLoi] = useState<Record<number, string>>({});
  const [ketQua, setKetQua] = useState<{ ok: number; loi: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number] | null>(null);
  const [hoiNgay, setHoiNgay] = useState<string[] | null>(null);
  const [tam, setTam] = useState(false);
  const [moLop, setMoLop] = useState<{ huong: ChonHuong; ganCho: 'thanh' | number } | null>(null);
  const [huy, setHuy] = useState<{ em: Em; lyDo: string } | null>(null);
  const [banGiao, setBanGiao] = useState<number | null>(null);
  const [nhanXet, setNhanXet] = useState<Record<number, string>>({});
  /* 375 (mockup k9): thẻ gọn "hướng · lớp"; "Sửa" mở ô của em đó tại thẻ. */
  const [moThe, setMoThe] = useState<ReadonlySet<number>>(new Set());
  const [ap, setAp] = useState<{ huong: ChonHuong; quayLai: boolean; lop: number | null; tuan: string; kv: { dat: boolean; nn: 'trung_tam' | 'hoc_sinh' | null } | null }>(
    { huong: '', quayLai: true, lop: null, tuan: '', kv: null });

  /* OV-10b: TVV / CX / Admin chỉ đọc lộ trình ĐÃ CHỐT — nháp của Quản lý không hiện. */
  const d = useMemo(() => (kh.data && theoVai ? { ...kh.data, students: kh.data.students.map((e) => ({ ...e, nhap: null })) } : kh.data), [kh.data, theoVai]);
  /* Lối vào từ hồ sơ HV: em chọn sẵn + cuộn tới dòng. */
  useEffect(() => {
    if (!d || emMo === null) return;
    if (d.coTheRaLenh && d.students.some((s) => s.id === emMo && !s.lenh)) setChon(new Set([emMo]));
    requestAnimationFrame(() => document.getElementById(`ck-em-${emMo}`)?.scrollIntoView({ block: 'center' }));
    onDaMoEm();
  }, [d, emMo]); // eslint-disable-line react-hooks/exhaustive-deps

  const quayLai = () => (location.key !== 'default' ? navigate(-1) : navigate(`/hoc-vien/lop/${classId}`));
  if (kh.error) return <ErrorState message={kh.error.message} hint={kh.error.hint} onRetry={kh.reload} />;
  if (kh.loading || !d) return <div className="page"><Skeleton rows={8} /></div>;

  const h = homNay ?? '';
  const laQl = d.coTheRaLenh;
  const laGvcn = d.laGvcn;
  const ma = d.from.programmeCode;
  const ke = ma ? NORMAL_LADDER[ma] ?? null : null;
  const tenKe = ke === 'FT' ? 'FT' : ke;
  const moc = d.tuanCuoiKhoa ? mocLoTrinh(d.tuanCuoiKhoa) : null;
  const tuanSauFinal = d.tuanCuoiKhoa ? addDaysIso(d.tuanCuoiKhoa, 7) : null;
  const tuanChung = tuanSauFinal && d.tuanChon.includes(tuanSauFinal) ? tuanSauFinal : d.tuanChon[0] ?? '';
  const lopCua = new Map(d.candidates.map((c) => [c.id, c]));
  const kvTen = ma ? KY_VONG_DAU_RA[ma] : undefined;

  /** Gốc của dòng: lệnh đã chốt › nháp › gợi ý máy theo Final (mặc định hiển nhiên, chưa lưu). */
  const goc = (e: Em): Dong => {
    const l = e.lenh ?? e.nhap ?? null;
    const g = e.cuoiKhoa?.goiY;
    const huong: ChonHuong = l ? chonCua(l.huong) : g?.huong === 'hoc_lai' ? 'hoc_lai' : g?.huong === 'len' ? (ke && ke !== 'FT' ? 'len_lop' : 'fast_track') : '';
    const tg = l?.mucTieu != null ? tachMucTieu(l.mucTieu) : null;
    const c = e.kqdr?.chot;
    return {
      huong, quayLai: l ? l.huong !== 'dung_hoc' : true, lop: l?.lopDichId ?? null, tuan: l?.tuan ?? tuanChung,
      lyDo: (e.lenh ? e.lenh.lyDo : e.nhap?.ghiChu) ?? '', target: tg?.target != null ? String(tg.target) : '', kck: !!tg?.kck, xemLai: l?.ngayXemLai ?? '',
      kv: c ? { dat: c.dat, nn: c.nguyenNhan, mon: c.mon, phuongAn: c.ghiChu ?? '' } : null,
    };
  };
  const dongCua = (e: Em): Dong => { const s = sua[e.id] ?? {}; const g = goc(e); return { ...g, ...s, kv: s.kv !== undefined ? s.kv : g.kv }; };
  /** Dòng đã chốt đang khoá (không đang "Sửa"). */
  const khoa = (e: Em) => !!e.lenh && !sua[e.id]?.mo;
  const mucTieuCua = (e: Em, x: Dong): MucTieuLenh | null => (x.huong !== 'fast_track' ? null
    : x.target.trim() || x.kck ? ghepMucTieu(x.target.trim() ? Number(x.target.replace(',', '.')) : null, x.kck) : e.target != null || e.kck ? ghepMucTieu(e.target, e.kck) : null);
  const kiem = (e: Em, x: Dong): string | null => {
    const hl = huongLenh(x);
    if (!hl) return null;
    const dich = x.lop ? lopCua.get(x.lop) : null;
    return kiemDongLenh({
      huong: hl, lopDichId: x.lop, lopDichFt: !!dich?.ft, nguonFt: false, tuan: x.tuan || null, homNay: h, lyDo: x.lyDo || null,
      khacGoiY: khacGoiY(hl, e.cuoiKhoa?.goiY), mucTieu: mucTieuCua(e, x), ngayXemLai: x.xemLai || null,
    });
  };
  /** Lệnh cần gửi: dòng không khoá, có hướng, khác bản đã lưu (lệnh) — dòng từ nháp / gợi ý luôn là chưa chốt. */
  const doiLenh = (e: Em, x: Dong) => {
    if (khoa(e) || !huongLenh(x)) return false;
    const l = e.lenh;
    if (!l) return true;
    return huongLenh(x) !== l.huong || x.lop !== (l.lopDichId ?? null) || x.tuan !== l.tuan || (x.lyDo || null) !== (l.lyDo || null)
      || (x.huong === 'fast_track' && JSON.stringify(mucTieuCua(e, x)) !== JSON.stringify(l.mucTieu)) || (x.xemLai || null) !== (l.ngayXemLai || null);
  };
  const kvMo = (e: Em) => !!e.lenh && e.lenh.huong === 'fast_track' && !!e.kqdr && (!!e.kqdr.mt0 || e.kqdr.moTay) && d.coTheChotKq;
  const doiKv = (e: Em, x: Dong) => kvMo(e) && !!x.kv && JSON.stringify(x.kv) !== JSON.stringify(goc(e).kv);
  const kvLoi = (x: Dong): string | null => (!x.kv || x.kv.dat ? null : !x.kv.nn ? 'Chọn nguyên nhân' : x.kv.nn === 'trung_tam' && !x.kv.mon.length ? 'Chọn kỹ năng'
    : x.kv.nn === 'hoc_sinh' && !x.kv.phuongAn.trim() ? 'Ghi phương án' : null);

  const ds = d.students;
  const dongs = ds.map((e) => { const x = dongCua(e); return { e, x, sai: kiem(e, x) ?? (doiKv(e, x) ? kvLoi(x) : null), lenh: doiLenh(e, x), kv: doiKv(e, x) }; });
  const guiDuoc = dongs.filter((r) => (r.lenh || r.kv) && !r.sai);
  const choLop = dongs.filter((r) => !khoa(r.e) && r.x.huong && r.x.huong !== 'dung' && !r.x.lop).length;
  const chuaHuong = dongs.filter((r) => !r.e.lenh && !r.x.huong).length;
  const daChot = ds.filter((e) => e.lenh).length;
  const conBanGiao = (e: Em) => !!e.lenh && e.lenh.huong !== 'dung_hoc' && !e.lenh.banGiao.xacNhan;
  const khop = (e: Em) => (loc === 'chua-chot' ? !e.lenh : loc === 'con-ban-giao' ? conBanGiao(e) : loc === 'loi' ? !!loi[e.id] : true);
  const hien = dongs.filter((r) => khop(r.e));
  const chonDuoc = (e: Em) => laQl && !khoa(e);
  const doi = (sid: number, p: Sua) => {
    setSua((m) => ({ ...m, [sid]: { ...m[sid], ...p } }));
    setLoi((m) => { if (!(sid in m)) return m; const { [sid]: _, ...con } = m; return con; });
  };
  const lamMoi = () => { invalidate('/classes'); invalidate('/my-work'); invalidate('/hoc-vien-lop'); kh.reload(); };

  /* ------------------------------------------------------------------ nhóm chọn + thanh áp */
  const NHOM: { k: ChonHuong; nhan: string }[] = [
    ...(ke && ke !== 'FT' ? [{ k: 'len_lop' as const, nhan: t('Lên {ke}', { ke: tenKe ?? '' }) }] : []), { k: 'fast_track', nhan: t('Lên FT') },
    { k: 'hoc_lai', nhan: t('Học lại') }, { k: 'dung', nhan: t('Tạm dừng/ Kết thúc học') }, { k: '', nhan: t('Chưa có hướng') },
  ];
  const demNhom = NHOM.map((n) => ({ ...n, so: dongs.filter((r) => r.x.huong === n.k).length })).filter((n) => n.so);
  const chonNhom = (k: ChonHuong) => setChon(new Set(dongs.filter((r) => r.x.huong === k && chonDuoc(r.e)).map((r) => r.e.id)));
  const dsChon = dongs.filter((r) => chon.has(r.e.id));
  const tatCaFt = dsChon.length > 0 && dsChon.every((r) => (ap.huong || r.x.huong) === 'fast_track');
  const apCho = () => {
    for (const r of dsChon) {
      const p: Sua = {};
      if (ap.huong) { p.huong = ap.huong; p.quayLai = ap.quayLai; if (ap.huong !== r.x.huong) p.lop = null; }
      if (ap.lop) p.lop = ap.lop;
      if (ap.tuan) p.tuan = ap.tuan;
      if (ap.kv && tatCaFt && kvMo(r.e)) {
        const mon = ap.kv.dat ? [] : r.e.kqdr?.goiY?.monTruot ?? r.x.kv?.mon ?? [];
        p.kv = { dat: ap.kv.dat, nn: ap.kv.dat ? null : ap.kv.nn, mon, phuongAn: r.x.kv?.phuongAn ?? '' };
      }
      doi(r.e.id, p);
    }
    setTam(false);
  };
  const lopAp = lopTheoHuong(d.candidates, ap.huong || (dsChon[0]?.x.huong ?? ''), ma, ke);

  /* ------------------------------------------------------------------ lưu */
  const ketThuc = (ok: number[], failed: { studentId: number; message: string }[]) => {
    setLoi(Object.fromEntries(failed.map((f) => [f.studentId, f.message])));
    setSua((m) => { const n = { ...m }; for (const id of ok) delete n[id]; return n; });
    setChon(new Set(failed.map((f) => f.studentId)));
    setKetQua({ ok: ok.length, loi: failed.length });
    if (failed.length) setLoc('loi');
    lamMoi();
  };
  const chot = async (chiEm?: number[], daHoi = false) => {
    const nhom = guiDuoc.filter((r) => !chiEm || chiEm.includes(r.e.id));
    if (!nhom.length) return;
    const ngay = nhom.filter((r) => r.lenh && laChuyenNgay(r.x.tuan, h));
    /* N22 ③: chốt "Ngay hôm nay" không hoàn tác → một hộp xác nhận nêu tên em; tuần thường không hỏi. */
    if (ngay.length && !daHoi) { setHoiNgay(ngay.map((r) => r.e.fullName)); return; }
    setHoiNgay(null); setBusy(true);
    try {
      const lenh = nhom.filter((r) => r.lenh).map((r) => ({
        studentId: r.e.id, huong: huongLenh(r.x), toClassId: canLopDich(huongLenh(r.x)!) ? r.x.lop : null, tuan: r.x.tuan || null,
        mucTieu: mucTieuCua(r.e, r.x), ngayXemLai: r.x.huong === 'dung' && r.x.quayLai ? r.x.xemLai || null : null, lyDo: r.x.lyDo.trim() || null,
      }));
      const kq = lenh.length
        ? await guiTheoLo(`/classes/${classId}/transition`, null, ngay.length ? LO_CHUYEN_NGAY_THUONG : lenh.length, setTienDo, lenh)
        : { ok: [] as number[], failed: [] as { studentId: number; message: string }[] };
      const kv = nhom.filter((r) => r.kv && !kq.failed.some((f) => f.studentId === r.e.id));
      const ok = [...kq.ok], failed = [...kq.failed];
      if (kv.length) {
        try {
          await api.put(`/classes/${classId}/ky-vong`, { dong: kv.map((r) => ({ sid: r.e.id, dat: r.x.kv!.dat, nguyenNhan: r.x.kv!.nn, mon: r.x.kv!.mon, lyDo: r.x.kv!.phuongAn.trim() || null })) });
          invalidate('/cases');
          for (const r of kv) if (!ok.includes(r.e.id)) ok.push(r.e.id);
        } catch (e: any) { for (const r of kv) { failed.push({ studentId: r.e.id, message: e.message }); const i = ok.indexOf(r.e.id); if (i >= 0) ok.splice(i, 1); } }
      }
      ketThuc(ok, failed);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); setTienDo(null); }
  };
  const luuNhap = async () => {
    const nhap = dongs.filter((r) => !r.e.lenh && !khoa(r.e) && sua[r.e.id] && huongLenh(r.x));
    const xoa = dongs.filter((r) => !r.e.lenh && r.e.nhap && sua[r.e.id] && !r.x.huong);
    if (!nhap.length && !xoa.length) { toast.push('info', t('Chưa có thay đổi để lưu nháp')); return; }
    setBusy(true);
    try {
      const r: { ok: number[]; failed: { studentId: number; message: string }[] } = nhap.length ? await api.put(`/classes/${classId}/lo-trinh-nhap`, {
        items: nhap.map((x) => ({ studentId: x.e.id, huong: huongLenh(x.x), toClassId: canLopDich(huongLenh(x.x)!) ? x.x.lop : null, tuan: x.x.tuan || null,
          mucTieu: mucTieuCua(x.e, x.x), ngayXemLai: x.x.xemLai || null, ghiChu: x.x.lyDo.trim() || null })),
      }) : { ok: [], failed: [] };
      for (const x of xoa) { await api.del(`/classes/${classId}/lo-trinh-nhap/${x.e.id}`); r.ok.push(x.e.id); }
      toast.push(r.failed.length ? 'error' : 'ok', `${t('Đã lưu nháp')} ${r.ok.length} em${r.failed.length ? ` · ${r.failed.length} em chưa lưu — xem lý do ở dòng` : ''}`);
      ketThuc(r.ok, r.failed);
      setKetQua(null);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const huyQuyetDinh = async () => {
    if (!huy?.lyDo.trim()) return;
    const em = huy.em;
    setBusy(true);
    const kq = await chayHangLoat('huy-lenh', [em.id], { lyDo: huy.lyDo.trim() });
    setBusy(false);
    if (kq.failed.length) { toast.push('error', kq.failed[0].message); return; }
    setHuy(null); doi(em.id, { mo: false }); setSua((m) => { const { [em.id]: _, ...con } = m; return con; }); lamMoi();
    toast.hoanTac(t('Đã huỷ quyết định · {ten}', { ten: em.fullName }), async () => {
      const r = await hoanTacHangLoat('huy-lenh', [em.id]);
      lamMoi();
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? r.failed[0].message : t('Đã khôi phục quyết định'));
    }, { key: `huy-lenh-${em.id}` });
  };
  const luuNhanXet = async () => {
    const doiNx = ds.filter((e) => nhanXet[e.id] !== undefined && (nhanXet[e.id].trim() || null) !== (e.nhanXet ?? null));
    setBusy(true);
    const hong: string[] = [];
    for (const e of doiNx) {
      try { await api.put(`/classes/${classId}/danh-gia-dau-ra/${e.id}`, { nhanXet: nhanXet[e.id], luc: e.nhanXetLuc }); }
      catch (x: any) { hong.push(`${e.fullName}: ${x instanceof ApiError ? x.message : String(x?.message ?? x)}`); }
    }
    setBusy(false);
    if (hong.length) toast.push('error', hong.join(' · '));
    else { toast.push('ok', t('Đã lưu nhận xét · {n} em', { n: doiNx.length })); setNhanXet({}); }
    kh.reload();
  };

  /* ------------------------------------------------------------------ ô */
  const oKetQua = (e: Em) => {
    const c = e.cuoiKhoa;
    const g = c?.goiY ?? null;
    const nguong = c?.nguong ?? RATIO_PASS_THRESHOLD;
    const mon = (c?.mon ?? []).map((m) => (m.ratio === null ? `${tenMonNgan(ma, m.skill)} —` : `${m.ratio < nguong ? '✗ ' : ''}${tenMonNgan(ma, m.skill)} ${Math.round(m.ratio * 100)}`)).join(' · ');
    const p = e.progress;
    const pg = p && p.scored > 0 ? (() => {
      const n = nhanKetQuaThuong({ kind: 'progress', ct: ma, scored: p.scored, required: p.required, failedSkills: p.monTruot, tyLeTong: p.tyLe, khongChiaMon: !!ma && CHUONG_TRINH_KHONG_CHIA_MON.includes(ma) });
      return `Progress ${p.tuan ? shortDate(p.tuan, h) : ''} · ${n.chinh}${n.phu ? ` · ${n.phu}` : ''}`;
    })() : null;
    if (!g || c?.tyLe == null) {
      return (
        <span className="block">
          <span className="text-[13px] text-slate-400">{t('Chờ Final · {a}/{b} môn', { a: c?.scored ?? 0, b: c?.required || 4 })}</span>
          {c && c.scored > 0 ? <span className="mt-0.5 block text-[12px] tabular-nums text-slate-500">{mon}</span>
            : pg && <span className="mt-0.5 block text-[12px] tabular-nums text-slate-500">{pg}</span>}
        </span>
      );
    }
    const dat = g.dai === 'dat';
    return (
      <span className="block">
        <span className={`font-bold tabular-nums ${dat ? 'text-ok' : 'text-late'}`}>{dat ? '✓' : '✗'} {Math.round(c.tyLe * 100)} %</span>{' '}
        <span className="text-[13px] font-semibold text-slate-100">{chuDaiKetQua(g)}</span>
        <span className="mt-0.5 block text-[12px] tabular-nums text-slate-500">{mon}</span>
      </span>
    );
  };
  const oGoiY = (e: Em) => (
    <span className="block text-[13px]">
      {e.cuoiKhoa?.goiY ? <span className="text-slate-200">{dich(e.cuoiKhoa.goiY.nhanHuong)}</span> : <span className="text-slate-500">{t('Chờ Final')}</span>}
      {e.nhanXet && !laGvcn && <span className="mt-0.5 block text-[12px] text-slate-400">GVCN: {e.nhanXet}</span>}
    </span>
  );
  /** Khối Kỳ vọng FT — chỉ dòng Hướng = Lên FT (N17); máy gợi ý từ MT0, chỉ QL bấm (N22 ②). */
  const oKyVong = (e: Em, x: Dong) => {
    if (x.huong !== 'fast_track' || !kvTen) return null;
    const k = e.kqdr;
    const mo = kvMo(e);
    const ten = t('Kỳ vọng {kv}', { kv: kvTen });
    const nut = 'btn btn-sm min-h-[44px] !px-2.5 sm:min-h-0';
    if (!mo) {
      return (
        <span className="mt-2 flex flex-col items-start gap-1 border-t border-dashed pt-1.5 text-[12px]" style={{ borderColor: 'var(--line-strong)' }}>
          <span><b className="text-slate-200">{ten}</b> · MT0 {k?.mt0 ? <b className="tabular-nums">{b1(k.mt0.overall)}</b> : t('chưa có điểm')}</span>
          <span className="flex gap-1"><button type="button" className={nut} disabled>{t('Đạt')}</button><button type="button" className={nut} disabled>{t('Không đạt')}</button></span>
          {!k?.mt0 && <span className="text-slate-500">{t('Chờ MT0')}</span>}
        </span>
      );
    }
    const kv = x.kv;
    const goiDat = k!.goiY?.dat ?? null;
    const dat = (v: boolean) => doi(e.id, { kv: { dat: v, nn: v ? null : kv?.nn ?? 'trung_tam', mon: v ? [] : kv?.mon.length ? kv.mon : k!.goiY?.monTruot ?? [], phuongAn: kv?.phuongAn ?? '' } });
    const loiKv = doiKv(e, x) ? kvLoi(x) : null;
    return (
      <span className="mt-2 flex flex-col items-start gap-1 border-t border-dashed pt-1.5 text-[12px]" style={{ borderColor: 'var(--line-strong)' }}>
        <span><b className="text-slate-200">{ten}</b> · MT0 {k!.mt0 ? <b className="tabular-nums">{b1(k!.mt0.overall)}</b> : t('thiếu band')}</span>
        {k!.bands && <span className="tabular-nums text-slate-500">{REGULAR_SKILLS.map((s) => `${NGAN[s]} ${k!.bands![s] === null ? '—' : b1(k!.bands![s]!)}`).join(' · ')}</span>}
        <span className="flex gap-1" role="group" aria-label={t('Kỳ vọng · {ten}', { ten: e.fullName })}>
          <button type="button" aria-pressed={kv?.dat === true} className={`${nut} ${kv?.dat === true ? 'border-ok text-ok' : ''}`} onClick={() => dat(true)}>{t('Đạt')}</button>
          <button type="button" aria-pressed={kv?.dat === false} className={`${nut} ${kv?.dat === false ? 'border-late text-late' : ''}`} onClick={() => dat(false)}>{t('Không đạt')}</button>
        </span>
        {!kv && goiDat !== null && <span className="text-slate-500">{t('máy gợi ý: {kq}', { kq: goiDat ? t('Đạt') : t('Không đạt') })}</span>}
        {kv && !kv.dat && (
          <>
            <span className="flex flex-wrap items-center gap-1">{t('Nguyên nhân')}
              {(['trung_tam', 'hoc_sinh'] as const).map((n) => (
                <button key={n} type="button" aria-pressed={kv.nn === n} className={`${nut} ${kv.nn === n ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
                  onClick={() => doi(e.id, { kv: { ...kv, nn: n } })}>{n === 'trung_tam' ? t('Trung tâm') : t('Học viên')}</button>
              ))}
            </span>
            {kv.nn === 'trung_tam' && (
              <>
                <span className="flex flex-wrap items-center gap-1">{t('Kỹ năng')}
                  {REGULAR_SKILLS.map((s) => (
                    <button key={s} type="button" aria-pressed={kv.mon.includes(s)} title={tenMonNgan(ma, s)}
                      className={`${nut} ${kv.mon.includes(s) ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
                      onClick={() => doi(e.id, { kv: { ...kv, mon: kv.mon.includes(s) ? kv.mon.filter((m) => m !== s) : REGULAR_SKILLS.filter((m) => m === s || kv.mon.includes(m)) } })}>{NGAN[s]}</button>
                  ))}
                </span>
                <span className="text-slate-400">{t('→ Case + Tutor 10 buổi/kỹ năng')}</span>
              </>
            )}
            {kv.nn === 'hoc_sinh' && (
              <input className={`field h-8 w-full text-[13px] ${loiKv ? 'border-late' : ''}`} placeholder={t('Phương án')} aria-label={t('Phương án · {ten}', { ten: e.fullName })}
                value={kv.phuongAn} maxLength={2000} onChange={(ev) => doi(e.id, { kv: { ...kv, phuongAn: ev.target.value } })} />
            )}
            {loiKv && <span role="alert" className="font-semibold text-late">⚠ {loiKv}</span>}
          </>
        )}
      </span>
    );
  };
  const chuHuong = (e: Em) => {
    const l = e.lenh!;
    return l.huong === 'fast_track' ? t('Lên FT') : l.huong === 'len_lop' ? t('Lên {ke}', { ke: tenKe ?? '' }) : l.huong === 'hoc_lai' ? t('Học lại')
      : l.huong === 'chuyen_lop' ? t('Chuyển lớp') : t('Tạm dừng/ Kết thúc học');
  };
  const oHuong = (e: Em, x: Dong) => {
    if (khoa(e)) {
      return (
        <span className="block">
          <span className="font-semibold text-slate-100">🔒 {chuHuong(e)}</span>
          {laQl && e.lenh!.huong !== 'chuyen_lop' && <button type="button" className="link ml-2 border-0 bg-transparent p-0 text-[12px]" onClick={() => doi(e.id, { mo: true })}>{t('Sửa')}</button>}
          {e.lenh!.huong === 'chuyen_lop' && <span className="block text-[12px] text-slate-500">{t('sửa ở ⋯ Chuyển lớp… của em')}</span>}
        </span>
      );
    }
    const hl = huongLenh(x);
    const canLyDo = !!hl && (khacGoiY(hl, e.cuoiKhoa?.goiY) || hl === 'bao_luu' || hl === 'dung_hoc');
    const coLyDo = canLyDo || !!x.lyDo || sua[e.id]?.lyDo !== undefined;
    const canTarget = x.huong === 'fast_track' && e.target == null && !e.kck;
    return (
      <span className="block space-y-1.5">
        <select className="field h-9 w-full text-[14px]" aria-label={t('Hướng · {ten}', { ten: e.fullName })} value={x.huong}
          onChange={(ev) => doi(e.id, { huong: ev.target.value as ChonHuong, lop: null })}>
          <option value="">{t('Chọn hướng')}</option>
          {NHOM.filter((n) => n.k).map((n) => <option key={n.k} value={n.k}>{n.nhan}</option>)}
        </select>
        {x.huong === 'dung' && (
          <span className="flex flex-wrap items-center gap-2 text-[12px]">
            <label className="inline-flex min-h-[44px] items-center gap-1.5 sm:min-h-0"><input type="checkbox" checked={x.quayLai} onChange={(ev) => doi(e.id, { quayLai: ev.target.checked })} /> {t('Có thể quay lại học')}</label>
            {x.quayLai && <span className="w-32"><OTuan tuanChon={d.tuanChon} value={x.xemLai} onChange={(v) => doi(e.id, { xemLai: v })} ariaLabel={t('Tuần xem lại · {ten}', { ten: e.fullName })} chuaChon={t('Xem lại…')} rong /></span>}
          </span>
        )}
        {canTarget && (
          <span className="flex flex-wrap items-center gap-2">
            <input className="field h-8 w-20 tabular-nums" inputMode="decimal" placeholder="Target" aria-label={t('Target · {ten}', { ten: e.fullName })} value={x.target} onChange={(ev) => doi(e.id, { target: ev.target.value })} />
            <OKck chon={x.kck} onChange={(v) => doi(e.id, { kck: v })} />
          </span>
        )}
        {coLyDo ? (
          <span className="block">
            <input className={`field h-8 w-full text-[13px] ${canLyDo && !x.lyDo.trim() ? 'border-late' : ''}`} placeholder={canLyDo ? t('Lý do') : t('Ghi chú cho GV lớp mới')}
              aria-label={t('Lý do · {ten}', { ten: e.fullName })} value={x.lyDo} maxLength={2000} onChange={(ev) => doi(e.id, { lyDo: ev.target.value })} />
            {canLyDo && !x.lyDo.trim() && <span className="mt-0.5 block text-[12px] font-semibold text-late">⚠ {t('Ghi lý do ngắn')}</span>}
            {canLyDo && x.lyDo.trim() && khacGoiY(hl, e.cuoiKhoa?.goiY) && <span className="mt-0.5 block text-[12px] text-slate-500">{t('khác gợi ý · cần lý do')}</span>}
          </span>
        ) : hl && <button type="button" className="link border-0 bg-transparent p-0 text-[12px]" onClick={() => doi(e.id, { lyDo: '' })}>{t('+ Ghi chú')}</button>}
        {e.lenh && (
          <span className="flex gap-3 text-[12px]">
            <button type="button" className="link border-0 bg-transparent p-0" onClick={() => setSua((m) => { const { [e.id]: _, ...con } = m; return con; })}>{t('Bỏ sửa')}</button>
            <button type="button" className="link border-0 bg-transparent p-0 text-late" onClick={() => setHuy({ em: e, lyDo: '' })}>{t('Huỷ quyết định')}</button>
          </span>
        )}
      </span>
    );
  };
  const oLop = (e: Em, x: Dong) => {
    const hl = huongLenh(x);
    if (!hl || !canLopDich(hl)) return <span className="text-slate-500">—</span>;
    const tuan = <span className="mt-0.5 block text-[12px] tabular-nums text-slate-500">{laChuyenNgay(x.tuan, h) ? t('Ngay hôm nay · {ngay}', { ngay: thuNgay(x.tuan, h) }) : tuanLich(x.tuan, h)}</span>;
    if (khoa(e)) return <span className="block"><span className="text-slate-100">{e.lenh!.lopDichMa ?? lopCua.get(e.lenh!.lopDichId ?? 0)?.code ?? '—'}</span>{tuan}</span>;
    const dsLop = lopTheoHuong(d.candidates, x.huong, ma, ke).map((c) => ({ id: c.id, ma: c.code, phu: `${c.programmeCode ?? 'FT'} · ${d.from.branchCode} · ${c.studentCount} em` }));
    return (
      <span className="block">
        <ChonLop ds={dsLop} value={x.lop} onChange={(id) => doi(e.id, { lop: id })} ariaLabel={t('Lớp · {ten}', { ten: e.fullName })} noi
          maCu={x.lop ? lopCua.get(x.lop)?.code : undefined} moLopMoi={() => setMoLop({ huong: x.huong, ganCho: e.id })} ghiChuDs={t('Chỉ lớp chi nhánh {cn}', { cn: d.from.branchCode })} />
        {tuan}
      </span>
    );
  };
  const oBanGiao = (e: Em) => {
    const l = e.lenh;
    if (!l || l.huong === 'dung_hoc') return <span className="text-slate-500">—</span>;
    const xong = l.banGiao.xacNhan;
    const qua = !xong && !!l.banGiao.hanGvcn && h > l.banGiao.hanGvcn;
    return (
      <button type="button" className="flex min-h-[44px] flex-col items-start gap-0.5 border-0 bg-transparent p-0 text-left sm:min-h-0" onClick={() => setBanGiao(l.id)}
        aria-label={t('Bàn giao · {ten}', { ten: e.fullName })}>
        <Nhan tone={xong ? 'ok' : qua ? 'late' : 'soon'}>{xong ? t('Đã bàn giao') : qua ? t('Quá hạn bàn giao') : t('Chờ bàn giao')}</Nhan>
        {!xong && l.banGiao.hanGvcn && <span className="text-[12px] tabular-nums text-slate-500">{t('hạn {ngay}', { ngay: shortDate(l.banGiao.hanGvcn, h) })}</span>}
      </button>
    );
  };
  const oTen = (e: Em) => (
    <span className="block">
      <Link className="link font-semibold" to={`/hoc-vien/${e.id}`}>{e.fullName}</Link>
      {sua[e.id] && Object.keys(sua[e.id]).some((k) => k !== 'mo') && !loi[e.id] && <span className="ml-1.5"><Nhan tone="doing">{t('đã sửa')}</Nhan></span>}
      {e.lenh && laQl && <span className="mt-0.5 block text-[12px] text-ok">✓ {t('Đã chốt')}</span>}
      {!e.lenh && e.nhap && laQl && <span className="mt-0.5 block text-[12px] text-slate-500">{t('Nháp — chỉ QL thấy')}</span>}
      {e.lenh?.loi && <span className="mt-0.5 block text-[12px] text-late">⚠ {t('Chưa chuyển được: {loi}', { loi: e.lenh.loi })}</span>}
      {loi[e.id] && <span role="alert" className="mt-0.5 block text-[12px] font-semibold text-late">⚠ {loi[e.id]}</span>}
    </span>
  );
  const oChon = (e: Em) => (
    <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer" aria-label={t('Chọn {ten}', { ten: e.fullName })} disabled={!chonDuoc(e)}
      checked={chon.has(e.id)} onChange={() => setChon((s) => { const n = new Set(s); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })} />
  );
  const oChiDoc = (e: Em) => (e.lenh
    ? <span className="block"><span className="font-semibold text-slate-100">🔒 {chuHuong(e)}{e.lenh.lopDichMa ? ` · ${e.lenh.lopDichMa}` : ''}</span><span className="block text-[12px] tabular-nums text-slate-500">{tuanLich(e.lenh.tuan, h)}</span></span>
    : <span className="text-slate-500">{t('QL chưa chốt')}</span>);
  const oNhanXet = (e: Em) => (laGvcn
    ? <input className="field w-full" placeholder={t('Nhận xét')} aria-label={t('Nhận xét · {ten}', { ten: e.fullName })} maxLength={2000}
        value={nhanXet[e.id] ?? e.nhanXet ?? ''} onChange={(ev) => setNhanXet((m) => ({ ...m, [e.id]: ev.target.value }))} />
    : <span className="text-[13px] text-slate-300">{e.nhanXet ?? <span className="text-slate-500">—</span>}</span>);

  /* ------------------------------------------------------------------ đầu, công cụ, chân */
  const quaHan = laQl && moc && daChot < ds.length && h > moc.hanChot ? daysBetween(moc.hanChot, h) : 0;
  const chipHan = laQl && moc && daChot < ds.length && (
    quaHan ? <Nhan tone="late">{t('Quá hạn {n} ngày · hạn {ngay}', { n: quaHan, ngay: thuNgay(moc.hanChot, h) })}</Nhan>
      : h === moc.hanChot ? <Nhan tone="soon">{t('Hạn hôm nay')}</Nhan>
        : h >= moc.nhacTu ? <Nhan tone="muted">{t('hạn {ngay}', { ngay: thuNgay(moc.hanChot, h) })}</Nhan> : null);
  const nxDoi = ds.filter((e) => nhanXet[e.id] !== undefined && (nhanXet[e.id].trim() || null) !== (e.nhanXet ?? null)).length;

  const tomTat = (() => {
    const lenh = guiDuoc.filter((r) => r.lenh);
    const theoLop = new Map<string, number>();
    for (const r of lenh) {
      const hl = huongLenh(r.x)!;
      const k = canLopDich(hl) ? lopCua.get(r.x.lop!)?.code ?? '—' : t('Tạm dừng/ Kết thúc học');
      theoLop.set(k, (theoLop.get(k) ?? 0) + 1);
    }
    const tuan = [...new Set(lenh.map((r) => r.x.tuan))];
    const td = tacDongChot(guiDuoc.map((r) => ({ huong: huongLenh(r.x), goiY: r.e.cuoiKhoa?.goiY ?? null, ct: ma, toFt: !!(r.x.lop && lopCua.get(r.x.lop)?.ft) || r.x.huong === 'fast_track',
      kyVong: r.x.huong === 'fast_track' && r.x.kv ? { dat: r.x.kv.dat, nguyenNhan: r.x.kv.nn, mon: r.x.kv.mon } : null })));
    const baoPh = guiDuoc.filter((r) => r.e.cuoiKhoa?.goiY && (r.e.cuoiKhoa.goiY.baoPhTvv || (huongLenh(r.x) === 'hoc_lai' && r.e.cuoiKhoa.goiY.dai === '50_59'))).map((r) => r.e.fullName);
    const choFinal = guiDuoc.some((r) => !r.e.cuoiKhoa?.goiY);
    const dong1 = [t('{n} em sẵn sàng', { n: guiDuoc.length }), ...[...theoLop].map(([lop, n]) => `${n} → ${lop}`),
      ...(tuan.length === 1 ? [t('bắt đầu {tuan}', { tuan: laChuyenNgay(tuan[0], h) ? t('ngay hôm nay') : tuanLich(tuan[0], h) })] : [])].join(' · ');
    const dong2 = [
      ...(choFinal ? [t('Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final')] : []),
      ...(td.caseBoTro ? [t('Tạo {n} Case bổ trợ Final', { n: td.caseBoTro })] : []),
      ...(td.baoPh ? [`${t('{n} việc Báo PH qua TVV', { n: td.baoPh })}${baoPh.length ? ` (${baoPh.join(', ')})` : ''}`] : []),
      ...(td.caseTutor ? [t('{n} Case Tutor FT', { n: td.caseTutor })] : []),
      ...(choLop ? [t('{n} em chờ chọn lớp', { n: choLop })] : []),
      ...(chuaHuong ? [t('{n} em chưa có hướng', { n: chuaHuong })] : []),
    ].join(' · ');
    return { dong1, dong2 };
  })();
  const soLoi = Object.keys(loi).length;

  const chan = laQl ? (
    soLoi && ketQua ? (
      <>
        <span className="min-w-0 flex-1 text-[13px] text-slate-300"><b className="text-late">{t('{n} em chưa lưu', { n: soLoi })}</b> · {ds.filter((e) => loi[e.id]).map((e) => e.fullName).join(', ')} — {t('hướng, lớp đã chọn vẫn giữ')}</span>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setKetQua(null); setLoc(''); }}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => chot(Object.keys(loi).map(Number))}>{t('Thử lại {n} em', { n: soLoi })}</button>
      </>
    ) : (
      <>
        <span className="min-w-0 flex-1 text-[13px] text-slate-300">
          <span className="block"><b className="text-slate-100">{t('Khi chốt:')}</b> {tomTat.dong1}</span>
          {tomTat.dong2 && <span className="block text-slate-400">{tomTat.dong2}</span>}
        </span>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={luuNhap}>{t('Lưu nháp')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !guiDuoc.length} onClick={() => chot()}>
          {tienDo && busy ? t('Đang chuyển… {a}/{b} em', { a: tienDo[0], b: tienDo[1] }) : t('Chốt · {n} em', { n: guiDuoc.length })}</button>
      </>
    )
  ) : laGvcn ? (
    <>
      <span className="min-w-0 flex-1 text-[13px] text-slate-300"><b className="text-slate-100">{t('{n} nhận xét đã sửa', { n: nxDoi })}</b> · {t('QL thấy dưới cột "Gợi ý"; nhận xét đi kèm việc Báo PH qua TVV')}</span>
      <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !nxDoi} onClick={luuNhanXet}>{t('Lưu nhận xét · {n} em', { n: nxDoi })}</button>
    </>
  ) : null;

  const thanhAp = (tam375: boolean) => (
    <>
      <span className="flex flex-col gap-1 text-[12px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:gap-2">{t('Hướng')}
        <select className="field w-full sm:w-auto" aria-label={t('Hướng cho các em đã chọn')} value={ap.huong} onChange={(e) => setAp({ ...ap, huong: e.target.value as ChonHuong, lop: null })}>
          <option value="">{t('Giữ hướng')}</option>
          {NHOM.filter((n) => n.k).map((n) => <option key={n.k} value={n.k}>{n.nhan}</option>)}
        </select>
      </span>
      {(ap.huong || dsChon[0]?.x.huong) !== 'dung' && (ap.huong || dsChon[0]?.x.huong) && (
        <span className={`flex flex-col gap-1 text-[12px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:gap-2 ${tam375 ? '' : 'sm:w-64'}`}>{t('Lớp')}
          <span className="min-w-0 flex-1"><ChonLop ds={lopAp.map((c) => ({ id: c.id, ma: c.code, phu: `${c.programmeCode ?? 'FT'} · ${d.from.branchCode} · ${c.studentCount} em` }))} value={ap.lop}
            onChange={(id) => setAp({ ...ap, lop: id })} ariaLabel={t('Lớp cho các em đã chọn')} noi
            moLopMoi={() => setMoLop({ huong: ap.huong || dsChon[0]?.x.huong || '', ganCho: 'thanh' })} ghiChuDs={t('Chỉ lớp chi nhánh {cn}', { cn: d.from.branchCode })} /></span>
        </span>
      )}
      <span className="flex flex-col gap-1 text-[12px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:gap-2">{t('Tuần')}
        <span className="flex flex-wrap items-center gap-1.5">
          <NutHomNay nho homNay={homNay} chon={!!homNay && ap.tuan === homNay} onClick={() => setAp({ ...ap, tuan: homNay ?? '' })} />
          <span className="w-32"><OTuan tuanChon={d.tuanChon} value={laChuyenNgay(ap.tuan, h) ? '' : ap.tuan} onChange={(v) => setAp({ ...ap, tuan: v })} ariaLabel={t('Tuần bắt đầu')} chuaChon={tuanLich(tuanChung, h)} /></span>
        </span>
      </span>
      {tatCaFt && d.coTheChotKq && (
        <span className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-slate-400">{t('Kỳ vọng FT')}
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={ap.kv?.dat === v} className={`btn btn-sm min-h-[44px] sm:min-h-0 ${ap.kv?.dat === v ? (v ? 'border-ok text-ok' : 'border-late text-late') : ''}`}
              onClick={() => setAp({ ...ap, kv: { dat: v, nn: v ? null : ap.kv?.nn ?? 'trung_tam' } })}>{v ? t('Đạt') : t('Không đạt')}</button>
          ))}
          {ap.kv && !ap.kv.dat && (['trung_tam', 'hoc_sinh'] as const).map((n) => (
            <button key={n} type="button" aria-pressed={ap.kv?.nn === n} className={`btn btn-sm min-h-[44px] sm:min-h-0 ${ap.kv?.nn === n ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
              onClick={() => setAp({ ...ap, kv: { dat: false, nn: n } })}>{n === 'trung_tam' ? t('Trung tâm') : t('Học viên')}</button>
          ))}
          {ap.kv && !ap.kv.dat && <span className="font-normal text-slate-500">{t('kỹ năng theo MT0 từng em')}</span>}
        </span>
      )}
      {laChuyenNgay(ap.tuan, h) && <span role="note" className="rounded-lg border px-2 py-1 text-[12px] font-semibold text-soon" style={KHOI_VANG}>⚠ {t('Chuyển ngay, không hoàn tác')}</span>}
    </>
  );

  /* Mockup V6 k3 / k7: QL 7 cột, GVCN 5 cột; Kết quả đầu ra là cột linh hoạt. */
  const cot: CotBang[] = laQl
    ? [{ key: 'chon', nhan: '', kieu: 'nut', rong: 44 }, { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 190 }, { key: 'kq', nhan: t('Kết quả đầu ra'), kieu: 'chu' },
      { key: 'goiY', nhan: t('Gợi ý'), kieu: 'chu', rong: 150 }, { key: 'huong', nhan: t('Hướng'), kieu: 'chu', rong: 230 },
      { key: 'lop', nhan: t('Lớp chuyển đến'), kieu: 'chu', rong: 190 }, { key: 'bg', nhan: t('Bàn giao'), kieu: 'chip', rong: 130 }]
    : [{ key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 200 }, { key: 'kq', nhan: t('Kết quả đầu ra'), kieu: 'chu', rong: 260 },
      { key: 'goiY', nhan: t('Gợi ý'), kieu: 'chu', rong: 160 }, { key: 'huong', nhan: t('Hướng · QL chốt'), kieu: 'chu', rong: 230 }, { key: 'nx', nhan: t('Nhận xét'), kieu: 'chu' }];
  const chip = (nhan: ReactNode, bat: boolean, onClick: () => void, key?: string) => (
    <button key={key} type="button" aria-pressed={bat} onClick={onClick}
      className={`btn btn-sm min-h-[44px] rounded-full sm:min-h-0 ${bat ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>{nhan}</button>
  );

  return (
    <div className="page space-y-3">
      <button type="button" className="link border-0 bg-transparent p-0 text-sm" onClick={quayLai}>‹ {d.from.code}</button>
      <section className="card overflow-clip" aria-label={t('Cuối khoá · {lop}', { lop: d.from.code })}>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-3.5" style={{ borderColor: 'var(--line)' }}>
          <h1 className="m-0 text-[17px] font-bold text-slate-100">{t('Cuối khoá · {lop}', { lop: d.from.code })}</h1>
          <span className="text-[13px] tabular-nums text-slate-400">
            {[ma, t('{n} em', { n: ds.length }), d.tuanCuoiKhoa ? `Final ${tuanLich(d.tuanCuoiKhoa, h)}` : null, d.gvcn ? `GVCN ${d.gvcn}` : null].filter(Boolean).join(' · ')}
          </span>
          {chipHan}
          {laQl && <span className="text-[13px] text-slate-400 sm:ml-auto"><b className="tabular-nums text-slate-100">{daChot}/{ds.length}</b> {t('em đã chốt')}</span>}
        </div>
        {ketQua && (
          <div role="status" className="mx-4 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold">
            {ketQua.ok > 0 && <span className="text-ok">✓ {t('Đã chốt {n} em', { n: ketQua.ok })}</span>}
            {ketQua.loi > 0 && <span className="text-late">⚠ {t('{n} em chưa lưu — xem lý do ở dòng', { n: ketQua.loi })}</span>}
          </div>
        )}
        {!ds.length ? <Empty title={t('Lớp chưa có học viên đang học')} /> : (
          <>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              {laQl && (
                <span className="flex flex-wrap items-center gap-1.5">
                  {chip(<>{t('Chọn tất cả')}&nbsp;·&nbsp;<span className="tabular-nums">{ds.filter(chonDuoc).length}</span></>, false, () => setChon(new Set(ds.filter(chonDuoc).map((e) => e.id))))}
                  <span className="text-[12px] text-slate-500">{t('Chọn nhóm:')}</span>
                  {demNhom.map((n) => chip(<>{n.nhan} <span className="tabular-nums">{n.so}</span></>, false, () => chonNhom(n.k), n.k || 'chua'))}
                </span>
              )}
              <span className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                <span className="text-[12px] text-slate-500">{t('Lọc')}</span>
                {soLoi > 0 && chip(<>{t('Lỗi')} <span className="tabular-nums">{soLoi}</span></>, loc === 'loi', () => setLoc(loc === 'loi' ? '' : 'loi'))}
                {chip(<>{t('Chưa chốt')} <span className="tabular-nums">{ds.length - daChot}</span></>, loc === 'chua-chot', () => setLoc(loc === 'chua-chot' ? '' : 'chua-chot'))}
                {ds.some(conBanGiao) && chip(<>{t('Còn bàn giao')} <span className="tabular-nums">{ds.filter(conBanGiao).length}</span></>, loc === 'con-ban-giao', () => setLoc(loc === 'con-ban-giao' ? '' : 'con-ban-giao'))}
              </span>
            </div>
            {laQl && chon.size > 0 && (
              <div role="toolbar" aria-label={t('Áp cho các em đã chọn')} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-y px-4 py-2.5"
                style={{ borderColor: 'var(--accent-line, var(--line))', background: 'var(--accent-soft)' }}>
                <b className="text-sm tabular-nums text-slate-100">{t('{n} em đã chọn', { n: chon.size })}</b>
                {dt ? (
                  <button type="button" className="btn btn-sm btn-primary ml-auto min-h-[44px]" onClick={() => setTam(true)}>{t('Áp cho {n} em…', { n: chon.size })}</button>
                ) : (
                  <>
                    {thanhAp(false)}
                    <button type="button" className="btn btn-sm btn-primary" onClick={apCho}>{t('Áp cho {n} em', { n: chon.size })}</button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setChon(new Set()); setAp({ huong: '', quayLai: true, lop: null, tuan: '', kv: null }); }}>{t('Bỏ chọn')}</button>
                  </>
                )}
              </div>
            )}
            {!hien.length && <Empty title={loc === 'chua-chot' ? t('Mọi em đã chốt') : loc === 'loi' ? t('Không còn em lỗi') : t('Không còn em chờ bàn giao')} />}
            {dt ? (
              <div className="space-y-2 px-3 pb-3">
                {hien.map(({ e, x }) => (
                  <article key={e.id} id={`ck-em-${e.id}`} className={`rounded-xl border p-3 ${loi[e.id] ? 'border-late' : chon.has(e.id) ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : ''}`}
                    style={loi[e.id] || chon.has(e.id) ? undefined : { borderColor: 'var(--line)' }}>
                    <div className="flex items-start gap-2.5">{laQl && oChon(e)}<span className="min-w-0 flex-1">{oTen(e)}</span></div>
                    <div className="mt-2">{oKetQua(e)}</div>
                    {e.nhanXet && !laGvcn && <div className="mt-1 text-[12px] text-slate-400">GVCN: {e.nhanXet}</div>}
                    <div className="mt-2 space-y-2">
                      {laQl && (moThe.has(e.id) || loi[e.id] || sua[e.id]?.mo) ? <>{oHuong(e, x)}{oLop(e, x)}{oKyVong(e, x)}{e.lenh && <div>{oBanGiao(e)}</div>}</>
                        : laQl ? (
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 text-sm font-semibold text-slate-100">{khoa(e) ? '🔒 ' : ''}{x.huong ? [NHOM.find((n) => n.k === x.huong)?.nhan, x.lop ? lopCua.get(x.lop)?.code ?? e.lenh?.lopDichMa : x.huong !== 'dung' ? t('chưa chọn lớp') : null].filter(Boolean).join(' · ') : t('Chưa có hướng')}</span>
                            <button type="button" className="btn btn-sm min-h-[44px]" onClick={() => (khoa(e) ? doi(e.id, { mo: true }) : setMoThe((m) => new Set(m).add(e.id)))}>{t('Sửa')}</button>
                          </div>
                        ) : <>{oChiDoc(e)}{oKyVong(e, x)}{laGvcn && oNhanXet(e)}</>}
                    </div>
                  </article>
                ))}
              </div>
            ) : hien.length > 0 && (
              <Bang ten={t('Cuối khoá · {lop}', { lop: d.from.code })} cot={cot} hang={hien} khoa={(r) => r.e.id} the375={false} khung={false}
                dangMo={(r) => chon.has(r.e.id) || !!loi[r.e.id]} oCua={({ e, x }, c) => <div className="whitespace-normal">{(() => {
                  /* Ô nhiều dòng (ô nhập, lý do, Kỳ vọng) — bỏ `nowrap` của kiểu cột chữ. */
                  switch (c.key) {
                    case 'chon': return oChon(e);
                    case 'ten': return <span id={`ck-em-${e.id}`}>{oTen(e)}</span>;
                    case 'kq': return <>{oKetQua(e)}{oKyVong(e, x)}</>;
                    case 'goiY': return oGoiY(e);
                    case 'huong': return laQl ? oHuong(e, x) : oChiDoc(e);
                    case 'lop': return oLop(e, x);
                    case 'bg': return oBanGiao(e);
                    default: return oNhanXet(e);
                  }
                })()}</div>} />
            )}
          </>
        )}
        {chan && ds.length > 0 && (
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2.5 border-t px-4 py-3 shadow-xl max-sm:[&>span:first-child]:basis-full max-sm:[&>button]:flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>{chan}</div>
        )}
      </section>

      {tam && (
        <Modal open onClose={() => setTam(false)} width="max-w-md" title={t('Áp cho {n} em', { n: chon.size })}
          footer={<button type="button" className="btn btn-primary min-h-[44px] w-full" onClick={apCho}>{t('Áp cho {n} em', { n: chon.size })}</button>}>
          <div className="flex flex-col gap-3">{thanhAp(true)}</div>
        </Modal>
      )}
      {hoiNgay && (
        <Modal open onClose={() => setHoiNgay(null)} width="max-w-md" title={t('Chuyển ngay hôm nay?')}
          footer={<>
            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setHoiNgay(null)}>{t('Quay lại')}</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => chot(undefined, true)}>{t('Chuyển ngay · {n} em', { n: hoiNgay.length })}</button>
          </>}>
          <p className="m-0 rounded-lg border px-3 py-2 text-[13px] font-semibold text-soon" style={KHOI_VANG}>⚠ {t('Chuyển ngay, không hoàn tác')}</p>
          <p className="mb-0 mt-2 text-sm text-slate-200">{hoiNgay.join(', ')}</p>
        </Modal>
      )}
      {huy && (
        <Modal open onClose={() => setHuy(null)} width="max-w-md" title={t('Huỷ quyết định · {ten}', { ten: huy.em.fullName })}
          footer={<>
            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setHuy(null)}>{t('Quay lại')}</button>
            <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !huy.lyDo.trim()} onClick={huyQuyetDinh}>{t('Huỷ quyết định')}</button>
          </>}>
          <label className="block text-sm">
            <span className="text-[12px] font-semibold text-slate-300">{t('Lý do huỷ')}</span>
            <input className="field mt-1 w-full" autoFocus maxLength={2000} value={huy.lyDo} onChange={(e) => setHuy({ ...huy, lyDo: e.target.value })} />
          </label>
        </Modal>
      )}
      {moLop && (
        <ClassCreatePanel moHoSo={false} khoa={t('cho {n} em · {lop}', { n: moLop.ganCho === 'thanh' ? chon.size : 1, lop: d.from.code })}
          macDinh={{ branchId: d.from.branchId, chuongTrinh: moLop.huong === 'fast_track' ? 'FT' : moLop.huong === 'hoc_lai' ? ma ?? undefined : ke ?? undefined,
            loTrinh: moLop.huong === 'fast_track' ? 'LT1' : null, startPeriodId: d.goiYLopMoi?.startPeriodId ?? null, previousClassId: d.from.id }}
          onClose={() => setMoLop(null)}
          onDone={(lop) => {
            /* Lớp mới điền vào thanh / dòng, em đang chọn giữ nguyên (mockup k5). */
            if (moLop.ganCho === 'thanh') setAp((a) => ({ ...a, lop: lop.id })); else doi(moLop.ganCho, { lop: lop.id });
            setMoLop(null); kh.reload();
            toast.push('ok', t('Đã mở {lop}', { lop: lop.code }));
          }} />
      )}
      {banGiao !== null && <BanGiaoPanel classId={classId} mon={null} lenhId={banGiao} onClose={() => setBanGiao(null)} onDone={lamMoi} />}
    </div>
  );
}
