/**
 * PHÉP KIỂM SUA-LUU-TRU a (chủ SP 07/11, plan.md mục 4 "SỬA HV LƯU TRỮ + ĐỔI BƯỚC TIẾP" việc 1, 5):
 *   (1) Kết quả thi thật sửa được cả với em đã lưu trữ — ⋯ hồ sơ có mục (cờ `viewer.coTheNhapThiThat` = `coTheNhapThiThat`);
 *   (2) mỗi lần lưu ghi bản trước ĐỦ CỘT (`_hoan`: lộ trình + bản chụp mới nhất) vào nhật ký `cycle.thi_that` → Hoàn tác / "Khôi phục bản trước" trả đúng;
 *   (3) Hoàn tác (toast) bị chặn khi đã có người sửa sau (409, không đè); Khôi phục từ Lịch sử thì được; khôi phục cũng hoàn tác được;
 *   (4) đã chọn bước tiếp mà kết quả đổi → `kqDaDoi` (dòng nhắc nhẹ), khôi phục về đúng kết quả lúc chọn → hết nhắc.
 */
export async function runPrSuaLuuTruATests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const lichSu: any = await import('../platform/lichSu.ts');
  const profile: any = await import('../students/profile.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSUA-LUU-TRU a — thi thật em lưu trữ: sửa · Hoàn tác · Khôi phục bản trước · nhắc xem lại bước tiếp');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const COT = 'thi_that_ngay, thi_that_l, thi_that_r, thi_that_w, thi_that_s, thi_that_khong_thi, thi_that_nhap_boi, thi_that_nhap_luc, outcome, outcome_score, outcome_note, thi_that_target, thi_that_lay_lai';
  const COT_BC = 'thi_that_ngay, thi_that_l, thi_that_r, thi_that_w, thi_that_s, thi_that_ovr, thi_that_khong_thi, thi_that_nhap_boi, thi_that_nhap_luc, ket_luan, lam_moi_luc';
  const ly = (id: number) => JSON.stringify(get(`SELECT ${COT} FROM learning_cycles WHERE id = ?`, id));
  const bc = (id: number) => JSON.stringify(get(`SELECT ${COT_BC} FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1`, id));
  /** Em FT đang học ở MB, lộ trình FT đang chạy — nhập KQ thi thật trượt (Target 7) rồi chọn "Kết thúc học" → đã lưu trữ. */
  const emKetThuc = () => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
          AND cy.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = s.id)
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`);
    assert(r, 'seed cần em FT MB đang học');
    conn.prepare('UPDATE learning_cycles SET target_score = 7, khong_cam_ket = 0 WHERE id = ?').run(r.cy);
    thiThat.datKetQuaThiThat(QL, r.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    buocTiep.chonBuocTiep(QL, r.cy, { chon: 'ket_thuc' });
    const s = get('SELECT status, archived_at FROM students WHERE id = ?', r.sid);
    assert(s.status === 'finished' && s.archived_at, `tiền đề: em chưa Kết thúc học + lưu trữ (${JSON.stringify(s)})`);
    xoaNho();
    return r as { sid: number; cy: number };
  };

  check('SLT-a1 · em đã lưu trữ: sửa điểm → trả `khoiPhucId`; Hoàn tác trả ĐÚNG mọi cột lộ trình + bản chụp (người nhập, lúc nhập, Target lúc nhập, kết luận)', () => thu(() => {
    const x = emKetThuc();
    const truoc = { ly: ly(x.cy), bc: bc(x.cy) };
    const r = thiThat.datKetQuaThiThat(P.mbConsultant ?? QL, x.cy, { l: 7.5, r: 7, w: 7, s: 7 });
    assert(Number.isInteger(r.khoiPhucId), `thiếu khoiPhucId: ${r.khoiPhucId}`);
    assert(get('SELECT outcome FROM learning_cycles WHERE id = ?', x.cy).outcome === 'reached', 'điểm mới chưa Đạt Target');
    assert(bc(x.cy) !== truoc.bc, 'bản chụp không đổi theo kết quả mới');
    const kp = thiThat.khoiPhucThiThat(QL, x.cy, { auditId: r.khoiPhucId, hoanTac: true });
    assert(ly(x.cy) === truoc.ly, `lộ trình chưa về bản trước:\n${ly(x.cy)}\n${truoc.ly}`);
    assert(bc(x.cy) === truoc.bc, `bản chụp chưa về bản trước:\n${bc(x.cy)}\n${truoc.bc}`);
    /* Khôi phục cũng là một lần lưu có bản trước — hoàn tác được (về điểm 7.5). */
    assert(Number.isInteger(kp.khoiPhucId) && kp.khoiPhucId > r.khoiPhucId, 'khôi phục không trả khoiPhucId mới');
    thiThat.khoiPhucThiThat(QL, x.cy, { auditId: kp.khoiPhucId, hoanTac: true });
    assert(get('SELECT thi_that_l FROM learning_cycles WHERE id = ?', x.cy).thi_that_l === 7.5, 'hoàn tác lần khôi phục không về 7.5');
  }));

  check('SLT-a2 · Hoàn tác khi đã có người sửa sau → 409 (không đè); Khôi phục bản trước (Lịch sử) của mục cũ thì được', () => thu(() => {
    const x = emKetThuc();
    const goc = ly(x.cy);
    const a = thiThat.datKetQuaThiThat(QL, x.cy, { l: 7 });
    thiThat.datKetQuaThiThat(QL, x.cy, { r: 7 });
    assertThrows(() => thiThat.khoiPhucThiThat(QL, x.cy, { auditId: a.khoiPhucId, hoanTac: true }), /sửa kết quả sau/, 'hoàn tác đè lần sửa sau');
    thiThat.khoiPhucThiThat(QL, x.cy, { auditId: a.khoiPhucId });
    const sau = get('SELECT thi_that_l, thi_that_r FROM learning_cycles WHERE id = ?', x.cy);
    assert(sau.thi_that_l === 6 && sau.thi_that_r === 6, `khôi phục mục cũ: ${JSON.stringify(sau)}`);
    assert(JSON.parse(ly(x.cy)).thi_that_l === JSON.parse(goc).thi_that_l, 'không về bản gốc');
  }));

  check('SLT-a2b · lộ trình đóng (chụp lần mới) SAU lần lưu → Khôi phục: bản chụp mới nhất tính lại theo kết quả khôi phục (không lệch lộ trình)', () => thu(() => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
          AND cy.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = s.id)
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id DESC LIMIT 1`);
    conn.prepare('UPDATE learning_cycles SET target_score = 7, khong_cam_ket = 0 WHERE id = ?').run(r.cy);
    thiThat.datKetQuaThiThat(QL, r.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    const a = thiThat.datKetQuaThiThat(QL, r.cy, { l: 8, r: 8, w: 8, s: 8 });
    buocTiep.chonBuocTiep(QL, r.cy, { chon: 'ket_thuc' });
    xoaNho();
    const bc0 = get('SELECT thi_that_l, ket_luan FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1', r.cy);
    assert(bc0?.thi_that_l === 8 && bc0.ket_luan === 'reached', `tiền đề bản chụp: ${JSON.stringify(bc0)}`);
    thiThat.khoiPhucThiThat(QL, r.cy, { auditId: a.khoiPhucId });
    const bc = get('SELECT thi_that_l, thi_that_ovr, ket_luan FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1', r.cy);
    assert(bc.thi_that_l === 6 && bc.thi_that_ovr === 6 && bc.ket_luan === 'not_reached', `bản chụp lệch: ${JSON.stringify(bc)}`);
  }));

  check('SLT-a3 · quyền + đầu vào: GVBM / QL chi nhánh khác → 403; nhật ký của lộ trình khác / sai id → 404; nhật ký cũ không có bản trước → 400', () => thu(() => {
    const x = emKetThuc();
    const a = thiThat.datKetQuaThiThat(QL, x.cy, { l: 7 });
    assertThrows(() => thiThat.khoiPhucThiThat(P.cpManager, x.cy, { auditId: a.khoiPhucId }), /GVCN lớp cuối|Quản lý/, 'QL chi nhánh khác');
    const khac = get(`SELECT id FROM learning_cycles WHERE id != ? AND route IS NOT NULL ORDER BY id LIMIT 1`, x.cy).id;
    assertThrows(() => thiThat.khoiPhucThiThat(QL, khac, { auditId: a.khoiPhucId }), /Không tìm thấy bản trước/, 'nhật ký lộ trình khác');
    assertThrows(() => thiThat.khoiPhucThiThat(QL, x.cy, { auditId: 'abc' }), /không hợp lệ/, 'id sai');
    const cu = Number(conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_json, after_json, created_at)
      VALUES (?, 'cycle.thi_that', 'learning_cycle', ?, '{"l":5}', '{"l":6}', ?)`).run(QL.userId, x.cy, new Date().toISOString()).lastInsertRowid);
    assertThrows(() => thiThat.khoiPhucThiThat(QL, x.cy, { auditId: cu }), /trước khi có Khôi phục/, 'nhật ký cũ');
  }));

  check('SLT-a4 · Lịch sử thi thật: mục có bản trước → `khoiPhuc` (người nhập được); QL chi nhánh khác không xem; mục cũ không có cờ', () => thu(() => {
    const x = emKetThuc();
    thiThat.datKetQuaThiThat(QL, x.cy, { l: 7 });
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_json, after_json, created_at)
      VALUES (?, 'cycle.thi_that', 'learning_cycle', ?, '{"r":5}', '{"r":6}', ?)`).run(QL.userId, x.cy, new Date(Date.now() + 60000).toISOString());
    const ls = lichSu.lichSu(QL, { loai: 'thi-that', id: x.cy });
    assert(!ls.dong[0]?.khoiPhuc && ls.dong[0]?.truong[0]?.ten === 'R', `mục cũ (không bản trước) có khoiPhuc: ${JSON.stringify(ls.dong[0])}`);
    assert(ls.dong[1]?.khoiPhuc === true, `mục có bản trước thiếu khoiPhuc: ${JSON.stringify(ls.dong[1])}`);
    assertThrows(() => lichSu.lichSu(P.cpManager, { loai: 'thi-that', id: x.cy }), /xem được lịch sử/, 'QL chi nhánh khác xem');
  }));

  check('SLT-a5 · ⋯ hồ sơ: em lưu trữ có "Kết quả thi thật" khi `nhapThiThat`; không có cờ → không; em đang học giữ luật cũ', () => {
    const lopHoc = { chiXem: true, quyen: { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false, boLuuTru: false } };
    const co = (o: any) => d.mucQuanLyHocVien({ canEdit: false, lopHoc, cycle: { ratio: false }, status: 'finished', ...o }).some((m: any) => m.key === 'outcome');
    assert(co({ nhapThiThat: true }), 'em lưu trữ + nhập được → thiếu mục');
    assert(!co({ nhapThiThat: false, canEdit: true }), 'em lưu trữ không nhập được → vẫn có mục');
    assert(d.mucQuanLyHocVien({ canEdit: true, lopHoc: { ...lopHoc, chiXem: false }, cycle: { ratio: false }, status: 'active' }).some((m: any) => m.key === 'outcome'), 'em đang học mất mục');
  });

  check('SLT-a6 · hồ sơ em đã lưu trữ: `viewer.coTheNhapThiThat` theo `coTheNhapThiThat` (QL có, QL chi nhánh khác không)', () => thu(() => {
    const x = emKetThuc();
    assert(profile.studentProfile(QL, x.sid).viewer.coTheNhapThiThat === true, 'QL thiếu cờ');
    xoaNho();
    let v: any = null;
    try { v = profile.studentProfile(P.cpManager, x.sid).viewer; } catch { v = null; }
    assert(!v?.coTheNhapThiThat, 'QL chi nhánh khác có cờ');
  }));

  check('SLT-a7 · đã chọn bước tiếp → sửa điểm: `kqDaDoi` (nhắc nhẹ, không chặn); khôi phục về kết quả lúc chọn → hết nhắc', () => thu(() => {
    const x = emKetThuc();
    assert(buocTiep.trangThaiBuocTiep(QL, x.cy).kqDaDoi === false, 'vừa chọn đã nhắc');
    const a = thiThat.datKetQuaThiThat(QL, x.cy, { l: 8, r: 8, w: 8, s: 8 });
    assert(buocTiep.trangThaiBuocTiep(QL, x.cy).kqDaDoi === true, 'sửa điểm không nhắc');
    thiThat.khoiPhucThiThat(QL, x.cy, { auditId: a.khoiPhucId, hoanTac: true });
    assert(buocTiep.trangThaiBuocTiep(QL, x.cy).kqDaDoi === false, 'khôi phục vẫn nhắc');
  }));
}
