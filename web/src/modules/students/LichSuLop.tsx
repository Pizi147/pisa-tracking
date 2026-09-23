import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Skeleton, Th } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { tuanLich } from '@shared/domain/index.ts';

type DongLichSu = {
  lop: { id: number; code: string }; tu: string; den: string | null; dangHoc: boolean;
  ketThucVi: string | null; ketQua: string | null;
};

/**
 * LỊCH SỬ LỚP (mockup 11-4, §3.8 dòng cuối) — đầu tab Hành trình: mỗi lớp em từng học một
 * dòng, mới nhất trước. Chỉ tải khi tab đang mở; không có enrollment nào thì không hiện khối.
 */
export function LichSuLop({ studentId, active }: { studentId: number; active: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading } = useApi<DongLichSu[]>(active ? `/students/${studentId}/lich-su-lop` : null, [studentId, active]);

  if (!active) return null;
  if (loading) return <Skeleton rows={2} />;
  if (!data || !data.length) return null;

  return (
    <div className="surface-2 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr><Th>Lớp</Th><Th>Thời gian</Th><Th>Kết thúc vì</Th><Th>Kết quả</Th></tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="row-hover">
              <td className="td">
                <Link className="link" to={`/hoc-vien/lop/${d.lop.id}`}>{d.lop.code}</Link>
              </td>
              <td className="td whitespace-nowrap">
                {d.dangHoc
                  ? <>đang học · {tuanLich(d.tu, homNay)} →</>
                  : <>{tuanLich(d.tu, homNay)} – {d.den ? tuanLich(d.den, homNay) : ''}</>}
              </td>
              <td className="td">{d.ketThucVi ?? <span className="text-slate-600">—</span>}</td>
              <td className="td">{d.ketQua ?? <span className="text-slate-600">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
