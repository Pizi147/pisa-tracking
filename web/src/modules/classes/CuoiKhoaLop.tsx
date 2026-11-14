import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Empty, ErrorState, OKck, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { IconKhoa } from '../../ui/BieuTuong.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { DongQuyChe } from '../../ui/KhungPanel.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { chayHangLoat, hoanTacHangLoat } from '../students/hangLoatEm.ts';
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';
import { KHOI_VANG, NutHomNay, OTuan, guiTheoLo } from './chuyenLopChung.tsx';
import { ChipXetLaiDong, XetLaiCtx } from './PanelXetLai.tsx';
import { OResetBac } from '../students/ChuyenLopPanel.tsx';
import { useChanRoiNhap } from '../../ui/chanRoiNhap.tsx';
import {
  CHUONG_TRINH_KHONG_CHIA_MON, KY_VONG_DAU_RA, LO_CHUYEN_NGAY_THUONG, NORMAL_LADDER, RATIO_PASS_THRESHOLD, REGULAR_SKILLS, addDaysIso, boMonLich, canLopDich, chuDaiKetQua,
  daysBetween, ghepMucTieu, khacGoiY, kiemDongLenh, laChuyenNgay, maHocLai, mocLoTrinh, mocThuong, nhanKetQuaThuong, shortDate, tachMucTieu, tacDongChot, coBaoPhKhiChot, conTrongCuoiKhoa, tenMonNgan,
  quyCheChotLoTrinh, thuNgay, tuanLich, type GoiYCuoiKhoa, type HuongLenh, type MucTieuLenh, type ProgrammeCode, type RegularSkill,
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
  /** N36: bậc vi phạm hiện tại (0 = chưa bậc; chỉ Quản lý nhận). */ bacYThuc?: number;
  cuoiKhoa: { tyLe: number | null; scored: number; required: number; nguong: number | null; mon: { skill: string; ratio: number | null; dung: number | null; tong: number | null }[]; goiY: GoiYCuoiKhoa | null } | null;
  progress: { tuan: string | null; scored: number; required: number; monTruot: string[]; tyLe: number | null; mon?: { skill: string; ratio: number | null; dung: number | null; tong: number | null }[] } | null;
  lenh: Lenh | null; nhap?: Nhap | null; nhanXet: string | null; nhanXetLuc: string | null;
  kqdr: { goiY: { overall: number | null; dat: boolean; monTruot: RegularSkill[] } | null; mt0: { overall: number | null } | null; moTay: boolean;
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
const b1 = (n: number | null) => (n === null ? '—' : n.toFixed(1));   // KY-VONG-MT0: có kỹ năng Đã huỷ → không Overall

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
  /* Chip lọc trên URL (`?loc=`) — sang hồ sơ em rồi Quay lại / F5 vẫn đúng lọc. "Lỗi" chỉ sống cùng lần lưu (F5 hết lỗi → về Tất cả). */
  const [locUrl, setLoc] = useThamSoUrl('loc', '');
  /* P9a [XM]: em cần Xét lại lộ trình (lệnh chưa thi hành, em còn ở lớp này) — chip lọc + chip trên dòng mở panel tại trang. */
  const xetLai = useContext(XetLaiCtx);
  const [loi, setLoi] = useState<Record<number, string>>({});
  const loc = (['chua-chot', 'con-ban-giao', 'xet-lai'].includes(locUrl) || (locUrl === 'loi' && Object.keys(loi).length) ? locUrl : '') as '' | 'chua-chot' | 'con-ban-giao' | 'loi' | 'xet-lai';
  const [ketQua, setKetQua] = useState<{ ok: number; loi: number } | null>(null);
  const [busy, setBusy] = useState(false);
  /* N36: một ô chung "Reset bậc vi phạm" cho lần chốt — mặc định tắt (giữ bậc, chuỗi đếm thang nối tiếp). */
  const [resetBac, setResetBac] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number] | null>(null);
  const [hoiNgay, setHoiNgay] = useState<{ ten: string[]; chiEm?: number[] } | null>(null);
  const [tam, setTam] = useState(false);
  const [moLop, setMoLop] = useState<{ huong: ChonHuong; ganCho: 'thanh' | number } | null>(null);
  const [huy, setHuy] = useState<{ em: Em; lyDo: string } | null>(null);
  const [banGiao, setBanGiao] = useState<number | null>(null);
  const [nhanXet, setNhanXet] = useState<Record<number, string>>({});
  /* 375 (mockup k9): thẻ gọn "hướng · lớp"; "Sửa" mở ô của em đó tại thẻ. */
  const [moThe, setMoThe] = useState<ReadonlySet<number>>(new Set());
  /* MOCKUP-1111 màn 3: lớp chọn ở dải nhóm (khoá nhóm gợi ý) · em đã bấm "Đổi lớp" riêng. */
  const [lopNhom, setLopNhom] = useState<Partial<Record<'len' | 'lai' | 'cn' | 'cho', number | null>>>({});
  const [doiLopRieng, setDoiLopRieng] = useState<ReadonlySet<number>>(new Set());
  /* GVCN: một nhận xét chung cho các em đã chọn (ghi vào ô Nhận xét từng em, lưu bằng "Lưu nhận xét · n em"). */
  const [nxChung, setNxChung] = useState('');
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

  /* Không mất phần đang sửa: số em có thay đổi chưa lưu (hướng / lớp / Kỳ vọng / nhận xét) — ‹, link, Back, đổi tài khoản hỏi một lần (CHAN-ROI-NHAP-2). */
  const soDoi = new Set([...Object.keys(sua).filter((k) => Object.keys(sua[Number(k)]).some((x) => x !== 'mo')), ...Object.keys(nhanXet)]).size;
  useChanRoiNhap(soDoi > 0, t('Thay đổi lộ trình của {n} em chưa lưu — rời đi sẽ mất.', { n: soDoi }), conTrongCuoiKhoa);
  const quayLai = () => { if (location.key !== 'default') navigate(-1); else navigate(`/hoc-vien/lop/${classId}`); };
  if (kh.error) return <ErrorState message={kh.error.message} hint={kh.error.hint} status={kh.error.status} onRetry={kh.reload} />;
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
  /** Kỳ vọng mở: em đã có lệnh Lên FT (máy chủ chỉ trả `kqdr` khi đó) + Hướng đang chọn vẫn là Lên FT + MT0 đủ band hoặc quá hạn (N22 ②). */
  const kvMo = (e: Em, x: Dong) => x.huong === 'fast_track' && !!e.kqdr && (!!e.kqdr.mt0 || e.kqdr.moTay) && d.coTheChotKq;
  const doiKv = (e: Em, x: Dong) => kvMo(e, x) && !!x.kv && JSON.stringify(x.kv) !== JSON.stringify(goc(e).kv);
  const kvLoi = (x: Dong): string | null => (!x.kv || x.kv.dat ? null : !x.kv.nn ? 'Chọn nguyên nhân' : x.kv.nn === 'trung_tam' && !x.kv.mon.length ? 'Chọn kỹ năng'
    : x.kv.nn === 'hoc_sinh' && !x.kv.phuongAn.trim() ? 'Ghi phương án' : null);

  const ds = d.students;
  const dongs = ds.map((e) => { const x = dongCua(e); return { e, x, sai: kiem(e, x) ?? (doiKv(e, x) ? kvLoi(x) : null), lenh: doiLenh(e, x), kv: doiKv(e, x) }; });
  const guiDuoc = dongs.filter((r) => (r.lenh || r.kv) && !r.sai);
  /* Dòng QL đã sửa mà chưa gửi được: lý do hiện ngay dưới ô Hướng (trừ "chọn lớp" — đếm riêng "chờ chọn lớp"; "Ghi lý do ngắn" đã hiện ở ô Lý do). */
  const canSua = new Map(dongs.filter((r) => (r.lenh || r.kv) && r.sai && r.sai !== 'Chọn lớp chuyển đến' && sua[r.e.id]).map((r) => [r.e.id, r.sai!]));
  const choLop = dongs.filter((r) => !khoa(r.e) && r.x.huong && r.x.huong !== 'dung' && !r.x.lop).length;
  const chuaHuong = dongs.filter((r) => !r.e.lenh && !r.x.huong).length;
  const daChot = ds.filter((e) => e.lenh).length;
  const conBanGiao = (e: Em) => !!e.lenh && e.lenh.huong !== 'dung_hoc' && !e.lenh.banGiao.xacNhan;
  const soXetLai = ds.filter((e) => xetLai?.co.has(e.id)).length;
  const khop = (e: Em) => (loc === 'chua-chot' ? !e.lenh : loc === 'con-ban-giao' ? conBanGiao(e) : loc === 'loi' ? !!loi[e.id] : loc === 'xet-lai' ? !!xetLai?.co.has(e.id) : true);
  const hien = dongs.filter((r) => khop(r.e));
  /* Dòng đã chốt Lên FT vẫn chọn được để áp Kỳ vọng FT (thanh Áp chỉ đổi Kỳ vọng ở dòng khoá). */
  /* Chủ SP 11/11: ô tick ở MỌI vai — QL theo luật cũ (dòng đã chốt chỉ còn Kỳ vọng); GVCN chọn để ghi cùng nhận xét; vai khác chỉ đánh dấu. */
  const chonDuoc = (e: Em) => (laQl ? !khoa(e) || kvMo(e, dongCua(e)) : true);
  const doi = (sid: number, p: Sua) => {
    /* Bỏ Lên FT → bỏ Kỳ vọng đang sửa (không gửi theo lô). */
    setSua((m) => { const n = { ...m[sid], ...p }; if (p.huong !== undefined && p.huong !== 'fast_track') delete n.kv; return { ...m, [sid]: n }; });
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
  const apCho = (a = ap) => {
    const ftA = dsChon.length > 0 && dsChon.every((r) => (a.huong || r.x.huong) === 'fast_track');
    for (const r of dsChon) {
      const p: Sua = {};
      if (a.kv && ftA && kvMo(r.e, r.x)) {
        const mon = a.kv.dat ? [] : r.e.kqdr?.goiY?.monTruot ?? r.x.kv?.mon ?? [];
        p.kv = { dat: a.kv.dat, nn: a.kv.dat ? null : a.kv.nn, mon, phuongAn: r.x.kv?.phuongAn ?? '' };
      }
      if (khoa(r.e)) { doi(r.e.id, p); continue; }   // dòng đã chốt: chỉ Kỳ vọng
      if (a.huong) { p.huong = a.huong; p.quayLai = a.quayLai; if (a.huong !== r.x.huong) p.lop = null; }
      if (a.lop) p.lop = a.lop;
      if (a.tuan) p.tuan = a.tuan;
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
    if (ngay.length && !daHoi) { setHoiNgay({ ten: ngay.map((r) => r.e.fullName), chiEm }); return; }   // giữ lô đang chốt (vd Thử lại n em)
    setHoiNgay(null); setBusy(true);
    try {
      const lenh = nhom.filter((r) => r.lenh).map((r) => ({
        studentId: r.e.id, huong: huongLenh(r.x), toClassId: canLopDich(huongLenh(r.x)!) ? r.x.lop : null, tuan: r.x.tuan || null,
        mucTieu: mucTieuCua(r.e, r.x), ngayXemLai: r.x.huong === 'dung' && r.x.quayLai ? r.x.xemLai || null : null, lyDo: r.x.lyDo.trim() || null,
        /* Không tích → không gửi: máy chủ giữ cờ của lệnh đang chờ (đặt ở Chuyển lớp một em). */
        ...(resetBac && soBac ? { resetBac: true } : {}),
      }));
      const kq = lenh.length
        ? await guiTheoLo(`/classes/${classId}/transition`, null, ngay.length ? LO_CHUYEN_NGAY_THUONG : lenh.length, setTienDo, lenh)
        : { ok: [] as number[], failed: [] as { studentId: number; message: string }[] };
      const kv = nhom.filter((r) => r.kv && !kq.failed.some((f) => f.studentId === r.e.id));
      const ok = [...kq.ok], failed = [...kq.failed];
      /* Kỳ vọng từng em (máy chủ chốt cả lô trong một tx — một em lỗi không được làm hỏng em khác). */
      for (const r of kv) {
        try {
          await api.put(`/classes/${classId}/ky-vong`, { dong: [{ sid: r.e.id, dat: r.x.kv!.dat, nguyenNhan: r.x.kv!.nn, mon: r.x.kv!.mon, lyDo: r.x.kv!.phuongAn.trim() || null }] });
          if (!ok.includes(r.e.id)) ok.push(r.e.id);
        } catch (e: any) { failed.push({ studentId: r.e.id, message: e.message }); const i = ok.indexOf(r.e.id); if (i >= 0) ok.splice(i, 1); }
      }
      if (kv.length) invalidate('/cases');
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
      toast.push(r.failed.length ? 'error' : 'ok', `${t('Đã lưu nháp')} ${t('{n} em', { n: r.ok.length })}${r.failed.length ? ` · ${t('{n} em chưa lưu — xem lý do ở dòng', { n: r.failed.length })}` : ''}`);
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

  /* ------------------------------------------------------------------ nhóm theo gợi ý Final (MOCKUP-1111 màn 3, chủ SP duyệt 11/11)
     Nhóm ≥ 2 em = dải (ô Lớp + Tuần cho cả nhóm); nhóm 1 em = nhãn nhỏ dưới tên. Nhóm theo GỢI Ý (cố định) — dòng không nhảy khi bấm chip. */
  type KhoaNhom = 'len' | 'lai' | 'cn' | 'cho';
  const THU_TU_NHOM: KhoaNhom[] = ['len', 'lai', 'cn', 'cho'];
  const nhomCua = (e: Em): KhoaNhom => { const g = e.cuoiKhoa?.goiY; return !g ? 'cho' : g.huong === 'len' ? 'len' : g.huong === 'hoc_lai' ? 'lai' : 'cn'; };
  const goiYHuong = (e: Em): ChonHuong => { const g = e.cuoiKhoa?.goiY; return g?.huong === 'hoc_lai' ? 'hoc_lai' : g?.huong === 'len' ? (ke && ke !== 'FT' ? 'len_lop' : 'fast_track') : ''; };
  const HUONG_NHOM: Record<KhoaNhom, ChonHuong> = { len: ke && ke !== 'FT' ? 'len_lop' : 'fast_track', lai: 'hoc_lai', cn: '', cho: '' };
  const TEN_NHOM: Record<KhoaNhom, string> = { len: ke && ke !== 'FT' ? t('Lên {ke}', { ke: tenKe ?? '' }) : t('Lên FT'), lai: t('Học lại {ct}', { ct: ma ?? '' }), cn: t('Quản lý cân nhắc'), cho: t('Chờ Final') };
  const soNhom = (k: KhoaNhom) => dongs.filter((r) => nhomCua(r.e) === k).length;
  /* Chủ SP 11/11: dải chỉ khi nhóm có gợi ý bước tiếp thật (Lên … / Học lại …) — không dải "Chờ Final" / "Quản lý cân nhắc". */
  const coDai = (k: KhoaNhom) => soNhom(k) >= 2 && (k === 'len' || k === 'lai');
  const dongNhomHuong = (k: KhoaNhom) => dongs.filter((r) => nhomCua(r.e) === k && !khoa(r.e) && !!HUONG_NHOM[k] && r.x.huong === HUONG_NHOM[k]);
  const lopCuaNhom = (k: KhoaNhom): number | null => {
    if (lopNhom[k] !== undefined) return lopNhom[k] ?? null;
    const ds2 = dongNhomHuong(k); const l = ds2[0]?.x.lop ?? null;
    return l !== null && ds2.every((r) => r.x.lop === l) ? l : null;
  };
  const theoNhom = (e: Em, x: Dong) => { const k = nhomCua(e); return coDai(k) && !!HUONG_NHOM[k] && x.huong === HUONG_NHOM[k] && x.lop !== null && x.lop === lopCuaNhom(k) && !doiLopRieng.has(e.id); };
  /* Lớp / tuần cho cả nhóm: áp cho mọi em trong nhóm đang chọn đúng bước của nhóm (trừ em đã "Đổi lớp" riêng). */
  const chonLopNhom = (k: KhoaNhom, id: number | null) => { setLopNhom((m) => ({ ...m, [k]: id })); for (const r of dongNhomHuong(k)) if (!doiLopRieng.has(r.e.id)) doi(r.e.id, { lop: id }); };
  const tuanNhom = (k: KhoaNhom) => { const ds2 = dongNhomHuong(k); const t0 = ds2[0]?.x.tuan ?? tuanChung; return ds2.every((r) => r.x.tuan === t0) ? t0 : ''; };
  const chonTuanNhom = (k: KhoaNhom, v: string) => { for (const r of dongNhomHuong(k)) doi(r.e.id, { tuan: v }); };
  /* Làm điều hiển nhiên: em bấm chip trùng bước của một dải đã có lớp → ô lớp điền sẵn lớp đó (thấy ngay cạnh chip, sửa được). */
  const chonHuong = (e: Em, x: Dong, k: ChonHuong) => {
    const nhom = THU_TU_NHOM.find((g) => coDai(g) && HUONG_NHOM[g] === k && lopCuaNhom(g) !== null);
    doi(e.id, { huong: k, lop: k && nhom ? lopCuaNhom(nhom) : null });
  };
  /* ------------------------------------------------------------------ ô (MOCKUP-1111 màn 3, chủ SP duyệt 11/11) */
  /** HỘP ĐIỂM: % tổng to + ✓/✗; dưới là ô từng môn rộng cố định (thẳng cột giữa mọi em) — môn + ✓/✗ + số câu đúng / tổng (chủ SP 11/11);
   *  môn chưa có điểm giữ ô "—". Chưa có Final → "Chờ Final" + môn đã chấm / Progress, ô môn ✓/✗ theo Progress. */
  const oKetQua = (e: Em) => {
    const c = e.cuoiKhoa;
    const g = c?.goiY ?? null;
    const nguong = c?.nguong ?? RATIO_PASS_THRESHOLD;
    const coFinal = !!g && c?.tyLe != null;
    const p = e.progress;
    /* Chưa Final (chủ SP 11/11): hộp điểm dùng lượt Progress — % tổng + câu đúng / tổng từng môn; em chưa có lượt nào giữ "—". */
    const theoProgress = !coFinal && !(c && c.scored > 0) && !!p && p.scored > 0;
    const monTrong = boMonLich(ma).map((skill) => ({ skill, ratio: null, dung: null, tong: null }));   // MON-CT-1311: bộ môn chương trình, không cố định 4 môn
    const dsMon = theoProgress ? (p!.mon?.length ? p!.mon : monTrong) : c?.mon.length ? c.mon : monTrong;
    /* Chủ SP 11/11: chỉ ghi lượt đang có — "Final Test: ✓ 82 %" / "Progress Test: ✓ 80 %"; không "Chờ Final", không "n/4 môn", không ngày. */
    const coFinalDiem = coFinal || !!(c && c.scored > 0);
    const nhanLuot = coFinalDiem ? 'Final Test:' : theoProgress ? 'Progress Test:' : null;   // tên lượt tiếng Anh, giữ nguyên ở hai tiếng
    const tyLe = coFinal ? c!.tyLe! : theoProgress ? p!.tyLe : null;
    const datTong = coFinal ? g!.dai === 'dat' : tyLe != null && tyLe >= nguong;
    return (
      <span className="inline-grid gap-1.5 rounded-[10px] border px-2.5 py-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}
        role="group" aria-label={t('Kết quả · {ten}', { ten: e.fullName })}>
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          {nhanLuot ? <span className="text-[13px] font-semibold text-slate-400">{nhanLuot}</span> : <b className="text-[15px] font-bold text-faint">—</b>}
          {tyLe != null && <b className={`text-lg font-bold tabular-nums ${datTong ? 'text-kq-vuot' : 'text-kq-duoi'}`}>{datTong ? '✓' : '✗'} {Math.round(tyLe * 100)} %</b>}
        </span>
        <span className="grid grid-cols-[repeat(4,68px)] gap-1 max-sm:grid-cols-[repeat(4,minmax(0,1fr))]">
          {dsMon.map((m) => {
            const kq = m.ratio != null ? (m.ratio < nguong ? 'duoi' : 'dat') : null;
            const so = m.ratio != null ? (m.dung != null && m.tong != null ? `${m.dung}/${m.tong}` : `${Math.round(m.ratio * 100)}`) : '';
            return (
              <span key={m.skill} className="grid justify-items-center rounded-md border py-0.5" title={tenMonNgan(ma, m.skill)}
                style={{ background: 'var(--surface)', borderColor: kq === 'duoi' ? 'rgb(var(--kq-duoi-rgb) / .45)' : kq === 'dat' ? 'rgb(var(--kq-vuot-rgb) / .35)' : 'var(--line)' }}>
                <span className="text-xs font-medium text-faint">{tenMonNgan(ma, m.skill)}</span>
                <b className={`whitespace-nowrap text-[13px] font-bold tabular-nums ${kq === 'duoi' ? 'text-kq-duoi' : kq === 'dat' ? 'text-kq-vuot' : 'text-faint'}`}>
                  {kq ? `${kq === 'duoi' ? '✗' : '✓'}${so ? ` ${so}` : ''}` : '—'}
                </b>
              </span>
            );
          })}
        </span>
      </span>
    );
  };
  /** Khối Kỳ vọng FT — chỉ dòng Hướng = Lên FT (N17); máy gợi ý từ MT0, chỉ QL bấm (N22 ②). */
  const oKyVong = (e: Em, x: Dong) => {
    if (x.huong !== 'fast_track' || !kvTen) return null;
    const k = e.kqdr;
    const mo = kvMo(e, x);
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
          <button type="button" aria-pressed={kv?.dat === true} className={`${nut} ${kv?.dat === true ? 'border-doing text-kq-bang' : ''}`} onClick={() => dat(true)}>{t('Đạt')}</button>
          {/* KY-VONG-MT0: MT0 đạt mốc → Đạt; "Không đạt" tắt có lý do (máy chủ cũng chặn). */}
          <button type="button" aria-pressed={kv?.dat === false} className={`${nut} ${kv?.dat === false ? 'border-late text-late' : ''}`} onClick={() => dat(false)}
            disabled={goiDat === true} title={goiDat === true ? t('MT0 đã đạt mốc {ct} — Kết quả đầu ra là Đạt.', { ct: ma ?? '' }) : undefined}>{t('Không đạt')}</button>
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
                <span className="text-slate-400">{t('→ Case + Tutor {n} buổi/kỹ năng', { n: mocThuong().khongDatKyVong.tutor })}</span>
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
  /** Bước tiếp: 4 chip một bấm, gợi ý theo Final viền đứt khi chưa chọn; bấm chip đang chọn = bỏ hướng. Đã chốt → khoá + "Sửa" (QL). */
  const oHuong = (e: Em, x: Dong) => {
    if (khoa(e)) {
      return (
        <span className="inline-flex flex-wrap items-center gap-x-2 text-sm font-semibold text-slate-100">
          <IconKhoa />{chuHuong(e)}
          {laQl && e.lenh!.huong !== 'chuyen_lop' && <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] sm:min-h-0" onClick={() => doi(e.id, { mo: true })}>{t('Sửa')}</button>}
          {e.lenh!.huong === 'chuyen_lop' && <span className="text-xs font-normal text-slate-500">{t('sửa ở ⋯ Chuyển lớp… của em')}</span>}
        </span>
      );
    }
    const goi = goiYHuong(e);
    return (
      <span className="flex flex-wrap gap-1 max-sm:grid max-sm:grid-cols-3" role="group" aria-label={t('Hướng · {ten}', { ten: e.fullName })}>
        {NHOM.filter((n) => n.k).map((n) => {
          const dang = x.huong === n.k;
          return (
            <button key={n.k} type="button" aria-pressed={dang} title={n.k === goi && !dang ? t('Gợi ý theo Final') : undefined} onClick={() => chonHuong(e, x, dang ? '' : n.k)}
              className={`min-h-[44px] whitespace-nowrap rounded-lg border px-2.5 text-[13px] font-semibold sm:h-8 sm:min-h-0 ${n.k === 'dung' ? 'max-sm:col-span-3' : ''} ${
                dang ? 'btn-primary' : n.k === goi ? 'border-dashed text-slate-100' : 'text-dim hover:border-[color:var(--accent)]'}`}
              style={dang ? undefined : { borderColor: n.k === goi ? 'var(--text-faint)' : 'var(--line-strong)', background: 'var(--o-nen, transparent)' }}>{n.nhan}</button>
          );
        })}
      </span>
    );
  };
  /** Phần mở dưới hàng — chỉ khi cần: tạm dừng (quay lại · xem lại) · Target (Lên FT chưa có Target) · lý do / ghi chú · Kỳ vọng FT · Bỏ sửa / Huỷ quyết định. */
  const oDuoi = (e: Em, x: Dong) => {
    const kv = oKyVong(e, x);
    if (khoa(e) || !laQl) return kv;
    const hl = huongLenh(x);
    const canLyDo = !!hl && (khacGoiY(hl, e.cuoiKhoa?.goiY) || hl === 'bao_luu' || hl === 'dung_hoc');
    const coLyDo = canLyDo || !!x.lyDo || sua[e.id]?.lyDo !== undefined;
    const canTarget = x.huong === 'fast_track' && e.target == null && !e.kck;
    const phan = [
      x.huong === 'dung' && (
        <span key="dung" className="flex flex-wrap items-center gap-2 text-[13px]">
          <label className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-dim sm:min-h-0"><input type="checkbox" checked={x.quayLai} onChange={(ev) => doi(e.id, { quayLai: ev.target.checked })} /> {t('Có thể quay lại học')}</label>
          {x.quayLai && <span className="w-32"><OTuan tuanChon={d.tuanChon} value={x.xemLai} onChange={(v) => doi(e.id, { xemLai: v })} ariaLabel={t('Tuần xem lại · {ten}', { ten: e.fullName })} chuaChon={t('Xem lại…')} rong /></span>}
        </span>
      ),
      canTarget && (
        <span key="target" className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-dim">Target
          <input className="field h-8 w-20 tabular-nums" inputMode="decimal" placeholder="Target" aria-label={t('Target · {ten}', { ten: e.fullName })} value={x.target} onChange={(ev) => doi(e.id, { target: ev.target.value })} />
          <OKck chon={x.kck} onChange={(v) => doi(e.id, { kck: v })} />
        </span>
      ),
      coLyDo && (
        <label key="ly-do" className="flex min-w-0 flex-[1_1_18rem] items-center gap-2 text-[13px] font-semibold text-dim">
          {canLyDo ? t('Lý do') : t('Ghi chú cho GV lớp mới')}
          <input className={`field h-8 min-w-0 flex-1 text-[13px] font-normal ${canLyDo && !x.lyDo.trim() ? 'border-late' : ''}`}
            aria-label={t('Lý do · {ten}', { ten: e.fullName })} value={x.lyDo} maxLength={2000} onChange={(ev) => doi(e.id, { lyDo: ev.target.value })} />
        </label>
      ),
      e.lenh && (
        <span key="sua" className="flex gap-3 text-[13px]">
          <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 sm:min-h-0" onClick={() => setSua((m) => { const { [e.id]: _, ...con } = m; return con; })}>{t('Bỏ sửa')}</button>
          <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-late sm:min-h-0" onClick={() => setHuy({ em: e, lyDo: '' })}>{t('Huỷ quyết định')}</button>
        </span>
      ),
    ].filter(Boolean);
    if (!phan.length && !kv) return null;
    return <>{phan.length > 0 && <span className="flex flex-wrap items-center gap-x-4 gap-y-2">{phan}</span>}{kv}</>;
  };
  /** Dải chữ nhỏ dưới hàng (chạy hết bề ngang — hàng cao đều): GVCN · bổ trợ · khác gợi ý · nháp · lỗi · + Ghi chú. */
  const oPhu = (e: Em, x: Dong) => {
    const hl = huongLenh(x);
    const canLyDo = !!hl && (khacGoiY(hl, e.cuoiKhoa?.goiY) || hl === 'bao_luu' || hl === 'dung_hoc');
    const coLyDo = canLyDo || !!x.lyDo || sua[e.id]?.lyDo !== undefined;
    const bo = e.cuoiKhoa?.goiY?.boTroNeuLen;
    const loiDong = loi[e.id] ?? (canSua.get(e.id) && canSua.get(e.id) !== 'Ghi lý do ngắn' ? dich(canSua.get(e.id)!) : null);
    const muc = [
      e.nhanXet && !laGvcn && <span key="nx" className="min-w-0 truncate" title={`GVCN: ${e.nhanXet}`}>GVCN: {e.nhanXet}</span>,
      bo && (x.huong === 'len_lop' || (khoa(e) && e.lenh?.huong === 'len_lop')) && <span key="bo" className="whitespace-nowrap">{t('+ bổ trợ {n} buổi · {tuan} tuần', { n: bo.soBuoi, tuan: bo.soTuan })}</span>,
      !khoa(e) && canLyDo && !x.lyDo.trim() && <span key="ly-do" className="whitespace-nowrap font-semibold text-soon">⚠ {t('Ghi lý do ngắn')}</span>,
      !e.lenh && e.nhap && laQl && <span key="nhap" className="whitespace-nowrap">{t('Nháp — chỉ QL thấy')}</span>,
      e.lenh?.loi && <span key="loi-lenh" className="min-w-0 truncate font-semibold text-late">⚠ {t('Chưa chuyển được: {loi}', { loi: e.lenh.loi })}</span>,
      loiDong && <span key="loi" role="alert" className="min-w-0 truncate font-semibold text-late" title={loiDong}>⚠ {loiDong}</span>,
      laQl && !khoa(e) && hl && !coLyDo && <button key="gc" type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-xs sm:min-h-0" onClick={() => doi(e.id, { lyDo: '' })}>{t('+ Ghi chú')}</button>,
    ].filter(Boolean);
    return muc.length ? <span className="flex min-w-0 items-center gap-2 overflow-hidden text-xs font-medium text-slate-400 max-xl:flex-wrap">{muc.flatMap((m, i) => (i ? [<span key={`c${i}`} aria-hidden className="text-faint">·</span>, m] : [m]))}</span> : null;
  };
  /** Lớp mới: em theo lớp của dải nhóm → không lặp ô lớp, rê dòng hiện "Đổi lớp" (375 luôn hiện); em ngoài dải / lệch nhóm → ô gõ tìm + tuần. */
  const oLop = (e: Em, x: Dong) => {
    const hl = huongLenh(x);
    if (!hl) return null;
    if (!canLopDich(hl)) return <span className="text-[13px] text-slate-500">{t('Không chuyển lớp')}</span>;
    const tuan = <span className="mt-0.5 block text-xs tabular-nums text-slate-500">{laChuyenNgay(x.tuan, h) ? t('Ngay hôm nay · {ngay}', { ngay: thuNgay(x.tuan, h) }) : t('từ {tuan}', { tuan: tuanLich(x.tuan, h) })}</span>;
    if (khoa(e)) return <span className="block"><b className="font-bold text-slate-100">{e.lenh!.lopDichMa ?? lopCua.get(e.lenh!.lopDichId ?? 0)?.code ?? '—'}</b>{tuan}</span>;
    if (theoNhom(e, x)) {
      return <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] xl:invisible xl:group-hover/hang:visible xl:group-focus-within/hang:visible sm:min-h-0"
        onClick={() => setDoiLopRieng((s) => new Set(s).add(e.id))}>{t('Đổi lớp')}</button>;
    }
    const dsLop = lopTheoHuong(d.candidates, x.huong, ma, ke).map((c) => ({ id: c.id, ma: c.code, phu: `${c.programmeCode ?? 'FT'} · ${d.from.branchCode} · ${c.studentCount} em` }));
    return (
      <span className="block">
        <ChonLop ds={dsLop} value={x.lop} onChange={(id) => doi(e.id, { lop: id })} ariaLabel={t('Lớp · {ten}', { ten: e.fullName })}
          maCu={x.lop ? lopCua.get(x.lop)?.code : undefined} moLopMoi={() => setMoLop({ huong: x.huong, ganCho: e.id })} ghiChuDs={t('Chỉ lớp chi nhánh {cn}', { cn: d.from.branchCode })} />
        {x.lop !== null && tuan}
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
    /* Bổ trợ / Báo PH chỉ sinh khi có lệnh gửi đi; dòng chỉ đổi Kỳ vọng chỉ tính Case Tutor (goiY null). */
    const td = tacDongChot(guiDuoc.map((r) => ({ huong: huongLenh(r.x), goiY: r.lenh ? r.e.cuoiKhoa?.goiY ?? null : null, ct: ma, toFt: !!(r.x.lop && lopCua.get(r.x.lop)?.ft) || r.x.huong === 'fast_track',
      kyVong: r.kv && r.x.kv ? { dat: r.x.kv.dat, nguyenNhan: r.x.kv.nn, mon: r.x.kv.mon } : null })));
    const baoPh = lenh.filter((r) => coBaoPhKhiChot(huongLenh(r.x)!, r.e.cuoiKhoa?.goiY ?? null)).map((r) => r.e.fullName);
    const choFinal = lenh.some((r) => !r.e.cuoiKhoa?.goiY);
    const dong1 = [t('{n} em sẵn sàng', { n: guiDuoc.length }), ...[...theoLop].map(([lop, n]) => `${n} → ${lop}`),
      ...(tuan.length === 1 ? [t('bắt đầu {tuan}', { tuan: laChuyenNgay(tuan[0], h) ? t('ngay hôm nay') : tuanLich(tuan[0], h) })] : [])].join(' · ');
    const dong2 = [
      ...(choFinal ? [t('Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final')] : []),
      ...(td.caseBoTro ? [t('Tạo {n} Case bổ trợ Final', { n: td.caseBoTro })] : []),
      ...(td.baoPh ? [`${t('{n} việc Báo PH kết quả Test', { n: td.baoPh })}${baoPh.length ? ` (${baoPh.join(', ')})` : ''}`] : []),
      ...(td.caseTutor ? [t('{n} Case Tutor FT', { n: td.caseTutor })] : []),
      ...(choLop ? [t('{n} em chờ chọn lớp', { n: choLop })] : []),
      ...(canSua.size ? [t('{n} em cần sửa', { n: canSua.size })] : []),
      ...(chuaHuong ? [t('{n} em chưa có hướng', { n: chuaHuong })] : []),
    ].join(' · ');
    return { dong1, dong2 };
  })();
  const soLoi = Object.keys(loi).length;
  /* N36: em có bậc > 0 sẽ mở lộ trình mới (Lên lớp / Học lại / Lên FT) ở lần chốt này → hiện ô chung. */
  const soBac = guiDuoc.filter((r) => r.lenh && (r.e.bacYThuc ?? 0) > 0 && ['len_lop', 'hoc_lai', 'fast_track'].includes(huongLenh(r.x) ?? '')).length;

  /* QC-GAN (Q74 / Q75 / Q77): dòng quy chế ở đầu chân của QL — đổi theo lựa chọn đang sửa; không khi đang báo lỗi lưu. */
  const qcChot = laQl && !(soLoi && ketQua) ? quyCheChotLoTrinh({
    trungTam: dongs.some((r) => r.kv && r.x.kv && !r.x.kv.dat && r.x.kv.nn === 'trung_tam'), tutor: mocThuong().khongDatKyVong.tutor,
    khacGoiY: dongs.some((r) => r.lenh && khacGoiY(huongLenh(r.x)!, r.e.cuoiKhoa?.goiY)), hanChot: moc?.hanChot ?? null, homNay: h,
  }) : null;
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
          {soBac > 0 && <OResetBac checked={resetBac} onChange={setResetBac} disabled={busy} phu={t('{n} em đang có bậc', { n: soBac })} />}
        </span>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={luuNhap}>{t('Lưu nháp')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !guiDuoc.length} onClick={() => chot()}>
          {tienDo && busy ? t('Đang chuyển… {a}/{b} em', { a: tienDo[0], b: tienDo[1] }) : t('Chốt · {n} em', { n: guiDuoc.length })}</button>
      </>
    )
  ) : laGvcn ? (
    <>
      <span className="min-w-0 flex-1 text-[13px] text-slate-300"><b className="text-slate-100">{t('{n} nhận xét đã sửa', { n: nxDoi })}</b> · {t('QL thấy dưới Kết quả; nhận xét đi kèm việc Báo PH kết quả Test')}</span>
      <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !nxDoi} onClick={luuNhanXet}>{t('Lưu nhận xét · {n} em', { n: nxDoi })}</button>
    </>
  ) : null;

  /* Thanh áp (có em được chọn): bấm chip / chọn lớp / tuần / Kỳ vọng là ÁP NGAY cho các em đã chọn (MOCKUP-1111 K4 — cùng mẫu Khai cấp bậc). */
  const apNgay = (p: Partial<typeof ap>) => { const a = { ...ap, ...p }; setAp(a); apCho(a); };
  const thanhAp = (
    <>
      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-400">{t('Bước tiếp')}
        <span className="flex flex-wrap gap-1" role="group" aria-label={t('Hướng cho các em đã chọn')}>
          {NHOM.filter((n) => n.k).map((n) => (
            <button key={n.k} type="button" aria-pressed={ap.huong === n.k} onClick={() => apNgay({ huong: n.k, lop: null })}
              className={`min-h-[44px] whitespace-nowrap rounded-lg border px-2.5 text-[13px] font-semibold sm:h-8 sm:min-h-0 ${ap.huong === n.k ? 'btn-primary' : 'text-dim'}`}
              style={ap.huong === n.k ? undefined : { borderColor: 'var(--line-strong)' }}>{n.nhan}</button>
          ))}
        </span>
      </span>
      {(ap.huong || dsChon[0]?.x.huong) !== 'dung' && (ap.huong || dsChon[0]?.x.huong) && (
        <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 sm:w-64">{t('Lớp')}
          <span className="min-w-0 flex-1"><ChonLop ds={lopAp.map((c) => ({ id: c.id, ma: c.code, phu: `${c.programmeCode ?? 'FT'} · ${d.from.branchCode} · ${c.studentCount} em` }))} value={ap.lop}
            onChange={(id) => apNgay({ lop: id })} ariaLabel={t('Lớp cho các em đã chọn')}
            moLopMoi={() => setMoLop({ huong: ap.huong || dsChon[0]?.x.huong || '', ganCho: 'thanh' })} ghiChuDs={t('Chỉ lớp chi nhánh {cn}', { cn: d.from.branchCode })} /></span>
        </span>
      )}
      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-400">{t('Tuần')}
        <NutHomNay nho homNay={homNay} chon={!!homNay && ap.tuan === homNay} onClick={() => apNgay({ tuan: homNay ?? '' })} />
        <span className="w-32"><OTuan tuanChon={d.tuanChon} value={laChuyenNgay(ap.tuan, h) ? '' : ap.tuan} onChange={(v) => apNgay({ tuan: v })} ariaLabel={t('Tuần bắt đầu')} chuaChon={tuanLich(tuanChung, h)} /></span>
      </span>
      {tatCaFt && d.coTheChotKq && (
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-400">{t('Kỳ vọng FT')}
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={ap.kv?.dat === v} className={`btn btn-sm min-h-[44px] sm:min-h-0 ${ap.kv?.dat === v ? (v ? 'border-doing text-kq-bang' : 'border-late text-late') : ''}`}
              onClick={() => apNgay({ kv: { dat: v, nn: v ? null : ap.kv?.nn ?? 'trung_tam' } })}>{v ? t('Đạt') : t('Không đạt')}</button>
          ))}
          {ap.kv && !ap.kv.dat && (['trung_tam', 'hoc_sinh'] as const).map((n) => (
            <button key={n} type="button" aria-pressed={ap.kv?.nn === n} className={`btn btn-sm min-h-[44px] sm:min-h-0 ${ap.kv?.nn === n ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
              onClick={() => apNgay({ kv: { dat: false, nn: n } })}>{n === 'trung_tam' ? t('Trung tâm') : t('Học viên')}</button>
          ))}
        </span>
      )}
      {laChuyenNgay(ap.tuan, h) && <span role="note" className="rounded-lg border px-2 py-1 text-[12px] font-semibold text-soon" style={KHOI_VANG}>⚠ {t('Chuyển ngay, không hoàn tác')}</span>}
    </>
  );

  /* Cột cố định (chủ SP 11/11 "hàng cột cân đối"): QL ô tick · Học viên · Kết quả · Bước tiếp · Lớp mới (+ Bàn giao khi đã có em chốt); GVCN / người xem: Học viên · Kết quả · Bước tiếp · Nhận xét. */
  const coBg = ds.some((e) => e.lenh);
  const LUOI = laQl ? (coBg ? 'xl:grid-cols-[28px_200px_310px_400px_minmax(0,1fr)_150px]' : 'xl:grid-cols-[28px_210px_316px_400px_minmax(0,1fr)]')
    : 'xl:grid-cols-[28px_210px_316px_330px_minmax(0,1fr)]';
  const chip = (nhan: ReactNode, bat: boolean, onClick: () => void, key?: string) => (
    <button key={key} type="button" aria-pressed={bat} onClick={onClick}
      className={`btn btn-sm min-h-[44px] rounded-full sm:min-h-0 ${bat ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>{nhan}</button>
  );
  const dongEm = ({ e, x }: (typeof hien)[number], le: boolean) => {
    const duoi = oDuoi(e, x);
    const phu = oPhu(e, x);
    const mot = !coDai(nhomCua(e));
    return (
      <div key={e.id} id={`ck-em-${e.id}`} className={`group/hang border-b ${le ? 'border-t-2' : ''} ${chon.has(e.id) ? 'bg-[color:var(--accent-soft)]' : ''} ${loi[e.id] ? 'shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]' : chon.has(e.id) ? 'shadow-[inset_3px_0_0_var(--accent)]' : ''}`}
        style={{ borderColor: 'var(--line)', ...(le ? { borderTopColor: 'var(--line-strong)' } : {}) }}>
        <div className={`grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 px-4 py-2.5 ${LUOI}`}>
          <span className="flex">{laQl && khoa(e) && !kvMo(e, x) ? null : oChon(e)}</span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-1.5"><Link className="ten-ho-so" to={`/hoc-vien/${e.id}`}>{e.fullName}</Link><ChipXetLaiDong sid={e.id} />
              {sua[e.id] && Object.keys(sua[e.id]).some((k) => k !== 'mo') && !loi[e.id] && <Nhan tone="doing">{t('đã sửa')}</Nhan>}</span>
            {((mot && nhomCua(e) !== 'cho') || e.cuoiKhoa?.goiY?.baoPhTvv) && (
              <span className="mt-0.5 flex items-center gap-2 whitespace-nowrap text-xs">
                {mot && nhomCua(e) !== 'cho' && <span className="inline-flex h-5 items-center gap-1.5 rounded px-1.5 font-semibold text-dim" style={{ background: 'var(--surface-2)' }}>
                  <span aria-hidden className="h-3 w-[3px] rounded-sm" style={{ background: nhomCua(e) === 'lai' ? 'rgb(var(--bad-rgb))' : nhomCua(e) === 'cn' ? 'rgb(var(--soon-rgb))' : 'var(--text-faint)' }} />{TEN_NHOM[nhomCua(e)]}</span>}
                {e.cuoiKhoa?.goiY?.baoPhTvv && !e.lenh && <span className="text-faint">{t('Báo PH kết quả Test')}</span>}
              </span>
            )}
          </span>
          <span className="min-w-0 max-xl:col-span-2 max-xl:[grid-column:1/-1]">{oKetQua(e)}</span>
          <span className="min-w-0 max-xl:[grid-column:1/-1]">{laQl ? oHuong(e, x) : oChiDoc(e)}</span>
          {laQl ? <span className="min-w-0 max-xl:[grid-column:1/-1]">{oLop(e, x)}</span> : <span className="min-w-0 max-xl:[grid-column:1/-1]">{oNhanXet(e)}</span>}
          {laQl && coBg && <span className="min-w-0 max-xl:[grid-column:1/-1]">{e.lenh ? oBanGiao(e) : null}</span>}
          {phu && <span className="min-w-0 [grid-column:1/-1] xl:[grid-column:2/-1]">{phu}</span>}
        </div>
        {duoi && (
          <div className={`grid gap-x-3.5 px-4 pb-3 ${LUOI}`}>
            <span className={`flex min-w-0 flex-col gap-2 rounded-lg border px-3 py-2.5 [grid-column:1/-1] xl:[grid-column:4/6]`} style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>{duoi}</span>
          </div>
        )}
      </div>
    );
  };
  const daiNhom = (k: KhoaNhom, rows: typeof hien) => {
    const idsChon = rows.filter((r) => chonDuoc(r.e)).map((r) => r.e.id);
    const tatCa = idsChon.length > 0 && idsChon.every((id) => chon.has(id));
    const huong = HUONG_NHOM[k];
    const coO = laQl && !!huong && dongNhomHuong(k).length > 0;
    const dsLop = coO ? lopTheoHuong(d.candidates, huong, ma, ke).map((c) => ({ id: c.id, ma: c.code, phu: `${c.programmeCode ?? 'FT'} · ${d.from.branchCode} · ${c.studentCount} em` })) : [];
    const mauVach = k === 'len' ? 'rgb(var(--ok-rgb))' : k === 'lai' ? 'rgb(var(--bad-rgb))' : k === 'cn' ? 'rgb(var(--soon-rgb))' : 'var(--text-faint)';
    return (
      <div className={`grid min-h-[44px] grid-cols-[28px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 border-b px-4 py-2 pl-[13px] ${LUOI}`}
        style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', borderLeft: `3px solid ${mauVach}` }}>
        <span className="flex">{idsChon.length > 0 && (
          <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer" aria-label={t('Chọn cả nhóm {nhom}', { nhom: TEN_NHOM[k] })} checked={tatCa}
            onChange={() => setChon((s) => { const n = new Set(s); for (const id of idsChon) { if (tatCa) n.delete(id); else n.add(id); } return n; })} />)}</span>
        <span className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold text-slate-100 xl:[grid-column:span_3]">
          {TEN_NHOM[k]}<span className="inline-flex h-[22px] items-center rounded border px-1.5 text-xs font-semibold tabular-nums" style={{ borderColor: 'var(--line-strong)' }}>{t('{n} em', { n: rows.length })}</span>
          {k === 'cho' && <NutLuat label={t('Chờ Final')}>{t('Chốt trước Final được. Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final.')}</NutLuat>}
        </span>
        {coO && (
          <span className="flex flex-wrap items-center gap-2 max-xl:[grid-column:1/-1] xl:[grid-column:5]" title={t('Lớp cho cả nhóm')}>
            <span className="min-w-[150px] flex-1"><ChonLop ds={dsLop} value={lopCuaNhom(k)} onChange={(id) => chonLopNhom(k, id)} ariaLabel={t('Lớp cho cả nhóm {nhom}', { nhom: TEN_NHOM[k] })}
              moLopMoi={() => setMoLop({ huong, ganCho: 'thanh' })} ghiChuDs={t('Chỉ lớp chi nhánh {cn}', { cn: d.from.branchCode })} /></span>
            <span className="w-36"><OTuan tuanChon={d.tuanChon} value={tuanNhom(k)} onChange={(v) => chonTuanNhom(k, v)} ariaLabel={t('Tuần cho cả nhóm {nhom}', { nhom: TEN_NHOM[k] })} chuaChon={tuanLich(tuanChung, h)} /></span>
          </span>
        )}
      </div>
    );
  };
  const nhomHien = THU_TU_NHOM.map((k) => ({ k, rows: hien.filter((r) => nhomCua(r.e) === k) })).filter((n) => n.rows.length);
  const dsDai = nhomHien.filter((n) => coDai(n.k));
  const dsLe = nhomHien.filter((n) => !coDai(n.k)).flatMap((n) => n.rows);
  const tatCaQl = ds.filter(chonDuoc);

  return (
    <div className="page space-y-3">
      <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 sm:min-h-0 text-sm" onClick={quayLai}>‹ {d.from.code}</button>
      <section className="card overflow-clip" aria-label={t('Cuối khoá · {lop}', { lop: d.from.code })}>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 pb-2 pt-3.5">
          <h1 className="m-0 text-xl font-bold text-slate-100">{t('Cuối khoá · {lop}', { lop: d.from.code })}</h1>
          <span className="text-[13px] tabular-nums text-slate-400">
            {[ma, t('{n} em', { n: ds.length }), d.tuanCuoiKhoa ? `Final ${tuanLich(d.tuanCuoiKhoa, h)}` : null, d.gvcn ? `GVCN ${d.gvcn}` : null].filter(Boolean).join(' · ')}
          </span>
          {chipHan}
          {laQl && <span className="text-[13px] text-slate-400 sm:ml-auto"><b className="tabular-nums text-slate-100">{daChot}/{ds.length}</b> {t('em đã chốt')}</span>}
        </div>
        {!ds.length ? <Empty title={t('Lớp chưa có học viên đang học')} /> : (
          <>
            {/* Hàng công cụ (ngoài tiêu đề cột — G9): Chọn tất cả · n | Lọc. */}
            <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3" style={{ borderColor: 'var(--line)' }}>
              {tatCaQl.length > 0 && (
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-slate-100 sm:min-h-0">
                  <input type="checkbox" className="h-[18px] w-[18px]" checked={tatCaQl.every((e) => chon.has(e.id))}
                    onChange={() => setChon(tatCaQl.every((e) => chon.has(e.id)) ? new Set() : new Set(tatCaQl.map((e) => e.id)))} />
                  {t('Chọn tất cả')} · <span className="tabular-nums">{tatCaQl.length}</span>
                </label>
              )}
              <span className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                <span className="text-[12px] text-slate-500">{t('Lọc')}</span>
                {soLoi > 0 && chip(<>{t('Lỗi')} <span className="tabular-nums">{soLoi}</span></>, loc === 'loi', () => setLoc(loc === 'loi' ? '' : 'loi'))}
                {chip(<>{t('Chưa chốt')} <span className="tabular-nums">{ds.length - daChot}</span></>, loc === 'chua-chot', () => setLoc(loc === 'chua-chot' ? '' : 'chua-chot'))}
                {soXetLai > 0 && chip(<>{t('Xét lại')} <span className="tabular-nums">{soXetLai}</span></>, loc === 'xet-lai', () => setLoc(loc === 'xet-lai' ? '' : 'xet-lai'))}
                {ds.some(conBanGiao) && chip(<>{t('Còn bàn giao')} <span className="tabular-nums">{ds.filter(conBanGiao).length}</span></>, loc === 'con-ban-giao', () => setLoc(loc === 'con-ban-giao' ? '' : 'con-ban-giao'))}
              </span>
            </div>
            {ketQua && (
              <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 text-[13px] font-semibold" style={{ borderColor: 'var(--line)' }}>
                {ketQua.ok > 0 && <span className="text-ok">✓ {t('Đã chốt {n} em', { n: ketQua.ok })}</span>}
                {ketQua.loi > 0 && <span className="text-late">⚠ {t('{n} em chưa lưu — xem lý do ở dòng', { n: ketQua.loi })}</span>}
              </div>
            )}
            {chon.size > 0 && (
              /* Hàng thao tác theo quyền: QL áp bước tiếp / lớp / tuần / Kỳ vọng · GVCN ghi cùng một nhận xét · vai khác chỉ đánh dấu (không thao tác). */
              <div role="toolbar" aria-label={t('Áp cho các em đã chọn')} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-2.5"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
                <b className="text-sm tabular-nums text-slate-100">{t('{n} em đã chọn', { n: chon.size })}</b>
                {laQl ? thanhAp : laGvcn && (
                  <span className="flex min-w-0 flex-[1_1_22rem] items-center gap-2">
                    <input className="field min-h-[44px] min-w-0 flex-1 text-[13px] sm:min-h-0" maxLength={2000} value={nxChung} onChange={(ev) => setNxChung(ev.target.value)}
                      placeholder={t('Nhận xét chung')} aria-label={t('Nhận xét chung cho các em đã chọn')} />
                    <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={!nxChung.trim()}
                      onClick={() => setNhanXet((m) => { const n = { ...m }; for (const id of chon) n[id] = nxChung.trim(); return n; })}>{t('Ghi cho {n} em', { n: chon.size })}</button>
                  </span>
                )}
                <button type="button" className="btn btn-sm btn-ghost ml-auto min-h-[44px] sm:min-h-0" onClick={() => { setChon(new Set()); setAp({ huong: '', quayLai: true, lop: null, tuan: '', kv: null }); }}>{t('Bỏ chọn')}</button>
              </div>
            )}
            {!hien.length && <Empty title={loc === 'chua-chot' ? t('Mọi em đã chốt') : loc === 'loi' ? t('Không còn em lỗi') : t('Không còn em chờ bàn giao')} />}
            {hien.length > 0 && (
              <div role="list" aria-label={t('Cuối khoá · {lop}', { lop: d.from.code })}>
                {/* Tiêu đề cột (chữ, không điều khiển — G9); 375 không có. */}
                <div aria-hidden className={`hidden gap-x-3.5 border-b px-4 py-2 text-xs font-semibold text-slate-500 xl:grid ${LUOI}`} style={{ borderColor: 'var(--line)' }}>
                  <span /><span>{t('Học viên')}</span><span>{t('Kết quả')}</span><span>{laQl ? t('Bước tiếp') : t('Hướng · QL chốt')}</span>
                  <span>{laQl ? t('Lớp mới') : t('Nhận xét')}</span>{laQl && coBg && <span>{t('Bàn giao')}</span>}
                </div>
                {dsDai.map((n) => <div key={n.k} role="group" aria-label={TEN_NHOM[n.k]}>{daiNhom(n.k, n.rows)}{n.rows.map((r) => dongEm(r, false))}</div>)}
                {dsLe.map((r, i) => dongEm(r, i === 0 && dsDai.length > 0))}
              </div>
            )}
          </>
        )}
        {chan && ds.length > 0 && (
          <div className="sticky bottom-0 z-20 border-t shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
            {qcChot && <DongQuyChe qc={qcChot} vien={false} />}
            <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 max-sm:[&>span:first-child]:basis-full max-sm:[&>button]:flex-1">{chan}</div>
          </div>
        )}
      </section>

      {hoiNgay && (
        <Modal open onClose={() => setHoiNgay(null)} width="max-w-md" title={t('Chuyển ngay hôm nay?')}
          footer={<>
            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setHoiNgay(null)}>{t('Quay lại')}</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => chot(hoiNgay.chiEm, true)}>{t('Chuyển ngay · {n} em', { n: hoiNgay.ten.length })}</button>
          </>}>
          <p className="m-0 rounded-lg border px-3 py-2 text-[13px] font-semibold text-soon" style={KHOI_VANG}>⚠ {t('Chuyển ngay, không hoàn tác')}</p>
          <p className="mb-0 mt-2 text-sm text-slate-200">{hoiNgay.ten.join(', ')}</p>
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
