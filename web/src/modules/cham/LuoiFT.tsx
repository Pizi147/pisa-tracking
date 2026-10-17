import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Info, Level, Status, Th } from '../../ui/ui.tsx';
import { NhanCu } from '../../ui/OMt.tsx';
import { ChipDuoiKck } from '../../ui/KetQuaDot.tsx';
import { DeadlinePill, KHOA_HOAN_TAT_HINT, apDiemVuaLuu, suaDuoc, useSaveScore, type Cell } from '../fasttrack/ScoreEntry.tsx';
import { ODiemMt } from '../fasttrack/HopNhapDiem.tsx';
import {
  fmtBand, skillLabel, skillShort, sosLabel, sosTone,
} from '../../lib/format.ts';
import { ENTRY_SKILLS, chipSosMt0, chuOChuaLuu, dotGvCham, duongDotTest, ngay, nhanLuot, tuanLich, type AssessedSkill, type NguoiChon, type TrangThaiLuuO } from '@shared/domain/index.ts';
import { DongThi } from './DongThi.tsx';
import { GOI_Y_COT_MT, NutGvCham, useGvChamCot } from './GvCham.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Dữ liệu lưới FT — chính là `cham.ft` (`classScoreSheet` ở máy chủ). */
export type FtSheet = {
  classId: number; classCode: string; branchName: string;
  period: { id: number; code: string; weekStart: string; weekEnd: string } | null;
  editableSkills: string[];
  rows: {
    attemptId: number; studentId: number; studentName: string; studentCode: string;
    attemptNo: number; status: string;
    /** R11: đợt đã đủ điểm và qua Chủ nhật của tuần bắt buộc muộn nhất — chỉ Quản lý sửa được điểm nữa. */
    hoanTat?: boolean; chuNhatCuoi?: string | null;
    /** PR-DL: chỉ `bangTheoLuot` gửi — MT lịch sử của em này (chip "lịch sử" cạnh tên). */
    lichSu?: boolean;
    cells: Cell[]; result: any;
    /** PR-MT0: hàng MT0 — chip `W 4.0 SOS` thay cho mức SOS (không kỳ vọng). */
    mt0Sos?: { skill: AssessedSkill; band: number }[];
    /** OV-1d: em đã Kết thúc học / Lưu trữ ("Đã kết thúc học" / "Lưu trữ") — hàng mờ, ô không là việc; Lưu trữ ô chỉ đọc (máy chủ khoá). Em Tạm dừng: không cờ. */
    ngungHoc?: string | null;
  }[];
};

const RAW_SKILLS = ENTRY_SKILLS.filter((s) => s === 'listening' || s === 'reading');
const W_SKILLS = ['writing1', 'writing2'] as const;

/** `?kn=writing` (kỹ năng đánh giá) khớp cả hai cột W1, W2 — Lịch Test / Việc cần làm gom Writing thành một môn. */
export const khopKn = (skill: string, kn: string | null | undefined) =>
  !!kn && (skill === kn || (kn === 'writing' && skill.startsWith('writing')));

/** HÀNG MỜ cuối bảng (PR-DL): em chưa có lịch lượt đang xem — không có ô nhập, chỉ một câu `chu` trải hết các cột điểm. */
export type HangMo = { studentId: number; ten: string; chu: ReactNode };

/** Ô CÒN PHẢI NHẬP của người đang xem — dùng để cuộn tới em đầu tiên chưa có điểm (Q12). */
export const oTrongFt = (c: Cell) => c.required && c.canEdit && c.band === null && !c.noShow
  && c.progress !== 'cancelled' && c.progress !== 'absent';

/**
 * Ô THI TUẦN KHÁC tuần đang xem mà chưa có điểm (Lịch Test, PR-UX1 Q10): chưa phải việc của tuần này — hiện chữ mờ
 * `W4 SEP`, không có ô nhập, không `data-trong` (con trỏ không nhảy vào). Ô đã huỷ phần thi không tính (OV-11a CA3-3: luôn "Đã huỷ").
 */
export const khacTuanFt = (c: Cell, tuanDangXem: string | null | undefined) =>
  !!tuanDangXem && !!c.weekStart && c.weekStart !== tuanDangXem && c.band === null && !c.noShow && c.progress !== 'cancelled';

/** OV-1d: ô thi tuần khác mà vẫn là nút — bài đã dời vì vắng, người xem gỡ được (lưới tuần gốc: "Vắng → W3 OCT"). */
export const nutTuanGoc = (c: Cell) => !!c.daChot?.doiSang && suaDuoc(c);

/**
 * OV-11a (TE-12): hàng chỉ còn ô "Đã huỷ" ở tuần đang xem, không ô nào khác để nhập / Bỏ vắng — không có việc gì, ẩn khỏi lưới theo tuần.
 */
export const chiConHuy = (r: FtSheet['rows'][number], tuanDangXem: string | null) => !!tuanDangXem
  && r.cells.some((c) => c.required && c.progress === 'cancelled' && c.weekStart === tuanDangXem)
  && !r.cells.some((c) => c.required && c.progress !== 'cancelled' && (!khacTuanFt(c, tuanDangXem) || nutTuanGoc(c)));

/** Hạn nhập điểm sớm nhất còn nợ trên cả lưới — cho `<Han>` ở đầu trang (mockup 05a §2). */
export function hanSomNhatFt(data: FtSheet | null | undefined): string | null {
  const ds = (data?.rows ?? []).filter((r) => !r.ngungHoc).flatMap((r) => r.cells)
    .filter((c) => c.required && c.band === null && c.deadline && !c.noShow
      && c.progress !== 'cancelled' && c.progress !== 'absent')
    .map((c) => c.deadline!.slice(0, 10))
    .sort();
  return ds[0] ?? null;
}

/** Tên đợt trên tiêu đề trang: MT{n}; một tuần có em ở MT khác nhau thì liệt kê. */
export const tenDotFt = (data: FtSheet | null | undefined) =>
  [...new Set((data?.rows ?? []).map((r) => r.attemptNo))].sort((a, b) => a - b).map((n) => `MT${n}`).join(', ');

/*
 * ĐỘ RỘNG CỘT CỐ ĐỊNH (G-2): `table-layout: fixed` + `colgroup`, nên cột và hàng thẳng dù dòng nào nhiều chữ hơn.
 * Tổng rộng là chiều rộng tối thiểu của bảng — màn hẹp hơn thì cuộn ngang TRONG THẺ (G-11), trang không cuộn ngang.
 */
/* PR-S4F #8: chip "▶ Đang chấm · 2/4" (Be Vietnam Pro) cần ~146 px — TT 118→146, bù HV 190→176, Kết quả 150→136: tổng vẫn 1400 px. */
const COT_HV = 176, COT_MT = 56, COT_TT = 146, COT_HAN = 140, COT_KN = 104, COT_SO = 72, COT_KQ = 136;
/* OV-4b: đầu cột "Overall" (mockup §3, thay OVR) cần ~84 px — lấy 12 px từ Kết quả, tổng giữ nguyên. */
const COT_OVR = 84, COT_KQ_OV = COT_KQ - 12;
/* PR-HSM: cột W tổng chỉ đọc (K4-26, Q12) · cột S nới cho nút "GV chấm: {tên}" dưới tiêu đề (K4-24). */
const COT_W = 56, COT_S = 130;   // PR-HSM: +W, S rộng hơn → Hạn 200→140, Kết quả 176→150 để bảng đủ cột vẫn vừa 1400 px
const W_HINT = t('Band Writing = (Task 1 + Task 2 × 2) / 3, khi đủ hai task.');

/**
 * LƯỚI CHẤM LỚP FAST TRACK — phần bảng của màn nhập điểm cả lớp trong một tuần (dời nguyên từ `ScoreSheetPage`).
 * Trang bao (`ChamDiemPage`) tải dữ liệu, dựng đầu trang và bộ chọn tuần; ở đây chỉ còn bảng.
 *
 * OV-4b: mọi ô điểm là nút → hộp nhập điểm (`HopNhapDiem`) neo ngay ô; một hộp một lúc, "Lưu · em tiếp ›" (Enter) mở hộp cùng cột ở
 * em kế còn mở được. `kn` tô cột kỹ năng đang được mở từ Lịch Test; `hv` tô dòng của một học viên.
 *
 * Lịch Test (PR-UX1 Q10): `gon` bỏ cột Trạng thái và Hạn (hàng lớp đã nói), bỏ cột MT khi cả lưới cùng một lượt;
 * `tuanDangXem` làm mờ ô thi tuần khác (`khacTuanFt`).
 */
export function LuoiFT({ data, onReload, kn = null, hv = null, gon = false, tuanDangXem = null, hangMo = [] }: {
  data: FtSheet; onReload: () => void; kn?: string | null; hv?: number | null;
  gon?: boolean; tuanDangXem?: string | null;
  /** PR-DL: em chưa có lịch lượt này — hàng mờ cuối bảng. */
  hangMo?: HangMo[];
}) {
  /* Hộp đang mở: lượt × kỹ năng. */
  const [mo, setMo] = useState<{ aid: number; s: string } | null>(null);
  const cot = {
    mt: !gon || new Set(data.rows.map((r) => r.attemptNo)).size > 1,
    trangThai: !gon,
    han: !gon,
    /* PR-MT0: lưới chỉ MT0 (`kind=mt0`) — không kỳ vọng. */
    kyVong: !(data.rows.length > 0 && data.rows.every((r) => r.mt0Sos)),
  };
  /* Cột theo đúng những cột đang hiện — `colgroup` khớp số cột (G-2). */
  const COT = [
    COT_HV, ...(cot.mt ? [COT_MT] : []), ...(cot.trangThai ? [COT_TT] : []), ...(cot.han ? [COT_HAN] : []),
    COT_KN, COT_KN, COT_KN, COT_KN, COT_W, COT_S, ...(cot.kyVong ? [COT_SO] : []), COT_OVR, COT_KQ_OV,
  ];
  const RONG = COT.reduce((a, b) => a + b, 0);
  /* K4-24: GV chấm chọn MỘT lần ở đầu cột S (nhớ theo lớp × tuần); chỉ người sửa được S, chỉ khi có tuần. */
  const suaS = data.editableSkills.includes('speaking');
  /* VIEC-NHO-2: Điểm theo lớp xem theo MT (không tuần) nhớ theo lớp × MT; MT cũ cũng có nút, không bắt buộc chọn. */
  const dot = dotGvCham(data.period?.id, data.rows.map((r) => r.attemptNo));
  const [gvCot, setGvCot] = useGvChamCot(data.classId, dot);

  if (data.rows.length === 0 && hangMo.length === 0) {
    return (
      <Empty title={t('Không có lượt Mock nào của lớp này trong tuần đã chọn')}
        hint={t('Đổi tuần ở trên, hoặc quay lại Test để chọn lớp khác.')} />
    );
  }
  const rows = data.rows.filter((r) => !chiConHuy(r, tuanDangXem));
  /* Hộp ở lưới tuần: tuần đang xem (Lịch Test) hoặc tuần của lưới (Nhập điểm) — ô dời vì vắng chỉ là ô Vắng ở tuần gốc (OV-11a). */
  const tuanXem = tuanDangXem ?? data.period?.weekStart ?? null;

  /* "Lưu · em tiếp ›": em kế CÓ Ô MỞ ĐƯỢC ở cùng cột (bỏ dòng chỉ đọc / thi tuần khác / em đã Kết thúc học); hết em thì đóng. */
  const tiep = (aid: number, s: string) => {
    const i = rows.findIndex((r) => r.attemptId === aid);
    const ke = rows.slice(i + 1).find((r) => {
      if (r.ngungHoc) return false;
      const c = r.cells.find((x) => x.skill === s);
      return !!c && suaDuoc(c) && !khacTuanFt(c, tuanDangXem);
    });
    setMo(ke ? { aid: ke.attemptId, s } : null);
  };

  const toCot = (s: string) => (khopKn(s, kn) ? 'text-[color:var(--accent-strong)]' : '');

  // ponytail: gon (Điểm theo lớp / Lịch Test, 1108 px) vừa khung → đầu cột dính; đủ cột (Nhập điểm) rộng 1400 > khung 1398 ở 1440 → giữ cuộn ngang.
  return (
    <>
    {/* FIX-DTL (chủ sản phẩm 07/10): GV chấm S ở hàng trên bảng — đầu cột S chỉ "S (band)", thẳng hàng các cột khác. */}
    {suaS && dot && <div className="flex justify-end px-3 pb-1"><NutGvCham nhan={t('GV chấm S')} value={gvCot} onChange={setGvCot} goiY={data.period ? undefined : GOI_Y_COT_MT} /></div>}
    <div className={gon ? 'table-scroll bang-dinh bang-dinh-1440' : 'overflow-x-auto'}>
      <table className="w-full text-sm tabular-nums" style={{ tableLayout: 'fixed', minWidth: RONG }}>
        <colgroup>{COT.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
        <thead>
          <tr>
            <Th className="sticky-col" hint={t('Cột này đứng yên khi cuộn ngang, để không lạc mất đang nhập cho em nào.')}>{t('Học viên')}</Th>
            {cot.mt && <Th hint={t('Số thứ tự lượt Mock Test (MT) trong lộ trình của em.')}>MT</Th>}
            {cot.trangThai && <Th hint={t('Lượt đã chấm xong, đang chờ, hay đã huỷ.')}>{t('Trạng thái')}</Th>}
            {cot.han && <Th hint={t('Hạn chấm tính riêng cho từng môn, từ tuần thi của chính môn đó: hết thứ Tư của tuần kế tiếp. Quản lý đặt được hạn riêng.')}>{t('Hạn chấm')}</Th>}
            {RAW_SKILLS.map((s) => (
              <Th key={s} align="right" className={toCot(s)} hint={t('{skillLabel} — bấm ô để nhập số câu đúng (0–40), máy tự quy ra band.', { skillLabel: skillLabel(s) })}>
                {skillShort(s)} <span className="normal-case text-slate-500">{cot.kyVong ? t('(số câu)') : '(band)'}</span>
              </Th>
            ))}
            {W_SKILLS.map((s) => (
              <Th key={s} align="right" className={toCot(s)} hint={t('{skillLabel} — bấm ô để chấm bốn tiêu chí, ra band.', { skillLabel: skillLabel(s) })}>
                {skillShort(s)}
              </Th>
            ))}
            <Th align="right" className={toCot('writing')} hint={W_HINT}>W</Th>
            <Th align="right" className={toCot('speaking')} hint={t('{skillLabel} — bấm ô để chấm bốn tiêu chí, ra band.', { skillLabel: skillLabel('speaking') })}>
              {skillShort('speaking')}
            </Th>
            {cot.kyVong && <Th align="right" hint={t('Mức mong đợi của chính lượt này, tính theo Target tại thời điểm đó.')}>{t('Kỳ vọng')}</Th>}
            <Th align="right" hint={t('Band tổng, chỉ có khi đã đủ điểm mọi kỹ năng bắt buộc.')}>Overall</Th>
            <Th hint={t('Số kỹ năng dưới kỳ vọng của lượt này — đó chính là mức SOS.')}>{t('Kết quả')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <SheetRow
              key={r.attemptId}
              row={r}
              lop={data.classCode}
              active={hv !== null && r.studentId === hv}
              cot={cot} tuanDangXem={tuanDangXem} tuanXem={tuanXem}
              onReload={onReload}
              gvMacDinh={gvCot}
              moS={mo?.aid === r.attemptId ? mo.s : null}
              onMo={(s) => setMo(s ? { aid: r.attemptId, s } : null)}
              onTiep={(s) => tiep(r.attemptId, s)}
            />
          ))}
          {hangMo.map((h) => (
            <tr key={`mo-${h.studentId}`} className="h-12" data-hv={h.studentId}>
              <td className="td py-1.5 sticky-col text-slate-500">
                <span className="block truncate" title={h.ten}>{h.ten}</span>
              </td>
              <td className="td py-1.5 text-xs text-slate-400" colSpan={COT.length - 1}>{h.chu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

/**
 * HẠN NHẬP ĐIỂM GỌN TRONG MỘT Ô, cho một dòng của bảng điểm cả lớp.
 *
 * Chọn môn đang nợ có hạn SỚM NHẤT — đó là việc phải làm trước. Khi đợt tách tuần thì các
 * môn có hạn khác nhau, nên phải gọi tên môn ra; nếu không, người đọc sẽ tưởng một ngày duy
 * nhất đó áp cho cả năm ô điểm bên cạnh.
 *
 * Tối đa MỘT dòng phụ (G-3): dấu "-" (mốc chốt Chủ nhật, §17.1) được ưu tiên vì đó là mốc người chấm có thể lỡ; các
 * môn khác cùng mang dấu gom vào một dòng, câu đầy đủ của từng môn nằm ở tooltip.
 */
function DeadlineSummary({ cells }: { cells: Cell[] }) {
  /* Bài đã báo "-" không nợ điểm: nó có mốc chốt Chủ nhật riêng, hiện CẠNH hạn nhập điểm nhưng khác tên (§17.1). */
  const owing = cells.filter((c) => c.required && c.band === null && c.deadline && !c.noShow
    && c.progress !== 'cancelled' && c.progress !== 'absent');
  const noShows = cells.filter((c) => c.required && c.noShow);
  const dongDau = noShows.length ? (
    <span className="text-xs text-slate-400 leading-tight truncate max-w-full"
      title={noShows.map((c) => `${skillShort(c.skill)}: ${dich(c.noShow!.text)}`).join('\n')}>
      {noShows.map((c) => skillShort(c.skill)).join(', ')}: {noShows[0].noShow!.text}
    </span>
  ) : null;
  if (!owing.length) {
    /* PR-MT: MT lịch sử không có hạn nên không vào `owing` — còn ô nhập bù thì nói "Nhập bù", đừng lấy ô đã có điểm nói "Đã nhập". */
    const first = cells.find((c) => c.progress === 'lich_su') ?? cells.find((c) => c.required && !c.noShow);
    return (
      <div className="flex flex-col items-start gap-0.5 min-w-0">
        {first ? <DeadlinePill cell={first} /> : null}
        {dongDau}
      </div>
    );
  }

  const soonest = owing.reduce((a, b) => (a.deadline! <= b.deadline! ? a : b));
  const weeks = new Set(cells.filter((c) => c.required && c.periodCode).map((c) => c.periodCode));
  return (
    <div className="flex flex-col items-start gap-0.5 min-w-0">
      <DeadlinePill cell={soonest} />
      {dongDau ?? (weeks.size > 1 && (
        <span className="max-w-full truncate text-xs text-slate-400" title={skillLabel(soonest.skill)}>
          {skillShort(soonest.skill)}{' '}{t('· đợt này thi {size} tuần', { size: weeks.size })}
        </span>
      ))}
    </div>
  );
}

function SheetRow({ row, lop, active, cot, tuanDangXem, tuanXem, onReload, gvMacDinh, moS, onMo, onTiep }: {
  row: FtSheet['rows'][number]; lop: string; active: boolean;
  cot: { mt: boolean; trangThai: boolean; han: boolean; kyVong: boolean }; tuanDangXem: string | null; tuanXem: string | null;
  onReload: () => void;
  gvMacDinh: NguoiChon | null;
  moS: string | null; onMo: (s: string | null) => void; onTiep: (s: string) => void;
}) {
  const { save, status, lastError, retry, o, loi, luuLai, soLoi, coGuiLai, vuaLuu, xoaVuaLuu } = useSaveScore(row.attemptId, onReload, row.studentName);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bảng tải lại (dòng mới) thì bỏ điểm tạm
  useEffect(() => { xoaVuaLuu(); }, [row]);
  const cellOf = (skill: string) => { const c = row.cells.find((x) => x.skill === skill); return c && apDiemVuaLuu(c, vuaLuu[skill]); };
  /* OV-11e (TE-10): hàng chưa tới tuần thi (mọi ô bắt buộc còn "Chưa đến lịch") ghi mã tuần sớm nhất thay "Chờ n kỹ năng". */
  const can = row.cells.filter((c) => c.required && c.progress !== 'cancelled');
  const tuanChuaToi = can.length > 0 && can.every((c) => c.progress === 'upcoming' && c.weekStart)
    ? can.map((c) => c.weekStart!).sort()[0] : null;
  /* Một ô điểm MT (mọi cột L/R/W1/W2/S): nút → hộp nhập điểm. */
  const oDiem = (s: string, cell: Cell) => (
    <ODiemMt cell={cell} mo={moS === s} onMo={(m) => onMo(m ? s : null)} onTiep={() => onTiep(s)} tuanXem={tuanXem}
      onSave={(p, x) => save(s, p, x)} gvMacDinh={s === 'speaking' ? gvMacDinh : null}
      ctx={{ tenHv: row.studentName, lop, luot: `MT${row.attemptNo}`, kyVong: row.result.expectation ?? null, mt0: !!row.mt0Sos,
        bandTaskKia: s === 'writing1' ? cellOf('writing2')?.band ?? null : s === 'writing2' ? cellOf('writing1')?.band ?? null : undefined }} />
  );
  /* OV-1b: mọi phần thi đã huỷ / bỏ khỏi đợt — lượt không còn "Đã lên lịch". */
  const huyHet = row.cells.every((c) => !c.required || c.progress === 'cancelled');
  /* OV-1d: ô đã dời vì vắng mà người xem gỡ được → ở lưới tuần gốc vẫn là nút "Vắng → W3 OCT" (hộp có Bỏ vắng); không gỡ được thì chữ. */
  const khacTuan = (cell: Cell) => khacTuanFt(cell, tuanDangXem) && !nutTuanGoc(cell);
  const oKhacTuan = (s: string, cell: Cell) => (
    <td key={s} className="td py-1.5 text-right text-slate-500" data-kn={s}
      title={cell.daChot?.doiSang ? t('{skillLabel}: vắng, đã dời sang {doiSang}', { skillLabel: skillLabel(s), doiSang: cell.daChot.doiSang }) : t('{skillLabel}: thi tuần {tuanLich}', { skillLabel: skillLabel(s), tuanLich: tuanLich(cell.weekStart) })}>
      {cell.daChot?.doiSang ? t('Đã dời sang {doiSang}', { doiSang: cell.daChot.doiSang }) : tuanLich(cell.weekStart)}
    </td>
  );

  return (
    <tr className={`row-hover h-16 ${row.ngungHoc ? 'row-muted' : ''} ${active ? 'row-active' : ''}`} data-hv={row.studentId}>
      <td className="td py-1.5 sticky-col">
        <div className="min-w-0">
          <Link className="link block break-words max-sm:py-3 max-sm:-my-3" to={duongDotTest({ id: row.attemptId })} title={row.studentName}>{row.studentName}</Link>
          {row.hoanTat && (
            <div className="mt-0.5">
              <Info title={t('Hết Chủ nhật {ngay}. {x}', { ngay: ngay(row.chuNhatCuoi), x: KHOA_HOAN_TAT_HINT })}>{t('Đã hoàn tất')}</Info>
            </div>
          )}
        </div>
        {/* Tóm tắt lưu của dòng: "n ô chưa lưu" khi còn ô lỗi (không bao giờ "đã lưu" che ô lỗi) — trạng thái từng ô ở ô. */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
          {row.lichSu && <NhanCu />}
          <DauLuu status={status} error={lastError} onRetry={coGuiLai ? retry : undefined} soLoi={soLoi} />
        </div>
        <DongThi tienTo={`MT${row.attemptNo}`} muc={row.cells.filter((c) => c.required && c.progress !== 'cancelled')
          .map((c) => ({ nhan: c.skill.startsWith('writing') ? 'W' : skillShort(c.skill), weekStart: c.weekStart ?? null }))} />
      </td>
      {cot.mt && <td className="td py-1.5 whitespace-nowrap" title={t('Mock Test lượt {attemptNo}', { attemptNo: row.attemptNo })}>MT{row.attemptNo}</td>}
      {cot.trangThai && (
        <td className="td py-1.5 whitespace-nowrap text-xs text-slate-400">
          <Status kind={row.status === 'done' ? 'done' : row.status === 'cancelled' || huyHet ? 'idle' : 'doing'}>
            {nhanLuot(row.status, row.result.scoredRequired, row.result.required.length, huyHet)}
          </Status>
        </td>
      )}
      {/*
        HẠN SỚM NHẤT CÒN NỢ, kèm tên môn khi đợt tách tuần.
        Từ vòng 7 mỗi môn có tuần thi riêng nên có thể có nhiều hạn khác nhau trên một dòng.
        In cả năm cái là nhiễu; in một cái mà không nói của môn nào thì người đọc tưởng nó
        áp cho cả dòng. Nên: hạn gần nhất trong các môn CÒN NỢ, và gọi tên môn đó.
      */}
      {cot.han && (
        <td className="td py-1.5 overflow-hidden">{/* cột 140 px: câu hạn dài gói dòng, không tràn sang cột L */}
          {row.ngungHoc ? <span className="text-slate-500">—</span> : <DeadlineSummary cells={row.cells} />}
        </td>
      )}
      {RAW_SKILLS.map((s) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td py-1.5 text-right text-slate-500">—</td>;   // OV-11i (P3-1): "—" = không có — đọc được (faint)
        if (khacTuan(cell)) return oKhacTuan(s, cell);
        return (
          <td key={s} className={`td py-1.5 relative text-right ${o[s] === 'loi' ? VIEN_LOI : ''}`} data-kn={s}
            data-trong={!row.ngungHoc && oTrongFt(cell) && !khacTuanFt(cell, tuanDangXem) ? '1' : undefined}
            data-luu={o[s]}>
            <DauO tt={o[s]} loi={loi[s]} onLuuLai={() => luuLai(s)} />
            {oDiem(s, cell)}
          </td>
        );
      })}
      {[...W_SKILLS, 'w', 'speaking'].map((s) => {
        if (s === 'w') {
          /* K4-26: band Writing tổng — chỉ đọc, chỉ khi đủ hai task; dưới kỳ vọng thì đỏ. */
          const v = row.result.verdicts?.find((x: any) => x.skill === 'writing');
          return (
            <td key="w" className={`td py-1.5 text-right ${v?.passed === false ? 'text-bad' : 'text-slate-200'}`} title={W_HINT}>
              {v?.band != null ? fmtBand(v.band) : <span className="text-slate-500">—</span>}
            </td>
          );
        }
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td py-1.5 text-right text-slate-500">—</td>;   // OV-11i (P3-1): "—" = không có — đọc được (faint)
        if (khacTuan(cell)) return oKhacTuan(s, cell);
        return (
          <td key={s} className={`td py-1.5 relative text-right ${o[s] === 'loi' ? VIEN_LOI : ''}`} data-kn={s}
            data-trong={!row.ngungHoc && oTrongFt(cell) && !khacTuanFt(cell, tuanDangXem) ? '1' : undefined}
            data-luu={o[s]}>
            <DauO tt={o[s]} loi={loi[s]} onLuuLai={() => luuLai(s)} />
            {oDiem(s, cell)}
          </td>
        );
      })}
      {cot.kyVong && <td className="td py-1.5 text-right">{fmtBand(row.result.expectation)}</td>}
      <td className="td py-1.5 text-right text-slate-100">{fmtBand(row.result.overall)}</td>
      {/* Badge ôm sát nội dung: items-start để ô bảng rộng cũng không kéo giãn nó ra. */}
      <td className="td py-1.5">
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          {/* N-1b: chưa đủ điểm là TẠM — xám, không mang màu mức SOS. OV-1d: em không còn đang học → không "Chờ n" / SOS tạm. */}
          {row.ngungHoc ? (
            <>
              {row.result.kckDuoi ? <ChipDuoiKck />
                : row.result.chot && row.result.sosLevel !== null && <Level tone={sosTone(row.result.sosLevel)}>{sosLabel(row.result.sosLevel)}</Level>}
              <Level tone="muted" title={row.cells[0]?.lyDoKhoa && dich(row.cells[0].lyDoKhoa)}>{dich(row.ngungHoc)}</Level>
            </>
          ) : row.mt0Sos && row.result.scoredRequired > 0 ? (
            /* PR-MT0: chỉ chip SOS hiển thị; đủ điểm mà không SOS → `MT0 ✓` (chủ sản phẩm Q3). */
            row.mt0Sos.length ? row.mt0Sos.map((x) => <Level key={x.skill} tone="danger">{chipSosMt0(x)}</Level>)
              : row.result.complete ? <Level tone="ok">MT0 ✓</Level>
              : <Level tone="muted">{t('Chờ {x} kỹ năng', { x: row.result.required.length - row.result.scoredRequired })}</Level>
          ) : (
            /* OV-1c: lượt CHỐT (đủ điểm, hoặc kỹ năng thiếu đã dời / huỷ / Không dự thi) mới có mức SOS — cờ của máy chủ, không suy từ số ô.
               Chưa chốt mà đã có SOS → chip "SOS tạm · a/4" vàng viền đứt (mockup 11/10). */
            row.result.kckDuoi ? <ChipDuoiKck />   /* OV-9: em KCK dưới kỳ vọng — chip trung tính, không SOS */
              : row.result.chot && row.result.sosLevel !== null ? <Level tone={sosTone(row.result.sosLevel)}>{sosLabel(row.result.sosLevel)}</Level>
              : row.result.provisional && (row.result.sosLevel ?? 0) > 0
                ? <Level tone="warn" dut title={t('SOS tạm thời: mới có {scoredRequired}/{length} kỹ năng', { scoredRequired: row.result.scoredRequired, length: row.result.required.length })}>
                  {t('SOS tạm · {scoredRequired}/{length}', { scoredRequired: row.result.scoredRequired, length: row.result.required.length })}</Level>
                : tuanChuaToi ? <Level tone="muted" title={t('Chưa tới tuần thi')}>{tuanLich(tuanChuaToi)}</Level>
                : <Level tone="muted">{t('Chờ {x} kỹ năng', { x: row.result.required.length - row.result.scoredRequired })}</Level>
          )}
          {row.result.scopeNote && (
            <span className="text-xs text-slate-500 truncate max-w-full" title={row.result.scopeDetail ?? row.result.scopeNote}>
              {row.result.scopeNote}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * DẤU LƯU CỦA MỘT DÒNG — nhỏ, nằm cạnh mã học viên để các hàng cao bằng nhau (G-2). Còn ô lỗi thì LUÔN là "n ô chưa lưu"
 * + Lưu lại (gửi lại mọi ô lỗi của dòng) — ô lưu sau không che được ô lỗi trước (PR-UX1, lỗi thật 24/09). Hết lỗi mới
 * về ✓ mảnh cùng màu chữ phụ (G-1).
 */
export function DauLuu({ status, error, onRetry, soLoi = 0, lon = false }: {
  status: 'idle' | 'saving' | 'saved' | 'error'; error?: string; onRetry?: () => void; soLoi?: number; lon?: boolean;
}) {
  if (soLoi > 0 || status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-bad" role="alert"
        title={error ? t('Không lưu được: {error}', { error }) : t('Không lưu được')}>
        {chuOChuaLuu(Math.max(soLoi, 1))}
        {/* Điện thoại: dòng chỉ một kỹ năng, nút "Lưu lại" 44px nằm ngay ở ô — không lặp hai nút sát nhau. */}
        {onRetry && !lon && (
          <button type="button" onClick={onRetry}
            className="appearance-none border-0 bg-transparent p-0 font-semibold text-bad underline">
            {t('Lưu lại')}
          </button>
        )}
      </span>
    );
  }
  if (status === 'saving') return <span className="text-xs text-slate-400">{t('Đang lưu…')}</span>;
  if (status === 'saved') return <span className="text-[11px] text-ok" title={t('Đã lưu')}>✓</span>;
  return null;
}

/** Viền đỏ của ô lưu hỏng — màu token `bad` (N-1). */
export const VIEN_LOI = 'ring-1 ring-inset ring-bad bg-bad-bg/40';

/**
 * DẤU LƯU CỦA MỘT Ô (PR-UX1): đang lưu "…" · đã lưu ✓ màu `ok`, giữ tới lần lưu sau (OV-11a CA3-7: không tự tắt — nhập 20 em liền vẫn
 * thấy em nào đã vào) · lỗi → nút "Lưu lại" (gửi lại đúng lệnh đã hỏng; giá trị đã gõ vẫn nằm trong ô). Góc dưới-phải của ô, không đẩy
 * hàng cao lên. `lon` (điện thoại) → nằm cạnh ô, nút cao 44px.
 */
export function DauO({ tt, loi, onLuuLai, lon = false }: {
  tt?: TrangThaiLuuO; loi?: string; onLuuLai: () => void; lon?: boolean;
}) {
  const cho = lon ? 'inline-flex items-center' : 'absolute bottom-0.5 right-1 leading-none';
  if (tt === 'loi') {
    return (
      <button type="button" onClick={onLuuLai} title={t('Không lưu được{x}. Bấm để lưu lại.', { x: loi ? `: ${loi}` : '' })}
        className={`${cho} appearance-none border-0 bg-transparent p-0 text-xs font-semibold text-bad underline ${lon ? 'min-h-[44px] px-1 text-xs' : ''}`}>
        {t('Lưu lại')}
      </button>
    );
  }
  if (tt === 'dang-luu') return <span className={`${cho} text-[11px] text-slate-500`} title={t('Đang lưu')}>…</span>;
  if (tt === 'da-luu') return <span className={`${cho} text-[11px] text-ok`} title={t('Đã lưu')}>✓</span>;
  return null;
}
