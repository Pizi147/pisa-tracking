/**
 * PHÉP KIỂM LOC-HIEN-TAI (lỗi chủ SP 28/10: "Lưu trữ là lưu trữ HẾT; học lại thì mọi thứ reset") — `LUOT_HIEN_TAI_SQL` (students/tamDung.ts):
 *   danh sách HIỆN TẠI chỉ lấy lượt của lộ trình MỚI NHẤT của em + em đang học. Lượt cũ / em ngừng học còn nguyên trong DB, hồ sơ HV, lớp đã kết thúc.
 *   (1) học lại cùng lớp (seed: UB FT 401, LT1 → LT2): bảng điểm MT, Lịch Test / Công việc (`listAttempts`), nợ điểm không còn lượt LT1;
 *   (2) em lưu trữ có lượt chờ điểm: ẩn khỏi bảng điểm FT + lớp thường, nợ điểm, Kế hoạch Test lớp thường; bỏ lưu trữ → hiện lại; em Tạm dừng giữ ở bảng điểm;
 *   (3) bỏ lưu trữ + lộ trình mới: chỉ lượt lộ trình mới; lượt cũ không xoá, hồ sơ (`studentId`) vẫn thấy;
 *   (4) lớp đã kết thúc (Lưu trữ lớp) giữ lịch sử; (5) nợ điểm ⊆ bảng điểm (một tập, một hàm); (6) mọi nguồn danh sách hiện tại dùng vị từ chung;
 *   (7) thi thật là kết thúc: MT chưa làm của lộ trình đã có kết quả thi thật không còn là kế hoạch (PTA Plan 28/10);
 *   (8) "mới nhất" theo LOẠI lộ trình: em FT có thêm khoá lớp thường song song (`seq` lớn hơn, `route IS NULL`) vẫn giữ lượt FT.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'server', 'src');   // chạy từ dist-server/server/src/tests

export async function runPrLocHienTaiTests(t: any) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLOC-HIEN-TAI · danh sách hiện tại = lượt lộ trình mới nhất + em đang học (học lại reset, lưu trữ ẩn hết)');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const bangMt = (lop: number, no: number) => { xoaNho(); return attempts.classScoreSheet(P.admin, lop, { theo: 'luot', attemptNo: no }).rows as any[]; };
  const noDiem = (lop: number) => { xoaNho(); return scoreDebtCells(P.admin, TODAY, null, [lop]); };
  const lichTest = (lop: number) => { xoaNho(); return attempts.listAttempts(P.admin, { classIds: [lop], chiDangHoc: true }).rows as any[]; };

  /* Em học lại cùng lớp: lượt Mock chưa huỷ thuộc lộ trình không phải mới nhất CÙNG LOẠI (FT / lớp thường), ở lớp em ĐANG ghi danh. */
  const hocLai = get(`SELECT a.student_id, a.class_id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id AND c.status = 'active'
      JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.kind = 'mock' AND a.status != 'cancelled'
       AND a.cycle_id != (SELECT x.id FROM learning_cycles x JOIN learning_cycles g ON g.id = a.cycle_id WHERE x.student_id = a.student_id AND (x.route IS NULL) = (g.route IS NULL) ORDER BY x.seq DESC LIMIT 1) LIMIT 1`);

  check('LHT-1 · học lại cùng lớp (seed LT1 → LT2): bảng điểm MT, Lịch Test, nợ điểm chỉ còn lượt lộ trình mới; lượt LT1 vẫn còn ở hồ sơ', () => {
    assert(hocLai, 'seed phải có em học lại cùng lớp (UB FT 401: LT1 → LT2)');
    const cu = all(`SELECT a.id, a.attempt_no FROM assessment_attempts a WHERE a.student_id = ? AND a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled'
        AND a.cycle_id != (SELECT x.id FROM learning_cycles x JOIN learning_cycles g ON g.id = a.cycle_id WHERE x.student_id = a.student_id AND (x.route IS NULL) = (g.route IS NULL) ORDER BY x.seq DESC LIMIT 1)`, hocLai.student_id, hocLai.class_id);
    const moi = new Set(all(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.class_id = ? AND a.status != 'cancelled'
        AND a.cycle_id = (SELECT x.id FROM learning_cycles x JOIN learning_cycles g ON g.id = a.cycle_id WHERE x.student_id = a.student_id AND (x.route IS NULL) = (g.route IS NULL) ORDER BY x.seq DESC LIMIT 1)`, hocLai.student_id, hocLai.class_id).map((r) => r.id));
    const idCu = new Set(cu.map((r) => r.id));
    for (const no of new Set(cu.map((r) => r.attempt_no as number))) {
      const cuaEm = bangMt(hocLai.class_id, no).filter((r) => r.studentId === hocLai.student_id);
      assert(cuaEm.length <= 1 && cuaEm.every((r) => moi.has(r.attemptId)), `MT${no}: hàng của em = ${JSON.stringify(cuaEm.map((r) => r.attemptId))} (phải chỉ lượt lộ trình mới)`);
    }
    assert(!lichTest(hocLai.class_id).some((a) => idCu.has(a.id)), 'Lịch Test / Công việc còn lượt lộ trình cũ');
    assert(!noDiem(hocLai.class_id).some((c) => idCu.has(c.attemptId)), 'nợ điểm còn lượt lộ trình cũ');
    xoaNho();
    const hoSo = attempts.listAttempts(P.admin, { studentId: hocLai.student_id }).rows.map((a: any) => a.id);
    assert([...idCu].every((id) => hoSo.includes(id)), 'hồ sơ HV (studentId) phải giữ lượt lộ trình cũ');
  });

  check('LHT-2 · em lưu trữ có lượt chờ điểm: ẩn khỏi bảng điểm FT, Lịch Test, nợ điểm; lớp thường: bảng điểm + Kế hoạch Test; bỏ lưu trữ → hiện lại', () => thu(() => {
    const no = noDiem(classId('MB FT 101'))[0] ?? scoreDebtCells(P.admin, TODAY, null).find((c: any) => get(`SELECT kind FROM assessment_attempts WHERE id = ?`, c.attemptId).kind === 'mock');
    assert(no, 'seed phải có ô nợ điểm Mock');
    const a = get(`SELECT id, student_id, class_id, attempt_no FROM assessment_attempts WHERE id = ?`, no.attemptId);
    const truoc = bangMt(a.class_id, a.attempt_no).some((r) => r.attemptId === a.id);
    assert(truoc && lichTest(a.class_id).some((x) => x.id === a.id), 'trước lưu trữ: em có hàng ở bảng điểm + Lịch Test');
    conn.prepare(`UPDATE students SET archived_at = ? WHERE id = ?`).run(`${TODAY}T00:00:00Z`, a.student_id);
    assert(!bangMt(a.class_id, a.attempt_no).some((r) => r.studentId === a.student_id), 'lưu trữ: bảng điểm còn hàng của em');
    assert(!lichTest(a.class_id).some((x) => x.student_id === a.student_id), 'lưu trữ: Lịch Test / Công việc còn lượt của em');
    assert(!noDiem(a.class_id).some((c) => c.attemptId === a.id), 'lưu trữ: nợ điểm còn ô của em');
    assert(get(`SELECT COUNT(*) n FROM assessment_attempts WHERE id = ?`, a.id).n === 1, 'không xoá lượt');
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(a.student_id);
    assert(bangMt(a.class_id, a.attempt_no).some((r) => r.attemptId === a.id), 'bỏ lưu trữ: hàng phải hiện lại');

    /* Lớp thường: bảng tỷ lệ + lưới Kế hoạch Test. */
    const FOU = classId('MB FOU 12');
    const t = get(`SELECT a.student_id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
       JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled' LIMIT 1`, FOU);
    assert(t, 'seed phải có bài Giữa / Cuối khoá ở MB FOU 12');
    const coEm = () => { xoaNho(); return (regular.regularSheet(P.admin, FOU).rows as any[]).some((r) => r.studentId === t.student_id); };
    assert(coEm(), 'trước lưu trữ: em có hàng ở bảng lớp thường');
    /* PTA 28/10: em Tạm dừng (ở Lưu trữ) giữ như cũ ở bảng điểm; Kết thúc học + Lưu trữ thì bỏ hàng. */
    conn.prepare(`UPDATE students SET archived_at = ?, status = 'inactive' WHERE id = ?`).run(`${TODAY}T00:00:00Z`, t.student_id);
    assert(coEm(), 'em Tạm dừng: bảng lớp thường phải giữ hàng như cũ');
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(t.student_id);
    assert(!coEm(), 'em Kết thúc học + Lưu trữ: bảng lớp thường còn hàng');
    xoaNho();
    assert(!JSON.stringify(keHoach.luoiThuong(P.admin, FOU)).includes(`"studentId":${t.student_id},`), 'Kế hoạch Test lớp thường còn em lưu trữ');
  }));

  check('LHT-7 · thi thật là kết thúc: MT chưa làm của lộ trình đã có kết quả thi thật ẩn khỏi Kế hoạch Test, bảng điểm, Lịch Test, nợ điểm; MT đã làm giữ; gỡ kết quả → hiện lại', () => thu(() => {
    const a = get(`SELECT a.id, a.student_id, a.class_id, a.attempt_no, a.cycle_id FROM assessment_attempts a
       JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active' AND cy.thi_that_ngay IS NULL AND cy.thi_that_khong_thi = 0
       JOIN classes c ON c.id = a.class_id AND c.status = 'active'
       JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
       JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.kind = 'mock' AND a.status = 'planned' AND a.planned_period_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL))
        AND EXISTS (SELECT 1 FROM assessment_attempts d WHERE d.cycle_id = a.cycle_id AND d.status = 'done') LIMIT 1`);
    assert(a, 'seed phải có em FT có MT đã làm + MT chưa làm');
    const daLam = get(`SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? AND status = 'done' AND class_id = ? LIMIT 1`, a.cycle_id, a.class_id);
    const trongLuoi = () => { xoaNho(); return JSON.stringify(keHoach.luoiFT(P.admin, a.class_id)).includes(`"attemptId":${a.id},`); };
    assert(trongLuoi() && bangMt(a.class_id, a.attempt_no).some((r) => r.attemptId === a.id), 'trước thi thật: MT chưa làm ở Kế hoạch Test + bảng điểm');
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = ? WHERE id = ?`).run(TODAY, a.cycle_id);
    assert(!trongLuoi(), 'đã thi thật: Kế hoạch Test còn MT chưa làm');
    assert(!bangMt(a.class_id, a.attempt_no).some((r) => r.attemptId === a.id), 'đã thi thật: bảng điểm còn MT chưa làm');
    assert(!lichTest(a.class_id).some((x) => x.id === a.id), 'đã thi thật: Lịch Test / Công việc còn MT chưa làm');
    assert(!noDiem(a.class_id).some((c) => c.attemptId === a.id), 'đã thi thật: nợ điểm còn MT chưa làm');
    if (daLam) assert(bangMt(a.class_id, daLam.attempt_no).some((r) => r.attemptId === daLam.id), 'MT đã làm phải giữ ở bảng điểm');
    assert(get(`SELECT status FROM assessment_attempts WHERE id = ?`, a.id).status === 'planned' && get(`SELECT status FROM learning_cycles WHERE id = ?`, a.cycle_id).status === 'active',
      'không huỷ lượt, không đóng lộ trình');
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = NULL WHERE id = ?`).run(a.cycle_id);
    assert(trongLuoi(), 'gỡ kết quả thi thật: MT hiện lại');
  }));

  check('LHT-3 · bỏ lưu trữ + mở lộ trình mới cùng lớp: bảng điểm chỉ lượt lộ trình mới; lượt cũ còn nguyên (không xoá)', () => thu(() => {
    const a = get(`SELECT a.id, a.student_id, a.class_id, a.attempt_no, cy.route, cy.target_score FROM assessment_attempts a
       JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active' AND cy.route IS NOT NULL
       JOIN classes c ON c.id = a.class_id AND c.status = 'active'
       JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
       JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.kind = 'mock' AND a.attempt_no = 1 AND a.status = 'done'
        AND (SELECT COUNT(*) FROM learning_cycles x WHERE x.student_id = a.student_id) = 1 LIMIT 1`);
    assert(a, 'seed phải có em FT một lộ trình, MT1 đã xong');
    conn.prepare(`UPDATE students SET archived_at = ? WHERE id = ?`).run(`${TODAY}T00:00:00Z`, a.student_id);
    assert(!bangMt(a.class_id, 1).some((r) => r.studentId === a.student_id), 'lưu trữ: MT1 còn hàng');
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(a.student_id);
    cycles.createCycle(P.admin, { studentId: a.student_id, route: a.route, targetScore: a.target_score ?? 6.5 });
    const cuaEm = bangMt(a.class_id, 1).filter((r) => r.studentId === a.student_id);
    assert(!cuaEm.some((r) => r.attemptId === a.id), `lộ trình mới: MT1 cũ (${a.id}) vẫn hiện`);
    assert(cuaEm.length <= 1, `lộ trình mới: ${cuaEm.length} hàng MT1 của em`);
    assert(get(`SELECT status FROM assessment_attempts WHERE id = ?`, a.id).status === 'done', 'lượt cũ phải còn nguyên');
  }));

  check('LHT-4 · lớp đã kết thúc (Lưu trữ lớp) giữ lịch sử: bảng điểm còn lượt lộ trình cũ', () => thu(() => {
    assert(hocLai, 'seed phải có em học lại cùng lớp');
    const cu = get(`SELECT a.id, a.attempt_no FROM assessment_attempts a WHERE a.student_id = ? AND a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled'
        AND a.cycle_id != (SELECT x.id FROM learning_cycles x JOIN learning_cycles g ON g.id = a.cycle_id WHERE x.student_id = a.student_id AND (x.route IS NULL) = (g.route IS NULL) ORDER BY x.seq DESC LIMIT 1) LIMIT 1`, hocLai.student_id, hocLai.class_id);
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, hocLai.class_id);
    assert(bangMt(hocLai.class_id, cu.attempt_no).some((r) => r.attemptId === cu.id), 'lớp đã kết thúc phải giữ lượt lộ trình cũ');
  }));

  check('LHT-5 · một tập: mọi ô nợ điểm Mock của lớp có hàng ở bảng điểm lớp (cùng vị từ)', () => {
    for (const ma of ['MB FT 101', 'UB FT 401']) {
      const lop = classId(ma);
      for (const c of noDiem(lop)) {
        const a = get(`SELECT kind, attempt_no FROM assessment_attempts WHERE id = ?`, c.attemptId);
        if (a.kind !== 'mock') continue;
        assert(bangMt(lop, a.attempt_no).some((r) => r.attemptId === c.attemptId), `${ma}: ô nợ lượt ${c.attemptId} không có ở bảng MT${a.attempt_no}`);
      }
    }
  });

  check('LHT-8 · em FT mở thêm khoá lớp thường song song (seq lớn hơn): lượt FT vẫn ở bảng điểm, Lịch Test, nợ điểm; lộ trình FT mới thì ẩn', () => thu(() => {
    const lop = classId('MB FT 101');
    const a = get(`SELECT a.id, a.student_id, a.attempt_no, cy.route, cy.target_score FROM assessment_attempts a
       JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active' AND cy.route IS NOT NULL
       JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status = 'planned'
        AND NOT EXISTS (SELECT 1 FROM learning_cycles x WHERE x.student_id = a.student_id AND x.seq > cy.seq) ORDER BY a.id LIMIT 1`, lop);
    assert(a, 'MB FT 101 phải có lượt planned của em FT');
    const coO = () => bangMt(lop, a.attempt_no).some((r) => r.attemptId === a.id);
    assert(coO(), 'tiền đề: lượt FT ở bảng điểm');
    const seq = get('SELECT MAX(seq) m FROM learning_cycles WHERE student_id = ?', a.student_id).m + 1;
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
      VALUES (?, ?, NULL, 'FOU', ?, 'active', ?)`).run(a.student_id, seq, TODAY, TODAY);   // khuôn `regular.ts`: khoá lớp thường riêng
    assert(coO(), 'khoá lớp thường song song: lượt FT phải còn ở bảng điểm');
    assert(lichTest(lop).some((r) => r.id === a.id), 'khoá lớp thường song song: lượt FT phải còn ở Lịch Test');
    cycles.createCycle(P.admin, { studentId: a.student_id, route: a.route, targetScore: a.target_score ?? 6.5 });
    assert(!coO(), 'lộ trình FT mới: lượt FT cũ phải ẩn');
  }));

  check('LHT-6 · mọi nguồn danh sách hiện tại dùng vị từ chung (không viết lại điều kiện lộ trình / lưu trữ)', () => {
    const can = {
      'fasttrack/attempts.ts': 3, 'normal/regular.ts': 1, 'worklist/scoreDebt.ts': 1, 'cham/canCham.ts': 2, 'cham/diemTheoLuot.ts': 2,
      'classes/classes.ts': 1, 'keHoach/keHoachTest.ts': 7, 'classes/transition.ts': 1, 'classes/banGiao.ts': 1, 'worklist/tongQuan.ts': 1,
      'worklist/highlights.ts': 1, 'students/students.ts': 1, 'normal/cuoiKhoa.ts': 2,
    } as Record<string, number>;
    for (const [f, n] of Object.entries(can)) {
      const s = fs.readFileSync(path.join(SRC, f), 'utf8');
      const co = (s.match(/LUOT_(HIEN_TAI|LO_TRINH_CUOI|CON_KE_HOACH)_SQL\('a'/g) ?? []).length;
      assert(co >= n, `${f}: ${co} chỗ dùng vị từ < ${n}`);
    }
  });
}
