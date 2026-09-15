import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Info, Skeleton } from '../../ui/ui.tsx';

/**
 * SỰ KIỆN NỔI BẬT — khối nhỏ ở đầu Toàn cảnh (mục 3.5).
 *
 * Thay cho "Mốc của lớp" cũ, vốn nằm lẫn trong danh sách việc cần làm. Một chuyện SẮP XẢY RA
 * không phải một việc đang nợ: để chung thì danh sách việc lúc nào cũng dài, và cái gì cũng
 * đỏ thì không cái nào đỏ nữa.
 *
 * Ba tuần, chọn một lần một. Normal và FT đứng hai cột riêng vì hai loại lớp có hai loại sự
 * kiện. Bấm một con số là mở đúng danh sách tạo ra con số đó.
 *
 * KHÔNG có nhãn đỏ ở đây — sự kiện chưa đến thì không quá hạn được.
 */

type ClassRow = { id: number; code: string; students: number };
type MockRow = { id: number | null; code: string; students: number; attemptNo: number | null };
type Week = {
  weekStart: string; code: string; range: string; offset: number;
  normal: { progressClasses: ClassRow[]; finalClasses: ClassRow[]; endingClasses: ClassRow[] };
  ft: { mockClasses: MockRow[]; mockStudents: number; examStudents: number };
};
type Data = {
  weeks: Week[];
  examMonthOnly: { months: string[]; students: number };
  scopeEmpty: boolean;
};

const TAB_LABEL = ['Tuần này', 'Tuần tới', 'Tuần nữa'];

export function Highlights({ branchId }: { branchId: number | null }) {
  const navigate = useNavigate();
  const { data, loading } = useApi<Data | null>(
    `/highlights${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );
  /*
   * MẶC ĐỊNH THU GỌN. Đây là thông tin để LIẾC, không phải để làm — mở sẵn thì nó chiếm
   * đầu màn hình mỗi ngày trong khi việc cần làm bị đẩy xuống dưới.
   */
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  if (loading) return <Card title="Sự kiện nổi bật"><Skeleton rows={2} /></Card>;
  if (!data || data.scopeEmpty) return null;

  const week = data.weeks[tab] ?? data.weeks[0];
  if (!week) return null;

  /* Tổng số sự kiện của một tuần — dùng cho dòng tóm tắt khi khối đang gập. */
  const countOf = (w: Week) =>
    w.normal.progressClasses.length + w.normal.finalClasses.length + w.normal.endingClasses.length
    + w.ft.mockClasses.length + (w.ft.examStudents > 0 ? 1 : 0);

  const thisWeek = data.weeks[0];

  return (
    <Card
      title={
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="appearance-none bg-transparent border-0 p-0 text-[inherit] font-[inherit] cursor-pointer flex flex-wrap items-center gap-2">
          <span className="text-slate-500" aria-hidden>{open ? '▾' : '▸'}</span>
          Sự kiện nổi bật
          {!open && thisWeek && (
            <span className="text-xs font-normal text-slate-500">
              {countOf(thisWeek) === 0
                ? 'tuần này không có mốc nào'
                : `tuần này: ${summaryLine(thisWeek)}`}
            </span>
          )}
        </button>
      }
      bodyClass="p-0"
    >
      {!open ? null : (
        <>
          <div className="px-4 py-3 border-b flex flex-wrap items-center gap-1.5"
            style={{ borderColor: 'var(--line)' }}>
            {data.weeks.map((w, i) => (
              <button key={w.weekStart} className={`btn btn-sm ${tab === i ? 'btn-primary' : ''}`}
                onClick={() => setTab(i)}>
                {TAB_LABEL[i]}
                <span className="opacity-70 ml-1.5 text-[11px]">{w.code}</span>
              </button>
            ))}
            <span className="text-[11px] text-slate-500 ml-1">{week.range}</span>
          </div>

          <div className="grid gap-px sm:grid-cols-2" style={{ background: 'var(--line)' }}>
            {/* ───────────────────────────────────── Normal */}
            <div className="p-4" style={{ background: 'var(--card)' }}>
              <h3 className="text-xs uppercase tracking-wide text-slate-500 m-0 mb-2">Lớp Normal</h3>
              <ul className="list-none p-0 m-0 space-y-1.5">
                <EventRow label="Bài kiểm tra giữa khoá" rows={week.normal.progressClasses}
                  onOpen={(id) => navigate(`/hoc-vien/lop/${id}`)} unit="lớp" />
                <EventRow label="Bài kiểm tra cuối khoá" rows={week.normal.finalClasses}
                  onOpen={(id) => navigate(`/hoc-vien/lop/${id}`)} unit="lớp" />
                <EventRow label="Hết chương trình — chuẩn bị chuyển tiếp" rows={week.normal.endingClasses}
                  onOpen={(id) => navigate(`/hoc-vien/lop/${id}`)} unit="lớp" />
              </ul>
            </div>

            {/* ───────────────────────────────────── FT */}
            <div className="p-4" style={{ background: 'var(--card)' }}>
              <h3 className="text-xs uppercase tracking-wide text-slate-500 m-0 mb-2">Lớp Fast Track</h3>
              <ul className="list-none p-0 m-0 space-y-1.5">
                {week.ft.mockClasses.length === 0 ? (
                  <li className="text-xs text-slate-600">Không có MT nào trong tuần.</li>
                ) : (
                  <li>
                    <div className="text-xs text-slate-400">
                      MT trong tuần · <strong className="text-slate-100 tabular-nums">{week.ft.mockStudents}</strong> học viên
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {week.ft.mockClasses.map((m, i) => (
                        <button key={`${m.id}-${m.attemptNo}-${i}`} className="btn btn-sm"
                          onClick={() => m.id && navigate(`/hoc-vien/lop/${m.id}`)}>
                          {m.code}
                          {m.attemptNo !== null && <span className="opacity-70 ml-1">MT{m.attemptNo}</span>}
                          <span className="opacity-70 ml-1.5 tabular-nums">{m.students} em</span>
                        </button>
                      ))}
                    </div>
                  </li>
                )}
                <li className="text-xs text-slate-400">
                  Dự kiến thi IELTS trong tuần ·{' '}
                  <strong className={week.ft.examStudents ? 'text-slate-100 tabular-nums' : 'text-slate-600 tabular-nums'}>
                    {week.ft.examStudents}
                  </strong> học viên
                </li>
              </ul>
            </div>
          </div>

          {/*
            CHỈ BIẾT THÁNG THÌ KHÔNG XẾP VÀO TUẦN NÀO (mục 3.5).
            Nói thẳng ra là chưa xác định tuần, thay vì lặng lẽ xếp các em vào tuần đầu tháng
            — một lịch không ai từng chốt mà nhìn thì y như đã chốt.
          */}
          {data.examMonthOnly.students > 0 && (
            <p className="px-4 py-2.5 m-0 text-[11px] text-slate-500 border-t"
              style={{ borderColor: 'var(--line)' }}>
              <Info>Chưa xác định tuần</Info>{' '}
              {data.examMonthOnly.students} học viên mới biết tháng dự kiến thi
              {' '}({data.examMonthOnly.months.map(monthLabel).join(', ')}), nên không xếp vào tuần nào ở trên.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function EventRow({ label, rows, onOpen, unit }: {
  label: string; rows: ClassRow[]; onOpen: (id: number) => void; unit: string;
}) {
  return (
    <li>
      <div className="text-xs text-slate-400">
        {label} ·{' '}
        <strong className={rows.length ? 'text-slate-100 tabular-nums' : 'text-slate-600 tabular-nums'}>
          {rows.length}
        </strong> {unit}
      </div>
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {rows.map((r) => (
            <button key={r.id} className="btn btn-sm" onClick={() => onOpen(r.id)}>
              {r.code}<span className="opacity-70 ml-1.5 tabular-nums">{r.students} em</span>
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function summaryLine(w: Week): string {
  const bits: string[] = [];
  const n = w.normal.progressClasses.length + w.normal.finalClasses.length;
  if (n) bits.push(`${n} lớp có bài kiểm tra`);
  if (w.normal.endingClasses.length) bits.push(`${w.normal.endingClasses.length} lớp hết chương trình`);
  if (w.ft.mockStudents) bits.push(`${w.ft.mockStudents} em có MT`);
  if (w.ft.examStudents) bits.push(`${w.ft.examStudents} em dự kiến thi`);
  return bits.join(' · ');
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
function monthLabel(m: string): string {
  const [y, mm] = m.split('-');
  return MONTHS.includes(mm) ? `tháng ${Number(mm)}/${y}` : m;
}
