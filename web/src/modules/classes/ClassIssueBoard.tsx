import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { issueBoardCategoriesFor, caseCategoryLabel, CASE_CATEGORY_SHORT } from '@shared/domain/index.ts';

type Row = {
  code: string; label: string;
  cases: number; openCases: number; students: number; noPlan: number;
  plans: number; running: number;
  success: number; failure: number; undetermined: number;
};
type PlanKind = {
  kind: string; label: string;
  success: number; failure: number; undetermined: number;
  decided: number; rate: number | null; smallSample: boolean;
};
type Board = {
  category: string; label: string; short: string;
  rows: Row[]; plans: PlanKind[]; studentCount: number; note: string | null;
};

/**
 * BẢNG PHÂN TÍCH VẤN ĐỀ CỦA MỘT LỚP — mục 13.4.
 *
 * Ba quyết định của bảng này, và lý do:
 *
 * 1. MẶC ĐỊNH THU GỌN. Danh sách học viên là thứ người ta mở trang lớp để xem; một bảng
 *    phân tích năm cột đặt mở sẵn sẽ đẩy danh sách xuống dưới màn hình mỗi lần vào lớp.
 *
 * 2. TAB KỸ NĂNG CỐ ĐỊNH theo chương trình: Normal bốn tab L/R/W/S, Fast Track năm tab có
 *    cả W1 và W2. Tab được dựng từ chương trình chứ không từ dữ liệu đang có, nên kỹ năng
 *    chưa có case nào vẫn còn tab và nói "chưa có case", thay vì lặng lẽ biến mất.
 *
 * 3. NĂM CON SỐ LÀ NĂM ĐƠN VỊ KHÁC NHAU, và bảng không chia chéo chúng. Số phương án thành
 *    công KHÔNG chia cho số case: một case có thể có ba phương án, nên tỷ lệ đó không trả
 *    lời được câu hỏi nào. Tỷ lệ chỉ xuất hiện ở phần mở rộng, theo LOẠI phương án, và luôn
 *    hiện n/N trước khi hiện phần trăm.
 */
export function ClassIssueBoard({ classId, ratio }: { classId: number; ratio: boolean }) {
  const [open, setOpen] = useState(false);
  const cats = issueBoardCategoriesFor(ratio ? 'ratio' : 'ielts_band');
  const [cat, setCat] = useState<string>(cats[0]);

  return (
    <div className="surface-2 rounded-lg">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-transparent border-0 px-3 py-2.5 text-left cursor-pointer">
        <span className="text-sm text-slate-100">Phân tích vấn đề của lớp</span>
        <span className="text-xs text-slate-500">
          {open ? 'Thu gọn ▲' : 'Mở ra ▼'}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex flex-wrap gap-1">
            {cats.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)}
                title={caseCategoryLabel(c)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  c === cat
                    ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
                    : 'text-slate-300 border-transparent hover:bg-white/5'
                }`}>
                {CASE_CATEGORY_SHORT[c] ?? c}
              </button>
            ))}
          </div>
          <IssueTable classId={classId} category={cat} />
        </div>
      )}
    </div>
  );
}

function IssueTable({ classId, category }: { classId: number; category: string }) {
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
              <Th align="right" hint="Số học viên khác nhau gặp phân loại này. Một em có hai case cùng loại vẫn là một em.">
                HV
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
                  {/* Đã kết thúc mà chưa có kết quả xác định thì KHÔNG phải thất bại (mục 15.3). */}
                  {r.undetermined > 0 && (
                    <span className="text-[10px] text-slate-500" title="Phương án đã kết thúc nhưng chưa có kết quả xác định — không tính vào hai cột trên.">
                      {' '}+{r.undetermined} chưa rõ
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.note && <p className="text-[11px] text-slate-500 m-0">{data.note}</p>}

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
                  <Th align="right" hint="Số phương án thành công trên số phương án đã kết thúc CÓ kết quả xác định.">
                    Thành công
                  </Th>
                  <Th align="right">Tỷ lệ</Th>
                </tr>
              </thead>
              <tbody>
                {data.plans.map((p) => (
                  <tr key={p.kind} className="row-hover">
                    <td className="td text-slate-100">
                      {p.label}
                      {p.undetermined > 0 && (
                        <span className="block text-[10px] text-slate-500">
                          {p.undetermined} phương án chưa có kết quả xác định, không tính vào mẫu
                        </span>
                      )}
                    </td>
                    {/* n/N ĐỨNG TRƯỚC phần trăm: 1/1 và 18/20 không phải cùng một câu chuyện. */}
                    <td className="td text-right tabular-nums text-slate-300">
                      {p.success}/{p.decided}
                    </td>
                    <td className="td text-right tabular-nums">
                      {p.rate === null ? (
                        <span className="text-slate-600">—</span>
                      ) : p.smallSample ? (
                        <span className="text-slate-400" title="Mẫu dưới 5 phương án — con số này chưa đủ để xếp hạng.">
                          {p.rate}% <span className="text-[10px] text-slate-500">mẫu nhỏ</span>
                        </span>
                      ) : (
                        <span className="text-slate-200">{p.rate}%</span>
                      )}
                    </td>
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
