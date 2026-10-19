import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { Card, Empty, ErrorState, ExamPlanText, Skeleton, TargetText } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { nhoChiNhanh, type Branch } from '../../ui/Filters.tsx';
import { useSession } from '../../lib/session.tsx';

import { useThaoTacDongHocVien } from '../classes/thaoTacDongHocVien.tsx';
import { KetQuaOHocVien } from './BangHocVienLop.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { BoLocDoan } from '../../ui/ui.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { GocLichThi } from './GocLichThi.tsx';
import { NganXuatDs } from './NganXuatDs.tsx';
import { BangSos, type TrangSos } from './BangSos.tsx';
import { BangCanLam, type ViecCanLam } from './BangCanLam.tsx';
import { ChonTuanSos } from './ChonTuanSos.tsx';
import { PanelMotEm } from './PanelMotEm.tsx';
import { PanelBuocTiep } from './PanelBuocTiep.tsx';
import { SuaThongTinMotEm } from './StudentManagePanel.tsx';
import {
  PHAM_VI_NHAN, tachThieuEmail, chuPhuHuynh, docChipVai, ketQuaGanNhat, ngay, tenMon,
  type ChipVai, type ExamPlan, type GiaiDoanSauThi, type KetQuaVao, type LienHe, type NguCanhDs,
} from '@shared/domain/index.ts';
import { NhanSauThi } from './HopGiaHan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';

/** `GET /hoc-vien-lop/theo-vai` (server/src/classes/hocVienTheoVai.ts). */
type LyDoChuY = { sos?: number; caseMoi?: string[]; yThuc?: string; choBuocTiep?: true };
type DongVai = {
  id: number; ten: string; ma: string; status: string; tamDungTu: string | null; thieu: string[];
  lop: { id: number; code: string; ft: boolean; tuan: number | null; tongTuan: number | null; daRoi: boolean } | null;
  chiNhanh: string | null; tvv: string | null;
  target: number | null; kck: boolean; duKienThi: ExamPlan;
  /** OV-13q: "Đã thi · chờ kết quả · hạn …" / "Đã xong · chờ bước tiếp · hạn …" (cùng hàm với việc Công việc). */
  sauThi: { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean } | null;
  standing: KetQuaVao | null; chuY: LyDoChuY | null; lienHe: LienHe;
  viewer: { suaThongTin: boolean; suaThem: boolean };
};
type PhamViVai = 'cua-toi' | 'chi-nhanh' | 'tat-ca';
type TrangVai = {
  vai: 'tvv' | 'cx';
  phamVi: { coThe: PhamViVai[]; dangDung: PhamViVai; chiNhanh: number | null };
  ids: Record<Exclude<ChipVai, 'tat-ca'>, number[]>;
  rows: DongVai[];
  /** OV-12f: việc góc Cần làm của TVV — Chọn bước tiếp (lộ trình + hạn) · Kết quả thi thật chưa có. */
  viec: { buocTiep: Record<number, { cycleId: number; han: string }>; ketQuaThi: Record<number, { han: string; thi: string | null }> };
  /** OV-13p: "+ Lớp mới" · "+ Học viên" — cùng panel trang Quản lý; máy chủ kiểm lại khi lưu. */
  coTheTaoLop: boolean; coTheThemHocVien: boolean;
};
/** OV-12f: góc nhìn TVV (Tất cả · Đang SOS · Cần làm) / CX (Tất cả · Đang SOS · Cần chú ý — mặc định). */
type GocVai = 'tat-ca' | 'sos' | 'can-lam' | 'can-chu-y' | 'lich-thi';
/** Lọc phụ của góc Tất cả (mockup 3 v2 §10): TVV Cần chú ý · Tạm dừng · Sắp thi; CX Tạm dừng · Sắp thi (+ Thiếu thông tin, Chờ chọn bước tiếp khi có em — không mất chip cũ). */
/* OV-13q: + Đã thi · chờ kết quả (em đã qua ngày thi, chưa có kết quả). */
const LOC_PHU_VAI: Record<'tvv' | 'cx', readonly ChipVai[]> = { tvv: ['can-chu-y', 'tam-dung', 'sap-thi', 'da-thi'], cx: ['tam-dung', 'sap-thi', 'da-thi', 'thieu_tt', 'cho-buoc-tiep'] };
/** `view` / `loc` → góc + lọc phụ; link cũ (`view=thieu_tt`, `cho-buoc-tiep`, `tam-dung`…) giữ nghĩa. */
function docGocVai(view: string | null, loc: string | null, vai: 'tvv' | 'cx'): { goc: GocVai; chip: ChipVai } {
  if (view === 'sos') return { goc: 'sos', chip: 'tat-ca' };
  if (view === 'lich-thi') return { goc: 'lich-thi', chip: 'tat-ca' };   // OV-15f
  if (vai === 'tvv' && (view === 'can-lam' || view === 'thieu_tt' || view === 'cho-buoc-tiep')) return { goc: 'can-lam', chip: 'tat-ca' };
  if (vai === 'cx' && (!view || view === 'can-chu-y')) return { goc: 'can-chu-y', chip: 'can-chu-y' };
  const c = docChipVai(loc ?? (view === 'tat-ca' ? null : view), vai);
  return { goc: 'tat-ca', chip: LOC_PHU_VAI[vai].includes(c) ? c : 'tat-ca' };
}

/** Nhãn chip TVV / CX (OV-10b) — số = `chipHocVien` (OV-10c, cùng ô Tổng quan). */
const CHIP_VAI_NHAN: Record<ChipVai, { nhan: string; goiY: string }> = {
  'tat-ca': { nhan: t('Tất cả'), goiY: t('Mọi học viên trong phạm vi đang xem (chưa lưu trữ).') },
  'can-chu-y': { nhan: t('Cần chú ý'), goiY: t('SOS ở MT gần nhất, Case mới hoặc Ý thức trong 14 ngày, chờ chọn bước tiếp sau thi.') },
  'tam-dung': { nhan: t('Tạm dừng'), goiY: t('Đang Tạm dừng học.') },
  'sap-thi': { nhan: t('Sắp thi'), goiY: t('Dự kiến thi IELTS trong 6 tuần tới.') },
  'da-thi': { nhan: t('Đã thi · chờ kết quả'), goiY: t('Đã qua ngày thi, chưa có kết quả thi thật — hạn 1 tuần sau ngày thi.') },
  thieu_tt: { nhan: t('Thiếu thông tin'), goiY: t('Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi (không tính liên hệ).') },
  'cho-buoc-tiep': { nhan: t('Chờ chọn bước tiếp'), goiY: t('Đã có kết quả thi thật, chờ chọn bước tiếp.') },
};

const SELECT_GON = 'field h-8 w-auto !py-0 text-xs max-sm:min-h-[44px] max-sm:w-full';
/** Quá từng này em đang hiện thì các nhóm lớp mặc định gập (bấm đầu nhóm để mở). */
const NHIEU_DONG = 150;

/** Ô "Cần chú ý" (chỉ đọc): SOS · Case mới (kỹ năng) · Ý thức · Chờ chọn bước tiếp — đúng lý do em vào chip Cần chú ý. */
export function OCanChuY({ c }: { c: LyDoChuY | null }) {
  if (!c) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400">
      {!!c.sos && <ChipSos muc={c.sos} />}
      {!!c.caseMoi?.length && <><Nhan tone="muted">{t('Case mới')}</Nhan><span>{c.caseMoi.map((k) => tenMon(null, k)).join(', ')}</span></>}
      {c.yThuc && <><Nhan tone="muted">{t('Ý thức')}</Nhan><span>{dich(c.yThuc)}</span></>}
      {c.choBuocTiep && <Nhan tone="soon">{t('Chờ chọn bước tiếp')}</Nhan>}
    </span>
  );
}

/** Ô "Phụ huynh": tên (quan hệ) + SĐT; chỉ có SĐT em thì ghi "Em · …"; trống "chưa có" (không đỏ — liên hệ không bắt buộc). */
export function OPhuHuynh({ l }: { l: LienHe }) {
  const ten = chuPhuHuynh(l);
  if (!ten && !l.parentPhone) {
    return l.phone ? <span className="text-xs text-slate-400">{t('Em')} · <span className="tabular-nums text-slate-200">{l.phone}</span></span>
      : <span className="text-xs text-slate-500">{t('chưa có')}</span>;
  }
  return (
    <>
      {ten && <span className="block truncate text-slate-200" title={ten}>{ten}</span>}
      {l.parentPhone && <a href={`tel:${l.parentPhone.replace(/[^\d+]/g, '')}`} className="block text-xs tabular-nums text-slate-400 no-underline hover:text-slate-100">{l.parentPhone}</a>}
    </>
  );
}

function TrangThaiEm({ d, thieu }: { d: DongVai; thieu: boolean }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <>
      {d.status === 'inactive' && <Nhan tone="soon">{d.tamDungTu ? t('Tạm dừng · từ {ngay}', { ngay: ngay(d.tamDungTu, homNay) }) : t('Tạm dừng')}</Nhan>}
      {d.status === 'finished' && <Nhan tone="done">{t('Đã kết thúc học')}</Nhan>}
      {thieu && <span className="text-xs text-slate-400">{t('Thiếu thông tin')}</span>}   {/* CA2-7: một kiểu với "Thiếu n" của QL — chữ mờ, không chip */}
    </>
  );
}

/**
 * HỌC VIÊN & LỚP CỦA TVV / CX (OV-10b, mockup vai 13/10 mục 1 + 5) — mỗi em một dòng theo việc của vai: Học viên (trạng thái bằng chữ) · Target ·
 * Dự kiến thi · Kết quả gần nhất (so kỳ vọng) · Cần chú ý (chỉ đọc) · [CX: TVV] · Phụ huynh · ⋯ (Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi thật ·
 * Mở hồ sơ). Nhóm theo lớp (đầu nhóm: mã lớp · tuần · số em; CX thêm chi nhánh) — cột Lớp bỏ trong nhóm. Chip = `chipHocVien` (cùng số ô Tổng quan).
 * TVV mặc định "HV của tôi" · Tất cả; CX mọi chi nhánh · Cần chú ý. Bộ lọc nằm trên URL (`phamVi`, `cn`, `view`, `q`). < 640 px: thẻ.
 */
export function HocVienTheoVai({ vai }: { vai: 'tvv' | 'cx' }) {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const dienThoai = useDienThoai();
  const q = params.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(q);
  const { goc, chip } = docGocVai(params.get('view'), params.get('loc'), vai);
  const { homNay } = useNgayNghiepVu();
  const phamViUrl = vai === 'tvv' && params.get('phamVi') === 'chi-nhanh' ? 'chi-nhanh' : null;
  const cn = vai === 'cx' ? Number(params.get('cn') ?? params.get('branchId')) || null : null;
  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === '') next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };
  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ.trim() || null }); }, 300);
    return () => clearTimeout(t);
  }, [draftQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const duong = `/hoc-vien-lop/theo-vai${phamViUrl ? '?phamVi=chi-nhanh' : cn ? `?branchId=${cn}` : ''}`;
  const trang = useApi<TrangVai>(duong, [duong]);
  const branches = useApi<Branch[]>(vai === 'cx' ? '/ref/branches' : null);
  const data = trang.data;
  const tuan = params.get('tuan');
  /* TVV "Cả chi nhánh": gửi ĐÚNG chi nhánh trang TVV đã chọn (`phamVi.chiNhanh`) — TVV hai chi nhánh không bị lệch sang chi nhánh khác (rà #391). */
  const cnTvv = phamViUrl ? data?.phamVi.chiNhanh ?? null : null;
  const duongSos = phamViUrl && !cnTvv ? null
    : `/hoc-vien-lop?goc=sos${phamViUrl ? `&phamVi=chi-nhanh&branchId=${cnTvv}` : cn ? `&branchId=${cn}` : ''}${tuan ? `&tuan=${tuan}` : ''}`;
  const sos = useApi<TrangSos>(duongSos, [duongSos]);
  const [panelEm, setPanelEm] = useState<number | null>(null);
  const [buocTiep, setBuocTiep] = useState<{ cycleId: number; em: { id: number; ten: string }; lop: string | null } | null>(null);
  const [suaEm, setSuaEm] = useState<{ id: number; ten: string; lop: string | null; viec: 'info' | 'outcome' } | null>(null);
  const [taoLop, setTaoLop] = useState(false);
  const [them, setThem] = useState(false);
  /* Nhóm đã bấm đảo so với mặc định. Mặc định mở hết; danh sách dài (CX "Tất cả" mọi chi nhánh) thì mặc định gập — không vẽ hàng nghìn dòng một lúc. */
  const [dao, setDao] = useState<Set<number | 'chua-xep'>>(new Set());

  /* Ô tìm lọc tại chỗ: tên · mã em · mã lớp. Chip đếm trên tập đã tìm (như bảng Học viên & Lớp cũ). */
  const ql = q.trim().toLowerCase();
  const khop = useMemo(() => (data?.rows ?? []).filter((d) => !ql || d.ten.toLowerCase().includes(ql) || d.ma.toLowerCase().includes(ql)
    || (d.lop?.code ?? '').toLowerCase().includes(ql)), [data, ql]);
  const tap = useMemo(() => Object.fromEntries(Object.entries(data?.ids ?? {}).map(([k, v]) => [k, new Set(v)])) as Record<string, Set<number>>, [data]);
  const dem = (k: ChipVai) => (k === 'tat-ca' ? khop.length : khop.filter((d) => tap[k]?.has(d.id)).length);
  const hien = useMemo(() => khop.filter((d) => chip === 'tat-ca' || tap[chip]?.has(d.id)).sort((a, b) => a.ten.localeCompare(b.ten, 'vi')), [khop, chip, tap]);
  const nhom = useMemo(() => {
    const m = new Map<number | 'chua-xep', DongVai[]>();
    for (const d of hien) m.set(d.lop?.id ?? 'chua-xep', [...(m.get(d.lop?.id ?? 'chua-xep') ?? []), d]);
    return [...m.entries()].sort(([a, x], [b, y]) => (a === 'chua-xep' ? 1 : b === 'chua-xep' ? -1 : (x[0].lop!.code).localeCompare(y[0].lop!.code, 'vi')));
  }, [hien]);
  const gapSan = hien.length > NHIEU_DONG;
  const dong = { has: (k: number | 'chua-xep') => gapSan !== dao.has(k) };
  const ds: NguCanhDs = { loai: 'hoc-vien', nhan: t('Học viên & Lớp'), ids: nhom.flatMap(([k, em]) => (dong.has(k) ? [] : em.map((d) => d.id))) };

  const tt = useThaoTacDongHocVien({
    laLopThuong: false, quyen: { coTheSuaHocVien: false, coTheBaoCase: false, coTheGhiViPham: false, coTheNhapDiem: false, theoVai: true },
    onDone: trang.reload,
  });
  const menuCua = (d: DongVai) => tt.mucCua({
    id: d.id, ten: d.ten, dangHoc: d.status === 'active', nhapDiem: null, status: d.status, ft: d.lop?.ft ?? true, maLop: d.lop?.code ?? null,
    suaThongTin: d.viewer.suaThongTin, suaThem: d.viewer.suaThem,
  });

  const pv = data?.phamVi;
  const tenCn = vai === 'cx' ? (cn ? branches.data?.find((b) => b.id === cn)?.name ?? t('Một chi nhánh') : t('Tất cả chi nhánh')) : null;
  const tenGoc: Record<GocVai, string> = { 'tat-ca': t('Tất cả'), sos: t('Đang SOS'), 'can-lam': t('Cần làm'), 'can-chu-y': CHIP_VAI_NHAN['can-chu-y'].nhan, 'lich-thi': t('Lịch thi') };   // nhãn chip TVV / CX sẵn có (cùng chữ, bản Anh theo EN-c)
  const dangXem = [tenCn, vai === 'tvv' && pv ? PHAM_VI_NHAN[pv.dangDung] : null, tenGoc[goc], goc === 'tat-ca' && chip !== 'tat-ca' ? CHIP_VAI_NHAN[chip].nhan : null,
    q.trim() ? `“${q.trim()}”` : null].filter(Boolean).join(' · ');
  const coLoc = (goc === 'tat-ca' && chip !== 'tat-ca') || !!q.trim();
  const xoaLoc = () => { setDraftQ(''); setParam({ loc: null, q: null }); };
  const chips = LOC_PHU_VAI[vai].filter((k) => (k !== 'cho-buoc-tiep' && k !== 'thieu_tt') || chip === k || dem(k) > 0);
  const doiGoc = (g: GocVai) => setParam({ view: g === (vai === 'cx' ? 'can-chu-y' : 'tat-ca') ? null : g, loc: null, thang: null });

  /* OV-12f: Đang SOS (tìm lọc tại chỗ như bảng) · Cần làm của TVV (Chọn bước tiếp · Kết quả thi · Thiếu thông tin) — panel / hộp sẵn có. */
  const khopEm = (ten: string, ma: string, lop: string | null) => !ql || ten.toLowerCase().includes(ql) || ma.toLowerCase().includes(ql) || (lop ?? '').toLowerCase().includes(ql);
  const sosRows = (sos.data?.rows ?? []).filter((r) => khopEm(r.ten, r.ma, r.classCode));
  const viecTvv: ViecCanLam[] = vai !== 'tvv' || !data ? [] : khop.flatMap((d): ViecCanLam[] => {
    const chung = { studentId: d.id, ten: d.ten, ma: d.ma, classId: d.lop?.id ?? null, classCode: d.lop?.code ?? null, nguoi: null, lienHe: d.lienHe, loaiHan: null };
    const bt = data.viec.buocTiep[d.id];
    const kq = data.viec.ketQuaThi[d.id];
    return [
      ...(bt ? [{ ...chung, key: `buoc:${d.id}`, viec: t('Chọn bước tiếp'), phu: null, han: bt.han, quaHan: bt.han < homNay, kieu: bt.han < homNay ? 'qua-han' as const : null,
        mo: () => setBuocTiep({ cycleId: bt.cycleId, em: { id: d.id, ten: d.ten }, lop: d.lop?.code ?? null }) }] : []),
      ...(kq && d.viewer.suaThem ? [{ ...chung, key: `thi:${d.id}`, viec: t('Kết quả thi'), phu: kq.thi ? t('Thi {ngay} · chưa có kết quả', { ngay: ngay(kq.thi, homNay) }) : t('chưa có kết quả'), han: kq.han,
        quaHan: kq.han < homNay, kieu: kq.han < homNay ? 'qua-han' as const : null, mo: () => setSuaEm({ id: d.id, ten: d.ten, lop: d.lop?.code ?? null, viec: 'outcome' }) }] : []),
      ...(tap.thieu_tt?.has(d.id) && d.viewer.suaThongTin ? tachThieuEmail(d.thieu).map((x) => ({ ...chung, key: `${x.khoa}:${d.id}`, viec: x.viec, phu: x.phu, han: null, quaHan: false,
        kieu: 'thieu-tt' as const, mo: () => setSuaEm({ id: d.id, ten: d.ten, lop: d.lop?.code ?? null, viec: 'info' }) })) : []),
    ];
  });
  const demGoc: Record<GocVai, number | undefined> = {
    'tat-ca': data ? khop.length : undefined, sos: sos.data ? new Set(sosRows.map((r) => r.studentId)).size : undefined,
    'can-lam': data ? new Set(viecTvv.map((v) => v.studentId)).size : undefined, 'can-chu-y': data ? dem('can-chu-y') : undefined, 'lich-thi': undefined,
  };
  /* OV-15f — phân trang (một hook, cỡ trang nhớ chung): góc nhóm theo LỚP, Đang SOS / Cần làm theo dòng. Xuất Excel lấy đủ mọi trang của góc đang xem. */
  const tongGoc = goc === 'tat-ca' || goc === 'can-chu-y' ? nhom.length : goc === 'sos' ? sosRows.length : goc === 'can-lam' ? viecTvv.length : 0;
  const pt = usePhanTrang(tongGoc, [goc, chip, q, phamViUrl, cn, tuan].join('|'), goc === 'tat-ca' || goc === 'can-chu-y' ? t('lớp') : goc === 'sos' ? t('lượt') : t('việc'));
  const idsXuat = goc === 'sos' ? [...new Set(sosRows.map((r) => r.studentId))]
    : goc === 'can-lam' ? [...new Set(viecTvv.flatMap((v) => (v.studentId !== null ? [v.studentId] : [])))]
    : goc === 'lich-thi' ? [] : hien.map((d) => d.id);
  const [xuat, setXuat] = useState(false);
  const cot = ['Học viên', 'Target · Dự kiến thi', 'Kết quả gần nhất', 'Cần chú ý', ...(vai === 'cx' ? ['TVV'] : []), 'Phụ huynh', ''];

  const dauNhom = (em: DongVai[]): ReactNode => {
    const l = em[0].lop;
    if (!l) return <span className="font-extrabold text-slate-100">{t('Chưa xếp lớp')} <span className="font-normal text-slate-400">· {t('{n} em', { n: em.length })}</span></span>;
    const tuan = l.tuan && l.tuan >= 1 ? t('tuần {n}', { n: l.tongTuan ? `${Math.min(l.tuan, l.tongTuan)}/${l.tongTuan}` : l.tuan }) : null;
    const phu = [vai === 'cx' ? em[0].chiNhanh : null, tuan, pv?.dangDung === 'cua-toi' ? t('{n} em của tôi', { n: em.length }) : t('{n} em', { n: em.length })].filter(Boolean).join(' · ');
    return (
      <span className="flex min-w-0 items-baseline gap-2">
        <Link to={`/hoc-vien/lop/${l.id}`} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">{l.code}</Link>
        <span className="min-w-0 truncate text-xs font-normal text-slate-400">{phu}</span>
      </span>
    );
  };
  const doiDong = (k: number | 'chua-xep') => setDao((cu) => { const s = new Set(cu); if (s.has(k)) s.delete(k); else s.add(k); return s; });

  return (
    <div className="page space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 text-lg font-semibold text-slate-100">{t('Học viên & Lớp')}</h1>
        {/* OV-13p: nút như trang Quản lý (StudentsPage) — điện thoại gom vào ⋯. */}
        {((data?.coTheTaoLop || data?.coTheThemHocVien) || idsXuat.length > 0) && (
          <div className="ml-auto flex items-center gap-2">
            {idsXuat.length > 0 && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" data-hd="hvl-xuat" onClick={() => setXuat(true)}>{t('Xuất Excel · {n} HV', { n: idsXuat.length })}</button>}
            {data?.coTheTaoLop && <button type="button" className="btn btn-sm max-sm:hidden" onClick={() => setTaoLop(true)}>{t('+ Lớp mới')}</button>}
            {data?.coTheThemHocVien && <button type="button" className="btn btn-sm btn-primary max-sm:hidden" onClick={() => setThem(true)}>{t('+ Học viên')}</button>}
            {dienThoai && (data?.coTheTaoLop || data?.coTheThemHocVien) && <MenuDong nhan={t('Thao tác trang')} muc={[
              ...(data.coTheTaoLop ? [{ key: 'lop-moi', nhan: t('+ Lớp mới'), onChon: () => setTaoLop(true) }] : []),
              ...(data.coTheThemHocVien ? [{ key: 'hoc-vien-moi', nhan: t('+ Học viên'), onChon: () => setThem(true) }] : []),
            ]} />}
          </div>
        )}
      </div>
      <div className="space-y-2 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <input className="field w-full sm:w-80" aria-label={t('Tìm')} placeholder={t('Tìm học viên, mã, lớp…')} value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
          {vai === 'tvv' && pv && (
            <select className={SELECT_GON} aria-label={t('Phạm vi')} value={pv.dangDung} onChange={(e) => setParam({ phamVi: e.target.value === 'chi-nhanh' ? 'chi-nhanh' : null })}>
              {pv.coThe.map((v) => <option key={v} value={v}>{t('Phạm vi: {pv}', { pv: PHAM_VI_NHAN[v] })}</option>)}
            </select>
          )}
          {vai === 'cx' && (branches.data?.length ?? 0) > 1 && (
            <select className={SELECT_GON} aria-label={t('Chi nhánh')} value={cn ?? ''} onChange={(e) => { nhoChiNhanh(session?.user?.id, e.target.value ? Number(e.target.value) : null); setParam({ cn: e.target.value || null, branchId: null, phamVi: null }); }}>
              <option value="">{t('Tất cả chi nhánh')}</option>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2" data-hd="hvl-goc">
          <BoLocDoan ariaLabel={t('Góc nhìn')} value={goc} onChange={doiGoc}
            muc={(vai === 'cx' ? (['tat-ca', 'sos', 'can-chu-y', 'lich-thi'] as const) : (['tat-ca', 'sos', 'can-lam', 'lich-thi'] as const)).map((k) => ({ key: k, nhan: tenGoc[k], so: demGoc[k] }))} />
          {goc === 'tat-ca' && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Lọc phụ')}>
              {chips.map((k) => (
                <button key={k} type="button" className="nut-loc" title={CHIP_VAI_NHAN[k].goiY} aria-pressed={chip === k}
                  onClick={() => setParam({ view: vai === 'cx' ? 'tat-ca' : null, loc: chip === k ? null : k })}>
                  {CHIP_VAI_NHAN[k].nhan}<span className="tabular-nums font-medium">{data ? dem(k) : ''}</span>
                </button>
              ))}
            </div>
          )}
          {goc === 'sos' && sos.data && (
            <ChonTuanSos tuan={sos.data.tuan} toanBo={sos.data.toanBo} tuanGanNhat={sos.data.tuanGanNhat} tu={sos.data.tu} den={sos.data.den} onChon={(t) => setParam({ tuan: t || null })} />
          )}
        </div>
        {data && goc !== 'lich-thi' && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-slate-400" aria-live="polite">
            <span>{t('Đang xem')}: <b className="font-semibold text-slate-200">{dangXem}</b></span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{t('{n} học viên', { n: goc === 'sos' ? demGoc.sos ?? 0 : goc === 'can-lam' ? demGoc['can-lam'] ?? 0 : hien.length })}</span>
            {coLoc && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={xoaLoc}>{t('Xoá lọc')}</button>}
          </div>
        )}
      </div>

      {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />}
      {trang.loading && !data && <Skeleton rows={6} />}
      {goc === 'sos' && (
        sos.error ? <ErrorState message={sos.error.message} hint={sos.error.hint} onRetry={sos.reload} />
          : !sos.data ? <Skeleton rows={6} />
            : sosRows.length === 0 ? <Card><Empty title={sos.data.toanBo ? t('Không có học viên SOS trong 8 tuần') : t('Không có học viên SOS ở tuần thi này')} hint={t('Chọn tuần khác hoặc Toàn bộ.')} /></Card>
              : <><PhanTrang {...pt.thanh} /><BangSos data={{ ...sos.data, rows: pt.cat(sosRows) }} cot={vai} dam={null} dienThoai={dienThoai} ds={ds} onMo={(r) => setPanelEm(r.studentId)} dangMo={panelEm} /><PhanTrang {...pt.thanh} duoi /></>
      )}
      {goc === 'can-lam' && data && (viecTvv.length === 0
        ? <Card><Empty title={t('Không có việc nào')} /></Card>
        : <><PhanTrang {...pt.thanh} /><BangCanLam viec={pt.cat(viecTvv)} coNguoi={false} coPhuHuynh dienThoai={dienThoai} ds={ds} /><PhanTrang {...pt.thanh} duoi /></>)}
      {goc === 'lich-thi' && (
        <GocLichThi duongGoc={vai === 'tvv' ? `?phamVi=${phamViUrl ?? 'cua-toi'}` : cn ? `?branchId=${cn}` : '?phamVi=tat-ca'} thangUrl={params.get('thang')} onDoiThang={(m) => setParam({ thang: m.join(',') })} />
      )}
      {xuat && goc !== 'lich-thi' && <NganXuatDs ids={idsXuat} boLoc={dangXem} mauMacDinh={goc === 'sos' ? 'theo-doi-sos' : undefined} onDong={() => setXuat(false)} />}
      {panelEm !== null && <PanelMotEm key={panelEm} studentId={panelEm} onClose={() => setPanelEm(null)} />}
      {buocTiep && <PanelBuocTiep cycleId={buocTiep.cycleId} hocVien={buocTiep.em} lop={buocTiep.lop} onClose={() => setBuocTiep(null)} onDone={trang.reload} />}
      {suaEm && <SuaThongTinMotEm viec={suaEm.viec} studentId={suaEm.id} studentName={suaEm.ten} lop={suaEm.lop} onClose={() => setSuaEm(null)} onDone={() => { setSuaEm(null); trang.reload(); }} />}
      {(goc === 'tat-ca' || goc === 'can-chu-y') && data && (hien.length === 0 ? (
        <Card>
          {!data.rows.length && pv?.dangDung === 'cua-toi'
            ? <Empty title={t('Chưa có học viên nào của bạn')} hint={t('Học viên có TVV là bạn sẽ hiện ở đây.')}
                action={<button type="button" className="btn btn-sm" onClick={() => setParam({ phamVi: 'chi-nhanh' })}>{t('Xem cả chi nhánh')}</button>} />
            : <Empty title={t('Không có học viên nào khớp')} hint={t('Đổi chip lọc, bỏ bớt từ khoá hoặc đổi phạm vi.')}
                action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : undefined} />}
        </Card>
      ) : dienThoai ? (
        <div className="space-y-2">
          <PhanTrang {...pt.thanh} />
          {pt.cat(nhom).map(([k, em]) => (
            <section key={k} className="card overflow-hidden" aria-label={em[0].lop ? t('Lớp {code}', { code: em[0].lop.code }) : t('Chưa xếp lớp')}>
              <button type="button" aria-expanded={!dong.has(k)} onClick={() => doiDong(k)}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 border-0 bg-transparent p-3 text-left">
                <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`shrink-0 text-slate-400 transition-transform ${dong.has(k) ? '' : 'rotate-90'}`}>
                  <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="min-w-0 flex-1">{dauNhom(em)}</span>
              </button>
              {!dong.has(k) && em.map((d) => (
                <TheDong key={d.id} className={d.status !== 'active' ? 'row-muted' : ''}
                  dau={(
                    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                      <Link className="link font-semibold" to={`/hoc-vien/${d.id}`} state={{ ds }}>{d.ten}</Link>
                      <TrangThaiEm d={d} thieu={!!tap.thieu_tt?.has(d.id)} />
                    </span>
                  )}
                  hanhDong={<MenuDong muc={menuCua(d)} />}
                  dong={[
                    { nhan: t('Target · thi'), noiDung: <><TargetText band={d.target} kck={d.kck} /> · <ExamPlanText plan={d.duKienThi} />{d.sauThi && <button type="button" className="mt-1 block min-h-[44px] cursor-pointer appearance-none border-0 bg-transparent p-0 text-left" onClick={() => setPanelEm(d.id)}><NhanSauThi s={d.sauThi} /></button>}</> },
                    { nhan: t('Kết quả'), noiDung: <KetQuaOHocVien k={ketQuaGanNhat(d.standing)} standing={d.standing} thuong={!(d.lop?.ft ?? true)} /> },
                    ...(d.chuY ? [{ nhan: t('Cần chú ý'), noiDung: <OCanChuY c={d.chuY} /> }] : []),
                    ...(vai === 'cx' ? [{ nhan: 'TVV', noiDung: d.tvv ?? <span className="text-slate-500">—</span> }] : []),
                    { nhan: t('Phụ huynh'), noiDung: <OPhuHuynh l={d.lienHe} /> },
                  ]} />
              ))}
            </section>
          ))}
          <PhanTrang {...pt.thanh} duoi />
        </div>
      ) : (
        <section className="card overflow-x-auto" aria-label={t('Học viên theo lớp')}>
          <div className="px-2"><PhanTrang {...pt.thanh} /></div>
          <table className="w-full min-w-[960px] table-fixed text-sm">
            <colgroup>
              <col className={vai === 'cx' ? 'w-[21%]' : 'w-[24%]'} /><col className="w-[13%]" /><col className="w-[17%]" /><col className={vai === 'cx' ? 'w-[18%]' : 'w-[22%]'} />
              {vai === 'cx' && <col className="w-[11%]" />}<col className="w-[16%]" /><col className="w-12" />
            </colgroup>
            <thead><tr>{cot.map((x, i) => <th key={i} className="th">{x ? dich(x) : <span className="sr-only">{t('Thao tác')}</span>}</th>)}</tr></thead>
            {pt.cat(nhom).map(([k, em]) => (
              <tbody key={k}>
                <HangNhom mo={!dong.has(k)} onMo={() => doiDong(k)} nhan={em[0].lop ? t('lớp {ma}', { ma: em[0].lop.code }) : t('nhóm chưa xếp lớp')} soCotDau={cot.length} tieuDe={dauNhom(em)} />
                {!dong.has(k) && em.map((d) => (
                  <HangCon key={d.id} className={`row-hover ${d.status !== 'active' ? 'row-muted' : ''}`}>
                    <td className="td h-14">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <Link className="link max-w-full truncate font-semibold" title={d.ten} to={`/hoc-vien/${d.id}`} state={{ ds }}>{d.ten}</Link>
                        <TrangThaiEm d={d} thieu={!!tap.thieu_tt?.has(d.id)} />
                      </span>
                    </td>
                    <td className="td text-xs tabular-nums text-slate-200">
                      <span className="block"><TargetText band={d.target} kck={d.kck} /></span>
                      <span className="block text-slate-400"><ExamPlanText plan={d.duKienThi} /></span>
                      {/* OV-13q: bấm nhãn mở panel một em (Nhập kết quả / Chọn bước tiếp / Gia hạn tại chỗ). */}
                      {d.sauThi && <button type="button" className="mt-1 block cursor-pointer appearance-none whitespace-normal border-0 bg-transparent p-0 text-left hover:underline" onClick={() => setPanelEm(d.id)}><NhanSauThi s={d.sauThi} gon /></button>}
                    </td>
                    <td className="td"><KetQuaOHocVien k={ketQuaGanNhat(d.standing)} standing={d.standing} thuong={!(d.lop?.ft ?? true)} /></td>
                    <td className="td"><OCanChuY c={d.chuY} /></td>
                    {vai === 'cx' && <td className="td truncate text-xs text-slate-300" title={d.tvv ?? undefined}>{d.tvv ?? <span className="text-slate-600">—</span>}</td>}
                    <td className="td text-sm"><OPhuHuynh l={d.lienHe} /></td>
                    <td className="td text-center"><MenuDong muc={menuCua(d)} /></td>
                  </HangCon>
                ))}
              </tbody>
            ))}
          </table>
          <div className="px-2"><PhanTrang {...pt.thanh} duoi /></div>
        </section>
      ))}
      {createPortal(tt.panels, document.body)}
      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them && (
        <IntakePanel defaultClass={null} onClose={() => setThem(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/students'); trang.reload(); }} />
      )}
    </div>
  );
}
