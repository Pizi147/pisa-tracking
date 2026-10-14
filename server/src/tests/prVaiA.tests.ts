/**
 * PHÉP KIỂM PR-VAI-a — Tổng quan theo vai · Công việc · chuông (kế hoạch 2026-10-01-pr-vai-a-tong-quan-theo-vai, mockup 23).
 * Harness do `run.ts` sở hữu. Ngày demo 14/09/2026. Dữ liệu tạm tạo ở đây được dọn trong `finally`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVaiATests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { CO_THE_KHONG_THEO_DOI, LA_CASE_SOS } = await import('../cases/sosState.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const { nguoiGiuKetQua } = await import('../cases/giuKetQua.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const classes: any = await import('../classes/classes.ts');
  const chuongTrinh: any = await import('../worklist/chuongTrinh.ts');
  console.log('\nPR-VAI-a · Tổng quan theo vai');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  const branchOf = (code: string) => (conn.prepare('SELECT id FROM branches WHERE code = ?').get(code) as any).id as number;
  const MB = branchOf('MB');
  const sx = (a: number[]) => [...a].sort((x, y) => x - y);
  /** Tạm kết thúc phân công GV của một (lớp, môn) — trả hàm khôi phục. */
  const botGv = (code: string, skills: string[]) => {
    const ids = (conn.prepare(
      `SELECT id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill IN (${skills.map(() => '?').join(',')})`,
    ).all(classId(code), ...skills) as any[]).map((r) => r.id as number);
    for (const id of ids) conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id = ?`).run(id);
    return () => { for (const id of ids) conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id = ?`).run(id); };
  };

  // ================================================================== Task 1 · Cần xử lý cũ + gộp hai khung
  check('VAI-a (1a) · Chỉ số U3 "2 lần Test liền, chưa có Case" đã xoá: không trong sổ, /metrics → 404', () => {
    eq(d.metricById('hv-can-ho-tro-2-lan-chua-case'), null, 'metricById');
    assertThrows(() => metricsSvc.metricSet(P.admin, 'hv-can-ho-tro-2-lan-chua-case', {}), /Không tìm thấy chỉ số/, '/metrics U3');
    assert(!metricsSvc.LISTED_METRICS.includes('hv-can-ho-tro-2-lan-chua-case'), 'LISTED_METRICS');
  });

  check('VAI-a (1b) · Cần xử lý không còn "2 lần Test", "Case thiếu PA", "Case chưa có người"; Q3: việc QL tự quyết chỉ ở hộp Chờ duyệt', () => {
    const ma = d.CAN_XU_LY.map((x: any) => x.metricId);
    for (const bo of ['hv-can-ho-tro-2-lan-chua-case', 'case-thieu-pa', 'case-chua-co-nguoi-phu-trach',
      'case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'hv-can-xu-ly']) assert(!ma.includes(bo), `còn dòng ${bo}`);
    const dem = Object.fromEntries(['case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'hv-can-xu-ly', 'case-thieu-pa'].map((k) => [k, 9]));
    eq(d.sapCanXuLy(dem, true), [], 'đếm > 0 vẫn không lên Cần xử lý');
  });

  check('VAI-a (1c) · lop-thieu-gv-mon: hai đường — cùng tập với badge "Thiếu GV" ở Học viên & Lớp (QL MB, Quản trị); bớt GV thì vào, trả lại thì ra', () => {
    const coLop = () => metricsSvc.metricSet(P.mbManager, 'lop-thieu-gv-mon', {}).ids.includes(classId('MB FT 101'));
    const truoc = coLop();   // phép kiểm trước trong cùng harness có thể đã bớt GV khác của lớp này
    const khoiPhuc = botGv('MB FT 101', ['writing1']);
    try {
      for (const [who, branchId] of [[P.mbManager, MB], [P.mbManager, null], [P.admin, null], [P.admin, MB]] as const) {
        const r = metricsSvc.metricSet(who, 'lop-thieu-gv-mon', { branchId });
        const badge = (classes.listClassSummaries(who, branchId ? { branchId } : {}).rows as any[])
          .filter((c) => c.missingSkills.length > 0).map((c) => c.id as number);
        eq(sx(r.ids), sx(badge), `vai ${who.userId} cn ${branchId}: tập chỉ số = lớp có badge Thiếu GV`);
        eq(r.n, r.ids.length, 'n = độ dài tập');
      }
      assert(coLop(), 'lớp vừa bớt GV W1 phải vào tập');
      const dong = metricsSvc.rowsFor('lop', [classId('MB FT 101')])[0];
      /* Phép kiểm trước trong cùng harness có thể đã bớt GV khác của lớp này — chỉ đòi có W1. */
      assert(dong.title === 'MB FT 101' && /^thiếu .*\bW1\b/.test(dong.sub) && dong.href === `/hoc-vien/lop/${classId('MB FT 101')}?viec=phan-cong`,
        `dòng panel: ${JSON.stringify(dong)}`);
      const admin = metricsSvc.metricSet(P.admin, 'lop-thieu-gv-mon', {}).ids;
      for (const code of ['HD FT 302', 'UB FOU 07']) assert(admin.includes(classId(code)), `bộ demo: ${code} thiếu GV phải có`);
    } finally { khoiPhuc(); }
    eq(coLop(), truoc, 'trả GV thì lớp về đúng trạng thái trước');
  });

  check('VAI-a (1d) · lop-thieu-gv-mon: Pre FOU thiếu GVBM không tính; phủ định — QL CP không thấy lớp MB; GV nhận tập rỗng có nhãn', () => {
    const khoiPhuc = botGv('MB Pre FOU 03', ['listening', 'reading', 'writing', 'speaking', 'tong_hop']);
    const khoiPhuc2 = botGv('MB FT 101', ['speaking']);
    try {
      assert(!metricsSvc.metricSet(P.admin, 'lop-thieu-gv-mon', {}).ids.includes(classId('MB Pre FOU 03')), 'Pre FOU không chia môn — không tính');
      const cp = metricsSvc.metricSet(P.cpManager, 'lop-thieu-gv-mon', {}).ids as number[];
      const mbLop = new Set((conn.prepare('SELECT id FROM classes WHERE branch_id = ?').all(MB) as any[]).map((r) => r.id));
      assert(!cp.some((id) => mbLop.has(id)), 'QL CP thấy lớp MB');
      assertThrows(() => metricsSvc.metricSet(P.cpManager, 'lop-thieu-gv-mon', { branchId: MB }), /ngoài phạm vi/, 'QL CP hỏi MB → 403');
      const gv = metricsSvc.metricSet(P.coreTeacher, 'lop-thieu-gv-mon', {});
      assert(gv.n === 0 && gv.empty === true && gv.note, 'GV: tập rỗng có nhãn');
      eq(chuongTrinh.locTheoChuongTrinh('lop', [classId('MB FT 101'), classId('MB FOU 12')], 'ft'), [classId('MB FT 101')], 'lọc khung theo chính lớp');
    } finally { khoiPhuc(); khoiPhuc2(); }
  });

  check('VAI-a (1e) · tongQuanQuanLy không nhận ct: mỗi dòng = metricSet(id, { branchId }).n (không lọc khung); dòng thiếu GV có dòng phụ lớp + số Case chưa có người nhận', () => {
    const khoiPhuc = botGv('MB FT 101', ['writing1']);
    try {
      for (const f of [{ branchId: MB }, { branchId: MB, ct: 'thuong' }, { branchId: MB, ct: 'ft' }]) {
        const r = tq.tongQuanQuanLy(P.mbManager, f);
        assert(!('diemDangChuY' in r), 'Điểm đáng chú ý đã tách route');
        for (const dong of r.canXuLy) eq(dong.n, metricsSvc.metricSet(P.mbManager, dong.metricId, { branchId: MB }).n, `${dong.metricId} (${f.ct ?? '—'})`);
      }
      const lop = tq.tongQuanQuanLy(P.mbManager, { branchId: MB }).canXuLy.find((x: any) => x.metricId === 'lop-thieu-gv-mon');
      const dau = metricsSvc.rowsFor('lop', metricsSvc.metricSet(P.mbManager, 'lop-thieu-gv-mon', { branchId: MB }).ids)[0];
      assert(lop && lop.phu.startsWith(`${dau.title} ${dau.sub}`.slice(0, 20)) && lop.phu.length <= 60, `dòng phụ lớp thiếu GV (cùng dòng panel, ≤ 60): ${JSON.stringify(lop)}`);
      const k = metricsSvc.metricSet(P.mbManager, 'case-chua-co-nguoi-phu-trach', { branchId: MB }).n;
      /* PR-S6F-b (Q6 vế m): kèm "m bài chưa có người chấm" — bài quá hạn của tập `bai-qua-han-nhap-diem` không có người trong `chiTiet`. */
      const bai = metricsSvc.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB });
      /* PR-LT3 (T18, D4): ô Speaking Mock có người giữ việc "GV chấm chéo" — không phải "chưa có người chấm". */
      const m = (bai.ids as number[]).filter((id) => !bai.chiTiet?.get(id)?.nguoi.length && !bai.chiTiet?.get(id)?.chamCheo).length;
      /* OV-11f (TQ-13): mỗi vế là một chỉ số bấm được (`case-chua-co-nguoi-phu-trach`, `bai-qua-han-chua-phan-cong`). */
      eq(JSON.stringify((lop.kem ?? []).map((x: any) => [x.metricId, x.n])), JSON.stringify([...(k ? [['case-chua-co-nguoi-phu-trach', k]] : []), ...(m ? [['bai-qua-han-chua-phan-cong', m]] : [])]),
        'số Case chưa có người nhận = chỉ số giữ lại; m bài chưa có người chấm');
    } finally { khoiPhuc(); }
  });

  check('VAI-a (1f) · /tong-quan/diem-chu-y: ft và thuong trả đúng chonDiemDangChuY; GV → 403', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const r = tq.diemChuY(P.admin, { ct });
      assert(Array.isArray(r) && r.length <= 3, `${ct}: ≤ 3 điểm`);
      assert(r.every((x: any) => x.soDanhSach === metricsSvc.metricSet(P.admin, x.metricId, { ...(x.extra ?? {}), program: ct }).ids.length), `${ct}: số = danh sách`);
    }
    assertThrows(() => tq.diemChuY(P.coreTeacher, { ct: 'ft' }), /Quản lý/, 'GV mở Điểm đáng chú ý');
  });

  // ================================================================== Task 2 · bốn việc "của Bạn"
  const mgmt: any = await import('../worklist/mgmttasks.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const week: any = await import('../platform/week.ts');
  const NOW = new Date().toISOString();
  const TODAY = t.TODAY;
  let soHv = 0;
  const taoHv = (code: string, route: string | null) => {
    soHv += 1;
    const tag = `VAIA-${soHv}`;
    const cid = classId(code);
    const br = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(cid) as any).branch_id;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, br, NOW).lastInsertRowid);
    const eid = Number(conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-06-01', ?)`)
      .run(sid, cid, NOW).lastInsertRowid);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, ?, ?, '2026-06-01', 'active', ?)`)
      .run(sid, route, route ? null : (conn.prepare('SELECT programme_code FROM classes WHERE id = ?').get(cid) as any).programme_code, NOW).lastInsertRowid);
    return { sid, cid, eid, cy };
  };
  const don = (sid: number) => {
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ?)`).run(sid);
    conn.prepare(`DELETE FROM attempt_skills WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ?)`).run(sid);
    for (const tb of ['lenh_chuyen_lop', 'lo_trinh_tiep_theo', 'assessment_attempts', 'learning_cycles', 'enrollments']) conn.prepare(`DELETE FROM ${tb} WHERE student_id = ?`).run(sid);
    conn.prepare('UPDATE students SET status = \'withdrawn\', archived_at = ? WHERE id = ?').run(NOW, sid);
  };

  check('VAI-a (2a) · van-hanh-can-quyet-dinh = listMgmtTasks + khopHang("can-quyet-dinh") = hangSo của tab Vận hành; tạm ngưng tới hạn xem lại → +1, mở lại → −1', () => {
    const goc = conn.prepare(`SELECT id, progress, review_on FROM tasks WHERE parent_task_id IS NULL AND kind = 'branch_ops' AND branch_id = ?
      AND progress NOT IN ('done','stopped','paused') ORDER BY id LIMIT 1`).get(MB) as any;
    assert(goc, 'bộ demo phải có một việc Vận hành MB đang mở');
    const hai = () => {
      const r = metricsSvc.metricSet(P.mbManager, 'van-hanh-can-quyet-dinh', { branchId: MB });
      const tab = mgmt.listMgmtTasks(P.mbManager, { branchId: MB });
      eq(r.n, tab.hangSo['can-quyet-dinh'], 'số = hàng số "cần quyết định" của tab Vận hành');
      eq(sx(r.ids), sx(tab.rows.filter((x: any) => d.khopHang({ ...x, subOpen: x.subOpen, subTotal: x.subTotal, group: x.group, completedAt: null }, 'can-quyet-dinh', TODAY)).map((x: any) => x.id)), 'cùng tập');
      return r.n;
    };
    const truoc = hai();
    try {
      conn.prepare(`UPDATE tasks SET progress = 'paused', review_on = ? WHERE id = ?`).run(TODAY, goc.id);
      eq(hai(), truoc + 1, 'tạm ngưng tới hạn xem lại → +1');
      conn.prepare(`UPDATE tasks SET progress = 'doing', review_on = NULL WHERE id = ?`).run(goc.id);
      eq(hai(), truoc, 'mở lại → về như cũ');
    } finally { conn.prepare('UPDATE tasks SET progress = ?, review_on = ? WHERE id = ?').run(goc.progress, goc.review_on, goc.id); }
    assert(metricsSvc.rowsFor('viec-van-hanh', [goc.id])[0].href === `/cong-viec?mo-viec=${goc.id}`, 'dòng mở đúng việc');
  });

  /* PR-LCb: `hv-chua-co-lenh-chuyen` đã bỏ — cùng ý (hai đường một tập, ra quyết định một em → −1) viết lại trên `lop-chua-chot-len-ft`. */
  check('VAI-a (2b) · lop-chua-chot-len-ft: tập lớp = lớp của việc "Chốt lộ trình" myWork(QL); ra quyết định cho một em → count −1', () => {
    const cid = classId('MB FOU 12');
    const pr = schedule.classProgress(cid);
    const cu = conn.prepare('SELECT final_week_override, progress_week_override FROM classes WHERE id = ?').get(cid) as any;
    assert(pr.currentWeek && pr.currentWeek > 1, 'MB FOU 12 phải đang học');
    /* Đưa Cuối khoá về tuần này để lớp "tới Cuối khoá" ở ngày demo. */
    conn.prepare('UPDATE classes SET final_week_override = ?, progress_week_override = ? WHERE id = ?').run(pr.currentWeek, pr.currentWeek - 1, cid);
    let lenh: number | null = null;
    try {
      const hai = () => {
        const r = metricsSvc.metricSet(P.mbManager, 'lop-chua-chot-len-ft', { branchId: MB });
        const viec = (mywork.myWork(P.mbManager, { branchId: MB }).items as any[]).filter((i) => i.group === 'chot_len_ft');
        eq(r.ids, [...new Set(viec.map((i) => i.classId as number))].sort((a, b) => a - b), 'tập lớp chỉ số = lớp của việc');
        return viec.find((i) => i.classId === cid);
      };
      const v0 = hai();
      assert(v0 && v0.count > 0, 'phải có em chưa có quyết định ở MB FOU 12');
      const sid = (conn.prepare(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active'
        AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho')
        AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.trang_thai = 'cho' AND y.loai = 'de_xuat_chuyen_lop' AND y.doi_tuong_id = e.student_id) LIMIT 1`).get(cid) as any).id;
      lenh = Number(conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc)
        VALUES (?, ?, 'bao_luu', 'cuoi_khoa', ?, ?, ?, ?)`).run(sid, cid, t.addDays(week.mondayOf(TODAY), 7), P.mbManager.userId, TODAY, NOW).lastInsertRowid);
      eq(hai()?.count ?? 0, v0.count - 1, 'ra quyết định cho một em → −1');
      assert(!metricsSvc.metricSet(P.cpManager, 'lop-chua-chot-len-ft', {}).ids.includes(cid), 'phủ định: QL CP không thấy lớp MB');
    } finally {
      if (lenh) conn.prepare('DELETE FROM lenh_chuyen_lop WHERE id = ?').run(lenh);
      conn.prepare('UPDATE classes SET final_week_override = ?, progress_week_override = ? WHERE id = ?').run(cu.final_week_override, cu.progress_week_override, cid);
    }
  });

  check('VAI-a (2c) · hv-ft-xong-mt-cuoi-chua-mt-ke: em xong MT3 chưa mốc → có (cùng luật tomTatMt: daXongMtCuoi +1); xếp MT4 → ra; đặt tháng thi → ra', () => {
    const cid = classId('MB FT 101');
    const tomTat0 = schedule.tomTatMt(cid);
    const hv = taoHv('MB FT 101', 'LT1');
    try {
      const pQua = week.ensurePeriod(t.addDays(week.mondayOf(TODAY), -14)).id;
      const a3 = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,3,'mock',?,?, 'done', ?)`).run(hv.cy, hv.sid, cid, pQua, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 5.5, ?)`).run(a3, NOW);
      const co = () => metricsSvc.metricSet(P.mbManager, 'hv-ft-xong-mt-cuoi-chua-mt-ke', { branchId: MB }).ids.includes(hv.sid);
      assert(co(), 'xong MT3, chưa mốc, chưa ngày thi → có');
      eq(schedule.tomTatMt(cid).daXongMtCuoi, tomTat0.daXongMtCuoi + 1, 'hai đường: tomTatMt đếm thêm đúng em này');
      const pToi = week.ensurePeriod(t.addDays(week.mondayOf(TODAY), 21)).id;
      const a4 = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,4,'mock',?,?, 'planned', ?)`).run(hv.cy, hv.sid, cid, pToi, NOW).lastInsertRowid);
      assert(!co(), 'xếp MT4 → ra khỏi tập');
      conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(a4);
      assert(co(), 'bỏ MT4 → có lại');
      conn.prepare(`UPDATE learning_cycles SET exam_month = '2027-02' WHERE id = ?`).run(hv.cy);
      assert(!co(), 'đặt tháng thi → ra (coMocTiepTheo)');
      assert(!metricsSvc.metricSet(P.cpManager, 'hv-ft-xong-mt-cuoi-chua-mt-ke', {}).ids.includes(hv.sid), 'phủ định: QL CP');
      const gv = metricsSvc.metricSet(P.coreTeacher, 'hv-ft-xong-mt-cuoi-chua-mt-ke', {});
      assert(gv.n === 0 && gv.empty, 'GV: tập rỗng có nhãn');
    } finally { don(hv.sid); }
  });

  /* PR-KV: MT0 đủ 4 kỹ năng của em ở lớp `cid` (kỳ vọng đầu ra xét theo Overall MT0). */
  const mt0Du = (hv: { sid: number; cy: number; cid: number }, band = 4) => {
    const a = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?,0,'mt0',?, 'planned', ?)`)
      .run(hv.cy, hv.sid, hv.cid, NOW).lastInsertRowid);
    for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?,?,?)').run(a, k, band);
  };

  check('VAI-a (2d) · hv-len-ft-chua-ky-vong (PR-KV): em BE có lệnh lên FT + MT0 đủ điểm → có; ghiKetLuanFt(Đạt) → ra; QL CP không thấy', () => {
    const hv = taoHv('MB BE 04', null);
    try {
      const pr = week.ensurePeriod(week.mondayOf(TODAY)).id;
      conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,2,'final',?,?, 'planned', ?)`).run(hv.cy, hv.sid, hv.cid, pr, NOW);
      conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc)
        VALUES (?, ?, 'fast_track', 'cuoi_khoa', ?, ?, ?, ?)`).run(hv.sid, hv.cid, t.addDays(week.mondayOf(TODAY), 7), P.mbManager.userId, TODAY, NOW);
      mt0Du(hv);
      const co = (who = P.mbManager) => metricsSvc.metricSet(who, 'hv-len-ft-chua-ky-vong', {}).ids.includes(hv.sid);
      assert(co(), 'lệnh lên FT, MT0 đủ điểm, chưa đánh dấu → có');
      assert(!co(P.cpManager), 'phủ định: QL CP không thấy em MB');
      cuoiKhoa.ghiKetLuanFt(P.mbManager, hv.sid, { dat: true });
      assert(!co(), 'đánh dấu Đạt → ra');
    } finally { don(hv.sid); }
  });

  check('VAI-a (2e) · khung n = ids.length = rows.length phủ bốn chỉ số mới; Cần xử lý có đủ dòng khi n > 0, số = metricSet', () => {
    /* PR-LCb: hv-chua-co-lenh-chuyen đã bỏ → lop-chua-chot-len-ft. */
    for (const id of ['van-hanh-can-quyet-dinh', 'lop-chua-chot-len-ft', 'hv-ft-xong-mt-cuoi-chua-mt-ke', 'hv-len-ft-chua-ky-vong']) {
      const r = metricsSvc.metricSet(P.admin, id, {});
      const full = metricsSvc.metricResponse(r, true);
      eq([r.n, full.rows.length], [r.ids.length, r.ids.length], `${id}: n = ids = rows`);
      assert(d.CAN_XU_LY.some((x: any) => x.metricId === id && x.cuaNguoiXem === true), `${id}: dòng "của Bạn" ở Cần xử lý`);
    }
    const r = tq.tongQuanQuanLy(P.admin, {});
    for (const dong of r.canXuLy) eq(dong.n, metricsSvc.metricSet(P.admin, dong.metricId, {}).n, dong.metricId);
  });

  // ================================================================== Task 3 · bốn cột: trạng thái · việc · Người giữ việc · Hạn
  const debt: any = await import('../worklist/scoreDebt.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const soNgay = (tu: string, den: string) => Math.round((Date.parse(den) - Date.parse(tu)) / 86_400_000);

  check('VAI-a (3a) · sapCanXuLy: nhãn Quá hạn / Cần làm; quá hạn lên đầu, rồi việc GV trễ trước việc "Bạn"', () => {
    const tat = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 2]));
    const r = d.sapCanXuLy(tat, true, { 'van-hanh-can-quyet-dinh': true });
    assert(r.every((x: any) => x.trangThai === 'qua-han' || x.trangThai === 'can-lam'), 'chỉ hai nhãn');
    eq(r.map((x: any) => x.metricId).slice(0, 4), ['bai-qua-han-nhap-diem', 'pa-can-cap-nhat', 'phoi-hop-qua-han', 'van-hanh-can-quyet-dinh'], 'quá hạn lên đầu: GV trễ trước (OV-12h: + meeting CX), Vận hành quá hạn sau');
    const w = (x: any) => (x.trangThai === 'qua-han' ? 0 : 1) * 2 + (x.cuaNguoiXem ? 1 : 0);
    assert(r.every((x: any, i: number) => i === 0 || w(r[i - 1]) <= w(x)), 'thứ tự quá hạn → GV → Bạn');
    eq(d.nguoiGiuViecChu(['Trần Thu Trang', 'Lê Thu Hà', 'Lê Minh Đức', 'An Bình', 'Lê Thu Hà']),
      { dau: '4 giáo viên', phu: 'An Bình · Lê Minh Đức · Lê Thu Hà · +1' }, 'tên sắp theo tên, không trùng, quá 3 thì +k');
  });

  check('VAI-a (3b) · dòng bài: Người giữ việc = GV phụ trách các ô quá hạn của tập (scoreDebtCells), hạn "quá hạn a–b ngày"; phủ định — không lọt GV chi nhánh khác', () => {
    const r = tq.tongQuanQuanLy(P.mbManager, { branchId: MB });
    const dong = r.canXuLy.find((x: any) => x.metricId === 'bai-qua-han-nhap-diem');
    assert(dong, 'bộ demo MB phải có bài quá hạn nhập điểm');
    const ids = new Set(metricsSvc.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB }).ids);
    /* PR-UXF-a Q7: id của ô = `baiId` (bài = ô điểm); ô môn chưa phân công (userId null, Q8) không có người giữ việc. */
    const o = (debt.scoreDebtCells(P.mbManager, TODAY, [MB]) as any[]).filter((c) => c.overdue && ids.has(d.baiId(c.attemptId, c.skill)));
    eq(sx(dong.nguoi.ids), sx([...new Set(o.filter((c) => c.userId !== null).map((c) => c.userId as number))]), 'tập người = GV của ô quá hạn');
    const ngay = o.filter((c) => c.han).map((c) => soNgay(c.han, TODAY));
    const a = Math.min(...ngay), b = Math.max(...ngay);
    eq(dong.han.chu, a === b ? `quá hạn ${a} ngày` : `quá hạn ${a}–${b} ngày`, 'hạn ngắn nhất–dài nhất');
    eq([dong.trangThai, dong.den], ['qua-han', `/cong-viec?nhom=cham-diem&loc=qua-han&khung=tat-ca&cn=${MB}`], 'Quá hạn + nút tới Công việc đã lọc');
    const mbLop = new Set((conn.prepare('SELECT id FROM classes WHERE branch_id = ?').all(MB) as any[]).map((x) => x.id));
    for (const u of dong.nguoi.ids) {
      assert((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`).all(u) as any[]).some((x) => mbLop.has(x.class_id)), `GV ${u} không dạy lớp MB`);
    }
    /* Hai đường: tên ở Tổng quan = người giữ việc ở Công việc › Của GV (cùng link, `nguoi=tat-ca` mặc định của QL; OV-12h bỏ Nhắc). */
    const giu = new Set((mywork.myWork(P.mbManager, { branchId: MB, nguoi: 'tat-ca' }).items as any[])
      .filter((i) => i.group === 'score' && i.urgency === 'overdue' && i.ownerId !== null).map((i) => i.ownerId as number));
    for (const u of dong.nguoi.ids) assert(giu.has(u), `GV ${u} có tên ở Cần xử lý mà không có dòng ở Công việc › Của GV`);
  });

  check('VAI-a (3c) · dòng PA: người giữ việc Kết quả (PR-PA §8: GVBM môn / GVCN lớp hiện tại, không có thì chủ Case), hạn = hạn cũ nhất = hanCu; panel Case/PA có người + hạn, mở hồ sơ HV ở Ngăn Case', () => {
    const m = metricsSvc.metricSet(P.admin, 'pa-can-cap-nhat', {});
    assert(m.n > 0, 'bộ demo phải có PA quá hạn ghi kết quả');
    const ph = m.ids.map(() => '?').join(',');
    const goc = conn.prepare(`SELECT iv.id, iv.action_due, iv.nhom_bo_tro, sc.topic, sc.owner_user_id,
        COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), a.class_id) AS lop
      FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id IN (${ph})`).all(...m.ids) as any[];
    const giu = nguoiGiuKetQua(goc.map((x) => ({ id: x.id, topic: x.topic, nhomBoTro: x.nhom_bo_tro, classId: x.lop, ownerUserId: x.owner_user_id })), demoToday());
    for (const x of goc) x.u = giu.get(x.id);
    const cu = goc.map((x) => x.action_due).sort()[0];
    eq(m.hanCu, cu, 'hanCu = MIN(action_due) của tập');
    eq(metricsSvc.metricResponse(m, false).hanCu, cu, 'lean /metrics có hanCu (Q25)');
    const dong = tq.tongQuanQuanLy(P.admin, {}).canXuLy.find((x: any) => x.metricId === 'pa-can-cap-nhat');
    eq(sx(dong.nguoi.ids), sx([...new Set(goc.map((x) => x.u).filter(Boolean))]), 'tập người = người giữ việc');
    eq(dong.han, { ngay: cu, loai: 'cap-nhat-pa' }, 'hạn cũ nhất');
    assert(/^PA chưa có Kết quả kỳ W/.test(dong.nhan), `nhãn có mã tuần: ${dong.nhan}`);
    const dongPa = metricsSvc.rowsFor('phuong-an', m.ids.slice(0, 3));
    assert(dongPa.every((x: any) => /^\/hoc-vien\/\d+\?case=\d+$/.test(x.href) && 'nguoi' in x && x.han), `panel PA: ${JSON.stringify(dongPa[0])}`);
    const c = metricsSvc.metricSet(P.admin, 'case-mo', {}).ids.slice(0, 3);
    assert(metricsSvc.rowsFor('case', c).every((x: any) => /^\/hoc-vien\/\d+\?case=\d+$/.test(x.href) && 'nguoi' in x), 'panel Case mở Ngăn Case');
    eq(metricsSvc.rowsFor('phuong-an', m.ids).length, m.n, 'số dòng panel không đổi');
  });

  check('VAI-a (3d) · dòng "Bạn": Người giữ việc = Bạn; nút đúng việc; chưa có hạn ghi bằng chữ', () => {
    const r = tq.tongQuanQuanLy(P.admin, {});
    for (const x of r.canXuLy.filter((y: any) => y.cuaNguoiXem)) {
      eq(x.nguoi, 'ban', `${x.metricId}: Bạn`);
      assert('ngay' in x.han || typeof x.han.chu === 'string', `${x.metricId}: hạn`);
      assert(x.den === null || x.den.startsWith('/'), `${x.metricId}: nút`);
    }
    for (const x of r.canXuLy) assert(!/\bQL\b|can-quyet-dinh[^&]*$|ghi_ket_qua_pa/.test(`${x.truoc ?? ''} ${x.nhan} ${x.phu}`), `mã thô trên màn: ${x.nhan}`);
  });

  // ================================================================== Task 4 · dải Chờ duyệt theo chi nhánh
  const yc: any = await import('../duyet/yeuCau.ts');
  check('VAI-a (4a) · demYeuCau(QL, { branchId }) = hopChoDuyet(QL, { branchId }).dem (cùng demHop); quaHan: true ra đúng số quá hạn; Để QL biết = tab de-biet (PR-GVb J5b)', () => {
    for (const branchId of [MB, null]) {
      const dem = yc.demYeuCau(P.mbManager, { branchId });
      const hop = yc.hopChoDuyet(P.mbManager, { branchId });
      eq([dem.cho, dem.deBiet], [hop.dem['tat-ca'], hop.demBiet], `cn ${branchId}: tổng, Để QL biết`);   // PR-GVb (J5b): Báo QL tách khỏi tab Chờ duyệt → tab Để QL biết
      eq(dem.chip, hop.dem, `cn ${branchId}: chip từng phân loại`);
      eq(yc.hopChoDuyet(P.mbManager, { branchId, quaHan: true }).the.length, dem.quaHan, `cn ${branchId}: số thẻ khi lọc quá hạn = k quá hạn`);
      eq(yc.hopChoDuyet(P.mbManager, { branchId, xem: 'de-biet' }).the.length, dem.deBiet, `cn ${branchId}: tab Để QL biết = deBiet`);
    }
    const khong = yc.demYeuCau(P.admin);
    const co = yc.demYeuCau(P.admin, {});
    eq([khong.cho, khong.quaHan, khong.baoLen], [co.cho, co.quaHan, co.baoLen], 'không branchId → như cũ (badge App không đổi)');
    const moiCn = (conn.prepare('SELECT id FROM branches').all() as any[]).reduce((s, b) => s + yc.demYeuCau(P.admin, { branchId: b.id }).cho, 0);
    assert(moiCn <= khong.cho, 'tổng theo chi nhánh không vượt tổng cả hộp');
    assert(Array.isArray(d.chipChoDuyet(co)), 'hàng chip (PR-GVb J5 thay dòng phụ)');
  });

  check('VAI-a (4b) · phủ định: QL MB hỏi chi nhánh CP → 403; GV không có phần hộp (chỉ cuaToi*)', () => {
    assertThrows(() => yc.demYeuCau(P.mbManager, { branchId: branchOf('CP') }), /ngoài phạm vi/, 'QL MB hỏi CP');
    const gv = yc.demYeuCau(P.coreTeacher, { branchId: MB });
    eq([gv.cho, gv.quaHan, gv.baoLen, 'chip' in gv], [0, 0, 0, false], 'GV: không số hộp');
    const r = tq.tongQuanQuanLy(P.mbManager, { branchId: MB });
    eq(r.choDuyet.cho, yc.demYeuCau(P.mbManager, { branchId: MB }).cho, 'dải Tổng quan đọc theo chi nhánh');
  });

  // ================================================================== Task 5 · ba tầng + phần Số liệu theo khung
  check('VAI-a (5a) · tab "Việc hôm nay"; Điểm đáng chú ý lớp thường theo chương trình, nhãn Cần chú ý / Tốt, số = số dòng khi mở (ctLop)', () => {
    eq(d.TAB_TONG_QUAN_LABEL['tong-quan'], 'Việc hôm nay', 'tên tab');
    const ung = [
      { loai: 'lop-chua-dat', metricId: 'hv-duoi-ky-vong-mon', extra: { ctLop: 'FOU' }, tu: 5, mau: 22, nhanMon: 'FOU', tenBai: null },
      { loai: 'lop-chua-dat', metricId: 'hv-duoi-ky-vong-mon', extra: { ctLop: 'BE' }, tu: 2, mau: 3, nhanMon: 'BE', tenBai: 'Progress Test' },
      { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 12, mau: 15 },
    ];
    const r = d.chonDiemDangChuY(ung, 'thuong');
    eq(r[0].cau, 'FOU: 5/22 học viên chưa đạt ở bài gần nhất', 'câu chương trình (BE 2 em dưới ngưỡng)');
    eq(r.map((x: any) => x.muc), ['can-chu-y', 'tot'], 'nhãn chữ');
    assert(d.chonDiemDangChuY(ung, 'ft').every((x: any) => x.loai !== 'lop-chua-dat'), 'FT không có câu lớp thường');
    for (const x of tq.diemChuY(P.admin, { ct: 'thuong' })) {
      eq(x.soDanhSach, metricsSvc.metricSet(P.admin, x.metricId, { ...(x.extra ?? {}), program: 'thuong' }).ids.length, `${x.loai}: số = danh sách`);
      assert(x.muc === 'can-chu-y' || x.muc === 'tot', 'muc');
    }
  });

  check('VAI-a (5b) · /metrics hv-duoi-ky-vong-mon?ct=thuong&ctLop=FOU ⊆ tập ct=thuong, em đúng chương trình; ctLop lạ / chỉ số khác → 400', () => {
    const tat = new Set(metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { program: 'thuong' }).ids);
    const fou = metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { program: 'thuong', ctLop: 'FOU' });
    assert(fou.ids.every((x: number) => tat.has(x)), 'ctLop ⊆ ct=thuong');
    assert(fou.ids.every((x: number) => (conn.prepare(`SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.status = 'active' AND c.programme_code = 'FOU'`).get(x))), 'em đang học FOU');
    assert(fou.ids.every((x: number) => (fou.denominatorIds as number[]).includes(x)), 'tử ⊆ mẫu');
    assertThrows(() => metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { ctLop: 'XYZ' }), /không hợp lệ/, 'ctLop lạ');
    assertThrows(() => metricsSvc.metricSet(P.admin, 'case-mo', { ctLop: 'FOU' }), /không hợp lệ/, 'chỉ số khác nhận ctLop');
  });

  check('VAI-a (5c) · /metrics/pa-can-cap-nhat lean có hanCu = MIN action_due của tập, theo khung', () => {
    for (const program of ['ft', 'thuong', 'ca-hai'] as const) {
      const m = metricsSvc.metricSet(P.admin, 'pa-can-cap-nhat', { program });
      const want = m.ids.length ? (conn.prepare(`SELECT MIN(action_due) AS m FROM case_interventions WHERE id IN (${m.ids.map(() => '?').join(',')})`).get(...m.ids) as any).m : null;
      eq(metricsSvc.metricResponse(m, false).hanCu, want, `hanCu ${program}`);
    }
  });

  // ================================================================== Task 6 · Công việc: T75, đến hết tuần, Phối hợp SOS, bỏ next_step
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const fs = await import('node:fs');
  const pathM = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathM.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

  check('VAI-a (6a) · T75: tên nhóm, khoá ghi_ket_qua_pa (không còn "result" trong mywork.ts), hạn cap-nhat-pa; gomNhomViec một tham số', () => {
    eq(Object.values(d.NHOM_VIEC_LABEL), ['Chấm điểm', 'Case học thuật', 'Ý thức & Phối hợp', 'Vận hành'], 'tên nhóm');
    eq([d.nhomViecCua('ghi_ket_qua_pa'), d.LOAI_HAN_CUA_VIEC.ghi_ket_qua_pa], ['case-hoc-thuat', 'cap-nhat-pa'], 'khoá mới');
    eq([d.nhomViecCua('phoi_hop_sos'), d.nhomViecCua('khai_bac'), d.nhomViecCua('ky_vong_dau_ra')], ['case-hoc-thuat', 'y-thuc', 'van-hanh'], 'ba loại mới');
    const src = fs.readFileSync(pathM.join(REPO, 'server/src/worklist/mywork.ts'), 'utf8');
    assert(!/'result'/.test(src) && !/'next_step'/.test(src), 'mywork.ts còn khoá result / next_step');
    eq(d.gomNhomViec.length, 1, 'gomNhomViec không còn tham số soNhacYThuc');
    assert(!fs.existsSync(pathM.join(REPO, 'web/src/modules/yThuc/YThucReminders.tsx')), 'nhắc mềm đã xoá');
  });

  check('VAI-a (6b) · trongKhoiHomNay: quá hạn / hôm nay / Chủ nhật tuần này → có; Thứ Hai tuần sau / không hạn → không; chip "Đến hết tuần" cùng luật', () => {
    const hn = '2026-09-16';   // Thứ Tư; Chủ nhật tuần này 20/09
    const v = (urgency: string, due: string | null) => ({ urgency, due, group: 'score' });
    const ca = [[v('overdue', '2026-09-10'), true], [v('today', hn), true], [v('normal', '2026-09-20'), true],
      [v('normal', '2026-09-21'), false], [v('normal', null), false]] as const;
    for (const [it, mong] of ca) {
      eq(d.trongKhoiHomNay(it, hn), mong, `${it.urgency} ${it.due}`);
      eq(d.khopLocNhanh(it, 'den-het-tuan', hn), mong, `chip ${it.due}`);
    }
    eq(d.LOC_NHANH_LABEL['den-het-tuan'], 'Đến hết tuần', 'nhãn chip');
  });

  check('VAI-a (6c) · Phối hợp SOS là việc thật: một dòng mỗi lớp GVCN, count = pendingCount của tab Phối hợp lớp (hai đường); GVBM không có', () => {
    let thay = 0;
    for (const gv of [P.coreTeacher, P.normalCoreTeacher]) {
      const viec = (mywork.myWork(gv).items as any[]).filter((i) => i.group === 'phoi_hop_sos');
      for (const it of viec) {
        thay++;
        eq(it.count, phoiHop.coordinationOfClass(gv, it.classId).pendingCount, `lớp ${it.classCode}: count = số lượt tab Phối hợp`);
        /* OV-12h: không hạn, trừ meeting CX / GĐCN (hạn sớm nhất của lớp, `myCoordinationLines`). */
        const han = phoiHop.myCoordinationLines(gv).find((l: any) => l.classId === it.classId)?.han ?? null;
        assert(it.due === han && it.urgency === (han && han < TODAY ? 'overdue' : han === TODAY ? 'today' : 'normal') && it.actionLabel === 'Mở Phối hợp SOS' && it.href.endsWith('?tab=y-thuc&sub=phoi-hop'), JSON.stringify(it));
      }
      eq(viec.length, phoiHop.myCoordinationLines(gv).length, 'một dòng mỗi lớp của myCoordinationLines');
    }
    assert(thay > 0, 'bộ demo phải có lớp còn lượt Phối hợp SOS');
    /* P.subjectTeacher không chủ nhiệm MB FT 101 (có thể chủ nhiệm lớp khác) — không có việc Phối hợp SOS của lớp này. */
    assert(!(mywork.myWork(P.subjectTeacher).items as any[]).some((i) => i.group === 'phoi_hop_sos' && i.classId === classId('MB FT 101')), 'GVBM không có việc Phối hợp SOS');
  });

  check('VAI-a (6d) · Q27: không ai còn việc next_step; chip "Tất cả" = Σ nhóm', () => {
    for (const who of [P.coreTeacher, P.normalCoreTeacher, P.subjectTeacher]) {
      const w = mywork.myWork(who) as any;
      assert(!w.items.some((i: any) => i.group === 'next_step'), 'còn next_step');
      eq(d.gomNhomViec(w.items).reduce((s: number, g: any) => s + g.n, 0), w.items.length, 'Tất cả = Σ nhóm');
    }
    assert(!(mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items.some((i: any) => i.group === 'next_step'), 'QL Tất cả');
  });

  // ================================================================== Task 7 · khai bậc Ý thức HS cũ · kỳ vọng đầu ra
  const xuLy: any = await import('../yThuc/xuLy.ts');
  check('VAI-a (7a) · Khai bậc Ý thức HV cũ: một việc mỗi lớp GVCN, em tạo trong 14 ngày còn khai được; khai xong → giảm; em tạo 20 ngày trước không tính; GVBM không có', () => {
    const cid = classId('MB FT 101');
    const viec = () => (mywork.myWork(P.coreTeacher).items as any[]).find((i) => i.group === 'khai_bac' && i.classId === cid);
    const n0 = viec()?.count ?? 0;
    const a = taoHv('MB FT 101', 'LT1'), b = taoHv('MB FT 101', 'LT1'), cu = taoHv('MB FT 101', 'LT1');
    try {
      conn.prepare('UPDATE students SET created_at = ? WHERE id IN (?, ?)').run(`${t.addDays(TODAY, -3)}T08:00:00.000Z`, a.sid, b.sid);
      conn.prepare('UPDATE students SET created_at = ? WHERE id = ?').run(`${t.addDays(TODAY, -20)}T08:00:00.000Z`, cu.sid);
      const v = viec();
      assert(v && v.count === n0 + 2, `hai em mới → +2: ${JSON.stringify(v)}`);
      assert(v.due === null && v.urgency === 'normal' && /^Xác nhận cấp bậc vi phạm HV cũ · MB FT 101 · \d+ em$/.test(v.tieuDe) && d.nhomViecCua(v.group) === 'y-thuc', 'chữ, nhóm, không hạn');
      xuLy.khaiBac(P.coreTeacher, a.sid, { bac: 1, ghiChu: 'Report 1 trước khi dùng web' });
      eq(viec()?.count ?? 0, n0 + 1, 'khai xong một em → giảm');
      assert(!(mywork.myWork(P.subjectTeacher).items as any[]).some((i) => i.group === 'khai_bac'), 'GVBM không có việc khai bậc');
    } finally { for (const x of [a, b, cu]) { conn.prepare('DELETE FROM y_thuc_khai_bac WHERE student_id = ?').run(x.sid); don(x.sid); } }
  });

  check('VAI-a (7b) · Kỳ vọng đầu ra (PR-KV): Σ số em trên dòng việc của QL MB = metricSet("hv-len-ft-chua-ky-vong", { branchId: MB }).n (hai đường); một dòng mỗi lớp; nhóm Vận hành; QL CP không thấy', () => {
    const hv = taoHv('MB BE 04', null);
    try {
      conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,2,'final',?,?, 'planned', ?)`).run(hv.cy, hv.sid, hv.cid, week.ensurePeriod(week.mondayOf(TODAY)).id, NOW);
      conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, tao_luc)
        VALUES (?, ?, 'fast_track', 'cuoi_khoa', ?, ?, ?, ?)`).run(hv.sid, hv.cid, t.addDays(week.mondayOf(TODAY), 7), P.mbManager.userId, TODAY, NOW);
      mt0Du(hv);
      const viec = (who: any, f: any = {}) => (mywork.myWork(who, f).items as any[]).filter((i) => i.group === 'ky_vong_dau_ra');
      const n = metricsSvc.metricSet(P.mbManager, 'hv-len-ft-chua-ky-vong', { branchId: MB }).n;
      assert(n >= 1, 'em vừa dựng phải vào tập');
      eq(viec(P.mbManager, { branchId: MB }).reduce((a, i) => a + i.count, 0), n, 'Σ em trên dòng việc = số chỉ số');
      assert(viec(P.mbManager).filter((i) => i.classId === hv.cid).length === 1, 'một dòng cho lớp');
      assert(viec(P.mbManager).some((i) => i.classId === hv.cid && d.nhomViecCua(i.group) === 'van-hanh'), 'nhóm Vận hành');
      assert(!viec(P.cpManager).some((i) => i.classId === hv.cid), 'QL CP không thấy lớp MB');
      assert(!viec(P.coreTeacher).length, 'GV không có việc này');
    } finally { don(hv.sid); }
  });

  // ================================================================== Task 8 · Tổng quan GV: Lớp tôi dạy
  check('VAI-a (8a) · lopToiDay: đúng các lớp có phân công hiệu lực hôm nay, theo khung; "Tôi dạy" có GVCN + môn; FT không tuần khoá, lớp thường không SOS', () => {
    const gv = loadPrincipal(P.coreTeacher.userId);   // nạp lại: phép kiểm trước có thể đã đổi phân công
    const ft = tq.lopToiDay(gv, { ct: 'ft' });
    const lopGv = new Set((conn.prepare(`SELECT ta.class_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND c.status = 'active' AND c.is_fast_track = 1
        AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)`).all(gv.userId, TODAY, TODAY) as any[]).map((r) => r.class_id));
    eq(sx(ft.rows.map((r: any) => r.classId)), sx([...lopGv] as number[]), 'hàng = lớp FT có phân công hiệu lực');
    const h101 = ft.rows.find((r: any) => r.classId === classId('MB FT 101'));
    assert(h101 && /^GVCN/.test(h101.toiDay) && h101.tuanHoc === null && typeof h101.sos === 'number', JSON.stringify(h101));
    const th = tq.lopToiDay(P.normalCoreTeacher, { ct: 'thuong' });
    assert(th.rows.length > 0 && th.rows.every((r: any) => r.sos === null && /^tuần \d+\/\d+$/.test(r.tuanHoc ?? 'tuần 0/0')), 'lớp thường: không SOS, có tuần n/y');
    eq([d.khungMacDinhGv(true, true), d.khungMacDinhGv(false, true), d.khungMacDinhGv(true, false)], ['ft', 'thuong', 'ft'], 'khung mặc định');
  });

  check('VAI-a (8b) · hai đường: số mỗi ô = số dòng oLopToiDay; Σ hàng ⊆ tập metricSet cùng khung; phủ định — lớp không dạy → 403, GV khác không có hàng', () => {
    const gv = P.coreTeacher;
    const r = tq.lopToiDay(gv, { ct: 'ft' });
    const tap: Record<string, Set<number>> = {
      duoiKyVong: new Set(metricsSvc.metricSet(gv, 'hv-duoi-ky-vong-mon', { program: 'ft' }).ids),
      sos: new Set(metricsSvc.metricSet(gv, 'hv-sos-hien-tai', { program: 'ft' }).ids),
      caseMo: new Set(metricsSvc.metricSet(gv, 'case-mo', { program: 'ft' }).ids),
    };
    let tong = 0;
    for (const h of r.rows) {
      for (const cot of ['duoiKyVong', 'sos', 'caseMo'] as const) {
        const o = tq.oLopToiDay(gv, { ct: 'ft', classId: h.classId, cot });
        eq(o.n, h[cot], `${h.code} ${cot}: ô = số dòng`);
        eq(o.rows.length, o.n, `${h.code} ${cot}: n = rows`);
        assert(o.rows.every((x: any) => tap[cot].has(x.id)), `${h.code} ${cot}: dòng ngoài tập chỉ số`);
        tong += o.n;
      }
    }
    assert(tong > 0, 'bộ demo: lớp GVCN MB FT 101 phải có số để kiểm');
    const khongDay = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 1 AND id NOT IN
      (SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active') LIMIT 1`).get(gv.userId) as any).id;
    assertThrows(() => tq.oLopToiDay(gv, { ct: 'ft', classId: khongDay, cot: 'duoiKyVong' }), /không dạy/, 'lớp không dạy → 403');
    assertThrows(() => tq.oLopToiDay(gv, { ct: 'ft', classId: classId('MB FT 101'), cot: 'xyz' }), /không hợp lệ/, 'cột lạ → 400');
    assert(!tq.lopToiDay(P.w2Teacher, { ct: 'thuong' }).rows.some((x: any) => x.classId === classId('MB FOU 12')), 'GV không dạy MB FOU 12 không có hàng');
    assert(!('hocVienCanHoTro' in tq), 'khối Học viên cần hỗ trợ đã bỏ');
  });

  /* PR-S6F-b (D10): "Bài chờ chấm" đếm BÀI ở máy chủ (cùng hàm cột hồ sơ GV), không còn cộng `count` (số em) của việc Chấm điểm — sửa kỳ vọng, giữ phép kiểm. */
  check('VAI-a (8c) → S6F-b D10 · Bài chờ chấm / quá hạn của Lớp tôi dạy = số ô điểm (bài) của chính GV ở lớp đó; quá hạn ⊆ chờ chấm', () => {
    const p = P.coreTeacher;
    const rows = tq.lopToiDay(p, { ct: 'ft' }).rows as any[];
    const no = (debt.scoreDebtCells(p, TODAY, null) as any[]).filter((c) => c.userId === p.userId);
    for (const h of rows) {
      const cua = no.filter((c) => c.classId === h.classId);
      eq([h.baiCho, h.baiQuaHan], [cua.length, cua.filter((c) => c.overdue).length], `${h.code}: bài chờ chấm / quá hạn`);
      assert(h.baiQuaHan <= h.baiCho, 'quá hạn ⊆ chờ chấm');
    }
  });

  // ================================================================== Task 9 · điện thoại + badge
  check('VAI-a (9a) · baViecDau: 3 phần tử đầu của danh sách trongKhoiHomNay, quá hạn lâu nhất → hôm nay → hạn gần; soXemHet = số chip "Đến hết tuần"', () => {
    const hn = '2026-09-16';
    const v = (key: string, urgency: string, due: string | null) => ({ key, urgency, due, group: 'score' });
    const ds = [v('a', 'normal', '2026-09-19'), v('b', 'overdue', '2026-09-14'), v('c', 'today', hn), v('d', 'overdue', '2026-09-08'),
      v('e', 'normal', null), v('f', 'normal', '2026-09-22')];
    const r = d.baViecDau(ds, hn);
    eq(r.ds.map((x: any) => x.key), ['d', 'b', 'c'], 'thứ tự');
    eq(r.soXemHet, ds.filter((x) => d.khopLocNhanh(x, 'den-het-tuan', hn)).length, 'Xem hết (n) = chip Đến hết tuần');
    eq(r.soXemHet, 4, 'đếm đúng');
  });

  /* PR-S6F-b (D14): `/my-work/dem` bỏ — App đọc `summary.overdue` của `/my-work` (sửa kỳ vọng, giữ phép kiểm). */
  check('VAI-a (9b) → S6F-b D14 · badge GV = myWork(p).summary.overdue đọc từ /my-work; App đọc cho GV, số đỏ cả thanh trên và thanh dưới', () => {
    const src = fs.readFileSync(pathM.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    assert(!src.includes("api.get('/my-work/dem'"), 'route /my-work/dem đã bỏ');
    for (const gv of [P.coreTeacher, P.subjectTeacher]) assert(Number.isInteger((mywork.myWork(gv) as any).summary.overdue), 'summary.overdue');
    const app = fs.readFileSync(pathM.join(REPO, 'web/src/App.tsx'), 'utf8');
    assert(/'\/my-work'/.test(app) && /summary\?\.overdue/.test(app) && /<NavItem[^>]*so=\{so\}/.test(app) && /<NutDay[^>]*so=\{so\}/.test(app) && /việc quá hạn/.test(app), 'badge GV ở hai thanh');
  });

  // ================================================================== Task 10 · chuông
  const thongBaoSvc: any = await import('../platform/thongBao.ts');
  const tbMoi = (userId: number, kind: string, entityType: string | null, entityId: number | null, readAt: string | null = null) =>
    Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, read_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(userId, kind, `thử ${kind}`, null, entityType, entityId, `vaia:${kind}:${Math.random()}`, readAt, NOW).lastInsertRowid);

  check('VAI-a (10a) · nhomThongBao: bảng Cần làm / Để biết; loại lạ → Để biết; con_viec = 0 → Để biết', () => {
    for (const k of ['nhac_viec', 'nhac_ban_giao', 'duyet_moi', 'duyet_qua_han', 'duyet_tu_choi', 'sos', 'discipline', 'schedule_move', 'phoi_hop', 'dang_ky', 'lenh_loi', 'ban_giao', 'bao_len']) {
      eq(d.nhomThongBao({ kind: k }), 'can-lam', k);
    }
    for (const k of ['duyet_ket_qua', 'duyet_tu_duyet', 'transfer_in', 'sap_nhan', 'huy_lenh', 'bo_tro_mien_phi', 'discipline_de_biet', 'tu_doi_lich', 'loai-la']) {
      eq(d.nhomThongBao({ kind: k }), 'de-biet', k);
    }
    eq(d.nhomThongBao({ kind: 'sos', con_viec: 0 }), 'de-biet', 'việc đã xong rời Cần làm');
    eq(d.nhomThongBao({ kind: 'sos', con_viec: 1 }), 'can-lam', 'việc còn chờ ở Cần làm');
  });

  check('VAI-a (10b) · thongBaoCua: Case đã có nguyên nhân / thẻ không còn chờ → con_viec 0 (cùng câu, một SQL); chưa đọc trước; ≤ 50', () => {
    const u = P.lrTeacher.userId;
    /* OV-11g: cùng điều kiện `con_viec` (Case SOS, không chờ "Không cần theo dõi") — Case Giữa khoá tự tạo / chờ bỏ theo dõi không phải "chờ nguyên nhân". */
    const caseCho = (conn.prepare(`SELECT sc.id FROM sos_cases sc LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id WHERE sc.status != 'done'
      AND ${LA_CASE_SOS('sc')} AND NOT ${CO_THE_KHONG_THEO_DOI('sc')} AND NOT EXISTS
      (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') LIMIT 1`).get() as any)?.id;
    const caseXong = (conn.prepare(`SELECT sc.id FROM sos_cases sc WHERE EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') LIMIT 1`).get() as any)?.id;
    assert(caseCho && caseXong, 'bộ demo phải có Case chờ nguyên nhân và Case đã có nguyên nhân');
    /* Cả hai chưa đọc: người này có thể có > 50 dòng chưa đọc, dòng đã đọc sẽ bị đẩy khỏi danh sách. */
    const ids = [tbMoi(u, 'sos', 'sos_case', caseCho), tbMoi(u, 'sos', 'sos_case', caseXong)];
    try {
      const ds = thongBaoSvc.thongBaoCua(u) as any[];
      const a = ds.find((x) => x.id === ids[0]), b = ds.find((x) => x.id === ids[1]);
      eq([a?.con_viec, b?.con_viec], [1, 0], 'con_viec');
      eq([d.nhomThongBao(a), d.nhomThongBao(b)], ['can-lam', 'de-biet'], 'nhóm theo việc còn / xong');
      assert(a.ten_hv !== undefined && 'mon' in a && 'lop' in a, 'có tên em, môn, lớp');
      const chuaDoc = ds.map((x) => !x.read_at);
      assert(chuaDoc.every((v, i) => i === 0 || chuaDoc[i - 1] || !v), 'mọi dòng chưa đọc đứng trước');
      assert(ds.length <= thongBaoSvc.THONG_BAO_TOI_DA && thongBaoSvc.THONG_BAO_TOI_DA === 50, 'tối đa 50');
    } finally { for (const id of ids) conn.prepare('DELETE FROM notifications WHERE id = ?').run(id); }
  });

  check('VAI-a (10c) · noiDenThongBao: "Hồ sơ {HV} › Case {môn}", Yêu cầu của tôi, Chờ duyệt, Lớp › Ý thức, Quản trị › Tài khoản', () => {
    const base = { entity_id: 7, student_id: 3, attempt_id: null, ten_hv: 'Vũ Ngọc Lan', mon: 'Reading', lop: 'MB FT 101' };
    eq(d.noiDenThongBao({ ...base, entity_type: 'sos_case', kind: 'sos' }), 'Hồ sơ Vũ Ngọc Lan › Case Reading', 'Case');
    eq(d.noiDenThongBao({ ...base, entity_type: 'yeu_cau_duyet', kind: 'duyet_tu_choi' }), 'Công việc › Yêu cầu của tôi', 'từ chối');
    eq(d.noiDenThongBao({ ...base, entity_type: 'yeu_cau_duyet', kind: 'duyet_moi' }), 'Công việc › Chờ duyệt', 'thẻ mới');
    eq(d.noiDenThongBao({ ...base, entity_type: 'discipline_measure', kind: 'discipline', duong: '/hoc-vien/lop/5?tab=y-thuc&hv=3&mo=xu-ly' }), 'Lớp MB FT 101 › Ý thức', 'Ý thức lớp');
    eq(d.noiDenThongBao({ ...base, entity_type: 'user', kind: 'dang_ky' }), 'Quản trị › Tài khoản', 'đăng ký');
    eq(d.duongThongBao({ ...base, entity_type: 'yeu_cau_duyet', kind: 'duyet_tu_choi' }), d.duongThe(7, 'nguoi-xin'), 'từ chối về Yêu cầu của tôi');
    eq(d.duongThongBao({ ...base, entity_type: 'assessment_attempt', kind: 'tu_doi_lich', attempt_id: 20 }), '/mock-test/20', 'tự dời như schedule_move');
    eq(d.noiDenThongBao({ ...base, entity_type: 'khong-ro', kind: 'x' }), null, 'không đích → null');
  });

  check('VAI-a (10d) · Đọc hết: mọi dòng chưa đọc của người gọi có read_at, trả số dòng; của người khác không đổi (phủ định)', () => {
    const toi = P.lrTeacher.userId, khac = P.w2Teacher.userId;
    const a = tbMoi(toi, 'nhac_viec', null, null), b = tbMoi(khac, 'nhac_viec', null, null);
    try {
      const truoc = (conn.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL').get(toi) as any).n;
      eq(thongBaoSvc.docHet(toi, TODAY), truoc, 'trả đúng số dòng đã đánh dấu');
      eq((conn.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL').get(toi) as any).n, 0, 'hết chưa đọc');
      assert((conn.prepare('SELECT read_at FROM notifications WHERE id = ?').get(b) as any).read_at === null, 'thông báo người khác không đổi');
      assert(!!conn.prepare('SELECT 1 FROM notifications WHERE id = ?').get(a), 'không xoá dòng');
    } finally { conn.prepare('DELETE FROM notifications WHERE id IN (?, ?)').run(a, b); }
  });

  check('VAI-a (10e) · Q19–Q20: bốn loại tách tên; không còn tiêu đề "Lịch thi cần xử lý"; Case mới nói "Xác nhận nguyên nhân {môn} — {HV} · {lớp}"', () => {
    const doc = (p: string) => fs.readFileSync(pathM.join(REPO, p), 'utf8');
    assert(!/'Lịch thi cần xử lý'/.test(doc('server/src/fasttrack/absence.ts')), 'absence.ts còn tiêu đề cũ');
    assert(/kind: 'tu_doi_lich'/.test(doc('server/src/fasttrack/absence.ts')), 'tu_doi_lich');
    assert(/kind: 'discipline_de_biet'/.test(doc('server/src/yThuc/xuLy.ts')), 'discipline_de_biet');
    assert(/'bo_tro_mien_phi', 'Mang theo PA Bổ trợ miễn phí'/.test(doc('server/src/normal/cuoiKhoa.ts')), 'bo_tro_mien_phi');
    assert(/'duyet_tu_choi' : 'duyet_ket_qua'/.test(doc('server/src/duyet/yeuCau.ts')), 'duyet_tu_choi');
    assert(/title: `Xác nhận nguyên nhân \$\{input\.skillLabel\} · /.test(doc('server/src/cases/sosAuto.ts')), 'tiêu đề Case mới');
  });

  // ================================================================== Task 11 · dòng Nợ ghi tên GV · sắp lớp soSanhLop
  const canCham: any = await import('../cham/canCham.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  check('VAI-a (11a) · dòng Nợ: gvNo = tên GV phụ trách các ô còn nợ (pendingOwners), sắp theo tên, không trùng; chưa phân công ghi rõ', () => {
    const tuanNay = week.mondayOf(TODAY);
    const lop = new Set<number>((conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND branch_id = ?`).all(MB) as any[]).map((r) => r.id));
    /* PR-LT3: khối 1 "Test quá hạn chấm" (`noQuaHan`, theo hôm nay) — chỉ ô `khoiCham` = 'qua-han'. */
    const no = canCham.noQuaHan(P.mbManager, { branchId: MB, classIds: lop, lopCuaToi: new Set() }, TODAY);
    assert(no.dong.length > 0, 'bộ demo MB phải có dòng Nợ tuần trước');
    const rows = (attemptsSvc.listAttempts(P.mbManager, { branchId: MB, scope: 'managed' }).rows as any[]);
    for (const d0 of no.dong) {
      const ten = new Set<string>(); let chua = false; let cc = false;
      for (const a of rows.filter((x) => d0.attemptIds.includes(x.id))) {
        for (const x of (a.pendingDetail ?? []) as any[]) {
          if (!x.weekStart || d.khoiCham({ tuanThi: x.weekStart, tuanHomNay: tuanNay, quaHan: x.overdue }) !== 'qua-han'
            || (x.periodId ?? 0) !== (d0.periodId ?? 0)) continue;
          const g = (a.pendingOwners ?? {})[x.skill] ?? null;
          if (g === d.CHAM_CHEO) cc = true; else if (g) ten.add(g); else chua = true;
        }
      }
      eq(d0.gvNo, [...[...ten].sort((x, y) => x.localeCompare(y, 'vi')), ...(cc ? [d.CHAM_CHEO] : []), ...(chua ? ['chưa phân công'] : [])], `${d0.classCode} ${d0.dotLabel}`);
    }
  });

  check('VAI-a (11b) · việc "Điền target": sắp lớp soSanhLop (MB FT 9 trước MB FT 10), rồi tên', () => {
    const src = fs.readFileSync(pathM.join(REPO, 'server/src/worklist/mywork.ts'), 'utf8');
    const khoi = src.slice(src.indexOf('K5-09: HỌC VIÊN FT CHƯA CÓ TARGET'), src.indexOf("key: `target:${h.id}`"));
    assert(!/ORDER BY c\.code/.test(khoi) && /soSanhLop\(\{ code: x\.class_code \}, \{ code: y\.class_code \}\)/.test(khoi), 'sắp bằng soSanhLop');
    eq(['MB FT 10', 'MB FT 9'].sort((a, b) => d.soSanhLop({ code: a }, { code: b })), ['MB FT 9', 'MB FT 10'], 'soSanhLop');
  });
}
