/** PHÉP KIỂM PR-S4F — sửa sau rà cuối đợt 4 (mỗi mục một phép kiểm tái hiện đúng tình huống rà; quyền: gọi API bằng vai sai → 403). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrS4fTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const { createApp } = await import('../app.ts');
  console.log('\nPR-S4F · Sửa sau rà cuối đợt 4');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];

  /** Máy chủ thật + phiên demo theo người dùng — phép kiểm quyền đi qua đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
        });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, {
        ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) },
      });
    };
    try { await fn(goi); } finally { may.close(); }
  }

  // ------------------------------------------------------------------ 1 · issue-board/o (và hai route anh em) phải là ATTEMPT_VIEW
  await checkAsync('S4F (1) · GV không dạy MB FOU 12 gọi issue-board/o · issue-board · needs-evaluation → 403; GV lớp → 200', async () => {
    const fou = classId('MB FOU 12');
    const gv = 10;
    assert(!get(`SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = 'active'`, gv, fou), 'dữ liệu demo: GV 10 không dạy MB FOU 12');
    await voiMayChu(async (goi) => {
      for (const url of [
        `/classes/${fou}/issue-board/o?category=reading&cot=hv`,
        `/classes/${fou}/issue-board/o?category=reading&cot=pa-dang&kind=tutor`,
        `/classes/${fou}/issue-board?category=reading`,
        `/classes/${fou}/issue-board/needs-evaluation?category=reading`,
      ]) {
        const r = await goi(gv, url);
        assert(r.status === 403, `${url}: ${r.status}`);
      }
      const ok = await goi(P.normalCoreTeacher.userId, `/classes/${fou}/issue-board/o?category=reading&cot=hv`);
      assert(ok.status === 200, `GVCN lớp: ${ok.status}`);
    });
  });

  // ------------------------------------------------------------------ 2 · GV Speaking chấm chéo: chỉ mở hai đường chấm
  await checkAsync('S4F (2) · GV Speaking chấm chéo MB FT 102: Case · tín hiệu · roster · phân tích lớp · cần hỗ trợ · tệp Case → 403; lượt MT + bảng chấm → 200', async () => {
    const ft102 = classId('MB FT 102');
    const trang = P.sTeacher.userId;
    const pc = get(`SELECT id FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND skill = 'speaking' AND status = 'active'`, trang, ft102);
    assert(pc, 'dữ liệu demo: Trang dạy S ở MB FT 102');
    const caseId = get(`SELECT sc.id FROM sos_cases sc JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' WHERE e.class_id = ? LIMIT 1`, ft102)?.id;
    const tinHieu = get(`SELECT id FROM case_signals WHERE class_id = ? ORDER BY id LIMIT 1`, ft102)?.id;
    const luot = get(`SELECT id FROM assessment_attempts WHERE class_id = ? AND status != 'cancelled' LIMIT 1`, ft102)?.id;
    assert(caseId && tinHieu && luot, `dữ liệu demo lớp 102: case ${caseId} · tín hiệu ${tinHieu} · lượt ${luot}`);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id = ?`).run(pc.id);
    try {
      await voiMayChu(async (goi) => {
        for (const url of [
          `/cases/${caseId}`, `/signals/pending/${tinHieu}`, `/classes/${ft102}/roster`, `/classes/${ft102}/phan-tich-lop`,
          `/classes/${ft102}/can-ho-tro`, `/attachments?ownerType=sos_case&ownerId=${caseId}`,
        ]) {
          const r = await goi(trang, url);
          assert(r.status === 403, `${url}: ${r.status}`);
        }
        for (const url of [`/attempts/${luot}`, `/classes/${ft102}/cham`]) {
          const r = await goi(trang, url);
          assert(r.status === 200, `${url}: ${r.status} ${await r.text()}`);
        }
      });
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id = ?`).run(pc.id);
    }
  });

  // ------------------------------------------------------------------ 3 · Lớp thường xoá điểm môn trượt
  await checkAsync('S4F (3) · Lớp thường: xoá điểm R trượt (API) → Case chỉ dựng trên điểm đó đóng, không mốc "đã đạt"; sửa lên đạt cũng không mốc; lượt sau đạt → có mốc', async () => {
    const fou = classId('MB FOU 12');
    const taoEm = (ten: string) => {
      intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, email: 'hv@demo.test' }], idempotencyKey: `s4f-${ten}` });
      regular.planRegularTests(P.admin, fou);
      const st = get('SELECT id FROM students WHERE full_name = ?', ten);
      const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, st.id);
      const luot = (kind: string) => get('SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = ?', st.id, kind)?.id;
      return { id: st.id as number, cycleId: cy?.id ?? null, pt: luot('progress') as number, ft: luot('final') as number };
    };
    const skills = regular.programmeOfClass(fou).skills as string[];
    const nhap = (aid: number, rTruot: boolean) => skills.forEach((k) =>
      regular.saveRegularScore(P.admin, aid, k, { score: k === 'reading' && rTruot ? 10 : 36, total: 40, lyDo: 'Phép kiểm S4F' }));
    const moCaseR = (em: { id: number; cycleId: number | null }, aid: number) => {
      const c = cases.reportIssue(P.admin, {
        studentId: em.id, cycleId: em.cycleId, title: 'Reading: đọc sót ý chính', topic: 'reading', primaryCode: 'student.reading.logic', urgency: 'attention',
        summary: 'Em đọc sót ý chính ở bài Reading giữa khoá.',
        fromSignalId: get(`SELECT id FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`, aid).id,
      });
      return (c.id ?? c.case?.id) as number;
    };
    const mocDat = (caseId: number) => all(`SELECT dedup_key FROM case_milestones WHERE case_id = ? AND kind = 'passed'`, caseId);

    /* Tình huống rà: xoá ô R trượt qua đúng route PUT → Case (chỉ căn cứ điểm đó) đóng, tín hiệu rút, KHÔNG mốc passed. */
    const a = taoEm('S4F Xoá R');
    nhap(a.pt, true);
    const caseA = moCaseR(a, a.pt);
    await voiMayChu(async (goi) => {
      const r = await goi(P.admin.userId, `/regular/attempts/${a.pt}/scores/reading`, {
        method: 'PUT', body: JSON.stringify({ score: null, total: null, lyDo: 'Nhập nhầm bài của em khác' }),
      });
      assert(r.status === 200, `PUT xoá điểm: ${r.status} ${await r.text()}`);
    });
    const sauA = get('SELECT status, sos_level FROM sos_cases WHERE id = ?', caseA);
    assert(sauA.status === 'done', `Case phải đóng khi điểm nguồn bị xoá: ${JSON.stringify(sauA)}`);
    assert(!mocDat(caseA).length, `không được ghi mốc "đã đạt": ${JSON.stringify(mocDat(caseA))}`);
    assert(get(`SELECT status FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`, a.pt).status === 'withdrawn', 'tín hiệu R chưa rút');

    /* Đối chứng mục 9.4: sửa R lên đạt trên CHÍNH lượt đó = sửa điểm, không phải tiến bộ → không mốc passed. */
    const b = taoEm('S4F Sửa R');
    nhap(b.pt, true);
    const caseB = moCaseR(b, b.pt);
    regular.saveRegularScore(P.admin, b.pt, 'reading', { score: 36, total: 40, lyDo: 'Cộng sót điểm' });
    assert(!mocDat(caseB).length, `sửa điểm không phải tiến bộ: ${JSON.stringify(mocDat(caseB))}`);

    /* Lượt SAU (Cuối khoá) đạt R → tiến bộ thật → có mốc passed, hạ mức. */
    const c = taoEm('S4F Tiến bộ R');
    nhap(c.pt, true);
    const caseC = moCaseR(c, c.pt);
    /* Case còn PA/căn cứ khác không quan trọng ở đây — lượt Cuối khoá khác lượt nguồn. */
    if (c.ft) {
      nhap(c.ft, false);
      assert(mocDat(caseC).some((m: any) => m.dedup_key === `mt:${c.ft}:${caseC}:passed`), `lượt sau đạt phải có mốc: ${JSON.stringify(mocDat(caseC))}`);
      assert(get('SELECT sos_level FROM sos_cases WHERE id = ?', caseC).sos_level === 0, 'lượt sau đạt phải hạ mức');
    } else {
      assert(false, 'dữ liệu: em mới không có bài Cuối khoá');
    }
  });
  void check;
}
