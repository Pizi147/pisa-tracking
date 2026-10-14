/** PHÉP KIỂM PR-DUYET — hộp Chờ duyệt. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDuyetTests(t: YThucTestKit) {
  const { check, assert, P, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { can } = await import('../permissions.ts');
  console.log('\nPR-DUYET · Hộp Chờ duyệt');

  check('DUYET (1) · LOAI_YC_META phủ đủ loại, phân loại hợp lệ; hạn mặc định tính cả ngày gửi', () => {
    for (const k of d.LOAI_YEU_CAU) assert(d.LOAI_YC_META[k] && d.laPhanLoai(d.LOAI_YC_META[k].phanLoai), k);
    assert(Object.keys(d.LOAI_YC_META).length === d.LOAI_YEU_CAU.length, 'thừa khoá');
    assert(d.hanDuyetMacDinh('de_xuat_pa', '2026-09-28') === '2026-10-02', String(d.hanDuyetMacDinh('de_xuat_pa', '2026-09-28')));
    assert(d.hanDuyetMacDinh('lich_thi', '2026-09-28') === null && d.hanDuyetMacDinh('bao_len_nguyen_nhan', '2026-09-28') === null, 'không hạn');
    assert(d.LOAI_YC_META.xin_y_kien.kieuNut === 'tra-loi' && d.LOAI_YC_META.bao_len_nguyen_nhan.kieuNut === 'nhac', 'kiểu nút');
  });
  check('DUYET (1) · sapThe: quá hạn → hôm nay → còn hạn → không hạn; cùng hạn gửi trước đứng trước', () => {
    const h = '2026-09-29';
    const ds = [
      { id: 'khong', hanDuyet: null, taoLuc: '2026-09-01' },
      { id: 'con3', hanDuyet: '2026-10-01', taoLuc: '2026-09-20' },
      { id: 'homnay-moi', hanDuyet: h, taoLuc: '2026-09-25' },
      { id: 'qua2', hanDuyet: '2026-09-27', taoLuc: '2026-09-22' },
      { id: 'homnay-cu', hanDuyet: h, taoLuc: '2026-09-24' },
    ];
    const kq = d.sapThe(ds).map((x) => x.id).join(' ');
    assert(kq === 'qua2 homnay-cu homnay-moi con3 khong', kq);
  });
  check('DUYET (1) · demChip đủ 6 khoá, tất cả = tổng; laTuDuyet; duongThe; nhãn trạng thái', () => {
    const c = d.demChip([{ phanLoai: 'hoc-thuat' }, { phanLoai: 'hoc-thuat' }, { phanLoai: 'bao-len' }]);
    assert(c['tat-ca'] === 3 && c['hoc-thuat'] === 2 && c['bao-len'] === 1 && c['y-thuc'] === 0 && Object.keys(c).length === 6, JSON.stringify(c));
    assert(d.laTuDuyet(2, 2) && !d.laTuDuyet(null, 2) && !d.laTuDuyet(3, 2), 'tự duyệt');
    assert(d.duongThe(5, 'nguoi-xin') === '/cong-viec/yeu-cau?the=5' && d.duongThe(12, 'duyet') === '/cong-viec/cho-duyet?the=12', 'đường');
    assert(d.nhanTrangThaiYc('duyet', true).chu.includes('tự duyệt') && d.nhanTrangThaiYc('tu_choi').t === 'can-lam'   // PR-GVb: chủ sản phẩm 03/10
      && d.nhanTrangThaiYc('cho').t === 'cho-duyet', 'nhãn');
  });
  check('DUYET (1) · request.approve: QL MB duyệt lớp MB, QL CP không, GVCN không bao giờ; cycle.edit không cho GV', () => {
    const mb = classId('MB FT 101');
    assert(!can(P.coreTeacher, 'request.approve', { classId: mb }), 'GVCN có request.approve');
    assert(can(P.mbManager, 'request.approve', { classId: mb }), 'QL MB');
    assert(!can(P.cpManager, 'request.approve', { classId: mb }), 'QL CP duyệt lớp MB');
    assert(can(P.admin, 'request.approve', { classId: mb }), 'Quản trị');
    assert(!can(P.coreTeacher, 'cycle.edit', { classId: mb }) && can(P.mbManager, 'cycle.edit', { classId: mb }), 'cycle.edit');
    assert(d.PERMISSION_LABEL['request.approve'] && d.PERMISSION_LABEL['cycle.edit'], 'nhãn quyền');
  });
  check('DUYET (1) · deadlineView loại duyet: còn 3 ngày · hôm nay = còn 1 ngày · quá hạn 1 ngày', () => {
    const v = (due: string) => d.deadlineView({ kind: 'duyet', due, today: '2026-09-29' });
    assert(v('2026-10-01').con === 'còn 3 ngày' && v('2026-10-01').text.includes('còn 3 ngày'), v('2026-10-01').text);
    assert(v('2026-09-29').con === 'còn 1 ngày' && v('2026-09-29').homNay, v('2026-09-29').text);
    assert(v('2026-09-28').con === null && v('2026-09-28').quaHan === 'quá hạn 1 ngày', v('2026-09-28').text);
    assert(d.deadlineView({ kind: 'lap-pa', due: '2026-10-01', today: '2026-09-29' }).con == null, 'loại khác không có "còn"');
  });

  const mig: any = await import('../migrate/prDuyet.ts');
  const { conn, TODAY } = t;
  check('DUYET (2) · migrate hai lần: lần hai không thêm thẻ; PA huỷ/Case đóng không có thẻ (PR-SO: bước chép thẻ từ luồng cũ + chạy thử đã gỡ)', () => {
    const dem = () => (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n as number;
    const lan1: string[] = []; mig.migratePrDuyet(conn, lan1);
    const sau1 = dem();
    const lan2: string[] = []; mig.migratePrDuyet(conn, lan2);
    assert(dem() === sau1 && lan2.length === 0, `lần hai: ${sau1} → ${dem()} · ${lan2.join(' · ')}`);
    const thua = conn.prepare(`SELECT y.id FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id
      JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE y.loai = 'de_xuat_pa' AND y.trang_thai = 'cho' AND (iv.status = 'cancelled' OR sc.status = 'done')`).all() as any[];
    assert(thua.length === 0, `thẻ của PA huỷ/Case đóng: ${thua.map((x) => x.id).join(',')}`);
  });

  // ---------------------------------------------------------------- khối 3: lõi hộp, dùng một loại GIẢ đăng ký tạm
  const yc: any = await import('../duyet/yeuCau.ts');
  const { DINH_NGHIA_LOAI } = await import('../duyet/loaiYeuCau.ts');
  const maLoi = (fn: () => unknown): number | string => {
    try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); }
  };
  const chuLoi = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };
  const mb = classId('MB FT 101');
  /* Em chỉ có MỘT ghi danh đang học (ở MB FT 101) — phép kiểm trước có thể đã chuyển lớp vài em. */
  const hvMb = (conn.prepare(`SELECT e.student_id AS id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active'
      AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = e.student_id AND x.status = 'active') = 1 ORDER BY e.id LIMIT 1`).get(mb) as any).id as number;
  const GIA = 'thu_hop' as any;
  (d.LOAI_YC_META as any)[GIA] = { phanLoai: 'hoc-thuat', nhan: 'Thử hộp', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: true };
  const daDuyet: number[] = [];
  DINH_NGHIA_LOAI.push({
    loai: GIA, khiDuyet: (_p: any, y: any) => { daDuyet.push(y.id); },
    chet: { sql: 'y.doi_tuong_id < 0', lyDo: 'Đối tượng thử đã mất' },
    moTa: (y: any, ngu: any) => ({ tieuDe: `Thử · ${ngu.hocVien.get(y.hoc_vien_id) ?? ''}`, dong: [y.ly_do ?? ''] }),
  });
  let seq = 900000;
  const tao = (o: Record<string, unknown> = {}) => yc.taoYeuCau(conn, {
    loai: GIA, doiTuongLoai: 'thu', doiTuongId: ++seq, hocVienId: hvMb, nguoiXin: P.coreTeacher.userId, lyDo: 'Lý do thử', ...o });
  const docThe = (id: number) => conn.prepare('SELECT * FROM yeu_cau_duyet WHERE id = ?').get(id) as any;
  try {
    check('DUYET (3) · tạo thẻ: QL MB thấy, QL CP không, GVCN mở hộp → 403; trùng (loại, đối tượng) không tạo đôi; báo duyet_moi', () => {
      const id = tao();
      assert(id && docThe(id).lop_id === mb && docThe(id).chi_nhanh_id && docThe(id).han_duyet, JSON.stringify(docThe(id)));
      assert(yc.taoYeuCau(conn, { loai: GIA, doiTuongLoai: 'thu', doiTuongId: seq, hocVienId: hvMb, nguoiXin: null }) === null, 'tạo đôi');
      assert(yc.hopChoDuyet(P.mbManager).the.some((x: any) => x.id === id), 'QL MB không thấy');
      assert(!yc.hopChoDuyet(P.cpManager).the.some((x: any) => x.id === id), 'QL CP thấy thẻ MB');
      assert(maLoi(() => yc.hopChoDuyet(P.coreTeacher)) === 403, 'GVCN mở được hộp');
      assert(yc.yeuCauCuaToi(P.coreTeacher).the.some((x: any) => x.id === id && x.tieuDe.startsWith('Thử')), 'Yêu cầu của tôi');
      assert(!!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'duyet_moi' AND entity_id = ?`).get(P.mbManager.userId, id), 'thiếu duyet_moi');
      const dem = yc.demYeuCau(P.mbManager);
      assert(dem.cho >= 1 && yc.demYeuCau(P.coreTeacher).cuaToiCho >= 1 && yc.demYeuCau(P.coreTeacher).cho === 0, JSON.stringify(dem));
    });
    check('DUYET (3) · duyệt hai lần → lần hai 400 "đã được xử lý"; khiDuyet chạy đúng một lần; người xin nhận duyet_ket_qua', () => {
      const id = tao();
      const r = yc.duyetYeuCau(P.mbManager, id, { ghiChu: 'Đồng ý' });
      assert(r.ok && docThe(id).trang_thai === 'duyet' && docThe(id).nguoi_duyet === P.mbManager.userId && docThe(id).tra_loi === 'Đồng ý', JSON.stringify(docThe(id)));
      assert(maLoi(() => yc.duyetYeuCau(P.mbManager, id)) === 400 && /đã được xử lý/.test(chuLoi(() => yc.duyetYeuCau(P.mbManager, id))), 'lần hai');
      assert(daDuyet.filter((x) => x === id).length === 1, 'khiDuyet chạy lại');
      assert(yc.chotYeuCau(conn, { doiTuongLoai: 'thu', doiTuongId: docThe(id).doi_tuong_id }, 'duyet', {}) === 0, 'chốt lần hai phải trả 0');
      const kq = conn.prepare(`SELECT title FROM notifications WHERE user_id = ? AND kind = 'duyet_ket_qua' AND entity_id = ?`).all(P.coreTeacher.userId, id) as any[];
      assert(kq.length === 1 && /Đã duyệt/.test(kq[0].title), JSON.stringify(kq));
      assert(maLoi(() => yc.duyetYeuCau(P.cpManager, tao())) === 403, 'QL CP duyệt thẻ MB');
      assert(maLoi(() => yc.duyetYeuCau(P.coreTeacher, tao())) === 403, 'GVCN duyệt');
    });
    check('DUYET (3) · từ chối thiếu lý do → 400; có lý do → tu_choi; trả lời thẻ Duyệt → 400; duyệt hàng loạt báo riêng thẻ lỗi; câu lỗi không lộ mã', () => {
      const id = tao();
      assert(maLoi(() => yc.tuChoiYeuCau(P.mbManager, id, '  ')) === 400, 'thiếu lý do');   // PR-MTa T7: bỏ tối thiểu 3 ký tự — chỉ cần không trống
      yc.tuChoiYeuCau(P.mbManager, id, 'Chưa đủ căn cứ');
      assert(docThe(id).trang_thai === 'tu_choi' && docThe(id).ly_do_tu_choi === 'Chưa đủ căn cứ', JSON.stringify(docThe(id)));
      assert(maLoi(() => yc.traLoiYeuCau(P.mbManager, tao(), 'Trả lời')) === 400, 'trả lời thẻ Duyệt');
      const a = tao(); const b = tao();
      yc.duyetYeuCau(P.mbManager, b);
      const r = yc.duyetNhieu(P.mbManager, [a, b]);
      assert(r.ok.length === 1 && r.ok[0] === a && r.loi.length === 1 && r.loi[0].id === b, JSON.stringify(r));
      assert(maLoi(() => yc.duyetNhieu(P.mbManager, [])) === 400, 'rỗng');
      for (const loi of [chuLoi(() => yc.tuChoiYeuCau(P.mbManager, a, '')), chuLoi(() => yc.hopChoDuyet(P.coreTeacher)), chuLoi(() => yc.duyetYeuCau(P.mbManager, a))]) {
        assert(loi && !/[a-z]+_[a-z]+|request[.]/.test(loi), `câu lỗi lộ mã: ${loi}`);
      }
    });
    check('DUYET (3) · QL tự gửi rồi tự duyệt → tu_duyet = 1, Quản trị nhận một thông báo, QL không tự báo mình', () => {
      const id = tao({ nguoiXin: P.mbManager.userId });
      const r = yc.duyetYeuCau(P.mbManager, id);
      assert(r.tuDuyet && docThe(id).tu_duyet === 1, JSON.stringify(docThe(id)));
      const n = conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND entity_id = ? AND kind = 'duyet_tu_duyet'`).get(P.admin.userId, id) as any;
      assert(n.n === 1, `Quản trị nhận ${n.n} thông báo tự duyệt`);
      assert(!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND kind IN ('duyet_ket_qua', 'duyet_moi') AND entity_id = ?`).get(P.mbManager.userId, id), 'tự báo cho mình');
    });
    check('DUYET (3) · quét: đối tượng "chết" → tu_dong + lý do; quá hạn → đúng MỘT thông báo cho QL và Quản trị sau hai lần quét', () => {
      const chet = tao({ doiTuongId: -(++seq) });
      yc.quetYeuCau(TODAY);
      assert(docThe(chet).trang_thai === 'tu_dong' && docThe(chet).ly_do_dong === 'Đối tượng thử đã mất', JSON.stringify(docThe(chet)));
      const qua = tao({ hanDuyet: t.addDays(TODAY, -2) });
      yc.quetYeuCau(TODAY); yc.quetYeuCau(TODAY);
      const dem = (uid: number) => (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'duyet_qua_han' AND entity_id = ?`).get(uid, qua) as any).n;
      assert(dem(P.mbManager.userId) === 1 && dem(P.admin.userId) === 1 && dem(P.cpManager.userId) === 0, `${dem(P.mbManager.userId)} · ${dem(P.admin.userId)} · ${dem(P.cpManager.userId)}`);
      assert(yc.demYeuCau(P.mbManager).quaHan >= 1, 'đếm quá hạn');
      const duong = (kind: string) => d.duongThongBao({ entity_type: 'yeu_cau_duyet', entity_id: qua, kind, student_id: null, attempt_id: null });
      assert(duong('duyet_qua_han') === `/cong-viec/cho-duyet?the=${qua}` && duong('duyet_ket_qua') === `/cong-viec/yeu-cau?the=${qua}`, 'đường thông báo');
    });
  } finally {
    DINH_NGHIA_LOAI.splice(DINH_NGHIA_LOAI.findIndex((x) => x.loai === GIA), 1);
    conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'tu_dong', ly_do_dong = 'thẻ thử', xu_ly_luc = ? WHERE loai = ? AND trang_thai = 'cho'`).run(new Date().toISOString(), GIA);
    conn.prepare('DELETE FROM notifications WHERE entity_type = ? AND entity_id IN (SELECT id FROM yeu_cau_duyet WHERE loai = ?)').run('yeu_cau_duyet', GIA);
    conn.prepare('DELETE FROM yeu_cau_duyet WHERE loai = ?').run(GIA);
    delete (d.LOAI_YC_META as any)[GIA];
  }

  // ---------------------------------------------------------------- khối 4: Đề xuất PA vào hộp (T43)
  const casesSvc: any = await import('../cases/cases.ts');
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const { closeCasesBySystem } = await import('../cases/systemClose.ts');
  let hvSeq = 0;
  /** Em MỚI chỉ học MB FT 101 + một Case Listening do GV Listening mở — không đụng dữ liệu demo các phép kiểm khác đang đọc. */
  const hvMoi = () => {
    hvSeq += 1;
    const tag = `DUYET-${hvSeq}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, mb, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    const c = casesSvc.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', title: `Case thử ${tag}`,
      summary: 'Case dựng riêng cho phép kiểm hộp Chờ duyệt.', primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `duyet-${tag}` }) as any;
    return { sid, caseId: c.id as number };
  };
  const deXuat = (caseId: number, moTa = 'Tutor 1-1 hai buổi mỗi tuần') => {
    const r = casesSvc.recordIntervention(P.lrTeacher, caseId, { kind: 'tutor', description: moTa, status: 'planned', needsApproval: true }) as any;
    return r.interventions[r.interventions.length - 1].id as number;
  };
  const theCua = (loai: string, doiTuongId: number) =>
    conn.prepare('SELECT * FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1').get(loai, doiTuongId) as any;

  check('DUYET (4) · GV đề xuất PA cần duyệt → MỘT thẻ Đề xuất PA hạn = approval_due; myWork(QL) không còn nhóm decide', () => {
    const { caseId } = hvMoi();
    const ivId = deXuat(caseId);
    const iv = conn.prepare('SELECT approval_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    const the = theCua('de_xuat_pa', ivId);
    assert(the && the.trang_thai === 'cho' && the.han_duyet === iv.approval_due && the.nguoi_xin === P.lrTeacher.userId && the.lop_id === mb,
      JSON.stringify(the));
    assert((conn.prepare(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ?`).get(ivId) as any).n === 1, 'thẻ đôi');
    assert(!(myworkSvc.myWork(P.mbManager, {}).groups as any[]).some((g) => g.key === 'decide' || g.key === 'decide_move'), 'còn nhóm việc duyệt');
    const tren = yc.hopChoDuyet(P.mbManager).the.find((x: any) => x.id === the.id);
    assert(tren && tren.tieuDe.startsWith('Đề xuất PA · Listening') && tren.dong[0].includes('Tutor 1-1') && tren.neuDuyet?.includes('hết T3')
      && tren.mo?.includes(`case=${caseId}`), JSON.stringify(tren));
    assert(!conn.prepare(`SELECT 1 FROM notifications WHERE kind IN ('approval', 'case') AND entity_type = 'sos_case' AND entity_id = ?`).get(caseId),
      'còn thông báo kiểu cũ (approval/plan/report)');
  });
  check('DUYET (4) · QL Duyệt ở hộp → PA Đang làm, hạn ghi kết quả Thứ Hai, thẻ duyet, GV nhận duyet_ket_qua', () => {
    const { caseId } = hvMoi();
    const ivId = deXuat(caseId);
    const the = theCua('de_xuat_pa', ivId);
    yc.duyetYeuCau(P.mbManager, the.id, { ghiChu: 'Đồng ý' });
    const iv = conn.prepare('SELECT status, approval_state, action_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.status === 'started' && iv.approval_state === 'approved' && iv.action_due === d.hanKyGhiKetQua(TODAY), JSON.stringify(iv));
    assert(theCua('de_xuat_pa', ivId).trang_thai === 'duyet', 'thẻ chưa chốt');
    assert(!!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'duyet_ket_qua' AND entity_id = ?`).get(P.lrTeacher.userId, the.id), 'GV không nhận kết quả');
  });
  check('DUYET (4) · gọi thẳng respondToPlan (đường cũ) cũng chốt thẻ; từ chối ở hộp → PA huỷ, lý do ở thẻ', () => {
    const a = hvMoi(); const ivA = deXuat(a.caseId);
    casesSvc.respondToPlan(P.mbManager, ivA, { decision: 'declined', note: 'Chưa cần tutor' });
    const theA = theCua('de_xuat_pa', ivA);
    assert(theA.trang_thai === 'tu_choi' && theA.ly_do_tu_choi === 'Chưa cần tutor', JSON.stringify(theA));
    const b = hvMoi(); const ivB = deXuat(b.caseId);
    yc.tuChoiYeuCau(P.mbManager, theCua('de_xuat_pa', ivB).id, 'Thử cách khác trước');
    const iv = conn.prepare('SELECT status, approval_state FROM case_interventions WHERE id = ?').get(ivB) as any;
    assert(iv.status === 'cancelled' && iv.approval_state === 'declined', JSON.stringify(iv));
  });
  check('DUYET (4) · Case đóng bởi hệ thống (FT → lớp thường, D15) → lần mở hộp sau thẻ tự đóng', () => {
    const { sid, caseId } = hvMoi();
    const ivId = deXuat(caseId);
    closeCasesBySystem({ actorUserId: null, studentId: sid, reason: 'course_ended', on: TODAY });
    yc.hopChoDuyet(P.mbManager);
    const the = theCua('de_xuat_pa', ivId);
    assert(the.trang_thai === 'tu_dong' && /Case đã đóng/.test(the.ly_do_dong), JSON.stringify(the));
  });

  // ---------------------------------------------------------------- khối 5: Xin ý kiến (T64) — PA không dừng
  const paChay = () => {
    const { sid, caseId } = hvMoi();
    const r = casesSvc.recordIntervention(P.lrTeacher, caseId, {
      kind: 'self_study', description: 'Tự học nghe chép 15 phút mỗi ngày', status: 'started', startedDate: t.addDays(TODAY, -7), performerSelf: true,
    }) as any;
    return { sid, caseId, ivId: r.interventions[r.interventions.length - 1].id as number };
  };
  check('DUYET (5) · Xin hỗ trợ QL: PA vẫn Đang làm, hạn kỳ sau như Giữ nguyên, dự kiến kết thúc không đổi; một thẻ Xin ý kiến 5 ngày', () => {
    const { ivId } = paChay();
    const truoc = conn.prepare('SELECT followup_due, action_due, COALESCE(started_date, cycle_started_on) bat_dau FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(chuLoi(() => casesSvc.updateResult(P.lrTeacher, ivId, { decision: 'ask_manager', outcome: 'unchanged', note: 'Em vẫn nghe sót số', observedOn: TODAY }))
      .includes('cần Quản lý giúp gì'), 'thiếu câu hỏi vẫn gửi được');
    casesSvc.updateResult(P.lrTeacher, ivId, { decision: 'ask_manager', outcome: 'unchanged', note: 'Em vẫn nghe sót số',
      decisionNote: 'Có nên chuyển sang tutor không?', observedOn: TODAY });
    const iv = conn.prepare('SELECT status, approval_state, action_due, followup_due FROM case_interventions WHERE id = ?').get(ivId) as any;
    assert(iv.status === 'started' && iv.approval_state == null && iv.action_due === d.hanKe(truoc.bat_dau, truoc.action_due, TODAY)
      && iv.followup_due === truoc.followup_due, JSON.stringify(iv));
    const the = theCua('xin_y_kien', ivId);
    assert(the?.trang_thai === 'cho' && the.ly_do === 'Có nên chuyển sang tutor không?' && the.han_duyet === d.hanDuyetMacDinh('xin_y_kien', TODAY),
      JSON.stringify(the));
    const tren = yc.hopChoDuyet(P.mbManager).the.find((x: any) => x.id === the.id);
    assert(tren && tren.kieuNut === 'tra-loi' && tren.tieuDe.startsWith('Xin ý kiến · PA') && tren.dong.some((x: string) => x.startsWith('Kết quả tuần: ')),
      JSON.stringify(tren));
  });
  check('DUYET (5) · Trả lời thiếu chữ → 400; có chữ → Đã trả lời, GV nhận câu trả lời, Ngăn Case có dòng trả lời; Duyệt thẻ này → 400', () => {
    const { caseId, ivId } = paChay();
    casesSvc.updateResult(P.lrTeacher, ivId, { decision: 'ask_manager', outcome: 'worse', note: 'Em vẫn nghe sót số',
      decisionNote: 'Cần Quản lý xếp tutor giúp em', observedOn: TODAY });
    const id = theCua('xin_y_kien', ivId).id;
    assert(casesSvc.caseDetail(P.lrTeacher, caseId).interventions.find((x: any) => x.id === ivId).xinYKien?.trangThai === 'cho', 'Ngăn Case thiếu dòng chờ');
    assert(maLoi(() => yc.traLoiYeuCau(P.mbManager, id, ' ')) === 400 && maLoi(() => yc.duyetYeuCau(P.mbManager, id)) === 400, '400');
    yc.traLoiYeuCau(P.mbManager, id, 'Xếp tutor thứ Tư, tôi báo tổ');
    assert(theCua('xin_y_kien', ivId).trang_thai === 'da_tra_loi' && theCua('xin_y_kien', ivId).tra_loi === 'Xếp tutor thứ Tư, tôi báo tổ', 'chưa chốt');
    const tb = conn.prepare(`SELECT title FROM notifications WHERE user_id = ? AND kind = 'duyet_ket_qua' AND entity_id = ?`).get(P.lrTeacher.userId, id) as any;
    assert(tb && tb.title.includes('Xếp tutor thứ Tư'), JSON.stringify(tb));
    const xyk = casesSvc.caseDetail(P.lrTeacher, caseId).interventions.find((x: any) => x.id === ivId).xinYKien;
    assert(xyk?.trangThai === 'da_tra_loi' && xyk.traLoi.includes('thứ Tư') && xyk.nguoiDuyet, JSON.stringify(xyk));
  });

  // ---------------------------------------------------------------- khối 6: Đề xuất sửa thông tin HV (T44, Câu 1 = B)
  const cyclesSvc: any = await import('../fasttrack/cycles.ts');
  const deXuat6: any = await import('../duyet/deXuatSua.ts');
  const cycCua = (sid: number) => conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
  const hvCoTarget = () => {
    const { sid } = hvMoi();
    conn.prepare('UPDATE learning_cycles SET target_score = 6.5 WHERE student_id = ?').run(sid);
    return { sid, cyc: cycCua(sid) };
  };
  check('DUYET (6) · GVCN không tự sửa target/lộ trình (403, chỉ lối Đề xuất sửa); ghi chú, tháng thi vẫn sửa được; QL sửa được', () => {
    const { cyc } = hvCoTarget();
    assert(maLoi(() => cyclesSvc.reviseTarget(P.coreTeacher, cyc.id, { newTarget: 7, reason: 'Thử' })) === 403
      && /Đề xuất sửa/.test(chuLoi(() => cyclesSvc.reviseTarget(P.coreTeacher, cyc.id, { newTarget: 7, reason: 'Thử' }))), 'GVCN đổi target');
    assert(maLoi(() => cyclesSvc.updateCycle(P.coreTeacher, cyc.id, { route: 'LT2' })) === 403, 'GVCN đổi lộ trình');
    assert(maLoi(() => cyclesSvc.createCycle(P.coreTeacher, { studentId: cyc.student_id, route: 'LT2' })) === 403, 'GVCN mở lộ trình mới');
    cyclesSvc.updateCycle(P.coreTeacher, cyc.id, { note: 'Ghi chú của GVCN', examMonth: '2026-12', targetScore: 6.5, route: cyc.route });
    assert(cycCua(cyc.student_id).exam_month === '2026-12', 'GVCN không sửa được tháng thi');
    cyclesSvc.reviseTarget(P.mbManager, cyc.id, { newTarget: 7, reason: 'QL đổi' });
    assert(cycCua(cyc.student_id).target_score === 7, 'QL không đổi được target');
  });
  check('DUYET (6) · GVBM gửi Đề xuất sửa target 6.5 → 7.0 → thẻ; QL Duyệt → đổi target, lịch sử ghi lý do đề xuất và người duyệt', () => {
    const { sid, cyc } = hvCoTarget();
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.lrTeacher, sid, { truong: 'target', moi: 7, lyDo: '  ' })) === 400, 'lý do trống');   // PR-MTa T7: bỏ tối thiểu 15 ký tự
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.lrTeacher, sid, { truong: 'target', moi: 7.3, lyDo: 'PH đăng ký thi 12/2026, cần 7.0' })) === 400, 'band lẻ');
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.cpManager, sid, { truong: 'target', moi: 7, lyDo: 'PH đăng ký thi 12/2026, cần 7.0' })) === 403, 'ngoài phạm vi');
    const { id } = deXuat6.guiDeXuatSua(P.lrTeacher, sid, { truong: 'target', moi: 7, lyDo: 'PH đăng ký thi 12/2026, cần 7.0' });
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.lrTeacher, sid, { truong: 'target', moi: 7.5, lyDo: 'PH đăng ký thi 12/2026, cần 7.5' })) === 400, 'thẻ đôi');
    const tren = yc.hopChoDuyet(P.mbManager).the.find((x: any) => x.id === id);
    assert(tren?.tieuDe === 'Đề xuất sửa Target 6.5 → 7.0' && tren.phanLoai === 'thong-tin-hv', JSON.stringify(tren));
    yc.duyetYeuCau(P.mbManager, id);
    const rev = conn.prepare('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC LIMIT 1').get(cyc.id) as any;
    assert(cycCua(sid).target_score === 7 && rev.reason === 'PH đăng ký thi 12/2026, cần 7.0' && rev.actor_user_id === P.mbManager.userId, JSON.stringify(rev));
  });
  check('DUYET (6) · Đề xuất sửa (không tự áp; lịch MT bỏ từ 09/10 → 400): Duyệt không ghi chú → 400; có ghi chú → Đã duyệt, KHÔNG tự đổi gì; trường "lớp" bị bỏ (PR-CT: dùng Đề xuất chuyển lớp → 400); ⋮ có mục Đề xuất sửa cho GV không có cycle.edit', () => {
    const { sid } = hvMoi();
    const lopTruoc = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`).get(sid) as any).class_id;
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.coreTeacher, sid, { truong: 'lop', moi: 'Chuyển sang MB FT 102', lyDo: 'Em theo kịp lớp nhanh hơn, PH đồng ý' })) === 400, 'trường lớp đã bỏ');
    assert(maLoi(() => deXuat6.guiDeXuatSua(P.coreTeacher, sid, { truong: 'lich-mt', moi: 'Dời MT2 sang tuần sau', lyDo: 'Em theo kịp lớp nhanh hơn, PH đồng ý' })) === 400, 'lịch MT đã bỏ');
    const { id } = deXuat6.guiDeXuatSua(P.coreTeacher, sid, { truong: 'khac', moi: 'Ghi chú khác', lyDo: 'Em theo kịp lớp nhanh hơn, PH đồng ý' });
    assert(maLoi(() => yc.duyetYeuCau(P.mbManager, id)) === 400, 'duyệt không ghi chú');
    yc.duyetYeuCau(P.mbManager, id, { ghiChu: 'Đã xử lý' });
    const sau = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`).get(sid) as any).class_id;
    assert(theCua('sua_thong_tin', sid).trang_thai === 'duyet' && sau === lopTruoc, 'tự chuyển lớp');
    const muc = d.mucQuanLyHocVien({ canEdit: false, lopHoc: null, cycle: { ratio: false }, status: 'active', deXuatSua: true }).map((x: any) => x.key);
    assert(muc.join() === 'de-xuat-sua' && d.NHAN_VIEC_QUAN_LY['de-xuat-sua'] === 'Đề xuất sửa thông tin…', muc.join());
  });

  // ---------------------------------------------------------------- khối 7: Báo QL Case chờ nguyên nhân quá hạn (K1-57) + Nhắc
  const { awaitingCauseCaseIds } = await import('../cases/sosState.ts');
  const { nhacViec } = await import('../worklist/nhacViec.ts');
  check('DUYET (7) · Case chờ nguyên nhân quá hạn → MỘT thẻ Báo QL (quét lần hai không thêm); QL "Của tôi" không còn dòng cause, "tat-ca" vẫn có; Nhắc trỏ đúng dòng; có nguyên nhân → tự đóng', () => {
    const ung = conn.prepare(`SELECT sc.id, sc.owner_user_id FROM sos_cases sc
      WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL AND sc.owner_user_id != ?
        AND EXISTS (SELECT 1 FROM case_signals g WHERE g.case_id = sc.id AND g.status = 'linked') ORDER BY sc.id`).all(P.admin.userId) as any[];
    const cho = new Set(awaitingCauseCaseIds(ung.map((r) => r.id)));
    const kase = ung.find((r) => cho.has(r.id));
    assert(kase, 'Bộ demo thiếu Case SOS chờ nguyên nhân (seed SOS v3)');
    const hanGoc = (conn.prepare('SELECT han_xac_nhan h FROM sos_cases WHERE id = ?').get(kase.id) as any).h;
    conn.prepare(`UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?`).run(t.addDays(TODAY, -2), kase.id);   // PR-SOS: hạn ở han_xac_nhan
    yc.quetYeuCau(TODAY); yc.quetYeuCau(TODAY);
    const dem = () => (conn.prepare(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'bao_len_nguyen_nhan' AND doi_tuong_id = ? AND trang_thai = 'cho'`)
      .get(kase.id) as any).n;
    assert(dem() === 1, `số thẻ Báo QL: ${dem()}`);
    const the = yc.hopChoDuyet(P.admin, { xem: 'de-biet' }).the.find((x: any) => x.loai === 'bao_len_nguyen_nhan' && x.duLieu?.viecKey === `cause:${kase.id}`);   // PR-GVb (J5b): Báo QL tách khỏi tab Chờ duyệt → tab Để QL biết
    assert(the && the.kieuNut === 'nhac' && the.nguoiXin === null && the.phanLoai === 'bao-len' && the.hanDuyet === t.addDays(TODAY, -2)
      && !the.dong.some((d: string) => /không cần duyệt/i.test(d)), JSON.stringify(the));   // PR-NV (T8): bỏ câu giải thích trên thẻ Nhắc việc
    assert(maLoi(() => yc.duyetYeuCau(P.admin, the.id)) === 400, 'Báo QL duyệt được');
    assert(!conn.prepare(`SELECT 1 FROM notifications WHERE kind = 'duyet_qua_han' AND entity_id = ?`).get(the.id), 'Báo QL sinh duyet_qua_han (Q13)');
    const khoa = (w: any) => w.items.map((it: any) => it.key);
    assert(!khoa(myworkSvc.myWork(P.admin, {})).includes(`cause:${kase.id}`), 'QL "Của tôi" còn dòng cause của GV khác');
    const tatCa = myworkSvc.myWork(P.admin, { nguoi: 'tat-ca' }).items.find((it: any) => it.key === `cause:${kase.id}`);
    assert(tatCa && tatCa.ownerId === kase.owner_user_id, '"tat-ca" mất dòng cause');
    const r1 = nhacViec(P.admin, { key: `cause:${kase.id}`, ownerId: kase.owner_user_id });
    const tb = conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND kind = 'nhac_viec' AND dedup_key LIKE ?`).get(kase.owner_user_id, `nhac:cause:${kase.id}:%`) as any;
    assert(tb && tb.duong === tatCa.href && tatCa.href.includes(`case=${kase.id}`) && d.duongThongBao(tb) === tatCa.href, JSON.stringify(tb));
    assert(nhacViec(P.admin, { key: `cause:${kase.id}`, ownerId: kase.owner_user_id }).daNhacLuc === r1.daNhacLuc, 'nhắc lần hai gửi thêm');
    assert(yc.hopChoDuyet(P.admin, { xem: 'de-biet' }).the.find((x: any) => x.id === the.id)?.duLieu?.daNhacLuc === r1.daNhacLuc, 'thẻ không hiện Đã nhắc');
    const nn = conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?, 'primary', 'student.listening.technique', ?)`)
      .run(kase.id, new Date().toISOString()).lastInsertRowid;
    yc.quetYeuCau(TODAY);
    const sau = conn.prepare('SELECT trang_thai, ly_do_dong FROM yeu_cau_duyet WHERE id = ?').get(the.id) as any;
    /* OV-12c: Case chờ nguyên nhân nay là Case Progress của bộ demo LT2a (G1–G5) — trả nguyên nhân + hạn để phép kiểm sau đọc đúng demo. */
    conn.prepare('DELETE FROM case_issues WHERE id = ?').run(nn);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(hanGoc, kase.id);
    assert(sau.trang_thai === 'tu_dong' && sau.ly_do_dong === 'Việc gốc đã xong', JSON.stringify(sau));
  });

  // ---------------------------------------------------------------- khối 10: Tổng quan, badge, Quản trị, Vận hành tên ngoài
  const tongQuanSvc: any = await import('../worklist/tongQuan.ts');
  const accountsSvc: any = await import('../platform/accounts.ts');
  const mgmtSvc: any = await import('../worklist/mgmttasks.ts');
  const { navOf } = await import('../platform/nav.ts');
  check('DUYET (10) · Tổng quan QL có số Chờ duyệt (đọc từ hộp); Cần xử lý không còn "PA chờ duyệt"/"Case quá hạn xác định nguyên nhân"; cờ nav', () => {
    const r = tongQuanSvc.tongQuanQuanLy(P.mbManager, { branchId: null, ct: 'ft' });
    const dem = yc.demYeuCau(P.mbManager);
    assert(r.choDuyet && r.choDuyet.cho === dem.cho && r.choDuyet.quaHan === dem.quaHan && r.choDuyet.baoLen === dem.baoLen, JSON.stringify(r.choDuyet));
    assert(!r.canXuLy.some((x: any) => x.metricId === 'pa-cho-duyet' || x.metricId === 'case-xac-dinh-nguyen-nhan-qua-han'), 'còn dòng thẻ');
    assert(navOf(P.mbManager).workApprove && !navOf(P.coreTeacher).workApprove && navOf(P.coreTeacher).workRequests, 'cờ workApprove/workRequests');
    for (const ma of ['request.approve', 'request.decline', 'request.answer', 'request.create']) {
      assert(d.nhanHanhDongNhatKy(ma) !== 'Thao tác hệ thống', `thiếu nhãn nhật ký ${ma}`);
    }
  });
  check('DUYET (10) · Đăng ký tài khoản → Quản trị nhận thông báo "dang_ky", chuông mở Quản trị', () => {
    const { userId } = accountsSvc.register({ email: `dangkyduyet${Date.now()}.pisa@gmail.com`, password: 'MatKhau#2026a', fullName: 'Giáo viên Đăng ký Thử', branches: ['MB'] });
    const tb = conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND kind = 'dang_ky' AND entity_id = ?`).get(P.admin.userId, userId) as any;
    assert(tb && tb.title.includes('Giáo viên Đăng ký Thử') && d.duongThongBao(tb) === '/quan-tri', JSON.stringify(tb));
  });
  check('DUYET (10) · Vận hành: người phụ trách ngoài hệ thống (≥ 2 ký tự) lưu tên, không tài khoản; chọn tài khoản thì bỏ tên ngoài', () => {
    const tao = (o: any) => mgmtSvc.createMgmtTask(P.mbManager, { title: `Việc thử tên ngoài ${Date.now()}`, group: 'curriculum', branchId: (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id, ...o });
    const a = tao({ assigneeName: '  Tổ chuyên môn  ' });
    const ra = conn.prepare('SELECT assignee_user_id, assignee_name FROM tasks WHERE id = ?').get(a.id) as any;
    assert(ra.assignee_user_id === null && ra.assignee_name === 'Tổ chuyên môn' && a.assigneeName === 'Tổ chuyên môn' && a.assigneeNgoai === true, JSON.stringify([ra, a.assigneeName]));
    const dong = mgmtSvc.listMgmtTasks(P.mbManager, {}).rows.find((x: any) => x.id === a.id);
    assert(dong && dong.assigneeName === 'Tổ chuyên môn' && dong.assigneeNgoai === true, JSON.stringify(dong));
    assert(maLoi(() => tao({ assigneeName: 'T' })) === 400, 'tên 1 ký tự');
    const b = tao({ assigneeUserId: P.coreTeacher.userId, assigneeName: 'Bị bỏ' });
    assert((conn.prepare('SELECT assignee_name FROM tasks WHERE id = ?').get(b.id) as any).assignee_name === null, 'có tài khoản mà vẫn lưu tên ngoài');
    mgmtSvc.editMgmtTask(P.mbManager, a.id, { assigneeUserId: P.coreTeacher.userId });
    assert((conn.prepare('SELECT assignee_name FROM tasks WHERE id = ?').get(a.id) as any).assignee_name === null, 'đổi sang tài khoản không xoá tên ngoài');
  });

  // ---------------------------------------------------------------- khối R: sửa sau rà PR #117
  const studentsSvcR: any = await import('../students/students.ts');
  check('DUYET (R1) · Xin hỗ trợ QL lần 2 khi thẻ lần 1 còn chờ → vẫn MỘT thẻ, câu hỏi mới nối vào, followupId mới, QL được báo lại (không 400)', () => {
    const { ivId } = paChay();
    const hoi = (cau: string) => casesSvc.updateResult(P.lrTeacher, ivId, { decision: 'ask_manager', outcome: 'unchanged', note: 'Em vẫn nghe sót số',
      decisionNote: cau, observedOn: TODAY });
    hoi('Có nên chuyển sang tutor không?');
    const lan1 = theCua('xin_y_kien', ivId);
    hoi('Bổ sung: PH muốn học thêm buổi tối, có xếp được không?');
    const ds = conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'xin_y_kien' AND doi_tuong_id = ? AND trang_thai = 'cho'`).all(ivId) as any[];
    const fu = (conn.prepare('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1').get(ivId) as any).id;
    assert(ds.length === 1 && ds[0].id === lan1.id && ds[0].ly_do.includes('tutor') && ds[0].ly_do.includes('buổi tối')
      && JSON.parse(ds[0].du_lieu).followupId === fu, JSON.stringify(ds));
    assert(!!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'duyet_moi' AND entity_id = ? AND dedup_key LIKE 'bo_sung:%'`)
      .get(P.mbManager.userId, lan1.id), 'QL không được báo lại');
  });
  check('DUYET (R2) · một hàm đếm: số badge/dải = chip "Tất cả" của hộp; quá hạn = số thẻ đỏ (PR-GVb: không gồm Báo QL)', () => {
    const hop = yc.hopChoDuyet(P.mbManager);
    const dem = yc.demYeuCau(P.mbManager);
    const tq = tongQuanSvc.tongQuanQuanLy(P.mbManager, { branchId: null, ct: 'ft' }).choDuyet;
    const do_ = hop.the.filter((x: any) => x.hanDuyet && x.hanDuyet < TODAY).length;
    assert(dem.cho === hop.dem['tat-ca'] && dem.quaHan === do_ && dem.deBiet === yc.hopChoDuyet(P.mbManager, { xem: 'de-biet' }).the.length && tq.cho === dem.cho && tq.quaHan === dem.quaHan,
      JSON.stringify({ dem, chip: hop.dem, do_, tq }));
  });
  check('DUYET (R4) · duyệt hàng loạt: GV → 403 trước khi đọc thẻ; id không tồn tại chỉ lỗi thẻ đó', () => {
    const { caseId } = hvMoi();
    const ivId = deXuat(caseId);
    const id = theCua('de_xuat_pa', ivId).id;
    assert(maLoi(() => yc.duyetNhieu(P.coreTeacher, [id])) === 403 && maLoi(() => yc.duyetNhieu(P.coreTeacher, [987654])) === 403, 'GV không bị 403');
    const r = yc.duyetNhieu(P.mbManager, [id, 987654]);
    assert(r.ok.length === 1 && r.ok[0] === id && r.loi.length === 1 && r.loi[0].id === 987654, JSON.stringify(r));
  });
  check('DUYET (R5, R6) · mốc gửi theo ngày nghiệp vụ; thẻ Lịch thi đã quyết không còn dòng "tự huỷ"', () => {
    const { caseId } = hvMoi();
    const the = theCua('de_xuat_pa', deXuat(caseId));
    assert(d.vietnamDateOf(the.tao_luc) === TODAY, `tao_luc ${the.tao_luc} khác ngày nghiệp vụ ${TODAY}`);
    const lt = conn.prepare(`SELECT doi_tuong_id FROM yeu_cau_duyet WHERE loai = 'lich_thi' AND trang_thai != 'cho' LIMIT 1`).get() as any;
    if (lt) {
      const dto = yc.theCuaDoiTuong('skill_move', [lt.doi_tuong_id])[0];
      assert(!dto.dong.some((x: string) => x.includes('tự huỷ')), JSON.stringify(dto.dong));
    }
  });
  check('DUYET (R7) · GVCN chuyển lớp FT → FT: PR-CT (Q30-1) đổi kỳ vọng thành 403 (chỉ Quản lý quyết định); QL gửi mucTieu thì nhận', () => {
    const chuyen = (who: any, muc: number) => {
      const { sid } = hvMoi();
      conn.prepare('UPDATE learning_cycles SET target_score = 6.5 WHERE student_id = ?').run(sid);
      conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE student_id = ?`).run(sid);   // không còn Case dở → không cần bàn giao
      studentsSvcR.transferStudent(who, sid, classId('MB FT 102'), TODAY, 'Đổi lịch học', { noNote: true, mucTieu: muc });
      return (conn.prepare(`SELECT target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).target_score;
    };
    assert(maLoi(() => chuyen(P.coreTeacher, 8.5)) === 403, 'GVCN không còn tự chuyển lớp — phải 403');
    const ql = chuyen(P.mbManager, 8);
    assert(ql === 8, `QL → ${ql}`);
  });
}

/** Khối 11 — soi BỘ DEMO ngay sau khi dựng (mục 0 của run.ts, trước mọi phép kiểm ghi thêm). */
export async function runPrDuyetDemoTests(t: YThucTestKit) {
  const { check, assert, P, conn } = t;
  const yc: any = await import('../duyet/yeuCau.ts');
  check('DUYET (11) · Demo: hộp QL MB có thẻ Học thuật · Thông tin HV · Báo QL, ≥ 1 quá hạn, ≥ 1 tự đóng, ≥ 1 tự duyệt được; Hà có thẻ đã duyệt + bị từ chối', () => {
    const hop = yc.hopChoDuyet(P.mbManager);
    for (const k of ['hoc-thuat', 'thong-tin-hv']) assert(hop.dem[k] >= 1, `thiếu phân loại ${k}: ${JSON.stringify(hop.dem)}`);
    /* PR-YT4 (K1-55): chip Ý thức có đề xuất WL 3 của Lương Gia Bảo; Báo QL có Ý thức quá hạn. // PR-GVb (J5b): Báo QL tách khỏi tab Chờ duyệt → tab Để QL biết */
    assert(hop.dem['y-thuc'] >= 1 && yc.hopChoDuyet(P.mbManager, { xem: 'de-biet' }).the.some((x: any) => x.loai === 'bao_len_y_thuc'), `Ý thức / Báo QL Ý thức: ${JSON.stringify(hop.dem)}`);
    assert(hop.the.some((x: any) => x.hanDuyet && x.hanDuyet < t.TODAY && x.kieuNut !== 'nhac'), 'không có thẻ quá hạn');
    assert(hop.the.some((x: any) => x.loai === 'xin_y_kien'), 'không có Xin ý kiến');
    assert(hop.the.some((x: any) => x.nguoiXinId === P.mbManager.userId), 'không có thẻ QL tự gửi');
    assert(hop.the.some((x: any) => x.tieuDe === 'Đề xuất sửa Target 6.5 → 7.0'), 'không có Đề xuất sửa Target 6.5 → 7.0 (OV-11d: chữ Target viết hoa)');
    const daXuLy = yc.hopChoDuyet(P.mbManager, { xem: 'da-xu-ly' }).the;
    assert(daXuLy.some((x: any) => x.trangThai === 'tu_dong'), 'không có thẻ tự đóng');
    const ha = (conn.prepare(`SELECT id FROM users WHERE full_name = 'Trần Ngọc Hà'`).get() as any).id;
    const cuaHa = yc.yeuCauCuaToi({ ...P.coreTeacher, userId: ha }).the.map((x: any) => x.trangThai);
    assert(cuaHa.includes('duyet') && cuaHa.includes('tu_choi') && cuaHa.includes('cho'), cuaHa.join());
  });
}
