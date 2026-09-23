import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Level, Skeleton, Task } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, sosTone } from '../../lib/format.ts';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import {
  ketQuaGanNhat, khoaLopThuong, maHocVienNgan, sapXepHocVien,
  type KetQuaVao, type SapXep, type ViecTiepTheo,
} from '@shared/domain/index.ts';

/** Các trường của một dòng `GET /classes/:id/roster` mà bảng này đọc. */
export type DongRoster = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { target: number | null } | null;
  standing: KetQuaVao | null;
  openCases: number; handoverCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: { count: number; oldestAgeDays: number; message: string } | null;
  viecTiepTheo: ViecTiepTheo[];
  timeline: { id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number }[];
};

export type LopChoBang = {
  id: number; programmeCode: string | null; scoringMode: string | null;
  currentWeek: number | null; totalWeeks: number | null; tuanKetThuc: string | null;
  viewer: QuyenDong;
};

/**
 * BẢNG HỌC VIÊN TRONG HỘP LỚP (đặc tả §3.6, mockup 07b A + 07c A + 10b §1). Sáu cột:
 * Học viên (mã 6 số mờ) · Kết quả gần nhất · Mục tiêu (FT) / Khoá (lớp thường) · Case · Việc tiếp theo · ⋯.
 * `chiHien` = id học viên còn lại sau chip lọc / ô tìm (máy chủ tính, Task 5); `null` = mọi em đang học.
 */
export function BangHocVienLop({ lop, chiHien, sapXep, onDoi }: {
  lop: LopChoBang; chiHien: Set<number> | null; sapXep: SapXep; onDoi: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const thuong = lop.scoringMode === 'ratio';
  const { data, loading, error, reload } = useApi<DongRoster[]>(`/classes/${lop.id}/roster`, [lop.id]);
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: lop.viewer, onDone: () => { reload(); onDoi(); } });
  const rows = useMemo(() => sapXepHocVien(
    (data ?? [])
      .filter((s) => !s.archived && (!chiHien || chiHien.has(s.id)))
      .map((s) => ({
        ...s, ten: s.fullName,
        quaHan: s.viecTiepTheo.some((v) => v.tone === 'danger'),
        canhBao: !!s.canhBaoYThuc, sosLevel: s.standing?.sosLevel ?? null, soCaseMo: s.openCases,
      })),
    sapXep,
  ), [data, chiHien, sapXep]);
  const khoa = thuong
    ? khoaLopThuong({ maChuongTrinh: lop.programmeCode, tuanHienTai: lop.currentWeek, tongTuan: lop.totalWeeks,
        tuanKetThuc: lop.tuanKetThuc, tiepTheo: null, homNay })
    : null;

  if (error) {
    return (
      <p className="m-0 px-4 py-3 text-xs text-rose-200">
        {error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </p>
    );
  }
  if (loading || !data) return <div className="p-3"><Skeleton rows={3} /></div>;
  if (!rows.length) return <Empty title={chiHien ? 'Không có học viên nào khớp bộ lọc trong lớp này' : 'Lớp chưa có học viên'} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] table-fixed text-sm">
        <colgroup>
          <col className="w-[28%]" /><col className="w-[22%]" /><col className="w-[14%]" />
          <col className="w-[7%]" /><col className="w-[25%]" /><col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="th">Học viên</th>
            <th className="th">Kết quả gần nhất</th>
            <th className="th">{thuong ? 'Khoá' : 'Mục tiêu'}</th>
            <th className="th text-right">Case</th>
            <th className="th">Việc tiếp theo</th>
            <th className="th"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const k = ketQuaGanNhat(s.standing);
            return (
              <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
                <td className="td h-14">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Link className="link truncate font-medium" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                    <MissingBadge items={s.missing} gon />
                    <CanhBaoYThuc cb={s.canhBaoYThuc} />
                  </span>
                </td>
                <td className="td">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-sm font-bold tabular-nums text-slate-100">{k.chinh}</span>
                    {k.thieu && <span className="text-[11px] font-semibold text-rose-200">{k.thieu}</span>}
                    {k.dat && <span className="text-[10px] text-slate-400" title={thuong ? 'Đạt mọi môn' : 'Đạt kỳ vọng'}>✓</span>}
                    {k.sos && <Level tone={sosTone(s.standing?.sosLevel ?? null)}>{k.sos}</Level>}
                  </span>
                  {k.phu && <span className="block truncate text-[11px] text-slate-500" title={k.phu}>{k.phu}</span>}
                </td>
                <td className="td">
                  {thuong ? (
                    <>
                      <span className="block whitespace-nowrap tabular-nums text-slate-200">{khoa?.chinh}</span>
                      {khoa?.phu && <span className="block truncate text-[11px] text-slate-500">{khoa.phu}</span>}
                    </>
                  ) : <span className="tabular-nums text-slate-200">{fmtBand(s.cycle?.target ?? null)}</span>}
                </td>
                <td className="td text-right tabular-nums"
                  title={s.handoverCases ? `${s.handoverCases} Case bàn giao từ lớp trước` : undefined}>
                  {s.openCases || <span className="text-slate-600">—</span>}
                </td>
                <td className="td">
                  {s.viecTiepTheo.length === 0 ? <span className="text-slate-600">—</span> : (
                    <span className="flex flex-col items-start gap-1">
                      {s.viecTiepTheo.slice(0, 2).map((v) => <Task key={v.nhan} tone={v.tone}>{v.nhan}</Task>)}
                      {s.viecTiepTheo.length > 2 && (
                        <span className="text-[10px] text-slate-500" title={s.viecTiepTheo.slice(2).map((v) => v.nhan).join(' · ')}>
                          +{s.viecTiepTheo.length - 2} việc
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="td text-center">
                  <MenuDong muc={tt.mucCua({
                    id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(lop.id, thuong, s.timeline),
                  })} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tt.panels}
    </div>
  );
}
