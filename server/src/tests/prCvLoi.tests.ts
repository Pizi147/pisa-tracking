/**
 * PHÉP KIỂM CV-LOI (07 mục 4; 02 mục 4.7 A13, X-63; 9.2-10; V4B H15; CV-14) — Case không người phụ trách tự có chủ theo luật tạo Case (migrate ghi bù +
 * cùng giao dịch phân công), Công việc một dòng "Phân công GV …" chỉ cho người phân công được, GV không thấy; nút "Xếp lại bài vắng" chỉ khi máy chủ cho;
 * hạn Mini Test trên panel = hạn dòng. Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrCvLoiTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const owner: any = await import('../cases/owner.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const classes: any = await import('../classes/classes.ts');
  const cases: any = await import('../cases/cases.ts');
  const lich: any = await import('../fasttrack/skillSchedule.ts');
  const perm: any = await import('../permissions.ts');
  const { migratePrCvLoi: chayMot, KHOA_PR_CV_LOI } = await import('../migrate/prCvLoi.ts');
  /* SUA-NO-RA: migrate chạy MỘT lần (khoá demo_config) — phép kiểm gỡ khoá để chạy lại bước gán trên dữ liệu dựng (trong `thu`, cuộn lại). */
  const migratePrCvLoi = (c: unknown, a: string[]) => { conn.prepare('DELETE FROM demo_config WHERE key = ?').run(KHOA_PR_CV_LOI); chayMot(c, a); };
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const require_luat = await import('../classes/luatLoTrinh.ts');
  const require_metrics = await import('../worklist/metrics.ts');
  const require_regular = await import('../normal/regular.ts');
  console.log('\nCV-LOI · Case không chủ tự gán · một dòng Phân công · Xếp lại bài vắng theo quyền · hạn Mini Test');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const chuCua = (id: number) => one('SELECT owner_user_id o FROM sos_cases WHERE id = ?', id).o as number | null;

  const LOP = classId('MB FOU 12');
  /** Một Case học thuật đang mở của lớp, môn có GV dạy — bỏ chủ để dựng "Case không chủ". */
  const caseCuaLop = () => {
    const c = all(`SELECT sc.* FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
        JOIN students s ON s.id = e.student_id AND s.archived_at IS NULL
       WHERE e.class_id = ? AND sc.status != 'done' AND sc.tam = 0 AND sc.category IS NOT NULL AND (sc.attempt_id IS NULL OR a.class_id = ?) ORDER BY sc.id`, LOP, LOP)
      .find((r) => dm.CASE_CATEGORY_SKILL[r.category]
        && one(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active'`, LOP, dm.CASE_CATEGORY_SKILL[r.category]));
    assert(c, 'demo phải có Case học thuật mở ở MB FOU 12');
    conn.prepare('UPDATE sos_cases SET owner_user_id = NULL WHERE id = ?').run(c.id);
    return { id: c.id as number, skill: dm.CASE_CATEGORY_SKILL[c.category] as string };
  };
  const dongCua = (p: any, caseId: number) => mywork.myWork(p, { nguoi: 'tat-ca' }).items.filter((it: any) => it.caseId === caseId);

  check('K1 migrate: Case không chủ + lớp có GV môn → chủ = GV môn, một dòng lịch sử; chạy lại không ghi gì', () => thu(() => {
    const c = caseCuaLop();
    const gv = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active'`, LOP, c.skill).user_id;
    const a1: string[] = [];
    migratePrCvLoi(conn, a1);
    assert(chuCua(c.id) === gv, 'chủ phải là GV dạy môn của Case');
    const ls = all(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id'`, c.id);
    assert(ls.length === 1 && ls[0].old_value === null && ls[0].new_value === String(gv) && ls[0].actor_user_id === null, `lịch sử gán: ${JSON.stringify(ls)}`);
    assert(a1.some((x) => x.startsWith('CV-LOI')), 'migrate báo đã gán');
    const a2: string[] = [];
    chayMot(conn, a2);
    assert(!a2.length && all(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id'`, c.id).length === 1, 'lần hai không ghi gì');
  }));

  /** Lớp thiếu cả GV môn của Case lẫn GVCN → Case vẫn không chủ sau migrate. */
  const lopThieu = () => {
    const c = caseCuaLop();
    /* Bức tranh phân công TRƯỚC khi bỏ, mỗi ô một người (phép kiểm trước có thể để lại 2 dòng một ô) — K3 gửi lại đúng nó: hợp lệ chắc chắn. */
    const moiO = new Map<string, { userId: number; skill: string | null; isCore: boolean }>();
    /* Ô trùng: giữ dòng của GVCN trước (luật "GVCN dạy ≥ 1 môn"). */
    for (const a of all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ?1 AND status = 'active'
        ORDER BY user_id IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?1 AND status = 'active' AND is_core = 1) DESC, id`, LOP)) {
      const k = a.is_core === 1 ? 'gvcn' : a.skill;
      if (!moiO.has(k)) moiO.set(k, { userId: a.user_id, skill: a.is_core === 1 ? null : a.skill, isCore: a.is_core === 1 });
    }
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND status = 'active' AND (skill = ? OR is_core = 1)`).run(LOP, c.skill);
    xoaNho();
    migratePrCvLoi(conn, []);
    assert(chuCua(c.id) === null, 'lớp không ai dạy môn / chủ nhiệm → Case vẫn chưa có chủ');
    return { ...c, truoc: [...moiO.values()] };
  };

  check('K2 Công việc: Case không chủ = MỘT dòng "Phân công GV …" cho QL; GV dạy lớp không thấy dòng nào của Case', () => thu(() => {
    const c = lopThieu();
    const ql = dongCua(P.mbManager, c.id);
    assert(ql.length === 1 && ql[0].group === 'no_owner', `QL: ${JSON.stringify(ql.map((x: any) => x.group))}`);
    assert(ql[0].thieuNguoi?.mon === c.skill, `thieuNguoi: ${JSON.stringify(ql[0].thieuNguoi)}`);
    assert(/^Phân công GV /.test(ql[0].tieuDe), ql[0].tieuDe);
    const gvLop = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' LIMIT 1`, LOP);
    assert(gvLop, 'lớp còn GV môn khác');
    assert(dongCua(perm.loadPrincipal(gvLop.user_id), c.id).length === 0, 'GV không thấy việc chưa giao (9.2-10)');
  }));

  check('K3 phân công môn thiếu → cùng lần ghi Case có chủ, lịch sử ghi người phân công; QL hết dòng Phân công', () => thu(() => {
    const c = lopThieu();
    const gvMoi = c.truoc.find((x) => x.skill === c.skill)!.userId;
    classes.setClassTeachers(P.mbManager, LOP, { slots: c.truoc });
    assert(chuCua(c.id) === gvMoi, 'Case về GV vừa phân công môn');
    const ls = one(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' ORDER BY id DESC LIMIT 1`, c.id);
    assert(ls?.actor_user_id === P.mbManager.userId, 'lịch sử ghi người phân công');
    xoaNho();
    assert(!dongCua(P.mbManager, c.id).some((x: any) => x.group === 'no_owner'), 'QL hết dòng Phân công');
  }));

  check('K4 "Xếp lại bài vắng" chỉ hiện khi máy chủ cho đổi lịch (GVCN FT không; GVCN lớp thường, QL có)', () => {
    for (const [ten, p, code] of [['GVCN FT', P.coreTeacher, 'MB FT 101'], ['GVCN lớp thường', P.normalCoreTeacher, 'MB FOU 12'], ['QL', P.mbManager, 'MB FT 101']] as const) {
      const lop = classId(code);
      const sid = one(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`, lop).student_id;
      const ctx = { classId: lop, studentId: sid };
      const laFt = !!one('SELECT is_fast_track f FROM classes WHERE id = ?', lop).f;
      const nut = dm.thaoTacKyNang('vang', { nhapDiem: false, quanLy: perm.can(p, dm.PERMISSIONS.PLAN_WEEK, ctx), gvcn: perm.isCoreTeacherOf(p, lop),
        laFt, dotHoanTat: false }).chinh === 'xep-lai';
      assert(!nut || lich.canMoveSkillSchedule(p, ctx), `${ten}: nút hiện mà máy chủ 403`);
      assert(nut === (ten !== 'GVCN FT'), `${ten}: nút ${nut ? 'có' : 'không'}`);
    }
  });

  check('K5 hạn Mini Test: chi tiết Case trả miniTestHan = hạn dòng "Ghi Mini Test" ở Công việc', () => {
    const m = one(`SELECT m.han, (SELECT MIN(iv.case_id) FROM case_interventions iv WHERE iv.nhom_bo_tro = m.nhom_bo_tro AND iv.kind = 'bo_tro_mien_phi') AS case_id
      FROM mini_test m WHERE m.ty_le IS NULL ORDER BY m.id LIMIT 1`);
    if (!m?.case_id) { console.log('    (demo không có Mini Test chờ — bỏ qua)'); return; }
    const iv = cases.caseDetail(P.admin, m.case_id).interventions.find((x: any) => x.kind === 'bo_tro_mien_phi' && x.miniTestHan);
    assert(iv?.miniTestHan === m.han, `miniTestHan ${iv?.miniTestHan} ≠ ${m.han}`);
    const dong = mywork.myWork(P.admin, { nguoi: 'tat-ca' }).items.find((it: any) => it.group === 'mini_test' && it.caseId === m.case_id);
    if (dong) assert(dong.due === iv.miniTestHan, 'dòng và panel cùng một hạn');
  });

  check('K6 ganChuCaseThieu theo lớp chỉ chạm Case của lớp đó', () => thu(() => {
    const c = caseCuaLop();
    const khac = all(`SELECT sc.id, COALESCE(a.class_id, e.class_id) k FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      LEFT JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
      WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL`).find((r) => r.k !== null && r.k !== LOP);
    assert(khac, 'demo phải có Case mở ở lớp khác');
    conn.prepare('UPDATE sos_cases SET owner_user_id = NULL WHERE id = ?').run(khac.id);
    owner.ganChuCaseThieu({ classId: LOP, actorId: P.mbManager.userId, luc: '2026-10-21T00:00:00Z' });
    assert(chuCua(c.id) !== null, 'Case của lớp có chủ');
    assert(chuCua(khac.id) === null, 'Case lớp khác không bị chạm');
  }));

  check('K6b D11: ganChuCaseThieu gán chủ → updated_at đổi (Sửa Case với mốc cũ → 409 như đổi người)', () => thu(() => {
    const c = caseCuaLop();
    conn.prepare(`UPDATE sos_cases SET owner_user_id = NULL, updated_at = '2026-01-01T00:00:00Z' WHERE id = ?`).run(c.id);
    owner.ganChuCaseThieu({ classId: LOP, actorId: null, luc: '2026-10-21T00:00:00Z' });
    const r = one('SELECT owner_user_id o, updated_at u FROM sos_cases WHERE id = ?', c.id);
    assert(r.o !== null && r.u === '2026-10-21T00:00:00Z', `sau gán: ${JSON.stringify(r)}`);
  }));

  check('K7 hàng đợi: việc kế cùng nhóm, cùng "của tôi", đang hiện, chưa xong; QL không tự mở việc của GV (CV-05, CV-09)', () => {
    const ds = [
      { key: 'a', nhom: 'cham', mine: true }, { key: 'b', nhom: 'case', mine: true }, { key: 'c', nhom: 'cham', mine: false },
      { key: 'd', nhom: 'cham', mine: true }, { key: 'e', nhom: 'cham', mine: true },
    ];
    const ke = (hien: (k: string) => boolean, xong: string[] = []) => dm.viecKeTiep(ds, 'a', (x: any) => hien(x.key) && !xong.includes(x.key))?.key ?? null;
    assert(ke(() => true) === 'd', 'bỏ việc khác nhóm (b) và không phải của tôi (c)');
    assert(ke((k) => k !== 'd') === 'e', 'bỏ việc không hiện (nhóm gập / sau Xem thêm)');
    assert(ke(() => true, ['d', 'e']) === null, 'hết việc → null');
    assert(dm.viecKeTiep(ds, 'zz', () => true) === null, 'việc đang mở không còn trong danh sách → null');
    assert(dm.viecTuMo([{ key: 'g', mine: false }, { key: 'h', mine: true }], { manHep: false, dangMo: false, daTuMo: false }) === null, 'QL: việc đầu của GV → không tự mở');
    assert(dm.viecTuMo([{ key: 'h', mine: true }], { manHep: false, dangMo: false, daTuMo: false }) === 'h', 'việc đầu của tôi → tự mở');
  });

  check('K8 chuyển em có Case không chủ sang lớp đủ GV → Case có chủ cùng giao dịch; số Tổng quan = số dòng Công việc', () => thu(() => {
    const luatLoTrinh: any = require_luat;
    const metrics: any = require_metrics;
    /* Case không chủ, KHÔNG gắn lượt (eff lớp = lớp đang học), của một em lớp thường MB FOU 12; lớp đích MB FOU 15 có GV Reading. */
    const sid = one(`SELECT e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY e.student_id LIMIT 1`, LOP).student_id;
    const den = classId('MB FOU 15');
    assert(one(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND skill = 'reading' AND status = 'active'`, den), 'lớp đích phải có GV Reading');
    const caseId = Number(conn.prepare(`INSERT INTO sos_cases (student_id, category, topic, origin_kind, status, owner_user_id, created_at)
      VALUES (?, 'reading', 'reading', 'teacher_report', 'open', NULL, ?)`).run(sid, '2026-09-01T00:00:00Z').lastInsertRowid);
    /* Trước khi chuyển: lớp nguồn thiếu GV Reading + GVCN → một dòng "Phân công" ở Công việc QL, số Tổng quan khớp số dòng. */
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND status = 'active' AND (skill = 'reading' OR is_core = 1)`).run(LOP);
    xoaNho();
    const dem = () => metrics.metricSet(P.mbManager, 'case-chua-co-nguoi-phu-trach', {}).n;
    const dong = () => mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).items.filter((it: any) => it.group === 'no_owner').length;
    assert(dem() === dong() && dong() >= 1, `trước chuyển: Tổng quan ${dem()} ≠ Công việc ${dong()}`);
    luatLoTrinh.apDungMotDong(P.mbManager, { sid, toClassId: den, ngay: t.TODAY, boiCanh: 'giua-khoa' });
    xoaNho();
    assert(chuCua(caseId) === one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'reading' AND status = 'active'`, den).user_id,
      'Case về GV Reading lớp mới');
    assert(dem() === dong(), `sau chuyển: Tổng quan ${dem()} ≠ Công việc ${dong()}`);
  }));

  check('K9 gán chủ bỏ qua em Lưu trữ / Tạm dừng và Case tạm; Case lớp đủ người nhưng trống chủ có dòng dự phòng "Chọn người phụ trách"', () => thu(() => {
    const c = caseCuaLop();
    const sid = one('SELECT COALESCE(sc.student_id, a.student_id) s FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id = ?', c.id).s;
    /* Dòng dự phòng: lớp đủ người, Case trống (dữ liệu cũ chưa migrate) — vẫn có việc cho QL, số Tổng quan khớp. */
    const ql = dongCua(P.mbManager, c.id);
    assert(ql.length === 1 && ql[0].tieuDe === 'Chọn người phụ trách' && !ql[0].thieuNguoi, `dự phòng: ${JSON.stringify(ql.map((x: any) => x.tieuDe))}`);
    conn.prepare(`UPDATE students SET archived_at = '2026-09-01T00:00:00Z' WHERE id = ?`).run(sid);
    owner.ganChuCaseThieu({ classId: LOP, actorId: null, luc: '2026-10-21T00:00:00Z' });
    assert(chuCua(c.id) === null, 'em Lưu trữ → không gán');
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(sid);
    conn.prepare('UPDATE sos_cases SET tam = 1 WHERE id = ?').run(c.id);
    owner.ganChuCaseThieu({ classId: LOP, actorId: null, luc: '2026-10-21T00:00:00Z' });
    assert(chuCua(c.id) === null, 'Case tạm → không gán');
  }));

  check('K10 GVBM lớp thường: bảng lớp trả cờ đổi lịch đúng môn mình → có nút "Xếp lại bài vắng"; môn khác thì không', () => {
    const regular: any = require_regular;
    const gv = P.normalSubjectTeacher;
    const mon = one(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND is_core = 0 LIMIT 1`, LOP, gv.userId)?.skill;
    assert(mon, 'GVBM phải dạy một môn ở MB FOU 12');
    const sheet = regular.regularSheet(gv, LOP);
    const o = sheet.rows[0].skillSchedule as any[];
    const nut = (k: string) => dm.thaoTacKyNang('vang', { nhapDiem: false, quanLy: !!sheet.canPlan, gvcn: !!sheet.laGvcn, laFt: false, dotHoanTat: false,
      doiLich: o.find((x) => x.skill === k)?.doiLich }).chinh === 'xep-lai';
    assert(nut(mon), `GVBM môn ${mon}: phải có nút`);
    const khac = o.find((x) => x.skill !== mon && !one(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND (skill = ? OR is_core = 1)`, LOP, gv.userId, x.skill));
    if (khac) assert(!nut(khac.skill), `môn ${khac.skill} không dạy: không có nút`);
  });
}
