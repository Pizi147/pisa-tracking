/**
 * PHÉP KIỂM V5 · SV-SO2 (chỉ số, báo cáo, GV — `08-ke-hoach-trien-khai.md` mục 6; `05-tu-dien-chi-so.md` mục 1, 2, #1, #1b, #8, #9):
 *  · quy tắc Overall ở tab Phân tích lớp + hồ sơ GV (T06, T07, T08) — cùng `danhGiaMon` với Phân tích GV (#514);
 *  · Đạt MT đơn vị HV, lượt vào kỳ theo ngày chốt điểm cuối (K9), panel chỉ đọc 15/20 (T11), tổng nhiều chi nhánh Σ tử / Σ mẫu (T20);
 *  · Việc đúng hạn (việc) = Kết quả PA; Điểm đúng hạn (bài); hồ sơ GV theo kỳ cùng hàm tập với bảng; mẫu 0 "Chưa có dữ liệu" (T19);
 *  · `10` (22/10): Thi tháng này (P4), kết quả theo lớp gom lượt từng HV trong kỳ (P8), khoảng tuần tự do (P9);
 *  · panel số không trả khối việc (C22).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvSo2Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const lop: any = await import('../classes/phanTichLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const bc: any = await import('../phanTich/baoCao.ts');
  const mt: any = await import('../worklist/metrics.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  console.log('\nV5 · SV-SO2 — Overall ở Phân tích lớp / hồ sơ GV, Đạt MT theo HV (K9, T11, T20), Việc / Điểm đúng hạn, hồ sơ GV theo kỳ, panel chỉ đọc');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const D = TODAY;
  const tuanNay = week.mondayOf(D);
  const MB_FT = classId('MB FT 101');
  let seq = 0;
  /** Em mới MB FT 101, Target 6.5 → MT1 kỳ vọng 5.5; MT1 ở tuần `tuan`, mọi điểm nhập ngày `nhap`. */
  const mt1 = (bands: Record<string, number>, tuan = tuanNay, nhap = D) => {
    const ten = `SVSO2 HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `svso2-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuan).id });
    for (const [k, b] of Object.entries(bands)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, ?, 20, 40, ?, ?)`).run(a.id, k, b, nhap);
    }
    return { sid, cy, attemptId: a.id as number };
  };
  const DU = (r: number) => ({ listening: 6.5, reading: r, writing1: 6.5, writing2: 6.5, speaking: 6.5 });
  const oLop = (k: string) => { xoaNho(); return lop.phanTichLop(P.mbManager, MB_FT).ds[k] ?? { dat: [], chua: [] }; };

  check('SVSO2 (T06, T07, T08) · tab Phân tích lớp theo Overall: Overall đạt → R 5.0 Đạt; Overall chưa đạt → R Chưa đạt; thiếu Overall → ngoài mẫu', () => thu(() => {
    const t06 = mt1(DU(5.0));
    const t07 = mt1({ listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.5 });
    const t08 = mt1({ listening: 4.0, reading: 7.0 });
    const r = oLop('reading|mt1');
    assert(r.dat.includes(t06.sid), 'T06 phải Đạt');
    assert(r.chua.includes(t07.sid) && oLop('speaking|mt1').dat.includes(t07.sid), 'T07: R chưa đạt, S đạt');
    assert(!r.dat.includes(t08.sid) && !r.chua.includes(t08.sid), 'T08 không vào mẫu');
  }));

  let gvR: number | null = null;
  check('SVSO2 (T06, K5) · hồ sơ GV theo kỳ: Kết quả R của GV R = ô bảng Phân tích GV; panel "lượt kỹ năng", em T06 Đạt, không khối việc', () => thu(() => {
    const e = mt1(DU(5.0));
    xoaNho();
    const bang = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay });
    const h = bang.hang.find((x: any) => x.ketQua.reading?.k === 'so' && pt.oChiSoGv(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay, gv: x.id, cot: 'ket-qua:reading' })
      .rows.some((r: any) => r.href === `/hoc-vien/${e.sid}`));
    assert(h, 'không thấy GV R');
    gvR = h.id;
    const ky = pt.chiSoHoSoGv(P.mbManager, h.id, { tu: tuanNay, den: tuanNay });
    const o = ky.ketQuaTheoKyNang.find((x: any) => x.khung === 'ft' && x.skill === 'reading')?.o;
    const soCn = get(`SELECT COUNT(DISTINCT c.branch_id) AS n FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.user_id = ?`, h.id).n;
    /* UI-HO-SO-GV (chủ SP 23/10): hồ sơ GV tách thi thật khỏi kết quả Test; bảng Phân tích GV còn gộp (XM-5) → bảng = hồ sơ Test + thi thật R. */
    const thiR = ky.thiThatTheoKyNang.find((x: any) => x.skill === 'reading')?.o ?? { dung: 0, tong: 0 };
    if (soCn === 1) assert((o?.tong ?? 0) + thiR.tong === h.ketQua.reading.tong && (o?.dung ?? 0) + thiR.dung === h.ketQua.reading.dung, JSON.stringify({ o, thiR, bang: h.ketQua.reading }));
    const p = pt.oChiSoHoSoGv(P.mbManager, h.id, { tu: tuanNay, den: tuanNay, cot: 'ket-qua:ft:reading' });
    const dong = p.rows.find((r: any) => r.href === `/hoc-vien/${e.sid}`);
    assert(dong?.sub.endsWith('Đạt') && dong.sub.includes('R 5.0') && p.tieuDe.includes('lượt Test') && p.n === o.tong, JSON.stringify({ dong, t: p.tieuDe, n: p.n }));
    assert(p.rows.every((r: any) => !('viec' in r)), 'panel có khối việc');
    /* UI-HO-SO-GV: hàng lớp bảng Học thuật (`hocThuatTheoLop`) — cùng tập với ô kỹ năng (Σ các kỹ năng của lớp). */
    const hl = ky.hocThuatTheoLop.find((x: any) => x.classId === MB_FT);
    const cong = ky.ketQuaTheoLop.filter((x: any) => x.classId === MB_FT && x.o.k === 'so').reduce((a: number, x: any) => a + x.o.tong, 0);
    assert(hl && hl.luot > 0 && (hl.ketQua.k === 'so' ? hl.ketQua.tong : 0) === cong, JSON.stringify({ hl, cong }));
  }));

  check('SVSO2 (05 #8, #9, 10) · Việc đúng hạn = Kết quả PA (đơn vị việc; Xử lý vi phạm đã bỏ khỏi bảng), Điểm đúng hạn = Chấm điểm (bài); panel đủ số dòng', () => thu(() => {
    const ky = { ct: 'ft', tu: week.mondayOf(t.addDays(D, -7 * 12)), den: tuanNay };
    const bang = pt.phanTichGiaoVien(P.mbManager, ky);
    const tong = (o: any) => (o?.k === 'so' ? o.tong : 0), dung = (o: any) => (o?.k === 'so' ? o.dung : 0);
    let coViec = false;
    for (const h of bang.hang) {
      assert(!('xuLyViPham' in h) && tong(h.viecDungHan) === tong(h.ghiKetQuaPa) && dung(h.viecDungHan) === dung(h.ghiKetQuaPa), `${h.ten}: ${JSON.stringify(h)}`);
      if (tong(h.viecDungHan) && !coViec) {
        coViec = true;
        const p = pt.oChiSoGv(P.mbManager, { ...ky, gv: h.id, cot: 'viec-dung-han' });
        assert(p.n === tong(h.viecDungHan) && p.tieuDe.endsWith(`${dung(h.viecDungHan)}/${tong(h.viecDungHan)} việc`), p.tieuDe);
        assert(p.rows.every((r: any) => /^Kết quả PA/.test(r.sub) && !('viec' in r)), JSON.stringify(p.rows[0]));
      }
    }
    assert(coViec, 'seed không có GV nào có việc có hạn trong 13 tuần');
    const h = bang.hang.find((x: any) => x.chamDiem.k === 'so')!;
    const soCn = get(`SELECT COUNT(DISTINCT c.branch_id) AS n FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.user_id = ?`, h.id).n;
    const hoSo = pt.chiSoHoSoGv(P.mbManager, h.id, { tu: ky.tu, den: ky.den });
    const p = pt.oChiSoHoSoGv(P.mbManager, h.id, { tu: ky.tu, den: ky.den, cot: 'cham-diem' });
    assert(p.n === hoSo.diemDungHan.tong && p.tieuDe.endsWith(`${hoSo.diemDungHan.dung}/${hoSo.diemDungHan.tong} bài`), JSON.stringify({ t: p.tieuDe, o: hoSo.diemDungHan }));
    if (soCn === 1 && !get(`SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE ta.user_id = ? AND c.is_fast_track = 0`, h.id)) {
      assert(hoSo.diemDungHan.tong === h.chamDiem.tong && hoSo.diemDungHan.dung === h.chamDiem.dung, 'hồ sơ ≠ bảng (một chi nhánh, một khung)');
    }
  }));

  check('SVSO2 (quyền, T19) · GV tự xem hồ sơ theo kỳ; GV khác / QL chi nhánh khác bị chặn; kỳ không dữ liệu → "Chưa có dữ liệu", không 0 %', () => {
    assert(gvR != null, 'thiếu GV R từ phép kiểm trước');
    const pGv = loadPrincipal(gvR!);
    const tu = '2025-01-06';
    const r = pt.chiSoHoSoGv(pGv, gvR, { tu, den: tu });
    assert(['diemDungHan', 'viecDungHan', 'ketQua'].every((k) => r[k].k === 'rong' || r[k].k === 'na'), JSON.stringify(r));
    assert(d.chuOPtGv(r.diemDungHan).phu === 'Chưa có dữ liệu' || r.diemDungHan.k === 'na', 'T19');
    let chan = 0;
    try { pt.chiSoHoSoGv(pGv, P.lrTeacher.userId === gvR ? P.w1Teacher.userId : P.lrTeacher.userId, { tu, den: tu }); } catch (e: any) { chan += e.status === 403 ? 1 : 0; }
    try { pt.chiSoHoSoGv(P.cpManager, gvR, {}); } catch (e: any) { chan += e.status === 403 ? 1 : 0; }
    try { pt.chiSoHoSoGv(P.mbManager, gvR, { tu: '2025-01-07', den: '2025-01-07' }); } catch (e: any) { chan += e.status === 400 ? 1 : 0; }
    assert(chan === 3, `chặn ${chan}/3`);
  });

  check('SVSO2 (P8) · hồ sơ GV theo kỳ: Kết quả theo lớp = lượt của từng HV có tuần thi trong kỳ; Σ các lớp = ô kỹ năng; panel một lớp đúng số dòng', () => thu(() => {
    const e = mt1(DU(5.0));
    xoaNho();
    const ky = pt.chiSoHoSoGv(P.mbManager, gvR, { tu: tuanNay, den: tuanNay });
    const r = ky.ketQuaTheoLop.filter((x: any) => x.khung === 'ft' && x.skill === 'reading');
    const kn = ky.ketQuaTheoKyNang.find((x: any) => x.khung === 'ft' && x.skill === 'reading').o;
    assert(r.reduce((s: number, x: any) => s + x.o.tong, 0) === kn.tong && r.reduce((s: number, x: any) => s + x.o.dung, 0) === kn.dung, JSON.stringify({ r, kn }));
    const mb = r.find((x: any) => x.classId === MB_FT);
    const p = pt.oChiSoHoSoGv(P.mbManager, gvR, { tu: tuanNay, den: tuanNay, cot: `ket-qua:ft:reading:${MB_FT}` });
    assert(mb && p.n === mb.o.tong && p.rows.every((x: any) => x.lop === 'MB FT 101') && p.rows.some((x: any) => x.href === `/hoc-vien/${e.sid}`), JSON.stringify({ mb, n: p.n }));
  }));

  check('SVSO2 (P9) · khoảng tuần tự do: 30 tuần không bị chặn ở hồ sơ GV theo kỳ và bảng Phân tích GV', () => {
    const tu = week.mondayOf(t.addDays(D, -7 * 29));
    xoaNho();
    assert(pt.chiSoHoSoGv(P.mbManager, gvR, { tu, den: tuanNay }).tu === tu, 'hồ sơ');
    assert(pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu, den: tuanNay }).tu === tu, 'bảng');
  });

  check('SVSO2 (P4) · Thi tháng này: HV có ngày thi thật trong tháng hiện tại (tháng dự kiến không tính), số = panel', () => thu(() => {
    const co = mt1(DU(6.5)), duKien = mt1(DU(6.5)), thangSau = mt1(DU(6.5));
    const ngay = `${D.slice(0, 7)}-28`;
    conn.prepare(`UPDATE learning_cycles SET exam_date = ? WHERE id = ?`).run(ngay, co.cy);
    conn.prepare(`UPDATE learning_cycles SET exam_date = NULL, exam_month = ? WHERE id = ?`).run(D.slice(0, 7), duKien.cy);
    conn.prepare(`UPDATE learning_cycles SET exam_date = ? WHERE id = ?`).run(t.addDays(`${D.slice(0, 7)}-01`, 40), thangSau.cy);
    xoaNho();
    const tap = bc.tapThiThangNay(P.mbManager, { branchId: null, ct: 'ft' });
    assert(tap.has(co.sid) && !tap.has(duKien.sid) && !tap.has(thangSau.sid), JSON.stringify([...tap]));
    const f = { branchId: null, ct: 'ft', tu: tuanNay, den: tuanNay };
    const p = bc.oBaoCao(P.mbManager, { ...f, o: 'thi-thang-nay' });
    assert(bc.baoCao(P.mbManager, f).chuY.thiThangNay === p.n && p.n === tap.size, 'số ≠ panel');
    assert(p.rows.find((r: any) => r.id === co.sid)?.sub.endsWith(`thi 28/${D.slice(5, 7)}`), JSON.stringify(p.rows[0]));
  }));

  check('SVSO2 (rà #521-1) · GV có phân công đã kết thúc ở chi nhánh khác tự xem kỳ cũ → không 403; số = số QT thấy (Kết quả PA theo chủ Case, không theo phạm vi người xem)', () => thu(() => {
    const cp = get(`SELECT c.id, c.branch_id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'CP' AND c.is_fast_track = 1 ORDER BY c.id LIMIT 1`);
    assert(cp, 'seed thiếu lớp FT ở CP');
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at) VALUES (?, ?, 'reading', 0, ?, ?, 'ended', ?)`)
      .run(gvR, cp.id, t.addDays(tuanNay, -70), t.addDays(tuanNay, -14), D);
    const cas = get(`SELECT sc.id FROM sos_cases sc JOIN case_interventions iv ON iv.case_id = sc.id JOIN classes c ON c.id = sc.goc_class_id
      WHERE c.branch_id = ? AND c.is_fast_track = 1 ORDER BY sc.id LIMIT 1`, cp.branch_id);
    if (cas) conn.prepare(`UPDATE sos_cases SET owner_user_id = ? WHERE id = ?`).run(gvR, cas.id);
    xoaNho();
    const ky = { tu: week.mondayOf(t.addDays(D, -7 * 12)), den: tuanNay };
    const tuXem = pt.chiSoHoSoGv(loadPrincipal(gvR!), gvR, ky);
    xoaNho();
    const qt = pt.chiSoHoSoGv(P.admin, gvR, ky);
    assert(JSON.stringify(tuXem) === JSON.stringify(qt), JSON.stringify({ tuXem: tuXem.ghiKetQuaPa, qt: qt.ghiKetQuaPa }));
    const pTu = pt.oChiSoHoSoGv(loadPrincipal(gvR!), gvR, { ...ky, cot: 'ghi-pa' });
    assert(qt.ghiKetQuaPa.k !== 'so' || pTu.n === qt.ghiKetQuaPa.tong, `panel ${pTu.n}`);
  }));

  check('SVSO2 (K9) · Đạt MT theo ngày chốt điểm cuối: MT thi 2 tuần trước, nhập xong tuần này → vào kỳ tuần này, không vào kỳ tuần thi', () => thu(() => {
    const truoc = t.addDays(tuanNay, -14);
    const e = mt1(DU(6.5), truoc, D);
    const nay = bc.tapDatMt(P.mbManager, { branchId: null, ct: 'ft', tu: tuanNay, den: tuanNay });
    assert(nay.mau.has(e.sid) && nay.dat.has(e.sid), 'phải vào kỳ chốt');
    xoaNho();
    const cu = bc.tapDatMt(P.mbManager, { branchId: null, ct: 'ft', tu: truoc, den: truoc });
    assert(!cu.mau.has(e.sid) && !cu.chuaDu.has(e.sid), 'không được vào kỳ tuần thi');
    const thieu = mt1({ listening: 6.5, reading: 6.5 });
    xoaNho();
    const r = bc.tapDatMt(P.mbManager, { branchId: null, ct: 'ft', tu: tuanNay, den: tuanNay });
    assert(r.chuaDu.has(thieu.sid) && !r.mau.has(thieu.sid), 'thiếu Overall → Chưa đủ dữ liệu, ngoài mẫu');
  }));

  check('SVSO2 (T11, C22) · Báo cáo Đạt MT: số = panel chỉ đọc (tiêu đề "a/b HV", dòng ghi Overall + kỳ vọng, chưa đạt trước, không khối việc)', () => thu(() => {
    mt1(DU(6.5)); mt1({ listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.0 });
    xoaNho();
    const f = { branchId: null, ct: 'ft', tu: tuanNay, den: tuanNay };
    const k = bc.baoCao(P.mbManager, f).datMt;
    const p = bc.oBaoCao(P.mbManager, { ...f, o: 'dat-mt' });
    assert(k && k.mau >= 2 && p.n === k.mau && p.tieuDe === `Đạt MT · ${Math.round((100 * k.dat) / k.mau)} % = ${k.dat}/${k.mau} HV`, JSON.stringify({ k, t: p.tieuDe }));
    /* 6c-2: Overall + kỳ vọng gửi có cấu trúc (`diemCase`, nhãn Overall) — web vẽ ✓ / ✗ + thiếu như dòng Case; chưa đạt vẫn đứng trước. */
    const chua = (r: any) => r.diemCase.so < r.diemCase.kyVong;
    assert(chua(p.rows[0]) && p.rows.every((r: any) => r.diemCase?.nhan === 'Overall' && typeof r.diemCase.so === 'number' && typeof r.diemCase.kyVong === 'number' && !('viec' in r))
      && p.rows.findIndex((r: any) => !chua(r)) >= p.rows.filter(chua).length - 1, JSON.stringify(p.rows[0]));
    assert(bc.oBaoCao(P.mbManager, { ...f, o: 'dat-mt-chua-du' }).n === k.chuaDu, 'ngoài mẫu');
  }));

  check('SVSO2 (T20) · Đạt MT nhiều chi nhánh = Σ tử / Σ mẫu theo chi nhánh (không trung bình các %)', () => {
    xoaNho();
    const f = { ct: 'ft', tu: week.mondayOf(t.addDays(D, -7 * 12)), den: tuanNay };
    const all = bc.baoCao(P.admin, { ...f, branchId: null }).datMt;
    const cn = (conn.prepare('SELECT id FROM branches').all() as any[]).map((b) => (xoaNho(), bc.baoCao(P.admin, { ...f, branchId: b.id }).datMt));
    const sum = (k: string) => cn.reduce((s, x) => s + x[k], 0);
    assert(all.mau > 0 && all.dat === sum('dat') && all.mau === sum('mau'), JSON.stringify({ all, cn }));
  });

  check('SVSO2 (C22) · dòng panel số không mang `viec`; khu làm việc (Lịch Test · Quá hạn chấm) giữ', () => {
    xoaNho();
    const r = mt.metricResponse(mt.metricSet(P.mbManager, 'case-mo', {}), true, P.mbManager);
    assert(r.rows.length > 0 && r.rows.every((x: any) => !('viec' in x)), 'case-mo còn viec');
    const ids = mt.metricSet(P.mbManager, 'case-mo', {}).ids;
    assert(mt.rowsFor('case', ids, undefined, P.mbManager, true).some((x: any) => 'viec' in x), 'kemViec phải giữ khối việc');
  });
}
