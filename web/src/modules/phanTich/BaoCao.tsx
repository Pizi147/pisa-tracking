import { useEffect, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { SoO as SoLieuO, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { BangMock } from './KetQuaThi.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import {
  CHUONG_TRINH_LABEL, NHAN_KET_QUA_MOCK, chuSoTruoc, ngay, nhanKhoang, tyLeDatMock,
  type BaoCaoKq, type KetQuaMock,
} from '@shared/domain/index.ts';

/**
 * BÁO CÁO (OV-15e, C24–C26, mockup 3 mục 3) — tab đầu của Phân tích, mặc định 2 tuần hoàn chỉnh vừa qua (bộ chọn chung). Năm khối: Test · SOS theo lớp ·
 * Kết quả Mock Test · HV cần chú ý (tại lúc xem) · Case / PA. Mỗi số bấm → panel kết quả cụ thể (C26): số trong kỳ đọc `/phan-tich/bao-cao/o`, số tại lúc
 * xem đọc chỉ số trong sổ (cùng Tổng quan), Kết quả Mock mở chính bảng Kết quả thi đã lọc. "In" = giấy sáng, một trang A4 ngang (C24). Không khung
 * Đã thi – Chờ KQ (C25).
 */
function Khoi({ tieuDe, phu, children, className = '' }: { tieuDe: string; phu?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card flex min-w-0 flex-col gap-3 p-4 break-inside-avoid ${className}`}>
      <h2 className="m-0 text-sm font-semibold text-slate-100">{tieuDe}{phu && <span className="font-normal text-slate-400"> · {phu}</span>}</h2>
      {children}
    </section>
  );
}
function So({ so, nhan, phu, canhBao }: { so: ReactNode; nhan: string; phu?: ReactNode; canhBao?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className={`text-[20px] font-bold leading-tight tabular-nums ${canhBao ? 'text-late' : 'text-slate-100'}`}>{canhBao && <span aria-hidden>⚠ </span>}{so}</span>
      <span className="text-xs text-slate-300">{nhan}</span>
      {phu && <span className="text-xs text-slate-400">{phu}</span>}
    </div>
  );
}

export function BaoCao(pv: PhamViPhanTich) {
  const { homNay } = useNgayNghiepVu();
  const ct = pv.ct ?? 'ft';
  const query = thamSoLoc({ ...pv, classId: null });
  const { data, loading, error, reload } = useApi<BaoCaoKq>(`/phan-tich/bao-cao?${query}`, [query]);
  const branches = useApi<any[]>('/ref/branches');
  const [moMock, setMoMock] = useState<KetQuaMock | null>(null);
  const ptGv = usePhanTrang(data?.test.gvQuaHan.length ?? 0, query, 'GV');
  const ptSos = usePhanTrang(data?.sos?.hang.length ?? 0, query, 'lớp');

  /* In / chiếu: nền sáng (kể cả khi đang chế độ tối) — đổi giao diện lúc in rồi trả lại. */
  useEffect(() => {
    let cu: string | undefined;
    const truoc = () => { cu = document.documentElement.dataset.theme; document.documentElement.dataset.theme = 'light'; };
    const sau = () => { if (cu === undefined) delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = cu; };
    window.addEventListener('beforeprint', truoc);
    window.addEventListener('afterprint', sau);
    return () => { window.removeEventListener('beforeprint', truoc); window.removeEventListener('afterprint', sau); };
  }, []);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;
  const nhan = nhanKhoang(pv.khoang);
  const tenCn = pv.branchId ? branches.data?.find((b) => b.id === pv.branchId)?.name ?? '' : t('Tất cả chi nhánh');
  const nguon = (o: string) => `/phan-tich/bao-cao/o?${query}&o=${encodeURIComponent(o)}`;
  const soO = (giaTri: number, o: string, tieuDe: string) => <SoLieuO giaTri={giaTri} nguon={nguon(o)} tieuDe={tieuDe} />;
  const loc = { branchId: pv.branchId, chuongTrinh: ct };
  const tyLe = data.test.baiTong ? Math.round((100 * data.test.baiDaCham) / data.test.baiTong) : null;
  const mk = data.mock;
  const tl = mk ? tyLeDatMock(mk) : null;
  const soTuanTruoc = nhan.phu.match(/(\d+) tuần/)?.[1];
  const tai = ngay(homNay, homNay);

  return (
    <div className="bao-cao space-y-3">
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } .bao-cao .card { box-shadow: none; } }'}</style>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="m-0 text-base font-semibold text-slate-100">{t('Báo cáo')} <span className="tabular-nums">{nhan.chinh}</span></h2>
        <span className="text-xs tabular-nums text-slate-400">{nhan.phu} · {tenCn} · {CHUONG_TRINH_LABEL[ct]}</span>
        <span className="flex-1" />
        <button type="button" className="btn btn-sm min-h-[44px] print:hidden sm:min-h-0" onClick={() => window.print()}>{t('In')}</button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-12 print:grid-cols-12">
        <Khoi tieuDe={`Test ${nhan.chinh}`} className={data.sos ? 'lg:col-span-7 print:col-span-7' : 'lg:col-span-12 print:col-span-12'}>
          <div className="grid grid-cols-3 gap-3">
            <So so={soO(data.test.hvDaThi, 'hv-da-thi', t('HV đã thi'))} nhan={t('HV đã thi')} phu={t('{n} lượt lớp', { n: data.test.luotLop })} />
            <So so={<>{soO(data.test.baiDaCham, 'bai-da-cham', t('Bài đã chấm'))}<span className="text-slate-400">/{data.test.baiTong}</span></>} nhan={t('bài đã chấm')} phu={tyLe !== null ? `${tyLe}%` : undefined} />
            <So so={soO(data.test.quaHan, 'bai-qua-han', t('Bài quá hạn'))} nhan={t('bài quá hạn')} phu={`${data.test.gvQuaHan.filter((g) => g.gvId).length} GV`} canhBao={data.test.quaHan > 0} />
          </div>
          {data.test.gvQuaHan.length > 0 && (
            <div>
              <PhanTrang {...ptGv.thanh} />
              {/* 375: đầu cột + tên GV + kỹ năng xuống dòng; còn rộng hơn khung thì cuộn ngang TRONG khung bảng, trang không trượt. */}
              <div className="table-scroll">
              <table className="w-full text-sm">
                <thead><tr><th className="th max-sm:whitespace-normal">{t('Quá hạn theo GV')}</th><th className="th max-sm:whitespace-normal">{t('Kỹ năng')}</th><th className="th text-center">{t('Bài')}</th><th className="th max-sm:hidden">{t('Lớp')}</th></tr></thead>
                <tbody>
                  {ptGv.cat(data.test.gvQuaHan).map((g) => (
                    <tr key={g.khoa}>
                      <td className="td break-words">{dich(g.ten)}</td>
                      <td className="td sm:whitespace-nowrap">{g.kyNang.join(' · ')}</td>
                      <td className="td text-center">{soO(g.bai, `gv:${g.khoa}`, `${t('Quá hạn')} · ${dich(g.ten)}`)}</td>
                      <td className="td text-xs text-slate-300 max-sm:hidden" title={g.lop.join(' · ')}>{g.lop.join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <PhanTrang {...ptGv.thanh} duoi />
            </div>
          )}
        </Khoi>

        {data.sos && (
          /* SL2 (9.1-4, X-23): số TRONG KỲ mang tên khác "SOS hiện tại" (khối HV cần chú ý); cùng luật tab Kết quả thi — gồm SOS tạm, ghi riêng. */
          <Khoi tieuDe={t('SOS trong kỳ')} phu={data.sos.tong.tam ? `HV · ${t('trong đó {n} tạm', { n: data.sos.tong.tam })}` : 'HV'} className="lg:col-span-5 print:col-span-5">
            {!data.sos.hang.length ? <Empty title={t('Không có SOS trong kỳ này')} /> : (
              <div>
                <PhanTrang {...ptSos.thanh} />
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup><col style={{ width: '32%' }} /><col /><col /><col /><col style={{ width: '30%' }} /></colgroup>
                  <thead><tr>
                    <th className="th">{t('Lớp')}</th><th className="th whitespace-normal text-center">SOS 1</th><th className="th whitespace-normal text-center">SOS 2</th><th className="th whitespace-normal text-center">SOS 3</th>
                    {/* OV-15h2 (ý 8): 375 — đầu cột xuống dòng trong cột (SOS 1–3, So … tuần trước), không cắt chữ / tràn sát mép bảng. */}
                    <th className="th whitespace-normal">{soTuanTruoc ? t('So {n} tuần trước', { n: soTuanTruoc }) : t('So kỳ trước')}</th>
                  </tr></thead>
                  <tbody>
                    {[...ptSos.cat(data.sos.hang), { ...data.sos.tong, lop: pv.branchId ? t('Cả {cn}', { cn: tenCn }) : t('Tổng') }].map((h) => (
                      <tr key={h.classId} className={h.classId ? '' : 'border-t font-semibold'} style={h.classId ? undefined : { borderColor: 'var(--line-strong)' }}>
                        <td className="td truncate">{h.lop}</td>
                        {([1, 2, 3] as const).map((m) => (
                          <td key={m} className="td text-center">{soO(h[`sos${m}`], `sos:${h.classId || 'tong'}:${m}`, `SOS ${m} · ${h.lop}`)}</td>
                        ))}
                        <td className="td text-xs text-slate-300">{chuSoTruoc(h.nay, h.truoc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PhanTrang {...ptSos.thanh} duoi />
              </div>
            )}
          </Khoi>
        )}

        {mk && (
          <Khoi tieuDe={t('Kết quả Mock Test')} className="lg:col-span-4 print:col-span-4">
            {(['dat', 'chua-dat', 'chua-du'] as const).map((k) => {
              const n = k === 'dat' ? mk.dat : k === 'chua-dat' ? mk.chuaDat : mk.chuaDu;
              const phu = k === 'dat' ? (tl !== null ? t('tỷ lệ đạt {p}% ({a}/{b})', { p: tl, a: mk.dat, b: mk.dat + mk.chuaDat }) : undefined) : k === 'chua-du' ? t('không tính vào tỷ lệ') : undefined;
              return (
                <So key={k} nhan={NHAN_KET_QUA_MOCK[k]} phu={phu}
                  so={n > 0 ? <button type="button" onClick={() => setMoMock(k)} aria-label={`${n} — ${NHAN_KET_QUA_MOCK[k]}`}
                    className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-bold tabular-nums underline decoration-dotted underline-offset-4 max-sm:-mx-2 max-sm:-my-3 max-sm:px-2 max-sm:py-3">{n}</button> : <span className="text-slate-500">0</span>} />
              );
            })}
          </Khoi>
        )}

        <Khoi tieuDe={t('HV cần chú ý')} phu={t('tại {ngay}', { ngay: tai })} className={mk ? 'lg:col-span-4 print:col-span-4' : 'lg:col-span-6 print:col-span-6'}>
          {data.chuY.chuaLich !== null && <So so={<SoLieuO id="hv-ft-xong-mt-cuoi-chua-mt-ke" giaTri={data.chuY.chuaLich} phamVi={loc} ten={t('Chưa lịch Test')} />} nhan={t('chưa lịch Test')} />}
          <So so={<SoLieuO id="hv-sos-hien-tai" giaTri={data.chuY.sosHienTai} phamVi={loc} ten={t('SOS hiện tại')} />} nhan={t('SOS hiện tại')} />
          <So so={data.chuY.chuaDiemHv} nhan={t('chưa điểm')} phu={<><SoLieuO id="bai-qua-han-nhap-diem" giaTri={data.chuY.chuaDiemBai} phamVi={loc} ten={t('Bài chưa điểm')} /> {t('bài')}</>} />
          <So so={data.chuY.caseChuaChotHv} nhan={t('Case chưa chốt PA')} phu={<><SoLieuO id="case-cho-xac-dinh-nguyen-nhan" giaTri={data.chuY.caseChuaChot} phamVi={loc} ten={t('Case chưa chốt PA')} /> Case</>} />
        </Khoi>

        <Khoi tieuDe={t('Case / PA')} className={mk ? 'lg:col-span-4 print:col-span-4' : 'lg:col-span-6 print:col-span-6'}>
          <So so={<SoLieuO id="case-mo" giaTri={data.casePa.caseMo} phamVi={loc} ten={t('Case đang mở')} />} nhan={t('Case đang mở')} phu={t('tại {ngay}', { ngay: tai })} />
          <So so={<SoLieuO id="pa-co-ket-qua" giaTri={data.casePa.paKetQua} phamVi={loc} extra={{ from: pv.khoang.tu, to: pv.khoang.den }} ten={t('PA có kết quả trong kỳ')} />} nhan={t('PA có kết quả trong kỳ')} />
          <So canhBao={data.casePa.quaHanChotPa + data.casePa.quaHanKetQuaPa > 0} so={data.casePa.quaHanChotPa + data.casePa.quaHanKetQuaPa} nhan={t('quá hạn')}
            phu={<><SoLieuO id="case-xac-dinh-nguyen-nhan-qua-han" giaTri={data.casePa.quaHanChotPa} phamVi={loc} ten={t('Chốt PA quá hạn')} /> {t('chốt PA')} · <SoLieuO id="pa-can-cap-nhat" giaTri={data.casePa.quaHanKetQuaPa} phamVi={loc} ten={t('Kết quả PA quá hạn')} /> {t('Kết quả PA')}</>} />
        </Khoi>
      </div>

      {moMock && (
        <KhungPanel tieuDe={`${NHAN_KET_QUA_MOCK[moMock]} · Mock Test · ${nhan.chinh}`} rong="rong" onDong={() => setMoMock(null)}
          ngCanh={<span className="text-xs text-slate-400">{tenCn} · Fast Track · {t('Đạt khi OVR ≥ kỳ vọng của đợt')}</span>}
          chan={{ huy: { nhan: t('Đóng'), onClick: () => setMoMock(null) } }}>
          <div className="pt-3"><BangMock pv={{ ...pv, classId: null }} kqMacDinh={moMock} trongPanel /></div>
        </KhungPanel>
      )}
    </div>
  );
}
