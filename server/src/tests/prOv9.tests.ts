/**
 * PHÉP KIỂM PR-OV9 — KCK nhẹ (chủ SP 13/10): KCK là DẤU RIÊNG, Target giữ; em KCK dưới kỳ vọng → không SOS, chip trung tính "Dưới kỳ vọng · KCK",
 * Case nhẹ cho GV (không PA quy chế, không hạn, không Phối hợp / chuông); Overall đạt → Case nhẹ đóng; bỏ KCK → luật SOS thường.
 * Em thử ở MB FT 101, MT1 rơi 2 tuần trước ngày demo (mẫu `prKck`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { chotSan } from './luotThu.ts';

export async function runPrOv9Tests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { LISTENING_BY_RAW, READING_BY_RAW } = await import('../fasttrack/scoring.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { sosCaseState } = await import('../cases/sosState.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { migratePrOv9 } = await import('../migrate/prOv9.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV9 · KCK nhẹ: dấu riêng, Target giữ, Case nhẹ');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const n = (sql: string, ...a: unknown[]) => one(sql, ...a).n as number;
  const ft = t.classId('MB FT 101');
  const cy = (sid: number) => one(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const luot = (sid: number) => all(`SELECT * FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid);
  /* Em mới, MT1 ở tuần 2 tuần trước ngày demo (nhập điểm được ngay), chốt sẵn (W coi như đã dời) — điểm L/R/S quyết định kết quả. */
  const them = (fullName: string, target: unknown) => {
    const tuanThi = d.mondayOfDate(t.addDays(demoToday(), -14));
    const startWeek = t.addDays(tuanThi, -7 * (d.tuanHocCuaMt(d.lichMtGoc('LT1'), 1) - 1));
    intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName, target, startWeek, email: 'ov9@demo.test', dob: '2010-01-01' }], idempotencyKey: `ov9-${fullName}` });
    const sid = one('SELECT id FROM students WHERE full_name = ?', fullName).id as number;
    const mt1 = luot(sid)[0];
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(mt1.id);
    chotSan(conn, mt1.id);
    return { sid, cid: cy(sid).id as number, mt1 };
  };
  const cham = (attemptId: number, band: number) => {
    attempts.saveScore(P.admin, attemptId, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(band) });
    attempts.saveScore(P.admin, attemptId, 'reading', { rawScore: READING_BY_RAW.indexOf(band) });
    attempts.saveScore(P.admin, attemptId, 'speaking', { criteria: [band, band, band, band] });
  };
  const caseCua = (sid: number) => all(`SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id`, sid);
  const ketQua = (aid: number) => { xoaNho(); return attempts.resultOf(one('SELECT * FROM assessment_attempts WHERE id = ?', aid)); };

  check('OV9 (0) · migrate thêm cột sos_cases.kck, chạy lặp được; schema.sql đã có', () => {
    const a: string[] = []; migratePrOv9(conn, a);
    assert(a.length === 0, `DB từ schema.sql vẫn phải thêm: ${a.join('; ')}`);
    assert(all('SELECT name FROM pragma_table_info(?)', 'sos_cases').some((c) => c.name === 'kck'), 'thiếu cột sos_cases.kck');
  });

  check('OV9 (1) · ô Target: "6.5 KCK" / "KCK" / "-" / "6.5" tách số + dấu KCK; hiện "6.5 · KCK", "— · KCK"', () => {
    const tach = (v: unknown) => JSON.stringify(cycles.docTarget(v));
    assert(tach('6.5 KCK') === JSON.stringify({ target: 6.5, kck: true }), tach('6.5 KCK'));
    assert(tach('7 kck') === JSON.stringify({ target: 7, kck: true }), tach('7 kck'));
    assert(tach('KCK') === JSON.stringify({ target: null, kck: true }) && tach('-') === tach('KCK'), tach('KCK'));
    assert(tach(6.5) === JSON.stringify({ target: 6.5, kck: false }) && tach('') === JSON.stringify({ target: null, kck: false }), tach(6.5));
    assert(d.hienTargetKck(6.5, true) === '6.5 · KCK' && d.hienTargetKck(null, true) === '— · KCK'
      && d.hienTargetKck(6.5, false) === '6.5' && d.hienTargetKck(null, false) === '—', 'hiện Target + KCK');
    assert(d.chuTargetKck(6.5, true) === '6.5 KCK' && d.chuTargetKck(null, true) === 'KCK' && d.chuTargetKck(6, false) === '6', 'chữ ô Target');
  });

  check('OV9 (1) · dán Excel cột Target "6.5 KCK" / "KCK": lưới giữ chữ, xem trước không lỗi; thêm HV lưu Target 6.5 + KCK, lượt MT có Target', () => {
    const r = intake.parsePaste('Họ và tên\tEmail\tTarget\nA\ta@b.vn\t6.5 KCK\nB\tb@c.vn\tkck\nC\tc@d.vn\t6.5');
    assert(r.rows[0].target === '6.5 KCK' && r.rows[1].target === 'KCK' && r.rows[2].target === '6.5', JSON.stringify(r.rows));
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [{ fullName: 'A', dob: '2010-01-01', email: 'a@b.vn', target: '6.5 KCK' }] });
    assert(!pv.rows[0].issues.some((i: any) => i.field === 'target'), JSON.stringify(pv.rows[0].issues));
    const x = them('OV9 Dán Excel', '6.5 KCK');
    const c = cy(x.sid);
    assert(c.target_score === 6.5 && c.khong_cam_ket === 1, JSON.stringify(c));
    assert(luot(x.sid).every((a) => a.target_at_attempt === 6.5), JSON.stringify(luot(x.sid).map((a) => a.target_at_attempt)));
  });

  check('OV9 (1) · em KCK cũ (Target trống) giữ KCK; nhập Target 6.5 giữ KCK → lưu cả hai, lượt chưa điểm lấy 6.5; PATCH "7 KCK"', () => {
    const x = them('OV9 KCK Cũ', 'KCK');
    assert(cy(x.sid).target_score === null && cy(x.sid).khong_cam_ket === 1, 'tiền đề: KCK cũ, Target trống');
    const tt = studentProfile(P.admin, x.sid).dauHoSo.thongTin;
    assert(tt.target === null && tt.kck === true, `đầu hồ sơ "Target — · KCK": ${JSON.stringify({ t: tt.target, k: tt.kck })}`);
    cycles.reviseTarget(P.mbManager, x.cid, { newTarget: '6.5 KCK', reason: 'Em đặt Target, vẫn không cam kết' });
    const c = cy(x.sid);
    assert(c.target_score === 6.5 && c.khong_cam_ket === 1, JSON.stringify(c));
    assert(luot(x.sid).every((a) => a.target_at_attempt === 6.5), JSON.stringify(luot(x.sid).map((a) => a.target_at_attempt)));
    const rev = one('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC', x.cid);
    assert(rev.old_target === null && rev.old_khong_cam_ket === 1 && rev.new_target === 6.5 && rev.new_khong_cam_ket === 1, JSON.stringify(rev));
    const ht = one(`SELECT title FROM journey_events WHERE ref_table = 'cycle_target_revisions' AND ref_id = ?`, rev.id);
    assert(ht?.title === 'Đổi Target — · KCK → 6.5 · KCK', ht?.title);
    cycles.updateCycle(P.mbManager, x.cid, { targetScore: '7 KCK', lyDo: 'Em nâng Target' });
    assert(cy(x.sid).target_score === 7 && cy(x.sid).khong_cam_ket === 1, JSON.stringify(cy(x.sid)));
  });

  const nhe = them('OV9 Case Nhẹ', '6.5 KCK');
  cham(nhe.mt1.id, 4);   // MT1 kỳ vọng 5.5 — L/R/S 4.0 dưới kỳ vọng, đã chốt

  check('OV9 (2,3) · em KCK có kỳ vọng; MT chốt dưới kỳ vọng → không SOS, cờ "dưới kỳ vọng · KCK"', () => {
    const r = ketQua(nhe.mt1.id);
    assert(r.expectation === 5.5 && r.chot === true, JSON.stringify({ e: r.expectation, chot: r.chot }));
    assert(r.sosLevel === null && r.kckDuoi === true, JSON.stringify({ sos: r.sosLevel, kckDuoi: r.kckDuoi }));
    assert(d.DUOI_KY_VONG_KCK === 'Dưới kỳ vọng · KCK', 'nhãn chip');
  });

  check('OV9 (3) · Case nhẹ: đúng kỹ năng, kck = 1, không mức SOS, không hạn, 0 PA, 0 Phối hợp, 0 chuông SOS cho GVCN / QL', () => {
    const cs = caseCua(nhe.sid);
    assert(cs.length === 3 && cs.map((c) => c.category).sort().join() === 'listening,reading,speaking', JSON.stringify(cs.map((c) => c.category)));
    assert(cs.every((c) => c.kck === 1 && c.sos_level === null && c.han_xac_nhan === null && c.status === 'open'), JSON.stringify(cs.map((c) => [c.kck, c.sos_level, c.han_xac_nhan, c.status])));
    assert(n(`SELECT COUNT(*) n FROM case_interventions WHERE case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)`, nhe.sid) === 0, 'có PA');
    assert(n('SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id = ?', nhe.sid) === 0, 'có Phối hợp');
    assert(n(`SELECT COUNT(*) n FROM notifications WHERE entity_type = 'assessment_attempt' AND entity_id = ?`, nhe.mt1.id) === 0, 'chuông SOS GVCN');
    assert(n(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND entity_type = 'sos_case' AND entity_id IN (SELECT id FROM sos_cases WHERE student_id = ?)`,
      P.mbManager.userId, nhe.sid) === 0, 'chuông QL');
    const st = sosCaseState(cs[0].id);
    assert(st.fromSos && st.awaitingCause && st.dueOn === null, JSON.stringify(st));
  });

  check('OV9 (3) · GV phụ trách có việc "Xác nhận nguyên nhân · KCK" không hạn, không quá hạn; không dòng "Thêm PA" có hạn', () => {
    const c = caseCua(nhe.sid).find((x) => x.category === 'listening');
    assert(c.owner_user_id, 'Case chưa có người phụ trách');
    const items = myWork(loadPrincipal(c.owner_user_id), { nguoi: 'toi' }).items as any[];
    const v = items.find((i) => i.key === `cause:${c.id}`);
    assert(v && v.due === null && v.urgency !== 'overdue' && /KCK/.test(v.tieuDe), JSON.stringify(v));
    assert(!items.some((i) => i.key === `support:${c.id}`), 'còn dòng Thêm PA (có hạn)');
    const ql = myWork(P.mbManager, { nguoi: 'tat-ca' }).items as any[];
    assert(!ql.some((i) => i.caseId === c.id && i.urgency === 'overdue'), 'QL thấy quá hạn');
  });

  check('OV9 (3) · GV xác nhận nguyên nhân Case nhẹ (như Case thường) → Đang xử lý, hết việc chờ nguyên nhân; vẫn 0 PA, không hạn', () => {
    const c = caseCua(nhe.sid).find((x) => x.category === 'reading');
    sosAuto.xacNhanCase(loadPrincipal(c.owner_user_id), c.id, { primaryCode: d.issuesForTopic('reading', null)[0].code, urgency: 'attention', moTa: 'Em đọc chậm, chưa quen dạng bài.' });
    const sau = one('SELECT status, han_xac_nhan, kck FROM sos_cases WHERE id = ?', c.id);
    assert(sau.status === 'in_progress' && sau.han_xac_nhan === null && sau.kck === 1, JSON.stringify(sau));
    assert(n('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', c.id) === 0, 'xác nhận Case nhẹ sinh PA');
    assert(!sosCaseState(c.id).awaitingCause, 'vẫn chờ nguyên nhân');
  });

  check('OV9 (3) · hồ sơ: câu tóm tắt "Dưới kỳ vọng · KCK", không SOS, không đỏ; Target "6.5" + KCK', () => {
    xoaNho();
    const h = studentProfile(P.admin, nhe.sid).dauHoSo;
    const chu = h.tomTat.map((m: any) => m.chu).join(' | ');
    assert(/^KCK/.test(h.tomTat[0].chu) && /MT1 dưới kỳ vọng/.test(chu) && !/SOS \d/.test(chu), chu);
    assert(!h.tomTat.some((m: any) => m.tone === 'danger' || /^sos/.test(m.tone ?? '')), JSON.stringify(h.tomTat));
    assert(h.thongTin.target === 6.5 && h.thongTin.kck === true, JSON.stringify({ t: h.thongTin.target, k: h.thongTin.kck }));
  });

  check('OV9 (4) · Phân tích: lượt em KCK ngoài mẫu số "Lượt MT" (Tổng hợp); bỏ KCK thì lại vào', () => {
    const dem = () => tongHop.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop', khoa: 'tong', cot: 'luot' }).n as number;
    const co = dem();
    /* OV-11e (Q8): lượt đã chốt theo dấu KCK lúc chốt (`kck_at_attempt`) — đổi cả dấu trên lượt cùng cờ lộ trình. */
    const doi = (k: number) => {
      conn.prepare('UPDATE learning_cycles SET khong_cam_ket = ? WHERE id = ?').run(k, nhe.cid);
      conn.prepare('UPDATE assessment_attempts SET kck_at_attempt = ? WHERE cycle_id = ? AND kck_at_attempt IS NOT NULL').run(k, nhe.cid);
    };
    doi(0);
    const khong = dem();
    doi(1);
    assert(khong === co + 1, JSON.stringify({ co, khong }));
  });

  check('OV9 (3) · Overall đạt kỳ vọng (W vào sau) → Case nhẹ chưa ai đụng tự đóng "Overall đạt"', () => {
    const x = them('OV9 Overall Đạt', '6.5 KCK');
    cham(x.mt1.id, 5);   // 5.0 < 5.5 → Case nhẹ L/R/S
    assert(caseCua(x.sid).filter((c) => c.status !== 'done').length === 3, 'tiền đề: 3 Case nhẹ');
    attempts.saveScore(P.admin, x.mt1.id, 'writing1', { criteria: [8, 8, 8, 8] });
    attempts.saveScore(P.admin, x.mt1.id, 'writing2', { criteria: [8, 8, 8, 8] });
    const r = ketQua(x.mt1.id);
    assert(r.overall !== null && r.overall >= 5.5 && r.sosLevel === 0 && !r.kckDuoi, JSON.stringify({ o: r.overall, s: r.sosLevel, k: r.kckDuoi }));
    const cs = caseCua(x.sid);
    assert(cs.every((c) => c.status === 'done'), JSON.stringify(cs.map((c) => [c.category, c.status])));
  });

  check('OV9 (5) · bỏ KCK (Target giữ) trước khi chấm → lượt sau theo luật SOS thường: Case có hạn + PA quy chế', () => {
    const x = them('OV9 Bỏ KCK', '6.5 KCK');
    cycles.reviseTarget(P.mbManager, x.cid, { newTarget: 6.5, reason: 'Gia đình đăng ký thi' });
    assert(cy(x.sid).khong_cam_ket === 0 && cy(x.sid).target_score === 6.5, JSON.stringify(cy(x.sid)));
    cham(x.mt1.id, 4);
    const r = ketQua(x.mt1.id);
    assert(r.sosLevel === 3 && !r.kckDuoi, JSON.stringify({ s: r.sosLevel, k: r.kckDuoi }));
    const cs = caseCua(x.sid);
    assert(cs.length === 3 && cs.every((c) => c.kck === 0 && c.han_xac_nhan !== null && c.sos_level === 3), JSON.stringify(cs.map((c) => [c.kck, c.han_xac_nhan, c.sos_level])));
    assert(n(`SELECT COUNT(*) n FROM case_interventions WHERE preset = 1 AND case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)`, x.sid) === 3, 'thiếu PA quy chế');
  });

  {
    const regular: any = await import('../normal/regular.ts');
    const fou = t.classId('MB FOU 15');
    /** Em lớp thường, bài Giữa khoá (tuần đã qua — QL xếp tay như bộ demo LT2a), điểm /20 theo môn. */
    const emThuong = (ten: string, target: string, diem: Record<string, number>) => {
      intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, target, email: 'ov9@demo.test', dob: '2010-01-01' }], idempotencyKey: `ov9-${ten}` });
      const sid = one('SELECT id FROM students WHERE full_name = ?', ten).id as number;
      regular.planRegularTests(P.mbManager, fou, { studentIds: [sid], kinds: ['progress'] });
      const pt = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' ORDER BY id DESC LIMIT 1`, sid).id as number;
      for (const [k, v] of Object.entries(diem)) regular.saveRegularScore(P.admin, pt, k, { score: v, total: 20 });
      return { sid, pt };
    };
    const dat = { listening: 18, reading: 18, writing: 18, speaking: 18 };
    check('OV9 (3) · lớp thường: em KCK trượt Progress Test → Case nhẹ (kck, không hạn, không PA Bổ trợ), không Báo PH; em thường vẫn PA Bổ trợ + Báo PH', () => {
      const k = emThuong('OV9 Thường KCK', '-', { ...dat, reading: 8 });
      const ck = caseCua(k.sid);
      assert(ck.length === 1 && ck[0].kck === 1 && ck[0].han_xac_nhan === null, JSON.stringify(ck.map((c) => [c.category, c.kck, c.han_xac_nhan])));
      assert(n('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?', ck[0].id) === 0, 'Case nhẹ lớp thường có PA');
      assert(n(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv' AND status = 'pending'`, k.pt) === 0, 'em KCK còn Báo PH');
      const th = emThuong('OV9 Thường Có Target', '', { ...dat, reading: 8 });
      const ct = caseCua(th.sid);
      assert(ct.length === 1 && ct[0].kck === 0 && ct[0].han_xac_nhan !== null, JSON.stringify(ct.map((c) => [c.kck, c.han_xac_nhan])));
      assert(n(`SELECT COUNT(*) n FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, ct[0].id) === 1, 'em thường mất PA Bổ trợ');
      assert(n(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv' AND status = 'pending'`, th.pt) === 1, 'em thường mất Báo PH');
    });
  }

  check('OV9 (5) · lệnh chuyển: ô Target "6.5 kck" hợp lệ (Target + KCK); "KCK" vẫn được; MucTieuLenh tách số + dấu', () => {
    const o = d.docOTarget('6,5 kck');
    assert(o.loi === null && o.giaTri === '6.5 KCK', JSON.stringify(o));
    assert(d.docOTarget('kck').giaTri === 'KCK' && d.docOTarget('6.5').giaTri === 6.5, 'KCK / số');
    assert(d.docOTarget('10 KCK').loi, 'band sai vẫn phải lỗi');
    assert(JSON.stringify(d.tachMucTieu('6.5 KCK')) === JSON.stringify({ target: 6.5, kck: true })
      && JSON.stringify(d.tachMucTieu('KCK')) === JSON.stringify({ target: null, kck: true })
      && JSON.stringify(d.tachMucTieu(6)) === JSON.stringify({ target: 6, kck: false }), 'tachMucTieu');
    assert(d.ghepMucTieu(6.5, true) === '6.5 KCK' && d.ghepMucTieu(null, true) === 'KCK' && d.ghepMucTieu(6, false) === 6 && d.ghepMucTieu(null, false) === null, 'ghepMucTieu');
  });
}
