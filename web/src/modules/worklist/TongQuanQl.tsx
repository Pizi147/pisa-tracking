import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { CHIP_SOS, lopSos } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BangLoTrinhTiep } from '../classes/BangLoTrinhTiep.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import type { HoSoLop } from '../classes/DauTrangLop.tsx';
import type { QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import type { Data as LichData } from './Highlights.tsx';
import type { WorkItem } from './WorkList.tsx';
import { NHOM_CASE_CHUA_CHOT, NHOM_CASE_CHUA_CHOT_LABEL, thamSoCt, vaiXemHocVien, type ChuongTrinh, type CotBang, type DemYeuCau } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN QL (OV-15h1): `/tong-quan/ql` trả phần theo khung (Lớp cần chú ý, Tuần này, Trễ chấm), `/tong-quan/quan-ly` phần gộp khung (dải tóm tắt,
 * Cần bạn quyết) — khối vẽ từ hai GET này của trang, không tự gọi API. Số bấm mở panel của CHÍNH hàm đếm (`/tong-quan/chi-nhanh/o`, `/tong-quan/ql/tre`).
 */
type OBang = { n: number; mau?: number };
type HangBang = { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; o: Record<CotBang, OBang>; lop?: HangBang[]; gvcn?: string | null };
export type DongCase = { id: number; title: string; sub: string; em?: { id: number; ten: string } | null; lop?: string | null; nguoi?: string | null; han?: string | null; nhom?: string | null };
export type GvTre = { khoa: number; ten: string; bai: number; kyNang: string[]; lop: { code: string; n: number }[]; treNhat: number };
/** `/tong-quan/quan-ly` — dải tóm tắt + Cần bạn quyết (gộp hai khung). */
export type QuanLyData = {
  canXuLy: { metricId: string; n: number; nguoi: 'ban' | { ids: number[] } }[];
  canQuyet: { caseQuaHan: DongCase[]; sauThi: WorkItem[] };
  choDuyet?: DemYeuCau;
};
export type TongQuanQlData = {
  bang: { cheDo: 'chi-nhanh' | 'lop'; hang: HangBang[]; conLai: HangBang | null; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; phanRa?: Record<string, number> | null };
  lich: LichData | null;
  tre: GvTre[];
};

/** Tham số chung của mọi đường trên trang (chi nhánh + khung). */
export const thamSoTq = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');

/** Hàng lớp "có vấn đề" (mockup 3 "Chỉ lớp có vấn đề"): có em chưa lịch / chưa điểm / SOS / Case chưa chốt PA / đã thi chờ KQ. */
const coVanDe = (o: Record<CotBang, OBang>) => o.chuaLich.n + o.chuaDiem.n + o.sos.n + o.caseChuaChot.n + o.daThiChoKq.n > 0;

export function LopCanChuY({ data, branchId, ct }: { data: TongQuanQlData['bang']; branchId: number | null; ct: ChuongTrinh }) {
  const dt = useDienThoai();
  const [chiVanDe, setChiVanDe] = useThamSoUrl('lop-vd', '1');
  const loc = chiVanDe === '1';
  const ft = ct === 'ft';
  const q = thamSoTq(branchId, ct);
  const so = (h: { khoa: string; nhan: string }, cot: CotBang, x: OBang, className = '') => (
    <SoLieuO giaTri={x.n} className={className} tieuDe={`${COT_TEN[cot]} · ${h.nhan}`} nguon={`/tong-quan/chi-nhanh/o?cot=${cot}&khoa=${h.khoa}&chuY=1${q ? `&${q}` : ''}`} />
  );
  const sos = (h: HangBang | { khoa: string; nhan: string; o: Record<CotBang, OBang> }) => (
    <span className="inline-flex items-center justify-center gap-1">
      {(['sos1', 'sos2', 'sos3'] as const).map((c, i) => (h.o[c].n > 0
        ? <span key={c} className={`${CHIP_SOS} ${lopSos(i + 1)}`}>{so(h, c, h.o[c], 'no-underline')}</span>
        : <span key={c} className="inline-flex min-w-[30px] justify-center tabular-nums text-slate-500">0</span>))}
    </span>
  );
  const caseHv = (h: { khoa: string; nhan: string; o: Record<CotBang, OBang> }) => (h.o.caseChuaChot.n > 0 ? (
    <span className="inline-flex flex-col items-center leading-tight tabular-nums">
      <span>{so(h, 'caseChuaChotHv', h.o.caseChuaChotHv)} <span className="text-xs text-slate-500">{t('HV')}</span></span>
      <span>{so(h, 'caseChuaChot', h.o.caseChuaChot)} <span className="text-xs text-slate-500">Case</span></span>
    </span>
  ) : <span className="tabular-nums text-slate-500">0</span>);
  const tongNhan = data.cheDo === 'lop' ? (data.tenChiNhanh ? t('Cả {ten}', { ten: data.tenChiNhanh }) : t('Cả chi nhánh')) : t('Tất cả chi nhánh');
  const tong = { khoa: 'tong', nhan: tongNhan, o: data.tong };
  const hienLop = (h: HangBang) => !loc || coVanDe(h.o);
  const dsLop = data.hang.flatMap((h) => (h.loai === 'lop' ? [h] : h.lop ?? []));
  const soAn = loc ? dsLop.filter((l) => !coVanDe(l.o)).length : 0;
  /* Hàng hiện: chế độ chi nhánh (Quản trị chưa chọn chi nhánh) — hàng chi nhánh đậm rồi các lớp của nó; còn lại chỉ lớp. */
  const hang: (HangBang & { cap: 0 | 1 })[] = data.hang.flatMap((h) => (h.loai === 'lop'
    ? (hienLop(h) ? [{ ...h, cap: 1 as const }] : [])
    : [{ ...h, cap: 0 as const }, ...(h.lop ?? []).filter(hienLop).map((l) => ({ ...l, cap: 1 as const }))]));
  if (data.conLai) hang.push({ ...data.conLai, cap: 1 });

  const phanRa = data.phanRa ?? {};
  const giaiThich = (
    <NutLuat phai label={t('Case chưa chốt PA')}>
      <span className="block text-[13px] font-bold text-slate-100">{t('Case chưa chốt PA')}</span>
      <span className="block text-[14px] font-semibold text-slate-100">{t('{n} Case của {hv} HV chưa có PA đang chạy.', { n: data.tong.caseChuaChot.n, hv: data.tong.caseChuaChotHv.n })}</span>
      <span className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 tabular-nums">
        {NHOM_CASE_CHUA_CHOT.filter((k) => k !== 'khongTheoDoi' || (phanRa[k] ?? 0) > 0).map((k) => (
          <span key={k} className="contents"><span>{dich(NHOM_CASE_CHUA_CHOT_LABEL[k])}</span><b className="text-right text-slate-100">{phanRa[k] ?? 0}</b></span>
        ))}
        <span className="contents font-semibold"><span>{t('Tổng')}</span><b className="text-right text-slate-100">{data.tong.caseChuaChot.n}</b></span>
      </span>
      <span className="block">{t('Mỗi Case chỉ ở một trạng thái, không đếm trùng.')}</span>
      <span className="block">{t('Bấm số HV hoặc Case để xử lý.')}</span>
    </NutLuat>
  );
  const tenLop = (h: HangBang & { cap: 0 | 1 }) => (h.loai === 'chi-nhanh' ? <b className="font-extrabold text-slate-100">{h.nhan}</b>
    : h.khoa === 'ket-thuc' ? <span className="text-slate-400">{dich(h.nhan)}</span>
      : <Link to={`/hoc-vien/lop/${h.id}`} className={`link max-sm:py-3 ${data.cheDo === 'chi-nhanh' ? 'pl-4' : ''}`}>{h.nhan}</Link>);

  return (
    <Card title={t('Lớp cần chú ý')} bodyClass="p-0"
      action={(
        <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-[28px] ${loc ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}
          aria-pressed={loc} onClick={() => setChiVanDe(loc ? '0' : '1')}>{t('Chỉ lớp có vấn đề')}</button>
      )}>
      <div data-hd="tq-lop-chu-y">
        {dt ? (
          /* 375 (mockup 3): mỗi lớp một thẻ — chỉ số khác 0, cùng nguồn bấm. */
          <ul className="m-0 list-none p-0">
            {[{ ...tong, id: 0, loai: 'lop' as const, cap: 1 as const, gvcn: null }, ...hang].map((h) => {
              const o = h.o;
              const muc = ([
                ['sos', t('SOS hiện tại'), ft && o.sos.n], ['chuaDiem', t('Chưa điểm'), o.chuaDiem.n], ['case', t('Case chưa chốt PA'), o.caseChuaChot.n],
                ['chuaLich', t('Chưa lịch'), ft && o.chuaLich.n], ['daThiChoKq', t('Đã thi · chờ KQ'), ft && o.daThiChoKq.n],
              ] as const).filter((x) => !!x[2]);
              return (
                <li key={h.khoa} className={`border-t px-4 py-2.5 first:border-t-0 ${h.khoa === 'tong' ? 'bg-white/5' : ''}`} style={{ borderColor: 'var(--line)' }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[13px] font-semibold">{h.khoa === 'tong' ? <b className="text-slate-100">{tongNhan}</b> : tenLop(h)}</span>
                    <span className="text-xs text-slate-500">{[t('{n} HV', { n: o.hocVien.n }), h.gvcn].filter(Boolean).join(' · ')}</span>
                  </div>
                  {muc.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-300">
                      {muc.map(([k, nhan]) => (
                        <span key={k} className="inline-flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">{nhan}</span>
                          {k === 'sos' ? sos(h) : k === 'case' ? <span className="tabular-nums">{so(h, 'caseChuaChotHv', o.caseChuaChotHv)} {t('HV')} · {so(h, 'caseChuaChot', o.caseChuaChot)} Case</span>
                            : so(h, k as CotBang, o[k as CotBang])}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="table-scroll bang-dinh">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: ft ? '56rem' : '36rem' }}>
              <colgroup>
                <col style={{ width: '13rem' }} /><col style={{ width: '12rem' }} /><col />
                {ft && <col />}<col />{ft && <col style={{ width: '9.5rem' }} />}<col style={{ width: '9rem' }} />{ft && <col />}
              </colgroup>
              <thead><tr>
                <th className="th sticky-col text-left">{t('Lớp')}</th><th className="th text-left">{t('GVCN')}</th>
                <th className="th text-center">{t('HV')}</th>
                {ft && <th className="th text-center">{t('Chưa lịch')}</th>}
                <th className="th text-center">{t('Chưa điểm')}</th>
                {ft && (
                  <th className="th text-center">
                    <span className="block">{t('SOS hiện tại')}</span>
                    <span className="mt-0.5 inline-flex gap-1 text-[11px] font-normal text-slate-500"><span className="min-w-[30px]">SOS 1</span><span className="min-w-[30px]">SOS 2</span><span className="min-w-[30px]">SOS 3</span></span>
                  </th>
                )}
                <th className="th text-center"><span className="inline-flex items-center gap-1">{t('Case chưa chốt PA')} {giaiThich}</span></th>
                {ft && <th className="th text-center">{t('Đã thi · chờ KQ')}</th>}
              </tr></thead>
              <tbody>
                {[{ ...tong, id: 0, loai: 'lop' as const, cap: 1 as const, gvcn: null }, ...hang].map((h) => (
                    <tr key={h.khoa} className={h.khoa === 'tong' || h.cap === 0 ? 'bg-white/5' : 'row-hover'}>
                      <td className="td sticky-col whitespace-nowrap font-medium"
                        style={h.khoa === 'tong' || h.cap === 0 ? { background: 'color-mix(in srgb, var(--surface) 95%, rgb(var(--phu-rgb)))' } : undefined}>
                        {h.khoa === 'tong' ? <span className="text-slate-100">{tongNhan}</span> : tenLop(h)}
                      </td>
                      <td className="td truncate text-slate-400">{h.gvcn ?? ''}</td>
                      <td className="td text-center tabular-nums">{h.o.hocVien.n}</td>
                      {ft && <td className="td text-center">{so(h, 'chuaLich', h.o.chuaLich)}</td>}
                      <td className="td text-center">{so(h, 'chuaDiem', h.o.chuaDiem)}</td>
                      {ft && <td className="td text-center">{sos(h)}</td>}
                      <td className="td text-center">{caseHv(h)}</td>
                      {ft && <td className="td text-center">{so(h, 'daThiChoKq', h.o.daThiChoKq)}</td>}
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="m-0 border-t px-4 py-2 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>
          {loc && soAn > 0
            ? <>{t('Ẩn {n} lớp không có việc', { n: soAn })} · <button type="button" className="link appearance-none border-0 bg-transparent p-0 max-sm:py-3" onClick={() => setChiVanDe('0')}>{t('Hiện')}</button></>
            : t('Bấm số để xem danh sách')}
        </p>
      </div>
    </Card>
  );
}
const COT_TEN: Record<CotBang, string> = {
  hocVien: 'Học viên', duoiKyVong: 'Dưới kỳ vọng', sos: 'SOS hiện tại', caseMo: 'Case đang mở', thieuPa: 'Case chưa có PA', duDuLieu: 'Tỷ lệ đủ dữ liệu',
  caseChuaChotHv: 'HV có Case chưa chốt PA', caseChuaChot: 'Case chưa chốt PA',
  chuaLich: 'Chưa lịch Test', chuaDiem: 'Chưa điểm', sos1: 'SOS 1', sos2: 'SOS 2', sos3: 'SOS 3', daThiChoKq: 'Đã thi · chờ KQ',
};

/** TRỄ CHẤM THEO GV (mockup 3): tên · kỹ năng · số bài (bấm → panel đúng bài, QL nhập tại chỗ) · lớp · trễ nhất. Không Nhắc — GV đã nhận thông báo tự động. */
export function TreCham({ ds, branchId, ct }: { ds: GvTre[]; branchId: number | null; ct: ChuongTrinh }) {
  if (!ds.length) return null;
  const q = thamSoTq(branchId, ct);
  const tong = ds.reduce((s, x) => s + x.bai, 0);
  const soGv = ds.filter((x) => x.khoa > 0).length;
  return (
    <section className="card p-0" aria-labelledby="tre-cham" data-hd="tq-tre-cham">
      <h3 id="tre-cham" className="m-0 flex flex-wrap items-baseline gap-x-2 border-b px-4 py-2.5 text-sm font-semibold text-slate-200" style={{ borderColor: 'var(--line)' }}>
        {t('Trễ chấm')}
        <span className="text-xs font-normal text-slate-500">{[t('{n} bài', { n: tong }), soGv ? t('{n} GV', { n: soGv }) : null, t('GV đã nhận thông báo tự động')].filter(Boolean).join(' · ')}</span>
      </h3>
      <ul className="m-0 list-none p-0">
        {ds.map((x) => (
          /* 375: hai dòng (tên · số bài / lớp · trễ nhất); từ sm một hàng bốn cột (`sm:contents` đưa con vào lưới). */
          <li key={x.khoa} className="border-t px-4 py-2 text-[13px] first:border-t-0 sm:grid sm:grid-cols-[minmax(0,14rem)_5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-4" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-baseline justify-between gap-3 sm:contents">
              <span className="min-w-0 truncate"><b className={x.khoa > 0 ? 'font-semibold text-slate-100' : 'font-normal text-slate-400'}>{dich(x.ten)}</b>{x.kyNang.length > 0 && <span className="text-slate-500"> · {x.kyNang.join(', ')}</span>}</span>
              <span className="shrink-0 tabular-nums">
                <SoLieuO giaTri={x.bai} className="font-semibold" tieuDe={t('Trễ chấm · {ten}', { ten: dich(x.ten) })} nguon={`/tong-quan/ql/tre?gv=${x.khoa}${q ? `&${q}` : ''}`} /> <span className="text-xs text-slate-500">{t('bài')}</span>
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-3 sm:contents">
              <span className="min-w-0 truncate text-xs text-slate-500">{x.lop.map((l) => `${l.code} (${l.n})`).join(' · ')}</span>
              <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-late">{x.treNhat > 0 ? `⚠ ${t('trễ nhất {n} ngày', { n: x.treNhat })}` : ''}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * CHỐT LỘ TRÌNH NGAY TẠI TỔNG QUAN (OV-15h1, mockup 3 mục 1c): panel dùng lại khối "Lộ trình tiếp theo" của hồ sơ lớp (`BangLoTrinhTiep`), không mở trang mới.
 * Quyền của từng ô đọc từ hồ sơ lớp (cùng `viewer` hồ sơ lớp dùng); lưu / chốt xong thì Tổng quan tải lại.
 */
export function PanelLoTrinhLop({ classId, lop, onDong }: { classId: number; lop: string | null; onDong: () => void }) {
  const { session } = useSession();
  const hs = useApi<HoSoLop>(`/classes/${classId}/overview`, [classId]);
  const v = hs.data?.viewer;
  const quyen: QuyenDong | null = v ? {
    coTheSuaHocVien: !!v.coTheSuaHocVien, coTheBaoCase: v.canReportCase, coTheGhiViPham: v.canRecordViolation, coTheNhapDiem: v.canEnterScores,
    coTheChuyenTiep: v.coTheChuyenTiep, theoVai: !!vaiXemHocVien(session?.roles), coTheSuaThongTin: !!v.coTheSuaThongTin, coTheSuaThem: !!v.coTheSuaThem,
  } : null;
  const doi = () => { invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/classes'); };
  /* Bàn giao mở THAY panel lộ trình (không chồng hai panel); "‹ Lộ trình" về lại đúng bảng lộ trình của lớp. */
  const [banGiao, setBanGiao] = useState<number | null>(null);
  if (banGiao !== null) {
    return <BanGiaoPanel classId={classId} mon={null} lenhId={banGiao} onClose={onDong} onDone={doi} quayLai={{ nhan: t('Lộ trình'), onClick: () => setBanGiao(null) }} />;
  }
  return (
    <KhungPanel tieuDe={t('Chốt lộ trình')} lop={lop} rong="toan" onDong={onDong}
      ngCanh={<Link to={`/hoc-vien/lop/${classId}?che-do=lo-trinh`} className="link text-xs">{t('Mở hồ sơ lớp ›')}</Link>}>
      {hs.error ? <ErrorState message={hs.error.message} hint={hs.error.hint} onRetry={hs.reload} />
        : !quyen ? <Skeleton rows={6} />
        : <BangLoTrinhTiep classId={classId} quyen={quyen} onDoi={doi} emMo={null} onDaMoEm={() => {}} onBanGiao={setBanGiao} />}
    </KhungPanel>
  );
}
