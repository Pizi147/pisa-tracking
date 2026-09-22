import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Level, Skeleton, ErrorState } from '../../ui/ui.tsx';

/** HỌC VIÊN CẦN HỖ TRỢ — Tổng quan giáo viên (§3.2, mockup 02 bản GV). Số trong tiêu đề = số dòng của chính khối này. */
type Dong = { studentId: number; ten: string; lop: string | null; huyHieu: { text: string; tone: 'info' | 'warn' | 'danger' } | null; phu: string };
const HIEN = 8;
/** G-7: nhãn ngắn có tooltip. Chữ nhãn do máy chủ tạo (tongQuan.ts): "SOS n[ · tạm thời]" hoặc "Ý thức". */
const giaiThichNhan = (text: string) => text === 'Ý thức'
  ? 'Có vi phạm quá 5 ngày chưa xử lý'
  : 'Mức SOS theo số môn chưa đạt ở đợt Test mới nhất; "tạm thời" = đợt chưa chấm đủ';

export function HocVienCanHoTro() {
  const { data, loading, error, reload } = useApi<{ rows: Dong[]; tong: number }>('/tong-quan/hoc-vien-can-ho-tro');
  const [het, setHet] = useState(false);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const rows = data ? (het ? data.rows : data.rows.slice(0, HIEN)) : [];
  return (
    <Card title={<span>Học viên cần hỗ trợ <span className="text-slate-500 font-normal">· lớp tôi dạy{data && data.tong > 0 ? ` · ${data.tong}` : ''}</span></span>} bodyClass="p-0">
      {loading || !data ? <div className="p-4"><Skeleton rows={4} /></div> : !data.rows.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">Chưa em nào cần hỗ trợ thêm.</p>
      ) : (
        <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
          {rows.map((r) => (
            <li key={r.studentId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center px-4 py-2.5">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-100 font-medium">{r.ten}</span>
                  {r.huyHieu && <Level tone={r.huyHieu.tone} title={giaiThichNhan(r.huyHieu.text)}>{r.huyHieu.text}</Level>}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">{[r.lop, r.phu].filter(Boolean).join(' · ')}</span>
              </span>
              <Link to={`/hoc-vien/${r.studentId}`} className="btn btn-sm no-underline">Hồ sơ</Link>
            </li>
          ))}
        </ul>
      )}
      {data && data.rows.length > HIEN && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-sm" onClick={() => setHet((v) => !v)}>
            {het ? 'Thu gọn' : `Xem thêm ${data.rows.length - HIEN} học viên`}
          </button>
        </div>
      )}
    </Card>
  );
}
