/**
 * DỰNG `DiemHv` (PANEL-MC, luật N30) TỪ DỮ LIỆU HÀM TÍNH CON SỐ ĐÃ NẠP — 0 câu SQL.
 * Ba nguồn, mỗi nguồn là "lượt làm em vào con số" của một loại panel (đặc tả 30/10 mục 5b ý 4):
 * `AttemptEval` (tập hiện trạng — `latestAttempts`), `DongMock` (Đạt MT / Kết quả MT), `Standing` (panel một em).
 */
import { ASSESSED_SKILLS, KN_THI, NHAN_KN_THI, khoaBai, nhanBai, tenMonNgan, type DiemHv, type DongMock, type KnDiem } from '../../../shared/domain/index.ts';
import type { AttemptEval, SkillEval } from './danhGia.ts';
import type { Standing } from '../students/standing.ts';

/** "MT3" (Mock / MT0) · "Progress Test" · "Final Test" · "Checkpoint 2" — CÙNG `nhanBai` của dòng bài lớp thường. */
const nhanLuot = (kind: string | null, no: number | null) =>
  !kind || kind === 'mock' || kind === 'mt0' ? `MT${no ?? '?'}` : nhanBai(khoaBai(kind, no));

/** `dat`: chưa đủ căn cứ / môn bỏ → null; còn lại = không dưới kỳ vọng của chính lượt. */
const knTu = (skills: Record<string, SkillEval>, ratio: boolean, ct: string | null): KnDiem[] =>
  (ratio ? Object.keys(skills) : [...ASSESSED_SKILLS]).map((k) => {
    const s = skills[k];
    return { k: tenMonNgan(ratio ? ct : null, k), v: s?.v ?? null, dat: !s || s.bo || !s.evaluable ? null : !s.under };
  });

const ghep = (luot: string, tuan: string | null, tam: boolean, ratio: boolean, skills: Record<string, SkillEval>, ct: string | null,
  overall: number | null, kyVong: number | null): DiemHv => ({
  luot, tuan, tam, kn: knTu(skills, ratio, ct), overall,
  soVoi: kyVong === null ? null : { nhan: ratio ? 'ngưỡng' : 'KV', v: kyVong },
  ...(ratio ? { donVi: '%' as const } : {}),
});

export function diemTuEval(ev: AttemptEval): DiemHv {
  const ratio = ev.nguong !== undefined;   // chỉ lớp thường có ngưỡng (`evaluateAttemptRow`)
  return ghep(nhanLuot(ev.kind, ev.attemptNo), ev.weekStart, ev.provisional || ev.chot === false, ratio, ev.skills, ev.chuongTrinh, ev.overall, ev.kyVong);
}

/** Đạt MT / Kết quả MT (FT): bốn kỹ năng có sẵn `dat` của chính lượt (`tapDatMt`). */
export function diemTuMock(d: DongMock): DiemHv {
  return {
    luot: `MT${d.mt}`, tuan: d.tuan, tam: !d.chot,
    kn: KN_THI.map((k) => ({ k: NHAN_KN_THI[k], v: d.kn[k].band, dat: d.kn[k].band === null ? null : d.kn[k].dat })),
    overall: d.ovr, soVoi: d.kyVong === null ? null : { nhan: 'KV', v: d.kyVong },
  };
}

/** Panel một em: lượt gần nhất có điểm của `standingFor`; chưa thi lượt nào → null. */
export function diemTuStanding(st: Standing): DiemHv | null {
  if (st.attemptId === null) return null;
  const ratio = st.mode === 'ratio';
  return ghep(nhanLuot(st.attemptKind, st.attemptNo), st.attemptWeekStart, st.provisional || st.chot === false, ratio, st.skills, st.chuongTrinh,
    ratio ? (st.tyLeTong === null ? null : st.tyLeTong * 100) : st.overall,
    ratio ? (st.nguong === undefined ? null : st.nguong * 100) : st.expectation);
}
