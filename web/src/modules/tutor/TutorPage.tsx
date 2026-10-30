import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { BoChonThoiGian } from '../phanTich/BoChonThoiGian.tsx';
import { khoangTuUrl, ngay, nhanKhoang, thamSoKhoang, KN_TUTOR, type KhoangNgay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import {
  NHAN_KET_LUAN, TIEU_CHI, boDau, nhanKyNang, nhanNoiDay, nhanSdt,
  type BangTutor, type DongTutor, type TieuChi, type TyLe,
} from './kieu.ts';
import { PanelTutor } from './PanelTutor.tsx';
import { HopGop, HopTutor } from './HopTutor.tsx';
import { TaiDanhSach } from './TaiDanhSach.tsx';

type Loc = 'chu-y' | 'dang-day' | 'ngung' | 'thieu' | 'tat-ca';
const LA_LOC = (s: string | null): s is Loc => ['chu-y', 'dang-day', 'ngung', 'thieu', 'tat-ca'].includes(s ?? '');
const khop: Record<Loc, (d: DongTutor) => boolean> = {
  'chu-y': (d) => !!d.chuY,
  'dang-day': (d) => d.buoi > 0 && d.ketLuan?.kl !== 'ngung',
  ngung: (d) => d.ketLuan?.kl === 'ngung',
  thieu: (d) => d.thieu.length > 0,
  'tat-ca': () => true,
};

/**
 * TRANG TUTOR (TU-b, đặc tả Tutor mục 7, mockup mục 2, 6, 7) — Head tutor / Quản trị: mọi tutor, sửa được; QL: tutor dạy em chi nhánh mình, chỉ xem.
 * Bộ chọn thời gian chung của Phân tích (URL `kieu`/`tu`/`den`); lọc Cần chú ý · Đang dạy · Ngừng hợp tác · Thiếu thông tin · Tất cả (URL `loc`);
 * danh sách nhỏ nên lọc / tìm / phân trang ở web — phạm vi QL do máy chủ chặn trước. Bấm tên → panel; bấm số "Không" của một tiêu chí → panel lọc sẵn.
 */
export default function TutorPage() {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const [params, setParams] = useSearchParams();
  const khoang = khoangTuUrl(params, homNay);
  const qs = new URLSearchParams({ kieu: khoang.kieu, tu: khoang.tu, den: khoang.den }).toString();
  const { data, loading, error, reload } = useApi<BangTutor>(`/tutors?${qs}`, [qs]);
  const [tim, setTim] = useState('');
  const [mo, setMo] = useState<{ id: number; tieuChi?: TieuChi } | null>(null);
  const [hop, setHop] = useState<'them' | 'tai' | 'gop' | null>(null);
  const [tenThem, setTenThem] = useState<{ ten: string; xong?: (id: number) => void } | null>(null);

  const dat = (o: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(o)) { if (v === null) next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };
  const setKhoang = (k: KhoangNgay) => dat({ kieu: null, tu: null, den: null, ...thamSoKhoang(k, homNay) });

  const sua = !!data?.coSua;
  const ds = data?.dong ?? [];
  const soLoc = (l: Loc) => ds.filter(khop[l]).length;
  const cacLoc: Loc[] = sua ? ['chu-y', 'dang-day', 'ngung', 'thieu', 'tat-ca'] : ['chu-y', 'dang-day', 'tat-ca'];
  const locUrl = params.get('loc');
  const loc: Loc = LA_LOC(locUrl) && cacLoc.includes(locUrl) ? locUrl : soLoc('chu-y') > 0 ? 'chu-y' : 'dang-day';
  const noi = params.get('noi') ?? '';
  const kn = params.get('kn') ?? '';
  const g = boDau(tim);
  const so = tim.replace(/\D/g, '');
  const rows = ds.filter(khop[loc])
    .filter((d) => !noi || (noi === 'online' ? d.noiDay === 'online' : noi === 'chua' ? d.noiDay === null : typeof d.noiDay === 'object' && d.noiDay?.id === Number(noi)))
    .filter((d) => !kn || d.kyNang.includes(kn))
    .filter((d) => !g || boDau(d.ten).includes(g) || (so.length >= 3 && !!d.sdt?.includes(so)));
  const pt = usePhanTrang(rows.length, `${qs}|${loc}|${noi}|${kn}|${g}`, t('tutor'));
  const NHAN_LOC: Record<Loc, string> = {
    'chu-y': t('Cần chú ý'), 'dang-day': t('Đang dạy'), ngung: t('Ngừng hợp tác'), thieu: t('Thiếu thông tin'), 'tat-ca': t('Tất cả'),
  };

  const tyLe = (d: DongTutor, k: TieuChi) => <OTyLe v={d[k]} nhan={TIEU_CHI.find((c) => c.k === k)!.nhan} onClick={d[k][0] < d[k][1] ? () => setMo({ id: d.id, tieuChi: k }) : undefined} />;
  const sao = (v: number | null) => (v == null ? <span className="text-faint">—</span> : <span className={`tabular-nums ${v <= 2 ? 'font-semibold text-late' : ''}`}>★ {v.toFixed(1)}</span>);
  const ketLuan = (d: DongTutor) => (d.ketLuan
    ? <span className="whitespace-nowrap text-xs"><span className={d.ketLuan.kl === 'ngung' ? 'text-slate-400' : d.ketLuan.kl === 'can_cai_thien' ? 'text-late' : 'text-slate-200'}>{NHAN_KET_LUAN[d.ketLuan.kl]}</span>
      <span className="ml-1.5 tabular-nums text-slate-500">{ngay(d.ketLuan.luc, homNay)}</span></span>
    : <span className="text-faint">—</span>);
  /* Lý do bằng chữ (không chỉ màu); không dùng ⚠ — ký hiệu đó chỉ nghĩa quá hạn (G-4). */
  const lyDo = (d: DongTutor) => (d.chuY ? <span className="block text-xs text-late">{dich(d.chuY)}</span> : null);
  const ten = (d: DongTutor) => (
    <span className="block min-w-0">
      <button type="button" className="link inline-flex min-h-[44px] items-center border-0 bg-transparent p-0 text-left font-semibold sm:min-h-0" onClick={() => setMo({ id: d.id })}>{d.ten}</button>
      {d.sdt && <span className="block text-xs tabular-nums text-slate-400">{nhanSdt(d.sdt)}</span>}
      {d.thieu.length > 0 && <span className="block text-xs text-slate-500">{d.thieu.map((x) => (x === 'sdt' ? t('Thiếu SĐT') : t('Thiếu nơi dạy'))).join(' · ')}</span>}
    </span>
  );

  return (
    <div className="page space-y-3" data-hd="tutor-trang">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 mr-2 text-xl font-bold text-slate-100">{t('Tutor')}</h1>
        <BoChonThoiGian khoang={khoang} onChange={setKhoang} />
        {data?.chiNhanh && <span className="text-sm text-slate-400">{data.chiNhanh}</span>}
        <span className="flex-1" />
        {sua && <>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setHop('them')} data-hd="tutor-them">{t('Thêm tutor')}</button>
          <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => setHop('tai')} data-hd="tutor-tai">⤒ {t('Tải danh sách')}</button>
        </>}
      </div>

      <div className="flex flex-wrap items-center gap-2" data-hd="tutor-loc">
        <BoLocDoan<Loc> ariaLabel={t('Lọc tutor')} value={loc} onChange={(l) => dat({ loc: l })}
          muc={cacLoc.map((l) => ({ key: l, nhan: NHAN_LOC[l], so: data ? soLoc(l) : null }))} />
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        {sua && (
          <label className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">{t('Nơi dạy')}
            <select className="field min-w-0 flex-1 text-xs max-sm:min-h-[44px] sm:w-36 sm:flex-none" value={noi} onChange={(e) => dat({ noi: e.target.value || null })}>
              <option value="">{t('Tất cả')}</option>
              {(data?.dsChiNhanh ?? []).map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
              <option value="online">{t('Chỉ online')}</option>
              <option value="chua">{t('Chưa có')}</option>
            </select>
          </label>
        )}
        <label className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">{t('Kỹ năng')}
          <select className="field min-w-0 flex-1 text-xs max-sm:min-h-[44px] sm:w-24 sm:flex-none" value={kn} onChange={(e) => dat({ kn: e.target.value || null })}>
            <option value="">{t('Tất cả')}</option>
            {KN_TUTOR.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <input type="search" className="field col-span-2 w-full text-sm sm:w-56 max-sm:min-h-[44px]" placeholder={t('Tìm tên hoặc SĐT')} aria-label={t('Tìm tên hoặc SĐT')}
          value={tim} onChange={(e) => setTim(e.target.value)} />
        </div>
      </div>

      {sua && !!data?.goTay?.soTen && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-300" style={{ borderColor: 'var(--line)' }} data-hd="tutor-gop">
          <span><b className="text-slate-100">{t('{n} tên gõ tay', { n: data.goTay.soTen })}</b> {t('chưa có trong danh sách · {m} buổi', { m: data.goTay.soBuoi })}</span>
          <span className="flex-1" />
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setHop('gop')}>{t('Gộp…')}</button>
        </div>
      )}

      <Card bodyClass="p-0">
        {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
          : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
          : !rows.length ? (
            <div className="p-4">
              {!ds.length
                ? <Empty title={sua ? t('Chưa có tutor nào trong danh sách') : t('Chưa có tutor dạy em chi nhánh mình trong {ky}', { ky: nhanKhoang(khoang).chinh })}
                  hint={sua ? t('Bấm Tải danh sách để nhập từ Excel, hoặc Thêm tutor.') : undefined} />
                : <Empty title={loc === 'chu-y' && !g && !noi && !kn ? t('Không có tutor cần chú ý') : t('Không có tutor khớp bộ lọc')}
                  hint={t('Thử lọc Tất cả hoặc khoảng thời gian dài hơn.')} />}
            </div>
          ) : (
            <>
              <div className="px-3"><PhanTrang {...pt.thanh} /></div>
              {dienThoai ? (
                <div>
                  {pt.cat(rows).map((d) => (
                    <TheDong key={d.id}
                      dau={<span className="block min-w-0">{ten(d)}<span className="block text-xs text-slate-400">{nhanNoiDay(d.noiDay)} · {nhanKyNang(d.kyNang)}</span>{lyDo(d)}</span>}
                      dong={[
                        ...TIEU_CHI.map((c) => ({ nhan: c.nhan, noiDung: <span className="flex justify-end">{tyLe(d, c.k)}</span> })),
                        { nhan: t('Buổi · Đánh giá'), noiDung: <span className="flex justify-end gap-2 tabular-nums">{d.buoi} · {sao(d.danhGia)}</span> },
                        { nhan: t('Kết luận'), noiDung: <span className="flex justify-end">{ketLuan(d)}</span> },
                      ]} />
                  ))}
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: sua ? 1180 : 980 }}>
                    <colgroup>
                      <col style={{ width: 190 }} /><col style={{ width: 104 }} /><col style={{ width: 88 }} /><col style={{ width: 60 }} />
                      <col style={{ width: 86 }} /><col style={{ width: 128 }} /><col style={{ width: 104 }} /><col style={{ width: 80 }} /><col style={{ width: 140 }} />
                      {sua && <col />}
                    </colgroup>
                    <thead><tr>
                      <th className="th sticky-col">{t('Tutor')}</th><th className="th">{t('Nơi dạy')}</th><th className="th">{t('Kỹ năng')}</th>
                      <th className="th text-center">{t('Buổi')}</th>
                      {TIEU_CHI.map((c) => <th key={c.k} className="th text-center">{c.nhan}</th>)}
                      <th className="th text-center">{t('Đánh giá')}</th><th className="th">{t('Kết luận')}</th>
                      {sua && <th className="th">{t('Cần chú ý vì')}</th>}
                    </tr></thead>
                    <tbody>
                      {pt.cat(rows).map((d) => (
                        <tr key={d.id} className={`row-hover ${d.ketLuan?.kl === 'ngung' ? 'opacity-60' : ''}`}>
                          <td className="td sticky-col">{ten(d)}</td>
                          <td className="td text-slate-300">{nhanNoiDay(d.noiDay)}</td>
                          <td className="td text-slate-300">{nhanKyNang(d.kyNang)}</td>
                          <td className="td text-center tabular-nums">{d.buoi}</td>
                          {TIEU_CHI.map((c) => <td key={c.k} className="td text-center">{tyLe(d, c.k)}</td>)}
                          <td className="td text-center">{sao(d.danhGia)}</td>
                          <td className="td">{ketLuan(d)}</td>
                          {sua && <td className="td">{lyDo(d)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-3"><PhanTrang {...pt.thanh} duoi /></div>
            </>
          )}
      </Card>

      {mo && <PanelTutor id={mo.id} tieuChi={mo.tieuChi} khoang={khoang} onKhoang={setKhoang} dsChiNhanh={data?.dsChiNhanh ?? []} ds={ds}
        onDong={() => setMo(null)} />}
      {(hop === 'them' || tenThem) && <HopTutor dsChiNhanh={data?.dsChiNhanh ?? []} ds={ds} tenSan={tenThem?.ten}
        onDong={() => { setHop(null); setTenThem(null); }} onXong={(id) => { tenThem?.xong?.(id); setHop(hop === 'them' ? null : hop); setTenThem(null); }} />}
      {hop === 'tai' && <TaiDanhSach dsChiNhanh={data?.dsChiNhanh ?? []} onDong={() => setHop(null)} />}
      {hop === 'gop' && <HopGop ds={ds} onDong={() => setHop(null)} onThem={(ten, xong) => setTenThem({ ten, xong })} />}
    </div>
  );
}

/** Ô tỉ lệ "4/6": có buổi "Không" → cam + bấm mở panel lọc sẵn; chưa có buổi trả lời → "—". */
export function OTyLe({ v, nhan, onClick }: { v: TyLe; nhan: string; onClick?: () => void }) {
  if (!v[1]) return <span className="text-faint">—</span>;
  const chu = <span className="tabular-nums">{v[0]}/{v[1]}</span>;
  return onClick
    ? <button type="button" className="link border-0 bg-transparent p-0 font-semibold text-late max-sm:min-h-[44px]" onClick={onClick} title={t('Xem buổi "Không"')}
      aria-label={`${nhan} ${v[0]}/${v[1]} · ${t('Xem buổi "Không"')}`}>{chu}</button>
    : <span className="text-slate-200">{chu}</span>;
}
