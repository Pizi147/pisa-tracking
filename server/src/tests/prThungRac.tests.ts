/** PHÉP KIỂM Q-RL2a THÙNG RÁC (N24 ②, chủ SP 29/10) — Xoá Case / PA / vi phạm / tệp → Khôi phục: dữ liệu y hệt từng bảng; thiếu cha / trùng id báo lý do; quyền. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrThungRacTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const att: any = await import('../platform/attachments.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const rac: any = await import('../platform/thungRac.ts');
  const kp: any = await import('../platform/khoiPhucRac.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const hl: any = await import('../students/hangLoat.ts');
  console.log('\nQ-RL2a THUNG-RAC · xoá → Hoàn tác / Khôi phục');

  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const chuLoi = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };

  const LOP = classId('MB FT 101');
  const mb = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let so = 0;
  const moiEm = (): number => {
    so += 1;
    const tag = `TR-${so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const taoCase = (sid: number) => cases.reportIssue(P.lrTeacher, {
    studentId: sid, topic: 'listening', title: `Nghe sót số liệu ${so}`, summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
    primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `tr-case-${so}-${Math.random()}`,
  }).id as number;
  const themPa = (caseId: number, o: Record<string, unknown> = {}) => {
    const r = cases.recordIntervention(P.lrTeacher, caseId, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY, ...o,
    });
    return Math.max(...r.interventions.map((i: any) => i.id)) as number;
  };
  const QL = P.mbManager;

  /** Ảnh mọi bảng nghiệp vụ (bỏ nhật ký / chuông / thùng rác / cấu hình — chỉ ghi thêm). So trước xoá và sau khôi phục. */
  const BO = new Set(['audit_logs', 'notifications', 'thung_rac', 'demo_config', 'sqlite_sequence']);
  const anh = () => Object.fromEntries((hang(`SELECT name FROM sqlite_master WHERE type = 'table'`) as any[])
    .filter((x) => !BO.has(x.name)).map((x) => [x.name, JSON.stringify(hang(`SELECT * FROM ${x.name}`).map((r) => JSON.stringify(r)).sort())]));   // không theo thứ tự: bảng khoá ghép (measure_violations) chèn lại được rowid mới
  const soAnh = (a: Record<string, string>, b: Record<string, string>) => Object.keys(a).filter((k) => a[k] !== b[k]);

  check('TR-1 · Xoá Case báo tay (PA + thẻ chờ + tệp) → Khôi phục: mọi bảng y hệt; mục thùng rác ghi người / lúc khôi phục; khôi phục lần hai 409', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = themPa(caseId, { kind: 'extra_support', description: 'Học kèm 1-1 với Tutor 2 buổi/tuần', status: 'planned', startedDate: undefined });
    att.addLink(P.lrTeacher, { ownerType: 'sos_case', ownerId: caseId, url: 'https://example.com/a' });
    att.addLink(P.lrTeacher, { ownerType: 'case_intervention', ownerId: ivId, url: 'https://example.com/b' });
    const truoc = anh();
    const r = cases.xoaCase(QL, caseId);
    assert(r.thungRacId && !mot('SELECT 1 FROM sos_cases WHERE id = ?', caseId), 'đã xoá + có mục thùng rác');
    kp.khoiPhucRac(QL, r.thungRacId);
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `bảng lệch sau khôi phục: ${lech.join(', ')}`);
    const m = mot('SELECT * FROM thung_rac WHERE id = ?', r.thungRacId);
    assert(m.khoi_phuc_boi === QL.userId && m.khoi_phuc_luc && m.loai === 'case', JSON.stringify(m));
    assert(maLoi(() => kp.khoiPhucRac(QL, r.thungRacId)) === 409, 'khôi phục lần hai');
  }));

  check('TR-2 · Xoá PA ĐÃ CÓ kết quả → Khôi phục: PA + kết quả tuần + Case y hệt', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = themPa(caseId);
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Đúng 15/20 câu điền số tuần này', soBuoi: 0 });
    assert(mot('SELECT 1 FROM case_followups WHERE intervention_id = ?', ivId), 'chưa có kết quả');
    const truoc = anh();
    const r = cases.xoaPa(QL, ivId);
    assert(!mot('SELECT 1 FROM case_followups WHERE intervention_id = ?', ivId), 'kết quả chưa đi theo PA');
    kp.khoiPhucRac(QL, r.thungRacId);
    /* Case được đồng bộ lại trạng thái theo PA (cùng `dongBoTrangThaiCase`) — chỉ `updated_at` được phép đổi. */
    const boGio = (j: string) => JSON.stringify(JSON.parse(j).map((x: string) => ({ ...JSON.parse(x), updated_at: null })));
    const sau = anh();
    const lech = soAnh(truoc, sau).filter((k) => k !== 'sos_cases' || boGio(truoc[k]) !== boGio(sau[k]));
    assert(!lech.length, `bảng lệch: ${lech.join(', ')}`);
  }));

  check('TR-3 · Thiếu cha: PA đã xoá, rồi Case cũng xoá → khôi phục PA 409 "khôi phục mục gốc trước"; khôi phục Case rồi PA → được', () => thu(() => {
    const caseId = taoCase(moiEm());
    const ivId = themPa(caseId);
    const rPa = cases.xoaPa(QL, ivId);
    const rCase = cases.xoaCase(QL, caseId);
    assert(/khôi phục mục gốc trước/.test(chuLoi(() => kp.khoiPhucRac(QL, rPa.thungRacId))), 'thiếu cha phải báo lý do');
    assert(!mot('SELECT khoi_phuc_luc FROM thung_rac WHERE id = ?', rPa.thungRacId).khoi_phuc_luc, 'không khôi phục nửa chừng');
    kp.khoiPhucRac(QL, rCase.thungRacId);
    kp.khoiPhucRac(QL, rPa.thungRacId);
    assert(mot('SELECT 1 FROM case_interventions WHERE id = ? AND case_id = ?', ivId, caseId), 'PA về Case');
  }));

  check('TR-4 · Trùng id: Case mới chiếm lại id của Case đã xoá → khôi phục 409 nói rõ, dữ liệu mới giữ nguyên', () => thu(() => {
    const sid = moiEm();
    const caseId = taoCase(sid);
    const r = cases.xoaCase(QL, caseId);
    const moi = taoCase(sid);
    if (moi !== caseId) return;   // id không bị dùng lại (bảng AUTOINCREMENT) — không có ca trùng
    assert(/dùng lại chỗ/.test(chuLoi(() => kp.khoiPhucRac(QL, r.thungRacId))), 'trùng id phải báo');
    assert(mot('SELECT title FROM sos_cases WHERE id = ?', moi), 'Case mới mất');
  }));

  check('TR-5 · Quyền như thao tác gốc: GV không khôi phục Case / PA (403), không thấy mục ở Đã xoá; QL thấy + khôi phục được; Quản trị thấy mọi mục', () => thu(() => {
    const r = cases.xoaCase(QL, taoCase(moiEm()));
    assert(maLoi(() => kp.khoiPhucRac(P.lrTeacher, r.thungRacId)) === 403, 'GV khôi phục Case');
    assert(!kp.danhSachRac(P.lrTeacher).some((x: any) => x.id === r.thungRacId), 'GV thấy mục Case');
    const ql = kp.danhSachRac(QL).find((x: any) => x.id === r.thungRacId);
    assert(ql?.khoiPhucDuoc === true && ql.loai === 'case', `QL: ${JSON.stringify(ql)}`);
    assert(kp.danhSachRac(P.admin).some((x: any) => x.id === r.thungRacId), 'Quản trị không thấy');
  }));

  await checkAsync('TR-6 · Xoá vi phạm (có tệp liên kết) → Khôi phục y hệt; gỡ tệp bằng chứng → Khôi phục dòng tệp', async () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
    const sid = moiEm();
    const v = viol.recordViolation(P.mbManager, { studentId: sid, category: 'homework', description: 'Không nộp bài Writing Task 2 buổi này' } as any) as any;
    const vid = v.id ?? v.violation?.id;
    att.addLink(P.mbManager, { ownerType: 'violation', ownerId: vid, url: 'https://example.com/v' });
    const truoc = anh();
    const r = viol.deleteViolation(P.mbManager, vid);
    kp.khoiPhucRac(P.mbManager, r.thungRacId);
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `vi phạm lệch: ${lech.join(', ')}`);
    const tep = mot(`SELECT id FROM attachments WHERE owner_type = 'violation' AND owner_id = ?`, vid).id;
    const truoc2 = anh();
    const x = await att.removeAttachment(P.mbManager, tep);
    assert(!mot('SELECT 1 FROM attachments WHERE id = ?', tep), 'tệp chưa gỡ');
    kp.khoiPhucRac(P.mbManager, x.thungRacId);
    assert(!soAnh(truoc2, anh()).length, 'tệp lệch');
    } finally { conn.exec('ROLLBACK'); }
  });

  check('TR-7 · Dọn thùng rác: mục quá 30 ngày → hết hạn (bỏ bản chụp), khôi phục 409; mục mới giữ', () => thu(() => {
    const r1 = cases.xoaCase(QL, taoCase(moiEm()));
    const r2 = cases.xoaCase(QL, taoCase(moiEm()));
    conn.prepare('UPDATE thung_rac SET xoa_luc = ? WHERE id = ?').run(new Date(Date.now() - 31 * 86_400_000).toISOString(), r1.thungRacId);
    rac.donThungRac();
    assert(mot('SELECT het_han_luc FROM thung_rac WHERE id = ?', r1.thungRacId).het_han_luc, 'mục cũ chưa hết hạn');
    assert(!mot('SELECT het_han_luc FROM thung_rac WHERE id = ?', r2.thungRacId).het_han_luc, 'mục mới bị dọn');
    assert(/quá 30 ngày/.test(chuLoi(() => kp.khoiPhucRac(QL, r1.thungRacId))), 'khôi phục mục hết hạn');
  }));

  // ---------------------------------------------------------------- Q-RL2b · Xoá học viên
  /** Em seed MB có nhiều dữ liệu nhất (lượt Test, Case, vi phạm…) — đụng nhiều bảng nhất trong ~47 bảng của em. */
  const emGiau = (branch = 'MB') => mot(`SELECT s.id, s.student_code ma FROM students s JOIN branches b ON b.id = s.branch_id WHERE b.code = ?
      ORDER BY (SELECT COUNT(*) FROM assessment_attempts a WHERE a.student_id = s.id) + 3 * (SELECT COUNT(*) FROM sos_cases c WHERE c.student_id = s.id)
        + 3 * (SELECT COUNT(*) FROM violations v WHERE v.student_id = s.id) DESC LIMIT 1`, branch);
  const soBangCo = (sid: number) => xoaHV.BANG_CUA_HOC_VIEN.filter((b: string) => {
    try { return !!mot(`SELECT 1 FROM ${b} WHERE ${b === 'students' ? 'id' : 'student_id'} = ? LIMIT 1`, sid); } catch { return false; }
  }).length;

  check('TR-8 · Xoá MỘT học viên nhiều dữ liệu (≥ 8 bảng của em) → Khôi phục: mọi bảng nghiệp vụ y hệt; quyền khôi phục như Xoá (GV 403)', () => thu(() => {
    const em = emGiau();
    const n = soBangCo(em.id);
    assert(n >= 8, `em seed chỉ có dữ liệu ở ${n} bảng`);
    const truoc = anh();
    const r = xoaHV.xoaHocVien(QL, em.id, { maXacNhan: em.ma });
    assert(r.thungRacId && !mot('SELECT 1 FROM students WHERE id = ?', em.id), 'chưa xoá');
    assert(maLoi(() => kp.khoiPhucRac(P.lrTeacher, r.thungRacId)) === 403, 'GV khôi phục học viên');
    kp.khoiPhucRac(QL, r.thungRacId);
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `bảng lệch sau khôi phục HV: ${lech.join(', ')}`);
  }));

  check('TR-9 · Xoá HÀNG LOẠT lỗi một phần: em trong phạm vi xoá + chụp (mỗi em một mục), em ngoài phạm vi giữ nguyên; Khôi phục các mục → y hệt', () => thu(() => {
    const a = moiEm(), b = moiEm();
    const ngoai = emGiau('CP');
    assert(ngoai, 'không có em chi nhánh CP');
    const truoc = anh();
    const kq = hl.chay(QL, { viec: 'xoa', studentIds: [a, ngoai.id, b], xacNhan: d.CHU_XAC_NHAN_XOA });
    assert(kq.ok.length === 2 && kq.failed.length === 1 && kq.failed[0].studentId === ngoai.id && kq.thungRac?.length === 2, JSON.stringify(kq));
    assert(mot('SELECT 1 FROM students WHERE id = ?', ngoai.id) && !mot('SELECT 1 FROM students WHERE id = ?', a), 'em lỗi phải giữ, em đúng phải xoá');
    for (const id of kq.thungRac) kp.khoiPhucRac(QL, id);
    const lech = soAnh(truoc, anh());
    assert(!lech.length, `bảng lệch: ${lech.join(', ')}`);
  }));
}
