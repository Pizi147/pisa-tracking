/**
 * PHÉP KIỂM PR-Pa — Tổng quan (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10, §7 dòng Pa).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không sửa học viên của bộ demo. Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai).
 * Bộ này TẠO học viên / Case THẬT trong database dùng chung của harness, nên PHẢI là khối cuối cùng nối vào `run.ts`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runTongQuanTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Pa · Tổng quan');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  const signals: any = await import('../cases/signals.ts');
  const chuongTrinh: any = await import('../worklist/chuongTrinh.ts').catch(() => ({}));
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const cases: any = await import('../cases/cases.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const tq: any = await import('../worklist/tongQuan.ts').catch(() => ({}));
  const bang: any = await import('../worklist/bangChiNhanh.ts').catch(() => ({}));
  const mywork: any = await import('../worklist/mywork.ts');
  const NOW = new Date().toISOString();
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;
  /** Học viên mới trong một lớp có sẵn của bộ demo, một lộ trình đang chạy, một lượt Test ở tuần `weekStart`. */
  function taoHocVien(o: { classCode: 'MB FOU 12' | 'MB FT 101'; weekStart: string }) {
    soThuTu += 1;
    const tag = `PA-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB FT 101';
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
    ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', NOW).lastInsertRowid);
    const periodId = week.ensurePeriod(o.weekStart).id;
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,1,?,?,?, 'planned', ?)`,
    ).run(cycleId, sid, ft ? 'mock' : 'progress', cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(attemptId);
    return { sid, cid, cycleId, attemptId };
  }
  const diem = (attemptId: number, skill: string, score: number, total: number) =>
    regular.saveRegularScore(P.admin, attemptId, skill, { score, total });
  const tinHieu = (attemptId: number, skill: string) =>
    conn.prepare('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
  const moCase = (sid: number, topic: string) => cases.reportIssue(P.admin, {
    studentId: sid, topic, title: `Case thử PR-Pa ${topic}`, summary: 'Em vướng đúng phần này của môn, đã xem lại bài.',
    primaryCode: d.issuesForTopic(topic)[0].code,
  }) as any;
  const ids = (id: string, f: any = {}) => (metricsSvc.metricSet(P.admin, id, f).ids as number[]);

  // ================================================================== 1. Luật thuần
  check('PR-Pa · Chương trình: đọc tham số ct; mặc định Cả hai; không có chữ "Normal" trên màn', () => {
    eq(d.chuongTrinhTuThamSo('thuong'), 'thuong', 'thuong');
    eq(d.chuongTrinhTuThamSo('ft'), 'ft', 'ft');
    eq(d.chuongTrinhTuThamSo(null), 'ca-hai', 'vắng');
    eq(d.chuongTrinhTuThamSo('normal'), 'ca-hai', 'giá trị lạ');
    eq(d.thamSoCt('ca-hai'), '', 'Cả hai không gắn tham số');
    eq(d.thamSoCt('ft', '?'), '?ct=ft', 'ft');
    eq(d.CHUONG_TRINH_LABEL, { thuong: 'Lớp thường', ft: 'Fast Track', 'ca-hai': 'Cả hai' }, 'Nhãn');
  });

  check('PR-Pa · Gom nhóm việc GV: 12 loại việc về đúng 4 nhóm, nhóm có việc quá hạn tự mở, Ý thức không bao giờ tự mở', () => {
    const cham = ['score', 'decide_move'];
    const kase = ['verify', 'cause', 'no_plan', 'result', 'decide', 'do_plan', 'no_owner'];
    const van = ['placement', 'mgmt', 'missing_data'];
    for (const g of cham) eq(d.nhomViecCua(g), 'cham-diem', g);
    for (const g of kase) eq(d.nhomViecCua(g), 'case-hoc-thuat', g);
    for (const g of van) eq(d.nhomViecCua(g), 'van-hanh', g);
    eq(d.nhomViecCua('loai-la'), 'van-hanh', 'Loại lạ');
    const v = (group: string, urgency: string, due: string | null) => ({ group, urgency, due });
    const nhom = d.gomNhomViec([
      v('result', 'normal', '2026-09-20'), v('verify', 'overdue', '2026-09-10'), v('score', 'normal', null), v('mgmt', 'today', '2026-09-14'),
    ], 2);
    eq(nhom.map((g: any) => g.key), ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'], 'Thứ tự nhóm cố định');
    const kh = nhom.find((g: any) => g.key === 'case-hoc-thuat');
    eq([kh.n, kh.quaHan, kh.moSan], [2, 1, true], 'Case học thuật: 2 việc, 1 quá hạn, tự mở');
    eq(kh.items[0].group, 'verify', 'Việc quá hạn lên đầu nhóm');
    const yt = nhom.find((g: any) => g.key === 'y-thuc');
    eq([yt.n, yt.moSan], [2, false], 'Ý thức: đếm dòng nhắc, không tự mở');
    eq(nhom.find((g: any) => g.key === 'cham-diem').moSan, false, 'Nhóm không quá hạn thì gập');
    eq(d.gomNhomViec([], 0), [], 'Không việc thì không nhóm');
    eq(d.LOAI_HAN_CUA_VIEC.verify, 'xac-minh-sos', 'Hạn tín hiệu');
    eq(d.LOAI_HAN_CUA_VIEC.score, 'nhap-diem', 'Hạn nhập điểm');
  });

  check('PR-Pa · Cần xử lý: đúng thứ tự design §4.1, bỏ dòng 0, tối đa 8, "PA chờ Quản lý duyệt" chỉ khi duyệt được', () => {
    eq(d.CAN_XU_LY.map((x: any) => x.metricId), [
      'tin-hieu-qua-han', 'case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'case-chua-co-nguoi-phu-trach',
      'hv-can-ho-tro-2-lan-chua-case', 'hv-bo-qua-van-can-ho-tro',
      'case-thieu-pa', 'pa-can-cap-nhat', 'bai-qua-han-nhap-diem', 'hv-can-xu-ly',
    ], 'Thứ tự (PR-UX4 chèn hai dòng "bỏ quên" sau Case chưa có người phụ trách)');
    eq(d.CAN_XU_LY.filter((x: any) => x.denLoc).map((x: any) => [x.metricId, x.denLoc, x.nut, x.mau]), [
      ['hv-can-ho-tro-2-lan-chua-case', 'can-ho-tro-2-lan', 'Xem', 'vang'],
      ['hv-bo-qua-van-can-ho-tro', 'bo-qua-van-can-ho-tro', 'Xem', 'vang'],
    ], 'Hai dòng mới: nút Xem, màu vàng, mở bộ lọc Danh sách Case');
    const dem = { 'pa-can-cap-nhat': 3, 'tin-hieu-qua-han': 2, 'pa-cho-duyet': 1, 'case-thieu-pa': 0 };
    const co = d.sapCanXuLy(dem, true);
    eq(co.map((x: any) => [x.metricId, x.n]), [['tin-hieu-qua-han', 2], ['pa-cho-duyet', 1], ['pa-can-cap-nhat', 3]], 'Có quyền duyệt');
    eq(d.sapCanXuLy(dem, false).map((x: any) => x.metricId), ['tin-hieu-qua-han', 'pa-can-cap-nhat'], 'Không quyền duyệt');
    eq(co[0].nhan, 'tín hiệu cần xác minh quá hạn', 'Chữ g11-041 + g8-070');
    eq(co[1].nut, 'Duyệt', 'Nút g3-020');
    const all = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 5]));
    assert(d.sapCanXuLy(all, true).length === d.CAN_XU_LY_TOI_DA && d.CAN_XU_LY_TOI_DA === 10, 'Tối đa 10 dòng (8 + hai dòng "bỏ quên")');
    eq(d.sapCanXuLy({ 'hv-bo-qua-van-can-ho-tro': 2 }, false)[0].denLoc, 'bo-qua-van-can-ho-tro', 'denLoc đi kèm dòng');
    assert(!('denLoc' in d.sapCanXuLy({ 'case-thieu-pa': 1 }, false)[0]), 'Dòng thường không có denLoc');
  });

  check('PR-Pa · Điểm đáng chú ý: tối đa 3; dưới ngưỡng thì bỏ; lớp thường nói "chưa đạt"; link ghi đúng số dòng sẽ mở', () => {
    const mon = (nhanMon: string, skill: string, tu: number, mau: number) =>
      ({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu, mau, nhanMon });
    const ds = [
      mon('Listening', 'listening', 7, 20), mon('Reading', 'reading', 2, 4), mon('Writing', 'writing', 5, 10),
      { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 5, mau: 6 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from: '2026-08-15' }, tu: 12, mau: 20 },
    ];
    const r = d.chonDiemDangChuY(ds, 'ca-hai');
    eq(r.length, 3, 'Ba điểm');
    eq(r[0].cau, 'Writing: 5/10 học viên dưới kỳ vọng', 'Môn tỷ lệ cao nhất, ≥ 3 em (Reading 2/4 dưới ngưỡng)');
    eq([r[0].lienKet, r[0].soDanhSach], ['xem 5 học viên', 5], 'Link môn');
    eq([r[1].cau, r[1].soDanhSach], ['5/6 PA học thuật đã kết thúc có cải thiện', 6], 'PA cải thiện — danh sách là mẫu số');
    eq(r[2].cau, '12/20 lần cập nhật PA đúng hạn (30 ngày qua)', 'Đúng hạn < 80%');
    eq(d.chonDiemDangChuY(ds, 'thuong')[0].cau, 'Writing: 5/10 học viên chưa đạt', 'Lớp thường');
    const it = d.chonDiemDangChuY([
      mon('Listening', 'listening', 2, 20), { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 3, mau: 4 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', tu: 19, mau: 20 },
    ], 'ca-hai');
    eq(it, [], 'Không ứng viên nào đủ điều kiện');
  });

  // ================================================================== 2. Nợ S1 (1)
  check('PR-Pa · Nợ S1: overdueNormalSignalIds cùng tập với cách cũ (4 vai, có và không chọn chi nhánh) mà không gọi quyền từng tín hiệu', () => {
    const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
    for (const who of [P.admin, P.mbManager, P.cpManager, P.normalCoreTeacher, P.lrTeacher]) {
      for (const branchId of [null, mb]) {
        const cu = (signals.listSignals(who, { status: 'open', branchId, today: TODAY }).rows as any[])
          .filter((s) => s.kind === 'normal' && s.overdue).map((s) => s.id).sort((a: number, b: number) => a - b);
        eq(signals.overdueNormalSignalIds(who, { branchId, today: TODAY }), cu, `Lệch tập (user ${who.userId}, cn ${branchId})`);
      }
    }
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/cases/signals.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function overdueNormalSignalIds'), src.indexOf('export function signalDetail'));
    assert(body.length > 0 && !/listSignals\(|\bcan\(|canResolveSignal\(/.test(body),
      'overdueNormalSignalIds vẫn gọi quyền từng tín hiệu (listSignals / can) — trên Turso mất vài giây mỗi lần mở Tổng quan');
  });

  // ================================================================== 3. Lọc chương trình
  check('PR-Pa · Chương trình: cùng một chỉ số, Lớp thường chỉ có em lớp thường, Fast Track chỉ có em FT, cả hai tập nằm trong Cả hai', () => {
    const thuong = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const ft = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    const cThuong = moCase(thuong.sid, 'listening');
    const cFt = moCase(ft.sid, 'reading');
    for (const [id, a, b] of [['hv-co-case-mo', thuong.sid, ft.sid], ['case-mo', cThuong.id, cFt.id]] as const) {
      const all = ids(id), t = ids(id, { program: 'thuong' }), f = ids(id, { program: 'ft' });
      assert(t.includes(a) && !t.includes(b), `${id}: Lớp thường sai`);
      assert(f.includes(b) && !f.includes(a), `${id}: Fast Track sai`);
      assert([...t, ...f].every((x) => all.includes(x)), `${id}: tập lọc lọt ngoài Cả hai`);
      assert(!t.some((x) => f.includes(x)), `${id}: một phần tử ở cả hai chương trình`);
    }
    const r = metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { program: 'thuong' });
    const mau = (r.denominatorIds ?? []) as number[];
    assert(mau.length > 0, 'Mẫu số của hv-duoi-ky-vong-mon (Lớp thường) phải có em — nếu rỗng thì phép kiểm bên dưới vô nghĩa');
    eq(chuongTrinh.locTheoChuongTrinh('hoc-vien', mau, 'thuong'), mau, 'Mẫu số cũng phải được lọc theo chương trình');
    assert(r.n === r.ids.length && r.ids.every((x: number) => mau.includes(x)), 'n = độ dài tập; tập đếm ⊆ mẫu số');
    eq(ids('tin-hieu-qua-han', { program: 'ft' }), [], 'Tín hiệu quá hạn chỉ có ở lớp thường');
  });

  check('PR-Pa · Chương trình: /metrics nhận tham số ct; Cả hai = không lọc', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    const block = src.slice(src.indexOf("api.get('/metrics/:id'"), src.indexOf("api.get('/metrics/:id'") + 600);
    assert(/program:\s*chuongTrinhTuThamSo\(qStr\(req, 'ct'\)\)/.test(block), 'Route /metrics/:id chưa đọc ct');
    eq(ids('case-mo', { program: 'ca-hai' }), ids('case-mo'), 'Cả hai = không lọc');
  });

  check('PR-Pa · tachTheoLop: gom theo lớp, hai lớp nhiều nhất, còn lại "+k lớp"; một phần tử ghi đúng lớp', () => {
    const a = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const c = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    eq(chuongTrinh.tachTheoLop('hoc-vien', [a.sid, b.sid, c.sid]), 'MB FOU 12 (2) · MB FT 101 (1)', 'Hai lớp');
    eq(chuongTrinh.tachTheoLop('hoc-vien', [a.sid, b.sid, c.sid], 1), 'MB FOU 12 (2) · +1 lớp', 'Quá toiDa thì "+k lớp"');
    eq(chuongTrinh.tachTheoLop('hoc-vien', [c.sid]), 'MB FT 101', 'Một em');
    eq(chuongTrinh.tachTheoLop('hoc-vien', []), '', 'Rỗng');
    const m = chuongTrinh.lopCuaTap('hoc-vien', [a.sid, c.sid]);
    eq([m.get(a.sid).isFt, m.get(c.sid).isFt], [false, true], 'isFt theo lớp đang học');
  });

  // ================================================================== 4. Ba chỉ số mới
  check('PR-Pa · Chỉ số case-chua-co-nguoi-phu-trach: Case mở không người phụ trách có; gán người thì hết; luôn ⊆ case-mo', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const c = moCase(hv.sid, 'reading');
    conn.prepare('UPDATE sos_cases SET owner_user_id = NULL WHERE id = ?').run(c.id);
    assert(ids('case-chua-co-nguoi-phu-trach').includes(c.id), 'Case không người phụ trách phải có');
    conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ?').run(P.normalCoreTeacher.userId, c.id);
    assert(!ids('case-chua-co-nguoi-phu-trach').includes(c.id), 'Đã có người phụ trách thì không đếm');
    const mo = ids('case-mo');
    assert(ids('case-chua-co-nguoi-phu-trach').every((x) => mo.includes(x)), 'Phải là tập con của Case đang mở');
  });

  check('PR-Pa · Chỉ số case-xac-dinh-nguyen-nhan-qua-han = Case chờ xác định nguyên nhân mà hạn 3 ngày của tín hiệu nối đã qua', () => {
    const cho = ids('case-cho-xac-dinh-nguyen-nhan');
    const quaHan = cho.filter((id) => {
      const r = conn.prepare(`SELECT MIN(verify_due) AS due FROM case_signals WHERE case_id = ? AND status = 'linked'`).get(id) as any;
      return r?.due && r.due < TODAY;
    }).sort((a, b) => a - b);
    eq(ids('case-xac-dinh-nguyen-nhan-qua-han'), quaHan, 'Lệch tập');
  });

  await checkAsync('PR-Pa · Chỉ số bai-qua-han-nhap-diem = lượt có ô điểm quá hạn (cùng hàm scoreDebtCells của bảng chấm); GV chỉ thấy lớp mình', async () => {
    const debt: any = await import('../worklist/scoreDebt.ts');
    const want = [...new Set((debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue).map((x) => x.attemptId))]
      .sort((a: number, b: number) => a - b);
    eq(ids('bai-qua-han-nhap-diem'), want, 'Quản trị');
    const gv = metricsSvc.metricSet(P.lrTeacher, 'bai-qua-han-nhap-diem', {}).ids as number[];
    const lopGv = new Set((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`)
      .all(P.lrTeacher.userId) as any[]).map((r) => r.class_id));
    assert(gv.length > 0, 'GV Listening MB FT 101 phải có ít nhất một lượt quá hạn nhập điểm trong bộ demo — nếu không, vòng kiểm bên dưới vô nghĩa');
    for (const a of gv) {
      const cl = (conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(a) as any).class_id;
      assert(lopGv.has(cl), `GV thấy lượt của lớp không dạy: ${a}`);
    }
  });

  await checkAsync('PR-Pa · bai-qua-han-nhap-diem: người vừa dạy lớp ở MB vừa là Quản lý CP thấy (lớp mình dạy) ∪ (cả CP) — không nới thành cả MB', async () => {
    const debt: any = await import('../worklist/scoreDebt.ts');
    const fou12 = classId('MB FOU 12');
    /* Giáo viên MB KHÔNG dạy MB FOU 12 (bộ demo: GV Listening MB FT 102) — để lượt tạo ở MB FOU 12 nằm trong chi nhánh mà ngoài lớp của người này. */
    const gvRow = conn.prepare(
      `SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
        WHERE ta.status = 'active' AND c.branch_id = ? AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?)
        ORDER BY ta.user_id LIMIT 1`,
    ).get(mbBranch, fou12) as any;
    assert(gvRow, 'Bộ demo phải có một giáo viên MB không dạy MB FOU 12 — nếu không, phép kiểm này không tách được "cả MB" khỏi "lớp mình dạy"');
    const cp = (conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any).id as number;
    const roleId = (conn.prepare(`SELECT id FROM roles WHERE key = 'manager'`).get() as any).id as number;
    const grant = Number(conn.prepare(
      `INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?, 'active', ?)`,
    ).run(gvRow.user_id, roleId, cp, NOW).lastInsertRowid);
    try {
      const lai = loadPrincipal(gvRow.user_id);
      const ngoaiLop = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
      const cells = (debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue);
      assert(cells.some((x) => x.attemptId === ngoaiLop.attemptId), 'Lượt MB FOU 12 tuần 07/09 phải có ô quá hạn ở ngày 14/09 — nếu không, phép kiểm không có gì để lọt');
      const lopGv = new Set((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`)
        .all(lai.userId) as any[]).map((r) => r.class_id as number));
      const branchOf = (cid: number) => (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(cid) as any).branch_id as number;
      const want = [...new Set(cells.filter((x) => lopGv.has(x.classId) || branchOf(x.classId) === cp).map((x) => x.attemptId as number))]
        .sort((a, b) => a - b);
      const got = metricsSvc.metricSet(lai, 'bai-qua-han-nhap-diem', {}).ids as number[];
      assert(!got.includes(ngoaiLop.attemptId), `Lọt lượt ${ngoaiLop.attemptId} của lớp MB mình không dạy — quyền lớp bị nới thành cả chi nhánh`);
      eq(got, want, 'Phạm vi lai = (lớp mình dạy) ∪ (chi nhánh được cấp)');
    } finally {
      conn.prepare('DELETE FROM user_roles WHERE id = ?').run(grant);
    }
  });

  check('PR-Pa · rowsFor: tín hiệu ghi tên môn (không chữ thô "listening"); bài thi có dòng', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const row = metricsSvc.rowsFor('tin-hieu', [sg.id])[0];
    assert(/Listening/.test(row.title) && !/listening/.test(row.title), `Chữ thô: ${row.title}`);
    const bai = metricsSvc.rowsFor('bai-thi', [hv.attemptId])[0];
    assert(bai.href !== '#' && /Giữa khoá|Bài/.test(bai.title), `Bài thi không có dòng: ${JSON.stringify(bai)}`);
  });

  // ================================================================== 5. Cần xử lý · Điểm đáng chú ý · HV cần hỗ trợ
  check('PR-Pa · Cần xử lý: mỗi dòng có số = độ dài tập của đúng chỉ số đó (cùng chi nhánh, cùng chương trình); đúng thứ tự; ≤ 8', () => {
    const mb = mbBranch;
    for (const [who, f] of [[P.admin, { ct: 'ca-hai' }], [P.mbManager, { branchId: mb, ct: 'thuong' }], [P.mbManager, { ct: 'ft' }]] as const) {
      const r = tq.tongQuanQuanLy(who, f);
      if (who === P.admin && f.ct === 'ca-hai') assert(r.canXuLy.length > 0, 'Cần xử lý (admin, Cả hai) phải có dòng — nếu rỗng thì vòng kiểm bên dưới vô nghĩa');
      assert(r.canXuLy.length <= 10, 'Quá 10 dòng');
      const thuTu = d.CAN_XU_LY.map((x: any) => x.metricId);
      let truoc = -1;
      for (const dong of r.canXuLy) {
        const n = metricsSvc.metricSet(who, dong.metricId, { branchId: (f as any).branchId ?? null, program: f.ct }).n;
        eq(dong.n, n, `Số dòng ${dong.metricId}`);
        assert(dong.n > 0, 'Dòng 0 phải bị bỏ');
        assert(thuTu.indexOf(dong.metricId) > truoc, 'Sai thứ tự');
        truoc = thuTu.indexOf(dong.metricId);
        assert(typeof dong.phu === 'string' && dong.phu.length <= 60, `Dòng phụ quá 60 ký tự: ${dong.phu}`);
      }
    }
  });

  check('PR-Pa · Điểm đáng chú ý: ≤ 3; mỗi link mở đúng số dòng đã ghi', () => {
    const r = tq.tongQuanQuanLy(P.admin, { ct: 'ca-hai' });
    assert(r.diemDangChuY.length > 0, 'Điểm đáng chú ý (admin) phải có điểm');
    assert(r.diemDangChuY.length <= 3, 'Quá 3 điểm');
    for (const x of r.diemDangChuY) {
      const set = metricsSvc.metricSet(P.admin, x.metricId, { ...(x.extra ?? {}), program: 'ca-hai' });
      eq(x.soDanhSach, set.ids.length, `Link ${x.loai} ghi ${x.soDanhSach} mà danh sách có ${set.ids.length}`);
    }
  });

  check('PR-Pa · Khối Quản lý: giáo viên bị từ chối (403), không trả tập rút gọn', () => {
    assertThrows(() => tq.tongQuanQuanLy(P.normalCoreTeacher, { ct: 'ca-hai' }), /Quản lý/, 'GVCN mở khối Quản lý');
  });

  check('PR-Pa · Học viên cần hỗ trợ: em có SOS ở lớp tôi dạy có mặt kèm nhãn SOS; em không có gì thì không; GV lớp khác không thấy', () => {
    const co = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 10, 40], ['reading', 10, 40], ['writing', 5, 20], ['speaking', 20, 25]] as const) diem(co.attemptId, s, sc, tt);
    const khong = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 35, 40], ['reading', 35, 40], ['writing', 18, 20], ['speaking', 22, 25]] as const) diem(khong.attemptId, s, sc, tt);
    const r = tq.hocVienCanHoTro(P.normalCoreTeacher);
    const dong = r.rows.find((x: any) => x.studentId === co.sid);
    assert(dong && /^SOS [123]/.test(dong.huyHieu?.text ?? ''), `Thiếu em có SOS hoặc thiếu nhãn: ${JSON.stringify(dong)}`);
    assert(!r.rows.some((x: any) => x.studentId === khong.sid), 'Em đạt hết không phải "cần hỗ trợ"');
    eq(r.tong, r.rows.length, 'tong = số dòng');
    assert(!tq.hocVienCanHoTro(P.w2Teacher /* GV W2 MB FT 101, không dạy MB FOU 12 */).rows.some((x: any) => x.studentId === co.sid), 'GV lớp khác thấy em');
    const sos = r.rows.filter((x: any) => x.huyHieu && /^SOS/.test(x.huyHieu.text)).map((x: any) => Number(x.huyHieu.text[4]));
    assert(sos.every((v: number, i: number) => i === 0 || sos[i - 1] >= v), 'Phải xếp mức SOS giảm dần');
  });

  // ================================================================== 6. Bảng Theo chi nhánh
  const moiO = (who: any, f: any, cb: (khoa: string, cot: string, o: any) => void) => {
    const b = bang.bangChiNhanh(who, f);
    for (const cot of d.COT_BANG) cb('tong', cot, b.tong[cot]);
    for (const h of b.hang) {
      for (const cot of d.COT_BANG) cb(h.khoa, cot, h.o[cot]);
      for (const l of h.lop ?? []) for (const cot of d.COT_BANG) cb(l.khoa, cot, l.o[cot]);
    }
    return b;
  };

  check('PR-Pa · Bảng chi nhánh: bấm MỌI ô ra đúng số dòng đã ghi (G-10); hàng tổng là tập gốc của chỉ số', () => {
    const b = moiO(P.admin, { ct: 'ca-hai' }, (khoa, cot, o) => {
      const r = bang.oBangChiNhanh(P.admin, { ct: 'ca-hai', cot, khoa });
      eq(r.rows.length, o.n, `Ô ${khoa}/${cot}`);
    });
    assert(b.hang.length > 0, 'Bảng không có hàng nào — phép kiểm vô nghĩa');
    const t = bang.oBangChiNhanh(P.admin, { ct: 'ca-hai', cot: 'caseMo', khoa: 'tong' });
    assert(t.rows.length > 0, 'Tổng Case mở rỗng — phép kiểm vô nghĩa');
    eq(t.rows.map((x: any) => x.id).sort((a: number, b: number) => a - b), ids('case-mo').slice().sort((a, b) => a - b), 'Tổng Case mở = case-mo');
    const dd = b.tong.duDuLieu;
    const phu = metricsSvc.metricSet(P.admin, 'do-phu-danh-gia', {});
    eq([dd.n, dd.mau], [phu.numeratorIds.length, phu.n], 'Đủ dữ liệu = tử số / mẫu số của do-phu-danh-gia');
    const idsO = (cot: string) => new Set<number>(bang.oBangChiNhanh(P.admin, { ct: 'ca-hai', cot, khoa: 'tong' }).rows.map((r: any) => r.id));
    const hv = idsO('hocVien');
    for (const cot of ['duoiKyVong', 'sos', 'duDuLieu']) {
      const lot = [...idsO(cot)].filter((id) => !hv.has(id));
      assert(lot.length === 0, `Tổng ${cot} có em ngoài tổng Học viên: ${JSON.stringify(lot)}`);
    }
  });

  check('PR-Pa · Bảng chi nhánh: Quản trị không chọn chi nhánh → hàng chi nhánh mở xuống lớp; Quản lý một chi nhánh → bảng lớp luôn', () => {
    const a = bang.bangChiNhanh(P.admin, { ct: 'ca-hai' });
    assert(a.cheDo === 'chi-nhanh' && a.hang.every((h: any) => h.loai === 'chi-nhanh' && Array.isArray(h.lop)), 'Quản trị');
    eq(a.branchId, null, 'Quản trị không chọn: branchId null');
    const m = bang.bangChiNhanh(P.mbManager, { ct: 'ca-hai' });
    assert(m.cheDo === 'lop' && m.hang.every((h: any) => h.loai === 'lop') && m.tenChiNhanh === 'Monbay', `Quản lý MB: ${m.cheDo}`);
    eq(m.branchId, mbBranch, 'QL một chi nhánh: bảng trả branchId đã giải');
  });

  check('PR-Pa · Bảng chi nhánh: Lớp thường không có hàng lớp FT; giáo viên bị từ chối', () => {
    const b = bang.bangChiNhanh(P.admin, { branchId: mbBranch, ct: 'thuong' });
    assert(b.hang.length > 0 && b.hang.every((h: any) => h.laFt === false), 'Lọt lớp FT vào Lớp thường');
    assertThrows(() => bang.bangChiNhanh(P.normalCoreTeacher, { ct: 'ca-hai' }), /Quản lý/, 'GV mở bảng chi nhánh');
  });

  // ================================================================== 7. Lịch sắp tới
  await checkAsync('PR-Pa · Lịch sắp tới: Fast Track không có mốc lớp thường; Lớp thường không có MT/dự kiến thi', async () => {
    const hl: any = await import('../worklist/highlights.ts');
    const ft = hl.highlights(P.admin, { program: 'ft' });
    assert(ft.weeks.every((w: any) => !w.normal.progressClasses.length && !w.normal.finalClasses.length && !w.normal.endingClasses.length), 'FT lẫn lớp thường');
    const th = hl.highlights(P.admin, { program: 'thuong' });
    assert(th.weeks.every((w: any) => !w.ft.mockClasses.length && w.ft.examStudents === 0) && th.examMonthOnly.students === 0, 'Lớp thường lẫn FT');
  });

  // ================================================================== 8. Nợ S1 (2)
  check('PR-Pa · Nợ S1: không ai dạy Speaking → tín hiệu về GVCN; GVCN thấy hai nút; Tạo Case thành công, gửi lại cùng khoá ra cùng Case; dòng biến mất', () => {
    const cid = classId('MB FOU 12');
    const tam = (conn.prepare(`SELECT id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`)
      .all(cid) as any[]).map((r) => r.id as number);
    assert(tam.length > 0, 'Bộ demo phải có GV Speaking ở MB FOU 12');
    const ph = tam.map(() => '?').join(',');
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id IN (${ph})`).run(...tam);
    try {
      const gvcn = loadPrincipal(P.normalCoreTeacher.userId);
      const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
      diem(hv.attemptId, 'speaking', 5, 25);
      const sg = tinHieu(hv.attemptId, 'speaking');
      assert(sg && sg.owner_user_id === gvcn.userId, `Tín hiệu Speaking phải về GVCN: ${sg?.owner_user_id}`);
      const dong = (mywork.myWork(gvcn).items as any[]).find((i) => i.key === `verify:${sg.id}`);
      assert(dong?.signal, 'GVCN không thấy dòng tín hiệu');
      eq(dong.signal.actions, ['create_case', 'dismiss'], 'Hai nút');
      const gui = () => cases.reportIssue(gvcn, {
        studentId: hv.sid, topic: 'speaking', fromSignalId: sg.id, idempotencyKey: `pa-e2e-${sg.id}`,
        title: 'Speaking — trả lời cụt, không mở rộng ý', summary: 'Part 2 nói dưới một phút, lặp từ nối; đã nghe lại bài thi.',
        primaryCode: d.issuesForTopic('speaking')[0].code,
      }) as any;
      const c = gui();
      eq(gui().id, c.id, 'Gửi lại cùng idempotencyKey phải ra cùng Case');
      const sau = conn.prepare('SELECT status, case_id FROM case_signals WHERE id = ?').get(sg.id) as any;
      eq([sau.status, sau.case_id], ['linked', c.id], 'Tín hiệu phải gắn vào Case');
      assert(!(mywork.myWork(gvcn).items as any[]).some((i) => i.key === `verify:${sg.id}`), 'Dòng tín hiệu phải biến mất');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ph})`).run(...tam);
    }
  });
}
