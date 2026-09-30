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
}
