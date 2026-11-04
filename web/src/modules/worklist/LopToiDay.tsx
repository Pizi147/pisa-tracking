import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useSession } from '../../lib/session.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipKy } from '../../ui/Nhan.tsx';
import { PhanTram, SosDem, tuMau, tyLeGv } from './TongQuanV5.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { GOI_Y_DUOI_KY_VONG, khungLopToiDay, type OPtGv } from '@shared/domain/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * LỚP TÔI DẠY — tầng 3 của Tổng quan giáo viên (PR-VAI-a Q12, mockup 23 màn A/C; thay "Học viên cần hỗ trợ"). Tách hẳn hai khung: FT có SOS,
 * không cột tuần khoá; lớp thường có "tuần n/y", không SOS. Dạy một khung → ẩn công tắc; dạy cả hai → mặc định Fast Track. Mỗi số bấm ra
 * danh sách em qua `/tong-quan/lop-toi-day/o` (cùng hàm tính). "Bài chờ chấm / quá hạn" đếm BÀI ở máy chủ (cùng hàm hồ sơ GV), bấm ra đúng các bài đó.
 * Điện thoại: mỗi lớp một thẻ ba số.
 */
type Hang = {
  classId: number; code: string; route: string | null; ct: string | null; toiDay: string; tuanHoc: string | null; hocVien: number;
  duoiKyVong: number; sos: number | null; caseMo: number; baiCho: number; baiQuaHan: number; testKeTiep: string | null; testTuanNay: boolean;
};
type Data = { ct: 'ft' | 'thuong'; coFt: boolean; coThuong: boolean; soFt: number; soThuong: number; rows: Hang[] };

export function LopToiDay() {
  const dienThoai = useDienThoai();
  const [khung, setKhung] = useState<'ft' | 'thuong' | null>(() => {
    const k = khungDaNho('tong-quan');
    return k === 'ft' || k === 'thuong' ? k : null;
  });
  const ct = khung ?? 'ft';
  const { data, loading, error, reload } = useApi<Data>(`/tong-quan/lop-toi-day?ct=${ct}`, [ct]);
  /* Q31-1 + D7: chưa chọn, hoặc khung đã nhớ không có lớp nào của mình → khung mặc định theo lớp mình dạy (chỉ lớp thường → Lớp thường). */
  /* UX-2 (5): công tắc hiện theo phạm vi — khung người xem VỪA BẤM giữ nguyên dù 0 lớp (ghi "· 0"), không bị ép về khung có lớp. */
  const daBam = useRef(false);
  useEffect(() => {
    if (data && !daBam.current && khungLopToiDay(khung, data.coFt, data.coThuong) !== ct) setKhung(khungLopToiDay(khung, data.coFt, data.coThuong));
  }, [data, khung, ct]);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (data && !data.coFt && !data.coThuong) return null;
  const so = (h: Hang, cot: 'duoiKyVong' | 'sos' | 'caseMo' | 'bai-cho' | 'bai-qua-han', n: number, ten: string, className = 'font-semibold') => (
    <OSo giaTri={n} nguon={`/tong-quan/lop-toi-day/o?ct=${ct}&classId=${h.classId}&cot=${cot}`} tieuDe={`${h.code} · ${ten}`} className={`${className} max-sm:relative max-sm:before:absolute max-sm:before:-inset-x-2 max-sm:before:-inset-y-3 max-sm:before:content-['']`} />
  );
  /**
   * D10: số BÀI (máy chủ) — có bài quá hạn thì hiện phần quá hạn (đỏ), không thì số bài chờ chấm; bấm ra đúng các bài đó. Bảng: "15 quá hạn"
   * một dòng; thẻ điện thoại (`gon`): số trên, nhãn "bài quá hạn / bài chờ chấm" dưới — luôn có nhãn, kể cả 0.
   */
  const baiCham = (h: Hang, gon = false) => {
    const qua = h.baiQuaHan > 0;
    const nhan = gon ? (qua ? t('bài quá hạn') : t('bài chờ chấm')) : (qua ? t('quá hạn') : t('chờ chấm'));
    if (!h.baiCho && !gon) return <span className="tabular-nums text-slate-500">0</span>;
    return (
      <>
        {qua ? so(h, 'bai-qua-han', h.baiQuaHan, t('bài quá hạn chưa nhập điểm'), `font-semibold text-late ${gon ? 'font-bold' : ''}`)
          : so(h, 'bai-cho', h.baiCho, t('bài chờ chấm'), `font-semibold ${gon ? 'font-bold' : ''}`)}
        <span className="text-xs text-slate-500">{gon ? nhan : ` ${nhan}`}</span>
      </>
    );
  };
  const laThuong = ct === 'thuong';
  const nhanDuoi = laThuong ? t('Chưa đạt') : t('Dưới kỳ vọng');

  return (
    <section className="card" aria-labelledby="lop-toi-day" data-hd="tq-lop-toi-day">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="lop-toi-day" className="m-0 text-sm font-semibold text-slate-200">{t('Lớp tôi dạy')}</h2>
          {/* G9: không nút trong tiêu đề bảng — "?" của cột Dưới kỳ vọng / Chưa đạt nằm cạnh tiêu đề thẻ. */}
          <NutLuat label={nhanDuoi}>{GOI_Y_DUOI_KY_VONG[ct]}</NutLuat>
          {data && <CongTacKhung trang="tong-quan" value={ct} dem={{ ft: data.soFt, thuong: data.soThuong }} onChange={(k) => { daBam.current = true; setKhung(k === 'thuong' ? 'thuong' : 'ft'); }} />}
        </div>
      </header>
      {loading || !data ? <div className="p-4"><Skeleton rows={3} /></div> : !data.rows.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">{t('Bạn không dạy lớp')}{' '}{laThuong ? t('thường') : 'Fast Track'}{' '}{t('nào đang mở.')}</p>
      ) : dienThoai ? (
        <div>
          {data.rows.map((h) => (
            <article key={h.classId} className="flex flex-col gap-2 border-t px-3.5 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
              <span className="flex items-baseline justify-between gap-2">
                <Link to={`/hoc-vien/lop/${h.classId}`} className="font-semibold text-slate-100 no-underline">{h.code}</Link>
                <span className="text-xs text-slate-500">{dich([h.toiDay, h.tuanHoc].filter(Boolean).join(' · '))}</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-lg">
                <div className="flex flex-col items-start">{so(h, 'duoiKyVong', h.duoiKyVong, nhanDuoi.toLowerCase())}<span className="text-xs text-slate-500">{nhanDuoi.toLowerCase()}</span></div>
                {laThuong
                  ? <div className="flex flex-col items-start">{so(h, 'caseMo', h.caseMo, t('Case đang mở'))}<span className="text-xs text-slate-500">{t('Case đang mở')}</span></div>
                  : <div className="flex flex-col items-start">{so(h, 'sos', h.sos ?? 0, 'SOS')}<span className="text-xs text-slate-500">SOS</span></div>}
                <div className="flex flex-col items-start">{baiCham(h, true)}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-scroll">   {/* CV-LOI (CV-10): bỏ `bang-dinh` — bảng trong thẻ 560 px cuộn ngang trong thẻ, không tràn ra ngoài */}
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-slate-400">
                <th className="px-4 py-2 font-semibold">{t('Lớp')}</th><th className="px-3 py-2 font-semibold">{t('Tôi dạy')}</th>
                {laThuong && <th className="px-3 py-2 font-semibold">{t('Tuần học')}</th>}
                <th className="px-3 py-2 text-right font-semibold">{t('Học viên')}</th><th className="px-3 py-2 text-right font-semibold">{nhanDuoi}</th>
                {!laThuong && <th className="px-3 py-2 text-right font-semibold">SOS</th>}
                <th className="px-3 py-2 text-right font-semibold">{t('Case đang mở')}</th><th className="px-3 py-2 text-right font-semibold">{t('Bài chờ chấm')}</th>
                <th className="px-4 py-2 font-semibold">{t('Test sắp tới')}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.rows.map((h) => (
                <tr key={h.classId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-2"><Link to={`/hoc-vien/lop/${h.classId}`} className="font-semibold text-slate-100 no-underline hover:underline">{h.code}</Link>
                    {(h.route || h.ct) && <span className="ml-1.5 text-xs text-slate-500">{laThuong ? h.ct : h.route}</span>}</td>
                  <td className="px-3 py-2 text-slate-300">{dich(h.toiDay)}</td>
                  {laThuong && <td className="px-3 py-2 text-slate-300">{h.tuanHoc ?? '—'}</td>}
                  <td className="px-3 py-2 text-right text-slate-300">{h.hocVien}</td>
                  <td className="px-3 py-2 text-right">{so(h, 'duoiKyVong', h.duoiKyVong, nhanDuoi.toLowerCase())}</td>
                  {!laThuong && <td className="px-3 py-2 text-right">{so(h, 'sos', h.sos ?? 0, t('học viên có SOS'))}</td>}
                  <td className="px-3 py-2 text-right">{so(h, 'caseMo', h.caseMo, t('Case đang mở'))}</td>
                  <td className="px-3 py-2 text-right">{baiCham(h)}</td>
                  <td className="px-4 py-2 text-slate-300">{h.testKeTiep ?? <span className="text-slate-500">{t('chưa có lịch')}</span>}
                    {h.testTuanNay && <span className="ml-1.5 text-xs text-slate-500">{t('tuần này')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ───────────── SV-TQ-GV (XM-5): Tổng quan GV hai khối ───────────── */

type DongDay = {
  classId: number; code: string; khung: 'ft' | 'thuong'; route: string | null; ct: string | null; kyNang: string[]; tuanHoc: string | null;
  testKeTiep: string | null; testTuanNay: boolean; baiCho: number; baiQuaHan: number; hanCham: string | null; ketQua: OPtGv | null; tienBo: OPtGv | null;
};
type DongCn = {
  classId: number; code: string; khung: 'ft' | 'thuong'; route: string | null; ct: string | null; hocVien: number;
  duoiKyVong: number; sos: number | null; sosMuc: [number, number, number] | null; caseMo: number; thiThangNay: number;
};
type HaiKhoi = { ky: { tu: string; den: string } | null; day: DongDay[]; chuNhiem: DongCn[] };

/*
 * V8-TQ (mockup v8 `tong-quan.html` khung C): hai bảng XẾP CHỒNG cột trái (~1010 px ở 1440) — cột Lớp linh hoạt (hết cắt "MB Pre FO…"), cột số rộng theo mockup.
 * TEN-CHI-SO: "Đạt kỳ vọng Test" ≥ 126 px; R1-EN-2 (PTA #599): "Below expected" / "Exam this month" ≥ 120 px — mockup cho 170 / 140 / 130, đủ chỗ chữ EN.
 * 375: thẻ lưới (`theLuoi`) — chip kỹ năng cạnh tên lớp, nhãn trên / số dưới; SOS (`chu`) hàng riêng dưới lưới.
 */
const COT_DAY: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten' }, { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chip', rong: 130 },
  { key: 'dat', nhan: t('Đạt kỳ vọng Test'), kieu: 'phan-tram', rong: 170, goiY: t('Lớp thường: Đạt Test (≥ ngưỡng đạt của lớp)') },
  { key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 120 }, { key: 'bai', nhan: t('Chờ chấm'), kieu: 'diem', rong: 130 },
];
const COT_CN: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', linhHoat: true }, { key: 'duoi', nhan: t('Dưới kỳ vọng'), kieu: 'diem', rong: 140, goiY: t('Lớp thường: HV chưa đạt') },
  { key: 'sos', nhan: t('SOS hiện tại'), kieu: 'chu', rong: 340 }, { key: 'case', nhan: 'Case', kieu: 'diem', rong: 100 }, { key: 'thi', nhan: t('Thi tháng này'), kieu: 'diem', rong: 130 },
];

/**
 * KỸ NĂNG TÔI DẠY · LỚP TÔI CHỦ NHIỆM — tầng trái Tổng quan GV (mockup `tong-quan.html?k=gv`). Một GET `/tong-quan/lop-toi-day/hai-khoi`, cả hai khung
 * (không công tắc FT / Thường — mỗi hàng ghi khung của lớp). Số giữ ô bấm V4 (`/tong-quan/lop-toi-day/o`); Đạt / Tiến bộ = ô bảng Học thuật hồ sơ GV
 * (`/giao-vien/:id/chi-so/o?cot=ket-qua-lop|tien-bo-lop:<lớp>`). Khối không có lớp thì không dựng; không lớp nào → một thẻ rỗng (trừ vai không dạy).
 * Lưới tự đặt cột Điều hướng (`phai`, 360): ≥ 1280 trái (dạy, chủ nhiệm xếp chồng) | Điều hướng; < 1280 một cột, Điều hướng trước.
 */
const LUOI_GV = 'grid items-start gap-4 min-[1280px]:grid-cols-[minmax(0,1fr)_360px]';
const O_MOT = 'min-w-0';
export function HaiKhoiGv({ phai }: { phai: ReactNode }) {
  const { session } = useSession();
  const id = session?.user?.id;
  const dienThoai = useDienThoai();
  const { data, error, reload } = useApi<HaiKhoi>('/tong-quan/lop-toi-day/hai-khoi', []);
  const cotPhai = <div className="flex min-w-0 flex-col gap-4 max-[1279px]:order-first">{phai}</div>;
  const luoi = (trai: ReactNode) => <div data-hd="tq-lop-toi-day" className={LUOI_GV}><div className="flex min-w-0 flex-col gap-4">{trai}</div>{cotPhai}</div>;
  if (error) return luoi(<div className={O_MOT}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>);
  if (!data) return luoi(<Card className={O_MOT} title={t('Kỹ năng tôi dạy')} bodyClass="p-4"><Skeleton rows={3} /></Card>);
  if (!data.day.length && !data.chuNhiem.length) {
    if (!session?.roles?.includes('teacher')) return luoi(null);   // Head tutor (góc nhìn GV, không dạy lớp): không thẻ rỗng
    return luoi(<Card className={O_MOT} title={t('Lớp của tôi')} bodyClass="p-0"><Empty title={t('Bạn chưa được phân công lớp nào đang mở')} hint={t('Khi QL phân công lớp, kỹ năng bạn dạy và lớp chủ nhiệm hiện ở đây.')} /></Card>);
  }
  const o = (khung: string, classId: number, cot: string, n: number, tieuDe: string, className?: string) => (
    <OSo giaTri={n} nguon={`/tong-quan/lop-toi-day/o?ct=${khung}&classId=${classId}&cot=${cot}`} tieuDe={tieuDe} className={className} />
  );
  const coTb = data.day.some((d) => d.khung === 'ft');
  /* V8: bảng cả bề rộng cột trái — mã lớp đủ chữ; vẫn cắt "…" + title khi hẹp bất thường (mẫu G4). */
  const lopLink = (classId: number, code: string) => <Link to={`/hoc-vien/lop/${classId}`} className="ten-ho-so inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom font-semibold" title={code}>{code}</Link>;

  const oDay = (d: DongDay, c: CotBang): ReactNode => {
    if (c.key === 'lop') return lopLink(d.classId, d.code);
    if (c.key === 'ky') return <span className="flex gap-1">{d.kyNang.map((k) => <ChipKy key={k} k={dich(k)} />)}</span>;
    if (c.key === 'dat') return <PhanTram gon x={tyLeGv(d.ketQua ?? undefined)} nguon={`/giao-vien/${id}/chi-so/o?cot=ket-qua-lop:${d.classId}`} tieuDe={`${d.khung === 'ft' ? t('Đạt kỳ vọng Test') : t('Đạt Test')} · ${d.code}`} />;
    if (c.key === 'tb') return d.khung === 'ft' ? <PhanTram gon x={tyLeGv(d.tienBo ?? undefined)} nguon={`/giao-vien/${id}/chi-so/o?cot=tien-bo-lop:${d.classId}`} tieuDe={`${t('Tiến bộ')} · ${d.code}`} /> : <span className="text-slate-500">—</span>;
    /* V4 (D10): có bài quá hạn thì hiện phần quá hạn (đỏ), không thì số bài chờ chấm — bấm ra đúng các bài đó. */
    return d.baiQuaHan > 0 ? <span className="whitespace-nowrap font-semibold text-late">⚠ {o(d.khung, d.classId, 'bai-qua-han', d.baiQuaHan, `${d.code} · ${t('bài quá hạn chưa nhập điểm')}`, 'font-semibold text-late')}</span>
      : o(d.khung, d.classId, 'bai-cho', d.baiCho, `${d.code} · ${t('bài chờ chấm')}`, 'font-semibold');
  };
  const phuDay = (d: DongDay, c: CotBang): ReactNode => {
    if (c.key === 'lop') {
      /* TQ-GON (M3): không thêm "tuần này" sau mã tuần — mã tuần Test đã ghi, tuần hiện tại ở đầu trang. */
      const ben = d.khung === 'ft' ? [d.route, d.testKeTiep] : [d.tuanHoc, d.testKeTiep];
      return dich(ben.filter(Boolean).join(' · ')) || null;   // chuỗi → Bang gắn title
    }
    if (c.key === 'dat') return tuMau(tyLeGv(d.ketQua ?? undefined), t('lượt'));
    if (c.key === 'tb') return d.khung === 'ft' ? tuMau(tyLeGv(d.tienBo ?? undefined), t('lượt')) : null;
    /* U09 #10 (V13, B07): đơn vị luôn ghi — "bài quá hạn" · "bài · hạn 23/09". */
    if (c.key === 'bai') return d.baiQuaHan > 0 ? t('bài quá hạn')
      : d.baiCho ? (d.hanCham ? t('bài · hạn {ngay}', { ngay: `${d.hanCham.slice(8, 10)}/${d.hanCham.slice(5, 7)}` }) : t('bài')) : null;
    return null;
  };
  const oCn = (l: DongCn, c: CotBang): ReactNode => {
    if (c.key === 'lop') return lopLink(l.classId, l.code);
    const nhanDuoi = l.khung === 'thuong' ? t('học viên chưa đạt') : t('học viên dưới kỳ vọng');
    if (c.key === 'duoi') return o(l.khung, l.classId, 'duoiKyVong', l.duoiKyVong, `${l.code} · ${nhanDuoi}`);
    if (c.key === 'sos') {
      /* TQ-GON (M4): lớp thường không có SOS — 375 bỏ cả hàng "SOS hiện tại" trống của thẻ (Bang bỏ hàng riêng khi ô null). */
      if (!l.sosMuc) return dienThoai ? null : <span className="text-slate-500">—</span>;
      if (!l.sosMuc.some((n) => n > 0)) return <span className="tabular-nums text-slate-500">0</span>;
      /* SOS một kiểu (như Lớp cần chú ý QL): chip mức + số HV ngoài chip — bấm số → em của mức đó. */
      return <SosDem muc={l.sosMuc} o={(i, n) => o(l.khung, l.classId, `sos${i + 1}`, n, `${l.code} · SOS ${i + 1}`)} />;
    }
    if (c.key === 'case') return o(l.khung, l.classId, 'caseMo', l.caseMo, `${l.code} · ${t('Case đang mở')}`);
    return o(l.khung, l.classId, 'thi-thang-nay', l.thiThangNay, `${l.code} · ${t('HV thi tháng này')}`);
  };
  const phuCn = (l: DongCn, c: CotBang): ReactNode => (c.key === 'lop' ? [t('{n} HV', { n: l.hocVien }), l.khung === 'ft' ? l.route : null].filter(Boolean).join(' · ')
    /* U09 #10: đơn vị dưới số khác 0 — "HV" (Dưới kỳ vọng · Thi tháng này). TQ-GON (M3): cột "Case" tiêu đề đã là đơn vị → không lặp. */
    : c.key === 'duoi' ? (l.duoiKyVong ? t('HV') : null) : c.key === 'thi' ? (l.thiThangNay ? t('HV') : null) : null);

  return luoi(
    <>
      {data.day.length > 0 && (
        <Card className={O_MOT} bodyClass="p-0" title={<span className="inline-flex flex-wrap items-center gap-x-1">{t('Kỹ năng tôi dạy')} <NutLuat label={t('Kỹ năng tôi dạy')}>{t('Chỉ bài của tôi. Đạt = lượt Test có Overall đạt kỳ vọng, hoặc Overall chưa đạt nhưng kỹ năng của tôi không dưới kỳ vọng; lớp thường: đạt ngưỡng của lớp.')}</NutLuat></span>}>
          <Bang ten={t('Kỹ năng tôi dạy')} cot={coTb ? COT_DAY : COT_DAY.filter((c) => c.key !== 'tb')} hang={data.day} khoa={(d) => d.classId} oCua={oDay} phuCua={phuDay} khung={false} theLuoi />
        </Card>
      )}
      {data.chuNhiem.length > 0 && (
        <Card className={O_MOT} bodyClass="p-0" title={<span className="inline-flex flex-wrap items-center gap-x-1">{t('Lớp tôi chủ nhiệm')} <NutLuat label={t('Lớp tôi chủ nhiệm')}>{t('Số chủ nhiệm tách riêng, không cộng vào việc kỹ năng.')}</NutLuat></span>}>
          <Bang ten={t('Lớp tôi chủ nhiệm')} cot={data.chuNhiem.some((l) => l.khung === 'ft') ? COT_CN : COT_CN.filter((c) => c.key !== 'sos')} hang={data.chuNhiem} khoa={(l) => l.classId} oCua={oCn} phuCua={phuCn} khung={false} theLuoi />
        </Card>
      )}
    </>,
  );
}
