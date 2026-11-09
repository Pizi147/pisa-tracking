/**
 * KHONG-LOP-GHI (chủ SP 10/11 tối, `plan.md` mục 4 B' mục 8; PTA chọn (b)): lượt KHÔNG lớp chấm theo chương trình LỘ TRÌNH ở mọi đường đọc (#816, #964) —
 * đường GHI cũng vậy: nhập điểm / "-" / kết quả lượt không lớp của lộ trình lớp thường không còn 400 "không thuộc lớp thường" (X07).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrKhongLopGhiTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const regular: any = await import('../normal/regular.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nKHONG-LOP-GHI · lượt không lớp: đường ghi theo chương trình lộ trình');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  /** Em lộ trình FOU (lớp thường), lượt Progress KHÔNG lớp ở tuần này. */
  const luotKhongLop = () => {
    const now = new Date().toISOString();
    const tag = `KLG-${Math.random().toString(36).slice(2, 7)}`;
    const br = one(`SELECT id FROM branches WHERE code = 'MB'`).id;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, br, now).lastInsertRowid);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-01-01', 'active', ?)`)
      .run(sid, now).lastInsertRowid);
    const tuan = week.ensurePeriod(d.mondayOfDate(TODAY)).id;
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?, 1, 'progress', NULL, ?, 'planned', ?)`)
      .run(cy, sid, tuan, now).lastInsertRowid);
    skillSch.ensureSkillRows(aid);
    xoaNho();
    return aid;
  };

  check('KLG-1 · lượt không lớp (lộ trình FOU): QL chi nhánh của em nhập điểm tỷ lệ được, kết quả theo chương trình lộ trình', () => thu(() => {
    const a = luotKhongLop();
    regular.saveRegularScore(P.mbManager, a, 'listening', { score: 15, total: 20 }, TODAY);
    assert(one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a)?.raw_score === 15, 'điểm phải lưu');
    const kq = regular.regularResultOf(a);
    assert(kq.skills?.length === 4, `kết quả theo 4 môn FOU: ${JSON.stringify(kq)}`);
    const gv = (() => { try { regular.saveRegularScore(P.w1Teacher, a, 'reading', { score: 10, total: 20 }, TODAY); } catch (e) { return e as any; } return null; })();
    assert(gv?.status === 403, `GV không phân công: ${gv?.status}`);
    const tl = ck.tyLeTongLo([a]).get(a);
    assert(tl?.ct === 'FOU' && tl.required === 4, `tỷ lệ Cuối khoá / Giữa khoá theo lộ trình: ${JSON.stringify(tl ?? null)}`);
  }));

  check('KLG-2 · lượt không lớp: ghi "-" và gỡ "-" được (không 400)', () => thu(() => {
    const a = luotKhongLop();
    regular.reportRegularNoShow(P.admin, a, 'reading', true, TODAY);
    assert(!!one(`SELECT no_show_period_id p FROM assessment_scores WHERE attempt_id = ? AND skill = 'reading'`, a)?.p, 'dấu "-" phải ghi');
    regular.reportRegularNoShow(P.admin, a, 'reading', false, TODAY);
    assert(!one(`SELECT no_show_period_id p FROM assessment_scores WHERE attempt_id = ? AND skill = 'reading'`, a)?.p, 'gỡ "-"');
  }));
}
