/**
 * PHÉP KIỂM PR-MTa — luật Test / Mock Test ở máy chủ (đặc tả 2026-10-05: T1, T2, T3, T4, T7, T10, T11; chốt 06/10: T19–T23).
 * Mỗi cổng ghi của đặc tả mục 3 có ít nhất một phép kiểm (bảng Task 11 của kế hoạch).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrMtaTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const regular: any = await import('../normal/regular.ts');
  const ketQuaHuy: any = await import('../fasttrack/ketQuaHuy.ts');
  const standing: any = await import('../students/standing.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const db: any = await import('../db.ts');
  const hoanTatSvc: any = await import('../fasttrack/hoanTat.ts');
  const perm: any = await import('../permissions.ts');
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const bonKyNang = (n: number) => KN.map((skill) => ({ skill, periodId: tuan(n).id }));

  let dem = 0;
  /** Em mới ở MB FT 101: MT1, MT2, MT3 ở tuần `w` (mặc định T+1, T+4, T+8), chưa điểm, lịch Quản lý chốt. */
  const emMoi = (w: [number, number, number] = [1, 4, 8]) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRMTA Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
    w.forEach((n, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', lich_su = 0 WHERE id = ?`).run(tuan(n).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(n).id, ds[i].id);
    });
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number, cycleId: luot(ds[0].id).cycle_id as number };
  };
  const luot = (attemptId: number) => conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  const kyNang = (attemptId: number, skill: string) => conn.prepare(
    `SELECT k.*, p.week_start FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`).get(attemptId, skill) as any;
  const diem = (attemptId: number, skill: string, band = 6, raw: number | null = 30) => conn.prepare(
    `INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, nhap_dau_ngay) VALUES (?,?,?,?,?)`).run(attemptId, skill, band, raw, TODAY);
  const soDiem = (attemptId: number) => (conn.prepare(
    `SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL)`).get(attemptId) as any).n as number;
  /** Bắt lỗi HTTP: trả lỗi đã ném (status, message, details). */
  const loiCua = (fn: () => unknown): any => {
    try { fn(); } catch (e) { return e; }
    assert(false, 'mong có lỗi mà không có');
  };
  /** Bài lớp thường (MB FOU 12) ở tuần `n`, đủ bốn môn — mẫu `taoBaiThuong` của chamDiem.tests.ts. */
  const LOP_THUONG = classId('MB FOU 12');
  const baiThuong = (n: number) => {
    const tag = `PRMTA-T${++dem}`;
    const branch = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP_THUONG) as any).b;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP_THUONG, t.addDays(tuanNay, -42), now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`)
      .run(sid, t.addDays(tuanNay, -42), now).lastInsertRowid);
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'progress',?,?, 'planned', ?)`)
      .run(cy, sid, LOP_THUONG, tuan(n).id, now).lastInsertRowid);
    skillSch.ensureSkillRows(aid);
    return { sid, aid };
  };

  // ------------------------------------------------------------------ T7 — lý do theo thao tác
  console.log('\nPR-MTa · T7 lý do chỉ bắt buộc khi mất kết quả / từ chối');

  /* Rà #212 (chủ sản phẩm 06/10) thay "Huỷ điểm bắt lý do": còn 3 thao tác bắt buộc. */
  /* PR-MTGON (rà #282): Huỷ MT{n} lý do tuỳ chọn — còn 2 thao tác bắt buộc. */
  check('MTa T7 (L1) · chỉ 2 thao tác bắt buộc lý do (huỷ kết quả, từ chối), không tối thiểu ký tự', () => {
    for (const x of ['huy-ket-qua', 'tu-choi'] as const) {
      assert(d.canLyDo(x) && d.kiemLyDoThaoTac(x, '  ') === `${d.CHU_LY_DO[x]}: cần ghi lý do.`, x);
      assert(d.kiemLyDoThaoTac(x, 'x') === null, `${x}: 1 ký tự phải hợp lệ`);
    }
    for (const x of ['huy-luot', 'huy-diem', 'doi-lich', 'doi-han', 'bo-ky-nang', 'bao-vang', 'thi-lai', 'sua-diem', 'huy-lich', 'khong-mock-lai'] as const) {
      assert(!d.canLyDo(x) && d.kiemLyDoThaoTac(x, '') === null, x);
    }
    assert(!('LY_DO_TOI_THIEU' in d) && !('kiemLyDo' in d), 'còn hằng/hàm cũ');
  });

  check('MTa T7 (L2) · dời kỹ năng mà tuần thi đã bắt đầu, không lý do → lưu, nhật ký reason NULL', () => {
    const a = emMoi([0, 4, 8]);
    skillSch.setSkillWeek(QL, a.m1, 'listening', tuan(2).id, {});
    assert(kyNang(a.m1, 'listening').planned_period_id === tuan(2).id, 'chưa dời');
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_week_set' ORDER BY id DESC`).get(a.m1) as any;
    assert(h && h.reason === null, JSON.stringify(h));
  });

  check('MTa T7 (L3) · dời hạn chấm (kỹ năng / cả đợt), bỏ kỹ năng, báo vắng — không lý do đều lưu', () => {
    const a = emMoi([0, 4, 8]);
    skillSch.setSkillDeadline(QL, a.m1, 'reading', t.addDays(TODAY, 20), null);
    assert(kyNang(a.m1, 'reading').deadline_override === t.addDays(TODAY, 20), 'hạn kỹ năng');
    attemptsSvc.setDeadlineOverride(QL, a.m1, t.addDays(TODAY, 21));
    assert(luot(a.m1).deadline_override === t.addDays(TODAY, 21), 'hạn cả đợt');
    attemptsSvc.setSkillSkip(QL, a.m2, 'speaking', true);
    assert(kyNang(a.m2, 'speaking').required === 0, 'bỏ kỹ năng');
    absence.baoVang(P.coreTeacher, a.m1, 'speaking', '');
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' ORDER BY id DESC`).get(a.m1) as any;
    assert(h && /^Báo vắng \(tuần/.test(h.reason), JSON.stringify(h));
  });

  /* T22 (06/10) đè T7: xoá trắng ô đã có điểm = xoá, lý do tuỳ chọn. */
  check('MTa T7 + T22 (L4) · saveScore: đổi band không lý do → lưu; xoá trắng không lý do → lưu', () => {
    const a = emMoi([0, 4, 8]);
    attemptsSvc.saveScore(P.w1Teacher, a.m1, 'writing1', { criteria: [6, 6, 6, 6] });
    attemptsSvc.saveScore(P.w1Teacher, a.m1, 'writing1', { criteria: [7, 7, 7, 7] });
    const s = conn.prepare(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`).get(a.m1) as any;
    assert(s.band === 7, JSON.stringify(s));
    attemptsSvc.saveScore(P.w1Teacher, a.m1, 'writing1', { criteria: [null, null, null, null] });
    assert(soDiem(a.m1) === 0, 'chưa xoá');
  });

  check('MTa T7 + T22 (L5) · saveRegularScore: đổi 7/10 → 8/10 không lý do → lưu; xoá không lý do → lưu', () => {
    const b = baiThuong(0);
    regular.saveRegularScore(P.admin, b.aid, 'speaking', { score: 7, total: 10 });
    const r = regular.saveRegularScore(P.admin, b.aid, 'speaking', { score: 8, total: 10 });
    assert((r.score as any).raw_score === 8, 'chưa đổi');
    regular.saveRegularScore(P.admin, b.aid, 'speaking', { score: null });
    assert(((conn.prepare(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).get(b.aid) as any)?.raw_score ?? null) === null, 'chưa xoá');
  });

  /* Rà #212 (chủ sản phẩm 06/10) thay "huyDiem lý do trắng → 400". */
  check('MTa T7 (L6) · huyDiem lý do trắng → huỷ được; huyLuot lý do trống → huỷ được (PR-MTGON, rà #282)', () => {
    const a = emMoi([0, 4, 8]);
    diem(a.m1, 'listening');
    keHoach.huyDiem(QL, { attemptId: a.m1, skill: 'listening', lyDo: '  ' });
    assert(soDiem(a.m1) === 0, 'chưa huỷ');
    attemptsSvc.huyLuot(QL, a.m3, { lyDo: '' });
    assert(luot(a.m3).status === 'cancelled', 'huỷ lượt');
  });

  check('MTa T7 (L7) · từ chối đề nghị dời với lý do 1 ký tự → được', () => {
    const a = emMoi([-3, 4, 8]);
    skillSch.setSitStatus(QL, a.m1, 'speaking', 'absent');
    const r = absence.requestAbsenceMove(P.coreTeacher, a.m1, ['speaking']);
    const req = r.outcomes[0].requestId;
    assert(req && r.outcomes[0].result === 'escalated', JSON.stringify(r.outcomes));
    assertThrows(() => absence.decideAbsenceMove(QL, req, { approve: false, note: ' ' }), /Từ chối: cần ghi lý do/, 'trống');
    absence.decideAbsenceMove(QL, req, { approve: false, note: 'x' });
    assert((conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(req) as any).status === 'declined', 'chưa từ chối');
  });

  check('MTa T7 (L8) · thi lại không lý do → lưu, nhật ký điểm "Thi lại"; xếp hàng loạt dời bài tuần đã bắt đầu không lý do → lưu', () => {
    const a = emMoi([0, 4, 8]);
    diem(a.m1, 'listening');
    keHoach.thiLai(QL, { attemptId: a.m1, skills: ['listening'], periodId: tuan(2).id });
    const au = conn.prepare(`SELECT after_json FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? AND action LIKE 'score.%' ORDER BY id DESC`).get(a.m1) as any;
    assert(au && /^Thi lại/.test(JSON.parse(au.after_json).lyDo ?? ''), au?.after_json);
    const b = emMoi([0, 4, 8]);
    const kq = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [b.sid], tuan: { listening: tuan(2).id, reading: tuan(2).id, writing: tuan(2).id, speaking: tuan(2).id } }, TODAY);
    assert(kq.daLuu === 1, JSON.stringify(kq.dong));
  });

  check('MTa T7 (G1) · Huỷ lịch (bo-tuan) không lý do → lưu, nhật ký "Huỷ lịch"', () => {
    const a = emMoi();
    skillSch.boTuanLuot(QL, a.m3, {});
    assert(luot(a.m3).planned_period_id === null, 'chưa bỏ tuần');
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_unscheduled' ORDER BY id DESC`).get(a.m3) as any;
    assert(h?.reason === 'Huỷ lịch', JSON.stringify(h));
  });

  check('MTa T7 (L9) · ngoài Test: bỏ tối thiểu ký tự (Đề xuất sửa 15, thẻ Chờ duyệt 3, chuyển lớp 3, Target 5)', () => {
    for (const [f, cam] of [
      ['server/src/duyet/deXuatSua.ts', /LY_DO_TOI_THIEU/], ['server/src/duyet/yeuCau.ts', /DO_DAI_LY_DO/],
      ['server/src/classes/lenhChuyen.ts', /why\.length < 3|lyDo\.length < NHAN_XET_TOI_THIEU/], ['server/src/routes/index.ts', /lyDoTuDo\.length < 3/],
      ['server/src/classes/suaCaLop.ts', /LY_DO_TOI_THIEU/], ['shared/domain/chuyenLop.ts', /LY_DO_LENH_TOI_THIEU/],
      ['web/src/modules/duyet/TheYeuCau.tsx', /TOI_THIEU/], ['web/src/modules/duyet/DeXuatSuaPanel.tsx', /LY_DO_TOI_THIEU/],
    ] as const) assert(!cam.test(nguon(f)), `${f} còn tối thiểu ký tự`);
    const yc: any = d;
    assert(yc.kiemDongLenh({ huong: 'chuyen_lop', lopDichId: 1, lopDichFt: false, nguonFt: false, tuan: t.addDays(tuanNay, 7), homNay: TODAY, lyDo: 'x', khacGoiY: false, mucTieu: null, ngayXemLai: null }) === null, 'lý do 1 ký tự');
  });

  // ------------------------------------------------------------------ T1 MT cũ theo tuần + T4 Quản lý xếp tuần đã qua
  console.log('\nPR-MTa · T1 MT cũ theo tuần, T4 Quản lý xếp tuần đã qua');
  /** Huỷ mọi lượt của em (không điểm) để xếp lại từ MT1 — đường "Xếp lịch MT" tạo lượt mới. */
  const emTrang = () => {
    const a = emMoi();
    for (const id of [a.m1, a.m2, a.m3]) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(id);
    return a;
  };
  const bon = (n: number) => ({ listening: tuan(n).id, reading: tuan(n).id, writing: tuan(n).id, speaking: tuan(n).id });

  check('MTa T1 (C1) · laMtCu: tuần trước là MT thường, cách ≥ 2 tuần là MT cũ', () => {
    assert(!d.laMtCu('2026-09-13', '2026-09-16'), 'tuần trước (kết thúc 13/09) phải là MT thường');
    assert(d.laMtCu('2026-09-06', '2026-09-16'), 'kết thúc 06/09 phải là MT cũ');
    assert(!d.laMtCu('2026-09-20', '2026-09-16'), 'tuần này');
  });

  check('MTa T4 (C2) · kiemTuanXep: QL được tuần đã qua, GV không; không còn điều kiện ngày vào web', () => {
    const qua = d.kiemTuanXep({ ketThuc: ['2026-09-06'], homNay: '2026-09-16', quanLy: true });
    assert(qua.cau === null && qua.quaTuan && qua.mtCu, JSON.stringify(qua));
    const tron = d.kiemTuanXep({ ketThuc: ['2026-09-13', '2026-09-27'], homNay: '2026-09-16', quanLy: true });
    assert(tron.cau === null && tron.quaTuan && !tron.mtCu, JSON.stringify(tron));
    assert(d.kiemTuanXep({ ketThuc: ['2026-09-13'], homNay: '2026-09-16', quanLy: false }).cau === 'Chọn tuần từ tuần này trở đi.', 'GV');
    assert(!('kiemTuanDaQua' in d), 'còn hàm cũ');
  });

  check('MTa T1 (C3) · Xếp lịch MT (xepMoi): em vào web hôm nay, MT ở tuần trước → MT thường có hạn chấm; 3 tuần trước → MT cũ', () => {
    const a = emTrang();
    const mt = keHoach.xepMoi(QL, { studentId: a.sid, tuan: bon(-1) });
    assert(luot(mt.id).lich_su === 0, 'tuần trước phải là MT thường');
    const kn = attemptsSvc.attemptDetail(QL, mt.id).skillSchedule.find((x: any) => x.skill === 'listening');
    assert(kn.deadline, `MT thường phải có hạn: ${JSON.stringify(kn)}`);
    const b = emTrang();
    const mt2 = keHoach.xepMoi(QL, { studentId: b.sid, tuan: bon(-3) });
    assert(luot(mt2.id).lich_su === 1, 'tuần −3 phải là MT cũ');
  });

  check('MTa T4 (C4) · hộp kỹ năng (luuDot) và Dời cả đợt: QL dời MT1 chưa thi sang 3 tuần trước → MT cũ; dời lại tuần tới → MT thường', () => {
    const a = emMoi();
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(-3) });
    assert(luot(a.m1).lich_su === 1 && kyNang(a.m1, 'listening').planned_period_id === tuan(-3).id, 'luuDot → MT cũ');
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(2) });
    assert(luot(a.m1).lich_su === 0, 'luuDot tuần tới → MT thường');
    attemptsSvc.setPlanningWeek(QL, a.m1, tuan(-3).id);
    assert(luot(a.m1).lich_su === 1, 'setPlanningWeek → MT cũ');
    attemptsSvc.setPlanningWeek(QL, a.m1, tuan(-1).id);
    assert(luot(a.m1).lich_su === 0, 'tuần trước → MT thường');
  });

  check('MTa T4 (C5) · Test lớp thường về tuần đã qua: Quản lý được (chốt 05/10), GVCN vẫn 400', () => {
    const b = baiThuong(2);
    skillSch.setSkillWeek(QL, b.aid, 'speaking', tuan(-1).id, {});
    assert(kyNang(b.aid, 'speaking').planned_period_id === tuan(-1).id, 'QL chưa dời được');
    assertThrows(() => skillSch.setSkillWeek(P.normalCoreTeacher, b.aid, 'listening', tuan(-1).id, {}), /Chọn tuần từ tuần này trở đi/, 'GVCN');
  });

  check('MTa T1 (C6) · Xếp hàng loạt FT: tạo MT ở tuần trước → lichSu false; 3 tuần trước → lichSu true', () => {
    const a = emTrang();
    const r1 = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [a.sid], tuan: bon(-1), xemTruoc: true }, TODAY);
    assert(r1.dong[0].hanhDong === 'tao' && r1.dong[0].lichSu === false, JSON.stringify(r1.dong[0]));
    const r3 = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [a.sid], tuan: bon(-3), xemTruoc: true }, TODAY);
    assert(r3.dong[0].hanhDong === 'tao' && r3.dong[0].lichSu === true && /· MT cũ$/.test(d.chuSeXep(r3.dong[0], null)), JSON.stringify(r3.dong[0]));
  });

  check('MTa T1 (C7) · Thêm HV: học từ 6 tuần trước → MT1 (tuần trước) là MT thường; từ 13 tuần trước → MT1, MT2 là MT cũ', () => {
    const them = (lui: number) => {
      const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRMTA Lùi ${++dem}`, target: 6.5, startWeek: t.addDays(tuanNay, -7 * lui), email: 'hv@demo.test' }] });
      return conn.prepare(`SELECT attempt_no, lich_su FROM assessment_attempts WHERE student_id = ? ORDER BY attempt_no`).all(r.studentIds[0]) as any[];
    };
    const a = them(6);
    assert(a[0].lich_su === 0, JSON.stringify(a));
    const b = them(13);
    assert(b[0].lich_su === 1 && b[1].lich_su === 1 && b[2].lich_su === 0, JSON.stringify(b));
  });

  check('MTa T1 (C8) · MT cũ có điểm đổi sang tuần đã qua khác, không lý do, em vào web từ trước → lưu, điểm giữ', () => {
    const a = emTrang();
    conn.prepare('UPDATE students SET created_at = ? WHERE id = ?').run(`${t.addDays(tuanNay, -70)}T08:00:00.000Z`, a.sid);
    const mt = keHoach.xepMoi(QL, { studentId: a.sid, tuan: bon(-3) });
    diem(mt.id, 'listening');
    skillSch.setSkillWeek(QL, mt.id, 'listening', tuan(-4).id, {});
    assert(kyNang(mt.id, 'listening').planned_period_id === tuan(-4).id && soDiem(mt.id) === 1 && luot(mt.id).lich_su === 1, 'chưa đổi / mất điểm');
  });

  // ------------------------------------------------------------------ Migrate
  await t.checkAsync('MTa (M1) · migratePrMta chạy lặp được; có cột huy_vang và bảng ket_qua_huy', async () => {
    const m: any = await import('../migrate/prMta.ts');
    const ap: string[] = [];
    m.migratePrMta(conn, ap); m.migratePrMta(conn, ap);
    assert(ap.length === 0, `DB test đã có cấu trúc — không được thêm lần nữa: ${ap}`);
    assert((conn.prepare("SELECT name FROM pragma_table_info('attempt_skills')").all() as any[]).some((x) => x.name === 'huy_vang'), 'thiếu cột');
    assert(!!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'ket_qua_huy'").get(), 'thiếu bảng');
  });

  // ------------------------------------------------------------------ T2 khôi phục kết quả đã huỷ (dữ liệu cũ)
  /* PR-MTGON (luật 1, 08/10) thay T2: dời vượt nay bị CHẶN, không sinh `ket_qua_huy` mới (MTG-1b). V1–V5, V7–V10 (kiểm luồng huỷ kết quả
   * khi dời vượt) bỏ; Khôi phục kết quả giữ cho dữ liệu cũ — `huyCu` dựng đúng trạng thái mà luồng T2 cũ để lại. */
  console.log('\nPR-MTa · T2 Khôi phục kết quả đã huỷ (dữ liệu cũ trước PR-MTGON)');
  const soKqHuy = (attemptId: number) => (conn.prepare('SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ?').get(attemptId) as any).n as number;
  const audit: any = await import('../platform/audit.ts');

  /** Em có MT2 đã chấm L, R (L kèm GV chấm + ngày nhập đầu). */
  const emCoDiemMt2 = () => {
    const a = emMoi();
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, comment, examiner_name, nhap_dau_ngay) VALUES (?, 'listening', 6, 30, 'Tốt', 'Cô Lan', ?)`)
      .run(a.m2, t.addDays(TODAY, -2));
    diem(a.m2, 'reading', 5.5, 25);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'sat' WHERE attempt_id = ? AND skill IN ('listening', 'reading')`).run(a.m2);
    return a;
  };
  /** Dữ liệu cũ: MT1 đã dời sang T+`w` vượt MT2, MT3; điểm MT2 chuyển sang `ket_qua_huy` (như `huyKetQuaLuot` trước PR-MTGON). */
  const huyCu = (a: any, w = 9) => db.tx(() => {
    const ds = (conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? ORDER BY id').all(a.m2) as any[])
      .filter((x) => x.band != null || x.raw_score != null);
    const lich = conn.prepare('SELECT skill, planned_period_id, sit_status, plan_source FROM attempt_skills WHERE attempt_id = ? AND required = 1').all(a.m2);
    const soKn = new Set(ds.map((x) => String(x.skill).replace(/^writing[12]$/, 'writing'))).size;
    if (ds.length) {
      conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc) VALUES (?,?,?,?,?,?,?,?)`)
        .run(a.m2, a.m1, JSON.stringify(ds), JSON.stringify(lich), soKn, 'x', QL.userId, `${TODAY}T08:00:00.000Z`);
      conn.prepare(`DELETE FROM assessment_scores WHERE id IN (${ds.map(() => '?').join(',')})`).run(...ds.map((x) => x.id));
      for (const x of ds) {
        audit.writeAudit({ actorUserId: QL.userId, action: 'score.huy_vuot', entityType: 'assessment_attempt', entityId: a.m2, entityLabel: x.skill,
          before: x, after: { lyDo: 'x', vuotBoi: a.m1 } });
      }
    }
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL, sit_status = 'scheduled', plan_source = 'manual' WHERE attempt_id IN (?, ?) AND required = 1`).run(a.m2, a.m3);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL WHERE id IN (?, ?)`).run(a.m2, a.m3);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?`).run(tuan(w).id, a.m1);
  });

  const vuotV3 = emCoDiemMt2();
  huyCu(vuotV3);
  check('MTa T2 (V6) · màn chỉ đọc không còn điểm MT2: Điểm theo lớp, standing', () => {
    const a = vuotV3;
    const bang = attemptsSvc.classScoreSheet(QL, LOP, { theo: 'luot', attemptNo: 2 });
    const hang = (bang.rows ?? bang.hang ?? []).find((x: any) => (x.studentId ?? x.student?.id) === a.sid);
    assert(!JSON.stringify(hang ?? {}).includes('"band":6'), JSON.stringify(hang));
    const st = standing.standingFor([a.sid]).get(a.sid);
    assert(!JSON.stringify(st ?? {}).includes('"attemptNo":2,"overall"'), 'standing còn MT2');
  });

  check('MTa T2 (R1) · khôi phục sau khi dời MT1 về trước: điểm, tuần, trạng thái thi trở lại; lần hai 400; ô có điểm mới → chặn', () => {
    const a = vuotV3;
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(1) });
    ketQuaHuy.khoiPhucKetQua(QL, a.m2);
    const l = conn.prepare(`SELECT band, raw_score, comment FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.m2) as any;
    assert(l?.band === 6 && l.raw_score === 30 && l.comment === 'Tốt', JSON.stringify(l));
    assert(kyNang(a.m2, 'listening').planned_period_id === tuan(4).id && kyNang(a.m2, 'listening').sit_status === 'sat', JSON.stringify(kyNang(a.m2, 'listening')));
    assert((conn.prepare('SELECT khoi_phuc_luc FROM ket_qua_huy WHERE attempt_id = ?').get(a.m2) as any).khoi_phuc_luc, 'chưa đánh dấu khôi phục');
    assertThrows(() => ketQuaHuy.khoiPhucKetQua(QL, a.m2), /không có kết quả đã huỷ/, 'lần hai');
    const b = emCoDiemMt2();
    huyCu(b);
    keHoach.luuDot(QL, { attemptId: b.m1, kyNang: bonKyNang(1) });
    keHoach.luuDot(QL, { attemptId: b.m2, kyNang: bonKyNang(4) });
    diem(b.m2, 'listening', 7, 33);
    assertThrows(() => ketQuaHuy.khoiPhucKetQua(QL, b.m2), /MT2 đã có điểm mới — không khôi phục được/, 'điểm mới');
    assert((conn.prepare(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(b.m2) as any).band === 7, 'điểm mới bị đè');
  });

  check('MTa T2 (R2) · Writing: W1 điểm + nhận xét + ngày nhập đầu → khôi phục trả đủ', () => {
    const a = emMoi();
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, comment, nhap_dau_ngay) VALUES (?, 'writing1', 6, 6, 6, 6, 6, 'Ý rõ', ?)`).run(a.m2, t.addDays(TODAY, -3));
    huyCu(a, 5);
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(1) });
    ketQuaHuy.khoiPhucKetQua(QL, a.m2, { lyDo: 'Nhầm' });
    const w = conn.prepare(`SELECT c1, band, comment, nhap_dau_ngay FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing1'`).get(a.m2) as any;
    assert(w?.c1 === 6 && w.band === 6 && w.comment === 'Ý rõ' && w.nhap_dau_ngay === t.addDays(TODAY, -3), JSON.stringify(w));
  });

  check('MTa T2 (R3, R4) · MT1 vẫn sau tuần cũ của MT2 → 400 có câu chỉ đường, DB không đổi; GVCN → 403', () => {
    const a = emCoDiemMt2();
    huyCu(a);
    assertThrows(() => ketQuaHuy.khoiPhucKetQua(QL, a.m2), /Dời lượt trước về trước rồi khôi phục/, 'R3');
    assert(soDiem(a.m2) === 0 && luot(a.m2).planned_period_id === null, 'DB đổi');
    assert(loiCua(() => ketQuaHuy.khoiPhucKetQua(P.coreTeacher, a.m2)).status === 403, 'R4');
  });

  check('MTa T2 (R5) · màn đọc: lichMtLoTrinh / attemptDetail có ketQuaHuy; lịch sử điểm có "Huỷ do dời vượt" kèm lý do', () => {
    const a = emCoDiemMt2();
    huyCu(a);
    const h = keHoach.lichMtLoTrinh(a.cycleId, TODAY).hang.find((x: any) => x.attemptNo === 2);
    const kq = h.luot.ketQuaHuy;
    assert(kq && kq.soDiem === 2 && kq.lyDo === 'x' && kq.vuotBoi === 'MT1' && kq.nguoi, JSON.stringify(kq));
    assert(attemptsSvc.attemptDetail(QL, a.m2).ketQuaHuy?.soDiem === 2, 'attemptDetail');
    const ls = attemptsSvc.scoreHistoryOf(a.m2).find((x: any) => x.after === 'Huỷ do dời vượt');
    assert(ls && ls.kind === 'override' && ls.lyDo === 'x', JSON.stringify(ls));
    keHoach.luuDot(QL, { attemptId: a.m1, kyNang: bonKyNang(1) });
    ketQuaHuy.khoiPhucKetQua(QL, a.m2);
    assert(keHoach.lichMtLoTrinh(a.cycleId, TODAY).hang.find((x: any) => x.attemptNo === 2).luot.ketQuaHuy === null, 'sau khôi phục');
    assert(/khoi-phuc-ket-qua/.test(nguon('server/src/routes/index.ts')), 'thiếu đường khôi phục');
  });

  // ------------------------------------------------------------------ T3 vắng lần 2
  console.log('\nPR-MTa · T3 "-" lần 2 huỷ kỹ năng, Xin dời, Không mock lại');
  /** Em có MT1 ở tuần `n`, Speaking đã dời do vắng một lần. */
  const emVangMot = (n: number) => {
    const a = emMoi([n, 4, 8]);
    conn.prepare(`UPDATE attempt_skills SET absence_move_count = 1 WHERE attempt_id = ? AND skill = 'speaking'`).run(a.m1);
    return a;
  };
  const chuong = (kind: string, userId: number, entityId?: number) => (conn.prepare(
    `SELECT COUNT(*) n FROM notifications WHERE kind = ? AND user_id = ?${entityId ? ' AND entity_id = ?' : ''}`).get(kind, userId, ...(entityId ? [entityId] : [])) as any).n as number;
  const soDeNghi = (attemptId: number) => (conn.prepare('SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ?').get(attemptId) as any).n as number;
  const theCua = (reqId: number) => (conn.prepare(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_loai = 'skill_move' AND doi_tuong_id = ?`).get(reqId) as any)?.id as number;
  const GVCN = P.coreTeacher;

  check('MTa T3 (H1) · trạng thái huy-vang và thao tác theo vai', () => {
    const tt = d.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-09-07', coDiem: false, sit: 'cancelled', choDuyet: false, lichSu: false, homNay: '2026-09-16', huyVang: true });
    assert(tt === 'huy-vang', tt);
    const q = { nhapDiem: false, quanLy: false, gvcn: true, laFt: true, dotHoanTat: false };
    assert(JSON.stringify(d.thaoTacKyNang('huy-vang', q)) === JSON.stringify({ chinh: null, menu: [] }), 'GVCN không còn nút (09/10)');
    assert(JSON.stringify(d.thaoTacKyNang('huy-vang', { ...q, quanLy: true })) === JSON.stringify({ chinh: 'khoi-phuc', menu: ['khong-mock-lai'] }), 'QL');
    assert(d.thaoTacKyNang('huy-vang', { ...q, gvcn: false }).chinh === null, 'GVBM');
    assert(d.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-09-07', coDiem: false, sit: 'cancelled', choDuyet: false, lichSu: false, homNay: '2026-09-16' }) === 'da-huy', 'không cờ → da-huy');
  });

  check('MTa T3 (H2) · gõ "-" lần 2 trong tuần thi (OV-1b: chốt ngay): S huỷ vắng, không đề nghị, không thẻ; QL 1 chuông, GVCN không; gõ lại không đổi', () => {
    const a = emVangMot(0);
    const theTruoc = (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n;
    const chTruoc = chuong('huy_vang', QL.userId, a.m1);
    const gvTruoc = chuong('huy_vang', GVCN.userId, a.m1);
    attemptsSvc.saveScore(P.sTeacher, a.m1, 'speaking', { noShow: true });
    const k = kyNang(a.m1, 'speaking');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1, JSON.stringify(k));
    assert(soDeNghi(a.m1) === 0 && (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n === theTruoc, 'có đề nghị / thẻ');
    assert(chuong('huy_vang', QL.userId, a.m1) === chTruoc + 1, 'chuông QL');
    assert(chuong('huy_vang', GVCN.userId, a.m1) === gvTruoc, 'GVCN không có chuông (09/10)');
    assertThrows(() => attemptsSvc.saveScore(P.sTeacher, a.m1, 'speaking', { noShow: true }), /đã bị huỷ/, 'gõ lại "-" vào phần thi đã huỷ');
    assert(chuong('huy_vang', QL.userId, a.m1) === chTruoc + 1 && kyNang(a.m1, 'speaking').huy_vang === 1, 'gõ lại đổi');
  });

  check('MTa T3 (H3) · Báo vắng lần 2 (không lý do) → như H2', () => {
    const a = emVangMot(0);
    const r = absence.baoVang(GVCN, a.m1, 'speaking', '');
    assert(r.huyVang && kyNang(a.m1, 'speaking').huy_vang === 1 && soDeNghi(a.m1) === 0, JSON.stringify(r));
  });

  check('MTa T3 (H4) · Xin dời: GVBM 403; GVCN → 1 đề nghị + 1 thẻ; gọi lại 400; QL duyệt → lịch mới, bộ đếm 2; vắng lần 3 → huỷ lại', () => {
    const a = emVangMot(0);
    absence.baoVang(GVCN, a.m1, 'speaking', '');
    assert(loiCua(() => absence.xinDoi(P.subjectTeacher, a.m1, 'speaking')).status === 403, 'GVBM');
    assert(loiCua(() => absence.xinDoi(GVCN, a.m1, 'speaking')).status === 403, 'GVCN 09/10');
    assert(loiCua(() => absence.xinDoi(P.mbManager, a.m1, 'listening')).status === 400, 'kỹ năng chưa huỷ');
    const r = absence.xinDoi(P.mbManager, a.m1, 'speaking', { lyDo: 'Em ốm' });
    assert(r.result === 'pending' && r.requestId && theCua(r.requestId), JSON.stringify(r));
    assert(loiCua(() => absence.xinDoi(P.mbManager, a.m1, 'speaking')).status === 400, 'gọi lại');
    yeuCau.duyetYeuCau(QL, theCua(r.requestId));
    const k = kyNang(a.m1, 'speaking');
    assert(k.sit_status === 'scheduled' && k.huy_vang === 0 && k.absence_move_count === 2 && k.planned_period_id, JSON.stringify(k));
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE id = ?`).run(tuan(0).id, k.id);
    absence.baoVang(GVCN, a.m1, 'speaking', '');
    assert(kyNang(a.m1, 'speaking').huy_vang === 1, 'vắng lần 3');
  });

  check('MTa T3 (H5) · QL từ chối thẻ Xin dời (lý do "x") → không mock lại, đợt hoàn thành được; biên: lớp thường, MT cũ, đề nghị đang chờ', () => {
    const a = emVangMot(0);
    for (const [k, b, r] of [['listening', 6, 30], ['reading', 6, 30], ['writing1', 6, null], ['writing2', 6, null]] as const) diem(a.m1, k, b, r);
    absence.baoVang(GVCN, a.m1, 'speaking', '');
    const r = absence.xinDoi(P.mbManager, a.m1, 'speaking');
    yeuCau.tuChoiYeuCau(QL, theCua(r.requestId), 'x');
    const k = kyNang(a.m1, 'speaking');
    assert(k.required === 0 && k.scope_reason === 'x' && luot(a.m1).status === 'done', `${JSON.stringify(k)} ${luot(a.m1).status}`);
    /* Lớp thường: "-" lần 2 vẫn dời tuần sau như cũ. */
    const b = baiThuong(0);
    regular.reportRegularNoShow(P.admin, b.aid, 'speaking', true);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(tuan(0).id, b.aid);
    conn.prepare(`UPDATE assessment_scores SET no_show_period_id = NULL WHERE attempt_id = ? AND skill = 'speaking'`).run(b.aid);
    assert(regular.reportRegularNoShow(P.admin, b.aid, 'speaking', true).moved === true, 'lớp thường lần 2');
    /* MT cũ: "-" không vào luồng vắng (T23 thay "không nhận '-'") — phép kiểm riêng ở Task 13. */
    /* Kỹ năng đang có đề nghị chờ (lần 1 chuyển QL): "-" không huỷ chồng. */
    const e = emMoi([-3, 4, 8]);
    skillSch.setSitStatus(QL, e.m1, 'speaking', 'absent');
    absence.requestAbsenceMove(GVCN, e.m1, ['speaking']);
    assertThrows(() => attemptsSvc.saveScore(P.sTeacher, e.m1, 'speaking', { noShow: true }), /vắng/, 'đang chờ');
    assert(kyNang(e.m1, 'speaking').huy_vang === 0, 'huỷ chồng');
  });

  check('MTa T3 (H6) · Không mock lại: QL không lý do → bỏ kỹ năng, đề nghị chờ rút; GVCN 403; kỹ năng chưa huỷ 400', () => {
    const a = emVangMot(0);
    absence.baoVang(GVCN, a.m1, 'speaking', '');
    const r = absence.xinDoi(P.mbManager, a.m1, 'speaking');
    assert(loiCua(() => absence.khongMockLai(GVCN, a.m1, 'speaking')).status === 403, 'GVCN');
    assert(loiCua(() => absence.khongMockLai(QL, a.m1, 'listening')).status === 400, 'chưa huỷ');
    absence.khongMockLai(QL, a.m1, 'speaking');
    assert(kyNang(a.m1, 'speaking').required === 0, 'chưa bỏ');
    assert((conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(r.requestId) as any).status === 'withdrawn', 'đề nghị chưa rút');
  });

  check('MTa T3 (H7) · thẻ Xin dời hết hạn → expired, S vẫn huỷ vắng, không chuông schedule_move cho QL', () => {
    const a = emVangMot(0);
    absence.baoVang(GVCN, a.m1, 'speaking', '');
    const r = absence.xinDoi(P.mbManager, a.m1, 'speaking');
    conn.prepare('UPDATE skill_move_requests SET decide_by = ? WHERE id = ?').run(t.addDays(TODAY, -1), r.requestId);
    const truoc = chuong('schedule_move', QL.userId);
    absence.sweepExpiredMoves();
    assert((conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(r.requestId) as any).status === 'expired', 'chưa hết hạn');
    assert(kyNang(a.m1, 'speaking').huy_vang === 1 && kyNang(a.m1, 'speaking').sit_status === 'cancelled', 'S đổi');
    assert(chuong('schedule_move', QL.userId) === truoc, 'chuông QL');
  });

  check('MTa T3 (G2) · QL xếp lại bài vắng không lý do → lưu; khôi phục kỹ năng huỷ vắng → huy_vang = 0', () => {
    const a = emMoi([0, 4, 8]);
    skillSch.setSitStatus(QL, a.m1, 'reading', 'absent');
    skillSch.setSkillWeek(QL, a.m1, 'reading', tuan(2).id, {});
    assert(kyNang(a.m1, 'reading').sit_status === 'scheduled', 'xếp lại');
    const b = emVangMot(0);
    absence.baoVang(GVCN, b.m1, 'speaking', '');
    absence.restoreCancelledSkill(QL, b.m1, 'speaking', tuan(2).id);
    assert(kyNang(b.m1, 'speaking').huy_vang === 0 && kyNang(b.m1, 'speaking').sit_status === 'scheduled', JSON.stringify(kyNang(b.m1, 'speaking')));
    assert(d.nhomThongBao({ kind: 'huy_vang' }) === 'de-biet', 'chuông để biết');
  });

  // ------------------------------------------------------------------ T10 band trực tiếp
  console.log('\nPR-MTa · T10 nhận band trực tiếp');
  check('MTa T10 (B1) · docONhapLR + kiemBand', () => {
    const eq = (s: string, v: unknown) => assert(JSON.stringify(d.docONhapLR(s)) === JSON.stringify(v), `${s} → ${JSON.stringify(d.docONhapLR(s))}`);
    eq('', null); eq('30', { raw: 30 }); eq('6.5', { band: 6.5 }); eq('6.0', { band: 6 }); eq('b6', { band: 6 }); eq('B6.5', { band: 6.5 });
    for (const s of ['6.25', 'b', '9.5', '-1', 'abc']) assert('loi' in (d.docONhapLR(s) as any), s);
    assert(d.kiemBand(0) === null && d.kiemBand(9) === null && d.kiemBand(6.5) === null, 'hợp lệ');
    for (const v of [6.25, -0.5, 9.5, '6', NaN, null]) assert(d.kiemBand(v) !== null, String(v));
  });

  check('MTa T10 (B2) · saveScore nhận band L/W1/W2/S, overall như cũ; dạng sai → 400 không đổi DB; sửa không lý do, xoá cần lý do', () => {
    const a = emMoi([0, 4, 8]);
    const ghi = (k: string, patch: object) => attemptsSvc.saveScore(P.admin, a.m1, k, patch);
    ghi('listening', { band: 6.5 });
    const l = conn.prepare(`SELECT band, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.m1) as any;
    assert(l.band === 6.5 && l.raw_score === null, JSON.stringify(l));
    ghi('writing1', { band: 6 }); ghi('writing2', { band: 7 }); ghi('speaking', { band: 6 });
    const kq = ghi('reading', { rawScore: 30 });
    assert(kq.result.complete && kq.result.overall !== null, JSON.stringify(kq.result));
    for (const [k, patch] of [['listening', { band: 6.25 }], ['listening', { band: 9.5 }], ['listening', { band: -1 }], ['listening', { band: 'b' }],
      ['listening', { band: 6, rawScore: 30 }], ['speaking', { band: 6, criteria: [6, 6, 6, 6] }]] as const) {
      assert(loiCua(() => ghi(k, patch)).status === 400, `${k} ${JSON.stringify(patch)}`);
    }
    assert((conn.prepare(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.m1) as any).band === 6.5, 'DB đổi');
    ghi('listening', { band: 7 });
    ghi('listening', { note: 'ghi chú' });
    assert((conn.prepare(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.m1) as any).band === 7, 'ghi chú làm mất band');
    assert(/band: b\.band/.test(nguon('server/src/routes/index.ts')), 'route chưa truyền band');
    assert(attemptsSvc.scoreSummaryText({ band: 6.5 }) === 'Band 6.5', attemptsSvc.scoreSummaryText({ band: 6.5 }));
  });

  // ------------------------------------------------------------------ T11 chuông GVCN khi người khác dời Test lớp thường
  console.log('\nPR-MTa · T11 chuông GVCN khi người khác dời Test lớp thường');
  check('MTa T11 (N1) · QL / GVBM dời → GVCN đúng 1 chuông; GVCN tự dời, "-", FT → 0; hàng loạt 3 em → 1 chuông cả lớp', () => {
    const GV_CN = P.normalCoreTeacher;
    const dt = (aid: number) => chuong('doi_lich_thuong', GV_CN.userId, aid);
    const a = baiThuong(2);
    skillSch.setSkillWeek(QL, a.aid, 'speaking', tuan(3).id, {});
    keHoach.luuDot(QL, { attemptId: a.aid, kyNang: [{ skill: 'listening', periodId: tuan(3).id }, { skill: 'reading', periodId: tuan(3).id }] });
    assert(dt(a.aid) === 1, `QL: ${dt(a.aid)}`);
    const n = conn.prepare(`SELECT title, duong FROM notifications WHERE kind = 'doi_lich_thuong' AND entity_id = ?`).get(a.aid) as any;
    assert(/^Progress Test · .+ · dời sang W\d [A-Z]{3}$/.test(n.title) && /^\/bang-diem-thuong\//.test(n.duong), JSON.stringify(n));
    const gvbm = conn.prepare(`SELECT skill FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND skill IS NOT NULL AND status = 'active'`).get(P.normalSubjectTeacher.userId, LOP_THUONG) as any;
    const b = baiThuong(2);
    skillSch.setSkillWeek(P.normalSubjectTeacher, b.aid, gvbm.skill === 'writing1' || gvbm.skill === 'writing2' ? 'writing' : gvbm.skill, tuan(3).id, {});
    assert(dt(b.aid) === 1, 'GVBM');
    const c = baiThuong(2);
    skillSch.setSkillWeek(GV_CN, c.aid, 'speaking', tuan(3).id, {});
    const c0 = baiThuong(0);
    regular.reportRegularNoShow(P.admin, c0.aid, 'listening', true);
    assert(dt(c.aid) === 0 && dt(c0.aid) === 0, 'GVCN tự dời / "-"');
    const f = emMoi();
    skillSch.setSkillWeek(QL, f.m1, 'speaking', tuan(2).id, {});
    assert((conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'doi_lich_thuong' AND entity_id = ?`).get(f.m1) as any).n === 0, 'FT');
    const ds = [baiThuong(2), baiThuong(2), baiThuong(2)];
    const r = keHoach.xepHangLoat(QL, { classId: LOP_THUONG, kind: 'progress', studentIds: ds.map((x) => x.sid), tuan: bon(5) }, TODAY);
    assert(r.daLuu === 3, JSON.stringify(r.dong.map((x: any) => x.loi)));
    assert(ds.every((x) => dt(x.aid) === 0), 'chuông từng em ở hàng loạt');
    const lop = conn.prepare(`SELECT title FROM notifications WHERE kind = 'doi_lich_thuong' AND user_id = ? AND entity_type = 'class' AND entity_id = ?`).all(GV_CN.userId, LOP_THUONG) as any[];
    assert(lop.length === 1 && /^Progress Test · 3 em · đổi lịch$/.test(lop[0].title), JSON.stringify(lop));
    assert(d.nhomThongBao({ kind: 'doi_lich_thuong' }) === 'de-biet', 'để biết');
  });

  // ------------------------------------------------------------------ Task 3 chữ "MT lịch sử" → "MT cũ" · Task 11 G3, G4
  check('MTa (C9) · chữ "MT cũ" thay "MT lịch sử" trên màn, thông báo, câu lỗi, Excel', () => {
    assert(d.nhanHanhDongNhatKy('score.lich_su') === 'Nhập điểm MT cũ', d.nhanHanhDongNhatKy('score.lich_su'));
    const loiChu = (s: string) => s.split('\n').filter((x) => /MT lịch sử/.test(x) && !/^\s*(\*|\/\/|\/\*|\{\/\*)/.test(x));
    for (const f of ['web/src/ui/Nhan.tsx', 'web/src/modules/students/ClassRoster.tsx', 'web/src/modules/students/IntakePanel.tsx',
      'web/src/modules/students/StudentPlanPanel.tsx', 'web/src/modules/test/keHoach/HopKyNang.tsx', 'web/src/modules/test/LichTestTab.tsx',
      'web/src/modules/platform/WelcomePage.tsx', 'web/src/modules/cham/DiemTheoLop.tsx', 'web/src/modules/fasttrack/MockDetailPage.tsx',
      'server/src/worklist/mywork.ts', 'server/src/classes/intake.ts', 'server/src/classes/schedule.ts', 'server/src/fasttrack/absence.ts',
      'server/src/fasttrack/attempts.ts', 'shared/domain/keHoachTest.ts', 'shared/domain/lichMt.ts', 'shared/domain/hanhTrinh.ts']) {
      assert(!loiChu(nguon(f)).length, `${f}: ${loiChu(nguon(f)).join(' | ')}`);
    }
  });

  check('MTa (G3) · mở lộ trình FT mới với tuần bắt đầu cũ: MT ở tuần trước là MT thường, cách ≥ 2 tuần là MT cũ', () => {
    const a = emTrang();
    conn.prepare(`UPDATE learning_cycles SET status = 'closed' WHERE student_id = ?`).run(a.sid);
    const route = (conn.prepare('SELECT route FROM learning_cycles WHERE id = ?').get(a.cycleId) as any).route;
    const cy = cycles.createCycle(QL, { studentId: a.sid, route, targetScore: 6.5, startedAt: t.addDays(tuanNay, -42) });
    const ds = conn.prepare(`SELECT attempt_no, lich_su FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' ORDER BY attempt_no`).all(cy.id) as any[];
    assert(ds.length >= 2 && ds[0].lich_su === 0 && ds[1].lich_su === 0, `MT1 (tuần trước), MT2: ${JSON.stringify(ds)}`);
  });

  check('MTa (G4) · sau huỷ kết quả, việc nhập điểm của MT2 không còn ở Công việc GVBM; việc "Nhập điểm MT cũ" mang chữ mới', () => {
    const a = vuotV3;
    const viec: any[] = [];
    JSON.stringify(mywork.myWork(P.lrTeacher, {}), (_k, v) => { if (v && typeof v === 'object' && typeof v.key === 'string') viec.push(v); return v; });
    assert(!viec.some((x) => x.attemptId === a.m2 && /^score:/.test(x.key)), `còn việc nhập điểm MT2: ${JSON.stringify(viec.filter((x) => x.attemptId === a.m2))}`);
    assert(!viec.some((x) => /MT lịch sử/.test(`${x.reason} ${x.tieuDe}`)), 'còn chữ cũ');
  });

  /* PR-MTGON (luật 1) bỏ hộp dời vượt — MTG-1d khẳng định web không còn HopXacNhanHuyLich / xacNhanHuyLich. */

  // ------------------------------------------------------------------ T19 khung nhập điểm (chủ sản phẩm 06/10)
  console.log('\nPR-MTa · T19 không nhập điểm trước tuần thi; hạn lớp thường thứ Tư tuần sau');
  const CHUA_TOI = /^Chưa tới tuần thi W\d [A-Z]{3} — chưa nhập điểm được\.$/;
  check('MTa T19 (F1, F2) · MT tuần sau: GVBM, Quản lý, Quản trị nhập điểm → 400, không ghi gì', () => {
    const a = emMoi();
    for (const ai of [P.lrTeacher, QL, P.admin]) {
      const e = loiCua(() => attemptsSvc.saveScore(ai, a.m1, 'listening', { rawScore: 30 }));
      assert(e.status === 400 && CHUA_TOI.test(e.message), `${ai.userId}: ${e.status} ${e.message}`);
    }
    assert(loiCua(() => attemptsSvc.saveScore(P.admin, a.m1, 'writing1', { criteria: [6, 6, 6, 6] })).status === 400, 'tiêu chí');
    assert(loiCua(() => attemptsSvc.saveScore(P.admin, a.m1, 'speaking', { band: 6 })).status === 400, 'band');
    assert(soDiem(a.m1) === 0 && !conn.prepare('SELECT 1 FROM assessment_scores WHERE attempt_id = ?').get(a.m1), 'đã ghi');
  });

  check('MTa T19 (F3, F4, F7) · tuần này → được; quá hạn (2 tuần trước) → được, vẫn tính trễ; MT cũ → được', () => {
    const a = emMoi([0, 4, 8]);
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { rawScore: 30 });
    const b = emMoi([-2, 4, 8]);
    const han = week.skillScoreDeadline('band', t.addDays(tuanNay, -14));
    assert(week.quaHanNhapDiem(han, t.addDays(tuanNay, -14), TODAY), 'tiền đề: đã quá hạn');
    attemptsSvc.saveScore(P.lrTeacher, b.m1, 'listening', { rawScore: 30 });
    const nd = (conn.prepare(`SELECT nhap_dau_ngay FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(b.m1) as any).nhap_dau_ngay;
    assert(nd === TODAY && nd > week.mocTreNhapDiem(han, t.addDays(tuanNay, -14)), `trễ: ${nd}`);
    const c = emTrang();
    const cu = keHoach.xepMoi(QL, { studentId: c.sid, tuan: bon(-4) });
    attemptsSvc.saveScore(P.admin, cu.id, 'reading', { rawScore: 25 });
    assert(soDiem(cu.id) === 1 && luot(cu.id).lich_su === 1, 'MT cũ');
  });

  check('MTa T19 (F5, F6) · lớp thường: tuần sau → 400; tuần này / đã qua → được; hạn = thứ Tư tuần sau', () => {
    const tuanSau = baiThuong(1);
    const e = loiCua(() => regular.saveRegularScore(P.admin, tuanSau.aid, 'listening', { score: 7, total: 10 }));
    assert(e.status === 400 && CHUA_TOI.test(e.message), e.message);
    regular.saveRegularScore(P.admin, baiThuong(0).aid, 'listening', { score: 7, total: 10 });
    regular.saveRegularScore(P.admin, baiThuong(-2).aid, 'listening', { score: 7, total: 10 });
    assert(week.skillScoreDeadline('ratio', '2026-09-14') === '2026-09-23' && week.skillScoreDeadline('band', '2026-09-14') === '2026-09-23', 'hạn');
    const v = regular.regularDeadline({ planned_period_id: tuan(0).id });
    assert(v.date === t.addDays(tuanNay, 9) && v.source === 'default', JSON.stringify(v));
  });

  check('MTa T19 (F8, F9) · kỹ năng chưa xếp tuần → 400; dấu "-" và xoá điểm giữ luật cũ', () => {
    const a = emMoi([0, 4, 8]);
    skillSch.boTuanLuot(QL, a.m3, {});
    assert(/^Chưa xếp tuần thi — chưa nhập điểm được\.$/.test(loiCua(() => attemptsSvc.saveScore(P.admin, a.m3, 'listening', { rawScore: 30 })).message), 'chưa xếp');
    const b = baiThuong(1);
    assert(/chưa ghi "-" được/.test(loiCua(() => regular.saveRegularScore(P.admin, b.aid, 'listening', { noShow: true })).message), '"-" lớp thường');
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { rawScore: 30 });
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { rawScore: null, lyDo: 'x' });
    assert(soDiem(a.m1) === 0, 'xoá điểm');
  });
  // ------------------------------------------------------------------ Task 13 · T20–T23 (chủ sản phẩm 06/10)
  console.log('\nPR-MTa · T20 dời kỹ năng có điểm, T21 khôi phục vào tuần đã qua, T22 xoá trắng ô, T23 "-" ở MT cũ');
  const canCham: any = await import('../cham/canCham.ts');
  const diemCua = (attemptId: number, skill: string) => conn.prepare(
    `SELECT band, raw_score, no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = ?`).get(attemptId, skill) as any;
  const mtCu = () => {
    const c = emTrang();
    const cu = keHoach.xepMoi(QL, { studentId: c.sid, tuan: bon(-4) });
    assert(luot(cu.id).lich_su === 1, 'tiền đề MT cũ');
    return { sid: c.sid, id: cu.id as number };
  };

  check('MTa T20 · FT: Quản lý dời L đã có điểm về tuần trước (setSkillWeek) và R (luuDot) → điểm đi theo; GVBM → 403', () => {
    const a = emMoi([0, 4, 8]);
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { rawScore: 30 });
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'reading', { rawScore: 25 });
    skillSch.setSkillWeek(QL, a.m1, 'listening', tuan(-1).id, {});
    assert(kyNang(a.m1, 'listening').week_start === t.addDays(tuanNay, -7) && diemCua(a.m1, 'listening').raw_score === 30, 'L');
    const kq = keHoach.luuDot(QL, { attemptId: a.m1, kyNang: [{ skill: 'reading', periodId: tuan(-3).id }] });
    assert(kq.doi.includes('reading') && kyNang(a.m1, 'reading').week_start === t.addDays(tuanNay, -21) && diemCua(a.m1, 'reading').raw_score === 25, JSON.stringify(kq));
    assert(luot(a.m1).lich_su === 0, 'W/S còn tuần này → không MT cũ');
    assert(loiCua(() => skillSch.setSkillWeek(P.lrTeacher, a.m1, 'listening', tuan(1).id, {})).status === 403, 'GVBM');
  });

  check('MTa T20 · lớp thường: Quản lý dời môn có điểm về tuần trước → điểm còn; GVBM → 400 "đã có điểm"', () => {
    const b = baiThuong(0);
    const mon = (conn.prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' LIMIT 1`)
      .get(LOP_THUONG, P.normalSubjectTeacher.userId) as any).skill as string;
    regular.saveRegularScore(P.admin, b.aid, mon, { score: 7, total: 10 });
    assert(/đã có điểm/.test(loiCua(() => skillSch.setSkillWeek(P.normalSubjectTeacher, b.aid, mon, tuan(1).id, {})).message), 'GVBM');
    skillSch.setSkillWeek(QL, b.aid, mon, tuan(-1).id, {});
    assert(kyNang(b.aid, mon).week_start === t.addDays(tuanNay, -7) && diemCua(b.aid, mon).raw_score === 7, 'điểm đi theo');
  });

  check('MTa T21 · khôi phục phần đã huỷ vào tuần này / tuần đã qua → nhập điểm ngay; GVCN → 403', () => {
    const a = emMoi([0, 4, 8]);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill IN ('speaking', 'reading')`).run(a.m1);
    assert(loiCua(() => absence.restoreCancelledSkill(P.coreTeacher, a.m1, 'speaking', tuan(0).id)).status === 403, 'GVCN');
    absence.restoreCancelledSkill(QL, a.m1, 'speaking', tuan(0).id);
    absence.restoreCancelledSkill(QL, a.m1, 'reading', tuan(-1).id);
    attemptsSvc.saveScore(P.admin, a.m1, 'speaking', { band: 6 });
    attemptsSvc.saveScore(P.admin, a.m1, 'reading', { rawScore: 25 });
    const r = kyNang(a.m1, 'reading');
    assert(r.sit_status !== 'cancelled' && r.week_start === t.addDays(tuanNay, -7) && diemCua(a.m1, 'speaking').band === 6 && diemCua(a.m1, 'reading').raw_score === 25,
      `khôi phục: ${JSON.stringify(r)} ${JSON.stringify(diemCua(a.m1, 'speaking'))}`);
  });

  check('MTa T22 · MT cũ: GVCN sửa và xoá trắng ô đã có điểm (không lý do), ô hiện sửa được; menu Huỷ điểm cũng không cần lý do (rà #212)', () => {
    const cu = mtCu();
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'reading', { rawScore: 25 });
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'reading', { rawScore: 27 });
    const o = attemptsSvc.attemptDetail(P.coreTeacher, cu.id).cells.find((x: any) => x.skill === 'reading');
    assert(o.canEdit === true && diemCua(cu.id, 'reading').raw_score === 27, JSON.stringify(o));
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'reading', { rawScore: null });
    assert(diemCua(cu.id, 'reading').raw_score === null, 'xoá');
    attemptsSvc.saveScore(P.admin, cu.id, 'listening', { rawScore: 30 });
    keHoach.huyDiem(QL, { attemptId: cu.id, skill: 'listening', lyDo: '' });
    assert(diemCua(cu.id, 'listening').raw_score === null, 'Huỷ điểm không lý do');
  });

  check('MTa T23 · MT cũ nhận "-" = không dự thi: không vắng, không dời, không Case/thẻ/chuông; không còn nhắc "chưa nhập"; điểm đè được dấu', () => {
    const cu = mtCu();
    const dem3 = () => [
      (conn.prepare('SELECT COUNT(*) n FROM notifications').get() as any).n,
      (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n,
      (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?').get(cu.sid) as any).n,
    ].join();
    const truoc = dem3();
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'speaking', { noShow: true });
    const k = kyNang(cu.id, 'speaking');
    assert(diemCua(cu.id, 'speaking').no_show_period_id === k.planned_period_id, 'chưa ghi dấu');
    assert(k.sit_status === 'scheduled' && k.absence_move_count === 0 && k.week_start === t.addDays(tuanNay, -28), JSON.stringify(k));
    assert(dem3() === truoc, `${truoc} → ${dem3()}`);
    for (const [kk, patch] of [['listening', { rawScore: 30 }], ['reading', { rawScore: 25 }], ['writing1', { band: 6 }], ['writing2', { band: 6 }]] as const) {
      attemptsSvc.saveScore(P.coreTeacher, cu.id, kk, patch);
    }
    assert(luot(cu.id).status === 'planned', 'tiền đề: S chỉ có "-"');
    const soNhac = () => (canCham.mtLichSuChuaNhap(QL, { classIds: [LOP] }) as any[]).find((x: any) => x.classId === LOP)?.soEm ?? 0;
    const coDau = soNhac();
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'speaking', { noShow: false });
    assert(soNhac() === coDau + 1, `gỡ "-" thì em lại vào nhắc: ${coDau} → ${soNhac()}`);
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'speaking', { noShow: true });
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'speaking', { band: 6 });
    assert(diemCua(cu.id, 'speaking').band === 6 && diemCua(cu.id, 'speaking').no_show_period_id === null, 'điểm đè dấu');
  });
  // ------------------------------------------------------------------ Rà #212 (06/10): sửa sau rà độc lập
  console.log('\nPR-MTa · Rà #212: "-" MT cũ chốt cuối, Huỷ điểm không lý do, ô tuần chưa tới khoá, GVCN MT cũ sau hoàn tất, khôi phục không đè "-"');

  check('Rà #212 (I2) · "-" ở MT cũ không vào luồng vắng kể cả khi Quản lý dời kỹ năng khác làm lượt thành MT thường', () => {
    const cu = mtCu();
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'speaking', { noShow: true });
    const tb = (conn.prepare('SELECT COUNT(*) n FROM notifications').get() as any).n;
    skillSch.setSkillWeek(QL, cu.id, 'listening', tuan(0).id, {});
    assert(luot(cu.id).lich_su === 0, 'tiền đề: lượt thành MT thường');
    const k = kyNang(cu.id, 'speaking');
    assert(k.sit_status === 'scheduled' && k.absence_move_count === 0 && k.week_start === t.addDays(tuanNay, -28), JSON.stringify(k));
    assert(!conn.prepare('SELECT 1 FROM skill_move_requests WHERE attempt_id = ?').get(cu.id), 'đề nghị dời');
    assert((conn.prepare('SELECT COUNT(*) n FROM notifications').get() as any).n === tb, 'chuông');
    const o = attemptsSvc.attemptDetail(QL, cu.id).cells.find((x: any) => x.skill === 'speaking');
    assert(o.noShow?.state === 'khong-du-thi' && !o.noShowNote, JSON.stringify({ noShow: o.noShow, note: o.noShowNote }));
    attemptsSvc.saveScore(QL, cu.id, 'speaking', { noShow: false });
    assert(diemCua(cu.id, 'speaking').no_show_period_id === null, 'gỡ dấu');
  });

  check('Rà #212 (3) · menu Huỷ điểm không bắt lý do (chủ sản phẩm 06/10); huỷ kết quả, từ chối vẫn bắt (huỷ lượt: tuỳ chọn, PR-MTGON)', () => {
    assert(!d.canLyDo('huy-diem') && d.kiemLyDoThaoTac('huy-diem', '') === null, 'huy-diem');
    for (const x of ['huy-ket-qua', 'tu-choi'] as const) assert(d.canLyDo(x), x);
    const a = emMoi([0, 4, 8]);
    diem(a.m1, 'listening');
    keHoach.huyDiem(QL, { attemptId: a.m1, skill: 'listening', lyDo: '' });
    assert(soDiem(a.m1) === 0, 'chưa huỷ');
  });

  check('Rà #212 (4) · ô có điểm mà kỹ năng đã dời sang tuần chưa tới: khoá như máy chủ (FT và lớp thường)', () => {
    const a = emMoi([0, 4, 8]);
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { rawScore: 30 });
    skillSch.setSkillWeek(QL, a.m1, 'listening', tuan(1).id, {});
    const o = attemptsSvc.attemptDetail(P.admin, a.m1).cells.find((x: any) => x.skill === 'listening');
    assert(o.rawScore === 30 && o.canEdit === false, JSON.stringify({ r: o.rawScore, e: o.canEdit }));
    const b = baiThuong(0);
    regular.saveRegularScore(P.admin, b.aid, 'speaking', { score: 7, total: 10 });
    skillSch.setSkillWeek(QL, b.aid, 'speaking', tuan(1).id, {});
    const dong = regular.regularSheet(P.admin, LOP_THUONG).rows.find((x: any) => x.attemptId === b.aid);
    assert(dong.skillSchedule.find((x: any) => x.skill === 'speaking').canEdit === false, 'lớp thường');
  });

  check('Rà #212 (6) · MT cũ đã hoàn tất: GVCN lớp đó vẫn sửa / xoá được (T22); GV ngoài lớp vẫn bị chặn', () => {
    const cu = mtCu();
    for (const [k, patch] of [['listening', { rawScore: 30 }], ['reading', { rawScore: 25 }], ['writing1', { band: 6 }], ['writing2', { band: 6 }], ['speaking', { band: 6 }]] as const) {
      attemptsSvc.saveScore(P.coreTeacher, cu.id, k, patch);
    }
    const sau = t.addDays(TODAY, 21);
    const ht: any = hoanTatSvc.dotHoanTat(cu.id, sau);
    assert(ht.hoanTat, `tiền đề: hoàn tất ${JSON.stringify(ht)}`);
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'reading', { rawScore: 27 }, sau);
    assert(!perm.isCoreTeacherOf(P.w1Teacher, LOP), 'tiền đề: GV W1 không chủ nhiệm');
    assert(loiCua(() => attemptsSvc.saveScore(P.w1Teacher, cu.id, 'writing1', { band: 7 }, sau)).status === 403, 'GVBM');
    attemptsSvc.saveScore(P.coreTeacher, cu.id, 'listening', { rawScore: null }, sau);
    assert(diemCua(cu.id, 'reading').raw_score === 27 && diemCua(cu.id, 'listening').raw_score === null, 'GVCN');
  });

  check('Rà #212 (7) · khôi phục kết quả không đè ô chỉ có "-" mới: bỏ qua ô đó, nêu trong câu trả về', () => {
    const b = emCoDiemMt2();
    huyCu(b);
    keHoach.luuDot(QL, { attemptId: b.m1, kyNang: bonKyNang(1) });
    keHoach.luuDot(QL, { attemptId: b.m2, kyNang: bonKyNang(4) });
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at) VALUES (?, 'listening', ?, ?)`).run(b.m2, tuan(4).id, TODAY);
    const kq = ketQuaHuy.khoiPhucKetQua(QL, b.m2);
    const l = conn.prepare(`SELECT band, raw_score, no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(b.m2) as any;
    assert(l.band === null && l.raw_score === null && l.no_show_period_id === tuan(4).id, `"-" bị đè: ${JSON.stringify(l)}`);
    assert(kq.boQua?.includes('listening') && /Listening/.test(kq.cau ?? ''), JSON.stringify(kq));
    assert(soDiem(b.m2) >= 1, 'các ô khác phải khôi phục');
  });

  check('Rà #212 (I1, 5) · web: xoá trắng ô có điểm không khoá Lưu, nhãn "Lý do (tuỳ chọn)"; hộp kỹ năng không chặn tuần đã qua', () => {
    const se = nguon('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(!/Lý do huỷ/.test(se) && !/kiemLyDoThaoTac\('huy-diem'/.test(se), 'ScoreEntry còn bắt lý do khi xoá');
    assert(/Lý do \(tuỳ chọn\)/.test(se), 'nhãn');
    const hk = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    assert(!/toiThieu=\{!moi && !lichSu \? homNay/.test(hk), 'HopKyNang còn chặn tuần đã qua');
  });
}
