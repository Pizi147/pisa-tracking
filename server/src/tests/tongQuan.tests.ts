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
  check('PR-Pa · Chương trình: đọc tham số ct; mặc định Fast Track (PR-Pb2-a); không có chữ "Normal" trên màn', () => {
    eq(d.chuongTrinhTuThamSo('thuong'), 'thuong', 'thuong');
    eq(d.chuongTrinhTuThamSo('ft'), 'ft', 'ft');
    eq(d.chuongTrinhTuThamSo(null), 'ft', 'vắng');
    eq(d.chuongTrinhTuThamSo('normal'), 'ft', 'giá trị lạ');
    eq(d.thamSoCt(null), '', 'khối gộp không gắn tham số');
    eq(d.thamSoCt('ft', '?'), '?ct=ft', 'ft');
    eq(d.CHUONG_TRINH_LABEL, { ft: 'Fast Track', thuong: 'Lớp thường' }, 'Nhãn');
  });

  check('PR-Pa · Gom nhóm việc GV: 10 loại việc về đúng 4 nhóm, nhóm có việc quá hạn tự mở, Ý thức không bao giờ tự mở', () => {
    /* PR-DUYET: `decide`, `decide_move` không còn là loại việc (thẻ ở hộp Chờ duyệt). */
    const cham = ['score'];
    const kase = ['cause', 'no_plan', 'ghi_ket_qua_pa', 'do_plan', 'no_owner', 'phoi_hop_sos'];   // PR-VAI-a: result → ghi_ket_qua_pa (V3), Phối hợp SOS thành việc
    const van = ['chot_len_ft', 'mgmt', 'missing_data'];   // PR-LCb: placement → chot_len_ft (Chốt lộ trình)
    for (const g of cham) eq(d.nhomViecCua(g), 'cham-diem', g);
    for (const g of kase) eq(d.nhomViecCua(g), 'case-hoc-thuat', g);
    for (const g of van) eq(d.nhomViecCua(g), 'van-hanh', g);
    eq(d.nhomViecCua('loai-la'), 'van-hanh', 'Loại lạ');
    const v = (group: string, urgency: string, due: string | null) => ({ group, urgency, due });
    const nhom = d.gomNhomViec([
      v('ghi_ket_qua_pa', 'normal', '2026-09-20'), v('cause', 'overdue', '2026-09-10'), v('score', 'normal', null), v('mgmt', 'today', '2026-09-14'),
      v('yt_xem', 'normal', '2026-09-18'), v('khai_bac', 'normal', null),
    ]);
    eq(nhom.map((g: any) => g.key), ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'], 'Thứ tự nhóm cố định');
    const kh = nhom.find((g: any) => g.key === 'case-hoc-thuat');
    eq([kh.n, kh.quaHan, kh.moSan], [2, 1, true], 'Case học thuật: 2 việc, 1 quá hạn, tự mở');
    eq(kh.items[0].group, 'cause', 'Việc quá hạn lên đầu nhóm');
    const yt = nhom.find((g: any) => g.key === 'y-thuc');
    eq([yt.n, yt.moSan], [2, false], 'Ý thức: PR-VAI-a — mọi số đếm từ items (không còn dòng nhắc mềm), không quá hạn thì không tự mở');
    eq(d.NHOM_VIEC_LABEL, { 'cham-diem': 'Chấm điểm', 'case-hoc-thuat': 'Case học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'van-hanh': 'Vận hành' }, 'T75: tên nhóm');
    eq(nhom.find((g: any) => g.key === 'cham-diem').moSan, false, 'Nhóm không quá hạn thì gập');
    eq(d.gomNhomViec([]), [], 'Không việc thì không nhóm');
    eq(d.LOAI_HAN_CUA_VIEC.cause, 'xac-minh-sos', 'Hạn xác nhận nguyên nhân');
    eq(d.nhomViecCua('verify'), 'van-hanh', 'PR-LT2a: nhóm "verify" đã bỏ — loại lạ về Vận hành');
    eq(d.LOAI_HAN_CUA_VIEC.score, 'nhap-diem', 'Hạn nhập điểm');
  });

  check('PR-Pa · Cần xử lý: bỏ dòng 0, tối đa 10; PR-DUYET bỏ "PA chờ duyệt" + "Case quá hạn xác định nguyên nhân" (thành thẻ); PR-VAI-a bỏ "2 lần Test", "Case thiếu PA", "Case chưa có người" → lớp thiếu GV môn', () => {
    const ma = d.CAN_XU_LY.map((x: any) => x.metricId);
    for (const bo of ['case-chua-co-nguoi-phu-trach', 'hv-can-ho-tro-2-lan-chua-case', 'case-thieu-pa', 'case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'hv-can-xu-ly']) {
      assert(!ma.includes(bo), `Cần xử lý không còn dòng ${bo}`);
    }
    assert(ma.includes('lop-thieu-gv-mon'), 'Có dòng lớp thiếu GV môn (K1-05)');
    assert(d.CAN_XU_LY.every((x: any) => !('denLoc' in x)), 'Không còn cơ chế denLoc');
    const dem = { 'pa-can-cap-nhat': 3, 'lop-thieu-gv-mon': 2, 'pa-cho-duyet': 1, 'case-thieu-pa': 4, 'case-xac-dinh-nguyen-nhan-qua-han': 5, 'hv-can-xu-ly': 6 };
    const co = d.sapCanXuLy(dem, true);
    eq(co.map((x: any) => x.metricId).sort(), ['lop-thieu-gv-mon', 'pa-can-cap-nhat'], 'Q3: việc QL tự quyết không lặp ở Cần xử lý; dòng 0 bị bỏ');
    eq(co.find((x: any) => x.metricId === 'lop-thieu-gv-mon').nhan, 'lớp thiếu GV môn', 'Chữ dòng lớp thiếu GV');
    const all = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 5]));
    assert(d.sapCanXuLy(all, true).length === d.CAN_XU_LY.length && d.CAN_XU_LY.length <= d.CAN_XU_LY_TOI_DA && d.CAN_XU_LY_TOI_DA === 10, 'Đủ dòng, trần 10');
  });

  check('PR-Pa · Điểm đáng chú ý: tối đa 3; dưới ngưỡng thì bỏ; lớp thường nói "chưa đạt"; link ghi đúng số dòng sẽ mở', () => {
    const mon = (nhanMon: string, skill: string, tu: number, mau: number) =>
      ({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu, mau, nhanMon });
    const ds = [
      mon('Listening', 'listening', 7, 20), mon('Reading', 'reading', 2, 4), mon('Writing', 'writing', 5, 10),
      { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 5, mau: 6 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from: '2026-08-15' }, tu: 12, mau: 20 },
    ];
    /* PR-MON (MH5): câu "môn dưới kỳ vọng" chỉ ở khung Fast Track — ba điểm đo trên ct=ft. */
    const r = d.chonDiemDangChuY(ds, 'ft');
    eq(r.length, 3, 'Ba điểm');
    eq(r[0].cau, 'Writing: 5/10 học viên dưới kỳ vọng', 'Môn tỷ lệ cao nhất, ≥ 3 em (Reading 2/4 dưới ngưỡng)');
    eq([r[0].lienKet, r[0].soDanhSach], ['xem 5 học viên', 5], 'Link môn');
    eq([r[1].cau, r[1].soDanhSach], ['5/6 PA học thuật đã kết thúc có cải thiện', 6], 'PA cải thiện — danh sách là mẫu số');
    eq(r[2].cau, '12/20 lần cập nhật PA đúng hạn (30 ngày qua)', 'Đúng hạn < 80%');
    assert(d.chonDiemDangChuY(ds, 'thuong').every((x: any) => x.loai !== 'mon-duoi-ky-vong'), 'thuong: không có câu môn của khung FT');
    const it = d.chonDiemDangChuY([
      mon('Listening', 'listening', 2, 20), { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 3, mau: 4 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', tu: 19, mau: 20 },
    ], 'ft');
    eq(it, [], 'Không ứng viên nào đủ điều kiện');
  });

  // ================================================================== 2. Nợ S1 (1)
  check('PR-Pa · Nợ S1 (PR-LT2a): Case Progress Test quá hạn xác nhận nguyên nhân vào chỉ số case-xac-dinh-nguyen-nhan-qua-han — chỉ lớp thường, đúng phạm vi; tín hiệu chờ xác minh đã bỏ khỏi mã', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = conn.prepare('SELECT id, status FROM sos_cases WHERE student_id = ?').get(hv.sid) as any;
    assert(c, 'Progress Test trượt phải tự tạo Case');
    const vaoTap = () => ids('case-xac-dinh-nguyen-nhan-qua-han').includes(c.id);
    assert(!vaoTap(), 'Case còn trong hạn 3 ngày thì chưa quá hạn');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(t.addDays(TODAY, -1), c.id);
    assert(vaoTap(), 'Case quá hạn xác nhận nguyên nhân phải vào chỉ số');
    const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
    for (const who of [P.admin, P.mbManager]) {
      for (const branchId of [null, mb]) {
        assert(metricsSvc.metricSet(who, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId }).ids.includes(c.id), `Vai ${who.userId}, cn ${branchId}: thiếu Case quá hạn`);
      }
    }
    assert(!metricsSvc.metricSet(P.cpManager, 'case-xac-dinh-nguyen-nhan-qua-han', {}).ids.includes(c.id), 'Quản lý chi nhánh khác không thấy');
    eq(chuongTrinh.locTheoChuongTrinh('case', [c.id], 'ft'), [], 'Case lớp thường không lọt vào Fast Track');
    for (const ten of ['listSignals', 'overdueNormalSignalIds', 'signalDetail', 'dismissSignal']) assert(!(ten in signals), `${ten} đã bỏ`);
    /* Dọn: đưa Case về hạn trong ngày để không lệch các phép kiểm sau. */
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(d.hanXacNhan(TODAY), c.id);
  });

  // ================================================================== 3. Lọc chương trình
  check('PR-Pa · Chương trình: cùng một chỉ số, Lớp thường chỉ có em lớp thường, Fast Track chỉ có em FT, cả hai tập nằm trong tập không lọc', () => {
    const thuong = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    const ft = taoHocVien({ classCode: 'MB FT 101', weekStart: '2026-09-07' });
    const cThuong = moCase(thuong.sid, 'listening');
    const cFt = moCase(ft.sid, 'reading');
    for (const [id, a, b] of [['hv-co-case-mo', thuong.sid, ft.sid], ['case-mo', cThuong.id, cFt.id]] as const) {
      const all = ids(id), t = ids(id, { program: 'thuong' }), f = ids(id, { program: 'ft' });
      assert(t.includes(a) && !t.includes(b), `${id}: Lớp thường sai`);
      assert(f.includes(b) && !f.includes(a), `${id}: Fast Track sai`);
      assert([...t, ...f].every((x) => all.includes(x)), `${id}: tập lọc lọt ngoài tập không lọc`);
      assert(!t.some((x) => f.includes(x)), `${id}: một phần tử ở cả hai chương trình`);
    }
    const r = metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { program: 'thuong' });
    const mau = (r.denominatorIds ?? []) as number[];
    assert(mau.length > 0, 'Mẫu số của hv-duoi-ky-vong-mon (Lớp thường) phải có em — nếu rỗng thì phép kiểm bên dưới vô nghĩa');
    eq(chuongTrinh.locTheoChuongTrinh('hoc-vien', mau, 'thuong'), mau, 'Mẫu số cũng phải được lọc theo chương trình');
    assert(r.n === r.ids.length && r.ids.every((x: number) => mau.includes(x)), 'n = độ dài tập; tập đếm ⊆ mẫu số');
    eq(chuongTrinh.locTheoChuongTrinh('case', ids('case-xac-dinh-nguyen-nhan-qua-han', { program: 'ft' }), 'thuong'), [], 'Chỉ số Case quá hạn theo Fast Track không lẫn Case lớp thường');
  });

  check('PR-Pa · Chương trình: /metrics nhận tham số ct; vắng ct (null) = không lọc (PR-Pb2-a)', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    const block = src.slice(src.indexOf("api.get('/metrics/:id'"), src.indexOf("api.get('/metrics/:id'") + 600);
    assert(/program:\s*ctTuyChon\(qStr\(req, 'ct'\)\)/.test(block), 'Route /metrics/:id chưa đọc ct');
    eq(ids('case-mo', { program: null }), ids('case-mo'), 'null = không lọc');
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

  check('PR-Pa · Chỉ số case-xac-dinh-nguyen-nhan-qua-han = Case chờ xác nhận nguyên nhân mà hạn xác nhận (PR-SOS: sos_cases.han_xac_nhan) đã qua', () => {
    const cho = ids('case-cho-xac-dinh-nguyen-nhan');
    const quaHan = cho.filter((id) => {
      const r = conn.prepare(`SELECT han_xac_nhan AS due FROM sos_cases WHERE id = ?`).get(id) as any;
      return r?.due && r.due < TODAY;
    }).sort((a, b) => a - b);
    eq(ids('case-xac-dinh-nguyen-nhan-qua-han'), quaHan, 'Lệch tập');
  });

  await checkAsync('PR-Pa · Chỉ số bai-qua-han-nhap-diem = BÀI (ô điểm, PR-UXF-a) quá hạn (cùng hàm scoreDebtCells của bảng chấm); GV chỉ thấy lớp mình', async () => {
    const debt: any = await import('../worklist/scoreDebt.ts');
    const want = [...new Set((debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue).map((x) => d.baiId(x.attemptId, x.skill)))]
      .sort((a: number, b: number) => a - b);
    eq(ids('bai-qua-han-nhap-diem'), want, 'Quản trị');
    const gv = metricsSvc.metricSet(P.lrTeacher, 'bai-qua-han-nhap-diem', {}).ids as number[];
    const lopGv = new Set((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`)
      .all(P.lrTeacher.userId) as any[]).map((r) => r.class_id));
    assert(gv.length > 0, 'GV Listening MB FT 101 phải có ít nhất một lượt quá hạn nhập điểm trong bộ demo — nếu không, vòng kiểm bên dưới vô nghĩa');
    for (const a of gv) {
      const cl = (conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(d.tachBaiId(a).attemptId) as any).class_id;
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
      /* PR-MTa T19 thay tuần 07/09: hạn lớp thường nay hết thứ Tư tuần sau — tuần 31/08 (hạn 09/09) mới quá hạn ở 14/09. */
      const ngoaiLop = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-08-31' });
      const cells = (debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue);
      assert(cells.some((x) => x.attemptId === ngoaiLop.attemptId), 'Lượt MB FOU 12 tuần 31/08 phải có ô quá hạn ở ngày 14/09 — nếu không, phép kiểm không có gì để lọt');
      const lopGv = new Set((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`)
        .all(lai.userId) as any[]).map((r) => r.class_id as number));
      const branchOf = (cid: number) => (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(cid) as any).branch_id as number;
      const want = [...new Set(cells.filter((x) => lopGv.has(x.classId) || branchOf(x.classId) === cp).map((x) => d.baiId(x.attemptId, x.skill) as number))]
        .sort((a, b) => a - b);
      const got = metricsSvc.metricSet(lai, 'bai-qua-han-nhap-diem', {}).ids as number[];
      assert(!got.some((id) => d.tachBaiId(id).attemptId === ngoaiLop.attemptId), `Lọt lượt ${ngoaiLop.attemptId} của lớp MB mình không dạy — quyền lớp bị nới thành cả chi nhánh`);
      eq(got, want, 'Phạm vi lai = (lớp mình dạy) ∪ (chi nhánh được cấp)');
    } finally {
      conn.prepare('DELETE FROM user_roles WHERE id = ?').run(grant);
    }
  });

  check('PR-Pa · rowsFor: Case Progress Test ghi tên môn (không chữ thô "listening"); bài thi có dòng', () => {
    const hv = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const c = conn.prepare('SELECT id FROM sos_cases WHERE student_id = ?').get(hv.sid) as any;
    const row = metricsSvc.rowsFor('case', [c.id])[0];
    assert(/Listening/.test(row.title) && !/listening/.test(row.title), `Chữ thô: ${row.title}`);
    const bai = metricsSvc.rowsFor('bai-thi', [hv.attemptId])[0];
    assert(bai.href !== '#' && /Progress Test|Bài/.test(bai.title), `Bài thi không có dòng: ${JSON.stringify(bai)}`);
  });

  // ================================================================== 5. Cần xử lý · Điểm đáng chú ý · HV cần hỗ trợ
  check('PR-Pa · Cần xử lý: mỗi dòng có số = độ dài tập của đúng chỉ số đó (cùng chi nhánh, GỘP hai khung — PR-VAI-a Q5); ≤ 10', () => {
    const mb = mbBranch;
    for (const [who, f] of [[P.admin, {}], [P.mbManager, { branchId: mb }], [P.mbManager, {}]] as const) {
      const r = tq.tongQuanQuanLy(who, f);
      if (who === P.admin) assert(r.canXuLy.length > 0, 'Cần xử lý (admin) phải có dòng — nếu rỗng thì vòng kiểm bên dưới vô nghĩa');
      assert(r.canXuLy.length <= 10, 'Quá 10 dòng');
      for (const dong of r.canXuLy) {
        const n = metricsSvc.metricSet(who, dong.metricId, { branchId: (f as any).branchId ?? null }).n;
        eq(dong.n, n, `Số dòng ${dong.metricId}`);
        assert(dong.n > 0, 'Dòng 0 phải bị bỏ');
        assert(typeof dong.phu === 'string' && dong.phu.length <= 60, `Dòng phụ quá 60 ký tự: ${dong.phu}`);
      }
    }
  });

  check('PR-Pa · Điểm đáng chú ý: ≤ 3; mỗi link mở đúng số dòng đã ghi (PR-VAI-a: route riêng theo khung)', () => {
    let co = 0;
    for (const ct of ['ft', 'thuong'] as const) {
      const r = tq.diemChuY(P.admin, { ct });
      co += r.length;
      assert(r.length <= 3, 'Quá 3 điểm');
      for (const x of r) {
        const set = metricsSvc.metricSet(P.admin, x.metricId, { ...(x.extra ?? {}), program: ct });
        eq(x.soDanhSach, set.ids.length, `Link ${x.loai} ghi ${x.soDanhSach} mà danh sách có ${set.ids.length}`);
      }
    }
    assert(co > 0, 'Điểm đáng chú ý (admin) phải có điểm');
  });

  check('PR-Pa · Khối Quản lý: giáo viên bị từ chối (403), không trả tập rút gọn', () => {
    assertThrows(() => tq.tongQuanQuanLy(P.normalCoreTeacher, {}), /Quản lý/, 'GVCN mở khối Quản lý');
    assertThrows(() => tq.diemChuY(P.normalCoreTeacher, { ct: 'ft' }), /Quản lý/, 'GVCN mở Điểm đáng chú ý');
  });

  check('PR-Pa · (PR-VAI-a Q12) Lớp tôi dạy thay Học viên cần hỗ trợ: em chưa đạt ở lớp tôi dạy vào ô "Chưa đạt" của đúng lớp; em đạt hết thì không; GV lớp khác không có hàng lớp đó', () => {
    const co = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 10, 40], ['reading', 10, 40], ['writing', 5, 20], ['speaking', 20, 25]] as const) diem(co.attemptId, s, sc, tt);
    const khong = taoHocVien({ classCode: 'MB FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 35, 40], ['reading', 35, 40], ['writing', 18, 20], ['speaking', 22, 25]] as const) diem(khong.attemptId, s, sc, tt);
    const cid = classId('MB FOU 12');
    const r = tq.lopToiDay(P.normalCoreTeacher, { ct: 'thuong' });
    const hang = r.rows.find((x: any) => x.classId === cid);
    assert(hang && hang.sos === null && hang.tuanHoc !== undefined, `Thiếu hàng MB FOU 12 hoặc có cột SOS: ${JSON.stringify(hang)}`);
    const o = tq.oLopToiDay(P.normalCoreTeacher, { ct: 'thuong', classId: cid, cot: 'duoiKyVong' });
    assert(o.rows.some((x: any) => x.id === co.sid) && !o.rows.some((x: any) => x.id === khong.sid), 'em chưa đạt có, em đạt hết không');
    eq(o.n, hang.duoiKyVong, 'số ở ô = số dòng khi bấm');
    assert(!tq.lopToiDay(P.w2Teacher /* GV W2 MB FT 101, không dạy MB FOU 12 */, { ct: 'thuong' }).rows.some((x: any) => x.classId === cid), 'GV lớp khác có hàng lớp này');
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
    for (const ct of ['ft', 'thuong'] as const) {
      const b = moiO(P.admin, { ct }, (khoa, cot, o) => {
        const r = bang.oBangChiNhanh(P.admin, { ct, cot, khoa });
        eq(r.rows.length, o.n, `${ct}: ô ${khoa}/${cot}`);
      });
      assert(b.hang.length > 0, `${ct}: bảng không có hàng nào — phép kiểm vô nghĩa`);
      const t = bang.oBangChiNhanh(P.admin, { ct, cot: 'caseMo', khoa: 'tong' });
      assert(t.rows.length > 0, `${ct}: tổng Case mở rỗng — phép kiểm vô nghĩa`);
      eq(t.rows.map((x: any) => x.id).sort((a: number, b: number) => a - b), ids('case-mo', { program: ct }).slice().sort((a, b) => a - b), `${ct}: tổng Case mở = case-mo`);
      const dd = b.tong.duDuLieu;
      const phu = metricsSvc.metricSet(P.admin, 'do-phu-danh-gia', { program: ct });
      eq([dd.n, dd.mau], [phu.numeratorIds.length, phu.n], `${ct}: Đủ dữ liệu = tử số / mẫu số của do-phu-danh-gia`);
      const idsO = (cot: string) => new Set<number>(bang.oBangChiNhanh(P.admin, { ct, cot, khoa: 'tong' }).rows.map((r: any) => r.id));
      const hv = idsO('hocVien');
      for (const cot of ['duoiKyVong', 'sos', 'duDuLieu']) {
        const lot = [...idsO(cot)].filter((id) => !hv.has(id));
        assert(lot.length === 0, `${ct}: tổng ${cot} có em ngoài tổng Học viên: ${JSON.stringify(lot)}`);
      }
    }
  });

  check('PR-Pa · Bảng chi nhánh: Quản trị không chọn chi nhánh → hàng chi nhánh mở xuống lớp; Quản lý một chi nhánh → bảng lớp luôn', () => {
    const a = bang.bangChiNhanh(P.admin, { ct: 'ft' });
    assert(a.cheDo === 'chi-nhanh' && a.hang.every((h: any) => h.loai === 'chi-nhanh' && Array.isArray(h.lop)), 'Quản trị');
    eq(a.branchId, null, 'Quản trị không chọn: branchId null');
    const m = bang.bangChiNhanh(P.mbManager, { ct: 'ft' });
    assert(m.cheDo === 'lop' && m.hang.every((h: any) => h.loai === 'lop') && m.tenChiNhanh === 'Monbay', `Quản lý MB: ${m.cheDo}`);
    eq(m.branchId, mbBranch, 'QL một chi nhánh: bảng trả branchId đã giải');
  });

  check('PR-Pa · Bảng chi nhánh: Lớp thường không có hàng lớp FT; giáo viên bị từ chối', () => {
    const b = bang.bangChiNhanh(P.admin, { branchId: mbBranch, ct: 'thuong' });
    assert(b.hang.length > 0 && b.hang.every((h: any) => h.laFt === false), 'Lọt lớp FT vào Lớp thường');
    assertThrows(() => bang.bangChiNhanh(P.normalCoreTeacher, { ct: 'ft' }), /Quản lý/, 'GV mở bảng chi nhánh');
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
  check('PR-Pa · Nợ S1 (PR-LT2a): không ai dạy Speaking → Case Progress Test tự tạo về GVCN, PA bổ trợ FOU do GVCN dạy; Việc cần làm không còn dòng "verify"', () => {
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
      const c = conn.prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'speaking'`).get(hv.sid) as any;
      assert(c && c.owner_user_id === gvcn.userId, `Case Speaking phải về GVCN: ${c?.owner_user_id}`);
      const pa = conn.prepare(`SELECT performer_user_id FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`).get(c.id) as any;
      eq(pa.performer_user_id, gvcn.userId, 'Người dạy bổ trợ FOU = GVCN');
      assert(!(mywork.myWork(gvcn).items as any[]).some((i) => i.group === 'verify'), 'Không còn dòng verify');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ph})`).run(...tam);
    }
  });
}
