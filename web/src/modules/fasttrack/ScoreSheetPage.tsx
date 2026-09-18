import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Level, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import { usePeriods, useCurrentPeriod, type Period } from '../../ui/Filters.tsx';
import { CriteriaButton, DeadlinePill, RawScoreInput, useSaveScore, type Cell } from './ScoreEntry.tsx';
import {
  attemptStatusLabel, attemptStatusTone, fmtBand, skillShort, sosLabel, sosTone,
} from '../../lib/format.ts';
import { ENTRY_SKILLS } from '@shared/domain/index.ts';

type Sheet = {
  classId: number; classCode: string; branchName: string;
  period: { id: number; code: string; weekStart: string; weekEnd: string } | null;
  editableSkills: string[];
  rows: {
    attemptId: number; studentId: number; studentName: string; studentCode: string;
    attemptNo: number; status: string;
    cells: Cell[]; result: any;
  }[];
};

/**
 * "01/02 – 07/02" — khoảng ngày của một tuần, viết như mọi dòng khác trong ô chọn tuần.
 *
 * Tuần mở thẳng từ đường dẫn đi qua đường bảng điểm chứ không qua danh sách tuần, mà đường
 * ấy không trả về sẵn chuỗi khoảng ngày. Dựng lại ở đây rẻ hơn là thêm một trường chỉ để
 * phục vụ đúng một chỗ.
 */
function rangeOf(from: string, to: string): string {
  const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return `${dm(from)} – ${dm(to)}`;
}

/**
 * Bảng nhập điểm cho cả lớp trong một tuần.
 * Điều hướng bàn phím: Enter/↓ xuống ô cùng cột, ↑ lên, ←/→ sang kỹ năng khác cùng dòng.
 */
export default function ScoreSheetPage() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const periods = usePeriods();
  const current = useCurrentPeriod();
  const [periodId, setPeriodId] = useState<number | null>(params.get('periodId') ? Number(params.get('periodId')) : null);

  /*
   * MỞ RA LÀ ĐỨNG Ở TUẦN HIỆN TẠI — đây là lỗi owner báo: bảng chấm tự nhảy sang tuần xa nhất.
   *
   * Nguyên nhân: ô chọn tuần nạp 26 tuần MỚI NHẤT của lịch, mà lịch có sẵn cả tuần tương lai
   * (kế hoạch MT xếp tới đầu 2027). Khi phần tương lai dài hơn 26 tuần thì tuần hiện tại rơi
   * khỏi danh sách, bản cũ tìm không thấy nên lấy phần tử đầu — chính là tuần xa nhất.
   *
   * Nay: có tuần trên đường dẫn thì giữ nguyên tuần đó; không có thì hỏi thẳng máy chủ tuần
   * hiện tại, không phụ thuộc danh sách.
   */
  useEffect(() => {
    if (periodId === null && current.data) setPeriodId(current.data.id);
  }, [current.data, periodId]);

  const path = classId ? `/classes/${classId}/score-sheet${periodId ? `?periodId=${periodId}` : ''}` : null;
  const { data, loading, error, reload } = useApi<Sheet>(path);
  const grid = useRef<(HTMLInputElement | null)[][]>([]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  /*
   * TUẦN ĐANG CHỌN LUÔN CÓ MẶT TRONG Ô CHỌN. Danh sách tuần là một cửa sổ, nên tuần hiện tại
   * — hoặc tuần mở thẳng từ đường dẫn — có thể không nằm trong đó. Thiếu nó thì ô chọn hiện
   * trống và lần bấm kế tiếp lại rơi về một tuần khác.
   */
  const list = periods.data ?? [];
  const chosen: Period | null = periodId
    ? (list.find((p) => p.id === periodId)
      ?? (current.data?.id === periodId ? current.data : null)
      ?? (data?.period?.id === periodId
        ? { ...data.period, range: rangeOf(data.period.weekStart, data.period.weekEnd) }
        : null))
    : null;
  const weeks = chosen && !list.some((p) => p.id === chosen.id)
    ? [chosen, ...list].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    : list;

  const rawSkills = ENTRY_SKILLS.filter((s) => s === 'listening' || s === 'reading');
  const critSkills = ENTRY_SKILLS.filter((s) => s !== 'listening' && s !== 'reading');

  const move = (row: number, col: number, dr: number, dc: number) => {
    const r = grid.current[row + dr];
    const target = r?.[col + dc] ?? grid.current[row + dr]?.[col];
    target?.focus();
    target?.select();
  };

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="btn btn-sm btn-ghost mb-1 no-underline" to="/hoc-vien">← Danh sách lớp</Link>
          <h1 className="text-lg font-semibold text-slate-100">
            Nhập điểm · {data?.classCode ?? '…'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data?.branchName}
            {data && ` · Bạn được nhập: ${data.editableSkills.length ? data.editableSkills.map(skillShort).join(', ') : 'không kỹ năng nào'}`}
          </p>
        </div>
        <label className="block">
          <span className="label">Tuần</span>
          <select className="field w-56" value={periodId ?? ''} onChange={(e) => {
            const v = Number(e.target.value);
            setPeriodId(v);
            const next = new URLSearchParams(params); next.set('periodId', String(v)); setParams(next, { replace: true });
          }}>
            {weeks.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
      </div>

      {loading && <Skeleton rows={8} />}

      {data && !loading && (
        <Card bodyClass="p-0">
          {data.rows.length === 0 ? (
            <Empty title="Không có lượt Mock nào của lớp này trong tuần đã chọn"
              hint="Đổi tuần ở trên, hoặc quay lại danh sách Mock để chọn lớp khác." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th className="sticky-col" hint="Cột này đứng yên khi cuộn ngang, để không lạc mất đang nhập cho em nào.">Học viên</Th>
                    <Th hint="Số thứ tự lượt Mock Test trong lộ trình của em.">MT</Th>
                    <Th hint="Lượt đã chấm xong, đang chờ, hay đã huỷ.">Trạng thái</Th>
                    <Th hint="Hạn chấm tính riêng cho từng môn, từ tuần thi của chính môn đó: hết thứ Tư của tuần kế tiếp. Quản lý đặt được hạn riêng.">Hạn nhập</Th>
                    {rawSkills.map((s) => <th key={s} className="th">{skillShort(s)} <span className="normal-case text-slate-500">(số câu)</span></th>)}
                    {critSkills.map((s) => <th key={s} className="th">{skillShort(s)} <span className="normal-case text-slate-500">(band)</span></th>)}
                    <Th hint="Mức mong đợi của chính lượt này, tính theo mục tiêu tại thời điểm đó.">Kỳ vọng</Th>
                    <Th hint="Band tổng, chỉ có khi đã đủ điểm mọi kỹ năng bắt buộc.">Overall</Th>
                    <Th hint="Số kỹ năng dưới kỳ vọng của lượt này — đó chính là mức SOS.">Kết quả</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, ri) => (
                    <SheetRow
                      key={r.attemptId}
                      row={r}
                      rowIndex={ri}
                      rawSkills={rawSkills}
                      critSkills={critSkills}
                      onReload={reload}
                      register={(ci, el) => {
                        grid.current[ri] = grid.current[ri] ?? [];
                        grid.current[ri][ci] = el;
                      }}
                      onMove={move}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <SectionNote>
        Ô để trống nghĩa là chưa nhập, không phải điểm 0. Chỉ những kỹ năng bạn được phân công mới sửa được;
        các kỹ năng khác vẫn đọc được để đối chiếu. <strong>Mỗi kỹ năng có tuần thi và hạn chấm riêng</strong> —
        cột Hạn nhập chỉ ra môn đang đến hạn sớm nhất; mở một em ra để xem lịch đầy đủ của từng môn.
        Môn chưa đến tuần thi thì chưa nợ điểm. Kỹ năng ngoài phạm vi yêu cầu hiện mờ và không bị tính thiếu điểm.
      </SectionNote>
    </div>
  );
}

/**
 * HẠN NHẬP ĐIỂM GỌN TRONG MỘT Ô, cho một dòng của bảng điểm cả lớp.
 *
 * Chọn môn đang nợ có hạn SỚM NHẤT — đó là việc phải làm trước. Khi đợt tách tuần thì các
 * môn có hạn khác nhau, nên phải gọi tên môn ra; nếu không, người đọc sẽ tưởng một ngày duy
 * nhất đó áp cho cả năm ô điểm bên cạnh.
 */
function DeadlineSummary({ cells }: { cells: Cell[] }) {
  const owing = cells.filter((c) => c.required && c.band === null && c.deadline
    && c.progress !== 'cancelled' && c.progress !== 'absent');
  if (!owing.length) return <DeadlinePill cell={cells.find((c) => c.required) ?? cells[0]} />;

  const soonest = owing.reduce((a, b) => (a.deadline! <= b.deadline! ? a : b));
  const weeks = new Set(cells.filter((c) => c.required && c.periodCode).map((c) => c.periodCode));
  return (
    <div className="flex flex-col items-start gap-0.5">
      <DeadlinePill cell={soonest} />
      {weeks.size > 1 && (
        <span className="text-[10px] text-slate-500">
          {skillShort(soonest.skill)} · đợt này thi {weeks.size} tuần
        </span>
      )}
    </div>
  );
}

function SheetRow({ row, rowIndex, rawSkills, critSkills, onReload, register, onMove }: {
  row: Sheet['rows'][number]; rowIndex: number;
  rawSkills: readonly string[]; critSkills: readonly string[];
  onReload: () => void;
  register: (col: number, el: HTMLInputElement | null) => void;
  onMove: (row: number, col: number, dr: number, dc: number) => void;
}) {
  const { save } = useSaveScore(row.attemptId, onReload);
  const cellOf = (skill: string) => row.cells.find((c) => c.skill === skill);

  return (
    <tr className="row-hover">
      <td className="td sticky-col">
        <Link className="link" to={`/mock-test/${row.attemptId}`}>{row.studentName}</Link>
        <div className="text-[11px] text-slate-500">{row.studentCode}</div>
      </td>
      <td className="td tabular-nums whitespace-nowrap">MT{row.attemptNo}</td>
      <td className="td whitespace-nowrap text-xs text-slate-400">
        <Status kind={row.status === 'done' ? 'done' : row.status === 'cancelled' ? 'idle' : 'doing'}>
          {attemptStatusLabel(row.status)}
        </Status>
      </td>
      {/*
        HẠN SỚM NHẤT CÒN NỢ, kèm tên môn khi đợt tách tuần.
        Từ vòng 7 mỗi môn có tuần thi riêng nên có thể có nhiều hạn khác nhau trên một dòng.
        In cả năm cái là nhiễu; in một cái mà không nói của môn nào thì người đọc tưởng nó
        áp cho cả dòng. Nên: hạn gần nhất trong các môn CÒN NỢ, và gọi tên môn đó.
      */}
      <td className="td whitespace-nowrap">
        <DeadlineSummary cells={row.cells} />
      </td>
      {rawSkills.map((s, ci) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td text-slate-600">—</td>;
        return (
          <td key={s} className="td">
            <RawScoreInput
              cell={cell}
              onSave={(p) => save(s, p)}
              inputRef={(el) => register(ci, el)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onMove(rowIndex, ci, 1, 0); }
                if (e.key === 'ArrowUp') { e.preventDefault(); onMove(rowIndex, ci, -1, 0); }
              }}
            />
          </td>
        );
      })}
      {critSkills.map((s) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td text-slate-600">—</td>;
        return (
          <td key={s} className="td">
            <CriteriaButton cell={cell} onSave={(p) => save(s, p)} />
          </td>
        );
      })}
      <td className="td tabular-nums">{fmtBand(row.result.expectation)}</td>
      <td className="td tabular-nums text-slate-100">{fmtBand(row.result.overall)}</td>
      {/* Badge ôm sát nội dung: items-start để ô bảng rộng cũng không kéo giãn nó ra. */}
      <td className="td">
        <div className="flex flex-col items-start gap-0.5">
          <Level tone={sosTone(row.result.sosLevel)}>
            {row.result.evaluable
              ? sosLabel(row.result.sosLevel)
              : `Chờ ${row.result.required.length - row.result.scoredRequired} kỹ năng`}
          </Level>
          {row.result.scopeNote && (
            <span className="text-[10px] text-slate-500" title={row.result.scopeDetail ?? undefined}>
              {row.result.scopeNote}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
