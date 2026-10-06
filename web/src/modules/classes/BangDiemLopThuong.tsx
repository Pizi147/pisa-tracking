import type { ExamPlan, GoiYCuoiKhoa, NguCanhDs, NhanYThucEm } from '@shared/domain/index.ts';
import { Link } from 'react-router-dom';
import { DauDuoi, Nhan } from '../../ui/Nhan.tsx';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ExamPlanText, Skeleton, TargetText } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { OChon, OChonTatCa, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { MoiVao } from './DaiChuyenLop.tsx';
import { ATTEMPT_KIND_SHORT, CHUONG_TRINH_KHONG_CHIA_MON, maHocVienNgan, mondayOfDate, tenMon, tenMonNgan, tuanLich, type AttemptKind } from '@shared/domain/index.ts';

type ODiem = { score: number | null; total: number | null; outcome: string };
type LuotThuong = {
  id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number;
  ratios: Record<string, ODiem> | null; tuanMon: Record<string, string | null> | null;
};
type DongThuong = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; moiVao?: boolean; skills: string[] | null;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: NhanYThucEm | null;
  /** PR-DH (04/10): Target + Dự kiến thi của lớp thường (PR-NT) — chỉ để theo dõi, không so với điểm. */
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  examPlan: ExamPlan;
  timeline: LuotThuong[];
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC. */
  ketThucVi?: string | null;
  /** PR-UXF-a K2-12: % tổng + gợi ý hướng Cuối khoá — cùng hàm với panel Chuyển lớp (`cuoiKhoaTheoHocVien`). */
  cuoiKhoa?: { tyLe: number | null; goiY: GoiYCuoiKhoa | null } | null;
};
const TIEU_DE_HUONG = 'Theo luật Cuối khoá — Quản lý quyết ở panel Chuyển lớp';

/** Hồ sơ lớp cũ chưa gửi mốc: Giữa khoá + Cuối khoá như trước. */
const MOC_MAC_DINH = ['progress', 'final'];

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP THƯỜNG (đặc tả §3.7, mockup 10b phương án A).
 * Nhóm cột theo MỐC của chương trình (FOU/BE/ELE Giữa khoá | Cuối khoá; Pre FOU chỉ Cuối khoá — K2-12), mỗi nhóm là bộ môn của
 * lớp, tên theo chương trình (FOU L R G+V P; Pre FOU một cột Tổng hợp + cột % — MH7). Ô `đúng/tổng`, đỏ nếu chưa đạt (dưới 70%). Chưa có điểm mà đã có lịch thì ghi
 * tuần thi (`W3 SEP`, G-6); chưa có lịch thì gạch. Thiếu điểm KHÁC chưa đạt: không tô đỏ.
 */
export function BangDiemLopThuong({ classId, maLop, quyen, onDoi, chuongTrinh = null, moc = null, chon }: {
  classId: number; maLop?: string; quyen: QuyenDong; onDoi: () => void;
  /** PR-LUI-b: "Chọn nhiều học viên" — bật thì mỗi dòng / thẻ có ô chọn (Quản lý / Quản trị). */
  chon?: ChonNhieu;
  /** Mã chương trình lớp (MH2) và mốc kiểm tra của chương trình (`progress`/`final`). */
  chuongTrinh?: string | null; moc?: string[] | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<DongThuong[]>(`/classes/${classId}/roster`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong: true, quyen, maLop, onDone: () => { reload(); onDoi(); } });
  const dienThoai = useDienThoai();

  if (error) return <p className="m-0 text-xs text-rose-200">{error.message}</p>;
  if (loading || !data) return <Skeleton rows={4} />;
  const rows = data.filter((s) => !s.archived);
  if (!rows.length) return <Empty title="Lớp chưa có học viên" />;
  const ds: NguCanhDs = { loai: 'hoc-vien', ids: rows.map((s) => s.id), nhan: maLop ? `Lớp ${maLop}` : 'Lớp' };   // PR-DH: Trước/Sau theo thứ tự bảng
  const mon = rows[0].skills ?? [];
  const BAI = (moc?.length ? moc : MOC_MAC_DINH).map((kind) => ({ kind, nhan: ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? kind }));
  /* MH7: Pre FOU không chia môn — thêm cột % tổng sau cột Tổng hợp của mỗi mốc. K2-12: nhóm Cuối khoá mọi lớp thường có "% tổng" + "Hướng gợi ý". */
  const coPhanTram = CHUONG_TRINH_KHONG_CHIA_MON.includes(chuongTrinh ?? '');
  const cotPhu = (kind: string) => [...(coPhanTram || kind === 'final' ? ['%'] : []), ...(kind === 'final' ? ['huong'] : [])];
  const coCuoiKhoa = BAI.some((b) => b.kind === 'final');
  /** % của một mốc: Cuối khoá đọc % tổng máy chủ (cùng số với panel Chuyển lớp); mốc khác của Pre FOU tính từ ô Tổng hợp. */
  const phanTram = (s: DongThuong, kind: string, o: ODiem | null): number | null => (kind === 'final'
    ? s.cuoiKhoa?.tyLe ?? null
    : o && o.score !== null && o.total ? o.score / o.total : null);

  /* D2: điện thoại (< 640 px) — mỗi em một thẻ, mỗi MỐC một dòng: "Giữa khoá · L 14/20 · R … · %". */
  if (dienThoai) {
    return (
      <div className="card overflow-hidden">
        {rows.map((s) => (
          <TheDong key={s.id} className={`${s.status !== 'active' ? 'row-muted' : ''} ${chon?.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}
            dau={(
              <>
                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {chon?.bat && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                  <Link className="link font-semibold" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>{s.moiVao && <MoiVao />}
                  <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  <MissingBadge items={s.missing} gon />
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
                {s.ketThucVi && <span className="mt-0.5 block text-xs text-slate-400">{s.ketThucVi}</span>}
              </>
            )}
            hanhDong={<MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, true, s.timeline) })} />}
            dong={[
              { nhan: 'Target', noiDung: <TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /> },
              { nhan: 'Dự kiến thi', noiDung: <ExamPlanText plan={s.examPlan} /> },
            ].concat(BAI.map((b) => {
              const t = s.timeline.find((x) => x.kind === b.kind) ?? null;
              const o = t?.ratios?.[mon[0]] ?? null;
              return {
                nhan: b.nhan,
                noiDung: (
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    {mon.map((k) => (
                      <span key={k} className="whitespace-nowrap">
                        <abbr className="text-slate-500 no-underline" title={tenMon(chuongTrinh, k)}>{tenMonNgan(chuongTrinh, k)}</abbr>{' '}
                        <ODiemThuong o={t?.ratios?.[k] ?? null} tuan={t?.tuanMon?.[k] ?? null} homNay={homNay} />
                      </span>
                    ))}
                    {cotPhu(b.kind).includes('%') && (
                      <span className="whitespace-nowrap"><span className="text-slate-500">% tổng</span>{' '}<OPhanTram v={phanTram(s, b.kind, o)} /></span>
                    )}
                  </span>
                ),
              };
            })).concat(coCuoiKhoa ? [{ nhan: 'Hướng gợi ý', noiDung: <OHuongGoiY goiY={s.cuoiKhoa?.goiY ?? null} /> }] : [])} />
        ))}
        {tt.panels}
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto overflow-y-hidden">
      <table className={`w-full ${coCuoiKhoa ? 'min-w-[1040px]' : 'min-w-[920px]'} table-fixed text-sm`}>
        <colgroup>
          <col className="w-[19%]" /><col className="w-[6%]" /><col className="w-[9%]" />
          {BAI.flatMap((b) => [...mon, ...cotPhu(b.kind)].map((k) => <col key={`${b.kind}-${k}`} className={k === 'huong' ? 'w-[10rem]' : undefined} />))}
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="th sticky-col align-bottom" rowSpan={2}>{chon?.bat && <span className="mr-2 inline-flex align-middle"><OChonTatCa chon={chon} ids={rows.map((s) => s.id)} /></span>}Học viên</th>
            <th className="th text-right align-bottom" rowSpan={2} title="Điểm Target của lộ trình em đang học. KCK = không cam kết đầu ra. Lớp thường chỉ để theo dõi.">Target</th>
            <th className="th align-bottom" rowSpan={2} title="Kỳ thi IELTS thật, ở đúng mức chắc chắn đang biết: tuần, hoặc mới có tháng, hoặc chưa xác định.">Dự kiến thi</th>
            {BAI.map((b) => (
              <th key={b.kind} className="th border-b text-center" colSpan={mon.length + cotPhu(b.kind).length} style={{ borderColor: 'var(--line)' }}>{b.nhan}</th>
            ))}
            <th className="th" rowSpan={2}><span className="sr-only">Thao tác</span></th>
          </tr>
          <tr>
            {BAI.flatMap((b) => [
              ...mon.map((k) => (
                <th key={`${b.kind}-${k}`} className="th text-center"><abbr className="no-underline" title={tenMon(chuongTrinh, k)}>{tenMonNgan(chuongTrinh, k)}</abbr></th>
              )),
              ...(cotPhu(b.kind).includes('%') ? [<th key={`${b.kind}-%`} className="th text-right" title="Điểm đạt / tổng điểm cả bài">% tổng</th>] : []),
              ...(b.kind === 'final' ? [<th key={`${b.kind}-huong`} className="th" title={TIEU_DE_HUONG}>Hướng gợi ý</th>] : []),
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''} ${chon?.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
              {/* 640–1023 px: bảng cuộn ngang TRONG vùng bảng, cột tên dính (mỗi lớp một bảng nên không bám cả trang). */}
              <td className="td sticky-col h-11">
                <span className="flex min-w-0 items-center gap-1.5">
                  {chon?.bat && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                  <Link className="link truncate font-semibold" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>{s.moiVao && <MoiVao />}
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  <MissingBadge items={s.missing} gon />
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
                {s.ketThucVi && <span className="block mt-0.5 text-xs text-slate-400">{s.ketThucVi}</span>}
              </td>
              <td className="td text-right tabular-nums whitespace-nowrap"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></td>
              <td className="td whitespace-nowrap text-xs"><ExamPlanText plan={s.examPlan} /></td>
              {BAI.flatMap((b) => {
                const t = s.timeline.find((x) => x.kind === b.kind) ?? null;
                const o = t?.ratios?.[mon[0]] ?? null;
                return [
                  ...mon.map((k) => (
                    <td key={`${b.kind}-${k}`} className="td text-center tabular-nums">
                      <ODiemThuong o={t?.ratios?.[k] ?? null} tuan={t?.tuanMon?.[k] ?? null} homNay={homNay} />
                    </td>
                  )),
                  ...(cotPhu(b.kind).includes('%') ? [(
                    <td key={`${b.kind}-%`} className="td text-right"><OPhanTram v={phanTram(s, b.kind, o)} /></td>
                  )] : []),
                  ...(b.kind === 'final' ? [<td key={`${b.kind}-huong`} className="td"><OHuongGoiY goiY={s.cuoiKhoa?.goiY ?? null} /></td>] : []),
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

function OPhanTram({ v }: { v: number | null }) {
  return v === null ? <span className="text-slate-600">—</span> : <span className="text-[12px] tabular-nums text-slate-100">{Math.round(v * 100)}%</span>;
}

/** Chữ "Hướng gợi ý" — cùng chữ, cùng chip với cột Hệ thống gợi ý của panel Chuyển lớp (`goiY.nhanHuong`; 50–59 % chip "Quản lý cân nhắc"). */
function OHuongGoiY({ goiY }: { goiY: GoiYCuoiKhoa | null }) {
  if (!goiY) return <span className="text-slate-600" title="Hiện khi đủ điểm Cuối khoá">—</span>;
  if (goiY.canQuanLy) return <Nhan tone="soon" title={goiY.nhan}>Quản lý cân nhắc</Nhan>;
  return <span className="text-[12px] text-slate-300" title={`${goiY.nhan} · ${TIEU_DE_HUONG}`}>{goiY.nhanHuong}</span>;
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
