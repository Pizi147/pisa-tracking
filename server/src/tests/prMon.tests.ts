/** PHÉP KIỂM PR-MON — hệ môn học theo chương trình, Pre FOU một ô Tổng hợp, hai khung FT / Lớp thường. Harness do `run.ts` truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach as doc } from './panelUx3.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
/** Mọi file .ts/.tsx dưới `dir` (đường dẫn tương đối gốc repo, dấu /). */
const quet = (dir: string): string[] => fs.readdirSync(path.join(REPO, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? quet(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);

export async function runPrMonTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY, addDays, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-MON · Hệ môn học, Pre FOU, hai khung');

  // ------------------------------------------------------------------ Task 1 · luật thuần
  check('MON (1) · tenMon/tenMonNgan theo chương trình (MH2, T55)', () => {
    const cap: [string | null, string, string][] = [
      ['FOU', 'writing', 'G+V'], ['FOU', 'speaking', 'P'], ['FOU', 'pronunciation', 'P'], ['BE', 'writing', 'W'],
      ['PREFOU', 'tong_hop', 'Tổng hợp'], [null, 'writing1', 'W1'], ['FOU', 'listening', 'L'], ['FT', 'speaking', 'S'],
    ];
    for (const [ct, o, mong] of cap) assert(d.tenMonNgan(ct, o) === mong, `${ct}/${o} → ${d.tenMonNgan(ct, o)}`);
    assert(d.tenMon('FOUND', 'writing') === 'Grammar + Vocabulary', 'mã cũ FOUND');
    assert(d.tenMon('FOU', 'speaking') === 'Pronunciation' && d.tenMon('BE', 'writing') === 'Writing', 'tên đầy đủ');
    assert(d.skillShort('writing') === 'W' && d.tenKyNang('writing2') === 'Writing Task 2', 'lớp mỏng không chương trình');
  });
  check('MON (1) · boMonLich: FT/null 4 kỹ năng đánh giá · PREFOU tong_hop · bảng thắng hằng số', () => {
    assert(d.boMonLich('FT').join() === d.ASSESSED_SKILLS.join() && d.boMonLich(null).join() === d.ASSESSED_SKILLS.join(), 'FT/null');
    assert(d.boMonLich('PREFOU').join() === 'tong_hop', d.boMonLich('PREFOU').join());
    assert(d.boMonLich('BE', ['listening']).join() === 'listening', 'bảng thắng');
    assert(d.boMonLich('FOU').join() === d.REGULAR_SKILLS.join(), 'FOU dự phòng hằng số');
    assert(d.khungCua('ratio') === 'thuong' && d.khungCua('ielts_band') === 'ft' && d.khungCua(null) === 'ft', 'khungCua');
    assert(d.kyNangGoiY('FOU', 'writing').join() === 'writing1,writing2' && d.kyNangGoiY('FOU', 'speaking').join() === 'speaking'
      && d.kyNangGoiY('PREFOU', 'tong_hop').length === 0, 'kyNangGoiY');
  });
  check('MON (1) · phân loại theo môn (T57): FOU G+V/P, Pre FOU Tổng hợp, BE giữ bộ Writing', () => {
    const ma = (topic: string, ct: string | null) => d.issuesForTopic(topic, ct).map((i) => i.code);
    assert(ma('writing', 'FOU').includes('student.gv.grammar') && !ma('writing', 'FOU').includes('student.writing.task'), 'FOU writing');
    assert(ma('speaking', 'FOU').includes('student.phat_am.stress'), 'FOU speaking → P');
    assert(ma('tong_hop', 'PREFOU').length >= 4, 'Pre FOU');
    assert(ma('writing', 'BE').includes('student.writing.task') && ma('writing1', null).includes('student.writing.task'), 'BE/FT giữ');
    assert(d.caseTopicLabel('writing') === 'Writing' && d.caseTopicLabel('writing', 'FOU') === 'Grammar + Vocabulary', 'không còn mã thô');
    assert(d.issueBranchOf('student.gv.vocabulary') === 'gv' && d.issueLabel('student.phat_am.intonation') === 'Ngữ điệu', 'mã mới có chỉ mục');
  });
  check('MON (1) · Pre FOU một hạng mục Case "Tổng hợp"', () => {
    assert(d.caseCategoriesFor('ratio', 'PREFOU').join() === 'tong_hop', 'caseCategoriesFor');
    assert(d.caseTopicsFor(true, 'PREFOU').join() === 'tong_hop' && d.caseTopicsFor(true).length === 4, 'caseTopicsFor');
    assert(d.categoryOf('tong_hop') === 'tong_hop' && d.CASE_CATEGORY_SKILL.tong_hop === 'tong_hop', 'categoryOf / skill');
    assert(d.monViPham('PREFOU').length === 0 && d.monViPham('FT').length === 5 && d.monViPham('FOU').length === 4, 'monViPham');
  });
  check('MON (1) · ketQuaThuong Pre FOU: % tổng, làm tròn chỉ để hiện', () => {
    const r = d.ketQuaThuong({ dat: 0, daCham: 1, tong: 1, thieu: [], tyLe: 0.675, khongChiaMon: true });
    assert(r.chinh === '68%' && r.phu === null, JSON.stringify(r));
    assert(d.ketQuaThuong({ dat: 3, daCham: 4, tong: 4, thieu: [] }).chinh === '3/4 môn đạt', 'lớp thường khác giữ nhãn');
  });
  check('MON (1) · oPhanCong FOU dùng tenMonNgan; LOI_CHUNG có Phát âm (K1-22)', () => {
    const nhan = d.oPhanCong('FOU', d.REGULAR_SKILLS).map((o) => o.nhan).join(' ');
    assert(nhan === 'GVCN L R G+V P', nhan);
    const pa = d.LOI_CHUNG.find((n) => n.khoa === 'phat-am');
    assert(!!pa && pa.ma.includes('student.phat_am.sound') && pa.ma.includes('student.speaking.pronunciation'), 'nhóm Phát âm');
    assert(d.LOI_CHUNG.find((n) => n.khoa === 'ngu-phap')!.ma.includes('student.gv.grammar'), 'G+V vào Ngữ pháp');
  });

  // ------------------------------------------------------------------ Task 2 · migrate kỹ năng phụ trách được
  const mig: any = await import('../migrate/prMon.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const clsMod: any = await import('../classes/classes.ts');
  const kyNangCua = (id: number) => (conn.prepare('SELECT skill FROM user_skills WHERE user_id = ? ORDER BY skill').all(id) as any[]).map((r) => r.skill).join(',');
  const datKyNang = (id: number, ds: string[]) => {
    conn.prepare('DELETE FROM user_skills WHERE user_id = ?').run(id);
    for (const s of ds) conn.prepare('INSERT INTO user_skills (user_id, skill) VALUES (?, ?)').run(id, s);
  };
  const [A, B, C] = [P.w1Teacher.userId, P.w2Teacher.userId, P.sTeacher.userId];
  const giu = new Map([A, B, C].map((id) => [id, kyNangCua(id).split(',').filter(Boolean)]));
  const traLai = () => { for (const [id, ds] of giu) datKyNang(id, ds); };

  check('MON (2) · chạy thử chỉ đọc: keHoachDoiKyNang đúng người, bảng không đổi', () => {
    try {
      datKyNang(A, ['writing']); datKyNang(B, ['writing1', 'writing']); datKyNang(C, ['pronunciation']);
      const dem = () => (conn.prepare('SELECT COUNT(*) AS n, GROUP_CONCAT(user_id || skill) AS h FROM user_skills').get() as any);
      const truoc = dem();
      const kh = mig.keHoachDoiKyNang(conn);
      const cua = (id: number) => kh.find((x: any) => x.userId === id);
      assert(cua(A)?.moi.join() === 'writing1,writing2' && cua(B)?.moi.join() === 'writing1,writing2' && cua(C)?.moi.join() === 'speaking',
        JSON.stringify([cua(A), cua(B), cua(C)]));
      const sau = dem();
      assert(truoc.n === sau.n && truoc.h === sau.h, 'chạy thử đã ghi vào bảng');
      const fou = mig.demCaseFouNguyenNhanIelts(conn);
      assert(typeof fou.soCase === 'number' && fou.mau.length <= 20, 'đếm Case FOU');
    } finally { traLai(); }
  });
  check('MON (2) · migrate user_skills: W lớp thường → W1 + W2, Pron → S; chạy lần 2 không đổi gì (MH1, K5-29)', () => {
    try {
      datKyNang(A, ['writing']); datKyNang(B, ['writing1', 'writing']); datKyNang(C, ['pronunciation']);
      const applied: string[] = [];
      mig.migratePrMon(conn, applied);
      assert(applied.length === 1, JSON.stringify(applied));
      assert(kyNangCua(A) === 'writing1,writing2' && kyNangCua(B) === 'writing1,writing2' && kyNangCua(C) === 'speaking',
        `${kyNangCua(A)} | ${kyNangCua(B)} | ${kyNangCua(C)}`);
      mig.migratePrMon(conn, applied);
      assert(applied.length === 1, 'lần 2 lại thêm dòng applied');
      assert(!(conn.prepare("SELECT 1 FROM user_skills WHERE skill IN ('writing','prep_writing','pronunciation')").get()), 'còn mã cũ');
    } finally { traLai(); }
  });
  await checkAsync('MON (2) · MH1: /auth/info và allSkills đúng 5 mã; setSkills(writing) → W1 + W2; GV thường PUT kỹ năng → 403', async () => {
    const { createApp } = await import('../app.ts');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    try {
      const info = await (await fetch(`http://127.0.0.1:${cong}/api/auth/info`)).json() as any;
      assert(info.skills.join() === d.ENTRY_SKILLS.join(), `/auth/info: ${info.skills}`);
      assert(accounts.myProfile(P.w1Teacher).allSkills.join() === d.ENTRY_SKILLS.join(), 'allSkills');
      const r = accounts.setUserSkills(P.admin, A, ['writing', 'listening']);
      assert(r.skills.join() === 'listening,writing1,writing2' && kyNangCua(A) === 'listening,writing1,writing2', kyNangCua(A));
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: P.sTeacher.userId }) });
      const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
      assert(!!cookie, 'không có phiên demo');
      const put = await fetch(`http://127.0.0.1:${cong}/api/admin/accounts/${A}/skills`, { method: 'PUT',
        headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ skills: ['speaking'] }) });
      assert(put.status === 403, `GV thường sửa kỹ năng người khác: ${put.status}`);
      assertThrows(() => accounts.setUserSkills(P.sTeacher, A, ['speaking']), /Quản trị/, 'hàm dịch vụ cũng chặn');
    } finally { traLai(); may.close(); }
  });
  check('MON (2) · teacherCandidatesBranch có cột skills (một câu, không N+1)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const ds = clsMod.teacherCandidatesBranch(mb) as any[];
    const a = ds.find((x) => x.id === A);
    const tach = (s: unknown) => String(s ?? '').split(',').filter(Boolean).sort().join(',');
    assert(!!a && 'skills' in a && tach(a.skills) === kyNangCua(A), JSON.stringify(a));
  });

  // ------------------------------------------------------------------ Task 3 · lịch một lượt theo bộ môn, % tổng
  const intakeMod: any = await import('../classes/intake.ts');
  const regularMod: any = await import('../normal/regular.ts');
  const lich: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const MB = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
  const GVCN_HA = P.normalCoreTeacher.userId;
  /** Lớp Pre FOU thử (chèn qua createClass — cờ CHO_TAO_PRE_FOU không chặn đường nội bộ), GVCN tự nhận ô tong_hop, n em, đã xếp bài. */
  let soLop = 0;
  const taoLopPreFou = (soEm: number) => {
    soLop += 1;
    const tuanKg = week.ensurePeriod(addDays(TODAY, -28));
    const lop = intakeMod.createClass(P.admin, { code: `MB Pre FOU 9${soLop}`, branchId: MB, kind: 'PREFOU', startPeriodId: tuanKg.id, startDate: tuanKg.weekStart });
    clsMod.ghiPhanCong(P.admin, lop.id, d.moRongPhanCong('PREFOU', ['tong_hop'], [{ userId: GVCN_HA, skill: null, isCore: true }]), TODAY);
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `MON-${soLop}-${i}`;
      const sid = Number(conn.prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, tuanKg.weekStart, now);
      sids.push(sid);
    }
    regularMod.planRegularTests(P.admin, lop.id);
    const luot = (conn.prepare('SELECT id, student_id, kind FROM assessment_attempts WHERE class_id = ? ORDER BY student_id').all(lop.id) as any[]);
    return { classId: lop.id as number, sids, luot };
  };

  check('MON (3) · lượt Pre FOU một dòng lịch tong_hop; gọi lại không chèn thêm; môn lạ bị từ chối (K5-38, PF6)', () => {
    const l = taoLopPreFou(1);
    assert(l.luot.length === 1 && l.luot[0].kind === 'final', JSON.stringify(l.luot));
    const id = l.luot[0].id;
    const r1 = lich.ensureSkillRows(id);
    assert(r1.length === 1 && r1[0].skill === 'tong_hop', JSON.stringify(r1.map((r: any) => r.skill)));
    lich.ensureSkillRows(id);
    assert((conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(id) as any).n === 1, 'gọi lần 2 chèn thêm dòng');
    const tuan = week.ensurePeriod(addDays(TODAY, 7)).id;
    assertThrows(() => lich.setSkillWeek(P.admin, id, 'listening', tuan), /Kỹ năng không hợp lệ/, 'môn L ở lượt Pre FOU');
  });
  check('MON (3) · lượt FT vẫn 4 dòng L R W S, thứ tự cũ', () => {
    const ft = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`).get(classId('MB FT 101')) as any;
    const ds = lich.ensureSkillRows(ft.id).map((r: any) => r.skill).join(' ');
    assert(ds === 'listening reading writing speaking', ds);
  });
  check('MON (3) · tyLeTong = Σ điểm / Σ tổng khi đủ môn, thiếu → null; Pre FOU 27/40 = 0.675', () => {
    const r = (skill: string, s: number | null) => ({ skill, raw_score: s, raw_total: s === null ? null : 40 });
    const be = regularMod.evaluateRegular(d.REGULAR_SKILLS, [r('listening', 30), r('reading', 20), r('writing', 35), r('speaking', 36)], 'BE');
    assert(be.tyLeTong === 121 / 160, String(be.tyLeTong));
    const thieu = regularMod.evaluateRegular(d.REGULAR_SKILLS, [r('listening', 30), r('reading', 20), r('writing', 35)], 'BE');
    assert(thieu.tyLeTong === null, 'thiếu một môn phải null');
    const pf = regularMod.evaluateRegular(['tong_hop'], [r('tong_hop', 27)], 'PREFOU');
    assert(pf.tyLeTong === 0.675 && pf.sosLevel === 1 && pf.skills[0].label === 'Tổng hợp', JSON.stringify(pf));
    const fou = regularMod.evaluateRegular(d.REGULAR_SKILLS, [], 'FOU');
    assert(fou.skills.map((s: any) => s.label).join() === 'Listening,Reading,Grammar + Vocabulary,Pronunciation', 'nhãn FOU');
  });

  // ------------------------------------------------------------------ Task 4 · nợ điểm, danh sách môn viết tay
  const debtMod: any = await import('../worklist/scoreDebt.ts');
  const perm: any = await import('../permissions.ts');
  const no = (lop: number) => (debtMod.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((c) => c.classId === lop);
  check('MON (4) · nợ điểm Pre FOU: đúng 1 ô tong_hop/em cho GVCN, không ô L/R/W/S; nhập 1 em → bớt 1 (K5-39)', () => {
    const l = taoLopPreFou(3);
    const ha = perm.loadPrincipal(GVCN_HA);   // nạp lại: phân công mới sau lúc harness dựng P
    const truoc = no(l.classId);
    assert(truoc.length === 3 && truoc.every((c) => c.skill === 'tong_hop' && c.userId === GVCN_HA), JSON.stringify(truoc));
    regularMod.saveRegularScore(ha, l.luot[0].id, 'tong_hop', { score: 27, total: 40 }, TODAY);
    const sau = no(l.classId);
    assert(sau.length === 2 && !sau.some((c) => c.attemptId === l.luot[0].id), JSON.stringify(sau));
  });
  check('MON (4) · lượt Pre FOU đủ điểm không bị nạp lại (câu lọc trước theo bảng programme_skills)', () => {
    const l = taoLopPreFou(1);
    regularMod.saveRegularScore(perm.loadPrincipal(GVCN_HA), l.luot[0].id, 'tong_hop', { score: 30, total: 40 }, TODAY);
    assert(no(l.classId).length === 0, 'còn nợ sau khi đủ điểm');
  });
  check('MON (4) · quét danh sách 4 môn viết tay ở máy chủ: chỉ bảng trắng', () => {
    const TRANG = ['metrics.ts', 'boQuen.ts', 'vanDeHv.ts', 'phanTich.ts', 'keHoachTest.ts'];
    const mau = [/\[\s*'listening',\s*'reading',\s*'writing',\s*'speaking'\s*\]/];
    const lo = quet('server/src').filter((f) => !/\/(tests|seed)\/|\/migrate/.test(f) && !TRANG.includes(path.basename(f)))
      .filter((f) => mau.some((m) => m.test(doc(f))));
    assert(lo.length === 0, `còn danh sách 4 môn viết tay: ${lo.join(', ')}`);
  });

  // ------------------------------------------------------------------ Task 5 · Case, quyền, phân loại theo môn
  const cases: any = await import('../cases/cases.ts');
  const owner: any = await import('../cases/owner.ts');
  const viMod: any = await import('../yThuc/violations.ts');
  let soHv = 0;
  /** Một em mới ở lớp `lopCode`, lộ trình lớp thường mang mã chương trình `ct`. */
  const taoHv = (lopCode: string, ct: string) => {
    soHv += 1;
    const now = new Date().toISOString();
    const cid = classId(lopCode);
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-MONHV-${soHv}`, `Học viên MON ${soHv}`, `hoc vien mon ${soHv}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, cid, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
                  VALUES (?, 1, NULL, ?, '2026-07-27', 'active', ?)`).run(sid, ct, now);
    return sid;
  };
  let soKhoa = 0;
  const moCase = (p: any, studentId: number, topic: string, primaryCode: string) => cases.reportIssue(p, {
    studentId, topic, primaryCode, title: 'Case thử PR-MON', summary: 'Phép kiểm PR-MON: nguyên nhân theo môn của chương trình.',
    idempotencyKey: `pr-mon-${++soKhoa}`,
  });

  check('MON (5) · GVCN Pre FOU nhập điểm và xử lý Case "Tổng hợp"; GV khác cùng chi nhánh bị chặn (M-09, T56)', () => {
    const l = taoLopPreFou(1);
    const ha = perm.loadPrincipal(GVCN_HA);
    regularMod.saveRegularScore(ha, l.luot[0].id, 'tong_hop', { score: 27, total: 40 }, TODAY);
    assertThrows(() => regularMod.saveRegularScore(P.lrTeacher, l.luot[0].id, 'tong_hop', { score: 20, total: 40 }, TODAY),
      /phân công|quyền/, 'GV không phân công nhập được điểm Pre FOU');
    assert(owner.suggestCaseOwner({ classId: l.classId, category: 'tong_hop' }) === GVCN_HA, 'người phụ trách Case Tổng hợp phải là GVCN');
    const c = moCase(ha, l.sids[0], 'tong_hop', 'student.tong_hop.focus');
    assert(c.topic === 'tong_hop' && c.category === 'tong_hop', JSON.stringify({ topic: c.topic, category: c.category }));
    assertThrows(() => moCase(ha, l.sids[0], 'listening', d.issuesForTopic('listening')[0].code), /Chủ đề không hợp lệ/, 'Pre FOU không có Case Listening');
  });
  check('MON (5) · FOU chỉ nhận nguyên nhân G+V; BE ngược lại (T57, K5-41)', () => {
    const fou = taoHv('MB FOU 12', 'FOU');
    assertThrows(() => moCase(P.mbManager, fou, 'writing', 'student.writing.task'), /không thuộc bộ phân loại của Grammar \+ Vocabulary/, 'FOU nhận mã IELTS');
    assert(moCase(P.mbManager, fou, 'writing', 'student.gv.grammar').topic === 'writing', 'FOU G+V');
    const be = taoHv('MB BE 08', 'BE');
    assertThrows(() => moCase(P.mbManager, be, 'writing', 'student.gv.grammar'), /không thuộc bộ phân loại/, 'BE nhận mã G+V');
    assert(moCase(P.mbManager, be, 'writing', 'student.writing.task').topic === 'writing', 'BE Writing');
    const tp = cases.caseTopicsOf(P.mbManager, fou);
    assert(tp.chuongTrinh === 'FOU' && tp.topics.length === 4, JSON.stringify(tp));
  });
  check('MON (5) · vi phạm Pre FOU không có môn: danh sách chọn rỗng, tong_hop bị từ chối, không tự điền (K5-47)', () => {
    const l = taoLopPreFou(1);
    const ha = perm.loadPrincipal(GVCN_HA);
    assert(d.monViPham('PREFOU').length === 0, 'danh sách chọn');
    assert(viMod.defaultSkillFor(ha, l.classId) === null, 'GVCN Pre FOU bị tự điền môn tong_hop');
    assertThrows(() => viMod.recordViolation(ha, { studentId: l.sids[0], category: 'homework', skill: 'tong_hop',
      description: 'Không làm bài tập về nhà hai buổi liền.' }), /Môn không hợp lệ/, 'nhận môn tong_hop');
    const v = viMod.recordViolation(ha, { studentId: l.sids[0], category: 'homework', description: 'Không làm bài tập về nhà hai buổi liền.' });
    assert(v.violation.skill === null, `môn tự điền: ${v.violation.skill}`);
  });
  check('MON (5) · bỏ quên không nối FOU → BE: khoá họ khác nhau (K5-57)', () => {
    const src = doc('server/src/phanTich/boQuen.ts');
    assert(src.includes('khoaHo(hopLe[0]) === khoaHo(hopLe[1])') && src.includes("=== 'FOU' ? 'FOU' : 'thuong'"), 'boQuen chưa so khoá họ');
  });
  // ------------------------------------------------------------------ Task 6 · tên môn phía máy chủ
  const mywork: any = await import('../worklist/mywork.ts');
  check('MON (6) · một nguồn tên môn (máy chủ): chỉ normal.ts tra REGULAR_SKILL_LABEL[ / SKILL_SHORT[ (MH2)', () => {
    const lo = [...quet('server/src'), ...quet('shared/domain')]
      .filter((f) => !/\/tests\//.test(f) && path.basename(f) !== 'normal.ts')
      .filter((f) => /REGULAR_SKILL_LABEL\[|(^|[^_A-Z])SKILL_SHORT\[/.test(doc(f)));
    assert(lo.length === 0, `còn tự tra bảng tên môn: ${lo.join(', ')}`);
  });
  check('MON (6) · FOU trả G+V/P: regularSheet, Case, việc /my-work (MH2, K5-40)', () => {
    const sh = regularMod.regularSheet(P.admin, classId('MB FOU 12'));
    assert(sh.skillLabels.writing === 'Grammar + Vocabulary' && sh.monNgan.speaking === 'P' && sh.monNgan.writing === 'G+V',
      JSON.stringify({ l: sh.skillLabels, n: sh.monNgan }));
    assert(sh.rows.every((r: any) => r.skillSchedule.find((x: any) => x.skill === 'speaking')?.label === 'Pronunciation'), 'nhãn lịch từng môn');
    const fou = taoHv('MB FOU 12', 'FOU');
    const c = moCase(P.mbManager, fou, 'writing', 'student.gv.vocabulary');
    const ct = cases.caseDetail(P.admin, c.id);
    assert(ct.chuongTrinh === 'FOU' && ct.topicLabel === 'Grammar + Vocabulary' && ct.categoryLabel === 'Grammar + Vocabulary',
      JSON.stringify({ ct: ct.chuongTrinh, t: ct.topicLabel, c: ct.categoryLabel }));
    const dong = (mywork.myWork(P.mbManager).groups as any[]).flatMap((g) => g.items).find((i: any) => i.caseId === c.id);
    assert(!!dong && /Grammar \+ Vocabulary/.test(dong.tieuDe) && !/writing|Writing/.test(dong.tieuDe), JSON.stringify(dong?.tieuDe));
  });
}
