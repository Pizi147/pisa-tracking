/**
 * PHÉP KIỂM LUOT-TEN-GV — trang lượt Test hiện tên người được phân công từng môn ("Còn lại", cột Trạng thái):
 *   (1) `GET /attempts/:id` (FT) trả `nguoiLam` theo ô nhập (W1 / W2 riêng, như phân công FT): GV môn đang hiệu lực của lớp lúc Test, Speaking Mock = "GV chấm chéo", chưa phân công = null;
 *   (2) `GET /regular/attempts/:id` trả `nguoiLam` cho từng môn của chương trình, cùng luật `phanCongDangHieuLuc`.
 * Cùng hàm với `pendingOwners` của danh sách lượt — không luật thứ hai.
 */
export async function runPrLuotTenGvTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const { phanCongDangHieuLuc } = await import('../worklist/scoreDebt.ts');
  const { CHAM_CHEO } = await import('../../../shared/domain/index.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLUOT-TEN-GV · trang lượt Test: người được phân công từng môn');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const LOP_FT = classId('MB FT 101');
  const LOP = classId('MB FOU 12');

  check('LTGV-1 · FT: nguoiLam theo ô (L, R, W1, W2 = GV đang hiệu lực, có tên thật), Speaking Mock = "GV chấm chéo"; gỡ phân công → null', () => thu(() => {
    const l = get(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY id LIMIT 1`, LOP_FT);
    assert(l, 'demo phải có lượt Mock ở MB FT 101');
    const pc = phanCongDangHieuLuc([LOP_FT], demoToday());
    const d = attempts.attemptDetail(P.mbManager, l.id);
    assert(d.nguoiLam && Object.keys(d.nguoiLam).sort().join() === 'listening,reading,speaking,writing1,writing2', `khoá: ${JSON.stringify(d.nguoiLam)}`);
    assert(d.nguoiLam.speaking === CHAM_CHEO, `S Mock: ${d.nguoiLam.speaking}`);
    for (const k of ['listening', 'reading', 'writing1', 'writing2']) {
      /* Demo MB FT 101 phân công đủ bốn ô — tên phải có thật (không null = null cho qua). */
      assert(d.nguoiLam[k] && d.nguoiLam[k] === pc.get(`${LOP_FT}|${k}`)?.ten, `${k}: ${d.nguoiLam[k]} ≠ phân công ${pc.get(`${LOP_FT}|${k}`)?.ten}`);
    }
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND skill = 'writing2'`).run(LOP_FT);
    xoaNho();
    const sau = attempts.attemptDetail(P.mbManager, l.id).nguoiLam;
    assert(sau.writing2 === null && sau.writing1 === d.nguoiLam.writing1, `gỡ phân công W2 → null, W1 giữ: ${JSON.stringify(sau)}`);
  }));

  check('LTGV-2 · lớp thường: nguoiLam có đủ môn của chương trình, mỗi môn = GV đang hiệu lực của lớp lúc Test (cùng phanCongDangHieuLuc)', () => thu(() => {
    const l = get(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'progress' ORDER BY id LIMIT 1`, LOP);
    assert(l, 'demo phải có Progress Test ở MB FOU 12');
    const pc = phanCongDangHieuLuc([LOP], demoToday());
    for (const p of [P.mbManager, P.normalSubjectTeacher]) {
      const d = regular.regularAttemptDetail(p, l.id);
      assert(Object.keys(d.nguoiLam).join() === d.programme.skills.join(), `khoá ${Object.keys(d.nguoiLam)} ≠ môn ${d.programme.skills}`);
      /* Demo MB FOU 12 phân công đủ bốn môn — tên phải có thật. */
      for (const k of d.programme.skills) assert(d.nguoiLam[k] && d.nguoiLam[k] === pc.get(`${LOP}|${k}`)?.ten, `${k}: ${d.nguoiLam[k]}`);
    }
  }));
}
