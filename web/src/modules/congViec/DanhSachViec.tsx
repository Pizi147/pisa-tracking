import { type ReactNode, useState } from 'react';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Level, NhanTrangThai } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { CHIP_TRON, Nhan, NhanLich } from '../../ui/Nhan.tsx';
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

/**
 * DANH SÁCH CÔNG VIỆC V5 (mockup `thiet-ke/v5/cong-viec.html`, truy vết `cong-viec-truy-vet.md`): mỗi nhóm một thẻ — đầu nhóm "n việc · n HV / n bài"
 * (đếm việc thật của máy chủ, `dem`; gập / lọc không đổi số — T17) · dòng [hạn | việc + đối tượng | nút động từ] · em có ≥ 2 việc → một dòng tên em +
 * dòng con từng việc (T01) · Chấm điểm chia vạch hạn, vạch sau tuần này gập sẵn (T14) · bài Speaking chấm chéo là nhóm riêng, không đếm việc (T03).
 */
export function DanhSachViec({ nhom, dem, homNay, soHien, moHet, gapSan, cuoiNhom, luatNhom, chiDemViec, ...dong }: ChungDong & {
  nhom: NhomViecXem<WorkItem>[];
  /** Số đầu nhóm theo khoá nhóm, chỉ từ việc máy chủ trả (dòng giữ chỗ vừa xong không đếm). */
  dem: ReadonlyMap<string, readonly WorkItem[]>;
  homNay: string; soHien: number; moHet: boolean;
  /** OV-15d: nhóm gập sẵn (QL: Việc quản lý) — `viTri` = thứ tự thẻ nhóm trên màn (0 = đầu). */
  gapSan?: (key: string, viTri: number) => boolean;
  cuoiNhom?: (key: string) => ReactNode;
  /** UI-CV-TVV (P1): luật của nhóm (vd hạn Báo PH) — nút ⓘ cạnh số đầu nhóm, không thành câu trên màn. */
  luatNhom?: (key: string) => ReactNode;
  /** UI-CV-TVV (mockup `tvv.html .nhom-dau`): đầu nhóm chỉ "n việc". */
  chiDemViec?: boolean;
}) {
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  const [moSau, setMoSau] = useState(false);
  /* T03: bài chấm chéo tách khỏi Chấm điểm — "Bài thi Speaking tuần này". */
  const ds = nhom.flatMap((g) => {
    if (g.key !== 'cham-diem') return [g];
    const cc = g.items.filter(laViecChamCheo);
    if (!cc.length) return [g];
    const con = g.items.filter((x) => !laViecChamCheo(x));
    return [...(con.length ? [{ ...g, items: con }] : []), { ...g, key: 'cham-cheo' as never, label: t('Bài thi Speaking tuần này'), items: cc }];
  });
  return (
    <div className="flex flex-col gap-3">
      {ds.map((g, viTri) => {
        const k = g.key as string;
        const dangMo = moHet || (mo[k] ?? !gapSan?.(k, viTri));
        const goc = (k === 'cham-cheo' ? dem.get('cham-diem')?.filter(laViecChamCheo) : k === 'cham-diem' ? dem.get(k)?.filter((x) => !laViecChamCheo(x)) : dem.get(k)) ?? [];
        const so = demViec(viecThat(goc));
        /* Cùng đơn vị với vạch hạn: việc (không phải dòng). */
        /* CHAM-LAI: lọc hạn trên việc thật (sau khi mở `con`) — dòng gộp "3 em · 1 em quá hạn" là 1 việc quá hạn, không phải 3. */
        const quaHan = demViec(viecThat(goc).filter((x) => x.urgency === 'overdue')).viec;
        const homNayN = demViec(viecThat(goc).filter((x) => x.urgency === 'today')).viec;
        const baiCc = viecThat(goc).reduce((n, x) => n + (x.soBai ?? 0), 0);
        const vach = k === 'cham-diem' ? chiaVachHan(g.items, homNay) : null;
        /* Mỗi vạch / nhóm 10 dòng đầu + "Xem thêm" (danh sách QL "Tất cả" có thể hàng trăm dòng). */
        const dongNhom = (items: readonly WorkItem[], kv = k) => {
          const n = soHien + (them[kv] ?? 0);
          return (
            <>
              <MucNhom items={items.slice(0, n)} {...dong} />
              {items.length > n && (
                <div className="border-t px-4 py-2" style={{ borderColor: 'var(--line)' }}>
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => setThem((s) => ({ ...s, [kv]: (s[kv] ?? 0) + soHien }))}>
                    {t('Xem thêm')}{' '}{Math.min(soHien, items.length - n)}{' '}{t('việc')}
                  </button>
                </div>
              )}
            </>
          );
        };
        return (
          <section key={k} className="card overflow-hidden p-0" aria-label={dich(g.label)} data-nhom={k}>
            <h2 className="m-0 flex items-center border-b text-[15px] font-bold" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <button type="button" aria-expanded={dangMo} onClick={() => setMo((s) => ({ ...s, [k]: !dangMo }))}
              className={`flex min-h-[44px] appearance-none flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-0 bg-transparent py-3 pl-4 text-left ${luatNhom?.(k) ? 'pr-2' : 'w-full pr-4'}`}>
              <span className="text-[15px] font-bold text-slate-100">{dich(g.label)}</span>
              <span className="text-[13px] font-normal tabular-nums text-slate-400">
                {k === 'cham-cheo'
                  ? <><b className="text-slate-100">{baiCc}</b> {t('bài')}</>
                  : <>
                      <b className="text-slate-100">{so.viec}</b> {t('việc')}
                      {so.bai > 0 ? <> · <b className="text-slate-100">{so.bai}</b> {t('bài')}</> : so.hv > 0 && !chiDemViec ? <> · <b className="text-slate-100">{so.hv}</b> {t('HV')}</> : null}
                      {quaHan > 0 && <> · <span className="font-bold text-late">{t('⚠ {quaHan} quá hạn', { quaHan })}</span></>}
                      {homNayN > 0 && <> · <span className="font-semibold text-soon">{t('⚠ {n} hạn hôm nay', { n: homNayN })}</span></>}
                    </>}
              </span>
              {!dangMo && <span aria-hidden className="ml-auto text-xs text-slate-500">▸</span>}
            </button>
            {luatNhom?.(k) && <span className="mr-auto pr-4">{luatNhom(k)}</span>}
            </h2>
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
            {dangMo && cuoiNhom?.(k) && <div className="px-4">{cuoiNhom(k)}</div>}
          </section>
        );
      })}
    </div>
  );
}

/** Vạch hạn của Chấm điểm (T14): "Quá hạn · n" luôn hiện; vạch sau tuần này bấm để mở. Số trên vạch = việc · bài của vạch. */
function VachHan({ nhan, items, mo, onMo, children }: { nhan: string; items: readonly WorkItem[]; mo: boolean; onMo?: () => void; children: ReactNode }) {
  const so = demViec(viecThat(items));
  const chu = <>{nhan} · {so.viec ? <>{t('{n} việc', { n: so.viec })}{so.bai ? <> · {t('{soBai} bài', { soBai: so.bai })}</> : null}</> : 0}</>;
  return (
    <>
      {onMo ? (
        <button type="button" aria-expanded={mo} onClick={onMo}
          className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 border-b bg-transparent px-4 py-2 text-left text-[13px] font-semibold text-slate-400 bam sm:min-h-[36px]"
          style={{ borderColor: 'var(--line)' }}>
          <span aria-hidden className="inline-block w-3">{mo ? '▾' : '▸'}</span>{chu}
        </button>
      ) : (
        <div className="flex min-h-[36px] items-center gap-2 border-b px-4 py-2 text-[13px] font-semibold text-slate-400" style={{ borderColor: 'var(--line)' }}>
          <span aria-hidden className="inline-block w-3" />{chu}
        </div>
      )}
      {mo && items.length > 0 && children}
    </>
  );
}

/** Dòng của một nhóm (hoặc một vạch): việc lẻ, dòng gộp lớp, khối em (T01). */
function MucNhom({ items, ...dong }: ChungDong & { items: readonly WorkItem[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {xepTheoEm(items, dong.moCaDong).map((m) => (m.kieu === 'dong'
        ? <li key={`${m.it.key}|${m.it.ownerId ?? ''}`} className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}><Dong it={m.it} {...dong} /></li>
        : (
          <li key={m.khoa} className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-wrap items-baseline gap-x-2 px-4 pb-1 pt-2.5 text-sm">
              <b className="text-[15px] font-semibold text-slate-100">{m.ten}</b>
              <span className="text-xs text-slate-500">{[m.lop, t('{n} việc', { n: m.viec.length })].filter(Boolean).join(' · ')}</span>
            </div>
            <ul className="m-0 list-none p-0">
              {m.viec.map((x, i) => (
                <li key={x.key} className={i ? 'border-t border-dashed' : ''} style={{ borderColor: 'var(--line)' }}><Dong it={x} trongEm {...dong} /></li>
              ))}
            </ul>
          </li>
        )))}
    </ul>
  );
}

/**
 * MỘT VIỆC (mockup `.viec`): [hạn 116 px — chữ "⚠ quá hạn n ngày" một dòng | tên việc (+ SOS) / đối tượng | nút động từ]. Cả dòng bấm mở panel (một kiểu mở); 375 ẩn nút, dòng ≥ 64 px.
 * Dòng gộp lớp nhiều em: bấm mở danh sách việc bên dưới (em có hai việc thành khối em). `trongEm`: đối tượng không lặp tên em.
 */
function Dong({ it, trongEm = false, onOpen, chon, xong, moTrang, moCaDong, nutPhu, theoDoi }: ChungDong & { it: WorkItem; trongEm?: boolean }) {
  const [mo, setMo] = useState(false);
  const con = it.con?.length && !moCaDong(it) ? it.con : null;
  const daXong = xong.has(it.key);
  const dangChon = chon === it.key;
  const xem = theoDoi(it);
  const bam = () => (con ? setMo(!mo) : onOpen(it));
  const viecCaLop = it.group === 'chot_len_ft' || it.group === 'xet_lai_lo_trinh' || it.group === 'ky_vong_dau_ra';
  const gomLop = !!it.con?.length || viecCaLop;
  /* UI-CV-TVV (mockup `tvv.html .viec`): việc TVV theo em — đối tượng chỉ "em · lớp", trạng thái là badge ngay sau. */
  const tvv = laViecTvvTheoEm(it);
  const doiTuong = tvv ? [trongEm ? null : it.studentName, it.classCode].filter(Boolean).join(' · ') : [
    gomLop || trongEm ? null : it.studentName,
    !trongEm && it.classCode && it.studentName !== `Lớp ${it.classCode}` ? it.classCode : null,
    it.contextLabel ?? (trongEm ? it.phu : null),
    !gomLop && it.group === 'score' && it.soBai ? t('{soBai} bài', { soBai: it.soBai }) : !gomLop && it.count !== null && it.count > 1 ? t('{n} HV', { n: it.count }) : null,
  ].filter(Boolean).join(' · ');
  const nguoi = it.mine ? null : it.owner ?? (it.ownerId === null && !viecCaLop ? (dich(it.statusLabel) === CHAM_CHEO ? CHAM_CHEO : t('Chưa có người')) : null);
  /* brief 7: chế độ theo dõi — không động từ; quyền làm thay thật (`lamThay`) mới có nút. */
  const nut = con ? dich(it.actionLabel) : laViecChamCheo(it) && !con ? t('Chấm Speaking') : xem ? ((it as { lamThay?: boolean }).lamThay ? (it.group === 'score' ? t('Nhập hộ') : t('Làm thay')) : null) : dich(it.actionLabel);
  const loaiHan = LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh';
  const maDs = `con-${it.key}`;
  return (
    <>
      <div data-hd="cv-dong" data-khoa={it.key} onClick={bam} title={con ? undefined : dich(it.reason)}
        className={`grid cursor-pointer grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 py-2.5 pr-4 max-sm:min-h-[64px] sm:grid-cols-[116px_minmax(0,1fr)_auto] sm:min-h-[56px] ${
          trongEm ? 'pl-7' : 'pl-4'} ${dangChon ? 'row-active' : 'bam'} ${daXong ? 'opacity-60' : ''}`}>
        <span className="row-span-2 self-start pt-0.5 text-[13px] leading-snug [&>span]:text-[13px] max-sm:[&_*]:!whitespace-normal">
          {daXong ? null : it.due ? <Han loai={loaiHan} han={it.due} haiDong /> : laViecChamCheo(it) ? null : <span className="text-slate-500">{tvv || it.group === 'bo_sung_ho_so' ? t('không hạn') : t('Chưa có hạn')}</span>}
          {!daXong && it.due && tvv && <HanPhu it={it} />}
        </span>
        <button type="button" className="flex min-w-0 appearance-none flex-wrap items-center gap-x-1.5 gap-y-0.5 border-0 bg-transparent p-0 text-left"
          onClick={(e) => { e.stopPropagation(); bam(); }} aria-expanded={con ? mo : undefined} aria-controls={con && mo ? maDs : undefined}
          aria-current={dangChon ? 'true' : undefined}>
          <span className={`text-[15px] font-semibold text-slate-100 ${daXong ? 'line-through decoration-slate-500' : ''}`}>
            {daXong && <span aria-hidden>✓ </span>}{dich(it.group === 'bao_ph_yt' && it.phu ? it.phu : it.tieuDe)}
          </span>
          {moTrang(it) && !con && <span aria-label={t('mở trang')} className="text-xs font-normal text-[color:var(--accent)]">↗</span>}
          {daXong && <NhanTrangThai t="xong" />}
          {it.level && (mucSosTheoNhan(it.level.text) ? <ChipSos muc={mucSosTheoNhan(it.level.text)!} tinh /> : <Level tone={it.level.tone}>{dich(it.level.text)}</Level>)}
        </button>
        <span className="col-start-2 flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-slate-400 sm:col-start-2 sm:row-start-2">
          <span className="min-w-0 break-words">{dich(doiTuong)}{nguoi && <>{doiTuong ? ' · ' : ''}<span className="text-slate-300">{nguoi}</span></>}</span>
          {/* Cột giữa hẹp (1024): badge dài xuống dòng, không chui dưới nút. */}
          {tvv && !daXong && <span className="min-w-0 max-w-full [&>span]:h-auto [&>span]:min-h-[22px] [&>span]:whitespace-normal [&>span]:py-0.5 [&>span]:leading-snug"><BadgeViecTvv it={it} /></span>}
          {nutPhu && <span onClick={(e) => e.stopPropagation()}>{nutPhu(it)}</span>}
        </span>
        {nut && !daXong && (
          <span className="hidden sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex sm:justify-end" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn btn-sm min-h-[32px]" onClick={bam} aria-expanded={con ? mo : undefined}>
              {nut}{con && <span aria-hidden className="ml-1">{mo ? '▴' : '▾'}</span>}
            </button>
          </span>
        )}
      </div>
      {con && mo && <div id={maDs} className="border-t" style={{ borderColor: 'var(--line)' }}><MucNhomCon items={con} chung={{ onOpen, chon, xong, moTrang, moCaDong, nutPhu, theoDoi }} /></div>}
    </>
  );
}

/** Việc trong dòng gộp nhiều em: cùng cách vẽ, thụt vào một bậc (`MucNhom` gom em có hai việc). */
function MucNhomCon({ items, chung }: { items: readonly WorkItem[]; chung: ChungDong }) {
  return <div className="pl-3" style={{ background: 'var(--surface)' }}><MucNhom items={items} {...chung} /></div>;
}

/** Việc TVV theo từng em (Báo PH · Sau thi · Chốt ngày thi) — dòng kiểu `tvv.html .viec`. */
const laViecTvvTheoEm = (it: WorkItem) => it.studentId !== null && !it.con?.length
  && (it.group === 'bao_ph_yt' || it.group === 'thi_that' || it.group === 'buoc_tiep' || it.key.startsWith('chot-ngay-thi:'));

/** Dòng phụ dưới hạn (mockup `.han .phu`): Báo PH "còn n ngày" · Sau thi "hạn bước tiếp". Quá hạn / hôm nay đã có tín hiệu của `Han`. */
function HanPhu({ it }: { it: WorkItem }) {
  const { homNay } = useNgayNghiepVu();
  if (it.urgency !== 'normal' || !it.due || !homNay) return null;
  const chu = it.group === 'buoc_tiep' ? t('hạn bước tiếp') : it.group === 'bao_ph_yt' ? t('còn {n} ngày', { n: daysBetween(homNay, it.due) }) : null;
  return chu ? <span className="block text-xs text-slate-500">{chu}</span> : null;
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
