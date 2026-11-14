import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { DemDau, SosDem } from './TongQuanV5.tsx';
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
export type HaiKhoi = { ky: { tu: string; den: string } | null; day: DongDay[]; chuNhiem: DongCn[] };
type ApiHaiKhoi = { data: HaiKhoi | null; error: { message: string; hint?: string; status?: number } | null; reload: () => void };

/**
 * Đường chỉ đọc phân công NGƯỜI GỌI (`/tong-quan/lop-toi-day/hai-khoi`) — chỉ dùng ở hồ sơ GV của chính mình (GD-15, XM-5): `chuNhiem` = bảng "Lớp chủ nhiệm",
 * `day` = dòng phụ "route / tuần học · Test kế tiếp" của bảng "Lớp đang dạy" (bảng "Kỹ năng tôi dạy" cũ gom vào đó: Đạt / Tiến bộ theo lớp ở tab Học thuật,
 * Chờ chấm → cột Chưa nhập / Quá hạn). `bat = false` (QL xem GV khác) → không gọi.
 */
export const useHaiKhoi = (bat: boolean): ApiHaiKhoi => useApi<HaiKhoi>(bat ? '/tong-quan/lop-toi-day/hai-khoi' : null, [bat]);
/** TQ-GON (M3): FT "LT1 · MT1 · W3 SEP" (route · Test kế tiếp), lớp thường "tuần 8/8 · Final · W3 SEP" — không thêm "tuần này". */
export const phuLopDay = (d: HaiKhoi) => new Map(d.day.map((x) => [x.classId, dich((x.khung === 'ft' ? [x.route, x.testKeTiep] : [x.tuanHoc, x.testKeTiep]).filter(Boolean).join(' · '))]));

const COT_CN: readonly CotBang[] = [
  { key: 'lop', nhan: t('Lớp'), kieu: 'ten', linhHoat: true }, { key: 'duoi', nhan: t('Dưới kỳ vọng'), dv: t('HV'), kieu: 'diem', rong: 160, goiY: t('Lớp thường: HV chưa đạt') },
  { key: 'sos', nhan: t('SOS hiện tại'), dv: t('HV'), kieu: 'chu', rong: 340 }, { key: 'case', nhan: t('Case đang mở'), kieu: 'diem', rong: 130 }, { key: 'thi', nhan: t('Thi tháng này'), dv: t('HV'), kieu: 'diem', rong: 150 },
];

/**
 * LỚP CHỦ NHIỆM — tab Lớp hồ sơ GV của chính mình (mockup v21 H1; GD-1 "Lớp tôi chủ nhiệm" GIỮ). Số giữ ô bấm V4 (`/tong-quan/lop-toi-day/o`), số trong hộp.
 * B' 12c (chủ SP 10/11): lớp 0 HV, mọi số 0 → không hiện hàng (chỉ lọc hiển thị). Không lớp chủ nhiệm → không dựng khối.
 */
export function LopChuNhiem({ api }: { api: ApiHaiKhoi }) {
  const dienThoai = useDienThoai();
  const { data, error, reload } = api;
  const ten = t('Lớp chủ nhiệm');
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (!data) return <Card title={ten} bodyClass="p-4"><Skeleton rows={2} /></Card>;
  const chuNhiem = data.chuNhiem.filter((l) => l.hocVien > 0 || l.duoiKyVong > 0 || l.caseMo > 0 || l.thiThangNay > 0 || !!l.sosMuc?.some((n) => n > 0));
  if (!chuNhiem.length) return null;
  const o = (khung: string, classId: number, cot: string, n: number, tieuDe: string) => (
    <OSo giaTri={n} nguon={`/tong-quan/lop-toi-day/o?ct=${khung}&classId=${classId}&cot=${cot}`} tieuDe={tieuDe} />
  );
  const oCn = (l: DongCn, c: CotBang): ReactNode => {
    if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${l.classId}`} className="ten-ho-so inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom font-semibold" title={l.code}>{l.code}</Link>;
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
  /* AUDIT-UI B1: đơn vị ở tiêu đề cột ("Dưới kỳ vọng · HV"), ô chỉ còn số; dòng phụ tên lớp = sĩ số · route. */
  const phuCn = (l: DongCn, c: CotBang): ReactNode => (c.key === 'lop' ? [t('{n} HV', { n: l.hocVien }), l.khung === 'ft' ? l.route : null].filter(Boolean).join(' · ') : null);
  return (
    <Card bodyClass="p-0 o-so-hop"
      title={<span className="inline-flex flex-wrap items-center gap-x-2">{ten}<DemDau n={chuNhiem.length} /><NutLuat label={ten}>{t('Số chủ nhiệm tách riêng, không cộng vào việc kỹ năng.')}</NutLuat></span>}>
      <Bang ten={ten} cot={chuNhiem.some((l) => l.khung === 'ft') ? COT_CN : COT_CN.filter((c) => c.key !== 'sos')} hang={chuNhiem} khoa={(l) => l.classId} oCua={oCn} phuCua={phuCn} khung={false} theLuoi />
    </Card>
  );
}
