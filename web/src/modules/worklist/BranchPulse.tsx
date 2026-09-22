import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Skeleton, Th } from '../../ui/ui.tsx';

/**
 * "VIỆC CẦN LƯU Ý" — mục 9.2.
 *
 * Bảng này trả lời AI PHẢI LÀM GÌ. Bảng ở tab Thực trạng trả lời HỌC VIÊN ĐANG YẾU Ở ĐÂU.
 * Owner giữ cả hai và phân vai rõ, nên hai bảng cố tình không dùng chung bộ cột.
 *
 * Ba thứ owner yêu cầu thêm ở vòng 4, và lý do từng thứ:
 *
 *   THU GỌN ĐƯỢC   — Quản lý xem xong buổi sáng thì gập lại, để phần "việc của tôi" ngay bên
 *                     dưới không bị đẩy khỏi màn hình suốt ngày.
 *   HÀNG TỔNG      — không có nó thì phải tự cộng bằng mắt để biết cả chi nhánh đang nợ bao
 *                     nhiêu, mà đó chính là con số người ta đi tìm trước tiên.
 *   SẮP THEO CỘT   — "lớp nào quá hạn nhiều nhất" là một câu hỏi thật, và bấm tiêu đề cột là
 *                     cách trả lời nó nhanh nhất mà không cần thêm một bộ lọc nào.
 *
 * Bảng theo người KHÔNG tô màu tốt/xấu và KHÔNG xếp hạng. Một bảng "giáo viên nào chậm nhất"
 * là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào — nó biến công cụ điều phối thành công
 * cụ đánh giá, và người ta sẽ học cách làm đẹp số thay vì làm việc.
 */

type Metrics = {
  size: number; needSupport: number; cases: number;
  noPlan: number; overdueUpdate: number; pendingApproval: number;
};
type Row = {
  /* Góc nhìn chi nhánh */
  id?: number; label: string; metrics: Metrics;
  /* Góc nhìn nhóm loại lớp */
  key?: string; classes?: { id: number; label: string; metrics: Metrics }[];
};
type PersonRow = {
  id: number; name: string; classCount: number;
  mtPending: number; mtOverdue: number;
  cases: number; noPlan: number; overdueUpdate: number; pendingApproval: number;
};
type Pulse = {
  mode: 'branches' | 'groups';
  rows: Row[]; total: Metrics; people: PersonRow[]; canApprove: boolean;
};

/** Cột của bảng lớp: khoá dữ liệu, nhãn, và một câu giải thích khi rê chuột. */
const CLASS_COLS: { key: keyof Metrics; label: string; hint: string; tone?: 'warn' | 'danger' }[] = [
  { key: 'size', label: 'Sĩ số', hint: 'Học viên đang học, không tính em đã kết thúc.' },
  { key: 'needSupport', label: 'HV cần hỗ trợ',
    hint: 'Đếm HỌC VIÊN: một em có ba case vẫn chỉ tính một lần.' },
  { key: 'cases', label: 'Case', hint: 'Tổng số case đang mở — đơn vị khác cột bên trái.' },
  { key: 'noPlan', label: 'Thiếu PA học thuật', tone: 'warn',
    hint: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'overdueUpdate', label: 'PA học thuật cần cập nhật', tone: 'danger',
    hint: 'Đếm PHƯƠNG ÁN đã qua hạn cập nhật kết quả tuần mà chưa ai cập nhật — một case có hai phương án quá hạn tính hai.' },
  { key: 'pendingApproval', label: 'Đề xuất chờ duyệt', tone: 'danger',
    hint: 'Phương án giáo viên đề xuất, đang chờ Quản lý trả lời.' },
];

const PEOPLE_COLS: { key: keyof PersonRow; label: string; hint: string }[] = [
  { key: 'mtPending', label: 'MT chưa nhập', hint: 'Ô điểm còn trống ở các lượt MT đã thi.' },
  { key: 'mtOverdue', label: 'MT quá hạn nhập', hint: 'Trong số trên, phần đã qua hạn nhập điểm.' },
  { key: 'cases', label: 'Case phụ trách', hint: 'Case mà người này là NGƯỜI PHỤ TRÁCH chính — không phải mọi case của lớp họ dạy.' },
  { key: 'noPlan', label: 'Thiếu PA học thuật', hint: 'Case chưa ai ghi sẽ làm gì.' },
  { key: 'overdueUpdate', label: 'PA học thuật cần cập nhật', hint: 'Phương án của case người này phụ trách đã qua hạn cập nhật kết quả tuần.' },
  { key: 'pendingApproval', label: 'Đề xuất chờ duyệt', hint: 'Đề xuất của người này đang chờ trả lời.' },
];

/**
 * BẤM MỘT CON SỐ PHẢI RA ĐÚNG NHỮNG BẢN GHI TẠO NÊN NÓ (mục 3.1 · 4.4) — nhưng "đúng chỗ"
 * khác nhau tuỳ cột đang đếm cái gì:
 *
 *   ĐẾM HỌC VIÊN  → mở danh sách học viên, vì đó là thứ con số đang nói tới.
 *   ĐẾM VIỆC      → LỌC ngay danh sách Việc cần làm ở dưới, không nhảy sang màn khác.
 *                   Nhảy đi là mất chỗ đang đứng, mà việc thì vẫn ở màn này.
 */
const COL_STUDENTS: Partial<Record<keyof Metrics, string>> = {
  needSupport: 'case_working',
  cases: 'case_working',
};
const COL_WORK: Partial<Record<keyof Metrics, string>> = {
  noPlan: 'no_plan',
  overdueUpdate: 'result',
  pendingApproval: 'decide',
};

export function BranchPulse({ branchId, activeGroup, onGroup }: {
  branchId: number | null;
  /** Nhóm việc đang lọc ở danh sách bên dưới — để bảng tô sáng đúng cột đang áp dụng. */
  activeGroup?: string | null;
  onGroup?: (g: string | null) => void;
}) {
  const navigate = useNavigate();
  const { data, loading } = useApi<Pulse | null>(
    `/branch-pulse${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );
  const [open, setOpen] = useState(true);
  /*
   * THEO LỚP hay THEO GIÁO VIÊN — hai góc nhìn của CÙNG một khu tổng hợp (mục 3.4), không
   * phải hai bảng xếp chồng. Chỉ có góc nhìn theo giáo viên khi đã chọn MỘT chi nhánh: trộn
   * giáo viên của năm chi nhánh vào một bảng thì không ai đọc ra điều gì.
   */
  const [view, setView] = useState<'classes' | 'people'>('classes');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ col: keyof Metrics; dir: 'asc' | 'desc' } | null>(null);
  const [pSort, setPSort] = useState<{ col: keyof PersonRow; dir: 'asc' | 'desc' } | null>(null);

  if (loading) return <Card title="Việc cần lưu ý"><Skeleton rows={3} /></Card>;
  if (!data) return null;

  /* Chưa chọn chi nhánh thì không có góc nhìn theo giáo viên — và cũng không giữ lại nút. */
  const canSeePeople = branchId !== null && data.people.length > 0;
  const mode = canSeePeople ? view : 'classes';

  const cols = data.canApprove ? CLASS_COLS : CLASS_COLS.filter((c) => c.key !== 'pendingApproval');

  const num = (n: number, tone?: 'warn' | 'danger', onClick?: () => void) => {
    const cls = `tabular-nums ${n === 0 ? 'text-slate-600'
      : tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-slate-100'}`;
    if (!n || !onClick) return <span className={cls}>{n}</span>;
    return (
      <button type="button" onClick={onClick}
        className={`appearance-none bg-transparent border-0 p-0 underline decoration-dotted underline-offset-4 cursor-pointer ${cls}`}>
        {n}
      </button>
    );
  };

  const goto = (col: keyof Metrics, row: { id?: number; classId?: number }) => {
    /* Cột đếm VIỆC: lọc tại chỗ, không rời màn. */
    const work = COL_WORK[col];
    if (work && onGroup) { onGroup(activeGroup === work ? null : work); return; }
    const f = COL_STUDENTS[col];
    const p = new URLSearchParams();
    if (f) p.set('view', f);
    if (row.classId) p.set('open', String(row.classId));
    if (data.mode === 'branches' && row.id) p.set('branchId', String(row.id));
    else if (branchId) p.set('branchId', String(branchId));
    navigate(`/hoc-vien?${p.toString()}`);
  };

  /* Sắp xếp áp cho các hàng thân bảng; HÀNG TỔNG luôn đứng yên ở vị trí của nó (mục 9.2). */
  const sorted = (rows: Row[]) => {
    if (!sort) return rows;
    const k = sort.col;
    return [...rows].sort((a, b) => (sort.dir === 'desc'
      ? b.metrics[k] - a.metrics[k] : a.metrics[k] - b.metrics[k]));
  };
  const sortOf = (key: keyof Metrics) => ({
    active: sort?.col === key,
    dir: (sort?.col === key ? sort.dir : 'desc') as 'asc' | 'desc',
    onSort: () => setSort((s) => (s?.col === key
      ? { col: key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { col: key, dir: 'desc' })),
  });

  const pSortOf = (key: keyof PersonRow) => ({
    active: pSort?.col === key,
    dir: (pSort?.col === key ? pSort.dir : 'desc') as 'asc' | 'desc',
    onSort: () => setPSort((x) => (x?.col === key
      ? { col: key, dir: x.dir === 'desc' ? 'asc' : 'desc' }
      : { col: key, dir: 'desc' })),
  });
  const sortedPeople = pSort
    ? [...data.people].sort((a, b) => (pSort.dir === 'desc'
        ? (b[pSort.col] as number) - (a[pSort.col] as number)
        : (a[pSort.col] as number) - (b[pSort.col] as number)))
    : data.people;

  const metricCells = (m: Metrics, row: { id?: number; classId?: number }) =>
    cols.map((c) => (
      <td key={c.key} className="td text-right">{num(m[c.key], c.tone, () => goto(c.key, row))}</td>
    ));

  return (
    <Card
      title={
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="appearance-none bg-transparent border-0 p-0 text-[inherit] font-[inherit] cursor-pointer flex items-center gap-2">
          <span className="text-slate-500" aria-hidden>{open ? '▾' : '▸'}</span>
          Việc cần lưu ý
          {!open && (
            <span className="text-xs font-normal text-slate-500">
              {data.total.cases} case · {data.total.overdueUpdate} PA học thuật cần cập nhật
            </span>
          )}
        </button>
      }
      action={open && canSeePeople ? (
        <div className="flex flex-wrap gap-1">
          <button className={`btn btn-sm ${mode === 'classes' ? 'btn-primary' : ''}`}
            onClick={() => setView('classes')}>Theo lớp</button>
          <button className={`btn btn-sm ${mode === 'people' ? 'btn-primary' : ''}`}
            onClick={() => setView('people')}>Theo giáo viên</button>
        </div>
      ) : undefined}
      bodyClass="p-0"
    >
      {!open || mode === 'people' ? null : data.rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400 m-0">
          Không lớp nào đang tồn việc. Bảng này chỉ hiện chỗ đang tắc, nên trống là tin tốt.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th className="sticky-col">{data.mode === 'branches' ? 'Chi nhánh' : 'Lớp'}</Th>
                {cols.map((c) => (
                  <Th key={c.key} align="right" hint={c.hint} sort={sortOf(c.key)}>{c.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/*
                HÀNG TỔNG CẢ CHI NHÁNH ĐỨNG ĐẦU khi đã chọn một chi nhánh — đó là con số
                người ta hỏi trước tiên, nên nó không được nằm cuối bảng phải cuộn mới thấy.
              */}
              {data.mode === 'groups' && (
                <tr className="bg-white/5">
                  <td className="td sticky-col whitespace-nowrap font-medium text-slate-100">Cả chi nhánh</td>
                  {metricCells(data.total, {})}
                </tr>
              )}

              {sorted(data.rows).map((r) => (
                data.mode === 'branches' ? (
                  <tr key={r.id} className="row-hover">
                    <td className="td sticky-col whitespace-nowrap">
                      <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer"
                        onClick={() => navigate(`/?cn=${r.id}`)}>{r.label}</button>
                    </td>
                    {metricCells(r.metrics, { id: r.id })}
                  </tr>
                ) : (
                  <FragmentRows key={r.key} row={r} cols={cols} num={num} goto={goto}
                    expanded={expanded.has(r.key!)}
                    onToggle={() => setExpanded((s) => {
                      const next = new Set(s);
                      if (next.has(r.key!)) next.delete(r.key!); else next.add(r.key!);
                      return next;
                    })} />
                )
              ))}

              {/* Chưa chọn chi nhánh thì hàng tổng nằm CUỐI, đúng thói quen đọc một bảng cộng dồn. */}
              {data.mode === 'branches' && (
                <tr className="bg-white/5">
                  <td className="td sticky-col whitespace-nowrap font-medium text-slate-100">Tất cả chi nhánh</td>
                  {metricCells(data.total, {})}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {open && mode === 'people' && (
        <>
          <div className="table-scroll border-t" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th className="sticky-col">Giáo viên</Th>
                  <Th align="right" hint="Số lớp người này dạy trong chi nhánh đang xem."
                    sort={pSortOf('classCount')}>Lớp</Th>
                  {PEOPLE_COLS.map((c) => (
                    <Th key={c.key} align="right" hint={c.hint} sort={pSortOf(c.key)}>{c.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPeople.map((x) => (
                  <tr key={x.id}>
                    <td className="td sticky-col whitespace-nowrap text-slate-100">{x.name}</td>
                    <td className="td text-right">{num(x.classCount)}</td>
                    {PEOPLE_COLS.map((c) => (
                      <td key={c.key} className="td text-right">{num(x[c.key] as number)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 text-[11px] text-slate-500 m-0 border-t" style={{ borderColor: 'var(--line)' }}>
            Bảng này để biết <strong>cần nói chuyện với ai</strong>, không phải để xếp hạng — nên
            không có màu tốt/xấu. Số ở đây là việc đang tồn, và tồn vì nhiều lý do khác nhau. Số
            case là case người này <strong>phụ trách</strong>, còn đề xuất chờ duyệt là đề xuất
            <strong> chính họ gửi</strong> — không đếm sang đầu người nhập hộ. Tất cả chỉ tính
            trong chi nhánh đang xem.
          </p>
        </>
      )}
    </Card>
  );
}

/**
 * Một NHÓM LOẠI LỚP: hàng nhóm mang tổng của nhóm, mở ra mới thấy từng lớp.
 *
 * Mặc định thu gọn (mục 9.2). Quản lý một chi nhánh mở màn lên cần thấy "Normal đang nặng
 * hơn FT", rồi mới mở đúng nhóm đó ra — chứ không phải đọc hai mươi dòng lớp để tự rút ra
 * điều đó.
 */
function FragmentRows({ row, cols, num, goto, expanded, onToggle }: {
  row: Row;
  cols: { key: keyof Metrics; label: string; hint: string; tone?: 'warn' | 'danger' }[];
  num: (n: number, tone?: 'warn' | 'danger', onClick?: () => void) => React.ReactNode;
  goto: (col: keyof Metrics, row: { id?: number; classId?: number }) => void;
  expanded: boolean; onToggle: () => void;
}) {
  return (
    <Fragment>
      <tr className="row-hover cursor-pointer" onClick={onToggle}>
        <td className="td sticky-col whitespace-nowrap">
          <span className="text-slate-500 mr-1.5" aria-hidden>{expanded ? '▾' : '▸'}</span>
          <span className="text-slate-100">{row.label}</span>
          <span className="text-[11px] text-slate-500 ml-1.5">{row.classes?.length ?? 0} lớp</span>
        </td>
        {cols.map((c) => (
          <td key={c.key} className="td text-right">{num(row.metrics[c.key], c.tone)}</td>
        ))}
      </tr>
      {expanded && (row.classes ?? []).map((c) => (
        <tr key={c.id} className="row-hover">
          <td className="td sticky-col whitespace-nowrap pl-8">
            <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => goto('cases', { classId: c.id })}>{c.label}</button>
          </td>
          {cols.map((col) => (
            <td key={col.key} className="td text-right">
              {num(c.metrics[col.key], col.tone, () => goto(col.key, { classId: c.id }))}
            </td>
          ))}
        </tr>
      ))}
    </Fragment>
  );
}
