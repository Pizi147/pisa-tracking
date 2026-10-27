import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dungTrucTuan, mondayOfDate, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';

/** Hộp nhỏ khi chạm / Tab / rê một dấu: dòng đậm đầu + các dòng + "Hồ sơ lượt ›" (`href`) hoặc "Mở Case" (`mo`, ngăn Case tại trang). Enter trên dấu = làm đúng việc đó. */
export type GoiD = { tieu: string; dong: string[]; href?: string; mo?: () => void; chuLink?: string };
/** Một lượt của kỹ năng: có điểm · vắng (dời / đang vắng) · chưa có điểm (đã tới tuần, chưa nhập) · không học (P8) · sắp tới. `chuDiem` = chữ thay số (lớp thường "18/25"). */
export type DiemD = { khoa: string; ten: string; tuan: string; v: number | null; kv: number | null; loai: 'diem' | 'vang' | 'thieu' | 'khong' | 'sap'; chu?: string | null; chuDiem?: string; goi: GoiD };
export type PaD = { id: number; ten: string; tu: string; den: string | null; denDk: string | null; kq: string | null; goi: GoiD };
export type CaseD = { id: number; chu: string; mt?: string | null; sos: number | null; mo: string; dong: string | null; goi: GoiD; pa: PaD[] };
/** Thi thật: đã có kết quả (`v`) · đã thi chờ kết quả (`cho`) · dự kiến theo tuần · dự kiến theo tháng (`thang` YYYY-MM → khối tháng). */
export type ThiD = { tuan: string | null; thang: string | null; v: number | null; cho: boolean; target: number | null; goi: GoiD };
export type BieuDoDProps = {
  ten: string; diem: DiemD[]; sex: { tuan: string; v: number; goi: GoiD }[];
  /** Target bậc thang (`tu` null = từ đầu) — FT. Lớp thường: `kvPhang` (ngưỡng đạt, một vạch phẳng). */
  target: { tu: string | null; v: number }[] | null; kvPhang?: { v: number; chu: string } | null;
  cases: CaseD[]; thi: ThiD | null; homNay: string;
  /** Mọi khoảng Tạm dừng của em (`den` null = đang dừng) — dải xám "Tạm dừng", không nối điểm qua. */
  tamDung?: { tu: string; den: string | null }[];
  /** UI-HO-SO-HV-2: tuần đang rê ở Tiến độ trên lớp (thứ Hai) — tô cột tuần đó. */
  toTuan?: string | null;
  lo: number; hi: number; buoc: number; fmt: (v: number) => string;
};

const NGAY = 86_400_000;
const cong = (iso: string, tuan: number) => new Date(Date.parse(iso) + tuan * 7 * NGAY).toISOString().slice(0, 10);
const maTuan = (iso: string) => tuanLich(iso).split(' ');   // ["W2", "OCT"] — tuần thuộc tháng chứa thứ Năm
/** Thứ Hai đầu và cuối của tháng YYYY-MM theo mã tuần (tuần thuộc tháng chứa thứ Năm). */
function tuanCuaThang(thang: string): [string, string] {
  let d = mondayOfDate(`${thang}-04`);
  while (Date.parse(d) + 3 * NGAY < Date.parse(`${thang}-01`)) d = cong(d, 1);
  const dau = d;
  while (new Date(Date.parse(cong(d, 1)) + 3 * NGAY).toISOString().slice(0, 7) === thang) d = cong(d, 1);
  return [dau, d];
}
/* Màu kết quả kỳ PA (ký hiệu ● ◐ ○ ✕ … vẽ ở `KyHieuPa`; ▲▼ dành cho thay đổi điểm). */
const MAU_PA: Record<string, string> = {
  improved: 'rgb(var(--ok-rgb))', partial: 'rgb(var(--soon-rgb))', unchanged: 'rgb(var(--bad-rgb))', worse: 'rgb(var(--bad-rgb))', insufficient: 'var(--text-dim)',
};
/** Ký hiệu kết quả PA vẽ bằng SVG (◐ không có trong phông Be Vietnam Pro / Inter — vẽ chữ thì ra mảnh vụn). */
export function KyHieuPa({ k, x, y, r = 5 }: { k: string; x: number; y: number; r?: number }) {
  const mau = MAU_PA[k] ?? 'var(--text-dim)';
  if (k === 'improved') return <circle cx={x} cy={y} r={r} fill={mau} />;
  if (k === 'partial') return <g><circle cx={x} cy={y} r={r - 0.75} fill="none" stroke={mau} strokeWidth="1.5" /><path d={`M${x} ${y - r + 0.75} A${r - 0.75} ${r - 0.75} 0 0 0 ${x} ${y + r - 0.75} Z`} fill={mau} /></g>;
  if (k === 'unchanged') return <circle cx={x} cy={y} r={r - 0.75} fill="none" stroke={mau} strokeWidth="1.5" />;
  if (k === 'worse') return <path d={`M${x - r + 1} ${y - r + 1} L${x + r - 1} ${y + r - 1} M${x + r - 1} ${y - r + 1} L${x - r + 1} ${y + r - 1}`} stroke={mau} strokeWidth="1.8" strokeLinecap="round" />;
  return <g fill={mau}>{[-1, 0, 1].map((i) => <circle key={i} cx={x + i * (r - 1)} cy={y + r - 1.5} r="1.2" />)}</g>;
}
const MAU_KQ = { vuot: 'rgb(var(--kq-vuot-rgb))', bang: 'rgb(var(--kq-bang-rgb))', duoi: 'rgb(var(--kq-duoi-rgb))' } as const;
/** ✓ / ✗ so kỳ vọng của lượt (vượt · bằng · dưới); `dat` = lớp thường so ngưỡng đạt: bằng ngưỡng là đạt (`ratioResult`), chỉ hai màu. */
export const kqSo = (v: number | null, kv: number | null, dat = false) => (v == null || kv == null ? null : dat ? (v >= kv - 1e-9 ? 'vuot' : 'duoi')
  : v > kv + 1e-9 ? 'vuot' : v < kv - 1e-9 ? 'duoi' : 'bang');
const PHONG = 'var(--phong, inherit)';

/**
 * CHART D — dòng thời gian MỘT kỹ năng (mockup `thiet-ke/v7/ho-so-hv.html` M5, chủ SP duyệt 27/10): trục hai tầng tháng (dải nền xen kẽ) → W1…W5 mọi cột →
 * hàng tên mốc (MT · S Ex · Thi · nay) đúng cột. Trong vùng vẽ chỉ có số band; dưới kỳ vọng: vạch đứt đỏ + "−x". Target bậc thang một nhãn. Tuần này = cột hồng.
 * Làn Case / PA chữ trong thanh, kết quả kỳ bằng ký hiệu. Thi thật là cột cuối (dự kiến: khối viền đứt; đã thi: cột xanh lơ, ◆ lớn). Cột < 26 px: bỏ hàng tuần,
 * số chỉ ở điểm mới nhất. > 260 tuần: khung 80 tuần + "‹ Xem trước đó" (`dungTrucTuan`).
 */
export function BieuDoD(o: BieuDoDProps) {
  const navigate = useNavigate();
  const khung = useRef<HTMLDivElement>(null);
  const [rong, setRong] = useState(0);
  const [lui, setLui] = useState(0);
  const [goi, setGoi] = useState<{ x: number; y: number; g: GoiD; re: boolean } | null>(null);
  /* Rê ra khỏi dấu: chờ 150 ms để chuột kịp vào hộp nhỏ (bấm "Hồ sơ lượt ›"); vào hộp thì giữ. */
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boHen = () => { if (hen.current) clearTimeout(hen.current); hen.current = null; };
  const dongRe = () => { boHen(); hen.current = setTimeout(() => setGoi((c) => (c?.re ? null : c)), 150); };
  useEffect(() => boHen, []);
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
  useBamNgoai(!!goi, () => setGoi(null), khung);
  useEffect(() => {
    if (!goi) return undefined;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setGoi(null); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [goi]);

  const nay = mondayOfDate(o.homNay);
  /* Dự kiến thi theo tháng → khối các tuần của tháng đó; còn lại một cột. */
  const thiKhoi = o.thi ? (o.thi.tuan ? [o.thi.tuan, o.thi.tuan] : o.thi.thang ? tuanCuaThang(o.thi.thang) : null) : null;
  const moc = [...o.diem.map((p) => p.tuan), ...o.sex.map((x) => x.tuan), ...o.cases.flatMap((c) => [c.mo, ...c.pa.map((p) => p.tu)]), ...(thiKhoi ?? [])];
  const { tuan: truc, coTruoc, coSau } = dungTrucTuan([cong([...moc].sort()[0] ?? nay, -1), ...(thiKhoi ? [] : [cong(nay, 1)]), ...moc], nay, lui);
  const t0 = truc[0], n = truc.length;
  /* Lề trái: chữ "Case" / "PA" của làn chỉ khi có Case; không thì chỉ chỗ số trục. */
  const W = Math.max(560, rong || 1000), nhanW = o.cases.length ? 58 : 12, x0 = nhanW + 30, x1 = W - 92, cw = (x1 - x0) / n, day_ = cw < 26;
  const cot = (iso: string) => Math.round((Date.parse(mondayOfDate(iso)) - Date.parse(t0)) / (7 * NGAY));
  const trong = (iso: string) => { const c = cot(iso); return c >= 0 && c < n; };
  const Xl = (iso: string) => x0 + Math.min(n, Math.max(0, cot(iso))) * cw;
  const Xc = (iso: string) => Xl(iso) + cw / 2;
  /* Case chồng thời gian → làn riêng (mỗi làn một hàng Case + một hàng PA nếu có): không Case nào bị che. */
  const lan: { cs: CaseD[]; het: number; coPa: boolean; paHang?: Map<number, number>; soHang?: number }[] = [];
  const hetPa = (p: PaD) => cot(p.den ?? (p.denDk && p.denDk > nay ? p.denDk : nay));
  [...o.cases].sort((a, b) => a.mo.localeCompare(b.mo) || (a.mt ?? '').localeCompare(b.mt ?? '', 'en', { numeric: true }) || a.id - b.id).forEach((c) => {
    const dau = cot(c.mo), het = Math.max(cot(c.dong ?? nay), ...c.pa.map(hetPa));
    const l = lan.find((x) => x.het < dau);
    if (l) { l.cs.push(c); l.het = Math.max(l.het, het); l.coPa ||= c.pa.length > 0; } else lan.push({ cs: [c], het, coPa: c.pa.length > 0 });
  });
  const py0 = 34, py1 = py0 + 170, wy = py1 + 17, mky = py1 + (day_ ? 17 : 35);
  /* PA chạy song song trong một làn → hàng PA riêng (cùng cách chia làn). */
  lan.forEach((l) => {
    const hang: number[] = [];
    l.paHang = new Map();
    l.cs.flatMap((c) => c.pa).sort((a, b) => a.tu.localeCompare(b.tu)).forEach((p) => {
      let i = hang.findIndex((h) => h < cot(p.tu));
      if (i < 0) { i = hang.length; hang.push(0); }
      hang[i] = hetPa(p); l.paHang!.set(p.id, i);
    });
    l.soHang = hang.length;
  });
  const lanY: { cy: number; pyy: number }[] = [];
  let yLan = mky + 24;
  lan.forEach((l) => { lanY.push({ cy: yLan, pyy: yLan + 30 }); yLan += 34 + 30 * (l.soHang ?? 0); });
  const H = lan.length ? yLan - 18 : mky + 10;
  const Y = (v: number) => py1 - ((py1 - py0) * (v - o.lo)) / (o.hi - o.lo);
  const fmt = o.fmt;

  /* Rê chuột mở → rời chuột đóng; chạm / Tab mở → giữ tới khi bấm ra ngoài hoặc Esc. */
  const mo = (x: number, y: number, g: GoiD, re = false) => { boHen(); setGoi({ x, y, g, re }); };
  /** Dấu bấm / Tab được; `hop` = vùng chạm (mặc định 28 px quanh tâm; thanh Case / PA = chính thanh, vòng focus ôm thanh). */
  const dau = (k: string, x: number, y: number, g: GoiD, noi: ReactNode, hop?: { x: number; y: number; w: number; h: number }) => (
    <g key={k} className="diem-d" tabIndex={0} role="button" aria-label={[g.tieu, ...g.dong].join(' · ')} style={{ cursor: 'pointer', outline: 'none' }}
      onMouseEnter={() => mo(x, y, g, true)} onMouseLeave={dongRe}
      onFocus={() => mo(x, y, g)} onClick={() => mo(x, y, g)}
      onKeyDown={(e) => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); setGoi(null); if (g.href) navigate(g.href); else g.mo?.(); }}>
      <rect x={hop?.x ?? x - 14} y={hop?.y ?? y - 14} width={hop?.w ?? 28} height={hop?.h ?? 28} fill="transparent" />
      {noi}
    </g>
  );

  /* tầng tháng: dải nền xen kẽ + vạch đầu tháng + tên tháng (năm ở tháng đầu / JAN khi trục qua năm) */
  const dai: { th: string; tu: number; den: number; nam: string }[] = [];
  truc.forEach((w, i) => {
    const [, th] = maTuan(w), nam = new Date(Date.parse(w) + 3 * NGAY).toISOString().slice(0, 4);
    const cuoi = dai.at(-1);
    if (cuoi && cuoi.th === th) cuoi.den = i; else dai.push({ th, tu: i, den: i, nam });
  });
  const quaNam = dai.length > 0 && dai[0].nam !== dai.at(-1)!.nam;
  const mucTai = (iso: string) => { let v: number | null = null; (o.target ?? []).forEach((g) => { if (!g.tu || g.tu <= iso) v = g.v; }); return v; };
  const ve: ReactNode[] = [];
  const nen: ReactNode[] = [];
  dai.forEach((d, k) => {
    const a = x0 + d.tu * cw, b = x0 + (d.den + 1) * cw;
    if (k % 2 === 0) nen.push(<rect key={`d${k}`} x={a} y={0} width={b - a} height={H} fill="var(--surface-2)" />);
    if (k > 0) nen.push(<line key={`v${k}`} x1={a} x2={a} y1={0} y2={H} stroke="var(--line)" />);
    let chu = d.th + (quaNam && (k === 0 || d.th === 'JAN') ? ` ${d.nam}` : '');
    if (b - a <= chu.length * 7.5 && chu.includes(' ')) chu = d.nam;
    if (b - a > chu.length * 7.5) nen.push(<text key={`t${k}`} x={(a + b) / 2} y={17} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-dim)" fontFamily={PHONG}>{chu}</text>);
  });
  if (o.toTuan && trong(o.toTuan)) nen.push(<rect key="re" x={Xl(o.toTuan)} y={0} width={cw} height={H} fill="var(--accent)" opacity=".16" />);
  if (trong(nay)) nen.push(<rect key="nay" x={Xl(nay)} y={0} width={cw} height={H} fill="var(--hong)" opacity=".14" />);
  const thiTrong = thiKhoi && trong(thiKhoi[0]);
  if (o.thi && thiKhoi && thiTrong) {
    const a = Xl(thiKhoi[0]), b = Xl(thiKhoi[1]) + cw;
    if (o.thi.v != null || o.thi.cho) nen.push(<rect key="thi" x={a} y={24} width={b - a} height={H - 24} fill="var(--lich-nen)" />);
    else nen.push(<rect key="thi" x={a + 1} y={24} width={b - a - 2} height={mky + 8 - 24} rx="4" fill="var(--lich-nen)" fillOpacity=".45" stroke="var(--lich-vien)" strokeDasharray="5 4" />);
  }
  /* Tạm dừng: dải xám trong vùng vẽ + chữ, cắt nối điểm */
  const dungXem = (o.tamDung ?? []).map((k) => ({ tu: mondayOfDate(k.tu), den: mondayOfDate(k.den ?? o.homNay) })).filter((k) => k.den >= t0 && k.tu <= truc.at(-1)!);
  dungXem.forEach((k, i) => {
    const a = Xl(k.tu < t0 ? t0 : k.tu), b = Xl(k.den) + cw;
    nen.push(<g key={`td${i}`} aria-hidden>
      <rect x={a} y={py0} width={b - a} height={py1 - py0} fill="var(--surface-2)" />
      {b - a > 70 && <text x={(a + b) / 2} y={(py0 + py1) / 2 + 4} textAnchor="middle" fontSize="12" fill="var(--text-dim)" fontFamily={PHONG}>{t('Tạm dừng')}</text>}
    </g>);
  });
  /* trục ngang dưới mọi dấu (không che dấu vắng / thiếu điểm nằm trên trục) */
  nen.push(<line key="truc" x1={x0} x2={x1} y1={py1} y2={py1} stroke="var(--line-strong)" />);
  /* lưới ngang + số trục */
  for (let v = o.lo; v <= o.hi + 1e-9; v += o.buoc) {
    ve.push(<line key={`l${v}`} x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeOpacity=".7" />);
    ve.push(<text key={`s${v}`} x={x0 - 8} y={Y(v) + 4} textAnchor="end" fontSize="12" fill="var(--text-dim)">{fmt(v)}</text>);
  }
  /* Target bậc thang (đứt), một nhãn đầu phải · lớp thường: ngưỡng phẳng */
  if (o.target?.length) {
    let d = `M${x0} ${Y(mucTai(t0) ?? o.target[0].v)}`;
    o.target.filter((g) => g.tu && g.tu > t0 && trong(g.tu)).forEach((g) => { d += ` H${Xl(g.tu!)} V${Y(g.v)}`; });
    d += ` H${x1}`;
    const vc = mucTai(truc.at(-1)!) ?? o.target.at(-1)!.v;
    ve.push(<path key="tg" d={d} fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeDasharray="6 4" />);
    ve.push(<text key="tgc" x={x1 + 8} y={Y(vc) + 4} fontSize="12" fontWeight="700" fill="var(--text)" fontFamily={PHONG}>{`Target ${fmt(vc)}`}</text>);
  }
  if (o.kvPhang) {
    ve.push(<line key="kp" x1={x0} x2={x1} y1={Y(o.kvPhang.v)} y2={Y(o.kvPhang.v)} stroke="var(--text-dim)" strokeWidth="1.5" strokeDasharray="6 4" />);
    ve.push(<text key="kpc" x={x1 + 8} y={Y(o.kvPhang.v) + 4} fontSize="12" fontWeight="700" fill="var(--text)" fontFamily={PHONG}>{o.kvPhang.chu}</text>);
  }
  const xem = o.diem.filter((p) => trong(p.tuan));
  /* vạch kỳ vọng lượt (ngắn, đúng cột) — bỏ khi trùng Target lúc đó */
  if (!o.kvPhang) xem.forEach((p) => {
    if (p.kv != null && p.kv !== mucTai(p.tuan)) ve.push(<line key={`kv${p.khoa}`} x1={Xc(p.tuan) - cw * 0.34} x2={Xc(p.tuan) + cw * 0.34} y1={Y(p.kv)} y2={Y(p.kv)} stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" opacity={p.loai === 'sap' ? 0.35 : 0.8} />);
  });
  /* nối chấm liền nhau; lượt trống ở giữa thì không nối */
  const thu = xem.filter((p) => p.loai !== 'sap' && p.loai !== 'khong');   // không học (P8) không phải khoảng thiếu — nối qua
  thu.forEach((p, k) => {
    const q = thu[k - 1];
    if (q?.loai === 'diem' && p.loai === 'diem' && !dungXem.some((k) => q.tuan < k.tu && p.tuan > k.den)) ve.push(<line key={`n${p.khoa}`} x1={Xc(q.tuan)} y1={Y(q.v!)} x2={Xc(p.tuan)} y2={Y(p.v!)} stroke="var(--accent)" strokeOpacity=".4" strokeWidth="2" />);
  });
  const cuoi = thu.filter((p) => p.loai === 'diem').at(-1);
  const lech = (k: string, x: number, y: number, yk: number, chu: string, trai = false) => (
    <g key={k} aria-hidden>
      <line x1={x} x2={x} y1={y - 8} y2={yk} stroke="rgb(var(--bad-rgb))" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x={trai ? x - 8 : x + 8} y={(y + yk) / 2 + 4} textAnchor={trai ? 'end' : 'start'} fontSize="12" fontWeight="700" fill="rgb(var(--bad-rgb))">−{chu}</text>
    </g>
  );
  xem.forEach((p) => {
    if (p.loai === 'sap') return;
    const x = Xc(p.tuan);
    if (p.loai === 'khong') {
      /* Tab / đọc màn tới được cả lượt không học */
      ve.push(dau(p.khoa, x, py1 - 12, p.goi, <text x={x} y={py1 - 8} textAnchor="middle" fontSize="12" fill="var(--text-dim)" fontFamily={PHONG}>{p.chu}</text>,
        { x: x - 32, y: py1 - 24, w: 64, h: 22 }));
      return;
    }
    if (p.loai === 'vang') {
      ve.push(dau(p.khoa, x, py1, p.goi, <circle cx={x} cy={py1} r="6" fill="var(--surface)" stroke="var(--text-dim)" strokeWidth="1.5" strokeDasharray="3 2.5" />));
      return;
    }
    if (p.loai === 'thieu') {   // chưa có điểm = việc còn nợ, khác vắng: vòng liền + "?"
      ve.push(dau(p.khoa, x, py1, p.goi, <>
        <circle cx={x} cy={py1} r="7" fill="var(--surface)" stroke="rgb(var(--soon-rgb))" strokeWidth="1.5" />
        <text x={x} y={py1 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="rgb(var(--soon-rgb))">?</text>
      </>));
      return;
    }
    const kv = o.kvPhang ? o.kvPhang.v : p.kv, k = kqSo(p.v, kv, !!o.kvPhang), y = Y(p.v!);
    if (k === 'duoi' && !day_) ve.push(lech(`lc${p.khoa}`, x, y, Y(kv!), o.kvPhang ? `${Math.round(kv! - p.v!)} %` : fmt(kv! - p.v!)));
    ve.push(dau(p.khoa, x, y, p.goi, <circle cx={x} cy={y} r={day_ ? 4.5 : 6} fill={k ? MAU_KQ[k] : 'var(--text-dim)'} stroke="var(--surface)" strokeWidth="2" />));
    if (!day_ || p === cuoi) ve.push(<text key={`c${p.khoa}`} x={x} y={k === 'duoi' && Y(kv!) < y ? y + 21 : y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" aria-hidden>{p.chuDiem ?? fmt(p.v!)}</text>);
  });
  o.sex.filter((q) => trong(q.tuan)).forEach((q, i) => {
    const x = Xc(q.tuan), y = Y(q.v);
    ve.push(dau(`sx${i}`, x, y, q.goi, <rect x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} fill="var(--surface)" stroke="var(--hong)" strokeWidth="1.8" />));
    if (!day_) ve.push(<text key={`sxc${i}`} x={x} y={y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" aria-hidden>{fmt(q.v)}</text>);
  });
  /* thi thật: có kết quả → ◆ lớn + số đậm (vạch đỏ tới Target nếu chưa đạt) · chờ → ◇ viền đứt ở mức Target · dự kiến → dấu vô hình (hộp) giữa khối */
  if (o.thi && thiKhoi && thiTrong) {
    const xt = (Xl(thiKhoi[0]) + Xl(thiKhoi[1]) + cw) / 2;
    if (o.thi.v != null) {
      const yt = Y(o.thi.v), tg = o.thi.target;
      if (tg != null && o.thi.v < tg) ve.push(lech('thilc', xt, yt, Y(tg), fmt(tg - o.thi.v), true));
      ve.push(dau('thi', xt, yt, o.thi.goi, <rect x={xt - 8} y={yt - 8} width="16" height="16" transform={`rotate(45 ${xt} ${yt})`} fill="var(--lich-chu)" stroke="var(--surface)" strokeWidth="2" />));
      ve.push(<text key="thic" x={xt} y={tg != null && o.thi.v < tg ? yt + 24 : yt - 14} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text)" aria-hidden>{fmt(o.thi.v)}</text>);
    } else {   // chờ KQ / dự kiến: chỉ cột; vùng chạm = chính cột / khối (vòng focus ôm cột)
      const a = Xl(thiKhoi[0]), b = Xl(thiKhoi[1]) + cw;
      ve.push(dau('thi', xt, py1 - 10, o.thi.goi, null, { x: a + 1, y: py0, w: b - a - 2, h: py1 - py0 }));
    }
  }
  /* trục: W1…W5 mọi cột (đậm ở cột có mốc) + hàng tên mốc đúng cột */
  const coMoc = new Set([...xem.map((p) => mondayOfDate(p.tuan)), ...o.sex.map((q) => mondayOfDate(q.tuan)), ...(o.thi?.tuan ? [mondayOfDate(o.thi.tuan)] : [])]);
  if (!day_) truc.forEach((w, i) => {
    const la = w === nay, cm = coMoc.has(w);
    ve.push(<text key={`w${w}`} x={x0 + (i + 0.5) * cw} y={wy} textAnchor="middle" fontSize="12" fill={la ? 'var(--hong-chu)' : cm ? 'var(--text-dim)' : 'var(--text-faint, var(--text-dim))'} fontWeight={la || cm ? 700 : 400} aria-hidden>{maTuan(w)[0]}</text>);
  });
  /* Lượt đúng tuần này: "MT3 · nay" một nhãn hồng (không để "nay" nuốt tên lượt). */
  const nayLuot = xem.find((p) => mondayOfDate(p.tuan) === nay);
  const nhanMoc: [number, string, string, number][] = xem.map((p) => [Xc(p.tuan), p === nayLuot ? `${p.ten} · ${t('nay')}` : p.ten,
    p === nayLuot ? 'var(--hong-chu)' : p.loai === 'sap' ? 'var(--text-faint, var(--text-dim))' : 'var(--text-dim)', p === nayLuot ? 2 : 0]);
  o.sex.filter((q) => trong(q.tuan)).forEach((q) => nhanMoc.push([Xc(q.tuan), 'S Ex', 'var(--text-dim)', 0]));
  if (o.thi && thiKhoi && thiTrong) {
    const rongKhoi = Xl(thiKhoi[1]) + cw - Xl(thiKhoi[0]);
    nhanMoc.push([(Xl(thiKhoi[0]) + Xl(thiKhoi[1]) + cw) / 2, o.thi.v != null || o.thi.cho ? t('Thi thật') : rongKhoi > 90 ? t('Dự kiến thi') : t('Thi'), 'var(--lich-chu)', 3]);
  }
  if (trong(nay) && !nayLuot) nhanMoc.push([Xc(nay), t('nay'), 'var(--hong-chu)', 2]);
  nhanMoc.sort((a, b) => b[3] - a[3] || b[0] - a[0]);
  const dung: number[] = [];
  nhanMoc.forEach(([x, chu, mau]) => {
    const r = chu.length * 3.6 + 4;
    if (dung.some((u) => Math.abs(u - x) < r + 22)) return;
    dung.push(x);
    ve.push(<text key={`m${x}${chu}`} x={x} y={mky} textAnchor="middle" fontSize="12" fontWeight="700" fill={mau} fontFamily={PHONG} aria-hidden>{chu}</text>);
  });
  /* làn Case · PA — chữ trong thanh */
  const thanh = (k: string, a: number, b: number, y: number, nenT: string, vien: string, chu: string, mauChu: string, g: GoiD, mong = false, kq: string | null = null) => {
    const w2 = Math.max(6, b - a), rongChu = chu.length * 7.4;   // 12 px / 700, ước lượng rộng chữ
    return dau(k, (a + b) / 2, y, g, <>
      <rect x={a} y={y - 11} width={w2} height="22" rx="5" fill={nenT} stroke={vien} strokeWidth={mong ? 1 : 1.5} />
      {w2 > rongChu + (kq ? 18 : 0) + 12 && <text x={a + 8} y={y + 4} fontSize="12" fontWeight="700" fill={mauChu} fontFamily={PHONG}>{chu}</text>}
      {kq && w2 > rongChu + 32 && <KyHieuPa k={kq} x={a + 8 + rongChu + 9} y={y} />}
    </>, { x: a - 2, y: y - 13, w: w2 + 4, h: 26 });
  };
  lan.forEach((l, li) => {
    const { cy, pyy } = lanY[li];
    ve.push(<text key={`lc${li}`} x={0} y={cy + 4} fontSize="13" fontWeight="700" fill="var(--text-dim)" fontFamily={PHONG}>Case</text>);
    if (l.coPa) ve.push(<text key={`lp${li}`} x={0} y={pyy + 4} fontSize="13" fontWeight="700" fill="var(--text-dim)" fontFamily={PHONG}>{t('PA')}</text>);   // một nhãn cho mọi hàng PA của làn
    l.cs.forEach((c) => {
      const dong = !!c.dong, s2 = (c.sos ?? 0) >= 2;
      const mauV = s2 ? 'rgb(var(--sos2-rgb))' : 'rgb(var(--sos1-rgb))';
      const chu = `Case ${c.chu}${c.mt ? ` · ${c.mt}` : ''}${dong ? ` · ${t('đã đóng')}` : c.sos ? ` · SOS ${c.sos}` : ''}`;
      ve.push(thanh(`c${c.id}`, Xl(c.mo) + 2, Xl(c.dong ?? nay) + cw - 2, cy, dong ? 'var(--surface)' : s2 ? 'var(--sos2-nen)' : 'var(--surface)', dong ? 'var(--line-strong)' : mauV,
        chu, dong ? 'var(--text-dim)' : s2 ? 'rgb(var(--sos2-chu-rgb))' : 'rgb(var(--sos1-chu-rgb))', c.goi, dong));
      c.pa.forEach((p) => {
        const pyy = lanY[li].pyy + 30 * (l.paHang!.get(p.id) ?? 0);
        if (!p.den && p.denDk && cot(p.denDk) > cot(nay) && trong(nay)) {
          const a = Xl(nay) + cw, b = Xl(p.denDk) + cw;
          ve.push(<g key={`pk${p.id}`} aria-hidden>
            <rect x={a} y={pyy - 11} width={Math.max(4, b - a - 2)} height="22" rx="5" fill="none" stroke="var(--accent)" strokeDasharray="4 3" opacity=".7" />
            {b - a > 60 && <text x={a + 8} y={pyy + 4} fontSize="12" fill="var(--text-dim)" fontFamily={PHONG}>{t('kỳ tới')}</text>}
          </g>);
        }
        ve.push(thanh(`p${p.id}`, Xl(p.tu) + 2, Xl(p.den ?? nay) + cw - 2, pyy, 'var(--accent-soft)', 'var(--accent)', p.ten, 'var(--accent)', p.goi, false, p.kq && MAU_PA[p.kq] ? p.kq : null));
      });
    });
  });

  /* hộp nhỏ: đặt dưới dấu, kẹp trong khung */
  const goiX = goi ? Math.min(Math.max(8, goi.x - 90), W - 290) : 0;
  return (
    <div ref={khung} className="relative px-3.5 pb-2.5 pt-1.5">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={t('Dòng thời gian {kn}', { kn: o.ten })} className="block h-auto w-full overflow-visible"
        style={{ fontFamily: 'var(--phong-so, inherit)' }}>
        {nen}{ve}
      </svg>
      {goi && (
        <div aria-hidden onMouseEnter={boHen} onMouseLeave={dongRe} className="absolute z-20 grid min-w-[180px] max-w-[280px] gap-0.5 rounded-[10px] border px-3 py-2 text-[13px] shadow-xl"
          style={{ left: goiX + 14, top: goi.y + 32, background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <b className="text-[14px] text-slate-100">{goi.g.tieu}</b>
          {goi.g.dong.map((d, i) => <span key={i} className={i === goi.g.dong.length - 1 && goi.g.dong.length > 1 && !goi.g.href ? 'text-slate-400' : 'text-slate-300'}>{d}</span>)}
          {goi.g.href && <Link to={goi.g.href} tabIndex={-1} className="link mt-1 text-[13px] font-semibold">{goi.g.chuLink ?? t('Mở hồ sơ lượt ›')}</Link>}
          {goi.g.mo && <button type="button" tabIndex={-1} className="link mt-1 justify-self-start appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold" onClick={() => { setGoi(null); goi.g.mo!(); }}>{goi.g.chuLink ?? t('Mở Case')}</button>}
        </div>
      )}
      {(coTruoc || coSau) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {coTruoc ? <button type="button" className="btn btn-sm" onClick={() => setLui(lui + 1)}>{t('‹ Xem trước đó')}</button> : <span />}
          {coSau && <button type="button" className="btn btn-sm" onClick={() => setLui(0)}>{t('Về gần nhất ›')}</button>}
        </div>
      )}
    </div>
  );
}

/** Chú giải dưới chart (chỉ mục có trên chart; đọc màn bỏ qua — mỗi dấu đã có tên riêng). */
export function ChuGiaiD({ kq, kvLuot, vang, thieu, tamDung, sex, pa, kyToi = false, thi, kvChu }: {
  kq: { vuot: boolean; bang: boolean; duoi: boolean } | 'thuong'; kvLuot: boolean; vang: boolean; thieu: boolean; tamDung: boolean; sex: boolean;
  /** Có khung đứt "kỳ tới" (PA đang chạy, hạn ghi kết quả sau tuần này). */
  kyToi?: boolean;
  /** Mã kết quả PA có trên chart (chỉ giải thích ký hiệu đang thấy). */
  pa: string[];
  thi: 'kq' | 'cho' | 'du-kien' | null; kvChu: string;
}) {
  const c = (x: ReactNode) => <svg viewBox="0 0 18 12" width="18" height="12" className="overflow-visible" aria-hidden>{x}</svg>;
  const cham = (mau: string, chu: string) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<circle cx="9" cy="6" r="5" fill={mau} />)}{chu}</span>;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 text-[12px] text-slate-300" aria-hidden>
      {kq === 'thuong' ? <>{cham(MAU_KQ.vuot, t('đạt'))}{cham(MAU_KQ.duoi, t('chưa đạt'))}</> : <>
        {kq.vuot && cham(MAU_KQ.vuot, t('vượt kỳ vọng'))}{kq.bang && cham(MAU_KQ.bang, t('bằng kỳ vọng'))}{kq.duoi && cham(MAU_KQ.duoi, t('dưới kỳ vọng'))}
      </>}
      {kvLuot && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<line x1="3" x2="15" y1="6" y2="6" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />)}{t('kỳ vọng lượt')}</span>}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<line x1="0" x2="18" y1="6" y2="6" stroke="var(--text-dim)" strokeWidth="1.5" strokeDasharray="5 3" />)}{kvChu}</span>
      {thieu && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<><circle cx="9" cy="6" r="5.5" fill="none" stroke="rgb(var(--soon-rgb))" strokeWidth="1.5" /><text x="9" y="9" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgb(var(--soon-rgb))">?</text></>)}{t('chưa có điểm')}</span>}
      {tamDung && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="0" y="1" width="18" height="10" fill="var(--surface-2)" stroke="var(--line-strong)" />)}{t('Tạm dừng')}</span>}
      {vang && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<circle cx="9" cy="6" r="4.5" fill="none" stroke="var(--text-dim)" strokeDasharray="2.5 2" />)}{t('vắng · dời')}</span>}
      {sex && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="5" y="2" width="8" height="8" transform="rotate(45 9 6)" fill="none" stroke="var(--hong)" strokeWidth="1.6" />)}{t('S Ex (không tính)')}</span>}
      {pa.length > 0 && <span className="inline-flex items-center gap-1 whitespace-nowrap">{t('PA')} {(['improved', 'partial', 'unchanged', 'worse', 'insufficient'] as const).filter((k) => pa.includes(k)).map((k, i) => (
        <span key={k} className="inline-flex items-center gap-1">{i > 0 && ' · '}<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden><KyHieuPa k={k} x={6} y={6} /></svg>{{ improved: t('rõ'), partial: t('một phần'), unchanged: t('không'), worse: t('kém hơn'), insufficient: t('chưa đủ dữ liệu') }[k]}</span>
      ))}</span>}
      {kyToi && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="0.5" y="1.5" width="17" height="9" rx="2" fill="none" stroke="var(--accent)" strokeDasharray="3 2" />)}{t('kỳ tới')}</span>}
      {thi === 'kq' && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="5" y="2" width="8" height="8" transform="rotate(45 9 6)" fill="var(--lich-chu)" />)}{t('thi thật')}</span>}
      {thi === 'cho' && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="0" y="0" width="18" height="12" fill="var(--lich-nen)" />)}{t('thi thật · chờ kết quả')}</span>}
      {thi === 'du-kien' && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{c(<rect x="0.5" y="0.5" width="17" height="11" rx="2" fill="var(--lich-nen)" stroke="var(--lich-vien)" strokeDasharray="3 2" />)}{t('dự kiến thi')}</span>}
    </div>
  );
}
