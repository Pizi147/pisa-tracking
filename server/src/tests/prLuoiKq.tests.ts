/**
 * GD-20c LUOI-KET-QUA-PA (mockup ⑫ C1–C3): Ghi kết quả PA cùng lớp + CÙNG KỲ gộp một dòng Công việc → lưới; đọc lưới MỘT câu (`luoiKetQua`); lưu từng
 * dòng bằng `updateResult` / `luuNhapKetQua` sẵn có. Chống mất dữ liệu: một dòng lỗi (xung đột nháp) không chặn dòng khác, không đè nháp mới hơn,
 * Thử lại với bản gốc mới thì lưu được; lưu nháp không chốt. Tự tạo học viên + Case + PA (không đụng học viên demo).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuoiKqTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const luoi: any = await import('../cases/luoiKetQua.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho, soCauSql, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const NOW = new Date().toISOString();
  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const lop = classId('MB FT 101');
  const hanKhac = domain.addDaysIso(TODAY, -14);   // kỳ trước (quá hạn) — dòng riêng

  /* Bốn em, mỗi em một Case Listening + PA Tự học (người giữ việc = GV Listening của lớp); ba PA cùng hạn kỳ, một PA kỳ khác. */
  const pa = (i: number, han: string) => {
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)`,
    ).run(`PISA-LUOI-${i}`, `Học viên Lưới ${i}`, `hoc vien luoi ${i}`, mb, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, lop, NOW);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, NOW);
    const c = cases.reportIssue(P.lrTeacher, {
      studentId: sid, topic: 'listening', title: `Nghe chi tiết còn yếu (lưới ${i})`, summary: 'Em bỏ sót số và tên riêng ở Section 2.',
      primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: `luoi-kq-${i}`,
    }) as any;
    const d = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'self_study', description: `Tự học Listening — nghe chép (lưới ${i})`, performerSelf: true, status: 'started', startedDate: TODAY,
    }) as any;
    const id = d.interventions.find((x: any) => x.kind === 'self_study').id as number;
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(han, id);
    return id;
  };
  const [a, b, c3] = [pa(1, TODAY), pa(2, TODAY), pa(3, TODAY)];
  const khac = pa(4, hanKhac);
  const soKq = (id: number) => (conn.prepare('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?').get(id) as any).n as number;
  const nhapCua = (id: number) => cases.docNhapKetQua((conn.prepare('SELECT nhap_ket_qua FROM case_interventions WHERE id = ?').get(id) as any).nhap_ket_qua);
  const ky = (id: number) => (conn.prepare('SELECT cycle_no FROM case_interventions WHERE id = ?').get(id) as any).cycle_no ?? 1;
  const dongCua = (id: number) => (mywork.myWork(P.lrTeacher, {}).dong ?? []).find((x: any) => x.key === `action:${id}` || x.con?.some((y: any) => y.paId === id));

  check('GD-20c · cùng lớp + cùng kỳ gộp MỘT dòng (khoá có hạn kỳ); kỳ khác là dòng riêng', () => {
    const g = dongCua(a);
    assert(g?.con?.length >= 3, `dòng gộp có đủ 3 PA cùng kỳ (có ${g?.con?.length ?? 0})`);
    assert(g.key.endsWith(`:d${TODAY}`), `khoá dòng gộp mang hạn kỳ: ${g.key}`);
    assert([a, b, c3].every((id) => g.con.some((y: any) => y.paId === id)), 'ba PA cùng kỳ trong cùng dòng');
    assert(!g.con.some((y: any) => y.paId === khac), 'PA kỳ khác không vào dòng này');
    const k = dongCua(khac);
    assert(k && k.key !== g.key, 'PA kỳ khác ở dòng khác');
    assert(domain.khoaGopCua({ ...g.con[0], group: 'ghi_ket_qua_pa' }) === g.key, 'khoaGopCua cùng khoá với dòng gộp');
  });

  check(`GD-20c · đọc lưới số câu cố định (không theo số PA), đủ PA + nháp + hạn kỳ sau; trần ${TRAN_GHI_LO.luoiKetQua}`, () => {
    cases.luuNhapKetQua(P.lrTeacher, c3, { outcome: 'partial', note: 'Buổi 1 nghe số khá hơn', ky: ky(c3), coSo: null });
    const dem = (ids: number[]) => { xoaNho(); const s0 = soCauSql(); const x = trongBoNho(() => luoi.luoiKetQua(P.lrTeacher, ids)); return { x, n: soCauSql() - s0 }; };   // như một request
    const mot = dem([a]).n;
    const { x: r, n } = dem([a, b, c3]);
    assert(n <= TRAN_GHI_LO.luoiKetQua, `${n} câu > ${TRAN_GHI_LO.luoiKetQua}`);
    assert(n <= mot, `số câu tăng theo số PA: 1 PA ${mot} → 3 PA ${n}`);
    assert(r.ds.length === 3 && r.ds.every((x: any) => x.dangChay && x.kind === 'self_study' && x.hanKe), 'đủ 3 PA, đang chạy, có hạn kỳ sau');
    assert(r.ds.find((x: any) => x.id === c3).nhap?.note === 'Buổi 1 nghe số khá hơn', 'nháp máy chủ điền sẵn dòng');
    assert(!('boiId' in (r.ds.find((x: any) => x.id === c3).nhap ?? {})), 'không trả id người lưu nháp');
    console.log(`    lưới 1 PA: ${mot} câu · 3 PA: ${n} câu`);
  });

  check('GD-20c · quyền: chi nhánh khác không đọc được PA (bỏ khỏi lưới); chuỗi id sai / quá dài bị chặn', () => {
    assert(luoi.luoiKetQua(P.cpManager, [a, b]).ds.length === 0, 'QL chi nhánh khác: 0 dòng');
    assertThrows(() => luoi.docIdLuoi(''), /Thiếu/, 'rỗng');
    assertThrows(() => luoi.docIdLuoi(Array.from({ length: luoi.TRAN_PA_LUOI + 1 }, (_, i) => i + 1).join(',')), /Tối đa/, 'quá trần');
    assert(luoi.docIdLuoi('3,3,x,-1,4').join(',') === '3,4', 'lọc id hỏng, bỏ trùng');
  });

  check('GD-20c · chống mất dữ liệu: dòng xung đột nháp lỗi một mình, không đè nháp mới; dòng khác vẫn lưu; Thử lại với bản gốc mới thì lưu', () => {
    /* Lưới mở lúc `a` chưa có nháp; phiên khác lưu nháp cho `a` → lưới bấm Lưu (nhapCoSo = null). */
    cases.luuNhapKetQua(P.lrTeacher, a, { outcome: 'unchanged', note: 'Nháp từ máy khác', ky: ky(a), coSo: null });
    const moi = nhapCua(a);
    let loi: any = null;
    try { cases.updateResult(P.lrTeacher, a, { decision: 'keep', outcome: 'improved', note: 'Nghe đúng 8 / 10 câu điền số', ky: ky(a), nhapCoSo: null }); } catch (e) { loi = e; }
    assert(loi?.status === 409 && loi.details && 'nhapMoi' in loi.details, `dòng a: 409 nhapMoi (có ${loi?.status})`);
    assert(soKq(a) === 0 && nhapCua(a)?.note === 'Nháp từ máy khác', 'dòng a: chưa ghi kết quả, nháp mới của phiên khác còn nguyên');
    cases.updateResult(P.lrTeacher, b, { decision: 'keep', outcome: 'partial', note: 'Chép chính tả được 70 %', ky: ky(b), nhapCoSo: null });
    assert(soKq(b) === 1, 'dòng b lưu được dù dòng a lỗi');
    /* "Lưu bản của tôi": gửi lại với bản gốc = bản mới. */
    cases.updateResult(P.lrTeacher, a, { decision: 'keep', outcome: 'improved', note: 'Nghe đúng 8 / 10 câu điền số', ky: ky(a), nhapCoSo: moi.luc });
    assert(soKq(a) === 1 && nhapCua(a) == null, 'Thử lại: đã lưu, nháp xoá');
  });

  check('GD-20c · lưu nháp ở lưới không chốt: việc còn, hạn giữ; chốt thì xoá nháp; kỳ đã chốt → 409 daChot', () => {
    const hanTruoc = (conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(c3) as any).action_due;
    const k = ky(c3);
    cases.luuNhapKetQua(P.lrTeacher, c3, { outcome: 'partial', note: 'Buổi 2 nghe tên riêng tốt hơn', ky: k, coSo: nhapCua(c3)?.luc ?? null });
    assert(soKq(c3) === 0 && (conn.prepare('SELECT action_due FROM case_interventions WHERE id = ?').get(c3) as any).action_due === hanTruoc, 'nháp: không kết quả, hạn giữ');
    cases.updateResult(P.lrTeacher, c3, { decision: 'keep', outcome: 'partial', note: 'Buổi 2 nghe tên riêng tốt hơn', ky: k, nhapCoSo: nhapCua(c3).luc });
    assert(soKq(c3) === 1 && nhapCua(c3) == null, 'chốt xoá nháp');
    let loi: any = null;
    try { cases.luuNhapKetQua(P.lrTeacher, c3, { outcome: 'partial', note: 'gửi lại tab cũ', ky: k, coSo: null }); } catch (e) { loi = e; }
    assert(loi?.status === 409 && loi.details?.daChot, 'tab cũ lưu nháp kỳ đã chốt: 409 daChot (lưới báo, không Thử lại)');
    const r = luoi.luoiKetQua(P.lrTeacher, [a, b, c3]);
    assert(r.ds.every((x: any) => x.cycleNo > 1 || !x.dangChay), 'đọc lại: kỳ đổi → web biết dòng đã ghi (về từ panel đầy đủ)');
  });
}
