/**
 * PHÉP KIỂM SUA-NO-RA — nợ rà sâu 21/10 của CV-LOI #499 và LUAT-5 #495 (chống mất dữ liệu / quyền). Mỗi ca trong một giao dịch rồi cuộn lại.
 *   S1 phân công: lưu bằng phiên bản cũ → 409, không ghi đè · S2 migrate gán chủ Case chạy một lần, nhật ký có nguồn ·
 *   S3 huỷ quyết định thẻ thu hồi khi đã có thẻ mới đang chờ · S4 số thẻ thu hồi tính sống · S5 người gửi rời lớp không sửa / rút được.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSuaNoRaTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const classes: any = await import('../classes/classes.ts');
  const { migratePrCvLoi, KHOA_PR_CV_LOI, NGUON_PR_CV_LOI }: any = await import('../migrate/prCvLoi.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSUA-NO-RA · phân công có phiên bản · migrate gán chủ một lần');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const LOP = classId('MB FOU 12');
  /* Bức tranh mỗi ô một người (phép kiểm trước có thể để lại 2 dòng một ô — mẫu prCvLoi `lopThieu`): ô trùng giữ dòng của GVCN. */
  const tranh = (d: any) => {
    const gvcn = new Set(d.core.map((c: any) => c.userId));
    const moiO = new Map<string, any>();
    for (const c of d.core.slice(0, 1)) moiO.set('gvcn', { userId: c.userId, skill: null, isCore: true });
    for (const b of [...d.bySkill].sort((x: any, y: any) => Number(gvcn.has(y.userId)) - Number(gvcn.has(x.userId)))) {
      if (!moiO.has(b.skill)) moiO.set(b.skill, { userId: b.userId, skill: b.skill, isCore: false });
    }
    return [...moiO.values()];
  };

  check('S1 phân công: lưu bằng phiên bản đọc trước khi người khác đổi → 409, phân công người kia giữ nguyên; tải lại rồi lưu → được', () => thu(() => {
    const doc = classes.classTeachers(P.mbManager, LOP);
    assert(typeof doc.phienBan === 'string' && doc.phienBan.length > 0, 'GET /teachers phải trả phienBan');
    /* Người khác đổi phân công (kết thúc một dòng, mở dòng mới cùng ô) — bức tranh vẫn hợp lệ, phiên bản đổi. */
    const d = one(`SELECT * FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND is_core = 0 ORDER BY id LIMIT 1`, LOP);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE id = ?`).run(t.TODAY, d.id);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
      .run(d.user_id, LOP, d.skill, 0, t.TODAY, '2026-10-24T00:00:00Z');
    const truoc = all(`SELECT id FROM teacher_assignments WHERE class_id = ? AND status = 'active' ORDER BY id`, LOP).map((r) => r.id).join(',');
    assert(ma(() => classes.setClassTeachers(P.mbManager, LOP, { slots: tranh(doc), phienBan: doc.phienBan })) === 409, 'phiên bản cũ phải 409');
    const sau = all(`SELECT id FROM teacher_assignments WHERE class_id = ? AND status = 'active' ORDER BY id`, LOP).map((r) => r.id).join(',');
    assert(truoc === sau, 'không ghi gì khi 409');
    const moi = classes.classTeachers(P.mbManager, LOP);
    assert(moi.phienBan !== doc.phienBan, 'phiên bản mới khác');
    let loi: any = null;
    try { classes.setClassTeachers(P.mbManager, LOP, { slots: tranh(moi), phienBan: moi.phienBan }); } catch (e) { loi = e; }
    assert(loi === null, `phiên bản mới lưu được: ${loi?.status} ${loi?.message}`);
  }));

  check('S2 migrate prCvLoi: chạy một lần (khoá demo_config); Case trống chủ sau đó không bị migrate gán; lần gán có nhật ký nguồn', () => thu(() => {
    assert(one('SELECT 1 x FROM demo_config WHERE key = ?', KHOA_PR_CV_LOI), 'migrate lúc dựng CSDL phải để lại khoá');
    const c = one(`SELECT sc.id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
      WHERE e.class_id = ? AND sc.status != 'done' AND sc.tam = 0 AND sc.owner_user_id IS NOT NULL ORDER BY sc.id LIMIT 1`, LOP);
    assert(c, 'demo phải có Case mở có chủ ở MB FOU 12');
    conn.prepare('UPDATE sos_cases SET owner_user_id = NULL WHERE id = ?').run(c.id);
    const a1: string[] = [];
    migratePrCvLoi(conn, a1);
    assert(one('SELECT owner_user_id o FROM sos_cases WHERE id = ?', c.id).o === null && !a1.length, 'đã chạy rồi → không gán, không báo');
    /* Lần chạy đầu (CSDL chưa có khoá): gán + lịch sử + nhật ký nguồn; chạy lại không đổi gì. */
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(KHOA_PR_CV_LOI);
    migratePrCvLoi(conn, a1);
    assert(one('SELECT owner_user_id o FROM sos_cases WHERE id = ?', c.id).o !== null, 'lần đầu gán chủ');
    const nk = all(`SELECT after_json j FROM audit_logs WHERE action = 'case.owner_assign' AND entity_type = 'case' AND entity_id = ?`, c.id);
    assert(nk.length === 1 && JSON.parse(nk[0].j)._nguon === NGUON_PR_CV_LOI, `nhật ký nguồn: ${JSON.stringify(nk)}`);
    const dem = () => one('SELECT (SELECT COUNT(*) FROM sos_case_history) + (SELECT COUNT(*) FROM audit_logs) n').n;
    const n0 = dem();
    migratePrCvLoi(conn, []);
    migratePrCvLoi(conn, []);
    assert(dem() === n0, 'chạy lặp không ghi gì');
  }));

  // ------------------------------------------------------------------ LUAT-5 (thẻ thu hồi)
  const intake = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const perm: any = await import('../permissions.ts');
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const FT = classId('MB FT 101');
  let dem = 0;
  const moiEm = (): number => {
    const ten = `SUANORA em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: FT, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `suanora-${ten}` } as any);
    const st = one('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, one("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    return st.id as number;
  };
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm số ${i + 1}`, occurredOn: new Date(Date.parse(t.TODAY) - (i + 1) * 864e5).toISOString().slice(0, 10) }).violation.id as number);
  const xuLy = (who: any, sid: number, ids: number[]) => xu.xacNhanXuLy(who, sid, { violationIds: ids, performedOn: t.TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
  const theThuHoi = (id: number) => all("SELECT * FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND doi_tuong_loai = 'discipline_measure' AND doi_tuong_id = ? ORDER BY id", id);
  const trangThai = (id: number) => one('SELECT status FROM discipline_measures WHERE id = ?', id)?.status ?? null;

  check('S3 thẻ thu hồi QL từ chối, GVCN gửi lại (thẻ mới chờ) → thẻ cũ không có "Huỷ quyết định"; gọi huỷ → 400 có lý do, thẻ mới + lần xử lý giữ nguyên', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Em không vi phạm' });
    const cu = theThuHoi(r1.id)[0].id;
    yc.tuChoiYeuCau(ql, cu, 'Vi phạm đúng');
    xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Gửi lại kèm bằng chứng' });
    const moi = theThuHoi(r1.id).find((x) => x.trang_thai === 'cho').id;
    const daXuLy = yc.hopChoDuyet(ql, { xem: 'da-xu-ly' }).the.find((x: any) => x.id === cu);
    assert(daXuLy && !daXuLy.coTheHuy, `thẻ cũ không được hiện nút huỷ: ${JSON.stringify(daXuLy?.coTheHuy)}`);
    assert(ma(() => yc.huyQuyetDinh(ql, cu)) === 400, 'huỷ thẻ cũ phải 400 (không vỡ chỉ mục)');
    assert(one('SELECT trang_thai s FROM yeu_cau_duyet WHERE id = ?', moi).s === 'cho' && one('SELECT trang_thai s FROM yeu_cau_duyet WHERE id = ?', cu).s === 'tu_choi', 'hai thẻ giữ nguyên');
    assert(trangThai(r1.id) === 'done', 'lần xử lý giữ nguyên');
    /* Không có thẻ mới chờ → huỷ từ chối vẫn được (mẫu PR-LUI-a2 không đổi). */
    yc.rutYeuCau(gvcn, moi);
    assert(yc.hopChoDuyet(ql, { xem: 'da-xu-ly' }).the.find((x: any) => x.id === cu)?.coTheHuy === true, 'rút thẻ mới → thẻ cũ huỷ được');
    yc.huyQuyetDinh(ql, cu);
    assert(one('SELECT trang_thai s FROM yeu_cau_duyet WHERE id = ?', cu).s === 'cho', 'huỷ quyết định → thẻ về chờ');
  }));

  check('S4 GVCN sửa vi phạm của lần xử lý khi thẻ thu hồi còn chờ → thẻ nói đúng số hiện tại; duyệt lưu số lúc duyệt', () => thu(() => {
    const sid = moiEm(); const [v1, v2, v3] = nVp(sid, 3);
    xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Bấm nhầm' });
    const moTa = () => yc.theCuaDoiTuong('discipline_measure', [r2.id]).find((c: any) => c.loai === 'thu_hoi_y_thuc');
    assert(/1 vi phạm về chưa xử lý/.test(moTa().neuDuyet), moTa().neuDuyet);
    xu.suaViPhamXuLy(gvcn, r2.id, { violationIds: [v2, v3] });
    assert(/2 vi phạm về chưa xử lý/.test(moTa().neuDuyet) && moTa().phu === '2 vi phạm', `sau sửa: ${moTa().neuDuyet} · ${moTa().phu}`);
    const hop = yc.hopChoDuyet(ql, {}).the.find((x: any) => x.loai === 'thu_hoi_y_thuc' && x.doiTuongId === r2.id);
    assert(hop && /2 vi phạm/.test(hop.neuDuyet), `hộp QL: ${hop?.neuDuyet}`);
    yc.duyetYeuCau(ql, theThuHoi(r2.id)[0].id);
    assert(JSON.parse(theThuHoi(r2.id)[0].du_lieu).soViPham === 2, 'thẻ đã duyệt lưu 2 vi phạm');
  }));

  check('S5 GVCN gửi thẻ rồi rời lớp → không sửa / rút được thẻ thu hồi và đề xuất Gửi QL (403); QL vẫn từ chối / duyệt được', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Bấm nhầm' });
    const th = theThuHoi(r1.id)[0].id;
    /* Em thứ hai: đề xuất "Gửi QL" (thẻ y_thuc, không tăng bậc — mẫu L5-9) còn chờ. */
    const em2 = moiEm(); const [w1, w2] = nVp(em2, 2);
    xuLy(gvcn, em2, [w1]);
    const dx = xu.deXuat(gvcn, em2, { kind: 'report_1', violationIds: [w2], note: 'Không tăng bậc, giữ Report 1' });
    xu.guiDeXuat(gvcn, dx.id);
    const thDx = one("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'", dx.id).id;
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE class_id = ? AND user_id = ? AND status = 'active'`).run(t.TODAY, FT, gvcn.userId);
    xoaNho();
    const cuGvcn = perm.loadPrincipal(gvcn.userId);
    assert(ma(() => yc.suaYeuCau(cuGvcn, th, { lyDo: 'Sửa lý do' })) === 403, 'sửa thẻ thu hồi sau khi rời lớp');
    assert(ma(() => yc.rutYeuCau(cuGvcn, th)) === 403, 'rút thẻ thu hồi sau khi rời lớp');
    assert(ma(() => yc.suaYeuCau(cuGvcn, thDx, { note: 'Sửa ghi chú đề xuất' })) === 403, 'sửa đề xuất Gửi QL sau khi rời lớp');
    assert(ma(() => yc.rutYeuCau(cuGvcn, thDx)) === 403, 'rút đề xuất Gửi QL sau khi rời lớp');
    assert(one('SELECT trang_thai s FROM yeu_cau_duyet WHERE id = ?', th).s === 'cho' && trangThai(dx.id) === 'cho_duyet', 'thẻ + đề xuất vẫn chờ');
    yc.tuChoiYeuCau(ql, th, 'Không đủ căn cứ');
    yc.duyetYeuCau(ql, thDx);
    assert(one('SELECT trang_thai s FROM yeu_cau_duyet WHERE id = ?', th).s === 'tu_choi' && trangThai(dx.id) === 'da_duyet', 'QL vẫn xử lý được');
  }));
}
