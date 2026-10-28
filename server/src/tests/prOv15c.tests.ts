/**
 * PHÉP KIỂM OV-15c (kế hoạch 2026-10-19-ov15-overhaul-6-pr.md mục OV-15c) — Kế hoạch Test: Xóa = bỏ tuần, bỏ Huỷ MT trên web, vắng 2 lần
 * Khôi phục → Chưa xếp / Giữ huỷ, tuần kèm năm, tìm lớp / học viên / email, ghi chú lịch thi (bảng mới), Xuất Excel 13 cột + Xuất điểm Test.
 * Gọi QUA HTTP theo vai (QL, Admin, GV) như bản chính; mỗi mục dựng lớp / em riêng; chạy cuối `run.ts`.
 */
import Database from 'libsql';
import { createRequire } from 'node:module';
import type { YThucTestKit } from './yThuc.tests.ts';

const require = createRequire(import.meta.url);

export async function runPrOv15cTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const m15c: any = await import('../migrate/prOv15c.ts');
  const kiem: any = await import('../ops/kiemTruocOv15c.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15c · Kế hoạch Test: Xóa, năm, tìm, ghi chú, xuất (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager.userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  let seq = 0;
  const nguoi = (role: string, branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov15c.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov15c', fullName: `Thử OV15c ${seq}`, roles: [{ role, branches }] }).userId as number;
  };
  const ADMIN = nguoi('office_admin', ['MB']);
  const lop = (code = `MB C15-${++seq}`) => {
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  };
  const GV = nguoi('teacher', ['MB']);
  /** Một em FT đang học `l` (lộ trình LT1 Target 6.5). `ten` có dấu để kiểm tìm không dấu. */
  const em = (l: number, ten: string, email: string | null) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, email, branch_id, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
      .run(`PISA-C15-${seq}`, ten, util.normalizeName(ten), email, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`).run(sid, tuan(bd), bd, NOW).lastInsertRowid);
    return { sid, cy };
  };
  conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`)
    .run(GV, lop(), NOW);

  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { setConfig('demo_date', TODAY); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const json = async (r: Response): Promise<any> => { const x = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(x)}`); return x; };
  const loi = async (r: Response): Promise<{ status: number; error: string }> => { const x: any = await r.json().catch(() => ({})); return { status: r.status, error: x?.error ?? '' }; };
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
  /** Xếp MT `n` cho em, bốn kỹ năng cùng tuần `thuHai` (hoặc L/R một tuần, W/S tuần khác). */
  const xep = async (goi: any, sid: number, n: number, lr: string, ws = lr) => (await json(await goi(QL, '/ke-hoach-test/xep-moi', post({
    studentId: sid, attemptNo: n, tuan: { listening: tuan(lr), reading: tuan(lr), writing: tuan(ws), speaking: tuan(ws) }, force: true,
  })))).id as number;

  // ------------------------------------------------------------------ 1 · hàm thuần
  check('C15-1 · tuanNam "W4 AUG/2026" (năm của tháng sở hữu tuần) · ô lịch xuất: cùng tuần / L/R; W/S / Chưa xếp / Đã huỷ / Vắng · chuỗi lớp · lý do không Xóa', () => {
    assert(d.tuanNam('2026-08-24') === 'W4 AUG/2026', d.tuanNam('2026-08-24'));
    assert(d.tuanNam('2026-08-27') === 'W4 AUG/2026', 'ngày giữa tuần → thứ Hai');
    assert(d.tuanNam('2026-12-28') === `${d.tuanLich('2026-12-28')}/${d.owningMonthOf('2026-12-28').year}`, 'tuần vắt năm theo tháng sở hữu');
    assert(d.tuanNam(null) === '—', 'trống');
    const k = (skill: string, tuan: string | null, sit = 'scheduled') => ({ skill, tuan, sit, batBuoc: true });
    assert(d.oLichXuat(null) === 'Chưa xếp' && d.oLichXuat({ huy: true }) === 'Đã huỷ', 'không lượt / lượt huỷ');
    assert(d.oLichXuat({ kn: ['listening', 'reading', 'writing', 'speaking'].map((s) => k(s, '2026-08-24')) }) === 'W4 AUG/2026', 'cùng tuần');
    assert(d.oLichXuat({ kn: [k('speaking', '2026-08-31'), k('listening', '2026-08-24'), k('reading', '2026-08-24'), k('writing', '2026-08-31')] })
      === 'L/R: W4 AUG/2026; W/S: W1 SEP/2026', d.oLichXuat({ kn: [k('speaking', '2026-08-31'), k('listening', '2026-08-24'), k('reading', '2026-08-24'), k('writing', '2026-08-31')] }));
    assert(d.oLichXuat({ kn: ['listening', 'reading', 'writing', 'speaking'].map((s) => k(s, null)) }) === 'Chưa xếp', 'đã Xóa → Chưa xếp');
    assert(d.oLichXuat({ kn: [k('listening', '2026-08-24', 'absent')] }) === 'Vắng' && d.oLichXuat({ kn: [k('listening', '2026-08-24', 'cancelled')] }) === 'Đã huỷ', 'vắng / huỷ phần');
    assert(d.chuoiLop(['MB FT 101', 'MB FT 101', 'MB FT 105']) === 'MB FT 101 → MB FT 105', 'hai lớp một hàng');
    const kn = (o: any) => ({ listening: { batBuoc: true, tuan: '2026-08-24', sit: 'scheduled', khoa: null, ...o } });
    assert(d.lyDoKhongXoa(kn({})) === null, 'được xóa');
    assert(d.lyDoKhongXoa(kn({ khoa: 'đã có điểm' })) === 'Đã có điểm — không xóa được', 'có điểm');
    assert(d.lyDoKhongXoa(kn({ sit: 'sat', khoa: 'đã làm bài' })) === 'Đã làm bài — không xóa được', 'đã thi');
    assert(d.lyDoKhongXoa(kn({ tuan: null })) === 'Chưa xếp lịch', 'chưa xếp');
    const dd = { ovr: 6.5, kyVong: 6.5, danhGiaDuoc: true };
    assert(d.ketQuaLuot(dd) === 'Đạt' && d.ketQuaLuot({ ...dd, ovr: 6 }) === 'Chưa đạt' && d.ketQuaLuot({ ...dd, danhGiaDuoc: false }) === 'Chưa đủ điểm', 'kết quả');
  });

  // ------------------------------------------------------------------ 2 · Xóa = bỏ tuần
  await checkAsync('C15-2 · Xóa (bo-tuan): QL và Admin được, GV 403; lượt về Chưa xếp (planned, tuần NULL), lịch sử giữ; đã có điểm / đã thi → 400', async () => {
    const l = lop();
    const a = em(l, 'Đỗ Trọng Tiến', 'tien.dotrong@gmail.com'), b = em(l, 'Lê Bảo Trâm', null), c = em(l, 'Hoàng Khánh Ngân', null);
    await voiMayChu(async (goi) => {
      const ida = await xep(goi, a.sid, 1, addDays(T2, 14));
      const idb = await xep(goi, b.sid, 1, addDays(T2, 14));
      const idc = await xep(goi, c.sid, 1, addDays(T2, -7));
      assert((await goi(GV, `/attempts/${ida}/bo-tuan`, post({}))).status === 403, 'GV không xóa được');
      await json(await goi(QL, `/attempts/${ida}/bo-tuan`, post({})));
      const s = one(`SELECT status FROM assessment_attempts WHERE id = ?`, ida);
      const k = all(`SELECT planned_period_id, sit_status FROM attempt_skills WHERE attempt_id = ? AND required = 1`, ida);
      assert(s.status === 'planned' && k.length === 4 && k.every((x) => x.planned_period_id === null && x.sit_status === 'scheduled'), JSON.stringify({ s, k }));
      assert(all(`SELECT 1 FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_unscheduled'`, ida).length === 4, 'lịch sử ghi 4 kỹ năng');
      /* Hoàn tác (web): đặt lại đúng tuần cũ qua /ke-hoach-test/dot — lượt có lịch lại như trước khi Xóa. */
      const cu = tuan(addDays(T2, 14));
      await json(await goi(QL, '/ke-hoach-test/dot', post({ attemptId: ida, kyNang: ['listening', 'reading', 'writing', 'speaking'].map((skill) => ({ skill, periodId: cu })), reason: 'Hoàn tác xóa lịch', force: true })));
      const sau = all(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND required = 1`, ida);
      assert(sau.length === 4 && sau.every((x) => x.planned_period_id === cu), `hoàn tác: ${JSON.stringify(sau)}`);
      await json(await goi(QL, `/attempts/${ida}/bo-tuan`, post({})));
      await json(await goi(ADMIN, `/attempts/${idb}/bo-tuan`, post({})));
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 6.5, ?)`).run(idc, NOW);
      const e = await loi(await goi(QL, `/attempts/${idc}/bo-tuan`, post({})));
      assert(e.status === 400 && /đã có điểm/.test(e.error), JSON.stringify(e));
      /* Ô lưới: lượt đã Xóa → mọi kỹ năng chưa xếp; lyDoKhongXoa → "Chưa xếp lịch" (nút mờ). */
      const g = await json(await goi(QL, `/ke-hoach-test/ft/${l}`));
      const o = g.hang.find((h: any) => h.studentId === a.sid).dot[1];
      assert(o.attemptId === ida && Object.values(o.kn).every((x: any) => x.tuan === null) && d.lyDoKhongXoa(o.kn) === 'Chưa xếp lịch', JSON.stringify(o));
      const oc = g.hang.find((h: any) => h.studentId === c.sid).dot[1];
      assert(d.lyDoKhongXoa(oc.kn) === 'Đã có điểm — không xóa được', JSON.stringify(oc.kn));
    });
  });

  await checkAsync('C15-3 · Bỏ "Huỷ MT" trên web: /attempts/:id/cancel với Mock → 400 (QL), Admin vẫn 403; hồ sơ MT không còn huyLuot', async () => {
    const l = lop();
    const a = em(l, 'Bùi Minh Châu', null);
    await voiMayChu(async (goi) => {
      const id = await xep(goi, a.sid, 1, addDays(T2, 7));
      const e = await loi(await goi(QL, `/attempts/${id}/cancel`, post({ reason: 'thử' })));
      assert(e.status === 400 && /Xóa/.test(e.error), JSON.stringify(e));
      assert((await goi(ADMIN, `/attempts/${id}/cancel`, post({ reason: 'thử' }))).status === 403, 'Admin 403');
      assert(one(`SELECT status FROM assessment_attempts WHERE id = ?`, id).status === 'planned', 'không huỷ');
      const ct = await json(await goi(QL, `/attempts/${id}`));
      assert(!('huyLuot' in ct.viewer), `huyLuot: ${JSON.stringify(ct.viewer.huyLuot)}`);   // OV-15i2: trường đã bỏ
    });
  });

  await checkAsync('C15-4 · vắng 2 lần: Khôi phục → Chưa xếp (sit scheduled, tuần NULL, huy_vang 0, đề nghị rút); kỹ năng không huỷ vắng → 400; GV 403', async () => {
    const l = lop();
    const a = em(l, 'Nguyễn Hữu Phát', null);
    await voiMayChu(async (goi) => {
      const id = await xep(goi, a.sid, 1, addDays(T2, -7));
      conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled', huy_vang = 1 WHERE attempt_id = ? AND skill = 'speaking'`).run(id);
      assert((await goi(GV, `/attempts/${id}/skills/speaking/khoi-phuc-chua-xep`, post({}))).status === 403, 'GV 403');
      const e = await loi(await goi(QL, `/attempts/${id}/skills/listening/khoi-phuc-chua-xep`, post({})));
      assert(e.status === 400, JSON.stringify(e));
      await json(await goi(QL, `/attempts/${id}/skills/speaking/khoi-phuc-chua-xep`, post({})));
      const k = one(`SELECT sit_status, planned_period_id, huy_vang FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`, id);
      assert(k.sit_status === 'scheduled' && k.planned_period_id === null && k.huy_vang === 0, JSON.stringify(k));
      assert(one(`SELECT 1 AS c FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_part_restored' AND field = 'speaking'`, id), 'có nhật ký');
    });
  });

  // ------------------------------------------------------------------ 3 · tìm
  await checkAsync('C15-5 · Tìm lớp, học viên hoặc email: không dấu khớp tên có dấu, email không phân biệt hoa thường, mã lớp; kèm lớp · email; GV 403', async () => {
    const l = lop('MB C15 TIM 03');
    em(l, 'Đỗ Trọng Tiến', 'Tien.DoTrong@gmail.com'); em(l, 'Trịnh Mai Anh', 'maianh.03@gmail.com');
    await voiMayChu(async (goi) => {
      const r = await json(await goi(QL, `/ke-hoach-test/tim?q=${encodeURIComponent('trong tien')}&branchId=${MB}`));
      const h = r.hocVien.find((x: any) => x.classId === l);
      assert(h && h.ten === 'Đỗ Trọng Tiến' && h.classCode === 'MB C15 TIM 03' && h.email === 'Tien.DoTrong@gmail.com', JSON.stringify(r));
      const r2 = await json(await goi(QL, `/ke-hoach-test/tim?q=${encodeURIComponent('tien.dotrong@')}&branchId=${MB}`));
      assert(r2.hocVien.some((x: any) => x.ten === 'Đỗ Trọng Tiến'), 'email');
      const r3 = await json(await goi(QL, `/ke-hoach-test/tim?q=${encodeURIComponent('c15tim03')}&branchId=${MB}`));
      assert(r3.lop.some((x: any) => x.id === l && x.soHv === 2), JSON.stringify(r3.lop));
      assert(r3.hocVien.length === 0, 'mã lớp không kéo theo tên em');
      const g = await json(await goi(GV, `/ke-hoach-test/tim?q=tien&branchId=${MB}`));   // chủ SP 28/10: GV tìm trong lớp mình dạy
      assert(!g.hocVien.some((x: any) => x.classId === l) && !g.lop.some((x: any) => x.id === l), 'GV không thấy lớp mình không dạy');
      const rong = await json(await goi(QL, `/ke-hoach-test/tim?q=%20`));
      assert(rong.lop.length === 0 && rong.hocVien.length === 0, 'chữ trống');
    });
  });

  // ------------------------------------------------------------------ 4 · ghi chú
  await checkAsync('C15-6 · Ghi chú lịch thi: em × MT (theo lộ trình) và ghi chú lớp; lưới trả ghi chú mới nhất kèm tác giả; lịch sử đủ; xoá = trống; không dời lịch; GV 403; > 500 ký tự 400', async () => {
    const l = lop();
    const a = em(l, 'Hoàng Khánh Ngân', null);
    await voiMayChu(async (goi) => {
      const id = await xep(goi, a.sid, 1, addDays(T2, 7));
      const truoc = all(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? ORDER BY skill`, id);
      await json(await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: l, studentId: a.sid, dot: 'mt1', noiDung: 'Gia đình đề nghị chuyển' })));
      const r = await json(await goi(ADMIN, '/ke-hoach-test/ghi-chu', post({ classId: l, studentId: a.sid, dot: 'mt1', noiDung: '  Chờ xác nhận lịch Speaking ' })));
      assert(r.ghiChu.noiDung === 'Chờ xác nhận lịch Speaking' && r.ghiChu.ai, JSON.stringify(r));
      await json(await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: l, noiDung: 'MT5 cả lớp có thể dời' })));
      const g = await json(await goi(QL, `/ke-hoach-test/ft/${l}`));
      const h = g.hang.find((x: any) => x.studentId === a.sid);
      assert(h.ghiChu?.mt1?.noiDung === 'Chờ xác nhận lịch Speaking' && /OV15c/.test(h.ghiChu.mt1.ai) && g.ghiChuLop?.noiDung === 'MT5 cả lớp có thể dời', JSON.stringify({ gc: h.ghiChu, lop: g.ghiChuLop }));
      const ls = await json(await goi(QL, `/ke-hoach-test/ghi-chu/lich-su?classId=${l}&studentId=${a.sid}&dot=mt1`));
      assert(ls.dong.length === 2 && ls.dong[0].noiDung === 'Chờ xác nhận lịch Speaking' && ls.dong[1].noiDung === 'Gia đình đề nghị chuyển', JSON.stringify(ls));
      assert(JSON.stringify(all(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? ORDER BY skill`, id)) === JSON.stringify(truoc), 'không dời lịch');
      await json(await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: l, studentId: a.sid, dot: 'mt1', noiDung: '' })));
      const g2 = await json(await goi(QL, `/ke-hoach-test/ft/${l}`));
      assert(!g2.hang.find((x: any) => x.studentId === a.sid).ghiChu?.mt1, 'xoá → không còn');
      assert((await goi(GV, '/ke-hoach-test/ghi-chu', post({ classId: l, noiDung: 'x' }))).status === 403, 'GV 403');
      assert((await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: l, noiDung: 'x'.repeat(501) }))).status === 400, '> 500');
      assert((await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: l, studentId: a.sid, dot: 'abc', noiDung: 'x' }))).status === 400, 'đợt lạ');
      const khac = lop();
      assert((await goi(QL, '/ke-hoach-test/ghi-chu', post({ classId: khac, studentId: a.sid, dot: 'mt1', noiDung: 'x' }))).status === 400, 'em không thuộc lớp');
    });
  });

  // ------------------------------------------------------------------ 5 · xuất
  await checkAsync('C15-7 · Xuất Excel Kế hoạch Test 13 cột: theo lớp đang lọc, ô lịch có năm, Chưa xếp, MT > 10 ở Thông tin xuất, em 2 lớp một hàng; GV 403; ô "=…" là chữ', async () => {
    const cu = lop('MB C15 XUAT 01'), l = lop('MB C15 XUAT 02');
    const a = em(l, 'Bùi Minh Châu', '=HYPERLINK("x")'), b = em(l, 'Đặng Gia Huy', 'giahuy@gmail.com');
    await voiMayChu(async (goi) => {
      const ida = await xep(goi, a.sid, 1, '2026-08-24');
      conn.prepare('UPDATE assessment_attempts SET class_id = ? WHERE id = ?').run(cu, ida);   // MT1 thi ở lớp cũ
      await xep(goi, a.sid, 2, '2026-09-07', '2026-09-14');
      conn.prepare('UPDATE assessment_attempts SET attempt_no = 11 WHERE id = ?').run(await xep(goi, b.sid, 1, '2026-10-12'));   // MT > 10 (dữ liệu cũ)
      const r = await json(await goi(QL, '/ke-hoach-test/xuat', post({ branchId: MB, classIds: [l], xemTruoc: true })));
      const s = r.sheets[0].aoa;
      assert(s[0].length === 13 && s[0][0] === 'Gmail' && s[0][12] === 'MT10', JSON.stringify(s[0]));
      const ha = s.find((x: any[]) => x[1] === 'Bùi Minh Châu');
      assert(ha && ha[2] === 'MB C15 XUAT 01 → MB C15 XUAT 02' && ha[3] === 'W4 AUG/2026' && ha[4] === 'L/R: W2 SEP/2026; W/S: W3 SEP/2026' && ha[5] === 'Chưa xếp', JSON.stringify(ha));
      assert(s.filter((x: any[]) => x[1] === 'Bùi Minh Châu').length === 1, 'một hàng');
      const tt = r.sheets[1];
      assert(tt.ten === 'Thông tin xuất' && JSON.stringify(tt.aoa).includes('MT11'), JSON.stringify(tt));
      assert(r.dem.hocVien === 2 && /^Ke-hoach-Test_.*\.xlsx$/.test(r.tenTep), JSON.stringify(r.dem) + r.tenTep);
      assert((await goi(GV, '/ke-hoach-test/xuat', post({ branchId: MB, classIds: [l] }))).status === 403, 'GV 403');
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(s);
      const o = Object.values(ws).find((c: any) => c?.v === '=HYPERLINK("x")') as any;
      assert(o && o.t === 's' && !o.f, `ô chữ: ${JSON.stringify(o)}`);
    });
  });

  await checkAsync('C15-8 · Xuất điểm Test: theo lớp + MT1–MT2 / theo tuần; "Chỉ điểm" bỏ 2 cột nhận xét; Kết quả Đạt / Chưa đủ điểm; GV 403', async () => {
    const l = lop('MB C15 DIEM 01');
    const a = em(l, 'Lê Bảo Trâm', 'tram@gmail.com');
    await voiMayChu(async (goi) => {
      const id = await xep(goi, a.sid, 1, '2026-08-24');
      for (const [k, band] of [['listening', 6], ['reading', 6], ['writing1', 6], ['writing2', 6], ['speaking', 6]] as const) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, comment, entered_at) VALUES (?,?,?,?,?)`).run(id, k, band, k === 'listening' ? 'Nghe tốt' : null, NOW);
      }
      await xep(goi, a.sid, 2, '2026-09-21');
      const r = await json(await goi(QL, '/ke-hoach-test/xuat-diem', post({ branchId: MB, classIds: [l], mtTu: 1, mtDen: 2, noiDung: 'diem-nhan-xet', xemTruoc: true })));
      const s = r.sheets[0].aoa;
      assert(s[0].length === 16 && s[0][14] === 'Nhận xét L · R', JSON.stringify(s[0]));
      assert(s.length === 3 && s[1][3] === 'MT1' && s[1][4] === 'W4 AUG/2026' && s[1][11] === 6 && s[1][13] === 'Đạt' && s[1][14] === 'L: Nghe tốt', JSON.stringify(s[1]));
      assert(s[2][13] === 'Chưa đủ điểm', JSON.stringify(s[2]));
      const r2 = await json(await goi(QL, '/ke-hoach-test/xuat-diem', post({ branchId: MB, classIds: [l], mtTu: 1, mtDen: 2, noiDung: 'chi-diem', xemTruoc: true })));
      assert(r2.sheets[0].aoa[0].length === 14, 'chỉ điểm 14 cột');
      const r3 = await json(await goi(QL, '/ke-hoach-test/xuat-diem', post({ branchId: MB, classIds: [], tuanTu: '2026-09-21', tuanDen: '2026-09-21', noiDung: 'chi-diem', xemTruoc: true })));
      assert(r3.sheets[0].aoa.some((x: any[]) => x[0] === 'Lê Bảo Trâm' && x[3] === 'MT2') && !r3.sheets[0].aoa.some((x: any[]) => x[0] === 'Lê Bảo Trâm' && x[3] === 'MT1'), 'theo tuần');
      assert((await goi(GV, '/ke-hoach-test/xuat-diem', post({ branchId: MB, classIds: [l], mtTu: 1, mtDen: 2, noiDung: 'chi-diem' }))).status === 403, 'GV 403');
      assert((await goi(QL, '/ke-hoach-test/xuat-diem', post({ branchId: MB, classIds: [l], noiDung: 'chi-diem' }))).status === 400, 'thiếu phạm vi');
    });
  });

  // ------------------------------------------------------------------ 6 · migrate + lệnh kiểm trước
  check('C15-9 · migrate prOv15c trên DB không có bảng: tạo bảng + chỉ mục giống schema.sql; chạy lần hai không làm gì; kiem-truoc-ov15c chỉ đọc, đếm lượt huỷ cũ theo loại', () => {
    const tam = new Database(':memory:');
    tam.exec(`CREATE TABLE classes (id INTEGER PRIMARY KEY); CREATE TABLE students (id INTEGER PRIMARY KEY); CREATE TABLE learning_cycles (id INTEGER PRIMARY KEY); CREATE TABLE users (id INTEGER PRIMARY KEY);`);
    const ap: string[] = [];
    m15c.migratePrOv15c(tam, ap);
    m15c.migratePrOv15c(tam, ap);
    assert(ap.length === 1, JSON.stringify(ap));
    const cot = (c: any, ten: string) => c.prepare('SELECT name, type, "notnull" AS nn FROM pragma_table_info(?)').all(ten).map((x: any) => `${x.name}:${x.type}:${x.nn}`).join(',');
    assert(cot(tam, 'ghi_chu_lich_thi') === cot(conn, 'ghi_chu_lich_thi'), `${cot(tam, 'ghi_chu_lich_thi')} ≠ ${cot(conn, 'ghi_chu_lich_thi')}`);
    const cm = (c: any) => c.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'ghi_chu_lich_thi' ORDER BY name`).all().map((x: any) => x.name).join(',');
    assert(cm(tam) === cm(conn) && cm(conn) === 'idx_gcl_hoc_vien,idx_gcl_lop', cm(tam));
    tam.close();
    const truoc = conn.prepare('SELECT total_changes() AS n').get().n;
    const r = kiem.demHuyCu(conn);
    assert(conn.prepare('SELECT total_changes() AS n').get().n === truoc, 'chỉ đọc');
    const that = one(`SELECT COUNT(*) AS n FROM assessment_attempts WHERE status = 'cancelled' AND kind = 'mock'`).n;
    assert((r.luot.find((x: any) => x.kind === 'mock' && !x.chiNhanh)?.n ?? 0) === that && typeof r.huyVang === 'number', JSON.stringify(r));
  });
}
