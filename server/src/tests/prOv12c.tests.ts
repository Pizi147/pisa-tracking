/**
 * PHÉP KIỂM PR-OV12c (chủ SP 14/10) — Case SOS MT lấy nguyên nhân từ nhận xét + nhóm của ô (liên kết sống), đi thẳng "Chờ xác nhận PA";
 * em đạt lại → Case chưa có PA xác nhận bị xoá hẳn; Progress Test lớp thường: mỗi Case một môn, nhãn SOS theo số môn trượt, MỘT bước
 * "Xác nhận Case" hạn 5 ngày cố định; Case MT cũ không nhận xét → việc "Ghi nhận xét"; migrate prOv12c chạy lặp không đổi.
 * Mỗi ca dựng trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import { duXacNhan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrOv12cTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { migratePrOv12c } = await import('../migrate/prOv12c.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV12c · Case SOS MT từ nhận xét · Progress "Xác nhận Case" · xoá Case khi em đạt');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const WS = '2026-11-02', WS1 = '2026-11-09';
  const TRONG = '2026-11-04', BU = '2026-11-11';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod(WS1).id as number;
  week.ensurePeriod('2026-11-16');

  /* Em MỚI ở MB FT 101 — lượt MT cuối tự tạo. */
  const sid = (intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: 'OV12c Em A', target: 7, email: emailThu(), dob: '2010-01-01' }],
    idempotencyKey: 'ov12c-a' }).studentIds[0]) as number;
  const luotEm = all(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no`, sid).map((r) => r.id as number);
  const luot = luotEm[luotEm.length - 1];

  /** Lượt sạch ở tuần W, kỳ vọng 6.5 (cùng cách prOv1c dựng). `luotSau`: chỉ dọn lượt này — Case / tín hiệu / điểm lượt khác của em giữ (Trượt lại). */
  const dung = (aid: number, luotSau = false) => {
    skillSchedule.ensureSkillRows(aid);
    const a = one('SELECT * FROM assessment_attempts WHERE id = ?', aid);
    for (const sql of ['DELETE FROM assessment_scores WHERE attempt_id = ?', 'DELETE FROM skill_move_requests WHERE attempt_id = ?',
      'DELETE FROM attempt_skill_skips WHERE attempt_id = ?', 'DELETE FROM sos_coordination_actions WHERE attempt_id = ?']) conn.prepare(sql).run(aid);
    if (!luotSau) {
      conn.prepare(`UPDATE sos_cases SET status = 'done', dedup_key = NULL WHERE student_id = ?`).run(a.student_id);
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ? AND id != ?)').run(a.student_id, aid);
      conn.prepare('DELETE FROM case_signals WHERE student_id = ?').run(a.student_id);
    }
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    const delta = dm.expectationDelta(a.attempt_no, attempts.routeCuaLuot(a));
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = 0, planned_period_id = ?, deadline_override = NULL, target_at_attempt = ? WHERE id = ?`)
      .run(W, 6.5 + delta, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?) AND attempt_id != ?`).run(...(luotSau ? [W1, W1] : [W, W1]), aid);
    if (luotSau) conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ?').run(W1, aid);
    if (luotSau) conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(W1, aid);
    xoaNho();
  };
  const NX = (s: string) => `Nhận xét ${s}: làm chậm, sai dạng bài quen thuộc.`;
  const nhom = (s: string, n = 2) => dm.issuesForTopic(s).filter((i: any) => !dm.laKhac(i.code)).slice(0, n).map((i: any) => i.code) as string[];
  /** Ghi điểm qua ĐƯỜNG NGƯỜI DÙNG (luật OV-12b): nhận xét + nhóm khi dưới kỳ vọng 6.5. */
  const diem = (aid: number, s: string, band: number, o: { nx?: string; nhom?: string[]; today?: string; who?: any } = {}) => {
    const so = s === 'listening' || s === 'reading' ? { band } : { criteria: tieuChiThu(band) };
    return attempts.saveScore(o.who ?? QL, aid, s, { ...so, nhanXet: o.nx ?? NX(s), ...(band < 6.5 ? { nhomNguyenNhan: o.nhom ?? nhom(s) } : {}) },
      o.today ?? TRONG);
  };
  const caseCua = (aid: number) => all(`SELECT DISTINCT c.* FROM sos_cases c JOIN case_signals g ON g.case_id = c.id WHERE g.attempt_id = ? ORDER BY c.id`, aid);
  const issues = (caseId: number) => all(`SELECT role, taxonomy_code, observation FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`, caseId);
  /** L 5 (dưới) + R / W 7 + S 5.5 (dưới) → chốt, SOS 2: Case L + Case S. */
  const chotSos2 = (aid: number) => {
    diem(aid, 'listening', 5); diem(aid, 'reading', 7); diem(aid, 'writing1', 7); diem(aid, 'writing2', 7); diem(aid, 'speaking', 5.5);
  };
  const viec = (p: any, aid: number) => mywork.myWork(p, { nguoi: 'tat-ca' }).items.filter((it: any) => it.attemptId === aid || caseCua(aid).some((c) => c.id === it.caseId));

  check('OV12c-1 · chốt MT có SOS → Case "Chờ xác nhận PA", nguyên nhân = nhận xét + nhóm của ô; không việc / chuông / thẻ / số "chờ nguyên nhân"', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const cs = caseCua(luot);
    assert(cs.length === 2, `phải 2 Case (L, S): ${cs.length}`);
    const cL = cs.find((c) => c.topic === 'listening')!;
    const iL = issues(cL.id);
    const nL = nhom('listening');
    assert(iL.length === 2 && iL[0].role === 'primary' && iL[0].taxonomy_code === nL[0] && iL[1].role === 'secondary' && iL[1].taxonomy_code === nL[1],
      `nhóm 1 = chính, nhóm 2 = phụ: ${JSON.stringify(iL)}`);
    assert(iL[0].observation === NX('listening'), `quan sát = nhận xét ô: ${iL[0].observation}`);
    const ct = cases.caseDetail(QL, cL.id);
    assert(ct.trangThaiV4.k === 'cho-xac-nhan-pa' && /^Xác nhận PA/.test(ct.viecTiep.chu), `trạng thái ${ct.trangThaiV4.k} · việc ${ct.viecTiep?.chu}`);
    assert(cL.han_xac_nhan === dm.hanXacNhan(TODAY, { sosLevel: 2 }), `hạn xác nhận như nay: ${cL.han_xac_nhan}`);
    const ds = viec(QL, luot);
    assert(!ds.some((it: any) => it.group === 'cause' || /nguyên nhân/i.test(`${it.tieuDe} ${it.actionLabel}`)), `không việc nguyên nhân: ${ds.map((it: any) => it.tieuDe)}`);
    assert(ds.filter((it: any) => it.group === 'xac_nhan_pa').length === 2, `hai việc Xác nhận PA: ${ds.map((it: any) => it.group)}`);
    assert(!all(`SELECT 1 FROM notifications WHERE dedup_key IN (${cs.map(() => '?').join(',')})`, ...cs.map((c) => `sos-case:${c.id}`)).length, 'không chuông "Xác nhận nguyên nhân"');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id IN (?, ?)').run(t.addDays(TODAY, -2), cs[0].id, cs[1].id);
    yeuCau.quetYeuCau(TODAY);
    assert(!all(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_nguyen_nhan' AND doi_tuong_id IN (?, ?)`, cs[0].id, cs[1].id).length, 'không thẻ Báo lên nguyên nhân');
    /* OV-12d: ô Tổng quan nay là "Case chờ duyệt" (cùng cột Tổng hợp) — Case MT chờ xác nhận PA thuộc tập, quá hạn xác nhận PA thì có ⚠. */
    for (const id of ['case-cho-xac-dinh-nguyen-nhan', 'case-xac-dinh-nguyen-nhan-qua-han']) {
      const ids = metrics.metricSet(QL, id, {}).ids as number[];
      assert(cs.every((c) => ids.includes(c.id)), `${id} phải đếm Case MT chờ xác nhận PA`);
    }
    assert(/không phải Progress|nhận xét/i.test((() => { try { sosAuto.xacNhanCase(QL, cL.id, { primaryCode: nL[0], moTa: 'x'.repeat(20) }); return ''; } catch (e: any) { return e.message; } })()),
      'Case MT không còn bước Xác nhận Case');
  }));

  check('OV12c-2 · sửa nhận xét / nhóm của ô → nguyên nhân Case đổi theo (liên kết sống), có nhật ký', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const cL = caseCua(luot).find((c) => c.topic === 'listening')!;
    const moi = nhom('listening', 3).reverse();
    attempts.saveScore(QL, luot, 'listening', { nhanXet: 'Sai nhiều câu điền số và tên riêng.', nhomNguyenNhan: moi }, TRONG);
    const iL = issues(cL.id);
    assert(iL.length === 3 && iL[0].taxonomy_code === moi[0] && iL.slice(1).map((i) => i.taxonomy_code).join() === moi.slice(1).join(), JSON.stringify(iL));
    assert(iL[0].observation === 'Sai nhiều câu điền số và tên riêng.', `quan sát mới: ${iL[0].observation}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'score.nhan_xet' AND entity_id = ? AND entity_label = 'listening'`, luot).n >= 1, 'nhật ký nhận xét');
  }));

  check('OV12c-3 · trượt lại lượt sau → mốc lặp; mô tả Case giữ theo nhận xét lượt trước (N8); nguyên nhân theo lượt hiện đủ hai lượt', () => thu(() => {
    const truoc = luotEm[luotEm.length - 2];
    dung(truoc);
    chotSos2(truoc);
    const cL = caseCua(truoc).find((c) => c.topic === 'listening')!;
    dung(luot, true);   // lượt sau ở tuần W1, Case L của lượt trước còn mở
    const sau = { today: BU };
    diem(luot, 'listening', 5, { ...sau, nx: 'MT sau: vẫn sai Part 3, nghe chậm ý chính.', nhom: [nhom('listening', 3)[2]] });
    diem(luot, 'reading', 7, sau); diem(luot, 'writing1', 7, sau); diem(luot, 'writing2', 7, sau); diem(luot, 'speaking', 5.5, sau);
    const lap = one(`SELECT * FROM case_milestones WHERE case_id = ? AND kind = 'repeat' AND attempt_id = ?`, cL.id, luot);
    assert(!!lap, 'phải có mốc Trượt lại');
    const iL = issues(cL.id);
    /* SV-NX-CASE (N8 ②): Case đã có mô tả (theo nhận xét lượt trước) → nhận xét lượt sau không đè. */
    assert(iL[0].observation === NX('listening'), `mô tả giữ theo lượt trước: ${JSON.stringify(iL)}`);
    const ct = cases.caseDetail(QL, cL.id);
    const theoLuot = (ct.nguyenNhanTheoLuot ?? []) as { luot: string; nhanXet: string }[];
    assert(theoLuot.length === 2 && theoLuot[0].nhanXet === NX('listening') && theoLuot[1].nhanXet.startsWith('MT sau'), `theo lượt: ${JSON.stringify(theoLuot)}`);
  }));

  check('OV12c-4 · "Không cần theo dõi" gửi được ở bước chờ xác nhận PA; thẻ đang chờ → Xác nhận PA bị chặn; Xác nhận PA bấm thẳng (mô tả quy chế)', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const [c1, c2] = caseCua(luot);
    sosAuto.guiKhongTheoDoi(QL, c1.id, { reasonCode: dm.CASE_DISMISS_REASONS[0] });
    const pa1 = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1`, c1.id);
    let loi = '';
    try { sosAuto.xacNhanPaQuyChe(QL, pa1.id, duXacNhan(conn, pa1.id, { description: pa1.description })); } catch (e: any) { loi = e.message; }
    assert(/Không cần theo dõi/.test(loi), `phải chặn khi thẻ đang chờ: ${loi}`);
    assert(cases.caseDetail(QL, c1.id).trangThaiV4.k === 'cho-duyet-khong-theo-doi', 'trạng thái chờ QL duyệt');
    const pa2 = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1`, c2.id);
    sosAuto.xacNhanPaQuyChe(QL, pa2.id, duXacNhan(conn, pa2.id, { description: pa2.description }));
    assert(one('SELECT status, confirmed_by FROM case_interventions WHERE id = ?', pa2.id).status === 'started', 'PA chạy');
  }));

  check('OV12c-5 · em đạt lại (Overall ≥ kỳ vọng) → Case chưa xác nhận PA XOÁ HẲN; đã xác nhận PA / PA có tệp đính thì giữ + mốc "Overall đã đạt"', () => thu(() => {
    for (const ca of ['xoa', 'xac-nhan', 'tep'] as const) {
      const daXacNhan = ca !== 'xoa';
      dung(luot);
      diem(luot, 'listening', 5); diem(luot, 'reading', 7); diem(luot, 'writing1', 7); diem(luot, 'writing2', 7);
      attempts.saveScore(QL, luot, 'speaking', { noShow: true }, TRONG);   // S dời tuần → chốt, L dưới kỳ vọng
      const c = caseCua(luot)[0];
      assert(c && c.status !== 'done', 'phải có Case L sau chốt');
      const pa = one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1`, c.id);
      if (ca === 'xac-nhan') sosAuto.xacNhanPaQuyChe(QL, pa.id, duXacNhan(conn, pa.id, { description: pa.description }));
      /* GV đính bằng chứng vào PA quy chế chưa xác nhận — xoá Case sẽ mất tệp, nên giữ. */
      if (ca === 'tep') conn.prepare(`INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at)
        VALUES ('case_intervention', ?, 'link', 'https://vd.test/a', 'Ảnh bài', ?, ?)`).run(pa.id, QL.userId, new Date().toISOString());
      diem(luot, 'speaking', 7, { today: BU });   // (5 + 7 + 7 + 7) / 4 = 6.5 ≥ 6.5
      const sau = one('SELECT * FROM sos_cases WHERE id = ?', c.id);
      if (!daXacNhan) {
        assert(!sau, 'Case chưa xác nhận PA phải bị xoá hẳn');
        assert(!all('SELECT 1 FROM case_issues WHERE case_id = ?', c.id).length && !all('SELECT 1 FROM case_interventions WHERE case_id = ?', c.id).length, 'xoá cả nguyên nhân / PA');
        assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'case.xoa_overall_dat' AND entity_id = ?`, c.id).n === 1, 'nhật ký xoá');
      } else {
        assert(sau && sau.status !== 'done', `Case ${ca} phải giữ`);
        assert(one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'overall_dat'`, c.id).n === 1, 'thiếu mốc Overall đã đạt');
      }
      conn.exec('ROLLBACK'); conn.exec('BEGIN IMMEDIATE'); xoaNho();
    }
  }));

  /* ------------------------------------------------------------------ Progress Test lớp thường */
  const taoEmThuong = (ten: string, ma: string) => {
    const cid = classId(ma);
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `ov12c-${ten}` });
    regular.planRegularTests(P.admin, cid);
    const st = one('SELECT id FROM students WHERE full_name = ?', ten);
    return { id: st.id as number, pt: one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'`, st.id).id as number };
  };
  const nhapThuong = (aid: number, dd: Record<string, number>) => {
    for (const [k, v] of Object.entries(dd)) regular.saveRegularScore(P.admin, aid, k, { score: v, total: 20, lyDo: 'Phép kiểm OV12c' });
  };

  check('OV12c-6 · Progress: mỗi Case một môn, nhãn SOS theo số môn trượt, việc "Xác nhận Case" hạn 5 ngày cố định (cả SOS 3)', () => thu(() => {
    const em = taoEmThuong('OV12c FOU A', 'MB FOU 12');
    nhapThuong(em.pt, { listening: 8, reading: 8, writing: 8, speaking: 18 });
    const cs = all('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', em.id);
    assert(cs.length === 3 && new Set(cs.map((c) => c.topic)).size === 3, `3 Case, mỗi Case một môn: ${cs.map((c) => c.topic)}`);
    assert(cs.every((c) => c.sos_level === 3), `SOS 3 (3 môn trượt): ${cs.map((c) => c.sos_level)}`);
    assert(cs.every((c) => c.han_xac_nhan === dm.hanTheoNgay(TODAY, 5)), `hạn 5 ngày cố định: ${cs.map((c) => c.han_xac_nhan)}`);
    assert(/\[SOS 3\]/.test(cases.caseTitleOf(cs[0])), `tên Case có nhãn SOS: ${cases.caseTitleOf(cs[0])}`);
    const gv = loadPrincipal(P.normalCoreTeacher.userId);
    const ds = mywork.myWork(QL, { nguoi: 'tat-ca' }).items.filter((it: any) => it.studentId === em.id && it.group === 'cause');
    assert(ds.length === 3 && ds.every((it: any) => /^Xác nhận Case/.test(it.tieuDe)), `việc Xác nhận Case từng Case: ${ds.map((it: any) => it.tieuDe)}`);
    assert(cases.caseDetail(gv, cs[0].id).trangThaiV4.chu === 'Chờ xác nhận Case', 'nhãn trạng thái');
  }));

  check('OV12c-7 · Progress "Xác nhận Case": nhóm (1 = chính) + mô tả + PA Bổ trợ sửa tại chỗ → một lần, PA chạy; GVCN làm được', () => thu(() => {
    const em = taoEmThuong('OV12c BE A', 'MB BE 04');
    nhapThuong(em.pt, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = one('SELECT * FROM sos_cases WHERE student_id = ?', em.id);
    assert(c && c.sos_level === 1, `SOS 1: ${c?.sos_level}`);
    const ct = one('SELECT programme_code ct FROM classes WHERE id = ?', classId('MB BE 04')).ct;
    const ma = dm.issuesForTopic('writing', ct).filter((i: any) => !dm.laKhac(i.code)).slice(0, 2).map((i: any) => i.code);
    const gvcn = loadPrincipal(one(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, classId('MB BE 04')).u);
    const pa = one(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, c.id);
    sosAuto.xacNhanCase(gvcn, c.id, { nhom: ma, moTa: 'Viết thiếu ý, sai thì động từ ở đoạn 2.', pa: { soBuoi: 2 } });
    const iv = issues(c.id);
    assert(iv[0].role === 'primary' && iv[0].taxonomy_code === ma[0] && iv[1]?.taxonomy_code === ma[1], JSON.stringify(iv));
    const sau = one('SELECT * FROM case_interventions WHERE id = ?', pa.id);
    assert(sau.status === 'started' && sau.confirmed_by === gvcn.userId && sau.so_buoi === 2, `PA chạy + số buổi sửa: ${sau.status} · ${sau.so_buoi}`);
    assert(one('SELECT summary FROM sos_cases WHERE id = ?', c.id).summary === 'Viết thiếu ý, sai thì động từ ở đoạn 2.', 'mô tả');
  }));

  /* Rà #389 (đặc tả 7.2): GVCN làm được dù KHÔNG dạy môn đó — MB FOU 12: GVCN dạy L + R, Writing do GVBM khác dạy. */
  check('OV12c-7b · GVCN không dạy môn: Xác nhận Case Progress được (máy chủ + cờ nút); GVBM môn khác vẫn 403; Case về GVCN (không ai dạy môn) có dòng ở Công việc', () => thu(() => {
    const lopF = classId('MB FOU 12');
    const gvcn = loadPrincipal(one(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, lopF).u);
    const gvW = one(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill = 'writing' AND status = 'active'`, lopF).u;
    assert(gvW !== gvcn.userId, 'phép kiểm cần GVCN KHÔNG dạy Writing');
    const ctF = one('SELECT programme_code ct FROM classes WHERE id = ?', lopF).ct;
    const maW = [dm.issuesForTopic('writing', ctF).find((i: any) => !dm.laKhac(i.code)).code];
    const em = taoEmThuong('OV12c FOU GVCN', 'MB FOU 12');
    nhapThuong(em.pt, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = one(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'writing'`, em.id);
    assert(c.owner_user_id === gvW, `Case về GVBM Writing: ${c.owner_user_id}`);
    assert(cases.caseDetail(gvcn, c.id).viewer.coTheXacNhanCase === true, 'cờ nút Xác nhận Case của GVCN');
    /* Rà #389 (2): FOU PA Bổ trợ chung do GVCN dạy — GVBM Writing không sửa được PA (UI ẩn "Sửa" theo `ghiDuoc` = luật Sửa PA), GVCN sửa được. */
    const bt = (p: any) => cases.caseDetail(p, c.id).interventions.find((x: any) => x.kind === 'bo_tro');
    assert(bt(loadPrincipal(gvW)).ghiDuoc === false && bt(gvcn).ghiDuoc === true, `ghiDuoc PA chung: GVBM ${bt(loadPrincipal(gvW)).ghiDuoc} · GVCN ${bt(gvcn).ghiDuoc}`);
    const gvS = loadPrincipal(one(`SELECT user_id u FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`, lopF).u);
    assert(cases.caseDetail(gvS, c.id).viewer.coTheXacNhanCase === false, 'GVBM Speaking không có nút');
    let loiS: any = null;
    try { sosAuto.xacNhanCase(gvS, c.id, { nhom: maW, moTa: 'Viết thiếu ý, sai thì động từ ở đoạn 2.' }); } catch (e) { loiS = e; }
    assert(loiS?.status === 403, `GVBM Speaking: ${loiS?.status}`);
    sosAuto.xacNhanCase(gvcn, c.id, { nhom: maW, moTa: 'Viết thiếu ý, sai thì động từ ở đoạn 2.' });
    assert(issues(c.id)[0]?.role === 'primary', 'GVCN xác nhận được');
    /* Không ai dạy Speaking → Case về GVCN; GVCN không có SOS_EDIT môn đó nhưng vẫn có dòng "Xác nhận Case" của mình. */
    conn.prepare(`UPDATE teacher_assignments SET status = 'inactive' WHERE class_id = ? AND skill = 'speaking'`).run(lopF);
    xoaNho();
    const em2 = taoEmThuong('OV12c FOU GVCN 2', 'MB FOU 12');
    nhapThuong(em2.pt, { listening: 18, reading: 18, writing: 18, speaking: 8 });
    const c2 = one(`SELECT * FROM sos_cases WHERE student_id = ? AND topic = 'speaking'`, em2.id);
    assert(c2.owner_user_id === gvcn.userId, `Case về GVCN: ${c2.owner_user_id}`);
    const dong = mywork.myWork(loadPrincipal(gvcn.userId)).items.find((it: any) => it.key === `cause:${c2.id}`);
    assert(dong && dong.mine, 'GVCN thiếu dòng Xác nhận Case ở Công việc');
  }));

  check('OV12c-8 · Case MT cũ ô chưa nhận xét → "Chờ ghi nhận xét" + việc "Ghi nhận xét {kỹ năng} · MT{n}"; GV ghi sau hoàn tất được, Case tự sang Chờ xác nhận PA', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const cL = caseCua(luot).find((c) => c.topic === 'listening')!;
    /* Dữ liệu trước luật: ô không nhận xét, Case không nguyên nhân. */
    conn.prepare(`UPDATE assessment_scores SET comment = NULL, nhom_nguyen_nhan = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(luot);
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(cL.id);
    xoaNho();
    const ct = cases.caseDetail(QL, cL.id);
    assert(ct.trangThaiV4.k === 'cho-nhan-xet' && ct.trangThaiV4.chu === 'Chờ mô tả Case', `trạng thái: ${JSON.stringify(ct.trangThaiV4)}`);
    /* Rà #389 (3): Tổng quan "Case chờ xác nhận" cùng tập cột "Chờ xác nhận" của Tổng hợp (gộp Chờ ghi nhận xét); Báo QL vẫn chỉ Progress. */
    const choXn = () => metrics.metricSet(QL, 'case-cho-xac-dinh-nguyen-nhan', {}).ids as number[];
    assert(choXn().includes(cL.id), 'Tổng quan thiếu Case MT chờ ghi nhận xét');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(t.addDays(TODAY, -2), cL.id);
    assert((metrics.metricSet(QL, 'case-xac-dinh-nguyen-nhan-qua-han', {}).ids as number[]).includes(cL.id), 'Tổng quan thiếu Case MT quá hạn ghi nhận xét');
    yeuCau.quetYeuCau(TODAY);
    assert(!all(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_nguyen_nhan' AND doi_tuong_id = ?`, cL.id).length, 'Báo QL chỉ cho Progress');
    const no = one('SELECT attempt_no n FROM assessment_attempts WHERE id = ?', luot).n;
    const gv = P.lrTeacher;
    const it = mywork.myWork(gv, {}).items.find((x: any) => x.caseId === cL.id);
    assert(it && it.group === 'ghi_nhan_xet' && it.tieuDe.startsWith(`Mô tả Case · Listening · MT${no}`) && it.luot && it.kn === 'listening', `việc: ${JSON.stringify(it && { g: it.group, t: it.tieuDe, l: it.luot, k: it.kn })}`);
    attempts.saveScore(gv, luot, 'listening', { nhanXet: 'Bổ sung: nghe sót số liệu Part 1.', nhomNguyenNhan: [nhom('listening')[0]] }, '2026-12-01');
    assert(cases.caseDetail(QL, cL.id).trangThaiV4.k === 'cho-xac-nhan-pa', 'lưu nhận xét xong → Chờ xác nhận PA');
    assert(choXn().includes(cL.id), 'OV-12d: đã có nhận xét → Chờ xác nhận PA, vẫn trong "Case chờ duyệt"');
    let loi = '';
    try { attempts.saveScore(gv, luot, 'listening', { band: 7 }, '2026-12-01'); } catch (e: any) { loi = e.message; }
    assert(loi === '', `LUAT-34: sau Đủ điểm GV đúng ô sửa được điểm: ${loi}`);
  }));

  check('OV12c-9 · migrate prOv12c: Case MT chờ nguyên nhân — ô có nhận xét → điền nguyên nhân (thiếu nhóm → "Khác"), ô trống → giữ (việc Ghi nhận xét); thẻ Báo lên nguyên nhân đóng "Đổi luật"; chạy lại không đổi', () => thu(() => {
    dung(luot);
    chotSos2(luot);
    const [cL, cS] = ['listening', 'speaking'].map((k) => caseCua(luot).find((c) => c.topic === k)!);
    /* Trước luật: L có nhận xét không nhóm, S trống; cả hai Case không nguyên nhân; thẻ Báo lên của L đang chờ. */
    conn.prepare(`UPDATE assessment_scores SET nhom_nguyen_nhan = NULL WHERE attempt_id = ? AND skill = 'listening'`).run(luot);
    conn.prepare(`UPDATE assessment_scores SET comment = NULL, nhom_nguyen_nhan = NULL WHERE attempt_id = ? AND skill = 'speaking'`).run(luot);
    conn.prepare('DELETE FROM case_issues WHERE case_id IN (?, ?)').run(cL.id, cS.id);
    const yc = yeuCau.taoYeuCau(conn, { loai: 'bao_len_nguyen_nhan', doiTuongLoai: 'sos_case', doiTuongId: cL.id, hocVienId: sid, nguoiXin: null, hanDuyet: TODAY, duLieu: {} });
    xoaNho();
    const a1: string[] = [];
    const r1 = migratePrOv12c(conn, a1);
    const khac = dm.issuesForTopic('listening').find((i: any) => dm.laKhac(i.code)).code;
    const iL = issues(cL.id);
    assert(iL.length === 1 && iL[0].taxonomy_code === khac && iL[0].observation === NX('listening'), `L: nguyên nhân Khác + nhận xét: ${JSON.stringify(iL)}`);
    assert(JSON.stringify(dm.docNhomNguyenNhan(one(`SELECT nhom_nguyen_nhan n FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, luot).n)) === JSON.stringify([khac]), 'ô L nhận nhóm Khác');
    assert(!issues(cS.id).length && cases.caseDetail(QL, cS.id).trangThaiV4.k === 'cho-nhan-xet', 'S giữ: việc Ghi nhận xét');
    assert(one('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?', cS.id).h === cS.han_xac_nhan, 'giữ hạn cũ');
    const the = one('SELECT trang_thai, ly_do_dong FROM yeu_cau_duyet WHERE id = ?', yc);
    assert(the.trang_thai !== 'cho' && /Đổi luật/.test(the.ly_do_dong ?? ''), `thẻ đóng "Đổi luật": ${JSON.stringify(the)}`);
    assert(r1.dienNguyenNhan >= 1 && r1.ghiNhanXet >= 1 && r1.dongThe >= 1 && a1.length > 0, `số dòng: ${JSON.stringify(r1)}`);
    const a2: string[] = [];
    const r2 = migratePrOv12c(conn, a2);
    assert(r2.dienNguyenNhan === 0 && r2.dongThe === 0 && r2.nhanSos === 0 && a2.length === 0, `chạy lại không đổi: ${JSON.stringify(r2)} · ${a2}`);
  }));
}
