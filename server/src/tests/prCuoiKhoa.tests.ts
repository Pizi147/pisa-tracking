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
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
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

}
