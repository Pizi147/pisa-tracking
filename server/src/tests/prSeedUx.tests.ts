/** PHÉP KIỂM SEED-UX — bộ demo đủ dữ liệu chụp mockup V5 (`thiet-ke/v5/du-lieu-demo.md`). Chỉ đọc, chạy NGAY sau seed. */
export async function runPrSeedUxTests(t: { check: (n: string, fn: () => void) => void; assert: (c: unknown, m: string) => void; conn: any }) {
  const { check, assert, conn } = t;
  const { loadPrincipal, lopFtChoGvSpeaking } = await import('../permissions.ts');
  const { bangTutor } = await import('../tutors/trang.ts');
  const { loTrinhChoKetQuaThi } = await import('../loTrinh/thiThat.ts');
  const { DEMO_DATE } = await import('../seed/data.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const uid = (ten: string) => one('SELECT id FROM users WHERE full_name = ?', ten)?.id as number;
  console.log('\nSEED-UX · dữ liệu demo cho mockup V5');

  check('SU-1 GV S không dạy lớp nào (Đoàn Minh Thư) vẫn có lớp FT để chấm Speaking chéo', () => {
    const id = uid('Đoàn Minh Thư');
    assert(id && !one('SELECT 1 FROM teacher_assignments WHERE user_id = ?', id), 'GV có phân công');
    assert(lopFtChoGvSpeaking(loadPrincipal(id)).length > 0, 'không có lớp chấm chéo');
  });
  check('SU-2 tài khoản Admin VP · CX · TVV (MB, BC, HD, UB, CP)', () => {
    for (const [vai, n] of [['office_admin', 2], ['cx', 1], ['consultant', 6]] as const) {
      assert(one(`SELECT COUNT(*) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ?`, vai).n >= n, vai);
    }
  });
  check('SU-3 đa số em đang học có TVV + SĐT phụ huynh; mỗi chi nhánh còn em không TVV; TVV Hương giữ 4 em', () => {
    const r = one(`SELECT COUNT(*) n, SUM(consultant_user_id IS NOT NULL) tvv, SUM(parent_phone IS NOT NULL) ph FROM students WHERE status = 'active'`);
    assert(r.tvv / r.n >= 0.85 && r.ph / r.n >= 0.85, `TVV ${r.tvv}/${r.n}`);
    assert(one(`SELECT COUNT(*) n FROM students WHERE consultant_user_id = ?`, uid('Nguyễn Thu Hương')).n === 4, 'Hương');
    const thieu = one(`SELECT COUNT(DISTINCT c.branch_id) n FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
                        JOIN classes c ON c.id = e.class_id WHERE s.status = 'active' AND s.consultant_user_id IS NULL`).n;
    assert(thieu === 5, `chi nhánh có em không TVV: ${thieu}`);
  });
  check('SU-4 MT2 MB FT 101 đủ 5 em mockup m3', () => {
    for (const ten of ['Bùi Thảo Vy', 'Tạ Minh Quân', 'Trần Thu Hà', 'Vũ Hải Đăng', 'Lương Bảo Anh']) {
      assert(one(`SELECT 1 FROM assessment_scores sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN students s ON s.id = a.student_id
                  JOIN classes c ON c.id = a.class_id WHERE c.code = 'MB FT 101' AND a.attempt_no = 2 AND s.full_name = ? AND sc.band IS NOT NULL`, ten), ten);
    }
    assert(one(`SELECT sc.band b FROM assessment_scores sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN students s ON s.id = a.student_id
                WHERE s.full_name = 'Bùi Thảo Vy' AND a.attempt_no = 2 AND sc.skill = 'listening'`).b === 7, 'Vy L 7.0');
  });
  check('SU-5 thi thật: có KQ + đã chốt bước tiếp, có KQ chưa bước tiếp, "Đã thi · chờ KQ" theo ngày', () => {
    assert(one(`SELECT COUNT(*) n FROM learning_cycles WHERE thi_that_l IS NOT NULL AND buoc_tiep IS NOT NULL`).n >= 1, 'đã chốt');
    assert(one(`SELECT 1 FROM learning_cycles WHERE thi_that_l IS NOT NULL AND buoc_tiep IS NULL AND status = 'active'`), 'chưa bước tiếp');
    assert(loTrinhChoKetQuaThi(DEMO_DATE).some((x: any) => x.c.exam_date), 'chờ KQ có ngày thi');
    assert(one(`SELECT 1 FROM learning_cycles WHERE status = 'active' AND exam_month IS NOT NULL AND exam_date IS NULL`), 'em chưa chốt ngày thi');
  });
  check('SU-6 buổi tutor trong 4 tuần trước ngày demo, có tutor cần chú ý', () => {
    const b = bangTutor(loadPrincipal(uid('Hoàng Thị Hà')), { tu: '2026-08-17', den: '2026-09-13' } as any) as any;
    const dong = (b.dong ?? b.rows ?? b) as any[];
    assert(Array.isArray(dong) && dong.filter((r) => (r.so?.buoi ?? r.buoi ?? 0) > 0).length >= 6, 'ít hơn 6 tutor có buổi');
  });
  check('SU-7 MT cũ có "-" → Đã huỷ · vắng MT cũ; vi phạm có / chưa báo PH; lớp thường đủ điểm', () => {
    assert(one(`SELECT 1 FROM assessment_scores WHERE no_show_cu = 1`), 'không có "-" MT cũ');
    const ph = (bao: boolean) => one(`SELECT 1 FROM discipline_measures m WHERE m.status = 'done' AND m.performed_on >= '2026-09-09' AND
      ${bao ? '' : 'NOT'} EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.student_id = m.student_id AND x.kind = 'bao_ph_tvv' AND x.status = 'done')`);
    assert(ph(true) && ph(false), 'thiếu lần xử lý có / chưa báo PH');
    const du = one(`SELECT COUNT(*) n FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE c.code = 'HD FOU 06' AND a.kind = 'progress'
      AND (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.raw_score >= 18) = 4`).n;
    assert(du >= 4, `Progress đủ điểm: ${du}`);
  });
  check('SU-8 không thông báo nào sau ngày demo', () => {
    assert(!one(`SELECT 1 FROM notifications WHERE created_at > ?`, `${DEMO_DATE}T16:59:59.999Z`), 'thông báo ở tương lai');
  });
}
