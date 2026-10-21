import { THAM_SO_TOI_DA, db, theoLo } from '../db.ts';
import { LUOT_TINH_NO_SQL, boMonLich, laChamCheo } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { allProgrammes } from '../normal/regular.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { nho, nhoTheoId } from '../platform/nguCanhRequest.ts';

/**
 * Ô ĐIỂM CÒN NỢ — một ô = một kỹ năng một lượt, tuần thi đã bắt đầu, người được phân công chưa nhập (S12 + đặc tả §6).
 *
 * KHÔNG tự đếm. Đi qua ĐÚNG hàm mà bảng chấm dùng để vẽ ô: `skillCells` (FT — band, dấu "-", cặp W1/W2) và `regularSkillViews`
 * (lớp thường — số câu đúng, hạn thứ Tư tuần sau tuần thi của CHÍNH môn đó — T19). Trước đây bảng chi nhánh tự viết một câu SQL "ước lượng thô":
 * lớp thường không bao giờ có `band` nên mọi môn treo mãi, hạn tính kiểu FT, và ô "-" bị loại mà không xét cặp W1/W2.
 *
 * `branchIds = null` là không lọc; `[]` là phạm vi rỗng → rỗng (hợp đồng số liệu, luật 3).
 */
/** `userId` null = môn CHƯA PHÂN CÔNG giáo viên — vẫn là nợ (PR-UXF-a Q8: không giấu nợ; bảng Theo giáo viên có hàng "Chưa phân công"). */
export type DebtCell = { attemptId: number; classId: number; skill: string; userId: number | null; overdue: boolean;
  /** PR-VAI-a (Q24): hạn nhập của ô — cột Hạn "quá hạn a–b ngày" ở Cần xử lý đọc từ chính tập này. */
  han: string | null;
  /** T18 (PR-LT3): Speaking Mock — `userId` null nhưng KHÔNG phải "chưa phân công": không nợ của GVBM S / GVCN, QL vẫn thấy ở chỉ số quá hạn. */
  chamCheo?: boolean;
  /** OV-13o: tuần thi của ô (chỉ ô chấm chéo) — `canChamCheo` lọc bài đã tới lượt chấm như Công việc. */
  tuanThi?: string | null };

/** Tiến độ KHÔNG phải nợ điểm: vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, đang chờ Quản lý duyệt dời, MT lịch sử (T34). */
const NOT_DEBT = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending', 'lich_su']);

/**
 * PR-Dọn (Q13): MỘT luật phân công cho "người giữ việc" (Nợ điểm), "GV chấm" (Lịch Test) và "người khác" (Công việc) — phân công
 * `active`, đang hiệu lực tại `ngay`; nhiều dòng cùng (lớp, môn) thì dòng `id` nhỏ nhất thắng (như `teacherOf` cũ). Khoá `lớp|môn`.
 */
export function phanCongDangHieuLuc(classIds: readonly number[], ngay: string): Map<string, { userId: number; ten: string }> {
  /* TD4: nhớ theo lớp trong request GET — Công việc gọi lại cùng tập lớp (danh sách lượt, "Tất cả", người giữ kết quả PA). */
  const theoLop = nhoTheoId(`pc:${ngay}:`, [...new Set(classIds)], (thieu) => {
    const m = new Map<number, any[]>();
    theoLo(thieu, (lo, ph) => {
      for (const r of db()
        .prepare(`SELECT ta.id, ta.class_id, ta.skill, ta.user_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
                   WHERE ta.class_id IN (${ph}) AND ta.status = 'active' AND ta.skill IS NOT NULL
                     AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id`)
        .all(...lo, ngay, ngay) as any[]) (m.get(r.class_id) ?? m.set(r.class_id, []).get(r.class_id)!).push(r);
    }, THAM_SO_TOI_DA - 2);   // + 2 tham số ngày
    return m;
  });
  const out = new Map<string, { userId: number; ten: string }>();
  for (const r of [...theoLop.values()].flat().sort((a, b) => a.id - b.id)) {
    const k = `${r.class_id}|${r.skill}`;
    if (!out.has(k)) out.set(k, { userId: r.user_id, ten: r.full_name });
  }
  return out;
}

export function scoreDebtCells(p: Principal, today: string, branchIds: number[] | null, classIds?: readonly number[]): DebtCell[] {
  if (Array.isArray(branchIds) && branchIds.length === 0) return [];
  /* SL1 (V2B-3): một lớp (Điểm theo lớp) — lọc ngay trong câu, không quét cả chi nhánh. */
  if (classIds) return nho(`no-diem-lop:${p.userId}:${today}:${classIds.join(',')}`, () => tinhNoDiem(p, today, branchIds, classIds));
  /* OV-15h1: nhớ trong request — Tổng quan QL đọc cùng tập nợ điểm ở "bài trễ chấm", "bài chưa có người chấm", Chưa điểm, Trễ chấm (một lần quét). */
  return nho(`no-diem:${p.userId}:${today}:${branchIds?.join(',') ?? '*'}`, () => tinhNoDiem(p, today, branchIds));
}
function tinhNoDiem(p: Principal, today: string, branchIds: number[] | null, classIds?: readonly number[]): DebtCell[] {
  const conn = db();
  /* PR-MT (M3, K4-01): MT lịch sử không bao giờ là nợ — bỏ từ câu SQL (phủ Theo giáo viên, bai-qua-han-nhap-diem, Tổng quan). */
  /* PR-UXF-a T65 → PR-S6F-a Q2: em không đang học (Tạm dừng, Kết thúc học, lưu trữ) không sinh nợ điểm. Hồ sơ HV vẫn hiện ô (đường riêng). */
  const where = [`a.status != 'cancelled'`, `cl.status = 'active'`, HV_DANG_HOC_SQL('s'), LUOT_TINH_NO_SQL('a')];
  const args: unknown[] = [];
  if (branchIds) { where.push(`cl.branch_id IN (${branchIds.map(() => '?').join(',')})`); args.push(...branchIds); }
  if (classIds) { where.push(`a.class_id IN (${classIds.map(() => '?').join(',') || 'NULL'})`); args.push(...classIds); }
  const rows = conn
    .prepare(
      `SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route  -- OV-12b: kỳ vọng ô (skillCells) không hỏi lẻ từng lượt
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where.join(' AND ')}
          /*
           * LỌC TRƯỚC, CHỈ BỎ LƯỢT CHẮC CHẮN KHÔNG NỢ (TD7b): lượt còn ô chờ điểm mà tuần thi đã tới — cờ o_cho_tu (fasttrack/conOCho.ts, chỉ mục một phần
           * idx_attempt_o_cho) thay cho hai câu con tương quan trên điểm + lịch của MỌI lượt (trước: mọi lượt chưa đủ điểm từ đầu khoá đều bị nạp mỗi lần mở bảng chi nhánh).
           * Luật "còn nợ" vẫn nằm ở skillCells / regularSkillViews bên dưới — đây chỉ là tập cha an toàn (ô chờ ⊇ ô nợ).
           */
          AND a.o_cho_tu <= ?
        ORDER BY a.id`,   // thứ tự cố định (trước không có ORDER BY: phụ thuộc kế hoạch truy vấn, đổi theo chỉ mục)
    )
    .all(...args, today) as any[];
  if (!rows.length) return [];

  /* PR-UXF-a → PR-Dọn (Q13): phân công ĐANG HIỆU LỰC, một luật chung (`phanCongDangHieuLuc`). */
  const teacherOf = new Map([...phanCongDangHieuLuc([...new Set(rows.map((r) => r.class_id as number))], today)].map(([k, v]) => [k, v.userId]));

  const bundle = loadBundle(rows.map((r) => r.id));
  const programmes = allProgrammes();          // một lần cho cả bảng, không mỗi lượt một câu
  const out: DebtCell[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const skillRows = bundle.skillRows.get(a.id);
    if (scoringModeOf(a) === 'ratio') {
      const bo = boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills);
      const views = regularSkillViews(a, skillRows, scores, today, bo);
      for (const skill of bo) {
        const v = views.get(skill);
        if (!v || !v.required || v.scored || !v.weekStart || v.weekStart > today || NOT_DEBT.has(v.progress)) continue;
        out.push({ attemptId: a.id, classId: a.class_id, skill, userId: teacherOf.get(`${a.class_id}|${skill}`) ?? null, overdue: v.overdue, han: v.deadline ?? null });
      }
    } else {
      /* Không truyền `hoanTat` (R11) có chủ ý: nợ điểm đọc band/noShow/lịch, không đọc canEdit/khoa — đỡ 3 câu SQL. */
      for (const c of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], today, skillRows)) {
        /* V5 SV-SO1 (brief 8.1): ô có điểm mà thiếu nhận xét bắt buộc (`nxChuaXong`) chưa xong — vẫn nợ. */
        if (!c.nxChuaXong && (!c.required || c.band !== null || c.noShow !== null || !c.weekStart || c.weekStart > today || NOT_DEBT.has(c.progress))) continue;
        const chamCheo = laChamCheo(a.kind, c.skill);
        out.push({ attemptId: a.id, classId: a.class_id, skill: c.skill, userId: chamCheo ? null : teacherOf.get(`${a.class_id}|${c.skill}`) ?? null,
          overdue: c.overdue || c.nxQuaHan, han: c.deadline ?? null, ...(chamCheo ? { chamCheo, tuanThi: c.weekStart } : {}) });
      }
    }
  }
  return out;
}
