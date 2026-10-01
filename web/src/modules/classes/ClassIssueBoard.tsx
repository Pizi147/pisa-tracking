import { useApi } from '../../lib/useApi.ts';
import { ErrorState, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { NeedsEvaluation } from '../cases/NeedsEvaluation.tsx';
import { SoO } from '../phanTich/dungChung.tsx';
import { caseCategoryLabel } from '@shared/domain/index.ts';

type KePa = {
  kind: string; label: string;
  /** "Thành công" và "Đã thực hiện" (`decided`) — cùng `planOutcomes` với Phân tích › Hiệu quả PA. */
  success: number; decided: number; dangThucHien: number;
};
type Board = {
  category: string; label: string; short: string;
  plans: KePa[];
  /** Mỗi số là độ dài một tập id (hợp đồng số liệu): danh sách khi bấm số là chính tập đó (`/issue-board/o`). */
  tong: { hvGapVanDe: number[]; caseTatCa: number[]; dangTheoDoi: number[]; daCoPa: number[]; daXong: number[]; thanhCong: number[] };
  /** Phương án đã kết thúc mà chưa có kết quả xác định — ở NGOÀI bảng hiệu quả (F05). */
  needsEvaluation: { count: number; ids: number[] };
};

/**
 * MỞ MỘT KỸ NĂNG Ở PHÂN TÍCH LỚP (PR-HVL, M5, YC-11.3.3). Nằm ở: Học viên & Lớp → Hồ sơ lớp → tab Phân tích lớp → bấm một hàng kỹ năng/môn.
 * Hai bảng nhỏ: "Vấn đề ở {kỹ năng}" (HV gặp vấn đề · Case · Đang theo dõi · Đã có PA · Đã xong → Thành công) và "Hiệu quả phương án ở {kỹ năng}"
 * (loại PA · Đang thực hiện · Đã thực hiện · Thành công · Tỷ lệ). Mọi số bấm được ra danh sách đúng số đó (`SoO nguon=/issue-board/o`).
 */
export function VanDeKyNang({ classId, category }: { classId: number; category: string }) {
  const { data, loading, error, reload } = useApi<Board>(`/classes/${classId}/issue-board?category=${category}`, [classId, category]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;
  const mon = caseCategoryLabel(category);
  const nguon = (cot: string, kind?: string) => `/classes/${classId}/issue-board/o?category=${category}&cot=${cot}${kind ? `&kind=${kind}` : ''}`;
  const so = (n: number, cot: string, tieuDe: string, kind?: string) => <SoO giaTri={n} nguon={nguon(cot, kind)} tieuDe={tieuDe} />;
  const t = data.tong;

  return (
    <div className="space-y-3">
      <section className="overflow-x-auto" aria-label={`Vấn đề ở ${mon}`}>
        <h3 className="m-0 mb-1 text-xs font-semibold text-slate-200">Vấn đề ở {mon}</h3>
        {t.caseTatCa.length === 0 ? (
          <p className="m-0 py-2 text-xs text-slate-500">Lớp này chưa có Case nào ở {mon}.</p>
        ) : (
          <table className="w-full min-w-[520px] table-fixed text-sm">
            <thead>
              <tr>
                <Th align="right" hint="Học viên ĐANG HỌC lớp này và có Case chưa xong ở kỹ năng này. Một em có hai Case cùng kỹ năng vẫn là một em.">HV gặp vấn đề</Th>
                <Th align="right" hint="Mọi Case ở kỹ năng này, kể cả đã xong.">Case</Th>
                <Th align="right" hint="Case chưa xong.">Đang theo dõi</Th>
                <Th align="right" hint="Case có ít nhất một phương án (không tính phương án theo quy chế chưa được xác nhận).">Đã có PA</Th>
                <Th align="right" hint="Case đã xong → trong đó số Case kết luận tiến bộ rõ hoặc tiến bộ một phần.">Xong → Thành công</Th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-hover">
                <td className="td text-right tabular-nums">{so(t.hvGapVanDe.length, 'hv', 'Học viên gặp vấn đề')}</td>
                <td className="td text-right tabular-nums">{so(t.caseTatCa.length, 'case', 'Case')}</td>
                <td className="td text-right tabular-nums">{so(t.dangTheoDoi.length, 'dang-theo-doi', 'Case đang theo dõi')}</td>
                <td className="td text-right tabular-nums">{so(t.daCoPa.length, 'da-co-pa', 'Case đã có PA')}</td>
                <td className="td text-right tabular-nums">
                  {so(t.daXong.length, 'da-xong', 'Case đã xong')}<span className="text-slate-500"> → </span>{so(t.thanhCong.length, 'thanh-cong', 'Case đã xong và thành công')}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="overflow-x-auto" aria-label={`Hiệu quả PA ở ${mon}`}>
        <h3 className="m-0 mb-1 text-xs font-semibold text-slate-200">Hiệu quả PA ở {mon}</h3>
        {data.plans.length === 0 ? (
          <p className="m-0 py-2 text-xs text-slate-500">Chưa có phương án nào ở {mon}, nên chưa nói được loại nào hiệu quả.</p>
        ) : (
          <table className="w-full min-w-[520px] table-fixed text-sm">
            <colgroup><col className="w-[32%]" /><col className="w-[17%]" /><col className="w-[17%]" /><col className="w-[16%]" /><col /></colgroup>
            <thead>
              <tr>
                <Th>Loại PA</Th>
                <Th align="right" hint="Phương án đang làm hoặc chờ kết quả (không tính phương án theo quy chế chưa được xác nhận).">Đang thực hiện</Th>
                <Th align="right" hint="Phương án đã kết thúc có kết quả xác định — cũng là mẫu số của tỷ lệ.">Đã thực hiện</Th>
                <Th align="right" hint="Đã kết thúc với kết quả có tiến bộ hoặc tiến bộ một phần.">Thành công</Th>
                <Th align="right" hint="Thành công trên đã thực hiện. Dưới 5 mẫu chỉ ghi 'mẫu nhỏ'; chưa có mẫu thì 'Chưa có dữ liệu'.">Tỷ lệ</Th>
              </tr>
            </thead>
            <tbody>
              {data.plans.map((p) => (
                <tr key={p.kind} className="row-hover">
                  <td className="td text-slate-100">{p.label}</td>
                  <td className="td text-right tabular-nums">{so(p.dangThucHien, 'pa-dang', `PA ${p.label} đang thực hiện`, p.kind)}</td>
                  <td className="td text-right tabular-nums">{so(p.decided, 'pa-da', `PA ${p.label} đã thực hiện`, p.kind)}</td>
                  <td className="td text-right tabular-nums">{so(p.success, 'pa-thanh-cong', `PA ${p.label} thành công`, p.kind)}</td>
                  <td className="td text-right tabular-nums"><TyLe n={p.success} N={p.decided} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* F05: phương án đã kết thúc mà chưa ai ghi kết quả KHÔNG nằm trong bảng — liên kết riêng, ngoài bảng. */}
      <NeedsEvaluation count={data.needsEvaluation.count}
        url={`/classes/${classId}/issue-board/needs-evaluation?category=${category}`} />

      <SectionNote>Một Case chỉ đếm một lần. Mọi số bấm được ra danh sách đúng số đó.</SectionNote>
    </div>
  );
}
