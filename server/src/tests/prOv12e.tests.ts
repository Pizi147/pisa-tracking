/**
 * PHÉP KIỂM PR-OV12e (hệ panel làm việc v3 + panel số liệu mở rộng dòng, đặc tả OV-12 mục 7.12, P12):
 *   · chip hạn 3 mức ở MỘT chỗ `deadlineView` (quá hạn · còn ≤ 3 ngày · xa hơn);
 *   · Quyết định 3 nút Giữ nguyên · Điều chỉnh · Kết thúc PA — "Thay PA", "Xin hỗ trợ QL" nằm TRONG Điều chỉnh, không mất chức năng;
 *   · số ở ô = số dòng panel (cùng `MetricResult`), dòng Case / PA / bài / việc Vận hành mang việc của dòng + cờ "người xem làm được";
 *   · dòng Case đã xong không còn hạn (nghi lỗi đặc tả mục 1: hạn xác nhận cũ còn dính) · thao tác đúng vai — vai khác gọi API bị 403.
 * Ca ghi dữ liệu chạy trong giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv12eTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const cases: any = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const fs: any = await import('node:fs');
  const path: any = await import('node:path');
  const { fileURLToPath }: any = await import('node:url');
  const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const doc = (f: string): string => fs.readFileSync(path.join(GOC, f), 'utf8');
  console.log('\nPR-OV12e · hệ panel v3 · chip hạn 3 mức · Quyết định 3 nút · panel số liệu mở rộng dòng');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const cong = (n: number) => { const d = new Date(`${TODAY}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  check('OV12e-1 · deadlineView 3 mức: quá hạn · còn ≤ 3 ngày (gần) · xa hơn; dự kiến kết thúc không bao giờ gần / quá', () => {
    const v = (n: number, kind = 'xac-minh-sos') => dm.deadlineView({ kind, due: cong(n), today: TODAY });
    assert(v(-2).tone === 'overdue' && v(-2).ganHan === false, `quá hạn: ${JSON.stringify(v(-2))}`);
    for (const n of [0, 1, 3]) assert(v(n).tone !== 'overdue' && v(n).ganHan === true, `còn ${n} ngày phải "gần": ${v(n).ganHan}`);
    assert(v(4).ganHan === false && v(10).ganHan === false, 'còn 4 / 10 ngày là xa');
    assert(v(1, 'du-kien-ket-thuc').ganHan === false, 'dự kiến kết thúc không phải hạn');
    assert(dm.deadlineView({ kind: 'nhap-diem', due: null, today: TODAY }).ganHan === false, 'chưa có hạn');
    assert(dm.HAN_GAN_NGAY === 3, 'ngưỡng 3 ngày một hằng');
  });

  check('OV12e-2 · Quyết định 3 nút: PA thường Giữ nguyên · Điều chỉnh · Kết thúc PA, Điều chỉnh chứa Sửa PA · Thay PA · Xin hỗ trợ QL; PA quy chế không Kết thúc; không mất lựa chọn nào', () => {
    const thuong = dm.quyetDinhChoPa({ preset: false }, false);
    const n = dm.nhomQuyetDinh(thuong);
    assert(JSON.stringify(n.tren) === JSON.stringify(['keep', 'adjust', 'end']), `tren: ${n.tren}`);
    assert(JSON.stringify(n.dieuChinh) === JSON.stringify(['adjust', 'replace', 'ask_manager']), `dieuChinh: ${n.dieuChinh}`);
    const quyChe = dm.nhomQuyetDinh(dm.quyetDinhChoPa({ preset: true }, false));
    assert(JSON.stringify(quyChe.tren) === JSON.stringify(['keep', 'adjust']) && JSON.stringify(quyChe.dieuChinh) === JSON.stringify(['adjust', 'ask_manager']),
      `quy chế: ${JSON.stringify(quyChe)}`);
    for (const ds of [thuong, dm.quyetDinhChoPa({ preset: true }, false)]) {
      const g = dm.nhomQuyetDinh(ds);
      const hop = new Set([...g.tren.filter((x: string) => x !== 'adjust'), ...g.dieuChinh]);
      assert(hop.size === ds.length && ds.every((x: string) => hop.has(x)), `mất lựa chọn: ${ds} → ${[...hop]}`);
    }
    const cuoi = dm.nhomQuyetDinh(dm.quyetDinhChoPa({ preset: true }, true));
    assert(cuoi.tren.length === 0 && cuoi.dieuChinh.length === 0, 'lần cuối không có Quyết định');
  });

  check('OV12e-2c · không mất chữ đang gõ: "← Danh sách / ← tên em / ← Case" (nút quayLai của KhungPanel) hỏi trước khi panel đang sửa dở (chan.daSua); Hoàn thành Case báo daSua', () => {
    const kp = doc('web/src/ui/KhungPanel.tsx');
    assert(/const veLai = \(\) => \{\s*if \(daSua && !window\.confirm\(/.test(kp) && /onClick=\{veLai\}>← \{quayLai\.nhan\}/.test(kp), 'quayLai chưa qua veLai');
    assert(/tieuDe=\{?t?\(?['"]Hoàn thành Case['"]\)?\}?[\s\S]{0,200}daSua:/.test(doc('web/src/modules/cases/ThaoTacCase.tsx')), 'Hoàn thành Case thiếu daSua');
  });

  check('OV12e-1b · ngưỡng hạn một chỗ: panel số liệu, Ngăn Case chỉ đọc, thẻ Chờ duyệt, bảng kỹ năng, thẻ kỹ năng, Han không tự so ngày / chỉ "hôm nay" mới vàng', () => {
    for (const f of ['web/src/ui/SoLieu.tsx', 'web/src/modules/students/NganCase.tsx']) {
      assert(!/\.slice\(0, 10\) < homNay|\.han < homNay|86_400_000/.test(doc(f)), `${f} còn tự tính quá hạn`);
    }
    assert(/hanV!\.ganHan \? 'text-soon'/.test(doc('web/src/modules/duyet/TheYeuCau.tsx')), 'TheYeuCau');
    assert(/v\.ganHan \? <span className="font-semibold text-soon">/.test(doc('web/src/modules/cases/SkillBoard.tsx')), 'SkillBoard');
    assert(/han\.ganHan \? 'font-semibold text-soon'/.test(doc('web/src/modules/cases/TheKyNang.tsx')), 'TheKyNang');
    assert(/v\.ganHan && !v\.homNay/.test(doc('web/src/ui/Han.tsx')), 'Han');
  });

  check('OV12e-2b · ⋯ cạnh tên em: "Xác nhận xử lý" ngay sau Ghi vi phạm khi em cần xử lý Ý thức, không có thì không hiện', () => {
    const q = { laLopThuong: false, dangHoc: true, coTheGhiViPham: true, coTheBaoCase: true, coTheNhapDiem: false, coTheSuaHocVien: false, coTheChuyenLop: false };
    const co = dm.mucMenuDongHocVien({ ...q, coTheXuLyYThuc: true });
    assert(co[0] === 'vi-pham' && co[1] === 'xu-ly-y-thuc' && dm.MUC_MENU_DONG_NHAN['xu-ly-y-thuc'] === 'Xác nhận xử lý', JSON.stringify(co));
    assert(!dm.mucMenuDongHocVien(q).includes('xu-ly-y-thuc'), 'không cần xử lý thì không có mục');
  });

  check('OV12e-3 · số ở ô = số dòng panel (QL, GVCN, GVBM) cho các chỉ số Case · PA · bài · Vận hành · lớp · HV', () => {
    const ids = ['case-mo', 'case-cho-xac-dinh-nguyen-nhan', 'case-thieu-pa', 'case-xac-dinh-nguyen-nhan-qua-han', 'pa-can-cap-nhat', 'pa-cho-duyet',
      'bai-qua-han-nhap-diem', 'van-hanh-can-quyet-dinh', 'lop-thieu-gv-mon', 'hv-co-case-mo'];
    let soDong = 0;
    for (const [vai, p] of [['QL', P.mbManager], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher]] as const) {
      for (const id of ids) {
        let r: any;
        try { r = metrics.metricSet(p, id, {}); } catch (e: any) { if (e?.status === 403) continue; throw e; }
        const gon = metrics.metricResponse(r, false, p);
        const day = metrics.metricResponse(r, true, p);
        assert(gon.n === day.rows.length && day.n === day.rows.length, `${vai} ${id}: ô ${gon.n} ≠ ${day.rows.length} dòng`);
        soDong += day.rows.length;
      }
    }
    assert(soDong > 0, 'bộ demo phải có ít nhất một dòng để so');
  });

  /* Case MT đang "Chờ xác nhận PA" (bộ demo) — PA theo quy chế chưa xác nhận, nguyên nhân đã có. */
  const paCho = all(`SELECT iv.id, iv.case_id, sc.topic, sc.student_id,
       COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = sc.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), a.class_id) AS class_id
     FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
     WHERE iv.preset = 1 AND iv.confirmed_at IS NULL AND iv.status = 'planned' AND iv.kind != 'bo_tro' AND sc.status != 'done'
       AND sc.student_id IS NOT NULL AND sc.topic IN ('listening', 'reading', 'speaking') ORDER BY iv.id LIMIT 40`)
    .find((r) => { try { return cases.caseDetail(P.mbManager, r.case_id).trangThaiV4?.k === 'cho-xac-nhan-pa'; } catch { return false; } });   // chỉ Case QL MB xem được
  /** GV chỉ dạy MÔN KHÁC ở lớp của Case (không GVCN). */
  const gvMonKhac = (lop: number, topic: string) => {
    const r = one(`SELECT ta.user_id u FROM teacher_assignments ta WHERE ta.class_id = ? AND ta.status = 'active' AND ta.skill IS NOT NULL AND ta.skill != ?
        AND ta.skill NOT LIKE 'writing%' AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND (is_core = 1 OR skill = ?) AND status = 'active')
      ORDER BY ta.id LIMIT 1`, lop, topic, lop, topic);
    return r ? loadPrincipal(r.u) : null;
  };

  check('OV12e-4 · dòng Case / PA mang việc của dòng: Xác nhận PA (PA cần chốt, QL làm được, GV môn khác chỉ đọc); Case đã xong không còn hạn / việc', () => thu(() => {
    assert(paCho, 'bộ demo thiếu Case MT có PA quy chế chờ xác nhận');
    const dQl = metrics.rowsFor('case', [paCho.case_id], 'case-mo', P.mbManager)[0];
    assert(dQl.viec?.loai === 'xac-nhan-pa' && dQl.viec.paId === paCho.id && dQl.viec.lam === true, `QL: ${JSON.stringify(dQl.viec)}`);
    assert(dQl.viec.pa && typeof dQl.viec.pa.description === 'string', 'Xác nhận PA ngay trong dòng cần nội dung PA');
    assert(dQl.em?.id === paCho.student_id && typeof dQl.lop === 'string', `đầu dòng em · lớp: ${JSON.stringify([dQl.em, dQl.lop])}`);
    /* Ngăn Case chỉ đọc (TVV / CX) có dòng Phụ huynh — cùng liên hệ đầu hồ sơ. */
    const ph = cases.caseDetail(P.mbManager, paCho.case_id).student?.phuHuynh;
    assert(ph && 'parentName' in ph && 'parentPhone' in ph, `phuHuynh: ${JSON.stringify(ph)}`);
    const pa = metrics.rowsFor('phuong-an', [paCho.id], 'pa-can-cap-nhat', P.mbManager)[0];
    assert(pa.viec?.loai === 'xac-nhan-pa' && pa.viec.caseId === paCho.case_id, `dòng PA: ${JSON.stringify(pa.viec)}`);
    const khac = gvMonKhac(paCho.class_id, paCho.topic);
    if (khac) {
      const d = metrics.rowsFor('case', [paCho.case_id], 'case-mo', khac)[0];
      assert(d.viec && d.viec.lam === false, `GV môn khác chỉ đọc: ${JSON.stringify(d.viec)}`);
    }
    /* Nghi lỗi đặc tả mục 1: Case xong vẫn mang hạn xác nhận → panel báo "quá hạn". */
    conn.prepare(`UPDATE sos_cases SET status = 'done', han_xac_nhan = ? WHERE id = ?`).run(cong(-9), paCho.case_id);
    xoaNho();
    const xong = metrics.rowsFor('case', [paCho.case_id], 'case-mo', P.mbManager)[0];
    assert(!xong.han && !xong.viec, `Case xong: han ${xong.han} · việc ${JSON.stringify(xong.viec)}`);
  }));

  check('OV12e-4b · cờ "làm được" của dòng Ghi kết quả = `ghiDuoc` của Ngăn Case (rà #395: u9 PA 15, u7 PA 10 thấy nút mà 403; GVCN với PA bổ trợ 55, 61, 62, 69–72 không thấy)', () => {
    const pas = all(`SELECT iv.id, iv.case_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.status IN ('planned', 'started') AND iv.action_due IS NOT NULL AND sc.status != 'done' AND sc.student_id IS NOT NULL ORDER BY iv.id`);
    assert(pas.length > 5, 'bộ demo thiếu PA đang chạy');
    const vai = [P.mbManager, P.coreTeacher, P.subjectTeacher, loadPrincipal(7), loadPrincipal(9), P.lrTeacher, P.sTeacher, P.normalCoreTeacher];
    let soSo = 0;
    const lech: string[] = [];
    for (const p of vai) {
      const ghi = (caseId: number, paId: number) => {
        try { return !!cases.caseDetail(p, caseId).interventions.find((x: any) => x.id === paId)?.ghiDuoc; } catch (e: any) { if (e?.status === 403) return false; throw e; }
      };
      for (const d of metrics.rowsFor('phuong-an', pas.map((r) => r.id), 'pa-can-cap-nhat', p)) {
        if (d.viec?.loai !== 'ghi-ket-qua') continue;
        soSo++;
        if (d.viec.lam !== ghi(d.viec.caseId, d.viec.paId)) lech.push(`u${p.userId} PA ${d.viec.paId}: dòng ${d.viec.lam}`);
      }
      for (const d of metrics.rowsFor('case', [...new Set(pas.map((r) => r.case_id))], 'case-mo', p)) {
        if (d.viec?.loai !== 'ghi-ket-qua') continue;
        soSo++;
        if (d.viec.lam !== ghi(d.viec.caseId, d.viec.paId)) lech.push(`u${p.userId} Case ${d.id} PA ${d.viec.paId}: dòng ${d.viec.lam}`);
      }
    }
    assert(soSo > 20 && !lech.length, `${soSo} dòng so · lệch: ${lech.slice(0, 12).join(' · ')}`);
  });

  check('OV12e-5 · thao tác đúng vai: Xác nhận PA bằng GV môn khác → 403, QL → được; dòng bài mang Nhập điểm (lớp · lượt · kỹ năng)', () => thu(() => {
    assert(paCho, 'bộ demo thiếu Case MT có PA quy chế chờ xác nhận');
    const khac = gvMonKhac(paCho.class_id, paCho.topic);
    assert(khac, 'lớp của Case cần một GV chỉ dạy môn khác');
    const moTa = 'Mỗi tuần 2 đề, tự chấm, nộp GV chữa câu sai.';
    let loi: any = null;
    try { sosAuto.xacNhanPaQuyChe(khac, paCho.id, { description: moTa }); } catch (e) { loi = e; }
    assert(loi?.status === 403, `GV môn khác: ${loi?.status} ${loi?.message}`);
    sosAuto.xacNhanPaQuyChe(P.mbManager, paCho.id, { description: moTa });
    assert(one('SELECT confirmed_at FROM case_interventions WHERE id = ?', paCho.id).confirmed_at, 'QL xác nhận được');
    const r = metrics.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', {});
    if (r.ids.length) {
      const d = metrics.rowsFor('bai', [r.ids[0]], 'bai-qua-han-nhap-diem', P.mbManager)[0];
      assert(d.viec?.loai === 'nhap-diem' && d.viec.classId && /^(mt|cp|thuong):/.test(d.viec.luot) && d.viec.kn, `dòng bài: ${JSON.stringify(d.viec)}`);
    }
  }));
}
