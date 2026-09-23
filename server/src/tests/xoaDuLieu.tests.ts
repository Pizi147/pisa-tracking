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
}
