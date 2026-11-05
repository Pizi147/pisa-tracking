/**
 * PHÉP KIỂM NGHI-HOC-LUU-TRU (chủ SP 05/11: "Nghỉ học rồi thì tất nhiên sẽ vào lưu trữ, nên không hiện luôn ở tất cả mọi mặt trận") — thay ngoại lệ
 * PR-TK / OV-8a (em FT có lộ trình chạy Kết thúc học thì chưa lưu trữ):
 *   (1) Kết thúc học LUÔN vào Lưu trữ (cả em FT có lộ trình chạy); KQ thi thật vẫn nhập được sau; (2) migrate một lần lưu trữ em `finished` chưa lưu trữ;
 *   (3) chuông bỏ thông báo về em đã nghỉ học; (4) Excel (Xuất điểm Test, Xuất kết quả Test) bỏ lượt chưa thi của em không còn học, giữ lượt đã thi;
 *   (5) ô tìm thanh trên: em Lưu trữ xếp cuối, có cờ `archived`; (6) KPI TVV "Báo PH đúng hạn" bỏ em đã nghỉ học.
 */
export async function runPrNghiHocLuuTruTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (code: string) => number }) {
  const { check, assert, conn, P, TODAY } = t;
  const students: any = await import('../students/students.ts');
  const thv: any = await import('../students/trangThaiHv.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const thongBao: any = await import('../platform/thongBao.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const xuatMt: any = await import('../phanTich/xuatMt.ts');
  const tq: any = await import('../worklist/tongQuanV5.ts');
  const mg: any = await import('../migrate/prNghiHocLuuTru.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nNGHI-HOC-LUU-TRU — em nghỉ học luôn vào Lưu trữ, không hiện ở chuông / Excel / ô tìm / KPI');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const hs = (id: number) => get('SELECT * FROM students WHERE id = ?', id);
  /** Em FT đang học ở chi nhánh MB, lộ trình FT đang chạy, có lượt Mock đã có điểm và lượt chưa thi đã xếp tuần. */
  const emFt = () => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy, e.class_id FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
       WHERE s.status = 'active' AND s.archived_at IS NULL
         AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.student_id = s.id AND a.kind = 'mock' AND a.status = 'planned' AND a.planned_period_id IS NOT NULL
                       AND NOT EXISTS (SELECT 1 FROM assessment_scores sx WHERE sx.attempt_id = a.id AND (sx.band IS NOT NULL OR sx.raw_score IS NOT NULL)))
         AND EXISTS (SELECT 1 FROM assessment_attempts a JOIN assessment_scores sx ON sx.attempt_id = a.id AND sx.band IS NOT NULL WHERE a.student_id = s.id AND a.kind = 'mock')
       ORDER BY s.id LIMIT 1`);
    assert(r, 'seed cần em FT MB có lượt đã thi + lượt chưa thi');
    return r as { sid: number; cy: number; class_id: number };
  };

  check('NH-1 · Kết thúc học em FT có lộ trình chạy → vào Lưu trữ ngay (không "chờ KQ"); KQ thi thật vẫn nhập được sau', () => thu(() => {
    const a = emFt();
    assert(!thv.tomTatTrangThai([a.sid], true).dong.some((x: string) => /chờ KQ/.test(x)), 'xem trước còn dòng "chờ KQ thi thật"');
    const r = thv.doiTrangThai(QL, a.sid, { status: 'finished', date: TODAY, reason: 'Thôi' });
    assert(r.archived_at === TODAY && r.thongBao === 'Đã vào Lưu trữ · Kết thúc học', `archived ${r.archived_at} · ${r.thongBao}`);
    thiThat.datKetQuaThiThat(QL, a.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    assert(get('SELECT outcome_score FROM learning_cycles WHERE id = ?', a.cy).outcome_score === 6, 'KQ thi thật không nhập được sau khi lưu trữ');
  }));

  check('NH-2 · migrate: em `finished` chưa lưu trữ → Lưu trữ từ ngày kết thúc + nhật ký; em khác giữ; khoá chặn lần sau', () => thu(() => {
    const a = emFt();
    const khac = get(`SELECT id FROM students WHERE status = 'active' AND archived_at IS NULL AND id != ? ORDER BY id LIMIT 1`, a.sid).id;
    conn.prepare(`UPDATE students SET status = 'finished', finished_at = '2026-10-01', archived_at = NULL WHERE id = ?`).run(a.sid);
    assert(mg.emNghiHocChuaLuuTru(conn).some((x: any) => x.id === a.sid), 'SQL chỉ đọc không ra em');
    const n = mg.luuTruEmNghiHoc(conn);
    assert(n >= 1 && hs(a.sid).archived_at === '2026-10-01', `n ${n} · ${hs(a.sid).archived_at}`);
    assert(!hs(khac).archived_at && hs(khac).status === 'active', 'em đang học bị đụng');
    assert(get(`SELECT 1 FROM audit_logs WHERE action = 'student.archive' AND entity_type = 'student' AND entity_id = ?`, a.sid), 'thiếu nhật ký');
    assert(mg.luuTruEmNghiHoc(conn) === 0, 'lần 2 còn đổi');
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(mg.KHOA_PR_NGHI_HOC_LUU_TRU);
    mg.migratePrNghiHocLuuTru(conn, []);
    assert(get('SELECT 1 FROM demo_config WHERE key = ?', mg.KHOA_PR_NGHI_HOC_LUU_TRU), 'chưa ghi khoá');
    conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(a.sid);
    const ap: string[] = [];
    mg.migratePrNghiHocLuuTru(conn, ap);
    assert(!hs(a.sid).archived_at && !ap.length, 'có khoá vẫn chạy');
  }));

  check('NH-3 · chuông: thông báo về em đã nghỉ học không hiện; em đang học vẫn hiện', () => thu(() => {
    const a = emFt();
    const b = get(`SELECT id FROM students WHERE status = 'active' AND archived_at IS NULL AND id != ? ORDER BY id LIMIT 1`, a.sid).id;
    const them = (sid: number) => Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at)
      VALUES (?, 'thu_nh', 'Thử', 'Thử', 'student', ?, ?, ?)`).run(QL.userId, sid, `thu-nh:${sid}`, new Date().toISOString()).lastInsertRowid);
    const na = them(a.sid), nb = them(b);
    students.setStudentStatus(QL, a.sid, 'finished', TODAY, 'Thôi');
    const ids = thongBao.thongBaoCua(QL.userId).map((r: any) => r.id);
    assert(!ids.includes(na), 'chuông còn thông báo về em nghỉ học');
    assert(ids.includes(nb), 'chuông mất thông báo về em đang học');
  }));

  check('NH-4 · Excel: lượt chưa thi của em nghỉ học bỏ; lượt đã thi giữ (Xuất điểm Test + Xuất kết quả Test)', () => thu(() => {
    const a = emFt();
    const mb = get(`SELECT id FROM branches WHERE code = 'MB'`).id;
    const cua = (sql: string) => get(`SELECT COUNT(*) n FROM assessment_attempts a WHERE a.student_id = ? AND a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND ${sql}`, a.sid, a.class_id).n as number;
    const coDiem = `EXISTS (SELECT 1 FROM assessment_scores sx WHERE sx.attempt_id = a.id AND (sx.band IS NOT NULL OR sx.raw_score IS NOT NULL))`;
    const chuaThi = cua(`a.status = 'planned' AND NOT ${coDiem}`);
    assert(chuaThi > 0 && cua(coDiem) > 0, 'tiền đề');
    const diem = () => kh.xuatDiemTest(QL, { branchId: mb, classIds: [a.class_id], noiDung: 'chi-diem', xemTruoc: true, mt: [0, 20], tuan: null }).dem.luot as number;
    const ketQua = () => xuatMt.duLieuXuatMt(QL, { khung: 'ft', chiNhanh: [mb], lop: [a.class_id], thoiGian: { kieu: 'tuan', tu: '2020-01-05', den: '2030-12-29' }, chiDuDiem: false, cot: 'gon' }).dem.luot as number;
    const truoc = { diem: diem(), ketQua: ketQua() };
    students.setStudentStatus(QL, a.sid, 'finished', TODAY, 'Thôi');
    xoaNho();
    const sau = { diem: diem(), ketQua: ketQua() };
    assert(sau.diem > 0 && sau.diem < truoc.diem && sau.ketQua > 0 && sau.ketQua < truoc.ketQua, `trước ${JSON.stringify(truoc)} · sau ${JSON.stringify(sau)} · chưa thi ${chuaThi}`);
    /* Em nghỉ học còn lượt đã thi trong tệp (lịch sử thật): đếm lại sau khi bỏ hết lượt có điểm của em → giảm tiếp. */
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE student_id = ? AND kind = 'mock' AND ${coDiem.replace(/a\.id/g, 'assessment_attempts.id')}`).run(a.sid);
    xoaNho();
    assert(diem() < sau.diem && ketQua() < sau.ketQua, 'lượt đã thi của em nghỉ học không còn trong tệp');
  }));

  check('NH-5 · ô tìm thanh trên: em Lưu trữ xếp cuối, có cờ `archived` (vẫn ra để mở hồ sơ)', () => thu(() => {
    const ds = conn.prepare(`SELECT s.id, s.full_name FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.full_name LIMIT 2`).all() as any[];
    const [dau, sau] = ds;
    const ho = 'Nghỉ Học Thử';
    conn.prepare(`UPDATE students SET full_name = ?, normalized_name = ? WHERE id = ?`).run(`${ho} A`, 'nghi hoc thu a', dau.id);
    conn.prepare(`UPDATE students SET full_name = ?, normalized_name = ? WHERE id = ?`).run(`${ho} B`, 'nghi hoc thu b', sau.id);
    students.setStudentStatus(QL, dau.id, 'finished', TODAY, 'Thôi');
    const rows = students.listStudents(QL, { q: ho }).rows as any[];
    assert(rows.length === 2 && rows[0].id === sau.id && rows[1].id === dau.id, `thứ tự: ${JSON.stringify(rows.map((r) => [r.id, r.fullName]))}`);
    assert(rows[1].archived === true && rows[0].archived === false, `cờ: ${JSON.stringify(rows.map((r) => r.archived))}`);
  }));

  check('NH-6 · KPI TVV "Báo PH đúng hạn" bỏ việc của em đã nghỉ học', () => thu(() => {
    const v = get(`SELECT v.id, v.student_id, s.consultant_user_id AS tvv FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
       WHERE v.trang_thai != 'bo' AND s.consultant_user_id IS NOT NULL AND s.status = 'active' AND s.archived_at IS NULL ORDER BY v.id LIMIT 1`);
    assert(v, 'seed cần việc Báo PH có TVV');
    conn.prepare(`UPDATE viec_bao_ph SET tao_luc = ? WHERE id = ?`).run(`${d.khoangMacDinh(TODAY).tu}T08:00:00.000Z`, v.id);   // kỳ mặc định = 2 tuần trước
    const p = loadPrincipal(v.tvv);
    const truoc = tq.tongQuanTvv(p).baoPh.tong as number;
    assert(truoc > 0, 'tiền đề: việc trong kỳ');
    conn.prepare(`UPDATE students SET status = 'finished', finished_at = ?, archived_at = ? WHERE id = ?`).run(TODAY, TODAY, v.student_id);
    const sau = tq.tongQuanTvv(p).baoPh.tong as number;
    assert(sau < truoc, `trước ${truoc} · sau ${sau}`);
  }));
}
