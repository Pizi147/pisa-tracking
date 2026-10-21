/**
 * PHÉP KIỂM PR-TD7b — cờ "còn ô chờ điểm" `assessment_attempts.o_cho_tu` (fasttrack/conOCho.ts): ĐÚNG ở từng đường ghi, đầu ra TRÙNG KHÍT; TD7c: Lịch Test khối 1.
 * Gọi ở CUỐI run.ts. Bằng chứng cho đường ghi là TD7b-4…13 (mỗi phép đổi cờ THẬT qua đường dịch vụ, `doiCo`) + chạy đột biến gỡ từng lời gọi cờ (mô tả PR). Nhiều phép kiểm
 * cũ dựng lượt bằng SQL thẳng nên cờ cả bộ sau chúng KHÔNG phải bằng chứng — TD7b-2 chỉ đồng bộ lại (idempotent) và in số cờ lệch lành; phép kiểm cũ soi đường đọc
 * (TD3-a-1, OV14c…) tự đồng bộ cờ ở đầu. Lệch cờ về phía "hết" = MẤT việc nhập điểm → `luotLechNguyHiem`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrTd7bTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays, classId } = t;
  const cc: any = await import('../fasttrack/conOCho.ts');
  const att: any = await import('../fasttrack/attempts.ts');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const students: any = await import('../students/students.ts');
  const mt0: any = await import('../fasttrack/mt0.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nPR-TD7b · Cờ "còn ô chờ điểm" (o_cho_tu)');

  const QL = P.mbManager;
  const tuanNay = week.mondayOf(TODAY);
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const co = (id: number): string | null => get('SELECT o_cho_tu v FROM assessment_attempts WHERE id = ?', id).v;
  const tinh = (id: number): string | null => get(`SELECT ${cc.O_CHO_TU_SQL} v FROM assessment_attempts a WHERE a.id = ?`, id).v;
  /** Cờ đang lưu = tính lại ngay bây giờ. */
  const dung = (ten: string, id: number) => assert(co(id) === tinh(id), `${ten}: cờ lưu ${co(id)} ≠ tính lại ${tinh(id)} (lượt ${id})`);
  /** Thao tác PHẢI đổi giá trị cờ (nếu không, phép kiểm không chứng minh được gì) và cờ lưu phải theo kịp. */
  const doiCo = (ten: string, id: number, fn: () => unknown) => {
    dung(`${ten} (trước)`, id);
    const truoc = co(id);
    fn();
    dung(ten, id);
    assert(co(id) !== truoc, `${ten}: thao tác không đổi cờ (${truoc}) — fixture sai`);
  };
  const S4 = [6, 6.5, 6, 7];
  const CHUA = [null, null, null, null];
  const nhapDu = (aid: number) => {
    att.saveScore(QL, aid, 'listening', { rawScore: 30 }, TODAY); att.saveScore(QL, aid, 'reading', { rawScore: 30 }, TODAY);
    for (const k of ['writing1', 'writing2', 'speaking']) att.saveScore(QL, aid, k, { criteria: S4 }, TODAY);
  };
  /** Em mới ở lớp, MT1 tuần này — dựng qua `commitIntake` + `createAttempt` (như HSM). */
  const emMoi = (lop: string, ten: string) => {
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: `TD7b ${ten}`, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `td7b-${ten}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `TD7b ${ten}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    const a = luotThu(conn, att.createAttempt, P.admin, { studentId: st.id, cycleId: cy.id, classId: classId(lop), no: 1, periodId: week.ensurePeriod(tuanNay).id });
    return a.id as number;
  };

  check('TD7b-2 · tính lại cờ cho MỌI lượt: lần hai không ghi gì (idempotent), không còn lượt "chưa tính" hay lệch', () => {
    /* Các phép kiểm trước dựng lượt bằng SQL thẳng nên cờ cả bộ không phải bằng chứng cho đường ghi thật (bằng chứng: TD7b-4…13) — chỉ báo con số. */
    console.log(`      (trước khi đồng bộ: ${(cc.demLuotLechCo() as number)}/${get('SELECT COUNT(*) n FROM assessment_attempts').n} lượt cờ lệch do fixture ghi SQL thẳng; ${(cc.luotLechNguyHiem() as number[]).length} lệch về phía hết)`);
    cc.capNhatConOChoTatCa();
    assert(cc.demLuotLechCo() === 0, 'tính lại xong vẫn lệch');
    const truoc = get('SELECT total_changes() n').n as number;
    cc.capNhatConOChoTatCa();
    assert((get('SELECT total_changes() n').n as number) === truoc, 'lần hai vẫn ghi dòng — không idempotent');
  });

  await checkAsync('TD7b-1 · cột + chỉ mục một phần; migrate prTd7b thêm cột / chỉ mục / tính lại trên DB cũ, chạy lặp không làm gì', async () => {
    assert(all("SELECT name FROM pragma_table_info('assessment_attempts')").some((c) => c.name === 'o_cho_tu'), 'thiếu cột o_cho_tu');
    for (const ten of ['idx_attempt_o_cho', 'idx_attempt_o_cho_lop']) {
      const ix = get("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?", ten);
      assert(ix && /o_cho_tu IS NOT NULL/.test(ix.sql), `chỉ mục một phần ${ten}: ${ix?.sql}`);
    }
    const { migratePrTd7b } = await import('../migrate/prTd7b.ts');
    const lan1: string[] = []; migratePrTd7b(conn, lan1);
    assert(!lan1.length, `migrate trên DB đã đủ vẫn báo đổi: ${lan1.join(' | ')}`);
    /* DB cũ: dựng từ schema.sql rồi gỡ cột + chỉ mục → migrate thêm lại, lần hai im lặng (DB tạm, không đụng DB đang chạy). */
    const { default: SqliteDb } = await import('libsql');
    const fs = await import('node:fs');
    const { SCHEMA_PATH } = await import('../db.ts');
    const tam = new SqliteDb(':memory:');
    tam.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    tam.exec('DROP INDEX idx_attempt_o_cho; DROP INDEX idx_attempt_o_cho_lop; ALTER TABLE assessment_attempts DROP COLUMN o_cho_tu;');
    const a: string[] = []; migratePrTd7b(tam, a);
    assert(a.some((x) => /cột/.test(x)) && a.filter((x) => /chỉ mục/.test(x)).length === 2, `lần 1: ${a.join(' | ')}`);
    const b: string[] = []; migratePrTd7b(tam, b);
    assert(!b.length, `lần 2 vẫn báo: ${b.join(' | ')}`);
    tam.close();
    /* Cờ đang '' (DB cũ vừa thêm cột) → migrate tính lại đúng số lượt, lần hai không báo. */
    thu(() => {
      conn.exec("UPDATE assessment_attempts SET o_cho_tu = ''");
      const c: string[] = []; migratePrTd7b(conn, c);
      assert(c.some((x) => /tính lại cờ/.test(x)), `tính lại: ${c.join(' | ')}`);
      const d2: string[] = []; migratePrTd7b(conn, d2);
      assert(!d2.length && cc.demLuotLechCo() === 0, `lần 2: ${d2.join(' | ')}`);
    });

  });

  check('TD7b-3 · cờ ≡ cách tính cũ: với nhiều ngày, tập lượt (status ≠ cancelled AND o_cho_tu ≤ ngày) = tập CON_O_SQL cũ', () => {
    for (const ngay of [addDays(TODAY, -60), addDays(TODAY, -14), addDays(TODAY, -1), TODAY, addDays(TODAY, 7), addDays(TODAY, 30), addDays(TODAY, 200)]) {
      const cu = all(`SELECT a.id FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE ${cc.CON_O_SQL_TRUOC_TD7B} ORDER BY a.id`, ngay, ngay, ngay, ngay).map((r) => r.id);
      const moi = all(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND a.o_cho_tu <= ? ORDER BY a.id`, ngay).map((r) => r.id);
      assert(JSON.stringify(cu) === JSON.stringify(moi), `${ngay}: cũ ${cu.length} lượt, mới ${moi.length} lượt — khác: ${cu.filter((x) => !moi.includes(x)).slice(0, 5)} / ${moi.filter((x) => !cu.includes(x)).slice(0, 5)}`);
    }
    assert((get(`SELECT COUNT(*) n FROM assessment_attempts WHERE o_cho_tu IS NULL`).n as number) > 0, 'demo phải có lượt đã chấm xong (cờ NULL)');
  });

  check('TD7b-4 · tạo lượt + nhập / sửa / xoá điểm (FT): cờ = tuần sớm nhất của ô chờ; đủ 5 ô → NULL; xoá một ô → về tuần', () => thu(() => {
    const aid = emMoi('MB FT 101', 'Diem');
    assert(co(aid) === tuanNay, `lượt mới tuần này: cờ ${co(aid)} ≠ ${tuanNay}`);
    dung('tạo lượt', aid);
    att.saveScore(QL, aid, 'listening', { rawScore: 30 }, TODAY); dung('nhập L', aid);
    att.saveScore(QL, aid, 'reading', { rawScore: 30 }, TODAY); dung('nhập R', aid);
    doiCo('nhập đủ ô cuối', aid, () => { for (const k of ['writing1', 'writing2', 'speaking']) att.saveScore(QL, aid, k, { criteria: S4 }, TODAY); });
    assert(co(aid) === null, 'đủ điểm: cờ phải NULL');
    att.saveScore(QL, aid, 'writing1', { criteria: [7, 7, 7, 7] }, TODAY); dung('sửa điểm', aid);
    doiCo('xoá điểm một ô', aid, () => att.saveScore(QL, aid, 'speaking', { rawScore: null, criteria: CHUA, lyDo: 'Chấm nhầm' }, TODAY));
    assert(co(aid) === tuanNay, 'xoá ô: cờ về tuần thi');
  }));

  check('TD7b-5 · "-" vắng + bỏ vắng; xác nhận vắng / huỷ phần thi / khôi phục phần thi; phạm vi kỹ năng: cờ theo kịp từng bước', () => thu(() => {
    const aid = emMoi('MB FT 101', 'Vang');
    nhapDu(aid);
    att.saveScore(QL, aid, 'speaking', { rawScore: null, criteria: CHUA, lyDo: 'Mở ô để thử vắng' }, TODAY);
    assert(co(aid) === tuanNay, 'còn ô S chờ');
    doiCo('xác nhận vắng S', aid, () => skillSch.setSitStatus(QL, aid, 'speaking', 'absent', 'Em vắng'));
    doiCo('gỡ xác nhận vắng', aid, () => skillSch.setSitStatus(QL, aid, 'speaking', 'scheduled', 'Em có thi'));
    /* "-" ở ô điểm: vắng lần 1 dời tuần sau → cờ nhảy sang tuần sau. */
    const tuanSau = addDays(tuanNay, 7);
    doiCo('"-" (báo vắng lần 1, dời tuần sau)', aid, () => att.saveScore(QL, aid, 'speaking', { noShow: true }, TODAY));
    assert(co(aid) === tuanSau, `dời tuần sau: cờ ${co(aid)} ≠ ${tuanSau}`);
    doiCo('bỏ "-" (gỡ vắng)', aid, () => att.saveScore(QL, aid, 'speaking', { noShow: false }, TODAY));
    doiCo('bỏ phạm vi kỹ năng S (không yêu cầu)', aid, () => skillSch.setSkillScope(QL, aid, 'speaking', false, 'Em miễn S'));
    assert(co(aid) === null, 'S ngoài phạm vi: hết ô chờ');
    doiCo('đưa S lại vào phạm vi', aid, () => skillSch.setSkillScope(QL, aid, 'speaking', true, 'Đưa S lại'));
  }));

  check('TD7b-6 · Xóa lịch (boTuanLuot), xếp lại tuần, huỷ lượt (ẩn điểm) và khôi phục lượt: cờ theo kịp', () => thu(() => {
    const a1 = emMoi('MB FT 101', 'XoaLich');
    doiCo('Xóa lịch', a1, () => skillSch.boTuanLuot(QL, a1, { lyDo: 'Em xin nghỉ' }));
    assert(co(a1) === null, 'mất hết tuần: không còn ô chờ');
    doiCo('xếp lại tuần cho từng kỹ năng', a1, () => { for (const k of ['listening', 'reading', 'writing', 'speaking']) skillSch.setSkillWeek(QL, a1, k, week.ensurePeriod(tuanNay).id, { force: true }); });
    const a2 = emMoi('MB FT 101', 'HuyLuot');
    nhapDu(a2);
    assert(co(a2) === null, 'đủ điểm');
    doiCo('huỷ lượt (điểm cất đi)', a2, () => att.huyLuot(QL, a2, { lyDo: 'Em chuyển lớp' }));
    doiCo('khôi phục lượt (điểm trả về)', a2, () => att.reopenAttempt(QL, a2, {}));
    assert(co(a2) === null, 'khôi phục: đủ điểm trở lại');
  }));

  check('TD7b-7 · lớp thường: nhập / xoá điểm số câu đúng, đổi tuần, dời môn: cờ theo kịp (môn của chương trình, raw_score)', () => thu(() => {
    const l = get(`SELECT a.id, a.class_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
        WHERE c.programme_code = (SELECT code FROM programmes WHERE scoring_mode = 'ratio' ORDER BY code LIMIT 1) AND a.kind IN ('progress', 'final') AND a.status != 'cancelled' AND c.status = 'active'
          AND a.planned_period_id IS NOT NULL ORDER BY a.id LIMIT 1`);
    assert(l, 'demo thiếu bài lớp thường');
    const mon = (all('SELECT skill FROM programme_skills WHERE programme_code = (SELECT programme_code FROM classes WHERE id = ?) ORDER BY seq', l.class_id)).map((r) => r.skill as string);
    const hanTat = week.mondayOf(addDays(TODAY, 400));
    for (const k of mon) regular.saveRegularScore(P.admin, l.id, k, { score: 30, total: 40 }, hanTat);
    assert(co(l.id) === null, `nhập đủ môn ${mon.join(',')}: cờ ${co(l.id)}`);
    dung('nhập đủ môn', l.id);
    doiCo('xoá điểm một môn', l.id, () => regular.saveRegularScore(P.admin, l.id, mon[0], { score: null }, hanTat));
  }));

  check('TD7b-13 · nhập lô (FT + lớp thường), MT0, vắng chờ Quản lý duyệt, chuyển lớp: lượt mới / đổi có cờ đúng ngay (không để "chưa tính")', () => thu(() => {
    /* Nhập học viên (Excel / lô) tạo lượt + lịch bằng SQL lô — cờ phải có ngay. */
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [0, 1].map((i) => ({ fullName: `TD7b Lo FT ${i}`, target: 6.5, email: emailThu(), dob: '2010-01-01' })), idempotencyKey: 'td7b-lo-ft' });
    const dsFt = all(`SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id WHERE s.full_name LIKE 'TD7b Lo FT %'`);
    assert(dsFt.length >= 2, 'lô FT không tạo lượt');
    for (const r of dsFt) { dung('nhập lô FT', r.id); assert(co(r.id) !== '', `FT: lượt ${r.id} còn "chưa tính"`); }
    /* Lớp thường: bài Progress / Final mặc định tạo bằng SQL lô (`taoBaiThuongMacDinh`) — thử lần lượt các lớp đang chạy tới khi tạo được. */
    let taoDuoc = 0;
    for (const lop of all(`SELECT c.id, c.code FROM classes c WHERE c.status = 'active' AND c.programme_code IN (SELECT code FROM programmes WHERE scoring_mode = 'ratio') ORDER BY c.id`)) {
      intake.commitIntake(P.admin, { classId: lop.id, rows: [{ fullName: `TD7b Lo Th ${lop.id}`, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `td7b-lo-th-${lop.id}` });
      const st = get('SELECT id FROM students WHERE full_name = ?', `TD7b Lo Th ${lop.id}`);
      if (!st) continue;
      const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
      const ids: number[] = regular.taoBaiThuongMacDinh([cy.id], P.admin.userId);
      const ds = ids.length ? ids.map((id) => ({ id })) : all('SELECT id FROM assessment_attempts WHERE student_id = ?', st.id);
      for (const r of ds) { dung(`nhập lô lớp thường ${lop.code}`, r.id); assert(co(r.id) !== '', `${lop.code}: lượt ${r.id} còn "chưa tính"`); }
      if (ds.length) { taoDuoc++; break; }
    }
    assert(taoDuoc > 0, 'không lớp thường nào tạo được bài mặc định');
    /* MT0 (Lên FT). */
    const fou = emMoi('MB FOU 12', 'Mt0');
    const sid = get('SELECT student_id s FROM assessment_attempts WHERE id = ?', fou).s;
    mt0.dongBoMt0(P.mbManager.userId, [{ studentId: sid, classId: classId('MB FOU 12'), ma: 'FOU', huong: 'fast_track', mucTieu: 6.5 }]);
    const m = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`, sid);
    assert(m, 'không tạo MT0');
    dung('MT0 mới', m.id);
    /* Bỏ hướng (huỷ) rồi chọn lại ở LỚP KHÁC → MT0 mở lại, đổi lớp + tuần theo Final lớp mới. */
    const khac = get(`SELECT c.id, c.programme_code ma FROM classes c WHERE c.status = 'active' AND c.programme_code IN ('FOU', 'BE', 'ELE') AND c.id != ? ORDER BY c.id LIMIT 1`, classId('MB FOU 12'));
    if (khac) {
      mt0.dongBoMt0(P.mbManager.userId, [{ studentId: sid, classId: classId('MB FOU 12'), ma: 'FOU', huong: 'hoc_lai', mucTieu: null }]);
      dung('MT0 bỏ hướng (huỷ)', m.id);
      mt0.dongBoMt0(P.mbManager.userId, [{ studentId: sid, classId: khac.id, ma: khac.ma, huong: 'fast_track', mucTieu: 6.5 }]);
      dung('MT0 chọn lại ở lớp khác', m.id);
    }
    /* Vắng chờ Quản lý duyệt (không tự dời được): ô S thành `absent`, cờ phải hết ô đó dù không ai đổi tuần. */
    const a = emMoi('MB FT 101', 'VangCho');
    for (const k of ['listening', 'reading']) att.saveScore(QL, a, k, { rawScore: 30 }, TODAY);
    for (const k of ['writing1', 'writing2']) att.saveScore(QL, a, k, { criteria: S4 }, TODAY);
    const st = get('SELECT student_id s, cycle_id c FROM assessment_attempts WHERE id = ?', a);
    luotThu(conn, att.createAttempt, P.admin, { studentId: st.s, cycleId: st.c, classId: classId('MB FT 101'), no: 2, periodId: week.ensurePeriod(addDays(tuanNay, 7)).id });
    doiCo('báo vắng S chờ Quản lý duyệt (tuần kế bị MT2 chặn)', a, () => absence.baoVang(P.coreTeacher, a, 'speaking', 'Em ốm', TODAY));
    /* Chuyển lớp một em sang lớp khác chương trình (cờ phải khớp mọi lượt của em). */
    const b = emMoi('MB FOU 12', 'Chuyen');
    const sb = get('SELECT student_id s FROM assessment_attempts WHERE id = ?', b).s;
    const dich = all(`SELECT id FROM classes WHERE status = 'active' AND id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id`, classId('MB FOU 12'), classId('MB FOU 12'));
    let daChuyen = 0;
    for (const d of dich) {
      try { students.transferStudent(P.admin, sb, d.id, TODAY, 'Đổi lịch học', { noNote: true }); daChuyen++; } catch { continue; }
      for (const r of all('SELECT id FROM assessment_attempts WHERE student_id = ?', sb)) dung(`chuyển sang lớp ${d.id}`, r.id);
      if (daChuyen >= 2) break;
    }
    assert(daChuyen > 0, 'không chuyển lớp được lần nào');
  }));

  check('TD7b-9 · chuyển lớp / đổi lớp của lượt (capNhatConOChoLop) và lượt MT0: cờ theo kịp', () => thu(() => {
    const a = emMoi('MB FT 101', 'ChuyenLop');
    nhapDu(a);
    assert(co(a) === null, 'đủ điểm');
    /* Đổi lớp sang lớp thường (chấm tỷ lệ): bộ môn khác → ô chờ xuất hiện. */
    conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ?').run(classId('MB FOU 12'), a);
    cc.capNhatConOChoLop([classId('MB FOU 12')]);
    dung('đổi lớp', a);
    assert(co(a) !== null, 'sang lớp tỷ lệ: bộ môn mới chưa có raw_score → còn ô chờ');
    const mt0 = get(`SELECT id FROM assessment_attempts WHERE kind = 'mt0' ORDER BY id LIMIT 1`);
    if (mt0) dung('MT0', mt0.id);
  }));


  check('TD7b-12 · vắng lần 2 huỷ phần thi, khôi phục phần thi, "Không mock lại"; Mini đổi mốc lớp (setClassProgress); chuyển lớp một em: cờ theo kịp', () => thu(() => {
    const aid = emMoi('MB FT 101', 'Vang2');
    for (const k of ['listening', 'reading']) att.saveScore(QL, aid, k, { rawScore: 30 }, TODAY);
    for (const k of ['writing1', 'writing2']) att.saveScore(QL, aid, k, { criteria: S4 }, TODAY);
    const tuanSau = addDays(tuanNay, 7);
    doiCo('vắng lần 1 ("-") dời S sang tuần sau', aid, () => att.saveScore(QL, aid, 'speaking', { noShow: true }, TODAY));
    assert(co(aid) === tuanSau, `lần 1: cờ ${co(aid)}`);
    doiCo('vắng lần 2 → huỷ phần thi S', aid, () => att.saveScore(QL, aid, 'speaking', { noShow: true }, tuanSau));
    assert(co(aid) === null, `huỷ phần thi: hết ô chờ, cờ ${co(aid)}`);
    doiCo('khôi phục phần thi S vào tuần này', aid, () => absence.restoreCancelledSkill(QL, aid, 'speaking', week.ensurePeriod(tuanNay).id, {}));
    doiCo('Không mock lại (bỏ S khỏi đợt)', aid, () => {
      /* LUAT-34: Khôi phục đặt lại chuỗi — "-" kế tiếp là lần 1 (dời), "-" ở tuần đã dời tới mới huỷ lại. */
      att.saveScore(QL, aid, 'speaking', { noShow: true }, TODAY);
      att.saveScore(QL, aid, 'speaking', { noShow: true }, tuanSau);
      absence.khongMockLai(QL, aid, 'speaking', 'Em không thi lại');
    });
    const b = emMoi('MB FT 101', 'ChuyenNha');
    dung('trước chuyển lớp', b);
    const sid = get('SELECT student_id s FROM assessment_attempts WHERE id = ?', b).s;
    const lopKhac = get(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, classId('MB FT 101'), classId('MB FT 101'));
    if (lopKhac) {
      students.transferStudent(P.admin, sid, lopKhac.id, TODAY, 'Đổi lịch học', { noNote: true });
      for (const r of all('SELECT id FROM assessment_attempts WHERE student_id = ?', sid)) dung('sau chuyển lớp', r.id);
    }
    const lop = get(`SELECT c.id FROM classes c WHERE c.kind IS NOT NULL AND c.programme_code IN (SELECT code FROM programmes WHERE scoring_mode = 'ratio') AND c.status = 'active' ORDER BY c.id LIMIT 1`);
    if (lop) {
      const cp = schedule.classProgress(lop.id);
      for (const doi of [{ finalWeek: cp.finalWeek - 1 }, { finalWeek: cp.finalWeek + 1 }, { progressWeek: cp.progressWeek - 1 }]) {
        try { schedule.setClassProgress(P.admin, lop.id, doi); break; } catch { /* mốc không hợp lệ ở lớp này — thử mốc khác */ }
      }
      const lech = cc.luotLechNguyHiem();
      assert(!lech.length, `sau đổi mốc lớp vẫn lệch nguy hiểm: ${lech.slice(0, 5)}`);
    }
  }));

  check('TD7b-10b · badge lớp ("n bài chờ chấm"): cờ mới cho cùng kết quả bộ lọc CON_O_SQL cũ (không so với "không lọc": MT0 ở lớp tỷ lệ vốn chỉ được badge đếm khi còn ô chờ band)', () => thu(() => {
    const chup = () => { const out: Record<string, unknown> = {}; for (const [ten, p] of Object.entries(P)) { xoaNho(); out[ten] = classesSvc.listClassSummaries(p, {}); } return JSON.stringify(out); };
    const that = chup();
    /* Ép cờ mô phỏng ĐÚNG bộ lọc cũ: lượt thuộc tập CON_O_SQL cũ (hôm nay) → '' (luôn đọc), còn lại → NULL. */
    conn.exec('UPDATE assessment_attempts SET o_cho_tu = NULL');
    conn.prepare(`UPDATE assessment_attempts SET o_cho_tu = '' WHERE id IN (SELECT a.id FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN report_periods pr ON pr.id = a.planned_period_id WHERE ${cc.CON_O_SQL_TRUOC_TD7B})`).run(TODAY, TODAY, TODAY, TODAY);
    const cu = chup();
    assert(that.length > 1000 && that === cu, `badge lệch bộ lọc cũ (${that.length} vs ${cu.length} ký tự)`);
  }));

  await checkAsync('TD7b-10 · đầu ra TRÙNG KHÍT khi bỏ lọc cờ: Nợ điểm (mọi vai), Cần chấm / Công việc, badge lớp, hồ sơ GV, Phân tích GV', async () => {
    const mywork: any = await import('../worklist/mywork.ts');
    const debt: any = await import('../worklist/scoreDebt.ts');
    const hoSo: any = await import('../giaoVien/hoSo.ts');
    const ptGv: any = await import('../phanTich/giaoVien.ts');
    const metrics: any = await import('../worklist/metrics.ts');
    const vai: [string, any][] = Object.entries(P);
    const chup = () => {
      xoaNho();
      const out: Record<string, unknown> = {};
      for (const [ten, p] of vai) {
        out[`no:${ten}`] = debt.scoreDebtCells(p, TODAY, null);
        out[`no-cn:${ten}`] = debt.scoreDebtCells(p, TODAY, [get('SELECT id FROM branches ORDER BY id LIMIT 1').id]);
        for (const lop of [undefined, classId('MB FT 101'), classId('MB FOU 12')]) {
          xoaNho();
          /* Danh sách là TẬP CHA (nơi gọi lọc tiếp bằng `conBaiCanCham` / lượt chưa xếp tuần) → so SAU bộ lọc JS, như TD3-a-1. */
          out[`ds:${ten}:${lop}`] = att.listAttempts(p, { classId: lop, scope: 'managed', chiDangHoc: true, phamViCham: true, chiConO: true, kemChuaTuan: true }).rows
            .filter((r: any) => att.conBaiCanCham(r) || (!r.period && r.status === 'planned'));
        }
        xoaNho(); out[`mywork:${ten}`] = mywork.myWork(p, {}).items;
        if (ten === 'mbManager' || ten === 'admin') { xoaNho(); out[`mywork-tc:${ten}`] = mywork.myWork(p, { nguoi: 'tat-ca' }).items; }
      }
      xoaNho();
      for (const uid of all(`SELECT DISTINCT user_id u FROM teacher_assignments WHERE status = 'active' ORDER BY user_id LIMIT 12`).map((r) => r.u as number)) {
        xoaNho();
        try { out[`hoso:${uid}`] = hoSo.hoSoGiaoVien(P.admin, uid); } catch (e: any) { out[`hoso:${uid}`] = `lỗi: ${e.message}`; }
      }
      for (const f of [{ ct: 'ft' }, { ct: 'thuong' }, { ct: 'ft', thang: '2026-09' }]) { xoaNho(); out[`ptgv:${JSON.stringify(f)}`] = ptGv.phanTichGiaoVien(P.mbManager, f); }
      xoaNho(); out.bangGv = hoSo.bangGvChiNhanh(P.mbManager, {});
      xoaNho(); out.metric = metrics.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', {});
      return out;
    };
    thu(() => {
      /* Ca biên dựng thẳng (rồi đồng bộ cờ bằng hàm chung): vắng đã xác nhận, huỷ phần thi, Writing một task, lớp đã kết thúc, em Tạm dừng, ô "-" dời. */
      const ft = all(`SELECT a.id, a.class_id, a.student_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
          WHERE a.kind = 'mock' AND a.status != 'cancelled' AND c.is_fast_track = 1 AND c.status = 'active' ORDER BY a.id`);
      assert(ft.length > 12, 'demo thiếu lượt FT');
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'speaking'`).run(ft[0].id);
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ? AND skill = 'listening'`).run(ft[1].id);
      conn.prepare(`UPDATE assessment_scores SET band = NULL WHERE attempt_id = ? AND skill = 'writing2'`).run(ft[2].id);
      conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill = 'reading'`).run(ft[3].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ? AND skill = 'writing'`).run(ft[4].id);
      conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(ft[5].class_id);
      conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(ft[6].student_id);
      conn.prepare(`UPDATE assessment_scores SET band = NULL WHERE attempt_id = ? AND skill = 'speaking'`).run(ft[7].id);
      conn.prepare(`UPDATE assessment_scores SET no_show_period_id = (SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'), no_show_by = 1, no_show_at = '2026-09-01T00:00:00.000Z' WHERE attempt_id = ? AND skill = 'speaking'`).run(ft[7].id, ft[7].id);
      cc.capNhatConOChoTatCa();
      assert(cc.demLuotLechCo() === 0, 'đồng bộ cờ sau ca biên vẫn lệch');
      const that = chup();
      conn.exec("UPDATE assessment_attempts SET o_cho_tu = ''");   // không lọc: mọi lượt đều được nạp (đúng như trước khi có lọc)
      const khongLoc = chup();
      assert(JSON.stringify(that).length > 1000, 'đầu ra rỗng — phép kiểm không soi gì');
      const lech = Object.keys(that).filter((k) => JSON.stringify(that[k]) !== JSON.stringify(khongLoc[k]));
      if (lech.length) {
        const diff = (x: any, y: any, p = ''): string | null => {
          if (JSON.stringify(x) === JSON.stringify(y)) return null;
          if (x && y && typeof x === 'object' && typeof y === 'object') {
            for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const r = diff(x[k], y[k], `${p}.${k}`); if (r) return r; }
          }
          return `${p}: có cờ ${JSON.stringify(x)?.slice(0, 120)} · không cờ ${JSON.stringify(y)?.slice(0, 120)}`;
        };
        assert(false, `đầu ra LỆCH khi bật lọc cờ ở: ${lech.slice(0, 6).join(', ')} · ${diff(that[lech[0]], khongLoc[lech[0]], lech[0])}`);
      }
    });
  });

  check('TD7c-1 · Lịch Test khối 1: lượt bị bỏ khi lọc "o_cho_tu < tuần trước" KHÔNG có ô chờ nào thi trước tuần trước (đầu ra noQuaHan không đổi); lượt có ô cũ vẫn được nạp', () => {
    cc.capNhatConOChoTatCa();
    let bot = 0, giu = 0;
    for (const homNay of [TODAY, addDays(TODAY, 7), addDays(TODAY, 21)]) {
      const tuanTruoc = addDays(week.mondayOf(homNay), -7);
      for (const [ten, p] of Object.entries(P)) {
        for (const lop of [undefined, classId('MB FT 101'), classId('MB FOU 12')]) {
          xoaNho();
          const tatCa = att.listAttempts(p, { classId: lop, scope: 'managed', chiDangHoc: true, phamViCham: true, chiConO: true }).rows;
          const moi = new Set(att.listAttempts(p, { classId: lop, scope: 'managed', chiDangHoc: true, phamViCham: true, chiConO: true, chiTruocTuan: tuanTruoc }).rows.map((r: any) => r.id));
          for (const r of tatCa as any[]) {
            const cuHon = (r.pendingDetail ?? []).some((x: any) => x.weekStart && x.weekStart < tuanTruoc);
            if (att.conBaiCanCham(r) && moi.has(r.id)) giu++;
            if (!moi.has(r.id)) bot++;
            if (att.conBaiCanCham(r) && cuHon) assert(moi.has(r.id), `${ten} lớp ${lop ?? 'mọi'} (${homNay}): lượt ${r.id} có ô thi trước ${tuanTruoc} mà bị bỏ`);
          }
        }
      }
    }
    assert(bot > 0 && giu > 0, `phép kiểm rỗng: bỏ ${bot}, giữ ${giu}`);
  });

  check('TD7b-11 · EXPLAIN: truy vấn theo lớp và truy vấn toàn hệ thống đều đi chỉ mục một phần của cờ (câu thật của các đường: tocDo.run)', () => {
    const plan = (sql: string, ...a: unknown[]) => (all(`EXPLAIN QUERY PLAN ${sql}`, ...a)).map((r) => r.detail as string).join(' | ');
    const tatCa = plan(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND a.o_cho_tu <= ?`, TODAY);
    assert(/idx_attempt_o_cho/.test(tatCa), `toàn hệ thống: ${tatCa}`);
    const theoLop = plan(`SELECT a.id FROM assessment_attempts a WHERE a.class_id IN (1, 2, 3) AND a.status != 'cancelled' AND a.o_cho_tu <= ?`, TODAY);
    assert(/idx_attempt_o_cho_lop/.test(theoLop), `theo lớp: ${theoLop}`);
  });
}

