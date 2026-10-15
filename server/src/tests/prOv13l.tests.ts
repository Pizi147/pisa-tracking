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
  await checkAsync('L13-8 · FT → lớp thường giữa tuần: lớp đích KHÔNG tự xếp bài của tuần đang dở (không bắt ghi "-"), mốc tuần sau vẫn có', async () => {
    const nguon = lop('FT', 5), ele = lop('ELE', 5);   // ELE tuần 5 = tuần Progress Test
    const e = em(nguon, { ft: true });
    await voiNgay(THU5, () => ra(nguon, 'giua-khoa', { studentId: e.sid, huong: 'chuyen_lop', toClassId: ele, tuan: THU5 }));
    const moi = khoa(e.sid);
    assert(moi.id !== e.cyc && moi.route === null, `khoá ELE mới: ${JSON.stringify(moi)}`);
    const bai = all(`SELECT a.kind, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.cycle_id = ?`, moi.id);
    assert(!bai.some((b) => b.week_start === T2) && bai.some((b) => b.kind === 'final'), JSON.stringify(bai));
  });
  await checkAsync('L13-9 · lớp thường đã hết khoá, em cuối chuyển "Ngay hôm nay" → lớp nguồn tự kết thúc đúng hôm nay', async () => {
    const fou = lop('FOU', 10), be = lop('BE', 1);
    const e = em(fou, { ma: 'FOU' });
    const r = await voiNgay(THU5, () => ra(fou, 'cuoi-khoa', { studentId: e.sid, huong: 'len_lop', toClassId: be, tuan: THU5 }));
    assert(r.daChuyen.includes(e.sid) && ghiDanh(e.sid).class_id === be, JSON.stringify(r));
    const c = get('SELECT status, finished_at FROM classes WHERE id = ?', fou);
    assert(c.status === 'finished' && c.finished_at === THU5, JSON.stringify(c));
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
}
