/**
 * PHÉP KIỂM TK-DU-KY-NANG (chủ SP 12/11, đề bài `2026-11-12-tinh-hinh-hoc-tap/de-bai.md` mục 2): Tổng kết lộ trình cũ có đầu vào đủ L · R · W · S,
 * bảng MT tách W1 · W2 (lượt cũ chỉ W gộp → W ở cả hai ô, `diemW12`); Tổng kết lớp cùng tách W1 · W2.
 */
export async function runPrTkDuKyNangTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const tongKet: any = await import('../loTrinh/tongKet.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nTK-DU-KY-NANG — Tổng kết lộ trình: đầu vào đủ kỹ năng, MT tách W1 · W2');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('TKK-1 · diemW12: có W1 / W2 thì giữ; lượt cũ chỉ W gộp → W ở cả hai ô; không gì → null', () => {
    const m = (o: Record<string, number | null>) => (k: string) => o[k] ?? null;
    const a = d.diemW12(m({ writing1: 6, writing2: 6.5, writing: 6.5 }));
    assert(a.w1 === 6 && a.w2 === 6.5, JSON.stringify(a));
    const b = d.diemW12(m({ writing: 5.5 }));
    assert(b.w1 === 5.5 && b.w2 === 5.5, JSON.stringify(b));
    const c = d.diemW12(m({ writing1: 6 }));
    assert(c.w1 === 6 && c.w2 === null, `chỉ W1 → không lấy W gộp cho W2: ${JSON.stringify(c)}`);
    const e = d.diemW12(m({}));
    assert(e.w1 === null && e.w2 === null, JSON.stringify(e));
  });

  check('TKK-2 · tongKetLoTrinh FT đã đóng: dauVaoKn từ bản chụp; mỗi MT có dòng W1 · W2; Tổng kết lớp luotCuoi có w1 · w2', () => thu(() => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy, e.class_id FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
          AND cy.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = s.id)
       WHERE s.status = 'active' AND s.archived_at IS NULL
         AND EXISTS (SELECT 1 FROM assessment_attempts a JOIN assessment_scores sc ON sc.attempt_id = a.id WHERE a.cycle_id = cy.id AND sc.skill = 'writing1' AND sc.band IS NOT NULL)
       ORDER BY s.id LIMIT 1`);
    assert(r, 'seed cần em FT MB đang học có điểm W1');
    conn.prepare('UPDATE learning_cycles SET target_score = 7, khong_cam_ket = 0 WHERE id = ?').run(r.cy);
    thiThat.datKetQuaThiThat(P.mbManager, r.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    buocTiep.chonBuocTiep(P.mbManager, r.cy, { chon: 'ket_thuc' });
    xoaNho();
    const bc = get('SELECT id FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1', r.cy);
    assert(bc, 'tiền đề: có bản chụp');
    conn.prepare('UPDATE ban_chup_lo_trinh SET dau_vao = 5.5, dau_vao_l = 6, dau_vao_r = 5.5, dau_vao_w = 5, dau_vao_s = 5.5 WHERE id = ?').run(bc.id);
    const tk = tongKet.tongKetLoTrinh(P.admin, r.cy);
    assert(tk.dauVao === 5.5 && tk.dauVaoKn.l === 6 && tk.dauVaoKn.r === 5.5 && tk.dauVaoKn.w === 5 && tk.dauVaoKn.s === 5.5, JSON.stringify(tk.dauVaoKn));
    const coW1 = tk.luot.find((l: any) => l.kyNang.some((k: any) => k.k === 'writing1' && k.diem !== null));
    assert(coW1, `phải có lượt mang dòng W1 có điểm: ${JSON.stringify(tk.luot.map((l: any) => l.kyNang.map((k: any) => k.k)))}`);
    assert(coW1.kyNang.some((k: any) => k.k === 'writing2' && k.nhan === 'W2') && coW1.kyNang.some((k: any) => k.k === 'writing' && k.nhan === 'W'), 'nhãn W1 / W2 / W');
    /* Tổng kết lớp: luotCuoi có w1 / w2 (cùng `diemW12`). */
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, r.class_id);
    xoaNho();
    const lop = tongKet.tongKetLop(P.admin, r.class_id);
    const em = lop.dong.find((x: any) => x.studentId === r.sid);
    assert(em?.luotCuoi && 'w1' in em.luotCuoi && 'w2' in em.luotCuoi, `Tổng kết lớp thiếu w1 / w2: ${JSON.stringify(em?.luotCuoi)}`);
  }));
}
