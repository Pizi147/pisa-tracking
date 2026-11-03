/** PHÉP KIỂM PR-HSM — hồ sơ Mock, nhận xét W/S, GV chấm Speaking, tiêu chí W1 TA / W2 TR. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrHsmTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrHsm } = await import('../migrate/prHsm.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-HSM · Hồ sơ Mock, nhận xét W/S, GV chấm Speaking');

  const coCot = (c: any, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).some((x) => x.name === cot);

  check('HSM (1a) · migrate thêm 3 cột trên DB cũ, chạy lại không làm gì; DB demo đã có đủ', () => {
    const tam = new SqliteDb(':memory:');
    tam.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE assessment_scores (id INTEGER PRIMARY KEY, attempt_id INTEGER, skill TEXT)');
    const a: string[] = []; migratePrHsm(tam, a);
    assert(a.length === 1 && ['comment', 'examiner_user_id', 'examiner_name'].every((c) => coCot(tam, c)), a.join('; '));
    const b: string[] = []; migratePrHsm(tam, b);
    assert(b.length === 0, `lần 2 vẫn thêm: ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrHsm(conn, c);
    assert(c.length === 0 && coCot(conn, 'examiner_name'), 'schema.sql thiếu cột PR-HSM');
  });

  check('HSM (1b) · tiêu chí theo bài nhập: W1 TA, W2 TR, L/R không có', () => {
    assert(d.tieuChiNganCua('writing1')?.[0] === 'TA' && d.tieuChiNganCua('writing2')?.[0] === 'TR', 'sai tên tắt W1/W2');
    assert(d.tieuChiCua('writing2')?.[0] === 'Task Response' && d.tieuChiNganCua('speaking')?.join(' ') === 'FC LR GRA P', 'sai tên đủ');
    assert(d.tieuChiNganCua('listening') === null && d.tieuChiCua('reading') === null, 'L/R không có tiêu chí');
  });

  check('HSM (1c) · kiemNhanXet: trống → null, > 1000 → lỗi, không phải chữ → lỗi', () => {
    assert(JSON.stringify(d.kiemNhanXet('  ')) === '{"gt":null}' && JSON.stringify(d.kiemNhanXet(null)) === '{"gt":null}', 'trống phải null');
    assert(JSON.stringify(d.kiemNhanXet('  Tốt ')) === '{"gt":"Tốt"}', 'phải cắt khoảng trắng');
    assert('loi' in d.kiemNhanXet('a'.repeat(1001)) && !('loi' in d.kiemNhanXet('a'.repeat(1000))), 'trần 1000');
    assert('loi' in d.kiemNhanXet(5), 'số phải lỗi');
  });

  check('HSM (1e) · tenGvCham ưu tiên tài khoản', () => {
    assert(d.tenGvCham({ examinerUserName: 'Trang', examinerName: 'Lan' }) === 'Trang', 'phải lấy tài khoản');
    assert(d.tenGvCham({ examinerName: 'Cô Lan' }) === 'Cô Lan' && d.tenGvCham({}) === null, 'tên ngoài / trống');
  });

  // ------------------------------------------------------------------ khối 2: máy chủ
  const { assertThrows, P, TODAY, addDays, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const profile: any = await import('../students/profile.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const LOP = classId('MB FT 101');
  const QL = P.mbManager;
  const tuanNay = week.mondayOf(TODAY);
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => {
    try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); }
  };
  /** Em mới ở MB FT 101, MT1 tuần này (chưa hoàn tất) — dựng qua `commitIntake` + `createAttempt`. */
  const emMoiLop = (lop: string, ten: string) => {
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: `HSM ${ten}`, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `hsm-${ten}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `HSM ${ten}`);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    boLichTuTao(conn, cy.id);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: st.id, cycleId: cy.id, classId: classId(lop), no: 1, periodId: week.ensurePeriod(tuanNay).id });
    return { sid: st.id as number, aid: a.id as number };
  };
  const emMoi = (ten: string) => emMoiLop('MB FT 101', ten);
  const dong = (aid: number, skill: string) => get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);
  const oCua = (aid: number, skill: string, p = QL) => svc.attemptDetail(p, aid).cells.find((c: any) => c.skill === skill);
  const S4 = [6, 7, 6, 7];   // P1: tiêu chí số nguyên — band 6.5 như cũ

  const e1 = emMoi('Nhận Xét');
  check('HSM (2a) · GVBM Speaking lưu S + GV chấm tài khoản → dòng có examiner_user_id, ô có gvCham.ten', () => {
    svc.saveScore(P.sTeacher, e1.aid, 'speaking', { criteria: S4, gvCham: { performerUserId: P.sTeacher.userId } }, TODAY);
    assert(dong(e1.aid, 'speaking').examiner_user_id === P.sTeacher.userId, JSON.stringify(dong(e1.aid, 'speaking')));
    const c = oCua(e1.aid, 'speaking');
    const ten = get('SELECT full_name FROM users WHERE id = ?', P.sTeacher.userId).full_name;
    assert(c.gvCham?.ten === ten && c.gvCham.userId === P.sTeacher.userId && c.nhanXet === null, JSON.stringify(c.gvCham));
    assert(oCua(e1.aid, 'writing1').gvCham === null, 'W1 không có GV chấm');
  });

  check('HSM (2b) · chỉ nhận xét trên ô đã có điểm: không lý do, không đổi Nhập bởi/band, không đụng SOS; nhật ký score.nhan_xet', () => {
    const cu = dong(e1.aid, 'speaking');
    const sos0 = get('SELECT (SELECT COUNT(*) FROM case_signals WHERE attempt_id = ?) + (SELECT COUNT(*) FROM sos_cases WHERE attempt_id = ?) AS n', e1.aid, e1.aid).n;
    svc.saveScore(QL, e1.aid, 'speaking', { nhanXet: '  Phát âm rõ  ' }, TODAY);
    const moi = dong(e1.aid, 'speaking');
    assert(moi.comment === 'Phát âm rõ' && moi.entered_by === cu.entered_by && moi.entered_at === cu.entered_at && moi.band === cu.band,
      JSON.stringify({ cu, moi }));
    assert(moi.examiner_user_id === cu.examiner_user_id, 'chỉ nhận xét không được xoá GV chấm');
    const sos1 = get('SELECT (SELECT COUNT(*) FROM case_signals WHERE attempt_id = ?) + (SELECT COUNT(*) FROM sos_cases WHERE attempt_id = ?) AS n', e1.aid, e1.aid).n;
    assert(sos0 === sos1, `SOS đổi ${sos0} → ${sos1}`);
    const nk = get(`SELECT before_json, after_json FROM audit_logs WHERE action = 'score.nhan_xet' AND entity_id = ? ORDER BY id DESC`, e1.aid);
    assert(nk && /Phát âm rõ/.test(nk.after_json), JSON.stringify(nk));
    assert(oCua(e1.aid, 'speaking').nhanXet === 'Phát âm rõ', 'ô không đọc được nhận xét');
    /* GV chấm người ngoài, rồi xoá — đều không đòi lý do. */
    svc.saveScore(QL, e1.aid, 'speaking', { gvCham: { performerName: 'Cô Lan' } }, TODAY);
    assert(oCua(e1.aid, 'speaking').gvCham?.ten === 'Cô Lan' && oCua(e1.aid, 'speaking').gvCham.userId === null, 'tên ngoài');
    assert(dong(e1.aid, 'speaking').examiner_user_id === null, 'tài khoản phải về NULL khi chọn người ngoài');
  });

  /* OV-4b: nhận xét mở cho cả L/R (trước đây L → 400). */
  check('HSM (2c) · luật máy chủ: nhận xét L lưu được (OV-4b) · GV chấm W1 → 400 · 1001 ký tự → 400 · tên ngoài 1 ký tự → 400', () => {
    /* Không ghi gì (lớp MB FT 101 còn được DL-2 chụp ảnh): L chỉ còn bị chặn theo độ dài, không theo kỹ năng. */
    let cauL = '';
    try { svc.saveScore(QL, e1.aid, 'listening', { nhanXet: 'a'.repeat(1001) }, TODAY); } catch (e: any) { cauL = String(e?.message); }
    assert(/300/.test(cauL) && !/Chỉ Writing/.test(cauL), `L (OV-4b: có nhận xét): ${cauL}`);   // N35: nhận xét MT ≤ 300
    assert(maLoi(() => svc.saveScore(QL, e1.aid, 'writing1', { gvCham: { performerSelf: true } }, TODAY)) === 400, 'W1');
    assert(maLoi(() => svc.saveScore(QL, e1.aid, 'writing1', { nhanXet: 'a'.repeat(1001) }, TODAY)) === 400, '1001');
    assert(maLoi(() => svc.saveScore(QL, e1.aid, 'speaking', { gvCham: { performerName: 'L' } }, TODAY)) === 400, 'tên 1 ký tự');
  });

  check('HSM (2d) · quyền = quyền sửa ô: GV không phân công S → 403; hoàn tất: GVBM kèm điểm 403, Quản lý được; MT lịch sử: GVCN ghi nhận xét W2', () => {
    assert(maLoi(() => svc.saveScore(P.w1Teacher, e1.aid, 'speaking', { nhanXet: 'x' }, TODAY)) === 403, 'GV W1 sửa nhận xét S');
    /* Hoàn tất = đủ điểm mọi kỹ năng bắt buộc + hết Chủ nhật tuần thi. */
    svc.saveScore(QL, e1.aid, 'listening', { rawScore: 30 }, TODAY);
    svc.saveScore(QL, e1.aid, 'reading', { rawScore: 30 }, TODAY);
    for (const k of ['writing1', 'writing2']) svc.saveScore(QL, e1.aid, k, { criteria: S4 }, TODAY);
    const sau = addDays(TODAY, 30);
    /* LUAT-34 (Luật 3): "Đủ điểm" không còn khoá — GV đúng kỹ năng sửa cả điểm (máy chủ: mtTrangThai T21). Không ghi thêm (ảnh chụp DL-2): soi cờ ô. */
    assert(svc.attemptDetail(P.sTeacher, e1.aid).cells.find((c: any) => c.skill === 'speaking')?.canEdit === true, 'GVBM sau Đủ điểm vẫn sửa được');
    svc.saveScore(QL, e1.aid, 'speaking', { nhanXet: 'Quản lý sửa sau hoàn tất' }, sau);
    assert(dong(e1.aid, 'speaking').comment === 'Quản lý sửa sau hoàn tất', 'Quản lý sau hoàn tất');
    const e2 = emMoi('Lịch Sử');
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(e2.aid);
    svc.saveScore(P.coreTeacher, e2.aid, 'writing2', { nhanXet: 'Bài viết đủ ý' }, TODAY);
    assert(dong(e2.aid, 'writing2').comment === 'Bài viết đủ ý' && dong(e2.aid, 'writing2').band === null, 'GVCN MT lịch sử');
  });

  /* LUAT-34 (T20): Huỷ điểm GIỮ nhận xét + GV chấm (điểm cất, Khôi phục được); Thi lại (bài mới) vẫn xoá. */
  check('HSM (2e) · Huỷ điểm S giữ nhận xét + GV chấm (LUAT-34); Thi lại W xoá nhận xét W1, W2', () => {
    const e = emMoi('Huỷ Điểm');
    svc.saveScore(QL, e.aid, 'speaking', { criteria: S4, nhanXet: 'Nói trôi', gvCham: { performerUserId: P.sTeacher.userId } }, TODAY);
    assert(dong(e.aid, 'speaking').comment === 'Nói trôi' && dong(e.aid, 'speaking').examiner_user_id === P.sTeacher.userId, 'lưu kèm điểm');
    keHoach.huyDiem(QL, { attemptId: e.aid, skill: 'speaking', lyDo: 'Chấm nhầm bài của em khác' });
    const r = dong(e.aid, 'speaking');
    assert(r.band === null && r.comment === 'Nói trôi' && r.examiner_user_id === P.sTeacher.userId, JSON.stringify(r));
    const nk = get(`SELECT before_json FROM audit_logs WHERE entity_id = ? AND entity_label = 'speaking' AND action LIKE 'score.%' ORDER BY id DESC`, e.aid);
    assert(/Nói trôi/.test(nk?.before_json ?? ''), 'nhật ký mất nhận xét cũ');
    for (const k of ['writing1', 'writing2']) svc.saveScore(QL, e.aid, k, { criteria: S4, nhanXet: `Nhận xét ${k}` }, TODAY);
    keHoach.thiLai(QL, { attemptId: e.aid, skills: ['writing'], periodId: week.ensurePeriod(addDays(tuanNay, 7)).id, lyDo: 'Đề lỗi, thi lại', force: true });
    assert(dong(e.aid, 'writing1').comment === null && dong(e.aid, 'writing2').comment === null, 'thi lại còn nhận xét');
  });

  const eV = emMoi('Vắng S');
  check('HSM (2f) · E8: kỹ năng đã xác nhận vắng → canEdit false ở hồ sơ Mock và lưới; saveScore vẫn 400', () => {
    skillSch.setSitStatus(QL, eV.aid, 'speaking', 'absent', 'Em vắng buổi Speaking');
    assert(oCua(eV.aid, 'speaking').canEdit === false && oCua(eV.aid, 'speaking').viec === false, 'hồ sơ Mock');
    assert(oCua(eV.aid, 'listening').canEdit === true, 'kỹ năng khác vẫn sửa được');
    const sheet = svc.classScoreSheet(QL, LOP, week.ensurePeriod(tuanNay).id, TODAY);
    const row = sheet.rows.find((r: any) => r.attemptId === eV.aid);
    assert(row && row.cells.find((c: any) => c.skill === 'speaking').canEdit === false, 'lưới');
    assert(maLoi(() => svc.saveScore(QL, eV.aid, 'speaking', { criteria: S4 }, TODAY)) === 400, 'saveScore vắng');
  });

  check('HSM (2g) · dời do vắng lần 1 → skillSchedule.doiTu = tuần cũ; lượt huỷ → huy.ai / huy.lyDo', () => {
    const kq = absence.requestAbsenceMove(P.coreTeacher, eV.aid, ['speaking'], { today: TODAY });
    assert(kq.outcomes[0].moveNo === 1, JSON.stringify(kq.outcomes[0]));
    const dt = svc.attemptDetail(QL, eV.aid);
    const s = dt.skillSchedule.find((r: any) => r.skill === 'speaking');
    assert(s.doiTu === d.tuanLich(tuanNay, TODAY), `doiTu ${s.doiTu}`);
    assert(dt.skillSchedule.find((r: any) => r.skill === 'listening').doiTu === null && dt.huy === null, 'L không dời, lượt chưa huỷ');
    const e = emMoi('Huỷ Lượt');
    svc.huyLuot(QL, e.aid, { lyDo: 'Em chuyển lớp giữa đợt' });
    const h = svc.attemptDetail(QL, e.aid).huy;
    const ten = get('SELECT full_name FROM users WHERE id = ?', QL.userId).full_name;
    assert(h?.lyDo === 'Em chuyển lớp giữa đợt' && h.ai === ten && !!h.khi, JSON.stringify(h));
  });

  check('HSM (2h) · hồ sơ HV: em có S dời do vắng → doiKyNang chứa speaking; lượt 2/4 điểm → evaluable false', () => {
    const a = profile.studentProfile(QL, eV.sid).attempts.find((x: any) => x.id === eV.aid);
    assert(a && a.doiKyNang.includes('speaking') && a.huyPhan === false, JSON.stringify(a && { d: a.doiKyNang, h: a.huyPhan }));
    const e = emMoi('Hai Bốn');
    svc.saveScore(QL, e.aid, 'listening', { rawScore: 30 }, TODAY);
    svc.saveScore(QL, e.aid, 'reading', { rawScore: 30 }, TODAY);
    const b = profile.studentProfile(QL, e.sid).attempts.find((x: any) => x.id === e.aid);
    assert(b && b.evaluable === false && b.scored === 2 && b.required === 4, JSON.stringify(b && { ev: b.evaluable, s: b.scored, r: b.required }));
  });

  check('HSM (2i) · lưới lớp: số câu SQL không đổi khi có nhận xét + GV chấm (join trong câu có sẵn)', () => {
    const pid = week.ensurePeriod(tuanNay).id;
    const e = emMoi('Đếm Câu');
    svc.classScoreSheet(QL, LOP, pid, TODAY);
    const n0 = nguCanh.soCauSql(); svc.classScoreSheet(QL, LOP, pid, TODAY); const truoc = nguCanh.soCauSql() - n0;
    svc.saveScore(QL, e.aid, 'speaking', { criteria: S4, nhanXet: 'Tốt', gvCham: { performerName: 'Cô Lan' } }, TODAY);
    svc.classScoreSheet(QL, LOP, pid, TODAY);
    const n1 = nguCanh.soCauSql(); svc.classScoreSheet(QL, LOP, pid, TODAY); const sau = nguCanh.soCauSql() - n1;
    /* SV-NX-CASE: ô đầu tiên CÓ ĐIỂM của trang làm hỏi "MT mới nhất" — một câu cho cả trang (không theo số ô / nhận xét). */
    assert(sau <= truoc + 1, `${truoc} → ${sau} câu`);
  });

  // ------------------------------------------------------------------ khối 3: ô điểm dùng chung (đọc nguồn)
  const { docSach } = await import('./panelUx3.tests.ts');
  check('HSM (3) · ScoreEntry: tiêu chí qua tieuChiCua, không "— (—)", lỗi dưới ô có aria, nút Vắng + thông báo ngắn (không Hoàn tác), nhận xét ≤ 1000', () => {
    const se = docSach('web/src/modules/fasttrack/ScoreEntry.tsx');
    const hop = docSach('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(!/CRITERIA\[|criteriaSetFor\(/.test(se + hop) && /tieuChiNganCua\(/.test(hop), 'còn CRITERIA / criteriaSetFor');
    assert(!se.includes("'—'} ({"), 'còn kiểu "— (—)"');
    assert(/aria-invalid/.test(se) && /aria-describedby/.test(se) && /role="alert"/.test(se), 'lỗi dưới ô thiếu aria');
    const nut = se.slice(se.indexOf('function NutDau'), se.indexOf('function NutDau') + 900);
    assert(/Vắng/.test(nut) && /thongBaoVang\(/.test(se) && !/hoanTac\(/.test(se), 'nút Vắng / thông báo ngắn, không Hoàn tác (PR-HK2 Q4 = B)');
    /* OV-4b: hộp nhập điểm (thay hộp tiêu chí) có nhận xét ≤ 1000 + Enter lưu. */
    assert(/maxLength=\{NHAN_XET_TOI_DA\}/.test(hop) && /Nhận xét/.test(hop) && /key !== 'Enter'/.test(hop), 'hộp nhập điểm thiếu nhận xét / Enter');
    assert(/progress === 'lich_su'\) return <Info pending>\{t\('Nhập bù, không tính hạn'\)\}<\/Info>/.test(se), 'mất nhánh Nhập bù (PR-MT)');
    const gv = docSach('web/src/modules/cham/GvCham.tsx');
    assert(gv.includes('pisa:gv-cham:') && /try \{/.test(gv), 'GvCham thiếu khoá nhớ / try');
  });

  // ------------------------------------------------------------------ khối 4: lưới, điện thoại, Lịch Test
  check('HSM (4) · lưới FT: GV chấm một lần + cột W tổng; lớp thường "Điền cả cột"; Lịch Test chung độ rộng; ✎ điện thoại; nhanLuot', () => {
    const ft = docSach('web/src/modules/cham/LuoiFT.tsx');
    assert(/useGvChamCot\(/.test(ft) && /skill === 'writing'/.test(ft) && /verdicts/.test(ft), 'LuoiFT thiếu GV chấm / cột W');
    const th = docSach('web/src/modules/cham/LuoiThuong.tsx');
    assert(th.includes('Điền cả cột') && !/>\s*↓\s*</.test(th) && /tongLaySan=\{/.test(th), 'LuoiThuong');
    assert(/COT_DAU_LICH_TEST/.test(docSach('web/src/modules/test/lichTest/KhoiNo.tsx')), 'KhoiNo không dùng COT_DAU_LICH_TEST');
    assert(/<ODiemMt/.test(docSach('web/src/modules/cham/MotKyNang.tsx')), 'MotKyNang thiếu ODiemMt (nhận xét trong hộp nhập điểm, OV-4b)');
    assert(d.nhanLuot('planned', 2, 4) === 'Đang chấm · 2/4' && d.nhanLuot('planned', 0, 4) === 'Đã lên lịch', 'nhanLuot planned');
    assert(d.nhanLuot('cancelled', 2, 4) === 'Đã huỷ' && d.nhanLuot('done', 4, 4) === 'Xong', 'nhanLuot huỷ / xong');
  });

  // ------------------------------------------------------------------ khối 5: hồ sơ Mock M10 (đọc nguồn)
  check('HSM (5) · hồ sơ Mock: dải ODiemLon, sosLevel (không failedCount), bỏ "Writing (tổng)"; ODiemLon dùng HopNhapDiem (OV-4b) + tabular-nums', () => {
    const mock = docSach('web/src/modules/fasttrack/MockDetailPage.tsx');
    /* HSL-FT (M4 khung A): ô điểm vào dòng kỹ năng — cùng `useODiem` với dải ô lớn. */
    assert(/<DaiODiemLon|useODiem\(/.test(mock) && /sosLevel/.test(mock) && !/failedCount/.test(mock), 'MockDetailPage: dải ô lớn / sosLevel');
    assert(!mock.includes('Writing (tổng)') && !/<InlineScoreEditor/.test(mock), 'bảng dưới còn dòng Writing (tổng) / trình sửa trong dòng');
    assert(/<ONhanXet/.test(mock) && /nhanLuot\(/.test(mock), 'khối nhận xét / nhanLuot');
    const lon = docSach('web/src/modules/fasttrack/ODiemLon.tsx');
    assert(/<HopNhapDiem/.test(lon) && /tabular-nums/.test(lon) && /text-\[28px\] font-bold/.test(lon), 'ODiemLon');
  });

  // ------------------------------------------------------------------ khối 6: hồ sơ HV › bảng Mock Test (đọc nguồn)
  check('HSM (6) · hồ sơ HV: bảng Mock Test một cột Kết quả (KetQuaDot), không attemptStatusLabel / "Hồ sơ đợt ›"', () => {
    const hs = docSach('web/src/modules/students/StudentDetailPage.tsx');
    const bang = hs.slice(hs.indexOf('function IeltsAttempts'), hs.indexOf('function RatioAttempts'));
    assert(bang.length > 100 && !/attemptStatusLabel\(/.test(bang) && !bang.includes('Hồ sơ đợt ›') && /<KetQuaDot|<KetQuaMt/.test(bang), 'IeltsAttempts');   // U02 (UA-Q4): `KetQuaMt` — đạt / SOS gọn, còn lại `KetQuaDot`
    // PR-U12: nhãn tách ra NhanDot, dùng chung với bảng lớp thường
    const nhan = hs.slice(hs.indexOf('function NhanDot'), hs.indexOf('function IeltsAttempts'));
    assert(/doiKyNang/.test(nhan) && /huyPhan/.test(nhan) && /<NhanDot a=\{a\}/.test(bang) && /<Link/.test(bang), 'nhãn dời/huỷ phần, MT là liên kết');
  });

  // ------------------------------------------------------------------ khối 7: GV Speaking chấm S chéo lớp FT cùng chi nhánh (chủ sản phẩm 30/09)
  const perm: any = await import('../permissions.ts');
  check('HSM (7) · GV Speaking chấm S lớp FT khác cùng chi nhánh: được (quyền, không thành việc); L → 403; chi nhánh khác / GV W1 → 403', () => {
    const ft102 = classId('MB FT 102');
    const trangId = P.sTeacher.userId;
    const pc = get(`SELECT id FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND skill = 'speaking' AND status = 'active'`, trangId, ft102);
    assert(pc, 'dữ liệu demo: Trang phải dạy S ở MB FT 102');
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id = ?`).run(pc.id);
    try {
      const trang = perm.loadPrincipal(trangId);
      assert(!perm.mySkills(trang, ft102, ['speaking']).length, 'không còn phân công S lớp 102 — không phải việc');
      assert(perm.lopFtChoGvSpeaking(trang, TODAY).includes(ft102), 'lớp FT cùng chi nhánh phải mở');
      const e = emMoiLop('MB FT 102', 'Chấm Chéo');
      const o = svc.attemptDetail(trang, e.aid).cells;
      const s = o.find((c: any) => c.skill === 'speaking'), l = o.find((c: any) => c.skill === 'listening');
      assert(s.canEdit === true && s.viec === false && s.mine === false && l.canEdit === false, JSON.stringify({ s: [s.canEdit, s.viec, s.mine], l: l.canEdit }));
      svc.saveScore(trang, e.aid, 'speaking', { criteria: S4, gvCham: { performerSelf: true } }, TODAY);
      assert(dong(e.aid, 'speaking').examiner_user_id === trangId && dong(e.aid, 'speaking').entered_by === trangId, 'lưu S + GV chấm');
      assert(maLoi(() => svc.saveScore(trang, e.aid, 'listening', { rawScore: 30 }, TODAY)) === 403, 'L phải 403');
      assert(maLoi(() => svc.saveScore(P.w1Teacher, e.aid, 'speaking', { criteria: S4 }, TODAY)) === 403, 'GV W1 không dạy S phải 403');
      const cp = classId('CP FT 110');
      assert(!perm.lopFtChoGvSpeaking(trang, TODAY).includes(cp) && !perm.can(trang, d.PERMISSIONS.ATTEMPT_VIEW, { classId: cp }), 'chi nhánh khác không mở');
      assert(!perm.lopFtChoGvSpeaking(trang, TODAY).includes(classId('MB FOU 12')), 'lớp thường không áp');
      const ds = svc.classScoreSheet(trang, ft102, week.ensurePeriod(tuanNay).id, TODAY);
      assert(ds.editableSkills.includes('speaking') && !ds.editableSkills.includes('listening'), JSON.stringify(ds.editableSkills));
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id = ?`).run(pc.id);
    }
  });
}
