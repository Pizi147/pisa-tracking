/**
 * PHÉP KIỂM TU2-2 PA-DANG-CHAY-MC (chủ SP 19/11 — `docs/superpowers/specs/2026-11-19-tutor/06-ke-hoach-pr.md` mục 2, 3; luật TU8, TU9, TU17).
 *   (1) `/my-work` GV có `paDangChay`: PA mình giữ chưa tới hạn, `nhap` a / b khi đã lưu nháp · (2) PA tới hạn (đã là việc) không có · (3) em Tạm dừng / có KQ thi thật
 *   không có · (4) Head / Quản trị "Tất cả", "Của GV" và vai không dạy không có khoá; số việc không đổi · (5) lưới Kết quả PA: PA chưa tới kỳ, `buoiKy`, `tutorTruoc`, nháp.
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */
export async function runPrTu22Tests(t: any) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const luoi: any = await import('../cases/luoiKetQua.ts');
  const { xoaNho, soCauSql, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nTU2-2 · PA đang chạy ở /my-work GV · lưới Kết quả PA có phần Tutor');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const GV = P.lrTeacher;
  const LOP = t.classId('MB FT 101');
  let seq = 0;
  const em = (): number => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-TU22-${seq}`, `Hoc vien TU22 ${seq}`, `hoc vien tu22 ${seq}`, LOP, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  /** PA của GV (giữ việc Kết quả PA: GVBM Listening lớp em), hạn = hôm nay + `sau` ngày. */
  const pa = (o: { kind?: string; soBuoi?: number | null; sau?: number } = {}) => {
    const sid = em();
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `tu22-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { kind: o.kind ?? 'tutor', description: 'Tutor Listening 1-1', soBuoi: o.soBuoi ?? null, status: 'started', startedDate: addDays(TODAY, -7) });
    const ivId = Math.max(...r.interventions.map((i: any) => i.id)) as number;
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, o.sau ?? 10), ivId);
    xoaNho();
    return { sid, caseId, ivId };
  };
  const dangChay = (p = GV) => { xoaNho(); return tq.sapToiCuaGv(p).paDangChay as any[]; };
  const viec = (p = GV) => { xoaNho(); return mw.myWork(p).items as any[]; };

  check('TU2-2 (1) · GV: PA mình giữ chưa tới hạn có trong paDangChay (đủ trường); nháp a / b → nhap; tới hạn thì thành việc của GV (người giữ đúng)', () => thu(() => {
    const { ivId, caseId, sid } = pa();
    const x = dangChay().find((r) => r.paId === ivId);
    assert(x && x.caseId === caseId && x.studentId === sid && x.classId === LOP && x.classCode === 'MB FT 101' && x.topic === 'listening'
      && x.kind === 'tutor' && x.tenPa === 'Tutor Listening 1-1' && x.han === addDays(TODAY, 10) && x.nhap === null, JSON.stringify(x));
    cases.luuNhapKetQua(GV, ivId, { note: '', outcome: '', soBuoi: 1, buoiDuKien: 2 });
    const n = dangChay().find((r) => r.paId === ivId)?.nhap;
    assert(n && n.soBuoi === 1 && n.buoiDuKien === 2 && typeof n.luc === 'string' && Object.keys(n).length === 3, `nháp: ${JSON.stringify(n)}`);
    cases.luuNhapKetQua(GV, ivId, { note: 'Nghe lại Section 1', outcome: 'partial', soBuoi: null, buoiDuKien: null });
    const n2 = dangChay().find((r) => r.paId === ivId)?.nhap;
    assert(n2 && n2.soBuoi === null && n2.buoiDuKien === null, `nháp chỉ chữ: a / b null — ${JSON.stringify(n2)}`);
    assert(!viec().some((i) => i.key === `action:${ivId}`), 'chưa tới hạn: không phải việc');
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, 2), ivId);
    assert(viec().some((i) => i.key === `action:${ivId}` && i.mine), 'tới hạn: việc của chính GV (cùng người giữ)');
  }));

  check('TU2-2 (2) · PA tới hạn (hạn − 2 ≤ hôm nay) không ở paDangChay; mọi loại PA (TU9); PA đã kết thúc không có; thứ tự theo hạn', () => thu(() => {
    const toi = pa({ sau: 2 }).ivId, sat = pa({ sau: 3 }).ivId, tuHoc = pa({ kind: 'self_study', sau: 20 }).ivId, xong = pa({ sau: 5 }).ivId;
    conn.prepare("UPDATE case_interventions SET status = 'completed' WHERE id = ?").run(xong);
    const ds = dangChay();
    const ids = ds.map((r) => r.paId);
    assert(!ids.includes(toi) && ids.includes(sat) && ids.includes(tuHoc) && !ids.includes(xong), `ids: ${ids.join(',')}`);
    assert(ds.find((r) => r.paId === tuHoc).tenPa === 'Tutor Listening 1-1' && ds.find((r) => r.paId === tuHoc).kind === 'self_study', 'Tự học có tên PA');
    assert(ds.every((r, i) => i === 0 || ds[i - 1].han < r.han || (ds[i - 1].han === r.han && ds[i - 1].paId < r.paId)), 'xếp theo hạn, rồi PA');
    assert(ds.every((r) => r.han > mw.hanGhiKetQuaToi(TODAY)), 'mọi dòng chưa tới hạn');
  }));

  check('TU2-2 (3) · em Tạm dừng / lộ trình có KQ thi thật (N46): PA rời paDangChay', () => thu(() => {
    const a = pa(), b = pa();
    conn.prepare("UPDATE students SET status = 'paused' WHERE id = ?").run(a.sid);
    conn.prepare('UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE student_id = ?').run(b.sid);
    const ids = dangChay().map((r) => r.paId);
    assert(!ids.includes(a.ivId) && !ids.includes(b.ivId), `còn: ${ids.filter((x) => x === a.ivId || x === b.ivId)}`);
  }));

  check('TU2-2 (4a) · cụm "Kết quả PA" 7 ngày (web hiện tại) = PA paDangChay hạn ≤ hôm nay + 9 — cùng hàng; số câu không theo số PA', () => thu(() => {
    const dem = () => { xoaNho(); tq.sapToiCuaGv(GV); const s0 = soCauSql(); const x = trongBoNho(() => tq.sapToiCuaGv(GV)); return { x, n: soCauSql() - s0 }; };   // ấm như hàm Netlify
    pa({ sau: 4 });
    const truoc = dem().n;
    pa({ sau: 30 }); pa({ sau: 40, kind: 'self_study' });
    const { x: { sapToi, paDangChay }, n: cau } = dem();
    const den = mw.hanGhiKetQuaToi(addDays(TODAY, 7));
    const trong = paDangChay.filter((r: any) => r.han <= den);
    assert(sapToi?.paToiKy?.so === trong.length && sapToi.paToiKy.han === trong[0].han, `Sắp tới ${JSON.stringify(sapToi?.paToiKy)} ≠ ${trong.length}`);
    assert(paDangChay.length > trong.length, 'PA hạn xa vẫn ở khối');
    assert(cau === truoc, `sapToiCuaGv ${truoc} → ${cau} câu khi thêm PA`);
  }));

  const httpApp = createApp().listen(0);
  const port = (httpApp.address() as any).port as number;
  const goi = async (userId: number, url: string) => (await fetch(`http://127.0.0.1:${port}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(userId)}` } })).json() as any;
  try {
    await checkAsync('TU2-2 (4b) · /my-work: GV có paDangChay; Head "Tất cả" / "Của GV", Quản trị, TVV không có khoá; số việc + dòng của GV không đổi vì khối', async () => {
      const { ivId } = pa({ sau: 12 });
      try {
        xoaNho();
        const g = await goi(GV.userId, '/my-work');
        assert(g.paDangChay?.some((r: any) => r.paId === ivId), `GV thiếu PA ${ivId}`);
        assert(!g.dong.some((r: any) => r.key === `action:${ivId}` || r.paId === ivId), 'PA đang chạy lọt vào dòng việc');
        const w = mw.myWork(GV);
        assert(JSON.stringify(g.summary) === JSON.stringify(w.summary) && g.dong.length === w.dong.length, 'số việc / dòng lệch myWork');
        assert(JSON.stringify(d.demDongViec(g.dong)) === JSON.stringify(d.demDongViec(w.dong)), 'demDongViec lệch');
        const ql = P.mbManager.userId, qt = P.admin.userId;
        const tvv = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active'
          AND ur.user_id NOT IN (SELECT user_id FROM user_roles x JOIN roles y ON y.id = x.role_id WHERE y.key IN ('teacher', 'head_tutor')) LIMIT 1`)?.id;
        for (const [ai, url] of [[ql, '/my-work'], [ql, '/my-work?nguoi=tat-ca'], [ql, `/my-work?nguoi=${GV.userId}`], [qt, '/my-work?nguoi=tat-ca'], ...(tvv ? [[tvv, '/my-work']] : [])] as [number, string][]) {
          const r = await goi(ai, url);
          assert(!('paDangChay' in r), `${ai} ${url}: có paDangChay`);
        }
      } finally {
        conn.prepare("UPDATE case_interventions SET status = 'cancelled' WHERE id = ?").run(ivId);   // HTTP không chạy trong `thu` — gỡ PA thử
        xoaNho();
      }
    });
  } finally { httpApp.close(); }

  check('TU2-2 (5) · lưới Kết quả PA: nhận PA chưa tới kỳ; b điền sẵn (lần trước → so_buoi quy chế cũ); tutor kỳ trước; nháp có a / b + dòng Tutor; số câu cố định', () => thu(() => {
    const quyChe = pa({ soBuoi: 2, sau: 12 }).ivId, tong = pa({ soBuoi: 10, sau: 12 }).ivId, tuHoc = pa({ kind: 'self_study', sau: 12 }).ivId, ghi = pa({ sau: 12 }).ivId;
    conn.prepare("UPDATE case_interventions SET moc_quy_che = 'until_next_mt' WHERE id = ?").run(quyChe);
    const lan = get("SELECT id FROM tutors WHERE ten = 'Nguyễn Thu Lan'").id as number;
    cases.updateResult(GV, ghi, { decision: 'keep', outcome: 'partial', note: 'Hai buổi tutor, đúng thêm 3 câu', observedOn: TODAY, soBuoi: 2, buoiDuKien: 3,
      buoi: [{ tutorId: lan, tutor: 'Nguyễn Thu Lan', nhanXet: 'Chữa Section 3 điền bảng, đúng 9/13', soBuoi: 2 }] });
    cases.luuNhapKetQua(GV, quyChe, { note: '', outcome: '', soBuoi: 1, buoiDuKien: 2, buoi: [{ tutor: 'Cô Hà', nhanXet: 'Nghe Part 1', soBuoi: 1 }] });
    xoaNho();
    const s0 = soCauSql();
    const ds = trongBoNho(() => luoi.luoiKetQua(GV, [quyChe, tong, tuHoc, ghi]).ds) as any[];   // như một request (cùng cách đo prLuoiKq)
    const cau = soCauSql() - s0;
    const x = (id: number) => ds.find((r) => r.id === id);
    assert(ds.length === 4, `PA chưa tới kỳ vẫn có dòng: ${ds.length}`);
    assert(x(quyChe).buoiKy === 2 && x(quyChe).tutorTruoc === null, `quy chế: ${JSON.stringify(x(quyChe))}`);
    assert(x(tong).buoiKy === null && x(tong).tutorTruoc === null, 'PA có Tổng số buổi: không điền b từ tổng');
    assert(x(tuHoc).buoiKy === null && x(tuHoc).tutorTruoc === null, 'PA không đếm buổi: null');
    assert(x(ghi).buoiKy === 3 && JSON.stringify(x(ghi).tutorTruoc) === JSON.stringify({ tutorId: lan, gvId: null, ten: 'Nguyễn Thu Lan' }), `kỳ sau: ${JSON.stringify(x(ghi))}`);
    const n = x(quyChe).nhap;
    assert(n && n.soBuoi === 1 && n.buoiDuKien === 2 && n.buoi.length === 1 && n.buoi[0].tutor === 'Cô Hà', `nháp: ${JSON.stringify(n)}`);
    assert(x(tong).nhap === null, 'không nháp: null');
    assert(cau <= TRAN_GHI_LO.luoiKetQua, `${cau} câu > ${TRAN_GHI_LO.luoiKetQua}`);
    /* Tutor kỳ trước đã ngừng (kết luận "ngung") → không điền sẵn, như `/tutors/chon`. */
    conn.prepare(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, luc, nguoi_id) VALUES (?, 'ngung', 'Ngừng hợp tác', ?, ?)`).run(lan, new Date().toISOString(), GV.userId);
    xoaNho();
    assert(luoi.luoiKetQua(GV, [ghi]).ds[0].tutorTruoc === null, 'tutor ngừng: không điền sẵn');
  }));
}
