import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';
import { CasePanel } from './CasePanel.tsx';

/**
 * THEO DÕI HỖ TRỢ THEO KỸ NĂNG — mục 7.11, phần giữa của hồ sơ học viên.
 *
 * Sáu dòng, không bao giờ nhiều hơn. Đây là chỗ trả lời trong MỘT cái liếc mắt ba câu mà
 * người dạy hỏi mỗi khi mở hồ sơ một em:
 *
 *   em đang ở đâu ở môn này  ·  có case không, đang thế nào  ·  đã làm gì cho em rồi
 *
 * Bấm một dòng thì dòng đó GIÃN RA TẠI CHỖ để xem cả lịch sử, không nhảy sang màn khác
 * (owner chọn phương án A3 ngày 13/09/2026). Vẫn giữ nút mở màn case đầy đủ cho ai cần làm
 * việc sâu — xem nhanh và làm việc là hai nhu cầu khác nhau, không ép chung một đường.
 *
 * Hạng mục KHÔNG có case vẫn hiện một dòng. Đó là điểm khác với danh sách case: bỏ dòng đi
 * thì "không thấy Reading" có hai nghĩa — đang ổn, hoặc chưa ai nhập điểm — và hai nghĩa ấy
 * dẫn tới hai việc khác hẳn nhau.
 */

type Row = {
  category: string; label: string; short: string;
  band: number | null; bandAttemptNo: number | null; bandWeek: string | null;
  expectation: number | null; delta: number | null; missed: boolean | null;
  state: 'none' | 'no_plan' | 'working' | 'done';
  caseId: number | null; caseTitle: string | null; caseStatus: string | null;
  carriedOver: boolean;
  sosLevel: number | null; attemptsSpanned: number; parallelCount: number;
  followUntil: string | null; followOverdue: boolean;
  outcome: string | null; outcomeLabel: string | null;
  supportLine: string | null; openActions: number;
  overdueActionDue: string | null; pendingApproval: boolean;
  points: { attemptNo: number; band: number; expectation: number | null }[];
};

/** Bốn trạng thái, bốn việc khác nhau — nên bốn nhãn khác nhau, không gộp. */
const STATE_LABEL: Record<Row['state'], string> = {
  none: 'Không có case',
  no_plan: 'Chưa có phương án',
  working: 'Đang xử lý',
  done: 'Đã kết thúc',
};
/*
 * "KHÔNG CÓ CASE" KHÔNG PHẢI LÀ "HỌC TỐT" (mục 2.2).
 *
 * Bản trước tô xanh ô này, nên một em chưa ai nhập điểm và một em điểm tốt trông giống hệt
 * nhau. Xanh là một lời khen, và ở đây hệ thống không có căn cứ nào để khen: nó chỉ biết
 * rằng chưa ai mở case. Trạng thái "chưa có tin gì" phải là màu xám trung tính — chỉ khi
 * có ĐIỂM ĐẠT KỲ VỌNG thì dòng mới được xanh, và việc đó do cột kết quả bên cạnh nói.
 *
 * Cả bốn ô đều là TRẠNG THÁI XỬ LÝ, nên dùng chung một họ nhãn (mục 2.1): xám khi chưa có
 * gì hoặc đã xong, vàng khi đang chờ ai đó ra tay, xanh dương khi đang chạy.
 */
const STATE_KIND: Record<Row['state'], 'doing' | 'waiting' | 'done' | 'idle'> = {
  none: 'idle', no_plan: 'waiting', working: 'doing', done: 'done',
};
/** Dải màu ở mép trái dòng — đọc được mức độ trước cả khi đọc chữ. */
const STATE_BAR: Record<Row['state'], string> = {
  none: 'var(--line)', no_plan: 'var(--warn)', working: 'var(--accent)', done: 'var(--line-strong)',
};

/**
 * BẢNG TÓM TẮT THEO KỸ NĂNG — CHỈ TÓM TẮT, KHÔNG MỞ CASE (mục 6.2 B).
 *
 * Trước vòng này, bấm một dòng kỹ năng sẽ giãn ra và dựng nguyên một `CasePanel` đầy đủ
 * ngay trong bảng — trong khi CHÍNH case đó lại nằm lần nữa ở khối "Các case của em" ngay
 * bên dưới. Hậu quả: cùng một case hiện hai lần trên một trang, và mở hồ sơ là tải chi tiết
 * của cả sáu hạng mục dù người xem chưa hỏi.
 *
 * Nay bảng này chỉ trả lời "kỹ năng nào đang có chuyện". Bấm một dòng thì LỌC khối case bên
 * dưới theo hạng mục đó — một case, một chỗ hiển thị.
 */
export function SkillBoard({ studentId, cycleId, selected, onPick, onReport }: {
  studentId: number;
  cycleId?: number | null;
  /** Hạng mục đang được lọc ở khối case bên dưới. */
  selected?: string | null;
  /** Bấm một dòng: lọc khối case bên dưới theo hạng mục đó (bấm lại để bỏ lọc). */
  onPick: (category: string | null) => void;
  /** Mở ô báo case mới cho đúng hạng mục này. */
  onReport?: (category: string) => void;
}) {
  const q = cycleId ? `?cycleId=${cycleId}` : '';
  const { data, loading, error, reload } = useApi<{ rows: Row[] }>(
    `/students/${studentId}/skill-board${q}`, [studentId, cycleId],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.rows.length) return <Empty title="Chưa có hạng mục nào để theo dõi" />;

  return (
    <div>
      {data.rows.map((r) => (
        <SkillRow key={r.category} row={r}
          open={selected === r.category}
          onToggle={() => onPick(selected === r.category ? null : r.category)}
          onReport={onReport} />
      ))}
    </div>
  );
}

function SkillRow({ row, open, onToggle, onReport }: {
  row: Row; open: boolean; onToggle: () => void;
  onReport?: (category: string) => void;
}) {
  const bodyId = `skill-${row.category}`;
  /*
   * Dòng KHÔNG CÓ GÌ ĐỂ MỞ thì không phải là nút bấm: một cái nút bấm vào chẳng xảy ra gì
   * là cách nhanh nhất khiến người dùng thôi tin vào mọi nút khác trên trang.
   */
  const expandable = !!row.caseId || row.band !== null;

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <button
        type="button"
        id={`${bodyId}-btn`}
        aria-expanded={open}
        aria-controls={bodyId}
        disabled={!expandable}
        onClick={onToggle}
        className={`w-full text-left appearance-none border-0 bg-transparent p-0 ${expandable ? 'cursor-pointer row-hover' : 'cursor-default'}`}
      >
        <div className="grid gap-x-3 gap-y-1 px-3 py-2.5 items-center
                        grid-cols-[1fr_auto] md:grid-cols-[minmax(8rem,1.1fr)_minmax(7rem,auto)_minmax(9rem,auto)_minmax(0,1.4fr)_1.25rem]"
             style={{ boxShadow: `inset 3px 0 0 ${STATE_BAR[row.state]}` }}>

          {/* ---------------------------------------------------------- 1. hạng mục */}
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-100">{row.label}</span>
            {/*
              Đường đi của band qua các lượt, vẽ nhỏ ngay dưới tên môn. Owner xin thêm thông
              tin vào thanh thu gọn; đây là thứ đáng thêm nhất vì nó nói được HƯỚNG ĐI —
              một con số 5.0 không phân biệt được em đang lên hay đang tụt.
            */}
            <Trend row={row} />
          </div>

          {/* ---------------------------------------------------------- 2. band gần nhất */}
          <div className="whitespace-nowrap">
            {row.band === null ? (
              <span className="text-slate-600 text-sm">—</span>
            ) : (
              <>
                <span className={`text-base font-semibold tabular-nums ${row.missed ? 'text-rose-300' : 'text-emerald-200'}`}>
                  {fmtBand(row.band)}
                </span>
                <Delta value={row.delta} />
                <span className="block text-[10px] text-slate-500">
                  {row.bandAttemptNo ? `MT${row.bandAttemptNo}` : ''}
                  {row.expectation !== null ? ` · kỳ vọng ${fmtBand(row.expectation)}` : ''}
                </span>
              </>
            )}
          </div>

          {/* ---------------------------------------------------------- 3. tình trạng */}
          <div className="whitespace-nowrap">
            <Status kind={STATE_KIND[row.state]}>{STATE_LABEL[row.state]}</Status>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              {row.carriedOver
                ? 'từ lộ trình trước'
                : row.attemptsSpanned > 1
                ? `kéo qua ${row.attemptsSpanned} lượt MT`
                : row.state === 'done' && row.outcomeLabel
                ? row.outcomeLabel
                : row.parallelCount > 1
                ? `${row.parallelCount} case song song`
                : row.caseTitle ?? ''}
            </span>
          </div>

          {/* ---------------------------------------------------------- 4. đã hỗ trợ gì */}
          <div className="min-w-0 col-span-2 md:col-span-1">
            <span className="block text-xs text-slate-300 truncate">
              {row.supportLine ?? <span className="text-slate-600">—</span>}
            </span>
            {/*
              Hai mốc hạn, hai câu khác nhau, nên không gộp một dòng:
                · hạn LÀM phương án   — 3/5/7 ngày theo mức SOS
                · hạn BÁO KẾT QUẢ case — hết tuần MT kế tiếp
            */}
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {row.overdueActionDue && (
                <span className="text-[10px] text-amber-300">⚠ quá hạn làm {fmtDate(row.overdueActionDue)}</span>
              )}
              {row.pendingApproval && <span className="text-[10px] text-sky-300">đang chờ duyệt</span>}
              {row.followUntil && row.state !== 'done' && (
                <span className={`text-[10px] ${row.followOverdue ? 'text-rose-300' : 'text-slate-500'}`}>
                  {row.followOverdue ? '⚠ quá hạn báo kết quả' : 'báo kết quả trước'} {fmtDate(row.followUntil)}
                </span>
              )}
            </span>
          </div>

          {/* ---------------------------------------------------------- 5. mũi tên */}
          <span className="hidden md:block text-slate-500 text-center select-none"
                style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .16s ease' }}>
            {expandable ? '›' : ''}
          </span>
        </div>
      </button>

      {/*
        DÒNG ĐANG CHỌN chỉ đổi màu và nói một câu — không giãn ra dựng case ở đây.
        Case của hạng mục này nằm ở khối "Các case của em" phía dưới, đã được lọc sẵn.
      */}
      {open && (
        <p id={bodyId} className="px-4 pb-3 pt-0 m-0 text-xs text-slate-400">
          {row.caseId
            ? `Đang lọc khối case bên dưới theo ${row.label}. Bấm lại dòng này để bỏ lọc.`
            : `Chưa từng có case nào ở ${row.label}.`}
          {!row.caseId && onReport && (
            <button type="button" className="btn btn-sm ml-2" onClick={() => onReport(row.category)}>
              + Case cho {row.label}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * ĐƯỜNG ĐI CỦA BAND qua các lượt, vẽ bằng chữ chứ không bằng đồ hoạ.
 *
 * Cố ý KHÔNG dùng biểu đồ: ở cỡ này một biểu đồ chỉ còn là mấy chấm không đọc được giá trị,
 * trong khi "4.5 → 5.0 → 5.0" vừa ngắn vừa nói đủ cả hướng lẫn con số. Chỉ hiện khi có từ
 * hai điểm trở lên — một điểm thì không có đường đi nào để kể.
 */
function Trend({ row }: { row: Row }) {
  const pts = row.points ?? [];
  if (!pts.length) {
    return (
      <span className="block text-[10px] text-slate-600">
        {row.category === 'behaviour' ? 'không chấm điểm' : 'chưa có điểm'}
      </span>
    );
  }
  if (pts.length === 1) {
    return (
      <span className="block text-[10px] text-slate-500">
        mới có MT{pts[0].attemptNo}{row.bandWeek ? ` · ${row.bandWeek}` : ''}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-[10px] text-slate-500 leading-tight">
      {pts.map((pt, i) => (
        <span key={pt.attemptNo} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-slate-700">→</span>}
          <span className={`tabular-nums ${
            pt.expectation !== null && pt.band < pt.expectation ? 'text-rose-300/80' : 'text-slate-400'
          }`} title={`MT${pt.attemptNo}${pt.expectation !== null ? ` · kỳ vọng ${fmtBand(pt.expectation)}` : ''}`}>
            {fmtBand(pt.band)}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Chênh lệch so với LƯỢT TRƯỚC. Không phải so với kỳ vọng — hai câu hỏi khác nhau. */
function Delta({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <span className="text-[11px] ml-1 text-slate-600">{value === 0 ? '–' : ''}</span>;
  }
  return (
    <span className={`text-[11px] ml-1 ${value > 0 ? 'text-emerald-300' : 'text-rose-300'}`}
          title={`So với lượt trước: ${value > 0 ? '+' : ''}${value}`}>
      {value > 0 ? '▲' : '▼'}
    </span>
  );
}

export { STATE_LABEL as SKILL_STATE_LABEL };
export type { Row as SkillBoardRow };
