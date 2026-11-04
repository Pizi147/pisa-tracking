/** PHÉP KIỂM PR-LUI-a2 — Case + Chờ duyệt: Người phụ trách, Mở lại Case, Từ chối nhiều, Huỷ quyết định, Sửa / Xoá Case, Xoá PA. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuiA2Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { can } = await import('../permissions.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const sosAutoMod: any = await import('../cases/sosAuto.ts');
  const { tx } = await import('../db.ts');
  const effMod: any = await import('../cases/effectiveness.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const att: any = await import('../platform/attachments.ts');
  console.log('\nPR-LUI-a2 · Case + Chờ duyệt');

  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Mọi thay đổi trong phép kiểm cuộn lại — không để dữ liệu cho phép kiểm sau. */
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const chuLoi = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };

  const LOP = classId('MB FT 101');
  const mb = (mot(`SELECT id FROM branches WHERE code = 'MB'`)).id as number;
  let so = 0;
  let soCase = 0;
  /** Một em mới ở MB FT 101 (một ghi danh, một lộ trình) — không đụng em của bộ demo. */
  const moiEm = (): number => {
    so += 1;
    const tag = `LUIa2-${so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const taoCase = (sid: number, gv = P.lrTeacher, topic = 'listening') => cases.reportIssue(gv, {
    studentId: sid, topic, title: `Nghe sót số liệu ${so}`, summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
    primaryCode: d.issuesForTopic(topic)[0].code, idempotencyKey: `luia2-case-${++soCase}`,
  }).id as number;
  const themPa = (caseId: number, o: Record<string, unknown> = {}) => {
    const r = cases.recordIntervention(P.lrTeacher, caseId, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY, ...o,
    });
    return Math.max(...r.interventions.map((i: any) => i.id)) as number;
  };
  const deXuat = (caseId: number) => themPa(caseId, { kind: 'extra_support', description: 'Học kèm 1-1 với Tutor 2 buổi/tuần', status: 'planned', startedDate: undefined });
  const ketQua = (ivId: number, o: Record<string, unknown> = {}) =>
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Đúng 15/20 câu điền số tuần này', soBuoi: 0, ...o });   // OV-12h: PA Tutor luôn có Số buổi kỳ này (0 = không dòng); loại khác bỏ qua
  /* PR-PA (§8): Người phụ trách → Người dạy tuần này (body `nguoiDay`); Tự học không có ô người → PA Tutor (không Số buổi: không bắt người). */
  const TUTOR = { kind: 'tutor', description: 'Tutor Listening — nghe chép hai buổi mỗi tuần' };
  const dongCase = (caseId: number, ivId: number) => {
    ketQua(ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    cases.closeCaseOutcome(P.mbManager, caseId, { outcome: 'much_better', note: 'MT3 Listening lên 6.0, không còn sai dạng điền số' });
  };
  const QL = P.mbManager;
  const fu = (ivId: number) => mot('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId);

  // ---------------------------------------------------------------- a2-1 · Người phụ trách
  check('LUIa2-1 · updateResult: Người dạy tuần này tài khoản / tên ngoài; PA không Số buổi không bắt (NULL); tài khoản nghỉ → 400 (PR-PA: bắt ở PA có Số buổi — prPa PA4)', () => thu(() => {
    const ivId = themPa(taoCase(moiEm()), TUTOR);
    ketQua(ivId, { nguoiDay: { performerUserId: P.coreTeacher.userId } });
    assert(fu(ivId).phu_trach_user_id === P.coreTeacher.userId && fu(ivId).phu_trach_ten === null, JSON.stringify(fu(ivId)));
    ketQua(ivId, { nguoiDay: { performerName: 'Tutor Minh' } });
    assert(fu(ivId).phu_trach_ten === 'Tutor Minh' && fu(ivId).phu_trach_user_id === null, 'tên ngoài');
    ketQua(ivId);
    assert(fu(ivId).phu_trach_user_id === null && fu(ivId).phu_trach_ten === null, 'không gửi');
    const n = hang('SELECT id FROM case_followups WHERE intervention_id = ?', ivId).length;
    conn.prepare(`UPDATE users SET status = 'inactive' WHERE id = ?`).run(P.sTeacher.userId);
    assertThrows(() => ketQua(ivId, { nguoiDay: { performerUserId: P.sTeacher.userId } }), /^Người dạy tuần này phải là nhân viên đang làm việc/, 'tài khoản nghỉ');
    assert(hang('SELECT id FROM case_followups WHERE intervention_id = ?', ivId).length === n, 'lỗi mà vẫn ghi');
  }));

  check('LUIa2-2 · caseDetail trả nguoiDay ở lịch sử + dòng PA; Vấn đề còn tồn / Ghi chú 301 ký tự → 400', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = themPa(caseId, TUTOR);
    ketQua(ivId, { nguoiDay: { performerUserId: P.coreTeacher.userId } });
    const ten = mot('SELECT full_name FROM users WHERE id = ?', P.coreTeacher.userId).full_name;
    const ct = cases.caseDetail(QL, caseId);
    assert(ct.followups[0].nguoiDay === ten, JSON.stringify(ct.followups[0]));
    assertThrows(() => ketQua(ivId, { remainingIssue: 'x'.repeat(301) }), /^Vấn đề còn tồn \/ Ghi chú tối đa 300 ký tự\.$/, '301 ký tự');
    assert(d.GOI_Y_KET_QUA_PA === 'Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể', d.GOI_Y_KET_QUA_PA);
  }));

  const { migratePrLuiA2 } = await import('../migrate/prLuiA2.ts');
  check('LUIa2-3 · migrate prLuiA2 chạy lặp được: lần hai không báo gì, hai cột có', () => {
    const lan: string[] = [];
    migratePrLuiA2(conn, lan);
    assert(lan.length === 0, lan.join(' | '));
    const cot = hang("SELECT name FROM pragma_table_info('case_followups')").map((c) => c.name);
    assert(cot.includes('phu_trach_user_id') && cot.includes('phu_trach_ten'), cot.join(','));
  });

  // ---------------------------------------------------------------- a2-2 · người tạo Case đính kèm được
  check('LUIa2-4 · GVCN tạo Case môn không dạy → đính kèm được (người tạo); GV khác không dạy môn, không phải người tạo → 403', () => thu(() => {
    const sid = moiEm();
    const mon = ['listening', 'reading', 'speaking', 'writing1', 'writing2']
      .find((k) => !can(P.coreTeacher, 'sos.edit', { classId: LOP, studentId: sid, skill: k }) && !can(P.sTeacher, 'sos.edit', { classId: LOP, studentId: sid, skill: k }))!;
    assert(!!mon, 'không tìm được môn GVCN và GV Speaking đều không dạy');
    const caseId = taoCase(sid, P.coreTeacher, mon);
    const r = att.addLink(P.coreTeacher, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/bai-nghe' });
    assert(r.id && r.ownerId === caseId, JSON.stringify(r));
    assert(maLoi(() => att.addLink(P.sTeacher, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/x' })) === 403, 'GV khác');
  }));

  await checkAsync('LUIa2-4b · rà #229: người tạo Case (chỉ nhờ là người tạo) gỡ được tệp MÌNH tải, KHÔNG gỡ tệp của QL', async () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      const sid = moiEm();
      const mon = ['listening', 'reading', 'speaking', 'writing1', 'writing2'].find((k) => !can(P.coreTeacher, 'sos.edit', { classId: LOP, studentId: sid, skill: k }))!;
      const caseId = taoCase(sid, P.coreTeacher, mon);
      const cuaToi = att.addLink(P.coreTeacher, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/cua-toi' });
      const cuaQl = att.addLink(QL, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/cua-ql' });
      let ma: unknown = 'không ném';
      try { await att.removeAttachment(P.coreTeacher, cuaQl.id); } catch (e: any) { ma = e?.status; }
      assert(ma === 403, `gỡ tệp của QL: ${String(ma)}`);
      assert(!!mot('SELECT 1 FROM attachments WHERE id = ?', cuaQl.id), 'tệp QL bị gỡ');
      await att.removeAttachment(P.coreTeacher, cuaToi.id);
      assert(!mot('SELECT 1 FROM attachments WHERE id = ?', cuaToi.id), 'không gỡ được tệp của mình');
      await att.removeAttachment(QL, cuaQl.id);   // QL vẫn gỡ được mọi tệp
    } finally { conn.exec('ROLLBACK'); }
  });

  // ---------------------------------------------------------------- a2-3 · Mở lại Case
  check('LUIa2-5 · Mở lại: status về đang theo dõi, kết luận xoá, khoá giữ, PA vẫn khép; lịch sử + mốc + Hành trình + nhật ký; đóng–mở–đóng chạy', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = themPa(caseId);
    dongCase(caseId, ivId);
    const truoc = mot('SELECT * FROM sos_cases WHERE id = ?', caseId);
    assert(truoc.status === 'done' && truoc.dedup_key, 'chưa đóng');
    cases.moLaiCase(QL, caseId);
    const sau = mot('SELECT * FROM sos_cases WHERE id = ?', caseId);
    assert(sau.status === 'in_progress' && sau.outcome === null && sau.outcome_note === null && sau.closed_at === null && sau.closed_by === null, JSON.stringify(sau));
    assert(sau.dedup_key === truoc.dedup_key, 'khoá chống trùng đổi');
    assert(mot('SELECT status FROM case_interventions WHERE id = ?', ivId).status === 'completed', 'PA sống lại');
    assert(hang(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'status' AND old_value = 'done' AND new_value = 'in_progress'`, caseId).length === 1, 'lịch sử');
    assert(hang(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'reopened' AND created_by = ?`, caseId, QL.userId).length === 1, 'mốc');
    assert(hang(`SELECT 1 FROM journey_events WHERE ref_table = 'sos_cases' AND ref_id = ? AND title = 'Mở lại Case'`, caseId).length === 1, 'Hành trình');
    const nk = mot(`SELECT before_json FROM audit_logs WHERE action = 'case.reopen' AND entity_id = ?`, caseId);
    assert(nk && JSON.parse(nk.before_json).outcome === 'much_better', JSON.stringify(nk));
    assert(cases.closeBlockers(caseId).length === 0, cases.closeBlockers(caseId).join(' '));
    cases.closeCaseOutcome(QL, caseId, { outcome: 'improved', note: 'Đóng lại sau khi mở nhầm, kết luận mới' });
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', caseId).status === 'done', 'đóng lại');
    assert(hang(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'closed'`, caseId).length === 2, 'mốc đóng lần hai cùng ngày');
    assert(d.MILESTONE_KIND_LABEL.reopened === 'Mở lại', 'nhãn mốc');
  }));

  check('LUIa2-6 · Mở lại: GV kỹ năng khác 403 (OV-13h: GV hoàn thành được thì mở lại được — LUIa2-7); chưa hoàn thành 400; đã có Case mới cùng hạng mục 400; Case "Không cần theo dõi" mở lại được; không PA → Mới mở', () => thu(() => {
    const sid = moiEm();
    const caseId = taoCase(sid);
    assert(chuLoi(() => cases.moLaiCase(QL, caseId)) === 'Case này chưa hoàn thành.', 'chưa xong');
    const ivId = themPa(caseId);
    dongCase(caseId, ivId);
    assert(maLoi(() => cases.moLaiCase(P.w1Teacher, caseId)) === 403 && maLoi(() => cases.moLaiCase(P.sTeacher, caseId)) === 403, 'GV kỹ năng khác mở lại được');
    const moi = taoCase(sid);   // Case mới cùng Listening nhận khoá
    assert(moi !== caseId, 'không ra Case mới');
    assert(chuLoi(() => cases.moLaiCase(QL, caseId)) === 'Đã có Case Listening mới — mở Case đó.', chuLoi(() => cases.moLaiCase(QL, caseId)));
    /* Không cần theo dõi: Case đóng bằng đường hộp duyệt (`apDungKhongTheoDoi`) — không PA → về Mới mở. */
    const sid2 = moiEm();
    const c2 = taoCase(sid2);
    const sosAuto: any = sosAutoMod;
    tx(() => sosAuto.apDungKhongTheoDoi(conn, { doi_tuong_id: c2, du_lieu: JSON.stringify({ reasonCode: 'other' }), ly_do: 'Em đã tiến bộ' }, QL.userId));
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', c2).status === 'done', 'chưa đóng KCTD');
    cases.moLaiCase(P.admin, c2);
    const r = mot('SELECT status, dismiss_reason_code FROM sos_cases WHERE id = ?', c2);
    assert(r.status === 'open' && r.dismiss_reason_code === null, JSON.stringify(r));
  }));

  check('LUIa2-7 · viewer.coTheMoLai: QL true khi đã hoàn thành và mở được; GV đúng kỹ năng true (OV-13h), GV kỹ năng khác false; Case đang mở false', () => thu(() => {
    const caseId = taoCase(moiEm());
    assert(cases.caseDetail(QL, caseId).viewer.coTheMoLai === false, 'Case mở');
    dongCase(caseId, themPa(caseId));
    assert(cases.caseDetail(QL, caseId).viewer.coTheMoLai === true, 'QL');
    assert(cases.caseDetail(P.lrTeacher, caseId).viewer.coTheMoLai === true, 'GVBM đúng kỹ năng (hoàn thành được)');
    assert(cases.caseDetail(P.w1Teacher, caseId).viewer.coTheMoLai === false, 'GVBM kỹ năng khác');
  }));

  // ---------------------------------------------------------------- a2-4 · Từ chối nhiều
  const theCuaPa = (ivId: number) => mot(`SELECT * FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ?`, ivId);
  check('LUIa2-8 · Từ chối nhiều: 3 thẻ cùng lý do, PA huỷ; lý do trống → 400 trước khi đụng thẻ; trộn loại 400; thẻ đã xử lý vào loi; GV 403; > 50 → 400', () => thu(() => {
    const pa = Array.from({ length: 9 }, () => deXuat(taoCase(moiEm())));
    const the = pa.map((id) => theCuaPa(id).id as number);
    assert(chuLoi(() => yc.tuChoiNhieu(QL, the, '   ')) === 'Ghi lý do từ chối.' && the.every((id) => mot('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho'), 'lý do trống');
    assert(maLoi(() => yc.tuChoiNhieu(P.coreTeacher, the, 'x')) === 403, 'GV');
    assert(maLoi(() => yc.tuChoiNhieu(QL, Array.from({ length: 51 }, (_, i) => i + 1), 'x')) === 400, '> 50');
    const khacLoai = mot(`SELECT id FROM yeu_cau_duyet WHERE loai != 'de_xuat_pa' AND trang_thai = 'cho' LIMIT 1`);
    if (khacLoai) assert(chuLoi(() => yc.tuChoiNhieu(QL, [the[0], khacLoai.id], 'x')) === 'Chỉ từ chối hàng loạt các yêu cầu cùng một loại.', 'trộn loại');
    yc.duyetYeuCau(QL, the[3]);
    const r = yc.tuChoiNhieu(QL, the.slice(0, 4), 'Chưa đủ căn cứ');
    assert(r.ok.length === 3 && r.loi.length === 1 && r.loi[0].id === the[3] && /đã được xử lý/.test(r.loi[0].loi), JSON.stringify(r));
    const n0 = soCauSql();
    assert(yc.tuChoiNhieu(QL, the.slice(4), 'Chưa đủ căn cứ').ok.length === 5, 'lô 5');
    const cau = Math.ceil((soCauSql() - n0) / 5 * 6);   // web gửi lô 6 (rà #229)
    for (let i = 0; i < 3; i++) {
      const y = mot('SELECT trang_thai, ly_do_tu_choi FROM yeu_cau_duyet WHERE id = ?', the[i]);
      const iv = mot('SELECT status, approval_state FROM case_interventions WHERE id = ?', pa[i]);
      assert(y.trang_thai === 'tu_choi' && y.ly_do_tu_choi === 'Chưa đủ căn cứ' && iv.status === 'cancelled' && iv.approval_state === 'declined', JSON.stringify({ y, iv }));
    }
    assert(d.tomTatKetQuaHangLoat('tu-choi', 3, []) === 'Đã từ chối 3/3', d.tomTatKetQuaHangLoat('tu-choi', 3, []));
    console.log(`      (đo: từ chối một lô 6 thẻ ≈ ${cau} câu)`);
    assert(cau <= 200, `từ chối lô 6 thẻ ≈ ${cau} câu`);
  }));

  // ---------------------------------------------------------------- a2-5 · Huỷ quyết định
  const BO_UPDATED = (r: any) => { const { updated_at: _u, ...x } = r; return JSON.stringify(x); };
  check('LUIa2-9 · Huỷ quyết định (duyệt rồi huỷ / từ chối rồi huỷ): thẻ về Chờ, PA bằng ĐÚNG ảnh chụp lúc gửi; Hành trình, nhật ký, chuông người gửi', () => thu(() => {
    for (const lam of ['duyet', 'tu-choi'] as const) {
      const ivId = deXuat(taoCase(moiEm()));
      const anh = BO_UPDATED(mot('SELECT * FROM case_interventions WHERE id = ?', ivId));
      const id = theCuaPa(ivId).id as number;
      if (lam === 'duyet') yc.duyetYeuCau(QL, id); else yc.tuChoiYeuCau(QL, id, 'Chưa đủ căn cứ');
      assert(BO_UPDATED(mot('SELECT * FROM case_interventions WHERE id = ?', ivId)) !== anh, 'quyết mà PA không đổi');
      const n0 = soCauSql();
      yc.huyQuyetDinh(QL, id);
      assert(soCauSql() - n0 <= 200, `huỷ ${soCauSql() - n0} câu`);
      const y = mot('SELECT * FROM yeu_cau_duyet WHERE id = ?', id);
      assert(y.trang_thai === 'cho' && y.nguoi_duyet === null && y.xu_ly_luc === null && y.ly_do_tu_choi === null && y.tra_loi === null && y.tu_duyet === 0, JSON.stringify(y));
      const sau = BO_UPDATED(mot('SELECT * FROM case_interventions WHERE id = ?', ivId));
      assert(sau === anh, `${lam}: PA khác ảnh chụp\n${anh}\n${sau}`);
      assert(hang(`SELECT 1 FROM journey_events WHERE ref_table = 'case_interventions' AND ref_id = ? AND title = 'Quản lý huỷ quyết định PA'`, ivId).length === 1, 'Hành trình');
      assert(hang(`SELECT 1 FROM audit_logs WHERE action = 'request.undo' AND entity_id = ?`, id).length === 1, 'nhật ký');
      const chuong = hang(`SELECT title FROM notifications WHERE user_id = ? AND entity_type = 'yeu_cau_duyet' AND entity_id = ? AND title LIKE 'Quản lý huỷ quyết định · Đề xuất PA%'`, P.lrTeacher.userId, id);
      assert(chuong.length === 1 && /chờ duyệt lại$/.test(chuong[0].title), JSON.stringify(chuong));
      /* Quyết lại sau khi huỷ: chạy như lần đầu, người gửi nhận chuông kết quả mới. */
      yc.duyetYeuCau(QL, id);
      assert(mot('SELECT approval_state FROM case_interventions WHERE id = ?', ivId).approval_state === 'approved', 'duyệt lại');
      assert(hang(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?`, P.lrTeacher.userId, `duyet_ket_qua:${id}`).length === 1, 'chuông kết quả lần hai');
    }
  }));

  check('LUIa2-10 · Huỷ quyết định bị chặn: PA đã có kết quả, quyết hôm qua, loại khác, Case đã đóng, GV 403, thẻ đang chờ', () => thu(() => {
    const iv1 = deXuat(taoCase(moiEm()));
    const t1 = theCuaPa(iv1).id as number;
    assert(chuLoi(() => yc.huyQuyetDinh(QL, t1)) === 'Yêu cầu này chưa có quyết định.', 'thẻ chờ');
    yc.duyetYeuCau(QL, t1);
    assert(maLoi(() => yc.huyQuyetDinh(P.coreTeacher, t1)) === 403, 'GV');
    ketQua(iv1);
    assert(chuLoi(() => yc.huyQuyetDinh(QL, t1)) === 'PA đã có kết quả — không huỷ quyết định được.', chuLoi(() => yc.huyQuyetDinh(QL, t1)));
    const iv2 = deXuat(taoCase(moiEm()));
    const t2 = theCuaPa(iv2).id as number;
    yc.duyetYeuCau(QL, t2);
    conn.prepare('UPDATE yeu_cau_duyet SET xu_ly_luc = ? WHERE id = ?').run(`${addDays(TODAY, -1)}T05:00:00.000Z`, t2);
    assert(chuLoi(() => yc.huyQuyetDinh(QL, t2)) === 'Chỉ huỷ được quyết định trong ngày.', chuLoi(() => yc.huyQuyetDinh(QL, t2)));
    const khac = mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'lich_thi' LIMIT 1`);
    if (khac) {
      conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'duyet', xu_ly_luc = ? WHERE id = ?`).run(yc.mocNghiepVu(), khac.id);
      assert(chuLoi(() => yc.huyQuyetDinh(P.admin, khac.id)) === 'Loại yêu cầu này không huỷ quyết định được.', 'lich_thi');
    }
    const c3 = taoCase(moiEm());
    const iv3 = deXuat(c3);
    const t3 = theCuaPa(iv3).id as number;
    yc.tuChoiYeuCau(QL, t3, 'Không cần');
    themPa(c3);
    const iv4 = Math.max(...hang('SELECT id FROM case_interventions WHERE case_id = ?', c3).map((r) => r.id));
    dongCase(c3, iv4);
    assert(chuLoi(() => yc.huyQuyetDinh(QL, t3)) === 'Case đã đóng — không huỷ quyết định được.', chuLoi(() => yc.huyQuyetDinh(QL, t3)));
  }));

  check('LUIa2-11 · Đã xử lý: thẻ Đề xuất PA quyết hôm nay có coTheHuy; thẻ đã có kết quả / quyết hôm qua thì không', () => thu(() => {
    const ivA = deXuat(taoCase(moiEm())); const tA = theCuaPa(ivA).id as number; yc.duyetYeuCau(QL, tA);
    const ivB = deXuat(taoCase(moiEm())); const tB = theCuaPa(ivB).id as number; yc.duyetYeuCau(QL, tB); ketQua(ivB);
    const ivC = deXuat(taoCase(moiEm())); const tC = theCuaPa(ivC).id as number; yc.duyetYeuCau(QL, tC);
    conn.prepare('UPDATE yeu_cau_duyet SET xu_ly_luc = ? WHERE id = ?').run(`${addDays(TODAY, -1)}T05:00:00.000Z`, tC);
    const ds = yc.hopChoDuyet(QL, { xem: 'da-xu-ly' }).the;
    const co = (id: number) => ds.find((x: any) => x.id === id)?.coTheHuy === true;
    assert(co(tA) && !co(tB) && !co(tC), JSON.stringify([tA, tB, tC].map((id) => ds.find((x: any) => x.id === id)?.coTheHuy)));
    assert(!ds.some((x: any) => ['lich_thi', 'xin_y_kien', 'ke_hoach_bo_tro'].includes(x.loai) && x.coTheHuy), 'loại không đảo được có coTheHuy');   // Q-RL2c: thêm loại có đường đảo (ghi_dao)
  }));

  // ---------------------------------------------------------------- a2-6 · Sửa / Xoá Case, Xoá PA, nhật ký hạn theo dõi
  check('LUIa2-12 · Sửa Case: đổi tên / mô tả / mức / nhóm → lưu + lịch sử từng ô + nhật ký; không đổi gì thì không ghi; người tạo / GVCN / QL được, GV khác 403; Case đã hoàn thành 400', () => thu(() => {
    const caseId = taoCase(moiEm());
    themPa(caseId);
    const ma2 = d.issuesForTopic('listening')[1].code;
    cases.suaCase(P.lrTeacher, caseId, { title: 'Listening — nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số; MT2 nghe lại vẫn sai 4 câu', urgency: 'urgent', primaryCode: ma2 });
    const c = mot('SELECT * FROM sos_cases WHERE id = ?', caseId);
    assert(c.title === 'Listening — nghe sót số liệu' && c.urgency === 'urgent' && /MT2 nghe lại/.test(c.summary), JSON.stringify(c));
    assert(mot(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? AND role = 'primary' ORDER BY id LIMIT 1`, caseId).taxonomy_code === ma2, 'nhóm');
    const ls = hang('SELECT field FROM sos_case_history WHERE case_id = ? ORDER BY id', caseId).map((r) => r.field).sort().join(',');
    assert(ls === 'primaryCode,summary,title,urgency', ls);
    assert(hang(`SELECT 1 FROM audit_logs WHERE action = 'case.edit' AND entity_id = ?`, caseId).length === 1, 'nhật ký');
    cases.suaCase(QL, caseId, { title: 'Listening — nghe sót số liệu' });
    assert(hang(`SELECT 1 FROM audit_logs WHERE action = 'case.edit' AND entity_id = ?`, caseId).length === 1, 'không đổi mà vẫn ghi');
    cases.suaCase(P.coreTeacher, caseId, { urgency: 'attention' });   // GVCN lớp em
    assert(maLoi(() => cases.suaCase(P.sTeacher, caseId, { urgency: 'urgent' })) === 403, 'GV khác');
    assertThrows(() => cases.suaCase(QL, caseId, { title: 'ab' }), /3 đến 80/, 'tên ngắn');
    const c2 = taoCase(moiEm());
    dongCase(c2, themPa(c2));
    assert(chuLoi(() => cases.suaCase(QL, c2, { urgency: 'urgent' })) === 'Case đã hoàn thành — Mở lại trước khi sửa.', 'Case done');
  }));

  check('LUIa2-13 · Sửa Case đổi kỹ năng: chưa có PA → đổi topic + khoá; có PA → 400; trùng Case đang mở → 400', () => thu(() => {
    const sid = moiEm();
    const caseId = taoCase(sid);
    cases.suaCase(QL, caseId, { topic: 'reading', primaryCode: d.issuesForTopic('reading')[0].code });
    const c = mot('SELECT topic, category, dedup_key FROM sos_cases WHERE id = ?', caseId);
    assert(c.topic === 'reading' && c.dedup_key && c.dedup_key.endsWith(':reading'), JSON.stringify(c));
    const khac = taoCase(sid, P.lrTeacher, 'listening');
    assert(chuLoi(() => cases.suaCase(QL, khac, { topic: 'reading', primaryCode: d.issuesForTopic('reading')[0].code })) === 'Đã có Case Reading đang mở.', 'trùng');
    themPa(khac);
    assert(chuLoi(() => cases.suaCase(QL, khac, { topic: 'speaking', primaryCode: d.issuesForTopic('speaking')[0].code })) === 'Case đã có PA — không đổi kỹ năng.', 'có PA');
    assert(cases.caseDetail(QL, khac).viewer.khoaKyNang === true && cases.caseDetail(QL, caseId).viewer.khoaKyNang === false, 'khoaKyNang');
  }));

  /** Mọi cột trỏ Case / PA ở mọi bảng (quét pragma — bảng PR sau thêm cũng bị soi). */
  const cotTro = () => (hang(`SELECT name FROM sqlite_master WHERE type = 'table'`) as any[]).flatMap((tb) =>
    hang(`SELECT name FROM pragma_table_info(?)`, tb.name).filter((c) => /(^|_)case_id$|^intervention_id$|^superseded_by$/.test(c.name))
      .map((c) => ({ bang: tb.name as string, cot: c.name as string })));
  check('LUIa2-14 · Xoá Case báo tay: không còn dòng trỏ Case / PA ở mọi bảng; thẻ chờ đóng tu_dong; nhật ký chụp; N37: GV môn xoá thẳng, GV khác 403, Case có PA có kết quả xoá được', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = deXuat(caseId);
    att.addLink(P.lrTeacher, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/a' });
    att.addLink(P.lrTeacher, { ownerType: 'case_intervention', ownerId: ivId, url: 'https://example.com/b' });
    const the = theCuaPa(ivId).id as number;
    /* N37 (chủ SP 05/11): người sửa được Case xoá thẳng; GV môn khác của lớp không. */
    assert(maLoi(() => cases.xoaCase(P.w1Teacher, caseId)) === 403, 'GV Writing xoá được Case Listening');
    assert(cases.caseDetail(QL, caseId).viewer.xoa === 'ngay' && cases.caseDetail(P.lrTeacher, caseId).viewer.xoa === 'ngay', 'cờ xoa');
    const n0 = soCauSql();
    cases.xoaCase(QL, caseId);
    const cau = soCauSql() - n0;
    console.log(`      (đo: xoá Case 1 PA ${cau} câu)`);
    assert(cau <= 200, `xoá Case ${cau} câu`);
    for (const { bang, cot } of cotTro()) {
      const ids = bang === 'case_interventions' && cot === 'superseded_by' ? [ivId] : cot === 'intervention_id' ? [ivId] : [caseId];
      const con = hang(`SELECT 1 FROM ${bang} WHERE ${cot} IN (${ids.map(() => '?').join(',')})`, ...ids);
      assert(con.length === 0, `${bang}.${cot} còn ${con.length} dòng`);
    }
    assert(!mot('SELECT 1 FROM sos_cases WHERE id = ?', caseId) && !mot('SELECT 1 FROM case_interventions WHERE id = ?', ivId), 'chưa xoá');
    assert(hang(`SELECT 1 FROM attachments WHERE (owner_type = 'sos_case' AND owner_id = ?) OR (owner_type = 'case_intervention' AND owner_id = ?)`, caseId, ivId).length === 0, 'tệp');
    assert(hang(`SELECT 1 FROM journey_events WHERE (ref_table = 'sos_cases' AND ref_id = ?) OR (ref_table = 'case_interventions' AND ref_id = ?)`, caseId, ivId).length === 0, 'Hành trình');
    const y = mot('SELECT trang_thai, ly_do_dong FROM yeu_cau_duyet WHERE id = ?', the);
    assert(y.trang_thai === 'tu_dong' && y.ly_do_dong === 'Case đã xoá', JSON.stringify(y));
    const theDa = yc.hopChoDuyet(QL, { xem: 'da-xu-ly' }).the.find((t: any) => t.id === the);
    assert(theDa && theDa.mo === '' && theDa.dong.includes('PA đã xoá'), `rà #229: thẻ của PA đã xoá không có Mở: ${JSON.stringify(theDa?.mo)}`);
    const nk = mot(`SELECT before_json FROM audit_logs WHERE action = 'case.delete' AND entity_id = ?`, caseId);
    assert(nk && JSON.parse(nk.before_json).pa.length === 1 && JSON.parse(nk.before_json).case.id === caseId, 'nhật ký');
    /* N37: còn PA có kết quả → vẫn xoá thẳng; PA + kết quả đi cùng. */
    const c2 = taoCase(moiEm());
    const iv2 = themPa(c2);
    ketQua(iv2);
    cases.xoaCase(QL, c2);
    assert(!mot('SELECT 1 FROM sos_cases WHERE id = ?', c2) && !mot('SELECT 1 FROM case_followups WHERE intervention_id = ?', iv2), 'xoá Case có PA có kết quả');
  }));

  check('LUIa2-16 · Xoá PA (2 kết quả tuần): xoá PA + kết quả + lịch sử điều chỉnh; nhật ký chụp; việc / Phân tích tính lại; hết PA → Mới mở; N37: GV ghi được xoá thẳng, Case đã hoàn thành giữ; PA chờ duyệt xoá được', () => thu(() => {
    const sid = moiEm();
    const caseId = taoCase(sid);
    const ivId = themPa(caseId);
    ketQua(ivId);
    ketQua(ivId, { decision: 'adjust', decisionNote: 'Tăng lên 20 phút', adjust: { description: 'Tự học Listening — nghe chép 20 phút mỗi ngày' } });
    ketQua(ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    const eff: any = effMod;
    assert(eff.planOutcomes({ studentIds: [sid] }).some((r: any) => r.id === ivId), 'Phân tích chưa có PA');
    const iv2 = themPa(caseId, { description: 'Nghe lại bài MT2 với GVBM 2 buổi' });
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(TODAY, iv2);   // tới hạn → có dòng "Ghi kết quả PA"
    const viec = () => (mywork.myWork(P.lrTeacher, {}).items ?? []).filter((i: any) => i.group === 'ghi_ket_qua_pa' && i.caseId === caseId).length;
    const v0 = viec();
    assert(v0 === 1, `chưa có dòng Ghi kết quả PA: ${v0}`);
    assert(maLoi(() => cases.xoaPa(P.w1Teacher, ivId)) === 403, 'GV Writing xoá được PA Listening');
    assert(cases.caseDetail(P.lrTeacher, caseId).interventions.find((i: any) => i.id === ivId).xoa === 'ngay', 'GV môn: xoá thẳng');
    const cXong = taoCase(moiEm()); const ivXong = themPa(cXong); dongCase(cXong, ivXong);
    cases.xoaPa(QL, ivXong);   // N37: Case đã hoàn thành — xoá PA không mở lại Case
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', cXong).status === 'done', 'xoá PA mở lại Case đã hoàn thành');
    cases.xoaPa(QL, ivId);
    assert(!mot('SELECT 1 FROM case_interventions WHERE id = ?', ivId), 'PA còn');
    assert(hang('SELECT 1 FROM case_followups WHERE intervention_id = ?', ivId).length === 0, 'kết quả còn');
    assert(hang('SELECT 1 FROM case_intervention_revisions WHERE intervention_id = ?', ivId).length === 0, 'lịch sử điều chỉnh còn');
    const nk = JSON.parse(mot(`SELECT before_json FROM audit_logs WHERE action = 'intervention.delete' AND entity_id = ?`, ivId).before_json);
    assert(nk.pa.id === ivId && nk.ketQua.length === 3, JSON.stringify(nk).slice(0, 200));
    assert(!eff.planOutcomes({ studentIds: [sid] }).some((r: any) => r.id === ivId), 'Phân tích còn PA đã xoá');
    assert(viec() === v0, `việc PA còn lại đổi: ${v0} → ${viec()}`);
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', caseId).status !== 'open', 'còn PA khác mà về Mới mở');
    const v1 = viec();
    cases.xoaPa(QL, iv2);
    assert(viec() === v1 - 1, `việc PA cần cập nhật không giảm 1: ${v1} → ${viec()}`);
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', caseId).status === 'open', 'hết PA phải về Mới mở');
    const ivCho = deXuat(caseId);
    const the = theCuaPa(ivCho).id as number;
    cases.xoaPa(QL, ivCho);
    assert(mot('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', the).trang_thai === 'tu_dong', 'thẻ PA chờ duyệt chưa đóng');
  }));

  check('LUIa2-15 · Đổi hạn theo dõi Case: nhật ký trước / sau; cùng ngày thì không ghi', () => thu(() => {
    const caseId = taoCase(moiEm());
    const han = addDays(TODAY, 14);
    cases.setFollowUntil(P.lrTeacher, caseId, han);
    cases.setFollowUntil(P.lrTeacher, caseId, han);
    const nk = hang(`SELECT before_json, after_json FROM audit_logs WHERE action = 'case.follow_until' AND entity_id = ?`, caseId);
    assert(nk.length === 1 && JSON.parse(nk[0].after_json).followUntil === han, JSON.stringify(nk));
  }));
  void checkAsync;
}
