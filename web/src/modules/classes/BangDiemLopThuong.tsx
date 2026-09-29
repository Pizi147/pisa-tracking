import { Link } from 'react-router-dom';
import { DauDuoi } from '../../ui/Nhan.tsx';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { ATTEMPT_KIND_SHORT, CHUONG_TRINH_KHONG_CHIA_MON, maHocVienNgan, mondayOfDate, tenMon, tenMonNgan, tuanLich, type AttemptKind } from '@shared/domain/index.ts';

type ODiem = { score: number | null; total: number | null; outcome: string };
type LuotThuong = {
  id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number;
  ratios: Record<string, ODiem> | null; tuanMon: Record<string, string | null> | null;
};
type DongThuong = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; skills: string[] | null;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: { count: number; oldestAgeDays: number; message: string } | null;
  timeline: LuotThuong[];
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC. */
  ketThucVi?: string | null;
};

/** Hồ sơ lớp cũ chưa gửi mốc: Giữa khoá + Cuối khoá như trước. */
const MOC_MAC_DINH = ['progress', 'final'];

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP THƯỜNG (đặc tả §3.7, mockup 10b phương án A).
 * Nhóm cột theo MỐC của chương trình (FOU/BE/ELE Giữa khoá | Cuối khoá; Pre FOU chỉ Cuối khoá — K2-12), mỗi nhóm là bộ môn của
 * lớp, tên theo chương trình (FOU L R G+V P; Pre FOU một cột Tổng hợp + cột % — MH7). Ô `đúng/tổng`, đỏ nếu chưa đạt (dưới 70%). Chưa có điểm mà đã có lịch thì ghi
 * tuần thi (`W3 SEP`, G-6); chưa có lịch thì gạch. Thiếu điểm KHÁC chưa đạt: không tô đỏ.
 */
export function BangDiemLopThuong({ classId, maLop, quyen, onDoi, chuongTrinh = null, moc = null }: {
  classId: number; maLop?: string; quyen: QuyenDong; onDoi: () => void;
  /** Mã chương trình lớp (MH2) và mốc kiểm tra của chương trình (`progress`/`final`). */
  chuongTrinh?: string | null; moc?: string[] | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<DongThuong[]>(`/classes/${classId}/roster`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong: true, quyen, maLop, onDone: () => { reload(); onDoi(); } });

  if (error) return <p className="m-0 text-xs text-rose-200">{error.message}</p>;
  if (loading || !data) return <Skeleton rows={4} />;
  const rows = data.filter((s) => !s.archived);
  if (!rows.length) return <Empty title="Lớp chưa có học viên" />;
  const mon = rows[0].skills ?? [];
  const BAI = (moc?.length ? moc : MOC_MAC_DINH).map((kind) => ({ kind, nhan: ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? kind }));
  /* MH7: Pre FOU không chia môn — thêm cột % tổng sau cột Tổng hợp của mỗi mốc. */
  const coPhanTram = CHUONG_TRINH_KHONG_CHIA_MON.includes(chuongTrinh ?? '');
  const soCot = mon.length + (coPhanTram ? 1 : 0);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[840px] table-fixed text-sm">
        <colgroup>
          <col className="w-[24%]" />
          {BAI.flatMap((b) => [...mon, ...(coPhanTram ? ['%'] : [])].map((k) => <col key={`${b.kind}-${k}`} />))}
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="th align-bottom" rowSpan={2}>Học viên</th>
            {BAI.map((b) => (
              <th key={b.kind} className="th border-b text-center" colSpan={soCot} style={{ borderColor: 'var(--line)' }}>{b.nhan}</th>
            ))}
            <th className="th" rowSpan={2}><span className="sr-only">Thao tác</span></th>
          </tr>
          <tr>
            {BAI.flatMap((b) => [
              ...mon.map((k) => (
                <th key={`${b.kind}-${k}`} className="th text-center"><abbr className="no-underline" title={tenMon(chuongTrinh, k)}>{tenMonNgan(chuongTrinh, k)}</abbr></th>
              )),
              ...(coPhanTram ? [<th key={`${b.kind}-%`} className="th text-right" title="Điểm đạt / tổng điểm cả bài">%</th>] : []),
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
              <td className="td h-11">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Link className="link truncate" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                  <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  <MissingBadge items={s.missing} gon />
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
                {s.ketThucVi && <span className="block mt-0.5 text-[10px] text-slate-500">{s.ketThucVi}</span>}
              </td>
              {BAI.flatMap((b) => {
                const t = s.timeline.find((x) => x.kind === b.kind) ?? null;
                const o = t?.ratios?.[mon[0]] ?? null;
                return [
                  ...mon.map((k) => (
                    <td key={`${b.kind}-${k}`} className="td text-center tabular-nums">
                      <ODiemThuong o={t?.ratios?.[k] ?? null} tuan={t?.tuanMon?.[k] ?? null} homNay={homNay} />
                    </td>
                  )),
                  ...(coPhanTram ? [(
                    <td key={`${b.kind}-%`} className="td text-right tabular-nums">
                      {o && o.score !== null && o.total ? `${Math.round((o.score / o.total) * 100)}%` : <span className="text-slate-600">—</span>}
                    </td>
                  )] : []),
                ];
              })}
              <td className="td text-center">
                <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, true, s.timeline) })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tt.panels}
    </div>
  );
}

function ODiemThuong({ o, tuan, homNay }: { o: ODiem | null; tuan: string | null; homNay: string }) {
  if (o && o.score !== null && o.total !== null) {
    const truot = o.outcome === 'fail';
    /* PR-N1 A3: trượt có dấu mảnh ▾ — không chỉ dựa vào màu. */
    return (
      <span className={truot ? 'font-semibold text-rose-300' : 'text-slate-100'} title={truot ? 'Chưa đạt' : 'Đạt'}>
        {truot && <DauDuoi />}{o.score}/{o.total}
      </span>
    );
  }
  if (tuan) {
    /* Tuần thi đã QUA mà vẫn chưa có điểm là một dạng quá hạn nhập điểm — khác với tuần chưa tới lịch. */
    const daQua = tuan < mondayOfDate(homNay);
    if (daQua) return <span className="text-[11px] text-amber-200" title="Tuần thi đã qua nhưng chưa nhập điểm">Chưa có điểm</span>;
    return <span className="text-[11px] text-slate-500" title="Tuần thi môn này">{tuanLich(tuan, homNay)}</span>;
  }
  return <span className="text-slate-700">–</span>;
}
