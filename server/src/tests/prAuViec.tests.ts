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

}
