/**
 * PHÉP KIỂM PR-XOA — lưu trữ tự động khi thôi học, xoá học viên, xoá tài khoản (chỉ Quản trị hệ thống).
 * Harness (`check`, `assert`, dữ liệu demo) do `run.ts` sở hữu và truyền vào.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runXoaDuLieuTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, seedMax } = t;

  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod = await import('../migrate.ts');
  const week = await import('../platform/week.ts');
  const intake = await import('../classes/intake.ts');
  const studentsSvc = await import('../students/students.ts');
  const transitionSvc = await import('../classes/transition.ts');
  const luuTruSvc = await import('../classes/luuTru.ts');
  const loTrinhTiepSvc = await import('../classes/loTrinhTiep.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');

  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const thuHai = week.mondayOf(TODAY);
  let seq = 0;

  /** Lớp thường FOU của MB, tuần hiện tại = `tuan` (9 = đã hết chương trình 8 tuần). */
  function taoLop(tuan: number): number {
    seq += 1;
    const batDau = addDays(thuHai, -7 * (tuan - 1));
    const r = intake.createClass(P.admin, {
      code: `MB-XOA-${seq}`, branchId: MB, kind: 'FOU', isFastTrack: false,
      startDate: batDau, startPeriodId: week.ensurePeriod(batDau).id,
    }) as any;
    return r.id as number;
  }
  function taoHV(clsId: number): number {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-XOA-${seq}`, `Hoc vien Xoa ${seq}`, `hoc vien xoa ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(sid, clsId, TODAY, now);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`,
    ).run(sid, TODAY, now);
    return sid;
  }
  const hv = (sid: number) => conn.prepare('SELECT status, finished_at, archived_at FROM students WHERE id = ?').get(sid) as any;

  // ==================================================================== Task 1 — lưu trữ tự động (§2) + migrate

  console.log('\nPR-XOA (1) · Học viên thôi học tự vào Lưu trữ; migrate users.deleted_at + đưa em đã thôi học vào Lưu trữ (một lần)');

  check('PR-XOA L1 · setStudentStatus(finished, ngày) → archived_at = ngày đó, em có ở khu Lưu trữ', () => {
    const sid = taoHV(taoLop(3));
    const ngay = addDays(TODAY, -2);
    studentsSvc.setStudentStatus(P.mbManager, sid, 'finished', ngay, 'Nghỉ hẳn');
    const s = hv(sid);
    assert(s.status === 'finished' && s.finished_at === ngay && s.archived_at === ngay, JSON.stringify(s));
    assert(luuTruSvc.danhSachLuuTru(P.mbManager, {}).hocVien.some((h) => h.id === sid && h.archivedAt === ngay),
      'Em vừa thôi học phải có ở khu Lưu trữ');
    const audit = conn.prepare(`SELECT after_json FROM audit_logs WHERE action = 'student.status' AND entity_id = ? ORDER BY id DESC LIMIT 1`)
      .get(sid) as any;
    assert(JSON.parse(audit.after_json).archivedAt === ngay, `audit student.status thiếu archivedAt: ${audit.after_json}`);
  });

  check('PR-XOA L2 · Tạm dừng (inactive) KHÔNG lưu trữ; Quay lại học cũng không', () => {
    const sid = taoHV(taoLop(3));
    studentsSvc.setStudentStatus(P.mbManager, sid, 'inactive', TODAY, 'Ốm');
    assert(hv(sid).archived_at === null, `Tạm dừng không được lưu trữ: ${JSON.stringify(hv(sid))}`);
    studentsSvc.setStudentStatus(P.mbManager, sid, 'active', TODAY);
    assert(hv(sid).archived_at === null, 'Quay lại học không được lưu trữ');
  });

  check('PR-XOA L3 · Chuyển tiếp lớp › Dừng học → em thôi học và đã ở Lưu trữ', () => {
    const cls = taoLop(9);
    const sid = taoHV(cls);
    const r = transitionSvc.applyTransition(P.mbManager, {
      fromClassId: cls, effectiveDate: TODAY, dongs: [{ studentId: sid, huong: 'dung_hoc', lyDo: 'Chuyển trường' }],
    }) as any;
    assert(r.failed.length === 0, JSON.stringify(r.failed));
    const s = hv(sid);
    assert(s.status === 'finished' && s.archived_at === TODAY, `Dừng học phải lưu trữ: ${JSON.stringify(s)}`);
  });

  /** Database kiểu cũ: schema hiện tại, gỡ `users.deleted_at`; hai em đã thôi học mà chưa lưu trữ, một em đang học. */
  const dbCu = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec('ALTER TABLE users DROP COLUMN deleted_at');
    const them = m.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, status, finished_at, archived_at, created_at)
       VALUES (?,?,?,?,?,NULL,?)`,
    );
    them.run('PISA-C1', 'Cu Mot', 'cu mot', 'finished', '2026-05-01', '2026-01-01T00:00:00.000Z');
    them.run('PISA-C2', 'Cu Hai', 'cu hai', 'finished', null, '2026-02-03T00:00:00.000Z');
    them.run('PISA-C3', 'Cu Ba', 'cu ba', 'active', null, '2026-02-03T00:00:00.000Z');
    return m;
  };
  const archivedOf = (m: any) => Object.fromEntries((m.prepare('SELECT student_code, archived_at FROM students ORDER BY id').all() as any[])
    .map((r) => [r.student_code, r.archived_at]));

  check('PR-XOA L4 · migrateXoaDuLieu trên DB cũ: thêm users.deleted_at, 2 em đã thôi học vào Lưu trữ, em đang học giữ nguyên', () => {
    const m = dbCu();
    const applied: string[] = [];
    migrateMod.migrateXoaDuLieu(m, applied);
    const cols = (m.prepare('PRAGMA table_info(users)').all() as any[]).map((c) => c.name);
    assert(cols.includes('deleted_at'), 'users thiếu deleted_at');
    const a = archivedOf(m);
    assert(a['PISA-C1'] === '2026-05-01' && a['PISA-C2'] === '2026-02-03' && a['PISA-C3'] === null, JSON.stringify(a));
    assert(applied.length === 1 && /PR-XOA/.test(applied[0]) && /2 học viên/.test(applied[0]), applied.join(' | '));
  });

  check('PR-XOA L5 · chạy lại migrate sau khi Bỏ lưu trữ một em → em đó VẪN không lưu trữ, không báo gì', () => {
    const m = dbCu();
    migrateMod.migrateXoaDuLieu(m, []);
    m.prepare(`UPDATE students SET archived_at = NULL WHERE student_code = 'PISA-C1'`).run();   // như unarchiveStudent
    const applied: string[] = [];
    migrateMod.migrateXoaDuLieu(m, applied);
    assert(archivedOf(m)['PISA-C1'] === null, 'Em đã Bỏ lưu trữ bị lưu trữ lại');
    assert(applied.length === 0, `Lần hai không được báo gì: ${applied.join(' | ')}`);
  });

  check('PR-XOA L6 · DB mới (schema.sql + seed): có users.deleted_at; không em nào của bộ demo thôi học mà chưa lưu trữ', () => {
    const cols = (conn.prepare('PRAGMA table_info(users)').all() as any[]).map((c) => c.name);
    assert(cols.includes('deleted_at'), 'schema.sql thiếu users.deleted_at');
    const sot = conn.prepare(`SELECT student_code FROM students WHERE status = 'finished' AND archived_at IS NULL AND id <= ?`)
      .all(seedMax.students ?? 0) as any[];
    assert(sot.length === 0, `Em demo thôi học chưa lưu trữ: ${sot.map((r) => r.student_code).join(', ')}`);
    assert((conn.prepare(`SELECT COUNT(*) n FROM students WHERE status = 'finished' AND id <= ?`).get(seedMax.students ?? 0) as any).n > 0,
      'Tiền đề: bộ demo phải có em thôi học');
  });

  check('PR-XOA L7 · Hồ sơ em vừa Kết thúc học: chỉ xem, ⋮ chỉ còn Bỏ lưu trữ (QL)', () => {
    const sid = taoHV(taoLop(3));
    studentsSvc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ hẳn');
    const l = loTrinhTiepSvc.lopHocCua(P.mbManager, sid, null);
    const bat = Object.entries(l.quyen).filter(([, v]) => v).map(([k]) => k);
    assert(l.chiXem === true && bat.join() === 'boLuuTru', `chiXem=${l.chiXem}, cờ bật: ${bat.join()}`);
  });

  // ==================================================================== Task 2 — xoá học viên + phép kiểm "không sót"

  console.log('\nPR-XOA (2) · Máy chủ: xoá học viên — mọi dòng gắn em trong MỘT giao dịch; phép kiểm "không sót" dựng từ PRAGMA foreign_key_list');

  const xoaHV = await import('../students/xoaHocVien.ts');
  const khoTepMod = await import('../platform/khoTep.ts');
  const hanGio = await import('../platform/hanGio.ts');
  const profileSvc = await import('../students/profile.ts');
  const { OWNER_TYPES } = await import('../platform/attachments.ts');

  type Canh = { bang: string; cot: string; toi: string };
  const CANH = conn.prepare(
    `SELECT m.name AS bang, f."from" AS cot, f."table" AS toi
       FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type = 'table'`,
  ).all() as Canh[];
  const MOI_BANG = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all() as any[])
    .map((r) => r.name as string);
  const laCanhNull = (c: Canh) => xoaHV.CANH_NULL.includes(`${c.bang}.${c.cot}`);

  /** (2) Bao đóng LƯỢC ĐỒ: bảng nào có cạnh FK (không kể cạnh đặt NULL) trỏ — trực tiếp hay qua bảng trung gian — tới `students`. */
  function baoDongLuocDo(): Set<string> {
    const tap = new Set(['students']);
    for (let doi = true; doi;) {
      doi = false;
      for (const c of CANH) if (!laCanhNull(c) && tap.has(c.toi) && !tap.has(c.bang)) { tap.add(c.bang); doi = true; }
    }
    return tap;
  }

  /** (3) Dòng của một em theo DỮ LIỆU: đi theo đúng các cạnh của (2) cho tới khi không bảng nào thêm dòng. Khoá = rowid (= id). */
  type DongEm = Map<string, Set<number>>;
  function dongCua(sid: number): DongEm {
    const so: DongEm = new Map([['students', new Set([sid])]]);
    for (let doi = true; doi;) {
      doi = false;
      for (const c of CANH) {
        if (laCanhNull(c)) continue;
        const ids = so.get(c.toi);
        if (!ids?.size) continue;
        const rows = conn.prepare(`SELECT rowid AS r FROM "${c.bang}" WHERE "${c.cot}" IN (${[...ids].join(',')})`).all() as any[];
        let tap = so.get(c.bang);
        if (!tap) { tap = new Set(); so.set(c.bang, tap); }
        for (const r of rows) if (!tap.has(r.r)) { tap.add(r.r); doi = true; }
      }
    }
    return so;
  }

  /** (4) Liên kết mềm (không có FK): tệp theo `owner_type/owner_id`, thông báo theo `entity_type/entity_id`. */
  const MEM_TEP: [string, string][] = [
    ['sos_case', 'sos_cases'], ['case_intervention', 'case_interventions'], ['violation', 'violations'],
    ['discipline_measure', 'discipline_measures'], ['sos_coordination_action', 'sos_coordination_actions'],
  ];
  const MEM_THONG_BAO: [string, string][] = [
    ['student', 'students'], ['assessment_attempt', 'assessment_attempts'], ['sos_case', 'sos_cases'], ['case_signal', 'case_signals'],
    ['discipline_measure', 'discipline_measures'], ['skill_move_requests', 'skill_move_requests'], ['case_intervention', 'case_interventions'],
    ['violation', 'violations'], ['sos_coordination_action', 'sos_coordination_actions'],
  ];
  function lienKetMem(so: DongEm): { tep: number[]; thongBao: number[] } {
    const lay = (bang: string, cotLoai: string, cotId: string, cap: [string, string][]) => cap.flatMap(([loai, chu]) => {
      const ids = [...(so.get(chu) ?? [])];
      if (!ids.length) return [];
      return (conn.prepare(`SELECT id FROM ${bang} WHERE ${cotLoai} = ? AND ${cotId} IN (${ids.join(',')})`).all(loai) as any[]).map((r) => r.id as number);
    });
    return { tep: lay('attachments', 'owner_type', 'owner_id', MEM_TEP), thongBao: lay('notifications', 'entity_type', 'entity_id', MEM_THONG_BAO) };
  }

  const demBang = (): Record<string, number> =>
    Object.fromEntries(MOI_BANG.map((b) => [b, (conn.prepare(`SELECT COUNT(*) AS n FROM "${b}"`).get() as any).n as number]));
  const soLoiFk = () => (conn.prepare('PRAGMA foreign_key_check').all() as any[]).length;
  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const maLoi = (fn: () => unknown): number | string => {
    try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); }
  };

  /** Kho tệp giả: ghi lại khoá bị xoá và lúc đó còn trong giao dịch không. */
  const tepDaXoa: { khoa: string; trongGiaoDich: boolean }[] = [];
  const khoGia = {
    async ghi() { /* không dùng */ },
    async doc() { return null; },
    async xoa(khoa: string) { tepDaXoa.push({ khoa, trongGiaoDich: !!conn.inTransaction }); },
  };

  const FT = t.classId('MB-FT 101');
  const KY = (conn.prepare('SELECT id FROM report_periods ORDER BY id LIMIT 1').get() as any).id as number;
  const U = P.admin.userId;
  let xSeq = 0;
  const ins = (sql: string, ...a: unknown[]) => Number(conn.prepare(sql).run(...a).lastInsertRowid);

  /**
   * FIXTURE: một em mới ở MB-FT 101 có ≥ 1 dòng ở MỌI bảng của bao đóng — 2 lộ trình, 2 (+`soLuotThem`) lượt Test, Case có PA + ghi kết quả +
   * điều chỉnh PA + mốc + nguồn + lịch sử + tín hiệu, vi phạm + lịch sử + PA xử lý + dòng nối, Phối hợp SOS, xin dời lịch, ước lượng,
   * hành trình, Lộ trình tiếp theo, `task_students`, `task_case_links`; 5 tệp (mỗi `owner_type` một), 9 thông báo (mỗi `entity_type` một).
   */
  function taoHocVienDuDuLieu(o: { soLuotThem?: number } = {}) {
    xSeq += 1;
    const now = new Date().toISOString();
    const ma = `PISA-XOA2-${xSeq}`;
    const ten = `Hoc vien Xoa Hai ${xSeq}`;
    const sid = ins(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ma, ten, ten.toLowerCase(), MB, now);
    ins(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`, sid, FT, TODAY, now);
    const y1 = ins(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', ?, 'completed', ?)`, sid, TODAY, now);
    const y2 = ins(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 2, 'LT2', ?, 'active', ?)`, sid, TODAY, now);
    const a1 = ins(`INSERT INTO assessment_attempts (cycle_id, student_id, class_id, attempt_no, created_at) VALUES (?,?,?,1,?)`, y1, sid, FT, now);
    const a2 = ins(`INSERT INTO assessment_attempts (cycle_id, student_id, class_id, attempt_no, created_at) VALUES (?,?,?,1,?)`, y2, sid, FT, now);
    for (let i = 0; i < (o.soLuotThem ?? 0); i += 1) {
      const ax = ins(`INSERT INTO assessment_attempts (cycle_id, student_id, class_id, attempt_no, created_at) VALUES (?,?,?,?,?)`, y2, sid, FT, i + 2, now);
      ins(`INSERT INTO assessment_scores (attempt_id, skill) VALUES (?, 'reading')`, ax);
    }
    conn.prepare('UPDATE learning_cycles SET baseline_attempt_id = ?, outcome_attempt_id = ? WHERE id = ?').run(a1, a1, y1);
    ins(`INSERT INTO assessment_scores (attempt_id, skill) VALUES (?, 'reading')`, a1);
    ins(`INSERT INTO attempt_skills (attempt_id, skill, created_at) VALUES (?, 'reading', ?)`, a1, now);
    ins(`INSERT INTO attempt_skill_skips (attempt_id, skill, created_at) VALUES (?, 'speaking', ?)`, a1, now);
    ins(`INSERT INTO attempt_schedule_history (attempt_id, action, created_at) VALUES (?, 'planned', ?)`, a1, now);
    const r1 = ins(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, to_period_id, requested_on, decide_by, created_at)
                    VALUES (?, 'reading', 1, ?, ?, ?, ?)`, a1, KY, TODAY, TODAY, now);
    ins(`INSERT INTO cycle_target_revisions (cycle_id, effective_from, created_at) VALUES (?,?,?)`, y1, TODAY, now);
    ins(`INSERT INTO teacher_estimates (student_id, cycle_id, skill, band, assessed_on, created_at) VALUES (?,?, 'reading', 6, ?, ?)`, sid, y1, TODAY, now);
    ins(`INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, created_at) VALUES (?,?, 'note', ?, 'Ghi chú', ?)`, sid, y1, TODAY, now);
    ins(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, created_at, updated_at) VALUES (?,?, 'chua_ro', ?, ?)`, sid, FT, now, now);
    const c1 = ins(`INSERT INTO sos_cases (student_id, attempt_id, cycle_id, created_at) VALUES (?,?,?,?)`, sid, a1, y1, now);
    const i1 = ins(`INSERT INTO case_interventions (case_id, kind, created_at) VALUES (?, 'lesson', ?)`, c1, now);
    const f1 = ins(`INSERT INTO case_followups (case_id, intervention_id, evidence_attempt_id, observed_on, created_at) VALUES (?,?,?,?,?)`, c1, i1, a1, TODAY, now);
    ins(`INSERT INTO case_intervention_revisions (intervention_id, case_id, followup_id, source, reason, effective_on, created_at)
         VALUES (?,?,?, 'followup', 'Đổi PA', ?, ?)`, i1, c1, f1, TODAY, now);
    ins(`INSERT INTO case_issues (case_id, taxonomy_code, created_at) VALUES (?, 'R-01', ?)`, c1, now);
    ins(`INSERT INTO case_milestones (case_id, attempt_id, kind, occurred_on, created_at) VALUES (?,?, 'opened', ?, ?)`, c1, a1, TODAY, now);
    ins(`INSERT INTO case_sources (case_id, source_type, source_id, created_at) VALUES (?, 'attempt', ?, ?)`, c1, a1, now);
    ins(`INSERT INTO sos_case_history (case_id, field, created_at) VALUES (?, 'status', ?)`, c1, now);
    const g1 = ins(`INSERT INTO case_signals (student_id, case_id, attempt_id, cycle_id, detected_on, raised_on, verify_due, created_at)
                    VALUES (?,?,?,?,?,?,?,?)`, sid, c1, a1, y1, TODAY, TODAY, TODAY, now);
    const v1 = ins(`INSERT INTO violations (student_id, cycle_id, category, occurred_on, reported_on, reported_by, description, created_at)
                    VALUES (?,?, 'late', ?, ?, ?, 'Đi muộn', ?)`, sid, y1, TODAY, TODAY, U, now);
    ins(`INSERT INTO violation_history (violation_id, field, created_at) VALUES (?, 'status', ?)`, v1, now);
    const m1 = ins(`INSERT INTO discipline_measures (student_id, cycle_id, kind, created_at, created_by) VALUES (?,?, 'warning', ?, ?)`, sid, y1, now, U);
    conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_at) VALUES (?,?,?)').run(m1, v1, now);
    const x1 = ins(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, created_at) VALUES (?,?, 'parent_call', ?)`, a1, sid, now);
    const task = ins(`INSERT INTO tasks (code, title, created_at) VALUES (?, 'Việc thử xoá', ?)`, `CV-XOA2-${xSeq}`, now);
    ins(`INSERT INTO task_students (task_id, student_id, case_id, intervention_id, created_at) VALUES (?,?,?,?,?)`, task, sid, c1, i1, now);
    conn.prepare('INSERT INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)').run(task, c1, now);
    const tep: string[] = [];
    for (const [loai, id] of [['sos_case', c1], ['case_intervention', i1], ['violation', v1], ['discipline_measure', m1], ['sos_coordination_action', x1]] as [string, number][]) {
      const khoa = `xoa2-${xSeq}-${loai}.txt`;
      tep.push(khoa);
      ins(`INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at) VALUES (?,?, 'file', ?, ?, ?, ?)`,
        loai, id, khoa, `${loai}.txt`, U, now);
    }
    for (const [loai, id] of [['student', sid], ['assessment_attempt', a1], ['sos_case', c1], ['case_signal', g1], ['discipline_measure', m1],
      ['skill_move_requests', r1], ['case_intervention', i1], ['violation', v1], ['sos_coordination_action', x1]] as [string, number][]) {
      ins(`INSERT INTO notifications (user_id, kind, title, entity_type, entity_id, dedup_key, created_at) VALUES (?, 'thu', 'Thử', ?, ?, ?, ?)`,
        U, loai, id, `xoa2:${xSeq}:${loai}`, now);
    }
    return { sid, ma, ten, y1, y2, a1, a2, c1, i1, f1, g1, v1, m1, x1, r1, task, tep };
  }

  check('PR-XOA X1 · Bao đóng theo PRAGMA foreign_key_list BẰNG ĐÚNG BANG_CUA_HOC_VIEN (29 bảng)', () => {
    const tap = baoDongLuocDo();
    const coDinh = new Set(xoaHV.BANG_CUA_HOC_VIEN);
    const thieu = [...tap].filter((b) => !coDinh.has(b));
    const thua = [...coDinh].filter((b) => !tap.has(b));
    assert(!thieu.length, thieu.map((b) => `Bảng ${b} trỏ tới học viên mà xoaHocVien chưa xoá`).join('; '));
    assert(!thua.length, `BANG_CUA_HOC_VIEN có bảng không trỏ tới học viên: ${thua.join(', ')}`);
    assert(tap.size === 29, `Bao đóng đổi cỡ (${tap.size}) — cập nhật bảng tham chiếu của kế hoạch`);
  });

  check('PR-XOA X2 · Mỗi cạnh FK vào bao đóng có câu trong CAU_XOA_HOC_VIEN (DELETE theo cột, hoặc UPDATE … = NULL cho CANH_NULL); đủ owner_type tệp', () => {
    const tap = baoDongLuocDo();
    const vao = CANH.filter((c) => tap.has(c.toi));
    assert(vao.length === 52, `Số cạnh vào bao đóng đổi (${vao.length})`);
    const sot: string[] = [];
    for (const c of vao) {
      const ok = laCanhNull(c)
        ? xoaHV.CAU_XOA_HOC_VIEN.some((q) => q.bang === c.bang && new RegExp(`^UPDATE ${c.bang} SET ${c.cot} = NULL`).test(q.sql))
        : xoaHV.CAU_XOA_HOC_VIEN.some((q) => q.bang === c.bang && q.sql.includes(c.cot));
      if (!ok) sot.push(`${c.bang}.${c.cot} → ${c.toi}`);
    }
    assert(!sot.length, `Cạnh chưa có câu xoá/đặt NULL: ${sot.join(', ')}`);
    const cauTep = xoaHV.CAU_XOA_HOC_VIEN.find((q) => q.bang === 'attachments')?.sql ?? '';
    const thieuLoai = OWNER_TYPES.filter((o) => o !== 'unit_report' && !cauTep.includes(`'${o}'`));
    assert(!thieuLoai.length, `Câu xoá tệp thiếu owner_type: ${thieuLoai.join(', ')}`);
    for (const [loai] of MEM_THONG_BAO) {
      assert(xoaHV.CAU_XOA_HOC_VIEN.some((q) => q.bang === 'notifications' && q.sql.includes(`'${loai}'`)), `Câu xoá thông báo thiếu entity_type ${loai}`);
    }
  });

  let S: ReturnType<typeof taoHocVienDuDuLieu>;
  let T: ReturnType<typeof taoHocVienDuDuLieu>;
  let taskChung = 0;
  let dongS: DongEm = new Map();
  let memS = { tep: [] as number[], thongBao: [] as number[] };

  check('PR-XOA X3 · Fixture phủ: em S có ≥ 1 dòng ở MỌI bảng của bao đóng, đủ 5 tệp và 9 thông báo; em T cùng lớp nối chéo', () => {
    S = taoHocVienDuDuLieu();
    T = taoHocVienDuDuLieu();
    const now = new Date().toISOString();
    conn.prepare('UPDATE sos_cases SET previous_case_id = ? WHERE id = ?').run(S.c1, T.c1);
    conn.prepare('UPDATE case_followups SET evidence_attempt_id = ? WHERE id = ?').run(S.a1, T.f1);
    conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_at) VALUES (?,?,?)').run(T.m1, S.v1, now);
    taskChung = ins(`INSERT INTO tasks (code, title, source_sos_case_id, created_at) VALUES (?, 'Việc chung', ?, ?)`, `CV-XOA2-CHUNG-${xSeq}`, S.c1, now);
    ins('INSERT INTO task_students (task_id, student_id, created_at) VALUES (?,?,?)', taskChung, S.sid, now);
    ins('INSERT INTO task_students (task_id, student_id, created_at) VALUES (?,?,?)', taskChung, T.sid, now);
    dongS = dongCua(S.sid);
    memS = lienKetMem(dongS);
    const trong = [...baoDongLuocDo()].filter((b) => !(dongS.get(b)?.size));
    assert(!trong.length, `Fixture chưa phủ bảng: ${trong.join(', ')}`);
    assert(memS.tep.length === 5 && memS.thongBao.length === 9, `tệp ${memS.tep.length}, thông báo ${memS.thongBao.length}`);
  });

  check('PR-XOA X13 · xemXoaHocVien khớp fixture; viewer.coTheXoa chỉ Quản trị hệ thống', () => {
    const x = xoaHV.xemXoaHocVien(P.admin, S.sid);
    const so = Object.fromEntries(x.mat.map((m) => [m.khoa, m.so]));
    assert(x.ma === S.ma && x.ten === S.ten && x.lop === 'MB-FT 101' && x.dangHoc === true, JSON.stringify({ ...x, mat: undefined }));
    assert(so.luotTest === 2 && so.diem === 1 && so.caseHocThuat === 1 && so.paHocThuat === 1 && so.ghiKetQua === 1 && so.tinHieu === 1
      && so.viPham === 1 && so.paXuLy === 1 && so.phoiHop === 1 && so.tep === 5 && so.thongBao === 9 && so.lopTungHoc === 1, JSON.stringify(so));
    assert(x.mat.every((m) => m.so > 0 && m.nhan), 'mat chỉ gồm loại > 0, có nhãn');
    assert(x.congViecGoLienKet === 2, `congViecGoLienKet = ${x.congViecGoLienKet}`);
    assert(profileSvc.studentProfile(P.admin, S.sid).viewer.coTheXoa === true, 'QT phải có coTheXoa');
    assert(profileSvc.studentProfile(P.mbManager, S.sid).viewer.coTheXoa === false, 'QL không được có coTheXoa');
    assert(profileSvc.studentProfile(P.coreTeacher, S.sid).viewer.coTheXoa === false, 'GVCN không được có coTheXoa');
  });

  check('PR-XOA X9 · Quyền: QL, GVCN → 403 cả xem và xoá; mã sai → 400, không dòng nào mất; id lạ → 404', () => {
    for (const [ten, p] of [['QL', P.mbManager], ['GVCN', P.coreTeacher]] as const) {
      assert(maLoi(() => xoaHV.xemXoaHocVien(p, S.sid)) === 403, `${ten} xem phải 403`);
      assert(maLoi(() => xoaHV.xoaHocVien(p, S.sid, { maXacNhan: S.ma })) === 403, `${ten} xoá phải 403`);
    }
    const truoc = demBang();
    assert(maLoi(() => xoaHV.xoaHocVien(P.admin, S.sid, { maXacNhan: 'PISA-000000' })) === 400, 'mã sai phải 400');
    assert(maLoi(() => xoaHV.xoaHocVien(P.admin, S.sid, {})) === 400, 'không gõ mã phải 400');
    assert(JSON.stringify(demBang()) === JSON.stringify(truoc), 'mã sai mà vẫn mất dòng');
    assert(maLoi(() => xoaHV.xemXoaHocVien(P.admin, 99_999_999)) === 404, 'id lạ xem phải 404');
    assert(maLoi(() => xoaHV.xoaHocVien(P.admin, 99_999_999, { maXacNhan: 'x' })) === 404, 'id lạ xoá phải 404');
  });

  check('PR-XOA X10 · Số câu SQL: xoá ≤ 42 và KHÔNG đổi theo số lượt Test (2 lượt vs 7 lượt); xem trước ≤ 3', () => {
    const it = taoHocVienDuDuLieu();
    const nhieu = taoHocVienDuDuLieu({ soLuotThem: 5 });
    const xemIt = demTruyVan(() => { xoaHV.xemXoaHocVien(P.admin, it.sid); });
    const xemNhieu = demTruyVan(() => { xoaHV.xemXoaHocVien(P.admin, nhieu.sid); });
    assert(xemIt <= 3 && xemNhieu === xemIt, `xem trước: ${xemIt} / ${xemNhieu}`);
    khoTepMod.datKhoTepChoKiemThu(khoGia);
    try {
      const nIt = demTruyVan(() => { xoaHV.xoaHocVien(P.admin, it.sid, { maXacNhan: it.ma }); });
      const nNhieu = demTruyVan(() => { xoaHV.xoaHocVien(P.admin, nhieu.sid, { maXacNhan: nhieu.ma }); });
      assert(nIt <= 42, `xoá tốn ${nIt} câu (> 42)`);
      assert(nNhieu === nIt, `số câu đổi theo số lượt: ${nIt} → ${nNhieu}`);
    } finally { khoTepMod.datKhoTepChoKiemThu(null); tepDaXoa.length = 0; }
  });

  check('PR-XOA X11 · Còn < 6 000 ms của lời gọi → 503 "chưa xoá gì", mọi bảng như trước', () => {
    const w = taoHocVienDuDuLieu();
    const truoc = demBang();
    let loi: any = null;
    try { hanGio.chayVoiHan(Date.now() + 5_000, () => xoaHV.xoaHocVien(P.admin, w.sid, { maXacNhan: w.ma })); } catch (e) { loi = e; }
    assert(loi?.status === 503 && /chưa xoá gì/.test(loi.message), `phải 503 chưa xoá gì: ${loi?.status} ${loi?.message}`);
    assert(JSON.stringify(demBang()) === JSON.stringify(truoc), 'hết giờ mà vẫn mất dòng');
  });

  check('PR-XOA X8 · Tất cả hoặc không: câu xoá cuối hỏng → ném, mọi bảng như trước, kho tệp KHÔNG bị gọi', () => {
    const z = taoHocVienDuDuLieu();
    const truoc = demBang();
    conn.exec(`CREATE TEMP TRIGGER chan_xoa_hv BEFORE DELETE ON students BEGIN SELECT RAISE(ABORT, 'thu'); END`);
    khoTepMod.datKhoTepChoKiemThu(khoGia);
    tepDaXoa.length = 0;
    let nem = false;
    try { xoaHV.xoaHocVien(P.admin, z.sid, { maXacNhan: z.ma }); } catch { nem = true; } finally {
      conn.exec('DROP TRIGGER IF EXISTS temp.chan_xoa_hv');
      khoTepMod.datKhoTepChoKiemThu(null);
    }
    assert(nem, 'phải ném lỗi');
    assert(JSON.stringify(demBang()) === JSON.stringify(truoc), 'lỗi giữa chừng mà vẫn mất dòng');
    assert(tepDaXoa.length === 0, `kho tệp bị gọi ${tepDaXoa.length} lần dù giao dịch lui`);
    assert(!conn.inTransaction, 'giao dịch còn mở');
  });

  let truocXoa: Record<string, number> = {};
  let dongTTruoc: DongEm = new Map();
  let fkTruoc = 0;
  let ketQua: any = null;

  check('PR-XOA X4 · Sau xoaHocVien(QT, S, mã đúng): 0 dòng ở mọi bảng thuộc S, 0 tệp/thông báo gắn S; foreign_key_check không thêm dòng', () => {
    dongTTruoc = dongCua(T.sid);
    truocXoa = demBang();
    fkTruoc = soLoiFk();
    khoTepMod.datKhoTepChoKiemThu(khoGia);
    tepDaXoa.length = 0;
    try { ketQua = xoaHV.xoaHocVien(P.admin, S.sid, { maXacNhan: `  ${S.ma} ` }); } finally { khoTepMod.datKhoTepChoKiemThu(null); }
    assert(ketQua?.ok === true && ketQua.ma === S.ma, JSON.stringify(ketQua));
    const con: string[] = [];
    for (const [bang, ids] of dongS) {
      const n = (conn.prepare(`SELECT COUNT(*) AS n FROM "${bang}" WHERE rowid IN (${[...ids].join(',')})`).get() as any).n;
      if (n) con.push(`${bang}: ${n}`);
    }
    assert(!con.length, `Còn dòng của S: ${con.join(', ')}`);
    const conMem = (bang: string, ids: number[]) => (conn.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE id IN (${ids.join(',')})`).get() as any).n;
    assert(conMem('attachments', memS.tep) === 0 && conMem('notifications', memS.thongBao) === 0, 'Còn tệp/thông báo gắn S');
    assert(soLoiFk() <= fkTruoc, `foreign_key_check tăng: ${fkTruoc} → ${soLoiFk()}`);
  });

  check('PR-XOA X5 · Em T cùng lớp không mất dòng nào; ba liên kết của T tới S thành NULL; dòng nối PA xử lý của T ↔ vi phạm của S mất', () => {
    const dongTSau = dongCua(T.sid);
    const lech: string[] = [];
    for (const bang of new Set([...dongTTruoc.keys(), ...dongTSau.keys()])) {
      const mongDoi = [...(dongTTruoc.get(bang) ?? [])].filter((r) => !dongS.get(bang)?.has(r)).sort();
      const thuc = [...(dongTSau.get(bang) ?? [])].sort();
      if (JSON.stringify(mongDoi) !== JSON.stringify(thuc)) lech.push(`${bang}: ${mongDoi.length} → ${thuc.length}`);
    }
    assert(!lech.length, `Dòng của T đổi: ${lech.join(', ')}`);
    assert((conn.prepare('SELECT previous_case_id AS v FROM sos_cases WHERE id = ?').get(T.c1) as any)?.v === null, 'Case của T: previous_case_id phải NULL');
    assert((conn.prepare('SELECT evidence_attempt_id AS v FROM case_followups WHERE id = ?').get(T.f1) as any)?.v === null, 'Ghi kết quả của T: evidence_attempt_id phải NULL');
    assert(!!conn.prepare('SELECT 1 FROM discipline_measures WHERE id = ?').get(T.m1), 'PA xử lý của T phải còn');
    assert(!conn.prepare('SELECT 1 FROM measure_violations WHERE measure_id = ? AND violation_id = ?').get(T.m1, S.v1), 'Dòng nối PA của T ↔ vi phạm của S phải mất');
    assert(!!conn.prepare('SELECT 1 FROM measure_violations WHERE measure_id = ? AND violation_id = ?').get(T.m1, T.v1), 'Dòng nối của chính T phải còn');
    const viec = conn.prepare('SELECT source_sos_case_id AS v FROM tasks WHERE id = ?').get(taskChung) as any;
    assert(!!viec && viec.v === null, `Công việc chung phải còn, bỏ liên kết Case: ${JSON.stringify(viec)}`);
    assert(!!conn.prepare('SELECT 1 FROM task_students WHERE task_id = ? AND student_id = ?').get(taskChung, T.sid), 'task_students của T phải còn');
    assert(!!conn.prepare('SELECT 1 FROM tasks WHERE id = ?').get(S.task), 'Công việc nối Case của S giữ lại (Q3)');
  });

  check('PR-XOA X6 · Tổng từng bảng: sau = trước − dòng của S; audit_logs +1; tasks bằng nhau', () => {
    const sau = demBang();
    const lech: string[] = [];
    for (const b of MOI_BANG) {
      let mongDoi = truocXoa[b] - (dongS.get(b)?.size ?? 0);
      if (b === 'audit_logs') mongDoi += 1;
      if (b === 'attachments') mongDoi -= memS.tep.length;
      if (b === 'notifications') mongDoi -= memS.thongBao.length;
      if (sau[b] !== mongDoi) lech.push(`${b}: ${truocXoa[b]} → ${sau[b]} (mong ${mongDoi})`);
    }
    assert(!lech.length, lech.join('; '));
    assert(sau.tasks === truocXoa.tasks, 'tasks phải giữ nguyên');
  });

  await t.checkAsync('PR-XOA X7 · Kho tệp: đúng 5 khoá tệp của S bị xoá, SAU khi giao dịch chốt', async () => {
    await khoTepMod.choViecNenKhoTep();
    const khoa = tepDaXoa.map((x) => x.khoa).sort();
    assert(JSON.stringify(khoa) === JSON.stringify([...S.tep].sort()), `khoá bị xoá: ${khoa.join(', ')}`);
    assert(tepDaXoa.every((x) => !x.trongGiaoDich), 'xoá tệp lúc giao dịch còn mở');
    tepDaXoa.length = 0;
  });

  check('PR-XOA X12 · audit student.delete đúng một dòng: tên · mã, soDong.luotTest = 2, soTep = 5', () => {
    const rows = conn.prepare(`SELECT actor_user_id, entity_label, after_json FROM audit_logs WHERE action = 'student.delete' AND entity_id = ?`).all(S.sid) as any[];
    assert(rows.length === 1, `số dòng audit: ${rows.length}`);
    const after = JSON.parse(rows[0].after_json);
    assert(rows[0].entity_label === `${S.ten} · ${S.ma}` && rows[0].actor_user_id === P.admin.userId, JSON.stringify(rows[0]));
    assert(after.soDong?.luotTest === 2 && after.soTep === 5, rows[0].after_json);
  });

  // ==================================================================== Task 3 — ⋮ Hồ sơ HV › Xoá học viên

  console.log('\nPR-XOA (3) · Giao diện: ⋮ Hồ sơ HV › Xoá học viên (cuối menu, sau đường kẻ, chữ đỏ)');

  const d = await import('../../../shared/domain/index.ts');
  /** Nguồn web đã bỏ chú thích — để quét "không có X" không vấp chữ trong chú thích. */
  const docNguon = (rel: string) => fsMod.readFileSync(pathMod.join(REPO, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const quyenDu = { ghiLoTrinhTiep: true, chuyenLop: true, tamDung: true, quayLai: false, ketThuc: true, luuTru: false, boLuuTru: false };

  check('PR-XOA (3) · mucQuanLyHocVien + coTheXoa: "Xoá học viên" là mục CUỐI, nguyHiem + keTruoc; mục khác không có cờ', () => {
    const ds = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: quyenDu }, cycle: { ratio: false }, status: 'active', coTheXoa: true });
    const cuoi = ds[ds.length - 1];
    assert(cuoi.key === 'xoa-hoc-vien' && cuoi.nhan === 'Xoá học viên' && cuoi.nguyHiem === true && cuoi.keTruoc === true, JSON.stringify(cuoi));
    assert(ds.slice(0, -1).every((m) => !m.nguyHiem && !m.keTruoc), 'chỉ mục Xoá mới đỏ và có đường kẻ');
  });

  check('PR-XOA (3) · không coTheXoa → không có mục Xoá; GVBM (không mục nào) + coTheXoa false → menu rỗng', () => {
    const ds = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: quyenDu }, cycle: null, status: 'active', coTheXoa: false });
    assert(!ds.some((m) => m.key === 'xoa-hoc-vien'), 'QL/GVCN không được thấy Xoá học viên');
    assert(d.mucQuanLyHocVien({ canEdit: false, lopHoc: null, cycle: null, status: 'active', coTheXoa: false }).length === 0, 'GVBM phải rỗng');
    /* Em đã lưu trữ (chỉ xem) vẫn xoá được — QT dọn dữ liệu thử. */
    const chiXem = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: { ...quyenDu, ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, ketThuc: false, boLuuTru: true } },
      cycle: null, status: 'finished', coTheXoa: true }).map((m) => m.key);
    assert(chiXem.join() === 'info,bo-luu-tru,xoa-hoc-vien', chiXem.join());
  });

  check('PR-XOA (3) · XoaHocVienPanel theo khuôn: KhungPanel, nút đỏ tắt tới khi gõ đúng mã, dòng sao lưu nguyên văn; không SectionNote/fmtDate/Modal', () => {
    const pn = docNguon('web/src/modules/students/XoaHocVienPanel.tsx');
    assert(/<KhungPanel\b/.test(pn) && /btn btn-danger/.test(pn) && /disabled=\{busy \|\| !khop\}/.test(pn), 'thiếu khuôn / nút đỏ theo mã');
    assert(pn.includes('Nên sao lưu trước lần xoá đầu (npm run sao-luu)') && pn.includes('Không khôi phục được (trừ từ bản sao lưu).'), 'thiếu dòng nhắc');
    assert(!/SectionNote|fmtDate\(|<Modal\b/.test(pn), 'panel xoá HV dùng thứ bị cấm');
    assert(/tabular-nums/.test(pn), 'cột số phải tabular-nums');
    const trang = docNguon('web/src/modules/students/StudentDetailPage.tsx');
    assert(/coTheXoa: !!data\.viewer\.coTheXoa/.test(trang) && /danger: m\.nguyHiem, keTruoc: m\.keTruoc/.test(trang), 'Hồ sơ HV chưa nối cờ Xoá vào ⋮');
    assert(/keTruoc\?: boolean/.test(docNguon('web/src/ui/Menu.tsx')), 'Menu thiếu keTruoc');
  });

  // ==================================================================== Task 4 — xoá tài khoản

  console.log('\nPR-XOA (4) · Máy chủ: xoá tài khoản — xoá hẳn nếu chưa có dấu vết, xoá mềm nếu có; chặn và cảnh báo');

  const xoaTK = await import('../platform/xoaTaiKhoan.ts');
  const accounts = await import('../platform/accounts.ts');
  const auth = await import('../auth.ts');
  const timNguoiSvc = await import('../platform/timNguoi.ts');
  const meetingSvc = await import('../worklist/meeting.ts');
  const classesSvc = await import('../classes/classes.ts');
  const casesSvc = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');

  const COT_USERS = CANH.filter((x) => x.toi === 'users').map((x) => `${x.bang}.${x.cot}`);
  const demTro = (uid: number) => COT_USERS.reduce((s, k) => {
    const [bang, cot] = k.split('.');
    return s + (conn.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${cot} = ?`).get(uid) as any).n;
  }, 0);
  const demDauVetThat = (uid: number) => xoaTK.COT_TRO_TAI_KHOAN.filter((x) => x.loai === 'dau_vet')
    .reduce((s, x) => s + (conn.prepare(`SELECT COUNT(*) AS n FROM ${x.bang} WHERE ${x.cot} = ?`).get(uid) as any).n, 0);
  const user = (uid: number) => conn.prepare('SELECT * FROM users WHERE id = ?').get(uid) as any;
  let tkSeq = 0;
  const taoTK = (ten: string, matKhau = 'matkhau-cu') => {
    tkSeq += 1;
    const email = `thu.xoa${tkSeq}.${ten}.pisa@gmail.com`;
    const { userId } = accounts.createAccount(P.admin, {
      email, password: matKhau, fullName: `Thu Xoa ${ten} ${tkSeq}`, roles: [{ role: 'teacher', branches: ['MB'] }],
    }) as { userId: number };
    return { id: userId, email, ten: `Thu Xoa ${ten} ${tkSeq}` };
  };

  check('PR-XOA T1 · COT_TRO_TAI_KHOAN (68) BẰNG ĐÚNG tập cột FK trỏ users; đúng 9 cột thiết lập', () => {
    const coDinh = xoaTK.COT_TRO_TAI_KHOAN.map((x) => `${x.bang}.${x.cot}`);
    const thieu = COT_USERS.filter((k) => !coDinh.includes(k));
    const thua = coDinh.filter((k) => !COT_USERS.includes(k));
    assert(!thieu.length, thieu.map((k) => `Phân loại cột ${k} (dấu vết hay thiết lập)`).join('; '));
    assert(!thua.length && coDinh.length === 68 && new Set(coDinh).size === 68, `thừa/trùng: ${thua.join(', ')} · ${coDinh.length}`);
    const tl = xoaTK.COT_TRO_TAI_KHOAN.filter((x) => x.loai === 'thiet_lap').map((x) => `${x.bang}.${x.cot}`).sort();
    assert(JSON.stringify(tl) === JSON.stringify(['demo_sessions.user_id', 'notifications.user_id', 'task_followers.user_id', 'teacher_assignments.user_id',
      'user_emails.user_id', 'user_permissions.user_id', 'user_prefs.user_id', 'user_roles.user_id', 'user_skills.user_id']), tl.join());
  });

  check('PR-XOA T2 · Tài khoản mới, chưa làm gì → cach "han"; xoá xong: dòng users mất, không dòng nào ở 68 cột trỏ id đó', () => {
    const a = taoTK('han');
    auth.createSession(a.id);
    const x = xoaTK.xemXoaTaiKhoan(P.admin, a.id);
    assert(x.cach === 'han' && x.soDauVet === 0 && x.chan === null && x.email === a.email, JSON.stringify(x));
    const r = xoaTK.xoaTaiKhoan(P.admin, a.id, { emailXacNhan: a.email.toUpperCase() });
    assert(r.cach === 'han', JSON.stringify(r));
    assert(!user(a.id) && demTro(a.id) === 0, `còn dòng trỏ tài khoản đã xoá hẳn: ${demTro(a.id)}`);
  });

  /* GVBM thử: có điểm đã nhập + Case báo và đang phụ trách + dạy Reading MB-FT 101; có phiên đang mở. */
  let gv = { id: 0, email: '', ten: '' };
  let tokenGv = '';
  let caseGv = 0;
  let dauVetTruoc = 0;

  check('PR-XOA T3 · GVBM có điểm đã nhập → cach "mem"; xoá xong: deleted, deleted_at, tên (đã xoá), email giải phóng, không mật khẩu/phiên/vai/phân công; dấu vết giữ nguyên', () => {
    gv = taoTK('gvbm');
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
                  VALUES (?, ?, 'reading', 0, '2026-01-01', 'active', ?)`).run(gv.id, FT, new Date().toISOString());
    const diem = conn.prepare('SELECT id FROM assessment_scores ORDER BY id LIMIT 1').get() as any;
    conn.prepare('UPDATE assessment_scores SET entered_by = ? WHERE id = ?').run(gv.id, diem.id);
    caseGv = (conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' ORDER BY id LIMIT 1`).get() as any).id;
    conn.prepare('UPDATE sos_cases SET reported_by = ?, owner_user_id = ? WHERE id = ?').run(gv.id, gv.id, caseGv);
    tokenGv = auth.createSession(gv.id);
    const x = xoaTK.xemXoaTaiKhoan(P.admin, gv.id);
    assert(x.cach === 'mem' && x.soDauVet >= 3 && x.chan === null, JSON.stringify(x));
    assert(x.chiTiet.some((c) => c.nhan === 'điểm đã nhập' && c.so === 1) && x.chiTiet.some((c) => c.nhan === 'Case'), JSON.stringify(x.chiTiet));
    dauVetTruoc = demDauVetThat(gv.id);
    const r = xoaTK.xoaTaiKhoan(P.admin, gv.id, { emailXacNhan: ` ${gv.email} ` });
    assert(r.cach === 'mem', JSON.stringify(r));
    const u = user(gv.id);
    assert(u.status === 'deleted' && !!u.deleted_at && u.full_name === `${gv.ten} (đã xoá)` && u.email === `da-xoa-${gv.id}@invalid`
      && u.password_hash === null && u.password_salt === null, JSON.stringify(u));
    const dem = (sql: string) => (conn.prepare(sql).get(gv.id) as any).n;
    assert(dem('SELECT COUNT(*) AS n FROM demo_sessions WHERE user_id = ?') === 0, 'còn phiên');
    assert(dem(`SELECT COUNT(*) AS n FROM user_roles WHERE user_id = ? AND status = 'active'`) === 0, 'còn vai active');
    assert(dem(`SELECT COUNT(*) AS n FROM teacher_assignments WHERE user_id = ? AND status = 'active'`) === 0, 'còn phân công active');
    const ta = conn.prepare('SELECT status, effective_to FROM teacher_assignments WHERE user_id = ?').get(gv.id) as any;
    assert(ta.status === 'ended' && ta.effective_to === TODAY, JSON.stringify(ta));
    assert(demDauVetThat(gv.id) === dauVetTruoc, `dấu vết đổi: ${dauVetTruoc} → ${demDauVetThat(gv.id)}`);
  });

  check('PR-XOA T4 · Tạo lại tài khoản ĐÚNG email cũ được; đăng nhập email cũ + mật khẩu cũ → "Email hoặc mật khẩu không đúng."', () => {
    const { userId } = accounts.createAccount(P.admin, {
      email: gv.email, password: 'matkhau-moi', fullName: 'Nguoi Moi Cung Email', roles: [{ role: 'teacher', branches: ['MB'] }],
    }) as { userId: number };
    assert(userId !== gv.id, 'phải là tài khoản mới');
    t.assertThrows(() => accounts.login(gv.email, 'matkhau-cu'), /Email hoặc mật khẩu không đúng\./, 'mật khẩu cũ vẫn vào được');
    assert(accounts.login(gv.email, 'matkhau-moi').userId === userId, 'tài khoản mới đăng nhập được');
  });

  check('PR-XOA T5 · Người đã xoá ẩn khỏi mọi ô chọn: /ref/nguoi, /ref/people, /ref/users, /ref/teachers, ứng viên phân công; phiên cũ hết', () => {
    const q = 'Thu Xoa gvbm';
    /* Đối chứng: một GV còn hoạt động cùng tên gần giống PHẢI hiện — để "không thấy" dưới đây không phải vì ô tìm trả rỗng. */
    const conDung = taoTK('gvbm');
    assert(timNguoiSvc.timNguoi(P.admin, { q }).some((r) => r.id === conDung.id), 'đối chứng: timNguoi không thấy GV còn hoạt động');
    assert((meetingSvc.searchPeople(P.admin, q) as any[]).some((r) => r.id === conDung.id), 'đối chứng: searchPeople');
    assert(classesSvc.classTeachers(P.admin, FT).candidates.some((r: any) => r.id === conDung.id), 'đối chứng: ứng viên phân công');
    assert(!timNguoiSvc.timNguoi(P.admin, { q }).some((r) => r.id === gv.id), 'timNguoi còn người đã xoá');
    assert(!(meetingSvc.searchPeople(P.admin, q) as any[]).some((r) => r.id === gv.id), 'searchPeople còn người đã xoá');
    assert(!classesSvc.classTeachers(P.admin, FT).candidates.some((r: any) => r.id === gv.id), 'ứng viên phân công còn người đã xoá');
    /* /ref/users, /ref/teachers viết thẳng trong routes — khẳng định câu lọc người còn hoạt động. */
    const routes = docNguon('server/src/routes/index.ts');
    const khoi = (duong: string) => routes.slice(routes.indexOf(`api.get('${duong}'`), routes.indexOf(`api.get('${duong}'`) + 1200);
    assert(/status\s*=\s*'active'/.test(khoi('/ref/users')) && /u\.status = 'active'/.test(khoi('/ref/teachers')), '/ref/users hoặc /ref/teachers không lọc active');
    assert(auth.resolveSession(tokenGv) === null, 'phiên cũ vẫn dùng được');
  });

  check('PR-XOA T6 · Lịch sử giữ tên kèm "(đã xoá)": Case người đó từng báo', () => {
    const d6 = casesSvc.caseDetail(P.admin, caseGv) as any;
    assert(typeof d6.reportedBy === 'string' && d6.reportedBy.endsWith(' (đã xoá)'), `reportedBy = ${d6.reportedBy}`);
  });

  check('PR-XOA T7 · Chặn: tự xoá mình; Quản trị hệ thống cuối cùng; GVCN lớp đang học ("Đổi GVCN lớp … trước.") — không gì đổi', () => {
    const tuXoa = xoaTK.xemXoaTaiKhoan(P.admin, P.admin.userId);
    assert(tuXoa.chan === 'Không tự xoá tài khoản của chính mình.', String(tuXoa.chan));
    assert(maLoi(() => xoaTK.xoaTaiKhoan(P.admin, P.admin.userId, { emailXacNhan: user(P.admin.userId).email })) === 400, 'tự xoá phải 400');
    /* QT thứ hai xoá QT gốc: được khi còn QT khác; hết QT khác (vai QT thứ hai tạm kết thúc) → chặn. */
    const q2 = accounts.createAccount(P.admin, {
      email: `thu.xoa.qt${Date.now() % 100000}.pisa@gmail.com`, password: 'matkhau-qt', fullName: 'Thu Xoa QT', roles: [{ role: 'system_admin', branches: [] }],
    }) as { userId: number };
    const pQ2 = loadPrincipal(q2.userId);
    assert(xoaTK.xemXoaTaiKhoan(pQ2, P.admin.userId).chan === null, 'còn QT khác thì không chặn "QT cuối"');
    conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(q2.userId);
    try {
      assert(xoaTK.xemXoaTaiKhoan(pQ2, P.admin.userId).chan === 'Đây là Quản trị hệ thống cuối cùng.', 'phải chặn QT cuối');
    } finally { conn.prepare(`UPDATE user_roles SET status = 'active' WHERE user_id = ?`).run(q2.userId); }
    const gvcnId = P.normalCoreTeacher.userId;
    const truoc = JSON.stringify(user(gvcnId));
    const x = xoaTK.xemXoaTaiKhoan(P.admin, gvcnId);
    assert(/^Đổi GVCN lớp .*MB-FOU 12.* trước\.$/.test(String(x.chan)), String(x.chan));
    assert(maLoi(() => xoaTK.xoaTaiKhoan(P.admin, gvcnId, { emailXacNhan: user(gvcnId).email })) === 400, 'GVCN phải 400');
    assert(JSON.stringify(user(gvcnId)) === truoc, 'bị chặn mà vẫn đổi');
  });

  check('PR-XOA T8 · Cảnh báo: GVBM → "Lớp … sẽ thiếu GV môn …"; việc đang giao có số', () => {
    const g = taoTK('canhbao');
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
                  VALUES (?, ?, 'reading', 0, '2026-01-01', 'active', ?)`).run(g.id, FT, new Date().toISOString());
    const cs = conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done' AND id != ? ORDER BY id DESC LIMIT 2`).all(caseGv) as any[];
    for (const r of cs) conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ?').run(g.id, r.id);
    const x = xoaTK.xemXoaTaiKhoan(P.admin, g.id);
    assert(x.canhBao.includes('Lớp MB-FT 101 sẽ thiếu GV môn Reading.'), x.canhBao.join(' | '));
    /* Cùng môn ở lớp thứ hai → vẫn MỘT dòng, gộp mã lớp. */
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
                  VALUES (?, ?, 'reading', 0, '2026-01-01', 'active', ?)`).run(g.id, t.classId('MB-FOU 12'), new Date().toISOString());
    const x2 = xoaTK.xemXoaTaiKhoan(P.admin, g.id);
    assert(x2.canhBao.includes('Lớp MB-FOU 12, MB-FT 101 sẽ thiếu GV môn Reading.') && x2.canhBao.filter((c) => /thiếu GV môn/.test(c)).length === 1,
      x2.canhBao.join(' | '));
    assert(x.canhBao.some((c) => c === `Còn ${cs.length} Case/việc đang giao cho người này — đổi người phụ trách sau khi xoá.`), x.canhBao.join(' | '));
  });

  check('PR-XOA T9 · Quyền: QL → 403 cả xem và xoá; email sai → 400; xoá lần hai → 400 "Tài khoản đã xoá."', () => {
    const a = taoTK('quyen');
    assert(maLoi(() => xoaTK.xemXoaTaiKhoan(P.mbManager, a.id)) === 403, 'QL xem phải 403');
    assert(maLoi(() => xoaTK.xoaTaiKhoan(P.mbManager, a.id, { emailXacNhan: a.email })) === 403, 'QL xoá phải 403');
    assert(maLoi(() => xoaTK.xoaTaiKhoan(P.admin, a.id, { emailXacNhan: 'sai.pisa@gmail.com' })) === 400, 'email sai phải 400');
    assert(!!user(a.id), 'email sai mà vẫn xoá');
    t.assertThrows(() => xoaTK.xoaTaiKhoan(P.admin, gv.id, { emailXacNhan: `da-xoa-${gv.id}@invalid` }), /Tài khoản đã xoá\./, 'xoá lần hai');
    t.assertThrows(() => xoaTK.xemXoaTaiKhoan(P.admin, gv.id), /Tài khoản đã xoá\./, 'xem tài khoản đã xoá');
  });

  check('PR-XOA T10 · listAccounts có dòng đã xoá kèm deletedAt; setRoles / resetPassword / quyền riêng trên tài khoản đã xoá → 400', () => {
    const row = accounts.listAccounts(P.admin).find((r) => r.id === gv.id);
    assert(!!row && row.status === 'deleted' && !!row.deletedAt, JSON.stringify(row));
    t.assertThrows(() => accounts.setRoles(P.admin, gv.id, [{ role: 'teacher', branches: ['MB'] }]), /Tài khoản đã xoá\./, 'setRoles');
    t.assertThrows(() => accounts.resetPassword(P.admin, gv.id, 'matkhau-xyz'), /Tài khoản đã xoá\./, 'resetPassword');
    t.assertThrows(() => accounts.setUserPermissions(P.admin, gv.id, []), /Tài khoản đã xoá\./, 'setUserPermissions');
  });

  check('PR-XOA T11 · Số câu SQL: xem trước ≤ 8, xoá mềm ≤ 15, xoá hẳn ≤ 15', () => {
    const han = taoTK('demhan');
    const mem = taoTK('demmem');
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, created_at) VALUES (?, 'thu', 'thu', ?)`).run(mem.id, new Date().toISOString());
    const nXem = demTruyVan(() => { xoaTK.xemXoaTaiKhoan(P.admin, mem.id); });
    const nMem = demTruyVan(() => { xoaTK.xoaTaiKhoan(P.admin, mem.id, { emailXacNhan: mem.email }); });
    const nHan = demTruyVan(() => { xoaTK.xoaTaiKhoan(P.admin, han.id, { emailXacNhan: han.email }); });
    assert(user(mem.id)?.status === 'deleted' && !user(han.id), 'tiền đề: một mềm một hẳn');
    assert(nXem <= 8 && nMem <= 15 && nHan <= 15, `xem ${nXem}, mềm ${nMem}, hẳn ${nHan}`);
  });

  check('PR-XOA T12 · audit user.delete đúng một dòng mỗi lần xoá (tên cũ, cách xoá, số dấu vết)', () => {
    /* Lọc theo tên cũ: SQLite cấp lại id của tài khoản đã xoá HẲN ở T2 cho tài khoản tạo sau (xem X14). */
    const rows = conn.prepare(`SELECT actor_user_id, entity_label, after_json FROM audit_logs WHERE action = 'user.delete' AND entity_id = ? AND entity_label = ?`)
      .all(gv.id, gv.ten) as any[];
    assert(rows.length === 1, `số dòng: ${rows.length}`);
    const a = JSON.parse(rows[0].after_json);
    assert(rows[0].entity_label === gv.ten && rows[0].actor_user_id === P.admin.userId && a.cach === 'mem' && a.soDauVet === dauVetTruoc,
      JSON.stringify(rows[0]));
  });

  const attemptsSvc = await import('../fasttrack/attempts.ts');
  check('PR-XOA X14 · Id lượt Test của em đã xoá được cấp lại cho lượt mới → lịch sử điểm của lượt mới KHÔNG lẫn nhật ký cũ (Q1 giữ nhật ký)', () => {
    const e = taoHocVienDuDuLieu();
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, after_json, created_at)
                  VALUES (?, 'score.edit', 'assessment_attempt', ?, 'cũ', '{}', ?)`).run(U, e.a2, new Date().toISOString());
    assert(attemptsSvc.scoreHistoryOf(e.a2).length === 1, 'tiền đề: lượt cũ có một dòng lịch sử điểm');
    xoaHV.xoaHocVien(P.admin, e.sid, { maXacNhan: e.ma });
    const moi = taoHV(taoLop(3));
    const cy = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ?').get(moi) as any).id;
    conn.prepare(`INSERT INTO assessment_attempts (id, cycle_id, student_id, attempt_no, created_at) VALUES (?,?,?,1,?)`)
      .run(e.a2, cy, moi, new Date(Date.now() + 1_000).toISOString());
    assert(attemptsSvc.scoreHistoryOf(e.a2).length === 0, 'lượt mới hiện lịch sử điểm của em đã xoá');
  });

  // ==================================================================== Task 5 — Tài khoản › ⋯ › Xoá tài khoản

  console.log('\nPR-XOA (5) · Giao diện: Quản trị hệ thống › Tài khoản › ⋯ › Xoá tài khoản, nút lọc Đang dùng / Đã xoá');

  check('PR-XOA (5) · XoaTaiKhoanPanel theo khuôn: KhungPanel, nút đỏ tắt tới khi gõ đúng email / khi bị chặn, dòng sao lưu; không SectionNote/fmtDate/Modal', () => {
    const pn = docNguon('web/src/modules/platform/XoaTaiKhoanPanel.tsx');
    assert(/<KhungPanel\b/.test(pn) && /btn btn-danger/.test(pn) && /disabled=\{busy \|\| !khop \|\| !!d\?\.chan\}/.test(pn), 'thiếu khuôn / nút đỏ');
    assert(/toLowerCase\(\)/.test(pn), 'so email phải không phân biệt hoa thường');
    assert(pn.includes('Nên sao lưu trước lần xoá đầu (npm run sao-luu)') && pn.includes('Chưa có dấu vết → xoá hẳn')
      && pn.includes('→ tài khoản bị khoá và ẩn, lịch sử giữ tên kèm (đã xoá)'), 'thiếu câu của đặc tả');
    assert(!/SectionNote|fmtDate\(|<Modal\b/.test(pn), 'panel xoá tài khoản dùng thứ bị cấm');
  });

  check('PR-XOA (5) · AccountsAdmin: ⋯ "Xoá tài khoản" chữ đỏ; nút lọc "Đang dùng" / "Đã xoá"; dòng đã xoá không có Sửa/⋯', () => {
    const ad = docNguon('web/src/modules/platform/AccountsAdmin.tsx');
    assert(/nhan: 'Xoá tài khoản', nguyHiem: true/.test(ad) && ad.includes('Đang dùng (') && ad.includes('Đã xoá ('), 'thiếu mục Xoá / nút lọc');
    assert(/u\.status === 'deleted' \? \(\s*<span[^>]*>Đã xoá \{ngay\(u\.deletedAt\)\}/.test(ad), 'dòng đã xoá phải ghi "Đã xoá {ngày}" thay cho Sửa/⋯');
    assert(/nguyHiem\?: boolean/.test(docNguon('web/src/ui/MenuDong.tsx')), 'MenuDong thiếu nguyHiem');
  });

  // ==================================================================== Task 6 — lệnh kiểm chỉ đọc

  console.log('\nPR-XOA (6) · npm run kiem-sau-xoa — CHỈ ĐỌC');

  check('PR-XOA (6) · kiemSauXoa.ts (bỏ chú thích) không có .run( / .exec( / INSERT / UPDATE / DELETE; package.json có lệnh', () => {
    const nguon = docNguon('server/src/ops/kiemSauXoa.ts');
    const cam = ['.run(', '.exec(', 'INSERT', 'UPDATE', 'DELETE'].filter((x) => nguon.includes(x));
    assert(!cam.length, `lệnh chỉ đọc có câu ghi: ${cam.join(', ')}`);
    assert(/prepare\('PRAGMA foreign_key_check'\)/.test(nguon) && nguon.includes('deleted_at'), 'thiếu mục (4) hoặc (6)');
    const pkg = JSON.parse(fsMod.readFileSync(pathMod.join(REPO, 'package.json'), 'utf8'));
    assert(/ops\/kiemSauXoa\.js$/.test(pkg.scripts?.['kiem-sau-xoa'] ?? ''), 'package.json thiếu kiem-sau-xoa');
  });
}
