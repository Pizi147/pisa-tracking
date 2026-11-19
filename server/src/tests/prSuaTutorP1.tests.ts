/**
 * PHÉP KIỂM S1 SUA-TUTOR-P1 (rà sau đợt Tutor #1872 — `docs/superpowers/specs/2026-11-19-ra-sau-tutor/bao-cao.md` mục 1a + 2; chủ SP 20/11 "Sửa S1").
 *   T1 lưới không ghi đè nháp Tutor nhiều dòng / có 3 nút / đánh giá (web `nhapGonLuoi` + máy chủ chặn `tuLuoi`) · T2 lưới nhận cờ `lanCuoi` từ máy chủ ·
 *   T3 dòng danh bạ của GV đọc tên / kỹ năng / nơi dạy từ tài khoản · C4 trang Tutor theo ngày nghiệp vụ (`observed_on`) ·
 *   P2 Nội dung Tutor ≥ 8 ký tự ở máy chủ · điền sẵn tutor kỳ trước cùng `laNguoiHopLe` · nhật ký "a / b buổi" · ô "Tổng số buổi" PA quy chế.
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */
export async function runPrSuaTutorP1Tests(t: any) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const luoi: any = await import('../cases/luoiKetQua.ts');
  const tr: any = await import('../tutors/trang.ts');
  const chonSvc: any = await import('../tutors/chon.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho, soCauSql, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nS1 SUA-TUTOR-P1 · lưới không ghi đè nháp Tutor · lanCuoi · danh bạ GV theo tài khoản · ngày nghiệp vụ · P2');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const GV = P.lrTeacher;
  const HT = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id);
  const LOP = t.classId('MB FT 101');
  /* GV khác làm tutor (TU4): GV đang làm việc, có vai GV, không phải người ghi. */
  const GV2 = one(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id
    WHERE r.key = 'teacher' AND u.status = 'active' AND u.id <> ? ORDER BY u.id LIMIT 1`, GV.userId).id as number;
  let seq = 0;
  const pa = (o: { soBuoi?: number | null; sau?: number } = {}) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(run(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`, `PISA-S1-${seq}`, `Hoc vien S1 ${seq}`, `hoc vien s1 ${seq}`, LOP, now).lastInsertRowid);
    run(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`, sid, LOP, now);
    run(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`, sid, now);
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `s1-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { kind: 'tutor', description: 'Tutor Listening 1-1', soBuoi: o.soBuoi ?? null, status: 'started', startedDate: addDays(TODAY, -7) });
    const ivId = Math.max(...r.interventions.map((i: any) => i.id)) as number;
    run('UPDATE case_interventions SET action_due = ? WHERE id = ?', addDays(TODAY, o.sau ?? 1), ivId);
    xoaNho();
    return { sid, caseId, ivId };
  };
  const ghiKq = (id: number, x: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => cases.updateResult(GV, id, {
    decision: 'keep', outcome: 'partial', note: 'Hai buổi tutor, đúng thêm 3 câu', observedOn: TODAY, soBuoi: 2, buoiDuKien: 3,
    buoi: [{ tutor: 'Cô Hà gõ tay', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2 }], ...x,
  }, opts);

  check('S1 T1 · nhapGonLuoi: ≤ 1 dòng Tutor, không 3 nút / đánh giá / nhận xét tutor / hình thức → lưới ghi được; còn lại → Mở đầy đủ', () => {
    const b = { tutor: 'Cô Hà', nhanXet: 'Nghe Part 1 đủ ý' };
    assert(d.nhapGonLuoi(null) && d.nhapGonLuoi([]) && d.nhapGonLuoi([b]) && d.nhapGonLuoi([{ ...b, soBuoi: 2, tutorId: 3, chuanBi: null }]), 'gọn');
    assert(!d.nhapGonLuoi([b, { ...b, tutor: 'Thầy Nam' }]), '2 dòng');
    for (const k of ['chuanBi', 'taiLieu', 'feedbackGv']) assert(!d.nhapGonLuoi([{ ...b, [k]: false }]), `3 nút ${k}`);
    assert(!d.nhapGonLuoi([{ ...b, danhGia: 4 }]) && !d.nhapGonLuoi([{ ...b, nhanXetTutor: 'Tutor đúng giờ' }]) && !d.nhapGonLuoi([{ ...b, hinhThuc: 'online' }]), 'đánh giá thêm');
  });

  check('S1 T1 · máy chủ: lưới (`tuLuoi`) không ghi đè nháp Tutor 2 dòng — lưu nháp / lưu chốt 409 `moDay`, nháp giữ nguyên; form đầy đủ vẫn lưu', () => thu(() => {
    const { ivId } = pa();
    const hai = [{ tutor: 'Cô Hà', nhanXet: 'Nghe Part 1 đủ ý', soBuoi: 1 }, { tutor: 'Thầy Nam', nhanXet: 'Nghe Part 2 bảng', soBuoi: 1, chuanBi: true }];
    const r = cases.luuNhapKetQua(GV, ivId, { outcome: 'partial', note: '', soBuoi: 2, buoiDuKien: 3, buoi: hai });
    const coSo = r.nhap.luc;
    const goc = one('SELECT nhap_ket_qua AS n FROM case_interventions WHERE id = ?', ivId).n;
    const e1 = loiCua(() => cases.luuNhapKetQua(GV, ivId, { outcome: 'partial', note: '', soBuoi: 2, buoiDuKien: 3, buoi: [hai[0]], ky: 1, coSo, tuLuoi: true }));
    assert(e1?.status === 409 && e1.details?.moDay === true && e1.details?.nhap?.buoi?.length === 2, `nháp từ lưới: ${e1?.status} ${JSON.stringify(e1?.details)}`);
    const e2 = loiCua(() => ghiKq(ivId, { ky: 1, nhapCoSo: coSo, tuLuoi: true, buoi: [{ tutor: 'Cô Hà', nhanXet: 'Nghe Part 1 đủ ý', soBuoi: 2 }] }));
    assert(e2?.status === 409 && e2.details?.moDay === true, `chốt từ lưới: ${e2?.status} ${e2?.message}`);
    assert(one('SELECT nhap_ket_qua AS n FROM case_interventions WHERE id = ?', ivId).n === goc, 'nháp không đổi');
    assert(!one('SELECT 1 AS x FROM case_followups WHERE intervention_id = ?', ivId), 'không có lần ghi');
    /* Nháp gọn: lưới ghi được như cũ. Form đầy đủ (không `tuLuoi`) ghi đè được nháp 2 dòng. */
    const { ivId: gon } = pa();
    const r2 = cases.luuNhapKetQua(GV, gon, { outcome: 'partial', note: '', soBuoi: 1, buoiDuKien: 3, buoi: [hai[0]] });
    assert(!loiCua(() => cases.luuNhapKetQua(GV, gon, { outcome: 'improved', note: '', soBuoi: 1, buoiDuKien: 3, buoi: [hai[0]], ky: 1, coSo: r2.nhap.luc, tuLuoi: true })), 'nháp gọn: lưới lưu được');
    assert(!loiCua(() => ghiKq(ivId, { ky: 1, nhapCoSo: coSo, buoi: hai.map((b) => ({ ...b, soBuoi: 1 })) })), 'form đầy đủ chốt được');
  }));

  check('S1 T2 · lưới nhận cờ `lanCuoi` (cùng `laLanGhiCuoi` máy chủ dùng khi ghi): PA quy chế qua mốc → true; PA thường → false', () => thu(() => {
    const { ivId: cuoi } = pa();
    const { ivId: thuong } = pa();
    run(`UPDATE case_interventions SET preset = 1, confirmed_at = ?, moc_quy_che = 'until_next_mt', followup_due = ? WHERE id = ?`, `${TODAY}T01:00:00.000Z`, addDays(TODAY, -1), cuoi);
    xoaNho();
    const ds = luoi.luoiKetQua(GV, [cuoi, thuong]).ds as any[];
    const x = (id: number) => ds.find((r) => r.id === id);
    assert(x(cuoi).lanCuoi === true && x(thuong).lanCuoi === false, JSON.stringify(ds.map((r) => [r.id, r.lanCuoi])));
  }));

  check('S1 T3 · dòng danh bạ của GV đọc tên / kỹ năng / nơi dạy từ TÀI KHOẢN: bảng + panel trang Tutor, file xuất, buổi mới, điền sẵn kỳ sau; số câu không tăng', () => thu(() => {
    const { ivId } = pa();
    ghiKq(ivId, { buoi: [{ gvId: GV2, tutor: 'x', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2 }] });
    const tid = one('SELECT id FROM tutors WHERE user_id = ?', GV2).id as number;
    const cnMoi = one(`SELECT id FROM branches WHERE id NOT IN (SELECT branch_id FROM user_roles WHERE user_id = ? AND branch_id IS NOT NULL) ORDER BY id LIMIT 1`, GV2).id as number;
    run(`UPDATE users SET full_name = 'Tên GV Đã Đổi' WHERE id = ?`, GV2);
    run(`DELETE FROM user_skills WHERE user_id = ?`, GV2);
    run(`INSERT INTO user_skills (user_id, skill) VALUES (?, 'speaking')`, GV2);
    run(`UPDATE user_roles SET branch_id = ? WHERE user_id = ? AND branch_id IS NOT NULL`, cnMoi, GV2);
    xoaNho();
    const K = { tu: addDays(TODAY, -30), den: TODAY };
    const dong = tr.bangTutor(HT, K).dong.find((r: any) => r.id === tid);
    assert(dong && dong.ten === 'Tên GV Đã Đổi' && dong.kyNang.join(',') === 'S' && typeof dong.noiDay === 'object' && dong.noiDay?.id === cnMoi, `bảng: ${JSON.stringify(dong)}`);
    xoaNho();
    const panel = tr.panelTutor(HT, tid, K).tutor;
    assert(panel.ten === 'Tên GV Đã Đổi', `panel: ${panel.ten}`);
    xoaNho();
    const x = tr.xuatSoBuoi(HT, TODAY.slice(0, 7), TODAY.slice(0, 7));
    assert(x.sheets[0].aoa.some((r: any[]) => r[0] === 'Tên GV Đã Đổi'), `xuất: ${JSON.stringify(x.sheets[0].aoa.map((r: any[]) => r[0]))}`);
    xoaNho();
    const l = luoi.luoiKetQua(GV, [ivId]).ds[0];
    assert(l.tutorTruoc?.ten === 'Tên GV Đã Đổi', `lưới điền sẵn: ${JSON.stringify(l.tutorTruoc)}`);
    xoaNho();
    const c = chonSvc.chonTutor(GV, { paId: ivId });
    assert(c.dienSan?.ten === 'Tên GV Đã Đổi', `ô chọn điền sẵn: ${JSON.stringify(c.dienSan)}`);
    /* Buổi mới chọn dòng danh bạ (tutorId) hoặc GV (gvId): tên lưu = tên tài khoản hiện tại. */
    run('UPDATE case_interventions SET action_due = ? WHERE id = ?', addDays(TODAY, 1), ivId);
    ghiKq(ivId, { buoi: [{ tutorId: tid, tutor: 'tên cũ web gửi', nhanXet: 'Nghe Part 4 bài giảng, đúng 6/10', soBuoi: 2 }] });
    assert(one('SELECT b.tutor_ten FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id WHERE f.intervention_id = ? ORDER BY f.id DESC LIMIT 1', ivId).tutor_ten === 'Tên GV Đã Đổi', 'buổi mới (tutorId)');
    /* Số câu đường bảng: không N+1 theo số dòng GV. */
    xoaNho(); const s0 = soCauSql(); trongBoNho(() => tr.bangTutor(HT, K)); const cau = soCauSql() - s0;
    assert(cau <= 8, `bảng Tutor ${cau} câu`);
  }));

  check('S1 C4 · buổi vừa ghi nằm trong khoảng tuần theo NGÀY NGHIỆP VỤ (ngày demo), không theo đồng hồ thật', () => thu(() => {
    const { ivId } = pa();
    ghiKq(ivId, { buoi: [{ tutor: 'Cô Hà gõ tay C4', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2 }] });
    const lan = one(`SELECT id FROM tutors WHERE ten = 'Nguyễn Thu Lan'`).id as number;
    run('UPDATE case_interventions SET action_due = ? WHERE id = ?', addDays(TODAY, 1), ivId);
    ghiKq(ivId, { buoi: [{ tutorId: lan, tutor: 'Nguyễn Thu Lan', nhanXet: 'Nghe Part 4 bài giảng, đúng 6/10', soBuoi: 2 }] });
    xoaNho();
    const K = { tu: addDays(TODAY, -6), den: TODAY };
    const dong = tr.bangTutor(HT, K).dong.find((r: any) => r.id === lan);
    const truoc = tr.bangTutor(HT, { tu: addDays(TODAY, -400), den: addDays(TODAY, -7) }).dong.find((r: any) => r.id === lan);
    const tong = tr.bangTutor(HT, { tu: addDays(TODAY, -400), den: addDays(TODAY, 400) }).dong.find((r: any) => r.id === lan);
    assert(dong && tong && dong.buoi >= 2 && (truoc?.buoi ?? 0) + dong.buoi <= tong.buoi, `khoảng tuần demo: ${dong?.buoi} · trước ${truoc?.buoi} · tổng ${tong?.buoi}`);
    const p = tr.panelTutor(HT, lan, K);
    assert(p.buoi.some((b: any) => b.ngay === TODAY), `panel ngày buổi: ${JSON.stringify(p.buoi.map((b: any) => b.ngay))}`);
    const x = tr.xuatSoBuoi(HT, TODAY.slice(0, 7), TODAY.slice(0, 7));
    assert(x.sheets[0].aoa.some((r: any[]) => r[0] === 'Cô Hà gõ tay C4 (gõ tay)' && r[3] === 2), `xuất theo tháng demo: ${JSON.stringify(x.sheets[0].aoa)}`);
  }));

  check('S1 P2-14 · máy chủ: Nội dung dòng Tutor ≥ 8 ký tự cho lần ghi MỚI; sửa lần ghi cũ giữ chữ cũ ngắn không bị chặn', () => thu(() => {
    const { ivId } = pa();
    const e = loiCua(() => ghiKq(ivId, { buoi: [{ tutor: 'Cô Hà', nhanXet: 'ngắn', soBuoi: 2 }] }));
    assert(e?.status === 400, `ghi mới chữ ngắn: ${e?.status} ${e?.message}`);
    /* Lần ghi cũ (trước luật) có chữ ngắn — sửa ô khác vẫn được. */
    ghiKq(ivId);
    const f = one('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId).id as number;
    run(`UPDATE case_followup_buoi SET nhan_xet = 'ngắn' WHERE followup_id = ?`, f);
    xoaNho();
    const e2 = loiCua(() => cases.suaKetQua(GV, f, { decision: 'keep', outcome: 'improved', note: 'Sửa mức, giữ chữ cũ', observedOn: TODAY, soBuoi: 2, buoiDuKien: 3,
      buoi: [{ tutor: 'Cô Hà gõ tay', nhanXet: 'ngắn', soBuoi: 2 }] }));
    assert(!e2, `sửa lần cũ: ${e2?.message}`);
    const e3 = loiCua(() => cases.suaKetQua(GV, f, { decision: 'keep', outcome: 'improved', note: 'Sửa mức, giữ chữ cũ', observedOn: TODAY, soBuoi: 2, buoiDuKien: 3,
      buoi: [{ tutor: 'Cô Hà gõ tay', nhanXet: 'mới', soBuoi: 2 }] }));
    assert(e3?.status === 400, `sửa thành chữ ngắn mới: ${e3?.status}`);
  }));

  check('S1 P2-15 · điền sẵn tutor kỳ trước dùng cùng `laNguoiHopLe`: GV kỳ trước mất vai GV → lưới + ô chọn không điền sẵn', () => thu(() => {
    const { ivId } = pa();
    ghiKq(ivId, { buoi: [{ gvId: GV2, tutor: 'x', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2 }] });
    xoaNho();
    assert(luoi.luoiKetQua(GV, [ivId]).ds[0].tutorTruoc?.gvId === GV2, 'còn vai: điền sẵn');
    run(`UPDATE user_roles SET status = 'inactive' WHERE user_id = ? AND role_id IN (SELECT id FROM roles WHERE key = 'teacher')`, GV2);
    xoaNho();
    assert(luoi.luoiKetQua(GV, [ivId]).ds[0].tutorTruoc === null, 'mất vai GV: lưới không điền sẵn');
    xoaNho();
    assert(chonSvc.chonTutor(GV, { paId: ivId }).dienSan === null, 'mất vai GV: ô chọn không điền sẵn');
    xoaNho();
    const s0 = soCauSql(); trongBoNho(() => luoi.luoiKetQua(GV, [ivId])); const cau = soCauSql() - s0;
    assert(cau <= TRAN_GHI_LO.luoiKetQua, `${cau} câu > ${TRAN_GHI_LO.luoiKetQua}`);
  }));

  check('S1 P2-16/17 · nhật ký PA ghi "dạy a / b buổi"; PA Tutor quy chế SOS không có ô "Tổng số buổi" (giaTriCuaPa.quyCheSos)', () => {
    const dong = d.nhatKyPa({ id: 1, kind: 'tutor', performer: null, soBuoi: null, createdAt: '2026-09-01T03:00:00.000Z', startedDate: '2026-09-01' },
      [{ id: 9, interventionId: 1, observedOn: '2026-09-14', soBuoi: 2, buoiDuKien: 3 }, { id: 10, interventionId: 1, observedOn: '2026-09-15', soBuoi: 1 }], '2026-09-15');
    assert(dong.some((x: any) => x.chu.includes('dạy 2 / 3 buổi')) && dong.some((x: any) => x.chu.includes('dạy 1 buổi')), JSON.stringify(dong.map((x: any) => x.chu)));
    assert(d.giaTriCuaPa({ kind: 'tutor', soBuoi: 2, mocQuyChe: 'until_next_mt' }).quyCheSos === true, 'quy chế SOS');
    assert(!d.giaTriCuaPa({ kind: 'tutor', soBuoi: 10, mocQuyChe: null }).quyCheSos, 'PA thường');
  });
}
