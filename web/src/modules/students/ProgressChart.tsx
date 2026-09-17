import { useState } from 'react';
import { Empty, SectionNote } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { outcomeLabelFor } from '@shared/domain/index.ts';

type Point = {
  kind: 'official' | 'teacher';
  at: string | null; label: string;
  value: number | null; total: number | null; expectation: number | null;
};
/** Một khoảng thực hiện phương án, vẽ ở dải dưới cùng trục thời gian (mục 4.4). */
type PlanResult = 'running' | 'success' | 'failure' | 'undetermined';
type PlanBand = {
  id: number; caseId: number; kind: string; kindLabel?: string; description: string | null;
  from: string; to: string | null; expectedTo: string | null; running: boolean;
  pending?: boolean;
  outcome?: string | null;
  result?: PlanResult;
};
/** Một lần người thật nhìn lại và ghi kết quả — mốc nhỏ trên chính dải phương án. */
type Review = { on: string; outcome: string; caseId: number; interventionId?: number | null };
type Series = {
  skill: string; label: string; points: Point[]; officialCount: number; enough: boolean;
  plans?: PlanBand[]; reviews?: Review[];
};

/**
 * TIẾN ĐỘ MỘT KỸ NĂNG — bày thành DẢI MỐC, không phải một khung biểu đồ.
 *
 * Bản trước là một ô vẽ cao gần hai trăm điểm ảnh chứa đúng hai cái chấm và một đoạn thẳng.
 * Chủ sản phẩm gọi thẳng: xấu. Và nó xấu vì dùng sai hình: một đợt MT chỉ có hai tới năm
 * mốc, mà biểu đồ đường sinh ra để đọc HÌNH DẠNG của hàng chục điểm. Hai điểm thì "hình
 * dạng" chỉ là một mũi tên lên hoặc xuống — thứ một chữ nói xong, còn khung vẽ thì chiếm
 * nguyên một màn và để trống chín phần mười.
 *
 * Nên đổi hình cho đúng việc:
 *
 *   · MỖI MỐC LÀ MỘT THẺ SỐ — band, kỳ vọng, đạt/chưa đạt, và chênh lệch so với mốc trước.
 *     Con số đọc được ngay, không phải rê chuột lên một cái chấm bốn điểm ảnh.
 *   · PHƯƠNG ÁN HỖ TRỢ là những thanh nằm ngang dưới cùng một trục thời gian, mỗi thanh có
 *     TÊN và KHOẢNG NGÀY viết rõ bên cạnh — không còn mấy vệt màu trôi nổi không chú thích.
 *
 * Ba điều giữ nguyên vì chúng là chuyện đúng/sai chứ không phải chuyện đẹp/xấu:
 *
 * 1. KHÔNG NỐI ĐIỂM CHÍNH THỨC VỚI ĐIỂM GIÁO VIÊN TỰ CHẤM. Điểm phòng thi và điểm cô ước
 *    lượng khi đọc một bài viết không chấm bằng cùng một thước; nối lại là tự chế ra một
 *    phép so sánh không ai bảo đảm. Điểm cô chấm mang dấu ◇ và đứng riêng.
 * 2. KHÔNG QUY ĐIỂM LỚP NORMAL VỀ BAND. 13/30 viết là 13/30.
 * 3. KHÔNG KẾT LUẬN HỘ. Phần mềm bày ra hai thứ nằm cạnh nhau trên trục thời gian; nói
 *    "nhờ tutor nên tăng một band" là việc nó không có căn cứ để nói.
 */
export function ProgressChart({ data, only, onOpenCase }: {
  data: { mode: 'ielts' | 'ratio'; skills: Series[] };
  /**
   * Chỉ vẽ MỘT kỹ năng, không bày thanh chọn. Dùng khi khối này nằm trong hàng kỹ năng của
   * bảng tiến độ — ở đó người xem đã chọn kỹ năng bằng chính cú bấm mở hàng.
   */
  only?: string | null;
  /** Bấm một phương án thì mở đúng case của nó (mục 4.4). */
  onOpenCase?: (caseId: number) => void;
}) {
  const { session } = useSession();
  const today = session?.demoDate ?? null;
  const usable = data.skills.filter((s) => s.points.length > 0 || (s.plans?.length ?? 0) > 0);
  const [skill, setSkill] = useState<string>(only ?? usable[0]?.skill ?? '');
  const cur = usable.find((s) => s.skill === (only ?? skill)) ?? (only ? null : usable[0]) ?? null;

  if (!cur) return <Empty title="Chưa có điểm nào để xem tiến độ" />;

  const official = cur.points.filter((p) => p.kind === 'official');
  const teacher = cur.points.filter((p) => p.kind === 'teacher');

  return (
    <div className="space-y-3">
      {!only && (
        <div className="flex flex-wrap gap-1">
          {usable.map((s) => (
            <button key={s.skill}
              className={`btn btn-sm ${s.skill === cur.skill ? 'btn-primary' : ''}`}
              onClick={() => setSkill(s.skill)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {official.length === 0 ? (
        <p className="text-sm text-slate-300 m-0">Chưa đủ dữ liệu để đánh giá tiến độ {cur.label}.</p>
      ) : (
        <>
          {/*
            DẢI MỐC. Mỗi mốc một thẻ, đọc từ trái sang phải theo thời gian. Mũi tên giữa hai
            thẻ nói hướng đi — đó là toàn bộ thứ một đường gấp khúc hai điểm nói được.
          */}
          <div className="flex flex-wrap items-stretch gap-1.5">
            {official.map((p, i) => (
              <Milestone key={`${p.label}-${i}`} p={p} prev={i > 0 ? official[i - 1] : null}
                mode={data.mode} last={i === official.length - 1} />
            ))}
          </div>

          {official.length === 1 && (
            <p className="text-xs text-slate-500 m-0">
              Mới có một mốc nên chưa nói được {cur.label} đang lên hay đang xuống — cần ít nhất hai mốc.
            </p>
          )}

          {/* Điểm GIÁO VIÊN TỰ CHẤM đứng riêng, có dấu ◇, không nối vào dải trên. */}
          {teacher.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Giáo viên tự chấm:</span>
              {teacher.map((p, i) => (
                <span key={i} className="text-xs text-amber-200/90 tabular-nums"
                  title="Điểm giáo viên tự chấm khi cập nhật case — không phải điểm chính thức">
                  ◇ {fmtValue(p, data.mode)}
                  {p.at && <span className="text-slate-500"> · {fmtDate(p.at)}</span>}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <PlanLane series={cur} points={official} onOpenCase={onOpenCase} today={today} />
    </div>
  );
}

/**
 * MỘT MỐC ĐIỂM — thẻ số, không phải một cái chấm trên trục.
 *
 * Màu chỉ nhắc lại điều chữ đã nói (“đạt” / “chưa đạt”), nên người không phân biệt được màu
 * vẫn đọc đủ. Ngược lại thì một chấm đỏ giữa khung vẽ không nói được gì cho ai cả.
 */
function Milestone({ p, prev, mode, last }: {
  p: Point; prev: Point | null; mode: 'ielts' | 'ratio'; last: boolean;
}) {
  const missed = p.expectation !== null && p.value !== null && p.value < p.expectation;
  const met = p.expectation !== null && p.value !== null && p.value >= p.expectation;
  const delta = prev?.value !== null && prev?.value !== undefined && p.value !== null
    ? Math.round((p.value - prev.value) * 10) / 10 : null;

  return (
    <div className="flex items-stretch gap-1.5">
      {prev && (
        /* Hướng đi giữa hai mốc — thứ duy nhất một đường hai điểm nói được. */
        <span className={`self-center text-sm tabular-nums ${
          delta === null || delta === 0 ? 'text-slate-600'
            : delta > 0 ? 'text-emerald-300' : 'text-rose-300'
        }`}>
          {delta === null || delta === 0 ? '→' : delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
        </span>
      )}
      <div className={`rounded-lg border px-2.5 py-1.5 min-w-[7rem] ${last ? 'brightness-110' : ''}`}
           style={{
             borderColor: missed ? 'var(--danger)' : met ? 'var(--ok)' : 'var(--line)',
             background: last ? 'var(--surface-2)' : 'transparent',
           }}>
        <span className="block text-[10px] text-slate-500">
          {p.label}{p.at ? ` · ${fmtDate(p.at)}` : ''}
        </span>
        <span className={`block text-lg font-semibold leading-tight ${
          missed ? 'text-rose-200' : met ? 'text-emerald-200' : 'text-slate-100'
        }`}>
          {fmtValue(p, mode)}
        </span>
        <span className="block text-[10px] text-slate-500">
          {p.expectation !== null
            ? <>kỳ vọng {fmtBand(p.expectation)} · {missed ? 'chưa đạt' : 'đạt'}</>
            : 'chưa có kỳ vọng'}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────── lịch: tuần thứ Hai → Chủ nhật, tháng theo ngày thứ Năm ── */

const DAY = 86_400_000;
const t = (iso: string | null | undefined): number | null =>
  iso ? Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) : null;
/** Thứ Hai của tuần chứa mốc này — trục luôn bắt đầu và kết thúc ở ranh giới tuần. */
const mondayOf = (ms: number) => ms - (((new Date(ms).getUTCDay() + 6) % 7) * DAY);
const MONTH_SHORT = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

/**
 * BỐN TRẠNG THÁI CỦA MỘT PHƯƠNG ÁN, và mỗi cái có MÀU riêng, CHỮ riêng, ĐỘ SÁNG riêng.
 *
 * Màu nói kết quả, độ sáng nói còn sống hay đã khép: việc đang chạy sáng lên vì đó là thứ
 * người đọc phải làm gì đó với nó, việc đã xong mờ đi vì nó là lịch sử. Nhưng KHÔNG chỗ nào
 * bắt người đọc phải phân biệt được màu — mỗi dòng đều có chữ nói đúng điều màu đang nói.
 */
const PLAN_LOOK: Record<PlanResult | 'pending', {
  fill: string; opacity: number; word: string; dot: string;
}> = {
  running: { fill: 'var(--accent)', opacity: 1, word: 'đang làm', dot: 'var(--accent)' },
  success: { fill: 'var(--ok)', opacity: 0.5, word: 'đã xong · có tiến bộ', dot: 'var(--ok)' },
  failure: { fill: 'var(--danger)', opacity: 0.5, word: 'đã xong · chưa ăn thua', dot: 'var(--danger)' },
  undetermined: { fill: 'var(--line-strong)', opacity: 0.55, word: 'đã xong · chưa rõ kết quả', dot: 'var(--line-strong)' },
  pending: { fill: 'transparent', opacity: 1, word: 'chờ Quản lý duyệt', dot: 'var(--line-strong)' },
};

/**
 * DẢI PHƯƠNG ÁN HỖ TRỢ — một biểu đồ Gantt đọc được theo TUẦN, không phải mấy vệt màu.
 *
 * Ba thứ đổi so với bản trước, và cả ba đều vì cùng một lý do: case sống ít nhất một tuần,
 * nên trục thời gian phải nói được "tuần nào, tháng nào", chứ không phải một đoạn thẳng
 * không mốc.
 *
 * 1. TRỤC CÓ LỊCH. Nền là các ô tuần xen kẽ, trên đầu là tên tháng, và có vạch HÔM NAY.
 *    Trục luôn khớp ranh giới tuần (thứ Hai → Chủ nhật) nên một thanh dài hai tuần trông
 *    đúng bằng hai ô.
 * 2. MÀU NÓI KẾT QUẢ, ĐỘ SÁNG NÓI CÒN SỐNG HAY ĐÃ KHÉP. Đang làm thì sáng; đã xong có tiến
 *    bộ thì xanh mờ; đã xong chưa ăn thua thì đỏ mờ; đã xong mà chưa ai kết luận thì xám mờ.
 *    Chờ duyệt thì chỉ có viền đứt nét và KHÔNG có ruột — vì chu kỳ thực hiện chưa bắt đầu.
 * 3. MỖI DÒNG CÓ TÊN Ở CỘT TRÁI CỐ ĐỊNH. Các thanh vì thế thẳng cột với nhau và so được,
 *    thay vì mỗi thanh một chỗ bắt đầu như khi tên nằm ngay trên nó.
 *
 * Trục dùng CHUNG với các mốc điểm ở trên: mốc MT là vạch đứng xuyên suốt cả dải, nên đọc
 * được ngay phương án nào chạy giữa hai lần thi nào — đúng thứ mục 4.4 đòi.
 */
function PlanLane({ series, points, onOpenCase, today }: {
  series: Series; points: Point[]; onOpenCase?: (caseId: number) => void; today: string | null;
}) {
  const plans = series.plans ?? [];
  if (!plans.length) return null;

  const reviews = series.reviews ?? [];
  const nums = [
    ...plans.map((pl) => t(pl.from)!),
    ...plans.map((pl) => t(pl.to ?? pl.expectedTo ?? pl.from)!),
    ...points.map((p) => t(p.at)).filter((x): x is number => x !== null),
    ...reviews.map((r) => t(r.on)!).filter(Boolean),
    ...(t(today) !== null ? [t(today)!] : []),
  ].filter((x) => Number.isFinite(x));

  const lo = mondayOf(Math.min(...nums));
  const hi = mondayOf(Math.max(...nums)) + 7 * DAY;
  const span = hi - lo || 1;
  const pct = (v: number) => ((v - lo) / span) * 100;
  const clamp = (v: number) => Math.max(0, Math.min(100, pct(v)));
  /* Nhãn sát mép trái/phải thì thôi căn giữa — căn giữa ở mép là cách để nó chạy ra ngoài. */
  const labelShift = (x: number) => (x < 6 ? 'none' : x > 94 ? 'translateX(-100%)' : 'translateX(-50%)');

  const weeks: number[] = [];
  for (let x = lo; x < hi; x += 7 * DAY) weeks.push(x);
  /* Dài quá thì bỏ ô tuần, chỉ giữ tháng — ba mươi vạch dọc thì nền át mất dữ liệu. */
  const showWeeks = weeks.length <= 26;

  /* Mốc tháng: ngày 1 của mỗi tháng rơi trong khoảng đang vẽ, cộng chính mép trái. */
  const months: { at: number; label: string }[] = [];
  {
    const d = new Date(lo);
    let y = d.getUTCFullYear();
    let m = d.getUTCMonth();
    months.push({ at: lo, label: `${MONTH_SHORT[m]}/${String(y).slice(2)}` });
    for (;;) {
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      const at = Date.UTC(y, m, 1);
      if (at >= hi) break;
      months.push({ at, label: `${MONTH_SHORT[m]}/${String(y).slice(2)}` });
    }
  }

  const todayMs = t(today);
  const GRID = 'grid grid-cols-[minmax(7rem,13rem)_1fr] gap-x-2 items-center';

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-slate-500">
        Phương án hỗ trợ trên cùng trục thời gian — mỗi ô nền là một tuần
      </span>

      <div className="rounded-lg border px-2 py-2" style={{ borderColor: 'var(--line)' }}>
        {/* ───────────── hàng tháng ───────────── */}
        <div className={GRID}>
          <span />
          <div className="relative h-4">
            {months.map((mo) => (
              <span key={mo.at}
                className="absolute top-0 text-[10px] text-slate-400 whitespace-nowrap pl-1"
                style={{ left: `${Math.min(clamp(mo.at), 94)}%`, borderLeft: '1px solid var(--line-strong)' }}>
                {mo.label}
              </span>
            ))}
          </div>
        </div>

        {/* ───────────── hàng mốc thi ───────────── */}
        <div className={GRID}>
          <span className="text-[10px] text-slate-600 text-right">mốc thi →</span>
          <div className="relative h-4">
            {points.map((p, i) => {
              const x = t(p.at);
              if (x === null) return null;
              const at = clamp(x);
              return (
                <span key={i}
                  className="absolute top-0 text-[10px] text-slate-300 whitespace-nowrap px-1 rounded"
                  style={{ left: `${at}%`, transform: labelShift(at), background: 'var(--surface-2)' }}
                  title={`${p.label} · ${fmtDate(p.at)}`}>
                  {p.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* ───────────── các dòng phương án ───────────── */}
        <ul className="list-none p-0 m-0">
          {plans.map((pl) => {
            const from = t(pl.from)!;
            const to = t(pl.to ?? pl.expectedTo ?? pl.from)!;
            const openEnd = !pl.to;
            const state: PlanResult | 'pending' = pl.pending
              ? 'pending' : (pl.result ?? (pl.running ? 'running' : 'undetermined'));
            const look = PLAN_LOOK[state];
            const mine = reviews.filter((r) => (r.interventionId
              ? r.interventionId === pl.id
              : r.caseId === pl.caseId));
            const name = pl.description ?? pl.kindLabel ?? pl.kind;
            const range = `${fmtDate(pl.from)} → ${pl.to ? fmtDate(pl.to)
              : pl.expectedTo ? `dự kiến ${fmtDate(pl.expectedTo)}` : 'chưa hẹn ngày xong'}`;

            return (
              <li key={pl.id} className={`${GRID} py-1 rounded row-hover`}>
                <button type="button" title={`${name}\n${range}\n${look.word}`}
                  className="text-left appearance-none border-0 bg-transparent p-0 group min-w-0"
                  onClick={onOpenCase ? () => onOpenCase(pl.caseId) : undefined}>
                  <span className={`block text-xs truncate group-hover:underline ${
                    state === 'running' ? 'text-slate-100' : 'text-slate-400'}`}>
                    {name}
                  </span>
                  {/* Chữ nói đúng điều màu đang nói — không ai phải đoán theo màu. */}
                  <span className="block text-[10px] text-slate-500 truncate">
                    <span style={{ color: look.dot }}>■</span> {look.word}
                  </span>
                </button>

                <span className="relative block h-7" title={range}>
                  {/* NỀN TUẦN: dải xen kẽ cho đếm được, vạch mảnh ở mỗi thứ Hai cho đọc ranh giới. */}
                  {showWeeks && weeks.map((w, i) => (
                    <span key={w} className="absolute inset-y-0"
                      style={{
                        left: `${clamp(w)}%`, width: `${100 / weeks.length}%`,
                        background: i % 2 ? 'rgba(255,255,255,0.035)' : 'transparent',
                        borderLeft: '1px solid rgba(255,255,255,0.05)',
                      }} />
                  ))}
                  {/* vạch tháng */}
                  {months.slice(1).map((mo) => (
                    <span key={mo.at} className="absolute inset-y-0 w-px"
                      style={{ left: `${clamp(mo.at)}%`, background: 'var(--line)' }} />
                  ))}
                  {/* vạch mốc thi, xuyên suốt cả dải */}
                  {points.map((p, i) => {
                    const x = t(p.at);
                    return x === null ? null : (
                      <span key={i} className="absolute inset-y-0 w-px"
                        style={{ left: `${clamp(x)}%`, background: 'var(--line-strong)' }} />
                    );
                  })}
                  {/* vạch HÔM NAY */}
                  {todayMs !== null && todayMs >= lo && todayMs <= hi && (
                    <span className="absolute inset-y-0 w-px" title={`Hôm nay ${fmtDate(today)}`}
                      style={{ left: `${clamp(todayMs)}%`, background: 'var(--accent-strong)' }} />
                  )}

                  {/* chính thanh phương án */}
                  <span className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded"
                    style={{
                      left: `${clamp(from)}%`,
                      width: `calc(${Math.max(0.5, clamp(to) - clamp(from))}% + 6px)`,
                      background: look.fill,
                      opacity: look.opacity,
                      border: state === 'pending' ? '1px dashed var(--line-strong)' : 'none',
                      /* Chưa có ngày kết thúc thì ĐUÔI HỞ — không vẽ một cái kết chưa xảy ra. */
                      borderTopRightRadius: openEnd ? 0 : undefined,
                      borderBottomRightRadius: openEnd ? 0 : undefined,
                    }} />
                  {openEnd && (
                    <span className="absolute top-1/2 -translate-y-1/2 text-[10px] leading-none"
                      style={{ left: `calc(${clamp(to)}% + 7px)`, color: look.dot, opacity: look.opacity }}
                      title="Chưa có ngày kết thúc">▸</span>
                  )}

                  {/* mỗi lần có người nhìn lại và ghi kết quả */}
                  {mine.map((r, i) => {
                    const x = t(r.on);
                    return x === null ? null : (
                      <span key={i}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ left: `${clamp(x)}%`, background: 'var(--text)' }}
                        title={`${fmtDate(r.on)} — ${outcomeLabelFor('academic', r.outcome)}`} />
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ul>

        {/* ───────────── chú giải ───────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 mt-1 border-t"
          style={{ borderColor: 'var(--line)' }}>
          {(['running', 'success', 'failure', 'undetermined'] as const).map((k) => (
            <span key={k} className="text-[10px] text-slate-500 whitespace-nowrap">
              <span style={{ color: PLAN_LOOK[k].dot, opacity: PLAN_LOOK[k].opacity }}>■</span>{' '}
              {PLAN_LOOK[k].word}
            </span>
          ))}
          <span className="text-[10px] text-slate-500 whitespace-nowrap">
            <span className="text-slate-200">●</span> lần ghi kết quả
          </span>
          {todayMs !== null && (
            <span className="text-[10px] text-slate-500 whitespace-nowrap">
              <span style={{ color: 'var(--accent-strong)' }}>│</span> hôm nay
            </span>
          )}
        </div>
      </div>

      <SectionNote>
        Hai thứ nằm cạnh nhau trên trục thời gian KHÔNG có nghĩa cái này gây ra cái kia — phần
        mềm bày ra điều đã xảy ra, kết luận là việc của người đọc.
      </SectionNote>
    </div>
  );
}

/** Lớp Normal giữ nguyên điểm gốc 13/30; Fast Track là band 0–9. */
function fmtValue(p: Point, mode: 'ielts' | 'ratio'): string {
  if (p.value === null) return '—';
  if (p.total) return `${p.value}/${p.total}`;
  return mode === 'ratio' ? String(p.value) : fmtBand(p.value);
}
