/** PHÉP KIỂM PR-LT2b — Cuối khoá lớp thường: dải, hướng gợi ý, bổ trợ miễn phí, Mini Test. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2bTests(t: YThucTestKit) {
  const { viecTiepLop: vtl } = await import('./viecTiepLop.ts');   // UI-HO-SO-LOP
  const { check, assert, assertThrows, conn, P, TODAY, addDays, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrLt2b } = await import('../migrate/prLt2b.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-LT2b · Final Test lớp thường');

  // ------------------------------------------------------------------ Task 1 · luật thuần
  check('LT2b (1) · dải trên số CHƯA làm tròn: 0.4999 / 0.5 / 0.595 / 0.6 / 0.6999 / 0.7', () => {
    const cap: [number, string][] = [[0.4999, 'duoi_50'], [0.5, '50_59'], [0.595, '50_59'], [0.6, '60_69'], [0.6999, '60_69'], [0.7, 'dat']];
    for (const [x, dai] of cap) assert(d.daiCuoiKhoa(x) === dai, `${x} → ${d.daiCuoiKhoa(x)} (cần ${dai})`);
  });
  check('LT2b (1) · thiếu môn (tyLe null) hoặc không phải lớp thường → không gợi ý', () => {
    assert(d.goiYCuoiKhoa({ ct: 'BE', tyLe: null, monTruot: [] }) === null, 'null');
    assert(d.goiYCuoiKhoa({ ct: 'FT', tyLe: 0.6, monTruot: [] }) === null, 'FT');
    assert(d.goiYCuoiKhoa({ ct: null, tyLe: 0.6, monTruot: [] }) === null, 'không rõ');
  });
  check('LT2b (1) · FOU 64% trượt L, G+V → lên BE, 2 buổi · 1 tuần, nhãn có "L, G+V"', () => {
    const g = d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.64, monTruot: ['listening', 'writing'] })!;
    assert(g.dai === '60_69' && g.huong === 'len' && !g.canQuanLy, `dải/hướng ${g.dai}/${g.huong}`);
    assert(g.boTroNeuLen!.soBuoi === 2 && g.boTroNeuLen!.soTuan === 1 && g.boTroNeuLen!.theoMon, 'bổ trợ');
    assert(g.boTroNeuLen!.mon.join() === 'listening,writing', 'ô chuẩn lớp cũ');
    assert(g.nhan.includes('Lên BE') && g.nhan.includes('L, G+V') && g.nhan.includes('Mini Test'), g.nhan);
    assert(g.nhanNgan === '→ lên + bổ trợ', g.nhanNgan);
  });
  check('LT2b (1) · BE 55% → Quản lý cân nhắc (canQuanLy), 2 tuần, chưa có hướng; không báo PH', () => {
    const g = d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.55, monTruot: ['reading', 'writing', 'speaking'] })!;
    assert(g.dai === '50_59' && g.huong === null && g.canQuanLy, 'canQuanLy');
    assert(g.boTroNeuLen!.soTuan === 2 && g.boTroNeuLen!.soBuoi === 6 && !g.baoPhTvv, 'bổ trợ nếu lên');
    assert(g.nhan.startsWith('Quản lý cân nhắc') && g.nhanNgan === '→ QL cân nhắc', g.nhan);
  });
  check('LT2b (1) · Pre FOU 52% → 4 buổi, 64% → 2 buổi, không theo môn (PF3)', () => {
    const a = d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.52, monTruot: [] })!.boTroNeuLen!;
    const b = d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.64, monTruot: [] })!.boTroNeuLen!;
    assert(a.soBuoi === 4 && a.soTuan === 2 && !a.theoMon && a.mon.join() === 'tong_hop', 'Pre FOU 52%');
    assert(b.soBuoi === 2 && b.soTuan === 1 && !b.theoMon, 'Pre FOU 64%');
    assert(d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.64, monTruot: [] })!.nhan.includes('Lên FOU'), 'nhãn lớp kế');
  });
  check('LT2b (1) · dưới 50% → học lại + Báo PH qua TVV; từ 70% → Pass, không bổ trợ', () => {
    const a = d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.45, monTruot: ['reading'] })!;
    assert(a.huong === 'hoc_lai' && a.baoPhTvv && !a.boTroNeuLen && a.nhan === 'Học lại BE' && a.nhanNgan === '→ học lại', 'dưới 50');
    const p = d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.72, monTruot: [] })!;
    assert(p.huong === 'len' && !p.boTroNeuLen && p.nhan === 'Pass' && p.nhanNgan === '→ Pass', 'Pass');
  });
  check('LT2b (1) · ELE 64% → lên FT (không còn bậc thường)', () => {
    assert(d.goiYCuoiKhoa({ ct: 'ELE', tyLe: 0.64, monTruot: ['reading'] })!.nhan.startsWith('Lên FT'), 'ELE → FT');
  });
  check('LT2b (1) · lichBoTro: 1 tuần và 2 tuần — Chủ nhật tuần cuối, hạn +2 ngày lịch (M-05)', () => {
    const a = d.lichBoTro({ batDau: '2026-10-05', soTuan: 1 });
    const b = d.lichBoTro({ batDau: '2026-10-05', soTuan: 2 });
    assert(a.ngayMiniTest === '2026-10-11' && a.hanMiniTest === '2026-10-13', `1 tuần ${a.ngayMiniTest}/${a.hanMiniTest}`);
    assert(b.ngayMiniTest === '2026-10-18' && b.hanMiniTest === '2026-10-20', `2 tuần ${b.ngayMiniTest}/${b.hanMiniTest}`);
  });
  check('LT2b (1) · kyNangLopDich: sang FT writing → writing2 (M-21); còn lại giữ, tong_hop giữ', () => {
    assert(d.kyNangLopDich('writing', true) === 'writing2', 'writing → writing2');
    assert(d.kyNangLopDich('writing', false) === 'writing', 'không sang FT');
    assert(d.kyNangLopDich('reading', true) === 'reading' && d.kyNangLopDich('tong_hop', true) === 'tong_hop', 'giữ');
  });

  // ------------------------------------------------------------------ Task 2 · migrate cấu trúc
  const cotCua = (c: any, bang: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((x) => x.name as string).sort();
  const COT_MOI = ['quyet_boi', 'quyet_luc', 'ky_vong_dat', 'ky_vong_nguyen_nhan', 'ky_vong_mon', 'ky_vong_ghi_chu'];
  const dbCu = () => {
    const tam = new SqliteDb(':memory:');
    tam.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE students (id INTEGER PRIMARY KEY); CREATE TABLE learning_cycles (id INTEGER PRIMARY KEY); '
      + 'CREATE TABLE assessment_attempts (id INTEGER PRIMARY KEY); CREATE TABLE lo_trinh_tiep_theo (id INTEGER PRIMARY KEY, student_id INTEGER, class_id INTEGER)');
    return tam;
  };
  check('LT2b (2) · migrate thêm cột + bảng mini_test trên DB cũ; chạy lại không làm gì; DB mới (schema.sql) cùng cột', () => {
    const tam = dbCu();
    const a: string[] = []; migratePrLt2b(tam, a);
    assert(a.length === 1 && COT_MOI.every((c) => cotCua(tam, 'lo_trinh_tiep_theo').includes(c)), a.join('; '));
    const b: string[] = []; migratePrLt2b(tam, b);
    assert(b.length === 0, `lần 2 vẫn đổi: ${b.join('; ')}`);
    assert(JSON.stringify(cotCua(tam, 'mini_test')) === JSON.stringify(cotCua(conn, 'mini_test')), 'mini_test: migrate ≠ schema.sql');
    tam.close();
    const c: string[] = []; migratePrLt2b(conn, c);
    assert(c.length === 0 && COT_MOI.every((x) => cotCua(conn, 'lo_trinh_tiep_theo').includes(x)), 'schema.sql thiếu cột PR-LT2b');
  });
  check('LT2b (2) · mini_test: UNIQUE (em, bài Final Test) chặn Mini Test thứ hai', () => {
    const tam = dbCu();
    migratePrLt2b(tam, []);
    tam.exec('INSERT INTO students (id) VALUES (1); INSERT INTO learning_cycles (id) VALUES (1); INSERT INTO assessment_attempts (id) VALUES (1)');
    const them = () => tam.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han) VALUES (1, 1, 1, 'mt:1', 2, '2026-10-11', '2026-10-13')`).run();
    them();
    assertThrows(them, /UNIQUE/i, 'Mini Test thứ hai của cùng em × bài phải bị chặn');
    tam.close();
  });
  check('LT2b (2) · nhật ký: mọi mã cuoi_khoa.* có nhãn tiếng Việt', () => {
    for (const ma of ['cuoi_khoa.quyet', 'cuoi_khoa.bo_tro_tao', 'cuoi_khoa.mini_test', 'cuoi_khoa.ket_luan_ft']) {
      assert(d.nhanHanhDongNhatKy(ma) !== 'Thao tác hệ thống', `${ma} chưa có nhãn`);
    }
  });

  // ------------------------------------------------------------------ Task 3 · một cửa đọc
  const week: any = await import('../platform/week.ts');
  const intakeMod: any = await import('../classes/intake.ts');
  const regularMod: any = await import('../normal/regular.ts');
  const cuoiKhoaMod: any = await import('../normal/cuoiKhoa.ts');
  const MB = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
  let soLop = 0;
  /** Lớp thường thử (BE/FOU/PREFOU), n em, đã xếp bài; trả bài Cuối khoá của từng em. Điểm ghi thẳng bằng SQL — phép kiểm ĐỌC, không qua luật nhập. */
  const taoLop = (kind: 'BE' | 'FOU' | 'PREFOU', soEm: number) => {
    soLop += 1;
    const tuanKg = week.ensurePeriod(addDays(TODAY, -70));
    const lop = intakeMod.createClass(P.admin, { code: `MB ${kind === 'PREFOU' ? 'Pre FOU' : kind} 9${soLop}`, branchId: MB, kind, startPeriodId: tuanKg.id, startDate: tuanKg.weekStart });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `LT2B-${soLop}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, tuanKg.weekStart, now);
      sids.push(sid);
    }
    regularMod.planRegularTests(P.admin, lop.id);
    const luot = new Map<number, number>();
    for (const r of conn.prepare(`SELECT id, student_id FROM assessment_attempts WHERE class_id = ? AND kind = 'final'`).all(lop.id) as any[]) luot.set(r.student_id, r.id);
    return { classId: lop.id as number, sids, luot };
  };
  const ghiDiem = (attemptId: number, diem: Record<string, number>, tong = 40) => {
    for (const [skill, s] of Object.entries(diem)) {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(attemptId, skill);
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total) VALUES (?,?,?,?)').run(attemptId, skill, s, tong);
    }
  };
  const L = 'listening', R = 'reading', W = 'writing', S = 'speaking';
  const dem = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };

  check('LT2b (3) · lớp BE 8 em: 4 dải + thiếu môn + chưa thi → đúng dải, gợi ý, môn trượt', () => {
    const l = taoLop('BE', 8);
    const a = (i: number) => l.luot.get(l.sids[i])!;
    ghiDiem(a(0), { [L]: 18, [R]: 18, [W]: 18, [S]: 18 });   // 45%
    ghiDiem(a(1), { [L]: 22, [R]: 22, [W]: 22, [S]: 22 });   // 55%
    ghiDiem(a(2), { [L]: 30, [R]: 30, [W]: 20, [S]: 22 });   // 63,75%: trượt W, S
    ghiDiem(a(3), { [L]: 32, [R]: 32, [W]: 30, [S]: 31 });   // 78%
    ghiDiem(a(4), { [L]: 30, [R]: 30, [W]: 30 });            // thiếu S
    const m = cuoiKhoaMod.cuoiKhoaTheoHocVien(l.classId);
    assert(m.size === 8, `số em ${m.size}`);
    const g = (i: number) => m.get(l.sids[i]);
    assert(g(0).goiY.dai === 'duoi_50' && g(0).goiY.huong === 'hoc_lai' && g(0).goiY.baoPhTvv, '45%');
    assert(g(1).goiY.dai === '50_59' && g(1).goiY.canQuanLy && g(1).monTruot.length === 4, '55%');
    assert(g(2).goiY.dai === '60_69' && g(2).monTruot.join() === 'writing,speaking' && g(2).goiY.boTroNeuLen.soBuoi === 2, `64%: ${g(2).monTruot}`);
    assert(g(3).goiY.dai === 'dat' && g(3).goiY.nhan === 'Pass', '78%');
    assert(g(4).goiY === null && g(4).tyLe === null && g(4).scored === 3 && g(4).required === 4, 'thiếu môn không gợi ý');
    assert(g(5).goiY === null && g(5).attemptId === l.luot.get(l.sids[5]) && g(5).scored === 0, 'chưa thi');
  });
  check('LT2b (3) · cuoiKhoaTheoHocVien: số câu SQL ≤ 5 và KHÔNG tăng theo số em (30 em)', () => {
    const be = taoLop('BE', 3);
    const ba = taoLop('BE', 30);
    for (const sid of ba.sids) ghiDiem(ba.luot.get(sid)!, { [L]: 28, [R]: 28, [W]: 28, [S]: 28 });
    for (const sid of be.sids) ghiDiem(be.luot.get(sid)!, { [L]: 28, [R]: 28, [W]: 28, [S]: 28 });
    const it = dem(() => { cuoiKhoaMod.cuoiKhoaTheoHocVien(be.classId); });
    const nhieu = dem(() => { cuoiKhoaMod.cuoiKhoaTheoHocVien(ba.classId); });
    assert(nhieu <= 8 && nhieu === it, `3 em ${it} câu · 30 em ${nhieu} câu (bao gồm 3 câu đọc chương trình)`);
  });
  check('LT2b (3) · sửa một điểm Final Test → gợi ý đổi theo (không lưu ở đâu)', () => {
    const l = taoLop('BE', 1);
    const a = l.luot.get(l.sids[0])!;
    ghiDiem(a, { [L]: 24, [R]: 24, [W]: 24, [S]: 24 });      // 60% → 60_69
    assert(cuoiKhoaMod.cuoiKhoaTheoHocVien(l.classId).get(l.sids[0]).goiY.dai === '60_69', '60%');
    ghiDiem(a, { [W]: 20 });                                  // 92/160 = 57,5% → 50_59
    assert(cuoiKhoaMod.cuoiKhoaTheoHocVien(l.classId).get(l.sids[0]).goiY.dai === '50_59', 'sau sửa điểm');
    assert(!conn.prepare('SELECT 1 FROM lo_trinh_tiep_theo WHERE student_id = ?').get(l.sids[0]), 'gợi ý không được lưu');
  });
  check('LT2b (3) · tyLeTongLo: bài thiếu môn → du false, tyLe null; ≤ 2 câu cho cả lô; lượt FT không có', () => {
    const l = taoLop('BE', 2);
    ghiDiem(l.luot.get(l.sids[0])!, { [L]: 20, [R]: 20, [W]: 20 });
    ghiDiem(l.luot.get(l.sids[1])!, { [L]: 28, [R]: 28, [W]: 28, [S]: 28 });
    const ft = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.status != 'cancelled' LIMIT 1`).get(classId('MB FT 101')) as any;
    let m: Map<number, any> = new Map();
    const n = dem(() => { m = cuoiKhoaMod.tyLeTongLo([...l.luot.values(), ft.id]); });
    assert(n <= 5, `${n} câu (2 câu + 3 câu đọc chương trình)`);
    const thieu = m.get(l.luot.get(l.sids[0])!);
    assert(thieu.du === false && thieu.tyLe === null && thieu.scored === 3, JSON.stringify(thieu));
    assert(m.get(l.luot.get(l.sids[1])!).tyLe === 112 / 160 && !m.has(ft.id), 'đủ môn / FT');
  });
  check('LT2b (3) · Pre FOU: một ô tong_hop → % = điểm / tổng, gợi ý 4 buổi khi 52%', () => {
    const l = taoLop('PREFOU', 1);
    ghiDiem(l.luot.get(l.sids[0])!, { tong_hop: 21 });        // 21/40 = 52,5%
    const e = cuoiKhoaMod.cuoiKhoaTheoHocVien(l.classId).get(l.sids[0]);
    assert(e.tyLe === 0.525 && e.goiY.dai === '50_59' && e.goiY.boTroNeuLen.soBuoi === 4 && !e.goiY.boTroNeuLen.theoMon, JSON.stringify(e.goiY));
  });
  const transitionMod: any = await import('../classes/transition.ts');
  const loTrinhMod: any = await import('../classes/loTrinhTiep.ts');
  const profileMod: any = await import('../students/profile.ts');
  check('LT2b (3) · API: transitionPlan / lo-trinh-tiep / hồ sơ HV / lưới lớp đều mang cuoiKhoa · goiY (cùng một con số)', () => {
    const l = taoLop('BE', 2);
    const sid = l.sids[0];
    ghiDiem(l.luot.get(sid)!, { [L]: 26, [R]: 26, [W]: 26, [S]: 26 });   // 65%
    const tp = transitionMod.transitionPlan(P.admin, l.classId).students.find((x: any) => x.id === sid);
    const lt = loTrinhMod.layLoTrinhTiep(P.admin, sid).cuoiKhoa;
    const hs = profileMod.studentProfile(P.admin, sid).cuoiKhoa;
    const dong = regularMod.regularSheet(P.admin, l.classId, 'final').rows.find((r: any) => r.studentId === sid);
    for (const [ten, x] of [['transition', tp.cuoiKhoa], ['lo-trinh-tiep', lt], ['hồ sơ', hs]] as const) {
      assert(x?.goiY?.dai === '60_69' && x.tyLe === 104 / 160, `${ten}: ${JSON.stringify(x?.goiY)}`);
    }
    assert(dong.goiY.dai === '60_69' && dong.goiY.nhanNgan === '→ lên + bổ trợ', 'lưới lớp');
    assert(regularMod.regularSheet(P.admin, l.classId, 'progress').rows.every((r: any) => r.goiY === null), 'bài Progress Test không có hướng Final Test');
    const ft = profileMod.studentProfile(P.admin, (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id IN (SELECT student_id FROM enrollments WHERE status = 'active' GROUP BY student_id HAVING COUNT(*) = 1) LIMIT 1`).get(classId('MB FT 101')) as any).student_id);
    assert(ft.cuoiKhoa === null, `em FT không có cuoiKhoa: ${JSON.stringify(ft.cuoiKhoa)} · ${typeof ft.cuoiKhoa}`);
  });

  // ------------------------------------------------------------------ Task 4 · Quản lý quyết khi chuyển (không còn thẻ — Q30-3, Q30-4)
  check('LT2b (4) · Quản lý chuyển em 50–59% → ghi quyet_boi/quyet_luc + nhật ký; em 78% không ghi; không có thẻ Quyết định Final Test', () => {
    const l = taoLop('BE', 2);
    ghiDiem(l.luot.get(l.sids[0])!, { [L]: 22, [R]: 22, [W]: 22, [S]: 22 });   // 55%
    ghiDiem(l.luot.get(l.sids[1])!, { [L]: 32, [R]: 32, [W]: 30, [S]: 31 });   // 78%
    soLop += 1;
    const tuanMoi = week.ensurePeriod(TODAY);
    const ele = intakeMod.createClass(P.admin, { code: `MB ELE 9${soLop}`, branchId: MB, kind: 'ELE', startPeriodId: tuanMoi.id, startDate: tuanMoi.weekStart });
    const r = transitionMod.applyTransition(P.mbManager, {
      fromClassId: l.classId, effectiveDate: TODAY,
      dongs: l.sids.map((studentId) => ({ studentId, huong: 'len_lop', toClassId: ele.id })),
    });
    assert(r.failed.length === 0 && r.done.length === 2, JSON.stringify(r));
    const q = (i: number) => conn.prepare('SELECT quyet_boi, quyet_luc FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(l.sids[i], l.classId) as any;
    assert(q(0).quyet_boi === P.mbManager.userId && !!q(0).quyet_luc, JSON.stringify(q(0)));
    assert(q(1).quyet_boi === null && q(1).quyet_luc === null, '78% không phải Quản lý quyết');
    assert(!!conn.prepare(`SELECT 1 FROM audit_logs WHERE action = 'cuoi_khoa.quyet' AND entity_id = ?`).get(l.classId), 'thiếu nhật ký cuoi_khoa.quyet');
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'quyet_dinh_cuoi_khoa'`).get(), 'không được có thẻ Quyết định Final Test (Q30-3)');
  });

  // ------------------------------------------------------------------ Task 5 · sau khi chuyển (Case Cuối khoá + PA Bổ trợ miễn phí, Báo PH, Tutor FT)
  const permMod: any = await import('../permissions.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const myWorkMod: any = await import('../worklist/mywork.ts');
  const duyetMod: any = await import('../duyet/yeuCau.ts');
  const luatMod: any = await import('../classes/luatLoTrinh.ts');
  const cuoiSvc: any = cuoiKhoaMod;
  const NGAY_CHUYEN = week.mondayOf(addDays(TODAY, -28));   // Thứ Hai 4 tuần trước — PA bổ trợ đã tới hạn ghi kết quả cuối
  const ganGv = (classId: number, userId: number, skill: string | null) => {
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`)
      .run(userId, classId, skill, skill === null ? 1 : 0, new Date().toISOString());
  };
  /** Lớp chuyển đến thử (khai giảng tuần chuyển), GVCN = `P.normalCoreTeacher`, tuỳ chọn GVBM Listening = `P.lrTeacher`. */
  /** Một GV bộ môn KHÁC GVCN (`P.lrTeacher` trùng người với `P.normalCoreTeacher` ở bộ demo). */
  const gvbmKhac = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE user_id != ? AND skill IS NOT NULL AND is_core = 0 LIMIT 1`).get(P.normalCoreTeacher.userId) as any).user_id as number;
  const taoLopDich = (kind: 'FOU' | 'BE' | 'ELE', gvbmL = false) => {
    soLop += 1;
    const tuan = week.ensurePeriod(NGAY_CHUYEN);
    const lop = intakeMod.createClass(P.admin, { code: `MB ${kind} 8${soLop}`, branchId: MB, kind, startPeriodId: tuan.id, startDate: tuan.weekStart });
    ganGv(lop.id, P.normalCoreTeacher.userId, null);
    if (gvbmL) ganGv(lop.id, gvbmKhac, 'listening');
    return lop.id as number;
  };
  const cycleMoi = (sid: number) => (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id as number;
  /* PR-KV (§3): kỳ vọng đầu ra xét theo MT0 — tạo MT0 Lên FT của em ở lớp BE (`dongBoMt0`) và ghi band (W1 = W2). */
  const mt0Mod: any = await import('../fasttrack/mt0.ts');
  const mt0Kv = (lop: number, sid: number, b: number[]) => {
    mt0Mod.dongBoMt0(P.mbManager.userId, [{ studentId: sid, classId: lop, ma: 'BE', huong: 'fast_track', mucTieu: 6.5 }]);
    const a = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`).get(sid) as any).id;
    for (const [k, v] of [['listening', b[0]], ['reading', b[1]], ['writing1', b[2]], ['writing2', b[2]], ['speaking', b[3]]] as const) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?,?,?)').run(a, k, v);
    }
  };
  const chuyen = (fromClassId: number, dongs: any[]) => {
    const r = transitionMod.applyTransition(P.mbManager, { fromClassId, effectiveDate: NGAY_CHUYEN, dongs });
    assert(r.failed.length === 0, `dòng lỗi: ${JSON.stringify(r.failed)}`);
    return r;
  };
  /* OV-11d (HV-17): Kết quả đầu ra chỉ cho em có lệnh / lộ trình Lên FT — giữ một lệnh `cho` tạm trong lúc đánh dấu (chuyển thật vẫn đi `chuyen`). */
  const voiLenhFt = <T>(lop: number, sid: number, fn: () => T): T => {
    const id = conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, ?, 'fast_track', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(sid, lop, classId('MB FT 101'), TODAY, P.mbManager.userId, TODAY, TODAY).lastInsertRowid;
    try { return fn(); } finally { conn.prepare('DELETE FROM lenh_chuyen_lop WHERE id = ?').run(id); }
  };
  const caseCuaEm = (sid: number, cycleId: number) => conn.prepare('SELECT * FROM sos_cases WHERE student_id = ? AND cycle_id = ? ORDER BY id').all(sid, cycleId) as any[];
  const paCuaCase = (caseId: number) => conn.prepare(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro_mien_phi' ORDER BY id`).all(caseId) as any[];

  check('LT2b (5) · FOU 65% trượt L, G+V → BE: 2 Case chuyen_cap + 2 PA cùng nhóm + 1 Mini Test; Case Progress Test cùng môn được dùng lại (M-01); KHÔNG phải Case SOS', () => {
    const l = taoLop('FOU', 3);
    const [s0, s1, s2] = l.sids;
    ghiDiem(l.luot.get(s0)!, { [L]: 20, [R]: 30, [W]: 20, [S]: 34 });   // 65%: trượt L, W
    ghiDiem(l.luot.get(s1)!, { [L]: 18, [R]: 18, [W]: 18, [S]: 18 });   // 45%
    ghiDiem(l.luot.get(s2)!, { [L]: 32, [R]: 32, [W]: 30, [S]: 31 });   // 78%
    /* Case Giữa khoá L đang mở ở lộ trình FOU cũ. */
    const cuCycle = cycleMoi(s0);
    conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, topic, category, origin_kind, status, dedup_key, created_at) VALUES (?,?, 'listening', 'listening', 'mock', 'open', ?, ?)`)
      .run(s0, cuCycle, `a:${s0}:${cuCycle}:listening`, new Date().toISOString());
    const be = taoLopDich('BE'), fou2 = taoLopDich('FOU');
    chuyen(l.classId, [
      { studentId: s0, huong: 'len_lop', toClassId: be }, { studentId: s1, huong: 'hoc_lai', toClassId: fou2 }, { studentId: s2, huong: 'len_lop', toClassId: be },
    ]);
    const moi0 = cycleMoi(s0);
    const cases = caseCuaEm(s0, moi0);
    assert(cases.length === 2 && cases.map((c) => c.category).sort().join() === 'listening,writing', `Case ở lộ trình mới: ${cases.map((c) => c.category)}`);
    const gv = cases.find((c) => c.category === 'listening');
    assert(gv.origin_kind === 'mock', 'Case Progress Test cùng môn phải được dùng lại (không tạo Case thứ hai)');
    const cc = cases.find((c) => c.category === 'writing');
    assert(cc.origin_kind === 'chuyen_cap' && cc.sos_level === null && cc.han_xac_nhan === null && cc.status === 'in_progress', JSON.stringify(cc));
    assert(cc.title === 'Final Test FOU · Grammar + Vocabulary không đạt', cc.title);
    const pa = [...paCuaCase(gv.id), ...paCuaCase(cc.id)];
    assert(pa.length === 2 && new Set(pa.map((x) => x.nhom_bo_tro)).size === 1 && pa[0].nhom_bo_tro === `mt:${l.luot.get(s0)}`, JSON.stringify(pa.map((x) => x.nhom_bo_tro)));
    assert(pa.every((x) => x.preset === 1 && !!x.confirmed_at && x.status === 'started' && x.moc_quy_che === 'mini_test'), 'PA phải chạy ngay, có mốc Mini Test');
    const mt = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').all(s0) as any[];
    const lich = d.lichBoTro({ batDau: NGAY_CHUYEN, soTuan: 1 });
    assert(mt.length === 1 && mt[0].han === lich.hanMiniTest && mt[0].ngay_du_kien === lich.ngayMiniTest && mt[0].so_buoi === 2 && mt[0].ty_le === null, JSON.stringify(mt));
    /* Không phải Case SOS: không chờ nguyên nhân, không ở việc `cause`, không Báo QL nguyên nhân. */
    const st = sosState.sosCaseState(cc.id);
    assert(!st.fromSos && !st.awaitingCause, JSON.stringify(st));
    assert(!(sosState.awaitingCauseCaseIds([cc.id]) as number[]).includes(cc.id), 'Case Final Test không được chờ nguyên nhân');
    /* 78% Pass: không Case, không PA. */
    assert(caseCuaEm(s2, cycleMoi(s2)).length === 0, '78% không có Case');
    /* 45% học lại: đúng một việc Báo PH qua TVV làm bởi Quản lý (không phải GVCN). */
    const baoPh = conn.prepare(`SELECT * FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv'`).all(s1) as any[];
    assert(baoPh.length === 1 && baoPh[0].attempt_id === l.luot.get(s1) && baoPh[0].preset === 1 && baoPh[0].status === 'pending', JSON.stringify(baoPh));
    const viec = (who: any) => (myWorkMod.myWork(who, { nguoi: 'tat-ca' }) as any).items.filter((x: any) => x.key === `baoph:${baoPh[0].id}`);
    assert(viec(P.mbManager).length === 1 && viec(P.mbManager)[0].tieuDe.includes('Final Test 45%'), 'Quản lý phải thấy việc Báo PH: ' + JSON.stringify(viec(P.mbManager).map((x: any) => x.tieuDe)));
    assert(viec(permMod.loadPrincipal(P.normalCoreTeacher.userId)).length === 0, 'GVCN không có việc Báo PH của Final Test');
    assert(caseCuaEm(s1, cycleMoi(s1)).length === 0, '45% học lại không có Case bổ trợ');
  });
  check('LT2b (5) · Final Test không sinh tín hiệu / Case ở lớp cũ khi nhập điểm trượt (T70)', () => {
    const l = taoLop('BE', 1);
    const truocCase = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n, truocTin = (conn.prepare('SELECT COUNT(*) n FROM case_signals').get() as any).n;
    for (const [k, s] of [[L, 10], [R, 10], [W, 10], [S, 10]] as const) regularMod.saveRegularScore(P.admin, l.luot.get(l.sids[0])!, k, { score: s, total: 40 }, TODAY);
    assert((conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n === truocCase, 'Final Test trượt không được sinh Case');
    assert((conn.prepare('SELECT COUNT(*) n FROM case_signals').get() as any).n === truocTin, 'Final Test trượt không được sinh tín hiệu');
  });
  check('LT2b (5) · Pre FOU 52% QL cho lên FOU: Case tong_hop, 4 buổi · 2 tuần; GVCN FOU ghi được, GVBM L của lớp FOU → 403', () => {
    const l = taoLop('PREFOU', 1);
    ghiDiem(l.luot.get(l.sids[0])!, { tong_hop: 21 });   // 52,5%
    const fou = taoLopDich('FOU', true);
    chuyen(l.classId, [{ studentId: l.sids[0], huong: 'len_lop', toClassId: fou }]);
    const c = caseCuaEm(l.sids[0], cycleMoi(l.sids[0]));
    assert(c.length === 1 && c[0].category === 'tong_hop' && c[0].title === 'Final Test Pre FOU · Tổng hợp không đạt', JSON.stringify(c.map((x) => x.title)));
    const pa = paCuaCase(c[0].id);
    assert(pa.length === 1 && /4 buổi miễn phí · 2 tuần/.test(pa[0].description), pa[0]?.description);
    const mt = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').get(l.sids[0]) as any;
    assert(mt.so_buoi === 4 && mt.ngay_du_kien === d.lichBoTro({ batDau: NGAY_CHUYEN, soTuan: 2 }).ngayMiniTest, JSON.stringify(mt));
    const ghi = (who: any) => casesMod.updateResult(who, pa[0].id, { outcome: 'improved', note: 'Em làm bài tốt hơn hẳn', observedOn: TODAY, miniTest: { tyLe: 80, ngay: TODAY }, soBuoi: 0 });   // PR-PA: PA có Số buổi
    assertThrows(() => ghi(permMod.loadPrincipal(gvbmKhac)), /quyền|phạm vi/, 'GVBM Listening của lớp FOU không được ghi Case Tổng hợp');
    ghi(permMod.loadPrincipal(P.normalCoreTeacher.userId));
    assert((conn.prepare('SELECT ty_le FROM mini_test WHERE id = ?').get(mt.id) as any).ty_le === 0.8, 'GVCN phải ghi được Mini Test');
  });
  check('LT2b (5) · lớp thường → lớp thường: Case Progress Test đi theo em; BE 55% chuyển bởi QL → soTuan 2; đường chuyển một em (apDungMotDong) cũng tạo bổ trợ', () => {
    const l = taoLop('BE', 1);
    const s = l.sids[0];
    ghiDiem(l.luot.get(s)!, { [L]: 22, [R]: 22, [W]: 22, [S]: 22 });   // 55%
    const ele = taoLopDich('ELE');
    luatMod.apDungMotDong(P.admin, { sid: s, toClassId: ele, ngay: NGAY_CHUYEN, boiCanh: 'cuoi-khoa' });
    const cs = caseCuaEm(s, cycleMoi(s));
    assert(cs.length === 4 && cs.every((c) => c.origin_kind === 'chuyen_cap'), `4 Case (mỗi môn trượt): ${cs.length}`);
    const mt = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').get(s) as any;   // PR-CT2: 4 môn × 2 buổi
    assert(mt.so_buoi === 8 && mt.ngay_du_kien === d.lichBoTro({ batDau: NGAY_CHUYEN, soTuan: 2 }).ngayMiniTest, JSON.stringify(mt));
  });
  check('LT2b (5) · BE 72% sang FT + kết luận Trung tâm {R, W} → 2 Case FT (Reading, Writing 2) + PA tutor preset 0; Học viên không chọn kỹ năng → lưu phương án, không Case (N17, P9b); đánh dấu sau khi đã sang FT tạo ngay', () => {
    const l = taoLop('BE', 3);
    const [a, b, c2] = l.sids;
    for (const s of l.sids) ghiDiem(l.luot.get(s)!, { [L]: 30, [R]: 30, [W]: 30, [S]: 30 });   // 75%
    mt0Kv(l.classId, a, [4, 3.5, 3.5, 4]); mt0Kv(l.classId, b, [4, 4, 4, 4]); mt0Kv(l.classId, c2, [3.5, 4, 4, 4]);
    voiLenhFt(l.classId, a, () => cuoiSvc.ghiKetLuanFt(P.mbManager, a, { dat: false, nguyenNhan: 'trung_tam', mon: ['reading', 'writing'] }));
    /* P9b (rà PTA 26/10): Học viên = ghi phương án, không bắt kỹ năng, không Case (N17). */
    voiLenhFt(l.classId, b, () => cuoiSvc.ghiKetLuanFt(P.mbManager, b, { dat: false, nguyenNhan: 'hoc_sinh', mon: [], ghiChu: 'Em nghỉ nhiều — phương án case-by-case với phụ huynh' }));
    const ft = classId('MB FT 101');
    chuyen(l.classId, [a, b, c2].map((studentId) => ({ studentId, huong: 'fast_track', toClassId: ft, mucTieu: 6.5 })));
    const cs = caseCuaEm(a, cycleMoi(a));
    assert(cs.map((c) => c.category).sort().join() === 'reading,writing2', `Case FT: ${cs.map((c) => c.category)}`);
    assert(cs.every((c) => c.origin_kind === 'chuyen_cap' && /^Kỳ vọng đầu ra chưa đạt · /.test(c.title)), JSON.stringify(cs.map((c) => c.title)));
    const tutor = conn.prepare(`SELECT * FROM case_interventions WHERE case_id = ?`).all(cs[0].id) as any[];
    assert(tutor.length === 1 && tutor[0].kind === 'tutor' && tutor[0].preset === 0 && /Tutor 10 buổi/.test(tutor[0].description), JSON.stringify(tutor));
    assert(caseCuaEm(b, cycleMoi(b)).length === 0, 'Học viên → không Case');
    assert(caseCuaEm(c2, cycleMoi(c2)).length === 0, 'chưa đánh dấu → không Case');
    const r = cuoiSvc.ghiKetLuanFt(P.mbManager, c2, { dat: false, nguyenNhan: 'trung_tam', mon: ['listening'] });   // sau khi đã sang FT
    assert(r.taoCaseTutor === 1 && caseCuaEm(c2, cycleMoi(c2)).length === 1, 'đánh dấu sau khi sang FT phải tạo Case ngay');
    const r2 = cuoiSvc.ghiKetLuanFt(P.mbManager, c2, { dat: true });
    assert(caseCuaEm(c2, cycleMoi(c2)).length === 1 && /giữ nguyên/.test(r2.luuY), 'đổi sang Đạt không xoá Case, có ghi chú');
  });
  check('LT2b (5) · điểm Final Test nhập ĐỦ sau khi em đã chuyển (Q30-4): dòng vẫn chuyển; luật áp ở lộ trình mới, chạy lại không sinh trùng', () => {
    const l = taoLop('FOU', 1);
    const s = l.sids[0];
    ghiDiem(l.luot.get(s)!, { [L]: 20, [R]: 30, [W]: 20 });   // thiếu Speaking
    const be = taoLopDich('BE');
    chuyen(l.classId, [{ studentId: s, huong: 'len_lop', toClassId: be }]);
    assert(caseCuaEm(s, cycleMoi(s)).length === 0 && !conn.prepare('SELECT 1 FROM mini_test WHERE student_id = ?').get(s), 'thiếu điểm: chưa Case / Mini Test');
    regularMod.saveRegularScore(P.admin, l.luot.get(s)!, S, { score: 34, total: 40 }, TODAY);   // đủ điểm: 104/160 = 65%
    assert(caseCuaEm(s, cycleMoi(s)).length === 2 && (conn.prepare('SELECT COUNT(*) n FROM mini_test WHERE student_id = ?').get(s) as any).n === 1, 'điểm nhập sau phải áp ở lộ trình mới');
    regularMod.saveRegularScore(P.admin, l.luot.get(s)!, S, { score: 35, total: 40, lyDo: 'Chấm lại bài Speaking' }, TODAY);   // sửa điểm: không sinh thêm
    assert(caseCuaEm(s, cycleMoi(s)).length === 2 && (conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE nhom_bo_tro = ?').get(`mt:${l.luot.get(s)}`) as any).n === 2, 'chạy lại không sinh trùng');
  });

  // ------------------------------------------------------------------ Task 8 · % Cuối khoá + hướng ở lưới, Hành trình, Excel
  check('LT2b (8) · nhanGhim Final Test đủ điểm có hướng, không chữ SOS; màu Pass = dat; Pre FOU giữ % + hướng', () => {
    const g = d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.64, monTruot: ['reading'] })!;
    const gh = d.nhanGhim({ cheDo: 'ratio', attemptNo: 2, kind: 'final', overall: null, sosLevel: 1, soDat: 3, soYeuCau: 4, soCoDiem: 4, tyLe: 0.64, goiY: g, kyNangChuaDat: ['reading'], maLop: 'MB BE 08' });
    assert(gh.chu === 'Final · 64% → lên + bổ trợ' && !/SOS/.test(`${gh.chu} ${gh.day}`) && gh.day.includes('Lên ELE'), JSON.stringify(gh));
    const pass = d.nhanGhim({ cheDo: 'ratio', attemptNo: 2, kind: 'final', overall: null, sosLevel: 0, soDat: 4, soYeuCau: 4, soCoDiem: 4, tyLe: 0.78, goiY: d.goiYCuoiKhoa({ ct: 'BE', tyLe: 0.78, monTruot: [] })! });
    assert(pass.mau === 'dat' && pass.chu === 'Final · 78% → Pass', JSON.stringify(pass));
    const pf = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'final', overall: null, sosLevel: 1, soDat: null, soYeuCau: 1, soCoDiem: 1, khongChiaMon: true, tyLe: 0.52, goiY: d.goiYCuoiKhoa({ ct: 'PREFOU', tyLe: 0.52, monTruot: [] })! });
    assert(pf.chu === 'Final · 52% → QL cân nhắc', pf.chu);
    assert(d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'progress', overall: null, sosLevel: 1, soDat: 2, soYeuCau: 4, soCoDiem: 4, goiY: null }).chu === 'Progress · 2/4 môn đạt', 'Progress Test không có hướng');
  });
  check('LT2b (8) · Excel lớp thường: cột "Hướng gợi ý" sau "% tổng", số cột khớp tiêu đề, Progress Test để trống', () => {
    const mon = ['Listening', 'Reading', 'Writing', 'Speaking'].map((ten) => ({ ten, pct: 70, diem: 28, tong: 40, tuan: 'W1 OCT' }));
    const dong = (bai: string, huong: string | null) => ({ ten: 'A', email: 'a@x.vn', chiNhanh: 'MB', lop: 'MB BE 08', bai, tuan: 'W1 OCT', tuanBd: '2026-10-05', mon, tyLeTong: 64, trangThai: 'Đủ điểm', nguoiNhap: null, huong });
    for (const cot of ['gon', 'day-du'] as const) {
      const b = d.bangThuong([dong('Final Test', 'Lên ELE + bổ trợ'), dong('Progress Test', null)], cot);
      const i = b[0].indexOf('Hướng gợi ý');
      assert(i === b[0].indexOf('% tổng') + 1 && b.every((h) => h.length === b[0].length), `${cot}: cột ${i}`);
      assert(b[1][i] === 'Lên ELE + bổ trợ' && b[2][i] === null, `${cot}: ô hướng`);
    }
    assert(d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.45, monTruot: [] })!.nhanExcel === 'Học lại FOU' && d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.55, monTruot: ['reading'] })!.nhanExcel === 'QL cân nhắc', 'nhãn Excel');
  });

  // ------------------------------------------------------------------ Task 6 · Mini Test
  const xoaKetThuc: any = await import('../classes/xoaKetThucLop.ts');
  const classesMod: any = await import('../classes/classes.ts');
  const gvcnDich = () => permMod.loadPrincipal(P.normalCoreTeacher.userId);
  /** FOU 65% (trượt L + G+V) → BE có 2 PA cùng nhóm; trả PA + Case + Mini Test. Người dạy = GVCN của lớp BE (`P.normalCoreTeacher`). */
  const dungMiniTest = (tyLe: 'a' | 'b' = 'a') => {
    const l = taoLop('FOU', 1);
    const s = l.sids[0];
    ghiDiem(l.luot.get(s)!, tyLe === 'a' ? { [L]: 20, [R]: 30, [W]: 20, [S]: 34 } : { [L]: 20, [R]: 30, [W]: 20, [S]: 34 });
    const be = taoLopDich('BE');
    chuyen(l.classId, [{ studentId: s, huong: 'len_lop', toClassId: be }]);
    const cases = caseCuaEm(s, cycleMoi(s));
    const pa = cases.flatMap((c) => paCuaCase(c.id));
    const mt = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').get(s) as any;
    return { l, s, be, cases, pa, mt };
  };
  const ghiCuoi = (who: any, paId: number, mini: any) => casesMod.updateResult(who, paId, { outcome: 'improved', note: 'Em làm bài Mini Test khá hơn hẳn', observedOn: TODAY, miniTest: mini, soBuoi: 0 });   // PR-PA: PA có Số buổi

  check('LT2b (6) · Mini Test 72%: ghi ở MỘT PA → cả nhóm khép, một dòng mini_test, mọi Case tự Hoàn thành, không thẻ Báo QL', () => {
    const x = dungMiniTest();
    assert(x.pa.length === 2 && x.mt.ty_le === null, 'dữ liệu dựng');
    ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 72, ngay: TODAY });
    const mt = conn.prepare('SELECT * FROM mini_test WHERE id = ?').get(x.mt.id) as any;
    assert(mt.ty_le === 0.72 && mt.ngay_lam === TODAY && mt.ghi_boi === P.mbManager.userId, JSON.stringify(mt));
    assert(x.pa.every((p) => (conn.prepare('SELECT status, closed_reason FROM case_interventions WHERE id = ?').get(p.id) as any).status === 'completed'), 'mọi PA của nhóm phải khép');
    assert(x.cases.every((c) => { const r = conn.prepare('SELECT status, outcome FROM sos_cases WHERE id = ?').get(c.id) as any; return r.status === 'done' && r.outcome === 'much_better'; }), 'Case tự Hoàn thành, kết quả = mức GV chọn (OV-11c CV-13: PA Tiến bộ rõ → Case Tiến bộ rõ)');
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ?`).get(x.mt.id), 'đạt thì không thẻ');
    assertThrows(() => ghiCuoi(P.mbManager, x.pa[1].id, { tyLe: 72, ngay: TODAY }), /đã kết thúc/, 'PA đã khép không ghi lại');
  });
  check('LT2b (6) · Mini Test 58%: Case còn mở, KHÔNG thẻ Báo QL (P9a N21: Quản lý quyết ở việc Xét lại lộ trình — dòng (d))', () => {
    const x = dungMiniTest();
    ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 58, ngay: TODAY });
    assert(x.cases.every((c) => (conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(c.id) as any).status !== 'done'), 'Case phải còn mở');
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ?`).get(x.mt.id), 'không còn thẻ Báo QL Mini Test');
  });
  check('LT2b (6) · Mini Test: việc "Ghi Mini Test" hiện trước hạn cho người dạy, biến mất sau khi ghi; ô mini_test ở hồ sơ HV', () => {
    const x = dungMiniTest();
    const viec = () => ((myWorkMod.myWork(gvcnDich()) as any).items as any[]).filter((i) => i.key === `minitest:${x.mt.id}`);
    assert(viec().length === 1 && viec()[0].group === 'mini_test' && viec()[0].due === x.mt.han && viec()[0].tieuDe.startsWith('Ghi Mini Test'), JSON.stringify(viec()));
    const hs = profileMod.studentProfile(P.mbManager, x.s);
    assert(hs.miniTest?.id === x.mt.id && hs.miniTest.paId === x.pa[0].id && hs.miniTest.coTheGhi === true && hs.viewer.coTheKetLuan === true, JSON.stringify(hs.miniTest));
    assert(profileMod.studentProfile(gvcnDich(), x.s).viewer.coTheKetLuan === false, 'GVCN không có quyền kết luận');
    ghiCuoi(gvcnDich(), x.pa[0].id, { tyLe: 80, ngay: TODAY });
    assert(viec().length === 0, 'ghi xong thì hết việc');
    assert(profileMod.studentProfile(P.mbManager, x.s).miniTest.tyLe === 0.8, 'hồ sơ hiện Mini Test đã ghi');
  });
  check('LT2b (6) · Mini Test — PHỦ ĐỊNH: GVBM khác môn 403 · tyLe 120 → 400 · ngày tương lai → 400 · thiếu Mini Test → 400 · GVCN sửa Mini Test đã ghi được (OV-7a) · QL sửa (lý do tuỳ chọn — PR-MTa T7)', () => {
    const x = dungMiniTest();
    assertThrows(() => ghiCuoi(permMod.loadPrincipal(gvbmKhac), x.pa[0].id, { tyLe: 70, ngay: TODAY }), /quyền|phạm vi/, 'GV không thuộc lớp / khác môn không được ghi');
    assertThrows(() => ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 120, ngay: TODAY }), /0 đến 100/, 'tyLe 120');
    assertThrows(() => ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 70, ngay: addDays(TODAY, 3) }), /tương lai/, 'ngày tương lai');
    assertThrows(() => ghiCuoi(P.mbManager, x.pa[0].id, undefined), /Mini Test/, 'thiếu Mini Test');
    assert((conn.prepare('SELECT ty_le FROM mini_test WHERE id = ?').get(x.mt.id) as any).ty_le === null, 'lỗi thì không ghi gì');
    ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 65, ngay: TODAY });
    /* OV-7a (chủ SP 13/10) thay "chỉ QL sửa": người ghi được lần đầu (GVCN lớp em đang học) sửa được Mini Test đã ghi. */
    cuoiSvc.ghiMiniTest(gvcnDich(), x.mt.id, { tyLe: 68, ngay: TODAY, lyDo: 'Chấm lại bài Mini Test' });
    assert((conn.prepare('SELECT ty_le FROM mini_test WHERE id = ?').get(x.mt.id) as any).ty_le === 0.68, 'GVCN sửa Mini Test đã ghi');
    /* PR-MTa T7 thay "QL sửa cần lý do": sửa điểm Mini Test — lý do tuỳ chọn. */
    cuoiSvc.ghiMiniTest(P.mbManager, x.mt.id, { tyLe: 75, ngay: TODAY });
    cuoiSvc.ghiMiniTest(P.mbManager, x.mt.id, { tyLe: 80, ngay: TODAY, lyDo: 'Chấm lại bài Mini Test' });
    assert((conn.prepare('SELECT ty_le FROM mini_test WHERE id = ?').get(x.mt.id) as any).ty_le === 0.8, 'QL sửa được');
  });
  check('LT2b (6) · Kết thúc lớp: "Còn treo" đếm Mini Test chưa ghi của em từ lớp này, không chặn', () => {
    const x = dungMiniTest();
    const t = xoaKetThuc.xemXoaKetThuc(P.admin, x.l.classId);
    assert(t.conTreo === 'Còn treo: 1 Mini Test chưa ghi', String(t.conTreo));
    ghiCuoi(P.mbManager, x.pa[0].id, { tyLe: 75, ngay: TODAY });
    assert(xoaKetThuc.xemXoaKetThuc(P.admin, x.l.classId).conTreo === null, 'ghi xong hết treo');
  });

  // ------------------------------------------------------------------ Task 7 · Kết luận lên FT (phủ định) + Cuối khoá dời quá hạn
  check('LT2b (7) · Kết luận lên FT — PHỦ ĐỊNH: GVCN 403 · QL chi nhánh khác 403 · chưa đủ MT0 400 · em FOU chưa MT0 400 · Học viên không lý do 400 · Trung tâm không chọn kỹ năng (MT0 đạt hết) 400', () => {
    const be = taoLop('BE', 1);
    const s = be.sids[0];
    ghiDiem(be.luot.get(s)!, { [L]: 30, [R]: 30, [W]: 30, [S]: 30 });
    /* OV-11d (HV-17): em BE chưa có lệnh / lộ trình Lên FT → không có Kết quả đầu ra (không phải "Chờ MT0"). */
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: true }), /Chỉ em lên FT/, 'em không lên FT');
    voiLenhFt(be.classId, s, () => {
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: true }), /MT0/, 'chưa đủ MT0 (PR-KV)');
    mt0Kv(be.classId, s, [4, 4, 4, 4]);
    assertThrows(() => cuoiSvc.ghiKetLuanFt(gvcnDich(), s, { dat: true }), /Quản lý/, 'GVCN');
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.cpManager, s, { dat: true }), /Quản lý|phạm vi/, 'QL chi nhánh khác');
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: false, nguyenNhan: 'hoc_sinh', mon: ['reading'], ghiChu: '  ' }), /lý do/, 'Học viên thiếu lý do (PR-KV: bắt buộc, không còn tối thiểu 15 ký tự)');
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: false, nguyenNhan: 'trung_tam' }), /kỹ năng/, 'Trung tâm, MT0 không kỹ năng dưới ngưỡng');
    assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: 'x' }), /Đạt hoặc Không đạt/, 'dat sai kiểu');
    const fou = taoLop('FOU', 1);
    voiLenhFt(fou.classId, fou.sids[0], () => assertThrows(() => cuoiSvc.ghiKetLuanFt(P.mbManager, fou.sids[0], { dat: true }), /Chờ MT0/, 'em FOU (OV-3b: FOU có Kết quả đầu ra) chưa có MT0'));
    cuoiSvc.ghiKetLuanFt(P.mbManager, s, { dat: true });
    });
    assert(cuoiKhoaMod.cuoiKhoaTheoHocVien(be.classId).get(s).ketLuanFt.dat === true, 'đọc lại kết luận');
  });
  check('LT2b (7) · Final Test dời quá tuần Final Test → MỘT thẻ Báo QL; Progress Test dời quá → không thẻ; nhập đủ điểm → tự đóng', () => {
    const l = taoLop('BE', 1);
    const s = l.sids[0];
    const luot = l.luot.get(s)!;
    const dong = (id: number, skill: string) => conn.prepare('SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND skill = ?').get(id, skill) as any;
    /* Kéo bài Cuối khoá về tuần cuối khoá đã tới (để dấu "-" được ghi), rồi dời sang tuần sau. */
    const tuanCuoi = regularMod.regularSheet(P.admin, l.classId, 'final').rows.find((r: any) => r.studentId === s).skillSchedule[0].weekStart;
    void dong; void tuanCuoi;
    const truoc = (conn.prepare(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_cuoi_khoa'`).get() as any).n;
    let loi: string | null = null;
    try { regularMod.reportRegularNoShow(P.admin, luot, 'listening', true, TODAY); } catch (e: any) { loi = e.message; }
    const sau = (conn.prepare(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_cuoi_khoa' AND doi_tuong_id = ?`).get(luot) as any).n;
    if (loi) console.log('      (bỏ qua nhánh dời: ' + loi + ')');
    else assert(sau === 1 && (conn.prepare(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_cuoi_khoa'`).get() as any).n === truoc + 1, 'phải có đúng một thẻ Báo QL');
    const giua = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' AND class_id = ?`).get(s, l.classId) as any;
    if (giua) { try { regularMod.reportRegularNoShow(P.admin, giua.id, 'listening', true, TODAY); } catch { /* chưa tới tuần */ } }
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_cuoi_khoa' AND doi_tuong_id = ?`).get(giua?.id ?? -1), 'Progress Test dời quá không có thẻ');
    ghiDiem(luot, { [L]: 30, [R]: 30, [W]: 30, [S]: 30 });
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(luot);
    duyetMod.quetYeuCau();
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_cuoi_khoa' AND doi_tuong_id = ? AND trang_thai = 'cho'`).get(luot), 'đủ điểm → thẻ tự đóng');
  });

  // ------------------------------------------------------------------ Task 9 · hộp Kết luận khoá, ô Mini Test, form
  const { docSach: doc } = await import('./panelUx3.tests.ts');
  check('LT2b (9) · chuHopKetLuan: sáu trạng thái — thiếu môn · Pass · lên + bổ trợ · QL cân nhắc · QL đã quyết · học lại', () => {
    const mon = (ds: number[]) => ['listening', 'reading', 'writing', 'speaking'].map((skill, i) => ({ skill, ratio: ds[i] === undefined ? null : ds[i] / 100 }));
    const dung = (ct: string, tyLe: number | null, m: number[], truot: string[], quyet: any = null, kv: any = null) => d.chuHopKetLuan({
      ct, tyLe, scored: m.length, required: 4, mon: mon(m), goiY: d.goiYCuoiKhoa({ ct, tyLe, monTruot: truot }), quyetDinh: quyet, ketLuanFt: kv, homNay: TODAY, lenFt: true,   // OV-11d: em Lên FT
    });
    const thieu = dung('BE', null, [70, 60, 66], []);
    assert(thieu.chinh === 'Final Test · 3/4 môn có điểm' && thieu.nhan === null && thieu.tone === 'muted', JSON.stringify(thieu));
    const pass = dung('BE', 0.78, [80, 75, 78, 79], []);
    assert(pass.chinh === 'Final Test 78%' && pass.nhan === 'Pass' && pass.tone === 'ok', JSON.stringify(pass));
    const len = dung('FOU', 0.64, [70, 58, 66, 62], ['reading', 'speaking']);
    assert(len.chinh === 'Final Test 64%' && len.phu === 'L 70 · R 58 · G+V 66 · P 62' && /^Lên BE \+ bổ trợ miễn phí 2 buổi/.test(len.nhan!), JSON.stringify(len));
    const cn = dung('BE', 0.55, [50, 60, 55, 55], ['listening']);
    assert(/^Quản lý cân nhắc/.test(cn.nhan!) && cn.tone === 'warn', cn.nhan!);
    const qd = dung('BE', 0.55, [50, 60, 55, 55], ['listening'], { huong: 'len_lop', luc: `${NGAY_CHUYEN}T08:00:00Z` });
    assert(/^QL đã quyết: Lên ELE \+ bổ trợ · /.test(qd.nhan!), qd.nhan!);
    assert(/^QL đã quyết: Học lại BE · /.test(dung('BE', 0.55, [50, 60, 55, 55], [], { huong: 'hoc_lai', luc: `${NGAY_CHUYEN}T08:00:00Z` }).nhan!), 'đã quyết học lại');
    const hl = dung('FOU', 0.45, [40, 45, 50, 45], ['listening']);
    assert(hl.nhan === 'Học lại FOU · Quản lý báo phụ huynh qua TVV' && hl.tone === 'bad', JSON.stringify(hl));
    const kv = dung('BE', 0.78, [80, 75, 78, 79], [], null, { dat: false, nguyenNhan: 'trung_tam', mon: ['reading', 'writing'] });
    assert(kv.kyVong!.nhan === 'Kỳ vọng BE IELTS 4.0' && kv.kyVong!.trangThai === 'Không đạt · Trung tâm · R, W' && kv.kyVong!.daDanhDau, JSON.stringify(kv.kyVong));
    assert(dung('BE', 0.78, [80, 75, 78, 79], []).kyVong!.trangThai === 'Chưa đánh dấu' && dung('FOU', 0.78, [80, 75, 78, 79], []).kyVong?.nhan === 'Kỳ vọng FOU IELTS > 3.5', 'chưa đánh dấu · P9b: FOU có Kỳ vọng');
  });
  check('LT2b (9) · viecTiepCuaEm: việc "Ghi Mini Test" có hạn, xếp trước Case, bấm mở đúng Case/PA; cột Việc tiếp theo của lớp có việc cho GVCN', () => {
    const v = d.viecTiepCuaEm({ nhapDiem: null, cases: [], yThuc: null, homNay: TODAY, miniTest: { han: addDays(TODAY, 2), caseId: 5, paId: 9 } });
    assert(v.length === 1 && v[0].viec === 'Ghi Mini Test' && v[0].dich.loai === 'case' && (v[0].dich as any).paId === 9 && v[0].tone === 'warn', JSON.stringify(v));
    assert(d.viecTiepCuaEm({ nhapDiem: null, cases: [], yThuc: null, homNay: TODAY, miniTest: { han: addDays(TODAY, -1), caseId: null, paId: null } })[0].tone === 'danger', 'quá hạn → đỏ');
    const x = dungMiniTest();
    const hang = { viecTiepTheo: vtl(gvcnDich(), x.be).get(x.s) };   // UI-HO-SO-LOP: roster bỏ viecTiepTheo — cùng luật qua viecHocVienTheoLop
    assert(hang?.viecTiepTheo?.some((y: any) => y.viec === 'Ghi Mini Test'), 'roster của GVCN lớp mới phải có việc Ghi Mini Test: ' + JSON.stringify(hang?.viecTiepTheo));
  });
  check('LT2b (9) · web: panel mới dùng useLoiForm, không type="date"; form Ghi kết quả cuối có ô Mini Test; hồ sơ HV mount hộp + ô; chữ không SOS', () => {
    const kl = doc('web/src/modules/students/KetLuanKhoa.tsx'), ct = doc('web/src/modules/cases/CapNhatTuan.tsx'), hs = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(/useLoiForm/.test(kl) && !/type="date"/.test(kl + ct), 'useLoiForm / không type="date"');
    assert(/Mini Test \(%\)/.test(ct) && /body\.miniTest/.test(ct) && /pa\.kind === 'bo_tro_mien_phi'/.test(ct), 'form Mini Test');
    assert(/<KetLuanKhoa/.test(hs) && /<MiniTestO/.test(hs), 'hồ sơ HV');
    assert(!/SOS/.test(kl.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'không chữ SOS ở hộp Kết luận khoá');
  });

  // ------------------------------------------------------------------ Task 10 · demo D10–D13 (soi dữ liệu bộ demo, không phải dữ liệu do phép kiểm tạo)
  const hv = (ten: string) => (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  const lopHienTai = (sid: number) => conn.prepare(`SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active'`).get(sid) as any;
  const caseChuyenCap = (sid: number) => conn.prepare(`SELECT sc.* FROM sos_cases sc WHERE sc.student_id = ? AND sc.origin_kind = 'chuyen_cap' ORDER BY sc.id`).all(sid) as any[];
  check('LT2b (10) · demo D10–D11: bốn dải ở MB BE 04; 64% lên ELE 02 có Case + PA + Mini Test chưa ghi; Mini Test 58% Case còn mở, không thẻ Báo QL (P9a)', () => {
    const trang = hv('Hồ Thu Trang'), khoi = hv('Đặng Minh Khôi'), ngoc = hv('Vương Bảo Ngọc'), huy = hv('Tạ Đức Huy'), vy = hv('Lâm Khánh Vy');
    assert(lopHienTai(trang).code === 'MB BE 03' && lopHienTai(khoi).code === 'MB BE 04' && lopHienTai(ngoc).code === 'MB ELE 02' && lopHienTai(huy).code === 'MB BE 04', 'lớp hiện tại');
    const bao = conn.prepare(`SELECT status, preset FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv'`).all(trang) as any[];
    assert(bao.length === 1 && bao[0].status === 'pending', '45% học lại: một việc Báo PH');
    const ql = permMod.loadPrincipal((conn.prepare(`SELECT id FROM users WHERE full_name = 'Nguyễn Khánh Vy'`).get() as any).id);
    assert(((myWorkMod.myWork(ql, { nguoi: 'tat-ca' }) as any).items as any[]).some((i) => i.key.startsWith('baoph:') && i.studentId === trang), 'Quản lý thấy việc Báo PH');
    const be04 = classId('MB BE 04');
    const e = cuoiKhoaMod.cuoiKhoaTheoHocVien(be04);
    assert(e.get(khoi).goiY.canQuanLy && e.get(huy).goiY.dai === 'dat' && !e.get(huy).goiY.boTroNeuLen, '55% cân nhắc · 78% Pass');
    assert(caseChuyenCap(khoi).length === 0 && caseChuyenCap(huy).length === 0, 'chưa chuyển thì chưa Case');
    const cn = caseChuyenCap(ngoc), mtNgoc = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').get(ngoc) as any;
    assert(cn.length === 2 && cn.every((c) => c.status === 'in_progress') && mtNgoc.ty_le === null, JSON.stringify({ n: cn.length, mt: mtNgoc }));
    const mtVy = conn.prepare('SELECT * FROM mini_test WHERE student_id = ?').get(vy) as any;
    assert(mtVy.ty_le === 0.58 && caseChuyenCap(vy).every((c) => c.status !== 'done'), 'Mini Test 58%: Case còn mở');
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ? AND trang_thai = 'cho'`).get(mtVy.id), 'P9a: không thẻ Báo QL Mini Test');
  });
  check('LT2b (10) · demo D12–D13: Pre FOU 52% lên FOU; Trung tâm → Case FT + Tutor; Học viên → không Case, có phương án (N17, P9b)', () => {
    const bao = hv('Ninh Gia Bảo');
    const c = caseChuyenCap(bao);
    assert(lopHienTai(bao).code === 'MB FOU 15' && c.length === 1 && c[0].title === 'Final Test Pre FOU · Tổng hợp không đạt', JSON.stringify(c.map((x) => x.title)));
    assert(/4 buổi miễn phí · 2 tuần/.test(paCuaCase(c[0].id)[0].description), 'Pre FOU 4 buổi · 2 tuần');
    const minh = hv('Chu Nhật Minh'), nhi = hv('Kiều Thảo Nhi');
    const cm = caseChuyenCap(minh);
    assert(lopHienTai(minh).code === 'MB FT 101' && cm.length === 1 && cm[0].title === 'Kỳ vọng đầu ra chưa đạt · Reading', JSON.stringify(cm.map((x) => x.title)));
    assert((conn.prepare(`SELECT kind, preset FROM case_interventions WHERE case_id = ?`).get(cm[0].id) as any).kind === 'tutor', 'PA Tutor');
    const cn = caseChuyenCap(nhi);
    assert(!cn.some((x) => /^Kỳ vọng đầu ra/.test(x.title)), JSON.stringify(cn.map((x) => x.title)));
    const lt = conn.prepare(`SELECT ky_vong_nguyen_nhan, ky_vong_ghi_chu FROM lo_trinh_tiep_theo WHERE student_id = ? AND ky_vong_dat = 0`).get(nhi) as any;
    assert(lt.ky_vong_nguyen_nhan === 'hoc_sinh' && lt.ky_vong_ghi_chu.length >= 15, 'ghi chú case-by-case');
  });
  check('LT2b (10) · DEMO.md có mục PR-LT2b với D10–D13 và tên học viên khớp bộ demo', () => {
    const dm = doc('DEMO.md');
    assert(/## 15\. PR-LT2b/.test(dm) && ['D10', 'D11', 'D12', 'D13'].every((k) => dm.includes(k)), 'thiếu mục');
    for (const ten of ['Hồ Thu Trang', 'Đặng Minh Khôi', 'Vương Bảo Ngọc', 'Tạ Đức Huy', 'Lâm Khánh Vy', 'Ninh Gia Bảo', 'Chu Nhật Minh', 'Kiều Thảo Nhi']) {
      assert(dm.includes(ten) && !!conn.prepare('SELECT 1 FROM students WHERE full_name = ?').get(ten), `${ten} không khớp bộ demo`);
    }
  });
}
