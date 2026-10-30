import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DongThoiGianLuot } from '../fasttrack/DongThoiGianLuot.tsx';
import { tenMon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * LỊCH SỬ MỘT EM × MỘT BÀI (PR-XLMT K4-32, #118) — mở từ mục cuối menu ⋯ của ô lưới lớp thường. Ngăn hẹp, cùng dòng thời gian với
 * hồ sơ Mock (`DongThoiGianLuot`): việc chung của cả bài (tạo, huỷ…) + việc của đúng môn đó.
 */
export function NganLichSuBai({ attemptId, skill, ct, tenHv, trongHop, onClose }: {
  /** `null` (PR-HOP1, ⋯ đầu hộp): nhật ký cả lượt. */
  attemptId: number; skill: string | null; ct: string | null; tenHv: string;
  /** Mở từ hộp xếp lịch nổi (`HopKyNang`, z-60): nằm trên hộp đó và không thay panel đang mở bên dưới (như `HopThaoTacMt`). */
  trongHop?: boolean; onClose: () => void;
}) {
  const { data, loading, error, reload } = useApi<{ history: any[]; scoreHistory: any[] }>(`/attempts/${attemptId}`);
  /* FT: Writing = W1 + W2 — điểm và việc ghi theo `writing1|writing2` đều thuộc dòng W (PR-MTb T5). */
  const laMon = (s: string | null) => skill === null || s === skill || (skill === 'writing' && !!s?.startsWith('writing'));
  const cuaMon = (f: string | null) => !f || laMon(f) || f === 'deadline_override';
  return (
    <KhungPanel tieuDe={skill ? t('Lịch sử · {tenMon}', { tenMon: tenMon(ct, skill) }) : t('Lịch sử')} hocVien={tenHv} onDong={onClose} longTrong={trongHop} z={trongHop ? 'z-[70]' : undefined}>
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : loading || !data ? <Skeleton rows={4} />
            : <DongThoiGianLuot ct={ct} gioiHan={20} history={data.history.filter((h) => cuaMon(h.field))}
              scoreHistory={data.scoreHistory.filter((h) => laMon(h.skill))} />}
      </div>
    </KhungPanel>
  );
}
