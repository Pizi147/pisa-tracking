import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { Empty, ErrorState, SectionNote, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { CasePanel } from './CasePanel.tsx';
import { caseStatusLabel, fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import { Level } from '../../ui/ui.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { NeedsEvaluation } from './NeedsEvaluation.tsx';

/* ─────────────────────────────── kiểu dữ liệu trả về từ máy chủ ─────────────── */

type IssueRow = {
  code: string; label: string;
  cases: number; openCases: number;
  /** HV ĐANG GẶP — chỉ em có case chưa kết luận (hiện trạng). */
  students: number;
  /** Mọi em TỪNG có case ở phân loại này, kể cả case đã đóng (lịch sử). */
  studentsEver: number;
  noPlan: number;
  plans: number; running: number;
  success: number; failure: number;
};
type PlanKind = {
  kind: string; label: string;
  success: number; failure: number;
  improved: number; partial: number;
  decided: number; rate: number | null; smallSample: boolean;
};
type Board = {
  category: string; label: string; short: string;
  rows: IssueRow[]; plans: PlanKind[]; studentCount: number; note: string | null;
  /** Phương án đã kết thúc mà chưa có kết quả xác định — ở NGOÀI bảng hiệu quả (F05). */
  needsEvaluation: { count: number; ids: number[] };
};
type SkillRow = {
  code: string; label: string; short: string;
  students: number; openCases: number; noPlan: number; supporting: number; unclassified: number;
};
type CaseRow = {
  caseId: number; studentId: number; studentName: string; studentCode: string;
  classCode: string | null; title: string; issueLabel: string;
  status: string; sosLevel: number | null; detectedAt: string; planCount: number;
};

/**
 * PHÂN TÍCH VẤN ĐỀ — mục 15.1, và cùng một bộ máy với bảng của từng lớp (mục 13.4).
 *
 * Bốn bước, đúng thứ tự người ta nghĩ:
 *
 *   1. Normal hay Fast Track — hai loại lớp chấm khác nhau và có bộ môn khác nhau.
 *   2. Hạng mục nào đang nặng — một hàng cho mỗi môn (Ý thức không còn hàng ở đây từ 21/09/2026).
 *   3. Trong hạng mục đó, vấn đề thuộc loại gì — và những gì đã làm có ăn thua không.
 *   4. Bấm một con số thì ra đúng những case tạo nên nó.
 *
 * Bảng "Phương án & kết quả" đứng riêng của bản trước ĐÃ BỎ (mục 15.1). Nó bắt người đọc
 * nhớ mình vừa xem nhóm vấn đề nào rồi tự tìm lại nhóm đó ở một bảng khác; nay hiệu quả
 * phương án nằm trong phần mở rộng của CHÍNH nhóm đang xem.
 */
/**
 * KHOẢNG BÁO CÁO CỦA PHẦN HIỆU QUẢ — mục 15.3, mặc định 12 tuần gần nhất.
 *
 * Nó CHỈ áp cho hai cột kết quả phương án. Hiện trạng vấn đề — HV đang gặp, case đang mở,
 * thiếu phương án — LUÔN là hiện tại (mục 15.2), vì "tuần trước có mấy case đang mở" không
 * phải câu ai hỏi. Hai phạm vi này được ghi ngay chỗ đọc để không ai đọc lẫn.
 */
const WINDOWS = [
  { key: '12', label: '12 tuần gần nhất', weeks: 12 },
  { key: '24', label: '24 tuần gần nhất', weeks: 24 },
  { key: 'all', label: 'Cả khoá', weeks: 0 },
] as const;

export function IssueAnalysis({ branchId }: { branchId: number | null }) {
  const { session } = useSession();
  const [ratio, setRatio] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [win, setWin] = useState<string>('12');
  const [drill, setDrill] = useState<{ category: string; code: string | null; label: string } | null>(null);

  const weeks = WINDOWS.find((w) => w.key === win)?.weeks ?? 12;
  const from = (() => {
    if (!weeks || !session?.demoDate) return null;
    const ms = Date.parse(`${session.demoDate}T00:00:00Z`) - weeks * 7 * 86_400_000;
    return new Date(ms).toISOString().slice(0, 10);
  })();

  const q = new URLSearchParams();
  if (branchId) q.set('branchId', String(branchId));
  q.set('lop', ratio ? 'normal' : 'ft');
  if (from) q.set('from', from);
  const query = q.toString();

  const skills = useApi<{ rows: SkillRow[] }>(`/issue-board/skills?${query}`, [query]);

  return (
    <div className="space-y-3">
      {/* ───── bước 1: hai tab loại lớp ───── */}
      <div className="flex flex-wrap items-center gap-1">
        <Seg active={!ratio} onClick={() => { setRatio(false); setCat(null); }}>Fast Track</Seg>
        <Seg active={ratio} onClick={() => { setRatio(true); setCat(null); }}>Normal</Seg>
        <span className="text-[11px] text-slate-500 ml-2">
          Hai loại lớp có bộ môn khác nhau nên không gộp vào một bảng.
        </span>
        <span className="flex-1" />
        <label className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Khoảng báo cáo hiệu quả</span>
          <select className="field w-40 text-xs" value={win} onChange={(e) => setWin(e.target.value)}>
            {WINDOWS.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
          </select>
        </label>
      </div>

      {/* HAI PHẠM VI, GHI NGAY CHỖ ĐỌC — đọc lẫn hai cái này là hiểu sai cả bảng (mục 15.2). */}
      <p className="text-[11px] text-slate-500 m-0">
        Hiện trạng vấn đề là <strong>hiện tại</strong>. Hai cột kết quả phương án tính trong{' '}
        <strong>{WINDOWS.find((w) => w.key === win)?.label.toLowerCase()}</strong>
        {from ? ` (từ ${from.split('-').reverse().join('/')})` : ''}.
      </p>

      {/* ───── bước 2: hàng kỹ năng ───── */}
      {skills.error ? (
        <ErrorState message={skills.error.message} hint={skills.error.hint} onRetry={skills.reload} />
      ) : skills.loading || !skills.data ? (
        <Skeleton rows={5} />
      ) : (
        <div className="surface-2 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Hạng mục</Th>
                <Th align="right" hint="Học viên khác nhau đang có case mở ở hạng mục này. Một em hai case vẫn là một em.">
                  HV đang gặp
                </Th>
                <Th align="right" hint="Số case đang mở — một em có thể có hai case song song.">Case đang mở</Th>
                <Th align="right" hint="Case đang mở mà chưa ai đề ra phương án nào. Đây là việc chặn.">
                  Thiếu PA học thuật
                </Th>
                <Th align="right" hint="Case đang mở và có ít nhất một phương án chưa khép.">Đang hỗ trợ</Th>
                <Th align="right" hint="Case đang mở nhưng chưa ai chọn phân loại vấn đề — phần lớn là dữ liệu cũ.">
                  Chưa phân loại
                </Th>
              </tr>
            </thead>
            <tbody>
              {skills.data.rows.map((r) => {
                const on = cat === r.code;
                return (
                  <tr key={r.code} className={`row-hover cursor-pointer ${on ? 'row-active' : ''}`}
                    onClick={() => setCat(on ? null : r.code)}>
                    <td className="td">
                      <span className={on ? 'text-slate-100' : 'text-slate-300'}>{r.label}</span>
                      <span className="block text-[10px] text-slate-500">
                        {on ? 'đang xem bảng phân loại bên dưới' : 'bấm để xem phân loại vấn đề'}
                      </span>
                    </td>
                    <Num n={r.students} />
                    <Num n={r.openCases} tone={r.openCases > 0 ? 'text-slate-200' : undefined} />
                    <Num n={r.noPlan} tone={r.noPlan > 0 ? 'text-amber-300' : undefined} />
                    <Num n={r.supporting} />
                    <Num n={r.unclassified} tone={r.unclassified > 0 ? 'text-amber-200/80' : undefined} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ───── bước 3: bảng phân loại của hạng mục đang chọn ───── */}
      {cat && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
          <p className="text-sm text-slate-100 m-0 mb-2">
            Phân loại vấn đề · {skills.data?.rows.find((r) => r.code === cat)?.label ?? cat}
          </p>
          <IssueClassTable query={`${query}&category=${cat}`} category={cat}
            onOpenCases={(code, label) => setDrill({ category: cat, code, label })} />
        </div>
      )}

      {/* ───── bước 4: bấm số ra đúng tập bản ghi ───── */}
      <CaseDrill drill={drill} query={query} onClose={() => setDrill(null)} />
    </div>
  );
}

function Seg({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {children}
    </button>
  );
}

function Num({ n, tone }: { n: number; tone?: string }) {
  return (
    <td className={`td text-right tabular-nums ${tone ?? 'text-slate-300'}`}>
      {n || <span className="text-slate-600">—</span>}
    </td>
  );
}

/**
 * BẢNG PHÂN LOẠI VẤN ĐỀ CỦA MỘT HẠNG MỤC — dùng chung cho trang Thực trạng và cho hồ sơ lớp.
 *
 * Năm con số mỗi hàng thuộc NĂM ĐƠN VỊ KHÁC NHAU (mục 15.2) nên bảng không chia chéo chúng:
 * một case có thể có ba phương án. Tỷ lệ chỉ xuất hiện ở phần mở rộng, theo LOẠI phương án,
 * luôn hiện n/N trước phần trăm, và nói rõ khi mẫu dưới năm.
 */
export function IssueClassTable({ query, category, onOpenCases }: {
  query: string; category: string;
  onOpenCases?: (code: string | null, label: string) => void;
}) {
  const [detail, setDetail] = useState(false);
  const { data, loading, error, reload } = useApi<Board>(`/issue-board?${query}`, [query]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;
  if (!data.rows.length) {
    return <p className="text-xs text-slate-500 m-0 py-2">Chưa có case nào ở {data.label ?? category}.</p>;
  }

  const cell = (n: number, code: string, label: string, tone?: string) => (
    <td className={`td text-right tabular-nums ${tone ?? 'text-slate-300'}`}>
      {n === 0 ? <span className="text-slate-600">—</span>
        : onOpenCases
          ? <button type="button" className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-[inherit] hover:underline"
              onClick={() => onOpenCases(code, label)}>{n}</button>
          : n}
    </td>
  );

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Phân loại vấn đề</Th>
              <Th align="right" hint="Học viên ĐANG HỌC và có case chưa xong ở phân loại này (hiện trạng). Em chỉ có case đã đóng, hoặc đã kết thúc khoá, không tính ở bảng này. Một em hai case cùng loại vẫn là một em.">HV đang gặp</Th>
              <Th align="right" hint="Số case mang phân loại này; trong ngoặc là số case chưa xong.">Case</Th>
              <Th align="right" hint="Số phương án đã đề ra cho các case đó. Một case có thể có nhiều phương án.">PA học thuật</Th>
              <Th align="right" hint="Phương án chưa khép lại — vẫn đang làm hoặc đang chờ kết quả.">Đang theo dõi</Th>
              <Th align="right" hint="Phương án đã kết thúc với kết quả khá hơn hoặc đỡ một phần.">Thành công</Th>
              <Th align="right" hint="Phương án đã kết thúc với kết quả không đổi hoặc tệ hơn.">Không thành công</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.code} className="row-hover">
                <td className="td">
                  <span className="text-slate-100">{r.label}</span>
                  {r.noPlan > 0 && (
                    <span className="block text-[10px] text-amber-300">{r.noPlan} case chưa có PA học thuật</span>
                  )}
                </td>
                {cell(r.students, r.code, r.label)}
                <td className="td text-right tabular-nums text-slate-300">
                  {onOpenCases
                    ? <button type="button" className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-[inherit] hover:underline"
                        onClick={() => onOpenCases(r.code, r.label)}>{r.cases}</button>
                    : r.cases}
                  {r.openCases > 0 && <span className="text-[10px] text-amber-300"> ({r.openCases} mở)</span>}
                </td>
                <td className="td text-right tabular-nums text-slate-300">
                  {r.plans || <span className="text-slate-600">—</span>}
                </td>
                <td className="td text-right tabular-nums text-slate-300">
                  {r.running || <span className="text-slate-600">—</span>}
                </td>
                <td className="td text-right tabular-nums">
                  {r.success ? <span className="text-emerald-300">{r.success}</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className="td text-right tabular-nums">
                  {r.failure ? <span className="text-rose-300">{r.failure}</span> : <span className="text-slate-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.note && <p className="text-[11px] text-slate-500 m-0">{data.note}</p>}

      {/* F05: phương án chưa xác định KHÔNG nằm trong bảng — liên kết riêng, ngoài bảng. */}
      <NeedsEvaluation count={data.needsEvaluation.count} url={`/issue-board/needs-evaluation?${query}`} />

      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(!detail)}>
        {detail ? 'Ẩn hiệu quả từng loại PA học thuật' : 'Xem hiệu quả từng loại PA học thuật'}
      </button>

      {detail && (
        data.plans.length === 0 ? (
          <p className="text-xs text-slate-500 m-0">
            Chưa có PA học thuật nào kết thúc ở hạng mục này, nên chưa nói được loại nào hiệu quả.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Loại PA học thuật</Th>
                  <Th align="right" hint="Phương án đã kết thúc với kết quả có tiến bộ rõ.">Có tiến bộ</Th>
                  <Th align="right" hint="Phương án đã kết thúc với kết quả tiến bộ một phần.">Tiến bộ một phần</Th>
                  <Th align="right" hint="Có tiến bộ + tiến bộ một phần, trên số phương án đã kết thúc CÓ kết quả xác định. Chưa đủ dữ liệu không vào mẫu số.">Có cải thiện</Th>
                </tr>
              </thead>
              <tbody>
                {data.plans.map((p) => (
                  <tr key={p.kind} className="row-hover">
                    <td className="td text-slate-100">{p.label}</td>
                    <td className="td text-right tabular-nums text-slate-300">{p.improved || <span className="text-slate-600">—</span>}</td>
                    <td className="td text-right tabular-nums text-slate-300">{p.partial || <span className="text-slate-600">—</span>}</td>
                    {/* n/N ĐỨNG TRƯỚC phần trăm, và N=0 / mẫu nhỏ do <TyLe> quyết định — không tự vẽ phần trăm. */}
                    <td className="td text-right"><TyLe n={p.success} N={p.decided} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <SectionNote>
        Năm cột số là <strong>năm đơn vị khác nhau</strong> nên đừng chia chúng cho nhau: một case
        có thể có nhiều phương án. Mẫu số của tỷ lệ chỉ gồm phương án <strong>đã kết thúc và có
        kết quả xác định</strong> — phương án chưa đủ dữ liệu để đánh giá không bị tính là thất bại.
      </SectionNote>
    </div>
  );
}

/** Ngăn kéo hai tầng: danh sách case tạo nên con số vừa bấm, rồi chính case đó. */
function CaseDrill({ drill, query, onClose }: {
  drill: { category: string; code: string | null; label: string } | null;
  query: string; onClose: () => void;
}) {
  const [openCase, setOpenCase] = useState<number | null>(null);
  const qs = drill ? `${query}&category=${drill.category}${drill.code ? `&code=${drill.code}` : ''}` : null;
  const { data, loading, error } = useApi<{ rows: CaseRow[] }>(qs ? `/issue-board/cases?${qs}` : null, [qs]);

  return (
    <>
      <Drawer open={!!drill} onClose={onClose} width="max-w-2xl"
        title={drill?.label ?? ''} subtitle="Đúng những case tạo nên con số vừa bấm">
        {error ? <ErrorState message={error.message} hint={error.hint} />
          : loading || !data ? <Skeleton rows={5} />
          : !data.rows.length ? <Empty title="Không có case nào trong tập này" />
          : (
            <ul className="list-none p-0 m-0 space-y-1.5">
              {data.rows.map((r) => (
                <li key={r.caseId}>
                  <button type="button" onClick={() => setOpenCase(r.caseId)}
                    className="w-full text-left rounded-lg border px-3 py-2 bg-transparent hover:brightness-125"
                    style={{ borderColor: 'var(--line)' }}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-100">{r.studentName}</span>
                      <span className="text-[11px] text-slate-500">{r.classCode ?? r.studentCode}</span>
                      <Status kind={r.status === 'done' ? 'done' : r.status === 'open' ? 'idle' : 'doing'}>
                        {caseStatusLabel(r.status)}
                      </Status>
                      {r.sosLevel ? <Level tone={sosTone(r.sosLevel)}>{sosLabel(r.sosLevel)}</Level> : null}
                    </span>
                    <span className="block text-xs text-slate-300 mt-0.5">{r.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {r.issueLabel} · mở {fmtDate(r.detectedAt)} ·{' '}
                      {r.planCount ? `${r.planCount} PA học thuật` : 'chưa có PA học thuật'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        {data?.rows.length ? (
          <SectionNote>
            Mở hồ sơ em để xem cả hành trình:{' '}
            {data.rows.slice(0, 3).map((r) => (
              <Link key={r.studentId} className="text-slate-400 mr-2" to={`/hoc-vien/${r.studentId}`}>
                {r.studentName}
              </Link>
            ))}
            {data.rows.length > 3 && <span className="text-slate-600">…</span>}
          </SectionNote>
        ) : null}
      </Drawer>

      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} width="max-w-3xl" title="Vấn đề - Case">
        {openCase !== null && <CasePanel caseId={openCase} />}
      </Drawer>
    </>
  );
}
