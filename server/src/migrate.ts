import { db, isInitialised, laDbTuXa } from './db.ts';
import { nowIso } from './util.ts';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { uploadsDir } from './platform/attachments.ts';
import { PERMISSION_LABEL, VIOLATION_SKILLS, legacyTopicToViolationCategory } from '../../shared/domain/index.ts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from './platform/accounts.ts';
import { seedRoutes } from './platform/sysconfig.ts';
import { ROLE_PERMISSIONS } from './seed/data.ts';
import { migratePrN1 } from './migrate/prN1.ts';
import { migratePrLop } from './migrate/prLop.ts';
import { migratePrDuyet } from './migrate/prDuyet.ts';
import { migratePrMt } from './migrate/prMt.ts';
import { migratePrNhap } from './migrate/prNhap.ts';
import { migratePrKck } from './migrate/prKck.ts';
import { migratePrSos } from './migrate/prSos.ts';
import { migratePrYt4 } from './migrate/prYt4.ts';
import { migratePrHsm } from './migrate/prHsm.ts';
import { migratePrLt2a } from './migrate/prLt2a.ts';
import { migratePrOv2 } from './migrate/prOv2.ts';
import { migratePrOv8b } from './migrate/prOv8b.ts';
import { migratePrOv9 } from './migrate/prOv9.ts';
import { migratePrOv10b } from './migrate/prOv10b.ts';
import { migratePrLt2b } from './migrate/prLt2b.ts';
import { migratePrCt } from './migrate/prCt.ts';
import { migratePrPb2b } from './migrate/prPb2b.ts';
import { migratePrDeploy } from './migrate/prDeploy.ts';
import { migratePrQu } from './migrate/prQu.ts';
import { migratePrGva } from './migrate/prGva.ts';
import { migratePrPhh } from './migrate/prPhh.ts';
import { migratePrK26 } from './migrate/prK26.ts';
import { migratePrTk } from './migrate/prTk.ts';
import { migratePrMta } from './migrate/prMta.ts';
import { migratePrLuiA1 } from './migrate/prLuiA1.ts';
import { migratePrLuiA2 } from './migrate/prLuiA2.ts';
import { khoaPrOv1b } from './migrate/prOv1b.ts';
import { migratePrLc } from './migrate/prLc.ts';
import { migratePrLcb } from './migrate/prLcb.ts';
import { migratePrPa } from './migrate/prPa.ts';
import { migratePrCt2 } from './migrate/prCt2.ts';
import { migratePrOv3b } from './migrate/prOv3b.ts';
import { migratePrOv4 } from './migrate/prOv4.ts';
import { migratePrOv6b1 } from './migrate/prOv6b1.ts';
import { migratePrOv6b2 } from './migrate/prOv6b2.ts';
import { migratePrOv8a } from './migrate/prOv8a.ts';
import { migratePrOv11e, themCotPrOv11e } from './migrate/prOv11e.ts';
import { migratePrOv12a } from './migrate/prOv12a.ts';
import { migratePrOv13l } from './migrate/prOv13l.ts';
import { migratePrOv13n } from './migrate/prOv13n.ts';
import { migratePrOv13m } from './migrate/prOv13m.ts';
import { migratePrOv12g } from './migrate/prOv12g.ts';
import { migratePrEn } from './migrate/prEn.ts';
import { migratePrOv12b } from './migrate/prOv12b.ts';
import { migratePrOv12c } from './migrate/prOv12c.ts';
import { migratePrOv12h } from './migrate/prOv12h.ts';
import { cacBuocPrOv13a, khoaPrOv1c, themCotPrOv13a } from './migrate/prOv13a.ts';
import { migratePrOv13e } from './migrate/prOv13e.ts';
import { migratePrHd } from './migrate/prHd.ts';
import { migratePrOv13p } from './migrate/prOv13p.ts';
import { migratePrOv13k } from './migrate/prOv13k.ts';
import { migratePrTd5 } from './migrate/prTd5.ts';
import { migratePrOv13q, themCotPrOv13q } from './migrate/prOv13q.ts';
import { themCotPrOv15f } from './migrate/prOv15f.ts';
import { migratePrOv15c } from './migrate/prOv15c.ts';
import { migratePrTd6 } from './migrate/prTd6.ts';
import { migratePrTd7a } from './migrate/prTd7a.ts';
import { migratePrOv15d } from './migrate/prOv15d.ts';
import { migratePrOv15e } from './migrate/prOv15e.ts';
import { migratePrTd7 } from './migrate/prTd7.ts';
import { migratePrTu } from './migrate/prTu.ts';
import { migratePrTub } from './migrate/prTub.ts';
import { migratePrSl1 } from './migrate/prSl1.ts';
import { migratePrSvYtTvv } from './migrate/prSvYtTvv.ts';
import { migratePrOv15g } from './migrate/prOv15g.ts';
import { migratePrOv15i1 } from './migrate/prOv15i1.ts';
import { migratePrTd7b } from './migrate/prTd7b.ts';
import { migratePrCvLoi } from './migrate/prCvLoi.ts';

/**
 * Nâng cấp database ĐANG CÓ lên schema mới, không xoá dữ liệu. PR-SO (DEP-gỡ): nhánh nâng cấp từ mô hình `mock_attempts` (trước overhaul)
 * đã gỡ — DB cũ đã xoá, DB nào cũng dựng từ `schema.sql` (seed / `init-ban-chinh`).
 */
export function migrate(loiSauBuoc?: number): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  if (!isInitialised()) return { applied, skipped: ['Database chưa có bảng nào — chạy `npm run seed`.'] };
  if (!db().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'assessment_attempts'").get()) {
    return { applied, skipped: ['Không tìm thấy dữ liệu để nâng cấp.'] };
  }
  return migrateCaseEngine(applied, skipped, loiSauBuoc);
}

/**
 * NÂNG CẤP TẠI CHỖ SANG MÔ HÌNH CASE HỌC VỤ.
 *
 * Chạy được trên database đang dùng, KHÔNG xoá và tạo lại. Chạy lại lần hai là no-op.
 *
 * Ba việc chính:
 *   1. Thêm cột/bảng mới, giữ nguyên mọi id cũ để các liên kết đã lưu không gãy.
 *   2. Điền `student_id`/`cycle_id` cho case cũ, lấy từ chính lượt đánh giá của nó.
 *   3. Chuyển các cột checklist cố định (trao đổi HS/PH, hỗ trợ học thuật, chính sách,
 *      buổi gặp) thành các bản ghi tác động — mỗi cột đúng MỘT lần, có khoá chống trùng.
 *
 * Nguyên tắc khi chuyển: NGÀY BẮT ĐẦU KHÔNG PHẢI NGÀY HOÀN THÀNH. Dữ liệu cũ chỉ ghi ngày
 * bắt đầu hỗ trợ học thuật, nên chuyển thành trạng thái "đang thực hiện", không tự nhận là
 * đã xong. Thiếu người thực hiện thì để trống chứ không lấy người nhập làm người làm.
 */
function migrateCaseEngine(applied: string[], skipped: string[], loiSauBuoc?: number) {
  const conn = db();
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name);
  const has = (table: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };

  if (!has('sos_cases')) return { applied, skipped };

  /*
   * MỖI BƯỚC MỘT GIAO DỊCH NGẮN (14/10: một giao dịch 10–20 phút bị Turso đóng kết nối giữa chừng, thử lại cả khối thì đứt mãi).
   * Bước nào cũng chạy lặp được: đứt ở bước k → bước trước đó đã chốt, run.ts mở kết nối mới chạy lại, các bước đó thành no-op.
   * `case_engine_migrated_at` chỉ ghi khi mọi bước đã chốt. `loiSauBuoc`: phép kiểm giả lập đứt ngay sau bước thứ k.
   */
  let soBuoc = 0;
  const buoc = (fn: () => void) => {
    conn.transaction(fn)();
    /* Bước đã chốt → mới xoá tệp bằng chứng của những vi phạm bị xoá (PR-T). Bước lỗi thì không tới đây, tệp còn nguyên. */
    flushDeferredFileRemovals();
    if (++soBuoc === loiSauBuoc) throw new Error(`Giả lập đứt kết nối sau bước ${soBuoc}`);
  };
  /* Lỗi giữa chừng: không bật lại ở đây — run.ts đóng kết nối, kết nối mới mặc định bật. */
  conn.pragma('foreign_keys = OFF');
    /* PR-OV11e: cột KCK theo lượt — TRƯỚC mọi bước tính kết quả lượt (`kckCuaLuot` đọc cột này). Chỉ thêm cột. */ buoc(() => themCotPrOv11e(conn, applied));
    /* PR-OV13a: cột sos_cases.tam (Case tạm) — TRƯỚC mọi bước có thể chạy luật Case (đọc / ghi cột này). Chỉ thêm cột. */ buoc(() => themCotPrOv13a(conn, applied));
    /* OV-13k: cột nhận xét GV phụ trách Speaking (assessment_scores) — TRƯỚC mọi bước đọc điểm (`scoresOf` / `diemCuaLuot` JOIN các cột này). Chỉ thêm cột. */ buoc(() => migratePrOv13k(conn, applied));
    /* OV-13q: cột hạn sau thi (learning_cycles.han_sau_thi…) — TRƯỚC mọi bước có thể đọc việc thi thật / bước tiếp (COT_SAU_THI). Chỉ thêm cột. */ buoc(() => themCotPrOv13q(conn, applied));
    /* OV-15f: 5 cột learning_cycles.lich_thi_* (kết luận + ghi chú họp Lịch thi) — cũng ĐẦU migrate, chỉ thêm cột NULL. */ buoc(() => themCotPrOv15f(conn, applied));
    buoc(() => {
    // 1. Cột mới trên các bảng đang có.
    for (const [col, decl] of [
      ['student_id', 'INTEGER REFERENCES students(id)'],
      ['cycle_id', 'INTEGER REFERENCES learning_cycles(id)'],
      ['origin_kind', "TEXT NOT NULL DEFAULT 'mock'"],
      ['detected_at', 'TEXT'], ['reported_by', 'INTEGER REFERENCES users(id)'],
      ['summary', 'TEXT'], ['urgency', 'TEXT'],
      ['disposition', 'TEXT'], ['disposition_note', 'TEXT'],
      ['closed_by', 'INTEGER REFERENCES users(id)'], ['closed_at', 'TEXT'],
      ['acknowledged_by', 'INTEGER REFERENCES users(id)'], ['acknowledged_at', 'TEXT'],
      ['idempotency_key', 'TEXT'],
    ] as const) addCol('sos_cases', col, decl);

    for (const [col, decl] of [
      ['programme_code', 'TEXT'],
      ['baseline_attempt_id', 'INTEGER'], ['baseline_score', 'REAL'],
      ['baseline_source', 'TEXT'], ['baseline_note', 'TEXT'],
      ['outcome', 'TEXT'], ['outcome_attempt_id', 'INTEGER'],
      ['outcome_score', 'REAL'], ['outcome_note', 'TEXT'],
    ] as const) addCol('learning_cycles', col, decl);

    for (const [col, decl] of [['cycle_id', 'INTEGER'], ['dedup_key', 'TEXT']] as const) {
      addCol('journey_events', col, decl);
    }
    if (cols('classes').length && !cols('classes').includes('programme_code')) {
      conn.exec('ALTER TABLE classes ADD COLUMN programme_code TEXT');
    }

    // 2. Bảng mới.
    conn.exec(`
      CREATE TABLE IF NOT EXISTS programmes (
        code TEXT PRIMARY KEY, name TEXT NOT NULL, weeks INTEGER,
        scoring_mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS programme_skills (
        programme_code TEXT NOT NULL, skill TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (programme_code, skill));
      CREATE TABLE IF NOT EXISTS programme_checkpoints (
        programme_code TEXT NOT NULL, kind TEXT NOT NULL, study_week INTEGER NOT NULL,
        PRIMARY KEY (programme_code, kind));
      CREATE TABLE IF NOT EXISTS cycle_target_revisions (
        id INTEGER PRIMARY KEY, cycle_id INTEGER NOT NULL, old_target REAL, new_target REAL,
        effective_from TEXT NOT NULL, reason TEXT, actor_user_id INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_issues (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'primary',
        taxonomy_code TEXT NOT NULL, taxonomy_version INTEGER NOT NULL DEFAULT 1,
        skill TEXT, observation TEXT, created_by INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_interventions (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, kind TEXT NOT NULL, description TEXT,
        performer_user_id INTEGER, performer_name TEXT, recorded_by INTEGER,
        status TEXT NOT NULL DEFAULT 'planned', planned_date TEXT, started_date TEXT,
        completed_date TEXT, followup_due TEXT, migration_key TEXT UNIQUE,
        created_at TEXT NOT NULL, updated_at TEXT);
      CREATE TABLE IF NOT EXISTS case_followups (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, intervention_id INTEGER,
        observed_on TEXT NOT NULL, observer_user_id INTEGER, outcome TEXT, note TEXT,
        evidence_attempt_id INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_sources (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'support',
        source_type TEXT NOT NULL, source_id INTEGER NOT NULL, note TEXT,
        created_by INTEGER, created_at TEXT NOT NULL,
        UNIQUE (case_id, source_type, source_id, role));
      CREATE INDEX IF NOT EXISTS idx_case_student ON sos_cases(student_id, status);
      CREATE INDEX IF NOT EXISTS idx_case_issue_case ON case_issues(case_id);
      CREATE INDEX IF NOT EXISTS idx_intervention_case ON case_interventions(case_id);
      CREATE INDEX IF NOT EXISTS idx_followup_case ON case_followups(case_id);
    `);

    // 3. Điền học viên/lộ trình cho case cũ, lấy từ chính lượt đánh giá của nó.
    const filled = conn
      .prepare(
        `UPDATE sos_cases SET
           student_id = COALESCE(student_id, (SELECT a.student_id FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id)),
           cycle_id   = COALESCE(cycle_id,   (SELECT a.cycle_id   FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id)),
           detected_at = COALESCE(detected_at, substr(created_at, 1, 10))
         WHERE attempt_id IS NOT NULL AND (student_id IS NULL OR cycle_id IS NULL OR detected_at IS NULL)`,
      )
      .run();
    if (filled.changes) applied.push(`Điền học viên/lộ trình cho ${filled.changes} case cũ`);

    /*
     * 4. Chuyển checklist cố định thành tác động.
     *
     * `migration_key` đảm bảo chạy lại không nhân đôi. Ngày trong dữ liệu cũ chỉ chứng minh
     * việc ĐÃ BẮT ĐẦU với hỗ trợ học thuật — không nâng thành "đã xong".
     */
    const legacy: { field: string; kind: string; dateCol: string; personCol?: string; status: string; label: string }[] = [
      { field: 'talk_student', kind: 'talk_student', dateCol: 'talk_student_date', personCol: 'talk_student_person', status: 'completed', label: 'Trao đổi với học viên' },
      { field: 'talk_parent', kind: 'talk_parent', dateCol: 'talk_parent_date', personCol: 'talk_parent_person', status: 'completed', label: 'Trao đổi với phụ huynh' },
      { field: 'academic', kind: 'tutor', dateCol: 'academic_start_date', personCol: 'academic_person', status: 'started', label: 'Hỗ trợ học thuật' },
      { field: 'ops', kind: 'ops_policy', dateCol: 'ops_date', status: 'completed', label: 'Chính sách vận hành' },
      { field: 'meeting', kind: 'meeting', dateCol: 'meeting_date', status: 'completed', label: 'Buổi gặp riêng' },
    ];
    const caseCols = cols('sos_cases');
    let moved = 0;
    for (const l of legacy) {
      if (!caseCols.includes(l.dateCol)) continue;
      const person = l.personCol && caseCols.includes(l.personCol) ? l.personCol : null;
      const extra = l.field === 'academic' && caseCols.includes('academic_support') ? 'academic_support'
        : l.field === 'ops' && caseCols.includes('ops_policy') ? 'ops_policy'
        : l.field === 'meeting' && caseCols.includes('meeting_kind') ? 'meeting_kind' : null;
      for (const r of conn
        .prepare(`SELECT id, ${l.dateCol} AS d${person ? `, ${person} AS who` : ''}${extra ? `, ${extra} AS what` : ''}
                    FROM sos_cases WHERE ${l.dateCol} IS NOT NULL AND ${l.dateCol} != ''`)
        .all() as any[]) {
        const key = `legacy:${l.field}:${r.id}`;
        const dup = conn.prepare('SELECT 1 FROM case_interventions WHERE migration_key = ?').get(key);
        if (dup) continue;
        conn
          .prepare(
            `INSERT INTO case_interventions (case_id, kind, description, performer_name, status,
                                             started_date, completed_date, migration_key, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)`,
          )
          .run(r.id, l.kind, (r as any).what ?? l.label, (r as any).who ?? null, l.status,
               r.d, l.status === 'completed' ? r.d : null, key, nowIso());
        moved += 1;
      }
    }
    if (moved) applied.push(`Chuyển ${moved} mốc hỗ trợ cũ thành bản ghi tác động (giữ nguyên bản gốc để tra lại)`);

    /*
     * 6. "GHI NHẬN CỦA GIÁO VIÊN" ĐÃ BỎ HẲN Ở VÒNG 4.
     *
     * Bản trước dựng bảng `skill_checkins` từ `teacher_estimates`. Vòng 4 bỏ cả khu đó khỏi
     * sản phẩm (owner chốt 13/09/2026: hai đường chấm điểm song song làm số liệu đá nhau),
     * nên dựng lên rồi lại xoá đi chỉ khiến chạy lần hai báo thêm việc đã làm. `teacher_estimates`
     * vẫn còn nguyên để tra lại.
     */

    /*
     * 8b. PHƯƠNG ÁN HỖ TRỢ CÓ CẦN DUYỆT KHÔNG (owner chốt 10/09/2026).
     *
     * Dữ liệu cũ không có khái niệm này, nên mọi việc đã ghi đều để `needs_approval = 0`:
     * chúng đã làm xong rồi, dựng ngược lại một trạng thái "đang chờ duyệt" cho quá khứ là
     * bịa ra một khâu chưa từng tồn tại.
     */
    for (const [c, d] of [
      ['needs_approval', 'INTEGER NOT NULL DEFAULT 0'], ['approval_state', 'TEXT'],
      ['approval_due', 'TEXT'], ['approval_by', 'INTEGER'], ['approval_at', 'TEXT'],
      ['approval_note', 'TEXT'],
    ] as const) addCol('case_interventions', c, d);
    conn.exec(`CREATE INDEX IF NOT EXISTS idx_intervention_approval
                 ON case_interventions(approval_state) WHERE approval_state = 'pending'`);
    });

    buoc(() => migrateSchedulingFields(conn, applied));
    buoc(() => migratePermissions(conn, applied));
    buoc(() => migrateAccounts(conn, applied));
    buoc(() => migrateWeekOnlySchedule(conn, applied));
    buoc(() => migrateNormalFourSkills(conn, applied));
    buoc(() => migrateMgmtTasks(conn, applied));
    buoc(() => migrateDropBranchAdmin(conn, applied));
    buoc(() => migrateNormalPassThreshold(conn, applied));
    buoc(() => migrateSkillSchedule(conn, applied)); 
    buoc(() => migrateNoShowMarks(conn, applied));
    buoc(() => migrateAttachments(conn, applied));
    buoc(() => migrateYThuc(conn, applied));
    buoc(() => migrateMoveRequests(conn, applied));
    buoc(() => migrateEntryBands(conn, applied));
    buoc(() => migrateReportHistory(conn, applied));
    /* CUỐI CÙNG: sau khi mọi bước thời Case Ý thức ở trên đã chạy xong, chuyển dữ liệu của mô hình đó sang mô hình mới. */
    buoc(() => migrateLegacyDisciplineCases(conn, applied));
    /* Sau cùng của các bước cấu trúc: rulebook v3 (PR-T) thêm cột/bảng trên những bảng mà các bước trên đã dựng đủ. */
    buoc(() => migrateSosV3(conn, applied));
    /* PR-OV9 (ngay sau rulebook v3, TRƯỚC mọi bước dùng `LA_CASE_SOS`): cột sos_cases.kck — Case nhẹ của em KCK (chỉ thêm cột). */ buoc(() => migratePrOv9(conn, applied));
    buoc(() => migrateDeleteInvalidViolations(conn, applied));
    /* PR-S1: hai cột của luật máy chủ (S16/S17, S11). */
    buoc(() => migrateLuatMayChu(conn, applied));
    /* PR-AN: bảng giới hạn số lần thử (AN-1). */
    buoc(() => migrateAuthAttempts(conn, applied));
    /* PR-S2: lịch sử điều chỉnh PA học thuật + hai cột cập nhật tuần rút gọn. */
    buoc(() => migrateDieuChinhPa(conn, applied));
    /* PR-Ra: người cần hỗ trợ khi Tạm ngưng, lý do dời hạn, nháp/nộp báo cáo, nối báo cáo ↔ việc. */
    buoc(() => migrateCongViec(conn, applied));
    /* PR-LT: Lộ trình tiếp theo, end_kind, khu Lưu trữ. */
    buoc(() => migrateLenLop(conn, applied));
    /* PR-XOA: cột users.deleted_at (xoá mềm tài khoản) + đưa em đã thôi học vào Lưu trữ (một lần). */
    buoc(() => migrateXoaDuLieu(conn, applied));
    /* PR-N1: hạn ghi kết quả PA hết Thứ Hai (R-PA5). */ buoc(() => migratePrN1(conn, applied));
    /* PR-LOP: số tuần lớp, RF, Pre FOU, đổi tên lớp (T2, T78). */
    buoc(() => migratePrLop(conn, applied));
    /* OV-6b1 (ngay sau PR-LOP, TRƯỚC mọi bước có thể xếp lịch MT): tuần MT lộ trình + ngưỡng đạt vào cấu hình, bản chụp cho mọi lớp cũ. */ buoc(() => migratePrOv6b1(conn, applied));
    /* OV-6b2 (ngay sau OV-6b1, TRƯỚC mọi bước gọi mã nghiệp vụ đọc `classes.moc_lap`): cột Checkpoint mỗi n tuần + chèn PET, KET. */ buoc(() => migratePrOv6b2(conn, applied));
    /* PR-DUYET: hộp Chờ duyệt (bảng yeu_cau_duyet + thẻ từ hai luồng cũ), tasks.assignee_name, notifications.duong. */
    buoc(() => migratePrDuyet(conn, applied));
    /* PR-MT: cột lich_su (MT lịch sử, T34). */ buoc(() => migratePrMt(conn, applied));
    /* PR-NHAP: email học viên + ngày thi dự kiến (T8, T9). */
    buoc(() => migratePrNhap(conn, applied));
    /* PR-KCK: Target "không cam kết" (Q29-1). */ buoc(() => migratePrKck(conn, applied));
    /* PR-SOS: hạn xác nhận Case SOS + loại mốc PA quy chế (Q28-3). */ buoc(() => migratePrSos(conn, applied));
    /* PR-YT4: Ý thức v4 — ghi nhận vi phạm, ngày QL quyết, bảng khai bậc (chỉ cấu trúc). */
    buoc(() => migratePrYt4(conn, applied));
    /* PR-HSM: nhận xét W/S + GV chấm Speaking (T39). */ buoc(() => migratePrHsm(conn, applied));
    /* PR-LT2a: nhóm PA bổ trợ Giữa khoá + hạn nộp kế hoạch (M-03, M-05) — chỉ cấu trúc. */ buoc(() => migratePrLt2a(conn, applied));
    /* PR-LT2b: Mini Test + kỳ vọng đầu ra (Cuối khoá lớp thường). */ buoc(() => migratePrLt2b(conn, applied));
    /* PR-CT: lệnh chuyển lớp + bàn giao (chỉ cấu trúc). Thứ tự thật: PR-CT rồi mới PR-Pb2-b (PR-Dọn: bỏ câu "luôn đứng cuối" đã sai). */ buoc(() => migratePrCt(conn, applied));
    /* PR-Pb2-b: ngày nhập đầu ô điểm + hạn xử lý chốt, ngày phản hồi vi phạm (chỉ cấu trúc). */ buoc(() => migratePrPb2b(conn, applied));
    /* PR-DEPLOY (0b-3): lớp + chương trình gốc của Case (chỉ cấu trúc; chép cho Case có sẵn chỉ khi vừa thêm cột). */ buoc(() => migratePrDeploy(conn, applied));
    /* PR-QU: `case.close` cho vai Giáo viên, một lần (`class.create` mới đã đi qua `migratePermissions`). */ buoc(() => migratePrQu(conn, applied));
    /* PR-GVa: khoá gửi mỗi lần mở form cho việc, PA, lần xem lại (chỉ thêm). */ buoc(() => migratePrGva(conn, applied));
    /* PR-PHH: bản chụp 4 nội dung Báo phụ huynh lúc xác nhận (chỉ thêm cột, không điền ngược). */ buoc(() => migratePrPhh(conn, applied));
    /* PR-K26: gộp hướng `chua_ro` + `xep_sau` → `chua_quyet` (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrK26(conn, applied));
    /* PR-MTa: cờ `attempt_skills.huy_vang` + bảng `ket_qua_huy` (chỉ cấu trúc, không điền ngược). */ buoc(() => migratePrMta(conn, applied));
    /* PR-LUI-a1: cột violations.ten (chỉ thêm cột, dòng cũ tự tách khi đọc). */ buoc(() => migratePrLuiA1(conn, applied));
    /* PR-LUI-a2: Người phụ trách của lần ghi kết quả PA (chỉ thêm cột). */ buoc(() => migratePrLuiA2(conn, applied));
    /* PR-TK: bản chụp lộ trình lúc đóng + cột thi thật + điền ngược (chỉ thêm, chạy lặp được). */ buoc(() => migratePrTk(conn, applied));
    /* PR-LCb (TRƯỚC PR-LC — phán quyết R-B1): cột lo_trinh_tiep_theo.huong_gvcn + điền bù từ Hướng GVCN trước khi PR-LC đồng bộ Hướng theo lệnh. */ buoc(() => migratePrLcb(conn, applied));
    /* PR-LC: quyết định Cuối khoá đang chờ → Lộ trình tiếp theo + MT0 theo quyết định (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrLc(conn, applied));
    /* PR-PA (§8): Số buổi PA / Kết quả + nhật ký Sửa PA (chỉ thêm cột) + điền bù Bổ trợ miễn phí, Tutor kỳ vọng. */ buoc(() => migratePrPa(conn, applied));
    /* PR-CT2 (SAU PR-PA): A điền bù Số buổi tuần này cho Kết quả cũ PA Tutor kỳ vọng (một lần, khoá demo_config) · B chạy PA bổ trợ còn chờ kế hoạch + đóng thẻ kế hoạch · C sinh bổ trợ Final cho lệnh lên đang chờ đã đủ điểm. */ buoc(() => migratePrCt2(conn, applied));
    /* PR-OV2a: vai Admin / TVV / CX + students.consultant_user_id + demo_sessions.goc_nhin (chỉ thêm, chạy lặp được). */ buoc(() => migratePrOv2(conn, applied));
    /* PR-OV8b (SAU PR-OV2a — cần vai TVV / CX): quyền hẹp `student.edit_more` cho TVV, CX (một lần, khoá demo_config). */ buoc(() => migratePrOv8b(conn, applied));
    /* OV-3b: bảng nháp lộ trình + cột đề xuất Kết quả đầu ra + ban_giao_mon.lam_lai; vừa tạo bảng thì chép Hướng GVCN chưa có quyết định thành nháp. */ buoc(() => migratePrOv3b(conn, applied));
    /* PR-OV1b: dấu "-" cũ theo luật mới (đổi dữ liệu). HOTFIX-3: không chạy nữa — chạy mọi lần migrate đã đổi "-" mới của ca trộn thành Không dự thi (deploy 15/10); chỉ ghi khoá. */ buoc(() => khoaPrOv1b(conn, applied));
    /* PR-OV4a: ket_qua_huy.loai (doi_vuot | huy_luot) + dong_json — Huỷ cả lượt giữ điểm ẩn, Khôi phục lượt (chỉ thêm cột). */ buoc(() => migratePrOv4(conn, applied));
    /* PR-OV1c: Case SOS MT theo luật chốt — lượt chưa chốt đóng Case chưa ai đụng ("Chờ chốt SOS"), Overall đạt xoá SOS (đổi dữ liệu). OV-13a (d): không chạy nữa — chỉ ghi khoá. */ buoc(() => khoaPrOv1c(conn, applied));
    /* OV-8a: Bước tiếp sau thi thật — bốn cột ở learning_cycles (chỉ thêm, chạy lặp được). */ buoc(() => migratePrOv8a(conn, applied));
    /* OV-10b: liên hệ học viên — SĐT em, phụ huynh (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrOv10b(conn, applied));
    /* PR-OV11e (SAU prOv1b / prOv1c): lượt MT đã chốt chụp dấu KCK hiện tại — kết luận giữ như màn đang hiện (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrOv11e(conn, applied));
    /* PR-OV12a: hạn ghi kết quả PA → lịch kỳ hai tuần, hết Thứ Ba, không sớm hơn hạn cũ (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrOv12a(conn, applied));
    /* PR-EN: ngôn ngữ theo tài khoản — users.ngon_ngu (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrEn(conn, applied));
    /* PR-OV12b: assessment_scores.nhom_nguyen_nhan — nhóm nguyên nhân của ô MT dưới kỳ vọng (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrOv12b(conn, applied));
    /* PR-OV12c (SAU PR-OV12b — cần cột nhom_nguyen_nhan): Case MT chờ nguyên nhân → nguyên nhân từ nhận xét / việc Ghi nhận xét, thẻ Báo lên nguyên nhân đóng, nhãn SOS Progress (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrOv12c(conn, applied));
    /* PR-OV12h: bảng case_followup_buoi — Kết quả PA Tutor theo buổi (chỉ thêm bảng, chạy lặp được). */ buoc(() => migratePrOv12h(conn, applied));
    /* PR-OV12g: bảng Góp ý hàng tuần (chỉ cấu trúc, chạy lặp được). */ buoc(() => migratePrOv12g(conn, applied));
    /* PR-OV13a (SAU prOv1c / prOv12c): xoá Case "Chờ chốt SOS" cũ chưa ai đụng · PA quy chế kỹ năng đã đạt → Kết quả cuối · "đến lúc thi" → mốc MT cuối ·
       Case tạm cho lượt chưa chốt (đổi dữ liệu, chạy lặp được) — mỗi phần một giao dịch. */ for (const b of cacBuocPrOv13a(conn, applied)) buoc(b);
    /* OV-13e: users.requested_role — vai đề nghị khi tự đăng ký (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrOv13e(conn, applied));
    /* OV-13l: hạn bàn giao lệnh đang chờ chưa xác nhận = muộn hơn của (ra lệnh + 7 ngày) và hạn cũ, GVBM = GVCN (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrOv13l(conn, applied));
    /* OV-13n: bảng §5.3 bỏ "Trao đổi ngắn với HV" ở SOS 2–3 — việc điền sẵn chưa làm của lượt SOS 2–3 → bỏ (đổi dữ liệu, chạy lặp được). */ buoc(() => migratePrOv13n(conn, applied));
    /* OV-13m: learning_cycles.buoc_tiep_hen — Hẹn bắt đầu lộ trình mới sau thi (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrOv13m(conn, applied));
    /* HD-a: users.da_xem_huong_dan — dải "Mới dùng PISA?" nhớ theo tài khoản (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrHd(conn, applied));
    /* TD5: chỉ mục sos_cases(attempt_id, …) — giảm dòng đọc Turso (chỉ thêm chỉ mục, chạy lặp được). */ buoc(() => migratePrTd5(conn, applied));
    /* TD6: chỉ mục lượt (em, lớp), nhật ký (lộ trình, loại), thẻ chờ (loại, đối tượng) — giảm dòng đọc Turso (chỉ thêm chỉ mục, chạy lặp được). */ buoc(() => migratePrTd6(conn, applied));
    /* TD7a: chỉ mục ô S chờ GV phụ trách xem (một phần) + mốc Case theo lượt — câu "Xem nhận xét Speaking" thôi quét cả bảng (chỉ thêm chỉ mục, chạy lặp được). */ buoc(() => migratePrTd7a(conn, applied));
    /* OV-15e: chỉ mục ngày thi thật (Kết quả thi › Thi thật lọc theo khoảng) — chỉ thêm, chạy lặp được. */ buoc(() => migratePrOv15e(conn, applied));
    /* OV-15d: chỉ mục sos_cases(owner_user_id, status) — thông báo tự động Case theo người phụ trách (chỉ thêm chỉ mục, chạy lặp được). */ buoc(() => migratePrOv15d(conn, applied));
    /* TD7: chỉ mục một phần — lượt MT lịch sử chưa nhập, lộ trình FT chưa có kết quả thi thật (chỉ thêm chỉ mục, chạy lặp được). */ buoc(() => migratePrTd7(conn, applied));
    /* TD7b: cờ assessment_attempts.o_cho_tu (còn ô chờ điểm) + chỉ mục một phần + tính lại cho mọi lượt — Nợ điểm / Cần chấm thôi đọc lượt đã chấm xong (chạy lặp được). */ buoc(() => migratePrTd7b(conn, applied));
    /* OV-13p (SAU PR-OV2a — cần vai TVV / CX): `class.create` + `student.add` cho TVV, CX; `student.add` cho vai có `student.edit` (một lần, khoá demo_config). */ buoc(() => migratePrOv13p(conn, applied));
    /* OV-13q: lộ trình đã thi chưa xong mà hạn 1 tuần đã qua → hạn = hôm nay + 7 (đổi dữ liệu, chạy lặp không đổi). */ buoc(() => migratePrOv13q(conn, applied));
    /* OV-15c: bảng ghi_chu_lich_thi — ghi chú lịch thi ở Kế hoạch Test (chỉ thêm bảng, chạy lặp được). */ buoc(() => migratePrOv15c(conn, applied));
    /* TU-a (SAU migratePermissions): bảng tutors, tutor_nhan_xet, 9 cột buổi tutor, vai Head tutor (chỉ thêm, chạy lặp được). */ buoc(() => migratePrTu(conn, applied));
    /* TU-b (sau TU-a): chỉ mục một phần buổi tutor cần chú ý (chỉ thêm). */ buoc(() => migratePrTub(conn, applied));
    /* OV-15g: mốc bắt đầu Lịch sử thay đổi (chỉ thêm một dòng demo_config, chạy lặp không đổi). */ buoc(() => migratePrOv15g(conn, applied));
    /* OV-15i1: chỉ mục audit_logs(entity_type, action, entity_id) — Lịch sử góp ý tuần không đọc mọi dòng nhật ký của em (chỉ thêm, chạy lặp được). */ buoc(() => migratePrOv15i1(conn, applied));
    /* CV-LOI: Case mở chưa có người phụ trách → gán theo luật tạo Case (GV môn → GVCN), có lịch sử (đổi dữ liệu, chạy lặp không đổi). */ buoc(() => migratePrCvLoi(conn, applied));
    /* SL1: cột notifications.han — chuông Cần làm sắp theo hạn (chỉ thêm cột, chạy lặp được). */ buoc(() => migratePrSl1(conn, applied));
    /* SV-YT-TVV: bảng việc Báo PH của TVV (chỉ thêm bảng, chạy lặp được). */ buoc(() => migratePrSvYtTvv(conn, applied));

    conn.prepare("INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES ('case_engine_migrated_at', ?, ?)")
      .run(nowIso(), nowIso());
  conn.pragma('foreign_keys = ON');

  if (!applied.length) skipped.push('Mô hình case học vụ đã có sẵn, không cần nâng cấp.');
  return { applied, skipped };
}



/**
 * VÒNG 4 · PHASE 2 — TUẦN BẮT ĐẦU HỌC, LỊCH MT MẶC ĐỊNH, VÀ TÊN MÔN W.
 *
 * Ba việc, đều là thêm chứ không bỏ:
 *
 *   1. Cột mới cho tuần bắt đầu học (lớp và lộ trình), tháng thi dự kiến, mốc kiểm tra do
 *      người xếp lại, và cột ghi AI đã xếp tuần MT.
 *   2. Đổi mã môn `prep_writing` → `writing` ở MỌI chỗ dữ liệu nhắc tới nó. Đây là đổi mã
 *      thật trong database, không phải chỉ đổi nhãn — để sau này không ai phải nhớ hai mã
 *      cho một môn.
 *   3. Suy ngược tuần bắt đầu học cho dữ liệu cũ, CHỈ ở chỗ suy được chắc chắn.
 *
 * Chạy lần hai không đổi gì thêm: mỗi bước tự kiểm bằng sự tồn tại của cột hoặc bằng chính
 * giá trị đang có.
 */
/**
 * ĐỒNG BỘ BỘ QUYỀN với danh sách trong `shared/domain.ts`.
 *
 * Vòng 4 thêm quyền `case.view` — tách việc XEM danh sách case khỏi việc GHI NHẬN xử lý,
 * vì bảng bộ lọc ở mục 6 nói Admin chi nhánh vẫn ghi nhận được nhưng không có bốn bộ lọc
 * case. Trên database đang chạy, quyền mới phải được thêm và cấp lại cho đúng ba vai, nếu
 * không thì tài khoản cũ mở màn Học viên lên sẽ mất sạch bộ lọc case.
 *
 * Chạy lại lần hai không làm gì thêm: chỉ thêm phần CÒN THIẾU, không xoá quyền ai đã có.
 */
/**
 * TÀI KHOẢN VÀ ĐĂNG NHẬP (vòng 4 phase 4) trên database đang chạy.
 *
 * Thêm cột mật khẩu, trạng thái duyệt và bốn bảng mới; nạp bảng `routes` từ danh sách viết
 * cứng; và ĐẶT MẬT KHẨU cho những tài khoản cũ chưa có, nếu không thì sau khi cập nhật
 * không ai đăng nhập được vào chính dữ liệu của mình.
 *
 * Email suy từ tên theo đúng quy ước `ten.pisa@gmail.com`. Tài khoản nào đã có email thì giữ
 * nguyên — không ghi đè một địa chỉ người ta đang dùng.
 *
 * Chạy lại lần hai không làm gì thêm.
 */
function migrateAccounts(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('users')) return;

  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };
  for (const [c, d] of [
    ['phone', 'TEXT'],
    ['password_hash', 'TEXT'],
    ['password_salt', 'TEXT'],
    ['approval_state', "TEXT NOT NULL DEFAULT 'approved'"],
    ['requested_branches', 'TEXT'],
    ['requested_note', 'TEXT'],
    ['approved_by', 'INTEGER'],
    ['approved_at', 'TEXT'],
    ['decline_reason', 'TEXT'],
  ] as const) addCol('users', c, d);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS user_emails (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      email TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE (user_id, email));
    CREATE TABLE IF NOT EXISTS user_skills (
      user_id INTEGER NOT NULL REFERENCES users(id),
      skill TEXT NOT NULL, PRIMARY KEY (user_id, skill));
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      branch_id INTEGER REFERENCES branches(id),
      note TEXT, granted_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL,
      UNIQUE (user_id, permission_id, branch_id));
    CREATE TABLE IF NOT EXISTS routes (
      code TEXT PRIMARY KEY, name TEXT NOT NULL, note TEXT,
      seq INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
  `);
  const routes = seedRoutes(conn);

  /* Email và mật khẩu cho tài khoản cũ. Không đụng vào ai đã có sẵn. */
  const used = new Set(
    (conn.prepare('SELECT email FROM users WHERE email IS NOT NULL').all() as any[]).map((r: any) => r.email),
  );
  const emailFor = (name: string) => {
    const parts = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd').toLowerCase().split(/\s+/).filter(Boolean);
    const stem = ((parts[parts.length - 1] ?? 'nv') + (parts[0] ? `.${parts[0]}` : '')).replace(/[^a-z0-9.]/g, '');
    let local = stem; let n = 1;
    while (used.has(`${local}${EMAIL_SUFFIX}`)) { n += 1; local = `${stem}${n}`; }
    used.add(`${local}${EMAIL_SUFFIX}`);
    return `${local}${EMAIL_SUFFIX}`;
  };

  /*
   * TURSO (bản chính, PR-Z2 22/09): hai việc dưới đây là của BẢN DEMO — gán mật khẩu mặc định ai cũng biết cho tài khoản
   * chưa có mật khẩu, và tạo tài khoản quản trị mặc định với mật khẩu đó. Trên dữ liệu thật đó là cửa sau, nên bỏ qua cả
   * hai. Tài khoản thật luôn được tạo kèm mật khẩu (`createAccount`, `register`, `init-ban-chinh`).
   */
  if (laDbTuXa()) {
    console.log('[migrate] Turso: bỏ qua tài khoản/mật khẩu mặc định của bản demo.');
    if (routes) applied.push(`Tài khoản và đăng nhập: nạp ${routes} lộ trình`);
    return;
  }

  let fixed = 0;
  for (const u of conn.prepare('SELECT id, full_name, email, password_hash FROM users').all() as any[]) {
    const email = u.email || emailFor(u.full_name);
    if (u.password_hash && u.email) continue;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    conn.prepare('UPDATE users SET email = ?, password_hash = ?, password_salt = ? WHERE id = ?')
      .run(email, u.password_hash ?? hash, u.password_salt ?? salt, u.id);
    fixed += 1;
  }

  /*
   * TÀI KHOẢN QUẢN TRỊ MẶC ĐỊNH của owner phải tồn tại kể cả trên database cũ — nếu không thì
   * sau khi cập nhật, chính người chủ hệ thống là người duy nhất không vào được.
   */
  let createdAdmin = false;
  if (!conn.prepare('SELECT 1 FROM users WHERE email = ?').get(DEFAULT_ADMIN_EMAIL)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    const n = (conn.prepare('SELECT COUNT(*) n FROM users').get() as any).n + 1;
    const info = conn
      .prepare(
        `INSERT INTO users (code, full_name, email, title, password_hash, password_salt,
                            approval_state, status, created_at)
         VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`,
      )
      .run(`NV${String(n).padStart(3, '0')}`, 'Đỗ Vũ Tuấn Phong', DEFAULT_ADMIN_EMAIL,
           'Quản trị hệ thống', hash, salt, nowIso());
    const role = conn.prepare("SELECT id FROM roles WHERE key = 'system_admin'").get() as any;
    if (role) {
      conn.prepare("INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,NULL,'active',?)")
        .run(Number(info.lastInsertRowid), role.id, nowIso());
    }
    createdAdmin = true;
  }

  const bits: string[] = [];
  if (routes) bits.push(`nạp ${routes} lộ trình`);
  if (fixed) bits.push(`đặt email và mật khẩu cho ${fixed} tài khoản`);
  if (createdAdmin) bits.push('tạo tài khoản Quản trị hệ thống mặc định');
  if (bits.length) applied.push(`Tài khoản và đăng nhập: ${bits.join(', ')}`);
}

function migratePermissions(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('permissions') || !has('roles') || !has('role_permissions')) return;

  let added = 0;
  const moi = new Set<string>();
  for (const [key, label] of Object.entries(PERMISSION_LABEL)) {
    const row = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(key) as any;
    if (row) continue;
    conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, label);
    moi.add(key);
    added += 1;
  }

  /*
   * Cấp quyền mới cho đúng những vai mà seed cấp — không tự ý nới cho vai khác.
   * PR-DEPLOY (DEP-2, phân quyền): CHỈ quyền VỪA THÊM ở lần chạy này. Trước đây mọi cặp vai–quyền mặc định đang thiếu đều được cấp lại ở
   * MỖI lần migrate — Quản trị gỡ một quyền (Quản trị › Vai trò) thì lần deploy sau quyền tự quay lại. PR sau muốn cấp quyền CŨ cho vai
   * thì viết bước migrate riêng.
   */
  let granted = 0;
  for (const [roleKey, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = conn.prepare('SELECT id FROM roles WHERE key = ?').get(roleKey) as any;
    if (!role) continue;
    for (const k of keys) {
      if (!moi.has(k)) continue;
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any;
      if (!perm) continue;
      const had = conn
        .prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
        .get(role.id, perm.id);
      if (had) continue;
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
        .run(role.id, perm.id);
      granted += 1;
    }
  }
  if (added || granted) applied.push(`Bổ sung ${added} quyền mới và ${granted} lượt cấp quyền cho vai trò`);
}

function migrateSchedulingFields(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };
  if (!has('classes') || !has('learning_cycles')) return;

  /* ------------------------------------------------------------- 1. cột mới */
  for (const [c, d] of [
    ['start_period_id', 'INTEGER REFERENCES report_periods(id)'],
    ['progress_week_override', 'INTEGER'],
    ['final_week_override', 'INTEGER'],
  ] as const) addCol('classes', c, d);

  for (const [c, d] of [
    ['start_period_id', 'INTEGER REFERENCES report_periods(id)'],
    ['exam_month', 'TEXT'],
  ] as const) addCol('learning_cycles', c, d);

  addCol('assessment_attempts', 'plan_source', "TEXT NOT NULL DEFAULT 'manual'");

  /* ------------------------------------------ 2. đổi mã môn prep_writing → writing */
  const renames: [string, string][] = [
    ['assessment_scores', 'skill'],
    ['class_skills', 'skill'],
    ['teacher_assignments', 'skill'],
    ['programme_skills', 'skill'],
    ['attempt_required_skills', 'skill'],
    ['attempt_skill_skips', 'skill'],
    ['teacher_estimates', 'skill'],
    ['sos_cases', 'topic'],
    ['case_issues', 'skill'],
    ['tasks', 'topic'],
  ];
  let renamed = 0;
  for (const [table, col] of renames) {
    if (!has(table) || !cols(table).includes(col)) continue;
    try {
      renamed += conn.prepare(`UPDATE ${table} SET ${col} = 'writing' WHERE ${col} = 'prep_writing'`).run().changes;
    } catch {
      /*
       * Bảng có ràng buộc duy nhất trên cột đó (ví dụ mỗi lớp một dòng cho mỗi kỹ năng) và
       * đã tồn tại sẵn dòng 'writing'. Bỏ dòng cũ thay vì dừng cả bước nâng cấp — dữ liệu
       * mới đã có đủ, giữ thêm dòng mã cũ chỉ làm hai kỹ năng hiện ra cho một môn.
       */
      conn.prepare(`DELETE FROM ${table} WHERE ${col} = 'prep_writing'`).run();
    }
  }
  if (renamed) applied.push(`Đổi mã môn Prep-Writing sang W ở ${renamed} bản ghi`);

  /*
   * Hạng mục của case cũng phải đổi theo: mã cũ ánh xạ về `writing2`, mã mới cũng vậy, nên
   * hạng mục không đổi — nhưng case nào chưa có hạng mục thì nay gắn được.
   */
  if (cols('sos_cases').includes('category')) {
    const fixed = conn
      .prepare(`UPDATE sos_cases SET category = 'writing2' WHERE category IS NULL AND topic = 'writing'`)
      .run().changes;
    if (fixed) applied.push(`Gắn hạng mục cho ${fixed} case môn W`);
  }

  /*
   * MỌI LƯỢT MT ĐÃ CÓ ĐỀU LÀ 'manual'.
   *
   * Chúng do người xếp từ trước, nên hệ thống không được phép tính lại và ghi đè. Cột mặc
   * định đã là 'manual' nên không phải làm gì — ghi lại ở đây để người đọc sau không tưởng
   * là bước nâng cấp bỏ sót.
   */
}

/** Thứ Hai của tuần chứa ngày đó. Chép lại ở đây vì bước nâng cấp phải tự đứng được. */
function mondayOfIso(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7;        // thứ Hai = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/**
 * VÒNG 5 — BỎ HẲN NGÀY THI, CHỈ CÒN TUẦN.
 *
 * Ba việc, làm trên dữ liệu đang có và KHÔNG xoá gì của người dùng:
 *
 *  1. Lượt MT nào chỉ có ngày mà chưa có tuần thì SUY RA TUẦN từ chính ngày đó trước, rồi
 *     mới bỏ hai cột ngày. Bỏ trước khi suy là làm mất lịch của người ta.
 *  2. Ngày làm bài của từng kỹ năng (`taken_on`) biến mất. Nó chỉ dùng để tính hạn và
 *     thời gian chấm, mà cả hai nay đếm theo tuần.
 *  3. Ngày thi IELTS cụ thể (`exam_date`) thành TUẦN DỰ KIẾN THI. Có ngày thì lấy tuần
 *     chứa ngày đó; tháng thi giữ nguyên như cũ.
 *
 * Hai quyền "Chốt ngày giờ trong tuần" và "Đổi lịch Speaking" bị gỡ khỏi mọi vai và mọi
 * cá nhân, vì việc chúng cho phép làm không còn tồn tại.
 */
function migrateWeekOnlySchedule(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('assessment_attempts') || !has('report_periods')) return;

  const ensurePeriodFor = (date: string): number | null => {
    const weekStart = mondayOfIso(date);
    const found = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart) as any;
    if (found) return found.id;
    const d = new Date(weekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 3);                       // thứ Năm quyết định tháng sở hữu
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const weekEnd = (() => {
      const e = new Date(weekStart + 'T00:00:00Z');
      e.setUTCDate(e.getUTCDate() + 6);
      return e.toISOString().slice(0, 10);
    })();
    const before = conn
      .prepare(`SELECT COUNT(*) AS n FROM report_periods WHERE year = ? AND month = ? AND week_start < ?`)
      .get(year, month, weekStart) as any;
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const weekNo = (before?.n ?? 0) + 1;
    conn
      .prepare(
        `INSERT INTO report_periods (week_start, week_end, year, month, week_no, code, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(weekStart, weekEnd, year, month, weekNo, `W${weekNo} ${MONTHS[month - 1]} ${year}`, new Date().toISOString());
    return (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart) as any)?.id ?? null;
  };

  /* --------------------------------------------- 1. mã tuần phải kèm NĂM */
  let recoded = 0;
  for (const r of conn.prepare('SELECT id, week_start, year, month, week_no, code FROM report_periods').all() as any[]) {
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const want = `W${r.week_no} ${MONTHS[r.month - 1]} ${r.year}`;
    if (r.code !== want) {
      conn.prepare('UPDATE report_periods SET code = ? WHERE id = ?').run(want, r.id);
      recoded += 1;
    }
  }
  if (recoded) applied.push(`Thêm năm vào mã tuần của ${recoded} tuần (W1 SEP → W1 SEP 2026)`);

  /* --------------------------------------------- 2. suy tuần rồi bỏ cột ngày */
  const attemptCols = cols('assessment_attempts');
  if (attemptCols.includes('lrw_scheduled_at')) {
    let inferred = 0;
    for (const a of conn
      .prepare(`SELECT id, lrw_scheduled_at FROM assessment_attempts
                 WHERE planned_period_id IS NULL AND lrw_scheduled_at IS NOT NULL`)
      .all() as any[]) {
      const pid = ensurePeriodFor(String(a.lrw_scheduled_at).slice(0, 10));
      if (!pid) continue;
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(pid, a.id);
      inferred += 1;
    }
    if (inferred) applied.push(`Suy tuần MT cho ${inferred} lượt chỉ có ngày mà chưa có tuần`);

    conn.exec('ALTER TABLE assessment_attempts DROP COLUMN lrw_scheduled_at');
    if (cols('assessment_attempts').includes('speaking_scheduled_at')) {
      conn.exec('ALTER TABLE assessment_attempts DROP COLUMN speaking_scheduled_at');
    }
    applied.push('Bỏ ngày buổi L/R/W và ngày Speaking — một lượt MT nay chỉ thuộc một tuần');
  }

  /* --------------------------------------------- 3. bỏ ngày làm bài của từng kỹ năng */
  if (has('assessment_scores') && cols('assessment_scores').includes('taken_on')) {
    conn.exec('ALTER TABLE assessment_scores DROP COLUMN taken_on');
    applied.push('Bỏ ngày làm bài riêng của từng kỹ năng — hạn và thời gian chấm đếm theo tuần');
  }

  /* --------------------------------------------- 4. ngày thi IELTS → tuần dự kiến thi */
  /*
   * PR-DEPLOY (DEP-2, lỗi MẤT DỮ LIỆU): chỉ DB đời trước khi có `exam_period_id`. PR-NHAP (T9) thêm lại cột `exam_date` (ngày thi dự kiến
   * cụ thể) — chốt cũ "còn cột exam_date" khiến MỌI lần migrate xoá sạch ngày thi T9 rồi `migratePrNhap` thêm lại cột rỗng.
   */
  if (has('learning_cycles') && cols('learning_cycles').includes('exam_date') && !cols('learning_cycles').includes('exam_period_id')) {
    conn.exec('ALTER TABLE learning_cycles ADD COLUMN exam_period_id INTEGER REFERENCES report_periods(id)');
    let moved = 0;
    for (const c of conn
      .prepare('SELECT id, exam_date, exam_month FROM learning_cycles WHERE exam_date IS NOT NULL')
      .all() as any[]) {
      const day = String(c.exam_date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const pid = ensurePeriodFor(day);
      if (!pid) continue;
      // Tháng thi để trống thì điền theo chính ngày cũ — không làm mất thông tin đang có.
      conn
        .prepare(`UPDATE learning_cycles SET exam_period_id = ?,
                    exam_month = COALESCE(exam_month, ?) WHERE id = ?`)
        .run(pid, day.slice(0, 7), c.id);
      moved += 1;
    }
    conn.exec('ALTER TABLE learning_cycles DROP COLUMN exam_date');
    applied.push(`Đổi ngày thi IELTS thành tuần dự kiến thi (${moved} lộ trình có ngày cũ)`);
  }

  /* --------------------------------------------- 5. FT = Fast Track, không phải Full-time */
  if (has('classes') && cols('classes').includes('is_fulltime') && !cols('classes').includes('is_fast_track')) {
    conn.exec('ALTER TABLE classes RENAME COLUMN is_fulltime TO is_fast_track');
    applied.push('Đổi tên cột lớp FT cho đúng nghĩa Fast Track (dữ liệu giữ nguyên)');
  }

  /* --------------------------------------------- 6. gỡ hai quyền không còn việc để làm */
  if (has('permissions')) {
    const gone = ['schedule.date', 'schedule.speaking'];
    let removed = 0;
    for (const key of gone) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(key) as any;
      if (!perm) continue;
      for (const t of ['role_permissions', 'user_permissions']) {
        if (has(t)) removed += (conn.prepare(`DELETE FROM ${t} WHERE permission_id = ?`).run(perm.id) as any).changes;
      }
      conn.prepare('DELETE FROM permissions WHERE id = ?').run(perm.id);
    }
    if (removed) applied.push(`Gỡ quyền "Chốt ngày giờ" và "Đổi lịch Speaking" khỏi ${removed} lượt cấp quyền`);
  }
}

/**
 * VÒNG 5 — LỚP NORMAL CHỈ CÒN BỐN MÔN L/R/W/S, VÀ W KHÔNG CÒN LÀ W2.
 *
 * Hai việc trên dữ liệu đang có:
 *
 * 1. PRONUNCIATION → SPEAKING. Foundation trước đây gọi môn nói là Pronunciation. Hai môn
 *    đó đo cùng một thứ ở hai cái tên, nên mọi bảng tổng hợp phải cộng hai cột lại mới trả
 *    lời được "cả trung tâm yếu nói đến đâu".
 *
 *    NHƯNG KHÔNG GHI ĐÈ. Nếu một lượt đã có CẢ Pronunciation lẫn Speaking thì đó là hai
 *    điểm thật của hai lần chấm, và đổi tên một cái sẽ đè lên cái kia. Những lượt như vậy
 *    được ĐỂ NGUYÊN và báo ra thành một con số, để người phụ trách quyết định — máy không
 *    được tự chọn hộ điểm nào sống điểm nào chết.
 *
 * 2. CASE MÔN W TÁCH KHỎI W2. Vòng 4 xếp case môn Writing của lớp Normal vào hạng mục
 *    `writing2` của Fast Track; owner bác bỏ ở vòng 5. Đổi lại hạng mục và đặt lại khoá
 *    chống trùng cho đúng.
 */
function migrateNormalFourSkills(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);

  /* ------------------------------------------- 1. Pronunciation → Speaking, không ghi đè */
  if (has('assessment_scores')) {
    const clash = conn
      .prepare(
        `SELECT COUNT(*) AS n FROM assessment_scores p
          WHERE p.skill = 'pronunciation'
            AND EXISTS (SELECT 1 FROM assessment_scores s
                         WHERE s.attempt_id = p.attempt_id AND s.skill = 'speaking')`,
      )
      .get() as any;
    const moved = conn
      .prepare(
        `UPDATE assessment_scores SET skill = 'speaking'
          WHERE skill = 'pronunciation'
            AND NOT EXISTS (SELECT 1 FROM assessment_scores s
                             WHERE s.attempt_id = assessment_scores.attempt_id AND s.skill = 'speaking')`,
      )
      .run().changes;
    if (moved) applied.push(`Gộp ${moved} điểm Pronunciation vào môn Speaking`);
    if (clash?.n) {
      applied.push(
        `${clash.n} điểm Pronunciation ĐỂ NGUYÊN vì lượt đó đã có điểm Speaking riêng `
        + '— hai điểm thật của hai lần chấm, cần người xem và quyết định, máy không gộp hộ',
      );
    }
  }

  /* Phân công giáo viên và danh sách môn của chương trình: đổi thẳng, không có xung đột. */
  for (const [table, col] of [
    ['teacher_assignments', 'skill'],
    ['programme_skills', 'skill'],
    ['attempt_skill_skips', 'skill'],
    ['user_skills', 'skill'],
  ] as const) {
    if (!has(table) || !cols(table).includes(col)) continue;
    // Bỏ dòng sẽ trùng sau khi đổi tên, rồi mới đổi — tránh vi phạm ràng buộc duy nhất.
    try {
      conn.prepare(
        `DELETE FROM ${table} WHERE ${col} = 'pronunciation'
          AND EXISTS (SELECT 1 FROM ${table} b WHERE b.${col} = 'speaking'
                        AND b.rowid != ${table}.rowid)`,
      ).run();
    } catch { /* bảng không có ràng buộc phù hợp thì bỏ qua bước dọn */ }
    conn.prepare(`UPDATE ${table} SET ${col} = 'speaking' WHERE ${col} = 'pronunciation'`).run();
  }

  /* ------------------------------------------- 2. case môn W tách khỏi W2 */
  if (has('sos_cases') && cols('sos_cases').includes('category')) {
    const n = conn
      .prepare(
        `UPDATE sos_cases SET category = 'writing'
          WHERE category = 'writing2' AND topic IN ('writing', 'prep_writing')`,
      )
      .run().changes;
    // Case chủ đề Pronunciation nay thuộc hạng mục Speaking.
    const m = conn
      .prepare(`UPDATE sos_cases SET category = 'speaking', topic = 'speaking' WHERE topic = 'pronunciation'`)
      .run().changes;
    if (n) applied.push(`Tách ${n} case môn W của lớp Normal ra khỏi hạng mục Writing Task 2`);
    if (m) applied.push(`Chuyển ${m} case Pronunciation sang hạng mục Speaking`);
  }
}

/**
 * VÒNG 6 — BẢNG "TIẾN ĐỘ CÔNG VIỆC" (mục 8).
 *
 * Việc của Quản lý trước đây chỉ có tên, hạn và người nhận. Nay mỗi việc còn thuộc một
 * NHÓM, có thể có VIỆC CON một tầng, có người THEO DÕI, và mỗi lần cập nhật được ghi lại
 * thành một dòng lịch sử thay vì đè lên trạng thái cũ.
 *
 * Cơ sở dữ liệu dựng mới đã có sẵn từ `schema.sql`; hàm này chỉ vá cho cơ sở dữ liệu cũ.
 * Mọi bước đều kiểm tra trước nên chạy lại lần hai không đổi gì.
 */
function migrateMgmtTasks(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  let added = 0;
  for (const [c, d] of [
    ['group_key', 'TEXT'],
    ['parent_task_id', 'INTEGER REFERENCES tasks(id)'],
    ['watcher_user_id', 'INTEGER REFERENCES users(id)'],
    ['stop_reason', 'TEXT'],
    ['review_on', 'TEXT'],
  ] as const) {
    if (!cols('tasks').includes(c)) {
      conn.exec(`ALTER TABLE tasks ADD COLUMN ${c} ${d}`);
      added++;
    }
  }
  if (added) applied.push(`Bổ sung ${added} cột cho bảng Tiến độ công việc`);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS task_updates (
      id INTEGER PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      period_id INTEGER REFERENCES periods(id),
      progress TEXT NOT NULL,
      note TEXT,
      actor_user_id INTEGER REFERENCES users(id),
      updated_on TEXT NOT NULL,
      created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_task_update_task ON task_updates(task_id);   -- PR-DEPLOY (DEP-2c): đúng tên trong schema.sql (trước đây tên khác → DB mới có hai chỉ mục trùng sau migrate)
    CREATE TABLE IF NOT EXISTS task_case_links (
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      case_id INTEGER NOT NULL REFERENCES sos_cases(id),
      created_at TEXT NOT NULL,
      PRIMARY KEY (task_id, case_id));
    CREATE INDEX IF NOT EXISTS idx_task_parent ON tasks(parent_task_id);
  `);
}


/**
 * BỎ VAI TRÒ "ADMIN CHI NHÁNH" mà không đánh mất ai.
 *
 * Ba việc, theo đúng thứ tự đó:
 *
 *   1. Đánh dấu vai trò là ĐÃ BỎ chứ không xoá dòng. `user_roles` và nhật ký cũ còn trỏ
 *      vào nó; xoá đi thì lịch sử "ai đã làm gì" gãy ngay.
 *   2. Thu hồi các dòng phân quyền đang hiệu lực của vai đó, vì từ nay nó không cho phép
 *      làm gì nữa. Ghi mỗi lần thu hồi vào nhật ký, kèm TÊN người, để còn tra được.
 *   3. Người nào sau bước 2 KHÔNG CÒN VAI NÀO thì tài khoản vẫn giữ nguyên, chỉ chuyển
 *      sang trạng thái chờ phân công. Owner chốt rõ: không tự biến Admin cũ thành Quản lý
 *      toàn hệ thống, mà nêu tên ra để người có thẩm quyền quyết.
 */
function migrateDropBranchAdmin(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('roles') || !has('user_roles')) return;

  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!cols('roles').includes('status')) {
    conn.exec("ALTER TABLE roles ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }

  const role = conn.prepare("SELECT id FROM roles WHERE key = 'branch_admin'").get() as any;
  if (!role) return;

  const already = conn.prepare("SELECT status FROM roles WHERE id = ?").get(role.id) as any;
  if (already?.status === 'retired') return;

  conn.prepare("UPDATE roles SET status = 'retired' WHERE id = ?").run(role.id);

  /* Quyền của vai đã bỏ không còn hiệu lực. Bảng role_permissions không có cột trạng thái
     nên ở đây xoá đúng các dòng nối vai–quyền; bản thân vai và quyền vẫn còn để đọc. */
  const perms = has('role_permissions')
    ? conn.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(role.id).changes
    : 0;

  const grants = conn
    .prepare(
      `SELECT ur.id, ur.user_id, u.full_name, b.name AS branch
         FROM user_roles ur
         JOIN users u ON u.id = ur.user_id
    LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE ur.role_id = ? AND ur.status = 'active'`,
    )
    .all(role.id) as any[];

  for (const g of grants) {
    conn.prepare("UPDATE user_roles SET status = 'retired' WHERE id = ?").run(g.id);
    conn
      .prepare(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label,
                                 before_json, after_json, created_at)
         VALUES (NULL, 'role.retired', 'user', ?, ?, ?, ?, ?)`,
      )
      .run(
        g.user_id,
        g.full_name,
        JSON.stringify({ role: 'branch_admin', branch: g.branch ?? null, status: 'active' }),
        JSON.stringify({ role: 'branch_admin', branch: g.branch ?? null, status: 'retired',
                         reason: 'Vai trò Admin chi nhánh đã bỏ sau PR15' }),
        nowIso(),
      );
  }

  const orphans = conn
    .prepare(
      `SELECT u.full_name FROM users u
        WHERE u.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.status = 'active')
          AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = ?)`,
    )
    .all(role.id) as any[];

  applied.push(
    `Bỏ vai trò Admin chi nhánh: thu hồi ${grants.length} phân quyền, gỡ ${perms} dòng quyền của vai đó`,
  );
  if (orphans.length) {
    applied.push(
      `CẦN PHÂN CÔNG LẠI — ${orphans.length} tài khoản không còn vai trò nào: ` +
        orphans.map((o: any) => o.full_name).join(', '),
    );
  }
}

/**
 * GHI DẤU VIỆC NÂNG NGƯỠNG ĐẠT CỦA LỚP NORMAL TỪ 60% LÊN 70%.
 *
 * Kết quả đạt/trượt của lớp Normal được TÍNH RA từ `điểm đạt / tổng điểm` mỗi lần đọc,
 * không lưu sẵn trong database. Nên bước nâng cấp này KHÔNG sửa một dòng dữ liệu nào:
 * điểm gốc giữ nguyên, kết luận đã ghi tay giữ nguyên, và không có khoản quá hạn nào
 * được sinh ngược về quá khứ.
 *
 * Việc duy nhất cần làm là ghi lại MỐC ĐỔI LUẬT. Một bài 62% hôm qua đọc là "đạt", hôm
 * nay đọc là "trượt"; ai đối chiếu với biên bản cũ phải tra ra được vì sao hai bên lệch.
 */
function migrateNormalPassThreshold(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('demo_config')) return;

  const key = 'normal_pass_threshold';
  const current = conn.prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as any;
  if (current?.value === '0.7') return;

  const from = current?.value ?? '0.6';
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)')
    .run(key, '0.7', nowIso());

  if (has('audit_logs')) {
    conn
      .prepare(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label,
                                 before_json, after_json, created_at)
         VALUES (NULL, 'rule.changed', 'scoring', NULL, 'Ngưỡng đạt lớp Normal', ?, ?, ?)`,
      )
      .run(
        JSON.stringify({ passThreshold: Number(from) }),
        JSON.stringify({ passThreshold: 0.7, note: 'Owner nâng ngưỡng đạt lớp Normal sau PR15' }),
        nowIso(),
      );
  }

  applied.push(
    `Ngưỡng đạt lớp Normal: ${Math.round(Number(from) * 100)}% → 70%. ` +
      'Không sửa điểm gốc, không xoá kết luận cũ, không sinh nợ quá hạn ngược về quá khứ.',
  );
}

/**
 * TÁCH LỊCH THI RA THEO TỪNG KỸ NĂNG (mục 10.1 · 18.1).
 *
 * Trước bước này một đợt kiểm tra chỉ có MỘT tuần dùng chung cho cả bốn kỹ năng. Sau bước
 * này mỗi kỹ năng có lịch, phạm vi, trạng thái thi và hạn chấm của riêng nó.
 *
 * NGUYÊN TẮC: chỉ chuyển những gì dữ liệu cũ THỰC SỰ NÓI, không bịa phần còn lại.
 *
 *   ✓ Tuần chung cũ trở thành tuần khởi tạo của cả bốn kỹ năng — đây là căn cứ có thật,
 *     và nó được đánh dấu 'auto' để ai đọc cũng biết chưa có ai chốt riêng cho kỹ năng nào.
 *   ✓ Kỹ năng từng bị đánh dấu "không mock" trở thành "ngoài phạm vi yêu cầu".
 *   ✓ Kỹ năng ĐÃ CÓ ĐIỂM được ghi là đã thi — có điểm thì chắc chắn đã thi.
 *
 *   ✗ KHÔNG bịa ngày thi chính xác. Dữ liệu cũ chỉ có tuần, nên bản mới cũng chỉ có tuần.
 *   ✗ KHÔNG bịa xác nhận có mặt cho kỹ năng chưa có điểm: ô trống có thể là chưa chấm,
 *     không được đọc thành "em đã thi" mà cũng không được đọc thành "em vắng".
 *   ✗ KHÔNG bịa nguyên nhân vắng. Không dòng nào ra khỏi bước này với trạng thái 'absent'.
 *   ✗ KHÔNG sinh nợ quá hạn ngược về quá khứ: hạn được TÍNH RA mỗi lần đọc từ tuần thi,
 *     không lưu sẵn, nên không có khoản nợ nào được dựng thêm ở đây.
 *
 * Giữ nguyên định danh đợt, điểm, người nhập, liên kết case và toàn bộ lịch sử. Chạy lại
 * lần hai là no-op: những đợt đã có đủ bốn dòng bị bỏ qua.
 */
function migrateSkillSchedule(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('assessment_attempts') || !has('assessment_scores')) return;

  conn.exec(`
    CREATE TABLE IF NOT EXISTS attempt_skills (
      id INTEGER PRIMARY KEY,
      attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
      skill TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1,
      scope_reason TEXT,
      scope_by INTEGER REFERENCES users(id),
      scope_at TEXT,
      planned_period_id INTEGER REFERENCES report_periods(id),
      plan_source TEXT NOT NULL DEFAULT 'auto',
      sit_status TEXT NOT NULL DEFAULT 'scheduled',
      sit_by INTEGER REFERENCES users(id),
      sit_at TEXT,
      sit_note TEXT,
      deadline_override TEXT,
      deadline_override_by INTEGER REFERENCES users(id),
      deadline_override_at TEXT,
      deadline_override_reason TEXT,
      absence_move_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      UNIQUE (attempt_id, skill));
    CREATE INDEX IF NOT EXISTS idx_attempt_skills_attempt ON attempt_skills(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_attempt_skills_period ON attempt_skills(planned_period_id);
  `);

  const now = nowIso();
  const skills = ['listening', 'reading', 'writing', 'speaking'];
  /* Ô nhập điểm nào thuộc về kỹ năng đánh giá nào — Writing gồm cả hai task. */
  const entryOf: Record<string, string[]> = {
    listening: ['listening'], reading: ['reading'],
    writing: ['writing1', 'writing2'], speaking: ['speaking'],
  };

  /*
   * PR-MON (PF6): lượt của lớp Pre FOU chỉ có MỘT dòng `tong_hop` — không phải "thiếu ba dòng". Bỏ qua lớp Pre FOU, nếu không
   * mỗi lần migrate sẽ chèn thêm L R W S vào lượt Pre FOU.
   */
  const coCt = (conn.prepare('PRAGMA table_info(classes)').all() as any[]).some((c) => c.name === 'programme_code');
  const attempts = conn
    .prepare(
      `SELECT a.id, a.planned_period_id, a.status
         FROM assessment_attempts a
        WHERE (SELECT COUNT(*) FROM attempt_skills ask WHERE ask.attempt_id = a.id) < 4${coCt
          /* OV-6b2: cả chương trình Quản trị tạo (PET L+S R+W…) — bộ môn của nó không phải bốn ô L R W S. */
          ? ` AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.id = a.class_id AND c.programme_code IS NOT NULL AND c.programme_code NOT IN ('FT', 'FOU', 'BE', 'ELE'))` : ''}`,
    )
    .all() as any[];
  if (!attempts.length) return;

  const hasSkips = has('attempt_skill_skips');
  let created = 0;
  let sat = 0;
  let outOfScope = 0;

  for (const a of attempts) {
    const skipped = new Set<string>(
      hasSkips
        ? (conn.prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(a.id) as any[])
            .map((r: any) => r.skill as string)
        : [],
    );
    const scored = new Set<string>(
      (conn.prepare('SELECT skill FROM assessment_scores WHERE attempt_id = ? AND band IS NOT NULL').all(a.id) as any[])
        .map((r: any) => r.skill as string),
    );
    for (const skill of skills) {
      const exists = conn.prepare('SELECT 1 FROM attempt_skills WHERE attempt_id = ? AND skill = ?').get(a.id, skill);
      if (exists) continue;
      const isRequired = skipped.has(skill) ? 0 : 1;
      /*
       * "Đã thi" CHỈ khi mọi ô nhập điểm của kỹ năng đó đã có band. Writing có W1 mà chưa
       * có W2 thì chưa kết luận gì — đúng như cách band Writing được tính.
       */
      const didSit = entryOf[skill].every((k) => scored.has(k));
      const sitStatus = a.status === 'cancelled' ? 'cancelled' : didSit ? 'sat' : 'scheduled';
      conn
        .prepare(
          `INSERT INTO attempt_skills (attempt_id, skill, required, scope_reason, planned_period_id,
                                       plan_source, sit_status, sit_note, created_at)
           VALUES (?,?,?,?,?, 'auto', ?,?,?)`,
        )
        .run(
          a.id, skill, isRequired,
          isRequired ? null : 'Chuyển từ đánh dấu "không mock" của bản trước',
          a.planned_period_id ?? null,
          sitStatus,
          didSit ? 'Suy từ việc đã có điểm ở bản trước' : null,
          now,
        );
      created += 1;
      if (didSit) sat += 1;
      if (!isRequired) outOfScope += 1;
    }
  }

  applied.push(
    `Tách lịch thi theo kỹ năng: dựng ${created} dòng cho ${attempts.length} đợt kiểm tra. `
      + `${sat} kỹ năng đã có điểm được ghi là đã thi, ${outOfScope} kỹ năng chuyển sang "ngoài phạm vi yêu cầu". `
      + 'Tuần thi của từng kỹ năng lấy từ tuần chung cũ và đánh dấu "chưa ai chốt riêng"; '
      + 'không bịa ngày thi, không bịa xác nhận có mặt, không bịa nguyên nhân vắng.',
  );

  /*
   * TUẦN KẾ HOẠCH HOÀN TẤT (mục 10.7) sau bước này bằng đúng tuần chung cũ, vì cả bốn kỹ
   * năng vừa được khởi tạo cùng một tuần. Nên KHÔNG có đợt nào bị đổi tuần ở đây, và không
   * bảng báo cáo theo tuần nào đổi kết quả chỉ vì chạy nâng cấp.
   */
  if (has('audit_logs')) {
    conn
      .prepare(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label,
                                 before_json, after_json, created_at)
         VALUES (NULL, 'rule.changed', 'scheduling', NULL, 'Lịch thi và hạn chấm theo từng kỹ năng', ?, ?, ?)`,
      )
      .run(
        JSON.stringify({ schedule: 'một tuần chung cho cả đợt', deadline: 'một hạn chung cho cả đợt' }),
        JSON.stringify({
          schedule: 'mỗi kỹ năng một tuần thi riêng',
          deadline: 'FT hết thứ Tư tuần sau tuần thi của kỹ năng đó; Normal hết Chủ nhật tuần thi',
          note: 'Owner chốt sau PR15. Tuần kế hoạch hoàn tất của đợt = tuần muộn nhất trong các kỹ năng bắt buộc.',
        }),
        now,
      );
  }
}

/**
 * FORM CASE VÒNG 7: mức độ hai bậc, phân loại bắt buộc, Ý thức/Khác gộp theo đợt
 * (mục 6.3 · 6.4 · 7 · 18.1).
 *
 * Nguyên tắc xuyên suốt của bước này: **không đoán hộ người dùng.** Dữ liệu cũ thiếu gì thì
 * ghi nhận là thiếu và để người có trách nhiệm rà, chứ không điền bừa một giá trị cho đủ ô.
 * Một phân loại đoán sai còn tệ hơn một ô trống, vì nó sẽ được cộng vào báo cáo.
 */
/**
 * FORM PHƯƠNG ÁN VÀ BẢNG HẠN CỦA VÒNG 7 (mục 8.2 · 8.3).
 *
 * Hai thay đổi, và cả hai đều KHÔNG được bịa nợ ngược về quá khứ:
 *
 *   1. Thêm chỗ ghi "lùi lịch thi thì lùi cái gì". Đề xuất cũ để trống — bước nâng cấp
 *      không đoán hộ, vì đoán sai là sửa nhầm lịch thi thật của một em.
 *   2. Tách hạn CẬP NHẬT khỏi ngày DỰ KIẾN KẾT THÚC. Trước đây hai cột mang cùng một con
 *      số, nên "đến lúc báo tiến độ" và "đến hạn xong việc" lẫn vào nhau.
 *
 * Với phương án CŨ ĐANG CHẠY, hạn cập nhật đặt là CHỦ NHẬT SẮP TỚI tính từ hôm nay, KHÔNG
 * phải Chủ nhật đầu tiên kể từ ngày nó bắt đầu. Cách thứ hai đúng về luật nhưng sai về
 * người: nó biến mọi phương án đang chạy thành quá hạn ngay lúc nâng cấp, vì nghĩa vụ cập
 * nhật hằng tuần hôm qua chưa tồn tại. Nghĩa vụ mới bắt đầu từ hôm nay.
 */
/**
 * BẢNG ĐỀ NGHỊ DỜI DO VẮNG (mục 10.6).
 *
 * Chỉ TẠO BẢNG, không suy ngược lịch sử. Dữ liệu cũ không ghi lại "lần dời này là do em
 * vắng hay do Quản lý sắp lại lịch", nên mọi con số đếm ngược đều là đoán — và đoán sai ở
 * đây nghĩa là một em bị coi như đã tiêu hết lượt dời mà chưa từng vắng buổi nào.
 *
 * Bộ đếm cũ (nếu có) giữ nguyên; bộ đếm mới bắt đầu đếm từ những lần vắng kể từ hôm nay.
 */
/**
 * BAND ĐẦU VÀO TỪNG KỸ NĂNG (mục 12.1) — chỉ THÊM CHỖ GHI, không suy ngược gì.
 *
 * Dữ liệu cũ chỉ có OVR đầu vào. Không được lấy OVR điền vào cả bốn môn: một em vào học với
 * OVR 5.5 hoàn toàn có thể là Listening 6.0 và Writing 4.5, và ghi 5.5 cho cả bốn là bịa ra
 * bốn con số chưa ai đo. Bốn cột mới để trống cho tới khi có người nhập điểm thật.
 */
function migrateEntryBands(conn: any, applied: string[]) {
  const cols = (conn.prepare('PRAGMA table_info(learning_cycles)').all() as any[]).map((c: any) => c.name);
  const want = ['baseline_listening', 'baseline_reading', 'baseline_writing', 'baseline_speaking'];
  const missing = want.filter((c) => !cols.includes(c));
  if (!missing.length) return;
  for (const c of missing) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${c} REAL`);
  applied.push(
    'Thêm chỗ ghi band đầu vào từng kỹ năng (mục 12.1). Dữ liệu cũ chỉ có OVR và KHÔNG được '
      + 'suy ra bốn môn: một em OVR 5.5 có thể là Listening 6.0 và Writing 4.5.',
  );
}

/**
 * LỊCH SỬ CHỈNH SỬA BÁO CÁO KỲ HỌP (mục 14.2).
 *
 * KHÔNG dựng ngược lịch sử từ nội dung hiện tại: một dòng "đã sửa" mà không biết ai sửa và
 * sửa lúc nào là một dòng bịa. Lịch sử bắt đầu từ lần lưu tiếp theo, và bảng nói rõ như vậy.
 */
function migrateReportHistory(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (has('unit_report_history')) return;
  conn.exec(`
    CREATE TABLE unit_report_history (
      id INTEGER PRIMARY KEY,
      reporting_unit_id INTEGER NOT NULL REFERENCES reporting_units(id),
      period_id INTEGER NOT NULL REFERENCES report_periods(id),
      category_key TEXT NOT NULL,
      status TEXT,
      note TEXT,
      actor_user_id INTEGER REFERENCES users(id),
      at TEXT NOT NULL);
    CREATE INDEX idx_urh_cell ON unit_report_history(reporting_unit_id, period_id, category_key);
  `);
  applied.push('Thêm lịch sử chỉnh sửa báo cáo kỳ họp (bắt đầu ghi từ lần lưu tiếp theo)');
}

function migrateMoveRequests(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (has('skill_move_requests')) return;
  conn.exec(`
    CREATE TABLE skill_move_requests (
      id INTEGER PRIMARY KEY,
      attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
      skill TEXT NOT NULL,
      move_no INTEGER NOT NULL,
      from_period_id INTEGER REFERENCES report_periods(id),
      to_period_id INTEGER NOT NULL REFERENCES report_periods(id),
      reason TEXT,
      requested_by INTEGER REFERENCES users(id),
      requested_on TEXT NOT NULL,
      decide_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      decided_by INTEGER REFERENCES users(id),
      decided_at TEXT,
      decision_note TEXT,
      cancelled_part INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      UNIQUE (attempt_id, skill, move_no));
    CREATE INDEX idx_move_req_attempt ON skill_move_requests(attempt_id);
    CREATE INDEX idx_move_req_open ON skill_move_requests(status, decide_by) WHERE status = 'pending';
  `);
  applied.push(
    'Thêm chỗ ghi đề nghị dời lịch do vắng (mục 10.6). Lịch sử cũ KHÔNG được suy ngược: '
      + 'dữ liệu trước đây không phân biệt dời do vắng với dời chủ động, nên bộ đếm mới '
      + 'bắt đầu từ những lần vắng kể từ nay.',
  );
}

/**
 * DẤU '-' "KHÔNG CÓ BÀI" Ở Ô ĐIỂM (PR-G, rule book §17.1): năm cột trên `assessment_scores`.
 *
 * Chỉ THÊM CỘT, không suy ra gì từ dữ liệu cũ: chưa có ô nào từng mang dấu '-' nên không có gì để điền,
 * và không có lần vắng nào được sinh ngược. Idempotent — chạy lại không làm gì.
 */
/**
 * KHO TỆP VÀ LIÊN KẾT (PR-N N5). Chỉ TẠO bảng mới nếu chưa có — không đụng dữ liệu cũ vì chưa từng có chỗ nào lưu tệp.
 * Idempotent: chạy lại không làm gì.
 */
function migrateAttachments(conn: any, applied: string[]) {
  if (conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'attachments'").get()) return;
  conn.exec(`
    CREATE TABLE attachments (
      id INTEGER PRIMARY KEY,
      owner_type TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      url TEXT NOT NULL,
      display_name TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );
    CREATE INDEX idx_attachment_owner ON attachments(owner_type, owner_id);
  `);
  applied.push('Thêm kho tệp và liên kết dùng chung (bảng attachments) cho bằng chứng của case, phương án, vi phạm và phương án xử lý. Chưa có tệp nào cũ nên không có gì được điền.');
}

/**
 * Ý THỨC MỚI — BỐN BẢNG VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (PR-J, 21/09/2026).
 *
 * DDL này chép từ `schema.sql` (nguyên văn từ đặc tả §4.1–§4.4) và chạy lặp lại không lỗi. Mô hình cũ (case Ý thức) không
 * được chuyển đổi ở đây — xem `migrateLegacyDisciplineCases` cho những gì được giữ lại từ dữ liệu cũ.
 */
const YTHUC_DDL = `
CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  -- Lộ trình lúc ghi. Dùng cho phạm vi chuỗi Thư cảnh cáo (Y02) và thống kê theo khoá.
  cycle_id INTEGER REFERENCES learning_cycles(id),
  -- Lớp em đang học lúc ghi. Giữ để chuyển lớp không mang lịch sử cũ sang lớp mới.
  class_id INTEGER REFERENCES classes(id),

  -- attendance | homework | conduct | classroom | other   (Y04 — NĂM nhóm)
  category TEXT NOT NULL,
  -- Môn GV đang dạy khi thấy. TÙY CHỌN: tự điền theo phân công, GV sửa được, bỏ trống được.
  -- Cần để đọc ra được câu "thiếu BTVN Writing" trong ví dụ mục 22 của nguồn.
  skill TEXT,

  occurred_on TEXT NOT NULL,          -- ngày XẢY RA, do GV khai; mặc định hôm nay
  reported_on TEXT NOT NULL,          -- ngày hệ thống ghi nhận; KHÁC occurred_on
  reported_by INTEGER NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,          -- bắt buộc, tối thiểu 10 ký tự

  -- TRẠNG THÁI HIỆU LỰC — chỉ HAI giá trị thật.
  -- Bốn trạng thái người dùng thấy (Chưa xử lý / Đang chuẩn bị xử lý / Đã xử lý / Không còn
  -- hiệu lực) là SUY RA, không lưu: ba cái đầu suy từ bảng nối, cái thứ tư là cột này.
  -- Lưu trạng thái xử lý ở đây là cách chắc chắn nhất để nó lệch với bảng nối.
  valid INTEGER NOT NULL DEFAULT 1,   -- 1 = còn hiệu lực | 0 = đã đánh dấu không chính xác
  invalid_reason TEXT,                -- bắt buộc khi valid = 0
  invalidated_by INTEGER REFERENCES users(id),
  invalidated_at TEXT,

  idempotency_key TEXT UNIQUE,        -- bấm hai lần hoặc thử lại sau lỗi mạng không tạo hai dòng
  created_at TEXT NOT NULL,
  updated_at TEXT,
  ghi_nhan_luc TEXT,
  ghi_nhan_boi INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_violation_student ON violations(student_id, occurred_on);
CREATE INDEX IF NOT EXISTS idx_violation_class ON violations(class_id, occurred_on);
CREATE INDEX IF NOT EXISTS idx_violation_valid ON violations(valid) WHERE valid = 1;

CREATE TABLE IF NOT EXISTS discipline_measures (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  class_id INTEGER REFERENCES classes(id),

  -- CHÍN LOẠI, xếp nhẹ đến nặng để BÀY RA. Thứ tự KHÔNG phải workflow bắt buộc (nguồn mục 20).
  --   talk_short | meeting_student | family_report | warning_1 |
  --   meeting_cx | warning_2 | suspension | warning_3 | other
  kind TEXT NOT NULL,
  -- Chỉ dùng khi kind = 'other': tên biện pháp do GVCN tự đặt. Bắt buộc lúc đó.
  custom_name TEXT,

  -- HAI TRẠNG THÁI, KHÔNG BA.
  --   preparing : còn sửa được — thêm hoặc bớt vi phạm, sửa ghi chú, đổi loại
  --   done      : đã thực hiện — chốt snapshot, không sửa danh sách vi phạm nữa
  -- KHÔNG có 'pending_approval': Y01 chốt GVCN tự làm hết, không có cửa duyệt.
  status TEXT NOT NULL DEFAULT 'preparing',

  owner_user_id INTEGER REFERENCES users(id),   -- người phụ trách, mặc định GVCN của lớp
  note TEXT,                                    -- nội dung hoặc ghi chú, dùng cả hai trạng thái

  -- Chỉ có khi status = 'done'. Bắt buộc lúc xác nhận.
  performed_on TEXT,                            -- ngày THỰC HIỆN THỰC TẾ, có thể khác hôm nay
  performed_by INTEGER REFERENCES users(id),    -- người thực hiện, khi có tài khoản
  performer_name TEXT,                          -- hoặc ghi tên khi không có tài khoản
  participants TEXT,                            -- người tham gia, dùng cho meeting_cx
  confirmed_by INTEGER REFERENCES users(id),    -- ai bấm Xác nhận
  confirmed_at TEXT,

  -- SỐ VI PHẠM LÚC XÁC NHẬN — ảnh chụp, không đếm lại.
  -- Nguồn mục 26: "giữ snapshot lịch sử". Nếu sau này một vi phạm trong nhóm bị đánh dấu không
  -- chính xác thì số này KHÔNG đổi (biện pháp đó đã thực sự được làm với n vi phạm), nhưng
  -- thống kê vi phạm thì loại nó ra. Hai câu hỏi khác nhau, hai con số khác nhau.
  violation_count_at_confirm INTEGER,

  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TEXT,
  quyet_luc TEXT
);
CREATE INDEX IF NOT EXISTS idx_measure_student ON discipline_measures(student_id, status);
CREATE INDEX IF NOT EXISTS idx_measure_class ON discipline_measures(class_id, status);
CREATE INDEX IF NOT EXISTS idx_measure_preparing ON discipline_measures(status) WHERE status = 'preparing';

-- MỘT vi phạm gắn NHIỀU biện pháp; MỘT biện pháp chứa NHIỀU vi phạm.
-- Không cài one-to-one, không cài one-to-many, không nhét foreign key vào bảng nào cả.
--
-- Ví dụ thật phải chạy được: một nhóm 6 vi phạm cùng lúc đi vào 3 biện pháp
-- (GV meeting + Report gia đình + Thư cảnh cáo lần 1), và một trong 6 vi phạm đó
-- còn nằm trong một Report của tháng trước.
CREATE TABLE IF NOT EXISTS measure_violations (
  measure_id INTEGER NOT NULL REFERENCES discipline_measures(id),
  violation_id INTEGER NOT NULL REFERENCES violations(id),
  added_by INTEGER REFERENCES users(id),
  added_at TEXT NOT NULL,
  PRIMARY KEY (measure_id, violation_id)
);
CREATE INDEX IF NOT EXISTS idx_mv_violation ON measure_violations(violation_id);

-- Nguồn mục 15: "giữ lịch sử thay đổi nếu phù hợp". Sửa mô tả, đổi nhóm, đổi ngày, hủy ghi nhận.
CREATE TABLE IF NOT EXISTS violation_history (
  id INTEGER PRIMARY KEY,
  violation_id INTEGER NOT NULL REFERENCES violations(id),
  field TEXT NOT NULL,           -- description | category | skill | occurred_on | valid
  old_value TEXT,
  new_value TEXT,
  reason TEXT,                   -- bắt buộc khi field = 'valid'
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vh_violation ON violation_history(violation_id);
`;

export function migrateYThuc(conn: any, applied: string[]) {
  const has = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const missing = ['violations', 'discipline_measures', 'measure_violations', 'violation_history'].filter((t) => !has(t));
  if (!missing.length) return;
  conn.exec(YTHUC_DDL);
  applied.push('Thêm bốn bảng Ý thức mới: vi phạm, phương án xử lý, bảng nối nhiều–nhiều và nhật ký sửa vi phạm.');
}

/**
 * CHUYỂN DỮ LIỆU CASE Ý THỨC CŨ SANG VI PHẠM VÀ BIỆN PHÁP XỬ LÝ, rồi GỠ mô hình cũ khỏi database (PR-J J9, 21/09/2026).
 *
 * Nguồn 21/09 §39 cho phép reset/reseed demo, nên đây là MỘT ĐỀ XUẤT chuyển dữ liệu chứ không phải bắt buộc: bộ demo được dựng lại
 * bằng `npm run seed`. Bộ chuyển đổi vẫn cần để database đang dùng (dev, hoặc đã có dữ liệu thật) không mất những gì giáo viên đã
 * ghi. Chọn theo nguyên tắc "giữ SỰ THẬT, bỏ SUY DIỄN":
 *
 *   · MỖI BÁO CÁO của một case Ý thức → MỘT vi phạm (báo cáo là một sự việc có người ghi, có ngày). Nhóm `participation` (Tham gia
 *     trên lớp) đổi sang `conduct` (Thái độ / hành vi) — Y04. Case do một đợt SOS tự sinh và không có báo cáo nào KHÔNG phải một
 *     vi phạm (đó là việc "trao đổi sau SOS" do máy dựng) nên không sinh gì.
 *   · MỖI PHƯƠNG ÁN đã làm hoặc còn dở của case đó → MỘT biện pháp gắn với MỌI vi phạm của case (quan hệ nhiều–nhiều):
 *       talk_student → meeting_student · talk_parent → family_report · meeting_cx → meeting_cx.
 *     `warning_letter` (thư cảnh cáo cũ không có "lần thứ mấy") → loại `other` tên "Thư cảnh cáo (dữ liệu cũ)", KHÔNG bịa lần 1/2/3
 *     — bịa sẽ làm sai chuỗi cứng 1→2→3. Phương án đã huỷ thì bỏ.
 *   · Rồi GỠ sạch case Ý thức cũ và mọi thứ chỉ có nghĩa với nó (kết quả, mốc, nguồn, tín hiệu, tệp), và các cột/bảng của mô hình:
 *     `sos_cases.track`, `episode_no`, `merge_until`, `urgency_raised_at`, `case_signals.track`, `tasks.track`, bảng `case_reports`.
 *
 * Chạy lặp lại là no-op: chỉ làm khi cột `sos_cases.track` còn đó.
 */
/** Database này còn mô hình Case Ý thức cũ (cột `sos_cases.track`) — bước nâng cấp sắp XOÁ dữ liệu cũ, nên nơi gọi nên sao lưu trước. */
export function hasLegacyDisciplineModel(conn: any): boolean {
  const has = !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'sos_cases'").get();
  return has && (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).some((c: any) => c.name === 'track');
}

export function migrateLegacyDisciplineCases(conn: any, applied: string[]) {
  const tableCols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!hasTable('sos_cases') || !tableCols('sos_cases').includes('track')) return;
  migrateYThuc(conn, applied);

  const adminId = (conn.prepare('SELECT MIN(id) AS id FROM users').get() as any)?.id ?? 1;
  const legacy = conn.prepare(`SELECT * FROM sos_cases WHERE track != 'academic' ORDER BY id`).all() as any[];
  const legacyIds: number[] = legacy.map((c) => c.id);
  const validSkills = new Set<string>(VIOLATION_SKILLS);
  const classAt = (studentId: number, on: string): number | null => {
    const r = conn
      .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND started_at <= ? ORDER BY started_at DESC, id DESC LIMIT 1`)
      .get(studentId, on) as any
      ?? conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(studentId) as any;
    return r?.class_id ?? null;
  };
  const measureKindOf: Record<string, string | null> = { talk_student: 'meeting_student', talk_parent: 'family_report', meeting_cx: 'meeting_cx' };

  let violationsMade = 0;
  let measuresMade = 0;
  const insertViolation = conn.prepare(
    `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by, description, valid, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,1,?)`,
  );
  const insertMeasure = conn.prepare(
    `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, custom_name, status, owner_user_id, note, performed_on, performed_by,
                                      performer_name, confirmed_by, confirmed_at, violation_count_at_confirm, created_at, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const link = conn.prepare('INSERT OR IGNORE INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
  /* Tệp bằng chứng (PR-N) KHÔNG được mất theo case cũ: chuyển chủ sang biện pháp / vi phạm thay thế. */
  const moveAttachments = hasTable('attachments')
    ? conn.prepare('UPDATE attachments SET owner_type = ?, owner_id = ? WHERE owner_type = ? AND owner_id = ?')
    : null;
  let attachmentsKept = 0;

  for (const c of legacy) {
    if (!c.student_id) continue;
    const reports = hasTable('case_reports')
      ? (conn.prepare('SELECT * FROM case_reports WHERE case_id = ? ORDER BY reported_on, id').all(c.id) as any[])
      : [];
    const sources: Array<{ by: number | null; skill: string | null; reportedOn: string; occurredOn: string; text: string; at: string }> = reports.map((r) => ({
      by: r.reported_by ?? null, skill: r.source_skill ?? null, reportedOn: r.reported_on,
      occurredOn: r.observed_on || r.reported_on, text: String(r.summary ?? '').trim(), at: r.created_at,
    }));
    if (!sources.length && c.origin_kind !== 'mock') {
      const on = c.detected_at ?? String(c.created_at).slice(0, 10);
      sources.push({ by: c.reported_by ?? null, skill: null, reportedOn: on, occurredOn: on, text: String(c.summary ?? c.title ?? '').trim(), at: c.created_at });
    }
    if (!sources.length) continue;

    const category = legacyTopicToViolationCategory(c.topic);
    const violationIds: number[] = [];
    for (const src of sources) {
      const cls = classAt(c.student_id, src.occurredOn);
      const skill = src.skill && validSkills.has(src.skill) ? src.skill : null;
      const info = insertViolation.run(
        c.student_id, c.cycle_id ?? null, cls, category, skill, src.occurredOn, src.reportedOn,
        src.by ?? c.reported_by ?? adminId, src.text || 'Dữ liệu cũ: không có mô tả', src.at ?? nowIso(),
      );
      violationIds.push(Number(info.lastInsertRowid));
      violationsMade += 1;
    }

    const ivs = conn.prepare(`SELECT * FROM case_interventions WHERE case_id = ? AND status != 'cancelled' ORDER BY id`).all(c.id) as any[];
    let firstMeasureId: number | null = null;
    for (const iv of ivs) {
      const mapped = measureKindOf[iv.kind];
      const kind = mapped ?? 'other';
      const customName = kind !== 'other' ? null
        : iv.kind === 'warning_letter' ? 'Thư cảnh cáo (dữ liệu cũ)'
        : (String(iv.description ?? '').trim().slice(0, 60) || 'Phương án xử lý (dữ liệu cũ)');
      const done = iv.status === 'completed';
      const on = iv.completed_date ?? iv.started_date ?? iv.planned_date ?? String(iv.created_at).slice(0, 10);
      const performerUser = iv.performer_user_id ?? null;
      const performerName = performerUser
        ? null
        : (String(iv.performer_name ?? '').trim() || 'Không rõ (dữ liệu cũ)');
      const cls = classAt(c.student_id, on);
      const creator = iv.recorded_by ?? c.reported_by ?? adminId;
      const info = insertMeasure.run(
        c.student_id, c.cycle_id ?? null, cls, kind, customName, done ? 'done' : 'preparing', performerUser,
        String(iv.description ?? '').trim() || null,
        done ? on : null, done ? performerUser : null, done ? performerName : null,
        done ? creator : null, done ? iv.updated_at ?? iv.created_at : null, done ? violationIds.length : null,
        iv.created_at ?? nowIso(), creator,
      );
      const measureId = Number(info.lastInsertRowid);
      for (const v of violationIds) link.run(measureId, v, creator, iv.created_at ?? nowIso());
      measuresMade += 1;
      firstMeasureId ??= measureId;
      if (moveAttachments) attachmentsKept += moveAttachments.run('discipline_measure', measureId, 'case_intervention', iv.id).changes;
    }
    /* Tệp của chính case: đi theo biện pháp đầu tiên; không có biện pháp nào thì theo vi phạm đầu tiên. */
    if (moveAttachments) {
      attachmentsKept += firstMeasureId
        ? moveAttachments.run('discipline_measure', firstMeasureId, 'sos_case', c.id).changes
        : moveAttachments.run('violation', violationIds[0], 'sos_case', c.id).changes;
    }
  }

  /* ---- GỠ mô hình cũ, theo đúng thứ tự khoá ngoại ---- */
  let removed = 0;
  if (legacyIds.length) {
    const inList = legacyIds.join(',');
    const ivIds = (conn.prepare(`SELECT id FROM case_interventions WHERE case_id IN (${inList})`).all() as any[]).map((r) => r.id);
    const ivList = ivIds.length ? ivIds.join(',') : 'NULL';
    /* Từng câu một: một bảng thiếu (database cổ hơn) thì bỏ qua câu đó, không làm hỏng cả lần nâng cấp. */
    const statements = [
      `DELETE FROM case_followups WHERE case_id IN (${inList})`,
      `DELETE FROM case_reports WHERE case_id IN (${inList})`,
      `UPDATE case_interventions SET superseded_by = NULL WHERE superseded_by IN (${ivList})`,
      `UPDATE task_students SET case_id = NULL, intervention_id = NULL WHERE case_id IN (${inList})`,
      `DELETE FROM task_case_links WHERE case_id IN (${inList})`,
      `UPDATE tasks SET source_sos_case_id = NULL WHERE source_sos_case_id IN (${inList})`,
      `UPDATE case_signals SET case_id = NULL WHERE case_id IN (${inList})`,
      `DELETE FROM case_interventions WHERE case_id IN (${inList})`,
      `DELETE FROM case_issues WHERE case_id IN (${inList})`,
      `DELETE FROM case_sources WHERE case_id IN (${inList})`,
      `DELETE FROM case_milestones WHERE case_id IN (${inList})`,
      `DELETE FROM sos_case_history WHERE case_id IN (${inList})`,
      `DELETE FROM attachments WHERE owner_type = 'sos_case' AND owner_id IN (${inList})`,
      `DELETE FROM attachments WHERE owner_type = 'case_intervention' AND owner_id IN (${ivList})`,
      `DELETE FROM journey_events WHERE ref_table = 'sos_cases' AND ref_id IN (${inList})`,
      `DELETE FROM notifications WHERE entity_type = 'sos_case' AND entity_id IN (${inList})`,
      `UPDATE sos_cases SET previous_case_id = NULL WHERE previous_case_id IN (${inList})`,
      `DELETE FROM sos_cases WHERE id IN (${inList})`,
    ];
    for (const sql of statements) {
      try { conn.exec(sql); } catch (e: any) { if (!/no such (table|column)/i.test(String(e?.message))) throw e; }
    }
    removed = legacyIds.length;
  }
  const signalsGone = tableCols('case_signals').includes('track')
    ? conn.prepare(`DELETE FROM case_signals WHERE track != 'academic'`).run().changes : 0;
  if (tableCols('tasks').includes('track')) {
    conn.prepare(`UPDATE tasks SET topic = NULL WHERE track IS NOT NULL AND track != 'academic'`).run();
  }
  for (const [table, col] of [
    ['sos_cases', 'track'], ['sos_cases', 'episode_no'], ['sos_cases', 'merge_until'], ['sos_cases', 'urgency_raised_at'],
    ['case_signals', 'track'], ['tasks', 'track'],
  ] as const) {
    if (!tableCols(table).includes(col)) continue;
    try { conn.exec(`ALTER TABLE ${table} DROP COLUMN ${col}`); }
    catch (e: any) { applied.push(`Chưa gỡ được cột ${table}.${col} (${String(e?.message ?? e)}) — không ảnh hưởng, mã mới không đọc nó`); }
  }
  conn.exec('DROP TABLE IF EXISTS case_reports');

  applied.push(
    `Chuyển mô hình Case Ý thức sang Vi phạm và Phương án xử lý: ${violationsMade} vi phạm và ${measuresMade} phương án xử lý được giữ lại từ ${removed} case Ý thức cũ (${attachmentsKept} tệp/liên kết bằng chứng đi theo)`
    + `, ${signalsGone} tín hiệu Ý thức cũ được gỡ; đã bỏ các cột track/episode_no/merge_until/urgency_raised_at và bảng case_reports`,
  );
}

/**
 * RULEBOOK v3 — SOS TỰ TẠO CASE, PHỐI HỢP SOS (PR-T, 21/09/2026 tối).
 *
 * Thêm, KHÔNG đổi và KHÔNG xoá gì: hai cột phương án điền sẵn/xác nhận, hai cột lý do đóng case, và bảng `sos_coordination_actions`.
 * Mọi dòng cũ giữ nguyên: phương án cũ `preset = 0` (không phải điền sẵn, không cần xác nhận) nên không đổi hành vi. Chạy lặp không
 * làm gì. DDL chép từ `schema.sql`.
 */
export function migrateSosV3(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('sos_cases') || !hasTable('case_interventions')) return;

  const added: string[] = [];
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) { conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`); added.push(`${table}.${col}`); }
  };
  addCol('case_interventions', 'preset', 'INTEGER NOT NULL DEFAULT 0');
  addCol('case_interventions', 'confirmed_by', 'INTEGER REFERENCES users(id)');
  addCol('case_interventions', 'confirmed_at', 'TEXT');
  addCol('sos_cases', 'dismiss_reason_code', 'TEXT');
  addCol('sos_cases', 'dismiss_reason_text', 'TEXT');

  let table = false;
  if (!hasTable('sos_coordination_actions')) {
    conn.exec(`
      CREATE TABLE sos_coordination_actions (
        id INTEGER PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
        student_id INTEGER NOT NULL REFERENCES students(id),
        kind TEXT NOT NULL,
        custom_name TEXT,
        preset INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        performed_on TEXT, performed_by INTEGER REFERENCES users(id), performer_name TEXT,
        note TEXT,
        remove_reason_code TEXT, remove_reason_text TEXT,
        removed_by INTEGER REFERENCES users(id), removed_at TEXT,
        created_at TEXT NOT NULL, updated_at TEXT
      );
      CREATE UNIQUE INDEX uq_sca_attempt_kind ON sos_coordination_actions(attempt_id, kind, COALESCE(custom_name, ''));
      CREATE INDEX idx_sca_attempt ON sos_coordination_actions(attempt_id);
      CREATE INDEX idx_sca_student ON sos_coordination_actions(student_id, status);
    `);
    table = true;
  }
  if (!added.length && !table) return;
  applied.push(
    `PR-T (rulebook v3): thêm ${added.length} cột (${added.join(', ') || 'không'}) cho phương án điền sẵn / lý do đóng case`
      + `${table ? ' và bảng Phối hợp SOS (sos_coordination_actions)' : ''}. Dữ liệu cũ giữ nguyên; phương án cũ không bị coi là điền sẵn.`,
  );
}

/**
 * RULEBOOK v3, V13′ — VI PHẠM CŨ `valid = 0` ĐƯỢC XOÁ (PR-T). Trước đó "đánh dấu không chính xác" giữ dòng lại; nay ghi sai thì xoá thẳng, nên những dòng
 * đã đánh dấu không còn chỗ đứng. Mỗi vi phạm bị xoá kèm: dòng nối với biện pháp, lịch sử sửa, tệp bằng chứng (dòng + tệp trên đĩa nếu có), và MỘT dòng
 * `audit_logs` giữ nội dung đã xoá (kể cả lý do cũ) — chỉ để truy vết. Biện pháp đã thực hiện giữ nguyên, chỉ còn ít vi phạm hơn.
 * Chạy lặp không làm gì (không còn dòng `valid = 0`). Cột `valid`/`invalid_*` giữ trong schema, ngừng dùng.
 */
/*
 * PR-Z2: chỗ này CỐ Ý vẫn giữ đường dẫn Ổ ĐĨA, không đi qua kho tệp (`platform/khoTep.ts`). Lệnh nâng cấp chỉ gặp dòng
 * `valid = 0` ở database có từ trước rulebook v3 — tức database của máy dev; bản chính bắt đầu rỗng nên không bao giờ có dòng này.
 */
const deferredFileRemovals: string[] = [];
/** Xoá tệp đã chờ (từ `migrateDeleteInvalidViolations`) — chỉ gọi SAU KHI giao dịch nâng cấp đã chốt. */
export function flushDeferredFileRemovals(): number {
  const n = deferredFileRemovals.length;
  for (const f of deferredFileRemovals.splice(0)) { try { fs.rmSync(f, { force: true }); } catch { /* tệp đã mất thì thôi */ } }
  return n;
}

export function migrateDeleteInvalidViolations(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!hasTable('violations')) return;
  if (!(conn.prepare('PRAGMA table_info(violations)').all() as any[]).some((c: any) => c.name === 'valid')) return;
  const rows = conn.prepare('SELECT * FROM violations WHERE valid = 0 ORDER BY id').all() as any[];
  if (!rows.length) return;
  const now = nowIso();
  for (const v of rows) {
    const measureIds = (conn.prepare('SELECT measure_id FROM measure_violations WHERE violation_id = ? ORDER BY measure_id').all(v.id) as any[]).map((r) => r.measure_id);
    const files = hasTable('attachments')
      ? (conn.prepare("SELECT * FROM attachments WHERE owner_type = 'violation' AND owner_id = ?").all(v.id) as any[])
      : [];
    /* Tệp trên đĩa xoá SAU KHI cả bước nâng cấp chốt (`flushDeferredFileRemovals`): bước sau lỗi thì database lui, và tệp không được mất theo. */
    for (const f of files) if (f.kind === 'file') deferredFileRemovals.push(path.resolve(uploadsDir(), f.url));
    if (files.length) conn.prepare("DELETE FROM attachments WHERE owner_type = 'violation' AND owner_id = ?").run(v.id);
    conn.prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(v.id);
    if (hasTable('violation_history')) conn.prepare('DELETE FROM violation_history WHERE violation_id = ?').run(v.id);
    conn.prepare('DELETE FROM violations WHERE id = ?').run(v.id);
    conn
      .prepare('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(
        null, 'violation.delete', 'violation', v.id, `Nâng cấp rulebook v3 · vi phạm ${v.id}`,
        JSON.stringify({
          studentId: v.student_id, classId: v.class_id ?? null, category: v.category, skill: v.skill ?? null, occurredOn: v.occurred_on,
          reportedOn: v.reported_on, reportedBy: v.reported_by, description: v.description, measureIds, attachments: files.length,
          legacyInvalidReason: v.invalid_reason ?? null,
        }),
        null, now,
      );
  }
  applied.push(
    `PR-T (rulebook v3): xoá ${rows.length} vi phạm cũ đã "đánh dấu không chính xác" (kèm dòng nối, lịch sử sửa, tệp; mỗi vi phạm một dòng audit). Phương án xử lý giữ nguyên.`,
  );
}

function migrateNoShowMarks(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!(conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'assessment_scores'").get())) return;
  const have = cols('assessment_scores');
  const add: [string, string][] = [
    ['no_show_period_id', 'INTEGER REFERENCES report_periods(id)'],
    ['no_show_by', 'INTEGER REFERENCES users(id)'],
    ['no_show_at', 'TEXT'],
    ['no_show_late', 'INTEGER NOT NULL DEFAULT 0'],
    ['no_show_settled_at', 'TEXT'],
  ];
  let n = 0;
  for (const [col, decl] of add) {
    if (!have.includes(col)) { conn.exec(`ALTER TABLE assessment_scores ADD COLUMN ${col} ${decl}`); n += 1; }
  }
  if (n) {
    applied.push(
      `Thêm chỗ ghi dấu '-' "không có bài" ở ô điểm (rule book §17.1): ${n} cột trên assessment_scores. `
        + 'Không có ô cũ nào mang dấu này nên không có gì được điền hoặc suy ngược.',
    );
  }
}

/**
 * PR-S1 (luật máy chủ, 22/09/2026): hai cột mới.
 *   · `sos_cases.system_close_reason` — Case máy tự đóng theo S16/S17 (xem `cases/systemClose.ts`).
 *   · `attempt_skills.absent_from_no_show` — cờ "vắng do chốt dấu '-'" thay cho chuỗi `sit_note` (S11).
 * Dòng vắng cũ đã chốt được đánh cờ theo đúng chuỗi mà mã cũ dùng để nhận biết — đó là nơi DUY NHẤT dữ liệu cũ ghi điều này.
 * Chạy lặp không làm gì. Bản chính dựng từ `schema.sql` nên không đi qua bước này.
 */
export function migrateLuatMayChu(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const added: string[] = [];
  if (hasTable('sos_cases') && !cols('sos_cases').includes('system_close_reason')) {
    conn.exec('ALTER TABLE sos_cases ADD COLUMN system_close_reason TEXT');
    added.push('sos_cases.system_close_reason');
  }
  let flagged = 0;
  /*
   * Đánh cờ dữ liệu cũ CHỈ ngay lúc thêm cột. Sau đó cờ do mã ghi; chạy lại mà đọc chuỗi lần nữa thì một buổi vắng Quản lý xác
   * nhận bằng tay, ghi chú tình cờ mở đầu "Không dự thi…", sẽ bị gắn nhầm cờ chốt dấu "-".
   */
  if (hasTable('attempt_skills') && !cols('attempt_skills').includes('absent_from_no_show')) {
    conn.exec('ALTER TABLE attempt_skills ADD COLUMN absent_from_no_show INTEGER NOT NULL DEFAULT 0');
    added.push('attempt_skills.absent_from_no_show');
    flagged = conn
      .prepare(
        `UPDATE attempt_skills SET absent_from_no_show = 1
          WHERE sit_status = 'absent' AND absent_from_no_show = 0 AND sit_note LIKE 'Không dự thi%'`,
      )
      .run().changes;
  }
  if (!added.length && !flagged) return;
  applied.push(
    `PR-S1: thêm ${added.length} cột (${added.join(', ') || 'không'}); đánh cờ ${flagged} buổi vắng do chốt dấu "-". Dữ liệu cũ giữ nguyên.`,
  );
}

/**
 * PR-AN (AN-1, 22/09/2026): bảng đếm lần thử đăng nhập/đăng ký. Chỉ tạo khi chưa có — chạy lặp không làm gì. Không có dữ liệu cũ
 * nào để chuyển. Bản chính dựng từ `schema.sql` nên không đi qua bước này. Câu tạo bảng phải GIỐNG `schema.sql` (phép kiểm so cột).
 */
export function migrateAuthAttempts(conn: any, applied: string[]) {
  if (conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'auth_attempts'").get()) return;
  conn.exec(`CREATE TABLE auth_attempts (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX idx_auth_attempts_key ON auth_attempts(kind, key_hash, at);`);
  applied.push('PR-AN: thêm bảng auth_attempts (giới hạn số lần thử đăng nhập/đăng ký). Dữ liệu cũ giữ nguyên.');
}

/**
 * PR-S2 (điều chỉnh PA học thuật, 22/09/2026): bảng `case_intervention_revisions` + cột `case_followups.remaining_issue`, `decision_note`.
 * KHÔNG điền dữ liệu cũ: trước PR này sửa nội dung PA là ghi đè, bản cũ đã mất, không bịa lại.
 * Chạy lặp không làm gì. Bản chính dựng từ `schema.sql` nên không đi qua bước này. Câu CREATE phải giống hệt `schema.sql`
 * (phép kiểm `PR-S2 · Migrate` so từng cột và chỉ mục).
 */
export function migrateDieuChinhPa(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('case_interventions') || !hasTable('case_followups')) return;
  const done: string[] = [];
  if (!hasTable('case_intervention_revisions')) {
    conn.exec(`
      CREATE TABLE case_intervention_revisions (
        id INTEGER PRIMARY KEY,
        intervention_id INTEGER NOT NULL REFERENCES case_interventions(id),
        case_id INTEGER NOT NULL REFERENCES sos_cases(id),
        followup_id INTEGER REFERENCES case_followups(id),
        source TEXT NOT NULL,
        old_description TEXT,
        new_description TEXT,
        old_performer_user_id INTEGER REFERENCES users(id),
        old_performer_name TEXT,
        new_performer_user_id INTEGER REFERENCES users(id),
        new_performer_name TEXT,
        old_followup_due TEXT,
        new_followup_due TEXT,
        reason TEXT NOT NULL,
        effective_on TEXT NOT NULL,
        actor_user_id INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_iv_revision_iv ON case_intervention_revisions(intervention_id, id);
      CREATE INDEX IF NOT EXISTS idx_iv_revision_case ON case_intervention_revisions(case_id);
    `);
    done.push('bảng case_intervention_revisions');
  }
  for (const c of ['remaining_issue', 'decision_note']) {
    if (!cols('case_followups').includes(c)) {
      conn.exec(`ALTER TABLE case_followups ADD COLUMN ${c} TEXT`);
      done.push(`case_followups.${c}`);
    }
  }
  if (!done.length) return;
  applied.push(`PR-S2: thêm ${done.join(', ')}. Dữ liệu cũ giữ nguyên.`);
}

export function migrateCongViec(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('tasks') || !hasTable('task_history') || !hasTable('unit_reports') || !hasTable('unit_report_history')) return;
  const done: string[] = [];
  if (!cols('tasks').includes('help_user_id')) {
    conn.exec(`ALTER TABLE tasks ADD COLUMN help_user_id INTEGER REFERENCES users(id)`);
    done.push('tasks.help_user_id');
  }
  if (!cols('tasks').includes('help_name')) {
    conn.exec(`ALTER TABLE tasks ADD COLUMN help_name TEXT`);
    done.push('tasks.help_name');
  }
  if (!cols('task_history').includes('reason')) {
    conn.exec(`ALTER TABLE task_history ADD COLUMN reason TEXT`);
    done.push('task_history.reason');
  }
  if (!cols('unit_reports').includes('submitted_at')) {
    conn.exec(`ALTER TABLE unit_reports ADD COLUMN submitted_at TEXT`);
    /*
     * Dòng đã có nội dung (status NOT NULL) coi như đã nộp ở lần chạy TRƯỚC lúc có khái niệm
     * nháp — chỉ điền ở ĐÚNG lần thêm cột này, không chạy lại lần hai (nếu không thì một dòng
     * nháp mới tạo giữa hai lần chạy sẽ bị migrate biến thành "đã nộp" oan).
     */
    conn.exec(`UPDATE unit_reports SET submitted_at = updated_at WHERE status IS NOT NULL`);
    done.push('unit_reports.submitted_at');
  }
  if (!cols('unit_reports').includes('submitted_by')) {
    conn.exec(`ALTER TABLE unit_reports ADD COLUMN submitted_by INTEGER REFERENCES users(id)`);
    /*
     * Điền theo `submitted_at IS NOT NULL` — ĐÃ NỘP, không phải `status IS NOT NULL` (chỉ nói có
     * ghi mức, kể cả nháp). Hai cột này thêm ở HAI khối `if` riêng, chạy độc lập theo cột nào
     * còn thiếu — nếu `submitted_at` đã có từ một lần nâng cấp TRƯỚC (không còn khớp `status IS
     * NOT NULL` nữa vì đã có nháp mới tạo sau đó), điền `submitted_by` theo `status` sẽ gán oan
     * "đã nộp" cho một dòng NHÁP chưa ai nộp.
     */
    conn.exec(`UPDATE unit_reports SET submitted_by = reporter_user_id WHERE submitted_at IS NOT NULL`);
    done.push('unit_reports.submitted_by');
  }
  if (!cols('unit_report_history').includes('kind')) {
    conn.exec(`ALTER TABLE unit_report_history ADD COLUMN kind TEXT`);
    done.push('unit_report_history.kind');
  }
  if (!hasTable('unit_report_task_links')) {
    conn.exec(`
      CREATE TABLE unit_report_task_links (
        unit_report_id INTEGER NOT NULL REFERENCES unit_reports(id),
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL,
        PRIMARY KEY (unit_report_id, task_id)
      );
      CREATE INDEX IF NOT EXISTS idx_urtl_task ON unit_report_task_links(task_id);
    `);
    done.push('bảng unit_report_task_links');
  }
  if (!done.length) return;
  applied.push(`PR-Ra: thêm ${done.join(', ')}. Dữ liệu cũ giữ nguyên.`);
}

/**
 * PR-LT: bảng `lo_trinh_tiep_theo` (Q1) + cột `enrollments.end_kind` (Q18) + `classes.finished_at` (Q16).
 * Câu CREATE giống hệt `schema.sql` — chạy lặp không làm gì, không điền dữ liệu cũ.
 */
export function migrateLenLop(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('classes') || !hasTable('enrollments') || !hasTable('students')) return;
  const done: string[] = [];
  if (!hasTable('lo_trinh_tiep_theo')) {
    conn.exec(`
      CREATE TABLE lo_trinh_tiep_theo (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        class_id INTEGER NOT NULL REFERENCES classes(id),
        huong TEXT NOT NULL,
        lop_du_kien_id INTEGER REFERENCES classes(id),
        muc_tieu REAL,
        thang_thi TEXT,
        ghi_chu TEXT,
        ly_do TEXT,
        ngay_xem_lai TEXT,
        da_ap_dung_luc TEXT,
        updated_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (student_id, class_id)
      );
      CREATE INDEX idx_ltt_class ON lo_trinh_tiep_theo(class_id);
    `);
    done.push('bảng lo_trinh_tiep_theo');
  }
  if (!cols('enrollments').includes('end_kind')) {
    conn.exec(`ALTER TABLE enrollments ADD COLUMN end_kind TEXT`);
    done.push('enrollments.end_kind');
  }
  if (!cols('classes').includes('finished_at')) {
    conn.exec(`ALTER TABLE classes ADD COLUMN finished_at TEXT`);
    done.push('classes.finished_at');
  }
  conn.exec(`CREATE INDEX IF NOT EXISTS idx_class_status ON classes(status)`);
  if (!done.length) return;
  applied.push('PR-LT: thêm bảng lo_trinh_tiep_theo, cột enrollments.end_kind, classes.finished_at. Dữ liệu cũ giữ nguyên.');
}

/**
 * PR-XOA: cột `users.deleted_at` (xoá mềm tài khoản còn dấu vết, đặc tả §3) + đưa học viên ĐÃ THÔI HỌC mà chưa lưu trữ vào khu Lưu trữ
 * (đặc tả §2 — từ nay `setStudentStatus(…, 'finished')` tự lưu trữ). Phần đưa vào Lưu trữ chạy ĐÚNG MỘT LẦN, đánh dấu bằng khoá
 * `demo_config.xoa_du_lieu_backfill_at` (Q14): chạy lại không lưu trữ lại em mà Quản lý đã "Bỏ lưu trữ".
 */
export function migrateXoaDuLieu(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('users') || !hasTable('students')) return;
  const done: string[] = [];
  if (!cols('users').includes('deleted_at')) {
    conn.exec('ALTER TABLE users ADD COLUMN deleted_at TEXT');
    done.push('cột users.deleted_at');
  }
  const KHOA = 'xoa_du_lieu_backfill_at';
  if (hasTable('demo_config') && !conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA)) {
    const r = conn.prepare(
      `UPDATE students SET archived_at = COALESCE(finished_at, substr(created_at, 1, 10))
        WHERE status = 'finished' AND archived_at IS NULL`,
    ).run();
    conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA, nowIso(), nowIso());
    if (r.changes) done.push(`đưa ${r.changes} học viên đã thôi học vào Lưu trữ`);
  }
  if (done.length) applied.push(`PR-XOA: ${done.join(', ')}.`);
}
