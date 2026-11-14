import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { TargetText } from '../../ui/ui.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DsLichSu, LichSuGap, lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { fmtBand, skillShort } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  GIAI_THICH_KCK, KCK,
  NHAN_SAU_THI, datKv, nhanThang, nhanThangDuKien, shortDate, tenMonNgan, thangKeTiep, tuanLich, thaoTacLichThi,
  type BuocLichThi, type ExamPlan, type KetLuanLichThi, type KetQuaVao, type LichThi, type NguCanhDs, type ThaoTacLichThi, type TrangThaiSauThi,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * GD-13b (mockup v21 ⑥ K4 · K5 · K8b, lời 35 / 37 / 38 / 40 / 42) — các ô của MỘT hàng em ở Học viên & Lớp › Lịch thi, dùng chung cho bảng (≥ 640 px) và thẻ 375.
 * Tab là THÔNG TIN: không cột việc, không "Đặt lịch ▾". Ô lịch thi MỘT dòng; người có quyền BẤM THẲNG giá trị để sửa (hộp dưới hàng / panel Sau thi có sẵn).
 * Phần mở dưới hàng đổi theo TRẠNG THÁI THI (lời 40): chưa thi → MT gần nhất · Hỗ trợ · Test sắp tới; chờ KQ → Kỳ thi · KQ "Chưa có"; có KQ → KQ so Target · Kỳ thi.
 * Mở hàng KHÔNG gọi request; chỉ mở "Lịch sử · n" khi có hơn 3 dòng mới đọc đủ (một lần).
 */

/** Một hàng của `GET /hoc-vien-lop/lich-thi` (server/src/classes/lichThi.ts → HangLichThi). */
export type Luu = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
export type Kn = Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null>;
export type KqThiThat = {
  ovr: number | null; dat: boolean | null; khongThi: boolean;
  kn: { L: number | null; R: number | null; W: number | null; S: number | null } | null; ngayKq: string | null;
};
export type CaseMoHang = { id: number; kyNang: string | null; sos: number | null; soPa: number };
export type DongLichSu = { luc: string; ai: string | null; ketLuan: string | null; ngay: string | null; ghiChu: string | null; kq?: string | null; noiThi?: string | null };
export type Hang = {
  studentId: number; cycleId: number | null; ten: string; ma: string; classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean; ketLuan: KetLuanLichThi | null; luu: Luu | null; coTheSua: boolean;
  lichThi: LichThi; buoc: BuocLichThi; sauThi: TrangThaiSauThi; kq: KqThiThat | null; buocTiep: string | null;
  chot: { luc: string; ai: string | null } | null;
  /** LICH-THI-NOI-THI (⑥ K4): nơi thi thật, chữ ngắn; null = chưa ghi. */
  noiThi: string | null;
  chiTiet: {
    kn: Kn | null; mtTuan: string | null; truoc: { nhan: string; ovr: number | null; kn: Kn } | null;
    sapToi: { luot: string; tuan: string } | null; caseMo: CaseMoHang[]; lichSu: DongLichSu[]; soLichSu: number;
  };
};
export type TrangThaiLuu = { kieu: 'luu' | 'xong' | 'loi'; loi?: string; lai?: () => void; hoanTac?: () => void };
/** Hàng đang hiện: dữ liệu máy chủ + việc làm tại chỗ. Em vừa dời tháng ra khỏi khoảng đang xem vẫn ở lại tới khi rời trang ("Đã dời sang 11/2026"). */
export type HangHien = Hang & {
  doiSang: { sang: string; truoc: string | null } | null; tt?: TrangThaiLuu;
  /** Vừa lưu tại chỗ: nhật ký có dòng mới → "Lịch sử" chưa biết số, mở thì đọc đủ (một lần). */
  lsCu?: boolean;
};
export type LuuBody = { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string; boLich?: boolean; noiThi?: string };
/** Nơi thi: chữ ngắn — cùng trần máy chủ `NOI_THI_TOI_DA`. */
export const NOI_THI_TOI_DA = 40;

/** Việc đang làm tại chỗ + hành động của hàng (nơi gọi — `GocLichThi` — giữ trạng thái). */
export type Hanh = {
  hop: { id: number; nut: ThaoTacLichThi } | null; panel: { id: number; nut: ThaoTacLichThi } | null;
  bam: (r: HangHien, nut: ThaoTacLichThi) => void;
  /** "+ Ghi chú" ở phần mở → ô Ghi chú của hàng thành ô nhập. */
  suaGhi: (id: number) => void;
  moCase?: (studentId: number, caseId: number) => void; ds?: NguCanhDs;
};

/** Trạng thái thi của em — quyết định phần mở dưới hàng (lời 40). */
export type GiaiDoanThi = 'chua-thi' | 'cho-kq' | 'co-kq';
export const giaiDoanThi = (r: Hang): GiaiDoanThi => (r.buoc === 'cho-kq' ? 'cho-kq' : r.buoc === 'cho-buoc-tiep' || r.buoc === 'xong' ? 'co-kq' : 'chua-thi');
/** Lọc trạng thái thi ([XM-1] chủ SP duyệt lời 37): "Chưa chốt ngày" = có tháng, chưa ngày; "Có KQ" = chờ bước tiếp + xong. Em chưa có lịch chỉ ở "Tất cả". */
export type LocThi = 'chua-chot' | 'da-chot' | 'cho-kq' | 'co-kq';
export const locThiCua = (r: Hang): LocThi | null => (r.buoc === 'du-kien' || r.buoc === 'chua-chot-ngay' ? 'chua-chot'
  : r.buoc === 'da-chot-ngay' ? 'da-chot' : r.buoc === 'cho-kq' ? 'cho-kq' : r.buoc === 'cho-buoc-tiep' || r.buoc === 'xong' ? 'co-kq' : null);

const MO_HOP: ThaoTacLichThi[] = ['chot-ngay', 'doi-thang', 'dat-thang', 'sua-ngay'];
export const laHop = (nut: ThaoTacLichThi) => MO_HOP.includes(nut);
/**
 * Bấm giá trị lịch thi làm gì (thay cột Việc tiếp + "Đặt lịch ▾", lời 35): việc lịch (tháng / ngày) → hộp dưới hàng, mở sẵn đoạn hợp trạng thái
 * ("Chưa chốt ngày" / "Thi …" / đã thi → Ngày thi; còn lại → Tháng dự kiến); không có việc lịch → việc Sau thi (Ghi KQ · Bước tiếp · Sửa KQ → panel). Không quyền → null.
 */
export function viecGiaTri(r: HangHien): ThaoTacLichThi | null {
  if (!r.coTheSua || !r.cycleId) return null;
  const { chinh, phu } = thaoTacLichThi(r.buoc, !r.thuong);
  /* Có KQ → Bước tiếp / Sửa KQ (panel Sau thi). Chờ KQ: giá trị là NGÀY thi → hộp sửa ngày; Ghi kết quả ở "Làm tiếp" (PTA rà #1704: một thao tác một chỗ). */
  if (chinh && !laHop(chinh) && r.buoc !== 'cho-kq') return chinh;
  const ds = [chinh, ...phu].filter((x): x is ThaoTacLichThi => !!x);
  if (ds.some(laHop)) return r.buoc === 'chua-chot-ngay' || r.buoc === 'da-chot-ngay' || r.buoc === 'cho-kq' ? (r.coNgay ? 'sua-ngay' : 'chot-ngay') : r.lichThi.thang ? 'doi-thang' : 'dat-thang';
  return ds[0] ?? null;
}
/** Nút chính ở "Làm tiếp" (chỉ khi việc đó tới lúc — lời 40): chờ KQ → Ghi kết quả · có KQ chưa chọn → Chọn bước tiếp. */
const nutLamTiep = (r: HangHien): ThaoTacLichThi | null => {
  if (!r.coTheSua || !r.cycleId) return null;
  const c = thaoTacLichThi(r.buoc, !r.thuong).chinh;
  return c === 'ghi-kq' || c === 'buoc-tiep' ? c : null;
};

const btnLink = 'link appearance-none border-0 bg-transparent p-0';
const kqChu = (kq: KqThiThat | null): ReactNode => {
  if (!kq) return t('Có KQ');
  if (kq.khongThi) return t('Không thi');
  return <span className={`lt-kq ${kq.dat === true ? 'dat' : kq.dat === false ? 'duoi' : ''}`}>{kq.ovr!.toFixed(1)}</span>;
};

/** Chữ MỘT dòng của ô Lịch thi (lời 37: không dòng phụ — nơi thi, hạn bước tiếp, lịch sử ở phần mở). */
function chuLich(r: HangHien, homNay: string): ReactNode {
  const l = r.lichThi;
  if (r.doiSang) return t('Đã dời sang {thang}', { thang: nhanThang(r.doiSang.sang) });
  switch (r.buoc) {
    case 'chua-co': return t('Chưa có lịch');
    case 'du-kien': return nhanThangDuKien(l.thang!);
    case 'chua-chot-ngay': return t('Chưa chốt ngày');
    case 'da-chot-ngay': return t('Thi {ngay}', { ngay: shortDate(l.ngay, homNay) });
    case 'cho-kq': return t('Đã thi {ngay} · chờ KQ', { ngay: shortDate(l.ngay, homNay) });
    case 'cho-buoc-tiep': return <>{kqChu(r.kq)} · {t('chờ bước tiếp')}</>;
    default: return <>{kqChu(r.kq)} · {(r.buocTiep && NHAN_SAU_THI[r.buocTiep as keyof typeof NHAN_SAU_THI]) || t('Xong')}</>;
  }
}

/**
 * Ô Lịch thi: MỘT dòng. Có quyền → nút (viền nhạt + gạch chấm, nhận ra cả khi không rê — 375 không có rê); không quyền → chữ thường (K5).
 * Phản hồi lưu nằm NGAY ô (dòng dưới): "Đang lưu…" · "✓ Đã lưu · Hoàn tác" (10 giây) · "⚠ Không lưu được · Thử lại" (khi hộp đã đóng; hộp mở thì lỗi ở hộp, chữ giữ).
 */
export function CotLich({ r, hanh }: { r: HangHien; hanh: Hanh }) {
  const { homNay } = useNgayNghiepVu();
  const viec = viecGiaTri(r);
  const lop = `lt-gt ${r.buoc === 'chua-co' && !r.doiSang ? 'lt-mo3' : ''} ${r.buoc === 'xong' && !r.doiSang ? 'lt-xong' : ''}`;
  const s1 = <span className="lt-s1">{chuLich(r, homNay)}</span>;
  const dangMo = (hanh.hop?.id === r.studentId) || (hanh.panel?.id === r.studentId);
  const phanHoi = r.tt?.kieu === 'luu' ? <span className="lt-luu dang" role="status">{t('Đang lưu…')}</span>
    : r.tt?.kieu === 'xong' ? <span className="lt-luu" role="status">✓ {t('Đã lưu')}{r.tt.hoanTac && <button type="button" className="btn btn-sm nut-nho lt-nut-ph" onClick={r.tt.hoanTac}>{t('Hoàn tác')}</button>}</span>
    : r.tt?.kieu === 'loi' && hanh.hop?.id !== r.studentId ? <span className="lt-luu loi" role="alert">⚠ {t('Không lưu được')}<button type="button" className="btn btn-sm nut-nho lt-nut-ph" onClick={r.tt.lai}>{t('Thử lại')}</button></span>
    : null;
  if (!viec || phanHoi) return <span className={`${lop} lt-gt-chu`}>{s1}{phanHoi}</span>;
  return (
    /* Tên truy cập = chữ thấy + "sửa lịch thi · tên em" (WCAG 2.5.3: nhãn chứa chữ hiện trên nút). */
    <button type="button" className={`${lop} lt-gt-nut`} aria-expanded={dangMo} onClick={() => hanh.bam(r, viec)}>{s1}<span className="sr-only"> · {t('Sửa lịch thi {ten}', { ten: r.ten })}</span></button>
  );
}

/** MT gần nhất: Overall ✓ / ✗ so kỳ vọng của lượt + "MT3 · W2 SEP" (lời 42: MỌI em, kể cả đã thi). */
export function CotMt({ r }: { r: HangHien }) {
  const { homNay } = useNgayNghiepVu();
  const st = r.standing;
  if (st?.overall == null) return <span className="text-faint">—</span>;
  const dat = datKv(st.overall, st.expectation, r.kck);
  const phu = [st.attemptLabel, r.chiTiet.mtTuan ? tuanLich(r.chiTiet.mtTuan, homNay) : null].filter(Boolean).join(' · ');
  return <><span className={`lt-diem ${dat === true ? 'dat' : dat === false ? 'duoi' : ''}`}>{st.overall.toFixed(1)}</span>{phu && <span className="lt-diem-phu">{phu}</span>}</>;
}
/* AUDIT-UI HSL2 (G6): KCK không gạch chấm; chưa có Target thì chỉ "KCK"; nghĩa ở title. */
export const CotTarget = ({ r }: { r: HangHien }) => (r.kck
  ? <span className="whitespace-nowrap" title={GIAI_THICH_KCK}>{r.target != null && <>{fmtBand(r.target)} · </>}{KCK}</span>
  : <TargetText band={r.target} kck={false} />);
/** SOS: CÙNG nguồn với cột Hỗ trợ tab Tất cả (`standing.sosLevel` + kỹ năng dưới kỳ vọng) — dữ liệu đã nạp. */
export function CotSos({ r }: { r: HangHien }) {
  const st = r.standing;
  if (!st?.sosLevel || st.sosLevel <= 0) return <span className="text-faint">—</span>;
  return <ChipSos muc={st.sosLevel} tam={st.provisional} ten={r.ten} kyNang={(st.belowSkills ?? []).map((b) => skillShort(b.skill))} />;
}

/** Ghi chú một dòng; bấm → ô tại chỗ (Enter / rời ô lưu · Esc huỷ). "+ Ghi chú" ở phần mở (hiện luôn) bật cùng ô này qua `sua`. */
export function CotGhi({ r, khoa, sua, onSua, onLuu, hienNhan }: {
  r: HangHien; khoa: boolean; sua: boolean; onSua: (bat: boolean) => void; onLuu: (ghiChu: string) => void; hienNhan?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const gc = r.luu?.ghiChu ?? '';
  const [chu, setChu] = useState(gc);
  const [dang, setDang] = useState(false);
  if (sua && !dang) { setDang(true); setChu(gc); }
  if (!sua && dang) setDang(false);
  const dong = (luu: boolean) => {
    if (!sua) return;
    onSua(false);
    if (luu && chu.trim() !== gc.trim()) onLuu(chu.trim());
  };
  if (sua) {
    return <input autoFocus className="field lt-ghi-o" maxLength={300} aria-label={t('Ghi chú {ten}', { ten: r.ten })} value={chu} onChange={(e) => setChu(e.target.value)}
      onBlur={() => dong(true)} onKeyDown={(e) => { if (e.key === 'Enter') dong(true); else if (e.key === 'Escape') { e.stopPropagation(); dong(false); } }} />;
  }
  if (!gc) return hienNhan ? null : <span className="text-faint">—</span>;
  const tip = [r.luu?.ai, r.luu?.luc ? shortDate(r.luu.luc, homNay) : null].filter(Boolean).join(' · ');
  const chuGhi = hienNhan ? <><b className="lt-ghi-nh">{t('Ghi chú')}:</b> {gc}</> : gc;
  if (khoa || !r.coTheSua) return <span className="lt-ghi" style={{ cursor: 'default' }} title={gc}><span>{chuGhi}</span></span>;
  return <button type="button" className="lt-ghi" title={[gc, tip].filter(Boolean).join(' — ')} aria-label={t('Sửa ghi chú {ten}', { ten: r.ten })} onClick={() => onSua(true)}><span>{chuGhi}</span></button>;
}

/** Nút mở dải (mũi tên xuống, mở = lật lên; không dùng "›" vì "›" = đổi trang). */
export function NutMo({ r, mo, onMo }: { r: HangHien; mo: boolean; onMo: () => void }) {
  return (
    <button type="button" className="lt-mo-ct" aria-expanded={mo} aria-label={mo ? t('Thu gọn {ten}', { ten: r.ten }) : t('Chi tiết {ten}', { ten: r.ten })} onClick={onMo}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
    </button>
  );
}

/**
 * Hộp làm tại chỗ dưới hàng (mockup K4 `.hop-dong`): MỘT hàng — đoạn **Tháng dự kiến | Ngày thi** · ô (`ONgay`) · "trước: …" · Ghi chú · Đóng · nút chính.
 * Một lần bấm giá trị làm được cả 4 việc lịch (Đặt / Dời tháng · Chốt / Sửa ngày). Em đã thi (chờ KQ): chỉ Ngày thi. Lỗi: hộp ở lại, giữ chữ.
 */
export function HopLich({ r, nut, onHuy, onLuu, the }: { r: HangHien; nut: ThaoTacLichThi; onHuy: () => void; onLuu: (b: LuuBody) => void; the?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const [ngayKieu, setNgayKieu] = useState(nut === 'chot-ngay' || nut === 'sua-ngay');
  const [ngay, setNgay] = useState<string | null>(r.lichThi.ngay);
  const [thang, setThang] = useState<string | null>(thangKeTiep(`${r.lichThi.thang ?? homNay.slice(0, 7)}-01`));
  const [ghiChu, setGhiChu] = useState(r.luu?.ghiChu ?? '');
  const [noiThi, setNoiThi] = useState(r.noiThi ?? '');
  const khoa = r.tt?.kieu === 'luu';
  const gc = { ...(ghiChu.trim() !== (r.luu?.ghiChu ?? '') ? { ghiChu: ghiChu.trim() } : {}),
    /* LICH-THI-NOI-THI: nơi thi đi cùng Ngày thi (chỉ gửi khi đổi). */ ...(ngayKieu && noiThi.trim() !== (r.noiThi ?? '') ? { noiThi: noiThi.trim() } : {}) };
  const duoc = ngayKieu ? !!ngay : !!thang;
  const gui = () => {
    if (!duoc || khoa) return;
    onLuu(ngayKieu ? { ketLuan: 'chot-ngay', ngay: ngay!, ...gc } : { ketLuan: 'chuyen-thang', thang: thang!.slice(0, 7), ...gc });
  };
  const nhanNut = ngayKieu ? (r.coNgay ? t('Lưu ngày') : t('Chốt ngày')) : (r.lichThi.thang ? t('Dời tháng') : t('Đặt tháng'));
  const nhan = ngayKieu ? t('Ngày thi') : t('Tháng dự kiến');
  const doan = r.buoc !== 'cho-kq' && (
    <span className="doan lt-hop-doan" role="group" aria-label={t('Sửa')}>
      <button type="button" aria-pressed={!ngayKieu} onClick={() => setNgayKieu(false)}>{t('Tháng dự kiến')}</button>
      <button type="button" aria-pressed={ngayKieu} onClick={() => setNgayKieu(true)}>{t('Ngày thi')}</button>
    </span>
  );
  const o = ngayKieu
    ? <ONgay kieu="ngay" gon value={ngay} ariaLabel={nhan} onChange={setNgay} />
    : <ONgay kieu="thang" gon value={thang} ariaLabel={nhan} toiThieu={homNay.slice(0, 7)} onChange={setThang} />;
  const truoc = !ngayKieu && r.lichThi.thang ? t('trước: {thang}', { thang: nhanThang(r.lichThi.thang) }) : null;
  /* LICH-THI-NOI-THI (⑥ K4 "Nơi thi IDP / BC"): ô chữ ngắn cạnh Ngày thi — tuỳ chọn, Enter lưu như ô Ghi chú. */
  const oNoiThi = ngayKieu && (
    <span className="lt-hop-noi"><span className="lt-hop-nh">{t('Nơi thi')}</span>
      <input className="field w-full" maxLength={NOI_THI_TOI_DA} placeholder="IDP / BC" aria-label={t('Nơi thi')} value={noiThi} autoComplete="off"
        onChange={(e) => setNoiThi(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gui(); }} /></span>
  );
  const oGhi = <input className="field w-full" maxLength={300} placeholder={the ? t('Ghi chú (tuỳ chọn)') : t('Tuỳ chọn')} aria-label={t('Ghi chú')} value={ghiChu}
    onChange={(e) => setGhiChu(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gui(); }} />;
  const loi = r.tt?.kieu === 'loi' && (
    <span className="lt-hop-loi" role="alert">⚠ {r.tt.loi} {t('Chữ vẫn giữ.')} <button type="button" className={btnLink} onClick={r.tt.lai}>{t('Thử lại')}</button></span>
  );
  return (
    <div role="group" aria-label={`${t('Sửa lịch thi')} · ${r.ten}`} className={`lt-hop ${the ? 'the' : ''}`} onKeyDown={(e) => { if (e.key === 'Escape') onHuy(); }}>
      {doan || <span className="lt-hop-nh">{nhan}</span>}
      <span className="lt-hop-o">{o}</span>
      {truoc && <span className="lt-hop-truoc">{truoc}</span>}
      {oNoiThi}
      {!the && <span className="lt-hop-nh lt-hop-nh-ghi">{t('Ghi chú')}</span>}
      <span className="lt-hop-ghi">{oGhi}</span>
      <span className="lt-hop-chan">
        <button type="button" className="btn btn-sm nut-nho" onClick={onHuy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm nut-nho btn-primary" disabled={!duoc || khoa} onClick={gui}>{khoa ? t('Đang lưu…') : nhanNut}</button>
      </span>
      {loi}
    </div>
  );
}

const CHU_KET_LUAN: Record<string, string> = {
  'chot-ngay': t('chốt ngày'), 'chuyen-thang': t('dời tháng'), 'ghi-kq': t('ghi KQ'), 'giu-thang': t('giữ tháng'), 'can-xac-nhan': t('chưa kết luận'), 'bo-lich': t('bỏ tháng thi'),
};
const mocLs = (x: DongLichSu, homNay: string) => (x.ngay ? (x.ngay.length === 7 ? nhanThang(x.ngay) : shortDate(x.ngay, homNay)) : null);

/** ↑0.5 · ↓1.0 · = so với MT trước (không có lượt trước / thiếu điểm → không dòng). */
const doiDiem = (v: number | null, p: number | null | undefined): string | null =>
  v == null || p == null ? null : v === p ? '=' : `${v > p ? '↑ ' : '↓ '}${Math.abs(v - p).toFixed(1)}`;

/** Ô % một môn lớp thường (cùng dáng ô kỹ năng FT): ✓ đạt ngưỡng · ✗ chưa đạt · không dấu = chưa chấm / không xét. */
function OPt({ nhan, v, dat }: { nhan: string; v: number | null; dat: boolean | null }) {
  const so = v == null ? '—' : `${Math.round(v)}%`;
  return (
    <span className="lt-okn" role="img" aria-label={[nhan, so, dat === false ? t('Chưa đạt') : null].filter(Boolean).join(' ')}>
      <span className="okn-t">{nhan}</span>
      <span className={`lt-okn-so ${dat === true ? 'dat' : dat === false ? 'duoi' : ''}`}>{so}</span>
    </span>
  );
}

function OKn({ nhan, v, kv, kck, dl, ovr }: { nhan: string; v: number | null; kv: number | null; kck: boolean; dl: string | null; ovr?: boolean }) {
  const dat = datKv(v, kv, kck);
  return (
    <span className={`lt-okn ${ovr ? 'ovr' : ''}`} role="img" aria-label={[nhan, v == null ? '—' : v.toFixed(1), dat === false ? t('Dưới kỳ vọng') : null, dl].filter(Boolean).join(' ')}>
      <span className="okn-t">{nhan}</span>
      <span className={`lt-okn-so ${dat === true ? 'dat' : dat === false ? 'duoi' : ''}`}>{v == null ? '—' : v.toFixed(1)}</span>
      {dl && <span className={`lt-okn-dl ${dl === '=' ? 'bang' : ''}`}>{dl}</span>}
    </span>
  );
}

const Khoi = ({ tieuDe, children, lam }: { tieuDe: ReactNode; children?: ReactNode; lam?: boolean }) => (
  <div className={`lt-dai-k ${lam ? 'lam' : ''}`}>{tieuDe && <span className="lt-dai-t">{tieuDe}</span>}{children}</div>
);
const Cap = ({ ds }: { ds: [string, ReactNode][] }) => <dl className="lt-dai-gv">{ds.map(([k, v]) => <span key={k} className="contents"><dt>{k}</dt><dd>{v}</dd></span>)}</dl>;

/**
 * PHẦN MỞ DƯỚI HÀNG theo trạng thái thi (lời 40 — PHẦN MỞ của em đã thi KHÔNG có MT gần nhất / Test sắp tới; trên hàng vẫn có MT — lời 42):
 * chưa thi → MT gần nhất (5 ô, kỳ vọng, ↑↓) · Hỗ trợ đang mở · Test sắp tới · Phụ trách · Làm tiếp ·
 * chờ KQ → Kỳ thi · KQ thi thật "Chưa có" · Phụ trách · Làm tiếp (Ghi kết quả) ·
 * có KQ → KQ thi thật so Target · Kỳ thi · Phụ trách · Làm tiếp (Chọn bước tiếp khi chưa chọn). Luôn có + Ghi chú (người có quyền) · "Lịch sử · n".
 * Dữ liệu đã nạp cùng danh sách — không request khi mở; "Lịch sử · n" > 3 dòng đọc đủ khi mở (một lần).
 */
export function DaiMo({ r, hanh }: { r: HangHien; hanh: Hanh }) {
  const { homNay } = useNgayNghiepVu();
  const c = r.chiTiet;
  const st = r.standing;
  const gd = giaiDoanThi(r);
  const [moLs, setMoLs] = useState(false);
  const canDu = moLs && (r.lsCu || c.soLichSu > c.lichSu.length) && !!r.cycleId;
  const day = useApi<{ dong: DongLichSu[] }>(canDu ? `/hoc-vien-lop/lich-thi/${r.cycleId}/lich-su` : null, [canDu, r.cycleId]);
  const ls = canDu && day.data ? day.data.dong : c.lichSu;
  const trong = (s = t('Không có')) => <span className="lt-dai-trong">{s}</span>;
  const nutChinh = nutLamTiep(r);
  const ngayThi = r.sauThi.ngayThi ?? r.lichThi.ngay;

  const khoiMt = () => {
    const kv = st?.expectation ?? null;
    const tr = c.truoc;
    const mon: [string, { v: number | null; dat: boolean | null }][] = st?.mode !== 'ratio' || !st.attemptId ? []
      : st.khongChiaMon ? (st.tyLeTong != null ? [['', { v: st.tyLeTong * 100, dat: null }]] : [])
        : Object.entries(st.skills ?? {}).map(([k, x]) => [k, { v: x.v, dat: x.evaluable ? !x.under : null }]);
    const tieuDe = <>{[st?.attemptLabel, c.mtTuan ? tuanLich(c.mtTuan, homNay) : null].filter(Boolean).join(' · ') || t('MT gần nhất')}
      {c.kn && kv != null && <> · <b>{t('kỳ vọng {kv}', { kv: kv.toFixed(1) })}</b></>}{c.kn && tr && <> · {t('↑↓ so {mt}', { mt: tr.nhan })}</>}</>;
    return (
      <Khoi tieuDe={tieuDe}>
        {c.kn ? (
          <span className="lt-okn-h">
            <OKn ovr nhan="Overall" v={st?.overall ?? null} kv={kv} kck={r.kck} dl={doiDiem(st?.overall ?? null, tr?.ovr)} />
            {(['L', 'R', 'W1', 'W2', 'S'] as const).map((k) => <OKn key={k} nhan={k} v={c.kn![k]} kv={kv} kck={r.kck} dl={doiDiem(c.kn![k], tr?.kn[k])} />)}
          </span>
        ) : mon.length ? (
          <span className="lt-okn-h">{mon.map(([k, x]) => <OPt key={k} nhan={k === '' ? t('Tổng') : tenMonNgan(st!.chuongTrinh, k)} v={x.v} dat={x.dat} />)}</span>
        ) : trong(t('Chưa có MT'))}
      </Khoi>
    );
  };
  const khoiKq = () => {
    const kq = r.kq;
    const tieuDe = gd === 'co-kq' && r.target != null && !r.kck ? <>{t('KQ thi thật')} · {t('so')} <b>Target {fmtBand(r.target)}</b></> : t('KQ thi thật');
    if (!kq || kq.khongThi || kq.ovr == null) return <Khoi tieuDe={tieuDe}>{trong(kq?.khongThi ? t('Không thi') : t('Chưa có'))}</Khoi>;
    return (
      <Khoi tieuDe={tieuDe}>
        <span className="lt-okn-h">
          <OKn ovr nhan="Overall" v={kq.ovr} kv={r.target} kck={r.kck} dl={r.target != null && !r.kck ? `Target ${fmtBand(r.target)}` : null} />
          {kq.kn && (['L', 'R', 'W', 'S'] as const).map((k) => <OKn key={k} nhan={k} v={kq.kn![k]} kv={null} kck={r.kck} dl={null} />)}
        </span>
      </Khoi>
    );
  };
  const khoiKyThi = () => (
    <Khoi tieuDe={t('Kỳ thi')}>
      <Cap ds={[[t('Ngày thi'), ngayThi ? shortDate(ngayThi, homNay) : '—'], ...(r.noiThi ? [[t('Nơi thi'), r.noiThi] as [string, ReactNode]] : []),
        ...(gd === 'co-kq' && r.kq?.ngayKq ? [[t('Ghi KQ'), shortDate(r.kq.ngayKq, homNay)] as [string, ReactNode]] : [])]} />
    </Khoi>
  );
  const khoiHoTro = () => (
    <Khoi tieuDe={t('Hỗ trợ đang mở')}>
      {c.caseMo.length ? (
        <span className="lt-dai-ho">
          {c.caseMo.map((x) => (
            <span key={x.id}>
              {hanh.moCase
                ? <button type="button" className={`${btnLink} font-semibold`} onClick={() => hanh.moCase!(r.studentId, x.id)}>{x.kyNang ?? 'Case'}</button>
                : <b>{x.kyNang ?? 'Case'}</b>}
              {' · '}{[x.sos != null ? t('Case SOS {n}', { n: x.sos }) : null, t('{n} PA', { n: x.soPa })].filter(Boolean).join(' · ')}
            </span>
          ))}
        </span>
      ) : trong()}
    </Khoi>
  );
  const khoiSapToi = () => (
    <Khoi tieuDe={t('Test sắp tới')}>{c.sapToi ? <span className="lt-dai-gt">{`${c.sapToi.luot} · ${tuanLich(c.sapToi.tuan, homNay)}`}</span> : trong()}</Khoi>
  );
  const khoiPhuTrach = () => <Khoi tieuDe={t('Phụ trách')}><Cap ds={[['GVCN', r.gvcn ?? '—'], ['TVV', r.tvv ?? '—']]} /></Khoi>;
  const hanBuoc = r.buoc === 'cho-buoc-tiep' && r.sauThi.han ? t('hạn chọn bước tiếp {ngay}', { ngay: shortDate(r.sauThi.han, homNay) }) : null;
  const khoiLam = () => (
    <Khoi lam tieuDe={r.coTheSua ? [t('Làm tiếp'), hanBuoc].filter(Boolean).join(' · ') : null}>
      {r.coTheSua && (
        <span className="lt-lam-n">
          {nutChinh && <button type="button" className="btn btn-sm nut-nho btn-primary" onClick={() => hanh.bam(r, nutChinh)}>{nutChinh === 'ghi-kq' ? t('Ghi kết quả') : t('Chọn bước tiếp')}</button>}
          <button type="button" className="btn btn-sm nut-nho" onClick={() => hanh.suaGhi(r.studentId)}>{r.luu?.ghiChu ? t('Sửa ghi chú') : `+ ${t('Ghi chú')}`}</button>
        </span>
      )}
      <LichSuGap so={r.lsCu ? null : c.soLichSu} onMo={setMoLs}>
        {canDu && day.loading ? <p className="ls-rong">{t('Đang tải')}…</p> : (
          <DsLichSu dong={ls.map((x, i) => ({
            key: i, gio: lucNgan(x.luc), ai: x.ai,
            viec: x.ketLuan ? CHU_KET_LUAN[x.ketLuan] ?? x.ketLuan : t('đổi lịch'), moi: x.kq ?? mocLs(x, homNay),
            phu: [x.noiThi !== undefined ? (x.noiThi ? t('nơi thi {noi}', { noi: x.noiThi }) : t('bỏ nơi thi')) : null, x.ghiChu ? `“${x.ghiChu}”` : null],
          }))} />
        )}
      </LichSuGap>
    </Khoi>
  );
  return (
    <div className={`lt-dai ${gd !== 'chua-thi' ? 'da-thi' : ''}`}>
      {gd === 'chua-thi' && <>{khoiMt()}{khoiHoTro()}{khoiSapToi()}</>}
      {gd === 'cho-kq' && <>{khoiKyThi()}{khoiKq()}</>}
      {gd === 'co-kq' && <>{khoiKq()}{khoiKyThi()}</>}
      {khoiPhuTrach()}
      {khoiLam()}
    </div>
  );
}

/** Tên em: link hồ sơ. */
export function TenEm({ r, ds }: { r: HangHien; ds?: NguCanhDs }) {
  return <Link className="ten-ho-so khong-mui lt-ten" title={r.ten} to={`/hoc-vien/${r.studentId}`} state={ds ? { ds } : undefined}>{r.ten}</Link>;
}

/** Dải nhóm lớp (mockup `.ltt-lop`): mã lớp (link hồ sơ lớp) · n em — tab thông tin, không đếm việc (lời 35). */
export function ChuLop({ lop, classId, n }: { lop: string; classId: number; n: number }) {
  return <><Link className="lt-lop-ma" to={`/hoc-vien/lop/${classId}`}>{lop}</Link> <span className="lt-lop-n">· {t('{n} em', { n })}</span></>;
}
