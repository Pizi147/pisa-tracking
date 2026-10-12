/**
 * DẢI NĂM Ô ĐIỂM LỚN của hồ sơ Mock (PR-HSM, §7.6, YC-13.7, YC-13.8, K4-30, K4-31).
 *
 * Nằm ở: Test › một lượt MT (`/mock-test/:id` — mở từ Lịch Test, hồ sơ HV › bảng Mock Test, tên em ở lưới chấm) → ngay dưới
 * đầu trang. Tầng 1 của màn: 4 điểm kỹ năng + Overall.
 *
 * L · R · W · S · Overall cùng cỡ: nhãn 12 px · số 28 px / 700 · MỘT dòng phụ 12 px (câu dài vào tooltip). Ô mở được hộp
 * (`suaDuoc` — từ `cell.canEdit` / `daChot.goDuoc` của máy chủ, web không tự suy quyền) là nút; bấm → hộp nhập điểm (OV-4b,
 * `HopNhapDiem`) neo ngay ô, chỉ "Lưu" (trang một em). W: dòng phụ là HAI nút W1 · W2 — hai hộp riêng, mỗi task lưu riêng (K4-31).
 */
import { useRef, type ReactNode } from 'react';
import { chuDoiVang, ngay, skillShort, tuanLich } from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Han } from '../../ui/Han.tsx';
import { suaDuoc, type Cell, type SaveOpts, type SavePatch } from './ScoreEntry.tsx';
import { HopNhapDiem, type NguCanhHop } from './HopNhapDiem.tsx';

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
  if (lichSu) return { chu: 'Nhập bù, không tính hạn' };
  if (l.doiTu && l.absenceMoveCount > 0) return chuDoiVang(l, homNay);
  if (c?.noShow) return { chu: c.noShow.text };
  if (!l.weekStart) return { chu: 'Chưa xếp tuần' };
  if (l.progress === 'upcoming') return { chu: `Thi ${tuanLich(l.weekStart, homNay)}` };
  if (l.deadline) return { chu: <Han loai="nhap-diem" han={l.deadline} /> };
  return { chu: 'Chưa có điểm' };
}

export function DaiODiemLon({ cells, lich, result, lichSu, homNay, mo, onMo, save, ketLuanOverall, nguCanh }: {
  cells: Cell[]; lich: LichKn[]; result: any; lichSu: boolean; homNay: string;
  /** PR-MT0: thay dòng kết luận dưới Overall (MT0 không có kỳ vọng — `MT0 ✓` / chip SOS). */
  ketLuanOverall?: ReactNode;
  /** Bài nhập đang mở hộp (lifted — nút chính "Nhập điểm" của bảng dưới cũng mở đúng bài). */
  mo: string | null; onMo: (k: string | null) => void;
  save: (skill: string, patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  /** Đầu hộp: em · lớp · lượt; kỳ vọng; MT0. */
  nguCanh: Omit<NguCanhHop, 'bandTaskKia'>;
}) {
  const oCua = (k: string) => cells.find((c) => c.skill === k);
  const baiCua = (k: KyNangLon) => (k === 'writing' ? [oCua('writing1'), oCua('writing2')] : [oCua(k)]).filter((c): c is Cell => !!c);
  /* Nút neo của từng bài nhập — hộp mở ngay dưới ô (L/R/S: cả ô; W1/W2: nút nhỏ ở dòng phụ). */
  const neo = useRef<Record<string, HTMLElement | null>>({});

  const ketLuan = result.evaluable ? result.sosLevel === 0 : null;

  const oKyNang = (k: KyNangLon) => {
    const bai = baiCua(k);
    const band: number | null = result.bands?.[k] ?? null;
    const v = result.verdicts?.find((x: any) => x.skill === k);
    const l = lich.find((x) => x.skill === k);
    const laW = k === 'writing';
    const sua = !laW && bai.some(suaDuoc);
    let phu: { chu: React.ReactNode; mau?: string; title?: string };
    if (laW && bai.some(suaDuoc)) {
      /* W1 · W2 hai nút — mỗi task một hộp. */
      phu = { chu: bai.map((c, i) => (
        <span key={c.skill}>
          {i > 0 && <span className="text-slate-600"> · </span>}
          {suaDuoc(c) ? (
            <button type="button" ref={(el) => { neo.current[c.skill] = el; }} aria-expanded={mo === c.skill}
              className="link appearance-none border-0 bg-transparent p-0 tabular-nums max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
              onClick={() => onMo(mo === c.skill ? null : c.skill)}>
              {c.skill === 'writing1' ? 'W1' : 'W2'} {c.band !== null ? fmtBand(c.band) : 'Nhập'}
            </button>
          ) : <span className="tabular-nums">{c.skill === 'writing1' ? 'W1' : 'W2'} {fmtBand(c.band)}</span>}
        </span>
      )), title: CONG_THUC_W };
    } else if (k === 'writing' && bai.some(coDiem)) {
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
        <span className={`mt-1 block min-h-[1rem] truncate text-xs ${phu.mau ?? 'text-slate-500'}`} title={laW ? undefined : phu.title}>{phu.chu}</span>
      </>
    );
    /* PR-S4F #10: flex-col cho cả nút và ô chỉ đọc — nút căn giữa nội dung theo chiều dọc nên lệch ~3 px so với ô bên cạnh. */
    const dangMo = mo !== null && bai.some((c) => c.skill === mo);
    const vo = `flex min-w-0 flex-col rounded-lg border px-3 py-2.5 text-left ${dangMo ? 'border-[color:var(--accent-strong)] bg-white/[0.04]' : ''}`;
    return sua ? (
      <button key={k} type="button" aria-expanded={dangMo} aria-haspopup="dialog" ref={(el) => { neo.current[bai[0].skill] = el; }}
        title={[nhapBoi, 'Bấm để nhập / sửa điểm tại chỗ.'].filter(Boolean).join('\n')}
        className={`${vo} hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)]`}
        style={dangMo ? undefined : { borderColor: 'var(--line)' }}
        onClick={() => onMo(dangMo ? null : bai[0].skill)}>
        {noiDung}
      </button>
    ) : (
      <div key={k} className={vo} style={{ borderColor: 'var(--line)' }} title={nhapBoi || undefined}>{noiDung}</div>
    );
  };

  const oMo = mo ? oCua(mo) : undefined;
  const neoMo = mo ? neo.current[mo] : null;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {KY_NANG_LON.map(oKyNang)}
        <div className="col-span-2 flex min-w-0 flex-col rounded-lg border px-3 py-2.5 sm:col-span-1" style={{ borderColor: 'var(--line)' }}>
          <span className="block text-xs font-medium text-slate-400">Overall</span>
          <span className={`mt-0.5 block text-[28px] font-bold leading-none tabular-nums ${result.overall === null ? 'text-slate-600' : 'text-slate-100'}`}>
            {result.overall === null ? '—' : fmtBand(result.overall)}
          </span>
          <span className="mt-1 block min-h-[1rem] truncate">
            {ketLuanOverall ?? <KetQuaDot phan="overall" coDiem={result.scoredRequired} yeuCau={result.required.length} dat={ketLuan}
              sos={result.sosLevel ?? null}
              duoiKyVong={(result.verdicts ?? []).filter((x: any) => x.passed === false).map((x: any) => skillShort(x.skill))} />}
          </span>
        </div>
      </div>

      {oMo && neoMo && (
        <HopNhapDiem key={oMo.skill} cell={oMo} anchor={neoMo} onDong={() => onMo(null)} onSave={(p, x) => save(oMo.skill, p, x)}
          ctx={{ ...nguCanh, bandTaskKia: oMo.skill === 'writing1' ? oCua('writing2')?.band ?? null : oMo.skill === 'writing2' ? oCua('writing1')?.band ?? null : undefined }} />
      )}
    </div>
  );
}
