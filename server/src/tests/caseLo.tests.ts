/**
 * PHÉP KIỂM CASE-NHIEU — Tạo Case nhiều kỹ năng một lần (05 mục 7.1b · 02 B16, C21 · v4d FB-4-35).
 * Lô = n Case độc lập trong MỘT giao dịch (tất cả hoặc không); khoá gửi đôi theo lô + kỹ năng; `case-topics` trả `dangMo` + `phuTrach`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runCaseLoTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const tep: any = await import('../platform/attachments.ts');
  const { suggestCaseOwner } = await import('../cases/owner.ts');
  const { awaitingCauseCaseIds } = await import('../cases/sosState.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nCASE-NHIEU · Tạo Case nhiều kỹ năng: một giao dịch, người phụ trách theo kỹ năng, trùng / chờ xác nhận, gửi lại, quyền, tệp');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `CASELO HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `caselo-${seq}` });
    return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };
  const soCase = (sid: number) => get('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', sid).n as number;
  const nn = (topic: string) => d.issuesForTopic(topic)[0].code as string;
  const the = (topic: string, x: Record<string, unknown> = {}) => ({
    topic, primaryCode: nn(topic), title: `Case ${topic} thử lô`, summary: `Em vướng ${topic} ở bài tuần này, sai nhiều câu.`, ...x,
  });
  const lop = classId('MB FT 101');
  const sid = emMoi('MB FT 101');
  const soCaseDau = soCase(sid);

  check('CASE-NHIEU (a) · lô W1 + S → 2 Case, mỗi Case người phụ trách = GV môn đó, hạn bằng Case một kỹ năng cùng mức', () => thu(() => {
    const r = cases.reportIssues(P.coreTeacher, { studentId: sid, urgency: 'urgent', idempotencyKey: 'lo-a', kyNang: [the('writing1'), the('speaking')] });
    assert(r.cases.length === 2 && soCase(sid) === soCaseDau + 2, `số Case: ${r.cases.length} / ${soCase(sid)}`);
    for (const c of r.cases) {
      const row = get('SELECT owner_user_id, topic, urgency, reported_by FROM sos_cases WHERE id = ?', c.id);
      const mong = suggestCaseOwner({ classId: lop, category: d.categoryOf(row.topic) });
      assert(row.owner_user_id === mong && mong !== null, `${row.topic}: chủ ${row.owner_user_id} ≠ ${mong}`);
      assert(row.urgency === 'urgent' && row.reported_by === P.coreTeacher.userId, `${row.topic}: mức / người tạo`);
    }
    assert(r.cases[0].topic === 'writing1' && r.cases[1].topic === 'speaking', 'đúng thứ tự thẻ');
    const don = cases.reportIssue(P.coreTeacher, { studentId: sid, urgency: 'urgent', idempotencyKey: 'lo-a-don', ...the('writing2') });
    assert(don.viecTiep?.han && r.cases.every((c: any) => c.viecTiep?.han === don.viecTiep.han), `hạn: ${r.cases.map((c: any) => c.viecTiep?.han)} / ${don.viecTiep?.han}`);
  }));

  check('CASE-NHIEU (b, e) · L trùng chọn "Ghi vào" + R → 1 Case mới + 1 ghi thêm; gửi lại cùng khoá không thêm Case, không lặp chữ', () => thu(() => {
    const cu = cases.reportIssue(P.lrTeacher, { studentId: sid, idempotencyKey: 'lo-b-cu', ...the('listening') });
    const truoc = soCase(sid);
    const lo = { studentId: sid, urgency: 'attention', idempotencyKey: 'lo-b', kyNang: [the('listening', { gop: 'ghi-vao', title: '', summary: 'Ghi thêm: nghe sót số ở Part 1.' }), the('reading')] };
    const r = cases.reportIssues(P.lrTeacher, lo);
    assert(soCase(sid) === truoc + 1, `số Case: ${soCase(sid)} / ${truoc + 1}`);
    assert(r.cases[0].id === cu.id && r.cases[0].gop === true && r.cases[1].gop === false, 'thẻ L ghi vào Case cũ');
    const note = get('SELECT note FROM sos_cases WHERE id = ?', cu.id).note as string;
    assert(note.includes('nghe sót số'), `chữ ghi thêm: ${note}`);
    const lai = cases.reportIssues(P.lrTeacher, lo);
    assert(soCase(sid) === truoc + 1 && lai.cases.map((c: any) => c.id).join() === r.cases.map((c: any) => c.id).join(), 'gửi lại: cùng id');
    assert(get('SELECT note FROM sos_cases WHERE id = ?', cu.id).note === note, 'gửi lại: không lặp chữ ghi thêm');
  }));

  check('CASE-NHIEU (c) · một kỹ năng đang có Case chờ xác nhận → 400 đúng kỹ năng, 0 Case', () => thu(() => {
    const mo = conn.prepare(`SELECT sc.id, sc.student_id, sc.topic FROM sos_cases sc JOIN students s ON s.id = sc.student_id
      WHERE sc.status != 'done' AND sc.topic IS NOT NULL AND s.archived_at IS NULL`).all() as any[];
    const cho = new Set(awaitingCauseCaseIds(mo.map((c) => c.id)));
    const theCua = (ct: any, k: string, x: Record<string, unknown> = {}) => ({ ...the(k, x), primaryCode: d.issuesForTopic(k, ct.chuongTrinh)[0].code });
    /* Case mà đường MỘT kỹ năng (không "mở riêng") đã chặn vì chờ xác nhận — dữ liệu các phép kiểm trước để lại thì có Case chờ ở lộ trình / chương trình cũ, máy chủ không tính. */
    const c = mo.find((x) => {
      if (!cho.has(x.id)) return false;
      const ct = cases.caseTopicsOf(P.admin, x.student_id);
      return !!loiCua(() => cases.reportIssue(P.admin, { studentId: x.student_id, urgency: 'attention', ...theCua(ct, x.topic) }))?.details?.caseChoNguyenNhan;
    });
    assert(c, 'seed phải có Case chờ xác nhận');
    const ct = cases.caseTopicsOf(P.admin, c.student_id);
    const khac = ct.topics.find((k: string) => k !== c.topic && !ct.choNguyenNhan[k]);
    /* "Mở riêng" (`gop: 'rieng'`) không lách được luật chờ xác nhận ở đường lô. */
    const theCt = (k: string) => theCua(ct, k, { gop: 'rieng' });
    const truoc = soCase(c.student_id);
    const e = loiCua(() => cases.reportIssues(P.admin, { studentId: c.student_id, urgency: 'attention', idempotencyKey: 'lo-c',
      kyNang: [theCt(khac), theCt(c.topic)] }));
    assert(e?.status === 400 && e.details?.kyNang === c.topic && e.details?.caseChoNguyenNhan, `Case ${c.id} (${c.topic}): lỗi ${e?.status} ${JSON.stringify(e?.details)}`);
    assert(soCase(c.student_id) === truoc, '0 Case mới');
  }));

  check('CASE-NHIEU (d) · thẻ R tên 3 ký tự → 400 đúng kỹ năng, Case L cũng không tạo', () => thu(() => {
    const e = loiCua(() => cases.reportIssues(P.lrTeacher, { studentId: sid, urgency: 'attention', idempotencyKey: 'lo-d',
      kyNang: [the('listening'), the('reading', { title: 'abc' })] }));
    assert(e?.status === 400 && e.details?.kyNang === 'reading', `lỗi: ${e?.status} ${JSON.stringify(e?.details)}`);
    assert(soCase(sid) === soCaseDau, `0 Case: ${soCase(sid)}`);
  }));

  check('CASE-NHIEU (f) · QL chi nhánh khác → 403 cả lô, 0 Case', () => thu(() => {
    const e = loiCua(() => cases.reportIssues(P.cpManager, { studentId: sid, urgency: 'attention', idempotencyKey: 'lo-f', kyNang: [the('listening'), the('reading')] }));
    assert(e?.status === 403 && soCase(sid) === soCaseDau, `lỗi: ${e?.status} · ${soCase(sid)}`);
  }));

  check('CASE-NHIEU (g) · lô rỗng / trùng kỹ năng / quá số kỹ năng → 400', () => thu(() => {
    let n = 0;
    const goi = (kyNang: unknown) => loiCua(() => cases.reportIssues(P.lrTeacher, { studentId: sid, urgency: 'attention', idempotencyKey: `lo-g-${++n}`, kyNang }))?.status;
    assert(goi([]) === 400, 'rỗng');
    assert(goi('listening') === 400, 'không phải mảng');
    assert(goi([the('listening'), the('listening')]) === 400, 'trùng');
    assert(goi(Array.from({ length: 6 }, (_, i) => the(['listening', 'reading', 'writing1', 'writing2', 'speaking', 'writing'][i]))) === 400, 'quá số');
    assert(soCase(sid) === soCaseDau, '0 Case');
  }));

  check('CASE-NHIEU (h) · bằng chứng chép sang mọi Case của lô (người tạo, Case về GV khác)', () => thu(() => {
    const r = cases.reportIssues(P.coreTeacher, { studentId: sid, urgency: 'attention', idempotencyKey: 'lo-h', kyNang: [the('writing1'), the('speaking')] });
    const [dau, sau] = r.cases.map((c: any) => c.id);
    assert(r.cases.every((c: any) => c.canEdit), 'người tạo sửa được (đính kèm) mọi Case vừa tạo');
    const goc = tep.addLink(P.coreTeacher, { ownerType: 'sos_case', ownerId: dau, url: 'https://example.com/bai-lam', displayName: 'Bài làm' });
    tep.chepTep(P.coreTeacher, { tuId: goc.id, ownerType: 'sos_case', ownerIds: [sau] });
    const n = get(`SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND url = ? AND owner_id IN (?, ?)`, 'https://example.com/bai-lam', dau, sau).n;
    assert(n === 2, `tệp gắn: ${n}`);
  }));

  check('CASE-NHIEU (i) · case-topics: dangMo theo kỹ năng (khoá trùng như reportIssue) + phuTrach = suggestCaseOwner', () => thu(() => {
    const cu = cases.reportIssue(P.lrTeacher, { studentId: sid, idempotencyKey: 'lo-i', ...the('listening') });
    const ct = cases.caseTopicsOf(P.lrTeacher, sid);
    assert(ct.dangMo?.listening?.id === cu.id && ct.dangMo.listening.title === cu.title && ct.dangMo.listening.soPa === 0, `dangMo: ${JSON.stringify(ct.dangMo)}`);
    assert(!ct.dangMo.reading, 'R chưa có Case');
    for (const k of ct.topics) {
      const mong = suggestCaseOwner({ classId: lop, category: d.categoryOf(k) });
      assert((ct.phuTrach?.[k]?.id ?? null) === mong, `${k}: ${ct.phuTrach?.[k]?.id} ≠ ${mong}`);
      assert(!mong || ct.phuTrach[k].ten, `${k}: thiếu tên`);
    }
  }));
}
