import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { nhanMocViPham, ngay, bacDu } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { BadgeViec } from './khoiYThuc.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import type { BaoPhLan } from './kieu.ts';

/**
 * Ý THỨC V2 (mockup `thiet-ke/2026-11-11-y-thuc-v2/y-thuc-v2.html`, chủ SP duyệt 11/11) — "MỘT LẦN = MỘT KHỐI, MỘT VI PHẠM = MỘT DÒNG".
 * Đọc trái → phải đúng thứ tự xử lý: ① Vi phạm → ② GVCN xử lý → ③ TVV báo PH → Bước tiếp (một nút đúng vai). Các ô bên phải đứng cho cả lần.
 * Khung ≥ 1220 px: hàng lưới 5 cột (tab lớp) / 4 cột (tab HV, `coHv=false`); hẹp hơn: thẻ, nhãn trên giá trị. Dùng chung tab lớp + tab HV.
 */

/** Một vi phạm trên dòng — từ dòng thời gian đã nạp (không thêm request). */
export type VpDong = {
  id: number; ngay: string; ten: string; skill: string | null; nhom: string | null; nguoiGhi: string | null; moTa: string;
  nhanTrangThai?: string | null;
};

/** Chip môn (chủ SP 11/11): mã ngắn của môn vi phạm; không ghi môn thì chừa chỗ để chữ thẳng cột. */
const MON_NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', writing: 'W', speaking: 'S', pronunciation: 'P' };
export function ChipMon({ skill }: { skill: string | null }) {
  const m = skill ? MON_NGAN[skill] ?? skill.slice(0, 2).toUpperCase() : null;
  return (
    <span aria-hidden={!m} className={`mr-2 inline-flex h-5 min-w-[26px] shrink-0 items-center justify-center rounded border px-1 text-xs font-bold tabular-nums text-slate-300 surface-2 ${m ? '' : 'invisible'}`}
      style={{ borderColor: 'var(--line-strong)' }}>{m ? <><span className="sr-only">{t('Môn')} </span>{m}</> : '·'}</span>
  );
}

/* Lưới theo khung (viết đủ chữ — Tailwind chỉ sinh CSS cho tên lớp thấy trong mã). */
const LUOI_HV = '[@container(min-width:1220px)]:grid [@container(min-width:1220px)]:grid-cols-[200px_minmax(0,1fr)_232px_330px_180px]';
const LUOI_EM = '[@container(min-width:1220px)]:grid [@container(min-width:1220px)]:grid-cols-[minmax(0,1fr)_250px_380px_190px]';

/** Đầu cột (chỉ khung rộng) — tab HV. Không số (chủ SP 12/11). */
export function DauCot({ coHv, ph, cuoi = t('Bước tiếp') }: { coHv: boolean; ph?: ReactNode; cuoi?: string }) {
  return (
    <div className={`hidden min-h-[40px] items-center gap-x-0 border-b text-[13px] font-semibold text-slate-400 ${coHv ? LUOI_HV : LUOI_EM}`} style={{ borderColor: 'var(--line)' }}>
      {coHv && <span aria-hidden className="px-3 pl-4">{t('Học viên')}</span>}
      <span aria-hidden className={`px-3 ${coHv ? '' : 'pl-4'}`}>{t('Vi phạm')}</span>
      <span aria-hidden className="px-3">{t('GVCN xử lý')}</span>
      <span className="flex items-center gap-1 px-3"><span aria-hidden>{t('TVV báo PH')}</span>{ph}</span>
      <span aria-hidden className="px-3 pr-4">{cuoi}</span>
    </div>
  );
}

/** Tiêu đề nhóm (mockup `.nhom-h`): chữ 15 đậm · đếm · ⓘ. Bắt buộc: nền vàng, chữ vàng; Xong: nền thẻ. */
export function NhomLan({ chu, dem, i, tong, children }: { chu: string; dem: ReactNode; i?: ReactNode; tong?: 'bb' | 'gap'; children: ReactNode }) {
  return (
    <section aria-label={chu}>
      <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-b px-4 py-2.5 max-sm:px-3 ${tong === 'bb' ? 'bg-soon-bg' : ''}`}
        style={{ borderColor: 'var(--line)', background: tong === 'bb' ? undefined : tong === 'gap' ? 'var(--surface)' : 'var(--surface-2)' }}>
        <h3 className={`m-0 text-[15px] font-bold ${tong === 'bb' ? 'text-soon' : 'text-slate-100'}`}>{chu}</h3>
        <span className="text-[13px] tabular-nums text-slate-400">{dem}</span>
        {i && <span className="-ml-1 self-center">{i}</span>}
      </div>
      {children}
    </section>
  );
}

/** Hộp thông tin khi rê / focus tên vi phạm (chủ SP 11/11) — chỉ máy có chuột; chạm (375) thì mở tại chỗ. Dữ liệu đã nạp. */
function HopVp({ v, homNay }: { v: VpDong; homNay: string }) {
  const truong: [string, ReactNode][] = [
    [t('Nhóm'), v.nhom], [t('Xảy ra'), ngay(v.ngay, homNay)], [t('Người ghi'), v.nguoiGhi], [t('Mô tả'), v.moTa || null], [t('Trạng thái'), v.nhanTrangThai ? dich(v.nhanTrangThai) : null],
  ];
  return (
    <span role="tooltip" className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 grid w-[min(400px,80vw)] gap-2 rounded-[10px] border px-3.5 py-3 text-left opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 [@media(hover:none)]:hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
      <b className="flex items-start text-[15px] font-bold text-slate-100"><ChipMon skill={v.skill} />{v.ten}</b>
      <span className="grid grid-cols-[6.5rem_minmax(0,1fr)]">
        {truong.filter(([, g]) => g).map(([n, g], i) => (
          <span key={n} className="contents">
            <span className={`py-1.5 text-[13px] text-slate-500 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>{n}</span>
            <span className={`line-clamp-3 py-1.5 text-sm text-slate-100 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>{g}</span>
          </span>
        ))}
      </span>
      <span className="text-xs text-slate-500">{t('Bấm để mở · Sửa · Xoá')}</span>
    </span>
  );
}

/** Danh sách vi phạm của một lần: ngày · chip môn · tên (bấm → mở tại chỗ). */
function DsVp({ ds, homNay, moId, onMo, chiTiet }: { ds: VpDong[]; homNay: string; moId: number | null; onMo: (id: number) => void; chiTiet: (v: VpDong) => ReactNode }) {
  if (!ds.length) return <span className="text-slate-500">—</span>;
  return (
    <ul className="m-0 list-none p-0">
      {ds.map((v) => (
        <li key={v.id} className="border-t border-dashed py-2 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
          <span className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-x-2">
            <span className="pt-px text-[13px] font-semibold tabular-nums text-slate-400 max-sm:pt-3">{ngay(v.ngay, homNay)}</span>
            <span className="group relative min-w-0">
              <button type="button" aria-expanded={moId === v.id} onClick={() => onMo(v.id)}
                className="flex min-w-0 appearance-none items-start border-0 bg-transparent p-0 text-left text-sm font-medium text-slate-100 hover:text-[color:var(--accent)] hover:underline max-sm:min-h-[44px] max-sm:items-center">
                <ChipMon skill={v.skill} /><span className="min-w-0 break-words">{v.ten}</span>
              </button>
              {moId !== v.id && <HopVp v={v} homNay={homNay} />}
            </span>
          </span>
          {moId === v.id && <div className="mt-2 pl-[52px] max-sm:pl-0">{chiTiet(v)}</div>}
        </li>
      ))}
    </ul>
  );
}

/**
 * MỘT KHỐI LẦN. `hv` = ô Học viên (tab lớp); null ở tab HV. `gv` ② · `ph` ③ · `tiep` Bước tiếp. `duoi` = phần mở tại chỗ dưới khối (Báo PH đủ, thang).
 * Khung hẹp: thẻ — ② / ③ có nhãn, nút rộng cả thẻ.
 */
export function KhoiLan({ id, hv, vp, gv, ph, tiep, nen, duoi, homNay, moVp, onMoVp, chiTietVp }: {
  id?: string; hv: ReactNode | null; vp: VpDong[]; gv: ReactNode; ph: ReactNode | null; tiep: ReactNode; nen?: 'mo' | 'vua'; duoi?: ReactNode;
  homNay: string; moVp: number | null; onMoVp: (id: number) => void; chiTietVp: (v: VpDong) => ReactNode;
}) {
  const coHv = hv != null;
  const lopNen = nen === 'mo' ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : nen === 'vua' ? 'bg-ok-bg' : '';
  const o = 'min-w-0 px-3 py-2.5';
  const vien = "[@container(min-width:1220px)]:border-l";
  const nhan = (chu: string) => <span className={`mb-1 block text-xs font-medium text-slate-500 [@container(min-width:1220px)]:sr-only`}>{chu}</span>;
  return (
    <div id={id} className="scroll-mt-24 border-b" style={{ borderColor: 'var(--line)' }}>
      <div className={`grid gap-y-1 py-1 ${coHv ? LUOI_HV : LUOI_EM} [@container(min-width:1220px)]:py-0 ${lopNen}`}>
        {coHv && <div className={`${o} pl-4 max-sm:pl-3`}>{hv}</div>}
        <div className={`${o} ${coHv ? '' : 'pl-4'} max-sm:px-3`}>
          <DsVp ds={vp} homNay={homNay} moId={moVp} onMo={onMoVp} chiTiet={chiTietVp} />
        </div>
        <div className={`${o} ${vien} max-sm:px-3`} style={{ borderColor: 'var(--line)' }}>{nhan(t('GVCN xử lý'))}{gv}</div>
        {ph == null
          ? <div className={`hidden ${o} ${vien} [@container(min-width:1220px)]:block`} style={{ borderColor: 'var(--line)' }}><span className="text-slate-500">—</span></div>
          : <div className={`${o} ${vien} max-sm:px-3`} style={{ borderColor: 'var(--line)' }}>{nhan(t('TVV báo PH'))}{ph}</div>}
        <div className={`${o} pr-4 ${vien} max-sm:px-3`} style={{ borderColor: 'var(--line)' }}>{tiep}</div>
      </div>
      {duoi && <div className="px-4 pb-4 max-sm:px-3" style={{ background: 'var(--accent-soft)' }}>{duoi}</div>}
    </div>
  );
}

/** Ô ② / ③: badge + dòng phụ (chữ nhỏ) — mỗi dòng một trường, không nối dài. */
export function OBuoc({ badge, phu }: { badge: ReactNode; phu?: (ReactNode | null | false)[] }) {
  return (
    <span className="flex flex-col items-start gap-[5px]">
      {badge}
      {(phu ?? []).filter(Boolean).map((p, i) => <span key={i} className="text-xs text-slate-400">{p}</span>)}
    </span>
  );
}

/**
 * Ô ③ TVV báo PH của ĐÚNG lần (Y-THUC-V2). GV đọc trạng thái + Nội dung; "Xem đủ ▾" mở mọi lần ghi tại chỗ (`onXemDu`).
 * `null` = lần chưa có việc (chưa lưu xử lý / dữ liệu cũ).
 */
export function OBaoPh({ b, homNay, tvv, moDu, onXemDu, onSuaHan }: {
  b: BaoPhLan | null | undefined; homNay: string; tvv?: string | null; moDu?: boolean; onXemDu?: () => void;
  /** G3-20: "Sửa hạn" cạnh hạn cho mọi vai có quyền (`b.coTheSuaHan`) — cùng chỗ với TVV, không sau "Xem đủ". */ onSuaHan?: () => void;
}) {
  if (!b) return <span className="text-slate-500">—</span>;
  const chuaLh = b.lan?.ketQua === 'chua_lien_he';
  const badge = b.trangThai === 'xong' ? <BadgeViec tong="xong">{b.ngay ? t('Đã báo {ngay}', { ngay: ngay(b.ngay, homNay) }) : t('Đã báo PH')}</BadgeViec>
    : b.trangThai === 'bo' ? <BadgeViec tong="xam">{t('Đã bỏ')}</BadgeViec>
    : <BadgeViec tong={b.quaHan ? 'qua' : 'cho'}>{chuaLh ? t('Chưa liên hệ được · lần {n}', { n: b.soLan }) : t('Chưa báo')}</BadgeViec>;
  return (
    <span className="flex flex-col items-start gap-[5px]">
      {badge}
      {b.trangThai === 'mo' && b.lan && <span className="text-xs tabular-nums text-slate-400">{t('ghi {ngay}', { ngay: ngay(b.lan.ngay, homNay) })}</span>}
      {b.trangThai === 'mo' && (
        <span className="text-xs tabular-nums text-slate-400">{t('hạn {ngay}', { ngay: ngay(b.han, homNay) })}{b.daChinh ? ` · ${t('đã chỉnh')}` : ''}{tvv ? ` · ${t('TVV {ten}', { ten: tvv })}` : ''}
          {b.coTheSuaHan && onSuaHan && <>{' · '}<button type="button" onClick={onSuaHan}
            className="link min-h-[28px] appearance-none border-0 bg-transparent p-0 text-xs font-semibold max-sm:min-h-[44px]">{t('Sửa hạn')}</button></>}
        </span>
      )}
      {b.trangThai === 'xong' && tvv && <span className="text-xs text-slate-400">{t('TVV {ten}', { ten: tvv })}</span>}
      {/* Trích Nội dung (2 dòng) — chủ SP 11/11: một ô Nội dung cho mọi kết quả. */}
      {b.lan?.noiDung && (
        <span className="grid w-full grid-cols-[62px_minmax(0,1fr)] gap-x-2 text-[13px] leading-snug">
          <span className="text-xs leading-5 text-slate-500">{t('Nội dung')}</span><span className="line-clamp-2 text-slate-100">{b.lan.noiDung}</span>
        </span>
      )}
      {b.soLan > 0 && onXemDu && (
        <button type="button" aria-expanded={!!moDu} onClick={onXemDu}
          className="link min-h-[28px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]">
          {moDu ? `▴ ${t('Thu gọn')}` : b.soLan > 1 ? `${t('Xem đủ · {n} lần ghi', { n: b.soLan })} ▾` : `${t('Xem đủ')} ▾`}
        </button>
      )}
    </span>
  );
}

type ViecBaoPhXem = {
  id: number; nhan: string; han: string; trangThai: 'mo' | 'xong' | 'bo'; hanChon: string | null; coTheSuaHan: boolean;
  lan: { ketQua: string; nhan: string; ngay: string; ghiChu: string | null; nguoi: string | null; luc: string }[];
  bo: { nhan: string | null; chu: string | null } | null;
};
/** "Xem đủ" Báo PH — mọi lần ghi của TVV (mới nhất trước). Gọi `GET /y-thuc/bao-ph/:id` CHỈ khi mở (máy chủ kiểm quyền xem em). */
export function BaoPhDu({ id, homNay, onSuaHan }: { id: number; homNay: string; onSuaHan?: () => void }) {
  const { data: v, error, reload } = useApi<ViecBaoPhXem>(`/y-thuc/bao-ph/${id}`, [id]);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (!v) return <Skeleton rows={2} />;
  const ds = [...v.lan].reverse();
  return (
    <div className="grid gap-2.5 rounded-[10px] border px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h4 className="m-0 text-[15px] font-bold text-slate-100">{t('Báo PH · lần {nhan}', { nhan: bacDu(dich(v.nhan)) })}</h4>
        {v.trangThai === 'mo' && <span className="rounded-md px-2 text-xs font-semibold leading-[22px] text-slate-400 surface-2">{t('hạn {ngay}', { ngay: ngay(v.han, homNay) })}</span>}
        {v.coTheSuaHan && onSuaHan && <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-0" onClick={onSuaHan}>{t('Sửa hạn')}</button>}
      </div>
      {v.bo && <p className="m-0 text-[13px] text-slate-400">{t('Đã bỏ')}{v.bo.nhan ? ` · ${bacDu(dich(v.bo.nhan))}` : ''}{v.bo.chu ? ` · ${v.bo.chu}` : ''}</p>}
      {ds.length === 0 ? <p className="m-0 text-[13px] text-slate-500">{t('Chưa có lần ghi nào.')}</p> : ds.map((l, i) => (
        <div key={i} className={`grid gap-x-4 gap-y-1.5 py-2 text-sm sm:grid-cols-[120px_180px_minmax(0,1fr)] ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
          <span className="text-[13px] font-semibold tabular-nums text-slate-400">{lucVn(l.luc)}{l.nguoi && <span className="block text-xs font-medium text-slate-500">{l.nguoi}</span>}</span>
          <span className="flex flex-col items-start gap-1"><BadgeViec tong={l.ketQua === 'da_bao' ? 'xong' : 'cho'}>{dich(l.nhan)}</BadgeViec>
            {l.ngay !== l.luc.slice(0, 10) && <span className="text-xs tabular-nums text-slate-500">{t('ngày {ngay}', { ngay: ngay(l.ngay, homNay) })}</span>}</span>
          <span className="grid grid-cols-[86px_minmax(0,1fr)] gap-x-3"><span className="text-[13px] text-slate-500">{t('Nội dung')}</span><span className="whitespace-pre-line break-words text-slate-100">{l.ghiChu || '—'}</span></span>
        </div>
      ))}
    </div>
  );
}

/**
 * DẢI TIẾN TRÌNH Vi phạm → GVCN xử lý → TVV báo PH (mockup K8; YT-b mockup v19 B5: ba ô tên bước, không số).
 * `nay` = bước người xem đang làm: nền nhấn + chữ "Bạn" (không chỉ màu). Khung hẹp: mỗi bước một hàng.
 */
export function TienTrinh({ buoc, nay }: { buoc: [ReactNode, ReactNode?][]; nay: number | null }) {
  const ten = [t('Vi phạm'), t('GVCN xử lý'), t('TVV báo PH')];
  /* 375 (mockup K8c / K8d): nhãn ngắn để cột nhãn không xuống ba dòng. */
  const ngan = [t('Vi phạm'), 'GVCN', t('Báo PH')];
  return (
    <ol aria-label={t('Tiến trình xử lý')} className="m-0 grid list-none overflow-hidden rounded-[10px] border p-0 sm:grid-cols-3" style={{ borderColor: 'var(--line)' }}>
      {buoc.map(([gt, ph], i) => (
        <li key={i} aria-current={nay === i ? 'step' : undefined}
          className={`grid min-w-0 content-start gap-1 border-t px-3 py-2.5 first:border-t-0 max-sm:grid-cols-[92px_minmax(0,1fr)] sm:border-l sm:border-t-0 sm:first:border-l-0 ${nay === i ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_2px_0_var(--accent)]' : ''}`}
          style={{ borderColor: 'var(--line)' }}>
          <span className={`flex items-center gap-1.5 text-xs font-semibold max-sm:row-span-2 ${nay === i ? 'text-[color:var(--accent)]' : 'text-slate-500'}`}>
            <span className="max-sm:hidden">{ten[i]}</span><span className="sm:hidden">{ngan[i]}</span>
            {nay === i && <span className="ml-auto rounded border border-[color:var(--accent)] px-1.5 text-xs font-bold leading-4 text-[color:var(--accent)] max-sm:ml-0">{t('Bạn')}</span>}
          </span>
          <span className="min-w-0 text-sm font-semibold text-slate-100">{gt}</span>
          {ph && <span className="text-xs text-slate-400">{ph}</span>}
        </li>
      ))}
    </ol>
  );
}

/** Mốc vi phạm dưới tên em (chủ SP 12/11): "REPORT 1", "WARNING LETTER 1"… viết hoa, không "Đã tới"; chưa có → "Chưa có vi phạm". Cùng `bac` với thang. */
export const chuMoc = (bac: number, coViPham = true): string => nhanMocViPham(bac, dich) ?? (coViPham ? t('Chưa có mốc') : t('Chưa có vi phạm'));   // PTA 12/11: có vi phạm mà chưa tới mốc → "Chưa có mốc"

/** Chip mốc cạnh tên em → hộp nhỏ tại chỗ (thang, Khai bậc, Lịch sử của em). */
export function ChipBac({ bac, ten, children }: { bac: number; ten: string; children: (dong: () => void) => ReactNode }) {
  const nhan = chuMoc(bac);
  const [mo, setMo] = useState(false);
  const hop = useRef<HTMLSpanElement>(null);
  useBamNgoai(mo, () => setMo(false), hop);
  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [mo]);
  return (
    <span ref={hop} className="relative inline-block">
      <button type="button" aria-expanded={mo} aria-haspopup="dialog" aria-label={`${t('Thang xử lý vi phạm')} · ${ten} · ${nhan}`} onClick={() => setMo((x) => !x)}
        className={`inline-flex h-6 items-center gap-1 rounded-md border bg-transparent px-2 text-xs appearance-none max-sm:h-11 ${bac > 0 ? 'font-semibold text-slate-100' : 'font-medium text-slate-400'}`} style={{ borderColor: 'var(--line-strong)' }}>
        {nhan}<span aria-hidden className="text-xs text-slate-500">▾</span>
      </button>
      {mo && (
        <span role="dialog" aria-label={t('Thang xử lý vi phạm')} className="absolute left-0 top-full z-40 mt-2 grid w-[min(460px,85vw)] gap-2.5 rounded-[10px] border px-3.5 py-3 shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          {children(() => setMo(false))}
        </span>
      )}
    </span>
  );
}

/* =====================================================================================================================
 * YT-a — TAB Ý THỨC HỒ SƠ LỚP THEO EM (mockup `thiet-ke/v19/y-thuc.html`, chủ SP duyệt #1482): MỌI em, MỘT em = MỘT khối;
 * trong khối mỗi lần một dòng `Vi phạm · Đã xử lý (GVCN / TVV) · Bước đang làm`; thanh "Xem lịch sử" mở tại chỗ. Tab HV giữ `KhoiLan`.
 * ===================================================================================================================== */
const LUOI_KHOI = `[@container(min-width:1220px)]:grid [@container(min-width:1220px)]:grid-cols-[248px_minmax(0,1fr)]`;
const LUOI_DONG = `[@container(min-width:1220px)]:grid [@container(min-width:1220px)]:grid-cols-[minmax(0,1fr)_340px_236px]`;
/** Hồ sơ HV (mockup v20 A4): thêm cột Ngày đầu dòng. */
const LUOI_DONG_NGAY = `[@container(min-width:1220px)]:grid [@container(min-width:1220px)]:grid-cols-[96px_minmax(0,1fr)_320px_236px]`;

/** Đầu cột (khung rộng): không số (chủ SP 12/11). */
export function DauCotEm({ ph, khongHv = false }: { ph?: ReactNode; /** Hồ sơ HV: cột Ngày thay cột Học viên (cùng lưới `DongLan` có `moc`). */ khongHv?: boolean }) {
  return (
    <div className={`hidden min-h-[40px] items-center border-b text-[13px] font-semibold text-slate-400 [@container(min-width:1220px)]:grid ${khongHv ? '[@container(min-width:1220px)]:grid-cols-[96px_minmax(0,1fr)_320px_236px]' : 'px-3 [@container(min-width:1220px)]:grid-cols-[248px_minmax(0,1fr)_340px_236px]'}`} style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
      <span aria-hidden className="px-4">{khongHv ? t('Ngày') : t('Học viên')}</span>
      <span aria-hidden className="px-4">{t('Vấn đề')}</span>
      <span className="flex items-center gap-1 px-4"><span aria-hidden>{t('Đã xử lý')}</span>{ph}</span>
      <span aria-hidden className="px-4">{t('Bước đang làm')}</span>
    </div>
  );
}

/** Khối một em (em còn bước chưa xong): ô Học viên đứng cả khối, các lần xếp dọc, `cuoi` = thanh lịch sử + lịch sử mở. `mo` = mở từ việc / thông báo. */
export function KhoiEm({ id, ten, hv, mo, children, cuoi }: { id: string; ten: string; hv: ReactNode; mo?: boolean; children: ReactNode; cuoi?: ReactNode }) {
  return (
    <article id={id} aria-label={ten}
      className={`scroll-mt-24 overflow-hidden rounded-[10px] border surface-2 ${LUOI_KHOI} ${mo ? 'border-[color:var(--accent)] shadow-[0_0_0_1px_var(--accent)]' : ''}`}
      style={mo ? undefined : { borderColor: 'var(--line-strong)' }}>
      <div className={`min-w-0 px-4 py-3.5 max-sm:px-3 [@container(min-width:1220px)]:border-r`} style={{ borderColor: 'var(--line)' }}>{hv}</div>
      <div className="min-w-0">{children}{cuoi}</div>
    </article>
  );
}

/** Ô "Đã xử lý": GVCN rồi TVV, mỗi dòng có nhãn (gộp ② ③ của V2 — chủ SP duyệt XM-3). Chưa ai làm → "—". */
export function ODaXuLy({ gv, tvv }: { gv?: ReactNode; tvv?: ReactNode }) {
  if (!gv && !tvv) return <span className="text-slate-500" aria-label={t('Chưa xử lý')}>—</span>;
  return (
    <span className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-x-2.5 gap-y-2">
      {gv && <><span className="text-xs font-semibold leading-[22px] text-slate-500">GVCN</span><span className="min-w-0">{gv}</span></>}
      {tvv && <><span className="text-xs font-semibold leading-[22px] text-slate-500">TVV</span><span className="min-w-0">{tvv}</span></>}
    </span>
  );
}

/**
 * Một lần trong khối em (hoặc trong lịch sử, `ls`). Khung rộng: 3 cột; hẹp: vi phạm → "Đã xử lý" → hộp "Bước đang làm" (lịch sử: không hộp).
 * `dx` null → "—" (khung hẹp: ẩn). `nen="vua"`: vừa lưu / vừa xem (nền xanh nhạt).
 */
export function DongLan({ vp, dx, tiep, nen, duoi, ls = false, homNay, moVp, onMoVp, chiTietVp, the, vanDe, moc }: {
  vp: VpDong[]; dx: ReactNode | null; tiep: ReactNode; nen?: 'vua'; duoi?: ReactNode; ls?: boolean;
  homNay: string; moVp: number | null; onMoVp: (id: number) => void; chiTietVp: (v: VpDong) => ReactNode;
  /** TINH-HINH (mockup v20): dòng đầu ô Vấn đề — nhãn loại (`TheLoai`) + người / ngày. `vanDe` thay danh sách vi phạm (dòng tình hình). */
  the?: ReactNode; vanDe?: ReactNode;
  /** Hồ sơ HV (mockup v20 A4): ngày của dòng ở cột đầu (khung rộng); hẹp: dòng nhỏ trên Vấn đề. */
  moc?: string | null;
}) {
  const nhan = (chu: string) => <span className={`mb-1 block text-xs font-medium text-slate-500 [@container(min-width:1220px)]:sr-only`}>{chu}</span>;
  const o = 'min-w-0 px-4 py-3 max-sm:px-3';
  return (
    <div className={`border-t border-dashed first:border-t-0 ${nen === 'vua' ? 'bg-ok-bg' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
      <div className={moc !== undefined ? LUOI_DONG_NGAY : LUOI_DONG}>
        {moc !== undefined && <div className={`${o} pb-0 text-[13px] font-semibold tabular-nums leading-[22px] text-slate-400 [@container(min-width:1220px)]:pb-3`}>{moc ? ngay(moc, homNay) : ''}</div>}
        <div className={o}>{the && <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">{the}</div>}{vanDe ?? <DsVp ds={vp} homNay={homNay} moId={moVp} onMo={onMoVp} chiTiet={chiTietVp} />}</div>
        <div className={`${o} ${dx == null ? `hidden [@container(min-width:1220px)]:block` : ''} max-sm:pt-0`}>{nhan(t('Đã xử lý'))}{dx ?? <ODaXuLy />}</div>
        {ls
          ? <div className={`${o} max-sm:pt-0 [@container(min-width:1220px)]:border-l`} style={{ borderColor: 'var(--line)' }}>{tiep}</div>
          : (
            <div className={`mx-3 mb-3 grid content-start gap-2 rounded-lg border p-2.5 [@container(min-width:1220px)]:m-0 [@container(min-width:1220px)]:rounded-none [@container(min-width:1220px)]:border-y-0 [@container(min-width:1220px)]:border-r-0 [@container(min-width:1220px)]:px-4 [@container(min-width:1220px)]:py-3 ${nen === 'vua' ? `[@container(min-width:1220px)]:bg-transparent` : ''}`}
              style={{ borderColor: 'var(--line)', background: nen === 'vua' ? undefined : 'var(--surface)' }}>
              {nhan(t('Bước đang làm'))}{tiep}
            </div>
          )}
      </div>
      {duoi && <div className="px-4 pb-4 max-sm:px-3">{duoi}</div>}
    </div>
  );
}

/** Thanh "Xem lịch sử · n" — một dáng ở mọi chỗ (khối em, dòng em gọn); 375 cao 44. */
export function ThanhLs({ so, mo, ten, onClick }: { so: number | null; mo: boolean; ten: string; onClick: () => void }) {
  return (
    <button type="button" aria-expanded={mo} aria-label={`${mo ? t('Thu gọn lịch sử') : t('Xem lịch sử')} · ${ten}`} onClick={onClick}
      className={`inline-flex h-8 min-w-[200px] shrink-0 appearance-none items-center gap-2 rounded-[7px] border px-2.5 text-left text-[13px] font-semibold text-[color:var(--accent)] hover:border-[color:var(--accent)] max-sm:h-11 max-sm:w-full ${mo ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line-strong)] bg-[color:var(--surface)]'}`}>
      <span aria-hidden className={`text-xs transition-transform motion-reduce:transition-none ${mo ? 'rotate-90' : ''}`}>▶</span>
      {mo ? t('Thu gọn lịch sử') : t('Xem lịch sử')}
      {so != null && <span className="ml-auto rounded-[5px] px-1.5 text-xs font-semibold tabular-nums text-slate-400 surface-2">{so}</span>}
    </button>
  );
}

/** Phần lịch sử mở tại chỗ (dưới khối / dòng em): đầu = phạm vi + ⓘ; thân = các dòng `DongLan ls`. */
export function KhungLs({ dau, children }: { dau: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={t('Lịch sử')} className="border-t" style={{ borderColor: 'var(--line-strong)', background: 'var(--bg)' }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 text-[13px] text-slate-400 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>{dau}</div>
      {children}
    </section>
  );
}

/** Dòng em gọn (không còn bước chờ): tên | "✓ Chưa có vi phạm" hoặc thanh lịch sử + "Không có vi phạm chờ"; lịch sử mở nằm dưới, cùng cột Vi phạm. */
export function DongEmGon({ id, hv, mo, children }: { id: string; hv: ReactNode; mo?: boolean; children: ReactNode }) {
  return (
    <div id={id} className={`scroll-mt-24 border-t first:border-t-0 ${LUOI_KHOI} ${mo ? 'surface-2' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0 px-4 py-2.5 max-sm:px-3 max-sm:pb-1">{hv}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** TINH-HINH (mockup v20): nhãn loại dòng trong khối em — chữ + nền, không chỉ màu. Vi phạm · Nhắc nhở (viền đứt) · Tình hình · TVV hỏi. */
export function TheLoai({ loai, so }: { loai: 'vp' | 'nn' | 'th' | 'hoi'; so?: number }) {
  const chu = loai === 'vp' ? (so ? t('Vi phạm · {n}', { n: so }) : t('Vi phạm')) : loai === 'nn' ? t('Nhắc nhở') : loai === 'th' ? t('Tình hình') : t('TVV hỏi');
  const lop = loai === 'th' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
    : loai === 'hoi' ? 'border-[color:var(--line-strong)] bg-doing-bg text-doing'
    : loai === 'nn' ? 'border-dashed border-[color:var(--line-strong)] bg-transparent text-slate-500'
    : 'border-[color:var(--line-strong)] text-slate-400';
  return <span className={`inline-flex h-5 items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold ${lop}`} style={loai === 'vp' ? { background: 'var(--surface)' } : undefined}>{chu}</span>;
}

/** TINH-HINH (mockup v20 A1): hai tab nhỏ trong tab "Ý thức & Phối hợp" — "Tình hình học tập / Ý thức" · "Phối hợp SOS" (số việc chờ). */
export function TabNho<K extends string>({ value, onChange, muc }: { value: K; onChange: (k: K) => void; muc: { key: K; nhan: string; ngan?: string; so?: number | null }[] }) {
  return (
    /* GD-4c: dáng chung `HangTab` (H1) — tab con trong khối, đệm theo khối. */
    <HangTab ariaLabel={t('Ý thức & Phối hợp')} value={value} onChange={onChange} className="px-4 pt-3 max-sm:px-2 max-sm:pt-2"
      tabs={muc.map((m) => ({ key: m.key, label: m.nhan, ngan: m.ngan, so: m.so }))} />
  );
}
