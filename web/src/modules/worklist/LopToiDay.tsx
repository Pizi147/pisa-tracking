import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useSession } from '../../lib/session.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ChipKy } from '../../ui/Nhan.tsx';
import { PhanTram, SosDem, tuMau, tyLeGv } from './TongQuanV5.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { type OPtGv } from '@shared/domain/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { dich, t } from '@shared/i18n/index.ts';

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
  /* AUDIT-UI B1: bảng rộng hết trang — cột chia đều như mockup (`deu`: Lớp 210 · mỗi cột còn lại 150, phần dư theo tỉ lệ). */
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 210 }, { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chip', rong: 150 },
  { key: 'dat', nhan: t('Đạt kỳ vọng Test'), dv: t('lượt'), kieu: 'phan-tram', rong: 150, goiY: t('Lớp thường: Đạt Test (≥ ngưỡng đạt của lớp)') },
  { key: 'tb', nhan: t('Tiến bộ'), dv: t('lượt'), kieu: 'phan-tram', rong: 150 }, { key: 'bai', nhan: t('Chờ chấm'), dv: t('bài'), kieu: 'diem', rong: 150 },
];
const COT_CN: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', linhHoat: true }, { key: 'duoi', nhan: t('Dưới kỳ vọng'), dv: t('HV'), kieu: 'diem', rong: 160, goiY: t('Lớp thường: HV chưa đạt') },
  { key: 'sos', nhan: t('SOS hiện tại'), dv: t('HV'), kieu: 'chu', rong: 340 }, { key: 'case', nhan: 'Case', kieu: 'diem', rong: 100 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'diem', rong: 150 },
];

/**
 * KỸ NĂNG TÔI DẠY · LỚP TÔI CHỦ NHIỆM — tầng trái Tổng quan GV (mockup `tong-quan.html?k=gv`). Một GET `/tong-quan/lop-toi-day/hai-khoi`, cả hai khung
 * (không công tắc FT / Thường — mỗi hàng ghi khung của lớp). Số giữ ô bấm V4 (`/tong-quan/lop-toi-day/o`); Đạt / Tiến bộ = ô bảng Học thuật hồ sơ GV
 * (`/giao-vien/:id/chi-so/o?cot=ket-qua-lop|tien-bo-lop:<lớp>`). Khối không có lớp thì không dựng; không lớp nào → một thẻ rỗng (trừ vai không dạy).
 * AUDIT-UI B1 (chủ SP 08/11): bỏ cột "Điều hướng" — hai bảng xếp chồng rộng hết trang ("Hồ sơ GV của tôi" lên cạnh tiêu đề trang).
 */
const O_MOT = 'min-w-0';
export function HaiKhoiGv() {
  const { session } = useSession();
  const id = session?.user?.id;
  const dienThoai = useDienThoai();
  const { data, error, reload } = useApi<HaiKhoi>('/tong-quan/lop-toi-day/hai-khoi', []);
  const luoi = (trai: ReactNode) => <div data-hd="tq-lop-toi-day" className="flex min-w-0 flex-col gap-4">{trai}</div>;
  if (error) return luoi(<div className={O_MOT}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>);
  if (!data) return luoi(<Card className={O_MOT} title={t('Kỹ năng tôi dạy')} bodyClass="p-4"><Skeleton rows={3} /></Card>);
  /* B' 12c (chủ SP 10/11): lớp chủ nhiệm 0 HV, mọi số 0 (lớp chỉ còn bài nợ điểm) — không hiện hàng toàn 0. Chỉ lọc hiển thị, số máy chủ giữ nguyên. */
  const chuNhiem = data.chuNhiem.filter((l) => l.hocVien > 0 || l.duoiKyVong > 0 || l.caseMo > 0 || l.thiThangNay > 0 || !!l.sosMuc?.some((n) => n > 0));
  if (!data.day.length && !chuNhiem.length) {
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
    return d.baiQuaHan > 0 ? <span className="whitespace-nowrap font-semibold text-late">{o(d.khung, d.classId, 'bai-qua-han', d.baiQuaHan, `${d.code} · ${t('bài quá hạn chưa nhập điểm')}`, 'font-semibold text-late')}</span>
      : o(d.khung, d.classId, 'bai-cho', d.baiCho, `${d.code} · ${t('bài chờ chấm')}`, 'font-semibold');
  };
  const phuDay = (d: DongDay, c: CotBang): ReactNode => {
    if (c.key === 'lop') {
      /* TQ-GON (M3): không thêm "tuần này" sau mã tuần — mã tuần Test đã ghi, tuần hiện tại ở đầu trang. */
      const ben = d.khung === 'ft' ? [d.route, d.testKeTiep] : [d.tuanHoc, d.testKeTiep];
      return dich(ben.filter(Boolean).join(' · ')) || null;   // chuỗi → Bang gắn title
    }
    /* AUDIT-UI B1 (V13): đơn vị ở tiêu đề cột ("· lượt", "· bài") — dòng phụ chỉ mẫu "11/14", "quá hạn", "hạn 23/09". */
    if (c.key === 'dat') return tuMau(tyLeGv(d.ketQua ?? undefined));
    if (c.key === 'tb') return d.khung === 'ft' ? tuMau(tyLeGv(d.tienBo ?? undefined)) : null;
    if (c.key === 'bai') return d.baiQuaHan > 0 ? t('quá hạn')
      : d.baiCho && d.hanCham ? t('hạn {ngay}', { ngay: `${d.hanCham.slice(8, 10)}/${d.hanCham.slice(5, 7)}` }) : null;
    return null;
  };
  /* AUDIT-UI B1 (mockup 375 `.card-tk`): thẻ gọn — tên lớp + chip kỹ năng; một hàng "Đạt KV · Tiến bộ · Chờ chấm", số giữ ô bấm. */
  const theDay = (d: DongDay) => {
    const cot = (k: string) => COT_DAY.find((c) => c.key === k)!;
    return (
      <div className="grid gap-1.5">
        <span className="flex min-w-0 items-baseline gap-2 text-[15px]">{oDay(d, cot('lop'))}{oDay(d, cot('ky'))}</span>
        <span className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px] text-slate-400">
          <span className="inline-flex items-baseline gap-1">{t('Đạt KV')} <b className="text-[15px]">{oDay(d, cot('dat'))}</b></span>
          {d.khung === 'ft' && <span className="inline-flex items-baseline gap-1">{t('Tiến bộ')} <b className="text-[15px]">{oDay(d, cot('tb'))}</b></span>}
          <span className="inline-flex items-baseline gap-1">{t('Chờ chấm')} <b className="text-[15px]">{oDay(d, cot('bai'))}</b></span>
        </span>
      </div>
    );
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
    /* AUDIT-UI B1: đơn vị ở tiêu đề cột ("Dưới kỳ vọng · HV", "Thi tháng này · HV"), ô chỉ còn số. */
    : null);

  return luoi(
    <>
      {data.day.length > 0 && (
        <Card className={O_MOT} bodyClass="p-0" title={<span className="inline-flex flex-wrap items-center gap-x-1">{t('Kỹ năng tôi dạy')} <NutLuat label={t('Kỹ năng tôi dạy')}>{t('Chỉ bài của tôi. Đạt = lượt Test có Overall đạt kỳ vọng, hoặc Overall chưa đạt nhưng kỹ năng của tôi không dưới kỳ vọng; lớp thường: đạt ngưỡng của lớp.')}</NutLuat></span>}>
          <Bang ten={t('Kỹ năng tôi dạy')} cot={coTb ? COT_DAY : COT_DAY.filter((c) => c.key !== 'tb')} hang={data.day} khoa={(d) => d.classId} oCua={oDay} phuCua={phuDay} khung={false} theLuoi deu theRieng={theDay} />
        </Card>
      )}
      {chuNhiem.length > 0 && (
        <Card className={O_MOT} bodyClass="p-0" title={<span className="inline-flex flex-wrap items-center gap-x-1">{t('Lớp tôi chủ nhiệm')} <NutLuat label={t('Lớp tôi chủ nhiệm')}>{t('Số chủ nhiệm tách riêng, không cộng vào việc kỹ năng.')}</NutLuat></span>}>
          <Bang ten={t('Lớp tôi chủ nhiệm')} cot={chuNhiem.some((l) => l.khung === 'ft') ? COT_CN : COT_CN.filter((c) => c.key !== 'sos')} hang={chuNhiem} khoa={(l) => l.classId} oCua={oCn} phuCua={phuCn} khung={false} theLuoi />
        </Card>
      )}
    </>,
  );
}
