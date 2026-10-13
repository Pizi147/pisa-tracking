/**
 * PHÉP KIỂM PR-OV11c — Công việc · Chờ duyệt: một số liệu một cách đếm, việc xong không còn báo (kế hoạch 2026-10-14-pr-ov11c, đặc tả rà soát
 * cuối mục 3 Q6, Q7, Q10). Gọi ở khối 0 của run.ts — NGAY sau khi dựng bộ demo (số "58 bài quá hạn", trần câu SQL đo trên demo như `tocDo.run`).
 * MỌI phép kiểm chạy trong `thu` (cuộn lại), kể cả phép chỉ đọc: `myWork` có quét ghi (Báo QL, dời hết hạn) — không để lại dấu cho phép kiểm sau.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11cTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const cases: any = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { soCauSql, xoaNho, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN } = await import('./tocDoDuong.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV11c · Công việc · Chờ duyệt: một cách đếm, việc xong không còn báo');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } catch (e) {
      if (e instanceof TypeError) e.message += ` @ ${String(e.stack).split('\n').slice(1, 4).map((x) => x.trim()).join(' | ')}`;
      throw e;
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  /** Mọi việc lá của danh sách hiển thị (dòng gộp → từng việc). */
  const la = (dong: any[]): any[] => dong.flatMap((x) => (x.con?.length ? x.con : [x]));
  const tatCa = (p: any) => { xoaNho(); return mywork.myWork(p, { nguoi: 'tat-ca' }); };

  check('OV11c-1 · "Bài quá hạn" một số: xô quá hạn không lẫn bài chưa quá hạn; Công việc lọc Quá hạn (dòng phạm vi) = chỉ số bai-qua-han-nhap-diem', () => thu(() => {
    const w = tatCa(P.mbManager);
    /* Mỗi việc Nhập điểm một hạn: quá hạn thì cả xô quá hạn (ô quá hạn và ô chưa quá hạn không chung khoá). */
    const score = (w.items as any[]).filter((it) => it.group === 'score');
    assert(score.length > 0, 'demo phải có việc Nhập điểm');
    const chiSo = metrics.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', {}).ids.length as number;
    const quaHan = score.filter((it) => it.urgency === 'overdue').reduce((n, it) => n + (it.soBai ?? 0), 0);
    assert(quaHan === chiSo, `Σ bài các việc quá hạn ${quaHan} ≠ chỉ số ${chiSo}`);
    const loc = (w.dong as any[]).filter((x) => d.khopLocNhanh(x, 'qua-han', TODAY) && d.nhomViecCua(x.group) === 'cham-diem');
    const pv = d.demPhamVi(loc, true, { loc: 'qua-han', homNay: TODAY });
    assert(pv.so === chiSo && pv.donVi === 'bài cần chấm', `dòng phạm vi lọc Quá hạn: ${pv.so} ≠ ${chiSo}`);
    /* Dòng gộp Nhập điểm một đơn vị: "bài". */
    const gop = (w.dong as any[]).find((x) => x.group === 'score' && x.con);
    if (gop) assert(/\d+ bài$/.test(gop.tieuDe), `tiêu đề dòng gộp Nhập điểm: ${gop.tieuDe}`);
  }));

  check('OV11c-2 · dòng phạm vi "m học viên" = số em KHÁC NHAU (dòng cả lớp mang id em; không cộng dồn số em từng dòng)', () => thu(() => {
    for (const p of [P.mbManager, P.coreTeacher]) {
      const w = p === P.mbManager ? tatCa(p) : (xoaNho(), mywork.myWork(p));
      const em = new Set<number>();
      for (const x of la(w.dong)) {
        if (x.studentId !== null) em.add(x.studentId);
        for (const id of x.emIds ?? []) em.add(id);
        /* Việc cả lớp đếm em: có đủ id em (không còn chỉ số đếm). */
        if (x.studentId === null && x.count && ['score', 'ban_giao', 'khai_bac', 'ky_vong_dau_ra', 'xet_lai_lo_trinh', 'chot_len_ft'].includes(x.group)) {
          assert((x.emIds ?? []).length === (x.group === 'score' ? x.count : x.count), `${x.key}: emIds ${(x.emIds ?? []).length} ≠ count ${x.count}`);
        }
      }
      const pv = d.demPhamVi(w.dong, false);
      assert(pv.so === em.size && pv.donVi === 'học viên', `${p.fullName}: ${pv.so} học viên ≠ ${em.size} em riêng`);
    }
  }));

  check('OV11c-3 · "Của GV" = "Của một GV" (cùng tập việc của GV, gồm Bàn giao); "Của tôi" của QL không có việc người khác giữ', () => thu(() => {
    const w = tatCa(P.mbManager);
    const items = w.items as any[];
    const gvs = [...new Set(items.map((it) => it.ownerId).filter((x: any) => x !== null && x !== P.mbManager.userId))] as number[];
    assert(gvs.length > 2, 'demo phải có nhiều GV');
    let coBanGiao = false;
    for (const gv of gvs) {
      const a = new Set(items.filter((it) => it.ownerId === gv && it.group !== 'mgmt').map((it) => it.key));
      xoaNho();
      const b = new Set((mywork.viecCuaNguoi(P.mbManager, gv).items as any[]).filter((it) => it.ownerId === gv && it.group !== 'mgmt').map((it) => it.key));
      const thieu = [...b].filter((k) => !a.has(k)), thua = [...a].filter((k) => !b.has(k));
      assert(!thieu.length && !thua.length, `GV ${gv}: Của GV thiếu ${thieu.slice(0, 5).join(', ')} · thừa ${thua.slice(0, 5).join(', ')}`);
      if ([...a].some((k) => k.startsWith('ban_giao'))) coBanGiao = true;
    }
    assert(coBanGiao, '"Của GV" phải có việc Bàn giao của GV (demo MB)');
    xoaNho();
    const toi = mywork.myWork(P.mbManager, { nguoi: 'toi' });
    const la2 = (toi.items as any[]).filter((it) => it.ownerId !== null && it.ownerId !== P.mbManager.userId);
    assert(!la2.length, `"Của tôi" lẫn việc của ${la2.slice(0, 3).map((x: any) => `${x.key}→${x.ownerId}`).join(', ')}`);
    /* CV-16: QL có tab Vận hành — không lặp việc Vận hành ở Hỗ trợ học viên. */
    assert(!(toi.items as any[]).some((it) => it.group === 'mgmt'), 'QL "Của tôi" còn việc Vận hành');
  }));

  check('OV11c-4 · PA bổ trợ (cả `bo_tro_mien_phi`) gộp MỘT dòng mỗi nhóm; nhóm có Mini Test chờ chỉ còn dòng Ghi Mini Test', () => thu(() => {
    const r = (id: number, kind: string, nhom: string | null, han: string | null) => ({ id, kind, nhom_bo_tro: nhom, action_due: han });
    const ds = [r(1, 'bo_tro_mien_phi', 'n1', '2026-09-10'), r(2, 'bo_tro_mien_phi', 'n1', '2026-09-09'), r(3, 'bo_tro', 'n2', null), r(4, 'bo_tro', 'n2', null), r(5, 'tutor', null, null)];
    assert(d.daiDienNhomBoTro(ds).map((x: any) => x.id).join() === '2,3,5', `đại diện: ${d.daiDienNhomBoTro(ds).map((x: any) => x.id)}`);
    assert(d.daiDienNhomBoTro(ds, new Set(['n1'])).map((x: any) => x.id).join() === '3,5', 'nhóm có Mini Test chờ phải bỏ dòng Kết quả');
    /* Demo: em có Mini Test chờ không còn dòng "Kết quả PA" của nhóm. */
    const mt = all(`SELECT m.nhom_bo_tro, m.student_id FROM mini_test m WHERE m.ty_le IS NULL`);
    xoaNho();
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    for (const m of mt) {
      const pa = new Set(all(`SELECT id FROM case_interventions WHERE nhom_bo_tro = ?`, m.nhom_bo_tro).map((x) => `action:${x.id}`));
      const lap = (w.items as any[]).filter((it) => pa.has(it.key));
      assert(!lap.length, `nhóm ${m.nhom_bo_tro} có Mini Test chờ vẫn còn ${lap.map((x: any) => x.key)}`);
    }
  }));

  check('OV11c-5 · Tạm dừng em KHÔNG đóng đề xuất sửa đang chờ; Thôi học thì đóng', () => thu(() => {
    const em = one(`SELECT s.id, e.class_id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      JOIN learning_cycles lc ON lc.student_id = s.id AND lc.status = 'active'
      WHERE s.status = 'active' AND s.archived_at IS NULL AND e.class_id = ? LIMIT 1`, classId('MB FT 101'));
    const id = deXuat.guiDeXuatSua(P.coreTeacher, em.id, { truong: 'target', moi: 8.5, lyDo: 'Em làm bài tốt, nâng Target' }).id;
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(em.id);
    xoaNho(); yeuCau.quetYeuCau(TODAY);
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho', 'Tạm dừng đã đóng đề xuất');
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(em.id);
    xoaNho(); yeuCau.quetYeuCau(TODAY);
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'tu_dong', 'Thôi học phải đóng đề xuất');
  }));

  check('OV11c-6 · Mini Test đạt sau PA "Tiến bộ rõ" → Case "Tiến bộ rõ" (much_better), không gán cứng', () => thu(() => {
    const mt = one(`SELECT * FROM mini_test WHERE ty_le IS NULL ORDER BY id LIMIT 1`);
    assert(mt, 'demo phải có Mini Test chờ');
    const pa = all(`SELECT iv.id, iv.case_id FROM case_interventions iv WHERE iv.nhom_bo_tro = ? AND iv.status IN ('planned', 'started') ORDER BY iv.id`, mt.nhom_bo_tro);
    assert(pa.length, 'nhóm phải có PA đang chạy');
    const ngay = mt.ngay_du_kien && mt.ngay_du_kien <= TODAY ? mt.ngay_du_kien : TODAY;
    cases.updateResult(P.mbManager, pa[0].id, { outcome: 'improved', note: 'Em làm Mini Test tốt hơn hẳn', observedOn: TODAY, miniTest: { tyLe: 75, ngay }, soBuoi: 0 });
    const kq = all(`SELECT id, outcome, status FROM sos_cases WHERE id IN (${pa.map(() => '?').join(',')})`, ...pa.map((x) => x.case_id));
    assert(kq.every((c) => c.status === 'done' && c.outcome === 'much_better'), `Case: ${JSON.stringify(kq)}`);
  }));

  check('OV11c-7 · hạn Thêm PA ở hồ sơ = hạn ở Công việc (Case hệ thống mở, lớp thường)', () => thu(() => {
    xoaNho();
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    const ds = (w.items as any[]).filter((it) => it.group === 'no_plan');
    assert(ds.length, 'demo phải có việc Thêm PA');
    let coMock = false;
    for (const it of ds) {
      const c = cases.caseDetail(P.mbManager, it.caseId);
      if (one('SELECT origin_kind FROM sos_cases WHERE id = ?', it.caseId).origin_kind === 'mock') coMock = true;
      assert(c.v4?.viecTiep?.han === it.due || c.viecTiep?.han === it.due, `Case ${it.caseId}: hồ sơ ${c.v4?.viecTiep?.han ?? c.viecTiep?.han} ≠ Công việc ${it.due}`);
    }
    assert(coMock, 'demo phải có Case hệ thống mở chưa có PA');
  }));

  check('OV11c-8 · không còn thẻ "Lớp hết khoá · chưa có quyết định chuyển lớp" ở lớp thường (việc Chốt lộ trình đã phủ)', () => thu(() => {
    xoaNho(); yeuCau.quetYeuCau(TODAY);
    const con = all(`SELECT y.id FROM yeu_cau_duyet y JOIN classes c ON c.id = y.doi_tuong_id
      WHERE y.loai = 'bao_len_chua_lenh' AND y.trang_thai = 'cho' AND c.is_fast_track = 0`);
    assert(!con.length, `còn ${con.length} thẻ ở lớp thường`);
  }));

  check('OV11c-9 · số câu SQL /my-work?nguoi=tat-ca (QL) trong trần tocDoDuong', () => thu(() => {
    xoaNho();
    const s0 = soCauSql();
    trongBoNho(() => mywork.myWork(loadPrincipal(P.mbManager.userId), { nguoi: 'tat-ca' }));
    const n = soCauSql() - s0;
    console.log(`    /my-work?nguoi=tat-ca (QL MB, demo): ${n} câu · trần ${TRAN['QL /my-work?nguoi=tat-ca']}`);
    assert(n <= TRAN['QL /my-work?nguoi=tat-ca'], `${n} câu > trần ${TRAN['QL /my-work?nguoi=tat-ca']}`);
  }));
}
