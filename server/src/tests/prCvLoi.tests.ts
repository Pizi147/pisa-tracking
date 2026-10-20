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
  const { migratePrCvLoi } = await import('../migrate/prCvLoi.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
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
    migratePrCvLoi(conn, a2);
    assert(!a2.length && all(`SELECT 1 FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id'`, c.id).length === 1, 'lần hai không ghi gì');
  }));

  /** Lớp thiếu cả GV môn của Case lẫn GVCN → Case vẫn không chủ sau migrate. */
  const lopThieu = () => {
    const c = caseCuaLop();
    /* Người vừa bỏ (GV môn + GVCN) — K3 phân công lại đúng họ: bức tranh hợp lệ chắc chắn, không phụ thuộc dữ liệu phép kiểm khác. */
    const daBo = all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND (skill = ? OR is_core = 1)`, LOP, c.skill)
      .map((a) => ({ userId: a.user_id as number, skill: a.skill as string | null, isCore: a.is_core === 1 }));
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND status = 'active' AND (skill = ? OR is_core = 1)`).run(LOP, c.skill);
    xoaNho();
    migratePrCvLoi(conn, []);
    assert(chuCua(c.id) === null, 'lớp không ai dạy môn / chủ nhiệm → Case vẫn chưa có chủ');
    return { ...c, daBo };
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
    const gvMoi = c.daBo.find((x) => x.skill === c.skill)!.userId;
    const hien = all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, LOP)
      .map((a) => ({ userId: a.user_id, skill: a.skill, isCore: a.is_core === 1 }));
    classes.setClassTeachers(P.mbManager, LOP, { slots: [...hien, ...c.daBo] });
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
}
