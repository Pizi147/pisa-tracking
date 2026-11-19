/**
 * PHÉP KIỂM TU2-5 TRANG-TUTOR-MC (chủ SP 19/11 — `docs/superpowers/specs/2026-11-19-tutor/06-ke-hoach-pr.md` mục 2, 3; luật TU12–TU16 ở `02-luat.md`).
 *   (1) Head sửa danh bạ CHỈ chi nhánh mình · (2) bảng: cờ `coDanhBa` / `suaDuoc` / `loai`, CX chỉ đọc · (3) "Buổi" = SUM(so_buoi), tỉ lệ + Cần chú ý theo LẦN GHI ·
 *   (4) người dạy là GV (bảng, nhận xét, không sửa / xoá tên) · (5) gộp tên gõ tay theo phạm vi Head + GV + Hoàn tác · (6) tải danh sách theo vai · (7) CX đọc theo phạm vi, mọi đường ghi 403 ·
 *   (8) xuất số buổi theo tháng · (9) ô chọn của hộp Gộp · (10) trần câu SQL (HTTP).
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */

/** Trần câu SQL (Turso) của đường mới — đo trên bộ demo, max(đo + 10, ⌈đo × 1,3⌉). */
export const TRAN_TUTOR5_BANG = 17;   // đo 6 (CX) · 7 (Head, Head tutor, có dải gộp)
export const TRAN_TUTOR5_XUAT = 16;   // đo 6 (kế hoạch ≤ 6: số liệu + tutors + chi nhánh + nhật ký + phiên)
export const TRAN_TUTOR5_CHON_GOP = 14;   // đo 4

export async function runPrTutor5Tests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  const tr: any = await import('../tutors/trang.ts');
  const tl: any = await import('../tutors/taiLen.ts');
  const chonSvc: any = await import('../tutors/chon.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\nTU2-5 · trang Tutor: Head sửa danh bạ chi nhánh mình · CX xem · Buổi = Σ so_buoi · người dạy là GV · xuất số buổi');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const ma = (fn: () => unknown): number => loiCua(fn)?.status ?? 200;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const HT = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id);
  const CXALL = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' AND ur.status = 'active' AND ur.branch_id IS NULL LIMIT 1`).id);
  const QT = P.admin;
  const HMB = P.mbManager;
  const HCP = P.cpManager;
  const GV = P.lrTeacher;
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const lopCua = (code: string) => one('SELECT id FROM classes WHERE branch_id = ? ORDER BY id LIMIT 1', cn(code)).id as number;
  const FU0 = one('SELECT id, case_id FROM case_followups ORDER BY id LIMIT 1');
  const K = { tu: '2026-01-05', den: '2026-12-27' };
  let seq = 0;
  const themTutor = (ten: string, noi: string | null = 'MB', o: { kn?: string; sdt?: string | null; tao?: number | null; gv?: number | null } = {}) => Number(run(
    `INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by, user_id) VALUES (?,?,?,?,?,?,?,?)`,
    ten, o.sdt ?? null, noi && noi !== 'online' ? cn(noi) : null, noi === 'online' ? 1 : 0, o.kn ?? 'L,R', '2026-09-01T00:00:00.000Z', o.tao ?? null, o.gv ?? null).lastInsertRowid);
  /** Lần ghi mới (ngày ghi = `iso`) — một dòng buổi có `so_buoi`, ba ô, lớp. */
  /* Ngày nghiệp vụ `observed_on` = ngày VN của lúc ghi (như lần ghi thật trên bản chính) — trang Tutor lọc theo ngày này (rà #1872 C4). */
  const themLan = (iso: string) => Number(run(`INSERT INTO case_followups (case_id, observed_on, created_at) VALUES (?,?,?)`, FU0.case_id,
    new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 10), iso).lastInsertRowid);
  const themDong = (fu: number, tutorId: number | null, o: { n?: number; cb?: number | null; tl?: number | null; fb?: number | null; sao?: number | null; lop?: string; ten?: string } = {}) =>
    Number(run(`INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet, tutor_id, chuan_bi, tai_lieu, feedback_gv, danh_gia, lop_id, ghi_luc, so_buoi)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, fu, ++seq + 1000, o.ten ?? 'x', 'Nhận xét', tutorId, o.cb === undefined ? 1 : o.cb, o.tl === undefined ? 1 : o.tl,
    o.fb === undefined ? 1 : o.fb, o.sao ?? null, lopCua(o.lop ?? 'MB'), '2026-09-10T03:00:00.000Z', o.n ?? 1).lastInsertRowid);
  const dong = (kq: any, id: number) => kq.dong.find((x: any) => x.id === id);
  const caChinh = (iso = '2026-09-10T03:00:00.000Z') => themLan(iso);

  check('TU2-5 (1) · Head sửa danh bạ CHỈ chi nhánh mình: Thêm / Sửa MB 200, CP 403, Chỉ online do mình tạo 200, của người khác 403; Head tutor / Quản trị mọi chi nhánh', () => thu(() => {
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Thử Head MB', noiDay: cn('MB'), kyNang: ['L'] })) === 200, 'Head MB thêm tutor MB');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Thử Head CP', noiDay: cn('CP'), kyNang: ['L'] })) === 403, 'Head MB thêm tutor CP');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Thử Head trống', kyNang: ['L'] })) === 403, 'Head MB thêm tutor chưa có nơi dạy');
    const onl = tr.luuTutor(HMB, { ten: 'Thử Head Online', noiDay: 'online', kyNang: ['S'] });
    assert(one('SELECT created_by FROM tutors WHERE id = ?', onl.id).created_by === HMB.userId, 'Chỉ online ghi người tạo');
    const mb = themTutor('Thử Sửa MB', 'MB');
    const cp = themTutor('Thử Sửa CP', 'CP');
    const onlKhac = themTutor('Thử Online Khác', 'online', { tao: QT.userId });
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Thử Sửa MB 2', noiDay: cn('MB'), kyNang: ['L'] }, mb)) === 200, 'Head MB sửa tutor MB');
    assert(one('SELECT updated_by FROM tutors WHERE id = ?', mb).updated_by === HMB.userId, 'ghi người sửa');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Đổi', noiDay: cn('MB'), kyNang: ['L'] }, cp)) === 403, 'Head MB sửa tutor CP');
    assert(ma(() => tr.luuTutor(HCP, { ten: 'Đổi', noiDay: cn('CP'), kyNang: ['L'] }, mb)) === 403, 'Head CP sửa tutor MB');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Đổi', noiDay: 'online', kyNang: ['L'] }, onlKhac)) === 403, 'Head sửa Chỉ online của người khác');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Thử Head Online 2', noiDay: 'online', kyNang: ['S'] }, onl.id)) === 200, 'Head sửa Chỉ online do mình tạo');
    assert(ma(() => tr.luuTutor(HMB, { ten: 'Chuyển CP', noiDay: cn('CP'), kyNang: ['L'] }, mb)) === 403, 'Head không chuyển tutor sang chi nhánh khác');
    assert(ma(() => tr.luuTutor(HMB, { ten: '', noiDay: cn('MB'), kyNang: ['L'] }, mb)) === 400, 'thiếu tên vẫn 400 (kiểm dữ liệu giữ)');
    assert(ma(() => tr.xoaTutor(HMB, mb)) === 403, 'Head không xoá tutor (tutor.manage)');
    assert(ma(() => tr.ghiNhanXet(HMB, mb, { ketLuan: 'on', noiDung: 'Head thử ghi nhận xét' })) === 403, 'Head không ghi nhận xét');
    for (const [ai, p] of [['Head tutor', HT], ['Quản trị', QT]] as const) {
      assert(ma(() => tr.luuTutor(p, { ten: 'Thử Đổi ' + ai, noiDay: cn('CP'), kyNang: ['L'] }, cp)) === 200, `${ai} sửa tutor CP`);
      assert(ma(() => tr.luuTutor(p, { ten: 'Thử Mới ' + ai, kyNang: ['L'] })) === 200, `${ai} thêm tutor chưa nơi dạy`);
    }
    assert(ma(() => tr.xoaTutor(QT, mb)) === 200, 'Quản trị xoá tutor chưa có buổi');
  }));

  check('TU2-5 (2) · bảng: coDanhBa / suaDuoc / loai / thieu theo vai; CX chỉ đọc (không dải gộp, không sửa); Head chỉ sửa được hàng chi nhánh mình', () => thu(() => {
    const mb = themTutor('Thử Bảng MB', 'MB');
    const cp = themTutor('Thử Bảng CP', 'CP', { sdt: '0911000111' });
    const gvDong = themTutor('Thử Bảng GV', 'MB', { gv: GV.userId });
    const bHead = tr.bangTutor(HMB, K);
    assert(bHead.coDanhBa === true && bHead.coSua === false && bHead.chiNhanhDanhBa?.length === 1 && bHead.chiNhanhDanhBa[0].id === cn('MB'), JSON.stringify([bHead.coDanhBa, bHead.coSua, bHead.chiNhanhDanhBa]));
    assert(dong(bHead, mb).suaDuoc === true && dong(bHead, mb).thieu.join() === 'sdt', `Head: hàng MB sửa được, thiếu SĐT: ${JSON.stringify(dong(bHead, mb))}`);
    assert(!dong(bHead, cp) || (dong(bHead, cp).suaDuoc === false && dong(bHead, cp).thieu.length === 0), 'Head: tutor CP (nếu hiện) không sửa được, không chữ "thiếu"');
    assert(dong(bHead, gvDong).loai === 'gv' && dong(bHead, gvDong).gvId === GV.userId && dong(bHead, gvDong).suaDuoc === false, 'dòng GV: loai gv, không sửa');
    assert(dong(bHead, mb).loai === 'tutor' && dong(bHead, mb).gvId === null, 'tutor thường: loai tutor');
    const bQt = tr.bangTutor(QT, K);
    assert(bQt.coDanhBa && bQt.coSua && bQt.chiNhanhDanhBa === null && dong(bQt, cp).suaDuoc && !dong(bQt, gvDong).suaDuoc, 'Quản trị: mọi tutor trừ dòng GV');
    const bHt = tr.bangTutor(HT, K);
    assert(bHt.coDanhBa && bHt.coSua && bHt.chiNhanhDanhBa === null, 'Head tutor');
    const bCx = tr.bangTutor(CXALL, K);
    assert(bCx.coDanhBa === false && bCx.coSua === false && bCx.goTay === null && bCx.dong.every((d: any) => !d.suaDuoc && !d.thieu.length), 'CX: chỉ đọc');
    assert(bHead.goTay !== null && bQt.goTay !== null, 'dải gộp có cho Head / Quản trị');
    assert(ma(() => tr.bangTutor(GV, K)) === 403, 'GV 403');
    const pHead = tr.panelTutor(HMB, mb, K);
    assert(pHead.coDanhBa && !pHead.coSua && pHead.tutor.suaDuoc, 'panel Head');
    assert(tr.panelTutor(CXALL, mb, K).tutor.suaDuoc === false && tr.panelTutor(CXALL, mb, K).coDanhBa === false, 'panel CX chỉ đọc');
  }));

  check('TU2-5 (3) · "Buổi" = Σ so_buoi (dòng gộp 2 buổi đếm 2); 3 tỉ lệ + Cần chú ý đếm theo LẦN GHI; dòng không trả lời không vào mẫu số', () => thu(() => {
    const a = themTutor('Thử Đếm Lần');
    themDong(caChinh(), a, { n: 2, cb: 1, tl: 1, fb: null });
    themDong(caChinh(), a, { n: 1, cb: 0, tl: null, fb: null });
    themDong(caChinh(), a, { n: 3, cb: null, tl: null, fb: null });
    const b = tr.bangTutor(HT, K);
    const d = dong(b, a);
    assert(d.buoi === 6, `Buổi = 2 + 1 + 3: ${d.buoi}`);
    assert(d.chuanBi.join('/') === '1/2' && d.taiLieu.join('/') === '1/1' && d.feedbackGv.join('/') === '0/0', `tỉ lệ theo lần ghi: ${JSON.stringify([d.chuanBi, d.taiLieu, d.feedbackGv])}`);
    assert(d.chuY === '1 lần không chuẩn bị', `lý do theo lần ghi: ${d.chuY}`);
    const p = tr.panelTutor(HT, a, K);
    assert(p.so.buoi === 6 && p.so.chuanBi.join('/') === '1/2' && p.buoi.map((x: any) => x.soBuoi).sort().join() === '1,2,3', `panel: ${p.so.buoi} · ${p.buoi.map((x: any) => x.soBuoi)}`);
    assert(tr.panelTutor(HMB, a, K).so.buoi === 6, 'Head thấy cùng số (lớp MB)');
    const ngoai = themTutor('Thử Đếm Ngoài');
    themDong(caChinh('2026-03-01T03:00:00.000Z'), ngoai, { n: 4 });
    assert(dong(tr.bangTutor(HT, { tu: '2026-09-01', den: '2026-09-30' }), ngoai)?.buoi === 0, 'ngoài khoảng: 0');
  }));

  check('TU2-5 (4) · người dạy là GV: bảng (loai gv), Cần chú ý + nhận xét + kết luận áp cả GV; không ai sửa tên / xoá dòng GV; GV được chọn một dòng danh bạ', () => thu(() => {
    const g = themTutor('Thử GV Dạy', 'MB', { gv: GV.userId, kn: 'L' });
    themDong(caChinh(), g, { n: 2, fb: 0 });
    const b = tr.bangTutor(HMB, K);
    assert(dong(b, g)?.loai === 'gv' && dong(b, g).buoi === 2 && dong(b, g).chuY === '1 lần không gửi feedback cho GV', `bảng: ${JSON.stringify(dong(b, g))}`);
    assert(tr.demChuY(HT).n >= 1, 'Cần chú ý (menu) tính cả GV');
    tr.ghiNhanXet(HT, g, { ketLuan: 'can_cai_thien', noiDung: 'Nhắc gửi feedback cho GV đều' });
    assert(!dong(tr.bangTutor(HT, K), g).chuY, 'ghi nhận xét → hết Cần chú ý (cả GV)');
    for (const [ai, p] of [['Quản trị', QT], ['Head tutor', HT], ['Head', HMB]] as const) {
      assert(ma(() => tr.luuTutor(p, { ten: 'Đổi tên GV', noiDay: cn('MB'), kyNang: ['L'] }, g)) === 400, `${ai} sửa dòng GV bị chặn`);
    }
    assert(ma(() => tr.xoaTutor(QT, g)) === 400, 'Quản trị không xoá dòng GV');
    assert(one('SELECT ten FROM tutors WHERE id = ?', g).ten === 'Thử GV Dạy', 'tên GV giữ nguyên');
    const luuTrung = loiCua(() => run(`INSERT INTO tutors (ten, ky_nang, created_at, user_id) VALUES ('Trùng', 'L', 'x', ?)`, GV.userId));
    assert(luuTrung && /UNIQUE/i.test(String(luuTrung.message)), 'một GV không thành hai dòng danh bạ (chỉ mục UNIQUE)');
  }));

  check('TU2-5 (5) · Gộp tên gõ tay: Head chỉ dòng lớp chi nhánh mình (đếm Σ so_buoi); chọn GV (gvId) tạo MỘT dòng danh bạ; Hoàn tác dọn dòng GV trống; CX / GV 403', () => thu(() => {
    const gt0 = [tr.bangTutor(HMB, K).goTay.soBuoi, tr.bangTutor(QT, K).goTay.soBuoi];
    const fMb = caChinh();
    const dMb = themDong(fMb, null, { ten: 'Cô  Thuỷ', lop: 'MB', n: 2 });
    const dCp = themDong(caChinh(), null, { ten: 'cô thuỷ', lop: 'CP', n: 1 });
    const khoa = tr.khoaTen('Cô Thủy');
    const gtHead = tr.tenGoTay(HMB).find((x: any) => x.khoa === khoa);
    assert(gtHead?.soBuoi === 2 && gtHead.lop.join() === one('SELECT code FROM classes WHERE id = ?', lopCua('MB')).code, `Head thấy riêng MB, 2 buổi: ${JSON.stringify(gtHead)}`);
    const gtQt = tr.tenGoTay(QT).find((x: any) => x.khoa === khoa);
    assert(gtQt?.soBuoi === 3, `Quản trị thấy cả CP: ${gtQt?.soBuoi}`);
    const goTayHead = tr.bangTutor(HMB, K).goTay;
    const goTayQt = tr.bangTutor(QT, K).goTay;
    assert(goTayHead.soBuoi - gt0[0] === 2 && goTayQt.soBuoi - gt0[1] === 3, `dải gộp thêm: Head ${goTayHead.soBuoi - gt0[0]} (MB, 2 buổi) · Quản trị ${goTayQt.soBuoi - gt0[1]} (cả CP, 3 buổi)`);
    const a = themTutor('Thử Gộp Head', 'MB');
    const kq = tr.gopTen(HMB, { muc: [{ khoa, tutorId: a }] });
    assert(kq.soBuoi === 2, `Head gộp dòng lớp MB (2 buổi): ${kq.soBuoi}`);
    assert(one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', dMb).tutor_id === a && one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', dCp).tutor_id === null, 'dòng CP không đổi');
    tr.hoanTacGop(HMB, { nhatKyId: kq.nhatKyId });
    assert(one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', dMb).tutor_id === null, 'Hoàn tác');
    /* GV: tên "Cô Thuỷ" gộp vào GV chưa có dòng danh bạ. */
    assert(!one('SELECT 1 FROM tutors WHERE user_id = ?', GV.userId), 'chưa có dòng GV');
    const g1 = tr.gopTen(QT, { muc: [{ khoa, gvId: GV.userId }] });
    const gvDong = one('SELECT id, ten FROM tutors WHERE user_id = ?', GV.userId);
    assert(g1.soBuoi === 3 && gvDong && all('SELECT 1 FROM tutors WHERE user_id = ?', GV.userId).length === 1, `gộp GV: tạo đúng một dòng danh bạ — ${g1.soBuoi} dòng gộp, dòng GV ${JSON.stringify(gvDong)}`);
    assert(one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', dMb).tutor_id === gvDong.id && one('SELECT tutor_ten FROM case_followup_buoi WHERE id = ?', dMb).tutor_ten === 'Cô  Thuỷ', 'tên đã ghi giữ nguyên');
    tr.hoanTacGop(QT, { nhatKyId: g1.nhatKyId });
    assert(!one('SELECT 1 FROM tutors WHERE user_id = ?', GV.userId), 'Hoàn tác dọn dòng GV vừa tạo (trống)');
    const g2 = tr.gopTen(QT, { muc: [{ khoa, gvId: GV.userId }] });
    const g3 = tr.gopTen(HMB, { muc: [{ khoa: 'khong co ten nay', gvId: GV.userId }] });
    assert(g3.soBuoi === 0 && g2.soBuoi === 3 && all('SELECT 1 FROM tutors WHERE user_id = ?', GV.userId).length === 1, 'gộp lần hai dùng lại dòng GV');
    for (const [ai, p] of [['CX', CXALL], ['GV', GV]] as const) {
      assert(ma(() => tr.gopTen(p, { muc: [{ khoa, tutorId: a }] })) === 403, `${ai} gộp 403`);
      assert(ma(() => tr.tenGoTay(p)) === 403, `${ai} go-tay 403`);
      assert(ma(() => tr.hoanTacGop(p, { nhatKyId: kq.nhatKyId })) === 403, `${ai} hoàn tác 403`);
    }
    assert(ma(() => tr.gopTen(QT, { muc: [{ khoa, tutorId: a, gvId: GV.userId }] })) === 400, 'vừa tutorId vừa gvId → 400');
    assert(ma(() => tr.gopTen(QT, { muc: [{ khoa, gvId: HT.userId }] })) === 400, 'gvId không phải GV → 400');
  }));

  check('TU2-5 (5b) · Gộp: đích phải đúng một (tutorId HOẶC gvId, số nguyên — chuỗi 400); đích GV đã nghỉ / xoá tài khoản 400; Head chỉ gộp vào GV chi nhánh mình (Quản trị không giới hạn); ô chọn Gộp của Head chỉ GV chi nhánh mình', () => thu(() => {
    run('INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet, tutor_id, lop_id, so_buoi) VALUES (?,?,?,?,NULL,?,1)', caChinh(), 9001, 'Cô Đích Thử', 'x', lopCua('MB'));
    const khoa = tr.khoaTen('Cô Đích Thử');
    const a = themTutor('Thử Đích Tutor', 'MB');
    const gvCp = one(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
      WHERE u.status = 'active' AND ur.branch_id = ? AND NOT EXISTS (SELECT 1 FROM user_roles u2 WHERE u2.user_id = u.id AND u2.status = 'active' AND u2.branch_id = ?) LIMIT 1`, cn('CP'), cn('MB'))?.id as number;
    assert(gvCp, 'seed thiếu GV chỉ dạy CP');
    for (const muc of [{ khoa, tutorId: a, gvId: String(GV.userId) }, { khoa, tutorId: String(a) }, { khoa, gvId: String(GV.userId) }, { khoa, tutorId: a, gvId: GV.userId }, { khoa, tutorId: 0 }, { khoa, tutorId: null, gvId: null }]) {
      assert(ma(() => tr.gopTen(QT, { muc: [muc] })) === 400, `đích sai kiểu / không phải đúng một → 400: ${JSON.stringify(muc)}`);
    }
    assert(!one('SELECT 1 FROM case_followup_buoi WHERE tutor_ten = ? AND tutor_id IS NOT NULL', 'Cô Đích Thử'), 'bị chặn mà vẫn ghi');
    /* GV chi nhánh khác: Head MB 403, Quản trị 200. */
    assert(ma(() => tr.gopTen(HMB, { muc: [{ khoa, gvId: gvCp }] })) === 403, 'Head MB gộp vào GV chỉ dạy CP');
    const dongGvCp = themTutor('Thử Dòng GV CP', 'CP', { gv: gvCp });
    assert(ma(() => tr.gopTen(HMB, { muc: [{ khoa, tutorId: dongGvCp }] })) === 403, 'Head MB gộp vào dòng danh bạ của GV CP');
    assert(ma(() => tr.gopTen(HMB, { muc: [{ khoa, gvId: GV.userId }] })) === 200, 'Head MB gộp vào GV chi nhánh mình');
    run('UPDATE case_followup_buoi SET tutor_id = NULL WHERE tutor_ten = ?', 'Cô Đích Thử');
    assert(ma(() => tr.gopTen(QT, { muc: [{ khoa, gvId: gvCp }] })) === 200, 'Quản trị không giới hạn chi nhánh');
    run('UPDATE case_followup_buoi SET tutor_id = NULL WHERE tutor_ten = ?', 'Cô Đích Thử');
    /* GV đã xoá tài khoản / nghỉ: cả gvId lẫn dòng danh bạ của GV đó bị từ chối (cùng luật TU2-1). */
    run("UPDATE users SET status = 'inactive' WHERE id = ?", gvCp);
    const e1 = loiCua(() => tr.gopTen(QT, { muc: [{ khoa, gvId: gvCp }] }));
    const e2 = loiCua(() => tr.gopTen(QT, { muc: [{ khoa, tutorId: dongGvCp }] }));
    assert(e1?.status === 400 && e2?.status === 400 && /không còn làm việc/.test(e1.message + e2.message), `đích GV đã nghỉ: ${e1?.status} ${e2?.status}`);
    assert(!one('SELECT 1 FROM case_followup_buoi WHERE tutor_ten = ? AND tutor_id IS NOT NULL', 'Cô Đích Thử'), 'đích bị từ chối thì không ghi');
    run("UPDATE users SET status = 'active' WHERE id = ?", gvCp);
    /* Ô chọn Gộp: Head MB chỉ thấy GV có vai ở chi nhánh mình; Quản trị thấy cả GV CP. */
    const ten = (id: number) => one('SELECT full_name n FROM users WHERE id = ?', id).n as string;
    const goHead = chonSvc.chonTutor(HMB, { gop: true, q: ten(gvCp) });
    const goQt = chonSvc.chonTutor(QT, { gop: true, q: ten(gvCp) });
    assert(!goHead.ds.some((r: any) => r.gvId === gvCp) && goQt.ds.some((r: any) => r.gvId === gvCp), 'ô chọn Gộp: Head không thấy GV CP, Quản trị thấy');
    assert(chonSvc.chonTutor(HMB, { gop: true, q: ten(GV.userId) }).ds.some((r: any) => r.gvId === GV.userId), 'Head thấy GV chi nhánh mình');
  }));

  check('TU2-5 (6) · Tải danh sách theo vai: Head chỉ nơi dạy = chi nhánh mình / Chỉ online, không sửa tutor chi nhánh khác, không khớp dòng GV; CX 403; Quản trị như cũ', () => thu(() => {
    const cp = themTutor('Thử Tải CP', 'CP');
    const gv = themTutor('Thử Tải GV', 'MB', { gv: GV.userId });
    const rows = [['Tên', 'SĐT', 'Nơi dạy', 'Kỹ năng'],
      ['Thử Tải Một', '', 'Monbay', 'L'], ['Thử Tải Hai', '', 'Cẩm Phả', 'L'], ['Thử Tải Ba', '', '', 'L'], ['Thử Tải Bốn', '', 'Online', 'S'],
      ['Thử Tải CP', '', '', 'R'], ['Thử Tải GV', '', 'Monbay', 'S']];
    const x = tl.taiLenTutor(HMB, { rows, luu: false });
    const o = (so: number) => x.dong.find((d: any) => d.so === so);
    assert(o(2).kq === 'moi' && o(3).kq === 'loi' && o(4).kq === 'loi' && o(5).kq === 'moi', `A mới, B (CP) lỗi, C (trống) lỗi, D online mới: ${x.dong.map((d: any) => d.kq)}`);
    assert(o(6).kq === 'loi' && /không thuộc chi nhánh/.test(o(6).loi.join()), `sửa tutor CP bị chặn: ${JSON.stringify(o(6))}`);
    assert(o(7).kq === 'moi', `dòng GV không bị khớp theo tên (thành tutor mới): ${o(7).kq}`);
    const luu = tl.taiLenTutor(HMB, { rows, luu: true });
    assert(luu.soMoi === 3 && one('SELECT created_by FROM tutors WHERE ten = ?', 'Thử Tải Bốn').created_by === HMB.userId, 'lưu: 3 mới, Online ghi người tạo');
    assert(one('SELECT ky_nang FROM tutors WHERE id = ?', cp).ky_nang === 'L,R' && one('SELECT ky_nang FROM tutors WHERE id = ?', gv).ky_nang === 'L,R', 'tutor CP và dòng GV không bị đổi');
    assert(tl.taiLenTutor(QT, { rows: [['Thử Tải CP', '', 'Cẩm Phả', 'R']], luu: false }).dong[0].kq === 'capNhat', 'Quản trị sửa tutor CP bằng tệp');
    assert(ma(() => tl.taiLenTutor(CXALL, { rows, luu: false })) === 403 && ma(() => tl.taiLenTutor(GV, { rows, luu: false })) === 403, 'CX / GV 403');
  }));

  check('TU2-5 (7) · CX đọc theo phạm vi (CX một chi nhánh: chỉ dòng lớp chi nhánh mình; CX toàn hệ thống: mọi chi nhánh), mọi đường ghi 403', () => thu(() => {
    const cxCp = loadPrincipal(accounts.createAccount(QT, { email: `tu25.cx${accounts.EMAIL_SUFFIX}`, password: 'matkhau-tu25', fullName: 'Thử CX CP', roles: [{ role: 'cx', branches: ['CP'] }] }).userId);
    const tMb = themTutor('Thử CX Tutor MB', 'MB');
    const tCp = themTutor('Thử CX Tutor CP', 'CP');
    themDong(caChinh(), tMb, { lop: 'MB' });
    themDong(caChinh(), tCp, { lop: 'CP' });
    const bCp = tr.bangTutor(cxCp, K);
    assert(dong(bCp, tCp)?.buoi === 1 && !dong(bCp, tMb), 'CX CP: thấy tutor CP, không thấy tutor MB (buổi lớp MB)');
    assert(ma(() => tr.panelTutor(cxCp, tMb, K)) === 404 && ma(() => tr.panelTutor(cxCp, tCp, K)) === 200, 'CX CP: panel tutor MB 404, tutor CP 200');
    const bAll = tr.bangTutor(CXALL, K);
    assert(dong(bAll, tMb)?.buoi === 1 && dong(bAll, tCp)?.buoi === 1, 'CX toàn hệ thống thấy cả hai');
    for (const [ai, p] of [['CX CP', cxCp], ['CX toàn hệ thống', CXALL]] as const) {
      const sai = [
        ['thêm tutor', () => tr.luuTutor(p, { ten: 'X', noiDay: cn('CP'), kyNang: ['L'] })],
        ['sửa tutor', () => tr.luuTutor(p, { ten: 'X', noiDay: cn('CP'), kyNang: ['L'] }, tCp)],
        ['xoá tutor', () => tr.xoaTutor(p, tCp)],
        ['nhận xét', () => tr.ghiNhanXet(p, tCp, { ketLuan: 'on', noiDung: 'CX thử ghi nhận xét' })],
        ['tải danh sách', () => tl.taiLenTutor(p, { rows: [['X', '', '', 'L']], luu: true })],
        ['gộp', () => tr.gopTen(p, { muc: [{ khoa: 'x', tutorId: tCp }] })],
        ['go-tay', () => tr.tenGoTay(p)], ['số menu', () => tr.demChuY(p)],
        ['ô chọn Gộp', () => chonSvc.chonTutor(p, { gop: true })],
      ].filter(([, f]) => ma(f as () => unknown) !== 403).map(([ten]) => ten);
      assert(!sai.length, `${ai} làm được (phải 403): ${sai.join(', ')}`);
    }
    assert(all(`SELECT 1 FROM tutors WHERE ten = 'X'`).length === 0, 'không dòng nào lọt vào DB');
  }));

  check('TU2-5 (8) · xuất số buổi: Σ so_buoi theo tháng VN của ngày ghi; tên gõ tay "(gõ tay)"; phạm vi Head không lộ người ngoài; có nhật ký; kiểm tháng', () => thu(() => {
    const a = themTutor('Thử Xuất A', 'MB');
    const b = themTutor('Thử Xuất B', 'CP');
    const g = themTutor('Thử Xuất GV', 'MB', { gv: GV.userId });
    themDong(caChinh('2026-10-15T03:00:00.000Z'), a, { n: 2 });
    themDong(caChinh('2026-10-31T16:30:00.000Z'), a, { n: 1 });   // 23:30 VN 31/10 → tháng 10
    themDong(caChinh('2026-10-31T17:30:00.000Z'), a, { n: 4 });   // 00:30 VN 01/11 → tháng 11
    themDong(caChinh('2026-11-20T03:00:00.000Z'), b, { n: 5, lop: 'CP' });
    themDong(caChinh('2026-11-21T03:00:00.000Z'), g, { n: 3 });
    themDong(caChinh('2026-11-22T03:00:00.000Z'), null, { n: 2, ten: 'Cô  Gõ Tay', lop: 'MB' });
    themDong(caChinh('2026-12-02T03:00:00.000Z'), a, { n: 9 });   // ngoài khoảng
    const dongXuat = (kq: any, ten: string) => kq.sheets[0].aoa.find((r: any[]) => r[0] === ten);
    const x = tr.xuatSoBuoi(QT, '2026-10', '2026-11');
    assert(x.sheets[0].aoa[0].join('|') === 'Người dạy|Loại|Nơi dạy|10/2026|11/2026|Tổng', `đầu bảng: ${x.sheets[0].aoa[0]}`);
    assert(dongXuat(x, 'Thử Xuất A').slice(1).join('|') === 'Tutor|Monbay|3|4|7', `A: ${dongXuat(x, 'Thử Xuất A')}`);
    const tenGv = one('SELECT full_name FROM users WHERE id = ?', GV.userId).full_name as string;   // rà #1872 T3: dòng GV mang tên tài khoản, không tên chụp
    assert(dongXuat(x, tenGv)?.[1] === 'GV' && dongXuat(x, tenGv)[4] === 3 && !dongXuat(x, 'Thử Xuất GV'), `GV: ${dongXuat(x, tenGv)}`);
    assert(dongXuat(x, 'Cô Gõ Tay (gõ tay)')?.slice(1).join('|') === '—||0|2|2', `gõ tay: ${dongXuat(x, 'Cô Gõ Tay (gõ tay)')}`);
    const tong = x.sheets[0].aoa[x.sheets[0].aoa.length - 1];
    assert(tong[0] === 'Tổng' && tong[tong.length - 1] === x.dem.buoi, `dòng tổng: ${tong}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'tutor.xuat_so_buoi' AND actor_user_id = ?`, QT.userId).n === 1, 'có dòng nhật ký xuất');
    const xh = tr.xuatSoBuoi(HMB, '2026-10', '2026-11');
    assert(!dongXuat(xh, 'Thử Xuất B') && dongXuat(xh, 'Thử Xuất A') && dongXuat(xh, 'Cô Gõ Tay (gõ tay)'), 'Head MB không thấy người chỉ dạy em CP');
    assert(dongXuat(tr.xuatSoBuoi(CXALL, '2026-10', '2026-11'), 'Thử Xuất B')?.[4] === 5, 'CX toàn hệ thống thấy cả CP');
    assert(!dongXuat(tr.xuatSoBuoi(QT, '2026-10', '2026-10'), tenGv), 'một tháng: người chỉ dạy tháng 11 không có dòng');
    assert(ma(() => tr.xuatSoBuoi(GV, '2026-10', '2026-11')) === 403, 'GV 403');
    for (const [tu, den] of [['2026-13', '2026-12'], ['2026-11', '2026-10'], ['x', 'y'], ['2024-01', '2026-12']] as const) assert(ma(() => tr.xuatSoBuoi(QT, tu, den)) === 400, `kiểm tháng ${tu} → ${den}`);
    assert(tr.xuatSoBuoi(QT, '2026-02', '2026-02').dem.buoi === 0, 'tháng không có dữ liệu: bảng rỗng, không lỗi');
  }));

  check('TU2-5 (9) · ô chọn của hộp Gộp (`/tutors/chon?gop=1`): Quản trị / Head có GV (loai gv) + tutor, kể cả "Ngừng hợp tác"; ô chọn thường vẫn ẩn người đó; CX / GV 403', () => thu(() => {
    const ngung = themTutor('Thử Chọn Đã Nghỉ', 'MB');
    run(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?, 'ngung', 'Đã nghỉ hợp tác từ tháng 10', ?, '2026-10-01T00:00:00.000Z')`, ngung, HT.userId);
    const tenGv = one('SELECT full_name n FROM users WHERE id = ?', GV.userId).n as string;
    for (const [ai, p] of [['Quản trị', QT], ['Head MB', HMB], ['Head tutor', HT]] as const) {
      const x = chonSvc.chonTutor(p, { gop: true, q: 'Thử Chọn' });
      assert(x.ds.some((r: any) => r.id === ngung) && x.dienSan === null, `${ai}: thấy tutor Ngừng hợp tác trong hộp Gộp`);
      const g = chonSvc.chonTutor(p, { gop: true, q: tenGv.split(' ').pop() });
      assert(g.ds.some((r: any) => r.loai === 'gv' && r.gvId === GV.userId && r.sdtDuoi === null), `${ai}: gõ tên → có GV (loai gv, không SĐT)`);
    }
    assert(!chonSvc.chonTutor(HMB, { studentId: one('SELECT student_id id FROM enrollments LIMIT 1').id, q: 'Thử Chọn' }).ds.some((r: any) => r.id === ngung), 'ô chọn thường: tutor Ngừng hợp tác không hiện');
    for (const [ai, p] of [['CX', CXALL], ['GV', GV]] as const) assert(ma(() => chonSvc.chonTutor(p, { gop: true })) === 403, `${ai} 403`);
  }));

  await checkAsync('TU2-5 (10) · HTTP: CX 200 đọc / 403 ghi, GV 403, Head chi nhánh khác 403; trần câu SQL (bảng, xuất, ô chọn Gộp)', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string, method = 'GET', body?: unknown) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
          method, headers: { cookie: `pisa_demo_session=${createSession(uid)}`, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
        });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const k = `kieu=tuy-chon&tu=${K.tu}&den=${K.den}`;
      const tutorId = (await goi(HT.userId, `/tutors?${k}`)).json.dong[0].id as number;
      for (const [ai, p] of [['CX', CXALL], ['Head MB', HMB], ['Quản trị', QT], ['Head tutor', HT]] as const) {
        assert((await goi(p.userId, `/tutors?${k}`)).status === 200, `${ai} /tutors`);
        assert((await goi(p.userId, `/tutors/${tutorId}?${k}`)).status !== 403, `${ai} /tutors/:id không 403`);
        assert((await goi(p.userId, `/tutors/xuat-buoi?tu=2026-09&den=2026-10`)).status === 200, `${ai} xuất`);
      }
      assert((await goi(GV.userId, `/tutors?${k}`)).status === 403 && (await goi(GV.userId, `/tutors/xuat-buoi?tu=2026-09&den=2026-10`)).status === 403, 'GV 403 trang + xuất');
      assert((await goi(HMB.userId, `/tutors/xuat-buoi?tu=2026-10&den=2026-09`)).status === 400, 'xuất khoảng ngược 400');
      const ghi: [string, string, unknown][] = [['POST', '/tutors', { ten: 'X', kyNang: ['L'] }], ['PATCH', `/tutors/${tutorId}`, { ten: 'X', kyNang: ['L'] }], ['DELETE', `/tutors/${tutorId}`, undefined],
        ['POST', `/tutors/${tutorId}/nhan-xet`, { ketLuan: 'on', noiDung: 'CX thử ghi nhận xét' }], ['POST', '/tutors/tai-len', { rows: [['X', '', '', 'L']], luu: true }],
        ['POST', '/tutors/gop', { muc: [{ khoa: 'x', tutorId }] }], ['POST', '/tutors/gop/hoan-tac', { nhatKyId: 1 }], ['GET', '/tutors/go-tay', undefined], ['GET', '/tutors/dem', undefined], ['GET', '/tutors/chon?gop=1', undefined]];
      for (const [m, url, body] of ghi) assert((await goi(CXALL.userId, url, m, body)).status === 403, `CX ${m} ${url} → 403`);
      const khacCn = tr.bangTutor(QT, K).dong.find((d: any) => d.noiDay && d.noiDay !== 'online' && d.noiDay.id !== cn('MB') && d.suaDuoc);
      if (khacCn) assert((await goi(HMB.userId, `/tutors/${khacCn.id}`, 'PATCH', { ten: 'X', noiDay: cn('MB'), kyNang: ['L'] })).status === 403, 'Head MB PATCH tutor chi nhánh khác → 403');
      assert((await goi(HMB.userId, `/tutors/${tutorId}`, 'DELETE')).status === 403, 'Head DELETE → 403');
      const dem = async (uid: number, url: string) => { const truoc = soCauSql(); const r = await goi(uid, url); return { r, n: soCauSql() - truoc }; };
      const dd = [await dem(CXALL.userId, `/tutors?${k}`), await dem(HMB.userId, `/tutors?${k}`), await dem(HT.userId, `/tutors?${k}`)];
      const xx = await dem(CXALL.userId, '/tutors/xuat-buoi?tu=2026-01&den=2026-12');
      const cg = await dem(HT.userId, '/tutors/chon?gop=1&q=a');
      console.log(`      (đo: /tutors CX ${dd[0].n} · Head ${dd[1].n} · Head tutor ${dd[2].n} câu · xuất ${xx.n} câu · chọn Gộp ${cg.n} câu)`);
      assert(Math.max(...dd.map((x) => x.n)) <= TRAN_TUTOR5_BANG && xx.n <= TRAN_TUTOR5_XUAT && cg.n <= TRAN_TUTOR5_CHON_GOP, `trần câu: ${dd.map((x) => x.n)} / ${TRAN_TUTOR5_BANG} · ${xx.n} / ${TRAN_TUTOR5_XUAT} · ${cg.n} / ${TRAN_TUTOR5_CHON_GOP}`);
    } finally { may.close(); }
  });
}
