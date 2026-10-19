import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Empty, ErrorState, NutChon, OKck, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { DauDuoi } from '../../ui/Nhan.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MuiTen } from '../cases/SkillBoard.tsx';
import { KHOI_VANG, NutHomNay, OTuan, guiTheoLo } from './TransitionPanel.tsx';
import { t } from '@shared/i18n/index.ts';
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { nhapDiemCua, type QuyenDong } from './thaoTacDongHocVien.tsx';
import {
  NORMAL_LADDER, REGULAR_SKILLS, addDaysIso, RATIO_PASS_THRESHOLD, canLopDich, ghepMucTieu, hienMucTieu, tachMucTieu, coPhieu, khopLocLoTrinh, laChuyenNgay, LO_CHUYEN_NGAY_THUONG, maHocLai, mocLoTrinh, nhomLoTrinh, tenMonNgan, tuanLich,
  type HuongLenh, type LocLoTrinh, type MucTieuLenh, type NhomLoTrinh, type ProgrammeCode, type RegularSkill,
} from '@shared/domain/index.ts';

type BanGiao = { xacNhan: boolean; monXong: string[]; lamLai: boolean; hanGvbm: string | null; hanGvcn: string | null };
type Lenh = { id: number; huong: HuongLenh; lopDichId: number | null; lopDichMa: string | null; tuan: string; mucTieu: MucTieuLenh | null;
  ngayXemLai: string | null; lyDo: string | null; loi: string | null; banGiao: BanGiao };
type Nhap = { huong: HuongLenh; lopDichId: number | null; tuan: string | null; mucTieu: MucTieuLenh | null; ngayXemLai: string | null; ghiChu: string | null };
type KetLuan = { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null };
type Kqdr = {
  nguong: number; goiY: { overall: number; dat: boolean; monTruot: RegularSkill[] } | null;
  mt0: (Record<RegularSkill, number | null> & { overall: number }) | null;
  deXuat: (KetLuan & { boi: string | null }) | null; chot: KetLuan | null;
};
type Em = {
  id: number; studentCode: string; fullName: string; target: number | null; kck: boolean;
  cuoiKhoa: { tyLe: number | null } | null; lenh: Lenh | null; nhap?: Nhap | null; kqdr: Kqdr | null;
  mt0: { maTuan: string | null } | null;
};
type Lop = { id: number; code: string; ft: boolean; programmeCode: ProgrammeCode | null; branchCode: string; studentCount: number };
type KeHoach = {
  from: { id: number; code: string; programmeCode: ProgrammeCode | null };
  candidates: Lop[]; tuanChon: string[]; tuanCuoiKhoa: string | null; students: Em[]; monBanGiao: { ma: string; ngan: string }[];
  coTheRaLenh: boolean; laGvcn: boolean; coTheChotKq: boolean;
};
type ODiem = { score: number | null; total: number | null };
type DongRoster = { id: number; timeline: { kind: string; kindLabel: string; myPending: string[]; ratios: Record<string, ODiem> | null; nguong?: number }[]; cuoiKhoa?: { tyLe: number | null } | null };
/** Lộ trình hiện của một em: lệnh đã chốt, không thì nháp (chỉ QL nhận được nháp từ máy chủ). */
type Lt = { huong: HuongLenh; lopDichId: number | null; lopDichMa: string | null; tuan: string | null; mucTieu: MucTieuLenh | null; ngayXemLai: string | null;
  ghiChu: string | null; chot: boolean };

const NHOM: { key: NhomLoTrinh; nhan: (ke: string | null) => string }[] = [
  { key: 'chua', nhan: () => 'Chưa chọn lộ trình' }, { key: 'ft', nhan: () => 'Lên FT' }, { key: 'len', nhan: (ke) => `Lên ${ke ?? 'lớp kế'}` },
  { key: 'hoc-lai', nhan: () => 'Học lại' }, { key: 'dung', nhan: () => 'Tạm dừng · Dừng học hẳn' },
];
const HUONG: { key: HuongLenh; nhan: (ke: string | null) => string }[] = [
  { key: 'fast_track', nhan: () => 'Lên FT' }, { key: 'len_lop', nhan: (ke) => `Lên ${ke}` }, { key: 'hoc_lai', nhan: () => 'Học lại' },
  { key: 'bao_luu', nhan: () => 'Tạm dừng học' }, { key: 'dung_hoc', nhan: () => 'Dừng học hẳn' },
];
const NGAN: Record<RegularSkill, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const b1 = (n: number) => n.toFixed(1);
const ltCua = (e: Em): Lt | null => (e.lenh
  ? { huong: e.lenh.huong, lopDichId: e.lenh.lopDichId, lopDichMa: e.lenh.lopDichMa, tuan: e.lenh.tuan, mucTieu: e.lenh.mucTieu, ngayXemLai: e.lenh.ngayXemLai, ghiChu: e.lenh.lyDo, chot: true }
  : e.nhap ? { ...e.nhap, lopDichMa: null, chot: false } : null);

/**
 * TAB HỌC VIÊN › "LỘ TRÌNH TIẾP THEO" (OV-3b, mockup `mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` §4; đặc tả §3.1) — lớp thường.
 * Đầu khối: hạn QL chốt · hạn GV bàn giao · x/y em đã chốt; lọc Tất cả · Chưa chốt · Còn bàn giao (số đếm cùng `khopLocLoTrinh` với bảng).
 * Mỗi hướng một bảng nhỏ mở sẵn (thu gọn được): Học viên · Progress · Final (ô bấm → nhập điểm) · [Lên FT: MT0] · Lộ trình · [Lên FT: Kết quả đầu ra] · Bàn giao.
 * QL / Quản trị: hộp Lộ trình (Lưu nháp · Chốt; đã chốt: Lưu · Huỷ quyết định), chọn nhiều em (thanh đáy, lô lỗi một phần giữ dòng lỗi + lý do).
 * GV xem; nháp hiện "Chưa chốt"; GVCN bấm ô Kết quả đầu ra → hộp đề xuất, QL → hộp chốt điền sẵn đề xuất. 375: mỗi em một thẻ.
 */
export function BangLoTrinhTiep({ classId, quyen, onDoi, emMo, onDaMoEm }: {
  classId: number; quyen: QuyenDong; onDoi: () => void;
  /** `&em={id}` trên URL (hồ sơ một em › Lộ trình tiếp theo): mở sẵn hộp của em đó. */
  emMo: number | null; onDaMoEm: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const toast = useToast();
  const kh = useApi<KeHoach>(`/classes/${classId}/transition`, [classId]);
  const roster = useApi<DongRoster[]>(`/classes/${classId}/roster`, [classId]);
  const [loc, setLoc] = useState<LocLoTrinh>('tat-ca');
  const [dong, setDong] = useState<ReadonlySet<NhomLoTrinh>>(new Set());
  const [hop, setHop] = useState<number | null>(null);
  const [hopKq, setHopKq] = useState<number | null>(null);
  const [banGiao, setBanGiao] = useState<number | null>(null);
  const [chon, setChon] = useState<ReadonlySet<number>>(new Set());
  const [loiDong, setLoiDong] = useState<Record<number, string>>({});
  const [lo, setLo] = useState<{ huong: HuongLenh | ''; lop: number | ''; tuan: string }>({ huong: '', lop: '', tuan: '' });
  const [busy, setBusy] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number] | null>(null);

  /* OV-10b: TVV / CX / Admin chỉ đọc lộ trình ĐÃ CHỐT — nháp của Quản lý không hiện. */
  const d = useMemo(() => (kh.data && quyen.theoVai ? { ...kh.data, students: kh.data.students.map((e) => ({ ...e, nhap: null })) } : kh.data), [kh.data, quyen.theoVai]);
  useEffect(() => {
    if (!d || emMo === null) return;
    if (d.coTheRaLenh && d.students.some((s) => s.id === emMo)) setHop(emMo);
    onDaMoEm();
  }, [d, emMo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (kh.error) return <ErrorState message={kh.error.message} hint={kh.error.hint} onRetry={kh.reload} />;
  if (kh.loading || !d) return <Skeleton rows={6} />;
  if (!d.students.length) return <Empty title="Lớp chưa có học viên đang học" />;

  const laQl = d.coTheRaLenh;
  const ma = d.from.programmeCode;
  const ke = ma ? NORMAL_LADDER[ma] ?? null : null;
  const h = homNay ?? '';
  const moc = d.tuanCuoiKhoa ? mocLoTrinh(d.tuanCuoiKhoa) : null;
  const daChot = d.students.filter((s) => s.lenh).length;
  const dem = (l: LocLoTrinh) => d.students.filter((s) => khopLocLoTrinh(s, l)).length;
  const hien = d.students.filter((s) => khopLocLoTrinh(s, loc));
  const theoNhom = (k: NhomLoTrinh) => hien.filter((s) => nhomLoTrinh(ltCua(s)?.huong ?? null) === k);
  const rosterCua = new Map((roster.data ?? []).map((r) => [r.id, r]));
  const lopCua = new Map(d.candidates.map((c) => [c.id, c]));
  const xong = () => { invalidate('/classes'); invalidate('/my-work'); kh.reload(); onDoi(); };

  /** Chữ ô Lộ trình: dòng 1 hướng + lớp, dòng 2 tuần · Target / xem lại. */
  const chuLt = (lt: Lt) => {
    const lop = lt.lopDichId ? lopCua.get(lt.lopDichId) : null;
    const maLop = lop?.code ?? lt.lopDichMa;
    const dau = lt.huong === 'fast_track' ? 'Lên FT' : lt.huong === 'len_lop' ? `Lên ${ke ?? ''}`
      : lt.huong === 'hoc_lai' ? (lop && lop.programmeCode !== ma ? `Xuống ${lop.programmeCode}` : `Học lại${ma ? ` ${ma}` : ''}`)
      : lt.huong === 'bao_luu' ? 'Tạm dừng học (bảo lưu)' : lt.huong === 'chuyen_lop' ? 'Chuyển lớp' : 'Dừng học hẳn';
    const phu = [lt.tuan ? tuanLich(lt.tuan, h) : null, lt.huong === 'fast_track' && lt.mucTieu !== null ? `Target ${hienMucTieu(lt.mucTieu)}` : null,
      lt.huong === 'bao_luu' && lt.ngayXemLai ? `xem lại ${tuanLich(lt.ngayXemLai, h)}` : null].filter(Boolean).join(' · ');
    return { a: [dau, canLopDich(lt.huong) ? maLop : null].filter(Boolean).join(' · '), b: phu };
  };
  const oLoTrinh = (e: Em) => {
    const lt = ltCua(e);
    const loi = loiDong[e.id];
    const noiDung = lt ? (
      <span className="flex min-w-0 items-start gap-2">
        <span className="min-w-0 flex-1 text-[12px] leading-snug">
          <span className="block text-slate-100">{chuLt(lt).a}</span>
          {chuLt(lt).b && <span className="block tabular-nums text-slate-400">{chuLt(lt).b}</span>}
        </span>
        {lt.chot ? <Nhan tone="ok">Đã chốt</Nhan> : <Nhan tone="muted" dut>Nháp</Nhan>}
      </span>
    ) : <span className="text-xs text-slate-500">{laQl ? 'Chọn lộ trình' : 'Chưa chốt'}</span>;
    return (
      <span className="block min-w-0">
        {laQl ? (
          <button type="button" onClick={() => setHop(e.id)} aria-label={`Lộ trình · ${e.fullName}`}
            className="w-full min-h-[44px] rounded-lg border px-2 py-1 text-left hover:border-[color:var(--accent)] sm:min-h-0" style={{ borderColor: 'var(--line)' }}>{noiDung}</button>
        ) : noiDung}
        {loi && <span role="alert" className="mt-1 block text-[12px] text-late">{loi}</span>}
        {e.lenh?.loi && <span className="mt-1 block text-[12px] text-late">Chưa chuyển được: {e.lenh.loi}</span>}
      </span>
    );
  };
  const oDiem = (e: Em, kind: 'progress' | 'final') => {
    const r = rosterCua.get(e.id);
    const t = r?.timeline.find((x) => x.kind === kind);
    const o = Object.values(t?.ratios ?? {});
    const co = o.filter((x) => x.score !== null && x.total);
    const tyLe = kind === 'final' && e.cuoiKhoa?.tyLe != null ? e.cuoiKhoa.tyLe
      : co.length && co.length === o.length ? co.reduce((a, x) => a + x.score!, 0) / co.reduce((a, x) => a + x.total!, 0) : null;
    const duoi = tyLe !== null && tyLe < (t?.nguong ?? RATIO_PASS_THRESHOLD);   // OV-6b1: ngưỡng của lớp
    const chu = tyLe !== null ? (
      <span className={`tabular-nums ${duoi ? 'font-semibold text-late' : 'text-slate-100'}`}>{duoi && <DauDuoi />}{Math.round(tyLe * 100)}%</span>
    ) : co.length ? <span className="text-xs tabular-nums text-slate-400">{co.length}/{o.length} môn có điểm</span> : null;
    const nhap = quyen.coTheNhapDiem && t ? nhapDiemCua(classId, true, [t]) : null;
    if (nhap) return <Link to={nhap.den} className="link inline-flex min-h-[44px] items-center whitespace-nowrap sm:min-h-0" title={nhap.nhan}>{chu ?? (kind === 'final' ? 'Nhập Final' : 'Nhập Progress')}</Link>;
    return chu ?? <span className="text-slate-600">—</span>;
  };
  const oMt0 = (e: Em) => {
    const m = e.kqdr?.mt0;
    if (m) {
      return (
        <span className="text-[12px] tabular-nums text-slate-300">
          {REGULAR_SKILLS.map((k, i) => <span key={k}>{i > 0 && ' · '}{m[k] === null ? `${NGAN[k]} —` : b1(m[k]!)}</span>)} · <b className={m.overall < e.kqdr!.nguong ? 'text-late' : 'text-slate-100'}>{b1(m.overall)}</b>
        </span>
      );
    }
    return <span className="text-xs text-slate-500">{e.lenh ? `Chờ MT0${e.mt0?.maTuan ? ` · ${e.mt0.maTuan}` : ''}` : '—'}</span>;
  };
  const oKqdr = (e: Em) => {
    const k = e.kqdr;
    if (!e.lenh) return <span className="text-xs text-slate-500">sau khi chốt</span>;
    if (!k) return <span className="text-slate-600">—</span>;
    if (!k.mt0) return <span className="text-xs text-slate-500">Chờ MT0</span>;
    const chu = (x: KetLuan) => (x.dat ? '' : `${x.nguyenNhan === 'hoc_sinh' ? 'Học viên' : 'Trung tâm'}${x.mon.length ? ` · ${x.mon.map((m) => NGAN[m as RegularSkill] ?? m).join(' ')}` : ''}`);
    const noiDung = k.chot ? (
      <span className="flex flex-wrap items-center gap-1.5"><Nhan tone={k.chot.dat ? 'ok' : 'bad'}>{k.chot.dat ? 'Đạt' : 'Không đạt'}</Nhan><span className="text-xs text-slate-400">QL chốt{chu(k.chot) && ` · ${chu(k.chot)}`}</span></span>
    ) : k.deXuat ? (
      <span className="flex flex-wrap items-center gap-1.5"><Nhan tone="muted">GVCN đề xuất</Nhan><span className="text-xs text-slate-300">{k.deXuat.dat ? 'Đạt' : `Không đạt · ${chu(k.deXuat)}`}</span></span>
    ) : <span className="text-xs text-slate-500">Chưa có</span>;
    const sua = (d.laGvcn && !k.chot) || d.coTheChotKq;
    return sua ? (
      <button type="button" onClick={() => setHopKq(e.id)} aria-label={`Kết quả đầu ra · ${e.fullName}`}
        className="w-full min-h-[44px] rounded-lg border px-2 py-1 text-left hover:border-[color:var(--accent)] sm:min-h-0" style={{ borderColor: 'var(--line)' }}>{noiDung}</button>
    ) : noiDung;
  };
  const oBanGiao = (e: Em) => {
    const l = e.lenh;
    if (!l) return <span className="text-xs text-slate-500">{e.nhap ? 'sau khi chốt' : '—'}</span>;
    if (!coPhieu(l.huong)) return <span className="text-slate-600">—</span>;
    const chip = (nhan: string, xongMon: boolean, han: string | null) => {
      const qua = !xongMon && !!han && h > han;
      return (
        <span key={nhan} title={xongMon ? 'Đã bàn giao' : qua ? 'Quá hạn' : 'Chưa bàn giao'}
          className={`inline-flex items-center rounded px-1 text-[11.5px] font-semibold tabular-nums ${xongMon ? 'text-ok' : qua ? 'text-late' : 'text-slate-500'}`}>
          {xongMon ? '✓' : qua ? '⚠' : ''}{nhan}
        </span>
      );
    };
    return (
      <button type="button" onClick={() => setBanGiao(l.id)} aria-label={`Bàn giao · ${e.fullName}`} className="flex min-h-[44px] flex-wrap items-center gap-0.5 sm:min-h-0">
        {chip('CN', l.banGiao.xacNhan, l.banGiao.hanGvcn)}
        {d.monBanGiao.map((m) => chip(m.ngan, l.banGiao.monXong.includes(m.ma), l.banGiao.hanGvbm))}
      </button>
    );
  };
  const tenEm = (e: Em) => (
    <span className="flex min-w-0 items-center gap-2">
      {laQl && <input type="checkbox" className="h-[18px] w-[18px] shrink-0 cursor-pointer max-sm:m-[13px]" aria-label={`Chọn ${e.fullName}`}
        checked={chon.has(e.id)} onChange={() => setChon((x) => { const n = new Set(x); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })} />}
      <Link className="link truncate font-semibold" to={`/hoc-vien/${e.id}`}>{e.fullName}</Link>
    </span>
  );

  const bang = (k: NhomLoTrinh, ds: Em[]) => {
    const ft = k === 'ft';
    const cot = ['Học viên', 'Progress', 'Final', ...(ft ? ['MT0 · L R W S · Overall'] : []), 'Lộ trình', ...(ft ? ['Kết quả đầu ra'] : []), 'Bàn giao'];
    if (dt) {
      return ds.map((e) => (
        <TheDong key={e.id} className={chon.has(e.id) ? 'bg-[color:var(--accent-soft)]' : ''} dau={tenEm(e)}
          dong={[
            { nhan: 'Progress', noiDung: oDiem(e, 'progress') }, { nhan: 'Final', noiDung: oDiem(e, 'final') },
            ...(ft ? [{ nhan: 'MT0', noiDung: oMt0(e) }] : []),
            { nhan: 'Lộ trình', noiDung: oLoTrinh(e) },
            ...(ft ? [{ nhan: 'Kết quả', noiDung: oKqdr(e) }] : []),
            { nhan: 'Bàn giao', noiDung: oBanGiao(e) },
          ]} />
      ));
    }
    return (
      <div className="table-scroll">
        <table className="w-full min-w-[960px] table-fixed text-sm">
          <colgroup>
            <col className={ft ? 'w-[16%]' : 'w-[22%]'} /><col className="w-[8%]" /><col className="w-[8%]" />{ft && <col className="w-[15%]" />}<col />{ft && <col className="w-[17%]" />}<col className="w-[13%]" />
          </colgroup>
          <thead><tr>{cot.map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
          <tbody>
            {ds.map((e) => (
              <tr key={e.id} className={`row-hover ${chon.has(e.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
                <td className="td h-11">{tenEm(e)}</td>
                <td className="td">{oDiem(e, 'progress')}</td>
                <td className="td">{oDiem(e, 'final')}</td>
                {ft && <td className="td">{oMt0(e)}</td>}
                <td className="td">{oLoTrinh(e)}</td>
                {ft && <td className="td">{oKqdr(e)}</td>}
                <td className="td">{oBanGiao(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /** Chọn nhiều: một hướng · lớp · tuần cho mọi em đã chọn. Lô lỗi một phần: dòng lỗi giữ chọn + lý do, dòng đúng bỏ chọn. */
  const luuLo = async (chotLuon: boolean) => {
    if (!lo.huong) { toast.push('error', 'Chọn hướng cho các em đã chọn.'); return; }
    const ids = [...chon];
    setBusy(true);
    try {
      const dongs = ids.map((studentId) => ({ studentId, huong: lo.huong, toClassId: lo.lop || null, tuan: lo.tuan || null }));
      const r: { ok: number[]; failed: { studentId: number; message: string }[] } = chotLuon
        /* OV-13l → OV-13m: chuyển ngay chạy trong lời gọi — lớp thường Cuối khoá một em một lời gọi, chân hiện "Đang chuyển… n/m em". */
        ? await guiTheoLo(`/classes/${classId}/transition`, null, laChuyenNgay(lo.tuan, h) ? LO_CHUYEN_NGAY_THUONG : dongs.length, setTienDo, dongs)
        : await api.put(`/classes/${classId}/lo-trinh-nhap`, { items: dongs });
      setLoiDong(Object.fromEntries(r.failed.map((f) => [f.studentId, f.message])));
      setChon(new Set(r.failed.map((f) => f.studentId)));
      toast.push(r.failed.length ? 'error' : 'ok', `${chotLuon ? (laChuyenNgay(lo.tuan, h) ? t('Đã chuyển') : 'Đã chốt') : 'Đã lưu nháp'} ${r.ok.length} em${r.failed.length ? ` · ${r.failed.length} em chưa lưu — xem lý do ở dòng` : ''}`);
      xong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); setTienDo(null); }
  };
  const lopLo = lopTheoHuong(d.candidates, lo.huong, ma, ke);

  return (
    <div className="space-y-3">
      <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
        <b className="text-slate-100">Lộ trình tiếp theo</b>
        {moc && <span className="text-slate-300">QL chốt trước hết <span className={`tabular-nums ${h > moc.hanChot && daChot < d.students.length ? 'text-late' : ''}`}>{tuanLich(moc.hanChot, h)}</span> · GV bàn giao trước hết <span className="tabular-nums">{tuanLich(moc.hanBanGiao, h)}</span></span>}
        <span className="tabular-nums text-slate-300"><b className="text-slate-100">{daChot}/{d.students.length}</b> em đã chốt</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc">
        {(['tat-ca', 'chua-chot', 'con-ban-giao'] as const).map((l) => (
          <NutChon key={l} nho chon={loc === l} onClick={() => setLoc(l)}>
            {l === 'tat-ca' ? 'Tất cả' : l === 'chua-chot' ? 'Chưa chốt' : 'Còn bàn giao'} <span className="tabular-nums text-slate-400">{dem(l)}</span>
          </NutChon>
        ))}
      </div>
      {!hien.length && <Empty title={loc === 'chua-chot' ? 'Mọi em đã chốt' : 'Không còn em chờ bàn giao'} />}
      {NHOM.map(({ key, nhan }) => {
        const ds = theoNhom(key);
        if (!ds.length || (key === 'len' && !ke)) return null;
        const mo = !dong.has(key);
        return (
          <section key={key} className="card overflow-hidden">
            <h3 className="m-0 text-sm font-semibold text-slate-100">
              <button type="button" aria-expanded={mo} onClick={() => setDong((x) => { const n = new Set(x); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left">
                <span className="text-slate-400"><MuiTen mo={mo} /></span><span className="whitespace-nowrap">{nhan(ke)}</span><span className="whitespace-nowrap text-xs font-normal tabular-nums text-slate-400">{ds.length} em</span>
                {key === 'hoc-lai' && <span className="text-xs font-normal text-slate-500 max-sm:hidden">· cùng trình độ hoặc xuống lộ trình dưới</span>}
              </button>
            </h3>
            {mo && bang(key, ds)}
          </section>
        );
      })}

      {laQl && chon.size > 0 && (
        <div role="toolbar" aria-label="Lộ trình cho các em đã chọn"
          className="sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 shadow-xl sm:mx-0 sm:rounded-lg sm:border"
          style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          <b className="mr-1 text-sm tabular-nums text-slate-100">{chon.size} em đã chọn</b>
          <select className="field w-auto min-h-[44px] sm:min-h-0" aria-label="Hướng" value={lo.huong} onChange={(e) => setLo({ huong: e.target.value as HuongLenh, lop: '', tuan: lo.tuan })}>
            <option value="">Hướng…</option>
            {HUONG.filter((x) => x.key !== 'len_lop' || ke).map((x) => <option key={x.key} value={x.key}>{x.nhan(ke)}</option>)}
          </select>
          {lo.huong && canLopDich(lo.huong) && (
            <select className="field w-auto min-h-[44px] sm:min-h-0" aria-label="Lớp chuyển đến" value={lo.lop} onChange={(e) => setLo({ ...lo, lop: Number(e.target.value) || '' })}>
              <option value="">Lớp…</option>
              {lopLo.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.studentCount} HV</option>)}
            </select>
          )}
          <NutHomNay nho homNay={homNay} chon={!!homNay && lo.tuan === homNay} onClick={() => setLo({ ...lo, tuan: homNay ?? '' })} />
          <span className="w-36"><OTuan tuanChon={d.tuanChon} value={laChuyenNgay(lo.tuan, h) ? '' : lo.tuan} onChange={(v) => setLo({ ...lo, tuan: v })} ariaLabel="Tuần bắt đầu" chuaChon="Tuần…" /></span>
          <span className="flex-1" />
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => { setChon(new Set()); setLoiDong({}); }} disabled={busy}>Bỏ chọn</button>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => luuLo(false)} disabled={busy}>Lưu nháp</button>
          <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => luuLo(true)} disabled={busy}>
            {tienDo && busy ? t('Đang chuyển… {a}/{b} em', { a: tienDo[0], b: tienDo[1] }) : laChuyenNgay(lo.tuan, h) ? t('Chuyển ngay · {n} em', { n: chon.size }) : <>Chốt {chon.size} em</>}</button>
        </div>
      )}

      {hop !== null && (() => {
        const e = d.students.find((s) => s.id === hop);
        return e ? <HopLoTrinh key={e.id} classId={classId} kh={d} em={e} ke={ke} onDong={() => setHop(null)} onXong={() => { setHop(null); setLoiDong((x) => ({ ...x, [e.id]: '' })); xong(); }} /> : null;
      })()}
      {hopKq !== null && (() => {
        const e = d.students.find((s) => s.id === hopKq);
        return e?.kqdr?.mt0 ? <HopKetQua key={e.id} kh={d} em={e} onDong={() => setHopKq(null)} onXong={() => { setHopKq(null); xong(); }} /> : null;
      })()}
      {banGiao !== null && <BanGiaoPanel classId={classId} mon={null} lenhId={banGiao} onClose={() => setBanGiao(null)} onDone={xong} />}
    </div>
  );
}

/** Lớp chuyển đến hợp lệ cho hướng: FT → lớp FT; Lên → chương trình kế; Học lại → cùng hoặc thấp hơn (`maHocLai`). */
function lopTheoHuong(ds: readonly Lop[], huong: HuongLenh | '', ma: ProgrammeCode | null, ke: ProgrammeCode | null): Lop[] {
  if (huong === 'fast_track') return ds.filter((c) => c.ft);
  if (huong === 'len_lop') return ds.filter((c) => !c.ft && c.programmeCode === ke);
  if (huong === 'hoc_lai') return ds.filter((c) => !c.ft && !!c.programmeCode && maHocLai(ma).includes(c.programmeCode));
  return [];
}

function Truong({ nhan, children }: { nhan: string; children: ReactNode }) {
  return (
    <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-sm max-sm:grid-cols-1">
      <span className="text-[12px] font-semibold text-slate-300">{nhan}</span>{children}
    </label>
  );
}

/** HỘP LỘ TRÌNH của một em (chỉ QL / Quản trị) — hướng · lớp · tuần · Target (Lên FT) · xem lại (Tạm dừng) · ghi chú. Lỗi hiện trong hộp, giữ chữ đã gõ. */
function HopLoTrinh({ classId, kh, em, ke, onDong, onXong }: {
  classId: number; kh: KeHoach; em: Em; ke: ProgrammeCode | null; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const goc = ltCua(em);
  const [huong, setHuong] = useState<HuongLenh | ''>(goc?.huong ?? '');
  const [lop, setLop] = useState<number | ''>(goc?.lopDichId ?? '');
  /* HL-12: điền sẵn tuần sau tuần Final (mặc định hiển nhiên) khi tuần đó còn trong ô chọn. */
  const tuanSauFinal = kh.tuanCuoiKhoa ? addDaysIso(kh.tuanCuoiKhoa, 7) : null;
  const [tuan, setTuan] = useState(goc?.tuan ?? (tuanSauFinal && kh.tuanChon.includes(tuanSauFinal) ? tuanSauFinal : ''));
  /* OV-9: Target số + ô tích KCK riêng (dấu của em giữ khi chưa có quyết định). */
  const tgGoc = goc?.mucTieu != null ? tachMucTieu(goc.mucTieu) : { target: em.target, kck: em.kck };
  const [target, setTarget] = useState(tgGoc.target == null ? '' : String(tgGoc.target));
  const [kck, setKck] = useState(tgGoc.kck);
  const [xemLai, setXemLai] = useState(goc?.ngayXemLai ?? '');
  const [ghiChu, setGhiChu] = useState(goc?.ghiChu ?? '');
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [huy, setHuy] = useState<string | null>(null);
  const ma = kh.from.programmeCode;
  const dsLop = lopTheoHuong(kh.candidates, huong, ma, ke);
  const muc = (): MucTieuLenh | null => (huong !== 'fast_track' ? null : ghepMucTieu(target.trim() ? Number(target.replace(',', '.')) : null, kck));
  const than = () => ({
    huong, toClassId: huong && canLopDich(huong) ? lop || null : null, tuan: tuan || null, mucTieu: muc(),
    ngayXemLai: huong === 'bao_luu' ? xemLai || null : null,
  });
  const chay = async (fn: () => Promise<string | null>, ok: string) => {
    if (!huong && !huy) { setLoi('Chọn hướng cho em.'); return; }
    setBusy(true); setLoi(null);
    try {
      const sai = await fn();
      if (sai) setLoi(sai); else { toast.push('ok', ok); onXong(); }
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };
  const luuNhap = () => chay(async () => {
    const r: any = await api.put(`/classes/${classId}/lo-trinh-nhap`, { items: [{ studentId: em.id, ...than(), ghiChu }] });
    return r.failed[0]?.message ?? null;
  }, 'Đã lưu nháp');
  const chot = () => chay(async () => {
    const r: any = await api.post(`/classes/${classId}/transition`, { tuanChung: null, dongs: [{ studentId: em.id, ...than(), lyDo: ghiChu }] });
    return r.failed[0]?.message ?? null;
  }, ngayNay ? t('Đã chuyển') : 'Đã chốt');
  const sua = () => chay(async () => { await api.patch(`/lenh-chuyen/${em.lenh!.id}`, { ...than(), lyDo: ghiChu }); return null; }, ngayNay ? t('Đã chuyển') : 'Đã lưu');
  const xoaNhap = () => chay(async () => { await api.del(`/classes/${classId}/lo-trinh-nhap/${em.id}`); return null; }, 'Đã xoá nháp');
  const huyLenh = () => chay(async () => {
    if (!huy?.trim()) return 'Ghi lý do huỷ.';
    await api.post(`/lenh-chuyen/${em.lenh!.id}/huy`, { lyDo: huy });
    return null;
  }, 'Đã huỷ quyết định');
  const btn = 'btn btn-sm min-h-[44px] sm:min-h-0';
  const final = em.cuoiKhoa?.tyLe;
  /* OV-13l: "Ngay hôm nay" — Chốt / Lưu chuyển luôn, không hoàn tác (khung vàng, nút "Chuyển ngay"). */
  const ngayNay = !!homNay && laChuyenNgay(tuan, homNay) && !!huong && huong !== 'dung_hoc';
  /** Lệnh chuyển lớp (bối cảnh giua-khoa): sửa ở Chuyển lớp…, ở đây chỉ xem / huỷ. */
  const giuaKhoa = em.lenh?.huong === 'chuyen_lop';

  return (
    <Modal open onClose={onDong} width="max-w-md" title={`Lộ trình · ${em.fullName}`} footer={huy !== null ? (
      <>
        <button type="button" className={`${btn} btn-ghost`} onClick={() => setHuy(null)} disabled={busy}>Quay lại</button>
        <button type="button" className={`${btn} btn-danger`} onClick={huyLenh} disabled={busy}>{busy ? 'Đang huỷ…' : 'Huỷ quyết định'}</button>
      </>
    ) : em.lenh ? (
      <>
        <button type="button" className={`${btn} btn-ghost`} onClick={() => setHuy('')} disabled={busy}>Huỷ quyết định</button>
        <span className="flex-1" />
        {!giuaKhoa && <button type="button" className={`${btn} btn-primary`} onClick={sua} disabled={busy}>{busy ? 'Đang lưu…' : ngayNay ? t('Chuyển ngay') : 'Lưu'}</button>}
      </>
    ) : (
      <>
        {em.nhap && <button type="button" className={`${btn} btn-ghost`} onClick={xoaNhap} disabled={busy}>Xoá nháp</button>}
        <span className="flex-1" />
        <button type="button" className={btn} onClick={luuNhap} disabled={busy}>Lưu nháp</button>
        <button type="button" className={`${btn} btn-primary`} onClick={chot} disabled={busy}>{busy ? 'Đang lưu…' : ngayNay ? t('Chuyển ngay') : 'Chốt'}</button>
      </>
    )}>
      <div className="space-y-3">
        <p className="m-0 flex flex-wrap items-center gap-2 text-xs tabular-nums text-slate-400">
          {kh.from.code}{final != null && ` · Final ${Math.round(final * 100)}%`}
          {em.lenh ? <Nhan tone="ok">Đã chốt</Nhan> : em.nhap ? <Nhan tone="muted" dut>Nháp — chỉ QL thấy</Nhan> : null}
        </p>
        {huy !== null ? (
          <Truong nhan="Lý do huỷ">
            <input className="field w-full" value={huy} maxLength={2000} autoFocus onChange={(e) => setHuy(e.target.value)} />
          </Truong>
        ) : giuaKhoa ? (
          <p className="m-0 text-sm text-slate-300">Chuyển lớp{em.lenh?.lopDichMa ? ` → ${em.lenh.lopDichMa}` : ''} — sửa ở ⋯ Chuyển lớp… của em.</p>
        ) : (
          <>
            <div role="group" aria-label="Hướng" className="flex flex-wrap gap-1.5">
              {HUONG.filter((x) => x.key !== 'len_lop' || ke).map((x) => (
                <NutChon key={x.key} nho chon={huong === x.key} onClick={() => { setHuong(x.key); setLop(''); }}>{x.nhan(ke)}</NutChon>
              ))}
            </div>
            {huong && canLopDich(huong) && (
              <Truong nhan="Lớp chuyển đến">
                <select className="field w-full" value={lop} onChange={(e) => setLop(Number(e.target.value) || '')}>
                  <option value="">Chọn lớp…</option>
                  {dsLop.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.studentCount} HV</option>)}
                </select>
              </Truong>
            )}
            {huong && huong !== 'dung_hoc' && (
              <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-sm max-sm:grid-cols-1">
                <span className="text-[12px] font-semibold text-slate-300">Tuần bắt đầu</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <NutHomNay nho homNay={homNay} chon={ngayNay} onClick={() => setTuan(homNay ?? '')} />
                  <span className="w-36"><OTuan tuanChon={kh.tuanChon} value={homNay && laChuyenNgay(tuan, homNay) ? '' : tuan} onChange={setTuan} ariaLabel="Tuần bắt đầu" chuaChon="Chọn tuần" /></span>
                </span>
              </div>
            )}
            {ngayNay && <p role="note" className="m-0 rounded-lg border px-3 py-2 text-[13px] font-semibold text-soon" style={KHOI_VANG}>⚠ {t('Chuyển ngay, không hoàn tác')}</p>}
            {huong === 'fast_track' && (
              /* OV-9: ô Target + ô tích KCK — khung div (không lồng label). */
              <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-sm max-sm:grid-cols-1">
                <span className="text-[12px] font-semibold text-slate-300">Target</span>
                <span className="flex flex-wrap items-center gap-3">
                  <input className="field w-24 tabular-nums" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target" />
                  <OKck chon={kck} onChange={setKck} />
                </span>
              </div>
            )}
            {huong === 'bao_luu' && (
              <Truong nhan="Xem lại"><OTuan tuanChon={kh.tuanChon} value={xemLai} onChange={setXemLai} ariaLabel="Tuần xem lại" chuaChon="Chọn tuần" rong /></Truong>
            )}
            <Truong nhan="Ghi chú">
              <input className="field w-full" value={ghiChu} maxLength={500} onChange={(e) => setGhiChu(e.target.value)} placeholder="Ghi chú cho GV lớp mới" />
            </Truong>
          </>
        )}
        {loi && <p role="alert" className="m-0 text-[13px] text-late">{loi}</p>}
      </div>
    </Modal>
  );
}

/** HỘP KẾT QUẢ ĐẦU RA — GVCN đề xuất (không chạy gì) · QL chốt (điền sẵn đề xuất GVCN; Không đạt · Trung tâm → Case + Tutor 10 buổi). */
function HopKetQua({ kh, em, onDong, onXong }: { kh: KeHoach; em: Em; onDong: () => void; onXong: () => void }) {
  const toast = useToast();
  const k = em.kqdr!;
  const laQl = kh.coTheChotKq;
  const goc = (laQl ? k.chot ?? k.deXuat : k.deXuat) ?? null;
  const [dat, setDat] = useState(goc ? goc.dat : !!k.goiY?.dat);
  const [nn, setNn] = useState<'trung_tam' | 'hoc_sinh'>(goc?.nguyenNhan ?? 'trung_tam');
  const [mon, setMon] = useState<RegularSkill[]>((goc?.mon.length ? goc.mon : k.goiY?.monTruot ?? []) as RegularSkill[]);
  const [ghiChu, setGhiChu] = useState(goc?.ghiChu ?? '');
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ma = kh.from.programmeCode;
  const luu = async () => {
    if (!dat && !mon.length) { setLoi('Chọn kỹ năng chưa đạt.'); return; }
    if (!dat && nn === 'hoc_sinh' && !ghiChu.trim()) { setLoi('Ghi lý do.'); return; }
    setBusy(true); setLoi(null);
    try {
      const than = dat ? { dat: true } : { dat: false, nguyenNhan: nn, mon, ghiChu: ghiChu.trim() || null };
      await api.put(`/students/${em.id}/${laQl ? 'ket-luan-ft' : 'ket-qua-de-xuat'}`, than);
      invalidate('/cases'); invalidate('/students');
      toast.push('ok', laQl ? 'Đã chốt Kết quả đầu ra' : 'Đã lưu đề xuất');
      onXong();
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };
  const btn = 'btn btn-sm min-h-[44px] sm:min-h-0';
  return (
    <Modal open onClose={onDong} width="max-w-md" title={`Kết quả đầu ra · ${em.fullName}`}
      footer={<button type="button" className={`${btn} btn-primary`} onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : laQl ? 'Chốt' : 'Lưu đề xuất'}</button>}>
      <div className="space-y-3">
        <p className="m-0 text-xs tabular-nums text-slate-400">MT0 Overall {b1(k.mt0!.overall)} · ngưỡng {ma} {ma === 'FOU' ? '> 3.5' : b1(k.nguong)}</p>
        {laQl && k.deXuat && (
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
            <Nhan tone="muted">GVCN đề xuất</Nhan>{k.deXuat.dat ? 'Đạt' : `Không đạt · ${k.deXuat.nguyenNhan === 'hoc_sinh' ? 'Học viên' : 'Trung tâm'} · ${k.deXuat.mon.map((m) => NGAN[m as RegularSkill] ?? m).join(' ')}`}
            {k.deXuat.boi && ` — ${k.deXuat.boi}`}{k.deXuat.ghiChu && <span className="basis-full text-slate-400">{k.deXuat.ghiChu}</span>}
          </p>
        )}
        <div role="group" aria-label="Kết quả" className="grid grid-cols-2 gap-1.5">
          <NutChon nho chon={dat} onClick={() => setDat(true)}>Đạt</NutChon>
          <NutChon nho chon={!dat} onClick={() => setDat(false)}>Không đạt</NutChon>
        </div>
        {!dat && (
          <>
            <div role="group" aria-label="Nguyên nhân" className="grid grid-cols-2 gap-1.5">
              <NutChon nho chon={nn === 'trung_tam'} onClick={() => setNn('trung_tam')}>Trung tâm</NutChon>
              <NutChon nho chon={nn === 'hoc_sinh'} onClick={() => setNn('hoc_sinh')}>Học viên</NutChon>
            </div>
            <div role="group" aria-label="Kỹ năng chưa đạt" className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-semibold text-slate-300">Kỹ năng</span>
              {REGULAR_SKILLS.map((x) => (
                <NutChon key={x} nho chon={mon.includes(x)} title={tenMonNgan(ma, x)}
                  onClick={() => setMon(mon.includes(x) ? mon.filter((y) => y !== x) : REGULAR_SKILLS.filter((y) => y === x || mon.includes(y)))}>
                  {NGAN[x]} {k.mt0![x] === null ? '—' : b1(k.mt0![x]!)}
                </NutChon>
              ))}
            </div>
            {(!laQl || nn === 'hoc_sinh') && (
              <textarea className="field w-full" rows={2} maxLength={2000} aria-label="Lý do" placeholder="Lý do" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
            )}
            {laQl && nn === 'trung_tam' && mon.length > 0 && (
              <p className="m-0 text-[13px] text-slate-300">Chốt: tạo <b>Case {mon.map((x) => NGAN[x]).join(', ')}</b> + <b>Tutor 10 buổi</b> cho em ở lớp FT mới.</p>
            )}
          </>
        )}
        {loi && <p role="alert" className="m-0 text-[13px] text-late">{loi}</p>}
      </div>
    </Modal>
  );
}
