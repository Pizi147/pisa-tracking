/**
 * NHAP-KQ-PA (chủ SP 13/11): GV lưu nháp kết quả PA trên máy chủ — nháp không phải kết quả: việc vẫn chờ, hạn không đổi; chốt "Lưu" thì xoá nháp.
 * Tự tạo học viên + Case + PA (không đụng học viên demo).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrNhapKqTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const migrateMod: any = await import('../migrate/prNhapKq.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const NOW = new Date().toISOString();
  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;

  const sid = Number(conn.prepare(
    `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-NHAPKQ', 'Học viên Nháp KQ', 'hoc vien nhap kq', ?, 'active', ?)`,
  ).run(mb, NOW).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, classId('MB FT 101'), NOW);
  conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, NOW);
  const c = cases.reportIssue(P.lrTeacher, {
    studentId: sid, topic: 'listening', title: 'Nghe chi tiết còn yếu (nháp KQ)', summary: 'Em bỏ sót số và tên riêng ở Section 2.',
    primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: 'nhap-kq-pa',
  }) as any;
  const d = cases.recordIntervention(P.lrTeacher, c.id, {
    kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY,
  }) as any;
  const ivId = d.interventions.find((i: any) => i.kind === 'self_study').id as number;
  conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(TODAY, ivId);   // tới hạn → có dòng "Ghi kết quả PA"
  const han = (conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any).action_due;
  const soKq = () => (conn.prepare('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?').get(ivId) as any).n as number;
  const dong = () => (mywork.myWork(P.lrTeacher, {}).items ?? []).find((i: any) => i.key === `action:${ivId}`);

  check('NHAP-KQ-PA · migrate thêm cột, chạy lại không làm gì', () => {
    const ap: string[] = [];
    migrateMod.migratePrNhapKq(conn, ap);
    assert(ap.length === 0, 'cột đã có (schema.sql) — chạy lại phải im');
  });

  check('NHAP-KQ-PA · lưu nháp (không đủ ô) → mở lại Case điền được, có người + lúc lưu, có nhật ký', () => {
    const r = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'Buổi 1' });
    assert(r.nhap?.note === 'Buổi 1' && r.nhap.boi === P.lrTeacher.fullName, 'trả bản nháp');
    cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'Buổi 1 · buổi 2 nghe số khá hơn' });   // ghi đè
    const iv = cases.caseDetail(P.lrTeacher, c.id).interventions.find((i: any) => i.id === ivId);
    assert(iv.nhapKetQua?.note === 'Buổi 1 · buổi 2 nghe số khá hơn' && iv.nhapKetQua.outcome === 'partial', 'caseDetail điền sẵn bản mới nhất');
    const nk = (conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_type = 'case_intervention' AND entity_id = ? AND action = 'case.result.draft'`).get(ivId) as any).n;
    assert(nk === 2, `mỗi lần lưu một dòng nhật ký (có ${nk})`);
  });

  check(`NHAP-KQ-PA · trần câu: lưu nháp ≤ ${TRAN_GHI_LO.luuNhapKetQua}; mở Công việc có nháp không thêm câu`, () => {
    cases.luuNhapKetQua(P.lrTeacher, ivId, { note: '' , outcome: '' });
    xoaNho(); let s0 = soCauSql(); mywork.myWork(P.lrTeacher, {}); const moTruoc = soCauSql() - s0;
    xoaNho(); s0 = soCauSql(); cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'Buổi 1 · buổi 2 nghe số khá hơn' }); const n = soCauSql() - s0;
    assert(n <= TRAN_GHI_LO.luuNhapKetQua, `${n} > ${TRAN_GHI_LO.luuNhapKetQua}`);
    xoaNho(); s0 = soCauSql(); mywork.myWork(P.lrTeacher, {}); const moSau = soCauSql() - s0;
    assert(moSau <= moTruoc, `mở Công việc thêm câu: ${moTruoc} → ${moSau}`);
    console.log(`    lưu nháp ${n} câu · Công việc ${moTruoc} → ${moSau} câu`);
  });

  check('NHAP-KQ-PA · nháp không làm việc thành xong: không có kết quả, hạn giữ, dòng Công việc còn + chip', () => {
    assert(soKq() === 0, 'không sinh lần ghi kết quả');
    assert((conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any).action_due === han, 'hạn không đổi');
    const x = dong();
    assert(x && x.coNhap === true, 'dòng "Ghi kết quả PA" còn, có cờ Có nháp');
  });

  check('NHAP-KQ-PA · người không có quyền ghi kết quả PA không lưu nháp được', () => {
    assertThrows(() => cases.luuNhapKetQua(P.cpManager, ivId, { note: 'chen' }), /quyền/i, 'chi nhánh khác bị chặn');
    assertThrows(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'xyz' }), /không hợp lệ/i, 'mức lạ bị chặn');
  });

  check('NHAP-KQ-PA · chốt "Lưu" → xoá nháp, dòng việc hết chip', () => {
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn nhiều' });
    assert(soKq() === 1, 'đã có kết quả');
    assert((conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(ivId) as any).nhap_ket_qua == null, 'nháp đã xoá');
    assert(!dong()?.coNhap, 'không còn chip Có nháp');
  });

  check('NHAP-KQ-PA · cả hai ô trống = bỏ nháp', () => {
    cases.luuNhapKetQua(P.lrTeacher, ivId, { note: 'tạm' });
    const r = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: '', note: '  ' });
    assert(r.nhap === null && (conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(ivId) as any).nhap_ket_qua == null, 'xoá');
  });
}
