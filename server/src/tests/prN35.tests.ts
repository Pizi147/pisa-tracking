/**
 * N35 (chủ SP 03/11) — TRẦN CHỮ GV NHẬP, máy chủ chặn ở mọi đường ghi: Mô tả Case ≤ 300 · Nội dung PA ≤ 200 · Nhận xét kết quả PA ≤ 200 ·
 * Nhận xét MT từng kỹ năng ≤ 300. Đúng trần lưu được, +1 → 400; chữ cũ đã dài GỬI LẠI NGUYÊN VĂN (sửa ô khác) vẫn lưu, đổi mà vẫn dài → 400;
 * dán Excel (lô) báo lỗi ĐÚNG dòng, dòng khác vẫn lưu. Mọi ca chạy trong giao dịch rồi cuộn lại.
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrN35Tests(t: any) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { luuDiemLo }: any = await import('../cham/luuLo.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nN35 · trần chữ GV nhập (mô tả Case 300 · PA 200 · kết quả PA 200 · nhận xét MT 300)');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): { status: number | null; msg: string } => {
    try { fn(); return { status: null, msg: 'không ném' }; } catch (e: any) { return { status: e?.status ?? null, msg: String(e?.message ?? e) }; }
  };
  const chu = (n: number) => 'Em sai phần ' + 'x'.repeat(n - 12);   // đúng n ký tự, đủ dài cho trần tối thiểu
  const LOP = classId('MB FT 101');
  let so = 0;
  const caseThu = (summary = 'Case dựng cho phép kiểm N35 — nghe chép.') => {
    const ten = `N35 ${++so}`;
    intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `n35-${so}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id;
    return cases.reportIssue(P.lrTeacher, { title: `N35 thử ${so}`, primaryCode: 'student.listening.technique', studentId: sid, topic: 'listening',
      summary, idempotencyKey: `n35-case-${so}`, parallel: true }).id as number;
  };
  const paThu = (c: number, description = 'Đổi cách chữa bài nghe phần 3') => {
    const dto = cases.recordIntervention(P.lrTeacher, c, { kind: 'teaching_adjust', description, performerSelf: true, status: 'started', startedDate: TODAY });
    return Math.max(...dto.interventions.map((x: any) => x.id)) as number;
  };
  const tran = (r: { status: number | null; msg: string }) => r.status === 400 && /tối đa (200|300) ký tự/i.test(r.msg);

  check('N35-0 · hằng một chỗ (shared/domain): 300 · 200 · 200 · 300; vuotTran giữ chữ cũ nguyên văn', () => {
    assert(JSON.stringify(d.TRAN_CHU) === JSON.stringify({ moTaCase: 300, noiDungPa: 200, ketQuaPa: 200, nhanXetMt: 300 }), JSON.stringify(d.TRAN_CHU));
    assert(!d.vuotTran(chu(200), 200) && d.vuotTran(chu(201), 200), 'biên 200 / 201');
    const cu = chu(250);
    assert(!d.vuotTran(` ${cu} `, 200, cu) && d.vuotTran(cu + 'y', 200, cu), 'chữ cũ dài nguyên văn → giữ; đổi mà vẫn dài → chặn');
    /* Web dùng cùng luật: ô báo lỗi tại chỗ (kiemTruong.toiDa); form PA chỉ kiểm khi nội dung ĐÃ ĐỔI (Sửa PA cũ dài vẫn sửa ô khác). */
    assert(d.kiemTruong({ khoa: 'x', nhan: 'x', toiDa: 200 }, chu(200)) === null && /200/.test(d.kiemTruong({ khoa: 'x', nhan: 'x', toiDa: 200 }, chu(201)) ?? ''), 'kiemTruong toiDa');
    const pa = { ...d.paMoi('teaching_adjust'), description: cu };
    assert(!d.loiFormPa(pa, { goc: pa }).some((l: any) => l.khoa === 'noi-dung'), 'Sửa PA giữ nội dung cũ 250 → không lỗi');
    assert(d.loiFormPa({ ...pa, description: cu + 'y' }, { goc: pa }).some((l: any) => l.khoa === 'noi-dung'), 'đổi nội dung mà vẫn dài → lỗi tại ô');
  });

  check('N35-1 · Mô tả Case: tạo 300 lưu / 301 → 400; Sửa Case chỉ đổi tên giữ mô tả cũ 400 ký tự; đổi mô tả mà vẫn dài → 400', () => thu(() => {
    caseThu(chu(300));
    assert(tran(maLoi(() => caseThu(chu(301)))), 'tạo Case 301 ký tự phải 400');
    const c = caseThu();
    conn.prepare('UPDATE sos_cases SET summary = ? WHERE id = ?').run(chu(400), c);
    const doiTen = maLoi(() => cases.suaCase(P.lrTeacher, c, { title: 'N35 đổi tên' }));
    assert(!tran(doiTen), `chỉ đổi tên mà bị chặn vì mô tả cũ: ${doiTen.msg}`);
    assert(get('SELECT summary FROM sos_cases WHERE id = ?', c).summary.length === 400, 'chữ cũ dài phải giữ nguyên, không cắt');
    assert(tran(maLoi(() => cases.suaCase(P.lrTeacher, c, { summary: chu(400) + 'y' }))), 'đổi mô tả mà vẫn dài phải 400');
    cases.suaCase(P.lrTeacher, c, { summary: chu(300) });
    assert(get('SELECT summary FROM sos_cases WHERE id = ?', c).summary.length === 300, 'rút về 300 thì lưu');
  }));

  check('N35-2 · Nội dung PA: thêm 200 lưu / 201 → 400; Sửa PA gửi lại nguyên văn PA cũ 250 ký tự không bị chặn; đổi mà vẫn dài → 400', () => thu(() => {
    const c = caseThu();
    paThu(c, chu(200));
    assert(tran(maLoi(() => paThu(c, chu(201)))), 'thêm PA 201 ký tự phải 400');
    const iv = paThu(c);
    conn.prepare('UPDATE case_interventions SET description = ? WHERE id = ?').run(chu(250), iv);
    const giu = maLoi(() => cases.suaPa(P.lrTeacher, iv, { description: chu(250) }));
    assert(!tran(giu), `gửi lại nguyên văn bị chặn: ${giu.msg}`);
    assert(tran(maLoi(() => cases.suaPa(P.lrTeacher, iv, { description: chu(250) + 'y' }))), 'sửa PA vẫn dài phải 400');
  }));

  check('N35-3 · Nhận xét kết quả PA: 200 lưu / 201 → 400, không ghi dòng kết quả', () => thu(() => {
    const iv = paThu(caseThu());
    const KQ = { decision: 'keep', outcome: 'partial' };
    assert(tran(maLoi(() => cases.updateResult(P.lrTeacher, iv, { ...KQ, note: chu(201) }))), 'kết quả 201 ký tự phải 400');
    assert(get('SELECT COUNT(*) AS n FROM case_followups WHERE intervention_id = ?', iv).n === 0, 'lỗi mà vẫn ghi kết quả');
    cases.updateResult(P.lrTeacher, iv, { ...KQ, note: chu(200) });
    assert(get('SELECT note FROM case_followups WHERE intervention_id = ?', iv).note.length === 200, 'kết quả 200 ký tự phải lưu');
  }));

  /* Lượt MT của MB FT 101 đã tới tuần thi L (cùng cách chọn của prOv15b). */
  const luotMt = () => (conn.prepare(`SELECT a.id FROM assessment_attempts a
      JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status NOT IN ('cancelled','absent')
      JOIN report_periods pr ON pr.id = k.planned_period_id AND pr.week_start <= ?
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status <> 'cancelled' AND COALESCE(a.lich_su, 0) = 0 ORDER BY a.id LIMIT 2`).all(TODAY, LOP) as any[]).map((r) => r.id as number);

  check('N35-4 · Nhận xét MT: 300 lưu / 301 → 400; nhận xét cũ 400 ký tự gửi lại nguyên văn vẫn lưu (vd sửa điểm)', () => thu(() => {
    const [a] = luotMt();
    assert(a, 'cần một lượt MT ở MB FT 101');
    attempts.saveScore(P.lrTeacher, a, 'listening', { rawScore: 30, nhanXet: chu(300) }, TODAY);
    assert(tran(maLoi(() => attempts.saveScore(P.lrTeacher, a, 'listening', { nhanXet: chu(301) }, TODAY))), 'nhận xét 301 phải 400');
    conn.prepare(`UPDATE assessment_scores SET comment = ? WHERE attempt_id = ? AND skill = 'listening'`).run(chu(400), a);
    const giu = maLoi(() => attempts.saveScore(P.lrTeacher, a, 'listening', { rawScore: 31, nhanXet: chu(400) }, TODAY));
    assert(!tran(giu), `nhận xét cũ gửi lại bị chặn: ${giu.msg}`);
    assert(get(`SELECT comment FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a).comment.length === 400, 'chữ cũ giữ nguyên');
  }));

  check('N35-5 · dán Excel (lô): dòng có nhận xét 301 báo lỗi ĐÚNG dòng đó, dòng khác vẫn lưu', () => thu(() => {
    const [a1, a2] = luotMt();
    assert(a1 && a2, 'cần hai lượt MT ở MB FT 101');
    for (const a of [a1, a2]) conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(a);
    const kq: any = luuDiemLo(P.lrTeacher, { classId: LOP, dong: [
      { attemptId: a1, o: [{ skill: 'listening', rawScore: 30, nhanXet: chu(301) }] },
      { attemptId: a2, o: [{ skill: 'listening', rawScore: 31, nhanXet: chu(300) }] },
    ] });
    assert(!kq.dong[0].ok && kq.dong[0].status === 400 && /tối đa 300 ký tự/i.test(kq.dong[0].loi), `dòng 1: ${JSON.stringify(kq.dong[0])}`);
    assert(kq.dong[1].ok, `dòng 2 phải lưu: ${JSON.stringify(kq.dong[1])}`);
    assert(!get(`SELECT 1 AS x FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a1), 'dòng lỗi không được ghi nửa chừng');
  }));
}
