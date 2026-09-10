import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Card, Empty, ErrorState, KpiTile, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { CasePanel } from '../components/CasePanel.tsx';
import { caseStatusLabel, caseStatusTone, fmtDate, sosLabel, sosTone } from '../lib/format.ts';
import { ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, ISSUE_GROUP_LABEL, ISSUE_TAXONOMY } from '@shared/domain.ts';

/**
 * HỌC THUẬT — nơi Quản lý nhìn thấy VẤN ĐỀ, không phải ba mươi chỉ số.
 *
 * Bốn hàng đợi ở đầu trang trả lời bốn câu hỏi khác nhau, cố tình KHÔNG chia hết một
 * tổng: một vấn đề có thể vừa "đang hỗ trợ" vừa "tới hạn xem lại". Đây là bốn câu hỏi,
 * không phải một phép chia.
 *
 * Đi sâu theo: chi nhánh → nhóm vấn đề → kỹ năng → một vấn đề cụ thể. Mọi lựa chọn nằm
 * trên URL nên Back giữ nguyên bộ lọc và gửi đường dẫn cho người khác vẫn ra đúng màn hình.
 *
 * Quản lý KHÔNG phải cửa duyệt: không có vấn đề nào bắt buộc phải có ý kiến của Quản lý
 * mới được xử lý tiếp.
 */
export default function AcademicPage() {
  const [params, setParams] = useSearchParams();
  const queue = params.get('hang-doi') ?? '';
  const branchId = params.get('cn') ?? '';
  const group = params.get('nhom') ?? '';
  const skill = params.get('ky-nang') ?? '';
  /*
   * Mặc định chỉ hiện vấn đề ĐANG MỞ. Trộn cả vấn đề đã kết thúc vào danh sách làm việc
   * thì con số ở đầu trang và số dòng bên dưới không khớp nhau, và người dùng phải tự
   * lọc bằng mắt. Vẫn xem lại được vấn đề đã đóng bằng một lần bấm.
   */
  const scope = params.get('pham-vi') ?? 'open';
  const [openCase, setOpenCase] = useState<number | null>(null);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: false });
  };

  const qs = new URLSearchParams();
  if (queue) qs.set('queue', queue);
  if (scope === 'done') qs.set('status', 'done');
  if (branchId) qs.set('branchId', branchId);
  if (group) qs.set('group', group);
  if (skill) qs.set('skill', skill);
  const suffix = qs.toString() ? `?${qs}` : '';

  const branches = useApi<any[]>('/ref/branches');
  const counts = useApi<any>(`/cases/queues${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  const list = useApi<{ rows: any[]; scopeEmpty: boolean }>(`/cases${suffix}`, [queue, branchId, group, skill, scope]);

  if (list.error) return <ErrorState message={list.error.message} hint={list.error.hint} onRetry={list.reload} />;

  /*
   * Hàng đợi đã tự loại vấn đề đã kết thúc, nên chỉ cần lọc thêm khi người dùng không
   * chọn hàng đợi nào.
   */
  const all = list.data?.rows ?? [];
  const rows = queue || scope === 'all' || scope === 'done'
    ? all
    : all.filter((r) => r.status !== 'done');
  const closedCount = all.filter((r) => r.status === 'done').length;

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Học thuật</h1>
        <p className="text-xs text-slate-500 mt-1 mb-0">
          Vấn đề đang theo dõi trong phạm vi bạn được xem — cả vấn đề sinh từ điểm và vấn đề giáo viên báo.
        </p>
      </div>

      {/* ---------------------------------------------- bốn hàng đợi */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <QueueTile label="Chưa làm" value={counts.data?.newCases} active={queue === 'new'}
          onClick={() => set('hang-doi', queue === 'new' ? '' : 'new')} />
        <QueueTile label="Đang hỗ trợ / theo dõi" value={counts.data?.active} active={queue === 'active'}
          onClick={() => set('hang-doi', queue === 'active' ? '' : 'active')} />
        <QueueTile label="Tới hạn xem lại" value={counts.data?.due} active={queue === 'due'}
          onClick={() => set('hang-doi', queue === 'due' ? '' : 'due')} />
        <QueueTile label="Cần xem kỹ" value={counts.data?.review} active={queue === 'review'}
          onClick={() => set('hang-doi', queue === 'review' ? '' : 'review')} />
      </div>

      {/* ---------------------------------------------- bộ lọc */}
      <Card title="Lọc">
        <div className="space-y-3">
          {(branches.data ?? []).length > 1 && (
            <FilterRow label="Chi nhánh">
              <Chip active={!branchId} onClick={() => set('cn', '')}>Tất cả</Chip>
              {(branches.data ?? []).map((b) => (
                <Chip key={b.id} active={branchId === String(b.id)} onClick={() => set('cn', String(b.id))}>
                  {b.code}
                </Chip>
              ))}
            </FilterRow>
          )}
          <FilterRow label="Phạm vi">
            <Chip active={scope === 'open'} onClick={() => set('pham-vi', '')}>Đang mở</Chip>
            <Chip active={scope === 'done'} onClick={() => set('pham-vi', 'done')}>Đã kết thúc</Chip>
            <Chip active={scope === 'all'} onClick={() => set('pham-vi', 'all')}>Tất cả</Chip>
          </FilterRow>
          <FilterRow label="Nhóm vấn đề">
            <Chip active={!group} onClick={() => set('nhom', '')}>Tất cả</Chip>
            {(['student', 'teacher', 'curriculum'] as const).map((g) => (
              <Chip key={g} active={group === g} onClick={() => set('nhom', g)}>{ISSUE_GROUP_LABEL[g]}</Chip>
            ))}
          </FilterRow>
          <FilterRow label="Kỹ năng">
            <Chip active={!skill} onClick={() => set('ky-nang', '')}>Tất cả</Chip>
            {ASSESSED_SKILLS.map((s) => (
              <Chip key={s} active={skill === s} onClick={() => set('ky-nang', s)}>{ASSESSED_SKILL_LABEL[s]}</Chip>
            ))}
          </FilterRow>
        </div>
        <SectionNote>
          Ba nhóm ở trên là <strong>nhận định của người ghi</strong>, không phải kết luận của hệ thống.
          Vấn đề sinh từ điểm chỉ biết kỹ năng nào dưới kỳ vọng, nên phần lớn nằm ở “chưa phân loại”
          cho tới khi có người dạy nhận định. Nhóm “Quá trình dạy” nói về cách dạy có thể cải thiện,
          không phải bảng xếp hạng giáo viên.
        </SectionNote>
      </Card>

      {/* ---------------------------------------------- danh sách */}
      <Card
        title={`Vấn đề (${rows.length})`}
        action={scope === 'open' && closedCount > 0 && !queue
          ? <button className="btn btn-sm btn-ghost" onClick={() => set('pham-vi', 'all')}>
              +{closedCount} đã kết thúc
            </button>
          : null}
        bodyClass="p-0">
        {list.loading ? <div className="p-4"><Skeleton rows={6} /></div>
          : list.data?.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
          : rows.length === 0 ? <div className="p-4"><Empty title="Không có vấn đề nào khớp bộ lọc" /></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Học viên</th>
                    <th className="th">Nội dung</th>
                    <th className="th">Phân loại</th>
                    <th className="th">Nguồn</th>
                    <th className="th">Đã làm</th>
                    <th className="th">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="row-hover cursor-pointer" onClick={() => setOpenCase(r.id)}>
                      <td className="td whitespace-nowrap">
                        <span className="text-slate-100">{r.studentName}</span>
                        <div className="text-[10px] text-slate-500">{r.classCode ?? '—'}</div>
                      </td>
                      <td className="td text-slate-300">
                        {r.headline}
                        <div className="text-[10px] text-slate-500">
                          {fmtDate(r.detectedAt)}{r.reporterName ? ` · ${r.reporterName}` : ''}
                        </div>
                      </td>
                      <td className="td">
                        {r.primaryLabel
                          ? <Pill tone="info">{r.primaryLabel}</Pill>
                          : <span className="text-slate-600 text-xs">chưa phân loại</span>}
                      </td>
                      <td className="td text-xs text-slate-400 whitespace-nowrap">
                        {r.originKind === 'teacher_report' ? 'Giáo viên báo' : `Điểm · MT${r.attemptNo ?? '?'}`}
                      </td>
                      <td className="td text-xs text-slate-300">
                        {r.interventionCount > 0 ? `${r.interventionCount} việc` : '—'}
                        {r.nextDue && (
                          <div className={`text-[10px] ${r.dueOverdue ? 'text-amber-200/80' : 'text-slate-500'}`}>
                            hẹn {fmtDate(r.nextDue)}
                          </div>
                        )}
                      </td>
                      <td className="td whitespace-nowrap">
                        <Pill tone={caseStatusTone(r.status)}>{caseStatusLabel(r.status)}</Pill>
                        {r.sosLevel !== null && (
                          <div className="mt-0.5"><Pill tone={sosTone(r.sosLevel)}>{sosLabel(r.sosLevel)}</Pill></div>
                        )}
                        {r.urgency && r.urgency !== 'normal' && (
                          <div className="mt-0.5">
                            <Pill tone={r.urgency === 'urgent' ? 'danger' : 'warn'}>
                              {r.urgency === 'urgent' ? 'Gấp' : 'Cần chú ý'}
                            </Pill>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề học vụ"
        footer={openCase !== null ? <Link className="btn" to={`/hoc-thuat/case/${openCase}`}>Mở trang riêng</Link> : null}>
        {openCase !== null && <CasePanel caseId={openCase} />}
      </Drawer>
    </div>
  );
}

/** Trang riêng của một vấn đề — chia sẻ đường dẫn được, mở từ đâu cũng về đúng bản ghi này. */
export function CaseRoutePage() {
  const { id } = useParams();
  return (
    <div className="max-w-[900px] space-y-3">
      <Link className="btn btn-sm btn-ghost" to="/hoc-thuat">← Học thuật</Link>
      <Card title="Vấn đề học vụ">
        <CasePanel caseId={Number(id)} />
      </Card>
    </div>
  );
}

function QueueTile({ label, value, active, onClick }: {
  label: string; value: number | undefined; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors ${active ? 'bg-[color:var(--accent-soft)]' : 'hover:bg-white/5'}`}
      style={{ borderColor: active ? 'var(--accent-line)' : 'var(--line)' }}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl tabular-nums text-slate-100 mt-1">{value ?? '—'}</div>
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <span className="flex flex-wrap gap-1">{children}</span>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`btn btn-sm ${active ? 'btn-primary' : ''}`} onClick={onClick}>{children}</button>
  );
}

export { ISSUE_TAXONOMY, KpiTile };
