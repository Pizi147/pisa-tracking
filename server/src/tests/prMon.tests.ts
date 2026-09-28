/** PHÉP KIỂM PR-MON — hệ môn học theo chương trình, Pre FOU một ô Tổng hợp, hai khung FT / Lớp thường. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMonTests(t: YThucTestKit) {
  const { check, assert } = t;
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
}
