/**
 * PHÉP KIỂM PR-OV6b2 — chương trình mới (Liên tục, Lặp mỗi n tuần, môn gộp) + PET / KET: Quản trị tạo mã mới, tạo lớp `{CN} {MÃ} {số}`,
 * Checkpoint sinh từng lượt một, chấm đúng/tổng (chưa đạt chỉ chip SOS, không Case), lớp Liên tục không Lộ trình tiếp theo / KQĐR /
 * Cuối khoá / MT0 / Target, mã lạ không còn bị hiểu là FT, migrate chạy lặp được.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv6b2Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const sysconfig: any = await import('../platform/sysconfig.ts');
  const intake: any = await import('../classes/intake.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const loTrinhTiep: any = await import('../classes/loTrinhTiep.ts');
  const classes: any = await import('../classes/classes.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const diemTheoLuot: any = await import('../cham/diemTheoLuot.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const mig: any = await import('../migrate/prOv6b2.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV6b2 · chương trình mới (Liên tục, Checkpoint lặp, môn gộp) + PET / KET');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e; } return null; };
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const tuanNay = week.mondayOf(TODAY);
  /* Khai giảng 5 tuần trước → tuần học 6 (Checkpoint 1) là tuần này: nhập điểm được ngay. */
  const khaiGiang = addDays(tuanNay, -35);
  const tuanHoc = (n: number) => addDays(khaiGiang, 7 * (n - 1));
  const taoLop = (ct: string, so: string) => intake.taoLopVaPhanCong(P.mbManager, {
    branchId: MB, chuongTrinh: ct, so, startPeriodId: week.ensurePeriod(khaiGiang).id,
  }) as { id: number; code: string };
  const them = (lop: number, ten: string) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 6.5, startWeek: khaiGiang, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm ${ten}: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };
  /** Checkpoint của em: số + tuần + trạng thái. */
  const cps = (sid: number) => all(
    `SELECT a.id, a.attempt_no AS so, p.week_start AS tuan, a.status FROM assessment_attempts a JOIN report_periods p ON p.id = a.planned_period_id
      WHERE a.student_id = ? AND a.kind = 'checkpoint' AND a.status != 'cancelled' ORDER BY a.attempt_no`, sid);
  /** Checkpoint "chưa thi": chưa đủ điểm và tuần thi chưa tới. */
  const chuaThi = (sid: number, homNay = TODAY) => cps(sid).filter((c) => c.status === 'planned' && c.tuan > week.mondayOf(homNay)).length;
  const nhap = (attemptId: number, diem: Record<string, [number, number]>) => {
    for (const [mon, [s, tg]] of Object.entries(diem)) regular.saveRegularScore(P.admin, attemptId, mon, { score: s, total: tg }, TODAY);
    xoaNho();
  };
  const PX = { code: 'PX6', name: 'Thử liên tục', skills: ['listening_speaking', 'reading_writing'], scoringMode: 'ratio', nguongDat: 70,
    weeks: null, lapMoiTuan: 6, status: 'active', taoMoi: true };

  check('OV6b2-1 · Quản trị tạo mã mới liên tục, lặp 6 tuần → lớp "MB PX6 01", Checkpoint 1 tuần 6; đủ điểm → Checkpoint 2 tuần 12; không bao giờ hai checkpoint chưa thi', () => thu(() => {
    const lichKhac = JSON.stringify(all(`SELECT a.id, a.planned_period_id FROM assessment_attempts a ORDER BY a.id`));
    sysconfig.saveProgramme(P.admin, PX);
    const ct = sysconfig.listProgrammes(P.admin).find((r: any) => r.code === 'PX6');
    assert(ct && ct.lapMoiTuan === 6 && ct.weeks === null && ct.skills.join() === 'listening_speaking,reading_writing' && ct.nguongDat === 70,
      `cấu hình ${JSON.stringify(ct)}`);
    const lop = taoLop('PX6', '01');
    assert(lop.code === 'MB PX6 01', `tên lớp ${lop.code}`);
    const c = one('SELECT * FROM classes WHERE id = ?', lop.id);
    assert(c.moc_lap === 6 && c.so_tuan === null && c.is_fast_track === 0 && c.nguong_dat === 0.7, `bản chụp ${JSON.stringify(c)}`);
    assert(d.goiYSoTiep(all(`SELECT code FROM classes WHERE branch_id = ?`, MB).map((r) => r.code), [], 'MB PX6') === '02', 'gợi ý số kế tiếp');
    const sid = them(lop.id, 'OV6B2 Một');
    let ds = cps(sid);
    assert(ds.length === 1 && ds[0].so === 1 && ds[0].tuan === tuanHoc(6), `sau vào lớp: ${JSON.stringify(ds)}`);
    nhap(ds[0].id, { listening_speaking: [40, 60] });
    assert(cps(sid).length === 1, 'mới một môn đã sinh Checkpoint 2');
    nhap(ds[0].id, { reading_writing: [60, 80] });
    ds = cps(sid);
    assert(ds.length === 2 && ds[1].so === 2 && ds[1].tuan === tuanHoc(12), `đủ điểm: ${JSON.stringify(ds)}`);
    regular.sinhCheckpointKeTiep([lop.id], TODAY);
    assert(cps(sid).length === 2 && chuaThi(sid) === 1, 'quét lại sinh thêm');
    /* Em thứ hai không nhập: qua tuần thi Checkpoint 1 → quét sinh Checkpoint 2; quét tiếp cùng ngày không sinh thêm. */
    const sid2 = them(lop.id, 'OV6B2 Hai');
    assert(cps(sid2).length === 1 && chuaThi(sid2) === 0, `em 2: ${JSON.stringify(cps(sid2))}`);
    const sau = addDays(tuanNay, 7);
    regular.sinhCheckpointKeTiep([lop.id], sau);
    regular.sinhCheckpointKeTiep([lop.id], sau);
    assert(cps(sid2).length === 2 && chuaThi(sid2, sau) === 1, `qua tuần thi: ${JSON.stringify(cps(sid2))}`);
    /* Lớp của chương trình khác không đổi lịch. */
    const conLai = JSON.stringify(all(`SELECT a.id, a.planned_period_id FROM assessment_attempts a WHERE a.class_id IS NOT ? ORDER BY a.id`, lop.id));
    if (conLai !== lichKhac) {
      const truoc = new Map((JSON.parse(lichKhac) as any[]).map((r) => [r.id, r.planned_period_id]));
      const lech = (JSON.parse(conLai) as any[]).filter((r) => truoc.get(r.id) !== r.planned_period_id).slice(0, 5);
      assert(false, `lịch lớp khác đổi: ${JSON.stringify(lech.map((r) => ({ ...r, ...one('SELECT kind, class_id, attempt_no FROM assessment_attempts WHERE id = ?', r.id) })))}`);
    }
  }));

  check('OV6b2-2 · tạo chương trình: mã sai dạng / trùng / môn ngoài danh sách / thiếu n tuần → 400; QL → 403; mã không sửa sau khi có lớp', () => thu(() => {
    for (const [vao, o] of [[{ ...PX, code: 'P' }, 'ma'], [{ ...PX, code: 'BE' }, 'ma'], [{ ...PX, code: 'pet!' }, 'ma'], [{ ...PX, code: 'TOOLONG7' }, 'ma'],
      [{ ...PX, skills: ['tong_hop'] }, 'mon'], [{ ...PX, skills: [] }, 'mon'], [{ ...PX, skills: ['listening', 'listening_speaking'] }, 'mon'],
      [{ ...PX, lapMoiTuan: null }, 'moc'], [{ ...PX, lapMoiTuan: 0 }, 'moc'], [{ ...PX, name: '' }, 'ten'], [{ ...PX, nguongDat: 0 }, 'nguong']] as const) {
      const e = loi(() => sysconfig.saveProgramme(P.admin, vao));
      assert(e?.status === 400 && e.details?.o === o, `${JSON.stringify(vao)} → ${e?.status} ${e?.details?.o} ${e?.message}`);
    }
    /* "Band IELTS" chỉ FT: chương trình mới luôn đúng/tổng. */
    sysconfig.saveProgramme(P.admin, { ...PX, scoringMode: 'ielts_band' });
    assert(sysconfig.listProgrammes(P.admin).find((r: any) => r.code === 'PX6').scoringMode === 'ratio', 'chương trình mới nhận band');
    assert(loi(() => sysconfig.saveProgramme(P.mbManager, { ...PX, code: 'PX7' }))?.status === 403, 'QL tạo được');
    /* Mã đã có (PX6) → lưu là SỬA: đổi n tuần được, áp lớp mở sau; môn khoá khi đã có lớp. */
    const lop = taoLop('PX6', '02');
    sysconfig.saveProgramme(P.admin, { ...PX, taoMoi: false, lapMoiTuan: 4, skills: ['listening'] });
    const sau = sysconfig.listProgrammes(P.admin).find((r: any) => r.code === 'PX6');
    assert(sau.lapMoiTuan === 4 && sau.skills.join() === 'listening_speaking,reading_writing', `sửa: ${JSON.stringify(sau)}`);
    assert(one('SELECT moc_lap FROM classes WHERE id = ?', lop.id).moc_lap === 6, 'lớp đang chạy đổi n tuần');
    /* Ngừng dùng → tạo lớp 400. */
    sysconfig.saveProgramme(P.admin, { ...PX, taoMoi: false, status: 'inactive' });
    xoaNho();
    assert(loi(() => taoLop('PX6', '03'))?.status === 400, 'tạo lớp mã đã ngừng không 400');
  }));

  check('OV6b2-3 · PET: 48/60 + 61/80 → "Đạt"; 35/60 + 58/80 → chip "SOS · L+S", 0 Case / tín hiệu / PA / việc', () => thu(() => {
    const lop = taoLop('PET', '05');
    assert(lop.code === 'MB PET 05', lop.code);
    const a = them(lop.id, 'OV6B2 PET Đạt');
    const b = them(lop.id, 'OV6B2 PET SOS');
    nhap(cps(a)[0].id, { listening_speaking: [48, 60], reading_writing: [61, 80] });
    nhap(cps(b)[0].id, { listening_speaking: [35, 60], reading_writing: [58, 80] });
    const bang = regular.regularSheet(P.admin, lop.id, 'checkpoint', TODAY, 1);
    const hang = (sid: number) => bang.rows.find((r: any) => r.studentId === sid);
    assert(bang.rows.length === 2, `số dòng ${bang.rows.length}`);
    assert(hang(a).chip?.chu === 'Đạt' && hang(a).chip.dat === true, `em đạt: ${JSON.stringify(hang(a).chip)}`);
    assert(hang(b).chip?.chu === 'SOS · L+S' && hang(b).chip.dat === false, `em SOS: ${JSON.stringify(hang(b).chip)}`);
    assert(Math.round(hang(b).result.tyLeTong * 100) === 66, `% tổng ${hang(b).result.tyLeTong}`);
    assert(bang.monNgan.listening_speaking === 'L+S' && bang.monNgan.reading_writing === 'R+W', JSON.stringify(bang.monNgan));
    const dem = (sql: string) => one(sql.replace('?', `${a},${b}`)).n as number;
    assert(dem('SELECT COUNT(*) n FROM sos_cases WHERE student_id IN (?)') === 0, 'có Case');
    assert(dem('SELECT COUNT(*) n FROM case_signals WHERE student_id IN (?)') === 0, 'có tín hiệu');
    assert(dem('SELECT COUNT(*) n FROM task_students WHERE student_id IN (?)') === 0, 'có việc');
  }));

  check('OV6b2-4 · lớp PET: không Lộ trình tiếp theo / KQĐR / Cuối khoá / MT0 / Target; hồ sơ lớp "PET · tuần 6"; không tự kết thúc', () => thu(() => {
    const lop = taoLop('PET', '06');
    const sid = them(lop.id, 'OV6B2 PET Cổng');
    const lt = loTrinhTiep.layLoTrinhTiep(P.mbManager, sid);
    assert(!lt.coTheGhi && !lt.lopDuKien.length && lt.cuoiKhoa === null && lt.mt0 === null, `lộ trình tiếp: ${JSON.stringify(lt)}`);
    const cau = 'Chương trình liên tục không có Lộ trình tiếp theo.';
    for (const fn of [() => loTrinhTiep.ghiLoTrinhTiep(P.mbManager, sid, { huong: 'hoc_lai' }), () => loTrinhTiep.layLoTrinhTiepCaLop(P.mbManager, lop.id),
      () => loTrinhTiep.luuNhap(P.mbManager, lop.id, { items: [{ studentId: sid, huong: 'hoc_lai' }] })]) {
      const e = loi(fn);
      assert(e?.status === 400 && e.message === cau, `${e?.status} ${e?.message}`);
    }
    assert(loi(() => cuoiKhoa.ghiKetLuanFt(P.mbManager, sid, { dat: true }))?.status === 400, 'KQĐR không 400');
    assert(!d.coMt0('PET', 'fast_track'), 'PET có MT0');
    const cy = one(`SELECT id, target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
    assert(cy.target_score === null, `Target lúc thêm em: ${cy.target_score}`);
    const e = loi(() => cycles.reviseTarget(P.mbManager, cy.id, { newTarget: 6, reason: 'thử' }));
    assert(e?.status === 400 && e.message === 'Chương trình liên tục không có Target.', `Target: ${e?.status} ${e?.message}`);
    const ov = classes.classOverview(P.mbManager, lop.id);
    assert(ov.cuoiKhoa === null && ov.lienTuc === true, `overview cuoiKhoa ${JSON.stringify(ov.cuoiKhoa)} lienTuc ${ov.lienTuc}`);
    const pr = schedule.classProgress(lop.id);
    assert(pr.label === 'PET · tuần 6' && pr.totalWeeks === null && pr.phase !== 'finished', `tiến độ: ${pr.label} ${pr.phase}`);
    assert(!schedule.missingForClass(lop.id).items.some((m: any) => m.key === 'class_start_week'), 'nhắc tuần bắt đầu khi đã có');
    conn.prepare('UPDATE classes SET start_period_id = NULL WHERE id = ?').run(lop.id);
    assert(schedule.missingForClass(lop.id).items.some((m: any) => m.key === 'class_start_week'), 'thôi nhắc tuần bắt đầu');
  }));

  check('OV6b2-5 · mã lạ không còn là FT: kỹ năng lớp PET = L+S, R+W; Điểm theo lớp + Kế hoạch Test có "Checkpoint 1"', () => thu(() => {
    assert(d.programmeOf('PET') === 'PET' && d.programmeOf('pet') === 'PET' && d.programmeOf('FOUND') === 'FOU', 'programmeOf');
    assert(d.boMonLich('PET', ['listening_speaking', 'reading_writing']).join() === 'listening_speaking,reading_writing', 'boMonLich');
    assert(d.kyNangPhuTrach('PET', 'reading_writing').join() === 'reading_writing', 'kyNangPhuTrach');
    assert(d.tenMonNgan('PET', 'listening_speaking') === 'L+S' && d.tenMon('KET', 'reading_writing') === 'Reading + Writing', 'tên môn');
    const lop = taoLop('KET', '01');
    assert(lop.code === 'MB KET 01', lop.code);
    assert(all('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill', lop.id).map((r) => r.skill).join() === 'listening_speaking,reading_writing', 'class_skills');
    const sid = them(lop.id, 'OV6B2 KET');
    assert(all(`SELECT skill FROM attempt_skills WHERE attempt_id = ? ORDER BY skill`, cps(sid)[0].id).map((r) => r.skill).join() === 'listening_speaking,reading_writing', 'attempt_skills');
    const luot = diemTheoLuot.danhSachLuot(P.mbManager, lop.id, TODAY);
    assert(luot.mode === 'ratio' && luot.luot.length === 1 && luot.luot[0].ma === 'cp:1' && luot.luot[0].nhan === 'Checkpoint 1' && luot.macDinh === 'cp:1',
      `lượt: ${JSON.stringify(luot)}`);
    const bang = diemTheoLuot.bangTheoLuot(P.mbManager, lop.id, 'cp:1', TODAY);
    assert(bang.thuong.rows.length === 1 && bang.thuong.rows[0].studentId === sid, 'bảng cp:1');
    assert(loi(() => diemTheoLuot.bangTheoLuot(P.mbManager, lop.id, 'thuong:final', TODAY))?.status === 404, 'thuong:final không 404');
    const kh = keHoach.luoiThuong(P.mbManager, lop.id);
    assert(kh.cot.length === 1 && kh.cot[0].kind === 'cp1' && kh.cot[0].nhan === 'Checkpoint 1' && kh.cot[0].deXuat === tuanHoc(6)
      && kh.hang[0].dot.cp1.attemptId === cps(sid)[0].id, `kế hoạch: ${JSON.stringify(kh.cot)}`);
    assert(d.docMaLuot('cp:3')?.so === 3 && d.vietMaLuot({ loai: 'cp', so: 3 }) === 'cp:3' && d.nhanMaLuot({ loai: 'cp', so: 3 }) === 'Checkpoint 3', 'mã lượt cp');
    /* Lớp thường cũ giữ nguyên: BE vẫn Progress / Final. */
    assert(keHoach.luoiThuong(P.mbManager, classId('MB BE 08')).cot.map((c: any) => c.kind).join() === 'progress,final', 'lớp BE đổi cột');
  }));

  check('OV6b2-6 · PET, KET có sẵn (L+S R+W · đúng/tổng · 70 % · liên tục · mỗi 6 tuần); migrate chạy hai lần không đổi gì', () => thu(() => {
    for (const ma of ['PET', 'KET']) {
      const r = sysconfig.listProgrammes(P.admin).find((x: any) => x.code === ma);
      assert(r && r.skills.join() === 'listening_speaking,reading_writing' && r.scoringMode === 'ratio' && r.nguongDat === 70
        && r.weeks === null && r.lapMoiTuan === 6 && r.status === 'active', `${ma}: ${JSON.stringify(r)}`);
    }
    const chup = () => JSON.stringify([all('SELECT * FROM programmes ORDER BY code'), all('SELECT * FROM programme_skills ORDER BY programme_code, skill')]);
    const truoc = chup();
    const a1: string[] = [];
    mig.migratePrOv6b2(conn, a1);
    assert(!a1.length && chup() === truoc, `chạy lại trên DB đủ: ${JSON.stringify(a1)}`);
    /* DB cũ chưa có KET (PET đã có lớp demo — không xoá được, migrate cũng không đụng mã đã có). */
    conn.exec(`DELETE FROM programme_skills WHERE programme_code = 'KET'; DELETE FROM programmes WHERE code = 'KET'`);
    const a2: string[] = [];
    mig.migratePrOv6b2(conn, a2);
    assert(a2.length === 1 && a2[0].includes('KET') && !a2[0].includes('PET') && chup().length === truoc.length, `chèn lại: ${JSON.stringify(a2)}`);
    const a3: string[] = [];
    mig.migratePrOv6b2(conn, a3);
    assert(!a3.length, `lần hai: ${JSON.stringify(a3)}`);
  }));

  check('OV6b2-7 · demo: lớp MB PET 01 có 3 em, Checkpoint 1 có một Đạt, một SOS', () => {
    const lop = classId('MB PET 01');
    const bang = regular.regularSheet(P.admin, lop, 'checkpoint', TODAY, 1);
    const chu = bang.rows.map((r: any) => r.chip?.chu ?? null);
    assert(bang.rows.length === 3 && chu.includes('Đạt') && chu.some((c: string | null) => c?.startsWith('SOS · ')), `demo: ${JSON.stringify(chu)}`);
  });
}
