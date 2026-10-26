import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { attemptCuaEm } from '@shared/domain/index.ts';
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
 * R1-BO-DAN-EXCEL (#601): Dán từ Excel điểm đã bỏ ở mọi nơi.
 */
export function LuoiNhung({ classId, periodId, kind, tuanDangXem, chiAttempt: chiAttemptVao = null, chiHv = null, kn = null, hrefDayDu, datConTro, onDaLuu, coLinkRieng, onSoOChuaLuu, chiCot = null, sEx, onHet, nhanTrai }: {
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
  /** R1-PHAN-CAP-TEST (M2 A2): nhãn trái hàng công cụ trên lưới — "6 học viên · Fast Track" (hàng lớp Lịch Test). */
  nhanTrai?: string;
}) {
  const { data, error, reload } = useApi<Cham>(duongCham(classId, { periodId, kind }));
  const chiAttempt = useMemo(() => chiAttemptVao ?? (chiHv && data ? attemptCuaEm(data.ft?.rows ?? data.thuong?.rows ?? [], chiHv) : null),
    [chiAttemptVao, chiHv, data]);
  /* R1-PHAN-CAP-TEST: Lịch Test — lưới VỪA thẻ thì bỏ khung cuộn riêng để đầu cột dính dưới hàng lớp (CSS `.luoi-vua`); rộng hơn (lớp thường
     4 môn) giữ cuộn ngang, không cắt cột. Đo lại khi thẻ / bảng đổi cỡ. */
  const khung = useRef<HTMLDivElement>(null);
  const [vua, setVua] = useState(false);
  useEffect(() => {
    const el = khung.current;
    if (!coLinkRieng || !el || typeof ResizeObserver === 'undefined') return undefined;
    const bang = el.querySelector('table');
    const do_ = () => setVua(!!bang && bang.offsetWidth <= el.clientWidth + 1);
    const ro = new ResizeObserver(do_);
    ro.observe(el);
    if (bang) ro.observe(bang);
    do_();
    return () => ro.disconnect();
  }, [coLinkRieng, data]);
  /* UI-LICH-TUAN: Lịch tuần chính là lưới đầy đủ (`/nhap-diem/*` chuyển về đây) — không lặp link; panel việc vẫn có. */
  const link = coLinkRieng ? null : (
    <Link to={hrefDayDu} className="inline-flex min-h-[32px] max-sm:min-h-10 items-center px-2 text-xs text-slate-400 no-underline hover:text-slate-100"
      title={t('Mở lưới đầy đủ của lớp này ở trang riêng')}>
      {t('Mở lưới đầy đủ ›')}
    </Link>
  );
  return (
    <div ref={khung} className={coLinkRieng ? (vua ? 'luoi-vua' : '') : 'py-1'}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <Skeleton rows={4} />
        : (
          <LuoiChamLop data={data} kind={kind} kn={kn} onReload={() => { reload(); onDaLuu(); }}
            gon tuanDangXem={tuanDangXem} chiAttempt={chiAttempt} datConTro={datConTro} thanhTren={link}
            onSoOChuaLuu={onSoOChuaLuu} chiCot={chiCot} sEx={sEx} onHet={onHet} nhanTrai={nhanTrai} />
        )}
    </div>
  );
}
