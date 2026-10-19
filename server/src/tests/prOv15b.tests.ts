/**
 * PHÉP KIỂM OV-15b — lưới điểm, hồ sơ lớp, dán Excel, đường Nhập điểm. Kế hoạch: docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md (OV-15b).
 *  · 7: "Nhập bởi …" chỉ khi ô ĐÃ có điểm — máy chủ không gửi người nhập cho ô chưa có điểm (ô chỉ nhận xét, ô đã xoá điểm, GV chấm chéo đã phân công);
 *  · 2: dán từ Excel — hàm thuần (tách bảng, khớp tên bỏ dấu, trống ≠ 0 ≠ "-") + endpoint lô dùng lại kiểm ô của `saveScore`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15bTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t as any;
  const svc: any = await import('../fasttrack/attempts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15b · Lưới điểm, dán Excel, "Nhập bởi" chỉ khi có điểm');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('OV15b-7 · ô chưa có điểm (chỉ nhận xét / đã gán người nhập cũ / GV chấm) không gửi người nhập; có điểm thì gửi', () => thu(() => {
    const a = one(`SELECT a.* FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
      WHERE c.is_fast_track = 1 AND a.status <> 'cancelled' AND a.kind = 'mock' ORDER BY a.id LIMIT 1`);
    assert(a, 'dữ liệu demo: phải có lượt Mock lớp FT');
    const u = P.admin.userId;
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill IN (?, ?)').run(a.id, 'speaking', 'listening');
    /* Ô S: chỉ nhận xét + GV chấm + entered_by (dữ liệu cũ / xoá điểm lớp thường để lại người xoá). */
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, comment, examiner_user_id, entered_by, entered_at)
      VALUES (?, 'speaking', 'Trôi chảy, cần mở rộng ý', ?, ?, '2026-09-14T03:00:00Z')`).run(a.id, u, u);
    /* Ô L: có điểm. */
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, band, entered_by, entered_at)
      VALUES (?, 'listening', 30, 7.0, ?, '2026-09-14T03:00:00Z')`).run(a.id, u);
    const cells = svc.skillCells(P.admin, a, svc.scoresOf(a.id), svc.skipsOf(a.id), TODAY) as any[];
    const s = cells.find((c) => c.skill === 'speaking'), l = cells.find((c) => c.skill === 'listening');
    assert(s.band === null && s.enteredByName === null && s.enteredById === null && s.enteredAt === null,
      `ô S chưa có điểm vẫn gửi người nhập: ${JSON.stringify({ n: s.enteredByName, id: s.enteredById })}`);
    assert(l.band === 7 && !!l.enteredByName && l.enteredById === u, 'ô L có điểm phải gửi người nhập');
  }));

  check('OV15b-1 · việc Nhập điểm mang đủ kỹ năng của việc (`kns` ⊇ `kn`, khớp chữ "Nhập điểm …") — panel chỉ hiện các cột này', () => {
    const viec = ((mywork.myWork(P.lrTeacher).dong ?? []) as any[]).flatMap((x) => (x.con?.length ? x.con : [x]))
      .filter((x) => x.group === 'score' && x.kn);
    assert(viec.length > 0, 'dữ liệu demo: GV L/R phải có việc Nhập điểm');
    for (const v of viec) {
      assert(Array.isArray(v.kns) && v.kns.includes(v.kn), `${v.key}: thiếu kns`);
      assert(v.kns.length === String(v.phu ?? v.reason).split(', ').length, `${v.key}: kns ${v.kns} ≠ "${v.phu}"`);
    }
  });

  check('OV15b-5 · bỏ tab "Điểm theo lớp": hàng tab Test không có; đường cũ /test/diem-lop vẫn mở được (panel lớp) cho người có testGrade', () => {
    const nav = (o: object) => ({ ...d.NAV_RONG, test: true, ...o });
    assert(!d.tabTestHienThi(nav({ testGrade: true, testPlan: true })).includes('diem-lop'), 'tab Điểm theo lớp vẫn còn');
    assert(d.tabTestTuDuong('diem-lop') === 'diem-lop', 'đường cũ không còn đọc được');
    assert(d.moDiemLopCu(nav({ testGrade: true })) && !d.moDiemLopCu(nav({ testPlan: true })) && !d.moDiemLopCu({ ...d.NAV_RONG, testGrade: true }),
      'link cũ: chỉ người có testGrade (và mục Test)');
  });

  check('OV15b-6 · Lịch Test: mặc định khung có bài của người xem; cả hai có bài → cả hai (null); URL thắng; không bài → theo lớp', () => {
    const f = (o: any) => d.khungLichTestMacDinh({ param: null, theoLop: null, coBai: { ft: 0, thuong: 0 }, dem: { ft: 3, thuong: 2 }, phamViHai: true, ...o });
    assert(f({ coBai: { ft: 4, thuong: 2 } }) === null, 'cả hai có bài phải hiện cả hai');
    assert(f({ coBai: { ft: 0, thuong: 2 } }) === 'thuong', 'chỉ lớp thường có bài → Lớp thường (không tự chọn Fast Track)');
    assert(f({ coBai: { ft: 5, thuong: 0 } }) === 'ft', 'chỉ FT có bài → Fast Track');
    assert(f({}) === null && f({ dem: { ft: 0, thuong: 2 } }) === 'thuong', 'không bài: theo lớp có trong tuần');
    assert(f({ param: 'ft', coBai: { ft: 0, thuong: 9 } }) === 'ft' && f({ param: 'tat-ca', coBai: { ft: 1, thuong: 0 } }) === null, 'URL thắng');
    assert(f({ param: 'ft', dem: { ft: 0, thuong: 2 }, phamViHai: false }) === 'thuong', 'URL khung rỗng ngoài phạm vi → bỏ');
    assert(f({ theoLop: 'thuong', coBai: { ft: 3, thuong: 0 } }) === 'thuong', 'lớp trên đường dẫn → khung của lớp đó');
  });
}
