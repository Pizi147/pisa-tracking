import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { docThamSoHoSo, duongHoSoHocVien } from '@shared/domain/index.ts';
import { useChongVe, useVe } from '../../lib/quayLai.ts';
import { NganCase } from '../students/NganCase.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * `/hoc-thuat/Case/:id` — link sâu cũ (thông báo, email, link đã lưu). PR-Pb2-a (Q5) → PR-Dọn: mọi Case đều có học viên, nên chỉ còn
 * chuyển về hồ sơ HV mở sẵn Ngăn Case. Route giữ ở `App.tsx` để link cũ vẫn mở được.
 * PR-PA (§8): `?pa=&viec=ghi-ket-qua` (`duongCaseRieng`) → mở thẳng Ngăn Case, không qua hồ sơ — người giữ việc Kết quả có thể không xem được hồ sơ HV.
 */
export function CaseRoutePage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const chong = useChongVe();
  const ve = useVe();
  const { paId, viec } = docThamSoHoSo((k) => sp.get(k));
  const rieng = viec === 'ghi-ket-qua' && !!id;
  const ca = useApi<{ student: { id: number } | null }>(id && !rieng ? `/cases/${id}` : null);
  if (rieng) return <NganCase caseId={Number(id)} paId={paId ?? null} viec="ghi-ket-qua" onClose={() => ve(chong[0]?.url ?? '/cong-viec', !chong.length)} />;
  if (ca.data?.student) return <Navigate replace to={duongHoSoHocVien(ca.data.student.id, { caseId: Number(id) })} />;
  if (ca.error) return <ErrorState message={ca.error.message} status={ca.error.status} onRetry={ca.reload} />;
  if (ca.data) return <ErrorState message={t('Case này không gắn học viên nào.')} />;
  return <div className="max-w-[900px]"><Skeleton rows={4} /></div>;
}
