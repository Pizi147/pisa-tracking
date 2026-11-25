/**
 * PHÉP KIỂM RÀ 25/11 — việc PR 1–6 để lại (chủ SP "làm 1-7"; việc 7 là mockup). Ghi trong BEGIN … ROLLBACK.
 *  R1  Tổng quan chế độ LỚP (một chi nhánh): lớp đã kết thúc còn em ở Đạt MT / Thi tháng này → vẫn một hàng; Σ hàng = ô tổng
 *  R3  Nhập KQ thi thật ghi sổ nghĩa vụ ngay (N46: MT chưa làm thôi là việc) — không chờ đối chiếu đêm
 *  R5a Case S chấm chéo: ô gõ là nháp — "xác nhận" chỉ khi bấm (không tự lưu 1 s gửi nửa câu)
 *  R5b Rút tình hình học tập: đọc + kiểm "đã có kết quả" trong cùng giao dịch ghi
 *  R5c Hoàn thành Case có Hoàn tác ngắn: chỉ người vừa đóng, trong cửa sổ ngắn; Mở lại Case vẫn như cũ
 *  R5d Thẻ chờ duyệt của em đã đổi chi nhánh: QL chi nhánh HIỆN TẠI của em duyệt + thấy trong hộp chi nhánh mình (trước: QL cả hai bên 403)
 *  R6  Chữ ≤ 500 ký tự (#2167) xuống dòng, không tràn / cắt "…": body ngắt từ dài; ghi chú lịch thi đủ chữ + ô sửa nhiều dòng; ghi chú phối hợp TVV mở đủ
 *  R7b Rút đề xuất Ý thức: hộp xác nhận nêu đúng đối tượng mất (lần xử lý ngày … + n tệp), nút Rút nguy hiểm / Huỷ — thẻ Chờ duyệt và panel xử lý
 *  R5d2 thẻ việc của lớp cũ (Mini Test, Final dời, Kế hoạch bổ trợ) giữ lớp + chi nhánh lúc tạo; QL đã xử lý vẫn thấy ở Đã xử lý
 *  R2  Chuyển lớp FT → FT, lượt lẫn ô cũ (trước tuần chuyển) + ô tuần sau: ở lại lớp cũ tới khi ô cũ chấm xong, rồi về lớp mới (ô tuần sau là việc lớp mới, có nhật ký)
 *  R2b/c (PTA P1) lượt chỉ có ô cũ chấm xong / ô cũ vắng → vẫn ở lớp lúc thi
 */
export async function runPrRa2511SuaTests(t: any) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nRÀ 25/11 · việc để lại 1–6');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const tq: any = await import('../worklist/tongQuanV5.ts');
  const await_: any = {
    students: await import('../students/students.ts'), conOCho: await import('../fasttrack/conOCho.ts'),
    scoreDebt: await import('../worklist/scoreDebt.ts'), keHoach: await import('../keHoach/keHoachTest.ts'),
    thiThat: await import('../loTrinh/thiThat.ts'), soNv: await import('../phanTich/soNghiaVu.ts'),
    yc: await import('../duyet/yeuCau.ts'), cases: await import('../cases/cases.ts'), intake: await import('../classes/intake.ts'), dm: await import('../../../shared/domain/index.ts'),
    emailThu: (await import('../seed/emailThu.ts')).emailThu, fs: await import('node:fs'), path: await import('node:path'), url: await import('node:url'),
  };

  check('R1 · Tổng quan chế độ LỚP: lớp đã kết thúc còn em ở ô Đạt MT / Thi tháng này vẫn có hàng — Σ hàng = ô tổng', () => thu(() => {
    const thang = TODAY.slice(0, 7);
    const lopThi = one(`SELECT c.id, c.branch_id FROM learning_cycles cy JOIN students s ON s.id = cy.student_id AND s.archived_at IS NULL
        JOIN enrollments e ON e.student_id = cy.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
       WHERE c.is_fast_track = 1 AND cy.status != 'abandoned' AND cy.exam_date BETWEEN ? AND ? ORDER BY c.id LIMIT 1`, `${thang}-01`, `${thang}-31`);
    assert(lopThi, 'seed thiếu lớp FT có em thi tháng này');
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(lopThi.id);
    xoaNho();
    const r = tq.tongQuanV5(P.admin, { ct: 'ft', branchId: lopThi.branch_id });
    assert(r.lop, 'Admin chọn một chi nhánh phải ở chế độ lớp');
    const cong = (f: (h: any) => number) => r.lop.reduce((n: number, h: any) => n + f(h), 0);
    assert(r.thiThangNay > 0 && cong((h) => h.thiThangNay) === r.thiThangNay, `Thi tháng này: Σ hàng ${cong((h) => h.thiThangNay)} ≠ ô ${r.thiThangNay}`);
    if (r.datMt) assert(cong((h) => h.datMt?.mau ?? 0) === r.datMt.mau && cong((h) => h.datMt?.dat ?? 0) === r.datMt.dat, `Đạt MT: Σ hàng ≠ ô ${JSON.stringify(r.datMt)}`);
    const h = r.lop.find((x: any) => x.id === lopThi.id);
    assert(h && h.khoa === `lop:${lopThi.id}` && h.ma && !h.ma.startsWith('#') && h.hv === 0, `hàng lớp đã kết thúc: ${JSON.stringify(h)}`);
  }));

  /* R2 (PTA rà #2190 P1): `cach` = 'sau' — L dời sang tuần sau ngày chuyển, ô cũ chấm xong · 'chiCu' — chỉ ô cũ, chấm ô cuối · 'vang' — chỉ ô cũ, ô cũ vắng. */
  const r2 = (cach: 'sau' | 'chiCu' | 'vang') => {
    const { capNhatConOCho } = await_.conOCho;
    const a = one(`SELECT a.id, a.student_id AS sid, a.class_id, a.cycle_id, c.branch_id FROM assessment_attempts a
        JOIN classes c ON c.id = a.class_id AND c.status = 'active' AND c.is_fast_track = 1
        JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
        JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
        JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active' AND (cy.buoc_tiep IS NULL OR cy.buoc_tiep != 'lo_trinh_moi')
       WHERE a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock' AND a.o_cho_tu IS NOT NULL AND a.o_cho_tu != '' AND a.o_cho_tu < ?
         AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status NOT IN ('cancelled', 'absent'))
         AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = 'listening' AND sc.band IS NOT NULL)
       ORDER BY a.id LIMIT 1`, TODAY);
    assert(a, 'seed: cần lượt Mock FT còn ô chờ (có L chưa điểm), tuần thi trước hôm nay');
    const dich = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id != ? ORDER BY branch_id != ?, id LIMIT 1`, a.class_id, a.branch_id);
    const tuanSau = one(`SELECT id, week_start FROM report_periods WHERE week_start > ? ORDER BY week_start LIMIT 1`, TODAY);
    assert(dich && tuanSau, 'seed: cần lớp FT khác + tuần sau hôm nay');
    if (cach === 'sau') { conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'listening'`).run(tuanSau.id, a.id); capNhatConOCho([a.id]); }
    await_.students.transferStudent(P.admin, a.sid, dich.id, TODAY, 'Đổi lịch học', { note: 'Bàn giao' });
    xoaNho();
    const lopCua = () => one('SELECT class_id FROM assessment_attempts WHERE id = ?', a.id).class_id as number;
    assert(lopCua() === a.class_id, 'ô cũ còn chờ: lượt phải ở lại lớp lúc thi');
    const cu = cach === 'sau' ? ['reading', 'writing1', 'writing2', 'speaking'] : ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
    if (cach === 'vang') conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ?`).run(a.id);
    else for (const sk of cu) {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(a.id, sk);
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, ?, 6, ?)`).run(a.id, sk, `${TODAY}T03:00:00.000Z`);
    }
    capNhatConOCho([a.id]);
    xoaNho();
    return { a, dich, tuanSau, lop: lopCua(), nk: one(`SELECT before_json, after_json FROM audit_logs WHERE action = 'attempt.doi_lop_tu_dong' AND entity_id = ? ORDER BY id DESC LIMIT 1`, a.id) };
  };

  check('R2 · FT → FT: lượt có ô cũ + ô tuần sau — ở lại lớp cũ, chấm xong ô cũ thì về lớp mới (có nhật ký); ô tuần sau là việc GV lớp mới, vẫn ở Kế hoạch Test lớp mới', () => thu(() => {
    const { a, dich, tuanSau, lop, nk } = r2('sau');
    assert(lop === dich.id, `ô cũ chấm xong: lượt phải về lớp mới (${lop} ≠ ${dich.id})`);
    assert(nk && JSON.parse(nk.before_json).classId === a.class_id && JSON.parse(nk.after_json).classId === dich.id, `nhật ký đổi lớp: ${JSON.stringify(nk)}`);
    const gvMoi = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' ORDER BY id DESC LIMIT 1`, dich.id)?.user_id ?? null;
    const giu = await_.scoreDebt.nguoiGiuO([dich.id], TODAY)(dich.id, 'listening', tuanSau.week_start);
    assert((giu?.userId ?? null) === gvMoi, `ô tuần sau: người giữ phải là GV L lớp mới (${giu?.userId} ≠ ${gvMoi})`);
    const luoi = await_.keHoach.luoiFT(P.admin, dich.id) as any;
    assert(JSON.stringify(luoi).includes(`"attemptId":${a.id}`) || JSON.stringify(luoi).includes(`"id":${a.id}`), 'Kế hoạch Test lớp mới phải có lượt');
  }));

  check('R2b · (PTA P1) lượt CHỈ có ô thi trước ngày chuyển: chấm ô cuối → vẫn ở lớp cũ, không nhật ký đổi lớp', () => thu(() => {
    const { a, lop, nk } = r2('chiCu');
    assert(lop === a.class_id && !nk, `bài thi xong ở lớp cũ bị kéo sang lớp ${lop}`);
  }));

  check('R2c · (PTA P1) ô cũ bị vắng / huỷ hết (cờ NULL) → vẫn ở lớp cũ', () => thu(() => {
    const { a, lop, nk } = r2('vang');
    assert(lop === a.class_id && !nk, `ô cũ vắng mà lượt sang lớp ${lop}`);
  }));

  check('R3 · Nhập KQ thi thật → sổ nghĩa vụ ghi ngay trong cùng giao dịch (MT chưa làm thành "khong-con-viec", N46); Hoàn tác ghi lại', () => thu(() => {
    const x = one(`SELECT cy.id AS cy, a.id AS luot FROM learning_cycles cy JOIN students s ON s.id = cy.student_id AND s.status = 'active' AND s.archived_at IS NULL
        JOIN assessment_attempts a ON a.cycle_id = cy.id AND a.status = 'planned' AND a.kind = 'mock' AND a.lich_su = 0
       WHERE cy.status = 'active' AND cy.route IS NOT NULL AND cy.thi_that_khong_thi = 0 AND cy.thi_that_l IS NULL AND cy.outcome_score IS NULL
         AND COALESCE(cy.outcome, 'unknown') = 'unknown' AND (cy.buoc_tiep IS NULL OR cy.buoc_tiep IN ('ket_thuc', 'tam_dung', 'lo_trinh_moi'))
         AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL))
         AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.planned_period_id IS NOT NULL AND k.required = 1)
       ORDER BY cy.id LIMIT 1`);
    assert(x, 'seed: cần lộ trình FT chưa KQ thi thật có MT chưa làm đã xếp tuần');
    const so = () => (conn.prepare(`SELECT khoa, khong_tinh FROM nghia_vu WHERE khoa LIKE ? ORDER BY khoa`).all(`bai:${x.luot}:%`) as any[]).map((r) => `${r.khoa}=${r.khong_tinh}`).join(' ');
    const tinh = () => await_.soNv.tinhBai(x.luot).map((d: any) => `${d.khoa}=${d.khongTinh}`).sort().join(' ');
    xoaNho();
    const r = await_.thiThat.datKetQuaThiThat(P.admin, x.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    xoaNho();
    assert(tinh().includes('khong-con-viec'), `seed: sau KQ thi thật MT chưa làm phải "khong-con-viec" (${tinh()})`);
    assert(so() === tinh(), `sổ chưa ghi lại sau KQ thi thật: sổ [${so()}] ≠ tính [${tinh()}]`);
    await_.thiThat.khoiPhucThiThat(P.admin, x.cy, { auditId: r.khoiPhucId, hoanTac: true });
    xoaNho();
    assert(so() === tinh() && !tinh().includes('khong-con-viec'), `sổ chưa ghi lại sau Hoàn tác: sổ [${so()}] ≠ tính [${tinh()}]`);
  }));

  const REPO = await_.path.resolve(await_.url.fileURLToPath(new URL('../../../../', import.meta.url)));
  const doc = (f: string) => await_.fs.readFileSync(await_.path.join(REPO, f), 'utf8') as string;

  check('R5a · Case S chấm chéo: "xac-nhan-s {cach:viet}" chỉ gọi từ nút bấm — ô tự lưu không xác nhận', () => {
    const src = doc('web/src/modules/cases/CasePanel.tsx');
    const mo = src.slice(src.indexOf('function MoTaCase('), src.indexOf('function MoLaiCase('));
    assert(mo.length > 100, 'không tìm thấy MoTaCase');
    const viet = mo.match(/cach: 'viet'/g) ?? [];
    assert(viet.length === 1 && /const vietS = async/.test(mo), 'chỉ MỘT chỗ gửi cach viet, trong vietS');
    assert(/onClick=\{\(\) => void vietS\(\)\}/.test(mo), 'vietS gọi từ nút bấm');
    const luu = mo.slice(mo.indexOf('const luu = async'), mo.indexOf('const xacNhanS'));
    assert(!/xac-nhan-s/.test(luu), 'hàm tự lưu (OGoTuLuu luu) không được gọi xac-nhan-s');
    assert(/go && s \? \(/.test(mo) && /useBaoDangSua\(!!s && nS > 0\)/.test(mo), 'S chờ xác nhận: ô nháp riêng + giữ chữ khi đóng panel');
  });

  check('R5b · Rút tình hình: đọc + kiểm "đã có kết quả" TRONG tx (khoá ghi) — không bỏ việc đã có kết quả xen giữa', () => {
    const src = doc('server/src/yThuc/tinhHinh.ts');
    const f = src.slice(src.indexOf('export function rutTinhHinh('), src.indexOf('export function boRutTinhHinh('));
    assert(/\{\s*\/\*[\s\S]*?\*\/\s*return tx\(\(\) => \{\s*const r = load\(id\);[\s\S]*coKetQua\(r\)/.test(f), 'load + coKetQua phải nằm trong tx');
  });

  check('R5c · Hoàn thành Case → Hoàn tác: người vừa đóng (≤ cửa sổ) mở lại được; người khác / quá cửa sổ → 409; Mở lại thường giữ nguyên', () => thu(() => {
    const ten = `RA2511 HV ${Date.now()}`;
    await_.intake.commitIntake(P.admin, { classId: t.classId('MB FT 101'), rows: [{ fullName: ten, target: 6.5, email: await_.emailThu(), dob: '2010-01-01' }], idempotencyKey: `ra2511-${Date.now()}` });
    const sid = one('SELECT id FROM students WHERE full_name = ?', ten).id;
    const nn = await_.dm.issuesForTopic('listening')[0];
    const r = await_.cases.reportIssue(P.coreTeacher, { studentId: sid, topic: 'listening', primaryCode: nn.code, title: 'Listening · thử', summary: 'Em nghe chậm phần 3', idempotencyKey: `ra2511-c-${sid}` });
    const dong = () => await_.cases.closeCaseOutcome(P.mbManager, r.id, { outcome: 'improved', note: 'Em đã nghe tốt hơn' });
    const tt = () => one('SELECT status FROM sos_cases WHERE id = ?', r.id).status;
    const ma = (f: () => unknown) => { try { f(); return 200; } catch (e: any) { return e?.status; } };
    dong();
    assert(ma(() => await_.cases.moLaiCase(P.admin, r.id, { hoanTac: true })) === 409 && tt() === 'done', 'người khác bấm Hoàn tác → 409');
    assert(ma(() => await_.cases.moLaiCase(P.mbManager, r.id, { hoanTac: true })) === 200 && tt() !== 'done', 'người vừa đóng Hoàn tác được');
    dong();
    conn.prepare('UPDATE sos_cases SET outcome_at = ? WHERE id = ?').run(new Date(Date.now() - 16 * 60_000).toISOString(), r.id);
    assert(ma(() => await_.cases.moLaiCase(P.mbManager, r.id, { hoanTac: true })) === 409 && tt() === 'done', 'quá cửa sổ → 409');
    assert(ma(() => await_.cases.moLaiCase(P.admin, r.id)) === 200 && tt() !== 'done', 'Mở lại Case (không Hoàn tác) như cũ');
    const web = doc('web/src/modules/cases/ThaoTacCase.tsx');
    assert(/toast\.hoanTac\(t\('Đã hoàn thành Case'\)/.test(web) && /mo-lai`, \{ hoanTac: true \}/.test(web), 'toast Hoàn thành Case có Hoàn tác gọi mo-lai hoanTac');
  }));

  check('R5d · Thẻ chờ duyệt, em chuyển MB → CP: QL CP duyệt được + thấy ở hộp CP; QL MB thôi (trước: cả hai 403)', () => thu(() => {
    const y = one(`SELECT y.id, y.hoc_vien_id AS sid FROM yeu_cau_duyet y JOIN students s ON s.id = y.hoc_vien_id AND s.status = 'active' AND s.archived_at IS NULL
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
       WHERE y.trang_thai = 'cho' AND y.loai NOT IN ('y_thuc', 'sua_khai_bac') ORDER BY y.id LIMIT 1`);
    assert(y, 'seed: cần thẻ chờ duyệt của em lớp FT MB');
    const lopCp = one(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id AND b.code = 'CP' WHERE c.status = 'active' AND c.is_fast_track = 1 ORDER BY c.id LIMIT 1`);
    assert(lopCp, 'seed: cần lớp FT CP');
    xoaNho();
    const thay = (q: any) => await_.yc.trongPhamVi(q, [one('SELECT * FROM yeu_cau_duyet WHERE id = ?', y.id)]).length === 1;
    assert(thay(P.mbManager) && !thay(P.cpManager), 'trước khi chuyển: QL MB duyệt, QL CP không');
    await_.students.transferStudent(P.admin, y.sid, lopCp.id, TODAY, 'Đổi chi nhánh', { note: 'Chuyển CP' });
    xoaNho();
    const cnCp = one(`SELECT id FROM branches WHERE code = 'CP'`).id;
    assert(thay(P.cpManager), 'em đã ở CP: QL CP phải duyệt được thẻ');
    assert(!thay(P.mbManager), 'em đã rời MB: QL MB không còn duyệt');
    xoaNho();
    const hop = await_.yc.hopChoDuyet(P.cpManager, { branchId: cnCp, xem: 'cho' }) as any;
    assert(hop.the.some((x: any) => x.id === y.id), 'hộp Chờ duyệt chi nhánh CP phải có thẻ');
  }));

  check('R5d2 · (PTA rà #2190) thẻ VIỆC CỦA LỚP CŨ (Final dời quá tuần) giữ lớp + chi nhánh lúc tạo: em sang CP vẫn QL MB duyệt; QL MB vẫn thấy thẻ đã xử lý ở Đã xử lý', () => thu(() => {
    const em = one(`SELECT s.id AS sid, e.class_id AS lop, c.branch_id AS cn FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1 JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`);
    const luot = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status = 'planned' ORDER BY id LIMIT 1`, em.sid);
    assert(em && luot, 'seed: cần em FT MB có lượt chờ');
    const lopCp = one(`SELECT c.id FROM classes c JOIN branches b ON b.id = c.branch_id AND b.code = 'CP' WHERE c.status = 'active' AND c.is_fast_track = 1 ORDER BY c.id LIMIT 1`);
    const viecLop = await_.yc.taoYeuCau(conn, { loai: 'bao_len_cuoi_khoa', doiTuongLoai: 'attempt', doiTuongId: luot.id, hocVienId: em.sid, lopId: em.lop, chiNhanhId: em.cn, nguoiXin: null });
    await_.students.transferStudent(P.admin, em.sid, lopCp.id, TODAY, 'Đổi chi nhánh', { note: 'Chuyển CP' });
    xoaNho();
    const thay = (q: any, id: number) => await_.yc.trongPhamVi(q, [one('SELECT * FROM yeu_cau_duyet WHERE id = ?', id)]).length === 1;
    assert(viecLop && thay(P.mbManager, viecLop) && !thay(P.cpManager, viecLop), 'thẻ việc lớp cũ: QL MB (nguồn) duyệt, QL CP không');
    const cnMb = one(`SELECT id FROM branches WHERE code = 'MB'`).id;
    assert((await_.yc.hopChoDuyet(P.mbManager, { branchId: cnMb, xem: 'de-biet' }) as any).the.some((x: any) => x.id === viecLop)
      || (await_.yc.hopChoDuyet(P.mbManager, { branchId: cnMb, xem: 'cho' }) as any).the.some((x: any) => x.id === viecLop), 'hộp MB phải có thẻ việc lớp cũ');
    /* QL MB đã xử lý một thẻ của em trước khi em đi → vẫn thấy ở Đã xử lý */
    const daXl = await_.yc.taoYeuCau(conn, { loai: 'sua_thong_tin', doiTuongLoai: 'student', doiTuongId: em.sid, hocVienId: em.sid, lopId: em.lop, chiNhanhId: em.cn, nguoiXin: P.coreTeacher.userId, lyDo: 'thử' });
    conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'tu_choi', nguoi_duyet = ?, xu_ly_luc = ? WHERE id = ?`).run(P.mbManager.userId, new Date().toISOString(), daXl);
    xoaNho();
    assert(daXl && (await_.yc.hopChoDuyet(P.mbManager, { branchId: cnMb, xem: 'da-xu-ly' }) as any).the.some((x: any) => x.id === daXl), 'QL MB phải còn thấy thẻ mình đã xử lý');
  }));

  check('R6 · chữ ≤ 500 (#2167): body ngắt từ dài (`overflow-wrap: break-word`); ghi chú lịch thi không nowrap / "…", ô sửa textarea; ghi chú TVV phối hợp mở theo "Xem đủ"', () => {
    const css = doc('web/src/index.css');
    const body = css.slice(css.indexOf('  body {'), css.indexOf('}', css.indexOf('  body {')));
    assert(/overflow-wrap: break-word/.test(body), 'body thiếu overflow-wrap: break-word');
    const ltGhi = (css.match(/\.lt-ghi > span \{[^}]*\}/) ?? [''])[0];
    assert(ltGhi && !/nowrap|ellipsis/.test(ltGhi), `.lt-ghi > span còn cắt một dòng: ${ltGhi}`);
    assert(/<textarea autoFocus className="field lt-ghi-o"/.test(doc('web/src/modules/students/HangLichThi.tsx')), 'ô sửa ghi chú lịch thi phải là textarea');
    assert(!/className="line-clamp-2 text-\[13px\] text-dim">\{a\.note\}/.test(doc('web/src/modules/yThuc/BangPhoiHop.tsx')), 'ghi chú TVV phối hợp còn cắt 2 dòng không mở được');
  });

  check('R7b · Rút đề xuất Ý thức: hộp nêu "lần xử lý ngày … và n tệp bằng chứng" ở cả thẻ và panel; thẻ mang số tệp sống (duLieu.soTep)', () => {
    const y = one(`SELECT id, doi_tuong_id FROM yeu_cau_duyet WHERE loai = 'y_thuc' ORDER BY id LIMIT 1`);
    assert(y, 'seed: cần thẻ đề xuất Ý thức');
    xoaNho();
    const the = await_.yc.theCuaDoiTuong(one('SELECT doi_tuong_loai l FROM yeu_cau_duyet WHERE id = ?', y.id).l, [y.doi_tuong_id]).find((x: any) => x.id === y.id);
    const tep = one(`SELECT COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?`, y.doi_tuong_id).n;
    assert(the?.duLieu?.soTep === tep, `thẻ duLieu.soTep ${the?.duLieu?.soTep} ≠ ${tep} tệp`);
    const th = doc('web/src/modules/duyet/TheYeuCau.tsx');
    assert(/Rút đề xuất · mất lần xử lý ngày \{ngay\} và \{n\} tệp bằng chứng/.test(th) && /yc\.duLieu\?\.soTep/.test(th) && /dong \|\| o\.loai === 'rut' \? t\('Huỷ'\)/.test(th), 'thẻ: câu nêu ngày + số tệp, nút Huỷ');
    assert(/o\.loai === 'rut' \? 'btn-danger'/.test(th), 'thẻ: nút Rút là nút nguy hiểm');
    const pn = doc('web/src/modules/yThuc/XemXuLyPanel.tsx');
    assert(/<ConfirmDialog open=\{hoiXoa\}[\s\S]{0,200}?\sdanger\s/.test(pn) && /mất lần xử lý \{nhan\} ngày \{ngay\} và \{soTep\} tệp bằng chứng/.test(pn), 'panel: hộp xác nhận nguy hiểm nêu ngày + số tệp');
  });
}
