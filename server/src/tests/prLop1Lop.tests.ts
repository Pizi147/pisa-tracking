/**
 * PHÉP KIỂM LOP-1-LOP — hồ sơ lớp đọc một lớp (kế hoạch `docs/superpowers/plans/2026-10-30-toc-do.md`).
 * L1 `/classes/:id/viec-theo-em` chỉ đọc lượt của lớp (giống hệt đường đủ) + `?chi=toi` · L2 badge "n việc quá hạn" = `soQuaHanLop` (công thức web cũ).
 */
import fs from 'node:fs';
import path from 'node:path';

export async function runPrLop1LopTests(t: any) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  console.log('\nLOP-1-LOP · hồ sơ lớp đọc một lớp');
  const vt: any = await import('../classes/viecTheoEm.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal, laGvSpeaking, lopFtChoGvSpeaking } = await import('../permissions.ts');
  const { phamViXemViec } = await import('../worklist/xemViec.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { demViec, laVaiQuanLy, vaiXemHocVien } = await import('../../../shared/domain/index.ts');
  const { soDongSql, chayTrongRequest, xoaNho, demHienTai } = await import('../platform/nguCanhRequest.ts');
  const { addDays } = await import('../util.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const nguoiVai = (role: string) => loadPrincipal((conn.prepare(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? ORDER BY ur.user_id LIMIT 1`).get(role) as any).id);
  const VAI: [string, any][] = [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher],
    ['GVCN_THUONG', P.normalCoreTeacher], ['TVV', nguoiVai('consultant')], ['CX', nguoiVai('cx')]];
  const lopActive = all(`SELECT id, branch_id FROM classes WHERE status = 'active' ORDER BY id`) as { id: number; branch_id: number | null }[];

  /** Kết quả + dòng đọc (cả request / riêng câu đọc lượt + điểm) của `viecTheoEmCuaLop` — đường mới / đường đủ (`viecLopDayDuKhiKiem`). Lỗi (403) trả `{ loi }`. */
  const chay = (p: any, lop: number, du: boolean, o?: { chiToi?: boolean }) => {
    vt.viecLopDayDuKhiKiem.bat = du;
    xoaNho();
    try {
      const d0 = soDongSql();
      let luot = 0;
      const r = chayTrongRequest('GET', () => {
        const x = vt.viecTheoEmCuaLop(p, lop, o);
        for (const [cau, n] of demHienTai()?.theoCau ?? []) if (/assessment_(attempts|scores)|^WITH ids/.test(cau)) luot += n;
        return x;
      });
      return { r, dong: soDongSql() - d0, luot };
    } catch (e: any) {
      if (e?.status !== 403) throw e;   // chỉ 403 (ngoài phạm vi) là kết quả hợp lệ — lỗi khác phải làm phép kiểm đỏ
      return { loi: '403', dong: 0 } as any;
    }
    finally { vt.viecLopDayDuKhiKiem.bat = false; }
  };

  check('L1 · cuaToi + theoEm giống hệt đường đủ — mọi lớp active × QL, QT, GVCN, GVBM, GVCN_THUONG, TVV; RF1 việc classId null giữ nguyên', () => {
    let soNull = 0, soSo = 0;
    for (const [ten, p] of VAI.filter(([v]) => v !== 'CX')) for (const { id } of lopActive) {
      const moi = chay(p, id, false), du = chay(p, id, true);
      assert((moi.loi ?? null) === (du.loi ?? null), `${ten} lớp ${id}: lỗi ${moi.loi} ≠ ${du.loi}`);
      if (du.loi) continue;
      const { soQuaHanLop: _a, ...m } = moi.r, { soQuaHanLop: _b, ...d } = du.r;
      assert(JSON.stringify(m) === JSON.stringify(d), `${ten} lớp ${id}: ${JSON.stringify(m).slice(0, 300)} ≠ ${JSON.stringify(d).slice(0, 300)}`);
      const khoaNull = (r: any) => JSON.stringify(Object.values(r.theoEm).flat().filter((it: any) => it.classId === null).map((it: any) => it.key).sort());
      assert(khoaNull(moi.r) === khoaNull(du.r), `${ten} lớp ${id}: việc classId null lệch`);
      soNull += Object.values(du.r.theoEm).flat().filter((it: any) => it.classId === null).length;
      soSo++;
    }
    assert(soSo > 20, `phép so quá ít (${soSo})`);
    console.log(`    (RF1: ${soNull} việc classId null trong các lần so)`);
  });

  check('L1 · RF5 GVBM mở lớp không dạy → 403; mọi việc trong cuaToi của GV có mine', () => {
    const day = new Set(P.subjectTeacher.assignments.map((a: any) => a.classId));
    const ngoai = lopActive.find((l) => !day.has(l.id) && l.branch_id !== null);
    assert(ngoai, 'dữ liệu demo: phải có lớp GVBM không dạy');
    assertThrows(() => vt.viecTheoEmCuaLop(P.subjectTeacher, ngoai!.id), /phạm vi/, 'GVBM mở lớp không dạy');
    for (const p of [P.coreTeacher, P.subjectTeacher, P.normalCoreTeacher]) for (const l of lopActive) {
      const r = chay(p, l.id, false).r;
      if (r) assert(r.cuaToi.every((it: any) => it.mine === true), `GV ${p.userId} lớp ${l.id}: cuaToi có việc không phải của mình`);
    }
  });

  /* Kế hoạch ghi "dòng QL lớp 3 < đường đủ ÷ 3": demo MB ít lớp, lớp 3 giữ phần lớn lượt còn ô chờ, và phần lớn dòng của request là khối khác của `myWork`
     (HV, phân công, Case — chưa đổi, chờ TRANG-LON) → kiểm câu đọc lượt + điểm: lớp 3 giảm, lớp MB nhỏ nhất < đủ ÷ 3; tổng dòng không tăng. */
  check('L1 · chi=toi: theoEm rỗng, cuaToi như đường đủ; QL đọc lượt ít hơn (lớp 3 giảm, lớp MB ít lượt nhất < ÷ 3)', () => {
    const moi = chay(P.mbManager, 3, false, { chiToi: true }), du = chay(P.mbManager, 3, true);
    assert(JSON.stringify(moi.r.theoEm) === '{}', 'theoEm phải rỗng');
    assert(JSON.stringify(moi.r.cuaToi) === JSON.stringify(du.r.cuaToi), 'cuaToi lệch');
    assert(moi.luot < du.luot && moi.dong < du.dong, `lớp 3: lượt ${moi.luot} / ${du.luot}, dòng ${moi.dong} / ${du.dong}`);
    const mb = lopActive.filter((l) => l.branch_id === lopActive.find((x) => x.id === 3)!.branch_id);
    const nho = mb.map((l) => ({ l, m: chay(P.mbManager, l.id, false, { chiToi: true }), d: chay(P.mbManager, l.id, true) }))
      .filter((x) => x.m.r).sort((a, b) => a.m.luot - b.m.luot)[0];
    assert(nho.m.luot < nho.d.luot / 3, `lớp ${nho.l.id}: lượt ${nho.m.luot} / ${nho.d.luot}`);
    console.log(`    (QL lớp 3: lượt ${moi.luot} ← ${du.luot}, dòng ${moi.dong} ← ${du.dong}; lớp ${nho.l.id}: lượt ${nho.m.luot} ← ${nho.d.luot})`);
  });

  /** Công thức badge web cũ (`DauTrangLop.tsx` trước PR): QL `/my-work?nguoi=tat-ca&branchId`; GV `/my-work` + `mine`. */
  const badgeCu = (p: any, lop: { id: number; branch_id: number | null }) => {
    const ql = laVaiQuanLy(p.roleKeys), chiCuaToi = !ql && vaiXemHocVien(p.roleKeys) === null;
    xoaNho();
    const w: any = chayTrongRequest('GET', () => ql ? myWork(p, { branchId: lop.branch_id, nguoi: 'tat-ca' }) : myWork(p, {}));
    return demViec((w.dong ?? []).flatMap((x: any) => (x.con?.length ? x.con : [x]))
      .filter((it: any) => (!chiCuaToi || it.mine) && it.urgency === 'overdue' && it.classId === lop.id)).viec;
  };

  check('L2 · soQuaHanLop = số badge cũ — mọi lớp active × QL, QT, GVCN, GVBM, GVCN_THUONG; có lớp > 0', () => {
    let coSo = 0;
    for (const [ten, p] of VAI.filter(([v]) => v !== 'TVV' && v !== 'CX')) for (const l of lopActive) {
      const r = chay(p, l.id, false, { chiToi: true }).r;
      if (!r) continue;
      const cu = badgeCu(p, l);
      assert(r.soQuaHanLop === cu, `${ten} lớp ${l.id}: soQuaHanLop ${r.soQuaHanLop} ≠ badge cũ ${cu}`);
      if (cu > 0) coSo++;
    }
    assert(coSo > 0, 'dữ liệu demo: phải có lớp có việc quá hạn (phép so không rỗng)');
  });

  check('L2 · RF3 sau lưu điểm: soQuaHanLop (GV và QL) = công thức cũ, giảm ≥ 1; việc rời cuaToi', () => {
    const lop = lopActive.find((l) => l.id === 3)!;
    const gv = [P.coreTeacher, P.subjectTeacher, P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher]
      .find((p) => chay(p, 3, false, { chiToi: true }).r?.cuaToi.some((it: any) => it.group === 'score' && it.urgency === 'overdue' && it.attemptId && it.studentId !== null));
    assert(gv, 'dữ liệu demo: lớp 3 phải có GV có việc Nhập điểm quá hạn');
    const viec = chay(gv, 3, false, { chiToi: true }).r.cuaToi.find((it: any) => it.group === 'score' && it.urgency === 'overdue' && it.attemptId && it.studentId !== null);
    const truocGv = chay(gv, 3, false, { chiToi: true }).r.soQuaHanLop, truocQl = chay(P.mbManager, 3, false, { chiToi: true }).r.soQuaHanLop;
    conn.exec('BEGIN IMMEDIATE');
    try {
      for (const kn of viec.knsQuaHan ?? viec.kns ?? []) attempts.saveScore(gv, viec.attemptId, kn, { band: 6 }, TODAY);
      const sauGv = chay(gv, 3, false, { chiToi: true }).r, sauQl = chay(P.mbManager, 3, false, { chiToi: true }).r;
      assert(sauGv.soQuaHanLop === badgeCu(gv, lop) && sauQl.soQuaHanLop === badgeCu(P.mbManager, lop), 'sau lưu: lệch công thức cũ');
      assert(sauGv.soQuaHanLop <= truocGv - 1 && sauQl.soQuaHanLop <= truocQl - 1, `không giảm: GV ${truocGv}→${sauGv.soQuaHanLop}, QL ${truocQl}→${sauQl.soQuaHanLop}`);
      assert(!sauGv.cuaToi.some((it: any) => it.key === viec.key), 'việc vừa nhập vẫn còn trong cuaToi');
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  /*
   * RF1 dựng dữ liệu (PTA 30/10): khối Case / PA / Báo PH / Bước tiếp / TVV của `myWork` lấy lớp = COALESCE(…, lớp đang học) nên em đang học không có việc
   * `classId null` từ đó; chỗ DUY NHẤT `classIds` có thể làm mất việc là LƯỢT không gắn lớp (`class_id NULL`) của em đang học — việc Nhập điểm của lượt đó
   * mang `classId null` nếu đường đủ có đọc. Dựng: (a) một lượt quá hạn của em lớp 3 bỏ `class_id`; (b) một Case không gắn lượt (`attempt_id NULL`) của em
   * khác lớp 3. Mọi vai: `viec-theo-em` (theoEm + cuaToi) giống hệt đường đủ, badge = công thức cũ; Case (b) có mặt ở QL.
   */
  check('L1 · RF1 dựng dữ liệu: lượt class_id NULL của em đang học + Case không gắn lượt — viec-theo-em + badge như đường đủ', () => {
    const lop = lopActive.find((l) => l.id === 3)!;
    /* Lượt có việc Nhập điểm quá hạn của một em lớp 3 (QL đường đủ) — bỏ class_id thì việc đó chỉ còn ở đường đủ nếu đường đủ đọc lượt không gắn lớp. */
    const viec0 = (Object.values(chay(P.mbManager, 3, true).r.theoEm).flat() as any[]).find((it) => it.group === 'score' && it.attemptId && it.urgency === 'overdue');
    assert(viec0, 'dữ liệu demo: cần việc Nhập điểm quá hạn của em lớp 3');
    const luot = { id: viec0.attemptId as number, student_id: viec0.studentId as number };
    const em2 = (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = 3 AND status = 'active' AND student_id != ? ORDER BY student_id LIMIT 1`).get(luot.student_id) as any).student_id;
    const cy = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1`).get(em2) as any).id;
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare('UPDATE assessment_attempts SET class_id = NULL WHERE id = ?').run(luot.id);
      const caseId = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at)
        VALUES (?, ?, 'reading', 'reading', 'teacher_report', 'open', 1, ?, ?)`).run(em2, cy, addDays(TODAY, -20), `${addDays(TODAY, -20)}T00:00:00Z`).lastInsertRowid);
      let coCase = false, soNullDu = 0;
      for (const [ten, p] of VAI) {
        const moi = chay(p, 3, false), du = chay(p, 3, true);
        assert((moi.loi ?? null) === (du.loi ?? null), `${ten}: lỗi ${moi.loi} ≠ ${du.loi}`);
        if (du.loi) continue;
        const { soQuaHanLop: sm, ...m } = moi.r, { soQuaHanLop: sd, ...d } = du.r;
        assert(JSON.stringify(m) === JSON.stringify(d), `${ten}: ${JSON.stringify(m).slice(0, 300)} ≠ ${JSON.stringify(d).slice(0, 300)}`);
        if (sd !== null) assert(sm === sd && sm === badgeCu(p, lop), `${ten}: badge ${sm} / đường đủ ${sd} / công thức cũ ${badgeCu(p, lop)}`);
        soNullDu += Object.values(du.r.theoEm).flat().filter((it: any) => it.classId === null).length;
        if (Object.values(du.r.theoEm).flat().some((it: any) => it.caseId === caseId)) coCase = true;
      }
      assert(coCase, 'Case không gắn lượt phải có trong viec-theo-em (QL)');
      console.log(`    (RF1 dựng: lượt ${luot.id} bỏ class_id, việc classId null ở đường đủ: ${soNullDu}; Case ${caseId} không gắn lượt có mặt)`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  /* PTA rà #735 (c): Admin có `score.override` kiêm GV Speaking đi nhánh `tat-ca` (`phamViXemViec` = 'cham-diem') — `myWork` tatCa không gộp `lopCheo`.
     Demo không có người như vậy → dựng (Admin MB + vai GV + kỹ năng speaking), so mọi lớp FT của chi nhánh với đường đủ và badge cũ. */
  check('L1 · Admin kiêm GV Speaking (S chéo, nhánh tat-ca): viec-theo-em + badge như đường đủ / công thức cũ', () => {
    const ad = conn.prepare(`SELECT ur.user_id AS id, ur.branch_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'office_admin' AND ur.branch_id = ? LIMIT 1`)
      .get(lopActive.find((l) => l.id === 3)!.branch_id) as any;
    assert(ad, 'dữ liệu demo: cần Admin của chi nhánh lớp 3');
    conn.exec('BEGIN IMMEDIATE');
    try {
      conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) SELECT ?, id, ?, 'active', ? FROM roles WHERE key = 'teacher'`).run(ad.id, ad.branch_id, `${TODAY}T00:00:00Z`);
      conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) VALUES (?, 'speaking')`).run(ad.id);
      xoaNho();
      const p = loadPrincipal(ad.id);
      assert(laGvSpeaking(p) && phamViXemViec(p) === 'cham-diem' && lopFtChoGvSpeaking(p).length > 0, 'người dựng phải là Admin (cham-diem) kiêm GV Speaking có lớp S chéo');
      let so = 0;
      for (const l of lopActive.filter((x) => x.branch_id === ad.branch_id)) {
        const moi = chay(p, l.id, false), du = chay(p, l.id, true);
        assert((moi.loi ?? null) === (du.loi ?? null), `lớp ${l.id}: lỗi ${moi.loi} ≠ ${du.loi}`);
        if (du.loi) continue;
        const { soQuaHanLop: sm, ...m } = moi.r, { soQuaHanLop: sd, ...d } = du.r;
        assert(JSON.stringify(m) === JSON.stringify(d), `lớp ${l.id}: ${JSON.stringify(m).slice(0, 300)} ≠ ${JSON.stringify(d).slice(0, 300)}`);
        assert(sm === sd && sm === badgeCu(p, l), `lớp ${l.id}: badge ${sm} / đường đủ ${sd} / công thức cũ ${badgeCu(p, l)}`);
        so++;
      }
      assert(so > 0, 'phải so được ít nhất một lớp');
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('L2 · TVV, CX → soQuaHanLop null', () => {
    for (const [ten, p] of VAI.filter(([v]) => v === 'TVV' || v === 'CX')) for (const l of lopActive) {
      const r = chay(p, l.id, false, { chiToi: true }).r;
      if (r) assert(r.soQuaHanLop === null, `${ten} lớp ${l.id}: ${r.soQuaHanLop}`);
    }
  });

  check('L2 · web DauTrangLop không còn gọi /my-work; đọc soQuaHanLop từ duongViecLop', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'web/src/modules/classes/DauTrangLop.tsx'), 'utf8');
    assert(!/useApi[^;]*\/my-work/.test(src), 'DauTrangLop còn gọi /my-work');
    assert(/duongViecLop\(/.test(src) && /soQuaHanLop/.test(src), 'DauTrangLop chưa đọc soQuaHanLop từ duongViecLop');
  });
}
