import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Level } from '../../ui/ui.tsx';
import { CHIP_TRON, ChipHan, Nhan, NhanLich } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { mucSosTheoNhan } from '../../lib/format.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import {
  CHAM_CHEO, LOAI_HAN_CUA_VIEC, chiaVachHan, daysBetween, demViec, laViecChamCheo, shortDate, xepTheoEm, type NhomViecXem,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Mọi việc thật của danh sách — dòng lẻ và từng việc trong dòng gộp (dòng gộp không tự đếm). */
export const viecThat = (ds: readonly WorkItem[]) => ds.flatMap((x) => (x.con?.length ? x.con : [x]));

type ChungDong = {
  onOpen: (it: WorkItem) => void; chon: string | null; xong: ReadonlySet<string>;
  moTrang: (it: WorkItem) => boolean; moCaDong: (it: WorkItem) => boolean; nutPhu?: (it: WorkItem) => ReactNode;
  /** V5 (brief 7): việc của người khác — dòng không nút động từ; chỉ "Làm thay" / "Nhập hộ" khi máy chủ báo `lamThay`. */
  theoDoi: (it: WorkItem) => boolean;
};

/* CONG-VIEC-2 (mockup `thiet-ke/v7/cong-viec-2.html` "Luật tầng"): cột hạn + cột nút cố định ở ≥ 640 px — mắt quét một cột. */
export const COT_VIEC = 'sm:grid-cols-[minmax(0,1fr)_150px_118px]';
/* Nút tên việc có `scroll-mt-14`: Tab tới một việc thì dải nhóm dính (48 px) không che nó. */
const COT_LOP = 'grid-cols-[28px_minmax(0,1fr)] sm:grid-cols-[28px_minmax(0,1fr)_150px_118px]';
/* Nét cây (tầng 3 dưới tên em): dọc ở 30 px (375: 26), ngang 12 px vào giữa dòng; dòng cuối dừng ở giữa. */
export const NET_CAY = "relative before:absolute before:left-[26px] sm:before:left-[30px] before:top-0 before:bottom-0 before:w-px before:bg-[color:var(--line-strong)] before:content-[''] last:before:bottom-1/2 "
  + "after:absolute after:left-[26px] sm:after:left-[30px] after:top-1/2 after:h-px after:w-3 after:bg-[color:var(--line-strong)] after:content-['']";

/** Biểu tượng nét 16 px của nhóm việc (mockup `IC`) — nhóm phân biệt bằng tên + biểu tượng, một màu nhấn. */
const DUONG_IC: Record<string, ReactNode> = {
  'cham-diem': <><path d="M3 13l.9-3.3L10.6 3a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2L6.3 12.1z" /><path d="M9.5 4.1l2.4 2.4" /></>,
  'case-hoc-thuat': <><path d="M3.5 14V2.5" /><path d="M3.5 3h8.5l-1.8 2.7L12 8.5H3.5" /></>,
  'y-thuc': <path d="M8 2l5 2v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4z" />,
  'van-hanh': <><rect x="3.5" y="2.5" width="9" height="11" rx="1.5" /><path d="M6 6h4M6 9h4" /></>,
  'cham-cheo': <><rect x="6" y="2" width="4" height="8" rx="2" /><path d="M4 8a4 4 0 0 0 8 0M8 12v2" /></>,
  'bao-ph': <path d="M4.2 2.5h2l1 3-1.4 1a7 7 0 0 0 3.7 3.7l1-1.4 3 1v2a1.5 1.5 0 0 1-1.6 1.5A10 10 0 0 1 2.7 4.1 1.5 1.5 0 0 1 4.2 2.5z" />,
  'sau-thi': <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></>,
  'chot-ngay-thi': <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></>,
  'bo-sung': <><path d="M4 2.5h5l3 3v8H4z" /><path d="M9 2.5v3h3" /></>,
  duyet: <><circle cx="8" cy="8" r="5.5" /><path d="M5.6 8.2l1.7 1.7 3.2-3.4" /></>,
  /* BO-QUA-XEP-MT: "Đã bỏ qua" — mắt gạch. */
  'bo-qua': <><path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" /><circle cx="8" cy="8" r="1.8" /><path d="M3 13L13 3" /></>,
  /* U01 #3 (audit 03/11): dòng "Cả lớp" / dòng gộp — ô bảng (mockup `.av.vuong`), không số chồng. */
  'ca-lop': <><rect x="2.5" y="3" width="11" height="10" rx="1" /><path d="M2.5 7h11M6 3v10" /></>,
  lop: <><circle cx="6" cy="6" r="2.2" /><circle cx="11.2" cy="6.6" r="1.7" /><path d="M2.5 13c.4-2.2 1.8-3.4 3.5-3.4s3.1 1.2 3.5 3.4M10.3 9.7c1.6 0 2.8 1 3.2 3" /></>,
};
export const IconNhom = ({ k }: { k: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{DUONG_IC[k] ?? DUONG_IC.lop}</svg>
);
/** Chữ đầu tên em (vòng tròn tầng 2): hai từ cuối ("Vũ Hải Đăng" → "HĐ"). */
export const chuDau = (ten: string) => {
  const w = ten.trim().split(/\s+/);
  return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : w[0].slice(0, 2)).toUpperCase();
};

/**
 * DANH SÁCH CÔNG VIỆC — BA TẦNG (CONG-VIEC-2, mockup `thiet-ke/v7/cong-viec-2.html`, chủ SP duyệt #621 27/10; thay bố cục V5 `cong-viec.html`):
 *  ① nhóm việc — thẻ riêng, dải `--surface-2` + vạch trái 3 px một màu nhấn (xám = bài chấm chéo, không phải việc của bạn), biểu tượng, 15 / 700,
 *    chip "n việc", dính khi cuộn; số đếm việc thật của máy chủ (`dem`; gập / lọc không đổi số — T17);
 *  ② đối tượng — học viên: vòng tròn chữ đầu + tên 15 / 600 = link hồ sơ (không ký hiệu mũi tên; tách xem hồ sơ / làm việc) · lớp · SOS MỘT lần; em một việc vẫn có khối
 *    (một dáng); lớp / nhóm em: ô vuông biểu tượng, chính dòng là việc; dòng gộp: ô chồng có số ("n em ▾" mở khay em nền chìm, hoặc làm cả dòng);
 *  ③ việc của em — thụt dưới tên, nét cây, tên 15 / 500 KHÔNG lặp tên em, phụ 13, hạn cột cố định, một nút.
 * Chấm điểm chia vạch hạn, vạch sau tuần này gập sẵn (T14) · bài Speaking chấm chéo là nhóm riêng, không đếm việc (T03).
 */
export function DanhSachViec({ nhom, dem, homNay, soHien, moHet, gapSan, cuoiNhom, luatNhom, chiDemViec, ...dong }: ChungDong & {
  nhom: NhomViecXem<WorkItem>[];
  /** Số đầu nhóm theo khoá nhóm, chỉ từ việc máy chủ trả (dòng giữ chỗ vừa xong không đếm). */
  dem: ReadonlyMap<string, readonly WorkItem[]>;
  homNay: string; soHien: number; moHet: boolean;
  /** OV-15d: nhóm gập sẵn (QL: Việc quản lý) — `viTri` = thứ tự thẻ nhóm trên màn (0 = đầu). */
  gapSan?: (key: string, viTri: number) => boolean;
  cuoiNhom?: (key: string) => ReactNode;
  /** UI-CV-TVV (P1): luật của nhóm (vd hạn Báo PH) — nút ⓘ cạnh tên nhóm, không thành câu trên màn. */
  luatNhom?: (key: string) => ReactNode;
  /** UI-CV-TVV (mockup `tvv.html .nhom-dau`): đầu nhóm chỉ "n việc". */
  chiDemViec?: boolean;
}) {
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  const [moSau, setMoSau] = useState(false);
  /* T03: bài chấm chéo tách khỏi Chấm điểm — "Speaking chấm chéo". */
  const ds = nhom.flatMap((g) => {
    if (g.key !== 'cham-diem') return [g];
    const cc = g.items.filter(laViecChamCheo);
    if (!cc.length) return [g];
    const con = g.items.filter((x) => !laViecChamCheo(x));
    return [...(con.length ? [{ ...g, items: con }] : []), { ...g, key: 'cham-cheo' as never, label: t('Speaking chấm chéo'), items: cc }];
  });
  /* "+ n việc ở {nhóm}" ở tầng em: em có việc ở nhóm khác — không phải nhớ qua lại giữa hai nhóm. */
  const nhomCuaEm = new Map<number, { k: string; ten: string }[]>();
  for (const g of ds) for (const x of viecThat(g.items)) if (x.studentId !== null) nhomCuaEm.set(x.studentId, [...(nhomCuaEm.get(x.studentId) ?? []), { k: g.key as string, ten: g.label }]);
  return (
    <div className="flex flex-col gap-3.5">
      {ds.map((g, viTri) => {
        const k = g.key as string;
        const dangMo = moHet || (mo[k] ?? !gapSan?.(k, viTri));
        const goc = (k === 'cham-cheo' ? dem.get('cham-diem')?.filter(laViecChamCheo) : k === 'cham-diem' ? dem.get(k)?.filter((x) => !laViecChamCheo(x)) : dem.get(k)) ?? [];
        const so = demViec(viecThat(goc));
        /* CHAM-LAI: lọc hạn trên việc thật (sau khi mở `con`) — dòng gộp "3 em · 1 em quá hạn" là 1 việc quá hạn, không phải 3. */
        const quaHan = demViec(viecThat(goc).filter((x) => x.urgency === 'overdue')).viec;
        const homNayN = demViec(viecThat(goc).filter((x) => x.urgency === 'today')).viec;
        const baiCc = viecThat(goc).reduce((n, x) => n + (x.soBai ?? 0), 0);
        const vach = k === 'cham-diem' ? chiaVachHan(g.items, homNay) : null;
        const khacCua = (sid: number) => (nhomCuaEm.get(sid) ?? []).filter((x) => x.k !== k);
        /* Mỗi vạch / nhóm 10 dòng đầu + "Xem thêm" (danh sách QL "Tất cả" có thể hàng trăm dòng). */
        const dongNhom = (items: readonly WorkItem[], kv = k) => {
          const n = soHien + (them[kv] ?? 0);
          return (
            <>
              <MucNhom items={items.slice(0, n)} khacCua={khacCua} {...dong} />
              {items.length > n && (
                <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setThem((s) => ({ ...s, [kv]: (s[kv] ?? 0) + soHien }))}>
                    {/* UA-06: đếm DÒNG (dòng gộp = 1) — đầu nhóm đếm việc. */}
                    {t('Xem thêm {n} dòng', { n: Math.min(soHien, items.length - n) })}
                  </button>
                </div>
              )}
            </>
          );
        };
        const trungTinh = k === 'cham-cheo';
        return (
          <section key={k} className="card overflow-clip p-0" aria-label={dich(g.label)} data-nhom={k}>
            <DaiNhom k={k} nhan={dich(g.label)} chip={trungTinh ? t('{soBai} bài', { soBai: baiCc }) : t('{n} việc', { n: so.viec })} mo={dangMo}
              onMo={() => setMo((s) => ({ ...s, [k]: !dangMo }))} luat={luatNhom?.(k)} trungTinh={trungTinh}
              phu={trungTinh ? null : <>
                {so.bai > 0
                  ? <span className="font-normal text-dim"><b className="font-semibold tabular-nums text-[color:var(--text)]">{so.bai}</b> {t('bài')}</span>
                  : so.hv > 0 && !chiDemViec ? <span className="font-normal text-dim"><b className="font-semibold tabular-nums text-[color:var(--text)]">{so.hv}</b> {t('HV')}</span> : null}
                {quaHan > 0 && <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan })}</span>}
                {homNayN > 0 && <span className="font-semibold text-soon">{t('⚠ {n} hạn hôm nay', { n: homNayN })}</span>}
              </>} />
            {dangMo && (vach ? (
              <>
                <VachHan nhan={t('Quá hạn')} items={vach.quaHan} mo>{dongNhom(vach.quaHan, `${k}:qua`)}</VachHan>
                <VachHan nhan={t('Hạn đến {ngay}', { ngay: shortDate(vach.cuoiTuan, homNay) })} items={vach.denHetTuan} mo>{dongNhom(vach.denHetTuan, `${k}:tuan`)}</VachHan>
                {vach.sau.length > 0 && (
                  <VachHan nhan={t('Hạn sau {ngay}', { ngay: shortDate(vach.cuoiTuan, homNay) })} items={vach.sau} mo={moHet || moSau} onMo={() => setMoSau((x) => !x)}>
                    {dongNhom(vach.sau, `${k}:sau`)}
                  </VachHan>
                )}
              </>
            ) : (
              dongNhom(g.items)
            ))}
            {dangMo && cuoiNhom?.(k) && <div className="border-t px-4 py-1" style={{ borderColor: 'var(--line)' }}>{cuoiNhom(k)}</div>}
          </section>
        );
      })}
    </div>
  );
}

/**
 * TẦNG ① — DẢI NHÓM (mockup `.dai-nhom`): nền `--surface-2`, vạch trái 3 px một màu nhấn (`trungTinh` xám = không phải việc của bạn), biểu tượng,
 * tên 15 / 700, chip đếm vuông có đơn vị, phụ 13; dính khi cuộn (thẻ cha `overflow-clip`, không `overflow-hidden`). Bấm tên = gập / mở. Dùng chung cho
 * "Chờ bạn duyệt" và "Việc quản lý" rỗng ở `HoTroHocVienTab` — mọi nhóm cùng dáng.
 */
export function DaiNhom({ k, nhan, chip, mo, onMo, luat, phu, trungTinh = false }: {
  k: string; nhan: string; chip?: string; mo: boolean; onMo: () => void; luat?: ReactNode; phu?: ReactNode; trungTinh?: boolean;
}) {
  return (
    <h2 className={`sticky top-0 z-[3] m-0 flex min-h-[48px] flex-wrap items-center gap-x-2 border-l-[3px] pl-[13px] pr-2 text-[15px] font-bold leading-snug ${mo ? 'border-b' : ''}`}
      style={{ background: 'var(--surface-2)', borderBottomColor: 'var(--line)', borderLeftColor: trungTinh ? 'var(--text-faint)' : 'var(--accent)' }}>
      <button type="button" aria-expanded={mo} onClick={onMo}
        className="flex min-h-[44px] min-w-0 appearance-none items-center gap-2 border-0 bg-transparent py-2.5 text-left max-sm:flex-1">
        <span className={trungTinh ? 'text-faint' : 'text-[color:var(--accent)]'}><IconNhom k={k} /></span>
        <span className="min-w-0 text-[color:var(--text)]">{nhan}</span>
        {chip && <span className="inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{chip}</span>}
      </button>
      {luat}
      {phu && <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] max-sm:order-3 max-sm:basis-full max-sm:pb-2.5 max-sm:pl-6 max-sm:empty:hidden">{phu}</span>}
      <button type="button" tabIndex={-1} aria-hidden onClick={onMo}
        className="ml-auto h-8 w-8 shrink-0 appearance-none rounded-md border-0 bg-transparent text-[13px] font-normal text-dim hover:bg-[color:var(--accent-soft)]">
        {mo ? '▾' : '▸'}
      </button>
    </h2>
  );
}

/** Vạch hạn của Chấm điểm (T14): 13 / 600, kẻ mảnh trên — nhỏ hơn đầu đối tượng. "Quá hạn · n" luôn hiện; vạch sau tuần này bấm để mở. */
function VachHan({ nhan, items, mo, onMo, children }: { nhan: string; items: readonly WorkItem[]; mo: boolean; onMo?: () => void; children: ReactNode }) {
  const so = demViec(viecThat(items));
  const chu = <>{nhan} · {so.viec ? <>{t('{n} việc', { n: so.viec })}{so.bai ? <> · {t('{soBai} bài', { soBai: so.bai })}</> : null}</> : 0}</>;
  const lop = 'flex min-h-[44px] w-full items-center gap-2 border-0 border-t px-4 py-2 text-left text-[13px] font-semibold text-dim first:border-t-0 sm:min-h-[36px] max-sm:px-3';
  return (
    <>
      {onMo ? (
        <button type="button" aria-expanded={mo} onClick={onMo} className={`${lop} scroll-mt-14 appearance-none bg-transparent bam`} style={{ borderColor: 'var(--line)' }}>
          {chu}<span aria-hidden className="ml-0.5">{mo ? '▾' : '▸'}</span>
        </button>
      ) : (
        <div className={lop} style={{ borderColor: 'var(--line)' }}>{chu}</div>
      )}
      {mo && items.length > 0 && children}
    </>
  );
}

/** Mục của một nhóm (hoặc một vạch): khối em (tầng ②, mọi em kể cả một việc — T01) · đối tượng lớp / dòng gộp. Khối cách khối bằng vạch đậm. */
function MucNhom({ items, khacCua, ...dong }: ChungDong & { items: readonly WorkItem[]; khacCua: (sid: number) => { k: string; ten: string }[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {xepTheoEm(items, dong.moCaDong).map((m) => {
        if (m.kieu === 'dong') return <li key={`${m.it.key}|${m.it.ownerId ?? ''}`} className="border-t first:border-t-0" style={{ borderColor: 'var(--line-strong)' }}><DongLop it={m.it} {...dong} /></li>;
        const sid = m.viec[0].studentId!;
        /* SOS ghi MỘT lần ở tên em: mức cao nhất trong các việc của em (dòng việc không lặp chip SOS). */
        const sos = Math.max(0, ...m.viec.map((x) => (x.level ? mucSosTheoNhan(x.level.text) ?? 0 : 0)));
        const khac = khacCua(sid);
        return (
          <li key={m.khoa} className="border-t pb-1.5 pt-3 first:border-t-0" style={{ borderColor: 'var(--line-strong)' }}>
            <div className="flex min-h-[30px] items-center gap-2.5 px-4 pb-1 max-sm:px-3">
              {/* Vòng chữ đầu tên (avatar), không phải chip trạng thái. */}
              <span aria-hidden className="h-7 w-7 shrink-0 rounded-full border text-center text-[12px] font-bold leading-[26px] text-dim"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--line-strong)' }}>{chuDau(m.ten)}</span>
              <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <Link to={`/hoc-vien/${sid}`} title={t('Mở hồ sơ {ten}', { ten: m.ten })}
                  className="whitespace-nowrap text-[15px] font-semibold leading-snug text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline">
                  {m.ten}
                </Link>
                {m.lop && <span className="whitespace-nowrap text-[13px] text-dim">{m.lop}</span>}
                {sos > 0 && <ChipSos muc={sos as 1 | 2 | 3} />}
                {khac.length > 0 && <span className="whitespace-nowrap text-[13px] text-faint">{t('+ {n} việc ở {nhom}', { n: khac.length, nhom: dich(khac[0].ten) })}</span>}
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {m.viec.map((x) => <li key={x.key} className={NET_CAY}><DongViec it={x} {...dong} /></li>)}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/** Chung của một dòng việc: nút động từ, hạn, đối tượng phụ, trạng thái đã lưu. */
function useDong(it: WorkItem, { chon, xong, moCaDong, theoDoi }: ChungDong) {
  const con = it.con?.length && !moCaDong(it) ? it.con : null;
  const xem = theoDoi(it);
  const viecCaLop = it.group === 'chot_len_ft' || it.group === 'xet_lai_lo_trinh' || it.group === 'ky_vong_dau_ra';
  /* brief 7: chế độ theo dõi — không động từ; quyền làm thay thật (`lamThay`) mới có nút. */
  /* U01 #4: nút khay dòng gộp "4 em ▾" — số việc đã ở thẻ phụ. */
  const nut = con ? dich(it.actionLabel.split(' · ')[0]) : laViecChamCheo(it) ? t('Chấm Speaking') : xem ? ((it as { lamThay?: boolean }).lamThay ? (it.group === 'score' ? t('Nhập hộ') : t('Làm thay')) : null) : dich(it.actionLabel);
  /* QL Tất cả / xem GV: người giữ việc đứng dưới hạn (mockup `.h .ai`) — cột "khi nào · ai" thẳng hàng. */
  const nguoi = it.mine ? null : it.owner ?? (it.ownerId === null && !viecCaLop ? (dich(it.statusLabel) === CHAM_CHEO ? CHAM_CHEO : t('Chưa có người')) : null);
  return { con, daXong: xong.has(it.key), dangChon: chon === it.key, nut, nguoi, viecCaLop };
}

/** Cột hạn (cố định): "✓ Đã lưu" · chip hạn (cùng `ChipHan` của đầu panel) · "không hạn" mờ — dưới là người giữ việc. */
function CotHan({ it, daXong, nguoi }: { it: WorkItem; daXong: boolean; nguoi: string | null }) {
  const tvv = laViecTvvTheoEm(it);
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] sm:grid sm:justify-items-start">
      {daXong ? <span className="font-semibold text-dim">{t('✓ Đã lưu')}</span>
        : it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh'} han={it.due} />
        : laViecChamCheo(it) ? null : <span className="text-faint">{tvv || it.group === 'bo_sung_ho_so' ? t('không hạn') : t('Chưa có hạn')}</span>}
      {!daXong && nguoi && <span className="pl-0.5 text-[color:var(--text)]">{nguoi}</span>}
    </span>
  );
}

/** Cột nút: một nút động từ; 375 ẩn (chạm cả dòng) — trừ nút phụ (Gia hạn) mang nghĩa riêng. */
function CotNut({ it, nut, daXong, mo, onBam, nutPhu, luon }: { it: WorkItem; nut: string | null; daXong: boolean; mo?: boolean; onBam: () => void; nutPhu?: ReactNode; luon?: boolean }) {
  /* U01 #7: dòng vừa xong đứng nguyên chỗ — "Xem lại" mở lại panel của việc đó. */
  if (daXong) {
    return (
      <span className="flex max-sm:col-span-full">
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" aria-label={t('Xem lại: {viec}', { viec: tenBoEm(it) })} onClick={(e) => { e.stopPropagation(); onBam(); }}>{t('Xem lại')}</button>
      </span>
    );
  }
  if (!nut && !nutPhu) return <span className="hidden sm:block" />;
  return (
    <span className={`${luon || nutPhu ? 'flex' : 'hidden sm:flex'} flex-wrap gap-1.5 max-sm:col-span-full sm:flex-col sm:items-stretch`} onClick={(e) => e.stopPropagation()}>
      {nut && (
        <button type="button" className={`btn btn-sm min-h-[44px] sm:h-auto sm:min-h-[30px] sm:w-full sm:whitespace-normal sm:px-2 sm:py-1 sm:leading-tight ${luon ? '' : 'max-sm:hidden'}`} onClick={onBam}
          aria-expanded={it.con?.length && mo !== undefined ? mo : undefined}>
          {nut}{mo !== undefined && <span aria-hidden className="ml-1">{mo ? '▴' : '▾'}</span>}
        </button>
      )}
      {nutPhu}
    </span>
  );
}

/** Tên việc bỏ tên em (máy chủ ghép "Xác nhận Case R · {em}") — tên em đã ở tầng ②. */
export const tenBoEm = (it: WorkItem) => {
  const vi = it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe;
  return tenViec(vi.split(' · ').filter((x) => !x.startsWith(it.studentName)).join(' · ') || vi);
};
/** U01 #15: tên việc máy chủ đã ghép "{thao tác} · {kỹ năng}" (`mywork.ts sauCham`) — web chỉ dịch. */
export const tenViec = (vi: string) => vi.split(' · ').map((x) => dich(x)).join(' · ');
/* U01 #18: chip mức Case báo tay chỉ hiện "Gấp" (tông `danger`, `levelOf`) — "Bình thường" (tông `neutral`) không mang tin. */
const chipMuc = (it: WorkItem, boSos: boolean) => (!it.level ? null : mucSosTheoNhan(it.level.text)
  ? (boSos ? null : <ChipSos muc={mucSosTheoNhan(it.level.text)!} tinh />) : (it.level.tone as string) !== 'neutral' ? <Level tone={it.level.tone}>{dich(it.level.text)}</Level> : null);

/** U01 #3: tuần luôn có chữ "tuần" trước mã ("MT1 W4 JUL" → "MT1" + "tuần W4 JUL"), không nhầm W1 / W2 (Writing). */
const MA_TUAN = /\b(W[1-5] [A-Z]{3})\b/;
const LA_SO = /^\d+ (em|việc|bài|HV|lớp)$/;
const tachTuan = (x: string): string[] => {
  const m = MA_TUAN.exec(x);
  if (!m) return [dich(x)];
  const truoc = x.slice(0, m.index).trim();
  const sau = x.slice(m.index + m[0].length).trim();
  return [truoc ? dich(truoc) : '', t('tuần {w}', { w: m[1] }), sau ? dich(sau) : ''].filter(Boolean);
};
/** Chuỗi phụ "a · b · c" của máy chủ → thẻ phụ (mockup `.the-phu .tag.nhat`): lượt · tuần · số bài / em / việc. */
export const thePhu = (ds: readonly (string | null | undefined)[]) => ds.filter((x): x is string => !!x).flatMap((x) => x.split(' · ')).flatMap(tachTuan);
export function ThePhu({ ds }: { ds: readonly string[] }) {
  if (!ds.length) return null;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {ds.map((x, i) => <span key={i} className="inline-flex h-5 max-w-full items-center truncate rounded-md px-2 text-xs font-semibold text-dim" style={{ background: 'var(--surface-2)' }}>{x}</span>)}
    </span>
  );
}

/**
 * TẦNG ③ — MỘT VIỆC CỦA EM (mockup `.viec`): [tên 15 / 500 + phụ 13 | hạn 136 px | nút 112 px]. Tên là nút thật (bàn phím); bấm chỗ trống của dòng = bấm tên
 * (một kiểu mở). 375: một cột, hạn dưới tên, ẩn nút, dòng ≥ 56 px.
 */
function DongViec({ it, ...dong }: ChungDong & { it: WorkItem }) {
  const { daXong, dangChon, nut, nguoi } = useDong(it, dong);
  const tvv = laViecTvvTheoEm(it);
  const ten = tenBoEm(it);
  /* Phụ không lặp tên việc (TVV: "Báo PH · Report 1" / phụ "Report 1"). */
  const phu = thePhu([it.contextLabel ?? it.phu, it.group === 'score' && it.soBai ? t('{soBai} bài', { soBai: it.soBai }) : null].filter((x) => !!x && !ten.includes(dich(x!))));
  const bam = () => dong.onOpen(it);
  return (
    <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={dich(it.reason)}
      className={`grid min-h-[56px] cursor-pointer grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-1.5 pl-[46px] pr-3 sm:min-h-[50px] sm:pl-[54px] sm:pr-4 ${COT_VIEC} ${
        dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
      <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-current={dangChon ? 'true' : undefined}
        className="grid min-w-0 scroll-mt-14 appearance-none gap-px border-0 bg-transparent p-0 text-left disabled:cursor-default">
        <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[15px] font-semibold leading-snug ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>
          <span className={daXong ? 'line-through' : ''}>{daXong && <span aria-hidden className="text-ok">✓ </span>}{ten}</span>
          {chipMuc(it, true)}
          {dong.moTrang(it) && <span aria-label={t('mở trang')} className="text-[13px] text-[color:var(--accent)]">›</span>}
        </span>
        {(phu.length > 0 || tvv) && (
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] leading-snug text-dim">
            <ThePhu ds={phu} />
            {tvv && !daXong && <span className="min-w-0 max-w-full empty:hidden [&>span]:h-auto [&>span]:min-h-[22px] [&>span]:whitespace-normal [&>span]:py-0.5 [&>span]:leading-snug"><BadgeViecTvv it={it} /></span>}
            {tvv && !daXong && <ConNgay it={it} />}
          </span>
        )}
      </button>
      <CotHan it={it} daXong={daXong} nguoi={nguoi} />
      <CotNut it={it} nut={nut} daXong={daXong} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
    </div>
  );
}

/**
 * TẦNG ② LỚP / NHÓM EM — chính dòng là việc (mockup `.viec.dt-lop`): ô vuông biểu tượng · tên 15 / 600 · phụ 13 · hạn · nút.
 * Dòng gộp (ô chồng có số): "n em ▾" mở khay em nền chìm có viền bên dưới; `moCaDong` (Xác nhận PA lô, Nhập điểm theo tuần) bấm mở một panel lô.
 */
function DongLop({ it, ...dong }: ChungDong & { it: WorkItem }) {
  const [mo, setMo] = useState(false);
  const { con, daXong, dangChon, nut, nguoi, viecCaLop } = useDong(it, dong);
  const gop = !!it.con?.length;
  const bam = () => (con ? setMo(!mo) : dong.onOpen(it));
  const maDs = `con-${it.key}`;
  /*
   * U01 #3–#4 (audit 03/11): dòng của cả lớp / dòng gộp lớp = "Cả lớp {mã} · {việc}" + thẻ phụ (lượt · tuần · n em · n việc · n bài) + người phụ trách;
   * tên việc máy chủ ghép "Mô tả Case · MB FT 101 · 4 em · 8 việc" — mã lớp lên đầu dòng, số / tuần thành thẻ.
   */
  const caLop = !!it.classCode && (gop || viecCaLop || it.studentName === 'Lớp ' + it.classCode);
  const phan = (it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe).split(' · ');
  const laThe = (x: string) => LA_SO.test(x) || MA_TUAN.test(x);
  /* SOS ghi ở từng em trong khay — dòng gộp không lặp. */
  const ngCanh = gop ? it.contextLabel?.split(' · ').filter((x) => !/^SOS \d/.test(x)).join(' · ') : it.contextLabel;
  const tenGoc = phan.filter((x) => x !== it.classCode && !laThe(x)).join(' · ') || phan[0];
  const daNoi = (x: string) => it.tieuDe.includes(x.replace(/^Lớp /, ''));
  const doiTuong = thePhu([
    caLop || gop || viecCaLop ? null : it.studentName,
    !caLop && it.classCode && it.studentName !== 'Lớp ' + it.classCode && !daNoi(it.classCode) ? it.classCode : null,
    ngCanh,
    ...phan.filter((x) => x !== it.classCode && laThe(x)),
    !gop && it.group === 'score' && it.soBai && !phan.some((x) => / bài$/.test(x)) ? t('{soBai} bài', { soBai: it.soBai }) : !gop && it.count !== null && it.count > 1 ? t('{n} HV', { n: it.count }) : null,
  ]);
  return (
    <div className={con && mo ? 'bg-[color:var(--bg)]' : ''}>
      <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={con ? undefined : dich(it.reason)}
        className={`grid min-h-[56px] cursor-pointer items-center gap-x-3 gap-y-1 py-2 pl-3 pr-3 sm:pl-4 sm:pr-4 ${COT_LOP} ${dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
        <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--accent)]" style={{ background: 'var(--accent-soft)' }}>
          <IconNhom k="ca-lop" />
        </span>
        <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-expanded={con ? mo : undefined} aria-controls={con && mo ? maDs : undefined}
          aria-current={dangChon ? 'true' : undefined} className="grid min-w-0 scroll-mt-14 appearance-none gap-px border-0 bg-transparent p-0 pl-0.5 text-left disabled:cursor-default">
          <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[15px] font-semibold leading-snug ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>
            <span className={daXong ? 'line-through' : ''}>
              {daXong && <span aria-hidden className="text-ok">✓ </span>}
              {caLop && <><b className="font-bold">{t('Cả lớp {lop}', { lop: it.classCode! })}</b> · </>}{tenViec(tenGoc)}
            </span>
            {chipMuc(it, false)}
            {dong.moTrang(it) && !con && <span aria-label={t('mở trang')} className="text-[13px] font-normal text-[color:var(--accent)]">›</span>}
          </span>
          {doiTuong.length > 0 && <span className="mt-0.5"><ThePhu ds={doiTuong} /></span>}
        </button>
        {/* UA-03: dòng gộp cũng ghi người phụ trách (QL "Tất cả" phân biệt ba dòng giống nhau). */}
        <span className="col-start-2 sm:col-start-auto"><CotHan it={it} daXong={daXong} nguoi={nguoi} /></span>
        <span className="col-start-2 sm:col-start-auto">
          <CotNut it={it} nut={nut} daXong={daXong} mo={con ? mo : undefined} luon={!!con} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
        </span>
      </div>
      {con && mo && (
        <ul id={maDs} className="m-0 list-none border-t border-dashed p-0 pb-1.5" style={{ borderColor: 'var(--line-strong)' }} aria-label={dich(it.tieuDe)}>
          {con.map((x, i) => <li key={x.key} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}><DongCon it={x} {...dong} /></li>)}
        </ul>
      )}
    </div>
  );
}

/** Một em trong khay dòng gộp: tên em (`conTen`) · phụ (`conPhu`) · hạn · nút — thẳng cột hạn / nút với dòng trên. */
function DongCon({ it, ...dong }: ChungDong & { it: WorkItem & { conTen: string; conPhu: string } }) {
  const { daXong, dangChon, nut, nguoi } = useDong(it, dong);
  const bam = () => dong.onOpen(it);
  return (
    <div data-hd="cv-dong" data-khoa={it.key} onClick={daXong ? undefined : bam} title={dich(it.reason)}
      className={`grid min-h-[48px] cursor-pointer grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-1.5 pl-[50px] pr-3 sm:pl-[54px] sm:pr-4 ${COT_VIEC} ${
        dangChon ? 'row-active' : daXong ? 'cursor-default' : 'bam'}`}>
      <button type="button" disabled={daXong} onClick={(e) => { e.stopPropagation(); bam(); }} aria-current={dangChon ? 'true' : undefined}
        className="grid min-w-0 scroll-mt-14 appearance-none gap-px border-0 bg-transparent p-0 text-left disabled:cursor-default">
        <span className={`text-[15px] font-medium leading-snug ${daXong ? 'text-dim' : 'text-[color:var(--text)]'}`}>{daXong && <span aria-hidden className="text-ok">✓ </span>}{dich(it.conTen)}</span>
        {it.conPhu && <span className="text-[13px] leading-snug text-dim">{dich(it.conPhu)}</span>}
      </button>
      <CotHan it={it} daXong={daXong} nguoi={nguoi} />
      <CotNut it={it} nut={nut} daXong={daXong} onBam={bam} nutPhu={dong.nutPhu?.(it)} />
    </div>
  );
}

/** Việc TVV theo từng em (Báo PH · Sau thi · Chốt ngày thi) — dòng kiểu `tvv.html .viec`. */
const laViecTvvTheoEm = (it: WorkItem) => it.studentId !== null && !it.con?.length
  && (it.group === 'bao_ph_yt' || it.group === 'thi_that' || it.group === 'buoc_tiep' || it.key.startsWith('chot-ngay-thi:'));

/** Báo PH hạn xa "còn n ngày" ở dòng phụ của việc (mockup `v7/cong-viec-2.html` `t2`), cột hạn một dòng. Quá hạn / sắp hạn đã có tín hiệu của `ChipHan`. */
function ConNgay({ it }: { it: WorkItem }) {
  const { homNay } = useNgayNghiepVu();
  if (it.group !== 'bao_ph_yt' || it.urgency !== 'normal' || !it.due || !homNay) return null;
  return <span>{t('còn {n} ngày', { n: daysBetween(homNay, it.due) })}</span>;
}

/** Badge trạng thái của việc TVV (mockup): "⚠ Chưa liên hệ được · lần n" (sắp hạn) · "Đã có kết quả · Chưa chốt bước tiếp" (tiến độ) · "Đã thi · chờ KQ" (lịch thi). */
function BadgeViecTvv({ it }: { it: WorkItem }) {
  if (it.group === 'bao_ph_yt' && it.soLanThu) {
    return <span className={`${CHIP_TRON} gap-1 bg-soon-bg text-soon`}><span aria-hidden>⚠</span>{t('Chưa liên hệ được · lần {n}', { n: it.soLanThu })}</span>;
  }
  if (it.group === 'buoc_tiep') return <Nhan tone="doing">{t('Đã có kết quả · Chưa chốt bước tiếp')}</Nhan>;
  if (it.group === 'thi_that') return <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>;
  return null;
}
