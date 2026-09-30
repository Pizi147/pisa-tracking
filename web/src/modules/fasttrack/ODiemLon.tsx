/**
 * DẢI NĂM Ô ĐIỂM LỚN của hồ sơ Mock (PR-HSM, §7.6, YC-13.7, YC-13.8, K4-30, K4-31).
 *
 * Nằm ở: Test › một lượt MT (`/mock-test/:id` — mở từ Lịch Test, hồ sơ HV › bảng Mock Test, tên em ở lưới chấm) → ngay dưới
 * đầu trang. Tầng 1 của màn: 4 điểm kỹ năng + Overall.
 *
 * L · R · W · S · Overall cùng cỡ: nhãn 12 px · số 28 px / 700 · MỘT dòng phụ 12 px (câu dài vào tooltip). Ô có ít nhất một
 * bài nhập sửa được (`cell.canEdit` của máy chủ — web không tự suy quyền) là nút; bấm → khung sửa NGAY DƯỚI DẢI (một ô một
 * lúc, Esc đóng), dùng `InlineScoreEditor` có sẵn (RB-5 lý do khi sửa điểm đã có). W có HAI hàng W1 (TA CC LR GRA) · W2 (TR CC
 * LR GRA), mỗi hàng lưu riêng — hai task có thể hai GV (K4-31).
 */
import { useEffect, useRef, useState } from 'react';
import { ngay, skillShort, tuanLich } from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Han } from '../../ui/Han.tsx';
import { InlineScoreEditor, lockedByNoShow, type Cell, type SavePatch } from './ScoreEntry.tsx';

export type KyNangLon = 'listening' | 'reading' | 'writing' | 'speaking';
export const KY_NANG_LON: KyNangLon[] = ['listening', 'reading', 'writing', 'speaking'];
const NHAN: Record<KyNangLon, string> = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
export const CONG_THUC_W = 'Band Writing = (Task 1 + Task 2 × 2) / 3, khi đủ hai task.';

/** Dòng lịch của một kỹ năng đánh giá (phần `attemptDetail.skillSchedule` mà dải cần). */
export type LichKn = {
  skill: string; required: boolean; weekStart: string | null; sitStatus: string; progress: string;
  deadline: string | null; absenceMoveCount: number; doiTu: string | null;
  pendingMove: { decideBy: string; toWeek: string | null; moveNo: number } | null;
};

const suaDuoc = (c: Cell) => c.canEdit && !lockedByNoShow(c);
const coDiem = (c: Cell | undefined) => !!c && (c.band !== null || c.rawScore !== null);

/** Dấu đạt / dưới kỳ vọng 12 px, vẽ SVG (ký tự nhỏ của Inter nhoè thành chấm). */
function DauKyVong({ dat }: { dat: boolean }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`inline-block shrink-0 ${dat ? 'text-ok' : 'text-bad'}`} fill="currentColor">
      <path d={dat ? 'M6 2.5 10.5 9.5h-9z' : 'M6 9.5 1.5 2.5h9z'} />
    </svg>
  );
}

/**
 * DÒNG PHỤ của ô chưa có điểm (K4-30) — một câu, theo thứ tự việc cần biết trước. `[chữ, màu, câu đầy đủ]`.
 * Hạn nhập / quá hạn đi qua `<Han>` để cùng một câu ở mọi màn.
 */
function trangThaiO(l: LichKn | undefined, c: Cell | undefined, lichSu: boolean, homNay: string): { chu: React.ReactNode; mau?: string; title?: string } {
  if (!l || !l.required) return { chu: 'Ngoài phạm vi' };
  if (l.sitStatus === 'cancelled' || l.progress === 'cancelled') return { chu: 'Đã huỷ phần thi' };
  if (l.pendingMove) {
    const cau = `chờ Quản lý duyệt dời lần ${l.pendingMove.moveNo} · hạn ${ngay(l.pendingMove.decideBy, homNay)}`;
    return { chu: cau, mau: 'text-wait', title: `Đề nghị dời sang ${l.pendingMove.toWeek ?? 'tuần kế tiếp'} — Quản lý trả lời trước ${ngay(l.pendingMove.decideBy, homNay)}, quá hạn thì huỷ phần thi.` };
  }
  if (l.sitStatus === 'absent') return { chu: 'vắng · chờ xếp lại', title: 'Đã xác nhận vắng — Quản lý xếp lại bài trước khi nhập.' };
  if (lichSu) return { chu: 'Nhập bù, không có hạn' };
  if (l.doiTu && l.absenceMoveCount > 0) {
    const cau = `vắng · dời sang ${tuanLich(l.weekStart, homNay)} · lần ${l.absenceMoveCount}`;
    return { chu: cau, title: `Dời từ ${l.doiTu} sang ${tuanLich(l.weekStart, homNay)} (vắng lần ${l.absenceMoveCount}).` };
  }
  if (c?.noShow) return { chu: c.noShow.text };
  if (!l.weekStart) return { chu: 'Chưa xếp tuần' };
  if (l.progress === 'upcoming') return { chu: `Thi ${tuanLich(l.weekStart, homNay)}` };
  if (l.deadline) return { chu: <Han loai="nhap-diem" han={l.deadline} /> };
  return { chu: 'Chưa có điểm' };
}

export function DaiODiemLon({ cells, lich, result, lichSu, homNay, mo, onMo, save }: {
  cells: Cell[]; lich: LichKn[]; result: any; lichSu: boolean; homNay: string;
  /** Ô đang mở khung sửa (lifted — nút chính "Nhập điểm" của bảng dưới cũng mở ô lớn). */
  mo: KyNangLon | null; onMo: (k: KyNangLon | null) => void;
  save: (skill: string, patch: SavePatch) => Promise<boolean>;
}) {
  const oCua = (k: string) => cells.find((c) => c.skill === k);
  const baiCua = (k: KyNangLon) => (k === 'writing' ? [oCua('writing1'), oCua('writing2')] : [oCua(k)]).filter((c): c is Cell => !!c);
  const dai = useRef<HTMLDivElement>(null);
  /* Esc đóng khung sửa (không nằm trong ô đang gõ lý do của hộp khác — `InlineScoreEditor` tự bắt Esc của nó trước). */
  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onMo(null); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo, onMo]);
  useEffect(() => { if (mo) dai.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [mo]);

  const ketLuan = result.evaluable ? result.sosLevel === 0 : null;

  const oKyNang = (k: KyNangLon) => {
    const bai = baiCua(k);
    const band: number | null = result.bands?.[k] ?? null;
    const v = result.verdicts?.find((x: any) => x.skill === k);
    const l = lich.find((x) => x.skill === k);
    const sua = bai.some(suaDuoc);
    let phu: { chu: React.ReactNode; mau?: string; title?: string };
    if (k === 'writing' && bai.some(coDiem)) {
      const w = (s: string) => fmtBand(oCua(s)?.band ?? null);
      phu = { chu: `W1 ${w('writing1')} · W2 ${w('writing2')}`, title: CONG_THUC_W };
    } else if ((k === 'listening' || k === 'reading') && bai[0]?.rawScore != null) {
      phu = { chu: `${bai[0].rawScore} câu` };
    } else if (k === 'speaking' && bai[0]?.gvCham) {
      /* PR-S4F #10: tên dài bị cắt (truncate) — title cho đủ tên. */
      phu = { chu: `GV chấm: ${bai[0].gvCham.ten}`, title: `GV chấm: ${bai[0].gvCham.ten}` };
    } else if (band !== null) {
      phu = { chu: '' };
    } else {
      phu = trangThaiO(l, bai[0], lichSu, homNay);
    }
    const nhapBoi = bai.filter((c) => c.enteredByName).map((c) => `${skillLabel(c.skill)}: nhập bởi ${c.enteredByName}`).join('\n');
    const noiDung = (
      <>
        <span className="block text-xs font-medium text-slate-400">{NHAN[k]}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className={`text-[28px] font-bold leading-none tabular-nums ${band === null ? 'text-slate-600' : v?.passed === false ? 'text-bad' : 'text-slate-100'}`}>
            {band === null ? '—' : fmtBand(band)}
          </span>
          {band !== null && v && v.passed !== null && (
            <span title={v.passed ? 'Đạt kỳ vọng' : 'Dưới kỳ vọng'}>
              <DauKyVong dat={v.passed} /><span className="sr-only">{v.passed ? 'Đạt kỳ vọng' : 'Dưới kỳ vọng'}</span>
            </span>
          )}
        </span>
        <span className={`mt-1 block min-h-[1rem] truncate text-xs ${phu.mau ?? 'text-slate-500'}`} title={phu.title}>{phu.chu}</span>
      </>
    );
    /* PR-S4F #10: flex-col cho cả nút và ô chỉ đọc — nút căn giữa nội dung theo chiều dọc nên lệch ~3 px so với ô bên cạnh. */
    const vo = `flex min-w-0 flex-col rounded-lg border px-3 py-2.5 text-left ${mo === k ? 'border-[color:var(--accent-strong)] bg-white/[0.04]' : ''}`;
    return sua ? (
      <button key={k} type="button" aria-expanded={mo === k} aria-controls="khung-sua-diem"
        title={[nhapBoi, 'Bấm để nhập / sửa điểm tại chỗ.'].filter(Boolean).join('\n')}
        className={`${vo} hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)]`}
        style={mo === k ? undefined : { borderColor: 'var(--line)' }}
        onClick={() => onMo(mo === k ? null : k)}>
        {noiDung}
      </button>
    ) : (
      <div key={k} className={vo} style={{ borderColor: 'var(--line)' }} title={nhapBoi || undefined}>{noiDung}</div>
    );
  };

  const baiMo = mo ? baiCua(mo) : [];
  return (
    <div ref={dai} className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {KY_NANG_LON.map(oKyNang)}
        <div className="col-span-2 flex min-w-0 flex-col rounded-lg border px-3 py-2.5 sm:col-span-1" style={{ borderColor: 'var(--line)' }}>
          <span className="block text-xs font-medium text-slate-400">Overall</span>
          <span className={`mt-0.5 block text-[28px] font-bold leading-none tabular-nums ${result.overall === null ? 'text-slate-600' : 'text-slate-100'}`}>
            {result.overall === null ? '—' : fmtBand(result.overall)}
          </span>
          <span className="mt-1 block min-h-[1rem] truncate">
            <KetQuaDot phan="overall" coDiem={result.scoredRequired} yeuCau={result.required.length} dat={ketLuan}
              sos={result.sosLevel ?? null}
              duoiKyVong={(result.verdicts ?? []).filter((x: any) => x.passed === false).map((x: any) => skillShort(x.skill))} />
          </span>
        </div>
      </div>

      {mo && (
        <div id="khung-sua-diem" role="region" aria-label={`Nhập điểm ${NHAN[mo]}`}
          className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--line-strong)' }}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-100">{NHAN[mo]}</span>
            <button type="button" className="btn btn-sm" onClick={() => onMo(null)}>Đóng</button>
          </div>
          <div className="space-y-3">
            {baiMo.map((c) => <HangSua key={c.skill} c={c} laW={mo === 'writing'} save={save} onXong={mo === 'writing' ? null : () => onMo(null)} />)}
          </div>
          {mo === 'writing' && <p className="m-0 mt-2 text-xs text-slate-500">{CONG_THUC_W} Mỗi task lưu riêng.</p>}
        </div>
      )}
    </div>
  );
}

/**
 * MỘT HÀNG SỬA của khung dưới dải: `InlineScoreEditor` có sẵn. W: hàng lưu xong thì dựng lại hàng đó (khung vẫn mở để sửa
 * task kia); L/R/S: lưu xong đóng khung. Bài không sửa được (task của GV khác, đã chốt…) chỉ hiện số.
 */
function HangSua({ c, laW, save, onXong }: {
  c: Cell; laW: boolean; save: (skill: string, patch: SavePatch) => Promise<boolean>; onXong: (() => void) | null;
}) {
  const [lan, setLan] = useState(0);
  const nhan = laW ? (c.skill === 'writing1' ? 'Task 1' : 'Task 2') : null;
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
      {nhan && <span className="w-16 shrink-0 pt-1 text-xs font-medium text-slate-400">{nhan}</span>}
      {suaDuoc(c) ? (
        <div className="min-w-0 flex-1">
          <InlineScoreEditor key={lan} cell={c} onSave={(p) => save(c.skill, p)}
            onClose={() => (onXong ? onXong() : setLan((n) => n + 1))} />
        </div>
      ) : (
        <span className="pt-1 text-sm tabular-nums text-slate-300" title={c.khoa ? 'Đợt đã hoàn tất — chỉ Quản lý sửa.' : 'Chỉ xem'}>
          {c.noShow ? '-' : fmtBand(c.band)} <span className="text-xs text-slate-500">· chỉ xem</span>
        </span>
      )}
    </div>
  );
}
