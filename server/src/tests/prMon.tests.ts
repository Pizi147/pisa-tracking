/** PHÉP KIỂM PR-MON — hệ môn học theo chương trình, Pre FOU một ô Tổng hợp, hai khung FT / Lớp thường. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMonTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P } = t;
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
}
