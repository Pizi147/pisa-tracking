import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useSession } from '../../lib/session.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { CHIP_SOS, ChipKy, lopSos } from '../../ui/Nhan.tsx';
import { kyChu, PhanTram, tuMau, tyLeGv } from './TongQuanV5.tsx';
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
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
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
          {data && <CongTacKhung trang="tong-quan" value={ct} dem={{ ft: data.soFt, thuong: data.soThuong }} donVi={t('lớp')} onChange={(k) => { daBam.current = true; setKhung(k === 'thuong' ? 'thuong' : 'ft'); }} />}
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

const COT_DAY: readonly CotBang[] = [
  /* Cột số kiểu `diem`: thẻ 375 xếp lưới nhãn · số (không mỗi số một dòng). `deu`: thẻ nửa bề rộng (~500 px ở 1440) — tổng 462 px (chủ nhiệm 504), phần dư chia đều mọi cột. */
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 150 }, { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chip', rong: 72 },
  { key: 'dat', nhan: t('Đạt kỳ vọng Test'), kieu: 'phan-tram', rong: 150, goiY: t('Lớp thường: Đạt Test (≥ ngưỡng đạt của lớp)') },
  { key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 76 }, { key: 'bai', nhan: t('Chờ chấm'), kieu: 'diem', rong: 84 },
];
const COT_CN: readonly CotBang[] = [
  /* R1-EN-2 (PTA #599): "Below expected" / "Exam this month" cần ~120 px — bớt Lớp / SOS / Case, tổng vẫn 500 px. */
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 108 }, { key: 'duoi', nhan: t('Dưới kỳ vọng'), kieu: 'diem', rong: 120, goiY: t('Lớp thường: HV chưa đạt') },
  { key: 'sos', nhan: t('SOS hiện tại'), kieu: 'diem', rong: 100 }, { key: 'case', nhan: 'Case', kieu: 'diem', rong: 52 }, { key: 'thi', nhan: t('Thi tháng này'), kieu: 'diem', rong: 120 },
];

/**
 * KỸ NĂNG TÔI DẠY · LỚP TÔI CHỦ NHIỆM — tầng trái Tổng quan GV (mockup `tong-quan.html?k=gv`). Một GET `/tong-quan/lop-toi-day/hai-khoi`, cả hai khung
 * (không công tắc FT / Thường — mỗi hàng ghi khung của lớp). Số giữ ô bấm V4 (`/tong-quan/lop-toi-day/o`); Đạt / Tiến bộ = ô bảng Học thuật hồ sơ GV
 * (`/giao-vien/:id/chi-so/o?cot=ket-qua-lop|tien-bo-lop:<lớp>`). Khối không có lớp thì không dựng; không lớp nào → một thẻ rỗng (trừ vai không dạy).
 * Lưới tự đặt cột Điều hướng (`phai`, 360): ≥ 1440 ba cột (dạy · chủ nhiệm · Điều hướng); 1100–1439 dạy | Điều hướng, chủ nhiệm trải cả hàng dưới; < 1100 một cột, Điều hướng trước.
 */
const LUOI_GV = 'grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px] min-[1440px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]';
const O_MOT = 'min-w-0 min-[1100px]:col-start-1 min-[1100px]:row-start-1 min-[1440px]:col-span-2';
export function HaiKhoiGv({ phai }: { phai: ReactNode }) {
  const { session } = useSession();
  const id = session?.user?.id;
  const { data, error, reload } = useApi<HaiKhoi>('/tong-quan/lop-toi-day/hai-khoi', []);
  const cotPhai = <div className="flex min-w-0 flex-col gap-4 max-[1099px]:order-first min-[1100px]:col-start-2 min-[1100px]:row-start-1 min-[1440px]:col-start-3">{phai}</div>;
  const luoi = (trai: ReactNode) => <div data-hd="tq-lop-toi-day" className={LUOI_GV}>{trai}{cotPhai}</div>;
  if (error) return luoi(<div className={O_MOT}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>);
  if (!data) return luoi(<Card className={O_MOT} title={t('Kỹ năng tôi dạy')} bodyClass="p-4"><Skeleton rows={3} /></Card>);
  if (!data.day.length && !data.chuNhiem.length) {
    if (!session?.roles?.includes('teacher')) return luoi(null);   // Head tutor (góc nhìn GV, không dạy lớp): không thẻ rỗng
    return luoi(<Card className={O_MOT} title={t('Lớp của tôi')} bodyClass="p-0"><Empty title={t('Bạn chưa được phân công lớp nào đang mở')} hint={t('Khi QL phân công lớp, kỹ năng bạn dạy và lớp chủ nhiệm hiện ở đây.')} /></Card>);
  }
  const o = (khung: string, classId: number, cot: string, n: number, tieuDe: string, className?: string) => (
    <OSo giaTri={n} nguon={`/tong-quan/lop-toi-day/o?ct=${khung}&classId=${classId}&cot=${cot}`} tieuDe={tieuDe} className={className} />
  );
  const coTb = data.day.some((d) => d.khung === 'ft');
  const lopLink = (classId: number, code: string) => <Link to={`/hoc-vien/lop/${classId}`} className="ten-ho-so font-semibold">{code}</Link>;

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
      const ben = d.khung === 'ft' ? [d.route, d.testKeTiep] : [d.tuanHoc, d.testKeTiep];
      return <>{dich(ben.filter(Boolean).join(' · ')) || null}{d.testTuanNay && <> · {t('tuần này')}</>}</>;
    }
    if (c.key === 'dat') return tuMau(tyLeGv(d.ketQua ?? undefined), t('lượt'));
    if (c.key === 'tb') return d.khung === 'ft' ? tuMau(tyLeGv(d.tienBo ?? undefined), t('lượt')) : null;
    if (c.key === 'bai') return d.baiQuaHan > 0 ? <span className="font-semibold text-late">{t('quá hạn')}</span>
      : d.baiCho ? (d.hanCham ? t('hạn {ngay}', { ngay: `${d.hanCham.slice(8, 10)}/${d.hanCham.slice(5, 7)}` }) : t('bài')) : null;
    return null;
  };
  const oCn = (l: DongCn, c: CotBang): ReactNode => {
    if (c.key === 'lop') return lopLink(l.classId, l.code);
    const nhanDuoi = l.khung === 'thuong' ? t('học viên chưa đạt') : t('học viên dưới kỳ vọng');
    if (c.key === 'duoi') return o(l.khung, l.classId, 'duoiKyVong', l.duoiKyVong, `${l.code} · ${nhanDuoi}`);
    if (c.key === 'sos') {
      if (!l.sosMuc) return <span className="text-slate-500">—</span>;
      if (!l.sosMuc.some((n) => n > 0)) return <span className="tabular-nums text-slate-500">0</span>;
      /* Mockup "SOS 2 · 1": chip mức + số HV ngoài chip (như Lớp cần chú ý QL) — bấm số → em của mức đó. */
      return (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {l.sosMuc.map((n, i) => n > 0 && (
            <span key={i} className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className={`${CHIP_SOS} ${lopSos(i + 1)}`}>SOS {i + 1}</span>{o(l.khung, l.classId, `sos${i + 1}`, n, `${l.code} · SOS ${i + 1}`)}
            </span>
          ))}
        </span>
      );
    }
    if (c.key === 'case') return o(l.khung, l.classId, 'caseMo', l.caseMo, `${l.code} · ${t('Case đang mở')}`);
    return o(l.khung, l.classId, 'thi-thang-nay', l.thiThangNay, `${l.code} · ${t('HV thi tháng này')}`);
  };
  const phuCn = (l: DongCn, c: CotBang): ReactNode => (c.key === 'lop' ? [t('{n} HV', { n: l.hocVien }), l.khung === 'ft' ? l.route : null].filter(Boolean).join(' · ') : null);

  const hai = data.day.length > 0 && data.chuNhiem.length > 0;
  return luoi(
    <>
      {data.day.length > 0 && (
        <Card className={hai ? 'min-w-0 min-[1100px]:col-start-1 min-[1100px]:row-start-1' : O_MOT} bodyClass="p-0" title={<>{t('Kỹ năng tôi dạy')}{data.ky && <span className="font-normal text-slate-500"> · {kyChu(data.ky)}</span>} <NutLuat label={t('Kỹ năng tôi dạy')}>{t('Chỉ bài của tôi. Đạt = lượt Test có Overall đạt kỳ vọng, hoặc Overall chưa đạt nhưng kỹ năng của tôi không dưới kỳ vọng; lớp thường: đạt ngưỡng của lớp.')}</NutLuat></>}>
          <Bang ten={t('Kỹ năng tôi dạy')} cot={coTb ? COT_DAY : COT_DAY.filter((c) => c.key !== 'tb')} hang={data.day} khoa={(d) => d.classId} oCua={oDay} phuCua={phuDay} khung={false} deu />
        </Card>
      )}
      {data.chuNhiem.length > 0 && (
        <Card className={hai ? 'min-w-0 min-[1100px]:col-span-2 min-[1440px]:col-span-1 min-[1440px]:col-start-2 min-[1440px]:row-start-1' : O_MOT} bodyClass="p-0" title={<>{t('Lớp tôi chủ nhiệm')} <span className="font-normal text-slate-500">· {t('{n} lớp', { n: data.chuNhiem.length })} · {t('hiện tại')}</span> <NutLuat label={t('Lớp tôi chủ nhiệm')}>{t('Số chủ nhiệm tách riêng, không cộng vào việc kỹ năng.')}</NutLuat></>}>
          <Bang ten={t('Lớp tôi chủ nhiệm')} cot={data.chuNhiem.some((l) => l.khung === 'ft') ? COT_CN : COT_CN.filter((c) => c.key !== 'sos')} hang={data.chuNhiem} khoa={(l) => l.classId} oCua={oCn} phuCua={phuCn} khung={false} deu />
        </Card>
      )}
    </>,
  );
}
