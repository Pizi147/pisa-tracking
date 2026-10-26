import { useLayoutEffect, useRef, useState } from 'react';
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
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';
import {
  BAI_LOP_NHAN_XET_TOI_DA, BAI_LOP_TEN_TOI_DA, chuDoiVang, mondayOfDate, soKyVong, tenMonNgan, tuanLich,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Ô đang chọn ở đầu hồ sơ: `overall` hoặc `category` của bảng kỹ năng (listening · reading · writing1 · writing2 · speaking · môn lớp thường). */
export type ChonKn = string;
export const OVERALL = 'overall';

/** Lượt của hồ sơ (`GET /students/:id` → `attempts`) — phần màn này đọc. */
type Luot = {
  id: number; attemptNo: number; kind: string; status: string; lichSu?: boolean; weekStart: string | null;
  overall: number | null; expectation: number | null; vangCu?: Record<string, string> | null;
};
type SEx = { diem: number; tuan: string; tuanMa: string };

const laMt0 = (a: Luot) => a.kind === 'mt0';
const tenLuot = (a: Luot) => (laMt0(a) ? 'MT0' : `MT${a.attemptNo}`);
/** Lượt tính trên trục: không huỷ, có tuần. */
const luotTruc = (attempts: Luot[]) => attempts.filter((a) => a.status !== 'cancelled' && !!a.weekStart);

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
  const ds = rows.filter((r) => !r.tuLopTruoc && (!mon || r.ratio || mon.includes(r.category)));
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
          phu={mon && a && a.overall == null ? null : a?.overall != null ? [a.expectation != null ? t('kỳ vọng {kv}', { kv: fmtBand(a.expectation) }) : null,
            truoc?.overall != null ? (truoc.overall === a.overall ? `= ${tenLuot(truoc)}` : `${tenLuot(truoc)} ${fmtBand(truoc.overall)}${lech(a.overall, truoc.overall)}`) : null].filter(Boolean).join(' · ') : t('chưa có điểm')}>
          {mon && a && a.overall == null ? <span className="py-1.5"><NhanKq kq="thieu">{t('Không đủ bộ môn')}</NhanKq></span>
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

/** Một điểm trên trục: lượt có điểm, lượt đã tới tuần mà chưa có điểm (khoảng trống có nhãn), hay lượt sắp tới. */
type Moc = { id: number; ten: string; tuan: string; v: number | null; kv: number | null; loai: 'diem' | 'trong' | 'sap'; chu?: string | null };

/**
 * BIỂU ĐỒ HÀNH TRÌNH MỘT KỸ NĂNG (khu c `.bieu`, `10` mục 5): chấm = điểm MT chính thức của em (màu theo kỳ vọng CHÍNH lượt đó), vạch đứt bậc thang mờ =
 * kỳ vọng từng lượt (`expectation` — đổi Target không tô lại lịch sử), trục dưới = mốc tuần, tuần này hồng. Lượt đã tới tuần mà chưa có điểm: vòng đứt +
 * "MT3 chưa có điểm" (không nối qua — khoảng thiếu để trống). Lượt sắp tới: vạch mờ + tên. Không line chart nhiều đường (W1, W2 là hai ô riêng).
 * Speaking: S Expert hồng cạnh điểm S (LUAT-NX-MT 7.1, không tính).
 */
export function BieuDoHanhTrinh({ studentId, row, attempts, homNay, tenKn }: {
  studentId: number; row: SkillBoardRow | null; attempts: Luot[]; homNay: string; tenKn: string;
}) {
  const sExApi = useApi<SEx[]>(row?.category === 'speaking' ? `/students/${studentId}/s-expert` : null, [studentId, row?.category]);
  const sEx = sExApi.data ?? [];
  const hep = useDienThoai();
  /* viewBox = bề rộng thật của khung → chữ trục giữ 12 px ở mọi cỡ màn (không phóng to theo SVG). */
  const khung = useRef<HTMLDivElement>(null);
  const [rong, setRong] = useState(0);
  useLayoutEffect(() => {
    const el = khung.current;
    if (!el) return undefined;
    const do_ = () => setRong(el.clientWidth);
    do_();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(do_);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const nay = mondayOfDate(homNay);
  const ds = luotTruc(attempts).sort((a, b) => a.weekStart!.localeCompare(b.weekStart!) || a.attemptNo - b.attemptNo);
  const moc: Moc[] = ds.map((a): Moc => {
    const tuan = mondayOfDate(a.weekStart!);
    const p = row ? row.points.find((x) => x.attemptNo === a.attemptNo && (x.attemptKind === 'mt0') === laMt0(a)) : null;
    const v = row ? p?.band ?? null : a.overall;
    const kv = row ? p?.expectation ?? a.expectation : a.expectation;
    if (v !== null) return { id: a.id, ten: tenLuot(a), tuan, v, kv: laMt0(a) ? null : kv, loai: 'diem' };
    if (tuan > nay) return { id: a.id, ten: tenLuot(a), tuan, v: null, kv: a.expectation, loai: 'sap' };
    const vang = row && a.vangCu?.[row.category] ? chuDoiVang(a.vangCu[row.category], homNay) : null;
    return { id: a.id, ten: tenLuot(a), tuan, v: null, kv: a.expectation, loai: 'trong', chu: vang };
  }).filter((m) => m.loai !== 'trong' || !laMt0(ds.find((a) => a.id === m.id)!));
  const sx = row?.category === 'speaking' ? sEx.map((x) => ({ ...x, tuan: mondayOfDate(x.tuan) })) : [];
  if (!moc.some((m) => m.loai === 'diem')) {
    /* Khung ho-so-hv `hv=moi`: nói lượt nào tới tuần nào — chưa có điểm không phải là không tiến bộ. */
    const lich = moc.map((m) => `${m.ten} ${tuanLich(m.tuan, homNay)}${m.loai === 'trong' ? ` (${t('chưa có điểm')})` : ''}`).join(' · ');
    return (
      <div ref={khung} className="px-4 py-6 text-center">
        <p className="m-0 text-[15px] font-semibold text-slate-100">{t('Chưa có điểm MT nào ở {kn}', { kn: tenKn })}</p>
        <p className="m-0 mt-1 text-[14px] text-slate-400">{lich ? `${lich} — ` : ''}{t('hành trình hiện từ lượt đầu có điểm; chưa có điểm không phải là không tiến bộ.')}</p>
      </div>
    );
  }

  /* Trục tuần: từ lượt đầu tới max(tuần này, lượt cuối); mỗi cột một tuần. */
  const tuanDau = [...moc.map((m) => m.tuan), ...sx.map((x) => x.tuan)].sort()[0];
  const tuanCuoi = [nay, ...moc.map((m) => m.tuan), ...sx.map((x) => x.tuan)].sort().at(-1)!;
  const tuan: string[] = [];
  for (let d = Date.parse(tuanDau); d <= Date.parse(tuanCuoi) && tuan.length < 80; d += 7 * 86_400_000) tuan.push(new Date(d).toISOString().slice(0, 10));
  if (tuan.length < 2) tuan.push(new Date(Date.parse(tuan[0]) + 7 * 86_400_000).toISOString().slice(0, 10));
  const W = Math.max(320, rong || (hep ? 343 : 1000)), H = hep ? 250 : 300, x0 = hep ? 40 : 56, x1 = W - (hep ? 24 : 40), y0 = 30, y1 = H - 64;
  const X = (iso: string) => x0 + ((x1 - x0) * Math.max(0, tuan.indexOf(iso))) / (tuan.length - 1);
  const so = [...moc.flatMap((m) => [m.v, m.kv]), ...sx.map((x) => x.diem)].filter((v): v is number => v !== null);
  let lo = Math.floor((Math.min(...so) - 0.5) * 2) / 2, hi = Math.ceil((Math.max(...so) + 0.5) * 2) / 2;
  if (hi - lo < 2) { lo = Math.max(0, lo - 0.5); hi = lo + 2; }
  const Y = (v: number) => y1 - ((y1 - y0) * (v - lo)) / (hi - lo);
  const buoc = hi - lo > 3 ? 1 : 0.5;
  const vach: number[] = [];
  for (let v = Math.ceil(lo / buoc) * buoc; v <= hi + 1e-9; v += buoc) vach.push(Math.round(v * 10) / 10);

  /* Kỳ vọng bậc thang: giữ mức của lượt trước tới tuần lượt sau. */
  const kvMoc = moc.filter((m) => m.kv !== null);
  let kvD = '';
  kvMoc.forEach((m, i) => { kvD += i === 0 ? `M${X(m.tuan)} ${Y(m.kv!)}` : ` H${X(m.tuan)} V${Y(m.kv!)}`; });
  if (kvMoc.length) kvD += ` H${X(tuan.at(-1)!)}`;
  /* Nối chấm liền nhau; lượt trống ở giữa thì không nối (khoảng thiếu để trống). */
  const noi: string[] = [];
  const thuTu = moc.filter((m) => m.loai !== 'sap');
  thuTu.forEach((m, i) => { const p = thuTu[i - 1]; if (p && p.loai === 'diem' && m.loai === 'diem') noi.push(`M${X(p.tuan)} ${Y(p.v!)} L${X(m.tuan)} ${Y(m.v!)}`); });
  const nhanTuan = (iso: string, i: number) => {
    const chu = tuanLich(iso, homNay);
    const dauThang = i === 0 || tuanLich(tuan[i - 1], homNay).split(' ')[1] !== chu.split(' ')[1];
    return dauThang ? chu : chu.split(' ')[0];
  };
  const thua = Math.ceil(tuan.length / Math.max(3, Math.floor((x1 - x0) / 64)));
  const mauCua = (m: Moc) => { const k = soKyVong(m.v, m.kv); return k ? `rgb(var(--kq-${k}-rgb))` : 'var(--text-dim)'; };
  const moTa = [
    ...moc.filter((m) => m.loai === 'diem').map((m) => `${m.ten} ${tuanLich(m.tuan, homNay)} ${fmtBand(m.v)}${m.kv !== null ? ` (${t('kỳ vọng {kv}', { kv: fmtBand(m.kv) })})` : ''}`),
    ...moc.filter((m) => m.loai === 'trong').map((m) => `${m.ten} ${t('chưa có điểm')}`),
  ].join('; ');
  return (
    <div ref={khung} className="px-4 pb-1 pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${tenKn}: ${moTa}`} className="block h-auto w-full" style={{ fontFamily: 'var(--phong-so, inherit)' }}>
        {tuan.map((w) => <line key={w} x1={X(w)} x2={X(w)} y1={y0 - 6} y2={y1} stroke="var(--line)" strokeDasharray="2 4" />)}
        {vach.map((v) => (
          <g key={v}>
            <line x1={x0 - 4} x2={x1} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
            <text x={x0 - 10} y={Y(v) + 4} textAnchor="end" fontSize="12" fill="var(--text-dim)">{v.toFixed(1)}</text>
          </g>
        ))}
        {kvD && <path d={kvD} fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeDasharray="4 4" opacity=".7" />}
        {kvMoc.length > 0 && <text x={X(tuan.at(-1)!)} y={Y(kvMoc.at(-1)!.kv!) - 8} textAnchor="end" fontSize="12" fill="var(--text-dim)">{t('kỳ vọng')}</text>}
        {noi.map((d) => <path key={d} d={d} fill="none" stroke="var(--accent-line)" strokeWidth="1.5" />)}
        {moc.map((m) => {
          const x = X(m.tuan);
          if (m.loai === 'sap') return (
            <g key={m.id}>
              <line x1={x} x2={x} y1={y0} y2={y1} stroke="var(--accent-line)" strokeDasharray="1 3" />
              <text x={x} y={y0 - 10} textAnchor="middle" fontSize="12" fill="var(--text-dim)">{m.ten}</text>
            </g>
          );
          if (m.loai === 'trong') {
            const y = Y(m.kv ?? (lo + hi) / 2);
            return (
              <g key={m.id}>
                <circle cx={x} cy={y} r="7" fill="none" stroke="var(--text-dim)" strokeDasharray="3 3" />
                <text x={x} y={y + 24} textAnchor={x > x1 - 60 ? 'end' : 'middle'} fontSize="12" fill="var(--text-dim)">{m.chu ? `${m.ten} · ${m.chu}` : t('{mt} chưa có điểm', { mt: m.ten })}</text>
              </g>
            );
          }
          const y = Y(m.v!);
          return (
            <g key={m.id}>
              <circle cx={x} cy={y} r="7" fill={mauCua(m)} stroke="var(--surface)" strokeWidth="2" />
              <text x={x} y={y > y0 + 24 ? y - 14 : y + 24} textAnchor={x > x1 - 40 ? 'end' : x < x0 + 30 ? 'start' : 'middle'} fontSize="13" fontWeight="700" fill="var(--text)">{m.ten} {fmtBand(m.v)}</text>
            </g>
          );
        })}
        {sx.map((s, i) => (
          <g key={`sx-${i}`}>
            <rect x={X(s.tuan) - 5} y={Y(s.diem) - 5} width="10" height="10" transform={`rotate(45 ${X(s.tuan)} ${Y(s.diem)})`} fill="var(--hong-nen)" stroke="var(--hong)" />
            <text x={X(s.tuan) + 10} y={Y(s.diem) + 4} fontSize="12" fill="var(--hong-chu)">S Ex {fmtBand(s.diem)}</text>
          </g>
        ))}
        {tuan.map((w, i) => (w === nay || i % thua === 0) && (
          <text key={w} x={X(w)} y={y1 + 22} textAnchor="middle" fontSize="12" fontWeight={w === nay ? 800 : 600} fill={w === nay ? 'var(--hong-chu)' : 'var(--text-dim)'}>{nhanTuan(w, i)}</text>
        ))}
        {tuan.includes(nay) && <text x={X(nay)} y={y1 + 40} textAnchor={X(nay) > x1 - 30 ? 'end' : 'middle'} fontSize="12" fill="var(--hong-chu)">{t('tuần này')}</text>}
      </svg>
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

/** Đầu khối Hành trình: "Hành trình · Reading" + dấu "?" (P1 — luật đọc biểu đồ không nằm trên màn). */
export function DauHanhTrinh({ tenKn }: { tenKn: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
      <h2 className="m-0 text-[15px] font-semibold text-slate-100">{t('Hành trình · {kn}', { kn: tenKn })}</h2>
      <NutLuat label={t('Cách đọc hành trình')}>
        {t('Chấm = điểm MT chính thức, màu theo kỳ vọng của chính lượt đó; vạch đứt = kỳ vọng từng lượt (đổi Target không tô lại lượt cũ). Vòng đứt = lượt đã tới tuần mà chưa có điểm. Tiến độ trên lớp ghi nguyên văn GV nhập, không vào MT / KPI.')}
      </NutLuat>
    </div>
  );
}
