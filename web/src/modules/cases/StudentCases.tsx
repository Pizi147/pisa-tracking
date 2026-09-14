import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Alert, Empty, ErrorState, Info, Level, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { fmtDate, sosTone } from '../../lib/format.ts';
import { CasePanel } from './CasePanel.tsx';
import { CASE_CATEGORY_LABEL } from '@shared/domain/index.ts';

/**
 * CÁC CASE CỦA MỘT HỌC VIÊN — mỗi case một KHỐI ĐỘC LẬP (mục 7.2, 7.4).
 *
 * Đây là phần owner báo hỏng nặng nhất: bảng theo kỹ năng phía trên chỉ mở được MỘT case
 * đại diện cho mỗi hạng mục, nên em có hai case Reading song song thì cái thứ hai không có
 * đường nào vào. Thêm một case Ý thức/Khác lại làm case SOS cũ trông như biến mất.
 *
 * BỐN QUYẾT ĐỊNH VỀ CÁCH BÀY:
 *
 * 1. MỖI CASE MỘT KHỐI, MỞ ĐÓNG ĐỘC LẬP. Mở một case không đóng case khác — người ta hay
 *    cần so hai case cạnh nhau.
 * 2. MỚI NHẤT TRƯỚC, theo NGÀY TẠO. Một ghi chú mới trên case cũ KHÔNG làm nó nhảy lên
 *    đầu: thứ tự mà người đọc dựa vào để định vị phải đứng yên.
 * 3. MẶC ĐỊNH MỞ case đang xử lý, THU GỌN case đã hoàn thành. Cái đang chạy là cái cần
 *    nhìn; cái đã xong vẫn phải thấy được là nó tồn tại.
 * 4. PHẠM VI NÓI RÕ. "Lộ trình này" và "Toàn bộ hành trình" là hai câu hỏi khác nhau, và
 *    nhìn một danh sách ngắn mà không biết mình đang xem phạm vi nào thì dễ tưởng lịch sử
 *    đã mất.
 */
export function StudentCases({ studentId, cycleId, cycleLabel }: {
  studentId: number; cycleId: number | null; cycleLabel?: string | null;
}) {
  const [allJourney, setAllJourney] = useState(false);
  const [category, setCategory] = useState('');
  const [showDone, setShowDone] = useState(true);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const qs = new URLSearchParams({ studentId: String(studentId) });
  if (!allJourney && cycleId) qs.set('cycleId', String(cycleId));
  const { data, loading, error, reload } = useApi<{ rows: any[] }>(
    `/cases?${qs}`, [studentId, cycleId, allJourney],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Skeleton rows={5} />;

  const all = data?.rows ?? [];
  const categories = [...new Set(all.map((c) => c.category).filter(Boolean))];
  const rows = all
    .filter((c) => !category || c.category === category)
    .filter((c) => showDone || c.status !== 'done');

  /** Mặc định: case đang xử lý mở, case đã hoàn thành thu gọn. */
  const isOpen = (c: any) => open[c.id] ?? c.status !== 'done';

  return (
    <div className="space-y-3">
      {/* ─────────────────────────────────────────── bộ lọc và phạm vi */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-slate-500 mr-1">Phạm vi</span>
        <button className={`btn btn-sm ${!allJourney ? 'btn-primary' : ''}`}
          onClick={() => setAllJourney(false)} disabled={!cycleId}>
          Lộ trình này{cycleLabel ? ` · ${cycleLabel}` : ''}
        </button>
        <button className={`btn btn-sm ${allJourney ? 'btn-primary' : ''}`}
          onClick={() => setAllJourney(true)}>
          Toàn bộ hành trình
        </button>
        <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
        <button className={`btn btn-sm ${!category ? 'btn-primary' : ''}`} onClick={() => setCategory('')}>
          Mọi hạng mục
        </button>
        {categories.map((k) => (
          <button key={k} className={`btn btn-sm ${category === k ? 'btn-primary' : ''}`}
            onClick={() => setCategory(category === k ? '' : k)}>
            {CASE_CATEGORY_LABEL[k as keyof typeof CASE_CATEGORY_LABEL] ?? k}
          </button>
        ))}
        <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Hiện cả case đã hoàn thành
        </label>
      </div>

      {rows.length === 0 ? (
        <Empty
          title={all.length === 0 ? 'Chưa có case nào trong phạm vi này' : 'Không có case nào khớp bộ lọc'}
          hint={all.length === 0 && !allJourney
            ? 'Thử "Toàn bộ hành trình" — case của lớp và lộ trình trước vẫn còn nguyên.'
            : undefined}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <section key={c.id} className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--line)', opacity: c.status === 'done' ? 0.75 : 1 }}>
              {/* ─── Đầu khối: tên, hạng mục, trạng thái. Bấm tên là mở/đóng (mục 7.9). */}
              <button
                type="button"
                className="w-full text-left px-3 py-2 flex flex-wrap items-center gap-2 bg-transparent border-0"
                onClick={() => setOpen((m) => ({ ...m, [c.id]: !isOpen(c) }))}
                aria-expanded={isOpen(c)}
              >
                <span className="text-slate-500 text-xs w-4">{isOpen(c) ? '▾' : '▸'}</span>
                <span className="text-sm font-semibold text-slate-100">{c.title}</span>
                <Info>{c.categoryLabel ?? c.category ?? '—'}</Info>
                {c.sosLevel !== null && c.sosLevel > 0 && (
                  <Level tone={sosTone(c.sosLevel)}>SOS {c.sosLevel}</Level>
                )}
                <Status kind={c.status === 'done' ? 'done' : c.state === 'no_plan' ? 'idle' : 'doing'}>
                  {c.status === 'done' ? 'Đã hoàn thành'
                    : c.state === 'no_plan' ? 'Chưa có phương án' : 'Đang xử lý'}
                </Status>
                {c.parallel && <Info>Song song</Info>}
                {c.previousCaseId && <Info>Tái phát</Info>}
                {c.dueOverdue && <Alert>Quá hạn</Alert>}
              </button>

              {/* ─── Dòng phụ: nguồn, ngày tạo, lớp/lộ trình — thông tin phụ, không thành node. */}
              <p className="px-3 pb-2 m-0 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  {c.originKind === 'mock' ? 'Sinh từ kết quả bài đánh giá'
                    : c.originKind === 'manager_task' ? 'Quản lý giao' : 'Giáo viên ghi nhận'}
                </span>
                <span>Mở {fmtDate(c.detectedAt)}</span>
                {c.classCode && <span>Lớp {c.classCode}</span>}
                {c.reporterName && <span>{c.reporterName}</span>}
                {c.interventionCount > 0 && <span>{c.interventionCount} lượt đã làm</span>}
              </p>

              {isOpen(c) && (
                <div className="px-3 pb-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
                  <CasePanel caseId={c.id} compact hideHeader />
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <SectionNote>
        Mỗi case là một bản ghi riêng có lịch sử riêng — thêm case mới KHÔNG thay thế case nào.
        Một em có thể có nhiều case cùng một môn, và case của lớp cũ vẫn xem được ở
        <strong> Toàn bộ hành trình</strong>.
      </SectionNote>
    </div>
  );
}
