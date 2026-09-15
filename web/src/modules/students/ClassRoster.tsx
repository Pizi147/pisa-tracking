import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Alert, Empty, ExamPlanText, Outcome, Skeleton, Status, Task, Th } from '../../ui/ui.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { fmtBand } from '../../lib/format.ts';
import {
  ENTRY_SKILL_SHORT, REGULAR_SKILL_LABEL,
  type EntrySkill, type ExamPlan,
} from '@shared/domain/index.ts';

type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  kind: string; kindLabel: string;
  periodCode: string | null; status: string;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  passedCount: number | null; failedCount: number | null;
  sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

/** Một mốc trong lịch sử điểm: FT mang `bands`, Normal mang `ratios`. */
type HistoryRow = {
  id: number; label: string; kind: string; periodCode: string | null;
  sosLevel: number | null; evaluable: boolean;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  bands: Record<string, number | null> | null;
  ratios: Record<string, { score: number | null; total: number | null; outcome: string }> | null;
};

type RosterRow = {
  missing: { key: string; label: string; who: string }[];
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  scoring: 'ratio' | 'band';
  skills: string[] | null;
  cycle: { id: number; seq: number; route: string | null; target: number | null } | null;
  standingLine: string | null;
  sosLevel: number | null; provisional: boolean;
  openCases: number; handoverCases: number; examPlan: ExamPlan;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  history: HistoryRow[];
  myPending: string[];
};

/** Bộ cột điểm của hai loại lớp — mục 5.1 và 5.2. */
const FT_SKILLS = ['listening', 'reading', 'speaking', 'writing1', 'writing2'] as const;
const NORMAL_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;

/**
 * BẢNG HỌC VIÊN CỦA MỘT LỚP — làm lại theo mục 5.
 *
 * HAI BỘ CỘT, vì hai loại lớp trả lời hai câu hỏi khác nhau:
 *
 *   Normal      Học viên · Mốc kiểm tra · L · R · W · S · Theo dõi
 *   Fast Track  Học viên · Target · Dự kiến thi · Mốc · OVR · L · R · S · W1 · W2 · Theo dõi
 *
 * Lớp Normal KHÔNG có Target và Dự kiến thi: các em đó chưa thi IELTS và chưa có mục tiêu
 * band, nên hai cột ấy là hai cột trống vĩnh viễn — và một cột trống vĩnh viễn dạy người
 * dùng bỏ qua cả bảng.
 *
 * LỊCH SỬ ĐIỂM 2–3 MỐC (mục 5.4): mỗi ô điểm là một cột dọc, mốc mới nhất trên cùng và đậm
 * hơn, mốc cũ nhạt dần. Không có mũi tên tăng/giảm trên từng ô — các hàng đã thẳng cột với
 * nhau nên mắt tự so được, và thêm chục mũi tên thì cả bảng lại đầy nhãn.
 *
 * Ô TRỐNG NGHĨA LÀ CHƯA NHẬP, và nó giữ nguyên là ô trống: không lấy điểm mốc cũ lấp vào ô
 * thiếu của mốc mới, không ghép điểm khác lượt thành Overall, không nối chuỗi điểm Normal
 * với điểm Fast Track.
 */
export function ClassRoster({ classId, studentQuery, onAddStudents }: {
  classId: number; studentQuery?: string; onAddStudents?: () => void;
}) {
  const path = `/classes/${classId}/roster${studentQuery?.trim() ? `?q=${encodeURIComponent(studentQuery.trim())}` : ''}`;
  const { data, loading, error, reload } = useApi<RosterRow[]>(path);
  /*
   * MẬT ĐỘ: Gọn = 2 mốc, Đầy đủ = 3 mốc (mục 5.4). Mặc định Gọn — hai mốc đủ trả lời "em
   * đang lên hay xuống", còn mốc thứ ba là để đọc kỹ chứ không phải để liếc.
   */
  const [depth, setDepth] = useState<2 | 3>(2);

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

  const isRatio = data[0]?.scoring === 'ratio';
  const skills: readonly string[] = isRatio
    ? (data[0]?.skills ?? NORMAL_SKILLS)
    : FT_SKILLS;
  const skillLabel = (k: string) => (isRatio
    ? (REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k).slice(0, 1)
    : ENTRY_SKILL_SHORT[k as EntrySkill] ?? k);

  return (
    <div className="surface-2 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'var(--line)' }}>
        <span className="text-[11px] text-slate-500">
          Điểm của {depth} mốc gần nhất, mốc mới nhất ở trên.
          {isRatio && ' Lớp Normal chấm theo điểm đạt / tổng điểm.'}
        </span>
        <span className="flex gap-1">
          <button className={`btn btn-sm ${depth === 2 ? 'btn-primary' : ''}`} onClick={() => setDepth(2)}>Gọn</button>
          <button className={`btn btn-sm ${depth === 3 ? 'btn-primary' : ''}`} onClick={() => setDepth(3)}>Đầy đủ</button>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th hint="Tên em, và một câu về kết quả mốc gần nhất của em.">Học viên</Th>
              {!isRatio && (
                <>
                  <Th align="right" hint="Điểm mục tiêu của lộ trình em đang học.">Target</Th>
                  <Th hint="Kỳ thi IELTS thật, ở đúng mức chắc chắn đang biết: tuần, hoặc mới có tháng, hoặc chưa xác định.">
                    Dự kiến thi
                  </Th>
                </>
              )}
              <Th hint={isRatio
                ? 'Bài kiểm tra ứng với mỗi hàng điểm bên phải — mốc mới nhất ở trên.'
                : 'Lượt MT ứng với mỗi hàng điểm bên phải — mốc mới nhất ở trên.'}>
                {isRatio ? 'Mốc kiểm tra' : 'Mốc'}
              </Th>
              {!isRatio && (
                <Th align="right" hint="Overall — chỉ có khi lượt đó đủ cả bốn kỹ năng. Không ghép điểm khác lượt thành Overall.">
                  OVR
                </Th>
              )}
              {skills.map((k) => (
                <Th key={k} align="right" hint={isRatio
                  ? `${REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k} — điểm đạt / tổng điểm`
                  : `${k === 'writing1' ? 'Writing Task 1' : k === 'writing2' ? 'Writing Task 2' : k} ở từng mốc`}>
                  {skillLabel(k)}
                </Th>
              ))}
              <Th hint="Một việc chính nếu có, kèm số case đang xử lý. Quá hạn là thông tin của việc đó, không phải một việc riêng.">
                Theo dõi
              </Th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const rows = s.history.slice(0, depth);
              const span = Math.max(rows.length, 1);
              return (
                <tr key={s.id} className={`row-hover align-top ${s.status !== 'active' ? 'row-muted' : ''}`}>
                  <td className="td">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                      <MissingBadge items={s.missing} />
                    </span>
                    {/*
                      MỘT CÂU DƯỚI TÊN, KHÔNG PHẢI BỐN NHÃN (mục 5.2).
                      "Đạt kỳ vọng MT2" nói được chính xác căn cứ là gì; "Đúng tiến độ" thì
                      không — và từ một kết quả đơn lẻ cũng không suy ra được em có kịp thi.
                    */}
                    {/*
                      ĐÚNG MỘT CÂU, KHÔNG KÈM NHÃN SOS RIÊNG (mục 5.2).
                      Câu này đã nói cả mức lẫn căn cứ — "MT2: SOS 3 · còn 5 case đang theo
                      dõi" — nên một nhãn "SOS 3" ngay bên dưới chỉ là nói lại lần thứ hai.
                    */}
                    <span className={`block text-[11px] mt-0.5 ${
                      s.status === 'active' && s.sosLevel !== null && s.sosLevel > 0
                        ? 'text-amber-200/80' : 'text-slate-500'}`}>
                      {s.status !== 'active' ? 'Đã kết thúc'
                        : s.standingLine ?? 'Chưa có kết quả nào trong lộ trình này'}
                    </span>
                  </td>

                  {!isRatio && (
                    <>
                      <td className="td text-right tabular-nums whitespace-nowrap">{fmtBand(s.cycle?.target ?? null)}</td>
                      <td className="td whitespace-nowrap text-xs"><ExamPlanText plan={s.examPlan} /></td>
                    </>
                  )}

                  {/* ─── các cột điểm: mỗi mốc một hàng con, thẳng cột với nhau ─── */}
                  <td className="td p-0">
                    <Stack n={span}>
                      {rows.length === 0
                        ? [<span key="none" className="text-[11px] text-slate-600">chưa có điểm</span>]
                        : rows.map((h, i) => (
                          <Link key={h.id} className="no-underline"
                            to={h.kind === 'mock' ? `/mock-test/${h.id}` : `/bang-diem-thuong/${classId}?kind=${h.kind}`}>
                            <span className={`text-xs whitespace-nowrap ${i === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                              {h.label}
                              {h.scoredRequired < h.requiredCount && (
                                <span className="text-[10px] text-amber-200/70 ml-1">
                                  {h.scoredRequired}/{h.requiredCount}
                                </span>
                              )}
                            </span>
                          </Link>
                        ))}
                    </Stack>
                  </td>

                  {!isRatio && (
                    <td className="td p-0 text-right">
                      <Stack n={span} align="right">
                        {rows.length === 0 ? [<Dash key="none" />]
                          : rows.map((h, i) => (
                            <Band key={h.id} v={h.overall} target={s.cycle?.target ?? null} faded={i > 0} />
                          ))}
                      </Stack>
                    </td>
                  )}

                  {skills.map((k) => (
                    <td key={k} className="td p-0 text-right">
                      <Stack n={span} align="right">
                        {rows.length === 0 ? [<Dash key="none" />]
                          : rows.map((h, i) => (isRatio
                            ? <Ratio key={h.id} cell={h.ratios?.[k]} faded={i > 0} />
                            : <Band key={h.id} v={h.bands?.[k] ?? null} target={s.cycle?.target ?? null} faded={i > 0} />
                          ))}
                      </Stack>
                    </td>
                  ))}

                  <td className="td"><FollowCell row={s} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Các hàng con của một ô, cao bằng nhau để mọi cột thẳng hàng theo cùng một mốc. */
function Stack({ children, n, align = 'left' }: {
  children: React.ReactNode[]; n: number; align?: 'left' | 'right';
}) {
  return (
    <span className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} px-2 py-1.5`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="h-5 flex items-center">{children[i] ?? null}</span>
      ))}
    </span>
  );
}

function Dash() { return <span className="text-slate-700">–</span>; }

/** Một ô band. Mốc cũ nhạt hơn để mắt bám vào hàng trên cùng (mục 5.4). */
function Band({ v, target, faded }: { v: number | null; target: number | null; faded: boolean }) {
  if (v === null) return <Dash />;
  const met = target == null ? null : v >= target;
  const tone = met === null ? 'text-slate-100' : met ? 'text-emerald-200' : 'text-rose-200';
  return <span className={`tabular-nums text-xs ${tone} ${faded ? 'opacity-55' : ''}`}>{v}</span>;
}

/**
 * MỘT Ô ĐIỂM LỚP NORMAL — dạng ĐIỂM ĐẠT / TỔNG ĐIỂM (mục 5.1).
 *
 * Ba tình trạng, ba cách hiện, và chúng phải phân biệt được bằng mắt trong một giây:
 *   đạt        điểm màu xanh
 *   chưa đạt   điểm màu đỏ
 *   chưa nhập  một gạch ngang — CHƯA NHẬP khác hẳn TRƯỢT, và không bao giờ được trộn
 */
function Ratio({ cell, faded }: {
  cell?: { score: number | null; total: number | null; outcome: string }; faded: boolean;
}) {
  if (!cell || cell.score === null || cell.total === null) return <Dash />;
  const tone = cell.outcome === 'pass' ? 'text-emerald-200'
    : cell.outcome === 'fail' ? 'text-rose-200' : 'text-slate-100';
  return (
    <span className={`tabular-nums text-xs whitespace-nowrap ${tone} ${faded ? 'opacity-55' : ''}`}
      title={cell.outcome === 'pass' ? 'Đạt' : cell.outcome === 'fail' ? 'Chưa đạt' : 'Chưa kết luận'}>
      {cell.score}<span className="opacity-60">/{cell.total}</span>
    </span>
  );
}

/**
 * CỘT THEO DÕI — MỘT hành động chính, rồi mới tới thông tin phụ (mục 5.2).
 *
 * Bản trước xếp chồng ba bốn nhãn cùng nói một chuyện: "Nhập điểm R", "Quá hạn nhập điểm",
 * "SOS 1", "2 case chưa xong". Nay:
 *
 *   dòng 1  MỘT việc chính, kèm mốc của nó
 *   dòng 2  quá hạn bao lâu · số case đang xử lý — là thông tin CỦA việc đó, không phải
 *           thêm một việc nữa
 *   dòng 3  "+N việc" khi còn việc khác, mở hồ sơ em để xem đủ
 */
function FollowCell({ row }: { row: RosterRow }) {
  if (row.status !== 'active') return <span className="text-xs text-slate-600">—</span>;

  const overdue = row.timeline.some((t) => t.overdueSkills > 0);
  const here = row.openCases - (row.handoverCases ?? 0);
  const bits: string[] = [];
  if (overdue) bits.push('quá hạn nhập điểm');
  if (here > 0) bits.push(`${here} case đang xử lý`);
  if (row.handoverCases > 0) bits.push(`${row.handoverCases} case bàn giao`);

  /* Việc chính: nhập điểm kỹ năng của CHÍNH người đang xem, ở mốc đang chờ. */
  const pending = row.myPending;
  const at = row.timeline.find((t) => t.myPending.length > 0);
  const main = pending.length > 0
    ? `Nhập điểm ${pending.map((k) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k).join(', ')}`
    : null;

  if (!main && bits.length === 0) return <span className="text-xs text-slate-600">—</span>;

  return (
    <span className="flex flex-col items-start gap-1">
      {main
        ? <Task tone={overdue ? 'danger' : 'warn'}>{main}{at ? ` · ${at.kindLabel}` : ''}</Task>
        : here > 0
          ? <Status kind="doing">Đang theo dõi</Status>
          : null}
      {bits.length > 0 && (
        <span className="text-[11px] text-slate-500">{bits.join(' · ')}</span>
      )}
      {row.handoverCases > 0 && (
        <Alert tone="warn" title="Case còn dở từ lớp hoặc chương trình trước — cần bàn giao">
          Cần bàn giao
        </Alert>
      )}
    </span>
  );
}

/*
 * CỘT "TRẠNG THÁI" RIÊNG ĐÃ BỎ (mục 5.2) — nội dung của nó chuyển thành MỘT CÂU dưới tên em.
 *
 * Nhãn "Đúng tiến độ" cũng bỏ theo: nó là một lời hứa mà một kết quả đơn lẻ không đủ căn cứ
 * để nói. Thay bằng câu nói rõ căn cứ: "MT2 đạt kỳ vọng · còn 2 case đang theo dõi".
 *
 * DẢI TIẾN TRÌNH MT cũng bỏ khỏi bảng lớp: cột "Mốc" nay đã nói mốc nào ứng với hàng điểm
 * nào, và toàn bộ hành trình vẫn mở được ở hồ sơ từng em.
 */
export { Outcome };
