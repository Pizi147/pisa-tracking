import { useState } from 'react';
import { Link } from 'react-router-dom';
import { invalidate, type ApiError } from '../../lib/api.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { PanelViec } from '../congViec/PanelViec.tsx';
import type { WorkItem } from './WorkList.tsx';
import { PanelLoTrinhLop, thamSoTq, type DongCase, type QuanLyData, type TongQuanQlData } from './TongQuanQl.tsx';
import type { ChuongTrinh } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * TỔNG QUAN QL — A (OV-15d, mockup OV-14 số 3 mục 1, C23, Q5, Q6a). Hai khối đầu trang; "Lớp cần chú ý" là `LopCanChuY`, "Tuần này" là
 * `LichSapToi` + `TreCham` — trang đọc hai GET `/tong-quan/quan-ly` + `/tong-quan/ql` (OV-15h1, trước 4). Mọi số đi qua `OSo` (bấm → panel đúng tập, cùng hàm đếm); không Nhắc (C03).
 */
type Data = QuanLyData;

/**
 * DẢI TÓM TẮT "HV cần chú ý" (Q6a, mockup 3): chưa điểm · Case chưa chốt PA (HV · Case, ⚠ quá hạn) · bài trễ chấm · số GV.
 * Ba số đầu = hàng tổng của Lớp cần chú ý (cùng ô, cùng panel); bài trễ chấm + quá hạn = chỉ số trong sổ CÙNG khung (SL2). Mỗi số kèm đơn vị.
 */
export function DaiTomTat({ data, bang, branchId, ct }: { data: Data;
  /** `null`: phần theo khung (`/tong-quan/ql`) đang tải / lỗi — ba số đó hiện "…", phần còn lại vẫn đọc được. */
  bang: TongQuanQlData['bang'] | null; branchId: number | null; ct: ChuongTrinh }) {
  const q = thamSoTq(branchId, ct);
  const dong = (id: string) => data.canXuLy.find((x) => x.metricId === id);
  const bai = dong('bai-qua-han-nhap-diem');
  const soGv = bai && bai.nguoi !== 'ban' ? bai.nguoi.ids.length : 0;
  const caseQh = dong('case-xac-dinh-nguyen-nhan-qua-han');
  const phamVi = { branchId, chuongTrinh: ct };   // SL2: panel số cùng khung với số
  const o = (cot: string, tieuDe: string) => (!bang ? <span className="text-slate-500" aria-label={t('Đang tải')}>…</span> : (
    <OSo vung="dai" giaTri={bang.tong[cot as keyof typeof bang.tong]?.n ?? 0} className="font-semibold" tieuDe={tieuDe} nguon={`/tong-quan/chi-nhanh/o?cot=${cot}&khoa=tong&chuY=1${q ? `&${q}` : ''}`} />
  ));
  return (
    <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-[13px] text-slate-300" aria-label={t('HV cần chú ý')} data-hd="tq-tom-tat">
      <b className="font-semibold text-slate-100 max-sm:w-full">{t('HV cần chú ý')}</b>
      <span className="tabular-nums">{o('chuaDiem', t('HV chưa điểm'))} {t('HV chưa điểm')}</span>
      <span className="tabular-nums">
        {o('caseChuaChotHv', t('HV có Case chưa chốt PA'))} {t('HV')} · {o('caseChuaChot', t('Case chưa chốt PA'))} {t('Case chưa chốt PA')}
        {!!caseQh?.n && <> · <span className="text-late">⚠ <OSo vung="dai" id="case-xac-dinh-nguyen-nhan-qua-han" giaTri={caseQh.n} phamVi={phamVi} /> {t('quá hạn')}</span></>}
      </span>
      {!!bai?.n && (
        <span className="tabular-nums">
          <OSo vung="dai" id="bai-qua-han-nhap-diem" giaTri={bai.n} phamVi={phamVi} className="font-semibold" /> {t('bài trễ chấm')}{soGv ? ` · ${t('{n} GV', { n: soGv })}` : ''}
        </span>
      )}
      <span className="flex-1" />
      <Link to={`/phan-tich${branchId ? `?cn=${branchId}` : ''}`} className="link max-sm:py-3">{t('Thống kê theo kỳ: Phân tích ›')}</Link>
    </div>
  );
}

/** "CẦN BẠN QUYẾT" (C23, Q5): Chờ duyệt · Case chưa chốt PA quá hạn · Chọn bước tiếp sau thi · Chốt lộ trình (chỉ khi có). Làm tại chỗ; lỗi chỉ khối này. */
export function KhoiCanQuyet({ data, loading, error, reload, branchId, onKhung }: { data: Data | null; loading: boolean; error: ApiError | null; reload: () => void;
  /** SL1 (A7-01): chi nhánh của trang — thẻ Chờ duyệt cùng phạm vi với số đầu nhóm. */ branchId: number | null;
  /** SL2: dòng "Lớp thường: n việc ›" đổi công tắc của trang sang khung kia (không giấu việc khung kia). */ onKhung: (k: ChuongTrinh) => void }) {
  const [ngan, setNgan] = useState<DongCase | null>(null);
  const [viec, setViec] = useState<WorkItem | null>(null);
  const [chot, setChot] = useState<WorkItem | null>(null);
  const lamMoi = () => { invalidate('/tong-quan'); invalidate('/my-work'); };
  const cho = data?.choDuyet?.cho ?? 0;
  const caseQh = data?.canQuyet.caseQuaHan ?? [];
  const buocTiep = (data?.canQuyet.sauThi ?? []).filter((x) => x.group === 'buoc_tiep');
  const dsChot = (data?.canQuyet.sauThi ?? []).filter((x) => x.group === 'chot_len_ft');
  const khac = data?.khungKhac?.n ? data.khungKhac : null;
  const nhom = (ten: string, n: number, quaHan: number, phamVi?: string) => (
    <h3 className="m-0 flex flex-wrap items-baseline gap-2 pt-3 text-[13px] font-semibold text-slate-200">
      {ten} <span className="tabular-nums text-slate-400">{n}</span>
      {phamVi && <span className="text-xs font-normal text-slate-500">· {phamVi}</span>}
      {quaHan > 0 && <span className="text-xs font-bold text-late">⚠ {t('{n} quá hạn', { n: quaHan })}</span>}
    </h3>
  );
  const hang = (key: string | number, trai: React.ReactNode, han: React.ReactNode, nut: React.ReactNode) => (
    <li key={key} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-t py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]" style={{ borderColor: 'var(--line)' }}>
      <span className="min-w-0">{trai}</span>
      <span className="text-xs [&>span]:text-xs">{han}</span>
      <span>{nut}</span>
    </li>
  );
  return (
    <section className="card px-4 pb-3 pt-3" aria-labelledby="can-quyet" data-hd="tq-can-xu-ly">
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h2 id="can-quyet" className="m-0 text-base font-semibold text-slate-100">{t('Cần bạn quyết')}</h2>
        <span className="text-xs text-slate-500">{t('quá hạn lên đầu')}</span>
      </header>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={4} /></div>
        : !cho && !caseQh.length && !buocTiep.length && !dsChot.length ? (
          <p className="m-0 pt-2 text-sm text-slate-400">{t('Không có việc chờ')}</p>
        ) : (
          <>
            {cho > 0 && <>{nhom(t('Chờ duyệt'), cho, data.choDuyet?.quaHan ?? 0, t('cả hai khung'))}<div className="pt-2"><HopChoDuyet gon branchId={branchId} /></div></>}
            {caseQh.length > 0 && <>
              {nhom(t('Case chưa chốt PA'), caseQh.length, caseQh.length)}
              <ul className="m-0 list-none p-0">
                {caseQh.map((r) => hang(r.id,
                  <>
                    <span className="block truncate text-[13px] font-semibold text-slate-100">{r.em?.ten ?? dich(r.title)}{r.lop ? ` · ${r.lop}` : ''}</span>
                    {/* OV-15h1 (C23): nhóm của Case ("Case trống PA", "PA chờ xác nhận"…) — cùng phân rã `?` của Lớp cần chú ý. */}
                    <span className="block truncate text-xs text-slate-500">{[r.nguoi, r.nhom ? dich(r.nhom) : dich(r.sub)].filter(Boolean).join(' · ')}</span>
                  </>,
                  r.han ? <Han loai="xac-minh-sos" han={r.han} haiDong /> : null,
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setNgan(r)}>{t('Mở Case')}</button>))}
              </ul>
            </>}
            {buocTiep.length > 0 && <>
              {nhom(t('Chọn bước tiếp sau thi'), buocTiep.length, buocTiep.filter((x) => x.urgency === 'overdue').length)}
              <ul className="m-0 list-none p-0">
                {buocTiep.map((x) => hang(x.key,
                  <>
                    <span className="block truncate text-[13px] font-semibold text-slate-100">{x.studentName}{x.classCode ? ` · ${x.classCode}` : ''}</span>
                    {x.contextLabel && <span className="block truncate text-xs text-slate-500">{dich(x.contextLabel)}</span>}
                  </>,
                  x.due ? <Han loai="sau-thi" han={x.due} haiDong /> : null,
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setViec(x)}>{t('Chọn bước tiếp')}</button>))}
              </ul>
            </>}
            {dsChot.length > 0 && <>
              {nhom(t('Chốt lộ trình'), dsChot.length, dsChot.filter((x) => x.urgency === 'overdue').length)}
              <ul className="m-0 list-none p-0">
                {dsChot.map((x) => hang(x.key,
                  <>
                    <span className="block truncate text-[13px] font-semibold text-slate-100">{dich(x.tieuDe)}</span>
                    {x.contextLabel && <span className="block truncate text-xs text-slate-500">{dich(x.contextLabel)}</span>}
                  </>,
                  x.due ? <Han loai="chot-len-ft" han={x.due} haiDong /> : null,
                  /* OV-15h1: mở panel lộ trình cả lớp ngay tại Tổng quan (khối của hồ sơ lớp), không sang trang. */
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setChot(x)}>{t('Chốt lộ trình')}</button>))}
              </ul>
            </>}
          </>
        )}
      {data && khac && (
        <p className="m-0 pt-3 text-[13px] text-slate-400">
          {t('{khung}: {n} việc', { khung: khac.ct === 'ft' ? 'Fast Track' : t('Lớp thường'), n: khac.n })} ·{' '}
          <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => onKhung(khac.ct)}>{t('Xem')}</button>
        </p>
      )}
      {ngan && <NganCase caseId={ngan.id} hocVien={ngan.em?.ten ?? null} lop={ngan.lop ?? null} onClose={() => setNgan(null)} onChanged={lamMoi} />}
      {viec && <PanelViec it={viec} onDong={() => setViec(null)} onDaLam={lamMoi} onTiep={null} />}
      {chot?.classId && <PanelLoTrinhLop classId={chot.classId} lop={chot.classCode ?? null} onDong={() => setChot(null)} />}
    </section>
  );
}
