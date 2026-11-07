/**
 * PHÉP KIỂM SUA-LUU-TRU c (chủ SP 07/11, plan.md mục 4 việc 3, 4 — nút "Đổi" bước tiếp): chọn lại tại chỗ = POST sẵn có (máy chủ hoàn tác lựa chọn cũ
 * + làm mới trong MỘT giao dịch), áp cả em đã lưu trữ — không sinh lộ trình / ghi danh thừa (đếm `learning_cycles`, `enrollments` trước / sau).
 * Hoàn tác ngay sau Đổi = về LỰA CHỌN CŨ (không về "chờ chọn"); HOTFIX-MO-KHOA: Đổi luôn làm được (đi thẳng khi không hoàn tác chính xác được).
 */
export async function runPrSuaLuuTruCTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const bt: any = await import('../loTrinh/buocTiep.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { mondayOf } = await import('../platform/week.ts');
  console.log('\nSUA-LUU-TRU c — Đổi bước tiếp tại chỗ (cả em đã lưu trữ) · Hoàn tác về lựa chọn cũ');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const dem = (sid: number) => ({
    lt: get('SELECT COUNT(*) n FROM learning_cycles WHERE student_id = ?', sid).n as number,
    gd: get('SELECT COUNT(*) n FROM enrollments WHERE student_id = ?', sid).n as number,
  });
  const em = (sid: number) => get('SELECT status, archived_at FROM students WHERE id = ?', sid);
  const chon = (cy: number) => get('SELECT buoc_tiep FROM learning_cycles WHERE id = ?', cy).buoc_tiep;
  /** Em FT đang học ở MB, lộ trình FT đang chạy — nhập KQ thi thật trượt (Target 7). */
  const emThiTruot = (desc = false) => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy, e.class_id FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
          AND cy.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = s.id)
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id ${desc ? 'DESC' : ''} LIMIT 1`);
    assert(r, 'seed cần em FT MB đang học');
    conn.prepare('UPDATE learning_cycles SET target_score = 7, khong_cam_ket = 0 WHERE id = ?').run(r.cy);
    thiThat.datKetQuaThiThat(QL, r.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    xoaNho();
    return r as { sid: number; cy: number; class_id: number };
  };

  check('SLT-c1 · trượt → Kết thúc học (lưu trữ) → sửa điểm đạt → Đổi sang Lộ trình mới → Đổi lại Kết thúc: số lộ trình / ghi danh đúng, không thừa', () => thu(() => {
    const x = emThiTruot();
    const goc = dem(x.sid);
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    const sauKt = dem(x.sid);
    assert(em(x.sid).status === 'finished' && em(x.sid).archived_at && JSON.stringify(sauKt) === JSON.stringify(goc), `Kết thúc: ${JSON.stringify(em(x.sid))} ${JSON.stringify(sauKt)}`);
    thiThat.datKetQuaThiThat(QL, x.cy, { l: 8, r: 8, w: 8, s: 8 });
    xoaNho();
    assert(bt.trangThaiBuocTiep(QL, x.cy).kqDaDoi === true, 'chưa nhắc kết quả đổi');
    const r = bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    assert(r.chon === 'lo_trinh_moi' && r.kqDaDoi === false, `đổi: ${JSON.stringify({ chon: r.chon, kq: r.kqDaDoi })}`);
    const sauMoi = dem(x.sid);
    assert(sauMoi.lt === goc.lt + 1 && sauMoi.gd === goc.gd && em(x.sid).status === 'active' && !em(x.sid).archived_at, `Lộ trình mới (Lớp này): +1 lộ trình, ghi danh cũ mở lại: ${JSON.stringify({ goc, sauMoi, em: em(x.sid) })}`);
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    const lai = dem(x.sid);
    assert(JSON.stringify(lai) === JSON.stringify(goc) && em(x.sid).status === 'finished' && em(x.sid).archived_at, `đổi lại Kết thúc: ${JSON.stringify({ goc, lai, em: em(x.sid) })}`);
  }));

  check('SLT-c2 · Hoàn tác ngay sau Đổi → về LỰA CHỌN CŨ (không về chờ chọn), số liệu như trước Đổi; Hoàn tác lần nữa → chờ chọn', () => thu(() => {
    const x = emThiTruot();
    const goc = dem(x.sid);
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc', lyDo: 'Thôi sau thi' });
    bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    const h = bt.boChonBuocTiep(QL, x.cy);
    assert(h.chon === 'ket_thuc' && chon(x.cy) === 'ket_thuc', `hoàn tác Đổi: ${h.chon}`);
    assert(JSON.stringify(dem(x.sid)) === JSON.stringify(goc) && em(x.sid).status === 'finished' && em(x.sid).archived_at, `về Kết thúc: ${JSON.stringify({ goc, nay: dem(x.sid), em: em(x.sid) })}`);
    const h2 = bt.boChonBuocTiep(QL, x.cy);
    assert(h2.chon === null && em(x.sid).status === 'active' && !em(x.sid).archived_at, `hoàn tác lần 2: ${h2.chon} ${JSON.stringify(em(x.sid))}`);
  }));

  check('SLT-c2b · Hoàn tác về lựa chọn cũ giữ dấu kết quả LÚC CHỌN (vẫn nhắc "Kết quả đã đổi") + Hành trình ghi "hoàn tác"', () => thu(() => {
    const x = emThiTruot();
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    thiThat.datKetQuaThiThat(QL, x.cy, { l: 8, r: 8, w: 8, s: 8 });
    bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    xoaNho();
    const h = bt.boChonBuocTiep(QL, x.cy);
    assert(h.chon === 'ket_thuc' && h.kqDaDoi === true, `về Kết thúc phải còn nhắc: ${JSON.stringify({ chon: h.chon, kq: h.kqDaDoi })}`);
    assert(get(`SELECT 1 FROM journey_events WHERE cycle_id = ? AND title LIKE 'Sau thi: hoàn tác%'`, x.cy), 'Hành trình không ghi hoàn tác');
  }));

  check('SLT-c3 · em Tạm dừng sau thi → Đổi sang Kết thúc học → Hoàn tác về Tạm dừng; không lộ trình / ghi danh thừa', () => thu(() => {
    const x = emThiTruot();
    const goc = dem(x.sid);
    bt.chonBuocTiep(QL, x.cy, { chon: 'tam_dung' });
    assert(em(x.sid).status === 'inactive', 'chưa Tạm dừng');
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    assert(em(x.sid).status === 'finished' && em(x.sid).archived_at && JSON.stringify(dem(x.sid)) === JSON.stringify(goc), `Kết thúc: ${JSON.stringify(em(x.sid))}`);
    bt.boChonBuocTiep(QL, x.cy);
    assert(chon(x.cy) === 'tam_dung' && em(x.sid).status === 'inactive' && JSON.stringify(dem(x.sid)) === JSON.stringify(goc), `về Tạm dừng: ${chon(x.cy)} ${JSON.stringify(em(x.sid))}`);
  }));

  check('SLT-c4 · lệnh chuyển lớp chờ (Lộ trình mới lớp khác, tuần sau) → Đổi sang Kết thúc: lệnh huỷ, không lệnh thừa; lệnh đã chạy → vẫn Đổi được (đi thẳng)', () => thu(() => {
    const x = emThiTruot(true);
    const tuanSau = new Date(Date.parse(mondayOf(TODAY)) + 7 * 864e5).toISOString().slice(0, 10);
    const lopKhac = (conn.prepare(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id AND b.code = 'MB' WHERE c.is_fast_track = 1 AND c.status = 'active' AND c.id != ? ORDER BY c.id`).all(x.class_id) as any[])
      .map((r) => r.id).find((id: number) => !bt.xemTruocLoTrinhMoi(QL, x.cy, { lopMoiId: id, batDau: tuanSau }).loi);
    assert(lopKhac, 'seed cần lớp FT MB khác hợp loại');
    bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi', lopMoiId: lopKhac, batDau: tuanSau });
    const lenh = get(`SELECT id, trang_thai FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, x.sid);
    assert(lenh?.trang_thai === 'cho', `tiền đề lệnh chờ: ${JSON.stringify(lenh)}`);
    assert(bt.trangThaiBuocTiep(QL, x.cy).hoanTacDuoc === true, 'lệnh chờ vẫn hoàn tác được');
    const goc = dem(x.sid);
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    assert(get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', lenh.id).trang_thai !== 'cho', 'lệnh chờ còn sau Đổi');
    assert(!get(`SELECT 1 FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, x.sid) && JSON.stringify(dem(x.sid)) === JSON.stringify(goc), 'lệnh / ghi danh thừa');
    /* Lệnh đã chạy (chuyển lớp không hoàn tác): khoá Đổi + lý do; gọi thẳng → 409 nói rõ. */
    bt.boChonBuocTiep(QL, x.cy);   // về Lộ trình mới (lệnh mới chờ)
    const l2 = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, x.sid);
    assert(l2, 'hoàn tác không ra lại lệnh chờ');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'da_chuyen' WHERE id = ?`).run(l2.id);
    const g = JSON.parse(get('SELECT buoc_tiep_json FROM learning_cycles WHERE id = ?', x.cy).buoc_tiep_json);
    if (g.lenhId !== l2.id) conn.prepare('UPDATE learning_cycles SET buoc_tiep_json = ? WHERE id = ?').run(JSON.stringify({ ...g, lenhId: l2.id }), x.cy);
    xoaNho();
    assert(bt.trangThaiBuocTiep(QL, x.cy).hoanTacDuoc === false, 'lệnh đã chạy: không hoàn tác chính xác được');
    const r = bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    assert(r.chon === 'ket_thuc' && em(x.sid).status === 'finished', `HOTFIX-MO-KHOA: lệnh đã chạy vẫn Đổi được (đi thẳng): ${r.chon}`);
  }));
}
