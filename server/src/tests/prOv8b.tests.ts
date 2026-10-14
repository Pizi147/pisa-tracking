/**
 * PHÉP KIỂM PR-OV8b — quyền TVV (chủ SP 13/10): sửa mọi thông tin HV kể cả Target (có lý do) và ghi chú, Tạm dừng / Quay lại / Thôi học (+ Hoàn tác),
 * nhập kết quả thi thật; ô TVV chỉ TVV cùng chi nhánh; học thuật vẫn của GV / QL (gọi thẳng API → 403). CX như TVV mọi chi nhánh. Admin giữ như cũ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv8bTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const { can, loadPrincipal } = await import('../permissions.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const students: any = await import('../students/students.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const profile: any = await import('../students/profile.ts');
  const { lopHocCua } = await import('../classes/loTrinhTiep.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { ROLE_PERMISSIONS } = await import('../seed/data.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV8b · quyền TVV: Target, Tạm dừng / Quay lại / Thôi học, kết quả thi thật, ô TVV theo chi nhánh');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov8b.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov8b', fullName: `Thử OV8b ${seq}`, roles }).userId as number;
  };
  const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
  const idTvvKhac = tao([{ role: 'consultant', branches: ['MB'] }]);
  const idCx = tao([{ role: 'cx', branches: [] }]);
  const idAdmin = tao([{ role: 'office_admin', branches: ['CP'] }]);

  /* Em FT Cẩm Phả đang học, lộ trình đang chạy có Target; lớp có GVCN. */
  const em = one(`SELECT e.student_id id, e.class_id lop, cy.id cycleId FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
      JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active' AND cy.route IS NOT NULL
      JOIN students s ON s.id = e.student_id AND s.status = 'active'
      WHERE b.code = 'CP' AND c.is_fast_track = 1 AND c.status = 'active' AND e.status = 'active'
        AND (SELECT COUNT(*) FROM enrollments e2 WHERE e2.class_id = c.id AND e2.status = 'active') > 1
      ORDER BY e.student_id LIMIT 1`);
  const luot = one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, em?.cycleId)?.id;
  const caseId = one(`SELECT id FROM sos_cases WHERE student_id = ? ORDER BY id LIMIT 1`, em?.id)?.id
    ?? one(`SELECT id FROM sos_cases ORDER BY id LIMIT 1`)?.id;
  const V = () => ({ TVV: loadPrincipal(idTvv), TVVKhac: loadPrincipal(idTvvKhac), CX: loadPrincipal(idCx), Admin: loadPrincipal(idAdmin) });
  const hs = () => one('SELECT * FROM students WHERE id = ?', em.id);

  check('OV8b-0 · dữ liệu thử đủ (em FT CP có lộ trình, lượt, Case)', () => {
    assert(em?.id && em.cycleId && luot && caseId, JSON.stringify({ em, luot, caseId }));
  });

  check('OV8b-1 · quyền mới `student.edit_more`: TVV, CX có; Admin, GV, QL không (QL đã có quyền rộng hơn)', () => {
    assert(ROLE_PERMISSIONS.consultant.includes('student.edit_more') && ROLE_PERMISSIONS.cx.includes('student.edit_more'), 'seed TVV / CX thiếu quyền');
    for (const k of ['office_admin', 'teacher', 'manager'] as const) assert(!ROLE_PERMISSIONS[k].includes('student.edit_more'), `${k} không được có`);
    const v = V();
    assert(can(v.TVV, 'student.edit_more', { studentId: em.id }) && can(v.CX, 'student.edit_more', { studentId: em.id }), 'TVV / CX chi nhánh em phải có');
    assert(!can(v.TVVKhac, 'student.edit_more', { studentId: em.id }), 'TVV chi nhánh khác không được có');
    for (const q of ['student.edit', 'cycle.edit', 'score.edit', 'sos.edit', 'sos.report', 'plan.week', 'request.approve', 'discipline.manage']) {
      assert(!can(v.TVV, q, { studentId: em.id }) && !can(v.CX, q, { studentId: em.id }), `TVV / CX không được có ${q}`);
    }
  });

  check('OV8b-2 · Target: TVV có lý do → đổi + Hành trình trước → sau; thiếu lý do → 400; TVV chi nhánh khác → 403; CX đổi được; Admin → 403', () => {
    thu(() => {
      const v = V();
      const c0 = cycles.cycleById(em.cycleId);
      const moi = c0.target_score === 7 ? 6.5 : 7;
      assert(loi(() => cycles.reviseTarget(v.TVV, em.cycleId, { newTarget: moi, reason: '' }))?.status === 400, 'thiếu lý do phải 400');
      assert(loi(() => cycles.reviseTarget(v.TVVKhac, em.cycleId, { newTarget: moi, reason: 'x' }))?.status === 403, 'TVV chi nhánh khác phải 403');
      assert(loi(() => cycles.reviseTarget(v.Admin, em.cycleId, { newTarget: moi, reason: 'x' }))?.status === 403, 'Admin phải 403');
      cycles.reviseTarget(v.TVV, em.cycleId, { newTarget: moi, reason: 'Gia đình đổi kế hoạch' });
      assert(cycles.cycleById(em.cycleId).target_score === moi, 'TVV đổi Target không ăn');
      const j = one(`SELECT title, detail, created_by FROM journey_events WHERE student_id = ? AND event_type = 'target_change' ORDER BY id DESC LIMIT 1`, em.id);
      assert(j?.created_by === idTvv && j.detail === 'Gia đình đổi kế hoạch' && /→/.test(j.title), `Hành trình: ${JSON.stringify(j)}`);
      cycles.reviseTarget(v.CX, em.cycleId, { newTarget: c0.target_score, reason: 'CX trả lại' });
      assert(cycles.cycleById(em.cycleId).target_score === c0.target_score, 'CX đổi Target không ăn');
      /* PATCH /cycles (đường chung của QL: tuần bắt đầu, ghi chú lộ trình…) vẫn chặn — Target của TVV chỉ đi `target-revision`. */
      assert(loi(() => cycles.updateCycle(v.TVV, em.cycleId, { startWeek: '2026-01-05' }))?.status === 403, 'TVV sửa tuần bắt đầu phải 403');
    });
  });

  check('OV8b-3 · Ghi chú: TVV / CX sửa được; Admin vẫn 403 (giữ như cũ)', () => {
    thu(() => {
      const v = V();
      students.updateStudent(v.TVV, em.id, { note: 'Phụ huynh hẹn gọi lại' });
      assert(hs().note === 'Phụ huynh hẹn gọi lại', `ghi chú: ${hs().note}`);
      students.updateStudent(v.CX, em.id, { note: null });
      assert(hs().note === null, 'CX xoá ghi chú không ăn');
      assert(loi(() => students.updateStudent(v.Admin, em.id, { note: 'x' }))?.status === 403, 'Admin sửa ghi chú phải 403');
    });
  });

  check('OV8b-4 · Tạm dừng → Quay lại học → Thôi học → Hoàn tác: TVV làm được, đúng luật cũ; TVV chi nhánh khác / Admin → 403; cờ menu đúng', () => {
    thu(() => {
      const v = V();
      const homNay = demoToday();
      const q = lopHocCua(v.TVV, em.id, { class_id: em.lop }).quyen;
      assert(q.tamDung && q.quayLai && q.ketThuc && !q.luuTru && !q.hocLai && !q.chuyenLop && !q.ghiLoTrinhTiep, `cờ TVV: ${JSON.stringify(q)}`);
      const qa = lopHocCua(v.Admin, em.id, { class_id: em.lop }).quyen;
      assert(!qa.tamDung && !qa.ketThuc, `cờ Admin: ${JSON.stringify(qa)}`);
      assert(loi(() => students.setStudentStatus(v.TVVKhac, em.id, 'inactive', homNay, 'x'))?.status === 403, 'TVV chi nhánh khác phải 403');
      assert(loi(() => students.setStudentStatus(v.Admin, em.id, 'inactive', homNay, 'x'))?.status === 403, 'Admin phải 403');
      students.setStudentStatus(v.TVV, em.id, 'inactive', homNay, 'Em ốm');
      assert(hs().status === 'inactive', 'Tạm dừng không ăn');
      assert(one(`SELECT status FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1`, em.id).status === 'paused', 'ghi danh phải paused');
      students.setStudentStatus(v.TVV, em.id, 'active', homNay);
      assert(hs().status === 'active', 'Quay lại học không ăn');
      students.setStudentStatus(v.TVV, em.id, 'finished', homNay, 'Gia đình chuyển nhà');
      assert(hs().status === 'finished' && cycles.cycleById(em.cycleId).status === 'abandoned', 'Thôi học phải đóng lộ trình');
      const r = hangLoat.chay(v.TVV, { viec: 'hoan-tac-ket-thuc', studentIds: [em.id] });
      assert(r.ok.includes(em.id) && !r.failed.length, `Hoàn tác: ${JSON.stringify(r)}`);
      assert(hs().status === 'active' && cycles.cycleById(em.cycleId).status === 'active', 'Hoàn tác phải mở lại lộ trình');
      /* Việc khác của hàng loạt vẫn chỉ QL. */
      for (const viec of ['ket-thuc', 'luu-tru', 'hoc-lai'] as const) {
        assert(loi(() => hangLoat.chay(v.TVV, { viec, studentIds: [em.id], lyDo: 'x' }))?.status === 403, `TVV hàng loạt ${viec} phải 403`);
      }
      assert(loi(() => hangLoat.chay(v.TVVKhac, { viec: 'hoan-tac-ket-thuc', studentIds: [em.id] }))?.status === 403, 'Hoàn tác chi nhánh khác phải 403');
      assert(loi(() => students.archiveStudent(v.TVV, em.id))?.status === 403, 'TVV lưu trữ phải 403');
    });
  });

  check('OV8b-5 · Thôi học em CUỐI lớp, lớp đã đóng → TVV Hoàn tác → lớp mở lại (không đòi quyền lớp)', () => {
    thu(() => {
      const v = V();
      const homNay = demoToday();
      for (const r of all(`SELECT student_id id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id != ?`, em.lop, em.id)) {
        students.setStudentStatus(P.admin, r.id, 'finished', homNay, 'dọn lớp thử');
      }
      students.setStudentStatus(v.TVV, em.id, 'finished', homNay, 'Thôi');
      /* `dongLopNeuHet` chỉ đóng lớp đã hết chương trình — giả lập đúng kết quả đó (lớp đóng, không còn em học). */
      conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(homNay, em.lop);
      const r = hangLoat.chay(v.TVV, { viec: 'hoan-tac-ket-thuc', studentIds: [em.id] });
      assert(r.ok.includes(em.id), `Hoàn tác: ${JSON.stringify(r)}`);
      assert(one('SELECT status FROM classes WHERE id = ?', em.lop).status === 'active', 'lớp phải mở lại');
    });
  });

  check('OV8b-6 · Kết quả thi thật: TVV / CX nhập được (L R W S, ngày thi, Không thi); TVV chi nhánh khác / Admin → 403', () => {
    thu(() => {
      const v = V();
      const ngay = demoToday();
      assert(thiThat.coTheNhapThiThat(v.TVV, { id: em.cycleId, student_id: em.id }), 'coTheNhapThiThat phải nhận TVV');
      assert(loi(() => thiThat.datKetQuaThiThat(v.TVVKhac, em.cycleId, { ngayThi: ngay, l: 6, r: 6, w: 6, s: 6 }))?.status === 403, 'TVV chi nhánh khác phải 403');
      assert(loi(() => thiThat.datKetQuaThiThat(v.Admin, em.cycleId, { ngayThi: ngay, l: 6, r: 6, w: 6, s: 6 }))?.status === 403, 'Admin phải 403');
      thiThat.datKetQuaThiThat(v.TVV, em.cycleId, { ngayThi: ngay, l: 6, r: 6.5, w: 5.5, s: 6 });
      const c = cycles.cycleById(em.cycleId);
      assert(c.thi_that_l === 6 && c.thi_that_r === 6.5 && c.thi_that_ngay === ngay, `thi thật: ${JSON.stringify([c.thi_that_l, c.thi_that_r, c.thi_that_ngay])}`);
      thiThat.datKetQuaThiThat(v.CX, em.cycleId, { khongThi: true });
      assert(!!cycles.cycleById(em.cycleId).thi_that_khong_thi, 'CX Không thi không ăn');
    });
  });

  check('OV8b-7 · Ô TVV: chỉ TVV cùng chi nhánh của em; gán TVV khác chi nhánh → 400 (câu rõ); TVV cũ khác chi nhánh gửi lại không chặn', () => {
    thu(() => {
      const v = V();
      const ds = students.dsTvv(em.id) as { id: number }[];
      assert(ds.some((x) => x.id === idTvv) && !ds.some((x) => x.id === idTvvKhac), `dsTvv: ${JSON.stringify(ds)}`);
      const e = loi(() => students.updateStudent(v.TVV, em.id, { consultantUserId: idTvvKhac }));
      assert(e?.status === 400 && /^TVV:.*chi nhánh/.test(e.message), `khác chi nhánh: ${e?.status} ${e?.message}`);
      assert(loi(() => students.updateStudent(P.admin, em.id, { consultantUserId: idTvvKhac }))?.status === 400, 'Quản trị cũng không gán khác chi nhánh');
      students.updateStudent(v.TVV, em.id, { consultantUserId: idTvv });
      assert(hs().consultant_user_id === idTvv, 'gán cùng chi nhánh không ăn');
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvvKhac, em.id);
      students.updateStudent(v.TVV, em.id, { consultantUserId: idTvvKhac, fullName: hs().full_name });
      assert(hs().consultant_user_id === idTvvKhac, 'TVV cũ gửi lại phải giữ');
    });
  });

  check('OV8b-8 · hồ sơ HV: viewer TVV có coTheSuaThem (Target thẳng, Ghi chú, Kết quả thi thật); Admin không', () => {
    const v = V();
    const a = profile.studentProfile(v.TVV, em.id).viewer;
    assert(a.coTheSuaThem === true && a.canEdit === false && a.canEditCycle === false, `TVV: ${JSON.stringify(a)}`);
    assert(profile.studentProfile(v.Admin, em.id).viewer.coTheSuaThem === false, 'Admin không có coTheSuaThem');
  });

  await checkAsync('OV8b-9 · migrate prOv8b: DB cũ chưa có quyền → TVV, CX có; chạy lần hai không đổi gì; vai khác không nới', async () => {
    const { migratePrOv8b } = await import('../migrate/prOv8b.ts');
    thu(() => {
      const pid = one(`SELECT id FROM permissions WHERE key = 'student.edit_more'`)?.id;
      if (pid) { conn.prepare('DELETE FROM role_permissions WHERE permission_id = ?').run(pid); conn.prepare('DELETE FROM permissions WHERE id = ?').run(pid); }
      const lan1: string[] = [];
      migratePrOv8b(conn, lan1);
      assert(lan1.length === 1, `lần 1: ${lan1.join(' | ')}`);
      const vai = all(`SELECT r.key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE p.key = 'student.edit_more'`)
        .map((x) => x.key).sort().join(',');
      assert(vai === 'consultant,cx', `vai có quyền: ${vai}`);
      const lan2: string[] = [];
      migratePrOv8b(conn, lan2);
      assert(!lan2.length, `lần 2 vẫn đổi: ${lan2.join(' | ')}`);
    });
  });

  // ---------------------------------------------------------------- HTTP thật: mỗi đường học thuật TVV gọi thẳng → 403
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }),
    });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };

  try {
    await checkAsync('OV8b-10 · TVV / CX gọi thẳng API học thuật → 403 từng đường (điểm, Case / PA, Ý thức, Lộ trình tiếp theo, KQĐR, lịch Test, Học lại, Lưu trữ, Chuyển lớp, bước tiếp sau thi)', async () => {
      const tv = await vao(idTvv); const cx = await vao(idCx);
      const duong: [string, string, string, unknown?][] = [
        ['nhập điểm', 'PUT', `/attempts/${luot}/scores/listening`, { rawScore: 30, rawTotal: 40 }],
        ['dời tuần lượt', 'POST', `/attempts/${luot}/week`, { periodId: 1 }],
        ['huỷ lượt', 'POST', `/attempts/${luot}/cancel`, { reason: 'x' }],
        ['báo Case', 'POST', '/cases/report', { studentId: em.id, skill: 'L', note: 'x' }],
        ['xác nhận Case', 'POST', `/cases/${caseId}/xac-nhan`, {}],
        ['thêm PA', 'POST', `/cases/${caseId}/interventions`, { kind: 'tutor', note: 'x' }],
        ['kết quả Case', 'POST', `/cases/${caseId}/outcome`, { outcome: 'resolved' }],
        ['ghi Ý thức', 'POST', `/students/${em.id}/y-thuc/ghi-nhan`, { nhom: 'chuyen_can', ngay: '2026-10-12' }],
        ['xử lý Ý thức', 'POST', `/students/${em.id}/y-thuc/xu-ly`, {}],
        ['Lộ trình tiếp theo', 'PUT', `/students/${em.id}/lo-trinh-tiep`, { huong: 'len_lop' }],
        ['KQĐR', 'PUT', `/students/${em.id}/ket-qua-de-xuat`, { ketQua: 'dat' }],
        ['kết luận FT', 'PUT', `/students/${em.id}/ket-luan-ft`, { ketLuan: 'dat' }],
        ['tuần bắt đầu / lộ trình', 'PATCH', `/cycles/${em.cycleId}`, { startWeek: '2026-10-05' }],
        ['Học lại', 'POST', `/students/${em.id}/hoc-lai`, {}],
        ['Lưu trữ', 'POST', `/students/${em.id}/archive`],
        ['Chuyển lớp', 'POST', `/students/${em.id}/transfer`, { toClassId: em.lop, lyDo: 'thử' }],
        ['Kết thúc hàng loạt', 'POST', '/hang-loat-hoc-vien', { viec: 'ket-thuc', studentIds: [em.id], lyDo: 'x' }],
        /* OV-8a: bước tiếp sau thi thật chỉ QL — OV-12a (chủ SP 14/10): TVV của chi nhánh chọn được (phép kiểm OV12a-6), CX vẫn 403. */
        ['chọn bước tiếp sau thi', 'POST', `/cycles/${em.cycleId}/buoc-tiep`, { chon: 'ket_thuc' }],
        ['bỏ chọn bước tiếp', 'DELETE', `/cycles/${em.cycleId}/buoc-tiep`],
      ];
      const sai: string[] = [];
      for (const [ten, ck] of [['TVV', tv], ['CX', cx]] as const) {
        for (const [viec, m, url, body] of duong) {
          if (ten === 'TVV' && url.endsWith('/buoc-tiep')) continue;
          const r = await goi(m, url, ck, body);
          if (r.status !== 403) sai.push(`${ten} ${viec}: ${r.status} ${r.json?.error ?? ''}`);
        }
      }
      assert(!sai.length, sai.join(' | '));
    });

    await checkAsync('OV8b-11 · TVV qua HTTP: đổi Target có lý do, sửa ghi chú → 200', async () => {
      const tv = await vao(idTvv);
      const c0 = cycles.cycleById(em.cycleId);
      const s0 = hs();
      const cu = c0.khong_cam_ket ? 'KCK' : c0.target_score;
      try {
        const moi = c0.target_score === 7 ? 6.5 : 7;
        let r = await goi('POST', `/cycles/${em.cycleId}/target-revision`, tv, { newTarget: moi, reason: 'Thử HTTP' });
        assert(r.status === 200 && cycles.cycleById(em.cycleId).target_score === moi, `Target: ${r.status} ${r.json?.error}`);
        r = await goi('PATCH', `/students/${em.id}`, tv, { note: 'Thử HTTP' });
        assert(r.status === 200 && hs().note === 'Thử HTTP', `ghi chú: ${r.status} ${r.json?.error}`);
      } finally {
        /* HTTP không bọc được trong ROLLBACK — trả Target (cùng đường) và ghi chú về như cũ. */
        await goi('POST', `/cycles/${em.cycleId}/target-revision`, tv, { newTarget: cu, reason: 'Trả lại sau phép thử' });
        conn.prepare('UPDATE students SET note = ? WHERE id = ?').run(s0.note, em.id);
        xoaNho();
      }
    });
  } finally {
    may.close();
  }
}
