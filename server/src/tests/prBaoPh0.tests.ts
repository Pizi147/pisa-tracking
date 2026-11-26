/**
 * BAOPH-0 (N72 ⑤ ⑥ C8, chủ SP 26/11): Trao đổi gia đình + Báo PH kết quả Progress / Final = việc TVV (GVCN / Head thôi), theo dõi mặc định Head + CX + người tạo;
 * Meeting không sinh Báo PH thứ hai khi lượt có Trao đổi gia đình (không TVV → Head); migrate (chạy lại không đổi, khôi phục được); 4.6 giao việc Xử lý vi phạm /
 * Đã thực hiện + việc con; Lưu trữ đóng khối giao việc mới. Mỗi ca cuộn lại (SAVEPOINT).
 */
export async function runPrBaoPh0Tests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nBAOPH-0 · việc TVV báo PH từ mọi nguồn · C8 · giao việc Ý thức');
  const { loadPrincipal } = await import('../permissions.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const gv: any = await import('../worklist/giaoViec.ts');
  const mig: any = await import('../migrate/prBaoPh0.ts');
  const luu: any = await import('../students/dongLuuTru.ts');
  const mg: any = await import('../worklist/mgmttasks.ts');
  const tq: any = await import('../worklist/tongQuanV5.ts');
  const sc: any = await import('../cases/systemClose.ts');
  const ac: any = await import('../yThuc/access.ts');
  t.attempts = await import('../fasttrack/attempts.ts');
  const hz: any = await import('../classes/hoanTacChuyenNgay.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (ten: string, fn: () => void) => {
    conn.exec(`SAVEPOINT ${ten}`);
    try { xoaNho(); fn(); } finally { conn.exec(`ROLLBACK TO ${ten}`); conn.exec(`RELEASE ${ten}`); xoaNho(); }
  };
  const khoa = (p: any) => { xoaNho(); return new Set<string>((myWork(p, {} as any).items as any[]).map((i: any) => i.key)); };
  const loi = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return `${e.status ?? ''} ${e.message}`; } };
  const nguon = (id: number) => get('SELECT status, performed_by AS boi, remove_reason_code AS ly_do FROM sos_coordination_actions WHERE id = ?', id);
  /* Một lượt Mock có Trao đổi gia đình đang chờ, em có TVV + lớp có GVCN. */
  const tf = get(`SELECT x.id, x.attempt_id, x.student_id, s.consultant_user_id AS tvv,
      (SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active' WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) AS gvcn
    FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id AND s.archived_at IS NULL
    WHERE x.kind = 'talk_family' AND x.status = 'pending' AND s.consultant_user_id IS NOT NULL ORDER BY x.id LIMIT 1`);

  check('BP0-1 · Trao đổi gia đình = việc TVV: có việc + theo dõi GVCN/Head; GVCN không còn dòng, không xác nhận / bỏ được; TVV ghi → nguồn theo (xong · mở lại · bỏ · khôi phục)', () => thu('bp1', () => {
    assert(tf && tf.gvcn, 'seed: cần Trao đổi gia đình đang chờ (em có TVV, lớp có GVCN)');
    const v = get('SELECT id, trang_thai, nhan FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id);
    assert(v?.trang_thai === 'mo' && v.nhan === 'Trao đổi với gia đình', `việc TVV: ${JSON.stringify(v)}`);
    const td = new Set((conn.prepare(`SELECT user_id FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ?`).all(v.id) as any[]).map((r) => r.user_id));
    assert(td.has(tf.gvcn), 'GVCN theo dõi việc TVV');
    assert(td.has(P.mbManager.userId) || get('SELECT 1 AS c FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND nguon = ?', 'bao_ph', v.id, 'head'), 'Head theo dõi việc TVV');
    const pG = loadPrincipal(tf.gvcn), pT = loadPrincipal(tf.tvv);
    assert(![...khoa(pG)].some((k) => k.endsWith(':talk_family')), 'GVCN còn dòng Trao đổi gia đình');
    assert(khoa(pT).has(`bao-ph:${v.id}`), 'TVV chưa có việc');
    assert(/TVV báo phụ huynh/.test(loi(() => ph.confirmCoordination(pG, tf.id, { performedOn: TODAY, note: 'Đã gọi cho mẹ em' }))), 'GVCN xác nhận được nguồn TVV');
    assert(/TVV báo phụ huynh/.test(loi(() => ph.removeCoordination(pG, tf.id, { reasonCode: 'not_needed' }))), 'GVCN bỏ được nguồn TVV');
    assert(/Báo PH của TVV/.test(loi(() => gv.xemGiaoViec(pG, 'phoi_hop', tf.id))), 'giao việc trên dòng nguồn');
    bp.ghiKetQuaBaoPh(pT, { viecIds: [v.id], ketQua: 'da_bao', ngay: TODAY, ghiChu: 'Đã báo mẹ em kết quả MT và lịch họp.' });
    assert(nguon(tf.id).status === 'done' && nguon(tf.id).boi === tf.tvv, `Đã báo PH → nguồn xong, người làm = TVV: ${JSON.stringify(nguon(tf.id))}`);
    assert(!khoa(pT).has(`bao-ph:${v.id}`), 'TVV còn việc sau khi báo');
    bp.ghiKetQuaBaoPh(pT, { viecIds: [v.id], ketQua: 'chua_lien_he', ngay: TODAY, ghiChu: 'Ghi nhầm — gọi lại chưa được.' });
    assert(nguon(tf.id).status === 'pending', 'Chưa liên hệ được (sửa nhầm) → nguồn mở lại');
    bp.boViecBaoPh(pT, v.id, { lyDo: 'not_needed' });
    assert(nguon(tf.id).status === 'removed' && nguon(tf.id).ly_do === 'not_needed', 'Bỏ việc → nguồn bỏ cùng lý do');
    bp.khoiPhucViecBaoPh(pT, v.id);
    assert(nguon(tf.id).status === 'pending' && get('SELECT trang_thai AS t FROM viec_bao_ph WHERE id = ?', v.id).t === 'mo', 'Khôi phục → cả hai mở lại');
  }));

  check('BP0-2 · số việc: GVCN thêm Trao đổi gia đình → GVCN +0, TVV +1; TVV bỏ → TVV −1; sửa điểm gỡ nguồn → việc "Đã bỏ" lý do hệ thống', () => thu('bp2', () => {
    const l = get(`SELECT a.id, a.student_id, s.consultant_user_id AS tvv, a.attempt_no,
        (SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active' WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) AS gvcn
      FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.archived_at IS NULL AND s.consultant_user_id IS NOT NULL
      WHERE COALESCE(a.kind, 'mock') = 'mock' AND a.status != 'cancelled' AND EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id)
        AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'talk_family') ORDER BY a.id LIMIT 1`);
    if (!l?.gvcn) {
      /* Seed mọi lượt SOS đều có Trao đổi gia đình → xoá nguồn của một lượt để thử thêm tay. */
      conn.prepare(`DELETE FROM viec_bao_ph WHERE phoi_hop_id = ?`).run(tf.id);
      conn.prepare(`DELETE FROM sos_coordination_actions WHERE id = ?`).run(tf.id);
    }
    const luot = l?.gvcn ? l : { id: tf.attempt_id, student_id: tf.student_id, tvv: tf.tvv, gvcn: tf.gvcn };
    const pG = loadPrincipal(luot.gvcn), pT = loadPrincipal(luot.tvv);
    const g0 = khoa(pG).size, t0 = khoa(pT).size;
    xoaNho(); const tq0 = tq.tongQuanTvv(pT), kpi0 = tq0.baoPh.tong;
    const a = ph.addCoordination(pG, luot.id, { kind: 'talk_family' });
    const v = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', a.id);
    assert(v, 'thêm tay Trao đổi gia đình không sinh việc TVV');
    /* [XM] 1 (PTA rà #2233): KPI "Báo PH đúng hạn" của TVV đếm cả việc TVV nguồn Phối hợp. */
    conn.prepare('UPDATE viec_bao_ph SET tao_luc = ? WHERE id = ?').run(`${tq0.ky.den}T03:00:00.000Z`, v.id);
    xoaNho(); assert(tq.tongQuanTvv(pT).baoPh.tong === kpi0 + 1, `KPI Báo PH đúng hạn không đếm việc nguồn Phối hợp: ${kpi0} → ${tq.tongQuanTvv(pT).baoPh.tong}`);
    assert(get(`SELECT 1 AS c FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? AND user_id = ?`, v.id, luot.gvcn), 'GVCN thêm → theo dõi');
    assert(khoa(pG).size === g0 && khoa(pT).size === t0 + 1, `số việc GVCN ${g0}→${khoa(pG).size}, TVV ${t0}→${khoa(pT).size}`);
    bp.boViecBaoPh(pT, v.id, { lyDo: 'not_needed' });
    assert(khoa(pT).size === t0, 'TVV bỏ → về số cũ');
    bp.khoiPhucViecBaoPh(pT, v.id);
    /* nguồn hệ thống gỡ (như sửa điểm hết SOS) → việc đóng lý do hệ thống; hồi → mở lại. */
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed' WHERE id = ?`).run(a.id);
    bp.dongBoViecTvvLuot([luot.id]);
    assert(get('SELECT bo_ly_do AS l FROM viec_bao_ph WHERE id = ?', v.id).l === 'system_nguon_go', 'nguồn gỡ → việc Đã bỏ lý do hệ thống');
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL WHERE id = ?`).run(a.id);
    bp.dongBoViecTvvLuot([luot.id]);
    assert(get('SELECT trang_thai AS t FROM viec_bao_ph WHERE id = ?', v.id).t === 'mo', 'nguồn hồi → việc mở lại');
  }));

  check('BP0-3 · C8: lượt có Trao đổi gia đình → xác nhận Meeting KHÔNG sinh Báo PH Meeting (hai phần Meeting vẫn sinh); không TVV → Head giữ việc Báo PH', () => thu('bp3', () => {
    assert(tf, 'seed');
    const pG = loadPrincipal(tf.gvcn);
    const m = ph.addCoordination(pG, tf.attempt_id, { kind: 'cx_meeting_family' });
    ph.confirmCoordination(pG, m.id, { performedOn: TODAY, note: 'GVCN xác nhận họp gia đình với CX.' });
    assert(!get('SELECT 1 AS c FROM viec_bao_ph WHERE phoi_hop_id = ?', m.id), 'C8: còn sinh Báo PH Meeting');
    assert((get('SELECT COUNT(*) AS n FROM meeting_phan WHERE phoi_hop_id = ?', m.id).n) === 2, 'Meeting còn đủ hai phần');
    /* Em không TVV: việc TVV về Head (không GVCN). */
    const v = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id);
    conn.prepare('UPDATE students SET consultant_user_id = NULL WHERE id = ?').run(tf.student_id);
    const k = gv.xemGiaoViec(P.admin, 'bao_ph', v.id);
    assert(!k.macDinh.some((n: any) => n.id === tf.gvcn) && k.macDinh.length > 0, `không TVV → người theo luật: ${JSON.stringify(k.macDinh)}`);
    assert(!bp.coTheGhi(pG, { consultant_user_id: null, student_id: tf.student_id, phoi_hop_id: tf.id }) || P.mbManager.userId === tf.gvcn, 'GVCN còn ghi được Báo PH khi em không TVV');
  }));

  check('BP0-4 · migrate: nguồn chờ → việc TVV; Báo PH Meeting mở gộp vào Trao đổi gia đình / đổi thành Trao đổi gia đình; chạy lại không đổi; khôi phục trả lại', () => thu('bp4', () => {
    assert(tf, 'seed');
    const now = new Date().toISOString();
    /* Dựng trạng thái trước BAOPH-0: Trao đổi gia đình chưa có việc TVV; một Báo PH Meeting đang mở cùng lượt. */
    const cu = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id).id;
    gv.donViec('bao_ph', [cu]); conn.prepare('DELETE FROM viec_bao_ph WHERE id = ?').run(cu);
    const m = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at, updated_at) VALUES (?, ?, 'cx_meeting_student', 'done', ?, ?)`)
      .run(tf.attempt_id, tf.student_id, now, now).lastInsertRowid);
    const bm = Number(conn.prepare(`INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, phoi_hop_id) VALUES (?, 'Meeting', ?, 'mo', ?, ?)`).run(tf.student_id, TODAY, now, m).lastInsertRowid);
    const k = mig.doiBaoPh0(conn);
    const moi = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id);
    assert(moi && k.taoViec.includes(moi.id), `việc TVV mới: ${JSON.stringify(k.taoViec.slice(0, 5))}`);
    assert(k.gop.includes(bm) && get('SELECT bo_ly_do AS l FROM viec_bao_ph WHERE id = ?', bm).l === 'system_gop_trao_doi', 'Báo PH Meeting chưa gộp');
    const k2 = mig.doiBaoPh0(conn);
    assert(!k2.taoViec.length && !k2.gop.length && !k2.chuyen.length, `chạy lại còn đổi: ${JSON.stringify(k2)}`);
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_label, after_json, created_at) VALUES (NULL, 'migrate.baoph0', 'viec_bao_ph', 'migrate', ?, ?)`).run(JSON.stringify(k), now);
    mig.khoiPhucBaoPh0(conn);
    assert(get('SELECT trang_thai AS t FROM viec_bao_ph WHERE id = ?', bm).t === 'mo', 'khôi phục: Báo PH Meeting mở lại');
    assert(!get('SELECT 1 AS c FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id), 'khôi phục: việc TVV migrate tạo (chưa ghi) gỡ');
    /* Rà #2233 P1-5: Trao đổi gia đình GVCN đã xác nhận (không việc TVV) → Báo PH Meeting GỘP, nguồn GVCN giữ nguyên kết quả. */
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'done', note = 'GVCN đã gọi' WHERE id = ?`).run(tf.id);
    const k3 = mig.doiBaoPh0(conn);
    assert(k3.gop.includes(bm) && !k3.chuyen.length && get('SELECT note FROM sos_coordination_actions WHERE id = ?', tf.id).note === 'GVCN đã gọi', `nguồn đã xong phải gộp: ${JSON.stringify(k3)}`);
    /* Trao đổi gia đình còn chờ, chưa có việc (lượt chưa đồng bộ) → việc Meeting đổi thành Trao đổi gia đình; việc Meeting thứ hai cùng lượt gộp. */
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL WHERE id = ?`).run(bm);
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'pending' WHERE id = ?`).run(tf.id);
    const m2 = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, status, created_at, updated_at) VALUES (?, ?, 'cx_meeting_family', 'done', ?, ?)`)
      .run(tf.attempt_id, tf.student_id, now, now).lastInsertRowid);
    const bm2 = Number(conn.prepare(`INSERT INTO viec_bao_ph (student_id, nhan, han, trang_thai, tao_luc, phoi_hop_id) VALUES (?, 'Meeting 2', ?, 'mo', ?, ?)`).run(tf.student_id, TODAY, now, m2).lastInsertRowid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(tf.attempt_id);   // không cho ① sinh việc (N46 / lượt huỷ) — giữ "chưa có việc"
    const k4 = mig.doiBaoPh0(conn);
    /* Rà vòng 2 P1-A: lượt huỷ / sau thi thật → GỘP cả hai (không tạo việc ẩn còn mở, không ghi đè nguồn). */
    assert(!k4.chuyen.length && k4.gop.includes(bm) && k4.gop.includes(bm2) && !get('SELECT 1 AS c FROM viec_bao_ph WHERE phoi_hop_id = ? AND trang_thai = ?', tf.id, 'mo'), `gộp cả hai: ${JSON.stringify(k4)}`);
  }));

  /* Em đang có việc Xử lý vi phạm của GVCN (luật Ý thức). */
  const xl: any = (() => {
    xoaNho();
    const it = (myWork(P.admin, { nguoi: 'tat-ca' } as any).items as any[]).find((i: any) => i.group === 'yt_xu_ly' && i.ownerId);
    return it ? { sid: it.studentId as number, gvcn: it.ownerId as number } : null;
  })();

  check('BP0-5 · 4.6 giao Xử lý vi phạm: người được giao thấy việc + làm được; GVCN thôi dòng; hạn sửa được; Hoàn tác về GVCN; lưu xử lý xoá khối giao việc', () => thu('bp5', () => {
    assert(xl, 'seed: cần em có việc Xử lý vi phạm');
    const pG = loadPrincipal(xl.gvcn);
    const k0 = gv.xemGiaoViec(pG, 'xu_ly', xl.sid);
    assert(k0.mo && k0.phuTrach[0]?.id === xl.gvcn && k0.han, `khối mặc định: ${JSON.stringify({ mo: k0.mo, pt: k0.phuTrach, han: k0.han })}`);
    const nhan = P.mbManager.userId;
    const k1 = gv.doiPhuTrach(pG, 'xu_ly', xl.sid, { userId: nhan, phuTrachCu: null });
    assert(k1.duocGiao && k1.hoanTac, 'giao không thành');
    assert(!khoa(pG).has(`yt_xu_ly:${xl.sid}`), 'GVCN còn dòng sau khi giao');
    assert(khoa(P.mbManager).has(`yt_xu_ly:${xl.sid}`), 'người được giao chưa thấy việc');
    gv.hoanTacGiao(pG, 'xu_ly', xl.sid);
    assert(khoa(pG).has(`yt_xu_ly:${xl.sid}`), 'Hoàn tác: việc về GVCN');
    const han = conn.prepare(`SELECT date(?, '+9 day') d`).get(TODAY).d;
    const k2 = gv.suaHan(pG, 'xu_ly', xl.sid, { han, hanCu: null });
    assert(k2.han === han && k2.hanChon === han, 'hạn đặt tay');
    xoaNho();
    assert((myWork(pG, {} as any).items as any[]).find((i: any) => i.key === `yt_xu_ly:${xl.sid}`)?.due === han, 'hạn đặt tay chưa lên dòng GVCN');
    gv.xongViecXuLy([xl.sid]);
    assert(get('SELECT trang_thai AS t FROM viec_xu_ly WHERE id = ?', xl.sid).t === 'xong', 'lưu xử lý: khối giao việc chưa xong');
    /* Rà #2233 P2-1: đợt sau giao lại → dòng mới, không mang hạn / người của đợt trước. */
    gv.doiPhuTrach(pG, 'xu_ly', xl.sid, { userId: nhan, phuTrachCu: null });
    assert(get('SELECT han_chon AS h, trang_thai AS t FROM viec_xu_ly WHERE id = ?', xl.sid).h === null, 'đợt sau còn hạn cũ');
  }));

  const nguonTvv = (kind: string) => get(`SELECT x.id, x.attempt_id, v.id AS viec FROM sos_coordination_actions x JOIN viec_bao_ph v ON v.phoi_hop_id = x.id AND v.trang_thai = 'mo'
      WHERE x.kind = ? AND x.status = 'pending' ORDER BY x.id LIMIT 1`, kind);
  const tt = (viec: number) => get('SELECT trang_thai AS t, bo_ly_do AS l FROM viec_bao_ph WHERE id = ?', viec);

  check('BP0-8 · rà #2233 P1-1: huỷ lượt → việc TVV đóng (lý do huỷ lượt); Khôi phục lượt → việc TVV mở lại (không mất khỏi ai)', () => thu('bp8', () => {
    const n = nguonTvv('talk_family');
    assert(n, 'seed: cần Trao đổi gia đình có việc TVV');
    const att: any = t.attempts;
    att.huyLuot(P.admin, n.attempt_id, {});
    assert(tt(n.viec).t === 'bo' && tt(n.viec).l === 'system_luot_huy', `huỷ lượt: ${JSON.stringify(tt(n.viec))}`);
    att.reopenAttempt(P.admin, n.attempt_id);
    assert(tt(n.viec).t === 'mo', `khôi phục lượt: ${JSON.stringify(tt(n.viec))}`);
  }));

  check('BP0-9 · rà #2233 P1-2: Lộ trình mới gỡ nguồn → việc TVV đóng; Hoàn tác (mở lại nguồn) → việc TVV mở lại', () => thu('bp9', () => {
    const n = nguonTvv('bao_ph_tvv') ?? nguonTvv('talk_family');
    assert(n, 'seed: cần nguồn TVV có việc');
    const cy = get('SELECT cycle_id AS c FROM assessment_attempts WHERE id = ?', n.attempt_id).c;
    const ids = sc.dongPhoiHopLoTrinh([cy], TODAY);
    assert(tt(n.viec).t === 'bo' && tt(n.viec).l === 'system_ket_thuc_lo_trinh', `Lộ trình mới: ${JSON.stringify(tt(n.viec))}`);
    sc.moLaiPhoiHopLoTrinh(ids);
    assert(tt(n.viec).t === 'mo', 'Hoàn tác Lộ trình mới: việc TVV chưa mở lại');
  }));

  check('BP0-10 · rà #2233 P1-4 (N46): lượt thuộc lộ trình đã có KQ thi thật → không sinh việc TVV, không hiện ở Công việc TVV', () => thu('bp10', () => {
    const n = nguonTvv('talk_family');
    assert(n, 'seed');
    const em = get('SELECT student_id AS s FROM sos_coordination_actions WHERE id = ?', n.id).s;
    const pT = loadPrincipal(get('SELECT consultant_user_id AS u FROM students WHERE id = ?', em).u ?? P.mbManager.userId);
    const cy = get('SELECT cycle_id AS c FROM assessment_attempts WHERE id = ?', n.attempt_id).c;
    /* Rà vòng 2 P1-A: việc đã giao cho người khác + nằm trong KPI → có KQ thi thật SAU khi việc sinh → đóng ở gốc. */
    const tvv2 = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND u.status = 'active' AND ur.status = 'active'
        AND (ur.branch_id IS NULL OR ur.branch_id = (SELECT branch_id FROM students WHERE id = ?)) AND u.id != ? ORDER BY u.id LIMIT 1`, em, pT.userId);
    assert(tvv2, 'seed: cần TVV thứ hai cùng chi nhánh');
    const pN = loadPrincipal(tvv2.id);
    gv.doiPhuTrach(P.admin, 'bao_ph', n.viec, { userId: tvv2.id, phuTrachCu: null });
    conn.prepare('UPDATE viec_bao_ph SET tao_luc = ? WHERE id = ?').run(`${tq.tongQuanTvv(pN).ky.den}T03:00:00.000Z`, n.viec);
    xoaNho(); const kpi0 = tq.tongQuanTvv(pN).baoPh.tong;
    assert(khoa(pN).has(`bao-ph:${n.viec}`), 'tiền đề: việc ở Việc được giao');
    conn.prepare(`UPDATE learning_cycles SET route = COALESCE(route, 'ielts'), thi_that_khong_thi = 1, buoc_tiep = NULL WHERE id = ?`).run(cy);   // lộ trình "đã thi thật" (DA_THI_THAT_SQL)
    bp.dongBoViecTvvLoTrinh([cy]);   // như datKetQuaThiThat
    assert(tt(n.viec).t === 'bo' && tt(n.viec).l === 'system_sau_thi', `KQ thi thật → việc đóng: ${JSON.stringify(tt(n.viec))}`);
    assert(!khoa(pN).has(`bao-ph:${n.viec}`) && !khoa(pT).has(`bao-ph:${n.viec}`), 'việc sau thi thật còn ở Việc được giao / Công việc');
    xoaNho(); assert(tq.tongQuanTvv(pN).baoPh.tong === kpi0 - 1, 'việc sau thi thật còn vào KPI Báo PH đúng hạn');
    gv.donViec('bao_ph', [n.viec]); conn.prepare('DELETE FROM viec_bao_ph WHERE id = ?').run(n.viec);
    bp.dongBoViecTvvLuot([n.attempt_id]);
    assert(!get('SELECT 1 AS c FROM viec_bao_ph WHERE phoi_hop_id = ?', n.id), 'lượt sau thi thật vẫn sinh việc TVV');
    /* Gỡ KQ thi thật (khôi phục) → việc mở lại. */
    bp.dongBoViecTvvLuot([n.attempt_id]);
    conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 0 WHERE id = ?`).run(cy);
    bp.dongBoViecTvvLoTrinh([cy]);
    assert(get('SELECT trang_thai AS t FROM viec_bao_ph WHERE phoi_hop_id = ?', n.id)?.t === 'mo', 'gỡ KQ thi thật: việc TVV chưa có lại');
  }));

  check('BP0-11 · rà #2233 P1-3: Hoàn tác chuyển lớp ngay / chốt Cuối khoá — bản chụp có viec_bao_ph + người theo dõi việc Báo PH (không để việc TVV mồ côi)', () => {
    const bang = new Set((hz.dongDaoChuyenNgay([tf.student_id], []) as any[]).map((d) => d.bang));
    assert(bang.has('viec_bao_ph') && bang.has('viec_theo_doi') && bang.has('sos_coordination_actions'), `bản chụp: ${[...bang].join(', ')}`);
  });

  check('BP0-12 · rà #2233 P2-4: GVCN gỡ Trao đổi gia đình mình thêm nhầm (TVV chưa ghi) → việc TVV bỏ cùng; Khôi phục → cả hai mở; nguồn điền sẵn vẫn chặn', () => thu('bp12', () => {
    assert(tf?.gvcn, 'seed');
    const pG = loadPrincipal(tf.gvcn);
    const cu = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', tf.id).id;   // nhường chỗ (lượt, loại) cho việc thêm tay
    gv.donViec('bao_ph', [cu]); conn.prepare('DELETE FROM viec_bao_ph WHERE id = ?').run(cu); conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(tf.id);
    const a = ph.addCoordination(pG, tf.attempt_id, { kind: 'talk_family' });
    const v = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', a.id).id;
    ph.removeCoordination(pG, a.id, { reasonCode: 'duplicate_measure' });
    assert(tt(v).t === 'bo' && nguon(a.id).status === 'removed', `gỡ: ${JSON.stringify(tt(v))}`);
    ph.moLaiCoordination(pG, a.id);
    assert(tt(v).t === 'mo' && nguon(a.id).status === 'pending', `khôi phục: ${JSON.stringify(tt(v))}`);
    const dien = nguonTvv('talk_family');
    if (dien) assert(/TVV báo phụ huynh/.test(loi(() => ph.removeCoordination(P.admin, dien.id, { reasonCode: 'not_needed' }))), 'nguồn điền sẵn bỏ được');
  }));

  check('BP0-13 · rà vòng 2 P1-B: người được giao Xử lý vi phạm (không quản lý Ý thức) làm trọn lần xử lý của đợt mình; người lập cũ không còn giao / quản lý → 403 bằng chứng', () => thu('bp13', () => {
    assert(xl, 'seed');
    const gvbm = get(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND u.status = 'active'
        AND ur.branch_id = (SELECT branch_id FROM students WHERE id = ?) AND u.id != ? ORDER BY u.id LIMIT 1`, xl.sid, xl.gvcn);
    assert(gvbm, 'seed: cần GV cùng chi nhánh');
    const pB = loadPrincipal(gvbm.id);
    gv.doiPhuTrach(loadPrincipal(xl.gvcn), 'xu_ly', xl.sid, { userId: gvbm.id, phuTrachCu: null });
    const now = new Date().toISOString();
    const m = Number(conn.prepare(`INSERT INTO discipline_measures (student_id, kind, status, created_at, created_by) VALUES (?, 'report_1', 'nhap', ?, ?)`).run(xl.sid, now, gvbm.id).lastInsertRowid);
    assert(!loi(() => ac.measureOwner(m).requireEdit(pB)), 'người được giao không đính được bằng chứng nháp');
    conn.prepare(`UPDATE discipline_measures SET status = 'done' WHERE id = ?`).run(m);
    gv.xongViecXuLy([xl.sid]);
    assert(!loi(() => ac.measureOwner(m).requireEdit(pB)), 'vừa lưu (đợt này): người được giao bị chặn');
    conn.prepare(`UPDATE viec_xu_ly SET phu_trach_id = NULL WHERE id = ?`).run(xl.sid);   // đợt sau / thôi được giao
    assert(/403/.test(loi(() => ac.measureOwner(m).requireEdit(pB))), 'người lập cũ không còn được giao vẫn đụng bằng chứng');
  }));

  check('BP0-6 · việc con (N59) gắn việc Ý thức: Head tạo → khối giao việc có việc con; không lên bảng Vận hành; người được giao thấy ở Việc được giao', () => thu('bp6', () => {
    const v = get(`SELECT v.id FROM viec_bao_ph v JOIN students s ON s.id = v.student_id WHERE v.trang_thai = 'mo' AND s.archived_at IS NULL ORDER BY v.id LIMIT 1`);
    assert(v, 'seed: cần việc Báo PH mở');
    const t = mg.createMgmtTask(P.admin, { title: 'Gửi lại phiếu điểm cho PH', chaLoai: 'bao_ph', chaId: v.id, assigneeUserId: P.mbManager.userId, due: TODAY });
    const k = gv.xemGiaoViec(P.admin, 'bao_ph', v.id);
    assert(k.viecCon.some((c: any) => c.id === t.id && c.ten === 'Gửi lại phiếu điểm cho PH'), `việc con: ${JSON.stringify(k.viecCon)}`);
    assert(!(mg.listMgmtTasks(P.admin, {}).rows as any[]).some((r: any) => r.id === t.id), 'việc con lên bảng Vận hành');
    xoaNho();
    assert((myWork(P.mbManager, {} as any).items as any[]).some((i: any) => i.key === `mgmt:${t.id}`), 'người được giao không thấy việc con');
  }));

  check('BP0-7 · Lưu trữ: khối giao việc Xử lý vi phạm đóng (bo), Hoàn tác trả mo; Quay lại học thì giao lại từ đầu', () => thu('bp7', () => {
    assert(xl, 'seed');
    gv.doiPhuTrach(loadPrincipal(xl.gvcn), 'xu_ly', xl.sid, { userId: P.mbManager.userId, phuTrachCu: null });
    const d = luu.dongViecLuuTru(null, xl.sid, TODAY, null);
    assert(d.giaoXuLy?.includes(xl.sid) && get('SELECT trang_thai AS t FROM viec_xu_ly WHERE id = ?', xl.sid).t === 'bo', 'Lưu trữ không đóng khối giao việc');
    luu.moLaiViecLuuTru(null, xl.sid, d);
    assert(get('SELECT trang_thai AS t, phu_trach_id AS pt FROM viec_xu_ly WHERE id = ?', xl.sid).t === 'mo', 'Hoàn tác không trả');
  }));
}
