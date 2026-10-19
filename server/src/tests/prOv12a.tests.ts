/**
 * PHÉP KIỂM PR-OV12a — luật trước deploy (chủ SP 14/10):
 *   (1) hạn ghi kết quả PA hai tuần một lần, hết Thứ Ba, theo lịch kỳ từ ngày bắt đầu PA (`hanKyGhiKetQua`, `hanKe`) + chữ kỳ;
 *   (2) ghi kết quả PA qua API → `action_due` đúng; Công việc / Tổng quan "quá hạn" chỉ khi qua Thứ Ba; (3) migrate `prOv12a`;
 *   (4) QL xoá lớp trống; (5) QL xoá nhiều HV (Chọn nhiều › Xoá); (6) TVV chọn / bỏ Bước tiếp sau thi cả 3 hướng.
 * Mỗi ca cuộn lại (`thu`).
 */
export async function runPrOv12aTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const myWork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const { migratePrOv12a } = await import('../migrate/prOv12a.ts');
  const xoaKetThuc: any = await import('../classes/xoaKetThucLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const hangLoat: any = await import('../students/hangLoat.ts');
  const students: any = await import('../students/students.ts');
  const profile: any = await import('../students/profile.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const tongKet: any = await import('../loTrinh/tongKet.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { chenPa } = await import('../cases/taoPa.ts');
  console.log('\nPR-OV12a · hạn ghi kết quả PA hai tuần (hết Thứ Ba) · QL xoá lớp trống / nhiều HV · TVV Bước tiếp sau thi');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const ngayCu = getConfig('demo_date');
  const ngay = (iso: string) => { setConfig('demo_date', iso); xoaNho(); };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); setConfig('demo_date', ngayCu); xoaNho(); }
  };
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const LOP = classId('MB FT 101');
  const GV = P.lrTeacher;
  const QL = P.mbManager;
  let seq = 0;
  const taoNguoi = (role: string, branches: string[]) => {
    seq += 1;
    return loadPrincipal(accounts.createAccount(P.admin, { email: `ov12a.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov12a', fullName: `Thử OV12a ${seq}`, roles: [{ role, branches }] }).userId as number);
  };
  const TVV = taoNguoi('consultant', ['MB']);
  const TVV_CP = taoNguoi('consultant', ['CP']);
  const CX = taoNguoi('cx', []);
  const ADMIN = taoNguoi('office_admin', ['MB']);
  /** Em đang học MB FT 101 (+ lộ trình LT1). */
  const em = (lop = LOP, branch = MB): number => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV12A-${seq}`, `Hoc vien OV12a ${seq}`, `hoc vien ov12a ${seq}`, branch, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, lop, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  /** Case Listening báo tay + PA Tự học bắt đầu `batDau`. */
  const caseVaPa = (sid: number, batDau: string) => {
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `ov12a-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', status: 'started', startedDate: batDau });
    return { caseId, ivId: Math.max(...r.interventions.map((i: any) => i.id)) as number };
  };
  const ghi = (ivId: number, ngayGhi: string) => cases.updateResult(GV, ivId, { decision: 'keep', outcome: 'partial', note: 'Đúng 15/20 câu điền số kỳ này', observedOn: ngayGhi });
  const han = (ivId: number) => get('SELECT action_due FROM case_interventions WHERE id = ?', ivId).action_due as string;

  // ------------------------------------------------------------------ (1) hàm hạn + chữ kỳ
  check('OV12a-1 · hạn kỳ: PA bắt đầu T5 17/09 → 29/09, 13/10, 27/10; ghi sớm / muộn / bù / thêm / đúng hạn', () => {
    assert(d.hanKyGhiKetQua('2026-09-17') === '2026-09-29', `kỳ 1: ${d.hanKyGhiKetQua('2026-09-17')}`);
    assert(d.hanKe('2026-09-17', '2026-09-29', '2026-09-29') === '2026-10-13' && d.hanKe('2026-09-17', '2026-10-13', '2026-10-13') === '2026-10-27', 'kỳ 2, 3');
    const ca: [string, string, string][] = [
      ['2026-09-29', '2026-09-22', '2026-10-13'],   // ghi sớm 22/09 → xong kỳ 1
      ['2026-09-29', '2026-10-01', '2026-10-13'],   // ghi muộn 01/10 → xong kỳ 1, hạn kế không đổi theo ngày ghi
      ['2026-09-29', '2026-10-14', '2026-10-27'],   // quên 2 kỳ → một lần ghi bù xong cả hai
      ['2026-10-13', '2026-09-24', '2026-10-13'],   // ghi thêm khi kỳ 2 chưa bắt đầu → giữ hạn
      ['2026-09-29', '2026-09-29', '2026-10-13'],   // ghi đúng Thứ Ba hạn
    ];
    for (const [hanCu, ngayGhi, mong] of ca) assert(d.hanKe('2026-09-17', hanCu, ngayGhi) === mong, `hạn ${hanCu} ghi ${ngayGhi} → ${d.hanKe('2026-09-17', hanCu, ngayGhi)} (cần ${mong})`);
  });
  check('OV12a-1b · chữ: "Kết quả W3–W4 SEP", ghi bù "(ghi bù 2 kỳ)", Cần xử lý "kỳ W3–W4 SEP", hạn "hạn 29/09"', () => {
    assert(d.nhanTuanGhiKetQua('2026-09-29', '2026-09-22').tieuDe === 'Kết quả PA · W3–W4 SEP', d.nhanTuanGhiKetQua('2026-09-29', '2026-09-22').tieuDe);
    const bu = d.nhanTuanGhiKetQua('2026-09-29', '2026-10-14');
    assert(bu.soKy === 2 && bu.tieuDe === 'Kết quả PA · W3 SEP – W2 OCT (ghi bù 2 kỳ)', JSON.stringify(bu));
    assert(d.nhanTuanGhiKetQua('2026-10-13', '2026-09-24').tieuDe === 'Kết quả PA · W3–W4 SEP', 'ghi thêm nói kỳ vừa xong');
    assert(d.tuanCuaHanGhiKetQua('2026-09-29', '2026-09-30') === 'kỳ W3–W4 SEP', d.tuanCuaHanGhiKetQua('2026-09-29', '2026-09-30'));
    const v = d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-29', today: '2026-09-22' });
    assert(v.viec === 'Kết quả PA · W3–W4 SEP' && v.han === 'hạn 29/09', JSON.stringify(v));
  });

  // ------------------------------------------------------------------ (2) qua API
  check('OV12a-2 · ghi kết quả qua API: bắt đầu 17/09 → hạn 29/09; ghi 22/09 → 13/10; ghi thêm 24/09 giữ; ghi bù 14/10 → 27/10; ngày bắt đầu giữ 17/09', () => thu(() => {
    ngay('2026-09-17');
    const { ivId } = caseVaPa(em(), '2026-09-17');
    assert(han(ivId) === '2026-09-29', `bắt đầu: ${han(ivId)}`);
    ngay('2026-09-22'); ghi(ivId, '2026-09-22');
    assert(han(ivId) === '2026-10-13', `ghi 22/09: ${han(ivId)}`);
    ngay('2026-09-24'); ghi(ivId, '2026-09-24');
    assert(han(ivId) === '2026-10-13', `ghi thêm 24/09: ${han(ivId)}`);
    ngay('2026-10-14'); ghi(ivId, '2026-10-14');
    assert(han(ivId) === '2026-10-27', `ghi bù 14/10: ${han(ivId)}`);
    assert(get('SELECT started_date FROM case_interventions WHERE id = ?', ivId).started_date === '2026-09-17', 'ngày bắt đầu PA bị đổi');
  }));
  check('OV12a-2b · Công việc / Tổng quan: đúng Thứ Ba hạn chưa quá hạn; qua Thứ Ba mới quá hạn', () => thu(() => {
    ngay('2026-09-17');
    const { ivId } = caseVaPa(em(), '2026-09-17');
    const viec = () => ((myWork.myWork(GV, {}) as any).groups as any[]).flatMap((g) => g.items ?? []).flatMap((x: any) => (x.con?.length ? x.con : [x]))
      .find((x: any) => x.key === `action:${ivId}`);
    ngay('2026-09-26');
    assert(!viec(), 'chưa tới Chủ nhật cuối kỳ đã hiện việc');
    ngay('2026-09-29');
    assert(viec() && viec().urgency !== 'overdue', `Thứ Ba hạn: ${JSON.stringify(viec())}`);
    assert(!metrics.metricSet(QL, 'pa-can-cap-nhat', {}).ids.includes(ivId), 'Tổng quan báo quá hạn ngay Thứ Ba hạn');
    ngay('2026-09-30');
    assert(viec()?.urgency === 'overdue', `Thứ Tư: ${JSON.stringify(viec())}`);
    assert(metrics.metricSet(QL, 'pa-can-cap-nhat', {}).ids.includes(ivId), 'Tổng quan thiếu PA quá hạn');
  }));

  // ------------------------------------------------------------------ (3) migrate
  check('OV12a-3 · migrate prOv12a: hạn cũ T2 21/09 (bắt đầu 17/09) → 29/09; hạn T2 05/10 → 13/10; chạy lần hai không đổi gì', () => thu(() => {
    ngay('2026-09-17');
    const a = caseVaPa(em(), '2026-09-17').ivId;
    const b = caseVaPa(em(), '2026-09-17').ivId;
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run('2026-09-21', a);
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run('2026-10-05', b);
    const lan1: string[] = [];
    migratePrOv12a(conn, lan1);
    assert(han(a) === '2026-09-29' && han(b) === '2026-10-13', `${han(a)} ${han(b)}`);
    assert(lan1.length === 1 && /PA đang chạy đổi hạn/.test(lan1[0]), JSON.stringify(lan1));
    const truoc = JSON.stringify(all('SELECT id, action_due FROM case_interventions ORDER BY id'));
    const lan2: string[] = [];
    migratePrOv12a(conn, lan2);
    assert(lan2.length === 0 && JSON.stringify(all('SELECT id, action_due FROM case_interventions ORDER BY id')) === truoc, 'chạy lại vẫn đổi');
  }));

  // ------------------------------------------------------------------ (4) QL xoá lớp trống
  check('OV12a-4 · QL xoá lớp trống 200; lớp có dữ liệu 400; GV / TVV / CX / QL chi nhánh khác 403', () => thu(() => {
    const ma = 'MB-OV12A-TRONG';
    const lop = intake.createClass(P.admin, { code: ma, branchId: MB, kind: 'FOU', isFastTrack: false, startDate: '2026-08-03' }).id as number;
    assert(xoaKetThuc.xemXoaKetThuc(QL, lop).coTheXoa === true, 'QL phải thấy Xoá lớp trống');
    for (const [ten, p] of [['GV', P.coreTeacher], ['TVV', TVV], ['CX', CX], ['QL CP', P.cpManager]] as const) {
      assert(maLoi(() => xoaKetThuc.xoaLop(p, lop, { maLop: ma })) === 403, `${ten} xoá phải 403`);
    }
    assert(maLoi(() => xoaKetThuc.xoaLop(QL, LOP, { maLop: 'MB FT 101' })) === 400, 'lớp có dữ liệu phải 400');
    assert(xoaKetThuc.xoaLop(QL, lop, { maLop: ma }).ok === true && !get('SELECT 1 x FROM classes WHERE id = ?', lop), 'QL xoá lớp trống');
  }));

  // ------------------------------------------------------------------ (5) QL xoá nhiều HV
  check('OV12a-5 · Chọn nhiều › Xoá: xem trước liệt kê em + dữ liệu sẽ mất; gõ XOÁ; em chi nhánh khác bỏ có lý do; GV / TVV 403; hồ sơ QL có nút Xoá', () => thu(() => {
    ngay('2026-09-17');
    const a = em(); const b = em();
    caseVaPa(a, '2026-09-17');
    const cp = get(`SELECT s.id FROM students s JOIN branches br ON br.id = s.branch_id WHERE br.code = 'CP' ORDER BY s.id LIMIT 1`).id as number;
    const xem = hangLoat.xemTruoc(QL, { viec: 'xoa', studentIds: [a, b, cp] });
    assert(xem.rows.filter((r: any) => !r.lyDoBo).map((r: any) => r.studentId).join() === `${a},${b}`, JSON.stringify(xem.rows));
    assert(xem.rows.find((r: any) => r.studentId === cp).lyDoBo === 'Ngoài phạm vi của bạn.', 'em chi nhánh khác');
    const mat = Object.fromEntries((xem.tong.mat ?? []).map((m: any) => [m.nhan, m.so]));
    assert(mat['Case học thuật'] === 1 && mat['PA học thuật'] === 1 && mat['Lớp từng học'] === 2, JSON.stringify(xem.tong.mat));
    assert(maLoi(() => hangLoat.chay(QL, { viec: 'xoa', studentIds: [a] })) === 400, 'thiếu XOÁ phải 400');
    for (const [ten, p] of [['GV', P.coreTeacher], ['TVV', TVV], ['CX', CX]] as const) {
      assert(maLoi(() => hangLoat.chay(p, { viec: 'xoa', studentIds: [a], xacNhan: 'XOÁ' })) === 403, `${ten} phải 403`);
    }
    const kq = hangLoat.chay(QL, { viec: 'xoa', studentIds: [a, cp], xacNhan: 'Xóa' });
    assert(kq.ok.join() === String(a) && kq.failed.length === 1 && kq.failed[0].studentId === cp && kq.failed[0].message === 'Ngoài phạm vi của bạn.', JSON.stringify(kq));
    assert(!get('SELECT 1 x FROM students WHERE id = ?', a) && get('SELECT 1 x FROM students WHERE id = ?', cp), 'xoá sai em');
    assert(maLoi(() => hangLoat.chay(QL, { viec: 'xoa', studentIds: [a], xacNhan: 'XOÁ' })) === 404, 'xoá lại em đã xoá → 404');
    assert(profile.studentProfile(QL, b).viewer.coTheXoa === true && profile.studentProfile(P.cpManager, cp).viewer.coTheXoa === true
      && profile.studentProfile(P.coreTeacher, b).viewer.coTheXoa === false, 'cờ Xoá hồ sơ: QL / QL của em; GV không');
  }));

  // ------------------------------------------------------------------ (6) TVV Bước tiếp sau thi
  let soLop = 0;
  const taoLopFt = (route: 'LT1' | 'LT2' = 'LT1'): number => {
    soLop += 1;
    return intake.createClass(P.admin, { code: `MB-OV12A-FT-${soLop}`, branchId: MB, kind: 'FT', isFastTrack: true, route, startDate: t.TODAY }).id as number;
  };
  /** Em FT đã Kết thúc học, có kết quả thi thật (chờ chọn bước tiếp). */
  const emCoKetQua = (lop: number) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV12A-BT-${seq}`, `Hoc vien OV12a BT ${seq}`, `hoc vien ov12a bt ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, t.TODAY, now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, 'LT1', 'FT', 6.5, ?, 'active', ?)`)
      .run(sid, t.TODAY, now).lastInsertRowid);
    students.setStudentStatus(P.admin, sid, 'finished', t.TODAY, 'Hết khoá');
    thiThat.datKetQuaThiThat(TVV, cy, { ngayThi: t.TODAY, l: 7, r: 6.5, w: 6, s: 6.5 });   // OV-8b: TVV nhập kết quả thi thật
    return { sid, cy };
  };
  const hs = (sid: number) => get('SELECT status, archived_at FROM students WHERE id = ?', sid);
  check('OV12a-6 · TVV chọn / bỏ Bước tiếp cả 3 hướng (200); hồ sơ có việc "Chọn bước tiếp sau thi"; TVV chi nhánh khác / CX / GV / Admin 403', () => thu(() => {
    const lop = taoLopFt(); const lt2 = taoLopFt('LT2');
    const a = emCoKetQua(lop);
    assert(tongKet.tongKetLoTrinh(TVV, a.cy).buocTiep.coTheChon === true && tongKet.tongKetLoTrinh(CX, a.cy).buocTiep.coTheChon === false, 'cờ coTheChon');
    const viec = profile.studentProfile(TVV, a.sid).dauHoSo.viec.cuaBan;
    assert(viec.some((v: any) => v.loai === 'buoc-tiep' && v.key === `buoc_tiep:${a.cy}` && v.mo?.href?.includes(`buoc-tiep=${a.cy}`)), JSON.stringify(viec));   // OV-13m: panel Bước tiếp
    for (const [ten, p] of [['TVV CP', TVV_CP], ['CX', CX], ['GV', P.coreTeacher], ['Admin', ADMIN]] as const) {
      assert(maLoi(() => buocTiep.chonBuocTiep(p, a.cy, { chon: 'ket_thuc' })) === 403, `${ten} chọn phải 403`);
    }
    buocTiep.chonBuocTiep(TVV, a.cy, { chon: 'ket_thuc' });
    assert(hs(a.sid).archived_at && get('SELECT buoc_tiep FROM learning_cycles WHERE id = ?', a.cy).buoc_tiep === 'ket_thuc', 'Kết thúc');
    assert(maLoi(() => buocTiep.boChonBuocTiep(CX, a.cy)) === 403 && maLoi(() => buocTiep.boChonBuocTiep(TVV_CP, a.cy)) === 403, 'bỏ chọn ngoài quyền');
    buocTiep.boChonBuocTiep(TVV, a.cy);
    assert(!hs(a.sid).archived_at && get('SELECT buoc_tiep FROM learning_cycles WHERE id = ?', a.cy).buoc_tiep === null, 'bỏ Kết thúc');
    buocTiep.chonBuocTiep(TVV, a.cy, { chon: 'hoc_lai' });
    assert(hs(a.sid).status === 'active' && all(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, a.sid).map((r) => r.class_id).join() === String(lop), 'Học lại về lớp cũ');
    buocTiep.boChonBuocTiep(TVV, a.cy);
    assert(hs(a.sid).status === 'finished', 'bỏ Học lại');
    assert(students.lopChoHocLai(TVV, a.sid).lop.some((l: any) => l.id === lt2), 'TVV đọc được lớp cho Học tiếp');
    buocTiep.chonBuocTiep(TVV, a.cy, { chon: 'hoc_tiep', lopMoiId: lt2 });
    assert(all(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, a.sid).map((r) => r.class_id).join() === String(lt2), 'Học tiếp LT2');
    buocTiep.boChonBuocTiep(TVV, a.cy);
    assert(hs(a.sid).status === 'finished', 'bỏ Học tiếp');
  }));
  check('OV12a-7 · bổ trợ miễn phí: ghi trước ngày Mini Test = Kết quả thường (không đòi Mini Test), hạn giữ 29/09; từ ngày Mini Test = Kết quả cuối + Mini Test', () => thu(() => {
    ngay('2026-09-14');
    const sid = em();
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ?', sid).id;
    const now = new Date().toISOString();
    const cid = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, topic, category, origin_kind, status, title, detected_at, created_at)
      VALUES (?,?,?,?, 'chuyen_cap', 'in_progress', ?, ?, ?)`).run(sid, cy, 'listening', 'listening', 'Final Test · listening', '2026-09-14', now).lastInsertRowid);
    const nhom = `ov12a:mt:${sid}`;
    const [iv] = chenPa(conn, [{ caseId: cid, kind: 'bo_tro_mien_phi', description: 'Bổ trợ miễn phí 2 tuần', status: 'started', preset: true,
      confirmedAt: now, confirmedBy: GV.userId, performerUserId: GV.userId, nhomBoTro: nhom, mocQuyChe: 'mini_test',
      followupDue: '2026-09-27', actionDue: d.hanKyGhiKetQua('2026-09-14'), cycleStartedOn: '2026-09-14', startedDate: '2026-09-14' }]);
    conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han) VALUES (?,?,?,?, 4, ?, ?)`)
      .run(sid, cy, get('SELECT MIN(id) id FROM assessment_attempts').id, nhom, '2026-09-27', '2026-09-29');
    assert(!d.laLanGhiCuoi({ preset: true, followupDue: '2026-09-27', actionDue: '2026-09-29', mienPhi: true }, '2026-09-26')
      && d.laLanGhiCuoi({ preset: true, followupDue: '2026-09-27', actionDue: '2026-09-29', mienPhi: true }, '2026-09-27')
      && d.laLanGhiCuoi({ preset: true, followupDue: '2026-09-27', actionDue: '2026-09-29' }, '2026-09-14'), 'laLanGhiCuoi: miễn phí theo ngày Mini Test, PA quy chế SOS giữ luật cũ');
    cases.updateResult(GV, iv, { decision: 'keep', outcome: 'partial', note: 'Em làm đủ bài tuần đầu', observedOn: '2026-09-14' });
    const pa = get('SELECT status, action_due FROM case_interventions WHERE id = ?', iv);
    assert(pa.status === 'started' && pa.action_due === '2026-09-29', `ghi giữa chừng: ${JSON.stringify(pa)}`);
    ngay('2026-09-27');
    assert(maLoi(() => cases.updateResult(GV, iv, { decision: 'keep', outcome: 'partial', note: 'Em làm đủ bài tuần hai', observedOn: '2026-09-27' })) === 400,
      'từ ngày Mini Test là Kết quả cuối — phải nhập Mini Test');
  }));
  check('OV12a-6b · TVV vẫn 403 với Học lại thẳng, Học tiếp sang lớp chi nhánh khác, Case, PA học thuật; xem lớp Học lại chỉ chi nhánh mình', () => thu(() => {
    const a = emCoKetQua(taoLopFt());
    assert(maLoi(() => students.hocLai(TVV, a.sid, {})) === 403, 'Học lại thẳng');
    const CP = get(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
    const lopCp = intake.createClass(P.admin, { code: 'CP-OV12A-FT', branchId: CP, kind: 'FT', isFastTrack: true, route: 'LT2', startDate: t.TODAY }).id as number;
    assert(maLoi(() => buocTiep.chonBuocTiep(TVV, a.cy, { chon: 'hoc_tiep', lopMoiId: lopCp })) === 403, 'TVV Học tiếp sang lớp chi nhánh khác');
    const dsTvv = students.lopChoHocLai(TVV, a.sid).lop as any[];
    assert(dsTvv.length > 0 && dsTvv.every((l) => l.chiNhanhId === MB) && students.lopChoHocLai(QL, a.sid).lop.some((l: any) => l.id === lopCp), 'TVV chỉ thấy lớp chi nhánh mình; QL thấy cả lớp CP');
    assert(maLoi(() => students.lopChoHocLai(TVV_CP, a.sid)) === 403 && maLoi(() => students.lopChoHocLai(CX, a.sid)) === 403, 'lớp Học lại ngoài quyền');
    ngay('2026-09-17');
    const sid = em();
    const { caseId, ivId } = caseVaPa(sid, '2026-09-17');
    assert(maLoi(() => cases.reportIssue(TVV, { studentId: sid, topic: 'reading', title: 'x', summary: 'Đọc sót ý chính ở bài dài', primaryCode: d.issuesForTopic('reading')[0].code })) === 403, 'TVV tạo Case');
    assert(maLoi(() => cases.recordIntervention(TVV, caseId, { kind: 'self_study', description: 'Tự học Listening — nghe chép', status: 'started', startedDate: '2026-09-17' })) === 403, 'TVV thêm PA');
    assert(maLoi(() => cases.updateResult(TVV, ivId, { decision: 'keep', outcome: 'partial', note: 'Đúng 15/20 câu điền số' })) === 403, 'TVV ghi kết quả PA');
  }));
}
