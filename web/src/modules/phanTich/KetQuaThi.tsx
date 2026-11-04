import { Fragment, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { CHIP_SOS, NhanKq, lopSos } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang, type ThanhPhanTrang } from '../../ui/PhanTrang.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { DOAN, DaiChiSo, DauThe, NutXemToanBo, RongDau, NutXuat, OChon, SO_TRONG_CHIP, SoO as OSo, VaoHangLoc, doanNut, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { duongDotTest } from '@shared/domain/index.ts';
import { LINK_CHU, PanelCaseLuot } from './PanelCaseLuot.tsx';
import {
  KN_THI, LOAI_THI, NHAN_KET_QUA_MOCK, NHAN_KN_THI, NHAN_LOAI_THI, XEP_MOCK, ngay, nhanKhoang, tuanLich,
  type DongMock, type DongThiThat, type KetQuaMock, type KetQuaMockKq, type KetQuaThiThatKq, type LoaiThi, type XepMock,
} from '@shared/domain/index.ts';

/**
 * KẾT QUẢ TEST (OV-15e, C27; V8-PT mockup `thiet-ke/v8/phan-tich.html` khung A3 · A4 · C2) — Mock Test / Thi thật là ô đoạn ĐẦU hàng lọc chung,
 * đếm theo LƯỢT. Mỗi bên: thẻ chỉ số (cùng `tong` của máy chủ với bảng) → thẻ bảng có tiêu đề + ⓘ Cách tính → phân trang chỉ dưới.
 * Mock: Xếp theo (Lớp / Mức SOS) + Mọi kết quả ▾ ở hàng lọc; L · R · W · S ✓ / ✗ so kỳ vọng của đợt. U08 (mockup V11): bỏ cột "Xử lý" — bấm chip SOS
 * → panel Case theo kỹ năng dưới kỳ vọng (`PanelCaseLuot`, chỉ đọc); "MT2" 15 / 600 (hồ sơ MT) + tuần mờ; tên HV · lớp · MT là link chữ thường (rê / focus mới báo).
 * Thi thật: nhóm theo lớp; Bước tiếp CHỈ ĐỌC (UI-PHAN-TICH, C16 — chọn ở tuyến Sau thi: Công việc TVV / hồ sơ HV); U08: bỏ cột "Người chọn", chưa chọn = "Chưa chọn" mờ.
 */
const ALL = 'tat-ca' as const;
type LocKq = KetQuaMock | typeof ALL;

/** Số thẻ chỉ số: bấm mở panel đúng tập (V8-PT-2 — `/phan-tich/ket-qua-thi/o`, chỉ gọi khi mở); 0 xám chữ thường không bấm (mockup `.oso-0`). */
const soThe = (query: string, o: string, n: number, tieuDe: string) => (n
  ? <OSo giaTri={n} nguon={`/phan-tich/ket-qua-thi/o?${query}&o=${o}`} tieuDe={tieuDe} vung="chi-so" />
  : <span className="font-medium text-faint">0</span>);
/** "29 %" trên lượt có kết quả (Chưa đủ điểm không vào tỷ lệ — `shared/domain/ketQuaThi.ts`). */
const phanTram = (a: number, b: number) => (b > 0 ? `${Math.round((a * 100) / b)} %` : undefined);
/** Thẻ một lượt ở 375 (`.the-hv` của mockup C2). */
const THE_HV = 'grid gap-1 rounded-xl border px-3 py-2.5';
/** U08-6: tên lớp → hồ sơ lớp (link chữ mờ, rê / focus mới báo). */
const oLop = (lopMa: string | null, classId: number | null) => (lopMa && classId
  ? <Link to={`/hoc-vien/lop/${classId}`} className={`${LINK_CHU} !text-dim`}>{lopMa}</Link> : <span className="text-dim">{lopMa ?? '—'}</span>);
const nenThe = { background: 'var(--surface)', borderColor: 'var(--line)' };

export function KetQuaThi(props: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const loai: LoaiThi = params.get('loai') === 'thi-that' ? 'thi-that' : 'mock';
  const datLoai = (k: LoaiThi) => {
    const next = new URLSearchParams(params);
    if (k === 'mock') next.delete('loai'); else next.set('loai', k);
    setParams(next, { replace: false });
  };
  return (
    <>
      <VaoHangLoc o="dau">
        <span className={DOAN} role="group" aria-label={t('Loại kết quả')}>
          {LOAI_THI.map((k) => (
            <button key={k} type="button" aria-pressed={loai === k} className={doanNut(loai === k)} onClick={() => datLoai(k)}>{NHAN_LOAI_THI[k]}</button>
          ))}
        </span>
      </VaoHangLoc>
      {loai === 'mock' ? <BangMock pv={props} /> : <BangThiThat pv={props} />}
    </>
  );
}

/** Vùng dữ liệu chung hai bên: lỗi / tải / rỗng trong thẻ; có dữ liệu → bảng (1440) hoặc thẻ từng lượt (375); phân trang CHỈ dưới. */
function VungBang({ dau, error, reload, loading, rong, pt, bang, the }: {
  dau: ReactNode; error: { message: string; hint?: string; status?: number } | null | undefined; reload: () => void; loading: boolean; rong: ReactNode | null;
  pt: ThanhPhanTrang; bang: ReactNode; the: ReactNode;
}) {
  const dienThoai = useDienThoai();
  if (error) return <Card bodyClass="p-0">{dau}<div className="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div></Card>;
  if (loading) return <Card bodyClass="p-0">{dau}<div className="p-4"><Skeleton rows={8} /></div></Card>;
  if (rong) return <Card bodyClass="p-0">{dau}{rong}</Card>;
  /* 375 (mockup C2): thẻ từng lượt đứng riêng, không khung bảng; phân trang ngay dưới thẻ cuối. */
  if (dienThoai) return <div className="space-y-2"><div ref={pt.dauBang} />{the}<div className="empty:hidden"><PhanTrang {...pt} duoi /></div></div>;
  return (
    <Card bodyClass="p-0">{dau}<div ref={pt.dauBang} />{bang}
      <div className="border-t px-3 empty:hidden" style={{ borderColor: 'var(--line)' }}><PhanTrang {...pt} duoi /></div>
    </Card>
  );
}

// ------------------------------------------------------------------ Mock Test

/** Bảng Mock — tab Kết quả Test (6c-2: bỏ tham số `kqMacDinh` / `trongPanel` của panel số cũ — không nơi nào truyền). */
export function BangMock({ pv }: { pv: PhamViPhanTich }) {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const xep: XepMock = params.get('xep') === 'sos' ? 'sos' : 'lop';
  const [loc, setLoc] = useState<LocKq>(ALL);
  const [panel, setPanel] = useState<DongMock | null>(null);
  const query = thamSoLoc(pv, { loai: 'mock', xep });
  const { data, loading, error, reload } = useApi<KetQuaMockKq>(`/phan-tich/ket-qua-thi?${query}`, [query]);
  const rows = (data?.rows ?? []).filter((r) => loc === ALL || r.ketQua === loc);
  const pt = usePhanTrang(rows.length, `${query}|${loc}`, t('lượt'));
  const setXep = (v: XepMock) => {
    const next = new URLSearchParams(params);
    if (v === 'lop') next.delete('xep'); else next.set('xep', v);
    setParams(next, { replace: true });
  };

  async function xuatExcel() {
    if (!data) return;
    const XLSX = await import('xlsx');
    const aoa: (string | number)[][] = [
      [[t('Kết quả Test / Thi'), t('Mock Test'), nhanKhoang(pv.khoang).chinh, t('dữ liệu đến {ngay}', { ngay: ngay(homNay) })].join(' · ')], [],
      [t('Học viên'), t('Lớp'), 'MT', t('Tuần'), 'OVR', 'L', 'R', 'W', 'S', t('Kỳ vọng'), t('Kết quả'), 'SOS', 'Case / PA', t('Việc tiếp')],
      ...rows.map((r) => [r.ten, r.lop, `MT${r.mt}`, tuanLich(r.tuan, homNay), fmtBand(r.ovr), ...KN_THI.map((k) => fmtBand(r.kn[k].band)), fmtBand(r.kyVong),
        NHAN_KET_QUA_MOCK[r.ketQua], r.sos ? `SOS ${r.sos}${r.sosTam ? ` ${t('tạm')}` : ''}` : '', r.casePa ?? '', r.viecTiep ? dich(r.viecTiep) : '']),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Mock Test');
    XLSX.writeFile(wb, `ket-qua-thi-mock-${ngay(homNay).split('/').join('-')}.xlsx`);
  }

  /* Ô kỹ năng (mockup `.d`): ✓ / ✗ đứng trước, tô cả số theo kết quả (`lopKq` — một chỗ); "chưa có" chữ mờ 13. */
  const knO = (r: DongMock, k: (typeof KN_THI)[number]) => {
    const x = r.kn[k];
    if (x.band === null) return <span className="whitespace-nowrap text-[13px] font-normal text-faint">{t('chưa có')}</span>;
    const kq = x.dat === false ? 'duoi' : r.kyVong !== null && x.band > r.kyVong ? 'vuot' : 'bang';
    return <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${x.dat !== null ? lopKq(kq) : ''}`}>{x.dat !== null && <DauKetQua kq={kq} />}{x.band.toFixed(1)}</span>;
  };
  const ketQua = (r: DongMock) => <NhanKq kq={r.ketQua === 'chua-du' ? 'thieu' : r.ketQua}>{NHAN_KET_QUA_MOCK[r.ketQua]}</NhanKq>;
  /* U08-4: chip SOS là nút mở panel Case theo kỹ năng (chip chỉ vẽ — `tinh`, không lồng nút). */
  const sos = (r: DongMock) => (r.sos
    ? <button type="button" aria-haspopup="dialog" className="cursor-pointer rounded border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] max-sm:min-h-[44px]"
        onClick={() => setPanel(r)} aria-label={`${t('Case theo kỹ năng · {ten}', { ten: r.ten })} · SOS ${r.sos}`}><ChipSos muc={r.sos} tam={r.sosTam} tinh /></button>
    : <span className="text-faint">—</span>);
  /* U08-5: "MT2" 15 / 600 màu chữ chính (link hồ sơ lượt MT) + tuần 13 mờ. */
  const mt = (r: DongMock) => (
    <span className="whitespace-nowrap"><Link to={duongDotTest({ id: r.attemptId, kind: 'mock' })} className={`text-[15px] font-semibold tabular-nums ${LINK_CHU}`}>MT{r.mt}</Link>
      {' '}<span className="text-[13px] text-faint">{tuanLich(r.tuan, homNay)}</span></span>
  );

  const tg = data?.tong;
  const soSos = tg ? tg.sos1 + tg.sos2 + tg.sos3 : 0;
  /* PT-GON (M4): mức SOS bằng 0 không thành chip "SOS 1 · 0"; không mức nào → "0". */
  const chipSos = (m: 1 | 2 | 3, n: number) => (n ? (
    <span key={m} className={`${CHIP_SOS} ${lopSos(m)}`}>
      <OSo giaTri={n} nhan={`SOS ${m} · ${n}`} className={SO_TRONG_CHIP} nguon={`/phan-tich/ket-qua-thi/o?${query}&o=sos${m}`} tieuDe={`SOS ${m} · ${t('Mock Test')}`} vung="chi-so" />
    </span>
  ) : null);
  const dauThe = (
    /* PT-GON (M3): bỏ "xếp theo lớp → tên" — ô Xếp theo trên hàng lọc đã nói. */
    <DauThe ten={t('Lượt Mock Test')} dem={t('{n} lượt', { n: rows.length })}
      cachTinh={<>
        <p className="m-0">{t('Đạt: OVR ≥ kỳ vọng của đợt (MT1 = Target − 1 · MT2 = Target − 0,5 · từ MT3 = Target).')}</p>
        <p className="m-0 mt-1">{t('Chưa đủ điểm: thiếu kỹ năng nên chưa có OVR — không vào tỷ lệ Đạt.')}</p>
        <p className="m-0 mt-1">{t('L · R · W · S: ✓ / ✗ so kỳ vọng của đợt. SOS đếm theo lượt, gồm SOS tạm.')}</p>
      </>} />
  );

  return (
    <>
      <VaoHangLoc o="giua">
        <OChon className="max-sm:w-[calc(50%-4px)]" value={xep} onChange={(e) => setXep(e.target.value as XepMock)} aria-label={t('Xếp theo')}>
          {XEP_MOCK.map((k) => <option key={k} value={k}>{k === 'sos' ? t('Theo mức SOS') : t('Theo lớp')}</option>)}
        </OChon>
        <OChon className="max-sm:w-full" dangLoc={loc !== ALL} value={loc} onChange={(e) => setLoc(e.target.value as LocKq)} aria-label={t('Kết quả')}>
          <option value={ALL}>{t('Mọi kết quả')}</option>
          {(['dat', 'chua-dat', 'chua-du'] as const).map((k) => (
            <option key={k} value={k}>{NHAN_KET_QUA_MOCK[k]}{tg ? ` · ${k === 'dat' ? tg.dat : k === 'chua-dat' ? tg.chuaDat : tg.chuaDu}` : ''}</option>
          ))}
        </OChon>
      </VaoHangLoc>
      <VaoHangLoc o="phai">
        <NutXuat nhan={t('Xuất Excel')} tat={!rows.length} onClick={xuatExcel} />   {/* PT-GON (M3): số lượt ở chip đầu bảng */}
      </VaoHangLoc>
      <div className="space-y-3">
        {tg && (
          /* G7: cùng `tong` máy chủ với bảng (trước là dòng chữ 12 px đầu bảng). V8-PT-2: số bấm mở panel đúng tập, cùng hàm đếm. */
          <DaiChiSo ds={[
            { ten: t('Lượt'), ky: t('trong kỳ'), gt: soThe(query, 'luot', tg.luot, `${t('Lượt')} · ${t('Mock Test')}`), mau: t('{n} HV', { n: tg.hv }) },
            { ten: t('Đạt'), gt: soThe(query, 'dat', tg.dat, `${t('Đạt')} · ${t('Mock Test')}`), nho: phanTram(tg.dat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đạt'), gt: soThe(query, 'chua-dat', tg.chuaDat, `${t('Chưa đạt')} · ${t('Mock Test')}`), nho: phanTram(tg.chuaDat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đủ điểm'), gt: soThe(query, 'chua-du', tg.chuaDu, `${t('Chưa đủ điểm')} · ${t('Mock Test')}`) },   // PT-GON (M4): "không vào tỷ lệ" ở ⓘ đầu bảng
            {
              ten: 'SOS', rong2: true,
              gt: soSos ? <span className="mt-1.5 flex flex-wrap gap-1.5">{chipSos(3, tg.sos3)}{chipSos(2, tg.sos2)}{chipSos(1, tg.sos1)}</span> : 0,
              mau: <>{t('{n} lượt', { n: soSos })}{tg.sosTam ? ` · ${t('{n} tạm', { n: tg.sosTam })}` : ''}</>,
            },
          ]} />
        )}
        <VungBang dau={dauThe} error={error} reload={reload} loading={loading || !data} pt={pt.thanh}
          rong={!rows.length ? <RongDau chu={t('Không có lượt Mock Test nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} nut={<NutXemToanBo />} /> : null}
          the={pt.cat(rows).map((r) => (
            <div key={r.attemptId} className={THE_HV} style={nenThe}>
              <div className="flex items-center gap-2">
                <Link to={`/hoc-vien/${r.studentId}`} className={`min-w-0 truncate text-[15px] font-semibold ${LINK_CHU}`}>{r.ten}</Link>
                <span className="ml-auto flex shrink-0 items-center gap-1.5">{ketQua(r)}{r.sos ? sos(r) : null}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px] text-dim">
                <span>{oLop(r.lop, r.classId)} · {mt(r)}</span>
                <span className="tabular-nums">OVR <b className="text-[color:var(--text)]">{fmtBand(r.ovr)}</b> · {t('KV')} {fmtBand(r.kyVong)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-sm font-medium">
                {KN_THI.map((k) => <span key={k} className="inline-flex items-center gap-1">{NHAN_KN_THI[k]} {knO(r, k)}</span>)}
              </div>
            </div>
          ))}
          bang={(
            <div className="table-scroll bang-dinh">   {/* P3 UI-CHUNG: danh sách cả chi nhánh dài — đầu cột dính (1180 px vừa khung từ 1280) */}
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 1180 }}>
                {/* U08: cột theo mockup V11 `bangKQ` (bỏ cột Xử lý). */}
                <colgroup>
                  <col style={{ width: 200 }} /><col style={{ width: 130 }} /><col style={{ width: 130 }} /><col style={{ width: 70 }} />
                  {KN_THI.map((k) => <col key={k} style={{ width: 72 }} />)}
                  <col style={{ width: 86 }} /><col style={{ width: 150 }} /><col />
                </colgroup>
                <thead><tr>
                  <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Lớp')}</th><th className="th">{t('MT · tuần')}</th>
                  <th className="th text-center">OVR</th>
                  {KN_THI.map((k) => <th key={k} className="th text-center">{NHAN_KN_THI[k]}</th>)}
                  <th className="th text-center">{t('Kỳ vọng')}</th>
                  <th className="th">{t('Kết quả')}</th><th className="th">SOS</th>
                </tr></thead>
                <tbody>
                  {pt.cat(rows).map((r) => (
                    <tr key={r.attemptId} className="row-hover [&>td]:h-11">
                      <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className={`text-[15px] font-semibold ${LINK_CHU}`}>{r.ten}</Link></td>
                      <td className="td">{oLop(r.lop, r.classId)}</td>
                      <td className="td">{mt(r)}</td>
                      <td className="td text-center font-medium tabular-nums">{r.ovr === null ? <span className="font-normal text-faint">—</span> : fmtBand(r.ovr)}</td>
                      {KN_THI.map((k) => <td key={k} className="td text-center">{knO(r, k)}</td>)}
                      <td className="td text-center font-medium tabular-nums">{fmtBand(r.kyVong)}</td>
                      <td className="td">{ketQua(r)}</td>
                      <td className="td">{sos(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} />
      </div>
      {panel && <PanelCaseLuot r={panel} onDong={() => setPanel(null)} />}
    </>
  );
}

// ------------------------------------------------------------------ Thi thật

function BangThiThat({ pv }: { pv: PhamViPhanTich }) {
  const { homNay } = useNgayNghiepVu();
  const query = thamSoLoc(pv, { loai: 'thi-that' });
  const { data, loading, error, reload } = useApi<KetQuaThiThatKq>(`/phan-tich/ket-qua-thi?${query}`, [query]);
  const rows = data?.rows ?? [];
  const pt = usePhanTrang(rows.length, query, t('lượt'));

  async function xuatExcel() {
    if (!data) return;
    const XLSX = await import('xlsx');
    const aoa: (string | number)[][] = [
      [[t('Kết quả Test / Thi'), t('Thi thật'), nhanKhoang(pv.khoang).chinh, t('dữ liệu đến {ngay}', { ngay: ngay(homNay) })].join(' · ')], [],
      [t('Học viên'), t('Lớp'), t('Ngày thi'), 'OVR', 'L', 'R', 'W', 'S', 'Target', t('Đạt Target'), t('Bước tiếp'), t('Người chọn'), t('Ngày chọn')],
      ...rows.map((r) => [r.ten, r.lop ?? '', r.khongThi ? t('Không thi') : ngay(r.ngayThi, homNay), fmtBand(r.ovr), fmtBand(r.l), fmtBand(r.r), fmtBand(r.w), fmtBand(r.s), r.target,
        r.dat === null ? '' : r.dat ? t('Đạt') : t('Chưa đạt'), r.buocTiepChu != null ? dich(r.buocTiepChu) : t('Chưa chọn'), r.nguoiChon ?? '', r.ngayChon ? ngay(r.ngayChon, homNay) : '']),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), t('Thi thật'));
    XLSX.writeFile(wb, `ket-qua-thi-that-${ngay(homNay).split('/').join('-')}.xlsx`);
  }

  /* UI-PHAN-TICH (C16): Phân tích chỉ ĐỌC — Bước tiếp chọn ở tuyến Sau thi (Công việc TVV / hồ sơ HV). U08-8: chưa chọn = "Chưa chọn" mờ, không link /
     nút (muốn xử lý → bấm tên HV). */
  const buocTiep = (r: DongThiThat) => (
    <span className={r.buocTiep ? '' : 'text-faint'}>
      {r.buocTiepChu != null ? dich(r.buocTiepChu) : t('Chưa chọn')}
      {r.buocTiepPhu && <span className="block text-xs text-faint">{r.buocTiepPhu}</span>}
    </span>
  );
  const datTarget = (r: DongThiThat) => (r.khongThi ? <span className="text-xs text-muted">{t('Không thi')}</span>
    : r.dat === null ? <span className="text-faint">—</span>
    : <NhanKq kq={r.dat ? 'dat' : 'chua-dat'}>{r.dat ? t('Đạt') : t('Chưa đạt')}</NhanKq>);

  const hien = pt.cat(rows);
  const nhom = [...new Set(hien.map((r) => r.lop ?? ''))];
  const tg = data?.tong;
  const dauThe = (
    <DauThe ten={t('Kết quả thi thật')} dem={t('{n} lượt', { n: rows.length })}   /* PT-GON (M4): bỏ "theo lớp → ngày thi" — hàng nhóm lớp đã cho thấy */
      cachTinh={<>
        <p className="m-0">{t('Đạt Target: OVR ≥ Target, tính lúc nhập kết quả.')}</p>
        <p className="m-0 mt-1">{t('Bước tiếp chọn ở Sau thi (Công việc TVV / hồ sơ HV); ở đây chỉ xem.')}</p>
      </>} />
  );
  return (
    <>
      <VaoHangLoc o="phai">
        <NutXuat nhan={t('Xuất Excel')} tat={!rows.length} onClick={xuatExcel} />   {/* PT-GON (M3): số lượt ở chip đầu bảng */}
      </VaoHangLoc>
      <div className="space-y-3">
        {tg && (
          <DaiChiSo ds={[
            { ten: t('Lượt thi'), ky: t('trong kỳ'), gt: soThe(query, 'luot', tg.luot, t('Lượt thi')), mau: t('{n} HV', { n: tg.hv }) },
            { ten: t('Đạt Target'), gt: soThe(query, 'dat', tg.dat, t('Đạt Target')), nho: phanTram(tg.dat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đạt'), gt: soThe(query, 'chua-dat', tg.chuaDat, `${t('Chưa đạt')} · ${t('Thi thật')}`), nho: phanTram(tg.chuaDat, tg.dat + tg.chuaDat) },
            { ten: t('Bước tiếp chưa chọn'), gt: soThe(query, 'chua-chon', tg.chuaChon, t('Bước tiếp chưa chọn')) },   // PT-GON (M4): nơi chọn ở ⓘ đầu bảng
          ]} />
        )}
        <VungBang dau={dauThe} error={error} reload={reload} loading={loading || !data} pt={pt.thanh}
          rong={!rows.length ? <RongDau chu={t('Chưa có kết quả thi thật nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} nut={<NutXemToanBo />} /> : null}
          the={hien.map((r) => (
            <div key={r.cycleId} className={THE_HV} style={nenThe}>
              <div className="flex items-center gap-2">
                <Link to={`/hoc-vien/${r.studentId}`} className={`min-w-0 truncate text-[15px] font-semibold ${LINK_CHU}`}>{r.ten}</Link>
                <span className="ml-auto shrink-0">{datTarget(r)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-dim">
                <span>{oLop(r.lop, r.classId)} · {ngay(r.ngayThi, homNay)}</span>
                <span className="tabular-nums">OVR <b className="text-[color:var(--text)]">{fmtBand(r.ovr)}</b> · Target {r.target}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-sm font-medium tabular-nums">
                {(['L', 'R', 'W', 'S'] as const).map((k, i) => <span key={k}>{k} {fmtBand([r.l, r.r, r.w, r.s][i])}</span>)}
              </div>
              <div className="text-[13px] text-dim">{t('Bước tiếp')}: {buocTiep(r)}</div>
            </div>
          ))}
          bang={(
            <div className="table-scroll bang-dinh">
              {/* PT-GON (PTA quyết XM-1, M3): bỏ cột "Lớp" — hàng nhóm đã ghi lớp (Xuất Excel giữ cột Lớp). */}
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 990 }}>
                <colgroup>
                  <col style={{ width: 180 }} /><col style={{ width: 100 }} /><col style={{ width: 70 }} />
                  {[0, 1, 2, 3].map((i) => <col key={i} style={{ width: 62 }} />)}
                  <col style={{ width: 76 }} /><col style={{ width: 130 }} /><col />
                </colgroup>
                <thead><tr>
                  <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Ngày thi')}</th>
                  <th className="th text-center">OVR</th>
                  {['L', 'R', 'W', 'S'].map((k) => <th key={k} className="th text-center">{k}</th>)}
                  <th className="th text-center">Target</th>
                  <th className="th">{t('Đạt Target')}</th><th className="th">{t('Bước tiếp')}</th>
                </tr></thead>
                <tbody>
                  {nhom.map((lop) => {
                    const ds = hien.filter((r) => (r.lop ?? '') === lop);
                    const cuaLop = rows.filter((r) => (r.lop ?? '') === lop);
                    return (
                      <Fragment key={lop}>
                        <tr className="hang-lon"><td colSpan={10} className="px-3 py-1.5">
                          {/* Cột Lớp đã bỏ → mã lớp ở hàng nhóm là link hồ sơ lớp (giữ thao tác cũ của ô Lớp). */}
                          {lop && cuaLop[0]?.classId ? <Link to={`/hoc-vien/lop/${cuaLop[0].classId}`} className={LINK_CHU}>{lop}</Link> : lop || '—'} <span className="ml-1 text-[13px] font-normal text-dim">{t('{n} lượt · {hv} HV', { n: cuaLop.length, hv: new Set(cuaLop.map((r) => r.studentId)).size })}</span>
                        </td></tr>
                        {ds.map((r) => (
                          <tr key={r.cycleId} className="row-hover [&>td]:h-11">
                            <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className={`text-[15px] font-semibold ${LINK_CHU}`}>{r.ten}</Link></td>
                            <td className="td text-dim tabular-nums">{ngay(r.ngayThi, homNay)}</td>
                            <td className="td text-center font-medium tabular-nums">{fmtBand(r.ovr)}</td>
                            {[r.l, r.r, r.w, r.s].map((x, i) => <td key={i} className="td text-center tabular-nums">{fmtBand(x)}</td>)}
                            <td className="td text-center font-medium tabular-nums">{r.target}</td>
                            <td className="td">{datTarget(r)}</td>
                            <td className="td">{buocTiep(r)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )} />
      </div>
    </>
  );
}
