import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';

/**
 * PHƯƠNG ÁN & KẾT QUẢ — chế độ xem thứ hai của "Theo chi nhánh" (mục 4.3).
 *
 * Bảng "Vấn đề" nói *em nào đang yếu*. Bảng này nói *những gì mình đã làm có ăn thua không*.
 *
 * Bốn điều bảng này cố tình KHÔNG làm, vì mỗi cái là một cách nói dối bằng số:
 *
 *   - Không rút về "thành công / thất bại". Năm mức kết quả đã chốt vẫn còn ở chi tiết case;
 *     ở đây chỉ gộp hai mức tiến bộ, và nói rõ nó gồm những mức nào.
 *   - Không đếm phương án bị thay thế là thành công. Nó có cột riêng: "Đã dừng".
 *   - Không cho phương án đang chạy vào mẫu số. Chưa đánh giá khác với không hiệu quả.
 *   - Không hiện tỷ lệ trần trụi. Luôn kèm mẫu số, và số "chưa đủ căn cứ" đứng cạnh.
 */

type Row = {
  kind: string; label: string;
  running: number; reviewed: number;
  improved: number; improvedClear: number; improvedPartial: number;
  noChange: number; worse: number; insufficient: number; stopped: number;
};
type Data = { rows: Row[]; total: Row; scopeEmpty: boolean };

export function OutcomeTable({ branchId, track, topic }: {
  branchId: number | null; track: string; topic: string;
}) {
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (track) qs.set('track', track);
  if (topic) qs.set('topic', topic);
  const { data, loading } = useApi<Data>(
    `/outcomes${qs.toString() ? `?${qs}` : ''}`, [branchId, track, topic],
  );

  if (loading || !data) return <Card title="Phương án & kết quả"><Skeleton rows={5} /></Card>;
  if (data.scopeEmpty || data.rows.length === 0) {
    return (
      <Card title="Phương án & kết quả">
        <Empty
          title="Chưa có phương án nào khớp bộ lọc"
          hint="Bảng này chỉ đếm phương án đã được ghi vào một case — chưa ghi thì chưa có gì để đánh giá."
        />
      </Card>
    );
  }

  return (
    <Card title="Phương án & kết quả" bodyClass="p-0">
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th className="sticky-col" hint="Loại phương án đã ghi vào case. Một phương án là MỘT dòng đếm, dù nó được cập nhật ba lần.">
                Loại phương án
              </Th>
              <Th align="right" hint="Đang chạy, chưa có lần cập nhật kết quả nào. KHÔNG nằm trong mẫu số của các tỷ lệ bên phải — chưa đánh giá khác với không hiệu quả.">
                Đang thực hiện
              </Th>
              <Th align="right" hint="Đã có ít nhất một lần cập nhật kết quả. Đây là MẪU SỐ của mọi tỷ lệ trong bảng.">
                Đã đánh giá
              </Th>
              <Th align="right" hint="Kết quả gần nhất là 'Tiến bộ rõ rệt' hoặc 'Tiến bộ một phần' — hai mức, không phải một.">
                Có tiến bộ
              </Th>
              <Th align="right" hint="Kết quả gần nhất là 'Chưa thay đổi' hoặc 'Kém hơn'.">
                Chưa thay đổi / Kém hơn
              </Th>
              <Th align="right" hint="Kết quả gần nhất là 'Không đủ căn cứ' — không tính là tốt, cũng không tính là xấu.">
                Chưa đủ căn cứ
              </Th>
              <Th align="right" hint="Phương án đã khép vì BỊ THAY THẾ bằng phương án khác, hoặc bị huỷ. Không phải thành công, và cũng không phải một kết quả đo được.">
                Đã dừng
              </Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => <OutcomeRow key={r.kind} r={r} />)}
            <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
              <td className="td sticky-col whitespace-nowrap font-semibold text-slate-100">{data.total.label}</td>
              <Cells r={data.total} bold />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="p-3">
        <SectionNote>
          <strong>Có tiến bộ</strong> gộp hai mức: <em>Tiến bộ rõ rệt</em> ({data.total.improvedClear})
          và <em>Tiến bộ một phần</em> ({data.total.improvedPartial}). Mở một case ra vẫn thấy đủ
          năm mức như cũ.
          <br />
          Tỷ lệ tính trên <strong>{data.total.reviewed} phương án đã đánh giá</strong>, không tính{' '}
          {data.total.running} phương án đang chạy chưa có kết quả và {data.total.stopped} phương án
          đã dừng. <strong>Phương án bị thay thế không phải là thành công</strong> — nó ở cột "Đã dừng",
          không ở cột nào khác.
        </SectionNote>
      </div>
    </Card>
  );
}

function OutcomeRow({ r }: { r: Row }) {
  return (
    <tr className="row-hover">
      <td className="td sticky-col whitespace-nowrap text-slate-100">{r.label}</td>
      <Cells r={r} />
    </tr>
  );
}

function Cells({ r, bold = false }: { r: Row; bold?: boolean }) {
  const cls = `td text-right tabular-nums ${bold ? 'font-semibold text-slate-100' : 'text-slate-200'}`;
  /*
   * TỶ LỆ LUÔN ĐI KÈM MẪU SỐ, và chỉ hiện khi mẫu số đủ lớn để nói được điều gì.
   * "100%" trên hai phương án nhìn rất thuyết phục mà không có nghĩa gì.
   */
  const pct = (n: number) =>
    (r.reviewed >= 5 ? <span className="text-[11px] text-slate-500 ml-1">
      {Math.round((n / r.reviewed) * 100)}%
    </span> : null);
  const dim = (n: number) => (n === 0 ? <span className="text-slate-600">—</span> : n);
  return (
    <>
      <td className={cls}>{dim(r.running)}</td>
      <td className={cls}>{dim(r.reviewed)}</td>
      <td className={cls}>{dim(r.improved)}{r.improved > 0 && pct(r.improved)}</td>
      <td className={cls}>
        {dim(r.noChange + r.worse)}{(r.noChange + r.worse) > 0 && pct(r.noChange + r.worse)}
      </td>
      <td className={cls}>{dim(r.insufficient)}</td>
      <td className={cls}>{dim(r.stopped)}</td>
    </>
  );
}
