import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { attemptCoBaiTuan, attemptCuaEm } from '@shared/domain/index.ts';
import { useApi } from '../../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../../ui/ui.tsx';
import { LuoiChamLop, duongCham, type Cham } from '../../cham/LuoiChamLop.tsx';
import type { SExTuan } from '../../cham/LuoiFT.tsx';
import type { OnHet } from '../../cham/phienCham.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * LƯỚI CHẤM MỞ TẠI CHỖ (PR-UX1) — dưới một hàng lớp hoặc một dòng Nợ. Cùng lưới với trang lưới đầy đủ (`LuoiChamLop`),
 * nên luật chấm không đổi: ô môn mình dạy sửa được, môn khác là chữ; sửa ô có điểm hỏi lý do; đợt hoàn tất khoá.
 *
 * Lưu một ô → tải lại lưới NÀY và báo `onDaLuu` (Lịch Test gộp 1,5 s rồi mới tải lại dải số — Q14).
 * "Mở lưới đầy đủ ›" (G6: "›" = đổi trang; → Lịch tuần lọc lớp): chỉ khi lưới nằm ngoài Lịch tuần (panel việc); trong Lịch (`coLinkRieng`) không lặp.
 */
export function LuoiNhung({ classId, periodId, kind, tuanDangXem, chiAttempt: chiAttemptVao = null, chiHv = null, kn = null, hrefDayDu, datConTro, onDaLuu, coLinkRieng, onSoOChuaLuu, chiCot = null, sEx, onHet, emCoBaiTuan = false }: {
  classId: number; periodId: number | null; kind: string | null; tuanDangXem: string | null;
  chiAttempt?: ReadonlySet<number> | null; kn?: string | null; hrefDayDu: string; datConTro: boolean;
  onDaLuu: () => void; coLinkRieng?: boolean; onSoOChuaLuu?: (n: number) => void;
  /** OV-15b: panel việc — chỉ cột của việc (+ nút "Cả lớp"). */
  chiCot?: readonly string[] | null;
  /** SL1 (CV-01): panel việc — chỉ hàng em của việc (`emCuaViec`); "Cả lớp" trong lưới vẫn mở hết. */
  chiHv?: readonly number[] | null;
  /** UI-LICH-TUAN: lượt S Ex của tuần (Lịch tuần) — cột S Ex của lưới FT. */
  sEx?: SExTuan;
  /** R1-LUU-TIEP: hết bài của người xem → "Lớp tiếp" / "Việc tiếp" (nơi gọi chọn). */
  onHet?: OnHet;
  /** N39 (panel việc chấm Mock): thêm mọi em có bài tuần `tuanDangXem` ở cột của việc — cả bài đã chấm, để sửa; không hiện cả lớp. */
  emCoBaiTuan?: boolean;
}) {
  const { data, error, reload } = useApi<Cham>(duongCham(classId, { periodId, kind }));
  const chiAttempt = useMemo(() => {
    if (chiAttemptVao) return chiAttemptVao;
    const theoEm = chiHv && data ? attemptCuaEm(data.ft?.rows ?? data.thuong?.rows ?? [], chiHv) : null;
    if (!emCoBaiTuan || !data?.ft || !tuanDangXem) return theoEm;
    return new Set([...(theoEm ?? []), ...attemptCoBaiTuan(data.ft.rows, tuanDangXem, chiCot)]);
  }, [chiAttemptVao, chiHv, data, emCoBaiTuan, tuanDangXem, chiCot]);
  /* UI-LICH-TUAN: Lịch tuần chính là lưới đầy đủ (`/nhap-diem/*` chuyển về đây) — không lặp link; panel việc vẫn có. */
  const link = coLinkRieng ? null : (
    <Link to={hrefDayDu} className="inline-flex min-h-[32px] max-sm:min-h-10 items-center px-2 text-xs text-slate-400 no-underline hover:text-slate-100"
      title={t('Mở lưới đầy đủ của lớp này ở trang riêng')}>
      {t('Mở lưới đầy đủ ›')}
    </Link>
  );
  return (
    <div className="py-1">
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <Skeleton rows={4} />
        : (
          <LuoiChamLop data={data} kind={kind} kn={kn} onReload={() => { reload(); onDaLuu(); }}
            gon tuanDangXem={tuanDangXem} chiAttempt={chiAttempt} datConTro={datConTro} thanhTren={link}
            onSoOChuaLuu={onSoOChuaLuu} chiCot={chiCot} sEx={sEx} onHet={onHet} />
        )}
    </div>
  );
}
