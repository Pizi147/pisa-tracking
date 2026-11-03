/**
 * PHÉP KIỂM PR-OV4b — hộp nhập điểm MT: nhận xét cả 4 kỹ năng (MT + MT0), W1 / W2 lưu riêng, lớp thường có nhận xét từng môn,
 * bảng quy đổi số câu → band dùng chung (web xem trước band). Mỗi phép kiểm dựng ca trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { LUOT_LO_TRINH_CUOI_SQL } from '../students/tamDung.ts';   // LOC-HIEN-TAI: ca dựng chỉ chọn lượt hiện tại (bảng điểm lớp bỏ lượt lộ trình cũ)

export async function runPrOv4bTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const scoring: any = await import('../fasttrack/scoring.ts');
  const regular: any = await import('../normal/regular.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const week: any = await import('../platform/week.ts');
  const hoanTat: any = await import('../fasttrack/hoanTat.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV4b · hộp nhập điểm MT: nhận xét 4 kỹ năng, W1 / W2 lưu riêng, nhận xét lớp thường');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const WS = '2026-11-02', TRONG = '2026-11-04';
  const W = week.ensurePeriod(WS).id as number;
  const luot = (one(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0 ORDER BY a.id DESC LIMIT 1`, lop)?.id) as number;
  /** Lượt về sạch: mọi kỹ năng bắt buộc ở tuần W, chưa điểm. */
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(W, aid);
    xoaNho();
  };
  const dong = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);

  check('OV4b-0 · web xem trước band theo cùng hàm + cùng bảng với máy chủ (BAND-QUY-DOI: bảng ở DB)', () => {
    const bang = dm.BANG_QUY_DOI_GOC;
    for (const k of ['listening', 'reading'] as const) {
      for (let n = 0; n <= 40; n += 1) {
        assert(dm.bandTuSoCau(bang, k, n) === scoring.bandFromRaw(k, n, bang), `${k} ${n}: ${dm.bandTuSoCau(bang, k, n)} ≠ ${scoring.bandFromRaw(k, n, bang)}`);
      }
      assert(dm.bandTuSoCau(bang, k, 41) === null && dm.bandTuSoCau(bang, k, -1) === null && dm.bandTuSoCau(bang, k, 2.5) === null, `${k}: ngoài 0–40 phải null`);
    }
  });

  check('OV4b-1 · nhận xét L, R lưu được (MT) — không đổi điểm, "Nhập bởi", trạng thái lượt', () => thu(() => {
    assert(luot, 'cần một lượt MT ở MB FT 101');
    dung(luot);
    attempts.saveScore(P.lrTeacher, luot, 'listening', { rawScore: 30 }, TRONG);
    const truoc = dong(luot, 'listening');
    const tt = one('SELECT status FROM assessment_attempts WHERE id = ?', luot).status;
    attempts.saveScore(P.lrTeacher, luot, 'listening', { nhanXet: '  Nghe phần 3 chậm  ' }, TRONG);
    attempts.saveScore(P.lrTeacher, luot, 'reading', { nhanXet: 'Bỏ trống 4 câu cuối' }, TRONG);
    const sau = dong(luot, 'listening');
    assert(sau.comment === 'Nghe phần 3 chậm', `comment L: ${sau.comment}`);
    assert(sau.raw_score === truoc.raw_score && sau.band === truoc.band && sau.entered_by === truoc.entered_by, 'nhận xét đổi điểm / người nhập');
    assert(dong(luot, 'reading').comment === 'Bỏ trống 4 câu cuối' && dong(luot, 'reading').raw_score === null, 'R: chỉ nhận xét, chưa điểm');
    assert(one('SELECT status FROM assessment_attempts WHERE id = ?', luot).status === tt, 'trạng thái lượt đổi');
    const o = attempts.classScoreSheet(P.admin, lop, W, TRONG).rows.find((r: any) => r.attemptId === luot).cells;
    assert(o.find((c: any) => c.skill === 'reading').nhanXet === 'Bỏ trống 4 câu cuối', 'ô R trên lưới phải có nhận xét');
    /* Điểm + nhận xét cùng một lệnh (hộp lưu một lần). */
    attempts.saveScore(P.lrTeacher, luot, 'reading', { rawScore: 16, nhanXet: 'Matching headings' }, TRONG);
    assert(dong(luot, 'reading').raw_score === 16 && dong(luot, 'reading').comment === 'Matching headings', 'điểm + nhận xét một lệnh');
  }));

  check('OV4b-2 · nhận xét > 300 ký tự (N35) → 400; GV môn khác → 403', () => thu(() => {
    dung(luot);
    const e1 = loi(() => attempts.saveScore(P.lrTeacher, luot, 'listening', { nhanXet: 'x'.repeat(1001) }, TRONG));
    assert(e1?.status === 400 && /300/.test(e1.message), `>300: ${e1?.status} ${e1?.message}`);
    const e2 = loi(() => attempts.saveScore(P.sTeacher, luot, 'reading', { nhanXet: 'không phải môn của tôi' }, TRONG));
    assert(e2?.status === 403, `GV S nhận xét R: ${e2?.status} ${e2?.message}`);
    assert(!dong(luot, 'reading'), 'không được ghi dòng nào');
  }));

  check('OV4b-3 · W1 lưu một mình → W chưa có; W2 lưu sau → W = (W1 + W2 × 2) / 3', () => thu(() => {
    dung(luot);
    attempts.saveScore(P.w1Teacher, luot, 'writing1', { criteria: [5, 5, 5, 5], nhanXet: 'Thiếu overview' }, TRONG);
    let r = attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', luot));
    assert(r.bands.writing === null, `W khi mới có W1: ${r.bands.writing}`);
    attempts.saveScore(P.w2Teacher, luot, 'writing2', { criteria: [6, 6, 6, 6] }, TRONG);
    r = attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', luot));
    const w1 = dong(luot, 'writing1').band, w2 = dong(luot, 'writing2').band;
    assert(r.bands.writing === scoring.writingBand(w1, w2) && r.bands.writing !== null, `W = ${r.bands.writing}, W1 ${w1}, W2 ${w2}`);
    assert(dong(luot, 'writing1').comment === 'Thiếu overview' && dong(luot, 'writing2').comment === null, 'nhận xét W1 / W2 riêng');
  }));

  check('OV4b-4 · MT0 lớp thường: nhận xét L lưu được (band MT0 không đổi)', () => thu(() => {
    const QL = P.admin;
    let mt0: number | null = null;
    for (const x of all(`SELECT s.id sid FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id
        WHERE c.programme_code IN ('BE', 'FOU', 'ELE') AND c.is_fast_track = 0 AND s.archived_at IS NULL AND s.status = 'active'
          AND (SELECT COUNT(*) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active') = 1
          AND EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = s.id AND lc.status = 'active')
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts x WHERE x.class_id = c.id AND x.kind = 'mt0') ORDER BY s.id LIMIT 30`)) {
      conn.exec('SAVEPOINT ov4b');
      try {
        loTrinh.ghiLoTrinhTiep(QL, x.sid, { huong: 'fast_track', mucTieu: 6.5 });
        mt0 = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, x.sid)?.id ?? null;
        conn.exec('RELEASE ov4b');
      } catch { conn.exec('ROLLBACK TO ov4b'); conn.exec('RELEASE ov4b'); }
      if (mt0) break;
    }
    assert(mt0, 'cần một lượt MT0');
    attempts.saveScore(QL, mt0, 'listening', { nhanXet: 'MT0: nghe ổn' });
    const d = dong(mt0!, 'listening');
    assert(d.comment === 'MT0: nghe ổn' && d.band === null && d.raw_score === null, `MT0 L: ${JSON.stringify(d)}`);
  }));

  check('OV4b-5 · lớp thường: nhận xét lưu đúng ô (không đổi điểm), regularSheet trả nhận xét; GV môn khác 403; > 1000 → 400', () => thu(() => {
    const LOP = classId('MB FOU 12');
    const mon = (all(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`,
      LOP, P.normalSubjectTeacher.userId).map((x) => x.skill as string)).filter((k) => ['listening', 'reading', 'writing', 'speaking'].includes(k));
    const khac = ['listening', 'reading', 'writing', 'speaking'].find((k) => !mon.includes(k));
    assert(mon.length && khac, `GVBM MB FOU 12 dạy ${mon}`);
    /* Bài chưa hoàn tất (R11: bài đã hoàn tất chỉ Quản lý sửa — kể cả nhận xét). */
    const a = all(`SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.archived_at IS NULL AND s.status = 'active'
        AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
      WHERE a.class_id = ? AND a.kind != 'mt0' AND a.status != 'cancelled' ORDER BY a.id`, LOP)
      .map((x) => x.id as number).find((id) => !hoanTat.dotHoanTat(id, t.TODAY).hoanTat)!;
    assert(a, 'cần một bài lớp thường chưa hoàn tất ở MB FOU 12');
    const k = mon[0];
    const truoc = dong(a, k);
    regular.saveRegularScore(P.normalSubjectTeacher, a, k, { nhanXet: 'Đọc chậm' });
    const sau = dong(a, k);
    assert(sau.comment === 'Đọc chậm', `comment: ${sau?.comment}`);
    assert((sau.raw_score ?? null) === (truoc?.raw_score ?? null) && (sau.raw_total ?? null) === (truoc?.raw_total ?? null), 'nhận xét đổi điểm');
    for (const x of all('SELECT skill, comment FROM assessment_scores WHERE attempt_id = ? AND skill != ?', a, k)) {
      assert(x.comment !== 'Đọc chậm', `nhận xét lọt sang ${x.skill}`);
    }
    const o = regular.regularSheet(P.admin, LOP).rows.find((r: any) => r.attemptId === a).skillSchedule.find((x: any) => x.skill === k);
    assert(o.nhanXet === 'Đọc chậm', `regularSheet nhanXet: ${o.nhanXet}`);
    const e1 = loi(() => regular.saveRegularScore(P.normalSubjectTeacher, a, khac, { nhanXet: 'x' }));
    assert(e1?.status === 403, `GV môn khác: ${e1?.status} ${e1?.message}`);
    const e2 = loi(() => regular.saveRegularScore(P.normalSubjectTeacher, a, k, { nhanXet: 'x'.repeat(1001) }));
    assert(e2?.status === 400, `>1000: ${e2?.status} ${e2?.message}`);
    regular.saveRegularScore(P.normalSubjectTeacher, a, k, { nhanXet: null });
    assert(dong(a, k).comment === null, 'xoá nhận xét');
  }));
}
