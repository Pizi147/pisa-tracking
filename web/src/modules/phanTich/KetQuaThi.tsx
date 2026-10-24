import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, Skeleton, BoLocDoan } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DauKetQua } from '../../ui/BieuTuong.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { duongDotTest } from '@shared/domain/index.ts';
import {
  KN_THI, LOAI_THI, NHAN_KET_QUA_MOCK, NHAN_KN_THI, NHAN_LOAI_THI, NHAN_XEP_MOCK, XEP_MOCK, ngay, nhanKhoang, tuanLich,
  type DongMock, type DongThiThat, type KetQuaMock, type KetQuaMockKq, type KetQuaThiThatKq, type LoaiThi, type XepMock,
} from '@shared/domain/index.ts';

/**
 * KẾT QUẢ THI (OV-15e, C27 + thiết kế OV-14 mục 6, mockup 6 khung 6) — tab con Mock Test / Thi thật (tầng 2), đếm theo LƯỢT ("34 lượt · 31 HV").
 * Mock: xếp theo Lớp hoặc Mức SOS (nặng trước); L · R · W · S ✓ / ✗ so kỳ vọng của đợt; "MT · tuần" mở hồ sơ MT, "Việc tiếp" mở Case.
 * Thi thật: nhóm theo lớp; Bước tiếp CHỈ ĐỌC (UI-PHAN-TICH, C16 — chọn ở tuyến Sau thi: Công việc TVV / hồ sơ HV).
 */
const ALL = 'tat-ca' as const;
type LocKq = KetQuaMock | typeof ALL;

export function KetQuaThi(props: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const loai: LoaiThi = params.get('loai') === 'thi-that' ? 'thi-that' : 'mock';
  const dat = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k); else next.set(k, v);
    setParams(next, { replace: false });
  };
  return (
    <div className="space-y-3">
      <HangTab cap="con" ariaLabel={t('Loại kết quả')} value={loai} onChange={(k) => dat('loai', k === 'mock' ? null : k)}
        tabs={LOAI_THI.map((k) => ({ key: k, label: NHAN_LOAI_THI[k] }))} />
      {loai === 'mock' ? <BangMock pv={props} /> : <BangThiThat pv={props} />}
    </div>
  );
}

// ------------------------------------------------------------------ Mock Test

/** Bảng Mock — dùng ở tab và trong panel số của Báo cáo (`kqMacDinh`: mở sẵn đúng nhóm vừa bấm). */
export function BangMock({ pv, kqMacDinh, trongPanel }: { pv: PhamViPhanTich; kqMacDinh?: KetQuaMock; trongPanel?: boolean }) {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const xep: XepMock = params.get('xep') === 'sos' ? 'sos' : 'lop';
  const [loc, setLoc] = useState<LocKq>(kqMacDinh ?? ALL);
  const query = thamSoLoc(pv, { loai: 'mock', xep });
  const { data, loading, error, reload } = useApi<KetQuaMockKq>(`/phan-tich/ket-qua-thi?${query}`, [query]);
  const rows = (data?.rows ?? []).filter((r) => loc === ALL || r.ketQua === loc);
  const pt = usePhanTrang(rows.length, `${query}|${loc}`, 'lượt');
  const setXep = (v: XepMock) => {
    const next = new URLSearchParams(params);
    if (v === 'lop') next.delete('xep'); else next.set('xep', v);
    setParams(next, { replace: true });
  };

  async function xuatExcel() {
    if (!data) return;
    const XLSX = await import('xlsx');
    const aoa: (string | number)[][] = [
      [`Kết quả Test · Mock Test · ${nhanKhoang(pv.khoang).chinh} · dữ liệu đến ${ngay(homNay)}`], [],
      ['Học viên', 'Lớp', 'MT', 'Tuần', 'OVR', 'L', 'R', 'W', 'S', 'Kỳ vọng', 'Kết quả', 'SOS', 'Case / PA', 'Việc tiếp'],
      ...rows.map((r) => [r.ten, r.lop, `MT${r.mt}`, tuanLich(r.tuan, homNay), fmtBand(r.ovr), ...KN_THI.map((k) => fmtBand(r.kn[k].band)), fmtBand(r.kyVong),
        NHAN_KET_QUA_MOCK[r.ketQua], r.sos ? `SOS ${r.sos}${r.sosTam ? ' tạm' : ''}` : '', r.casePa ?? '', r.viecTiep ?? '']),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Mock Test');
    XLSX.writeFile(wb, `ket-qua-thi-mock-${ngay(homNay).split('/').join('-')}.xlsx`);
  }

  const knO = (r: DongMock, k: (typeof KN_THI)[number]) => {
    const x = r.kn[k];
    if (x.band === null) return <span className="whitespace-nowrap text-xs text-faint">{t('chưa có')}</span>;
    const kq = x.dat === false ? 'duoi' : r.kyVong !== null && x.band > r.kyVong ? 'vuot' : 'bang';
    return <span className="inline-flex items-center gap-1 tabular-nums">{x.band.toFixed(1)}{x.dat !== null && <DauKetQua kq={kq} />}</span>;
  };
  const ketQua = (r: DongMock) => (
    <span className={`whitespace-nowrap text-xs font-semibold ${r.ketQua === 'dat' ? 'text-ok' : r.ketQua === 'chua-dat' ? 'text-bad' : 'text-muted'}`}>{NHAN_KET_QUA_MOCK[r.ketQua]}</span>
  );
  const sos = (r: DongMock) => (r.sos ? <ChipSos muc={r.sos} tam={r.sosTam} dot={`MT${r.mt}`} ten={r.ten} hienKyNang={false} /> : <span className="text-faint">—</span>);
  const viec = (r: DongMock) => (r.viecTiep
    ? (r.caseId ? <Link to={`/hoc-thuat/case/${r.caseId}`} className="link text-xs">{dich(r.viecTiep)}</Link> : <Link to={duongDotTest({ id: r.attemptId, kind: 'mock' })} className="link text-xs">{dich(r.viecTiep)}</Link>)
    : <span className="text-faint">—</span>);
  const mt = (r: DongMock) => <Link to={duongDotTest({ id: r.attemptId, kind: 'mock' })} className="link whitespace-nowrap tabular-nums">MT{r.mt} · {tuanLich(r.tuan, homNay)}</Link>;

  const tg = data?.tong;
  return (
    <Card bodyClass="p-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line)' }}>
        {!trongPanel && (
          <label className="flex items-center gap-1.5 text-slate-400">{t('Xếp theo')}
            <select className="field w-28 text-xs max-sm:min-h-[44px]" value={xep} onChange={(e) => setXep(e.target.value as XepMock)} aria-label={t('Xếp theo')}>
              {XEP_MOCK.map((k) => <option key={k} value={k}>{NHAN_XEP_MOCK[k]}</option>)}
            </select>
          </label>
        )}
        {tg && (
          <BoLocDoan<LocKq> ariaLabel={t('Kết quả')} value={loc} onChange={setLoc}
            muc={[{ key: ALL, nhan: t('Tất cả'), so: tg.luot }, ...(['dat', 'chua-dat', 'chua-du'] as const).map((k) => ({ key: k, nhan: NHAN_KET_QUA_MOCK[k], so: k === 'dat' ? tg.dat : k === 'chua-dat' ? tg.chuaDat : tg.chuaDu }))]} />
        )}
        <span className="flex-1" />
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!rows.length} onClick={xuatExcel}>⤓ {t('Xuất Excel · {n} lượt', { n: rows.length })}</button>
      </div>
      {tg && (
        <p className="m-0 flex flex-wrap gap-x-3 px-4 py-2 text-xs text-slate-400">
          <b className="font-semibold tabular-nums text-slate-100">{t('{n} lượt · {hv} HV', { n: tg.luot, hv: tg.hv })}</b>
          <span className="tabular-nums">{t('{a} Đạt · {b} Chưa đạt · {c} Chưa đủ điểm', { a: tg.dat, b: tg.chuaDat, c: tg.chuaDu })}</span>
          {/* SL2 (a7 dòng 8): đơn vị "lượt" + số SOS tạm — Báo cáo "SOS trong kỳ" đếm HV cùng luật. */}
          <span className="tabular-nums">SOS 3: {tg.sos3} · SOS 2: {tg.sos2} · SOS 1: {tg.sos1} {t('lượt')}{tg.sosTam ? ` · ${t('{n} tạm', { n: tg.sosTam })}` : ''}</span>
        </p>
      )}
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : !rows.length ? <div className="p-4"><Empty title={t('Không có lượt Mock Test nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} hint={t('Thử khoảng thời gian dài hơn.')} /></div>
        : (
          <>
            <div className="px-3"><PhanTrang {...pt.thanh} /></div>
            {dienThoai ? (
              <div>
                {pt.cat(rows).map((r) => (
                  <TheDong key={r.attemptId}
                    dau={<span className="block min-w-0"><b className="text-slate-100">{r.ten}</b> {sos(r)}<span className="block text-xs text-slate-400">{r.lop} · {mt(r)}</span></span>}
                    dong={[
                      { nhan: t('OVR · Kỳ vọng'), noiDung: <span className="flex items-center justify-end gap-2 tabular-nums">{fmtBand(r.ovr)} · {fmtBand(r.kyVong)} {ketQua(r)}</span> },
                      { nhan: 'L · R · W · S', noiDung: <span className="flex justify-end gap-2">{KN_THI.map((k) => <span key={k}>{NHAN_KN_THI[k]} {knO(r, k)}</span>)}</span> },
                      ...(r.casePa || r.viecTiep ? [{ nhan: r.casePa ? dich(r.casePa) : t('Việc tiếp'), noiDung: <span className="flex justify-end">{viec(r)}</span> }] : []),
                    ]} />
                ))}
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 1180 }}>
                  <colgroup>
                    <col style={{ width: 170 }} /><col style={{ width: 104 }} /><col style={{ width: 118 }} /><col style={{ width: 56 }} />
                    {KN_THI.map((k) => <col key={k} style={{ width: 66 }} />)}
                    <col style={{ width: 70 }} /><col style={{ width: 98 }} /><col style={{ width: 92 }} /><col style={{ width: 132 }} /><col />
                  </colgroup>
                  <thead><tr>
                    <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Lớp')}</th><th className="th">{t('MT · tuần')}</th>
                    <th className="th text-center" style={{ background: 'var(--accent-soft)' }}>OVR</th>
                    {KN_THI.map((k) => <th key={k} className="th text-center">{NHAN_KN_THI[k]}</th>)}
                    <th className="th text-center" style={{ background: 'var(--accent-soft)' }}>{t('Kỳ vọng')}</th>
                    <th className="th">{t('Kết quả')}</th><th className="th">SOS</th><th className="th">{t('Case / PA')}</th><th className="th">{t('Việc tiếp')}</th>
                  </tr></thead>
                  <tbody>
                    {pt.cat(rows).map((r) => (
                      <tr key={r.attemptId} className="row-hover">
                        <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className="link font-semibold">{r.ten}</Link></td>
                        <td className="td text-slate-300">{r.lop}</td>
                        <td className="td">{mt(r)}</td>
                        <td className="td text-center text-[15px] font-bold tabular-nums">{fmtBand(r.ovr)}</td>
                        {KN_THI.map((k) => <td key={k} className="td text-center">{knO(r, k)}</td>)}
                        <td className="td text-center text-[15px] font-bold tabular-nums">{fmtBand(r.kyVong)}</td>
                        <td className="td">{ketQua(r)}</td>
                        <td className="td">{sos(r)}</td>
                        <td className="td truncate text-xs text-slate-300" title={r.casePa ? dich(r.casePa) : undefined}>{r.casePa ? dich(r.casePa) : <span className="text-faint">—</span>}</td>
                        <td className="td truncate">{viec(r)}</td>
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
  );
}

// ------------------------------------------------------------------ Thi thật

function BangThiThat({ pv }: { pv: PhamViPhanTich }) {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const query = thamSoLoc(pv, { loai: 'thi-that' });
  const { data, loading, error, reload } = useApi<KetQuaThiThatKq>(`/phan-tich/ket-qua-thi?${query}`, [query]);
  const rows = data?.rows ?? [];
  const pt = usePhanTrang(rows.length, query, 'lượt');
  /* UI-PHAN-TICH (C16): Phân tích chỉ ĐỌC — Bước tiếp chọn ở tuyến Sau thi (Công việc TVV / hồ sơ HV); hàng chưa chọn có link sang hồ sơ. */
  const buocTiep = (r: DongThiThat) => (
    <span className={r.buocTiep ? 'text-slate-200' : 'text-faint'}>
      {r.buocTiepChu ? dich(r.buocTiepChu) : t('Chưa chọn')}
      {!r.buocTiep && r.coTheChon && <> · <Link to={`/hoc-vien/${r.studentId}`} className="link text-xs">{t('Hồ sơ HV ›')}</Link></>}
      {r.buocTiepPhu && <span className="block text-xs text-slate-400">{r.buocTiepPhu}</span>}
    </span>
  );
  const datTarget = (r: DongThiThat) => (r.khongThi ? <span className="text-xs text-muted">{t('Không thi')}</span>
    : r.dat === null ? <span className="text-faint">—</span>
    : <span className={`text-xs font-semibold ${r.dat ? 'text-ok' : 'text-bad'}`}>{r.dat ? t('Đạt') : t('Chưa đạt')}</span>);
  const nguoi = (r: DongThiThat) => (r.nguoiChon ? <span className="text-xs">{r.nguoiChon}<span className="block text-slate-400 tabular-nums">{ngay(r.ngayChon, homNay)}</span></span> : <span className="text-faint">—</span>);

  const hien = pt.cat(rows);
  const nhom = [...new Set(hien.map((r) => r.lop ?? ''))];
  const tg = data?.tong;
  return (
    <Card bodyClass="p-0">
      {tg && (
        <p className="m-0 flex flex-wrap gap-x-3 border-b px-4 py-2.5 text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
          <b className="font-semibold tabular-nums text-slate-100">{t('{n} lượt · {hv} HV', { n: tg.luot, hv: tg.hv })}</b>
          <span className="tabular-nums">{t('{a} Đạt Target · {b} Chưa đạt', { a: tg.dat, b: tg.chuaDat })}</span>
          <span className="tabular-nums">{t('Bước tiếp chưa chọn: {n}', { n: tg.chuaChon })}</span>
        </p>
      )}
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={6} /></div>
        : !rows.length ? <div className="p-4"><Empty title={t('Chưa có kết quả thi thật nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} hint={t('Kết quả thi thật nhập ở hồ sơ học viên; thử khoảng thời gian dài hơn.')} /></div>
        : (
          <>
            <div className="px-3"><PhanTrang {...pt.thanh} /></div>
            {dienThoai ? (
              <div>
                {hien.map((r) => (
                  <TheDong key={r.cycleId}
                    dau={<span className="block min-w-0"><b className="text-slate-100">{r.ten}</b><span className="block text-xs text-slate-400">{r.lop} · {ngay(r.ngayThi, homNay)}</span></span>}
                    dong={[
                      { nhan: t('OVR · Target'), noiDung: <span className="flex items-center justify-end gap-2 tabular-nums">{fmtBand(r.ovr)} · {r.target} {datTarget(r)}</span> },
                      { nhan: 'L · R · W · S', noiDung: <span className="tabular-nums">{[r.l, r.r, r.w, r.s].map(fmtBand).join(' · ')}</span> },
                      { nhan: t('Bước tiếp'), noiDung: <span className="flex justify-end">{buocTiep(r)}</span> },
                    ]} />
                ))}
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 1100 }}>
                  <colgroup>
                    <col style={{ width: 170 }} /><col style={{ width: 104 }} /><col style={{ width: 100 }} /><col style={{ width: 60 }} />
                    {[0, 1, 2, 3].map((i) => <col key={i} style={{ width: 54 }} />)}
                    <col style={{ width: 70 }} /><col style={{ width: 92 }} /><col style={{ width: 190 }} /><col />
                  </colgroup>
                  <thead><tr>
                    <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Lớp')}</th><th className="th">{t('Ngày thi')}</th>
                    <th className="th text-center" style={{ background: 'var(--accent-soft)' }}>OVR</th>
                    {['L', 'R', 'W', 'S'].map((k) => <th key={k} className="th text-center">{k}</th>)}
                    <th className="th text-center" style={{ background: 'var(--accent-soft)' }}>Target</th>
                    <th className="th">{t('Đạt Target?')}</th><th className="th">{t('Bước tiếp')}</th><th className="th">{t('Người chọn')}</th>
                  </tr></thead>
                  <tbody>
                    {nhom.map((lop) => {
                      const ds = hien.filter((r) => (r.lop ?? '') === lop);
                      const cuaLop = rows.filter((r) => (r.lop ?? '') === lop);
                      return (
                        <Fragment key={lop}>
                          <tr className="hang-lon"><td colSpan={12} className="px-3 py-1.5 text-xs font-semibold text-slate-200">
                            {lop || '—'} · {t('{n} lượt · {hv} HV', { n: cuaLop.length, hv: new Set(cuaLop.map((r) => r.studentId)).size })}
                          </td></tr>
                          {ds.map((r) => (
                            <tr key={r.cycleId} className="row-hover">
                              <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className="link font-semibold">{r.ten}</Link></td>
                              <td className="td text-slate-300">{r.lop}</td>
                              <td className="td tabular-nums">{ngay(r.ngayThi, homNay)}</td>
                              <td className="td text-center text-[15px] font-bold tabular-nums">{fmtBand(r.ovr)}</td>
                              {[r.l, r.r, r.w, r.s].map((x, i) => <td key={i} className="td text-center tabular-nums">{fmtBand(x)}</td>)}
                              <td className="td text-center text-[15px] font-bold tabular-nums">{r.target}</td>
                              <td className="td">{datTarget(r)}</td>
                              <td className="td">{buocTiep(r)}</td>
                              <td className="td">{nguoi(r)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-3"><PhanTrang {...pt.thanh} duoi /></div>
          </>
        )}
    </Card>
  );
}
