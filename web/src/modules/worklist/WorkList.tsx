import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Empty, Info, Level, Status, Task } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';

export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; overdueLabel: string | null; href: string;
  ownerId: number | null; owner: string | null; mine: boolean;
  due: string | null; statusLabel: string;
  /** Bài/case liên quan — ô thứ hai của dòng việc: "MT2", "Giữa khoá", "Case". */
  contextLabel: string | null;
  /** Số học viên trong một dòng việc gom. NULL khi dòng chỉ nói về một em. */
  count: number | null;
};
export type WorkGroup = { key: string; label: string; hint: string; items: WorkItem[]; overdue: number; today: number };

/** Bốn câu hỏi về HẠN, cộng một câu về người quyết. Đây là bốn bộ lọc mục 5.3 chốt. */
const WHEN = [
  { key: 'all', label: 'Tất cả' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'today', label: 'Đến hạn' },
  { key: 'approval', label: 'Chờ duyệt' },
] as const;
type When = (typeof WHEN)[number]['key'];

const PAGE = 12;

/**
 * VIỆC CẦN LÀM — MỘT khu vực, không phải bảy danh sách mở đồng thời (mục 5.3).
 *
 * Bản trước dựng mỗi loại việc thành một thẻ riêng, tất cả đều mở sẵn. Hậu quả đúng như
 * owner mô tả: trang rất dài, và mọi dòng nổi bật ngang nhau nên không biết bắt đầu từ đâu.
 *
 * Nay một danh sách duy nhất, sắp theo độ gấp, với ba chiều lọc đứng cạnh nhau:
 *
 *   HẠN     Tất cả · Quá hạn · Đến hạn · Chờ duyệt
 *   LOẠI    theo nhóm việc, kèm số đếm — bấm số trên dải tóm tắt là lọc đúng nhóm đó
 *   CỦA AI  Việc của tôi · Cả phạm vi quản lý (chỉ hiện khi người xem quản nhiều hơn mình)
 *
 * MỘT DÒNG NĂM Ô: học viên hoặc lớp · việc cần làm · người phụ trách · hạn · trạng thái.
 * Trước đây ba ô sau nằm lẫn trong một câu văn, nên không lọc và không quét bằng mắt được.
 *
 * Danh sách dài thì **Xem thêm**, và LUÔN hiện tổng số — biết còn bao nhiêu là một phần của
 * việc quyết định làm tiếp hay dừng.
 */
export function WorkList({ data, defaultGroup, onGroup }: {
  data: { summary: { total: number; overdue: number; today: number; approval: number; mine: number };
          items: WorkItem[]; groups: WorkGroup[] };
  /** Nhóm được chọn sẵn khi người dùng bấm một con số ở bảng tổng hợp. */
  defaultGroup?: string | null;
  /** Báo ngược lên trang để bộ lọc đang áp dụng nằm trên địa chỉ, gửi link vẫn ra đúng. */
  onGroup?: (g: string | null) => void;
}) {
  const navigate = useNavigate();
  const [when, setWhen] = useState<When>('all');
  const [group, setGroupState] = useState<string>(defaultGroup ?? '');
  const setGroup = (g: string) => { setGroupState(g); onGroup?.(g || null); };
  /*
   * GIÁO VIÊN MẶC ĐỊNH XEM VIỆC CỦA MÌNH (mục 5.3 điểm 7). Quản lý cũng vậy — mở màn lên
   * thấy việc của người khác trước việc của chính mình là cách nhanh nhất để bỏ sót việc
   * của mình. Chuyển sang cả phạm vi chỉ bằng một cú bấm.
   */
  const hasOthers = data.summary.total > data.summary.mine;
  /*
   * ...NHƯNG CHỈ KHI CÓ VIỆC CỦA MÌNH ĐỂ XEM.
   *
   * Quản lý nhiều hôm không có việc nào mang tên mình — phần lớn việc do giáo viên giữ.
   * Mặc định lọc "việc của tôi" lúc đó cho ra một màn hình trống trơn, và người mở lên sẽ
   * tưởng hôm nay không có gì phải làm.
   */
  const [onlyMine, setOnlyMine] = useState(hasOthers && data.summary.mine > 0);

  const rows = useMemo(() => data.items.filter((it) => {
    if (onlyMine && !it.mine) return false;
    if (group && it.group !== group) return false;
    if (when === 'overdue') return it.urgency === 'overdue';
    if (when === 'today') return it.urgency === 'today';
    if (when === 'approval') return it.group === 'decide';
    return true;
  }), [data.items, when, group, onlyMine]);

  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setShown(PAGE); };

  /* Số đếm của từng nhóm tính TRONG phạm vi đang chọn — nếu không, bấm vào lại ra rỗng. */
  const scoped = data.items.filter((it) => !onlyMine || it.mine);
  const countOf = (g: string) => scoped.filter((it) => it.group === g).length;

  return (
    <Card
      title={
        <span className="flex flex-wrap items-baseline gap-2">
          Việc cần làm
          <span className="text-slate-500 font-normal">
            {rows.length === data.summary.total
              ? `${data.summary.total} việc`
              : `${rows.length} / ${data.summary.total} việc`}
          </span>
        </span>
      }
      action={hasOthers ? (
        <div className="flex flex-wrap gap-1">
          <button className={`btn btn-sm ${onlyMine ? 'btn-primary' : ''}`}
            onClick={() => reset(setOnlyMine)(true)}>Việc của tôi</button>
          <button className={`btn btn-sm ${!onlyMine ? 'btn-primary' : ''}`}
            onClick={() => reset(setOnlyMine)(false)}>Cả phạm vi quản lý</button>
        </div>
      ) : undefined}
      bodyClass="p-0"
    >
      {/* ───────────────────────────────────────────────── bộ lọc */}
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-1.5" style={{ borderColor: 'var(--line)' }}>
        {WHEN.map((w) => {
          const n = w.key === 'all' ? scoped.length
            : w.key === 'overdue' ? scoped.filter((i) => i.urgency === 'overdue').length
            : w.key === 'today' ? scoped.filter((i) => i.urgency === 'today').length
            : scoped.filter((i) => i.group === 'decide').length;
          return (
            <button key={w.key} className={`btn btn-sm ${when === w.key ? 'btn-primary' : ''}`}
              onClick={() => reset(setWhen)(w.key)} disabled={n === 0 && when !== w.key}>
              {w.label} <span className="tabular-nums opacity-70 ml-1">{n}</span>
            </button>
          );
        })}
        <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
        <button className={`btn btn-sm ${!group ? 'btn-primary' : ''}`}
          onClick={() => reset(setGroup)('')}>Mọi loại việc</button>
        {data.groups.map((g) => {
          const n = countOf(g.key);
          if (n === 0) return null;
          return (
            <button key={g.key} className={`btn btn-sm ${group === g.key ? 'btn-primary' : ''}`}
              onClick={() => reset(setGroup)(group === g.key ? '' : g.key)}>
              {g.label} <span className="tabular-nums opacity-70 ml-1">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Một dòng nói rõ loại việc đang chọn nghĩa là gì — không bắt người đọc tự đoán. */}
      {group && (
        <p className="px-4 pt-3 pb-0 m-0 text-xs text-slate-500">
          {data.groups.find((g) => g.key === group)?.hint}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="p-4">
          <Empty
            title="Không có việc nào khớp bộ lọc"
            hint={onlyMine && data.summary.total > data.summary.mine
              ? 'Thử "Cả phạm vi quản lý" — còn việc của người khác trong phạm vi bạn quản.'
              : undefined}
          />
        </div>
      ) : (
        <>
          <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
            {visible.map((it) => (
              <li key={it.key}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-white/5 grid gap-x-3 gap-y-1.5
                             grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center"
                  onClick={() => navigate(it.href)}
                >
                  {/* Ô 1–2: em nào (hoặc lớp nào), và việc gì */}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-100 font-medium">{it.studentName}</span>
                      {/*
                        LỚP chỉ hiện khi ô đầu đang nói về MỘT EM — dòng gom đã lấy chính tên
                        lớp làm ô đầu, nhắc lại lần nữa là thừa.
                      */}
                      {it.classCode && it.studentName !== `Lớp ${it.classCode}` && <Info>{it.classCode}</Info>}
                      {/* BÀI/CASE LIÊN QUAN — nói rõ MT nào, thay vì bắt mở ra mới biết. */}
                      {it.contextLabel && <Info>{it.contextLabel}</Info>}
                      {it.count !== null && it.count > 1 && (
                        <span className="text-[11px] text-slate-500 tabular-nums">{it.count} học viên</span>
                      )}
                      {it.level && <Level tone={it.level.tone}>{it.level.text}</Level>}
                      {it.overdueLabel && (
                        <Alert tone={it.urgency === 'overdue' ? 'danger' : 'warn'}>{it.overdueLabel}</Alert>
                      )}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">{it.reason}</span>
                    {/* Ô 3–5: người phụ trách · hạn · trạng thái — đứng thành một dòng phụ gọn. */}
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                      <span>{it.owner ?? 'Chưa có người phụ trách'}</span>
                      <span>{it.due ? `Hạn ${fmtDate(it.due)}` : 'Không có hạn'}</span>
                      {/*
                        TRẠNG THÁI và QUÁ HẠN là hai thông tin khác nhau (mục 7.7): quá hạn
                        đã có nhãn cảnh báo riêng ở trên, nên ô này chỉ nói việc đang ở đâu
                        trong quy trình. Tô nó theo độ gấp thì một dòng có hai chỗ báo động
                        về cùng một chuyện.
                      */}
                      <Status kind={it.group === 'decide' ? 'waiting'
                        : it.group === 'no_plan' || it.group === 'no_owner' ? 'idle' : 'doing'}>
                        {it.statusLabel}
                      </Status>
                    </span>
                  </span>
                  {/* Nhãn VIỆC luôn trung tính: màu gấp đã nằm ở nhãn quá hạn bên trái. */}
                  <Task>{it.actionLabel}</Task>
                </button>
              </li>
            ))}
          </ul>
          {rows.length > shown && (
            <div className="px-4 py-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--line)' }}>
              <button className="btn btn-sm" onClick={() => setShown((n) => n + PAGE)}>
                Xem thêm {Math.min(PAGE, rows.length - shown)} việc
              </button>
              <span className="text-xs text-slate-500">
                Đang hiện {shown} trên {rows.length}
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
