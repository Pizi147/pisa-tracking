import { capNhatConOCho } from '../fasttrack/conOCho.ts';
import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import { HV_DANG_HOC_SQL, LUOT_HIEN_TAI_SQL } from '../students/tamDung.ts';
import { addMilestone, caseKhacChuongTrinh, chuongTrinhCuaLop, followUntilAfter, taoCaseTuDong } from '../cases/sos.ts';
import { dongBoBaoPh, monBaoPh } from '../yThuc/phoiHop.ts';
import { raiseSignal, reconcileCorrectedSignals, tinHieuDaCoCase } from '../cases/signals.ts';
import {
  ATTEMPT_KIND_LABEL, ATTEMPT_KIND_SHORT, LIEN_TUC_SQL, PERMISSIONS, boMonTheoLuot, daGhiLuot, laChuongTrinhGoc, RATIO_PASS_THRESHOLD, boMonLich, monBanGiao, boTroGiuaKhoa, chipCheckpoint, khoaBai, nhanBai,
  categoryOf, goiYCuoiKhoa, kiemNhanXet, luatVangThuong, ngay, ratioResult, sosFromFailCount, tenMon, tenMonNgan, tuanLich,
  type AssessedSkill, type AttemptKind, type RatioOutcome, type SosLevel,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, forbidden, isIsoDate, notFound, nowIso, loi } from '../util.ts';
import { bangLop, can, editableSkills, isCoreTeacherOf, require_, scoreEditPath, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, ensurePeriods, mondayOf, skillScoreDeadline } from '../platform/week.ts';
import { chanKhoiPhucThuong, huyCua, kckCuaLuot, lichSuCaseCua, lichSuLichCua, lopHienTaiCua, nguoiLamCuaLuot, regularSkillViews, scoreHistoryOf, weekStartOf } from '../fasttrack/attempts.ts';
import { coNho, nho } from '../platform/nguCanhRequest.ts';
import { nhoThamChieu } from '../platform/mocHeThong.ts';
import { boMonCuaLuot, lichGopCua, checkSkillWeekMove, ensureSkillRows, kiemDaToiTuanThi, loadSkillRows, logSchedule, setSkillWeek } from '../fasttrack/skillSchedule.ts';
import { CAU_KHONG_VANG, chanVangLopKetThuc, dotHoanTat, dotHoanTatMany, kiemLopKetThuc, laLopKetThuc, oChuaCoDiem, quyenSuaSauHoanTat } from '../fasttrack/hoanTat.ts';
import { catDiemO, diemHuyMo, dongBanCat } from '../fasttrack/ketQuaHuy.ts';
import { canRequest, duocGoDau } from '../fasttrack/absence.ts';
import { classProgress, classProgressMany, lichMtCua } from '../classes/schedule.ts';
import { baoLenCuoiKhoaDoiQuaHan, capNhatCuoiKhoaSauChuyen, dongBoCheTaiFinal } from './cuoiKhoa.ts';
import { lamMoiDiemBanChup } from '../loTrinh/banChup.ts';

/**
 * LỚP THƯỜNG (Foundation / Beginner / Elementary).
 *
 * Dùng CHUNG bảng dữ liệu và CHUNG hệ thống Case SOS với lớp FT — cùng `assessment_attempts`,
 * `assessment_scores`, `sos_cases`. Chỉ khác ba thứ:
 *
 *   1. CÁCH CHẤM: nhập `điểm đạt / tổng điểm`, đạt từ 70% trở lên (ngưỡng owner chốt sau
 *      PR15, trước đó là 60%). Không quy ra band IELTS, không có kỳ vọng theo target,
 *      không có Overall. Ngưỡng đọc từ `RATIO_PASS_THRESHOLD`, không gõ lại con số.
 *   2. MỐC KIỂM TRA: theo TUẦN HỌC của lớp (FOU tuần 4 và 8; BE/ELE tuần 5 và 10),
 *      không phải theo lịch MT của FT.
 *   3. KỸ NĂNG: bốn môn L/R/W/S, giống nhau ở mọi chương trình Normal.
 *
 * Ngưỡng SOS giữ nguyên: 1 môn trượt → SOS 1, 2 môn → SOS 2, từ 3 môn → SOS 3.
 */

export type ProgrammeInfo = {
  code: string; name: string; weeks: number | null; scoringMode: string;
  /** PR-Dọn (VN18): chương trình đã ngưng vẫn nạp — lớp cũ của nó vẫn xác định được cách chấm; chỉ danh sách để CHỌN lọc theo cờ này. */
  active: boolean;
  skills: string[];
  checkpoints: { kind: AttemptKind; studyWeek: number }[];
  /** OV-6b1: đạt từ (0.7 = 70 %) — chỉ chương trình đúng/tổng; null với FT. Chép vào lớp lúc tạo (`mocChupVaoLop`). */
  nguongDat: number | null;
  /** OV-6b2: chương trình liên tục — Checkpoint mỗi n tuần; null = có số tuần. Chép vào lớp lúc tạo (`classes.moc_lap`). */
  lapMoiTuan: number | null;
};

/**
 * Đọc TẤT CẢ chương trình bằng ba câu lệnh, không phải ba câu cho mỗi lớp.
 *
 * Danh sách lớp hỏi chương trình của từng dòng, nên đọc lẻ là đúng cái bẫy N+1 mà cả
 * màn hình này được dựng để tránh.
 */
/** Cách chấm của lớp theo mã chương trình: 'ratio' (lớp thường) hoặc 'ielts_band' (Fast Track, cả khi không rõ chương trình). */
export type CheDo = 'ielts_band' | 'ratio';
export const cheDoCua = (programmeCode: string | null | undefined): CheDo =>
  allProgrammes().get(programmeCode ?? '')?.scoringMode === 'ratio' ? 'ratio' : 'ielts_band';

/** PR-TD: ba câu SQL cho CẢ hệ thống chương trình, nhớ trong request GET — gọi lặp mỗi lớp/mỗi lượt trong một request. TL-NEN: + theo tiến trình, khoá phiên bản DB. */
/**
 * LECH-CACH-CHAM: MỘT luật chọn cách chấm của một lượt — theo chương trình LỚP CỦA LƯỢT (lớp tại thời điểm đánh giá, như `scoringModeOf`), không theo lộ
 * trình. Trả chương trình khi lượt chấm tỷ lệ, `null` = chấm band. `programmes` là hàm: lượt FT không đọc bảng chương trình.
 */
/** LECH-KHONG-LOP: mã chương trình CHẤM của lượt — chương trình lớp của lượt; lượt KHÔNG lớp theo chương trình của lộ trình. Mọi đường chấm lượt đi qua đây. */
export const maCtCuaLuot = (classId: number | null | undefined, ctLop: string | null | undefined, ctLoTrinh: string | null | undefined): string | null =>
  (classId != null ? ctLop : ctLoTrinh) ?? null;

export function chuongTrinhTyLeCuaLuot(ma: string | null | undefined, programmes: () => Map<string, ProgrammeInfo>): ProgrammeInfo | null {
  if (!ma || ma === 'FT') return null;
  const prog = programmes().get(ma);
  return prog?.scoringMode === 'ratio' ? prog : null;
}

export function allProgrammes(): Map<string, ProgrammeInfo> {
  return nhoThamChieu('chuong-trinh', () => {
    /* PANEL-MC (luật Turso): MỘT câu thay ba — môn + mốc gom JSON theo chương trình, xếp lại ở đây (cùng thứ tự `seq, skill` / `study_week` như ba câu cũ). */
    const out = new Map<string, ProgrammeInfo>();
    for (const p of db().prepare(
      `SELECT p.*, (SELECT json_group_array(json_array(ps.seq, ps.skill)) FROM programme_skills ps WHERE ps.programme_code = p.code) AS mon_json,
              (SELECT json_group_array(json_array(pc.study_week, pc.kind)) FROM programme_checkpoints pc WHERE pc.programme_code = p.code) AS moc_json
         FROM programmes p`,
    ).all() as any[]) {
      const mon = (JSON.parse(p.mon_json ?? '[]') as [number, string][]).sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
      const moc = (JSON.parse(p.moc_json ?? '[]') as [number, string][]).sort((a, b) => a[0] - b[0]);
      out.set(p.code, {
        code: p.code, name: p.name, weeks: p.weeks, scoringMode: p.scoring_mode, active: p.status === 'active',
        skills: mon.map((m) => m[1]), checkpoints: moc.map(([studyWeek, kind]) => ({ kind: kind as AttemptKind, studyWeek })),
        nguongDat: p.nguong_dat ?? null, lapMoiTuan: p.lap_moi_tuan ?? null,
      });
    }
    return out;
  });
}

export function programmeByCode(code: string | null | undefined): ProgrammeInfo | null {
  if (!code) return null;
  return allProgrammes().get(code) ?? null;
}

/** Bộ môn xếp lịch của chương trình (`boMonLich`): chương trình gốc theo mẫu (không đọc DB); mã Quản trị tạo (OV-6b2: PET L+S R+W) đọc bảng. */
export const boMonCt = (ct: string | null | undefined): readonly string[] =>
  boMonLich(ct, laChuongTrinhGoc(ct) ? null : programmeByCode(ct)?.skills);
/** Bộ môn bàn giao chuyển lớp (`monBanGiao`): FT tách W1 · W2, bỏ môn em không đăng ký (`mon_dang_ky` của lộ trình FT). */
export const boMonBanGiaoCt = (ct: string | null | undefined, monDangKy?: string | null): string[] => monBanGiao(ct, boMonCt(ct), monDangKy);

/**
 * PF1 + OV-6b1: cấu hình chương trình chụp vào lớp lúc tạo / đổi chương trình / đổi lộ trình — Quản trị sửa sau chỉ áp lớp mở sau.
 *   lớp thường  số tuần + mốc Giữa/Cuối khoá + ngưỡng đạt (`so_tuan`, `tuan_giua_khoa`, `tuan_cuoi_khoa`, `nguong_dat`)
 *   FT          tuần học của từng MT theo lộ trình (`lich_mt`, JSON) — ba cột số tuần NULL (FT không có số tuần cố định)
 */
export function mocChupVaoLop(code: string | null | undefined, route: string | null | undefined): {
  so_tuan: number | null; tuan_giua_khoa: number | null; tuan_cuoi_khoa: number | null; lich_mt: string | null; nguong_dat: number | null;
  /** OV-6b2: Checkpoint mỗi n tuần (lớp liên tục). */
  moc_lap: number | null;
} {
  const prog = programmeByCode(code);
  const moc = (k: AttemptKind) => prog?.checkpoints.find((x) => x.kind === k)?.studyWeek ?? null;
  const coTuan = !!prog?.weeks;
  return {
    so_tuan: coTuan ? prog!.weeks : null, tuan_giua_khoa: coTuan ? moc('progress') : null, tuan_cuoi_khoa: coTuan ? moc('final') : null,
    lich_mt: code === 'FT' ? JSON.stringify(lichMtCua(null, route ?? 'LT1')) : null,
    nguong_dat: prog?.scoringMode === 'ratio' ? prog.nguongDat ?? RATIO_PASS_THRESHOLD : null,
    moc_lap: prog?.scoringMode === 'ratio' && !prog.weeks ? prog.lapMoiTuan : null,
  };
}

export function programmeOfClass(classId: number): ProgrammeInfo | null {
  /* TL-HVL: GET đọc bảng lớp đã nhớ — hồ sơ HV hỏi lại cùng lớp cho từng lượt (`typedResult`), mỗi lần một lượt mạng Turso. */
  return programmeByCode(coNho() ? bangLop().get(classId)?.ct : (db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(classId) as any)?.programme_code);
}

/** Lớp này có chấm theo tỷ lệ điểm đạt/tổng điểm không (tức là lớp thường). */
export function isRatioClass(classId: number | null | undefined): boolean {
  if (!classId) return false;
  return programmeOfClass(classId)?.scoringMode === 'ratio';
}

/**
 * Mã chương trình của một lộ trình, suy từ lớp của các bài kiểm tra trong lộ trình đó.
 * Dùng khi bản thân lộ trình chưa ghi mã chương trình (dữ liệu cũ).
 */
export function programmeCodeOfCycle(cycleId: number | null | undefined): string | null {
  if (!cycleId) return null;
  /* PR-Dọn (Task 9h): nhớ trong request GET — hồ sơ HV hỏi lại cùng lộ trình nhiều lần. */
  return nho(`ct-lo-trinh:${cycleId}`, () => (db()
    .prepare(
      `SELECT c.programme_code AS code FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
        WHERE a.cycle_id = ? AND a.kind != 'mt0' AND c.programme_code IS NOT NULL LIMIT 1`,   // PR-MT0: MT0 nối vào FT vẫn mang lớp thường cũ
    )
    .get(cycleId) as any)?.code ?? null);
}

/**
 * Lộ trình này chấm theo TỶ LỆ (lớp thường) hay theo BAND (Fast Track).
 *
 * Ưu tiên mã chương trình ghi trên chính lộ trình. Dữ liệu cũ có thể thiếu mã đó, nên còn
 * một đường tra dự phòng: lớp của các bài kiểm tra trong lộ trình. Không có căn cứ nào thì
 * coi là lớp band — đó là mặc định của trung tâm.
 *
 * Đây là chỗ DUY NHẤT trả lời câu hỏi này. Trước vòng 5 nó bị chép ở hai file, và hai bản
 * chép là hai chỗ để sau này lệch nhau.
 */
export function isRatioCycle(c: { id?: number | null; route?: string | null; programme_code?: string | null } | null | undefined): boolean {
  if (!c || c.route) return false;
  if (c.programme_code) return programmeByCode(c.programme_code)?.scoringMode === 'ratio';
  return programmeByCode(programmeCodeOfCycle(c.id))?.scoringMode === 'ratio';
}

// ---------------------------------------------------------------- kết luận

export type RegularSkillResult = {
  skill: string;
  label: string;
  score: number | null;
  total: number | null;
  /** Tỷ lệ CHÍNH XÁC, chưa làm tròn. Làm tròn để hiện là việc của giao diện. */
  ratio: number | null;
  outcome: RatioOutcome;
};

export type RegularResult = {
  skills: RegularSkillResult[];
  /** Số kỹ năng đã có điểm hợp lệ trên tổng số kỹ năng của chương trình. */
  scored: number;
  required: number;
  /** Đủ điểm mọi kỹ năng của chương trình. */
  complete: boolean;
  /** Đã kết luận được nhưng chưa đủ điểm — mức SOS còn có thể tăng. */
  provisional: boolean;
  failedCount: number | null;
  sosLevel: SosLevel | null;
  passThreshold: number;
  /** K5-44, MH7: Σ điểm / Σ tổng — CHỈ khi đủ mọi môn (thiếu → null), không làm tròn. Pre FOU hiện đúng số này. */
  tyLeTong: number | null;
  /** Q-RL1 (chủ SP 29/10): môn "Không dự thi" (dấu "-" ≥ 2 tuần, không điểm) — ra khỏi bộ môn cần đủ; kết quả tính trên môn đã thi, giao diện ghi rõ. */
  khongDuThi: string[];
};

/**
 * Kết luận một bài kiểm tra của lớp thường.
 *
 * KẾT LUẬN NGAY TRÊN PHẦN ĐIỂM ĐANG CÓ (owner chốt 09/09/2026). Chỉ cần một kỹ năng đã
 * chấm là tính được; mức SOS có thể tăng khi các kỹ năng còn lại vào, và `provisional`
 * cho giao diện biết để ghi rõ "mới có 2/4 kỹ năng".
 *
 * THIẾU ĐIỂM VẪN KHÁC TRƯỢT: kỹ năng chưa chấm không bị đếm thành một môn chưa đạt.
 * Lớp thường KHÔNG có cơ chế miễn kỹ năng — dời lịch sang tuần khác thì được, nhưng bộ
 * kỹ năng của chương trình luôn đủ.
 */
export function evaluateRegular(
  skillsVao: readonly string[], rows: { skill: string; raw_score: number | null; raw_total: number | null; no_show_cu?: number | null }[], ct?: string | null,
  nguong: number = RATIO_PASS_THRESHOLD,   // OV-6b1: ngưỡng đạt của LỚP — `nguongDatLop(classId)`
): RegularResult {
  /* Q-RL1 (chủ SP 29/10): môn Không dự thi (chưa có điểm) không còn làm kết quả "chưa đủ môn" mãi — tính trên các môn đã thi. */
  const khongDuThi = skillsVao.filter((k) => rows.some((r) => r.skill === k && !!r.no_show_cu && r.raw_score == null));
  const skills = skillsVao.filter((k) => !khongDuThi.includes(k));
  const results: RegularSkillResult[] = skills.map((skill) => {
    const row = rows.find((r) => r.skill === skill);
    const { outcome, ratio } = ratioResult(row?.raw_score ?? null, row?.raw_total ?? null, nguong);
    return {
      skill,
      label: tenMon(ct, skill),
      score: row?.raw_score ?? null,
      total: row?.raw_total ?? null,
      ratio, outcome,
    };
  });
  const scored = results.filter((r) => r.outcome !== 'missing').length;
  const complete = skills.length > 0 && scored === skills.length;
  const failedCount = scored > 0 ? results.filter((r) => r.outcome === 'fail').length : null;

  /*
   * KẾT LUẬN TẠM THỜI CHỈ ĐƯỢC ĐI LÊN, KHÔNG ĐƯỢC ĐI XUỐNG "ĐẠT".
   *
   * Một môn dưới ngưỡng là kết luận được NGAY — nhập nốt ba môn kia cũng không làm môn đó
   * đạt lại, nên mở Case luôn để người dạy bắt tay vào sớm.
   *
   * Nhưng ba môn đạt mà môn thứ tư chưa nhập thì KHÔNG kết luận được gì: môn còn thiếu có
   * thể chính là môn em trượt. Ghi "Đạt kỳ vọng" lúc đó là báo an toàn giả, và người đọc
   * bảng sẽ bỏ qua em ấy — đúng lỗi owner nêu ở mục 6.3.
   */
  const sosLevel = failedCount === null ? null
    : failedCount === 0 && !complete ? null
    : sosFromFailCount(failedCount);

  return {
    skills: results,
    scored, required: skills.length, complete,
    provisional: scored > 0 && !complete,
    failedCount,
    sosLevel,
    passThreshold: nguong,
    tyLeTong: complete
      ? results.reduce((s, r) => s + (r.score ?? 0), 0) / results.reduce((s, r) => s + (r.total ?? 0), 0)
      : null,
    khongDuThi,
  };
}

/**
 * Hạn nhập điểm của một bài kiểm tra lớp thường: HẾT THỨ TƯ tuần kế tiếp — như Fast Track (T19, PR-MTa, chủ sản phẩm 06/10; trước
 * đây là Chủ nhật của chính tuần đó). Một luật với `skillScoreDeadline`. Chưa có tuần kế hoạch thì KHÔNG có hạn — trả về null thay vì
 * dựng một hạn giả.
 */
export function regularDeadline(attempt: { planned_period_id?: number | null; deadline_override?: string | null }): {
  date: string | null; source: 'override' | 'default' | 'none';
} {
  if (attempt.deadline_override) return { date: attempt.deadline_override, source: 'override' };
  if (!attempt.planned_period_id) return { date: null, source: 'none' };
  const rp = db().prepare('SELECT week_start FROM report_periods WHERE id = ?').get(attempt.planned_period_id) as any;
  return rp ? { date: skillScoreDeadline('ratio', rp.week_start), source: 'default' } : { date: null, source: 'none' };
}

export function regularResultOf(attemptId: number): RegularResult {
  const conn = db();
  const a = conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const prog = a?.class_id ? programmeOfClass(a.class_id) : null;
  const rows = conn.prepare('SELECT skill, raw_score, raw_total, no_show_cu FROM assessment_scores WHERE attempt_id = ?')
    .all(attemptId) as any[];
  return evaluateRegular(prog ? boMonTheoLuot(prog.skills, daGhiLuot(lichGopCua([attemptId]).get(attemptId), rows)) : [], rows, prog?.code, nguongDatLop(a?.class_id));
}

/** Lớp có ngưỡng đạt khác 70 % — MỘT câu, nhớ trong request GET (thường rỗng: chỉ lớp mở sau khi Quản trị đổi "Đạt từ"). */
export const nguongDatKhacMacDinh = (): Map<number, number> => nhoThamChieu('nguong-dat-lop', () => new Map(
  (db().prepare(`SELECT id, nguong_dat FROM classes WHERE nguong_dat IS NOT NULL AND nguong_dat != ?`).all(RATIO_PASS_THRESHOLD) as any[])
    .map((r) => [r.id as number, r.nguong_dat as number])));

/**
 * OV-6b1: ngưỡng đạt của lượt — lớp: bản chụp `classes.nguong_dat` lúc tạo lớp. LUOT-KHONG-LOP-2: lượt KHÔNG lớp → ngưỡng của chương trình chấm
 * (`maCt` = `maCtCuaLuot`, chương trình lộ trình). Thiếu → 70 %. Vòng lặp nhiều lượt: lấy Map một lần.
 */
export function nguongDatLop(classId: number | null | undefined, maCt?: string | null, ds: Map<number, number> = nguongDatKhacMacDinh()): number {
  if (classId) return ds.get(classId) || RATIO_PASS_THRESHOLD;
  return (maCt && allProgrammes().get(maCt)?.nguongDat) || RATIO_PASS_THRESHOLD;
}

// ---------------------------------------------------------------- lên lịch

/**
 * Tạo hai bài kiểm tra của một khoá lớp thường theo đúng MỐC TUẦN HỌC.
 *
 * Tuần học 4 nghĩa là tuần thứ tư kể từ ngày khai giảng, KHÔNG phải "W4" của một tháng.
 * Không có ngày khai giảng thì không đoán — báo lỗi để người dùng điền vào trước.
 */
export function planRegularTests(p: Principal, classId: number, opts: {
  /** Chỉ tạo cho các em này (Kế hoạch Test xếp từng em — PR-UX2). Không truyền = cả lớp. */
  studentIds?: number[];
  /** Chỉ tạo các mốc này. Không truyền = mọi mốc của chương trình. */
  kinds?: Array<'progress' | 'final'>;
} = {}) {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.PLAN_WEEK, { classId },
    'Chỉ Quản lý mới lập được kế hoạch kiểm tra của lớp.');

  const prog = programmeOfClass(classId);
  if (!prog || prog.scoringMode !== 'ratio') {
    throw badRequest('Lớp này không phải lớp thường. Lớp FT dùng lịch Mock Test.');
  }
  /*
   * Q13 (23/09): tuần mốc lấy từ `classProgress` — CÙNG nguồn với "đề xuất" của Kế hoạch Test
   * (`bangThuong`, `classes/schedule.ts:199`), tính từ `start_period_id` + mốc Quản lý đã sửa riêng
   * (`progress_week_override`/`final_week_override`). Trước đây hàm này tự tính từ `start_date`, bỏ qua mốc
   * đã sửa — tạo ra khác đề xuất là lỗi thầm lặng.
   */
  const progress = classProgress(classId);
  if (!progress.progressWeekStart && !progress.finalWeekStart) {
    throw badRequest('Lớp chưa có ngày khai giảng nên chưa tính được mốc tuần học.');
  }
  if (!prog.checkpoints.length) throw loi(400, 'Chương trình {name} chưa khai báo mốc kiểm tra nào.', { name: prog.name });

  const chonEm = opts.studentIds?.length ? opts.studentIds : null;
  const students = conn
    .prepare(
      `SELECT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND ${HV_DANG_HOC_SQL('s')}${
          chonEm ? ` AND s.id IN (${chonEm.map(() => '?').join(',')})` : ''}`,
    )
    .all(classId, ...(chonEm ?? [])) as any[];

  const created: number[] = [];
  return tx(() => {
    for (const st of students) {
      /*
       * Lớp thường vẫn cần một "lộ trình" để gắn bài kiểm tra vào — đó chính là khoá học này.
       *
       * Nhưng KHÔNG được mượn lộ trình IELTS đang mở của em: một em chuyển từ lớp FT sang
       * Foundation là bắt đầu một khoá KHÁC, có cách chấm khác và không có target. Gắn bài
       * Foundation vào lộ trình LT1 cũ thì lịch sử học của em thành một mớ lẫn lộn.
       * Lộ trình có `route` là lộ trình IELTS; lớp thường mở lộ trình riêng.
       */
      let cycle = conn
        .prepare(
          `SELECT * FROM learning_cycles
            WHERE student_id = ? AND status = 'active' AND route IS NULL
            ORDER BY seq DESC LIMIT 1`,
        )
        .get(st.id) as any;
      if (!cycle) {
        const seq = ((conn.prepare('SELECT MAX(seq) m FROM learning_cycles WHERE student_id = ?').get(st.id) as any)?.m ?? 0) + 1;
        const info = conn
          .prepare(
            // GHI RÕ CHƯƠNG TRÌNH vào khoá học. Thiếu nó thì sau này không biết khoá này
            // chấm theo tỷ lệ hay theo band, và hồ sơ học viên sẽ dựng ra bảng band IELTS
            // cho một lớp Foundation.
            `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                          started_at, status, note, created_at)
             VALUES (?,?, NULL, ?, NULL, ?, 'active', ?, ?)`,
          )
          .run(st.id, seq, prog.code, cls.start_date, `Khoá ${prog.name} — lớp ${cls.code}`, nowIso());
        cycle = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(Number(info.lastInsertRowid));
        addJourney({
          studentId: st.id, eventType: 'cycle_start', eventDate: cls.start_date,
          title: `Bắt đầu khoá ${prog.name}`, detail: `Lớp ${cls.code}`,
          refTable: 'learning_cycles', refId: cycle.id, createdBy: p.userId,
        });
      }

      /* Mốc lấy từ `classProgress` (số tuần chụp vào lớp / bảng) — chương trình không có Giữa khoá (Pre FOU) thì bỏ mốc đó. */
      for (const kind of ['progress', 'final'] as const) {
        if (opts.kinds && !opts.kinds.includes(kind)) continue;
        const week = kind === 'progress' ? progress.progressWeekStart : progress.finalWeekStart;
        const studyWeek = kind === 'progress' ? progress.progressWeek : progress.finalWeek;
        if (!week) continue;
        const dup = conn
          .prepare(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND kind = ?`)
          .get(cycle.id, kind) as any;
        if (dup) continue;

        const period = ensurePeriod(week);
        const nextNo = ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?')
          .get(cycle.id) as any)?.m ?? 0) + 1;
        const info = conn
          .prepare(
            `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                              status, created_by, created_at)
             VALUES (?,?,?,?,?,?, 'planned', ?,?)`,
          )
          .run(cycle.id, st.id, nextNo, kind, classId, period.id, p.userId, nowIso());
        /* Bốn môn cùng tuần khi mới lập; trải ra nhiều tuần là thao tác đổi lịch sau đó. */
        ensureSkillRows(Number(info.lastInsertRowid));
        logSchedule(Number(info.lastInsertRowid), { action: 'created', field: 'planned_period', newValue: period.code, actor: p.userId });   // HSL-MAY-CHU: như lượt FT
        created.push(Number(info.lastInsertRowid));
        addJourney({
          studentId: st.id, eventType: 'mock_scheduled', eventDate: week,
          title: `${ATTEMPT_KIND_LABEL[kind]} · tuần học ${studyWeek}`,
          detail: `${period.code} · lớp ${cls.code}`,
          refTable: 'assessment_attempts', refId: Number(info.lastInsertRowid), createdBy: p.userId,
        });
      }
    }
    writeAudit({ actorUserId: p.userId, action: 'regular.plan', entityType: 'class', entityId: classId,
      entityLabel: cls.code, after: { created: created.length, students: students.length } });
    return { created: created.length, students: students.length, programme: prog };
  });
}

/**
 * M1b (K2-23, Câu 2 = A): em VÀO LỚP THƯỜNG (thêm mới, chuyển vào, Chuyển tiếp lớp) tự có bài Giữa khoá + Cuối khoá theo mốc của lớp — không có bài thì
 * không có Case Giữa khoá. Bỏ mốc có tuần thi KẾT THÚC TRƯỚC `ngayVao` (không dựng bài quá hạn — lớp thường không có "lịch sử"); Pre FOU chỉ Cuối khoá
 * (lớp không có mốc thì bỏ). Việc HỆ THỐNG: KHÔNG kiểm quyền (như `taoMtMacDinh`), gọi TRONG tx của nơi mở lộ trình. Số câu SQL KHÔNG phụ thuộc số em
 * (lô 900). Chạy lại không tạo trùng. `planRegularTests` (Quản lý xếp tay, kể cả tuần đã qua) không đổi. Trả id các lượt mới.
 */
export function taoBaiThuongMacDinh(cycleIds: readonly number[], actorUserId: number | null, ngayVao: string = demoToday()): number[] {
  if (!cycleIds.length) return [];
  const conn = db();
  const cys: any[] = [];
  theoLo([...new Set(cycleIds)], (lo, ph) => { cys.push(...(conn.prepare(`SELECT id, student_id FROM learning_cycles WHERE id IN (${ph}) AND route IS NULL AND status = 'active'`).all(...lo) as any[])); });
  if (!cys.length) return [];
  const lopOf = new Map<number, number>();
  theoLo([...new Set(cys.map((c) => c.student_id as number))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT student_id, class_id FROM enrollments WHERE student_id IN (${ph}) AND status = 'active' ORDER BY id DESC`).all(...lo) as any[]) {
      if (!lopOf.has(r.student_id)) lopOf.set(r.student_id, r.class_id);
    }
  });
  const chuongTrinh = allProgrammes();
  const ctLop = new Map<number, string | null>();
  theoLo([...new Set(lopOf.values())], (lo, ph) => {
    for (const c of conn.prepare(`SELECT id, programme_code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) ctLop.set(c.id, c.programme_code ?? null);
  });
  const lopThuong = [...ctLop].filter(([, ct]) => ct && chuongTrinh.get(ct)?.scoringMode === 'ratio').map(([id]) => id);
  if (!lopThuong.length) return [];
  const moc = classProgressMany(lopThuong);
  const daCo = new Set<string>(), soLuot = new Map<number, number>();
  theoLo(cys.map((c) => c.id as number), (lo, ph) => {
    for (const a of conn.prepare(`SELECT id, cycle_id, kind, attempt_no FROM assessment_attempts WHERE cycle_id IN (${ph})`).all(...lo) as any[]) {
      daCo.add(`${a.cycle_id}:${a.kind}`); soLuot.set(a.cycle_id, Math.max(soLuot.get(a.cycle_id) ?? 0, a.attempt_no));
    }
  });
  const moi: LuotMoi[] = [];
  for (const cy of cys) {
    const classId = lopOf.get(cy.student_id);
    if (classId === undefined || !lopThuong.includes(classId)) continue;
    const pr = moc.get(classId);
    if (!pr) continue;
    for (const kind of ['progress', 'final'] as const) {
      const week = kind === 'progress' ? pr.progressWeekStart : pr.finalWeekStart;
      if (!week || daCo.has(`${cy.id}:${kind}`) || addDays(week, 6) < ngayVao) continue;   // không tạo bài quá hạn
      const no = (soLuot.get(cy.id) ?? 0) + 1;
      soLuot.set(cy.id, no);
      moi.push({ cycleId: cy.id, studentId: cy.student_id, kind, classId, week, no });
    }
  }
  const ids = ghiLuotThuong(moi, ctLop, actorUserId, 'Tự xếp khi vào lớp');
  /* OV-6b2: lớp liên tục (PET, KET…) không có Progress / Final — em vào lớp có Checkpoint kế tiếp. */
  const lienTuc = lopThuong.filter((id) => moc.get(id)?.mocLap);
  return lienTuc.length ? [...ids, ...sinhCheckpointKeTiep(lienTuc, ngayVao, actorUserId, cys.map((c) => c.id as number))] : ids;
}

type LuotMoi = { cycleId: number; studentId: number; kind: 'progress' | 'final' | 'checkpoint'; classId: number; week: string; no: number };

/**
 * GHI lượt lớp thường mới (trong tx của nơi gọi): lượt + dòng lịch từng môn (bộ môn theo chương trình lớp) + Hành trình. Số câu SQL không phụ thuộc
 * số em (lô 900). `attempt_no` duy nhất theo lộ trình nên đọc lại id theo (lộ trình, số). Trả id theo đúng thứ tự `moi`.
 */
function ghiLuotThuong(moi: readonly LuotMoi[], ctLop: Map<number, string | null>, actorUserId: number | null, chiTiet: string): number[] {
  if (!moi.length) return [];
  const conn = db();
  const tuan = ensurePeriods([...new Set(moi.map((m) => m.week))]);
  const now = nowIso();
  chenNhieuDong(
    'INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_by, created_at)',
    moi.map((m) => [m.cycleId, m.studentId, m.no, m.kind, m.classId, tuan.get(m.week)!.id, 'planned', actorUserId, now]));
  /* INSERT nhiều dòng không trả id → đọc lại theo (lộ trình, số lượt) — khoá duy nhất của bảng. */
  const idOf = new Map<string, number>();
  theoLo([...new Set(moi.map((m) => m.cycleId))], (lo, ph) => {
    for (const a of conn.prepare(`SELECT id, cycle_id, attempt_no FROM assessment_attempts WHERE cycle_id IN (${ph})`).all(...lo) as any[]) {
      idOf.set(`${a.cycle_id}:${a.attempt_no}`, a.id);
    }
  });
  const ids = moi.map((m) => idOf.get(`${m.cycleId}:${m.no}`)!);
  /* = `ensureSkillRows` của lượt mới: bộ môn theo chương trình lớp (FOU/BE/ELE 4 môn, Pre FOU Tổng hợp, PET L+S R+W), tuần theo lượt. Một câu mỗi chương trình. */
  const theoCt = new Map<string | null, { bo: readonly string[]; ids: number[] }>();
  moi.forEach((m, i) => {
    const ct = ctLop.get(m.classId) ?? null;
    if (!theoCt.has(ct)) theoCt.set(ct, { bo: boMonLich(ct, programmeByCode(ct)?.skills), ids: [] });
    theoCt.get(ct)!.ids.push(ids[i]);
  });
  for (const { bo, ids: dsId } of theoCt.values()) {
    const mon = bo.map((_, i) => `SELECT ? AS skill, ${i} AS thu`).join(' UNION ALL ');
    theoLo(dsId, (lo, ph) => {
      conn.prepare(
        `INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at)
         SELECT a.id, k.skill, CASE WHEN EXISTS (SELECT 1 FROM attempt_skill_skips x WHERE x.attempt_id = a.id AND x.skill = k.skill) THEN 0 ELSE 1 END,
                a.planned_period_id, 'auto', 'scheduled', ?
           FROM assessment_attempts a CROSS JOIN (${mon}) k WHERE a.id IN (${ph}) ORDER BY a.id, k.thu`).run(now, ...bo, ...lo);
    }, THAM_SO_TOI_DA - bo.length - 1);
  }
  capNhatConOCho(ids);   // TD7b: lượt mới + dòng lịch chèn bằng SQL lô
  /* HSL-MAY-CHU: dòng "created" của lịch sử lịch như lượt FT (`taoMtMacDinh`) — trang lượt đọc lịch sử từ đây. */
  chenNhieuDong(
    'INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)',
    moi.map((m, i) => [ids[i], 'created', 'planned_period', null, tuan.get(m.week)!.code, chiTiet, actorUserId, now]));
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)',
    moi.map((m, i) => [m.studentId, m.cycleId, 'mock_scheduled', m.week,
      `${m.kind === 'checkpoint' ? nhanBai(khoaBai(m.kind, m.no)) : ATTEMPT_KIND_LABEL[m.kind]} · ${tuan.get(m.week)!.code}`,
      chiTiet, 'assessment_attempts', ids[i], actorUserId, now]));
  return ids;
}

/**
 * OV-6b2 — CHECKPOINT KẾ TIẾP của lớp liên tục (PET, KET…): mỗi em LUÔN có đúng một Checkpoint kế tiếp chưa thi, không sinh trước hàng loạt.
 * Checkpoint n ở tuần học n × `moc_lap` của LỚP (6, 12, 18…; số n chung cả lớp — Điểm theo lớp "Checkpoint 2"). Sinh lượt kế khi lượt cuối của em
 * đã đủ điểm hoặc đã qua tuần thi (tuần muộn nhất của các môn — QL dời thì chờ theo); em mới vào (hoặc lượt kế đã qua) → Checkpoint đầu tiên còn
 * tới. Gọi: em vào lớp (`taoBaiThuongMacDinh`), sau khi nhập điểm (`refreshRegularOutcome`), quét khi đọc (`quetCheckpoint`) và quét thứ Hai.
 * Chạy lặp vô hại. `classIds` null = mọi lớp liên tục đang chạy; `cycleIds` = chỉ các lộ trình này. Trả id lượt mới.
 */
export function sinhCheckpointKeTiep(classIds: readonly number[] | null, homNay: string = demoToday(), actorUserId: number | null = null,
  cycleIds?: readonly number[]): number[] {
  const conn = db();
  const lop: any[] = [];
  const cauLop = `SELECT c.id, c.programme_code, c.moc_lap, rp.week_start FROM classes c JOIN report_periods rp ON rp.id = c.start_period_id
    WHERE ${LIEN_TUC_SQL('c')} AND c.status = 'active'`;
  if (classIds) theoLo([...new Set(classIds)], (lo, ph) => { lop.push(...(conn.prepare(`${cauLop} AND c.id IN (${ph})`).all(...lo) as any[])); });
  else lop.push(...(conn.prepare(cauLop).all() as any[]));
  if (!lop.length) return [];
  const lopId = new Map(lop.map((c) => [c.id as number, c]));
  const chon = cycleIds ? new Set(cycleIds) : null;
  const em: { cycleId: number; studentId: number; classId: number }[] = [];
  theoLo([...lopId.keys()], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT e.class_id, cy.id AS cycle_id, cy.student_id FROM enrollments e
         JOIN students s ON s.id = e.student_id AND ${HV_DANG_HOC_SQL('s')}
         JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active' AND cy.route IS NULL
        WHERE e.class_id IN (${ph}) AND e.status = 'active'`,
    ).all(...lo) as any[]) if (!chon || chon.has(r.cycle_id)) em.push({ cycleId: r.cycle_id, studentId: r.student_id, classId: r.class_id });
  });
  if (!em.length) return [];
  /* Lượt của các lộ trình: số đã dùng (khoá duy nhất) + Checkpoint cuối (số lớn nhất, còn hiệu lực) với tuần thi muộn nhất của môn còn thi. */
  const daDung = new Map<number, Set<number>>();
  const cuoi = new Map<number, { no: number; status: string; tuan: string | null }>();
  theoLo([...new Set(em.map((e) => e.cycleId))], (lo, ph) => {
    for (const a of conn.prepare(
      `SELECT a.cycle_id, a.attempt_no, a.kind, a.status,
              (SELECT MAX(rp.week_start) FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
                WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled') AS tuan
         FROM assessment_attempts a WHERE a.cycle_id IN (${ph})`,
    ).all(...lo) as any[]) {
      (daDung.get(a.cycle_id) ?? daDung.set(a.cycle_id, new Set()).get(a.cycle_id)!).add(a.attempt_no);
      if (a.kind !== 'checkpoint' || a.status === 'cancelled') continue;
      const c = cuoi.get(a.cycle_id);
      if (!c || a.attempt_no > c.no) cuoi.set(a.cycle_id, { no: a.attempt_no, status: a.status, tuan: a.tuan ?? null });
    }
  });
  const moi: LuotMoi[] = [];
  for (const e of em) {
    const c = lopId.get(e.classId);
    const tuanCua = (n: number) => addDays(c.week_start, 7 * (n * c.moc_lap - 1));
    const truoc = cuoi.get(e.cycleId);
    let n: number;
    if (!truoc) n = 1;
    else {
      const xong = truoc.status === 'done' || (!!truoc.tuan && addDays(truoc.tuan, 6) < homNay);
      if (!xong) continue;   // lượt cuối còn chờ thi / chờ điểm — không sinh thêm
      n = truoc.no + 1;
    }
    while (addDays(tuanCua(n), 6) < homNay) n += 1;   // như bài lớp thường: không dựng lượt đã qua tuần thi
    if (daDung.get(e.cycleId)?.has(n)) continue;      // số đã có lượt khác (lộ trình cũ chuyển sang) — không đè
    moi.push({ cycleId: e.cycleId, studentId: e.studentId, kind: 'checkpoint', classId: e.classId, week: tuanCua(n), no: n });
  }
  return ghiLuotThuong(moi, new Map(lop.map((x) => [x.id as number, x.programme_code ?? null])), actorUserId, 'Tự xếp Checkpoint kế tiếp');
}

/**
 * Quét khi đọc một lớp (như `quetLenhDenHan`): Điểm theo lớp / Kế hoạch Test của lớp liên tục sinh Checkpoint kế cho em đã qua tuần thi — lưới an toàn
 * cạnh lượt quét thứ Hai. Một lần mỗi request; lớp không liên tục chỉ tốn 1 câu. Lỗi không làm hỏng trang đang đọc.
 */
export function quetCheckpoint(classId: number, homNay = demoToday()): void {
  nho(`checkpoint:${classId}:${homNay}`, () => {
    try { tx(() => sinhCheckpointKeTiep([classId], homNay)); } catch (e) { console.error('[checkpoint] quét khi đọc', e); }
    return true;
  });
}

// ---------------------------------------------------------------- nhập điểm

/**
 * Nhập điểm một kỹ năng của bài kiểm tra lớp thường: SỐ CÂU ĐÚNG và TỔNG SỐ CÂU.
 *
 * Cả hai đều phải nhập. Số câu không cố định giữa các kỹ năng và các đề, nên tự điền tổng
 * là đoán bừa — mà đoán sai tổng thì đạt/trượt sai theo.
 */
export function saveRegularScore(
  p: Principal, attemptId: number, skill: string,
  patch: {
    score?: number | null; total?: number | null; note?: string | null; noShow?: boolean; lyDo?: string | null;
    /** OV-4b: nhận xét của môn (`null`/rỗng = xoá) — lưu riêng, không phải điểm: không đổi điểm, "Nhập bởi", kết quả. */
    nhanXet?: string | null;
  },
  today: string = demoToday(),
) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt đánh giá');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không nhập điểm được.');
  /* PR-OV1a (lỗi 3.3): MT0 ở lớp thường chấm band — đúng/tổng hay dấu "-" tỷ lệ ghi vào đây làm hỏng lượt. */
  if (a.kind === 'mt0') throw badRequest('MT0 chấm band — nhập ở Test › Điểm theo lớp › MT0.');

  const prog = a.class_id ? programmeOfClass(a.class_id) : null;
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lượt này không thuộc lớp thường.');
  if (!boMonCuaLuot(conn, attemptId).includes(skill)) {   // P13: lượt đã ghi môn gộp cũ (L+S, R+W) nhận đúng môn của lượt
    throw loi(400, 'Lớp {name} không có kỹ năng {x}.', { name: prog.name, x: tenMon(prog.code, skill) });
  }
  /*
   * OV-13h (chủ SP 15/10): GV đúng môn (kiểm `path` bên dưới) NHẬP điểm vào ô chưa có điểm, hoặc ghi NHẬN XÉT (lệnh chỉ nhận xét — không đổi
   * điểm, như HOTFIX-2 của FT), cả sau hoàn tất / lớp đã kết thúc; sửa / xoá điểm đã có vẫn qua QL. Chỉ đọc ô khi cần, một lần.
   */
  const chiNhanXet = patch.nhanXet !== undefined && patch.score === undefined && patch.total === undefined && patch.noShow === undefined;
  let gvDuocNho: boolean | undefined;
  const gvDuoc = () => (gvDuocNho ??= chiNhanXet || (patch.noShow === undefined && patch.nhanXet === undefined && patch.score !== undefined && patch.score !== null
    && oChuaCoDiem(conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill))));
  if (patch.noShow !== undefined) chanVangLopKetThuc(a.class_id);   // một câu cho mọi vai (rà #410)
  /* OV-11g (HL-10): lớp đã kết thúc — GV 403 trước mọi việc ghi (trừ `gvDuoc`); Quản lý đi đường `override`. */
  const lopKetThuc = kiemLopKetThuc(p, a.class_id, gvDuoc);
  /* Dấu "-" đi đường riêng vì nó KHÔNG phải một điểm: nó là một lần dời lịch (C08). */
  if (patch.noShow !== undefined) {
    if (patch.score !== undefined || patch.total !== undefined) {
      throw badRequest('Một lần gửi chỉ làm một việc: nhập điểm, hoặc ghi/gỡ dấu "-".');
    }
    return reportRegularNoShow(p, attemptId, skill, patch.noShow === true, today, patch.lyDo ?? undefined);
  }
  /*
   * Cùng hai đường vào như lớp FT: giáo viên nhập kỹ năng MÌNH ĐƯỢC PHÂN CÔNG, còn Admin
   * chi nhánh và Quản trị hệ thống nhập bù qua quyền riêng (`score.override`) khi giáo viên
   * vắng. Hai đường ghi nhật ký khác nhau để sau này còn siết lại được.
   *
   * LUAT-34 (Luật 3, thay R11 23/09): "Đủ điểm" chỉ còn là trạng thái — GVBM đúng môn sửa / xoá mọi lúc; nhật ký ghi `sauHoanTat`.
   * Lớp đã kết thúc vẫn chỉ Quản lý (`kiemLopKetThuc` ở trên, Q-B1 ①).
   */
  const hoanTat = dotHoanTat(attemptId, today);
  let path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.');
  }
  if (lopKetThuc) path = 'override';

  /* OV-4b: chỉ nhận xét — cùng quyền nhập điểm môn đó (đã kiểm ở trên), cùng luật ≤ 1000 ký tự với Mock; một lệnh một việc. */
  if (patch.nhanXet !== undefined) {
    if (patch.score !== undefined || patch.total !== undefined) throw badRequest('Một lần gửi chỉ làm một việc: nhập điểm, hoặc lưu nhận xét.');
    const nx = kiemNhanXet(patch.nhanXet);
    if ('loi' in nx) throw badRequest(nx.loi);
    return tx(() => {
      const cu = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
      if (cu) conn.prepare('UPDATE assessment_scores SET comment = ? WHERE id = ?').run(nx.gt, cu.id);
      else conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, comment) VALUES (?,?,?)').run(attemptId, skill, nx.gt);
      writeAudit({ actorUserId: p.userId, action: 'score.nhan_xet', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: skill, before: cu ? { comment: cu.comment ?? null } : null, after: { comment: nx.gt } });
      return { score: conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill),
        result: regularResultOf(attemptId) };
    });
  }

  /* T19 (PR-MTa): ghi một điểm (không phải xoá) → môn phải tới tuần thi — cùng chốt với Mock. */
  if (patch.score !== undefined && patch.score !== null) kiemDaToiTuanThi(ensureSkillRows(attemptId).find((r) => r.skill === skill) ?? { week_start: null }, today);
  const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
    .get(attemptId, skill) as any;
  const before = existing ? { ...existing } : null;

  const score = patch.score !== undefined ? patch.score : existing?.raw_score ?? null;
  const total = patch.total !== undefined ? patch.total : existing?.raw_total ?? null;

  // Kiểm tra ở đây chứ không chỉ ở giao diện: gửi thẳng request vẫn phải bị chặn.
  if (total !== null && total !== undefined) {
    if (!Number.isInteger(total) || total <= 0) throw badRequest('Tổng điểm phải là số nguyên lớn hơn 0.');
  }
  if (score !== null && score !== undefined) {
    if (!Number.isInteger(score) || score < 0) throw badRequest('Điểm đạt phải là số nguyên không âm.');
    if (total === null || total === undefined) throw badRequest('Nhập điểm đạt thì phải nhập cả tổng điểm.');
    if (score > total) throw loi(400, 'Điểm đạt ({score}) không thể lớn hơn tổng điểm ({total}).', { score, total });
  }

  /*
   * RB-5 — cùng luật với Fast Track: đổi (hay xoá) một điểm đã có thì phải ghi lý do. Điểm lớp thường là cặp
   * "số câu đúng / tổng số câu" — đổi tổng là đổi tỉ lệ đạt, nên cũng tính là sửa. Lưu lại đúng cặp cũ thì không.
   */
  /* T7 + T22 (PR-MTa): đổi giá trị hay xoá điểm đã có → lý do tuỳ chọn. */

  /* OV-11g (rà PR #379): QL SỬA điểm đã có ở lớp đã kết thúc phải ghi lý do (RB-5) — nhập lần đầu (Final về muộn, Q30-4) không phải sửa. */
  if (lopKetThuc && (existing?.raw_score ?? null) !== null && !String(patch.lyDo ?? '').trim()) throw badRequest('Lớp đã kết thúc — ghi lý do sửa điểm.');
  /* PR-Pb2-b (Q13): cùng luật FT — ngày nghiệp vụ lần đầu ô có điểm, sửa sau giữ nguyên, xoá điểm về NULL. */
  const nhapDau = (score ?? null) !== null ? existing?.nhap_dau_ngay ?? today : null;
  return tx(() => {
    /* LUAT-34 (T20, T20b): huỷ điểm → cất ("Khôi phục điểm" một bấm); ô trống nhập điểm mới → bản cất cũ hết hiệu lực. Nhận xét môn lưu riêng — giữ. */
    const coCu = (existing?.raw_score ?? null) !== null;
    if (coCu && (score ?? null) === null) catDiemO(conn, { attemptId, row: existing, actor: p.userId, lyDo: patch.lyDo ? String(patch.lyDo).trim() : null });
    else if (!coCu && (score ?? null) !== null) dongBanCat(conn, attemptId, skill, 'Đã nhập điểm mới');
    if (existing) {
      conn
        .prepare(
          `UPDATE assessment_scores SET raw_score=?, raw_total=?, entered_by=?, entered_at=?, note=?, nhap_dau_ngay=?
            WHERE id=?`,
        )
        .run(score ?? null, total ?? null, p.userId, nowIso(),
             patch.note !== undefined ? patch.note : existing.note ?? null, nhapDau, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at, note, nhap_dau_ngay)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, score ?? null, total ?? null, p.userId, nowIso(), patch.note ?? null, nhapDau);
    }
    const after = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill);
    const afterGhi = (patch.lyDo || hoanTat.hoanTat)
      ? {
          ...(after as any),
          ...(patch.lyDo ? { lyDo: String(patch.lyDo).trim() } : {}),
          ...(hoanTat.hoanTat ? { sauHoanTat: true } : {}),
        }
      : after;
    writeAudit({ actorUserId: p.userId, action: path === 'override' ? 'regular.score.override' : 'regular.score',
      entityType: 'assessment_score',
      entityId: (after as any).id, entityLabel: `${prog.code} · ${skill}`, before,
      after: afterGhi });

    capNhatConOCho([attemptId]);   // TD7b: nhập / sửa / xoá điểm số câu đúng đổi ô chờ
    refreshRegularOutcome(p, attemptId);
    return { score: after, result: regularResultOf(attemptId) };
  });
}

/**
 * C08 — LỚP THƯỜNG GHI DẤU "-": em không làm bài của tuần này, môn đó TỰ DỜI SANG TUẦN SAU.
 *
 * Khác hẳn dấu "-" của Fast Track (rule book §17.1): ở FT dấu "-" là một lời khai còn sửa được đến hết Chủ nhật, rồi
 * mới chốt thành "không dự thi". Lớp thường không có khái niệm huỷ nghĩa vụ Test — bốn môn vẫn phải đủ — nên dấu "-"
 * ở đây chỉ có đúng một hệ quả: DỜI LỊCH. Vì thế nó dời ngay, và gỡ dấu là trả lịch về chỗ cũ.
 *
 * KHÔNG dựng đường dời lịch thứ hai: dùng `setSkillWeek` như mọi lần đổi tuần khác, nên các luật chống chồng đợt,
 * nhật ký lịch và tuần hoàn tất đều tự áp. Bộ đếm `absence_move_count` (đếm những lần em VẮNG ở Fast Track) không
 * được đụng tới.
 *
 * GHI DẤU VÀ DỜI LỊCH LÀ MỘT GIAO DỊCH: `setSkillWeek` chặn (vượt đợt kế tiếp, đang có đề nghị dời chờ duyệt…) thì
 * dòng dấu vừa ghi cũng cuộn lại theo — không bao giờ còn một dấu "-" mà lịch không dời.
 *
 * DỜI NHIỀU LẦN (Q4): em lại không làm bài ở tuần vừa dời tới thì ghi "-" lần nữa — môn dời tiếp, mỗi lần một dòng nhật
 * ký, không chặn. Dòng điểm chỉ giữ tuần của LẦN GHI GẦN NHẤT, nên gỡ dấu chỉ lùi về đúng tuần vừa dời khỏi. `today`
 * dùng đúng chỗ đó: tuần mới CHƯA TỚI thì ghi lại là vô hại (em chưa có dịp vắng tuần ấy); dời sang tuần sau thì vẫn tính
 * từ TUẦN THI của môn, không từ hôm nay.
 *
 * OV-11a (Q1 14/10) · N38 mục 3 (`luatVangThuong`): dời sang TUẦN NGAY SAU TUẦN THI (như Mock); tuần thi cách tuần hiện tại ≥ 2 tuần →
 * Không dự thi (`no_show_cu`: không dời, không tính lần vắng, hết nợ). Vắng bao nhiêu lần cũng không huỷ. Gỡ "-" trả như cũ.
 */
export function reportRegularNoShow(
  p: Principal, attemptId: number, skill: string, bat: boolean, today: string = demoToday(),
  /** K4-32 (PR-XLMT): "Báo vắng" từ menu ⋯ ô lưới — có lý do (ghi vào nhật ký lịch). Gõ "-" trong ô thì không có. */
  lyDo?: string,
): { moved: boolean; tuanCu: string | null; tuanMoi: string | null; result: RegularResult; giuLich?: boolean; khongDuThi?: boolean } {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt đánh giá');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không ghi dấu "-" được.');

  const prog = a.class_id ? programmeOfClass(a.class_id) : null;
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lượt này không thuộc lớp thường.');
  if (!boMonCuaLuot(conn, attemptId).includes(skill)) throw loi(400, 'Lớp {name} không có kỹ năng {x}.', { name: prog.name, x: tenMon(prog.code, skill) });
  chanVangLopKetThuc(a.class_id);

  /*
   * Ghi dấu là việc của NGƯỜI CHẤM môn đó (hoặc người nhập bù) — cùng cửa với nhập điểm.
   * R11: đợt đã hoàn tất thì chỉ người có `PLAN_WEEK`/`SCORE_OVERRIDE` — trên thực tế môn đang ghi "-" chưa có
   * điểm nên đợt hiếm khi đã hoàn tất, nhưng vẫn kiểm để không có đường vòng qua dấu "-".
   */
  /* PR-BV: GỠ dấu = hết vắng — quyền chung với Mock (`duocGoDau`: QL, GV chấm môn, GVCN — mọi lúc từ OV-13h). */
  const dauCu = bat ? null : conn.prepare(
    `SELECT rp.week_start, s.no_show_cu FROM assessment_scores s JOIN report_periods rp ON rp.id = s.no_show_period_id WHERE s.attempt_id = ? AND s.skill = ?`,
  ).get(attemptId, skill) as any;
  let path = scoreEditPath(p, a.class_id, skill);
  /* OV-11a: gỡ "Không dự thi" như FT (`no_show_cu`) — người nhập được môn đó, không theo khung gỡ vắng. LUAT-34: "Đủ điểm" không còn khoá. */
  if (dauCu && !dauCu.no_show_cu) {
    const loi = duocGoDau(p, { classId: a.class_id, skill, today });
    if (loi) throw forbidden(loi);
  } else if (!path && !(lyDo !== undefined && bat && canRequest(p, a))) {   // K4-32: Báo vắng — thêm GVCN của lớp / Quản lý
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ ghi được dấu "-" cho kỹ năng mình được phân công.');
  }

  return tx(() => {
    const row = ensureSkillRows(attemptId).find((r) => r.skill === skill);
    if (!row) throw loi(400, 'Bài này chưa có dòng lịch cho {skill}.', { skill });
    if (!row.required) throw loi(400, 'Kỹ năng {x} không nằm trong phạm vi yêu cầu của bài này.', { x: tenMon(null, skill) });

    const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as any;
    /*
     * Ô ĐÃ CÓ ĐIỂM thì không ghi dấu "-" được (ghi là xoá điểm bằng cửa sau). GỠ thì được (PR-BV, rủi ro 1): chỉ hết vắng — bài đã làm ở
     * tuần mới giữ nguyên tuần đó (`giuLich`), không kéo về tuần cũ.
     */
    const coDiem = !!existing && existing.raw_score !== null && existing.raw_score !== undefined;
    if (bat && coDiem) {
      throw badRequest('Ô này đã có điểm — dấu "-" không xoá được điểm. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.');
    }
    const tuanCua = (id: number | null) =>
      (id ? (conn.prepare('SELECT code, week_start FROM report_periods WHERE id = ?').get(id) as any) : null);

    if (bat) {
      if (!row.planned_period_id || !row.week_start) {
        throw loi(400, '{skill} chưa có tuần Test nên chưa ghi dấu "-" được.', { skill });
      }
      /*
       * Đã ghi dấu và đã dời rồi: tuần mới CHƯA TỚI thì gọi lại là vô hại, không dời lần hai. Tuần mới ĐÃ TỚI thì đây là
       * một lần vắng MỚI của chính tuần đó (Q4) — đi tiếp xuống dưới: dấu chuyển sang tuần hiện tại, môn dời tiếp.
       */
      if (existing?.no_show_period_id && existing.no_show_period_id !== row.planned_period_id
        && String(row.week_start) > today) {
        const tc = tuanCua(existing.no_show_period_id);
        return { moved: false, tuanCu: tc ? tuanLich(tc.week_start, today) : null,
          tuanMoi: tuanLich(row.week_start, today), result: regularResultOf(attemptId) };
      }
      /*
       * Lần ghi ĐẦU cũng cần tuần thi của môn đã tới (phán quyết controller, cùng điều kiện với lần hai): chưa tới tuần
       * thi thì em chưa có dịp vắng — ghi "-" lúc đó là dời lịch trước, việc của đổi lịch. Báo tuần bằng `tuanLich`
       * (không có năm nếu cùng năm), không hiện ngày ISO.
       */
      if (String(row.week_start) > today) {
        throw loi(400, 'Chưa tới tuần Test {x} — chưa ghi "-" được.', { x: tuanLich(row.week_start, today) });
      }
      const cu = { id: row.planned_period_id, code: row.period_code, weekStart: row.week_start };
      const luat = luatVangThuong(cu.weekStart, today);
      if (luat.khongDuThi) {
        const kq = () => ({ moved: false, khongDuThi: true, tuanCu: tuanLich(cu.weekStart, today), tuanMoi: null, result: regularResultOf(attemptId) });
        if (existing?.no_show_cu && existing.no_show_period_id === cu.id) return kq();   // ghi lại cùng tuần: vô hại
        const now = nowIso();
        if (existing) {
          conn.prepare(
            `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 1, no_show_settled_at = ?, no_show_cu = 1 WHERE id = ?`,
          ).run(cu.id, p.userId, now, now, existing.id);
        } else {
          conn.prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late, no_show_settled_at, no_show_cu)
             VALUES (?,?,?,?,?,1,?,1)`,
          ).run(attemptId, skill, cu.id, p.userId, now, now);
        }
        writeAudit({
          actorUserId: p.userId, action: 'regular.no_show', entityType: 'assessment_attempt', entityId: attemptId,
          entityLabel: skill, before: { week: cu.code }, after: { week: cu.code, noShow: true, khongDuThi: true, ...(lyDo?.trim() ? { lyDo: lyDo.trim() } : {}) },
        });
        return kq();
      }
      const moi = ensurePeriod(luat.tuanMoi);
      /*
       * Kiểm T15 TRƯỚC khi ghi gì (đọc thuần, không đụng DB) — dấu "-" tự dời sang tuần sau, nhưng tuần đó có
       * thể trùng/vượt một đợt khác (vd Cuối khoá cùng lộ trình). Giữ NGUYÊN câu chặn gốc của `checkSkillWeekMove`
       * (test PR-Rc1 C08 còn kiểm đúng chữ "vượt qua đợt kế tiếp") — chỉ nối thêm một câu chỉ đường: GV không
       * sửa được lịch ở đây, chỉ Quản lý mới xếp lại được, và chỗ xếp lại là Kế hoạch Test.
       */
      /* PR-LTGON (luật 7): Giữa khoá dời tới đúng tuần Final của em → hoà vào tuần Final (lưu, không chặn). Trùng/vượt chỗ khác vẫn theo luật cũ. */
      const final = a.kind === 'progress' ? conn.prepare(
        `SELECT x.id, MIN(pr.week_start) AS tuan FROM assessment_attempts x JOIN attempt_skills k ON k.attempt_id = x.id AND k.required = 1 AND k.sit_status != 'cancelled'
           JOIN report_periods pr ON pr.id = k.planned_period_id WHERE x.cycle_id = ? AND x.kind = 'final' AND x.status != 'cancelled'`,
      ).get(a.cycle_id) as any : null;
      const hoaVaoFinal = final?.id && final.tuan === moi.weekStart ? final.id as number : undefined;
      const check = checkSkillWeekMove({ attemptId, skill: skill as AssessedSkill, newWeekStart: moi.weekStart, boQua: hoaVaoFinal ? [hoaVaoFinal] : undefined });
      if (check.blockers.length) {
        throw loi(400, '{x} Nhờ Quản lý dời lịch ở Kế hoạch Test.', { x: check.blockers.join(' ') });
      }
      if (existing) {
        conn.prepare(
          `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0 WHERE id = ?`,
        ).run(cu.id, p.userId, nowIso(), existing.id);
      } else {
        /* Cố ý KHÔNG ghi entered_by: người báo "không có bài" chưa nhập điểm nào. */
        conn.prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late)
           VALUES (?,?,?,?,?,0)`,
        ).run(attemptId, skill, cu.id, p.userId, nowIso());
      }
      /* Dời bằng ĐÚNG hàm dời lịch chung — `force` chỉ vượt được cảnh báo, không bao giờ vượt được chặn. */
      setSkillWeek(p, attemptId, skill, moi.id, {
        reason: lyDo !== undefined ? (lyDo.trim() ? `Báo vắng: ${lyDo.trim()}` : 'Báo vắng') : `Báo "-": em không làm bài tuần ${tuanLich(cu.weekStart, today)} — môn này dời sang tuần sau (C08).`,
        force: true, today, ghiBuDau: true, hoaVaoFinal,
      });
      writeAudit({
        actorUserId: p.userId, action: 'regular.no_show', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: skill, before: { week: cu.code }, after: { week: moi.code, noShow: true },
      });
      /* PR-LT2a (K4-23): vắng cùng môn, cùng bài từ LẦN 2 trở đi → thông báo GVCN (lần 1 thì không). Dedup theo lần.
       * PR-BV: lần vắng = số lần ghi "-" trừ số lần gỡ — gỡ "-" (= hết vắng) không để lần vắng thật sau đó thành "lần 2" oan. */
      const lan = (conn.prepare(
        `SELECT COUNT(CASE WHEN action = 'regular.no_show' THEN 1 END) - COUNT(CASE WHEN action = 'regular.no_show_cleared' THEN 1 END) n
           FROM audit_logs WHERE action IN ('regular.no_show', 'regular.no_show_cleared') AND entity_type = 'assessment_attempt' AND entity_id = ? AND entity_label = ?`,
      ).get(attemptId, skill) as any).n as number;
      if (lan >= 2 && a.class_id) {
        const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(a.student_id) as any;
        for (const g of conn.prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`).all(a.class_id) as any[]) {
          notify({
            userId: g.user_id, kind: 'sos', entityType: 'assessment_attempt', entityId: attemptId, dedupKey: `vang-thuong:${attemptId}:${skill}:${lan}`,
            title: `${hv?.full_name ?? 'Học viên'} vắng ${tenMonNgan(prog.code, skill)} ${ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? 'bài kiểm tra'} lần ${lan} — đã dời sang ${tuanLich(moi.weekStart, today)}`,
            body: 'Vắng từ lần hai trở đi — GVCN xem có cần trao đổi với em / phụ huynh.',
          });
        }
      }
      /* PR-LT2b (K4-23 vế 2): Cuối khoá dời quá tuần cuối khoá của lớp → thẻ Báo QL cho Quản lý (Giữa khoá không có thẻ). */
      if (a.kind === 'final' && a.class_id) {
        const cuoi = classProgress(a.class_id).finalWeekStart;
        if (cuoi && moi.weekStart > cuoi) baoLenCuoiKhoaDoiQuaHan(conn, a);
      }
      /* Rà UXF-b P2 (B5 sót): tuần trả về là CHỮ trên màn (toast) — mã tuần theo `tuanLich`, không phải khoá dữ liệu có năm. */
      return { moved: true, tuanCu: tuanLich(cu.weekStart, today), tuanMoi: tuanLich(moi.weekStart, today), result: regularResultOf(attemptId) };
    }

    /* Gỡ dấu: trả môn về đúng tuần đã lưu trong chính dòng điểm. */
    if (!existing?.no_show_period_id) {
      return { moved: false, tuanCu: null, tuanMoi: row.week_start ? tuanLich(row.week_start, today) : null, result: regularResultOf(attemptId) };
    }
    const ve = tuanCua(existing.no_show_period_id);
    /* OV-11a: gỡ "Không dự thi" (dấu ở chính tuần đang xếp) không dời gì — `moved` false, web không ghi "về W…". */
    const doi = !coDiem && existing.no_show_period_id !== row.planned_period_id;
    if (doi) {
      setSkillWeek(p, attemptId, skill, existing.no_show_period_id, {
        reason: 'Gỡ dấu "-": trả lịch về tuần cũ.', force: true, today, ghiBuDau: true,
      });
    }
    conn.prepare(
      `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL, no_show_late = 0, no_show_settled_at = NULL,
              no_show_cu = 0 WHERE id = ?`,
    ).run(existing.id);
    writeAudit({
      actorUserId: p.userId, action: 'regular.no_show_cleared', entityType: 'assessment_attempt', entityId: attemptId,
      entityLabel: skill, before: { week: row.period_code }, after: { week: coDiem ? row.period_code : ve?.code ?? null, noShow: false, giuLich: coDiem },
    });
    const tuanCu = row.week_start ? tuanLich(row.week_start, today) : null;
    return { moved: doi, tuanCu, tuanMoi: doi && ve ? tuanLich(ve.week_start, today) : tuanCu, result: regularResultOf(attemptId), giuLich: coDiem };
  });
}

/**
 * Tính lại kết luận sau khi nhập điểm và mở/cập nhật Case SOS.
 *
 * Dùng CHUNG bảng `sos_cases` với lớp FT — cùng một hệ thống theo dõi xử lý, chỉ khác cách
 * sinh ra mức SOS. Sửa điểm làm đổi mức thì GIỮ Case và lịch sử, không xoá đi làm lại.
 */
export function refreshRegularOutcome(p: Principal, attemptId: number) {
  const conn = db();
  lamMoiDiemBanChup(conn, [attemptId]);   // PR-TK (TK-5): lộ trình đã đóng → bản chụp theo điểm mới
  const r = regularResultOf(attemptId);
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;

  // "Đã xong" vẫn cần ĐỦ điểm mọi kỹ năng — đó là trạng thái của bài, không phải kết luận.
  /* PR-BV: hai chiều như FT (`refreshOutcome`) — xoá một môn của bài đã xong thì bài về "chưa xong". */
  const next = r.complete ? 'done' : 'planned';
  if (a.status !== 'cancelled' && a.status !== next) {
    conn.prepare('UPDATE assessment_attempts SET status = ?, updated_at = ? WHERE id = ?').run(next, nowIso(), attemptId);
  }
  /*
   * OV-11g (Q4, rà #379): lớp đã kết thúc — sửa điểm không tự tạo / rút Case, tín hiệu, Báo PH ở lớp đã đóng. GIỮ hệ quả Final ở lộ trình MỚI
   * bên dưới (Q30-4: lớp tự đóng khi cả lớp đã chuyển, điểm Final về muộn vẫn sinh bổ trợ / Mini Test ở lớp đích).
   */
  const ketThuc = laLopKetThuc(a.class_id);
  if (!ketThuc) {
    /*
     * RB-8: môn vừa được sửa thành ĐẠT → rút tín hiệu và xử lý Case dựng trên con số sai — CÙNG hàm với Fast Track. Đặt TRƯỚC lối thoát
     * `sosLevel === null`: sửa một môn lên đạt khi ba môn kia chưa có điểm thì chưa kết luận được mức, nhưng căn cứ của tín hiệu đã mất.
     */
    reconcileCorrectedSignals(p, {
      attemptId, passingSkills: r.skills.filter((x) => x.outcome === 'pass').map((x) => x.skill), passText: 'đạt',
      /* PR-S4F #3: môn nay TRỐNG (xoá điểm có lý do) — tín hiệu dựng trên điểm đó hết căn cứ, như nhánh FT (`reconcileCorrectedScores`). */
      clearedSkills: r.skills.filter((x) => x.outcome === 'missing').map((x) => x.skill),
    });
    /*
     * PR-LT2a (K5-01, Q11): CUỐI KHOÁ KHÔNG SINH tín hiệu hay Case mới — kết luận Cuối khoá (% hướng) là việc của PR-LT2b. Pre FOU không có Giữa khoá (PF2).
     * GIỮA KHOÁ: môn trượt TỰ TẠO Case + PA Bổ trợ (N1) — không tín hiệu "Tạo Case / Bỏ qua", không nhãn SOS (T58).
     * Case Giữa khoá còn mở mà môn đó ĐẠT ở lượt sau (Cuối khoá) thì vẫn ghi mốc "Đã đạt" (giữ phép kiểm S4F); không đổi mức, không mở Case.
     */
    // Case mở ngay khi kết luận được, không chờ đủ điểm.
    if (r.sosLevel !== null) taoCaseGiuaKhoa(p, a, r);
    /* OV-6b2: Checkpoint đủ điểm → em có Checkpoint kế tiếp (chưa đạt chỉ chip SOS — `taoCaseGiuaKhoa` chỉ nhận Giữa khoá FOU/BE/ELE). */
    if (a.kind === 'checkpoint' && r.complete && a.class_id) sinhCheckpointKeTiep([a.class_id], demoToday(), p.userId, [a.cycle_id]);
    if (a.kind === 'progress') dongBoBaoPh(a, monBaoPh(a.id, r.skills.filter((x) => x.outcome === 'fail').map((x) => x.skill)));   // PR-UXF-b (R5-4): theo Case, bỏ môn "Không cần theo dõi"
  }
  /*
   * PR-LT2b (Q30-4): Cuối khoá ĐỦ điểm mà em đã chuyển đi → luật Cuối khoá áp ở lộ trình mới. Không sinh tín hiệu / Case ở lớp cũ (T70).
   * PR-CT2 (§8): em CÒN học lớp đó → đồng bộ bổ trợ Final theo điểm + quyết định đang chờ (sinh sớm / huỷ phần chưa ai đụng).
   */
  if (a.kind === 'final' && a.class_id) {
    if (r.complete || conn.prepare('SELECT 1 FROM mini_test WHERE tu_attempt_id = ?').get(a.id)) dongBoCheTaiFinal(p, a.class_id, [a.student_id]);
    if (r.complete) capNhatCuoiKhoaSauChuyen(p, a);
  }
  return r;
}

/**
 * GIỮA KHOÁ LỚP THƯỜNG → CASE TỰ TẠO + PA BỔ TRỢ (PR-LT2a N1, M-03, Q-F). Chạy lặp được: tín hiệu đã nối vào một Case (kể cả Case nay đã đóng vì
 * "Không cần theo dõi") thì KHÔNG tạo lại; Case đang mở cùng môn thì thêm mốc "Trượt lại" + nối tín hiệu. Tín hiệu luôn `silent` — chỉ là dây nối
 * S08 (sửa điểm lên đạt thì rút Case chưa ai làm) và Không cần theo dõi. OV-12c (chủ SP 14/10, bỏ T58 ở Case): `sos_level` của Case = mức SOS
 * theo số môn trượt của lượt (1 → SOS 1, 2 → SOS 2, ≥ 3 → SOS 3, `r.sosLevel`) — điểm nhập dần thì Case của lượt đi theo mức mới nhất. Em KCK: NULL.
 */
function taoCaseGiuaKhoa(p: Principal, a: any, r: RegularResult) {
  const conn = db();
  const failing = r.skills.filter((x) => x.outcome === 'fail').map((x) => x.skill);
  /* PR-S4F #3: chỉ môn CÓ ĐIỂM ĐẠT ở lượt này mới là "đã đạt" — môn trống / không thuộc lượt này không nói gì về Case. */
  const passingCats = new Set(r.skills.filter((x) => x.outcome === 'pass').map((x) => categoryOf(x.skill)).filter(Boolean) as string[]);
  /* Mục 9.4: Case có căn cứ từ CHÍNH lượt này → đạt ở đây là SỬA ĐIỂM, không phải tiến bộ — không ghi mốc "đã đạt". */
  const coCanCuLuotNay = conn.prepare(
    `SELECT 1 FROM case_signals WHERE case_id = ? AND attempt_id = ?
     UNION ALL SELECT 1 FROM case_milestones WHERE case_id = ? AND attempt_id = ? AND kind != 'passed' LIMIT 1`,
  );
  /* TÌM CASE THEO HỌC VIÊN, KHÔNG THEO LƯỢT THI (Case sống suốt khoá — `attempt_id` chỉ trỏ lượt mới nhất chạm vào nó). */
  const open = conn.prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND status != 'done'`)
    .all(a.student_id, a.cycle_id ?? 0) as any[];
  // Ngày phát hiện = thứ Hai của TUẦN bài kiểm tra; không còn ngày làm bài riêng.
  const detectedAt = weekStartOf(a) ?? demoToday();
  /* PR-DEPLOY (0b-3 · R5-5): Case MỞ Ở CHƯƠNG TRÌNH KHÁC (FOU "G+V" của em đã lên BE) không phải của bài này — không ghi mốc "đã đạt", không nối lần trượt. */
  const ctBai = chuongTrinhCuaLop(a.class_id);
  const cuaBaiNay = (c: any) => !caseKhacChuongTrinh(c, ctBai);
  for (const c of open) {
    const cat = c.category ?? categoryOf(c.topic);
    if (!cat || !passingCats.has(cat) || !cuaBaiNay(c) || coCanCuLuotNay.get(c.id, a.id, c.id, a.id)) continue;
    addMilestone({
      caseId: c.id, kind: 'passed', attemptId: a.id, attemptNo: a.attempt_no, sosLevel: null,
      occurredOn: detectedAt, createdBy: p.userId, dedupKey: `mt:${a.id}:${c.id}:passed`,
    });
  }
  /* Chỉ bài GIỮA KHOÁ của lớp có Giữa khoá (FOU · BE · ELE — Pre FOU không có, PF2) mới tự tạo Case / ghi mốc "Trượt lại". */
  if (a.kind !== 'progress' || !boTroGiuaKhoa(a.class_id ? programmeOfClass(a.class_id)?.code : null)) return;
  if (r.sosLevel === 0 || !failing.length) return;
  const muc = kckCuaLuot(a) ? null : r.sosLevel;   // OV-12c: nhãn SOS theo số môn trượt

  for (const skill of failing) {
    const category = categoryOf(skill);
    if (!category) continue;
    const existing = open.find((c: any) => (c.category ?? categoryOf(c.topic)) === category && cuaBaiNay(c)) ?? null;
    const signal = raiseSignal({
      actorUserId: p.userId, studentId: a.student_id, cycleId: a.cycle_id ?? null, attemptId: a.id, classId: a.class_id ?? null,
      skill, category, sosLevel: null, detectedOn: detectedAt, silent: true,
    });
    if (tinHieuDaCoCase(signal) && signal.case_id == null) continue;   // VIEC-SAU-LOGIC: Case của lượt + môn này đã bị xoá — không sinh lại / không nối
    if (existing) {
      if (signal.status === 'linked' && signal.case_id === existing.id) continue;   // chạy lặp: lượt này đã ghi vào Case
      addMilestone({
        caseId: existing.id, kind: 'repeat', attemptId: a.id, attemptNo: a.attempt_no, sosLevel: muc,
        occurredOn: detectedAt, createdBy: p.userId,
        note: r.skills.find((x) => x.skill === skill)?.label ?? tenMon(null, skill),   // tên môn theo chương trình (FOU G+V)
        dedupKey: `mt:${a.id}:${existing.id}:repeat`,
      });
      conn.prepare('UPDATE sos_cases SET attempt_id = ?, follow_until = COALESCE(?, follow_until), updated_at = ? WHERE id = ?')
        .run(a.id, followUntilAfter(a), nowIso(), existing.id);
      if (signal.status === 'pending') {
        conn.prepare(`UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?, resolution_note = ?, updated_at = ? WHERE id = ?`)
          .run(existing.id, p.userId, nowIso(), 'Nối vào Case đang mở của môn này — cùng một vấn đề, thêm một bằng chứng.', nowIso(), signal.id);
      }
    } else if (!tinHieuDaCoCase(signal)) {
      open.push(taoCaseTuDong(p, {
        attempt: a, category, skill, sosLevel: muc, detectedAt, band: null, expectation: null, signalId: signal.id, pa: 'bo_tro',
        kck: kckCuaLuot(a),   // OV-9: em KCK — Case nhẹ, không PA Bổ trợ, không hạn
      }));
    }
  }
  /* OV-12c: mọi Case đang theo lượt này mang mức SOS mới nhất của lượt (môn nhập sau trượt thêm → SOS tăng). */
  conn.prepare(`UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE attempt_id = ? AND status != 'done' AND kck = 0 AND sos_level IS NOT ?`)
    .run(muc, nowIso(), a.id, muc);
}

// ---------------------------------------------------------------- bảng điểm lớp

/**
 * Bảng nhập điểm của một lớp thường: mỗi dòng một học viên, mỗi kỹ năng hai ô
 * (điểm đạt và tổng điểm).
 *
 * Cho phép đặt TỔNG SỐ CÂU CHUNG cho cả lớp rồi sửa lại ở dòng có đề khác — cả lớp thường
 * làm cùng một đề, gõ lại "40" bốn mươi lần là bắt làm một việc máy đã biết.
 */
export function regularSheet(p: Principal, classId: number, kind?: string, today: string = demoToday(),
  /** OV-6b2: số Checkpoint (`kind = 'checkpoint'`); hoặc gửi thẳng khoá bài `checkpoint:2` ở `kind`. */
  attemptNo?: number,
  /** HSL-MAY-CHU: chỉ MỘT lượt (`regularAttemptDetail`) — kể cả lượt đã huỷ, em đã rời lớp / ở Lưu trữ. */
  chiLuot?: number) {
  const conn = db();
  const cls = conn
    .prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được cấp quyền.');

  const progLop = programmeOfClass(classId);
  if (!progLop || progLop.scoringMode !== 'ratio') {
    throw badRequest('Lớp này không phải lớp thường. Dùng bảng điểm Mock Test.');
  }

  const params: unknown[] = [classId];
  /* PR-OV1a: MT0 chấm band — chỉ ở `chamSheet(kind: 'mt0')`, không bao giờ thành hàng của bảng tỷ lệ. */
  let where = chiLuot ? `a.class_id = ? AND a.id = ? AND a.kind != 'mt0'` : `a.class_id = ? AND a.status != 'cancelled' AND a.kind != 'mt0'`;
  if (chiLuot) params.push(chiLuot);
  const cp = /^checkpoint:(\d+)$/.exec(kind ?? '');
  if (cp) { kind = 'checkpoint'; attemptNo = Number(cp[1]); }
  if (kind) { where += ' AND a.kind = ?'; params.push(kind); }
  if (kind === 'checkpoint' && attemptNo) { where += ' AND a.attempt_no = ?'; params.push(attemptNo); }

  const attempts = conn
    .prepare(
      `SELECT a.*, s.full_name, s.student_code, s.email AS student_email, s.status AS student_status,
              rp.code AS period_code, rp.week_start
         FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where}${chiLuot ? '' : cls.status === 'finished' ? ` AND (s.archived_at IS NULL OR s.status = 'inactive')` : ` AND ${LUOT_HIEN_TAI_SQL('a', 's', true)}`}   -- lỗi chủ SP 28/10: lớp đang học chỉ lượt hiện tại (em Tạm dừng giữ như P7); lớp đã kết thúc giữ như cũ
        ORDER BY a.kind DESC, s.full_name`,
    )
    .all(...params) as any[];

  const byAttempt = new Map<number, any[]>();
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (const row of conn
      .prepare(
        `SELECT sc.*, u.full_name AS entered_by_name FROM assessment_scores sc
           LEFT JOIN users u ON u.id = sc.entered_by
          WHERE sc.attempt_id IN (${ids.map(() => '?').join(',')})`,
      )
      .all(...ids) as any[]) {
      if (!byAttempt.has(row.attempt_id)) byAttempt.set(row.attempt_id, []);
      byAttempt.get(row.attempt_id)!.push(row);
    }
  }
  /* P13 KET-PET: bộ môn theo lượt (`boMonTheoLuot`) — lượt đã ghi môn gộp cũ giữ L+S / R+W; cột bảng = các môn của những dòng đang xem. */
  const lichGop = lichGopCua(attempts.map((a) => a.id));
  const monDong = (id: number): readonly string[] => boMonTheoLuot(progLop.skills, daGhiLuot(lichGop.get(id), byAttempt.get(id)));
  const prog = { ...progLop, skills: attempts.length ? [...new Set(attempts.flatMap((a) => monDong(a.id)))] : progLop.skills };

  /*
   * CASE CỦA MỘT DÒNG TÌM THEO HỌC VIÊN + KHOÁ + HẠNG MỤC, KHÔNG THEO `attempt_id`.
   *
   * `sos_cases.attempt_id` luôn trỏ tới LƯỢT MỚI NHẤT đã chạm vào Case (xem `refreshRegularOutcome`). Tìm theo cột đó
   * thì bài Giữa khoá mất sạch trạng thái Case ngay khi bài Cuối khoá được chấm — đúng lỗi đã ghi ở đặc tả §6. Case
   * sống suốt khoá và gắn với một HẠNG MỤC (môn), nên câu hỏi đúng là "môn này của em có Case nào đang mở không".
   */
  const studentIds = [...new Set(attempts.map((a) => a.student_id as number))];
  const caseRows = studentIds.length
    ? (conn
        .prepare(`SELECT * FROM sos_cases WHERE student_id IN (${studentIds.map(() => '?').join(',')})`)
        .all(...studentIds) as any[])
    : [];
  const casesOf = (studentId: number, cycleId: number | null, failing: string[]) => {
    /* Hạng mục → môn trượt của chính dòng này; lớp thường thì hai tên trùng nhau (L · R · W · S). */
    const skillOfCat = new Map<string, string>();
    for (const k of failing) {
      const cat = categoryOf(k);
      if (cat && !skillOfCat.has(cat)) skillOfCat.set(cat, k);
    }
    return caseRows
      .filter((c) => c.student_id === studentId
        && (c.cycle_id ?? 0) === (cycleId ?? 0)
        && skillOfCat.has(c.category ?? categoryOf(c.topic) ?? ''))
      /*
       * THỨ TỰ = LUẬT CASE ĐẠI DIỆN của hạng mục (mục 4.3, `skillSupportBoard` ở cases/cases.ts: `mine.find(c => c.status
       * !== 'done') ?? mine[0]`): đang mở trước, mới nhất trước; không còn cái nào mở thì cái đã đóng gần nhất. "Mới nhất"
       * ở đây theo id (bảng này không đọc lịch sử xử lý từng Case). Xếp theo id tăng dần thì `cases[0]` là Case CŨ NHẤT —
       * một Case nhập bù đã đóng sẽ che mất Case đang mở cùng môn.
       */
      .sort((x, y) => Number(x.status === 'done') - Number(y.status === 'done') || y.id - x.id)
      .map((c) => {
        const category = (c.category ?? categoryOf(c.topic)) as string;
        return {
          id: c.id as number, status: c.status as string, level: (c.sos_level ?? null) as number | null,
          skill: skillOfCat.get(category)!, category,
        };
      });
  };

  /* R11: một câu hỏi cho cả bảng (`dotHoanTatMany`) — không hỏi lẻ từng dòng. */
  const hoanTatOf = dotHoanTatMany(attempts.map((a) => a.id), today);
  const suaSauHoanTat = quyenSuaSauHoanTat(p, classId);
  /* OV-11g (HL-10, Q4): lớp đã kết thúc — mọi bài như đã hoàn tất: Quản lý sửa qua hộp lý do, GV chỉ đọc (cùng `kiemLopKetThuc`). */
  const ketThuc = cls.status === 'finished';
  const diemHuy = diemHuyMo();   // LUAT-34: một câu cho cả bảng
  const editable = editableSkills(p, classId, prog.skills);   // OV-13h: lớp kết thúc — cờ từng ô quyết
  /* Quyền sửa ô tính MỘT lần cho mỗi môn — cùng cửa với `saveRegularScore`, không hỏi lại theo từng dòng. */
  const nhapSkill = new Map(prog.skills.map((k) => [k, scoreEditPath(p, classId, k) !== null]));
  const canEditSkill = new Map(prog.skills.map((k) => [k, ketThuc ? suaSauHoanTat : nhapSkill.get(k)!]));
  /* CV-LOI (V4B H15): đổi lịch môn (Xếp lại bài vắng) — cùng luật `setSkillWeek`: dời tay chỉ Quản lý (RA-LUONG-2, R14) → tính một lần mỗi môn. */
  const doiLichMon = new Map(prog.skills.map((k) => [k, !!attempts[0] && can(p, PERMISSIONS.PLAN_WEEK, { classId, studentId: attempts[0].student_id })]));
  /* Lịch và hạn chấm RIÊNG từng môn — một bài có thể trải hai ba tuần (mục 10.1). */
  const skillRows = loadSkillRows(attempts.map((a) => a.id));
  /* Mã tuần mà dấu "-" đã dời môn đi (C08) — đọc gộp một lần cho cả bảng. */
  const noShowPeriodIds = [...new Set([...byAttempt.values()].flat()
    .map((r: any) => r.no_show_period_id).filter((x: any) => x))] as number[];
  const periodCode = new Map<number, string>();
  const periodStart = new Map<number, string>();
  if (noShowPeriodIds.length) {
    for (const r of conn
      .prepare(`SELECT id, code, week_start FROM report_periods WHERE id IN (${noShowPeriodIds.map(() => '?').join(',')})`)
      .all(...noShowPeriodIds) as any[]) { periodCode.set(r.id, r.code); periodStart.set(r.id, r.week_start); }
  }

  return {
    class: { id: cls.id, code: cls.code, branchName: cls.branch_name, startDate: cls.start_date },
    programme: prog,
    /** MH2: tên môn theo chương trình — FOU `writing` = Grammar + Vocabulary / G+V, `speaking` = Pronunciation / P; Pre FOU Tổng hợp. */
    skillLabels: Object.fromEntries(prog.skills.map((k) => [k, tenMon(prog.code, k)])),
    monNgan: Object.fromEntries(prog.skills.map((k) => [k, tenMonNgan(prog.code, k)])),
    editableSkills: editable,
    canPlan: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    /** PR-XLMT (K4-32): GVCN của lớp — menu ⋯ ô lưới (Báo vắng, Xếp lại bài vắng) theo `thaoTacKyNang`. Một lần cho cả bảng. */
    laGvcn: isCoreTeacherOf(p, classId, today),
    passThreshold: nguongDatLop(classId),
    rows: attempts.map((a) => {
      const rows = byAttempt.get(a.id) ?? [];
      const mon = monDong(a.id);
      const result = evaluateRegular(mon, rows, prog.code, nguongDatLop(classId));
      const failing = result.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill);
      const dongCases = casesOf(a.student_id, a.cycle_id ?? null, failing);
      const c = dongCases[0] ?? null;
      const views = regularSkillViews({ ...a, period_start: a.week_start }, skillRows.get(a.id), rows as any, demoToday(), mon);
      /*
       * HẠN CỦA CẢ BÀI chỉ còn là hạn MUỘN NHẤT trong các môn còn phải chấm — một con số
       * để xếp thứ tự, không phải một luật riêng. Luật nằm ở từng môn, và cột "Hạn từng
       * môn" bên dưới mới là thứ giáo viên đọc.
       */
      const pending = mon
        .map((k) => ({ k, v: views.get(k) }))
        .filter((x) => {
          const row = rows.find((r: any) => r.skill === x.k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return !scored && !!x.v?.deadline;
        });
      const dl = pending.length
        ? pending.map((x) => x.v!.deadline!).sort().slice(-1)[0]
        : null;
      const ht = hoanTatOf.get(a.id) ?? { hoanTat: false, chuNhatCuoi: null };
      const huy = a.status === 'cancelled';   // HSL-MAY-CHU: chỉ có ở `chiLuot` — máy chủ không nhận ghi gì vào lượt đã huỷ
      const hoanTat = ketThuc ? { hoanTat: true, chuNhatCuoi: ht.chuNhatCuoi ?? cls.finished_at ?? null } : ht;
      return {
        attemptId: a.id,
        deadline: dl,
        deadlineSource: dl ? 'default' : 'none',
        hoanTat: hoanTat.hoanTat,
        chuNhatCuoi: hoanTat.chuNhatCuoi,
        /** Hạn chấm CỦA TỪNG MÔN, kèm tuần thi và trạng thái — mục 10.5. */
        skillSchedule: mon.map((k) => {
          const v = views.get(k)!;
          const row = rows.find((r: any) => r.skill === k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return {
            skill: k,
            label: tenMon(prog.code, k),
            periodCode: v.periodCode, weekRange: v.weekRange,
            /** Thứ Hai của tuần thi môn này — lưới viết tuần bằng `tuanLich` (G-6), không hiện mã tuần có năm. */
            weekStart: v.weekStart,
            deadline: v.deadline, progress: v.progress, sitStatus: v.sitStatus,
            overdue: !scored && v.overdue,
            /** C08: ô mang dấu "-" — môn đã tự dời khỏi tuần `movedFrom`. Dấu "-" không phải điểm 0. */
            noShow: !!row?.no_show_period_id,
            /** OV-11a (Q1): "-" ở tuần thi đã qua ≥ 2 tuần — Không dự thi, không dời, không nợ (`regularSkillViews` đã bỏ khỏi việc). */
            khongDuThi: !scored && !!row?.no_show_cu && row.no_show_period_id === v.periodId,
            /** OV-4b: nhận xét của môn (nút "Nhận xét" cạnh ô). */
            nhanXet: (row?.comment ?? null) as string | null,
            /** HSL-MAY-CHU: người nhập điểm môn này (null = chưa có điểm). */
            nguoiNhap: (scored ? row?.entered_by_name ?? null : null) as string | null,
            movedFrom: row?.no_show_period_id ? periodCode.get(row.no_show_period_id) ?? null : null,
            /** Thứ Hai của tuần `movedFrom` — để lưới viết "trả lịch về W3 SEP" bằng `tuanLich`. */
            movedFromStart: row?.no_show_period_id ? periodStart.get(row.no_show_period_id) ?? null : null,
            /** PR-BV: người xem gỡ được dấu "-" (QL, GV chấm môn, GVCN — mọi lúc từ OV-13h). */
            goDau: !huy && !!row?.no_show_period_id && duocGoDau(p, { classId, skill: k, today, duocNhap: canEditSkill.get(k) ?? false }) === null,
            /** Người đang xem có nhập được điểm / ghi được "-" ở ô này không (phân công hoặc nhập bù). */
            /* OV-13h: lớp kết thúc GV đúng môn vẫn nhập ô trống (cùng `oChuaCoDiem` với `saveRegularScore`). LUAT-34: "Đủ điểm" không khoá. */
            canEdit: !huy && (ketThuc ? suaSauHoanTat || (!!nhapSkill.get(k) && oChuaCoDiem(row)) : (canEditSkill.get(k) ?? false))
              /* T19 (PR-MTa): môn chưa tới tuần thi / chưa xếp tuần → ô khoá như máy chủ, kể cả ô đã có điểm (rà #212); ô mang dấu "-"
               * (đã dời sang tuần sau) vẫn mở để gỡ dấu. */
              && (!!row?.no_show_period_id || (!!v.weekStart && String(v.weekStart).slice(0, 10) <= mondayOf(today))),
            /* LUAT-34: chỉ lớp đã kết thúc còn khoá (Quản lý sửa qua hộp lý do); "Đủ điểm" là trạng thái ở `hoanTat` của dòng. */
            khoa: ketThuc,
            /** LUAT-34 (T20b): ô trống có điểm đã huỷ còn cất → "Khôi phục điểm". */
            diemHuy: !scored && diemHuy.has(`${a.id}:${k}`),
            /** OV-13h (rà #410): nút Nhận xét — GV đúng môn ghi được cả khi lớp đã kết thúc, cùng luật `saveRegularScore`. */
            nhanXetDuoc: !huy && (ketThuc ? suaSauHoanTat || !!nhapSkill.get(k) : (canEditSkill.get(k) ?? false)),
            /** OV-13h (rà #410): lớp đã kết thúc — ô không nhận "-" (cùng câu `chanVangLopKetThuc`); null = gõ "-" được. */
            khongVang: ketThuc ? CAU_KHONG_VANG : null,
            /** CV-LOI (V4B H15): người xem đổi được lịch môn này (Xếp lại bài vắng) — cùng luật `setSkillWeek`. */
            doiLich: !huy && (doiLichMon.get(k) ?? false),
          };
        }),
        // Quá hạn khi có ÍT NHẤT MỘT môn đã tới hạn mà chưa chấm — không xét theo cả bài.
        overdue: mon.some((k) => {
          const row = rows.find((r: any) => r.skill === k);
          const scored = row?.raw_score !== null && row?.raw_score !== undefined;
          return !scored && !!views.get(k)?.overdue;
        }),
        /** Khoá bài (`khoaBai`): Progress / Final theo loại, Checkpoint kèm số (`checkpoint:2`) — lưới gom dòng theo khoá này. */
        kind: khoaBai(a.kind, a.attempt_no),
        kindLabel: a.kind === 'checkpoint' ? nhanBai(khoaBai(a.kind, a.attempt_no)) : ATTEMPT_KIND_LABEL[a.kind as AttemptKind] ?? a.kind,
        /** OV-6b2: Checkpoint — chip "Đạt" / "SOS · L+S" (chưa đạt chỉ chip, không Case); null khi chưa đủ điểm hoặc bài khác. */
        chip: a.kind === 'checkpoint' ? chipCheckpoint(result, prog.code) : null,
        studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
        /** OV-15i2: Dán từ Excel lớp thường khớp em theo email (như FT). */
        studentEmail: (a.student_email ?? null) as string | null,
        studentStatus: a.student_status,
        periodCode: a.period_code ?? null,
        status: a.status,
        result,
        /** PR-LT2b: hướng gợi ý Cuối khoá — chỉ dòng Cuối khoá đủ điểm (null còn lại). Cùng luật `goiYCuoiKhoa` với hồ sơ HV / Excel. */
        goiY: a.kind === 'final' ? goiYCuoiKhoa({ ct: prog.code, tyLe: result.tyLeTong, monTruot: failing, nguong: result.passThreshold }) : null,
        /** Các Case gắn với những môn CHƯA ĐẠT của chính dòng này (theo học viên + khoá + hạng mục). */
        cases: dongCases,
        caseId: c?.id ?? null, caseStatus: c?.status ?? null, caseLevel: c?.level ?? null,
      };
    }),
    today: demoToday(),
  };
}

/**
 * HSL-MAY-CHU — GET /regular/attempts/:id: hồ sơ MỘT lượt lớp thường (Progress / Final / Checkpoint). `dong` = đúng một dòng của `regularSheet`
 * (cùng hàm, cùng quyền — không xem được lớp → 403) + đầu bảng (lớp, chương trình, tên môn, ngưỡng đạt), lịch sử lịch + điểm, lớp hiện tại.
 * Lượt FT / MT0 / không có → 404 (trang FT là `GET /attempts/:id`; web chọn đường theo `kind`).
 */
export function regularAttemptDetail(p: Principal, attemptId: number) {
  const a = db().prepare('SELECT id, class_id, student_id, kind, cycle_id, attempt_no FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a || !a.class_id || !['progress', 'final', 'checkpoint'].includes(a.kind)) throw loi(404, 'Không tìm thấy lượt Test lớp thường.');
  const { rows, ...bang } = regularSheet(p, a.class_id, undefined, demoToday(), undefined, attemptId);
  const history = lichSuLichCua(attemptId);
  return {
    ...bang,
    dong: rows[0],
    /** HSL-LT: lộ trình của lượt — khối Case / PA lấy thẻ từ bảng kỹ năng hồ sơ HV đúng lộ trình này. */
    cycleId: (a.cycle_id ?? null) as number | null,
    /** HSL-LT: Case mở · PA thêm của các Case của lượt — Lịch sử môn / Lịch sử lượt (như FT). */
    lichSuCase: lichSuCaseCua(rows[0].cases.map((c: { id: number }) => c.id)),
    lopHienTai: lopHienTaiCua(a.student_id, a.class_id),
    /** LUOT-TEN-GV: GV môn được phân công của lớp lúc Test, từng môn của bảng (null = chưa phân công) — cùng luật danh sách lượt. */
    nguoiLam: nguoiLamCuaLuot(a.class_id, bang.programme.skills, a.kind),
    huy: huyCua(rows[0].status, history),
    canCancel: can(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id }),
    /** LUOT-KHOI-PHUC: lượt đã huỷ — `chan` = câu lý do + bước tiếp khi không khôi phục được (cùng hàm `reopenAttempt` chặn); null = lượt chưa huỷ. */
    khoiPhuc: rows[0].status === 'cancelled' ? { chan: chanKhoiPhucThuong(a, rows[0].kindLabel) } : null,
    history,
    scoreHistory: scoreHistoryOf(attemptId),
  };
}
