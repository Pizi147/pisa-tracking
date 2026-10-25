import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Nhan } from '../../ui/Nhan.tsx';
import { chuTargetKck, ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import type { DongCacLoTrinh } from './CacLoTrinh.tsx';

/**
 * TÓM TẮT HỒ SƠ LƯU TRỮ (P7, mockup V6 `trang-thai-hv.html` k6, GPT 7): MỘT dòng dưới tên — lộ trình gần nhất · Target · thi thật · kết quả · ngày kết thúc —
 * đọc CÙNG nguồn khối "Các lộ trình" (`/students/:id/lo-trinh`, bản chụp từng lộ trình), không thêm câu đọc riêng. Chi tiết vẫn ở "Lộ trình & lớp" như cũ.
 */
export function TomTatLuuTru({ studentId, target, kck, ketThuc }: { studentId: number; target: number | null; kck: boolean; ketThuc: string | null }) {
  const { homNay } = useNgayNghiepVu();
  const { data } = useApi<DongCacLoTrinh[]>(`/students/${studentId}/lo-trinh`, [studentId]);
  const g = data?.[0];
  if (!g) return null;
  const bt = g.buocTiep;
  const tg = chuTargetKck(target, kck);
  const o = (n: string, v: string) => (
    <span className="inline-flex items-baseline gap-1.5"><span className="text-[12px] text-slate-500">{n}</span><span className="font-semibold text-slate-100">{v}</span></span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm" aria-label={t('Tóm tắt hành trình')}>
      {o(t('Lộ trình gần nhất'), [dich(g.ten), g.lop].filter(Boolean).join(' · '))}
      {tg && o('Target', tg)}
      {bt?.ngayThi && o(t('Thi thật'), ngay(bt.ngayThi, homNay))}
      {bt ? <Nhan tone={bt.ketLuan === 'reached' ? 'ok' : bt.ketLuan === 'not_reached' ? 'bad' : 'muted'}>{dich(bt.daXong)}</Nhan>
        : g.ketQua && <Nhan tone={g.ketQua.tone}>{dich(g.ketQua.chinh)}</Nhan>}
      {ketThuc && o(t('Kết thúc'), ngay(ketThuc, homNay))}
    </div>
  );
}
