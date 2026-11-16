/**
 * PHÉP KIỂM TD-HVL-2 (TOC-DO-1711): `standingFor` đọc lượt từ nguồn chung `attemptsNewestFirst` (nhớ theo em) thay câu riêng theo lộ trình.
 * So HAI ĐƯỜNG (câu cũ `standingDuongCuKhiKiem` ↔ nguồn chung) nguyên chuỗi JSON: mọi em, cả loạt và từng em, trong / ngoài bộ nhớ request,
 * lớp đã kết thúc (`lopKetThuc`), và các tình huống dễ lệch: MT0, lượt huỷ hết phần thi (mốc kế tiếp), lượt có dòng điểm mà không band / điểm thô.
 */
export async function runPrTdHvl2Tests(t: any) {
  const { check, assert, conn } = t;
  const st: any = await import('../students/standing.ts');
  const { trongBoNho }: any = await import('../platform/nguCanhRequest.ts');
  console.log('\nTD-HVL-2 · standingFor đọc lượt từ nguồn chung = câu riêng cũ');

  const json = (ids: number[], lop?: number) => JSON.stringify([...st.standingFor(ids, lop)]);
  const hai = (ids: number[], lop?: number) => {
    st.standingDuongCuKhiKiem.bat = true;
    try { const cu = json(ids, lop); st.standingDuongCuKhiKiem.bat = false; return [cu, json(ids, lop)]; } finally { st.standingDuongCuKhiKiem.bat = false; }
  };
  const moiEm = () => (conn.prepare(`SELECT id FROM students ORDER BY id`).all() as any[]).map((r) => r.id as number);
  const soSanh = (nhan: string) => {
    const sids = moiEm();
    const [cu, moi] = hai(sids);
    assert(cu === moi, `${nhan}: cả loạt lệch`);
    const sai = sids.filter((id) => { const [a, b] = hai([id]); return a !== b; });
    assert(!sai.length, `${nhan}: từng em lệch ${sai.slice(0, 5)}`);
    /* Trong bộ nhớ request (đường GET): lượt nhớ theo em dùng chung với `latestAttempts`. */
    const [cuNho, moiNho] = [trongBoNho(() => { st.standingDuongCuKhiKiem.bat = true; try { return json([...sids].reverse()); } finally { st.standingDuongCuKhiKiem.bat = false; } }),
      trongBoNho(() => json([...sids].reverse()))];
    assert(cuNho === moiNho, `${nhan}: trong bộ nhớ request lệch`);
    return [...st.standingFor(sids).values()];
  };

  check('TD-HVL-2-a · mọi em (cả loạt, từng em, trong bộ nhớ request): nguồn chung = câu riêng cũ; có em có kết quả + mốc kế tiếp', () => {
    const ds = soSanh('dữ liệu kiểm');
    assert(ds.filter((s: any) => s.attemptId).length > 20 && ds.some((s: any) => s.nextAttemptNo), 'dữ liệu kiểm thiếu em có kết quả / mốc kế tiếp');
  });

  check('TD-HVL-2-b · lớp đã kết thúc (`lopKetThuc`): mọi lớp, nguồn chung = câu riêng cũ', () => {
    const lops = (conn.prepare(`SELECT DISTINCT a.class_id AS id FROM assessment_attempts a WHERE a.class_id IS NOT NULL ORDER BY 1`).all() as any[]).map((r) => r.id as number);
    const sai: number[] = [];
    for (const lop of lops) {
      const sids = (conn.prepare(`SELECT DISTINCT student_id AS id FROM assessment_attempts WHERE class_id = ? ORDER BY 1`).all(lop) as any[]).map((r) => r.id as number);
      const [cu, moi] = hai(sids, lop);
      if (cu !== moi) sai.push(lop);
    }
    assert(lops.length > 3 && !sai.length, `lớp lệch: ${sai.slice(0, 5)}`);
  });

  check('TD-HVL-2-c · MT0, lượt huỷ hết phần thi ở mốc kế tiếp, lượt có dòng điểm mà trống band / điểm thô → hai đường vẫn trùng', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      /* Lượt mốc kế tiếp của vài em: huỷ mọi phần thi bắt buộc (huyHet = 1 → mốc nhảy sang lượt sau). */
      const moc = soSanh('trước khi đổi').filter((s: any) => s.nextAttemptNo).slice(0, 6);
      for (const s of moc) {
        conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = (SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?)`).run(s.cycleId, s.nextAttemptNo);
      }
      /* Vài lượt Mock có điểm → MT0 (bỏ khỏi kết quả gần nhất); vài lượt mới nhất có điểm → xoá band / điểm thô (giữ dòng). */
      conn.prepare(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id IN (SELECT a.id FROM assessment_attempts a WHERE a.kind = 'mock'
                     AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id) ORDER BY a.id LIMIT 4)`).run();
      const coKq = soSanh('sau MT0 + huỷ hết').filter((s: any) => s.attemptId).slice(0, 5);
      for (const s of coKq) conn.prepare(`UPDATE assessment_scores SET band = NULL, raw_score = NULL WHERE attempt_id = ?`).run(s.attemptId);
      soSanh('sau khi xoá band / điểm thô');
      assert(moc.length >= 2 && coKq.length >= 3, `tình huống thiếu: mốc ${moc.length} · có kết quả ${coKq.length}`);
    } finally { conn.exec('ROLLBACK'); }
  });
}
