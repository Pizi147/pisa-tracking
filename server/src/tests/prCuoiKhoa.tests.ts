/**
 * PHÉP KIỂM P9b CUOI-KHOA (plan.md 1.6 N17, N20, N22; mockup `thiet-ke/v6/cuoi-khoa.html`):
 *  N20 hạn chốt T5 tuần trước Final + chuông T2 · T5 · T6 · Lên FT cuối tuần vẫn tạo / huỷ MT0 (dời tay khoá);
 *  N17 luồng cả lớp chỉ lớp đích cùng chi nhánh; Kết quả đầu ra máy ghi; Kỳ vọng FT chỉ QL, Học viên không Case;
 *  N22 ① GVCN chỉ ghi nhận xét · ② Kỳ vọng mở khi MT0 quá tuần muộn nhất; tóm tắt chân = đúng việc lúc thi hành.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export async function runPrCuoiKhoaTests(t: any) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nP9b CUOI-KHOA — trang Cuối khoá lớp thường + hạn chốt N20');

  check('CK-1a · mocLoTrinh N20: Final T2 21/09 → nhắc T2 14/09, hạn T5 17/09, bàn giao CN 27/09', () => {
    const m = d.mocLoTrinh('2026-09-21');
    assert(m.nhacTu === '2026-09-14' && m.hanChot === '2026-09-17' && m.hanBanGiao === '2026-09-27', JSON.stringify(m));
    assert(d.mocLoTrinh('2026-09-23').hanChot === '2026-09-17', 'ngày giữa tuần Final phải về T2 tuần đó');
  });

  check('CK-1b · tóm tắt chân (tacDongChot): bổ trợ theo môn trượt, Báo PH < 50 % kể cả khi lên, 50–59 học lại có Báo PH, Tutor theo kỹ năng, Học viên không Case', () => {
    const g = (tyLe: number, mon: string[] = [], ct = 'FOU') => d.goiYCuoiKhoa({ ct, tyLe, monTruot: mon });
    const em = (huong: string | null, goiY: any, o: any = {}) => ({ huong, goiY, ct: 'FOU', toFt: false, kyVong: null, ...o });
    const r = d.tacDongChot([
      em('len_lop', g(0.66, ['writing', 'speaking'])),                       // 2 Case bổ trợ
      em('len_lop', g(0.46)),                                                 // < 50 mà lên → Báo PH
      em('hoc_lai', g(0.55, ['reading'])),                                    // 50–59 học lại → Báo PH, không bổ trợ
      em('fast_track', g(0.88), { toFt: true, kyVong: { dat: false, nguyenNhan: 'trung_tam', mon: ['reading', 'writing', 'speaking'] } }),
      em('fast_track', g(0.84), { toFt: true, kyVong: { dat: false, nguyenNhan: 'hoc_sinh', mon: ['reading'] } }),
      em(null, g(0.7)),
    ]);
    assert(r.caseBoTro === 2 && r.baoPh === 2 && r.caseTutor === 3 && r.chuaHuong === 1, JSON.stringify(r));
    const be = d.tacDongChot([{ huong: 'fast_track', goiY: g(0.64, ['reading'], 'BE'), ct: 'BE', toFt: true, kyVong: null }]);
    assert(be.caseBoTro === 0, 'BE sang FT không bổ trợ (coBoTroFinal)');
    assert(d.coBaoPhKhiChot('len_lop', g(0.46)) && !d.coBaoPhKhiChot('len_lop', g(0.55)) && d.coBaoPhKhiChot('hoc_lai', g(0.55)), 'luật Báo PH');
  });

  check('CK-1c · chuHopKetLuan: nhãn "Kỳ vọng …" (một khái niệm một tên), không còn "Kết quả đầu ra (…)"', () => {
    const h = d.chuHopKetLuan({ ct: 'FOU', tyLe: 0.8, scored: 4, required: 4, mon: [], goiY: d.goiYCuoiKhoa({ ct: 'FOU', tyLe: 0.8, monTruot: [] }),
      quyetDinh: null, ketLuanFt: null, lenFt: true });
    assert(h.kyVong?.nhan === 'Kỳ vọng FOU IELTS > 3.5', String(h.kyVong?.nhan));
  });
  if (!conn) return;

  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const tr: any = await import('../classes/transition.ts');
  const dg: any = await import('../classes/danhGiaDauRa.ts');
  const kv: any = await import('../normal/kyVong.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loi = (fn: () => unknown): { status: number; msg: string } | null => { try { fn(); return null; } catch (e: any) { return { status: e?.status, msg: String(e?.message) }; } };
  const NGAY_GOC = getConfig('demo_date');
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  /** Giao dịch cuộn lại + trả ngày demo. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); datNgay(NGAY_GOC); }
  };
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const { id: KHAC, code: MA_KHAC } = get(`SELECT id, code FROM branches WHERE code != 'MB' ORDER BY id LIMIT 1`) as { id: number; code: string };
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 2`, MB).map((r) => r.user_id as number);
  let seq = 0;
  /** Lớp đang mở — `bat` = thứ Hai khai giảng. Final 21/09: Pre FOU 24/08 · FOU 03/08 · BE 20/07. */
  const lop = (kind: string, bat: string, o: { ft?: boolean; cn?: number } = {}) => {
    seq += 1;
    return (intake.createClass(P.admin, {
      code: `${o.cn === KHAC ? MA_KHAC : 'MB'} CK${seq}`, branchId: o.cn ?? MB, kind, isFastTrack: !!o.ft, route: o.ft ? 'LT1' : null, startDate: bat,
      startPeriodId: week.ensurePeriod(bat).id,
    }) as any).id as number;
  };
  const hocVien = (lopId: number, ma: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-CK${seq}`, `Hoc vien CK ${seq}`, `hoc vien ck ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-20', ?)`).run(sid, lopId, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, 5, '2026-07-20', 'active', ?)`)
      .run(sid, ma, now);
    return sid;
  };
  const ganGv = (lopId: number, userId: number) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?, NULL, 1, '2026-01-01', 'active', ?)`,
  ).run(userId, lopId, new Date().toISOString());

  check('CK-1d · việc QL "Chốt lộ trình" Pre FOU / FOU / BE: hiện từ T2 tuần trước Final, hạn T5, quá hạn đỏ từ T6, sau CN vẫn còn', () => thu(() => {
    const ds = [lop('PREFOU', '2026-08-24'), lop('FOU', '2026-08-03'), lop('BE', '2026-07-20')];
    for (const id of ds) hocVien(id, 'FOU');
    const viec = (ngay: string) => { datNgay(ngay); return (myWork(QL, {}).items as any[]).filter((x) => x.group === 'chot_len_ft' && ds.includes(x.classId)); };
    assert(viec('2026-09-13').length === 0, 'CN 13/09 đã có việc (trước T2 tuần trước Final)');
    const t2 = viec('2026-09-14');
    assert(t2.length === 3 && t2.every((x) => x.due === '2026-09-17' && x.urgency === 'normal'), JSON.stringify(t2.map((x) => [x.due, x.urgency])));
    assert(t2.every((x) => x.href === `/hoc-vien/lop/${x.classId}?xem=cuoi-khoa`), `href ${t2[0]?.href}`);
    assert(viec('2026-09-17').every((x) => x.urgency === 'today'), 'T5 phải "hôm nay"');
    assert(viec('2026-09-18').every((x) => x.urgency === 'overdue'), 'T6 phải quá hạn');
    assert(viec('2026-09-22').length === 3, 'sau CN vẫn còn việc (không chặn)');
  }));

  /* BE Final 21/09 (thứ Hai tuần 10) — em Lên FT. */
  const chotFtCuoiTuan = () => {
    const be = lop('BE', '2026-07-20'), ft = lop('FT', '2026-09-28', { ft: true });
    const sid = hocVien(be, 'BE');
    return { be, ft, sid };
  };
  const mt0 = (sid: number) => get(`SELECT a.id, a.status, rp.week_start FROM assessment_attempts a
      LEFT JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.student_id = ? AND a.kind = 'mt0' ORDER BY a.id DESC LIMIT 1`, sid);

  check('CK-2a · N20: chốt Lên FT thứ Bảy → MT0 có ở tuần Final; RKC: QL dời MT0 tay thứ Bảy → 409 hỏi (vượt N15 kèm xác nhận)', () => thu(() => {
    const { be, ft, sid } = chotFtCuoiTuan();
    datNgay('2026-09-19');
    const r = lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6 }] });
    assert(r.ok.includes(sid), JSON.stringify(r));
    const m = mt0(sid);
    assert(m && m.status !== 'cancelled' && m.week_start === '2026-09-21', `MT0 ${JSON.stringify(m)}`);
    const e = loi(() => ss.setSkillWeek(QL, m.id, 'listening', week.ensurePeriod('2026-09-28').id, {}));
    assert(e?.status === 409 && /Đang khoá đổi lịch MT cuối tuần/.test(e.msg), `dời tay: ${JSON.stringify(e)}`);
  }));

  check('CK-2b · N20: huỷ Lên FT Chủ nhật → MT0 huỷ theo; sửa sang Lên ELE thứ Sáu → MT0 huỷ', () => thu(() => {
    const { be, ft, sid } = chotFtCuoiTuan();
    datNgay('2026-09-18');
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6 }] });
    datNgay('2026-09-20');
    const l = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, sid);
    lenh.huyLenh(QL, l.id, 'đổi ý');
    assert(mt0(sid).status === 'cancelled', 'MT0 chưa huỷ khi huỷ lệnh Chủ nhật');
    const sid2 = hocVien(be, 'BE'), ele = lop('ELE', '2026-09-28');
    datNgay('2026-09-18');
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid2, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6 }] });
    const l2 = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, sid2);
    lenh.suaLenh(QL, l2.id, { huong: 'len_lop', toClassId: ele });
    assert(mt0(sid2).status === 'cancelled', 'MT0 chưa huỷ khi sửa sang Lên ELE thứ Sáu');
  }));

  check('CK-3a · N50 (7) thay N17: lớp đích gợi ý cùng chi nhánh (chi nhánh khác tải khi cần); trang Cuối khoá (caLop): lô giữ cùng chi nhánh, MỘT em đánh dấu + quyền lớp đích sang chi nhánh khác được; lệnh cũ chỉ đổi tuần, suaLenh vẫn được', () => thu(() => {
    const be = lop('BE', '2026-07-20'), ele = lop('ELE', '2026-09-28'), eleKhac = lop('ELE', '2026-09-28', { cn: KHAC }), beKhac = lop('BE', '2026-08-24', { cn: KHAC });
    const [a, b] = [hocVien(be, 'BE'), hocVien(be, 'BE')];
    datNgay('2026-09-17');
    const ung = tr.transitionPlan(P.admin, be).candidates as any[];
    /* Rà PTA ⑨: trang Cuối khoá chỉ nạp lớp cùng chi nhánh; lớp chi nhánh khác tải riêng khi mở ô lớp của một em (QL ra lệnh). */
    assert(ung.some((c) => c.id === ele) && ung.every((c) => c.branchId === MB), `ứng viên khác chi nhánh: ${JSON.stringify(ung.map((c) => [c.code, c.branchId]))}`);
    const khacCn = tr.lopKhacChiNhanh(P.admin, be) as any[];
    assert(khacCn.some((c) => c.id === eleKhac) && khacCn.every((c) => c.branchId !== MB), `lop-khac: ${JSON.stringify(khacCn.map((c) => [c.code, c.branchId]))}`);
    assert(loi(() => tr.lopKhacChiNhanh(P.coreTeacher, be))?.status === 403, 'GV không ra lệnh → 403');
    /* Rà PTA ①: máy chủ chặn — dòng không đánh dấu / lô > 1 em / người không có quyền ở lớp đích → lỗi dòng; một em đánh dấu `khacChiNhanh` + quyền lớp đích → được. */
    const chan = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [{ studentId: a, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-09-28' }] });
    assert(!chan.ok.length && /Cả lớp chỉ chuyển trong chi nhánh/.test(chan.failed[0]?.message ?? ''), `không đánh dấu: ${JSON.stringify(chan)}`);
    const lo = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [a, b].map((studentId) => lenh.dongTuBody({ studentId, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-09-28', khacChiNhanh: true })) });
    assert(!lo.ok.length && lo.failed.length === 2, `lô 2 em có đánh dấu: ${JSON.stringify(lo)}`);
    const qlMb = lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [lenh.dongTuBody({ studentId: a, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-09-28', khacChiNhanh: true })] });
    assert(!qlMb.ok.length && /chi nhánh khác — cần Head/.test(qlMb.failed[0]?.message ?? ''), `QL MB không có quyền lớp đích: ${JSON.stringify(qlMb)}`);
    const r = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [lenh.dongTuBody({ studentId: a, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-09-28', khacChiNhanh: true })] });
    assert(r.ok.includes(a), `trang Cuối khoá, một em khác chi nhánh (đánh dấu, có quyền): ${JSON.stringify(r)}`);
    lenh.huyLenh(P.admin, get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, a).id);
    /* Một em (hồ sơ HV / duyệt yêu cầu — không `caLop`) sang lớp khác chi nhánh: được. */
    const motEm = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: b, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-09-28' }] });
    assert(motEm.ok.includes(b), `một em khác chi nhánh: ${JSON.stringify(motEm)}`);
    /* Lệnh cũ giữ lớp đến, chỉ đổi tuần — ở trang Cuối khoá (caLop) và qua suaLenh: không chặn. */
    const doiTuan = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [{ studentId: b, huong: 'len_lop', toClassId: eleKhac, tuan: '2026-10-05' }] });
    assert(doiTuan.ok.includes(b), `lệnh cũ đổi tuần: ${JSON.stringify(doiTuan)}`);
    const l = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, b);
    assert(loi(() => lenh.suaLenh(P.admin, l.id, { tuan: '2026-09-28' })) === null, 'suaLenh đổi tuần lệnh cũ bị chặn');
    assert(get(`SELECT tuan_bat_dau FROM lenh_chuyen_lop WHERE id = ?`, l.id).tuan_bat_dau === '2026-09-28', 'suaLenh không đổi tuần');
    const mot = lenh.raLenh(P.admin, { lopNguonId: be, boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: a, huong: 'chuyen_lop', toClassId: beKhac, tuan: '2026-09-21', lyDo: 'gia đình chuyển nhà' }] });
    assert(mot.ok.includes(a), `Chuyển lớp một em khác chi nhánh: ${JSON.stringify(mot)}`);
  }));

  check('CK-3b · N22 ①: GVCN gửi Hướng (đề xuất) → 403; chỉ Nhận xét → lưu, đề xuất cũ giữ để đọc; GVCN đề xuất Kỳ vọng → 403', () => thu(() => {
    const be = lop('BE', '2026-07-20');
    ganGv(be, GV[0]);
    const GVCN = loadPrincipal(GV[0]);
    const sid = hocVien(be, 'BE');
    conn.prepare(`INSERT INTO danh_gia_dau_ra (student_id, class_id, nhan_xet, de_xuat, sua_boi, sua_luc) VALUES (?,?, 'cũ', 'len_lop', ?, '2026-09-01T00:00:00.000Z')`).run(sid, be, GV[0]);
    assert(loi(() => dg.ghiDanhGiaDauRa(GVCN, be, sid, { nhanXet: 'x', deXuat: 'hoc_lai' }))?.status === 403, 'GVCN gửi đề xuất hướng phải 403');
    const r = dg.ghiDanhGiaDauRa(GVCN, be, sid, { nhanXet: 'Chăm, cần luyện P' });
    const dong = get('SELECT nhan_xet, de_xuat FROM danh_gia_dau_ra WHERE student_id = ? AND class_id = ?', sid, be);
    assert(r.doi && dong.nhan_xet === 'Chăm, cần luyện P' && dong.de_xuat === 'len_lop', JSON.stringify(dong));
    const plan = tr.transitionPlan(QL, be);
    assert(plan.students.find((s: any) => s.id === sid)?.nhanXet === 'Chăm, cần luyện P', 'QL không thấy nhận xét GVCN ở trang Cuối khoá');
  }));

  check('CK-4 · một API (transitionPlan) đủ cột: Final % từng môn, Progress theo môn, gợi ý, nhận xét, kỳ vọng; tacDongChot = việc tạo lúc thi hành', () => thu(() => {
    const fou = lop('FOU', '2026-08-03'), be = lop('BE', '2026-09-28');
    const nhap = (ten: string) => {
      intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, target: 5, email: `${ten.replace(/\s/g, '').toLowerCase()}@thu.pisa`, dob: '2012-01-01' }], idempotencyKey: `ck-${ten}` });
      return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    };
    const [a, b] = [nhap('CK Final A'), nhap('CK Final B')];
    datNgay('2026-09-23');
    /* Final: a 66 % (W, S < 70) · b 46 %. */
    const fin = (sid: number, pct: [number, number, number, number]) => {
      const at = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' AND status != 'cancelled'`, sid);
      assert(!!at, `em ${sid} không có bài Final`);
      ['listening', 'reading', 'writing', 'speaking'].forEach((k, i) => conn.prepare(
        `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,?,100,?)`).run(at.id, k, pct[i], new Date().toISOString()));
      conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(at.id);
    };
    fin(a, [70, 70, 62, 62]); fin(b, [48, 46, 44, 46]);
    const plan = tr.transitionPlan(QL, fou);
    const ea = plan.students.find((s: any) => s.id === a);
    assert(ea.cuoiKhoa?.mon?.length === 4 && Math.round(ea.cuoiKhoa.tyLe * 100) === 66, JSON.stringify(ea.cuoiKhoa));
    assert('progress' in ea, 'thiếu Progress theo môn');
    const truoc = d.tacDongChot(plan.students.map((s: any) => ({ huong: 'len_lop', goiY: s.cuoiKhoa?.goiY ?? null, ct: 'FOU', toFt: false, kyVong: null })));
    const r = lenh.raLenh(QL, { lopNguonId: fou, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [a, b].map((studentId) => ({ studentId, huong: 'len_lop', toClassId: be, tuan: '2026-09-28', lyDo: 'gia đình xin lên' })) });
    assert(r.ok.length === 2, JSON.stringify(r));
    datNgay('2026-09-28');
    lenh.thiHanhLenhDenHan('2026-09-28');
    const boTro = get(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND origin_kind = 'chuyen_cap'`, a).n;
    const baoPh = get(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv'`, b).n;
    assert(truoc.caseBoTro === 2 && boTro === 2, `bổ trợ dự kiến ${truoc.caseBoTro}, tạo ${boTro}`);
    assert(truoc.baoPh === 1 && baoPh === 1, `Báo PH dự kiến ${truoc.baoPh}, tạo ${baoPh}`);
  }));

  check('CK-5 · N22 ②: MT0 quá tuần muộn nhất (tuần 2 FT) vẫn < 3 band → Kỳ vọng mở cho QL (cả lớp + một em); trước đó 400 "Chờ MT0"; Học viên không bắt kỹ năng, không Case', () => thu(() => {
    const { be, ft, sid } = chotFtCuoiTuan();
    datNgay('2026-09-17');
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6 }] });
    /* Học viên: chỉ phương án, không kỹ năng (mockup khung 4) — MT0 < 3 band không có kỹ năng gợi ý. */
    const dong = [{ sid, dat: false, nguyenNhan: 'hoc_sinh', mon: [], lyDo: 'Em nghỉ 5 buổi cuối khoá' }];
    const motEm = { dat: false, nguyenNhan: 'hoc_sinh', mon: [], ghiChu: 'Em nghỉ 5 buổi cuối khoá' };
    datNgay('2026-10-04');   // CN tuần 1 FT: còn trong hạn MT0
    assert(loi(() => kv.luuKyVong(QL, be, { dong }))?.status === 400, 'trong hạn MT0 thiếu band mà lưu được');
    assert(loi(() => ck.ghiKetLuanFt(QL, sid, motEm))?.status === 400, 'một em: trong hạn MT0 thiếu band mà lưu được');
    datNgay('2026-10-12');   // T2 tuần 3 FT: quá tuần muộn nhất
    assert(/kỹ năng/.test(loi(() => kv.luuKyVong(QL, be, { dong: [{ sid, dat: false, nguyenNhan: 'trung_tam', mon: [] }] }))?.msg ?? ''), 'Trung tâm không kỹ năng phải 400');
    assert(loi(() => ck.ghiKetLuanFt(QL, sid, motEm)) === null, 'một em (hồ sơ HV): quá hạn MT0 phải đánh được');
    const r = kv.luuKyVong(QL, be, { dong });
    assert(r.luu === 1 && r.taoCase === 0, JSON.stringify(r));
    assert(get(`SELECT ky_vong_dat, ky_vong_nguyen_nhan FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?`, sid, be).ky_vong_nguyen_nhan === 'hoc_sinh', 'chưa ghi Kỳ vọng');
    const viec = (myWork(QL, {}).items as any[]).filter((x) => x.group === 'ky_vong_dau_ra');
    assert(viec.every((x) => x.tieuDe.startsWith('Kỳ vọng · ') && x.href.endsWith('?xem=cuoi-khoa')), JSON.stringify(viec.map((x) => [x.tieuDe, x.href])));
  }));

  /* DUONG-LUI-2 (P1-09): chốt cả lớp "Ngay hôm nay" có Hoàn tác → không còn hộp "Chuyển ngay hôm nay?"; đảo lô sau trước. */
  const htcn: any = await import('../classes/hoanTacChuyenNgay.ts');
  /* `moc_he_thong`: bộ đếm làm mới bộ nhớ đệm (trigger khi lớp đổi trạng thái) — chỉ tăng, không phải dữ liệu nghiệp vụ. */
  const BO = new Set(['audit_logs', 'ghi_dao', 'notifications', 'moc_he_thong']);
  const bang = all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).map((r) => r.name as string).filter((b) => !BO.has(b));
  const chup = () => new Map(bang.map((b) => [b, JSON.stringify(all(`SELECT rowid AS __r, * FROM "${b}" ORDER BY rowid`))]));
  check('CK-7 · P1-09: chốt cả lớp "Ngay hôm nay" (2 em, mỗi em một lời gọi như web) → em sang lớp mới + `dao`; Hoàn tác (lô sau trước) → mọi bảng y như trước; lần hai 409; GVCN / QL chi nhánh khác 403; tuần sau không chụp', () => thu(() => {
    const be = lop('BE', '2026-07-20'), ele = lop('ELE', '2026-09-28');
    ganGv(be, GV[0]); ganGv(ele, GV[1] ?? GV[0]);
    const [a, b] = [hocVien(be, 'BE'), hocVien(be, 'BE')];   // cả lớp đi hết → lớp thường tự kết thúc, Hoàn tác mở lại
    datNgay('2026-09-24');
    const homNay = '2026-09-24';
    xoaNho();
    const truoc = chup();
    const dao: number[] = [];
    const do_: string[] = [];
    for (const sid of [a, b]) {
      const c0 = soCauSql(), r0 = soDongSql();
      const r = htcn.chotCaLop(QL, be, { tuanChung: null, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: ele, tuan: homNay, lyDo: 'CK-7' }] });
      const n = soCauSql() - c0;
      do_.push(`${n} câu ${soDongSql() - r0} dòng`);
      assert(n <= TRAN_GHI_LO.chotCaLopNgay, `chốt một em có chụp: ${n} câu > trần ${TRAN_GHI_LO.chotCaLopNgay}`);
      assert(r.daChuyen.includes(sid) && r.dao, `chốt ${sid}: ${JSON.stringify(r)}`);
      dao.push(r.dao);
      xoaNho();
    }
    assert(get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, a).class_id === ele, 'a đã sang ELE');
    const ttLop = get('SELECT status FROM classes WHERE id = ?', be).status;
    assert(loi(() => htcn.hoanTacChuyenNgay(P.coreTeacher, be, dao[1], 'classes'))?.status === 403, 'GVCN 403');
    assert(loi(() => htcn.hoanTacChuyenNgay(P.cpManager, be, dao[1], 'classes'))?.status === 403, 'QL chi nhánh khác 403');
    assert(loi(() => htcn.hoanTacChuyenNgay(QL, be, dao[1]))?.status === 404, 'bản ghi lớp không mở được qua đường một em');
    for (const id of [...dao].reverse()) {
      const c0 = soCauSql(), r0 = soDongSql();
      htcn.hoanTacChuyenNgay(QL, be, id, 'classes');
      const n = soCauSql() - c0;
      do_.push(`Hoàn tác ${n} câu ${soDongSql() - r0} dòng`);
      assert(n <= TRAN_GHI_LO.hoanTacChuyenNgay, `Hoàn tác: ${n} câu > trần ${TRAN_GHI_LO.hoanTacChuyenNgay}`);
      xoaNho();
    }
    console.log(`    (đo: ${do_.join(' · ')})`);
    const sau = chup();
    const khac = bang.filter((x) => truoc.get(x) !== sau.get(x));
    assert(!khac.length, `còn khác sau Hoàn tác: ${khac.join(', ')}`);
    assert(loi(() => htcn.hoanTacChuyenNgay(QL, be, dao[0], 'classes'))?.status === 409, 'Hoàn tác lần hai phải 409');
    /* Rà PTA ⑧: dòng "Ngay hôm nay" không có em hợp lệ → 400 (không IN () lỗi 500). */
    assert(loi(() => htcn.chotCaLop(QL, be, { tuanChung: null, dongs: [{ studentId: 'x', huong: 'len_lop', toClassId: ele, tuan: homNay }] }))?.status === 400, 'lô rỗng → 400');
    console.log(`    (lớp nguồn sau khi chuyển hết: ${ttLop} → sau Hoàn tác: ${get('SELECT status FROM classes WHERE id = ?', be).status})`);
    const c = hocVien(be, 'BE');
    const tuanSau = htcn.chotCaLop(QL, be, { tuanChung: null, dongs: [{ studentId: c, huong: 'len_lop', toClassId: ele, tuan: '2026-09-28', lyDo: 'CK-7' }] });
    assert(tuanSau.ok.includes(c) && !tuanSau.dao, `tuần sau không chụp: ${JSON.stringify(tuanSau)}`);
    /* Đo đối chứng: cùng thao tác KHÔNG chụp (đường cũ) — em a lần nữa. */
    xoaNho(); const c0 = soCauSql(), r0 = soDongSql();
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, caLop: true, dongs: [{ studentId: a, huong: 'len_lop', toClassId: ele, tuan: homNay, lyDo: 'CK-7' }] });
    console.log(`    (đo: không chụp ${soCauSql() - c0} câu ${soDongSql() - r0} dòng)`);
  }));

  check('CK-8 · rà PTA ② ③: chốt "Ngay hôm nay" Lên FT KÈM Kỳ vọng Không đạt (Trung tâm) trong cùng lời gọi → Case Kỳ vọng trên lộ trình FT mới nằm trong ảnh chụp; Hoàn tác (mảng dao, một giao dịch) → mọi bảng y như trước', () => thu(() => {
    const be = lop('BE', '2026-07-20'), ft = lop('FT', '2026-09-28', { ft: true });
    ganGv(be, GV[0]); ganGv(ft, GV[1] ?? GV[0]);
    const sid = hocVien(be, 'BE');
    datNgay('2026-09-17');
    lenh.raLenh(QL, { lopNguonId: be, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6 }] });
    const mt0 = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, sid).id as number;
    for (const k of ['listening', 'reading', 'speaking']) {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(mt0, k);
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, ?, 3, '2026-09-20T08:00:00Z')`).run(mt0, k);
    }
    datNgay('2026-09-28');
    xoaNho();
    const truoc = chup();
    const r = htcn.chotCaLop(QL, be, { tuanChung: null,
      dongs: [{ studentId: sid, huong: 'fast_track', toClassId: ft, tuan: '2026-09-28', mucTieu: 6, lyDo: 'CK-8' }],
      kyVong: [{ sid, dat: false, nguyenNhan: 'trung_tam', mon: ['reading'] }] });
    assert(r.daChuyen.includes(sid) && r.dao, JSON.stringify(r));
    const caseKv = get(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND title LIKE 'Kỳ vọng đầu ra%'`, sid).n;
    assert(caseKv === 1, `Case Kỳ vọng tạo cùng lần chốt: ${caseKv}`);
    xoaNho();
    htcn.hoanTacChuyenNgay(QL, be, [r.dao], 'classes');
    xoaNho();
    const sau = chup();
    const khac = bang.filter((x) => truoc.get(x) !== sau.get(x));
    assert(!khac.length, `còn khác sau Hoàn tác: ${khac.join(', ')}`);
    assert(loi(() => htcn.hoanTacChuyenNgay(QL, be, [r.dao], 'classes'))?.status === 409, 'lần hai 409');
  }));

  /* Trang Cuối khoá (web): kiểm nguồn — chốt "Ngay hôm nay" không hỏi lại, có toast Hoàn tác; Kỳ vọng gửi từng em, Học viên không bắt kỹ năng. */
  check('CK-6 · CuoiKhoaLop: Ngay hôm nay không hộp xác nhận + toast Hoàn tác; Kỳ vọng từng em; kvLoi giống máy chủ; chân chỉ tính dòng có lệnh', () => {
    const src = fs.readFileSync(path.join(ROOT, 'web/src/modules/classes/CuoiKhoaLop.tsx'), 'utf8') as string;
    assert(!src.includes('setHoiNgay') && src.includes('toast.hoanTac(') && src.includes('/hoan-tac-chuyen-ngay'), 'chốt Ngay hôm nay phải có Hoàn tác, không hộp hỏi');
    assert(src.includes('{ dong: [kvDong(r)] }') && src.includes('kyVong: rieng.filter((r) => laNgay(r)'), 'Kỳ vọng gửi từng em; em chuyển ngay gửi kèm lời gọi chuyển (rà PTA ②)');
    assert(!/hoc_sinh' && !x\.kv\.mon/.test(src), 'kvLoi bắt kỹ năng cho Học viên');
    assert(src.includes('coBaoPhKhiChot(huongLenh(r.x)!'), 'danh sách Báo PH phải dùng coBaoPhKhiChot');
  });

  check('CK-9 · NHẸ HƠN PR-5 (XM-14): tô màu Final / MT0 dùng mốc thật — khớp daiCuoiKhoa (ngưỡng lớp) và goiYKyVong (mốc chương trình)', () => {
    for (const nguong of [0.7, 0.6, 0.8]) {
      for (const r of [0, 0.5, 0.5999, 0.6, 0.6999, 0.7, 0.75, 0.7999, 0.8, 1]) {
        assert(d.datFinalMon(r, nguong) === (d.daiCuoiKhoa(r, nguong) === 'dat'), `Final ${r} / ngưỡng ${nguong}`);
      }
    }
    assert(d.datFinalMon(0.6999, null) === false && d.datFinalMon(0.7, null) === true, 'thiếu ngưỡng lớp → RATIO_PASS_THRESHOLD 0.7');
    for (const ct of ['FOU', 'BE', 'ELE']) {
      for (const b of [3, 3.5, 4, 4.5, 5, 5.5]) {
        const g = d.goiYKyVong(ct, { listening: b, reading: b, writing: b, speaking: b });
        assert(d.datMt0Mon(b, ct) === g.dat, `MT0 ${ct} ${b}: Overall đạt = kỹ năng đạt`);
        const g2 = d.goiYKyVong(ct, { listening: b, reading: 1, writing: 1, speaking: 1 });   // Overall trượt → monTruot liệt kê từng kỹ năng dưới mốc
        assert(!g2.dat && d.datMt0Mon(b, ct) === !g2.monTruot.includes('listening'), `MT0 ${ct} kỹ năng ${b} khớp monTruot`);
      }
    }
    assert(d.datMt0Mon(3.5, 'FOU') === false && d.datMt0Mon(4, 'FOU') === true && d.datMt0Mon(4, 'ELE') === false && d.datMt0Mon(4.5, 'ELE') === true, 'FOU ≥ 4 · ELE ≥ 4.5');
    assert(d.datMt0Mon(9, 'PET') === false, 'chương trình không có mốc → không tô xanh');
    const src = fs.readFileSync(path.join(ROOT, 'web/src/modules/classes/CuoiKhoaLop.tsx'), 'utf8') as string;
    assert(src.includes('datFinalMon(') && src.includes('datMt0Mon(') && !src.includes('+ Ghi chú'), 'trang dùng hàm mốc chung; bỏ nút "+ Ghi chú"');
  });
}
