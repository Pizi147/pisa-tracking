import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { useTheNhanManh } from './HopChoDuyet.tsx';
import type { TheYeuCauDto } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * CÔNG VIỆC › YÊU CẦU CỦA TÔI (PR-DUYET, M8) — thẻ mình đã gửi Quản lý: đang chờ trước, rồi đã xử lý 60 ngày (Đã duyệt · Bị từ chối +
 * lý do · Đã trả lời · Tự đóng). Không có nút quyết định. Chuông "QL đã duyệt/từ chối/trả lời" mở đúng thẻ ở đây (`?the=`).
 */
export function YeuCauCuaToi({ gon = false }: {
  /** OV-15d: phần cuối Công việc của GV — chỉ thẻ Bị từ chối (việc: Sửa và gửi lại) + một dòng "n yêu cầu chờ duyệt ›"; đủ ở `/cong-viec/yeu-cau`. */
  gon?: boolean;
} = {}) {
  const { data, loading, error, reload } = useApi<{ the: TheYeuCauDto[] }>('/yeu-cau?hop=cua-toi');
  const nhan = useTheNhanManh(data?.the);
  if (gon) {
    if (!data) return null;
    /* Bị từ chối CÒN VIỆC: chưa có thẻ cùng loại, cùng em / lớp gửi sau nó (đã sửa gửi lại → hết) — gần luật `con_viec` của chuông (thông báo.ts). */
    const tuChoi = data.the.filter((x) => x.trangThai === 'tu_choi'
      && !data.the.some((y) => y.id > x.id && y.loai === x.loai && y.hocVienId === x.hocVienId && y.lopId === x.lopId));
    const dangCho = data.the.filter((x) => x.trangThai === 'cho').length;
    if (!tuChoi.length && !dangCho) return null;
    return (
      <section className="space-y-2" aria-label={t('Yêu cầu của tôi')}>
        {tuChoi.length > 0 && <h2 className="m-0 text-sm font-semibold text-slate-200">{t('Bị từ chối')} <span className="tabular-nums text-slate-400">{tuChoi.length}</span></h2>}
        {tuChoi.map((y) => <TheYeuCau key={y.id} yc={y} laNguoiXin nhanManh={nhan === y.id} onXong={reload} />)}
        {dangCho > 0 && <Link to="/cong-viec/yeu-cau" className="link inline-block text-[13px] max-sm:py-3">{t('{n} yêu cầu chờ duyệt ›', { n: dangCho })}</Link>}
      </section>
    );
  }
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Card><Skeleton rows={5} /></Card>;
  const ds = data?.the ?? [];
  if (!ds.length) {
    return <Card><Empty title={t('Bạn chưa gửi yêu cầu nào cho Quản lý')}
      hint={t('Đề xuất PA cần duyệt, Xin hỗ trợ QL ở Kết quả tuần, hoặc Đề xuất sửa ở ⋯ hồ sơ học viên — mọi yêu cầu đều hiện ở đây.')} /></Card>;
  }
  const cho = ds.filter((x) => x.trangThai === 'cho').length;
  return (
    <div className="space-y-2">
      <p className="m-0 text-[12px] tabular-nums text-slate-400">{t('{cho} đang chờ Quản lý ·', { cho })}{' '}{ds.length - cho}{' '}{t('đã xử lý (60 ngày)')}</p>
      {ds.map((y) => <TheYeuCau key={y.id} yc={y} laNguoiXin nhanManh={nhan === y.id} onXong={reload} />)}
    </div>
  );
}
