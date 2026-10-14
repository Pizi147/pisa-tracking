/**
 * PHÉP KIỂM PR-OV12f — Học viên & Lớp ba góc nhìn (đặc tả OV-12 mục 3.5, 7.9; mockup 3 v2):
 *   (1) "Đang SOS" theo TUẦN thi = lượt MT / Progress thi tuần đó có SOS — số em = số lượt SOS ở Tổng hợp cùng tuần (MỘT hàm phân loại);
 *   (2) lớp thường có trong Đang SOS, nhãn SOS theo số môn trượt; "Toàn bộ" = mọi tuần trong 8 tuần; Case đã xong vẫn có dòng;
 *   (3) quyền đi cùng giao diện: Admin 403 · QL chi nhánh khác không thấy · GV chỉ lớp mình dạy · TVV chỉ HV của mình · CX mọi chi nhánh;
 *   (4) panel một em: Case của em + nhóm xử lý, người ngoài phạm vi 403; (5) luật thuần: đọc góc từ URL (link cũ giữ nghĩa), nhóm xử lý.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv12fTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t as any;
  const sos: any = await import('../classes/hocVienSos.ts');
  const theoVai: any = await import('../classes/hocVienTheoVai.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV12f · Học viên & Lớp ba góc nhìn: Đang SOS theo tuần, quyền theo vai, panel một em');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const QL = P.mbManager;
  const mb = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let seq = 0;
  const tao = (roles: { role: string; branches: string[] }[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov12f.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov12f', fullName: `Thử OV12f ${seq}`, roles }).userId as number;
  };
  const W2SEP = '2026-09-07';
  const soEm = (rows: any[]) => new Set(rows.map((r: any) => r.studentId)).size;

  check('OV12f-1 · Đang SOS tuần W2 SEP: số em Fast Track = số lượt SOS 1–3 ở Tổng hợp cùng tuần; lớp thường = số bài Giữa khoá trượt (gk-1 + gk-2)', () => {
    const tr = sos.dangSos(QL, { tuan: W2SEP, phamVi: 'chi-nhanh', branchId: mb });
    assert(tr.tuan === W2SEP && !tr.toanBo, `tuần đang xem: ${tr.tuan}`);
    assert(tr.rows.length > 0, 'W2 SEP không có dòng SOS nào (seed có 3 MT + 11 Progress SOS)');
    assert(tr.rows.every((r: any) => r.tuan === W2SEP), 'có dòng không thuộc tuần đang chọn');
    const kyHang = (ct: string) => {
      const th = tongHop.tongHop(QL, { ct, soTuan: 8, theo: 'tuan', branchId: mb });
      const pid = one('SELECT id FROM report_periods WHERE week_start = ?', W2SEP).id;
      return th.hang.find((h: any) => h.khoa === `tuan:${pid}`)?.o ?? {};
    };
    const ft = kyHang('ft');
    const soFt = (ft.sos1 ?? 0) + (ft.sos2 ?? 0) + (ft.sos3 ?? 0);
    assert(soEm(tr.rows.filter((r: any) => r.ft)) === soFt, `FT: Đang SOS ${soEm(tr.rows.filter((r: any) => r.ft))} ≠ Tổng hợp ${soFt}`);
    const th = kyHang('thuong');
    const soTh = (th['gk-1'] ?? 0) + (th['gk-2'] ?? 0);
    const thuong = tr.rows.filter((r: any) => !r.ft);
    assert(soEm(thuong) === soTh, `Lớp thường: Đang SOS ${soEm(thuong)} ≠ Tổng hợp ${soTh}`);
    assert(thuong.length > 0, 'lớp thường không có trong Đang SOS');
    for (const r of thuong) assert(r.sosLevel === Math.min(3, r.kyNang.length) && r.luot === 'Progress', `nhãn SOS lớp thường: ${JSON.stringify([r.sosLevel, r.kyNang, r.luot])}`);
    for (const r of tr.rows) assert(r.sosLevel >= 1 && r.sosLevel <= 3 && r.kyNang.length > 0, `dòng không SOS: ${JSON.stringify(r)}`);
    assert(tr.tuanCo.includes(W2SEP), 'danh sách tuần có SOS thiếu W2 SEP');
  });

  check('OV12f-2 · Toàn bộ = mọi tuần trong 8 tuần (mỗi lượt một dòng, tuần mới trước); Case đã xong vẫn có dòng; mặc định = tuần MT gần nhất đã thi; nhóm xử lý đúng ba chữ', () => {
    const toan = sos.dangSos(QL, { tuan: 'tat-ca', phamVi: 'chi-nhanh', branchId: mb });
    assert(toan.toanBo && toan.tuan === null, 'không phải Toàn bộ');
    const tuan = sos.dangSos(QL, { tuan: W2SEP, phamVi: 'chi-nhanh', branchId: mb });
    const idToan = new Set(toan.rows.map((r: any) => r.attemptId));
    assert(tuan.rows.every((r: any) => idToan.has(r.attemptId)), 'Toàn bộ thiếu lượt của W2 SEP');
    assert(new Set(toan.rows.map((r: any) => r.tuan)).size > 1, 'Toàn bộ chỉ có một tuần');
    assert(toan.rows.every((r: any) => r.tuan >= toan.tu && r.tuan <= toan.den), 'dòng ngoài khoảng 8 tuần');
    const macDinh = sos.dangSos(QL, { phamVi: 'chi-nhanh', branchId: mb });
    assert(macDinh.tuan === W2SEP && !macDinh.toanBo, `mặc định phải là tuần thi gần nhất đã qua (W2 SEP): ${macDinh.tuan}`);
    const nhom = new Set(toan.rows.flatMap((r: any) => r.cases.map((c: any) => c.nhom)));
    assert([...nhom].every((k) => ['cho-duyet', 'dang-xu-ly', 'xong'].includes(k as string)), `nhóm lạ: ${[...nhom]}`);
    /* Case đã xong của một lượt SOS: vẫn là dòng, nhóm Xong. */
    const daXong = one(`SELECT sc.id, sc.attempt_id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN report_periods rp ON rp.id = a.planned_period_id
      JOIN classes c ON c.id = a.class_id WHERE sc.status != 'done' AND c.branch_id = ? AND rp.week_start = ? AND a.kind = 'mock' LIMIT 1`, mb, W2SEP);
    assert(daXong, 'seed không có Case SOS W2 SEP');
    thu(() => {
      conn.prepare(`UPDATE sos_cases SET status = 'done', outcome = 'improved', closed_at = ? WHERE id = ?`).run('2026-09-13', daXong.id);
      xoaNho();
      const sau = sos.dangSos(QL, { tuan: W2SEP, phamVi: 'chi-nhanh', branchId: mb });
      const c = sau.rows.flatMap((r: any) => r.cases).find((x: any) => x.id === daXong.id);
      assert(c && c.nhom === 'xong', `Case xong: ${JSON.stringify(c)}`);
    });
    assert(d.nhomXuLyCase('cho-xac-nhan-pa', true) === 'cho-duyet' && d.nhomXuLyCase('dang-lam', false) === 'cho-duyet'
      && d.nhomXuLyCase('dang-lam', true) === 'dang-xu-ly' && d.nhomXuLyCase('huy-khong-theo-doi', false) === 'xong'
      && d.nhomXuLyCase('cho-duyet-khong-theo-doi', true) === 'cho-duyet', 'nhomXuLyCase');
  });

  check('OV12f-3 · Quyền đi cùng giao diện: Admin 403 · QL chi nhánh khác không thấy MB · GV chỉ lớp mình dạy · TVV chỉ HV của mình · CX mọi chi nhánh', () => thu(() => {
    const ql = sos.dangSos(QL, { tuan: 'tat-ca', phamVi: 'chi-nhanh', branchId: mb });
    const admin = loadPrincipal(tao([{ role: 'office_admin', branches: ['MB'] }]));
    assert(loi(() => sos.dangSos(admin, { tuan: 'tat-ca' }))?.status === 403, 'Admin không bị chặn');
    const cp = sos.dangSos(P.cpManager, { tuan: 'tat-ca' });
    const lopMb = new Set(all('SELECT id FROM classes WHERE branch_id = ?', mb).map((r) => r.id));
    assert(!cp.rows.some((r: any) => lopMb.has(r.classId)), 'QL CP thấy dòng của MB');
    const gv = P.w1Teacher;
    const day = new Set(gv.assignments.map((a: any) => a.classId));
    const g = sos.dangSos(gv, { tuan: 'tat-ca', phamVi: 'toi' });
    assert(g.rows.length > 0 && g.rows.every((r: any) => day.has(r.classId)), `GV thấy lớp không dạy: ${g.rows.map((r: any) => r.classCode)}`);
    /* GVBM thấy đủ hàng của lớp mình (mọi kỹ năng) — số dòng lớp đó = QL. */
    const ft101 = classId('MB FT 101');
    assert(g.rows.filter((r: any) => r.classId === ft101).length === ql.rows.filter((r: any) => r.classId === ft101).length, 'GVBM thiếu dòng của lớp mình');
    const idTvv = tao([{ role: 'consultant', branches: ['MB'] }]);
    const em = ql.rows[0].studentId;
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, em);
    xoaNho();
    const tvv = sos.dangSos(loadPrincipal(idTvv), { tuan: 'tat-ca' });
    assert(tvv.rows.length > 0 && tvv.rows.every((r: any) => r.studentId === em), `TVV thấy em khác: ${tvv.rows.map((r: any) => r.studentId)}`);
    assert(tvv.rows[0].lienHe && 'parentPhone' in tvv.rows[0].lienHe, 'TVV không có Phụ huynh');
    const cx = sos.dangSos(loadPrincipal(tao([{ role: 'cx', branches: [] }])), { tuan: 'tat-ca' });
    assert(soEm(cx.rows) >= soEm(ql.rows) + soEm(cp.rows), `CX chưa đủ mọi chi nhánh: ${soEm(cx.rows)}`);
    assert(cx.rows.some((r: any) => r.tvv === `Thử OV12f ${seq - 1}`), 'CX thiếu cột TVV');
  }));

  check('OV12f-4 · Panel một em: Case của em (kèm nhóm xử lý, nguyên nhân, PA) · người ngoài phạm vi 403', () => thu(() => {
    const ql = sos.dangSos(QL, { tuan: W2SEP, phamVi: 'chi-nhanh', branchId: mb });
    const r = ql.rows.find((x: any) => x.cases.length > 0);
    assert(r, 'không có dòng SOS có Case');
    const p = sos.panelMotEm(QL, r.studentId);
    assert(p.em.id === r.studentId && p.em.ten, 'panel thiếu em');
    for (const c of r.cases) assert(p.cases.some((x: any) => x.id === c.id && x.nhom === c.nhom), `panel thiếu Case ${c.id}`);
    assert(p.cases.every((c: any) => Array.isArray(c.pa) && 'nguyenNhan' in c), 'Case thiếu PA / nguyên nhân');
    assert(loi(() => sos.panelMotEm(P.cpManager, r.studentId))?.status === 403, 'QL CP mở được panel em MB');
    const idTvv = tao([{ role: 'consultant', branches: ['CP'] }]);
    assert(loi(() => sos.panelMotEm(loadPrincipal(idTvv), r.studentId))?.status === 403, 'TVV chi nhánh khác mở được panel');
  }));

  check('OV12f-5 · Góc nhìn trên URL: view=sos → Đang SOS; can-lam / qua-han / cho-duyet / thieu_tt / case_* → Cần làm (+ lọc phụ); khác → Tất cả', () => {
    const g = (v: string | null, l: string | null = null) => JSON.stringify(d.docGoc(v, l));
    assert(g('sos') === JSON.stringify({ goc: 'sos', loc: null }) && g('sos_open') === g('sos'), 'sos');
    assert(g('qua-han') === JSON.stringify({ goc: 'can-lam', loc: 'qua-han' }), 'qua-han cũ');
    assert(g('cho-duyet') === JSON.stringify({ goc: 'can-lam', loc: 'cho-duyet' }), 'cho-duyet cũ');
    assert(g('can-lam', 'thieu_tt') === JSON.stringify({ goc: 'can-lam', loc: 'thieu_tt' }), 'can-lam + loc');
    assert(g('can-lam', 'la') === JSON.stringify({ goc: 'can-lam', loc: null }) && g('case_overdue') === g('can-lam'), 'can-lam');
    assert(g(null) === JSON.stringify({ goc: 'tat-ca', loc: null }) && g('la') === g(null), 'tat-ca');
  });

  check('OV12f-6 · Cần làm TVV: Chọn bước tiếp + Kết quả thi chỉ của em trong phạm vi (cùng nguồn việc Công việc)', () => thu(() => {
    const idTvv = tao([{ role: 'consultant', branches: ['MB'] }]);
    const ems = all(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
      WHERE c.branch_id = ? AND s.archived_at IS NULL ORDER BY s.id LIMIT 3`, mb).map((r) => r.id);
    for (const id of ems) conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(idTvv, id);
    xoaNho();
    const tr = theoVai.hocVienTheoVai(loadPrincipal(idTvv), {});
    const co = new Set(tr.rows.map((r: any) => r.id));
    for (const k of [...Object.keys(tr.viec.buocTiep), ...Object.keys(tr.viec.ketQuaThi)]) assert(co.has(Number(k)), `việc của em ngoài phạm vi: ${k}`);
    const ca = theoVai.hocVienTheoVai(loadPrincipal(idTvv), { phamVi: 'chi-nhanh' });
    assert(Object.keys(ca.viec.buocTiep).length >= Object.keys(tr.viec.buocTiep).length, 'Cả chi nhánh ít việc hơn HV của tôi');
  }));

  check('OV12f-7 · TVV hai chi nhánh chọn "Cả chi nhánh": Đang SOS theo đúng chi nhánh trang TVV đã chọn (web gửi phamVi.chiNhanh) — có dòng, chỉ chi nhánh đó', () => thu(() => {
    const idTvv = tao([{ role: 'consultant', branches: ['CP', 'MB'] }]);
    const tvv = loadPrincipal(idTvv);
    const cn = theoVai.hocVienTheoVai(tvv, { phamVi: 'chi-nhanh', branchId: mb }).phamVi.chiNhanh;
    assert(cn === mb, `trang TVV không giữ chi nhánh đã chọn: ${cn}`);
    const r = sos.dangSos(tvv, { phamVi: 'chi-nhanh', branchId: cn, tuan: 'tat-ca' });
    const lopMb = new Set(all('SELECT id FROM classes WHERE branch_id = ?', mb).map((x) => x.id));
    assert(r.rows.length > 0 && r.rows.every((x: any) => lopMb.has(x.classId)), `TVV hai chi nhánh: ${r.rows.length} dòng`);
  }));

  check('OV12f-8 · Lỗi bản chính 14/10: mở / đóng lớp (ghi `open=` lên URL) KHÔNG đổi đường /hoc-vien-lop (đổi đường = cả trang tải lại); vào bằng link một đích thì không gửi cnNho', () => {
    const vao = new URLSearchParams('phamVi=chi-nhanh');
    const o = { tuLienKet: d.coDichLienKet(vao), daNho: 3 };
    const truoc = d.duongHocVienLop(vao, o);
    for (const open of ['12', '12,15', '-']) {
      const sau = new URLSearchParams(`phamVi=chi-nhanh&open=${open}`);
      assert(d.duongHocVienLop(sau, o) === truoc, `mở lớp đổi đường: ${d.duongHocVienLop(sau, o)} ≠ ${truoc}`);
    }
    assert(truoc.includes('cnNho=3'), `thiếu lần chọn trước: ${truoc}`);
    const link = new URLSearchParams('classId=7');
    assert(!d.duongHocVienLop(link, { tuLienKet: d.coDichLienKet(link), daNho: 3 }).includes('cnNho'), 'link một lớp vẫn gửi cnNho');
  });
}
