import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { PanelBuocTiep } from '../students/PanelBuocTiep.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import {
  duongLichTest, lopCoVanDe, nhanQuaHan, tuanLich,
  type CanBanQuyet, type ChuongTrinh, type CotLopQl, type DemYeuCau, type HangLopQl, type TongQuanQlA,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN QUẢN LÝ — phương án A (OV-15d, mockup 3 mục 1, 1c, 1d; C02, C23, Q5, Q6a). Thứ tự: dải tóm tắt "HV cần chú ý" (số dẫn tới việc) →
 * Cần bạn quyết (Chờ duyệt · Case chưa chốt PA quá hạn · Chọn bước tiếp sau thi · Chốt lộ trình khi có) → Lớp cần chú ý → Tuần này.
 * Mỗi số bấm mở panel CÙNG tập máy chủ đếm (`SoLieuO`: chỉ số trong sổ hoặc `/tong-quan/ql/o`); số 0 không bấm. Không nút Nhắc (C03): GV đã nhận
 * thông báo tự động. Tải lỗi theo từng khối, khối khác vẫn hiện. Thống kê theo kỳ: Phân tích.
 */
export function TongQuanQl({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const q = new URLSearchParams({ ct });
  if (branchId) q.set('branchId', String(branchId));
  const { data, loading, error, reload } = useApi<TongQuanQlA>(`/tong-quan/ql?${q}`, [branchId, ct]);
  const nguon = (o: string) => `/tong-quan/ql/o?${q}&o=${encodeURIComponent(o)}`;
  const phamVi = { branchId, chuongTrinh: ct };
  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <div className="card p-4"><Skeleton rows={2} /></div>
          : <DaiTomTat d={data} nguon={nguon} phamVi={phamVi} ct={ct} branchId={branchId} />}
      <CanBanQuyetKhoi branchId={branchId} ct={ct} />
      {data && <LopCanChuY d={data} nguon={nguon} ct={ct} />}
      {data && <TuanNay d={data} nguon={nguon} branchId={branchId} />}
    </div>
  );
}

/** Số lớp mỗi khung cho công tắc đầu trang — cùng đường với khối (`useApi` gộp GET đang bay). */
export function useSoLopQl(branchId: number | null, ct: ChuongTrinh) {
  const q = new URLSearchParams({ ct });
  if (branchId) q.set('branchId', String(branchId));
  return useApi<TongQuanQlA>(`/tong-quan/ql?${q}`, [branchId, ct]).data?.soLop;
}

type PhamVi = { branchId: number | null; chuongTrinh: ChuongTrinh };

function DaiTomTat({ d, nguon, phamVi, ct, branchId }: { d: TongQuanQlA; nguon: (o: string) => string; phamVi: PhamVi; ct: ChuongTrinh; branchId: number | null }) {
  const x = d.tomTat;
  const muc = 'flex items-baseline gap-1.5 whitespace-nowrap text-[13px] text-slate-400';
  const so = 'text-base font-bold text-slate-100';
  return (
    <section aria-label={t('HV cần chú ý')} className="card flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3" data-hd="tq-tom-tat">
      <b className="text-[13px] font-semibold text-slate-200">{t('HV cần chú ý')}</b>
      {x.chuaLich !== null && <span className={muc}><SoLieuO id="hv-ft-xong-mt-cuoi-chua-mt-ke" giaTri={x.chuaLich} phamVi={phamVi} className={so} />{t('chưa lịch Test')}</span>}
      <span className={muc}><SoLieuO nguon={nguon('chua-diem')} tieuDe={t('HV chưa điểm')} giaTri={x.chuaDiemHv} className={so} />{t('chưa điểm')}</span>
      <span className={`${muc} flex-wrap`}>
        <SoLieuO nguon={nguon('case-chua-chot-hv')} tieuDe={t('HV có Case chưa chốt PA')} giaTri={x.caseChuaChotHv} nhan={t('{n} HV', { n: x.caseChuaChotHv })} className={so} />
        <span aria-hidden>·</span>
        <SoLieuO id="case-cho-xac-dinh-nguyen-nhan" giaTri={x.caseChuaChot} phamVi={phamVi} nhan={t('{n} Case', { n: x.caseChuaChot })} className={so} />
        {t('Case chưa chốt PA')}
        {x.caseQuaHan > 0 && <span className="font-semibold text-late">⚠ <SoLieuO id="case-xac-dinh-nguyen-nhan-qua-han" giaTri={x.caseQuaHan} phamVi={phamVi} className="font-semibold text-late" /> {t('quá hạn')}</span>}
      </span>
      <span className={muc}><SoLieuO id="bai-qua-han-nhap-diem" giaTri={x.baiTre} phamVi={phamVi} className={so} />{t('bài trễ chấm · {n} GV', { n: x.gvTre })}</span>
      <span className="flex-1" />
      <Link to={`/phan-tich?goc=tong-hop&ct=${ct}${branchId ? `&cn=${branchId}` : ''}`} className="link whitespace-nowrap text-xs">{t('Thống kê theo kỳ: Phân tích ›')}</Link>
    </section>
  );
}

/** Khối có đầu "h2 · phụ" — một khuôn cho ba khối (mockup `.khoi`). */
function Khoi({ tieuDe, phu, children, id, hd }: { tieuDe: string; phu?: React.ReactNode; children: React.ReactNode; id: string; hd?: string }) {
  return (
    <section className="card" aria-labelledby={id} data-hd={hd}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 id={id} className="m-0 text-[15px] font-semibold text-slate-100">{tieuDe}</h2>
        {phu}
      </header>
      {children}
    </section>
  );
}
function DauNhom({ ten, n, quaHan }: { ten: string; n: number; quaHan?: number }) {
  return (
    <div className="flex items-baseline gap-2 px-4 pb-1 pt-3 text-[13px]">
      <b className="font-semibold text-slate-200">{ten}</b><span className="tabular-nums text-slate-500">{n}</span>
      {!!quaHan && <span className="text-xs font-bold text-late">{t('⚠ {quaHan} quá hạn', { quaHan })}</span>}
    </div>
  );
}

/** Mỗi nhóm hiện 3 dòng đầu + "Hiện n nữa" (mockup 3: "Hiện 7 thẻ nữa"). */
function BaDong<T>({ ds, ve }: { ds: T[]; ve: (x: T) => React.ReactNode }) {
  const [het, setHet] = useState(false);
  return (
    <>
      {(het ? ds : ds.slice(0, 3)).map(ve)}
      {!het && ds.length > 3 && (
        <div className="px-4 pt-1"><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setHet(true)}>{t('Hiện {n} nữa', { n: ds.length - 3 })}</button></div>
      )}
    </>
  );
}

function CanBanQuyetKhoi({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { data, loading, error, reload } = useApi<CanBanQuyet>(branchId ? `/tong-quan/can-quyet?branchId=${branchId}` : '/tong-quan/can-quyet', [branchId]);
  const dem = useApi<DemYeuCau>('/yeu-cau/dem').data;
  const [ngan, setNgan] = useState<{ caseId: number; em: string | null; lop: string | null } | null>(null);
  const [buoc, setBuoc] = useState<CanBanQuyet['buocTiep'][number] | null>(null);
  const xong = () => { reload(); invalidate('/tong-quan'); invalidate('/my-work'); };
  const coGi = !!dem?.cho || !!data && (data.caseQuaHan.length + data.buocTiep.length + data.chotLoTrinh.length > 0);
  const dong = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_150px_auto]';
  /* Q5: Chốt lộ trình chỉ khi có việc — không card thường trực; đứng đầu khi đang xem Lớp thường (mockup 3 mục 1c). */
  const chotLoTrinh = !!data?.chotLoTrinh.length && (
    <div>
      <DauNhom ten={t('Chốt lộ trình')} n={data.chotLoTrinh.length} quaHan={data.chotLoTrinh.filter((x) => x.quaHan).length} />
      <BaDong ds={data.chotLoTrinh} ve={(x) => (
                    <div key={x.classId} className={dong} style={{ borderColor: 'var(--line)' }}>
                      <span className="min-w-0"><b className="block text-[13px] font-semibold text-slate-100">{x.lop}</b><span className="block text-xs text-slate-500">{dich(x.chu)}</span></span>
                      <Han han={x.han} quaHan={x.quaHan} />
                      <Link to={`/hoc-vien/lop/${x.classId}?viec=lo-trinh-ca-lop`} className="btn btn-sm min-h-[44px] no-underline max-sm:col-start-2 max-sm:justify-self-end sm:min-h-[32px]">{t('Chốt lộ trình')}</Link>
                    </div>
      )} />
    </div>
  );
  return (
    <Khoi id="can-quyet" hd="tq-can-quyet" tieuDe={t('Cần bạn quyết')} phu={<span className="text-xs text-slate-500">{t('quá hạn lên đầu')}</span>}>
      {error ? <div className="p-4"><ErrorState message={t('Không tải được việc cần quyết.')} hint={error.message} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={3} /></div>
          : !coGi ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có việc chờ ✓')}</p> : (
            <div className="pb-2">
              {ct === 'thuong' && chotLoTrinh}
              {!!dem?.cho && (
                <div>
                  <DauNhom ten={t('Chờ duyệt')} n={dem.cho} quaHan={dem.quaHan} />
                  <div className="px-4"><HopChoDuyet gon /></div>
                </div>
              )}
              {data.caseQuaHan.length > 0 && (
                <div>
                  <DauNhom ten={t('Case chưa chốt PA · quá hạn')} n={data.caseQuaHan.length} />
                  <BaDong ds={data.caseQuaHan} ve={(x) => (
                    <div key={x.caseId} className={dong} style={{ borderColor: 'var(--line)' }}>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          {x.sos ? <ChipSos muc={x.sos} tinh /> : null}
                          <b className="text-[13px] font-semibold text-slate-100">{x.em?.ten ?? t('Học viên')}</b>
                          <span className="text-xs text-slate-500">{[x.lop, x.nguoi].filter(Boolean).join(' · ')}</span>
                        </span>
                        {x.tinhTrang && <span className="block text-xs text-slate-400">{dich(x.tinhTrang)}</span>}
                      </span>
                      <span className="text-xs font-semibold text-late">⚠ {nhanQuaHan(x.soNgay)}</span>
                      <button type="button" className="btn btn-sm min-h-[44px] max-sm:col-start-2 max-sm:justify-self-end sm:min-h-[32px]" onClick={() => setNgan({ caseId: x.caseId, em: x.em?.ten ?? null, lop: x.lop })}>{t('Mở Case')}</button>
                    </div>
                  )} />
                </div>
              )}
              {data.buocTiep.length > 0 && (
                <div>
                  <DauNhom ten={t('Chọn bước tiếp sau thi')} n={data.buocTiep.length} quaHan={data.buocTiep.filter((x) => x.quaHan).length} />
                  <BaDong ds={data.buocTiep} ve={(x) => (
                    <div key={x.key} className={dong} style={{ borderColor: 'var(--line)' }}>
                      <span className="min-w-0"><b className="block text-[13px] font-semibold text-slate-100">{x.em.ten}{x.lop ? <span className="font-normal text-slate-500"> · {x.lop}</span> : null}</b>
                        <span className="block text-xs text-slate-400">{dich(x.ketQua)}</span></span>
                      <Han han={x.han} quaHan={x.quaHan} />
                      <button type="button" className="btn btn-sm min-h-[44px] max-sm:col-start-2 max-sm:justify-self-end sm:min-h-[32px]" onClick={() => setBuoc(x)}>{t('Chọn bước tiếp')}</button>
                    </div>
                  )} />
                </div>
              )}
              {ct === 'ft' && chotLoTrinh}
            </div>
          )}
      {ngan && <NganCase caseId={ngan.caseId} hocVien={ngan.em} lop={ngan.lop} onClose={() => setNgan(null)} onChanged={xong} />}
      {buoc && <PanelBuocTiep cycleId={buoc.cycleId} hocVien={buoc.em} lop={buoc.lop} onClose={() => setBuoc(null)} onDone={() => { setBuoc(null); xong(); }} />}
    </Khoi>
  );
}

function Han({ han, quaHan }: { han: string | null; quaHan: boolean }) {
  if (!han) return <span className="text-xs text-slate-500">{t('Chưa có hạn')}</span>;
  return quaHan
    ? <span className="text-xs font-semibold text-late">⚠ {t('hạn {ngay}', { ngay: `${han.slice(8, 10)}/${han.slice(5, 7)}` })}</span>
    : <span className="text-xs tabular-nums text-slate-400">{t('hạn {ngay}', { ngay: `${han.slice(8, 10)}/${han.slice(5, 7)}` })}</span>;
}

/** Tên cột đọc to / tiêu đề panel của một ô bảng lớp. */
const TEN_COT: Record<CotLopQl, string> = {
  hv: 'HV', chuaLich: t('Chưa lịch'), chuaDiem: t('Chưa điểm'), sos1: 'SOS 1', sos2: 'SOS 2', sos3: 'SOS 3',
  caseHv: t('HV có Case chưa chốt PA'), caseN: t('Case chưa chốt PA'), daThiChoKq: t('Đã thi · chờ KQ'),
};
const COT_SO: { cot: CotLopQl; nhan: string }[] = [
  { cot: 'hv', nhan: 'HV' }, { cot: 'chuaLich', nhan: t('Chưa lịch') }, { cot: 'chuaDiem', nhan: t('Chưa điểm') },
];

function LopCanChuY({ d, nguon, ct }: { d: TongQuanQlA; nguon: (o: string) => string; ct: ChuongTrinh }) {
  const [chiVanDe, setChiVanDe] = useState(true);
  const dienThoai = useDienThoai();
  const hien = chiVanDe ? d.lop.hang.filter(lopCoVanDe) : d.lop.hang;
  const an = d.lop.hang.length - hien.length;
  const ft = ct === 'ft';
  const o = (h: HangLopQl, cot: CotLopQl, cls = 'font-semibold text-slate-100', nhan?: string) => {
    const v = h[cot];
    if (v === null) return <span className="text-slate-500">—</span>;
    return <SoLieuO nguon={nguon(`lop:${h.classId ?? 'tong'}:${cot}`)} tieuDe={`${h.lop} · ${TEN_COT[cot]}`} giaTri={v} nhan={nhan} className={cls} />;
  };
  const caseO = (h: HangLopQl) => (h.caseN
    ? <span className="inline-flex flex-col items-center leading-tight">{o(h, 'caseHv', 'font-semibold text-slate-100', t('{n} HV', { n: h.caseHv }))}{o(h, 'caseN', 'text-xs text-slate-400', t('{n} Case', { n: h.caseN }))}</span>
    : <span className="tabular-nums text-slate-500">0</span>);
  const phu = (
    <>
      <span className="flex-1" />
      <button type="button" aria-pressed={chiVanDe} onClick={() => setChiVanDe(!chiVanDe)}
        className={`btn btn-sm min-h-[44px] sm:min-h-[30px] ${chiVanDe ? 'border-[color:var(--accent)] text-slate-100' : ''}`}>{t('Chỉ lớp có vấn đề')}</button>
    </>
  );
  const rows = [d.lop.tong, ...hien];
  return (
    <Khoi id="lop-chu-y" hd="tq-lop-chu-y" tieuDe={t('Lớp cần chú ý')} phu={phu}>
      {!d.lop.hang.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không có lớp nào đang mở trong phạm vi.')}</p>
        : !hien.length ? <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Không lớp nào cần chú ý')}{' '}
          <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setChiVanDe(false)}>{t('Hiện cả {n} lớp', { n: d.lop.hang.length })}</button></p>
          : dienThoai ? (
            <ul className="m-0 list-none p-0">
              {rows.map((h) => (
                <li key={h.classId ?? 'tong'} className="space-y-1.5 border-t px-4 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-baseline gap-2"><b className="text-[13px] font-semibold text-slate-100">{h.lop}</b>
                    <span className="text-xs text-slate-500">{[t('{n} HV', { n: h.hv }), h.gvcn].filter(Boolean).join(' · ')}</span></div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                    {ft && <span>{t('SOS hiện tại')} {o(h, 'sos1')} · {o(h, 'sos2')} · {o(h, 'sos3')}</span>}
                    <span>{t('Chưa điểm')} {o(h, 'chuaDiem')}</span>
                    <span>{t('Case chưa chốt PA')} {caseO(h)}</span>
                    {ft && <span>{t('Chưa lịch')} {o(h, 'chuaLich')} · {t('Đã thi · chờ KQ')} {o(h, 'daThiChoKq')}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="table-scroll bang-dinh">
              <table className="w-full min-w-[820px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-[12px] font-semibold text-slate-400">
                    <th rowSpan={2} className="px-4 py-2 text-left font-semibold">{t('Lớp')}</th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold">{t('GVCN')}</th>
                    {COT_SO.filter((c) => ft || c.cot !== 'chuaLich').map((c) => <th key={c.cot} rowSpan={2} className="px-2 py-2 text-center font-semibold">{c.nhan}</th>)}
                    {ft && <th colSpan={3} className="px-2 pt-2 text-center font-semibold">{t('SOS hiện tại')}</th>}
                    <th rowSpan={2} className="px-2 py-2 text-center font-semibold">{t('Case chưa chốt PA')}</th>
                    {ft && <th rowSpan={2} className="px-3 py-2 text-center font-semibold">{t('Đã thi · chờ KQ')}</th>}
                  </tr>
                  {ft && <tr className="text-[11.5px] text-slate-500"><th className="px-2 pb-1.5 font-normal">SOS 1</th><th className="px-2 pb-1.5 font-normal">SOS 2</th><th className="px-2 pb-1.5 font-normal">SOS 3</th></tr>}
                </thead>
                <tbody>
                  {rows.map((h) => (
                    <tr key={h.classId ?? 'tong'} className={`border-t align-middle ${h.classId === null ? 'font-semibold' : ''}`} style={{ borderColor: 'var(--line)', background: h.classId === null ? 'var(--surface-2)' : undefined }}>
                      <td className="px-4 py-2 text-slate-100">{h.classId ? <Link to={`/hoc-vien/lop/${h.classId}`} className="link">{h.lop}</Link> : h.lop}</td>
                      <td className="px-3 py-2 text-slate-400">{h.gvcn ?? ''}</td>
                      {COT_SO.filter((c) => ft || c.cot !== 'chuaLich').map((c) => <td key={c.cot} className="px-2 py-2 text-center tabular-nums">{o(h, c.cot)}</td>)}
                      {ft && (['sos1', 'sos2', 'sos3'] as const).map((c) => <td key={c} className="px-2 py-2 text-center tabular-nums">{o(h, c)}</td>)}
                      <td className="px-2 py-2 text-center tabular-nums">{caseO(h)}</td>
                      {ft && <td className="px-3 py-2 text-center tabular-nums">{o(h, 'daThiChoKq')}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      {an > 0 && hien.length > 0 && (
        <p className="m-0 border-t px-4 py-2 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>
          {t('Ẩn {n} lớp không có việc ·', { n: an })}{' '}
          <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => setChiVanDe(false)}>{t('Hiện')}</button>
        </p>
      )}
    </Khoi>
  );
}

function TuanNay({ d, nguon, branchId }: { d: TongQuanQlA; nguon: (o: string) => string; branchId: number | null }) {
  const x = d.tuan;
  const nay = x.tuan.find((w) => w.laTuanNay);
  const han = (h: string | null) => (h ? `${h.slice(8, 10)}/${h.slice(5, 7)}` : '—');
  return (
    <Khoi id="tuan-nay" tieuDe={t('Tuần này')} phu={<><span className="flex-1" /><Link to={duongLichTest({ branchId })} className="link text-xs">{t('Lịch Test ›')}</Link></>}>
      <ul className="m-0 list-none p-0 text-[13px]">
        {x.truoc > 0 && (
          <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2">
            <b className="w-28 font-semibold text-slate-300">{t('Trước {tuan}', { tuan: tuanLich(x.tuan[0].weekStart, d.homNay) })}</b>
            <span className="text-slate-400">{t('bài còn lại')}</span>
            <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: x.truoc })}</span>
          </li>
        )}
        {x.tuan.map((w) => (
          <li key={w.weekStart} className={`flex flex-wrap items-baseline gap-x-3 border-t px-4 py-2 ${w.laTuanNay ? 'row-active' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <Link to={duongLichTest({ branchId, periodId: w.periodId })} className="link w-28 font-semibold">{tuanLich(w.weekStart, d.homNay)}{w.laTuanNay ? <span className="ml-1 text-xs font-normal text-slate-500">{t('tuần này')}</span> : null}</Link>
            {w.lop ? (
              <>
                <span className="text-slate-300">{w.tuongLai ? t('Lịch') : 'Test'} {t('{lop} lớp · {hv} HV', { lop: w.lop, hv: w.hv })}</span>
                {!w.tuongLai && <span className="tabular-nums text-slate-400">{t('Chấm {a}/{b}', { a: w.daCham, b: w.tong })}</span>}
                {w.quaHan > 0 && <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: w.quaHan })}</span>}
              </>
            ) : <span className="text-slate-500">{t('Không có Test')}</span>}
          </li>
        ))}
      </ul>
      {nay && x.testTuanNay.length > 0 && (
        <div className="border-t" style={{ borderColor: 'var(--line)' }}>
          <h3 className="m-0 px-4 pb-1 pt-3 text-[13px] font-semibold text-slate-200">{t('Test {tuan}', { tuan: tuanLich(nay.weekStart, d.homNay) })} <span className="font-normal text-slate-500">{t('{n} lớp', { n: x.testTuanNay.length })}</span></h3>
          <div className="table-scroll">
            <table className="w-full min-w-[480px] border-collapse text-[13px]">
              <thead><tr className="text-[12px] text-slate-400">
                <th className="px-4 py-1.5 text-left font-semibold">{t('Lớp')}</th><th className="px-2 py-1.5 text-left font-semibold">{t('Đợt')}</th>
                <th className="px-2 py-1.5 text-center font-semibold">HV</th><th className="px-2 py-1.5 text-center font-semibold">{t('Đã chấm')}</th>
                <th className="px-4 py-1.5 text-center font-semibold">{t('Hạn chấm')}</th>
              </tr></thead>
              <tbody>
                {x.testTuanNay.map((l) => (
                  <tr key={l.classId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                    <td className="px-4 py-1.5"><Link to={duongLichTest({ classId: l.classId, periodId: l.periodId, branchId })} className="link">{l.lop}</Link></td>
                    <td className="px-2 py-1.5 text-slate-300">{l.dot}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums">{l.hv}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums">{l.daCham}/{l.tong}</td>
                    <td className="px-4 py-1.5 text-center tabular-nums text-slate-400">{han(l.han)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="border-t pb-2" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 px-4 pb-1 pt-3 text-[13px] font-semibold text-slate-200">
          {t('Trễ chấm')}
          <span className="font-normal text-slate-500">{t('{bai} bài · {gv} GV', { bai: d.tomTat.baiTre, gv: d.tomTat.gvTre })}</span>
          {x.tre.length > 0 && <span className="text-xs font-normal text-slate-500">{t('· GV đã nhận thông báo tự động')}</span>}
        </h3>
        {!x.tre.length ? <p className="m-0 px-4 py-2 text-sm text-slate-400">{t('Không có bài trễ chấm.')}</p> : (
          <ul className="m-0 list-none p-0">
            {x.tre.map((g) => (
              <li key={g.khoa} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t px-4 py-2 text-[13px] sm:grid-cols-[220px_minmax(0,1fr)_150px_64px]" style={{ borderColor: 'var(--line)' }}>
                <b className="min-w-0 truncate font-semibold text-slate-100">{dich(g.ten)}{g.kyNang.length ? <span className="font-normal text-slate-400"> · {g.kyNang.join(', ')}</span> : null}</b>
                <span className="col-start-1 min-w-0 truncate text-xs text-slate-500 sm:col-start-auto">{g.lop.map((l) => `${l.code} (${l.n})`).join(' · ')}</span>
                <span className="col-start-1 text-xs font-semibold text-late sm:col-start-auto">{g.treNhat > 0 ? t('⚠ trễ nhất {n}', { n: nhanQuaHan(g.treNhat, true) }) : ''}</span>
                <span className="col-start-2 row-span-3 row-start-1 text-right sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                  <SoLieuO nguon={nguon(`gv:${g.khoa}`)} tieuDe={`${t('Trễ chấm')} · ${g.ten}`} giaTri={g.bai} className="text-base font-bold text-slate-100" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Khoi>
  );
}
