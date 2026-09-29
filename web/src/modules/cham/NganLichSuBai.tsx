import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DongThoiGianLuot } from '../fasttrack/DongThoiGianLuot.tsx';
import { tenMon } from '@shared/domain/index.ts';

/**
 * LỊCH SỬ MỘT EM × MỘT BÀI (PR-XLMT K4-32, #118) — mở từ mục cuối menu ⋯ của ô lưới lớp thường. Ngăn hẹp, cùng dòng thời gian với
 * hồ sơ Mock (`DongThoiGianLuot`): việc chung của cả bài (tạo, huỷ…) + việc của đúng môn đó.
 */
export function NganLichSuBai({ attemptId, skill, ct, tenHv, onClose }: {
  attemptId: number; skill: string; ct: string | null; tenHv: string; onClose: () => void;
}) {
  const { data, loading, error, reload } = useApi<{ history: any[]; scoreHistory: any[] }>(`/attempts/${attemptId}`);
  const cuaMon = (f: string | null) => !f || f === skill || f === 'deadline_override';
  return (
    <KhungPanel tieuDe={`Lịch sử · ${tenMon(ct, skill)}`} hocVien={tenHv} onDong={onClose}>
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : loading || !data ? <Skeleton rows={4} />
            : <DongThoiGianLuot ct={ct} gioiHan={20} history={data.history.filter((h) => cuaMon(h.field))}
              scoreHistory={data.scoreHistory.filter((h) => h.skill === skill)} />}
      </div>
    </KhungPanel>
  );
}
