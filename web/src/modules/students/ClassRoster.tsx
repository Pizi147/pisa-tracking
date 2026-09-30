import type { NhanYThucEm } from '@shared/domain/index.ts';
import { ChipLichSu, DauDuoi } from '../../ui/Nhan.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ExamPlanText, Level, Outcome, Skeleton, TargetText, Th } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { duongViecTiep, nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { MoiVao } from '../classes/DaiChuyenLop.tsx';
import { fmtBand, sosTone } from '../../lib/format.ts';
import {
  ENTRY_SKILL_LABEL, GIAI_THICH_KCK, duongHoSoHocVien, maHocVienNgan, skillShort, type EntrySkill, type ExamPlan, type ViecTiepTheo,
} from '@shared/domain/index.ts';

type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  kind: string; kindLabel: string;
  periodCode: string | null; status: string;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  passedCount: number | null; failedCount: number | null;
  sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

/** Một mốc trong lịch sử điểm của lớp Fast Track — lớp thường có bảng riêng (`BangDiemLopThuong`, không dùng type này). */
type HistoryRow = {
  id: number; label: string; kind: string; periodCode: string | null;
  sosLevel: number | null; evaluable: boolean;
  scoredRequired: number; requiredCount: number;
  overall: number | null;
  /** Kỳ vọng của đúng mốc này (PR-N1 K2-10) — ô band so với số này, không so target. */
  expectation: number | null;
  /** Writing tổng của mốc (SOS xét cột này). */
  writing: number | null;
  bands: Record<string, number | null> | null;
  /** Rà #119: MT lịch sử (tuần thi trước khi lượt được tạo) — điểm thật nhưng không phải hiện trạng: ô xám, nhãn "lịch sử". */
  lichSu?: boolean;
};

type RosterRow = {
  missing: { key: string; label: string; who: string }[];
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; moiVao?: boolean;
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC, thay cho nhãn chung "Đã kết thúc". */
  ketThucVi?: string | null;
  skills: string[] | null;
  cycle: { id: number; seq: number; route: string | null; target: number | null; khongCamKet?: boolean } | null;
  standingLine: string | null;
  sosLevel: number | null; provisional: boolean;
  openCases: number; handoverCases: number; examPlan: ExamPlan;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  history: HistoryRow[];
  myPending: string[];
  canhBaoYThuc: NhanYThucEm | null;
  /** Việc tiếp theo của em (`viecTiepCuaEm`): cột Theo dõi hiện việc đầu tiên. */
  viecTiepTheo: ViecTiepTheo[];
};

/** Bộ cột điểm của lớp Fast Track — mục 5.2: Target · Dự kiến thi · Mốc · OVR · L · R · W1 · W2 · W · S (W = Writing tổng, PR-N1 K2-10). */
const FT_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking'] as const;

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP FAST TRACK (đặc tả §3.7 "FT: như hiện có (đợt MT)", mockup 06).
 * Lớp thường dùng bảng riêng — `BangDiemLopThuong`. Nằm ở: Học viên & Lớp → Hồ sơ lớp FT → tab Học viên → Điểm.
 * PR-HVL (K2-11, rà #119): cố định 2 mốc (bỏ công tắc số mốc); cột Theo dõi = MỘT việc tiếp theo bấm được; MT lịch sử vẽ xám, nhãn "lịch sử".
 *
 * LỊCH SỬ ĐIỂM 2–3 MỐC (mục 5.4): mỗi ô điểm là một cột dọc, mốc mới nhất trên cùng và đậm
 * hơn, mốc cũ nhạt dần. Không có mũi tên tăng/giảm trên từng ô — các hàng đã thẳng cột với
 * nhau nên mắt tự so được, và thêm chục mũi tên thì cả bảng lại đầy nhãn.
 *
 * Ô TRỐNG NGHĨA LÀ CHƯA NHẬP, và nó giữ nguyên là ô trống: không lấy điểm mốc cũ lấp vào ô
 * thiếu của mốc mới, không ghép điểm khác lượt thành Overall.
 */
export function ClassRoster({ classId, maLop, quyen, onDoi, onAddStudents }: {
  classId: number; maLop?: string; quyen: QuyenDong; onDoi: () => void; onAddStudents?: () => void;
}) {
  const { data, loading, error, reload } = useApi<RosterRow[]>(`/classes/${classId}/roster`, [classId]);
  /* K2-11, Q11: cố định 2 mốc — đủ trả lời "em đang lên hay xuống"; bỏ công tắc số mốc. */
  const depth = 2;
  const tt = useThaoTacDongHocVien({ laLopThuong: false, quyen, maLop, onDone: () => { reload(); onDoi(); } });
  const dienThoai = useDienThoai();

  if (loading) return <div className="surface-2 rounded-lg p-3"><Skeleton rows={3} /></div>;
  if (error) {
    return (
      <div className="surface-2 rounded-lg p-3 text-xs text-rose-200">
        {error.message} <button className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </div>
    );
  }
  if (!data) return null;
  if (!data.length) {
    return (
      <div className="surface-2 rounded-lg">
        <Empty
          title="Lớp chưa có học viên"
          action={onAddStudents && <button className="btn btn-sm" onClick={onAddStudents}>Thêm học viên</button>}
        />
      </div>
    );
  }

  const skills = FT_SKILLS;
  const skillLabel = skillShort;

  /* D2: điện thoại (< 640 px) — mỗi em một thẻ: Target · Dự kiến thi · mốc gần nhất (OVR + L R W S thẳng hàng) · Theo dõi. */
  if (dienThoai) {
    return (
      <div className="surface-2 overflow-hidden rounded-lg">
        <p className="m-0 border-b px-3 py-2 text-[11px] text-slate-500" style={{ borderColor: 'var(--line)' }}>Mốc gần nhất của từng em (điểm 2 mốc gần nhất ở bảng trên máy tính).</p>
        {data.map((s) => {
          const h = s.history[0];
          return (
            <TheDong key={s.id} className={s.status !== 'active' ? 'row-muted' : ''}
              dau={(
                <>
                  <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <Link className="link font-semibold" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>{s.moiVao && <MoiVao />}
                    <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                    <MissingBadge items={s.missing} gon />
                    <CanhBaoYThuc cb={s.canhBaoYThuc} />
                  </span>
                  <span className="mt-1 block"><KetLuan row={s} /></span>
                </>
              )}
              hanhDong={<MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, false, s.timeline) })} />}
              dong={[
                { nhan: 'Target', noiDung: <TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /> },
                { nhan: 'Dự kiến thi', noiDung: <ExamPlanText plan={s.examPlan} /> },
                { nhan: 'Mốc', noiDung: !h ? <span className="text-slate-500">chưa có điểm</span> : (
                  <>
                    <Link className="no-underline" to={duongHoSoHocVien(s.id, { dot: h.id })} title={`Mở hồ sơ ${s.fullName} ở ${h.label}`}>
                      <span className="text-slate-200">{h.label}</span>
                      {h.lichSu && <> <ChipLichSu /></>}
                    </Link>
                    {' · OVR '}<Band v={h.overall} kyVong={h.expectation ?? null} faded={false} lichSu={h.lichSu} />
                    <span className="mt-0.5 grid grid-cols-4 gap-x-2">
                      {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                        <span key={k}><span className="text-slate-500">{skillLabel(k)} </span>
                          <Band v={k === 'writing' ? h.writing ?? null : h.bands?.[k] ?? null} kyVong={h.expectation ?? null} faded={false} lichSu={h.lichSu} />
                        </span>
                      ))}
                    </span>
                  </>
                ) },
                { nhan: 'Theo dõi', noiDung: <FollowCell row={s} classId={classId} /> },
              ]} />
          );
        })}
        {tt.panels}
      </div>
    );
  }

  return (
    <div className="surface-2 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'var(--line)' }}>
        <span className="text-[11px] text-slate-500">
          Điểm của {depth} mốc gần nhất, mốc mới nhất ở trên.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] table-fixed text-sm">
          <colgroup>
            <col className="w-[22%]" /><col className="w-[6%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[6%]" />
            {skills.map((k) => <col key={k} className="w-[5%]" />)}
            <col className="w-[14%]" /><col className="w-12" />
          </colgroup>
          <thead>
            <tr>
              <Th hint="Tên em, và một câu về kết quả mốc gần nhất của em." className="sticky-col">Học viên</Th>
              <Th align="right" hint="Điểm mục tiêu của lộ trình em đang học. KCK = không cam kết đầu ra, không tính SOS.">Target</Th>
              <Th hint="Kỳ thi IELTS thật, ở đúng mức chắc chắn đang biết: tuần, hoặc mới có tháng, hoặc chưa xác định.">
                Dự kiến thi
              </Th>
              <Th hint="Lượt MT ứng với mỗi hàng điểm bên phải — mốc mới nhất ở trên.">
                Mốc
              </Th>
              <Th align="right" hint="Overall — chỉ có khi đợt Test đó đủ cả bốn kỹ năng. Không ghép điểm của đợt khác thành Overall.">
                OVR
              </Th>
              {skills.map((k) => (
                <Th key={k} align="right" hint={k === 'writing' ? 'Writing tổng ở từng mốc — SOS xét cột này' : `${ENTRY_SKILL_LABEL[k as EntrySkill] ?? k} ở từng mốc`}>
                  {k === 'writing' ? 'W' : skillLabel(k)}
                </Th>
              ))}
              <Th hint="Một việc tiếp theo (bấm để làm), kèm số Case đang xử lý. Quá hạn là thông tin của việc đó, không phải một việc riêng.">
                Theo dõi
              </Th>
              <th className="th"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const rows = s.history.slice(0, depth);
              const span = Math.max(rows.length, 1);
              return (
                <tr key={s.id} className={`row-hover align-top ${s.status !== 'active' ? 'row-muted' : ''}`}>
                  {/* 640–1023 px: bảng cuộn ngang TRONG vùng bảng, cột tên dính (mỗi lớp một bảng nên không bám cả trang). */}
                  <td className="td sticky-col [background:var(--surface-2)]">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>{s.moiVao && <MoiVao />}
                      <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                      <MissingBadge items={s.missing} gon />
                      <CanhBaoYThuc cb={s.canhBaoYThuc} />
                    </span>
                    {/*
                      DƯỚI TÊN CHỈ CÒN KẾT LUẬN — một nhãn nhỏ có màu (PR-HV, chủ sản phẩm 22/09): "MTx:", "mới có
                      điểm k/n kỹ năng", "còn n case đang theo dõi" đã bỏ vì cột Mốc và cột Theo dõi đã nói.
                    */}
                    <span className="block mt-1"><KetLuan row={s} /></span>
                  </td>

                  <td className="td text-right tabular-nums whitespace-nowrap"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></td>
                  <td className="td whitespace-nowrap text-xs"><ExamPlanText plan={s.examPlan} /></td>

                  {/* ─── các cột điểm: mỗi mốc một hàng con, thẳng cột với nhau ─── */}
                  <td className="td p-0">
                    <Stack n={span}>
                      {rows.length === 0
                        ? [<span key="none" className="text-[11px] text-slate-500">chưa có điểm</span>]
                        : rows.map((h, i) => (
                          <Link key={h.id} className="no-underline"
                            to={duongHoSoHocVien(s.id, { dot: h.id })} title={`Mở hồ sơ ${s.fullName} ở ${h.label}`}>
                            <span className={`text-xs whitespace-nowrap ${i === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                              {h.label}{h.lichSu && <> <ChipLichSu /></>}
                              {h.scoredRequired < h.requiredCount && (
                                <span className="text-[11px] text-amber-200 ml-1">
                                  {h.scoredRequired}/{h.requiredCount}
                                </span>
                              )}
                            </span>
                          </Link>
                        ))}
                    </Stack>
                  </td>

                  <td className="td p-0 text-right">
                    <Stack n={span} align="right">
                      {rows.length === 0 ? [<Dash key="none" />]
                        : rows.map((h, i) => (
                          <Band key={h.id} v={h.overall} kyVong={h.expectation ?? null} faded={i > 0} lichSu={h.lichSu} />
                        ))}
                    </Stack>
                  </td>

                  {skills.map((k) => (
                    <td key={k} className="td p-0 text-right">
                      <Stack n={span} align="right">
                        {rows.length === 0 ? [<Dash key="none" />]
                          : rows.map((h, i) => (
                            <Band key={h.id} v={k === 'writing' ? h.writing ?? null : h.bands?.[k] ?? null} kyVong={h.expectation ?? null}
                              soSanh={k !== 'writing1' && k !== 'writing2'} faded={i > 0} lichSu={h.lichSu} />
                          ))}
                      </Stack>
                    </td>
                  ))}

                  <td className="td"><FollowCell row={s} classId={classId} /></td>
                  <td className="td text-center">
                    <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, false, s.timeline) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tt.panels}
    </div>
  );
}

/**
 * KẾT LUẬN DƯỚI TÊN — dựng từ ba trường có sẵn (sosLevel · provisional · status), không gọi thêm máy chủ:
 *   SOS {n} · tạm thời (vàng) · SOS {n} (vàng) · Đạt kỳ vọng (xám; thêm "· tạm thời" khi mới có một phần điểm)
 *   · Chưa có kết quả (xám) · Không tính SOS (xám, em Target KCK) · Đã kết thúc (xám).
 */
function KetLuan({ row }: { row: RosterRow }) {
  const xam = 'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap bg-slate-300/8 text-slate-400 border-slate-300/20';
  if (row.status !== 'active') return <span className={xam}>{row.ketThucVi ?? 'Đã kết thúc'}</span>;
  /* Q29-1: em KCK có điểm vẫn không có kỳ vọng — nói rõ "không tính SOS", không để đọc thành "chưa chấm". */
  if (row.sosLevel === null && row.cycle?.khongCamKet) return <span className={xam} title={GIAI_THICH_KCK}>Không tính SOS</span>;
  if (row.sosLevel === null) return <span className={xam}>Chưa có kết quả</span>;
  const tamThoi = row.provisional ? ' · tạm thời' : '';
  /* PR-N1 A2: màu theo đúng mức SOS (hết vàng cho mọi mức); tạm thời = viền đứt + chữ "tạm thời". */
  if (row.sosLevel > 0) return <Level tone={sosTone(row.sosLevel)} dut={row.provisional}>SOS {row.sosLevel}{row.provisional ? ' tạm thời' : ''}</Level>;
  return <span className={xam}>Đạt kỳ vọng{tamThoi}</span>;
}

/** Các hàng con của một ô, cao bằng nhau để mọi cột thẳng hàng theo cùng một mốc. */
function Stack({ children, n, align = 'left' }: {
  children: React.ReactNode[]; n: number; align?: 'left' | 'right';
}) {
  return (
    <span className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} px-2 py-1.5`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="h-5 flex items-center">{children[i] ?? null}</span>
      ))}
    </span>
  );
}

function Dash() { return <span className="text-slate-700">–</span>; }

/**
 * Ô band (PR-N1 K2-10, A3, A9): so KỲ VỌNG CỦA ĐÚNG MỐC (không so target); dưới kỳ vọng có dấu mảnh ▾ (không chỉ dựa màu);
 * luôn một chữ số thập phân. W1/W2 không tô đạt/chưa đạt (SOS xét Writing tổng). Mốc cũ nhạt hơn (mục 5.4).
 */
function Band({ v, kyVong, faded, soSanh = true, lichSu = false }: { v: number | null; kyVong: number | null; faded: boolean; soSanh?: boolean; lichSu?: boolean }) {
  if (v === null) return <Dash />;
  /* MT lịch sử: xám, không đạt/chưa đạt, không dấu dưới — hết mâu thuẫn "Chưa có kết quả" cạnh "▾5.0" đỏ (rà #119). */
  if (lichSu) return <span className="tabular-nums text-xs text-slate-400" title="MT lịch sử — không phải hiện trạng">{fmtBand(v)}</span>;
  const duoi = soSanh && kyVong !== null && v < kyVong;
  /* Mốc cũ (faded) nhạt hơn bằng MÀU XÁM chứ không bằng độ trong: opacity-55 làm chữ đạt/chưa đạt < 4.5:1 ở chế độ sáng (PR-SANG, Task 8). */
  const tone = faded ? 'text-slate-400' : !soSanh || kyVong === null ? 'text-slate-100' : duoi ? 'text-rose-200' : 'text-emerald-200';
  return (
    <span className={`tabular-nums text-xs ${tone}`} title={kyVong !== null ? `kỳ vọng ${fmtBand(kyVong)}` : undefined}>
      {duoi && <DauDuoi />}{fmtBand(v)}
    </span>
  );
}

/**
 * CỘT THEO DÕI — MỘT hành động chính, rồi mới tới thông tin phụ (mục 5.2).
 *
 * Bản trước xếp chồng ba bốn nhãn cùng nói một chuyện: "Nhập điểm R", "Quá hạn nhập điểm",
 * "SOS 1", "2 case chưa xong". Nay:
 *
 *   dòng 1  MỘT việc chính, kèm mốc của nó — màu đỏ = quá hạn (không lặp chữ "quá hạn nhập điểm")
 *   dòng 2  "{n} case" · "{n} case bàn giao" — chỉ số đếm (PR-HV, chủ sản phẩm 22/09: bỏ nhãn "Cần bàn giao" riêng,
 *           đã gộp vào dòng này)
 */
function FollowCell({ row, classId }: { row: RosterRow; classId: number }) {
  if (row.status !== 'active') return <span className="text-xs text-slate-600">—</span>;

  const here = row.openCases - (row.handoverCases ?? 0);
  const bits: string[] = [];
  if (here > 0) bits.push(`${here} Case`);
  if (row.handoverCases > 0) bits.push(`${row.handoverCases} Case bàn giao`);

  /* K2-04: MỘT việc chính = việc đầu của `viecTiepTheo` (đã xếp đỏ → vàng → xanh), cùng nguồn với cột Việc tiếp theo ở Học viên & Lớp; bấm được. */
  const v = row.viecTiepTheo[0];
  if (!v && bits.length === 0) return <span className="text-xs text-slate-600">—</span>;

  return (
    <span className="flex flex-col items-start gap-1">
      {v
        ? <ViecTiep v={v} den={duongViecTiep(v, { studentId: row.id, classId, laLopThuong: false, timeline: row.timeline })} />
        : here > 0
          ? <span className="text-xs text-slate-400">Đang theo dõi</span>
          : null}
      {bits.length > 0 && (
        <span className="text-[11px] text-slate-500" title={row.handoverCases > 0 ? 'Case còn dở từ lớp hoặc chương trình trước — cần bàn giao' : undefined}>{bits.join(' · ')}</span>
      )}
    </span>
  );
}

/*
 * CỘT "TRẠNG THÁI" RIÊNG ĐÃ BỎ (mục 5.2) — nội dung của nó chuyển thành MỘT CÂU dưới tên em.
 *
 * Nhãn "Đúng tiến độ" cũng bỏ theo: nó là một lời hứa mà một kết quả đơn lẻ không đủ căn cứ
 * để nói. Thay bằng câu nói rõ căn cứ: "MT2 đạt kỳ vọng · còn 2 case đang theo dõi".
 *
 * DẢI TIẾN TRÌNH MT cũng bỏ khỏi bảng lớp: cột "Mốc" nay đã nói mốc nào ứng với hàng điểm
 * nào, và toàn bộ hành trình vẫn mở được ở hồ sơ từng em.
 */
export { Outcome };
