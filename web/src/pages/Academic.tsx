import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Card, Empty, ErrorState, KpiTile, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { CasePanel } from '../components/CasePanel.tsx';
import { fmtDate, sosLabel, sosTone } from '../lib/format.ts';
import {
  BEHAVIOUR_TOPICS, BEHAVIOUR_TOPIC_LABEL, ENTRY_SKILLS, ENTRY_SKILL_LABEL,
  ISSUE_TAXONOMY, REGULAR_SKILL_LABEL, THREAD_TRACKS, THREAD_TRACK_LABEL, issueLabel,
} from '@shared/domain.ts';

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
type Facets = {
  group: Record<string, number>; skill: Record<string, number>;
  issueBranch: Record<string, number>; branch: Record<string, number>;
  state: Record<string, number>;
  groupNone: number; skillNone: number; total: number;
};

const STATE_LABEL: Record<string, string> = {
  no_plan: 'Chưa có phương án hỗ trợ',
  working: 'Đang xử lý',
  done: 'Đã xong',
};

export default function AcademicPage() {
  return (
    <div className="space-y-4 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Tình hình chung</h1>
        <p className="text-xs text-slate-500 mt-1 mb-0">
          Vấn đề đang theo dõi trong phạm vi bạn được xem — cả vấn đề sinh từ điểm và vấn đề giáo viên báo.
        </p>
      </div>
      <CaseBoard />
    </div>
  );
}

/**
 * Bảng vấn đề, dùng CHUNG cho trang riêng và cho tab "Tình hình chung" của Tổng quan.
 * Một bản cài đặt, một cách đọc số — không có chuyện hai màn hình đếm lệch nhau.
 */
export function CaseBoard() {
  const [params, setParams] = useSearchParams();
  const queue = params.get('hang-doi') ?? '';
  const branchId = params.get('cn') ?? '';
  const group = params.get('nhom') ?? '';
  const skill = params.get('ky-nang') ?? '';
  /*
   * BA TRẠNG THÁI LOẠI TRỪ NHAU, cộng lại đúng bằng tổng — đây là câu hỏi "bức tranh chung
   * đang ở đâu", khác với bốn hàng đợi ở trên ("làm gì trước"). Trộn hai cách nhìn vào một
   * hàng nút là cách chắc chắn nhất để không ai tin con số nào nữa.
   */
  const state = params.get('tinh-hinh') ?? '';
  const [openCase, setOpenCase] = useState<number | null>(null);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: false });
  };

  const qs = new URLSearchParams();
  if (queue) qs.set('queue', queue);
  if (branchId) qs.set('branchId', branchId);
  if (group) qs.set('group', group);
  if (skill) qs.set('skill', skill);
  const suffix = qs.toString() ? `?${qs}` : '';

  const branches = useApi<any[]>('/ref/branches');
  const counts = useApi<any>(`/cases/queues${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  const list = useApi<{ rows: any[]; scopeEmpty: boolean; facets: Facets }>(
    `/cases${suffix}`, [queue, branchId, group, skill],
  );

  if (list.error) return <ErrorState message={list.error.message} hint={list.error.hint} onRetry={list.reload} />;

  /*
   * KHÔNG GIẤU VẤN ĐỀ ĐÃ XONG, chỉ LÀM MỜ và đẩy xuống cuối.
   *
   * Bản trước có thêm một bộ lọc "Phạm vi: Đang mở / Đã kết thúc / Tất cả" nằm cạnh ô
   * "Đã xong". Hai thứ nói cùng một chuyện bằng hai cách, và mặc định lọc bỏ vấn đề đã
   * xong khiến ô "Đã xong" lúc nào cũng bằng 0 — nhìn như hệ thống hỏng. Nay chỉ còn một
   * cách: ba ô trạng thái.
   */
  const inScope = list.data?.rows ?? [];
  const rows = (state ? inScope.filter((r) => r.state === state) : inScope)
    .slice()
    .sort((a, b) => (a.state === 'done' ? 1 : 0) - (b.state === 'done' ? 1 : 0));
  const f = list.data?.facets;
  /** Đếm trong đúng tập đang hiển thị, để số trên ô và số dòng bên dưới không lệch nhau. */
  const stateCount = (k: string) => inScope.filter((r) => r.state === k).length;

  const topicLabel = (k: string) =>
    BEHAVIOUR_TOPIC_LABEL[k as keyof typeof BEHAVIOUR_TOPIC_LABEL]
    ?? ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL]
    ?? REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL]
    ?? k;
  /* Thứ tự cố định trước, rồi tới những chủ đề khác thực sự có mặt (kỹ năng lớp thường). */
  const known = group === 'behaviour' ? [...BEHAVIOUR_TOPICS] : [...ENTRY_SKILLS];
  const topicKeys = [
    ...known.filter((k) => (f?.skill[k] ?? 0) > 0 || !skill),
    ...Object.keys(f?.skill ?? {}).filter((k) => !known.includes(k as never)).sort(),
  ];

  return (
    <div className="space-y-4">
      {/*
        BA TRẠNG THÁI LOẠI TRỪ NHAU, cộng lại đúng bằng tổng.

        Bản trước để bốn ô hàng đợi ở đây ("Chưa làm", "Đang hỗ trợ", "Tới hạn xem lại",
        "Cần xem kỹ") — bốn câu hỏi cố tình chồng nhau, nên bốn số không cộng thành gì cả
        và người đọc không biết mình đang nhìn một phép chia hay một danh sách. Nay ba ô ở
        đây là BỨC TRANH CHUNG; hai câu hỏi còn lại xuống dưới, nói rõ là câu hỏi.
      */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {(['no_plan', 'working', 'done'] as const).map((k) => (
          <QueueTile key={k} label={STATE_LABEL[k]} value={stateCount(k)} active={state === k}
            dim={k === 'done'}
            onClick={() => set('tinh-hinh', state === k ? '' : k)} />
        ))}
      </div>

      {/* ---------------------------------------------- bộ lọc */}
      <Card title="Lọc">
        <div className="space-y-3">
          {(branches.data ?? []).length > 1 && (
            <FilterRow label="Chi nhánh">
              {/* Chỉ ai có phạm vi toàn hệ thống mới thấy nhiều hơn một chi nhánh ở đây. */}
              <Chip active={!branchId} onClick={() => set('cn', '')}>Cả trung tâm</Chip>
              {(branches.data ?? []).map((b) => (
                <Chip key={b.id} active={branchId === String(b.id)} onClick={() => set('cn', String(b.id))}>
                  {b.code}{f?.branch[String(b.id)] ? ` · ${f.branch[String(b.id)]}` : ''}
                </Chip>
              ))}
            </FilterRow>
          )}
          {/*
            HAI CÂU HỎI, không phải hai phần của một tổng: một em có thể vừa tới hạn xem
            lại vừa ở mức cao. Để riêng khỏi ba ô trên, và nói thẳng là câu hỏi.
          */}
          <FilterRow label="Cần chú ý">
            <Chip active={queue === 'due'} onClick={() => set('hang-doi', queue === 'due' ? '' : 'due')}>
              Tới hạn xem lại · {counts.data?.due ?? 0}
            </Chip>
            <Chip active={queue === 'review'} onClick={() => set('hang-doi', queue === 'review' ? '' : 'review')}>
              Mức cao hoặc gấp · {counts.data?.review ?? 0}
            </Chip>
          </FilterRow>
          <FilterRow label="Đầu mục">
            <Chip active={!group} onClick={() => set('nhom', '')}>Tất cả</Chip>
            {THREAD_TRACKS.map((t) => (
              <Chip key={t} active={group === t} onClick={() => set('nhom', group === t ? '' : t)}>
                {THREAD_TRACK_LABEL[t]} · {f?.group[t] ?? 0}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label={group === 'behaviour' ? 'Về việc gì' : 'Kỹ năng'}>
            <Chip active={!skill} onClick={() => set('ky-nang', '')}>Tất cả</Chip>
            {/*
              Dựng chip từ CHÍNH số đếm trả về, không từ một danh sách viết cứng: lớp thường
              có kỹ năng riêng (Prep-Writing, Pronunciation) và nếu chỉ vẽ năm ô IELTS thì
              các số cộng lại không bằng tổng — đúng thứ đang cố tránh.
            */}
            {topicKeys.map((k) => (
              <Chip key={k} active={skill === k} onClick={() => set('ky-nang', skill === k ? '' : k)}>
                {topicLabel(k)} · {f?.skill[k] ?? 0}
              </Chip>
            ))}
            {/*
              Vấn đề cũ chưa gắn được kỹ năng: bước nâng cấp cố ý không đoán bừa khi một lượt
              trượt từ hai kỹ năng trở lên. Có ô riêng để các số cộng lại đúng bằng tổng.
            */}
            {(f?.skillNone ?? 0) > 0 && (
              <Chip active={skill === 'none'} onClick={() => set('ky-nang', skill === 'none' ? '' : 'none')}>
                Chưa gắn kỹ năng · {f?.skillNone}
              </Chip>
            )}
          </FilterRow>
        </div>
          {f && Object.keys(f.issueBranch).length > 0 && (
            <FilterRow label="Cụ thể là">
              {/*
                Không phải nút bấm — đây là bức tranh bên trong lựa chọn hiện tại, để đọc
                "Học sinh 18 › Listening 6" mà không phải bấm thử từng cái.
              */}
              <span className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                {Object.entries(f.issueBranch)
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, n]) => (
                    <span key={code} className="text-xs text-slate-400">
                      {issueLabel(code)} <span className="tabular-nums text-slate-200">{n}</span>
                    </span>
                  ))}
              </span>
            </FilterRow>
          )}
        <SectionNote>
          Mọi vấn đề đều thuộc <strong>Học thuật</strong> (theo năm ô L · R · W1 · W2 · S) hoặc
          <strong> Ý thức</strong>. Vấn đề về giáo viên và giáo trình không nằm ở đây — đó không phải
          vấn đề của học viên, và chúng thuộc <strong>Báo cáo tuần chi nhánh</strong>.
          Dòng “Cụ thể là” bên dưới là <strong>nhận định của người dạy</strong>: hệ thống biết em vướng
          kỹ năng nào, còn vì sao thì phải có người nhận định.
        </SectionNote>
      </Card>

      {/* ---------------------------------------------- danh sách */}
      <Card
        title={`Vấn đề (${rows.length})`}
        action={state
          ? <button className="btn btn-sm btn-ghost" onClick={() => set('tinh-hinh', '')}>
              Bỏ lọc {STATE_LABEL[state].toLowerCase()}
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
                    <th className="th">Kỹ năng · nguyên nhân</th>
                    <th className="th">Nguồn</th>
                    <th className="th">Đã làm</th>
                    <th className="th">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}
                      /* Đã xong thì LÀM MỜ chứ không giấu — vẫn đọc lại được, nhưng không tranh chỗ. */
                      className={`row-hover cursor-pointer ${r.state === 'done' ? 'opacity-45' : ''}`}
                      onClick={() => setOpenCase(r.id)}>
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
                        {r.topicLabel && <Pill tone="neutral">{r.topicLabel}</Pill>}
                        {r.primaryLabel
                          ? <div className="mt-0.5"><Pill tone="info">{r.primaryLabel}</Pill></div>
                          : <div className="text-[10px] text-slate-600 mt-0.5">chưa rõ nguyên nhân</div>}
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
                        {/*
                          Dùng đúng BA TRẠNG THÁI của ba ô trên, không dùng trạng thái thô
                          trong database: một case có hai việc đã ghi mà cột này vẫn đề
                          "Chưa xử lý" thì người đọc chỉ có thể kết luận là số liệu sai.
                        */}
                        <Pill tone={r.state === 'done' ? 'muted' : r.state === 'no_plan' ? 'warn' : 'info'}>
                          {STATE_LABEL[r.state]}
                        </Pill>
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

function QueueTile({ label, value, active, onClick, dim = false }: {
  label: string; value: number | undefined; active: boolean; onClick: () => void; dim?: boolean;
}) {
  return (
    <button onClick={onClick}
      /* "Đã xong" làm mờ chứ không giấu: vẫn tra lại được, nhưng không tranh chỗ với việc đang mở. */
      className={`text-left rounded-lg border p-3 transition-colors ${dim && !active ? 'opacity-50' : ''} ${
        active ? 'bg-[color:var(--accent-soft)]' : 'hover:bg-white/5'}`}
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
