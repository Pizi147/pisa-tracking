import type { NhanYThucEm } from '@shared/domain/index.ts';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Level, Skeleton, TargetText } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { DanhSachViecTiep } from '../../ui/ViecTiep.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HangCon } from '../../ui/HangNhom.tsx';
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
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  standing: KetQuaVao | null;
  openCases: number; handoverCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: NhanYThucEm | null;
  viecTiepTheo: ViecTiepTheo[];
  timeline: { id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number }[];
  /** PR-LT: cột Khoá "tiếp theo: …" và cờ chưa có lộ trình tiếp theo (chỉ lớp thường). */
  tiepTheo: string | null;
  chuaLoTrinh: boolean;
};

export type LopChoBang = {
  id: number; code?: string; programmeCode: string | null; scoringMode: string | null;
  currentWeek: number | null; totalWeeks: number | null; tuanKetThuc: string | null;
  viewer: QuyenDong;
  /** PR-LT: lớp đang trong hai tuần cuối khoá — chỉ khi đó mới nhắc "chưa có lộ trình tiếp theo" (Q5). */
  nhacLoTrinh?: boolean;
};

/**
 * CÁC HÀNG CON CỦA MỘT LỚP (đặc tả §3.6, mockup 07b A + 07c A + 10b §1; PR-UX0 N-2). Trả về CÁC `<tr>` — bảng và tiêu đề
 * cột do trang Học viên & Lớp dựng MỘT lần. Sáu cột: Học viên (mã 6 số mờ) · Kết quả gần nhất · Mục tiêu (FT) / Khoá (lớp
 * thường) · Case · Việc tiếp theo · ⋯. `chiHien` = id học viên còn lại sau chip lọc / ô tìm (máy chủ tính); `null` = mọi em đang học.
 */
export function BangHocVienLop({ lop, chiHien, sapXep, onDoi, soCot }: {
  lop: LopChoBang; chiHien: Set<number> | null; sapXep: SapXep; onDoi: () => void;
  /** Số cột của bảng ngoài — để hàng lỗi / đang tải / rỗng trải hết bề ngang. */
  soCot: number;
}) {
  const { homNay } = useNgayNghiepVu();
  const thuong = lop.scoringMode === 'ratio';
  const { data, loading, error, reload } = useApi<DongRoster[]>(`/classes/${lop.id}/roster`, [lop.id]);
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: lop.viewer, maLop: lop.code, onDone: () => { reload(); onDoi(); } });
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
  const khoaCua = (s: DongRoster) => thuong
    ? khoaLopThuong({ maChuongTrinh: lop.programmeCode, tuanHienTai: lop.currentWeek, tongTuan: lop.totalWeeks,
        tuanKetThuc: lop.tuanKetThuc, tiepTheo: s.tiepTheo, nhacLoTrinh: !!lop.nhacLoTrinh && s.chuaLoTrinh, homNay })
    : null;

  if (error) {
    return (
      <HangCon><td colSpan={soCot} className="px-4 py-3 text-xs text-bad">
        {error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </td></HangCon>
    );
  }
  if (loading || !data) return <HangCon><td colSpan={soCot} className="p-3"><Skeleton rows={3} /></td></HangCon>;
  if (!rows.length) {
    return (
      <HangCon><td colSpan={soCot}>
        <Empty title={chiHien ? 'Không có học viên nào khớp bộ lọc trong lớp này' : 'Lớp chưa có học viên'} />
      </td></HangCon>
    );
  }

  return (
    <>
      {rows.map((s) => {
        const k = ketQuaGanNhat(s.standing);
        const khoa = khoaCua(s);
        return (
          <HangCon key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
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
                {k.thieu && <span className="text-[11px] font-semibold text-bad">{k.thieu}</span>}
                {k.dat && <span className="text-[10px] text-slate-400" title={thuong ? 'Đạt mọi môn' : 'Đạt kỳ vọng'}>✓</span>}
                {k.sos && (
                  <Level tone={sosTone(s.standing?.sosLevel ?? null)} dut={k.sosTamThoi}
                    title={k.sosTamThoi ? 'Tạm thời: chưa đủ điểm các môn' : undefined}>{k.sos}{k.sosTamThoi ? ' tạm thời' : ''}</Level>
                )}
              </span>
              {k.phu && <span className="block truncate text-[11px] text-slate-500" title={k.phu}>{k.phu}</span>}
            </td>
            <td className="td">
              {thuong ? (
                <>
                  <span className="block whitespace-nowrap tabular-nums text-slate-200">{khoa?.chinh}</span>
                  {khoa?.phu && <span className="block truncate text-[11px] text-slate-500">{khoa.phu}</span>}
                </>
              ) : <span className="tabular-nums text-slate-200"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></span>}
            </td>
            <td className="td text-right tabular-nums"
              title={s.handoverCases ? `${s.handoverCases} Case bàn giao từ lớp trước` : undefined}>
              {s.openCases || <span className="text-slate-600">—</span>}
            </td>
            <td className="td">
              <DanhSachViecTiep viec={s.viecTiepTheo} />
            </td>
            <td className="td text-center">
              <MenuDong muc={tt.mucCua({
                id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(lop.id, thuong, s.timeline),
              })} />
            </td>
          </HangCon>
        );
      })}
      {createPortal(tt.panels, document.body)}
    </>
  );
}
