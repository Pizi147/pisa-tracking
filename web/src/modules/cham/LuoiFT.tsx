import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Info, Level, Status, Th } from '../../ui/ui.tsx';
import { SaveIndicator } from '../../ui/SaveState.tsx';
import {
  CriteriaButton, DeadlinePill, KHOA_HOAN_TAT_HINT, RawScoreInput, useSaveScore, type Cell,
} from '../fasttrack/ScoreEntry.tsx';
import {
  attemptStatusLabel, fmtBand, skillLabel, skillShort, sosLabel, sosTone,
} from '../../lib/format.ts';
import { ENTRY_SKILLS, ngay, tuanLich } from '@shared/domain/index.ts';

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
    cells: Cell[]; result: any;
  }[];
};

const RAW_SKILLS = ENTRY_SKILLS.filter((s) => s === 'listening' || s === 'reading');
const CRIT_SKILLS = ENTRY_SKILLS.filter((s) => s !== 'listening' && s !== 'reading');

/** `?kn=writing` (kỹ năng đánh giá) khớp cả hai cột W1, W2 — Lịch Test / Việc cần làm gom Writing thành một môn. */
export const khopKn = (skill: string, kn: string | null | undefined) =>
  !!kn && (skill === kn || (kn === 'writing' && skill.startsWith('writing')));

/** Ô CÒN PHẢI NHẬP của người đang xem — dùng để cuộn tới em đầu tiên chưa có điểm (Q12). */
export const oTrongFt = (c: Cell) => c.required && c.canEdit && c.band === null && !c.noShow
  && c.progress !== 'cancelled' && c.progress !== 'absent';

/**
 * Ô THI TUẦN KHÁC tuần đang xem mà chưa có điểm (Lịch Test, PR-UX1 Q10): chưa phải việc của tuần này — hiện chữ mờ
 * `W4 SEP`, không có ô nhập, không `data-trong` (con trỏ không nhảy vào).
 */
export const khacTuanFt = (c: Cell, tuanDangXem: string | null | undefined) =>
  !!tuanDangXem && !!c.weekStart && c.weekStart !== tuanDangXem && c.band === null && !c.noShow;

/** Hạn nhập điểm sớm nhất còn nợ trên cả lưới — cho `<Han>` ở đầu trang (mockup 05a §2). */
export function hanSomNhatFt(data: FtSheet | null | undefined): string | null {
  const ds = (data?.rows ?? []).flatMap((r) => r.cells)
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
const COT_HV = 190, COT_MT = 56, COT_TT = 118, COT_HAN = 200, COT_KN = 104, COT_SO = 72, COT_KQ = 176;

/**
 * LƯỚI CHẤM LỚP FAST TRACK — phần bảng của màn nhập điểm cả lớp trong một tuần (dời nguyên từ `ScoreSheetPage`).
 * Trang bao (`ChamDiemPage`) tải dữ liệu, dựng đầu trang và bộ chọn tuần; ở đây chỉ còn bảng.
 *
 * Điều hướng bàn phím: Enter/↓ xuống ô cùng cột ở em kế tiếp, ↑ lên, Esc huỷ ô đang sửa. `kn` tô cột kỹ năng đang
 * được mở từ Lịch Test; `hv` tô dòng của một học viên.
 *
 * Lịch Test (PR-UX1 Q10): `gon` bỏ cột Trạng thái và Hạn (hàng lớp đã nói), bỏ cột MT khi cả lưới cùng một lượt;
 * `tuanDangXem` làm mờ ô thi tuần khác (`khacTuanFt`).
 */
export function LuoiFT({ data, onReload, kn = null, hv = null, gon = false, tuanDangXem = null }: {
  data: FtSheet; onReload: () => void; kn?: string | null; hv?: number | null;
  gon?: boolean; tuanDangXem?: string | null;
}) {
  const grid = useRef<(HTMLInputElement | null)[][]>([]);
  const cot = {
    mt: !gon || new Set(data.rows.map((r) => r.attemptNo)).size > 1,
    trangThai: !gon,
    han: !gon,
  };
  /* Cột theo đúng những cột đang hiện — `colgroup` khớp số cột (G-2). */
  const COT = [
    COT_HV, ...(cot.mt ? [COT_MT] : []), ...(cot.trangThai ? [COT_TT] : []), ...(cot.han ? [COT_HAN] : []),
    ...ENTRY_SKILLS.map(() => COT_KN), COT_SO, COT_SO, COT_KQ,
  ];
  const RONG = COT.reduce((a, b) => a + b, 0);

  if (data.rows.length === 0) {
    return (
      <Empty title="Không có lượt Mock nào của lớp này trong tuần đã chọn"
        hint="Đổi tuần ở trên, hoặc quay lại Test để chọn lớp khác." />
    );
  }

  /* Enter/↓ xuống em kế tiếp CÓ Ô NHẬP ở cùng cột — bỏ qua dòng chỉ đọc thay vì dừng lại ở đó. */
  const move = (row: number, col: number, dr: number) => {
    for (let r = row + dr; r >= 0 && r < grid.current.length; r += dr) {
      const el = grid.current[r]?.[col];
      if (el) { el.focus(); el.select(); return; }
    }
  };

  const toCot = (s: string) => (khopKn(s, kn) ? 'text-[color:var(--accent-strong)]' : '');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums" style={{ tableLayout: 'fixed', minWidth: RONG }}>
        <colgroup>{COT.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
        <thead>
          <tr>
            <Th className="sticky-col" hint="Cột này đứng yên khi cuộn ngang, để không lạc mất đang nhập cho em nào.">Học viên</Th>
            {cot.mt && <Th hint="Số thứ tự lượt Mock Test (MT) trong lộ trình của em.">MT</Th>}
            {cot.trangThai && <Th hint="Lượt đã chấm xong, đang chờ, hay đã huỷ.">Trạng thái</Th>}
            {cot.han && <Th hint="Hạn chấm tính riêng cho từng môn, từ tuần thi của chính môn đó: hết thứ Tư của tuần kế tiếp. Quản lý đặt được hạn riêng.">Hạn nhập</Th>}
            {RAW_SKILLS.map((s) => (
              <Th key={s} className={toCot(s)} hint={`${skillLabel(s)} — nhập số câu đúng (0–40), máy tự quy ra band.`}>
                {skillShort(s)} <span className="normal-case text-slate-500">(số câu)</span>
              </Th>
            ))}
            {CRIT_SKILLS.map((s) => (
              <Th key={s} className={toCot(s)} hint={`${skillLabel(s)} — bấm ô để chấm bốn tiêu chí, ra band.`}>
                {skillShort(s)} <span className="normal-case text-slate-500">(band)</span>
              </Th>
            ))}
            <Th align="right" hint="Mức mong đợi của chính lượt này, tính theo mục tiêu tại thời điểm đó.">Kỳ vọng</Th>
            <Th align="right" hint="Band tổng, chỉ có khi đã đủ điểm mọi kỹ năng bắt buộc.">Overall</Th>
            <Th hint="Số kỹ năng dưới kỳ vọng của lượt này — đó chính là mức SOS.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, ri) => (
            <SheetRow
              key={r.attemptId}
              row={r}
              rowIndex={ri}
              active={hv !== null && r.studentId === hv}
              cot={cot} tuanDangXem={tuanDangXem}
              onReload={onReload}
              register={(ci, el) => {
                grid.current[ri] = grid.current[ri] ?? [];
                grid.current[ri][ci] = el;
              }}
              onMove={move}
            />
          ))}
        </tbody>
      </table>
    </div>
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
    <span className="text-[10px] text-slate-400 leading-tight truncate max-w-full"
      title={noShows.map((c) => `${skillShort(c.skill)}: ${c.noShow!.text}`).join('\n')}>
      {noShows.map((c) => skillShort(c.skill)).join(', ')}: {noShows[0].noShow!.text}
    </span>
  ) : null;
  if (!owing.length) {
    const first = cells.find((c) => c.required && !c.noShow);
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
        <span className="text-[10px] text-slate-500" title={skillLabel(soonest.skill)}>
          {skillShort(soonest.skill)} · đợt này thi {weeks.size} tuần
        </span>
      ))}
    </div>
  );
}

function SheetRow({ row, rowIndex, active, cot, tuanDangXem, onReload, register, onMove }: {
  row: FtSheet['rows'][number]; rowIndex: number; active: boolean;
  cot: { mt: boolean; trangThai: boolean; han: boolean }; tuanDangXem: string | null;
  onReload: () => void;
  register: (col: number, el: HTMLInputElement | null) => void;
  onMove: (row: number, col: number, dr: number) => void;
}) {
  const { save, status, lastError, retry } = useSaveScore(row.attemptId, onReload);
  const cellOf = (skill: string) => row.cells.find((c) => c.skill === skill);
  const oKhacTuan = (s: string, cell: Cell) => (
    <td key={s} className="td py-1.5 text-slate-500" data-kn={s} title={`${skillLabel(s)}: thi tuần ${tuanLich(cell.weekStart)}`}>
      {tuanLich(cell.weekStart)}
    </td>
  );

  return (
    <tr className={`row-hover h-16 ${active ? 'row-active' : ''}`} data-hv={row.studentId}>
      <td className="td py-1.5 sticky-col">
        <div className="flex items-center gap-1 min-w-0">
          <Link className="link block truncate" to={`/mock-test/${row.attemptId}`} title={row.studentName}>{row.studentName}</Link>
          {row.hoanTat && (
            <Info title={`Hết Chủ nhật ${ngay(row.chuNhatCuoi)}. ${KHOA_HOAN_TAT_HINT}`}>Đã hoàn tất</Info>
          )}
        </div>
        {/* Trạng thái lưu RIÊNG TỪNG DÒNG — lỗi nói rõ ở dòng nào, có nút Thử lại. */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
          <span className="shrink-0">{row.studentCode}</span>
          <DauLuu status={status} error={lastError} onRetry={retry} />
        </div>
      </td>
      {cot.mt && <td className="td py-1.5 whitespace-nowrap" title={`Mock Test lượt ${row.attemptNo}`}>MT{row.attemptNo}</td>}
      {cot.trangThai && (
        <td className="td py-1.5 whitespace-nowrap text-xs text-slate-400">
          <Status kind={row.status === 'done' ? 'done' : row.status === 'cancelled' ? 'idle' : 'doing'}>
            {attemptStatusLabel(row.status)}
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
        <td className="td py-1.5 whitespace-nowrap">
          <DeadlineSummary cells={row.cells} />
        </td>
      )}
      {RAW_SKILLS.map((s, ci) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td py-1.5 text-slate-600">—</td>;
        if (khacTuanFt(cell, tuanDangXem)) return oKhacTuan(s, cell);
        return (
          <td key={s} className="td py-1.5" data-kn={s} data-trong={oTrongFt(cell) ? '1' : undefined}>
            <RawScoreInput
              cell={cell}
              onSave={(p, o) => save(s, p, o)}
              inputRef={(el) => register(ci, el)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onMove(rowIndex, ci, 1); }
                if (e.key === 'ArrowUp') { e.preventDefault(); onMove(rowIndex, ci, -1); }
              }}
            />
          </td>
        );
      })}
      {CRIT_SKILLS.map((s) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td py-1.5 text-slate-600">—</td>;
        if (khacTuanFt(cell, tuanDangXem)) return oKhacTuan(s, cell);
        return (
          <td key={s} className="td py-1.5" data-kn={s} data-trong={oTrongFt(cell) ? '1' : undefined}>
            <CriteriaButton cell={cell} onSave={(p, o) => save(s, p, o)} />
          </td>
        );
      })}
      <td className="td py-1.5 text-right">{fmtBand(row.result.expectation)}</td>
      <td className="td py-1.5 text-right text-slate-100">{fmtBand(row.result.overall)}</td>
      {/* Badge ôm sát nội dung: items-start để ô bảng rộng cũng không kéo giãn nó ra. */}
      <td className="td py-1.5">
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <Level tone={sosTone(row.result.sosLevel)}>
            {row.result.evaluable
              ? sosLabel(row.result.sosLevel)
              : `Chờ ${row.result.required.length - row.result.scoredRequired} kỹ năng`}
          </Level>
          {row.result.scopeNote && (
            <span className="text-[10px] text-slate-500 truncate max-w-full" title={row.result.scopeDetail ?? row.result.scopeNote}>
              {row.result.scopeNote}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * DẤU LƯU CỦA MỘT DÒNG — nhỏ, nằm cạnh mã học viên để các hàng cao bằng nhau (G-2). Đã lưu là một dấu ✓ mảnh cùng
 * màu chữ phụ (G-1), rê chuột thấy chữ; lưu lỗi vẫn là nhãn ⚠ + Thử lại như cũ vì đó là việc phải làm ngay.
 */
export function DauLuu({ status, error, onRetry }: {
  status: 'idle' | 'saving' | 'saved' | 'error'; error?: string; onRetry?: () => void;
}) {
  if (status === 'saving') return <span className="text-[10px] text-slate-500">Đang lưu…</span>;
  if (status === 'saved') return <span className="text-[11px] text-slate-500" title="Đã lưu">✓</span>;
  if (status === 'error') return <SaveIndicator status="error" error={error} onRetry={onRetry} />;
  return null;
}
