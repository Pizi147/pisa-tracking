/**
 * PHÉP KIỂM OV-15h2 (kế hoạch 2026-10-20-ov15g-ov15h.md mục OV-15h2) — Học viên & Lớp + xuất + dọn: ghi chú lịch thi cùng giao dịch với lịch,
 * xuất 13 cột em hai lớp một hàng, dòng "chốt … · người" ở Lịch thi, Bộ lọc thêm, Dán Excel thử lại cùng lô, Dán từ Excel lớp thường.
 * Gọi QUA HTTP theo vai như bản chính; mỗi mục dựng lớp / em riêng; chạy cuối `run.ts` (trước TD7b).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15h2Tests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const util: any = await import('../util.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15h2 · Học viên & Lớp + xuất + dọn (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager.userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  let seq = 0;
  const lop = (code = `MB H2-${++seq}`) => {
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  };
  /** Một em FT đang học `l` (lộ trình LT1 Target 6.5). */
  const em = (l: number, ten: string, email: string | null = null) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, email, branch_id, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
      .run(`PISA-H2-${seq}`, ten, util.normalizeName(ten), email, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`).run(sid, tuan(bd), bd, NOW).lastInsertRowid);
    return { sid, cy };
  };

  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { setConfig('demo_date', TODAY); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const json = async (r: Response): Promise<any> => { const x = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(x)}`); return x; };
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const em2 = em;
  const xep = async (goi: any, sid: number, n: number, thuHai: string, them: Record<string, unknown> = {}) => (await json(await goi(QL, '/ke-hoach-test/xep-moi', post({
    studentId: sid, attemptNo: n, tuan: Object.fromEntries(KN.map((k) => [k, tuan(thuHai)])), force: true, ...them,
  }))));
  const lichCua = (attemptId: number) => JSON.stringify(all(`SELECT skill, planned_period_id FROM attempt_skills WHERE attempt_id = ? ORDER BY skill`, attemptId));
  const ghiChuCua = (sid: number) => all(`SELECT noi_dung FROM ghi_chu_lich_thi WHERE student_id = ? ORDER BY id`, sid).map((r) => r.noi_dung);

  // ------------------------------------------------------------------ ý 5 · ghi chú lịch thi cùng giao dịch với lịch
  await checkAsync('H2-5 · Kế hoạch Test: lịch + ghi chú lưu MỘT lần gọi; ghi chú sai (dài / đợt lạ) → 400 và lịch KHÔNG đổi; đợt mới cũng vậy', async () => {
    const l = lop();
    const a = em(l, 'Ngô Thanh Hà');
    await voiMayChu(async (goi) => {
      const w1 = addDays(T2, 7), w2 = addDays(T2, 14);
      /* Đợt mới (xep-moi): ghi chú hỏng → không tạo đợt. */
      const r0 = await goi(QL, '/ke-hoach-test/xep-moi', post({ studentId: a.sid, attemptNo: 1, tuan: Object.fromEntries(KN.map((k) => [k, tuan(w1)])), force: true,
        ghiChu: { classId: l, studentId: a.sid, dot: 'mt1', noiDung: 'x'.repeat(501) } }));
      assert(r0.status === 400, `ghi chú > 500 ký tự → 400 (được ${r0.status})`);
      assert(!one(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = 1 AND status != 'cancelled'`, a.cy), 'ghi chú lỗi thì đợt mới không được tạo');
      const moi = await xep(goi, a.sid, 1, w1, { ghiChu: { classId: l, studentId: a.sid, dot: 'mt1', noiDung: 'Chờ xác nhận lịch Speaking' } });
      assert(moi.ghiChu?.noiDung === 'Chờ xác nhận lịch Speaking' && ghiChuCua(a.sid).join() === 'Chờ xác nhận lịch Speaking', JSON.stringify({ moi, gc: ghiChuCua(a.sid) }));
      const id = moi.id as number;
      /* Đợt đã có (dot): ghi chú hỏng → lịch giữ nguyên. */
      const truoc = lichCua(id);
      const doi = { attemptId: id, kyNang: KN.map((skill) => ({ skill, periodId: tuan(w2) })), force: true };
      const r1 = await goi(QL, '/ke-hoach-test/dot', post({ ...doi, ghiChu: { classId: l, studentId: a.sid, dot: 'abc', noiDung: 'x' } }));
      assert(r1.status === 400 && lichCua(id) === truoc, `đợt ghi chú lạ → 400, lịch không đổi (${r1.status})`);
      const r2 = await json(await goi(QL, '/ke-hoach-test/dot', post({ ...doi, ghiChu: { classId: l, studentId: a.sid, dot: 'mt1', noiDung: 'Gia đình xin dời' } })));
      assert(r2.ok && r2.ghiChu?.noiDung === 'Gia đình xin dời' && lichCua(id) !== truoc, JSON.stringify(r2));
      assert(ghiChuCua(a.sid).join('|') === 'Chờ xác nhận lịch Speaking|Gia đình xin dời', ghiChuCua(a.sid).join('|'));
    });
  });

  // ------------------------------------------------------------------ ý 6 · xuất 13 cột: em học cùng lúc hai lớp FT
  await checkAsync('H2-6 · Xuất Kế hoạch Test 13 cột: em học CÙNG LÚC hai lớp FT → một hàng, cột Lớp ghi cả hai', async () => {
    const a1 = lop('MB H2 XUAT 01'), a2 = lop('MB H2 XUAT 02');
    const e = em(a1, 'Trịnh Quốc Bảo', 'bao@gmail.com');
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(e.sid, a2, addDays(T2, -7), NOW);
    await voiMayChu(async (goi) => {
      await xep(goi, e.sid, 1, addDays(T2, 7));
      const r = await json(await goi(QL, '/ke-hoach-test/xuat', post({ branchId: MB, classIds: [a1, a2], xemTruoc: true })));
      const hang = r.sheets[0].aoa.filter((h: any[]) => h[1] === 'Trịnh Quốc Bảo');
      assert(hang.length === 1, `một hàng (được ${hang.length})`);
      assert(hang[0][2] === 'MB H2 XUAT 01 → MB H2 XUAT 02', `cột Lớp: ${hang[0][2]}`);
      assert(r.dem.hocVien === 1, `đếm 1 HV (được ${r.dem.hocVien})`);
    });
  });

  // ------------------------------------------------------------------ ý 2 · Lịch thi: dòng "chốt 05/10 · Lê Thu"
  await checkAsync('H2-2 · Lịch thi: em đã chốt ngày có "chốt {lúc} · {người}" (người đặt đúng ngày đang có); ngày đặt không qua nhật ký → không có dòng', async () => {
    const l = lop('MB H2 LT 01');
    const NAM = Number(TODAY.slice(0, 4)) + 1;
    const a = em(l, 'Vũ Hồng Nhung'), b = em(l, 'Phí Đức Anh');
    conn.prepare('UPDATE learning_cycles SET exam_month = ? WHERE id = ?').run(`${NAM}-03`, a.cy);
    conn.prepare('UPDATE learning_cycles SET exam_month = ?, exam_date = ? WHERE id = ?').run(`${NAM}-03`, `${NAM}-03-20`, b.cy);
    await voiMayChu(async (goi) => {
      const sau = await json(await goi(QL, `/hoc-vien-lop/lich-thi/${a.cy}`, { method: 'PUT', body: JSON.stringify({ ketLuan: 'chot-ngay', ngay: `${NAM}-03-14` }) }));
      assert(sau.chot?.ai === P.mbManager.fullName && sau.chot.luc, `kết quả lưu có chot: ${JSON.stringify(sau.chot)}`);
      const r = await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${NAM}-03&q=${encodeURIComponent('MB H2 LT')}`));
      const ha = r.rows.find((x: any) => x.studentId === a.sid), hb = r.rows.find((x: any) => x.studentId === b.sid);
      assert(ha?.chot?.ai === P.mbManager.fullName, `hàng a: ${JSON.stringify(ha?.chot)}`);
      assert(hb && hb.coNgay && hb.chot === null, `hàng b không có nhật ký: ${JSON.stringify(hb?.chot)}`);
    });
  });

  // ------------------------------------------------------------------ ý 10 · Dán từ Excel lớp thường
  const regular: any = await import('../normal/regular.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  /** Lớp thường `kind` bắt đầu `tuan` tuần trước (bài đã tới tuần thi) + `soEm` em; trả lớp, em, bài theo kind. */
  const lopThuong = (kind: string, tuanTruoc: number, soEm = 2) => {
    seq += 1;
    const bd = addDays(T2, -7 * tuanTruoc);
    const l = intake.createClass(P.admin, { code: `MB H2 ${kind}-${seq}`, branchId: MB, kind, isFastTrack: false, startDate: bd, startPeriodId: tuan(bd) }).id as number;
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const ten = `Học viên ${kind} ${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-H2T-${seq}-${i}`, ten, util.normalizeName(ten), MB, NOW).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, 6, ?, 'active', ?)`)
        .run(sid, kind, bd, NOW);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, l);
    const bai = (sid: number, k: string) => one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND student_id = ? AND kind = ?`, l, sid, k).id as number;
    return { l, sids, bai };
  };
  const o = (attemptId: number, skill: string) => one(`SELECT raw_score, raw_total, comment FROM assessment_scores WHERE attempt_id = ? AND skill = ?`, attemptId, skill) ?? null;
  const soMucDan = (l: number) => one(`SELECT COUNT(*) AS n FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'score.dan_excel'`, l).n as number;

  await checkAsync('H2-10b · POST /regular/scores/lo: FOU (điểm + nhận xét, "-" dời môn), BE, Pre FOU qua saveRegularScore; GVBM sai môn → dòng lỗi; sai lớp / bài → 400 cả lô; nhiều request cùng loId = MỘT mục; Hoàn tác trả đúng', async () => {
    const fou = lopThuong('FOU', 3), be = lopThuong('BE', 7, 1), pre = lopThuong('PREFOU', 6, 1);
    seq += 1;
    const gv = accounts.createAccount(P.admin, { email: `ov15h2.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov15h2', fullName: `Thử OV15h2 ${seq}`, roles: [{ role: 'teacher', branches: ['MB'] }] }).userId as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,'2026-01-01','active',?)`).run(gv, fou.l, 'listening', NOW);
    const a0 = fou.bai(fou.sids[0], 'progress'), a1 = fou.bai(fou.sids[1], 'progress');
    const lichR = () => one(`SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND skill = 'reading'`, a0)?.planned_period_id;
    const rTruoc = lichR();
    await voiMayChu(async (goi) => {
      const gui = (u: number, body: any) => goi(u, '/regular/scores/lo', post({ classId: fou.l, luot: 'thuong:progress', ...body }));
      /* Lần dán 2 request cùng loId: request 1 (không cuoi), request 2 cuoi + truoc → một mục. */
      const r1 = await json(await gui(QL, { loId: 'h2-a', dong: [{ attemptId: a0, o: [{ skill: 'listening', score: 24, total: 40 }, { skill: 'listening', nhanXet: 'Nghe tốt' }, { skill: 'reading', noShow: true }] }] }));
      assert(r1.dong[0].ok && r1.soO === 3, JSON.stringify(r1));
      const r2 = await json(await gui(QL, { loId: 'h2-a', cuoi: true, truoc: { soDong: 1, soDaLuu: 1, soO: 3 }, dong: [{ attemptId: a1, o: [{ skill: 'writing', score: 0, total: 30 }] }] }));
      assert(r2.dong[0].ok, JSON.stringify(r2));
      assert(o(a0, 'listening')?.raw_score === 24 && o(a0, 'listening')?.raw_total === 40 && o(a0, 'listening')?.comment === 'Nghe tốt', JSON.stringify(o(a0, 'listening')));
      assert(o(a1, 'writing')?.raw_score === 0, '0 là điểm, không phải trống');
      assert(lichR() !== rTruoc, '"-" lớp thường dời môn sang tuần sau');
      assert(soMucDan(fou.l) === 1, `một lần dán = MỘT mục (được ${soMucDan(fou.l)})`);
      const muc = JSON.parse(one(`SELECT after_json FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'score.dan_excel'`, fou.l).after_json);
      assert(muc.soDong === 2 && muc.soDaLuu === 2 && muc.soO === 4 && muc.loId === 'h2-a', JSON.stringify(muc));
      /* GVBM Listening: dòng có Reading → cả dòng cuộn lại (Listening cũng không lưu). */
      const r3 = await json(await gui(gv, { loId: 'h2-b', cuoi: true, dong: [{ attemptId: a1, o: [{ skill: 'listening', score: 20, total: 40 }, { skill: 'reading', score: 20, total: 40 }] }] }));
      assert(!r3.dong[0].ok && r3.dong[0].status === 403 && o(a1, 'listening')?.raw_score == null, JSON.stringify(r3));
      const r4 = await json(await gui(gv, { loId: 'h2-c', cuoi: true, dong: [{ attemptId: a1, o: [{ skill: 'listening', score: 20, total: 40 }] }] }));
      assert(r4.dong[0].ok && o(a1, 'listening')?.raw_score === 20, 'GVBM đúng môn lưu được');
      /* Sai lớp / sai bài → 400 cả lô. */
      assert((await gui(QL, { loId: 'h2-d', dong: [{ attemptId: be.bai(be.sids[0], 'progress'), o: [{ skill: 'listening', score: 1, total: 40 }] }] })).status === 400, 'em lớp khác → 400');
      assert((await gui(QL, { luot: 'thuong:final', loId: 'h2-e', dong: [{ attemptId: a0, o: [{ skill: 'listening', score: 1, total: 40 }] }] })).status === 400, 'sai bài → 400');
      assert((await gui(QL, { loId: 'h2-f', dong: [{ attemptId: a0, o: [{ skill: 'listening', band: 6 }] }] })).status === 400, 'trường FT ở lớp thường → 400');
      /* Hoàn tác: trả đúng giá trị trước (ô trống → xoá, "-" → gỡ, nhận xét cũ). */
      const ht = await json(await gui(QL, { loId: 'h2-g', cuoi: true, hoanTac: true, dong: [{ attemptId: a0, o: [{ skill: 'listening', score: null, total: null }, { skill: 'listening', nhanXet: null }, { skill: 'reading', noShow: false }] }] }));
      assert(ht.dong[0].ok && o(a0, 'listening')?.raw_score == null && !o(a0, 'listening')?.comment && lichR() === rTruoc, `Hoàn tác: ${JSON.stringify({ ht, o: o(a0, 'listening'), r: lichR(), rTruoc })}`);
      /* BE (L R W S) và Pre FOU (một ô Tổng hợp). */
      const ab = be.bai(be.sids[0], 'progress');
      const rb = await json(await goi(QL, '/regular/scores/lo', post({ classId: be.l, luot: 'thuong:progress', loId: 'h2-h', cuoi: true, dong: [{ attemptId: ab, o: ['listening', 'reading', 'writing', 'speaking'].map((skill) => ({ skill, score: 30, total: 40 })) }] })));
      assert(rb.dong[0].ok && ['listening', 'reading', 'writing', 'speaking'].every((k) => o(ab, k)?.raw_score === 30), JSON.stringify(rb));
      const ap = pre.bai(pre.sids[0], 'final');
      const rp = await json(await goi(QL, '/regular/scores/lo', post({ classId: pre.l, luot: 'thuong:final', loId: 'h2-i', cuoi: true, dong: [{ attemptId: ap, o: [{ skill: 'tong_hop', score: 45, total: 50 }] }] })));
      assert(rp.dong[0].ok && o(ap, 'tong_hop')?.raw_score === 45, JSON.stringify(rp));
    });
  });

  // ------------------------------------------------------------------ ý 3 · Bộ lọc thêm (Case / PA, kỹ năng, kết quả, thời gian)
  await checkAsync('H2-3 · Bộ lọc thêm: hàm thuần (hoặc trong nhóm, và giữa nhóm; Case / PA theo trạng thái V4; kết quả theo khung); /hoc-vien-lop?them=1 gắn nhãn từng em, không them thì không', async () => {
    assert(d.nhomCaseEm([]).join() === 'khong-case', 'không Case');
    assert(d.nhomCaseEm([{ k: 'dang-lam', pa: [] }]).join() === 'co-case,trong-pa', 'Case trống PA');
    assert(d.nhomCaseEm([{ k: 'dang-lam', pa: [{ xong: false }] }, { k: 'cho-nguyen-nhan', pa: [] }]).join() === 'co-case,pa-chay,cho-nhan-xet', 'hai Case');
    assert(d.nhomCaseEm([{ k: 'dang-lam', pa: [{ xong: true }] }, { k: 'tam', pa: [] }]).join() === 'co-case,pa-xong', 'PA xong; tạm chỉ Có Case');
    const st = (o: any) => ({ mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: null, provisional: false, scored: 5, required: 5, failed: null, overall: 6, expectation: 6, belowSkills: [], failedSkills: [], ...o });
    assert(d.ketQuaLoc(null) === null && d.ketQuaLoc(st({})) === 'dat' && d.ketQuaLoc(st({ overall: 5.5 })) === 'chua-dat' && d.ketQuaLoc(st({ scored: 3 })) === 'chua-du', 'FT');
    assert(d.ketQuaLoc(st({ mode: 'ratio', failed: 0 })) === 'dat' && d.ketQuaLoc(st({ mode: 'ratio', failed: 2 })) === 'chua-dat', 'lớp thường');
    assert(d.kyNangLoc(st({ belowSkills: [{ skill: 'writing2', band: 5 }, { skill: 'reading', band: 5 }] })).join() === 'writing,reading', 'W2 → W');
    const em = { case: ['co-case', 'trong-pa'], kn: ['reading'], kq: 'chua-dat', tuan: '2026-09-07' };
    const f = (o: any) => ({ case: [], kn: [], kq: [], tu: null, den: null, ...o });
    assert(d.khopLocThem(undefined, f({})) && !d.khopLocThem(undefined, f({ kq: ['dat'] })), 'không lọc = khớp; đang lọc mà chưa có nhãn = không');
    assert(d.khopLocThem(em, f({ case: ['trong-pa', 'pa-chay'], kq: ['chua-dat'] })), 'hoặc trong nhóm, và giữa nhóm');
    assert(!d.khopLocThem(em, f({ case: ['trong-pa'], kn: ['listening'] })), 'nhóm kỹ năng không khớp');
    assert(d.khopLocThem(em, f({ tu: '2026-09-10', den: '2026-09-20' })) && !d.khopLocThem(em, f({ tu: '2026-09-14', den: '2026-09-20' })), 'tuần thi chạm khoảng');
    const doc = d.docLocThem((k: string) => ({ lc: 'trong-pa,xx', lk: 'reading', lq: 'dat', ltu: '2026-09-01', lden: '2026-08-01' } as any)[k] ?? null);
    assert(doc.case.join() === 'trong-pa' && doc.kn.join() === 'reading' && doc.tu === null, JSON.stringify(doc));

    const l = lop('MB H2 LOC 01');
    const a = em2(l, 'Lý Thanh Tâm'), b = em2(l, 'Hà Minh Khôi'), c = em2(l, 'Kim Bảo Ngân');
    const moCase = (sid: number, cy: number) => Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, detected_at, created_at) VALUES (?,?,?,?, 'teacher_report', 'in_progress', ?, ?)`)
      .run(sid, cy, 'reading', 'reading', TODAY, NOW).lastInsertRowid);
    moCase(a.sid, a.cy);
    const cc = moCase(c.sid, c.cy);
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, recorded_by, created_at) VALUES (?, 'self_study', 'Tự học thêm', 'started', ?, ?)`).run(cc, QL, NOW);
    await voiMayChu(async (goi) => {
      const q = `/hoc-vien-lop?phamVi=chi-nhanh&cn=${MB}&q=${encodeURIComponent('MB H2 LOC')}`;
      const khong = await json(await goi(QL, q));
      assert(khong.hocVien.every((h: any) => h.them === undefined), 'không them=1 → không nhãn (dòng đọc như cũ)');
      const co = await json(await goi(QL, `${q}&them=1`));
      const nhan = (sid: number) => co.hocVien.find((h: any) => h.id === sid)?.them;
      assert(nhan(a.sid)?.case.join() === 'co-case,trong-pa', `a: ${JSON.stringify(nhan(a.sid))}`);
      assert(nhan(b.sid)?.case.join() === 'khong-case' && nhan(b.sid).kq === null && nhan(b.sid).tuan === null, `b: ${JSON.stringify(nhan(b.sid))}`);
      assert(nhan(c.sid)?.case.join() === 'co-case,pa-chay', `c: ${JSON.stringify(nhan(c.sid))}`);
    });
    /* Nhãn kết quả / kỹ năng = CÙNG `standingFor` mọi màn dùng (đối chiếu từng em của một lớp có điểm, không phụ thuộc bộ kiểm trước để lại gì). */
    const standing: any = await import('../students/standing.ts');
    await voiMayChu(async (goi) => {
      const r = await json(await goi(QL, `/hoc-vien-lop?phamVi=chi-nhanh&cn=${MB}&them=1&q=${encodeURIComponent('MB FT 101')}`));
      const st = standing.standingFor(r.hocVien.map((h: any) => h.id));
      const lech = r.hocVien.filter((h: any) => !h.ketThuc && (h.them?.kq !== d.ketQuaLoc(st.get(h.id) ?? null) || h.them?.kn.join() !== d.kyNangLoc(st.get(h.id) ?? null).join()));
      assert(r.hocVien.length > 0 && !lech.length, `lệch standingFor: ${JSON.stringify(lech.slice(0, 3).map((h: any) => [h.ten, h.them]))}`);
      assert(r.hocVien.filter((h: any) => h.them?.kq).every((h: any) => h.them.tuan === null || /^\d{4}-\d{2}-\d{2}$/.test(h.them.tuan)), 'tuần dạng ngày');
    });
  });
}
