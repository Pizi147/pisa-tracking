/**
 * PHÉP KIỂM S2 (giảm dòng đọc Turso): (a) lịch kỹ năng gắn `mon_luot` theo lô / câu con một lượt = câu con theo từng dòng cũ, với MỌI lượt;
 * (b) `standingFor` nạp bundle theo vòng = nạp đủ một lần (đường cũ), cho mọi em + tình huống lượt mới nhất có điểm nhưng chưa kỹ năng nào đủ.
 */
export async function runPrS2LichKyNangTests(t: any) {
  const { check, assert, conn } = t;
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const st: any = await import('../students/standing.ts');
  console.log('\nS2 · lịch kỹ năng đọc môn đăng ký một lần mỗi lượt + standingFor chỉ nạp lượt cần');

  /* Biểu thức cũ (câu con tương quan theo từng dòng) — giữ ở đây để so. */
  const MON_CU = `(SELECT cy.mon_dang_ky FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id WHERE a.id = ask.attempt_id AND a.kind != 'mt0')`;
  const soSanh = () => {
    const ids = (conn.prepare(`SELECT DISTINCT attempt_id FROM attempt_skills ORDER BY attempt_id`).all() as any[]).map((r) => r.attempt_id as number);
    const cu = new Map((conn.prepare(`SELECT ask.id, ${MON_CU} AS m FROM attempt_skills ask`).all() as any[]).map((r) => [r.id, r.m ?? null]));
    const sai: string[] = [];
    let n = 0, coMon = 0;
    for (const [id, rows] of ss.loadSkillRows(ids) as Map<number, any[]>) {
      for (const r of rows) {
        n++;
        if (r.mon_luot) coMon++;
        if (!cu.has(r.id) || cu.get(r.id) !== r.mon_luot) sai.push(`lô: lượt ${id} dòng ${r.id} ${cu.get(r.id)} ≠ ${r.mon_luot}`);
      }
    }
    /* Đường một lượt (`ensureSkillRows`, `skipsOf`): câu con không tương quan. */
    const mot = conn.prepare(`SELECT ask.id, ${ss.MON_MOT_LUOT_SQL} AS m FROM attempt_skills ask WHERE ask.attempt_id = ?`);
    for (const id of ids) for (const r of mot.all(id, id) as any[]) if (cu.get(r.id) !== (r.m ?? null)) sai.push(`một lượt: ${id} dòng ${r.id}`);
    return { n, coMon, tong: cu.size, sai };
  };

  check('S2-a · mọi lượt: `mon_luot` của `loadSkillRows` (theo lô) và câu một lượt = câu con theo từng dòng cũ; cả khi mọi lộ trình có môn (MT0 → null)', () => {
    const r1 = soSanh();
    assert(!r1.sai.length && r1.n === r1.tong && r1.n > 100, `DB kiểm: ${r1.n}/${r1.tong} dòng · ${r1.sai.slice(0, 3).join(' | ')}`);
    conn.exec('BEGIN IMMEDIATE');
    try {
      /* Mọi lộ trình chưa có môn → có môn, và 5 lượt Mock có lịch → MT0 (demo không có MT0): nhánh môn thật và nhánh MT0 = null đều được so. */
      conn.prepare(`UPDATE learning_cycles SET mon_dang_ky = '["listening","reading","writing1","speaking"]' WHERE mon_dang_ky IS NULL`).run();
      conn.prepare(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id IN (SELECT a.id FROM assessment_attempts a WHERE a.kind = 'mock' AND a.cycle_id IS NOT NULL
                     AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id) ORDER BY a.id LIMIT 5)`).run();
      const mt0 = (conn.prepare(`SELECT COUNT(*) AS n FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id WHERE a.kind = 'mt0' AND a.cycle_id IS NOT NULL`).get() as any).n;
      const r2 = soSanh();
      assert(!r2.sai.length && r2.coMon > 100 && mt0 > 0 && r2.coMon <= r2.n - mt0, `có môn: ${r2.coMon}/${r2.n} dòng (MT0 ${mt0}) · ${r2.sai.slice(0, 3).join(' | ')}`);
    } finally { conn.exec('ROLLBACK'); }
  });

  const json = (ids: number[]) => JSON.stringify([...st.standingFor(ids)]);
  const hai = (ids: number[]) => { st.standingNapDuKhiKiem.bat = true; try { const du = json(ids); st.standingNapDuKhiKiem.bat = false; return [du, json(ids)]; } finally { st.standingNapDuKhiKiem.bat = false; } };

  check('S2-b · `standingFor` mọi em (cả loạt và từng em): nạp theo vòng = nạp đủ mọi lượt có điểm', () => {
    const sids = (conn.prepare(`SELECT id FROM students ORDER BY id`).all() as any[]).map((r) => r.id as number);
    const [du, vong] = hai(sids);
    assert(du === vong, 'cả loạt: nạp theo vòng ≠ nạp đủ');
    const coKq = [...st.standingFor(sids).values()].filter((s: any) => s.attemptId).length;
    const sai = sids.filter((id) => { const [a, b] = hai([id]); return a !== b; });
    assert(!sai.length && coKq > 20, `từng em lệch: ${sai.slice(0, 5)} · em có kết quả ${coKq}`);
  });

  /* Đối chiếu độc lập với vòng xét: lượt "có dòng điểm mà trống" phải cho CÙNG kết quả như khi lượt đó không có dòng điểm nào (vòng 1 bỏ qua thẳng). */
  check('S2-c · lượt mới nhất có dòng điểm nhưng chưa kỹ năng nào đủ (band / điểm trống) → rơi xuống lượt cũ hơn = như lượt đó chưa có điểm; = đường nạp đủ', () => {
    const sids = (conn.prepare(`SELECT id FROM students ORDER BY id`).all() as any[]).map((r) => r.id as number);
    const truoc = st.standingFor(sids) as Map<number, any>;
    const chon = [...truoc.values()].filter((s) => s.attemptId);
    conn.exec('BEGIN IMMEDIATE');
    try {
      for (const s of chon) conn.prepare(`UPDATE assessment_scores SET band = NULL, raw_score = NULL WHERE attempt_id = ?`).run(s.attemptId);
      const [du, vong] = hai(sids);
      assert(du === vong, 'sau khi xoá điểm lượt mới nhất: nạp theo vòng ≠ nạp đủ');
      const sau = st.standingFor(sids) as Map<number, any>;
      const roi = chon.filter((s) => sau.get(s.studentId).attemptId && sau.get(s.studentId).attemptId !== s.attemptId).length;
      assert(chon.every((s) => sau.get(s.studentId).attemptId !== s.attemptId) && roi >= 3, `em rơi xuống lượt cũ hơn: ${roi}/${chon.length}`);
      for (const s of chon) conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ?`).run(s.attemptId);
      assert(json(sids) === vong, 'lượt có dòng điểm trống ≠ lượt không có dòng điểm');
    } finally { conn.exec('ROLLBACK'); }
  });
}
