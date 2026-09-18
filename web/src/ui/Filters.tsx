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
 * TUẦN HIỆN TẠI theo ngày demo — hỏi thẳng máy chủ, KHÔNG đi tìm trong danh sách tuần.
 *
 * `/ref/periods` chỉ trả 26 tuần mới nhất trong lịch, mà lịch có sẵn cả những tuần tương lai
 * (kế hoạch MT xếp tới đầu 2027). Khi phần tương lai dài hơn thế thì tuần hiện tại rơi khỏi
 * danh sách, và màn nào đi tìm nó trong đó sẽ không thấy rồi rơi về một tuần bất kỳ.
 */
export function useCurrentPeriod() {
  return useApi<Period>('/ref/current-period');
}

/**
 * Cửa sổ tuần quanh tuần đang xem: hai tháng lịch sử, một tuần tới.
 * Chọn một tuần cũ thì cửa sổ dịch theo, nên vẫn đi tiếp về quá khứ được mà danh sách
 * không bao giờ dài ra thành một cuộn vô tận.
 */
export function usePeriodWindow(anchorId: number | null, scope?: 'planning') {
  const qs = new URLSearchParams();
  if (anchorId) qs.set('anchorId', String(anchorId));
  if (scope) qs.set('scope', scope);
  return useApi<WindowPeriod[]>(`/ref/period-window${qs.toString() ? `?${qs}` : ''}`, [anchorId, scope]);
}

/**
 * Chọn tuần: ← tuần trước · danh sách · → tuần sau.
 *
 * Phần lớn thao tác là đi sang tuần liền kề. Bắt mở dropdown rồi tìm đúng dòng cho một
 * việc như thế là ba thao tác cho một bước — hai mũi tên giải quyết bằng một cú bấm.
 */
export function WeekPicker({ periodId, onPeriod, className = 'w-52', label = 'Tuần', scope, clearable }: {
  periodId: number | null; onPeriod: (id: number | null) => void;
  className?: string; label?: string | null;
  /** 'planning' mở cửa sổ tuần XA về tương lai — xếp lịch MT là việc của tương lai. */
  scope?: 'planning';
  /**
   * Cho phép BỎ TRỐNG. Chỉ bật ở những chỗ mà "chưa biết" là một câu trả lời hợp lệ —
   * tuần dự kiến thi là ví dụ: ép chọn thì người ta chọn bừa rồi không ai sửa lại.
   */
  clearable?: boolean;
}) {
  const { data } = usePeriodWindow(periodId, scope);
  const list = data ?? [];
  // Danh sách trả về mới nhất trước; đảo lại để "trước/sau" đọc theo trục thời gian.
  const asc = [...list].reverse();

  /*
   * CHƯA CHỌN TUẦN NÀO THÌ NEO VÀO TUẦN HIỆN TẠI — đây là lỗi owner báo.
   *
   * Bản trước: `periodId` rỗng → `idx = -1` → cả hai mũi tên bị khoá, ô select hiện một tuần
   * nhưng state vẫn rỗng nên nút Lưu không bao giờ sáng. Người dùng thấy một panel trông như
   * đã chọn xong mà bấm gì cũng không được.
   *
   * Nay chưa chọn thì coi như đang đứng ở tuần neo (tuần hiện tại), nên hai mũi tên chạy
   * được ngay, và bấm một cái là chọn thật.
   */
  const anchorIdx = asc.findIndex((p) => p.isAnchor);
  const idx = periodId
    ? asc.findIndex((p) => p.id === periodId)
    : (anchorIdx >= 0 ? anchorIdx : asc.length - 1);

  const prev = idx > 0 ? asc[idx - 1] : null;
  const next = idx >= 0 && idx < asc.length - 1 ? asc[idx + 1] : null;
  const shown = idx >= 0 ? asc[idx] : null;

  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <div className="flex items-stretch gap-1">
        <button
          type="button" className="btn btn-sm px-2" disabled={!prev}
          onClick={() => prev && onPeriod(prev.id)}
          aria-label="Tuần trước" title={prev ? `Tuần trước · ${prev.code}` : 'Đã ở đầu khoảng đang xem'}
        >←</button>
        <select className={`field ${className}`}
          value={clearable ? (periodId ?? '') : (periodId ?? shown?.id ?? '')}
          onChange={(e) => onPeriod(e.target.value ? Number(e.target.value) : null)}>
          {clearable && <option value="">Chưa xác định</option>}
          {/*
            Chưa chọn thì vẫn phải chọn được CHÍNH tuần đang hiện — nếu không, người dùng
            muốn lấy đúng tuần này lại phải bấm sang tuần khác rồi bấm ngược lại.
          */}
          {!periodId && !clearable && shown && <option value={shown.id}>{shown.code} · {shown.range}</option>}
          {list.filter((p) => clearable || periodId || p.id !== shown?.id)
            .map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
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
      <WeekPicker periodId={periodId} onPeriod={(id) => id && onPeriod(id)} className="w-52" />
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
