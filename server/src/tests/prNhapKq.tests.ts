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

  /* ---- AUDIT-1454 (đề bài 11/11 mục 5): N01 hai phiên · N03 nháp / chốt chồng nhau. Phiên = bản gốc (`coSo` = `luc` nháp đã đọc) + kỳ (`ky`). ---- */
  const cot = () => cases.docNhapKetQua((conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(ivId) as any).nhap_ket_qua);
  const ky = () => (conn.prepare('SELECT cycle_no FROM case_interventions WHERE id = ?').get(ivId) as any).cycle_no as number;
  const soNk = () => (conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE entity_type = 'case_intervention' AND entity_id = ? AND action LIKE 'case.result.draft%'`).get(ivId) as any).n as number;
  /** Bắt lỗi để đọc `status` + `details` (assertThrows chỉ so câu). */
  const loiCua = (f: () => unknown): any => { try { f(); } catch (e) { return e; } return null; };

  check('AUDIT-1454 N01 · hai phiên cùng người: B lưu từ bản cũ → 409 kèm bản mới, bản của A còn nguyên, không thêm nhật ký', () => {
    const v1 = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'v1 buổi 1', ky: ky(), coSo: null }).nhap;
    const v2 = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'v2 của A', ky: ky(), coSo: v1.luc }).nhap;   // A
    const nk = soNk();
    const e = loiCua(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'improved', note: 'v3 của B', ky: ky(), coSo: v1.luc }));   // B vẫn từ v1
    assert(e?.status === 409, `B phải bị báo xung đột (có ${e?.status ?? 'không lỗi'})`);
    assert(e.details?.nhapMoi?.note === 'v2 của A' && e.details.nhapMoi.luc === v2.luc, 'trả bản mới để B xem');
    assert(cot()?.note === 'v2 của A', `bản của A bị đè: ${cot()?.note}`);
    assert(soNk() === nk, 'lần bị từ chối không ghi nhật ký');
    /* B xem xong vẫn muốn bản của mình → gửi lại với bản gốc = bản mới: lưu bình thường. */
    const v3 = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'improved', note: 'v3 của B', ky: ky(), coSo: v2.luc }).nhap;
    assert(cot()?.note === 'v3 của B' && v3.luc !== v2.luc && soNk() === nk + 1, 'lưu đè có chủ ý + một dòng nhật ký');
  });

  check('AUDIT-1454 N01 · khác người (GV + Quản lý cùng chi nhánh) → cũng 409, không phải lỗi quyền', () => {
    const goc = cot();
    cases.luuNhapKetQua(P.mbManager, ivId, { outcome: 'partial', note: 'QL ghi thêm', ky: ky(), coSo: goc.luc });
    const e = loiCua(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'GV từ bản cũ', ky: ky(), coSo: goc.luc }));
    assert(e?.status === 409 && e.details?.nhapMoi?.boi === P.mbManager.fullName, `xung đột nêu người lưu (có ${e?.status})`);
    assert(cot()?.note === 'QL ghi thêm', 'bản QL còn');
  });

  check('AUDIT-1454 N01 · gửi lại sau mất phản hồi (cùng nội dung, cùng bản gốc) → coi là đã lưu, không nhật ký đôi', () => {
    const goc = cot();
    const r1 = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'gửi một lần', ky: ky(), coSo: goc.luc });
    const nk = soNk();
    const r2 = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'gửi một lần', ky: ky(), coSo: goc.luc });   // trình duyệt gửi lại
    assert(r2.nhap?.luc === r1.nhap.luc && soNk() === nk, 'trả đúng bản đã lưu, không ghi thêm');
  });

  check('AUDIT-1454 N01 · nháp bị xoá ở phiên khác → phiên cũ lưu bị báo (nhapMoi = null), không tự dựng lại', () => {
    const goc = cot();
    cases.luuNhapKetQua(P.mbManager, ivId, { outcome: '', note: '', ky: ky(), coSo: goc.luc });
    const e = loiCua(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'từ bản đã xoá', ky: ky(), coSo: goc.luc }));
    assert(e?.status === 409 && e.details?.nhapMoi === null, `phải báo nháp đã bị xoá (có ${e?.status})`);
    assert(cot() === null, 'cột vẫn trống');
  });

  check('AUDIT-1454 N03 · nháp gửi chậm tới SAU khi chốt Giữ nguyên → bị từ chối, nháp không sống lại sang kỳ sau', () => {
    const kyCu = ky();
    const v = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'trước khi chốt', ky: kyCu, coSo: null }).nhap;
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Chốt kỳ này, nghe số khá hơn', ky: kyCu, nhapCoSo: v.luc });
    assert(ky() === kyCu + 1 && cot() === null, 'chốt sang kỳ mới + xoá nháp');
    const e = loiCua(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'partial', note: 'PUT chậm của kỳ cũ', ky: kyCu, coSo: v.luc }));
    assert(e?.status === 409 && e.details?.daChot === true, `nháp kỳ đã chốt phải bị chặn (có ${e?.status ?? 'không lỗi'})`);
    assert(cot() === null && !dong()?.coNhap, 'không có nháp / chip ở kỳ mới');
  });

  check('AUDIT-1454 N03 · chốt gửi lại (retry) sau khi đã chốt → không ghi kết quả lần hai, hạn không nhảy thêm', () => {
    const kyCu = ky();
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Chốt một lần thôi nhé', ky: kyCu, nhapCoSo: null });
    const n = soKq();
    const hanSau = (conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any).action_due;
    const e = loiCua(() => cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Chốt một lần thôi nhé', ky: kyCu, nhapCoSo: null }));
    assert(e?.status === 409 && e.details?.daChot === true, `retry chốt phải bị chặn (có ${e?.status ?? 'không lỗi'})`);
    assert(soKq() === n && ky() === kyCu + 1, 'một lần ghi chính thức');
    assert((conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(ivId) as any).action_due === hanSau, 'hạn giữ');
  });

  check('AUDIT-1454 N03 · chốt từ tab cũ khi phiên khác vừa lưu nháp mới → 409 kèm bản mới; không ghi kết quả, nháp còn', () => {
    const n = soKq();
    const v = cases.luuNhapKetQua(P.mbManager, ivId, { outcome: 'improved', note: 'QL vừa ghi nháp', ky: ky(), coSo: null }).nhap;
    const e = loiCua(() => cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'GV chốt từ form mở trước', ky: ky(), nhapCoSo: null }));
    assert(e?.status === 409 && e.details?.nhapMoi?.luc === v.luc, `chốt phải báo có nháp mới hơn (có ${e?.status ?? 'không lỗi'})`);
    assert(soKq() === n && cot()?.note === 'QL vừa ghi nháp', 'không ghi kết quả, nháp của QL còn');
    /* GV xem rồi vẫn chốt bản mình (bản gốc = nháp mới) → được; nháp xoá cùng giao dịch. */
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'GV chốt từ form mở trước', ky: ky(), nhapCoSo: v.luc });
    assert(soKq() === n + 1 && cot() === null, 'chốt + xoá nháp');
  });

  check('AUDIT-1454 N03 · Kết thúc PA rồi nháp từ tab cũ → bị chặn (PA khép)', () => {
    const v = cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'improved', note: 'sắp kết thúc', ky: ky(), coSo: null }).nhap;
    const kyCu = ky();
    cases.updateResult(P.lrTeacher, ivId, { decision: 'end', outcome: 'improved', note: 'Em đã nghe số ổn định', ky: kyCu, nhapCoSo: v.luc });
    const e = loiCua(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { outcome: 'improved', note: 'PUT chậm', ky: kyCu, coSo: v.luc }));
    assert(e?.status === 409 && e.details?.daChot === true, `nháp sau khi khép: 409 daChot (có ${e?.status ?? 'không lỗi'})`);
    assertThrows(() => cases.luuNhapKetQua(P.lrTeacher, ivId, { note: 'web cũ không gửi kỳ' }), /khép/i, 'không kỳ: câu cũ');
    assert(cot() === null, 'không có nháp trên PA đã khép');
  });

  /* PA thứ hai cùng Case (PA đầu đã khép): Sửa lần ghi cũ + Thay PA. */
  const kind2 = (domain.interventionKindsFor().selfServe as string[]).find((k) => k !== 'self_study' && !domain.coSoBuoi(k))!;
  const d2 = cases.recordIntervention(P.lrTeacher, c.id, { kind: kind2, description: 'PA hai — nghe chép theo đoạn', performerSelf: true, status: 'started', startedDate: TODAY }) as any;
  const iv2 = d2.interventions.filter((i: any) => i.kind === kind2).pop().id as number;
  const nhap2 = () => cases.docNhapKetQua((conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(iv2) as any).nhap_ket_qua);
  const ky2 = () => (conn.prepare('SELECT cycle_no FROM case_interventions WHERE id = ?').get(iv2) as any).cycle_no as number;

  check('AUDIT-1454 U04 · Sửa lần ghi cũ (sửa chữ / đổi mức) không xoá, không đổi nháp của kỳ đang chạy; nháp vẫn lưu tiếp được', () => {
    cases.updateResult(P.lrTeacher, iv2, { decision: 'keep', outcome: 'partial', note: 'Kỳ 1 nghe số khá hơn', ky: ky2(), nhapCoSo: null });
    const fid = (conn.prepare('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1').get(iv2) as any).id;
    const v = cases.luuNhapKetQua(P.lrTeacher, iv2, { outcome: 'improved', note: 'Kỳ 2 buổi 1', ky: ky2(), coSo: null }).nhap;
    cases.suaKetQua(P.lrTeacher, fid, { decision: 'keep', outcome: 'partial', note: 'Kỳ 1 nghe số khá hơn (sửa chữ)' });
    assert(nhap2()?.luc === v.luc, 'sửa chữ: nháp còn nguyên');
    cases.suaKetQua(P.lrTeacher, fid, { decision: 'keep', outcome: 'unchanged', note: 'Kỳ 1 thật ra chưa khá hơn' });   // đổi mức: đảo + ghi lại
    assert(nhap2()?.luc === v.luc, 'đổi mức: nháp còn nguyên');
    const r = cases.luuNhapKetQua(P.lrTeacher, iv2, { outcome: 'improved', note: 'Kỳ 2 buổi 1 · buổi 2', ky: ky2(), coSo: v.luc });
    assert(r.nhap?.note === 'Kỳ 2 buổi 1 · buổi 2', 'kỳ đang chạy không đổi sau khi sửa lần ghi cũ');
  });

  check('AUDIT-1454 N03 · Thay PA: nháp tab cũ sau khi thay bị chặn; PA mới không mang nháp', () => {
    const v = nhap2();
    const kyCu = ky2();
    cases.updateResult(P.lrTeacher, iv2, {
      decision: 'replace', outcome: 'unchanged', note: 'Nghe chép theo đoạn không hiệu quả', decisionNote: 'Đổi cách', ky: kyCu, nhapCoSo: v.luc,
      newPlan: { kind: 'self_study', description: 'Tự học lại — nghe số theo chủ đề', performerSelf: true },
    });
    assert(loiCua(() => cases.luuNhapKetQua(P.lrTeacher, iv2, { outcome: 'improved', note: 'PUT chậm', ky: kyCu, coSo: v.luc }))?.details?.daChot === true, 'nháp sau khi thay');
    const moi = (conn.prepare('SELECT superseded_by FROM case_interventions WHERE id = ?').get(iv2) as any).superseded_by;
    assert(moi && (conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(moi) as any).nhap_ket_qua == null, 'PA mới không có nháp');
  });
}
