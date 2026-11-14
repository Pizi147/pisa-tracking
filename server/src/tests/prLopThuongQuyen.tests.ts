/**
 * LOP-THUONG-QUYEN (chủ SP 08/11: "MT0 Speaking thì vẫn là chấm chéo, vẫn phải hiện các lớp khác"):
 *  · ô S của lượt MT0 (lớp thường) = chấm chéo như S Mock FT — không GV mặc định (`laChamCheo`);
 *  · GV có kỹ năng S (không phân công) thấy MT0 S các lớp thường cùng chi nhánh ở hàng đợi Chấm Speaking + Công việc, nhập được ô S;
 *  · KHÔNG mở: L/R/W của MT0, S Progress / Final lớp thường, chi nhánh khác.
 */
import fs from 'node:fs';
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopThuongQuyenTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const perm: any = await import('../permissions.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const absenceMod: any = await import('../fasttrack/absence.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nLOP-THUONG-QUYEN · MT0 Speaking chấm chéo: GV kỹ năng S thấy + chấm MT0 S các lớp thường cùng chi nhánh');
  (await import('../fasttrack/conOCho.ts')).capNhatConOChoTatCa();

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FOU 12');
  const tao = (branch: string, tag: string) => accounts.createAccount(P.admin, {
    email: `ltq.${tag}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ltq', fullName: `Thử LTQ ${tag}`, roles: [{ role: 'teacher', branches: [branch] }], skills: ['speaking'],
  }).userId as number;
  const idS = tao('MB', 's');
  const khacCn = one(`SELECT code FROM branches WHERE id != (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, LOP).code as string;
  const idKhac = tao(khacCn, 'khac');
  const gvS = () => perm.loadPrincipal(idS);

  /** Em mới ở lớp thường + MT0 (tuần này) + Final (tuần này) — đủ ô S để so. */
  const emMt0 = () => {
    const now = new Date().toISOString();
    const tag = `LTQ-${Math.random().toString(36).slice(2, 7)}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, one('SELECT branch_id b FROM classes WHERE id = ?', LOP).b, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, '2026-01-01', now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-01-01', 'active', ?)`)
      .run(sid, now).lastInsertRowid);
    const tuan = week.ensurePeriod(d.mondayOfDate(TODAY)).id;
    const luot = (kind: string, no: number) => {
      const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,?,?,?, 'planned', ?)`)
        .run(cy, sid, no, kind, LOP, tuan, now).lastInsertRowid);
      skillSch.ensureSkillRows(aid);
      return aid;
    };
    const mt0 = luot('mt0', 0), fin = luot('final', 2);
    return { sid, mt0, fin };
  };

  check('LTQ-1 · quyền: GV kỹ năng S có lớp thường cùng chi nhánh — chỉ ô S của lượt MT0; Final / L R W / chi nhánh khác không', () => {
    const p = gvS();
    assert(!p.assignments.length && perm.lopMt0ChoGvSpeaking(p, TODAY).includes(LOP), 'lớp thường MB phải trong phạm vi MT0');
    assert(!perm.lopFtChoGvSpeaking(p, TODAY).includes(LOP), 'lopFtChoGvSpeaking giữ chỉ lớp FT');
    assert(perm.coTheXemLuotCham(p, { classId: LOP, kind: 'mt0' }), 'xem lưới MT0');
    assert(!perm.coTheXemLuotCham(p, { classId: LOP }) && !perm.coTheXemLuotCham(p, { classId: LOP, kind: 'final' }), 'không mở lượt khác của lớp thường');
    const mt0 = { lich_su: 0, kind: 'mt0' };
    assert(perm.editableSkills(p, LOP, ['speaking', 'listening', 'writing1'], mt0).join() === 'speaking', 'MT0: chỉ ô S');
    assert(!perm.editableSkills(p, LOP, ['speaking'], { lich_su: 0, kind: 'final' }).length && !perm.editableSkills(p, LOP, ['speaking']).length, 'Final / không rõ lượt: đóng');
    assert(perm.scoreEditPath(p, LOP, 'speaking', mt0) === 'assigned' && perm.scoreEditPath(p, LOP, 'speaking') === null, 'đường ghi');
    const k = perm.loadPrincipal(idKhac);
    assert(!perm.lopMt0ChoGvSpeaking(k, TODAY).includes(LOP) && !perm.coTheXemLuotCham(k, { classId: LOP, kind: 'mt0' }), 'chi nhánh khác không mở');
  });

  check('LTQ-2 · MT0 S vào hàng đợi Chấm Speaking + việc Công việc của GV S; Final S không; ô S MT0 không là việc của ai', () => thu(() => {
    const e = emMt0();
    const q = svc.baiChamSpeaking(gvS(), TODAY);
    const dong = q.rows.find((r: any) => r.attemptId === e.mt0);
    assert(dong && dong.cho && dong.cell.skill === 'speaking' && dong.cell.canEdit, `MT0 S phải có trong hàng đợi, chấm được: ${JSON.stringify(dong?.cell ?? null)}`);
    assert(!q.rows.some((r: any) => r.attemptId === e.fin), 'Final không vào hàng đợi S chéo');
    const viec = ((mywork.myWork(gvS()).dong ?? []) as any[]).find((x) => x.key === d.KHOA_CHAM_SPEAKING);
    assert(viec && viec.soBai === q.soBai, `việc Chấm Speaking = hàng đợi (${viec?.soBai} / ${q.soBai})`);
    assert(d.laChamCheo('mt0', 'speaking') && !d.laChamCheo('final', 'speaking'), 'cờ chấm chéo');
  }));

  check('LTQ-3 · GV S lưu ô S MT0 được; L MT0 và S Final lớp thường bị chặn; GV chi nhánh khác bị chặn', () => thu(() => {
    const e = emMt0();
    svc.saveScore(gvS(), e.mt0, 'speaking', { band: 6 }, TODAY);
    assert(one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.mt0)?.band === 6, 'ô S MT0 phải lưu');
    assertThrows(() => svc.saveScore(gvS(), e.mt0, 'listening', { band: 6 }, TODAY), /./, 'GV S nhập L MT0');
    assertThrows(() => regular.saveRegularScore(gvS(), e.fin, 'speaking', { score: 10, total: 20 }), /./, 'GV S nhập S Final lớp thường');
    assertThrows(() => svc.saveScore(perm.loadPrincipal(idKhac), e.mt0, 'speaking', { band: 5 }, TODAY), /./, 'GV S chi nhánh khác');
  }));

  /* B' 6a (chủ SP 10/11 tối): GV S chéo gỡ được "-" đã chốt ở MT0 S (Bỏ vắng) — như GV chấm ô đó; L MT0 và chi nhánh khác vẫn không. */
  check('LTQ-4 · GV S chéo "Bỏ vắng" ở MT0 S: "-" đã chốt gỡ được (ô mở lại); GV chi nhánh khác bị chặn', () => thu(() => {
    const e = emMt0();
    const tuan = one(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`, e.mt0).p;
    const chot = () => {
      conn.prepare(`INSERT OR REPLACE INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at, no_show_settled_at, no_show_late) VALUES (?, 'speaking', ?, ?, ?, 0)`)
        .run(e.mt0, tuan, '2026-01-05T03:00:00.000Z', '2026-01-05T03:00:00.000Z');
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent', absent_from_no_show = 1 WHERE attempt_id = ? AND skill = 'speaking'`).run(e.mt0);
      xoaNho();
    };
    chot();
    assertThrows(() => svc.saveScore(perm.loadPrincipal(idKhac), e.mt0, 'speaking', { noShow: false }, TODAY), /./, 'GV S chi nhánh khác gỡ');
    svc.saveScore(gvS(), e.mt0, 'speaking', { noShow: false }, TODAY);
    const sc = one(`SELECT no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.mt0);
    const k = one(`SELECT sit_status FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`, e.mt0);
    assert(!sc?.no_show_period_id && k.sit_status === 'scheduled', `Bỏ vắng: ${JSON.stringify([sc, k])}`);
  }));

  /* LG-9 (chủ SP 15/11 lời 32: "đã có chữ MT thì tức là Mock test, tính như luật MT bình thường"): MT0 — kể cả MT0 ở lớp THƯỜNG — "-" theo N38 như Mock: lần 1 dời, lần 2 huỷ (thay ngoại lệ PTA 14/11). */
  check('LTQ-VANG · MT0 lớp thường "-" lần 1 dời tuần sau tuần thi (lưới MT0 tuần mới có em), xoá "-" về tuần gốc, lần 2 HUỶ; nút Vắng cùng luật', () => thu(() => {
    const e = emMt0();
    const tuan = d.mondayOfDate(TODAY);
    const ky = (s: string) => one(`SELECT k.sit_status AS sit, k.huy_vang AS huy, k.absence_move_count AS lan, rp.week_start AS ws FROM attempt_skills k
      JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`, e.mt0, s);
    const coO = (ws: string) => svc.classScoreSheet(P.mbManager, LOP, { theo: 'mt0', periodId: week.ensurePeriod(ws).id }, TODAY).rows.some((r: any) => r.attemptId === e.mt0);
    const r1 = svc.saveScore(P.mbManager, e.mt0, 'listening', { noShow: true }, TODAY);
    assert(r1.vang?.kq === 'doi' && ky('listening').ws.slice(0, 10) === d.addDaysIso(tuan, 7) && ky('listening').lan === 1, `lần 1: ${JSON.stringify([r1.vang, ky('listening')])}`);
    assert(coO(d.addDaysIso(tuan, 7)), 'việc nhập điểm MT0 theo tuần mới');
    svc.saveScore(P.mbManager, e.mt0, 'listening', { noShow: false }, TODAY);
    assert(ky('listening').ws.slice(0, 10) === tuan && ky('listening').lan === 0 && ky('listening').sit === 'scheduled', `xoá "-": về tuần gốc, trừ một lần: ${JSON.stringify(ky('listening'))}`);
    svc.saveScore(P.mbManager, e.mt0, 'listening', { noShow: true }, TODAY);
    const r2 = svc.saveScore(P.mbManager, e.mt0, 'listening', { noShow: true }, d.addDaysIso(TODAY, 7));
    const k2 = ky('listening');
    assert(r2.vang?.kq === 'huy' && k2.sit === 'cancelled' && k2.huy === 1, `lần 2 phải huỷ: ${JSON.stringify([r2.vang, k2])}`);
    const absence: any = absenceMod;
    absence.baoVang(P.mbManager, e.mt0, 'reading', null, TODAY);
    const b = absence.baoVang(P.mbManager, e.mt0, 'reading', null, d.addDaysIso(TODAY, 7));
    assert(b.huyVang && ky('reading').sit === 'cancelled', `nút Vắng lần 2: ${JSON.stringify([b, ky('reading')])}`);
  }));

  /* LG-9 (chủ SP 15/11): Progress / Final lớp thường KHÔNG tự huỷ — GV môn / GVCN / QL "Huỷ môn" tay môn đang vắng (một bấm), Hoàn tác / Khôi phục về đúng tuần. MT0 không có (tự huỷ lần 2). */
  check('LTQ-HUY-TAY · Huỷ môn (Final lớp thường): chưa vắng → 400; vắng → huỷ, hết việc; Hoàn tác về đúng tuần, giữ dấu; GV ngoài môn / chi nhánh khác 403; MT0 → 400', () => thu(() => {
    const e = emMt0();
    const absence: any = absenceMod;
    const ky = (id: number, s: string) => one(`SELECT sit_status AS sit, huy_vang AS huy, planned_period_id AS w, absence_move_count AS lan FROM attempt_skills WHERE attempt_id = ? AND skill = ?`, id, s);
    /* NHAP-DIEM-a: Huỷ điểm mọi loại bài (MT0 có), không cần đã vắng — phép kiểm riêng ở prNhapDiemTuDo. */
    regular.reportRegularNoShow(P.mbManager, e.fin, 'listening', true, TODAY);
    const truoc = ky(e.fin, 'listening');
    assertThrows(() => absence.huyTay(perm.loadPrincipal(idKhac), e.fin, 'listening', true), /người nhập được ô/, 'chi nhánh khác 403');
    assertThrows(() => absence.huyTay(gvS(), e.fin, 'listening', true), /người nhập được ô/, 'GV ngoài môn 403');
    xoaNho(); let s0 = soCauSql(); absence.huyTay(P.mbManager, e.fin, 'listening', true); const nHuy = soCauSql() - s0;
    assert(nHuy <= TRAN_GHI_LO.huyTay, `trần câu Huỷ môn: ${nHuy} > ${TRAN_GHI_LO.huyTay}`);
    assert(ky(e.fin, 'listening').sit === 'cancelled' && ky(e.fin, 'listening').huy === 1, `Final huỷ: ${JSON.stringify(ky(e.fin, 'listening'))}`);
    xoaNho();
    const o = regular.regularSheet(P.mbManager, LOP).rows.find((r: any) => r.attemptId === e.fin)?.skillSchedule.find((x: any) => x.skill === 'listening');
    assert(o?.progress === 'cancelled' && o.huyTay && !o.overdue && !o.deadline, `lưới lớp thường hết việc: ${JSON.stringify(o)}`);
    xoaNho(); s0 = soCauSql(); absence.huyTay(P.mbManager, e.fin, 'listening', false); const nBo = soCauSql() - s0;
    assert(nBo <= TRAN_GHI_LO.huyTay, `trần câu Hoàn tác: ${nBo} > ${TRAN_GHI_LO.huyTay}`);
    const sau = ky(e.fin, 'listening');
    assert(sau.sit === 'scheduled' && !sau.huy && sau.w === truoc.w && sau.lan === truoc.lan, `Hoàn tác: ${JSON.stringify([truoc, sau])}`);
    const q = { nhapDiem: true, quanLy: false, gvcn: false, laFt: false, dotHoanTat: false, khongTuHuy: true };
    assert(d.thaoTacKyNang('dang-thi', { ...q, vang: true }).menu.includes('huy-diem') && d.thaoTacKyNang('dang-thi', { ...q, vang: false }).menu.includes('huy-diem'), 'menu Huỷ điểm (NHAP-DIEM-a: cả khi chưa vắng)');
    assert(d.thaoTacKyNang('da-huy', { ...q, huyTay: true }).menu.includes('khoi-phuc-diem'), 'menu Khôi phục');
    const hop = fs.readFileSync('web/src/modules/fasttrack/MockDetailPage.tsx', 'utf8');
    assert(!hop.includes('khongTuHuy'), 'trang MT không có Huỷ môn');
  }));

  /* LG-9b (chủ SP 15/11 "Tính trên môn còn lại"): môn đã Huỷ môn ra khỏi % tổng / đạt — MỘT hàm `evaluateRegular` cho mọi nơi. */
  check('LTQ-PHAN-TRAM · % tổng tính trên môn còn lại: hàm thuần (môn huỷ, huỷ hết môn, môn huỷ có điểm vẫn tính) + Final thật (3 môn có điểm, Huỷ môn L) ở regularResultOf / regularSheet; Khôi phục → lại chờ', () => thu(() => {
    const ev = regular.evaluateRegular;
    const mon = ['listening', 'reading', 'writing', 'speaking'];
    const diem = [{ skill: 'reading', raw_score: 30, raw_total: 40 }, { skill: 'writing', raw_score: 14, raw_total: 20 }, { skill: 'speaking', raw_score: 18, raw_total: 20 }];
    const lich = mon.map((k) => ({ skill: k, sit_status: k === 'listening' ? 'cancelled' : 'scheduled' }));
    const r1 = ev(mon, diem, 'FOU', 0.7, null, lich);
    assert(r1.complete && r1.required === 3 && JSON.stringify(r1.daHuy) === '["listening"]' && Math.abs(r1.tyLeTong - 62 / 80) < 1e-9, `một môn huỷ: ${JSON.stringify(r1)}`);
    const r0 = ev(mon, diem, 'FOU', 0.7, null);
    assert(!r0.complete && r0.tyLeTong === null && r0.daHuy.length === 0, 'không truyền lịch → như cũ (chờ L)');
    const rHet = ev(mon, [], 'FOU', 0.7, null, mon.map((k) => ({ skill: k, sit_status: 'cancelled' })));
    assert(rHet.required === 0 && !rHet.complete && rHet.tyLeTong === null && rHet.daHuy.length === 4, `huỷ hết: ${JSON.stringify(rHet)}`);
    const rCoDiem = ev(mon, [...diem, { skill: 'listening', raw_score: 20, raw_total: 40 }], 'FOU', 0.7, null, lich);
    assert(rCoDiem.required === 4 && rCoDiem.daHuy.length === 0, 'môn huỷ mà có điểm vẫn tính');
    /* Final thật */
    const e = emMt0();
    const monFin: string[] = regular.regularResultOf(e.fin).skills.map((x: any) => x.skill);
    const conLai = monFin.filter((k) => k !== 'listening');
    for (const k of conLai) regular.saveRegularScore(P.mbManager, e.fin, k, { score: 15, total: 20 }, TODAY);
    regular.reportRegularNoShow(P.mbManager, e.fin, 'listening', true, TODAY);
    absenceMod.huyTay(P.mbManager, e.fin, 'listening', true);
    xoaNho();
    const kq = regular.regularResultOf(e.fin);
    assert(kq.complete && kq.required === conLai.length && kq.daHuy.includes('listening') && Math.abs(kq.tyLeTong - 0.75) < 1e-9, `regularResultOf: ${JSON.stringify(kq)}`);
    const dong = regular.regularSheet(P.mbManager, LOP).rows.find((r: any) => r.attemptId === e.fin);
    assert(dong.result.complete && Math.abs(dong.result.tyLeTong - 0.75) < 1e-9 && dong.result.daHuy.includes('listening'), `lưới: ${JSON.stringify(dong.result)}`);
    absenceMod.huyTay(P.mbManager, e.fin, 'listening', false);
    xoaNho();
    assert(!regular.regularResultOf(e.fin).complete, 'Khôi phục → lại chờ L');
  }));

  /* B' 6b (chủ SP 10/11 tối): Kế hoạch Test của GV S hiện lớp thường CÓ MT0 — chỉ xem, chỉ ô MT0 (Giữa / Cuối khoá vẫn chỉ GV lớp thấy, chủ SP 08/11). */
  check('LTQ-5 · Kế hoạch Test GV S: lớp thường có MT0 vào danh sách, chỉ xem, chỉ em có MT0, không lộ Final; lớp không MT0 không vào; QL thấy đủ', () => thu(() => {
    const coLop = () => kh.danhSachLop(gvS(), {}).lop.some((l: any) => l.id === LOP);
    const truoc = coLop();
    const e = emMt0();
    xoaNho();
    assert(coLop(), 'lớp thường có MT0 phải vào danh sách của GV S');
    if (!truoc) {
      conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(e.mt0); xoaNho();
      assert(!coLop(), 'MT0 huỷ hết → lớp ra khỏi danh sách');
      conn.prepare(`UPDATE assessment_attempts SET status = 'planned' WHERE id = ?`).run(e.mt0); xoaNho();
    }
    const l = kh.luoiThuong(gvS(), LOP, TODAY);
    assert(l.chiXem && l.chiMt0, `chỉ xem + chỉ MT0: ${l.chiXem} ${l.chiMt0}`);
    const h = l.hang.find((x: any) => x.studentId === e.sid);
    assert(h?.mt0?.attemptId === e.mt0, 'ô MT0 của em');
    assert(l.hang.every((x: any) => x.mt0) && Object.values(h.dot).every((d: any) => d.attemptId === null), `không lộ Final: ${JSON.stringify(h.dot)}`);
    const ql = kh.luoiThuong(P.mbManager, LOP, TODAY);
    assert(!ql.chiMt0 && Object.values(ql.hang.find((x: any) => x.studentId === e.sid).dot).some((d: any) => d.attemptId === e.fin), 'QL thấy Final');
    assertThrows(() => kh.luoiThuong(perm.loadPrincipal(idKhac), LOP, TODAY), /./, 'GV S chi nhánh khác');
  }));
}
