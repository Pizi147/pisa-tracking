/**
 * PHÉP KIỂM PR-YT2 · Task 1: luật thuần `shared/domain/yThucGon.ts` — đếm lần sửa, nhãn lịch sử, cảnh báo trùng, chia
 * thêm vi phạm, patch PA chỉ gửi phần đổi, khoảng ngày, bộ lọc phụ, chu kỳ hiện tại, khoá nhóm×trạng thái.
 * Task 2: máy chủ — sửa PA một lần (`PATCH /measures/:id` + `violationIds`), vi phạm của lớp (`GET /classes/:id/violations`),
 * chặn xoá vi phạm cuối cùng của PA đang chuẩn bị (Q15), chu kỳ hiện tại (`chuKy`), `listMeasures` theo lô (Q10).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-yt2-y-thuc-gon.md (Task 1–2, bảng Q1–Q19).
 *
 * Harness do `run.ts` sở hữu và truyền vào.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runYThucGonTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY, addDays, classId } = t;
  const domain: any = await import('../../../shared/domain/index.ts');

  console.log('\nPR-YT2 · 1. Luật thuần (shared/domain/yThucGon.ts)');

  check('PR-YT2 · demLanSua: hai lần sửa, lần đầu đổi 2 trường → 2; dòng measure không tính', () => {
    const history = [
      { id: 1, field: 'description', oldValue: 'a', newValue: 'b', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-01T00:00:00Z' },
      { id: 2, field: 'category', oldValue: 'homework', newValue: 'attendance', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-01T00:00:00Z' },
      { id: 3, field: 'measure', oldValue: null, newValue: '5', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-02T00:00:00Z' },
      { id: 4, field: 'skill', oldValue: null, newValue: 'writing', actorUserId: 7, actorName: 'GV2', createdAt: '2026-09-03T00:00:00Z' },
    ];
    assert(domain.demLanSua(history) === 2, `phải 2, được ${domain.demLanSua(history)}`);
  });

  check('PR-YT2 · nhanLichSuViPham: nhãn nhóm/môn/ngày', () => {
    const category = domain.nhanLichSuViPham({ id: 1, field: 'category', oldValue: 'homework', newValue: 'attendance', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(category.truong === 'Nhóm' && category.cu === 'BTVN' && category.moi === 'Chuyên cần', `category: ${JSON.stringify(category)}`);

    const skill = domain.nhanLichSuViPham({ id: 2, field: 'skill', oldValue: null, newValue: 'writing1', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(skill.truong === 'Môn' && skill.cu === '—' && skill.moi === 'Writing Task 1', `skill: ${JSON.stringify(skill)}`);

    const ngayRow = domain.nhanLichSuViPham(
      { id: 3, field: 'occurred_on', oldValue: '2026-09-01', newValue: '2026-09-05', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' },
      '2026-09-23',
    );
    assert(ngayRow.truong === 'Ngày xảy ra' && ngayRow.cu === '01/09' && ngayRow.moi === '05/09', `ngay: ${JSON.stringify(ngayRow)}`);
    const ngayKhongHomNay = domain.nhanLichSuViPham({ id: 3, field: 'occurred_on', oldValue: '2026-09-01', newValue: '2026-09-05', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(ngayKhongHomNay.moi === '05/09/2026', `không homNay → đầy đủ: ${JSON.stringify(ngayKhongHomNay)}`);
  });

  check('PR-YT2 · nhanLichSuViPham: dòng measure gắn/bỏ khỏi phương án', () => {
    const gan = domain.nhanLichSuViPham({ id: 4, field: 'measure', oldValue: null, newValue: '9', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(gan.truong === '' && gan.moi === 'Gắn vào phương án', `gan: ${JSON.stringify(gan)}`);

    const bo = domain.nhanLichSuViPham({ id: 5, field: 'measure', oldValue: '9', newValue: null, actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(bo.truong === '' && bo.moi === 'Bỏ khỏi phương án', `bo: ${JSON.stringify(bo)}`);
  });

  check('PR-YT2 · cauCanhBaoTrung: 1 dòng và 2 dòng, chưa xử lý và có dòng đã xử lý', () => {
    const mot = domain.cauCanhBaoTrung([{ category: 'homework', occurredOn: '2026-09-05', state: 'unhandled' }], '2026-09-23');
    assert(mot === 'Đã có 1 vi phạm BTVN ngày 05/09 chưa xử lý', `1 dòng: ${mot}`);

    const hai = domain.cauCanhBaoTrung([
      { category: 'homework', occurredOn: '2026-09-05', state: 'unhandled' },
      { category: 'homework', occurredOn: '2026-09-05', state: 'preparing' },
    ], '2026-09-23');
    assert(hai === 'Đã có 2 vi phạm BTVN ngày 05/09', `2 dòng có xử lý: ${hai}`);

    assert(domain.cauCanhBaoTrung([]) === null, 'rỗng → null');
  });

  check('PR-YT2 · chiaThemViPham: chỉ vi phạm ngoài tập đang chọn, chia chưa/đã xử lý, mới nhất trước', () => {
    const tatCa = [
      { id: 1, state: 'unhandled', occurredOn: '2026-09-01' },
      { id: 2, state: 'unhandled', occurredOn: '2026-09-03' },
      { id: 3, state: 'preparing', occurredOn: '2026-09-02' },
      { id: 4, state: 'handled', occurredOn: '2026-09-04' },
    ];
    const { chuaXuLy, daXuLy } = domain.chiaThemViPham(tatCa, new Set([3]));
    assert(chuaXuLy.map((v: any) => v.id).join(',') === '2,1', `chuaXuLy mới nhất trước: ${chuaXuLy.map((v: any) => v.id)}`);
    assert(daXuLy.map((v: any) => v.id).join(',') === '4', `daXuLy không gồm #3 (đang chọn): ${daXuLy.map((v: any) => v.id)}`);
  });

  check('PR-YT2 · thanPatchPhuongAn: không đổi → null; đảo thứ tự tập → null; thêm một vi phạm → chỉ violationIds', () => {
    const goc = { kind: 'talk_short', customName: null, note: 'ghi chú', ownerUserId: 9, violationIds: [1, 2, 3] };
    assert(domain.thanPatchPhuongAn(goc, { kind: 'talk_short', note: 'ghi chú', violationIds: [1, 2, 3] }) === null, 'không đổi → null');
    assert(domain.thanPatchPhuongAn(goc, { violationIds: [3, 1, 2] }) === null, 'đảo thứ tự tập → null');
    const themMoi = domain.thanPatchPhuongAn(goc, { violationIds: [1, 2, 3, 4] });
    assert(JSON.stringify(themMoi) === JSON.stringify({ violationIds: [1, 2, 3, 4] }), `chỉ violationIds: ${JSON.stringify(themMoi)}`);
    const doiLoai = domain.thanPatchPhuongAn(goc, { kind: 'warning_1' });
    assert(JSON.stringify(doiLoai) === JSON.stringify({ kind: 'warning_1' }), `chỉ kind: ${JSON.stringify(doiLoai)}`);
  });

  check("PR-YT2 · tuNgayTheoKhoang('2026-09-23','30') = '2026-08-24'; '7' và 'all'", () => {
    assert(domain.tuNgayTheoKhoang('2026-09-23', '30') === '2026-08-24', domain.tuNgayTheoKhoang('2026-09-23', '30'));
    assert(domain.tuNgayTheoKhoang('2026-09-23', '7') === '2026-09-16', domain.tuNgayTheoKhoang('2026-09-23', '7'));
    assert(domain.tuNgayTheoKhoang('2026-09-23', 'all') === null, 'all → null');
  });

  check('PR-YT2 · hopBoLocPhu: ba bộ lọc (bỏ tat-ca) trên dòng học viên', () => {
    const hv = { coChuaXuLy: true, coPaDangChuanBi: false, canhBao: false };
    assert(domain.hopBoLocPhu('tat-ca', hv) === true, 'tat-ca HV');
    assert(domain.hopBoLocPhu('chua-xu-ly', hv) === true, 'chua-xu-ly HV true');
    assert(domain.hopBoLocPhu('co-pa-dang-chuan-bi', hv) === false, 'co-pa-dang-chuan-bi HV false');
    assert(domain.hopBoLocPhu('qua-5-ngay', hv) === false, 'qua-5-ngay HV false');
  });

  check('PR-YT2 · hopBoLocPhu: ba bộ lọc (bỏ tat-ca) trên dòng vi phạm', () => {
    const vp = { state: 'preparing', ageLabel: '' };
    assert(domain.hopBoLocPhu('tat-ca', vp) === true, 'tat-ca vp');
    assert(domain.hopBoLocPhu('chua-xu-ly', vp) === false, 'chua-xu-ly vp false');
    assert(domain.hopBoLocPhu('co-pa-dang-chuan-bi', vp) === true, 'co-pa-dang-chuan-bi vp true');
    assert(domain.hopBoLocPhu('qua-5-ngay', vp) === false, 'qua-5-ngay vp false (ageLabel rỗng)');
    assert(domain.hopBoLocPhu('qua-5-ngay', { state: 'unhandled', ageLabel: '⚠9n' }) === true, 'qua-5-ngay vp true khi có ageLabel');
  });

  check('PR-YT2 · trongChuKyHienTai: FT so cycleId, lớp thường so classId', () => {
    assert(domain.trongChuKyHienTai({ cycleId: 5, classId: 10 }, { cycleId: 5, classId: 11 }) === true, 'FT cùng cycleId → true dù classId khác');
    assert(domain.trongChuKyHienTai({ cycleId: 6, classId: 10 }, { cycleId: 5, classId: 10 }) === false, 'FT khác cycleId → false');
    assert(domain.trongChuKyHienTai({ cycleId: null, classId: 20 }, { cycleId: null, classId: 20 }) === true, 'lớp thường cùng classId → true');
    assert(domain.trongChuKyHienTai({ cycleId: null, classId: 21 }, { cycleId: null, classId: 20 }) === false, 'lớp thường khác classId → false');
  });

  check('PR-YT2 · NHOM_TRANG_THAI_KHOA đủ 24 khoá, không trùng', () => {
    assert(domain.NHOM_TRANG_THAI_KHOA.length === 24, `phải 24, được ${domain.NHOM_TRANG_THAI_KHOA.length}`);
    assert(new Set(domain.NHOM_TRANG_THAI_KHOA).size === 24, 'không trùng khoá');
    assert(domain.khoaNhomTrangThai('homework', 'unhandled') === 'homework:unhandled', domain.khoaNhomTrangThai('homework', 'unhandled'));
    assert(domain.NHOM_TRANG_THAI_KHOA.includes('tat-ca:tat-ca'), 'có khoá tat-ca:tat-ca');
  });

  // ==================================================================== 2. Máy chủ: sửa PA một lần, vi phạm của lớp,
  //                                                                          chặn xoá, chu kỳ, listMeasures theo lô

  console.log('\nPR-YT2 · 2. Máy chủ Ý thức (PATCH /measures/:id, GET /classes/:id/violations, Q15, chuKy, listMeasures theo lô)');

  const violSvc = await import('../yThuc/violations.ts');
  const measSvc = await import('../yThuc/measures.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');

  const gvcn = P.coreTeacher; // chủ nhiệm MB-FT 101
  const CLASS = t.classId('MB-FT 101');
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const outsider = loadPrincipal((conn.prepare(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active')
      ORDER BY ur.user_id LIMIT 1`).get(CLASS) as any).id);

  let seq = 0;
  /** Học viên mới, riêng cho từng phép kiểm — `ft = false` dựng lớp thường (route null, y hệt intake.ts thật). */
  function taoHocVien(classCode: string, ft: boolean): { sid: number; cid: number } {
    seq += 1;
    const tag = `YT2-${seq}`;
    const cid = t.classId(classCode);
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `HV ${tag}`, `hv ${tag.toLowerCase()}`, mbBranch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, now);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
    ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', now);
    return { sid, cid };
  }
  const ghi = (studentId: number, description: string, occurredOn?: string, category = 'homework') =>
    (violSvc.recordViolation(gvcn, { studentId, category, description, occurredOn: occurredOn ?? null }) as any).violation.id as number;
  const countAudit = (action: string, entityId: number) =>
    (conn.prepare('SELECT COUNT(*) n FROM audit_logs WHERE action = ? AND entity_id = ?').get(action, entityId) as any).n as number;

  const server = createApp().listen(0);
  const port = (server.address() as any).port as number;
  const call = async (who: { userId: number } | null, method: string, url: string, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (who) headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không có thân */ }
    return { status: res.status, json };
  };

  await checkAsync('PR-YT2 · Q1/Q2 PATCH /measures/:id violationIds: thêm 1 + bỏ 1 một lần → measure_violations đúng, hai dòng lịch sử measure, một audit', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const v1 = ghi(s.sid, 'Không nộp bài Writing Task 2 — dùng để kiểm PATCH violationIds');
    const v2 = ghi(s.sid, 'Nói chuyện riêng nhiều lần trong giờ — dùng để kiểm PATCH violationIds', undefined, 'conduct');
    const v3 = ghi(s.sid, 'Đi muộn không lý do — dùng để kiểm PATCH violationIds', undefined, 'attendance');
    const m = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [v1, v2] }) as any;
    const auditBefore = countAudit('measure.edit', m.id);
    const histIdBefore = ((conn.prepare(`SELECT COALESCE(MAX(id), 0) n FROM violation_history`).get() as any).n as number);
    const res = await call(gvcn, 'PATCH', `/measures/${m.id}`, { violationIds: [v2, v3] });
    assert(res.status === 200, `PATCH phải 200, được ${res.status}: ${JSON.stringify(res.json)}`);
    const linked = (conn.prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(m.id) as any[]).map((r) => r.violation_id);
    assert(JSON.stringify(linked) === JSON.stringify([v2, v3].sort((a, b) => a - b)), `phải còn đúng v2,v3: ${JSON.stringify(linked)}`);
    /* Chỉ đếm dòng lịch sử MỚI (id lớn hơn mốc trước PATCH) — trước đó v1 đã có một dòng "gắn vào" khi tạo PA. */
    const newHist = conn.prepare(`SELECT violation_id, old_value, new_value FROM violation_history WHERE field = 'measure' AND id > ? ORDER BY id`).all(histIdBefore) as any[];
    assert(newHist.length === 2, `phải đúng hai dòng lịch sử mới từ PATCH này: ${JSON.stringify(newHist)}`);
    assert(newHist.some((r) => r.violation_id === v1 && r.old_value === String(m.id) && r.new_value === null), `phải có dòng bỏ v1: ${JSON.stringify(newHist)}`);
    assert(newHist.some((r) => r.violation_id === v3 && r.old_value === null && r.new_value === String(m.id)), `phải có dòng thêm v3: ${JSON.stringify(newHist)}`);
    assert(countAudit('measure.edit', m.id) === auditBefore + 1, 'phải đúng một audit cho một lần PATCH');
  });

  await checkAsync('PR-YT2 · PATCH /measures/:id violationIds: [] → 400', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const v = ghi(s.sid, 'Vi phạm dùng để tạo PA rồi thử PATCH violationIds rỗng');
    const m = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [v] }) as any;
    const res = await call(gvcn, 'PATCH', `/measures/${m.id}`, { violationIds: [] });
    assert(res.status === 400, `violationIds rỗng phải 400, được ${res.status}`);
  });

  await checkAsync('PR-YT2 · PATCH /measures/:id violationIds có vi phạm của học viên khác → 400', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const v = ghi(s.sid, 'Vi phạm dùng để tạo PA rồi thử trộn vi phạm của học viên khác');
    const m = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [v] }) as any;
    const other = taoHocVien('MB-FT 101', true);
    const vOther = ghi(other.sid, 'Vi phạm của học viên khác — dùng để kiểm 400 khi trộn học viên');
    const res = await call(gvcn, 'PATCH', `/measures/${m.id}`, { violationIds: [vOther] });
    assert(res.status === 400, `trộn vi phạm khác học viên phải 400, được ${res.status}`);
  });

  await checkAsync('PR-YT2 · PATCH violationIds trên PA đã thực hiện → 400 (khoá như requirePreparing)', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const v = ghi(s.sid, 'Vi phạm dùng để kiểm PA đã thực hiện khoá violationIds');
    const m = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [v] }) as any;
    measSvc.confirmMeasure(gvcn, m.id, { performedOn: TODAY, performedBy: gvcn.userId, note: 'Đã trao đổi với em' });
    const res = await call(gvcn, 'PATCH', `/measures/${m.id}`, { violationIds: [v] });
    assert(res.status === 400, `PA đã thực hiện + violationIds phải 400, được ${res.status}: ${JSON.stringify(res.json)}`);
  });

  await checkAsync('PR-YT2 · gắn vi phạm đang ở PA đã thực hiện vào PA đang chuẩn bị → được (§3.11: checkViolationSet không lọc trạng thái)', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const va = ghi(s.sid, 'Vi phạm sẽ ở PA đang chuẩn bị');
    const vb = ghi(s.sid, 'Vi phạm sẽ ở PA đã thực hiện, sau đó gắn thêm vào PA đang chuẩn bị');
    const done = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [vb] }) as any;
    measSvc.confirmMeasure(gvcn, done.id, { performedOn: TODAY, performedBy: gvcn.userId, note: 'Đã trao đổi' });
    const prep = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'meeting_student', violationIds: [va] }) as any;
    const res = await call(gvcn, 'PATCH', `/measures/${prep.id}`, { violationIds: [va, vb] });
    assert(res.status === 200, `phải gắn được: ${JSON.stringify(res.json)}`);
    const linked = (conn.prepare('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ? AND violation_id = ?').get(prep.id, vb) as any).n;
    assert(linked === 1, 'vb phải nằm trong cả hai PA');
  });

  await checkAsync('PR-YT2 · HTTP GET /students/:id/measure-kinds?excludeMeasureId: không truyền → Thư cảnh cáo 1 khoá; có truyền id của chính PA đó → mở', async () => {
    const s = taoHocVien('MB-FT 101', true);
    const v = ghi(s.sid, 'Vi phạm dùng để tạo Thư cảnh cáo lần 1 (kiểm excludeMeasureId)');
    const w1 = measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'warning_1', violationIds: [v] }) as any;
    const noExclude = await call(gvcn, 'GET', `/students/${s.sid}/measure-kinds`);
    const rowNo = (noExclude.json?.rows as any[]).find((r) => r.kind === 'warning_1');
    assert(rowNo && rowNo.available === false, `không exclude phải khoá: ${JSON.stringify(rowNo)}`);
    const withExclude = await call(gvcn, 'GET', `/students/${s.sid}/measure-kinds?excludeMeasureId=${w1.id}`);
    const rowYes = (withExclude.json?.rows as any[]).find((r) => r.kind === 'warning_1');
    assert(rowYes && rowYes.available === true, `exclude chính PA đó phải mở: ${JSON.stringify(rowYes)}`);
  });

  await checkAsync('PR-YT2 · HTTP GET /classes/:id/violations: đủ ba trạng thái, from lọc đúng, GV không dạy lớp → 403, HV đã rời lớp không có', async () => {
    const sA = taoHocVien('MB-FT 101', true);
    const sB = taoHocVien('MB-FT 101', true);
    const sLeft = taoHocVien('MB-FT 101', true);
    const oldOn = addDays(TODAY, -10);
    const newOn = addDays(TODAY, -1);

    const vUnhandled = ghi(sA.sid, 'Chưa xử lý — dùng để kiểm GET /classes/:id/violations', newOn);
    const vPrep = ghi(sB.sid, 'Sẽ gắn vào PA đang chuẩn bị — dùng để kiểm trạng thái preparing', oldOn, 'conduct');
    measSvc.createMeasure(gvcn, { studentId: sB.sid, kind: 'talk_short', violationIds: [vPrep] });
    const vDone = ghi(sA.sid, 'Sẽ gắn vào PA đã thực hiện — dùng để kiểm trạng thái handled', oldOn, 'attendance');
    const mDone = measSvc.createMeasure(gvcn, { studentId: sA.sid, kind: 'talk_short', violationIds: [vDone] }) as any;
    measSvc.confirmMeasure(gvcn, mDone.id, { performedOn: TODAY, performedBy: gvcn.userId, note: 'Đã nhắc nhở em' });
    const vLeft = ghi(sLeft.sid, 'Học viên này sẽ rời lớp — không được xuất hiện trong bảng', newOn);
    conn.prepare(`UPDATE enrollments SET status = 'withdrawn', ended_at = ? WHERE student_id = ? AND class_id = ?`).run(TODAY, sLeft.sid, CLASS);

    const all = await call(gvcn, 'GET', `/classes/${CLASS}/violations`);
    assert(all.status === 200, `phải 200, được ${all.status}`);
    const rows = (all.json?.rows as any[]) ?? [];
    const ids = rows.map((r) => r.id);
    assert(ids.includes(vUnhandled) && ids.includes(vPrep) && ids.includes(vDone), `phải đủ ba vi phạm: ${JSON.stringify(ids)}`);
    assert(!ids.includes(vLeft), 'học viên đã rời lớp không được xuất hiện');
    const states = new Set(rows.filter((r) => [vUnhandled, vPrep, vDone].includes(r.id)).map((r) => r.state));
    assert(states.has('unhandled') && states.has('preparing') && states.has('handled'), `phải đủ ba trạng thái: ${[...states].join(',')}`);

    const fromNew = await call(gvcn, 'GET', `/classes/${CLASS}/violations?from=${addDays(TODAY, -5)}`);
    const idsFrom = ((fromNew.json?.rows as any[]) ?? []).map((r) => r.id);
    assert(idsFrom.includes(vUnhandled) && !idsFrom.includes(vPrep) && !idsFrom.includes(vDone), `from phải lọc đúng: ${JSON.stringify(idsFrom)}`);

    const forbidden = await call(outsider, 'GET', `/classes/${CLASS}/violations`);
    assert(forbidden.status === 403, `GV không dạy lớp phải 403, được ${forbidden.status}`);
  });

  await checkAsync('PR-YT2 · Q14 GET /students/:id/violations trả chuKy: FT có cycleId, lớp thường cycleId null (so classId)', async () => {
    const ft = taoHocVien('MB-FT 101', true);
    const normal = taoHocVien('MB-FOU 12', false);
    const ftRes = await call(gvcn, 'GET', `/students/${ft.sid}/violations`);
    assert(ftRes.status === 200 && ftRes.json?.chuKy?.cycleId !== null, `FT phải có cycleId: ${JSON.stringify(ftRes.json?.chuKy)}`);
    const normalRes = await call(P.normalCoreTeacher, 'GET', `/students/${normal.sid}/violations`);
    assert(normalRes.status === 200 && normalRes.json?.chuKy?.cycleId === null && normalRes.json?.chuKy?.classId === normal.cid,
      `lớp thường phải cycleId null, classId đúng: ${JSON.stringify(normalRes.json?.chuKy)}`);
  });

  await checkAsync('PR-YT2 · Q15 xoá vi phạm DUY NHẤT của PA đang chuẩn bị → 400, dữ liệu không đổi; PA đã thực hiện vẫn xoá được (V14′)', async () => {
    const s9 = taoHocVien('MB-FT 101', true);
    const v9 = ghi(s9.sid, 'Vi phạm duy nhất của PA đang chuẩn bị — dùng để kiểm chặn xoá Q15 qua HTTP');
    const m9 = measSvc.createMeasure(gvcn, { studentId: s9.sid, kind: 'talk_short', violationIds: [v9] }) as any;
    const del9 = await call(gvcn, 'DELETE', `/violations/${v9}`);
    assert(del9.status === 400 && /vi phạm duy nhất/.test(String(del9.json?.error ?? '')), `phải 400 câu Q15: ${JSON.stringify(del9.json)}`);
    const linkCount = (conn.prepare('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?').get(m9.id) as any).n;
    assert(linkCount === 1, 'dữ liệu không đổi sau khi bị chặn');

    const s10 = taoHocVien('MB-FT 101', true);
    const v10 = ghi(s10.sid, 'Vi phạm duy nhất của PA đã thực hiện — dùng để kiểm V14′ qua HTTP');
    const m10 = measSvc.createMeasure(gvcn, { studentId: s10.sid, kind: 'talk_short', violationIds: [v10] }) as any;
    measSvc.confirmMeasure(gvcn, m10.id, { performedOn: TODAY, performedBy: gvcn.userId, note: 'Đã trao đổi' });
    const del10 = await call(gvcn, 'DELETE', `/violations/${v10}`);
    assert(del10.status === 200, `PA đã thực hiện phải xoá được: ${JSON.stringify(del10.json)}`);
    const detail10 = measSvc.measureDetail(gvcn, m10.id) as any;
    assert(detail10.status === 'done' && detail10.violationCount === 0, `PA đã thực hiện còn 0 vi phạm: ${JSON.stringify(detail10)}`);
  });

  check('PR-YT2 · Q10 listMeasures({classId}) JSON từng phần tử bằng hệt gọi measureDetail lẻ', () => {
    const s = taoHocVien('MB-FT 101', true);
    const v1 = ghi(s.sid, 'Vi phạm 1 — dùng để kiểm listMeasures theo lô so với gọi lẻ');
    const v2 = ghi(s.sid, 'Vi phạm 2 — dùng để kiểm listMeasures theo lô so với gọi lẻ', undefined, 'conduct');
    measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'talk_short', violationIds: [v1] });
    measSvc.createMeasure(gvcn, { studentId: s.sid, kind: 'meeting_student', violationIds: [v2] });
    const listed = measSvc.listMeasures(gvcn, { classId: CLASS }).rows as any[];
    assert(listed.length > 0, 'phải có ít nhất một PA để so sánh');
    for (const row of listed) {
      const single = measSvc.measureDetail(gvcn, row.id);
      assert(JSON.stringify(row) === JSON.stringify(single), `PA #${row.id} lệch giữa listMeasures (theo lô) và measureDetail (gọi lẻ)`);
    }
  });

  // ==================================================================== 3. Phân tích Ý thức cho QL (P13, P14, Task 8)

  console.log('\nPR-YT2 · 3. Phân tích Ý thức cho QL — vi-pham-theo-nhom (P13), lọc theo lớp (P14, Q19)');

  const thongKeSvc = await import('../yThuc/thongKe.ts');
  const phoiHopSvc = await import('../yThuc/phoiHop.ts');
  const metricsSvc = await import('../worklist/metrics.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');

  check('PR-YT2 · vi-pham-theo-nhom: khoá tat-ca:tat-ca = đúng tập vi-pham-tong cùng bộ lọc', () => {
    const nhom = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch }) as any;
    const tong = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-tong', { branchId: mbBranch }) as any;
    assert(
      JSON.stringify([...nhom.byKind['tat-ca:tat-ca']].sort((a: number, b: number) => a - b)) === JSON.stringify([...tong.ids].sort((a: number, b: number) => a - b)),
      'tat-ca:tat-ca phải bằng vi-pham-tong',
    );
  });

  check('PR-YT2 · vi-pham-theo-nhom: mỗi nhóm × ba trạng thái rời nhau, hợp = {nhom}:tat-ca', () => {
    const nhom = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch }).byKind as any;
    for (const cat of domain.VIOLATION_CATEGORIES) {
      const u = new Set(nhom[`${cat}:unhandled`]), pr = new Set(nhom[`${cat}:preparing`]), don = new Set(nhom[`${cat}:done`]);
      for (const id of u) assert(!pr.has(id) && !don.has(id), `${cat}: unhandled phải rời preparing/done`);
      for (const id of pr) assert(!don.has(id), `${cat}: preparing phải rời done`);
      const hop = [...new Set([...u, ...pr, ...don])].sort((a: any, b: any) => a - b);
      assert(JSON.stringify(hop) === JSON.stringify([...nhom[`${cat}:tat-ca`]].sort((a: number, b: number) => a - b)), `hợp ba trạng thái phải bằng ${cat}:tat-ca`);
    }
  });

  check('PR-YT2 · vi-pham-theo-nhom: kind lọc xuống đúng một khoá; khoá lạ → 400', () => {
    const full = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch }).byKind as any;
    const filtered = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch, kind: 'homework:unhandled' }) as any;
    assert(JSON.stringify([...filtered.ids].sort((a: number, b: number) => a - b)) === JSON.stringify([...full['homework:unhandled']].sort((a: number, b: number) => a - b)),
      'kind phải lọc đúng tập con');
    assert(Object.keys(filtered.byKind).length === 1, 'byKind chỉ còn một khoá');
    assertThrows(() => thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch, kind: 'khoa-la' }),
      /không hợp lệ/, 'khoá lạ phải 400');
  });

  check('PR-YT2 · vi-pham-theo-nhom: GVCN không có quyền thống kê chi nhánh → rỗng có nhãn (như chỉ số Ý thức khác)', () => {
    const r = thongKeSvc.yThucMetric(gvcn, 'vi-pham-theo-nhom', {}) as any;
    assert(r.none === true && r.ids.length === 0, `GVCN phải rỗng có nhãn: ${JSON.stringify(r)}`);
  });

  check('PR-YT2 · Q19 classId ngoài chi nhánh của Quản lý → 403', () => {
    const cpClass = classId('CP-FT 110');
    assertThrows(() => thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { classId: cpClass }), /phạm vi/, 'lớp ngoài chi nhánh phải 403');
    assertThrows(() => phoiHopSvc.phoiHopMetric(P.mbManager, 'phoi-hop-luot-sos', { classId: cpClass }), /phạm vi/, 'lớp ngoài chi nhánh phải 403 (Phối hợp)');
  });

  check('PR-YT2 · Q19 classId: vi-pham-tong chỉ còn vi phạm GHI ở lớp đó; vi-pham-chua-xu-ly chỉ còn HV ĐANG HỌC lớp đó', () => {
    const CLASS = classId('MB-FT 101');
    const tong = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-tong', { classId: CLASS }) as any;
    for (const id of tong.ids) {
      const row = conn.prepare('SELECT class_id FROM violations WHERE id = ?').get(id) as any;
      assert(row.class_id === CLASS, `vi phạm #${id} phải ghi ở đúng lớp ${CLASS}, được ${row.class_id}`);
    }
    const cxl = thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-chua-xu-ly', { classId: CLASS }) as any;
    for (const id of cxl.ids) {
      const row = conn.prepare('SELECT student_id FROM violations WHERE id = ?').get(id) as any;
      const active = conn.prepare(`SELECT 1 n FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(row.student_id, CLASS);
      assert(!!active, `vi phạm #${id} phải của HV đang học đúng lớp ${CLASS}`);
    }
  });

  check('PR-YT2 · Q19 phoi-hop-luot-sos + classId: chỉ còn lượt của lớp, byKind vẫn cộng đúng tổng', () => {
    const CLASS = classId('MB-FT 101');
    const r = phoiHopSvc.phoiHopMetric(P.mbManager, 'phoi-hop-luot-sos', { classId: CLASS }) as any;
    for (const id of r.ids) {
      const row = conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(id) as any;
      assert(row.class_id === CLASS, `lượt #${id} phải thuộc lớp ${CLASS}`);
    }
    const tongByKind = (r.byKind.sos1?.length ?? 0) + (r.byKind.sos2?.length ?? 0) + (r.byKind.sos3?.length ?? 0);
    assert(tongByKind === r.ids.length, `byKind phải cộng đúng tổng: ${tongByKind} != ${r.ids.length}`);
  });

  check('PR-YT2 · Q19 chỉ số học thuật (case-mo) + classId → 400', () => {
    assertThrows(() => metricsSvc.metricSet(P.mbManager, 'case-mo', { classId: classId('MB-FT 101') }),
      /chưa lọc theo lớp/, 'case-mo + classId phải 400');
  });

  check('PR-YT2 · Q18 bien-phap-dang-chuan-bi byKind cộng đúng ids', () => {
    const r = thongKeSvc.yThucMetric(P.mbManager, 'bien-phap-dang-chuan-bi', { branchId: mbBranch }) as any;
    const hopByKind = [...new Set(Object.values(r.byKind).flat() as number[])].sort((a, b) => a - b);
    assert(JSON.stringify(hopByKind) === JSON.stringify([...r.ids].sort((a: number, b: number) => a - b)), 'byKind hợp lại phải đúng ids');
  });

  check('PR-YT2 · vi-pham-theo-nhom không tăng số câu SQL theo số vi phạm (bộ đếm PR-TD)', () => {
    const before1 = soCauSql();
    thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch });
    const d1 = soCauSql() - before1;
    const s = taoHocVien('MB-FT 101', true);
    for (let i = 0; i < 20; i += 1) ghi(s.sid, `Vi phạm thêm #${i} để kiểm không N+1 cho vi-pham-theo-nhom`);
    const before2 = soCauSql();
    thongKeSvc.yThucMetric(P.mbManager, 'vi-pham-theo-nhom', { branchId: mbBranch });
    const d2 = soCauSql() - before2;
    assert(d2 <= d1 + 1, `số câu SQL không được tăng theo số vi phạm: trước ${d1}, sau khi thêm 20 vi phạm ${d2}`);
  });

  // ==================================================================== 4. Hồ sơ HV — K2-6e (Q16), Task 7

  console.log('\nPR-YT2 · 4. K2-6e (Q16): profile.ts dùng activeClassOf làm MỘT nguồn "lớp đang học"');

  const intake = await import('../classes/intake.ts');
  const profileSvc = await import('../students/profile.ts');
  const accessSvc = await import('../yThuc/access.ts');

  /**
   * Dựng một học viên có HAI ghi danh active mà thứ tự `started_at` NGƯỢC thứ tự `id`: lớp A ghi danh TRƯỚC (id thấp
   * hơn) nhưng `started_at` MUỘN hơn; lớp B ghi danh SAU (id cao hơn) nhưng `started_at` SỚM hơn. `profile.ts` (xếp
   * `started_at DESC`) ra lớp A; `activeClassOf` (xếp `id DESC`) ra lớp B — đúng tình huống K2-6e/Q16 mô tả.
   */
  function taoHVHaiGhiDanhLech(tag: string): { sid: number; classA: number; classB: number; teacherA: number; teacherB: number } {
    /* Hai tài khoản giáo viên THẬT đã có sẵn trong bộ demo (dùng khắp các phép kiểm khác) — tránh dò user_id bằng tay. */
    const teacherA = P.coreTeacher.userId;
    const teacherB = P.w1Teacher.userId;
    const now = new Date().toISOString();
    const classA = (intake.createClass(P.admin, { code: `MB-FT ${tag}A`, branchId: mbBranch, kind: 'FT', isFastTrack: true, startDate: '2026-08-03' }) as any).id as number;
    const classB = (intake.createClass(P.admin, { code: `MB-FT ${tag}B`, branchId: mbBranch, kind: 'FT', isFastTrack: true, startDate: '2026-08-03' }) as any).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, NULL, 1, 'active', '2026-01-01', ?)`).run(classA, teacherA, now);
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, NULL, 1, 'active', '2026-01-01', ?)`).run(classB, teacherB, now);
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `HV ${tag}`, `hv ${tag.toLowerCase()}`, mbBranch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-06-01', ?)`).run(sid, classA, now);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-01-01', ?)`).run(sid, classB, now);
    return { sid, classA, classB, teacherA, teacherB };
  }

  /*
   * `studentProfile` còn gọi `skillSupportBoard` bên trong, và hàm đó TỰ kiểm `ATTEMPT_VIEW` theo đúng công thức
   * `id DESC` (activeClassOf) — có TRƯỚC K2-6e. Nên GV chỉ dạy lớp A (current cũ, started_at) không những
   * `canRecordViolation`/`canReport` sai mà còn bị `studentProfile` từ chối thẳng — đúng ý "một nguồn lớp đang học"
   * cho CẢ hồ sơ, không riêng hai cờ đó. GV dạy lớp B (activeClassOf) xem được và có đủ hai quyền.
   */
  check('PR-YT2 · K2-6e (Q16): viewer.canRecordViolation theo đúng lớp của activeClassOf; GV chỉ dạy lớp current (started_at) cũ bị từ chối cả hồ sơ', () => {
    const s = taoHVHaiGhiDanhLech('K16RV');
    assert(accessSvc.activeClassOf(s.sid) === s.classB, `activeClassOf phải ra lớp ghi danh SAU (id cao hơn): ${accessSvc.activeClassOf(s.sid)}`);
    const profB = profileSvc.studentProfile(loadPrincipal(s.teacherB), s.sid) as any;
    assert(profB.viewer.canRecordViolation === true, `GV dạy lớp B (đúng lớp đang học thật theo activeClassOf) phải true: ${JSON.stringify(profB.viewer)}`);
    assertThrows(() => profileSvc.studentProfile(loadPrincipal(s.teacherA), s.sid), /quyền|phạm vi/,
      'GV chỉ dạy lớp A (không phải lớp đang học thật) phải bị từ chối xem hồ sơ');
  });

  check('PR-YT2 · K2-6e (Q16): viewer.canReport cùng luật activeClassOf như canRecordViolation', () => {
    const s = taoHVHaiGhiDanhLech('K16CR');
    const profB = profileSvc.studentProfile(loadPrincipal(s.teacherB), s.sid) as any;
    assert(profB.viewer.canReport === true, `GV dạy lớp B (đúng lớp đang học thật) phải canReport true: ${JSON.stringify(profB.viewer)}`);
    assertThrows(() => profileSvc.studentProfile(loadPrincipal(s.teacherA), s.sid), /quyền|phạm vi/,
      'GV chỉ dạy lớp A phải bị từ chối xem hồ sơ (cùng luật)');
  });
}
