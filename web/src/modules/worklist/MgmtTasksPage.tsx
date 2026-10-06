import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Alert, Card, Empty, ErrorState, Field, Forbidden, Info, NhanTrangThai, NutChon, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BranchFilter, resolveWeek, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Han } from '../../ui/Han.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  ENTRY_SKILLS, ENTRY_SKILL_LABEL, HANG_SO, HANG_SO_LABEL, TASK_GROUPS, TASK_GROUP_LABEL, TASK_PROGRESS, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, TRANG_THAI_LOC, catDongPhu, dongHanDaDoi, dsLoi, duocGiao, giaTriDauGiaoViec, moiKhoaGui,
  trangThaiKyGiao, tuanLich,
  type HangSo, type LoiTruong, type NguoiChon, type TrangThai, type TrangThaiLoc,
} from '@shared/domain/index.ts';

type Row = {
  id: number; code: string; title: string; group: string | null; taskType: string;
  branchId: number | null; branchName: string;
  assigneeUserId: number | null; assigneeName: string | null;
  /** PR-DUYET: tên gõ tay, không phải tài khoản. */
  assigneeNgoai?: boolean;
  watcherUserId: number | null; watcherName: string | null;
  due: string | null; progress: string; progressLabel: string;
  stopReason: string | null; reviewOn: string | null;
  helpUserId: number | null; helpName: string | null;
  overdue: boolean; subTotal: number; subDone: number; subOpen: number;
  subOverdue: boolean; subOverdueCount: number; subOverdueTitles: string[];
  caseLinks: number;
  hanGoc: string | null; lyDoDoiHan: string | null; soLanDoiHan: number;
  lastUpdate: { on: string; progressLabel: string; note: string | null; by: string | null } | null;
};

/**
 * Trạng thái việc Vận hành vẽ bằng NHÃN CHUNG (`NhanTrangThai`, brainstorm C.2 — K1-35/V4): kiểu nhãn theo họ chung, chữ giữ bộ chữ riêng
 * của việc (THUAT_NGU C-069…C-073, chủ sản phẩm 02/10 — "Đã dừng" là nhãn khoá học của HV nên không dùng cho việc).
 */
const NHAN: Record<string, TrangThai> = { not_started: 'can-lam', doing: 'dang-lam', paused: 'cho-duyet', stopped: 'da-huy', done: 'xong' };
const NhanViec = ({ progress, label }: { progress: string; label: string }) => <NhanTrangThai t={NHAN[progress] ?? 'can-lam'} chu={label} />;

const TRANG_THAI_LABEL: Record<TrangThaiLoc, string> = { mo: 'Đang mở', ...TASK_PROGRESS_LABEL, 'tat-ca': 'Mọi trạng thái' };

const idOfNguoi = (v: NguoiChon | null, myId: number | null): number | null => {
  if (!v) return null;
  if (v.kieu === 'toi') return myId;
  if (v.kieu === 'tai_khoan') return v.id;
  return null;
};
/** PR-DUYET (NEN Q12): "Dùng tên ngoài hệ thống" ở ô Người phụ trách — tên gửi riêng, không nhận thông báo. */
const tenNgoaiCua = (v: NguoiChon | null): string | null => (v?.kieu === 'ngoai' ? v.ten : null);

/**
 * TIẾN ĐỘ CÔNG VIỆC — MỘT bảng, không phải bốn bảng mở cùng lúc (mục 8.2).
 *
 * PR-Ra: hàng số ở đầu tab bấm được (Q8, bốn câu hỏi CHỒNG NHAU có chủ ý), hàng lọc Nhóm ·
 * Trạng thái · Người phụ trách đứng cùng một hàng (§18.4: không quá 10 nút), bảng 5 cột với
 * Việc con thay "Cập nhật gần nhất" (Q7). Đây là công việc quản lý vận hành, không phải Case
 * của học viên — không có tầng "phương án xử lý", không có quy trình xin duyệt.
 */
export function TasksBoard() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const group = params.get('nhom') ?? '';
  const progress: TrangThaiLoc = (TRANG_THAI_LOC as readonly string[]).includes(params.get('trangThai') ?? '')
    ? (params.get('trangThai') as TrangThaiLoc) : 'mo';
  const hang: HangSo | null = (HANG_SO as readonly string[]).includes(params.get('hang') ?? '') ? (params.get('hang') as HangSo) : null;
  const phuTrachParam = params.get('phuTrach');
  const assigneeUserId = phuTrachParam === 'toi' ? session?.user?.id ?? null : (phuTrachParam ? Number(phuTrachParam) : null);

  /*
   * MỞ THẲNG TỪ ĐƯỜNG DẪN (mục 14.2): báo cáo kỳ họp liên kết sang đây để mở/tạo việc ngay.
   * Đọc một lần lúc vào màn, rồi xoá tham số khỏi URL để nút Back không mở lại hộp thoại.
   */
  const [open, setOpen] = useState<number | null>(params.get('open') ? Number(params.get('open')) : null);
  const [creating, setCreating] = useState(params.get('tao') === '1');
  const preGroup = params.get('nhom') || '';
  const baoCaoId = params.get('baoCao') ? Number(params.get('baoCao')) : null;
  const veKyHop = params.get('periodId');
  useEffect(() => {
    if (!params.get('open') && !params.get('tao')) return;
    const next = new URLSearchParams(params);
    next.delete('open'); next.delete('tao');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (group) qs.set('group', group);
  qs.set('progress', progress);
  if (hang) qs.set('hang', hang);
  if (assigneeUserId) qs.set('assigneeUserId', String(assigneeUserId));
  const { data, loading, error, reload } = useApi<{
    rows: Row[]; canEdit: boolean; scopeEmpty: boolean;
    facets: { group: Record<string, number>; progress: Record<string, number>; hang: Record<string, number> };
    hangSo: Record<string, number>;
  }>(`/mgmt-tasks?${qs}`, [qs.toString()]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (data?.scopeEmpty) {
    return (
      <Forbidden
        message="Phần này dành cho Quản trị hệ thống và Quản lý chi nhánh"
        hint="Việc được giao cho bạn vẫn hiện ở Tổng quan và mở được từ thông báo."
      />
    );
  }

  const rows = data?.rows ?? [];
  const hangSo = data?.hangSo ?? {};
  const assigneeValue: NguoiChon | null = phuTrachParam === 'toi'
    ? { kieu: 'toi' }
    : assigneeUserId
      ? { kieu: 'tai_khoan', id: assigneeUserId, ten: rows.find((r) => r.assigneeUserId === assigneeUserId)?.assigneeName ?? `#${assigneeUserId}` }
      : null;

  return (
    <div className="space-y-4">
      {/* ── hàng số: bốn câu hỏi CHỒNG NHAU (Q8), mỗi số là một nút lọc ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" title="Bốn con số này chồng nhau có chủ ý — một việc Tạm ngưng đã tới ngày xem lại cũng có thể vừa quá hạn.">
          {HANG_SO.map((h) => {
            const n = hangSo[h] ?? 0;
            const active = hang === h;
            const mo = n === 0 && !active;
            return (
              <button key={h} type="button" disabled={mo}
                className={`flex items-baseline gap-1 appearance-none bg-transparent border-0 p-0 ${mo ? 'opacity-40 cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                onClick={() => {
                  /*
                   * "Vừa hoàn thành" là việc ĐÃ KHÉP — Trạng thái mặc định "Đang mở" thì lọc còn 0
                   * dòng dù hàng số > 0 (G-10). Bấm hàng số nào cũng chuyển Trạng thái về "Tất cả"
                   * luôn — vừa tránh riêng ca này, vừa không để hai bộ lọc âm thầm chỏi nhau. Gộp
                   * một lần `setParams` vì `setParam` gọi liên tiếp sẽ dựa trên `params` cũ, mất
                   * thay đổi của lần gọi trước.
                   */
                  const next = new URLSearchParams(params);
                  if (active) { next.delete('hang'); } else { next.set('hang', h); next.set('trangThai', 'tat-ca'); }
                  setParams(next, { replace: true });
                }}>
                <strong className={`tabular-nums text-sm ${active ? 'text-sky-300' : h === 'qua-han' && n > 0 ? 'text-rose-300' : 'text-slate-100'}`}>{n}</strong>
                <span className={active ? 'text-sky-300' : 'text-slate-400'}>{HANG_SO_LABEL[h]}</span>
                {active && <span className="text-sky-300" aria-hidden>✕</span>}
              </button>
            );
          })}
        </div>
        {data?.canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Giao việc</button>}
      </div>

      <Card bodyClass="p-0"
        title={<span className="flex flex-wrap items-baseline gap-2">Công việc <span className="text-slate-500 font-normal">{rows.length} việc</span></span>}
        action={<BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />}
      >
        {/* ── hàng lọc: Nhóm · Trạng thái · Người phụ trách (§18.4 — không quá 10 nút một hàng) ── */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--line)' }}>
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
            Nhóm:
            <select className="field" value={group} onChange={(e) => setParam('nhom', e.target.value || null)}>
              <option value="">Mọi nhóm</option>
              {TASK_GROUPS.map((g) => (
                <option key={g} value={g}>{TASK_GROUP_LABEL[g]} ({data?.facets.group[g] ?? 0})</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
            Trạng thái:
            <select className="field" value={progress} onChange={(e) => setParam('trangThai', e.target.value === 'mo' ? null : e.target.value)}>
              {TRANG_THAI_LOC.map((t) => (
                <option key={t} value={t}>{TRANG_THAI_LABEL[t]} ({data?.facets.progress[t] ?? 0})</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="shrink-0">Người phụ trách:</span>
            <div className="w-56">
              <ChonNguoi value={assigneeValue}
                onChange={(v) => setParam('phuTrach', v?.kieu === 'toi' ? 'toi' : v?.kieu === 'tai_khoan' ? String(v.id) : null)}
                nhom="nhan_vien" choNgoai={false} macDinhTrong="Mọi người" ariaLabel="Lọc theo người phụ trách" />
            </div>
          </div>
        </div>

        {loading && <div className="p-4"><Skeleton rows={5} /></div>}
        {!loading && rows.length === 0 && (
          <div className="p-4"><Empty title="Không có công việc nào khớp bộ lọc" /></div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '52rem' }}>
              <colgroup>
                <col style={{ width: '32%' }} /><col style={{ width: '16%' }} /><col style={{ width: '16%' }} />
                <col style={{ width: '20%' }} /><col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <Th hint="Bấm một dòng để mở chi tiết, việc con và lịch sử.">Việc</Th>
                  <Th hint="Người chịu trách nhiệm làm. Người theo dõi chỉ xem, không sửa được.">Người phụ trách</Th>
                  <Th hint="Quá hạn tính theo hạn HIỆN TẠI (giữ nguyên luật cũ) — hạn đã dời hiện ở dòng phụ.">Hạn</Th>
                  <Th hint="Tạm ngưng là còn sống, tiếp tục được bất kỳ lúc nào; dừng hẳn là đã quyết định không làm.">Trạng thái</Th>
                  <Th hint="Việc con chỉ MỘT tầng — không quy thành phần trăm khối lượng.">Việc con</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const phuTrangThai = r.progress === 'paused'
                    ? catDongPhu(`${r.stopReason ?? ''} · cần: ${r.helpName ?? '—'} · xem lại ${r.reviewOn ? fmtDate(r.reviewOn) : '—'}`)
                    : r.progress === 'stopped' ? r.stopReason : null;
                  const phuTrangThaiDu = r.progress === 'paused'
                    ? `${r.stopReason ?? ''} · cần: ${r.helpName ?? '—'} · xem lại ${r.reviewOn ? fmtDate(r.reviewOn) : '—'}`
                    : r.stopReason ?? '';
                  return (
                    <tr key={r.id} className="row-hover cursor-pointer" onClick={() => setOpen(r.id)}>
                      <td className="td">
                        <span className="text-slate-100" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {r.group ? TASK_GROUP_LABEL[r.group as keyof typeof TASK_GROUP_LABEL] : '—'}
                          {' · '}{r.taskType === 'long_term' ? 'Dài hạn' : 'Trong kỳ'}
                          {branchId === null && r.branchName ? ` · ${r.branchName}` : ''}
                        </span>
                      </td>
                      <td className="td text-slate-300">
                        {r.assigneeName ?? <span className="text-slate-500">chưa giao</span>}
                        {r.assigneeNgoai && <span className="ml-1 whitespace-nowrap text-xs text-slate-500">ngoài hệ thống</span>}
                      </td>
                      <td className="td whitespace-nowrap">
                        <Han loai="viec-van-hanh" han={r.due} />
                        {r.hanGoc && (
                          <div className="text-xs text-slate-500 mt-0.5">{dongHanDaDoi({ hanGoc: r.hanGoc, lyDo: r.lyDoDoiHan }, homNay)}</div>
                        )}
                      </td>
                      <td className="td">
                        <NhanViec progress={r.progress} label={r.progressLabel} />
                        {phuTrangThai && <div className="text-xs text-slate-500 mt-0.5" title={phuTrangThaiDu}>{phuTrangThai}</div>}
                      </td>
                      <td className="td text-xs">
                        {r.subTotal > 0 ? <span className="text-slate-300">{r.subDone}/{r.subTotal} xong</span> : <span className="text-slate-600">—</span>}
                        {r.subOverdueCount > 0 && (
                          <div className="text-rose-300 mt-0.5">
                            quá hạn: {r.subOverdueTitles.map((t) => `"${t}"`).join(', ')}
                            {r.subOverdueCount > r.subOverdueTitles.length ? ` và ${r.subOverdueCount - r.subOverdueTitles.length} việc khác` : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NganViecVanHanh taskId={open} onClose={() => setOpen(null)} onDone={reload} />
      <CreateTask open={creating} onClose={() => setCreating(false)} onDone={reload}
        branchId={branchId} defaultGroup={preGroup || undefined} unitReportId={baoCaoId} veKyHop={veKyHop} />
    </div>
  );
}

/** Chi tiết một công việc: hạn + lịch sử dời hạn, việc con, lịch sử cập nhật, Case làm căn cứ. */
export function NganViecVanHanh({ taskId, onClose, onDone }: {
  taskId: number | null; onClose: () => void; onDone: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, reload } = useApi<any>(taskId ? `/mgmt-tasks/${taskId}` : null, [taskId]);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);

  if (taskId === null) return null;
  return (
    <KhungPanel tieuDe={data?.title ?? 'Công việc'} rong="rong" onDong={onClose}
      ngCanh={data ? TASK_GROUP_LABEL[data.group as keyof typeof TASK_GROUP_LABEL] || undefined : undefined}>
      {loading && <div className="pt-3"><Skeleton rows={6} /></div>}
      {data && (
        <div className="space-y-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <NhanViec progress={data.progress} label={data.progressLabel} />
            <Han loai="viec-van-hanh" han={data.due} />
            {data.assigneeName && <Info>{data.assigneeName}{data.assigneeNgoai ? ' · ngoài hệ thống' : ''}</Info>}
            {data.watcherName && <Info>theo dõi: {data.watcherName}</Info>}
          </div>
          {data.hanGoc && (
            <p className="text-xs text-slate-500 m-0">{dongHanDaDoi({ hanGoc: data.hanGoc, lyDo: null }, homNay)}</p>
          )}
          {data.dueHistory?.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-1.5">Lịch sử hạn</h3>
              <ul className="list-none p-0 m-0 space-y-1 text-xs tabular-nums text-slate-400">
                {data.dueHistory.map((h: any, i: number) => (
                  <li key={i}>
                    {/* PR-UXF-a Q16: lần đặt hạn đầu không phải "dời hạn". */}
                    {h.old ? <>Dời hạn {fmtDate(h.old)} → {h.new ? fmtDate(h.new) : '—'}</> : <>Đặt hạn {h.new ? fmtDate(h.new) : '—'}</>}
                    {h.reason && <> · "{h.reason}"</>}
                    {h.by && <span className="text-slate-500"> · {h.by}</span>}
                    {h.at && <span className="text-slate-500"> · {fmtDate(h.at)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.progress === 'paused' && (data.stopReason || data.helpName || data.reviewOn) && (
            <SectionNote>
              <strong>Lý do:</strong> {data.stopReason}
              {data.helpName && <> · cần: {data.helpName}</>}
              {data.reviewOn && <> · hẹn xem lại {fmtDate(data.reviewOn)}</>}
            </SectionNote>
          )}
          {data.progress === 'stopped' && data.stopReason && (
            <SectionNote><strong>Lý do dừng hẳn:</strong> {data.stopReason}</SectionNote>
          )}
          {data.note && <p className="text-sm text-slate-300 m-0">{data.note}</p>}

          {data.viewer.canUpdate && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" onClick={() => setUpdating(true)}>Cập nhật tiến độ</button>
              {data.viewer.canEdit && (
                <>
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setEditing(true)}>Sửa</button>
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setAddingSub(true)}>+ Việc con</button>
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────── việc con, một tầng */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">
              Việc con
              {data.subtasks.length > 0 && (
                <span className="text-slate-500 font-normal tabular-nums ml-2">
                  {data.subtasks.filter((x: any) => x.progress === 'done').length}/{data.subtasks.length} hoàn thành
                </span>
              )}
            </h3>
            {data.subtasks.length === 0 ? (
              <p className="text-xs text-slate-500 m-0">Chưa chia việc con.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-1.5">
                {data.subtasks.map((x: any) => (
                  <li key={x.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${x.overdue ? 'text-rose-300' : 'text-slate-100'}`}>{x.title}</span>
                      <NhanViec progress={x.progress} label={x.progressLabel} />
                    </span>
                    <span className="block text-xs tabular-nums text-slate-500 mt-0.5">
                      {x.assigneeName ?? 'chưa giao'}
                      {x.due ? ` · hạn ${fmtDate(x.due)}` : ''}
                      {x.stopReason ? ` · ${x.stopReason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─────────────────────────────────────────── lịch sử cập nhật */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Lịch sử</h3>
            {data.updates.length === 0 ? (
              <p className="text-xs text-slate-500 m-0">Chưa có cập nhật nào.</p>
            ) : (
              <ol className="list-none p-0 m-0 space-y-2">
                {data.updates.map((u: any) => (
                  <li key={u.id} className="text-xs border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>
                    <span className="text-slate-500 tabular-nums">{fmtDate(u.on)}</span>
                    <span className="ml-2"><NhanViec progress={u.progress} label={u.progressLabel} /></span>
                    {u.by && <span className="text-slate-500 ml-2">{u.by}</span>}
                    {u.note && <div className="text-slate-400 mt-0.5">{u.note}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {data.cases.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 mt-0 mb-2">
                Case làm căn cứ
                {/* ⓘ bấm được (không chỉ rê chuột — luật "không thao tác nào chỉ hiện khi hover"). */}
                <NutLuat label="Về Case làm căn cứ">
                  Liên kết này chỉ là CĂN CỨ. Hoàn thành công việc quản lý KHÔNG đóng Case nào, và cũng không tự tạo phương án cho em nào.
                </NutLuat>
              </h3>
              <ul className="list-none p-0 m-0 space-y-1 text-xs text-slate-300">
                {data.cases.map((c: any) => (
                  <li key={c.id}>{c.title} <span className="text-slate-500">· {c.student_name}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {data && (
        <UpdateDialog open={updating} onClose={() => setUpdating(false)} task={data}
          onDone={() => { reload(); onDone(); }} />
      )}
      {data && (
        <SuaViec open={editing} onClose={() => setEditing(false)} task={data}
          onDone={() => { reload(); onDone(); }} />
      )}
      {data && (
        <CreateTask open={addingSub} onClose={() => setAddingSub(false)} parent={data}
          branchId={data.branchId} onDone={() => { reload(); onDone(); }} />
      )}
    </KhungPanel>
  );
}

/** Ghi một lần cập nhật — cách DUY NHẤT trạng thái công việc đổi. Panel mở đè ngăn chi tiết (`longTrong`). */
function UpdateDialog({ open, onClose, task, onDone }: {
  open: boolean; onClose: () => void; task: any; onDone: () => void;
}) {
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
  if (!open) return null;
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(progress);
  const needHelp = progress === 'paused';
  /* Q11: Hoàn thành/Dừng hẳn việc CHA còn con mở đều bị chặn — không phải chỉ Hoàn thành. */
  const conChuaXong: string[] = task.openSubTitles ?? [];
  const chanKhepLai = (progress === 'done' || progress === 'stopped') && conChuaXong.length > 0;
  const loi: LoiTruong[] = [
    ...(needReason ? dsLoi([{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }], { 'ly-do': reason }) : []),
    ...(needHelp ? dsLoi([{ khoa: 'ho-tro', nhan: 'Cần ai hỗ trợ', chon: true }], { 'ho-tro': help }) : []),
    ...(needHelp && (!reviewOn || reviewOn < homNay) ? [{ khoa: 'xem-lai', nhan: 'Ngày xem lại', lyDo: reviewOn ? 'Từ hôm nay trở đi' : 'Chưa chọn' }] : []),
  ];

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || chanKhepLai || busy) return;
    setBusy(true);
    try {
      await api.post(`/mgmt-tasks/${task.id}/update`, {
        progress, note: note || null, reason: reason || null,
        reviewOn: needHelp ? (reviewOn || null) : null,
        helpUserId: help?.kieu === 'tai_khoan' ? help.id : null,
        helpName: help?.kieu === 'ngoai' ? help.ten : null,
      });
      invalidate('/mgmt-tasks');
      toast.push('ok', 'Đã cập nhật'); onDone(); onClose();
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Cập nhật tiến độ" hocVien={task.title} longTrong onDong={onClose}
      chan={{
        huy: { onClick: onClose, disabled: busy },
        conThieu: chanKhepLai ? [{ nhan: 'Việc con', lyDo: `Còn ${conChuaXong.length} việc con chưa khép lại` }] : lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="space-y-3 pt-3">
        <Field label="Trạng thái" as="div">
          <div className="flex flex-wrap gap-1.5">
            {TASK_PROGRESS.map((s) => (
              <NutChon key={s} nho chon={progress === s} onClick={() => setProgress(s)}>
                {TASK_PROGRESS_LABEL[s]}
              </NutChon>
            ))}
          </div>
        </Field>
        {chanKhepLai && (
          <Alert>
            Còn {conChuaXong.length} việc con chưa khép lại: {conChuaXong.slice(0, 2).map((t) => `"${t}"`).join(', ')}
            {conChuaXong.length > 2 ? ` và ${conChuaXong.length - 2} việc khác` : ''}.
          </Alert>
        )}
        {needReason && (
          <Field label="Lý do" required loi={lf.loiCua(loi, 'ly-do')}
            hint="Một việc tự nhiên im lặng mà không ai biết vì sao là thứ vài tháng sau không ai giải thích được.">
            <input className="field" maxLength={2000} {...lf.o(loi, 'ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        {needHelp && (
          <>
            <Field label="Cần ai hỗ trợ" required loi={lf.loiCua(loi, 'ho-tro')}>
              <div {...lf.o(loi, 'ho-tro')}>
                <ChonNguoi value={help} onChange={setHelp} nhom="nhan_vien" choToi={false} choNgoai ariaLabel="Người cần hỗ trợ" />
              </div>
            </Field>
            <Field label="Ngày xem lại" required hint="Từ ngày cập nhật trở đi." loi={lf.loiCua(loi, 'xem-lai')}>
              <ONgay kieu="ngay" value={reviewOn} onChange={setReviewOn} toiThieu={homNay}
                id={lf.oId('xem-lai')} onBlur={lf.roi('xem-lai')} invalid={!!lf.loiCua(loi, 'xem-lai')} />
            </Field>
          </>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </KhungPanel>
  );
}

/** Sửa phần mô tả: tên, nhóm, người, hạn, ghi chú — không đụng tiến độ. Đổi hạn ĐANG CÓ thì bắt buộc lý do (Q9). */
function SuaViec({ open, onClose, task, onDone }: {
  open: boolean; onClose: () => void; task: any; onDone: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const lf = useLoiForm();
  const [title, setTitle] = useState(task.title);
  const [group, setGroup] = useState(task.group ?? 'curriculum');
  const [assignee, setAssignee] = useState<NguoiChon | null>(task.assigneeUserId
    ? { kieu: 'tai_khoan', id: task.assigneeUserId, ten: task.assigneeName ?? '' }
    : task.assigneeNgoai && task.assigneeName ? { kieu: 'ngoai', ten: task.assigneeName } : null);
  const [watcher, setWatcher] = useState<NguoiChon | null>(task.watcherUserId
    ? { kieu: 'tai_khoan', id: task.watcherUserId, ten: task.watcherName ?? '' } : null);
  const [due, setDue] = useState(task.due ?? '');
  const [lyDoDoiHan, setLyDoDoiHan] = useState('');
  const [note, setNote] = useState(task.note ?? '');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const canDoi = !!task.due && due !== task.due;
  const loi = dsLoi([
    { khoa: 'ten', nhan: 'Tên công việc', toiThieu: 1 },
    ...(canDoi ? [{ khoa: 'ly-do-han', nhan: 'Lý do dời hạn', toiThieu: 1 }] : []),
  ], { ten: title, 'ly-do-han': lyDoDoiHan });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.patch(`/mgmt-tasks/${task.id}`, {
        title, group,
        assigneeUserId: idOfNguoi(assignee, session?.user?.id ?? null),
        assigneeName: tenNgoaiCua(assignee),
        watcherUserId: idOfNguoi(watcher, session?.user?.id ?? null),
        due: due || null,
        lyDoDoiHan: canDoi ? lyDoDoiHan.trim() : null,
        note: note || null,
      });
      invalidate('/mgmt-tasks');
      toast.push('ok', 'Đã lưu'); onDone(); onClose();
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa công việc" hocVien={task.title} longTrong onDong={onClose}
      chan={{
        huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <div className="space-y-3 pt-3">
        <Field label="Tên công việc" required loi={lf.loiCua(loi, 'ten')}>
          <input className="field" maxLength={200} {...lf.o(loi, 'ten')} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Nhóm" required>
          <select className="field" value={group} onChange={(e) => setGroup(e.target.value)}>
            {TASK_GROUPS.map((g) => <option key={g} value={g}>{TASK_GROUP_LABEL[g]}</option>)}
          </select>
        </Field>
        <Field label="Người phụ trách">
          <ChonNguoi value={assignee} onChange={setAssignee} nhom="nhan_vien" choNgoai macDinhTrong="Chưa giao" />
        </Field>
        <Field label="Người theo dõi" hint="Nhìn thấy công việc nhưng KHÔNG sửa được.">
          <ChonNguoi value={watcher} onChange={setWatcher} nhom="nhan_vien" choNgoai={false} macDinhTrong="Không có" />
        </Field>
        <Field label="Hạn">
          <ONgay kieu="ngay" value={due} onChange={setDue} />
        </Field>
        {canDoi && (
          <Field label="Lý do dời hạn" required hint="2–200 ký tự — hạn cũ vẫn hiện lại ở cột Hạn, không mất." loi={lf.loiCua(loi, 'ly-do-han')}>
            <input className="field" maxLength={200} {...lf.o(loi, 'ly-do-han')} value={lyDoDoiHan} onChange={(e) => setLyDoDoiHan(e.target.value)}
              placeholder="Ví dụ: Chờ duyệt ngân sách nhà cung cấp" />
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
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

type LoaiViec = 'chi-nhanh' | 'giao-gv';

/**
 * "+ GIAO VIỆC" — MỘT cửa (K1-36, Câu 1 = A). Hai loại việc khác hẳn nhau nên form chọn trước:
 *
 *   Việc chi nhánh              giáo trình, vận hành. Không gắn học viên nào → `/mgmt-tasks`.
 *   Giao GV theo lớp + kỹ năng  gắn lớp và kỹ năng, TOẢ RA thành PA của từng em → `/tasks` (máy chủ suy chi nhánh từ lớp).
 *
 * "Toả ra": giao cho lớp mười ba em vẫn là MỘT việc, cập nhật MỘT lần — tạo mười ba bản sao thì GV bỏ qua và số tiến độ thành rác.
 * Việc con và việc tạo từ ô Báo cáo đơn vị luôn là việc chi nhánh (không hiện lựa chọn).
 */
type CreateTaskProps = {
  open: boolean; onClose: () => void; onDone: () => void;
  branchId: number | null; parent?: any;
  /** Mở từ một mục báo cáo kỳ họp thì nhóm đã biết trước — đỡ một lần chọn và một lần chọn sai. */
  defaultGroup?: string;
  /** PR-Ra R6: tạo từ ô báo cáo đơn vị — tự nối, rồi quay về đúng tuần đó. */
  unitReportId?: number | null;
  veKyHop?: string | null;
};

/**
 * PR-GVa (F03): VỎ của form — mỗi lần đóng → mở là MỘT lần mở mới, ruột mount lại theo `key`. Nhờ vậy giá trị đầu (chi nhánh theo bộ
 * lọc / việc cha lúc mở), khoá gửi và lỗi form đều mới mỗi lần mở; rerender trong lúc mở không ghi đè lựa chọn của người dùng.
 * Trước đây ruột luôn mount (chỉ `return null` khi đóng) nên state đầu là của lần dựng trang: lọc "Tất cả", đổi sang A rồi mở → việc vẫn lưu "Toàn hệ thống".
 */
function CreateTask(props: CreateTaskProps) {
  const lan = useRef(0);
  const moTruoc = useRef(false);
  if (props.open && !moTruoc.current) lan.current += 1;   // đóng → mở: một lần mở mới
  moTruoc.current = props.open;
  return props.open ? <CreateTaskForm key={lan.current} {...props} /> : null;
}

function CreateTaskForm({ onClose, onDone, branchId, parent, defaultGroup, unitReportId, veKyHop }: CreateTaskProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const lf = useLoiForm();
  const chiChiNhanh = !!parent || !!unitReportId;
  const [loai, setLoai] = useState<LoaiViec>('chi-nhanh');
  const giaoGv = !chiChiNhanh && loai === 'giao-gv';
  const branches = useApi<any[]>(!parent ? '/ref/branches' : null, []);
  const classes = useApi<{ rows: { id: number; code: string; studentCount: number }[] }>(giaoGv ? '/classes' : null, [giaoGv]);
  /* Việc giao GV gắn tuần đang chạy — hiện ở Báo cáo đơn vị › "Việc được giao" của tuần đó (như trước khi gộp cửa). */
  const tuanNay = useApi<{ id: number | null; weekStart: string; code?: string; isAnchor: boolean }[]>(giaoGv ? '/ref/period-window' : null, [giaoGv]);
  /* F04: chưa rõ tuần (đang tải, lỗi, không có tuần neo) thì KHÔNG giao — việc giao GV thiếu kỳ không hiện ở danh sách tuần nào. */
  const ky = trangThaiKyGiao(tuanNay);
  /* Giá trị đầu tính MỘT lần lúc mở (F03). Hạn việc con = hạn cha trừ một ngày (mục 8.6); hạn cha đã qua thì để trống. */
  const [dau] = useState(() => giaTriDauGiaoViec({ branchId, parent, defaultGroup }, homNay));
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<string>(dau.group);
  const [assignee, setAssignee] = useState<NguoiChon | null>(null);
  const [watcher, setWatcher] = useState<NguoiChon | null>(null);
  const [due, setDue] = useState(dau.due);
  const [branch, setBranch] = useState(dau.branch);
  const [classId, setClassId] = useState('');
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  /*
   * PR-GVa (F01 = D13): MỘT khoá gửi cho MỘT lần mở form. Bấm đúp / thử lại sau lỗi mạng gửi lại đúng khoá này nên máy chủ trả việc
   * đã có. KHÔNG đổi khoá khi lỗi; lần mở mới (vỏ mount lại ruột) mới có khoá mới.
   */
  const khoa = useRef(moiKhoaGui('cv'));
  const daSua = !!(title || note || classId || topic || assignee || watcher) || loai !== 'chi-nhanh'
    || group !== dau.group || due !== dau.due || branch !== dau.branch;

  const cls = classes.data?.rows.find((c) => String(c.id) === classId);
  const loi = dsLoi([
    { khoa: 'ten', nhan: giaoGv ? 'Nội dung' : 'Tên công việc', toiThieu: 1 },
    ...(giaoGv ? [{ khoa: 'lop', nhan: 'Lớp', chon: true }, { khoa: 'ky-nang', nhan: 'Kỹ năng', chon: true }] : []),
  ], { ten: title, lop: classId, 'ky-nang': topic });

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
          catch { toast.push('error', 'Chưa xác định được tuần — bấm Thử lại.'); return; }
        }
        await api.post('/tasks', {
          kind: 'teacher_task', title, note: note.trim() || undefined, periodId, dueDate: due || undefined,
          classId: Number(classId), topic, idempotencyKey: khoa.current,
        });
        invalidate('/tasks'); invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
        toast.push('ok', `Đã giao việc cho ${cls?.studentCount ?? 0} em lớp ${cls?.code ?? ''}`.trim());
      } else {
        await api.post('/mgmt-tasks', {
          title, group,
          assigneeUserId: idOfNguoi(assignee, session?.user?.id ?? null),
          assigneeName: tenNgoaiCua(assignee),
          watcherUserId: idOfNguoi(watcher, session?.user?.id ?? null),
          due: due || null, branchId: branch || null, note: note || null,
          parentTaskId: parent?.id ?? null,
          unitReportId: unitReportId ?? null,
          idempotencyKey: khoa.current,
        });
        invalidate('/mgmt-tasks');
        toast.push('ok', 'Đã tạo công việc');
      }
      /* Đóng form; giao tiếp là mở lại → giá trị đầu đúng ngữ cảnh lúc đó và khoá gửi mới. */
      onDone(); onClose();
      if (unitReportId && veKyHop) navigate(`/cong-viec/bao-cao?periodId=${veKyHop}`);
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={parent ? 'Việc con' : 'Giao việc'} hocVien={parent?.title ?? null} longTrong={!!parent} onDong={onClose}
      chan={{
        daSua: daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || (giaoGv && !duocGiao(ky, busy))} onClick={tao}>{busy ? 'Đang lưu…' : giaoGv ? 'Giao' : 'Tạo'}</button>,
      }}>
      <div className="space-y-3 pt-3">
        {!chiChiNhanh && (
          <Field label="Loại việc" as="div">
            <div className="flex flex-wrap gap-1.5">
              <NutChon nho chon={loai === 'chi-nhanh'} onClick={() => { setLoai('chi-nhanh'); lf.datLai(); }}>Việc chi nhánh</NutChon>
              <NutChon nho chon={loai === 'giao-gv'} onClick={() => { setLoai('giao-gv'); lf.datLai(); }}>Giao GV theo lớp + kỹ năng</NutChon>
            </div>
          </Field>
        )}
        <Field label={giaoGv ? 'Nội dung' : 'Tên công việc'} required loi={lf.loiCua(loi, 'ten')}>
          <input className="field" maxLength={200} {...lf.o(loi, 'ten')} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={parent ? 'Ví dụ: Soạn phần Listening' : giaoGv ? 'Ví dụ: Tăng 15 phút luyện nghe chi tiết mỗi buổi' : 'Ví dụ: Xây dựng giáo trình Beginner'} />
        </Field>
        {giaoGv ? (
          <>
            <Field label="Lớp" required loi={lf.loiCua(loi, 'lop')}>
              <select className="field" {...lf.o(loi, 'lop')} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Chọn lớp</option>
                {(classes.data?.rows ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} · {c.studentCount} em</option>
                ))}
              </select>
            </Field>
            <Field label="Kỹ năng" required as="div" loi={lf.loiCua(loi, 'ky-nang')}>
              <div className="flex flex-wrap gap-1.5" {...lf.o(loi, 'ky-nang')}>
                {ENTRY_SKILLS.map((k) => (
                  <NutChon key={k} nho chon={topic === k} onClick={() => setTopic(k)}>{ENTRY_SKILL_LABEL[k]}</NutChon>
                ))}
              </div>
            </Field>
            <Field label="Tuần" as="div">
              {ky.loai === 'co' ? (
                <p className="m-0 text-sm tabular-nums">{tuanLich(ky.weekStart, homNay)}</p>
              ) : ky.loai === 'dang-tai' ? (
                <p className="m-0 text-sm text-slate-500" role="status">Đang lấy tuần hiện tại…</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2" role="alert">
                  <p className="m-0 text-sm text-bad">
                    {ky.loai === 'loi' ? 'Chưa lấy được tuần hiện tại nên chưa giao được.' : 'Không xác định được tuần hiện tại nên chưa giao được.'}
                  </p>
                  <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={tuanNay.reload}>Thử lại</button>
                </div>
              )}
            </Field>
            <SectionNote>
              Việc này hiện trong hồ sơ của <strong>{cls ? `${cls.studentCount} em lớp ${cls.code}` : 'từng em trong lớp'}</strong>, ở đúng
              ô kỹ năng đã chọn — nhưng vẫn là <strong>một việc</strong>, cập nhật một lần. Em nào chưa có Case ở kỹ năng đó thì hệ thống mở
              Case mới, ghi rõ là mở theo yêu cầu QL, và đưa thẳng vào <em>đang xử lý</em> — PA chính là việc này.
            </SectionNote>
          </>
        ) : (
          <>
            {!parent && (
              <Field label="Nhóm" required>
                <select className="field" value={group} onChange={(e) => setGroup(e.target.value)}>
                  {TASK_GROUPS.map((g) => <option key={g} value={g}>{TASK_GROUP_LABEL[g]}</option>)}
                </select>
              </Field>
            )}
            <Field label="Người phụ trách">
              <ChonNguoi value={assignee} onChange={setAssignee} nhom="nhan_vien" choToi choNgoai macDinhTrong="Chưa giao" />
            </Field>
            <Field label="Người theo dõi" hint="Nhìn thấy công việc nhưng KHÔNG sửa được.">
              <ChonNguoi value={watcher} onChange={setWatcher} nhom="nhan_vien" choToi choNgoai={false} macDinhTrong="Không có" />
            </Field>
          </>
        )}
        <Field label="Hạn" hint={parent ? 'Mặc định là hạn của việc cha trừ một ngày — sửa được ngay.' : undefined}>
          <ONgay kieu="ngay" value={due} onChange={setDue} />
        </Field>
        {!parent && !giaoGv && (
          <Field label="Chi nhánh">
            <select className="field" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Toàn hệ thống</option>
              {(branches.data ?? []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </KhungPanel>
  );
}
