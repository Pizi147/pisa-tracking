import { ChipXetLaiDong } from './PanelXetLai.tsx';
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { invalidate } from '../../lib/api.ts';
import { fmtBand } from '../../lib/format.ts';
import { Bang, OBang } from '../../ui/Bang.tsx';
import { ODiem, OKhongHoc } from '../../ui/ODiem.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NhanKetPa, NhanKq } from '../../ui/Nhan.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { ErrorState, Skeleton, TargetText } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCase.tsx';
import { KetLuan, type RosterRow } from '../students/ClassRoster.tsx';
import { OChon, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { OPhuHuynh } from '../students/HocVienTheoVai.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import type { CaseDetail } from '../cases/CasePanel.tsx';
import {
  CASE_CATEGORY_LABEL, INTERVENTION_KIND_LABEL, OUTCOME_TONE, chipSosTuKetQua, dangChay, dongTieuChi, duongDotTest, duongHoSoHocVien, ketQuaGanNhat,
  lyDoChuaDu, nhanThang, outcomeLabelFor, soKyVong, tuanLich, tvvChinhCuaLop, type DinhNghiaCot, type EntrySkill, type KetQuaVao, type LichThi, type NguCanhDs,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Một dòng `GET /cases?classId=` (MappedCase) — phần bảng lớp đọc. */
type CaseLop = {
  id: number; studentId: number | null; status: string; sosLevel: number | null; title: string; category: string | null; categoryLabel: string | null;
  ownerName: string | null; detectedAt: string; interventionCount: number;
};
type Hang = RosterRow & { lichThi?: LichThi; standing?: KetQuaVao | null; next?: (RosterRow['next'] & { weekStart?: string | null }) | null };
type Moc = RosterRow['history'][number] & { writing?: number | null; expectation?: number | null; khongHoc?: string[]; khongDuBoMon?: boolean };
type Loc = 'tat-ca' | 'sos' | 'thieu';
type KyO = 'l' | 'r' | 'w' | 'w1' | 'w2' | 's' | 'ovr';
/** U03: năm ô kỹ năng của vùng mở rộng (W tách W1 · W2). */
type Kn = 'l' | 'r' | 'w1' | 'w2' | 's';
const KN: Kn[] = ['l', 'r', 'w1', 'w2', 's'];
const BAND = { l: 'listening', r: 'reading', s: 'speaking', w1: 'writing1', w2: 'writing2' } as const;
const NHAN_KN: Record<Kn, string> = { l: 'L', r: 'R', w1: 'W1', w2: 'W2', s: 'S' };
/* Chip lọc — cùng dáng chip của `CongTacKhung` (kieu chip). */
const CHIP_CHON = 'font-semibold border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]';
const CHIP_THUONG = 'font-medium border-[color:var(--line-strong)] bg-transparent text-slate-400 hover:text-slate-100';
/* Mockup U03 `.khoi` / `.muc-h`: khối nền thẻ trong vùng mở rộng, tiêu đề 15/700 có vạch nhấn trái. */
export const KHOI = 'grid min-w-0 content-start [&>*]:min-w-0 gap-2.5 rounded-[10px] border bg-[color:var(--surface)] px-3.5 py-3 max-sm:px-2.5';
export const MUC_H = "m-0 flex items-center gap-2 text-[15px] font-bold text-slate-100 before:h-[18px] before:w-[3px] before:shrink-0 before:rounded-sm before:bg-[color:var(--accent)] before:content-['']";
const TAG = 'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-semibold text-dim [&_b]:font-bold [&_b]:text-slate-100';

/** Lượt hiện của em (P8 — lượt của TỪNG HV): lượt máy chủ kết luận (`standing`, cùng `standingFor` của Học viên & Lớp); chưa có → lượt mới nhất có điểm. */
const mocCua = (r: Hang): Moc | null => (r.history.find((h) => h.id === r.standing?.attemptId) ?? r.history[0] ?? null) as Moc | null;
/** Kết quả = kết luận máy chủ (`ketQuaGanNhat(standing)` — cùng hàm ô Kết quả gần nhất ở Học viên & Lớp), web không tự so điểm. */
const ketQua = (r: Hang): 'sos' | 'dat' | 'thieu' | 'khac' => {
  if (r.status !== 'active' || r.kckDuoi || (!r.standing && r.cycle?.khongCamKet)) return 'khac';
  const k = ketQuaGanNhat(r.standing ?? null);
  return k.sos ? 'sos' : k.dat ? 'dat' : 'thieu';
};
/** Case đang mở của một kỹ năng (Case Writing cũ chung hai bài → cả W1, W2). */
const caseKn = (ca: CaseLop[], k: Kn) => ca.filter((c) => c.category === BAND[k] || (c.category === 'writing' && (k === 'w1' || k === 'w2')));
/** Bấm ô W trên hàng → bài W thấp hơn (mockup U03 A1); bằng nhau → W2 (bài nặng hơn trong W). */
const knCuaO = (h: Moc | null, k: 'l' | 'r' | 'w' | 's'): Kn => {
  if (k !== 'w') return k;
  const [w1, w2] = [h?.bands?.writing1 ?? null, h?.bands?.writing2 ?? null];
  return w1 !== null && (w2 === null || w1 < w2) ? 'w1' : 'w2';
};

/*
 * U03 (audit 03/11, chủ SP duyệt): bỏ cột Case · PA (✗ ở ô điểm đã báo vấn đề) · cột cân đối — tên ~230, năm cột điểm cùng rộng, phần còn lại chia
 * Target · MT gần nhất · Kết quả · Ngày thi. GIỮ Target, cột Phụ huynh của TVV / CX (OV-10b) và ⋯ thao tác từng dòng (V4).
 */
const cotCua = (theoVai: boolean): DinhNghiaCot[] => [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: theoVai ? 210 : 230 },
  { key: 'target', nhan: 'Target', kieu: 'so', rong: 80 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'so', rong: 104 },
  { key: 'l', nhan: 'L', kieu: 'diem', rong: 76 }, { key: 'r', nhan: 'R', kieu: 'diem', rong: 76 },
  { key: 'w', nhan: 'W', goiY: 'W = (W1 + 2 × W2) / 3', kieu: 'diem', rong: 76 }, { key: 's', nhan: 'S', kieu: 'diem', rong: 76 },
  { key: 'ovr', nhan: 'Overall', kieu: 'diem', rong: 76 },
  /* Mockup `.bl td`: mọi ô căn giữa — Kết quả 17 %, Ngày thi 10 % bề rộng bảng. */
  { key: 'kq', nhan: t('Kết quả'), kieu: 'so', rong: 200 }, { key: 'thi', nhan: t('Ngày thi'), kieu: 'so', rong: 124 },
  ...(theoVai ? [{ key: 'ph', nhan: t('Phụ huynh'), kieu: 'chip' as const, rong: 170 }] : []),
  { key: 'nut', nhan: '', kieu: 'nut' },
];

/**
 * BẢNG HỌC VIÊN · LỚP FAST TRACK (mockup `thiet-ke/audit-0311/u03-ho-so-lop.html`, chủ SP duyệt 03/11): chip lọc Tất cả · SOS · Chưa đủ dữ liệu ·
 * Học viên · Target · MT gần nhất · L R W S Overall (W chỉ một số; MT nhập lịch sử hiện như MT — #860) · Kết quả · Ngày thi · ⋯.
 * Bấm tên em → MỞ RỘNG ngay dưới hàng (`MoRongEm`): Điểm theo lượt + 5 ô kỹ năng; bấm ô điểm trên hàng = mở em với kỹ năng đó chọn sẵn.
 * Rê / focus ô W · S → thẻ tiêu chí (`dongTieuChi`; ô chỉ có band không thẻ). "Xem chi tiết" → panel Case phải (`NganCase`); "Hồ sơ HV ›" đổi trang.
 * < 640 px: mỗi em một thẻ (lưới 5 ô L R W S Overall), chạm tên mở cùng vùng mở rộng cuối thẻ (`sauThe`).
 */
export function BangHoSoLop({ classId, maLop, quyen, onDoi, chon, onThemHocVien, cachXem, nutChon }: {
  classId: number; maLop: string; quyen: QuyenDong; onDoi: () => void; onThemHocVien?: () => void;
  /** V8-HSL: nút đoạn Cách xem (tab Học viên) đứng ĐẦU hàng công cụ của thẻ bảng; `nutChon` = "Chọn nhiều" (QL) cuối hàng. */
  cachXem?: ReactNode; nutChon?: ReactNode;
  /** PR-LUI-b: "Chọn nhiều học viên" (Quản lý) — bật thì ô chọn cạnh tên. */
  chon?: ChonNhieu;
}) {
  const { homNay } = useNgayNghiepVu();
  const roster = useApi<Hang[]>(`/classes/${classId}/roster`, [classId]);
  const cases = useApi<{ rows: CaseLop[] }>(`/cases?classId=${classId}`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong: false, quyen, maLop, onDone: () => { roster.reload(); onDoi(); } });
  const COT = cotCua(!!quyen.theoVai);
  /* Chip lọc nằm trên URL (`?loc=`) — sang hồ sơ em rồi Quay lại / F5 vẫn đúng lọc (luật Quay lại về đúng nguồn). */
  const [locUrl, setLoc] = useThamSoUrl('loc', 'tat-ca');
  const loc: Loc = locUrl === 'sos' || locUrl === 'thieu' ? locUrl : 'tat-ca';
  /* Em đang mở + kỹ năng đang chọn (null = chưa chọn kỹ năng nào). */
  const [mo, setMo] = useState<{ sid: number; kn: Kn | null } | null>(null);
  const [ngan2, setNgan2] = useState<{ caseId: number; hv: string; sid: number; kn: Kn } | null>(null);
  const dienThoai = useDienThoai();
  if (roster.error) return <ErrorState message={roster.error.message} hint={roster.error.hint} status={roster.error.status} onRetry={roster.reload} />;
  if (!roster.data) return <div className="card p-4"><Skeleton rows={6} /></div>;

  const caseCua = new Map<number, CaseLop[]>();
  for (const c of cases.data?.rows ?? []) if (c.studentId !== null && c.status !== 'done') caseCua.set(c.studentId, [...(caseCua.get(c.studentId) ?? []), c]);
  const tatCa = roster.data.filter((r) => !r.archived);
  const kq = new Map(tatCa.map((r) => [r.id, ketQua(r)]));
  const dem = { 'tat-ca': tatCa.length, sos: tatCa.filter((r) => kq.get(r.id) === 'sos').length, thieu: tatCa.filter((r) => kq.get(r.id) === 'thieu').length };
  const ds = tatCa.filter((r) => loc === 'tat-ca' || kq.get(r.id) === loc);
  const ngCanh: NguCanhDs = { loai: 'hoc-vien', ids: ds.map((s) => s.id), nhan: t('Lớp {lop}', { lop: maLop }) };
  /* HSL-GON (M3): TVV chính đã ghi ở đầu hồ sơ lớp (hàng GV) — dòng em chỉ ghi TVV khác TVV chính. */
  const tvvChinh = tvvChinhCuaLop(tatCa);
  const tvvRieng = (r: Hang) => !!r.tvv && r.tvv !== tvvChinh;
  const xong = () => { invalidate(`/cases?classId=${classId}`); cases.reload(); roster.reload(); onDoi(); };
  /* `moiVao` = vào lớp từ đầu tuần này → tuần của hôm nay. */
  const nhanPhu = (r: Hang) => <>{r.moiVao && <span className="whitespace-nowrap text-[12px] text-faint">{t('mới vào')} {tuanLich(homNay, homNay)}</span>}<MissingBadge items={r.missing} gon /><CanhBaoYThuc cb={r.canhBaoYThuc} /></>;
  /* Bấm tên: mở / đóng; mở thì chọn sẵn kỹ năng đầu tiên có Case (đỡ một bấm), không có Case → chưa chọn. Bấm ô điểm: mở với kỹ năng đó. */
  const moTen = (r: Hang) => setMo(mo?.sid === r.id ? null : { sid: r.id, kn: KN.find((k) => caseKn(caseCua.get(r.id) ?? [], k).length > 0) ?? null });
  const moO = (r: Hang, kn: Kn) => setMo(mo?.sid === r.id && mo.kn === kn ? null : { sid: r.id, kn });

  const oDiem = (r: Hang, h: Moc | null, k: KyO) => {
    if (!h) return <span className="text-faint">—</span>;
    /* P8 (mockup k6): môn em không học → "Không học"; Overall thiếu bộ môn → "Không đủ bộ môn" (khác "—" chưa điểm). */
    const kh = h.khongHoc ?? [];
    if (k === 'w' ? kh.includes('writing1') && kh.includes('writing2') : k !== 'ovr' && kh.includes(BAND[k])) return <OKhongHoc nhan={k.toUpperCase()} />;
    if (k === 'ovr' && h.overall == null && h.khongDuBoMon && h.scoredRequired === h.requiredCount) return <NhanKq kq="thieu">{t('Không đủ bộ môn')}</NhanKq>;
    const v = k === 'ovr' ? h.overall : k === 'w' ? h.writing ?? null : h.bands?.[BAND[k]] ?? null;
    /* #860: MT nhập lịch sử là kết quả hiện tại — tô ✓ / ✗ như MT thường (chủ SP 03/11). */
    const o = <ODiem kieu="gon" so={v === null ? null : fmtBand(v)} kq={soKyVong(v, h.expectation ?? null)} nhan={k === 'ovr' ? 'Overall' : k.toUpperCase()} kyVong={h.expectation != null ? fmtBand(h.expectation) : undefined} />;
    if (k === 'ovr' || k === 'w1' || k === 'w2' || v === null) return o;
    const kn = knCuaO(h, k);
    const chon = mo?.sid === r.id && (k === 'w' ? mo.kn === 'w1' || mo.kn === 'w2' : mo.kn === k);
    const tc = k === 'w' ? (['writing1', 'writing2'] as const) : k === 's' ? (['speaking'] as const) : [];
    const dongs = tc.map((s) => ({ s, d: dongTieuChi(s, h.tieuChi?.[s]), band: h.bands?.[s] ?? null })).filter((x) => x.d);
    return (
      <TheTieuChi dong={dongs.map((x) => ({ nhan: x.s === 'writing1' ? 'W1' : x.s === 'writing2' ? 'W2' : 'S', d: x.d!, band: x.band }))}>
        <button type="button" aria-expanded={chon} aria-label={t('{kn} của {ten} — mở tóm tắt', { kn: k.toUpperCase(), ten: r.fullName })}
          className={`relative appearance-none rounded-md border-0 px-1.5 py-0.5 max-sm:p-0 after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] sm:after:hidden ${chon ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_2px_var(--accent)]' : 'bg-transparent hover:bg-[color:var(--accent-soft)]'}`}
          onClick={() => moO(r, kn)}>{o}</button>
      </TheTieuChi>
    );
  };
  const oCua = (r: Hang, c: DinhNghiaCot): ReactNode => {
    const h = mocCua(r);
    switch (c.key) {
      case 'ten': return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {chon?.bat && <OChon chon={chon} id={r.id} ten={r.fullName} />}
          <span className="flex min-w-0 flex-col items-start">
            <TenEm s={r} mo={mo?.sid === r.id} onMo={() => moTen(r)} />
            {/* Dòng dưới tên (mockup v10 `.chip-phu`): TVV (chữ mờ) · mới vào (chữ) · thiếu thông tin · Ý thức — chỉ việc cần làm có màu. */}
            <ChipXetLaiDong sid={r.id} />{(tvvRieng(r) || r.moiVao || r.missing.length > 0 || r.canhBaoYThuc) && <span className="mt-0.5 flex flex-wrap items-center gap-1.5">{tvvRieng(r) && <span className="tvv">TVV {r.tvv}</span>}{nhanPhu(r)}</span>}
          </span>
        </span>
      );
      case 'target': return <TargetText band={r.cycle?.target} kck={r.cycle?.khongCamKet} />;
      case 'ph': return r.lienHe ? <OPhuHuynh l={r.lienHe} /> : <span className="text-faint">—</span>;
      case 'nut': return <MenuDong muc={tt.mucCua({ id: r.id, ten: r.fullName, dangHoc: r.status === 'active', nhapDiem: nhapDiemCua(classId, false, r.timeline as any), status: r.status, xuLyYThuc: !!r.canhBaoYThuc })} />;
      case 'mt': return h ? <Link to={duongHoSoHocVien(r.id, { dot: h.id })} className="text-slate-100 no-underline hover:underline">{dich(h.label)}</Link> : <span className="text-faint">—</span>;
      case 'l': case 'r': case 'w': case 's': case 'ovr': return oDiem(r, h, c.key);
      case 'kq': return <OKetQua r={r} h={h} kq={kq.get(r.id)!} />;
      case 'thi': return <OLichThi l={r.lichThi} homNay={homNay} the={dienThoai} />;
      default: return null;
    }
  };
  /* HSL-GON (chủ SP 05/11): ô điểm hồ sơ lớp chỉ còn điểm ✓ / ✗ hoặc "–" — không dòng phụ "vắng W3 SEP" / dời dưới ô (ghi chú lịch chỉ ở màn Test). */
  /*
   * THẺ EM 375 (mockup U03 B): đầu thẻ tên (+ ô chọn) · Kết quả · ⋯ (44 px) · nhãn phụ · lưới điểm 5 CỘT CỐ ĐỊNH L R W S Overall trên nền phụ ·
   * chân Target · MT · lịch thi (· Phụ huynh). Chạm tên → vùng mở rộng cuối thẻ (cùng `MoRongEm`).
   */
  const cotTheo = new Map(COT.map((c) => [c.key, c]));
  const o = (r: Hang, k: string) => oCua(r, cotTheo.get(k)!);
  const theEm = (r: Hang): ReactNode => {
    const h = mocCua(r);
    const coNhan = r.moiVao || r.missing.length > 0 || !!r.canhBaoYThuc;
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <span className="inline-flex min-w-0 items-center gap-2.5 text-[15px]">{chon?.bat && <OChon chon={chon} id={r.id} ten={r.fullName} />}
            <span className="flex min-w-0 flex-col items-start"><TenEm s={r} mo={mo?.sid === r.id} onMo={() => moTen(r)} />{tvvRieng(r) && <span className="tvv">TVV {r.tvv}</span>}</span></span>
          {o(r, 'kq')}
          <MenuDong muc={tt.mucCua({ id: r.id, ten: r.fullName, dangHoc: r.status === 'active', nhapDiem: nhapDiemCua(classId, false, r.timeline as any), status: r.status, xuLyYThuc: !!r.canhBaoYThuc })}
            lopNut="btn h-11 w-11 shrink-0 !px-0 text-[13px] font-bold tracking-wider" />
        </div>
        <ChipXetLaiDong sid={r.id} />
        {coNhan && <span className="flex flex-wrap items-center gap-1.5">{nhanPhu(r)}</span>}
        <dl className="m-0 grid grid-cols-5 rounded-lg bg-[color:var(--surface-2)] px-1 py-1.5">
          {(['l', 'r', 'w', 's', 'ovr'] as const).map((k) => (
            <div key={k} className="flex min-w-0 flex-col items-center">
              <dt className="text-[12px] font-semibold text-slate-500">{k === 'ovr' ? 'Overall' : k.toUpperCase()}</dt>
              <dd className="m-0 text-[15px]">{oDiem(r, h, k)}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-400">
          <span>Target <b className="font-semibold tabular-nums text-slate-100">{o(r, 'target')}</b></span><span aria-hidden>·</span>
          <b className="font-semibold text-slate-100">{o(r, 'mt')}</b>
          {o(r, 'thi')}{quyen.theoVai && o(r, 'ph')}
        </div>
      </div>
    );
  };
  const lopHang = (r: Hang) => `${r.status !== 'active' ? 'row-muted' : ''} ${chon?.chon.has(r.id) ? 'bg-[color:var(--accent-soft)]' : ''}`;
  const moRong = (r: Hang) => (
    <MoRongEm r={r} kn={mo?.kn ?? null} ca={caseCua.get(r.id) ?? []} ds={ngCanh} classId={classId} coTheBaoCase={quyen.coTheBaoCase}
      onKn={(kn) => setMo({ sid: r.id, kn })} onChiTiet={(caseId, kn) => setNgan2({ caseId, hv: r.fullName, sid: r.id, kn })} onThemCase={() => tt.moCase(r.id, r.fullName)} />
  );
  const hangCua = (r: Hang) => (
    <Fragment key={r.id}>
      <tr className={`${mo?.sid === r.id ? 'dang-mo' : ''} ${lopHang(r)}`}>
        {COT.map((c) => {
          /* V8-HSL: hàng 48 px — đệm dọc 8 (dòng phụ dưới ô điểm đã bỏ — HSL-GON). */
          return <OBang key={c.key} c={c} className={`!align-middle !py-2 !h-12 ${c.key === 'ten' ? '!overflow-visible ![text-overflow:clip]' : ''}`}>{oCua(r, c)}</OBang>;
        })}
      </tr>
      {mo?.sid === r.id && (
        <tr id={`mo-${r.id}`} className="mo-em">
          <td colSpan={COT.length} className="!h-auto !px-4 !pb-3.5 !pt-0 [background:var(--surface-2)]">{moRong(r)}</td>
        </tr>
      )}
    </Fragment>
  );

  return (
    <section className="card overflow-clip">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
        {cachXem}
        {cachXem && <span aria-hidden className="h-6 w-px bg-[color:var(--line-strong)] max-sm:hidden" />}
        {(['tat-ca', 'sos', 'thieu'] as const).map((k) => (
          <ChipLoc key={k} chon={loc === k} so={dem[k]} onBam={() => { setLoc(k); setMo(null); }}>{k === 'tat-ca' ? t('Tất cả') : k === 'sos' ? 'SOS' : t('Chưa đủ dữ liệu')}</ChipLoc>
        ))}
        {nutChon && <span className="ml-auto max-sm:ml-0">{nutChon}</span>}
      </div>
      {/* V8-HSL: cột chia đều như mockup (`deu`) — cột tên không nuốt hết phần dư; ô căn giữa dọc (tên ngang hàng điểm). */}
      <Bang deu ten={t('Học viên lớp {lop}', { lop: maLop })} cot={COT} hang={ds} khoa={(r) => r.id}
        oCua={oCua} hangRieng={hangCua} theRieng={theEm} lopHang={lopHang} dangMo={(r) => mo?.sid === r.id}
        sauThe={(r) => mo?.sid === r.id && <div id={`mo-${r.id}`} className="mt-2">{moRong(r)}</div>}
        khung={false} dinh rong={{ tieuDe: loc === 'tat-ca' ? t('Lớp chưa có học viên') : t('Không có học viên nào'), nut: loc === 'tat-ca'
          ? (onThemHocVien ? <button type="button" className="btn btn-sm" onClick={onThemHocVien}>{t('Thêm học viên')}</button> : undefined)
          /* V8-HSL (mockup E): lọc rỗng → một bấm về Tất cả. */
          : <button type="button" className="btn btn-sm" onClick={() => setLoc('tat-ca')}>{t('Tất cả')} <b className="tabular-nums">{dem['tat-ca']}</b></button> }} />
      {tt.panels}
      {ngan2 && (
        <NganCase caseId={ngan2.caseId} hocVien={ngan2.hv} lop={maLop} onClose={() => setNgan2(null)} onChanged={xong}
          kyNangTiep={(() => {
            /* U03 A2 "Lưu · kỹ năng tiếp ›": Case đang mở của kỹ năng kế (L R W1 W2 S) cùng em — tóm tắt dưới hàng đi theo. */
            const ca = caseCua.get(ngan2.sid) ?? [];
            const k = KN.slice(KN.indexOf(ngan2.kn) + 1).find((x) => caseKn(ca, x).some((c) => c.id !== ngan2.caseId));
            const c = k ? caseKn(ca, k).find((x) => x.id !== ngan2.caseId) : null;
            return k && c ? { ten: NHAN_KN[k], di: () => { setNgan2({ ...ngan2, caseId: c.id, kn: k }); setMo({ sid: ngan2.sid, kn: k }); } } : null;
          })()} />
      )}
    </section>
  );
}

/**
 * THẺ TIÊU CHÍ khi rê / focus ô W · S (mockup U03 `.the-tc`): mỗi bài một dòng "S FC 7 · LR 6.5 · GRA 6 · P 6.5 → 6.5". Vẽ qua portal, vị trí
 * cố định dưới ô — khung cuộn của bảng không cắt. Không dòng nào (ô chỉ có band) → chỉ vẽ ô, không thẻ.
 */
function TheTieuChi({ dong, children }: { dong: { nhan: string; d: [string, string][]; band: number | null }[]; children: ReactNode }) {
  const [cho, setCho] = useState<CSSProperties | null>(null);
  if (!dong.length) return <>{children}</>;
  const hien = (e: { currentTarget: HTMLElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCho({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left + r.width / 2 - 150, window.innerWidth - 308)) });
  };
  return (
    <span className="inline-block" onMouseEnter={hien} onMouseLeave={() => setCho(null)} onFocus={hien} onBlur={() => setCho(null)}>
      {children}
      {cho && createPortal(
        <span role="tooltip" style={cho}
          className="pointer-events-none fixed z-50 grid gap-1 whitespace-nowrap rounded-lg border bg-[color:var(--surface)] px-3 py-2 text-left text-[13px] font-medium tabular-nums text-dim shadow-xl [border-color:var(--line-strong)]">
          {dong.map((x) => <span key={x.nhan}><DongTieuChi nhan={x.nhan} d={x.d} band={x.band} /></span>)}
        </span>,
        document.body,
      )}
    </span>
  );
}
function DongTieuChi({ nhan, d, band }: { nhan: string; d: [string, string][]; band: number | null }) {
  return (
    <>
      <b className="mr-1 font-bold text-slate-100">{nhan}</b>
      {d.map(([k, v], i) => <Fragment key={k}>{i > 0 && ' · '}{k} <b className="font-bold text-slate-100">{v}</b></Fragment>)}
      {band !== null && <> → <b className="font-bold text-slate-100">{fmtBand(band)}</b></>}
    </>
  );
}

/**
 * VÙNG MỞ RỘNG MỘT EM (mockup U03 A1 / B1): trái "Điểm theo lượt" (lượt mới nhất đậm + 2 lượt trước; thiếu thì "Đầu vào") cột L R W1 W2 S OVR Kỳ vọng
 * + "Lượt tới …" · phải 5 ô kỹ năng (lượt trước → mới nhất · Case) rồi tóm tắt kỹ năng đang chọn. Dữ liệu điểm có sẵn trong `/roster`; Case chi tiết
 * chỉ đọc khi chọn kỹ năng có Case (`TomTatKn`, một `/cases/:id`).
 */
function MoRongEm({ r, kn, ca, ds, classId, coTheBaoCase, onKn, onChiTiet, onThemCase }: {
  r: Hang; kn: Kn | null; ca: CaseLop[]; ds: NguCanhDs; classId: number; coTheBaoCase: boolean;
  onKn: (k: Kn) => void; onChiTiet: (caseId: number, kn: Kn) => void; onThemCase: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const ls = r.history as Moc[];
  const dv = ls.length < 3 ? r.dauVao ?? null : null;
  const diemDv = (k: Kn) => dv ? (k === 'w1' || k === 'w2' ? dv.writing : dv[BAND[k] as 'listening' | 'reading' | 'speaking']) : null;
  const o = (v: number | null | undefined, kv: number | null | undefined) => <ODiem kieu="gon" so={v == null ? null : fmtBand(v)} kq={soKyVong(v ?? null, kv ?? null)} />;
  const toi = r.next?.kindLabel ? `${dich(r.next.kindLabel)}${r.next.weekStart ? ` · ${tuanLich(r.next.weekStart, homNay)}` : ''}` : null;
  const dienThoai = useDienThoai();
  const cotLuot: DinhNghiaCot[] = [
    { key: 'luot', nhan: t('Lượt'), kieu: 'ten', rong: dienThoai ? 56 : 76 },
    ...(dienThoai ? (['l', 'r', 'w', 's'] as const).map((k) => ({ key: k, nhan: k.toUpperCase(), kieu: 'diem' as const, rong: 48 }))
      : KN.map((k) => ({ key: k, nhan: NHAN_KN[k], kieu: 'diem' as const, rong: 56 }))),
    { key: 'ovr', nhan: 'OVR', kieu: 'diem', rong: dienThoai ? 48 : 56 },
    ...(dienThoai ? [] : [{ key: 'kv', nhan: t('Kỳ vọng'), kieu: 'so' as const, rong: 64 }]),
  ];
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className={KHOI} aria-label={t('Điểm theo lượt')}>
        <h3 className={MUC_H}>{t('Điểm theo lượt')}</h3>
        {ls.length || dv ? (
          /* `Bang chat` (BANG-3: một bảng cho cả hệ) — hàng tự vẽ để dòng Đầu vào gộp ô W1 · W2. 375 (mockup B1): W gộp một cột, không Kỳ vọng. */
          <div className="[&_tbody_tr:last-child>td]:!border-b-0 [&_th]:!bg-transparent [&_th]:!text-xs [&_th]:!text-faint max-sm:[&_td]:!px-1 max-sm:[&_th]:!px-1"><Bang chat deu khung={false} the375={false} ten={t('Điểm theo lượt')} cot={cotLuot} hang={[...ls.map((h) => ({ h, dv: null })), ...(dv ? [{ h: null, dv }] : [])]}
            khoa={(x) => x.h?.id ?? 'dv'} hangRieng={(x) => {
              const c = new Map(cotLuot.map((k) => [k.key, k]));
              if (!x.h) return (
                <tr>
                  <OBang c={c.get('luot')!}>{t('Đầu vào')}</OBang>
                  <OBang c={c.get('l')!}>{fmtBand(dv!.listening)}</OBang><OBang c={c.get('r')!}>{fmtBand(dv!.reading)}</OBang>
                  {dienThoai ? <OBang c={c.get('w')!}>{fmtBand(dv!.writing)}</OBang> : <OBang c={c.get('w1')!} colSpan={2}>{fmtBand(dv!.writing)}</OBang>}
                  <OBang c={c.get('s')!}>{fmtBand(dv!.speaking)}</OBang><OBang c={c.get('ovr')!}>{fmtBand(dv!.overall)}</OBang>
                  {!dienThoai && <OBang c={c.get('kv')!}>–</OBang>}
                </tr>
              );
              const h = x.h;
              return (
                <tr className={h.id === ls[0]?.id ? 'font-bold' : ''}>
                  {cotLuot.map((k) => {
                    if (k.key === 'luot') return (
                      <OBang key={k.key} c={k}>
                        <Link className={`link whitespace-nowrap ${h.id === ls[0]?.id ? 'font-bold' : 'font-normal'}`} to={duongDotTest({ id: h.id, kind: h.kind, classId })}>{dich(h.label)}{dienThoai ? '' : ' ›'}</Link>
                        {/* Mã tuần như mọi màn (`W2 SEP`) — bỏ năm của mã kỳ. */}
                        {h.periodCode && !dienThoai && <small className="block whitespace-nowrap text-xs font-medium text-faint">{h.periodCode.replace(/ \d{4}$/, '')}</small>}
                      </OBang>
                    );
                    if (k.key === 'kv') return <OBang key={k.key} c={k}>{h.expectation != null ? fmtBand(h.expectation) : '–'}</OBang>;
                    if (k.key === 'ovr' || k.key === 'w') return <OBang key={k.key} c={k}>{o(k.key === 'ovr' ? h.overall : h.writing, h.expectation)}</OBang>;
                    const s = BAND[k.key as Kn] as EntrySkill;
                    const d = dongTieuChi(s, h.tieuChi?.[s]);
                    const v = h.bands?.[s] ?? null;
                    return <OBang key={k.key} c={k}>{d ? <TheTieuChi dong={[{ nhan: NHAN_KN[k.key as Kn], d, band: v }]}><span tabIndex={0} className="rounded px-0.5">{o(v, h.expectation)}</span></TheTieuChi> : o(v, h.expectation)}</OBang>;
                  })}
                </tr>
              );
            }} /></div>
        ) : <p className="m-0 text-sm text-dim">{t('Chưa có điểm.')}</p>}
        {toi && <span><span className={TAG} style={{ borderColor: 'var(--line-strong)' }}>{t('Lượt tới')} <b>{toi}</b></span></span>}
      </section>
      <section className={KHOI} aria-label={t('Kỹ năng')}>
        <h3 className={MUC_H}>{t('Kỹ năng')}</h3>
        <div className="grid grid-cols-5 gap-2 max-sm:gap-1">
          {KN.map((k) => {
            const s = BAND[k];
            const [moi, truoc] = [ls[0]?.bands?.[s] ?? null, ls[1] ? ls[1].bands?.[s] ?? null : diemDv(k)];
            const coCase = caseKn(ca, k);
            return (
              <button key={k} type="button" aria-pressed={kn === k} onClick={() => onKn(k)}
                className={`grid gap-1 rounded-lg border px-2.5 py-2 text-left max-sm:justify-items-center max-sm:px-1 max-sm:py-1.5 ${kn === k ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)] [border-color:var(--accent)]' : 'bg-[color:var(--surface)] [border-color:var(--line)] hover:[border-color:var(--accent)]'}`}>
                <span className="text-[13px] font-bold text-slate-100">{NHAN_KN[k]}</span>
                <span className="text-[15px] font-bold tabular-nums">{truoc !== null && moi !== null && <span className="max-sm:hidden">{fmtBand(truoc)} → </span>}{o(moi, ls[0]?.expectation)}</span>
                <span className="text-xs text-dim max-sm:hidden">{coCase.length ? (coCase.some((c) => c.interventionCount > 0) ? t('Có Case · có PA') : t('Có Case')) : t('Không Case')}</span>
              </button>
            );
          })}
        </div>
        {kn && <TomTatKn r={r} kn={kn} ca={caseKn(ca, kn)[0] ?? null} ds={ds} diemDv={diemDv(kn)} coTheBaoCase={coTheBaoCase} onChiTiet={onChiTiet} onThemCase={onThemCase} />}
      </section>
    </div>
  );
}

/**
 * TÓM TẮT MỘT KỸ NĂNG (mockup U03 A1 / C1 / C4): tên kỹ năng · phụ trách · "Hồ sơ HV ›" · "Xem chi tiết" (panel Case) hoặc "+ Case" (kỹ năng không Case,
 * theo quyền) · dòng tiêu chí lượt mới nhất (W / S có tiêu chí) · 3 cột: Điểm (chuỗi lượt, kỳ vọng) · Case · PA · Kết quả PA (nhãn + tuần, chưa có "–").
 * Hạn ghi tiếp không ghi ở đây — đã ở Việc của tôi / Công việc (chủ SP 03/11 vòng 2). Lỗi tải chỉ trong vùng này + Thử lại.
 */
function TomTatKn({ r, kn, ca, ds, diemDv, coTheBaoCase, onChiTiet, onThemCase }: {
  r: Hang; kn: Kn; ca: CaseLop | null; ds: NguCanhDs; diemDv: number | null; coTheBaoCase: boolean; onChiTiet: (caseId: number, kn: Kn) => void; onThemCase: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const ct = useApi<CaseDetail>(ca ? `/cases/${ca.id}` : null, [ca?.id]);
  const s = BAND[kn] as EntrySkill;
  const ls = [...(r.history as Moc[])].reverse();   // cũ → mới
  const moi = ls[ls.length - 1];
  const tc = moi ? dongTieuChi(s, moi.tieuChi?.[s]) : null;
  const pa = (ct.data?.interventions ?? []).filter((x: any) => dangChay(x) && !(x.laPaDoi && (x.approvalState === 'pending' || x.approvalState === 'declined')));
  const kqPa = [...(ct.data?.followups ?? [])].filter((f: any) => f.outcome).sort((a: any, b: any) => (b.observedOn ?? '').localeCompare(a.observedOn ?? ''))[0];
  const NH = 'text-xs font-medium text-faint';
  const NUT = 'btn h-[30px] px-2.5 text-[13px] max-sm:h-11 max-sm:flex-1';
  return (
    <div className="grid gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h4 className="m-0 text-[15px] font-bold text-slate-100">{dich(CASE_CATEGORY_LABEL[s as keyof typeof CASE_CATEGORY_LABEL] ?? s)}</h4>
        {ca?.ownerName && <span className={TAG} style={{ borderColor: 'var(--line-strong)' }}>{t('phụ trách')} <b>{ca.ownerName}</b></span>}
        <span className="ml-auto flex gap-2 max-sm:ml-0 max-sm:w-full">
          <Link className={`${NUT} no-underline`} to={duongHoSoHocVien(r.id)} state={{ ds }}>{t('Hồ sơ HV ›')}</Link>
          {ca ? <button type="button" className={`${NUT} btn-primary`} onClick={() => onChiTiet(ca.id, kn)}>{t('Xem chi tiết')}</button>
            : coTheBaoCase && <button type="button" className={NUT} onClick={onThemCase}>+ Case</button>}
        </span>
      </div>
      {tc && moi && (
        /* Mockup `.tc`: nhãn mờ / số đậm trắng, các tiêu chí cách 14 px, không dấu "·". */
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 rounded-lg bg-[color:var(--surface-2)] px-3 py-2 text-sm font-medium tabular-nums text-dim [&_b]:font-bold [&_b]:text-slate-100">
          <span className="mr-0.5 text-[13px] font-bold text-slate-100">{dich(moi.label)}</span>
          {tc.map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
          {moi.bands?.[s] != null && <span>→ <b>{fmtBand(moi.bands[s])}</b></span>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] max-sm:gap-2.5">
        <div className="grid content-start gap-1">
          <span className={NH}>{t('Điểm')}</span>
          <div className="flex flex-nowrap items-center gap-1">
            {[...(diemDv !== null && ls.length < 3 ? [{ k: 'dv', nhan: t('Đầu vào'), v: diemDv, kv: null as number | null }] : []),
              ...ls.map((h) => ({ k: String(h.id), nhan: dich(h.label), v: h.bands?.[s] ?? null, kv: h.expectation ?? null }))].map((m, i, a) => (
              <Fragment key={m.k}>
                {i > 0 && <span aria-hidden className="text-[13px] text-faint">→</span>}
                <span className={`grid min-w-[52px] justify-items-center gap-px rounded-lg border px-2 py-1 ${i === a.length - 1 ? 'bg-[color:var(--surface-2)] [border-color:var(--line-strong)]' : '[border-color:var(--line)]'}`}>
                  <span className="whitespace-nowrap text-xs font-medium text-faint">{m.nhan}</span>
                  <b className="text-base font-bold tabular-nums">{m.k === 'dv' ? fmtBand(m.v) : <ODiem kieu="gon" so={m.v == null ? null : fmtBand(m.v)} kq={soKyVong(m.v, m.kv)} />}</b>
                </span>
              </Fragment>
            ))}
          </div>
          {moi?.expectation != null && <span className="text-[13px] text-dim">{t('kỳ vọng {x}', { x: fmtBand(moi.expectation) })}</span>}
        </div>
        <div className="grid content-start gap-1">
          <span className={NH}>{t('Case · PA')}</span>
          {!ca ? <span className="text-[15px] font-semibold text-dim">{t('Không có Case')}</span> : (
            <>
              {/* Mockup `.ba-cot`: giá trị = nguyên nhân chính (600 15 trắng); chưa tải / không có → tên Case. */}
              <span className="text-[15px] font-semibold text-slate-100">{dich(ct.data?.issues.find((i: any) => i.role === 'primary')?.label ?? ca.title).replace(' - ', ' · ')}</span>
              <span className="text-[13px] text-dim">{t('Case mở {tuan}', { tuan: tuanLich(ca.detectedAt, homNay) })}</span>
              {ct.error ? null : !ct.data ? <Skeleton rows={1} /> : pa.length ? pa.slice(0, 2).map((iv: any) => (
                <Fragment key={iv.id}>
                  <span className="mt-1 text-[15px] font-semibold text-slate-100">{dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind)}</span>
                  <span className="text-[13px] text-dim">{iv.awaitingConfirmation ? t('Chờ xác nhận') : iv.status === 'started' ? t('đang chạy') : t('chưa bắt đầu')}</span>
                </Fragment>
              )) : <span className="mt-1 text-[13px] text-dim">{t('Chưa có PA')}</span>}
            </>
          )}
        </div>
        <div className="grid content-start gap-1">
          <span className={NH}>{t('Kết quả PA')}</span>
          {kqPa ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <NhanKetPa tone={OUTCOME_TONE[kqPa.outcome] ?? 'muted'}>{dich(outcomeLabelFor(kqPa.outcome))}</NhanKetPa>
              {kqPa.observedOn && <span className="text-[13px] text-dim">{tuanLich(kqPa.observedOn, homNay)}</span>}
            </span>
          ) : <span className="text-[13px] text-dim">–</span>}
        </div>
      </div>
      {ct.error && (
        <div role="alert" className="flex flex-wrap items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm bg-bad-bg border-bad-line">
          <span aria-hidden className="text-bad">⚠</span><span><b className="text-bad">{t('Chưa tải được chi tiết Case.')}</b> {t('Bảng vẫn dùng được.')}</span>
          <button type="button" className="btn btn-sm ml-auto" onClick={ct.reload}>{t('Thử lại')}</button>
        </div>
      )}
    </div>
  );
}

/** Chip lọc của thẻ bảng hồ sơ lớp (FT · lớp thường): "Tất cả 18" — số đậm. */
export function ChipLoc({ chon, so, onBam, children }: { chon: boolean; so: number; onBam: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={chon} onClick={onBam}
      className={`relative h-8 whitespace-nowrap rounded-full border px-3 text-[13px] max-sm:h-10 max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:-inset-y-0.5 max-sm:after:content-[''] ${chon ? CHIP_CHON : CHIP_THUONG}`}>
      {children} <span className="font-bold tabular-nums">{so}</span>
    </button>
  );
}

/** U03: bấm tên em = mở / đóng vùng mở rộng ngay dưới hàng (không đổi trang); "Hồ sơ HV ›" trong vùng mở rộng mang `state.ds` (Trước / Sau). */
export function TenEm({ s, mo, onMo }: { s: { id: number; fullName: string }; mo: boolean; onMo: () => void }) {
  return (
    <button type="button" aria-expanded={mo} aria-controls={`mo-${s.id}`} onClick={onMo}
      className={`max-w-full truncate border-0 bg-transparent p-0 text-left font-semibold text-slate-100 ${mo ? '' : 'hover:underline'}`}>{s.fullName}{mo && <span aria-hidden> ▾</span>}</button>
  );
}

/**
 * Kết quả lượt của em: SOS (thay "Chưa đạt" — không hai badge) · Đạt · Chưa đủ dữ liệu; em KCK / đã kết thúc giữ kết luận cũ (`KetLuan`).
 * BANG-EM-GON: chip SOS NHỎ, không "· R, W" (cột điểm đã ✗ đúng kỹ năng; hộp Vì sao SOS vẫn đếm kỹ năng); "✓ Đạt" / "– Chưa đủ dữ liệu" là chữ.
 */
function OKetQua({ r, h, kq }: { r: Hang; h: Moc | null; kq: ReturnType<typeof ketQua> }) {
  /* U03: bỏ cột Case · PA → chip SOS ghi lại kỹ năng hụt ("SOS 3 · L, W, S", mockup). */
  if (kq === 'sos') return <ChipSos {...chipSosTuKetQua(r.standing ?? null)!} ten={r.fullName} />;
  if (kq === 'dat') return <span className="whitespace-nowrap text-[13px] text-dim"><span aria-hidden>{'✓ '}</span>{t('Đạt')}</span>;
  if (kq === 'thieu') {
    /* Đ4: lý do ngắn ở tooltip + tên đọc màn (không thêm chữ trên màn — P1). */
    const ly = lyDoChuaDu(r.standing ?? null);
    return <span className="whitespace-nowrap text-[13px] text-faint" title={ly ?? undefined}><span aria-hidden>{'– '}</span>{t('Chưa đủ dữ liệu')}{ly && <span className="sr-only"> · {ly}</span>}</span>;
  }
  if (r.kckDuoi) return <ChipDuoiKck />;
  return <KetLuan row={r} cotMocTrong={!h} />;
}

/** Ngày thi — chữ 13 px (BANG-EM-GON, không chip): "Thi **dd/mm**" (đã chốt) · Đã thi · "Dự kiến **MM/YYYY**" (P5); chưa có lịch → "—" nhạt (Đ6). */
function OLichThi({ l, homNay, the }: { l?: LichThi; homNay: string; the?: boolean }) {
  /* Thẻ 375: không vẽ "—" lẻ cạnh chip Kết quả — chỉ còn tên đọc màn. */
  if ((!l || l.trangThai === 'chua-co') && the) return <span className="sr-only">{t('Chưa có lịch')}</span>;
  if (!l || l.trangThai === 'chua-co') return <span className="text-slate-500" title={t('Chưa có lịch')}><span aria-hidden>—</span><span className="sr-only">{t('Chưa có lịch')}</span></span>;
  /* U03 (mockup `.lich`): chip nhạt màu "đang làm" — Thi dd/mm · Dự kiến MM/YYYY; "Đã thi" chữ thường. */
  const CHU = 'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-sm bg-[rgb(var(--doing-bg-rgb))] px-[7px] text-xs font-semibold text-doing [&_b]:font-semibold [&_b]:tabular-nums';
  if (l.trangThai === 'da-chot-ngay' && l.ngay) return <span className={CHU}>{t('Thi')} <b>{`${l.ngay.slice(8, 10)}/${l.ngay.slice(5, 7)}`}</b></span>;
  if (l.trangThai === 'da-thi') return <span className="whitespace-nowrap text-[13px] text-dim">{t('Đã thi')}</span>;
  return <span className={CHU} title={l.tuan ? tuanLich(l.tuan, homNay) : undefined}>{t('Dự kiến')} <b>{nhanThang(l.thang!)}</b></span>;
}

