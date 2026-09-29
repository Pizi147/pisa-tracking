/** PHÉP KIỂM PR-XLMT — xếp lịch MT nhiều lớp, thao tác MT theo trạng thái (T37, T38). Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrXlmtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-XLMT · Xếp lịch MT nhiều lớp, thao tác MT theo trạng thái');

  // ------------------------------------------------------------------ khối 1: luật thuần
  const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });

  check('PR-XLMT (1) · trần MT8: kiemSoMtMoi(MT1…MT8, 9) chặn "Tối đa MT8"; thuTuDot MT8 trước Giữa khoá (T37, K1-21)', () => {
    const ds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => L(n, 'completed', true));
    assert(d.kiemSoMtMoi(ds, 9) === 'Tối đa MT8 cho một lộ trình.', String(d.kiemSoMtMoi(ds, 9)));
    assert(d.thuTuDot('mt:8') < d.thuTuDot('giua') && d.thuTuDot('mt:6') > d.thuTuDot('mt:5'), 'MT6–MT8 xếp trước Giữa khoá');
    assert(d.thuTuDot('giua') < d.thuTuDot('cuoi') && d.thuTuDot('la') > d.thuTuDot('cuoi'), 'Giữa < Cuối < khoá lạ');
  });

  check('PR-XLMT (1) · viecXepMt: đủ → tạo MT kế · dở → xếp nốt · chưa thi → dời · lịch sử → bỏ qua · chờ duyệt / ép / thiếu MT (K4-17)', () => {
    const kn = (o: Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', Partial<{ coDiem: boolean; daThi: boolean; choDuyet: boolean; huyPhan: boolean }>>>) =>
      (['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => ({
        skill, batBuoc: true, coDiem: false, daThi: false, huyPhan: false, choDuyet: false, ...(o[skill] ?? {}),
      }));
    const du = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { coDiem: true } });
    const so3 = [L(1, 'completed', true), L(2, 'completed', true), L(3)];
    const truoc = [1, 2].map((no) => ({ no, huy: false, lichSu: false, kn: du }));
    const v1 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3);
    assert(v1.loai === 'tao' && v1.no === 4, JSON.stringify(v1));
    const v2 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({ listening: { coDiem: true }, reading: { coDiem: true } }) }], 3, so3);
    assert(v2.loai === 'xep-not' && JSON.stringify(v2.kyNang) === '["writing","speaking"]', JSON.stringify(v2));
    const v3 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({}) }], 3, so3);
    assert(v3.loai === 'doi' && v3.no === 3, JSON.stringify(v3));
    const v4 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3);
    assert(v4.loai === 'tao' && v4.no === 4, `lịch sử → sang MT4: ${JSON.stringify(v4)}`);
    const choS = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { choDuyet: true } });
    const v5 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: choS }], 3, so3);
    assert(v5.loai === 'chan' && /chờ Quản lý duyệt/.test(v5.cau), JSON.stringify(v5));
    const v6 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3, true);
    assert(v6.loai === 'da-du' && v6.coDiem.length === 4 && v6.coDiem[0] === 'listening', JSON.stringify(v6));
    const v7 = d.viecXepMt([{ no: 1, huy: false, lichSu: false, kn: du }], 3, [L(1, 'completed', true)]);
    assert(v7.loai === 'chan' && v7.cau === d.kiemSoMtMoi([L(1, 'completed', true)], 3), JSON.stringify(v7));
    const v8 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3, true);
    assert(v8.loai === 'chan' && /nhập bù/.test(v8.cau), `ép MT lịch sử → chặn: ${JSON.stringify(v8)}`);
  });

  check('PR-XLMT (1) · kiemTuanDaQua: không qua · dời vào tuần qua · trộn qua/tới · em đã có trên web · MT lịch sử (K2-33, Q8)', () => {
    const b = { ngayVaoWeb: '2026-09-29', homNay: '2026-09-29' };
    assert(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-10-04'], taoMoi: true }).cau === null, 'tuần này chưa qua');
    assert(/Không dời vào tuần đã qua/.test(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-20'], taoMoi: false }).cau ?? ''), 'dời');
    assert(/cho mọi kỹ năng/.test(d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-20', '2026-10-04'], taoMoi: true }).cau ?? ''), 'trộn');
    assert(/đã có trên web/.test(d.kiemTuanDaQua({ ...b, ngayVaoWeb: '2026-07-01', ketThuc: ['2026-09-20'], taoMoi: true }).cau ?? ''), 'vào web trước');
    const ok = d.kiemTuanDaQua({ ...b, ketThuc: ['2026-09-06', '2026-09-13'], taoMoi: true });
    assert(ok.cau === null && ok.lichSu, JSON.stringify(ok));
  });

  check('PR-XLMT (1) · thaoTacKyNang: mọi trạng thái × 2⁵ quyền → ≤ 1 nút chính, ≤ 3 mục menu, không trùng, Bỏ kỹ năng chỉ FT (K4-27)', () => {
    const tts = ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su'] as const;
    for (const tt of tts) {
      for (let m = 0; m < 32; m++) {
        const q = { nhapDiem: !!(m & 1), quanLy: !!(m & 2), gvcn: !!(m & 4), laFt: !!(m & 8), dotHoanTat: !!(m & 16) };
        const r = d.thaoTacKyNang(tt, q);
        const tat = [...(r.chinh ? [r.chinh] : []), ...r.menu];
        assert(r.menu.length <= 3, `${tt} ${m}: menu ${r.menu.length}`);
        assert(new Set(tat).size === tat.length, `${tt} ${m}: trùng ${tat}`);
        assert(!tat.includes('bo-ky-nang') || q.laFt, `${tt} ${m}: bỏ kỹ năng ở lớp thường`);
        assert(tat.every((x) => !!d.CHU_THAO_TAC[x]), `${tt} ${m}: thiếu chữ`);
      }
    }
    assert(d.canLyDo('doi-lich', false) === false && d.canLyDo('doi-lich', true) && d.canLyDo('bao-vang', false), 'canLyDo');
    assert(d.kiemLyDoThaoTac('Báo vắng', ' ab ') === 'Báo vắng: lý do cần ít nhất 5 ký tự.' && d.kiemLyDoThaoTac('Báo vắng', 'ốm sốt') === null, 'kiemLyDoThaoTac');
    assert(d.tuanMacDinhDotMoi('2026-09-16') === '2026-09-21', d.tuanMacDinhDotMoi('2026-09-16'));
  });

  check('PR-XLMT (1) · trangThaiNhom: cờ mới tuỳ chọn, thứ tự chờ duyệt › vắng › chưa xếp › huỷ › trễ › dời (K4-11)', () => {
    const k = (o: object = {}) => ({ batBuoc: true, tuan: '2026-09-28', xong: false, daDoi: false, ...o });
    assert(d.trangThaiNhom([k({ vang: true }), k({ choDuyet: true })]) === 'cho-duyet', 'chờ duyệt trước vắng');
    assert(d.trangThaiNhom([k({ vang: true }), k({ tuan: null })]) === 'vang', 'vắng trước chưa xếp');
    assert(d.trangThaiNhom([k({ huy: true }), k({ tre: true })]) === 'da-huy', 'huỷ trước trễ');
    assert(d.trangThaiNhom([k({ tre: true }), k({ daDoi: true })]) === 'tre', 'trễ trước dời');
    assert(d.trangThaiNhom([k({ daDoi: true })]) === 'da-doi' && d.trangThaiNhom([k()]) === 'da-xep', 'cũ giữ');
  });

  check('PR-XLMT (1) · chuSeXep + tomTatXepMt: chữ cột "Sẽ xếp" và dòng xem trước (M9, C4)', () => {
    const bai = (skill: any, tu: string | null, den: string, ghiChu: any = 'doi') => ({ skill, tu, den, ghiChu, cau: null });
    const dong: any[] = [
      { studentId: 1, ten: 'A', hanhDong: 'doi', viec: 'doi', attemptNo: 3, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, '2026-10-19', '2026-10-12')) },
      { studentId: 2, ten: 'B', hanhDong: 'doi', viec: 'xep-not', attemptNo: 3, loi: null, bai: [bai('writing', '2026-10-19', '2026-10-12'), bai('speaking', '2026-10-19', '2026-10-12', 'canh-bao')] },
      { studentId: 3, ten: 'C', hanhDong: 'tao', viec: 'tao', attemptNo: 4, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, null, '2026-10-12', 'moi')) },
      { studentId: 4, ten: 'D', hanhDong: 'tao', viec: 'tao', attemptNo: 4, lichSu: true, loi: null, bai: ['listening', 'reading', 'writing', 'speaking'].map((k) => bai(k, null, '2026-08-17', 'moi')) },
      { studentId: 5, ten: 'E', hanhDong: 'doi', viec: 'thi-lai', attemptNo: 3, loi: null, bai: [bai('listening', '2026-09-14', '2026-10-12')] },
      { studentId: 6, ten: 'F', hanhDong: 'loi', viec: 'chan', attemptNo: 3, loi: 'Chưa có MT2 — xếp MT2 trước rồi mới xếp MT3.', bai: [] },
    ];
    const chu = dong.map((x) => d.chuSeXep(x, null));
    assert(chu[0] === `Dời MT3 · ${d.tuanLich('2026-10-19')} → ${d.tuanLich('2026-10-12')}`, chu[0]);
    assert(chu[1] === 'Xếp nốt W S · MT3', chu[1]);
    assert(chu[2] === `Tạo MT4 · ${d.tuanLich('2026-10-12')}`, chu[2]);
    assert(chu[3].endsWith(' · MT lịch sử'), chu[3]);
    assert(chu[4] === 'Thi lại L · MT3', chu[4]);
    assert(chu[5] === dong[5].loi, chu[5]);
    const t2 = d.tomTatXepMt(dong);
    assert(JSON.stringify(t2) === JSON.stringify({ doi: 1, xepNot: 1, tao: 2, thiLai: 1, canhBao: 1, chan: 1, soEm: 5, soBai: 15 }), JSON.stringify(t2));
  });
}

export async function runPrXlmtMayChu(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));

  /** Thêm một em vào lớp FT, tuần bắt đầu tuần này → lịch MT mặc định (MT1 tuần học 6…). */
  const them = (lop: string, ten: string) => {
    const r = intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test' }] });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  const luotCua = (sid: number) => conn.prepare(
    `SELECT a.id, a.attempt_no AS no FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
      WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
  /** Đưa cả lượt (mọi kỹ năng) về tuần `w` — dựng dữ liệu, không đi đường nghiệp vụ. */
  const datTuan = (attemptId: number, w: number) => {
    conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(w, attemptId);
    conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(w, attemptId);
  };
  const lich = (attemptId: number, skill: string) => conn.prepare(
    `SELECT k.sit_status, k.absence_move_count AS lan, k.required, p.week_start AS tuan FROM attempt_skills k
       LEFT JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`).get(attemptId, skill) as any;
  const diem = (attemptId: number, skill: string, band = 6) => conn.prepare(
    `INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,?,?)`).run(attemptId, skill, band, 30);

  const sX = them('MB FT 101', 'XLMT Em Hai');
  const [m1, m2, m3] = luotCua(sX);
  datTuan(m1.id, tuan(0).id);

  check('PR-XLMT (2) · Dời lịch thi: tuần thi đã bắt đầu → bắt lý do; tuần tương lai → không cần (K4-15)', () => {
    assertThrows(() => skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(1).id, { force: true }),
      /Dời lịch thi: cần ghi lý do/, 'tuần này không lý do');
    assertThrows(() => skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(1).id, { force: true, reason: 'ab' }),
      /ít nhất 5 ký tự/, 'lý do ngắn');
    skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(1).id, { force: true, reason: 'Lịch học đổi' });
    skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(2).id, { force: true });
    assert(lich(m1.id, 'listening').tuan === t.addDays(tuanNay, 14), JSON.stringify(lich(m1.id, 'listening')));
  });

  check('PR-XLMT (2) · Dời hạn chấm (kỹ năng / cả đợt) không lý do → lỗi; có lý do → được (K4-15)', () => {
    const han = t.addDays(tuanNay, 20);
    assertThrows(() => skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', han, null), /Dời hạn chấm: cần ghi lý do/, 'kỹ năng');
    assertThrows(() => attemptsSvc.setDeadlineOverride(P.mbManager, m1.id, han), /Dời hạn chấm: cần ghi lý do/, 'cả đợt');
    skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', han, 'GV ốm tuần này');
    skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', null, null);   // gỡ hạn không cần lý do
  });

  check('PR-XLMT (2) · Bỏ kỹ năng: đã có điểm → "Huỷ điểm"; đã tới tuần thi → "Báo vắng"; tương lai + lý do → được (K4-13)', () => {
    assertThrows(() => attemptsSvc.setSkillSkip(P.mbManager, m1.id, 'reading', true, 'Không thi R đợt này'), /đã tới tuần thi.*Báo vắng/, 'tới tuần');
    diem(m2.id, 'listening');
    assertThrows(() => attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'listening', true, 'Không thi L đợt này'), /đã có điểm.*Huỷ điểm/, 'có điểm');
    assertThrows(() => attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'reading', true, 'ab'), /Bỏ kỹ năng khỏi đợt: lý do cần ít nhất/, 'lý do ngắn');
    attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'reading', true, 'Em miễn R đợt này');
    assert(lich(m2.id, 'reading').required === 0, 'đã bỏ');
    attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'reading', false);
  });

  check('PR-XLMT (2) · Báo vắng (GVCN): lần 1 máy tự dời tuần kế tiếp; lần 2 thành đề nghị + thẻ Lịch thi (K4-28, Q-A)', () => {
    const r1 = absence.baoVang(P.coreTeacher, m1.id, 'speaking', 'Em ốm cả tuần', TODAY);
    assert(r1.daDoi && !r1.choDuyet && r1.tuanMoi === t.addDays(tuanNay, 7), JSON.stringify(r1));
    const l = lich(m1.id, 'speaking');
    assert(l.sit_status === 'scheduled' && l.lan === 1, JSON.stringify(l));
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' AND field = 'speaking'`).get(m1.id) as any;
    assert(/Báo vắng: Em ốm cả tuần/.test(h?.reason ?? ''), JSON.stringify(h));
    const r2 = absence.baoVang(P.coreTeacher, m1.id, 'speaking', 'Em vẫn còn ốm', t.addDays(tuanNay, 8));
    assert(!r2.daDoi && r2.choDuyet, JSON.stringify(r2));
    const yc = conn.prepare(`SELECT 1 FROM yeu_cau_duyet y JOIN skill_move_requests r ON r.id = y.doi_tuong_id
      WHERE r.attempt_id = ? AND r.skill = 'speaking' AND r.status = 'pending'`).get(m1.id);
    assert(yc, 'thiếu thẻ Lịch thi cho đề nghị lần 2');
  });

  check('PR-XLMT (2) · Báo vắng bị chặn: GVBM · tuần tương lai · MT lịch sử · đã có điểm · lý do ngắn', () => {
    assertThrows(() => absence.baoVang(P.subjectTeacher, m1.id, 'writing', 'Em ốm cả tuần', TODAY), /chủ nhiệm/, 'GVBM');
    assertThrows(() => absence.baoVang(P.coreTeacher, m2.id, 'writing', 'Em ốm cả tuần', TODAY), /chưa tới tuần thi/, 'tương lai');
    assertThrows(() => absence.baoVang(P.coreTeacher, m1.id, 'writing', 'ốm', TODAY), /Báo vắng: lý do cần ít nhất/, 'ngắn');
    diem(m1.id, 'reading');
    assertThrows(() => absence.baoVang(P.coreTeacher, m1.id, 'reading', 'Em ốm cả tuần', TODAY), /đã có điểm/, 'có điểm');
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(m3.id);
    try {
      assertThrows(() => absence.baoVang(P.coreTeacher, m3.id, 'writing', 'Em ốm cả tuần', TODAY), /MT lịch sử/, 'lịch sử');
    } finally { conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(m3.id); }
  });

  check('PR-XLMT (2) · Lớp thường Báo vắng có lý do (GVCN): dời tuần sau, nhật ký lịch ghi lý do (K4-32)', () => {
    const LOP = classId('MB FOU 12');
    const NOW = new Date().toISOString();
    const branch = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP) as any).b;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run('XLMT-T1', 'XLMT Lớp Thường', 'xlmt lop thuong', branch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-07-27', 'active', ?)`)
      .run(sid, NOW).lastInsertRowid);
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'progress',?,?,'planned',?)`)
      .run(cy, sid, LOP, tuan(0).id, NOW).lastInsertRowid);
    skillSch.ensureSkillRows(aid);
    assertThrows(() => regular.reportRegularNoShow(P.normalCoreTeacher, aid, 'listening', true, TODAY, 'ab'), /Báo vắng: lý do cần ít nhất/, 'ngắn');
    const r = regular.reportRegularNoShow(P.normalCoreTeacher, aid, 'listening', true, TODAY, 'Em nghỉ có phép');
    assert(r.moved && lich(aid, 'listening').tuan === t.addDays(tuanNay, 7), JSON.stringify(r));
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND field = 'listening' ORDER BY id DESC`).get(aid) as any;
    assert(h?.reason === 'Báo vắng: Em nghỉ có phép', JSON.stringify(h));
  });

  check('PR-XLMT (2) · Thi lại (Quản lý): L đã có điểm → ô trống, lịch sử điểm còn giá trị cũ, chờ thi, tuần mới; GVCN → 403 (T37, Q13)', () => {
    const sT = them('MB FT 101', 'XLMT Em Thi Lại');
    const a = luotCua(sT)[0];
    datTuan(a.id, tuan(0).id);
    attemptsSvc.saveScore(P.lrTeacher, a.id, 'listening', { rawScore: 30 }, TODAY);
    assert(attemptsSvc.scoresOf(a.id).find((s: any) => s.skill === 'listening')?.band != null, 'chưa có điểm L');
    assertThrows(() => keHoach.thiLai(P.coreTeacher, { attemptId: a.id, skills: ['listening'], periodId: tuan(2).id, lyDo: 'Em làm lại bài' }), /Quản lý/, 'GVCN');
    assertThrows(() => keHoach.thiLai(P.mbManager, { attemptId: a.id, skills: ['listening'], periodId: tuan(2).id, lyDo: 'ab' }), /Thi lại: lý do/, 'ngắn');
    keHoach.thiLai(P.mbManager, { attemptId: a.id, skills: ['listening'], periodId: tuan(2).id, lyDo: 'Đề lỗi, thi lại', force: true });
    const s = attemptsSvc.scoresOf(a.id).find((x: any) => x.skill === 'listening');
    assert(s?.band == null && s?.raw_score == null, JSON.stringify(s));
    const l = lich(a.id, 'listening');
    assert(l.sit_status === 'scheduled' && l.tuan === t.addDays(tuanNay, 14), JSON.stringify(l));
    const ls = JSON.stringify(attemptsSvc.scoreHistoryOf(a.id));
    assert(/Đề lỗi, thi lại/.test(ls), `lịch sử điểm thiếu lý do: ${ls.slice(0, 300)}`);
  });

  // ------------------------------------------------------------------ khối 3: Kế hoạch Test — lưới, việc từng em, tuần đã qua
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const dom = await import('../../../shared/domain/index.ts');
  const LOP1 = classId('MB FT 101'), LOP2 = classId('MB FT 102');
  const QL = P.mbManager;
  const hangCua = (lop: number, sid: number) => keHoach.luoiFT(QL, lop, TODAY).hang.find((h: any) => h.studentId === sid);
  const diemDu = (attemptId: number, ks = ['listening', 'reading', 'writing1', 'writing2', 'speaking']) => { for (const k of ks) diem(attemptId, k, 6.5); };
  const bonTuan = (n: number) => ({ listening: tuan(n).id, reading: tuan(n).id, writing: tuan(n).id, speaking: tuan(n).id });

  check('PR-XLMT (3) · Lưới FT: cột tới MT kế tiếp (không cứng 8); em có MT8 → 8 cột, không hơn (T37)', () => {
    const l0 = keHoach.luoiFT(QL, LOP1, TODAY);
    const maxNo = Math.max(3, ...l0.hang.flatMap((h: any) => [h.soKeTiep, ...Object.entries(h.dot).filter(([, v]: any) => v.attemptId).map(([k]) => Number(k))]));
    assert(l0.cot.length === Math.min(8, maxNo) && l0.cot.length < 8, `cột ${l0.cot.length}, mong ${maxNo}`);
    const s8 = them('MB FT 101', 'XLMT Em Tám MT');
    const cy = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(s8) as any).id;
    for (let n = 4; n <= 8; n++) {
      conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,?, 'mock', ?, ?, 'planned', ?)`).run(cy, s8, n, LOP1, tuan(20 + n).id, new Date().toISOString());
    }
    const l8 = keHoach.luoiFT(QL, LOP1, TODAY);
    assert(l8.cot.length === 8 && l8.cot[7] === 8, JSON.stringify(l8.cot));
  });

  check('PR-XLMT (3) · Em chuyển MB FT 101 → MB FT 102 cùng lộ trình vẫn thấy MT1, "+ xếp" đúng số (Q12)', () => {
    const s = them('MB FT 101', 'XLMT Em Chuyển Lớp');
    const mt1 = luotCua(s)[0].id;
    conn.prepare(`UPDATE enrollments SET class_id = ? WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(LOP2, s, LOP1);
    const h = hangCua(LOP2, s);
    assert(h?.dot[1]?.attemptId === mt1 && h.soKeTiep === 4, JSON.stringify(h && { mt1: h.dot[1]?.attemptId, ke: h.soKeTiep }));
  });

  check('PR-XLMT (3) · Chip vắng · chờ Quản lý duyệt · đã huỷ · trễ đúng ô; "cần xếp lại" đếm vắng/huỷ, không đếm chờ duyệt (K4-11, Q7)', () => {
    const dem = () => keHoach.danhSachLop(QL, {}).lop.find((l: any) => l.id === LOP2).canXepLai as number;
    const n0 = dem();
    const sA = them('MB FT 102', 'XLMT Em Chờ Duyệt');
    const a = luotCua(sA)[0].id;
    datTuan(a, tuan(0).id);
    absence.baoVang(P.mbManager, a, 'speaking', 'Em ốm cả tuần', TODAY);
    absence.baoVang(P.mbManager, a, 'speaking', 'Em vẫn còn ốm', t.addDays(tuanNay, 8));
    assert(dem() === n0, `chờ duyệt không phải "cần xếp lại": ${dem()} ≠ ${n0}`);
    const sB = them('MB FT 102', 'XLMT Em Vắng Huỷ');
    const b = luotCua(sB)[0].id;
    datTuan(b, tuan(0).id);
    skillSch.setSitStatus(P.mbManager, b, 'listening', 'absent', 'Em vắng buổi L');
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'reading'`).run(b);
    assert(dem() === n0 + 1, `vắng/huỷ phải đếm 1 em: ${dem()} (trước ${n0})`);
    const sC = them('MB FT 102', 'XLMT Em Trễ');
    datTuan(luotCua(sC)[0].id, tuan(-1).id);
    const ttA = hangCua(LOP2, sA).dot[1].kn, ttB = hangCua(LOP2, sB).dot[1], ttC = hangCua(LOP2, sC).dot[1].kn;
    assert(ttA.speaking.trangThai === 'cho-duyet' && ttA.speaking.choDuyet, `S: ${ttA.speaking.trangThai}`);
    assert(ttB.kn.listening.trangThai === 'vang' && ttB.kn.reading.trangThai === 'da-huy' && ttB.huyPhan, `B: ${ttB.kn.listening.trangThai}/${ttB.kn.reading.trangThai}`);
    assert(ttC.listening.trangThai === 'tre', `trễ: ${ttC.listening.trangThai}`);
    assert(/em cần xếp lại/.test(keHoach.danhSachLop(QL, {}).lop.find((l: any) => l.id === LOP2).tomTat), 'tóm tắt lớp thiếu vế cần xếp lại');
  });

  /* Ba em cho hàng loạt: MT1–MT3 ở các tuần đã qua / tuần này để MT4 tuần sau không vướng T15. */
  const emDu = them('MB FT 101', 'XLMT Em Đủ MT3');
  const emDo = them('MB FT 102', 'XLMT Em Dở MT3');
  const emThieu = them('MB FT 101', 'XLMT Em Thiếu MT2');
  for (const [sid, w3] of [[emDu, -1], [emDo, 0]] as const) {
    const [x1, x2, x3] = luotCua(sid);
    datTuan(x1.id, tuan(-3).id); datTuan(x2.id, tuan(-2).id); datTuan(x3.id, tuan(w3).id);
  }
  diemDu(luotCua(emDu)[2].id);
  diemDu(luotCua(emDo)[2].id, ['listening', 'reading']);
  for (const x of luotCua(emThieu).slice(1)) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(x.id);

  check('PR-XLMT (3) · Hàng loạt 2 lớp, MT3: đủ → Tạo MT4 · dở → Xếp nốt W S (cần lý do) · thiếu MT2 → chặn đúng câu (K4-17)', () => {
    const r1 = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 3, studentIds: [emDu, emThieu], tuan: bonTuan(1), xemTruoc: true }, TODAY);
    const r2 = keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: [emDo], tuan: bonTuan(1), xemTruoc: true }, TODAY);
    const [du, thieu] = r1.dong, [dd] = r2.dong;
    assert(du.hanhDong === 'tao' && du.viec === 'tao' && du.attemptNo === 4, JSON.stringify(du));
    assert(dd.viec === 'xep-not' && dd.bai.filter((b: any) => b.ghiChu !== 'giu').map((b: any) => b.skill).join() === 'writing,speaking' && dd.canLyDo, JSON.stringify(dd));
    assert(thieu.hanhDong === 'loi' && thieu.loi === 'Chưa có MT2 — xếp MT2 trước rồi mới xếp MT3.', JSON.stringify(thieu));
    assert(dom.chuSeXep(dd, null) === 'Xếp nốt W S · MT3', dom.chuSeXep(dd, null));
  });

  check('PR-XLMT (3) · Lưu: dời bài tuần này không lý do → em đó lỗi; có lý do → lưu; em khác vẫn lưu (R9b, K4-15)', () => {
    const r = keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: [emDo], tuan: bonTuan(1), force: true }, TODAY);
    assert(r.daLuu === 0 && /Dời lịch thi: cần ghi lý do/.test(r.dong[0].loi ?? ''), JSON.stringify(r.dong[0]));
    const r2 = keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: [emDo], tuan: bonTuan(1), force: true, lyDo: 'Lịch học đổi' }, TODAY);
    assert(r2.daLuu === 1 && lich(luotCua(emDo)[2].id, 'writing').tuan === t.addDays(tuanNay, 7), JSON.stringify(r2.dong[0]));
  });

  check('PR-XLMT (3) · Ép MT3 đã đủ → "da-du" hỏi thi lại; thi lại L + lý do → lưu: L trống, tuần mới (T37, câu 1 = A)', () => {
    const m3 = luotCua(emDu)[2].id;
    const hoi = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [emDu], tuan: bonTuan(1), dotTheoEm: { [emDu]: 3 }, xemTruoc: true }, TODAY);
    assert(hoi.dong[0].viec === 'da-du' && hoi.dong[0].hanhDong === 'giu' && hoi.dong[0].coDiem.length === 4, JSON.stringify(hoi.dong[0]));
    const luu = keHoach.xepHangLoat(QL, {
      classId: LOP1, attemptNo: 4, studentIds: [emDu], tuan: bonTuan(1), dotTheoEm: { [emDu]: 3 }, thiLai: { [emDu]: ['listening'] },
      lyDo: 'Đề L lỗi, thi lại', force: true,
    }, TODAY);
    assert(luu.daLuu === 1 && luu.dong[0].viec === 'thi-lai', JSON.stringify(luu.dong[0]));
    const s = attemptsSvc.scoresOf(m3).find((x: any) => x.skill === 'listening');
    assert(s?.band == null && lich(m3, 'listening').tuan === t.addDays(tuanNay, 7), JSON.stringify({ s, l: lich(m3, 'listening') }));
  });

  check('PR-XLMT (3) · Tuần đã qua: 4 kỹ năng đã qua + em vào web sau đó → MT lịch sử; trộn qua/tới → chặn; em vào web từ trước → chặn (K2-33, Q8)', () => {
    const s = them('MB FT 101', 'XLMT Em MT Lịch Sử');
    const [x1, x2, x3] = luotCua(s);
    datTuan(x1.id, tuan(-8).id); datTuan(x2.id, tuan(-6).id); datTuan(x3.id, tuan(-4).id);
    const tron = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: { ...bonTuan(1), listening: tuan(-2).id }, xemTruoc: true }, TODAY);
    assert(/cho mọi kỹ năng/.test(tron.dong[0].loi ?? ''), JSON.stringify(tron.dong[0]));
    const xt = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: bonTuan(-2), xemTruoc: true }, TODAY);
    assert(xt.dong[0].hanhDong === 'tao' && xt.dong[0].lichSu && /MT lịch sử$/.test(dom.chuSeXep(xt.dong[0], null)), JSON.stringify(xt.dong[0]));
    const luu = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: bonTuan(-2), force: true }, TODAY);
    assert(luu.daLuu === 1, JSON.stringify(luu.dong[0]));
    const mt4 = conn.prepare(`SELECT lich_su FROM assessment_attempts WHERE student_id = ? AND attempt_no = 4 AND status != 'cancelled'`).get(s) as any;
    assert(mt4?.lich_su === 1, JSON.stringify(mt4));
    conn.prepare(`UPDATE students SET created_at = '2026-07-01' WHERE id = ?`).run(s);
    const cu = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 5, studentIds: [s], tuan: bonTuan(-1), xemTruoc: true }, TODAY);
    assert(/đã có trên web/.test(cu.dong[0].loi ?? ''), JSON.stringify(cu.dong[0]));
  });

  check('PR-XLMT (3) · Xem trước 20 em / 2 lớp ≤ 16 câu SQL mỗi em (không N+1)', () => {
    const ids = (lop: number) => (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 10`).all(lop) as any[]).map((r) => r.student_id);
    const a = ids(LOP1), b = ids(LOP2);
    const n0 = nguCanh.soCauSql();
    keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 3, studentIds: a, tuan: bonTuan(1), xemTruoc: true }, TODAY);
    keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: b, tuan: bonTuan(1), xemTruoc: true }, TODAY);
    const n = nguCanh.soCauSql() - n0;
    assert(n <= 16 * (a.length + b.length), `${n} câu cho ${a.length + b.length} em`);
  });

  check('PR-XLMT (3) · Thêm HV: "Đã thi tới MT6" mà tuần bắt đầu = tuần này → lưu ý lùi Tuần bắt đầu (rà #120)', () => {
    const pv = intake.previewIntake(P.admin, { classId: LOP1, rows: [{ fullName: 'XLMT Nhắc Lùi', email: 'a@b.vn', startWeek: tuanNay, daThiToiMt: '6' }] });
    const y = pv.rows[0].issues.find((x: any) => x.field === 'daThiToiMt' && x.muc === 'luu_y');
    assert(/Đã thi tới MT6 nhưng MT1, MT2.* rơi vào tuần chưa qua/.test(y?.message ?? ''), JSON.stringify(pv.rows[0].issues));
  });

  // ------------------------------------------------------------------ khối 4+: web — đọc nguồn (không dựng trình duyệt)
  const { docSach } = await import('./panelUx3.tests.ts');
  check('PR-XLMT (4) · Hộp thao tác chung: không lý do ghi cứng; nhãn nút và tiêu đề qua CHU_THAO_TAC; dòng thời gian dùng SVG', () => {
    const hop = docSach('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    assert(!/GVCN xác minh|Quản lý chốt trước/.test(hop), 'hộp còn lý do ghi cứng');
    assert(/const ten = CHU_THAO_TAC\[t\]/.test(hop) && /title=\{`\$\{ten\} · \$\{mon\}`\}/.test(hop) && /: ten\}/.test(hop), 'nhãn/tiêu đề phải qua CHU_THAO_TAC');
    assert(/tenMon\(ct, skill\)/.test(hop), 'tên môn phải qua tenMon');
    const dtg = docSach('web/src/modules/fasttrack/DongThoiGianLuot.tsx');
    assert(/<svg/.test(dtg) && !/[✓✕▸◌●○]/.test(dtg), 'biểu tượng dòng thời gian phải là SVG');
    assert(!/KY_NANG_KHONG_KIEM_TRA|KIEM_TRA_LAI_KY_NANG/.test(docSach('web/src/ui/chu.ts')), 'chu.ts còn chữ cũ');
  });

  check('PR-XLMT (5) · Hồ sơ Mock: thao tác theo `thaoTacKyNang`, không còn chữ cũ / hộp trùng; đề nghị dời mở thẻ Lịch thi (T38, #117)', () => {
    const mock = docSach('web/src/modules/fasttrack/MockDetailPage.tsx');
    for (const cu of ["'Ghi nhận vắng'", 'Hẹn xử lý', 'Đổi lịch cả đợt', 'DecideMoveModal', 'SkillWeekModal', 'SkillDeadlineModal', 'RestoreModal']) {
      assert(!mock.includes(cu), `còn "${cu}"`);
    }
    assert(mock.includes('thaoTacKyNang(') && mock.includes('<HopThaoTacMt') && mock.includes('<TheYeuCau') && mock.includes('<DongThoiGianLuot'), 'thiếu nguồn chung');
    assert(!/label: 'Lịch sử'/.test(mock), '"Lịch sử" không nằm trong menu dòng');
  });
}
