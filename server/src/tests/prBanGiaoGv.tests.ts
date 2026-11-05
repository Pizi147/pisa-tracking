/**
 * PHÉP KIỂM PR-B BAN-GIAO-GV (kế hoạch 2026-10-30-phan-cong-gv.md · PR-B): việc bàn giao khi đổi GV (sinh / gộp / đổi người nhận / huỷ), phiếu
 * (góp ý mỗi em mỗi cột, xác nhận, Điền thay, quyền đọc), Công việc + dải hồ sơ lớp, nháp nhận xét chung + "Cùng GV" của bàn giao chuyển lớp.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBanGiaoGvTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  console.log('\nPR-B · Bàn giao khi đổi GV');
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const pc: any = await import('../classes/phanCongGv.ts');
  const bg: any = await import('../classes/banGiaoGv.ts');
  const banGiao: any = await import('../classes/banGiao.ts');
  const standing: any = await import('../students/standing.ts');
  const dai: any = await import('../classes/daiChuyenLop.ts');
  const mig: any = await import('../migrate/prBanGiaoGv.ts');
  const { myWork }: any = await import('../worklist/mywork.ts');
  const { loadPrincipal, xemTamCo } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const demCau = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };

  check('B2 · trangThaiEmBg: Đủ · Thiếu GVCN · Chưa có', () => {
    const a = d.trangThaiEmBg(['listening', 'gvcn'], { listening: 1, gvcn: null });
    const b = d.trangThaiEmBg(['listening', 'gvcn'], { listening: 1, gvcn: 1 });
    const c = d.trangThaiEmBg(['listening', 'gvcn'], { listening: null, gvcn: null });
    assert(a.khoa === 'thieu' && a.nhan === 'Thiếu GVCN' && b.khoa === 'du' && c.khoa === 'chua', JSON.stringify([a, b, c]));
  });

  /* ---------------------------------------------------------------- dựng dữ liệu (mỗi phép kiểm ghi cuộn lại) */
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  let seq = 0;
  const nguoi = (roles: any[] = [{ role: 'teacher', branches: ['MB'] }]) => accounts.createAccount(P.admin, {
    email: `bggv.${++seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-bggv', fullName: `Thử BGGV ${seq}`, roles,
  }).userId as number;
  const start = addDays(T2, -7 * 4);
  const lopMoi = (code: string) => intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  const gan = (l: number, u: number, skill: string | null) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,'2026-01-01','active',?)`,
  ).run(u, l, skill, skill === null ? 1 : 0, NOW);
  const hocVien = (lop: number) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-BG${seq}`, `Hoc vien BG${seq}`, `hoc vien bg${seq}`, MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, NOW);
    return sid;
  };
  /* gA: GVCN + L + S · gC: R · gD: W1, W2. gB, gF: chưa dạy. X: 2 em · Y: 12 em. */
  const [gA, gB, gC, gD, gF] = [nguoi(), nguoi(), nguoi(), nguoi(), nguoi()];
  const X = lopMoi('MB BGGV-X'), Y = lopMoi('MB BGGV-Y');
  for (const l of [X, Y]) { gan(l, gA, null); gan(l, gA, 'listening'); gan(l, gC, 'reading'); gan(l, gD, 'writing1'); gan(l, gD, 'writing2'); gan(l, gA, 'speaking'); }
  const emX = [hocVien(X), hocVien(X)];
  for (let i = 0; i < 12; i++) hocVien(Y);
  xoaNho();
  const QL = P.mbManager;
  const slotsCua = (l: number) => all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, l)
    .map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
  const doi = (l: number, o: Record<string, number | null>) => {
    let s = slotsCua(l);
    for (const [khoa, u] of Object.entries(o)) {
      s = s.filter((x) => (x.isCore ? 'gvcn' : x.skill) !== khoa);
      if (u !== null) s.push(khoa === 'gvcn' ? { userId: u, skill: null, isCore: true } : { userId: u, skill: khoa, isCore: false });
    }
    return s;
  };
  const luu = (l: number, o: Record<string, number | null>, x: any = {}) => pc.luuPhanCong(QL, { lop: [{ classId: l, slots: doi(l, o), ...(x.banGiao ? { banGiao: x.banGiao } : {}) }], ...(x.hieuLuc ? { hieuLuc: x.hieuLuc } : {}) });
  const viecCua = (l: number) => all(`SELECT * FROM ban_giao_gv WHERE class_id = ? ORDER BY id`, l);
  const cotCua = (id: number) => all(`SELECT * FROM ban_giao_gv_mon WHERE ban_giao_id = ? ORDER BY id`, id);
  const T14 = tuan(addDays(T2, 14));

  /* ---------------------------------------------------------------- B1 */
  check('B1 · migrate hai lần không lỗi, ba bảng có', () => {
    mig.migratePrBanGiaoGv(conn, []); mig.migratePrBanGiaoGv(conn, []);
    const n = one(`SELECT COUNT(*) n FROM sqlite_master WHERE type = 'table' AND name IN ('ban_giao_gv', 'ban_giao_gv_mon', 'ban_giao_gv_em')`).n;
    assert(n === 3, `${n} bảng`);
  });
  check('B1 · đổi L và GVCN cùng A → B một lần lưu → MỘT việc, hai cột, hạn = hôm nay + 4, người viết A; luuPhanCong trả viec = 1', () => thu(() => {
    const r = luu(X, { listening: gB, gvcn: gB });
    const v = viecCua(X);
    assert(v.length === 1 && r.viec === 1, `${v.length} việc · viec ${r.viec}`);
    assert(v[0].nguoi_cu === gA && v[0].nguoi_lam === gA && v[0].han === addDays(TODAY, 4) && v[0].trang_thai === 'mo' && v[0].hieu_luc === TODAY, JSON.stringify(v[0]));
    const c = cotCua(v[0].id).map((x) => `${x.mon}:${x.nguoi_moi}`).sort().join(',');
    assert(c === `gvcn:${gB},listening:${gB}`, c);
  }));
  check('B1 · bỏ tích GVCN → một cột; bỏ hết → không việc; A → Chưa có → không việc', () => thu(() => {
    luu(X, { listening: gB, gvcn: gB }, { banGiao: { gvcn: false } });
    assert(cotCua(viecCua(X)[0].id).length === 1, 'một cột');
    luu(Y, { listening: gB, gvcn: gB }, { banGiao: { gvcn: false, listening: false } });
    assert(viecCua(Y).length === 0, 'bỏ hết → không việc');
  }));
  check('B1 · A → Chưa có (bỏ S) → không việc', () => thu(() => {
    luu(X, { speaking: null });
    assert(viecCua(X).length === 0, 'không việc');
  }));
  check('B1 · RF2-bg: A→B (có việc) rồi B→C → cột người nhận C; rồi C→A → cột huỷ, việc huỷ, góp ý đã viết còn; B không có việc riêng', () => thu(() => {
    luu(X, { listening: gB });
    const v = viecCua(X)[0];
    bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: emX[0], mon: 'listening', noiDung: 'Nghe tốt' });
    luu(X, { listening: gF });
    const c1 = cotCua(v.id);
    assert(c1.length === 1 && c1[0].nguoi_moi === gF && c1[0].trang_thai === 'mo' && viecCua(X).length === 1, JSON.stringify(c1));
    luu(X, { listening: gA });
    const c2 = cotCua(v.id);
    assert(c2[0].trang_thai === 'huy' && viecCua(X)[0].trang_thai === 'huy', JSON.stringify([c2, viecCua(X)]));
    assert(one(`SELECT COUNT(*) n FROM ban_giao_gv_em WHERE ban_giao_id = ?`, v.id).n === 1, 'góp ý giữ');
  }));
  check('B1 · RF2 lịch chờ: A→B từ tuần +14 (có việc) rồi A→C cùng tuần → cột đổi người nhận C, vẫn một việc', () => thu(() => {
    luu(X, { listening: gB }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    luu(X, { listening: gF }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    const v = viecCua(X);
    const c = cotCua(v[0].id);
    assert(v.length === 1 && c.length === 1 && c[0].nguoi_moi === gF && c[0].trang_thai === 'mo' && v[0].hieu_luc === addDays(T2, 14), JSON.stringify({ v, c }));
  }));
  check('B1 · PTA 30/10: hiệu lực Từ tuần → hạn = hiệu lực + 4; Đổi mốc → hạn theo mốc mới; Ngay hôm nay → hôm nay + 4', () => thu(() => {
    const r = luu(X, { listening: gB }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    assert(viecCua(X)[0].han === addDays(T2, 14 + 4), `hạn ${viecCua(X)[0].han}`);
    pc.doiMocCho(QL, [r.lo], { loai: 'tuan', tuanId: tuan(addDays(T2, 21)) });
    const v = viecCua(X)[0];
    assert(v.han === addDays(T2, 21 + 4) && v.hieu_luc === addDays(T2, 21), JSON.stringify(v));
    pc.doiMocCho(QL, [r.lo], { loai: 'hom-nay' });
    assert(viecCua(X)[0].han === addDays(TODAY, 4), `hôm nay ${viecCua(X)[0].han}`);
  }));
  check('B1 · A đã nghỉ (hết vai) → người viết = GVCN lớp; A là GVCN và nghỉ → người viết NULL (QL)', () => thu(() => {
    conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(gD);
    xoaNho();
    luu(X, { writing1: gB, writing2: gB });
    assert(viecCua(X)[0].nguoi_lam === gA, `người viết ${viecCua(X)[0].nguoi_lam}`);
    conn.prepare(`UPDATE user_roles SET status = 'ended' WHERE user_id = ?`).run(gA);
    xoaNho();
    luu(Y, { gvcn: gB, listening: gB, speaking: gB, writing1: gF, writing2: gF });
    const v = viecCua(Y).find((x) => x.nguoi_cu === gA);
    assert(v && v.nguoi_lam === null, JSON.stringify(viecCua(Y)));
  }));
  check('B1 · Huỷ lịch đổi → việc huỷ; Hoàn tác Huỷ → việc mở lại', () => thu(() => {
    const r = luu(X, { listening: gB }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    const h = pc.huyCho(QL, [r.lo]);
    assert(viecCua(X)[0].trang_thai === 'huy', 'huỷ');
    pc.hoanTacLuu(QL, { dao: h.dao });
    assert(viecCua(X)[0].trang_thai === 'mo' && cotCua(viecCua(X)[0].id)[0].trang_thai === 'mo', 'mở lại');
  }));
  check('Sửa nhỏ 05/11 · hộp Chờ đổi: dòng chờ mang việc bàn giao a/b em đã viết + hạn (gộp vào câu lịch chờ, không có việc → không đọc thêm)', () => thu(() => {
    luu(X, { listening: gB }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    const v = viecCua(X)[0];
    bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: emX[0], mon: 'listening', noiDung: 'Nghe tốt' });
    xoaNho();
    const choX = () => pc.trangPhanCongGv(QL, MB).lop.find((l: any) => l.id === X).cho;
    const c = choX();
    assert(c.length === 1 && c[0].banGiao?.id === v.id && c[0].banGiao.du === 1 && c[0].banGiao.tong === 2 && c[0].banGiao.han === v.han, JSON.stringify(c));
    pc.huyCho(QL, c.map((x: any) => x.id));
    xoaNho();
    assert(choX().length === 0, 'huỷ lịch đổi → hết dòng chờ');
  }));
  check('B1 · Hoàn tác lần lưu: việc vừa tạo mất; đã có góp ý → 409, không đảo gì', () => thu(() => {
    const r = luu(X, { listening: gB });
    pc.hoanTacLuu(QL, { lo: r.lo });
    assert(viecCua(X).length === 0, 'việc mất');
    const r2 = luu(X, { listening: gB });
    bg.ghiGopYGv(loadPrincipal(gA), viecCua(X)[0].id, { studentId: emX[0], mon: 'listening', noiDung: 'Nghe tốt' });
    const e = maLoi(() => pc.hoanTacLuu(QL, { lo: r2.lo }));
    assert(e?.status === 409 && /góp ý/.test(e.message) && viecCua(X).length === 1, e?.message);
  }));
  check('B1 · RF3 Hoàn tác: cột THÊM vào việc có sẵn đã có góp ý → 409; việc vừa tạo đã có cột của lần lưu sau → 409 (không 500 khoá ngoại)', () => thu(() => {
    const r1 = luu(X, { listening: gB });
    const r2 = luu(X, { gvcn: gB });
    const v = viecCua(X);
    assert(v.length === 1 && cotCua(v[0].id).length === 2, 'GVCN gộp vào việc L');
    const e1 = maLoi(() => pc.hoanTacLuu(QL, { lo: r1.lo }));
    assert(e1?.status === 409 && viecCua(X).length === 1, `lo1: ${e1?.status} ${e1?.message}`);
    bg.ghiGopYGv(loadPrincipal(gA), v[0].id, { studentId: emX[0], mon: 'gvcn', noiDung: 'Mẹ theo sát' });
    const e2 = maLoi(() => pc.hoanTacLuu(QL, { lo: r2.lo }));
    assert(e2?.status === 409 && cotCua(v[0].id).length === 2, `lo2: ${e2?.status} ${e2?.message}`);
  }));
  check('B1 · lịch chờ A→B (tuần +14) bị thay bằng A→C tuần +21 → việc theo hiệu lực + hạn của lịch mới', () => thu(() => {
    luu(X, { listening: gB }, { hieuLuc: { loai: 'tuan', tuanId: T14 } });
    luu(X, { listening: gF }, { hieuLuc: { loai: 'tuan', tuanId: tuan(addDays(T2, 21)) } });
    const v = viecCua(X);
    assert(v.length === 1 && v[0].hieu_luc === addDays(T2, 21) && v[0].han === addDays(T2, 25) && cotCua(v[0].id)[0].nguoi_moi === gF, JSON.stringify(v));
  }));
  check('B1 · chỉ mục ix_bg_gv_mo: câu việc đang mở của một người dùng chỉ mục (không quét cả bảng)', () => {
    const plan = all(`EXPLAIN QUERY PLAN SELECT id FROM ban_giao_gv b WHERE b.trang_thai = 'mo' AND (b.nguoi_lam = ? OR b.nguoi_lam IS NULL)`, gA).map((r) => r.detail).join(' | ');
    assert(/ix_bg_gv_mo/.test(plan), plan);
  });
  check('B1 · GV cũ còn việc mở → xem lớp ngày +30 được; xác nhận xong + quá xem_den → hết', () => thu(() => {
    luu(X, { listening: gB, speaking: gB, gvcn: gB });
    const v = viecCua(X)[0];
    assert(xemTamCo(loadPrincipal(gA), { classId: X, date: addDays(TODAY, 30) }), 'còn việc mở → xem +30');
    for (const sid of emX) for (const mon of ['listening', 'speaking', 'gvcn']) bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: sid, mon, noiDung: 'ok' });
    bg.xacNhanBanGiaoGv(loadPrincipal(gA), v.id);
    xoaNho();
    const a = loadPrincipal(gA);
    assert(!xemTamCo(a, { classId: X, date: addDays(TODAY, 30) }) && xemTamCo(a, { classId: X, date: addDays(TODAY, 3) }), 'sau xác nhận về mốc 7 ngày');
  }));

  /* ---------------------------------------------------------------- B2 */
  check('B2 · A ghi góp ý → đọc lại có; rỗng → 400; GVBM khác → 403; B (người mới) trước xác nhận → 403 đọc', () => thu(() => {
    luu(X, { listening: gB });
    const v = viecCua(X)[0];
    bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: emX[0], mon: 'listening', noiDung: ' Nghe ý chính tốt ' });
    const ph = bg.phieuBanGiaoGv(loadPrincipal(gA), v.id);
    assert(ph.em.find((e: any) => e.studentId === emX[0]).gopY.listening.noiDung === 'Nghe ý chính tốt' && ph.nguoiXem.viet && ph.cot[0].nhan === 'L', JSON.stringify(ph.em[0]));
    assert(maLoi(() => bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: emX[0], mon: 'listening', noiDung: '   ' }))?.status === 400, 'rỗng 400');
    assert(maLoi(() => bg.ghiGopYGv(loadPrincipal(gC), v.id, { studentId: emX[0], mon: 'listening', noiDung: 'x' }))?.status === 403, 'GVBM khác 403');
    assert(maLoi(() => bg.phieuBanGiaoGv(loadPrincipal(gB), v.id))?.status === 403, 'B trước xác nhận 403');
    assert(maLoi(() => bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: emX[0], mon: 'reading', noiDung: 'x' }))?.status === 400, 'cột lạ 400');
    luu(X, { listening: gA });   // về lại A → việc huỷ
    assert(one(`SELECT trang_thai FROM ban_giao_gv WHERE id = ?`, v.id).trang_thai === 'huy', 'việc huỷ');
    assert(maLoi(() => bg.phieuBanGiaoGv(loadPrincipal(gA), v.id))?.status === 403, 'rà sâu #731: GV cũ đọc việc đã huỷ → 403');
  }));
  check('B2 · xác nhận thiếu 1 em → 400 "Còn 1 em thiếu góp ý."; đủ → xong, B nhận đúng 1 thông báo, B đọc được, tự điền chụp', () => thu(() => {
    luu(X, { listening: gB });
    const v = viecCua(X)[0];
    const a = loadPrincipal(gA);
    bg.ghiGopYGv(a, v.id, { studentId: emX[0], mon: 'listening', noiDung: 'x' });
    const e = maLoi(() => bg.xacNhanBanGiaoGv(a, v.id));
    assert(e?.status === 400 && e.message === 'Còn 1 em thiếu góp ý.', e?.message);
    bg.ghiGopYGv(a, v.id, { studentId: emX[1], mon: 'listening', noiDung: 'y' });
    bg.xacNhanBanGiaoGv(a, v.id);
    const sau = one(`SELECT * FROM ban_giao_gv WHERE id = ?`, v.id);
    assert(sau.trang_thai === 'xong' && sau.tu_dien && sau.xong_boi === gA, JSON.stringify(sau));
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'ban_giao_gv'`, gB).n === 1, 'B một thông báo');
    const ph = bg.phieuBanGiaoGv(loadPrincipal(gB), v.id);
    assert(ph.trangThai === 'xong' && ph.em.length === 2 && !ph.nguoiXem.viet && ph.xacNhan, 'B đọc');
    assert(maLoi(() => bg.xacNhanBanGiaoGv(a, v.id))?.status === 409, 'xác nhận lần hai 409');
  }));
  check('B2 · QL điền thay khi quá hạn → dien_thay = 1; chưa quá hạn mà có người viết → 403', () => thu(() => {
    luu(X, { listening: gB });
    const v = viecCua(X)[0];
    assert(maLoi(() => bg.ghiGopYGv(QL, v.id, { studentId: emX[0], mon: 'listening', noiDung: 'x' }))?.status === 403, 'chưa quá hạn 403');
    conn.prepare(`UPDATE ban_giao_gv SET han = ? WHERE id = ?`).run(addDays(TODAY, -1), v.id);
    bg.ghiGopYGv(QL, v.id, { studentId: emX[0], mon: 'listening', noiDung: 'x' });
    assert(one(`SELECT dien_thay FROM ban_giao_gv_em WHERE ban_giao_id = ?`, v.id).dien_thay === 1, 'điền thay');
  }));
  check('B2 · phieuBanGiaoGv số câu không tăng theo số em (2 em vs 12 em)', () => thu(() => {
    luu(X, { listening: gB });
    luu(Y, { listening: gB });
    const a = loadPrincipal(gA);
    const nX = demCau(() => bg.phieuBanGiaoGv(a, viecCua(X)[0].id));
    const nY = demCau(() => bg.phieuBanGiaoGv(a, viecCua(Y)[0].id));
    assert(nX === nY, `${nX} vs ${nY}`);
  }));

  /* ---------------------------------------------------------------- B3 */
  check('B3 · myWork(A) có đúng 1 dòng ban_giao_gv:{id}, due = hạn; quá hạn → overdue (không chặn)', () => thu(() => {
    luu(X, { listening: gB, gvcn: gB });
    const v = viecCua(X)[0];
    const ds = myWork(loadPrincipal(gA)).items.filter((i: any) => i.key.startsWith('ban_giao_gv:'));
    assert(ds.length === 1 && ds[0].key === `ban_giao_gv:${v.id}` && ds[0].due === v.han && ds[0].href.includes('viec=ban-giao-gv'), JSON.stringify(ds));
    conn.prepare(`UPDATE ban_giao_gv SET han = ? WHERE id = ?`).run(addDays(TODAY, -2), v.id);
    xoaNho();
    const qh = myWork(loadPrincipal(gA)).items.find((i: any) => i.key === `ban_giao_gv:${v.id}`);
    assert(qh?.urgency === 'overdue', qh?.urgency);
  }));
  check('B3 · người viết NULL → QL chi nhánh có dòng; GV khác không', () => thu(() => {
    luu(X, { listening: gB });
    const v = viecCua(X)[0];
    conn.prepare(`UPDATE ban_giao_gv SET nguoi_lam = NULL WHERE id = ?`).run(v.id);
    xoaNho();
    assert(myWork(QL, { nguoi: 'tat-ca' } as any).items.some((i: any) => i.key === `ban_giao_gv:${v.id}`), 'QL tất cả');
    assert(myWork(QL).items.some((i: any) => i.key === `ban_giao_gv:${v.id}`), 'QL của tôi');
    assert(!myWork(loadPrincipal(gC)).items.some((i: any) => i.key === `ban_giao_gv:${v.id}`), 'GV khác không');
  }));
  check('B3 · dải hồ sơ lớp: GV cũ (hết ô) có xemTam L + việc của mình; GV đang dạy: xemTam null; GV mới thấy việc xong', () => thu(() => {
    luu(X, { listening: gB, speaking: gB, gvcn: gB });
    xoaNho();
    const pr = { phase: 'running', finalWeekStart: null, startWeekStart: start, totalWeeks: 8 };
    const a = dai.daiLop(loadPrincipal(gA), X, { pr, ft: true, ct: null });
    assert(a.xemTam && a.xemTam.monNgan.includes('L') && a.xemTam.den === addDays(TODAY, 7) && a.xemTam.banGiao?.tong === 2 && a.xemTam.nguoiMoi.id === gB, JSON.stringify(a.xemTam));
    assert(a.banGiaoGv.length === 1 && a.banGiaoGv[0].vai === 'viet', JSON.stringify(a.banGiaoGv));
    const c = dai.daiLop(loadPrincipal(gC), X, { pr, ft: true, ct: null });
    assert(c.xemTam === null && c.banGiaoGv.length === 0, JSON.stringify(c));
    const v = viecCua(X)[0];
    for (const sid of emX) for (const mon of ['listening', 'speaking', 'gvcn']) bg.ghiGopYGv(loadPrincipal(gA), v.id, { studentId: sid, mon, noiDung: 'ok' });
    bg.xacNhanBanGiaoGv(loadPrincipal(gA), v.id);
    const b = dai.daiLop(loadPrincipal(gB), X, { pr, ft: true, ct: null });
    assert(b.banGiaoGv.length === 1 && b.banGiaoGv[0].vai === 'doc' && b.banGiaoGv[0].xong, JSON.stringify(b.banGiaoGv));
  }));
  check('B3 · daiLop số câu như cũ (MỘT câu UNION, không thêm lượt khi có việc bàn giao)', () => thu(() => {
    const pr = { phase: 'running', finalWeekStart: null, startWeekStart: start, totalWeeks: 8 };
    const a = loadPrincipal(gA);
    const n0 = demCau(() => dai.daiLop(a, X, { pr, ft: true, ct: null }));
    luu(X, { listening: gB });
    const a2 = loadPrincipal(gA);
    const n1 = demCau(() => dai.daiLop(a2, X, { pr, ft: true, ct: null }));
    assert(n1 === n0, `${n0} → ${n1}`);
  }));

  /* ---------------------------------------------------------------- B4 + chủ SP 30/10 (bàn giao chuyển lớp) */
  const lenh = (nguon: number, dich: number, sid: number) => Number(conn.prepare(
    `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, han_gvbm, han_gvcn, tao_luc)
     VALUES (?,?,?, 'len_lop', 'cuoi-khoa', ?, ?, ?, ?, ?, ?)`,
  ).run(sid, nguon, dich, addDays(T2, 7), QL.userId, TODAY, addDays(TODAY, 1), addDays(TODAY, 2), NOW).lastInsertRowid);
  check('B4 · luuNhapNhanXet: ghi nháp, chưa xác nhận; xác nhận vẫn 400 khi < 15 ký tự (GVCN khác lớp đích); phiếu đã xác nhận → 400', () => thu(() => {
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND is_core = 1 AND status = 'active'`).run(gF, Y);   // GVCN lớp đích khác
    const id = lenh(X, Y, emX[0]);
    const a = loadPrincipal(gA);
    banGiao.luuNhapNhanXet(a, id, 'ngắn');
    const l = one(`SELECT nhan_xet_chung, xac_nhan_luc FROM lenh_chuyen_lop WHERE id = ?`, id);
    assert(l.nhan_xet_chung === 'ngắn' && l.xac_nhan_luc === null, JSON.stringify(l));
    assert(maLoi(() => banGiao.xacNhanBanGiao(a, id, 'ngắn'))?.status === 400, 'xác nhận < 15 → 400');
    banGiao.xacNhanBanGiao(a, id, 'Em chăm, mẹ theo sát qua Zalo.');
    assert(maLoi(() => banGiao.luuNhapNhanXet(a, id, 'khác'))?.status === 400, 'đã xác nhận → 400');
    assert(maLoi(() => banGiao.luuNhapNhanXet(loadPrincipal(gC), id, 'x'))?.status === 403, 'GVBM 403');
  }));
  check('Chủ SP 30/10 · chuyển lớp: môn ở lớp mới vẫn đúng GV cũ dạy → "Cùng GV", không tính thiếu, không việc GVBM; GVCN cùng người → nhận xét chung không bắt buộc', () => thu(() => {
    /* X, Y cùng bức tranh: A (GVCN + L + S), C (R), D (W1, W2). Y đổi R sang F → chỉ R cần bàn giao. */
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill = 'reading' AND status = 'active'`).run(gF, Y);
    const id = lenh(X, Y, emX[0]);
    const ph = banGiao.phieuBanGiao(loadPrincipal(gA), { lopNguonId: X });
    const em = ph.ds.find((e: any) => e.lenhId === id);
    const cung = em.mon.filter((m: any) => m.cungGv).map((m: any) => m.ma).sort().join(',');
    assert(!em.mon.find((m: any) => m.ma === 'reading').cungGv && cung.length > 0 && !cung.includes('reading'), cung);
    assert(em.soMonDaGhi === em.mon.length - 1 && em.gvbmChuaBanGiao.join() === em.mon.find((m: any) => m.ma === 'reading').ngan && em.gvcnCung, JSON.stringify(em));
    const vC = banGiao.viecBanGiao(gC).filter((v: any) => v.lopId === X);
    const vD = banGiao.viecBanGiao(gD).filter((v: any) => v.lopId === X);
    assert(vC.length === 1 && vD.length === 0, `C ${vC.length} · D ${vD.length}`);
    banGiao.xacNhanBanGiao(loadPrincipal(gA), id, '');
    assert(one(`SELECT xac_nhan_luc FROM lenh_chuyen_lop WHERE id = ?`, id).xac_nhan_luc, 'xác nhận không cần nhận xét chung');
  }));
  check('Audit 03/11 F05 · chuyển lớp FT: W1 · W2 riêng (hai GV không ghi đè nhau); em không học W2 không bị đòi; câu Writing cũ (17.4) chỉ đọc, phiếu đã xác nhận giữ', () => thu(() => {
    /* X: W1 = D, W2 = F · Y: W1, W2 = C (khác) → cả hai cần bàn giao. */
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill = 'writing2' AND status = 'active'`).run(gF, X);
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill IN ('writing1', 'writing2') AND status = 'active'`).run(gC, Y);
    xoaNho();
    const id = lenh(X, Y, emX[0]);
    banGiao.ghiMon(loadPrincipal(gD), id, 'writing1', 'W1 lập ý tốt');
    banGiao.ghiMon(loadPrincipal(gF), id, 'writing2', 'W2 thiếu ví dụ');
    const dong = all(`SELECT mon, noi_dung FROM ban_giao_mon WHERE lenh_id = ? ORDER BY mon`, id).map((r) => `${r.mon}:${r.noi_dung}`).join(' | ');
    assert(dong === 'writing1:W1 lập ý tốt | writing2:W2 thiếu ví dụ', dong);
    assert(maLoi(() => banGiao.ghiMon(loadPrincipal(gD), id, 'writing2', 'x'))?.status === 403, 'GV W1 ghi W2 → 403');
    assert(maLoi(() => banGiao.ghiMon(loadPrincipal(gD), id, 'writing', 'x'))?.status === 400, 'Writing chung (phiếu mới) → 400');
    const monEm = (sid: number) => banGiao.phieuBanGiao(loadPrincipal(gA), { lopNguonId: X }).ds.find((e: any) => e.studentId === sid);
    const e0 = monEm(emX[0]);
    assert(e0.mon.map((m: any) => m.ma).join() === 'listening,reading,writing1,writing2,speaking' && e0.writingCu === null, JSON.stringify(e0.mon.map((m: any) => m.ma)));
    /* emX[1] chỉ học W1 (N13): phiếu không có W2, GV W2 không có việc với em. */
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, mon_dang_ky, started_at, status, created_at) VALUES (?, 1, 'LT1', ?, ?, 'active', ?)`)
      .run(emX[1], JSON.stringify(['listening', 'reading', 'writing1', 'speaking']), TODAY, NOW);
    const id2 = lenh(X, Y, emX[1]);
    const e1 = monEm(emX[1]);
    assert(!e1.mon.some((m: any) => m.ma === 'writing2') && e1.mon.some((m: any) => m.ma === 'writing1'), JSON.stringify(e1.mon.map((m: any) => m.ma)));
    assert(!banGiao.viecBanGiao(gF).some((v: any) => v.lopId === X), 'GV W2 không có việc (em 1 đã ghi, em 2 không học W2)');
    assert(banGiao.viecBanGiao(gD).some((v: any) => v.lopId === X && v.mon === 'writing1' && v.emIds.includes(emX[1])), 'GV W1 còn việc với em 2');
    /* 17.4: phiếu chưa xác nhận có câu Writing chung cũ → chỉ đọc, W1 · W2 vẫn "chưa có". */
    conn.prepare(`DELETE FROM ban_giao_mon WHERE lenh_id = ?`).run(id);
    conn.prepare(`INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, dien_thay, ghi_luc) VALUES (?, 'writing', 'Câu chung cũ', ?, 0, ?)`).run(id, gD, NOW);
    const c0 = monEm(emX[0]);
    assert(c0.writingCu?.noiDung === 'Câu chung cũ' && c0.mon.filter((m: any) => m.ma.startsWith('writing')).every((m: any) => !m.noiDung), JSON.stringify(c0));
    assert(c0.gvbmChuaBanGiao.includes('W1') && c0.gvbmChuaBanGiao.includes('W2'), c0.gvbmChuaBanGiao.join());
    /* Phiếu ĐÃ xác nhận chỉ có câu Writing chung → giữ bộ môn cũ (không mở lại), sửa câu cũ được. */
    conn.prepare(`UPDATE lenh_chuyen_lop SET xac_nhan_luc = ?, xac_nhan_boi = ? WHERE id = ?`).run(NOW, gA, id);
    const x0 = monEm(emX[0]);
    assert(x0.mon.find((m: any) => m.ma === 'writing')?.noiDung === 'Câu chung cũ' && !x0.mon.some((m: any) => m.ma === 'writing1') && x0.writingCu === null, JSON.stringify(x0.mon.map((m: any) => m.ma)));
    banGiao.ghiMon(loadPrincipal(gD), id, 'writing', 'Câu chung sửa');
    assert(one(`SELECT noi_dung FROM ban_giao_mon WHERE lenh_id = ? AND mon = 'writing'`, id).noi_dung === 'Câu chung sửa', 'sửa câu cũ sau xác nhận');
    void id2;
  }));
  check('Mockup v11 (chủ SP 03/11) · GV dạy cả W1 + W2 → MỘT việc "W1 · W2" (mon writing1,writing2), số em từng task; Công việc một dòng', () => thu(() => {
    /* X: W1 + W2 = D · Y: W1 + W2 = C → D cần bàn giao cả hai task. */
    conn.prepare(`UPDATE teacher_assignments SET user_id = ? WHERE class_id = ? AND skill IN ('writing1', 'writing2') AND status = 'active'`).run(gC, Y);
    xoaNho();
    const id = lenh(X, Y, emX[0]);
    lenh(X, Y, emX[1]);
    banGiao.ghiMon(loadPrincipal(gD), id, 'writing1', 'W1 ổn');
    const vD = banGiao.viecBanGiao(gD).filter((v: any) => v.lopId === X);
    assert(vD.length === 1 && vD[0].mon === 'writing1,writing2' && vD[0].monNgan === 'W1 · W2', JSON.stringify(vD));
    assert(JSON.stringify(vD[0].tung.map((x: any) => [x.mon, x.daGhi, x.n])) === JSON.stringify([['writing1', 1, 2], ['writing2', 0, 2]]), JSON.stringify(vD[0].tung));
    const it = myWork(loadPrincipal(gD)).items.filter((i: any) => String(i.key).startsWith(`ban_giao_mon:${X}:`));
    assert(it.length === 1 && it[0].key === `ban_giao_mon:${X}:writing1,writing2` && it[0].contextLabel === 'GVBM · W1 1/2 em · W2 0/2 em', JSON.stringify(it));
    /* Một task đã đủ → việc chỉ còn task kia (mở ra vẫn hai cột — panel tự ghép W1 · W2). */
    banGiao.ghiMon(loadPrincipal(gD), id, 'writing1', 'W1 ổn'); banGiao.ghiMon(loadPrincipal(gD), id + 1, 'writing1', 'W1 khá');
    const v2 = banGiao.viecBanGiao(gD).filter((v: any) => v.lopId === X);
    assert(v2.length === 1 && v2[0].mon === 'writing2' && !v2[0].tung, JSON.stringify(v2));
  }));
  check('Mockup v11 · cột Kết quả bảng GVBM: diemMon = lượt mới nhất có điểm, band TỪNG môn (W1 · W2 riêng) như assessment_scores, ✓ / ✗ so kỳ vọng của lượt', () => thu(() => {
    /* Em demo FT có lượt MT đã chấm W1 + W2 (seed). */
    const em = one(`SELECT a.student_id, a.id AS aid, e.class_id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active'
      JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
      WHERE EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill = 'writing1' AND s.band IS NOT NULL)
        AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill = 'writing2' AND s.band IS NOT NULL)
      ORDER BY a.id LIMIT 1`);
    assert(em, 'seed không có em FT có điểm W1 + W2');
    const dich = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? LIMIT 1`, em.class_id).id;
    const id = lenh(em.class_id, dich, em.student_id);
    const ph = banGiao.phieuBanGiao(P.mbManager, { lopNguonId: em.class_id });
    const e = ph.ds.find((x: any) => x.lenhId === id);
    assert(e.diemMon && e.diemMon.luot && Array.isArray(e.diemMon.kn), JSON.stringify(e.diemMon));
    const sd = standing.standingFor([em.student_id]).get(em.student_id);
    const band = (k: string) => one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?`, sd.attemptId, k)?.band ?? null;
    for (const [k, ma] of [['W1', 'writing1'], ['W2', 'writing2']]) {
      const kn = e.diemMon.kn.find((x: any) => x.k === k);
      const v = band(ma);
      assert(kn && kn.v === v, `${k}: ${JSON.stringify(kn)} ≠ ${v}`);
      const kv = sd.expectation;
      assert(kn.dat === (v === null || kv === null ? null : v >= kv ? true : sd.kckDuoi ? null : false), `${k} dat ${kn.dat} (v ${v}, kv ${kv})`);
    }
    /* Phiếu đã xác nhận đọc bản chụp → không điểm hiện tại. */
    conn.prepare(`UPDATE lenh_chuyen_lop SET xac_nhan_luc = ?, xac_nhan_boi = ?, tu_dien = ? WHERE id = ?`).run(NOW, gA, JSON.stringify({ tuDien: e.tuDien, gvbmChuaBanGiao: [] }), id);
    const ph2 = banGiao.phieuBanGiao(P.mbManager, { lopNguonId: em.class_id });
    assert(ph2.ds.find((x: any) => x.lenhId === id).diemMon === null, 'phiếu đã xác nhận vẫn có diemMon');
  }));
}
