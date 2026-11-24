import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BoLocDoan, Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { BoChonThoiGian } from '../phanTich/BoChonThoiGian.tsx';
import { KN_TUTOR, khoangTuUrl, maTuan, ngay, thamSoKhoang, type KhoangNgay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import {
  NHAN_KET_LUAN, TIEU_CHI, boDau, khoangTutorMacDinh, nhanKyNang, nhanNoiDay,
  type BangTutor, type DongTutor, type TieuChi, type TyLe,
} from './kieu.ts';
import { PanelTutor } from './PanelTutor.tsx';
import { HopGop, HopTutor, HopXuat } from './HopTutor.tsx';
import { TaiDanhSach } from './TaiDanhSach.tsx';

type Loc = 'chu-y' | 'dang-day' | 'ngung' | 'tat-ca';
const CAC_LOC: Loc[] = ['chu-y', 'dang-day', 'ngung', 'tat-ca'];
const LA_LOC = (s: string | null): s is Loc => CAC_LOC.includes(s as Loc);
const ngung = (d: DongTutor) => d.ketLuan?.kl === 'ngung';
const khop: Record<Loc, (d: DongTutor) => boolean> = {
  'chu-y': (d) => !!d.chuY,
  'dang-day': (d) => d.buoi > 0 && !ngung(d),
  ngung,
  'tat-ca': () => true,
};
/** Thứ tự hàng (mockup Ⓣ2): cần chú ý → buổi giảm dần → 0 buổi → Ngừng hợp tác cuối; cùng mức theo tên. */
const thuTu = (a: DongTutor, b: DongTutor) => Number(ngung(a)) - Number(ngung(b)) || Number(!!b.chuY) - Number(!!a.chuY) || b.buoi - a.buoi || a.ten.localeCompare(b.ten, 'vi');

/** Nhãn nhỏ GV / Tutor cạnh tên (R2.2) — chữ, không chỉ màu. */
export function NhanLoai({ d }: { d: { loai: 'gv' | 'tutor' } }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded border px-1.5 text-xs font-semibold text-slate-400" style={{ borderColor: 'var(--line-strong)' }}>
      {d.loai === 'gv' ? t('GV') : t('Tutor')}
    </span>
  );
}

/**
 * TRANG TUTOR (TU2-6, mockup Ⓣ2 `thiet-ke/v21/tutor.html`, luật TU12–TU16) — một bảng "Người dạy" (tutor danh bạ + GV có buổi) cho Head tutor · Head · Quản trị;
 * CX chỉ xem. Đầu trang MỘT hàng: Khoảng tuần (mặc định 4 tuần gồm tuần này, URL `kieu`/`tu`/`den`) · tìm · Lọc ▾ (Nơi dạy · Kỹ năng · Loại — URL `noi`/`kn`/`loai`)
 * · Xuất số buổi · Tải danh sách · Thêm tutor (hai nút sau theo `coDanhBa`). Chip Cần chú ý · Đang dạy · Ngừng · Tất cả (URL `loc`; mặc định tự lùi, không mở ra trống).
 * Danh sách nhỏ → lọc / tìm / phân trang ở web trên MỘT lần đọc `/tutors` (phạm vi Head / CX do máy chủ chặn). Bấm hàng → panel; bấm tỉ lệ cam → panel lọc sẵn.
 */
export default function TutorPage() {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const [params, setParams] = useSearchParams();
  const md = khoangTutorMacDinh(homNay);
  const khoang = khoangTuUrl(params, homNay, md);
  const qs = new URLSearchParams({ kieu: khoang.kieu, tu: khoang.tu, den: khoang.den }).toString();
  const { data, loading, error, reload } = useApi<BangTutor>(`/tutors?${qs}`, [qs]);
  const [tim, setTim] = useState('');
  const [mo, setMo] = useState<{ id: number; tieuChi?: TieuChi; chuY?: boolean } | null>(null);
  const [hop, setHop] = useState<'them' | 'tai' | 'gop' | 'xuat' | null>(null);
  const [tenThem, setTenThem] = useState<{ ten: string; xong?: (id: number) => void } | null>(null);
  const [moLoc, setMoLoc] = useState(false);
  /* 375 (mockup M1): ô tìm gập sau nút 🔍 — bộ lọc trước thẻ đầu ≤ 120 px; đang có chữ thì luôn mở. */
  const [moTim, setMoTim] = useState(false);
  const nutLoc = useRef<HTMLButtonElement>(null);

  const dat = (o: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(o)) { if (v === null) next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };
  const setKhoang = (k: KhoangNgay) => dat({ kieu: null, tu: null, den: null, ...thamSoKhoang(k, homNay, md) });

  const danhBa = !!data?.coDanhBa;
  const ds = data?.dong ?? [];
  const soLoc = (l: Loc) => ds.filter(khop[l]).length;
  const locUrl = params.get('loc');
  /* R2.4: mặc định Cần chú ý khi > 0 → Đang dạy khi > 0 → Tất cả — trang không mở ra trống khi có người dạy. */
  const loc: Loc = LA_LOC(locUrl) ? locUrl : soLoc('chu-y') > 0 ? 'chu-y' : soLoc('dang-day') > 0 ? 'dang-day' : 'tat-ca';
  const noi = params.get('noi') ?? '';
  const kn = (params.get('kn') ?? '').split(',').filter((k) => (KN_TUTOR as readonly string[]).includes(k));
  const loai = params.get('loai') === 'gv' || params.get('loai') === 'tutor' ? params.get('loai')! : '';
  const soLocThem = Number(!!noi) + Number(kn.length > 0) + Number(!!loai);
  const g = boDau(tim);
  const so = tim.replace(/\D/g, '');
  const rows = ds.filter(khop[loc])
    .filter((d) => !noi || (noi === 'online' ? d.noiDay === 'online' : noi === 'chua' ? d.noiDay === null : typeof d.noiDay === 'object' && d.noiDay?.id === Number(noi)))
    .filter((d) => !kn.length || kn.some((k) => d.kyNang.includes(k)))
    .filter((d) => !loai || d.loai === loai)
    .filter((d) => !g || boDau(d.ten).includes(g) || (so.length >= 3 && !!d.sdt?.includes(so)))
    .sort(thuTu);
  const pt = usePhanTrang(rows.length, `${qs}|${loc}|${noi}|${kn}|${loai}|${g}`, t('người dạy'));
  const NHAN_LOC: Record<Loc, string> = { 'chu-y': t('Cần chú ý'), 'dang-day': t('Đang dạy'), ngung: t('Ngừng'), 'tat-ca': t('Tất cả') };
  /* "Người cần chú ý tiếp ›" của panel: người cần chú ý kế tiếp theo thứ tự bảng (vòng về đầu). */
  const chuY = [...ds].filter((d) => d.chuY).sort(thuTu);
  const keTiep = (id: number) => { const i = chuY.findIndex((d) => d.id === id); const k = chuY.filter((d) => d.id !== id); return k.length ? (chuY[i + 1] ?? k[0]) : null; };
  const khoangChu = `${maTuan(khoang.tu).ma} – ${maTuan(khoang.den).ma}`;
  const coTutor = ds.some((d) => d.loai === 'tutor');

  const tyLe = (d: DongTutor, k: TieuChi) => <OTyLe v={d[k]} nhan={TIEU_CHI.find((c) => c.k === k)!.nhan} onClick={d[k][0] < d[k][1] ? () => setMo({ id: d.id, tieuChi: k }) : undefined} />;
  const sao = (v: number | null) => (v == null ? <span className="text-faint">—</span> : <span className={`whitespace-nowrap tabular-nums ${v <= 2 ? 'font-bold text-late' : ''}`}>★ {v.toFixed(1)}</span>);
  /* Cột cuối: lý do cần chú ý (chữ cam + mốc nhận xét) hoặc kết luận gần nhất + ngày — lý do bằng chữ, không chỉ màu (R2.2).
     N56 ⑥: lý do tính mọi thời gian → ghi kèm ngày lần ghi gần nhất; bấm = panel mở đúng các dòng đó (dù ngoài khoảng). */
  const ketLuan = (d: DongTutor) => (d.chuY
    ? <button type="button" className="-mx-1 rounded border-0 bg-transparent px-1 text-left text-[13px] font-semibold text-late hover:underline hover:underline-offset-[3px] max-sm:min-h-[44px]"
      onClick={() => setMo({ id: d.id, chuY: true })} aria-label={`${t('Cần chú ý')}: ${dich(d.chuY)}${d.chuYNgay ? ` · ${ngay(d.chuYNgay, homNay)}` : ''} · ${t('xem lần ghi')}`}>
      {dich(d.chuY)}{d.chuYNgay && <span className="whitespace-nowrap tabular-nums"> · {ngay(d.chuYNgay, homNay)}</span>}</button>
    : d.ketLuan
      ? <span className="whitespace-nowrap">{NHAN_KET_LUAN[d.ketLuan.kl]}<span className="ml-1.5 text-[13px] tabular-nums text-faint">{ngay(d.ketLuan.luc, homNay)}</span></span>
      : <span className="text-faint">—</span>);
  const ten = (d: DongTutor) => (
    <span className="flex min-w-0 items-center gap-2">
      <span className={`truncate font-semibold ${ngung(d) ? 'text-faint' : 'text-slate-100'}`}>{d.ten}</span><NhanLoai d={d} />
    </span>
  );
  const chuThieu = (d: DongTutor) => d.thieu.map((x) => (x === 'sdt' ? t('thiếu SĐT') : t('thiếu nơi dạy'))).join(' · ');
  const chuSau = (d: DongTutor) => (d.ketLuan ? t('sau nhận xét {ngay}', { ngay: ngay(d.ketLuan.luc, homNay) }) : t('chưa có nhận xét'));
  /* Dòng phụ 12 px (hàng 64 — luật `Bang`): dưới tên "thiếu SĐT · thiếu nơi dạy"; dưới lý do cần chú ý mốc nhận xét. */
  const phuCua = (d: DongTutor, c: CotBang): ReactNode => (c.key === 'ten' && d.thieu.length ? chuThieu(d) : c.key === 'kl' && d.chuY ? chuSau(d) : null);

  const NHOM = t('Có / có trả lời');
  const cot: CotBang[] = [
    { key: 'ten', nhan: t('Người dạy'), kieu: 'ten', rong: 240 },
    { key: 'noi', nhan: t('Nơi dạy'), kieu: 'chu', rong: 110 },
    { key: 'kn', nhan: t('Kỹ năng'), kieu: 'chu', rong: 90 },
    { key: 'buoi', nhan: t('Buổi'), kieu: 'so', rong: 80, goiY: t('Tổng số buổi đã ghi trong khoảng (một dòng gộp 2 buổi đếm 2).') },
    ...TIEU_CHI.map((c): CotBang => ({ key: c.k, nhan: c.nhan, kieu: 'diem-ti-le', nhom: NHOM, rong: 104 })),
    { key: 'sao', nhan: t('Đánh giá'), kieu: 'so', rong: 90 },
    { key: 'kl', nhan: t('Kết luận / lý do'), kieu: 'chu', linhHoat: true, rong: 220 },
  ];
  const oCua = (d: DongTutor, c: CotBang): ReactNode => {
    switch (c.key) {
      case 'ten': return ten(d);
      case 'noi': return <span className="text-slate-400">{nhanNoiDay(d.noiDay)}</span>;
      case 'kn': return <span className="text-slate-400">{nhanKyNang(d.kyNang)}</span>;
      case 'buoi': return <span className="tabular-nums">{d.buoi}</span>;
      case 'sao': return sao(d.danhGia);
      case 'kl': return ketLuan(d);
      default: return tyLe(d, c.key as TieuChi);
    }
  };
  const moHang = (d: DongTutor) => setMo({ id: d.id });
  const phim = (d: DongTutor) => (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); moHang(d); }
  };
  /* Hàng tự vẽ (`hangRieng`): người 0 buổi → MỘT ô gộp "chưa có buổi trong khoảng" thay 5 ô số (mockup T2). */
  const o = (d: DongTutor, c: CotBang) => {
    const phu = phuCua(d, c);
    return <OBang key={c.key} c={c}>{oCua(d, c)}{phu && <span className="bang-phu" data-phu-odiem="">{phu}</span>}</OBang>;
  };
  const hangRieng = (d: DongTutor) => (
    <tr key={d.id} className={`bam ${mo?.id === d.id ? 'dang-mo' : ''} ${ngung(d) ? 'hang-mo' : ''}`} tabIndex={0}
      onClick={(e) => { if (!(e.target as Element).closest('button,a')) moHang(d); }} onKeyDown={phim(d)}>
      {cot.slice(0, 3).map((c) => o(d, c))}
      {d.buoi > 0 ? cot.slice(3, 8).map((c) => o(d, c))
        : <OBang c={cot[3]} colSpan={5} className="!text-center text-[13px] text-faint">{t('chưa có buổi trong khoảng')}</OBang>}
      {o(d, cot[8])}
    </tr>
  );
  /* 375 (R2.11): thẻ — tên + nhãn · ★ │ KN · nơi dạy │ lý do / kết luận │ Buổi · 3 tỉ lệ một hàng. */
  const the = (d: DongTutor) => (
    <div className="grid gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-[14px] font-bold ${ngung(d) ? 'text-faint' : 'text-slate-100'}`}>{d.ten}</span><NhanLoai d={d} />
        {d.danhGia != null && <span className="ml-auto">{sao(d.danhGia)}</span>}
      </div>
      <span className="text-[13px] text-slate-400">{[nhanKyNang(d.kyNang), nhanNoiDay(d.noiDay), d.thieu.length ? chuThieu(d) : null].filter(Boolean).join(' · ')}</span>
      {(d.chuY || d.ketLuan) && <div className="text-[13px]">{ketLuan(d)}{d.chuY && <span className="block text-xs text-faint">{chuSau(d)}</span>}</div>}
      {d.buoi > 0 ? (
        <div className="grid grid-cols-4 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
          {[{ nhan: t('Buổi'), v: <span className="tabular-nums">{d.buoi}</span> }, ...TIEU_CHI.map((c) => ({ nhan: c.k === 'feedbackGv' ? t('Feedback') : c.nhan, v: tyLe(d, c.k) }))].map((o, i) => (
            <div key={i} className={`grid gap-0.5 px-2 py-1 ${i ? 'border-l' : ''}`} style={{ borderColor: 'var(--line)' }}>
              <span className="truncate text-xs text-slate-400">{o.nhan}</span><span className="text-[14px] font-semibold">{o.v}</span>
            </div>
          ))}
        </div>
      ) : <span className="text-[13px] text-faint">{t('chưa có buổi trong khoảng')}</span>}
    </div>
  );

  const nutXuat = <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setHop('xuat')} data-hd="tutor-xuat">{t('Xuất số buổi')}</button>;
  const nutTai = <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setHop('tai')} data-hd="tutor-tai">{t('Tải danh sách')}</button>;
  const nutThem = <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => setHop('them')} data-hd="tutor-them">{t('Thêm tutor')}</button>;

  return (
    <div className="page space-y-3" data-hd="tutor-trang">
      {/* R2.3: đầu trang MỘT hàng (1440): tiêu đề · khoảng tuần · tìm · Lọc ▾ · phải: Xuất số buổi · Tải danh sách · Thêm tutor. 375: tiêu đề + Thêm tutor + ⋯, rồi khoảng · Lọc. */}
      <div className="flex flex-wrap items-center gap-2 max-sm:gap-y-2.5">
        <h1 className="m-0 mr-2 text-xl font-bold text-slate-100 max-sm:mr-auto">{t('Tutor')}</h1>
        {data?.chiNhanh && <span className="text-sm text-slate-400 max-sm:hidden">{data.chiNhanh}</span>}
        {dienThoai && <button type="button" className={`btn min-h-[44px] min-w-[44px] shrink-0 justify-center px-0 ${moTim || tim ? '!border-[color:var(--accent)]' : ''}`}
          aria-label={t('Tìm tên hoặc SĐT')} aria-expanded={moTim || !!tim} onClick={() => setMoTim(!moTim)}>
          <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        </button>}
        {dienThoai && (danhBa ? <>{nutThem}<MenuDong muc={[
          { key: 'tai', nhan: t('Tải danh sách'), onChon: () => setHop('tai') }, { key: 'xuat', nhan: t('Xuất số buổi'), onChon: () => setHop('xuat') },
        ]} /></> : nutXuat)}
        <span className="max-sm:basis-full max-sm:order-1 sm:contents">
          <span className="flex items-center gap-2 max-sm:w-full">
            <span className="min-w-0 max-sm:flex-1"><BoChonThoiGian khoang={khoang} onChange={setKhoang} macDinh={md} /></span>
            {dienThoai && <NutLoc refNut={nutLoc} so={soLocThem} mo={moLoc} onClick={() => setMoLoc(!moLoc)} />}
          </span>
        </span>
        {(!dienThoai || moTim || !!tim) && <input type="search" name="tim-nguoi-day" autoComplete="off" className="field w-60 text-sm max-sm:order-2 max-sm:w-full max-sm:min-h-[44px]" placeholder={t('Tìm tên hoặc SĐT')} aria-label={t('Tìm tên hoặc SĐT')}
          value={tim} autoFocus={dienThoai && moTim} onChange={(e) => setTim(e.target.value)} />}
        {!dienThoai && <NutLoc refNut={nutLoc} so={soLocThem} mo={moLoc} onClick={() => setMoLoc(!moLoc)} />}
        {!dienThoai && <><span className="flex-1" />{nutXuat}{danhBa && <>{nutTai}{nutThem}</>}</>}
      </div>
      {moLoc && (
        <HopNeo neo={nutLoc} nhan={t('Lọc người dạy')} rong={340} onNgoai={() => setMoLoc(false)}>
          <label className="grid gap-1.5 text-[13px] font-semibold text-slate-400">{t('Nơi dạy')}
            <select className="field w-full text-sm font-normal" value={noi} onChange={(e) => dat({ noi: e.target.value || null })}>
              <option value="">{t('Tất cả')}</option>
              {(data?.dsChiNhanh ?? []).map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
              <option value="online">{t('Chỉ online')}</option>
              <option value="chua">{t('Chưa có')}</option>
            </select>
          </label>
          <div className="grid gap-1.5" role="group" aria-label={t('Kỹ năng')}>
            <span className="text-[13px] font-semibold text-slate-400">{t('Kỹ năng')}</span>
            <span className="flex flex-wrap gap-1.5">
              {KN_TUTOR.map((k) => (
                <NutChon key={k} nho chon={kn.includes(k)} className="min-w-[44px] justify-center !rounded-full" dau={null}
                  onClick={() => { const n = kn.includes(k) ? kn.filter((x) => x !== k) : [...kn, k]; dat({ kn: n.length ? n.join(',') : null }); }}>{k}</NutChon>
              ))}
            </span>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold text-slate-400">{t('Loại')}</span>
            <BoLocDoan<'' | 'gv' | 'tutor'> v8 ariaLabel={t('Loại')} value={loai as '' | 'gv' | 'tutor'} onChange={(l) => dat({ loai: l || null })}
              muc={[{ key: '', nhan: t('Tất cả') }, { key: 'gv', nhan: t('GV') }, { key: 'tutor', nhan: t('Tutor') }]} />
          </div>
          <div className="border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!soLocThem} onClick={() => dat({ noi: null, kn: null, loai: null })}>{t('Bỏ lọc')}</button>
          </div>
        </HopNeo>
      )}

      <div className="flex items-center gap-2 max-sm:[&_button]:!flex-auto" data-hd="tutor-loc">
        <BoLocDoan<Loc> v8 giuSo ariaLabel={t('Lọc người dạy')} value={loc} onChange={(l) => dat({ loc: l })}
          muc={CAC_LOC.map((l) => ({ key: l, nhan: NHAN_LOC[l], so: data ? soLoc(l) : null }))} />
        <span className="max-sm:hidden"><NutLuat label={t('Giải thích — Cần chú ý, tỉ lệ')}>
          <p className="m-0"><b className="text-slate-100">{t('Cần chú ý')}</b>: {t('có lần ghi "Không" ở Chuẩn bị, Tài liệu hoặc Feedback GV, hoặc đánh giá ≤ 2 sao, sau nhận xét gần nhất của Head tutor / Quản trị.')}</p>
          <p className="m-0"><b className="text-slate-100">{t('Đang dạy')}</b>: {t('có buổi trong khoảng, chưa Ngừng hợp tác.')} <b className="text-slate-100">{t('Ngừng')}</b>: {t('kết luận gần nhất là Ngừng hợp tác.')}</p>
          <p className="m-0"><b className="text-slate-100">{t('Có / có trả lời')}</b>: {t('số lần ghi "Có" trên số lần ghi có trả lời ô đó; lần ghi để trống không tính. "—" = chưa ai trả lời.')}</p>
          <p className="m-0"><b className="text-slate-100">{t('Buổi')}</b>: {t('tổng số buổi đã ghi trong khoảng.')}</p>
        </NutLuat></span>
      </div>

      {/* R2.5: dải tên gõ tay — người sửa danh bạ (Head: phần chi nhánh mình, máy chủ đếm). */}
      {danhBa && !!data?.goTay?.soTen && (
        <div className="flex min-h-[44px] items-center gap-2.5 rounded-[10px] border py-1 pl-3.5 pr-2 text-sm text-slate-400" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }} data-hd="tutor-gop">
          <span className="min-w-0"><b className="font-semibold tabular-nums text-slate-100">{data.goTay.soTen}</b> {dienThoai ? t('tên gõ tay') : t('tên gõ tay chưa có trong danh sách')} · <b className="font-semibold tabular-nums text-slate-100">{data.goTay.soBuoi}</b> {t('buổi')}</span>
          <button type="button" className="btn btn-sm ml-auto shrink-0" onClick={() => setHop('gop')}>{t('Gộp…')}</button>
        </div>
      )}

      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data ? <div className="card p-4"><Skeleton rows={8} /></div> : (
          <div className="card overflow-clip">
            {/* Thanh đầu bảng: số người dạy · khoảng — danh bạ trống (bản chính) thì câu một dòng + Tải danh sách / Thêm tutor (R2.10, mockup E1). */}
            <div className="flex min-h-[44px] flex-wrap items-center gap-2 border-b py-1 pl-4 pr-3 text-sm text-slate-400" style={{ borderColor: 'var(--line)' }}>
              {!coTutor && danhBa
                ? <><span>{t('Chưa có tutor trong danh sách')}</span><span className="flex-1" />
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setHop('tai')}>{t('Tải danh sách')}</button>
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setHop('them')}>{t('Thêm tutor')}</button></>
                : <span><b className="font-semibold tabular-nums text-slate-100">{rows.length}</b> {t('người dạy')} · {khoangChu}</span>}
            </div>
            {rows.length > 0 && <div className="px-3"><PhanTrang {...pt.thanh} /></div>}
            {!ds.length ? <Empty title={t('Chưa có người dạy nào trong khoảng này')} hint={danhBa ? undefined : t('Người dạy hiện khi có kết quả PA Tutor được ghi.')} />
              : !rows.length ? <Empty title={t('Không có người dạy khớp bộ lọc')} action={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setTim(''); dat({ loc: 'tat-ca', noi: null, kn: null, loai: null }); }}>{t('Bỏ lọc')}</button>} />
              : <Bang<DongTutor> ten={t('Người dạy')} khung={false} deu cot={cot} hang={pt.cat(rows)} khoa={(d) => d.id} oCua={oCua}
                hangRieng={hangRieng} theRieng={the} onHang={moHang} dangMo={(d) => mo?.id === d.id} lopHang={(d) => (ngung(d) ? 'hang-mo' : '')} />}
            {rows.length > 0 && <div className="px-3"><PhanTrang {...pt.thanh} duoi /></div>}
          </div>
        )}

      {mo && <PanelTutor key={`${mo.id}-${mo.chuY ? 'cy' : ''}`} id={mo.id} tieuChi={mo.tieuChi} xemChuY={mo.chuY} khoang={khoang} dsChiNhanh={data?.dsChiNhanh ?? []} chiNhanhDanhBa={data?.chiNhanhDanhBa ?? null} ds={ds}
        tiep={keTiep(mo.id)} onTiep={(id) => setMo({ id })} onDong={() => setMo(null)} />}
      {(hop === 'them' || tenThem) && <HopTutor dsChiNhanh={data?.dsChiNhanh ?? []} chiNhanhDanhBa={data?.chiNhanhDanhBa ?? null} ds={ds} tenSan={tenThem?.ten}
        onDong={() => { setHop(hop === 'them' ? null : hop); setTenThem(null); }} onXong={(id) => { tenThem?.xong?.(id); setHop(hop === 'them' ? null : hop); setTenThem(null); }} />}
      {hop === 'tai' && <TaiDanhSach dsChiNhanh={data?.dsChiNhanh ?? []} onDong={() => setHop(null)} />}
      {hop === 'gop' && <HopGop onDong={() => setHop(null)} onThem={(ten, xong) => setTenThem({ ten, xong })} />}
      {hop === 'xuat' && <HopXuat phamVi={data?.chiNhanh ?? null} onDong={() => setHop(null)} />}
    </div>
  );
}

/** Nút "Lọc ▾" (R2.3): số bộ lọc đang bật trên nút; mở hộp neo dưới nút. */
function NutLoc({ refNut, so, mo, onClick }: { refNut: React.RefObject<HTMLButtonElement>; so: number; mo: boolean; onClick: () => void }) {
  return (
    <button ref={refNut} type="button" aria-expanded={mo} aria-haspopup="dialog" onClick={onClick}
      className={`btn min-h-[44px] shrink-0 gap-2 sm:min-h-0 ${mo || so ? '!border-[color:var(--accent)]' : ''}`}>
      {t('Lọc')}{so > 0 && <span className="min-w-5 rounded-md bg-[color:var(--accent-soft)] px-1.5 text-xs font-bold tabular-nums text-[color:var(--accent)]">{so}</span>}
      <span aria-hidden className="text-xs text-slate-400">▾</span>
    </button>
  );
}

/** Ô tỉ lệ "4 / 6" (Có / có trả lời): có lần "Không" → cam đậm + bấm mở panel lọc sẵn; chưa ai trả lời → "—". */
function OTyLe({ v, nhan, onClick }: { v: TyLe; nhan: string; onClick?: () => void }) {
  if (!v[1]) return <span className="text-faint">—</span>;
  const chu = <span className="whitespace-nowrap tabular-nums">{v[0]} / {v[1]}</span>;
  return onClick
    ? <button type="button" className="-mx-1 rounded border-0 bg-transparent px-1 font-bold text-late hover:underline hover:underline-offset-[3px] max-sm:min-h-[44px] max-sm:min-w-[44px]" onClick={onClick}
      aria-label={`${nhan} ${v[0]} / ${v[1]} · ${t('xem lần ghi có Không')}`}>{chu}</button>
    : <span>{chu}</span>;
}
