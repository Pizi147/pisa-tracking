import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { NeedsEvaluation } from '../cases/NeedsEvaluation.tsx';
import { caseCategoryLabel } from '@shared/domain/index.ts';

type Row = {
  code: string; label: string;
  cases: number; openCases: number;
  /** HV ĐANG GẶP — chỉ em có case chưa kết luận (hiện trạng). */
  students: number;
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
  rows: Row[]; plans: PlanKind[]; studentCount: number; note: string | null;
  /** Phương án đã kết thúc mà chưa có kết quả xác định — ở NGOÀI bảng hiệu quả (F05). */
  needsEvaluation: { count: number; ids: number[] };
};

export function IssueTable({ classId, category }: { classId: number; category: string }) {
  const [detail, setDetail] = useState(false);
  const { data, loading, error, reload } = useApi<Board>(
    `/classes/${classId}/issue-board?category=${category}`, [classId, category],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;
  if (!data.rows.length) {
    return (
      <p className="text-xs text-slate-500 m-0 py-2">
        Lớp này chưa có case nào ở {caseCategoryLabel(category)}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Phân loại vấn đề</Th>
              <Th align="right" hint="Học viên ĐANG HỌC và có case chưa xong ở phân loại này (hiện trạng). Em chỉ có case đã đóng, hoặc đã kết thúc khoá, không tính ở bảng này. Một em có hai case cùng loại vẫn là một em.">
                HV đang gặp
              </Th>
              <Th align="right" hint="Số case mang phân loại này; trong ngoặc là số case chưa xong.">
                Case
              </Th>
              <Th align="right" hint="Số phương án đã đề ra cho các case đó. Một case có thể có nhiều phương án.">
                Phương án
              </Th>
              <Th align="right" hint="Phương án chưa khép lại — vẫn đang làm hoặc đang chờ kết quả.">
                Đang theo dõi
              </Th>
              <Th align="right" hint="Phương án đã kết thúc với kết quả khá hơn hoặc đỡ một phần.">
                Thành công
              </Th>
              <Th align="right" hint="Phương án đã kết thúc với kết quả không đổi hoặc tệ hơn.">
                Không thành công
              </Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.code} className="row-hover">
                <td className="td">
                  <span className="text-slate-100">{r.label}</span>
                  {/* Case đang mở mà chưa ai đề phương án là việc CHẶN, nên nói ngay tại hàng. */}
                  {r.noPlan > 0 && (
                    <span className="block text-[10px] text-amber-300">
                      {r.noPlan} case chưa có phương án
                    </span>
                  )}
                </td>
                <td className="td text-right tabular-nums text-slate-300">{r.students}</td>
                <td className="td text-right tabular-nums text-slate-300">
                  {r.cases}
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
      <NeedsEvaluation count={data.needsEvaluation.count}
        url={`/classes/${classId}/issue-board/needs-evaluation?category=${category}`} />

      {/*
        HIỆU QUẢ THEO LOẠI PHƯƠNG ÁN nằm trong phần mở rộng (mục 13.4): nó là câu hỏi thứ
        hai — "cách nào đang ăn" — và không đáng chen vào bảng đang trả lời câu thứ nhất.
      */}
      <button type="button" onClick={() => setDetail(!detail)}
        className="btn btn-sm btn-ghost">
        {detail ? 'Ẩn hiệu quả từng loại phương án' : 'Xem hiệu quả từng loại phương án'}
      </button>

      {detail && (
        data.plans.length === 0 ? (
          <p className="text-xs text-slate-500 m-0">
            Chưa có phương án nào kết thúc ở {caseCategoryLabel(category)}, nên chưa nói được loại nào hiệu quả.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Loại phương án</Th>
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
        có thể có nhiều phương án. Tỷ lệ chỉ có ở phần hiệu quả từng loại phương án, và mẫu số ở đó
        chỉ gồm phương án <strong>đã kết thúc và có kết quả xác định</strong> — phương án chưa đủ dữ
        liệu để đánh giá không bị tính là thất bại. Cách đếm ở đây dùng chung một bộ với trang
        Thực trạng, nên hai nơi không ra hai con số khác nhau.
      </SectionNote>
    </div>
  );
}
