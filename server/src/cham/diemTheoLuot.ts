/*
 * ĐIỂM THEO LƯỢT CHO CẢ LỚP (PR-DL). Cách nhận diện một lượt — DL-0, chủ sản phẩm chốt 04/10:
 * - FT: lượt = `assessment_attempts.attempt_no` (kind 'mock'); MT lịch sử cũng có số lượt; lượt chưa xếp lịch có tuần NULL.
 * - Lớp thường: bài = `kind` ('progress' | 'final' | 'mt0' — PR-OV1a; MT0 chấm band). Mỗi lộ trình có đúng MỘT attempt không huỷ cho mỗi kind
 *   (`normal/regular.ts` tạo bài kiểm `cycle_id + kind`). `attempt_no` đánh số theo lộ trình TỪNG EM (em vào sau Giữa khoá có
 *   Cuối khoá số 1, bạn khác số 2) nên KHÔNG là khoá chung của lớp. Không có "bài thêm"/"lần 2": thi lại = dời tuần trên
 *   cùng attempt.
 * - Lịch riêng của lớp nằm ở `planned_period_id` của attempt và `attempt_skills` — bảng chỉ cần chọn attempt, không đọc
 *   bảng lịch nào khác.
 */
import { badRequest, notFound } from '../util.ts';
import { db, theoLo } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { classScopeSql, requireXemLuotCham, scopeXemLuotCham, type Principal } from '../permissions.ts';
import {
  docMaLuot, luotMacDinh, nhanMaLuot, soSanhLop, vietMaLuot, type AssessedSkill, type MaLuot, type TomTatLuot,
} from '../../../shared/domain/index.ts';
import { entrySkillsOf } from '../fasttrack/scoring.ts';
import { cheDoCua, type CheDo } from '../normal/regular.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { chamSheet } from './canCham.ts';

/** Tra lớp rồi kiểm quyền — TRƯỚC mọi truy vấn dữ liệu HV. */
function lopDuocXem(p: Principal, classId: number): CheDo {
  const cls = db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  requireXemLuotCham(p, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  return cheDoCua(cls.programme_code);
}

type Gom = TomTatLuot & { classId: number; thuTu: number };

/**
 * Tóm tắt mọi lượt của các lớp — ba câu mỗi lô lớp (không hỏi theo từng lớp/lượt). FT: lượt = `attempt_no` của bài mock;
 * lớp thường: bài = `kind` (DL-0), bỏ em đã lưu trữ như `regularSheet`. Ô trống = ô nhập của kỹ năng bắt buộc chưa huỷ
 * (Writing FT = W1 + W2) không có điểm và không có dấu "-" đúng tuần hiện tại của kỹ năng (G6).
 */
function tomTatLop(classIds: number[]): Map<number, TomTatLuot[]> {
  const conn = db();
  /* Mỗi attempt: lượt của nó + số ô trống `n`. */
  const luotCua = new Map<number, { g: Gom; ft: boolean; n: number }>();
  const gom = new Map<string, Gom>();
  theoLo(classIds, (lo, ph) => {
    for (const a of conn.prepare(
      `SELECT a.id, a.class_id, a.kind, a.attempt_no, a.lich_su, s.archived_at, rp.week_start, c.programme_code
         FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id IN (${ph}) AND a.status != 'cancelled'`,
    ).all(...lo) as any[]) {
      const ft = cheDoCua(a.programme_code) === 'ielts_band';
      let m: MaLuot;
      if (ft && a.kind === 'mock' && a.attempt_no) m = { loai: 'mt', so: a.attempt_no };
      /* PR-OV1a: MT0 của lớp thường là lượt `thuong:mt0` (bảng band, ô nhập W1 + W2). */
      else if (!ft && (a.kind === 'progress' || a.kind === 'final' || a.kind === 'mt0') && a.archived_at === null) m = { loai: 'thuong', kind: a.kind };
      else continue;
      const ma = vietMaLuot(m);
      const khoa = `${a.class_id}|${ma}`;
      const g = gom.get(khoa) ?? gom.set(khoa, {
        classId: a.class_id, ma, nhan: nhanMaLuot(m), tuanStart: null, lichSu: m.loai === 'mt', duDiem: 0, coLich: 0, oTrong: 0,
        thuTu: m.loai === 'mt' ? m.so : m.kind === 'progress' ? 1 : m.kind === 'final' ? 2 : 3,
      }).get(khoa)!;
      g.coLich += 1;
      /* Lượt "lịch sử" chỉ khi MỌI attempt không huỷ của lượt là lịch sử (chủ sản phẩm 05/10); lượt lẫn đánh dấu theo từng em. */
      if (!a.lich_su) g.lichSu = false;
      if (a.week_start && (g.tuanStart === null || a.week_start < g.tuanStart)) g.tuanStart = a.week_start;
      luotCua.set(a.id, { g, ft: ft || a.kind === 'mt0', n: 0 });
    }
    const diem = new Map<string, any>();
    for (const sc of conn.prepare(
      `SELECT sc.attempt_id, sc.skill, sc.band, sc.raw_score, sc.no_show_period_id FROM assessment_scores sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE a.class_id IN (${ph}) AND a.status != 'cancelled'`,
    ).all(...lo) as any[]) diem.set(`${sc.attempt_id}|${sc.skill}`, sc);
    for (const k of conn.prepare(
      `SELECT k.attempt_id, k.skill, k.planned_period_id FROM attempt_skills k
         JOIN assessment_attempts a ON a.id = k.attempt_id
        WHERE a.class_id IN (${ph}) AND a.status != 'cancelled' AND k.required = 1 AND k.sit_status != 'cancelled'`,
    ).all(...lo) as any[]) {
      const l = luotCua.get(k.attempt_id);
      if (!l) continue;
      for (const nhap of l.ft ? entrySkillsOf(k.skill as AssessedSkill) : [k.skill as string]) {
        const sc = diem.get(`${k.attempt_id}|${nhap}`);
        const xong = sc && (sc.band !== null || sc.raw_score !== null
          || (sc.no_show_period_id !== null && sc.no_show_period_id === k.planned_period_id));
        if (!xong) l.n += 1;
      }
    }
  });
  for (const { g, n } of luotCua.values()) {
    g.oTrong += n;
    if (n === 0) g.duDiem += 1;
  }
  const out = new Map<number, TomTatLuot[]>(classIds.map((id) => [id, []]));
  for (const { classId, thuTu, ...l } of [...gom.values()].sort((x, y) => x.thuTu - y.thuTu)) out.get(classId)!.push(l);
  return out;
}

/** Các lượt của một lớp + lượt mở sẵn (luật DL-1, sửa DL-6b theo `today`). */
export function danhSachLuot(p: Principal, classId: number, today: string = demoToday()): { classId: number; mode: CheDo; luot: TomTatLuot[]; macDinh: string | null } {
  const mode = lopDuocXem(p, classId);
  const luot = tomTatLop([classId]).get(classId)!;
  return { classId, mode, luot, macDinh: luotMacDinh(luot, today) };
}

/** Bảng điểm cả lớp của một lượt: chính `chamSheet` (chọn theo số lượt / theo kind) + tóm tắt lượt + HV chưa có lịch lượt đó (FT). */
export function bangTheoLuot(p: Principal, classId: number, ma: string, today: string = demoToday()) {
  const mode = lopDuocXem(p, classId);
  const m = docMaLuot(ma);
  /* Sai dạng, hoặc đúng dạng nhưng sai họ lớp (`thuong:*` ở lớp FT, `mt:*` ở lớp thường). */
  if (!m || (m.loai === 'mt') !== (mode === 'ielts_band')) throw badRequest('Mã lượt không hợp lệ');
  const luot = tomTatLop([classId]).get(classId)!.find((l) => l.ma === ma);
  if (!luot) throw notFound('Lớp chưa có lượt này');
  const sheet = chamSheet(p, classId, m.loai === 'mt' ? { attemptNo: m.so } : { kind: m.kind }, today);
  /* Lớp thường không có hàng mờ: em vào sau bài đó không có bài (DL-0). */
  const chuaCoLich = m.loai === 'mt'
    ? (db().prepare(
      `SELECT DISTINCT s.id AS studentId, s.full_name AS fullName, s.student_code AS studentCode
         FROM enrollments e JOIN students s ON s.id = e.student_id AND ${HV_DANG_HOC_SQL('s')}
        WHERE e.class_id = ? AND e.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.student_id = s.id AND a.class_id = e.class_id
                           AND a.kind = 'mock' AND a.attempt_no = ? AND a.status != 'cancelled')
        ORDER BY s.full_name`,
    ).all(classId, m.so) as { studentId: number; fullName: string; studentCode: string }[])
    : [];
  /*
   * Chip "lịch sử" cạnh tên em (chỉ bảng này — không thêm vào `classScoreSheet` để lưới Nhập điểm cũ không đổi). Chỉ ở lượt LẪN:
   * cả lượt lịch sử thì callout của bảng đã nói, không chip từng em (chủ sản phẩm 05/10).
   */
  const lichSu = new Set(m.loai === 'mt' && sheet.ft && !luot.lichSu
    ? (db().prepare(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND attempt_no = ? AND lich_su = 1 AND status != 'cancelled'`)
      .all(classId, m.so) as { id: number }[]).map((r) => r.id)
    : []);
  const ft = sheet.ft ? { ...sheet.ft, rows: sheet.ft.rows.map((r) => ({ ...r, lichSu: lichSu.has(r.attemptId) })) } : sheet.ft;
  return { ...sheet, ft, luot, chuaCoLich };
}

/**
 * Lớp của trang Test › "Điểm theo lớp": cùng phạm vi đọc với `requireXemLuotCham` qua `scopeFor(ATTEMPT_VIEW)` +
 * `classScopeSql` (GV/GVCN: lớp được phân công; QL: lớp chi nhánh) + lớp FT GV Speaking chấm S chéo (`lopFtChoGvSpeaking`)
 * — như Lịch Test.
 */
export function lopCuaToi(p: Principal): { classId: number; classCode: string; mode: CheDo; branchId: number; oTrong: number }[] {
  const scope = scopeXemLuotCham(p);
  if (scope.none) return [];
  const cs = classScopeSql(scope);
  const lop = (db().prepare(`SELECT c.id, c.code, c.programme_code, c.branch_id FROM classes c WHERE ${cs.sql} AND c.status = 'active'`)
    .all(...cs.params) as any[]).sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }));
  const tt = tomTatLop(lop.map((c) => c.id as number));
  return lop.map((c) => ({
    classId: c.id as number, classCode: c.code as string, mode: cheDoCua(c.programme_code), branchId: c.branch_id as number,
    oTrong: tt.get(c.id)!.reduce((n, l) => n + l.oTrong, 0),
  }));
}
