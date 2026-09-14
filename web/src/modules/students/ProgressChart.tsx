import { useState } from 'react';
import { Empty, Info, SectionNote } from '../../ui/ui.tsx';
import { fmtBand } from '../../lib/format.ts';

type Point = {
  kind: 'official' | 'teacher';
  at: string | null; label: string;
  value: number | null; total: number | null; expectation: number | null;
};
type Series = {
  skill: string; label: string; points: Point[]; officialCount: number; enough: boolean;
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
export function ProgressChart({ data }: { data: { mode: 'ielts' | 'ratio'; skills: Series[] } }) {
  const usable = data.skills.filter((s) => s.points.length > 0);
  const [skill, setSkill] = useState<string>(usable[0]?.skill ?? '');
  const cur = usable.find((s) => s.skill === skill) ?? usable[0] ?? null;

  if (!cur) return <Empty title="Chưa có điểm nào để vẽ tiến bộ" />;

  return (
    <div className="space-y-3">
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

      {!cur.enough ? (
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--line)' }}>
          <p className="text-sm text-slate-200 m-0">Chưa đủ dữ liệu để nói {cur.label} đang lên hay đang xuống.</p>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Mới có {cur.officialCount} mốc chính thức. Cần ít nhất hai mốc thì mới có một
            hướng đi để nhìn.
          </p>
          <PointList points={cur.points} mode={data.mode} />
        </div>
      ) : (
        <>
          <Plot series={cur} mode={data.mode} />
          <PointList points={cur.points} mode={data.mode} />
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
function Plot({ series, mode }: { series: Series; mode: 'ielts' | 'ratio' }) {
  const W = 640, H = 170, PAD_X = 30, PAD_Y = 26;
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
  const y = (v: number) => H - PAD_Y - ((v - lo) / span) * (H - 2 * PAD_Y);

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
      </svg>
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
