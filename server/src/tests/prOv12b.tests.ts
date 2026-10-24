/**
 * PHÉP KIỂM PR-OV12b — nhận xét MT bắt buộc (chủ SP 14/10): ô MT có điểm phải có nhận xét ≥ 10 ký tự; band dưới kỳ vọng (W1 / W2 theo
 * từng task) → ≥ 1 nhóm nguyên nhân (thứ tự chọn, 1 = chính). LUAT-NX-MT (chủ SP 22/10): thiếu chỉ NHẮC (cờ `thieuNhanXet`), không 400.
 * Miễn: MT cũ / nhập bù (`lich_su`), MT0, Vắng / "-", xoá điểm. Lưới: ô cũ thiếu → cờ `thieuNhanXet`. Excel: cột Nhận xét L…S + Nhóm.
 * Mỗi ca cuộn lại (`thu`).
 */
import { tieuChiThu } from '../seed/tieuChiThu.ts';
export async function runPrOv12bTests(t: any) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const hoanTatMod: any = await import('../fasttrack/hoanTat.ts');
  const week: any = await import('../platform/week.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrOv12b } = await import('../migrate/prOv12b.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { default: Database } = await import('libsql');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  console.log('\nPR-OV12b · nhận xét MT bắt buộc · nhóm nguyên nhân khi dưới kỳ vọng · Excel cột nhận xét');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return { status: 'không ném' }; };
  const lop = classId('MB FT 101');
  const WS = '2026-11-02', TRONG = '2026-11-04';
  const W = week.ensurePeriod(WS).id as number;
  const luot = one(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0 AND a.target_at_attempt IS NOT NULL
      ORDER BY a.id DESC LIMIT 1`, lop)?.id as number;
  /** Lượt sạch ở tuần W, kỳ vọng = target 6.5 − độ lệch MT (`expectationFor`). */
  const dung = (aid: number, o: { lichSu?: number; kind?: string } = {}) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = ?, kind = ?, planned_period_id = ?, deadline_override = NULL,
      target_at_attempt = 6.5 WHERE id = ?`).run(o.lichSu ?? 0, o.kind ?? 'mock', W, aid);
    xoaNho();
  };
  const kv = () => attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', luot)).expectation as number;
  const luu = (skill: string, patch: any, who = P.admin) => attempts.saveScore(who, luot, skill, patch, TRONG);
  const dong = (s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', luot, s);
  const NX = 'Bỏ trống 6 câu cuối Passage 3, làm TFNG chậm.';
  const R = d.issuesForTopic('reading').map((i: any) => i.code) as string[];
  const Wc = d.issuesForTopic('writing1').map((i: any) => i.code) as string[];
  /** Số câu Reading cho band `b` (bảng quy đổi chung). */
  const soCau = (b: number) => { for (let n = 40; n >= 0; n -= 1) if (d.bandTuSoCau('reading', n) === b) return n; throw new Error(`không có ${b}`); };

  check('OV12b-1 · luật chung: thiếu / ngắn / thiếu nhóm khi dưới kỳ vọng; miễn ô không điểm, MT cũ, MT0', () => {
    const o = (x: any) => d.thieuNhanXetMt({ nenCo: true, coDiem: true, band: 6, kyVong: 5.5, nhanXet: NX, nhom: [], ...x });
    assert(o({ nhanXet: null }) === 'ghi-nhan-xet' && o({ nhanXet: '   ' }) === 'ghi-nhan-xet', 'trống');
    assert(o({ nhanXet: 'Làm tốt' }) === 'nhan-xet-ngan' && o({ nhanXet: '123456789' }) === 'nhan-xet-ngan' && o({ nhanXet: '1234567890' }) === null, 'ngưỡng 10');
    assert(o({ band: 4.5 }) === 'chon-nhom' && o({ band: 4.5, nhom: [R[1]] }) === null && o({ band: 4.5, kyVong: null }) === null, 'nhóm khi dưới kỳ vọng');
    assert(o({ coDiem: false, nhanXet: null }) === null && o({ nenCo: false, nhanXet: null }) === null, 'miễn');
    assert(d.nenCoNhanXetMt({ kind: 'mock', lichSu: false }) && !d.nenCoNhanXetMt({ kind: 'mock', lichSu: true })
      && !d.nenCoNhanXetMt({ kind: 'mt0', lichSu: false }) && !d.nenCoNhanXetMt({ kind: 'progress', lichSu: false }), 'phạm vi MT');
    assert(JSON.stringify(d.kiemNhomNguyenNhan([R[3], R[1]], 'reading')) === JSON.stringify({ gt: [R[3], R[1]] }), 'giữ thứ tự');
    assert('loi' in d.kiemNhomNguyenNhan([Wc[0]], 'reading') && 'loi' in d.kiemNhomNguyenNhan([R[0], R[0]], 'reading')
      && 'loi' in d.kiemNhomNguyenNhan('x', 'reading') && 'gt' in d.kiemNhomNguyenNhan([Wc[0]], 'writing2'), 'mã sai kỹ năng / trùng / kiểu');
    assert(JSON.stringify(d.docNhomNguyenNhan('["a","b"]')) === '["a","b"]' && d.docNhomNguyenNhan('hỏng').length === 0 && d.docNhomNguyenNhan(null).length === 0, 'đọc cột');
  });

  check('OV12b-2 · migrate prOv12b: thêm cột nhom_nguyen_nhan một lần, chạy lại không đổi; DB demo đã có cột', () => {
    const m = new Database(':memory:');
    m.exec('CREATE TABLE assessment_scores (id INTEGER PRIMARY KEY, comment TEXT)');
    const a1: string[] = [], a2: string[] = [];
    migratePrOv12b(m, a1); migratePrOv12b(m, a2);
    const cot = (m.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).map((c) => c.name);
    assert(cot.includes('nhom_nguyen_nhan') && a1.length === 1 && a2.length === 0, `cột ${cot} · lần 1 ${a1.length} · lần 2 ${a2.length}`);
    m.close();
    const a3: string[] = [];
    migratePrOv12b(conn, a3);
    assert(a3.length === 0, 'DB demo (schema.sql) đã có cột');
  });

  check('OV12b-3 → LUAT-NX-MT · máy chủ: điểm MT thiếu / ngắn nhận xét → LƯU (không 400); đủ → lưu; đạt kỳ vọng không cần nhóm; dài quá → 400', () => thu(() => {
    assert(luot, 'cần một lượt MT ở MB FT 101');
    dung(luot);
    luu('listening', { rawScore: 30 });
    assert(dong('listening')?.raw_score === 30, 'thiếu nhận xét vẫn lưu điểm');
    luu('listening', { rawScore: 31, nhanXet: 'Làm tốt' });
    assert(dong('listening').raw_score === 31 && dong('listening').comment === 'Làm tốt', 'nhận xét ngắn vẫn lưu');
    assert(loi(() => luu('listening', { nhanXet: 'x'.repeat(d.NHAN_XET_TOI_DA + 1) })).status === 400, 'giữ kiểm độ dài tối đa');
    luu('listening', { rawScore: 35, nhanXet: 'Nghe Part 3 còn chậm; điền bảng tốt.' });
    assert(dong('listening').raw_score === 35 && dong('listening').nhom_nguyen_nhan === null, 'đạt: lưu, không nhóm');
    /* Sửa điểm (không gửi nhận xét) giữ nhận xét cũ → hợp lệ. */
    luu('listening', { rawScore: 34 });
    assert(dong('listening').raw_score === 34, 'sửa điểm giữ nhận xét cũ');
    /* Chỉ nhận xét: xoá ở ô có điểm → lưu (chỉ nhắc). */
    luu('listening', { nhanXet: null });
    assert(dong('listening').comment === null && dong('listening').raw_score === 34, 'xoá nhận xét lưu được');
    /* Ô chưa điểm: ghi nhận xét trước vẫn được (Q7), kể cả ngắn. */
    luu('speaking', { nhanXet: 'ok' });
    assert(dong('speaking').comment === 'ok', 'nhận xét trước điểm');
  }));

  check('OV12b-4 · dưới kỳ vọng: thiếu nhóm → lưu (LUAT-NX-MT); mã sai → 400; lưu đúng thứ tự; sửa thành đạt → bỏ nhóm; xoá điểm → GIỮ nhóm + nhận xét (LUAT-34)', () => thu(() => {
    dung(luot);
    const thap = soCau(kv() - 1);
    luu('reading', { rawScore: thap, nhanXet: NX });
    assert(dong('reading').nhom_nguyen_nhan === null, 'thiếu nhóm vẫn lưu');
    assert(loi(() => luu('reading', { rawScore: thap, nhanXet: NX, nhomNguyenNhan: [Wc[0]] })).status === 400, 'mã Writing ở Reading');
    luu('reading', { rawScore: thap, nhanXet: NX, nhomNguyenNhan: [R[1], R[3]] });
    assert(dong('reading').nhom_nguyen_nhan === JSON.stringify([R[1], R[3]]), `thứ tự: ${dong('reading').nhom_nguyen_nhan}`);
    /* Chỉ đổi nhóm: đảo thứ tự → lưu (bỏ hết cũng lưu — LUAT-NX-MT, xem OV12b-10). */
    luu('reading', { nhomNguyenNhan: [R[3], R[1]] });
    assert(dong('reading').nhom_nguyen_nhan === JSON.stringify([R[3], R[1]]), 'đảo thứ tự');
    const ls = attempts.scoreHistoryOf(luot).find((x: any) => x.kind === 'nhan_xet' && x.skill === 'reading');
    assert(ls && ls.after === [R[3], R[1]].map(d.issueLabel).join(', ') && ls.before === [R[1], R[3]].map(d.issueLabel).join(', '), `lịch sử nhóm: ${JSON.stringify(ls)}`);
    luu('reading', { rawScore: soCau(kv()) });
    assert(dong('reading').nhom_nguyen_nhan === null, 'sửa thành đạt → bỏ nhóm');
    luu('reading', { rawScore: thap, nhomNguyenNhan: [R[0]] });
    luu('reading', { rawScore: null });
    assert(dong('reading').nhom_nguyen_nhan === JSON.stringify([R[0]]) && dong('reading').comment === NX, 'LUAT-34: Huỷ điểm giữ nhận xét + nhóm');
  }));

  check('OV12b-5 · Writing theo TỪNG task: W1 dưới kỳ vọng cần nhóm kể cả khi W tổng đạt; W2 đạt không cần', () => thu(() => {
    dung(luot);
    const k = kv();
    const thapW = Math.floor(k) - 1;   // bốn tiêu chí bằng nhau → band = giá trị đó
    const caoW = Math.ceil(k) + 1;
    luu('writing1', { criteria: tieuChiThu(thapW), nhanXet: 'Thiếu overview, chọn số liệu chưa đúng.' });
    xoaNho();
    const w1 = attempts.classScoreSheet(P.admin, lop, W, TRONG).rows.find((x: any) => x.attemptId === luot).cells.find((c: any) => c.skill === 'writing1');
    assert(w1.thieuNhanXet === 'chon-nhom' && w1.xong, `W1 thấp thiếu nhóm: lưu + nhắc (${w1.thieuNhanXet})`);
    luu('writing1', { criteria: tieuChiThu(thapW), nhanXet: 'Thiếu overview, chọn số liệu chưa đúng.', nhomNguyenNhan: [Wc[0]] });
    luu('writing2', { criteria: tieuChiThu(caoW), nhanXet: 'Lập luận rõ, ví dụ sát đề.' });
    assert(dong('writing2').band >= k && dong('writing2').nhom_nguyen_nhan === null, 'W2 đạt');
  }));

  check('OV12b-6 · miễn: MT cũ (lich_su), MT0, "-" / Vắng — lưu điểm không cần nhận xét', () => thu(() => {
    dung(luot, { lichSu: 1 });
    luu('listening', { rawScore: 10 });
    assert(dong('listening').raw_score === 10, 'MT cũ');
    dung(luot, { kind: 'mt0' });
    luu('listening', { band: 4 });
    assert(dong('listening').band === 4, 'MT0');
    dung(luot);
    luu('reading', { noShow: true });
    assert(dong('reading').no_show_period_id === W, '"-"');
  }));

  check('OV12b-7 · lưới: ô cũ có điểm thiếu nhận xét → "ghi-nhan-xet"; dưới kỳ vọng thiếu nhóm → "chon-nhom"; đủ → null; MT cũ mới nhất vẫn nhắc (N8)', () => thu(() => {
    dung(luot);
    /* Dữ liệu trước luật: ghi thẳng bằng đường nội bộ (không phải người dùng). */
    attempts.saveScore(P.admin, luot, 'listening', { rawScore: 35 }, TRONG);
    attempts.saveScore(P.admin, luot, 'reading', { rawScore: soCau(kv() - 1), nhanXet: NX }, TRONG);
    luu('speaking', { criteria: [8, 8, 8, 8], nhanXet: 'Trôi chảy, phát âm rõ ràng.' });
    const o = (lichSu = false) => {
      xoaNho();
      const r = attempts.classScoreSheet(P.admin, lop, W, TRONG).rows.find((x: any) => x.attemptId === luot);
      return (s: string) => r.cells.find((c: any) => c.skill === s);
    };
    const c = o();
    assert(c('listening').thieuNhanXet === 'ghi-nhan-xet' && c('reading').thieuNhanXet === 'chon-nhom' && c('speaking').thieuNhanXet === null
      && c('writing1').thieuNhanXet === null, `cờ: ${['listening', 'reading', 'speaking', 'writing1'].map((s) => c(s).thieuNhanXet)}`);
    assert(c('listening').nenCoNhanXet === true && c('reading').kyVong === kv() && Array.isArray(c('reading').nhomNguyenNhan), 'trường ô');
    /* LUAT-NX-MT: lượt đã hoàn tất (đủ band, qua Chủ nhật) vẫn NHẮC "thiếu …" ở ô sửa được, nhưng ô đã XONG (có band). */
    for (const k of ['writing1', 'writing2']) attempts.saveScore(P.admin, luot, k, { criteria: [8, 8, 8, 8] }, TRONG);
    const SAU = '2026-12-14';
    assert(hoanTatMod.dotHoanTat(luot, SAU).hoanTat, 'tiền đề: lượt phải hoàn tất');
    xoaNho();
    const l3 = attempts.classScoreSheet(P.admin, lop, W, SAU).rows.find((x: any) => x.attemptId === luot).cells.find((c: any) => c.skill === 'listening');
    assert(l3.thieuNhanXet === 'ghi-nhan-xet' && l3.xong === true, `hoàn tất: nhắc + xong — ${l3.thieuNhanXet} ${l3.xong}`);
    /* SV-NX-CASE (N8 ①): MT mới nhất của em vẫn nhắc dù là MT cũ (≥ 2 tuần). */
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(luot);
    const c2 = o(true);
    assert(c2('listening').thieuNhanXet === 'ghi-nhan-xet' && c2('listening').nenCoNhanXet === true, 'MT mới nhất (cũ) vẫn nhắc');
  }));

  check('OV12b-8 · Excel đầy đủ: cột Nhận xét L, R, W1, W2, S + Nhóm nguyên nhân (thay "Nhận xét W" gộp)', () => {
    const dau = d.COT_FT_THEM as string[];
    for (const c of ['Nhận xét L', 'Nhận xét R', 'Nhận xét W1', 'Nhận xét W2', 'Nhận xét S', 'Nhóm nguyên nhân']) assert(dau.includes(c), `thiếu cột ${c}`);
    assert(!dau.includes('Nhận xét W'), 'còn cột gộp cũ');
    assert(d.chuNhomNguyenNhan({ reading: [R[1], R[3]], writing1: [Wc[0]] }) === `R: ${d.issueLabel(R[1])}, ${d.issueLabel(R[3])} · W1: ${d.issueLabel(Wc[0])}`,
      `chữ nhóm: ${d.chuNhomNguyenNhan({ reading: [R[1], R[3]], writing1: [Wc[0]] })}`);
    assert(d.chuNhomNguyenNhan({}) === null, 'không nhóm → ô trống');
  });

  check('OV12b-10 · rà #383: ô cũ dưới kỳ vọng thiếu cả nhận xét lẫn nhóm — hồ sơ MT lưu RIÊNG từng phần được; LUAT-NX-MT: ngắn / bỏ hết nhóm cũng lưu', () => thu(() => {
    dung(luot);
    attempts.saveScore(P.admin, luot, 'reading', { rawScore: soCau(kv() - 1) }, TRONG);   // dữ liệu trước luật
    luu('reading', { nhanXet: NX });
    assert(dong('reading').comment === NX, 'nhận xét một mình phải lưu được');
    luu('reading', { nhomNguyenNhan: [R[2]] });
    assert(dong('reading').nhom_nguyen_nhan === JSON.stringify([R[2]]), 'chip một mình phải lưu được');
    luu('reading', { nhanXet: 'ngắn' });
    luu('reading', { nhomNguyenNhan: [] });
    assert(dong('reading').comment === 'ngắn' && dong('reading').nhom_nguyen_nhan === null, 'ngắn / bỏ hết nhóm: lưu (chỉ nhắc)');
  }));

  check('OV12b-11 · rà #383: ô S cũ có điểm chưa nhận xét — chỉ đổi GV chấm không bị đòi nhận xét', () => thu(() => {
    dung(luot);
    attempts.saveScore(P.admin, luot, 'speaking', { criteria: [4, 4, 4, 4] }, TRONG);
    luu('speaking', { gvCham: { performerName: 'Cô Lan (giám khảo ngoài)' } });
    assert(dong('speaking').examiner_name === 'Cô Lan (giám khảo ngoài)', 'đổi GV chấm phải lưu');
  }));

  await checkAsync('OV12b-9 · HTTP PUT /attempts/:id/scores/:skill: thiếu nhận xét → 200 (LUAT-NX-MT, ghi điểm); nhận xét dài quá → 400', async () => {
    /* API tự cuộn giao dịch bỏ dở → không bọc `thu`; dựng ca rồi trả lượt về trống ở cuối. */
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const ngayCu = getConfig('demo_date');
    try {
      dung(luot);
      setConfig('demo_date', TRONG);
      xoaNho();
      const ss = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: P.admin.userId }) });
      const cookie = (ss.headers.get('set-cookie') ?? '').split(';')[0];
      const put = (body: any) => fetch(`http://127.0.0.1:${cong}/api/attempts/${luot}/scores/listening`, {
        method: 'PUT', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
      const r1 = await put({ rawScore: 35 });
      assert(r1.status === 200 && dong('listening')?.raw_score === 35, `thiếu: ${r1.status} ${await r1.text()}`);
      const r2 = await put({ nhanXet: 'x'.repeat(d.NHAN_XET_TOI_DA + 1) });
      assert(r2.status === 400 && dong('listening').comment === null, `dài quá: ${r2.status}`);
    } finally { setConfig('demo_date', ngayCu); dung(luot); may.close(); }
  });
}
