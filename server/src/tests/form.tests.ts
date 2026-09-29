/**
 * PHÉP KIỂM PR-Form: chọn người (F-2), lưu trước đính kèm sau (F-1), bằng chứng (G-9), chủ đề Case theo
 * chương trình (F07), nhập bù (F-3, S5).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §1, §2, §3.13, §3.11, §6, §7 dòng Form.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-form-chon-nguoi.md (bảng Q1–Q13).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFormTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  const domain: any = await import('../../../shared/domain/index.ts');

  // ================================================================== 1. Luật thuần chọn người, bằng chứng, chủ đề Case

  console.log('\nPR-Form · 1. Luật thuần dùng chung (shared/domain)');

  check('PR-Form · nguoiThanhPayload: bốn dạng + null', () => {
    assert(JSON.stringify(domain.nguoiThanhPayload(null)) === '{}', 'null → {}');
    assert(JSON.stringify(domain.nguoiThanhPayload({ kieu: 'toi' })) === '{"performerSelf":true}', 'toi');
    assert(
      JSON.stringify(domain.nguoiThanhPayload({ kieu: 'tai_khoan', id: 9, ten: 'Cô Lan' })) === '{"performerUserId":9}',
      'tai_khoan chỉ gửi id',
    );
    assert(
      JSON.stringify(domain.nguoiThanhPayload({ kieu: 'ngoai', ten: '  Tutor ngoài Minh  ' }))
        === '{"performerName":"Tutor ngoài Minh"}',
      'ngoai gửi tên đã trim',
    );
  });

  check('PR-Form · nguoiThanhPayloadYThuc: toi gửi không gì cả (K2-6d)', () => {
    assert(JSON.stringify(domain.nguoiThanhPayloadYThuc(null)) === '{}', 'null → {}');
    assert(JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'toi' })) === '{}', 'toi → {}');
    assert(
      JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'tai_khoan', id: 5, ten: 'GV' })) === '{"performedBy":5}',
      'tai_khoan → performedBy',
    );
    assert(
      JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'ngoai', ten: 'Phụ huynh' })) === '{"performerName":"Phụ huynh"}',
      'ngoai → performerName',
    );
  });

  check('PR-Form · nguoiThieu: ba trường hợp', () => {
    assert(domain.nguoiThieu(null, true) === 'Chọn người thực hiện.', 'thiếu + bắt buộc');
    assert(domain.nguoiThieu(null, false) === null, 'thiếu + không bắt buộc → null');
    assert(
      domain.nguoiThieu({ kieu: 'ngoai', ten: 'A' }, true) === 'Gõ tên ngoài hệ thống (ít nhất 2 ký tự).',
      'tên ngoài hệ thống quá ngắn',
    );
    assert(domain.nguoiThieu({ kieu: 'ngoai', ten: 'An' }, true) === null, 'người ngoài tên đủ dài → null');
    assert(domain.nguoiThieu({ kieu: 'toi' }, true) === null, 'đã chọn Tôi → null');
  });

  check('PR-Form · tenAnhDan: đúng mẫu, đúng đuôi theo mime, giờ Việt Nam', () => {
    const now = new Date('2026-09-23T07:05:00.000Z'); // 14:05 giờ VN
    assert(domain.tenAnhDan(now, 'image/png') === 'anh-chup-23-09-1405.png', `png: ${domain.tenAnhDan(now, 'image/png')}`);
    assert(domain.tenAnhDan(now, 'image/jpeg') === 'anh-chup-23-09-1405.jpg', 'jpg');
    assert(domain.tenAnhDan(now, 'image/webp') === 'anh-chup-23-09-1405.webp', 'webp');
    assert(domain.tenAnhDan(now, 'image/gif') === 'anh-chup-23-09-1405.gif', 'gif');
    assert(domain.tenAnhDan(now, 'application/octet-stream') === 'anh-chup-23-09-1405.png', 'mime lạ → png');
  });

  check('PR-Form · laLienKet: đúng/sai', () => {
    assert(domain.laLienKet('https://drive.google.com/abc') === true, 'https hợp lệ');
    assert(domain.laLienKet('http://example.com/x') === true, 'http hợp lệ');
    assert(domain.laLienKet('https://a.com/x có khoảng trắng') === false, 'có khoảng trắng');
    assert(domain.laLienKet('ftp://a.com/x') === false, 'giao thức ftp không tính');
    assert(domain.laLienKet('https://a.com/x\nhttps://b.com/y') === false, 'hai dòng');
  });

  check('PR-Form · caseTopicsFor: lớp thường 4 môn có writing, không writing1', () => {
    const topics = domain.caseTopicsFor(true);
    assert(topics.length === 4, `4 môn: ${topics.length}`);
    assert(topics.includes('writing') && !topics.includes('writing1'), 'writing, không writing1/writing2');
    assert(JSON.stringify(topics) === JSON.stringify(['listening', 'reading', 'writing', 'speaking']), 'đúng thứ tự L R W S');
    const ft = domain.caseTopicsFor(false);
    assert(JSON.stringify(ft) === JSON.stringify(['listening', 'reading', 'writing1', 'writing2', 'speaking']), 'FT năm ô');
  });

  // ================================================================== 2. Máy chủ: tìm người GET /ref/nguoi

  console.log('\nPR-Form · 2. GET /ref/nguoi — tìm người không dấu, ≥ 3 ký tự, gợi ý GV lớp của em');

  {
    const { createApp } = await import('../app.ts');
    const { createSession } = await import('../auth.ts');
    const intake = await import('../classes/intake.ts');
    const server = createApp().listen(0);
    const port = (server.address() as any).port as number;
    const call = async (who: { userId: number } | null, url: string) => {
      const headers: Record<string, string> = {};
      if (who) headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
      const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { headers });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân */ }
      return { status: res.status, json };
    };

    const fouClassId = t.classId('MB FOU 12');
    intake.commitIntake(P.admin, {
      classId: fouClassId, rows: [{ fullName: 'PR-Form Em Fou', target: 7, email: 'hv@demo.test' }],
      idempotencyKey: 'pr-form-ref-nguoi-fou',
    });
    const fouStudent = conn.prepare(`SELECT id FROM students WHERE full_name = 'PR-Form Em Fou'`).get() as any;

    const noStudent = await call(P.w1Teacher, '/ref/nguoi?q=tr&nhom=giao_vien');
    const searchTeacher = await call(P.w1Teacher, '/ref/nguoi?q=tran+ngoc&nhom=giao_vien');
    const managerAsTeacher = await call(P.w1Teacher, '/ref/nguoi?q=khanh+vy&nhom=giao_vien');
    const managerAsStaff = await call(P.w1Teacher, '/ref/nguoi?q=khanh+vy&nhom=nhan_vien');
    const suggestFou = await call(P.w1Teacher, `/ref/nguoi?q=&nhom=giao_vien&studentId=${fouStudent.id}`);

    const lockedId = P.lrTeacher.userId;
    const lockedName = (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(lockedId) as any).full_name as string;
    const lockedQuery = encodeURIComponent(lockedName.split(' ').slice(-2).join(' '));
    let lockedResult: any;
    try {
      conn.prepare(`UPDATE users SET status = 'inactive' WHERE id = ?`).run(lockedId);
      lockedResult = await call(P.w1Teacher, `/ref/nguoi?q=${lockedQuery}&nhom=giao_vien`);
    } finally {
      conn.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(lockedId);
    }
    server.close();

    check('PR-Form · GV không có MEETING_VIEW vẫn gọi được /ref/nguoi (200)', () => {
      assert(searchTeacher.status === 200, `200: ${searchTeacher.status} ${JSON.stringify(searchTeacher.json)}`);
    });

    check('PR-NEN · q rỗng/ngắn vẫn trả danh sách (T14)', () => {
      assert(Array.isArray(noStudent.json) && noStudent.json.length > 0 && noStudent.json.every((r: any) => !!r.name),
        `Có danh sách, mọi dòng có tên: ${JSON.stringify(noStudent.json)}`);
    });

    check('PR-Form · gõ không dấu "tran ngoc" tìm ra GV "Trần Ngọc Hà"', () => {
      const names = (searchTeacher.json ?? []).map((r: any) => r.name);
      assert(names.includes('Trần Ngọc Hà'), `Không thấy Trần Ngọc Hà trong: ${JSON.stringify(names)}`);
    });

    check('PR-Form · nhóm giao_vien không có Quản lý thuần; nhóm nhan_vien có', () => {
      const namesTeacherGroup = (managerAsTeacher.json ?? []).map((r: any) => r.name);
      const namesStaffGroup = (managerAsStaff.json ?? []).map((r: any) => r.name);
      assert(!namesTeacherGroup.includes('Nguyễn Khánh Vy'), `giao_vien không được có QL thuần: ${JSON.stringify(namesTeacherGroup)}`);
      assert(namesStaffGroup.includes('Nguyễn Khánh Vy'), `nhan_vien phải có QL: ${JSON.stringify(namesStaffGroup)}`);
    });

    check('PR-Form · tài khoản bị khoá (status inactive) không hiện trong kết quả tìm', () => {
      const names = (lockedResult.json ?? []).map((r: any) => r.name);
      assert(!names.includes(lockedName), `Tài khoản khoá không được hiện: ${lockedName} trong ${JSON.stringify(names)}`);
    });

    check('PR-Form · studentId của em lớp MB FOU 12 + q rỗng → các GV đang dạy lớp đó (cungLop = true) đứng đầu (PR-NEN T14: sau đó là người khác, tối đa 20)', () => {
      const rows = suggestFou.json ?? [];
      assert(Array.isArray(rows) && rows.length > 0 && rows.length <= 20, `phải gợi ý ít nhất một GV, tối đa 20: ${JSON.stringify(rows)}`);
      const dauKhac = rows.findIndex((r: any) => r.cungLop !== true);
      assert(rows[0].cungLop === true && (dauKhac === -1 || rows.slice(dauKhac).every((r: any) => r.cungLop !== true)),
        `GV cùng lớp phải đứng đầu, trước mọi người khác: ${JSON.stringify(rows)}`);
      const names = rows.map((r: any) => r.name);
      assert(names.includes('Trần Ngọc Hà'), `GVCN MB FOU 12 phải nằm trong gợi ý: ${JSON.stringify(names)}`);
    });
  }

  // ================================================================== 3. Máy chủ: người thực hiện lưu ID (F-2) + ngày Điều chỉnh (nợ S2)

  console.log('\nPR-Form · 3. Người thực hiện PA học thuật lưu ID, kiểm một chỗ; Điều chỉnh giữ ngày mặc định');

  {
    const cases: any = await import('../cases/cases.ts');
    const ivRow = (id: number) => conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(id) as any;
    const revRows = (id: number) =>
      conn.prepare('SELECT * FROM case_intervention_revisions WHERE intervention_id = ? ORDER BY id').all(id) as any[];

    let soThuTu = 0;
    /** Case Listening mới ở MB FT 101, mở bởi GV Listening — riêng cho từng phép kiểm. */
    function taoCase(): { caseId: number } {
      soThuTu += 1;
      const c = cases.reportIssue(P.lrTeacher, {
        studentId: makeFtStudent(`F3-${soThuTu}`), topic: 'listening',
        title: `PR-Form thử người thực hiện (${soThuTu})`,
        summary: 'Case dùng riêng cho phép kiểm PR-Form Task 3, không đụng dữ liệu demo.',
        primaryCode: domain.issuesForTopic('listening')[0].code,
        idempotencyKey: `pr-form-t3-${soThuTu}`,
      }) as any;
      return { caseId: c.id as number };
    }
    /** Học viên mới ở MB FT 101 — tách khỏi bộ demo và khỏi các phép kiểm khác trong file này. */
    function makeFtStudent(tag: string): number {
      const cid = t.classId('MB FT 101');
      const NOW = new Date().toISOString();
      const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
      const sid = Number(conn.prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ).run(`PISA-FORM-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
        .run(sid, cid, NOW);
      conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`,
      ).run(sid, NOW);
      return sid;
    }

    check('PR-Form · recordIntervention: performerUserId của QL thuần → 400; GV bị khoá → 400; id không tồn tại → 400', () => {
      const { caseId: c1 } = taoCase();
      assertThrows(
        () => cases.recordIntervention(P.lrTeacher, c1, {
          kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerUserId: P.mbManager.userId,
          status: 'started', startedDate: TODAY,
        }),
        /giáo viên đang làm việc/,
        'QL thuần không phải giáo viên — phải 400',
      );

      const { caseId: c2 } = taoCase();
      const lockedId = P.w2Teacher.userId;
      try {
        conn.prepare(`UPDATE users SET status = 'inactive' WHERE id = ?`).run(lockedId);
        assertThrows(
          () => cases.recordIntervention(P.lrTeacher, c2, {
            kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerUserId: lockedId,
            status: 'started', startedDate: TODAY,
          }),
          /giáo viên đang làm việc/,
          'GV đang khoá — phải 400',
        );
      } finally {
        conn.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(lockedId);
      }

      const { caseId: c3 } = taoCase();
      assertThrows(
        () => cases.recordIntervention(P.lrTeacher, c3, {
          kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerUserId: 9_999_999,
          status: 'started', startedDate: TODAY,
        }),
        /giáo viên đang làm việc/,
        'id không tồn tại — phải 400',
      );
    });

    check('PR-Form · performerUserId (GV) + performerName cùng lúc → chỉ lưu performer_user_id, performer_name NULL', () => {
      const { caseId } = taoCase();
      const d = cases.recordIntervention(P.lrTeacher, caseId, {
        kind: 'self_study', description: 'Tự học Listening mỗi ngày',
        performerUserId: P.w1Teacher.userId, performerName: 'Tên tự do bị bỏ qua',
        status: 'started', startedDate: TODAY,
      }) as any;
      const iv = d.interventions.find((i: any) => i.kind === 'self_study');
      const row = ivRow(iv.id);
      assert(row.performer_user_id === P.w1Teacher.userId, `performer_user_id đúng: ${row.performer_user_id}`);
      assert(row.performer_name === null, `performer_name phải NULL: ${row.performer_name}`);
    });

    check('PR-Form · performerName người ngoài → performer_user_id IS NULL, tên đúng', () => {
      const { caseId } = taoCase();
      const d = cases.recordIntervention(P.lrTeacher, caseId, {
        kind: 'tutor', description: 'Học tutor ngoài trung tâm', performerName: 'Tutor ngoài Minh',
        status: 'started', startedDate: TODAY,
      }) as any;
      const iv = d.interventions.find((i: any) => i.kind === 'tutor');
      const row = ivRow(iv.id);
      assert(row.performer_user_id === null, `performer_user_id phải NULL: ${row.performer_user_id}`);
      assert(row.performer_name === 'Tutor ngoài Minh', `tên đúng: ${row.performer_name}`);
    });

    check('PR-Form · Nhập bù: performerUserId · performerSelf · tên ngoài → ba PA đúng; dòng không có ai → 400 câu cũ', () => {
      const studentId = makeFtStudent(`F3-BF-${++soThuTu}`);
      const closed = cases.backfillCase(P.lrTeacher, {
        studentId, topic: 'listening', primaryCode: domain.issuesForTopic('listening')[0].code,
        title: 'Nhập bù thử người thực hiện', summary: 'Case nhập bù dùng cho phép kiểm PR-Form.',
        fromDate: '2026-08-01', toDate: '2026-08-10',
        actions: [
          { description: 'Buổi 1 — GV bộ môn kèm riêng', performerUserId: P.w1Teacher.userId, fromDate: '2026-08-01', toDate: '2026-08-03' },
          { description: 'Buổi 2 — chính tôi kèm', performerSelf: true, fromDate: '2026-08-04', toDate: '2026-08-06' },
          { description: 'Buổi 3 — tutor ngoài', performerName: 'Tutor ngoài Lan', fromDate: '2026-08-07', toDate: '2026-08-10' },
        ],
        outcome: 'improved', note: 'Ba buổi hỗ trợ khác người, ghi lại đủ ba dòng.',
      }) as any;
      const ivs = (conn.prepare('SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id').all(closed.id) as any[]);
      assert(ivs.length === 3, `phải có ba PA: ${ivs.length}`);
      assert(ivs[0].performer_user_id === P.w1Teacher.userId && ivs[0].performer_name === null, 'dòng 1 lưu ID');
      assert(ivs[1].performer_user_id === P.lrTeacher.userId && ivs[1].performer_name === null, 'dòng 2 (Tôi) lưu ID người ghi');
      assert(ivs[2].performer_user_id === null && ivs[2].performer_name === 'Tutor ngoài Lan', 'dòng 3 lưu tên ngoài');

      assertThrows(
        () => cases.backfillCase(P.lrTeacher, {
          studentId: makeFtStudent(`F3-BF-${++soThuTu}`), topic: 'listening', primaryCode: domain.issuesForTopic('listening')[0].code,
          title: 'Nhập bù thiếu người', summary: 'Một dòng không ghi ai làm.',
          fromDate: '2026-08-01', toDate: '2026-08-05',
          actions: [{ description: 'Buổi không ai nhận làm', fromDate: '2026-08-01', toDate: '2026-08-05' }],
          outcome: 'improved', note: 'Phải bị từ chối vì thiếu người thực hiện.',
        }),
        /Cần ghi ai là người thực hiện/,
        'dòng không có ai → 400 câu cũ',
      );
    });

    check('PR-Form · Nợ S2: Điều chỉnh chỉ đổi mô tả trên PA followup_due NULL → nhận planEndDefault, lịch sử NULL → ngày đó', () => {
      const { caseId } = taoCase();
      const d = cases.recordIntervention(P.lrTeacher, caseId, {
        kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerSelf: true,
        status: 'started', startedDate: TODAY,
      }) as any;
      const iv = d.interventions.find((i: any) => i.kind === 'self_study');
      conn.prepare(`UPDATE case_interventions SET followup_due = NULL WHERE id = ?`).run(iv.id);
      assert(ivRow(iv.id).followup_due === null, 'phải đặt NULL được bằng SQL trực tiếp trước khi thử');

      const expected = domain.planEndDefault(TODAY);
      cases.updateResult(P.lrTeacher, iv.id, {
        decision: 'adjust', decisionNote: 'Đổi cách diễn đạt mô tả, không đổi gì khác',
        outcome: 'partial', note: 'Đang có tiến bộ, tiếp tục theo dõi thêm.',
        adjust: { description: 'Tự học Listening — nghe chép mỗi tối 20 phút' },
      });
      const after = ivRow(iv.id);
      assert(after.followup_due === expected, `followup_due phải = planEndDefault: ${after.followup_due} vs ${expected}`);
      const revs = revRows(iv.id);
      const last = revs[revs.length - 1];
      assert(last.old_followup_due === null, `lịch sử old phải NULL: ${last.old_followup_due}`);
      assert(last.new_followup_due === expected, `lịch sử new phải đúng ngày mặc định: ${last.new_followup_due}`);
    });

    check('PR-Form · Cùng PA followup_due NULL, adjust: {} (không đổi gì) → vẫn 400', () => {
      const { caseId } = taoCase();
      const d = cases.recordIntervention(P.lrTeacher, caseId, {
        kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerSelf: true,
        status: 'started', startedDate: TODAY,
      }) as any;
      const iv = d.interventions.find((i: any) => i.kind === 'self_study');
      conn.prepare(`UPDATE case_interventions SET followup_due = NULL WHERE id = ?`).run(iv.id);
      assertThrows(
        () => cases.updateResult(P.lrTeacher, iv.id, {
          decision: 'adjust', decisionNote: 'Không đổi gì cả, chỉ đang thử',
          outcome: 'partial', note: 'Đang có tiến bộ, tiếp tục theo dõi thêm.',
          adjust: {},
        }),
        /Điều chỉnh thì phải đổi ít nhất một thứ/,
        'không đổi gì (kể cả ngày mặc định) vẫn phải bị từ chối',
      );
    });

    check('PR-Form · adjust.performerUserId là QL thuần → 400; là GV → lịch sử new_performer_user_id đúng', () => {
      const { caseId } = taoCase();
      const d = cases.recordIntervention(P.lrTeacher, caseId, {
        kind: 'self_study', description: 'Tự học Listening mỗi ngày', performerSelf: true,
        status: 'started', startedDate: TODAY,
      }) as any;
      const iv = d.interventions.find((i: any) => i.kind === 'self_study');

      assertThrows(
        () => cases.updateResult(P.lrTeacher, iv.id, {
          decision: 'adjust', decisionNote: 'Đổi người thực hiện sang Quản lý — phải bị từ chối',
          outcome: 'partial', note: 'Đang có tiến bộ, tiếp tục theo dõi thêm.',
          adjust: { performerUserId: P.mbManager.userId },
        }),
        /giáo viên đang làm việc/,
        'QL thuần không được nhận làm PA học thuật',
      );

      cases.updateResult(P.lrTeacher, iv.id, {
        decision: 'adjust', decisionNote: 'Đổi người thực hiện sang GV Writing 1',
        outcome: 'partial', note: 'Đang có tiến bộ, tiếp tục theo dõi thêm.',
        adjust: { performerUserId: P.w1Teacher.userId },
      });
      const revs = revRows(iv.id);
      const last = revs[revs.length - 1];
      assert(last.new_performer_user_id === P.w1Teacher.userId, `lịch sử đúng người mới: ${last.new_performer_user_id}`);
    });
  }

  // ================================================================== 4. Chủ đề Case theo chương trình (F07), SkillBoard, Ý thức

  console.log('\nPR-Form · 4. Chủ đề Case theo chương trình (F07), attemptKind cho SkillBoard, K2-6d, defaultSkill vi phạm');

  {
    const cases: any = await import('../cases/cases.ts');
    const measSvc: any = await import('../yThuc/measures.ts');
    const violSvc: any = await import('../yThuc/violations.ts');
    const week: any = await import('../platform/week.ts');
    const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
    const regular: any = await import('../normal/regular.ts');

    let soThuTu = 0;
    const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
    const NOW = new Date().toISOString();

    /** Học viên mới ở một lớp có sẵn của bộ demo, kèm một lộ trình đang chạy — riêng cho phép kiểm Task 4. */
    function taoHocVien(classCode: 'MB FOU 12' | 'MB FT 101'): { sid: number; cid: number; cycleId: number } {
      soThuTu += 1;
      const tag = `F4-${soThuTu}`;
      const cid = t.classId(classCode);
      const ft = classCode === 'MB FT 101';
      const sid = Number(conn.prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
        .run(sid, cid, NOW);
      const cycleId = Number(conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
         VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
      ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', NOW).lastInsertRowid);
      return { sid, cid, cycleId };
    }

    check('PR-Form · caseTopicsOf: em lớp thường (MB FOU 12) → ratio true, 4 môn; em Fast Track (MB FT 101) → 5 ô', () => {
      const fou = taoHocVien('MB FOU 12');
      const r1 = cases.caseTopicsOf(P.normalCoreTeacher, fou.sid) as any;
      assert(r1.ratio === true, `FOU phải ratio=true: ${JSON.stringify(r1)}`);
      assert(JSON.stringify(r1.topics) === JSON.stringify(['listening', 'reading', 'writing', 'speaking']), `FOU 4 môn L R W S: ${JSON.stringify(r1.topics)}`);

      const ft = taoHocVien('MB FT 101');
      const r2 = cases.caseTopicsOf(P.lrTeacher, ft.sid) as any;
      assert(r2.ratio === false, `FT phải ratio=false: ${JSON.stringify(r2)}`);
      assert(
        JSON.stringify(r2.topics) === JSON.stringify(['listening', 'reading', 'writing1', 'writing2', 'speaking']),
        `FT 5 ô: ${JSON.stringify(r2.topics)}`,
      );
    });

    check('PR-Form · reportIssue: em lớp thường mở Case topic "writing" thành công (F07)', () => {
      const fou = taoHocVien('MB FOU 12');
      const c = cases.reportIssue(P.normalCoreTeacher, {
        studentId: fou.sid, topic: 'writing', title: 'Case Writing lớp thường (PR-Form Task 4)',
        summary: 'Em còn yếu tổ chức ý ở bài viết lớp thường, cần hỗ trợ thêm.',
        primaryCode: domain.issuesForTopic('writing')[0].code,
        idempotencyKey: `pr-form-t4-writing-${soThuTu}`,
      }) as any;
      assert(c.topic === 'writing', `Case phải mở đúng topic writing: ${c.topic}`);
    });

    check('PR-Form · S5: backfillCase lớp thường topic writing kèm metrics → case_followups.metrics đúng một mục', () => {
      const fou = taoHocVien('MB FOU 12');
      /* Quản lý: mở → ghi phương án → đóng case đều đi qua được, không vướng C02 (đúng kỹ năng) lẫn "chỉ GVCN đóng case". */
      const closed = cases.backfillCase(P.mbManager, {
        studentId: fou.sid, topic: 'writing', primaryCode: domain.issuesForTopic('writing')[0].code,
        title: 'Nhập bù Writing lớp thường (S5)', summary: 'Nhập bù case Writing với điểm chi tiết theo kỹ năng.',
        fromDate: '2026-08-01', toDate: '2026-08-10',
        actions: [{ description: 'Ôn luyện tổ chức ý bài viết', performerSelf: true, fromDate: '2026-08-01', toDate: '2026-08-10' }],
        outcome: 'improved', note: 'Bài viết đã mạch lạc hơn rõ rệt sau đợt ôn.',
        metrics: [{ skill: 'writing', score: 12, total: 20 }],
      }) as any;
      const follow = conn.prepare('SELECT metrics FROM case_followups WHERE case_id = ? ORDER BY id DESC LIMIT 1').get(closed.id) as any;
      const metrics = JSON.parse(follow.metrics ?? '[]');
      assert(Array.isArray(metrics) && metrics.length === 1, `phải đúng một mục metrics: ${follow.metrics}`);
      assert(metrics[0].skill === 'writing' && metrics[0].score === 12 && metrics[0].total === 20, `mục metrics sai: ${JSON.stringify(metrics[0])}`);
    });

    check('PR-Form · skillSupportBoard: em lớp thường có attemptKind progress/final ở điểm', () => {
      const fou = taoHocVien('MB FOU 12');
      const weekStart1 = '2026-08-03';
      const weekStart2 = '2026-08-31';
      const periodId1 = week.ensurePeriod(weekStart1).id;
      const periodId2 = week.ensurePeriod(weekStart2).id;
      const a1 = Number(conn.prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
         VALUES (?,?,1,'progress',?,?, 'planned', ?)`,
      ).run(fou.cycleId, fou.sid, fou.cid, periodId1, NOW).lastInsertRowid);
      skillSchedule.ensureSkillRows(a1);
      regular.saveRegularScore(P.admin, a1, 'writing', { score: 14, total: 20 });
      const a2 = Number(conn.prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
         VALUES (?,?,2,'final',?,?, 'planned', ?)`,
      ).run(fou.cycleId, fou.sid, fou.cid, periodId2, NOW).lastInsertRowid);
      skillSchedule.ensureSkillRows(a2);
      regular.saveRegularScore(P.admin, a2, 'writing', { score: 17, total: 20 });

      const board = cases.skillSupportBoard(P.normalCoreTeacher, fou.sid, fou.cycleId) as any;
      const writingRow = board.rows.find((r: any) => r.category === 'writing');
      const kinds = (writingRow?.points ?? []).map((pt: any) => pt.attemptKind);
      assert(kinds.includes('progress') && kinds.includes('final'), `points phải mang attemptKind: ${JSON.stringify(kinds)}`);
    });

    check('PR-Form · K2-6d: confirmMeasure không người → performed_by = người xác nhận; performedBy tài khoản khoá → 400', () => {
      const fou = taoHocVien('MB FOU 12');
      const v = violSvc.recordViolation(P.normalCoreTeacher, {
        studentId: fou.sid, category: 'homework', description: 'Không nộp bài tập về nhà buổi này',
        idempotencyKey: `pr-form-t4-viol-${soThuTu}`,
      }) as any;
      const m = measSvc.createMeasure(P.normalCoreTeacher, {
        studentId: fou.sid, kind: 'talk_short', violationIds: [v.violation.id],
      }) as any;
      const done = measSvc.confirmMeasure(P.normalCoreTeacher, m.id, {
        performedOn: TODAY, note: 'Đã trao đổi ngắn với em cuối buổi.',
      }) as any;
      assert(done.performedBy === P.normalCoreTeacher.userId, `K2-6d: performed_by phải là người xác nhận: ${done.performedBy}`);

      const m2 = measSvc.createMeasure(P.normalCoreTeacher, {
        studentId: fou.sid, kind: 'talk_short', violationIds: [v.violation.id],
      }) as any;
      const lockedId = P.w2Teacher.userId;
      try {
        conn.prepare(`UPDATE users SET status = 'inactive' WHERE id = ?`).run(lockedId);
        assertThrows(
          () => measSvc.confirmMeasure(P.normalCoreTeacher, m2.id, {
            performedOn: TODAY, performedBy: lockedId, note: 'Đã trao đổi ngắn với em cuối buổi.',
          }),
          /nhân viên đang làm việc/,
          'performedBy khoá phải 400',
        );
      } finally {
        conn.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(lockedId);
      }
    });

    {
      const { createApp } = await import('../app.ts');
      const { createSession } = await import('../auth.ts');
      const server = createApp().listen(0);
      const port = (server.address() as any).port as number;
      const call = async (who: { userId: number }, method: string, url: string, body?: unknown) => {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
        const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        let json: any = null;
        try { json = await res.json(); } catch { /* không có thân */ }
        return { status: res.status, json };
      };

      const cid = t.classId('MB FT 101');
      const sid = Number(conn.prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
      ).run(`PISA-F4-HTTP`, `Học viên F4 HTTP`, `hoc vien f4 http`, mbBranch, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
        .run(sid, cid, NOW);

      const vRes = await call(P.w1Teacher, 'POST', '/violations', {
        studentId: sid, category: 'homework', description: 'Không nộp bài Writing Task 1 buổi này',
        idempotencyKey: 'pr-form-t4-http-skill',
      });
      const simRes = await call(P.w1Teacher, 'GET', `/violations/similar?studentId=${sid}&category=homework&occurredOn=${TODAY}`);
      server.close();

      check('PR-Form · HTTP POST /violations không có "skill" → tự điền theo môn GV dạy đúng một môn ở lớp; /violations/similar trả defaultSkill khớp', () => {
        assert(vRes.status === 200, `POST /violations phải 200: ${vRes.status} ${JSON.stringify(vRes.json)}`);
        assert(vRes.json?.violation?.skill === 'writing1', `skill phải tự điền writing1: ${JSON.stringify(vRes.json?.violation)}`);
        assert(simRes.status === 200 && simRes.json?.defaultSkill === 'writing1', `defaultSkill phải writing1: ${JSON.stringify(simRes.json)}`);
      });
    }
  }
}
