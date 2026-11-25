/**
 * N35 (chủ SP 03/11) — TRẦN CHỮ GV NHẬP, máy chủ chặn ở mọi đường ghi: Mô tả Case ≤ 500 · Nội dung PA ≤ 200 · Nhận xét kết quả PA ≤ 200 ·
 * Nhận xét MT từng kỹ năng ≤ 500. Đúng trần lưu được, +1 → 400; chữ cũ đã dài GỬI LẠI NGUYÊN VĂN (sửa ô khác) vẫn lưu, đổi mà vẫn dài → 400;
 * dán Excel (lô) báo lỗi ĐÚNG dòng, dòng khác vẫn lưu. Mọi ca chạy trong giao dịch rồi cuộn lại.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrN35Tests(t: any) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nN35 · trần chữ GV nhập (mô tả Case 500 · PA 200 · kết quả PA 200 · nhận xét MT 500)');

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
  const tran = (r: { status: number | null; msg: string }) => r.status === 400 && /tối đa (200|500) ký tự/i.test(r.msg);

  check('N35-0 · hằng một chỗ (shared/domain): 500 · 200 · 200 · 500; vuotTran giữ chữ cũ nguyên văn', () => {
    assert(JSON.stringify(d.TRAN_CHU) === JSON.stringify({ moTaCase: 500, noiDungPa: 200, ketQuaPa: 200, nhanXetMt: 500 }), JSON.stringify(d.TRAN_CHU));
    assert(!d.vuotTran(chu(200), 200) && d.vuotTran(chu(201), 200), 'biên 200 / 201');
    const cu = chu(250);
    assert(!d.vuotTran(` ${cu} `, 200, cu) && d.vuotTran(cu + 'y', 200, cu), 'chữ cũ dài nguyên văn → giữ; đổi mà vẫn dài → chặn');
    /* Web dùng cùng luật: ô báo lỗi tại chỗ (kiemTruong.toiDa); form PA chỉ kiểm khi nội dung ĐÃ ĐỔI (Sửa PA cũ dài vẫn sửa ô khác). */
    assert(d.kiemTruong({ khoa: 'x', nhan: 'x', toiDa: 200 }, chu(200)) === null && /200/.test(d.kiemTruong({ khoa: 'x', nhan: 'x', toiDa: 200 }, chu(201)) ?? ''), 'kiemTruong toiDa');
    const pa = { ...d.paMoi('teaching_adjust'), description: cu };
    assert(!d.loiFormPa(pa, { goc: pa }).some((l: any) => l.khoa === 'noi-dung'), 'Sửa PA giữ nội dung cũ 250 → không lỗi');
    assert(d.loiFormPa({ ...pa, description: cu + 'y' }, { goc: pa }).some((l: any) => l.khoa === 'noi-dung'), 'đổi nội dung mà vẫn dài → lỗi tại ô');
  });

  check('N35-1 · Mô tả Case: tạo 500 lưu / 501 → 400; Sửa Case chỉ đổi tên giữ mô tả cũ 600 ký tự; đổi mô tả mà vẫn dài → 400', () => thu(() => {
    caseThu(chu(500));
    assert(tran(maLoi(() => caseThu(chu(501)))), 'tạo Case 501 ký tự phải 400');
    const c = caseThu();
    conn.prepare('UPDATE sos_cases SET summary = ? WHERE id = ?').run(chu(600), c);
    const doiTen = maLoi(() => cases.suaCase(P.lrTeacher, c, { title: 'N35 đổi tên' }));
    assert(!tran(doiTen), `chỉ đổi tên mà bị chặn vì mô tả cũ: ${doiTen.msg}`);
    assert(get('SELECT summary FROM sos_cases WHERE id = ?', c).summary.length === 600, 'chữ cũ dài phải giữ nguyên, không cắt');
    assert(tran(maLoi(() => cases.suaCase(P.lrTeacher, c, { summary: chu(600) + 'y' }))), 'đổi mô tả mà vẫn dài phải 400');
    cases.suaCase(P.lrTeacher, c, { summary: chu(500) });
    assert(get('SELECT summary FROM sos_cases WHERE id = ?', c).summary.length === 500, 'rút về 500 thì lưu');
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

  check('N35-4 · Nhận xét MT: 500 lưu / 501 → 400; nhận xét cũ 600 ký tự gửi lại nguyên văn vẫn lưu (vd sửa điểm)', () => thu(() => {
    const [a] = luotMt();
    assert(a, 'cần một lượt MT ở MB FT 101');
    attempts.saveScore(P.lrTeacher, a, 'listening', { rawScore: 30, nhanXet: chu(500) }, TODAY);
    assert(tran(maLoi(() => attempts.saveScore(P.lrTeacher, a, 'listening', { nhanXet: chu(501) }, TODAY))), 'nhận xét 501 phải 400');
    conn.prepare(`UPDATE assessment_scores SET comment = ? WHERE attempt_id = ? AND skill = 'listening'`).run(chu(600), a);
    const giu = maLoi(() => attempts.saveScore(P.lrTeacher, a, 'listening', { rawScore: 31, nhanXet: chu(600) }, TODAY));
    assert(!tran(giu), `nhận xét cũ gửi lại bị chặn: ${giu.msg}`);
    assert(get(`SELECT comment FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, a).comment.length === 600, 'chữ cũ giữ nguyên');
  }));

  check('N35-6 · chủ SP 25/11: không còn giới hạn CHỮ 300 sót ở web / máy chủ / shared (đã nâng 500; ngoại lệ: slice(0, 300) cắt câu lỗi, tiêu đề thông báo, mô tả bộ lọc xuất — không phải ô gõ)', () => {
    const mau = [/maxLength=\{300\}/, /length\s*>\s*300\b/, /TOI_DA\s*=\s*300\b/, /toiDa:\s*300\b/, /(moTaCase|nhanXetMt):\s*300\b/, /tối đa 300 ký tự/i, /≤ 300/, /\(300\)/, /, 300, 'Lý do'/];
    const sot: string[] = [];
    const quet = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'tests' && e.name !== 'node_modules') quet(f); continue; }
        if (!/\.(ts|tsx)$/.test(e.name)) continue;
        readFileSync(f, 'utf8').split(/\r?\n/).forEach((dong, i) => { if (mau.some((m) => m.test(dong))) sot.push(`${f}:${i + 1}`); });
      }
    };
    for (const d0 of ['web/src', 'server/src', 'shared']) quet(join(process.cwd(), d0));
    assert(!sot.length, `còn giới hạn 300: ${sot.join(' · ')}`);
  });

}
