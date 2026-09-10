import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';

export type Period = { id: number; code: string; weekStart: string; weekEnd: string; range: string };
export type Branch = { id: number; code: string; name: string };

export type WindowPeriod = Period & {
  isAnchor: boolean;
  editWindow: { open: boolean; reason: string | null; opensOn: string };
};

export function usePeriods() {
  return useApi<Period[]>('/ref/periods');
}

/**
 * Cửa sổ tuần quanh tuần đang xem: hai tháng lịch sử, một tuần tới.
 * Chọn một tuần cũ thì cửa sổ dịch theo, nên vẫn đi tiếp về quá khứ được mà danh sách
 * không bao giờ dài ra thành một cuộn vô tận.
 */
export function usePeriodWindow(anchorId: number | null) {
  return useApi<WindowPeriod[]>(`/ref/period-window${anchorId ? `?anchorId=${anchorId}` : ''}`);
}

/**
 * Chọn tuần: ← tuần trước · danh sách · → tuần sau.
 *
 * Phần lớn thao tác là đi sang tuần liền kề. Bắt mở dropdown rồi tìm đúng dòng cho một
 * việc như thế là ba thao tác cho một bước — hai mũi tên giải quyết bằng một cú bấm.
 */
export function WeekPicker({ periodId, onPeriod, className = 'w-52', label = 'Tuần' }: {
  periodId: number | null; onPeriod: (id: number) => void; className?: string; label?: string | null;
}) {
  const { data } = usePeriodWindow(periodId);
  const list = data ?? [];
  // Danh sách trả về mới nhất trước; đảo lại để "trước/sau" đọc theo trục thời gian.
  const asc = [...list].reverse();
  const idx = asc.findIndex((p) => p.id === periodId);
  const prev = idx > 0 ? asc[idx - 1] : null;
  const next = idx >= 0 && idx < asc.length - 1 ? asc[idx + 1] : null;

  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <div className="flex items-stretch gap-1">
        <button
          type="button" className="btn btn-sm px-2" disabled={!prev}
          onClick={() => prev && onPeriod(prev.id)}
          aria-label="Tuần trước" title={prev ? `Tuần trước · ${prev.code}` : 'Đã ở đầu khoảng đang xem'}
        >←</button>
        <select className={`field ${className}`} value={periodId ?? ''} onChange={(e) => onPeriod(Number(e.target.value))}>
          {list.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
        </select>
        <button
          type="button" className="btn btn-sm px-2" disabled={!next}
          onClick={() => next && onPeriod(next.id)}
          aria-label="Tuần sau" title={next ? `Tuần sau · ${next.code}` : 'Không mở xa hơn về tương lai'}
        >→</button>
      </div>
    </label>
  );
}

/**
 * Chỉ chọn chi nhánh, không có tuần — dùng ở những màn nói về TÌNH TRẠNG HIỆN TẠI
 * chứ không phải kết quả của một tuần. Vẫn tự ẩn khi tài khoản chỉ có một chi nhánh.
 */
export function BranchFilter({ branchId, onBranch }: {
  branchId: number | null; onBranch: (id: number | null) => void;
}) {
  const branches = useApi<Branch[]>('/ref/branches');
  const { branchCount } = useSession();
  if ((branches.data?.length ?? 0) <= 1 || branchCount <= 1) return null;
  return (
    <label className="block">
      <span className="label">Chi nhánh</span>
      <select className="field w-44" value={branchId ?? ''}
        onChange={(e) => onBranch(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Tất cả chi nhánh</option>
        {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  );
}

/**
 * Bộ lọc mặc định là TUẦN. Bộ lọc chi nhánh chỉ xuất hiện khi tài khoản thật sự
 * có nhiều hơn một chi nhánh — không đặt dropdown thừa trên mọi trang.
 */
export function WeekBranchFilter({ periodId, onPeriod, branchId, onBranch, children }: {
  periodId: number | null; onPeriod: (id: number) => void;
  branchId?: number | null; onBranch?: (id: number | null) => void;
  children?: React.ReactNode;
}) {
  const branches = useApi<Branch[]>(onBranch ? '/ref/branches' : null);
  const { branchCount } = useSession();
  const showBranch = !!onBranch && (branches.data?.length ?? 0) > 1 && branchCount > 1;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <WeekPicker periodId={periodId} onPeriod={onPeriod} className="w-52" />
      {showBranch && (
        <label className="block">
          <span className="label">Chi nhánh</span>
          <select className="field w-44" value={branchId ?? ''} onChange={(e) => onBranch!(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Tất cả chi nhánh</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}
      {children}
    </div>
  );
}
