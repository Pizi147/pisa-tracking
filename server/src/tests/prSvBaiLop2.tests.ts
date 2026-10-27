/**
 * PHÉP KIỂM SV-BAI-LOP-2 (kế hoạch M5 `docs/superpowers/plans/2026-10-27-m5-code.md` PR ①, mockup `thiet-ke/v7/ho-so-hv.html` form Ghi tiến độ):
 *   (1) Tiến độ trên lớp: tên bài / điểm / thang được trống, thêm `band` (0–9, bước 0.5); có điểm thì có thang và điểm ≤ thang; band và x/y không cùng lúc;
 *       cần ít nhất một trong nhận xét / x/y / band (nhận xét KHÔNG bắt buộc — chủ SP 27/10) · migrate prSvBaiLop2 đổi bảng cũ, giữ dữ liệu, chạy lặp được;
 *   (2) GET tiến độ của em trả `gopY[]` — góp ý tuần cũ của em qua mọi lớp (mã lớp, người ghi, tuần), chỉ đọc, quyền xem HV (PUT gop-y 403: prOv13h);
 *   (3) Hoàn tác Thêm PA: người vừa thêm, trong `HOAN_TAC_PA_MS` (+5 s mạng) → PA, mốc Hành trình, thẻ chờ duyệt (đóng) đi theo; Case về trạng thái trước;
 *       nhật ký `intervention.undo_add`; chặn: người khác 403, quá giờ / đã có kết quả / QL đã trả lời 409, PA hệ thống 400.
 * Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 */
export async function runPrSvBaiLop2Tests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const bai: any = await import('../students/baiTrenLop.ts');
  const { lichSu } = await import('../platform/lichSu.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nSV-BAI-LOP-2 · Tiến độ trên lớp: band · nhận xét tuỳ chọn · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FT 101');
  const tuan = mondayOf(demoToday());
  const em = () => get(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, LOP).student_id as number;
  /** Mẫu "chỉ nhận xét" — không tên bài, không kết quả. */
  const nx = (o: Record<string, unknown> = {}) => ({ classId: LOP, skill: 'speaking', tuan, nhanXet: 'Trả lời Part 3 dài hơn.', ...o });
  const dong = (sid: number, id: number) => bai.dsBaiTrenLop(P.mbManager, sid).bai.find((x: any) => x.id === id);

  check('SVBL2-1 · chỉ nhận xét (không tên bài, điểm, thang) lưu được; đọc lại tenBai / diem / thang / band = null; Lịch sử không treo " · "', () => thu(() => {
    const sid = em();
    const { id } = bai.themBaiTrenLop(P.mbManager, sid, nx());
    const b = dong(sid, id);
    assert(b && b.tenBai === null && b.diem === null && b.thang === null && b.band === null && b.nhanXet === 'Trả lời Part 3 dài hơn.', `dòng ${JSON.stringify(b)}`);
    const dt = lichSu(P.mbManager, { loai: 'bai-lop', id: sid }).dong[0].truong[0].doiTuong as string;
    assert(/^MB FT 101 · W\d [A-Z]{3} · \S+$/.test(dt), `Lịch sử: đối tượng không treo " · " khi không tên bài: "${dt}"`);
  }));

  check('SVBL2-2 · band 5.5 lưu được (kèm tên bài tuỳ chọn); x/y cũ vẫn lưu, band = null', () => thu(() => {
    const sid = em();
    const a = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ band: 5.5 })).id);
    assert(a.band === 5.5 && a.diem === null && a.thang === null && a.tenBai === null, `band ${JSON.stringify(a)}`);
    const b = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ band: 6, tenBai: 'Part 2' })).id);
    assert(b.band === 6 && b.tenBai === 'Part 2', `band + tên ${JSON.stringify(b)}`);
    const c = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ diem: 6, thang: 10 })).id);
    assert(c.diem === 6 && c.thang === 10 && c.band === null && c.tenBai === null, `x/y không tên ${JSON.stringify(c)}`);
  }));

  check('SVBL2-2b · KHÔNG nhận xét: chỉ band / chỉ x/y lưu được (chủ SP 27/10 "chỉ cần điểm thôi"); sửa bỏ nhận xét còn kết quả vẫn lưu', () => thu(() => {
    const sid = em();
    const a = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ nhanXet: undefined, band: 6 })).id);
    assert(a.band === 6 && a.nhanXet === null, `chỉ band ${JSON.stringify(a)}`);
    const b = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ nhanXet: '', diem: 7, thang: 10 })).id);
    assert(b.diem === 7 && b.thang === 10 && b.nhanXet === null, `chỉ x/y ${JSON.stringify(b)}`);
    const { id } = bai.themBaiTrenLop(P.mbManager, sid, nx({ band: 5.5 }));
    assert(bai.suaBaiTrenLop(P.mbManager, id, nx({ nhanXet: null, band: 5.5 })).doi, 'sửa bỏ nhận xét, còn band');
    assert(get('SELECT nhan_xet FROM bai_tren_lop WHERE id = ?', id).nhan_xet === null, 'nhận xét về trống');
  }));

  check('SVBL2-3 · 400: band lẻ / ngoài 0–9 / chữ; band cùng x/y; điểm thiếu thang; thang thiếu điểm; rỗng hết (không nhận xét, không kết quả) — không dòng nào lọt', () => thu(() => {
    const sid = em();
    const sai: [string, Record<string, unknown>][] = [
      ['band 5.3', { band: 5.3 }], ['band 9.5', { band: 9.5 }], ['band -0.5', { band: -0.5 }], ['band chữ', { band: '6' }],
      ['band + điểm', { band: 6, diem: 6, thang: 10 }], ['điểm thiếu thang', { diem: 6 }], ['thang thiếu điểm', { thang: 10 }],
      ['rỗng: thiếu nhận xét', { nhanXet: undefined }], ['rỗng: nhận xét trống', { nhanXet: '   ' }], ['rỗng: nhận xét null', { nhanXet: null }],
    ];
    for (const [ten, o] of sai) assert(maLoi(() => bai.themBaiTrenLop(P.mbManager, sid, nx(o))) === 400, `${ten} → 400`);
    assert(!get('SELECT 1 AS c FROM bai_tren_lop WHERE student_id = ?', sid), 'không dòng nào lọt');
  }));

  check('SVBL2-4 · sửa x/y → band: điểm / thang về trống; sửa thành rỗng hết → 400; bỏ nhận xét còn band → lưu được; lịch sử có Band', () => thu(() => {
    const sid = em();
    const { id } = bai.themBaiTrenLop(P.mbManager, sid, nx({ tenBai: 'Part 2', diem: 6, thang: 10 }));
    assert(bai.suaBaiTrenLop(P.mbManager, id, nx({ band: 6.5 })).doi, 'sửa sang band');
    const r = get('SELECT ten_bai, diem, thang, band FROM bai_tren_lop WHERE id = ?', id);
    assert(r.ten_bai === null && r.diem === null && r.thang === null && r.band === 6.5, `dòng ${JSON.stringify(r)}`);
    assert(maLoi(() => bai.suaBaiTrenLop(P.mbManager, id, nx({ nhanXet: '' }))) === 400, 'sửa thành rỗng hết → 400');
    const tom = lichSu(P.mbManager, { loai: 'bai-lop', id: sid }).dong[0].truong.map((x: any) => `${x.ten}:${x.cu ?? '∅'}>${x.moi ?? '∅'}`).join('|');
    assert(tom.includes('Điểm:6 / 10>∅') && tom.includes('Band:∅>6.5') && tom.includes('Tên bài:Part 2>∅'), `lịch sử ${tom}`);
  }));

  check('SVBL2-6 · gopY[]: góp ý tuần cũ của em ở MỌI lớp (mã lớp, người ghi, tuần, kỹ năng), mới trước; TVV đọc được; em khác không lẫn', () => thu(() => {
    const sid = em();
    const LOP2 = classId('MB FOU 12');
    const ky = (w: string) => get('SELECT id FROM report_periods WHERE week_start = ?', w)?.id as number;
    const w1 = mondayOf(demoToday()), w0 = get('SELECT week_start w FROM report_periods WHERE week_start < ? ORDER BY week_start DESC LIMIT 1', w1).w as string;
    assert(ky(w1) && ky(w0), 'demo có kỳ tuần này + tuần trước');
    conn.prepare('DELETE FROM gop_y_tuan WHERE student_id = ?').run(sid);
    const ghi = conn.prepare('INSERT INTO gop_y_tuan (student_id, class_id, period_id, skill, noi_dung, ghi_boi, ghi_luc) VALUES (?,?,?,?,?,?,?)');
    ghi.run(sid, LOP2, ky(w0), 'reading', 'Đọc chậm phần True / False.', P.normalCoreTeacher.userId, '2026-09-08T03:00:00Z');
    ghi.run(sid, LOP, ky(w1), 'speaking', 'Nói còn ngập ngừng.', P.sTeacher.userId, '2026-09-15T03:00:00Z');
    const khac = get('SELECT student_id FROM enrollments WHERE class_id = ? AND student_id != ? LIMIT 1', LOP, sid).student_id;
    ghi.run(khac, LOP, ky(w1), 'speaking', 'Của em khác.', P.sTeacher.userId, '2026-09-15T03:00:00Z');
    const g = bai.dsBaiTrenLop(P.mbManager, sid).gopY as any[];
    assert(Array.isArray(g) && g.length === 2, `gopY ${JSON.stringify(g)}`);
    assert(g[0].tuan === w1 && g[0].lop === 'MB FT 101' && g[0].classId === LOP && g[0].skill === 'speaking' && g[0].noiDung === 'Nói còn ngập ngừng.'
      && g[0].ghiBoi === P.sTeacher.fullName && /^W\d [A-Z]{3}$/.test(g[0].tuanMa) && g[0].ghiLuc === '2026-09-15T03:00:00Z', `dòng mới ${JSON.stringify(g[0])}`);
    assert(g[1].tuan === w0 && g[1].lop === 'MB FOU 12' && g[1].ghiBoi === P.normalCoreTeacher.fullName, `dòng lớp khác ${JSON.stringify(g[1])}`);
    assert(g.every((x) => !('sua' in x)), 'chỉ đọc: không cờ sửa');
    const TVV = loadPrincipal(accounts.createAccount(P.admin, { email: `svbl2.tvv${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svbl2', fullName: 'Thử SVBL2 TVV', roles: [{ role: 'consultant', branches: ['MB'] }] }).userId);
    assert(bai.dsBaiTrenLop(TVV, sid).gopY.length === 2, 'TVV (student.view) đọc được');
  }));

  const cases: any = await import('../cases/cases.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  /** Thêm PA bằng GVCN MB FT 101 vào Case mở đầu tiên của lớp nhận được PA — trả id Case, id PA, trạng thái Case trước khi thêm. */
  const themPa = (input: Record<string, unknown>) => {
    for (const r of conn.prepare(`SELECT sc.id, sc.status FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.class_id = ? AND e.status = 'active'
       WHERE sc.status != 'done' AND sc.tam = 0 ORDER BY sc.id`).all(LOP) as any[]) {
      try { cases.recordIntervention(P.coreTeacher, r.id, input); } catch { continue; }
      return { caseId: r.id as number, truoc: r.status as string, paId: get('SELECT MAX(id) AS id FROM case_interventions WHERE case_id = ?', r.id).id as number };
    }
    throw new Error('demo phải có Case mở ở MB FT 101 mà GVCN thêm được PA');
  };
  const PA = { kind: 'extra_homework', description: 'Làm thêm 2 đề Part 2 mỗi tuần', status: 'started', startedDate: demoToday() };

  check('SVBL2-7 · Hoàn tác Thêm PA: PA + mốc Hành trình mất, Case về trạng thái trước, nhật ký intervention.undo_add (chụp PA), trả Case', () => thu(() => {
    const x = themPa(PA);
    assert(get(`SELECT 1 AS c FROM journey_events WHERE ref_table = 'case_interventions' AND ref_id = ?`, x.paId), 'có mốc Hành trình sau khi thêm');
    const r = cases.hoanTacThemPa(P.coreTeacher, x.paId);
    assert(r && r.id === x.caseId, `trả Case ${r?.id}`);
    assert(!get('SELECT 1 AS c FROM case_interventions WHERE id = ?', x.paId), 'PA đã gỡ');
    assert(!get(`SELECT 1 AS c FROM journey_events WHERE ref_table = 'case_interventions' AND ref_id = ?`, x.paId), 'mốc Hành trình đã gỡ');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', x.caseId).status === x.truoc, `Case về ${x.truoc}`);
    const au = get(`SELECT * FROM audit_logs WHERE action = 'intervention.undo_add' AND entity_id = ? ORDER BY id DESC`, x.paId);
    assert(au && au.actor_user_id === P.coreTeacher.userId && JSON.parse(au.before_json).pa.description === PA.description, `nhật ký ${JSON.stringify(au)}`);
    assert(dm.nhanHanhDongNhatKy('intervention.undo_add') === 'Hoàn tác thêm PA', 'nhãn nhật ký');
  }));

  check('SVBL2-8 · Hoàn tác đề xuất (cần QL duyệt): thẻ Chờ duyệt đóng tự động, không còn thẻ chờ', () => thu(() => {
    const x = themPa({ kind: 'extra_support', description: 'Xin thêm buổi hỗ trợ 1-1 với GV' });
    const the = () => get(`SELECT trang_thai FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_loai = 'intervention' AND doi_tuong_id = ? ORDER BY id DESC`, x.paId);
    assert(the()?.trang_thai === 'cho', 'có thẻ chờ sau khi thêm');
    cases.hoanTacThemPa(P.coreTeacher, x.paId);
    assert(the()?.trang_thai === 'tu_dong', `thẻ ${JSON.stringify(the())}`);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', x.caseId).status === x.truoc, 'Case về trạng thái trước');
  }));

  check('SVBL2-9 · chặn Hoàn tác: người khác (kể cả QL) 403 · quá giờ 409 · đã có kết quả 409 · QL đã trả lời 409 · không có PA 404 — PA giữ nguyên', () => thu(() => {
    const ma = (fn: () => unknown) => { try { fn(); return 0; } catch (e: any) { return e?.status ?? -1; } };
    const x = themPa(PA);
    assert(ma(() => cases.hoanTacThemPa(P.mbManager, x.paId)) === 403, 'QL (không phải người thêm) → 403');
    const cu = new Date(Date.now() - dm.HOAN_TAC_PA_MS - 6000).toISOString();
    conn.prepare('UPDATE case_interventions SET created_at = ? WHERE id = ?').run(cu, x.paId);
    assert(ma(() => cases.hoanTacThemPa(P.coreTeacher, x.paId)) === 409, 'quá giờ → 409');
    conn.prepare('UPDATE case_interventions SET created_at = ? WHERE id = ?').run(new Date().toISOString(), x.paId);
    conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, created_at) VALUES (?, ?, ?, ?)`).run(x.caseId, x.paId, demoToday(), new Date().toISOString());
    assert(ma(() => cases.hoanTacThemPa(P.coreTeacher, x.paId)) === 409, 'đã có kết quả → 409');
    const y = themPa({ kind: 'extra_support', description: 'Xin thêm buổi hỗ trợ 1-1 với GV' });
    conn.prepare(`UPDATE case_interventions SET approval_state = 'approved' WHERE id = ?`).run(y.paId);
    assert(ma(() => cases.hoanTacThemPa(P.coreTeacher, y.paId)) === 409, 'QL đã trả lời → 409');
    assert(ma(() => cases.hoanTacThemPa(P.coreTeacher, 987654)) === 404, 'không có PA → 404');
    assert(get('SELECT 1 AS c FROM case_interventions WHERE id = ?', x.paId) && get('SELECT 1 AS c FROM case_interventions WHERE id = ?', y.paId), 'PA giữ nguyên');
  }));

  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  check(`SVBL2-10 · trần câu SQL: hoàn tác thêm PA ≤ ${TRAN_GHI_LO.hoanTacThemPa}`, () => thu(() => {
    const x = themPa(PA);
    xoaNho(); const s0 = soCauSql(); cases.hoanTacThemPa(P.coreTeacher, x.paId); const n = soCauSql() - s0;
    console.log(`    hoàn tác thêm PA ${n} câu`);
    assert(n <= TRAN_GHI_LO.hoanTacThemPa, `${n} câu`);
  }));

  const { default: Database } = await import('libsql');
  const { migratePrSvBaiLop } = await import('../migrate/prSvBaiLop.ts');
  const { migratePrSvBaiLop2 } = await import('../migrate/prSvBaiLop2.ts');
  check('SVBL2-5 · migrate prSvBaiLop2: bảng cũ (NOT NULL, chưa band) → cột trống được + band, dữ liệu + chỉ mục giữ; lần hai không làm gì; DB thử đã đúng dạng', () => {
    const cot = (c: any) => Object.fromEntries((c.prepare('PRAGMA table_info(bai_tren_lop)').all() as any[]).map((x) => [x.name, x.notnull]));
    const moi = new Database(':memory:');
    try {
      /* Bảng khoá ngoài trỏ tới phải có: RENAME đọc lại cả lược đồ. */
      for (const [b, id] of [['students', 1], ['classes', 2], ['users', 3]]) moi.exec(`CREATE TABLE ${b} (id INTEGER PRIMARY KEY); INSERT INTO ${b} VALUES (${id})`);
      migratePrSvBaiLop(moi, []);
      moi.prepare(`INSERT INTO bai_tren_lop (student_id, class_id, skill, ten_bai, diem, thang, tuan, nhan_xet, ghi_boi, ghi_luc) VALUES (1, 2, 'writing', 'Task 1', 7, 10, '2026-09-14', NULL, 3, 'x')`).run();
      const a: string[] = []; migratePrSvBaiLop2(moi, a);
      const b: string[] = []; migratePrSvBaiLop2(moi, b);
      const c = cot(moi);
      assert(a.length === 1 && b.length === 0, `applied ${a} / ${b}`);
      assert(c.ten_bai === 0 && c.diem === 0 && c.thang === 0 && c.band === 0 && c.student_id === 1 && c.nhan_xet === 0, `cột ${JSON.stringify(c)}`);
      const r = moi.prepare('SELECT * FROM bai_tren_lop').get() as any;
      assert(r.id === 1 && r.ten_bai === 'Task 1' && r.diem === 7 && r.thang === 10 && r.band === null && r.ghi_luc === 'x', `dữ liệu ${JSON.stringify(r)}`);
      assert(moi.prepare(`SELECT 1 AS c FROM sqlite_master WHERE type = 'index' AND name = 'idx_bai_tren_lop_hv'`).get(), 'chỉ mục giữ');
    } finally { moi.close(); }
    const d = cot(conn);
    assert(d.ten_bai === 0 && d.band === 0, `DB thử (schema.sql) ${JSON.stringify(d)}`);
  });
}
