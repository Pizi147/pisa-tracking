/**
 * PHÉP KIỂM LOP-TRONG (chủ SP 07/11, plan.md mục 4 "Nút ⋯ hồ sơ lớp + LỚP TRỐNG TỰ LƯU TRỮ"): lớp 0 HV đang học, không kế hoạch nhận HV,
 * liên tục 7 ngày → tự Kết thúc lớp (đúng hàm `ketThucLop`), lịch sử "Tự động — lớp trống 7 ngày"; Mở lại lớp như cũ, đếm lại 7 ngày từ lúc mở lại.
 */
export async function runPrLopTrongTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; addDays: (d: string, n: number) => string }) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const { dongLopTrong, NGAY_LOP_TRONG } = await import('../classes/xoaKetThucLop.ts');
  const xoaKetThuc: any = await import('../classes/xoaKetThucLop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLOP-TRONG — lớp trống 7 ngày tự vào Lưu trữ');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  /** Một lớp đang chạy có em đang học → mọi em rời lớp ngày `roi` (như chuyển hết đi). */
  const lopTrong = (roi: string): number => {
    const id = get(`SELECT c.id FROM classes c WHERE c.status = 'active' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') ORDER BY c.id LIMIT 1`).id as number;
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE class_id = ? AND status IN ('active', 'paused')`).run(id);
    conn.prepare('UPDATE enrollments SET ended_at = ? WHERE class_id = ?').run(roi, id);   // em cuối rời lớp ngày `roi`
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE lop_dich_id = ? AND trang_thai = 'cho'`).run(id);
    conn.prepare(`UPDATE lo_trinh_tiep_theo SET da_ap_dung_luc = ? WHERE lop_du_kien_id = ? AND da_ap_dung_luc IS NULL`).run(roi, id);
    conn.prepare(`UPDATE learning_cycles SET buoc_tiep_hen = NULL WHERE buoc_tiep_hen IS NOT NULL`).run();
    return id;
  };
  const trangThai = (id: number) => get('SELECT status, finished_at FROM classes WHERE id = ?', id);

  check('LT-1 · hằng 7 ngày', () => assert(NGAY_LOP_TRONG === 7, String(NGAY_LOP_TRONG)));

  check('LT-2 · trống 6 ngày: không đóng · 7 ngày: đóng, vào Lưu trữ, nhật ký Hệ thống "Tự động — lớp trống 7 ngày"', () => thu(() => {
    const id = lopTrong(addDays(TODAY, -6));
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'active', '6 ngày đã đóng');
    conn.prepare(`UPDATE enrollments SET ended_at = ? WHERE class_id = ?`).run(addDays(TODAY, -7), id);
    const kq = dongLopTrong(TODAY);
    assert(trangThai(id).status === 'finished' && trangThai(id).finished_at === TODAY, JSON.stringify(trangThai(id)));
    assert(kq.includes(id), JSON.stringify(kq));
    const a = get(`SELECT actor_user_id, after_json FROM audit_logs WHERE action = 'class.finished' AND entity_id = ? ORDER BY id DESC LIMIT 1`, id);
    assert(a && a.actor_user_id === null && JSON.parse(a.after_json).lyDo === 'Tự động — lớp trống 7 ngày', JSON.stringify(a));
  }));

  check('LT-3 · có kế hoạch nhận HV → không đóng: lệnh chuyển ĐẾN chờ · hẹn bắt đầu về lớp · em Tạm dừng giữ chỗ · lớp chưa từng có em', () => thu(() => {
    const id = lopTrong(addDays(TODAY, -30));
    const em = get('SELECT student_id FROM enrollments WHERE class_id = ? LIMIT 1', id).student_id;
    const nguon = get(`SELECT id FROM classes WHERE id <> ? ORDER BY id LIMIT 1`, id).id;
    /* (a) lệnh chuyển vào chờ */
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE student_id = ? AND trang_thai = 'cho'`).run(em);
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, tuan_bat_dau, boi_canh, trang_thai, nguoi_ra_lenh, ngay_ra_lenh, tao_luc)
      VALUES (?, ?, ?, 'len_lop', ?, 'giua-khoa', 'cho', ?, ?, ?)`).run(em, nguon, id, addDays(TODAY, 7), P.admin.userId, TODAY, TODAY);
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'active', 'lệnh chờ vẫn đóng');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE lop_dich_id = ?`).run(id);
    /* (b) hẹn bắt đầu Lộ trình mới về lớp */
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1', em).id;
    conn.prepare(`UPDATE learning_cycles SET buoc_tiep = 'lo_trinh_moi', buoc_tiep_hen = ?, buoc_tiep_json = ? WHERE id = ?`).run(addDays(TODAY, 14), JSON.stringify({ lopMoiId: id }), cy);
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'active', 'hẹn về lớp vẫn đóng');
    conn.prepare('UPDATE learning_cycles SET buoc_tiep_hen = NULL WHERE id = ?').run(cy);
    /* (c) em Tạm dừng (ghi danh paused) */
    conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE id = (SELECT id FROM enrollments WHERE class_id = ? LIMIT 1)`).run(id);
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'active', 'em tạm dừng vẫn đóng');
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE class_id = ?`).run(id);
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'finished', 'hết kế hoạch mà không đóng');
    /* (d) lớp mới chưa từng có em (chờ khai giảng) không bao giờ tự đóng */
    const moi = get(`SELECT c.id FROM classes c WHERE c.status = 'active' AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id) LIMIT 1`)?.id;
    if (moi) { dongLopTrong(addDays(TODAY, 365)); assert(trangThai(moi).status === 'active', 'lớp chưa có em bị đóng'); }
  }));

  check('LT-4 · Mở lại lớp được; đếm lại 7 ngày từ lúc mở lại (không đóng lại ngay hôm sau)', () => thu(() => {
    const id = lopTrong(addDays(TODAY, -20));
    dongLopTrong(TODAY);
    assert(trangThai(id).status === 'finished', 'tiền đề');
    xoaKetThuc.moLaiLop(P.admin, id, { lyDo: 'Còn nhận em' });
    assert(trangThai(id).status === 'active', 'mở lại');
    conn.prepare(`UPDATE audit_logs SET created_at = ? WHERE action = 'class.reopened' AND entity_id = ?`).run(`${TODAY}T08:00:00.000Z`, id);
    dongLopTrong(addDays(TODAY, 6));
    assert(trangThai(id).status === 'active', 'mở lại 6 ngày đã đóng');
    dongLopTrong(addDays(TODAY, 7));
    assert(trangThai(id).status === 'finished', 'mở lại 7 ngày vẫn trống mà không đóng');
  }));

  check('LT-5 · quét một lần mỗi ngày: lần hai cùng ngày không quét, sang ngày quét', () => thu(() => {
    const { quetLopTrong } = xoaKetThuc;
    conn.prepare(`DELETE FROM moc_he_thong WHERE khoa = 'quet:lop-trong'`).run();
    assert(quetLopTrong(TODAY) === true, 'lần đầu phải quét');
    xoaNho();
    assert(quetLopTrong(TODAY) === false, 'lần hai cùng ngày vẫn quét');
    xoaNho();
    assert(quetLopTrong(addDays(TODAY, 1)) === true, 'sang ngày không quét');
  }));
}
