/** PHÉP KIỂM PR-UXF-a — số liệu khớp + sót lớp thường (kế hoạch 2026-10-01). Mỗi sửa có phép kiểm so hai đường; mọi đường quyền có phép PHỦ ĐỊNH. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrUxfATests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const classes: any = await import('../classes/classes.ts');
  const transition: any = await import('../classes/transition.ts');
  const cuoiKhoaMod: any = await import('../normal/cuoiKhoa.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nPR-UXF-a · Số liệu khớp + sót lớp thường');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const lopId = (code: string) => get('SELECT id FROM classes WHERE code = ?', code).id as number;
  const emId = (ten: string) => get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];

  // ==================================================================== Task 1 · P0 K2-25
  check('UXF-a (1) · khacGoiY: đủ 6 nhánh (Pass+học lại · <50%+lên · 50–59%+học lại · gợi ý null · Pass+FT · hướng null)', () => {
    const goi = (tyLe: number) => d.goiYCuoiKhoa({ ct: 'BE', tyLe, monTruot: [] });
    assert(d.khacGoiY('hoc_lai', goi(0.8)) === true, 'Pass + học lại');
    assert(d.khacGoiY('len_lop', goi(0.45)) === true, '< 50% + lên');
    assert(d.khacGoiY('hoc_lai', goi(0.55)) === false, '50–59% + học lại');
    assert(d.khacGoiY('hoc_lai', null) === false, 'gợi ý null');
    assert(d.khacGoiY('fast_track', goi(0.8)) === false, 'Pass + FT');
    assert(d.khacGoiY(null, goi(0.8)) === false, 'hướng null');
  });

  check('UXF-a (1) · máy chủ bắt lý do khi khác Web gợi ý — thân gửi khacGoiY:false KHÔNG lách được; 50–59% không đòi lý do', () => {
    const be04 = lopId('MB BE 04'), be03 = lopId('MB BE 03');
    const huy = emId('Tạ Đức Huy'), khoi = emId('Đặng Minh Khôi');
    const ra = (dong: any) => lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [lenh.dongTuBody(dong)] });
    const r1 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03 });
    assert(r1.failed.length === 1 && r1.failed[0].message === 'Ghi lý do ngắn', `không lý do: ${JSON.stringify(r1)}`);
    const r2 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03, khacGoiY: false });
    assert(r2.failed[0]?.message === 'Ghi lý do ngắn', `khacGoiY:false vẫn bị chặn: ${JSON.stringify(r2)}`);
    const r3 = ra({ studentId: huy, huong: 'hoc_lai', toClassId: be03, lyDo: 'Phụ huynh xin học lại' });
    assert(r3.ok.length === 1, `có lý do: ${JSON.stringify(r3)}`);
    const l = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, huy);
    assert(l.khac_goi_y === 1, 'khac_goi_y = 1');
    const r4 = ra({ studentId: khoi, huong: 'hoc_lai', toClassId: be03 });
    assert(r4.ok.length === 1, `55% học lại không lý do: ${JSON.stringify(r4)}`);
    const lk = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, khoi);
    assert(lk.khac_goi_y === 0, 'khac_goi_y = 0');
    lenh.huyLenh(P.mbManager, l.id, 'Dọn phép kiểm');
    lenh.huyLenh(P.mbManager, lk.id, 'Dọn phép kiểm');
  });

  check('UXF-a (1) · suaLenh đổi hướng sang lệch gợi ý mà không lý do → 400; thân PATCH không nhận khacGoiY', () => {
    const be04 = lopId('MB BE 04'), be03 = lopId('MB BE 03'), ele02 = lopId('MB ELE 02');
    const huy = emId('Tạ Đức Huy');
    const r = lenh.raLenh(P.mbManager, { lopNguonId: be04, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: huy, huong: 'len_lop', toClassId: ele02 }] });
    assert(r.ok.length === 1, `lên ELE khớp gợi ý: ${JSON.stringify(r)}`);
    const l = get(`SELECT id, khac_goi_y FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, huy);
    assert(l.khac_goi_y === 0, 'khớp gợi ý → 0');
    assert(!('khacGoiY' in lenh.suaTuBody({ khacGoiY: false, huong: 'hoc_lai' })), 'suaTuBody bỏ khacGoiY');
    assert(maLoi(() => lenh.suaLenh(P.mbManager, l.id, lenh.suaTuBody({ huong: 'hoc_lai', toClassId: be03, khacGoiY: false }))) === 400, 'đổi sang học lại không lý do');
    lenh.huyLenh(P.mbManager, l.id, 'Dọn phép kiểm');
  });

  // ==================================================================== Task 2 · K2-01 + K2-12
  check('UXF-a (2) · ketQuaGanNhat lớp thường Cuối khoá đủ điểm: hậu tố hướng ở dòng 1 (45/55/64/78 %); thiếu điểm, Giữa khoá: không hậu tố', () => {
    const k = (o: any) => d.ketQuaGanNhat({
      mode: 'ratio', attemptLabel: 'Cuối khoá', attemptKind: 'final', sosLevel: 0, provisional: false, scored: 4, required: 4, failed: 0,
      overall: null, expectation: null, belowSkills: [], failedSkills: [], chuongTrinh: 'BE', ...o,
    });
    const truot = [{ skill: 'writing', score: 8, total: 20 }, { skill: 'speaking', score: 9, total: 20 }];
    assert(k({ tyLeTong: 0.45 }).dong1 === 'Cuối khoá → học lại', k({ tyLeTong: 0.45 }).dong1);
    assert(k({ tyLeTong: 0.55 }).dong1 === 'Cuối khoá → QL cân nhắc', '55%');
    assert(k({ tyLeTong: 0.64, failed: 2, failedSkills: truot }).dong1 === 'Cuối khoá → lên + bổ trợ', '64%');
    assert(k({ tyLeTong: 0.78 }).dong1 === 'Cuối khoá → Pass', '78%');
    assert(k({ tyLeTong: null, scored: 3 }).dong1 === 'Cuối khoá · 3/4 môn có điểm', 'thiếu điểm');
    assert(k({ attemptLabel: 'Giữa khoá', attemptKind: 'progress', tyLeTong: 0.45 }).dong1 === 'Giữa khoá', 'Giữa khoá');
    assert(!/\d%/.test(k({ tyLeTong: 0.45 }).dong1), 'hậu tố không dính số %');
  });

  check('UXF-a (2) · hai đường MB BE 04: roster.cuoiKhoa.tyLe = cuoiKhoaTheoHocVien; hậu tố Kết quả gần nhất = goiY.nhanNgan; cột Hướng gợi ý = chữ panel Chuyển lớp', () => {
    const be04 = lopId('MB BE 04');
    const roster = classes.classRoster(P.mbManager, be04) as any[];
    const ck = cuoiKhoaMod.cuoiKhoaTheoHocVien(be04);
    const tp = transition.transitionPlan(P.mbManager, be04);
    let coGoiY = 0;
    assert(roster.length > 0, 'lớp có em');
    for (const r of roster) {
      const e = ck.get(r.id);
      assert(r.cuoiKhoa && e && r.cuoiKhoa.tyLe === e.tyLe, `tyLe ${r.fullName}`);
      const g = r.cuoiKhoa.goiY;
      const dong1 = d.ketQuaGanNhat(r.standing).dong1 as string;
      if (!g) { assert(!/→/.test(dong1 ?? ''), `không gợi ý thì không hậu tố: ${dong1}`); continue; }
      coGoiY += 1;
      assert(dong1.endsWith(g.nhanNgan), `hậu tố ${r.fullName}: ${dong1} ≠ ${g.nhanNgan}`);
      const x = tp.students.find((s: any) => s.id === r.id);
      assert(x?.cuoiKhoa?.goiY?.nhanHuong === g.nhanHuong, `Hướng gợi ý ${r.fullName}: ${x?.cuoiKhoa?.goiY?.nhanHuong} ≠ ${g.nhanHuong}`);
    }
    assert(coGoiY >= 2, `ít nhất Huy + Khôi có gợi ý: ${coGoiY}`);
  });

  // ==================================================================== dữ liệu riêng (Task 3 trở đi): lớp FOU thử, GVBM L có nợ, GVBM R không nợ
  const NOW = new Date().toISOString();
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let seq = 0;
  const taoLop = (code: string, kind: 'FT' | 'FOU') =>
    (intake.createClass(P.admin, { code, branchId: MB, kind, isFastTrack: kind === 'FT', startDate: '2026-08-03' }) as any).id as number;
  const taoHv = (cid: number, ft: boolean) => {
    seq += 1;
    const ten = `Hoc vien UXF ${seq}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, dob, created_at) VALUES (?,?,?,?, 'active', '2010-01-01', ?)`)
      .run(`PISA-UXF-${seq}`, ten, ten.toLowerCase(), MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-08-03', ?)`).run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, ?, ?, ?, '2026-08-03', 'active', ?)`)
      .run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', ft ? 6.5 : null, NOW).lastInsertRowid);
    return { sid, cycleId };
  };
  const themLuot = (o: { sid: number; cycleId: number; cid: number; no: number; kind: string; tuan: string; status?: string }) => {
    const id = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(o.cycleId, o.sid, o.no, o.kind, o.cid, week.ensurePeriod(o.tuan).id, o.status ?? 'planned', NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(id);
    return id;
  };
  const diem = (attemptId: number, ds: Record<string, [number, number]>) => {
    for (const [k, [x, tong]] of Object.entries(ds)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at) VALUES (?,?,?,?,?,?)`).run(attemptId, k, x, tong, P.admin.userId, NOW);
    }
  };
  const gvMb = (conn.prepare(`SELECT DISTINCT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? AND u.status = 'active' ORDER BY u.id LIMIT 3`).all(MB) as any[]).map((r) => r.id as number);
  const LOP = taoLop('MB FOU UXF1', 'FOU');
  const ganGv = (uid: number, skill: string) => conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,'2026-01-01','active',?)`).run(uid, LOP, skill, NOW);
  ganGv(gvMb[0], 'listening'); ganGv(gvMb[1], 'reading');
  const X = taoHv(LOP, false);                         // Giữa khoá tuần 07/09 (đã hết), còn thiếu ô L → L quá hạn
  const luotX = themLuot({ ...X, cid: LOP, no: 1, kind: 'progress', tuan: '2026-09-07' });
  diem(luotX, { reading: [30, 40], writing: [30, 40], speaking: [8, 10] });
  const Y = taoHv(LOP, false);                         // chưa có bài nào
  const Z = taoHv(LOP, false);                         // chỉ có bài Cuối khoá đã xong, không lượt planned
  const luotZ = themLuot({ ...Z, cid: LOP, no: 2, kind: 'final', tuan: '2026-09-07', status: 'done' });
  diem(luotZ, { listening: [30, 40], reading: [30, 40], writing: [30, 40], speaking: [8, 10] });
  const pL = loadPrincipal(gvMb[0]), pR = loadPrincipal(gvMb[1]), pNgoai = loadPrincipal(gvMb[2]);

  // ==================================================================== Task 3
  check('UXF-a (3) · K2-05 hai đường: em lớp thường đã có Cuối khoá (không lượt planned) không "thiếu mốc tiếp theo" ở cả roster lẫn Học viên & Lớp; em chưa có bài nào thì cả hai có', () => {
    const roster = classes.classRoster(P.admin, LOP) as any[];
    const hv = hvl.danhSachHocVienLop(P.admin, { phamVi: 'chi-nhanh', branchId: MB }).hocVien as any[];
    const thieuMoc = (sid: number) => roster.find((r) => r.id === sid).missing.some((m: any) => m.key === 'next_milestone');
    const thieuTt = (sid: number) => hv.find((h) => h.id === sid).loc.includes('thieu_tt');
    assert(!thieuMoc(Z.sid), `Z đã xong Cuối khoá mà roster còn "thiếu mốc tiếp theo"`);
    assert(thieuMoc(Y.sid) && thieuTt(Y.sid), `Y chưa có bài: roster ${thieuMoc(Y.sid)} · hvl ${thieuTt(Y.sid)}`);
    /* Hai đường: badge Thiếu thông tin ở Học viên & Lớp = danh sách thiếu của roster (cùng `missingForStudent`, cùng `coMocTiepTheoThuong`). */
    for (const r of roster) assert(thieuTt(r.id) === r.missing.length > 0, `hai đường lệch ở ${r.fullName}: hvl ${thieuTt(r.id)} · roster ${JSON.stringify(r.missing)}`);
    /* Z bỏ bài Cuối khoá (huỷ) → lại thiếu mốc ở cả hai đường. */
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(luotZ);
    const r2 = (classes.classRoster(P.admin, LOP) as any[]).find((r) => r.id === Z.sid);
    const h2 = (hvl.danhSachHocVienLop(P.admin, { phamVi: 'chi-nhanh', branchId: MB }).hocVien as any[]).find((h) => h.id === Z.sid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(luotZ);
    assert(r2.missing.some((m: any) => m.key === 'next_milestone') && h2.loc.includes('thieu_tt'), 'Cuối khoá đã huỷ → thiếu mốc ở cả hai đường');
  });

  check('UXF-a (3) · VN29 hai đường: GVBM L có ô L quá hạn → em vào Cần làm + Quá hạn; dem = số dòng = badge hồ sơ lớp; PHỦ ĐỊNH GVBM R không nhận việc của ô L', () => {
    const r = hvl.danhSachHocVienLop(pL, { phamVi: 'toi' });
    const x = r.hocVien.find((h: any) => h.id === X.sid);
    assert(x && x.loc.includes('can-lam') && x.loc.includes('qua-han'), `X: ${JSON.stringify(x)}`);
    const quaHan = r.hocVien.filter((h: any) => h.loc.includes('qua-han'));
    assert(r.dem['qua-han'] === quaHan.length, `dem ${r.dem['qua-han']} ≠ ${quaHan.length}`);
    const lop = r.rows.find((l: any) => l.id === LOP);
    const cuaLop = quaHan.filter((h: any) => h.classId === LOP).length;
    assert(lop.soEmQuaHan === cuaLop && classes.classOverview(pL, LOP).soEmQuaHan === cuaLop, `badge ${lop.soEmQuaHan} / hồ sơ ${classes.classOverview(pL, LOP).soEmQuaHan} ≠ ${cuaLop}`);
    const dongRoster = (classes.classRoster(pL, LOP) as any[]).find((s) => s.id === X.sid);
    assert(dongRoster.viecTiepTheo[0]?.viec.startsWith('Nhập điểm L') && dongRoster.viecTiepTheo[0].tone === 'danger', `roster: ${JSON.stringify(dongRoster.viecTiepTheo)}`);
    const xR = hvl.danhSachHocVienLop(pR, { phamVi: 'toi' }).hocVien.find((h: any) => h.id === X.sid);
    assert(xR && !xR.loc.includes('can-lam') && !xR.loc.includes('qua-han'), `GVBM R: ${JSON.stringify(xR)}`);
  });

  check('UXF-a (3) · G-10 cột Case = "n Case đang mở" (GVBM, theo quyền); Case NGOÀI quyền người xem không đếm', () => {
    const moCase = (cat: string) => conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, attempt_id, category, topic, origin_kind, status, detected_at, created_at) VALUES (?,?,?,?,?, 'mock', 'in_progress', ?, ?)`)
      .run(X.sid, X.cycleId, luotX, cat, cat, TODAY, NOW);
    moCase('listening'); moCase('reading');
    for (const p of [pL, pR, P.admin]) {
      const roster = classes.classRoster(p, LOP) as any[];
      const tong = roster.reduce((n, s) => n + s.openCases, 0);
      assert(tong === classes.classOverview(p, LOP).soCaseMo, `Σ cột Case ${tong} ≠ soCaseMo ${classes.classOverview(p, LOP).soCaseMo}`);
      const thay = casesSvc.listCases(p, { classId: LOP }).rows.filter((c: any) => c.studentId === X.sid && c.status !== 'done').length;
      assert(roster.find((s) => s.id === X.sid).openCases === thay, 'cột Case = listCases theo quyền');
    }
    assert((classes.classRoster(P.admin, LOP) as any[]).find((s) => s.id === X.sid).openCases === 2, 'Quản trị: 2 Case mở');
    /* PHỦ ĐỊNH: GV không dạy lớp không mở được bảng lớp lẫn đầu hồ sơ lớp; Case đã xong không đếm. */
    assert(maLoi(() => classes.classRoster(pNgoai, LOP)) === 403 && maLoi(() => classes.classOverview(pNgoai, LOP)) === 403, 'GV ngoài lớp bị chặn');
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE student_id = ? AND category = 'reading'`).run(X.sid);
    const sau = (classes.classRoster(pL, LOP) as any[]).find((s) => s.id === X.sid).openCases;
    assert(sau === 1 && classes.classOverview(pL, LOP).soCaseMo === (classes.classRoster(pL, LOP) as any[]).reduce((n, s) => n + s.openCases, 0), `Case xong không đếm: ${sau}`);
  });

  // ==================================================================== Task 4 · FT "tuần học thứ n" (Q31-11, cùng luật PR-VAI-b Task 1)
  const tamDung: any = await import('../students/tamDung.ts');
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const dem = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const tuanTruoc = (n: number) => d.mondayOfDate(t.addDays(TODAY, -7 * n));
  const ghiNhatKy = (sid: number, loai: 'pause' | 'resume', ngay: string) => conn.prepare(
    `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at) VALUES (?,?,?,?,?,?,?)`,
  ).run(sid, loai, ngay, loai === 'pause' ? 'Tạm dừng học' : 'Quay lại học', loai === 'pause' ? 'Ốm' : null, P.admin.userId, NOW);

  check('UXF-a (4) · chuTuanHoc + tuanHocFt (bản PR-VAI-b): đếm từ tuần bắt đầu, bỏ tuần Tạm dừng; tuần trong khoảng dừng (kể cả đang dừng) → null; cùng tuần không trừ', () => {
    assert(d.chuTuanHoc(3, 8) === 'tuần học 3/8' && d.chuTuanHoc(9, null) === 'tuần học thứ 9', 'chuTuanHoc');
    const bd = tuanTruoc(10), nay = d.mondayOfDate(TODAY);
    assert(d.tuanHocFt(bd, nay, []) === 11, `không dừng: ${d.tuanHocFt(bd, nay, [])}`);
    const dung = [{ tu: t.addDays(tuanTruoc(7), 2), den: t.addDays(tuanTruoc(5), 1) }];   // dừng 2 tuần (tuần −7, −6)
    assert(d.tuanHocFt(bd, nay, dung) === 9, `dừng 2 tuần rồi quay lại: ${d.tuanHocFt(bd, nay, dung)}`);
    assert(d.tuanHocFt(bd, tuanTruoc(6), dung) === null, 'tuần trong khoảng dừng → null');
    /* Luật của bản dùng chung (PR-VAI-b merge trước — giao kèo): tuần đang ở trong khoảng dừng, kể cả chưa quay lại → null. */
    assert(d.tuanHocFt(bd, nay, [{ tu: tuanTruoc(2), den: null }]) === null, `đang dừng → null: ${d.tuanHocFt(bd, nay, [{ tu: tuanTruoc(2), den: null }])}`);
    assert(d.tuanHocFt(bd, tuanTruoc(3), [{ tu: tuanTruoc(2), den: null }]) === 8, 'tuần trước khi dừng vẫn đếm bình thường');
    assert(d.tuanHocFt(bd, tuanTruoc(11), []) === null, 'trước tuần bắt đầu → null');
    assert(d.tuanHocFt(bd, nay, [{ tu: tuanTruoc(4), den: t.addDays(tuanTruoc(4), 3) }]) === 11, 'Tạm dừng và Quay lại cùng tuần → không trừ');
  });

  const LOP_FT = taoLop('MB FT UXF1', 'FT');
  const F = taoHv(LOP_FT, true);
  conn.prepare('UPDATE learning_cycles SET start_period_id = ? WHERE id = ?').run(week.ensurePeriod(tuanTruoc(10)).id, F.cycleId);
  ghiNhatKy(F.sid, 'pause', t.addDays(tuanTruoc(7), 2));
  ghiNhatKy(F.sid, 'resume', t.addDays(tuanTruoc(5), 1));

  check('UXF-a (4) · khoangTamDung một câu SQL cho cả lô; em không dừng không có khoá; em đang dừng den = null', () => {
    const G = taoHv(LOP_FT, true);
    ghiNhatKy(G.sid, 'pause', TODAY);
    let k: any;
    assert(dem(() => { k = tamDung.khoangTamDung([F.sid, G.sid, Y.sid]); }) === 1, 'một câu');
    assert(k[F.sid].length === 1 && k[F.sid][0].tu === t.addDays(tuanTruoc(7), 2) && k[F.sid][0].den === t.addDays(tuanTruoc(5), 1), JSON.stringify(k[F.sid]));
    assert(k[G.sid][0].den === null && k[G.sid][0].lyDo === 'Ốm', JSON.stringify(k[G.sid]));
    assert(!(Y.sid in k), 'em không dừng: không khoá');
    conn.prepare('DELETE FROM enrollments WHERE student_id = ?').run(G.sid);   // G chỉ dùng cho phép này
  });

  check('UXF-a (4) · xemChuyenLop: em FT → { tuan: n, tong: null } (bỏ 2 tuần dừng = 9; Trịnh Bảo Ngọc 8 tuần trước = 9); em lớp thường → tong = số tuần lớp; transitionPlan FT không mẫu số', () => {
    const xf = luatLoTrinh.xemChuyenLop(P.mbManager, F.sid).hienTai.tuanHoc;
    assert(xf && xf.tuan === 9 && xf.tong === null, `F: ${JSON.stringify(xf)}`);
    const ngoc = luatLoTrinh.xemChuyenLop(P.mbManager, emId('Trịnh Bảo Ngọc')).hienTai.tuanHoc;
    assert(ngoc && ngoc.tuan === 9 && ngoc.tong === null, `Ngọc: ${JSON.stringify(ngoc)}`);
    const huy = luatLoTrinh.xemChuyenLop(P.mbManager, emId('Tạ Đức Huy')).hienTai.tuanHoc;
    assert(!huy || typeof huy.tong === 'number', `lớp thường: ${JSON.stringify(huy)}`);
    const tp = transition.transitionPlan(P.mbManager, lopId('MB FT 101'));
    assert(tp.students.length > 0 && tp.students.every((s: any) => !s.tuanHoc || s.tuanHoc.tong === null), 'FT: tong null');
    assert(tp.students.find((s: any) => s.id === emId('Trịnh Bảo Ngọc')).tuanHoc.tuan === 9, 'panel FT: Ngọc tuần học thứ 9 — cùng số với panel một em');
    const tpF = transition.transitionPlan(P.mbManager, LOP_FT).students.find((s: any) => s.id === F.sid);
    assert(tpF.tuanHoc.tuan === xf.tuan, 'hai đường: panel cả lớp = panel một em');
    for (const x of [tp, luatLoTrinh.xemChuyenLop(P.mbManager, F.sid)]) assert(!/"tong":16/.test(JSON.stringify(x)), 'không payload FT nào có tong 16');
  });

  // ==================================================================== Task 5 · một đơn vị "bài" + em Tạm dừng không nợ
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const hoSoGv: any = await import('../giaoVien/hoSo.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const cham: any = await import('../cham/canCham.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const baiQuaHan = (p: any, f: any = {}) => metricsSvc.metricSet(p, 'bai-qua-han-nhap-diem', f);

  check('UXF-a (5) · baiId: cùng ô ra cùng id; FT W1 và W2 là hai bài; kỹ năng lạ → ném lỗi; tachBaiId là ngược', () => {
    assert(d.baiId(123, 'writing1') !== d.baiId(123, 'writing2'), 'W1, W2 hai bài');
    assert(d.baiId(123, 'reading') === d.baiId(123, 'reading'), 'ổn định');
    const x = d.tachBaiId(d.baiId(987, 'speaking'));
    assert(x.attemptId === 987 && x.skill === 'speaking', JSON.stringify(x));
    let nem = false; try { d.baiId(1, 'ielts'); } catch { nem = true; }
    assert(nem, 'kỹ năng lạ phải ném');
  });

  check('UXF-a (5) · hai đường: ô bai-qua-han-nhap-diem (QL MB) = số dòng = Σ "Bài quá hạn" bảng Theo giáo viên (gồm Chưa phân công); mỗi hàng GV = số dòng hồ sơ GV; dòng ghi tuần thi của MÔN', () => {
    const o = baiQuaHan(P.mbManager, { branchId: MB });
    const rows = metricsSvc.rowsFor('bai', o.ids);
    assert(o.n === o.ids.length && rows.length === o.n && o.n > 0, `n ${o.n} · ids ${o.ids.length} · rows ${rows.length}`);
    /* PR-Pb2-a: bảng Theo giáo viên luôn theo MỘT khung — so ô của cùng khung. */
    let tongHaiKhung = 0;
    for (const ct of ['ft', 'thuong']) {
      const oK = baiQuaHan(P.mbManager, { branchId: MB, program: ct });
      const bang = hoSoGv.bangGvChiNhanh(P.mbManager, { cn: MB, ct });
      const tong = bang.hang.reduce((n: number, h: any) => n + h.quaHan, 0) + (bang.chuaPhanCong?.quaHan ?? 0);
      assert(tong === oK.n, `${ct}: Σ bảng GV (gồm Chưa phân công) ${tong} ≠ ô ${oK.n}`);
      for (const h of bang.hang.filter((x: any) => x.quaHan > 0)) {
        const r = hoSoGv.oHoSoGv(P.mbManager, h.id, { cot: 'qua-han', cn: MB, ct });
        assert(r.rows.length === h.quaHan, `${ct} · ${h.ten}: hồ sơ ${r.rows.length} ≠ bảng ${h.quaHan}`);
        for (const x of r.rows) assert(oK.ids.includes(x.id), `id bài ${x.id} của hồ sơ không có trong ô`);
      }
      tongHaiKhung += oK.n;
    }
    assert(tongHaiKhung === o.n, `ô FT + ô thường ${tongHaiKhung} ≠ ô gộp ${o.n}`);
    const cells = (debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).filter((c) => c.overdue);
    /* Dòng ghi tuần thi CỦA MÔN (Thứ Hai tuần thi của kỹ năng ở `attempt_skills`, không tuần của lượt) — X: ô L tuần 07/09. */
    const dong = metricsSvc.rowsFor('bai', [d.baiId(luotX, 'listening')])[0];
    const tuanL = get(`SELECT rp.week_start w FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening'`, luotX).w as string;
    assert(cells.length > 0 && dong.sub.includes(d.tuanLich(tuanL, TODAY)), `dòng phải ghi tuần thi của môn ${d.tuanLich(tuanL, TODAY)}: ${dong.sub}`);
  });

  check('UXF-a (5) · PHỦ ĐỊNH quyền: GVBM chỉ thấy bài lớp mình; QL chi nhánh CP không thấy bài MB', () => {
    const lopL = new Set(pL.assignments.map((a: any) => a.classId));
    for (const id of baiQuaHan(pL).ids) {
      const cl = get('SELECT class_id FROM assessment_attempts WHERE id = ?', d.tachBaiId(id).attemptId).class_id;
      assert(lopL.has(cl), `GVBM thấy bài lớp không dạy: ${id}`);
    }
    assert(baiQuaHan(pL).ids.includes(d.baiId(luotX, 'listening')), 'GVBM L thấy bài L của X');
    const cpIds = baiQuaHan(P.cpManager).ids as number[];
    assert(!cpIds.some((id) => get('SELECT c.branch_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?', d.tachBaiId(id).attemptId).branch_id === MB), 'QL CP thấy bài MB');
  });

  check('UXF-a (5) · T65: Tạm dừng em có ô quá hạn → ô Tổng quan, bảng GV, hồ sơ GV, Việc, dòng Nợ Lịch Test đều giảm đúng 1 bài; Quay lại → tăng lại; hồ sơ (lượt) vẫn còn ô', () => {
    const tuanNay = week.ensurePeriod(d.mondayOfDate(TODAY)).id;
    const doc = () => ({
      o: baiQuaHan(P.mbManager, { branchId: MB }).n as number,
      bang: hoSoGv.bangGvChiNhanh(P.mbManager, { cn: MB, ct: 'thuong' }).hang.find((h: any) => h.id === gvMb[0])?.quaHan ?? 0,
      hoSo: hoSoGv.oHoSoGv(P.mbManager, gvMb[0], { cot: 'qua-han', cn: MB }).rows.length as number,
      /* Việc nhập điểm L ở lớp thử — X là em duy nhất nợ ô L ở lớp này. */
      viec: (mywork.myWork(pL).items as any[]).some((i) => String(i.href ?? '').includes(`classId=${LOP}`) && String(i.href ?? '').includes('kn=listening')),
      no: (cham.lichTest(pL, tuanNay, null, TODAY, { classId: LOP }).no as any[]).reduce((n, x) => n + x.conBai, 0) as number,
    });
    const truoc = doc();
    assert(truoc.viec && truoc.no >= 1, `trước: ${JSON.stringify(truoc)}`);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(X.sid);
    const dung = doc();
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(X.sid);
    const lai = doc();
    assert(dung.o === truoc.o - 1 && dung.bang === truoc.bang - 1 && dung.hoSo === truoc.hoSo - 1 && !dung.viec && dung.no === truoc.no - 1,
      `Tạm dừng phải giảm đúng 1: trước ${JSON.stringify(truoc)} · dừng ${JSON.stringify(dung)}`);
    assert(JSON.stringify(lai) === JSON.stringify(truoc), `Quay lại phải về như cũ: ${JSON.stringify(lai)}`);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(X.sid);
    const conO = (attempts.listAttempts(P.admin, { classId: LOP }).rows as any[]).find((a) => a.id === luotX);
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(X.sid);
    assert(conO && conO.overdueSkills === 1, 'hồ sơ (danh sách lượt không lọc) vẫn hiện ô L');
  });

  check('UXF-a (5) · GV hết hiệu lực phân công (effective_to < hôm nay) không được gán bài — bài sang "Chưa phân công"', () => {
    const pc = get(`SELECT id FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND skill = 'listening'`, gvMb[0], LOP).id;
    conn.prepare('UPDATE teacher_assignments SET effective_to = ? WHERE id = ?').run(t.addDays(TODAY, -1), pc);
    const o = (debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).find((c) => c.attemptId === luotX && c.skill === 'listening');
    const chuaPc = hoSoGv.bangGvChiNhanh(P.mbManager, { cn: MB, ct: 'thuong' }).chuaPhanCong;
    conn.prepare('UPDATE teacher_assignments SET effective_to = NULL WHERE id = ?').run(pc);
    assert(o && o.userId === null, `ô L phải chưa phân công: ${JSON.stringify(o)}`);
    assert(chuaPc && chuaPc.quaHan >= 1, 'hàng Chưa phân công có bài');
  });

  // ==================================================================== Task 6 · một luật quá hạn (Q10) + dòng Nợ có tuần thi, nhóm theo lớp
  const TUAN_NAY = d.mondayOfDate(TODAY);                      // W3 SEP (14/09) — tuần đang chạy
  const W = taoHv(LOP, false);                                // Giữa khoá tuần NÀY, hạn bị đặt đè sớm hơn Chủ nhật (13/09)
  const luotW = themLuot({ ...W, cid: LOP, no: 1, kind: 'progress', tuan: TUAN_NAY });
  conn.prepare(`UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ?`).run(t.addDays(TODAY, -1), luotW);
  const V = taoHv(LOP, false);                                // tuần tương lai (W1 OCT)
  const luotV = themLuot({ ...V, cid: LOP, no: 1, kind: 'progress', tuan: '2026-10-05' });
  const tuanNayId = week.ensurePeriod(TUAN_NAY).id;
  const quaHanO = (attemptId: number) => (debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).filter((c) => c.attemptId === attemptId && c.overdue).length;

  check('UXF-a (6) · Q10: ô tuần đang chạy (kể cả hạn đặt đè sớm) và tuần tương lai KHÔNG quá hạn ở mọi đường; ô tuần đã hết + qua hạn quá hạn ở mọi đường', () => {
    const roster = classes.classRoster(pL, LOP) as any[];
    const ohRoster = (sid: number) => roster.find((s) => s.id === sid).timeline.reduce((n: number, x: any) => n + x.overdueSkills, 0);
    const ids = baiQuaHan(P.admin).ids as number[];
    const coBai = (aid: number) => ids.some((id) => d.tachBaiId(id).attemptId === aid);
    const lich = cham.lichTest(P.admin, tuanNayId, null, TODAY, { classId: LOP });
    const lopLich = (lich.lop as any[]).find((l) => l.classId === LOP);
    for (const [ten, aid, sid] of [['W (tuần này, hạn đè sớm)', luotW, W.sid], ['V (tuần tương lai)', luotV, V.sid]] as const) {
      assert(quaHanO(aid) === 0, `${ten}: scoreDebtCells`);
      assert(!coBai(aid), `${ten}: bai-qua-han-nhap-diem`);
      assert(ohRoster(sid) === 0, `${ten}: roster.overdueSkills`);
    }
    assert(!lopLich || !lopLich.quaHan, `Lịch Test tuần này không quá hạn: ${JSON.stringify(lopLich?.quaHan)}`);
    /* Đối chứng: X (W2 SEP, tuần đã hết, qua hạn) quá hạn ở mọi đường. */
    assert(quaHanO(luotX) === 1 && coBai(luotX) && ohRoster(X.sid) === 1, `X phải quá hạn: ô ${quaHanO(luotX)} · roster ${ohRoster(X.sid)}`);
    const no = (cham.lichTest(pL, tuanNayId, null, TODAY, { classId: LOP }).no as any[]).find((x) => x.attemptIds.includes(luotX));
    assert(no && no.quaHan, `dòng Nợ của X quá hạn: ${JSON.stringify(no)}`);
  });

  check('UXF-a (6) · Nợ: lớp FT có MT3 ở hai tuần thi → hai dòng, chữ Đợt khác nhau (tuần thi); dòng nhóm theo lớp (soSanhLop); conBai = số bài', () => {
    const tuanA = tuanTruoc(2), tuanB = tuanTruoc(1);
    const em = [taoHv(LOP_FT, true), taoHv(LOP_FT, true)];
    const luot = [themLuot({ ...em[0], cid: LOP_FT, no: 3, kind: 'mock', tuan: tuanA }), themLuot({ ...em[1], cid: LOP_FT, no: 3, kind: 'mock', tuan: tuanB })];
    const no = (cham.lichTest(P.admin, tuanNayId, null, TODAY).no as any[]);
    const cuaFt = no.filter((x) => x.classId === LOP_FT && x.attemptNo === 3);
    assert(cuaFt.length === 2, `hai dòng MT3: ${cuaFt.length}`);
    const chu = cuaFt.map((x) => `${x.dotLabel} · ${d.tuanLich(x.weekStart, TODAY)}`);
    assert(chu[0] !== chu[1] && chu.every((c) => /^MT3 · W\d [A-Z]{3}$/.test(c)), `chữ Đợt: ${chu.join(' | ')}`);
    const soO = (debt.scoreDebtCells(P.admin, TODAY, [MB]) as any[]).filter((c) => luot.includes(c.attemptId)).length;
    assert(cuaFt.reduce((n, x) => n + x.conBai, 0) === soO, `conBai ${cuaFt.reduce((n, x) => n + x.conBai, 0)} ≠ số bài ${soO}`);
    for (let i = 1; i < no.length; i++) assert(d.soSanhLop({ code: no[i - 1].classCode }, { code: no[i].classCode }) <= 0, `Nợ không nhóm theo lớp: ${no[i - 1].classCode} › ${no[i].classCode}`);
  });

  // ==================================================================== Task 7 · Báo cáo đơn vị: tín hiệu từ sổ chỉ số, đếm đơn vị, tuần đã nộp
  const signals: any = await import('../worklist/signals.ts');
  const meeting: any = await import('../worklist/meeting.ts');
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');

  check('UXF-a (7) · K1-37 hai đường: mỗi tín hiệu từ sổ chỉ số có count = metricSet(id).n = số dòng mở ra; signals.ts không còn SQL đếm Case SOS / thiếu điểm riêng; PHỦ ĐỊNH QL CP không thấy tín hiệu MB', () => {
    const ds = signals.signalsFor(P.mbManager, { branchId: MB }) as any[];
    const tuSo = ds.filter((s) => s.metricId);
    assert(tuSo.some((s) => s.metricId === 'bai-qua-han-nhap-diem'), `phải có tín hiệu bài quá hạn: ${JSON.stringify(ds.map((s) => s.kind))}`);
    for (const s of tuSo) {
      const m = metricsSvc.metricSet(P.mbManager, s.metricId, { branchId: s.branchId });
      assert(s.count === m.n && metricsSvc.rowsFor(d.metricById(s.metricId).donVi, m.ids).length === s.count, `${s.metricId}: ${s.count} ≠ ${m.n}`);
    }
    const src = readFileSync(join(process.cwd(), 'server/src/worklist/signals.ts'), 'utf8');
    assert(!/sos_level > 0/.test(src) && !/FROM sos_cases/.test(src) && !/FROM assessment_attempts a\s+JOIN classes/.test(src), 'signals.ts còn SQL đếm riêng');
    assert((signals.signalsFor(P.cpManager) as any[]).every((s) => s.branchId !== MB), 'QL CP thấy tín hiệu chi nhánh MB');
  });

  check('UXF-a (7) · F4: "Đã nộp / Đang nhập / Chưa báo cáo" đếm ĐƠN VỊ = số hàng chip lọc ra; ba số cộng = số đơn vị', () => {
    const b = meeting.meetingBoard(P.admin, tuanNayId);
    const theo = (ma: string) => (b.units as any[]).filter((u) => u.trangThai.ma === ma).length;
    assert(b.totals.daNop === theo('da-nop') && b.totals.nhap === theo('nhap') && b.totals.chua === theo('chua'), `totals ${JSON.stringify(b.totals)}`);
    assert(b.totals.daNop + b.totals.nhap + b.totals.chua === b.units.length, 'ba số cộng = số đơn vị');
  });

  check('UXF-a (7) · weeksReported = tuần ĐÃ NỘP / tuần ĐÃ BẮT ĐẦU trong tháng; worstStatus bỏ qua nháp', () => {
    const unitId = Number(conn.prepare(`INSERT INTO reporting_units (code, name, kind, branch_id, seq, status) VALUES ('UXF-A-TMP', 'Đơn vị tạm UXF-a', 'branch', ?, 98, 'active')`).run(MB).lastInsertRowid);
    try {
      const ghi = (tuan: string, status: string, nop: boolean) => conn.prepare(
        `INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at, submitted_at, submitted_by)
         VALUES (?,?, 'teachers', 'Giáo viên', ?, NULL, ?, ?, ?, ?)`,
      ).run(unitId, week.ensurePeriod(tuan).id, status, P.admin.userId, NOW, nop ? NOW : null, nop ? P.admin.userId : null);
      ghi('2026-08-31', 'ok', true); ghi('2026-09-07', 'watch', true); ghi('2026-09-14', 'problem', false);   // tuần 21/09 chưa bắt đầu
      const b = meeting.meetingBoard(P.admin, tuanNayId, { month: '2026-09' });
      const o = (b.units as any[]).find((u) => u.unitId === unitId).cells.find((c: any) => c.key === 'teachers');
      assert(o.weeksReported === 2 && o.weeksTotal === 3, `n/m tuần: ${o.weeksReported}/${o.weeksTotal}`);
      assert(o.worstStatus === 'watch', `worstStatus bỏ qua nháp "problem": ${o.worstStatus}`);
    } finally {
      conn.prepare('DELETE FROM unit_reports WHERE reporting_unit_id = ?').run(unitId);
      conn.prepare('DELETE FROM reporting_units WHERE id = ?').run(unitId);
    }
  });

  // ==================================================================== Task 8 · "Đúng hạn cập nhật": ghi bù N tuần = N lần trễ (U7 / K3-17)
  check('UXF-a (8) · ghi bù 3 tuần = 3 nghĩa vụ trễ (cùng N với chữ "ghi bù 3 tuần"); chưa ghi quá 2 tuần = 2 trễ; ghi đúng hạn = 1 đúng; n = số dòng; lọc khung còn đúng', () => {
    const caseId = get(`SELECT id FROM sos_cases WHERE student_id = ? AND category = 'listening'`, X.sid).id as number;
    const pa = (due: string) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, status, action_due, cycle_no, created_at) VALUES (?, 'tutor', 'UXF-a PA', 'started', ?, 1, ?)`,
    ).run(caseId, due, NOW).lastInsertRowid);
    const fu = (iv: number, due: string, ghi: string, late: number) => conn.prepare(
      `INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, cycle_no, cycle_due, late, created_at) VALUES (?, ?, ?, 'partial', 1, ?, ?, ?)`,
    ).run(caseId, iv, ghi, due, late, NOW);
    const truoc = metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', {});
    const ghiBu = pa('2026-09-28'); fu(ghiBu, '2026-08-24', '2026-09-08', 1);   // hạn Thứ Hai 24/08, ghi 08/09
    const boQuen = pa('2026-08-31');                                              // chưa ghi, hạn 31/08 → tới 14/09 trễ 2 tuần
    const dungHan = pa('2026-09-28'); fu(dungHan, '2026-09-07', '2026-09-06', 0);
    const r = metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', {});
    const moi = (r.ids as number[]).filter((id) => !(truoc.ids as number[]).includes(id));
    const cua = (iv: number) => moi.filter((id) => metricsSvc.parseObligation(id).interventionId === iv);
    const dung = (iv: number) => cua(iv).filter((id) => (r.numeratorIds as number[]).includes(id)).length;
    assert(cua(ghiBu).length === 3 && dung(ghiBu) === 0, `ghi bù: ${cua(ghiBu).length} nghĩa vụ, ${dung(ghiBu)} đúng`);
    assert(/ghi bù 3 tuần/.test(d.nhanTuanGhiKetQua('2026-08-24', '2026-09-08').tieuDe), d.nhanTuanGhiKetQua('2026-08-24', '2026-09-08').tieuDe);
    assert(cua(boQuen).length === 2 && dung(boQuen) === 0, `bỏ quên: ${cua(boQuen).length}`);
    assert(cua(dungHan).length === 1 && dung(dungHan) === 1, `đúng hạn: ${cua(dungHan).length}/${dung(dungHan)}`);
    assert(r.n === r.ids.length && metricsSvc.rowsFor('nghia-vu', r.ids).length === r.n, 'n = ids = số dòng');
    const khung = (ct: string) => metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', { program: ct }).ids as number[];
    const ft = khung('ft'), thuong = khung('thuong');
    for (const id of [...cua(ghiBu), ...cua(boQuen), ...cua(dungHan)]) assert(thuong.includes(id) && !ft.includes(id), `lọc khung: ${id} (lớp thường)`);
  });

  // ==================================================================== Task 9 · bảng chi nhánh theo lớp của lượt; U1 soSanhLop; F5 chip "Tất cả"
  const bangCn: any = await import('../worklist/bangChiNhanh.ts');

  check('UXF-a (9) · bảng chi nhánh khung FT: Case từ lượt FT của em nay học lớp thường nằm ở HÀNG LỚP CỦA LƯỢT (cùng hàm bộ lọc khung); số ô = số dòng; = Case mở ở hồ sơ GV phụ trách', () => {
    const H = taoHv(LOP_FT, true);
    const luotH = themLuot({ ...H, cid: LOP_FT, no: 1, kind: 'mock', tuan: tuanTruoc(1) });
    const caseH = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, attempt_id, category, topic, origin_kind, status, owner_user_id, detected_at, created_at) VALUES (?,?,?, 'reading', 'reading', 'mock', 'in_progress', ?, ?, ?)`)
      .run(H.sid, H.cycleId, luotH, gvMb[0], TODAY, NOW).lastInsertRowid);
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND class_id = ?`).run(H.sid, LOP_FT);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(H.sid, LOP, TODAY, NOW);
    const b = bangCn.bangChiNhanh(P.mbManager, { branchId: MB, ct: 'ft' });
    const hangFt = b.hang.find((h: any) => h.id === LOP_FT);
    const ds = bangCn.oBangChiNhanh(P.mbManager, { branchId: MB, ct: 'ft', cot: 'caseMo', khoa: `lop:${LOP_FT}` });
    assert(hangFt && ds.rows.some((r: any) => r.id === caseH) && ds.n === hangFt.o.caseMo.n, `Case ở hàng lớp FT của lượt: ${JSON.stringify(hangFt?.o.caseMo)}`);
    const tongFt = b.hang.reduce((n: number, h: any) => n + h.o.caseMo.n, 0);
    assert(tongFt <= b.tong.caseMo.n && metricsSvc.metricSet(P.mbManager, 'case-mo', { branchId: MB, program: 'ft' }).ids.includes(caseH), 'Case thuộc khung FT ở ô tổng');
    const thuong = bangCn.bangChiNhanh(P.mbManager, { branchId: MB, ct: 'thuong' }).hang.find((h: any) => h.id === LOP);
    assert(!thuong || !bangCn.oBangChiNhanh(P.mbManager, { branchId: MB, ct: 'thuong', cot: 'caseMo', khoa: `lop:${LOP}` }).rows.some((r: any) => r.id === caseH), 'không rơi sang hàng lớp thường em đang học');
    assert(hoSoGv.caseMoCuaGv(P.mbManager, gvMb[0], [MB], 'ft').some((c: any) => c.id === caseH), 'hồ sơ GV phụ trách (khung FT) có Case này');
  });

  check('UXF-a (9) · U1: lớp sắp theo soSanhLop (MB FT 9 trước MB FT 10) ở 6 đường kiểm kê; bảng chi nhánh theo đúng thứ tự', () => {
    assert(d.soSanhLop({ code: 'MB FT 9' }, { code: 'MB FT 10' }) < 0, 'soSanhLop');
    const goc = join(process.cwd(), 'server/src');
    for (const f of ['platform/xoaTaiKhoan.ts', 'phanTich/xuatMt.ts', 'worklist/bangChiNhanh.ts', 'cham/canCham.ts']) {
      /* SQL có thể vẫn ORDER BY (thứ tự phụ trong lớp); thứ tự LỚP do `soSanhLop` sắp lại bằng JS sau câu. */
      assert(/\.sort\(\(a, b\) => soSanhLop\(/.test(readFileSync(join(goc, f), 'utf8')), `${f}: chưa sắp lớp bằng soSanhLop`);
    }
    for (const ct of ['ft', 'thuong']) {   // PR-Pb2-a: không còn khung "Cả hai"
      const lop = bangCn.bangChiNhanh(P.mbManager, { branchId: MB, ct }).hang as any[];
      for (let i = 1; i < lop.length; i++) assert(d.soSanhLop({ code: lop[i - 1].nhan }, { code: lop[i].nhan }) <= 0, `${lop[i - 1].nhan} › ${lop[i].nhan}`);
    }
  });

  check('UXF-a (9) · F5 hàm thuần: Lọc nhanh "Tất cả" = Nhóm "Tất cả" = Σ nhóm; lọc Quá hạn thì nhóm chỉ đếm việc quá hạn (nhắc mềm đã thành việc thật — VAI-a K5-10)', () => {
    const it = (group: string, urgency: string, due: string | null) => ({ group, urgency, due });
    const items = [it('score', 'overdue', '2026-09-10'), it('case_plan', 'today', TODAY), it('violation', 'normal', null), it('task', 'normal', '2026-09-18')];
    const loc = d.demLocNhanh(items, 'tat-ca', TODAY);
    const nhom = d.demNhomChip(items, 'tat-ca', TODAY);
    const tong = d.NHOM_VIEC.reduce((n: number, k: string) => n + nhom[k], 0);
    assert(loc['tat-ca'] === items.length && nhom['tat-ca'] === loc['tat-ca'] && tong === nhom['tat-ca'], `Tất cả: lọc ${loc['tat-ca']} · nhóm ${nhom['tat-ca']} · Σ ${tong}`);
    assert(loc['qua-han'] === 1 && loc['hom-nay'] === 1, `Quá hạn/Hôm nay: ${JSON.stringify(loc)}`);
    const nhomQuaHan = d.demNhomChip(items, 'qua-han', TODAY);
    assert(nhomQuaHan['tat-ca'] === 1 && nhomQuaHan['tat-ca'] === loc['qua-han'], `nhóm khi lọc Quá hạn: ${JSON.stringify(nhomQuaHan)}`);
  });

  // ==================================================================== Task 10 · Chưa phân loại không rơi Case; hạn gốc đúng; tooltip Tạm thời
  const vanDe: any = await import('../phanTich/vanDeHv.ts');
  const mgmt: any = await import('../worklist/mgmttasks.ts');

  check('UXF-a (10) · Vấn đề HV: Case có lỗi không vào hàng nào (Pre FOU tong_hop; chỉ lỗi phụ khi bật "chỉ chính") → "Chưa phân loại"; Σ hàng + Chưa phân loại = số Case trong phạm vi', () => {
    const moCase = (sid: number, cy: number, cat: string) => Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, detected_at, created_at) VALUES (?,?,?,?, 'teacher_report', 'in_progress', ?, ?)`)
      .run(sid, cy, cat, cat, TODAY, NOW).lastInsertRowid);
    const loi = (caseId: number, ma: string, vai: string) => conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?,?,?,?)`).run(caseId, vai, ma, NOW);
    const cTongHop = moCase(Y.sid, Y.cycleId, 'tong_hop'); loi(cTongHop, 'student.tong_hop.language', 'primary');
    const cPhu = moCase(Z.sid, Z.cycleId, 'reading'); loi(cPhu, 'student.reading.language', 'secondary');
    const f = { branchId: MB, ct: 'thuong', soTuan: 52, gop: false };
    const cpl = (chiChinh: boolean) => vanDe.oVanDeHv(P.admin, { ...f, chiChinh, dong: 'chua-phan-loai', cot: 'case' }).rows.map((r: any) => r.id) as number[];
    assert(cpl(false).includes(cTongHop) && !cpl(false).includes(cPhu), `Case tong_hop vào Chưa phân loại; Case có lỗi phụ hợp lệ thì không (chỉ chính tắt)`);
    assert(cpl(true).includes(cPhu), 'bật "chỉ chính": Case chỉ có lỗi phụ → Chưa phân loại, không rơi');
    const tuNgay = d.tuDauKhoang(TODAY, 52);   // cùng mốc đầu khoảng với vanDeHv
    const soCase = get(`SELECT COUNT(DISTINCT sc.id) n FROM sos_cases sc JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id AND c.status = 'active' AND c.is_fast_track = 0 JOIN students s ON s.id = sc.student_id AND s.archived_at IS NULL
       WHERE c.branch_id = ? AND (sc.status != 'done' OR substr(sc.closed_at, 1, 10) >= ?)`, MB, tuNgay).n as number;
    for (const chiChinh of [false, true]) {
      const r = vanDe.vanDeHv(P.admin, { ...f, chiChinh });
      assert(r.tomTat.case + r.chuaPhanLoai.case === soCase, `chiChinh=${chiChinh}: ${r.tomTat.case} + ${r.chuaPhanLoai.case} ≠ ${soCase}`);
    }
  });

  check('UXF-a (10) · Vận hành: đặt hạn 10/09 rồi dời 12/09 → hạn gốc 10/09, dời 1 lần; chỉ đặt hạn → 0 lần; danh sách và chi tiết cùng số; lịch sử ghi "Đặt hạn"', () => {
    assert(JSON.stringify(mgmt.hanGocCua([{ old: null, new: '2026-09-10', reason: null }, { old: '2026-09-10', new: '2026-09-12', reason: 'Chờ phụ huynh' }]))
      === JSON.stringify({ hanGoc: '2026-09-10', lyDoDoiHan: 'Chờ phụ huynh', soLanDoiHan: 1 }), 'đặt rồi dời');
    assert(mgmt.hanGocCua([{ old: null, new: '2026-09-10', reason: null }]).soLanDoiHan === 0, 'chỉ đặt hạn');
    const task = get(`SELECT id FROM tasks WHERE id NOT IN (SELECT task_id FROM task_history WHERE field = 'due_date') ORDER BY id LIMIT 1`);
    assert(task, 'bộ demo phải có việc Vận hành chưa có lịch sử hạn');
    const ls = (o: string | null, n: string, ly: string | null) => conn.prepare(`INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at, reason) VALUES (?, 'due_date', ?, ?, ?, ?, ?)`)
      .run(task.id, o, n, P.admin.userId, NOW, ly);
    ls(null, '2026-09-10', null);
    const chiDat = mgmt.mgmtTaskDetail(P.admin, task.id);
    assert(chiDat.soLanDoiHan === 0 && chiDat.hanGoc === null, `chỉ đặt hạn: ${chiDat.soLanDoiHan}/${chiDat.hanGoc}`);
    ls('2026-09-10', '2026-09-12', 'Chờ phụ huynh');
    const ct = mgmt.mgmtTaskDetail(P.admin, task.id);
    const dong = (mgmt.listMgmtTasks(P.admin, { progress: 'tat-ca' }).rows as any[]).find((r) => r.id === task.id);
    assert(ct.hanGoc === '2026-09-10' && ct.soLanDoiHan === 1, `chi tiết: ${ct.hanGoc}/${ct.soLanDoiHan}`);
    assert(!dong || (dong.hanGoc === ct.hanGoc && dong.soLanDoiHan === ct.soLanDoiHan), `danh sách ≠ chi tiết: ${JSON.stringify(dong && { h: dong.hanGoc, n: dong.soLanDoiHan })}`);
    assert(/Đặt hạn/.test(readFileSync(join(process.cwd(), 'web/src/modules/worklist/MgmtTasksPage.tsx'), 'utf8')), 'lịch sử ghi "Đặt hạn"');
  });

  check('UXF-a (10) · Tổng hợp: tooltip cột kỹ năng FT có chữ "Tạm thời" (đếm cả lượt Tạm thời)', () => {
    assert(d.cotKyNangFor('ft').every((c: any) => /Tạm thời/.test(c.goiY)), 'tooltip thiếu "Tạm thời"');
  });
}
