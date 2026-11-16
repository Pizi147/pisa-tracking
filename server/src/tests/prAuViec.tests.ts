/**
 * AU-VIEC (audit 16/11, chủ SP trả lời câu 1 + 4): N46 em có KQ thi thật → việc Case / PA / Phối hợp SOS của lộ trình đó ẩn khỏi Công việc mọi vai
 * (như Tạm dừng, không xoá) — cùng ở hồ sơ HV · P1-04 thanh "Việc cần làm" hồ sơ HV có Phối hợp SOS, Báo PH vi phạm, Bổ sung hồ sơ (cùng khoá Công việc)
 * · N49 Báo cáo PH quá hạn > 7 ngày còn thiếu em → một việc mỗi lớp × đợt cho QL.
 */
export async function runPrAuViecTests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nAU-VIEC · việc sau thi thật · thanh việc hồ sơ HV · Báo cáo PH quá hạn cho QL');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { metricSet } = await import('../worklist/metrics.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const NHOM_CASE = new Set(['cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'xem_nx_s', 'no_plan', 'ghi_ket_qua_pa', 'no_owner', 'phoi_hop_sos']);
  /* Việc gắn em (dòng gộp lớp: `emIds`). */
  const cuaEm = (w: any, sid: number) => (w.items as any[]).filter((i) => i.studentId === sid || (i.studentId === null && (i.emIds ?? []).includes(sid)));
  const hoSo = (p: any, sid: number) => { xoaNho(); const v = (studentProfile(p, sid) as any).dauHoSo.viec; return [...v.cuaBan, ...v.nguoiKhac] as any[]; };

  check('N46 · em có KQ thi thật: việc Case / PA / Phối hợp SOS rời Công việc (GV, QL Tất cả), hồ sơ HV, Tổng quan — hoàn KQ thì về lại', () => {
    /* Em FT chưa có KQ, lộ trình FT mới nhất có Case mở sinh việc cho GV. */
    const em = all(`SELECT cy.id AS cy, cy.student_id AS sid FROM learning_cycles cy JOIN students s ON s.id = cy.student_id AND s.status = 'active' AND s.archived_at IS NULL
       WHERE cy.route IS NOT NULL AND cy.status = 'active' AND cy.thi_that_khong_thi = 0 AND cy.thi_that_l IS NULL AND cy.outcome_score IS NULL AND COALESCE(cy.outcome, 'unknown') = 'unknown'
         AND NOT EXISTS (SELECT 1 FROM learning_cycles n WHERE n.student_id = cy.student_id AND n.seq > cy.seq)
         AND EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.cycle_id = cy.id AND sc.status != 'done') ORDER BY cy.id`);
    const nguoiXem = [P.mbManager, P.coreTeacher, P.w1Teacher, P.w2Teacher, P.sTeacher, P.lrTeacher];
    let thu = 0;
    for (const { cy, sid } of em) {
      xoaNho();
      const truoc = nguoiXem.map((p) => cuaEm(myWork(p, { nguoi: 'tat-ca' }), sid).filter((i) => NHOM_CASE.has(i.group)));
      if (!truoc.some((x) => x.length)) continue;
      thu++;
      const giu = one('SELECT thi_that_khong_thi FROM learning_cycles WHERE id = ?', cy).thi_that_khong_thi;
      try {
        conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE id = ?').run(cy);   // "Không thi" = có KQ (CO_KET_QUA_THI_SQL)
        nguoiXem.forEach((p, i) => {
          xoaNho();
          const con = cuaEm(myWork(p, { nguoi: 'tat-ca' }), sid).filter((x) => NHOM_CASE.has(x.group));
          assert(!con.length, `${p.fullName} · em ${sid}: còn ${con.map((x) => x.key).join(', ')} (trước ${truoc[i].length})`);
          xoaNho();
          const conToi = cuaEm(myWork(p, {}), sid).filter((x) => NHOM_CASE.has(x.group));
          assert(!conToi.length, `${p.fullName} "Của tôi" · em ${sid}: còn ${conToi.map((x) => x.key).join(', ')}`);
        });
        /* Hồ sơ HV: không còn việc Case / PA (cùng luật). */
        const hs = hoSo(P.mbManager, sid).filter((v) => ['nguyen-nhan', 'de-ra-pa', 'xac-nhan-pa', 'ghi-ket-qua', 'phoi-hop-sos'].includes(v.loai));
        assert(!hs.length, `hồ sơ em ${sid}: còn ${hs.map((v) => v.key).join(', ')}`);
        /* Tổng quan: chỉ số dùng chung câu (Case chưa có người · PA cần cập nhật) không còn Case / PA của em. */
        xoaNho();
        const caseEm = new Set(all(`SELECT id FROM sos_cases WHERE cycle_id = ?`, cy).map((r) => r.id));
        const paEm = new Set(all(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.cycle_id = ?`, cy).map((r) => r.id));
        assert(!metricSet(P.mbManager, 'case-chua-co-nguoi-phu-trach', {}).ids.some((id: number) => caseEm.has(id)), 'Tổng quan Case chưa có người còn Case của em');
        assert(!metricSet(P.mbManager, 'pa-can-cap-nhat', {}).ids.some((id: number) => paEm.has(id)), 'Tổng quan PA cần cập nhật còn PA của em');
        /* Lộ trình mới (đã chọn): lộ trình cũ vẫn "đã thi thật" → việc cũ không hiện lại. */
        conn.prepare("UPDATE learning_cycles SET buoc_tiep = 'lo_trinh_moi' WHERE id = ?").run(cy);
        xoaNho();
        assert(!cuaEm(myWork(P.mbManager, { nguoi: 'tat-ca' }), sid).some((x) => NHOM_CASE.has(x.group)), `Lộ trình mới: việc cũ của em ${sid} hiện lại`);
      } finally {
        conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = ?, buoc_tiep = NULL WHERE id = ?').run(giu, cy);
      }
      /* Chưa có KQ (vd dời lịch thi) → việc giữ nguyên. */
      nguoiXem.forEach((p, i) => {
        xoaNho();
        const lai = cuaEm(myWork(p, { nguoi: 'tat-ca' }), sid).filter((x) => NHOM_CASE.has(x.group)).map((x) => x.key).sort();
        assert(JSON.stringify(lai) === JSON.stringify(truoc[i].map((x) => x.key).sort()), `${p.fullName} · em ${sid}: hoàn KQ không về lại đủ việc`);
      });
      if (thu >= 3) break;
    }
    assert(thu > 0, 'seed: không có em FT chưa thi nào có việc Case');
  });

  check('P1-04 · hồ sơ HV ↔ Công việc: Phối hợp SOS · Báo PH (vi phạm / Meeting CX) · Bổ sung hồ sơ — cùng khoá, hai chiều', () => {
    const tvv = all(`SELECT DISTINCT s.consultant_user_id AS id FROM viec_bao_ph v JOIN students s ON s.id = v.student_id WHERE v.trang_thai = 'mo' AND s.consultant_user_id IS NOT NULL
       UNION SELECT DISTINCT consultant_user_id FROM students WHERE consultant_user_id IS NOT NULL ORDER BY 1 LIMIT 4`).map((r) => loadPrincipal(r.id));
    const NHOM = new Set(['phoi_hop_sos', 'phoi_hop_tvv', 'bao_ph_yt', 'bo_sung_ho_so']);
    const LOAI = new Set(['phoi-hop-sos', 'phoi-hop-tvv', 'bao-ph-yt', 'bo-sung']);
    let so = 0;
    for (const p of [P.coreTeacher, P.mbManager, ...tvv]) {
      xoaNho();
      const cv = (myWork(p, {}) as any).items.filter((i: any) => i.mine && NHOM.has(i.group));
      const khoa = new Set(cv.map((i: any) => i.key));
      const emCo = new Map<number, Set<string>>();
      for (const i of cv) for (const sid of i.studentId ? [i.studentId] : i.emIds ?? []) emCo.set(sid, (emCo.get(sid) ?? new Set()).add(i.key));
      for (const [sid, keys] of [...emCo].slice(0, 12)) {
        let viec: any[];
        try { xoaNho(); viec = (studentProfile(p, sid) as any).dauHoSo.viec.cuaBan; } catch (e: any) { if (e?.status === 403) continue; throw e; }
        const hs = new Set(viec.filter((v) => LOAI.has(v.loai)).map((v) => v.key));
        for (const k of keys) { so++; assert(hs.has(k), `${p.fullName} · em ${sid}: Công việc có ${k}, hồ sơ không`); }
        for (const k of hs) assert(khoa.has(k), `${p.fullName} · em ${sid}: hồ sơ có ${k}, Công việc không`);
      }
    }
    assert(so > 3, `phép so quá ít (${so})`);
  });

  check('N49 · Báo cáo PH quá hạn > 7 ngày còn thiếu em → một việc mỗi lớp × đợt cho QL chi nhánh (không cho GV); ngày bật chặn đợt cũ', () => {
    const mg = 'bc_ph_viec_gv_tu';
    const goc = getConfig(mg);
    try {
      setConfig(mg, '2026-01-01');
      xoaNho();
      const w: any = myWork(P.mbManager, {});
      const ql = w.items.filter((i: any) => i.group === 'bc_ph_qua_han');
      assert(ql.length > 0, 'seed 14/09: lớp MB có đợt tháng 8 quá hạn 15 ngày còn thiếu em → QL có việc');
      assert(new Set(ql.map((i: any) => i.key)).size === ql.length, 'mỗi lớp × đợt một dòng');
      assert(ql.every((i: any) => i.mine && i.urgency === 'overdue' && /^bc-ph-qh:\d+:/.test(i.key)), 'việc của QL, quá hạn');
      assert(w.summary.viec >= ql.length, 'vào số việc');
      /* Rà #1788: không trần 30 ngày — đợt quá hạn lâu vẫn là việc tới khi lớp đủ / bỏ đợt / lớp kết thúc. */
      const lau = all(`SELECT c.id FROM classes c WHERE c.status = 'active' AND c.is_fast_track = 1 AND c.branch_id = (SELECT branch_id FROM classes WHERE code = 'MB FT 101')`)
        .map((r) => r.id).filter((id: number) => ql.some((i: any) => i.classId === id && i.due < '2026-08-01'));
      const dotLau = ql.filter((i: any) => i.due && i.due < '2026-08-15');
      assert(!lau.length || dotLau.length > 0, 'đợt quá hạn > 30 ngày phải còn');
      xoaNho();
      assert(!(myWork(P.coreTeacher, {}) as any).items.some((i: any) => i.group === 'bc_ph_qua_han'), 'GV không có việc QL');
      xoaNho();
      assert(!(myWork(P.cpManager, {}) as any).items.some((i: any) => ql.some((q: any) => q.key === i.key)), 'QL chi nhánh khác không có lớp MB');
      /* Mốc bật sau hạn đợt → không sinh (như việc GV). */
      setConfig(mg, t.TODAY);
      xoaNho();
      assert(!(myWork(P.mbManager, {}) as any).items.some((i: any) => i.group === 'bc_ph_qua_han'), 'đợt trước ngày bật vẫn sinh việc');
    } finally {
      setConfig(mg, goc);
      xoaNho();
    }
  });

  check('N46 (rà #1788) · Case không gắn lộ trình: theo lượt, rồi lộ trình đang chạy lúc tạo Case — thi thật → Lộ trình mới → việc cũ vẫn ẩn', () => {
    xoaNho();
    const coViec = (myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items.filter((i: any) => NHOM_CASE.has(i.group) && i.caseId).map((i: any) => i.caseId as number);
    const ca = coViec.map((id: number) => one(`SELECT sc.id, sc.cycle_id, sc.attempt_id, sc.created_at, sc.student_id AS sid FROM sos_cases sc
       JOIN learning_cycles cy ON cy.id = sc.cycle_id AND cy.route IS NOT NULL AND cy.thi_that_khong_thi = 0 AND cy.outcome_score IS NULL AND cy.buoc_tiep IS NULL
       WHERE sc.id = ? AND sc.student_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM learning_cycles n WHERE n.student_id = cy.student_id AND n.seq > cy.seq)`, id)).find(Boolean);
    assert(ca, 'seed: cần Case mở có PA của lộ trình FT chưa thi');
    const cy = one('SELECT * FROM learning_cycles WHERE id = ?', ca.cycle_id);
    const cua = () => { xoaNho(); return cuaEm(myWork(P.mbManager, { nguoi: 'tat-ca' }), ca.sid).filter((x) => NHOM_CASE.has(x.group) && (x.caseId === ca.id || x.key.endsWith(`:${ca.id}`))); };
    assert(cua().length > 0, `Case ${ca.id} phải có việc trước khi thi`);
    let moi: number | null = null;
    try {
      /* Lộ trình mới bắt đầu SAU ngày tạo Case (seed ghi `created_at` theo đồng hồ thật, muộn hơn ngày demo). */
      const sau = new Date(Date.parse(String(ca.created_at).slice(0, 10)) + 86_400_000).toISOString().slice(0, 10);
      conn.prepare('UPDATE sos_cases SET cycle_id = NULL, attempt_id = NULL WHERE id = ?').run(ca.id);
      conn.prepare("UPDATE learning_cycles SET thi_that_khong_thi = 1, buoc_tiep = 'lo_trinh_moi' WHERE id = ?").run(cy.id);
      moi = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
        VALUES (?, ?, 'LT2', ?, ?, ?, 'active', ?)`).run(ca.sid, cy.seq + 1, cy.programme_code, cy.target_score, sau, sau).lastInsertRowid);
      const con = cua();
      assert(!con.length, `Lộ trình mới: Case ${ca.id} (không cycle_id, không lượt) hiện lại: ${con.map((x) => x.key).join(', ')}`);
    } finally {
      if (moi) conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(moi);
      conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = ?, buoc_tiep = ? WHERE id = ?').run(cy.thi_that_khong_thi, cy.buoc_tiep, cy.id);
      conn.prepare('UPDATE sos_cases SET cycle_id = ?, attempt_id = ? WHERE id = ?').run(ca.cycle_id, ca.attempt_id, ca.id);
      xoaNho();
    }
  });

  check('N46 (rà #1788) · Ghi Mini Test: Case của nhóm bổ trợ thuộc lộ trình đã thi thật → không việc (Công việc, hồ sơ HV)', () => {
    const m = one(`SELECT m.id, m.student_id AS sid, sc.cycle_id FROM mini_test m JOIN case_interventions iv ON iv.nhom_bo_tro = m.nhom_bo_tro JOIN sos_cases sc ON sc.id = iv.case_id
       JOIN students s ON s.id = m.student_id AND s.status = 'active' WHERE m.ty_le IS NULL AND sc.cycle_id IS NOT NULL ORDER BY m.id`);
    if (!m) return;   // seed không có Mini Test chờ → không có gì để ẩn
    const cy = one('SELECT id, route, thi_that_khong_thi FROM learning_cycles WHERE id = ?', m.cycle_id);
    const coViec = () => { xoaNho(); return (myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items.some((i: any) => i.key === `minitest:${m.id}`); };
    const coHs = () => hoSo(P.mbManager, m.sid).some((v) => v.key === `minitest:${m.id}`);
    const truoc = [coViec(), coHs()];
    try {
      conn.prepare("UPDATE learning_cycles SET route = COALESCE(route, 'LT1'), thi_that_khong_thi = 1 WHERE id = ?").run(cy.id);
      assert(!coViec(), 'Công việc còn Ghi Mini Test');
      assert(!coHs(), 'hồ sơ HV còn Ghi Mini Test');
    } finally {
      conn.prepare('UPDATE learning_cycles SET route = ?, thi_that_khong_thi = ? WHERE id = ?').run(cy.route, cy.thi_that_khong_thi, cy.id);
      xoaNho();
    }
    assert(JSON.stringify([coViec(), coHs()]) === JSON.stringify(truoc), 'hoàn lại không về đúng');
  });

  check('P1-04 (rà #1788) · Phối hợp SOS ở hồ sơ: người giữ như Công việc (GVCN hiệu lực); GV bộ môn / TVV không đọc (0 việc)', () => {
    const em = all(`SELECT DISTINCT x.student_id AS sid, e.class_id FROM sos_coordination_actions x JOIN enrollments e ON e.student_id = x.student_id AND e.status = 'active'
       JOIN classes c ON c.id = e.class_id AND c.code = 'MB FT 101' WHERE x.status = 'pending' LIMIT 3`);
    assert(em.length, 'seed: MB FT 101 có Phối hợp SOS chờ');
    for (const { sid } of em) {
      const ql = hoSo(P.mbManager, sid).filter((v) => v.loai === 'phoi-hop-sos');
      assert(ql.length && ql.every((v) => v.nguoi.id === P.coreTeacher.userId && !v.cuaBan), `QL xem em ${sid}: việc của GVCN ${P.coreTeacher.userId}, không "của bạn"`);
      assert(hoSo(P.coreTeacher, sid).filter((v) => v.loai === 'phoi-hop-sos').every((v) => v.cuaBan), `GVCN xem em ${sid}: "của bạn"`);
      let gvbm: any[] = [];
      try { gvbm = hoSo(P.subjectTeacher, sid); } catch (e: any) { if (e?.status !== 403) throw e; }
      assert(!gvbm.some((v) => v.loai === 'phoi-hop-sos'), `GV bộ môn xem em ${sid}: không có Phối hợp SOS`);
    }
  });
}
