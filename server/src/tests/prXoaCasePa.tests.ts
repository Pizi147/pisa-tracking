/**
 * XOA-CASE-PA (N37, chủ SP 05/11) — xoá Case / PA thoải mái hơn: Case đã có PA + kết quả xoá được (PA, kết quả vào Thùng rác CÙNG mục, khôi phục đủ);
 * người sửa được Case / ghi được PA xoá thẳng; PA theo quy chế và Case hệ thống (trạng thái SOS) → thẻ Chờ duyệt, QL duyệt mới xoá (QL xoá thẳng);
 * Huỷ quyết định Duyệt = Khôi phục. Mọi ca chạy trong giao dịch rồi cuộn lại.
 */
export async function runPrXoaCasePaTests(t: any) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const kp: any = await import('../platform/khoiPhucRac.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nXOA-CASE-PA (N37) · xoá Case / PA · xin QL duyệt · khôi phục');

  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const LOP = classId('MB FT 101');
  const mb = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let so = 0;
  const moiEm = (): number => {
    const tag = `XCP-${++so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const taoCase = () => cases.reportIssue(P.lrTeacher, {
    studentId: moiEm(), topic: 'listening', title: `Nghe sót số liệu ${so}`, summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
    primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `xcp-case-${so}-${Math.random()}`,
  }).id as number;
  const themPa = (caseId: number) => {
    const r = cases.recordIntervention(P.lrTeacher, caseId, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY,
    });
    return Math.max(...r.interventions.map((i: any) => i.id)) as number;
  };
  const ketQua = (ivId: number, note: string) =>
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note, soBuoi: 0 });
  /** Ảnh mọi bảng nghiệp vụ (bỏ nhật ký / chuông / thùng rác / thẻ / cấu hình) — so trước xoá và sau khôi phục. */
  const BO = new Set(['audit_logs', 'notifications', 'thung_rac', 'yeu_cau_duyet', 'ghi_dao', 'demo_config', 'sqlite_sequence']);
  const anh = () => Object.fromEntries((hang(`SELECT name FROM sqlite_master WHERE type = 'table'`) as any[])
    .filter((x) => !BO.has(x.name)).map((x) => [x.name, JSON.stringify(hang(`SELECT * FROM ${x.name}`).map((r) => JSON.stringify(r)).sort())]));
  const khac = (a: Record<string, string>, b: Record<string, string>) => Object.keys(a).filter((k) => a[k] !== b[k]);
  const theCho = (loai: string, id: number) => mot(`SELECT * FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? AND trang_thai = 'cho'`, loai, id);
  const QL = P.mbManager;

  check('XCP-1 · GV môn xoá thẳng Case có 2 PA + 3 kết quả → một mục Thùng rác; GV đó Khôi phục → mọi bảng y hệt', () => thu(() => {
    const caseId = taoCase();
    const iv1 = themPa(caseId);
    const iv2 = themPa(caseId);
    ketQua(iv1, 'Đúng 15/20 câu điền số tuần này'); ketQua(iv1, 'Đúng 17/20 câu điền số tuần này'); ketQua(iv2, 'Nghe chép đủ 5 buổi');
    const dt = cases.caseDetail(P.lrTeacher, caseId);
    assert(dt.viewer.xoa === 'ngay' && dt.viewer.choXoa === false, `cờ Case: ${JSON.stringify(dt.viewer.xoa)}`);
    assert(dt.interventions.every((i: any) => i.xoa === 'ngay'), 'cờ PA');
    const truoc = anh();
    const r = cases.xoaCase(P.lrTeacher, caseId);
    assert(r.thungRacId > 0 && !mot('SELECT 1 FROM sos_cases WHERE id = ?', caseId), 'chưa xoá');
    assert(hang('SELECT 1 FROM case_followups WHERE case_id = ?', caseId).length === 0 && hang('SELECT 1 FROM case_interventions WHERE case_id = ?', caseId).length === 0, 'PA / kết quả còn');
    assert(mot('SELECT COUNT(*) n FROM thung_rac WHERE id >= ?', r.thungRacId).n === 1, 'một mục cho cả lô');
    assert(maLoi(() => kp.khoiPhucRac(P.w1Teacher, r.thungRacId)) === 403, 'GV Writing khôi phục được Case Listening');
    kp.khoiPhucRac(P.lrTeacher, r.thungRacId);
    const lech = khac(truoc, anh());
    assert(lech.length === 0, `khôi phục lệch bảng: ${lech.join(', ')}`);
  }));

  check('XCP-2 · Quyền: GV môn khác / QL chi nhánh khác 403 (Case + PA); GVCN lớp em xoá thẳng; QL thấy "ngay"', () => thu(() => {
    const caseId = taoCase();
    const iv = themPa(caseId);
    for (const ai of [P.w1Teacher, P.cpManager]) {
      assert(maLoi(() => cases.xoaCase(ai, caseId)) === 403 && maLoi(() => cases.xoaPa(ai, iv)) === 403, `${ai.userId} xoá được`);
    }
    assert(cases.caseDetail(QL, caseId).viewer.xoa === 'ngay' && cases.caseDetail(P.coreTeacher, caseId).viewer.xoa === 'ngay', 'QL / GVCN');
    assert(cases.caseDetail(P.w1Teacher, caseId).viewer.xoa === null, 'GV Writing thấy nút Xoá');
    const r = cases.xoaPa(P.coreTeacher, iv);
    assert(r.thungRacId > 0 && !mot('SELECT 1 FROM case_interventions WHERE id = ?', iv), 'GVCN xoá PA');
  }));

  check('XCP-3 · PA theo quy chế: GV → thẻ "Xoá PA" (PA còn, gửi lại 400, Rút được); QL Từ chối giữ PA; QL Duyệt → Thùng rác; Huỷ quyết định = khôi phục', () => thu(() => {
    const caseId = taoCase();
    const iv = themPa(caseId);
    ketQua(iv, 'Đúng 15/20 câu điền số tuần này');
    /* PA theo quy chế (máy sinh khi có SOS), GV đã xác nhận — đang chạy. */
    conn.prepare('UPDATE case_interventions SET preset = 1, confirmed_by = ?, confirmed_at = ? WHERE id = ?').run(P.lrTeacher.userId, TODAY, iv);
    const pa = (p: any) => cases.caseDetail(p, caseId).interventions.find((i: any) => i.id === iv);
    assert(pa(P.lrTeacher).xoa === 'xin' && pa(QL).xoa === 'ngay', `cờ: GV ${pa(P.lrTeacher).xoa} · QL ${pa(QL).xoa}`);
    const r = cases.xoaPa(P.lrTeacher, iv, { lyDo: 'Tạo nhầm em' });
    assert(r.choDuyet === true && mot('SELECT 1 FROM case_interventions WHERE id = ?', iv), 'GV xoá thẳng PA quy chế');
    assert(pa(P.lrTeacher).choXoa === true, 'cờ choXoa');
    assert(maLoi(() => cases.xoaPa(P.lrTeacher, iv)) === 400, 'gửi lại lần hai');
    const the = theCho('xoa_pa', iv);
    assert(the && the.ly_do === 'Tạo nhầm em' && the.nguoi_xin === P.lrTeacher.userId, JSON.stringify(the));
    const hop = yc.hopChoDuyet(QL, {}).the.find((x: any) => x.id === the.id);
    assert(hop && /^Xoá PA · Tự học Listening/.test(hop.tieuDe) && hop.mo.includes(`pa=${iv}`) && /1 kết quả PA vào Thùng rác/.test(hop.neuDuyet), JSON.stringify(hop));
    /* Rút → thẻ đóng; gửi lại được. */
    yc.rutYeuCau(P.lrTeacher, the.id);
    assert(!theCho('xoa_pa', iv), 'Rút chưa đóng thẻ');
    cases.xoaPa(P.lrTeacher, iv);
    /* Từ chối → PA giữ nguyên. */
    yc.tuChoiYeuCau(QL, theCho('xoa_pa', iv).id, 'PA quy chế còn chạy');
    assert(mot('SELECT 1 FROM case_interventions WHERE id = ?', iv), 'Từ chối mà PA mất');
    /* Duyệt → PA + kết quả vào Thùng rác; thẻ "duyet" giữ id Thùng rác. */
    cases.xoaPa(P.lrTeacher, iv);
    const id = theCho('xoa_pa', iv).id;
    const truoc = anh();
    yc.duyetYeuCau(QL, id);
    const daDuyet = mot('SELECT trang_thai, du_lieu FROM yeu_cau_duyet WHERE id = ?', id);
    assert(daDuyet.trang_thai === 'duyet' && JSON.parse(daDuyet.du_lieu).thungRacId > 0, JSON.stringify(daDuyet));
    assert(!mot('SELECT 1 FROM case_interventions WHERE id = ?', iv) && !mot('SELECT 1 FROM case_followups WHERE intervention_id = ?', iv), 'Duyệt chưa xoá');
    /* GV không khôi phục được PA quy chế (xoá cần QL) — QL Huỷ quyết định = khôi phục, thẻ về chờ. */
    assert(maLoi(() => kp.khoiPhucRac(P.lrTeacher, JSON.parse(daDuyet.du_lieu).thungRacId)) === 403, 'GV khôi phục PA quy chế');
    yc.huyQuyetDinh(QL, id);
    assert(mot('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho', 'Huỷ quyết định: thẻ chưa về chờ');
    /* Case đồng bộ lại trạng thái theo PA (`dongBoTrangThaiCase`) — chỉ `updated_at` được đổi (như TR-2). */
    const boGio = (j: string) => JSON.stringify(JSON.parse(j).map((x: string) => ({ ...JSON.parse(x), updated_at: null })));
    const sau = anh();
    const lech = khac(truoc, sau).filter((k) => k !== 'sos_cases' || boGio(truoc[k]) !== boGio(sau[k]));
    assert(lech.length === 0, `Huỷ quyết định lệch bảng: ${lech.join(', ')}`);
  }));

  check('XCP-4 · Case hệ thống (trạng thái SOS) / Case báo tay có PA quy chế: GV → thẻ "Xoá Case"; QL Duyệt → Case + PA vào Thùng rác; QL xoá thẳng', () => thu(() => {
    const caseId = taoCase();
    themPa(caseId);
    conn.prepare(`UPDATE sos_cases SET origin_kind = 'mock' WHERE id = ?`).run(caseId);   // Case sinh từ kết quả Test (trạng thái SOS)
    assert(cases.caseDetail(P.lrTeacher, caseId).viewer.xoa === 'xin' && cases.caseDetail(QL, caseId).viewer.xoa === 'ngay', 'cờ Case SOS');
    const r = cases.xoaCase(P.lrTeacher, caseId);
    assert(r.choDuyet === true && mot('SELECT 1 FROM sos_cases WHERE id = ?', caseId), 'GV xoá thẳng Case SOS');
    assert(cases.caseDetail(P.lrTeacher, caseId).viewer.choXoa === true, 'cờ choXoa Case');
    const the = theCho('xoa_case', caseId);
    assert(the && JSON.parse(the.du_lieu).soPa === 1, JSON.stringify(the));
    yc.duyetYeuCau(QL, the.id);
    assert(!mot('SELECT 1 FROM sos_cases WHERE id = ?', caseId) && mot('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', the.id).trang_thai === 'duyet', 'Duyệt');
    /* Case báo tay còn PA quy chế → xin; QL xoá thẳng. */
    const c2 = taoCase();
    const iv2 = themPa(c2);
    conn.prepare('UPDATE case_interventions SET preset = 1 WHERE id = ?').run(iv2);
    assert(cases.caseDetail(P.lrTeacher, c2).viewer.xoa === 'xin', 'Case có PA quy chế');
    assert(cases.xoaCase(QL, c2).thungRacId > 0 && !mot('SELECT 1 FROM sos_cases WHERE id = ?', c2), 'QL xoá thẳng');
  }));
}
