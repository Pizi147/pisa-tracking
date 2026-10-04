import { useEffect, useRef, useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { api } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { addDaysStr } from '../lib/format.ts';
import { mondayOfDate, ngay, tuanLich } from '@shared/domain/index.ts';
import { LichNho } from './LichNho.tsx';

export type Period = { id: number; code: string; weekStart: string; weekEnd: string; range: string };
export type Branch = { id: number; code: string; name: string };

/**
 * Tuần trong cửa sổ CÓ THỂ CHƯA CÓ HÀNG trong database (sổ §13.8: đường đọc không được tạo
 * hàng loạt). `id: null` nghĩa là "tuần này hợp lệ, chỉ là chưa ai dùng tới" — vẫn hiện/chọn
 * được bình thường; chọn nó thì `WeekPicker` tự resolve ra ID thật trước khi báo lên trên.
 */
export type WindowPeriod = Omit<Period, 'id'> & {
  id: number | null;
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
 * Cửa sổ tuần quanh tuần đang xem: hai tháng lịch sử, một tuần tới (rộng hơn ở `scope=planning`).
 * Chọn một tuần cũ thì cửa sổ dịch theo, nên vẫn đi tiếp về quá khứ được mà danh sách
 * không bao giờ dài ra thành một cuộn vô tận.
 */
export function usePeriodWindow(anchorId: number | null, scope?: 'planning') {
  const qs = new URLSearchParams();
  if (anchorId) qs.set('anchorId', String(anchorId));
  if (scope) qs.set('scope', scope);
  return useApi<WindowPeriod[]>(`/ref/period-window${qs.toString() ? `?${qs}` : ''}`, [anchorId, scope]);
}

// --------------------------------------------------------------- dựng ngày/tuần thuần (client)

/**
 * RESOLVE ĐÚNG MỘT TUẦN THÀNH ID THẬT — gọi khi người dùng THẬT SỰ chọn một tuần (mũi tên,
 * lịch tháng, gõ ngày, "Tuần này"), không phải khi chỉ đang hiển thị cửa sổ. Đây là ĐƯỜNG DUY
 * NHẤT tạo một hàng `report_periods` từ giao diện chọn tuần, và luôn đúng một hàng.
 */
export function resolveWeek(weekStart: string): Promise<{ id: number }> {
  return api.post<{ id: number }>('/ref/periods/resolve', { weekStart });
}

/**
 * Chọn tuần: nút Trước · trường tuần (bấm mở popover) · nút Sau · Tuần này.
 *
 *   [ ‹ ]  [ 14/09 – 20/09          W3 SEP 2026 ]  [ › ]  [ Tuần này ]
 *
 * BỐ CỤC (HE_GIAO_DIEN §9, design plan §22.3) — lỗi trước đây là lỗi của component + khung chứa
 * chứ không phải của một màn: nút Trước một hàng, trường tuần một hàng, Sau/Tuần này hàng dưới.
 *   · ba phần `‹ trường ›` nằm trong MỘT nhóm flex KHÔNG BAO GIỜ TÁCH HÀNG; mũi tên `flex:none`,
 *     trường tuần `flex:1` + `min-width:0` — thiếu `min-width:0` là nguyên nhân wrap trong ảnh.
 *   · khung chứa quá hẹp thì chỉ `Tuần này` xuống hàng riêng, có chủ ý (nó ở ngoài nhóm).
 *   · cao 40px, gap 8px. Bề rộng do KHUNG CHỨA quyết định, không còn `w-52` cố định của từng nơi gọi.
 *   · trường luôn ghi tuần ĐANG CHỌN THẬT; chưa chọn (và không cho bỏ trống) thì neo tuần hiện tại.
 *
 * POPOVER: lõi lịch chung `LichNho` (kiểu tuần, có ô "Gõ ngày") — gõ ngày hoặc bấm lịch tháng, không dropdown hàng
 * chục tuần (sổ §13.8). `LichNho` vẽ qua PORTAL, `position: fixed`, tự lo vị trí, bấm ngoài và Esc (chỉ đóng lịch). Mã tuần HIỆN RA dạng `W3 SEP` qua `tuanLich` (G-6 — chỉ thêm năm khi khác năm), không có
 * hàm tính tuần thứ hai ở đây.
 */
export function WeekPicker({ periodId, onPeriod, label = 'Tuần', scope, clearable, toiThieu }: {
  periodId: number | null; onPeriod: (id: number | null) => void;
  label?: string | null;
  /** 'planning' mở cửa sổ tuần XA về tương lai — xếp lịch MT là việc của tương lai. */
  scope?: 'planning';
  /** PR-LM: thứ Hai sớm nhất được chọn (ISO) — nút ‹ và ngày trong lịch trước tuần đó bị khoá (MT đang chạy không dời vào tuần đã qua). */
  toiThieu?: string;
  /**
   * Cho phép BỎ TRỐNG. Chỉ bật ở những chỗ mà "chưa biết" là một câu trả lời hợp lệ —
   * dự kiến thi là ví dụ: ép chọn thì người ta chọn bừa rồi không ai sửa lại.
   */
  clearable?: boolean;
}) {
  const toast = useToast();
  /*
   * `demoDate` là NGUỒN DUY NHẤT cho "hôm nay" (sổ §13.8: demo dùng ngày demo, thật dùng hôm
   * nay thực tế — cả hai đều đi qua trường này, KHÔNG đọc đồng hồ trình duyệt). Component này
   * chỉ render sau khi phiên đăng nhập đã tải (App.tsx chặn trước đó), nên `session` luôn có.
   */
  const today = useNgayNghiepVu().homNay;
  const todayWeekStart = today ? mondayOfDate(today) : '';

  const { data } = usePeriodWindow(periodId, scope);
  const list = data ?? [];
  /*
   * CHƯA CHỌN TUẦN NÀO THÌ NEO VÀO TUẦN HIỆN TẠI — trừ khi ô này CHO PHÉP bỏ trống và người
   * dùng thật sự chưa chọn gì. Hai tình huống "chưa chọn" khác nhau:
   *   không clearable, periodId null  → nơi gọi chỉ chưa kịp đặt giá trị ban đầu, vẫn phải
   *                                      hiện tuần hiện tại ngay (không thì khoá cả hai mũi
   *                                      tên và người dùng thấy panel kẹt ở "Đang tải…").
   *   clearable, periodId null        → người dùng ĐÃ CHỦ ĐỘNG để trống, phải hiện đúng
   *                                      "Chưa xác định", không được ngầm hiện tuần hiện tại.
   */
  const anchored = (periodId !== null || !clearable) ? (list.find((p) => p.isAnchor) ?? null) : null;
  /*
   * Trường tuần LUÔN GHI MỘT TUẦN THẬT khi có thể: cửa sổ tuần chưa tải xong mà chưa chọn gì
   * (không clearable) thì tính thẳng tuần hiện tại từ ngày nghiệp vụ — không để trống rồi chú
   * thích bên dưới.
   */
  const shownStart = anchored?.weekStart ?? (periodId === null && !clearable && todayWeekStart ? todayWeekStart : null);
  const shown = shownStart ? { weekStart: shownStart } : null;

  /*
   * ĐANG VẼ MỘT TUẦN THÌ NƠI GỌI PHẢI NHẬN ĐÚNG TUẦN ĐÓ (Z2c-c, A4). Không clearable mà `periodId` còn null: trường tuần đã
   * hiện tuần hiện tại nhưng nơi gọi vẫn giữ null — ngăn Xếp lịch hàng loạt không xem trước, nút Lưu khoá tới khi bấm ‹ ›.
   * Phát tuần neo một lần; tuần chưa có hàng (`id` null) thì hỏi `resolveWeek` như khi bấm chọn.
   */
  useEffect(() => {
    if (periodId !== null || clearable || !anchored) return;
    if (anchored.id !== null) { onPeriod(anchored.id); return; }
    let cancelled = false;
    resolveWeek(anchored.weekStart).then((r) => { if (!cancelled) onPeriod(r.id); }).catch(() => { /* người dùng vẫn bấm chọn được */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onPeriod thường là hàm mới mỗi lần vẽ; chỉ phát khi tuần neo đổi
  }, [periodId, clearable, anchored?.id, anchored?.weekStart]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLButtonElement>(null);

  async function pick(weekStart: string) {
    setBusy(true);
    try {
      const r = await resolveWeek(weekStart);
      onPeriod(r.id);
      setOpen(false);
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không đổi được tuần — thử lại.');
    } finally {
      setBusy(false);
    }
  }

  function goAdjacent(deltaWeeks: number) {
    const base = shown?.weekStart ?? todayWeekStart;
    void pick(addDaysStr(base, 7 * deltaWeeks));
  }

  return (
    <div className="block min-w-0">
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap items-stretch gap-2">
        {/* NHÓM KHÔNG TÁCH HÀNG: mũi tên · trường tuần · mũi tên. */}
        <div className="flex flex-1 basis-[17rem] min-w-0 items-stretch gap-2">
          <button
            type="button" className="btn flex-none h-11 px-3" disabled={busy || (!!toiThieu && !!shown && shown.weekStart <= toiThieu)}
            onClick={() => goAdjacent(-1)} aria-label={shown ? `Tuần trước · ${tuanLich(addDaysStr(shown.weekStart, -7), today)}` : 'Tuần trước'}
            title={shown ? `Tuần trước · ${tuanLich(addDaysStr(shown.weekStart, -7), today)}` : 'Tuần trước'}
          >‹</button>
          <button
            ref={field} type="button"
            className="field flex-1 min-w-0 h-11 text-left flex items-center justify-between gap-2 tabular-nums"
            aria-haspopup="dialog" aria-expanded={open}
            onClick={() => setOpen((v) => !v)} disabled={busy}
          >
            {shown ? (
              <>
                <span className="text-slate-100 truncate">{tuanLich(shown.weekStart, today)}</span>
                <span className="text-slate-500 text-xs shrink-0">{ngay(shown.weekStart, today)} – {ngay(addDaysStr(shown.weekStart, 6), today)}</span>
              </>
            ) : (
              <span className="text-slate-500">{clearable ? 'Chưa xác định' : 'Đang tải…'}</span>
            )}
          </button>
          <button
            type="button" className="btn flex-none h-11 px-3" disabled={busy}
            onClick={() => goAdjacent(1)} aria-label={shown ? `Tuần sau · ${tuanLich(addDaysStr(shown.weekStart, 7), today)}` : 'Tuần sau'}
            title={shown ? `Tuần sau · ${tuanLich(addDaysStr(shown.weekStart, 7), today)}` : 'Tuần sau'}
          >›</button>
        </div>
        <button type="button" className="btn flex-none h-11" disabled={busy} onClick={() => void pick(todayWeekStart)}>
          Tuần này
        </button>
        {clearable && shown && (
          <button type="button" className="btn btn-ghost flex-none h-11" onClick={() => onPeriod(null)}>Bỏ chọn</button>
        )}
      </div>

      {open && (
        <LichNho kieu="tuan" goNgay value={shown?.weekStart ?? null} homNay={today} luat={toiThieu ? { toiThieu } : {}} neo={field}
          onChon={(t2) => { if (!busy) void pick(t2); }} onDong={() => setOpen(false)} />
      )}
    </div>
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
      <WeekPicker periodId={periodId} onPeriod={(id) => id && onPeriod(id)} />
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
