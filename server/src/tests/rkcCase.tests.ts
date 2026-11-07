/**
 * PHÉP KIỂM RKC-2a (chủ SP 07/11 "KHÔNG BAO GIỜ CHẶN CỨNG", PTA quyết Q-B1 + 5): Hoàn thành Case còn PA chưa khép → HỎI rồi kết thúc sớm các PA đó (Mở lại
 * Case trả PA + thẻ về như cũ); Case chưa có PA hoàn thành được; Case đã hoàn thành: sửa thẳng, + Thêm PA = hỏi rồi Mở lại; Case hệ thống đóng mở lại tay.
 * Bảng: docs/ra-khoa-cung/bang.md (G5, G6).
 */
export async function runRkcCaseTests(t: any) {
  const { check, assert, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const { voiXacNhan, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const LOP = classId('MB FT 101');
  const mb = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const QL = P.mbManager;
  let so = 0;
  const moiEm = (): number => {
    const tag = `RKC2-${++so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const taoCase = (sid: number) => cases.reportIssue(P.lrTeacher, {
    studentId: sid, topic: 'listening', title: `Nghe sót số liệu ${so}`, summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
    primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `rkc2-case-${so}`,
  }).id as number;
  const themPa = (caseId: number, o: Record<string, unknown> = {}) => {
    const r = cases.recordIntervention(P.lrTeacher, caseId, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY, ...o,
    });
    return Math.max(...r.interventions.map((i: any) => i.id)) as number;
  };
  const KL = { outcome: 'much_better', note: 'MT3 Listening lên 6.0, không còn sai dạng điền số' };
  const pa = (id: number) => mot('SELECT status, closed_reason, approval_state FROM case_interventions WHERE id = ?', id);
  const theCho = (ivId: number) => mot(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND doi_tuong_loai = 'intervention' AND doi_tuong_id = ?`, ivId).n as number;

  console.log('\nRKC-2a — Case: hỏi thay chặn, Mở lại trả PA');

  check('RKC2a-1 · Hoàn thành Case còn PA đang chạy + PA chờ duyệt → hỏi (chưa đóng); đồng ý → PA "Dừng — Case hoàn thành", thẻ đóng; Mở lại Case → PA + thẻ về như cũ', () => thu(() => {
    const c = taoCase(moiEm());
    const chay = themPa(c);
    const cho = themPa(c, { kind: 'extra_support', description: 'Học kèm 1-1 với Tutor 2 buổi/tuần', status: 'planned', startedDate: undefined });
    const truocCho = pa(cho), truocThe = theCho(cho);
    const e = loi(() => cases.closeCaseOutcome(QL, c, KL));
    assert(e?.status === 409 && e.details?.canXacNhan && /Còn 2 PA chưa khép/.test(e.message) && mot('SELECT status FROM sos_cases WHERE id = ?', c).status !== 'done', `phải hỏi: ${e?.status} ${e?.message}`);
    voiXacNhan(() => cases.closeCaseOutcome(QL, c, KL));
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', c).status === 'done', 'Case phải hoàn thành');
    assert(pa(chay).status === 'cancelled' && pa(chay).closed_reason === 'case_hoan_thanh' && pa(cho).status === 'cancelled', JSON.stringify([pa(chay), pa(cho)]));
    assert(theCho(cho) === 0, 'thẻ chờ duyệt PA phải tự đóng');
    assert(d.viecTiepPhuongAn({ closedReason: 'case_hoan_thanh', completedOn: TODAY }).text === 'Dừng — Case hoàn thành', 'nhãn PA');
    cases.moLaiCase(QL, c);
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', c).status !== 'done', 'Case phải mở lại');
    assert(pa(chay).status === 'started' && pa(chay).closed_reason === null, `PA chạy phải về: ${JSON.stringify(pa(chay))}`);
    assert(JSON.stringify(pa(cho)) === JSON.stringify(truocCho) && theCho(cho) === truocThe, `PA chờ duyệt + thẻ phải về: ${JSON.stringify(pa(cho))} thẻ ${theCho(cho)}/${truocThe}`);
  }));

  check('RKC2a-2 · Case chưa có PA → hoàn thành được (kết luận đủ); Case đã hoàn thành → sửa thẳng (giữ kết luận, có lịch sử)', () => thu(() => {
    const c = taoCase(moiEm());
    cases.closeCaseOutcome(QL, c, KL);
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', c).status === 'done', 'Case chưa có PA phải hoàn thành được');
    cases.suaCase(QL, c, { urgency: 'urgent' });
    const sc = mot('SELECT status, urgency, outcome FROM sos_cases WHERE id = ?', c);
    assert(sc.status === 'done' && sc.urgency === 'urgent' && sc.outcome === KL.outcome, JSON.stringify(sc));
    assert(!!mot(`SELECT 1 x FROM sos_case_history WHERE case_id = ? AND field = 'urgency'`, c), 'thiếu lịch sử sửa');
  }));

  check('RKC2a-3 · + Thêm PA vào Case đã hoàn thành → hỏi; đồng ý → Case mở lại (mốc reopened) + PA mới', () => thu(() => {
    const c = taoCase(moiEm());
    cases.closeCaseOutcome(QL, c, KL);
    const e = loi(() => themPa(c));
    assert(e?.status === 409 && e.details?.canXacNhan, `phải hỏi: ${e?.status} ${e?.message}`);
    const id = voiXacNhan(() => themPa(c));
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', c).status !== 'done' && pa(id).status === 'started', 'Case mở lại + PA chạy');
    assert(!!mot(`SELECT 1 x FROM case_milestones WHERE case_id = ? AND kind = 'reopened'`, c), 'thiếu mốc Mở lại');
  }));

  check('RKC2a-4 · Case hệ thống đóng (em kết thúc học) → Quản lý Mở lại tay được, gỡ lý do hệ thống', () => thu(() => {
    const c = taoCase(moiEm());
    conn.prepare(`UPDATE sos_cases SET status = 'done', closed_at = ?, system_close_reason = 'student_finished', dedup_key = NULL WHERE id = ?`).run(TODAY, c);
    xoaNho();
    cases.moLaiCase(QL, c);
    const sc = mot('SELECT status, system_close_reason r FROM sos_cases WHERE id = ?', c);
    assert(sc.status !== 'done' && sc.r === null, JSON.stringify(sc));
  }));
}
