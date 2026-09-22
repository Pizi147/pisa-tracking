import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { api } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { addDaysStr } from '../lib/format.ts';
import { mondayOfDate, owningMonthOf, tuanLich } from '@shared/domain/index.ts';

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

const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** "14/09 – 20/09" — khoảng ngày của tuần bắt đầu tại `weekStart`. */
function rangeOf(weekStart: string): string {
  return `${dm(weekStart)} – ${dm(addDaysStr(weekStart, 6))}`;
}

/**
 * Lưới lịch tháng, MỖI HÀNG LÀ MỘT TUẦN thứ Hai→Chủ nhật — chọn một ngày trong hàng nào thì
 * chọn cả tuần đó. Có ngày đệm của tháng liền kề để lưới luôn tròn tuần.
 */
function monthGrid(year: number, month: number): string[][] {
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  const rows: string[][] = [];
  let cursor = mondayOfDate(first);
  do {
    const row: string[] = [];
    for (let i = 0; i < 7; i += 1) { row.push(cursor); cursor = addDaysStr(cursor, 1); }
    rows.push(row);
  } while (rows[rows.length - 1][6] < last);
  return rows;
}

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
 * POPOVER: gõ ngày hoặc bấm lịch tháng (đổi tháng/năm), không dropdown hàng chục tuần (sổ §13.8).
 * Vẽ qua PORTAL ra `document.body` với `position: fixed` — nên `Drawer`/modal (cắt nội dung bằng
 * `overflow`) không cắt được nó. Mã tuần HIỆN RA dạng `W3 SEP` qua `tuanLich` (G-6 — chỉ thêm năm khi khác năm), không có
 * hàm tính tuần thứ hai ở đây.
 */
export function WeekPicker({ periodId, onPeriod, label = 'Tuần', scope, clearable }: {
  periodId: number | null; onPeriod: (id: number | null) => void;
  label?: string | null;
  /** 'planning' mở cửa sổ tuần XA về tương lai — xếp lịch MT là việc của tương lai. */
  scope?: 'planning';
  /**
   * Cho phép BỎ TRỐNG. Chỉ bật ở những chỗ mà "chưa biết" là một câu trả lời hợp lệ —
   * tuần dự kiến thi là ví dụ: ép chọn thì người ta chọn bừa rồi không ai sửa lại.
   */
  clearable?: boolean;
}) {
  const { session } = useSession();
  const toast = useToast();
  /*
   * `demoDate` là NGUỒN DUY NHẤT cho "hôm nay" (sổ §13.8: demo dùng ngày demo, thật dùng hôm
   * nay thực tế — cả hai đều đi qua trường này, KHÔNG đọc đồng hồ trình duyệt). Component này
   * chỉ render sau khi phiên đăng nhập đã tải (App.tsx chặn trước đó), nên `session` luôn có.
   */
  const today = session?.demoDate ?? '';
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

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [calYear, setCalYear] = useState(() => owningMonthOf(shown?.weekStart ?? todayWeekStart).year);
  const [calMonth, setCalMonth] = useState(() => owningMonthOf(shown?.weekStart ?? todayWeekStart).month);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  /** Đặt popover bám dưới trường tuần, kẹp trong màn hình; hết chỗ phía dưới thì lật lên trên. */
  const place = useCallback(() => {
    const el = field.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    const height = pop.current?.offsetHeight ?? 420;
    const below = r.bottom + 4;
    const top = below + height > window.innerHeight && r.top - height - 4 > 8 ? r.top - height - 4 : below;
    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place, calMonth, calYear]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const t = e.target as Node;
      if (box.current?.contains(t) || pop.current?.contains(t)) return;
      setOpen(false);
    };
    /*
     * ESC CHỈ ĐÓNG POPOVER, không đóng luôn `Drawer`/modal đang chứa nó: nghe ở pha bắt (capture)
     * và chặn lan, nên listener bấm-Esc-đóng-ngăn-kéo ở pha nổi không nhận được sự kiện này.
     */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      field.current?.focus();
    };
    const reposition = () => place();
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, place]);

  // Mở popover thì lịch neo lại đúng tháng đang xem — không giữ tháng của lần mở trước.
  useEffect(() => {
    if (!open) return;
    const om = owningMonthOf(shown?.weekStart ?? todayWeekStart);
    setCalYear(om.year); setCalMonth(om.month);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ neo lại MỖI LẦN MỞ, cố ý bỏ qua shown/todayWeekStart
  }, [open]);

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

  const prevMonth = () => setCalMonth((m) => {
    if (m === 1) { setCalYear((y) => y - 1); return 12; }
    return m - 1;
  });
  const nextMonth = () => setCalMonth((m) => {
    if (m === 12) { setCalYear((y) => y + 1); return 1; }
    return m + 1;
  });

  /** Gợi ý tuần gần đây: hôm nay và ba tuần trước — không cần gõ/bấm lịch cho việc hay gặp nhất. */
  const recent = [0, -1, -2, -3].map((n) => addDaysStr(todayWeekStart, 7 * n));

  return (
    <div className="block min-w-0" ref={box}>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap items-stretch gap-2">
        {/* NHÓM KHÔNG TÁCH HÀNG: mũi tên · trường tuần · mũi tên. */}
        <div className="flex flex-1 basis-[17rem] min-w-0 items-stretch gap-2">
          <button
            type="button" className="btn flex-none h-10 px-3" disabled={busy}
            onClick={() => goAdjacent(-1)} aria-label="Tuần trước"
            title={shown ? `Tuần trước · ${tuanLich(addDaysStr(shown.weekStart, -7), today)}` : 'Tuần trước'}
          >‹</button>
          <button
            ref={field} type="button"
            className="field flex-1 min-w-0 h-10 text-left flex items-center justify-between gap-2"
            aria-haspopup="dialog" aria-expanded={open}
            onClick={() => setOpen((v) => !v)} disabled={busy}
          >
            {shown ? (
              <>
                <span className="text-slate-100 truncate">{rangeOf(shown.weekStart)}</span>
                <span className="text-slate-500 text-xs shrink-0">{tuanLich(shown.weekStart, today)}</span>
              </>
            ) : (
              <span className="text-slate-500">{clearable ? 'Chưa xác định' : 'Đang tải…'}</span>
            )}
          </button>
          <button
            type="button" className="btn flex-none h-10 px-3" disabled={busy}
            onClick={() => goAdjacent(1)} aria-label="Tuần sau"
            title={shown ? `Tuần sau · ${tuanLich(addDaysStr(shown.weekStart, 7), today)}` : 'Tuần sau'}
          >›</button>
        </div>
        <button type="button" className="btn flex-none h-10" disabled={busy} onClick={() => void pick(todayWeekStart)}>
          Tuần này
        </button>
        {clearable && shown && (
          <button type="button" className="btn btn-ghost flex-none h-10" onClick={() => onPeriod(null)}>Bỏ chọn</button>
        )}
      </div>

      {open && createPortal(
        <div
          ref={pop} role="dialog" aria-label="Chọn tuần"
          className="fixed z-[70] surface-2 rounded-lg border shadow-xl p-3"
          style={{
            borderColor: 'var(--line-strong)',
            top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? 320,
            /* Chưa đo xong vị trí thì ẩn — không nhấp nháy ở góc trên trái. */
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          <label className="block mb-2">
            <span className="label">Gõ ngày</span>
            <input
              type="date" className="field"
              onChange={(e) => { if (e.target.value) void pick(mondayOfDate(e.target.value)); }}
            />
          </label>

          <div className="flex items-center justify-between mb-2">
            <button type="button" className="btn btn-sm px-2" onClick={prevMonth} aria-label="Tháng trước">‹</button>
            <span className="text-sm text-slate-200">Tháng {calMonth}/{calYear}</span>
            <button type="button" className="btn btn-sm px-2" onClick={nextMonth} aria-label="Tháng sau">›</button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-[11px] text-slate-500 mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="space-y-0.5">
            {monthGrid(calYear, calMonth).map((row) => (
              <div
                key={row[0]}
                className={`grid grid-cols-7 gap-0.5 rounded ${shown && row[0] === shown.weekStart ? 'bg-white/10' : ''}`}
              >
                {row.map((d) => {
                  const inMonth = d.slice(0, 4) === String(calYear) && d.slice(5, 7) === String(calMonth).padStart(2, '0');
                  const isToday = d === today;
                  return (
                    <button
                      key={d} type="button" disabled={busy}
                      className={`text-center rounded py-0.5 hover:bg-white/10 ${inMonth ? 'text-slate-200' : 'text-slate-600'} ${isToday ? 'font-semibold underline' : ''}`}
                      onClick={() => void pick(mondayOfDate(d))}
                    >{Number(d.slice(8, 10))}</button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[11px] text-slate-500 w-full mb-0.5">Gần đây</span>
            {recent.map((ws, i) => (
              <button key={ws} type="button" className="btn btn-sm" disabled={busy} onClick={() => void pick(ws)}>
                {i === 0 ? 'Tuần này' : rangeOf(ws)}
              </button>
            ))}
          </div>
        </div>,
        document.body,
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
