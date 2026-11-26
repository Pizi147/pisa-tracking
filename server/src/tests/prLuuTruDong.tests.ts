/**
 * LUU-TRU-DONG (chủ SP 26/11): em vào Lưu trữ → việc còn mở đóng hẳn (Case / PA khi Tạm dừng, Phối hợp, Báo PH, Tình hình, Trả lại); Quay lại học không mở lại;
 * Hoàn tác Tạm dừng / Kết thúc học trả đúng; Chọn bước tiếp không còn cho em Lưu trữ; migrate đóng việc của em đang Lưu trữ (chạy lại không đổi, khôi phục được).
 * Mỗi ca cuộn lại (SAVEPOINT).
 */
export async function runPrLuuTruDongTests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nLUU-TRU-DONG · vào Lưu trữ đóng hẳn việc của em');
  const studentsSvc: any = await import('../students/students.ts');
  const mig: any = await import('../migrate/prLuuTruDong.ts');
  const { choBuocTiep } = await import('../loTrinh/buocTiep.ts');
  const luat: any = await import('../classes/luatLoTrinh.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (ten: string, fn: () => void) => {
    conn.exec(`SAVEPOINT ${ten}`);
    try { xoaNho(); fn(); } finally { conn.exec(`ROLLBACK TO ${ten}`); conn.exec(`RELEASE ${ten}`); xoaNho(); }
  };
  /* Em đang học có Case mở; thêm một việc mở mỗi loại (Phối hợp, Báo PH, Tình hình, Trả lại) để thấy đủ. */
  const em = get(`SELECT s.id, (SELECT MIN(c.id) FROM sos_cases c WHERE c.student_id = s.id AND c.status != 'done') AS ca,
      (SELECT e.class_id FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) AS lop,
      (SELECT MIN(a.id) FROM assessment_attempts a WHERE a.student_id = s.id) AS luot
    FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL
      AND EXISTS (SELECT 1 FROM sos_cases c WHERE c.student_id = s.id AND c.status != 'done')
      AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active')
      AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.student_id = s.id) ORDER BY s.id LIMIT 1`);
  assert(em, 'seed: cần em đang học có Case mở');
  const now = new Date().toISOString();
  const taoViec = () => ({
    ph: Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at, updated_at) VALUES (?, ?, 'bao_ph_tvv', 'pending', ?, ?)`).run(em.luot, em.id, now, now).lastInsertRowid),
    bp: Number(conn.prepare(`INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc) VALUES (?, 'thử', ?, 'mo', ?)`).run(em.id, TODAY, now).lastInsertRowid),
    th: Number(conn.prepare(`INSERT INTO tinh_hinh_hoc_tap (student_id, class_id, chieu, noi_dung, nguoi_gui, tao_luc, han, trang_thai) VALUES (?, ?, 'tvv_gvcn', 'thử', ?, ?, ?, 'mo')`)
      .run(em.id, em.lop, P.admin.userId, now, TODAY).lastInsertRowid),
    tl: Number(conn.prepare(`INSERT INTO vi_pham_tra_lai (student_id, violation_id, ly_do, nguoi_tra, tra_luc, han, trang_thai) VALUES (?, (SELECT MIN(id) FROM violations), 'thử', ?, ?, ?, 'mo')`)
      .run(em.id, P.admin.userId, now, TODAY).lastInsertRowid),
  });
  const trangThai = (v: ReturnType<typeof taoViec>) => [
    get('SELECT status FROM sos_cases WHERE id = ?', em.ca).status,
    get('SELECT status FROM sos_coordination_actions WHERE id = ?', v.ph).status,
    get('SELECT trang_thai AS t FROM viec_bao_ph WHERE id = ?', v.bp).t,
    get('SELECT trang_thai AS t FROM tinh_hinh_hoc_tap WHERE id = ?', v.th).t,
    get('SELECT trang_thai AS t FROM vi_pham_tra_lai WHERE id = ?', v.tl).t,
  ].join(',');
  const MO = (ca: string) => `${ca},pending,mo,mo,mo`;

  check('LT-1 · Tạm dừng → đóng Case + Phối hợp + Báo PH + Tình hình + Trả lại; Quay lại học KHÔNG mở lại', () => thu('lt1', () => {
    const v = taoViec();
    const ca0 = get('SELECT status FROM sos_cases WHERE id = ?', em.ca).status;
    assert(trangThai(v) === MO(ca0), `tiền đề: ${trangThai(v)}`);
    studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', TODAY, 'Tạm nghỉ');
    assert(trangThai(v) === 'done,removed,bo,rut,rut', `Tạm dừng: ${trangThai(v)}`);
    assert(get('SELECT system_close_reason AS r FROM sos_cases WHERE id = ?', em.ca).r === 'luu_tru', 'lý do đóng Case');
    studentsSvc.setStudentStatus(P.admin, em.id, 'active', TODAY, 'Đi học lại');
    assert(trangThai(v) === 'done,removed,bo,rut,rut', `Quay lại học mở lại: ${trangThai(v)}`);
  }));

  check('LT-2 · Hoàn tác Tạm dừng / Hoàn tác Kết thúc học trả đúng việc đã đóng', () => {
    thu('lt2a', () => {
      const v = taoViec();
      const truoc = trangThai(v);
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', TODAY, 'Tạm nghỉ');
      studentsSvc.hoanTacTamDung(P.admin, em.id);
      assert(trangThai(v) === truoc, `Hoàn tác Tạm dừng: ${trangThai(v)} ≠ ${truoc}`);
    });
    thu('lt2b', () => {
      const v = taoViec();
      const truoc = trangThai(v);
      studentsSvc.setStudentStatus(P.admin, em.id, 'finished', TODAY, 'Thôi học');
      assert(trangThai(v) === 'done,removed,bo,rut,rut', `Kết thúc học: ${trangThai(v)}`);
      studentsSvc.hoanTacKetThuc(P.admin, em.id);
      assert(trangThai(v) === truoc, `Hoàn tác Kết thúc học: ${trangThai(v)} ≠ ${truoc}`);
    });
  });

  check('LT-3 · Chọn bước tiếp: em trong Lưu trữ (Tạm dừng) không còn việc', () => thu('lt3', () => {
    const c = choBuocTiep()[0];
    assert(c, 'seed: cần một lộ trình chờ chọn bước tiếp');
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = ? WHERE id = ?`).run(TODAY, c.student_id);
    xoaNho();
    assert(!choBuocTiep().some((x: any) => x.student_id === c.student_id), 'em Tạm dừng vẫn có việc Chọn bước tiếp');
  }));

  check('LT-5 · (rà #2219 P1-2) Tạm dừng cả lớp (Chuyển tiếp) = vào Lưu trữ: archived_at, đóng việc; Hoàn tác Tạm dừng trả lại', () => thu('lt5', () => {
    const v = taoViec();
    const truoc = trangThai(v);
    luat.apDungBaoLuuCaLop(P.admin, { fromClassId: em.lop, ngay: TODAY, dongs: [{ sid: em.id, lyDo: 'Bảo lưu' }] });
    assert(get('SELECT archived_at AS a FROM students WHERE id = ?', em.id).a === TODAY && trangThai(v) === 'done,removed,bo,rut,rut', `Tạm dừng cả lớp: ${trangThai(v)}`);
    studentsSvc.hoanTacTamDung(P.admin, em.id);
    assert(trangThai(v) === truoc && !get('SELECT archived_at AS a FROM students WHERE id = ?', em.id).a, `Hoàn tác: ${trangThai(v)} ≠ ${truoc}`);
  }));

  check('LT-6 · (rà #2219 P2-2) em Tạm dừng trước luật mới, migrate đóng việc → Hoàn tác Tạm dừng trả cả việc migrate đóng', () => thu('lt6', () => {
    studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', TODAY, 'Tạm nghỉ');
    /* Việc mở còn sót sau lần dừng (dữ liệu trước luật mới) — migrate đóng. */
    conn.prepare(`UPDATE sos_cases SET status = 'open', system_close_reason = NULL WHERE id = ?`).run(em.ca);
    const v = taoViec();
    const truoc = trangThai(v);
    assert(mig.dongLuuTruCu(conn).em >= 1 && trangThai(v) === 'done,removed,bo,rut,rut', `migrate: ${trangThai(v)}`);
    studentsSvc.hoanTacTamDung(P.admin, em.id);
    const sau = trangThai(v).split(',').slice(1).join(',');
    assert(sau === truoc.split(',').slice(1).join(','), `Hoàn tác sau migrate: ${trangThai(v)} ≠ ${truoc}`);
  }));

  check('LT-4 · migrate LUU-TRU-DONG: em đang Lưu trữ còn việc mở → đóng; chạy lại không đổi; khôi phục trả lại', () => thu('lt4', () => {
    const v = taoViec();
    const truoc = trangThai(v);
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = ? WHERE id = ?`).run(TODAY, em.id);   // vào Lưu trữ trước luật mới (không qua đường đóng)
    const k = mig.dongLuuTruCu(conn);
    assert(k.em >= 1 && trangThai(v) === 'done,removed,bo,rut,rut', `migrate: ${JSON.stringify(k)} · ${trangThai(v)}`);
    assert(!mig.dongLuuTruCu(conn).em, 'chạy lại còn đóng');
    assert(mig.khoiPhucLuuTruDong(conn).includes(em.id) && trangThai(v) === truoc && !mig.khoiPhucLuuTruDong(conn).length, `khôi phục: ${trangThai(v)}`);
  }));
}
