import { useRef, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DiemTheoLop, type CongRoi } from '../cham/DiemTheoLop.tsx';

/** `GET /diem-theo-lop/lop` (`lopCuaToi`, server/src/cham/diemTheoLuot.ts). */
type LopCuaToi = { classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; oTrong: number };

const conTrong = (l: LopCuaToi) => (l.oTrong ? `${l.oTrong} trống` : 'đủ');

/**
 * TEST › ĐIỂM THEO LỚP (PR-DL, mockup `mockup-diem-theo-lop-2026-10-04.html` #v-test). Trái: lớp người xem được xem (GV lớp mình dạy,
 * GVCN lớp chủ nhiệm, QL lớp chi nhánh) kèm số ô trống; phải: bảng điểm theo lượt `DiemTheoLop`. Lớp đang chọn nằm ở `?lop=`
 * (không có thì lớp đầu danh sách). Màn hẹp (< md): danh sách thành ô chọn lớp phía trên.
 * Đổi lớp đi CÙNG đường chặn với đổi lượt (`CongRoi` của `DiemTheoLop`): còn ô đang lưu thì hỏi, còn ô chưa lưu thì chặn.
 */
export function TabDiemLop() {
  const [sp, setSp] = useSearchParams();
  const { data, loading, error, reload } = useApi<LopCuaToi[]>('/diem-theo-lop/lop');
  const cong = useRef<CongRoi | null>(null);

  if (error && !data) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.length) return <div className="card"><Empty title="Chưa có lớp nào trong phạm vi của bạn." /></div>;

  const chon = data.find((l) => String(l.classId) === sp.get('lop')) ?? data[0];
  const chonLop = (id: number) => {
    if (id === chon.classId) return;
    const sang = () => {
      const q = new URLSearchParams(sp);
      q.set('lop', String(id));
      setSp(q, { replace: true });
    };
    if (cong.current) cong.current.roi(sang); else sang();
  };
  const giu = (e: MouseEvent) => cong.current?.giu(e);

  return (
    <div className="grid items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
      <select className="field md:hidden" aria-label="Chọn lớp" value={chon.classId} onMouseDown={giu} onChange={(e) => chonLop(Number(e.target.value))}>
        {data.map((l) => <option key={l.classId} value={l.classId}>{l.classCode} · {conTrong(l)}</option>)}
      </select>
      <nav className="card hidden flex-col gap-1 p-2 md:flex" aria-label="Danh sách lớp" onMouseDown={giu}>
        <div className="px-2.5 py-1 text-xs text-slate-500">Lớp · còn ô trống</div>
        {data.map((l) => {
          const on = l.classId === chon.classId;
          return (
            <button key={l.classId} type="button" aria-current={on || undefined} onClick={() => chonLop(l.classId)}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                on ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent-strong)]' : 'text-slate-200 hover:bg-[color:var(--surface-2)]'}`}>
              <span className="min-w-0 truncate">{l.classCode}</span>
              <span className={`shrink-0 text-xs tabular-nums ${on ? '' : 'text-slate-500'}`}>{conTrong(l)}</span>
            </button>
          );
        })}
      </nav>
      {/* `key`: đổi lớp thì lượt và trạng thái lưu bắt đầu lại từ lượt mở sẵn của lớp mới. */}
      <DiemTheoLop key={chon.classId} classId={chon.classId} congRoi={cong} />
    </div>
  );
}
