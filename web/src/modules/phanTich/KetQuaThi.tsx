import { Fragment, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { CHIP_SOS, NhanKq, lopSos } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang, type ThanhPhanTrang } from '../../ui/PhanTrang.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { DOAN, DaiChiSo, DauThe, OChon, VaoHangLoc, doanNut, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { duongDotTest } from '@shared/domain/index.ts';
import {
  KN_THI, LOAI_THI, NHAN_KET_QUA_MOCK, NHAN_KN_THI, NHAN_LOAI_THI, XEP_MOCK, ngay, nhanKhoang, tuanLich,
  type DongMock, type DongThiThat, type KetQuaMock, type KetQuaMockKq, type KetQuaThiThatKq, type LoaiThi, type XepMock,
} from '@shared/domain/index.ts';

/**
 * KẾT QUẢ TEST (OV-15e, C27; V8-PT mockup `thiet-ke/v8/phan-tich.html` khung A3 · A4 · C2) — Mock Test / Thi thật là ô đoạn ĐẦU hàng lọc chung,
 * đếm theo LƯỢT. Mỗi bên: thẻ chỉ số (cùng `tong` của máy chủ với bảng) → thẻ bảng có tiêu đề + ⓘ Cách tính → phân trang chỉ dưới.
 * Mock: Xếp theo (Lớp / Mức SOS) + Mọi kết quả ▾ ở hàng lọc; L · R · W · S ✓ / ✗ so kỳ vọng của đợt; cột "Xử lý" = trạng thái Case + dòng phụ
 * "tiếp: …" chữ thường (G8 — báo cáo không là việc). "MT · tuần" vẫn mở hồ sơ MT, trạng thái Case vẫn mở Case — dáng chữ thường, rê mới gạch.
 * Thi thật: nhóm theo lớp; Bước tiếp CHỈ ĐỌC (UI-PHAN-TICH, C16 — chọn ở tuyến Sau thi: Công việc TVV / hồ sơ HV).
 */
const ALL = 'tat-ca' as const;
type LocKq = KetQuaMock | typeof ALL;

/** Số 0 xám chữ thường (mockup `.oso-0`). */
const so0 = (n: number) => (n ? n : <span className="font-medium text-faint">0</span>);
/** "29 %" trên lượt có kết quả (Chưa đủ điểm không vào tỷ lệ — `shared/domain/ketQuaThi.ts`). */
const phanTram = (a: number, b: number) => (b > 0 ? `${Math.round((a * 100) / b)} %` : undefined);
/** Chữ thường mở hồ sơ (MT · tuần, trạng thái Case): không xanh như link, rê mới xanh + gạch (cùng luật `.ten-ho-so`). */
const LINK_THUONG = 'text-inherit no-underline hover:text-[color:var(--accent)] hover:underline hover:underline-offset-2';
/** Thẻ một lượt ở 375 (`.the-hv` của mockup C2). */
const THE_HV = 'grid gap-1 rounded-xl border px-3 py-2.5';
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
  dau: ReactNode; error: { message: string; hint?: string } | null | undefined; reload: () => void; loading: boolean; rong: ReactNode | null;
  pt: ThanhPhanTrang; bang: ReactNode; the: ReactNode;
}) {
  const dienThoai = useDienThoai();
  if (error) return <Card bodyClass="p-0">{dau}<div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div></Card>;
  if (loading) return <Card bodyClass="p-0">{dau}<div className="p-4"><Skeleton rows={8} /></div></Card>;
  if (rong) return <Card bodyClass="p-0">{dau}<div className="p-4">{rong}</div></Card>;
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

  /* Ô kỹ năng (mockup `.d`): ✓ / ✗ đứng trước, tô cả số theo kết quả (`lopKq` — một chỗ); "chưa có" chữ mờ 13. */
  const knO = (r: DongMock, k: (typeof KN_THI)[number]) => {
    const x = r.kn[k];
    if (x.band === null) return <span className="whitespace-nowrap text-[13px] font-normal text-faint">{t('chưa có')}</span>;
    const kq = x.dat === false ? 'duoi' : r.kyVong !== null && x.band > r.kyVong ? 'vuot' : 'bang';
    return <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${x.dat !== null ? lopKq(kq) : ''}`}>{x.dat !== null && <DauKetQua kq={kq} />}{x.band.toFixed(1)}</span>;
  };
  const ketQua = (r: DongMock) => <NhanKq kq={r.ketQua === 'chua-du' ? 'thieu' : r.ketQua}>{NHAN_KET_QUA_MOCK[r.ketQua]}</NhanKq>;
  const sos = (r: DongMock) => (r.sos ? <ChipSos muc={r.sos} tam={r.sosTam} dot={`MT${r.mt}`} ten={r.ten} hienKyNang={false} /> : <span className="text-faint">—</span>);
  const mt = (r: DongMock) => <Link to={duongDotTest({ id: r.attemptId, kind: 'mock' })} className={`whitespace-nowrap tabular-nums ${LINK_THUONG}`}>MT{r.mt} · {tuanLich(r.tuan, homNay)}</Link>;
  /* Cột "Xử lý" (gộp Case / PA + Việc tiếp cũ): trạng thái Case (mở Case) + dòng phụ "tiếp: việc · người" chữ thường, không link, không quá hạn. */
  const trangThai = (r: DongMock) => (r.casePa
    ? (r.caseId ? <Link to={`/hoc-thuat/case/${r.caseId}`} className={LINK_THUONG}>{dich(r.casePa)}</Link> : <span>{dich(r.casePa)}</span>)
    : null);
  const tiep = (r: DongMock) => (r.viecTiep ? t('tiếp: {viec}', { viec: dich(r.viecTiep) }) : null);
  const xuLy = (r: DongMock) => (r.casePa || r.viecTiep
    ? <>{trangThai(r)}{r.viecTiep && <span className="mt-px block text-xs text-faint">{tiep(r)}</span>}</>
    : <span className="text-faint">—</span>);

  const tg = data?.tong;
  const soSos = tg ? tg.sos1 + tg.sos2 + tg.sos3 : 0;
  const chipSos = (m: 1 | 2 | 3, n: number) => (
    <span key={m} className={`${CHIP_SOS} ${n ? lopSos(m) : 'border border-[color:var(--line)] text-faint'}`}>SOS {m} · {n}</span>
  );
  const dauThe = (
    <DauThe ten={t('Lượt Mock Test')} dem={t('{n} lượt', { n: rows.length })}
      phu={xep === 'sos' ? t('xếp theo mức SOS → lớp → tên') : t('xếp theo lớp → tên')}
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
        <button type="button" className="btn h-9" disabled={!rows.length} onClick={xuatExcel}>⤓ {t('Xuất Excel · {n} lượt', { n: rows.length })}</button>
      </VaoHangLoc>
      <div className="space-y-3">
        {tg && (
          /* G7: cùng `tong` máy chủ với bảng (trước là dòng chữ 12 px đầu bảng). Số không bấm — chưa có đường danh sách cho thẻ (không thêm API). */
          <DaiChiSo ds={[
            { ten: t('Lượt'), ky: t('trong kỳ'), gt: so0(tg.luot), mau: t('{n} HV', { n: tg.hv }) },
            { ten: t('Đạt'), gt: so0(tg.dat), nho: phanTram(tg.dat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đạt'), gt: so0(tg.chuaDat), nho: phanTram(tg.chuaDat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đủ điểm'), gt: so0(tg.chuaDu), mau: t('không vào tỷ lệ') },
            {
              ten: 'SOS', rong2: true,
              gt: <span className="mt-1.5 flex flex-wrap gap-1.5">{chipSos(3, tg.sos3)}{chipSos(2, tg.sos2)}{chipSos(1, tg.sos1)}</span>,
              mau: <>{t('{n} lượt', { n: soSos })}{tg.sosTam ? ` · ${t('{n} tạm', { n: tg.sosTam })}` : ''}</>,
            },
          ]} />
        )}
        <VungBang dau={dauThe} error={error} reload={reload} loading={loading || !data} pt={pt.thanh}
          rong={!rows.length ? <Empty title={t('Không có lượt Mock Test nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} hint={t('Thử khoảng thời gian dài hơn.')} /> : null}
          the={pt.cat(rows).map((r) => (
            <div key={r.attemptId} className={THE_HV} style={nenThe}>
              <div className="flex items-center gap-2">
                <Link to={`/hoc-vien/${r.studentId}`} className="ten-ho-so min-w-0 truncate">{r.ten}</Link>
                <span className="ml-auto flex shrink-0 items-center gap-1.5">{ketQua(r)}{r.sos ? sos(r) : null}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-dim">
                <span>{r.lop} · {mt(r)}</span>
                <span className="tabular-nums">OVR <b className="text-[color:var(--text)]">{fmtBand(r.ovr)}</b> · {t('KV')} {fmtBand(r.kyVong)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-sm font-medium">
                {KN_THI.map((k) => <span key={k} className="inline-flex items-center gap-1">{NHAN_KN_THI[k]} {knO(r, k)}</span>)}
              </div>
              {(r.casePa || r.viecTiep) && (
                <div className="text-[13px] text-dim">{trangThai(r)}{r.casePa && r.viecTiep ? ' · ' : ''}{tiep(r)}</div>
              )}
            </div>
          ))}
          bang={(
            <div className="table-scroll bang-dinh">   {/* P3 UI-CHUNG: danh sách cả chi nhánh dài — đầu cột dính (1180 px vừa khung từ 1280) */}
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 1180 }}>
                <colgroup>
                  <col style={{ width: 170 }} /><col style={{ width: 104 }} /><col style={{ width: 126 }} /><col style={{ width: 64 }} />
                  {KN_THI.map((k) => <col key={k} style={{ width: 68 }} />)}
                  <col style={{ width: 76 }} /><col style={{ width: 136 }} /><col style={{ width: 96 }} /><col />
                </colgroup>
                <thead><tr>
                  <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Lớp')}</th><th className="th">{t('MT · tuần')}</th>
                  <th className="th text-center">OVR</th>
                  {KN_THI.map((k) => <th key={k} className="th text-center">{NHAN_KN_THI[k]}</th>)}
                  <th className="th text-center">{t('Kỳ vọng')}</th>
                  <th className="th">{t('Kết quả')}</th><th className="th">SOS</th><th className="th">{t('Xử lý')}</th>
                </tr></thead>
                <tbody>
                  {pt.cat(rows).map((r) => (
                    <tr key={r.attemptId} className="row-hover">
                      <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className="ten-ho-so">{r.ten}</Link></td>
                      <td className="td text-dim">{r.lop}</td>
                      <td className="td text-dim">{mt(r)}</td>
                      <td className="td text-center font-bold tabular-nums">{r.ovr === null ? <span className="font-normal text-faint">—</span> : fmtBand(r.ovr)}</td>
                      {KN_THI.map((k) => <td key={k} className="td text-center">{knO(r, k)}</td>)}
                      <td className="td text-center font-bold tabular-nums">{fmtBand(r.kyVong)}</td>
                      <td className="td">{ketQua(r)}</td>
                      <td className="td">{sos(r)}</td>
                      <td className="td whitespace-normal leading-snug">{xuLy(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} />
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Thi thật

function BangThiThat({ pv }: { pv: PhamViPhanTich }) {
  const { homNay } = useNgayNghiepVu();
  const query = thamSoLoc(pv, { loai: 'thi-that' });
  const { data, loading, error, reload } = useApi<KetQuaThiThatKq>(`/phan-tich/ket-qua-thi?${query}`, [query]);
  const rows = data?.rows ?? [];
  const pt = usePhanTrang(rows.length, query, 'lượt');

  async function xuatExcel() {
    if (!data) return;
    const XLSX = await import('xlsx');
    const aoa: (string | number)[][] = [
      [`Kết quả Test · Thi thật · ${nhanKhoang(pv.khoang).chinh} · dữ liệu đến ${ngay(homNay)}`], [],
      ['Học viên', 'Lớp', 'Ngày thi', 'OVR', 'L', 'R', 'W', 'S', 'Target', 'Đạt Target', 'Bước tiếp', 'Người chọn', 'Ngày chọn'],
      ...rows.map((r) => [r.ten, r.lop ?? '', r.khongThi ? 'Không thi' : ngay(r.ngayThi, homNay), fmtBand(r.ovr), fmtBand(r.l), fmtBand(r.r), fmtBand(r.w), fmtBand(r.s), r.target,
        r.dat === null ? '' : r.dat ? 'Đạt' : 'Chưa đạt', r.buocTiepChu ?? 'Chưa chọn', r.nguoiChon ?? '', r.ngayChon ? ngay(r.ngayChon, homNay) : '']),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Thi thật');
    XLSX.writeFile(wb, `ket-qua-thi-that-${ngay(homNay).split('/').join('-')}.xlsx`);
  }

  /* UI-PHAN-TICH (C16): Phân tích chỉ ĐỌC — Bước tiếp chọn ở tuyến Sau thi (Công việc TVV / hồ sơ HV); hàng chưa chọn có link sang hồ sơ. */
  const buocTiep = (r: DongThiThat) => (
    <span className={r.buocTiep ? '' : 'text-faint'}>
      {r.buocTiepChu ? dich(r.buocTiepChu) : t('Chưa chọn')}
      {!r.buocTiep && r.coTheChon && <> · <Link to={`/hoc-vien/${r.studentId}`} className="link">{t('Hồ sơ HV ›')}</Link></>}
      {r.buocTiepPhu && <span className="block text-xs text-faint">{r.buocTiepPhu}</span>}
    </span>
  );
  const datTarget = (r: DongThiThat) => (r.khongThi ? <span className="text-xs text-muted">{t('Không thi')}</span>
    : r.dat === null ? <span className="text-faint">—</span>
    : <NhanKq kq={r.dat ? 'dat' : 'chua-dat'}>{r.dat ? t('Đạt') : t('Chưa đạt')}</NhanKq>);
  const nguoi = (r: DongThiThat) => (r.nguoiChon ? <span className="text-[13px]">{r.nguoiChon}<span className="block text-xs text-faint tabular-nums">{ngay(r.ngayChon, homNay)}</span></span> : <span className="text-faint">—</span>);

  const hien = pt.cat(rows);
  const nhom = [...new Set(hien.map((r) => r.lop ?? ''))];
  const tg = data?.tong;
  const dauThe = (
    <DauThe ten={t('Kết quả thi thật')} dem={t('{n} lượt', { n: rows.length })} phu={t('theo lớp → ngày thi')}
      cachTinh={<>
        <p className="m-0">{t('Đạt Target: OVR ≥ Target, tính lúc nhập kết quả.')}</p>
        <p className="m-0 mt-1">{t('Bước tiếp chọn ở Sau thi (Công việc TVV / hồ sơ HV); ở đây chỉ xem.')}</p>
      </>} />
  );
  return (
    <>
      <VaoHangLoc o="phai">
        <button type="button" className="btn h-9" disabled={!rows.length} onClick={xuatExcel}>⤓ {t('Xuất Excel · {n} lượt', { n: rows.length })}</button>
      </VaoHangLoc>
      <div className="space-y-3">
        {tg && (
          <DaiChiSo ds={[
            { ten: t('Lượt thi'), ky: t('trong kỳ'), gt: so0(tg.luot), mau: t('{n} HV', { n: tg.hv }) },
            { ten: t('Đạt Target'), gt: so0(tg.dat), nho: phanTram(tg.dat, tg.dat + tg.chuaDat) },
            { ten: t('Chưa đạt'), gt: so0(tg.chuaDat), nho: phanTram(tg.chuaDat, tg.dat + tg.chuaDat) },
            { ten: t('Bước tiếp chưa chọn'), gt: so0(tg.chuaChon), mau: t('chọn ở Sau thi (TVV)') },
          ]} />
        )}
        <VungBang dau={dauThe} error={error} reload={reload} loading={loading || !data} pt={pt.thanh}
          rong={!rows.length ? <Empty title={t('Chưa có kết quả thi thật nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh })} hint={t('Kết quả thi thật nhập ở hồ sơ học viên; thử khoảng thời gian dài hơn.')} /> : null}
          the={hien.map((r) => (
            <div key={r.cycleId} className={THE_HV} style={nenThe}>
              <div className="flex items-center gap-2">
                <Link to={`/hoc-vien/${r.studentId}`} className="ten-ho-so min-w-0 truncate">{r.ten}</Link>
                <span className="ml-auto shrink-0">{datTarget(r)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-dim">
                <span>{r.lop ?? '—'} · {ngay(r.ngayThi, homNay)}</span>
                <span className="tabular-nums">OVR <b className="text-[color:var(--text)]">{fmtBand(r.ovr)}</b> · Target {r.target}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-sm font-medium tabular-nums">
                {(['L', 'R', 'W', 'S'] as const).map((k, i) => <span key={k}>{k} {fmtBand([r.l, r.r, r.w, r.s][i])}</span>)}
              </div>
              <div className="text-[13px] text-dim">{t('Bước tiếp')}: {buocTiep(r)}{r.nguoiChon ? ` · ${r.nguoiChon}` : ''}</div>
            </div>
          ))}
          bang={(
            <div className="table-scroll bang-dinh">
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 1100 }}>
                <colgroup>
                  <col style={{ width: 180 }} /><col style={{ width: 110 }} /><col style={{ width: 100 }} /><col style={{ width: 70 }} />
                  {[0, 1, 2, 3].map((i) => <col key={i} style={{ width: 62 }} />)}
                  <col style={{ width: 76 }} /><col style={{ width: 130 }} /><col /><col style={{ width: 170 }} />
                </colgroup>
                <thead><tr>
                  <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Lớp')}</th><th className="th">{t('Ngày thi')}</th>
                  <th className="th text-center">OVR</th>
                  {['L', 'R', 'W', 'S'].map((k) => <th key={k} className="th text-center">{k}</th>)}
                  <th className="th text-center">Target</th>
                  <th className="th">{t('Đạt Target')}</th><th className="th">{t('Bước tiếp')}</th><th className="th">{t('Người chọn')}</th>
                </tr></thead>
                <tbody>
                  {nhom.map((lop) => {
                    const ds = hien.filter((r) => (r.lop ?? '') === lop);
                    const cuaLop = rows.filter((r) => (r.lop ?? '') === lop);
                    return (
                      <Fragment key={lop}>
                        <tr className="hang-lon"><td colSpan={12} className="px-3 py-1.5">
                          {lop || '—'} <span className="ml-1 text-[13px] font-normal text-dim">{t('{n} lượt · {hv} HV', { n: cuaLop.length, hv: new Set(cuaLop.map((r) => r.studentId)).size })}</span>
                        </td></tr>
                        {ds.map((r) => (
                          <tr key={r.cycleId} className="row-hover">
                            <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className="ten-ho-so">{r.ten}</Link></td>
                            <td className="td text-dim">{r.lop}</td>
                            <td className="td text-dim tabular-nums">{ngay(r.ngayThi, homNay)}</td>
                            <td className="td text-center font-bold tabular-nums">{fmtBand(r.ovr)}</td>
                            {[r.l, r.r, r.w, r.s].map((x, i) => <td key={i} className="td text-center tabular-nums">{fmtBand(x)}</td>)}
                            <td className="td text-center font-bold tabular-nums">{r.target}</td>
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
          )} />
      </div>
    </>
  );
}
