/**
 * PHÉP KIỂM PR-OV11f — Tổng quan · chuông · thanh đầu: số ở ô = nơi nó mở, chuông chỉ việc còn mở (kế hoạch 2026-10-14-pr-ov11f, đặc tả rà soát cuối
 * mục 3 Q5, Q9). Gọi ở khối 0 run.ts (so số bộ demo, như OV-11c); MỌI phép kiểm chạy trong `thu` (cuộn lại).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11fTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const tongQuan: any = await import('../worklist/tongQuan.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const thongBao: any = await import('../platform/thongBao.ts');
  const nav: any = await import('../platform/nav.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV11f · Tổng quan · chuông · thanh đầu');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } catch (e) {
      if (e instanceof TypeError) e.message += ` @ ${String(e.stack).split('\n').slice(1, 4).map((x) => x.trim()).join(' | ')}`;
      throw e;
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const vai = (key: string) => loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`, key).id);
  const maLoi = (fn: () => unknown) => { try { fn(); } catch (e: any) { return e?.status ?? -1; } return 0; };
  const em = (ten: string) => one('SELECT id FROM students WHERE full_name = ?', ten)?.id as number | undefined;

  check('OV11f-1 · /tong-quan/quan-ly chỉ cho người làm việc của QL: TVV / CX / Admin → 403, QL 200; Điểm đáng chú ý giữ cho CX', () => thu(() => {
    for (const k of ['consultant', 'cx', 'office_admin']) assert(maLoi(() => tongQuan.tongQuanQuanLy(vai(k), {})) === 403, `${k} vẫn đọc được Cần xử lý của QL`);
    assert(maLoi(() => tongQuan.tongQuanQuanLy(P.mbManager, {})) === 0, 'QL phải đọc được');
    assert(maLoi(() => tongQuan.diemChuY(vai('cx'), { ct: 'ft' })) === 0, 'CX vẫn xem Điểm đáng chú ý');
  }));

  check('OV11f-2 · dòng "lớp cần Chốt lộ trình" mở Lộ trình tiếp theo (?viec=lo-trinh-ca-lop), dòng phụ "n em …" không chữ "thiếu"', () => thu(() => {
    const r = metrics.metricResponse(metrics.metricSet(P.mbManager, 'lop-chua-chot-len-ft', {}), true);
    assert(r.rows.length > 0, 'demo phải có lớp cần Chốt lộ trình');
    for (const x of r.rows) assert(x.href === `/hoc-vien/lop/${x.id}?viec=lo-trinh-ca-lop` && /em/.test(x.sub) && !/thiếu/.test(x.sub), JSON.stringify(x));
    /* "Lớp thiếu GV môn" giữ dòng cũ (Sửa phân công). */
    const t2 = metrics.metricResponse(metrics.metricSet(P.mbManager, 'lop-thieu-gv-mon', {}), true);
    assert(t2.rows.every((x: any) => x.href.endsWith('?viec=phan-cong')), JSON.stringify(t2.rows));
    /* PA chưa có Kết quả: nút mở Công việc lọc đúng loại việc. */
    const pa = tongQuan.tongQuanQuanLy(P.mbManager, {}).canXuLy.find((x: any) => x.metricId === 'pa-can-cap-nhat');
    if (pa) assert(/loai=ghi_ket_qua_pa/.test(pa.den ?? ''), pa.den);
  }));

  check('OV11f-3 · chuông Cần làm chỉ việc còn mở: tín hiệu đã vào Case → Để biết, mở đúng Case; Báo PH qua TVV có đường tới tab Phối hợp', () => thu(() => {
    const gv = P.coreTeacher;
    const ds = thongBao.thongBaoCua(gv.userId) as any[];
    const tin = ds.filter((n) => n.entity_type === 'case_signal');
    assert(tin.length, 'demo phải có chuông tín hiệu của GVCN');
    for (const n of tin) {
      const st = one('SELECT status, case_id FROM case_signals WHERE id = ?', n.entity_id);
      if (st.status !== 'pending') assert(n.con_viec === 0 && d.nhomThongBao(n) === 'de-biet', `tín hiệu ${n.entity_id} (${st.status}) còn ở Cần làm`);
      if (st.case_id) assert(new RegExp(`case=${st.case_id}`).test(d.duongThongBao(n) ?? ''), `tín hiệu ${n.entity_id} không mở Case ${st.case_id}: ${d.duongThongBao(n)}`);
    }
    const ph = ds.filter((n) => n.kind === 'phoi_hop');
    assert(ph.length, 'demo phải có chuông Báo phụ huynh qua TVV');
    for (const n of ph) assert(/tab=y-thuc/.test(d.duongThongBao(n) ?? '') && /sub=phoi-hop/.test(d.duongThongBao(n) ?? ''), `phoi_hop không có đường: ${d.duongThongBao(n)}`);
    /* Đánh dấu xong việc phối hợp → chuông rời Cần làm. */
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'done' WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`).run(ph[0].entity_id);
    const sau = (thongBao.thongBaoCua(gv.userId) as any[]).find((n) => n.id === ph[0].id);
    assert(sau.con_viec === 0 && d.nhomThongBao(sau) === 'de-biet', 'Báo PH đã làm vẫn ở Cần làm');
  }));

  check('OV11f-4 · SOS khung Fast Track chỉ tính lượt của lộ trình FT đang chạy — em vừa lên FT (Final lớp thường cũ) không vào', () => thu(() => {
    const minh = em('Chu Nhật Minh');
    assert(minh, 'demo phải có Chu Nhật Minh');
    for (const id of ['hv-sos-hien-tai', 'hv-duoi-ky-vong-mon']) {
      const r = metrics.metricSet(P.mbManager, id, { program: 'ft' });
      assert(!r.ids.includes(minh), `${id} khung FT còn đếm Chu Nhật Minh`);
    }
  }));

  check('OV11f-5 · "Dưới kỳ vọng" bỏ lượt em KCK (tử và mẫu, như Phân tích Q29-1)', () => thu(() => {
    const r0 = metrics.metricSet(P.mbManager, 'hv-duoi-ky-vong-mon', { program: 'ft' });
    const sid = r0.ids[0];
    assert(sid, 'demo phải có em FT dưới kỳ vọng');
    conn.prepare(`UPDATE learning_cycles SET khong_cam_ket = 1 WHERE student_id = ? AND status = 'active'`).run(sid);
    /* OV-11e (Q8): KCK theo lượt — lượt đã chốt giữ dấu lúc chốt; em KCK ngay lúc chốt thì dấu trên lượt cũng là KCK. */
    conn.prepare(`UPDATE assessment_attempts SET kck_at_attempt = 1 WHERE student_id = ? AND kck_at_attempt IS NOT NULL`).run(sid);
    xoaNho();
    const r1 = metrics.metricSet(P.mbManager, 'hv-duoi-ky-vong-mon', { program: 'ft' });
    assert(!r1.ids.includes(sid) && !r1.denominatorIds.includes(sid), 'em KCK còn trong Dưới kỳ vọng');
  }));

  check('OV11f-6 · "xong MT{n}, chưa có MT kế" = đủ điểm bắt buộc (cùng nghĩa Kế hoạch Test)', () => thu(() => {
    const r = metrics.metricSet(P.mbManager, 'hv-ft-xong-mt-cuoi-chua-mt-ke', {});
    for (const sid of r.ids) {
      const xong = one(`SELECT 1 x FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
        WHERE a.student_id = ? AND a.kind = 'mock' AND a.status = 'done' LIMIT 1`, sid);
      assert(xong, `em ${sid} chưa có lượt MT đủ điểm mà vẫn "xong"`);
    }
    const anh = em('Lương Bảo Anh');
    if (anh) assert(!r.ids.includes(anh), 'Lương Bảo Anh (MT3 mới 2/4 kỹ năng) không được tính "xong MT3"');
  }));

  check('OV11f-7 · QL kiêm TVV ở vai gốc: nav không bật "Học viên của tôi" (giữ Tổng quan QL); chỉ TVV thì bật', () => thu(() => {
    const tvv = vai('consultant');   // TVV thuần — lấy trước khi QL nhận thêm vai TVV
    const tv = one(`SELECT id FROM roles WHERE key = 'consultant'`).id;
    const ql = P.mbManager;
    const cn = one(`SELECT branch_id b FROM user_roles WHERE user_id = ? AND branch_id IS NOT NULL LIMIT 1`, ql.userId).b;
    conn.prepare(`INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?, ?, ?, 'active', ?)`).run(ql.userId, tv, cn, new Date().toISOString());
    assert(nav.navOf(loadPrincipal(ql.userId)).hvCuaToi === false, 'QL kiêm TVV ở vai gốc mất Tổng quan QL');
    assert(nav.navOf(tvv).hvCuaToi === true, 'TVV phải có Học viên của tôi');
  }));

  check('OV11f-8 · chuông theo vai đang chọn: thông báo mở trang vai đó không vào được → không mở được (ẩn ở góc nhìn, không đánh dấu đọc)', () => {
    const gv = { work: true, workSupport: true, workApprove: false, admin: false, test: true, analysis: false };
    assert(!d.moDuocThongBao({ entity_type: 'yeu_cau_duyet', entity_id: 1, kind: 'duyet_moi', student_id: null, attempt_id: null }, gv), 'thẻ Chờ duyệt mở được ở vai GV');
    assert(!d.moDuocThongBao({ entity_type: 'user', entity_id: 1, kind: 'dang_ky', student_id: null, attempt_id: null }, gv), 'Quản trị mở được ở vai GV');
    assert(d.moDuocThongBao({ entity_type: 'sos_case', entity_id: 1, kind: 'sos', student_id: 3, attempt_id: null }, gv), 'hồ sơ HV phải mở được');
    assert(d.moDuocThongBao({ entity_type: 'yeu_cau_duyet', entity_id: 1, kind: 'duyet_moi', student_id: null, attempt_id: null }, { ...gv, workApprove: true }), 'QL mở được Chờ duyệt');
  });

  void TODAY;
}
