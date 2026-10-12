/** PHÉP KIỂM PR-LUI-a1 — Ý thức: ghi nhiều học viên / nhiều vi phạm, ô Vi phạm + Mô tả, tệp dùng chung. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuiA1Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LUI-a1 · Ý thức');

  check('LUIa1-1 · kiemTenViPham: trống / < 3 / > 60 báo lỗi, 3–60 qua', () => {
    assert(d.kiemTenViPham('') === 'Ghi vi phạm', d.kiemTenViPham(''));
    assert(d.kiemTenViPham(' ab ') === 'Cần ít nhất 3 ký tự (đang có 2)', d.kiemTenViPham(' ab '));
    assert(d.kiemTenViPham('x'.repeat(61)) === 'Tối đa 60 ký tự (đang có 61)', 'trần');
    assert(d.kiemTenViPham('Không nộp BTVN Reading') === null && d.VI_PHAM_TEN_TOI_DA === 60, 'qua');
  });

  check('LUIa1-2 · tachTenMoTa: dữ liệu cũ tự tách khi đọc, không đổi DB', () => {
    const ngan = d.tachTenMoTa(null, 'Đi muộn 15 phút', 'attendance');
    assert(ngan.ten === 'Đi muộn 15 phút' && ngan.moTa === '', JSON.stringify(ngan));
    const dai = 'Không nộp bài Reading buổi 12/09, đã nhắc hai lần trên nhóm lớp nhưng em vẫn chưa gửi bài';
    const r = d.tachTenMoTa(null, dai, 'homework');
    assert(r.ten.length <= 61 && r.ten.endsWith('…') && dai.startsWith(r.ten.slice(0, -1).trimEnd()) && r.moTa === dai, JSON.stringify(r));
    const khac = d.tachTenMoTa(null, 'Dùng điện thoại — chơi game trong giờ Speaking', 'other');
    assert(khac.ten === 'Dùng điện thoại' && khac.moTa === 'chơi game trong giờ Speaking', JSON.stringify(khac));
    const moi = d.tachTenMoTa('Quên vở', '', 'homework');
    assert(moi.ten === 'Quên vở' && moi.moTa === '', 'có ten thì giữ');
  });

  const { migratePrLuiA1 } = await import('../migrate/prLuiA1.ts');
  check('LUIa1-3 · migrate prLuiA1 chạy lặp được: DB đã có cột thì không báo gì, cột ten có', () => {
    const lan: string[] = [];
    migratePrLuiA1(conn, lan);
    assert(lan.length === 0, lan.join(' | '));
    assert((conn.prepare("SELECT name FROM pragma_table_info('violations')").all() as any[]).some((c) => c.name === 'ten'), 'thiếu cột ten');
  });

  const viol: any = await import('../yThuc/violations.ts');
  const { KEY_TAKEN_MESSAGE } = await import('../yThuc/access.ts');
  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const moiEm = (ten: string, lop = 'MB FT 101'): number => {
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: `LUIa1 ${ten}`, target: 7, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `luia1-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(`LUIa1 ${ten}`) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    return st.id as number;
  };
  const emLop = (lop: string, n: number): number[] => Array.from({ length: n }, (_, i) => moiEm(`${lop}-${i}-${Math.random().toString(36).slice(2, 6)}`, lop));
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher;
  const dongChung = { category: 'homework', skill: 'reading', ten: 'Không nộp BTVN Reading' };

  await checkAsync('LUIa1-4 · ghi MỘT vi phạm cho 3 em: 3 dòng, mô tả riêng em 2, mỗi em một nhật ký, GVCN một chuông mỗi em', () => thu(() => {
    const [a, b, c] = emLop('MB FT 101', 3);
    const r = viol.recordViolations(gvbm, { studentIds: [a, b, c], lines: [dongChung], moTaRieng: { [b]: 'Nộp nửa bài' }, idempotencyKey: 'luia1-4-khoa' });
    assert(r.loi.length === 0 && r.ok.length === 3, JSON.stringify(r));
    const dong = hang('SELECT student_id, ten, description FROM violations WHERE idempotency_key LIKE ? ORDER BY student_id', 'luia1-4-khoa:%');
    assert(dong.length === 3 && dong.every((x) => x.ten === 'Không nộp BTVN Reading'), JSON.stringify(dong));
    assert(dong.find((x) => x.student_id === b)!.description === 'Nộp nửa bài' && dong.filter((x) => x.student_id !== b).every((x) => x.description === ''), 'mô tả riêng');
    for (const sid of [a, b, c]) {
      const vid = r.ok.find((o: any) => o.studentId === sid).ids[0];
      assert(hang("SELECT 1 FROM audit_logs WHERE action = 'violation.record' AND entity_id = ?", vid).length === 1, 'nhật ký em ' + sid);
      const chuong = hang('SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?', gvcn.userId, `yt-moi:${sid}:${TODAY}`);
      assert(chuong.length === 1, `chuông GVCN em ${sid}: ${chuong.length}`);
    }
  }));

  await checkAsync('LUIa1-5 · một em nhiều dòng; nhiều em + nhiều dòng, > 10 dòng, > 8 em đều 400', () => thu(() => {
    const [a, b] = emLop('MB FT 101', 2);
    const r = viol.recordViolations(gvbm, { studentIds: [a], lines: [
      { category: 'homework', skill: 'reading', occurredOn: TODAY, ten: 'Không nộp BTVN Reading' },
      { category: 'attendance', skill: null, ten: 'Đi muộn 15 phút', moTa: 'Vào lớp sau 8h15' },
      { category: 'conduct', skill: 'speaking', ten: 'Nói chuyện riêng' },
    ], idempotencyKey: 'luia1-5-khoa' });
    assert(r.ok[0].ids.length === 3 && r.loi.length === 0, JSON.stringify(r));
    const dong = hang('SELECT category, skill, ten, description FROM violations WHERE student_id = ? AND idempotency_key LIKE ? ORDER BY id', a, 'luia1-5-khoa:%');
    assert(dong[0].category === 'homework' && dong[0].skill === 'reading' && dong[1].skill === null && dong[1].description === 'Vào lớp sau 8h15' && dong[2].ten === 'Nói chuyện riêng', JSON.stringify(dong));
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: [a, b], lines: [dongChung, dongChung], idempotencyKey: 'luia1-5-khoa-2' }), /Chọn nhiều học viên thì ghi một vi phạm\./, 'Q1-A');
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: [a], lines: Array.from({ length: 11 }, () => dongChung), idempotencyKey: 'luia1-5-khoa-3' }), /từ 1 đến 10/, '> 10 dòng');
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: emLop('MB FT 101', 9), lines: [dongChung], idempotencyKey: 'luia1-5-khoa-4' }), /từ 1 đến 8 học viên/, '> 8 em');
  }));

  await checkAsync('LUIa1-6 · gửi lại cùng khoá không thêm dòng, trả đúng id; người khác dùng khoá đó bị chặn', () => thu(() => {
    const [a, b] = emLop('MB FT 101', 2);
    const input = { studentIds: [a, b], lines: [dongChung], idempotencyKey: 'luia1-6-khoa' };
    const r1 = viol.recordViolations(gvbm, input);
    const dem = () => hang('SELECT id FROM violations WHERE idempotency_key LIKE ?', 'luia1-6-khoa:%').length;
    assert(dem() === 2, 'hai dòng');
    const r2 = viol.recordViolations(gvbm, input);
    assert(dem() === 2 && JSON.stringify(r2.ok) === JSON.stringify(r1.ok) && r2.loi.length === 0, 'gửi lại không thêm dòng: ' + JSON.stringify(r2));
    const r3 = viol.recordViolations(gvcn, input);
    assert(r3.ok.length === 0 && r3.loi.length === 2 && r3.loi.every((l: any) => l.ma === 400 && l.loi === KEY_TAKEN_MESSAGE), JSON.stringify(r3));
  }));

  await checkAsync('LUIa1-7 · em ngoài phạm vi vào loi (403), em khác vẫn lưu; nội dung sai → 400, không em nào được lưu', () => thu(() => {
    const [a, b] = emLop('MB FT 101', 2);
    const [ngoai] = emLop('CP FT 110', 1);
    const r = viol.recordViolations(gvbm, { studentIds: [a, ngoai, b], lines: [dongChung], idempotencyKey: 'luia1-7-khoa' });
    assert(r.ok.length === 2 && r.loi.length === 1 && r.loi[0].studentId === ngoai && r.loi[0].ma === 403, JSON.stringify(r));
    assert(hang('SELECT id FROM violations WHERE idempotency_key LIKE ?', 'luia1-7-khoa:%').length === 2, 'hai em lưu');
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: [a, b], lines: [{ ...dongChung, ten: 'ab' }], idempotencyKey: 'luia1-7-khoa-2' }), /Cần ít nhất 3 ký tự \(đang có 2\)/, 'ten 2 ký tự');
    assert(hang('SELECT id FROM violations WHERE idempotency_key LIKE ?', 'luia1-7-khoa-2:%').length === 0, 'không em nào được lưu');
  }));

  await checkAsync('LUIa1-8 · gọi cũ chỉ có description vẫn chạy (thành Vi phạm); Vi phạm ngắn < 10 nay được; sửa ten ghi lịch sử field ten', () => thu(() => {
    const [a] = emLop('MB FT 101', 1);
    const v = viol.recordViolation(gvbm, { studentId: a, category: 'attendance', description: 'Đi muộn 15 phút' }).violation;
    assert(v.ten === 'Đi muộn 15 phút' && v.moTa === '', JSON.stringify(v));
    assert(hang('SELECT description FROM violations WHERE id = ?', v.id)[0].description === '', 'cột description rỗng');
    const ngan = viol.recordViolation(gvbm, { studentId: a, category: 'conduct', ten: 'Ồn ào' }).violation;
    assert(ngan.ten === 'Ồn ào', 'ten ngắn được');
    const sua = viol.editViolation(gvbm, v.id, { ten: 'Đi muộn 20 phút' });
    assert(sua.ten === 'Đi muộn 20 phút', sua.ten);
    const ls = hang('SELECT field, old_value, new_value FROM violation_history WHERE violation_id = ?', v.id);
    assert(ls.length === 1 && ls[0].field === 'ten' && ls[0].old_value === 'Đi muộn 15 phút', JSON.stringify(ls));
    assertThrows(() => viol.recordViolation(gvbm, { studentId: a, category: 'conduct', ten: 'ab' }), /Vi phạm: Cần ít nhất 3 ký tự/, 'ten quá ngắn');
  }));

  await checkAsync('LUIa1-11 · tab Ý thức HV: dòng chính là Vi phạm ngắn; vi phạm cũ (ten NULL, mô tả 90 ký tự) hiện cắt "…", mô tả đủ ở chi tiết', () => thu(async () => {
    const [a] = emLop('MB FT 101', 1);
    const moi = viol.recordViolation(gvbm, { studentId: a, category: 'homework', ten: 'Quên vở bài tập', description: 'Quên mang vở buổi 12' }).violation;
    const dai = 'Không nộp bài Reading buổi 12/09, đã nhắc hai lần trên nhóm lớp nhưng em vẫn chưa gửi bài, cần xử lý';
    assert(dai.length >= 90, 'mô tả cũ ≥ 90 ký tự');
    const cu = Number(conn.prepare(
      `INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, ten, description, created_at)
       VALUES (?, ?, 'homework', ?, ?, ?, NULL, ?, ?)`).run(a, classId('MB FT 101'), TODAY, TODAY, gvbm.userId, dai, new Date().toISOString()).lastInsertRowid);
    const { yThucHocVien } = await import('../yThuc/xuLy.ts');
    const dong = (yThucHocVien(P.mbManager, a, { phamVi: 'tat-ca' }) as any).dongThoiGian.filter((x: any) => x.loai === 'vi-pham');
    assert(dong.find((x: any) => x.id === moi.id)?.viPham === 'Quên vở bài tập', JSON.stringify(dong.map((x: any) => x.viPham)));
    const x = dong.find((y: any) => y.id === cu);
    assert(x.viPham.length <= 61 && x.viPham.endsWith('…'), x.viPham);
    const ct = viol.violationDetail(P.mbManager, cu);
    assert(ct.ten === x.viPham && ct.moTa === dai, 'chi tiết có mô tả đủ');
    assert(viol.violationDetail(P.mbManager, moi.id).moTa === 'Quên mang vở buổi 12', 'mô tả riêng');
  }));

  check('LUIa1-12 · dsLoiGhiViPham: lỗi đúng chữ, đúng khoá ô theo từng dòng', () => {
    const l = d.dsLoiGhiViPham({ hocVien: [], dong: [{ nhom: '', ten: '' }, { nhom: 'homework', ten: 'ab' }] });
    assert(l.map((x: any) => x.khoa).join() === 'hoc-vien,nhom-1,ten-1,ten-2', l.map((x: any) => x.khoa).join());
    assert(l[0].lyDo === 'Chọn ít nhất một học viên' && l[1].lyDo === 'Chọn Nhóm' && l[2].lyDo === 'Ghi vi phạm' && l[3].lyDo === 'Cần ít nhất 3 ký tự (đang có 2)', JSON.stringify(l));
    assert(d.dsLoiGhiViPham({ hocVien: [7], dong: [{ nhom: 'homework', ten: 'Quên vở' }] }).length === 0, 'hợp lệ');
  });

  // ---------------------------------------------------------------- Sửa / Xoá lần xử lý đã xác nhận
  const att: any = await import('../platform/attachments.ts');
  const { khoTepHienTai } = await import('../platform/khoTep.ts');
  const kho = () => khoTepHienTai(att.uploadsDir());
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm số ${i + 1}`, occurredOn: new Date(Date.parse(TODAY) - (i + 1) * 864e5).toISOString().slice(0, 10) }).violation.id as number);
  const xuLy = (who: any, sid: number, ids: number[]) => xu.xacNhanXuLy(who, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
  const lienKet = (m: number) => (hang('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id', m)).map((r) => r.violation_id as number);

  await checkAsync('LUIa1-13 · suaViPhamXuLy: thêm / bỏ vi phạm, lịch sử + nhật ký; em khác / lần khác / rỗng → 400', () => thu(() => {
    const sid = moiEm('13'); const [v1, v2, v3] = nVp(sid, 3);
    const r1 = xuLy(gvcn, sid, [v1, v2]);
    const kq = xu.suaViPhamXuLy(P.mbManager, r1.id, { violationIds: [v1, v3] });
    assert(JSON.stringify(lienKet(r1.id)) === JSON.stringify([v1, v3].sort((a, b) => a - b)) && kq.viPham.length === 2, 'liên kết sau sửa');
    const ls = hang("SELECT violation_id, old_value, new_value FROM violation_history WHERE field = 'measure' AND violation_id IN (?, ?) ORDER BY id", v2, v3);
    assert(ls.some((h) => h.violation_id === v2 && h.old_value === String(r1.id) && h.new_value === null) && ls.some((h) => h.violation_id === v3 && h.old_value === null && h.new_value === String(r1.id)), JSON.stringify(ls));
    assert(viol.loadViolation(v2).trangThai !== 'da_xu_ly', 'v2 về chưa xử lý');
    const nk = hang("SELECT before_json, after_json FROM audit_logs WHERE action = 'discipline.edit' AND entity_id = ?", r1.id);
    assert(nk.length === 1 && JSON.parse(nk[0].after_json).violations.length === 2, JSON.stringify(nk));
    xuLy(gvcn, sid, [v2]);   // Report 2 giữ v2
    assertThrows(() => xu.suaViPhamXuLy(P.mbManager, r1.id, { violationIds: [v1, v3, v2] }), /đã nằm trong lần xử lý khác/, 'v2 ở lần khác');
    const [khac] = nVp(moiEm('13b'), 1);
    assertThrows(() => xu.suaViPhamXuLy(P.mbManager, r1.id, { violationIds: [v1, khac] }), /không thuộc học viên này/, 'vi phạm em khác');
    assertThrows(() => xu.suaViPhamXuLy(P.mbManager, r1.id, { violationIds: [] }), /Còn ít nhất 1 vi phạm/, 'rỗng');
  }));

  await checkAsync('LUIa1-14 · xoaXuLy: chỉ lần mới nhất; dòng, liên kết, tệp biến mất; bậc về Report 1; nhật ký giữ đủ', () => thu(async () => {
    const sid = moiEm('14'); const [v1, v2] = nVp(sid, 2);
    const r1 = xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    assert(r2.bac === 2 && xu.xemXuLy(P.mbManager, r1.id).coTheXoa === false && xu.xemXuLy(P.mbManager, r1.id).lanSau === 'Report 2', 'r1 không xoá được khi còn r2');
    const x2 = xu.xemXuLy(P.mbManager, r2.id);
    assert(x2.coTheXoa && x2.bacVe === 1 && x2.chuaXuLy.length === 0, `bacVe/chuaXuLy: ${x2.bacVe} ${x2.chuaXuLy.length}`);
    assertThrows(() => xu.xoaXuLy(P.mbManager, r1.id), /Đã có Report 2 sau lần này — xoá Report 2 trước\./, 'còn lần sau');
    const tep = await att.addFile(P.mbManager, { ownerType: 'discipline_measure', ownerId: r2.id, fileName: 'bien-ban.pdf', data: Buffer.from('bb') });
    const url = hang('SELECT url FROM attachments WHERE id = ?', tep.id)[0].url as string;
    try {
      const kq = xu.xoaXuLy(P.mbManager, r2.id);
      assert(kq.ok && kq.bac === 1, JSON.stringify(kq));
      assert(hang('SELECT id FROM discipline_measures WHERE id = ?', r2.id).length === 0 && lienKet(r2.id).length === 0, 'dòng + liên kết');
      assert(hang('SELECT id FROM attachments WHERE owner_type = ? AND owner_id = ?', 'discipline_measure', r2.id).length === 0, 'tệp');
      assert(await kho().doc(url) === null, 'kho đã xoá tệp');
      const hv = xu.yThucHocVien(P.mbManager, sid);
      assert(hv.bac === 1 && hv.keTiep.kind === 'report_2', `bậc ${hv.bac} kế ${hv.keTiep.kind}`);
      const nk = hang("SELECT before_json FROM audit_logs WHERE action = 'discipline.delete' AND entity_id = ?", r2.id);
      const truoc = JSON.parse(nk[0].before_json);
      assert(nk.length === 1 && truoc.kind === 'report_2' && truoc.note.includes('gọi điện') && truoc.violations[0] === v2 && truoc.attachments === 1 && truoc.performedOn === TODAY, nk[0]?.before_json);
      assert(viol.loadViolation(v2).trangThai !== 'da_xu_ly', 'v2 về chưa xử lý');
      xu.xoaXuLy(P.mbManager, r1.id);
      assert(xu.yThucHocVien(P.mbManager, sid).bac === 0, 'xoá hết thì bậc 0');
    } finally { await kho().xoa(url); }
  }));

  await checkAsync('LUIa1-15 · quyền: GVBM 403; GVCN lần đã thực hiện 403, lần chờ duyệt / đã duyệt được; QL ngoài phạm vi 403; nháp → 400', () => thu(() => {
    const sid = moiEm('15'); const [v1, v2, v3] = nVp(sid, 3);
    const r1 = xuLy(gvcn, sid, [v1]);
    assertThrows(() => xu.suaViPhamXuLy(gvbm, r1.id, { violationIds: [v1, v2] }), /chủ nhiệm/, 'GVBM sửa: câu quyền chung, không phải "chỉ Quản lý"');
    assertThrows(() => xu.xoaXuLy(gvbm, r1.id), /chủ nhiệm/, 'GVBM xoá');
    assertThrows(() => xu.suaViPhamXuLy(gvcn, r1.id, { violationIds: [v1, v2] }), /chỉ Quản lý/, 'GVCN sửa lần đã thực hiện');
    assertThrows(() => xu.xoaXuLy(gvcn, r1.id), /chỉ Quản lý/, 'GVCN xoá lần đã thực hiện');
    assertThrows(() => xu.xoaXuLy(P.cpManager, r1.id), /chủ nhiệm/, 'QL chi nhánh khác: câu quyền chung');
    assert(xu.xemXuLy(gvcn, r1.id).coTheSua === false && xu.xemXuLy(P.mbManager, r1.id).coTheSua === true, 'cờ coTheSua');
    for (const st of ['cho_duyet', 'da_duyet']) {
      conn.prepare('UPDATE discipline_measures SET status = ? WHERE id = ?').run(st, r1.id);
      assert(xu.suaViPhamXuLy(gvcn, r1.id, { violationIds: [v1, v2] }).viPham.length === 2, 'GVCN sửa lần ' + st);
      xu.suaViPhamXuLy(gvcn, r1.id, { violationIds: [v1] });
    }
    conn.prepare("UPDATE discipline_measures SET status = 'nhap' WHERE id = ?").run(r1.id);
    assertThrows(() => xu.xoaXuLy(P.mbManager, r1.id), /chưa gửi/, 'nháp');
    void v3;
  }));

  // ---------------------------------------------------------------- tệp dùng chung
  const ba = (): { a: number; b: number; c: number } => {
    const [s1, s2, s3] = emLop('MB FT 101', 3);
    const ghi = (sid: number) => viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: 'Không nộp BTVN Reading' }).violation.id as number;
    return { a: ghi(s1), b: ghi(s2), c: ghi(s3) };
  };

  await checkAsync('LUIa1-9 · chepTep: 3 dòng cùng khoá kho; thiếu quyền một bản ghi → 403 không dòng nào thêm; > 60 → 400; nguồn ngoài quyền xem → 403', () => thu(async () => {
    const { a, b, c } = ba();
    const goc = await att.addFile(gvbm, { ownerType: 'violation', ownerId: a, fileName: 'anh-vo-btvn.jpg', data: Buffer.from('anh') });
    const url9 = hang('SELECT url FROM attachments WHERE id = ?', goc.id)[0].url as string;
    try {
      assertThrows(() => att.chepTep(P.w2Teacher, { tuId: goc.id, ownerType: 'violation', ownerIds: [b, c] }), /quyền|đính kèm/, 'GV khác không sửa được vi phạm của đồng nghiệp');
      assert(hang('SELECT id FROM attachments WHERE owner_type = ? AND owner_id IN (?, ?)', 'violation', b, c).length === 0, 'lỗi quyền thì không dòng nào thêm');
      const ra = att.chepTep(gvbm, { tuId: goc.id, ownerType: 'violation', ownerIds: [b, c] });
      const dong = hang('SELECT url, display_name, size_bytes FROM attachments WHERE owner_type = ? AND owner_id IN (?, ?, ?)', 'violation', a, b, c);
      assert(ra.length === 2 && dong.length === 3 && new Set(dong.map((x) => x.url)).size === 1 && dong.every((x) => x.display_name === 'anh-vo-btvn.jpg'), JSON.stringify(dong));
      assertThrows(() => att.chepTep(gvbm, { tuId: goc.id, ownerType: 'violation', ownerIds: Array.from({ length: 9 }, (_, i) => 100000 + i) }), /từ 1 đến 8/, '> 8');
      assertThrows(() => att.chepTep(P.cpManager, { tuId: goc.id, ownerType: 'violation', ownerIds: [b] }), /phạm vi|quyền/, 'nguồn ngoài quyền xem');
    } finally { await kho().xoa(url9); }
  }));

  await checkAsync('LUIa1-10 · xoá vi phạm / gỡ một dòng tệp: kho chỉ xoá khi dòng cuối đi', () => thu(async () => {
    const { a, b, c } = ba();
    const goc = await att.addFile(gvbm, { ownerType: 'violation', ownerId: a, fileName: 'anh.jpg', data: Buffer.from('anh') });
    att.chepTep(gvbm, { tuId: goc.id, ownerType: 'violation', ownerIds: [b, c] });
    const url = hang('SELECT url FROM attachments WHERE id = ?', goc.id)[0].url as string;
    try {
      viol.deleteViolation(gvbm, a);
      assert(await kho().doc(url) !== null, 'xoá vi phạm A mà B, C còn thì tệp phải còn trong kho');
      const dongB = hang('SELECT id FROM attachments WHERE owner_type = ? AND owner_id = ?', 'violation', b)[0].id as number;
      await att.removeAttachment(gvbm, dongB);
      assert(await kho().doc(url) !== null, 'gỡ dòng của B mà C còn thì tệp phải còn');
      viol.deleteViolation(gvbm, c);
      assert(await kho().doc(url) === null, 'dòng cuối đi thì kho xoá');
    } finally { await kho().xoa(url); }
  }));

  // ---------------------------------------------------------------- sửa sau rà (I1–I3 + mục nhỏ)
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');

  await checkAsync('LUIa1-16 · I1: xoá MỘT học viên không làm mất tệp dùng chung của em khác (kho theo dòng còn lại)', () => thu(async () => {
    const [a, b, c] = emLop('MB FT 101', 3);
    const ids = viol.recordViolations(gvbm, { studentIds: [a, b, c], lines: [dongChung], idempotencyKey: 'luia1-16-khoa' }).ok.map((o: any) => o.ids[0] as number);
    const goc = await att.addFile(gvbm, { ownerType: 'violation', ownerId: ids[0], fileName: 'anh.jpg', data: Buffer.from('anh') });
    att.chepTep(gvbm, { tuId: goc.id, ownerType: 'violation', ownerIds: ids.slice(1) });
    const url = hang('SELECT url FROM attachments WHERE id = ?', goc.id)[0].url as string;
    try {
      const ma = (hang('SELECT student_code FROM students WHERE id = ?', a)[0]).student_code as string;
      xoaHV.xoaHocVien(P.admin, a, { maXacNhan: ma });
      assert(hang('SELECT id FROM violations WHERE id = ?', ids[0]).length === 0, 'em a đã xoá');
      assert(await kho().doc(url) !== null, 'tệp chung phải còn trong kho cho hai em kia');
      assert(hang('SELECT id FROM attachments WHERE url = ?', url).length === 2, 'hai dòng tệp còn');
    } finally { await kho().xoa(url); }
  }));

  await checkAsync('LUIa1-17 · I2: số câu SQL — ghi 8 em, 1 em 10 dòng, chép tệp 8 bản ghi đều ≤ 200 (trần 10 s Netlify)', () => thu(async () => {
    const tam = emLop('MB FT 101', 8);
    let n0 = soCauSql();
    viol.recordViolations(gvbm, { studentIds: tam, lines: [dongChung], idempotencyKey: 'luia1-17-khoa-a' });
    const c8 = soCauSql() - n0;
    const mot = tam[0];
    n0 = soCauSql();
    viol.recordViolations(gvbm, { studentIds: [mot], lines: Array.from({ length: 10 }, (_, i) => ({ ...dongChung, ten: `Vi phạm số ${i + 1}` })), idempotencyKey: 'luia1-17-khoa-b' });
    const d10 = soCauSql() - n0;
    const ids = hang('SELECT id FROM violations WHERE idempotency_key LIKE ?', 'luia1-17-khoa-a:%').map((r) => r.id as number);
    const goc = await att.addFile(gvbm, { ownerType: 'violation', ownerId: ids[0], fileName: 'anh.jpg', data: Buffer.from('anh') });
    const url = hang('SELECT url FROM attachments WHERE id = ?', goc.id)[0].url as string;
    try {
      n0 = soCauSql();
      att.chepTep(gvbm, { tuId: goc.id, ownerType: 'violation', ownerIds: ids.slice(1) });
      const cc = soCauSql() - n0;
      console.log(`      (đo: ghi 8 em ${c8} câu · 1 em 10 dòng ${d10} câu · chép 7 bản ghi ${cc} câu)`);
      assert(c8 <= 200, `ghi 8 em ${c8} câu`);
      assert(d10 <= 200, `1 em 10 dòng ${d10} câu`);
      assert(cc <= 200, `chép tệp ${cc} câu`);
    } finally { await kho().xoa(url); }
  }));

  check('LUIa1-18 · I3: nhiều em + nhiều dòng báo lỗi ngay tại ô (dsLoiGhiViPham), không gửi', () => {
    const l = d.dsLoiGhiViPham({ hocVien: [1, 2], dong: [{ nhom: 'homework', ten: 'Quên vở' }, { nhom: 'homework', ten: 'Đi muộn' }] });
    assert(l.length === 1 && l[0].khoa === 'hoc-vien' && l[0].lyDo === 'Chọn nhiều học viên thì ghi một vi phạm.', JSON.stringify(l));
    assert(d.dsLoiGhiViPham({ hocVien: [1], dong: [{ nhom: 'homework', ten: 'Quên vở' }, { nhom: 'homework', ten: 'Đi muộn' }] }).length === 0, 'một em nhiều dòng vẫn hợp lệ');
  });

  await checkAsync('LUIa1-19 · mục nhỏ: lines:[null] → 400; môn sai → 400 trước khi ghi; một em nhiều dòng bỏ mô tả riêng; chép chỉ cùng loại; lần bị từ chối không chặn xoá', () => thu(async () => {
    const [a, b] = emLop('MB FT 101', 2);
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: [a], lines: [null as any], idempotencyKey: 'luia1-19-khoa-0' }), /Vi phạm|dòng/, 'lines:[null]');
    assertThrows(() => viol.recordViolations(gvbm, { studentIds: [a, b], lines: [{ ...dongChung, skill: 'mon-la' }], idempotencyKey: 'luia1-19-khoa-1' }), /Môn không hợp lệ/, 'môn sai');
    assert(hang('SELECT id FROM violations WHERE idempotency_key LIKE ?', 'luia1-19-khoa-1:%').length === 0, 'môn sai thì không em nào được lưu');
    viol.recordViolations(gvbm, { studentIds: [a], lines: [{ ...dongChung, moTa: 'm1' }, { ...dongChung, ten: 'Dòng hai', moTa: 'm2' }], moTaRieng: { [a]: 'riêng' }, idempotencyKey: 'luia1-19-khoa-2' });
    const ds = hang('SELECT description FROM violations WHERE idempotency_key LIKE ? ORDER BY id', 'luia1-19-khoa-2:%').map((r) => r.description);
    assert(ds.join('|') === 'm1|m2', 'một em nhiều dòng: mô tả riêng không đè — ' + ds.join('|'));
    const v = viol.recordViolation(gvbm, { studentId: a, category: 'homework', ten: 'Chép tệp' }).violation.id as number;
    const goc = await att.addFile(gvbm, { ownerType: 'violation', ownerId: v, fileName: 'a.jpg', data: Buffer.from('x') });
    const url = hang('SELECT url FROM attachments WHERE id = ?', goc.id)[0].url as string;
    try {
      assertThrows(() => att.chepTep(gvbm, { tuId: goc.id, ownerType: 'discipline_measure', ownerIds: [1] }), /cùng loại/, 'chép khác loại bản ghi');
    } finally { await kho().xoa(url); }
    const sid = moiEm('19'); const [v1, v2] = nVp(sid, 2);
    const r1 = xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    conn.prepare("UPDATE discipline_measures SET status = 'tu_choi' WHERE id = ?").run(r2.id);
    assert(xu.xoaXuLy(P.mbManager, r1.id).ok, 'lần sau bị từ chối không chặn xoá lần trước');
  }));

  await checkAsync('LUIa1-20 · nhật ký Xoá lần xử lý ghi "đã báo PH" khi em có việc Báo phụ huynh đã xong', () => thu(() => {
    const sid = moiEm('20'); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    const att0 = Number((conn.prepare('SELECT id FROM assessment_attempts LIMIT 1').get() as any).id);
    conn.prepare("INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'bao_ph_tvv', 1, 'done', ?)").run(att0, sid, new Date().toISOString());
    xu.xoaXuLy(P.mbManager, r1.id);
    const nk = hang("SELECT before_json FROM audit_logs WHERE action = 'discipline.delete' AND entity_id = ?", r1.id);
    assert(JSON.parse(nk[0].before_json).daBaoPhuHuynh === true, nk[0].before_json);
  }));
}
