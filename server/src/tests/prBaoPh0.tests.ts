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
    const a = ph.addCoordination(pG, luot.id, { kind: 'talk_family' });
    const v = get('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?', a.id);
    assert(v, 'thêm tay Trao đổi gia đình không sinh việc TVV');
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
    /* Lượt có Trao đổi gia đình đã xác nhận (không việc TVV) → Báo PH Meeting đổi thành Trao đổi gia đình. */
    conn.prepare(`UPDATE sos_coordination_actions SET status = 'done' WHERE id = ?`).run(tf.id);
    const k3 = mig.doiBaoPh0(conn);
    assert(k3.chuyen.some((c: any) => c.viec === bm && c.moi === tf.id) && get('SELECT phoi_hop_id AS p FROM viec_bao_ph WHERE id = ?', bm).p === tf.id, `đổi thành Trao đổi gia đình: ${JSON.stringify(k3.chuyen)}`);
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
    assert(!get('SELECT 1 AS c FROM viec_xu_ly WHERE id = ?', xl.sid), 'lưu xử lý: khối giao việc còn');
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
