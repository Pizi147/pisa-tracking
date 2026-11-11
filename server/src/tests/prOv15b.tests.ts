/**
 * PHÉP KIỂM OV-15b — lưới điểm, hồ sơ lớp, dán Excel, đường Nhập điểm. Kế hoạch: docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md (OV-15b).
 *  · 7: "Nhập bởi …" chỉ khi ô ĐÃ có điểm — máy chủ không gửi người nhập cho ô chưa có điểm (ô chỉ nhận xét, ô đã xoá điểm, GV chấm chéo đã phân công);
 *  · 2: dán từ Excel — R1-BO-DAN-EXCEL bỏ ở web (kiểm tĩnh); endpoint lô (API còn, web không gọi) dùng lại kiểm ô của `saveScore`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15bTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY } = t as any;
  const svc: any = await import('../fasttrack/attempts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
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

  /* LT-GON (chủ SP 05/11): khối "Quá hạn chấm" một hàng một lớp — `gopNoTheoLop` gộp từ dữ liệu đã nạp. */
  check('LT-GON · gopNoTheoLop: một hàng một lớp — cộng bài, hạn cũ nhất, hợp người chưa chấm ("GV chấm chéo" cuối), hợp lượt; FT một lưới, lớp thường mỗi bài một lưới', () => {
    const dong = (o: any) => ({ key: 'x', classId: 1, mode: 'ielts_band', kind: 'mock', attemptNo: 1, dotLabel: 'MT1', periodId: 1, weekStart: '2026-07-06',
      kyNang: ['listening'], kyNangLabel: 'L', conBai: 1, soHv: 1, attemptIds: [10], han: '2026-07-12', quaHan: true, luiLich: null,
      cuaToi: false, duocCham: true, coDayLop: false, gvNo: ['A'], phan: null, ...o });
    const g = d.gopNoTheoLop([
      dong({ conBai: 10, attemptIds: [10, 11], han: '2026-07-12', gvNo: ['GV chấm chéo', 'B'] }),
      dong({ attemptNo: 2, dotLabel: 'MT2', conBai: 5, attemptIds: [11, 12], han: '2026-07-08', kyNang: ['speaking'], kyNangLabel: 'S', gvNo: ['A'] }),
      dong({ classId: 2, mode: 'ratio', kind: 'progress', dotLabel: 'Progress Test', attemptIds: [20] }),
      dong({ classId: 2, mode: 'ratio', kind: 'final', dotLabel: 'Final Test', attemptIds: [21] }),
    ], 'GV chấm chéo');
    assert(g.length === 2 && g[0].classId === 1 && g[0].key === 'lop:1', `số hàng / thứ tự: ${g.map((x: any) => x.key)}`);
    assert(g[0].conBai === 15 && g[0].han === '2026-07-08' && g[0].quaHan && g[0].soDong === 2, `cộng bài / hạn cũ nhất: ${JSON.stringify(g[0])}`);
    assert(JSON.stringify(g[0].attemptIds) === '[10,11,12]' && JSON.stringify(g[0].gvNo) === '["B","A","GV chấm chéo"]', `lượt / người: ${g[0].attemptIds} ${g[0].gvNo}`);
    assert(g[0].luoi.length === 1 && g[0].luoi[0].kind === null && g[1].luoi.map((l: any) => l.kind).join() === 'progress,final'
      && g[1].luoi.map((l: any) => l.nhan).join() === 'Progress Test,Final Test', `lưới: ${JSON.stringify([g[0].luoi, g[1].luoi])}`);
    const p = d.gopNoTheoLop([dong({ phan: { toi: { kyNang: ['listening'], con: 2 }, khac: null } }), dong({ phan: { toi: { kyNang: ['reading'], con: 3 }, khac: { kyNang: ['speaking'], con: 1, quaHanNgay: 4 } } })], 'GV chấm chéo')[0];
    assert(p.phan.toi.con === 5 && p.phan.toi.kyNang.join() === 'listening,reading' && p.phan.khac.quaHanNgay === 4, `phần của bạn: ${JSON.stringify(p.phan)}`);
  });

  /* ---------------------------------------------------------------- 2 · Dán từ Excel — R1-BO-DAN-EXCEL (chủ SP 26/10): web bỏ, API lô giữ */
  check('OV15b-2 · web không còn "Dán từ Excel" điểm (ngoài Tutor và Thêm học viên — nhập danh sách, không phải điểm)', () => {
    const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../web/src');
    const mien = /^modules[\\/](tutor[\\/]|students[\\/]IntakePanel\.tsx$)/;   // Windows: readdirSync trả "\"
    const sai = (fs.readdirSync(goc, { recursive: true }) as string[])
      .filter((f) => /\.tsx?$/.test(f) && !mien.test(f) && /Dán từ Excel|DanExcel/.test(fs.readFileSync(path.join(goc, f), 'utf8')));
    assert(sai.length === 0, `còn Dán từ Excel điểm: ${sai.join(', ')}`);
  });

}
