/**
 * PHÉP KIỂM RA-2511 PR 1 `sua-quyen` (rà toàn web 25/11 — quyền máy chủ lỏng hơn giao diện + Case / PA / Tutor; chủ SP Q1, Q3, Q4, Q5). Mỗi phép chạy
 * hàm / đường THẬT; mọi ghi trong BEGIN … ROLLBACK (`thu`). Đường HTTP chỉ đọc hoặc 403 / 404 (không ghi).
 *  SQ-1 lưới Kết quả PA: BPXL không đọc PA · SQ-2 PATCH /tasks/:id đã gỡ · SQ-4 Tutor: Head sửa nhận xét được nhưng không viết mới / xoá tutor
 *  SQ-5 Hoàn tác khai / sửa cấp bậc một em · SQ-6 BPXL không Vắng / Huỷ điểm · SQ-7 Q1 /metrics TVV 403 · SQ-8 Q3 CX không đổi chương trình lớp
 *  SQ-9 Q4 Admin nhập KQ thi thật · SQ-11 đổi / đặt lại mật khẩu huỷ phiên khác · SQ-12 thu hồi ≥ 8 · SQ-13 PA nhập bù 8–200
 *  SQ-15 em Kết thúc học: sửa điểm MT cũ không sinh Case · SQ-16 PA bổ trợ giữ số buổi đã chụp · SQ-18 Thùng rác Quản trị đếm một câu.
 *  (SQ-3 ở luatMayChu S16 + prTk TK-3; SQ-10 Q5 ở prBpxl BX-3b.)
 */
export async function runPrSuaQuyenTests(t: any) {
  const { check, checkAsync, assert, conn, P, classId } = t;
  console.log('\nRA-2511 PR 1 · sua-quyen: quyền máy chủ + Case / PA / Tutor');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { xoaNho, soCauSql, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const luoi: any = await import('../cases/luoiKetQua.ts');
  const tutor: any = await import('../tutors/trang.ts');
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const lo: any = await import('../yThuc/lo.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const thongTin: any = await import('../classes/thongTinLop.ts');
  const classes: any = await import('../classes/classes.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const auth: any = await import('../auth.ts');
  const cases: any = await import('../cases/cases.ts');
  const boTro: any = await import('../cases/boTro.ts');
  const rac: any = await import('../platform/khoiPhucRac.ts');
  const { createApp } = await import('../app.ts');
  const prof: any = await import('../students/profile.ts');
  const ht: any = await import('../students/hanhTrinh.ts');
  const pt: any = await import('../classes/phanTichLop.ts');
  const ms: any = await import('../worklist/metrics.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const rg: any = await import('../normal/regular.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const toi = path.dirname(fileURLToPath(import.meta.url));
  const REPO = ['../../..', '../../../..'].map((x) => path.resolve(toi, x)).find((x) => fs.existsSync(path.join(x, 'package.json')))!;
  const nguon = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');

  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  /** Người có vai ở chi nhánh `cn` (grant toàn hệ thống cũng phủ — CX demo không chi nhánh). */
  const nguoi = (vai: string, cn: string) => one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND (b.code = ? OR ur.branch_id IS NULL) AND ur.status = 'active' ORDER BY ur.branch_id IS NULL, ur.user_id LIMIT 1`, vai, cn)?.id as number;
  const MB_FT = classId('MB FT 101');
  let seq = 0;
  const taoBpxl = () => accounts.createAccount(P.admin, { email: `ra2511.bpxl${++seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ra2511', fullName: `Thử BPXL RA ${seq}`,
    roles: [{ role: 'scheduler', branches: ['MB'] }] }).userId as number;
  /* Em MB FT 101 đang học, có lộ trình FT đang chạy. */
  const emFt = (dieuKien = '1 = 1') => one(`SELECT s.id, c.id AS cy FROM enrollments e JOIN students s ON s.id = e.student_id AND s.status = 'active'
      JOIN learning_cycles c ON c.student_id = s.id AND c.status = 'active' AND c.route IS NOT NULL
     WHERE e.class_id = ? AND e.status = 'active' AND ${dieuKien} ORDER BY s.id LIMIT 1`, MB_FT);

  check('SQ-1 · lưới Kết quả PA (N57 / N63 ⑤): BPXL MB đọc 0 PA; Head MB đọc được cùng PA', () => thu(() => {
    const pa = one(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
       WHERE e.class_id = ? AND iv.status IN ('planned', 'started') ORDER BY iv.id LIMIT 1`, MB_FT)?.id;
    assert(pa, 'seed thiếu PA đang chạy ở MB FT 101');
    assert(luoi.luoiKetQua(P.mbManager, [pa]).ds.length === 1, 'Head MB phải đọc được PA');
    const bp = loadPrincipal(taoBpxl());
    assert(luoi.luoiKetQua(bp, [pa]).ds.length === 0, 'BPXL đọc được PA qua lưới Kết quả PA');
  }));

  check('SQ-1b · PTA rà #2176 (N57 / N63 ⑤): BPXL không đọc Case / PA ở bảng kỹ năng, "+ Case", hồ sơ HV, Hành trình, lượt lớp thường, bảng vấn đề lớp, chỉ số PA, Phối hợp SOS (Head đối chứng)', () => thu(() => {
    const c = one(`SELECT sc.id, sc.student_id AS sid, sc.title, sc.summary, e.class_id AS lop FROM sos_cases sc JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
        JOIN classes cl ON cl.id = e.class_id JOIN branches b ON b.id = cl.branch_id
       WHERE b.code = 'MB' AND sc.status != 'done' AND length(sc.title) >= 8 AND EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id) ORDER BY sc.id LIMIT 1`);
    assert(c && prof, 'seed thiếu Case MB có PA');
    const bp = loadPrincipal(taoBpxl());
    const co = (x: unknown) => JSON.stringify(x).includes(c.title);
    /* Bảng kỹ năng + hồ sơ: BPXL vẫn mở (điểm), không có Case. */
    assert(co(cases.skillSupportBoard(P.mbManager, c.sid, null)) && !co(cases.skillSupportBoard(bp, c.sid, null)), 'bảng kỹ năng: BPXL thấy Case');
    const hs = prof.studentProfile(bp, c.sid);
    assert(co(prof.studentProfile(P.mbManager, c.sid)) && hs.cases.length === 0 && !co(hs), 'hồ sơ HV: BPXL thấy Case / PA');
    assert(ma(() => cases.caseTopicsOf(bp, c.sid)) === 403, '+ Case (case-topics): BPXL phải 403');
    assert(co(ht.hanhTrinhHocVien(P.mbManager, c.sid, null)) && !co(ht.hanhTrinhHocVien(bp, c.sid, null)), 'Hành trình: BPXL thấy Case');
    assert(ma(() => pt.oPhanTichLop(bp, c.lop, 'listening', 'case', null)) === 403, 'bảng vấn đề lớp (ô Case): BPXL phải 403');
    assert(ms.metricSet(P.mbManager, 'pa-co-ket-qua').ids.length > 0 && ms.metricSet(bp, 'pa-co-ket-qua').ids.length === 0, 'chỉ số PA có kết quả: BPXL có PA');
    /* N63 ⑤: BPXL vẫn xem Phối hợp của em — nhưng không có nội dung Case (nguyên nhân = Mô tả Case). */
    const phBp = JSON.stringify(ph.coordinationOfStudent(bp, c.sid));
    assert(!phBp.includes(c.title) && !(c.summary && phBp.includes(c.summary)), 'Phối hợp SOS của em: BPXL thấy nội dung Case');
    const lt = one(`SELECT a.id FROM assessment_attempts a JOIN classes cl ON cl.id = a.class_id JOIN branches b ON b.id = cl.branch_id
       WHERE b.code = 'MB' AND a.kind IN ('progress', 'final') AND EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.student_id = a.student_id) ORDER BY a.id LIMIT 1`)?.id;
    if (lt) {
      const d = rg.regularAttemptDetail(bp, lt);
      assert(d.dong.cases.length === 0 && d.lichSuCase.length === 0, 'lượt lớp thường: BPXL thấy Case');
    }
  }));

  /* ---------------------------------------------------------------- HTTP (chỉ đọc / 403 / 404) */
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (method: string, url: string, cookie: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };
  try {
    const ckQl = await vao(P.mbManager.userId);
    const ckTvv = await vao(nguoi('consultant', 'MB'));
    await checkAsync('SQ-2 · PATCH /tasks/:id cũ đã gỡ (404) — không còn đường đổi trạng thái / người theo dõi không lịch sử (N59)', async () => {
      const tk = one('SELECT id FROM tasks ORDER BY id LIMIT 1')?.id ?? 1;
      const r = await goi('PATCH', `/tasks/${tk}`, ckQl, { progress: 'stopped' });
      assert(r.status === 404, `PATCH /tasks/${tk}: ${r.status}`);
    });
    await checkAsync('SQ-7 · Q1: TVV gọi /metrics/* → 403 (kể cả ?rows=1); Head vẫn 200; /my-work của TVV vẫn 200', async () => {
      const sai: string[] = [];
      for (const u of ['/metrics/case-mo', '/metrics/hv-sos-hien-tai?rows=1', '/metrics/bai-qua-han-nhap-diem?rows=1']) {
        const r = await goi('GET', u, ckTvv);
        if (r.status !== 403) sai.push(`TVV ${u}: ${r.status}`);
      }
      /* PTA rà #2176: BPXL — bàn giao em (Case / PA còn dở) 403. */
      const emMb = emFt()?.id;
      const bpId = nguoi('scheduler', 'MB');
      if (bpId && emMb) {
        const h = await goi('GET', `/students/${emMb}/handover`, await vao(bpId));
        if (h.status !== 403) sai.push(`BPXL /students/:id/handover: ${h.status}`);
      }
      const q = await goi('GET', '/metrics/case-mo', ckQl);
      if (q.status !== 200) sai.push(`Head /metrics/case-mo: ${q.status}`);
      const w = await goi('GET', '/my-work', ckTvv);
      if (w.status !== 200) sai.push(`TVV /my-work: ${w.status}`);
      assert(!sai.length, sai.join(' | '));
    });
  } finally { may.close(); }

  check('SQ-4 · Tutor: Head chi nhánh nơi dạy sửa được nhận xét (coSua dòng) dù không viết mới (coSua panel); "Xoá tutor" ẩn (coBuoi) + máy chủ 403', () => thu(() => {
    const id = one(`SELECT t.id FROM tutors t WHERE t.ten = 'Đặng Thu Hà'`)?.id;
    const head = loadPrincipal(nguoi('manager', 'HD'));
    assert(id && head, 'seed thiếu tutor Đặng Thu Hà / Head HD');
    const d = tutor.panelTutor(head, id, { tu: '2026-01-05', den: '2026-12-28' });
    assert(d.coSua === false && d.nhanXet.length > 0 && d.nhanXet.every((n: any) => n.coSua === true && n.coXoa === false),
      `Head: panel coSua ${d.coSua}, nhận xét ${JSON.stringify(d.nhanXet.map((n: any) => [n.coSua, n.coXoa]))}`);
    assert(d.coBuoi === true, 'Head: coBuoi phải true (web ẩn "Xoá tutor")');
    assert(ma(() => tutor.xoaTutor(head, id)) === 403, 'Head xoá tutor phải 403');
  }));

  check('SQ-4w · web Tutor (điểm 4 + 17): form nhận xét hiện khi đang sửa (Head); bấm Sửa khi còn chữ → hỏi, không đè; hộp tutor / gộp có daSua; Nội dung buổi không cắt lặng', () => {
    const pn = nguon('web/src/modules/tutor/PanelTutor.tsx');
    assert(pn.includes('const coForm = !!data?.coSua || !!dangSua;') && pn.includes('{coForm ? (') && !pn.includes('{data.coSua ? ('), 'form nhận xét chưa theo coForm (Head bấm Sửa không có form)');
    assert(pn.includes('onClick={() => moSua(n)}') && pn.includes('chuaLuu ? setHoiSua(n) : apSua(n)') && pn.includes('<HopBoChu '), 'Sửa nhận xét đè chữ đang gõ không hỏi');
    const hp = nguon('web/src/modules/tutor/HopTutor.tsx');
    assert((hp.match(/<Modal open onClose=\{onDong\}[^>]*daSua=\{/g) ?? []).length === 2, 'hộp Thêm / Sửa tutor hoặc Gộp tên chưa có daSua');
    assert(!nguon('web/src/modules/cases/BuoiTutorO.tsx').includes('maxLength={Math.max(TRAN_NOI_DUNG_TUTOR')
      && nguon('web/src/modules/cases/CapNhatTuan.tsx').includes('toiDa: TRAN_NOI_DUNG_TUTOR'), 'Nội dung buổi tutor còn cắt lặng / không báo trần tại ô');
  });

  check(`SQ-5 · N66: Hoàn tác khai / sửa cấp bậc MỘT em — khai mới → về chưa khai; Head sửa → về bậc trước (nhật ký máy chủ); GVCN gửi duyệt → rút thẻ; bậc lệch → 400; trần ${TRAN_GHI_LO.hoanTacCapBacEm} câu`, () => thu(() => {
    const em = emFt('NOT EXISTS (SELECT 1 FROM y_thuc_khai_bac k WHERE k.student_id = s.id)');
    assert(em, 'seed thiếu em MB FT 101 chưa khai bậc');
    const gvcn = P.coreTeacher;
    const bac = () => one('SELECT bac FROM y_thuc_khai_bac WHERE student_id = ?', em.id)?.bac ?? null;
    xuLy.khaiBac(gvcn, em.id, { bac: 1, ghiChu: 'Khai thử RA-2511 một em' });
    assert(bac() === 1, 'khai bậc 1');
    assert(ma(() => lo.hoanTacCapBacEm(gvcn, em.id, { bac: 2 })) === 400 && bac() === 1, 'bậc gửi lệch bậc vừa lưu → 400, không đổi');
    xoaNho(); const c0 = soCauSql();
    trongBoNho(() => lo.hoanTacCapBacEm(gvcn, em.id, { bac: 1 }));
    const n = soCauSql() - c0;
    assert(bac() === null, 'Hoàn tác khai mới → về chưa khai');
    assert(n <= TRAN_GHI_LO.hoanTacCapBacEm, `Hoàn tác một em ${n} câu > ${TRAN_GHI_LO.hoanTacCapBacEm}`);
    console.log(`    Hoàn tác một em: ${n} câu`);
    xuLy.khaiBac(gvcn, em.id, { bac: 1, ghiChu: 'Khai lại RA-2511' });
    xoaNho();
    xuLy.suaKhaiBac(P.mbManager, em.id, { bac: 2, ghiChu: 'Head sửa thử RA-2511', bacCu: 1 });
    assert(bac() === 2, 'Head sửa → bậc 2');
    assert(ma(() => lo.hoanTacCapBacEm(gvcn, em.id, { bac: 2 })) === 400 && bac() === 2, 'GVCN không hoàn tác lần sửa của Head (không phải lần của mình → 400)');
    assert(ma(() => lo.hoanTacCapBacEm(P.cpManager, em.id, { bac: 2 })) === 403, 'Head chi nhánh khác: giữ đúng 403 (không gộp thành 400)');
    xoaNho();
    lo.hoanTacCapBacEm(P.mbManager, em.id, { bac: 2 });
    assert(bac() === 1, 'Head Hoàn tác → về bậc 1 (bản máy chủ ghi)');
    xoaNho();
    const g = xuLy.suaKhaiBac(gvcn, em.id, { bac: 3, ghiChu: 'GVCN xin sửa thử RA-2511', bacCu: 1 });
    assert(g.guiDuyet && g.yeuCauId, 'GVCN sửa → gửi Head duyệt');
    xoaNho();
    lo.hoanTacCapBacEm(gvcn, em.id, { ycId: g.yeuCauId });
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', g.yeuCauId).trang_thai !== 'cho' && bac() === 1, 'Hoàn tác gửi duyệt → thẻ không còn chờ, bậc giữ 1');
  }));

  check('SQ-6 · BPXL (N57): menu kỹ năng không Vắng / Huỷ điểm / Khôi phục điểm (`diem: false`); hồ sơ Mock trả viewer.diem = false cho BPXL, true cho Head', () => thu(() => {
    const q = { nhapDiem: false, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false, diemHuy: true };
    for (const tt of ['dang-thi', 'co-diem', 'lich-su', 'chua-toi-tuan']) {
      const m = dm.thaoTacKyNang(tt, { ...q, diem: false }).menu as string[];
      assert(!m.some((x) => x === 'bao-vang' || x === 'huy-diem' || x === 'khoi-phuc-diem'), `${tt}: ${m.join()}`);
    }
    assert(dm.thaoTacKyNang('dang-thi', { ...q, diem: true }).menu.includes('bao-vang'), 'Head vẫn có Vắng');
    const luot = one(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY id LIMIT 1`, MB_FT).id;
    const bp = loadPrincipal(taoBpxl());
    assert(svc.attemptDetail(bp, luot).viewer.diem === false, 'BPXL: viewer.diem phải false');
    assert(svc.attemptDetail(P.mbManager, luot).viewer.diem === true, 'Head: viewer.diem phải true');
  }));

  check('SQ-8 · Q3 (N52): CX đổi chương trình / lịch MT lớp → 403 (cờ canDoiChuongTrinh false); CX sửa ghi chú được; Head đổi được', () => thu(() => {
    const cx = loadPrincipal(nguoi('cx', 'MB'));
    assert(cx, 'seed thiếu CX MB');
    const lopThuong = one(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND c.status = 'active' AND c.is_fast_track = 0 ORDER BY c.id LIMIT 1`).id;
    assert(ma(() => thongTin.capNhatThongTinLop(cx, lopThuong, { programmeCode: 'BE' })) === 403, 'CX đổi chương trình phải 403');
    assert(ma(() => thongTin.capNhatThongTinLop(cx, MB_FT, { loTrinh: 'RF' })) === 403, 'CX đổi lịch MT mặc định phải 403');
    assert(ma(() => thongTin.capNhatThongTinLop(cx, MB_FT, { note: 'CX ghi chú RA-2511' })) === null, 'CX sửa ghi chú phải được');
    assert(classes.classOverview(cx, MB_FT).viewer.canDoiChuongTrinh === false, 'cờ CX phải false');
    assert(classes.classOverview(P.mbManager, MB_FT).viewer.canDoiChuongTrinh === true, 'cờ Head phải true');
  }));

  check('SQ-9 · Q4: Admin chi nhánh em nhập được KQ thi thật; Admin chi nhánh khác 403; GVCN / TVV / CX như cũ', () => thu(() => {
    const em = emFt();
    const adMb = loadPrincipal(nguoi('office_admin', 'MB'));
    const adKhac = loadPrincipal(one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
        WHERE r.key = 'office_admin' AND b.code != 'MB' AND ur.user_id NOT IN (SELECT ur2.user_id FROM user_roles ur2 JOIN branches b2 ON b2.id = ur2.branch_id WHERE b2.code = 'MB')
        ORDER BY ur.user_id LIMIT 1`).id);
    const c = { id: em.cy, student_id: em.id };
    for (const [ten, p] of [['GVCN', P.coreTeacher], ['TVV', loadPrincipal(nguoi('consultant', 'MB'))], ['CX', loadPrincipal(nguoi('cx', 'MB'))], ['Admin MB', adMb]] as const) {
      assert(thiThat.coTheNhapThiThat(p, c), `${ten} phải nhập được`);
    }
    assert(!thiThat.coTheNhapThiThat(adKhac, c), 'Admin chi nhánh khác không nhập được');
    assert(ma(() => thiThat.datKetQuaThiThat(adKhac, em.cy, { khongThi: true })) === 403, 'Admin chi nhánh khác: 403');
    const r = thiThat.datKetQuaThiThat(adMb, em.cy, { khongThi: true });
    assert(r && one('SELECT thi_that_khong_thi AS k FROM learning_cycles WHERE id = ?', em.cy).k === 1, 'Admin MB lưu "Không thi"');
  }));

  check('SQ-11 · đổi mật khẩu (tự đổi) giữ phiên đang bấm, huỷ phiên khác; Quản trị đặt lại → mọi phiên của tài khoản hết', () => thu(() => {
    const u = P.lrTeacher.userId;
    const [a, b] = [auth.createSession(u), auth.createSession(u)];
    accounts.resetPassword(P.admin, u, 'MatKhau-RA2511', auth.createSession(P.admin.userId));
    assert(auth.resolveSession(a) === null && auth.resolveSession(b) === null, 'Quản trị đặt lại: phiên cũ vẫn dùng được');
    const [c, d] = [auth.createSession(u), auth.createSession(u)];
    accounts.updateProfile(loadPrincipal(u), { currentPassword: 'MatKhau-RA2511', newPassword: 'MatKhau-RA2511-moi' }, c);
    assert(auth.resolveSession(c) !== null, 'tự đổi: phiên đang bấm bị đăng xuất');
    assert(auth.resolveSession(d) === null, 'tự đổi: phiên khác vẫn dùng được');
  }));

  check('SQ-12 · N50 ⑥: thu hồi lần xử lý — lý do < 8 ký tự → 400 (trước mọi ghi)', () => thu(() => {
    const m = one(`SELECT m.id FROM discipline_measures m ORDER BY m.id LIMIT 1`)?.id;
    assert(m, 'seed thiếu lần xử lý');
    const e = loi(() => xuLy.thuHoiXuLy(P.admin, m, { lyDo: 'ngắn' }));
    assert(e?.status === 400 && /8 ký tự/.test(e.message), `${e?.status} ${e?.message}`);
  }));

  check('SQ-13 · N50 ⑥ / N35: Case nhập bù — Nội dung PA < 8 hoặc > 200 ký tự → 400', () => thu(() => {
    const em = emFt();
    const goc = { studentId: em.id, topic: 'listening', primaryCode: dm.issuesForTopic('listening')[0].code, summary: 'Nhập bù thử RA-2511 nội dung PA.',
      fromDate: '2026-09-07', toDate: '2026-09-21', outcome: 'improved', note: 'Kết luận nhập bù thử RA-2511.' };
    const pa = (description: string) => ({ description, performerSelf: true, fromDate: '2026-09-07', toDate: '2026-09-21', ketQua: 'improved' });
    for (const [ten, chu] of [['ngắn', 'Tự học'], ['dài', 'x'.repeat(201)]] as const) {
      const e = loi(() => cases.backfillCase(P.lrTeacher, { ...goc, actions: [pa(chu)], idempotencyKey: `ra2511-${ten}` }));
      assert(e?.status === 400, `${ten}: ${e?.status} ${e?.message}`);
    }
  }));

  check('SQ-15 · em Kết thúc học: sửa điểm MT cũ thành trượt KHÔNG sinh Case mới (đối chứng: em đang học thì có)', () => {
    const luot = one(`SELECT a.id, a.student_id AS sid FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active'
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.status = 'done' AND a.lich_su = 0
          AND NOT EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.student_id = a.student_id AND sc.status != 'done')
          AND NOT EXISTS (SELECT 1 FROM case_signals g WHERE g.attempt_id = a.id)
          AND (SELECT COUNT(*) FROM assessment_scores x WHERE x.attempt_id = a.id AND x.band IS NOT NULL) >= 5 ORDER BY a.id LIMIT 1`, MB_FT);
    assert(luot, 'seed thiếu lượt MT đã xong của em không có Case mở');
    const dem = () => one('SELECT COUNT(*) AS n FROM sos_cases WHERE student_id = ?', luot.sid).n as number;
    const truot = () => { for (const k of ['listening', 'reading']) svc.saveScore(P.admin, luot.id, k, { rawScore: 3, rawTotal: 40, lyDo: 'Sửa thử RA-2511' }); };
    const doi = thu(() => { const n0 = dem(); truot(); return dem() - n0; });
    assert(doi > 0, `đối chứng: em đang học sửa trượt phải có Case mới (có ${doi})`);
    const ket = thu(() => { conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(luot.sid); xoaNho(); const n0 = dem(); truot(); return dem() - n0; });
    assert(ket === 0, `em Kết thúc học: sinh ${ket} Case mới`);
  });

  check('SQ-16 · PA bổ trợ đã tạo giữ số buổi / tuần lúc tạo (mô tả), không theo cấu hình mới', () => thu(() => {
    const iv = one(`SELECT id, case_id FROM case_interventions WHERE kind = 'bo_tro' AND status != 'cancelled' AND nhom_bo_tro IS NOT NULL ORDER BY id LIMIT 1`);
    assert(iv, 'seed thiếu PA bổ trợ');
    for (const so of [3, 5]) {
      conn.prepare('UPDATE case_interventions SET description = ? WHERE id = ?').run(`Bổ trợ ${so} buổi/tuần`, iv.id);
      const b = boTro.boTroCuaCase([iv.case_id]).get(iv.case_id);
      assert(b?.buoiMoiTuan === so, `mô tả ${so} buổi/tuần → ${b?.buoiMoiTuan}`);
    }
  }));

  check('SQ-18 · Thùng rác: Quản trị đếm tab "Đã xoá" MỘT câu và đọc danh sách số câu cố định (gieo 40 mục); số tab = số dòng; người khác vẫn theo quyền từng mục', () => thu(() => {
    const luc = new Date().toISOString();
    const them = conn.prepare(`INSERT INTO thung_rac (loai, doi_tuong_id, nhan, hoc_vien_id, class_id, branch_id, du_lieu, xoa_boi, xoa_luc) VALUES ('hoc_vien', ?, ?, NULL, ?, NULL, ?, ?, ?)`);
    for (let i = 0; i < 40; i++) them.run(900000 + i, `Học viên rác ${i}`, MB_FT, JSON.stringify({ ban: [], goc: [{ bang: 'classes', id: MB_FT, dau: 'cu' }] }), P.admin.userId, luc);   // `kiemGoc` đọc DB — main xét từng mục
    xoaNho(); const c0 = soCauSql();
    const n = trongBoNho(() => rac.demRac(P.admin, 'hoc_vien')).n;
    const cau = soCauSql() - c0;
    assert(cau <= 1, `Quản trị đếm ${cau} câu`);
    xoaNho(); const c1 = soCauSql();
    const ds = trongBoNho(() => rac.danhSachRac(P.admin, 'hoc_vien'));
    const cauDs = soCauSql() - c1;
    assert(cauDs <= 2, `Quản trị đọc danh sách ${ds.length} mục ${cauDs} câu (xét quyền từng mục?)`);
    assert(n >= 40 && n === ds.length && ds.filter((m: any) => m.nhan.startsWith('Học viên rác')).every((m: any) => m.khoiPhucDuoc), `số tab ${n} ≠ số dòng ${ds.length} / mục rác không Khôi phục được`);
    assert(rac.demRac(P.mbManager, 'hoc_vien').n === rac.danhSachRac(P.mbManager, 'hoc_vien').length, 'Head: số tab ≠ số dòng');
  }));
}
