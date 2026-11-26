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
  const { trangThaiYThuc } = await import('../yThuc/trangThai.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const signals: any = await import('../cases/signals.ts');
  const ngay = (n: number) => conn.prepare(`SELECT date(?, ?) d`).get(TODAY, `${n} day`).d as string;
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

  /* PR 4 (chủ SP 26/11): vi phạm chưa xử lý ghi TRƯỚC lần quay lại học thật gần nhất dừng hẳn; vi phạm mới sau đó tính như thường; Hoàn tác trả đủ. */
  const taoVp = (reported: string) => Number(conn.prepare(`INSERT INTO violations (student_id, category, occurred_on, reported_on, reported_by, description, yeu_cau_xu_ly, created_at)
      VALUES (?, 'khac', ?, ?, ?, 'thử', 1, ?)`).run(em.id, reported, reported, P.admin.userId, now).lastInsertRowid);
  const vpT = (id: number) => { xoaNho(); return trangThaiYThuc([em.id]).get(em.id)!.viPham.get(id)!; };
  const BAT_BUOC = new Set(['can_xu_ly', 'qua_han']);

  check('LT-7 · vi phạm chưa xử lý trước lần Tạm dừng → Quay lại học: dừng hẳn (không việc, không hạn); vi phạm mới sau đó tính; Hoàn tác Tạm dừng trả đủ', () => {
    thu('lt7a', () => {
      const v = taoVp(ngay(-6));
      assert(BAT_BUOC.has(vpT(v).t), `tiền đề: ${JSON.stringify(vpT(v))}`);
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', ngay(-3), 'Tạm nghỉ');
      studentsSvc.setStudentStatus(P.admin, em.id, 'active', TODAY, 'Quay lại');
      const k = vpT(v);
      assert(k.t === 'da_ghi_nhan' && !k.han && k.nhan === 'Dừng — em vào Lưu trữ', `Quay lại học mở lại vi phạm cũ: ${JSON.stringify(k)}`);
      assert(conn.prepare('SELECT han_xu_ly AS h FROM violations WHERE id = ?').get(v).h == null, 'hạn chốt vi phạm cũ chưa bỏ');
      const moi = taoVp(TODAY);
      assert(BAT_BUOC.has(vpT(moi).t), `vi phạm mới sau quay lại không tính: ${JSON.stringify(vpT(moi))}`);
      xoaNho();
      assert(trangThaiYThuc([em.id]).get(em.id)!.soBatBuoc === 1, 'số bắt buộc phải chỉ còn vi phạm mới');
    });
    thu('lt7c', () => {
      /* Rà #2223 P2-7: Hoàn tác Quay lại (em về Tạm dừng, mốc quay lại xoá) → vi phạm hết "Dừng", về bắt buộc. */
      const v = taoVp(ngay(-6));
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', ngay(-3), 'Tạm nghỉ');
      studentsSvc.setStudentStatus(P.admin, em.id, 'active', TODAY, 'Quay lại');
      studentsSvc.hoanTacQuayLai(P.admin, em.id);
      assert(BAT_BUOC.has(vpT(v).t) && !vpT(v).dung, `Hoàn tác Quay lại: ${JSON.stringify(vpT(v))}`);
    });
    thu('lt7d', () => {
      /* Học lại CÙNG NGÀY với Kết thúc (Lộ trình mới khi đang học) — không là quay lại sau dừng → vi phạm không Dừng. */
      const v = taoVp(ngay(-6));
      studentsSvc.setStudentStatus(P.admin, em.id, 'finished', TODAY, 'Lộ trình mới');
      studentsSvc.hocLai(P.admin, em.id, { date: TODAY, lyDo: 'Lộ trình mới' });
      assert(BAT_BUOC.has(vpT(v).t), `Học lại cùng ngày làm Dừng vi phạm: ${JSON.stringify(vpT(v))}`);
    });
    thu('lt7e', () => {
      /* Rà #2223 P2-5: em Kết thúc học (đang Lưu trữ) — vi phạm chưa xử lý Dừng; Hoàn tác Kết thúc học trả lại. */
      const v = taoVp(ngay(-6));
      studentsSvc.setStudentStatus(P.admin, em.id, 'finished', TODAY, 'Thôi học');
      assert(vpT(v).dung, `em Kết thúc học: ${JSON.stringify(vpT(v))}`);
      studentsSvc.hoanTacKetThuc(P.admin, em.id);
      assert(BAT_BUOC.has(vpT(v).t), `Hoàn tác Kết thúc học: ${JSON.stringify(vpT(v))}`);
    });
    thu('lt7f', () => {
      /* Rà #2223 P2-2: vi phạm ghi trước lần quay lại nhưng GVCN đề xuất xử lý SAU khi quay lại → "Chờ Head duyệt", không Dừng. */
      const v = taoVp(ngay(-6));
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', ngay(-3), 'Tạm nghỉ');
      studentsSvc.setStudentStatus(P.admin, em.id, 'active', TODAY, 'Quay lại');
      const m = Number(conn.prepare(`INSERT INTO discipline_measures (student_id, kind, status, created_at, created_by) VALUES (?, 'report_1', 'cho_duyet', ?, ?)`).run(em.id, now, P.admin.userId).lastInsertRowid);
      conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_at) VALUES (?, ?, ?)').run(m, v, now);
      assert(vpT(v).t === 'cho_duyet' && !vpT(v).dung, `đề xuất sau mốc: ${JSON.stringify(vpT(v))}`);
    });
    thu('lt7g', () => {
      /* Rà #2223 P2-3: đề xuất chờ duyệt TRƯỚC lần Tạm dừng → đóng (thu_hoi) + thẻ chờ đóng; Hoàn tác Tạm dừng mở lại cả hai. */
      const v = taoVp(ngay(-6));
      const m = Number(conn.prepare(`INSERT INTO discipline_measures (student_id, kind, status, created_at, created_by) VALUES (?, 'report_1', 'cho_duyet', ?, ?)`).run(em.id, now, P.admin.userId).lastInsertRowid);
      conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_at) VALUES (?, ?, ?)').run(m, v, now);
      const the = Number(conn.prepare(`INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, trang_thai, tu_duyet, tao_luc)
        VALUES ('y_thuc', 'y-thuc', 'discipline_measure', ?, ?, 'cho', 0, ?)`).run(m, em.id, now).lastInsertRowid);
      const st = () => `${get('SELECT status FROM discipline_measures WHERE id = ?', m).status},${get('SELECT trang_thai AS t FROM yeu_cau_duyet WHERE id = ?', the).t}`;
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', TODAY, 'Tạm nghỉ');
      assert(st() === 'thu_hoi,tu_dong', `Tạm dừng: ${st()}`);
      studentsSvc.hoanTacTamDung(P.admin, em.id);
      assert(st() === 'cho_duyet,cho', `Hoàn tác Tạm dừng: ${st()}`);
    });
    thu('lt7b', () => {
      const v = taoVp(ngay(-6));
      studentsSvc.setStudentStatus(P.admin, em.id, 'inactive', ngay(-3), 'Tạm nghỉ');
      studentsSvc.hoanTacTamDung(P.admin, em.id);
      assert(BAT_BUOC.has(vpT(v).t), `Hoàn tác Tạm dừng không trả vi phạm: ${JSON.stringify(vpT(v))}`);
    });
  });

  check('LT-8 · (rà #2219) Mini Test: Case nhóm bổ trợ đóng vì Kết thúc học → Học lại không hiện lại Mini Test', () => thu('lt8', () => {
    const nhom = `lt8-${em.id}`;
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, needs_approval, cycle_no, preset, created_at, nhom_bo_tro) VALUES (?, 'bo_tro_mien_phi', 'planned', 0, 1, 0, ?, ?)`).run(em.ca, now, nhom);
    const cy = get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', em.luot).cycle_id;
    const mt = Number(conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han) VALUES (?, ?, ?, ?, 4, ?, ?)`)
      .run(em.id, cy, em.luot, nhom, ngay(-5), ngay(-2)).lastInsertRowid);
    const coMt = () => { xoaNho(); return (myWork(P.admin, { nguoi: 'tat-ca' } as any).items as any[]).some((i: any) => i.key === `minitest:${mt}`); };
    assert(coMt(), 'tiền đề: Công việc có Mini Test');
    studentsSvc.setStudentStatus(P.admin, em.id, 'finished', ngay(-3), 'Thôi học');
    studentsSvc.hocLai(P.admin, em.id, { date: TODAY, lyDo: 'Học lại' });
    assert(!coMt(), 'Học lại hiện lại Mini Test cũ');
  }));

  check('LT-9 · (rà #2219) thẻ Chờ duyệt dời lịch thi / báo Cuối khoá tự đóng khi em vào Lưu trữ', () => thu('lt9', () => {
    const ky = get('SELECT planned_period_id AS k FROM assessment_attempts WHERE id = ?', em.luot).k ?? get('SELECT id FROM report_periods ORDER BY id LIMIT 1').id;
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned' WHERE id = ?`).run(em.luot);
    const mv = Number(conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
      VALUES (?, 'listening', 1, ?, ?, ?, ?, 'pending', ?)`).run(em.luot, ky, ky, TODAY, ngay(30), now).lastInsertRowid);
    const the = (loai: string, phan: string, dt: string, id: number) => Number(conn.prepare(`INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, trang_thai, tu_duyet, tao_luc)
      VALUES (?, ?, ?, ?, ?, 'cho', 0, ?)`).run(loai, phan, dt, id, em.id, now).lastInsertRowid);
    const t1 = the('lich_thi', 'lich-thi', 'skill_move', mv), t2 = the('bao_len_cuoi_khoa', 'bao-len', 'attempt', em.luot);
    yc.quetYeuCau(TODAY);
    const tt = (id: number) => get('SELECT trang_thai AS t FROM yeu_cau_duyet WHERE id = ?', id).t;
    assert(tt(t1) === 'cho' && tt(t2) === 'cho', `tiền đề: ${tt(t1)} ${tt(t2)}`);
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = ? WHERE id = ?`).run(TODAY, em.id);
    yc.quetYeuCau(TODAY);
    assert(tt(t1) === 'tu_dong' && tt(t2) === 'tu_dong', `em Lưu trữ còn thẻ chờ: ${tt(t1)} ${tt(t2)}`);
  }));

  check('LT-10 · (rà #2219) tín hiệu đã thu hồi KHÔNG mở lại khi em đang Lưu trữ (Tạm dừng)', () => thu('lt10', () => {
    const key = signals.signalKey(em.luot, 'listening');
    conn.prepare(`INSERT INTO case_signals (student_id, attempt_id, skill, status, dedup_key, detected_on, raised_on, verify_due, created_at) VALUES (?, ?, 'listening', 'withdrawn', ?, ?, ?, ?, ?)`)
      .run(em.id, em.luot, key, TODAY, TODAY, TODAY, now);
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = ? WHERE id = ?`).run(TODAY, em.id);
    const r = signals.raiseSignal({ actorUserId: null, studentId: em.id, cycleId: null, attemptId: em.luot, classId: em.lop, skill: 'listening', category: null, detectedOn: TODAY, silent: true });
    assert(r.status === 'withdrawn', `tín hiệu mở lại cho em Lưu trữ: ${r.status}`);
  }));
}
