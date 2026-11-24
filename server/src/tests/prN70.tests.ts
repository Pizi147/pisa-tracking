/**
 * PHÉP KIỂM N70 (chủ SP 24/11, sửa N66) — Khai / sửa cấp bậc vi phạm: ô thời điểm nhận NGÀY hoặc THÁNG; khai LẦN ĐẦU áp ngay; GVCN SỬA bậc đã khai
 * → thẻ `sua_khai_bac` chờ Head (bậc cũ giữ, rút được, gửi lại = thay nội dung, hết hạn chốt theo GVCN); Head / Quản trị sửa áp ngay; lô cả lớp tách
 * "đã lưu" / "gửi Head duyệt". Mọi nhóm chạy trong giao dịch cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrN70Tests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  console.log('\nN70 · Khai cấp bậc: ngày hoặc tháng · sửa lại cần Head duyệt');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loi = (fn: () => unknown): { status: number | null; msg: string } => {
    try { fn(); return { status: null, msg: 'không ném' }; } catch (e: any) { return { status: e?.status ?? null, msg: String(e?.message ?? e) }; }
  };

  const intake: any = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const lo: any = await import('../yThuc/lo.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal }: any = await import('../permissions.ts');
  const { hanDuyetMacDinh } = await import('../../../shared/domain/index.ts');
  const LOP = 'MB FT 101';
  const cid = classId(LOP);
  const gvcn = P.coreTeacher, gvbm = P.subjectTeacher, head = P.mbManager;
  let seq = 0;
  const moiEm = (): number => {
    seq += 1;
    const ten = `N70 ${seq} ${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, target: 7, email: `n70${seq}@demo.test`, dob: '2010-01-01' }], idempotencyKey: `n70-${ten}` } as any);
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    return st.id as number;
  };
  const khai = (sid: number) => get('SELECT bac, thang, ghi_chu, khai_boi, sua_boi FROM y_thuc_khai_bac WHERE student_id = ?', sid);
  const the = (sid: number) => all("SELECT * FROM yeu_cau_duyet WHERE loai = 'sua_khai_bac' AND doi_tuong_id = ? ORDER BY id", sid);
  const hs = (p: any, sid: number) => xu.yThucHocVien(p, sid);
  const THANG = TODAY.slice(0, 7);
  const NGAY = addDays(TODAY, -3);

  await checkAsync('N70-1 · Ô thời điểm nhận NGÀY hoặc THÁNG: lưu đúng dạng đã nhập ("YYYY-MM-DD" / "YYYY-MM"); ở tương lai hoặc sai dạng → 400, không ghi', () => thu(() => {
    const a = moiEm(), b = moiEm(), c = moiEm();
    xu.khaiBac(gvcn, a, { bac: 2, thang: NGAY, ghiChu: 'theo ngày' });
    xu.khaiBac(gvcn, b, { bac: 1, thang: THANG, ghiChu: 'theo tháng' });
    assert(khai(a).thang === NGAY && khai(b).thang === THANG, JSON.stringify([khai(a), khai(b)]));
    assert(hs(gvcn, a).khai.thang === NGAY && hs(gvcn, b).khai.thang === THANG, 'hồ sơ trả đúng dạng');
    for (const sai of [addDays(TODAY, 1), `${Number(TODAY.slice(0, 4)) + 1}-01`, '2026-13', '2026-02-30', '08/2026']) {
      const l = loi(() => xu.khaiBac(gvcn, c, { bac: 1, thang: sai, ghiChu: 'x' }));
      assert(l.status === 400 && !khai(c), `${sai}: ${l.status} ${l.msg}`);
    }
  }));

  await checkAsync('N70-2 · GVCN khai LẦN ĐẦU áp ngay (không thẻ); GVCN SỬA → thẻ `sua_khai_bac` chờ Head, bậc CHƯA đổi ở mọi nơi; lý do bắt buộc; gửi lại = thay nội dung (một thẻ); GVBM 403', () => thu(() => {
    const sid = moiEm();
    const r0 = xu.khaiBac(gvcn, sid, { bac: 2, thang: THANG, ghiChu: 'Report 2 bản giấy' });
    assert(r0.ok === true && !r0.guiDuyet && khai(sid).bac === 2 && the(sid).length === 0, 'khai lần đầu áp ngay');
    assert(hs(gvcn, sid).suaKhaiCanDuyet === true && hs(head, sid).suaKhaiCanDuyet === false, 'cờ nút "Gửi Head duyệt" theo người xem');

    const thieu = loi(() => xu.suaKhaiBac(gvcn, sid, { bac: 1, thang: THANG, ghiChu: '  ', bacCu: 2 }));
    assert(thieu.status === 400 && /lý do/i.test(thieu.msg) && the(sid).length === 0, `thiếu lý do: ${thieu.msg}`);

    const ngan = loi(() => xu.suaKhaiBac(gvcn, sid, { bac: 1, thang: THANG, ghiChu: 'ok', bacCu: 2 }));   // B-2 (N50 ⑥): lý do ≥ 8 ký tự
    assert(ngan.status === 400 && /8 ký tự/.test(ngan.msg) && the(sid).length === 0, `B-2: lý do 2 ký tự vẫn qua: ${ngan.status} ${ngan.msg}`);
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 1, thang: NGAY, ghiChu: 'Thực ra mới Report 1', bacCu: 2 });
    const y = the(sid);
    assert(r.guiDuyet === true && r.yeuCauId === y[0].id && r.bac === 2, JSON.stringify(r));
    assert(y.length === 1 && y[0].trang_thai === 'cho' && y[0].phan_loai === 'y-thuc' && y[0].nguoi_xin === gvcn.userId && y[0].hoc_vien_id === sid
      && y[0].ly_do === 'Thực ra mới Report 1' && y[0].han_duyet === hanDuyetMacDinh('y_thuc', TODAY), JSON.stringify(y));
    const d = JSON.parse(y[0].du_lieu);
    assert(d.bacCu === 2 && d.bac === 1 && d.thang === NGAY, y[0].du_lieu);
    assert(khai(sid).bac === 2 && khai(sid).thang === THANG && khai(sid).ghi_chu === 'Report 2 bản giấy', 'dòng khai còn nguyên');
    const h = hs(gvcn, sid);
    assert(h.bac === 2 && h.keTiep.bac === 3 && h.khai.bac === 2, 'bậc cũ giữ ở hồ sơ');
    assert(h.khai.cho && h.khai.cho.id === y[0].id && h.khai.cho.bac === 1 && h.khai.cho.han === y[0].han_duyet, JSON.stringify(h.khai));

    /* Thẻ ở Chờ duyệt của Head: nhóm Ý thức, bậc cũ → bậc mới. */
    const hop = yc.hopChoDuyet(head, {}).the.find((x: any) => x.id === y[0].id);
    assert(hop && hop.phanLoai === 'y-thuc' && /Report 2 → Report 1/.test(hop.tieuDe) && hop.kieuNut === 'duyet-tu-choi', JSON.stringify(hop));

    /* Gửi lại = thay nội dung, vẫn một thẻ. */
    const r2 = xu.suaKhaiBac(gvcn, sid, { bac: 0, ghiChu: 'Chưa xử lý lần nào', bacCu: 2 });
    const y2 = the(sid);
    assert(r2.yeuCauId === y[0].id && y2.length === 1 && JSON.parse(y2[0].du_lieu).bac === 0 && y2[0].ly_do === 'Chưa xử lý lần nào' && khai(sid).bac === 2, JSON.stringify(y2));

    assert(loi(() => xu.suaKhaiBac(gvbm, sid, { bac: 5, ghiChu: 'x', bacCu: 2 })).status === 403 && the(sid).length === 1, 'GVBM 403');
    assert(loi(() => xu.suaKhaiBac(gvcn, sid, { bac: 1, ghiChu: 'lệch bậc đã cũ', bacCu: 4 })).status === 409, 'bậc panel thấy đã cũ → 409');
  }));

  await checkAsync('N70-3 · Head DUYỆT → bậc đổi (ngày / tháng, ghi chú theo yêu cầu), thẻ "duyet", GVCN có chuông, nhật ký sửa cấp bậc; Head huỷ quyết định trong ngày → bậc về như cũ', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, thang: THANG, ghiChu: 'Report 2' });
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 1, thang: NGAY, ghiChu: 'Thực ra mới Report 1', bacCu: 2 });
    assert(loi(() => yc.duyetYeuCau(gvcn, r.yeuCauId)).status === 403 && khai(sid).bac === 2, 'GVCN tự duyệt: 403');
    const kq = yc.duyetYeuCau(head, r.yeuCauId);
    const k = khai(sid);
    assert(k.bac === 1 && k.thang === NGAY && k.ghi_chu === 'Thực ra mới Report 1' && k.sua_boi === head.userId, JSON.stringify(k));
    assert(the(sid)[0].trang_thai === 'duyet' && hs(gvcn, sid).bac === 1 && hs(gvcn, sid).khai.cho === null, 'thẻ đã duyệt, hồ sơ bậc mới');
    assert(get("SELECT kind FROM notifications WHERE user_id = ? AND dedup_key = ?", gvcn.userId, `duyet_ket_qua:${r.yeuCauId}`)?.kind === 'duyet_ket_qua', 'chuông kết quả cho GVCN');
    assert(get("SELECT COUNT(*) n FROM audit_logs WHERE action = 'discipline.declare_level_edit' AND entity_type = 'student' AND entity_id = ?", sid).n === 1, 'nhật ký');
    assert(kq.coTheHuy === true, 'Hoàn tác ngắn cho Head');
    yc.huyQuyetDinh(head, r.yeuCauId);
    assert(khai(sid).bac === 2 && khai(sid).thang === THANG && the(sid)[0].trang_thai === 'cho', 'huỷ quyết định: bậc + thẻ về như trước');
  }));

  await checkAsync('C-4 (N70, RKC-3b) · Huỷ quyết định thẻ sửa bậc: đã có lần xử lý MỚI sau lần duyệt → chặn có lý do + bước tiếp, bậc giữ', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2' });
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 4, ghiChu: 'Lên bậc 4 theo hồ sơ', bacCu: 2 });
    yc.duyetYeuCau(head, r.yeuCauId);
    conn.prepare("INSERT INTO discipline_measures (student_id, kind, status, owner_user_id, created_by, created_at) VALUES (?, 'report_4_meeting', 'done', ?, ?, ?)")
      .run(sid, gvcn.userId, gvcn.userId, new Date(Date.now() + 60_000).toISOString());
    const l = loi(() => yc.huyQuyetDinh(head, r.yeuCauId));
    assert(l.status === 409 && /xử lý theo bậc mới/.test(l.msg) && /tab Ý thức/.test(l.msg), `chặn: ${l.status} ${l.msg}`);
    assert(khai(sid).bac === 4 && the(sid)[0].trang_thai === 'duyet', 'bậc + thẻ giữ nguyên');
  }));

  await checkAsync('N70-4 · Head TỪ CHỐI (lý do bắt buộc) → bậc cũ giữ, thẻ "tu_choi" + lý do, chuông "bị từ chối" cho GVCN; GVCN gửi lại được (thẻ mới)', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 3, ghiChu: 'WL 1' });
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 5, ghiChu: 'Lên Report 5', bacCu: 3 });
    assert(loi(() => yc.tuChoiYeuCau(head, r.yeuCauId, '')).status === 400, 'thiếu lý do');
    yc.tuChoiYeuCau(head, r.yeuCauId, 'Hồ sơ giấy chỉ có WL 1');
    const y = the(sid)[0];
    assert(y.trang_thai === 'tu_choi' && y.ly_do_tu_choi === 'Hồ sơ giấy chỉ có WL 1' && khai(sid).bac === 3 && hs(gvcn, sid).khai.cho === null, JSON.stringify(y));
    assert(get("SELECT kind FROM notifications WHERE user_id = ? AND dedup_key = ?", gvcn.userId, `duyet_ket_qua:${r.yeuCauId}`)?.kind === 'duyet_tu_choi', 'chuông từ chối');
    const r2 = xu.suaKhaiBac(gvcn, sid, { bac: 4, ghiChu: 'Gửi lại kèm biên bản', bacCu: 3 });
    assert(r2.yeuCauId !== r.yeuCauId && the(sid).length === 2 && the(sid)[1].trang_thai === 'cho', 'gửi lại sau từ chối = thẻ mới');
  }));

  await checkAsync('N70-5 · GVCN RÚT yêu cầu còn chờ → thẻ tự đóng "Người gửi đã rút", bậc giữ; người khác rút 403', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2' });
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 1, ghiChu: 'Nhầm bậc, xin hạ xuống', bacCu: 2 });
    assert(loi(() => yc.rutYeuCau(gvbm, r.yeuCauId)).status === 403, 'người khác rút: 403');
    yc.rutYeuCau(gvcn, r.yeuCauId);
    const y = the(sid)[0];
    assert(y.trang_thai === 'tu_dong' && /rút/.test(y.ly_do_dong) && khai(sid).bac === 2 && hs(gvcn, sid).khai.cho === null, JSON.stringify(y));
  }));

  await checkAsync('N70-6 · Head / Quản trị SỬA áp ngay (không thẻ). Bậc đã khác lúc GVCN gửi → thẻ không còn hiện ở hồ sơ, Head duyệt bị chặn + thẻ tự đóng, bậc của Head giữ', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2' });
    const a = xu.suaKhaiBac(head, sid, { bac: 3, ghiChu: 'Head sửa theo hồ sơ', bacCu: 2 });
    assert(a.ok === true && !a.guiDuyet && khai(sid).bac === 3 && the(sid).length === 0, 'Head áp ngay');
    const b = xu.suaKhaiBac(P.admin, sid, { bac: 2, ghiChu: 'Quản trị sửa', bacCu: 3 });
    assert(!b.guiDuyet && khai(sid).bac === 2 && the(sid).length === 0, 'Quản trị áp ngay');

    const r = xu.suaKhaiBac(gvcn, sid, { bac: 1, ghiChu: 'GVCN xin hạ', bacCu: 2 });
    xu.suaKhaiBac(head, sid, { bac: 4, ghiChu: 'Head sửa trong lúc chờ', bacCu: 2 });
    assert(hs(gvcn, sid).khai.cho === null && hs(gvcn, sid).bac === 4, 'thẻ cũ không còn là "đang chờ" ở hồ sơ');
    const l = loi(() => yc.duyetYeuCau(head, r.yeuCauId));
    const y = the(sid)[0];
    assert((l.status === 400 || l.status === 409) && khai(sid).bac === 4, `duyệt thẻ cũ: ${l.status} ${l.msg}`);
    assert(y.trang_thai === 'tu_dong' && /Bậc đã đổi/.test(y.ly_do_dong), JSON.stringify(y));
  }));

  await checkAsync('N70-7 · Quá hạn duyệt (như thẻ Ý thức): máy chốt theo GVCN — bậc đổi, thẻ "tu_dong" lý do giữ quyết định GVCN; thẻ chưa quá hạn không đụng', () => thu(() => {
    const a = moiEm(), b = moiEm();
    xu.khaiBac(gvcn, a, { bac: 2, ghiChu: 'Report 2' }); xu.khaiBac(gvcn, b, { bac: 2, ghiChu: 'Report 2' });
    const ra = xu.suaKhaiBac(gvcn, a, { bac: 1, thang: THANG, ghiChu: 'Hạ về Report 1', bacCu: 2 });
    xu.suaKhaiBac(gvcn, b, { bac: 1, ghiChu: 'Hạ về Report 1', bacCu: 2 });
    conn.prepare('UPDATE yeu_cau_duyet SET han_duyet = ? WHERE id = ?').run(addDays(TODAY, -1), ra.yeuCauId);
    xu.quetYThucHetHan(conn, TODAY);
    assert(khai(a).bac === 1 && khai(a).thang === THANG && khai(a).sua_boi === gvcn.userId, JSON.stringify(khai(a)));
    assert(the(a)[0].trang_thai === 'tu_dong' && the(a)[0].ly_do_dong === xu.LY_DO_TU_CHOT_Y_THUC, JSON.stringify(the(a)[0]));
    assert(khai(b).bac === 2 && the(b)[0].trang_thai === 'cho', 'thẻ còn hạn giữ nguyên');
  }));

  await checkAsync('C-7 · quét hết hạn thẻ Ý thức: một thẻ lỗi (đối tượng không còn) bị bỏ qua + log, thẻ khác vẫn chốt — không ném lỗi cả lượt quét', () => thu(() => {
    const a = moiEm();
    xu.khaiBac(gvcn, a, { bac: 2, ghiChu: 'Report 2' });
    const ra = xu.suaKhaiBac(gvcn, a, { bac: 1, thang: THANG, ghiChu: 'Hạ về Report 1', bacCu: 2 });
    const han = addDays(TODAY, -1);
    conn.prepare('UPDATE yeu_cau_duyet SET han_duyet = ? WHERE id = ?').run(han, ra.yeuCauId);
    const xau = Number(conn.prepare(`INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, han_duyet, trang_thai, tao_luc) VALUES ('thu_hoi_y_thuc', 'can_quyet', 'discipline_measure', 987654321, ?, 'cho', ?)`)
      .run(han, new Date().toISOString()).lastInsertRowid);
    const log = console.error; let nhat = 0;
    console.error = (...x: unknown[]) => { if (String(x[0]).includes('het-han-y-thuc')) nhat += 1; else log(...x); };
    try { xu.quetYThucHetHan(conn, TODAY); } finally { console.error = log; }
    assert(nhat === 1, `thẻ lỗi phải được log đúng một lần (${nhat})`);
    assert(khai(a).bac === 1 && the(a)[0].trang_thai === 'tu_dong', 'thẻ tốt vẫn được chốt');
    assert((conn.prepare('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?').get(xau) as any).trang_thai === 'cho', 'thẻ lỗi giữ nguyên (cuộn lại riêng)');
  }));

  await checkAsync('N70-8 · Lô cả lớp (GVCN): em chưa khai áp ngay, em đã khai → gửi Head duyệt từng em (bậc giữ); thiếu ghi chú chung → em đã khai báo riêng; Hoàn tác lô: xoá dòng vừa khai + rút thẻ vừa gửi; GVCN không hoàn tác "về bậc trước" được; Head lô áp ngay', () => thu(() => {
    const moi = moiEm(), cu = moiEm(), cu2 = moiEm();
    xu.khaiBac(gvcn, cu, { bac: 2, ghiChu: 'Report 2' }); xu.khaiBac(gvcn, cu2, { bac: 3, ghiChu: 'WL 1' });
    const bang = lo.loYThucLop(gvcn, cid);
    assert(bang.laQl === false && bang.em.find((x: any) => x.studentId === cu).capBac.cho === null, 'bảng lô: chưa có thẻ chờ');

    const thieu = lo.loCapBac(gvcn, cid, { em: [{ studentId: cu2, bac: 1 }] });
    assert(thieu.em[0].ok === false && /lý do/i.test(thieu.em[0].loi.chu) && the(cu2).length === 0, JSON.stringify(thieu));

    const r = lo.loCapBac(gvcn, cid, { em: [{ studentId: moi, bac: 1, thang: NGAY }, { studentId: cu, bac: 1 }], ghiChu: 'Rà lại hồ sơ giấy' });
    const kq = (sid: number) => r.em.find((x: any) => x.studentId === sid);
    assert(kq(moi).ok && !kq(moi).guiDuyet && khai(moi).bac === 1 && khai(moi).thang === NGAY, JSON.stringify(kq(moi)));
    assert(kq(cu).ok && kq(cu).guiDuyet === true && kq(cu).ycId === the(cu)[0].id && khai(cu).bac === 2, JSON.stringify(kq(cu)));
    assert(the(cu)[0].trang_thai === 'cho' && JSON.parse(the(cu)[0].du_lieu).bac === 1 && the(cu)[0].ly_do === 'Rà lại hồ sơ giấy', JSON.stringify(the(cu)[0]));
    const dong = lo.loYThucLop(gvcn, cid).em.find((x: any) => x.studentId === cu);
    assert(dong.capBac.khai === 2 && dong.capBac.cho && dong.capBac.cho.bac === 1, JSON.stringify(dong.capBac));

    /* GVCN gửi giả "về bậc trước" cho em đã khai → không áp (sửa bậc đã khai phải qua Head). */
    const gia = lo.loHoanTacCapBac(gvcn, cid, { em: [{ studentId: cu2, bac: 3, truoc: { bac: 0, thang: null, ghiChu: 'giả' } }] });
    assert(gia.em[0].ok === false && khai(cu2).bac === 3, JSON.stringify(gia));

    const ht = lo.loHoanTacCapBac(gvcn, cid, { em: [{ studentId: moi, bac: 1, truoc: null }, { studentId: cu, ycId: kq(cu).ycId }] });
    assert(ht.em.every((x: any) => x.ok) && !khai(moi) && khai(cu).bac === 2 && the(cu)[0].trang_thai === 'tu_dong', JSON.stringify(ht));

    const rh = lo.loCapBac(head, cid, { em: [{ studentId: cu, bac: 4 }, { studentId: moi, bac: 2 }] });
    assert(rh.em.every((x: any) => x.ok && !x.guiDuyet) && khai(cu).bac === 4 && khai(moi).bac === 2 && the(cu).length === 1, JSON.stringify(rh));
    /* SUA-GOP-2511 (Việc để sau 25/11): `truoc` do web gửi — Hoàn tác KHÔNG được đặt ngày / tháng xử lý ở tương lai (như khai thường; bản lưu thật luôn ≤ hôm nay). */
    const sau = addDays(TODAY, 40) as string;
    for (const thang of [sau, sau.slice(0, 7)]) {
      const tl = lo.loHoanTacCapBac(head, cid, { em: [{ studentId: cu, bac: 4, truoc: { bac: 2, thang, ghiChu: 'giả tương lai' } }] });
      assert(tl.em[0].ok === false && /tương lai/.test(tl.em[0].loi.chu) && khai(cu).bac === 4, `Hoàn tác nhận ${thang}: ${JSON.stringify(tl)}`);
    }
    const hh = lo.loHoanTacCapBac(head, cid, { em: rh.em.map((x: any) => ({ studentId: x.studentId, bac: x.bac, truoc: x.truoc ?? null })) });
    assert(hh.em.every((x: any) => x.ok) && khai(cu).bac === 2 && !khai(moi), JSON.stringify(hh));
  }));

  /* Tốc độ (CLAUDE.md "Tốc độ + compute"): thẻ chờ đọc KÈM câu khai sẵn có → mở hồ sơ / bảng lô không thêm câu; lô gửi duyệt nặng hơn lô áp ngay (thẻ + chuông
     Head) nên web chia lô 4 em khi có em gửi duyệt — khoá trần câu mỗi em. */
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const dem = (fn: () => unknown) => { const truoc = soCauSql(); fn(); return soCauSql() - truoc; };
  const { TRAN_GHI_LO }: any = await import('./tocDoDuong.ts');
  await checkAsync('N70-9 · Tốc độ: hồ sơ Ý thức + bảng lô KHÔNG thêm câu khi em có thẻ sửa bậc đang chờ; một lần gửi + lô 4 em gửi Head duyệt trong trần `TRAN_GHI_LO` (tocDoDuong.ts)', () => thu(() => {
    const a = moiEm();
    xu.khaiBac(gvcn, a, { bac: 2, ghiChu: 'Report 2' });
    const hs0 = dem(() => hs(gvcn, a)), lo0 = dem(() => lo.loYThucLop(gvcn, cid));
    const n1 = dem(() => xu.suaKhaiBac(gvcn, a, { bac: 1, ghiChu: 'Hạ về Report 1', bacCu: 2 }));
    const hs1 = dem(() => hs(gvcn, a)), lo1 = dem(() => lo.loYThucLop(gvcn, cid));
    assert(hs(gvcn, a).khai.cho && hs1 === hs0 && lo1 === lo0, `hồ sơ ${hs0} → ${hs1} câu · bảng lô ${lo0} → ${lo1} câu`);
    const ems = Array.from({ length: 4 }, () => moiEm());
    for (const sid of ems) xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2' });
    const n = dem(() => { const r = lo.loCapBac(gvcn, cid, { em: ems.map((studentId) => ({ studentId, bac: 1 })), ghiChu: 'Rà lại hồ sơ giấy' }); assert(r.em.every((x: any) => x.ok && x.guiDuyet), JSON.stringify(r)); });
    console.log(`      đo: hồ sơ Ý thức ${hs1} câu · bảng lô ${lo1} câu (có / không thẻ chờ như nhau) · một lần gửi ${n1} câu · lô gửi duyệt ${n} câu / 4 em = ${(n / 4).toFixed(1)}`);
    assert(n1 <= TRAN_GHI_LO.guiSuaKhai, `một lần gửi ${n1} câu > trần ${TRAN_GHI_LO.guiSuaKhai}`);
    assert(n <= TRAN_GHI_LO.loGuiSuaKhai4Em, `lô gửi duyệt 4 em ${n} câu > trần ${TRAN_GHI_LO.loGuiSuaKhai4Em}`);
  }));

  /* ---------------------------------------------------------------- PTA rà sâu #2058 */
  await checkAsync('N70-10 · GVCN gửi mà bậc VÀ ngày / tháng đều bằng dòng khai → 400 "Chưa đổi gì", không tạo thẻ; chỉ đổi ngày / tháng thì vẫn gửi được', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, thang: THANG, ghiChu: 'Report 2' });
    const l = loi(() => xu.suaKhaiBac(gvcn, sid, { bac: 2, thang: THANG, ghiChu: 'Chỉ đổi ghi chú', bacCu: 2 }));
    assert(l.status === 400 && /Chưa đổi gì/.test(l.msg) && the(sid).length === 0, `${l.status} ${l.msg}`);
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 2, thang: NGAY, ghiChu: 'Ghi lại đúng ngày', bacCu: 2 });
    assert(r.guiDuyet === true && JSON.parse(the(sid)[0].du_lieu).thang === NGAY, 'chỉ đổi ngày / tháng: gửi được');
  }));

  await checkAsync('N70-11 · Hoàn tác lô với em có thẻ gửi TỪ TRƯỚC lô (lô ghi đè): thẻ KHÔNG bị rút — khôi phục nội dung cũ (lý do, bậc xin, ngày / tháng, người gửi); thẻ mới tạo trong lô thì rút', () => thu(() => {
    const cu = moiEm(), moi = moiEm();
    xu.khaiBac(gvcn, cu, { bac: 2, ghiChu: 'Report 2' }); xu.khaiBac(gvcn, moi, { bac: 2, ghiChu: 'Report 2' });
    const r0 = xu.suaKhaiBac(gvcn, cu, { bac: 1, thang: NGAY, ghiChu: 'Gửi từ panel một em', bacCu: 2 });
    const r = lo.loCapBac(gvcn, cid, { em: [{ studentId: cu, bac: 4 }, { studentId: moi, bac: 3 }], ghiChu: 'Lô ghi đè' });
    const kq = (sid: number) => r.em.find((x: any) => x.studentId === sid);
    assert(kq(cu).ycId === r0.yeuCauId && kq(cu).ghiDe === true && !kq(moi).ghiDe && JSON.parse(the(cu)[0].du_lieu).bac === 4, JSON.stringify(r));
    const ht = lo.loHoanTacCapBac(gvcn, cid, { em: [{ studentId: cu, ycId: kq(cu).ycId }, { studentId: moi, ycId: kq(moi).ycId }] });
    assert(ht.em.every((x: any) => x.ok), JSON.stringify(ht));
    const y = the(cu)[0]; const d = JSON.parse(y.du_lieu);
    assert(the(cu).length === 1 && y.id === r0.yeuCauId && y.trang_thai === 'cho' && y.ly_do === 'Gửi từ panel một em' && d.bac === 1 && d.thang === NGAY && d.truoc === undefined
      && y.nguoi_xin === gvcn.userId, JSON.stringify(y));
    assert(hs(gvcn, cu).khai.cho.bac === 1 && the(moi)[0].trang_thai === 'tu_dong' && khai(cu).bac === 2 && khai(moi).bac === 2, 'thẻ cũ còn chờ đúng nội dung; thẻ mới của lô đã rút');
  }));

  await checkAsync('N70-12 · Quyền: người DUYỆT thẻ sửa bậc = đúng tập người sửa thẳng (`duyetYThuc`) — CX chi nhánh của em duyệt / từ chối được, CX chi nhánh khác 403; CX sửa thẳng áp ngay; cờ mở hộp Chờ duyệt chỉ cho người có hộp', () => thu(() => {
    const taoCx = (cn: string) => loadPrincipal(accounts.createAccount(P.admin, { email: `cxn70.${cn.toLowerCase()}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-cxn70', fullName: `Thử CX N70 ${cn}`,
      roles: [{ role: 'cx', branches: [cn] }] }).userId);
    const cxMb = taoCx('MB'), cxCp = taoCx('CP');
    const a = moiEm(), b = moiEm();
    xu.khaiBac(gvcn, a, { bac: 2, ghiChu: 'Report 2' }); xu.khaiBac(gvcn, b, { bac: 2, ghiChu: 'Report 2' });
    const ra = xu.suaKhaiBac(gvcn, a, { bac: 1, ghiChu: 'Hạ về Report 1', bacCu: 2 });
    const rb = xu.suaKhaiBac(gvcn, b, { bac: 3, ghiChu: 'Lên WL 1', bacCu: 2 });
    assert(loi(() => yc.duyetYeuCau(cxCp, ra.yeuCauId)).status === 403 && loi(() => yc.tuChoiYeuCau(cxCp, rb.yeuCauId, 'x')).status === 403 && khai(a).bac === 2, 'CX chi nhánh khác: 403');
    yc.duyetYeuCau(cxMb, ra.yeuCauId);
    yc.tuChoiYeuCau(cxMb, rb.yeuCauId, 'Hồ sơ giấy chỉ có Report 2');
    assert(khai(a).bac === 1 && the(a)[0].trang_thai === 'duyet' && khai(b).bac === 2 && the(b)[0].trang_thai === 'tu_choi', JSON.stringify([the(a)[0], the(b)[0]]));
    const t2 = xu.suaKhaiBac(cxMb, b, { bac: 4, ghiChu: 'CX sửa theo hồ sơ', bacCu: 2 });
    assert(!t2.guiDuyet && khai(b).bac === 4, 'CX sửa thẳng áp ngay');
    assert(hs(cxMb, b).suaKhaiCanDuyet === false && hs(cxMb, b).moHopDuyet === false && hs(head, b).moHopDuyet === true && hs(gvcn, b).moHopDuyet === false, 'cờ mở hộp Chờ duyệt');
  }));

  /* PTA rà lần 2 #2058: em sang chuỗi mới rồi khai lại ĐÚNG bậc cũ trong lúc thẻ còn chờ → dòng khai của chuỗi cũ còn nguyên nên thẻ không tự đóng; áp thẻ phải so cả
     lộ trình của dòng khai (`cycleId`), không chỉ bậc — kẻo ghi nhầm vào dòng khai của chuỗi mới. */
  await checkAsync('N70-14 · Áp thẻ mà dòng khai hiện tại thuộc CHUỖI KHÁC lúc gửi (bậc trùng) → 409, dòng khai không đổi; đúng chuỗi thì áp', () => thu(() => {
    const sid = moiEm();
    xu.khaiBac(gvcn, sid, { bac: 2, thang: THANG, ghiChu: 'Report 2' });
    const r = xu.suaKhaiBac(gvcn, sid, { bac: 1, ghiChu: 'Hạ về Report 1', bacCu: 2 });
    const y = the(sid)[0]; const d = JSON.parse(y.du_lieu);
    const lech = { id: y.id, doi_tuong_id: sid, du_lieu: JSON.stringify({ ...d, cycleId: d.cycleId + 100000 }) };
    const l = loi(() => xu.apDungSuaKhai(head.userId, lech));
    assert(l.status === 409 && khai(sid).bac === 2 && khai(sid).ghi_chu === 'Report 2', `${l.status} ${l.msg} ${JSON.stringify(khai(sid))}`);
    yc.duyetYeuCau(head, r.yeuCauId);
    assert(khai(sid).bac === 1, 'đúng chuỗi: áp');
  }));

  /* Chạy thật #2058 lộ vòng import `duyet/loaiYeuCau` ↔ `yThuc/xuLy` làm máy chủ sập lúc nạp; trong tiến trình kiểm mô-đun đã nạp theo thứ tự khác nên không lộ.
     → nạp ứng dụng (như `index.ts`, không mở cổng) + hai đầu của vòng trong TIẾN TRÌNH MỚI. */
  await checkAsync('N70-13 · Nạp máy chủ trong tiến trình mới: `app` (như index.ts, không mở cổng), `duyet/loaiYeuCau`, `yThuc/xuLy` — mỗi thứ tự nạp đều không ném (bắt vòng import đọc hằng lúc nạp)', async () => {
    const { spawnSync } = await import('node:child_process');
    for (const tep of ['../app.js', '../duyet/loaiYeuCau.js', '../yThuc/xuLy.js']) {
      const url = new URL(tep, import.meta.url).href;
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(url)}); process.exit(0);`], { encoding: 'utf8', timeout: 60_000 });
      assert(r.status === 0, `${tep}: mã ${r.status} — ${(r.stderr ?? '').split('\n').filter((x) => /Error|at /.test(x)).slice(0, 3).join(' | ')}`);
    }
  });
}
