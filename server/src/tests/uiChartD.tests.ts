/**
 * PHÉP KIỂM UI-CHART-D (kế hoạch M5 PR ③) — dữ liệu CHỈ ĐỌC cho chart D / nút Bảng / hàng Thi thật ở `GET /students/:id`:
 *  1 · mỗi lượt FT có `diemKn` (band từng ô nhập — W1 / W2 tách, đủ MỌI lượt, không cắt 4 như `points` của bảng kỹ năng) và `nhanXet` (nhận xét bài MT
 *  của kỹ năng; Speaking không có thì lấy nhận xét GV phụ trách) · 2 · `cycle.thiThat` = ngày + L R W S + OVR (cùng `thiThatCuaCycle`) + Target lúc nhập;
 *  chưa có gì → null. Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runUiChartDTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const profile: any = await import('../students/profile.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nUI-CHART-D · dữ liệu chart D (điểm W1 / W2 + nhận xét MT mọi lượt, thi thật)');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  /* Em FT có lượt có điểm W1 (lộ trình đang chạy). */
  const dong = one(`SELECT a.id AS attempt_id, a.student_id, c.id AS cycle_id FROM assessment_attempts a JOIN learning_cycles c ON c.id = a.cycle_id
     JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = 'writing1' AND s.band IS NOT NULL
    WHERE c.route IS NOT NULL AND c.status = 'active' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`);
  assert(dong, 'demo phải có em FT có điểm W1');

  check('mỗi lượt FT có diemKn (W1 / W2 tách) + nhanXet theo kỹ năng', () => thu(() => {
    conn.prepare(`UPDATE assessment_scores SET comment = 'Mở bài rõ quan điểm' WHERE attempt_id = ? AND skill = 'writing1'`).run(dong.attempt_id);
    const w1 = one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`, dong.attempt_id).band;
    const hs = profile.studentProfile(P.admin, dong.student_id, dong.cycle_id);
    const a = hs.attempts.find((x: any) => x.id === dong.attempt_id);
    assert(a?.diemKn?.writing1 === w1, `diemKn.writing1 = ${a?.diemKn?.writing1}, cần ${w1}`);
    assert(a.nhanXet?.writing1 === 'Mở bài rõ quan điểm', `nhanXet.writing1 = ${a.nhanXet?.writing1}`);
  }));

  check('Speaking không có nhận xét người chấm → lấy nhận xét GV phụ trách', () => thu(() => {
    const s = one(`SELECT attempt_id FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id WHERE a.student_id = ? AND s.skill = 'speaking' AND s.band IS NOT NULL LIMIT 1`, dong.student_id);
    assert(s, 'em phải có điểm Speaking');
    conn.prepare(`UPDATE assessment_scores SET comment = NULL, nhan_xet_phu_trach = 'Nói trôi hơn' WHERE attempt_id = ? AND skill = 'speaking'`).run(s.attempt_id);
    const a = profile.studentProfile(P.admin, dong.student_id, dong.cycle_id).attempts.find((x: any) => x.id === s.attempt_id);
    assert(a.nhanXet?.speaking === 'Nói trôi hơn', `nhanXet.speaking = ${a.nhanXet?.speaking}`);
  }));

  check('diemKn có đủ mọi lượt có điểm (không cắt 4 lượt cuối như points)', () => thu(() => {
    const hs = profile.studentProfile(P.admin, dong.student_id, dong.cycle_id);
    const coDiem = all(`SELECT DISTINCT a.id FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id AND s.band IS NOT NULL
       WHERE a.cycle_id = ? AND a.status != 'cancelled'`, dong.cycle_id).map((r) => r.id);
    for (const id of coDiem) {
      const a = hs.attempts.find((x: any) => x.id === id);
      assert(a && Object.values(a.diemKn ?? {}).some((v) => v != null), `lượt ${id} thiếu diemKn`);
    }
  }));

  check('cycle.thiThat: null khi chưa có; có ngày + L R W S → OVR + Target lúc nhập', () => thu(() => {
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = NULL, thi_that_l = NULL, thi_that_r = NULL, thi_that_w = NULL, thi_that_s = NULL, thi_that_khong_thi = 0,
      outcome = NULL, outcome_score = NULL WHERE id = ?`).run(dong.cycle_id);
    assert(profile.studentProfile(P.admin, dong.student_id, dong.cycle_id).cycle.thiThat === null, 'chưa có thi thật phải null');
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = '2026-10-17', thi_that_l = 6.5, thi_that_r = 6.0, thi_that_w = 5.5, thi_that_s = 6.0, thi_that_target = 6.5 WHERE id = ?`)
      .run(dong.cycle_id);
    xoaNho();
    const tt = profile.studentProfile(P.admin, dong.student_id, dong.cycle_id).cycle.thiThat;
    assert(tt?.ngay === '2026-10-17' && tt.l === 6.5 && tt.w === 5.5 && tt.ovr === 6.0 && tt.target === 6.5 && tt.khongThi === false, `thiThat = ${JSON.stringify(tt)}`);
  }));

  check('lượt lớp thường có nguongDat (ngưỡng đạt của lớp)', () => thu(() => {
    const r = one(`SELECT a.student_id, a.cycle_id FROM assessment_attempts a JOIN learning_cycles c ON c.id = a.cycle_id WHERE c.route IS NULL AND c.status = 'active' AND a.status != 'cancelled' LIMIT 1`);
    assert(r, 'demo phải có em lớp thường có lượt');
    const a = profile.studentProfile(P.admin, r.student_id, r.cycle_id).attempts.find((x: any) => x.mode === 'ratio');
    assert(a && typeof a.nguongDat === 'number' && a.nguongDat > 0 && a.nguongDat <= 1, `nguongDat = ${a?.nguongDat}`);
  }));

  check('cycle.thiThat: đã thi, chưa có điểm → ngày, điểm null (chờ kết quả)', () => thu(() => {
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = '2026-10-17', thi_that_l = NULL, thi_that_r = NULL, thi_that_w = NULL, thi_that_s = NULL, thi_that_khong_thi = 0,
      outcome = NULL, outcome_score = NULL WHERE id = ?`).run(dong.cycle_id);
    const tt = profile.studentProfile(P.admin, dong.student_id, dong.cycle_id).cycle.thiThat;
    assert(tt?.ngay === '2026-10-17' && tt.ovr === null && tt.l === null, `thiThat = ${JSON.stringify(tt)}`);
  }));
}
