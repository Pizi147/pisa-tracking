/**
 * PHÉP KIỂM THI-LAI-1-KN (chủ SP 05/11, plan.md mục 4 "luật mới, kết quả thi"): em học lại / thi lại MỘT kỹ năng → kỹ năng mới thay vào kết quả thi thật
 * lần trước, overall + Đạt Target tính như thường, hết "Chờ đủ 4 kỹ năng"; cột `thi_that_lay_lai` ghi kỹ năng lấy từ lần trước (hồ sơ HV, Phân tích ghi "thi lại").
 */
export async function runPrThiLaiTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; addDays: (d: string, n: number) => string }) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const profile: any = await import('../students/profile.ts');
  const mg: any = await import('../migrate/prThiLai.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nTHI-LAI-1-KN — thi lại một kỹ năng: điểm lần trước thay vào, overall + Đạt Target như thường');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e: any) { return e; } return null; };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.admin;
  const ngayCu = addDays(TODAY, -60), ngayMoi = addDays(TODAY, -3);

  /** Em FT có lộ trình C1 (KQ thi thật L6 R6 W5 S6) → lộ trình mới C2 chỉ học Writing, đã thi (hôm qua của ngày thi), chưa nhập KQ. */
  const dung = (monDangKy: string | null = JSON.stringify(['writing1', 'writing2'])) => {
    const c1 = get(`SELECT c.* FROM learning_cycles c WHERE c.route IS NOT NULL AND c.status = 'active'
        AND c.seq = (SELECT MAX(seq) FROM learning_cycles WHERE student_id = c.student_id)
        AND EXISTS (SELECT 1 FROM enrollments e JOIN classes k ON k.id = e.class_id WHERE e.student_id = c.student_id AND k.is_fast_track = 1) ORDER BY c.id LIMIT 1`);
    assert(c1, 'seed có lộ trình FT đang chạy');
    conn.prepare(`UPDATE learning_cycles SET started_at = ?, status = 'completed', ended_at = ?, thi_that_ngay = ?, thi_that_l = 6, thi_that_r = 6, thi_that_w = 5,
        thi_that_s = 6, thi_that_khong_thi = 0, outcome = 'not_reached', outcome_score = 6.0, buoc_tiep = 'lo_trinh_moi' WHERE id = ?`).run(addDays(TODAY, -200), ngayCu, ngayCu, c1.id);
    const id = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at, exam_date, mon_dang_ky)
        VALUES (?, ?, ?, ?, 6.0, ?, 'active', ?, ?, ?)`).run(c1.student_id, c1.seq + 1, c1.route, c1.programme_code, addDays(TODAY, -50), TODAY, ngayMoi, monDangKy).lastInsertRowid);
    return { c1, id, sid: c1.student_id as number };
  };
  const cy = (id: number) => get('SELECT * FROM learning_cycles WHERE id = ?', id);
  const choKq = (id: number) => { xoaNho(); return thiThat.loTrinhChoKetQuaThi(TODAY).some((x: any) => x.c.id === id); };

  check('TL-1 · kỹ năng lấy lại = kỹ năng KHÔNG đăng ký (W1 hoặc W2 đã học = Writing đã học); đủ môn → không tự lấy', () => {
    assert(JSON.stringify(d.kyNangLayLai(JSON.stringify(['writing1', 'writing2']))) === '["l","r","s"]', 'chỉ học W');
    assert(JSON.stringify(d.kyNangLayLai(JSON.stringify(['writing2']))) === '["l","r","s"]', 'chỉ học W2 → Writing đã học');
    assert(JSON.stringify(d.kyNangLayLai(JSON.stringify(['listening', 'speaking']))) === '["r","w"]', 'học L + S');
    assert(d.kyNangLayLai(null).length === 0, 'đủ môn');
  });

  check('TL-2 · KQ thi thật lần trước = lộ trình FT gần nhất trước đó có đủ 4 kỹ năng', () => thu(() => {
    const { id } = dung();
    const tr = thiThat.thiTruocCua(cy(id));
    assert(tr && tr.l === 6 && tr.r === 6 && tr.w === 5 && tr.s === 6 && tr.ngay === ngayCu, JSON.stringify(tr));
    conn.prepare('UPDATE learning_cycles SET thi_that_s = NULL WHERE student_id = ? AND id != ?').run(cy(id).student_id, id);
    assert(thiThat.thiTruocCua(cy(id)) === null, 'lần trước thiếu S → không có KQ để lấy');
  }));

  check('TL-3 · em thi lại W: nhập W + L R S lấy lại → overall đúng, Đạt / Chưa đạt đúng, hết "Chờ đủ 4 kỹ năng"', () => thu(() => {
    const { id } = dung();
    thiThat.datKetQuaThiThat(QL, id, { ngayThi: ngayMoi, w: 6.5 });
    assert(cy(id).outcome_score === null && choKq(id), 'chỉ W → còn chờ (như cũ)');
    assert(d.ketQuaThiThat({ l: null, r: null, w: 6.5, s: null, khongThi: false }, 6).nhan === 'Chờ đủ 4 kỹ năng', 'nhãn cũ');
    thiThat.datKetQuaThiThat(QL, id, { ngayThi: ngayMoi, l: 6, r: 6, w: 6.5, s: 6, layLai: ['l', 'r', 's'] });
    const c = cy(id);
    assert(c.outcome_score === 6 && c.outcome === 'reached', `OVR (6+6+6.5+6)/4 = 6.125 → 6.0 ≥ Target 6.0: ${c.outcome_score} ${c.outcome}`);
    assert(JSON.stringify(JSON.parse(c.thi_that_lay_lai)) === JSON.stringify({ kn: ['l', 'r', 's'], ngay: ngayCu }), c.thi_that_lay_lai);
    assert(!choKq(id), 'hết chờ kết quả');
    conn.prepare('UPDATE learning_cycles SET target_score = 6.5 WHERE id = ?').run(id);
    thiThat.datKetQuaThiThat(QL, id, { w: 6.5, layLai: ['l', 'r', 's'] });
    assert(cy(id).outcome === 'not_reached', 'Target 6.5 → Chưa đạt');
  }));

  check('TL-4 · ô lấy lại bị sửa khác điểm cũ = đã thi lại (bỏ khỏi danh sách); khoá lạ → 400; Không thi → xoá danh sách', () => thu(() => {
    const { id } = dung();
    thiThat.datKetQuaThiThat(QL, id, { ngayThi: ngayMoi, l: 7, r: 6, w: 6.5, s: 6, layLai: ['l', 'r', 's'] });
    assert(JSON.stringify(JSON.parse(cy(id).thi_that_lay_lai).kn) === '["r","s"]', cy(id).thi_that_lay_lai);
    assert(loi(() => thiThat.datKetQuaThiThat(QL, id, { layLai: ['x'] }))?.status === 400, 'khoá lạ');
    assert(loi(() => thiThat.datKetQuaThiThat(QL, id, { layLai: 'l' }))?.status === 400, 'không phải mảng');
    thiThat.datKetQuaThiThat(QL, id, { w: 7 });   // không gửi layLai → giữ danh sách đang lưu (điểm cũ vẫn khớp)
    assert(JSON.stringify(JSON.parse(cy(id).thi_that_lay_lai).kn) === '["r","s"]', 'giữ khi không gửi');
    thiThat.datKetQuaThiThat(QL, id, { r: 7 });   // sửa R khác điểm cũ → R thành đã thi lại
    assert(JSON.stringify(JSON.parse(cy(id).thi_that_lay_lai).kn) === '["s"]', 'sửa ô lấy lại');
    thiThat.datKetQuaThiThat(QL, id, { khongThi: true });
    assert(cy(id).thi_that_lay_lai === null, 'Không thi');
  }));

  check('TL-5 · Phân tích Kết quả thi + hồ sơ HV ghi kỹ năng thi lại', () => thu(() => {
    const { id, sid } = dung();
    thiThat.datKetQuaThiThat(QL, id, { ngayThi: ngayMoi, l: 6, r: 6, w: 6.5, s: 6, layLai: ['l', 'r', 's'] });
    xoaNho();
    const dong = kqt.ketQuaThiThatKq(QL, { branchId: null, tu: addDays(ngayMoi, -7), den: TODAY }).rows.find((r: any) => r.cycleId === id);
    assert(dong && JSON.stringify(dong.thiLai) === '["W"]', JSON.stringify(dong));
    xoaNho();
    const hs = profile.studentProfile(QL, sid, id);
    assert(JSON.stringify(hs.cycle.thiThat.layLai) === JSON.stringify({ kn: ['l', 'r', 's'], ngay: ngayCu }), JSON.stringify(hs.cycle.thiThat));
  }));

  check('TL-6 · migrate thêm cột (chạy lại không làm gì) + kiemTruocThiLai đếm lộ trình kẹt "Chờ đủ 4 kỹ năng" có KQ lần trước (chỉ đọc)', () => thu(() => {
    const { id } = dung();
    thiThat.datKetQuaThiThat(QL, id, { ngayThi: ngayMoi, w: 6.5 });
    const ds = mg.kiemTruocThiLai(conn);
    assert(ds.some((r: any) => r.id === id && r.thieu === 'L · R · S'), JSON.stringify(ds));
    conn.exec('ALTER TABLE learning_cycles DROP COLUMN thi_that_lay_lai');
    const a1: string[] = [];
    mg.migratePrThiLai(conn, a1);
    assert(a1.length === 1, JSON.stringify(a1));
    const a2: string[] = [];
    mg.migratePrThiLai(conn, a2);
    assert(a2.length === 0, JSON.stringify(a2));
  }));
}
