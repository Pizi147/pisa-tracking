/**
 * R11 — ĐỢT ĐÃ HOÀN TẤT THÌ CHỈ QUẢN LÝ SỬA ĐIỂM, CÓ NHẬT KÝ (Q1, Q2, chốt 23/09).
 *
 * "Hoàn tất" không lưu ở đâu cả — nó suy ra MỖI LẦN từ điểm + lịch hiện tại (Q14: không migrate), qua đúng luật
 * thuần `dotDaHoanTat` (`shared/domain/keHoachTest.ts`) mà cả máy chủ và giao diện cùng gọi. File này chỉ lo phần
 * ĐỌC DATABASE cho luật đó — một câu hỏi (N đợt một lúc) để `classScoreSheet`/`regularSheet` không rơi vào N+1.
 */
import { db } from '../db.ts';
import { dotDaHoanTat, PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';

export type HoanTatInfo = { hoanTat: boolean; chuNhatCuoi: string | null };

/**
 * ĐỢT ĐÃ HOÀN TẤT CHO CẢ DANH SÁCH — ba câu SQL, không phụ thuộc số đợt:
 *   1. Chế độ chấm (band FT hay tỷ lệ lớp thường) của từng đợt.
 *   2. Lịch từng kỹ năng (`attempt_skills`): bắt buộc, huỷ, hạn (`report_periods.week_end`).
 *   3. Điểm (`assessment_scores`): band / raw_score / dấu "-" theo TỪNG Ô NHẬP (writing tách writing1, writing2
 *      ở lớp FT; lớp thường thì 'writing' là một ô).
 */
export function dotHoanTatMany(attemptIds: number[], today: string): Map<number, HoanTatInfo> {
  const out = new Map<number, HoanTatInfo>();
  if (!attemptIds.length) return out;
  const conn = db();
  const ph = attemptIds.map(() => '?').join(',');

  const modeOf = new Map<number, 'ielts_band' | 'ratio'>();
  for (const r of conn
    .prepare(
      `SELECT a.id, p.scoring_mode AS mode FROM assessment_attempts a
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN programmes p ON p.code = c.programme_code
        WHERE a.id IN (${ph})`,
    )
    .all(...attemptIds) as any[]) {
    modeOf.set(r.id, r.mode === 'ratio' ? 'ratio' : 'ielts_band');
  }

  const skillsOf = new Map<number, Array<{ skill: string; batBuoc: boolean; huy: boolean; sitAbsent: boolean; weekEnd: string | null }>>();
  for (const r of conn
    .prepare(
      `SELECT ask.attempt_id, ask.skill, ask.required, ask.sit_status, pr.week_end
         FROM attempt_skills ask
         LEFT JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id IN (${ph})`,
    )
    .all(...attemptIds) as any[]) {
    if (!skillsOf.has(r.attempt_id)) skillsOf.set(r.attempt_id, []);
    skillsOf.get(r.attempt_id)!.push({
      skill: r.skill, batBuoc: r.required === 1, huy: r.sit_status === 'cancelled',
      sitAbsent: r.sit_status === 'absent', weekEnd: r.week_end ?? null,
    });
  }

  const scoresOf = new Map<number, Array<{ skill: string; band: number | null; rawScore: number | null; coDau: boolean }>>();
  for (const r of conn
    .prepare(
      `SELECT attempt_id, skill, band, raw_score, no_show_period_id
         FROM assessment_scores WHERE attempt_id IN (${ph})`,
    )
    .all(...attemptIds) as any[]) {
    if (!scoresOf.has(r.attempt_id)) scoresOf.set(r.attempt_id, []);
    scoresOf.get(r.attempt_id)!.push({
      skill: r.skill, band: r.band ?? null, rawScore: r.raw_score ?? null, coDau: r.no_show_period_id !== null,
    });
  }

  for (const attemptId of attemptIds) {
    const cheDo = modeOf.get(attemptId) ?? 'ielts_band';
    const skills = skillsOf.get(attemptId) ?? [];
    const scores = scoresOf.get(attemptId) ?? [];
    const entryKeysOf = (skill: string) => (cheDo === 'ielts_band' && skill === 'writing' ? ['writing1', 'writing2'] : [skill]);

    const kn = skills.map((s) => {
      const entryKeys = entryKeysOf(s.skill);
      const entryRows = scores.filter((sc) => entryKeys.includes(sc.skill));
      const coDiem = entryKeys.length > 0 && entryKeys.every((k) => {
        const row = entryRows.find((sc) => sc.skill === k);
        return cheDo === 'ratio' ? (row?.rawScore ?? null) !== null : (row?.band ?? null) !== null;
      });
      const coDau = s.sitAbsent || entryRows.some((sc) => sc.coDau);
      return { batBuoc: s.batBuoc, huy: s.huy, coDiem, coDau, weekEnd: s.weekEnd };
    });

    const chuNhatCuoi = kn
      .filter((k) => k.batBuoc && !k.huy && k.weekEnd)
      .reduce<string | null>((max, k) => (max === null || k.weekEnd! > max ? k.weekEnd! : max), null);

    out.set(attemptId, {
      hoanTat: dotDaHoanTat({ cheDo, kn, chuNhatCuoi, homNay: today }),
      chuNhatCuoi,
    });
  }

  return out;
}

/** Bản một phần tử của `dotHoanTatMany` — dùng ở các đường ghi điểm (một đợt một lần). */
export function dotHoanTat(attemptId: number, today: string): HoanTatInfo {
  return dotHoanTatMany([attemptId], today).get(attemptId) ?? { hoanTat: false, chuNhatCuoi: null };
}

/** R11: ai sửa được điểm của một đợt ĐÃ HOÀN TẤT — Quản lý/Quản trị (`PLAN_WEEK`) hoặc người nhập bù (`SCORE_OVERRIDE`). */
export function quyenSuaSauHoanTat(p: Principal, classId: number): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, { classId }) || can(p, PERMISSIONS.SCORE_OVERRIDE, { classId });
}
