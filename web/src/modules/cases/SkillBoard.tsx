import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';
import { CasePanel } from './CasePanel.tsx';
import { ProgressChart } from '../students/ProgressChart.tsx';

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
  points: {
    attemptNo: number; band: number; expectation: number | null;
    score: number | null; total: number | null; passed: boolean | null;
  }[];
  /** Lớp Normal chấm ĐIỂM ĐẠT trên TỔNG của chính đề đó, không có band IELTS. */
  score: number | null; total: number | null; ratio: boolean;
  /** Tín hiệu chưa ai xác minh ở chính kỹ năng này — KHÔNG phải một case (mục 4.2). */
  signal: {
    id: number; skill: string | null; band: number | null; expectation: number | null;
    verifyDue: string | null; overdue: boolean; ownerName: string | null;
  } | null;
  /** ĐỦ các case của kỹ năng này, đang mở trước (mục 4.2). */
  cases: {
    id: number; title: string; status: string; track: string;
    urgency: string | null; sosLevel: number | null;
    carriedOver: boolean; parallel: boolean;
    openedOn: string | null; touchedOn: string | null;
  }[];
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
 * TIẾN ĐỘ VÀ HỖ TRỢ THEO KỸ NĂNG — khối chính của hồ sơ học viên (mục 4.2).
 *
 * Mỗi hàng trả lời bốn câu, đúng thứ tự người dạy hỏi:
 *
 *   kỹ năng  ·  kết quả gần nhất  ·  vấn đề đang theo dõi  ·  hỗ trợ, kết quả và việc tiếp theo
 *
 * BẤM MỘT HÀNG THÌ MỞ NỘI DUNG NGAY BÊN DƯỚI hàng đó: biểu đồ của chính kỹ năng ấy, các
 * case đang mở, và lịch sử đã kết thúc thu gọn.
 *
 * Vòng trước bấm một hàng chỉ LỌC một khối case nằm tách ở dưới trang. Nghe thì gọn, nhưng
 * thực tế là: bấm xong không thấy gì đổi ở chỗ mình đang nhìn, phải cuộn xuống tìm — và cái
 * khối ở dưới ấy lại kể lại đúng những case mà bảng này vừa tóm tắt. Mục 4.2 gọi đúng tên
 * hai lỗi đó: "không chỉ thêm bộ lọc rồi bắt cuộn tìm ở một khối khác" và "bỏ danh sách
 * case thứ hai bị lặp dưới bảng". Nên khối kia đã bỏ, và nội dung về đúng chỗ nó thuộc về.
 *
 * MỘT KỸ NĂNG CÓ NHIỀU CASE THÌ THẤY ĐỦ. Em có hai case Reading song song thì cả hai đều có
 * khối riêng, mở đóng độc lập — mở cái này không đóng cái kia.
 *
 * KỸ NĂNG KHÔNG CÓ CASE VẪN CÓ HÀNG, và vẫn xem được điểm với lịch sử. Bỏ hàng đi thì
 * "không thấy Reading" có hai nghĩa — đang ổn, hoặc chưa ai nhập điểm — và hai nghĩa ấy dẫn
 * tới hai việc khác hẳn nhau.
 */
export function SkillBoard({ studentId, cycleId, selected, onPick, onReport, progress, onOpenCase }: {
  studentId: number;
  cycleId?: number | null;
  /** Hàng đang mở. */
  selected?: string | null;
  /** Bấm một hàng: mở nội dung ngay dưới hàng đó (bấm lại để đóng). */
  onPick: (category: string | null) => void;
  /** Mở ô báo case mới cho đúng hạng mục này. */
  onReport?: (category: string) => void;
  /** Dữ liệu biểu đồ của cả hồ sơ; hàng nào mở thì vẽ đúng kỹ năng của hàng đó. */
  progress?: { mode: 'ielts' | 'ratio'; skills: any[] } | null;
  /** Mở trang case đầy đủ. */
  onOpenCase?: (caseId: number) => void;
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
          onReport={onReport}
          progress={progress}
          onOpenCase={onOpenCase}
          onChanged={reload} />
      ))}
    </div>
  );
}

function SkillRow({ row, open, onToggle, onReport, progress, onOpenCase, onChanged }: {
  row: Row; open: boolean; onToggle: () => void;
  onReport?: (category: string) => void;
  progress?: { mode: 'ielts' | 'ratio'; skills: any[] } | null;
  onOpenCase?: (caseId: number) => void;
  onChanged?: () => void;
}) {
  const bodyId = `skill-${row.category}`;
  /*
   * Hàng KHÔNG CÓ GÌ ĐỂ MỞ thì không phải là nút bấm: một cái nút bấm vào chẳng xảy ra gì
   * là cách nhanh nhất khiến người dùng thôi tin vào mọi nút khác trên trang.
   */
  const expandable = row.cases.length > 0 || row.band !== null || !!row.signal;

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

          {/* ------------------------------------------ 2. kết quả gần nhất (mục 4.2) */}
          {/*
            HAI CHƯƠNG TRÌNH, HAI CÁCH GHI. Fast Track ghi band IELTS và kỳ vọng của chính
            lượt đó; lớp Normal ghi ĐIỂM ĐẠT trên TỔNG của đề đó — "21/40", không phải một
            band. Quy điểm Normal về band là bịa ra một con số không tồn tại.
          */}
          <div className="whitespace-nowrap">
            {row.band === null ? (
              <span className="text-slate-600 text-sm">—</span>
            ) : (
              <>
                <span className={`text-base font-semibold tabular-nums ${row.missed ? 'text-rose-300' : 'text-emerald-200'}`}>
                  {row.ratio && row.total ? `${row.score}/${row.total}` : fmtBand(row.band)}
                </span>
                {!row.ratio && <Delta value={row.delta} />}
                <span className="block text-[10px] text-slate-500">
                  {row.bandAttemptNo ? (row.ratio ? row.bandWeek ?? '' : `MT${row.bandAttemptNo}`) : ''}
                  {row.ratio
                    ? (row.missed === false ? ' · đạt' : row.missed === true ? ' · chưa đạt' : '')
                    : row.expectation !== null ? ` · kỳ vọng ${fmtBand(row.expectation)}` : ''}
                </span>
              </>
            )}
          </div>

          {/* ------------------------------------------- 3. vấn đề đang theo dõi (mục 4.2) */}
          {/*
            TÊN VẤN ĐỀ ĐỨNG TRƯỚC, trạng thái là chữ nhỏ bên dưới. Bản trước làm ngược lại —
            nhãn "Đang xử lý" to, tên case bé xíu — nên liếc qua sáu hàng chỉ đọc được sáu
            lần chữ "Đang xử lý", đúng thứ không cần đọc.

            TÍN HIỆU CHƯA XÁC MINH cũng thuộc cột này: nó chưa là case, nhưng nó đúng là
            "vấn đề đang theo dõi", và nó là việc gấp nhất trong cột.
          */}
          <div className="min-w-0">
            {row.signal ? (
              <>
                <span className={`block text-xs font-medium truncate ${row.signal.overdue ? 'text-rose-200' : 'text-amber-200'}`}>
                  Tín hiệu chờ xác minh
                </span>
                <span className="block text-[10px] text-slate-500">
                  {row.signal.overdue ? '⚠ quá hạn ' : 'hạn '}{fmtDate(row.signal.verifyDue)}
                  {row.signal.ownerName ? ` · ${row.signal.ownerName}` : ''}
                </span>
              </>
            ) : row.caseTitle ? (
              <>
                <span className="block text-xs text-slate-200 truncate" title={row.caseTitle}>
                  {row.caseTitle}
                </span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-500 mt-0.5">
                  <Status kind={STATE_KIND[row.state]}>{STATE_LABEL[row.state]}</Status>
                  {row.carriedOver && <span>từ lộ trình trước</span>}
                  {row.parallelCount > 1 && <span>{row.parallelCount} case song song</span>}
                  {row.attemptsSpanned > 1 && <span>kéo qua {row.attemptsSpanned} lượt MT</span>}
                  {row.state === 'done' && row.outcomeLabel && <span>{row.outcomeLabel}</span>}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-600">Không có vấn đề nào đang theo dõi</span>
            )}
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

      {/* NỘI DUNG MỞ NGAY DƯỚI HÀNG (mục 4.2) — không bắt cuộn đi tìm ở khối khác. */}
      {open && (
        <div id={bodyId} className="px-3 pb-4 pt-1 space-y-4"
             style={{ background: 'var(--surface-2, rgba(255,255,255,.02))' }}>
          <SkillDetail row={row} progress={progress} onOpenCase={onOpenCase}
            onReport={onReport} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}

/**
 * NỘI DUNG MỞ RA CỦA MỘT KỸ NĂNG (mục 4.2), đúng ba phần và đúng thứ tự này:
 *
 *   1. BIỂU ĐỒ của chính kỹ năng đó — câu hỏi đầu tiên luôn là "em đang lên hay đang xuống".
 *   2. CASE ĐANG MỞ, mỗi case một khối độc lập. Mở cái này không đóng cái kia.
 *   3. LỊCH SỬ ĐÃ KẾT THÚC, thu gọn — vẫn phải thấy được là nó tồn tại.
 *
 * Kỹ năng KHÔNG có case vẫn xem được điểm và lịch sử: "không có dữ liệu" và "không có vấn
 * đề" là hai câu khác nhau, và phần mềm phải phân biệt được.
 */
function SkillDetail({ row, progress, onOpenCase, onReport, onChanged }: {
  row: Row;
  progress?: { mode: 'ielts' | 'ratio'; skills: any[] } | null;
  onOpenCase?: (caseId: number) => void;
  onReport?: (category: string) => void;
  onChanged?: () => void;
}) {
  /* W1 và W2 của Fast Track cùng thuộc đường Writing khi vẽ. */
  const chartSkill = row.category === 'writing1' || row.category === 'writing2' ? 'writing' : row.category;
  const hasChart = !!progress?.skills?.some((sk: any) => sk.skill === chartSkill);
  const openCases = row.cases.filter((c) => c.status !== 'done');
  const doneCases = row.cases.filter((c) => c.status === 'done');
  const [showDone, setShowDone] = useState(false);

  return (
    <>
      {hasChart && row.category !== 'behaviour' && (
        <ProgressChart data={progress!} only={chartSkill} onOpenCase={onOpenCase} />
      )}
      {!hasChart && row.category !== 'behaviour' && (
        <p className="text-xs text-slate-500 m-0">
          Chưa có điểm nào ở {row.label} trong lộ trình này — chưa đủ căn cứ để nói em đang lên
          hay đang xuống. Đây là <strong>chưa có dữ liệu</strong>, không phải là không có vấn đề.
        </p>
      )}

      {openCases.length === 0 ? (
        <p className="text-xs text-slate-400 m-0">
          Không có vấn đề nào đang theo dõi ở {row.label}.
          {onReport && (
            <button type="button" className="btn btn-sm ml-2" onClick={() => onReport(row.category)}>
              + Case cho {row.label}
            </button>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {openCases.map((c) => (
            <div key={c.id} className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b"
                   style={{ borderColor: 'var(--line)' }}>
                <span className="text-sm text-slate-100">
                  {c.title}
                  {c.carriedOver && <span className="text-[10px] text-slate-500 ml-2">từ lộ trình trước</span>}
                </span>
                {onOpenCase && (
                  <button className="btn btn-sm btn-ghost" onClick={() => onOpenCase(c.id)}>
                    Mở trang riêng
                  </button>
                )}
              </div>
              <div className="p-2">
                <CasePanel caseId={c.id} compact hideHeader onChanged={onChanged} />
              </div>
            </div>
          ))}
        </div>
      )}

      {doneCases.length > 0 && (
        <div>
          <button type="button" className="btn btn-sm btn-ghost"
            onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Ẩn' : 'Xem'} {doneCases.length} vấn đề đã kết thúc
          </button>
          {showDone && (
            <ul className="list-none p-0 m-0 mt-2 space-y-1">
              {doneCases.map((c) => (
                <li key={c.id} className="text-xs text-slate-400">
                  <button type="button"
                    className="appearance-none border-0 bg-transparent p-0 text-left text-slate-400 hover:underline"
                    onClick={onOpenCase ? () => onOpenCase(c.id) : undefined}>
                    {c.title}
                    <span className="text-slate-600"> · kết thúc {fmtDate(c.touchedOn)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
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
    /* Lớp Normal không đánh số MT — bài của nó là Giữa khoá và Cuối khoá. */
    return (
      <span className="block text-[10px] text-slate-500">
        {row.ratio ? 'mới có một bài' : `mới có MT${pts[0].attemptNo}`}
        {row.bandWeek ? ` · ${row.bandWeek}` : ''}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-[10px] text-slate-500 leading-tight">
      {pts.map((pt, i) => (
        <span key={pt.attemptNo} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-slate-700">→</span>}
          <span className={`tabular-nums ${
            pt.passed === false || (pt.expectation !== null && pt.band < pt.expectation)
              ? 'text-rose-300/80' : 'text-slate-400'
          }`} title={`MT${pt.attemptNo}${pt.expectation !== null ? ` · kỳ vọng ${fmtBand(pt.expectation)}` : ''}`}>
            {/* Điểm Normal giữ nguyên đạt/tổng — hai đề khác thang thì không so thẳng được. */}
            {row.ratio && pt.total ? `${pt.score}/${pt.total}` : fmtBand(pt.band)}
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
