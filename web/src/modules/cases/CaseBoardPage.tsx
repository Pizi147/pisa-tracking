import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, KpiTile, Pill, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { CasePanel } from './CasePanel.tsx';
import { SummaryTable } from '../worklist/SummaryTable.tsx';
import { WeeklyBoard } from '../worklist/WeeklyBoard.tsx';
import { ManagerTasks, ManagerTaskList } from '../worklist/ManagerTasks.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import {
  BEHAVIOUR_TOPICS, BEHAVIOUR_TOPIC_LABEL, ENTRY_SKILLS, ENTRY_SKILL_LABEL,
  ISSUE_TAXONOMY, PERMISSIONS, REGULAR_SKILL_LABEL, issueLabel,
} from '@shared/domain/index.ts';

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
  classKind: Record<string, number>;
  groupNone: number; skillNone: number; total: number;
};

/** Bộ lọc loại lớp — thay cho bộ lọc "Đầu mục" đã bỏ (mục 10.1). */
const CLASS_KINDS = [
  { key: 'normal', label: 'Normal', hint: 'Lớp Foundation, Beginner, Elementary — chấm theo tỷ lệ câu đúng.' },
  { key: 'ft', label: 'Fulltime IELTS', hint: 'Lớp FT — chấm theo band và có lịch MT riêng từng em.' },
] as const;

const STATE_LABEL: Record<string, string> = {
  no_plan: 'Chưa có phương án hỗ trợ',
  working: 'Đang xử lý',
  done: 'Đã xong',
};

export default function AcademicPage() {
  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Thực trạng</h1>
        <p className="text-xs text-slate-500 mt-1 mb-0">
          Học viên đang yếu ở đâu — cả case sinh từ điểm và case giáo viên báo.
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
export function CaseBoard({ embedded = false }: { embedded?: boolean } = {}) {
  const { session, can, branchCount } = useSession();
  const [params, setParams] = useSearchParams();
  const queue = params.get('hang-doi') ?? '';
  const branchId = params.get('cn') ?? '';
  /*
   * BỘ LỌC "ĐẦU MỤC" ĐÃ BỎ (mục 10.1), thay bằng LOẠI LỚP.
   *
   * Học thuật / Ý thức là một phép chia gần như vô dụng khi lọc: chín phần mười case là Học
   * thuật, nên chọn nó gần như không lọc gì. Normal và FT mới là phép chia người dùng thật
   * sự nghĩ theo — hai loại lớp chấm khác nhau, có kỹ năng khác nhau, và thường do những
   * người khác nhau phụ trách.
   */
  const classKind = params.get('loai-lop') ?? '';
  const group = params.get('nhom') ?? '';
  const skill = params.get('ky-nang') ?? '';
  /* Hai chế độ xem của Thực trạng (mục 10.5): bảng chi nhánh/lớp, và bảng theo tuần. */
  const mode = params.get('xem') === 'tuan' ? 'week' : 'place';
  const [taskPeriod, setTaskPeriod] = useState<number | null>(null);
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
  if (classKind) qs.set('classKind', classKind);
  if (group) qs.set('group', group);
  if (skill) qs.set('skill', skill);
  const suffix = qs.toString() ? `?${qs}` : '';

  const branches = useApi<any[]>('/ref/branches');
  const counts = useApi<any>(`/cases/queues${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  const list = useApi<{ rows: any[]; scopeEmpty: boolean; facets: Facets }>(
    `/cases${suffix}`, [queue, branchId, classKind, group, skill],
  );

  /*
   * QUẢN LÝ CHI NHÁNH VÀO THẲNG GÓC NHÌN THEO LỚP (mục 10.2).
   *
   * Người chỉ quản một chi nhánh mà phải bấm vào chi nhánh của chính mình mới thấy lớp là
   * một cú bấm thừa, lặp lại mỗi lần mở màn. Ai có nhiều chi nhánh thì vẫn vào góc nhìn
   * tổng hợp trước — với họ câu hỏi đầu tiên đúng là "chi nhánh nào đang nặng".
   */
  useEffect(() => {
    if (branchId || branchCount !== 1) return;
    const only = branches.data?.length === 1 ? branches.data[0] : null;
    if (!only) return;
    const next = new URLSearchParams(params);
    next.set('cn', String(only.id));
    setParams(next, { replace: true });
  }, [branches.data, branchId, branchCount, params, setParams]);

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
        HAI CHẾ ĐỘ XEM (mục 10.5) đặt thành THANH TAB, không phải slider.

        Slider gợi ý hai đầu của một dải liên tục; đây là hai câu hỏi rời nhau — "ai đang
        yếu" và "xu hướng đang đi về đâu" — nên tab nói đúng hơn, và nó cũng là thứ đã dùng
        ở Tổng quan, không bắt học thêm một kiểu điều khiển mới.

        NÚT "+ GIAO VIỆC" chuyển về đây từ tab Báo cáo tuần đã bỏ (mục 12). Giao việc cho cả
        lớp là việc làm NGAY SAU KHI nhìn bảng thực trạng, nên nó phải nằm cạnh bảng đó.
      */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <ModeTab active={mode === 'place'} onClick={() => set('xem', '')}>
            {branchId ? 'Theo lớp' : 'Theo chi nhánh'}
          </ModeTab>
          <ModeTab active={mode === 'week'} onClick={() => set('xem', 'tuan')}>Theo tuần</ModeTab>
        </div>
        {can(PERMISSIONS.MEETING_EDIT) && mode === 'place' && (
          <div className="flex flex-wrap items-end gap-2">
            <WeekPicker periodId={taskPeriod} onPeriod={setTaskPeriod} label="Tuần giao việc" className="w-44" />
            <ManagerTasks periodId={taskPeriod} />
          </div>
        )}
      </div>

      {mode === 'week' ? (
        <WeeklyBoard branchId={branchId ? Number(branchId) : null} />
      ) : (
        <>
          {/*
            BẢNG TỔNG HỢP trước, danh sách sau: Quản lý mở màn này để trả lời "chi nhánh nào,
            lớp nào đang nặng nhất", rồi mới đi vào từng em. Bấm một hàng chi nhánh là xuống
            tầng lớp của chính chi nhánh đó.
          */}
          <SummaryTable branchId={branchId ? Number(branchId) : null}
            onPickBranch={(id) => set('cn', String(id))} />
        </>
      )}

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
          {/*
            Khi bảng này nằm trong tab "Tình hình chung" của Tổng quan thì màn đó đã có sẵn
            ô chọn chi nhánh, và cả hai nay điều khiển CÙNG tham số `cn`. Vẽ thêm một hàng
            chip nữa chỉ là hai cái nút làm một việc — bỏ đi cho đỡ rối.
          */}
          {!embedded && (branches.data ?? []).length > 1 && (
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
          {/*
            LOẠI LỚP ĐỨNG TRƯỚC, và "Cụ thể" chỉ hiện SAU KHI đã chọn loại lớp (mục 10.1).
            Lý do rất thực tế: danh sách "cụ thể" của hai loại lớp khác nhau — lớp Normal có
            Pronunciation, lớp FT có W1 và W2 — nên bày cả hai bộ cùng lúc là bày ra những ô
            không tồn tại ở loại lớp người dùng đang nghĩ tới.
          */}
          <FilterRow label="Loại lớp">
            <Chip active={!classKind} onClick={() => set('loai-lop', '')}>Tất cả</Chip>
            {CLASS_KINDS.map((k) => (
              <Chip key={k.key} active={classKind === k.key}
                onClick={() => set('loai-lop', classKind === k.key ? '' : k.key)}>
                {k.label} · {f?.classKind[k.key] ?? 0}
              </Chip>
            ))}
          </FilterRow>
          {classKind && (
            <FilterRow label="Cụ thể">
              <Chip active={!skill} onClick={() => set('ky-nang', '')}>Tất cả</Chip>
              {/*
                KỸ NĂNG TRƯỚC, Ý THỨC SAU (mục 10.1). Chip dựng từ CHÍNH số đếm trả về chứ
                không từ một danh sách viết cứng: lớp Normal có kỹ năng riêng (Writing,
                Pronunciation) và nếu chỉ vẽ năm ô IELTS thì các số cộng lại không bằng tổng
                — đúng thứ đang cố tránh.
              */}
              {topicKeys.map((k) => (
                <Chip key={k} active={skill === k} onClick={() => set('ky-nang', skill === k ? '' : k)}>
                  {topicLabel(k)} · {f?.skill[k] ?? 0}
                </Chip>
              ))}
              {BEHAVIOUR_TOPICS.filter((k) => (f?.skill[k] ?? 0) > 0 || !skill).map((k) => (
                <Chip key={k} active={skill === k} onClick={() => set('ky-nang', skill === k ? '' : k)}>
                  {BEHAVIOUR_TOPIC_LABEL[k]} · {f?.skill[k] ?? 0}
                </Chip>
              ))}
              {/*
                Case cũ chưa gắn được kỹ năng: bước nâng cấp cố ý không đoán bừa khi một lượt
                trượt từ hai kỹ năng trở lên. Có ô riêng để các số cộng lại đúng bằng tổng.
              */}
              {(f?.skillNone ?? 0) > 0 && (
                <Chip active={skill === 'none'} onClick={() => set('ky-nang', skill === 'none' ? '' : 'none')}>
                  Chưa gắn kỹ năng · {f?.skillNone}
                </Chip>
              )}
            </FilterRow>
          )}
        </div>
          {/*
            KHỐI "CỤ THỂ LÀ" NẰM RIÊNG BÊN DƯỚI ĐÃ BỎ (mục 10.1) — owner nói "rối và không
            cần thiết". Nó lặp lại gần đúng hàng chip ngay trên nó, chỉ khác là không bấm
            được, nên người đọc phải nhìn hai lần cùng một danh sách để rồi không làm gì.
            Nguyên nhân do người dạy nhận định vẫn còn nguyên trong từng case.
          */}
        <SectionNote>
          Mỗi học viên có nhiều nhất <strong>một case cho mỗi hạng mục</strong> — năm ô kỹ năng
          L · R · W1 · W2 · S và một ô Ý thức. Case sống suốt khoá: lượt sau yếu lại thì mở lại
          chính nó, không mở thêm cái mới. Vấn đề về giáo viên và giáo trình không nằm ở đây —
          đó không phải vấn đề của học viên.
        </SectionNote>
      </Card>

      {/* ---------------------------------------------- danh sách */}
      <Card
        title={`Vấn đề - Case (${rows.length})`}
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
                        {r.title ?? r.headline}
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

      {/*
        VIỆC ĐÃ GIAO nằm CUỐI màn, không chen giữa bảng tổng hợp và danh sách case.

        Đây là thứ để tra lại ("tuần này mình đã giao gì rồi"), không phải thứ để đọc trước
        khi nhìn thực trạng — mà xen vào giữa thì tuần nào chưa giao việc, một khối trống to
        vẫn chiếm nguyên một tầng màn hình ngay giữa hai thứ cần đọc liền nhau.
      */}
      {mode === 'place' && can(PERMISSIONS.MEETING_EDIT) && <ManagerTaskList periodId={taskPeriod} />}

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề - Case"
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
      <Card title="Vấn đề - Case">
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

/** Tab chuyển giữa hai chế độ xem của Thực trạng — cùng kiểu với tab ở Tổng quan. */
function ModeTab({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {children}
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
