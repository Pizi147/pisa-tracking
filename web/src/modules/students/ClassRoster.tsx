import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BandCell, Empty, ExamPlanText, Pill, Skeleton, Th } from '../../ui/ui.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { fmtBand, fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { ENTRY_SKILL_SHORT, type EntrySkill, type ExamPlan } from '@shared/domain/index.ts';

type Cell = { now: number | null; prev: number | null; dir: number };

type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  /** `mock` với lớp FT; `progress` / `final` với lớp thường. */
  kind: string;
  /** Nhãn ngắn để hiện trên dải: "MT2", "Giữa khoá", "Cuối khoá". */
  kindLabel: string;
  periodCode: string | null; status: string;
  scoredRequired: number; requiredCount: number;
  /** Lớp thường KHÔNG có Overall IELTS — luôn null, không dựng số giả. */
  overall: number | null;
  passedCount: number | null; failedCount: number | null;
  sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

type RosterRow = {
  /** Gom mọi thứ học viên còn thiếu vào một badge (mục 7.5). */
  missing: { key: string; label: string; who: string }[];
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { id: number; seq: number; route: string | null; target: number | null } | null;
  /** Sáu ô điểm của lượt gần nhất, kèm điểm lượt trước để vẽ mũi tên. Lớp Normal: null. */
  scores: {
    overall: Cell; listening: Cell; reading: Cell; speaking: Cell; writing1: Cell; writing2: Cell;
  } | null;
  sosLevel: number | null; openCases: number; examPlan: ExamPlan;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  myPending: string[];
};

/**
 * BẢNG HỌC VIÊN CỦA MỘT LỚP — mục 8.4, làm lại ở vòng 4.
 *
 * Thứ tự cột do owner chốt:
 *
 *   Học viên · Target · Dự kiến thi · OVR · L · R · S · W1 · W2 · Trạng thái · Việc cần làm
 *
 * Ba quyết định đáng nói:
 *
 * 1. SÁU CỘT ĐIỂM là điểm MT gần nhất, kèm mũi tên so với lượt trước. Bản trước đặt điểm
 *    giáo viên ước lượng ngay cạnh điểm MT, tạo ra hai con số nhìn như nhau mà nghĩa khác
 *    hẳn nhau; owner bỏ hẳn cách đó ở vòng 4.
 *
 * 2. CỘT VIỆC CẦN LÀM chỉ hiện việc CỦA NGƯỜI ĐANG XEM. Giáo viên Listening không cần biết
 *    lớp còn thiếu điểm Speaking của người khác — biết cũng không làm được gì. Đây cũng là
 *    câu trả lời cho lo ngại của owner về "bảng quá dày": lọc theo trách nhiệm cắt được
 *    phần lớn badge, chứ không phải rút gọn chữ.
 *
 * 3. DẢI TIẾN TRÌNH MT (MT1 ✓ · MT2 ✓ · MT3 W4 OCT) chuyển xuống DÒNG PHỤ dưới tên em, thay
 *    vì chiếm một cột riêng. Nó là thứ để liếc chứ không phải để so sánh giữa các em, mà cột
 *    thì bắt nó rộng bằng em có nhiều lượt nhất.
 */
export function ClassRoster({ classId, studentQuery, onAddStudents }: {
  classId: number; studentQuery?: string; onAddStudents?: () => void;
}) {
  const path = `/classes/${classId}/roster${studentQuery?.trim() ? `?q=${encodeURIComponent(studentQuery.trim())}` : ''}`;
  const { data, loading, error, reload } = useApi<RosterRow[]>(path);

  if (loading) return <div className="surface-2 rounded-lg p-3"><Skeleton rows={3} /></div>;
  if (error) {
    return (
      <div className="surface-2 rounded-lg p-3 text-xs text-rose-200">
        {error.message} <button className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </div>
    );
  }
  if (!data) return null;
  if (!data.length) {
    return (
      <div className="surface-2 rounded-lg">
        <Empty
          title={studentQuery ? 'Không có học viên nào khớp từ khoá trong lớp này' : 'Lớp chưa có học viên'}
          action={onAddStudents && <button className="btn btn-sm" onClick={onAddStudents}>Thêm học viên</button>}
        />
      </div>
    );
  }

  /* Lớp Normal không có band nên sáu cột điểm không có nghĩa — bỏ hẳn cột thay vì để trống. */
  const hasBands = data.some((s) => s.scores);

  return (
    <div className="surface-2 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <Th hint="Tên và mã học viên. Dòng dưới là chuỗi các lượt đánh giá của em.">Học viên</Th>
            <Th align="right" hint="Điểm mục tiêu của lộ trình em đang học.">Target</Th>
            <Th hint="Kỳ thi IELTS thật, ở đúng mức chắc chắn đang biết: tuần, hoặc mới có tháng, hoặc chưa xác định.">Dự kiến thi</Th>
            {hasBands && (
              <>
                <Th align="right" hint="Overall — điểm trung bình bốn kỹ năng ở lượt MT gần nhất.">OVR</Th>
                <Th align="right" hint="Listening ở lượt MT gần nhất.">L</Th>
                <Th align="right" hint="Reading ở lượt MT gần nhất.">R</Th>
                <Th align="right" hint="Speaking ở lượt MT gần nhất.">S</Th>
                <Th align="right" hint="Writing Task 1 — chấm riêng, không gộp vào điểm Writing.">W1</Th>
                <Th align="right" hint="Writing Task 2 — chấm riêng, và nặng gấp đôi Task 1 khi gộp.">W2</Th>
              </>
            )}
            <Th hint="Mức SOS đang có hiệu lực và số case chưa xong của em.">Trạng thái</Th>
            <Th hint="Chỉ hiện việc thuộc trách nhiệm của chính bạn.">Việc cần làm</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => {
            const target = s.cycle?.target ?? null;
            return (
              <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
                <td className="td align-top">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                    {/* Badge thiếu thông tin ngay trên dòng học viên (mục 7.5). */}
                    <MissingBadge items={s.missing} />
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {s.studentCode}
                    {s.cycle?.route ? ` · ${s.cycle.route}` : ''}
                    {s.status !== 'active' && ' · đã kết thúc'}
                  </span>
                  <span className="block mt-1"><MockTrail timeline={s.timeline} classId={classId} /></span>
                </td>
                <td className="td text-right tabular-nums whitespace-nowrap align-top">{fmtBand(target)}</td>
                <td className="td whitespace-nowrap text-xs align-top">
                  <ExamPlanText plan={s.examPlan} />
                </td>
                {hasBands && (
                  <>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.overall} target={target} /></td>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.listening} target={target} /></td>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.reading} target={target} /></td>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.speaking} target={target} /></td>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.writing1} target={target} /></td>
                    <td className="td text-right align-top"><BandCell cell={s.scores?.writing2} target={target} /></td>
                  </>
                )}
                <td className="td align-top"><StatusCell row={s} /></td>
                <td className="td align-top"><TaskCell row={s} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * CỘT TRẠNG THÁI — một câu về chỗ đứng hiện tại của em.
 *
 * "Đúng tiến độ" là kết luận có ý nghĩa, không phải chỗ trống được đặt tên: nó chỉ hiện khi
 * em ĐÃ có kết quả và kết quả đó không mở case nào. Em chưa thi lượt nào thì nói đúng điều
 * đó — gọi em là "đúng tiến độ" khi chưa có gì để đánh giá là một lời hứa suông.
 */
function StatusCell({ row }: { row: RosterRow }) {
  if (row.status !== 'active') return <span className="text-xs text-slate-600">Đã kết thúc</span>;
  const bits: React.ReactNode[] = [];
  if (row.sosLevel) bits.push(<Pill key="sos" tone={sosTone(row.sosLevel)}>{sosLabel(row.sosLevel)}</Pill>);
  if (row.openCases > 0) {
    bits.push(
      <Pill key="cases" tone={row.openCases >= 3 ? 'warn' : 'neutral'}
        title="Case đã mở và chưa chốt kết quả">
        {row.openCases} case chưa xong
      </Pill>,
    );
  }
  if (bits.length) return <span className="flex flex-wrap items-center gap-1">{bits}</span>;
  if (!row.latest) return <span className="text-xs text-slate-500">Chưa có kết quả nào</span>;
  return <Pill tone="ok">Đúng tiến độ</Pill>;
}

/**
 * CỘT VIỆC CẦN LÀM — badge ngắn, xếp CHỒNG khi cột hẹp, và chỉ việc của người đang xem.
 *
 * Cùng một tông màu với mọi trang khác: vàng là việc đang chờ, đỏ là đã quá hạn. Không phát
 * minh thêm màu ở riêng bảng này.
 */
function TaskCell({ row }: { row: RosterRow }) {
  const jobs: React.ReactNode[] = [];
  if (row.myPending.length > 0) {
    jobs.push(
      <Pill key="score" tone="warn" title="Kỹ năng bạn phụ trách còn để trống điểm">
        Nhập điểm {row.myPending.map((k) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k).join(', ')}
      </Pill>,
    );
  }
  if (row.timeline.some((t) => t.overdueSkills > 0)) {
    jobs.push(<Pill key="late" tone="danger" title="Đã qua hạn nhập điểm của lượt đó">Quá hạn nhập điểm</Pill>);
  }
  if (!jobs.length) return <span className="text-xs text-slate-600">—</span>;
  return <span className="flex flex-col items-start gap-1">{jobs}</span>;
}

/**
 * Chuỗi bài đánh giá quá khứ → hiện tại → tương lai.
 *
 * Lớp FT: `MT1 ✓ · MT2 ✓ · MT3 W4 OCT`.
 * Lớp thường: `Giữa khoá ✓ · Cuối khoá W2 OCT` — cùng một dải, chỉ đổi nhãn.
 * Lượt tương lai hiện MÃ TUẦN, không hiện "tuần học 10" để tránh nhầm hai khái niệm.
 */
function MockTrail({ timeline, classId }: { timeline: Timeline[]; classId: number }) {
  if (!timeline.length) return <span className="text-slate-600 text-xs">Chưa có kế hoạch đánh giá</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {timeline.map((t, i) => (
        <span key={t.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-700" aria-hidden>·</span>}
          <Link
            to={t.kind === 'mock' ? `/mock-test/${t.id}` : `/bang-diem-thuong/${classId}?kind=${t.kind}`}
            className="no-underline"
            title={`${t.kindLabel}${t.periodCode ? ` · ${t.periodCode}` : ''}`}
          >
            <Pill tone={
              t.status === 'cancelled' ? 'muted'
                : t.evaluable ? sosTone(t.sosLevel)
                : t.status === 'done' ? 'info' : 'neutral'
            }>
              {t.kindLabel}
              {t.status === 'cancelled' ? ' huỷ'
                : t.evaluable ? ' ✓'
                : t.scoredRequired > 0 ? ` ${t.scoredRequired}/${t.requiredCount}`
                : t.periodCode ? ` ${t.periodCode}` : ''}
            </Pill>
          </Link>
        </span>
      ))}
    </span>
  );
}

/*
 * CỘT "ĐÁNH GIÁ GV" ĐÃ BỎ Ở VÒNG 4, cùng với cả chức năng ghi nhận của giáo viên.
 *
 * Owner chốt 13/09/2026: đặt điểm ước lượng của giáo viên ngay cạnh điểm MT trong bảng lớp
 * tạo ra hai con số nhìn như nhau nhưng nghĩa khác hẳn nhau, và không ai nhớ được cái nào
 * là cái nào. Bảng lớp nay chỉ hiện MỘT nguồn điểm.
 */
