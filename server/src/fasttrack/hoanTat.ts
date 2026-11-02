/**
 * R11 — ĐỢT ĐÃ HOÀN TẤT THÌ CHỈ QUẢN LÝ SỬA ĐIỂM, CÓ NHẬT KÝ (Q1, Q2, chốt 23/09).
 *
 * "Hoàn tất" không lưu ở đâu cả — nó suy ra MỖI LẦN từ điểm + lịch hiện tại (Q14: không migrate), qua đúng luật
 * thuần `dotDaHoanTat` (`shared/domain/keHoachTest.ts`) mà cả máy chủ và giao diện cùng gọi. File này chỉ lo phần
 * ĐỌC DATABASE cho luật đó — một câu hỏi (N đợt một lúc) để `classScoreSheet`/`regularSheet` không rơi vào N+1.
 */
import { DS_JSON, db } from '../db.ts';
import { dotDaHoanTat, mondayOfDate, PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { diemCuaLuot } from './attempts.ts';
import { loadSkillRows, scoringModeOf } from './skillSchedule.ts';

export type HoanTatInfo = { hoanTat: boolean; chuNhatCuoi: string | null };

/**
 * ĐỢT ĐÃ HOÀN TẤT CHO CẢ DANH SÁCH — ba câu SQL (câu 2 dùng chung bộ nhớ `loadSkillRows`), không phụ thuộc số đợt:
 *   1. Chế độ chấm (band FT hay tỷ lệ lớp thường) của từng đợt.
 *   2. Lịch từng kỹ năng (`attempt_skills`): bắt buộc, huỷ, hạn (`report_periods.week_end`).
 *   3. Điểm (`assessment_scores`): band / raw_score / dấu "-" theo TỪNG Ô NHẬP (writing tách writing1, writing2
 *      ở lớp FT; lớp thường thì 'writing' là một ô).
 */
export function dotHoanTatMany(attemptIds: number[], today: string): Map<number, HoanTatInfo> {
  const out = new Map<number, HoanTatInfo>();
  if (!attemptIds.length) return out;
  const conn = db();
  const ph = DS_JSON, json = JSON.stringify(attemptIds);   // S5: một tham số JSON (trước: một `?` mỗi lượt, không chia lô)

  const modeOf = new Map<number, 'ielts_band' | 'ratio'>();
  /*
   * PR-MT (K5-21, K4-20): MT lịch sử khoá sau 7 ngày kể từ LẦN NHẬP CUỐI, không theo Chủ nhật tuần thi (tuần đã qua từ lâu).
   * Mốc = hết Chủ nhật của tuần chứa (ngày nhập cuối + 7) — đủ 7 ngày và đúng câu "hết Chủ nhật …" ở thông báo khoá.
   * Ngày nhập cuối lấy `nhap_dau_ngay` (ghi theo `demoToday()`), không lấy `entered_at` (giờ thực UTC: trôi theo ngày
   * thật, lệch múi giờ). Dòng cũ chưa có `nhap_dau_ngay` mới rơi về `entered_at`.
   */
  const nhapCuoiLichSu = new Map<number, string | null>();
  for (const r of conn
    .prepare(
      `SELECT a.id, a.kind, p.scoring_mode AS mode, a.lich_su,
              (SELECT COALESCE(MAX(sx.nhap_dau_ngay), substr(MAX(sx.entered_at), 1, 10))
                 FROM assessment_scores sx WHERE sx.attempt_id = a.id) AS nhap_cuoi
         FROM assessment_attempts a
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN programmes p ON p.code = c.programme_code
        WHERE a.id IN (${ph})`,
    )
    .all(json) as any[]) {
    modeOf.set(r.id, scoringModeOf({ kind: r.kind, scoring_mode: r.mode ?? 'band' }) === 'ratio' ? 'ratio' : 'ielts_band');   // F03: MT0 lớp thường chấm band
    if (r.lich_su) nhapCuoiLichSu.set(r.id, r.nhap_cuoi ? addDays(mondayOfDate(addDays(String(r.nhap_cuoi), 7)), 6) : null);
  }

  const skillsOf = new Map<number, Array<{ skill: string; batBuoc: boolean; huy: boolean; sitAbsent: boolean; weekEnd: string | null; periodId: number | null; boTask?: string | null }>>();
  /* TD2-a: lịch kỹ năng qua `loadSkillRows` (nhớ theo lượt trong request) — bảng điểm lớp đã đọc đúng các lượt này ngay trước. */
  for (const r of [...loadSkillRows(attemptIds).values()].flat()) {
    if (!skillsOf.has(r.attempt_id)) skillsOf.set(r.attempt_id, []);
    skillsOf.get(r.attempt_id)!.push({
      skill: r.skill, batBuoc: r.required === 1, huy: r.sit_status === 'cancelled',
      sitAbsent: r.sit_status === 'absent', weekEnd: r.week_end ?? null, periodId: r.planned_period_id ?? null, boTask: r.bo_task ?? null,
    });
  }

  const scoresOf = new Map<number, Array<{ skill: string; band: number | null; rawScore: number | null; dauTuan: number | null }>>();
  /* TL-HVL: điểm qua `diemCuaLuot` (nhớ theo lượt trong request) — bảng điểm lớp đã đọc đúng các lượt này ngay trước. */
  for (const [id, rows] of diemCuaLuot(attemptIds)) {
    scoresOf.set(id, rows.map((r) => ({ skill: r.skill, band: r.band ?? null, rawScore: r.raw_score ?? null, dauTuan: r.no_show_period_id ?? null })));
  }

  for (const attemptId of attemptIds) {
    const cheDo = modeOf.get(attemptId) ?? 'ielts_band';
    const skills = skillsOf.get(attemptId) ?? [];
    const scores = scoresOf.get(attemptId) ?? [];
    /* P8 (N13): task Writing em không học (`bo_task`) không cần điểm. */
    const entryKeysOf = (skill: string, boTask?: string | null) => (cheDo === 'ielts_band' && skill === 'writing' ? ['writing1', 'writing2'].filter((k) => k !== boTask) : [skill]);

    const kn = skills.map((s) => {
      const entryKeys = entryKeysOf(s.skill, s.boTask);
      const entryRows = scores.filter((sc) => entryKeys.includes(sc.skill));
      const coDiem = entryKeys.length > 0 && entryKeys.every((k) => {
        const row = entryRows.find((sc) => sc.skill === k);
        return cheDo === 'ratio' ? (row?.rawScore ?? null) !== null : (row?.band ?? null) !== null;
      });
      /* OV-11a (TE-1): "-" chỉ làm kỹ năng xong khi thuộc TUẦN ĐANG XẾP của nó (cùng luật `sameWeek` của `dauTruCuaO`) — bài đã dời vì
       * vắng sang tuần thi bù là chưa xong, không khoá đợt "hoàn tất" với GV đúng kỹ năng. */
      const coDau = s.sitAbsent || entryRows.some((sc) => sc.dauTuan !== null && sc.dauTuan === s.periodId);
      return { batBuoc: s.batBuoc, huy: s.huy, coDiem, coDau, weekEnd: s.weekEnd };
    });

    const chuNhatCuoi = nhapCuoiLichSu.has(attemptId) ? nhapCuoiLichSu.get(attemptId)! : kn
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
export function quyenSuaSauHoanTat(p: Principal, classId: number, lichSu = false): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, { classId }) || can(p, PERMISSIONS.SCORE_OVERRIDE, { classId })
    /* T22 (PR-MTa, rà #212): MT cũ — GVCN lớp đó sửa / xoá được cả sau khi khoá 7 ngày. */
    || (lichSu && isCoreTeacherOf(p, classId));
}

/**
 * OV-11g (HL-10, Q4): lớp ĐÃ KẾT THÚC — chỉ Quản lý (người sửa được sau hoàn tất) ghi điểm / "-" / nhận xét, đi đường `override` (nhật ký như
 * sửa điểm thường); GV chỉ xem → 403. Trả `true` khi lớp đã kết thúc (nơi gọi ép đường `override`).
 */
export function kiemLopKetThuc(p: Principal, classId: number | null, oTrong: () => boolean = () => false): boolean {
  if (!laLopKetThuc(classId)) return false;
  if (quyenSuaSauHoanTat(p, classId!)) return true;
  /* OV-13h (chủ SP 15/10): GV đúng môn vẫn NHẬP vào ô trống / ghi nhận xét — đường thường của họ (nơi gọi kiểm phân công); sửa / xoá điểm
   * đã có vẫn chỉ QL. `oTrong` là hàm: chỉ đọc ô khi lớp thật sự đã kết thúc. */
  if (oTrong()) return false;
  throw forbidden('Lớp đã kết thúc — chỉ Quản lý sửa được điểm.');
}

/**
 * OV-13h: ô CHƯA có điểm (số câu, band, tiêu chí) — GV đúng môn nhập được cả sau hoàn tất / lớp đã kết thúc. "-" không phải điểm: đợt FT chỉ
 * hoàn tất khi mọi ô có điểm hoặc "-", nên ô trống của đợt đã hoàn tất chính là ô "-" (điểm thật thắng "-", `saveScore`).
 */
export const oChuaCoDiem = (r: any): boolean =>
  !r || (r.band == null && r.raw_score == null && [r.c1, r.c2, r.c3, r.c4].every((v) => v == null));

export const CAU_KHONG_VANG = 'Lớp đã kết thúc — không ghi vắng ("-"). Nhập điểm hoặc để trống.';
/**
 * OV-11g (rà PR #379): lớp đã kết thúc không ghi / gỡ vắng ("-", Báo vắng, xin dời) — kể cả QL: không còn tuần học để dời bài vào.
 * OV-13h (rà #410): mọi vai cùng MỘT câu đúng (trước GV nhận 403 "chỉ Quản lý sửa được điểm"); ô mang cờ `khongVang` để web không gửi "-".
 */
export function chanVangLopKetThuc(classId: number | null): void {
  if (laLopKetThuc(classId)) throw badRequest(CAU_KHONG_VANG);
}

/** Lớp đã kết thúc → sửa điểm chỉ lưu điểm + nhật ký: không tự tạo / rút Case, tín hiệu, bổ trợ (rà PR #379, Q4). */
export const laLopKetThuc = (classId: number | null): boolean =>
  !!classId && (db().prepare('SELECT status FROM classes WHERE id = ?').get(classId) as any)?.status === 'finished';
