import { useState } from 'react';
import { Empty, SectionNote } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';

type Point = {
  kind: 'official' | 'teacher';
  at: string | null; label: string;
  value: number | null; total: number | null; expectation: number | null;
};
/** Một khoảng thực hiện phương án, vẽ ở dải dưới cùng trục thời gian (mục 4.4). */
type PlanBand = {
  id: number; caseId: number; kind: string; description: string | null;
  from: string; to: string | null; expectedTo: string | null; running: boolean;
};
/** Một lần người thật nhìn lại và ghi kết quả — mốc nhỏ trên chính dải phương án. */
type Review = { on: string; outcome: string; caseId: number };
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

      <PlanLane series={cur} points={official} onOpenCase={onOpenCase} />
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

/**
 * DẢI PHƯƠNG ÁN HỖ TRỢ — mỗi phương án MỘT DÒNG có tên, một thanh, và khoảng ngày viết rõ.
 *
 * Bản trước vẽ chúng thành mấy vệt màu không nhãn nằm dưới đường điểm: nhìn thì thấy có cái
 * gì đó chạy ngang, nhưng không biết là gì, của case nào, từ bao giờ. Một thanh không có
 * tên thì không phải dữ liệu, chỉ là trang trí.
 *
 * Trục thời gian dùng CHUNG với các mốc điểm ở trên, nên nhìn được phương án chạy trong
 * khoảng nào so với lần thi nào — đúng thứ mục 4.4 đòi.
 */
function PlanLane({ series, points, onOpenCase }: {
  series: Series; points: Point[]; onOpenCase?: (caseId: number) => void;
}) {
  const plans = series.plans ?? [];
  if (!plans.length) return null;

  const t = (iso: string | null | undefined) =>
    iso ? Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) : null;
  const ends = plans.map((pl) => t(pl.to ?? pl.expectedTo ?? pl.from)!);
  const starts = plans.map((pl) => t(pl.from)!);
  const marks = (series.reviews ?? []).map((r) => t(r.on)!).filter(Boolean);
  const pointTimes = points.map((p) => t(p.at)).filter((x): x is number => x !== null);
  const lo = Math.min(...starts, ...pointTimes, ...marks);
  const hi = Math.max(...ends, ...pointTimes, ...marks);
  const span = hi - lo || 1;
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / span) * 100))}%`;

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-slate-500">Phương án hỗ trợ trong cùng khoảng thời gian</span>

      {/* Vạch mốc thi trên đầu dải, để đọc được phương án chạy trước hay sau lần thi nào. */}
      {pointTimes.length > 0 && (
        <div className="relative h-4">
          {points.map((p, i) => {
            const x = t(p.at);
            return x === null ? null : (
              <span key={i} className="absolute -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap"
                style={{ left: pct(x) }}>
                {p.label}
              </span>
            );
          })}
        </div>
      )}

      <ul className="list-none p-0 m-0 space-y-1">
        {plans.map((pl) => {
          const from = t(pl.from)!;
          const to = t(pl.to ?? pl.expectedTo ?? pl.from)!;
          const reviews = (series.reviews ?? []).filter((r) => r.caseId === pl.caseId);
          return (
            <li key={pl.id}>
              <button type="button"
                className="w-full text-left appearance-none border-0 bg-transparent p-0 group"
                onClick={onOpenCase ? () => onOpenCase(pl.caseId) : undefined}>
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs text-slate-200 group-hover:underline">
                    {pl.description ?? pl.kind}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {fmtDate(pl.from)}
                    {pl.to ? ` → ${fmtDate(pl.to)}`
                      : pl.expectedTo ? ` → dự kiến ${fmtDate(pl.expectedTo)}` : ' → đang chạy'}
                  </span>
                </span>
                {/*
                  Một hue, hai sắc: đang chạy nhạt và hở đuôi, đã xong đậm và đóng. Chữ bên
                  trên đã nói rõ, nên màu chỉ là thứ nhắc lại — không ai phải đoán theo màu.
                */}
                <span className="relative block h-2 mt-0.5 rounded"
                      style={{ background: 'var(--line)' }}>
                  <span className="absolute inset-y-0 rounded"
                    style={{
                      left: pct(from),
                      width: `calc(${pct(to)} - ${pct(from)} + 4px)`,
                      background: pl.running ? 'var(--accent-line)' : 'var(--accent)',
                      opacity: pl.running ? 0.75 : 1,
                    }} />
                  {reviews.map((r, i) => {
                    const x = t(r.on);
                    return x === null ? null : (
                      <span key={i}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ left: pct(x), background: 'var(--text)' }}
                        title={`Đánh giá hỗ trợ ${fmtDate(r.on)}`} />
                    );
                  })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <SectionNote>
        Chấm trắng trên thanh là những lần có người nhìn lại và ghi kết quả. Hai thứ nằm cạnh
        nhau trên trục thời gian KHÔNG có nghĩa cái này gây ra cái kia — phần mềm bày ra điều
        đã xảy ra, kết luận là việc của người đọc.
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
