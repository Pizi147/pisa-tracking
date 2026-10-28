/**
 * PHÉP KIỂM BAND-QUY-DOI (chủ SP 28/10) — bảng quy đổi số câu → band ở DB, Quản trị sửa: hợp lệ bảng · quyền (QT sửa, QL xem, GV 403) ·
 * điểm cũ giữ band khi đổi bảng, điểm mới theo bảng mới · phiên bản + Hoàn tác / khôi phục + chặn ghi đè · migrate v1 + v2 (Listening IDP).
 * Mỗi phép kiểm cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBandQuyDoiTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const bqd: any = await import('../platform/bangQuyDoi.ts');
  const m: any = await import('../migrate/prBandQuyDoi.ts');
  const { navOf } = await import('../platform/nav.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nBAND-QUY-DOI · bảng quy đổi band ở DB, Quản trị sửa, điểm cũ giữ band');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const GOC = dm.BANG_QUY_DOI_GOC;
  /** Gốc, L 26 câu 6 → 6.5. */
  const moi = () => ({ listening: GOC.listening.map((v: number, n: number) => (n === 26 ? 6.5 : v)), reading: [...GOC.reading] });

  const lop = classId('MB FT 101');
  const W = week.ensurePeriod('2026-11-02').id as number;
  const TRONG = '2026-11-04';
  const luot = one(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0 ORDER BY a.id DESC LIMIT 1`, lop)?.id as number;
  const dung = (aid: number) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(W, aid);
    xoaNho();
  };
  const bandL = () => one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, luot)?.band;

  check('BQD-1 · bảng hợp lệ: đủ 0–40, band 0–9 bậc 0.5, không giảm khi số câu tăng — lỗi nói đúng ô', () => {
    assert(dm.kiemBangQuyDoi(GOC).length === 0, 'bảng gốc phải hợp lệ');
    const thieu = dm.kiemBangQuyDoi({ listening: GOC.listening.slice(0, 40), reading: GOC.reading });
    assert(thieu.length === 1 && thieu[0].skill === 'listening' && thieu[0].cau === null && /41 ô/.test(thieu[0].loi), `thiếu ô: ${JSON.stringify(thieu)}`);
    const trong = dm.kiemBangQuyDoi({ listening: GOC.listening, reading: GOC.reading.map((v: number, n: number) => (n === 12 ? null : v)) });
    assert(trong.length === 1 && trong[0].cau === 12 && trong[0].loi === 'Reading 12 câu: chưa có band.', `ô trống: ${JSON.stringify(trong)}`);
    const le = dm.kiemBangQuyDoi({ listening: GOC.listening, reading: GOC.reading.map((v: number, n: number) => (n === 12 ? 4.3 : v)) });
    assert(le.length === 1 && le[0].skill === 'reading' && le[0].cau === 12 && /Reading 12 câu: band từ 0 đến 9, bậc 0.5 \(đang là 4.3\)/.test(le[0].loi) && le[0].ngan === '0–9, bậc 0.5', `bậc 0.5: ${JSON.stringify(le)}`);
    const giam = dm.kiemBangQuyDoi({ listening: GOC.listening.map((v: number, n: number) => (n === 20 ? 4.5 : v)), reading: GOC.reading });
    assert(giam.length === 1 && giam[0].cau === 20 && giam[0].loi === 'Listening 20 câu: 4.5 thấp hơn 19 câu (5.0) — band không giảm khi số câu tăng.', `giảm: ${JSON.stringify(giam)}`);
    const giam4 = dm.kiemBangQuyDoi({ listening: GOC.listening.map((v: number, n: number) => (n === 35 ? 7 : v)), reading: GOC.reading });
    assert(giam4.length === 1 && giam4[0].cau === 35 && /Listening 35 câu: 7.0 thấp hơn 34 câu \(7.5\)/.test(giam4[0].loi), `giảm ở 35: ${JSON.stringify(giam4)}`);
    const e = loi(() => thu(() => bqd.luuBangQuyDoi(P.admin, { listening: GOC.listening.map((v: number, n: number) => (n === 35 ? 7 : v)), reading: GOC.reading })));
    assert(e?.status === 400 && /Listening 35 câu/.test(e.message) && e.details?.loi?.[0]?.cau === 35, `máy chủ chặn bảng giảm: ${e?.status} ${e?.message}`);
  });

  check('BQD-2 · quyền: Quản trị sửa, Quản lý chỉ xem, GV 403; cờ nav', () => thu(() => {
    assert(bqd.xemBangQuyDoi(P.admin).suaDuoc === true, 'Quản trị sửa được');
    const ql = bqd.xemBangQuyDoi(P.mbManager);
    assert(ql.suaDuoc === false && ql.bang.listening.length === 41, 'Quản lý xem, không sửa');
    assert(loi(() => bqd.xemBangQuyDoi(P.lrTeacher))?.status === 403, 'GV xem màn quản trị → 403');
    assert(loi(() => bqd.luuBangQuyDoi(P.mbManager, moi()))?.status === 403, 'Quản lý lưu → 403');
    assert(loi(() => bqd.luuBangQuyDoi(P.lrTeacher, moi()))?.status === 403, 'GV lưu → 403');
    assert(!all('SELECT 1 FROM bang_quy_doi').length, 'lưu bị chặn không được ghi phiên bản');
    assert(navOf(P.admin).bangQuyDoi && navOf(P.mbManager).bangQuyDoi && !navOf(P.mbManager).admin && !navOf(P.lrTeacher).bangQuyDoi, 'cờ nav bangQuyDoi');
  }));

  check('BQD-3 · đổi bảng: điểm cũ giữ band (sửa ghi chú, gửi lại y số), điểm nhập / sửa sau theo bảng mới', () => thu(() => {
    assert(luot, 'cần một lượt MT ở MB FT 101');
    dung(luot);
    attempts.saveScore(P.lrTeacher, luot, 'listening', { rawScore: 26 }, TRONG);
    assert(bandL() === 6, `gốc: 26 câu = 6, có ${bandL()}`);
    bqd.luuBangQuyDoi(P.admin, { ...moi(), lyDo: 'Phép kiểm' });
    assert(bandL() === 6, 'đổi bảng không được đổi band đã lưu');
    attempts.saveScore(P.lrTeacher, luot, 'listening', { nhanXet: 'Phần 4 chậm' }, TRONG);
    assert(bandL() === 6, `sửa nhận xét giữ band cũ, có ${bandL()}`);
    attempts.saveScore(P.lrTeacher, luot, 'listening', { rawScore: 26 }, TRONG);
    assert(bandL() === 6, `gửi lại y số câu giữ band cũ, có ${bandL()}`);
    attempts.saveScore(P.lrTeacher, luot, 'listening', { rawScore: 25 }, TRONG);
    attempts.saveScore(P.lrTeacher, luot, 'listening', { rawScore: 26 }, TRONG);
    assert(bandL() === 6.5, `sửa số câu → bảng mới (26 = 6.5), có ${bandL()}`);
    assert(dm.bandTuSoCau(bqd.bangHienHanh(), 'listening', 26) === 6.5, '/ref/bang-quy-doi (web xem trước) trả bảng mới');
  }));

  check('BQD-4 · phiên bản: nhật ký, lưu y nguyên không thêm bản, chặn ghi đè (409), Hoàn tác về bản trước', () => thu(() => {
    const r1 = bqd.luuBangQuyDoi(P.admin, { ...moi(), lyDo: 'Theo đề Cam 19', tuPhienBan: 0 });
    const v1 = r1.phienBan[0];
    assert(r1.truoc === 0 && v1.id > 0 && v1.lyDo === 'Theo đề Cam 19' && JSON.stringify(v1.doi) === JSON.stringify({ 'L 26': [6, 6.5] }), `phiên bản 1: ${JSON.stringify(v1)}`);
    assert(r1.phienBan.at(-1).id === 0, 'bảng gốc là phiên bản cuối danh sách');
    const nk = one(`SELECT * FROM audit_logs WHERE entity_type = 'bang_quy_doi' AND entity_id = ?`, v1.id);
    assert(nk?.action === 'bang_quy_doi.sua' && JSON.parse(nk.before_json)['L 26'] === 6 && JSON.parse(nk.after_json)['L 26'] === 6.5, 'nhật ký ghi ô đổi');
    const lai = bqd.luuBangQuyDoi(P.admin, { ...moi(), tuPhienBan: v1.id });
    assert(lai.phienBan.length === 2, 'lưu y nguyên bảng đang dùng không thêm phiên bản');
    assert(loi(() => bqd.luuBangQuyDoi(P.admin, { ...moi(), tuPhienBan: 0 }))?.status === 409, 'sửa từ bản cũ (người khác vừa lưu) → 409');
    const ht = bqd.luuBangQuyDoi(P.admin, { khoiPhucTu: 0, tuPhienBan: v1.id, lyDo: 'Hoàn tác' });
    assert(JSON.stringify(bqd.bangHienHanh()) === JSON.stringify(GOC), 'Hoàn tác về bảng gốc');
    assert(ht.phienBan.length === 3 && ht.phienBan[0].khoiPhucTu === 0 && ht.phienBan[1].id === v1.id, 'Hoàn tác thêm phiên bản, giữ bản đã sửa');
    bqd.luuBangQuyDoi(P.admin, { khoiPhucTu: v1.id });
    assert(bqd.bangHienHanh().listening[26] === 6.5, 'khôi phục lại phiên bản 1');
    assert(loi(() => bqd.luuBangQuyDoi(P.admin, { khoiPhucTu: 99999 }))?.status === 400, 'phiên bản không có → 400');
  }));

  check('BQD-5 · migrate bản chính (chưa có bảng): v1 bảng cũ + v2 Listening theo IDP; Reading giữ; chạy lặp không làm gì', () => thu(() => {
    const mg: any = { applied: [] as string[] };
    conn.exec('DROP TABLE bang_quy_doi');
    m.migratePrBandQuyDoi(conn, mg.applied);
    assert(mg.applied.length === 1 && all('SELECT 1 FROM bang_quy_doi').length === 2, `2 phiên bản: ${JSON.stringify(mg.applied)}`);
    const b = bqd.bangHienHanh();
    const L = (n: number) => b.listening[n];
    assert(L(10) === 3.5 && L(11) === 4 && L(18) === 5.5 && L(19) === 5.5 && L(26) === 6.5 && L(32) === 7.5 && L(9) === GOC.listening[9], `L theo IDP: ${b.listening.join(',')}`);
    assert(JSON.stringify(b.reading) === JSON.stringify(GOC.reading), 'Reading giữ bảng cũ');
    assert(dm.kiemBangQuyDoi(b).length === 0, 'v2 hợp lệ');
    for (let n = 11; n <= 40; n += 1) assert(L(n) === dm.BANG_IDP.listening[n], `L ${n} ≠ IDP`);
    for (let n = 4; n <= 40; n += 1) assert(GOC.reading[n] === dm.BANG_IDP.reading[n], `R ${n}: bảng cũ ≠ IDP Academic`);
    const x = bqd.xemBangQuyDoi(P.admin);
    assert(x.phienBan.length === 2 && x.phienBan[1].id !== 0 && Object.keys(x.phienBan[0].doi).length > 0 && /IDP/.test(x.phienBan[0].lyDo),
      `lịch sử v2, v1 (không có "Bảng gốc" ảo): ${JSON.stringify(x.phienBan.map((p: any) => p.id))}`);
    m.migratePrBandQuyDoi(conn, mg.applied);
    assert(mg.applied.length === 1 && all('SELECT 1 FROM bang_quy_doi').length === 2, 'chạy lặp không làm gì');
  }));
}
