/**
 * SUA-N71 (rà toàn web 25/11, PR 3): việc chấm thuộc GV dạy em LÚC THI — bài đã thi trước khi chuyển lớp / dừng học / đổi GV mà chưa chấm vẫn là việc
 * (và quyền nhập) của GV cũ tới khi xong (N71, chủ SP 25/11 Q2). Sổ nghĩa vụ, Công việc, badge dùng CÙNG bộ lọc (N46).
 * Mỗi phép kiểm cuộn lại (SAVEPOINT).
 */
export async function runPrSuaN71Tests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nSUA-N71 · nợ điểm theo người lúc thi (N71, Q2) · sổ nghĩa vụ cùng bộ lọc (N46)');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const { tinhBai, tinhBaiNhieu } = await import('../phanTich/soNghiaVu.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { isCoreTeacherOf, loadPrincipal, scoreEditPath } = await import('../permissions.ts');
  const { duocGoDau } = await import('../fasttrack/absence.ts');
  const { listAttempts } = await import('../fasttrack/attempts.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { O_CHO_TU_SQL, capNhatConOCho } = await import('../fasttrack/conOCho.ts');
  const { saveRegularScore, regularSheet } = await import('../normal/regular.ts');
  const thu = (ten: string, fn: () => void) => {
    conn.exec(`SAVEPOINT ${ten}`);
    try { xoaNho(); fn(); } finally { conn.exec(`ROLLBACK TO ${ten}`); conn.exec(`RELEASE ${ten}`); xoaNho(); }
  };
  const lop = (id: number) => conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(id).class_id as number;
  const coNo = (attemptId: number, classId: number) => scoreDebtCells(P.admin, TODAY, null, [classId]).filter((c: any) => c.attemptId === attemptId);
  /* Lượt còn ô chờ đã tới tuần thi (o_cho_tu ≤ hôm nay), chưa huỷ, em đang học, lớp đang chạy — `ft` chọn loại lớp. */
  const luotNo = (ft: boolean, them = '') => conn.prepare(
    `SELECT a.id, a.student_id AS sid, a.class_id, a.cycle_id, a.kind, a.o_cho_tu, c.programme_code, c.branch_id FROM assessment_attempts a
       JOIN classes c ON c.id = a.class_id AND c.status = 'active' AND c.is_fast_track = ?
       JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
       JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
      WHERE a.status = 'planned' AND a.lich_su = 0 AND a.o_cho_tu IS NOT NULL AND a.o_cho_tu != '' AND a.o_cho_tu <= ? ${them}
      ORDER BY a.id LIMIT 1`,
  ).get(ft ? 1 : 0, TODAY) as any;

  check('① FT → FT: bài ĐÃ THI chưa chấm ở lại lớp cũ (việc GV lớp cũ); bài chưa tới tuần thi đi theo em', () => {
    /* Tuần thi TRƯỚC ngày chuyển (chuyển đúng thứ Hai tuần thi: em thi ở lớp mới — bài đi theo). */
    const a = luotNo(true, `AND a.kind = 'mock' AND a.o_cho_tu < '${TODAY}'`);
    assert(a, 'seed: cần lượt Mock FT còn ô chờ, tuần thi trước hôm nay');
    const dich = conn.prepare(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? ORDER BY branch_id != ?, id LIMIT 1`)
      .get(a.class_id, a.branch_id) as any;
    assert(dich, 'seed: cần lớp FT khác');
    thu('n71a', () => {
      /* Một bài chưa tới tuần thi của cùng lộ trình (dựng nếu seed không có). */
      const sau = conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND status = 'planned' AND kind != 'mt0' AND id != ? AND (o_cho_tu IS NULL OR o_cho_tu > ?)
          AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = assessment_attempts.id) LIMIT 1`).get(a.cycle_id, a.id, TODAY) as any;
      const truocNo = coNo(a.id, a.class_id);
      assert(truocNo.length > 0, 'trước khi chuyển: lượt có ô nợ');
      studentsSvc.transferStudent(P.admin, a.sid, dich.id, TODAY, 'Đổi lịch học', { note: 'Bàn giao' });
      xoaNho();
      assert(lop(a.id) === a.class_id, `bài đã thi bị kéo sang lớp mới (${lop(a.id)} ≠ ${a.class_id})`);
      const sauNo = coNo(a.id, a.class_id);
      assert(sauNo.length === truocNo.length, `nợ của lớp cũ: ${sauNo.length} / ${truocNo.length}`);
      if (sau) assert(lop(sau.id) === dich.id, 'bài chưa tới tuần thi phải đi theo em sang lớp mới');
    });
  });

  /* LƯU TRỮ (chủ SP 26/11, THAY N71 "ô thi trước ngày dừng vẫn nợ"): em vào Lưu trữ → mọi ô chấm thôi là việc; quay lại học KHÔNG mở ô cũ; Hoàn tác trả đủ. */
  check('② em Kết thúc học / Tạm dừng (Lưu trữ): ô thi trước ngày dừng HẾT là việc (nợ, Công việc, sổ); Quay lại học không mở lại; Hoàn tác Tạm dừng trả lại', () => {
    const a = luotNo(false, `AND a.kind != 'mt0' AND a.o_cho_tu < '${TODAY}'`);
    assert(a, 'seed: cần lượt lớp thường còn ô chờ, tuần thi trước hôm nay');
    const soTinh = () => tinhBai(a.id).filter((d: any) => !d.xongLuc && d.khongTinh === null).length;
    for (const [ten, st] of [['n71b', 'finished'], ['n71c', 'inactive']] as const) {
      thu(ten, () => {
        assert(coNo(a.id, a.class_id).length > 0 && soTinh() > 0, 'trước khi dừng: có nợ, sổ tính');
        studentsSvc.setStudentStatus(P.admin, a.sid, st, TODAY, 'Dừng');
        xoaNho();
        assert(!coNo(a.id, a.class_id).length, `${st}: còn nợ điểm (${coNo(a.id, a.class_id).length})`);
        assert(!listAttempts(P.admin, { classIds: [a.class_id], chiDangHoc: true, chiConO: true }).rows.some((r: any) => r.id === a.id), `${st}: Công việc còn lượt`);
        assert(!soTinh(), `${st}: sổ nghĩa vụ còn tính ${soTinh()} ô chưa xong`);
      });
    }
    thu('n71d', () => {
      const truoc = coNo(a.id, a.class_id).length;
      studentsSvc.setStudentStatus(P.admin, a.sid, 'inactive', TODAY, 'Dừng');
      studentsSvc.setStudentStatus(P.admin, a.sid, 'active', TODAY, 'Quay lại');
      xoaNho();
      assert(truoc > 0 && !coNo(a.id, a.class_id).length && !soTinh(), `Quay lại học mở lại ô cũ: nợ ${coNo(a.id, a.class_id).length}, sổ ${soTinh()}`);
    });
    thu('n71d1', () => {
      /* Hoàn tác Tạm dừng = như chưa từng dừng → trả đủ việc cũ. */
      const truoc = coNo(a.id, a.class_id).length;
      studentsSvc.setStudentStatus(P.admin, a.sid, 'inactive', TODAY, 'Dừng');
      studentsSvc.hoanTacTamDung(P.admin, a.sid);
      xoaNho();
      assert(coNo(a.id, a.class_id).length === truoc && soTinh() > 0, `Hoàn tác Tạm dừng không trả việc: ${coNo(a.id, a.class_id).length} / ${truoc}`);
    });
    thu('n71d2', () => {
      /* Hoàn tác Kết thúc học là hoàn tác, không phải quay lại: trả đủ việc. */
      const truoc = coNo(a.id, a.class_id).length;
      studentsSvc.setStudentStatus(P.admin, a.sid, 'finished', TODAY, 'Dừng');
      studentsSvc.hoanTacKetThuc(P.admin, a.sid);
      xoaNho();
      assert(coNo(a.id, a.class_id).length === truoc, `Hoàn tác Kết thúc học: ${coNo(a.id, a.class_id).length} / ${truoc}`);
    });
  });

  check('③ N46: sổ nghĩa vụ không tính "Chưa làm" bài mà Công việc đã ẩn (lượt chưa làm của lộ trình đã có KQ thi thật)', () => {
    const a = luotNo(true, `AND a.kind = 'mock' AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id)`);
    assert(a, 'seed: cần lượt Mock FT chưa có điểm, đã tới tuần thi');
    thu('n71e', () => {
      assert(tinhBai(a.id).some((d: any) => d.khongTinh === null), 'trước: có ô tính');
      conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 1, buoc_tiep = NULL WHERE id = ?`).run(a.cycle_id);
      xoaNho();
      assert(!coNo(a.id, a.class_id).length, 'Công việc ẩn lượt (N46)');
      const tinh = tinhBai(a.id).filter((d: any) => d.khongTinh === null);
      assert(!tinh.length, `sổ còn tính ${tinh.length} ô Công việc đã ẩn: ${JSON.stringify(tinh.map((d: any) => d.kieu))}`);
    });
  });

  check('④ Q2: đổi GV "Ngay hôm nay" — bài đã thi trước ngày đổi mà chưa chấm vẫn của GV CŨ (việc + quyền nhập); GV mới không nhận bài cũ', () => {
    /* Lượt FT có ô chờ L đã tới tuần thi trước hôm nay. */
    const o = conn.prepare(`SELECT a.id, a.class_id, ta.id AS ta_id, ta.user_id AS gv FROM assessment_attempts a
        JOIN classes c ON c.id = a.class_id AND c.status = 'active' AND c.is_fast_track = 1
        JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
        JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.skill = 'listening' AND ta.status = 'active' AND ta.is_core = 0
          AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ta.user_id AND ur.status = 'active' AND r.key != 'teacher')
        JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status = 'scheduled'
        JOIN report_periods rp ON rp.id = k.planned_period_id AND rp.week_start < ?
       WHERE a.status = 'planned' AND a.lich_su = 0 AND a.o_cho_tu <= ?
         AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = 'listening' AND sc.band IS NOT NULL)
       ORDER BY a.id LIMIT 1`).get(TODAY, TODAY) as any;
    assert(o, 'seed: cần ô L FT chưa chấm, tuần thi trước hôm nay');
    const moi = conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher' JOIN classes c ON c.id = ?
        WHERE ur.status = 'active' AND (ur.branch_id = c.branch_id OR ur.branch_id IS NULL) AND ur.user_id != ? ORDER BY ur.user_id LIMIT 1`).get(o.class_id, o.gv) as any;
    assert(moi, 'seed: cần GV khác cùng chi nhánh');
    /* Một lượt khác của lớp có ô L thi TỪ ngày đổi (tuần này) — của GV mới. */
    const sau = conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1
        JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
       WHERE a.class_id = ? AND a.id != ? AND a.status = 'planned' AND a.lich_su = 0
         AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = 'listening' AND sc.band IS NOT NULL) ORDER BY a.id LIMIT 1`).get(o.class_id, o.id) as any;
    assert(sau, 'seed: cần lượt thứ hai có ô L chưa chấm');
    const doiGv = () => {
      /* GV cũ RỜI HẲN lớp (mọi phân công ở lớp kết thúc — P1-B: "Lớp tôi dạy" không còn lớp này theo phân công đang hiệu lực). */
      conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE class_id = ? AND user_id = ? AND status = 'active'`).run(TODAY, o.class_id, o.gv);
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, 'listening', 0, ?, 'active', ?)`)
        .run(moi.id, o.class_id, TODAY, new Date().toISOString());
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = (SELECT id FROM report_periods WHERE week_start = ?), sit_status = 'scheduled' WHERE attempt_id = ? AND skill = 'listening'`)
        .run(mondayOf(TODAY), sau.id);
      capNhatConOCho([sau.id]);
      xoaNho();
    };
    const oL = (gv: number) => scoreDebtCells(P.admin, TODAY, null, [o.class_id]).filter((c: any) => c.skill === 'listening' && c.userId === gv);
    thu('n71f', () => {
      doiGv();
      const cu = loadPrincipal(o.gv), gvMoi = loadPrincipal(moi.id);
      const nguoi = coNo(o.id, o.class_id).find((c: any) => c.skill === 'listening')?.userId;
      assert(nguoi === o.gv, `nợ điểm: người giữ ô ${nguoi} (phải GV cũ ${o.gv})`);
      assert(coNo(sau.id, o.class_id).find((c: any) => c.skill === 'listening')?.userId === moi.id, 'ô thi từ ngày đổi: của GV mới');
      /* P1-3: quyền nhập theo đúng ô — GV cũ ô cũ được, ô mới (của GV mới) không; GV mới ô mới được. */
      assert(scoreEditPath(cu, o.class_id, 'listening', { lich_su: 0, kind: 'mock', id: o.id }) === 'assigned', 'GV cũ phải nhập được ô đã thi');
      assert(scoreEditPath(cu, o.class_id, 'listening', { lich_su: 0, kind: 'mock', id: sau.id }) === null, 'GV cũ KHÔNG nhập được ô thi sau ngày đổi (của GV mới)');
      assert(scoreEditPath(cu, o.class_id, 'listening') === null, 'không nêu ô → GV cũ không có quyền cả môn');
      assert(scoreEditPath(gvMoi, o.class_id, 'listening', { lich_su: 0, kind: 'mock', id: sau.id }) === 'assigned', 'GV mới nhập được ô mới');
      /* Chiều ngược: mọi ô nợ của GV cũ → GV cũ nhập được. */
      for (const c of oL(o.gv)) assert(scoreEditPath(cu, o.class_id, c.skill, { lich_su: 0, kind: 'mock', id: c.attemptId }) !== null, `ô ${c.attemptId} của GV cũ mà không nhập được`);
      const cuaCu = listAttempts(cu, { classIds: [o.class_id], chiDangHoc: true, chiConO: true }).rows.find((r: any) => r.id === o.id);
      assert(cuaCu?.myPendingDetail?.some((x: any) => x.skill === 'listening'), 'Công việc GV cũ: thiếu ô L đã thi');
      const cuaMoi = listAttempts(gvMoi, { classIds: [o.class_id], chiDangHoc: true, chiConO: true }).rows.find((r: any) => r.id === o.id);
      assert(!cuaMoi?.myPendingDetail?.some((x: any) => x.skill === 'listening'), 'GV mới không nhận ô thi trước ngày đổi');
      const cuSau = listAttempts(cu, { classIds: [o.class_id], chiDangHoc: true, chiConO: true }).rows.find((r: any) => r.id === sau.id);
      assert(!cuSau?.myPendingDetail?.some((x: any) => x.skill === 'listening'), 'GV cũ không thấy ô thi sau ngày đổi là "của tôi"');
      /* P1-2: một số liệu một hàm — Công việc · nợ điểm · Lịch Test (tuần của ô) · sổ nghĩa vụ cùng số ô của từng GV ở lớp (mọi môn của người đó). */
      for (const [ten, pp] of [['GV cũ', cu], ['GV mới', gvMoi]] as const) {
        xoaNho();
        const no = scoreDebtCells(P.admin, TODAY, null, [o.class_id]).filter((c: any) => c.userId === pp.userId);
        const cv = listAttempts(pp, { classIds: [o.class_id], chiDangHoc: true, chiConO: true }).rows
          .reduce((s: number, r: any) => s + (r.myPendingDetail ?? []).length, 0);
        assert(cv === no.length, `${ten}: Công việc ${cv} ≠ nợ điểm ${no.length}`);
        const so = [...tinhBaiNhieu(conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id = ?`).all(o.class_id).map((r: any) => r.id)).values()].flat()
          .filter((d: any) => d.nguoi === pp.userId && !d.xongLuc && !d.khongTinh && d.tuan <= TODAY);
        assert(so.length === no.length, `${ten}: sổ ${so.length} ≠ nợ điểm ${no.length}`);
        /* Badge "n bài chờ chấm" của lớp ở danh sách lớp (GV: phạm vi "của tôi"). GV cũ không còn dạy lớp: lớp không ở danh sách của họ. */
        const badge = (classesSvc.listClassSummaries(pp).rows as any[]).find((r) => r.id === o.class_id);
        if (badge || pp === gvMoi) assert(badge?.needScores === no.length, `${ten}: badge lớp ${badge?.needScores} ≠ nợ điểm ${no.length}`);
        const tuanO = conn.prepare(`SELECT kp.id, kp.week_start FROM attempt_skills k JOIN report_periods kp ON kp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening'`)
          .get(pp === cu ? o.id : sau.id) as any;
        /* P1-B: phạm vi MẶC ĐỊNH ("Lớp tôi dạy") — GV cũ đã rời hẳn lớp vẫn thấy bài của mình. */
        const lt = canCham.lichTest(pp, tuanO.id, null, TODAY, {}).lop.find((l: any) => l.classId === o.class_id);
        const noTuan = no.filter((c: any) => conn.prepare(`SELECT 1 FROM attempt_skills k WHERE k.attempt_id = ? AND k.skill = ? AND k.planned_period_id = ?`)
          .get(c.attemptId, /^writing/.test(c.skill) ? 'writing' : c.skill, tuanO.id)).length;
        assert((lt?.conBaiCuaToi ?? 0) === noTuan, `${ten}: Lịch Test tuần ${tuanO.week_start} của tôi ${lt?.conBaiCuaToi} ≠ nợ điểm tuần đó ${noTuan}`);
        const qh = canCham.oQuaHanCham(pp, { classId: o.class_id }, TODAY);
        assert(qh.ids.length === no.filter((c: any) => c.overdue).length, `${ten}: Quá hạn chấm ${qh.ids.length} ≠ nợ quá hạn ${no.filter((c: any) => c.overdue).length}`);
      }
      /* P1-A: gỡ "-" / nhập đè ô "-" — GV cũ ở ô mình giữ được, ô của GV mới không (trừ khi GV cũ là GVCN lớp). */
      assert(duocGoDau(cu, { classId: o.class_id, skill: 'listening', today: TODAY, kind: 'mock', attemptId: o.id }) === null, 'GV cũ phải gỡ được "-" ở ô mình giữ');
      if (!isCoreTeacherOf(cu, o.class_id, TODAY)) {
        assert(duocGoDau(cu, { classId: o.class_id, skill: 'listening', today: TODAY, kind: 'mock', attemptId: sau.id }) !== null, 'GV cũ không gỡ được "-" ở ô của GV mới');
      }
    });
    /* P1-1 (N69): GV cũ bị xoá tài khoản / hết vai ở chi nhánh (đổi GV vì nghỉ) → không giữ bài: ô về GV đang hiệu lực. */
    for (const [ten, nghi] of [['xoá tài khoản', `UPDATE users SET status = 'deleted' WHERE id = ?`], ['hết vai ở chi nhánh', `UPDATE user_roles SET status = 'inactive' WHERE user_id = ?`]] as const) {
      thu('n71j', () => {
        doiGv();
        conn.prepare(nghi).run(o.gv);
        xoaNho();
        const nguoi = coNo(o.id, o.class_id).find((c: any) => c.skill === 'listening')?.userId;
        assert(nguoi === moi.id, `${ten}: ô cũ phải về GV đang hiệu lực ${moi.id} (được ${nguoi})`);
        assert(!(loadPrincipal(o.gv).phanCongCu ?? []).length, `${ten}: GV đã nghỉ còn phanCongCu`);
        const so = tinhBai(o.id).find((d: any) => d.kieu === 'listening');
        assert(so?.nguoi === moi.id, `${ten}: sổ ô chưa xong phải của GV đang hiệu lực (được ${so?.nguoi})`);
      });
    }
  });

  check('⑤ MT0 lớp thường: ô W1 / W2 thuộc GV Writing của lớp (phân công `writing`), không "Chưa phân công"', () => {
    const o = conn.prepare(`SELECT a.id, a.class_id, ta.user_id AS gv FROM assessment_attempts a
        JOIN classes c ON c.id = a.class_id AND c.status = 'active' AND c.is_fast_track = 0
        JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.skill = 'writing' AND ta.status = 'active' AND ta.is_core = 0
        JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
        JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'writing'
       WHERE a.kind != 'mt0' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`).get() as any;
    assert(o, 'seed: cần lượt lớp thường có GV Writing');
    thu('n71g', () => {
      /* Seed không có MT0 — đổi một lượt lớp thường thành MT0 (chấm band: ô W1 / W2, lịch một dòng `writing`). */
      conn.prepare(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id = ?`).run(o.id);
      conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ?`).run(o.id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = (SELECT id FROM report_periods WHERE week_start <= ? ORDER BY week_start DESC LIMIT 1), sit_status = 'scheduled', required = 1
          WHERE attempt_id = ? AND skill = 'writing'`).run(TODAY, o.id);
      conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0 WHERE id = ?`).run(o.id);
      capNhatConOCho([o.id]);
      xoaNho();
      const w = scoreDebtCells(P.admin, TODAY, null, [o.class_id]).filter((c: any) => c.attemptId === o.id && /^writing/.test(c.skill));
      assert(w.length > 0, 'seed: MT0 phải có ô W nợ');
      assert(w.every((c: any) => c.userId === o.gv), `ô W MT0: ${JSON.stringify(w.map((c: any) => [c.skill, c.userId]))} (phải ${o.gv})`);
      assert(tinhBai(o.id).filter((d: any) => /^writing/.test(d.kieu)).every((d: any) => d.nguoi === o.gv), 'sổ nghĩa vụ: ô W MT0 phải của GV Writing');
    });
  });

  check('⑥ bỏ môn khỏi chương trình: lượt giữ bộ môn cũ (`bo_mon`) còn ô chờ ở môn đã bỏ → cờ "còn ô chờ" vẫn có', () => {
    const a = luotNo(false, `AND a.kind != 'mt0'`);
    assert(a, 'seed');
    thu('n71h', () => {
      const mon = conn.prepare(`SELECT k.skill FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id
          WHERE k.attempt_id = ? AND k.required = 1 AND k.sit_status = 'scheduled' AND rp.week_start <= ?
            AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = k.attempt_id AND sc.skill = k.skill AND sc.raw_score IS NOT NULL) LIMIT 1`).get(a.id, TODAY) as any;
      assert(mon, 'seed: cần môn chờ điểm');
      const bo = (conn.prepare(`SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq`).all(a.programme_code) as any[]).map((r) => r.skill);
      conn.prepare(`UPDATE assessment_attempts SET bo_mon = ? WHERE id = ?`).run(JSON.stringify(bo), a.id);
      conn.prepare(`DELETE FROM programme_skills WHERE programme_code = ? AND skill = ?`).run(a.programme_code, mon.skill);
      /* Mọi môn khác coi như đã chấm — chỉ còn môn đã bỏ chờ. */
      for (const k of bo.filter((x: string) => x !== mon.skill)) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total) VALUES (?, ?, 1, 10)
            ON CONFLICT (attempt_id, skill) DO UPDATE SET raw_score = 1, raw_total = 10`).run(a.id, k);
      }
      const co = conn.prepare(`SELECT ${O_CHO_TU_SQL} AS v FROM assessment_attempts a WHERE a.id = ?`).get(a.id).v;
      assert(co !== null, `môn đã bỏ (${mon.skill}) chưa chấm: cờ còn ô chờ phải có (được ${co})`);
    });
  });

  check('⑦ lớp thường gửi tổng mà ô điểm trống → không ghi "người nhập" (MT-P09)', () => {
    const a = luotNo(false, `AND a.kind != 'mt0'`);
    assert(a, 'seed');
    thu('n71i', () => {
      const mon = conn.prepare(`SELECT k.skill FROM attempt_skills k WHERE k.attempt_id = ? AND k.required = 1
          AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = k.attempt_id AND sc.skill = k.skill AND sc.raw_score IS NOT NULL) LIMIT 1`).get(a.id) as any;
      assert(mon, 'seed');
      saveRegularScore(P.admin, a.id, mon.skill, { total: 40 }, TODAY);
      const r = conn.prepare(`SELECT raw_score, raw_total, entered_by, entered_at FROM assessment_scores WHERE attempt_id = ? AND skill = ?`).get(a.id, mon.skill) as any;
      assert(r && r.raw_score === null && r.entered_by === null && r.entered_at === null, `ô trống mà có người nhập: ${JSON.stringify(r)}`);
    });
  });
}
