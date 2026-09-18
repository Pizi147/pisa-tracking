import { useState } from 'react';
import { Empty, SectionNote } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { mondayOfDate, weekCodeOf, weekCodeShortOf } from '@shared/domain/index.ts';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';

/**
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

const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export function JourneyTimeline({ rows, progress, onOpenCase }: {
  rows: SkillBoardRow[] | null;
  progress: Progress | null;
  onOpenCase?: (caseId: number) => void;
}) {
  const { session } = useSession();
  const today = session?.demoDate ?? null;
  const [showDone, setShowDone] = useState(false);

  const all = (rows ?? []).flatMap((r) => r.cases.map((c) => ({ ...c, category: r.category, skillLabel: r.label })));
  const groups = all
    .filter((c) => showDone || c.status !== 'done')
    .sort((a, b) => {
      const done = (x: typeof a) => (x.status === 'done' ? 1 : 0);
      if (done(a) !== done(b)) return done(a) - done(b);
      return (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '');
    });
  const doneCount = all.filter((c) => c.status === 'done').length;

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
   */
  const marks = [...new Map(
    (progress?.skills ?? []).flatMap((s) => s.points)
      .filter((p) => p.kind === 'official' && p.at)
      .map((p) => [`${p.label}:${p.at}`, p]),
  ).values()].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));

  /* Khoảng vẽ: từ thứ Hai của tuần sớm nhất tới Chủ nhật của tuần muộn nhất. */
  const dates = [
    ...groups.flatMap((c) => [c.openedOn, ...c.plans.flatMap((p) => [p.startedOn, p.completedOn, p.followupDue, ...p.updates.map((u) => u.on)])]),
    ...marks.map((p) => p.at),
    today,
  ].filter((d): d is string => !!d);

  if (!groups.length || !dates.length) {
    return (
      <div className="space-y-2">
        <Empty title={all.length ? 'Không có case nào đang mở trong lộ trình này' : 'Chưa có case nào để vẽ dòng thời gian'} />
        {doneCount > 0 && (
          <button className="btn btn-sm btn-ghost" onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Ẩn' : 'Hiện'} {doneCount} case đã hoàn thành
          </button>
        )}
      </div>
    );
  }

  const lo = ms(mondayOfDate(dates.reduce((a, b) => (a < b ? a : b))));
  const hi = ms(mondayOfDate(dates.reduce((a, b) => (a > b ? a : b)))) + 7 * DAY;
  const span = hi - lo || 1;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - lo) / span) * 100));
  const at = (d: string) => pct(ms(d));

  const weeks: number[] = [];
  for (let x = lo; x < hi; x += 7 * DAY) weeks.push(x);
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
      </SectionNote>
    </div>
  );
}

/** Một làn phương án: thanh bo góc, mốc cập nhật có ngày, phần tương lai là nét đứt. */
function PlanLaneRow({ p, behaviour, grid, weeks, pct, at, today, todayPct }: {
  p: SkillBoardRow['cases'][number]['plans'][number];
  behaviour: boolean; grid: string;
  weeks: number[]; pct: (t: number) => number; at: (d: string) => number;
  today: string | null; todayPct: number | null;
}) {
  const running = p.status === 'planned' || p.status === 'started';
  const from = p.startedOn;
  const to = p.completedOn ?? p.followupDue ?? p.startedOn;
  const look = planLook(p);
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
    </div>
  );
}

function planLook(p: SkillBoardRow['cases'][number]['plans'][number]) {
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
