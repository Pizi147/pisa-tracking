/**
 * PHÉP KIỂM PR-OV11a — vắng · thi bù · hộp nhập điểm (đặc tả rà soát 14/10 mục 2–3, Q1–Q2):
 *   (1) TE-1 bài thi bù (dời vì vắng) không làm đợt "hoàn tất" — GV đúng kỹ năng nhập được sau tuần thi bù;
 *   (2) TE-2/TE-3 tuần thi bù: ô mang tuần gốc (`tuTuan`) để hộp mở như ô thường; "-" lần 2 → huỷ phần thi (`lan` = 2); Khôi phục xoá "-";
 *   (3) TE-5 "Vắng" (⋯ Kế hoạch Test) sau tuần thi = Không dự thi (không dời, không tính lần vắng), trong tuần dời như cũ;
 *   (4) TE-6 lớp thường "-": tuần này / tuần trước → tuần sau của tuần hiện tại; ≥ 2 tuần trước → Không dự thi, không còn là việc;
 *   (5) hàm thuần: chữ nút / thông báo vắng, luật "-" lớp thường, chip Ô MT "không dự thi".
 * Mỗi ca cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11aTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const hoanTat: any = await import('../fasttrack/hoanTat.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV11a · vắng · thi bù · hộp nhập điểm');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const QL = P.mbManager, gvL = P.lrTeacher;
  /* W1 NOV (02–08/11) thi; "-" thứ Tư 04/11 → dời W2 NOV (09–15/11); thứ Tư 11/11 trong tuần thi bù; thứ Hai 16/11 sau tuần thi bù. */
  const WS = '2026-11-02', WS1 = '2026-11-09', TRONG = '2026-11-04', SAU_W = '2026-11-10', BU = '2026-11-11', SAU_BU = '2026-11-16';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number, W2 = week.ensurePeriod('2026-11-16').id as number;

  const luot = all(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 2`, lop).map((r) => r.id as number);

  /** Lượt sạch ở tuần `W`: chưa điểm, chưa vắng; lượt khác của lớp rời W / W1 / W2. */
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(aid);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(W, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, W2, ...luot);
    xoaNho();
  };
  /** R, W1, W2, S có band ở tuần W — chỉ còn L. */
  const duBaKyNang = (aid: number) => {
    for (const s of ['reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,6,?)').run(aid, s, s === 'reading' ? 23 : null);
    }
    xoaNho();
  };
  const o = (aid: number, s: string, p: any, pid: number, today: string) =>
    (attempts.classScoreSheet(p, lop, pid, today) as any).rows.find((r: any) => r.attemptId === aid)?.cells.find((c: any) => c.skill === s);
  const ky = (aid: number, s: string) => one('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', aid, s);
  const diem = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);

  check('OV11a-0 · tiền đề: đủ 2 lượt MT cuối sạch ở MB FT 101', () => {
    assert(luot.length === 2, `cần 2 lượt, có ${luot.length}`);
  });

  check('OV11a-1 · TE-1: vắng lần 1 → dời; sau tuần thi bù đợt KHÔNG hoàn tất, GV Listening nhập được (không 403)', () => thu(() => {
    const a = luot[0];
    dung(a);
    duBaKyNang(a);
    attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    assert(ky(a, 'listening').planned_period_id === W1, 'tiền đề: Listening đã dời sang W2 NOV');
    const ht = hoanTat.dotHoanTat(a, SAU_BU);
    assert(ht.hoanTat === false, `bài thi bù chưa điểm mà đợt đã "hoàn tất": ${JSON.stringify(ht)}`);
    const e = loi(() => attempts.saveScore(gvL, a, 'listening', { rawScore: 30 }, SAU_BU));
    assert(!e, `GV Listening nhập điểm bài thi bù: ${e?.status} ${e?.message}`);
    assert(diem(a, 'listening').raw_score === 30, 'điểm chưa vào');
  }));

  check('OV11a-2 · TE-2/TE-3: ô tuần thi bù mang tuần gốc; "-" lần 2 → huỷ phần thi, ô ghi vắng 2 lần; Khôi phục xoá "-"', () => thu(() => {
    const a = luot[1];
    dung(a);
    const r1 = attempts.saveScore(gvL, a, 'listening', { noShow: true }, TRONG);
    assert(r1.vang?.kq === 'doi' && r1.vang.tuanMoi === 'W2 NOV', `lần 1 phải trả kết quả dời: ${JSON.stringify(r1.vang)}`);
    const c = o(a, 'listening', gvL, W1, BU);
    assert(c?.weekStart === WS1 && c.daChot?.doiSang === 'W2 NOV' && c.daChot.tuTuan === 'W1 NOV' && c.daChot.lan === 1 && c.daChot.goDuoc === true,
      `ô tuần thi bù: ${JSON.stringify({ weekStart: c?.weekStart, daChot: c?.daChot })}`);
    assert(c.canEdit === true, 'ô tuần thi bù phải nhập được');
    const r2 = attempts.saveScore(gvL, a, 'listening', { noShow: true }, BU);
    assert(r2.vang?.kq === 'huy', `lần 2 phải trả huỷ: ${JSON.stringify(r2.vang)}`);
    assert(ky(a, 'listening').sit_status === 'cancelled', `lần 2 phải huỷ phần thi: ${ky(a, 'listening').sit_status}`);
    const c2 = o(a, 'listening', QL, W1, BU);
    assert(c2?.progress === 'cancelled' && c2.daChot?.lan === 2, `ô huỷ phải ghi vắng 2 lần: ${JSON.stringify(c2?.daChot)}`);
    absence.restoreCancelledSkill(QL, a, 'listening', W2);
    assert(diem(a, 'listening')?.no_show_period_id == null, `Khôi phục còn "-": ${JSON.stringify(diem(a, 'listening'))}`);
    const c3 = o(a, 'listening', QL, W2, SAU_BU);
    assert(c3 && !c3.daChot && !c3.noShow, `ô sau Khôi phục: ${JSON.stringify({ daChot: c3?.daChot, noShow: c3?.noShow })}`);
  }));

  /* LUAT-34 (luật 4 sửa 21/10) thay TE-5: "Vắng" ghi muộn ở MT hiện tại chốt như "-" — tuần kế của lịch còn thi được → dời, đếm 1. */
  check('OV11a-3 → LUAT-34 · "Vắng" (⋯) sau tuần thi (tuần kế còn chạy) = dời tuần kế, đếm 1; trong tuần dời như cũ', () => thu(() => {
    const a = luot[0];
    dung(a);
    const r = absence.baoVang(QL, a, 'listening', null, SAU_W);
    const s = diem(a, 'listening'), k = ky(a, 'listening');
    assert(r.daDoi === true && !r.khongDuThi && !r.huyCu, `kết quả: ${JSON.stringify(r)}`);
    assert(s?.no_show_cu === 0, `không còn Không dự thi: ${JSON.stringify(s)}`);
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `dời tuần kế: ${JSON.stringify(k)}`);
    dung(a);
    const r2 = absence.baoVang(QL, a, 'listening', null, TRONG);
    assert(r2.daDoi === true && ky(a, 'listening').planned_period_id === W1 && ky(a, 'listening').absence_move_count === 1,
      `trong tuần phải dời: ${JSON.stringify(r2)}`);
  }));

  /* ---------------------------------------------------------------- (4) lớp thường "-" (Q1, chủ SP 14/10) */
  const LOP_THUONG = classId('MB FOU 12');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  let dem = 0;
  /** Bài Giữa khoá MB FOU 12 ở tuần `n` (so với tuần này), đủ bốn môn — em mới, không đợt khác (T15 không chặn). */
  const baiThuong = (n: number) => {
    const tag = `OV11A-T${++dem}`;
    const branch = one('SELECT branch_id AS b FROM classes WHERE id = ?', LOP_THUONG).b;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP_THUONG, t.addDays(tuanNay, -42), now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`)
      .run(sid, t.addDays(tuanNay, -42), now).lastInsertRowid);
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'progress',?,?, 'planned', ?)`)
      .run(cy, sid, LOP_THUONG, tuan(n).id, now).lastInsertRowid);
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(tuan(n).id, aid);
    xoaNho();
    return aid;
  };
  const conViec = (aid: number) => {
    xoaNho();
    const r = (attempts.listAttempts(QL, { classId: LOP_THUONG, scope: 'managed' }) as any).rows.find((x: any) => x.id === aid);
    return r?.pendingSkills ?? [];
  };

  check('OV11a-4 · TE-6 lớp thường "-": tuần này / tuần trước → dời tuần sau của tuần hiện tại; ≥ 2 tuần trước → Không dự thi, hết việc; gỡ được', () => thu(() => {
    for (const n of [0, -1]) {
      const aid = baiThuong(n);
      const r = regular.reportRegularNoShow(QL, aid, 'listening', true, TODAY);
      assert(r.moved === true && ky(aid, 'listening').planned_period_id === tuan(1).id,
        `tuần ${n}: phải dời sang tuần sau của tuần hiện tại: ${JSON.stringify({ r: { ...r, result: undefined }, k: ky(aid, 'listening').planned_period_id, mong: tuan(1).id })}`);
    }
    const aid = baiThuong(-2);
    assert(conViec(aid).includes('listening'), 'tiền đề: môn nợ trước khi ghi "-"');
    const r = regular.reportRegularNoShow(QL, aid, 'listening', true, TODAY);
    const s = diem(aid, 'listening');
    assert(r.moved === false && r.khongDuThi === true, `phải Không dự thi: ${JSON.stringify({ ...r, result: undefined })}`);
    assert(ky(aid, 'listening').planned_period_id === tuan(-2).id && s?.no_show_cu === 1 && s.no_show_period_id === tuan(-2).id,
      `không dời, ô Không dự thi: ${JSON.stringify({ k: ky(aid, 'listening').planned_period_id, s })}`);
    assert(!conViec(aid).includes('listening'), `Không dự thi vẫn là việc: ${JSON.stringify(conViec(aid))}`);
    const o2 = (regular.regularSheet(QL, LOP_THUONG, 'progress', TODAY) as any).rows.find((x: any) => x.attemptId === aid)
      ?.skillSchedule.find((x: any) => x.skill === 'listening');
    assert(o2?.khongDuThi === true && o2.overdue === false, `ô lưới: ${JSON.stringify(o2)}`);
    /* Rà OV-11a (1): Kế hoạch Test lớp thường cùng luật — môn mang cờ Không dự thi, tính là xong. */
    xoaNho();
    const kh = (keHoach.luoiThuong(QL, LOP_THUONG) as any).hang.flatMap((h: any) => Object.values(h.dot)).find((x: any) => x.attemptId === aid)?.kn.listening;
    assert(kh?.khongDuThi === true && kh.trangThai === 'xong', `Kế hoạch Test lớp thường: ${JSON.stringify(kh)}`);
    /* Rà OV-11a (2): gỡ Không dự thi không dời gì → moved false (web không ghi "về W…"). */
    const g = regular.reportRegularNoShow(QL, aid, 'listening', false, TODAY);
    assert(g.moved === false && ky(aid, 'listening').planned_period_id === tuan(-2).id, `gỡ: ${JSON.stringify({ ...g, result: undefined })}`);
    const s2 = diem(aid, 'listening');
    assert(s2.no_show_period_id === null && s2.no_show_cu === 0 && conViec(aid).includes('listening'), `gỡ: ${JSON.stringify(s2)}`);
  }));

  check('OV11a-5 · hàm thuần: nút Vắng / Không dự thi, câu thông báo, luật "-" lớp thường, chip Ô MT không dự thi', () => {
    /* LUAT-34: nút luôn "Vắng" — `chuNutVang` bỏ; MT cũ "-" nói "Đã huỷ · vắng MT cũ". */
    assert(d.chuNutVang === undefined, 'chuNutVang đã bỏ');
    const ten = 'Kiều Thu Trang';
    assert(d.cauDaGhiVang('R', ten, { kq: 'huy-cu' }) === 'Đã huỷ · vắng MT cũ · R · Kiều Thu Trang', 'MT cũ');
    assert(d.cauDaGhiVang('R', ten, { kq: 'doi', tuanMoi: 'W4 SEP' }) === 'Đã ghi vắng R · Kiều Thu Trang · dời W4 SEP', d.cauDaGhiVang('R', ten, { kq: 'doi', tuanMoi: 'W4 SEP' }));
    assert(d.cauDaGhiVang('R', ten, { kq: 'huy' }) === 'Đã ghi vắng R · Kiều Thu Trang · huỷ phần thi', 'lần 2');
    assert(d.cauDaGhiVang('R', ten, { kq: 'khong-du-thi' }) === 'Đã ghi Không dự thi · R · Kiều Thu Trang', 'sau tuần');
    assert(d.luatVangThuong('2026-09-14', TODAY).tuanMoi === '2026-09-21' && d.luatVangThuong('2026-09-07', TODAY).tuanMoi === '2026-09-21',
      'tuần này / tuần trước → tuần sau của tuần hiện tại');
    assert(d.luatVangThuong('2026-08-31', TODAY).khongDuThi === true, '≥ 2 tuần → Không dự thi');
    const kn = (o2: any) => ({ trangThai: 'co-lich', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', ...o2 });
    const nhom = d.nhomKyNang({ listening: kn({ trangThai: 'xong' }), reading: kn({ khongDuThi: true }) }, TODAY);
    assert(nhom.some((g: any) => g.kyNang.includes('reading') && g.viec === 'không dự thi'), `chip R không dự thi: ${JSON.stringify(nhom)}`);
    assert(d.chipDongKyNang(kn({ khongDuThi: true }), TODAY)?.chu === 'Không dự thi', 'dòng R hộp một đợt');
    const gc = d.gomChip({ listening: kn({ trangThai: 'xong', khongDuThi: true }), reading: kn({ trangThai: 'xong' }) });
    assert(!gc.xong && gc.chip.some((c: any) => c.khongDuThi && c.kyNang.join() === 'listening'), `lớp thường: môn Không dự thi hiện riêng: ${JSON.stringify(gc)}`);
  });
}
