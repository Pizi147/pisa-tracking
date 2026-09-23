/**
 * PHÉP KIỂM PR-Rc2: Kế hoạch Test (spec §3.5 "Kế hoạch Test"; kiểm kê §1.4 R9, R9b, R10, R11, R12, R14; §3 dòng 14).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKeHoachTestTests(t: YThucTestKit) {
  const { check, assert, conn, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const attemptsMod: any = await import('../fasttrack/attempts.ts');
  const standingMod: any = await import('../students/standing.ts');
  console.log('\nPR-Rc2 · Kế hoạch Test');

  const mbClass = classId('MB-FT 101');
  /** MT1/MT2/MT3 liên tiếp cùng lộ trình ở MB-FT 101 — cùng câu truy vấn của phép T13/T15 ở `run.ts`. */
  function threeConsecutiveMocks() {
    const rows = conn.prepare(
      `SELECT a.id AS attemptId, a.attempt_no, a.cycle_id, s.skill, s.planned_period_id
         FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
        WHERE a.class_id = ? AND a.status != 'cancelled' AND s.required = 1 AND s.skill = 'listening'
          AND s.planned_period_id IS NOT NULL
        ORDER BY a.cycle_id, a.attempt_no`,
    ).all(mbClass) as any[];
    const byCycle = new Map<number, any[]>();
    for (const r of rows) { if (!byCycle.has(r.cycle_id)) byCycle.set(r.cycle_id, []); byCycle.get(r.cycle_id)!.push(r); }
    for (const list of byCycle.values()) {
      if (list.length >= 3) return list.sort((a, b) => a.attempt_no - b.attempt_no).slice(0, 3);
    }
    assert(false, 'Seed thiếu một lộ trình có đủ MT1, MT2, MT3 đã xếp tuần để kiểm T15');
    return [] as any[];
  }

  check('T15 · Trùng tuần CUỐI của đợt TRƯỚC cũng CHẶN (cả hai chiều)', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    const mt2Week = week.periodById(mt2.planned_period_id)!.week_start;
    const check = skillSchedule.checkSkillWeekMove({
      attemptId: mt3.attemptId, skill: 'listening', newWeekStart: mt2Week,
    });
    assert(check.blockers.length > 0, `Dời MT3 trùng tuần cuối MT2 (đợt trước) phải bị CHẶN, đang ra: ${JSON.stringify(check)}`);
  });

  check('T15 · Đợt CHƯA TẠO (MT4 mới) xếp trùng tuần MT3 → checkWeekVsNeighbours chặn', () => {
    const [mt1, mt2, mt3] = threeConsecutiveMocks();
    const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
    const check = skillSchedule.checkWeekVsNeighbours({
      cycleId: mt3.cycle_id, attemptNo: mt3.attempt_no + 1, excludeAttemptId: null, newWeekStart: mt3Week,
    });
    assert(check.blockers.length > 0, `MT4 (chưa tạo) trùng tuần MT3 phải bị CHẶN, đang ra: ${JSON.stringify(check)}`);
  });

  check('T9 · Kết quả gần nhất dùng mục tiêu TẠI THỜI ĐIỂM THI, không dùng target hiện tại của lộ trình', () => {
    /*
     * PHẢI khớp đúng cách `standingFor` chọn lượt (standing.ts:207: lượt MỚI NHẤT — attempt_no lớn nhất — có BẤT KỲ
     * dòng nào ở `assessment_scores`, kể cả dòng chỉ mang dấu "-" chưa có band) và đúng lộ trình ĐANG CHẠY của em
     * (`status = 'active'`, standing.ts:148) — chọn sai lượt/lộ trình thì so hai bên ra khác nhau vì lý do khác,
     * không phải vì T9.
     */
    const row = conn.prepare(
      `SELECT a.id AS attemptId, a.student_id, a.cycle_id, a.target_at_attempt
         FROM assessment_attempts a
        WHERE a.class_id = ? AND a.status != 'cancelled' AND a.target_at_attempt IS NOT NULL
          AND EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.id = a.cycle_id AND lc.status = 'active')
          AND EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id)
          AND a.attempt_no = (
            SELECT MAX(a2.attempt_no) FROM assessment_attempts a2
             WHERE a2.cycle_id = a.cycle_id AND a2.status != 'cancelled'
               AND EXISTS (SELECT 1 FROM assessment_scores sc2 WHERE sc2.attempt_id = a2.id)
          )
        LIMIT 1`,
    ).get(mbClass) as any;
    assert(row, 'Seed thiếu một lượt FT có điểm và có target_at_attempt để kiểm T9');
    const cu = conn.prepare('SELECT target_score FROM learning_cycles WHERE id = ?').get(row.cycle_id) as any;
    conn.prepare('UPDATE learning_cycles SET target_score = 9.0 WHERE id = ?').run(row.cycle_id);
    try {
      const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(row.attemptId) as any;
      const rieng = attemptsMod.resultOf(a);
      const s = standingMod.standingFor([row.student_id]).get(row.student_id)!;
      assert(s.sosLevel === rieng.sosLevel, `sosLevel phải theo target_at_attempt (${rieng.sosLevel}), đang ra ${s.sosLevel}`);
      if (s.expectation !== undefined) {
        assert(s.expectation === rieng.expectation, `expectation phải theo target_at_attempt, đang ra ${s.expectation} ≠ ${rieng.expectation}`);
      }
    } finally {
      conn.prepare('UPDATE learning_cycles SET target_score = ? WHERE id = ?').run(cu.target_score, row.cycle_id);
    }
  });

  check('PR-Rc2 · Q2 dotDaHoanTat — biên hoàn tất, dấu "-", Chủ nhật, kỹ năng huỷ', () => {
    const skillDiem = (coDiem: boolean, coDau = false, huy = false) => (
      { batBuoc: true, huy, coDiem, coDau }
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'FT có dấu "-" (coDau) và đã qua Chủ nhật phải hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ratio', kn: [skillDiem(false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Lớp thường không có khái niệm dấu "-" chốt vắng — coDau không tính, không hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-27',
      }) === false,
      'Đúng Chủ nhật của tuần cuối thì CHƯA hoàn tất (phải QUA Chủ nhật)',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === true,
      'Thứ Hai sau Chủ nhật thì hoàn tất',
    );
    assert(
      d.dotDaHoanTat({
        cheDo: 'ielts_band', kn: [skillDiem(false, false, true)], chuNhatCuoi: '2026-09-27', homNay: '2026-09-28',
      }) === false,
      'Kỹ năng bắt buộc duy nhất đã huỷ phần thi → không còn kỹ năng bắt buộc nào → không bao giờ hoàn tất',
    );
  });

  check('PR-Rc2 · trangThaiNhom đủ 5 trạng thái', () => {
    const kn = (batBuoc: boolean, tuan: string | null, xong: boolean, daDoi: boolean) => (
      { batBuoc, tuan, xong, daDoi }
    );
    assert(d.trangThaiNhom([kn(false, null, false, false)]) === 'khong-yeu-cau', 'Không kỹ năng bắt buộc');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', true, false)]) === 'xong', 'Mọi kỹ năng bắt buộc đã xong');
    assert(d.trangThaiNhom([kn(true, null, false, false)]) === 'chua-xep', 'Còn kỹ năng bắt buộc chưa có tuần');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, true)]) === 'da-doi', 'Có kỹ năng đã dời vì vắng');
    assert(d.trangThaiNhom([kn(true, '2026-09-21', false, false)]) === 'da-xep', 'Đã xếp tuần, chưa xong, không dời');
  });

  check('PR-Rc2 · Q6 tuanDaSo — hoà chọn tuần sớm hơn', () => {
    const r = d.tuanDaSo(['2026-10-05', '2026-10-05', '2026-09-28', '2026-09-28']);
    assert(r.tuan === '2026-09-28', `Hoà 2-2 phải chọn tuần sớm hơn, ra "${r.tuan}"`);
    assert(r.khac.length === 1 && r.khac[0].tuan === '2026-10-05' && r.khac[0].n === 2, 'Tuần còn lại kèm đúng số em');
    const doc = d.tuanDaSo(['2026-09-21', '2026-09-21', '2026-09-21', '2026-09-28']);
    assert(doc.tuan === '2026-09-21' && doc.khac.length === 1 && doc.khac[0].n === 1, 'Không hoà thì chọn đa số thật');
    assert(d.tuanDaSo([null, null]).tuan === null, 'Toàn null thì không có tuần đa số');
  });

  check('PR-Rc2 · Q10 tieuDeKeHoach', () => {
    assert(d.tieuDeKeHoach(true, false) === 'Kế hoạch Mock Test', 'Chỉ có lớp FT');
    assert(d.tieuDeKeHoach(true, true) === 'Kế hoạch Test', 'Có cả lớp thường');
    assert(d.tieuDeKeHoach(false, true) === 'Kế hoạch Test', 'Chỉ có lớp thường');
  });

  check('PR-Rc2 · Q15 laVaoMuon — quá 14 ngày kể từ khai giảng', () => {
    assert(d.laVaoMuon('2026-09-25', '2026-09-10') === true, 'Muộn 15 ngày phải tính là vào muộn');
    assert(d.laVaoMuon('2026-09-24', '2026-09-10') === false, 'Đúng 14 ngày thì chưa tính là vào muộn');
    assert(d.laVaoMuon(null, '2026-09-10') === false, 'Thiếu ngày vào lớp thì không suy diễn');
  });

  check('PR-Rc2 · tomTatXemTruoc — gộp câu tạo/đổi/lỗi, không tự đọc ngày', () => {
    const tuanLich = (dt: string | null) => (dt === '2026-10-19' ? 'W3 OCT' : dt === '2026-10-26' ? 'W4 OCT' : dt === '2026-09-21' ? 'W1 SEP' : dt === '2026-09-28' ? 'W2 SEP' : '');
    const dong: any[] = [
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'tao', den: { rlw: '2026-10-19', s: '2026-10-26' } },
      { hanhDong: 'doi', tu: { rlw: '2026-09-21' }, den: { rlw: '2026-09-28' } },
      { hanhDong: 'giu' },
      { hanhDong: 'loi' },
    ];
    const cau = d.tomTatXemTruoc(dong, tuanLich);
    assert(cau.some((c: string) => c === '2 em chưa có → W3/W4 OCT'), `Thiếu câu "tạo" gộp đúng tháng, ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em W1 SEP → W2 SEP (đổi)'), `Thiếu câu "đổi", ra ${JSON.stringify(cau)}`);
    assert(cau.some((c: string) => c === '1 em không xếp được'), `Thiếu câu "lỗi", ra ${JSON.stringify(cau)}`);
    assert(cau.length === 3, `Dòng "giu" không sinh câu nào, tổng phải đúng 3, ra ${cau.length}`);
  });
}
