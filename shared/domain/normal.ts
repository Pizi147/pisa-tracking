/** NORMAL — chương trình FOU/BE/ELE, mốc kiểm tra và cách chấm theo tỷ lệ. */

import { ASSESSED_SKILLS, ENTRY_SKILLS } from './skills.ts';

// ------------------------------------------------- Chương trình và lớp thường

/**
 * Chương trình học. FT dùng Mock Test và band IELTS; lớp thường (FOU/BE/ELE) dùng
 * bài kiểm tra chấm theo `điểm đạt / tổng điểm`, KHÔNG đi qua bảng quy đổi IELTS.
 *
 * `FOU` là mã canonical của Foundation. `FOUND` là mã đã từng dùng — chỉ ánh xạ khi
 * đọc dữ liệu cũ, KHÔNG tự đổi mã lớp lịch sử.
 */
export const PROGRAMME_CODES = ['FT', 'PREFOU', 'FOU', 'BE', 'ELE'] as const;
export type ProgrammeCode = (typeof PROGRAMME_CODES)[number];
/** PF1: chương trình không chia môn — một ô `tong_hop`, lớp chỉ có GVCN và GVCN dạy luôn (T56). */
export const CHUONG_TRINH_KHONG_CHIA_MON: readonly string[] = ['PREFOU'];
export const LEGACY_PROGRAMME_CODE: Record<string, ProgrammeCode> = { FOUND: 'FOU' };

/** Cách chấm của một chương trình. Tách khỏi chương trình để sau này thêm loại khác. */
export const SCORING_MODES = ['ielts_band', 'ratio'] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];
export const SCORING_MODE_LABEL: Record<ScoringMode, string> = {
  ielts_band: 'Band IELTS (Mock Test)',
  ratio: 'Điểm đạt / Tổng điểm',
};

/**
 * Ngưỡng đạt của cách chấm theo tỷ lệ. Xét trên tỷ lệ CHÍNH XÁC, không làm tròn % rồi mới xét.
 *
 * Gọi là "điểm đạt / tổng điểm" chứ không phải "số câu đúng / tổng số câu": Writing và
 * Speaking của lớp thường chấm theo thang điểm, không đếm câu. Một cái tên chỉ đúng với
 * Listening và Reading thì hai môn kia phải gõ vào một ô mang tên sai.
 *
 * MỘT NGƯỠNG CHO TOÀN HỆ THỐNG. Nhập điểm, kết luận đợt, tín hiệu, hồ sơ, bảng lớp, bảng
 * tuần, báo cáo, bộ demo và kiểm thử đều đọc đúng hằng số này — không nơi nào gõ lại con số.
 */
export const RATIO_PASS_THRESHOLD = 0.7;

/**
 * NGƯỠNG CŨ, giữ lại để ĐỌC ĐƯỢC LỊCH SỬ chứ không để tính.
 *
 * Owner nâng ngưỡng đạt của lớp thường từ 60% lên 70% sau PR15. Điểm gốc không bị sửa và
 * kết luận đã ghi không bị xoá, nhưng một bài 62% trước đây đọc là "đạt" thì từ nay đọc là
 * "trượt". Ai đối chiếu với biên bản cũ cần biết vì sao hai bên lệch nhau, nên căn cứ của
 * quy tắc cũ được ghi ở đây và trong nhật ký nâng cấp, thay vì chỉ lặng lẽ biến mất.
 *
 * KHÔNG dùng hằng số này để tính lại bất cứ thứ gì đang chạy: báo cáo hiện hành chỉ có
 * MỘT cách tính, là `RATIO_PASS_THRESHOLD`.
 */
export const RATIO_PASS_THRESHOLD_PREVIOUS = 0.6;

/**
 * Loại lượt đánh giá. `mock` là MT của FT; lớp thường có bài giữa và bài cuối khoá.
 * Vẫn KHÔNG dùng từ "thi" — đây là bài kiểm tra, "thi" dành cho kỳ IELTS chính thức.
 */
export const ATTEMPT_KINDS = ['mock', 'progress', 'final', 'mt0'] as const;
export type AttemptKind = (typeof ATTEMPT_KINDS)[number];
export const ATTEMPT_KIND_LABEL: Record<AttemptKind, string> = {
  mock: 'Mock Test', progress: 'Progress Test', final: 'Final Test', mt0: 'MT0',
};
export const ATTEMPT_KIND_SHORT: Record<AttemptKind, string> = {
  mock: 'MT', progress: 'Progress Test', final: 'Final Test', mt0: 'MT0',
};
/** Tên bài của lớp thường theo `kind` (không phải `final` thì là Progress Test) — một chỗ cho mọi nhãn cứng. */
/**
 * Thứ tự lượt trong MỘT lộ trình: lớp thường Progress → Final → MT0 theo LOẠI (attempt_no chỉ là thứ tự tạo — Final tự tạo khi vào lớp
 * có thể mang số nhỏ hơn Progress xếp sau); cùng hạng (Mock FT) theo attempt_no. Dùng làm hàm so sánh của `sort`.
 */
export const hangLuot = (kind: string | null | undefined): number => (kind === 'progress' ? 1 : kind === 'final' ? 2 : kind === 'mt0' ? 3 : 0);
export const soThuTuLuot = (a: { kind: string; attempt_no: number }, b: { kind: string; attempt_no: number }): number =>
  (hangLuot(a.kind) && hangLuot(b.kind) && hangLuot(a.kind) !== hangLuot(b.kind) ? hangLuot(a.kind) - hangLuot(b.kind) : a.attempt_no - b.attempt_no);
/** Tên bài của lớp thường theo `kind` (không phải `final` thì là Progress Test) — một chỗ cho mọi nhãn cứng. */
export const nhanBaiThuong = (kind: string): string => (kind === 'final' ? ATTEMPT_KIND_SHORT.final : ATTEMPT_KIND_SHORT.progress);
/** Một từ cho cột hẹp (ghim Hành trình): `Progress` / `Final`. */
export const ATTEMPT_KIND_NGAN = { progress: 'Progress', final: 'Final' } as const;

/**
 * BỐN Ô MÔN CỦA LỚP THƯỜNG FOU/BE/ELE: L · R · W · S. Pre FOU chỉ một ô `tong_hop` (PF6).
 * FOU giữ 4 ô chuẩn này, chỉ đổi TÊN HIỆN (`tenMon`: W → G+V, S → P — T55).
 *
 * Hai cái tên riêng đã bỏ hẳn từ vòng 5:
 *
 *   `pronunciation` — Foundation trước đây có Pronunciation thay cho Speaking. Hai môn đó
 *                     đo cùng một thứ ở hai cái tên, nên mọi bảng tổng hợp phải cộng hai
 *                     cột lại mới trả lời được "cả trung tâm yếu nói đến đâu".
 *   `prep_writing`  — đã đổi thành `writing` ở vòng 4.
 *
 * Cả hai chỉ còn trong `LEGACY_REGULAR_SKILL_MAP` để dữ liệu cũ đọc ra đúng môn, KHÔNG
 * còn là môn để phân công hay để nhập điểm.
 */
export const REGULAR_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type RegularSkill = (typeof REGULAR_SKILLS)[number];
export const REGULAR_SKILL_LABEL: Record<RegularSkill, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/** Mã kỹ năng cũ → mã mới. Dữ liệu chưa di trú vẫn đọc đúng tên môn. */
export const LEGACY_REGULAR_SKILL_MAP: Record<string, RegularSkill> = {
  prep_writing: 'writing',
  pronunciation: 'speaking',
};

/**
 * Viết tắt dùng trên badge, ví dụ `L R` hay `R W1`.
 * Gộp cả kỹ năng của lớp FT và lớp thường vào một bảng để nơi hiển thị không phải đoán
 * lớp nào dùng bộ nào.
 */
export const SKILL_SHORT: Record<string, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
  writing: 'W',
  tong_hop: 'Tổng hợp',
  // Hai mã CŨ, chỉ để dữ liệu chưa di trú không hiện mã thô trên giao diện.
  prep_writing: 'W', pronunciation: 'S',
};
export const skillShort = (k: string) => tenMonNgan(null, k);

/** T55: FOU giữ 4 ô chuẩn, chỉ đổi TÊN HIỆN. Pre FOU một ô `tong_hop` (PF6). Chương trình khác: tên chung. */
const TEN_MON_RIENG: Record<string, Record<string, { ten: string; ngan: string }>> = {
  FOU: { writing: { ten: 'Grammar + Vocabulary', ngan: 'G+V' }, speaking: { ten: 'Pronunciation', ngan: 'P' } },
};
const TEN_CHUNG: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing1: 'Writing Task 1', writing2: 'Writing Task 2',
  writing: 'Writing', speaking: 'Speaking', tong_hop: 'Tổng hợp',
};
const oChuan = (o: string) => LEGACY_REGULAR_SKILL_MAP[o] ?? o;       // prep_writing → writing, pronunciation → speaking
/** MH2: MỘT nơi ra tên môn. `ct` = mã chương trình của lớp/lộ trình (null = không rõ → tên chung). */
export function tenMon(ct: string | null | undefined, o: string): string {
  const k = oChuan(o);
  return TEN_MON_RIENG[programmeOf(ct) ?? '']?.[k]?.ten ?? TEN_CHUNG[k] ?? o;
}
export function tenMonNgan(ct: string | null | undefined, o: string): string {
  const k = oChuan(o);
  return TEN_MON_RIENG[programmeOf(ct) ?? '']?.[k]?.ngan ?? SKILL_SHORT[k] ?? o;
}
/** Bộ môn xếp lịch của một lượt: FT (hoặc không rõ) → 4 kỹ năng đánh giá; lớp thường → bảng `programme_skills` (hằng số dự phòng). */
export function boMonLich(ct: string | null | undefined, skillsBang?: readonly string[] | null): readonly string[] {
  const c = programmeOf(ct);
  if (!c || c === 'FT') return ASSESSED_SKILLS;                       // FT: lịch theo 4 kỹ năng đánh giá (W = W1 + W2)
  return skillsBang?.length ? skillsBang : PROGRAMME_TEMPLATES[c]?.skills ?? REGULAR_SKILLS;
}
/** MH6, T55: ô môn của lớp → kỹ năng GV đã khai hợp để dạy ô đó (gợi ý phân công). */
export function kyNangGoiY(_ct: string | null | undefined, o: string): readonly string[] {
  if (o === 'writing') return ['writing1', 'writing2'];               // BE/ELE W, FOU G+V (T55, MH6)
  return (ENTRY_SKILLS as readonly string[]).includes(o) ? [o] : [];   // tong_hop: GVCN dạy luôn — không gợi ý
}
/**
 * PR-S5F-a: ô môn của lớp → kỹ năng PHÂN CÔNG (`teacher_assignments.skill`) phụ trách ô đó — khác `kyNangGoiY` (gợi ý khi phân công).
 * Lớp thường phân công đúng ô (`writing` = W / G+V); chỉ lớp FT tách ô W thành W1 + W2.
 */
export function kyNangPhuTrach(ct: string | null | undefined, o: string): readonly string[] {
  const c = programmeOf(ct);
  return (!c || c === 'FT') && o === 'writing' ? ['writing1', 'writing2'] : [o];
}
/** Hai khung: Fast Track (band) và Lớp thường (tỷ lệ). */
export type Khung = 'ft' | 'thuong';
export const khungCua = (scoringMode: string | null | undefined): Khung => (scoringMode === 'ratio' ? 'thuong' : 'ft');

/**
 * Mốc kiểm tra tính theo TUẦN HỌC của lớp, không phải tuần thứ mấy của tháng.
 * Pre FOU 5 tuần: chỉ cuối khoá tuần 5 (một ô Tổng hợp).
 * FOU 8 tuần: giữa khoá tuần 4, cuối khoá tuần 8.
 * BE/ELE 10 tuần: giữa khoá tuần 5, cuối khoá tuần 10.
 */
export type ProgrammeTemplate = {
  code: ProgrammeCode;
  name: string;
  weeks: number | null;
  scoringMode: ScoringMode;
  skills: readonly string[];
  checkpoints: readonly { kind: AttemptKind; studyWeek: number }[];
};

export const PROGRAMME_TEMPLATES: Record<ProgrammeCode, ProgrammeTemplate> = {
  FT: {
    code: 'FT', name: 'Fast Track', weeks: null, scoringMode: 'ielts_band',
    skills: ENTRY_SKILLS,
    checkpoints: [],   // MT theo mốc riêng của FT, xem MOCK_FT_STUDY_WEEK
  },
  PREFOU: {
    code: 'PREFOU', name: 'Pre Foundation', weeks: 5, scoringMode: 'ratio',
    skills: ['tong_hop'],
    checkpoints: [{ kind: 'final', studyWeek: 5 }],
  },
  FOU: {
    code: 'FOU', name: 'Foundation', weeks: 8, scoringMode: 'ratio',
    skills: REGULAR_SKILLS,
    checkpoints: [{ kind: 'progress', studyWeek: 4 }, { kind: 'final', studyWeek: 8 }],
  },
  BE: {
    code: 'BE', name: 'Beginner', weeks: 10, scoringMode: 'ratio',
    skills: REGULAR_SKILLS,
    checkpoints: [{ kind: 'progress', studyWeek: 5 }, { kind: 'final', studyWeek: 10 }],
  },
  ELE: {
    code: 'ELE', name: 'Elementary', weeks: 10, scoringMode: 'ratio',
    skills: REGULAR_SKILLS,
    checkpoints: [{ kind: 'progress', studyWeek: 5 }, { kind: 'final', studyWeek: 10 }],
  },
};

/** Đưa mã chương trình về mã canonical. Nhận cả mã cũ, nhưng không sửa dữ liệu gốc. */
export function programmeOf(kind: string | null | undefined): ProgrammeCode | null {
  if (!kind) return null;
  const k = kind.trim().toUpperCase();
  if ((PROGRAMME_CODES as readonly string[]).includes(k)) return k as ProgrammeCode;
  return LEGACY_PROGRAMME_CODE[k] ?? null;
}

/**
 * Kết quả một kỹ năng của lớp thường.
 *
 * Ba trạng thái, KHÔNG hai: thiếu điểm KHÁC trượt. Chưa nhập thì chưa kết luận được,
 * không được đếm thành một môn trượt rồi đẩy học viên lên SOS oan.
 */
export type RatioOutcome = 'pass' | 'fail' | 'missing';

export function ratioResult(score: number | null, total: number | null): {
  outcome: RatioOutcome; ratio: number | null;
} {
  if (score === null || total === null) return { outcome: 'missing', ratio: null };
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
    return { outcome: 'missing', ratio: null };
  }
  const ratio = score / total;
  // Xét trên tỷ lệ chính xác. Làm tròn % để hiển thị rồi mới so là sai:
  // 23/40 = 57.5% hiển thị "58%" nhưng vẫn dưới ngưỡng.
  return { outcome: ratio >= RATIO_PASS_THRESHOLD ? 'pass' : 'fail', ratio };
}

/** Số môn trượt → mức SOS. Dùng chung ngưỡng 1/2/≥3 với FT, chỉ khác cách sinh ra "trượt". */
export function sosFromFailCount(failCount: number): SosLevel {
  if (failCount <= 0) return 0;
  return failCount >= 3 ? 3 : (failCount as SosLevel);
}

export type SosLevel = 0 | 1 | 2 | 3;
export const SOS_LABEL: Record<SosLevel, string> = {
  0: 'Đạt kỳ vọng', 1: 'SOS 1', 2: 'SOS 2', 3: 'SOS 3',
};

/**
 * DÒNG MÔ TẢ của một vấn đề học vụ.
 *
 * Vấn đề do giáo viên báo luôn có một câu do người báo viết. Vấn đề sinh từ điểm thì
 * KHÔNG — không ai gõ gì cả, vì nó sinh ra từ một phép tính. Hiển thị "chưa có tóm tắt"
 * ở đó là đúng sự thật nhưng vô dụng: người đọc vẫn phải mở ra mới biết chuyện gì.
 *
 * Nên với vấn đề sinh từ điểm, dựng một câu TỪ CHÍNH DỮ LIỆU đã có. Đây là suy ra khi
 * hiển thị, không phải một câu được ghi vào database — sửa điểm thì câu này đổi theo.
 */
export function caseHeadline(c: {
  summary?: string | null; originKind?: string | null;
  sosLevel?: number | null; attemptNo?: number | null;
  /** Loại lượt: `mock` (FT) · `progress` / `final` (lớp thường). Bỏ trống thì đọc như FT (dữ liệu cũ). */
  attemptKind?: string | null;
}): string {
  const written = (c.summary ?? '').trim();
  /*
   * CASE DO NGƯỜI BÁO thì lấy đúng câu người ta viết. Không có thì nói thật là chưa có,
   * chứ không dựng một câu từ dữ liệu mà người báo không hề nói.
   */
  if (c.originKind === 'teacher_report') return written || 'Chưa có tóm tắt';

  /*
   * CASE SINH TỪ ĐIỂM thì PHẦN SUY RA TỪ DỮ LIỆU ĐỨNG TRƯỚC, ghi chú của người dạy đứng sau.
   *
   * Trước đây chỉ cần có ai đó gõ một câu là câu suy ra biến mất — và "Em bỏ trống phần
   * True/False/Not Given" thì hay, nhưng người đọc mất luôn thông tin bài nào và mấy kỹ năng
   * dưới kỳ vọng. Hai thứ không loại trừ nhau: một cái là căn cứ, một cái là quan sát.
   */
  const level = c.sosLevel ?? null;
  /* LỚP THƯỜNG (đặc tả §2, §6): tên bài "Giữa khoá / Cuối khoá", đếm theo MÔN, không "MT{n}", không "kỳ vọng". */
  const ratio = !!c.attemptKind && c.attemptKind !== 'mock';
  const where = ratio
    ? (ATTEMPT_KIND_SHORT[c.attemptKind as AttemptKind] ?? 'Bài kiểm tra')
    : c.attemptNo ? `MT${c.attemptNo}` : 'Bài kiểm tra';
  const derived = level === null ? `${where}: chưa đủ căn cứ kết luận`
    : level === 0 ? (ratio ? `${where}: đạt tất cả các môn` : `${where}: đạt kỳ vọng ở mọi kỹ năng`)
    : ratio ? `${where}: ${level >= 3 ? 'từ 3' : level} môn chưa đạt`
    : `${where}: ${level} kỹ năng dưới kỳ vọng`;
  return written ? `${derived} — ${written}` : derived;
}
