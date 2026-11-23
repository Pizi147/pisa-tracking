import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { hoanTacXoa } from '../../lib/thungRac.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, Field, Forbidden, NhanTrangThai, NutChon, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BranchFilter, resolveWeek, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChonNguoi, type NguoiTrongDs, type TimXa } from '../../ui/PeoplePicker.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { TepCho, taiTepCho, type TepChoMuc } from '../../ui/TepCho.tsx';
import { DaiChiSo, ODai, SoTinh } from '../../ui/DaiChiSo.tsx';
import { mauOSo } from '../../ui/SoLieu.tsx';
import { docGap, ghiGap } from '../congViec/DanhSachViec.tsx';
import { KhoiGiaoViec, type KhoiGv, type ThaoTacKhoi } from '../congViec/KhoiGiaoViec.tsx';
import { HopNhomViec, KHONG_PHAN_LOAI, OHangMuc, OLocNhom, tenHangMuc, type NhomViec, type NoiViec } from './NhomViec.tsx';
import { fmtDate } from '../../lib/format.ts';
import { dich, t } from '@shared/i18n/index.ts';
import {
  ENTRY_SKILLS, ENTRY_SKILL_LABEL, HANG_MUC_CV, HANG_SO, HANG_SO_LABEL, TASK_PROGRESS, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, TRANG_THAI_LOC, catDongPhu, dongHanDaDoi, dsLoi, duocGiao, giaTriDauGiaoViec, moiKhoaGui,
  trangThaiKyGiao, tuanLich, quyCheViecGiao, quyCheViecLap,
  type HangSo, type LoiTruong, type NguoiChon, type TrangThai, type TrangThaiLoc, ngay,
} from '@shared/domain/index.ts';

/** VH-1: lặp lại của việc gốc — `ngay`: thứ ISO (T2 = 1 … CN = 7) hoặc MỘT ngày trong tháng. */
type Lap = { kieu: 'tuan' | 'thang'; ngay: number[]; dung?: boolean; gocId?: number; ky?: string | null };
type Nguoi = { id: number; ten: string | null };

type Row = {
  id: number; code: string; title: string; taskType: string;
  /** VH-1: nhóm tự đặt (null = Không phân loại) · VH-1b: hạng mục chính thống, lớp liên quan. */
  groupId: number | null; groupName: string | null; hangMuc: string | null; classCode: string | null;
  canEdit: boolean;
  branchId: number | null; branchName: string;
  assigneeUserId: number | null; assigneeName: string | null;
  /** PR-DUYET: tên gõ tay, không phải tài khoản. */
  assigneeNgoai?: boolean;
  theoDoi: Nguoi[]; lap: Lap | null; soTep: number;
  due: string | null; progress: string; progressLabel: string;
  stopReason: string | null; reviewOn: string | null;
  helpUserId: number | null; helpName: string | null;
  overdue: boolean; subTotal: number; subDone: number; subOpen: number;
  subOverdue: boolean; subOverdueCount: number; subOverdueTitles: string[];
  caseLinks: number;
  hanGoc: string | null; lyDoDoiHan: string | null; soLanDoiHan: number;
};

/**
 * Trạng thái việc Vận hành vẽ bằng NHÃN CHUNG (`NhanTrangThai`, brainstorm C.2 — K1-35/V4): kiểu nhãn theo họ chung, chữ giữ bộ chữ riêng
 * của việc (THUAT_NGU C-069…C-073, chủ sản phẩm 02/10 — "Đã dừng" là nhãn khoá học của HV nên không dùng cho việc).
 */
/** A2-10 (AUDIT-2111): MỘT nhãn "Mô tả việc" + MỘT trần (500, như khối N58 — máy chủ cùng số); chữ cũ dài hơn giữ nguyên tới khi sửa (N35). */
const TRAN_MO_TA = 500;
const NHAN: Record<string, TrangThai> = { not_started: 'can-lam', doing: 'dang-lam', paused: 'cho-duyet', stopped: 'da-huy', done: 'xong' };
const NhanViec = ({ progress, label }: { progress: string; label: string }) => <NhanTrangThai t={NHAN[progress] ?? 'can-lam'} chu={dich(label)} />;
const dong = (pr: string) => pr === 'done' || pr === 'stopped';
/** Hạn của việc / việc con: viên hạn (`.han-v`); việc đã khép chỉ còn ngày, không đếm quá hạn. */
const HanO = ({ han, xong }: { han: string; xong: boolean }) => (xong
  ? <span className="text-xs tabular-nums text-faint">{fmtDate(han)}</span> : <ChipHan vien loai="viec-van-hanh" han={han} />);

const TRANG_THAI_LABEL: Record<TrangThaiLoc, string> = { mo: t('Đang mở'), ...TASK_PROGRESS_LABEL, 'tat-ca': t('Mọi trạng thái') };

const THU_NGAN = [t('T2'), t('T3'), t('T4'), t('T5'), t('T6'), t('T7'), t('CN')];
const THU_DU = [t('thứ Hai'), t('thứ Ba'), t('thứ Tư'), t('thứ Năm'), t('thứ Sáu'), t('thứ Bảy'), t('Chủ nhật')];
/** "hằng tuần · thứ Hai" / "hằng tháng · ngày 25" (V1 dòng phụ, V3 dòng Lặp lại). */
const chuLap = (l: Pick<Lap, 'kieu' | 'ngay'>, ngan = false) => (l.kieu === 'tuan'
  ? ngan ? t('hằng tuần') : t('hằng tuần · {thu}', { thu: l.ngay.map((n) => THU_DU[n - 1]).join(', ') })
  : ngan ? t('hằng tháng') : t('hằng tháng · ngày {n}', { n: l.ngay[0] }));
/** Kỳ tới (sau hôm nay) của một lịch lặp — "bản tới 21/09" (V3). Hằng tháng ngày 31 → ngày cuối tháng ngắn (như hàm đêm). */
function kyToi(l: Pick<Lap, 'kieu' | 'ngay'>, homNay: string): string {
  const d = new Date(`${homNay}T00:00:00Z`);
  for (let i = 1; i <= 62; i++) {
    const x = new Date(d.getTime() + i * 86_400_000);
    const iso = x.toISOString().slice(0, 10);
    if (l.kieu === 'tuan' && l.ngay.includes(((x.getUTCDay() + 6) % 7) + 1)) return iso;
    if (l.kieu === 'thang') {
      const cuoi = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
      if (x.getUTCDate() === Math.min(l.ngay[0], cuoi)) return iso;
    }
  }
  return homNay;
}

const IcLap = () => <svg aria-hidden viewBox="0 0 16 16" className="h-[13px] w-[13px] shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a5 5 0 0 1 8.6-3.4L13 5M13 2v3h-3M13 9a5 5 0 0 1-8.6 3.4L3 11M3 14v-3h3" /></svg>;
const IcTep = () => <svg aria-hidden viewBox="0 0 16 16" className="h-[13px] w-[13px] shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 4.5l-5 5a1.5 1.5 0 0 0 2 2l5.5-5.5a3 3 0 0 0-4-4L3.5 7.5a4.2 4.2 0 0 0 6 6l4-4" /></svg>;
const Chev = ({ mo }: { mo: boolean }) => (
  <svg aria-hidden viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 fill-none stroke-current text-dim transition-transform ${mo ? 'rotate-90' : ''}`} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
);

/* Hàng nhóm của bảng: `g:<id>` nhóm tự đặt (thứ tự Head sắp) → `m:<khoá>` hạng mục chính thống (N62) → `none` Không phân loại (luôn cuối). */
type Phan = { khoa: string; ten: string; rows: Row[]; khongPl?: boolean };
function chiaPhan(rows: Row[], nhom: readonly NhomViec[]): Phan[] {
  const ra: Phan[] = nhom.map((g) => ({ khoa: `g:${g.id}`, ten: g.ten, rows: rows.filter((r) => !r.hangMuc && r.groupId === g.id) }));
  for (const [k] of HANG_MUC_CV) ra.push({ khoa: `m:${k}`, ten: tenHangMuc(k), rows: rows.filter((r) => r.hangMuc === k) });
  ra.push({ khoa: 'none', ten: t('Không phân loại'), khongPl: true, rows: rows.filter((r) => !r.hangMuc && (r.groupId === null || !nhom.some((g) => g.id === r.groupId))) });
  return ra.filter((p) => p.rows.length > 0);
}

/**
 * TIẾN ĐỘ CÔNG VIỆC VẬN HÀNH (V1, N59) — MỘT bảng chia theo nhóm tự đặt + hạng mục (N62) + "Không phân loại" cuối; hàng nhóm là `<tr>` trong thân bảng
 * (cả hàng là nút gập / mở, nhớ theo người — N60), tiêu đề cột không có điều khiển (G9). GIỮ: dải 4 số bấm lọc (chồng nhau có chủ ý, Q8), lọc chi nhánh ·
 * Nhóm · Trạng thái · Người phụ trách, bấm dòng mở panel. MỘT request `/mgmt-tasks` (nhóm trả kèm); 375: mỗi việc một thẻ, không cuộn ngang (V6c).
 */
export function TasksBoard({ dau }: { /** Tiêu đề trang (nơi gọi) — đứng cùng hàng "Nhóm…" · "+ Giao việc" (V1). */ dau?: ReactNode }) {
  const { session, branchCount } = useSession();
  const uid = session?.user?.id ?? null;
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* `nhom`: id nhóm · `none` · `m:<hạng mục>` · khoá nhóm khởi đầu (đường dẫn cũ, vd Báo cáo đơn vị) — máy chủ vẫn nhận `group=<khoá>`. */
  const nhomP = params.get('nhom') ?? '';
  const progress: TrangThaiLoc = (TRANG_THAI_LOC as readonly string[]).includes(params.get('trangThai') ?? '')
    ? (params.get('trangThai') as TrangThaiLoc) : 'mo';
  const hang: HangSo | null = (HANG_SO as readonly string[]).includes(params.get('hang') ?? '') ? (params.get('hang') as HangSo) : null;
  const phuTrachParam = params.get('phuTrach');
  const assigneeUserId = phuTrachParam === 'toi' ? uid : (phuTrachParam ? Number(phuTrachParam) : null);

  /*
   * MỞ THẲNG TỪ ĐƯỜNG DẪN (mục 14.2): báo cáo kỳ họp liên kết sang đây để mở/tạo việc ngay.
   * Đọc một lần lúc vào màn, rồi xoá tham số khỏi URL để nút Back không mở lại hộp thoại.
   */
  const [open, setOpen] = useState<number | null>(params.get('open') ? Number(params.get('open')) : null);
  const [creating, setCreating] = useState(params.get('tao') === '1');
  const [preGroup] = useState(params.get('tao') === '1' ? nhomP : '');
  const baoCaoId = params.get('baoCao') ? Number(params.get('baoCao')) : null;
  const veKyHop = params.get('periodId');
  useEffect(() => {
    if (!params.get('open') && !params.get('tao')) return;
    const next = new URLSearchParams(params);
    next.delete('open'); next.delete('tao');
    if (params.get('tao')) next.delete('nhom');   // nhóm của lối "tạo từ báo cáo" chỉ điền form, không lọc bảng
    setParams(next, { replace: true });
  }, [params, setParams]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const locNhom = creating && preGroup ? '' : nhomP;
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (/^\d+$/.test(locNhom)) qs.set('groupId', locNhom);
  else if (locNhom === 'none' || locNhom.startsWith('m:')) qs.set('groupId', 'none');
  else if (locNhom) qs.set('group', locNhom);
  qs.set('progress', progress);
  if (hang) qs.set('hang', hang);
  if (assigneeUserId) qs.set('assigneeUserId', String(assigneeUserId));
  const { data, loading, error, reload } = useApi<{
    rows: Row[]; canEdit: boolean; scopeEmpty: boolean;
    facets: { progress: Record<string, number>; hang: Record<string, number> };
    hangSo: Record<string, number>; nhom: NhomViec[]; khongPhanLoai: number;
  }>(`/mgmt-tasks?${qs}`, [qs.toString()]);

  /* GAP-MO (N60): hàng nhóm gập / mở nhớ theo người (mặc định mở). */
  const khoaGap = uid != null ? `pisa.cv.gap.u${uid}:van-hanh-bang` : null;
  const [gap, setGap] = useState(() => docGap(khoaGap));
  const doiGap = (k: string) => { const s = new Set(gap); if (s.has(k)) s.delete(k); else s.add(k); setGap(s); ghiGap(khoaGap, s); };
  /* Nhóm mới thuộc chi nhánh đang lọc; lọc "mọi chi nhánh" mà người dùng chỉ quản MỘT chi nhánh → chi nhánh đó (nhóm dùng chung chỉ quyền toàn hệ thống tạo). */
  const cnGrant = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  const cnMot = cnGrant.length === 1 && cnGrant[0] != null ? cnGrant[0] : null;
  const nutNhom = useRef<HTMLButtonElement>(null);
  const nutNhom375 = useRef<HTMLButtonElement>(null);
  const [hopNhom, setHopNhom] = useState<'rong' | 'hep' | null>(null);

  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (data?.scopeEmpty) {
    return (
      <Forbidden
        message={t('Phần này dành cho Quản trị hệ thống, Head và CX chi nhánh')}
        hint={t('Việc được giao cho bạn hiện ở Công việc và mở được từ thông báo.')}
      />
    );
  }

  /* `none` / hạng mục: máy chủ lọc "không nhóm", web tách tiếp theo hạng mục — dữ liệu đã nạp, không request thêm. */
  const rows = (data?.rows ?? []).filter((r) => (locNhom === 'none' ? !r.hangMuc : locNhom.startsWith('m:') ? r.hangMuc === locNhom.slice(2) : true));
  const nhom = data?.nhom ?? [];
  const phan = chiaPhan(rows, nhom);
  const hangSo = data?.hangSo ?? {};
  const assigneeValue: NguoiChon | null = phuTrachParam === 'toi'
    ? { kieu: 'toi' }
    : assigneeUserId
      ? { kieu: 'tai_khoan', id: assigneeUserId, ten: rows.find((r) => r.assigneeUserId === assigneeUserId)?.assigneeName ?? `#${assigneeUserId}` }
      : null;
  const hangMucCo = HANG_MUC_CV.filter(([k]) => locNhom === `m:${k}` || rows.some((r) => r.hangMuc === k));
  const quaHan = (ds: Row[]) => ds.filter((r) => r.overdue).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {dau}
        {data?.canEdit && (
          <span className="ml-auto flex items-center gap-2">
            <button ref={nutNhom} type="button" className="btn max-sm:hidden" aria-haspopup="dialog" aria-expanded={hopNhom === 'rong'} onClick={() => setHopNhom('rong')}>{t('Nhóm…')}</button>
            <button ref={nutNhom375} type="button" className="btn min-h-[44px] min-w-[44px] justify-center px-0 sm:hidden" aria-label={t('Nhóm công việc')} aria-haspopup="dialog"
              aria-expanded={hopNhom === 'hep'} onClick={() => setHopNhom('hep')}>⋯</button>
            <button type="button" className="btn btn-primary max-sm:min-h-[44px]" onClick={() => setCreating(true)}>{t('+ Giao việc')}</button>
          </span>
        )}
      </div>

      {/* ── dải 4 số: bốn câu hỏi CHỒNG NHAU (Q8), mỗi số là một nút lọc; bấm lại = bỏ lọc ── */}
      <div data-hd="vh-so"><DaiChiSo nhan={t('Chỉ số việc vận hành')} className="dai-vh">
        {HANG_SO.map((h) => {
          const n = hangSo[h] ?? 0;
          const active = hang === h;
          return (
            <ODai key={h} nhan={HANG_SO_LABEL[h]}>
              {n === 0 && !active ? <SoTinh n={0} /> : (
                <button type="button" aria-pressed={active}
                  className={`${mauOSo(h === 'qua-han' ? 'text-bad' : '')} text-[14px] ${active ? 'rounded bg-[color:var(--accent-soft)] px-1' : ''}`}
                  onClick={() => {
                    /*
                     * "Vừa hoàn thành" là việc ĐÃ KHÉP — Trạng thái mặc định "Đang mở" thì lọc còn 0 dòng dù hàng số > 0 (G-10). Bấm hàng số nào cũng
                     * chuyển Trạng thái về "Tất cả" luôn. Gộp một lần `setParams` (gọi `setParam` liên tiếp dựa trên `params` cũ, mất thay đổi trước).
                     */
                    const next = new URLSearchParams(params);
                    if (active) { next.delete('hang'); } else { next.set('hang', h); next.set('trangThai', 'tat-ca'); }
                    setParams(next, { replace: true });
                  }}>{n}{active && <span aria-hidden className="ml-1 no-underline">✕</span>}</button>
              )}
            </ODai>
          );
        })}
      </DaiChiSo></div>

      <section className="overflow-clip rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }} aria-label={t('Việc vận hành')}>
        <div className="flex min-h-[52px] flex-wrap items-center gap-2.5 border-b px-4 py-2" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 text-[16px] font-bold text-slate-100">{t('Việc vận hành')}</h2>
          <span className="text-sm text-dim">{t('{n} việc', { n: rows.length })}</span>
          <span className="ml-auto"><BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} /></span>
        </div>
        {/* ── hàng lọc: Nhóm · Trạng thái · Người phụ trách (§18.4) ── */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-2.5 text-[13px] text-dim" style={{ borderColor: 'var(--line)' }}>
          {/* A2-06 (AUDIT-2111): ô Nhóm có tìm (N45 — danh sách dài, không cố định); Trạng thái giữ ô thường (5 mục cố định). */}
          <div className="flex items-center gap-2 whitespace-nowrap max-sm:w-full">
            <span>{t('Nhóm')}</span>
            <span className="w-[220px] max-sm:min-w-0 max-sm:flex-1"><OLocNhom nhom={nhom} hangMuc={hangMucCo.map(([k]) => k)} value={locNhom} onChange={(v) => setParam('nhom', v)} /></span>
          </div>
          <label className="flex items-center gap-2 whitespace-nowrap">
            {t('Trạng thái')}
            <select className="field" value={progress} onChange={(e) => setParam('trangThai', e.target.value === 'mo' ? null : e.target.value)}>
              {TRANG_THAI_LOC.map((tt) => (
                <option key={tt} value={tt}>{TRANG_THAI_LABEL[tt]} ({data?.facets.progress[tt] ?? 0})</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2 max-sm:w-full">
            <span className="shrink-0">{t('Người phụ trách')}</span>
            <div className="w-60 max-sm:min-w-0 max-sm:flex-1">
              <ChonNguoi value={assigneeValue}
                onChange={(v) => setParam('phuTrach', v?.kieu === 'toi' ? 'toi' : v?.kieu === 'tai_khoan' ? String(v.id) : null)}
                nhom="nhan_vien" choNgoai={false} macDinhTrong={t('Mọi người')} ariaLabel={t('Lọc theo người phụ trách')} />
            </div>
          </div>
        </div>

        {loading && !data && <div className="p-4"><Skeleton rows={5} /></div>}
        {data && rows.length === 0 && (
          <div className="p-4"><Empty title={t('Không có công việc nào khớp bộ lọc')} /></div>
        )}
        {rows.length > 0 && (
          <>
            {/* ≥ 640 px: bảng 5 cột (V1). */}
            <table className="bang-dinh w-full text-sm max-sm:hidden" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <colgroup><col /><col style={{ width: 200 }} /><col style={{ width: 150 }} /><col style={{ width: 170 }} /><col style={{ width: 150 }} /></colgroup>
              <thead>
                <tr className="text-left text-xs font-semibold text-faint">
                  {[t('Việc'), t('Người phụ trách'), t('Hạn'), t('Trạng thái'), t('Việc con')].map((h, i) => (
                    <th key={h} scope="col" className={`whitespace-nowrap border-b py-2 pr-3 font-semibold ${i ? 'pl-3' : 'pl-4'}`} style={{ borderColor: 'var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phan.map((p) => {
                  const mo = !gap.has(p.khoa);
                  return [
                    <tr key={p.khoa}>
                      <td colSpan={5} className="border-t p-0" style={{ borderColor: 'var(--line-strong)' }}>
                        <HangNhom p={p} mo={mo} qh={quaHan(p.rows)} onBam={() => doiGap(p.khoa)} />
                      </td>
                    </tr>,
                    ...(mo ? p.rows.map((r) => <DongBang key={r.id} r={r} chon={open === r.id} tatCa={branchId === null && branchCount > 1} homNay={homNay} toi={uid} onMo={() => setOpen(r.id)} />) : []),
                  ];
                })}
              </tbody>
            </table>
            {/* < 640 px: hàng nhóm giữ, mỗi việc một thẻ (V6c). */}
            <div className="sm:hidden">
              {phan.map((p) => {
                const mo = !gap.has(p.khoa);
                return (
                  <div key={p.khoa} className="border-t first:border-t-0" style={{ borderColor: 'var(--line-strong)' }}>
                    <HangNhom p={p} mo={mo} qh={quaHan(p.rows)} onBam={() => doiGap(p.khoa)} cao />
                    {mo && p.rows.map((r) => <TheViec key={r.id} r={r} chon={open === r.id} onMo={() => setOpen(r.id)} />)}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {hopNhom && (
        <HopNhomViec neo={hopNhom === 'rong' ? nutNhom : nutNhom375} nhom={nhom} branchId={branchId ?? cnMot}
          onDong={(doi) => { setHopNhom(null); (hopNhom === 'rong' ? nutNhom : nutNhom375).current?.focus(); if (doi) reload(); }} />
      )}
      <NganViecVanHanh taskId={open} onClose={() => setOpen(null)} onDone={reload} nhom={nhom} />
      <CreateTask open={creating} onClose={() => setCreating(false)} onDone={reload} nhom={data ? nhom : undefined}
        branchId={branchId} defaultGroup={preGroup || undefined} unitReportId={baoCaoId} veKyHop={veKyHop} />
    </div>
  );
}

/** Hàng nhóm (V1 `tr.nh`): cả hàng là nút — chevron sát tên, "n việc · m quá hạn" vẫn hiện khi gập; "Không phân loại" vạch xám. */
function HangNhom({ p, mo, qh, onBam, cao }: { p: Phan; mo: boolean; qh: number; onBam: () => void; cao?: boolean }) {
  return (
    <button type="button" aria-expanded={mo} onClick={onBam}
      className={`flex w-full flex-wrap items-center gap-x-2 gap-y-1 border-0 border-l-[3px] py-1.5 pl-[13px] pr-4 text-left text-[14px] font-bold text-slate-100 hover:bg-[color:var(--accent-soft)] ${cao ? 'min-h-[48px]' : 'min-h-[44px]'}`}
      style={{ background: 'var(--surface-2)', borderLeftColor: p.khongPl ? 'var(--text-faint)' : 'var(--accent)' }}>
      <span className="whitespace-nowrap">{p.ten}</span>
      <Chev mo={mo} />
      <span className="ml-1 inline-flex h-5 items-center whitespace-nowrap rounded border px-1.5 text-xs font-semibold tabular-nums text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('{n} việc', { n: p.rows.length })}</span>
      {qh > 0 && <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-late">{t('{n} quá hạn', { n: qh })}</span>}
    </button>
  );
}

/** Dòng phụ của việc: loại việc · ↻ lặp · số tệp · lớp liên quan · chi nhánh (khi xem mọi chi nhánh). */
function PhuViec({ r, tatCa }: { r: Row; tatCa?: boolean }) {
  const ds: ReactNode[] = [r.taskType === 'long_term' ? t('Dài hạn') : t('Trong kỳ')];
  if (r.lap && !r.lap.dung) ds.push(<span className="inline-flex items-center gap-1 text-dim"><IcLap />{chuLap(r.lap)}</span>);
  if (r.soTep > 0) ds.push(<span className="inline-flex items-center gap-1"><IcTep />{t('{n} tệp', { n: r.soTep })}</span>);
  if (r.classCode) ds.push(r.classCode);
  if (tatCa && r.branchName) ds.push(r.branchName);
  return <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-faint">{ds.map((x, i) => <span key={i} className="inline-flex items-center gap-1">{i > 0 && <span aria-hidden>·</span>}{x}</span>)}</span>;
}

/** "+n theo dõi" (V1): người theo dõi ngoài người phụ trách và chính người xem (người giao tự theo dõi — không đếm mình). */
const soTheoDoi = (r: Row, toi: number | null) => r.theoDoi.filter((x) => x.id !== r.assigneeUserId && x.id !== toi).length;
const bamDong = (onMo: () => void) => ({
  onClick: onMo, tabIndex: 0,
  onKeyDown: (e: React.KeyboardEvent) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onMo(); } },
});

function DongBang({ r, chon, tatCa, homNay, toi, onMo }: { r: Row; chon: boolean; tatCa: boolean; homNay: string; toi: number | null; onMo: () => void }) {
  /* A2-06: phần trống không ghi "cần: —" / "xem lại —" (chữ thừa bị kẹp cắt). */
  const dongTam = [r.stopReason, r.helpName && t('cần: {ten}', { ten: r.helpName }), r.reviewOn && t('hẹn xem lại {ngay}', { ngay: fmtDate(r.reviewOn) })].filter(Boolean).join(' · ');
  const phuTrangThai = r.progress === 'paused' ? catDongPhu(dongTam) : r.progress === 'stopped' ? r.stopReason : null;
  const td = 'border-t py-[9px] pl-3 pr-3 align-top';
  const n = soTheoDoi(r, toi);
  return (
    <tr className={`cursor-pointer hover:bg-[color:var(--accent-soft)] ${chon ? 'bg-[color:var(--accent-soft)]' : ''}`} aria-label={r.title} {...bamDong(onMo)}>
      <td className={`${td} pl-4`} style={{ borderColor: 'var(--line)', boxShadow: chon ? 'inset 3px 0 0 var(--accent)' : undefined }}>
        <span className="block font-medium text-slate-100" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</span>
        <PhuViec r={r} tatCa={tatCa} />
      </td>
      <td className={`${td} text-slate-200`} style={{ borderColor: 'var(--line)' }}>
        <span className="block truncate">{r.assigneeName ?? <span className="text-faint">{t('chưa giao')}</span>}</span>
        {r.assigneeNgoai && <span className="block text-xs text-faint">{t('ngoài hệ thống')}</span>}
        {n > 0 && <span className="mt-0.5 block text-xs text-faint">{t('+{n} theo dõi', { n })}</span>}
      </td>
      <td className={td} style={{ borderColor: 'var(--line)' }}>
        {r.due ? <HanO han={r.due} xong={dong(r.progress)} /> : <span className="text-xs text-faint">{t('Chưa có hạn')}</span>}
        {r.hanGoc && <div className="mt-0.5 truncate text-xs text-faint" title={dongHanDaDoi({ hanGoc: r.hanGoc, lyDo: r.lyDoDoiHan }, homNay) ?? undefined}>{dongHanDaDoi({ hanGoc: r.hanGoc, lyDo: null }, homNay)}</div>}
      </td>
      <td className={td} style={{ borderColor: 'var(--line)' }}>
        <NhanViec progress={r.progress} label={r.progressLabel} />
        {phuTrangThai && <div className="mt-0.5 text-xs text-faint" title={r.progress === 'paused' ? dongTam : r.stopReason ?? ''}>{phuTrangThai}</div>}
      </td>
      <td className={td} style={{ borderColor: 'var(--line)' }}>
        {r.subTotal > 0 ? <span className="text-slate-200">{t('{xong}/{tong} xong', { xong: r.subDone, tong: r.subTotal })}</span> : <span className="text-faint">—</span>}
        {r.subOverdueCount > 0 && <div className="mt-0.5 text-xs text-bad" title={r.subOverdueTitles.join(', ')}>{t('{n} việc con quá hạn', { n: r.subOverdueCount })}</div>}
      </td>
    </tr>
  );
}

/** 375 (V6c): thẻ việc — tên · người · việc con · lặp, rồi hạn + trạng thái. */
function TheViec({ r, chon, onMo }: { r: Row; chon: boolean; onMo: () => void }) {
  const phu = [r.assigneeName ?? t('chưa giao'), r.subTotal > 0 ? t('{xong}/{tong} việc con', { xong: r.subDone, tong: r.subTotal }) : null].filter(Boolean).join(' · ');
  return (
    <div role="button" aria-label={r.title} className={`grid gap-1 border-t px-3.5 py-2.5 ${chon ? 'bg-[color:var(--accent-soft)]' : ''}`} style={{ borderColor: 'var(--line)' }} {...bamDong(onMo)}>
      <span className="font-medium text-slate-100">{r.title}</span>
      <span className="flex flex-wrap items-center gap-x-1 text-xs text-faint">
        {phu}{r.lap && !r.lap.dung && <span className="inline-flex items-center gap-1 text-dim"> · <IcLap />{chuLap(r.lap, true)}</span>}
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-2">{r.due && <HanO han={r.due} xong={dong(r.progress)} />}<NhanViec progress={r.progress} label={r.progressLabel} /></span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── panel việc */

/** Chi tiết `/mgmt-tasks/:id` → khối Phụ trách · Hạn · Theo dõi (GV-2). Người giao = người tạo (N59: người giao tự theo dõi). */
function khoiCua(d: any): KhoiGv {
  const ten = d.assigneeName as string | null;
  return {
    loai: 'van_hanh', id: d.id, tieuDe: d.title, studentId: 0, mo: !dong(d.progress), branchId: d.branchId ?? null,
    phuTrach: ten ? [{ id: d.assigneeUserId ?? 0, ten }] : [], macDinh: [], duocGiao: !!d.createdBy,
    giaoBoi: d.createdBy ? { id: d.createdBy, ten: d.createdByName ?? null } : null, giaoLuc: null,
    han: d.due ?? null, hanMacDinh: null, hanChon: null, /* việc Vận hành: hạn người giao đặt, không "mặc định" theo luật */ coTheSuaHan: !!d.viewer?.canSuaHan,
    theoDoi: (d.theoDoi ?? []).map((x: any) => ({ id: x.id, ten: x.ten, nguon: x.nguon ?? '', vai: x.vai ?? null })), toiTheoDoi: false,
    coTheDoiNguoi: !!d.viewer?.canEdit && !dong(d.progress), coTheSuaTheoDoi: !!d.viewer?.canSuaTheoDoi && !dong(d.progress), hoanTacDuoc: false, lichSu: [],
    /* GV-3: việc Vận hành có ghi chú riêng (tasks.note) — không dòng Mô tả việc của khối. */ moTa: null, coTheSuaMoTa: false,
  };
}

/** VH-2 (V3): một dòng lịch sử máy chủ (`lichSu`) → chữ hiện. */
function dongLichSu(l: { truong: string; cu: string | null; moi: string | null; nguoi: string | null }): { tieu: string; phu: string | null; nguoi: string | null } {
  const doi = (a: string | null, b: string | null, chuTrong: string) => `${a ?? chuTrong} → ${b ?? chuTrong}`;
  switch (l.truong) {
    case 'giao': return { tieu: t('Giao việc'), phu: l.moi, nguoi: l.nguoi };
    case 'tao_ban_lap': return { tieu: t('Tạo bản lặp'), phu: l.moi, nguoi: t('Máy') };
    case 'assignee_user_id': return { tieu: t('Đổi người phụ trách'), phu: doi(l.cu, l.moi, t('chưa giao')), nguoi: l.nguoi };
    case 'group_id': return { tieu: t('Đổi nhóm'), phu: doi(l.cu, l.moi, t('Không phân loại')), nguoi: l.nguoi };
    case 'hang_muc': return { tieu: t('Đổi hạng mục'), phu: doi(l.cu && tenHangMuc(l.cu), l.moi && tenHangMuc(l.moi), t('Không phân loại')), nguoi: l.nguoi };
    case 'lap': return { tieu: t('Đổi lặp lại'), phu: null, nguoi: l.nguoi };
    case 'lap_dung': return { tieu: l.moi ? t('Dừng lặp') : t('Lặp lại tiếp'), phu: null, nguoi: l.nguoi };
    default: return { tieu: l.moi ? t('Thêm theo dõi') : t('Bỏ theo dõi'), phu: l.moi ?? l.cu, nguoi: l.nguoi };
  }
}

/** Một dòng nhãn · giá trị của khối thông tin panel (V3 `.bc`). */
const DongBc = ({ k, children }: { k: string; children: ReactNode }) => (
  <><span className="pt-0.5 text-[13px] font-medium text-dim">{k}</span><div className="flex min-w-0 flex-wrap items-center gap-2.5 text-sm">{children}</div></>
);

/**
 * PANEL MỘT VIỆC VẬN HÀNH (V3 Head · V5 người được giao): khối Phụ trách · Hạn · Theo dõi (dùng lại `KhoiGiaoViec` của GV-2; người phụ trách sửa hạn,
 * lý do tuỳ chọn — N59) · Trạng thái + "Cập nhật tiến độ" (5 trạng thái, giữ luật cũ) · Lặp lại + Dừng lặp (Hoàn tác 10 giây) · Mô tả · lớp / HV liên quan ·
 * Việc con (tick = xong) · Tệp (`BangChung` owner `task`) · Case làm căn cứ · Lịch sử (gập). "Sửa công việc" = view kế trong cùng panel.
 */
export function NganViecVanHanh({ taskId, onClose, onDone, quayLai, nhom }: {
  taskId: number | null; onClose: () => void; onDone: () => void;
  /** OV-12e: mở từ panel số liệu — "← Danh sách". */
  quayLai?: { nhan: string; onClick: () => void };
  /** Nhóm đã nạp ở bảng (ô Hạng mục của "Sửa công việc") — không có thì form tự đọc. */
  nhom?: readonly NhomViec[];
}) {
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const toi = session?.user?.id;
  const toast = useToast();
  const { data: tai, loading, reload } = useApi<any>(taskId ? `/mgmt-tasks/${taskId}` : null, [taskId]);
  /* Bản máy chủ vừa trả sau thao tác (PATCH trả chi tiết) — vẽ ngay, không GET lại. */
  const [ban, setBan] = useState<any>(null);
  useEffect(() => setBan(null), [tai]);
  const data = ban ?? tai;
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [dangTick, setDangTick] = useState<number | null>(null);
  useEffect(() => { setUpdating(false); setEditing(false); }, [taskId]);

  if (taskId === null) return null;
  const xong = () => { invalidate('/mgmt-tasks'); onDone(); };
  /* 6c (bảng kê lỗi 9): Sửa việc = view kế trong CÙNG panel (‹ về việc, ✕ đóng cả panel), không mở panel đè. */
  if (data && editing) return <SuaViec onClose={() => setEditing(false)} dongCa={onClose} task={data} nhom={nhom} onDone={(moi) => { setBan(moi); xong(); }} />;

  const patch = async (b: object) => {
    const moi = await api.patch<any>(`/mgmt-tasks/${data.id}`, { ...b, phienBan: data.updatedAt });
    setBan(moi); xong();
    return khoiCua(moi);
  };
  const thaoTac: ThaoTacKhoi = {
    trong: t('Chưa giao'), khongMacDinh: true,
    doiNguoi: (_g, userId) => patch({ assigneeUserId: userId }),
    /* A2-04 / A2-09: máy chủ đảo đúng lần đổi (người theo dõi như cũ, tin vừa gửi gỡ đi) — không đổi lần nữa. */
    hoanTacNguoi: () => patch({ hoanTacGiao: true }),
    suaHan: (_g, han) => patch({ due: han }),
    themTheoDoi: (_g, ids) => patch({ theoDoiIds: [...new Set([...data.theoDoi.map((x: any) => x.id), ...ids])] }),
    boTheoDoi: (_g, id) => patch({ theoDoiIds: data.theoDoi.map((x: any) => x.id).filter((x: number) => x !== id) }),
  };
  const lap: Lap | null = data?.lap ?? null;
  const dungLap = async (dung: boolean) => {
    try {
      await api.post(`/mgmt-tasks/${lap!.gocId}/lap`, { dung });
      reload(); xong();
      if (dung) toast.hoanTac(t('Đã dừng lặp · bản đang mở giữ'), () => { void api.post(`/mgmt-tasks/${lap!.gocId}/lap`, { dung: false }).then(() => { reload(); xong(); }, (e: any) => toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'))); }, { ms: 10_000 });
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
  };
  const tick = async (x: any) => {
    setDangTick(x.id);
    try {
      await api.post(`/mgmt-tasks/${x.id}/update`, { progress: x.progress === 'done' ? 'doing' : 'done' });
      reload(); xong(); invalidate('/my-work');
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDangTick(null); }
  };
  const tenNhom = data ? (data.hangMuc ? tenHangMuc(data.hangMuc) : data.groupName ?? t('Không phân loại')) : null;
  const laNguoiNhan = !!data && !data.viewer.canEdit;
  const lichSu: { luc: string; tieu: string; phu: string | null; nguoi: string | null }[] = data ? [
    ...data.updates.map((u: any) => ({ luc: u.on, tieu: dich(u.progressLabel), phu: u.note, nguoi: u.by })),
    ...data.dueHistory.map((h: any) => ({ luc: (h.at ?? '').slice(0, 10), tieu: h.old ? t('Sửa hạn') : t('Đặt hạn'),
      phu: [h.old ? `${fmtDate(h.old)} → ${h.new ? fmtDate(h.new) : t('không hạn')}` : h.new ? fmtDate(h.new) : null, h.reason ? `"${h.reason}"` : null].filter(Boolean).join(' · '), nguoi: h.by })),
    ...(data.lichSu ?? []).map((l: any) => ({ luc: (l.luc ?? '').slice(0, 10), ...dongLichSu(l) })),
  ].sort((a, b) => (a.luc < b.luc ? 1 : a.luc > b.luc ? -1 : 0)) : [];
  const conXong = data?.subtasks.filter((x: any) => x.progress === 'done').length ?? 0;
  /* R2 C8: giao nhầm → Xoá (chưa có cập nhật): Thùng rác + Hoàn tác; đã có cập nhật thì nút ẩn, còn Dừng hẳn. */
  const xoaViec = async () => {
    try {
      const r = await api.del<{ thungRacId?: number }>(`/mgmt-tasks/${data.id}`);
      hoanTacXoa(toast, r?.thungRacId, t('Đã xoá việc'), xong);
      xong(); onClose();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được — thử lại.')); }
  };

  return (
    <KhungPanel tieuDe={data?.title ?? t('Công việc')} rong="rong" onDong={onClose} quayLai={quayLai}
      loai={data ? `${laNguoiNhan ? t('Việc được giao') : t('Vận hành')} · ${tenNhom}` : null}
      dau={data ? {
        han: data.due ? <ChipHan loai="viec-van-hanh" han={data.due} /> : undefined,
        dong2: [data.taskType === 'long_term' ? t('Dài hạn') : t('Trong kỳ'),
          /* B3-16 (AUDIT-2111): "{tên} giao" chỉ ở chip khối Phụ trách — không lặp ở dòng phụ đầu panel. */
          data.viewer.canXoa ? <button key="xoa" type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold text-late sm:min-h-0" onClick={() => void xoaViec()}>{t('Xoá việc')}</button> : null,
          data.viewer.canEdit ? <button key="sua" type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setEditing(true)}>{t('Sửa công việc')}</button> : null,
        ].filter(Boolean) as ReactNode[],
      } : undefined}
      quyChe={data?.viewer?.canUpdate && !dong(data.progress) ? (lap && !lap.dung ? quyCheViecLap({ ky: chuLap(lap), khoang: null }) : quyCheViecGiao()) : null}
      chan={{ huy: { nhan: t('Đóng'), onClick: onClose } }}>
      {loading && !data && <div className="pt-3"><Skeleton rows={6} /></div>}
      {data && (
        <div className="space-y-4 pt-3.5">
          <KhoiGiaoViec g={khoiCua(data)} dat={() => {}} reload={reload} thaoTac={thaoTac} />

          <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5 rounded-[10px] px-3 py-3 max-sm:grid-cols-[80px_minmax(0,1fr)]" style={{ background: 'var(--surface-2)' }}>
            <DongBc k={t('Trạng thái')}>
              <NhanViec progress={data.progress} label={data.progressLabel} />
              {data.viewer.canUpdate && !updating && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setUpdating(true)}>{t('Cập nhật tiến độ')}</button>}
              {data.progress === 'paused' && (data.stopReason || data.helpName || data.reviewOn) && (
                <span className="basis-full text-[13px] text-dim">
                  {data.stopReason}{data.helpName && ` · ${t('cần: {ten}', { ten: data.helpName })}`}{data.reviewOn && ` · ${t('hẹn xem lại {ngay}', { ngay: fmtDate(data.reviewOn) })}`}
                </span>
              )}
              {data.progress === 'stopped' && data.stopReason && <span className="basis-full text-[13px] text-dim">{t('Lý do dừng hẳn:')} {data.stopReason}</span>}
            </DongBc>
            {lap && !data.parentTaskId && (
              <DongBc k={t('Lặp lại')}>
                {lap.dung ? <span>{t('Không lặp · đã dừng')}</span> : (
                  <span className="inline-flex items-center gap-1"><IcLap />{t('{lap} · bản tới {ngay}', { lap: chuLap(lap), ngay: ngay(kyToi(lap, homNay)) })}</span>
                )}
                {data.viewer.canDungLap && (lap.dung
                  ? <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => void dungLap(false)}>{t('Lặp lại tiếp')}</button>
                  : <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => void dungLap(true)}>{t('Dừng lặp')}</button>)}
              </DongBc>
            )}
            {(data.classCode || data.hocVien?.length > 0) && (
              <DongBc k={t('Liên quan')}>
                {[data.classCode, ...(data.hocVien ?? []).map((h: any) => h.ten)].filter(Boolean).join(' · ')}
              </DongBc>
            )}
            {data.note && <DongBc k={t('Mô tả việc')}><span className="whitespace-pre-wrap">{data.note}</span></DongBc>}
          </div>

          {/* OV-11c (CV-12): cập nhật tiến độ mở NGAY trong thân panel — không ngăn kéo thứ hai đè lên. */}
          {data.viewer.canUpdate && updating && <UpdateDialog task={data} onClose={() => setUpdating(false)} onDone={() => { reload(); xong(); invalidate('/my-work'); }} />}

          {/* ─────────── việc con, một tầng — ô tick = xong (người làm việc con hoặc quản lý) */}
          {(data.subtasks.length > 0 || (data.viewer.canEdit && !data.parentTaskId)) && (
            <section>
              <h3 className="mb-2 mt-0 flex items-baseline gap-2 text-[13px] font-medium text-dim">{t('Việc con')}
                {data.subtasks.length > 0 && <span className="text-xs tabular-nums text-faint">{t('{xong} / {tong} xong', { xong: conXong, tong: data.subtasks.length })}</span>}</h3>
              <div className="grid overflow-clip rounded-[10px] border" style={{ borderColor: 'var(--line)' }}>
                {data.subtasks.map((x: any) => {
                  const duoc = (data.viewer.canEdit || x.assigneeUserId === toi) && x.progress !== 'stopped';
                  const daXong = x.progress === 'done';
                  return (
                    <div key={x.id} className="grid min-h-[46px] grid-cols-[24px_minmax(0,1fr)_170px_120px] items-center gap-2.5 border-t px-3 py-1.5 text-sm first:border-t-0 max-sm:grid-cols-[24px_minmax(0,1fr)] max-sm:gap-y-1" style={{ borderColor: 'var(--line)' }}>
                      <input type="checkbox" className="h-[18px] w-[18px] accent-[color:var(--accent)] max-sm:h-6 max-sm:w-6" checked={daXong} disabled={!duoc || dangTick === x.id}
                        aria-label={t('Xong: {ten}', { ten: x.title })} onChange={() => void tick(x)} />
                      <span className={`min-w-0 ${daXong ? 'text-faint line-through' : x.overdue ? 'text-bad' : 'text-slate-100'}`}>{x.title}{x.stopReason ? <span className="text-xs text-faint"> · {x.stopReason}</span> : null}</span>
                      <span className="truncate text-[13px] text-dim max-sm:col-start-2"><b className="font-semibold text-slate-100">{x.assigneeName ?? t('chưa giao')}</b></span>
                      <span className="max-sm:col-start-2">{x.due ? <HanO han={x.due} xong={dong(x.progress)} /> : <span className="text-xs text-faint">{t('không hạn')}</span>}</span>
                    </div>
                  );
                })}
                {data.viewer.canEdit && !data.parentTaskId && !dong(data.progress) && (
                  <div className={`px-3 py-2 ${data.subtasks.length ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setAddingSub(true)}>{t('+ Việc con')}</button>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 mt-0 text-[13px] font-medium text-dim">{t('Tệp')}</h3>
            <BangChung ownerType="task" ownerId={data.id} canEdit={!!data.viewer.canTep} tieuDe="" onChanged={xong} />
          </section>

          {data.cases.length > 0 && (
            <section>
              <h3 className="mb-2 mt-0 flex items-center gap-1.5 text-[13px] font-medium text-dim">
                {t('Case làm căn cứ')}
                <NutLuat label={t('Về Case làm căn cứ')}>
                  {t('Liên kết này chỉ là CĂN CỨ. Hoàn thành công việc quản lý KHÔNG đóng Case nào, và cũng không tự tạo phương án cho em nào.')}
                </NutLuat>
              </h3>
              <ul className="m-0 list-none space-y-1 p-0 text-xs text-slate-300">
                {data.cases.map((c: any) => <li key={c.id}>{c.title} <span className="text-faint">· {c.student_name}</span></li>)}
              </ul>
            </section>
          )}

          <details className="group">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-dim sm:min-h-[32px]">
              <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current transition-transform group-open:rotate-90" strokeWidth={1.6}><path d="M6 3.5L10.5 8 6 12.5" /></svg>
              {t('Lịch sử · {n}', { n: lichSu.length })}
            </summary>
            {lichSu.length === 0 ? <p className="m-0 text-xs text-faint">{t('Chưa có cập nhật nào.')}</p> : (
              <ul className="m-0 mt-1 list-none space-y-2 p-0">
                {lichSu.map((l, i) => (
                  <li key={i} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 text-[13px] max-sm:grid-cols-[72px_minmax(0,1fr)]">
                    <span className="tabular-nums text-faint">{fmtDate(l.luc)}</span>
                    <span className="min-w-0"><b className="mr-1.5 font-semibold text-slate-100">{l.tieu}</b>{[l.nguoi, l.phu].filter(Boolean).join(' · ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>
      )}

      {data && (
        <CreateTask open={addingSub} onClose={() => setAddingSub(false)} parent={data}
          branchId={data.branchId} onDone={() => { reload(); xong(); }} />
      )}
    </KhungPanel>
  );
}

/** Ghi một lần cập nhật — cách DUY NHẤT trạng thái công việc đổi. OV-11c (CV-12): khối trong thân panel, không panel lồng panel. */
function UpdateDialog({ onClose, task, onDone }: { onClose: () => void; task: any; onDone: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const lf = useLoiForm();
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reviewOn, setReviewOn] = useState(task.reviewOn ?? addDaysIso(homNay, 7));
  const [help, setHelp] = useState<NguoiChon | null>(task.helpUserId
    ? { kieu: 'tai_khoan', id: task.helpUserId, ten: task.helpName ?? '' }
    : task.helpName ? { kieu: 'ngoai', ten: task.helpName } : null);
  const [busy, setBusy] = useState(false);
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(progress);
  const needHelp = progress === 'paused';
  const loi: LoiTruong[] = [
    ...(needReason ? dsLoi([{ khoa: 'ly-do', nhan: t('Lý do'), toiThieu: 1 }], { 'ly-do': reason }) : []),
    ...(needHelp ? dsLoi([{ khoa: 'ho-tro', nhan: t('Cần ai hỗ trợ'), chon: true }], { 'ho-tro': help }) : []),
    ...(needHelp && (!reviewOn || reviewOn < homNay) ? [{ khoa: 'xem-lai', nhan: t('Ngày xem lại'), lyDo: reviewOn ? t('Từ hôm nay trở đi') : t('Chưa chọn') }] : []),
  ];

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      /* V3c / RKC-3b: việc cha còn việc con mở → máy chủ hỏi MỘT câu (`canXacNhan`, hộp chung của `api`), đồng ý = khép luôn việc con. */
      await api.post(`/mgmt-tasks/${task.id}/update`, {
        progress, note: note || null, reason: reason || null,
        reviewOn: needHelp ? (reviewOn || null) : null,
        helpUserId: help?.kieu === 'tai_khoan' ? help.id : null,
        helpName: help?.kieu === 'ngoai' ? help.ten : null,
        phienBan: task.updatedAt,
      });
      toast.push('ok', t('Đã cập nhật')); onDone(); onClose();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-3 rounded-[10px] border p-3" style={{ borderColor: 'var(--line-strong)' }} aria-label={t('Cập nhật tiến độ')}>
      <b className="block text-[14px] text-slate-100">{t('Cập nhật tiến độ')}</b>
      <Field label={t('Trạng thái')} as="div">
        <div className="flex flex-wrap gap-1.5">
          {/* B3-12: nút "Hoàn thành" như Quy chế ("ghi Hoàn thành khi xong"). */}
          {TASK_PROGRESS.map((s) => <NutChon key={s} nho chon={progress === s} onClick={() => setProgress(s)}>{s === 'done' ? t('Hoàn thành') : TASK_PROGRESS_LABEL[s]}</NutChon>)}
        </div>
      </Field>
      {needReason && (
        <Field label={t('Lý do')} required loi={lf.loiCua(loi, 'ly-do')}>
          <input className="field" maxLength={2000} {...lf.o(loi, 'ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      )}
      {needHelp && (
        <>
          <Field label={t('Cần ai hỗ trợ')} required loi={lf.loiCua(loi, 'ho-tro')}>
            <div {...lf.o(loi, 'ho-tro')}>
              <ChonNguoi value={help} onChange={setHelp} nhom="nhan_vien" choToi={false} choNgoai ariaLabel={t('Người cần hỗ trợ')} />
            </div>
          </Field>
          <Field label={t('Ngày xem lại')} required loi={lf.loiCua(loi, 'xem-lai')}>
            <ONgay kieu="ngay" value={reviewOn} onChange={setReviewOn} toiThieu={homNay}
              id={lf.oId('xem-lai')} onBlur={lf.roi('xem-lai')} invalid={!!lf.loiCua(loi, 'xem-lai')} />
          </Field>
        </>
      )}
      <Field label={t('Cập nhật')}>
        <textarea className="field" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Đã làm tới đâu')} />
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={onClose}>{t('Đóng')}</button>
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── form */

/** Ô "Loại việc" (V2): Trong kỳ │ Dài hạn — chip, chọn một. */
const OLoaiViec = ({ value, onChange }: { value: string; onChange: (v: 'in_period' | 'long_term') => void }) => (
  <div role="group" aria-label={t('Loại việc')} className="flex flex-wrap gap-1.5">
    <NutChon nho chon={value === 'in_period'} onClick={() => onChange('in_period')}>{t('Trong kỳ')}</NutChon>
    <NutChon nho chon={value === 'long_term'} onClick={() => onChange('long_term')}>{t('Dài hạn')}</NutChon>
  </div>
);

type LapForm = { kieu: 'khong' | 'tuan' | 'thang'; thu: number[]; ngay: string };
const lapGui = (l: LapForm) => (l.kieu === 'tuan' ? { kieu: 'tuan', ngay: l.thu } : l.kieu === 'thang' ? { kieu: 'thang', ngay: [Number(l.ngay)] } : null);
const lapTu = (l: Lap | null): LapForm => (l && !l.dung ? { kieu: l.kieu, thu: l.kieu === 'tuan' ? l.ngay : [1], ngay: l.kieu === 'thang' ? String(l.ngay[0]) : '1' } : { kieu: 'khong', thu: [1], ngay: '1' });
const loiLap = (l: LapForm): LoiTruong[] => (l.kieu === 'tuan' && !l.thu.length ? [{ khoa: 'lap', nhan: t('Lặp lại'), lyDo: t('Chọn ít nhất một thứ') }]
  : l.kieu === 'thang' && !(Number(l.ngay) >= 1 && Number(l.ngay) <= 31 && Number.isInteger(Number(l.ngay))) ? [{ khoa: 'lap', nhan: t('Lặp lại'), lyDo: t('Gõ một ngày từ 1 đến 31') }] : []);

/** Ô "Lặp lại" (V2 / V2c): chip Không · Hằng tuần · Hằng tháng; hằng tuần chọn một / nhiều thứ, hằng tháng gõ ngày. */
function OLap({ value, onChange, id }: { value: LapForm; onChange: (v: LapForm) => void; id?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" id={id}>
      <span className="flex flex-wrap gap-1.5">
        {(['khong', 'tuan', 'thang'] as const).map((k) => (
          <NutChon key={k} nho chon={value.kieu === k} onClick={() => onChange({ ...value, kieu: k })}>{k === 'khong' ? t('Không') : k === 'tuan' ? t('Hằng tuần') : t('Hằng tháng')}</NutChon>
        ))}
      </span>
      {value.kieu === 'tuan' && (
        <span role="group" aria-label={t('Thứ')} className="inline-flex gap-1">
          {THU_NGAN.map((ten, i) => {
            const on = value.thu.includes(i + 1);
            return (
              <button key={ten} type="button" aria-pressed={on} aria-label={THU_DU[i]}
                className={`h-8 w-10 rounded-lg border text-[13px] font-semibold max-sm:h-11 max-sm:w-11 ${on ? 'text-slate-100' : 'text-dim'}`}
                style={{ borderColor: on ? 'var(--accent)' : 'var(--line-strong)', background: on ? 'var(--accent-soft)' : 'transparent' }}
                onClick={() => onChange({ ...value, thu: on ? value.thu.filter((x) => x !== i + 1) : [...value.thu, i + 1].sort() })}>{ten}</button>
            );
          })}
        </span>
      )}
      {value.kieu === 'thang' && (
        <label className="inline-flex items-center gap-2 text-sm">{t('ngày')}
          <input className="field w-16 text-center tabular-nums" inputMode="numeric" maxLength={2} value={value.ngay} aria-label={t('Ngày trong tháng')}
            onChange={(e) => onChange({ ...value, ngay: e.target.value.replace(/\D/g, '') })} />
        </label>
      )}
    </div>
  );
}

/**
 * Nguồn ô chọn người của form (N59: giao cho BẤT KỲ ai có tài khoản ở chi nhánh của việc — mọi vai, không chỉ GV / Head): `/ref/nguoi?nhom=giao_viec`
 * như khối giao việc GV-2. Một câu mỗi lần gõ (trần ở `tocDoDuong.ts`). `cn` null = chi nhánh duy nhất của người giao (máy chủ cũng gán vậy khi tạo).
 */
function useTimNguoi(cn: number | null): TimXa {
  const ref = useRef(cn);
  ref.current = cn;
  const [tim] = useState<TimXa>(() => ({
    toiThieu: 0,
    goi: async (q) => {
      const qs = new URLSearchParams({ q: q.trim(), nhom: 'giao_viec' });
      if (ref.current) qs.set('chiNhanh', String(ref.current));
      const ds: { id: number; name: string; role: string | null; branches: string[] }[] = await api.get(`/ref/nguoi?${qs}`);
      return ds.map((r) => ({ id: r.id, ten: r.name, phu: [r.role, r.branches.join('/')].filter(Boolean).join(' · ') }));
    },
  }));
  return tim;
}

type Em = { id: number; ten: string; lop: string; lopId: number };
/** Ô học viên liên quan (N62, tuỳ chọn): chọn nhiều, tìm em trong phạm vi (`/tim/hoc-vien`, một câu mỗi lần gõ ≥ 2 chữ). Có lớp → chỉ em lớp đó. */
function OHocVien({ value, onChange, lopId, disabled }: { value: NguoiTrongDs[]; onChange: (v: NguoiTrongDs[]) => void; lopId: number | null; disabled?: boolean }) {
  const lop = useRef(lopId);
  lop.current = lopId;
  const [tim] = useState(() => ({
    toiThieu: 2, goiY: t('Gõ ít nhất 2 chữ của tên em'),
    goi: async (q: string) => (await api.get<Em[]>(`/tim/hoc-vien?q=${encodeURIComponent(q)}`))
      .filter((e) => !lop.current || e.lopId === lop.current).slice(0, 12).map((e) => ({ id: e.id, ten: e.ten, phu: e.lop })),
  }));
  return (
    <ChonNguoi value={null} onChange={() => {}} nhom="nhan_vien" choToi={false} choNgoai={false} tim={tim} disabled={disabled}
      nhieu={{ chon: value, toiDa: 50, onDoi: onChange, donVi: t('em') }} ariaLabel={t('Học viên liên quan')} tieuDe={t('Học viên')} placeholder={t('Gõ tên em…')} />
  );
}

/** Sửa phần mô tả: tên, hạng mục, lớp / HV liên quan, lặp lại, mô tả — không đụng tiến độ. Người · hạn · theo dõi sửa ở khối ba dòng (V3). */
function SuaViec({ onClose, dongCa, task, onDone, nhom: nhomSan }: {
  /** `onClose` = về view việc (‹, Huỷ, sau lưu); `dongCa` = ✕ / Esc / nền đóng cả panel. */
  onClose: () => void; dongCa: () => void; task: any; onDone: (moi: any) => void; nhom?: readonly NhomViec[];
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const nhom = useNhom(nhomSan, task.branchId);
  const con = !!task.parentTaskId;
  const goc = !con && (!task.lap || task.lap.gocId === task.id);
  const noiDau: NoiViec = { groupId: task.groupId ?? null, hangMuc: task.hangMuc ?? null };
  const [title, setTitle] = useState(task.title);
  const [loaiViec, setLoaiViec] = useState<string>(task.taskType);
  const [noi, setNoi] = useState<NoiViec>(noiDau);
  const [note, setNote] = useState(task.note ?? '');
  const [lopId, setLopId] = useState<number | null>(task.classId ?? null);
  const hvDau: NguoiTrongDs[] = (task.hocVien ?? []).map((h: any) => ({ id: h.id, ten: h.ten }));
  const [hv, setHv] = useState<NguoiTrongDs[]>(hvDau);
  const [lap, setLap] = useState<LapForm>(lapTu(task.lap));
  const lapDau = lapTu(task.lap);
  const [busy, setBusy] = useState(false);
  const classes = useApi<{ rows: { id: number; code: string; studentCount: number }[] }>(!con ? '/classes?gon=1' : null, [con]);

  const doiNoi = noi.groupId !== noiDau.groupId || noi.hangMuc !== noiDau.hangMuc;
  const doiHv = hv.map((x) => x.id).join() !== hvDau.map((x) => x.id).join();
  const doiLap = JSON.stringify(lapGui(lap)) !== JSON.stringify(lapGui(lapDau));
  const loi = [...dsLoi([{ khoa: 'ten', nhan: t('Tên công việc'), toiThieu: 1 }], { ten: title }), ...(goc ? loiLap(lap) : [])];

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      /* Hợp đồng VH-1b: `classId` / `studentIds` chỉ gửi khi ĐỔI (gửi lại danh sách cũ không bị kiểm lại; không gửi = giữ). `phienBan` chống đè → 409. */
      const moi = await api.patch<any>(`/mgmt-tasks/${task.id}`, {
        ...(title !== task.title ? { title } : {}),
        ...(!con && loaiViec !== task.taskType ? { taskType: loaiViec } : {}),
        ...(note !== (task.note ?? '') ? { note: note || null } : {}),
        ...(!con && doiNoi ? { groupId: noi.groupId, hangMuc: noi.hangMuc } : {}),
        ...(!con && lopId !== (task.classId ?? null) ? { classId: lopId } : {}),
        ...(!con && doiHv ? { studentIds: hv.map((x) => x.id) } : {}),
        ...(goc && doiLap ? { lap: lapGui(lap) } : {}),
        phienBan: task.updatedAt,
      });
      toast.push('ok', t('Đã lưu')); onDone(moi); onClose();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
    finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Sửa công việc')} hocVien={task.title} rong="rong" quayLai={{ nhan: task.title, onClick: onClose }} onDong={dongCa}
      chan={{
        daSua: title !== task.title || loaiViec !== task.taskType || note !== (task.note ?? '') || doiNoi || doiHv || doiLap || lopId !== (task.classId ?? null),
        huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="space-y-3 pt-3">
        <Field label={t('Tên công việc')} required loi={lf.loiCua(loi, 'ten')}>
          <input className="field" maxLength={200} {...lf.o(loi, 'ten')} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        {!con && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Hạng mục')} as="div"><OHangMuc nhom={nhom} value={noi} onChange={setNoi} /></Field>
              <Field label={t('Loại việc')} as="div"><OLoaiViec value={loaiViec} onChange={setLoaiViec} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Lớp liên quan')} as="div">
                <ChonLop ariaLabel={t('Lớp liên quan')} placeholder={t('Không gắn lớp')} value={lopId} onChange={setLopId} macDinhTrong={t('Không gắn lớp')}
                  khongKhop={classes.data ? undefined : t('Đang tải…')} ds={(classes.data?.rows ?? []).map((c) => ({ id: c.id, ma: c.code, phu: t('{n} em', { n: c.studentCount }) }))} />
              </Field>
              <Field label={t('Học viên liên quan')} as="div"><OHocVien value={hv} onChange={setHv} lopId={lopId} /></Field>
            </div>
          </>
        )}
        {goc && <Field label={t('Lặp lại')} as="div" loi={lf.loiCua(loi, 'lap')}><OLap value={lap} onChange={setLap} id={lf.oId('lap')} /></Field>}
        <Field label={t('Mô tả việc')}>
          <textarea className="field" name="mo-ta" autoComplete="off" rows={3} maxLength={TRAN_MO_TA} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Cần làm gì, lưu ý gì (tuỳ chọn)')} />
        </Field>
      </div>
    </KhungPanel>
  );
}

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Nhóm cho ô Hạng mục: nhóm bảng đã nạp, không có (mở từ trang Công việc / panel) → MỘT câu `/mgmt-tasks/nhom`. */
function useNhom(san: readonly NhomViec[] | undefined, branchId: number | null | undefined): readonly NhomViec[] {
  const r = useApi<{ rows: NhomViec[] }>(san ? null : `/mgmt-tasks/nhom${branchId ? `?branchId=${branchId}` : ''}`, [branchId, !!san]);
  return san ?? r.data?.rows ?? [];
}

type LoaiViec = 'chi-nhanh' | 'giao-gv';
type VcForm = { k: number; ten: string; nguoi: NguoiChon | null; han: string };

/**
 * "+ GIAO VIỆC" — MỘT cửa (K1-36, Câu 1 = A), MỘT form cho bảng Vận hành và trang Công việc (N62). Hai loại việc khác hẳn nhau nên form chọn trước:
 *
 *   Việc chi nhánh              việc tay: tên · hạng mục (Chính thống │ Tự đặt) · người · hạn · theo dõi · lớp / HV liên quan · việc con · lặp lại · tệp · mô tả → `/mgmt-tasks`.
 *   Giao GV theo lớp + kỹ năng  gắn lớp và kỹ năng, TOẢ RA thành PA của từng em → `/tasks` (máy chủ suy chi nhánh từ lớp).
 *
 * "Toả ra": giao cho lớp mười ba em vẫn là MỘT việc, cập nhật MỘT lần — tạo mười ba bản sao thì GV bỏ qua và số tiến độ thành rác.
 * Việc con và việc tạo từ ô Báo cáo đơn vị luôn là việc chi nhánh (không hiện lựa chọn).
 */
type CreateTaskProps = {
  open: boolean; onClose: () => void; onDone: () => void;
  branchId: number | null; parent?: any;
  /** Mở từ một mục báo cáo kỳ họp thì nhóm đã biết trước (khoá nhóm khởi đầu hoặc id) — đỡ một lần chọn và một lần chọn sai. */
  defaultGroup?: string;
  /** PR-Ra R6: tạo từ ô báo cáo đơn vị — tự nối, rồi quay về đúng tuần đó. */
  unitReportId?: number | null;
  veKyHop?: string | null;
  /** Nhóm đã nạp (bảng Vận hành) — không có thì form đọc `/mgmt-tasks/nhom` một lần. */
  nhom?: readonly NhomViec[];
};

/**
 * PR-GVa (F03): VỎ của form — mỗi lần đóng → mở là MỘT lần mở mới, ruột mount lại theo `key`. Nhờ vậy giá trị đầu (chi nhánh theo bộ
 * lọc / việc cha lúc mở), khoá gửi và lỗi form đều mới mỗi lần mở; rerender trong lúc mở không ghi đè lựa chọn của người dùng.
 */
export function CreateTask(props: CreateTaskProps) {
  const lan = useRef(0);
  const moTruoc = useRef(false);
  if (props.open && !moTruoc.current) lan.current += 1;   // đóng → mở: một lần mở mới
  moTruoc.current = props.open;
  return props.open ? <CreateTaskForm key={lan.current} {...props} /> : null;
}

function CreateTaskForm({ onClose, onDone, branchId, parent, defaultGroup, unitReportId, veKyHop, nhom: nhomSan }: CreateTaskProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { session } = useSession();
  const toi = session?.user;
  const { homNay } = useNgayNghiepVu();
  const lf = useLoiForm();
  const chiChiNhanh = !!parent || !!unitReportId;
  const [loai, setLoai] = useState<LoaiViec>('chi-nhanh');
  const giaoGv = !chiChiNhanh && loai === 'giao-gv';
  const branches = useApi<any[]>(!parent ? '/ref/branches' : null, []);
  const classes = useApi<{ rows: { id: number; code: string; studentCount: number }[] }>(!parent ? '/classes?gon=1' : null, [!parent]);   // OV6-DOC-CHON: chỉ mã + sĩ số
  /* Việc giao GV gắn tuần đang chạy — hiện ở Báo cáo đơn vị › "Việc được giao" của tuần đó (như trước khi gộp cửa). */
  const tuanNay = useApi<{ id: number | null; weekStart: string; code?: string; isAnchor: boolean }[]>(giaoGv ? '/ref/period-window' : null, [giaoGv]);
  /* F04: chưa rõ tuần (đang tải, lỗi, không có tuần neo) thì KHÔNG giao — việc giao GV thiếu kỳ không hiện ở danh sách tuần nào. */
  const ky = trangThaiKyGiao(tuanNay);
  /* Giá trị đầu tính MỘT lần lúc mở (F03). Hạn việc con = hạn cha trừ một ngày (mục 8.6); hạn cha đã qua thì để trống. */
  const [dau] = useState(() => giaTriDauGiaoViec({ branchId, parent, defaultGroup }, homNay));
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState(dau.branch);
  /* GIAO-VIEC-CN (B' 9): ô người phụ trách / theo dõi chỉ hiện người có vai ở chi nhánh của việc ('' = Toàn hệ thống → mọi người trong phạm vi). */
  const cnViec = branch ? Number(branch) : null;
  const cnGrant = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  const timNguoi = useTimNguoi(cnViec ?? (cnGrant.length === 1 ? cnGrant[0] : null));
  const nhom = useNhom(parent ? [] : nhomSan, cnViec);
  /* Nhóm đầu: id (bảng đang lọc) hoặc khoá nhóm khởi đầu (Báo cáo đơn vị) → id khi danh sách nhóm đã có; không có = Không phân loại (N62). */
  const nhomDau = (ds: readonly NhomViec[]): NoiViec => {
    const g = defaultGroup ? ds.find((x) => String(x.id) === defaultGroup || x.khoa === defaultGroup) : null;
    return g && !g.an ? { groupId: g.id, hangMuc: null } : KHONG_PHAN_LOAI;
  };
  const [noi, setNoi] = useState<NoiViec | null>(null);
  const noiHl = noi ?? nhomDau(nhom);
  const [assignee, setAssignee] = useState<NguoiChon | null>(null);
  const [loaiViec, setLoaiViec] = useState<'in_period' | 'long_term'>('long_term');   // máy chủ mặc định Dài hạn (như trước)
  const [theoDoi, setTheoDoi] = useState<NguoiTrongDs[]>([]);
  const [due, setDue] = useState(dau.due);
  const [classId, setClassId] = useState('');
  const [hv, setHv] = useState<NguoiTrongDs[]>([]);
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const [vc, setVc] = useState<VcForm[]>([]);
  const [lap, setLap] = useState<LapForm>({ kieu: 'khong', thu: [((new Date(`${homNay}T00:00:00Z`).getUTCDay() + 6) % 7) + 1], ngay: String(Number(homNay.slice(8, 10))) });   // mặc định: thứ / ngày của hôm nay
  const [tep, setTep] = useState<TepChoMuc[]>([]);
  const [busy, setBusy] = useState(false);
  /* Đã tạo việc nhưng việc con / tệp lỗi: giữ id để "Thử lại" chỉ gửi phần còn thiếu (không tạo việc thứ hai). */
  const [daTao, setDaTao] = useState<{ id: number; vcXong: number[] } | null>(null);
  /*
   * PR-GVa (F01 = D13): MỘT khoá gửi cho MỘT lần mở form. Bấm đúp / thử lại sau lỗi mạng gửi lại đúng khoá này nên máy chủ trả việc
   * đã có. KHÔNG đổi khoá khi lỗi; lần mở mới (vỏ mount lại ruột) mới có khoá mới. Việc con: khoá riêng theo dòng.
   */
  const khoa = useRef(moiKhoaGui('cv'));
  const seq = useRef(0);
  const daSua = !!(title || note || classId || topic || assignee || theoDoi.length || hv.length || vc.length || tep.length || noi) || loai !== 'chi-nhanh'
    || due !== dau.due || branch !== dau.branch || lap.kieu !== 'khong' || loaiViec !== 'long_term';

  const cls = classes.data?.rows.find((c) => String(c.id) === classId);
  const loi: LoiTruong[] = [
    ...dsLoi([
      { khoa: 'ten', nhan: giaoGv ? t('Nội dung') : t('Tên công việc'), toiThieu: 1 },
      ...(giaoGv ? [{ khoa: 'lop', nhan: t('Lớp'), chon: true }, { khoa: 'ky-nang', nhan: t('Kỹ năng'), chon: true }] : []),
    ], { ten: title, lop: classId, 'ky-nang': topic }),
    ...(!giaoGv && !parent ? loiLap(lap) : []),
    ...(!giaoGv ? vc.flatMap((x, i) => (x.ten.trim() ? [] : [{ khoa: `vc-${x.k}`, nhan: t('Việc con {n}', { n: i + 1 }), lyDo: t('Nhập tên việc con') }])) : []),
  ];
  const idCua = (v: NguoiChon | null) => (v?.kieu === 'toi' ? toi?.id ?? null : v?.kieu === 'tai_khoan' ? v.id : null);

  const tao = async () => {
    lf.bam();
    if (loi.length > 0 || busy || (giaoGv && !duocGiao(ky, busy))) return;
    setBusy(true);
    try {
      if (giaoGv) {
        if (ky.loai !== 'co') return;
        let periodId = ky.id;
        if (periodId === null) {
          /* Tuần neo chưa có hàng → xin id thật đúng lúc gửi. Lỗi thì báo và KHÔNG gửi việc nào. */
          try { periodId = (await resolveWeek(ky.weekStart)).id; }
          catch { toast.push('error', t('Chưa xác định được tuần — bấm Thử lại.')); return; }
        }
        await api.post('/tasks', {
          kind: 'teacher_task', title, note: note.trim() || undefined, periodId, dueDate: due || undefined,
          classId: Number(classId), topic, idempotencyKey: khoa.current,
        });
        invalidate('/tasks'); invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
        toast.push('ok', t('Đã giao việc cho {n} em lớp {lop}', { n: cls?.studentCount ?? 0, lop: cls?.code ?? '' }).trim());
        onDone(); onClose();
        return;
      }
      let id = daTao?.id ?? null;
      if (id === null) {
        const r = await api.post<{ id: number }>('/mgmt-tasks', {
          title,
          ...(parent ? {} : { groupId: noiHl.groupId, hangMuc: noiHl.hangMuc, lap: lapGui(lap), taskType: loaiViec,
            ...(classId ? { classId: Number(classId) } : {}), ...(hv.length ? { studentIds: hv.map((x) => x.id) } : {}) }),
          assigneeUserId: idCua(assignee),
          theoDoiIds: theoDoi.map((x) => x.id),
          due: due || null, branchId: branch || null, note: note || null,
          parentTaskId: parent?.id ?? null,
          unitReportId: unitReportId ?? null,
          idempotencyKey: khoa.current,
        });
        id = r.id;
      }
      /* Việc con + tệp đi SAU khi việc cha có id (luật tệp `attachments.ts`: lỗi tải tệp không làm mất việc). Lỗi giữa chừng → giữ form, "Thử lại" gửi phần thiếu. */
      const vcXong = [...(daTao?.vcXong ?? [])];
      let loiCon: string | null = null;
      for (const x of vc) {
        if (vcXong.includes(x.k)) continue;
        try {
          /* Khoá việc con = khoá của lần mở form (`khoa.current`) + số dòng — "Thử lại" gửi lại đúng khoá, máy chủ trả việc con đã có. */
          const vcGui = { title: x.ten.trim(), parentTaskId: id, assigneeUserId: idCua(x.nguoi), due: x.han || null, idempotencyKey: `${khoa.current}-vc${x.k}` };
          await api.post('/mgmt-tasks', vcGui);
          vcXong.push(x.k);
        } catch (e: any) { loiCon = e?.message ?? t('Không lưu được'); break; }
      }
      const tepSau = tep.length ? await taiTepCho(tep, { ownerType: 'task', ownerIds: [id] }) : tep;
      setTep(tepSau);
      invalidate('/mgmt-tasks'); invalidate('/my-work');
      const tepLoi = tepSau.some((x) => !x.xong);
      if (loiCon || tepLoi) {
        setDaTao({ id, vcXong });
        toast.push('error', loiCon ? t('Đã giao việc, còn việc con chưa lưu: {loi}', { loi: loiCon }) : t('Đã giao việc, còn tệp chưa tải lên — bấm Thử lại.'));
        onDone();
        return;
      }
      /* R2 C8: giao nhầm → Hoàn tác (Thùng rác) khi chỉ có việc, không việc con / tệp đi kèm. */
      if (!parent && !vc.length && !tep.length) {
        const idVua = id, key = `giao-viec-${idVua}`;
        toast.hoanTac(t('Đã giao việc'), async () => {
          try {
            await api.del(`/mgmt-tasks/${idVua}`);   // Thùng rác 30 ngày; người phụ trách vừa cập nhật → máy chủ chặn, nói bước tiếp
            invalidate('/mgmt-tasks'); invalidate('/my-work'); onDone();
            toast.push('ok', t('Đã hoàn tác'), { key });
          } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
        }, { key });
      }
      else toast.push('ok', parent ? t('Đã thêm việc con') : t('Đã giao việc'));
      /* Đóng form; giao tiếp là mở lại → giá trị đầu đúng ngữ cảnh lúc đó và khoá gửi mới. */
      onDone(); onClose();
      if (unitReportId && veKyHop) navigate(`/cong-viec/bao-cao?periodId=${veKyHop}`);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
    finally { setBusy(false); }
  };

  const khoang = due ? Math.round((Date.parse(due) - Date.parse(homNay)) / 86_400_000) : null;
  const lapHl = lapGui(lap);
  const chuNut = busy ? t('Đang lưu…') : daTao ? t('Thử lại') : giaoGv ? t('Giao') : parent ? t('Thêm việc con') : t('Giao việc');
  return (
    <KhungPanel tieuDe={parent ? t('Việc con') : t('Giao việc')} hocVien={parent?.title ?? null} longTrong={!!parent} onDong={onClose} rong={parent ? undefined : 'rong'}
      loai={parent ? null : t('Vận hành · Giao việc')}
      quyChe={!giaoGv && !parent && lapHl && !loiLap(lap).length ? quyCheViecLap({ ky: chuLap(lapHl as Lap), khoang }) : null}
      chan={{
        daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || (giaoGv && !duocGiao(ky, busy))} onClick={tao}>{chuNut}</button>,
      }}>
      <div className="space-y-3.5 pt-3.5">
        {!chiChiNhanh && (
          <div role="group" aria-label={t('Kiểu việc')} className="flex flex-wrap gap-1.5">
            <NutChon nho chon={loai === 'chi-nhanh'} disabled={!!daTao} onClick={() => { setLoai('chi-nhanh'); lf.datLai(); }}>{t('Việc chi nhánh')}</NutChon>
            <NutChon nho chon={loai === 'giao-gv'} disabled={!!daTao} onClick={() => { setLoai('giao-gv'); lf.datLai(); }}>{t('Giao GV theo lớp + kỹ năng')}</NutChon>
          </div>
        )}
        <Field label={giaoGv ? t('Nội dung') : t('Tên công việc')} required loi={lf.loiCua(loi, 'ten')}>
          <input className="field" maxLength={200} {...lf.o(loi, 'ten')} value={title} onChange={(e) => setTitle(e.target.value)} disabled={!!daTao}
            placeholder={parent ? t('Ví dụ: Soạn phần Listening') : giaoGv ? t('Ví dụ: Tăng 15 phút luyện nghe chi tiết mỗi buổi') : t('Ví dụ: Xây dựng giáo trình Beginner')} />
        </Field>
        {giaoGv ? (
          <>
            <Field label={t('Lớp')} required loi={lf.loiCua(loi, 'lop')}>
              <ChonLop ariaLabel={t('Lớp')} placeholder={t('Chọn lớp')} {...lf.o(loi, 'lop')} value={classId ? Number(classId) : null} onChange={(id) => setClassId(id ? String(id) : '')}
                khongKhop={classes.data ? undefined : t('Đang tải…')} ds={(classes.data?.rows ?? []).map((c) => ({ id: c.id, ma: c.code, phu: t('{n} em', { n: c.studentCount }) }))} />
            </Field>
            <Field label={t('Kỹ năng')} required as="div" loi={lf.loiCua(loi, 'ky-nang')}>
              <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'ky-nang')}>
                {ENTRY_SKILLS.map((k) => <NutChon key={k} nho chon={topic === k} onClick={() => setTopic(k)}>{ENTRY_SKILL_LABEL[k]}</NutChon>)}
              </div>
            </Field>
            <Field label={t('Hạn')}><ONgay kieu="ngay" value={due} onChange={setDue} /></Field>
            <Field label={t('Tuần')} as="div">
              {ky.loai === 'co' ? (
                <p className="m-0 text-sm tabular-nums">{tuanLich(ky.weekStart, homNay)}</p>
              ) : ky.loai === 'dang-tai' ? (
                <p className="m-0 text-sm text-slate-500" role="status">{t('Đang lấy tuần hiện tại…')}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2" role="alert">
                  <p className="m-0 text-sm text-bad">
                    {ky.loai === 'loi' ? t('Chưa lấy được tuần hiện tại nên chưa giao được.') : t('Không xác định được tuần hiện tại nên chưa giao được.')}
                  </p>
                  <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={tuanNay.reload}>{t('Thử lại')}</button>
                </div>
              )}
            </Field>
            {cls && <p className="m-0 text-xs text-slate-400">{t('Hiện ở hồ sơ {n} em lớp {lop} · em chưa có Case kỹ năng này được mở Case mới', { n: cls.studentCount, lop: cls.code })}</p>}
            <Field label={t('Mô tả việc')}><textarea className="field" name="mo-ta" autoComplete="off" rows={2} maxLength={TRAN_MO_TA} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Cần làm gì, lưu ý gì (tuỳ chọn)')} /></Field>
          </>
        ) : (
          <fieldset disabled={!!daTao} className="m-0 min-w-0 space-y-3.5 border-0 p-0">
            {!parent && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('Hạng mục')} as="div"><OHangMuc nhom={nhom} value={noiHl} onChange={setNoi} /></Field>
                <Field label={t('Loại việc')} as="div"><OLoaiViec value={loaiViec} onChange={setLoaiViec} /></Field>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Người phụ trách')} as="div">
                <ChonNguoi value={assignee} onChange={setAssignee} nhom="nhan_vien" tim={timNguoi} choToi choNgoai={false} macDinhTrong={t('Chưa giao')} ariaLabel={t('Người phụ trách')} />
              </Field>
              <Field label={t('Hạn')}><ONgay kieu="ngay" value={due} onChange={setDue} /></Field>
            </div>
            <Field label={t('Người theo dõi')} as="div">
              <div className="grid gap-1.5">
                {/* A2-14 (mockup v22 V2): người giao tự vào theo dõi (máy chủ) — chip "Tên · bạn" trong ô, không ✕ (thay dòng chữ tĩnh). */}
                <ChonNguoi value={null} onChange={() => {}} nhom="nhan_vien" tim={timNguoi} choToi={false} choNgoai={false}
                  nhieu={{ chon: theoDoi, toiDa: 20, onDoi: (ds) => setTheoDoi(ds.filter((x) => x.id !== toi?.id)), donVi: t('người'),
                    coDinh: toi ? [{ id: toi.id, ten: toi.fullName ?? '', phu: t('bạn') }] : undefined }}
                  placeholder={t('Thêm người')} ariaLabel={t('Người theo dõi')} tieuDe={t('Người theo dõi')} />
              </div>
            </Field>
            {!parent && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('Lớp liên quan')} as="div">
                  <ChonLop ariaLabel={t('Lớp liên quan')} placeholder={t('Không gắn lớp')} value={classId ? Number(classId) : null} macDinhTrong={t('Không gắn lớp')}
                    onChange={(id) => setClassId(id ? String(id) : '')}
                    khongKhop={classes.data ? undefined : t('Đang tải…')} ds={(classes.data?.rows ?? []).map((c) => ({ id: c.id, ma: c.code, phu: t('{n} em', { n: c.studentCount }) }))} />
                </Field>
                <Field label={t('Học viên liên quan')} as="div"><OHocVien value={hv} onChange={setHv} lopId={classId ? Number(classId) : null} /></Field>
              </div>
            )}
            {!parent && (
              <Field label={t('Việc con')} as="div">
                <div className="grid overflow-clip rounded-[10px] border" style={{ borderColor: 'var(--line)' }}>
                  {vc.map((x, i) => (
                    <div key={x.k} className="grid min-h-[48px] grid-cols-[22px_minmax(0,1fr)_170px_172px_36px] items-center gap-2 border-t py-1.5 pl-2.5 pr-1.5 first:border-t-0 max-sm:grid-cols-[minmax(0,1fr)_44px] max-sm:gap-y-1.5"
                      style={{ borderColor: 'var(--line)' }}>
                      <span className="text-center text-xs font-semibold tabular-nums text-faint max-sm:hidden">{i + 1}</span>
                      <input className="field h-9 min-h-0" maxLength={200} value={x.ten} placeholder={t('Tên việc con')} autoFocus aria-label={t('Tên việc con {n}', { n: i + 1 })}
                        {...lf.o(loi, `vc-${x.k}`)} onChange={(e) => setVc(vc.map((y) => (y.k === x.k ? { ...y, ten: e.target.value } : y)))} />
                      <div className="max-sm:col-span-2 max-sm:row-start-2">
                        <ChonNguoi value={x.nguoi} onChange={(v) => setVc(vc.map((y) => (y.k === x.k ? { ...y, nguoi: v } : y)))} nhom="nhan_vien" tim={timNguoi} choToi choNgoai={false}
                          macDinhTrong={t('Chưa giao')} ariaLabel={t('Người phụ trách việc con {n}', { n: i + 1 })} gon />
                      </div>
                      <div className="max-sm:col-span-2 max-sm:row-start-3"><ONgay kieu="ngay" value={x.han} onChange={(v) => setVc(vc.map((y) => (y.k === x.k ? { ...y, han: v } : y)))} /></div>
                      <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border-0 bg-transparent p-0 text-[14px] text-dim hover:bg-[color:var(--accent-soft)] max-sm:col-start-2 max-sm:row-start-1 max-sm:h-11 max-sm:w-11"
                        aria-label={t('Bỏ việc con {n}', { n: i + 1 })} onClick={() => setVc(vc.filter((y) => y.k !== x.k))}>✕</button>
                    </div>
                  ))}
                  <div className={`px-2.5 py-2 ${vc.length ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
                    {/* B3-14 (AUDIT-2111): việc con mới mặc định cùng người phụ trách với việc cha (đổi được ở ô). */}
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => setVc([...vc, { k: (seq.current += 1), ten: '', nguoi: assignee, han: due ? addDaysIso(due, -1) >= homNay ? addDaysIso(due, -1) : due : '' }])}>{t('+ Việc con')}</button>
                  </div>
                </div>
              </Field>
            )}
            {!parent && <Field label={t('Lặp lại')} as="div" loi={lf.loiCua(loi, 'lap')}><OLap value={lap} onChange={setLap} id={lf.oId('lap')} /></Field>}
            {!parent && !(branches.data && branches.data.length <= 1) && (
              <Field label={t('Chi nhánh')}>
                <select className="field" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">{t('Toàn hệ thống')}</option>
                  {(branches.data ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            )}
          </fieldset>
        )}
        {!giaoGv && !parent && <Field label={t('Tệp')} as="div"><TepCho value={tep} onChange={setTep} khoa={busy} /></Field>}
        {!giaoGv && (
          <Field label={t('Mô tả việc')}>
            <textarea className="field" name="mo-ta" autoComplete="off" rows={3} maxLength={TRAN_MO_TA} value={note} onChange={(e) => setNote(e.target.value)} disabled={!!daTao} placeholder={t('Cần làm gì, lưu ý gì (tuỳ chọn)')} />
          </Field>
        )}
      </div>
    </KhungPanel>
  );
}
