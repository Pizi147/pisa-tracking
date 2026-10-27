import { Fragment, useId, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GIAI_THICH_KCK, KCK, chuTrangThai, loaiHoSo, trangCha, type TrangThai } from '@shared/domain/index.ts';
import { fmtBand } from '../lib/format.ts';
import { laCauLoi403, laCauLoi404 } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';
import { useChongVe, useVe } from '../lib/quayLai.ts';
import { BaoOTrongNhan, coOTuNhan } from './ONgay.tsx';
import { useNoiLoi } from './loiForm.tsx';
import { CHIP_TRON, CHIP_VUONG, lopSos } from './Nhan.tsx';
import { t } from '@shared/i18n/index.ts';

export function Card({ title, action, children, className = '', bodyClass = 'p-4' }: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
          {/* OV-11i (P2-4): không có tiêu đề thì không vẽ <h2> rỗng (trình đọc màn hình đọc "heading, trống"). */}
          {/* D4 bổ sung: tiêu đề khối 17 / 700 chữ chính như mockup V5 (`h-khoi`), thay 14 / 600 chữ phụ — tầng rõ hơn, ít chữ đậm cùng cỡ. */}
          {title ? <h2 className="h-khoi text-lg font-bold text-slate-100">{title}</h2> : <span />}
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'muted';
/** `late`: quá hạn (cam, PR-YT4 K1-17). Mức SOS KHÔNG đi qua `<Level>` — dùng `<ChipSos>` (OV-15a, một component). */
export type LevelTone = Tone | 'late';

/**
 * MÀU ĐIỂM — MỘT BẢNG DUY NHẤT (HE_GIAO_DIEN §2, chốt 17/09; màu đọc từ token N-1 ở `index.css`).
 *
 *   rose     dưới kỳ vọng     — điểm tăng mà vẫn dưới kỳ vọng VẪN ĐỎ
 *   sky      bằng kỳ vọng
 *   emerald  vượt kỳ vọng / Đạt — xanh lá chỉ dành cho kết quả học tập
 *   slate    thiếu dữ liệu    — khác điểm 0, khác ô trống
 *   sos1/2/3 mức SOS          — OV-15a: chỉ viền vàng · cam · đỏ (dày 1 / 1,5 / 2,5 px), cùng lớp với `<ChipSos>` (`lopSos`)
 *   tam      tạm thời / chưa đủ điểm — xám, viền đứt
 *
 * Trước đây bảng này được chép ở `SkillBoard.tsx`, và mỗi component mới sẽ tự chép thêm một
 * bản với sắc hơi khác. Nay `SkillBoard`, `KetQuaDot` và mọi ô điểm về sau đọc từ đây.
 *
 * CHIP CÓ NỀN thay vì chữ màu trơn: chữ màu trơn trên nền tối tương phản yếu (yêu cầu riêng của
 * chủ sản phẩm). Nền sẫm đặc + chữ màu + viền cùng họ — cùng kiểu với `Status`/`Alert`.
 */
export type ScoreTone = 'rose' | 'sky' | 'emerald' | 'slate' | 'sos1' | 'sos2' | 'sos3' | 'tam';
export const SCORE_CHIP: Record<ScoreTone, string> = {
  /* NEN-V5 (badge nhóm 1): viền màu nghĩa trên nền thẻ — cùng họ với SOS (C23). */
  rose: 'bg-[color:var(--surface)] text-bad border-bad-line',
  sky: 'bg-[color:var(--surface)] text-doing border-doing-line',
  emerald: 'bg-[color:var(--surface)] text-dat border-dat-line',
  slate: 'bg-[color:var(--surface)] text-muted border-muted-line',
  sos1: lopSos(1),
  sos2: lopSos(2),
  sos3: lopSos(3),
  tam: 'bg-transparent text-muted border-dashed border-muted-line',
};
/** Chữ trơn cùng họ màu — cho dòng phụ ngắn cạnh số điểm (không phải chip). */
export const SCORE_TEXT: Record<ScoreTone, string> = {
  rose: 'text-bad', sky: 'text-doing', emerald: 'text-dat', slate: 'text-faint',
  sos1: 'text-sos1-chu', sos2: 'text-sos2-chu', sos3: 'text-sos3-chu', tam: 'text-muted',
};

/**
 * SÁU HỌ NHÃN, PHÂN BIỆT BẰNG HÌNH DẠNG TRƯỚC, MÀU SAU (mục 2.1).
 *
 * Trước vòng 5 gần như mọi thứ dùng chung một kiểu `Pill`: mức SOS của một đứa trẻ, việc
 * mình phải làm, kết quả sau hỗ trợ, và mấy chữ chỉ để biết như "GVCN" hay "L R" — tất cả
 * cùng viền, cùng bo góc, cùng cỡ chữ, màu thì mỗi màn tự chọn. Mắt không tách được cái nào
 * ra cái nào, nên nhìn một dòng lớp chỉ thấy một đám nhãn màu.
 *
 *   <Level>   pill nền sẫm, bo tròn hẳn — mức SOS, mức độ ưu tiên: tình trạng của một đứa trẻ
 *   <Status>  nền nhẹ + biểu tượng      — TRẠNG THÁI CÔNG VIỆC: đang làm · chờ · xong
 *   <Task>    viền vuông, gạch dọc trái — VIỆC PHẢI LÀM, bấm được
 *   <Alert>   nền sẫm + màu mạnh, ⚠ chỉ khi quá hạn — mức khẩn, thiếu thông tin
 *   <Outcome> biểu tượng kết quả        — KẾT QUẢ học tập: tiến bộ · chưa đổi · kém hơn
 *   <Info>    chữ mờ, viền mảnh         — chỉ để biết: vai trò, kỹ năng, mã lớp
 *
 * HAI LUẬT MÀU KHÔNG ĐƯỢC PHÁ (mục 2.2):
 *
 *   · XANH LÁ CHỈ DÀNH CHO KẾT QUẢ (`<Outcome>`, Đạt, mức SOS 0). Xanh lá là một lời khen, và chỉ
 *     kết quả học tập mới có căn cứ để khen. "Đã lưu", "đã kết thúc phương án", "không có Case" đều
 *     KHÔNG phải là tin tốt — chúng chỉ là việc đã xong (xám `done`) hoặc chưa có tin gì. Bảng màu
 *     cuối = mockup 18 (b4): việc xong là xám, xanh lá dành cho kết quả.
 *   · MÀU KHÔNG BAO GIỜ ĐỨNG MỘT MÌNH. Mỗi họ có hình dạng và biểu tượng riêng, nên người
 *     không phân biệt được màu vẫn đọc ra nghĩa.
 *
 * Thứ tự nặng nhẹ về thị giác đi đúng theo mức độ đáng chú ý:
 * tình trạng học viên > cảnh báo > việc phải làm > kết quả > trạng thái > thông tin nền.
 */

/** Pill nền sẫm cùng họ màu + chữ màu (token N-1); `muted` = viền đứt (số tạm / chưa đủ). */
const LEVEL_CLASS: Record<LevelTone, string> = {
  ok: 'bg-ok-bg text-ok',
  info: 'bg-doing-bg text-doing',
  warn: 'bg-soon-bg text-soon',
  danger: 'bg-bad-bg text-bad',
  neutral: 'bg-muted-bg text-muted',
  muted: 'bg-transparent text-muted border border-dashed border-muted-line',
  late: 'bg-late-bg text-late',
};

/**
 * MỨC ĐỘ của một học viên — SOS 1/2/3, hay mức độ ưu tiên do giáo viên nhận định.
 * Nặng nhất về thị giác vì đây là tình trạng của một đứa trẻ, không phải một con số vận hành.
 */
export function Level({ tone = 'neutral', children, title, dut }: { tone?: LevelTone; children: ReactNode; title?: string;
  /** PR-N1 A2: số TẠM THỜI — giữ màu chữ của mức, nền trong, viền nét đứt. */
  dut?: boolean;
}) {
  const lop = dut
    ? `border-dashed !border-current bg-transparent ${LEVEL_CLASS[tone].split(' ').filter((c) => c.startsWith('text-')).join(' ')}`
    : LEVEL_CLASS[tone];
  return (
    <span title={title}
      className={`${CHIP_TRON} gap-1 ${lop}`}>
      {children}
    </span>
  );
}

const TASK_CLASS: Record<Tone, { box: string; bar: string }> = {
  neutral: { box: 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]', bar: 'bg-[color:var(--accent)]' },
  info: { box: 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]', bar: 'bg-[color:var(--accent)]' },
  warn: { box: 'border-soon-line bg-soon-bg text-soon', bar: 'bg-soon' },
  danger: { box: 'border-late-line bg-late-bg text-late', bar: 'bg-late' },
  ok: { box: 'border-muted-line bg-transparent text-faint', bar: 'bg-faint/50' },
  muted: { box: 'border-muted-line bg-transparent text-faint', bar: 'bg-faint/50' },
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
      <span className="pr-1.5">{children}</span>
    </>
  );
  const cls = `${CHIP_VUONG} !items-stretch !pl-0 gap-1.5 overflow-hidden ${c.box}`;
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
      className={`${CHIP_VUONG} gap-1 ${
        pending ? 'border-dashed border-muted-line text-faint' : 'border-muted-line text-dim'
      }`}>
      {children}
    </span>
  );
}

/**
 * TRẠNG THÁI XỬ LÝ — một việc đang ở đâu trong quy trình (mục 2.1).
 *
 * Nền sẫm, có biểu tượng, và CỐ Ý KHÔNG BAO GIỜ MÀU XANH LÁ. "Đã hoàn thành" là một trạng
 * thái công việc, không phải một kết quả tốt: một phương án hoàn thành với kết quả "Kém hơn"
 * mà hiện màu xanh là nói dối người đọc. Kết quả có họ nhãn riêng ở ngay bên dưới.
 *
 *   trung tính  đang thực hiện (Q14: xanh dương chỉ dành cho ô điểm)
 *   vàng        đang chờ (chờ duyệt, chờ tới hạn)
 *   xám         đã hoàn thành; viền đứt = chưa bắt đầu
 */
const STATUS_MARK: Record<'doing' | 'waiting' | 'done' | 'idle', string> = {
  doing: '▶', waiting: '◷', done: '✓', idle: '·',
};
const STATUS_CLASS: Record<'doing' | 'waiting' | 'done' | 'idle', string> = {
  doing: 'bg-white/[.06] text-slate-200 border-transparent',
  waiting: 'bg-soon-bg text-soon border-soon-line',
  done: 'bg-done-bg text-done border-done-line',
  idle: 'bg-transparent text-faint border-dashed border-muted-line',
};
export function Status({ kind, children, title }: {
  kind: 'doing' | 'waiting' | 'done' | 'idle'; children: ReactNode; title?: string;
}) {
  return (
    <span title={title}
      className={`${CHIP_VUONG} gap-1 ${STATUS_CLASS[kind]}`}>
      <span aria-hidden className="opacity-70">{STATUS_MARK[kind]}</span>
      {children}
    </span>
  );
}

/**
 * CẢNH BÁO — mức khẩn, thiếu thông tin (mục 2.1; PR-UX0 B-4).
 *
 * ⚠ CHỈ NGHĨA QUÁ HẠN (G-4). Nhắc mềm, lưu lỗi, dữ liệu demo, mức khẩn thì KHÔNG có ⚠ — màu đủ nói.
 * Chữ bắt đầu "Quá hạn" tự có ⚠ (chỗ cũ như `CasePanel` không phải sửa); chỗ khác truyền `quaHan`
 * để ép bật/tắt. Quá hạn dùng màu `late` (đỏ cam), khác `bad` của SOS 3 / Chưa đạt.
 */
export function Alert({ tone = 'danger', children, title, quaHan }: {
  tone?: 'danger' | 'warn'; children: ReactNode; title?: string; quaHan?: boolean;
}) {
  const coDau = quaHan ?? (typeof children === 'string' && /^(quá hạn|overdue|\d+ days? overdue)/i.test(children));
  return (
    <span title={title}
      className={`${CHIP_VUONG} gap-1 ${
        tone === 'danger'
          ? 'bg-late-bg text-late border-late-line'
          : 'bg-soon-bg text-soon border-soon-line'
      }`}>
      {coDau && <span aria-hidden>⚠</span>}
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
 * Cùng `Level` Đạt và `SCORE_CHIP.emerald`, đây là chỗ được dùng màu xanh lá. Xanh lá ở chỗ khác
 * là một lời khen không ai kiểm chứng.
 */
const OUTCOME_CLASS: Record<string, string> = {
  ok: 'bg-[color:var(--surface)] text-ok border-ok-line',
  warn: 'bg-[color:var(--surface)] text-soon border-soon-line',
  danger: 'bg-[color:var(--surface)] text-bad border-bad-line',
  muted: 'bg-transparent text-dim border-muted-line',
};
export function Outcome({ tone, mark, children, title }: {
  tone: 'ok' | 'warn' | 'danger' | 'muted'; mark?: string; children: ReactNode; title?: string;
}) {
  return (
    <span title={title}
      className={`${CHIP_VUONG} gap-1 ${OUTCOME_CLASS[tone]}`}>
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
  const { pathname } = useLocation();
  const session = useSession()?.session;   // khung lỗi có thể vẽ ngoài SessionProvider
  const k403 = laCauLoi403(message), k404 = !k403 && laCauLoi404(message);
  /* UI-CON-LAI k6: nói loại lỗi + đường khác. 404 hồ sơ HV → tìm trong lưu trữ; 403 hồ sơ GV người khác → hồ sơ của chính mình (nếu là GV). */
  const hsHv = k404 && /^\/hoc-vien\/\d+$/.test(pathname);
  const hsGvToi = k403 && /^\/giao-vien\/\d+$/.test(pathname) && session?.user && session.roles?.includes('teacher') ? `/giao-vien/${session.user.id}` : null;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
      {(k403 || k404) && <span className="text-[12px] font-semibold text-slate-500">{k403 ? t('Không có quyền') : t('Không thấy')}</span>}
      <div className={`${k403 || k404 ? 'text-slate-100' : 'text-bad'} font-medium`}>{message}</div>
      {hint && <p className="text-slate-400 text-xs max-w-md">{hint}</p>}
      {hsHv && <p className="m-0 text-xs text-slate-400">{t('Đường dẫn có thể cũ.')} <Link className="link" to="/hoc-vien/luu-tru">{t('Tìm trong HV lưu trữ ›')}</Link></p>}
      {hsGvToi && <Link className="link text-sm" to={hsGvToi}>{t('Hồ sơ của tôi ›')}</Link>}
      {/* OV-11i (HL-15 · PT-11 · TQ-16): 403 / 404 thử lại vẫn vậy — nút về nguồn / trang cha thay "Thử lại". */}
      {k403 || k404 ? <NutVeCha /> : onRetry && <button className="btn btn-sm mt-2" onClick={onRetry}>{t('Thử lại')}</button>}
    </div>
  );
}

/** Nút về của khung lỗi 403: nguồn đầu của chồng Quay lại (OV-5b), không có thì trang cha của hồ sơ (`trangCha`), còn lại Tổng quan. */
function NutVeCha() {
  const { pathname } = useLocation();
  const chong = useChongVe();
  const ve = useVe();
  const hs = loaiHoSo(pathname);
  const dich = chong[0] ?? (hs ? trangCha(hs) : { url: '/', ten: t('Tổng quan') });
  if (dich.url === pathname) return null;
  return <button type="button" className="btn btn-sm mt-2" onClick={() => ve(dich.url, !chong.length)}><span aria-hidden>‹</span> {dich.ten}</button>;
}

export function Forbidden({ message, hint }: { message?: string; hint?: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-soon font-medium">{message ?? t('Bạn không có quyền xem nội dung này')}</div>
      <p className="text-slate-400 text-xs mt-1 max-w-lg mx-auto">{hint ?? t('Quyền được xác định theo vai trò, phạm vi và phân công của tài khoản đang dùng.')}</p>
    </div>
  );
}

export function Skeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-label={t('Đang tải')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel h-8 w-full" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

/**
 * Ô CHỈ SỐ V5 (NEN-V5, thay KpiTile; `bang-mau.html` mục 6): tên 13 · số lớn 28 / 700 (chữ số Inter) · dòng mẫu số 12 ngay dưới.
 * Mẫu 0 → `giaTri` là chữ "Chưa có dữ liệu" (T19), không vẽ "0 %". Số bấm được = `OSo` / `TyLe` bên trong.
 */
export function OChiSo({ ten, giaTri, mau, className = '', children }: {
  ten: ReactNode; giaTri: ReactNode; mau?: ReactNode; className?: string; children?: ReactNode;
}) {
  return (
    <div className={`card flex h-full flex-col gap-0.5 px-4 py-3.5 ${className}`}>
      <div className="text-[13px] font-medium text-slate-400">{ten}</div>
      <div className="text-2xl font-bold tabular-nums text-slate-100">{giaTri}</div>
      {mau && <div className="text-xs text-slate-500">{mau}</div>}
      {children}
    </div>
  );
}

/** NEN-V5 (P2, chủ SP 22/10): NHÃN ≠ GIÁ TRỊ — nhãn 13 xám, giá trị đậm. Một kiểu cho mọi khối "Nhãn  giá trị" (panel, đầu hồ sơ). */
export const LOP_NHAN = 'text-[13px] font-medium text-slate-500';
export const LOP_GIA_TRI = 'font-semibold text-slate-100';
export function NhanGiaTri({ hang, className = '' }: { hang: ReadonlyArray<readonly [ReactNode, ReactNode]>; className?: string }) {
  return (
    <dl className={`m-0 grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5 ${className}`}>
      {hang.map(([nhan, gt], i) => <Fragment key={i}><dt className={LOP_NHAN}>{nhan}</dt><dd className={`m-0 min-w-0 ${LOP_GIA_TRI}`}>{gt}</dd></Fragment>)}
    </dl>
  );
}

/**
 * Một nhãn + một ô. Mặc định bọc bằng `<label>` để bấm vào chữ là vào ô.
 *
 * ĐIỀU KHIỂN GỒM NHIỀU NÚT (bộ chọn tuần) thì truyền `as="div"`: `<label>` bọc nhiều nút sẽ
 * chuyển cú bấm vào chữ sang nút ĐẦU TIÊN — với bộ chọn tuần đó là "Tuần trước", nên bấm vào
 * nhãn thì tuần nhảy lùi.
 */
export function Field({ label, children, hint, required, loi, as = 'label' }: {
  label: string; children: ReactNode; hint?: string; required?: boolean; as?: 'label' | 'div';
  /** Lý do lỗi dưới ô (`useLoiForm().loiCua`) — viền ô đỏ như `Truong`. */
  loi?: string | null;
}) {
  /* Ô ngày bên trong báo id → nhãn không bọc nút lịch (`BaoOTrongNhan`, như `Truong`). Thẻ khung chỉ theo props (không dựng lại ô). */
  const [idO, setIdO] = useState<string | null>(null);
  const Wrap = as === 'div' || coOTuNhan(children) ? 'div' : 'label';
  const idNhan = useId();
  const troO = Wrap === 'div' ? idO : null;
  const nhom = Wrap === 'div' && !idO ? { role: 'group', 'aria-labelledby': idNhan } : {};
  const chu = <>{label}{required && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></>}</>;
  const noi = useNoiLoi(loi);
  return (
    <BaoOTrongNhan.Provider value={setIdO}>
      <Wrap className="block" {...nhom}>
        {troO ? <label htmlFor={troO} className="label">{chu}</label> : <span id={idNhan} className="label">{chu}</span>}
        {/* Luôn cùng một lớp bọc (như `Truong`): bọc/bỏ bọc theo `loi` làm ô dựng lại → mất focus khi đang gõ. */}
        <div ref={noi.ref} className={loi ? 'contents [&_.field]:border-late [&_.field]:ring-1 [&_.field]:ring-late/40' : 'contents'}>{children}</div>
        {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
        {loi && <span id={noi.id} className="mt-1 block text-xs text-late">{loi}</span>}
      </Wrap>
    </BaoOTrongNhan.Provider>
  );
}

/**
 * Ghi chú giải thích dưới một khu vực.
 *
 * Dùng `<div>` chứ không phải `<p>`: có chỗ ghi chú cần một danh sách bên trong — ví dụ
 * "chưa hoàn thành Case được vì còn ba việc" — và một danh sách nằm trong thẻ đoạn văn là
 * HTML sai, trình duyệt sẽ tự tách thẻ ra và làm hỏng đúng cái khung viền bên trái này.
 */
/** PR-EN: câu đã dịch có đoạn `<b>…</b>` (thứ tự chữ đậm khác nhau giữa hai tiếng) → chữ thường + `<strong>`. Chỉ nhận `<b>`, không HTML khác. */
export function ChuDam({ chu }: { chu: string }) {
  return <>{chu.split(/<b>(.*?)<\/b>/).map((x, i) => (i % 2 ? <strong key={i}>{x}</strong> : x))}</>;
}

export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs text-slate-500 leading-relaxed border-l-2 border-slate-700 pl-2">{children}</div>
  );
}

/** DẢI CHỈ XEM (PR-LT, Q22) — lớp đã kết thúc / học viên đã lưu trữ: không nút, không ⋮ thao tác. */
export function DaiChiXem({ children }: { children: ReactNode }) {
  return <div className="surface-2 rounded-md px-3 py-1.5 text-xs text-slate-400">{children}</div>;
}

export function DataCell({ value, state, suffix }: { value: ReactNode; state?: string; suffix?: string }) {
  if (state === 'not_applicable') return <span className="text-slate-500 text-xs italic">{t('Không áp dụng')}</span>;
  if (value === null || value === undefined) return <span className="text-slate-500 text-xs">{t('Chưa có dữ liệu')}</span>;
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
          className="appearance-none bg-transparent border-0 p-0 font-[inherit] text-[inherit]  cursor-pointer hover:text-slate-200">
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
  const tone = met === null ? 'text-slate-100' : met ? 'text-ok' : 'text-bad';
  const delta = cell.prev === null ? null : Math.round((cell.now - cell.prev) * 10) / 10;
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap"
      title={cell.prev === null ? t('Lượt đầu tiên, chưa có gì để so')
        : t('Lượt trước {truoc} → lượt này {nay}', { truoc: cell.prev, nay: cell.now })}>
      <span className={`tabular-nums ${tone}`}>{cell.now}</span>
      {delta !== null && delta !== 0 && (
        <span className={`text-[12px] ${cell.dir > 0 ? 'text-ok' : 'text-bad'}`}>
          {cell.dir > 0 ? '▲' : '▼'}{Math.abs(delta)}
        </span>
      )}
    </span>
  );
}

/**
 * TARGET của lộ trình (Q29-1, PR-KCK; OV-9: KCK là DẤU RIÊNG, Target giữ): "6.5 · KCK" · "— · KCK" (KCK chưa có Target) · "6.5" · "—". Chữ KCK gạch
 * chấm mờ báo có giải thích khi rê chuột. Mọi màn hiện target dùng chung.
 */
export function TargetText({ band, kck, kyThi }: { band: number | null | undefined; kck?: boolean | null;
  /** P13 KET-PET: khoá có kỳ thi Cambridge — Target là số nguyên trong thang, không KCK, không định dạng band. */
  kyThi?: { ten: string; min: number; max: number } | null }) {
  if (kyThi) return <span title={`${kyThi.ten} ${kyThi.min}–${kyThi.max}`}>{band == null ? '—' : String(band)}</span>;
  if (!kck) return <>{fmtBand(band)}</>;
  return (
    <>{fmtBand(band)} · <abbr title={GIAI_THICH_KCK} aria-label={`${KCK}: ${GIAI_THICH_KCK}`}
      className="cursor-help underline decoration-dotted decoration-slate-500 underline-offset-2">{KCK}</abbr></>
  );
}

/** OV-9: ô tích "KCK" cạnh ô Target (mẫu ô tích "Không thi") — dấu riêng, Target vẫn nhập như thường. */
export function OKck({ chon, onChange, disabled }: { chon: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 text-[13px] text-slate-300 sm:min-h-0" title={GIAI_THICH_KCK}>
      <input type="checkbox" className="h-4 w-4" checked={chon} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /> {KCK}
    </label>
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
    return <span className="text-slate-500" title={t('Chưa có kế hoạch thi IELTS')}>—</span>;
  }
  if (plan.confidence === 'month') {
    return <span className="text-slate-300" title={t('Chưa chốt tuần thi nên chưa đếm ngược')}>{plan.label}</span>;
  }
  return <span className="text-slate-100 font-medium">{plan.label}</span>;
}

/** ĐANG CHỌN (UX-B B3, HE §2 "Đang chọn"): viền nhấn + nền nhấn nhạt + ✓ nhỏ (OV-15a, bỏ teal) + aria-pressed — KHÁC nút chính (xanh đặc = Lưu).
 * PR-KHUNG G2: nút CHỌN được xuống dòng (`.btn` nowrap chỉ cho nút thao tác); ✓ chỉ vẽ ở nút đang chọn — không chừa chỗ trống làm chữ tràn viền. */
/* `!`: `.btn:hover:not(:disabled)` (index.css) mạnh hơn lớp Tailwind thường — không có `!` thì rê chuột là mất kiểu đang chọn. */
export const CHON = '!border-[color:var(--accent)] !bg-[color:var(--accent-soft)] text-slate-100';
type NutChonProps = {
  chon: boolean; onClick: () => void; children: ReactNode; nho?: boolean; className?: string; disabled?: boolean; title?: string;
  /** Dấu góc khi đang chọn — mặc định ✓; OV-12b: số thứ tự chọn (chip nhóm nguyên nhân, 1 = chính). */
  dau?: ReactNode;
};
export function NutChon({ chon, onClick, children, nho, className = '', disabled, title, dau = '✓' }: NutChonProps) {
  return (
    <button type="button" aria-pressed={chon} onClick={onClick} disabled={disabled} title={title}
      className={`btn ${nho ? 'btn-sm' : ''} relative min-h-[44px] min-w-0 gap-1 whitespace-normal text-center leading-tight sm:min-h-0 ${chon ? CHON : ''} ${className}`}>
      {chon && <span aria-hidden className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-md border border-[color:var(--accent)] bg-[color:var(--surface)] text-[12px] leading-none tabular-nums text-[color:var(--accent-strong)]">{dau}</span>}{children}
    </button>
  );
}

/** BỘ LỌC NÚT ĐOẠN (UX-E E6): một kiểu cho mọi bộ lọc; tab trang vẫn là `HangTab` gạch chân. */
type BoLocDoanProps<K extends string> = {
  muc: { key: K; nhan: string; so?: number | string | null; title?: string }[]; value: K; onChange: (k: K) => void; ariaLabel: string;
  /** VIEC-NHO-2: nhóm giữ chỗ nhưng tắt (mờ 40 %, không bấm, không nút nào chọn) — chữ là lý do khi rê chuột. */
  tat?: string;
};
export function BoLocDoan<K extends string>({ muc, value, onChange, ariaLabel, tat }: BoLocDoanProps<K>) {
  /* OV-14b (rà UX 17/10, thay PR-KHUNG G5 vuốt ngang): điện thoại nút đoạn XUỐNG DÒNG — mỗi nút một viền như hàng chip, không nút nào bị cắt. */
  return (
    <div className="inline-flex max-w-full sm:overflow-x-auto">
    <div role="group" aria-label={ariaLabel} aria-disabled={tat ? true : undefined} title={tat}
      className={`inline-flex shrink-0 rounded-lg border max-sm:shrink max-sm:flex-wrap max-sm:gap-1.5 max-sm:border-0 ${tat ? 'opacity-40' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
      {muc.map((m, i) => {
        const chon = !tat && m.key === value;
        return (
          <button key={m.key} type="button" aria-pressed={chon} title={tat ? undefined : m.title} disabled={!!tat} onClick={() => onChange(m.key)} style={{ borderColor: 'var(--line)' }}
            className={`inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap px-3 text-xs font-semibold disabled:pointer-events-none max-sm:rounded-lg max-sm:border sm:min-h-[32px] ${i ? 'sm:border-l' : ''} ${
              chon ? 'bg-[color:var(--accent-soft)] text-slate-100 shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
            <span aria-hidden className={`text-[12px] text-[color:var(--accent-strong)] ${chon ? '' : 'invisible'}`}>✓</span>{m.nhan}
            {m.so != null && <span className="tabular-nums text-slate-500">{m.so}</span>}
          </button>
        );
      })}
    </div>
    </div>
  );
}

/** NHÃN TRẠNG THÁI CHÍNH (§7.3, brainstorm C.2) — một dòng một nhãn; màu điểm/SOS không dùng ở đây. */
const NHAN_LOP: Record<TrangThai, string> = {
  'can-lam': 'border-[color:var(--line-strong)] text-slate-200', 'dang-lam': 'border-transparent bg-white/[.06] text-slate-200',
  'cho-duyet': 'border-muted-line bg-muted-bg text-muted', 'qua-han': 'border-transparent !px-0 font-bold text-late',   // OV-15a: quá hạn chỉ chữ cam + ⚠, không chip
  xong: 'border-transparent text-done', 'da-huy': 'border-transparent text-slate-500 line-through decoration-1',
};
export function NhanTrangThai({ t, soNgay, title, chu }: {
  t: TrangThai; soNgay?: number | null; title?: string;
  /** Chữ riêng của một loại việc (Vận hành: THUAT_NGU C-069…C-073) — kiểu nhãn vẫn theo `t`. */
  chu?: string;
}) {
  const chuHien = chu ?? chuTrangThai(t, soNgay);
  return <span title={title} className={`${CHIP_VUONG} ${NHAN_LOP[t]}`}>
    {t === 'qua-han' && !chuHien.includes('⚠') ? `⚠ ${chuHien}` : chuHien}</span>;
}
