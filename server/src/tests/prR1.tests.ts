/**
 * PHÉP KIỂM GÓI R1 (rà 24/11 `docs/superpowers/specs/2026-11-24-ra-chan-cung/bao-cao.md` mục 1 — hổng logic máy chủ). Mỗi phép chạy câu SQL mới thật
 * (libsql thiếu tham số gắn NULL im lặng — phép kiểm bắt kết quả, không đọc nguồn). Mọi ghi trong BEGIN … ROLLBACK.
 *   L1  chủ Case hết vai / bị xoá = "chưa có người": caseChuaCoNguoi, Công việc `owner:`, lọc noOwner, tên "(đã nghỉ)", phân công lại gán người mới + lịch sử
 */
export async function runPrR1Tests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nGÓI R1 · hổng logic máy chủ');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const owner: any = await import('../cases/owner.ts');
  const cases: any = await import('../cases/cases.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { HV_DANG_HOC_SQL, CASE_SAU_THI_SQL } = await import('../students/tamDung.ts');

  check('L1 · chủ Case gỡ hết vai → Case "chưa có người" (Tổng quan = Công việc = lọc), tên "(đã nghỉ)"; phân công lại → người theo luật, lịch sử ghi người cũ', () => thu(() => {
    /* Case mở, không tạm, em đang học, không sau thi; chủ là GV môn (không phải GVCN) của lớp có GVCN khác. */
    const c = one(`SELECT sc.id, sc.owner_user_id AS chu, COALESCE(a.class_id, cur.class_id) AS lop, s.id AS sid FROM sos_cases sc
        LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
        JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
       WHERE sc.status != 'done' AND sc.tam = 0 AND sc.owner_user_id IS NOT NULL AND NOT ${CASE_SAU_THI_SQL('sc', 's.id')}
         AND NOT EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = COALESCE(a.class_id, cur.class_id) AND t.user_id = sc.owner_user_id AND t.is_core = 1)
         AND EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = COALESCE(a.class_id, cur.class_id) AND t.status = 'active' AND t.is_core = 1)
       ORDER BY sc.id LIMIT 1`);
    assert(c, 'seed thiếu Case có chủ là GV môn');
    const coTrong = () => owner.caseChuaCoNguoi(P.admin, null).some((r: any) => r.id === c.id);
    const viec = () => (myWork(P.admin, { nguoi: "tat-ca" } as any).items ?? []).some((i: any) => i.key === `owner:${c.id}`);
    xoaNho();
    assert(!coTrong() && !viec(), 'Case có chủ còn làm đã nằm trong "chưa có người"');
    accounts.setRoles(P.admin, c.chu, []);   // gỡ hết vai — `donGiaoHetHieuLuc` không đụng Case (không luật mới)
    xoaNho();
    assert(one('SELECT owner_user_id AS o FROM sos_cases WHERE id = ?', c.id).o === c.chu, 'gỡ vai không được tự đổi chủ Case');
    assert(coTrong(), 'caseChuaCoNguoi bỏ sót Case chủ đã gỡ vai');
    assert(viec(), 'Công việc thiếu dòng owner: của Case chủ đã gỡ vai');
    const ds = cases.listCases(P.admin, { noOwner: true, studentId: c.sid });
    const dong = ds.rows.find((r: any) => r.id === c.id);
    assert(dong, 'lọc noOwner bỏ sót Case');
    assert(/ \(đã nghỉ\)$/.test(dong.ownerName ?? ''), `tên chủ không có "(đã nghỉ)": ${dong.ownerName}`);
    /* Phân công lớp gọi `ganChuCaseThieu` — người cũ còn phân công đang chạy thì đóng trước (như xoá tài khoản). */
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE user_id = ? AND status = 'active'`).run(c.chu);
    xoaNho();
    const n = owner.ganChuCaseThieu({ classId: c.lop, actorId: P.admin.userId, luc: '2026-11-24T03:00:00.000Z' });
    const moi = one('SELECT owner_user_id AS o FROM sos_cases WHERE id = ?', c.id).o;
    assert(n >= 1 && moi !== null && moi !== c.chu, `chưa gán người mới (n=${n}, chủ=${moi})`);
    const ls = one(`SELECT old_value, new_value FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' ORDER BY id DESC LIMIT 1`, c.id);
    assert(ls?.old_value === String(c.chu) && ls?.new_value === String(moi), `lịch sử: ${JSON.stringify(ls)}`);
    xoaNho();
    assert(!coTrong(), 'Case đã có người mới vẫn ở "chưa có người"');
  }));

  const { hanBaoPhHieuLuc } = await import('../../../shared/domain/index.ts');
  const { khoangTamDung } = await import('../students/tamDung.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const { viecXongCn } = await import('../phanTich/viecDaXong.ts');
  check('L2 · em Tạm dừng → Quay lại: hạn Báo PH ở Đang theo dõi / panel Phối hợp TVV / Phân tích = hạn panel (khoangTamDung), không phải hạn gốc', () => thu(() => {
    const em = one(`SELECT s.id, s.branch_id AS cn FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE s.status = 'active' AND s.branch_id IS NOT NULL ORDER BY s.id LIMIT 1`);
    const x = one(`SELECT x.id, x.student_id AS sid FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id
       WHERE NOT EXISTS (SELECT 1 FROM viec_bao_ph v WHERE v.phoi_hop_id = x.id) ORDER BY x.id LIMIT 1`);
    assert(em && x, 'seed thiếu em / việc phối hợp');
    const han = '2026-11-10';
    const suKien = (sid: number) => {
      for (const [loai, ngay] of [['pause', '2026-11-08'], ['resume', '2026-11-20']]) {
        conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, ?, ?, 'thử L2', ?)`).run(sid, loai, ngay, '2026-11-20T03:00:00.000Z');
      }
      return hanBaoPhHieuLuc(han, khoangTamDung([sid])[sid] ?? [], null);   // hạn như panel việc (`hanCua`)
    };
    const ins = (sid: number, tt: string, phoiHop: number | null) => Number(conn.prepare(
      `INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, phoi_hop_id) VALUES (?, 'Thử L2', ?, ?, '2026-11-06T03:00:00.000Z', ?)`).run(sid, han, tt, phoiHop).lastInsertRowid);
    const mong = suKien(em.id);
    assert(mong > han, `khoảng Tạm dừng không dời hạn (${mong})`);
    /* Đang theo dõi */
    const mo = ins(em.id, 'mo', null);
    conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('bao_ph', ?, ?, 'tay', '2026-11-06T03:00:00.000Z')`).run(mo, P.admin.userId);
    xoaNho();
    const dong = gv.viecTheoDoi(P.admin).nhom.flatMap((n: any) => n.mo).find((d: any) => d.loai === 'bao_ph' && d.refId === mo);
    assert(dong?.han === mong, `Đang theo dõi: hạn ${dong?.han}, panel ${mong}`);
    /* Panel Phối hợp (việc TVV sau Meeting CX) */
    const mong2 = x.sid === em.id ? mong : suKien(x.sid);
    const v2 = ins(x.sid, 'mo', x.id);
    xoaNho();
    assert(ph.tvvCuaHanhDong(P.admin, [x.id]).get(x.id)?.han === mong2, `Phối hợp TVV: hạn ${ph.tvvCuaHanhDong(P.admin, [x.id]).get(x.id)?.han}, panel ${mong2} (việc ${v2})`);
    /* Phân tích — việc đã xong: hạn so đúng hạn dời; báo ngày 18/11 (trước hạn dời) là đúng hạn */
    const xong = ins(em.id, 'xong', null);
    conn.prepare(`UPDATE students SET consultant_user_id = COALESCE(consultant_user_id, ?) WHERE id = ?`).run(P.admin.userId, em.id);
    conn.prepare(`INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_luc) VALUES (?, 'da_bao', '2026-11-18', '2026-11-18T03:00:00.000Z')`).run(xong);
    const r = viecXongCn({ cn: em.cn, khung: 'ft', tu: '2026-11-01', cuoi: '2026-11-30', homNay: '2026-11-24' }).find((d: any) => d.key === `bao-ph:${xong}`);
    assert(r?.due === mong && r.dung === true, `Phân tích: ${JSON.stringify(r && { due: r.due, dung: r.dung })}, panel ${mong}`);
  }));

  check('L3 · Xác nhận Phối hợp: việc hệ thống bỏ → 400 (như Khôi phục); việc người dùng bỏ xác nhận thẳng (RKC-3a); câu so-và-đổi (updated_at NULL) ghi đúng', () => thu(() => {
    const x = one("SELECT id FROM sos_coordination_actions WHERE kind = 'talk_family' ORDER BY id LIMIT 1");
    assert(x, 'seed thiếu việc phối hợp');
    const dat = (tt: string, ly: string | null) => conn.prepare(`UPDATE sos_coordination_actions SET status = ?, remove_reason_code = ?, updated_at = NULL, performed_on = NULL WHERE id = ?`).run(tt, ly, x.id);
    const xn = () => ph.confirmCoordination(P.admin, x.id, { performedOn: TODAY, note: 'Đã gọi gia đình, em hứa đi học đều — thử L3 ghi đủ dài.' });
    const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
    dat('removed', 'system_sos_changed');
    assert(ma(xn) === 400, 'việc hệ thống bỏ vẫn xác nhận được');
    assert(one('SELECT status FROM sos_coordination_actions WHERE id = ?', x.id).status === 'removed', 'việc hệ thống bỏ đã bị đổi');
    dat('removed', 'not_needed');
    const kq = xn();
    assert(kq.status === 'done', `việc người dùng bỏ không xác nhận thẳng được (${kq.status})`);
    dat('pending', null);
    assert(ma(xn) === null && one('SELECT status, updated_at FROM sos_coordination_actions WHERE id = ?', x.id).updated_at, 'việc chờ (updated_at NULL) không xác nhận được — so-và-đổi sai');
    /* Lần sau: đã xong → sửa (OV-7a), so với updated_at vừa ghi. */
    assert(ma(xn) === null, 'sửa việc đã xong (updated_at có giá trị) lỗi');
  }));

  const ab: any = await import('../fasttrack/absence.ts');
  const { voiXacNhan } = await import('../platform/nguCanhRequest.ts');
  check('L5 · Báo vắng trên lượt đã huỷ mà kiểm lỗi (kỹ năng không có) → lượt vẫn huỷ, không mở lại nửa chừng', () => thu(() => {
    const a = one(`SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id WHERE a.kind = 'mock' AND a.status = 'planned' AND a.class_id IS NOT NULL ORDER BY a.id LIMIT 1`);
    assert(a, 'seed thiếu lượt Mock');
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(a.id);
    let loi: any = null;
    try { voiXacNhan(() => ab.baoVang(P.admin, a.id, 'khong_co_ky_nang', null)); } catch (e) { loi = e; }
    assert(loi?.status === 400, `phải 400 (kỹ năng không có): ${loi?.status} ${loi?.message}`);
    assert(one('SELECT status FROM assessment_attempts WHERE id = ?', a.id).status === 'cancelled', 'lượt đã bị khôi phục dù báo vắng lỗi');
  }));
}
