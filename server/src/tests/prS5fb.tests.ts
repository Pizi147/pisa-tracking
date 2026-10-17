/** PHÉP KIỂM PR-S5F-b — sửa sau rà cuối đợt 5 (Giữa khoá, hồ sơ GV, tốc độ). Mỗi mục một phép kiểm; tốc độ (mục 1, 2) ở `tocDo.run.ts`. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrS5fbTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const boTro: any = await import('../cases/boTro.ts');
  const { timNguoi } = await import('../platform/timNguoi.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const profile: any = await import('../students/profile.ts');
  const { phamViHoSoGv } = await import('../giaoVien/phamVi.ts');
  const { chiTietCaseMo } = await import('../cases/caseLop.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), 'web/src/modules', f), 'utf8');
  console.log('\nPR-S5F-b · Sửa sau rà cuối đợt 5 — Progress Test, hồ sơ GV, tốc độ');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const gvOf = (lop: string, skill: string) => loadPrincipal(get(
    `SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active' AND ta.is_core = 0`, lop, skill).u);
  const paBt = (caseId: number) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status != 'cancelled' ORDER BY id LIMIT 1`, caseId);
  const caseTheoMon = (hv: number, topic: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC', hv, topic);
  const XN = (topic: string) => ({ primaryCode: d.issuesForTopic(topic, 'FOU')[0].code, urgency: 'attention', moTa: 'Em mất điểm ở phần này, thiếu nền tảng ngữ pháp cơ bản.' });
  const KQ = { outcome: 'improved', note: 'Em viết đúng thì ở phần đặt câu, còn nhầm thì quá khứ.', decision: 'keep' };

  /** Em MB FOU 12 trượt Giữa khoá G+V và P → hai Case cùng nhóm PA bổ trợ chung; G+V đã xác nhận nguyên nhân. */
  const emFou = (ten: string) => {
    const cid = classId('MB FOU 12');
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `s5fb-${ten}` });
    regular.planRegularTests(P.admin, cid);
    const hv = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const pt = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress'`, hv).id as number;
    for (const [k, v] of Object.entries({ listening: 18, reading: 18, writing: 11, speaking: 12 })) {
      regular.saveRegularScore(P.admin, pt, k, { score: v, total: 20, lyDo: 'Phép kiểm S5F-b' });
    }
    const khoa = gvOf('MB FOU 12', 'writing');
    const cGv = caseTheoMon(hv, 'writing');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing'));
    return { hv, pt, cGv, khoa, ha: P.normalCoreTeacher };
  };

  // ------------------------------------------------------------------ 3 · M-03: PA chung FOU — GVBM một môn không ghi thay cả nhóm
  check('S5F-b (3) · M-03: PA bổ trợ CHUNG (FOU) — GVBM một môn ghi kết quả → 403; GVCN / Quản lý được; nhóm một môn (BE) GVBM đúng môn vẫn được', () => {
    const { cGv, khoa, ha } = emFou('S5F-b FOU M03');   // PR-CT2: Xác nhận Case → PA bổ trợ chạy ngay
    const iv = paBt(cGv.id);
    assert(iv.status === 'started' && d.nhomBoTro('FOU', 1, 'writing').split(':').length === 2, `PA chạy, nhóm chung: ${iv.status} ${iv.nhom_bo_tro}`);
    assert(!boTro.quyenBoTro(khoa, iv), 'GVBM G+V (không phải người dạy, không GVCN) KHÔNG có quyền ghi PA chung');
    assert(maLoi(() => cases.updateResult(khoa, iv.id, KQ)) === 403, 'GVBM G+V ghi kết quả PA chung phải 403');
    assert(boTro.quyenBoTro(ha, iv) && boTro.quyenBoTro(P.mbManager, iv), 'GVCN và Quản lý ghi được');
    /* Nhóm một môn (BE `gk:{lượt}:{môn}`): GVBM đúng môn vẫn ghi — luật cũ giữ nguyên. */
    const be = classId('MB BE 04');
    /* GVBM S của MB BE 04 — không kiêm GVCN lớp đó (GV W của lớp kiêm GVCN nên không dùng được cho phép phủ định). */
    const gvS = gvOf('MB BE 04', 'speaking');
    assert(!get(`SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND is_core = 1 AND status = 'active'`, gvS.userId, be), 'dữ liệu demo: GV S không là GVCN MB BE 04');
    const ctx = { classId: be, studentId: get(`SELECT student_id s FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`, be).s, topic: 'speaking' };
    assert(boTro.quyenBoTro(gvS, { performer_user_id: null, case_id: 0, nhom_bo_tro: 'gk:1:speaking', ctx }), 'BE: GVBM S ghi được nhóm một môn');
    assert(!boTro.quyenBoTro(gvS, { performer_user_id: null, case_id: 0, nhom_bo_tro: 'gk:1', ctx }), 'nhóm chung: cùng GV đó KHÔNG ghi được');
  });

  // ------------------------------------------------------------------ 4 · Người dạy bổ trợ phải là GV cùng chi nhánh của lớp
  /* PR-CT2: Nộp kế hoạch đã gỡ — luật cùng chi nhánh chuyển sang Sửa PA / Điều chỉnh (`nguoiSauSua`). */
  check('S5F-b (4) · Sửa PA Bổ trợ: người dạy là GV chi nhánh khác → 400, không ghi gì; GV cùng chi nhánh → được; ô chọn người lọc theo chi nhánh', () => {
    const { hv, cGv, ha } = emFou('S5F-b FOU CN');
    const mb = get(`SELECT branch_id b FROM classes WHERE code = 'MB FOU 12'`).b;
    const khac = get(
      `SELECT u.id, u.full_name FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
        WHERE u.status = 'active' AND ur.branch_id != ?
          AND NOT EXISTS (SELECT 1 FROM user_roles x WHERE x.user_id = u.id AND x.status = 'active' AND x.branch_id = ?) LIMIT 1`, mb, mb);
    assert(khac, 'dữ liệu demo: cần một GV chỉ thuộc chi nhánh khác MB');
    const pa = paBt(cGv.id);
    const soBan = () => get('SELECT COUNT(*) n FROM case_intervention_revisions WHERE intervention_id = ?', pa.id).n;
    const truoc = soBan();
    assert(maLoi(() => cases.suaPa(ha, pa.id, { performerUserId: khac.id })) === 400, 'GV chi nhánh khác làm người dạy phải 400');
    assert(paBt(cGv.id).performer_user_id === pa.performer_user_id && soBan() === truoc, 'bị từ chối thì không đổi người, không ghi nhật ký');
    const cungCn = gvOf('MB FOU 12', 'speaking');
    cases.suaPa(ha, pa.id, { performerUserId: cungCn.userId });
    assert(paBt(cGv.id).performer_user_id === cungCn.userId, 'GV cùng chi nhánh làm người dạy được');
    const q = khac.full_name as string;
    /* PR-Dọn Q2: /ref/nguoi LUÔN theo phạm vi người xem — GVCN MB không còn thấy GV chỉ thuộc chi nhánh khác, kể cả khi không gửi `cungChiNhanh`. */
    assert(!timNguoi(ha, { q, nhom: 'giao_vien', studentId: hv }).some((r) => r.id === khac.id), 'không lọc cungChiNhanh: vẫn không thấy GV chi nhánh khác (Q2)');
    assert(!timNguoi(ha, { q, nhom: 'giao_vien', studentId: hv, cungChiNhanh: true }).some((r) => r.id === khac.id), 'cungChiNhanh: không gợi ý GV chi nhánh khác');
  });

  // ------------------------------------------------------------------ 5 · Phối hợp lớp thường không còn dấu SOS
  check('S5F-b (5) · Phối hợp Progress Test: GVBM đánh dấu Báo PH → 403 với câu KHÔNG nói "SOS"; thẻ Progress Test không có "+ Thêm việc"; màn rỗng không nói SOS', () => {
    const { hv, khoa } = emFou('S5F-b FOU PH');
    const act = get(`SELECT id FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv'`, hv);
    assert(act, 'Progress Test trượt phải có việc Báo phụ huynh qua TVV');
    let loi: any = null;
    try { phoiHop.confirmCoordination(khoa, act.id, { performedOn: TODAY }); } catch (e) { loi = e; }
    assert(loi?.status === 403 && !/SOS/.test(loi.message), `403 không nói SOS: ${loi?.status} ${loi?.message}`);
    const web = doc('yThuc/PhoiHopSosSection.tsx');
    assert(/luot\.canAct && !adding && !luot\.nhanDot/.test(web), 'ẩn "+ Thêm việc" ở lượt có nhanDot (lớp thường)');
    assert(!/Empty title="[^"]*SOS/.test(web), 'màn rỗng không nói SOS');
  });

  // ------------------------------------------------------------------ 6 · Ô tóm tắt hồ sơ HV
  check('S5F-b (6) · Hồ sơ HV (PR-CT2): xác nhận đủ hai môn → không còn việc "chờ Quản lý duyệt kế hoạch"; ô Học thuật tách "chờ xác nhận Case" khỏi "đang làm"', () => {
    const { hv } = emFou('S5F-b FOU HAN');
    const cP = caseTheoMon(hv, 'speaking');
    sosAuto.xacNhanCase(gvOf('MB FOU 12', 'speaking'), cP.id, XN('speaking'));
    const viec = profile.studentProfile(P.mbManager, hv).dauHoSo.viec;
    assert(![...viec.cuaBan, ...viec.nguoiKhac].some((x: any) => /kế hoạch/.test(x.chu)), `còn việc kế hoạch: ${JSON.stringify(viec)}`);
    /* PR-VAI-b (K3-03): ô "Case" cũ thay bằng ô Học thuật — mỗi Case một dòng, Case chờ nguyên nhân tách khỏi Case đang làm. */
    const o = d.oHocThuat([{ short: 'P', label: 'P', category: 'speaking', missed: true, cases: [
      { status: 'open', trangThaiV4: { t: 'can-lam' }, viecTiep: { chu: 'Xác nhận Case' } },
      { status: 'open', trangThaiV4: { t: 'dang-lam' }, viecTiep: { chu: 'Kết quả PA Bổ trợ' } },
    ] }]);
    assert(o.dong.map((x: any) => `${x.nhan}|${x.viec}`).join() === 'Cần làm|xác nhận Case,Đang làm|kết quả', `ô Học thuật tách chờ xác nhận Case / đang làm: ${JSON.stringify(o.dong)}`);
  });

  // ------------------------------------------------------------------ 7 · Dòng PA Bổ trợ có mã tuần
  check('S5F-b (7) · PA Bổ trợ CHƯA chạy (chờ Xác nhận Case) vẫn có mã tuần "đến Cuối khoá · W.. OCT"; hàng PA ghi "từ W.." và giữ "trừ buổi Free"', () => {
    const moc = d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: '2026-10-18', mtKe: null, daXacNhan: false }, '2026-09-14');
    assert(moc === d.mocChuBoTro('2026-10-18', '2026-09-14') && /^đến Cuối khoá · W\d [A-Z]{3}$/.test(moc), moc);
    assert(d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: null, mtKe: null, daXacNhan: false }, '2026-09-14') === 'đến Cuối khoá', 'không có mốc thì không bịa tuần');
    const web = doc('cases/SkillBoard.tsx');
    /* PR-VAI-b (Q19): khoảng PA qua `chuKhoangPa` (mã tuần cho MỌI PA, không riêng Bổ trợ). */
    assert(/buổi\/tuần · \{x\} · trừ buổi Free', \{ buoiMoiTuan: c\.boTro!\.buoiMoiTuan, x: p\.mocChu \? dich\(p\.mocChu\) : t\('đến Cuối khoá'\) \}/.test(web) && /chuKhoangPa\(\{ startedOn: p\.startedOn/.test(web)
      && d.chuKhoangPa({ startedOn: '2026-09-16', completedOn: null, mocChu: null }, '2026-09-14') === 'từ W3 SEP', 'tên PA Bổ trợ có mốc + trừ buổi Free; từ W..');
  });

  // ------------------------------------------------------------------ 8 · Case rút do sửa điểm
  check('S5F-b (8) · Sửa điểm Progress Test thành đạt → Case chờ nguyên nhân bị rút: bảng kỹ năng ghi "Đã rút (sửa điểm)" (không "Xong"), không việc tiếp', () => {
    const { hv, pt } = emFou('S5F-b FOU RUT');
    const cP = caseTheoMon(hv, 'speaking');
    regular.saveRegularScore(P.admin, pt, 'speaking', { score: 17, total: 20, lyDo: 'Nhập nhầm — sửa lại đúng điểm bài' });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', cP.id).status === 'done', 'Case P phải bị rút');
    const the = (cases.skillSupportBoard(P.mbManager, hv).rows as any[]).flatMap((r) => r.cases).find((c: any) => c.id === cP.id);
    assert(the?.trangThaiV4?.k === 'rut-sua-diem' && the.trangThaiV4.chu === 'Đã rút (sửa điểm)' && the.viecTiep === null, JSON.stringify(the?.trangThaiV4));
    assert(cases.caseDetail(P.mbManager, cP.id).trangThaiV4.chu === 'Đã rút (sửa điểm)', 'Ngăn Case cùng chữ');
  });

  // ------------------------------------------------------------------ 9 · Hồ sơ GV
  check('S5F-b (9) · Hồ sơ GV: QL mở hồ sơ người không có vai giáo viên → 404; Việc tiếp "Ghi kết quả PA … · kỳ W..–W.." + hạn, không "mở dd/mm"; GV demo có user_skills', () => {
    const qlKhac = get(`SELECT ur.user_id u FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' AND ur.status = 'active' AND ur.user_id != ?
      AND NOT EXISTS (SELECT 1 FROM user_roles x JOIN roles y ON y.id = x.role_id WHERE x.user_id = ur.user_id AND y.key = 'teacher' AND x.status = 'active') LIMIT 1`, P.mbManager.userId).u;
    assert(maLoi(() => phamViHoSoGv(P.admin, qlKhac)) === 404, 'QT mở hồ sơ GV của một Quản lý thuần → 404');
    assert(maLoi(() => phamViHoSoGv(P.mbManager, P.normalCoreTeacher.userId)) === 200, 'QL MB mở hồ sơ GVCN MB được');
    const v = d.viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: 1, topic: 'reading', viecTiep: { chu: 'Kết quả PA Tutor', loaiHan: 'cap-nhat-pa', han: '2026-09-28' } }], yThuc: null, homNay: '2026-09-24', chuongTrinh: null })[0];
    assert(/^Kết quả PA R · kỳ W3–W4 SEP$/.test(v.viec) && !!v.han, JSON.stringify(v));   // OV-12a: kỳ hai tuần
    const ds = chiTietCaseMo((cases.listCases(P.mbManager, { ownerUserId: P.normalCoreTeacher.userId }).rows as any[]).filter((c) => c.state !== 'done'));
    assert([...ds.values()].every((c: any) => !/mở \d/.test(c.moTu)), 'không còn "mở dd/mm"');
    assert(get('SELECT COUNT(*) n FROM user_skills WHERE user_id = ?', P.normalCoreTeacher.userId).n > 0, 'GV demo có "Phụ trách được"');
  });
}
