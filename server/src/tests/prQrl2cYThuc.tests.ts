/**
 * Q-RL2c (YThuc) — phép kiểm Hoàn tác / đảo trạng thái: Bỏ việc Báo PH (TVV) → Khôi phục · Bỏ Phối hợp SOS → mở lại GIỮ dữ liệu.
 * Mỗi mục chạy trong giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrQrl2cYThucTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId, addDays } = t;
  console.log('\nQ-RL2c YThuc · Bỏ Báo PH / Phối hợp SOS → Hoàn tác / Khôi phục');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const ma = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const dong = (bang: string, id: number) => JSON.stringify(get(`SELECT * FROM ${bang} WHERE id = ?`, id));
  const nhatKy = (action: string, id: number) => all('SELECT * FROM audit_logs WHERE action = ? AND entity_id IS ? ORDER BY id', action, id);
  const gvcn = P.coreTeacher; const gvbm = P.w1Teacher;

  // ---------------------------------------------------------------- Báo PH (TVV)
  let dem = 0;
  const tvvMoi = () => {
    dem += 1;
    const uid = accounts.createAccount(P.admin, { email: `q2c.tvv${dem}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-q2c', fullName: `TVV Q2C ${dem}`, roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  };
  /** Em mới có TVV + một lần xử lý đã lưu → một việc Báo PH đang mở. */
  const viecMoi = (tvv: any) => {
    const ten = `Q2C em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `q2c-${ten}` } as any);
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    boLichTuTao(conn, get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, sid);
    const vp = viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: 'Vi phạm 1', occurredOn: addDays(TODAY, -1) }).violation.id;
    xu.xacNhanXuLy(gvcn, sid, { violationIds: [vp], performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
    return get('SELECT * FROM viec_bao_ph WHERE student_id = ?', sid);
  };

  await checkAsync('Q2C-YT1 · Bỏ Báo PH (đã có một lần "Chưa liên hệ được") → Khôi phục: dòng việc + lịch sử y hệt; nhật ký; nút theo quyền; lần hai 409; GVCN / QL chi nhánh khác 403', () => thu(() => {
    const tvv = tvvMoi(); const v = viecMoi(tvv);
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [v.id], ketQua: 'chua_lien_he', ghiChu: 'Mẹ em không nghe máy' });
    const truoc = dong('viec_bao_ph', v.id); const lanTruoc = JSON.stringify(all('SELECT * FROM viec_bao_ph_lan WHERE viec_id = ?', v.id));
    const x = bp.boViecBaoPh(tvv, v.id, { lyDo: 'other', lyDoKhac: 'Gia đình đổi số, không liên hệ được' });
    assert(x.trangThai === 'bo' && x.khoiPhucDuoc === true, `sau bỏ: ${JSON.stringify(x)}`);
    assert(bp.xemViecBaoPh(gvcn, v.id).khoiPhucDuoc === false, 'GVCN chỉ xem: không có nút');
    assert(ma(() => bp.khoiPhucViecBaoPh(gvcn, v.id)) === 403 && ma(() => bp.khoiPhucViecBaoPh(P.cpManager, v.id)) === 403, 'không quyền 403');
    const kp = bp.khoiPhucViecBaoPh(tvv, v.id);
    assert(kp.trangThai === 'mo' && kp.coTheGhi && kp.khoiPhucDuoc === false, JSON.stringify(kp));
    assert(dong('viec_bao_ph', v.id) === truoc, `dòng việc lệch: ${dong('viec_bao_ph', v.id)} ≠ ${truoc}`);
    assert(JSON.stringify(all('SELECT * FROM viec_bao_ph_lan WHERE viec_id = ?', v.id)) === lanTruoc, 'lịch sử lần ghi lệch');
    assert(get(`SELECT dao_luc, dao_boi FROM ghi_dao WHERE loai = 'bo_bao_ph' AND doi_tuong_id = ?`, v.id).dao_boi === tvv.userId, 'bản ghi đảo đánh dấu');
    assert(nhatKy('discipline.bao_ph_khoi_phuc', v.measure_id).length === 1, 'nhật ký khôi phục');
    assert(ma(() => bp.khoiPhucViecBaoPh(tvv, v.id)) === 409, 'lần hai 409');
    /* QL chi nhánh (quyền bỏ) khôi phục được việc TVV bỏ — quyền theo việc hiện tại. */
    bp.boViecBaoPh(tvv, v.id, { lyDo: 'not_needed' });
    assert(bp.khoiPhucViecBaoPh(P.mbManager, v.id).trangThai === 'mo' && dong('viec_bao_ph', v.id) === truoc, 'QL khôi phục');
  }));

  await checkAsync('Q2C-YT2 · Bỏ Báo PH rồi có thay đổi sau → 409, không đổi gì; lần xử lý đã thu hồi → 409; việc hệ thống đóng → 409; việc bỏ trước Q-RL2c (không bản ghi đảo) → mở lại cách cũ', () => thu(() => {
    const tvv = tvvMoi();
    const a = viecMoi(tvv);
    bp.boViecBaoPh(tvv, a.id, { lyDo: 'other', lyDoKhac: 'Gia đình xin dời sang tuần sau' });
    conn.prepare(`UPDATE viec_bao_ph SET bo_ly_do_chu = 'Người khác sửa lý do' WHERE id = ?`).run(a.id);
    const sauSua = dong('viec_bao_ph', a.id);
    assert(bp.xemViecBaoPh(tvv, a.id).khoiPhucDuoc === false, 'đã đổi sau: không có nút');
    assert(ma(() => bp.khoiPhucViecBaoPh(tvv, a.id)) === 409 && dong('viec_bao_ph', a.id) === sauSua, 'đổi sau → 409, dòng giữ');

    const b = viecMoi(tvv);
    bp.boViecBaoPh(tvv, b.id, { lyDo: 'not_needed' });
    conn.prepare(`UPDATE discipline_measures SET status = 'thu_hoi' WHERE id = ?`).run(b.measure_id);
    assert(ma(() => bp.khoiPhucViecBaoPh(tvv, b.id)) === 409 && bp.xemViecBaoPh(tvv, b.id).khoiPhucDuoc === false, 'thu hồi → 409');

    const c = viecMoi(tvv);
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_tu_choi', bo_luc = ? WHERE id = ?`).run(new Date().toISOString(), c.id);
    assert(ma(() => bp.khoiPhucViecBaoPh(tvv, c.id)) === 409 && bp.xemViecBaoPh(tvv, c.id).khoiPhucDuoc === false, 'hệ thống đóng → 409');

    const e = viecMoi(tvv);
    const truoc = dong('viec_bao_ph', e.id);
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'handled_otherwise', bo_boi = ?, bo_luc = ? WHERE id = ?`).run(tvv.userId, new Date().toISOString(), e.id);
    assert(bp.xemViecBaoPh(tvv, e.id).khoiPhucDuoc === true, 'việc cũ: có nút');
    assert(bp.khoiPhucViecBaoPh(tvv, e.id).trangThai === 'mo' && dong('viec_bao_ph', e.id) === truoc, 'cách cũ: về đang mở, lý do bỏ xoá');
  }));

  // ---------------------------------------------------------------- Phối hợp SOS
  const viecPhoiHop = (kind: string) => {
    const r = get(`SELECT x.*, e.class_id FROM sos_coordination_actions x JOIN enrollments e ON e.student_id = x.student_id AND e.status = 'active'
        JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled'
        WHERE x.kind = ? AND x.status = 'pending' AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active')
        ORDER BY x.id LIMIT 1`, kind);
    assert(r, `bộ demo thiếu việc ${kind} đang chờ`);
    return { r, gv: loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`, r.class_id).user_id) };
  };
  const PH = 'sos_coordination_actions';

  await checkAsync('Q2C-PH1 · Bỏ Phối hợp → mở lại: NGUYÊN dòng trước khi bỏ (ghi chú sau "Đã xong → Đưa lại", cả ngày / người / nội dung còn trên dòng) ; GVBM 403; lần hai 409', () => thu(() => {
    const { r, gv } = viecPhoiHop('bao_ph_tvv');
    phoiHop.confirmCoordination(gv, r.id, { performedOn: TODAY, note: 'Đã nhờ TVV gọi mẹ em', performerName: 'Cô CS' });
    phoiHop.moLaiCoordination(gv, r.id);   // Đã xong → Đưa lại Cần xử lý (cách cũ: bỏ ngày / người, giữ ghi chú)
    /* Dòng "Cần xử lý" còn mang ngày / người / nội dung (dữ liệu cũ) — cách cũ của Khôi phục xoá trắng; đảo phải giữ. */
    conn.prepare(`UPDATE ${PH} SET performed_on = ?, performer_name = 'Cô CS', noi_dung_luc_bao = '["Nội dung đã báo"]' WHERE id = ?`).run(addDays(TODAY, -1), r.id);
    const truoc = dong(PH, r.id);
    phoiHop.removeCoordination(gv, r.id, { reasonCode: 'handled_otherwise' });
    assert(get(`SELECT status FROM ${PH} WHERE id = ?`, r.id).status === 'removed', 'đã bỏ');
    assert(ma(() => phoiHop.moLaiCoordination(gvbm, r.id)) === 403, 'GVBM 403');
    const kp = phoiHop.moLaiCoordination(gv, r.id);
    assert(kp.status === 'pending' && kp.note === 'Đã nhờ TVV gọi mẹ em' && kp.performerName === 'Cô CS', JSON.stringify(kp));
    assert(dong(PH, r.id) === truoc, `dòng lệch: ${dong(PH, r.id)} ≠ ${truoc}`);
    assert(get(`SELECT dao_boi FROM ghi_dao WHERE loai = 'bo_phoi_hop' AND doi_tuong_id = ?`, r.id).dao_boi === gv.userId, 'bản ghi đảo đánh dấu');
    assert(JSON.parse(nhatKy('sos_coordination.reopen', r.id).slice(-1)[0].after_json).hoanTac === true, 'nhật ký');
    assert(ma(() => phoiHop.moLaiCoordination(gv, r.id)) === 409, 'lần hai 409');
  }));

  await checkAsync('Q2C-PH2 · Bỏ Phối hợp rồi có thay đổi sau → 409 không đổi gì; việc HỆ THỐNG bỏ → vẫn không mở lại (400); việc bỏ trước Q-RL2c → mở lại cách cũ', () => thu(() => {
    const { r, gv } = viecPhoiHop('talk_student');
    phoiHop.removeCoordination(gv, r.id, { reasonCode: 'other', reasonText: 'Gia đình xin dời sang tuần sau' });
    conn.prepare(`UPDATE ${PH} SET remove_reason_text = 'Người khác sửa lý do' WHERE id = ?`).run(r.id);
    const sauSua = dong(PH, r.id);
    assert(ma(() => phoiHop.moLaiCoordination(gv, r.id)) === 409 && dong(PH, r.id) === sauSua, 'đổi sau → 409, dòng giữ');

    conn.prepare(`UPDATE ${PH} SET remove_reason_code = 'system_sos_changed' WHERE id = ?`).run(r.id);
    assert(ma(() => phoiHop.moLaiCoordination(gv, r.id)) === 400, 'hệ thống bỏ → 400 như cũ');

    const { r: r2, gv: gv2 } = viecPhoiHop('talk_student');
    conn.prepare(`UPDATE ${PH} SET status = 'removed', remove_reason_code = 'not_needed', removed_by = ?, removed_at = ? WHERE id = ?`).run(gv2.userId, new Date().toISOString(), r2.id);
    const cu = phoiHop.moLaiCoordination(gv2, r2.id);
    assert(cu.status === 'pending' && cu.removeReasonCode === null, 'cách cũ');
  }));
}
