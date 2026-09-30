/** PHÉP KIỂM PR-LT2b — Cuối khoá lớp thường: dải, hướng gợi ý, bổ trợ miễn phí, Mini Test. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2bTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrLt2b } = await import('../migrate/prLt2b.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-LT2b · Cuối khoá lớp thường');

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
    assert(g.dai === '50_59' && g.huong === null && g.canQuanLy && g.canQl, 'canQuanLy');
    assert(g.boTroNeuLen!.soTuan === 2 && g.boTroNeuLen!.soBuoi === 3 && !g.baoPhTvv, 'bổ trợ nếu lên');
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
  check('LT2b (2) · mini_test: UNIQUE (em, bài Cuối khoá) chặn Mini Test thứ hai', () => {
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
  check('LT2b (3) · sửa một điểm Cuối khoá → gợi ý đổi theo (không lưu ở đâu)', () => {
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
    assert(regularMod.regularSheet(P.admin, l.classId, 'progress').rows.every((r: any) => r.goiY === null), 'bài Giữa khoá không có hướng Cuối khoá');
    const ft = profileMod.studentProfile(P.admin, (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id IN (SELECT student_id FROM enrollments WHERE status = 'active' GROUP BY student_id HAVING COUNT(*) = 1) LIMIT 1`).get(classId('MB FT 101')) as any).student_id);
    assert(ft.cuoiKhoa === null, `em FT không có cuoiKhoa: ${JSON.stringify(ft.cuoiKhoa)} · ${typeof ft.cuoiKhoa}`);
  });

  // ------------------------------------------------------------------ Task 4 · Quản lý quyết khi chuyển (không còn thẻ — Q30-3, Q30-4)
  check('LT2b (4) · Quản lý chuyển em 50–59% → ghi quyet_boi/quyet_luc + nhật ký; em 78% không ghi; không có thẻ Quyết định Cuối khoá', () => {
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
    assert(!conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'quyet_dinh_cuoi_khoa'`).get(), 'không được có thẻ Quyết định Cuối khoá (Q30-3)');
  });
}
