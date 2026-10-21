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
  const td: any = await import('../platform/thongBaoTuDong.ts');
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

  check('OV15d-1 · bài quá hạn chấm của chính GV → một thông báo mỗi lớp · đợt, mở đúng việc ở Công việc; chạy lại không trùng', () => {
    assert(gv, 'dữ liệu demo: phải có GV có bài quá hạn nhập điểm');
    thu(() => {
      td.dongBoThongBaoTuDong(gv, TODAY);
      const a = cua(gv.userId, 'cham_qua_han');
      assert(a.length > 0, 'phải có thông báo bài quá hạn chấm');
      const items = (mywork.myWork(gv, { chiNhom: new Set(['score']) }).items as any[]).filter((x) => x.group === 'score' && x.mine && x.urgency === 'overdue');
      const nhom = new Set(items.map((x) => td.khoaChamQuaHan(x)));
      assert(a.length === nhom.size, `một thông báo / lớp · đợt: ${a.length} ≠ ${nhom.size}`);
      assert(a.every((n) => /^\/cong-viec\?viec=/.test(n.duong)), 'bấm mở đúng việc trong Công việc');
      td.dongBoThongBaoTuDong(gv, TODAY);
      assert(cua(gv.userId, 'cham_qua_han').length === a.length, 'chạy lại không thêm dòng');
    });
  });

  check('OV15d-2 · tự hết khi việc xong: thông báo tự động mà việc không còn → xoá; thông báo loại khác giữ nguyên', () => {
    thu(() => {
      const uid = gv.userId;
      conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'cũ', 'tudong:cham:0:0:0', ?)`).run(uid, TODAY);
      conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'case_chua_chot_pa', 'cũ', 'tudong:case:0', ?)`).run(uid, TODAY);
      conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'transfer_in', 'giữ', 'ov15d:giu', ?)`).run(uid, TODAY);
      td.dongBoThongBaoTuDong(gv, TODAY);
      const con = (k: string) => !!conn.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?').get(uid, k);
      assert(!con('tudong:cham:0:0:0') && !con('tudong:case:0'), 'thông báo của việc đã xong phải tự hết');
      assert(con('ov15d:giu'), 'thông báo loại khác không bị đụng');
    });
  });

  check('OV15d-3 · Case chưa chốt PA quá hạn → người phụ trách Case (cùng luật cột Chờ duyệt ⚠ `xuLyCaseMany`), mở Case', () => {
    thu(() => {
      const { xuLyCaseMany } = sosState;
      const mo = conn.prepare(`SELECT sc.id, sc.owner_user_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id
        WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL AND sc.tam = 0 AND s.archived_at IS NULL`).all() as any[];   // Case thật, em chưa lưu trữ
      const xl = xuLyCaseMany(mo.map((c) => c.id), TODAY);
      const qh = mo.filter((c) => xl.get(c.id)?.cot === 'choDuyet' && xl.get(c.id)?.quaHan);
      assert(qh.length > 0, 'dữ liệu demo: phải có Case chưa chốt PA quá hạn');
      const uid = qh[0].owner_user_id as number;
      td.dongBoThongBaoTuDong(perm.loadPrincipal(uid), TODAY);
      const a = cua(uid, 'case_chua_chot_pa');
      const mong = qh.filter((c) => c.owner_user_id === uid).length;
      assert(a.length === mong, `một thông báo mỗi Case quá hạn: ${a.length} ≠ ${mong}`);
      assert(a.every((n) => /^\/hoc-thuat\/case\/\d+$/.test(n.duong)), 'bấm mở đúng Case');
    });
  });

  check('OV15d-4 · Chốt lộ trình tới hạn → QL (một thông báo / lớp), mở việc Chốt lộ trình', () => {
    thu(() => {
      const ql = P.mbManager;
      const items = (mywork.myWork(ql, { chiNhom: new Set(['chot_len_ft']) }).items as any[]).filter((x) => x.group === 'chot_len_ft' && x.due && x.due <= d.addDaysIso(TODAY, td.CHOT_TOI_HAN_NGAY));
      td.dongBoThongBaoTuDong(ql, TODAY);
      const a = cua(ql.userId, 'chot_lo_trinh');
      assert(a.length === items.length, `một thông báo mỗi lớp tới hạn: ${a.length} ≠ ${items.length}`);
      assert(a.every((n) => decodeURIComponent(n.duong).startsWith('/cong-viec?viec=chotft:')), 'mở đúng việc');
    });
  });

  /* NEN-V5 (08 K10): thay OV-15d-5 — GV có Tổng quan (trang đầu), vẫn có Công việc. */
  check('OV15d-5 · NEN-V5 K10: nav.overview true cho GV (vẫn có Công việc), QL / Admin', () => {
    const g = nav.navOf(P.w1Teacher);
    assert(g.work && g.overview, 'GV: có Công việc và Tổng quan');
    assert(nav.navOf(P.mbManager).overview, 'QL giữ Tổng quan');
    assert(nav.navOf(P.admin).overview, 'Admin giữ Tổng quan');
  });

  check('OV15d-6 · lọc người Công việc: Của tôi + Của GV = Tất cả (một danh sách, cùng hàm đếm)', () => {
    const ds = [{ mine: true }, { mine: false, ownerId: 5 }, { mine: false, ownerId: null }] as any[];
    const dem = d.demNguoiViec(ds);
    assert(dem.toi === 1 && dem.gv === 2 && dem['tat-ca'] === 3, JSON.stringify(dem));
    assert(d.khopNguoiViec(ds[0], 'toi') && !d.khopNguoiViec(ds[0], 'gv') && d.khopNguoiViec(ds[1], 'gv') && d.khopNguoiViec(ds[2], 'tat-ca'), 'khớp');
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
    const mw = (mywork.myWork(ql, { chiNhom: new Set(['buoc_tiep', 'chot_len_ft']) }).items as any[]).filter((x) => td.toiHan(x.due, TODAY));
    assert(r.canQuyet.sauThi.length === mw.length, `số việc ${r.canQuyet.sauThi.length} ≠ ${mw.length}`);
  });

  const audit: any = await import('../platform/audit.ts');

  check('OV15d-9 · chỉ mục idx_case_owner (sos_cases theo người phụ trách) có và được câu thông báo Case dùng — không quét cả bảng mỗi người', () => {
    assert(conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_case_owner'`).get(), 'thiếu chỉ mục idx_case_owner');
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${td.CAU_CASE_CUA_NGUOI}`).all(1) as any[]).map((r) => r.detail).join(' | ');
    assert(/idx_case_owner/.test(plan), `câu không dùng chỉ mục: ${plan}`);
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
