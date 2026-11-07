/**
 * PHÉP KIỂM BO-QUA-XEP-MT (chủ SP 03/11): QL "Bỏ qua" việc "Xếp lịch MTn cho {em}" (`moc:` ở `mywork.ts`).
 *  · bỏ qua → việc ẩn khỏi Công việc, vào `daBoQua` (ai, lúc nào) + nhật ký; QL khác cùng phạm vi cũng không thấy.
 *  · hoàn tác / khôi phục → việc hiện lại; nhật ký khôi phục.
 *  · mốc khác (MT kế khác) → việc hiện lại.
 *  · chỉ ẩn VIỆC: không đổi PA (mốc, trạng thái).
 *  · người ngoài phạm vi (QL chi nhánh khác, GV) → 403; khoá lạ → 400.
 *  · trần câu SQL đường ghi; mở Công việc không thêm câu (cột đọc cùng câu `moc:` sẵn có).
 * Mỗi ca dựng trong một giao dịch rồi cuộn lại (`thu`).
 */
export async function runPrBoQuaMocTests(t: { check: any; assert: any; conn: any; P: any; classId: (c: string) => number }) {
  const { check, assert, conn, P, classId } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const sos: any = await import('../cases/sosAuto.ts');
  const att: any = await import('../fasttrack/attempts.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nBO-QUA-XEP-MT · Bỏ qua việc Xếp lịch MT');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number => { try { fn(); return 0; } catch (e: any) { return e?.status ?? -1; } };
  const QL = P.mbManager;
  const viec = (p = QL) => { xoaNho(); return mywork.myWork(p, { nguoi: 'tat-ca' }); };
  const coViec = (key: string, p = QL) => (viec(p).items as any[]).some((x) => x.key === key);

  /* Một PA quy chế "đến MT kế" của em lớp MB FT 101, lượt sau của lộ trình huỷ hết → chưa có lịch MT kế → việc `moc:`. */
  const dung = () => {
    const iv = one(`SELECT iv.id, sc.attempt_id, a.cycle_id, a.attempt_no FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        JOIN assessment_attempts a ON a.id = sc.attempt_id
       WHERE iv.preset = 1 AND iv.status = 'started' AND sc.status != 'done' AND a.class_id = ? ORDER BY iv.id LIMIT 1`, classId('MB FT 101'));
    assert(iv, 'bộ thử thiếu PA quy chế đang chạy ở MB FT 101');
    conn.prepare(`UPDATE case_interventions SET moc_quy_che = 'until_next_mt', followup_due = NULL WHERE id = ?`).run(iv.id);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = ? AND attempt_no > ?`).run(iv.cycle_id, iv.attempt_no);
    /* XEP-MT-NHAC (chủ SP 07/11): việc chỉ khi lộ trình THIẾU MT — lịch lớp thêm một MT so với số MT đã có (Huỷ MTn cũng là đã có). */
    const n = one(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock'`, iv.cycle_id).n as number;
    conn.prepare('UPDATE classes SET lich_mt = ? WHERE id = ?').run(JSON.stringify(Array.from({ length: n + 1 }, (_, i) => 4 * (i + 1))), classId('MB FT 101'));
    const key = `moc:${iv.id}`;
    assert(coViec(key), 'dựng xong phải có việc Xếp lịch MT');
    return { key, id: iv.id as number, mt: `mt${iv.attempt_no + 1}` };
  };

  check('BQ-1 · Bỏ qua → ẩn khỏi Công việc (cả QL khác cùng phạm vi), vào "Đã bỏ qua" có người + lúc; nhật ký; PA không đổi', () => thu(() => {
    const { key, id, mt } = dung();
    const truoc = one('SELECT status, moc_quy_che, followup_due FROM case_interventions WHERE id = ?', id);
    const dongTruoc = (viec().dong as any[]).find((x) => x.key === key || x.con?.some((c: any) => c.key === key));
    assert(dongTruoc && (dongTruoc.boQuaDuoc || dongTruoc.con?.find((c: any) => c.key === key)?.boQuaDuoc), 'dòng việc phải có cờ boQuaDuoc');
    mywork.boQuaViec(QL, key, true);
    assert(!coViec(key), 'việc còn sau khi bỏ qua');
    const v = viec();
    const bq = (v.daBoQua ?? []).find((x: any) => x.key === key);
    assert(bq && bq.boi && bq.luc && /^Xếp lịch MT\d+ cho /.test(bq.tieuDe), `daBoQua: ${JSON.stringify(v.daBoQua)}`);
    assert(one('SELECT bo_qua_moc m FROM case_interventions WHERE id = ?', id).m === mt, 'ghi đúng mốc');
    const sau = one('SELECT status, moc_quy_che, followup_due FROM case_interventions WHERE id = ?', id);
    assert(JSON.stringify(sau) === JSON.stringify(truoc), `PA đổi: ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
    const nk = one(`SELECT actor_user_id, entity_label FROM audit_logs WHERE action = 'viec.bo_qua' AND entity_type = 'case_intervention' AND entity_id = ?`, id);
    assert(nk && nk.actor_user_id === QL.userId, 'thiếu nhật ký bỏ qua');
    /* QL khác cùng phạm vi (Quản trị) cũng không thấy. */
    assert(!coViec(key, P.admin), 'Quản trị vẫn thấy việc đã bỏ qua');
    mywork.boQuaViec(QL, key, true);   // bấm lại: không ghi lần hai
    assert(all(`SELECT 1 FROM audit_logs WHERE action = 'viec.bo_qua' AND entity_id = ?`, id).length === 1, 'bấm lại ghi nhật ký lần hai');
  }));

  check('BQ-2 · Hoàn tác / khôi phục → việc hiện lại, rời "Đã bỏ qua", nhật ký khôi phục', () => thu(() => {
    const { key, id } = dung();
    mywork.boQuaViec(QL, key, true);
    mywork.boQuaViec(P.admin, key, false);   // người khác trong phạm vi khôi phục được (không khoá cứng)
    assert(coViec(key), 'việc chưa hiện lại');
    assert(!(viec().daBoQua ?? []).some((x: any) => x.key === key), 'còn trong Đã bỏ qua');
    assert(one(`SELECT 1 x FROM audit_logs WHERE action = 'viec.khoi_phuc' AND entity_id = ?`, id), 'thiếu nhật ký khôi phục');
  }));

  check('BQ-3 · Mốc khác (MT kế khác) → việc hiện lại', () => thu(() => {
    const { key, id } = dung();
    mywork.boQuaViec(QL, key, true);
    conn.prepare(`UPDATE case_interventions SET bo_qua_moc = 'mt99' WHERE id = ?`).run(id);   // đã bỏ qua mốc cũ, nay thiếu MT khác
    assert(coViec(key), 'MT kế khác mà việc vẫn ẩn');
  }));

  check('BQ-4 · Người ngoài phạm vi → 403 (QL chi nhánh khác, GVCN); khoá lạ → 400; việc không còn → 404', () => thu(() => {
    const { key } = dung();
    assert(ma(() => mywork.boQuaViec(P.cpManager, key, true)) === 403, 'QL chi nhánh khác phải 403');
    assert(ma(() => mywork.boQuaViec(P.coreTeacher, key, true)) === 403, 'GVCN phải 403');
    assert(coViec(key), 'người ngoài phạm vi đã ẩn được việc');
    assert(ma(() => mywork.boQuaViec(QL, 'owner:1', true)) === 400, 'khoá lạ phải 400');
    assert(ma(() => mywork.boQuaViec(QL, 'moc:999999999', true)) === 404, 'PA không có phải 404');
  }));

  check(`BQ-5 · trần câu SQL: bỏ qua ≤ ${TRAN_GHI_LO.boQuaViec}; mở Công việc QL không thêm câu`, () => thu(() => {
    const { key } = dung();
    xoaNho(); let s0 = soCauSql(); mywork.myWork(QL, { nguoi: 'tat-ca' }); const moTruoc = soCauSql() - s0;
    xoaNho(); s0 = soCauSql(); mywork.boQuaViec(QL, key, true); const n = soCauSql() - s0;
    assert(n <= TRAN_GHI_LO.boQuaViec, `${n} > ${TRAN_GHI_LO.boQuaViec}`);
    xoaNho(); s0 = soCauSql(); mywork.myWork(QL, { nguoi: 'tat-ca' }); const moSau = soCauSql() - s0;
    assert(moSau <= moTruoc, `mở Công việc thêm câu: ${moTruoc} → ${moSau}`);
  }));

  /* MT-HUY-XONG (chủ SP 05/11 "hủy là hủy thôi"): MT kế đã huỷ hết (vắng / ngoài phạm vi) không phải mốc, không bắt xếp lại CHÍNH nó — việc nói MT sau. */
  check('BQ-6 · MT kế huỷ hết (cũ: ngoài phạm vi không tuần · N38: huỷ vắng có tuần) → không việc "Xếp lịch MT" (không bắt QL xếp lại)', () => thu(() => {
    const { key, id, mt } = dung();
    const iv = one(`SELECT a.cycle_id, a.attempt_no FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id = ?`, id);
    const ke = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?`, iv.cycle_id, iv.attempt_no + 1);
    assert(ke, 'bộ thử thiếu lượt MT kế');
    const tuanCuoi = one(`SELECT id FROM report_periods ORDER BY week_start DESC LIMIT 1`).id;
    /* Bản 30/10: 4 kỹ năng ngoài phạm vi, lượt không tuần · luật N38: 4 kỹ năng huỷ vắng, tuần giữ trên dòng. */
    for (const [ten, tuan, sua] of [['ngoài phạm vi, không tuần', null, `required = 0, huy_vang = 1`], ['huỷ vắng, có tuần', tuanCuoi, `required = 1, sit_status = 'cancelled', huy_vang = 1`]] as const) {
      conn.prepare(`UPDATE assessment_attempts SET status = 'planned', planned_period_id = ? WHERE id = ?`).run(tuan, ke.id);
      conn.prepare(`UPDATE attempt_skills SET ${sua}, planned_period_id = ? WHERE attempt_id = ?`).run(tuan, ke.id);
      const it = (viec().items as any[]).find((x) => x.key === key);
      assert(!it, `${ten}: còn việc "${it?.tieuDe}" (${mt})`);
    }
  }));

  /* XEP-MT-NHAC (chủ SP 07/11, đảo phần nhắc của XM-MT-TUAN): MT kế ĐÃ XOÁ = đã xử lý — không nhắc; MT sau nữa có tuần thì mốc PA theo MT đó (giữ). */
  check('BQ-7 · MT kế đã xoá (Xoá MT) → KHÔNG việc "Xếp lịch MT" (xoá rồi thì thôi); MT sau nữa có tuần → mốc PA theo MT đó, không kẹt ở MT đã xoá', () => thu(() => {
    const { key, id } = dung();
    const iv = one(`SELECT a.cycle_id, a.attempt_no FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id = ?`, id);
    const ke = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?`, iv.cycle_id, iv.attempt_no + 1);
    assert(ke, 'bộ thử thiếu lượt MT kế');
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', planned_period_id = NULL WHERE id = ?`).run(ke.id);
    conn.prepare(`UPDATE attempt_skills SET required = 0, huy_vang = 0, sit_status = 'scheduled', scope_reason = 'Xoá MT' WHERE attempt_id = ?`).run(ke.id);
    assert(!coViec(key), 'MT kế đã xoá: vẫn nhắc "Xếp lịch MT"');
    /* MT sau nữa (n+2) có tuần — bộ thử không có sẵn: tạo bằng đường thật (`createAttempt`, số kế = n+2 vì MT đã xoá vẫn giữ số). */
    const sid = one('SELECT student_id FROM learning_cycles WHERE id = ?', iv.cycle_id).student_id;
    const tuan = one(`SELECT id FROM report_periods ORDER BY week_start DESC LIMIT 1`).id;
    att.createAttempt(P.admin, { studentId: sid, cycleId: iv.cycle_id, attemptNo: iv.attempt_no + 2, periodId: tuan });
    xoaNho();
    const caseId = one('SELECT case_id FROM case_interventions WHERE id = ?', id).case_id;
    assert(sos.keHoachMocQuyChe({ caseIds: [caseId] }).some((r: any) => r.id === id), 'MT sau nữa có tuần: PA vẫn không có mốc (kẹt ở MT đã xoá)');
  }));
}
