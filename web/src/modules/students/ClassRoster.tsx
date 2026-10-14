import type { NguCanhDs, NhanYThucEm } from '@shared/domain/index.ts';
import { CHIP_VUONG, DauDuoi } from '../../ui/Nhan.tsx';
import { NhanCu } from '../../ui/OMt.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ExamPlanText, Level, Outcome, Skeleton, TargetText, Th } from '../../ui/ui.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { duongViecTiep, nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { MoiVao } from '../classes/DaiChuyenLop.tsx';
import { OChon, OChonTatCa, type ChonNhieu } from './chonNhieuHocVien.tsx';
import { fmtBand, sosTone } from '../../lib/format.ts';
import {
  ENTRY_SKILL_LABEL, GIAI_THICH_KCK, duongHoSoHocVien, maHocVienNgan, skillShort, type EntrySkill, type ExamPlan, type LienHe, type ViecTiepTheo,
} from '@shared/domain/index.ts';
import { OPhuHuynh } from './HocVienTheoVai.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { dichViec } from './BangHocVienLop.tsx';

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

export type RosterRow = {
  missing: { key: string; label: string; who: string }[];
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; moiVao?: boolean;
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC, thay cho nhãn chung "Đã kết thúc". */
  ketThucVi?: string | null;
  skills: string[] | null;
  cycle: { id: number; seq: number; route: string | null; target: number | null; khongCamKet?: boolean } | null;
  standingLine: string | null;
  sosLevel: number | null; provisional: boolean;
  /** OV-9: em KCK dưới kỳ vọng — chip trung tính "Dưới kỳ vọng · KCK". */
  kckDuoi?: boolean;
  openCases: number; handoverCases: number; examPlan: ExamPlan;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  history: HistoryRow[];
  myPending: string[];
  canhBaoYThuc: NhanYThucEm | null;
  /** Việc tiếp theo của em (`viecTiepCuaEm`): cột Theo dõi hiện việc đầu tiên. */
  viecTiepTheo: ViecTiepTheo[];
  /** PR-OV3a (M2 §5): điểm đầu vào của lộ trình khi em CHƯA có MT0 — dòng "Đầu vào" chỉ để nhìn (không SOS, không so kỳ vọng). */
  dauVao?: DauVao | null;
  /** OV-10b: cột Phụ huynh (TVV / CX / Admin) thay cột Theo dõi (việc của GV). */
  lienHe?: LienHe;
};
type DauVao = { overall: number | null; listening: number | null; reading: number | null; writing: number | null; speaking: number | null };
/** Dòng "Đầu vào" chiếm chỗ MT0 trong 2 mốc gần nhất — em đã có 2 mốc MT thì không còn chỗ. */
const dauVaoHien = (s: RosterRow, soMoc: number): DauVao | null => (s.dauVao && soMoc < 2 ? s.dauVao : null);
const chiOverall = (d: DauVao) => d.listening === null && d.reading === null && d.writing === null && d.speaking === null;
const nhanDauVao = (d: DauVao) => (chiOverall(d) ? t('Đầu vào · chỉ Overall') : t('Đầu vào'));
function SoDauVao({ v }: { v: number | null }) {
  return v === null ? <Dash /> : <span className="tabular-nums text-xs text-slate-300">{fmtBand(v)}</span>;
}
function NhanDauVao({ d }: { d: DauVao }) {
  return <span className="whitespace-nowrap text-xs text-slate-400" title={t('Điểm đầu vào khi nhập học — chỉ để nhìn, không tính SOS / Overall / Phân tích')}>{nhanDauVao(d)}</span>;
}

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
export function ClassRoster({ classId, maLop, quyen, onDoi, onAddStudents, chon }: {
  classId: number; maLop?: string; quyen: QuyenDong; onDoi: () => void; onAddStudents?: () => void;
  /** PR-LUI-b: "Chọn nhiều học viên" — bật thì mỗi dòng / thẻ có ô chọn (Quản lý / Quản trị). */
  chon?: ChonNhieu;
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
        {error.message} <button className="btn btn-sm ml-2" onClick={reload}>{t('Thử lại')}</button>
      </div>
    );
  }
  if (!data) return null;
  /* PR-DH (Q-0310-4): hồ sơ em mở từ đây đi Trước/Sau theo đúng thứ tự bảng. */
  const ds: NguCanhDs = { loai: 'hoc-vien', ids: data.map((s) => s.id), nhan: maLop ? t('Lớp {lop}', { lop: maLop }) : t('Lớp') };
  if (!data.length) {
    return (
      <div className="surface-2 rounded-lg">
        <Empty
          title={t('Lớp chưa có học viên')}
          action={onAddStudents && <button className="btn btn-sm" onClick={onAddStudents}>{t('Thêm học viên')}</button>}
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
        {data.map((s) => {
          const h = s.history[0];
          const dv = dauVaoHien(s, s.history.length);
          return (
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
                  <span className="mt-1 block"><KetLuan row={s} cotMocTrong={!h && !dv} /></span>
                </>
              )}
              hanhDong={<MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, false, s.timeline), status: s.status })} />}
              dong={[
                { nhan: 'Target', noiDung: <TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /> },
                { nhan: t('Dự kiến thi'), noiDung: <ExamPlanText plan={s.examPlan} /> },
                ...(dv ? [{ nhan: nhanDauVao(dv), noiDung: (
                  <span className="tabular-nums">
                    {'OVR '}<SoDauVao v={dv.overall} />
                    {!chiOverall(dv) && (['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                      <span key={k}>{` · ${skillLabel(k)} `}<SoDauVao v={dv[k]} /></span>
                    ))}
                  </span>
                ) }] : []),
                ...(!h && dv ? [] : [{ nhan: t('Mốc'), noiDung: !h ? <span className="text-slate-500">{t('chưa có điểm')}</span> : (
                  <>
                    <Link className="no-underline max-sm:py-3 max-sm:-my-3" to={duongHoSoHocVien(s.id, { dot: h.id })} title={t('Mở hồ sơ {ten} ở {dot}', { ten: s.fullName, dot: dich(h.label) })}>
                      <span className="text-slate-200">{dich(h.label)}</span>
                      {h.lichSu && <> <NhanCu /></>}
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
                ) }]),
                quyen.theoVai ? { nhan: t('Phụ huynh'), noiDung: s.lienHe ? <OPhuHuynh l={s.lienHe} /> : '—' } : { nhan: t('Theo dõi'), noiDung: <FollowCell row={s} classId={classId} /> },
              ]} />
          );
        })}
        {tt.panels}
      </div>
    );
  }

  return (
    <div className="surface-2 rounded-lg">
      {/* CA2-10: câu "Điểm của 2 mốc gần nhất…" đã bỏ — ⓘ của cột Mốc nói "mốc mới nhất ở trên". */}

      <div className="table-scroll bang-dinh">
        <table className="w-full min-w-[940px] table-fixed text-sm">
          <colgroup>
            <col className="w-[22%]" /><col className="w-[6%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[6%]" />
            {skills.map((k) => <col key={k} className="w-[5%]" />)}
            <col className="w-[14%]" /><col className="w-12" />
          </colgroup>
          <thead>
            <tr>
              <Th hint={t('Tên em, và một câu về kết quả mốc gần nhất của em.')} className="sticky-col">{chon?.bat && <span className="mr-2 inline-flex align-middle"><OChonTatCa chon={chon} ids={data.map((s) => s.id)} /></span>}{t('Học viên')}</Th>
              <Th align="right" hint={t('Điểm Target của lộ trình em đang học. KCK = không cam kết đầu ra, không tính SOS.')}>Target</Th>
              <Th hint={t('Kỳ thi IELTS thật, ở đúng mức chắc chắn đang biết: tuần, hoặc mới có tháng, hoặc chưa xác định.')}>
                {t('Dự kiến thi')}
              </Th>
              <Th hint={t('Lượt MT ứng với mỗi hàng điểm bên phải — mốc mới nhất ở trên.')}>
                {t('Mốc')}
              </Th>
              <Th align="right" hint={t('Overall — chỉ có khi đợt Test đó đủ cả bốn kỹ năng. Không ghép điểm của đợt khác thành Overall.')}>
                OVR
              </Th>
              {skills.map((k) => (
                <Th key={k} align="right" hint={k === 'writing' ? t('Writing tổng ở từng mốc — SOS xét cột này') : t('{kn} ở từng mốc', { kn: ENTRY_SKILL_LABEL[k as EntrySkill] ?? k })}>
                  {k === 'writing' ? 'W' : skillLabel(k)}
                </Th>
              ))}
              {quyen.theoVai ? <Th hint={t('Tên phụ huynh (quan hệ) và số điện thoại — sửa ở Sửa thông tin của em.')}>{t('Phụ huynh')}</Th> : (
                <Th hint={t('Một việc tiếp theo (bấm để làm), kèm số Case đang xử lý. Quá hạn là thông tin của việc đó, không phải một việc riêng.')}>
                  {t('Theo dõi')}
                </Th>
              )}
              <th className="th"><span className="sr-only">{t('Thao tác')}</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const rows = s.history.slice(0, depth);
              const dv = dauVaoHien(s, rows.length);
              const span = Math.max(rows.length + (dv ? 1 : 0), 1);
              return (
                <tr key={s.id} className={`row-hover align-top ${s.status !== 'active' ? 'row-muted' : ''} ${chon?.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
                  {/* 640–1023 px: bảng cuộn ngang TRONG vùng bảng, cột tên dính (mỗi lớp một bảng nên không bám cả trang). */}
                  <td className="td sticky-col [background:var(--surface-2)]">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {chon?.bat && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                      <Link className="link" to={`/hoc-vien/${s.id}`} state={{ ds }}>{s.fullName}</Link>{s.moiVao && <MoiVao />}
                      <span className="text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                      <MissingBadge items={s.missing} gon />
                      <CanhBaoYThuc cb={s.canhBaoYThuc} />
                    </span>
                    {/*
                      DƯỚI TÊN CHỈ CÒN KẾT LUẬN — một nhãn nhỏ có màu (PR-HV, chủ sản phẩm 22/09): "MTx:", "mới có
                      điểm k/n kỹ năng", "còn n Case đang theo dõi" đã bỏ vì cột Mốc và cột Theo dõi đã nói.
                    */}
                    <span className="block mt-1"><KetLuan row={s} cotMocTrong={!rows.length && !dv} /></span>
                  </td>

                  <td className="td text-right tabular-nums whitespace-nowrap"><TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} /></td>
                  <td className="td whitespace-nowrap text-xs"><ExamPlanText plan={s.examPlan} /></td>

                  {/* ─── các cột điểm: mỗi mốc một hàng con, thẳng cột với nhau ─── */}
                  <td className="td p-0">
                    <Stack n={span}>
                      {rows.length === 0 && !dv
                        ? [<span key="none" className="text-xs text-slate-500">{t('chưa có điểm')}</span>]
                        : [...rows.map((h, i) => (
                          <Link key={h.id} className="no-underline"
                            to={duongHoSoHocVien(s.id, { dot: h.id })} title={t('Mở hồ sơ {ten} ở {dot}', { ten: s.fullName, dot: dich(h.label) })}>
                            <span className={`text-xs whitespace-nowrap ${i === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                              {dich(h.label)}{h.lichSu && <> <NhanCu /></>}
                              {h.scoredRequired < h.requiredCount && (
                                <span className="text-xs text-amber-200 ml-1">
                                  {h.scoredRequired}/{h.requiredCount}
                                </span>
                              )}
                            </span>
                          </Link>
                        )), ...(dv ? [<NhanDauVao key="dv" d={dv} />] : [])]}
                    </Stack>
                  </td>

                  <td className="td p-0 text-right">
                    <Stack n={span} align="right">
                      {rows.length === 0 && !dv ? [<Dash key="none" />]
                        : [...rows.map((h, i) => (
                          <Band key={h.id} v={h.overall} kyVong={h.expectation ?? null} faded={i > 0} lichSu={h.lichSu} />
                        )), ...(dv ? [<SoDauVao key="dv" v={dv.overall} />] : [])]}
                    </Stack>
                  </td>

                  {skills.map((k) => (
                    <td key={k} className="td p-0 text-right">
                      <Stack n={span} align="right">
                        {rows.length === 0 && !dv ? [<Dash key="none" />]
                          : [...rows.map((h, i) => (
                            <Band key={h.id} v={k === 'writing' ? h.writing ?? null : h.bands?.[k] ?? null} kyVong={h.expectation ?? null}
                              soSanh={k !== 'writing1' && k !== 'writing2'} faded={i > 0} lichSu={h.lichSu} />
                          )), ...(dv ? [<SoDauVao key="dv" v={k === 'writing1' || k === 'writing2' ? null : dv[k]} />] : [])]}
                      </Stack>
                    </td>
                  ))}

                  <td className="td">{quyen.theoVai ? (s.lienHe ? <OPhuHuynh l={s.lienHe} /> : '—') : <FollowCell row={s} classId={classId} />}</td>
                  <td className="td text-center">
                    <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, false, s.timeline), status: s.status })} />
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
 *   · Chưa có kết quả (xám) · Dưới kỳ vọng · KCK (trung tính, OV-9) · Không tính SOS (xám, em KCK chưa có Target) · Đã kết thúc (xám).
 */
export function KetLuan({ row, cotMocTrong }: { row: RosterRow; /** CA2-7: cột Mốc đã ghi "chưa có điểm" → không lặp chip "Chưa có kết quả". */ cotMocTrong: boolean }) {
  const xam = `${CHIP_VUONG} border-muted-line bg-muted-bg text-muted`;
  if (row.status !== 'active') return <span className={xam}>{row.ketThucVi ? dich(row.ketThucVi) : t('Đã kết thúc')}</span>;
  if (row.kckDuoi) return <ChipDuoiKck />;
  /* Q29-1: em KCK chưa có Target có điểm vẫn không có kỳ vọng — nói rõ "không tính SOS", không để đọc thành "chưa chấm". */
  if (row.sosLevel === null && row.cycle?.khongCamKet) return <span className={xam} title={dich(GIAI_THICH_KCK)}>{t('Không tính SOS')}</span>;
  if (row.sosLevel === null) return cotMocTrong ? null : <span className={xam}>{t('Chưa có kết quả')}</span>;
  const tamThoi = row.provisional ? ` · ${t('tạm thời')}` : '';
  /* PR-N1 A2: màu theo đúng mức SOS (hết vàng cho mọi mức); tạm thời = viền đứt + chữ "tạm thời". */
  if (row.sosLevel > 0) return <Level tone={sosTone(row.sosLevel)} dut={row.provisional}>SOS {row.sosLevel}{row.provisional ? ` ${t('tạm thời')}` : ''}</Level>;
  return <span className={xam}>{t('Đạt kỳ vọng')}{tamThoi}</span>;
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

/* audit P3-1: "–" = không có → `text-faint` (≥ 4.5:1), không phải dấu ngăn. */
function Dash() { return <span className="text-faint">–</span>; }

/**
 * Ô band (PR-N1 K2-10, A3, A9): so KỲ VỌNG CỦA ĐÚNG MỐC (không so target); dưới kỳ vọng có dấu mảnh ▾ (không chỉ dựa màu);
 * luôn một chữ số thập phân. W1/W2 không tô đạt/chưa đạt (SOS xét Writing tổng). Mốc cũ nhạt hơn (mục 5.4).
 */
function Band({ v, kyVong, faded, soSanh = true, lichSu = false }: { v: number | null; kyVong: number | null; faded: boolean; soSanh?: boolean; lichSu?: boolean }) {
  if (v === null) return <Dash />;
  /* MT lịch sử: xám, không đạt/chưa đạt, không dấu dưới — hết mâu thuẫn "Chưa có kết quả" cạnh "▾5.0" đỏ (rà #119). */
  if (lichSu) return <span className="tabular-nums text-xs text-slate-400" title={t('MT cũ — không phải hiện trạng')}>{fmtBand(v)}</span>;
  const duoi = soSanh && kyVong !== null && v < kyVong;
  /* Mốc cũ (faded) nhạt hơn bằng MÀU XÁM chứ không bằng độ trong: opacity-55 làm chữ đạt/chưa đạt < 4.5:1 ở chế độ sáng (PR-SANG, Task 8). */
  const tone = faded ? 'text-slate-400' : !soSanh || kyVong === null ? 'text-slate-100' : duoi ? 'text-rose-200' : 'text-emerald-200';
  return (
    <span className={`tabular-nums text-xs ${tone}`} title={kyVong !== null ? t('kỳ vọng {kv}', { kv: fmtBand(kyVong) }) : undefined}>
      {duoi && <DauDuoi />}{fmtBand(v)}
    </span>
  );
}

/**
 * CỘT THEO DÕI — MỘT hành động chính, rồi mới tới thông tin phụ (mục 5.2).
 *
 * Bản trước xếp chồng ba bốn nhãn cùng nói một chuyện: "Nhập điểm R", "Quá hạn nhập điểm",
 * "SOS 1", "2 Case chưa xong". Nay:
 *
 *   dòng 1  MỘT việc chính, kèm mốc của nó — màu đỏ = quá hạn (không lặp chữ "quá hạn nhập điểm")
 *   dòng 2  "{n} Case" · "{n} Case bàn giao" — chỉ số đếm (PR-HV, chủ sản phẩm 22/09: bỏ nhãn "Cần bàn giao" riêng,
 *           đã gộp vào dòng này)
 */
function FollowCell({ row, classId }: { row: RosterRow; classId: number }) {
  if (row.status !== 'active') return <span className="text-xs text-slate-600">—</span>;

  const here = row.openCases - (row.handoverCases ?? 0);
  const bits: string[] = [];
  if (here > 0) bits.push(`${here} Case`);
  if (row.handoverCases > 0) bits.push(t('{n} Case bàn giao', { n: row.handoverCases }));

  /* K2-04: MỘT việc chính = việc đầu của `viecTiepTheo` (đã xếp đỏ → vàng → xanh), cùng nguồn với cột Việc tiếp theo ở Học viên & Lớp; bấm được. */
  const v = row.viecTiepTheo[0];
  if (!v && bits.length === 0) return <span className="text-xs text-slate-600">—</span>;

  return (
    <span className="flex flex-col items-start gap-1">
      {v
        ? <ViecTiep v={dichViec(v)} den={duongViecTiep(v, { studentId: row.id, classId, laLopThuong: false, timeline: row.timeline })} />
        : here > 0
          ? <span className="text-xs text-slate-400">{t('Đang theo dõi')}</span>
          : null}
      {bits.length > 0 && (
        <span className="text-xs text-slate-500" title={row.handoverCases > 0 ? t('Case còn dở từ lớp hoặc chương trình trước — cần bàn giao') : undefined}>{bits.join(' · ')}</span>
      )}
    </span>
  );
}

/*
 * CỘT "TRẠNG THÁI" RIÊNG ĐÃ BỎ (mục 5.2) — nội dung của nó chuyển thành MỘT CÂU dưới tên em.
 *
 * Nhãn "Đúng tiến độ" cũng bỏ theo: nó là một lời hứa mà một kết quả đơn lẻ không đủ căn cứ
 * để nói. Thay bằng câu nói rõ căn cứ: "MT2 đạt kỳ vọng · còn 2 Case đang theo dõi".
 *
 * DẢI TIẾN TRÌNH MT cũng bỏ khỏi bảng lớp: cột "Mốc" nay đã nói mốc nào ứng với hàng điểm
 * nào, và toàn bộ hành trình vẫn mở được ở hồ sơ từng em.
 */
export { Outcome };
