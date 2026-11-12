import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { chuTuan, ngay, phanTramTron, soSanhDiem, tuanLich, type KhoangTuanDay, type KnDay, type KnTuanDay, type TuanDayKq } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useApi } from '../lib/useApi.ts';
import { fmtBand } from '../lib/format.ts';
import { HopNeo } from './HopNeo.tsx';
import { lopKq } from './BieuTuong.tsx';
import { useDienThoai } from './TheDong.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { useGiuFocus } from './giuFocus.ts';

/**
 * TUẦN DẠY THEO GV (TL-GV, mockup v20 `thiet-ke/v20/ti-le-gv.html`, chủ SP duyệt #1496) — bấm điểm một kỹ năng thi thật ở MỌI nơi hiện điểm thi
 * thật của em → hộp nhỏ (375: sheet dưới): GV · số tuần · %, GV nhiều tuần nhất làm nổi (KHÔNG chữ "phụ trách chính"). Tính từ tuần bắt đầu lộ trình tới
 * tuần thi, gồm chuyển lớp + đổi GV; tuần dạy chung chia đều (XM-7). Chỉ đọc khi bấm: MỘT GET `/cycles/:id/tuan-day` cho cả 5 kỹ năng.
 *   `OTuanDay kn="l|r|w|s"` — ô điểm hộp (G6, dáng `.os` v19) bọc chữ điểm sẵn có của nơi gọi; `kn="ovr"` — tóm tắt 5 kỹ năng (XM-3, XM-4).
 */
export type KnHop = 'l' | 'r' | 'w' | 's';
export type DiemThi4 = { l: number | null; r: number | null; w: number | null; s: number | null; ovr?: number | null };
type Props = { cycleId: number; ten: string; /** Điểm nơi gọi đang hiện (tiêu đề trước khi tải); thiếu → lấy của máy chủ. */ diem?: DiemThi4; target?: number | null };

const NHAN: Record<KnHop, string> = { l: 'L', r: 'R', w: 'W', s: 'S' };
const KN_CUA: Record<KnDay, KnHop> = { l: 'l', r: 'r', w1: 'w', w2: 'w', s: 's' };
const CACH_TINH = t('Đếm theo tuần, từ tuần bắt đầu lộ trình đến tuần thi; tuần GV được phân công kỹ năng này ở lớp em học thì tính cho GV đó. Tuần hai GV cùng dạy: chia đôi (0,5 mỗi người), tổng luôn 100 %. Chỉ tính lớp Fast Track.');

/** Ô điểm thi thật bấm được. `lon`: ô điểm lớn (Tổng kết lộ trình). `chu`: nút chữ (panel nhập KQ — "Tuần dạy"). */
export function OTuanDay({ kn, lon, chu, nhan, children, ...p }: Props & { kn: KnHop | 'ovr'; lon?: boolean; chu?: boolean; nhan?: string; children: ReactNode }) {
  const [mo, setMo] = useState(false);
  const neo = useRef<HTMLButtonElement>(null);
  const ten = kn === 'ovr' ? t('Tuần dạy theo kỹ năng') : t('Tuần dạy {kn}', { kn: NHAN[kn] });
  return (
    <span className="contents" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}>
      <button ref={neo} type="button" aria-expanded={mo} aria-haspopup="dialog" onClick={() => setMo((x) => !x)}
        aria-label={nhan ? `${nhan} — ${ten}` : ten} className={chu ? 'nut-chu-tuan-day' : `o-diem-thi${lon ? ' lon' : ''}`}>{children}</button>
      {mo && <HopTuanDay {...p} kn={kn === 'ovr' ? null : kn} neo={neo} onDong={() => setMo(false)} />}
    </span>
  );
}

function HopTuanDay({ neo, onDong, ...p }: Props & { kn: KnHop | null; neo: React.RefObject<HTMLButtonElement | null>; onDong: () => void }) {
  const dt = useDienThoai();
  const noiDung = <NoiDung {...p} onDong={onDong} sheet={dt} />;
  if (dt) return <Sheet onDong={onDong} neo={neo}>{noiDung}</Sheet>;
  return <HopNeo neo={neo} nhan={t('Tuần dạy')} rong={404} onNgoai={onDong} lop="hop-tuan-day" mui>{noiDung}</HopNeo>;
}

/** 375: sheet dưới, nền mờ; chạm nền / Esc / ✕ đóng, trả focus về ô. */
function Sheet({ onDong, neo, children }: { onDong: () => void; neo: React.RefObject<HTMLButtonElement | null>; children: ReactNode }) {
  const khung = useRef<HTMLDivElement>(null);
  useGiuFocus(khung);
  useEffect(() => {
    const o = neo.current;
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onDong(); } };
    document.addEventListener('keydown', phim, true);
    return () => { document.removeEventListener('keydown', phim, true); o?.focus({ preventScroll: true }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Tuần dạy')}>
      <div className="absolute inset-0 bg-black/50" onClick={onDong} />
      <div ref={khung} tabIndex={-1} className="hop-tuan-day sheet absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto">
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full" style={{ background: 'var(--line-strong)' }} />
        {children}
      </div>
    </div>,
    document.body,
  );
}

function NoiDung({ cycleId, ten, kn: knDau, onDong, sheet, ...p }: Props & { kn: KnHop | null; onDong: () => void; sheet: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const { data, error, loading, reload } = useApi<TuanDayKq>(`/cycles/${cycleId}/tuan-day`);
  const diem: DiemThi4 = data?.diem ?? p.diem ?? { l: null, r: null, w: null, s: null };
  const target = data ? data.target : p.target ?? null;
  const [kn, setKn] = useState<KnHop | null>(knDau);
  const [giai, setGiai] = useState(false);
  const tuan = (d: string) => tuanLich(d, homNay);
  const khoang = (k: KnHop): KhoangTuanDay | null => (data ? (data.layLai.includes(k) && data.truoc ? data.truoc : data.chinh) : null);
  const kh = khoang(kn ?? 'l');
  const mauDiem = (v: number | null | undefined) => (v == null || target == null ? '' : lopKq(soSanhDiem(v, target)));

  const dau = (
    <div className="tg-dau">
      <h3>
        {kn ? <><span className="tabular-nums">{NHAN[kn]}</span><span className={`tabular-nums ${mauDiem(diem[kn])}`}>{fmtBand(diem[kn])}</span></>
          : <>{t('Tuần dạy theo kỹ năng')}{diem.ovr != null && <span className="text-[13px] font-medium text-dim">· OVR <b className="text-[color:var(--text)]">{fmtBand(diem.ovr)}</b></span>}</>}
        {kh && kn && <span className="text-[13px] font-medium text-dim">· {data?.layLai.includes(kn) ? t('lấy KQ thi {ngay}', { ngay: ngay(kh.ngayThi, homNay).slice(0, 5) }) : t('thi thật {ngay}', { ngay: ngay(kh.ngayThi, homNay).slice(0, 5) })}</span>}
      </h3>
      <span className="tg-phu">{ten}</span>
      <button type="button" className="tg-x" aria-label={t('Đóng')} onClick={onDong}>✕</button>
      {kn && (
        <span className="tg-chuyen" role="group" aria-label={t('Kỹ năng')}>
          {(['l', 'r', 'w', 's'] as const).map((k) => <button key={k} type="button" aria-pressed={k === kn} onClick={() => setKn(k)}>{NHAN[k]}</button>)}
        </span>
      )}
    </div>
  );
  if (error) return <>{dau}<div className="tg-loi" role="alert"><p>{t('Chưa tải được tuần dạy. Điểm và bảng không đổi.')}</p><button type="button" className="btn btn-sm" onClick={reload}>{t('Thử lại')}</button></div></>;
  const khoangDong = kh && (
    <div className="tg-khoang">
      <span>{t('Tuần dạy')}</span><b>{tuan(kh.tu)} → {tuan(kh.den)}</b><span aria-hidden>·</span><b>{t('{n} tuần', { n: kh.tong })}</b>
      <button type="button" className="tg-i" aria-expanded={giai} aria-label={t('Cách tính')} onClick={() => setGiai((x) => !x)}>ⓘ</button>
    </div>
  );
  if (loading || !data || !kh) return <>{dau}{khoangDong}<div className="tg-tai" role="status">{t('Đang tải tuần dạy…')}</div>{[70, 55, 62].map((w) => <div key={w} className="tg-skel"><span style={{ width: `${w}%` }} /><span /><span /><span /></div>)}</>;
  const giaiThich = giai && <div className="tg-giai" role="note">{CACH_TINH}</div>;
  const lopDong = kh.lop.length > 1 && (
    <div className="tg-lop1"><span>{t('Lớp')}</span>{kh.lop.map((l, i) => <span key={l.id} className="contents">{i > 0 && <span aria-label={t('rồi chuyển sang')}>→</span>}<Link to={`/hoc-vien/lop/${l.id}`} title={`${tuan(l.tu)} – ${tuan(l.den)}`}>{l.ma}</Link><span aria-hidden>·</span><b>{t('{n} tuần', { n: l.tuan })}</b></span>)}</div>
  );
  const phanCong = (k: KnTuanDay) => {
    if (!k.trong) return null;
    const l = kh.lop.find((x) => k.trong!.lop.includes(x.ma) && data.phanCong.includes(x.id));
    return l ? <div className="tg-chan">{t('Sửa ở hồ sơ lớp')}<Link className="ml-auto font-semibold" to={`/hoc-vien/lop/${l.id}?viec=phan-cong`}>{t('Phân công {lop}', { lop: l.ma })} ›</Link></div> : null;
  };

  if (!kn) {
    /* Tóm tắt 5 kỹ năng: GV nhiều tuần nhất · % · "+ n GV · m tuần trống"; bấm dòng → chi tiết ngay trong hộp. */
    return <>{dau}{khoangDong}{giaiThich}
      <div className="tg-ds">
        {(['l', 'r', 'w1', 'w2', 's'] as const).map((x) => {
          const k = (khoang(KN_CUA[x]) ?? kh).kn[x];
          const pt = phanTramTron([...k.gv.map((g) => g.tuan), k.trong?.tuan ?? 0]);
          const g = k.gv[0];
          const phu = [k.gv.length > 1 ? t('+ {n} GV', { n: k.gv.length - 1 }) : null, k.trong ? t('{n} tuần trống', { n: chuTuan(k.trong.tuan) }) : null].filter(Boolean).join(' · ');
          return (
            <button key={x} type="button" className="tg-kn" onClick={() => setKn(KN_CUA[x])}>
              <span className="k">{x.toUpperCase()} <span className={mauDiem(diem[KN_CUA[x]])}>{fmtBand(diem[KN_CUA[x]])}</span></span>
              <span className="ten"><b>{g ? g.ten : t('Chưa phân công')}</b>{phu && <span>{phu}</span>}</span>
              <span className="pt">{g ? `${pt[0]} %` : '—'}</span>
            </button>
          );
        })}
      </div>
    </>;
  }
  const nhom: [KnDay, string | null][] = kn === 'w' ? [['w1', t('W1 · Writing Task 1')], ['w2', t('W2 · Writing Task 2')]] : [[kn, null]];
  const coGv = nhom.some(([x]) => kh.kn[x].gv.length);
  if (!coGv) {
    const k = kh.kn[nhom[0][0]];
    return <>{dau}{khoangDong}{giaiThich}{lopDong}
      <div className="tg-rong"><h4>{t('Chưa có phân công GV {kn}', { kn: NHAN[kn] })}</h4><p>{t('{n} tuần', { n: kh.tong })} · {kh.lop.map((l) => l.ma).join(' · ')}</p></div>
      {phanCong(k)}
    </>;
  }
  return <>{dau}{khoangDong}{giaiThich}{lopDong}
    {nhom.map(([x, nhanNhom]) => {
      const k = kh.kn[x];
      const pt = phanTramTron([...k.gv.map((g) => g.tuan), k.trong?.tuan ?? 0]);
      const max = Math.max(...k.gv.map((g) => g.tuan));
      return (
        <div key={x}>
          {nhanNhom && <div className="tg-nhom">{nhanNhom}</div>}
          <div className="tg-ds" role="list">
            {k.gv.map((g, i) => (
              <div key={g.userId} role="listitem" className={`tg-dong${g.tuan === max ? ' cao' : ''}`}>
                <span className="ten"><b>{g.ten}</b><span>{[g.lop.join(' · '), g.chung.length ? t('chung {tuan}', { tuan: g.chung.length === 1 ? tuan(g.chung[0]) : t('{n} tuần', { n: g.chung.length }) }) : null].filter(Boolean).join(' · ')}</span></span>
                <span className="thanh" aria-hidden><i style={{ width: `${pt[i]}%` }} /></span>
                <span className="tu">{chuTuan(g.tuan)}/{kh.tong} {t('tuần')}</span><span className="pt">{pt[i]} %</span>
              </div>
            ))}
            {k.trong && (
              <div role="listitem" className="tg-dong trong">
                <span className="ten"><b>{t('Chưa phân công')}</b><span>{k.trong.lop.join(' · ')} · {k.trong.tuan === 1 ? tuan(k.trong.tu) : t('từ {tuan}', { tuan: tuan(k.trong.tu) })}</span></span>
                <span className="thanh" aria-hidden><i style={{ width: `${pt[pt.length - 1]}%` }} /></span>
                <span className="tu">{chuTuan(k.trong.tuan)}/{kh.tong} {t('tuần')}</span><span className="pt">{pt[pt.length - 1]} %</span>
              </div>
            )}
          </div>
        </div>
      );
    })}
    {phanCong(nhom.map(([x]) => kh.kn[x]).find((k) => k.trong) ?? kh.kn[nhom[0][0]])}
    {sheet && <div className="h-2" />}
  </>;
}
