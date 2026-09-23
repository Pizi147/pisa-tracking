import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { chonCaseChinh, maHocVienNgan, viecTiepTheoCua } from '@shared/domain/index.ts';

type CaseDong = {
  id: number; studentId: number | null; status: string; state: string; topic: string | null;
  topicLabel: string | null; primaryLabel: string | null; title: string;
  currentPlan: string | null; nextDue: string | null; dueOverdue: boolean; sosLevel: number | null;
};

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ CẦN HỖ TRỢ (đặc tả §3.7, mockup 06): cùng danh sách lớp, thay cột điểm bằng vấn đề chính · PA đang chạy ·
 * bước tiếp theo + hạn. Chỉ em có Case đang mở (Case theo `/cases?classId=` — lớp em ĐANG học). Case nói trước chọn bằng
 * `chonCaseChinh` (quá hạn → chưa có PA → mức SOS). Badge "n Case đang mở" ở đầu trang mở chế độ này (Q5).
 */
export function BangCanHoTro({ classId, maLop, laLopThuong, quyen, onDoi }: {
  classId: number; maLop?: string; laLopThuong: boolean; quyen: QuyenDong; onDoi: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const roster = useApi<any[]>(`/classes/${classId}/roster`, [classId]);
  const cases = useApi<{ rows: CaseDong[] }>(`/cases?classId=${classId}`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong, quyen, maLop, onDone: () => { roster.reload(); cases.reload(); onDoi(); } });
  const theoEm = useMemo(() => {
    const m = new Map<number, CaseDong[]>();
    for (const c of cases.data?.rows ?? []) {
      if (c.status === 'done' || c.studentId === null) continue;
      const ds = m.get(c.studentId) ?? [];
      ds.push(c);
      m.set(c.studentId, ds);
    }
    return m;
  }, [cases.data]);

  if (roster.error || cases.error) {
    const e = (roster.error ?? cases.error)!;
    return <ErrorState message={e.message} hint={e.hint} onRetry={() => { roster.reload(); cases.reload(); }} />;
  }
  if (!roster.data || !cases.data) return <Skeleton rows={4} />;
  const hs = roster.data.filter((s) => !s.archived);
  const coCase = hs.filter((s) => theoEm.has(s.id));
  if (!coCase.length) return <Empty title="Không có học viên nào đang có Case mở" />;
  const tongCase = coCase.reduce((n, s) => n + (theoEm.get(s.id)?.length ?? 0), 0);

  return (
    <div className="space-y-2">
      <p className="m-0 text-xs text-slate-400">{coCase.length} học viên · {tongCase} Case đang mở</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[780px] table-fixed text-sm">
          <colgroup><col className="w-[24%]" /><col className="w-[26%]" /><col className="w-[24%]" /><col className="w-[22%]" /><col className="w-12" /></colgroup>
          <thead>
            <tr>
              <th className="th">Học viên</th><th className="th">Vấn đề chính</th><th className="th">PA đang chạy</th>
              <th className="th">Bước tiếp theo</th><th className="th"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {coCase.map((s) => {
              const ds = theoEm.get(s.id)!;
              const c = chonCaseChinh(ds)!;
              const buoc = viecTiepTheoCua({ nhapDiem: null, cases: [c], homNay })[0] ?? null;
              return (
                <tr key={s.id} className="row-hover">
                  <td className="td h-12">
                    <Link className="link" to={`/hoc-vien/${s.id}?case=${c.id}`}>{s.fullName}</Link>{' '}
                    <span className="text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  </td>
                  <td className="td">
                    <span className="block truncate text-slate-200" title={c.title}>{c.primaryLabel ?? c.topicLabel ?? c.title}</span>
                    {ds.length > 1 && <span className="block text-[11px] text-slate-500">+{ds.length - 1} Case khác</span>}
                  </td>
                  <td className="td">
                    {c.currentPlan
                      ? <span className="block truncate text-slate-300" title={c.currentPlan}>{c.currentPlan}</span>
                      : <span className="text-xs text-amber-200">Chưa có PA học thuật</span>}
                  </td>
                  <td className="td">{buoc ? <ViecTiep v={buoc} /> : <span className="text-xs text-slate-500">Đang theo dõi</span>}</td>
                  <td className="td text-center">
                    <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, laLopThuong, s.timeline ?? []) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hs.length > coCase.length && <p className="m-0 text-[11px] text-slate-500">{hs.length - coCase.length} học viên không có Case đang mở.</p>}
      {tt.panels}
    </div>
  );
}
