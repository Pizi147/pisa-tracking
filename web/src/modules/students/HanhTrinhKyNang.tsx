import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { ODiem } from '../../ui/ODiem.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { BieuDoD, ChuGiaiD, kqSo, type CaseD, type DiemD, type ThiD } from './BieuDoD.tsx';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';
import {
  duongDotTest, mondayOfDate, ngay, soKyVong, tenBaiThuong, tuanLich,
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

/** Dòng phụ ô điểm một mẫu (mockup M5): "MT3 6.5 · ▲ 0.5" · "MT2 5.5 · =" — ▲ ▼ chỉ cho thay đổi điểm so mốc đứng trước. */
const soMoc = (moc: string, cu: number, moi: number) => {
  const d = Math.round((moi - cu) * 10) / 10;
  return `${moc} ${fmtBand(cu)} · ${d > 0 ? `▲ ${fmtBand(d)}` : d < 0 ? `▼ ${fmtBand(-d)}` : '='}`;
};
/** Kỹ năng bảng kỹ năng → `bands` của lượt (Writing gộp — so với thi thật W một số). */
const KN_BAND: Record<string, 'listening' | 'reading' | 'writing' | 'speaking'> = { listening: 'listening', reading: 'reading', writing1: 'writing', writing2: 'writing', speaking: 'speaking' };

/**
 * Ô ĐIỂM TO ĐẦU HỒ SƠ (UI-HO-SO-HV-2, mockup M5 `thiet-ke/v7/ho-so-hv.html`): Overall · L · R · W1 · W2 · S (lớp thường: từng môn) — bấm đổi kỹ năng của
 * Hành trình + Tiến độ + Case & PA (`aria-pressed`). Số từ máy chủ: Overall = lượt "Kết quả gần nhất" (`dauHoSo.o.ketQua`), kỹ năng = hàng bảng kỹ năng
 * (`band`, `expectation` của chính lượt). ✓ / ✗ so kỳ vọng của lượt (`soKyVong`). Dòng phụ MỘT mẫu "MT2 · kỳ vọng 7.5" (U02 dòng 2); kỹ năng dời do vắng:
 * "vắng W3 SEP" (7.4); môn em không còn học (P8): "—" + "không học từ MT4".
 * ĐÃ THI (chủ SP 27/10 — thi thật là kết quả quan trọng nhất, KHÔNG phải luật chặn): ô Thi thật thay ô Overall (màu lịch thi, so Target), bốn ô L · R · W · S
 * ghi "thi thật" ở góc, dòng phụ = MT cuối để so; chờ kết quả → ô "Chờ kết quả", ô kỹ năng giữ điểm MT, góc ghi nguồn.
 */
export function DiemDau({ rows, attempts, ketQuaId, chon, onChon, homNay, mon = null, thi = null }: {
  rows: SkillBoardRow[]; attempts: (Luot & { bands?: Record<string, number | null>; diemKn?: Record<string, number | null> })[];
  ketQuaId: number | null; chon: ChonKn; onChon: (k: ChonKn) => void; homNay: string | null;
  /** P8 (mockup k7): môn đăng ký của lộ trình (null = đủ) — hồ sơ chỉ vẽ ô môn em học; Overall thiếu bộ môn ghi "không đủ bộ môn". */
  mon?: readonly string[] | null;
  /** Thi thật của lộ trình (`thiThatCua`) — 'kq' / 'cho' đổi ô đầu; dự kiến / không thi: như đang học. */
  thi?: ThiThatD | 'khong' | null;
}) {
  const hep = useDienThoai();
  const ds = rows.filter((r) => !r.tuLopTruoc && (!mon || r.ratio || mon.includes(r.category) || r.band !== null));   // môn đã bỏ vẫn hiện (ô "không học")
  if (!ds.length) return null;
  const ratio = ds.some((r) => r.ratio);
  const daThi = !ratio && thi && thi !== 'khong' && thi.loai !== 'du-kien' ? thi : null;
  const luot = attempts.filter((x) => x.status !== 'cancelled' && !laMt0(x) && !!x.weekStart).sort((x, y) => x.weekStart!.localeCompare(y.weekStart!) || x.attemptNo - y.attemptNo);
  const a = attempts.find((x) => x.id === ketQuaId) ?? null;
  /* P8: lượt đầu sau lượt cuối có điểm của môn đã bỏ = "không học từ MTn". */
  const khongHocTu = (k: string) => {
    const cuoi = luot.map((x) => x.diemKn?.[k] != null).lastIndexOf(true);
    const dau = luot[cuoi + 1];
    return dau ? t('không học từ {mt}', { mt: tenLuot(dau) }) : t('không học');
  };
  const nguonKv = (mt: string, kv: number | null | undefined) => (kv != null ? t('{mt} · kỳ vọng {kv}', { mt, kv: fmtBand(kv) }) : mt);
  const lech = (v: number, tg: number) => (v > tg ? `+${fmtBand(v - tg)}` : v < tg ? `−${fmtBand(tg - v)}` : '=');
  const oDau = daThi ? (
    <ODiemTo key="thi" nhan={t('Thi thật IELTS')} goc={daThi.nhan} chon={chon === OVERALL} onClick={() => onChon(OVERALL)} thi
      phu={daThi.loai === 'kq' && daThi.diem.ovr != null && daThi.target != null ? `Target ${fmtBand(daThi.target)} · ${lech(daThi.diem.ovr, daThi.target)}` : null}>
      {daThi.loai === 'kq'
        ? <ODiem kieu="lon" so={daThi.diem.ovr != null ? fmtBand(daThi.diem.ovr) : null} kq={soKyVong(daThi.diem.ovr, daThi.target)} nhan={t('Thi thật')} kyVong={daThi.target != null ? `Target ${fmtBand(daThi.target)}` : undefined} />
        : <span className="py-1 text-[17px] font-bold text-[color:var(--lich-chu)]">{t('Chờ kết quả')}</span>}
    </ODiemTo>
  ) : !ratio && (
    /* U02 dòng 2 (PTA: bỏ chênh lệch — đã ở U07): MỘT dòng phụ "MT2 · kỳ vọng 7.5" — nguồn + mốc so. */
    <ODiemTo key="ov" nhan="Overall" chon={chon === OVERALL} onClick={() => onChon(OVERALL)}
      phu={a?.khongDuBoMon && a.overall == null ? (hep ? t('thiếu môn') : t('không đủ bộ môn'))
        : a?.overall == null ? t('chưa có điểm') : nguonKv(tenLuot(a), a.expectation)}>
      <ODiem kieu="lon" so={a?.overall != null ? fmtBand(a.overall) : null} kq={soKyVong(a?.overall, a?.expectation)} nhan="Overall" kyVong={a?.expectation != null ? fmtBand(a.expectation) : undefined} />
    </ODiemTo>
  );
  /* Đã có KQ thi thật: W một ô (thi thật W một số) — bấm vào ô Writing đang có (W2 trước). */
  const coKq = daThi?.loai === 'kq';
  const dsO = coKq ? ds.filter((r) => r.category !== 'writing1' || !ds.some((x) => x.category === 'writing2')) : ds;
  return (
    <div role="group" aria-label={t('Chọn kỹ năng xem hành trình')}
      className={`grid gap-2.5 ${ratio ? 'grid-cols-2 sm:grid-cols-4'
        : coKq ? 'grid-cols-2 min-[900px]:grid-cols-[1.6fr_repeat(4,1fr)] [&>*:first-child]:max-[899px]:col-span-2'
        : 'grid-cols-3 min-[900px]:grid-cols-[1.2fr_repeat(5,1fr)]'}`}>
      {oDau}
      {dsO.map((r) => {
        const kb = KN_BAND[r.category];
        if (coKq && kb) {
          const v = daThi!.diem[KN_THI[r.category]] ?? null;
          const mt = [...luot].reverse().find((x) => x.bands?.[kb] != null);
          const laW = kb === 'writing';
          return (
            <ODiemTo key={r.category} nhan={laW ? 'W' : r.short} title={laW ? 'Writing' : r.label} goc={t('thi thật')}
              chon={laW ? chon.startsWith('writing') : chon === r.category} onClick={() => onChon(laW && chon.startsWith('writing') ? chon : r.category)}
              phu={mt && v != null ? soMoc(tenLuot(mt), mt.bands![kb]!, v) : null}>
              <ODiem kieu="lon" so={v != null ? fmtBand(v) : null} kq={soKyVong(v, daThi!.target)} nhan={laW ? 'W' : r.short} kyVong={daThi!.target != null ? `Target ${fmtBand(daThi!.target)}` : undefined} />
            </ODiemTo>
          );
        }
        const boMon = !r.ratio && !!mon && !mon.includes(r.category);
        /* HSL-GON (chủ SP 05/11): không ghi "vắng W2 SEP" dưới điểm — ghi chú lịch chỉ ở màn Test; kỹ năng chưa điểm ghi "chưa có điểm". */
        const phu = boMon ? khongHocTu(r.category)
          : r.ratio ? (r.missed === false ? t('đạt') : r.missed === true ? t('chưa đạt') : t('chưa có điểm'))
          : r.band === null ? t('chưa có điểm')
            : r.bandAttemptNo ? nguonKv(`MT${r.bandAttemptNo}`, r.expectation) : null;
        return (
          <ODiemTo key={r.category} nhan={r.short} title={r.label} goc={daThi && !boMon && r.bandAttemptNo ? `MT${r.bandAttemptNo}` : undefined} chon={chon === r.category} onClick={() => onChon(r.category)} phu={phu}>
            {r.ratio
              ? <ODiem kieu="lon" so={r.score !== null ? String(r.score) : null} kq={r.missed === null ? null : r.missed ? 'duoi' : 'vuot'} nhan={r.short} phu={r.total ? `/ ${r.total}` : undefined} />
              : <ODiem kieu="lon" so={!boMon && r.band !== null ? fmtBand(r.band) : null} kq={boMon ? null : soKyVong(r.band, r.expectation)} kck={r.kck} nhan={r.short} kyVong={r.expectation != null ? fmtBand(r.expectation) : undefined} />}
          </ODiemTo>
        );
      })}
    </div>
  );
}

function ODiemTo({ nhan, goc, title, phu, chon, thi = false, onClick, children }: {
  nhan: string; /** Góc phải: nguồn số ("MT4 · W4 SEP", "thi thật", ngày thi). */ goc?: string; title?: string; phu?: string | null; chon: boolean;
  /** Ô Thi thật: viền + nền màu lịch thi (`--lich-*`), không nhầm Đạt. */ thi?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={chon} title={title} onClick={onClick}
      className={`flex min-w-0 flex-col items-stretch gap-0.5 rounded-[10px] border px-2.5 py-2.5 text-left max-sm:min-h-[44px] sm:px-3.5 ${chon
        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]'
        : 'border-[color:var(--line)] bg-[color:var(--surface)] hover:border-[color:var(--accent-line)]'}`}
      style={thi && !chon ? { borderColor: 'var(--lich-chu)', background: 'var(--lich-nen)' } : undefined}>
      <span className="flex min-w-0 items-baseline gap-2">
        <span className={`whitespace-nowrap text-[13px] font-semibold ${thi ? 'text-[color:var(--lich-chu)]' : 'text-slate-300'}`}>{nhan}</span>
        {goc && <span className={`ml-auto min-w-0 truncate text-[12px] tabular-nums text-slate-400 ${thi ? '' : 'max-sm:hidden'}`}>{goc}</span>}
      </span>
      <span className="flex">{children}</span>
      {/* U02 B1: một dòng "MT2 · kỳ vọng 7.5" — 375 chữ 11 px, không xuống dòng (cắt "…" + title khi quá hẹp). */}
      {phu && <span className="truncate whitespace-nowrap text-[12px] tabular-nums leading-4 text-slate-400" title={phu}>{phu}</span>}
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
      /* HSL-GON (chủ SP 05/11): dấu vắng giữ hình riêng trên biểu đồ, nhưng chữ không ghi "dời S · vắng W2 SEP" — ghi chú lịch chỉ ở màn Test. */
      const chu = !hocKn ? t('không học') : t('chưa có điểm');
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
      goi: { tieu: `Case ${tenKn}${(c.tenSos?.mt ?? c.attempts[0]?.attemptNo) != null ? ` · MT${c.tenSos?.mt ?? c.attempts[0]?.attemptNo}` : ''}${c.sosLevel ? ` · SOS ${c.sosLevel}` : ''}`, mo: onMoCase ? () => onMoCase(c.id) : undefined, dong: [c.title.replace(/\[[^\]]*\]\s*/g, '').trim(), `${t('mở {ngay}', { ngay: ngay(c.openedOn, homNay) })}${dong ? ` · ${t('đã đóng {ngay}', { ngay: ngay(dong, homNay) })}` : ''}`] },
      pa: c.plans.filter((p) => p.startedOn && p.status !== 'cancelled' && !p.chuaChay).sort((x, y) => x.startedOn!.localeCompare(y.startedOn!)).map((p, i) => {
        const den = p.completedOn;
        return {
          id: p.id, ten: `PA${i + 1}`, tu: p.startedOn!, den, denDk: den ? null : p.actionDue ?? p.followupDue, kq: p.lastOutcome,   // hạn kỳ tới = hạn ghi kết quả của ngăn Case (`actionDue`)
          goi: { tieu: `PA${i + 1} · ${dich(p.kindLabel)}`, mo: onMoCase ? () => onMoCase(c.id, p.id) : undefined, dong: [p.name, `${tuanLich(p.startedOn)} – ${den ? tuanLich(den) : t('nay')}${p.lastOutcomeLabel ? ` · ${dich(p.lastOutcomeLabel)}` : ''}`,
            ...(!den && (p.actionDue ?? p.followupDue) ? [t('hạn kế {ngay}', { ngay: ngay(p.actionDue ?? p.followupDue, homNay) })] : [])] },
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
export function HanhTrinhKn({ studentId, kn, row, attempts, cy, homNay, tenKn, tamDung, onMoCase, toTuan = null }: {
  studentId: number; kn: string; row: SkillBoardRow | null; attempts: LuotD[]; cy: LoTrinhD; homNay: string; tenKn: string;
  /** Mọi khoảng Tạm dừng (`dauHoSo.thongTin.khoangDung`). */
  tamDung?: { tu: string; den: string | null }[];
  /** Enter / "Mở Case" trên thanh Case / PA của chart → ngăn Case tại trang (cùng chỗ mở của Case & phương án). */
  onMoCase?: (caseId: number, paId?: number) => void;
  /** Tuần đang rê ở Tiến độ trên lớp — chart tô cột đó. */
  toTuan?: string | null;
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
        <h2 className="m-0 text-[17px] font-bold text-slate-100">{t('Hành trình · {kn}', { kn: tenKn })}</h2>
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
          <BieuDoD ten={tenKn} diem={d.diem} sex={d.sex} target={d.target} kvPhang={d.kvPhang} cases={d.cases} thi={d.thi} homNay={homNay} tamDung={tamDung} toTuan={toTuan} lo={d.lo} hi={d.hi} buoc={d.buoc} fmt={d.fmt} />
          <ChuGiaiD kq={cy.ratio ? 'thuong' : { vuot: d.diem.some((x) => kqSo(x.v, x.kv) === 'vuot'), bang: d.diem.some((x) => kqSo(x.v, x.kv) === 'bang'), duoi: d.diem.some((x) => kqSo(x.v, x.kv) === 'duoi') }}
            kvLuot={!cy.ratio && d.diem.some((x) => x.kv != null && x.kv !== (d.target?.filter((g) => !g.tu || g.tu <= x.tuan).at(-1)?.v ?? null))}
            vang={d.diem.some((x) => x.loai === 'vang')} thieu={d.diem.some((x) => x.loai === 'thieu')} tamDung={!!tamDung?.length} sex={d.sex.length > 0}
            pa={d.cases.flatMap((c) => c.pa.map((p) => p.kq).filter((k): k is string => !!k))}
            kyToi={d.cases.some((c) => c.pa.some((p) => !p.den && !!p.denDk && mondayOfDate(p.denDk) > mondayOfDate(homNay)))}
            thi={!d.thi ? null : d.thi.v != null ? 'kq' : d.thi.cho ? 'cho' : 'du-kien'} kvChu={d.kvPhang?.chu ?? 'Target'} />
          {!coDiem && <p className="m-0 px-4 pb-3 text-[13px] text-slate-400">{t('Chưa có điểm MT ở {kn}.', { kn: tenKn })}</p>}
        </>
      )}
    </>
  );
}

/**
 * Bảng đơn giản của kỹ năng (nút Bảng; 375): Lượt · Tuần · Band · Kỳ vọng · ± · Ghi chú — số hẹp, Ghi chú rộng nhất; vẽ bằng `Bang` (BANG-3).
 * 375: vẫn là bảng (không thẻ) — Tuần + Ghi chú xuống dòng phụ dưới Lượt. Hàng cuối Thi thật nổi nhất (`cuoi`).
 */
function BangKn({ kn, d, cy, homNay, hep }: { kn: string; d: ReturnType<typeof duLieuKn>; cy: LoTrinhD; homNay: string; hep: boolean }) {
  const gach = <span className="text-slate-500">—</span>;
  type Hang = { khoa: string; luot: React.ReactNode; tuan: string; band: React.ReactNode; kv: React.ReactNode; pm: React.ReactNode; gc: string | null; sap?: boolean };
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
  let thi: Hang | null = null;
  if (d.thi) {
    const v = d.thi.v, tg = d.thi.target, k = kqSo(v, tg);
    const d2 = v != null && tg != null ? Math.round((v - tg) * 10) / 10 : null;
    const th = thiThatCua(cy, homNay);
    thi = {
      khoa: 'thi', luot: t('Thi thật'),
      tuan: th && th !== 'khong' ? (th.loai === 'du-kien' ? t('dự kiến {thang}', { thang: th.nhan }) : th.nhan) : '',
      band: v != null ? <span style={{ color: k ? `rgb(var(--kq-${k}-rgb))` : undefined }}>{k === 'duoi' ? '✗ ' : k ? '✓ ' : ''}{fmtBand(v)}</span> : gach,
      kv: tg != null ? `Target ${fmtBand(tg)}` : gach, pm: d2 == null ? gach : <span className={d2 < 0 ? 'text-bad' : d2 > 0 ? 'text-ok' : ''}>{pm(d2)}</span>,
      gc: v != null ? (kn.startsWith('writing') ? t('W gộp') : null) : d.thi.cho ? t('chờ kết quả') : t('chưa thi'),
    };
  }
  /* 375: bốn cột vừa 343 px (không cuộn ngang); 1440: số hẹp, Ghi chú lấy phần còn lại. */
  const cotBang: CotBang[] = hep
    ? [{ key: 'luot', nhan: t('Lượt'), kieu: 'ten', rong: 136 }, { key: 'band', nhan: cy.ratio ? t('Điểm') : 'Band', kieu: 'diem', rong: 64 },   // "Progress Test ›" 112 px chữ + đệm 24
      { key: 'kv', nhan: cy.ratio ? t('Ngưỡng đạt') : t('Kỳ vọng'), kieu: 'so', rong: 84 }, { key: 'pm', nhan: '±', kieu: 'so', rong: 48 }]
    : [{ key: 'luot', nhan: t('Lượt'), kieu: 'ten', rong: 120 }, { key: 'tuan', nhan: t('Tuần'), kieu: 'tuan', rong: 170 },
      { key: 'band', nhan: cy.ratio ? t('Điểm') : 'Band', kieu: 'diem', rong: 96 }, { key: 'kv', nhan: cy.ratio ? t('Ngưỡng đạt') : t('Kỳ vọng'), kieu: 'so', rong: 110 },
      { key: 'pm', nhan: '±', kieu: 'so', rong: 72 }, { key: 'gc', nhan: t('Ghi chú'), kieu: 'chu' }];
  const o = (h: Hang, c: CotBang): React.ReactNode => {
    const x = c.key === 'luot' ? h.luot : c.key === 'tuan' ? h.tuan : c.key === 'band' ? h.band : c.key === 'kv' ? h.kv : c.key === 'pm' ? h.pm
      : <span className="whitespace-normal break-words text-slate-300">{h.gc ?? ''}</span>;
    return h.sap ? <span className="text-slate-400">{x}</span> : x;
  };
  const phu = (h: Hang, c: CotBang) => (hep && c.key === 'luot' ? <span className="whitespace-normal">{h.tuan}{h.gc ? ` · ${h.gc}` : ''}</span> : null);
  return (
    <Bang ten={t('Hành trình · {kn}', { kn })} khung={false} the375={false} deu={hep} cot={cotBang} hang={hang} khoa={(h) => h.khoa} oCua={o} phuCua={phu}
      cuoi={thi && (
        <tr className="hang-thi-that">
          {cotBang.map((c) => <OBang key={c.key} c={c}>{o(thi!, c)}{c.key === 'luot' && hep && <span className="bang-phu">{phu(thi!, c)}</span>}</OBang>)}
        </tr>
      )} />
  );
}
