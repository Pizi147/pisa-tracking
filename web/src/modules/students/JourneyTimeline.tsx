import { useState } from 'react';
import { Empty, SectionNote } from '../../ui/ui.tsx';
<<<<<<< Updated upstream
import { fmtBand, fmtDate } from '../../lib/format.ts';
=======
import { fmtDate } from '../../lib/format.ts';
>>>>>>> Stashed changes
import { useSession } from '../../lib/session.tsx';
import { mondayOfDate, weekCodeOf, weekCodeShortOf } from '@shared/domain/index.ts';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';

/**
<<<<<<< Updated upstream
 * HÀNH TRÌNH — HAI CÁCH ĐỌC CÙNG MỘT CHUYỆN, và người đọc chọn cách nào.
 *
 * Bản trước là MỘT bảng kẻ ô: lưới vẽ trước, dữ liệu vẽ sau, nên mắt phải tự dò từng ô mới
 * biết cái gì xảy ra lúc nào. Owner nói thẳng là xấu và khó nhìn.
 *
 * Nay bỏ lưới, và tách thành hai câu hỏi khác nhau — vì chúng THẬT SỰ là hai câu khác nhau
 * và không có một hình nào trả lời tốt cả hai:
 *
 *   ĐIỂM VÀ CAN THIỆP  "thầy cô đã làm gì, rồi em có khá lên không"
 *                      Một kỹ năng một khối: đường điểm của em ở LÀN TRÊN, các phương án của
 *                      thầy cô ở LÀN DƯỚI, chung một trục tuần. Đặt cạnh nhau theo chiều dọc
 *                      là cách duy nhất để nhìn ra "làm cái này xong thì điểm nhúc nhích".
 *
 *   DÒNG SỰ KIỆN       "kể lại cho tôi nghe chuyện gì đã xảy ra với em này"
 *                      Một cột dọc, mới nhất trên cùng, mỗi việc một dòng có ngày. Không bao
 *                      giờ vỡ dù có bao nhiêu case, và đọc được trên điện thoại.
 *
 * MÀU NÓI AI GÂY RA CHUYỆN ĐÓ, không phải nói đẹp xấu: em thay đổi · thầy cô can thiệp ·
 * kết quả ghi lại · mốc của case.
 *
 * Hai thứ nằm cạnh nhau trên trục thời gian KHÔNG có nghĩa cái này gây ra cái kia. Phần mềm
 * bày ra điều đã xảy ra; kết luận là việc của người đọc.
 */

type Point = {
  kind: string; at: string | null; label: string;
  value: number | null; total: number | null; expectation: number | null;
};
type Progress = { mode: 'ielts' | 'ratio'; skills: { skill: string; label: string; points: Point[] }[] };
type Case = SkillBoardRow['cases'][number] & { category: string; skillLabel: string };
type Plan = SkillBoardRow['cases'][number]['plans'][number];
=======
 * HÀNH TRÌNH — MỘT DÒNG THỜI GIAN NGANG, không phải một bảng kẻ ô.
 *
 * Trục là TUẦN, gọi đúng mã tuần của cả hệ thống: W1 SEP 2026. Case sống ít nhất một tuần
 * nên đơn vị nhỏ hơn tuần không nói thêm được gì, còn đơn vị lớn hơn thì mất mất chuyện
 * "phương án này chạy ba tuần rồi mới có kết quả".
 *
 * BỐN TẦNG, và mỗi tầng là một loại sự việc khác nhau:
 *
 *   Mốc thi     MT1 · 5.0 — điểm chính thức, màu theo kỳ vọng CỦA CHÍNH ĐỢT ĐÓ
 *   Nhóm case   một case một nhóm, có tên và trạng thái
 *   Làn phương án  mỗi phương án một làn, thanh bo góc chạy từ ngày bắt đầu tới ngày xong
 *   Mốc cập nhật   mỗi lần ghi kết quả là một mốc CÓ NGÀY, không phải một chấm trắng
 *
 * Phần ở phía sau HÔM NAY là DỰ KIẾN, vẽ nét đứt và ghi thẳng chữ "dự kiến" — không vẽ một
 * cái kết chưa xảy ra như thể nó đã xảy ra.
 */

type Point = { kind: string; at: string | null; label: string; value: number | null; total: number | null; expectation: number | null };
type Progress = { mode: 'ielts' | 'ratio'; skills: { skill: string; label: string; points: Point[] }[] };
>>>>>>> Stashed changes

const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export function JourneyTimeline({ rows, progress, onOpenCase }: {
  rows: SkillBoardRow[] | null;
  progress: Progress | null;
  onOpenCase?: (caseId: number) => void;
}) {
  const { session } = useSession();
  const today = session?.demoDate ?? null;
<<<<<<< Updated upstream
  const [view, setView] = useState<'lanes' | 'feed'>('lanes');
  const [showDone, setShowDone] = useState(false);

  const all: Case[] = (rows ?? []).flatMap((r) =>
    r.cases.map((c) => ({ ...c, category: r.category, skillLabel: r.label })));
  const shown = all
    .filter((c) => showDone || c.status !== 'done')
    .sort((a, b) => {
      const done = (x: Case) => (x.status === 'done' ? 1 : 0);
=======
  const [showDone, setShowDone] = useState(false);

  const all = (rows ?? []).flatMap((r) => r.cases.map((c) => ({ ...c, category: r.category, skillLabel: r.label })));
  const groups = all
    .filter((c) => showDone || c.status !== 'done')
    .sort((a, b) => {
      const done = (x: typeof a) => (x.status === 'done' ? 1 : 0);
>>>>>>> Stashed changes
      if (done(a) !== done(b)) return done(a) - done(b);
      return (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '');
    });
  const doneCount = all.filter((c) => c.status === 'done').length;

<<<<<<< Updated upstream
  /*
   * MỐC THI LÀ MỐC CỦA CẢ ĐỢT. Một đợt MT có năm điểm khác nhau, nên ở tầng chung chỉ có
   * MỐC và NGÀY; điểm từng môn đi theo đúng môn đó.
=======
  /* Mốc thi của từng kỹ năng — dùng để vẽ tầng trên cùng và các vạch dọc xuyên suốt. */
  const pointsOf = (category: string): Point[] => {
    const skill = category === 'writing1' || category === 'writing2' ? 'writing' : category;
    return (progress?.skills.find((s) => s.skill === skill)?.points ?? [])
      .filter((p) => p.kind === 'official' && p.at);
  };
  /*
   * MỐC THI LÀ MỐC CỦA CẢ ĐỢT, KHÔNG GẮN ĐIỂM CỦA MỘT KỸ NĂNG VÀO ĐÓ.
   *
   * Một đợt MT có năm điểm khác nhau; ghi "MT2 · 6.0" ở tầng chung là bày điểm của đúng một
   * môn rồi để người đọc tưởng đó là điểm cả đợt. Điểm từng môn đã có ở bảng kỹ năng ngay
   * trên, nên ở đây chỉ cần MỐC và NGÀY.
>>>>>>> Stashed changes
   */
  const marks = [...new Map(
    (progress?.skills ?? []).flatMap((s) => s.points)
      .filter((p) => p.kind === 'official' && p.at)
      .map((p) => [`${p.label}:${p.at}`, p]),
  ).values()].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));

<<<<<<< Updated upstream
  const dates = [
    ...shown.flatMap((c) => [
      c.openedOn, c.closedOn,
      ...c.plans.flatMap((p) => [p.startedOn, p.completedOn, p.followupDue, ...p.updates.map((u) => u.on)]),
    ]),
=======
  /* Khoảng vẽ: từ thứ Hai của tuần sớm nhất tới Chủ nhật của tuần muộn nhất. */
  const dates = [
    ...groups.flatMap((c) => [c.openedOn, ...c.plans.flatMap((p) => [p.startedOn, p.completedOn, p.followupDue, ...p.updates.map((u) => u.on)])]),
>>>>>>> Stashed changes
    ...marks.map((p) => p.at),
    today,
  ].filter((d): d is string => !!d);

<<<<<<< Updated upstream
  const toggle = doneCount > 0 && (
    <button className="btn btn-sm btn-ghost" onClick={() => setShowDone(!showDone)}>
      {showDone ? 'Ẩn case đã hoàn thành' : `Hiện ${doneCount} case đã hoàn thành`}
    </button>
  );

  if (!shown.length || !dates.length) {
    return (
      <div className="space-y-2">
        <Empty title={all.length
          ? 'Không có case nào đang mở trong lộ trình này'
          : 'Chưa có case nào để vẽ hành trình'} />
        {toggle}
=======
  if (!groups.length || !dates.length) {
    return (
      <div className="space-y-2">
        <Empty title={all.length ? 'Không có case nào đang mở trong lộ trình này' : 'Chưa có case nào để vẽ dòng thời gian'} />
        {doneCount > 0 && (
          <button className="btn btn-sm btn-ghost" onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Ẩn' : 'Hiện'} {doneCount} case đã hoàn thành
          </button>
        )}
>>>>>>> Stashed changes
      </div>
    );
  }

<<<<<<< Updated upstream
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap gap-1">
          <button className={`btn btn-sm ${view === 'lanes' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('lanes')}>Điểm và can thiệp</button>
          <button className={`btn btn-sm ${view === 'feed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('feed')}>Dòng sự kiện</button>
        </span>
        {toggle}
      </div>

      {view === 'lanes'
        ? <LaneView cases={shown} progress={progress} marks={marks} dates={dates}
            today={today} onOpenCase={onOpenCase} />
        : <FeedView cases={shown} progress={progress} marks={marks} onOpenCase={onOpenCase} />}
    </div>
  );
}

/* ══════════════════════════════════════════════ A · ĐIỂM VÀ CAN THIỆP */

/**
 * MỘT KỸ NĂNG MỘT KHỐI: điểm của em ở trên, can thiệp của thầy cô ở dưới, chung trục tuần.
 *
 * Gộp mọi kỹ năng vào một lưới như bản trước thì đường điểm của Listening nằm cách phương án
 * của Listening bốn hàng — đúng cái khoảng cách làm người đọc không nối được hai thứ với nhau.
 */
function LaneView({ cases, progress, marks, dates, today, onOpenCase }: {
  cases: Case[]; progress: Progress | null; marks: Point[]; dates: string[];
  today: string | null; onOpenCase?: (caseId: number) => void;
}) {
=======
>>>>>>> Stashed changes
  const lo = ms(mondayOfDate(dates.reduce((a, b) => (a < b ? a : b))));
  const hi = ms(mondayOfDate(dates.reduce((a, b) => (a > b ? a : b)))) + 7 * DAY;
  const span = hi - lo || 1;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - lo) / span) * 100));
  const at = (d: string) => pct(ms(d));

  const weeks: number[] = [];
  for (let x = lo; x < hi; x += 7 * DAY) weeks.push(x);
<<<<<<< Updated upstream
  const labelEvery = weeks.length <= 8 ? 1 : weeks.length <= 16 ? 2 : 4;
  const todayPct = today ? at(today) : null;

  /* Một khối cho mỗi kỹ năng CÓ CASE — kỹ năng không có case thì cũng không có can thiệp. */
  const order: string[] = [];
  const bySkill = new Map<string, Case[]>();
  for (const c of cases) {
    if (!bySkill.has(c.category)) { bySkill.set(c.category, []); order.push(c.category); }
    bySkill.get(c.category)!.push(c);
  }

  const pointsOf = (category: string): Point[] => {
    const skill = category === 'writing1' || category === 'writing2' ? 'writing' : category;
    return (progress?.skills.find((s) => s.skill === skill)?.points ?? [])
      .filter((p) => p.kind === 'official' && p.at && p.value !== null);
  };

  const axis = (
    <Axis weeks={weeks} pct={pct} labelEvery={labelEvery} todayPct={todayPct} />
  );

  return (
    <div className="space-y-2">
      <span className="block text-[11px] text-slate-500">
        Trục theo tuần học · {weekCodeOf(new Date(lo).toISOString().slice(0, 10))}
        {' → '}{weekCodeOf(new Date(hi - DAY).toISOString().slice(0, 10))}
      </span>

      {order.map((category) => {
        const group = bySkill.get(category)!;
        const points = pointsOf(category);
        return (
          <div key={category} className="rounded-lg border px-3 py-2.5"
               style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
              <span className="text-sm text-slate-100">{group[0].skillLabel}</span>
              <SkillSummary points={points} ratio={progress?.mode === 'ratio'} />
            </div>

            {axis}

            {points.length > 0 && (
              <ScoreLane points={points} at={at} weeks={weeks} pct={pct}
                todayPct={todayPct} ratio={progress?.mode === 'ratio'} />
            )}

            {group.map((c) => (
              <div key={c.id} className="mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--line)' }}>
                <button type="button"
                  className="text-left appearance-none bg-transparent border-0 p-0 mb-0.5 group"
                  onClick={onOpenCase ? () => onOpenCase(c.id) : undefined}>
                  <span className="text-[11px] text-slate-300 group-hover:underline">{c.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {' · '}{c.status === 'done' ? 'đã hoàn thành' : 'đang xử lý'}
                    {c.openedOn && ` · mở ${weekCodeShortOf(c.openedOn)}`}
                  </span>
                </button>
                {c.plans.length === 0 ? (
                  <p className="text-[10px] text-amber-200/80 m-0">chưa có phương án nào</p>
                ) : c.plans.map((p) => (
                  <PlanLane key={p.id} p={p} behaviour={c.behaviour}
                    weeks={weeks} pct={pct} at={at} today={today} todayPct={todayPct} />
                ))}
              </div>
            ))}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Legend color="var(--accent)">phương án đang làm</Legend>
        <Legend color="var(--ok)" dim>đã xong · có tiến bộ</Legend>
        <Legend color="var(--danger)" dim>đã xong · chưa đạt</Legend>
        <span className="text-[10px] text-slate-500">◆ lần ghi kết quả (có ngày)</span>
        <span className="text-[10px] text-slate-500">
          <span style={{ color: 'var(--accent-strong)' }}>│</span> tuần này
        </span>
      </div>

      <SectionNote>
        Làn trên là điểm của em, làn dưới là việc thầy cô đã làm. Hai thứ nằm thẳng cột nhau
        KHÔNG có nghĩa cái này gây ra cái kia — phần sau vạch “tuần này” là <strong>dự kiến</strong>,
        chưa xảy ra. {marks.length > 0 && 'Mốc thi ghi ở đường điểm, đúng ngày thi.'}
=======
  /* Trục chật thì chỉ ghi mã tuần cách quãng — vạch tuần vẫn còn, chỉ bớt chữ. */
  const labelEvery = weeks.length <= 8 ? 1 : weeks.length <= 16 ? 2 : 4;
  const todayPct = today ? at(today) : null;
  const GRID = 'grid grid-cols-[minmax(6rem,11rem)_1fr] gap-x-2';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          Trục theo tuần học · {weekCodeOf(new Date(lo).toISOString().slice(0, 10))} → {weekCodeOf(new Date(hi - DAY).toISOString().slice(0, 10))}
        </span>
        {doneCount > 0 && (
          <button className="btn btn-sm btn-ghost" onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Ẩn case đã hoàn thành' : `Hiện ${doneCount} case đã hoàn thành`}
          </button>
        )}
      </div>

      <div className="rounded-lg border px-2 py-2 overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        {/* ───── trục tuần ───── */}
        <div className={GRID}>
          <span className="text-[10px] text-slate-600 self-end text-right pb-1">tuần</span>
          <div className="relative h-5">
            {weeks.map((w, i) => (
              <span key={w} className="absolute inset-y-0 w-px" style={{ left: `${pct(w)}%`, background: 'var(--line)' }} />
            ))}
            {weeks.map((w, i) => (i % labelEvery === 0 ? (
              <span key={`l${w}`} className="absolute bottom-0 text-[10px] text-slate-400 whitespace-nowrap pl-1"
                style={{ left: `${pct(w)}%` }}>
                {weekCodeShortOf(new Date(w).toISOString().slice(0, 10))}
              </span>
            ) : null))}
            {todayPct !== null && (
              <span className="absolute inset-y-0 w-px" style={{ left: `${todayPct}%`, background: 'var(--accent-strong)' }} />
            )}
          </div>
        </div>

        {/* ───── mốc thi ───── */}
        {marks.length > 0 && (
          <div className={`${GRID} items-center py-1`}>
            <span className="text-[11px] text-slate-400 text-right">Mốc thi</span>
            <div className="relative h-6">
              <span className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'var(--line)' }} />
              {marks.map((p, i) => {
                const x = at(p.at!);
                return (
                  <span key={i}
                    className="absolute top-1/2 -translate-y-1/2 text-[10px] whitespace-nowrap px-1 rounded tabular-nums"
                    style={{
                      left: `${x}%`,
                      transform: `translate(${x > 88 ? '-100%' : x < 4 ? '0' : '-50%'}, -50%)`,
                      background: 'var(--surface-2)',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--line-strong)',
                    }}
                    title={`${p.label} · ${fmtDate(p.at)}`}>
                    {p.label} · {fmtDate(p.at)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ───── từng case một nhóm ───── */}
        {groups.map((c) => (
          <div key={c.id} className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className={GRID}>
              <button type="button"
                className="text-left appearance-none bg-transparent border-0 p-0 min-w-0 group"
                onClick={onOpenCase ? () => onOpenCase(c.id) : undefined}>
                <span className="block text-xs text-slate-100 truncate group-hover:underline">
                  {c.skillLabel} · {c.title}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {c.status === 'done' ? 'đã hoàn thành' : 'đang xử lý'}
                  {c.openedOn && ` · mở ${weekCodeShortOf(c.openedOn)}`}
                </span>
              </button>
              <div className="relative h-4">
                {/* vạch tuần nhạt, để làn nào cũng đọc được theo cùng một lịch */}
                {weeks.map((w) => (
                  <span key={w} className="absolute inset-y-0 w-px" style={{ left: `${pct(w)}%`, background: 'var(--line)', opacity: .5 }} />
                ))}
                {todayPct !== null && (
                  <span className="absolute inset-y-0 w-px" style={{ left: `${todayPct}%`, background: 'var(--accent-strong)', opacity: .6 }} />
                )}
                {c.openedOn && (
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                    style={{ left: `${at(c.openedOn)}%`, background: 'var(--line-strong)' }}
                    title={`Mở case ${fmtDate(c.openedOn)}`} />
                )}
              </div>
            </div>

            {c.plans.length === 0 ? (
              <div className={GRID}>
                <span className="text-[10px] text-amber-200/80 text-right pr-1">chưa có phương án</span>
                <span />
              </div>
            ) : c.plans.map((p) => (
              <PlanLaneRow key={p.id} p={p} behaviour={c.behaviour} grid={GRID}
                weeks={weeks} pct={pct} at={at} today={today} todayPct={todayPct} />
            ))}
          </div>
        ))}

        {/* ───── chú giải ───── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 mt-2 border-t"
             style={{ borderColor: 'var(--line)' }}>
          <Legend color="var(--accent)">đang làm</Legend>
          <Legend color="var(--ok)" dim>đã xong · có tiến bộ</Legend>
          <Legend color="var(--danger)" dim>đã xong · chưa đạt kết quả</Legend>
          <Legend color="var(--line-strong)" dim>đã xong · chưa rõ kết quả</Legend>
          <span className="text-[10px] text-slate-500">◆ lần ghi kết quả (có ngày)</span>
          <span className="text-[10px] text-slate-500">
            <span style={{ color: 'var(--accent-strong)' }}>│</span> tuần này
          </span>
        </div>
      </div>

      <SectionNote>
        Hai thứ nằm cạnh nhau trên trục thời gian KHÔNG có nghĩa cái này gây ra cái kia — phần
        mềm bày ra điều đã xảy ra, kết luận là việc của người đọc. Phần sau vạch “tuần này” là
        <strong> dự kiến</strong>, chưa xảy ra.
>>>>>>> Stashed changes
      </SectionNote>
    </div>
  );
}

<<<<<<< Updated upstream
/** Trục tuần: vạch nhạt, mã tuần cách quãng khi trục chật, một vạch đậm cho tuần này. */
function Axis({ weeks, pct, labelEvery, todayPct }: {
  weeks: number[]; pct: (t: number) => number; labelEvery: number; todayPct: number | null;
}) {
  return (
    <div className="relative h-4 mb-0.5">
      {/*
        MÀN HẸP THÌ THƯA CHỮ ĐI, chứ không bỏ vạch. Ở khổ điện thoại các mã tuần dính vào nhau
        thành một vệt chữ không đọc được; giấu bớt một nửa bằng CSS rẻ hơn là đo bề ngang.
      */}
      {weeks.map((w, i) => (i % labelEvery === 0 ? (
        <span key={`l${w}`}
          className={`absolute bottom-0 text-[10px] text-slate-500 whitespace-nowrap pl-1 ${
            i % (labelEvery * 2) === 0 ? '' : 'hidden sm:block'}`}
          style={{ left: `${pct(w)}%` }}>
          {weekCodeShortOf(new Date(w).toISOString().slice(0, 10))}
        </span>
      ) : null))}
      {todayPct !== null && (
        <span className="absolute inset-y-0 w-px" style={{ left: `${todayPct}%`, background: 'var(--accent-strong)' }} />
      )}
    </div>
  );
}

/** "5.0 → 5.5 · kỳ vọng 6.0" — câu tóm tắt của cả khối, đọc trước khi nhìn hình. */
function SkillSummary({ points, ratio }: { points: Point[]; ratio: boolean }) {
  if (points.length === 0) return <span className="text-[11px] text-slate-600">chưa có điểm</span>;
  const first = points[0];
  const last = points[points.length - 1];
  const show = (p: Point) => (ratio && p.total ? `${p.value}/${p.total}` : fmtBand(p.value));
  return (
    <span className="text-[11px] text-slate-400 tabular-nums">
      {points.length > 1 && <>{show(first)} → </>}
      <span className={bandTone(last.value, last.expectation)}>{show(last)}</span>
      {last.expectation !== null && (
        <span className="text-slate-500"> · kỳ vọng {fmtBand(last.expectation)}</span>
      )}
    </span>
  );
}

/**
 * LÀN ĐIỂM — đường đi qua các mốc thi, mỗi mốc so với KỲ VỌNG CỦA CHÍNH NÓ.
 *
 * Kỳ vọng vẽ thành đường bậc thang nét đứt chứ không phải một đường ngang: kỳ vọng tăng dần
 * qua các đợt, nên một đường ngang duy nhất sẽ nói sai ở mọi mốc trừ mốc cuối.
 *
 * ĐIỂM TĂNG MÀ VẪN CHƯA ĐẠT THÌ VẪN ĐỎ — cùng luật màu với ô điểm ở bảng kỹ năng.
 */
function ScoreLane({ points, at, weeks, pct, todayPct, ratio }: {
  points: Point[]; at: (d: string) => number; weeks: number[];
  pct: (t: number) => number; todayPct: number | null; ratio: boolean;
}) {
  const vals = points.flatMap((p) => [p.value, p.expectation])
    .filter((v): v is number => v !== null && v !== undefined);
  const lo = Math.min(...vals) - 0.5;
  const hi = Math.max(...vals) + 0.5;
  const y = (v: number) => 100 - ((v - lo) / (hi - lo || 1)) * 100;

  const line = points.map((p) => `${at(p.at!)},${y(p.value!)}`).join(' ');
  const exp = points.filter((p) => p.expectation !== null)
    .map((p) => `${at(p.at!)},${y(p.expectation!)}`).join(' ');

  return (
    <div className="relative h-16">
      {weeks.map((w) => (
        <span key={w} className="absolute inset-y-0 w-px"
          style={{ left: `${pct(w)}%`, background: 'var(--line)', opacity: .35 }} />
      ))}
      {todayPct !== null && (
        <span className="absolute inset-y-0 w-px"
          style={{ left: `${todayPct}%`, background: 'var(--accent-strong)', opacity: .6 }} />
      )}

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden
        className="absolute inset-0 w-full h-full overflow-visible">
        {exp && (
          <polyline points={exp} fill="none" stroke="var(--line-strong)" strokeWidth="1"
            strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
        {points.length > 1 && (
          <polyline points={line} fill="none" stroke="var(--text-dim)" strokeWidth="1.5"
            vectorEffect="non-scaling-stroke" />
        )}
      </svg>

      {points.map((p, i) => {
        const x = at(p.at!);
        return (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y(p.value!)}%` }}>
            <span className={`block w-2 h-2 rounded-full ${bandDot(p.value, p.expectation)}`} />
          </span>
        );
      })}

      {points.map((p, i) => {
        const x = at(p.at!);
        return (
          <span key={`t${i}`}
            className="absolute text-[10px] whitespace-nowrap tabular-nums"
            style={{
              left: `${x}%`, top: `${y(p.value!)}%`,
              transform: `translate(${x > 85 ? '-100%' : x < 8 ? '0' : '-50%'}, -150%)`,
            }}
            title={`${p.label} · ${fmtDate(p.at)}${p.expectation !== null ? ` · kỳ vọng ${fmtBand(p.expectation)}` : ''}`}>
            <span className="text-slate-500">{p.label} </span>
            <span className={bandTone(p.value, p.expectation)}>
              {ratio && p.total ? `${p.value}/${p.total}` : fmtBand(p.value)}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Một làn phương án: thanh bo góc, mốc cập nhật có ngày, phần tương lai là nét đứt. */
function PlanLane({ p, behaviour, weeks, pct, at, today, todayPct }: {
  p: Plan; behaviour: boolean;
=======
/** Một làn phương án: thanh bo góc, mốc cập nhật có ngày, phần tương lai là nét đứt. */
function PlanLaneRow({ p, behaviour, grid, weeks, pct, at, today, todayPct }: {
  p: SkillBoardRow['cases'][number]['plans'][number];
  behaviour: boolean; grid: string;
>>>>>>> Stashed changes
  weeks: number[]; pct: (t: number) => number; at: (d: string) => number;
  today: string | null; todayPct: number | null;
}) {
  const running = p.status === 'planned' || p.status === 'started';
  const from = p.startedOn;
  const to = p.completedOn ?? p.followupDue ?? p.startedOn;
  const look = planLook(p);
<<<<<<< Updated upstream
  const plannedFrom = running && today && to && to > today ? today : null;

  return (
    <div className="relative h-6">
      {weeks.map((w) => (
        <span key={w} className="absolute inset-y-0 w-px"
          style={{ left: `${pct(w)}%`, background: 'var(--line)', opacity: .35 }} />
      ))}
      {todayPct !== null && (
        <span className="absolute inset-y-0 w-px"
          style={{ left: `${todayPct}%`, background: 'var(--accent-strong)', opacity: .6 }} />
      )}

      {/*
        HÀNH ĐỘNG Ý THỨC LÀ MỘT MỐC, KHÔNG PHẢI MỘT KHOẢNG. Gọi cho gia đình là việc của một
        buổi; vẽ nó thành một thanh dài ba tuần là nói sai chuyện đã xảy ra.
      */}
      {behaviour ? (
        (p.completedOn ?? p.startedOn) && (() => {
          /*
           * MỘT MỐC CÓ TÊN VÀ NGÀY. Một cái ◆ trơ trọi không nói được ai làm gì hôm nào, nên
           * nó chỉ là trang trí. Mốc nằm nửa phải thì chữ lùi sang trái để không tràn ra ngoài.
           */
          const on = (p.completedOn ?? p.startedOn)!;
          const x = at(on);
          const left = x > 55;
          return (
            <span className="absolute top-1/2 text-[10px] whitespace-nowrap leading-none"
              style={{ left: `${x}%`, transform: `translate(${left ? '-100%' : '0'}, -50%)` }}
              title={`${p.name} · ${p.kindLabel} · ${fmtDate(on)}`}>
              {left && <><Marker name={p.name} on={on} /> </>}
              <span style={{ color: 'var(--accent)' }}>◆</span>
              {!left && <> <Marker name={p.name} on={on} /></>}
            </span>
          );
        })()
      ) : from && to ? (
        <>
          <span className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center overflow-hidden"
            style={{
              left: `${at(from)}%`,
              width: `calc(${Math.max(0.4, at(plannedFrom ?? to) - at(from))}% + 6px)`,
              height: '14px', background: look.color, opacity: look.opacity,
            }}
            title={`${p.name} · ${fmtDate(from)} → ${p.completedOn ? fmtDate(p.completedOn) : `dự kiến ${fmtDate(p.followupDue)}`}`}>
            <span className="text-[10px] px-1.5 truncate" style={{ color: 'var(--accent-ink)' }}>{p.name}</span>
          </span>
          {plannedFrom && (
            <>
              <span className="absolute top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${at(plannedFrom)}%`,
                  width: `calc(${Math.max(0.4, at(to) - at(plannedFrom))}% + 6px)`,
                  height: '14px', border: `1px dashed ${look.color}`,
                }} />
              <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-500 whitespace-nowrap pl-1"
                style={{ left: `${at(to)}%` }}>dự kiến {fmtDate(to)}</span>
            </>
          )}
          {p.updates.map((u, i) => (
            <span key={i}
              className="absolute top-1/2 text-[11px] leading-none"
              style={{ left: `${at(u.on)}%`, transform: 'translate(-50%,-50%)', color: outcomeColor(u.outcome) }}
              title={`${fmtDate(u.on)} · ${u.label}${u.by ? ` · ${u.by}` : ''}`}>◆</span>
          ))}
        </>
      ) : (
        <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pl-1">
          {p.name} · chưa có ngày bắt đầu
        </span>
      )}
    </div>
  );
}

/**
 * Nhãn của một mốc: TÊN cắt bớt được, NGÀY thì không.
 *
 * Ở khổ điện thoại một cái tên dài đẩy cả nhãn tràn ra ngoài khung. Cắt tên thì vẫn còn đủ
 * để nhận ra việc gì; cắt ngày thì mốc mất luôn ý nghĩa.
 */
function Marker({ name, on }: { name: string; on: string }) {
  return (
    <>
      <span className="text-slate-400 inline-block align-middle max-w-[7rem] sm:max-w-[16rem] truncate">
        {name}
      </span>
      <span className="text-slate-500"> · {fmtDate(on)}</span>
    </>
  );
}

/* ══════════════════════════════════════════════ B · DÒNG SỰ KIỆN */

type Ev = {
  on: string;
  who: 'student' | 'teacher' | 'result' | 'case';
  title: string;
  meta: string;
  tone: string;
  caseId?: number;
};

const WHO_LABEL: Record<Ev['who'], string> = {
  student: 'Em thay đổi',
  teacher: 'Thầy cô làm',
  result: 'Kết quả ghi lại',
  case: 'Mốc của case',
};

/**
 * MỘT CỘT DỌC, MỚI NHẤT TRÊN CÙNG — đọc như một cuốn sổ.
 *
 * Không có trục, không có lưới, nên nó không bao giờ vỡ: thêm case thứ sáu thì thêm vài dòng,
 * chứ không phải bóp mọi thanh hẹp lại một nửa. Đây cũng là dạng duy nhất đọc được tử tế trên
 * điện thoại.
 *
 * MÀU NÓI AI GÂY RA CHUYỆN ĐÓ — em, thầy cô, kết quả ghi lại, hay mốc hành chính của case.
 */
function FeedView({ cases, progress, marks, onOpenCase }: {
  cases: Case[]; progress: Progress | null; marks: Point[];
  onOpenCase?: (caseId: number) => void;
}) {
  const ratio = progress?.mode === 'ratio';
  const events: Ev[] = [];

  /* MỘT MỐC THI LÀ MỘT DÒNG, kèm điểm của từng môn trong chính đợt đó. */
  for (const m of marks) {
    const same = (progress?.skills ?? []).flatMap((s) =>
      s.points.filter((p) => p.kind === 'official' && p.at === m.at && p.value !== null)
        .map((p) => ({ label: s.label, p })));
    const below = same.some((x) => x.p.expectation !== null && x.p.value! < x.p.expectation!);
    events.push({
      on: m.at!,
      who: 'student',
      title: m.label,
      meta: same.length
        ? same.map((x) => `${x.label} ${ratio && x.p.total ? `${x.p.value}/${x.p.total}` : fmtBand(x.p.value)}`
            + (x.p.expectation !== null ? ` (kỳ vọng ${fmtBand(x.p.expectation)})` : '')).join(' · ')
        : 'chưa có điểm',
      tone: same.length === 0 ? 'var(--line-strong)' : below ? 'var(--danger)' : 'var(--ok)',
    });
  }

  for (const c of cases) {
    if (c.openedOn) {
      events.push({
        on: c.openedOn, who: 'case', caseId: c.id,
        title: `Mở case ${c.skillLabel} · ${c.title}`,
        meta: c.issueLabel ?? 'chưa phân loại vấn đề',
        tone: 'var(--line-strong)',
      });
    }
    for (const p of c.plans) {
      /* Việc Ý thức là MỘT buổi — một dòng duy nhất, không phải "bắt đầu" rồi "kết thúc". */
      if (c.behaviour) {
        const on = p.completedOn ?? p.startedOn;
        if (on) {
          events.push({
            on, who: 'teacher', caseId: c.id,
            title: p.name,
            meta: `${c.skillLabel} · ${p.kindLabel}${p.performer ? ` · ${p.performer}` : ''}`,
            tone: 'var(--accent)',
          });
        }
        continue;
      }
      if (p.startedOn) {
        events.push({
          on: p.startedOn, who: 'teacher', caseId: c.id,
          title: `Bắt đầu: ${p.name}`,
          meta: `${c.skillLabel}${p.performer ? ` · ${p.performer}` : ''}`
            + (p.followupDue ? ` · dự kiến xong ${fmtDate(p.followupDue)}` : ''),
          tone: 'var(--accent)',
        });
      }
      for (const u of p.updates) {
        events.push({
          on: u.on, who: 'result', caseId: c.id,
          title: `${p.name} — ${u.label.toLowerCase()}`,
          meta: `${c.skillLabel}${u.by ? ` · ${u.by}` : ''}`,
          tone: outcomeColor(u.outcome),
        });
      }
      if (p.completedOn) {
        events.push({
          on: p.completedOn, who: 'teacher', caseId: c.id,
          title: `Kết thúc phương án: ${p.name}`,
          meta: `${c.skillLabel}${p.lastOutcomeLabel ? ` · ${p.lastOutcomeLabel}` : ''}`,
          tone: 'var(--line-strong)',
        });
      }
    }
    if (c.status === 'done' && c.closedOn) {
      events.push({
        on: c.closedOn, who: 'case', caseId: c.id,
        title: `Kết thúc case: ${c.title}`,
        meta: `${c.skillLabel}${c.outcomeLabel ? ` · ${c.outcomeLabel}` : ''}`,
        tone: 'var(--ok)',
      });
    }
  }

  events.sort((a, b) => b.on.localeCompare(a.on));

  if (!events.length) return <Empty title="Chưa có sự kiện nào để kể lại" />;

  return (
    <div className="space-y-2">
      <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        {events.map((e, i) => (
          <div key={i} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3">
            <span className="text-[11px] text-slate-500 tabular-nums pt-2">{fmtDate(e.on)}</span>
            <button type="button"
              className="text-left appearance-none bg-transparent border-0 border-l-2 pl-3 py-1.5 w-full group"
              style={{ borderColor: e.tone, borderRadius: 0, cursor: e.caseId && onOpenCase ? 'pointer' : 'default' }}
              onClick={e.caseId && onOpenCase ? () => onOpenCase(e.caseId!) : undefined}>
              <span className="block text-xs text-slate-100 group-hover:underline">{e.title}</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                {WHO_LABEL[e.who]} · {e.meta} · {weekCodeShortOf(e.on)}
              </span>
            </button>
          </div>
        ))}
      </div>

      <SectionNote>
        Mới nhất trên cùng. Màu ở mép trái nói AI gây ra chuyện đó — em, thầy cô, kết quả ghi
        lại, hay mốc của case — chứ không nói tốt hay xấu.
      </SectionNote>
=======
  /* Ranh giới giữa phần ĐÃ XẢY RA và phần DỰ KIẾN. */
  const plannedFrom = running && today && to && to > today ? today : null;

  return (
    <div className={`${grid} items-center py-0.5`}>
      <span className="text-[11px] text-slate-400 text-right truncate pr-1" title={p.name}>
        {behaviour && p.completedOn
          ? `${p.kindLabel} · ${fmtDate(p.completedOn)}`
          : p.name}
      </span>
      <div className="relative h-5">
        {weeks.map((w) => (
          <span key={w} className="absolute inset-y-0 w-px" style={{ left: `${pct(w)}%`, background: 'var(--line)', opacity: .5 }} />
        ))}
        {todayPct !== null && (
          <span className="absolute inset-y-0 w-px" style={{ left: `${todayPct}%`, background: 'var(--accent-strong)', opacity: .6 }} />
        )}

        {/*
          HÀNH ĐỘNG Ý THỨC LÀ MỘT MỐC, KHÔNG PHẢI MỘT KHOẢNG. Gọi cho gia đình là việc của
          một buổi; vẽ nó thành một thanh dài ba tuần là nói sai chuyện đã xảy ra.
        */}
        {behaviour ? (
          (p.completedOn ?? p.startedOn) && (
            <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[11px] leading-none"
              style={{ left: `${at((p.completedOn ?? p.startedOn)!)}%`, color: 'var(--accent)' }}
              title={`${p.kindLabel} · ${fmtDate(p.completedOn ?? p.startedOn)}`}>◆</span>
          )
        ) : from && to ? (
          <>
            <span className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
              style={{
                left: `${at(from)}%`,
                width: `calc(${Math.max(0.4, at(plannedFrom ?? to) - at(from))}% + 5px)`,
                background: look.color, opacity: look.opacity,
              }}
              title={`${p.name} · ${fmtDate(from)} → ${p.completedOn ? fmtDate(p.completedOn) : `dự kiến ${fmtDate(p.followupDue)}`}`} />
            {/* phần DỰ KIẾN: nét đứt, và nói thẳng là dự kiến */}
            {plannedFrom && (
              <>
                <span className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
                  style={{
                    left: `${at(plannedFrom)}%`,
                    width: `calc(${Math.max(0.4, at(to) - at(plannedFrom))}% + 5px)`,
                    border: `1px dashed ${look.color}`,
                  }} />
                <span className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-500 whitespace-nowrap pl-1"
                  style={{ left: `${at(to)}%` }}>dự kiến {fmtDate(to)}</span>
              </>
            )}
            {/* MỖI LẦN GHI KẾT QUẢ LÀ MỘT MỐC CÓ NGÀY, không phải một chấm trắng. */}
            {p.updates.map((u, i) => (
              <span key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[11px] leading-none"
                style={{ left: `${at(u.on)}%`, color: outcomeColor(u.outcome) }}
                title={`${fmtDate(u.on)} · ${u.label}${u.by ? ` · ${u.by}` : ''}`}>◆</span>
            ))}
          </>
        ) : null}
      </div>
>>>>>>> Stashed changes
    </div>
  );
}

<<<<<<< Updated upstream
/* ══════════════════════════════════════════════ dùng chung */

/** Bốn màu của điểm, cùng luật với ô điểm ở bảng kỹ năng: so với kỳ vọng CỦA CHÍNH MỐC ĐÓ. */
function bandTone(value: number | null, expectation: number | null): string {
  if (value === null) return 'text-slate-500';
  if (expectation === null) return 'text-slate-300';
  if (value < expectation) return 'text-rose-300';
  if (value > expectation) return 'text-emerald-300';
  return 'text-sky-300';
}
function bandDot(value: number | null, expectation: number | null): string {
  if (value === null || expectation === null) return 'bg-slate-500';
  if (value < expectation) return 'bg-rose-400';
  if (value > expectation) return 'bg-emerald-400';
  return 'bg-sky-400';
}

function planLook(p: Plan) {
=======
function planLook(p: SkillBoardRow['cases'][number]['plans'][number]) {
>>>>>>> Stashed changes
  if (p.status === 'planned' || p.status === 'started') return { color: 'var(--accent)', opacity: 1 };
  const last = p.lastOutcome;
  if (last === 'improved' || last === 'partial') return { color: 'var(--ok)', opacity: .55 };
  if (last === 'unchanged' || last === 'worse') return { color: 'var(--danger)', opacity: .55 };
  return { color: 'var(--line-strong)', opacity: .6 };
}

function outcomeColor(outcome: string): string {
  if (outcome === 'improved' || outcome === 'partial') return 'var(--ok)';
  if (outcome === 'unchanged' || outcome === 'worse') return 'var(--danger)';
  return 'var(--warn)';
}

function Legend({ color, dim, children }: { color: string; dim?: boolean; children: React.ReactNode }) {
  return (
    <span className="text-[10px] text-slate-500 whitespace-nowrap">
      <span style={{ color, opacity: dim ? .6 : 1 }}>▬</span> {children}
    </span>
  );
}
