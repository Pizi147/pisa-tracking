import type { NhanYThucEm } from '@shared/domain/index.ts';
import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Level, Skeleton, TargetText } from '../../ui/ui.tsx';
import { QuaHan } from '../../ui/Nhan.tsx';
import { DanhSachViecTiep } from '../../ui/ViecTiep.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { HangCon } from '../../ui/HangNhom.tsx';
import { TheDong } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, sosTone } from '../../lib/format.ts';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { duongViecTiep, nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import {
  ketQuaGanNhat, khoaLopThuong, maHocVienNgan, sapXepHocVien, tachViecChung, tuanLich,
  type KetQuaVao, type SapXep, type ViecTiepTheo,
} from '@shared/domain/index.ts';

/** Các trường của một dòng `GET /classes/:id/roster` mà bảng này đọc. */
export type DongRoster = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  /** + mốc kế tiếp cho cột "Sắp tới" (`nextAttemptLabel` · tuần của `nextWeekStart`). */
  standing: (KetQuaVao & { nextAttemptLabel?: string | null; nextWeekStart?: string | null }) | null;
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
 * CÁC HÀNG CON CỦA MỘT LỚP (đặc tả §3.6, mockup 07b A + 07c A + 10b §1; PR-UX0 N-2; PR-HVL M3). Trả về CÁC `<tr>` — bảng và tiêu đề
 * cột do trang Học viên & Lớp dựng MỘT lần cho mỗi nhóm khung. Bảy cột: Học viên (tên đậm, mã 6 số mờ) · Kết quả gần nhất (chính + tối đa
 * hai dòng chữ, không "…") · Mục tiêu (FT) / Khoá (lớp thường) · Sắp tới · Case · Việc tiếp theo (bấm được) · ⋯. Việc Nhập điểm trùng
 * chữ ở ≥ 2 em thành MỘT hàng "Cả lớp" đầu lớp. `chiHien` = id học viên còn lại sau chip lọc / ô tìm (máy chủ tính); `null` = mọi em đang học.
 * Nằm ở: Học viên & Lớp (menu trái) → mở một lớp. Điện thoại (< 640 px, D2): `the` = mỗi em một `TheDong` thay vì `<tr>` (cùng dữ liệu, cùng thứ tự cột).
 */
export function BangHocVienLop({ lop, chiHien, sapXep, onDoi, soCot, the = false }: {
  lop: LopChoBang; chiHien: Set<number> | null; sapXep: SapXep; onDoi: () => void;
  /** Số cột của bảng ngoài — để hàng lỗi / đang tải / rỗng trải hết bề ngang. */
  soCot: number;
  /** Vẽ thẻ (điện thoại) thay vì hàng bảng. */
  the?: boolean;
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
  /* Q6/B8: việc chung của lớp lên hàng "Cả lớp", không lặp ở từng em. */
  const { chung, conLai } = useMemo(() => tachViecChung(rows.map((s) => ({ id: s.id, viec: s.viecTiepTheo }))), [rows]);
  const denChung = chung ? nhapDiemCua(lop.id, thuong, rows.find((s) => s.timeline.some((t) => t.myPending.length))?.timeline ?? [])?.den ?? null : null;
  const khoaCua = (s: DongRoster) => thuong
    ? khoaLopThuong({ maChuongTrinh: lop.programmeCode, tuanHienTai: lop.currentWeek, tongTuan: lop.totalWeeks,
        tuanKetThuc: lop.tuanKetThuc, tiepTheo: s.tiepTheo, nhacLoTrinh: !!lop.nhacLoTrinh && s.chuaLoTrinh, homNay })
    : null;

  const trong = (n: ReactNode) => (the ? <div>{n}</div> : <HangCon><td colSpan={soCot}>{n}</td></HangCon>);
  if (error) {
    return trong(
      <div className="px-4 py-3 text-xs text-bad">
        {error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </div>,
    );
  }
  if (loading || !data) return trong(<div className="p-3"><Skeleton rows={3} /></div>);
  if (!rows.length) {
    return trong(<Empty title={chiHien ? 'Không có học viên nào khớp bộ lọc trong lớp này' : 'Lớp chưa có học viên'} />);
  }

  if (the) {
    return (
      <div>
        {chung && <p className="m-0 border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--line)' }}><ViecChungLop chung={chung} den={denChung} /></p>}
        {rows.map((s) => {
          const k = ketQuaGanNhat(s.standing);
          const khoa = khoaCua(s);
          const sapToi = s.standing?.nextAttemptLabel
            ? `${s.standing.nextAttemptLabel}${s.standing.nextWeekStart ? ` · ${tuanLich(s.standing.nextWeekStart, homNay)}` : ''}` : null;
          return (
            <TheDong key={s.id} className={s.status !== 'active' ? 'row-muted' : ''}
              dau={(
                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <Link className="link font-semibold" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                  <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  <MissingBadge items={s.missing} gon />
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
              )}
              hanhDong={(
                <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(lop.id, thuong, s.timeline) })} />
              )}
              dong={[
                { nhan: 'Kết quả', noiDung: <KetQuaOHocVien k={k} standing={s.standing} thuong={thuong} /> },
                { nhan: thuong ? 'Khoá' : 'Mục tiêu', noiDung: thuong
                  ? <>{khoa?.chinh}{khoa?.phu && <span className="block text-[11px] text-slate-500">{khoa.phu}</span>}</>
                  : <TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /> },
                { nhan: 'Sắp tới', noiDung: sapToi ?? <span className="text-slate-600">—</span> },
                { nhan: 'Case', noiDung: s.openCases || <span className="text-slate-600">—</span> },
                { nhan: 'Việc tiếp', noiDung: (
                  <DanhSachViecTiep viec={conLai.get(s.id) ?? []}
                    den={(v) => duongViecTiep(v, { studentId: s.id, classId: lop.id, laLopThuong: thuong, timeline: s.timeline })} />
                ) },
              ]} />
          );
        })}
        {createPortal(tt.panels, document.body)}
      </div>
    );
  }

  return (
    <>
      {chung && (
        <HangCon>
          <td colSpan={soCot} className="td text-xs"><ViecChungLop chung={chung} den={denChung} /></td>
        </HangCon>
      )}
      {rows.map((s) => {
        const k = ketQuaGanNhat(s.standing);
        const khoa = khoaCua(s);
        const sapToi = s.standing?.nextAttemptLabel
          ? `${s.standing.nextAttemptLabel}${s.standing.nextWeekStart ? ` · ${tuanLich(s.standing.nextWeekStart, homNay)}` : ''}` : null;
        return (
          <HangCon key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
            <td className="td h-14">
              {/* PR-S4F #11: tên được ưu tiên chỗ — badge xuống dòng khi chật; tên quá dài vẫn cắt nhưng có title. */}
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <Link className="link max-w-full truncate font-semibold" title={s.fullName} to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                <MissingBadge items={s.missing} gon />
                <CanhBaoYThuc cb={s.canhBaoYThuc} />
              </span>
            </td>
            <td className="td"><KetQuaOHocVien k={k} standing={s.standing} thuong={thuong} /></td>
            <td className="td">
              {thuong ? (
                <>
                  <span className="block whitespace-nowrap tabular-nums text-slate-200">{khoa?.chinh}</span>
                  {khoa?.phu && <span className="block truncate text-[11px] text-slate-500">{khoa.phu}</span>}
                </>
              ) : <span className="tabular-nums text-slate-200"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></span>}
            </td>
            <td className="td whitespace-nowrap text-xs tabular-nums text-slate-300" title="Mốc kế tiếp đã xếp lịch">
              {sapToi ?? <span className="text-slate-600">—</span>}
            </td>
            <td className="td text-right tabular-nums"
              title={s.handoverCases ? `${s.handoverCases} Case bàn giao từ lớp trước` : undefined}>
              {s.openCases || <span className="text-slate-600">—</span>}
            </td>
            <td className="td">
              <DanhSachViecTiep viec={conLai.get(s.id) ?? []}
                den={(v) => duongViecTiep(v, { studentId: s.id, classId: lop.id, laLopThuong: thuong, timeline: s.timeline })} />
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

/** Ô Kết quả gần nhất — chung cho hàng bảng và thẻ điện thoại: số chính + độ lệch FT + ✓ + SOS (FT) và tối đa hai dòng chữ 12 px, không cắt "…". */
function KetQuaOHocVien({ k, standing, thuong }: { k: ReturnType<typeof ketQuaGanNhat>; standing: KetQuaVao | null; thuong: boolean }) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-x-1.5">
        <span className="text-sm font-bold tabular-nums text-slate-100">{k.chinh}</span>
        {k.lech && <span className="text-[11px] font-semibold tabular-nums text-bad" title={`Dưới kỳ vọng ${k.lech.replace('−', '')}`}>{k.lech}</span>}
        {k.dat && <span className="text-[11px] text-slate-400" title={thuong ? 'Đạt mọi môn' : 'Đạt kỳ vọng'}>✓</span>}
        {k.sos && (
          <Level tone={sosTone(standing?.sosLevel ?? null)} dut={k.sosTamThoi}
            title={k.sosTamThoi ? 'Tạm thời: chưa đủ điểm các môn' : undefined}>{k.sos}{k.sosTamThoi ? ' tạm thời' : ''}</Level>
        )}
      </span>
      {k.dong1 && <span className="block text-[12px] leading-4 text-slate-500"><DongCham chu={k.dong1} /></span>}
      {k.dong2 && <span className="block text-[12px] leading-4 text-slate-500"><DongCham chu={k.dong2} /></span>}
    </>
  );
}

/** PR-S4F #11: dòng "a · b · c" chỉ xuống dòng Ở DẤU "·" (không bẻ "…có / điểm", không để "W ·" đứng riêng ở 375 px). */
function DongCham({ chu }: { chu: string }) {
  return <>{chu.split(' · ').flatMap((x, i) => [i ? ' ' : null, <span key={i} className="whitespace-nowrap">{i ? '· ' : ''}{x}</span>])}</>;
}

/** Hàng "Cả lớp" (Q6, B8): việc Nhập điểm chung của cả lớp — chữ + hạn + số em + link tới lưới nhập điểm; dùng cho bảng và thẻ. */
function ViecChungLop({ chung, den }: { chung: { viec: ViecTiepTheo; soEm: number }; den: string | null }) {
  const v = chung.viec;
  return (
    <>
      <span className="text-slate-500">Cả lớp: </span>
      <span className="text-slate-200">
        {den ? <Link to={den} className="link">{v.viec}</Link> : v.viec}
        {v.quaHanNgay !== null ? <> <QuaHan ngay={v.quaHanNgay} /></> : v.han ? <span className="text-slate-500"> · {v.han}</span> : null}
      </span>
      <span className="text-slate-500"> · {chung.soEm} em{den ? ' →' : ''}</span>
    </>
  );
}
