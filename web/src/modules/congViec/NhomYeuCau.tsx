import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { duongThe, type DemYeuCau, type TheYeuCauDto } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * CHỜ BẠN DUYỆT — nhóm ĐẦU của Công việc khi có thẻ (OV-15d, mockup 2 mục 3): thẻ "Nếu duyệt: …", Duyệt · Từ chối… · Mở, chọn nhiều cùng loại —
 * chính hộp Chờ duyệt ở chế độ gọn. Số = badge Công việc (`/yeu-cau/dem`). Báo QL / Đã xử lý: "Mở hộp duyệt ›".
 */
export function NhomChoDuyet() {
  const dem = useApi<DemYeuCau>('/yeu-cau/dem').data;
  const [mo, setMo] = useState(true);
  if (!dem?.cho) return null;
  return (
    <KhoiNhom id="nhom-cho-duyet" mo={mo} onMo={() => setMo(!mo)} nhan={t('Chờ bạn duyệt')} tieuDe={t('Chờ bạn duyệt')} dem={dem.cho}
      phu={<span className="flex flex-wrap items-center gap-x-2">
        {dem.quaHan > 0 && <span className="font-bold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: dem.quaHan })}</span>}
        <Link to="/cong-viec/cho-duyet" className="link font-normal">{t('Mở hộp duyệt ›')}</Link>
      </span>}>
      <div className="py-2 pr-3"><HopChoDuyet gon /></div>
    </KhoiNhom>
  );
}

/**
 * YÊU CẦU CỦA TÔI trong hàng đợi GV (mockup 2 mục 2): "Bị từ chối" là một nhóm việc (Sửa và gửi lại); thẻ đang chờ duyệt chỉ là MỘT dòng số
 * mở Yêu cầu của tôi. Không có gì bị từ chối và không có gì chờ → không vẽ.
 */
export function NhomBiTuChoi() {
  const dem = useApi<DemYeuCau>('/yeu-cau/dem').data;
  const ds = useApi<{ the: TheYeuCauDto[] }>(dem?.cuaToiTuChoi ? '/yeu-cau?hop=cua-toi' : null, [dem?.cuaToiTuChoi]).data;
  const [mo, setMo] = useState(true);
  const [them, setThem] = useState(false);
  if (!dem || (!dem.cuaToiTuChoi && !dem.cuaToiCho)) return null;
  const choDuyet = dem.cuaToiCho > 0 && (
    <Link to="/cong-viec/yeu-cau" className="link inline-flex min-h-[44px] items-center px-3 text-xs sm:min-h-0 sm:py-2">
      {t('{n} yêu cầu chờ duyệt ›', { n: dem.cuaToiCho })}
    </Link>
  );
  if (!dem.cuaToiTuChoi) return <div className="flex justify-end">{choDuyet}</div>;
  const the = (ds?.the ?? []).filter((x) => x.trangThai === 'tu_choi');
  const hien = them ? the : the.slice(0, 1);
  return (
    <KhoiNhom id="nhom-bi-tu-choi" mo={mo} onMo={() => setMo(!mo)} nhan={t('Bị từ chối')} tieuDe={t('Bị từ chối')} dem={dem.cuaToiTuChoi} demMau="late">
      {!ds ? <div className="p-3"><Skeleton rows={2} /></div> : (
        <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
          {hien.map((x) => (
            <li key={x.id} className="space-y-1.5 py-2 pr-3">
              <b className="block text-[13px] font-semibold text-slate-100">{dich([x.nhanLoai, x.hocVien, x.lop].filter(Boolean).join(' · '))}</b>
              {x.lyDoTuChoi && <span className="block text-xs text-slate-400">"{x.lyDoTuChoi}"</span>}
              <Link to={duongThe(x.id, 'nguoi-xin')} className="btn btn-sm min-h-[44px] no-underline sm:min-h-[32px]">{t('Sửa và gửi lại')}</Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pr-1">
        {!them && the.length > 1 ? (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => setThem(true)}>{t('Xem thêm')}{' '}{the.length - 1}{' '}{t('việc')}</button>
        ) : <span />}
        {choDuyet}
      </div>
    </KhoiNhom>
  );
}
