import { useRef, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi, useGopTaiLai } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { CongTacKhung, khungDaNho } from '../../ui/CongTacKhung.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { DiemTheoLop, type CongRoi } from '../cham/DiemTheoLop.tsx';

/** `GET /diem-theo-lop/lop` (`lopCuaToi`, server/src/cham/diemTheoLuot.ts). */
type LopCuaToi = { classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; branchId: number; oTrong: number };

const conTrong = (l: LopCuaToi) => (l.oTrong ? `${l.oTrong} trống` : 'đủ');

/**
 * TEST › ĐIỂM THEO LỚP (PR-DL, mockup `mockup-diem-theo-lop-2026-10-04.html` #v-test). Trái: lớp người xem được xem (GV lớp mình dạy,
 * GVCN lớp chủ nhiệm, QL lớp chi nhánh) kèm số ô trống; phải: bảng điểm theo lượt `DiemTheoLop`. Lớp đang chọn nằm ở `?lop=`
 * (không có thì lớp đầu danh sách). Màn hẹp (< md): danh sách thành ô chọn lớp phía trên.
 * Trên danh sách: ô Chi nhánh + công tắc `Fast Track · Lớp thường` — cùng thành phần và URL (`cn`, `loai`) với hàng lọc Kế hoạch Test;
 * lọc chỉ đổi danh sách, lớp đang xem giữ nguyên (lớp chưa chọn thì lấy lớp đầu danh sách đã lọc).
 * Đổi lớp đi CÙNG đường chặn với đổi lượt (`CongRoi` của `DiemTheoLop`): còn ô đang lưu thì hỏi, còn ô chưa lưu thì chặn.
 */
export function TabDiemLop() {
  const [sp, setSp] = useSearchParams();
  const { data, loading, error, reload } = useApi<LopCuaToi[]>('/diem-theo-lop/lop');
  const cong = useRef<CongRoi | null>(null);
  /* Số ô trống của danh sách lớp: tải lại GỘP 1,5 s sau lần lưu cuối (như Lịch Test, Q14) — không tải mọi lớp sau mỗi ô. */
  const daLuu = useGopTaiLai(reload);
  const macDinh = useChiNhanhMacDinh();

  if (error && !data) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.length) return <div className="card"><Empty title="Chưa có lớp nào trong phạm vi của bạn." /></div>;

  const cnUrl = sp.get('cn');
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const theoCn = data.filter((l) => !branchId || l.branchId === branchId);
  const lopFT = theoCn.filter((l) => l.mode === 'ielts_band');
  const lopThuong = theoCn.filter((l) => l.mode !== 'ielts_band');
  const daNho = khungDaNho('diem-theo-lop');
  const loaiUrl = sp.get('loai');
  const loai: 'ft' | 'thuong' = lopFT.length && lopThuong.length
    ? (loaiUrl === 'ft' || loaiUrl === 'thuong' ? loaiUrl : daNho === 'thuong' ? 'thuong' : 'ft')
    : lopThuong.length ? 'thuong' : 'ft';
  const loc = loai === 'ft' ? lopFT : lopThuong;
  const chon = data.find((l) => String(l.classId) === sp.get('lop')) ?? loc[0] ?? theoCn[0] ?? data[0];
  /* Lớp đang xem luôn còn trong danh sách dù lọc loại nó đi — không để bảng bên phải mất chỗ đứng. */
  const ds = loc.some((l) => l.classId === chon.classId) ? loc : [chon, ...loc];
  /* Đổi bộ lọc đi CÙNG đường chặn với đổi lớp: còn ô đang lưu / chưa lưu thì không đổi gì (lớp mặc định có thể đổi theo bộ lọc). */
  const doiLoc = (lam: (q: URLSearchParams) => void) => {
    const xong = () => { const q = new URLSearchParams(sp); lam(q); setSp(q, { replace: true }); };
    if (cong.current) cong.current.roi(xong); else xong();
  };
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

  /* `grid-cols-1` = minmax(0,1fr): lưới một cột không giãn theo bề rộng nội dung (thanh lượt, bảng một kỹ năng) → không tràn ngang ở 375. */
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2" onMouseDown={giu}>
        <CongTacKhung trang="diem-theo-lop" value={loai} dem={{ ft: lopFT.length, thuong: lopThuong.length }} donVi="lớp"
          onChange={(k) => { if (k !== 'tat-ca') doiLoc((q) => q.set('loai', k)); }} />
        <BranchFilter branchId={branchId} onBranch={(id) => doiLoc((q) => { if (id) q.set('cn', String(id)); else q.delete('cn'); })} />
      </div>
      <select className="field md:hidden" aria-label="Chọn lớp" value={chon.classId} onMouseDown={giu} onChange={(e) => chonLop(Number(e.target.value))}>
        {ds.map((l) => <option key={l.classId} value={l.classId}>{l.classCode} · {conTrong(l)}</option>)}
      </select>
      <nav className="card hidden flex-col gap-1 p-2 md:flex" aria-label="Danh sách lớp" onMouseDown={giu}>
        <div className="px-2.5 py-1 text-xs text-slate-500">Lớp · còn ô trống</div>
        {ds.map((l) => {
          const on = l.classId === chon.classId;
          return (
            <button key={l.classId} type="button" aria-current={on || undefined} onClick={() => chonLop(l.classId)}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                on ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent-strong)]' : 'text-slate-200 hover:bg-[color:var(--surface-2)]'}`}>
              <span className="min-w-0 truncate" title={l.classCode}>{l.classCode}</span>
              <span className={`shrink-0 text-xs tabular-nums ${on ? '' : 'text-slate-500'}`}>{conTrong(l)}</span>
            </button>
          );
        })}
      </nav>
      </div>
      {/* `key`: đổi lớp thì lượt và trạng thái lưu bắt đầu lại từ lượt mở sẵn của lớp mới. */}
      <DiemTheoLop key={chon.classId} classId={chon.classId} congRoi={cong} onDaLuu={daLuu} />
    </div>
  );
}
