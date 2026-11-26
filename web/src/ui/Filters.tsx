import { useEffect, useRef, useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { api } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { addDaysStr } from '../lib/format.ts';
import { mondayOfDate, ngay, tuanLich } from '@shared/domain/index.ts';
import { LichNho } from './LichNho.tsx';
import { t } from '@shared/i18n/index.ts';
/* TOC-DO-2511: chi nhánh mặc định / nhớ ở `chiNhanhMacDinh.ts` (App + badge dùng — gói đầu không kéo lịch); xuất lại cho nơi cũ. */
export { docChiNhanhDaNho, nhoChiNhanh, useChiNhanhMacDinh } from './chiNhanhMacDinh.ts';
import { nhoChiNhanh } from './chiNhanhMacDinh.ts';

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
export function WeekPicker({ periodId, onPeriod, label = t('Tuần'), scope, clearable, toiThieu, gon }: {
  periodId: number | null; onPeriod: (id: number | null) => void;
  /** UI-LICH-TUAN (dieu-chinh-cuoi khu a): một cụm nhỏ "‹ [W3 SEP 14/09 – 20/09] ›" trong thanh của thẻ — không nhãn; "Về tuần này" chỉ khi đang xem tuần khác. */
  gon?: boolean;
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
      toast.push('error', e.message ?? t('Không đổi được tuần — thử lại.'));
    } finally {
      setBusy(false);
    }
  }

  function goAdjacent(deltaWeeks: number) {
    const base = shown?.weekStart ?? todayWeekStart;
    void pick(addDaysStr(base, 7 * deltaWeeks));
  }

  const lui = shown ? t('Tuần trước · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, -7), today) }) : t('Tuần trước');
  const toi = shown ? t('Tuần sau · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, 7), today) }) : t('Tuần sau');
  const lich = open && (
    <LichNho kieu="tuan" goNgay value={shown?.weekStart ?? null} homNay={today} luat={toiThieu ? { toiThieu } : {}} neo={field}
      onChon={(t2) => { if (!busy) void pick(t2); }} onDong={() => setOpen(false)} />
  );
  if (gon) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" className="btn btn-sm h-9 w-9 flex-none justify-center !px-0 max-sm:h-11 max-sm:w-11" disabled={busy || (!!toiThieu && !!shown && shown.weekStart <= toiThieu)}
          onClick={() => goAdjacent(-1)} aria-label={lui} title={lui}>‹</button>
        <button ref={field} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} disabled={busy}
          className="field inline-flex h-9 w-auto min-w-0 items-baseline gap-2.5 !px-3 tabular-nums max-sm:h-11">
          {shown ? (
            <>
              <b className="whitespace-nowrap font-bold text-slate-100">{tuanLich(shown.weekStart, today)}</b>
              {/* 375: chỉ mã tuần (ô không xuống dòng); ngày trong lịch khi bấm. */}
              <span className="whitespace-nowrap text-xs text-slate-500 max-sm:hidden">{khoangTuan(shown.weekStart)}</span>
            </>
          ) : <span className="text-slate-500">{t('Đang tải…')}</span>}
        </button>
        <button type="button" className="btn btn-sm h-9 w-9 flex-none justify-center !px-0 max-sm:h-11 max-sm:w-11" disabled={busy}
          onClick={() => goAdjacent(1)} aria-label={toi} title={toi}>›</button>
        {/* UI-CON-LAI k2: MỘT kiểu chọn tuần "‹ W3 SEP › Tuần này" — nút luôn ở chỗ cũ, khoá khi đang xem tuần này (không nhảy bố cục). */}
        {todayWeekStart && (
          <button type="button" className="btn btn-sm h-9 flex-none whitespace-nowrap max-sm:h-11" disabled={busy || shown?.weekStart === todayWeekStart}
            onClick={() => void pick(todayWeekStart)}>{t('Tuần này')}</button>
        )}
        {lich}
      </div>
    );
  }

  return (
    <div className="block min-w-0">
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap items-stretch gap-2">
        {/* NHÓM KHÔNG TÁCH HÀNG: mũi tên · trường tuần · mũi tên. */}
        <div className="flex flex-1 basis-[18.5rem] min-w-0 items-stretch gap-2">
          <button
            type="button" className="btn flex-none h-11 px-3" disabled={busy || (!!toiThieu && !!shown && shown.weekStart <= toiThieu)}
            onClick={() => goAdjacent(-1)} aria-label={shown ? t('Tuần trước · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, -7), today) }) : t('Tuần trước')}
            title={shown ? t('Tuần trước · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, -7), today) }) : t('Tuần trước')}
          >‹</button>
          <button
            ref={field} type="button"
            className="field flex-1 min-w-0 h-11 text-left flex items-center justify-between gap-2 tabular-nums"
            aria-haspopup="dialog" aria-expanded={open}
            onClick={() => setOpen((v) => !v)} disabled={busy}
          >
            {shown ? (
              <>
                <span className="shrink-0 whitespace-nowrap text-slate-100">{tuanLich(shown.weekStart, today)}</span>
                <span className="min-w-0 truncate text-slate-500 text-xs">{khoangTuan(shown.weekStart)}</span>
              </>
            ) : (
              <span className="text-slate-500">{clearable ? t('Chưa xác định') : t('Đang tải…')}</span>
            )}
          </button>
          <button
            type="button" className="btn flex-none h-11 px-3" disabled={busy}
            onClick={() => goAdjacent(1)} aria-label={shown ? t('Tuần sau · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, 7), today) }) : t('Tuần sau')}
            title={shown ? t('Tuần sau · {tuan}', { tuan: tuanLich(addDaysStr(shown.weekStart, 7), today) }) : t('Tuần sau')}
          >›</button>
        </div>
        <button type="button" className="btn flex-none h-11" disabled={busy} onClick={() => void pick(todayWeekStart)}>
          {t('Tuần này')}
        </button>
        {clearable && shown && (
          <button type="button" className="btn btn-ghost flex-none h-11" onClick={() => onPeriod(null)}>{t('Bỏ chọn')}</button>
        )}
      </div>

      {lich}
    </div>
  );
}

/** Khoảng ngày của tuần (Thứ Hai `t2`): năm ghi một lần ở cuối khi cùng năm — "14/09 – 20/09/2026" (như nhãn khoảng `khoangThoiGian`). */
const khoangTuan = (t2: string) => { const cn = addDaysStr(t2, 6); return `${t2.slice(0, 4) === cn.slice(0, 4) ? ngay(t2).slice(0, 5) : ngay(t2)} – ${ngay(cn)}`; };

/**
 * Chỉ chọn chi nhánh, không có tuần — dùng ở những màn nói về TÌNH TRẠNG HIỆN TẠI
 * chứ không phải kết quả của một tuần. Vẫn tự ẩn khi tài khoản chỉ có một chi nhánh.
 */
export function BranchFilter({ branchId, onBranch, hetHang = false, luon = false }: {
  branchId: number | null; onBranch: (id: number | null) => void;
  /** VAI-1 (N77): BPXL xếp lịch mọi chi nhánh — hiện ô dù tài khoản chỉ gán một chi nhánh. */
  luon?: boolean;
  /** Tổng quan (PTA rà #1710, mockup ⑧ T7): 375 ô rộng cả hàng, mũi tên nét mảnh như ô chọn chung (`OChonThuong`). */
  hetHang?: boolean;
}) {
  const branches = useApi<Branch[]>('/ref/branches');
  const { session, branchCount } = useSession();
  if ((branches.data?.length ?? 0) <= 1 || (branchCount <= 1 && !luon)) return null;
  return <OChiNhanh branches={branches.data ?? []} branchId={branchId} hetHang={hetHang}
    onBranch={(id) => { nhoChiNhanh(session?.user?.id, id); onBranch(id); }} />;
}

/**
 * D3 CHON-CHI-NHANH (chủ SP 27/10): ô chọn chi nhánh gọn — nhãn nằm TRONG ô bên trái, cao 32 (điện thoại 44) bằng nút lọc / công tắc
 * cùng hàng, chữ 13 / 600. Một mẫu cho mọi trang (không nhãn chồng trên ô như `.label` + `.field` cũ).
 */
export function OChiNhanh({ branches, branchId, onBranch, tatCa = true, hetHang = false }: {
  branches: Branch[]; branchId: number | null; onBranch: (id: number | null) => void;
  hetHang?: boolean;
  /** HV & Lớp: phạm vi "Tất cả" nằm ở ô Phạm vi riêng — ô này chỉ chọn một chi nhánh. */
  tatCa?: boolean;
}) {
  return (
    <label className={`inline-flex h-8 shrink-0 cursor-pointer items-center rounded-lg border border-[var(--o-nhap-vien)] bg-[var(--o-nhap-nen)] text-[13px] font-semibold focus-within:border-[var(--accent)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] max-sm:min-h-[44px] ${hetHang ? 'relative max-sm:w-full' : ''}`}>
      <span className="whitespace-nowrap pl-2.5 pr-1.5 text-slate-400">{t('Chi nhánh')}</span>
      <select className={`min-w-0 cursor-pointer self-stretch max-sm:min-h-[44px] rounded-r-lg border-0 bg-[var(--o-nhap-nen)] py-0 pl-1 font-semibold text-slate-100 outline-none ${hetHang ? 'flex-1 appearance-none pr-8' : 'pr-2'}`}
        value={branchId ?? ''} onChange={(e) => onBranch(e.target.value ? Number(e.target.value) : null)}>
        {tatCa && <option value="">{t('Tất cả')}</option>}
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      {/* hetHang: mũi tên nét mảnh như `OChonThuong` (⑤ A6) thay mũi tên gốc của trình duyệt. */}
      {hetHang && <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4" /></svg>}
    </label>
  );
}

