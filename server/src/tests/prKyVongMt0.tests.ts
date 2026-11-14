/**
 * KY-VONG-MT0 (chủ SP 14/11, đặc tả 2026-11-14-ky-vong-mt0 mục 5.1): MT0 lớp thường Overall ≥ mốc chương trình (FOU 4 · BE 4 · ELE 4.5) = tự Đạt — không chip
 * SOS, không kỹ năng trượt, không việc QL; "Không đạt" bị chặn; có kỹ năng Đã huỷ → xét từng kỹ năng còn lại; dữ liệu cũ sửa một lần (có khôi phục).
 * Chạy sau PR-KV (dùng chung bộ dựng lớp / em / MT0 của `prKv.tests.ts`).
 */
export async function runPrKyVongMt0Tests(t: any, h: any) {
  const { check, assert, conn, P, TODAY } = t;
  const { d, kv, ck, lopMoi, hocVien, lenFt, diemMt0, viecKv, caseKv, paCua, get, all, maLoi, ganGv, GV } = h;
  const mig: any = await import('../migrate/prKyVongTuDat.ts');
  const tr: any = await import('../classes/transition.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  console.log('\nKY-VONG-MT0 · MT0 lớp thường đạt mốc = tự Đạt');

  check('KV-1 · BE Overall 4.0 → dat, monTruot [], kyNangSosMt0 [] (W 3.0 ≤ Target 5 − 2 không còn chip); FT gốc (không chương trình lớp thường) vẫn chip', () => {
    const b = { listening: 4.5, reading: 4.5, writing: 3, speaking: 4 };
    const g = d.goiYKyVong('BE', b);
    assert(g && g.overall === 4 && g.dat === true && g.monTruot.length === 0, JSON.stringify(g));
    assert(d.kyNangSosMt0(b, 5, 'BE').length === 0, JSON.stringify(d.kyNangSosMt0(b, 5, 'BE')));
    assert(d.kyNangSosMt0(b, 5, null).map((x: any) => x.skill).join() === 'writing', 'không chương trình lớp thường → giữ chip SOS');
    assert(d.goiYKyVong('FOU', { listening: 4, reading: 4, writing: 4, speaking: 3.5 })?.monTruot.length === 0, 'FOU mốc 4');
  });

  check('KV-2 · BE Overall 3.5 → không đạt, monTruot = kỹ năng < 4; chip SOS giữ', () => {
    const b = { listening: 4, reading: 3.5, writing: 3, speaking: 3.5 };
    const g = d.goiYKyVong('BE', b);
    assert(g && g.overall === 3.5 && g.dat === false && g.monTruot.join() === 'reading,writing,speaking', JSON.stringify(g));
    assert(d.kyNangSosMt0(b, 5.5, 'BE').map((x: any) => x.skill).join() === 'reading,writing,speaking', JSON.stringify(d.kyNangSosMt0(b, 5.5, 'BE')));
  });

  check('KV-3 · có kỹ năng Đã huỷ (W) → không Overall, xét từng kỹ năng còn lại: 3 kỹ năng ≥ mốc → dat; một kỹ năng dưới mốc → không đạt dù trung bình đạt; kỹ năng còn lại chưa có điểm → Chờ MT0', () => {
    const a = d.goiYKyVong('BE', { listening: 4, reading: 4.5, writing: 5, speaking: 4 }, ['writing1']);
    assert(a && a.overall === null && a.dat === true && a.monTruot.length === 0, `band W đã huỷ không tính: ${JSON.stringify(a)}`);
    const b = d.goiYKyVong('BE', { listening: 4.5, reading: 4.5, writing: null, speaking: 3.5 }, ['writing2']);
    assert(b && b.overall === null && b.dat === false && b.monTruot.join() === 'speaking', `trung bình 4.17 → 4.0 nhưng S < 4: ${JSON.stringify(b)}`);
    assert(d.goiYKyVong('BE', { listening: 4.5, reading: 4.5, writing: null, speaking: null }, ['writing1']) === null, 'S chưa có điểm → Chờ MT0');
    assert(d.kyNangSosMt0({ listening: 4, reading: 4.5, writing: null, speaking: 4 }, 6, 'BE', ['writing1']).length === 0, 'đạt → không chip');
    /* Qua máy chủ: kỹ năng huỷ đọc từ `attempt_skills.sit_status` (câu con, 0 câu thêm). */
    const be = lopMoi('BE', false, 11), ft = lopMoi('FT', true, 1);
    const X = hocVien(be, 'BE');
    lenFt(be, [X], ft, true);
    diemMt0(X, { L: 4.5, R: 4.5, W: 3, S: 4 });   // không huỷ: Overall 4.0 → Đạt
    const mt0 = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`, X).id;
    const goi = () => kv.mt0TheoLop([{ sid: X, lop: be, ct: 'BE' }]).get(X).goiY;
    assert(goi()?.dat === true && goi()?.overall === 4, JSON.stringify(goi()));
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'writing'`).run(mt0);   // MT0: bốn kỹ năng, W một dòng
    assert(get(`SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ? AND sit_status = 'cancelled'`, mt0).n === 1, 'tiền đề: có dòng writing');
    conn.prepare(`UPDATE assessment_scores SET band = 3.5 WHERE attempt_id = ? AND skill = 'speaking'`).run(mt0);
    const g = goi();
    assert(g && g.overall === null && g.dat === false && g.monTruot.join() === 'speaking', `W huỷ, S 3.5: ${JSON.stringify(g)}`);
    conn.prepare(`UPDATE assessment_scores SET band = 4 WHERE attempt_id = ? AND skill = 'speaking'`).run(mt0);
    assert(goi()?.dat === true && goi()?.overall === null, JSON.stringify(goi()));
    const sos = (mt0View: any) => mt0View?.sos;
    const mt0Mod = h.mt0Mod;
    assert(sos(mt0Mod.mt0TheoHocVien([X]).get(X))?.length === 0, `chip SOS lưới MT0: ${JSON.stringify(mt0Mod.mt0TheoHocVien([X]).get(X))}`);
  });

  /* Lớp BE + FT, 3 em đã sang FT: A đạt (4.0), B trượt (3.5), C chưa MT0. */
  const be = lopMoi('BE', false, 11), ft = lopMoi('FT', true, 1);
  ganGv(ft, GV[2], 'writing2'); ganGv(ft, GV[3], 'speaking');
  const [A, B, C] = [hocVien(be, 'BE'), hocVien(be, 'BE'), hocVien(be, 'BE')];
  lenFt(be, [A, B, C], ft, true);
  diemMt0(A, { L: 4.5, R: 4.5, W: 3, S: 4 });
  diemMt0(B, { L: 4, R: 3.5, W: 3, S: 3.5 });
  const maFt = get('SELECT code FROM classes WHERE id = ?', ft).code as string;

  check('KV-4 · em đạt chưa lưu → tự Đạt ở emKyVong / kqdrLopFt / Cuối khoá (kqdrCua); không đếm vào việc / chỉ số; việc mở bảng Kết quả đầu ra lớp FT; mọi em chốt → hết việc', () => {
    const em = (sid: number) => kv.panelKyVong(P.mbManager, be).em.find((x: any) => x.id === sid);
    assert(em(A).ketLuan?.dat === true && em(A).ketLuan.tuDong === true && em(A).goiY.monTruot.length === 0, JSON.stringify(em(A)));
    assert(em(B).ketLuan === null, JSON.stringify(em(B)));
    assert(!get('SELECT 1 FROM lo_trinh_tiep_theo WHERE student_id = ? AND ky_vong_dat IS NOT NULL', A), 'tự Đạt không ghi DB');
    const v = viecKv(P.mbManager).filter((i: any) => i.tieuDe.includes(maFt));
    assert(v.length === 1 && v[0].count === 2 && v[0].classId === ft && v[0].href === `/hoc-vien/lop/${ft}?che-do=ket-qua` && v[0].actionLabel === 'Kết quả đầu ra ›', JSON.stringify(v));
    assert(v[0].emIds.join() === [B, C].sort((x, y) => x - y).filter((x) => v[0].emIds.includes(x)).join() && !v[0].emIds.includes(A), `em đạt còn trong việc: ${v[0].emIds}`);
    const ids = metrics.metricSet(P.mbManager, 'hv-len-ft-chua-ky-vong', {}).ids as number[];
    assert(!ids.includes(A) && ids.includes(B) && ids.includes(C), `chỉ số: ${ids}`);
    const bang = kv.kqdrLopFt(P.mbManager, ft).bang.flatMap((b: any) => b.dot.flatMap((x: any) => x.em));
    const a = bang.find((x: any) => x.id === A), b = bang.find((x: any) => x.id === B);
    assert(a?.kqdr?.dat === true && a.kqdr.tuDong === true && a.mt0.monTruot.length === 0, JSON.stringify(a));
    assert(b?.kqdr === null && b.mt0.monTruot.length === 3, JSON.stringify(b));
    /* Cuối khoá lớp nguồn (lệnh còn chờ): cùng luật. */
    const be2 = lopMoi('BE', false, 11), ft2 = lopMoi('FT', true, 1);
    const Y = hocVien(be2, 'BE');
    lenFt(be2, [Y], ft2, false);
    diemMt0(Y, { L: 4, R: 4, W: 4, S: 4 });
    const kq = tr.transitionPlan(P.mbManager, be2).students.find((x: any) => x.id === Y)?.kqdr;
    assert(kq?.chot?.dat === true && kq.chot.tuDong === true, `kqdrCua: ${JSON.stringify(kq)}`);
    const v2 = viecKv(P.mbManager).filter((i: any) => i.classId === be2);
    assert(v2.length === 0, `em tự Đạt duy nhất → không việc: ${JSON.stringify(v2)}`);
    /* B, C chốt → hết việc lớp FT. */
    kv.luuKyVong(P.mbManager, be, { dong: [{ sid: B, dat: false, nguyenNhan: 'hoc_sinh', lyDo: 'Nghỉ nhiều' }] });
    diemMt0(C, { L: 4, R: 4, W: 4, S: 4 });
    assert(!viecKv(P.mbManager).some((i: any) => i.classId === ft), 'mọi em chốt / tự Đạt mà còn việc');
  });

  check('KV-5 · "Không đạt" khi MT0 đạt → 400 ở luuKyVong (cả lô không ghi) và ghiKetLuanFt; Đạt vẫn lưu được', () => {
    const truoc = all('SELECT student_id, ky_vong_dat FROM lo_trinh_tiep_theo WHERE class_id = ?', be);
    const e = maLoi(() => kv.luuKyVong(P.mbManager, be, { dong: [{ sid: A, dat: false, nguyenNhan: 'trung_tam', mon: ['writing'] }] }));
    assert(e?.status === 400 && /đã đạt mốc/.test(e.msg), JSON.stringify(e));
    const e2 = maLoi(() => ck.ghiKetLuanFt(P.mbManager, A, { dat: false, nguyenNhan: 'hoc_sinh', ghiChu: 'x' }));
    assert(e2?.status === 400 && /đã đạt mốc/.test(e2.msg), JSON.stringify(e2));
    assert(JSON.stringify(all('SELECT student_id, ky_vong_dat FROM lo_trinh_tiep_theo WHERE class_id = ?', be)) === JSON.stringify(truoc) && caseKv(A).length === 0, 'lỗi mà vẫn ghi');
    assert(kv.luuKyVong(P.mbManager, be, { dong: [{ sid: A, dat: true }] }).luu === 1, 'Đạt lưu được');
  });

  check('KV-6 · migrate: "Không đạt · Trung tâm" + MT0 đạt → Đạt, Case Kỳ vọng + PA Tutor đóng (lịch sử, mốc); em không đạt giữ; chạy lần 2 không đổi; khôi phục trả đúng', () => {
    const be3 = lopMoi('BE', false, 11), ft3 = lopMoi('FT', true, 1);
    ganGv(ft3, GV[2], 'writing2');
    const [M, N] = [hocVien(be3, 'BE'), hocVien(be3, 'BE')];
    lenFt(be3, [M, N], ft3, true);
    diemMt0(M, { L: 4, R: 4, W: 3, S: 3.5 });   // 3.5 — chốt Không đạt hợp lệ
    diemMt0(N, { L: 4, R: 4, W: 3, S: 3.5 });
    kv.luuKyVong(P.mbManager, be3, { dong: [M, N].map((sid) => ({ sid, dat: false, nguyenNhan: 'trung_tam', mon: ['writing'] })) });
    assert(caseKv(M).length === 1 && caseKv(N).length === 1, 'tiền đề: Case Tutor');
    /* Dữ liệu cũ: điểm M sửa lên (W 4.5 → Overall 4.0) sau khi đã chốt. */
    const mtM = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`, M).id;
    conn.prepare(`UPDATE assessment_scores SET band = 4.5 WHERE attempt_id = ? AND skill IN ('writing1', 'writing2')`).run(mtM);
    const caseM = caseKv(M)[0], paM = paCua(caseM.id)[0];
    assert(paM.status === 'started', JSON.stringify(paM));
    const ltN = JSON.stringify(get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', N, be3));
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(mig.KHOA_KY_VONG_TU_DAT);   // seed ghi khoá sẵn (DB mới)
    const ap: string[] = [];
    const n0 = nguCanh.soCauSql();
    mig.migratePrKyVongTuDat(conn, ap);
    const soCau = nguCanh.soCauSql() - n0;
    const lt = get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', M, be3);
    assert(lt.ky_vong_dat === 1 && lt.ky_vong_nguyen_nhan === null && lt.ky_vong_mon === null && lt.updated_by === null, JSON.stringify(lt));
    const c = get('SELECT * FROM sos_cases WHERE id = ?', caseM.id);
    assert(c.status === 'done' && c.system_close_reason === 'overall_dat', JSON.stringify(c));
    assert(get('SELECT * FROM case_interventions WHERE id = ?', paM.id).status === 'cancelled', 'PA Tutor huỷ hệ thống');
    assert(get(`SELECT 1 x FROM sos_case_history WHERE case_id = ? AND new_value = 'done'`, caseM.id) && get(`SELECT 1 x FROM case_milestones WHERE dedup_key = ?`, `system_close:${caseM.id}`), 'lịch sử / mốc');
    assert(JSON.stringify(get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', N, be3)) === ltN && caseKv(N)[0].status !== 'done', 'em không đạt bị đổi');
    assert(ap.some((x) => /^KY-VONG-MT0: \d+ em/.test(x)) && get('SELECT 1 x FROM demo_config WHERE key = ?', mig.KHOA_KY_VONG_TU_DAT), JSON.stringify(ap));
    assert(soCau <= 60, `migrate ${soCau} câu`);
    /* Chạy lần 2: khoá → không làm gì; hàm sửa gọi thẳng cũng không còn gì. */
    const ap2: string[] = [];
    mig.migratePrKyVongTuDat(conn, ap2);
    assert(!ap2.length && mig.suaKyVongTuDat(conn).em.length === 0, `lần 2: ${JSON.stringify(ap2)}`);
    /* Khôi phục: kết luận + Case + PA về như cũ. */
    const kp = mig.khoiPhucKyVongTuDat(conn);
    assert(kp.em.includes(M) && kp.caseMoLai.includes(caseM.id), JSON.stringify(kp));
    const lt2 = get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', M, be3);
    assert(lt2.ky_vong_dat === 0 && lt2.ky_vong_nguyen_nhan === 'trung_tam' && lt2.ky_vong_mon === '["writing"]' && lt2.updated_by === P.mbManager.userId, JSON.stringify(lt2));
    assert(get('SELECT status FROM sos_cases WHERE id = ?', caseM.id).status === caseM.status && get('SELECT status FROM case_interventions WHERE id = ?', paM.id).status === 'started', 'Case / PA mở lại');
    assert(mig.khoiPhucKyVongTuDat(conn).em.length === 0, 'khôi phục hai lần');
  });

  check('KV-7 · trần: kqdrLopFt / việc QL không thêm câu khi có em tự Đạt (kỹ năng huỷ đọc bằng câu con)', () => {
    const n0 = nguCanh.soCauSql();
    kv.kqdrLopFt(P.mbManager, ft);
    const n = nguCanh.soCauSql() - n0;
    assert(n <= 23, `kqdrLopFt ${n} câu`);
  });
}
