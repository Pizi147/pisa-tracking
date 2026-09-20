import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Card({ title, action, children, className = '', bodyClass = 'p-4' }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'muted';

/**
 * BỐN MÀU ĐIỂM — MỘT BẢNG DUY NHẤT (HE_GIAO_DIEN §2, chốt 17/09).
 *
 *   rose     dưới kỳ vọng     — điểm tăng mà vẫn dưới kỳ vọng VẪN ĐỎ
 *   sky      bằng kỳ vọng
 *   emerald  vượt kỳ vọng     — không dùng xanh lá cho bất kỳ nghĩa nào khác trên ô điểm
 *   slate    thiếu dữ liệu    — khác điểm 0, khác ô trống
 *
 * Trước đây bảng này được chép ở `SkillBoard.tsx`, và mỗi component mới sẽ tự chép thêm một
 * bản với sắc hơi khác. Nay `SkillBoard`, `KetQuaDot` và mọi ô điểm về sau đọc từ đây.
 *
 * CHIP CÓ NỀN thay vì chữ màu trơn: chữ màu trơn trên nền tối tương phản yếu (yêu cầu riêng của
 * chủ sản phẩm). Viền + nền nhạt cùng họ màu + chữ đậm — cùng kiểu với `Status`/`Alert`.
 */
export type ScoreTone = 'rose' | 'sky' | 'emerald' | 'slate';
export const SCORE_CHIP: Record<ScoreTone, string> = {
  rose: 'bg-rose-300/15 text-rose-200 border-rose-300/40',
  sky: 'bg-sky-300/15 text-sky-200 border-sky-300/40',
  emerald: 'bg-emerald-300/15 text-emerald-200 border-emerald-300/40',
  slate: 'bg-slate-300/8 text-slate-400 border-slate-300/20',
};
/** Chữ trơn cùng họ màu — cho dòng phụ ngắn cạnh số điểm (không phải chip). */
export const SCORE_TEXT: Record<ScoreTone, string> = {
  rose: 'text-rose-300', sky: 'text-sky-300', emerald: 'text-emerald-300', slate: 'text-slate-500',
};

/**
 * SÁU HỌ NHÃN, PHÂN BIỆT BẰNG HÌNH DẠNG TRƯỚC, MÀU SAU (mục 2.1).
 *
 * Trước vòng 5 gần như mọi thứ dùng chung một kiểu `Pill`: mức SOS của một đứa trẻ, việc
 * mình phải làm, kết quả sau hỗ trợ, và mấy chữ chỉ để biết như "GVCN" hay "L R" — tất cả
 * cùng viền, cùng bo góc, cùng cỡ chữ, màu thì mỗi màn tự chọn. Mắt không tách được cái nào
 * ra cái nào, nên nhìn một dòng lớp chỉ thấy một đám nhãn màu.
 *
 *   <Level>   nền ĐẶC, bo tròn hẳn      — mức SOS, mức độ ưu tiên: tình trạng của một đứa trẻ
 *   <Status>  nền nhẹ + biểu tượng      — TRẠNG THÁI CÔNG VIỆC: đang làm · chờ · xong
 *   <Task>    viền vuông, gạch dọc trái — VIỆC PHẢI LÀM, bấm được
 *   <Alert>   dấu ⚠ + màu mạnh          — quá hạn, thiếu thông tin
 *   <Outcome> biểu tượng kết quả        — KẾT QUẢ học tập: tiến bộ · chưa đổi · kém hơn
 *   <Info>    chữ mờ, viền mảnh         — chỉ để biết: vai trò, kỹ năng, mã lớp
 *
 * HAI LUẬT MÀU KHÔNG ĐƯỢC PHÁ (mục 2.2):
 *
 *   · XANH LÁ CHỈ DÀNH CHO `<Outcome>`. Xanh lá là một lời khen, và chỉ kết quả học tập mới
 *     có căn cứ để khen. "Đã lưu", "đã kết thúc phương án", "không có case" đều KHÔNG phải
 *     là tin tốt — chúng chỉ là việc đã xong hoặc chưa có tin gì.
 *   · MÀU KHÔNG BAO GIỜ ĐỨNG MỘT MÌNH. Mỗi họ có hình dạng và biểu tượng riêng, nên người
 *     không phân biệt được màu vẫn đọc ra nghĩa.
 *
 * Thứ tự nặng nhẹ về thị giác đi đúng theo mức độ đáng chú ý:
 * tình trạng học viên > cảnh báo > việc phải làm > kết quả > trạng thái > thông tin nền.
 */

/** Nền đặc nên chữ phải là màu tối, và phải đủ tương phản để đọc được. */
const LEVEL_CLASS: Record<Tone, string> = {
  ok: 'bg-emerald-300 text-slate-900',
  info: 'bg-sky-300 text-slate-900',
  warn: 'bg-amber-300 text-slate-900',
  danger: 'bg-rose-300 text-slate-900',
  neutral: 'bg-slate-300 text-slate-900',
  muted: 'bg-transparent text-slate-400 border border-dashed border-slate-500/40',
};

/**
 * MỨC ĐỘ của một học viên — SOS 1/2/3, hay mức độ ưu tiên do giáo viên nhận định.
 * Nặng nhất về thị giác vì đây là tình trạng của một đứa trẻ, không phải một con số vận hành.
 */
export function Level({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-[0.01em] whitespace-nowrap ${LEVEL_CLASS[tone]}`}>
      {children}
    </span>
  );
}

const TASK_CLASS: Record<Tone, { box: string; bar: string }> = {
  neutral: { box: 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]', bar: 'bg-[color:var(--accent)]' },
  info: { box: 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]', bar: 'bg-[color:var(--accent)]' },
  warn: { box: 'border-amber-300/45 bg-amber-300/10 text-amber-200', bar: 'bg-amber-300' },
  danger: { box: 'border-rose-300/45 bg-rose-300/10 text-rose-200', bar: 'bg-rose-300' },
  ok: { box: 'border-slate-300/20 bg-transparent text-slate-500', bar: 'bg-slate-500/50' },
  muted: { box: 'border-slate-300/20 bg-transparent text-slate-500', bar: 'bg-slate-500/50' },
};

/**
 * VIỆC PHẢI LÀM. Gạch dọc bên trái là dấu hiệu "bấm được, làm được".
 *
 * Mặc định màu nhấn; sắp tới hạn thì vàng, quá hạn thì đỏ, đã xong thì mờ đi — vẫn ba màu cũ.
 * KHÔNG dùng họ này cho tình trạng học viên, dù việc đó sinh ra từ một vấn đề của em.
 */
export function Task({ tone = 'neutral', children, title, as = 'span', onClick }: {
  tone?: Tone; children: ReactNode; title?: string; as?: 'span' | 'button';
  /* Nhận cả sự kiện, để dòng bấm được bên trong một dòng bấm được còn chặn được lan lên trên. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const c = TASK_CLASS[tone];
  const inner = (
    <>
      <span className={`w-[3px] self-stretch rounded-sm ${c.bar}`} aria-hidden />
      <span className="py-0.5 pr-2">{children}</span>
    </>
  );
  const cls = `inline-flex items-stretch gap-1.5 overflow-hidden rounded border pl-0 text-[11px] font-medium whitespace-nowrap ${c.box}`;
  if (as === 'button') {
    return <button type="button" title={title} onClick={onClick} className={`${cls} hover:brightness-125`}>{inner}</button>;
  }
  return <span title={title} className={cls}>{inner}</span>;
}

/**
 * CHỈ ĐỂ BIẾT — vai trò, kỹ năng được phân công, lộ trình, tên chương trình.
 * Nhẹ nhất, không kéo mắt. `pending` (viền đứt) nghĩa là đang thiếu một thứ gì đó, chưa phải lỗi.
 */
export function Info({ children, title, pending }: { children: ReactNode; title?: string; pending?: boolean }) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] whitespace-nowrap ${
        pending ? 'border-dashed border-slate-500/40 text-slate-500' : 'border-slate-300/20 text-slate-400'
      }`}>
      {children}
    </span>
  );
}

/**
 * TRẠNG THÁI XỬ LÝ — một việc đang ở đâu trong quy trình (mục 2.1).
 *
 * Nền nhẹ, có biểu tượng, và CỐ Ý KHÔNG BAO GIỜ MÀU XANH LÁ. "Đã hoàn thành" là một trạng
 * thái công việc, không phải một kết quả tốt: một phương án hoàn thành với kết quả "Kém hơn"
 * mà hiện màu xanh là nói dối người đọc. Kết quả có họ nhãn riêng ở ngay bên dưới.
 *
 *   xanh dương  đang thực hiện
 *   vàng        đang chờ (chờ duyệt, chờ tới hạn)
 *   xám         đã hoàn thành, hoặc chưa bắt đầu
 */
const STATUS_MARK: Record<'doing' | 'waiting' | 'done' | 'idle', string> = {
  doing: '▶', waiting: '◷', done: '✓', idle: '·',
};
const STATUS_CLASS: Record<'doing' | 'waiting' | 'done' | 'idle', string> = {
  doing: 'bg-sky-300/10 text-sky-200 border-sky-300/30',
  waiting: 'bg-amber-300/10 text-amber-200 border-amber-300/30',
  done: 'bg-slate-300/8 text-slate-400 border-slate-300/20',
  idle: 'bg-transparent text-slate-500 border-dashed border-slate-500/35',
};
export function Status({ kind, children, title }: {
  kind: 'doing' | 'waiting' | 'done' | 'idle'; children: ReactNode; title?: string;
}) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${STATUS_CLASS[kind]}`}>
      <span aria-hidden className="opacity-70">{STATUS_MARK[kind]}</span>
      {children}
    </span>
  );
}

/**
 * CẢNH BÁO — quá hạn, thiếu thông tin (mục 2.1).
 *
 * Luôn có dấu tam giác đứng trước, nên đọc được cả khi người xem không phân biệt màu, và
 * phân biệt được với trạng thái xử lý ngay cả khi hai nhãn đứng cạnh nhau.
 */
export function Alert({ tone = 'danger', children, title }: {
  tone?: 'danger' | 'warn'; children: ReactNode; title?: string;
}) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
        tone === 'danger'
          ? 'bg-rose-300/15 text-rose-200 border-rose-300/45'
          : 'bg-amber-300/15 text-amber-200 border-amber-300/45'
      }`}>
      <span aria-hidden>⚠</span>
      {children}
    </span>
  );
}

/**
 * KẾT QUẢ SAU HỖ TRỢ — đúng bảng màu/biểu tượng ở mục 7.10.
 *
 *   Tiến bộ rõ rệt   xanh lá + dấu tích
 *   Tiến bộ một phần vàng   + mũi tên lên
 *   Chưa thay đổi    vàng   + dấu ngang
 *   Kém hơn          đỏ     + mũi tên xuống
 *   Không đủ căn cứ  xám    + dấu hỏi
 *
 * Đây là họ nhãn DUY NHẤT được dùng màu xanh lá. Xanh lá ở chỗ khác là một lời khen không
 * ai kiểm chứng.
 */
const OUTCOME_CLASS: Record<string, string> = {
  ok: 'bg-emerald-300/12 text-emerald-200 border-emerald-300/35',
  warn: 'bg-amber-300/12 text-amber-200 border-amber-300/35',
  danger: 'bg-rose-300/12 text-rose-200 border-rose-300/35',
  muted: 'bg-transparent text-slate-400 border-slate-500/35',
};
export function Outcome({ tone, mark, children, title }: {
  tone: 'ok' | 'warn' | 'danger' | 'muted'; mark?: string; children: ReactNode; title?: string;
}) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${OUTCOME_CLASS[tone]}`}>
      {mark && <span aria-hidden>{mark}</span>}
      {children}
    </span>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
      <div className="text-slate-300 font-medium">{title}</div>
      {hint && <p className="text-slate-400 text-xs max-w-md leading-relaxed">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, hint, onRetry }: { message: string; hint?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
      <div className="text-rose-200 font-medium">{message}</div>
      {hint && <p className="text-slate-400 text-xs max-w-md">{hint}</p>}
      {onRetry && <button className="btn btn-sm mt-2" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}

export function Forbidden({ message, hint }: { message?: string; hint?: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-amber-200 font-medium">{message ?? 'Bạn không có quyền xem nội dung này'}</div>
      <p className="text-slate-400 text-xs mt-1 max-w-lg mx-auto">{hint ?? 'Quyền được xác định theo vai trò, phạm vi và phân công của tài khoản đang dùng.'}</p>
    </div>
  );
}

export function Skeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel h-8 w-full" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

export function KpiTile({ label, value, tone = 'neutral', to, sub }: {
  label: string; value: ReactNode; tone?: Tone; to?: string; sub?: string;
}) {
  const inner = (
    <div className={`card p-4 h-full transition-colors ${to ? 'hover:border-sky-300/40 cursor-pointer' : ''}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${
        tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : tone === 'ok' ? 'text-sky-200' : 'text-slate-100'
      }`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
      {to && <div className="text-[11px] text-sky-300 mt-2">Xem danh sách →</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full no-underline">{inner}</Link> : inner;
}

/**
 * Một nhãn + một ô. Mặc định bọc bằng `<label>` để bấm vào chữ là vào ô.
 *
 * ĐIỀU KHIỂN GỒM NHIỀU NÚT (bộ chọn tuần) thì truyền `as="div"`: `<label>` bọc nhiều nút sẽ
 * chuyển cú bấm vào chữ sang nút ĐẦU TIÊN — với bộ chọn tuần đó là "Tuần trước", nên bấm vào
 * nhãn thì tuần nhảy lùi.
 */
export function Field({ label, children, hint, required, as = 'label' }: {
  label: string; children: ReactNode; hint?: string; required?: boolean; as?: 'label' | 'div';
}) {
  const Wrap = as;
  return (
    <Wrap className="block">
      <span className="label">{label}{required && <span className="text-rose-300"> *</span>}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </Wrap>
  );
}

/**
 * Ghi chú giải thích dưới một khu vực.
 *
 * Dùng `<div>` chứ không phải `<p>`: có chỗ ghi chú cần một danh sách bên trong — ví dụ
 * "chưa hoàn thành case được vì còn ba việc" — và một danh sách nằm trong thẻ đoạn văn là
 * HTML sai, trình duyệt sẽ tự tách thẻ ra và làm hỏng đúng cái khung viền bên trái này.
 */
export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] text-slate-500 leading-relaxed border-l-2 border-slate-700 pl-2">{children}</div>
  );
}

export function DataCell({ value, state, suffix }: { value: ReactNode; state?: string; suffix?: string }) {
  if (state === 'not_applicable') return <span className="text-slate-600 text-xs italic">Không áp dụng</span>;
  if (value === null || value === undefined) return <span className="text-slate-500 text-xs">Chưa có dữ liệu</span>;
  return <span className="tabular-nums">{value}{suffix}</span>;
}

/**
 * TIÊU ĐỀ CỘT CÓ LỜI GIẢI THÍCH — mục 8.5 và 9.2.
 *
 * Bảng ở đây đầy chữ viết tắt: OVR, W1, SOS, "Quá hạn cập nhật". Người mới mở lên đoán sai
 * là chuyện thường, và đoán sai một cột số là hiểu sai cả bảng. Rê chuột lên tiêu đề một lúc
 * thì có một câu giải thích — không chiếm chỗ, không ai phải đi tìm tài liệu.
 *
 * Dùng `title` của trình duyệt chứ không dựng tooltip riêng: nó tự có độ trễ, tự tránh mép
 * màn hình, đọc được bằng trình đọc màn hình, và không thêm một lớp cửa sổ nổi nào nữa.
 *
 * Cột nào SẮP XẾP ĐƯỢC thì truyền `sort`. Bấm lần đầu xếp từ CAO XUỐNG THẤP — con số người
 * ta đi tìm bao giờ cũng là con số lớn nhất — bấm lại thì đảo chiều.
 */
export function Th({ children, hint, align = 'left', sort, className = '' }: {
  children: ReactNode; hint?: string; align?: 'left' | 'right' | 'center';
  sort?: { active: boolean; dir: 'asc' | 'desc'; onSort: () => void };
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const inner = (
    <>
      {children}
      {sort && (
        <span className={`ml-1 ${sort.active ? 'text-slate-200' : 'text-slate-700'}`} aria-hidden>
          {sort.active ? (sort.dir === 'desc' ? '▾' : '▴') : '⇅'}
        </span>
      )}
    </>
  );
  return (
    <th className={`th ${alignClass} ${className}`} title={hint}
      aria-sort={sort ? (sort.active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none') : undefined}>
      {sort ? (
        <button type="button" onClick={sort.onSort}
          className="appearance-none bg-transparent border-0 p-0 font-[inherit] text-[inherit] tracking-[inherit] uppercase cursor-pointer hover:text-slate-200">
          {inner}
        </button>
      ) : inner}
    </th>
  );
}

/**
 * MỘT Ô ĐIỂM KỲ THI kèm mũi tên so với lượt trước — mục 8.4.
 *
 * Ba thứ trong một ô: con số, màu đạt/chưa đạt, và chiều thay đổi. Mũi tên cố tình nhỏ và
 * nhạt hơn con số: người đọc tìm điểm trước, chiều thay đổi là thông tin thứ hai.
 *
 * "Chưa có" khác "0" và phải nhìn ra ngay — nên ô trống là một dấu gạch mờ, không phải số.
 */
export function BandCell({ cell, target }: {
  cell: { now: number | null; prev: number | null; dir: number } | null | undefined;
  target?: number | null;
}) {
  if (!cell || cell.now === null) return <span className="text-slate-700">–</span>;
  const met = target == null ? null : cell.now >= target;
  const tone = met === null ? 'text-slate-100' : met ? 'text-emerald-200' : 'text-rose-200';
  const delta = cell.prev === null ? null : Math.round((cell.now - cell.prev) * 10) / 10;
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap"
      title={cell.prev === null ? 'Lượt đầu tiên, chưa có gì để so'
        : `Lượt trước ${cell.prev} → lượt này ${cell.now}`}>
      <span className={`tabular-nums ${tone}`}>{cell.now}</span>
      {delta !== null && delta !== 0 && (
        <span className={`text-[10px] ${cell.dir > 0 ? 'text-emerald-300/70' : 'text-rose-300/70'}`}>
          {cell.dir > 0 ? '▲' : '▼'}{Math.abs(delta)}
        </span>
      )}
    </span>
  );
}

/**
 * DỰ KIẾN THI — nói đúng mức chắc chắn đang có, không nói hơn.
 *
 * Ba trạng thái và ba cách hiện khác nhau, cố ý:
 *   đã có TUẦN   → "W2 FEB 2027" in đậm như một thông tin chắc chắn
 *   mới có THÁNG → chữ thường, và độ chắc chắn nằm ở tooltip chứ không nhồi vào nhãn (mục 5.2)
 *   chưa có gì   → một nhãn xám "Chưa xác định"
 *
 * Đây là chỗ duy nhất quyết định cách nói. Màn nào tự viết lấy thì sớm muộn sẽ có một màn
 * hiện tháng thi như thể đã chốt ngày.
 */
export function ExamPlanText({ plan }: { plan?: { confidence: string; label: string } | null }) {
  /*
    CHƯA CÓ KẾ HOẠCH THI thì hiện đúng MỘT GẠCH NGANG (mục 12.3), không phải một nhãn.
    Phần lớn học viên chưa chốt ngày thi, nên một nhãn vàng ở đây sẽ nằm gần hết các hàng —
    và một cảnh báo xuất hiện ở mọi hàng thì không còn là cảnh báo.
  */
  if (!plan || plan.confidence === 'none') {
    return <span className="text-slate-600" title="Chưa có kế hoạch thi IELTS">—</span>;
  }
  if (plan.confidence === 'month') {
    return <span className="text-slate-300" title="Chưa chốt tuần thi nên chưa đếm ngược">{plan.label}</span>;
  }
  return <span className="text-slate-100 font-medium">{plan.label}</span>;
}
