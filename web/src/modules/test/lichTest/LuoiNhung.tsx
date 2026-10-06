import { Link } from 'react-router-dom';
import { useApi } from '../../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../../ui/ui.tsx';
import { LuoiChamLop, duongCham, useManHinhHep, type Cham } from '../../cham/LuoiChamLop.tsx';

/**
 * LƯỚI CHẤM MỞ TẠI CHỖ (PR-UX1) — dưới một hàng lớp hoặc một dòng Nợ. Cùng lưới với trang lưới đầy đủ (`LuoiChamLop`),
 * nên luật chấm không đổi: ô môn mình dạy sửa được, môn khác là chữ; sửa ô có điểm hỏi lý do; đợt hoàn tất khoá.
 *
 * Lưu một ô → tải lại lưới NÀY và báo `onDaLuu` (Lịch Test gộp 1,5 s rồi mới tải lại dải số — Q14).
 * "Mở lưới đầy đủ ↗": hàng lớp trên máy tính đã có ↗ ở cột riêng (`coLinkRieng`) nên không lặp; màn hẹp thì hàng lớp gập,
 * link về lại trên lưới.
 */
export function LuoiNhung({ classId, periodId, kind, tuanDangXem, chiAttempt = null, kn = null, hrefDayDu, datConTro, onDaLuu, coLinkRieng, onSoOChuaLuu }: {
  classId: number; periodId: number | null; kind: string | null; tuanDangXem: string | null;
  chiAttempt?: ReadonlySet<number> | null; kn?: string | null; hrefDayDu: string; datConTro: boolean;
  onDaLuu: () => void; coLinkRieng?: boolean; onSoOChuaLuu?: (n: number) => void;
}) {
  const { data, error, reload } = useApi<Cham>(duongCham(classId, { periodId, kind }));
  const hep = useManHinhHep();
  const link = coLinkRieng && !hep ? null : (
    <Link to={hrefDayDu} className="inline-flex min-h-[32px] max-sm:min-h-10 items-center px-2 text-xs text-slate-400 no-underline hover:text-slate-100"
      title="Mở lưới đầy đủ của lớp này ở trang riêng">
      Mở lưới đầy đủ ↗
    </Link>
  );
  return (
    <div className="py-1">
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <Skeleton rows={4} />
        : (
          <LuoiChamLop data={data} kind={kind} kn={kn} onReload={() => { reload(); onDaLuu(); }}
            gon tuanDangXem={tuanDangXem} chiAttempt={chiAttempt} datConTro={datConTro} thanhTren={link}
            onSoOChuaLuu={onSoOChuaLuu} />
        )}
    </div>
  );
}
