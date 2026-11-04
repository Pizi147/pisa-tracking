/**
 * PHÉP KIỂM OV-13l — Chuyển lớp "Ngay hôm nay" (thi hành ngay trong cùng request, không hoàn tác) · hạn bàn giao 7 ngày (không sớm hơn mốc cũ,
 * GVBM = GVCN, migrate `prOv13l`) · điểm / lượt / Case của lộ trình đang chạy đi theo em (FT → FT khác lộ trình giữ lộ trình) · rủi ro giữa tuần:
 * "-" đã dời không treo ở lớp cũ, lớp thường đích không tự xếp bài tuần đang dở, lớp nguồn tự kết thúc đúng ngày. Theo hành vi trên DB kiểm + HTTP.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13lTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays } = t;
  console.log('\nOV-13l · Chuyển lớp "Ngay hôm nay" · hạn bàn giao 7 ngày · điểm đi theo lộ trình');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const debt: any = await import('../worklist/scoreDebt.ts');
  const mig: any = await import('../migrate/prOv13l.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const T2 = week.mondayOf(TODAY) as string;
  const THU5 = addDays(T2, 3) as string;   // Thứ Năm tuần này — "Ngay hôm nay" giữa tuần
  const NOW = new Date().toISOString();
  /** Trần câu SQL mỗi em của đường chuyển ngay (web gửi lô `LO_CHUYEN_NGAY` em / lời gọi). */
  const TRAN_CHUYEN_NGAY_EM = 125;
  const thu2 = (n: number) => addDays(T2, -7 * (n - 1));
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  /** Chạy `fn` với ngày demo = `ngay` (máy chủ đọc `demoToday()`), trả lại ngày cũ kể cả khi lỗi. */
  const voiNgay = async <T>(ngay: string, fn: () => T | Promise<T>): Promise<T> => {
    const cu = getConfig('demo_date');
    setConfig('demo_date', ngay);
    try { return await fn(); } finally { setConfig('demo_date', cu); }
  };

  let seq = 0;
  const lop = (kind: 'FOU' | 'BE' | 'ELE' | 'FT', tuan = 1, route: string | null = kind === 'FT' ? 'LT1' : null) => {
    seq += 1;
    const start = thu2(tuan);
    const c = intake.createClass(P.admin, {
      code: `MB L13-${seq} ${kind}`, branchId: MB, kind, isFastTrack: kind === 'FT', route, startDate: start, startPeriodId: week.ensurePeriod(start).id,
    });
    return c.id as number;
  };
  const em = (classId: number, o: { ft?: boolean; ma?: string | null; route?: string | null } = {}) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-L13${seq}`, `Học viên L13 ${seq}`, `hoc vien l13 ${seq}`, MB, NOW).lastInsertRowid);
    const bd = thu2(6);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId, bd, NOW);
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at) VALUES (?,1,?,?,6,?,?, 'active', ?)`)
      .run(sid, o.ft ? (o.route ?? 'LT1') : null, o.ft ? null : (o.ma ?? null), week.ensurePeriod(bd).id, bd, NOW).lastInsertRowid);
    return { sid, cyc };
  };
  const ganGvcn = (classId: number, n: number) => {
    const uid = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1, '2026-01-01', 'active', ?)`).run(uid, classId, NOW);
    return uid;
  };
  const luot = (cyc: number, sid: number, classId: number, no: number, status = 'planned') => Number(conn.prepare(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,'mock',?,?,?,?)`,
  ).run(cyc, sid, no, classId, week.ensurePeriod(T2).id, status, NOW).lastInsertRowid);
  const ra = (nguon: number, boiCanh: string, dong: Record<string, unknown>, p = QL) =>
    lenh.raLenh(p, { lopNguonId: nguon, boiCanh, tuanChung: null, dongs: [{ lyDo: 'Phụ huynh xin đổi giờ', ...dong }] });
  const ghiDanh = (sid: number) => get(`SELECT * FROM enrollments WHERE student_id = ? AND status = 'active'`, sid);
  const khoa = (sid: number) => get(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);

  // ------------------------------------------------------------------ luật chung (web + máy chủ)
  check('L13-1 · tuanHopLe: "Ngay hôm nay" (đúng hôm nay, không lùi Thứ Hai) + Thứ Hai sau tuần này; Thứ Hai tuần này / hôm qua → sai', () => {
    assert(d.tuanHopLe(THU5, THU5) && d.laChuyenNgay(THU5, THU5), 'hôm nay hợp lệ');
    assert(!d.tuanHopLe(T2, THU5) && !d.tuanHopLe(addDays(THU5, -1), THU5) && !d.tuanHopLe(addDays(THU5, 1), THU5), 'Thứ Hai tuần này / hôm qua / mai');
    assert(d.tuanHopLe(addDays(T2, 7), THU5), 'Thứ Hai tuần sau');
    assert(d.kiemDongLenh({ huong: 'chuyen_lop', lopDichId: 5, lopDichFt: true, nguonFt: true, tuan: T2, homNay: THU5, lyDo: 'x', khacGoiY: false, mucTieu: null, ngayXemLai: null }) === d.LOI_TUAN_BAT_DAU, 'câu lỗi');
    assert(d.nhanTuanBatDau(THU5, THU5) === `Ngay hôm nay · T5 ${THU5.slice(8, 10)}/${THU5.slice(5, 7)}`, d.nhanTuanBatDau(THU5, THU5));
  });
  check('L13-2 · hanBanGiaoLenh: mọi lệnh ≥ ra lệnh + 7 ngày (tính cả ngày ra lệnh), GVBM = GVCN; Cuối khoá giữ mốc hết tuần Final khi muộn hơn', () => {
    const bay = addDays(THU5, 6);
    for (const o of [{ nguonFt: true, boiCanh: 'giua-khoa', tuanFinal: null }, { nguonFt: false, boiCanh: 'giua-khoa', tuanFinal: null }, { nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: addDays(T2, -7) }]) {
      const h = d.hanBanGiaoLenh({ ...o, ngay: THU5 });
      assert(h.gvbm === bay && h.gvcn === bay, `${JSON.stringify(o)} → ${JSON.stringify(h)}`);
    }
    const xa = d.hanBanGiaoLenh({ nguonFt: false, boiCanh: 'cuoi-khoa', tuanFinal: addDays(T2, 14), ngay: THU5 });
    assert(xa.gvbm === addDays(T2, 20) && xa.gvcn === addDays(T2, 20), `Final xa: ${JSON.stringify(xa)}`);
  });

  // ------------------------------------------------------------------ chuyển ngay — FT → FT cùng lộ trình
  const FT_A = lop('FT', 7), FT_B = lop('FT', 3);
  const gvcnB = ganGvcn(FT_B, 2);
  const a = em(FT_A, { ft: true });
  const daThi = luot(a.cyc, a.sid, FT_A, 1, 'done');
  conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 6, ?)`).run(daThi, NOW);
  const chuaThi = luot(a.cyc, a.sid, FT_A, 2);
  /* Lượt MT đang dở tuần này: GV lớp cũ đã nhập L + nhận xét (chủ SP: đi theo em, điểm + người nhập giữ nguyên). */
  const dangDo = luot(a.cyc, a.sid, FT_A, 3);
  const gvCu = ganGvcn(FT_A, 1);
  conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, comment, entered_by, entered_at) VALUES (?, 'listening', 5.5, 'Nghe sót số', ?, ?)`).run(dangDo, gvCu, NOW);
  const caseA = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at) VALUES (?,?, 'listening', 'listening', 'teacher_report', 'open', 1, ?, ?)`)
    .run(a.sid, a.cyc, TODAY, NOW).lastInsertRowid);
  await checkAsync('L13-3 · Ngay hôm nay (Thứ Năm): đã chuyển trong cùng lần lưu — ghi danh cũ đóng / mới mở từ hôm nay, lộ trình giữ id, điểm đã có ở lớp cũ, bài chưa thi sang lớp mới, Case đi theo, hạn 7 ngày, "Đã nhận"', async () => {
    const r = await voiNgay(THU5, () => ra(FT_A, 'giua-khoa', { studentId: a.sid, huong: 'chuyen_lop', toClassId: FT_B, tuan: THU5 }));
    assert(r.failed.length === 0 && r.daChuyen.includes(a.sid), JSON.stringify(r));
    const l = lenhCua(a.sid);
    assert(l.trang_thai === 'da_chuyen' && l.tuan_bat_dau === THU5 && l.han_gvbm === addDays(THU5, 6) && l.han_gvcn === addDays(THU5, 6), JSON.stringify(l));
    const g = ghiDanh(a.sid), cu = get(`SELECT * FROM enrollments WHERE student_id = ? AND class_id = ?`, a.sid, FT_A);
    assert(g.class_id === FT_B && g.started_at === THU5 && cu.status === 'transferred' && cu.ended_at === THU5, JSON.stringify([g, cu]));
    assert(khoa(a.sid).id === a.cyc, 'lộ trình giữ nguyên id');
    assert(get('SELECT class_id FROM assessment_attempts WHERE id = ?', daThi).class_id === FT_A, 'lượt đã thi ở lại lớp cũ');
    assert(get('SELECT class_id, cycle_id FROM assessment_attempts WHERE id = ?', chuaThi).class_id === FT_B, 'lượt chưa thi sang lớp mới');
    const dd = get(`SELECT a.class_id, a.status, s.band, s.comment, s.entered_by FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id WHERE a.id = ?`, dangDo);
    assert(dd.class_id === FT_B && dd.status === 'planned' && dd.band === 5.5 && dd.comment === 'Nghe sót số' && dd.entered_by === gvCu, `lượt dở có điểm: ${JSON.stringify(dd)}`);
    assert(get('SELECT status, cycle_id FROM sos_cases WHERE id = ?', caseA).status === 'open', 'Case đi theo em');
    const ch = all(`SELECT title FROM notifications WHERE user_id = ? AND kind = 'sap_nhan' AND entity_id = ?`, gvcnB, FT_B).map((x) => x.title);
    assert(ch.length === 1 && /^Đã nhận 1 em vào lớp/.test(ch[0]), `chuông GVCN lớp mới: ${JSON.stringify(ch)}`);
  });

  // ------------------------------------------------------------------ chuyển ngay — FT → FT khác lộ trình (điểm đi theo)
  await checkAsync('L13-4 · FT LT1 → FT LT2 ngay hôm nay: GIỮ lộ trình (cùng id, đổi mã LT2), điểm + lượt + Case giữ lộ trình, không mở lộ trình mới', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2, 'LT2');
    const b = em(nguon, { ft: true });
    const x = luot(b.cyc, b.sid, nguon, 1, 'done');
    await voiNgay(THU5, () => ra(nguon, 'giua-khoa', { studentId: b.sid, huong: 'chuyen_lop', toClassId: dich, tuan: THU5 }));
    const k = khoa(b.sid);
    assert(k.id === b.cyc && k.route === 'LT2', JSON.stringify(k));
    assert(get('SELECT COUNT(*) n FROM learning_cycles WHERE student_id = ?', b.sid).n === 1, 'không mở lộ trình mới');
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', x).cycle_id === b.cyc, 'điểm vẫn thuộc lộ trình đang chạy');
  });

  // ------------------------------------------------------------------ tuần sau như cũ
  await checkAsync('L13-5 · chọn tuần sau → như cũ: lệnh chờ, chưa chuyển, hạn 7 ngày; hôm sau sửa sang "Ngay hôm nay" → chuyển luôn, chuông "Sắp nhận" cũ thành "Đã nhận"', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const gvDich = ganGvcn(dich, 2);
    const c = em(nguon, { ft: true });
    const sau = d.tuanChonDuoc(THU5)[0];
    await voiNgay(T2, () => ra(nguon, 'giua-khoa', { studentId: c.sid, huong: 'chuyen_lop', toClassId: dich, tuan: sau }));   // ra lệnh Thứ Hai → chuông "Sắp nhận"
    const r = await voiNgay(THU5, () => ra(nguon, 'giua-khoa', { studentId: c.sid, huong: 'chuyen_lop', toClassId: dich, tuan: sau }));
    const l = lenhCua(c.sid);
    assert(r.daChuyen.length === 0 && l.trang_thai === 'cho' && ghiDanh(c.sid).class_id === nguon, JSON.stringify(l));
    assert(l.han_gvbm === addDays(T2, 6) && l.han_gvcn === addDays(T2, 6), `hạn theo ngày ra lệnh đầu (sửa không lùi hạn): ${l.han_gvbm} / ${l.han_gvcn}`);
    await voiNgay(THU5, () => lenh.suaLenh(QL, l.id, { tuan: THU5 }));
    assert(lenhCua(c.sid).trang_thai === 'da_chuyen' && ghiDanh(c.sid).class_id === dich, 'sửa sang hôm nay = chuyển ngay');
    const ch = all(`SELECT title FROM notifications WHERE user_id = ? AND kind = 'sap_nhan' AND entity_id = ?`, gvDich, dich).map((x) => x.title);
    assert(ch.length >= 1 && ch.every((x) => /^Đã nhận/.test(x)), `chuông cũ "Sắp nhận" phải thành "Đã nhận": ${JSON.stringify(ch)}`);
  });
  await checkAsync('L13-6 · quyền như cũ: GVCN lớp nguồn ra lệnh "Ngay hôm nay" → 403, không chuyển', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const gv = loadPrincipal(ganGvcn(nguon, 1));
    const e = em(nguon, { ft: true });
    const x = await voiNgay(THU5, () => loi(() => ra(nguon, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: dich, tuan: THU5 }, gv)));
    assert(x?.status === 403 && ghiDanh(e.sid).class_id === nguon, `${x?.status} ${x?.message}`);
  });

  // ------------------------------------------------------------------ rủi ro giữa tuần
  await checkAsync('L13-7 · "-" đã dời sang tuần sau (lượt chưa xong): đi theo em sang lớp mới — không treo nợ ở lớp cũ', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const e = em(nguon, { ft: true });
    const id = luot(e.cyc, e.sid, nguon, 1);
    const sau = week.ensurePeriod(addDays(T2, 7)).id;
    conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at) VALUES (?, 'listening', 1, ?, 'manual', 'scheduled', ?)`).run(id, sau, NOW);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'reading', 6, ?)`).run(id, NOW);
    await voiNgay(THU5, () => ra(nguon, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: dich, tuan: THU5 }));
    assert(get('SELECT class_id FROM assessment_attempts WHERE id = ?', id).class_id === dich, 'lượt dở sang lớp mới');
    const no = debt.scoreDebtCells(P.admin, addDays(T2, 14), null).filter((x: any) => x.attemptId === id);
    assert(no.every((x: any) => x.classId === dich), `nợ ở lớp cũ: ${JSON.stringify(no)}`);
  });
  await checkAsync('L13-8 · FT → lớp thường giữa tuần (đổi chương trình: đóng khoá cũ, mở khoá mới): bài TUẦN NÀY của lớp mới VẪN có, chỉ bỏ tuần đã qua', async () => {
    const nguon = lop('FT', 5), ele = lop('ELE', 5);   // ELE tuần 5 = tuần Progress Test
    const e = em(nguon, { ft: true });
    await voiNgay(THU5, () => ra(nguon, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: ele, tuan: THU5 }));
    const moi = khoa(e.sid);
    assert(moi.id !== e.cyc && moi.route === null, `khoá ELE mới: ${JSON.stringify(moi)}`);
    const bai = all(`SELECT a.kind, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.cycle_id = ?`, moi.id);
    assert(bai.some((b) => b.kind === 'progress' && b.week_start === T2) && bai.some((b) => b.kind === 'final') && !bai.some((b) => b.week_start < T2), JSON.stringify(bai));
    assert(get('SELECT status FROM learning_cycles WHERE id = ?', e.cyc).status === 'completed', 'khoá FT cũ đóng (đổi chương trình)');
  });
  await checkAsync('L13-9 · lớp thường đã hết khoá, em cuối chuyển "Ngay hôm nay" → lớp nguồn tự kết thúc đúng hôm nay', async () => {
    const fou = lop('FOU', 10), be = lop('BE', 1);
    const e = em(fou, { ma: 'FOU' });
    const r = await voiNgay(THU5, () => ra(fou, 'cuoi-khoa', { studentId: e.sid, huong: 'len_lop', toClassId: be, tuan: THU5 }));
    assert(r.daChuyen.includes(e.sid) && ghiDanh(e.sid).class_id === be, JSON.stringify(r));
    const c = get('SELECT status, finished_at FROM classes WHERE id = ?', fou);
    assert(c.status === 'finished' && c.finished_at === THU5, JSON.stringify(c));
  });

  await checkAsync('L13-12 · lớp thường ĐANG ở tuần Final (chưa hết khoá), em cuối chuyển "Ngay hôm nay" → lớp tự kết thúc hôm nay, không còn "đang học" 0 em', async () => {
    const fou = lop('FOU', 8), be = lop('BE', 1);   // FOU 8 tuần: tuần 8 = tuần Final
    const e = em(fou, { ma: 'FOU' });
    await voiNgay(THU5, () => ra(fou, 'cuoi-khoa', { studentId: e.sid, huong: 'len_lop', toClassId: be, tuan: THU5 }));
    const c = get('SELECT status, finished_at FROM classes WHERE id = ?', fou);
    assert(c.status === 'finished' && c.finished_at === THU5, JSON.stringify(c));
  });
  await checkAsync('L13-13 · Case: LT1 → LT2 → LT1 cùng ngày đủ hai mốc "Sang lộ trình"', async () => {
    const l1 = lop('FT', 5), l2 = lop('FT', 2, 'LT2'), l1b = lop('FT', 2);
    const e = em(l1, { ft: true });
    const c = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at) VALUES (?,?, 'reading', 'reading', 'teacher_report', 'open', 1, ?, ?)`)
      .run(e.sid, e.cyc, TODAY, NOW).lastInsertRowid);
    await voiNgay(THU5, () => ra(l1, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: l2, tuan: THU5 }));
    await voiNgay(THU5, () => ra(l2, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: l1b, tuan: THU5 }));
    const m = all(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'route_changed' ORDER BY id`, c).map((x) => x.note);
    assert(m.join('|') === 'Sang lộ trình LT2|Sang lộ trình LT1' && khoa(e.sid).route === 'LT1', JSON.stringify(m));
  });
  await checkAsync('L13-14 · GVCN đề xuất "Ngay hôm nay" (T5), QL duyệt hôm sau (T6) → chuyển ngay ngày duyệt, không báo lỗi tuần', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const gv = loadPrincipal(ganGvcn(nguon, 1));
    const e = em(nguon, { ft: true });
    const { id } = await voiNgay(THU5, () => lenh.guiDeXuatChuyenLop(gv, e.sid, { toClassId: dich, tuan: THU5, lyDo: 'Đổi giờ học' }));
    const T6 = addDays(THU5, 1);
    await voiNgay(T6, () => lenh.apDungDeXuatChuyenLop(QL, { id, hoc_vien_id: e.sid, ly_do: 'Đổi giờ học' }, { lopDichId: dich, tuan: THU5 }));
    const l = lenhCua(e.sid);
    assert(l.trang_thai === 'da_chuyen' && l.tuan_bat_dau === T6 && ghiDanh(e.sid).class_id === dich, JSON.stringify(l));
  });
  await checkAsync('L13-15 · sắp hết giờ lời gọi (< 4 s) → em "Ngay hôm nay" chưa ghi, trả "Chưa kịp chuyển — gửi lại"; em tuần sau vẫn lưu', async () => {
    const hanGio: any = await import('../platform/hanGio.ts');
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const x = em(nguon, { ft: true }), y = em(nguon, { ft: true });
    const r = await voiNgay(THU5, () => hanGio.chayVoiHan(Date.now() + 3_500, () => lenh.raLenh(QL, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: [
      { studentId: x.sid, huong: 'chuyen_lop', toClassId: dich, tuan: THU5, lyDo: 'gộp' },
      { studentId: y.sid, huong: 'chuyen_lop', toClassId: dich, tuan: d.tuanChonDuoc(THU5)[0], lyDo: 'gộp' },
    ] })));
    assert(r.failed.length === 1 && r.failed[0].studentId === x.sid && /Chưa kịp/.test(r.failed[0].message) && r.ok.join() === String(y.sid), JSON.stringify(r));
    assert(!lenhCua(x.sid) && ghiDanh(x.sid).class_id === nguon && lenhCua(y.sid).trang_thai === 'cho', 'em chuyển ngay chưa ghi gì');
  });
  await checkAsync(`L13-16 · tốc độ: chuyển ngay một lô ${d.LO_CHUYEN_NGAY} em ≤ ${TRAN_CHUYEN_NGAY_EM} câu SQL / em`, async () => {
    const { soCauSql } = await import('../platform/nguCanhRequest.ts');
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const ems = Array.from({ length: d.LO_CHUYEN_NGAY }, () => em(nguon, { ft: true }));
    for (const e of ems) luot(e.cyc, e.sid, nguon, 1);
    const s0 = soCauSql();
    await voiNgay(THU5, () => lenh.raLenh(QL, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null,
      dongs: ems.map((e) => ({ studentId: e.sid, huong: 'chuyen_lop', toClassId: dich, tuan: THU5, lyDo: 'gộp lớp' })) }));
    const moiEm = Math.ceil((soCauSql() - s0) / ems.length);
    console.log(`      (đo: ${moiEm} câu / em)`);
    assert(moiEm <= TRAN_CHUYEN_NGAY_EM && ems.every((e) => ghiDanh(e.sid).class_id === dich), `${moiEm} câu / em`);
  });

  // ------------------------------------------------------------------ migrate hạn bàn giao
  check('L13-10 · migrate prOv13l: lệnh chờ chưa xác nhận → hạn = muộn hơn của (ra lệnh + 7 ngày) và hạn cũ, GVBM = GVCN; đã xác nhận / đã chuyển không đổi; chạy lại không đổi gì', () => {
    const nguon = lop('FT', 5);
    const ins = (sid: number, hanBm: string, hanCn: string, o: { trang?: string; xn?: string | null } = {}) => Number(conn.prepare(
      `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, ly_do, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, han_gvbm, han_gvcn, xac_nhan_luc, tao_luc)
       VALUES (?,?, 'bao_luu', 'giua-khoa', ?, 'đi xa', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(sid, nguon, addDays(T2, 7), QL.userId, T2, o.trang ?? 'cho', hanBm, hanCn, o.xn ?? null, NOW).lastInsertRowid);
    const ngan = ins(em(nguon, { ft: true }).sid, addDays(T2, 1), addDays(T2, 2));
    const dai = ins(em(nguon, { ft: true }).sid, addDays(T2, 9), addDays(T2, 9));
    const xn = ins(em(nguon, { ft: true }).sid, addDays(T2, 1), addDays(T2, 2), { xn: NOW });
    const ap: string[] = [];
    mig.migratePrOv13l(conn, ap);
    const h = (id: number) => get('SELECT han_gvbm, han_gvcn FROM lenh_chuyen_lop WHERE id = ?', id);
    assert(h(ngan).han_gvbm === addDays(T2, 6) && h(ngan).han_gvcn === addDays(T2, 6), `ngắn: ${JSON.stringify(h(ngan))}`);
    assert(h(dai).han_gvbm === addDays(T2, 9) && h(dai).han_gvcn === addDays(T2, 9), `không sớm hơn hạn cũ: ${JSON.stringify(h(dai))}`);
    assert(h(xn).han_gvbm === addDays(T2, 1), 'đã xác nhận không đổi');
    assert(ap.length === 1, JSON.stringify(ap));
    const lan2: string[] = [];
    mig.migratePrOv13l(conn, lan2);
    assert(lan2.length === 0, `lần hai: ${JSON.stringify(lan2)}`);
  });

  // ------------------------------------------------------------------ qua HTTP
  await checkAsync('L13-11 · HTTP POST /students/:id/transfer tuan = hôm nay → trả daChuyen, em đã ở lớp mới; GVCN lớp nguồn → 403', async () => {
    const nguon = lop('FT', 5), dich = lop('FT', 2);
    const gv = ganGvcn(nguon, 1);
    const e = em(nguon, { ft: true });
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const goi = async (userId: number, url: string, body: unknown) => {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
    };
    try {
      await voiNgay(THU5, async () => {
        const than = { toClassId: dich, tuan: THU5, lyDo: 'Phụ huynh xin đổi giờ' };
        assert((await goi(gv, `/students/${e.sid}/transfer`, than)).status === 403, 'GVCN 403');
        const r = await goi(QL.userId, `/students/${e.sid}/transfer`, than);
        const j: any = await r.json();
        assert(r.status === 200 && j.daChuyen?.includes(e.sid) && ghiDanh(e.sid).class_id === dich, `${r.status} ${JSON.stringify(j)}`);
      });
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ N36 (chủ SP 05/11): bậc vi phạm khi chuyển lộ trình — mặc định giữ, Reset bậc khi Quản lý chọn
  const yt: any = await import('../yThuc/trangThai.ts');
  const luat: any = await import('../classes/luatLoTrinh.ts');
  const report1 = (sid: number, cyc: number) => conn.prepare(
    `INSERT INTO discipline_measures (student_id, cycle_id, kind, status, performed_on, note, created_at, created_by) VALUES (?, ?, 'report_1', 'done', ?, 'N36', ?, ?)`,
  ).run(sid, cyc, addDays(TODAY, -3), NOW, QL.userId);
  const bac = (sid: number) => yt.trangThaiYThuc([sid]).get(sid).bac as number;
  await checkAsync('N36-1 · Cuối khoá Lên lớp "Ngay hôm nay": dòng có Reset bậc → khoá mới reset_bac_y_thuc = 1, bậc về 0; dòng không tích → giữ bậc (Report 1)', async () => {
    const fou = lop('FOU', 10), be = lop('BE', 1);
    const a1 = em(fou, { ma: 'FOU' }), a2 = em(fou, { ma: 'FOU' });
    report1(a1.sid, a1.cyc); report1(a2.sid, a2.cyc);
    const r = await voiNgay(THU5, () => lenh.raLenh(QL, { lopNguonId: fou, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [
      lenh.dongTuBody({ studentId: a1.sid, huong: 'len_lop', toClassId: be, tuan: THU5, lyDo: 'Lên lớp', resetBac: true }),
      lenh.dongTuBody({ studentId: a2.sid, huong: 'len_lop', toClassId: be, tuan: THU5, lyDo: 'Lên lớp' })] }));
    assert(r.failed.length === 0 && r.daChuyen.length === 2, JSON.stringify(r));
    const k1 = khoa(a1.sid), k2 = khoa(a2.sid);
    assert(k1.id !== a1.cyc && k1.reset_bac_y_thuc === 1 && k2.reset_bac_y_thuc === 0, JSON.stringify([k1, k2]));
    assert(bac(a1.sid) === 0 && bac(a2.sid) === 1, `bậc ${bac(a1.sid)} / ${bac(a2.sid)}`);
  });
  await checkAsync('N36-2 · Giữa khoá lớp thường → FT: mặc định giữ bậc; Reset bậc ghi vào lệnh, sửa lệnh không gửi cờ thì giữ, Sửa (PATCH) đổi được; thi hành → lộ trình FT gãy chuỗi', async () => {
    const fou = lop('FOU', 3), ft = lop('FT', 2);
    const b = em(fou, { ma: 'FOU' }), c = em(fou, { ma: 'FOU' });
    report1(b.sid, b.cyc); report1(c.sid, c.cyc);
    const tuanSau = addDays(T2, 7);
    await voiNgay(THU5, async () => {
      ra(fou, 'giua-khoa', { studentId: b.sid, huong: 'fast_track', toClassId: ft, tuan: tuanSau, mucTieu: 6, resetBac: true });
      assert(lenhCua(b.sid).reset_bac === 1, 'lệnh có cờ');
      ra(fou, 'giua-khoa', { studentId: b.sid, huong: 'fast_track', toClassId: ft, tuan: tuanSau, mucTieu: 6 });
      assert(lenhCua(b.sid).reset_bac === 1, 'sửa lệnh không gửi cờ → giữ cờ');
      lenh.suaLenh(QL, lenhCua(b.sid).id, lenh.suaTuBody({ resetBac: false }));
      assert(lenhCua(b.sid).reset_bac === 0, 'PATCH resetBac false');
      lenh.suaLenh(QL, lenhCua(b.sid).id, lenh.suaTuBody({ resetBac: true }));
      const r = ra(fou, 'giua-khoa', { studentId: b.sid, huong: 'fast_track', toClassId: ft, tuan: THU5, mucTieu: 6 });
      const r2 = ra(fou, 'giua-khoa', { studentId: c.sid, huong: 'fast_track', toClassId: ft, tuan: THU5, mucTieu: 6 });
      assert(r.daChuyen.includes(b.sid) && r2.daChuyen.includes(c.sid), JSON.stringify([r, r2]));
    });
    const kb = khoa(b.sid), kc = khoa(c.sid);
    assert(kb.route === 'LT1' && kb.reset_bac_y_thuc === 1 && kc.route === 'LT1' && kc.reset_bac_y_thuc === 0, JSON.stringify([kb, kc]));
    assert(bac(b.sid) === 0, `Reset bậc → 0: ${bac(b.sid)}`);
    assert(bac(c.sid) === 1 && yt.trangThaiYThuc([c.sid]).get(c.sid).chuoi.join() === `${c.cyc},${kc.id}`, 'lớp thường → FT giữ bậc, chuỗi nối tiếp');
  });
  check('N36-3 · ô Reset bậc chỉ có dữ liệu khi cần: xem trước Chuyển lớp trả bacYThuc > 0 cho em lớp thường có bậc; em chưa bậc / em FT = 0', () => {
    const fou = lop('FOU', 3), ftLop = lop('FT', 3);
    const coBac = em(fou, { ma: 'FOU' }), chuaBac = em(fou, { ma: 'FOU' }), ftEm = em(ftLop, { ft: true });
    report1(coBac.sid, coBac.cyc); report1(ftEm.sid, ftEm.cyc);
    const x = (sid: number) => luat.xemChuyenLop(QL, sid, null).bacYThuc;
    assert(x(coBac.sid) === 1 && x(chuaBac.sid) === 0 && x(ftEm.sid) === 0, `${x(coBac.sid)} ${x(chuaBac.sid)} ${x(ftEm.sid)}`);
  });
  await checkAsync('N36-4 · HTTP POST /students/:id/transfer mang resetBac → lệnh có cờ; gửi lại không có resetBac → giữ cờ', async () => {
    const fou = lop('FOU', 3), ft = lop('FT', 2);
    const e = em(fou, { ma: 'FOU' });
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const goi = async (body: unknown) => {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: QL.userId }) });
      const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
      return fetch(`http://127.0.0.1:${cong}/api/students/${e.sid}/transfer`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
    };
    try {
      await voiNgay(THU5, async () => {
        const than = { toClassId: ft, tuan: addDays(T2, 7), lyDo: 'Lên FT', mucTieu: 6 };
        const r = await goi({ ...than, resetBac: true });
        assert(r.status === 200 && lenhCua(e.sid).reset_bac === 1, `${r.status} ${await r.text()}`);
        const r2 = await goi(than);
        assert(r2.status === 200 && lenhCua(e.sid).reset_bac === 1, 'vắng resetBac → giữ cờ');
      });
    } finally { may.close(); }
  });
}
