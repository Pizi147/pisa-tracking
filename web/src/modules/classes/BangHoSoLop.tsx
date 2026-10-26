import { ChipXetLaiDong } from './PanelXetLai.tsx';
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { fmtBand, skillShort } from '../../lib/format.ts';
import { Bang, OBang } from '../../ui/Bang.tsx';
import { ODiem, OKhongHoc } from '../../ui/ODiem.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Nhan, NhanKq, NhanLich } from '../../ui/Nhan.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { ErrorState, Skeleton, TargetText } from '../../ui/ui.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCase.tsx';
import { KetLuan, type RosterRow } from '../students/ClassRoster.tsx';
import { OChon, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { OPhuHuynh } from '../students/HocVienTheoVai.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { MoiVao } from './DaiChuyenLop.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import type { CaseDetail, ViewCase } from '../cases/CasePanel.tsx';
import {
  chipSosTuKetQua, chuDoiVang, ketQuaGanNhat, lyDoChuaDu, type KetQuaVao, duongDotTest, duongHoSoHocVien, nhanThangDuKien, outcomeLabelFor, soKyVong, tieuChiCua, tuanLich, type DinhNghiaCot, type EntrySkill, type LichThi, type NguCanhDs,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Một dòng `GET /cases?classId=` (MappedCase) — phần bảng lớp đọc. */
type CaseLop = {
  id: number; studentId: number | null; status: string; sosLevel: number | null; title: string; category: string | null; categoryLabel: string | null;
  ownerName: string | null; detectedAt: string; interventionCount: number;
};
type Hang = RosterRow & { lichThi?: LichThi; standing?: KetQuaVao | null };
type Moc = RosterRow['history'][number] & { writing?: number | null; expectation?: number | null; khongHoc?: string[]; khongDuBoMon?: boolean };
type Loc = 'tat-ca' | 'sos' | 'thieu';
/* Chip lọc — cùng dáng chip của `CongTacKhung` (kieu chip). */
const CHIP_CHON = 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]';
const CHIP_THUONG = 'border-[color:var(--line-strong)] bg-transparent text-slate-300 hover:text-slate-100';

/** Lượt hiện của em (P8 — lượt của TỪNG HV): lượt máy chủ kết luận (`standing`, cùng `standingFor` của Học viên & Lớp); chưa có → lượt mới nhất có điểm. */
const mocCua = (r: Hang): Moc | null => (r.history.find((h) => h.id === r.standing?.attemptId) ?? r.history[0] ?? null) as Moc | null;
/** Kết quả = kết luận máy chủ (`ketQuaGanNhat(standing)` — cùng hàm ô Kết quả gần nhất ở Học viên & Lớp), web không tự so điểm. */
const ketQua = (r: Hang): 'sos' | 'dat' | 'thieu' | 'khac' => {
  if (r.status !== 'active' || r.kckDuoi || (!r.standing && r.cycle?.khongCamKet)) return 'khac';
  const k = ketQuaGanNhat(r.standing ?? null);
  return k.sos ? 'sos' : k.dat ? 'dat' : 'thieu';
};

/* UI-HO-SO-LOP (chủ SP 22/10, 10 mục 8): GIỮ Target (mockup `ho-so-lop.html`), cột Phụ huynh của TVV / CX (OV-10b) và ⋯ thao tác từng dòng (V4). */
const cotCua = (theoVai: boolean): DinhNghiaCot[] => [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten' },
  { key: 'target', nhan: 'Target', kieu: 'so', rong: 72 },
  { key: 'mt', nhan: 'MT', kieu: 'so', rong: 64 },
  { key: 'l', nhan: 'L', kieu: 'diem', rong: 76 }, { key: 'r', nhan: 'R', kieu: 'diem', rong: 76 },
  { key: 'w', nhan: 'W', phu: 'W1 · W2', kieu: 'diem', rong: 104 }, { key: 's', nhan: 'S', kieu: 'diem', rong: 76 },
  { key: 'ovr', nhan: 'Overall', kieu: 'diem', rong: 92 },
  { key: 'kq', nhan: t('Kết quả'), kieu: 'chip', rong: 150 }, { key: 'thi', nhan: t('Ngày thi'), kieu: 'chip', rong: 136 },
  { key: 'cp', nhan: 'Case + PA', kieu: 'chip', rong: 138 },
  ...(theoVai ? [{ key: 'ph', nhan: t('Phụ huynh'), kieu: 'chip' as const, rong: 170 }] : []),
  { key: 'nut', nhan: '', kieu: 'nut' },
];

/**
 * BẢNG HỌC VIÊN · LỚP FAST TRACK (V5 `dieu-chinh-cuoi.html` khu b; R4: `Bang` / `ODiem`): chip lọc Tất cả · SOS · Chưa đủ dữ liệu + "Lượt của từng HV · tuần"
 * (P8) · cột MT (lượt của em) · L R W S Overall — điểm to (`ODiem` 17 px), W hiện MỘT lần + dòng phụ "W1 · W2" (W1, W2 riêng — C18) · bấm W / S → điểm
 * thành phần ngay tại chỗ (popover) · Kết quả: SOS thay "Chưa đạt" · Ngày thi chip nhỏ · Case + PA: bấm mở các Case của em ngay dưới hàng, PA gắn từng
 * Case; thao tác (Ghi KQ PA · Sửa · Lịch sử) mở panel Case của Công việc tại trang (`NganCase`). Việc của em ở thanh Việc cần làm (cột Việc bỏ).
 * < 640 px: bảng cuộn ngang trong khung (mockup 375 — không đổi thành thẻ).
 */
export function BangHoSoLop({ classId, maLop, quyen, onDoi, chon, onThemHocVien }: {
  classId: number; maLop: string; quyen: QuyenDong; onDoi: () => void; onThemHocVien?: () => void;
  /** PR-LUI-b: "Chọn nhiều học viên" (Quản lý) — bật thì ô chọn cạnh tên. */
  chon?: ChonNhieu;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const roster = useApi<Hang[]>(`/classes/${classId}/roster`, [classId]);
  const cases = useApi<{ rows: CaseLop[] }>(`/cases?classId=${classId}`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong: false, quyen, maLop, onDone: () => { roster.reload(); onDoi(); } });
  const COT = cotCua(!!quyen.theoVai);
  const [loc, setLoc] = useState<Loc>('tat-ca');
  const [mo, setMo] = useState<number | null>(null);
  const [pop, setPop] = useState<{ sid: number; kn: 'w' | 's'; nut: HTMLElement } | null>(null);
  const [ngan2, setNgan2] = useState<{ caseId: number; view: ViewCase; hv: string } | null>(null);
  if (roster.error) return <ErrorState message={roster.error.message} hint={roster.error.hint} onRetry={roster.reload} />;
  if (!roster.data) return <div className="card p-4"><Skeleton rows={6} /></div>;

  const caseCua = new Map<number, CaseLop[]>();
  for (const c of cases.data?.rows ?? []) if (c.studentId !== null && c.status !== 'done') caseCua.set(c.studentId, [...(caseCua.get(c.studentId) ?? []), c]);
  const tatCa = roster.data.filter((r) => !r.archived);
  const kq = new Map(tatCa.map((r) => [r.id, ketQua(r)]));
  const dem = { 'tat-ca': tatCa.length, sos: tatCa.filter((r) => kq.get(r.id) === 'sos').length, thieu: tatCa.filter((r) => kq.get(r.id) === 'thieu').length };
  const ds = tatCa.filter((r) => loc === 'tat-ca' || kq.get(r.id) === loc);
  const tuan = tatCa.map((r) => { const h = mocCua(r); return h ? r.timeline.find((x) => x.id === h.id) as { weekStart?: string | null } | undefined : undefined; })
    .map((x) => x?.weekStart).filter((w): w is string => !!w).sort();
  const ngCanh: NguCanhDs = { loai: 'hoc-vien', ids: ds.map((s) => s.id), nhan: t('Lớp {lop}', { lop: maLop }) };
  const xong = () => { invalidate(`/cases?classId=${classId}`); cases.reload(); roster.reload(); onDoi(); };

  const oDiem = (r: Hang, h: Moc | null, k: 'l' | 'r' | 'w' | 's' | 'ovr') => {
    if (!h) return <span className="text-faint">—</span>;
    /* P8 (mockup k6): môn em không học → "Không học"; Overall thiếu bộ môn → "Không đủ bộ môn" (khác "—" chưa điểm). */
    const kh = h.khongHoc ?? [];
    if (k === 'w' ? kh.includes('writing1') && kh.includes('writing2') : k !== 'ovr' && kh.includes(k === 'l' ? 'listening' : k === 'r' ? 'reading' : 'speaking')) return <OKhongHoc nhan={k.toUpperCase()} />;
    if (k === 'ovr' && h.overall == null && h.khongDuBoMon) return <NhanKq kq="thieu">{t('Không đủ bộ môn')}</NhanKq>;
    const v = k === 'ovr' ? h.overall : k === 'w' ? h.writing ?? null : h.bands?.[k === 'l' ? 'listening' : k === 'r' ? 'reading' : 'speaking'] ?? null;
    const o = <ODiem kieu="to" so={v === null ? null : fmtBand(v)} kq={h.lichSu ? null : soKyVong(v, h.expectation ?? null)} nhan={k === 'ovr' ? 'Overall' : k.toUpperCase()} kyVong={h.expectation != null ? fmtBand(h.expectation) : undefined} />;
    if ((k !== 'w' && k !== 's') || v === null) return o;
    const dangMo = pop?.sid === r.id && pop.kn === k;
    return (
      <button type="button" aria-haspopup="dialog" aria-expanded={dangMo} title={t('Điểm thành phần')}
        className="appearance-none rounded border-0 bg-transparent px-1 py-0.5 hover:bg-[color:var(--nut-hover)] max-sm:min-h-[44px]"
        onClick={(e) => { const nut = e.currentTarget; setPop(dangMo ? null : { sid: r.id, kn: k, nut }); }}>{o}</button>
    );
  };
  const oCua = (r: Hang, c: DinhNghiaCot): ReactNode => {
    const h = mocCua(r);
    switch (c.key) {
      case 'ten': return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {chon?.bat && <OChon chon={chon} id={r.id} ten={r.fullName} />}
          <span className="flex min-w-0 flex-col items-start">
            <TenEm s={r} ds={ngCanh} />
            {/* Nhãn cạnh tên (mới vào · thiếu thông tin · Ý thức) xuống dòng dưới tên — tên không bị cắt ở cột 205 px. */}
            <ChipXetLaiDong sid={r.id} />{(r.moiVao || r.missing.length > 0 || r.canhBaoYThuc) && <span className="flex flex-wrap items-center gap-1.5">{r.moiVao && <MoiVao />}<MissingBadge items={r.missing} gon /><CanhBaoYThuc cb={r.canhBaoYThuc} /></span>}
          </span>
        </span>
      );
      case 'target': return <TargetText band={r.cycle?.target} kck={r.cycle?.khongCamKet} />;
      case 'ph': return r.lienHe ? <OPhuHuynh l={r.lienHe} /> : <span className="text-faint">—</span>;
      case 'nut': return <MenuDong muc={tt.mucCua({ id: r.id, ten: r.fullName, dangHoc: r.status === 'active', nhapDiem: nhapDiemCua(classId, false, r.timeline as any), status: r.status, xuLyYThuc: !!r.canhBaoYThuc })} />;
      case 'mt': return h ? <Link to={duongHoSoHocVien(r.id, { dot: h.id })} className="text-slate-200 no-underline hover:underline">{dich(h.label)}</Link> : <span className="text-faint">—</span>;
      case 'l': case 'r': case 'w': case 's': case 'ovr': return oDiem(r, h, c.key);
      case 'kq': return <OKetQua r={r} h={h} kq={kq.get(r.id)!} />;
      case 'thi': return <OLichThi l={r.lichThi} homNay={homNay} />;
      case 'cp': {
        const ca = caseCua.get(r.id) ?? [];
        if (!ca.length) return <span className="text-faint">—</span>;
        const soPa = ca.reduce((n, x) => n + x.interventionCount, 0);
        return (
          <button type="button" aria-expanded={mo === r.id} aria-controls={`case-${r.id}`} onClick={() => setMo(mo === r.id ? null : r.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] ${mo === r.id ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'text-slate-200'}`}
            style={mo === r.id ? undefined : { borderColor: 'var(--line-strong)' }}>
            <b className="tabular-nums">{ca.length}</b> Case · <b className="tabular-nums">{soPa}</b> PA{mo === r.id && <span aria-hidden>▾</span>}
          </button>
        );
      }
      default: return null;
    }
  };
  const phuCua = (r: Hang, c: DinhNghiaCot): ReactNode => {
    const h = mocCua(r);
    if (!h) return null;
    /* LUAT-NX-MT (luật chung mọi ô điểm): kỹ năng đã dời do vắng → "vắng W3 SEP" (tuần cũ) thay dòng phụ. */
    const kn = { l: 'listening', r: 'reading', w: 'writing', s: 'speaking' }[c.key as 'l' | 'r' | 'w' | 's'];
    if (kn && h.vangCu?.[kn]) return chuDoiVang(h.vangCu[kn], homNay);
    if (c.key !== 'w') return null;
    const [w1, w2] = [h.bands?.writing1 ?? null, h.bands?.writing2 ?? null];
    return w1 === null && w2 === null ? null : `${w1 === null ? '—' : fmtBand(w1)} · ${w2 === null ? '—' : fmtBand(w2)}`;
  };
  const hangCua = (r: Hang) => (
    <Fragment key={r.id}>
      <tr className={`${mo === r.id ? 'dang-mo' : ''} ${r.status !== 'active' ? 'row-muted' : ''} ${chon?.chon.has(r.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
        {COT.map((c) => {
          const phu = phuCua(r, c);
          return <OBang key={c.key} c={c} className={c.key === 'ten' ? '!overflow-visible ![text-overflow:clip]' : ''}>{oCua(r, c)}{phu && <span className="bang-phu" data-phu-odiem="">{phu}</span>}</OBang>;
        })}
      </tr>
      {mo === r.id && (
        <tr id={`case-${r.id}`} className="mo-case">
          <td colSpan={COT.length} className="!h-auto !py-3 !pl-10 !pr-4 [background:var(--accent-soft)]">
            <div className="flex flex-col gap-2.5">
              {(caseCua.get(r.id) ?? []).map((ca) => <TheCase key={ca.id} c={ca} ngan={ngan} onMo={(view) => setNgan2({ caseId: ca.id, view, hv: r.fullName })} />)}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );

  return (
    <section className="card overflow-clip">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        {(['tat-ca', 'sos', 'thieu'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={loc === k} onClick={() => { setLoc(k); setMo(null); }}
            className={`h-8 whitespace-nowrap rounded-full border px-3 text-[13px] font-semibold max-sm:h-11 ${loc === k ? CHIP_CHON : CHIP_THUONG}`}>
            {k === 'tat-ca' ? t('Tất cả') : k === 'sos' ? 'SOS' : t('Chưa đủ dữ liệu')} <span className="tabular-nums">{dem[k]}</span>
          </button>
        ))}
        {tuan.length > 0 && (
          <span className="ml-auto text-[13px] text-slate-400 max-sm:ml-0 max-sm:w-full max-sm:text-right">
            {t('Lượt của từng HV')} · {tuanLich(tuan[0], homNay)}{tuan[tuan.length - 1] !== tuan[0] ? ` – ${tuanLich(tuan[tuan.length - 1], homNay)}` : ''}
          </span>
        )}
      </div>
      <Bang ten={t('Học viên lớp {lop}', { lop: maLop })} cot={COT} hang={ds} khoa={(r) => r.id} oCua={oCua} phuCua={phuCua} hangRieng={hangCua}
        the375={false} khung={false} dinh rong={{ tieuDe: loc === 'tat-ca' ? t('Lớp chưa có học viên') : t('Không có học viên nào'), nut: loc === 'tat-ca' && onThemHocVien ? <button type="button" className="btn btn-sm" onClick={onThemHocVien}>{t('Thêm học viên')}</button> : undefined }} />
      {pop && (() => { const r = tatCa.find((x) => x.id === pop.sid); const h = r && mocCua(r); return h ? <PopThanhPhan attemptId={h.id} kn={pop.kn} nut={pop.nut} tong={h.writing ?? null} onDong={() => setPop(null)} /> : null; })()}
      {tt.panels}
      {ngan2 && (
        <NganCase caseId={ngan2.caseId} viecBanDau={ngan2.view} hocVien={ngan2.hv} lop={maLop} onClose={() => setNgan2(null)} onChanged={xong} />
      )}
    </section>
  );
}

/** Tên em → hồ sơ HV; mang danh sách đang xem (`state.ds`) để hồ sơ đi Trước / Sau theo đúng thứ tự bảng (PR-DH). */
function TenEm({ s, ds }: { s: Hang; ds: NguCanhDs }) {
  return <Link className="truncate font-semibold text-slate-100 no-underline hover:underline" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName} <span aria-hidden className="font-normal text-slate-500">↗</span></Link>;
}

/** Kết quả lượt của em: SOS (thay "Chưa đạt" — không hai badge) · Đạt · Chưa đủ dữ liệu; em KCK / đã kết thúc giữ kết luận cũ (`KetLuan`). */
function OKetQua({ r, h, kq }: { r: Hang; h: Moc | null; kq: ReturnType<typeof ketQua> }) {
  if (kq === 'sos') return <ChipSos {...chipSosTuKetQua(r.standing ?? null)!} ten={r.fullName} />;
  if (kq === 'dat') return <NhanKq kq="dat">{t('Đạt')}</NhanKq>;
  if (kq === 'thieu') {
    /* Đ4: lý do ngắn ở tooltip + tên đọc màn (không thêm chữ trên màn — P1). */
    const ly = lyDoChuaDu(r.standing ?? null);
    return <NhanKq kq="thieu" title={ly ?? undefined}>{t('Chưa đủ dữ liệu')}{ly && <span className="sr-only"> · {ly}</span>}</NhanKq>;
  }
  if (r.kckDuoi) return <ChipDuoiKck />;
  return <KetLuan row={r} cotMocTrong={!h} />;
}

/** Ngày thi — chip nhỏ (`NhanLich`) chỉ khi có lịch: Thi dd/mm (đã chốt) · Đã thi · Dự kiến MM/YYYY (P5); chưa có lịch → "—" nhạt (Đ6, V7 không lạm dụng badge). */
function OLichThi({ l, homNay }: { l?: LichThi; homNay: string }) {
  if (!l || l.trangThai === 'chua-co') return <span className="text-slate-500" title={t('Chưa có lịch')}><span aria-hidden>—</span><span className="sr-only">{t('Chưa có lịch')}</span></span>;
  if (l.trangThai === 'da-chot-ngay' && l.ngay) return <NhanLich loai="co">{t('Thi {ngay}', { ngay: `${l.ngay.slice(8, 10)}/${l.ngay.slice(5, 7)}` })}</NhanLich>;
  if (l.trangThai === 'da-thi') return <NhanLich loai="da-thi">{t('Đã thi')}</NhanLich>;
  return <NhanLich loai="du-kien" title={l.tuan ? tuanLich(l.tuan, homNay) : undefined}>{nhanThangDuKien(l.thang!)}</NhanLich>;
}

/**
 * MỘT CASE DƯỚI HÀNG EM (khu b `.case-the`): đầu = kỹ năng · tên Case · SOS · người phụ trách · mở ngày · trạng thái; mỗi PA đang chạy một dòng —
 * nội dung (+ người dạy · từ tuần) · Kết quả (lần ghi gần nhất) · Hạn ghi KQ (`dd/mm`) · thao tác theo quyền máy chủ (`ghiDuoc`, `viewer.canEdit`).
 */
function TheCase({ c, ngan, onMo }: { c: CaseLop; ngan: (d: string | null | undefined) => string; onMo: (v: ViewCase) => void }) {
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${c.id}`, [c.id]);
  const { homNay } = useNgayNghiepVu();
  const kn = c.category ? skillShort(c.category) : c.categoryLabel ?? '';
  const pa = (data?.interventions ?? []).filter((x: any) => (x.status === 'planned' || x.status === 'started') && !(x.laPaDoi && (x.approvalState === 'pending' || x.approvalState === 'declined')));
  const kqCua = (paId: number) => [...(data?.followups ?? [])].filter((f: any) => f.interventionId === paId).sort((a: any, b: any) => (b.observedOn ?? '').localeCompare(a.observedOn ?? ''))[0];
  return (
    <div className="overflow-hidden rounded-[10px] border bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-center gap-2.5 border-b px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>
        {kn && <span className="rounded bg-[color:var(--surface-2)] px-1.5 py-0.5 text-xs font-bold text-slate-300">{kn}</span>}
        <span className="font-bold text-slate-100">{kn ? `Case ${kn} · ` : ''}{dich(c.title).replace(' - ', ' · ')}</span>
        {(c.sosLevel ?? 0) > 0 && <ChipSos muc={c.sosLevel!} tinh />}
        <span className="text-[13px] text-slate-400">{[c.ownerName, t('mở {ngay}', { ngay: ngan(c.detectedAt) })].filter(Boolean).join(' · ')}</span>
        {data?.trangThaiV4 && <span className="ml-auto"><Nhan tone="doing">{dich(data.trangThaiV4.chu)}</Nhan></span>}
      </div>
      {error ? <div className="px-3.5 py-2.5 text-[13px] text-bad">{error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>{t('Thử lại')}</button></div>
        : !data ? <div className="px-3.5 py-2.5"><Skeleton rows={1} /></div>
        : pa.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 text-[13px] text-slate-400">
            {t('Chưa có PA')}
            <span className="ml-auto flex gap-2">
              {data.viewer.canEdit && <button type="button" className="btn btn-sm" onClick={() => onMo({ loai: 'them-pa' })}>{t('Thêm PA')}</button>}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMo({ loai: 'case' })}>{t('Lịch sử')}</button>
            </span>
          </div>
        ) : pa.map((iv: any, i: number) => {
          const f = kqCua(iv.id);
          return (
            <div key={iv.id} className={`grid grid-cols-[34px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1.5 px-3.5 py-2.5 md:grid-cols-[34px_minmax(0,1fr)_150px_120px_auto] ${i ? 'border-t border-dashed' : ''}`} style={{ borderColor: 'var(--line)' }}>
              <span className="rounded bg-[color:var(--accent-soft)] px-1 py-0.5 text-center text-xs font-bold text-[color:var(--accent)]">PA</span>
              <span className="min-w-0 font-semibold text-slate-100">
                {iv.description || dich(iv.kind)}
                <small className="block text-xs font-normal text-slate-500">{[iv.performer, iv.startedDate ? t('từ {tuan}', { tuan: tuanLich(iv.startedDate, homNay) }) : null].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="flex flex-col gap-px max-md:col-start-2"><span className="text-xs text-slate-500">{t('Kết quả')}</span><span className="text-sm font-bold text-slate-100">{f ? dich(outcomeLabelFor(f.outcome)) : t('Chưa ghi')}</span></span>
              <span className="flex flex-col gap-px max-md:col-start-2"><span className="text-xs text-slate-500">{t('Hạn ghi KQ')}</span><span className={`font-bold tabular-nums ${iv.actionOverdue ? 'text-bad' : 'text-slate-100'}`}>{iv.actionDue ? <>{iv.actionOverdue && <span aria-hidden className="text-xs">⚠ </span>}{ngan(iv.actionDue)}</> : '—'}</span></span>
              <span className="flex flex-wrap items-center justify-end gap-2 max-md:col-start-2 max-md:justify-start">
                {iv.ghiDuoc ? (
                  <>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onMo({ loai: 'ghi-ket-qua', paId: iv.id })}>{t('Ghi KQ PA')}</button>
                    {data.viewer.canEdit && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMo({ loai: 'sua-pa', paId: iv.id })}>{t('Sửa')}</button>}
                  </>
                ) : (
                  <>
                    {iv.performer && <span className="text-[13px] text-slate-400">{t('việc của {ai}', { ai: iv.performer })}</span>}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMo({ loai: 'case' })}>{t('Lịch sử')}</button>
                  </>
                )}
              </span>
            </div>
          );
        })}
    </div>
  );
}

/**
 * ĐIỂM THÀNH PHẦN (khu b `.pop-tp`): bấm W → W1 · W2 (người chấm, band, 4 tiêu chí) + "W = (W1 + 2 × W2) / 3 → x"; bấm S → S (GV chấm, 4 tiêu chí).
 * "Sửa ›" mở hồ sơ lượt (sửa theo quyền, có lịch sử). Vẽ qua portal, vị trí cố định dưới ô — không bị khung cuộn của bảng cắt; Esc / bấm ra ngoài / cuộn → đóng.
 */
type OLuot = { skill: EntrySkill; band: number | null; criteria: (number | null)[]; enteredByName: string | null; gvCham?: { ten: string } | null };
function PopThanhPhan({ attemptId, kn, nut, tong, onDong }: { attemptId: number; kn: 'w' | 's'; nut: HTMLElement; tong: number | null; onDong: () => void }) {
  const { data, error } = useApi<{ id: number; kind: string; classId: number | null; cells: OLuot[] }>(`/attempts/${attemptId}`, [attemptId]);
  const hop = useRef<HTMLDivElement>(null);
  const nutRef = useRef<HTMLElement | null>(nut);
  nutRef.current = nut;
  useBamNgoai(true, onDong, hop, nutRef);
  const [cho, setCho] = useState<CSSProperties>(() => viTri(nut));
  /* Hộp vẽ cuối <body> — đưa focus vào để bàn phím tới được "Sửa ›" (không cuộn: cuộn = đóng). */
  useEffect(() => { hop.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { onDong(); nut.focus(); } };
    const dong = () => onDong();
    const lai = () => setCho(viTri(nut));
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', lai);
    return () => { document.removeEventListener('keydown', esc); window.removeEventListener('scroll', dong, true); window.removeEventListener('resize', lai); };
  }, [nut, onDong]);
  const phan = (kn === 'w' ? ['writing1', 'writing2'] : ['speaking']) as EntrySkill[];
  const o = (k: EntrySkill) => data?.cells.find((x) => x.skill === k);
  const [w1, w2] = [o('writing1')?.band ?? null, o('writing2')?.band ?? null];
  return createPortal(
    <div ref={hop} role="dialog" tabIndex={-1} aria-label={kn === 'w' ? t('Điểm thành phần W') : t('Điểm thành phần S')} style={cho}
      className="fixed z-50 flex w-[300px] flex-col gap-2 rounded-[10px] border bg-[color:var(--surface)] px-3.5 py-3 text-[13px] shadow-xl">
      {error ? <span className="text-bad">{error.message}</span> : !data ? <Skeleton rows={3} /> : (
        <>
          {phan.map((k) => {
            const x = o(k);
            const tc = tieuChiCua(k) ?? [];
            const nguoi = x?.gvCham?.ten || x?.enteredByName;
            return (
              <div key={k} className="grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-0.5 border-b border-dashed pb-2 last-of-type:border-b-0 last-of-type:pb-0" style={{ borderColor: 'var(--line)' }}>
                <span className="text-sm font-bold text-slate-100">{k === 'writing1' ? 'W1' : k === 'writing2' ? 'W2' : 'S'}{nguoi ? ` · ${nguoi}` : ''}</span>
                <span className="text-right"><ODiem so={x?.band != null ? fmtBand(x.band) : null} /></span>
                {tc.map((ten, i) => (
                  <Fragment key={ten}><span className="text-slate-400">{ten}</span><span className="text-right font-bold tabular-nums text-slate-100">{x?.criteria?.[i] != null ? fmtBand(x.criteria[i]!) : '—'}</span></Fragment>
                ))}
              </div>
            );
          })}
          <div className="flex items-center gap-2 text-slate-400">
            {kn === 'w' && w1 !== null && w2 !== null && tong !== null && <span className="tabular-nums">W = (W1 + 2 × W2) / 3 → {fmtBand(tong)}</span>}
            <Link to={duongDotTest({ id: data.id, kind: data.kind, classId: data.classId }, kn === 'w' ? 'writing1' : 'speaking')} className="link ml-auto">{t('Sửa ›')}</Link>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
const viTri = (nut: HTMLElement): CSSProperties => {
  const r = nut.getBoundingClientRect();
  return { top: r.bottom + 6, left: Math.max(8, Math.min(r.left - 20, window.innerWidth - 308)) };
};
