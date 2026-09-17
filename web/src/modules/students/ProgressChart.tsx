import { useState } from 'react';
import { Empty, Info, SectionNote } from '../../ui/ui.tsx';
import { fmtBand } from '../../lib/format.ts';

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
 * BIỂU ĐỒ TIẾN BỘ GỌN (mục 7.12.A).
 *
 * Câu hỏi duy nhất biểu đồ này trả lời: KỸ NĂNG NÀY ĐANG LÊN HAY ĐANG XUỐNG.
 *
 * Vì thế nó cố tình nhỏ và cố tình ít: một kỹ năng mỗi lần, không lưới toạ độ, không số
 * trên mọi trục. Ai cần con số chính xác đã có bảng điểm ngay bên dưới — biểu đồ mà cố nói
 * cả hình dạng lẫn con số thì hỏng cả hai.
 *
 * BỐN ĐIỀU BIỂU ĐỒ NÀY KHÔNG LÀM:
 *
 * 1. KHÔNG VẼ KHI CHƯA ĐỦ. Một mốc là một mốc, không phải một đường. Dưới hai mốc chính
 *    thức thì nói thẳng "chưa đủ dữ liệu" thay vì vẽ một chấm rồi để người xem tự tưởng
 *    tượng ra xu hướng.
 * 2. KHÔNG NỐI ĐIỂM CHÍNH THỨC VỚI ĐIỂM CÔ TỰ CHẤM. Điểm phòng thi và điểm cô ước lượng
 *    khi đọc một bài viết là hai loại khác nhau; nối lại thành một đường là tự chế ra một
 *    phép so sánh không ai bảo đảm. Điểm cô chấm là hình THOI RỖNG, đứng rời.
 * 3. KHÔNG QUY MỌI THỨ VỀ PHẦN TRĂM. Lớp Normal vẽ đúng điểm gốc 13/30; tỷ lệ chỉ dùng để
 *    xếp chiều cao trong CÙNG một bài, không dùng để nói bài này hơn bài kia.
 * 4. KHÔNG KẾT LUẬN HỘ. Biểu đồ cho thấy hình dạng; nhận định là việc của người đọc.
 */
export function ProgressChart({ data, only, onOpenCase }: {
  data: { mode: 'ielts' | 'ratio'; skills: Series[] };
  /**
   * Chỉ vẽ MỘT kỹ năng, không bày thanh chọn. Dùng khi biểu đồ nằm trong hàng kỹ năng của
   * bảng tiến độ — ở đó người xem đã chọn kỹ năng bằng chính cú bấm mở hàng, hỏi lại một
   * lần nữa là thừa.
   */
  only?: string | null;
  /** Bấm một dải phương án thì mở đúng case đó (mục 4.4). */
  onOpenCase?: (caseId: number) => void;
}) {
  const usable = data.skills.filter((s) => s.points.length > 0 || (s.plans?.length ?? 0) > 0);
  const [skill, setSkill] = useState<string>(only ?? usable[0]?.skill ?? '');
  const cur = usable.find((s) => s.skill === (only ?? skill)) ?? (only ? null : usable[0]) ?? null;

  if (!cur) return <Empty title="Chưa có điểm nào để vẽ tiến bộ" />;

  return (
    <div className="space-y-3">
      {!only && (
        <div className="flex flex-wrap gap-1">
          {usable.map((s) => (
            <button key={s.skill}
              className={`btn btn-sm ${s.skill === cur.skill ? 'btn-primary' : ''}`}
              onClick={() => setSkill(s.skill)}>
              {s.label}
              {!s.enough && <span className="opacity-60 ml-1">·</span>}
            </button>
          ))}
        </div>
      )}

      {!cur.enough ? (
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--line)' }}>
          <p className="text-sm text-slate-200 m-0">Chưa đủ dữ liệu để nói {cur.label} đang lên hay đang xuống.</p>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Mới có {cur.officialCount} mốc chính thức. Cần ít nhất hai mốc thì mới có một
            hướng đi để nhìn.
          </p>
          <PointList points={cur.points} mode={data.mode} />
          <PlanList series={cur} onOpenCase={onOpenCase} />
        </div>
      ) : (
        <>
          <Plot series={cur} mode={data.mode} onOpenCase={onOpenCase} />
          <PointList points={cur.points} mode={data.mode} />
          <PlanList series={cur} onOpenCase={onOpenCase} />
        </>
      )}

      <SectionNote>
        Hình thoi rỗng là điểm GIÁO VIÊN TỰ CHẤM khi cập nhật case — nó đứng riêng, không nối
        vào đường điểm chính thức, vì hai loại điểm này không chấm bằng cùng một thước.
      </SectionNote>
    </div>
  );
}

/**
 * Giá trị thô để vẽ: lớp Fast Track là band 0–9, lớp Normal là TỶ LỆ điểm đạt trên tổng.
 *
 * Lớp Normal buộc phải quy về tỷ lệ để xếp được chiều cao, vì mỗi bài một thang điểm khác
 * nhau (13/30 và 18/40 không so thẳng được). Con số hiện trên hình vẫn là ĐIỂM GỐC, và
 * ghi chú dưới biểu đồ nói rõ tỷ lệ chỉ để đọc cho dễ.
 */
function rawOf(p: Point, mode: 'ielts' | 'ratio'): number | null {
  if (p.value === null) return null;
  if (mode === 'ratio' || p.total) return p.total ? p.value / p.total : null;
  return p.value;
}

/**
 * KHUNG GIÁ TRỊ CỦA TRỤC DỌC.
 *
 * Vẽ band 5.0 → 6.0 trên thang 0–9 thì đường gần như phẳng, và một em tiến một band trông
 * như không tiến gì. Vẽ vừa khít 5.0–6.0 thì ngược lại: nửa band thành một cú nhảy dựng
 * đứng. Nên lấy khoảng dữ liệu rồi nới ra nửa band mỗi đầu — đủ để thấy hình dạng, không đủ
 * để thổi phồng.
 */
function domainOf(values: number[], mode: 'ielts' | 'ratio'): [number, number] {
  if (mode === 'ratio') return [0, 1];
  const lo = Math.max(0, Math.floor(Math.min(...values) * 2) / 2 - 0.5);
  const hi = Math.min(9, Math.ceil(Math.max(...values) * 2) / 2 + 0.5);
  return hi - lo < 1 ? [Math.max(0, lo - 0.5), Math.min(9, hi + 0.5)] : [lo, hi];
}

function fmtValue(p: Point, mode: 'ielts' | 'ratio'): string {
  if (p.value === null) return '—';
  if (p.total) return `${p.value}/${p.total}`;
  return mode === 'ratio' ? String(p.value) : fmtBand(p.value);
}

/**
 * Vẽ bằng SVG thuần, không thư viện. Một biểu đồ bốn điểm không đáng để kéo thêm vài trăm
 * kilobyte về máy người dùng, và thư viện nào cũng có mặc định riêng phải gỡ đi.
 */
function Plot({ series, mode, onOpenCase }: {
  series: Series; mode: 'ielts' | 'ratio'; onOpenCase?: (caseId: number) => void;
}) {
  const plans = series.plans ?? [];
  /*
   * DẢI PHƯƠNG ÁN chiếm thêm chiều cao ở dưới, KHÔNG đè lên đường điểm (mục 4.4). Đổ chữ và
   * nhãn lên chính đường điểm là cách chắc chắn nhất để không đọc được cả hai.
   */
  const laneH = plans.length ? 14 * Math.min(plans.length, 4) + 16 : 0;
  const W = 640, H = 170 + laneH, PAD_X = 30, PAD_Y = 26;
  const pts = series.points.filter((p) => rawOf(p, mode) !== null);
  if (pts.length === 0) return null;

  /* Đường kỳ vọng cũng phải nằm trong khung, nếu không nó bị cắt mất ở mép trên. */
  const values = [
    ...pts.map((p) => rawOf(p, mode)!),
    ...(mode === 'ielts' ? pts.filter((p) => p.expectation !== null).map((p) => p.expectation!) : []),
  ];
  const [lo, hi] = domainOf(values, mode);
  const span = hi - lo || 1;

  const x = (i: number) => PAD_X + (pts.length === 1 ? (W - 2 * PAD_X) / 2
    : (i * (W - 2 * PAD_X)) / (pts.length - 1));
  /* Vùng vẽ đường điểm dừng TRÊN dải phương án, nên trừ luôn chiều cao dải ra khỏi trục dọc. */
  const plotH = H - laneH;
  const y = (v: number) => plotH - PAD_Y - ((v - lo) / span) * (plotH - 2 * PAD_Y);

  /*
   * TRỤC THỜI GIAN DÙNG CHUNG cho cả điểm và dải phương án.
   *
   * Các mốc điểm được xếp CÁCH ĐỀU nhau (đó là cách đọc quen của một bảng MT), nên một ngày
   * bất kỳ phải được nội suy về đúng khoảng giữa hai mốc gần nó. Vẽ dải theo ngày thật trên
   * một trục cách đều là cách làm hai thứ lệch nhau ngay lần đầu có hai MT cách nhau xa.
   */
  const dated = pts.map((p, i) => ({ t: p.at ? Date.parse(`${p.at}T00:00:00Z`) : null, i }))
    .filter((d): d is { t: number; i: number } => d.t !== null);
  const xAt = (iso: string | null): number | null => {
    if (!iso || dated.length === 0) return null;
    const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
    if (dated.length === 1) return x(dated[0].i);
    if (t <= dated[0].t) return x(dated[0].i);
    const last = dated[dated.length - 1];
    if (t >= last.t) return x(last.i);
    for (let k = 1; k < dated.length; k += 1) {
      const a = dated[k - 1], b = dated[k];
      if (t <= b.t) {
        const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
        return x(a.i) + f * (x(b.i) - x(a.i));
      }
    }
    return x(last.i);
  };

  const official = pts.map((p, i) => ({ p, i })).filter((n) => n.p.kind === 'official');
  const line = official.map((n) => `${x(n.i)},${y(rawOf(n.p, mode)!)}`).join(' ');
  const exp = official.filter((n) => n.p.expectation !== null);

  return (
    /*
      GIỚI HẠN BỀ NGANG. Biểu đồ bốn điểm kéo hết màn hình rộng thì đường gần như nằm ngang
      dù điểm có tăng thật — mắt đọc độ dốc theo cả hai chiều, không chỉ chiều dọc.
    */
    <div className="rounded-lg border p-2 max-w-[680px]" style={{ borderColor: 'var(--line)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"
        role="img" aria-label={`Tiến bộ môn ${series.label}`}>
        {/* Đường kỳ vọng của từng mốc — nét đứt, mờ, đứng sau đường điểm. */}
        {exp.length > 1 && (
          <polyline fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="4 4"
            points={exp.map((n) => `${x(n.i)},${y(n.p.expectation!)}`).join(' ')} />
        )}
        {/* Đường điểm chính thức. */}
        {official.length > 1 && (
          <polyline fill="none" stroke="var(--accent, #60a5fa)" strokeWidth="2" points={line} />
        )}
        {pts.map((p, i) => {
          const cy = y(rawOf(p, mode)!);
          const cx = x(i);
          return p.kind === 'official' ? (
            <g key={`${p.kind}-${i}`}>
              <circle cx={cx} cy={cy} r="4" fill="var(--accent, #60a5fa)" />
              <text x={cx} y={cy - 9} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.75">
                {fmtValue(p, mode)}
              </text>
              <text x={cx} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
                {p.label}
              </text>
            </g>
          ) : (
            /* Thoi RỖNG: điểm cô tự chấm, cố ý không nối vào đường nào. */
            <g key={`${p.kind}-${i}`}>
              <rect x={cx - 4} y={cy - 4} width="8" height="8" transform={`rotate(45 ${cx} ${cy})`}
                fill="none" stroke="var(--warn, #fbbf24)" strokeWidth="1.5" />
              <text x={cx} y={cy - 9} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                {fmtValue(p, mode)}
              </text>
            </g>
          );
        })}

        {/*
          DẢI PHƯƠNG ÁN — nhóm THEO CASE, mỗi phương án một vạch, tối đa bốn vạch. Vạch có
          đuôi mờ nghĩa là phương án CHƯA xong: nó chạy tới ngày dự kiến kết thúc chứ không
          phải đã kết thúc ở đó.
        */}
        {plans.slice(0, 4).map((pl, k) => {
          const x1 = xAt(pl.from);
          const x2 = xAt(pl.to ?? pl.expectedTo ?? pl.from);
          if (x1 === null || x2 === null) return null;
          const yy = plotH + 10 + k * 14;
          const w = Math.max(6, (x2 ?? x1) - x1);
          return (
            <g key={pl.id} className={onOpenCase ? 'cursor-pointer' : undefined}
               onClick={onOpenCase ? () => onOpenCase(pl.caseId) : undefined}>
              <title>{`${pl.description ?? pl.kind} — từ ${pl.from}${pl.to ? ` đến ${pl.to}` : ' (đang chạy)'}`}</title>
              <rect x={x1} y={yy} width={w} height="7" rx="3"
                fill={pl.running ? 'var(--warn, #fbbf24)' : 'var(--accent, #60a5fa)'}
                opacity={pl.running ? 0.45 : 0.65} />
              {/* Các lần đánh giá hỗ trợ: chấm nhỏ ngay trên dải của chính case đó. */}
              {(series.reviews ?? []).filter((rv) => rv.caseId === pl.caseId).map((rv, j) => {
                const rx = xAt(rv.on);
                return rx === null ? null : (
                  <circle key={j} cx={rx} cy={yy + 3.5} r="2.5" fill="currentColor" opacity="0.8" />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * DANH SÁCH KHOẢNG PHƯƠNG ÁN — để đọc được trên điện thoại và bằng trình đọc màn hình.
 *
 * Mục 4.4 đòi "mobile có danh sách mốc tương đương dễ đọc, không ép người dùng kéo một biểu
 * đồ quá rộng". Danh sách này cũng là chỗ nói rõ điều biểu đồ cố ý KHÔNG nói: hai thứ nằm
 * cạnh nhau trên trục thời gian không có nghĩa cái này gây ra cái kia.
 */
function PlanList({ series, onOpenCase }: {
  series: Series; onOpenCase?: (caseId: number) => void;
}) {
  const plans = series.plans ?? [];
  if (!plans.length) return null;
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-slate-500">Phương án hỗ trợ trong cùng khoảng thời gian</span>
      <ul className="list-none p-0 m-0 space-y-1">
        {plans.map((pl) => (
          <li key={pl.id} className="text-xs text-slate-300">
            <button type="button"
              className="appearance-none border-0 bg-transparent p-0 text-left text-slate-300 hover:underline"
              onClick={onOpenCase ? () => onOpenCase(pl.caseId) : undefined}>
              <span aria-hidden className={pl.running ? 'text-amber-300' : 'text-sky-300'}>▬</span>{' '}
              {pl.description ?? pl.kind}
              <span className="text-slate-500">
                {' '}· {pl.from}
                {pl.to ? ` → ${pl.to}` : pl.expectedTo ? ` → dự kiến ${pl.expectedTo}` : ' → đang chạy'}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <SectionNote>
        Hai thứ nằm cạnh nhau trên trục thời gian KHÔNG có nghĩa cái này gây ra cái kia. Biểu
        đồ bày ra điều đã xảy ra; kết luận là việc của người đọc.
      </SectionNote>
    </div>
  );
}

/**
 * Danh sách mốc dưới biểu đồ. Có nó thì người đọc màn hình và người xem trên điện thoại
 * vẫn đọc được đầy đủ, kể cả khi hình vẽ quá nhỏ để đọc con số.
 */
function PointList({ points, mode }: { points: Point[]; mode: 'ielts' | 'ratio' }) {
  return (
    <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mt-2">
      {points.map((p, i) => (
        <li key={i}>
          <Info title={p.kind === 'teacher' ? 'Điểm giáo viên tự chấm, không phải điểm chính thức' : undefined}>
            {p.kind === 'teacher' && <span aria-hidden className="text-amber-300">◇</span>}
            {p.label} {fmtValue(p, mode)}
            {p.expectation !== null && (
              <span className="opacity-60"> · kỳ vọng {fmtBand(p.expectation)}</span>
            )}
          </Info>
        </li>
      ))}
    </ul>
  );
}
