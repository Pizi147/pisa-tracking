import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { ODiem } from '../../ui/ODiem.tsx';
import { NhanKq } from '../../ui/Nhan.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { BieuDoD, ChuGiaiD, kqSo, type CaseD, type DiemD, type ThiD } from './BieuDoD.tsx';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';
import {
  BAI_LOP_NHAN_XET_TOI_DA, BAI_LOP_TEN_TOI_DA, chuDoiVang, duongDotTest, mondayOfDate, ngay, soKyVong, tenBaiThuong, tenMonNgan, tuanLich,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Ô đang chọn ở đầu hồ sơ: `overall` hoặc `category` của bảng kỹ năng (listening · reading · writing1 · writing2 · speaking · môn lớp thường). */
export type ChonKn = string;
export const OVERALL = 'overall';

/** Lượt của hồ sơ (`GET /students/:id` → `attempts`) — phần màn này đọc. */
type Luot = {
  id: number; attemptNo: number; khongDuBoMon?: boolean; kind: string; status: string; lichSu?: boolean; weekStart: string | null;
  overall: number | null; expectation: number | null; vangCu?: Record<string, string> | null;
};
type SEx = { diem: number; tuan: string; tuanMa: string };

const laMt0 = (a: Luot) => a.kind === 'mt0';
const tenLuot = (a: Luot) => (laMt0(a) ? 'MT0' : `MT${a.attemptNo}`);
/** Lượt tính trên trục: không huỷ, có tuần. */
const luotTruc = <T extends Luot>(attempts: T[]) => attempts.filter((a) => a.status !== 'cancelled' && !!a.weekStart);

/**
 * Ô ĐIỂM TO ĐẦU HỒ SƠ (`dieu-chinh-cuoi.html` khu c `.diem-dau`): Overall · L · R · W1 · W2 · S (lớp thường: từng môn) — bấm đổi kỹ năng của Hành trình +
 * Case & PA (`aria-pressed`). Số từ máy chủ: Overall = lượt "Kết quả gần nhất" (`dauHoSo.o.ketQua`), kỹ năng = hàng bảng kỹ năng (`band`, `trend`,
 * `expectation` của chính lượt). ✓ / ✗ so kỳ vọng của lượt (`soKyVong`, cùng ô điểm bảng lớp). Kỹ năng dời do vắng: dòng phụ "vắng W3 SEP" (7.4).
 */
export function DiemDau({ rows, attempts, ketQuaId, chon, onChon, homNay, mon = null }: {
  rows: SkillBoardRow[]; attempts: Luot[]; ketQuaId: number | null; chon: ChonKn; onChon: (k: ChonKn) => void; homNay: string | null;
  /** P8 (mockup k7): môn đăng ký của lộ trình (null = đủ) — hồ sơ chỉ vẽ ô môn em học; Overall thiếu bộ môn ghi "Không đủ bộ môn". */
  mon?: readonly string[] | null;
}) {
  const ds = rows.filter((r) => !r.tuLopTruoc && (!mon || r.ratio || mon.includes(r.category) || r.band !== null));   // môn đã bỏ vẫn hiện điểm cũ
  if (!ds.length) return null;
  const ratio = ds.some((r) => r.ratio);
  const a = attempts.find((x) => x.id === ketQuaId) ?? null;
  const truoc = a ? attempts.filter((x) => x.overall !== null && x.status !== 'cancelled' && !laMt0(x) && x.attemptNo < a.attemptNo).sort((x, y) => y.attemptNo - x.attemptNo)[0] : undefined;
  const lech = (moi: number, cu: number) => { const d = Math.round((moi - cu) * 10) / 10; return d > 0 ? ` · +${d.toFixed(1)}` : d < 0 ? ` · ${d.toFixed(1)}` : ''; };
  return (
    <div role="group" aria-label={t('Chọn kỹ năng xem hành trình')}
      className={`grid gap-2.5 ${ratio ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 min-[900px]:grid-cols-[1.2fr_repeat(5,1fr)] [&>*:first-child]:max-[899px]:col-span-3'}`}>
      {!ratio && (
        <ODiemTo nhan={a ? `Overall · ${tenLuot(a)}` : 'Overall'} chon={chon === OVERALL} onClick={() => onChon(OVERALL)}
          phu={a?.khongDuBoMon && a.overall == null ? null : a?.overall != null ? [a.expectation != null ? t('kỳ vọng {kv}', { kv: fmtBand(a.expectation) }) : null,
            truoc?.overall != null ? (truoc.overall === a.overall ? `= ${tenLuot(truoc)}` : `${tenLuot(truoc)} ${fmtBand(truoc.overall)}${lech(a.overall, truoc.overall)}`) : null].filter(Boolean).join(' · ') : t('chưa có điểm')}>
          {a?.khongDuBoMon && a.overall == null ? <span className="py-1.5"><NhanKq kq="thieu">{t('Không đủ bộ môn')}</NhanKq></span>
            : <ODiem kieu="lon" so={a?.overall != null ? fmtBand(a.overall) : null} kq={soKyVong(a?.overall, a?.expectation)} nhan="Overall" kyVong={a?.expectation != null ? fmtBand(a.expectation) : undefined} />}
        </ODiemTo>
      )}
      {ds.map((r) => {
        const vang = a?.vangCu?.[r.category] ? chuDoiVang(a.vangCu[r.category], homNay) : null;
        const cu = r.trend !== null && r.band !== null ? Math.round((r.band - r.trend) * 10) / 10 : null;
        const phu = r.ratio ? (r.missed === false ? t('đạt') : r.missed === true ? t('chưa đạt') : t('chưa có điểm'))
          : r.band === null ? t('chưa có điểm')
          : r.trendFrom !== null && cu !== null ? (r.trend === 0 ? `= MT${r.trendFrom}` : `MT${r.trendFrom} ${fmtBand(cu)}${lech(r.band, cu)}`)
          : r.bandAttemptNo ? `MT${r.bandAttemptNo}` : null;
        return (
          <ODiemTo key={r.category} nhan={r.short} title={r.label} chon={chon === r.category} onClick={() => onChon(r.category)} phu={vang ?? phu}>
            {r.ratio
              ? <ODiem kieu="lon" so={r.score !== null ? String(r.score) : null} kq={r.missed === null ? null : r.missed ? 'duoi' : 'vuot'} nhan={r.short} phu={r.total ? `/ ${r.total}` : undefined} />
              : <ODiem kieu="lon" so={r.band !== null ? fmtBand(r.band) : null} kq={soKyVong(r.band, r.expectation)} kck={r.kck} nhan={r.short} kyVong={r.expectation != null ? fmtBand(r.expectation) : undefined} />}
          </ODiemTo>
        );
      })}
    </div>
  );
}

function ODiemTo({ nhan, title, phu, chon, onClick, children }: { nhan: string; title?: string; phu?: string | null; chon: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={chon} title={title} onClick={onClick}
      className={`flex min-w-0 flex-col items-start gap-0.5 rounded-[10px] border px-3.5 py-2.5 text-left max-sm:min-h-[44px] ${chon
        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[inset_0_-3px_0_var(--accent)]'
        : 'border-[color:var(--line)] bg-[color:var(--surface)] hover:border-[color:var(--accent-line)]'}`}>
      <span className="text-[13px] font-semibold text-slate-300">{nhan}</span>
      {children}
      {phu && <span className="text-[12px] tabular-nums text-slate-400">{phu}</span>}
    </button>
  );
}

/** Lượt kèm điểm từng ô + nhận xét MT (UI-CHART-D, `GET /students/:id`) — lớp thường: `skills` + `nguongDat`. */
type LuotD = Luot & {
  classId?: number | null; studentId?: number | null; mode?: string;
  diemKn?: Record<string, number | null>; nhanXet?: Record<string, string>; doiKyNang?: string[];
  skills?: { skill: string; score: number | null; total: number | null }[] | null; nguongDat?: number;
};
/** Phần lộ trình chart D đọc (`cycle` của hồ sơ). */
export type LoTrinhD = {
  ratio: boolean; target: number | null; monDangKy?: string[] | null;
  targetRevisions: { oldTarget: number | null; newTarget: number | null; effectiveFrom: string }[];
  examPlan?: { confidence: string; weekStart: string | null; month: string | null; label: string } | null;
  thiThat?: { ngay: string | null; l: number | null; r: number | null; w: number | null; s: number | null; ovr: number | null; target: number | null; khongThi: boolean } | null;
};
/** Một dòng của chart / Bảng: lượt (có điểm · vắng · không học · sắp tới), S Ex, hay Thi thật. */
type DongKn = DiemD & { a?: LuotD; nhanXet?: string | null };

const KN_THI: Record<string, 'l' | 'r' | 'w' | 's'> = { listening: 'l', reading: 'r', writing1: 'w', writing2: 'w', speaking: 's' };
const kyNangDot = (k: string) => (k.startsWith('writing') ? 'writing' : k);
const pm = (d: number) => (d > 0 ? `+${d.toFixed(1)}` : d < 0 ? `−${(-d).toFixed(1)}` : '=');

/** Thi thật của lộ trình FT, một nguồn cho chart D, Bảng kỹ năng và hàng Thi thật bảng Mock Test: đã nhập (kết quả / chờ) → ngày thi; chưa nhập → kế hoạch
 * thi (tuần; tuần đã qua = đã thi chờ kết quả · tháng → khối tháng). `khong` = em không thi. */
export type ThiThatD = { loai: 'kq' | 'cho' | 'du-kien'; tuan: string | null; thang: string | null; nhan: string; diem: Record<'l' | 'r' | 'w' | 's' | 'ovr', number | null>; target: number | null };
export function thiThatCua(cy: LoTrinhD, homNay: string): ThiThatD | 'khong' | null {
  const tt = cy.thiThat, ke = cy.examPlan, target = tt?.target ?? cy.target;
  const trong = { l: null, r: null, w: null, s: null, ovr: null };
  if (tt?.khongThi) return 'khong';
  if (tt?.ngay) {
    const diem = { l: tt.l, r: tt.r, w: tt.w, s: tt.s, ovr: tt.ovr };
    return { loai: Object.values(diem).some((v) => v != null) ? 'kq' : 'cho', tuan: mondayOfDate(tt.ngay), thang: null, nhan: ngay(tt.ngay, homNay), diem, target };
  }
  if (ke?.confidence === 'week' && ke.weekStart) return { loai: ke.weekStart <= mondayOfDate(homNay) ? 'cho' : 'du-kien', tuan: ke.weekStart, thang: null, nhan: ke.label, diem: trong, target };
  if (ke?.confidence === 'month' && ke.month) return { loai: 'du-kien', tuan: null, thang: ke.month, nhan: ke.label, diem: trong, target };
  return null;
}

/**
 * Dữ liệu một kỹ năng cho chart D + Bảng (cùng một nguồn): lượt từ `attempts` (đủ mọi lượt — `diemKn`, không phải 4 mốc `points`), kỳ vọng của CHÍNH lượt,
 * Target bậc thang từ `targetRevisions`, Case / PA của hàng kỹ năng, S Ex (Speaking), thi thật (`cycle.thiThat` → `examPlan`). Không đổi luật tính.
 */
function duLieuKn({ kn, row, attempts, cy, sEx, homNay, tenKn, ten, onMoCase }: {
  kn: string; row: SkillBoardRow | null; attempts: LuotD[]; cy: LoTrinhD; sEx: SEx[]; homNay: string; tenKn: string; ten: (a: LuotD) => string;
  onMoCase?: (caseId: number, paId?: number) => void;
}) {
  const nay = mondayOfDate(homNay);
  const ratio = cy.ratio;
  const hocKn = !cy.monDangKy || cy.monDangKy.includes(kn);
  const ds = luotTruc(attempts).sort((a, b) => a.weekStart!.localeCompare(b.weekStart!) || a.attemptNo - b.attemptNo);
  let truoc: DongKn | null = null;
  const diem: DongKn[] = [];
  for (const a of ds) {
    const tuan = mondayOfDate(a.weekStart!), tenL = ten(a);
    const o = ratio ? a.skills?.find((x) => x.skill === kn) : null;
    const v = ratio ? (o?.score != null && o.total ? (100 * o.score) / o.total : null) : a.diemKn?.[kn] ?? null;
    const kv = ratio ? (a.nguongDat != null ? a.nguongDat * 100 : null) : laMt0(a) ? null : a.expectation;
    const href = duongDotTest(a as any, kyNangDot(kn));
    const nx = a.nhanXet?.[kn] ?? null;
    if (v !== null) {
      const chuDiem = ratio ? `${o!.score}/${o!.total}` : undefined;
      const k = kqSo(v, kv, ratio), dauKq = k === 'duoi' ? '✗ ' : k ? '✓ ' : '';
      const so = truoc?.v != null ? (truoc.v === v ? t('bằng {mt}', { mt: truoc.ten }) : `${v > truoc.v ? '▲ +' : '▼ '}${ratio ? Math.round(Math.abs(v - truoc.v)) + ' %' : fmtBand(Math.abs(v - truoc.v))} ${t('so {mt}', { mt: truoc.ten })}`) : t('lượt đầu');
      const d: DongKn = { khoa: `a${a.id}`, ten: tenL, tuan, v, kv, loai: 'diem', chuDiem, a, nhanXet: nx,
        goi: { tieu: `${tenL} · ${tuanLich(tuan)}`, dong: [`${tenKn} ${dauKq}${chuDiem ?? fmtBand(v)} · ${ratio ? t('đạt từ {n} %', { n: Math.round(kv ?? 0) }) : kv != null ? t('kỳ vọng {kv}', { kv: fmtBand(kv) }) : t('chưa có kỳ vọng')}`, so], href, chuLink: t('Hồ sơ lượt {mt} ›', { mt: tenL }) } };
      diem.push(d); truoc = d;
    } else if (tuan > nay) {
      diem.push({ khoa: `a${a.id}`, ten: tenL, tuan, v: null, kv, loai: 'sap', chu: t('dự kiến'), a, goi: { tieu: tenL, dong: [] } });
    } else if (laMt0(a)) continue;
    else {
      /* Vắng (dời / đang vắng) khác chưa có điểm (việc nhập còn nợ) — hai dấu, hai chữ. */
      const vang = !!a.vangCu?.[kn] || !!a.doiKyNang?.includes(kyNangDot(kn));
      /* Cùng chữ "dời S" của bảng Mock Test (`NhanDot`), kèm tuần vắng cũ khi có (LUAT-NX-MT 7.4). */
      const doi = t('dời {mon}', { mon: row?.short ?? tenKn });
      const chu = !hocKn ? t('không học') : a.vangCu?.[kn] ? `${doi} · ${chuDoiVang(a.vangCu[kn], homNay)}` : vang ? doi : t('chưa có điểm');
      diem.push({ khoa: `a${a.id}`, ten: tenL, tuan, v: null, kv, loai: !hocKn ? 'khong' : vang ? 'vang' : 'thieu', chu, a,
        goi: { tieu: `${tenL} · ${tuanLich(tuan)}`, dong: [`${tenKn}: ${chu}`], href, chuLink: t('Hồ sơ lượt {mt} ›', { mt: tenL }) } });
    }
  }
  const sex = kn === 'speaking' ? sEx.map((x) => ({ tuan: mondayOfDate(x.tuan), v: x.diem, goi: { tieu: `S Expert · ${tuanLich(x.tuan)}`, dong: [`Speaking ${fmtBand(x.diem)}`, t('không tính vào MT')] } })) : [];
  /* Target bậc thang: mức trước lần đổi đầu → mỗi lần đổi từ tuần hiệu lực (đổi Target không tô lại lượt cũ — kỳ vọng lượt vẫn của lượt). */
  const rev = [...cy.targetRevisions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const target = ratio ? null : rev.length
    ? [{ tu: null, v: rev[0].oldTarget }, ...rev.map((r) => ({ tu: mondayOfDate(r.effectiveFrom), v: r.newTarget }))].filter((g): g is { tu: string | null; v: number } => g.v != null)
    : cy.target != null ? [{ tu: null, v: cy.target }] : null;
  const nguong = ratio ? ds.find((a) => a.nguongDat != null)?.nguongDat ?? null : null;
  /* Case / PA của kỹ năng (cả Case đã đóng của lộ trình) — chữ trong thanh, hộp nhỏ khi chạm. */
  const cases: CaseD[] = (row?.cases ?? []).filter((c) => c.openedOn).map((c) => {
    const dong = c.status === 'done' ? c.closedOn ?? c.touchedOn ?? c.openedOn : null;
    return {
      id: c.id, chu: row!.short, mt: (c.tenSos?.mt ?? c.attempts[0]?.attemptNo) != null ? `MT${c.tenSos?.mt ?? c.attempts[0]?.attemptNo}` : null, sos: c.sosLevel, mo: c.openedOn!, dong,
      goi: { tieu: `Case ${tenKn}${c.sosLevel ? ` · SOS ${c.sosLevel}` : ''}`, mo: onMoCase ? () => onMoCase(c.id) : undefined, dong: [c.title.replace(/\[[^\]]*\]\s*/g, '').trim(), `${t('mở {ngay}', { ngay: ngay(c.openedOn, homNay) })}${dong ? ` · ${t('đã đóng {ngay}', { ngay: ngay(dong, homNay) })}` : ''}`] },
      pa: c.plans.filter((p) => p.startedOn && p.status !== 'cancelled' && !p.chuaChay).sort((x, y) => x.startedOn!.localeCompare(y.startedOn!)).map((p, i) => {
        const den = p.completedOn;
        return {
          id: p.id, ten: `PA${i + 1}`, tu: p.startedOn!, den, denDk: den ? null : p.actionDue ?? p.followupDue, kq: p.lastOutcome,   // hạn kỳ tới = hạn ghi kết quả của ngăn Case (`actionDue`)
          goi: { tieu: `PA${i + 1} · ${dich(p.kindLabel)}`, mo: onMoCase ? () => onMoCase(c.id, p.id) : undefined, dong: [p.name, `${tuanLich(p.startedOn)} – ${den ? tuanLich(den) : t('nay')}${p.lastOutcomeLabel ? ` · ${dich(p.lastOutcomeLabel)}` : ''}`] },
        };
      }),
    };
  });
  /* Thi thật: chỉ là mốc cuối, không chặn gì (chủ SP 27/10). */
  const th = ratio ? null : thiThatCua(cy, homNay);
  let thi: ThiD | null = null;
  if (th && th !== 'khong') {
    const v = th.loai === 'kq' ? th.diem[KN_THI[kn]] ?? null : null;
    thi = { tuan: th.tuan, thang: th.thang, v, cho: th.loai !== 'du-kien' && v == null, target: th.target,
      goi: th.loai === 'du-kien'
        ? { tieu: t('Thi thật · dự kiến {thang}', { thang: th.nhan }), dong: [th.thang ? t('chưa chốt ngày · Target {v}', { v: fmtBand(th.target) }) : `Target ${fmtBand(th.target)}`, t('mốc cuối của lộ trình')] }
        : { tieu: t('Thi thật IELTS · {ngay}', { ngay: th.nhan }), dong: v != null ? [`${tenKn} ${fmtBand(v)} · Target ${fmtBand(th.target)}`, t('kết quả cuối của lộ trình')] : [t('đã thi · chờ kết quả')] } };
  }
  /* Trục dọc: FT theo band (bước 0.5, rộng ≥ 2) · lớp thường theo % (bước 20, tới 100). */
  const so = [...diem.flatMap((d) => [d.v, d.kv]), ...sex.map((x) => x.v), ...(target ?? []).map((g) => g.v), thi?.v ?? null, nguong != null ? nguong * 100 : null].filter((v): v is number => v != null);
  let lo: number, hi: number, buoc: number;
  if (ratio) { lo = Math.max(0, Math.floor((Math.min(100, ...so) - 10) / 20) * 20); hi = 100; buoc = 20; }
  else {
    lo = so.length ? Math.max(0, Math.floor((Math.min(...so) - 0.5) * 2) / 2) : 4; hi = so.length ? Math.min(9, Math.ceil((Math.max(...so) + 0.5) * 2) / 2) : 7;
    if (hi - lo < 2) { hi = Math.min(9, lo + 2); lo = hi - 2; }
    buoc = hi - lo > 4 ? 1 : 0.5;
  }
  return { diem, sex, target, kvPhang: nguong != null ? { v: nguong * 100, chu: t('Đạt từ {n} %', { n: Math.round(nguong * 100) }) } : null, cases, thi, lo, hi, buoc,
    fmt: ratio ? (v: number) => `${Math.round(v)} %` : (v: number) => fmtBand(v) };
}

/** Biểu đồ | Bảng nhớ trong phiên (đổi kỹ năng / qua Overall rồi về vẫn giữ). */
let xemNho: 'bieu' | 'bang' = 'bieu';

/**
 * HÀNH TRÌNH · {kỹ năng} (UI-CHART-D, mockup M5): đầu khối "Hành trình · Speaking" ⓘ + Biểu đồ | Bảng. Biểu đồ = chart D; Bảng = Lượt · Tuần · Band · Kỳ vọng · ± ·
 * Ghi chú (nhận xét bài MT của kỹ năng ở lượt đó; không có thì vắng / không học / dự kiến), hàng cuối Thi thật. 375: luôn Bảng (chart nhiều cột không đọc được).
 */
export function HanhTrinhKn({ studentId, kn, row, attempts, cy, homNay, tenKn, tamDung, onMoCase }: {
  studentId: number; kn: string; row: SkillBoardRow | null; attempts: LuotD[]; cy: LoTrinhD; homNay: string; tenKn: string;
  /** Mọi khoảng Tạm dừng (`dauHoSo.thongTin.khoangDung`). */
  tamDung?: { tu: string; den: string | null }[];
  /** Enter / "Mở Case" trên thanh Case / PA của chart → ngăn Case tại trang (cùng chỗ mở của Case & phương án). */
  onMoCase?: (caseId: number, paId?: number) => void;
}) {
  const sExApi = useApi<SEx[]>(kn === 'speaking' ? `/students/${studentId}/s-expert` : null, [studentId, kn]);
  const hep = useDienThoai();
  const [xem, setXem_] = useState<'bieu' | 'bang'>(() => xemNho);
  const setXem = (v: 'bieu' | 'bang') => { xemNho = v; setXem_(v); };
  const tenLuot_ = (a: LuotD) => (cy.ratio ? tenBaiThuong(attempts, a) : tenLuot(a));
  const d = duLieuKn({ kn, row, attempts, cy, sEx: sExApi.data ?? [], homNay, tenKn, ten: tenLuot_, onMoCase });
  const bang = hep || xem === 'bang';
  const coDiem = d.diem.some((x) => x.loai === 'diem');
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[15px] font-bold text-slate-100">{t('Hành trình · {kn}', { kn: tenKn })}</h2>
        <NutLuat label={t('Cách đọc hành trình')}>
          {cy.ratio
            ? t('Chấm = điểm bài của môn (% so tổng), màu theo ngưỡng đạt của lớp · vạch đứt = ngưỡng đạt · cột hồng = tuần này.')
            : t('Chấm = điểm MT, màu theo kỳ vọng của lượt · vạch ngắn = kỳ vọng lượt · đứt = Target · cột hồng = tuần này · cột xanh lơ = thi thật. Chạm hoặc Tab một dấu để xem chi tiết; Enter mở hồ sơ lượt hoặc Case.')}
        </NutLuat>
        {!hep && (
          <span className="ml-auto inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }} role="group" aria-label={t('Kiểu xem')}>
            {(['bieu', 'bang'] as const).map((k, i) => (
              <button key={k} type="button" aria-pressed={xem === k} onClick={() => setXem(k)}
                className={`min-h-[30px] border-0 px-3 text-[13px] font-semibold ${i ? 'border-l' : ''} ${xem === k ? 'bg-[color:var(--accent-soft)] text-slate-100' : 'bg-transparent text-slate-300 hover:text-slate-100'}`}
                style={i ? { borderLeft: '1px solid var(--line-strong)' } : undefined}>{k === 'bieu' ? t('Biểu đồ') : t('Bảng')}</button>
            ))}
          </span>
        )}
      </div>
      {kn === 'speaking' && sExApi.error && (
        <p className="m-0 flex flex-wrap items-center gap-2 px-4 pt-2 text-[13px] text-slate-400" role="status">{t('Không tải được S Ex.')}
          <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" onClick={sExApi.reload}>{t('Thử lại')}</button></p>
      )}
      {kn === 'speaking' && !sExApi.data && !sExApi.error && !bang ? <div className="p-4"><Skeleton rows={4} /></div>
        : !d.diem.length && !d.thi ? (
        <p className="m-0 px-4 py-6 text-center text-[14px] text-slate-400">{t('Chưa có lượt nào ở {kn}.', { kn: tenKn })}</p>
      ) : bang ? <BangKn kn={kn} d={d} cy={cy} homNay={homNay} hep={hep} /> : (
        <>
          <BieuDoD ten={tenKn} diem={d.diem} sex={d.sex} target={d.target} kvPhang={d.kvPhang} cases={d.cases} thi={d.thi} homNay={homNay} tamDung={tamDung} lo={d.lo} hi={d.hi} buoc={d.buoc} fmt={d.fmt} />
          <ChuGiaiD kq={cy.ratio ? 'thuong' : { vuot: d.diem.some((x) => kqSo(x.v, x.kv) === 'vuot'), bang: d.diem.some((x) => kqSo(x.v, x.kv) === 'bang'), duoi: d.diem.some((x) => kqSo(x.v, x.kv) === 'duoi') }}
            kvLuot={!cy.ratio && d.diem.some((x) => x.kv != null && x.kv !== (d.target?.filter((g) => !g.tu || g.tu <= x.tuan).at(-1)?.v ?? null))}
            vang={d.diem.some((x) => x.loai === 'vang')} thieu={d.diem.some((x) => x.loai === 'thieu')} tamDung={!!tamDung?.length} sex={d.sex.length > 0}
            pa={d.cases.flatMap((c) => c.pa.map((p) => p.kq).filter((k): k is string => !!k))}
            thi={!d.thi ? null : d.thi.v != null ? 'kq' : d.thi.cho ? 'cho' : 'du-kien'} kvChu={d.kvPhang?.chu ?? 'Target'} />
          {!coDiem && <p className="m-0 px-4 pb-3 text-[13px] text-slate-400">{t('Chưa có điểm MT ở {kn}.', { kn: tenKn })}</p>}
        </>
      )}
    </>
  );
}

/** Bảng đơn giản của kỹ năng (nút Bảng; 375): Lượt · Tuần · Band · Kỳ vọng · ± · Ghi chú — số hẹp, Ghi chú rộng nhất. 375: Tuần + Ghi chú xuống dòng phụ dưới Lượt. */
function BangKn({ kn, d, cy, homNay, hep }: { kn: string; d: ReturnType<typeof duLieuKn>; cy: LoTrinhD; homNay: string; hep: boolean }) {
  const so = `td w-[1%] whitespace-nowrap ${hep ? 'px-2' : 'px-4'} text-center tabular-nums`;
  const gach = <span className="text-slate-500">—</span>;
  type Hang = { khoa: string; luot: React.ReactNode; tuan: string; band: React.ReactNode; kv: React.ReactNode; pm: React.ReactNode; gc: string | null; thi?: boolean; sap?: boolean };
  const hang: Hang[] = [];
  const cot = (p: DongKn): Hang => {
    const k = kqSo(p.v, p.kv, cy.ratio);
    const d2 = p.v != null && p.kv != null ? Math.round((p.v - p.kv) * 10) / 10 : null;
    return {
      khoa: p.khoa, tuan: tuanLich(p.tuan, homNay), sap: p.loai === 'sap',
      luot: p.loai !== 'sap' && p.goi.href ? <Link to={p.goi.href} className={`link font-semibold ${hep ? 'inline-block min-w-[44px] py-3 -my-3' : ''}`}>{p.ten} ›</Link> : p.ten,
      band: p.v != null ? <span className="font-bold" style={{ color: k ? `rgb(var(--kq-${k}-rgb))` : undefined }}>{k === 'duoi' ? '✗' : k ? '✓' : ''} {p.chuDiem ?? fmtBand(p.v)}</span> : gach,
      kv: p.kv != null ? d.fmt(p.kv) : gach,
      pm: d2 == null ? gach : <span className={d2 < 0 ? 'text-bad' : d2 > 0 ? 'text-ok' : 'text-slate-400'}>{cy.ratio ? (d2 > 0 ? `+${Math.round(d2)}` : d2 < 0 ? `−${Math.round(-d2)}` : '=') : pm(d2)}</span>,
      gc: p.nhanXet ?? (p.loai === 'diem' ? null : p.chu ?? null),
    };
  };
  const ev: ({ tuan: string; p: DongKn } | { tuan: string; s: typeof d.sex[number] })[] = [...d.diem.map((p) => ({ tuan: p.tuan, p })), ...d.sex.map((s) => ({ tuan: s.tuan, s }))];
  ev.sort((a, b) => a.tuan.localeCompare(b.tuan));
  for (const e of ev) {
    if ('p' in e) hang.push(cot(e.p));
    else hang.push({ khoa: `sx${e.tuan}`, luot: 'S Ex', tuan: tuanLich(e.tuan, homNay), band: fmtBand(e.s.v), kv: gach, pm: gach, gc: t('không tính') });
  }
  if (d.thi) {
    const v = d.thi.v, tg = d.thi.target, k = kqSo(v, tg);
    const d2 = v != null && tg != null ? Math.round((v - tg) * 10) / 10 : null;
    const th = thiThatCua(cy, homNay);
    hang.push({
      khoa: 'thi', thi: true, luot: t('Thi thật'),
      tuan: th && th !== 'khong' ? (th.loai === 'du-kien' ? t('dự kiến {thang}', { thang: th.nhan }) : th.nhan) : '',
      band: v != null ? <span style={{ color: k ? `rgb(var(--kq-${k}-rgb))` : undefined }}>{k === 'duoi' ? '✗ ' : k ? '✓ ' : ''}{fmtBand(v)}</span> : gach,
      kv: tg != null ? `Target ${fmtBand(tg)}` : gach, pm: d2 == null ? gach : <span className={d2 < 0 ? 'text-bad' : d2 > 0 ? 'text-ok' : ''}>{pm(d2)}</span>,
      gc: v != null ? (kn.startsWith('writing') ? t('W gộp') : null) : d.thi.cho ? t('chờ kết quả') : t('chưa thi'),
    });
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px]">
        <thead>
          <tr>
            <Th className={hep ? 'pl-3' : 'w-[1%] pl-4'}>{t('Lượt')}</Th>
            {!hep && <Th>{t('Tuần')}</Th>}
            <Th align="center">{cy.ratio ? t('Điểm') : 'Band'}</Th>
            <Th align="center">{cy.ratio ? t('Ngưỡng đạt') : t('Kỳ vọng')}</Th>
            <Th align="center">±</Th>
            {!hep && <Th className="pr-4">{t('Ghi chú')}</Th>}
          </tr>
        </thead>
        <tbody>
          {hang.map((h) => (
            <tr key={h.khoa} className={h.thi ? 'hang-thi-that' : h.sap ? 'text-slate-400' : undefined}>
              <td className={`td whitespace-nowrap ${hep ? 'pl-3 pr-2' : 'w-[1%] pl-4 pr-6'}`}>
                {h.luot}
                {hep && <span className="block whitespace-normal text-[12px] font-normal tabular-nums text-slate-400">{h.tuan}{h.gc ? ` · ${h.gc}` : ''}</span>}
              </td>
              {!hep && <td className="td w-[1%] whitespace-nowrap pr-6">{h.tuan}</td>}
              <td className={so}>{h.band}</td>
              <td className={so}>{h.kv}</td>
              <td className={so}>{h.pm}</td>
              {!hep && <td className="td break-words pr-4 text-slate-300">{h.gc ?? ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** `GET /students/:id/bai-tren-lop` (SV-BAI-LOP). */
type Bai = { id: number; classId: number; lop: string; skill: string; tenBai: string; diem: number; thang: number; tuan: string; tuanMa: string; nhanXet: string | null; ghiBoi: string | null; suaBoi: string | null; sua: boolean };
type DsBai = { bai: Bai[]; lop: { classId: number; code: string; kyNang: string[] }[] };
/** Kỹ năng của bài trên lớp: FT W1 / W2 ghi chung "writing" (cột Góp ý tuần). */
const kyNangBai = (chon: ChonKn) => (chon === 'writing1' || chon === 'writing2' ? 'writing' : chon);
const so = (d: number) => (Number.isInteger(d) ? String(d) : String(Math.round(d * 100) / 100));
const TOI_DA = 3;
/** Cột bảng Tiến độ trên lớp (khu c `.bang-td`): Tuần · (Kỹ năng khi xem Overall) · Kết quả · Nhận xét · GV. */
const cotTienDo = (coKn: boolean): CotBang[] => [
  { key: 'tuan', nhan: t('Tuần'), kieu: 'tuan' },
  ...(coKn ? [{ key: 'kn', nhan: t('Kỹ năng'), kieu: 'so' as const, rong: 72 }] : []),
  { key: 'kq', nhan: t('Kết quả'), kieu: 'chip', rong: 300 },
  { key: 'nx', nhan: t('Nhận xét'), kieu: 'chu' },
  { key: 'gv', nhan: 'GV', kieu: 'chu', rong: 180 },
];

/**
 * TIẾN ĐỘ TRÊN LỚP (khu c, `10` mục 5): bảng dưới biểu đồ — 3 dòng mới nhất + "Xem thêm n dòng", ghi NGUYÊN VĂN GV nhập (tên bài · điểm / thang của bài),
 * thang riêng, không vào MT / Overall / KPI. Overall = mọi kỹ năng (thêm cột kỹ năng). "+ Ghi tiến độ" khi người xem ghi được ít nhất một kỹ năng (máy chủ kiểm lại);
 * bấm dòng mình sửa được → panel sửa / xoá.
 */
export function TienDoTrenLop({ studentId, hocVien, lopNay, chon, ct, homNay }: {
  studentId: number; hocVien: string; lopNay: number | null; chon: ChonKn; ct: string | null; homNay: string;
}) {
  const duong = `/students/${studentId}/bai-tren-lop`;
  const { data, error, reload } = useApi<DsBai>(duong, [studentId]);
  const [du, setDu] = useState(false);
  const [mo, setMo] = useState<Bai | 'moi' | null>(null);
  const kn = chon === OVERALL ? null : kyNangBai(chon);
  const ds = (data?.bai ?? []).filter((b) => !kn || b.skill === kn);
  const hien = du ? ds : ds.slice(0, TOI_DA);
  const ghiDuoc = (data?.lop ?? []).some((l) => l.kyNang.length && (!kn || l.kyNang.includes(kn)));
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-[15px] font-semibold text-slate-100">{t('Tiến độ trên lớp')}</h3>
        <span className="text-[12px] text-slate-400">{t('GV ghi tuỳ ý · không vào MT')}</span>
        {ghiDuoc && <button type="button" className="btn btn-sm ml-auto max-sm:min-h-[44px]" onClick={() => setMo('moi')}>{t('+ Ghi tiến độ')}</button>}
      </div>
      {error ? <div className="px-4 pb-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : !data ? <div className="px-4 pb-3"><Skeleton rows={2} /></div>
        : !ds.length ? <p className="m-0 px-4 pb-4 text-[13px] text-slate-400">{t('Chưa có ghi nhận nào.')}</p>
        : (
          <>
            <Bang ten={t('Tiến độ trên lớp')} khung={false} cot={cotTienDo(!kn)} hang={hien} khoa={(b) => b.id}
              onHang={ds.some((b) => b.sua) ? (b) => { if (b.sua) setMo(b); } : undefined}
              oCua={(b, c) => c.key === 'tuan' ? <span className="tabular-nums">{b.tuanMa}</span>
                : c.key === 'kn' ? tenMonNgan(ct, b.skill)
                : c.key === 'kq' ? <span className="rounded-md bg-[color:var(--accent-soft)] px-2 py-0.5 text-[14px] font-bold text-slate-100" title={b.sua ? t('Sửa') : undefined}>{b.tenBai} · <span className="tabular-nums">{so(b.diem)}/{so(b.thang)}</span></span>
                : c.key === 'nx' ? (b.nhanXet ? <span className="break-words text-slate-300">{b.nhanXet}</span> : <span className="text-faint">—</span>)
                : <span className="text-slate-300">{b.suaBoi ?? b.ghiBoi ?? '—'}</span>} />
            {ds.length > TOI_DA && (
              <div className="border-t px-4 py-2" style={{ borderColor: 'var(--line)' }}>
                <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] max-sm:min-h-[44px]" aria-expanded={du} onClick={() => setDu(!du)}>
                  {du ? t('Thu gọn ▴') : t('Xem thêm {n} dòng ▾', { n: ds.length - TOI_DA })}
                </button>
              </div>
            )}
          </>
        )}
      {mo && data && (
        <PanelTienDo duong={duong} bai={mo === 'moi' ? null : mo} lop={data.lop} lopNay={lopNay} knDau={kn} hocVien={hocVien} ct={ct} homNay={homNay}
          onDong={() => setMo(null)} onXong={() => { invalidate(duong); reload(); setMo(null); }} />
      )}
    </>
  );
}

/** Panel ghi / sửa một dòng tiến độ trên lớp: Kỹ năng · Tên bài · Điểm / Thang (thang của bài, không quy đổi band) · Tuần · Nhận xét. Lỗi lưu giữ chữ. */
function PanelTienDo({ duong, bai, lop, lopNay, knDau, hocVien, ct, homNay, onDong, onXong }: {
  duong: string; bai: Bai | null; lop: DsBai['lop']; lopNay: number | null; knDau: string | null; hocVien: string; ct: string | null; homNay: string;
  onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const lopGhi = lop.filter((l) => l.kyNang.length);
  const lopDau = bai ? lop.find((l) => l.classId === bai.classId) : lopGhi.find((l) => l.classId === lopNay && (!knDau || l.kyNang.includes(knDau))) ?? lopGhi.find((l) => !knDau || l.kyNang.includes(knDau)) ?? lopGhi[0];
  const [classId] = useState(lopDau?.classId ?? null);
  const kyNang = lop.find((l) => l.classId === classId)?.kyNang ?? [];
  const [skill, setSkill] = useState(bai?.skill ?? (knDau && kyNang.includes(knDau) ? knDau : kyNang[0] ?? ''));
  const [tenBai, setTenBai] = useState(bai?.tenBai ?? '');
  const [diem, setDiem] = useState(bai ? so(bai.diem) : '');
  const [thang, setThang] = useState(bai ? so(bai.thang) : '10');
  const [tuan, setTuan] = useState(bai?.tuan ?? mondayOfDate(homNay));
  const [nhanXet, setNhanXet] = useState(bai?.nhanXet ?? '');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  /* Xoá dòng: hỏi lại (cùng mẫu "Xoá Case này?") — dòng xoá không khôi phục được. */
  const [hoiXoa, setHoiXoa] = useState(false);
  const soDiem = Number(diem.replace(',', '.')), soThang = Number(thang.replace(',', '.'));
  const loiO = [
    ...(!skill ? [{ khoa: 'kn', nhan: t('Kỹ năng'), lyDo: t('Chưa chọn') }] : []),
    ...(!tenBai.trim() ? [{ khoa: 'ten', nhan: t('Tên bài'), lyDo: t('Chưa nhập') }] : []),
    ...(!thang.trim() || !Number.isFinite(soThang) || soThang <= 0 ? [{ khoa: 'thang', nhan: t('Thang điểm'), lyDo: t('Phải lớn hơn 0') }] : []),
    ...(!diem.trim() || !Number.isFinite(soDiem) || soDiem < 0 || (Number.isFinite(soThang) && soDiem > soThang) ? [{ khoa: 'diem', nhan: t('Điểm'), lyDo: t('Từ 0 tới thang điểm') }] : []),
    ...(!tuan ? [{ khoa: 'tuan', nhan: t('Tuần'), lyDo: t('Chưa chọn') }] : []),
  ];
  const daSua = !bai ? !!(tenBai.trim() || diem.trim() || nhanXet.trim()) : tenBai !== bai.tenBai || diem !== so(bai.diem) || thang !== so(bai.thang) || tuan !== bai.tuan || nhanXet !== (bai.nhanXet ?? '') || skill !== bai.skill;
  const gui = async (xoa = false) => {
    if (!xoa) { lf.bam(); if (loiO.length) return; }
    setBusy(true); setLoi(null);
    try {
      const than = { skill, tenBai: tenBai.trim(), diem: soDiem, thang: soThang, tuan, nhanXet: nhanXet.trim() || null };
      if (xoa && bai) await api.del(`/bai-tren-lop/${bai.id}`);
      else if (bai) await api.put(`/bai-tren-lop/${bai.id}`, than);
      else await api.post(duong, { classId, ...than });
      toast.push('ok', xoa ? t('Đã xoá') : t('Đã lưu'));
      onXong();
    } catch (e: any) { setHoiXoa(false); setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const lopCode = lop.find((l) => l.classId === classId)?.code ?? null;
  return (
    <>
    <KhungPanel tieuDe={t('Tiến độ trên lớp')} loai={t('GHI NHẬN · TUỲ CHỌN')} hocVien={hocVien} lop={lopCode} onDong={() => !busy && onDong()}
      chan={{
        daSua, huy: { onClick: onDong, disabled: busy }, conThieu: lf.conThieu(loiO),
        xoa: bai ? { onClick: () => setHoiXoa(true) } : undefined,
        dongTren: loi ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loi}</p> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !classId} onClick={() => void gui()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="space-y-3 pt-3">
        {!classId && <p className="m-0 text-[13px] text-slate-400">{t('Bạn không ghi được tiến độ trên lớp của học viên này.')}</p>}
        <Truong nhan={t('Kỹ năng')} batBuoc as="div" loi={lf.loiCua(loiO, 'kn')}>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Kỹ năng')} {...lf.o(loiO, 'kn')}>
            {kyNang.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={skill === k} onClick={() => setSkill(k)}
                className={`btn btn-sm min-w-[44px] max-sm:min-h-[44px] ${skill === k ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>{tenMonNgan(ct, k)}</button>
            ))}
          </div>
        </Truong>
        <Truong nhan={t('Tên bài')} batBuoc loi={lf.loiCua(loiO, 'ten')}>
          <input className="field w-full" maxLength={BAI_LOP_TEN_TOI_DA} value={tenBai} onChange={(e) => setTenBai(e.target.value)} placeholder={t('Ví dụ: KT từ vựng, BTVN Unit 3')} {...lf.o(loiO, 'ten')} />
        </Truong>
        <div className="flex flex-wrap items-start gap-3">
          <Truong nhan={t('Điểm')} batBuoc loi={lf.loiCua(loiO, 'diem')}>
            <input className="field w-24 text-center tabular-nums" inputMode="decimal" value={diem} onChange={(e) => setDiem(e.target.value)} {...lf.o(loiO, 'diem')} />
          </Truong>
          <Truong nhan={t('Thang điểm')} batBuoc loi={lf.loiCua(loiO, 'thang')} phu={t('thang của bài · không quy đổi band')}>
            <input className="field w-24 text-center tabular-nums" inputMode="decimal" value={thang} onChange={(e) => setThang(e.target.value)} {...lf.o(loiO, 'thang')} />
          </Truong>
        </div>
        <Truong nhan={t('Tuần')} batBuoc loi={lf.loiCua(loiO, 'tuan')}>
          <ONgay kieu="tuan" value={tuan} onChange={setTuan} toiDa={homNay} id={lf.oId('tuan')} onBlur={lf.roi('tuan')} invalid={!!lf.loiCua(loiO, 'tuan')} />
        </Truong>
        <Truong nhan={t('Nhận xét')} tuyChon>
          <textarea className="field w-full" rows={3} maxLength={BAI_LOP_NHAN_XET_TOI_DA} value={nhanXet} onChange={(e) => setNhanXet(e.target.value)} />
        </Truong>
      </div>
    </KhungPanel>
    {hoiXoa && bai && (
      <KhungPanel tieuDe={t('Xoá dòng tiến độ này?')} longTrong z="z-[60]" onDong={() => !busy && setHoiXoa(false)}
        chan={{
          huy: { onClick: () => setHoiXoa(false), disabled: busy },
          chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void gui(true)}>{busy ? t('Đang xoá…') : t('Xoá')}</button>,
        }}>
        <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">{bai.tuanMa} · {bai.tenBai} · <span className="tabular-nums">{so(bai.diem)}/{so(bai.thang)}</span></p>
      </KhungPanel>
    )}
    </>
  );
}
