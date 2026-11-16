/**
 * AU-VIEC-2 (N50 câu 12, audit B3-15): em thi thật ĐẠT Target, chọn Lộ trình mới → Target gợi ý = Target cũ + 1.0 band (trần 9.0), ô mở sẵn;
 * chưa đạt / Không thi → giữ (null).
 */
export async function runPrAuViecTargetTests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nAU-VIEC-2 · Target gợi ý +1.0 sau khi đạt Target');
  const bt = await import('../loTrinh/buocTiep.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');

  check('N50-12 · targetGoiYSauDat: đạt → +1.0 (trần 9.0) · chưa đạt / Không thi / không Target → null', () => {
    const f = bt.targetGoiYSauDat;
    assert(f({ target_score: 6.5, outcome_score: 6.5 }, null) === '7.5', 'OVR = Target → 7.5');
    assert(f({ target_score: 6.5, outcome_score: 7.5 }, null) === '7.5', 'OVR > Target → Target + 1.0 (không theo OVR)');
    assert(f({ target_score: 8.5, outcome_score: 8.5 }, null) === '9.0', 'trần 9.0');
    assert(f({ target_score: 6.5, outcome_score: null }, 'reached') === '7.5', 'kết luận chọn tay "Đạt"');
    assert(f({ target_score: 6.5, outcome_score: 6.0 }, 'not_reached') === null, 'chưa đạt → giữ');
    assert(f({ target_score: 6.5, outcome_score: 7.0, thi_that_khong_thi: 1 }, null) === null, 'Không thi → giữ');
    assert(f({ target_score: null, outcome_score: 7.0 }, null) === null, 'không Target số → giữ');
  });

  check('N50-12 · panel Bước tiếp (trangThaiBuocTiep) trả targetGoiY của lộ trình có KQ thi thật', () => {
    const c = conn.prepare(`SELECT cy.id, cy.target_score, cy.thi_that_khong_thi, cy.thi_that_l, cy.thi_that_r, cy.thi_that_w, cy.thi_that_s, cy.outcome_score, cy.outcome
      FROM learning_cycles cy JOIN students s ON s.id = cy.student_id AND s.status = 'active'
      WHERE cy.route IS NOT NULL AND cy.status = 'active' AND cy.target_score IS NOT NULL AND cy.target_score <= 8 AND cy.buoc_tiep IS NULL
        AND NOT EXISTS (SELECT 1 FROM learning_cycles n WHERE n.student_id = cy.student_id AND n.seq > cy.seq) ORDER BY cy.id LIMIT 1`).get() as any;
    assert(c, 'seed: cần một lộ trình FT có Target');
    const dat = (diem: number) => conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 0, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, outcome_score = ?, outcome = 'unknown' WHERE id = ?`)
      .run(diem, diem, diem, diem, diem, c.id);
    try {
      dat(c.target_score);
      xoaNho();
      const a = bt.trangThaiBuocTiep(P.mbManager, c.id);
      assert(a?.targetGoiY === Math.min(9, c.target_score + 1).toFixed(1), `đạt: ${a?.targetGoiY} (Target ${c.target_score})`);
      dat(c.target_score - 0.5);
      xoaNho();
      assert(bt.trangThaiBuocTiep(P.mbManager, c.id)?.targetGoiY === null, 'chưa đạt → null (giữ Target)');
    } finally {
      conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = ?, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, outcome_score = ?, outcome = ? WHERE id = ?`)
        .run(c.thi_that_khong_thi, c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s, c.outcome_score, c.outcome, c.id);
      xoaNho();
    }
  });
}
