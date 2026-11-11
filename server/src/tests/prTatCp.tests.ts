/**
 * PHÉP KIỂM TAT-CHECKPOINT (chủ SP 06/11 khuya): "ghi là quá hạn nhưng không có gì để chấm? Tạm thời bỏ hết mặc định test checkpoint đi … để QL tự xếp".
 *  1. Công tắc `CONG_TAC_CP.tuSinh` tắt → vào lớp / quét / thứ Hai không sinh Checkpoint, không việc; bật → như cũ.
 *  2. Tắt → Kế hoạch Test có cột Checkpoint kế tiếp + QL xếp tay (đơn lẻ, hàng loạt); bật → chặn như cũ.
 *  3. Migrate `prTatCp`: tắt → ẩn (huỷ mềm) Checkpoint chưa điểm, giữ bài có điểm, chạy lặp không đổi; bật → hiện lại; xếp tay mở lại đúng lượt.
 *  4. Việc Nhập điểm ⇔ panel có bài — mọi tài khoản trên seed, mọi loại Test (gốc lỗi: panel lọc `checkpoint:n` bằng `=== 'checkpoint'`).
 */
export async function runPrTatCpTests(t: any) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const diemTheoLuot: any = await import('../cham/diemTheoLuot.ts');
  const mig: any = await import('../migrate/prTatCp.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nTAT-CHECKPOINT · tắt Checkpoint tự sinh, QL xếp tay, việc Nhập điểm ⇔ panel có bài');

  const thu = <T>(fn: () => T, bat = false): T => {
    const cu = d.CONG_TAC_CP.tuSinh;
    d.CONG_TAC_CP.tuSinh = bat;
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); d.CONG_TAC_CP.tuSinh = cu; }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const khaiGiang = addDays(week.mondayOf(TODAY), -35);   // tuần học 6 (Checkpoint 1) = tuần này
  const taoLopKet = () => {
    const lop = intake.taoLopVaPhanCong(P.mbManager, { branchId: MB, chuongTrinh: 'KET', so: '77', startPeriodId: week.ensurePeriod(khaiGiang).id }) as { id: number };
    const r = intake.commitIntake(P.admin, { classId: lop.id, rows: [{ fullName: 'Em Thử Tắt CP', startWeek: khaiGiang, email: emailThu(), dob: '2012-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    return { lop: lop.id, sid: r.studentIds[0] as number };
  };
  const cpCua = (sid: number) => all(`SELECT id, attempt_no AS so, status, cancel_reason FROM assessment_attempts WHERE student_id = ? AND kind = 'checkpoint' ORDER BY attempt_no`, sid);

  check('TAT-CP-1 · tắt: vào lớp KET, quét khi đọc, quét thứ Hai đều không sinh Checkpoint, không việc Nhập điểm; bật: Checkpoint 1 tuần học 6 như cũ', () => {
    thu(() => {
      const { lop, sid } = taoLopKet();
      regular.quetCheckpoint(lop);
      /* Quét thứ Hai (`chotVangDinhKy`) gọi `sinhCheckpointKeTiep(null, …)` — cùng một chặn. */
      assert(regular.sinhCheckpointKeTiep(null, addDays(TODAY, 70)).length === 0, 'tắt: sinhCheckpointKeTiep phải trả rỗng');
      assert(cpCua(sid).length === 0, `tắt: không được có Checkpoint, có ${JSON.stringify(cpCua(sid))}`);
      const viec = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).items.filter((i: any) => i.group === 'score' && i.classId === lop);
      assert(viec.length === 0, `tắt: lớp không có việc Nhập điểm, có ${viec.length}`);
    });
    thu(() => {
      const { sid } = taoLopKet();
      const cp = cpCua(sid);
      assert(cp.length === 1 && cp[0].so === 1 && cp[0].status === 'planned', `bật: phải có Checkpoint 1, có ${JSON.stringify(cp)}`);
    }, true);
  });

  check('TAT-CP-2 · tắt: Kế hoạch Test có cột Checkpoint kế tiếp (cpTay) — QL xếp tay đơn lẻ + hàng loạt tạo đúng Checkpoint n; bật: chặn như cũ', () => {
    thu(() => {
      const { lop, sid } = taoLopKet();
      const luoi = keHoach.luoiThuong(P.mbManager, lop);
      assert(luoi.cpTay === true, 'tắt: cpTay phải bật');
      assert(luoi.cot.map((c: any) => c.kind).join() === 'cp1', `tắt: cột phải là cp1 (Checkpoint kế tiếp), có ${luoi.cot.map((c: any) => c.kind)}`);
      const pid = week.ensurePeriod(week.mondayOf(TODAY)).id;
      const tuan = { listening_speaking: pid, reading_writing: pid };
      const xem = keHoach.xepHangLoat(P.mbManager, { classId: lop, kind: 'cp1', studentIds: [sid], tuan, xemTruoc: true });
      assert(xem.dong[0].hanhDong === 'tao', `xem trước hàng loạt phải "tao", có ${JSON.stringify(xem.dong[0])}`);
      keHoach.xepMoiThuong(P.mbManager, { classId: lop, studentId: sid, kind: 'cp1', tuan, force: true });
      const cp = cpCua(sid);
      assert(cp.length === 1 && cp[0].so === 1 && cp[0].status === 'planned', `xếp tay phải tạo Checkpoint 1, có ${JSON.stringify(cp)}`);
      const lich = all(`SELECT skill, planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND required = 1`, cp[0].id);
      assert(lich.length === 4 && lich.every((r) => r.p === pid), `lịch 4 môn đúng tuần: ${JSON.stringify(lich)}`);
      let loi: any = null;
      try { keHoach.xepMoiThuong(P.mbManager, { classId: lop, studentId: sid, kind: 'cp1', tuan, force: true }); } catch (e) { loi = e; }
      assert(loi && /đã có/.test(loi.message), `xếp lại Checkpoint đã có phải chặn, có ${loi?.message}`);
      xoaNho();
      const sau = keHoach.luoiThuong(P.mbManager, lop);
      assert(sau.hang[0].dot.cp1.attemptId === cp[0].id, 'ô cp1 phải trỏ lượt vừa xếp');
    });
    thu(() => {
      const { lop, sid } = taoLopKet();
      assert(keHoach.luoiThuong(P.mbManager, lop).cpTay === false, 'bật: cpTay tắt');
      let loi: any = null;
      const pid = week.ensurePeriod(addDays(week.mondayOf(TODAY), 42)).id;
      try { keHoach.xepMoiThuong(P.mbManager, { classId: lop, studentId: sid, kind: 'cp2', tuan: { listening_speaking: pid, reading_writing: pid } }); } catch (e) { loi = e; }
      assert(loi && /tự xếp/.test(loi.message), `bật: xếp tay Checkpoint phải chặn, có ${loi?.message}`);
    }, true);
  });

  check('TAT-CP-3 · migrate: tắt → ẩn Checkpoint TỰ SINH chưa điểm, giữ bài có điểm + lượt QL xếp tay, chạy lặp không đổi; xếp tay mở lại đúng lượt; bật → hiện lại', () => {
    thu(() => {
      /* Dữ liệu như bản chính: sinh khi còn bật — em A đủ điểm Checkpoint 1 (→ Checkpoint 2 tự sinh), em B chưa nhập. */
      const { lop, sid: a } = taoLopKet();
      const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: 'Em Thử Tắt CP B', startWeek: khaiGiang, email: emailThu(), dob: '2012-01-01' }] });
      const b = r.studentIds[0] as number;
      for (const mon of ['listening_speaking', 'reading_writing']) regular.saveRegularScore(P.admin, cpCua(a)[0].id, mon, { score: 25, total: 30 }, TODAY);   // MON-CT-1311: KET L+S · R+W
      xoaNho();
      const [a1, a2] = cpCua(a), [b1] = cpCua(b);
      assert(a2?.so === 2 && b1?.so === 1, `bật: A có Checkpoint 2, B có Checkpoint 1: ${JSON.stringify([cpCua(a), cpCua(b)])}`);
      d.CONG_TAC_CP.tuSinh = false;
      const ap: string[] = [];
      mig.migratePrTatCp(conn, ap);
      assert(ap.length === 1, `tắt: phải ẩn: ${ap}`);
      const st = (id: number) => one('SELECT status, cancel_reason FROM assessment_attempts WHERE id = ?', id);
      assert(st(a1.id).status !== 'cancelled', 'bài có điểm (A · Checkpoint 1) phải giữ');
      for (const x of [a2, b1]) assert(st(x.id).status === 'cancelled' && st(x.id).cancel_reason === mig.LY_DO_TAT_CP, `lượt ${x.id} chưa điểm phải ẩn`);
      xoaNho();
      const viec = mywork.myWork(P.admin, { nguoi: 'tat-ca' }).items.filter((i: any) => i.group === 'score' && i.classId === lop);
      assert(viec.length === 0, `việc Nhập điểm của bài đã ẩn phải hết: ${viec.map((i: any) => i.key)}`);
      /* QL xếp tay Checkpoint 1 của B → mở lại ĐÚNG lượt đã ẩn; migrate lần nữa không ẩn lại lượt QL đã xếp. */
      const pid = week.ensurePeriod(week.mondayOf(TODAY)).id;
      keHoach.xepMoiThuong(P.mbManager, { classId: lop, studentId: b, kind: 'cp1', tuan: { listening_speaking: pid, reading_writing: pid }, force: true });
      assert(st(b1.id).status === 'planned' && st(b1.id).cancel_reason === null, `xếp tay phải mở lại lượt ${b1.id}: ${JSON.stringify(st(b1.id))}`);
      const ap2: string[] = [];
      mig.migratePrTatCp(conn, ap2);
      assert(ap2.length === 0 && st(b1.id).status === 'planned', `chạy lặp không đổi, không ẩn lại lượt QL xếp: ${ap2}`);
      /* RA-LOI-0711a: QL "Khôi phục lượt" (trang lượt, `reopenAttempt` ghi `reopened`) Checkpoint đã ẩn → deploy kế không được ẩn lại. */
      attempts.reopenAttempt(P.mbManager, a2.id); xoaNho();
      assert(st(a2.id).status === 'planned', `Khôi phục lượt ${a2.id} phải mở lại: ${JSON.stringify(st(a2.id))}`);
      const apMo: string[] = [];
      mig.migratePrTatCp(conn, apMo);
      assert(apMo.length === 0 && st(a2.id).status === 'planned', `migrate không được ẩn lại lượt QL đã Khôi phục: ${apMo} ${JSON.stringify(st(a2.id))}`);
      conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = ? WHERE id = ?`).run(mig.LY_DO_TAT_CP, a2.id);   // về như trước để bước bật dưới đây giữ nguyên
      /* Bật lại công tắc → lượt còn ẩn (A · Checkpoint 2) hiện lại. */
      d.CONG_TAC_CP.tuSinh = true;
      const ap3: string[] = [];
      mig.migratePrTatCp(conn, ap3);
      assert(ap3.length === 1 && st(a2.id).status === 'planned', `bật: lượt ${a2.id} phải hiện lại: ${ap3}`);
    }, true);
  });

  check('TAT-CP-4 · việc Nhập điểm ⇔ panel có bài: mọi tài khoản seed, Tất cả + Của tôi — panel tuần (chamSheet + thuongTheoBai + em của việc) / panel lượt', () => {
    const ids = all(`SELECT id FROM users WHERE approval_state = 'approved'`).map((r) => r.id as number);
    let soViec = 0, soCp = 0;
    const hong: string[] = [];
    for (const uid of ids) {
      const p = loadPrincipal(uid);
      for (const nguoi of ['toi', 'tat-ca'] as const) {
        xoaNho();
        const items = (mywork.myWork(p, { nguoi }).items ?? []).filter((i: any) => i.group === 'score' && i.classId);
        for (const it of items) {
          soViec += 1;
          if (it.kind === 'checkpoint') soCp += 1;
          const em = d.emCuaViec(it);
          let co: number;
          if (it.periodId) {
            /* = PanelNhapDiemTuan → LuoiNhung → LuoiChamLop: `/classes/:id/cham?periodId&kind`, lớp thường lọc `thuongTheoBai` (`dongCuaBai`). */
            const s = canCham.chamSheet(p, it.classId, { periodId: it.periodId, kind: it.kind ?? null });
            const rows = s.ft ? s.ft.rows : s.thuong.rows.filter((r: any) => d.dongCuaBai(r.kind, it.kind ?? null));
            co = d.attemptCuaEm(rows, em).size;
          } else {
            const b = diemTheoLuot.bangTheoLuot(p, it.classId, it.luot);
            co = d.attemptCuaEm(b.ft ? b.ft.rows : b.thuong.rows, em).size;
          }
          if (!co) hong.push(`${uid}/${nguoi}: ${it.key} (${it.classCode} · ${it.contextLabel})`);
        }
      }
    }
    assert(soViec > 0 && soCp > 0, `seed phải có việc Nhập điểm (có ${soViec}) và có việc Checkpoint (có ${soCp})`);
    assert(!hong.length, `${hong.length} việc Nhập điểm mở panel rỗng: ${hong.slice(0, 5).join(' | ')}`);
  });
}
