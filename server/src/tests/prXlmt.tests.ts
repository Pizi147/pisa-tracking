/** PHÉP KIỂM PR-XLMT — xếp lịch MT nhiều lớp, thao tác MT theo trạng thái (T37, T38). Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrXlmtTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-XLMT · Xếp lịch MT nhiều lớp, thao tác MT theo trạng thái');

  // ------------------------------------------------------------------ khối 1: luật thuần
  const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });

  check('PR-XLMT (1) · trần MT8: kiemSoMtMoi(MT1…MT8, 9) chặn "Tối đa MT8"; thuTuDot MT8 trước Progress Test (T37, K1-21)', () => {
    const ds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => L(n, 'completed', true));
    assert(d.kiemSoMtMoi(ds, 9) === 'Tối đa MT8 cho một lộ trình.', String(d.kiemSoMtMoi(ds, 9)));
    assert(d.thuTuDot('mt:8') < d.thuTuDot('giua') && d.thuTuDot('mt:6') > d.thuTuDot('mt:5'), 'MT6–MT8 xếp trước Progress Test');
    assert(d.thuTuDot('giua') < d.thuTuDot('cuoi') && d.thuTuDot('la') > d.thuTuDot('cuoi'), 'Giữa < Cuối < khoá lạ');
  });

  check('PR-XLMT (1) · viecXepMt: đủ → "đã xong" (PR-MTb thay "tạo MT kế") · dở → xếp nốt · chưa thi → dời · MT cũ → chặn · chờ duyệt / ép / thiếu MT (K4-17)', () => {
    const kn = (o: Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', Partial<{ coDiem: boolean; daThi: boolean; choDuyet: boolean; huyPhan: boolean }>>>) =>
      (['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => ({
        skill, batBuoc: true, coDiem: false, daThi: false, huyPhan: false, choDuyet: false, coTuan: true, ...(o[skill] ?? {}),   // PR-MTb T13b: KnXep có thêm coTuan
      }));
    const du = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { coDiem: true } });
    const so3 = [L(1, 'completed', true), L(2, 'completed', true), L(3)];
    const truoc = [1, 2].map((no) => ({ no, huy: false, lichSu: false, kn: du }));
    // PR-MTb T13b thay K4-17 "đủ → tự sang MT kế": chọn đúng đợt nào là đợt đó — đủ thì chặn "MT3 đã xong.", chọn MT4 mới tạo MT4.
    const v1 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3);
    assert(v1.loai === 'chan' && v1.no === 3 && v1.cau === 'MT3 đã xong.', JSON.stringify(v1));
    const v1b = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 4, so3);
    assert(v1b.loai === 'tao' && v1b.no === 4, JSON.stringify(v1b));
    const v2 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({ listening: { coDiem: true }, reading: { coDiem: true } }) }], 3, so3);
    assert(v2.loai === 'xep-not' && JSON.stringify(v2.kyNang) === '["writing","speaking"]', JSON.stringify(v2));
    const v3 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: kn({}) }], 3, so3);
    assert(v3.loai === 'doi' && v3.no === 3, JSON.stringify(v3));
    const v4 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3);
    // PR-MTGON (luật 5) thay PR-MTb T13b: MT cũ xếp đè được như lượt thường, không tự sang MT4.
    assert(v4.loai === 'doi' && v4.no === 3, `MT cũ → dời: ${JSON.stringify(v4)}`);
    const choS = kn({ listening: { coDiem: true }, reading: { coDiem: true }, writing: { coDiem: true }, speaking: { choDuyet: true } });
    const v5 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: choS }], 3, so3);
    assert(v5.loai === 'chan' && /chờ Quản lý duyệt/.test(v5.cau), JSON.stringify(v5));
    const v6 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: false, kn: du }], 3, so3, true);
    assert(v6.loai === 'da-du' && v6.coDiem.length === 4 && v6.coDiem[0] === 'listening', JSON.stringify(v6));
    const v7 = d.viecXepMt([{ no: 1, huy: false, lichSu: false, kn: du }], 3, [L(1, 'completed', true)]);
    assert(v7.loai === 'chan' && v7.cau === d.kiemSoMtMoi([L(1, 'completed', true)], 3), JSON.stringify(v7));
    const v8 = d.viecXepMt([...truoc, { no: 3, huy: false, lichSu: true, kn: kn({}) }], 3, so3, true);
    assert(v8.loai === 'doi', `ép MT cũ → dời (PR-MTGON): ${JSON.stringify(v8)}`);
  });

  // PR-MTa T1/T4 thay K2-33, Q8: kiemTuanDaQua → kiemTuanXep — Quản lý xếp được tuần đã qua (kể cả trộn), không xét ngày vào web.
  check('PR-XLMT (1) · kiemTuanXep: không qua · GV dời vào tuần qua · QL trộn qua/tới · MT cũ (PR-MTa thay K2-33)', () => {
    const b = { homNay: '2026-09-29' };
    assert(d.kiemTuanXep({ ...b, ketThuc: ['2026-10-04'], quanLy: false }).cau === null, 'tuần này chưa qua');
    assert(d.kiemTuanXep({ ...b, ketThuc: ['2026-09-20'], quanLy: false }).cau === 'Chọn tuần từ tuần này trở đi.', 'GV dời');
    const tron = d.kiemTuanXep({ ...b, ketThuc: ['2026-09-20', '2026-10-04'], quanLy: true });
    assert(tron.cau === null && tron.quaTuan && !tron.mtCu, JSON.stringify(tron));
    const ok = d.kiemTuanXep({ ...b, ketThuc: ['2026-09-06', '2026-09-13'], quanLy: true });
    assert(ok.cau === null && ok.mtCu, JSON.stringify(ok));
  });

  /* PR-MTGON (luật 3) nới K4-27: Quản lý FT "Huỷ kỹ năng" ở mọi trạng thái — đang thi có 4 mục (Báo vắng, Dời hạn, Dời lịch, Huỷ kỹ năng). */
  check('PR-XLMT (1) · thaoTacKyNang: mọi trạng thái × 2⁵ quyền → ≤ 1 nút chính, ≤ 4 mục menu, không trùng, Huỷ kỹ năng chỉ FT', () => {
    const tts = ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su', 'huy-vang'] as const;
    for (const tt of tts) {
      for (let m = 0; m < 32; m++) {
        const q = { nhapDiem: !!(m & 1), quanLy: !!(m & 2), gvcn: !!(m & 4), laFt: !!(m & 8), dotHoanTat: !!(m & 16) };
        const r = d.thaoTacKyNang(tt, q);
        const tat = [...(r.chinh ? [r.chinh] : []), ...r.menu];
        assert(r.menu.length <= 4, `${tt} ${m}: menu ${r.menu.length}`);
        assert(new Set(tat).size === tat.length, `${tt} ${m}: trùng ${tat}`);
        assert(!tat.includes('bo-ky-nang') || q.laFt, `${tt} ${m}: bỏ kỹ năng ở lớp thường`);
        assert(tat.every((x) => !!d.CHU_THAO_TAC[x]), `${tt} ${m}: thiếu chữ`);
      }
    }
    // PR-MTa T7 thay K4-15: dời lịch / báo vắng — lý do tuỳ chọn; huỷ điểm cũng tuỳ chọn (rà #212), không tối thiểu ký tự.
    assert(d.canLyDo('doi-lich') === false && d.canLyDo('bao-vang') === false && !d.canLyDo('huy-diem'), 'canLyDo');   // rà #212: Huỷ điểm lý do tuỳ chọn
    assert(d.kiemLyDoThaoTac('bao-vang', '') === null && d.kiemLyDoThaoTac('huy-diem', ' ') === null && d.kiemLyDoThaoTac('tu-choi', ' ') === 'Từ chối: cần ghi lý do.', 'kiemLyDoThaoTac');
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
    assert(chu[3].endsWith(' · MT cũ'), chu[3]);   // PR-MTa: chữ "MT lịch sử" → "MT cũ"
    assert(chu[4] === 'Thi lại L · MT3', chu[4]);
    assert(chu[5] === dong[5].loi, chu[5]);
    const t2 = d.tomTatXepMt(dong);
    assert(JSON.stringify(t2) === JSON.stringify({ doi: 1, xepNot: 1, tao: 2, thiLai: 1, canhBao: 1, chan: 1, soEm: 5, soBai: 15 }), JSON.stringify(t2));
  });
}

export async function runPrXlmtMayChu(t: YThucTestKit) {
  const { viecTiepLop: vtl } = await import('./viecTiepLop.ts');   // UI-HO-SO-LOP
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
    const r = intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
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

  // PR-MTa T7 thay K4-15: dời lịch thi — lý do tuỳ chọn, kể cả khi tuần thi đã bắt đầu.
  check('PR-XLMT (2) · Dời lịch thi: tuần thi đã bắt đầu hay tương lai đều không cần lý do (PR-MTa T7)', () => {
    skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(1).id, { force: true });
    skillSch.setSkillWeek(P.mbManager, m1.id, 'listening', tuan(2).id, { force: true });
    assert(lich(m1.id, 'listening').tuan === t.addDays(tuanNay, 14), JSON.stringify(lich(m1.id, 'listening')));
  });

  // PR-MTa T7 thay K4-15: dời hạn chấm — lý do tuỳ chọn.
  check('PR-XLMT (2) · Dời hạn chấm (kỹ năng / cả đợt) không lý do → được (PR-MTa T7)', () => {
    const han = t.addDays(tuanNay, 20);
    skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', han, null);
    attemptsSvc.setDeadlineOverride(P.mbManager, m1.id, han);
    attemptsSvc.setDeadlineOverride(P.mbManager, m1.id, null);
    skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', han, 'GV ốm tuần này');
    skillSch.setSkillDeadline(P.mbManager, m1.id, 'reading', null, null);   // gỡ hạn không cần lý do
  });

  // PR-MTGON (luật 3) thay K4-13: Quản lý huỷ kỹ năng lúc nào cũng được; có điểm → 409 "Xoá điểm và huỷ kỹ năng?" (MTG-2a…2c).
  check('PR-XLMT (2) · Huỷ kỹ năng: đã tới tuần thi → được; đã có điểm → 409 hỏi Xoá điểm; tương lai → được, đưa lại được', () => {
    attemptsSvc.setSkillSkip(P.mbManager, m1.id, 'reading', true, 'Không thi R đợt này');
    assert(lich(m1.id, 'reading').required === 0, 'tới tuần: chưa huỷ');
    attemptsSvc.setSkillSkip(P.mbManager, m1.id, 'reading', false);
    diem(m2.id, 'listening');
    const e = (() => { try { attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'listening', true, 'Không thi L đợt này'); } catch (x) { return x as any; } return null; })();
    assert(e?.status === 409 && /Xoá điểm và bỏ khỏi đợt/.test(e.message), `có điểm: ${e?.status} ${e?.message}`);
    attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'reading', true);   // PR-MTa T7: bỏ kỹ năng — lý do tuỳ chọn
    assert(lich(m2.id, 'reading').required === 0, 'đã bỏ');
    attemptsSvc.setSkillSkip(P.mbManager, m2.id, 'reading', false);
  });

  // PR-MTa T3 thay K4-28 lần 2: vắng lần 2 → kỹ năng huỷ (vắng 2 lần), không tự tạo đề nghị; GVCN "Xin dời" mới ra thẻ Lịch thi.
  check('PR-XLMT (2) · Báo vắng (GVCN): lần 1 máy tự dời tuần kế tiếp; lần 2 huỷ, Xin dời → đề nghị + thẻ Lịch thi (PR-MTa T3)', () => {
    const r1 = absence.baoVang(P.coreTeacher, m1.id, 'speaking', 'Em ốm cả tuần', TODAY);
    assert(r1.daDoi && !r1.choDuyet && r1.tuanMoi === t.addDays(tuanNay, 7), JSON.stringify(r1));
    const l = lich(m1.id, 'speaking');
    assert(l.sit_status === 'scheduled' && l.lan === 1, JSON.stringify(l));
    const h = conn.prepare(`SELECT reason FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' AND field = 'speaking'`).get(m1.id) as any;
    assert(/Báo vắng: Em ốm cả tuần/.test(h?.reason ?? ''), JSON.stringify(h));
    const r2 = absence.baoVang(P.coreTeacher, m1.id, 'speaking', 'Em vẫn còn ốm', t.addDays(tuanNay, 8));
    assert(!r2.daDoi && !r2.choDuyet && r2.huyVang, JSON.stringify(r2));
    absence.xinDoi(P.mbManager, m1.id, 'speaking', { lyDo: 'Em vẫn còn ốm', today: t.addDays(tuanNay, 8) });
    const yc = conn.prepare(`SELECT 1 FROM yeu_cau_duyet y JOIN skill_move_requests r ON r.id = y.doi_tuong_id
      WHERE r.attempt_id = ? AND r.skill = 'speaking' AND r.status = 'pending'`).get(m1.id);
    assert(yc, 'thiếu thẻ Lịch thi cho đề nghị lần 2');
  });

  // PR-MTa T7: Báo vắng — lý do tuỳ chọn (bỏ nhánh "lý do ngắn"); chữ "MT lịch sử" → "MT cũ".
  /* LUAT-34: MT cũ không còn bị chặn — Báo vắng ở MT cũ = Đã huỷ ngay (mtTrangThai T06). */
  check('PR-XLMT (2) · Báo vắng bị chặn: GVBM · tuần tương lai · đã có điểm', () => {
    assertThrows(() => absence.baoVang(P.subjectTeacher, m1.id, 'writing', 'Em ốm cả tuần', TODAY), /chủ nhiệm/, 'GVBM');
    assertThrows(() => absence.baoVang(P.coreTeacher, m2.id, 'writing', 'Em ốm cả tuần', TODAY), /chưa tới tuần Test/, 'tương lai');
    diem(m1.id, 'reading');
    assertThrows(() => absence.baoVang(P.coreTeacher, m1.id, 'reading', 'Em ốm cả tuần', TODAY), /đã có điểm/, 'có điểm');
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

  check('PR-XLMT (3) · Lưới FT: cột tới MT lớn nhất có lượt (UI-CHAM-TEST, C20: MT kế tiếp không mở cột trống; không cứng 8); em có MT8 → 8 cột, không hơn (T37)', () => {
    const l0 = keHoach.luoiFT(QL, LOP1, TODAY);
    const maxNo = Math.max(3, ...l0.hang.flatMap((h: any) => Object.entries(h.dot).filter(([, v]: any) => v.attemptId).map(([k]) => Number(k))));
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
    /* PR-MTa T3: vắng lần 2 huỷ kỹ năng; đề nghị chờ duyệt dựng qua "Xin dời". */
    absence.baoVang(P.mbManager, a, 'speaking', 'Em vẫn còn ốm', t.addDays(tuanNay, 8));
    absence.xinDoi(P.mbManager, a, 'speaking', { today: t.addDays(tuanNay, 8) });
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

  // PR-MTa T7 (G17): `canLyDo` luôn false — xếp nốt không còn đòi lý do.
  check('PR-XLMT (3) · Hàng loạt 2 lớp, MT3: đủ → "MT3 đã xong." (PR-MTb thay Tạo MT4) · dở → Xếp nốt W S · thiếu MT2 → chặn đúng câu (K4-17)', () => {
    const r1 = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 3, studentIds: [emDu, emThieu], tuan: bonTuan(1), xemTruoc: true }, TODAY);
    const r2 = keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: [emDo], tuan: bonTuan(1), xemTruoc: true }, TODAY);
    const [du, thieu] = r1.dong, [dd] = r2.dong;
    // PR-MTb T13b thay K4-17 "đủ → Tạo MT4": chọn MT3 là MT3 — đủ rồi thì dòng lỗi; muốn MT4 thì chọn MT4 (hoặc "MT mới").
    assert(du.hanhDong === 'loi' && du.viec === 'chan' && du.attemptNo === 3 && du.loi === 'MT3 đã xong.', JSON.stringify(du));
    const r4 = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [emDu], tuan: bonTuan(1), xemTruoc: true }, TODAY);
    assert(r4.dong[0].hanhDong === 'tao' && r4.dong[0].viec === 'tao' && r4.dong[0].attemptNo === 4, JSON.stringify(r4.dong[0]));
    assert(dd.viec === 'xep-not' && dd.bai.filter((b: any) => b.ghiChu !== 'giu').map((b: any) => b.skill).join() === 'writing,speaking' && !dd.canLyDo, JSON.stringify(dd));
    assert(thieu.hanhDong === 'loi' && thieu.loi === 'Chưa có MT2 — xếp MT2 trước rồi mới xếp MT3.', JSON.stringify(thieu));
    assert(dom.chuSeXep(dd, null) === 'Xếp nốt W S · MT3', dom.chuSeXep(dd, null));
  });

  // PR-MTa T7 thay K4-15: dời bài tuần này không lý do → lưu.
  check('PR-XLMT (3) · Lưu: dời bài tuần này không lý do → lưu (PR-MTa T7)', () => {
    const r2 = keHoach.xepHangLoat(QL, { classId: LOP2, attemptNo: 3, studentIds: [emDo], tuan: bonTuan(1), force: true }, TODAY);
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

  // PR-MTa T1/T4 thay K2-33, Q8: QL xếp tuần đã qua — trộn qua/tới được, không xét ngày vào web; MT cũ = tuần muộn nhất cách ≥ 2 tuần.
  check('PR-XLMT (3) · Tuần đã qua: 4 kỹ năng cách 2 tuần → MT cũ; trộn qua/tới → được (MT thường); em vào web từ trước → được (PR-MTa)', () => {
    const s = them('MB FT 101', 'XLMT Em MT Cũ');
    const [x1, x2, x3] = luotCua(s);
    datTuan(x1.id, tuan(-8).id); datTuan(x2.id, tuan(-6).id); datTuan(x3.id, tuan(-4).id);
    const tron = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: { ...bonTuan(1), listening: tuan(-2).id }, xemTruoc: true }, TODAY);
    assert(tron.dong[0].hanhDong === 'tao' && !tron.dong[0].lichSu, JSON.stringify(tron.dong[0]));
    const xt = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: bonTuan(-2), xemTruoc: true }, TODAY);
    assert(xt.dong[0].hanhDong === 'tao' && xt.dong[0].lichSu && /MT cũ$/.test(dom.chuSeXep(xt.dong[0], null)), JSON.stringify(xt.dong[0]));
    conn.prepare(`UPDATE students SET created_at = '2026-07-01' WHERE id = ?`).run(s);
    const luu = keHoach.xepHangLoat(QL, { classId: LOP1, attemptNo: 4, studentIds: [s], tuan: bonTuan(-2), force: true }, TODAY);
    assert(luu.daLuu === 1, JSON.stringify(luu.dong[0]));
    const mt4 = conn.prepare(`SELECT lich_su FROM assessment_attempts WHERE student_id = ? AND attempt_no = 4 AND status != 'cancelled'`).get(s) as any;
    assert(mt4?.lich_su === 1, JSON.stringify(mt4));
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
    const pv = intake.previewIntake(P.admin, { classId: LOP1, rows: [{ fullName: 'XLMT Nhắc Lùi', dob: '2010-01-01', email: emailThu(), startWeek: tuanNay, daThiToiMt: '6' }] });
    const y = pv.rows[0].issues.find((x: any) => x.field === 'daThiToiMt' && x.muc === 'luu_y');
    assert(/Đã thi tới MT6 nhưng MT1, MT2.* rơi vào tuần chưa qua/.test(y?.message ?? ''), JSON.stringify(pv.rows[0].issues));
  });

  // ------------------------------------------------------------------ sửa theo rà #126
  const classSvc: any = await import('../classes/classes.ts');
  // PR-MTa T4 thay K2-33: Quản lý dời lượt chưa thi vào tuần đã qua được (dời thẳng, lưu đợt); THI LẠI vẫn chặn (thi thật, cần tuần tới).
  check('PR-XLMT (rà #126) · Tuần đã qua: QL dời thẳng / lưu đợt được (PR-MTa T4); thi lại vẫn chặn, điểm cũ còn nguyên', () => {
    const s = them('MB FT 101', 'XLMT Rà Tuần Qua');
    const a = luotCua(s)[0];
    datTuan(a.id, tuan(0).id);
    skillSch.setSkillWeek(QL, a.id, 'reading', tuan(-2).id, { force: true });
    assert(lich(a.id, 'reading').tuan === t.addDays(tuanNay, -14), 'dời thẳng');
    keHoach.luuDot(QL, { attemptId: a.id, force: true, kyNang: [{ skill: 'writing', periodId: tuan(-2).id }] });
    assert(lich(a.id, 'writing').tuan === t.addDays(tuanNay, -14), 'lưu đợt');
    attemptsSvc.saveScore(P.lrTeacher, a.id, 'listening', { rawScore: 30 }, TODAY);
    assertThrows(() => keHoach.thiLai(QL, { attemptId: a.id, skills: ['listening'], periodId: tuan(-2).id, lyDo: 'Đề lỗi, thi lại', force: true }),
      /Thi lại: chọn tuần từ tuần này trở đi/, 'thi lại');
    assert(attemptsSvc.scoresOf(a.id).find((x: any) => x.skill === 'listening')?.band != null, 'thi lại bị chặn thì điểm cũ còn nguyên (một tx)');
  });

  check('PR-XLMT (rà #126) · Thi lại chỉ cho kỹ năng ĐÃ CÓ ĐIỂM — vắng/chưa điểm bị chặn', () => {
    const s = them('MB FT 101', 'XLMT Rà Thi Lại Trống');
    const a = luotCua(s)[0];
    datTuan(a.id, tuan(0).id);
    assertThrows(() => keHoach.thiLai(QL, { attemptId: a.id, skills: ['speaking'], periodId: tuan(1).id, lyDo: 'Đề lỗi, thi lại' }), /chưa có điểm — không thi lại/, 'chưa điểm');
  });

  check('PR-XLMT (rà #126) · Quản lý không nhận "Nhập điểm" của GV làm việc của mình; GVBM vẫn có (mySkills, không phải editableSkills)', () => {
    const s = them('MB FT 101', 'XLMT Rà Việc Của Tôi');
    datTuan(luotCua(s)[0].id, tuan(0).id);
    const hangQL = classSvc.classRoster(QL, LOP1).find((r: any) => r.studentId === s || r.id === s);
    const hangGV = classSvc.classRoster(P.lrTeacher, LOP1).find((r: any) => r.studentId === s || r.id === s);
    assert(hangQL && hangQL.myPending.length === 0 && !(vtl(QL, LOP1).get(hangQL.id) ?? []).some((v: any) => /Nhập điểm/.test(JSON.stringify(v))), `QL: ${JSON.stringify(hangQL?.myPending)}`);
    assert(hangGV && hangGV.myPending.includes('listening'), `GV L phải có việc nhập L: ${JSON.stringify(hangGV?.myPending)}`);
    const quanLyCo = classSvc.classRoster(QL, LOP1).filter((r: any) => r.myPending.length > 0).length;
    assert(quanLyCo === 0, `QL không được có việc Nhập điểm ở hàng nào (${quanLyCo} hàng)`);
  });

  check('PR-XLMT (rà #126) · Huỷ điểm Writing: W1 + W2 một giao dịch — ô sau lỗi quyền thì ô trước cuộn lại, không còn nửa điểm', () => {
    const s = them('MB FT 101', 'XLMT Rà Huỷ W');
    const a = luotCua(s)[0];
    datTuan(a.id, tuan(0).id);
    attemptsSvc.saveScore(P.w1Teacher, a.id, 'writing1', { criteria: [6, 6, 6, 6] }, TODAY);
    attemptsSvc.saveScore(P.w2Teacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }, TODAY);
    const band = (e: string) => attemptsSvc.scoresOf(a.id).find((x: any) => x.skill === e)?.band ?? null;
    assertThrows(() => keHoach.huyDiem(P.w1Teacher, { attemptId: a.id, skill: 'writing', lyDo: 'Nhập nhầm bài' }), /./, 'GV W1 không huỷ được W2');
    assert(band('writing1') !== null && band('writing2') !== null, 'lỗi ở W2 → W1 cuộn lại');
    keHoach.huyDiem(QL, { attemptId: a.id, skill: 'writing', lyDo: ' ' });   // rà #212 thay PR-MTa T7: lý do tuỳ chọn
    assert(band('writing1') === null && band('writing2') === null, 'QL huỷ cả hai ô');
  });

  check('PR-XLMT (rà #126) · Quản lý ghi "-" đè ô ĐÃ CÓ ĐIỂM bị từ chối (FT và lớp thường) — muốn xoá điểm thì Huỷ điểm có lý do', () => {
    const s = them('MB FT 101', 'XLMT Rà Dấu Đè');
    const a = luotCua(s)[0];
    datTuan(a.id, tuan(0).id);
    attemptsSvc.saveScore(QL, a.id, 'reading', { rawScore: 30 }, TODAY);
    assertThrows(() => attemptsSvc.saveScore(QL, a.id, 'reading', { noShow: true, lyDo: 'Em nghỉ ốm có phép' }, TODAY), /không xoá được điểm/, 'FT');
    const lop = classId('MB FOU 12');
    const at = (conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = 'listening' AND s.raw_score IS NOT NULL
      WHERE a.class_id = ? AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`).get(lop) as any)?.id;
    assert(at, 'Seed: MB FOU 12 cần một bài có điểm L');
    assertThrows(() => regular.reportRegularNoShow(QL, at, 'listening', true, TODAY, 'Em nghỉ ốm có phép'), /đã có điểm/, 'lớp thường');
  });

  // ------------------------------------------------------------------ khối 4+: web — đọc nguồn (không dựng trình duyệt)
  const { docSach } = await import('./panelUx3.tests.ts');
  check('PR-XLMT (4) · Hộp thao tác chung: không lý do ghi cứng; nhãn nút và tiêu đề qua CHU_THAO_TAC; dòng thời gian dùng SVG', () => {
    const hop = docSach('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    assert(!/GVCN xác minh|Quản lý chốt trước/.test(hop), 'hộp còn lý do ghi cứng');
    /* OV-11a: "Vắng" sau tuần thi đổi tên thành "Không dự thi" — vẫn lấy từ CHU_THAO_TAC ở mọi trường hợp khác. */
    assert(/const ten = [^;\n]*CHU_THAO_TAC\[tt?\]/.test(hop) && /(title|tieuDe)=\{`\$\{ten\} · \$\{mon\}`\}/.test(hop)   /* PR-LM: KhungPanel dùng tieuDe */ && /: ten\}/.test(hop), 'nhãn/tiêu đề phải qua CHU_THAO_TAC');
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

  check('PR-XLMT (7) · Ngăn Xếp lịch MT vẽ theo máy chủ (`chuSeXep`, `viec`), không tự suy việc; khung Lớp thường không còn lưới FT; mặc định tuần tới', () => {
    const ngan = docSach('web/src/modules/test/keHoach/NganXepLichMt.tsx');
    // PR-MTb T3 thay `chuSeXep(d, null)` bằng `nhanSeXep(d, null)` (cột "Sẽ xếp" một dòng, mockup phần 1; `nhanSeXep` gọi lại `chuSeXep` cho tooltip).
    assert(/nhanSeXep\(d, null\)/.test(ngan) && /d\.viec/.test(ngan) && /tomTatXepMt\(/.test(ngan), 'ngăn phải dùng nhanSeXep / viec / tomTatXepMt');
    assert(!/viecXepMt\(/.test(ngan), 'web không tự gọi viecXepMt — việc do máy chủ chọn');
    assert(/tuanMacDinhDotMoi\(/.test(ngan) && /tuanMacDinhDotMoi\(/.test(docSach('web/src/modules/test/keHoach/HopKyNang.tsx')), 'mặc định tuần tới (K4-14)');
    const thuong = docSach('web/src/modules/test/keHoach/NganXepHangLoat.tsx');
    assert(!thuong.includes('/ke-hoach-test/ft/'), 'khung Lớp thường còn tải lưới FT');
  });
}
