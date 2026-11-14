import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { TargetText } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { fmtBand } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  GIAI_THICH_KCK, KCK,
  NHAN_SAU_THI, datKv, nhanThang, nhanThangDuKien, shortDate, tenMonNgan, thangKeTiep, tuanLich, thaoTacLichThi,
  type BuocLichThi, type ExamPlan, type KetLuanLichThi, type KetQuaVao, type LichThi, type NguCanhDs, type ThaoTacLichThi, type TrangThaiSauThi,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * LICH-THI-UI (mockup `thiet-ke/v16/lich-thi.html` bản 3, chủ SP 06/11) — các ô của MỘT hàng em ở Học viên & Lớp › Lịch thi, dùng chung cho bảng (≥ 640 px) và thẻ 375.
 * Một hàng nói em đang ở BƯỚC nào (`buocLichThi`: chữ trạng thái + một dòng phụ), việc tiếp theo (đúng MỘT nút chính khi việc đã tới lúc — `thaoTacLichThi`),
 * và mở ra một dải 5 khối (MT gần nhất ↑↓ · Hỗ trợ đang mở · Test sắp tới · Phụ trách · Lịch sử). Mở hàng KHÔNG gọi request; chỉ "Xem toàn bộ" lịch sử gọi một lần.
 */

/** Một hàng của `GET /hoc-vien-lop/lich-thi` (server/src/classes/lichThi.ts → HangLichThi). */
export type Luu = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
export type Kn = Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null>;
export type KqThiThat = { ovr: number | null; dat: boolean | null; khongThi: boolean };
export type CaseMoHang = { id: number; kyNang: string | null; sos: number | null; soPa: number };
export type DongLichSu = { luc: string; ai: string | null; ketLuan: string | null; ngay: string | null; ghiChu: string | null };
export type Hang = {
  studentId: number; cycleId: number | null; ten: string; ma: string; classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean; ketLuan: KetLuanLichThi | null; luu: Luu | null; coTheSua: boolean;
  lichThi: LichThi; buoc: BuocLichThi; sauThi: TrangThaiSauThi; kq: KqThiThat | null; buocTiep: string | null;
  chot: { luc: string; ai: string | null } | null;
  chiTiet: {
    kn: Kn | null; mtTuan: string | null; truoc: { nhan: string; ovr: number | null; kn: Kn } | null;
    sapToi: { luot: string; tuan: string } | null; caseMo: CaseMoHang[]; lichSu: DongLichSu[];
  };
};
export type TrangThaiLuu = { kieu: 'luu' | 'xong' | 'loi'; loi?: string; lai?: () => void; hoanTac?: () => void };
/** Hàng đang hiện: dữ liệu máy chủ + việc làm tại chỗ. Em vừa dời tháng ra khỏi khoảng đang xem vẫn ở lại tới khi rời trang ("Đã dời sang 11/2026", "trước: 09/2026"). */
export type HangHien = Hang & { doiSang: { sang: string; truoc: string | null } | null; tt?: TrangThaiLuu };
export type LuuBody = { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string; boLich?: boolean };

/** Việc đang làm tại chỗ + hành động của hàng (nơi gọi — `GocLichThi` — giữ trạng thái). */
export type Hanh = {
  hop: { id: number; nut: ThaoTacLichThi } | null; panel: { id: number; nut: ThaoTacLichThi } | null; mo: ReadonlySet<number>;
  bam: (r: HangHien, nut: ThaoTacLichThi) => void; doiMo: (id: number) => void; huyHop: () => void;
  luu: (r: HangHien, body: LuuBody) => void; moCase?: (studentId: number, caseId: number) => void; ds?: NguCanhDs;
};

/** Việc của hàng khi em CÓ quyền sửa (`coTheSua`): nút chính + chữ phụ; không quyền → "Chỉ xem". */
export const viecCua = (r: HangHien) => thaoTacLichThi(r.buoc, !r.thuong);
export const canLam = (r: HangHien) => r.coTheSua && viecCua(r).chinh !== null;
/** B7: hàng có MỘT nút "Đặt lịch ▾" (không nút chính, ≥ 2 việc phụ) — thẻ 375 đặt nút này ở hàng tên (mockup). */
export const laMenuLich = (r: HangHien) => r.coTheSua && r.tt?.kieu !== 'xong' && viecCua(r).chinh === null && viecCua(r).phu.length > 1;

const NHAN_NUT: Record<ThaoTacLichThi, () => string> = {
  'chot-ngay': () => t('Chốt ngày'), 'doi-thang': () => t('Dời tháng'), 'dat-thang': () => t('Đặt tháng'), 'sua-ngay': () => t('Sửa ngày'),
  'ghi-kq': () => t('Ghi kết quả'), 'buoc-tiep': () => t('Bước tiếp'), 'sua-kq': () => t('Sửa KQ'),
};
/** Tên đủ trong menu "Đặt lịch ▾" (mockup B7). */
const NHAN_MENU: Partial<Record<ThaoTacLichThi, () => string>> = { 'dat-thang': () => t('Đặt tháng dự kiến'), 'chot-ngay': () => t('Chốt ngày thi') };
const MO_HOP: ThaoTacLichThi[] = ['chot-ngay', 'doi-thang', 'dat-thang', 'sua-ngay'];
export const laHop = (nut: ThaoTacLichThi) => MO_HOP.includes(nut);

const soCon = (ngay: string, homNay: string) => Math.round((Date.parse(`${ngay}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000);
const diemKq = (kq: KqThiThat | null): ReactNode => {
  if (!kq) return t('Có KQ');
  if (kq.khongThi) return t('Không thi');
  return <>KQ <span className={`lt-kq ${kq.dat === true ? 'dat' : kq.dat === false ? 'duoi' : ''}`}>{kq.ovr!.toFixed(1)}</span></>;
};

/** Cột Lịch thi: chữ trạng thái (tên của `nhanLichThi` / `chuSauThi`) + MỘT dòng phụ; hạn quá → dòng phụ đỏ (V22: chỉ màu, chữ nói "quá hạn"). Không thanh, không chip màu. */
export function CotLich({ r }: { r: HangHien }) {
  const { homNay } = useNgayNghiepVu();
  const l = r.lichThi;
  let s1: ReactNode; let s2: ReactNode = null; let qua = false;
  if (r.doiSang) { s1 = t('Đã dời sang {thang}', { thang: nhanThang(r.doiSang.sang) }); s2 = r.doiSang.truoc ? t('trước: {thang}', { thang: nhanThang(r.doiSang.truoc) }) : null; }
  else switch (r.buoc) {
    case 'chua-co': s1 = <span className="font-normal text-faint">{t('Chưa có lịch')}</span>; break;   // AUDIT-UI HL3: một chữ mờ, không lặp "chưa có tháng thi"
    case 'du-kien': s1 = nhanThangDuKien(l.thang!); s2 = t('chốt ngày khi tới tháng'); break;
    case 'chua-chot-ngay': s1 = t('Chưa chốt ngày'); s2 = t('đã tới tháng thi {moc}', { moc: l.tuan ? tuanLich(l.tuan, homNay) : nhanThang(l.thang!) }); break;
    case 'da-chot-ngay': {
      const con = soCon(l.ngay!, homNay);
      s1 = t('Thi {ngay}', { ngay: shortDate(l.ngay, homNay) });
      s2 = con === 0 ? t('hôm nay') : con <= 14 ? t('còn {n} ngày', { n: con }) : r.chot ? t('chốt {ngay}', { ngay: shortDate(r.chot.luc, homNay) }) : null;
      break;
    }
    case 'cho-kq': s1 = t('Đã thi {ngay} · chờ KQ', { ngay: shortDate(l.ngay, homNay) }); break;   // "Cập nhật KQ thi thật" không hạn (luật 21/10-TVV) — không dòng quá hạn
    case 'cho-buoc-tiep': {
      s1 = <>{diemKq(r.kq)} · {t('chờ bước tiếp')}</>;
      qua = r.sauThi.quaHan;
      s2 = [r.sauThi.han ? (qua ? t('quá hạn {ngay}', { ngay: shortDate(r.sauThi.han, homNay) }) : t('hạn {ngay}', { ngay: shortDate(r.sauThi.han, homNay) })) : null,
        r.sauThi.ngayThi ? t('thi {ngay}', { ngay: shortDate(r.sauThi.ngayThi, homNay) }) : null].filter(Boolean).join(' · ') || null;
      break;
    }
    default: {   // xong
      s1 = t('Xong · {buoc}', { buoc: (r.buocTiep && NHAN_SAU_THI[r.buocTiep as keyof typeof NHAN_SAU_THI]) || '—' });
      s2 = <>{diemKq(r.kq)}{r.sauThi.ngayThi ? ` · ${t('thi {ngay}', { ngay: shortDate(r.sauThi.ngayThi, homNay) })}` : ''}</>;
    }
  }
  return (
    <div className={`lt-lich ${r.buoc === 'xong' && !r.doiSang ? 'lt-xong' : ''}`}>
      <span className="lt-s1">{s1}</span>
      {s2 && <span className={`lt-s2 ${qua ? 'lt-qua' : ''}`}>{s2}</span>}
    </div>
  );
}

/** MT gần nhất: Overall ✓ / ✗ so kỳ vọng của lượt (cùng cột MT & HV & Lớp) + nhãn lượt. */
export function CotMt({ r }: { r: HangHien }) {
  const st = r.standing;
  if (st?.overall == null) return <span className="text-faint">—</span>;
  const dat = datKv(st.overall, st.expectation, r.kck);
  return <><span className={`lt-diem ${dat === true ? 'dat' : dat === false ? 'duoi' : ''}`}>{st.overall.toFixed(1)}</span>{st.attemptLabel && <span className="lt-diem-phu">{st.attemptLabel}</span>}</>;
}
/* AUDIT-UI HSL2 (G6): KCK không gạch chấm; chưa có Target thì chỉ "KCK"; nghĩa ở title. */
export const CotTarget = ({ r }: { r: HangHien }) => (r.kck
  ? <span className="whitespace-nowrap" title={GIAI_THICH_KCK}>{r.target != null && <>{fmtBand(r.target)} · </>}{KCK}</span>
  : <TargetText band={r.target} kck={false} />);

/** Ghi chú một dòng chữ đọc; bấm → ô tại chỗ (Enter / rời ô lưu · Esc huỷ). Trống: "+ Ghi chú" khi rê / focus. Người · ngày ghi nằm ở Lịch sử (và tooltip). */
export function CotGhi({ r, khoa, onLuu, hienNhan }: { r: HangHien; khoa: boolean; onLuu: (ghiChu: string) => void; hienNhan?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const [sua, setSua] = useState(false);
  const [chu, setChu] = useState('');
  const dangSua = useRef(false);
  const gc = r.luu?.ghiChu ?? '';
  const bat = () => { if (khoa) return; setChu(gc); dangSua.current = true; setSua(true); };
  const dong = (luu: boolean) => {
    if (!dangSua.current) return;
    dangSua.current = false; setSua(false);
    if (luu && chu.trim() !== gc.trim()) onLuu(chu.trim());
  };
  if (sua) {
    return <input autoFocus className="field lt-ghi-o" maxLength={300} aria-label={t('Ghi chú {ten}', { ten: r.ten })} value={chu} onChange={(e) => setChu(e.target.value)}
      onBlur={() => dong(true)} onKeyDown={(e) => { if (e.key === 'Enter') dong(true); else if (e.key === 'Escape') { e.stopPropagation(); dong(false); } }} />;
  }
  if (!gc) return r.coTheSua ? <button type="button" className="lt-ghi-them" disabled={khoa} onClick={bat}>+ {t('Ghi chú')}</button> : null;
  const tip = [r.luu?.ai, r.luu?.luc ? shortDate(r.luu.luc, homNay) : null].filter(Boolean).join(' · ');
  const chuGhi = hienNhan ? <><b className="lt-ghi-nh">{t('Ghi chú')}:</b> {gc}</> : gc;
  if (khoa) return <span className="lt-ghi" style={{ cursor: 'default' }}><span>{chuGhi}</span></span>;
  return <button type="button" className="lt-ghi" title={tip || undefined} aria-label={t('Sửa ghi chú {ten}', { ten: r.ten })} onClick={bat}><span>{chuGhi}</span></button>;
}

/** Cột Việc tiếp: đúng MỘT nút chính cùng cỡ khi việc đã tới lúc; thao tác phụ là chữ. Sau lưu lịch: "✓ Đã lưu · Hoàn tác" (10 giây). */
export function CotViec({ r, hanh, the }: { r: HangHien; hanh: Hanh; the?: boolean }) {
  const khoa = r.tt?.kieu === 'luu';
  if (!r.coTheSua) return <span className="lt-chi-xem">{t('Chỉ xem')}</span>;
  if (r.tt?.kieu === 'xong') {
    return <div className="lt-viec"><span className="lt-tt" role="status">✓ {t('Đã lưu')}{r.tt.hoanTac && <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={r.tt.hoanTac}>{t('Hoàn tác')}</button>}</span></div>;
  }
  const { chinh, phu } = viecCua(r);
  const mo = (a: ThaoTacLichThi) => (hanh.hop?.id === r.studentId && hanh.hop.nut === a) || (hanh.panel?.id === r.studentId && hanh.panel.nut === a);
  const loiNgoai = r.tt?.kieu === 'loi' && hanh.hop?.id !== r.studentId;
  /* AUDIT-UI B7 (HL3, chủ SP 08/11): không nút chính mà ≥ 2 việc phụ → MỘT nút "Đặt lịch ▾" (menu giữ đủ việc cũ) thay hai link lặp mỗi dòng.
     ≥ 640 px chuột: nút hiện khi rê / chọn dòng / focus bàn phím (CSS `.lt-dat`); 375 + màn chạm luôn hiện. */
  if (laMenuLich(r)) {
    return (
      <div className={`lt-viec ${the ? 'chu' : ''}`}>
        {/* `MenuDong` vẽ menu ra ngoài bảng (portal) — dòng cuối thẻ không bị cắt; đủ chỗ mở xuống, không thì mở lên. */}
        <MenuDong nhan={t('Đặt lịch')} mat={<>{t('Đặt lịch')} ▾</>} lopNut="btn btn-sm lt-dat"
          muc={khoa ? [] : phu.map((a) => ({ key: a, nhan: NHAN_MENU[a]?.() ?? NHAN_NUT[a](), onChon: () => hanh.bam(r, a) }))} />
        {khoa && <span className="lt-tt dang" role="status">{t('Đang lưu…')}</span>}
        {loiNgoai && <span className="lt-tt loi" role="alert">{r.tt!.loi} <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={r.tt!.lai}>{t('Thử lại')}</button></span>}
      </div>
    );
  }
  return (
    <div className={`lt-viec ${the && !chinh ? 'chu' : ''}`}>
      {chinh ? <button type="button" className="btn btn-primary" disabled={khoa} aria-expanded={mo(chinh)} onClick={() => hanh.bam(r, chinh)}>{NHAN_NUT[chinh]()}</button> : !the && <span />}
      {phu.map((a) => <button key={a} type="button" className="lt-phu" disabled={khoa} aria-expanded={mo(a)} onClick={() => hanh.bam(r, a)}>{NHAN_NUT[a]()}</button>)}
      {r.tt?.kieu === 'luu' && <span className="lt-tt dang" role="status">{t('Đang lưu…')}</span>}
      {loiNgoai && <span className="lt-tt loi" role="alert">{r.tt!.loi} <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={r.tt!.lai}>{t('Thử lại')}</button></span>}
    </div>
  );
}

/** Nút mở dải (mũi tên xuống, mở = lật lên; không dùng "›" vì "›" = đổi trang). */
export function NutMo({ r, mo, onMo }: { r: HangHien; mo: boolean; onMo: () => void }) {
  return (
    <button type="button" className="lt-mo-ct" aria-expanded={mo} aria-label={t('Chi tiết {ten}', { ten: r.ten })} onClick={onMo}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
    </button>
  );
}

/** Hộp làm tại chỗ dưới hàng: MỘT hàng, nhãn bên trái ô, ô / nút cùng cao. Chốt ngày · Sửa ngày (ngày) hoặc Đặt / Dời tháng (tháng) + ghi chú tuỳ chọn. Lỗi: hộp ở lại, giữ chữ. */
export function HopLich({ r, nut, onHuy, onLuu, the }: { r: HangHien; nut: ThaoTacLichThi; onHuy: () => void; onLuu: (b: LuuBody) => void; the?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const ngayKieu = nut === 'chot-ngay' || nut === 'sua-ngay';
  const [ngay, setNgay] = useState<string | null>(ngayKieu ? r.lichThi.ngay : null);
  const [thang, setThang] = useState<string | null>(ngayKieu ? null : thangKeTiep(`${r.lichThi.thang ?? homNay.slice(0, 7)}-01`));
  const [ghiChu, setGhiChu] = useState(r.luu?.ghiChu ?? '');
  const khoa = r.tt?.kieu === 'luu';
  const gc = ghiChu.trim() !== (r.luu?.ghiChu ?? '') ? { ghiChu: ghiChu.trim() } : {};
  const duoc = ngayKieu ? !!ngay : !!thang;
  const gui = () => {
    if (!duoc || khoa) return;
    onLuu(ngayKieu ? { ketLuan: 'chot-ngay', ngay: ngay!, ...gc } : { ketLuan: 'chuyen-thang', thang: thang!.slice(0, 7), ...gc });
  };
  const nhanNut = nut === 'sua-ngay' ? t('Lưu ngày') : NHAN_NUT[nut]();
  const nhan = ngayKieu ? t('Ngày thi') : t('Tháng thi');
  const o = ngayKieu
    ? <ONgay kieu="ngay" gon value={ngay} ariaLabel={nhan} onChange={setNgay} />
    : <ONgay kieu="thang" gon value={thang} ariaLabel={nhan} toiThieu={homNay.slice(0, 7)} onChange={setThang} />;
  const truoc = !ngayKieu && r.lichThi.thang ? t('trước: {thang}', { thang: nhanThang(r.lichThi.thang) }) : null;
  const oGhi = <input className="field w-full" maxLength={300} placeholder={t('Tuỳ chọn')} aria-label={t('Ghi chú')} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gui(); }} />;
  const nutDong = <button type="button" className="btn btn-sm" onClick={onHuy}>{t('Đóng')}</button>;
  const nutLuu = <button type="button" className="btn btn-sm btn-primary" disabled={!duoc || khoa} onClick={gui}>{khoa ? t('Đang lưu…') : nhanNut}</button>;
  const loi = r.tt?.kieu === 'loi' && (
    <span className="lt-hop-loi" role="alert">{r.tt.loi} {t('Chữ vẫn giữ.')} <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={r.tt.lai}>{t('Thử lại')}</button></span>
  );
  return (
    <div role="group" aria-label={`${nhanNut} · ${r.ten}`} className="lt-hop" onKeyDown={(e) => { if (e.key === 'Escape') onHuy(); }}>
      {the ? (
        <>
          <label>{nhan}<span className="lt-hop-o">{o}</span></label>
          <label>{t('Ghi chú')}{oGhi}</label>
          <div className="lt-hop-chan">{nutDong}{nutLuu}</div>
        </>
      ) : (
        <>
          <span className="lt-hop-nh">{nhan}</span><span className="lt-hop-o">{o}</span>
          {truoc && <span className="lt-hop-truoc">{truoc}</span>}
          <span className="lt-hop-nh" style={{ marginLeft: 6 }}>{t('Ghi chú')}</span><span className="lt-hop-ghi">{oGhi}</span>
          {nutDong}{nutLuu}
        </>
      )}
      {loi}
    </div>
  );
}

const CHU_KET_LUAN: Record<string, string> = {
  'chot-ngay': t('chốt ngày'), 'chuyen-thang': t('dời tháng'), 'giu-thang': t('giữ tháng'), 'can-xac-nhan': t('chưa kết luận'), 'bo-lich': t('bỏ tháng thi'),
};
const chuLichSu = (x: DongLichSu, homNay: string) =>
  [x.ketLuan ? CHU_KET_LUAN[x.ketLuan] ?? x.ketLuan : x.ngay ? t('lịch → {moc}', { moc: x.ngay.length === 7 ? nhanThang(x.ngay) : shortDate(x.ngay, homNay) }) : null,
    x.ghiChu ? `“${x.ghiChu}”` : null].filter(Boolean).join(' · ');

/** ↑0.5 · ↓1.0 · = so với MT trước (không có lượt trước / thiếu điểm → không dòng). */
const doiDiem = (v: number | null, p: number | null | undefined): string | null =>
  v == null || p == null ? null : v === p ? '=' : `${v > p ? '↑' : '↓'}${Math.abs(v - p).toFixed(1)}`;

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

/**
 * DẢI MỞ HÀNG (như `.hvl-dai` của HV & Lớp #1038): ① MT gần nhất — Overall + L R W1 W2 S ✓ / ✗ so kỳ vọng lượt, ↑ ↓ = so MT trước · ② Hỗ trợ đang mở (kỹ năng bấm → panel Case) ·
 * ③ Test sắp tới · ④ Phụ trách GVCN · TVV · ⑤ Lịch sử lịch thi 3 dòng + Xem toàn bộ. Dữ liệu đã nạp cùng danh sách — không request khi mở. Trống = "—". Không có "Thi thật trước" (chủ SP).
 */
export function DaiMo({ r, hanh }: { r: HangHien; hanh: Hanh }) {
  const { homNay } = useNgayNghiepVu();
  const c = r.chiTiet;
  const st = r.standing;
  const kv = st?.expectation ?? null;
  const [toanBo, setToanBo] = useState(false);
  const day = useApi<{ dong: DongLichSu[] }>(toanBo && r.cycleId ? `/hoc-vien-lop/lich-thi/${r.cycleId}/lich-su` : null, [toanBo, r.cycleId]);
  const ls = toanBo && day.data ? day.data.dong : c.lichSu;
  const trong = <span className="lt-dai-trong">—</span>;
  const tr = c.truoc;
  /* Lớp thường (#1061 việc để sau): lượt Progress / Final chấm theo tỷ lệ → ô % từng môn của lớp (✓ / ✗ theo ngưỡng), Pre FOU một ô Tổng — `standing.skills` đã nạp. */
  const mon: [string, { v: number | null; dat: boolean | null }][] = st?.mode !== 'ratio' || !st.attemptId ? []
    : st.khongChiaMon ? (st.tyLeTong != null ? [['', { v: st.tyLeTong * 100, dat: null }]] : [])
      : Object.entries(st.skills ?? {}).map(([k, x]) => [k, { v: x.v, dat: x.evaluable ? !x.under : null }]);
  return (
    <div className="lt-dai">
      <div className="hvl-dai-k">
        <span className="hvl-dai-t">
          {[st?.attemptLabel, c.mtTuan ? tuanLich(c.mtTuan, homNay) : null].filter(Boolean).join(' · ') || t('MT gần nhất')}
          {c.kn && <span className="lt-dai-mo3"> · {[kv != null ? t('kỳ vọng {kv}', { kv: kv.toFixed(1) }) : null, r.target != null ? `Target ${r.target.toFixed(1)}` : null, tr ? t('↑↓ so {mt}', { mt: tr.nhan }) : null].filter(Boolean).join(' · ')}</span>}
        </span>
        {c.kn ? (
          <span className="hvl-dai-kn">
            <OKn ovr nhan="Overall" v={st?.overall ?? null} kv={kv} kck={r.kck} dl={doiDiem(st?.overall ?? null, tr?.ovr)} />
            {(['L', 'R', 'W1', 'W2', 'S'] as const).map((k) => <OKn key={k} nhan={k} v={c.kn![k]} kv={kv} kck={r.kck} dl={doiDiem(c.kn![k], tr?.kn[k])} />)}
          </span>
        ) : mon.length ? (
          <span className="hvl-dai-kn">{mon.map(([k, x]) => <OPt key={k} nhan={k === '' ? t('Tổng') : tenMonNgan(st!.chuongTrinh, k)} v={x.v} dat={x.dat} />)}</span>
        ) : trong}
      </div>
      <div className="hvl-dai-k">
        <span className="hvl-dai-t">{t('Hỗ trợ đang mở')}</span>
        {c.caseMo.length ? (
          <span className="lt-dai-ho">
            {c.caseMo.map((x) => (
              <span key={x.id}>
                {hanh.moCase
                  ? <button type="button" className="link appearance-none border-0 bg-transparent p-0 font-semibold" onClick={() => hanh.moCase!(r.studentId, x.id)}>{x.kyNang ?? 'Case'}</button>
                  : <b>{x.kyNang ?? 'Case'}</b>}
                {' · '}{[x.sos != null ? t('Case SOS {n}', { n: x.sos }) : null, t('{n} PA', { n: x.soPa })].filter(Boolean).join(' · ')}
              </span>
            ))}
          </span>
        ) : trong}
      </div>
      <div className="hvl-dai-k">
        <span className="hvl-dai-t">{t('Test sắp tới')}</span>
        {c.sapToi ? <span className="lt-dai-gt">{`${c.sapToi.luot} · ${tuanLich(c.sapToi.tuan, homNay)}`}</span> : trong}
      </div>
      <div className="hvl-dai-k">
        <span className="hvl-dai-t">{t('Phụ trách')}</span>
        <dl className="lt-dai-gv"><dt>GVCN</dt><dd>{r.gvcn ?? '—'}</dd><dt>TVV</dt><dd>{r.tvv ?? '—'}</dd></dl>
      </div>
      <div className="hvl-dai-k">
        <span className="hvl-dai-t">{t('Lịch sử lịch thi')}</span>
        {toanBo && day.loading ? <span className="lt-dai-trong">{t('Đang tải')}…</span>
          : ls.length ? <ul className="lt-ls">{ls.map((x, i) => <li key={i}><span className="ngay">{shortDate(x.luc, homNay)}</span>{x.ai && <b>{x.ai}</b>}{x.ai ? ' · ' : ''}{chuLichSu(x, homNay)}</li>)}</ul> : trong}
        {!toanBo && c.lichSu.length >= 3 && <button type="button" className="lt-link" onClick={() => setToanBo(true)}>{t('Xem toàn bộ')}</button>}
      </div>
    </div>
  );
}

/** Tên em: link hồ sơ (tên không cắt "…" ở bảng — cột đủ rộng; dòng lớp đã có ở tiêu đề lớp). */
export function TenEm({ r, ds }: { r: HangHien; ds?: NguCanhDs }) {
  return <Link className="ten-ho-so khong-mui lt-ten" title={r.ten} to={`/hoc-vien/${r.studentId}`} state={ds ? { ds } : undefined}>{r.ten}</Link>;
}

/** Dòng tiêu đề lớp: "MB FT 101 · 3 em · 1 cần làm · 1 quá hạn" — việc gấp không chìm khi xếp theo lớp. */
export function ChuLop({ lop, n, can, qua }: { lop: string; n: number; can: number; qua: number }) {
  return <>{lop} <span className="lt-lop-n">· {t('{n} em', { n })}{can ? ` · ${t('{n} cần làm', { n: can })}` : ''}</span>{qua > 0 && <b className="lt-qua-lop"> · {t('{n} quá hạn', { n: qua })}</b>}</>;
}
