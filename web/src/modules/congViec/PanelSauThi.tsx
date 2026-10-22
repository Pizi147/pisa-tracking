import { useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChuLuu, dauViec, type TtLuu } from '../../ui/KhuonViec.tsx';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Nhan, NhanKq, NhanLich } from '../../ui/Nhan.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { laBand } from '../students/StudentPlanPanel.tsx';
import type { TrangThaiBuocTiep } from '../students/PanelBuocTiep.tsx';
import { LUA_CHON_SAU_THI, NHAN_SAU_THI, ketQuaThiThat, ngay, shortDate, tuanChonDuoc, tuanLich, type LuaChonSauThi } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { LuaChonRadio, gioVnNay } from './PanelBaoPhTvv.tsx';

const KN = ['l', 'r', 'w', 's'] as const;
type Diem = Record<(typeof KN)[number], string>;
const so = (v: number | null | undefined) => (v === null || v === undefined ? '' : v.toFixed(1));
const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/lo-trinh', '/my-work', '/cycles', '/tong-quan'];
type LopDich = { id: number; code: string; ft: boolean; route: string | null; tenChuongTrinh: string | null; siSo?: number };
type Chon = (typeof LUA_CHON_SAU_THI)[number];

/**
 * SAU THI (UI-CV-TVV, mockup `thiet-ke/v5/tvv.html` panelSau; C16, T09, N6) — MỘT panel hai bước cho việc "Cập nhật KQ thi thật" và "Chọn bước tiếp":
 *  ① Kết quả thi thật L R W S (Overall máy tính) LƯU RIÊNG — chưa cần chọn bước tiếp; "Không thi" vẫn có (đường sẵn có).
 *  ② Bước tiếp (Lộ trình mới · Tạm dừng · Thôi học) mở sau khi có điểm; hạn = ngày có KQ + 7 (máy chủ). Lộ trình mới: Lớp này / Lớp khác · Bắt đầu.
 * Cùng API với `KetQuaThiThatPanel` / `PanelBuocTiep` (máy chủ kiểm quyền, luật); Lịch sử thay nội dung panel (← Sau thi).
 */
export function PanelSauThi({ cycleId, em, lop, onDong, onDaLam, onTiep, tenTiep }: {
  cycleId: number; em: { id: number; ten: string }; lop: string | null;
  onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const cy = useApi<any>(`/cycles/${cycleId}`, [cycleId]);
  const bt = useApi<TrangThaiBuocTiep>(`/cycles/${cycleId}/buoc-tiep`, [cycleId]);
  const c = cy.data;
  const [diem, setDiem] = useState<Diem | null>(null);
  const [suaDiem, setSuaDiem] = useState(false);
  const [ttDiem, setTtDiem] = useState<TtLuu | null>(null);
  const [loiDiem, setLoiDiem] = useState<string | null>(null);
  const [chon, setChon] = useState<Chon | null>(null);
  const [lopKhac, setLopKhac] = useState(false);
  const [lopMoiId, setLopMoiId] = useState<number | ''>('');
  const [batDau, setBatDau] = useState('ngay');
  const [ghiChu, setGhiChu] = useState('');
  const lfD = useLoiForm();
  const lf = useLoiForm();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChot, setDaChot] = useState<string | null>(null);
  const [lichSu, setLichSu] = useState(false);
  const moLop = chon === 'lo_trinh_moi' && lopKhac;
  const dsLop = useApi<{ lop: LopDich[] }>(moLop ? `/students/${em.id}/hoc-lai/lop-dich` : null, [moLop, em.id]);

  const tieuDe = t('Sau thi · {ten}', { ten: em.ten });
  const coKq = !!c && (!!c.thi_that_khong_thi || KN.every((k) => c[`thi_that_${k}`] !== null && c[`thi_that_${k}`] !== undefined));
  /* Nạp điểm đang lưu MỘT lần — tải lại nền không xoá chữ đang gõ. */
  if (c && !diem) setDiem({ l: so(c.thi_that_l), r: so(c.thi_that_r), w: so(c.thi_that_w), s: so(c.thi_that_s) });
  const ngayThi = c?.thi_that_ngay ?? (c?.exam_date && /^\d{4}-\d{2}-\d{2}$/.test(c.exam_date) ? c.exam_date : null);
  const target: number | null = c?.target_score ?? null;
  const dau = dauViec({
    em, lop,
    ngCanh: c ? (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {[ngayThi && t('thi IELTS {ngay}', { ngay: ngay(ngayThi, hn) }), target !== null && `Target ${target.toFixed(1)}`].filter(Boolean).join(' · ')}
        {coKq ? <Nhan tone="doing">{t('Đã có kết quả · Chưa chốt bước tiếp')}</Nhan> : <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>}
      </span>
    ) : null,
  });
  if (lichSu) return <LichSuThayDoi loai="thi-that" id={cycleId} dong2={[em.ten, lop]} quayLai={{ nhan: t('Sau thi'), onClick: () => setLichSu(false) }} onClose={onDong} />;
  const loiTai = cy.error ?? bt.error;
  if (loiTai) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={loiTai.message} hint={loiTai.hint} onRetry={() => { cy.reload(); bt.reload(); }} /></KhungPanel>;
  /* `buoc-tiep` trả null khi chưa có kết quả thi thật — bước 2 khoá. */
  if (!c || !diem || (bt.loading && !bt.data)) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;
  const b = bt.data ?? { chon: null, han: null, coTheChon: false, hen: null, hoanTacDuoc: false, lopNay: null } as unknown as TrangThaiBuocTiep;

  /* ① Kết quả thi thật */
  const moDiem = !coKq || suaDiem;
  const sai = KN.filter((k) => diem[k].trim() !== '' && !laBand(diem[k]));
  const kq = sai.length ? null : ketQuaThiThat({ l: diem.l ? Number(diem.l) : null, r: diem.r ? Number(diem.r) : null, w: diem.w ? Number(diem.w) : null, s: diem.s ? Number(diem.s) : null, khongThi: false }, target);
  const guiDiem = async (than: object) => {
    setTtDiem('dang'); setLoiDiem(null);
    try {
      await api.put(`/cycles/${cycleId}/outcome`, than);
      LAM_MOI.forEach((k) => invalidate(k));
      setTtDiem(null); setSuaDiem(false); cy.reload(); bt.reload(); onDaLam();
    } catch (e: any) { setTtDiem('loi'); setLoiDiem(e?.message ?? null); }
  };
  const loiD = KN.filter((k) => !laBand(diem[k])).map((k) => ({ khoa: `diem-${k}`, nhan: k.toUpperCase(), lyDo: t('0–9, bước 0.5') }));
  const luuDiem = () => {
    lfD.bam();
    if (loiD.length) return;
    void guiDiem({ khongThi: false, ngayThi, l: Number(diem.l), r: Number(diem.r), w: Number(diem.w), s: Number(diem.s), ghiChu: c.outcome_note ?? '' });
  };

  /* ② Bước tiếp */
  const daChonTruoc = !!b.chon;
  const khoaBuoc2 = !coKq || moDiem || !b.coTheChon || daChonTruoc || !!daChot;
  const thieuLop = chon === 'lo_trinh_moi' && lopKhac && !lopMoiId;
  const loiB = [
    ...(!chon ? [{ khoa: 'chon', nhan: t('Bước tiếp'), lyDo: t('Chọn một bước') }] : []),
    ...(thieuLop ? [{ khoa: 'lop', nhan: t('Lớp khác'), lyDo: t('Chọn lớp') }] : []),
  ];
  const chot = async () => {
    lf.bam();
    if (loiB.length) return;
    setTt('dang'); setLoi(null);
    try {
      const chung = { chon, ghiChu: ghiChu.trim() || null };
      await api.post(`/cycles/${cycleId}/buoc-tiep`, chon === 'lo_trinh_moi' ? { ...chung, batDau, ...(lopKhac ? { lopMoiId } : {}) } : chung);
      LAM_MOI.forEach((k) => invalidate(k));
      setTt(null); setDaChot(gioVnNay()); bt.reload(); onDaLam();
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const hoanTac = async () => {
    setTt('dang'); setLoi(null);
    try { await api.del(`/cycles/${cycleId}/buoc-tiep`); LAM_MOI.forEach((k) => invalidate(k)); setTt(null); setDaChot(null); bt.reload(); onDaLam(); }
    catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  const chan = daChot ? {
    huy: null, trai: <span role="status" className="font-semibold text-done">✓ {t('Đã lưu {gio} · Việc xong', { gio: daChot })}</span>,
    phu: (b.hen || b.hoanTacDuoc) ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button> : null,
    chinh: nutTiep || <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  } : !coKq || moDiem ? {
    huy: null, trai: <span className="text-slate-400">{t('Bước tiếp mở sau khi lưu điểm')}</span>,
  } : daChonTruoc || !b.coTheChon ? {
    huy: null, trai: <span className="text-slate-300">{b.chon ? t('Đã chọn: {chon}', { chon: NHAN_SAU_THI[b.chon] }) : t('Chờ QL / TVV chọn bước tiếp')}</span>,
    chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  } : {
    huy: null, daSua: !!chon || !!ghiChu.trim(), conThieu: lf.conThieu(loiB),
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : tt === 'dang' ? <ChuLuu tt="dang" />
      : <span className="inline-flex items-center gap-1.5 font-semibold text-soon"><span aria-hidden>●</span>{t('Bước tiếp chưa chốt')}</span>,
    chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void chot()}>{t('Chốt bước tiếp')}</button>,
  };

  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-4 pt-4">
        <Buoc so={coKq && !moDiem ? '✓' : '1'} xong={coKq && !moDiem} tieuDe={t('Kết quả thi thật')}
          phu={coKq && c.thi_that_nhap_luc ? t('lưu {ngay}', { ngay: shortDate(c.thi_that_nhap_luc, hn) }) : t('không hạn')}>
          {c.thi_that_khong_thi && !moDiem ? <p className="m-0 text-sm text-slate-200">{t('Không thi')}</p> : (
            <div className="grid grid-cols-5 gap-2 max-sm:grid-cols-4">
              {KN.map((k) => (
                <Truong key={k} nhan={k.toUpperCase()} loi={moDiem ? lfD.loiCua(loiD, `diem-${k}`) : null}>
                  <input className="field w-full text-center tabular-nums" inputMode="decimal" autoComplete="off" aria-label={t('Điểm {kn}', { kn: k.toUpperCase() })} readOnly={!moDiem}
                    {...(moDiem ? lfD.o(loiD, `diem-${k}`) : {})} value={diem[k]} onChange={(e) => { setDiem({ ...diem, [k]: e.target.value }); if (ttDiem === 'loi') setTtDiem(null); }} />
                </Truong>
              ))}
              <div className="max-sm:col-span-4">
                <span className="mb-1.5 block text-xs font-semibold text-slate-400">Overall</span>
                <span className="flex h-10 items-center justify-center rounded-lg text-sm font-bold tabular-nums" style={{ background: 'var(--surface-2)' }} aria-label={t('Overall tự tính')}>
                  {kq?.ovr != null ? <span className={kq.ketLuan === 'reached' ? 'text-dat' : kq.ketLuan === 'not_reached' ? 'text-bad' : 'text-slate-100'}>{kq.ketLuan === 'reached' ? '✓ ' : ''}{kq.ovr.toFixed(1)}</span> : '–'}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!moDiem && kq && (kq.ketLuan === 'reached' ? <NhanKq kq="dat">{t('Đạt Target {tg}', { tg: target!.toFixed(1) })}</NhanKq>
              : kq.ketLuan === 'not_reached' ? <NhanKq kq="chua-dat">{t('Chưa đạt Target {tg}', { tg: target!.toFixed(1) })}</NhanKq> : null)}
            {ttDiem === 'loi' && <span className="text-[13px]"><ChuLuu tt="loi" loi={loiDiem} /></span>}
            {ttDiem === 'dang' && <span className="text-[13px]"><ChuLuu tt="dang" /></span>}
            <span className="flex-1" />
            {moDiem ? (
              <>
                {!coKq && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" disabled={ttDiem === 'dang'} onClick={() => void guiDiem({ khongThi: true, ghiChu: c.outcome_note ?? '' })}>{t('Không thi')}</button>}
                {suaDiem && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setSuaDiem(false); setDiem({ l: so(c.thi_that_l), r: so(c.thi_that_r), w: so(c.thi_that_w), s: so(c.thi_that_s) }); }}>{t('Huỷ sửa')}</button>}
                <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={ttDiem === 'dang'} onClick={luuDiem}>{t('Lưu điểm')}</button>
              </>
            ) : !daChonTruoc && !daChot && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSuaDiem(true)}>{t('Sửa điểm')}</button>}
          </div>
        </Buoc>

        <Buoc so="2" tieuDe={t('Bước tiếp')} mo={!khoaBuoc2 || daChonTruoc || !!daChot} phu={coKq && b.han ? t('hạn {ngay}', { ngay: shortDate(b.han, hn) }) : null}>
          {/* Tiêu đề bước đã là "Bước tiếp" — nhóm nút không nhãn riêng; lỗi (sau khi bấm Chốt) ngay dưới. */}
          <div {...lf.o(loiB, 'chon')} tabIndex={-1} className="outline-none">
            <LuaChonRadio ten={`bt-${cycleId}`} nhan={t('Bước tiếp')} value={daChot || daChonTruoc ? (b.chon as Chon | null) : chon} disabled={khoaBuoc2}
              muc={LUA_CHON_SAU_THI.map((k) => [k, NHAN_SAU_THI[k]] as const)} onChange={(k) => { setChon(k); if (tt === 'loi') setTt(null); }} />
            {lf.loiCua(loiB, 'chon') && <p role="alert" className="m-0 mt-1.5 text-[13px] text-bad">{lf.loiCua(loiB, 'chon')}</p>}
          </div>
          {chon === 'lo_trinh_moi' && !khoaBuoc2 && (
            <div className="flex flex-col gap-3">
              <Truong nhan={t('Lớp')} as="div" loi={lf.loiCua(loiB, 'lop')}>
                <LuaChonRadio ten={`bt-lop-${cycleId}`} nhan={t('Lớp')} value={lopKhac ? 'khac' : 'nay'} onChange={(k) => setLopKhac(k === 'khac')}
                  muc={[['nay', `${t('Lớp này')}${b.lopNay ? ` · ${b.lopNay.code}` : ''}`], ['khac', t('Lớp khác')]]} />
                {lopKhac && (
                  <select className="field mt-2 w-full" aria-label={t('Lớp khác')} {...lf.o(loiB, 'lop')} value={lopMoiId} onChange={(e) => setLopMoiId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">{dsLop.data ? t('Chọn lớp') : t('Đang tải…')}</option>
                    {dsLop.data?.lop.map((l) => <option key={l.id} value={l.id}>{[l.code, l.ft ? `FT ${l.route ?? ''}`.trim() : l.tenChuongTrinh, l.siSo != null ? t('{n} em', { n: l.siSo }) : null].filter(Boolean).join(' · ')}</option>)}
                  </select>
                )}
              </Truong>
              <Truong nhan={t('Bắt đầu')}>
                <select className="field w-full sm:max-w-[16rem]" value={batDau} onChange={(e) => setBatDau(e.target.value)}>
                  <option value="ngay">{t('Ngay bây giờ')} · {tuanLich(hn, hn)}</option>
                  {tuanChonDuoc(hn, 4).map((m) => <option key={m} value={m}>{tuanLich(m, hn)}</option>)}
                </select>
              </Truong>
            </div>
          )}
          <Truong nhan={t('Ghi chú')}>
            <textarea className="field w-full" rows={3} maxLength={2000} autoComplete="off" disabled={khoaBuoc2} value={ghiChu} placeholder={t('Trao đổi với HV / PH')}
              onChange={(e) => setGhiChu(e.target.value)} />
          </Truong>
        </Buoc>

        <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="flex min-h-[44px] appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-slate-400 sm:min-h-0" onClick={() => setLichSu(true)}>
            <span aria-hidden>▸</span>{t('Lịch sử')}
          </button>
        </div>
      </div>
    </KhungPanel>
  );
}

/** Một bước của panel (mockup `.buoc`): khung viền, số / ✓ trong vòng tròn, tiêu đề + chữ phụ; bước chưa mở thì mờ. */
function Buoc({ so, tieuDe, phu, xong, mo = true, children }: { so: string; tieuDe: string; phu?: string | null; xong?: boolean; mo?: boolean; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-3 rounded-[10px] border p-4 ${mo ? '' : 'opacity-[.55]'}`} style={{ borderColor: 'var(--line)' }} aria-label={tieuDe}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span aria-hidden className={`inline-flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-bold ${xong ? 'bg-ok-bg text-ok' : 'text-[color:var(--accent)]'}`}
          style={xong ? undefined : { background: 'var(--accent-soft)' }}>{so}</span>
        <h3 className="m-0 text-[15px] font-bold text-slate-100">{tieuDe}</h3>
        {phu && <span className="text-xs text-slate-400">{phu}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * CHỐT NGÀY THI (UI-CV-TVV, mockup `tvv.html` panelChot; N6 — không hạn): em đã tới tháng dự kiến mà chưa có ngày thi. Chốt = Ngày thi (ngày đã qua chọn
 * được — em đã thi) hoặc Dời tháng dự kiến. Cùng đường lưu với Học viên & Lớp › Lịch thi (`PUT /hoc-vien-lop/lich-thi/:cycleId`, máy chủ kiểm quyền + ghi nhật ký).
 */
export function PanelChotNgayThi({ cycleId, em, lop, duKien, onDong, onDaLam, onTiep, tenTiep }: {
  cycleId: number; em: { id: number; ten: string }; lop: string | null; duKien: string | null;
  onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
}) {
  const [kieu, setKieu] = useState<'ngay' | 'thang'>('ngay');
  const [ngayThi, setNgayThi] = useState('');
  const [thang, setThang] = useState('');
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState<string | null>(null);
  const lfC = useLoiForm();
  const gia = kieu === 'ngay' ? ngayThi : thang;
  const loiC = gia ? [] : [{ khoa: kieu, nhan: kieu === 'ngay' ? t('Ngày thi') : t('Tháng thi'), lyDo: kieu === 'ngay' ? t('Chọn ngày thi') : t('Chọn tháng thi') }];
  const luu = async () => {
    lfC.bam();
    if (loiC.length) return;
    setTt('dang'); setLoi(null);
    try {
      await api.put(`/hoc-vien-lop/lich-thi/${cycleId}`, kieu === 'ngay' ? { ketLuan: 'chot-ngay', ngay: ngayThi } : { ketLuan: 'chuyen-thang', thang });
      LAM_MOI.forEach((k) => invalidate(k));
      setTt(null); setXong(gioVnNay()); onDaLam();
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  return (
    <KhungPanel tieuDe={t('Chốt ngày thi · {ten}', { ten: em.ten })} onDong={onDong}
      dau={dauViec({ em, lop, ngCanh: duKien ? <span className="inline-flex items-center gap-1.5">{t('hiện')} <NhanLich loai="du-kien">{duKien}</NhanLich></span> : null })}
      chan={xong ? { huy: null, trai: <span role="status" className="font-semibold text-done">✓ {t('Đã lưu {gio} · Việc xong', { gio: xong })}</span>,
        chinh: nutTiep || <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button> }
        : { huy: null, daSua: !!gia, conThieu: lfC.conThieu(loiC), trai: <ChuLuu tt={tt ?? 'nhap'} loi={loi} />,
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{tt === 'loi' ? t('Thử lại') : t('Chốt ngày')}</button> }}>
      <div className="flex flex-col gap-4 pt-4">
        <Truong nhan={t('Chốt')} as="div">
          <LuaChonRadio ten={`chot-${cycleId}`} nhan={t('Chốt')} value={kieu} disabled={!!xong} onChange={setKieu}
            muc={[['ngay', t('Ngày thi')], ['thang', t('Dời tháng dự kiến')]]} />
        </Truong>
        {kieu === 'ngay'
          ? <Truong nhan={t('Ngày thi')} loi={lfC.loiCua(loiC, 'ngay')}><div className="max-w-[220px]"><ONgay kieu="ngay" id={lfC.oId('ngay')} invalid={!!lfC.loiCua(loiC, 'ngay')} value={ngayThi} onChange={setNgayThi} disabled={!!xong} /></div></Truong>
          : <Truong nhan={t('Tháng thi')} loi={lfC.loiCua(loiC, 'thang')}><div className="max-w-[220px]"><ONgay kieu="thang" id={lfC.oId('thang')} invalid={!!lfC.loiCua(loiC, 'thang')} value={thang} onChange={setThang} disabled={!!xong} /></div></Truong>}
      </div>
    </KhungPanel>
  );
}
