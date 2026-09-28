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
    assert(d.nhanTrangThaiYc('duyet', true).chu.includes('tự duyệt') && d.nhanTrangThaiYc('tu_choi').t === 'da-huy'
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
  check('DUYET (2) · migrate hai lần: lần hai không thêm thẻ; PA chờ đều có thẻ, PA huỷ/Case đóng không; chạy thử chỉ đọc', () => {
    const dem = () => (conn.prepare('SELECT COUNT(*) n FROM yeu_cau_duyet').get() as any).n as number;
    const lan1: string[] = []; mig.migratePrDuyet(conn, lan1);
    const sau1 = dem();
    const lan2: string[] = []; mig.migratePrDuyet(conn, lan2);
    assert(dem() === sau1 && lan2.length === 0, `lần hai: ${sau1} → ${dem()} · ${lan2.join(' · ')}`);
    const thieu = conn.prepare(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.approval_state = 'pending' AND iv.status != 'cancelled' AND sc.status != 'done'
        AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'de_xuat_pa' AND y.doi_tuong_id = iv.id AND y.trang_thai = 'cho')`).all() as any[];
    assert(thieu.length === 0, `PA chờ thiếu thẻ: ${thieu.map((x) => x.id).join(',')}`);
    const thua = conn.prepare(`SELECT y.id FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id
      JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE y.loai = 'de_xuat_pa' AND y.trang_thai = 'cho' AND (iv.status = 'cancelled' OR sc.status = 'done')`).all() as any[];
    assert(thua.length === 0, `thẻ của PA huỷ/Case đóng: ${thua.map((x) => x.id).join(',')}`);
    const doiThieu = (conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests r WHERE r.status = 'pending'
      AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'lich_thi' AND y.doi_tuong_id = r.id AND y.trang_thai = 'cho')`).get() as any).n;
    assert(doiThieu === 0, `đề nghị dời thiếu thẻ: ${doiThieu}`);
    const kh = mig.keHoachDuyet(conn);
    assert(kh.mauPa.length === 0 && kh.mauDoi.length === 0 && typeof kh.gvcnMatQuyen === 'number' && dem() === sau1, 'chạy thử sau migrate: 0 thẻ mới, không ghi');
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
      assert(kq.length === 1 && /đã duyệt/.test(kq[0].title), JSON.stringify(kq));
      assert(maLoi(() => yc.duyetYeuCau(P.cpManager, tao())) === 403, 'QL CP duyệt thẻ MB');
      assert(maLoi(() => yc.duyetYeuCau(P.coreTeacher, tao())) === 403, 'GVCN duyệt');
    });
    check('DUYET (3) · từ chối thiếu lý do → 400; có lý do → tu_choi; trả lời thẻ Duyệt → 400; duyệt hàng loạt báo riêng thẻ lỗi; câu lỗi không lộ mã', () => {
      const id = tao();
      assert(maLoi(() => yc.tuChoiYeuCau(P.mbManager, id, '  ')) === 400 && maLoi(() => yc.tuChoiYeuCau(P.mbManager, id, 'ab')) === 400, 'thiếu lý do');
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
    assert(tren && tren.tieuDe.startsWith('Đề xuất PA · Listening') && tren.dong[0].includes('Tutor 1-1') && tren.neuDuyet?.includes('hết T2')
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
    assert(iv.status === 'started' && iv.approval_state === 'approved' && iv.action_due === d.weeklyUpdateDue(TODAY), JSON.stringify(iv));
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
}
