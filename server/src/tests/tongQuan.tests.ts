/**
 * PHÉP KIỂM PR-Pa — Tổng quan (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10, §7 dòng Pa).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không sửa học viên của bộ demo. Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai).
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
  const NOW = new Date().toISOString();
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;
  /** Học viên mới trong một lớp có sẵn của bộ demo, một lộ trình đang chạy, một lượt Test ở tuần `weekStart`. */
  function taoHocVien(o: { classCode: 'MB-FOU 12' | 'MB-FT 101'; weekStart: string }) {
    soThuTu += 1;
    const tag = `PA-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB-FT 101';
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
  void loadPrincipal; void assertThrows; void tinHieu; void diem;

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
      'case-thieu-pa', 'pa-can-cap-nhat', 'bai-qua-han-nhap-diem', 'hv-can-xu-ly',
    ], 'Thứ tự');
    const dem = { 'pa-can-cap-nhat': 3, 'tin-hieu-qua-han': 2, 'pa-cho-duyet': 1, 'case-thieu-pa': 0 };
    const co = d.sapCanXuLy(dem, true);
    eq(co.map((x: any) => [x.metricId, x.n]), [['tin-hieu-qua-han', 2], ['pa-cho-duyet', 1], ['pa-can-cap-nhat', 3]], 'Có quyền duyệt');
    eq(d.sapCanXuLy(dem, false).map((x: any) => x.metricId), ['tin-hieu-qua-han', 'pa-can-cap-nhat'], 'Không quyền duyệt');
    eq(co[0].nhan, 'tín hiệu cần xác minh quá hạn', 'Chữ g11-041 + g8-070');
    eq(co[1].nut, 'Duyệt', 'Nút g3-020');
    const all = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 5]));
    assert(d.sapCanXuLy(all, true).length === d.CAN_XU_LY_TOI_DA && d.CAN_XU_LY_TOI_DA === 8, 'Tối đa 8 dòng');
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
    const thuong = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const ft = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
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
    const a = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const c = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    eq(chuongTrinh.tachTheoLop('hoc-vien', [a.sid, b.sid, c.sid]), 'MB-FOU 12 (2) · MB-FT 101 (1)', 'Hai lớp');
    eq(chuongTrinh.tachTheoLop('hoc-vien', [a.sid, b.sid, c.sid], 1), 'MB-FOU 12 (2) · +1 lớp', 'Quá toiDa thì "+k lớp"');
    eq(chuongTrinh.tachTheoLop('hoc-vien', [c.sid]), 'MB-FT 101', 'Một em');
    eq(chuongTrinh.tachTheoLop('hoc-vien', []), '', 'Rỗng');
    const m = chuongTrinh.lopCuaTap('hoc-vien', [a.sid, c.sid]);
    eq([m.get(a.sid).isFt, m.get(c.sid).isFt], [false, true], 'isFt theo lớp đang học');
  });
}
