/**
 * PHÉP KIỂM OV-15d (kế hoạch 2026-10-19 OV-15 mục OV-15d) — Công việc, Tổng quan, thông báo:
 *  · Thông báo tự động thay Nhắc (C03): bài quá hạn chấm của chính GV (một thông báo / lớp · đợt), Case chưa chốt PA quá hạn (người phụ trách Case),
 *    Chốt lộ trình tới hạn (QL) — dedup theo đối tượng, chạy lại không trùng, tự hết khi việc xong, bấm mở đúng việc trong Công việc;
 *  · (NEN-V5 K10 thay) GV có Tổng quan: `nav.overview` true cho GV, QL giữ Tổng quan;
 *  · lọc người của Công việc (Của tôi · Của GV · Tất cả) đếm từ CÙNG một danh sách: Của tôi + Của GV = Tất cả.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15dTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const { toiHan } = await import('../worklist/tongQuan.ts');
  const nav: any = await import('../platform/nav.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const perm: any = await import('../permissions.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15d · thông báo tự động thay Nhắc, GV vào thẳng Công việc, lọc người Công việc');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const cua = (uid: number, kind: string) => conn.prepare('SELECT dedup_key, title, body, duong FROM notifications WHERE user_id = ? AND kind = ? ORDER BY dedup_key').all(uid, kind) as any[];
  /* Người có bài quá hạn nhập điểm của chính mình trong bộ demo — người đầu tiên tìm được. */
  const coQuaHan = (p: any) => (mywork.myWork(p, { chiNhom: new Set(['score']) }).items as any[]).some((x) => x.group === 'score' && x.mine && x.urgency === 'overdue');
  const gv = [P.w1Teacher, P.w2Teacher, P.lrTeacher, P.coreTeacher, P.subjectTeacher, P.sTeacher].find(coQuaHan);

  /* NEN-V5 (08 K10): thay OV-15d-5 — GV có Tổng quan (trang đầu), vẫn có Công việc. */
  check('OV15d-5 → GD-1 (Overhaul V6) · GV: Công việc là trang đầu, không Tổng quan; QL / Admin giữ Tổng quan', () => {
    const g = nav.navOf(P.w1Teacher);
    assert(g.work && !g.overview, 'GV: có Công việc, không Tổng quan');
    assert(nav.navOf(P.mbManager).overview, 'QL giữ Tổng quan');
    assert(nav.navOf(P.admin).overview, 'Admin giữ Tổng quan');
  });

  check('OV15d-6 → S11 (UI-CV-V12) · lọc người Công việc: chỉ ô "Của tôi" có số = dòng của tôi quá hạn + hôm nay (soCuaToi); dòng "Cả lớp" = 1', () => {
    const ds = [{ key: 'a', group: 'cause', studentId: 1, mine: true, urgency: 'overdue' }, { key: 'a2', group: 'cause', studentId: 4, mine: true, urgency: 'normal' },
      { key: 'b', group: 'cause', studentId: 2, mine: false, ownerId: 5, urgency: 'overdue' }, { key: 'c', group: 'cause', studentId: 3, mine: false, ownerId: null, urgency: 'today' }] as any[];
    assert(d.soCuaToi(ds) === 1, `Của tôi: ${d.soCuaToi(ds)}`);
    const gop = [{ key: 'g', group: 'ghi_nhan_xet', studentId: null, mine: true, ownerId: 5, urgency: 'today', con: [
      { key: 'g1', group: 'ghi_nhan_xet', studentId: 1, mine: true, urgency: 'today' }, { key: 'g2', group: 'ghi_nhan_xet', studentId: 2, mine: true, urgency: 'normal' }] },
      { key: 's', group: 'score', studentId: null, mine: true, urgency: 'overdue', kns: ['listening', 'reading'] }] as any[];
    assert(d.soCuaToi(gop) === 2, `dòng gộp "Cả lớp" = 1, Nhập điểm L + R = 1: ${d.soCuaToi(gop)}`);
    assert(d.khopNguoiViec(ds[0], 'toi') && !d.khopNguoiViec(ds[0], 'gv') && d.khopNguoiViec(ds[2], 'gv') && d.khopNguoiViec(ds[3], 'tat-ca'), 'khớp');
  });

  const tq: any = await import('../worklist/tongQuan.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const metrics: any = await import('../worklist/metrics.ts');

  check('OV15d-7 · Lớp cần chú ý: cột "Case chưa chốt PA" = HV / Case, CÙNG hàm ô số (`case-cho-xac-dinh-nguyen-nhan`); Σ hàng = tổng; ô mở đúng danh sách', () => {
    const ql = P.mbManager;
    const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id;
    const r = bang.bangChiNhanh(ql, { branchId: mb, ct: 'ft' });
    const m = metrics.metricSet(ql, 'case-cho-xac-dinh-nguyen-nhan', { branchId: mb, program: 'ft' });
    assert(r.tong.caseChuaChot.n === m.n, `tổng Case ${r.tong.caseChuaChot.n} ≠ ô số ${m.n}`);
    const hv = new Set((conn.prepare(`SELECT DISTINCT student_id FROM sos_cases WHERE id IN (${m.ids.map(() => '?').join(',') || 'NULL'})`).all(...m.ids) as any[]).map((x) => x.student_id));
    assert(r.tong.caseChuaChotHv.n === hv.size, `tổng HV ${r.tong.caseChuaChotHv.n} ≠ ${hv.size}`);
    const sigma = r.hang.reduce((s: number, h: any) => s + h.o.caseChuaChot.n, 0) + (r.conLai?.o.caseChuaChot.n ?? 0);
    assert(sigma === r.tong.caseChuaChot.n, `Σ hàng ${sigma} ≠ tổng`);
    const h = r.hang.find((x: any) => x.o.caseChuaChotHv.n > 0);
    if (h) assert(bang.oBangChiNhanh(ql, { branchId: mb, ct: 'ft', cot: 'caseChuaChotHv', khoa: h.khoa }).n === h.o.caseChuaChotHv.n, 'ô mở = số');
  });

  check('OV15d-8 · Tổng quan QL "Cần bạn quyết": Case chưa chốt PA quá hạn = chỉ số; Bước tiếp sau thi / Chốt lộ trình = việc của QL', () => {
    const ql = P.mbManager;
    const r = tq.tongQuanQuanLy(ql, {});
    const m = metrics.metricSet(ql, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId: null });
    assert(r.canQuyet && r.canQuyet.caseQuaHan.length === m.n, `Case quá hạn ${r.canQuyet?.caseQuaHan.length} ≠ ${m.n}`);
    assert(r.canQuyet.sauThi.every((x: any) => x.group === 'buoc_tiep' || x.group === 'chot_len_ft'), 'chỉ Bước tiếp + Chốt lộ trình');
    /* OV-15h1: Cần bạn quyết chỉ lấy việc hạn ≤ 7 ngày (cùng ngưỡng thông báo `toiHan`). */
    const mw = (mywork.myWork(ql, { chiNhom: new Set(['buoc_tiep', 'chot_len_ft']) }).items as any[]).filter((x) => toiHan(x.due, TODAY));
    assert(r.canQuyet.sauThi.length === mw.length, `số việc ${r.canQuyet.sauThi.length} ≠ ${mw.length}`);
  });

  const audit: any = await import('../platform/audit.ts');

  check('OV15d-9 · chỉ mục idx_case_owner (sos_cases theo người phụ trách) có (CHUONG-V2 XM-3: câu thông báo Case tự động đã bỏ — kiểm câu đó cũng bỏ)', () => {
    assert(conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_case_owner'`).get(), 'thiếu chỉ mục idx_case_owner');
  });

  check('OV15d-10 · notify upsert cập nhật cả đường mở (duong) — thông báo cũ trỏ đúng việc mới', () => {
    thu(() => {
      const uid = P.w1Teacher.userId;
      audit.notify({ userId: uid, kind: 'cham_qua_han', title: 'x', dedupKey: 'ov15d:duong', duong: '/cong-viec?viec=a' });
      audit.notify({ userId: uid, kind: 'cham_qua_han', title: 'x', dedupKey: 'ov15d:duong', duong: '/cong-viec?viec=b' });
      const r = conn.prepare(`SELECT duong FROM notifications WHERE user_id = ? AND dedup_key = 'ov15d:duong'`).get(uid) as any;
      assert(r?.duong === '/cong-viec?viec=b', `duong = ${r?.duong}`);
    });
  });
}
