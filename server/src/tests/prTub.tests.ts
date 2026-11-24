/**
 * PHÉP KIỂM TU-b — trang Tutor (kế hoạch docs/superpowers/plans/2026-10-20-pr-tu-b-trang-tutor.md; đặc tả Tutor mục 7, 8, 11 phần TU-b):
 *  TUB-1 "Cần chú ý" (một hàm: lọc + số menu + lý do) · TUB-2 bảng / panel, phạm vi QL, quyền, giờ VN, trần câu SQL ·
 *  TUB-3 thêm / sửa / xoá tutor + nhận xét 24 giờ · TUB-4 tải danh sách (xem trước = lưu) · TUB-6 gộp tên gõ tay + Hoàn tác.
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */

/** Trần câu SQL (Turso) của đường mới, đo trên bộ demo — max(đo + 10, ⌈đo × 1,3⌉). */
export const TRAN_TUTOR_BANG = 18;   // đo 8 (Head tutor) · 7 (QL)
export const TRAN_TUTOR_PANEL = 19;   // đo 9

export async function runPrTubTests(t: any) {
  const { check, checkAsync, assert, assertThrows, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const tr: any = await import('../tutors/trang.ts');
  const tl: any = await import('../tutors/taiLen.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\nTU-b · trang Tutor: Cần chú ý · bảng / panel · phạm vi QL · thêm sửa xoá · nhận xét · tải danh sách · gộp tên');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const HT = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id);
  const QL = P.mbManager;
  const QT = P.admin;
  const ma = (fn: () => unknown): number => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const cn = (code: string) => one('SELECT id FROM branches WHERE code = ?', code).id as number;
  const lopCua = (code: string) => one('SELECT id FROM classes WHERE branch_id = ? ORDER BY id LIMIT 1', cn(code)).id as number;
  const FU = one('SELECT id FROM case_followups ORDER BY id LIMIT 1').id as number;
  const K = { tu: '2026-01-05', den: '2026-12-27' };   // khoảng rộng
  let soBuoi = 100;
  /** Thêm một tutor + (tuỳ chọn) buổi gắn vào lần ghi FU (ngày = observed_on của FU, đặt lại trong `thu`). */
  const themTutor = (ten: string, noi: string | null = 'MB', kn = 'L,R', sdt: string | null = null) => Number(run(
    `INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at) VALUES (?,?,?,?,?,?)`,
    ten, sdt, noi && noi !== 'online' ? cn(noi) : null, noi === 'online' ? 1 : 0, kn, '2026-09-01T00:00:00.000Z').lastInsertRowid);
  const themBuoi = (tutorId: number | null, o: { cb?: number | null; tl?: number | null; fb?: number | null; sao?: number | null; ghi?: string; lop?: number; ten?: string; fu?: number } = {}) =>
    Number(run(`INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet, tutor_id, chuan_bi, tai_lieu, feedback_gv, danh_gia, lop_id, ghi_luc)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`, o.fu ?? FU, ++soBuoi, o.ten ?? 'x', 'Nhận xét buổi', tutorId, o.cb === undefined ? 1 : o.cb, o.tl === undefined ? 1 : o.tl,
    o.fb === undefined ? 1 : o.fb, o.sao ?? null, o.lop ?? lopCua('MB'), o.ghi ?? '2026-09-10T03:00:00.000Z').lastInsertRowid);
  const nhanXet = (tutorId: number, kl: string, luc: string, nguoi = HT.userId) =>
    run(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?,?,?,?,?)`, tutorId, kl, 'Nhận xét thử đủ dài', nguoi, luc);
  /* Rà #1872 C4: trang Tutor lọc theo ngày nghiệp vụ `observed_on` — đặt cả hai như lần ghi thật (ngày VN của lúc ghi). */
  const ngayFu = (iso: string) => run('UPDATE case_followups SET created_at = ?, observed_on = ? WHERE id = ?', iso, new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 10), FU);
  const dong = (kq: any, id: number) => kq.dong.find((x: any) => x.id === id);

  // ------------------------------------------------------------------ TUB-1 · Cần chú ý
  check('TUB-1 · Cần chú ý: "Không" / ≤ 2 sao sau nhận xét gần nhất (mọi thời gian); nhận xét → ra; buổi xấu mới → vào lại; Ngừng → không; lý do theo loại nhiều nhất; số menu', () => thu(() => {
    const a = themTutor('Thử Chú Ý A');
    themBuoi(a, { fb: 0, ghi: '2020-01-01T00:00:00.000Z' });   // ngoài mọi khoảng vẫn tính
    let m = tr.canChuY(conn, null);
    assert(m.has(a) && tr.lyDoChuY(m.get(a)) === '1 lần không gửi feedback cho GV', `vào nhóm: ${JSON.stringify(m.get(a))}`);
    themBuoi(a, { fb: 0, ghi: '2020-01-02T00:00:00.000Z' });
    themBuoi(a, { cb: 0, ghi: '2020-01-03T00:00:00.000Z' });
    assert(tr.lyDoChuY(tr.canChuY(conn, null).get(a)) === '2 lần không gửi feedback cho GV', 'loại nhiều nhất');
    nhanXet(a, 'can_cai_thien', '2021-01-01T00:00:00.000Z');
    assert(!tr.canChuY(conn, null).has(a), 'ghi nhận xét → ra');
    run(`UPDATE tutor_nhan_xet SET sua_luc = '2022-01-01T00:00:00.000Z' WHERE tutor_id = ?`, a);
    assert(!tr.canChuY(conn, null).has(a), 'sửa nhận xét không dời mốc');
    themBuoi(a, { cb: 0, ghi: '2021-02-01T00:00:00.000Z' });
    m = tr.canChuY(conn, null);
    assert(m.has(a) && tr.lyDoChuY(m.get(a)) === '1 lần không chuẩn bị', `buổi "Không" mới → vào lại: ${JSON.stringify(m.get(a))}`);
    const b = themTutor('Thử Chú Ý B');
    themBuoi(b, { sao: 2 });
    themBuoi(b, { sao: null });
    assert(tr.lyDoChuY(tr.canChuY(conn, null).get(b)) === '1 lần đánh giá 2/5', 'đánh giá 2 → vào');
    const c = themTutor('Thử Chú Ý C');
    themBuoi(c, { sao: null });
    themBuoi(c, { sao: 3 });
    themBuoi(c, { cb: null, tl: null, fb: null });   // dòng cũ trước TU-a
    assert(!tr.canChuY(conn, null).has(c), 'đánh giá trống / 3 sao / dòng cũ → không');
    themBuoi(b, { tl: 0, ghi: '2099-01-01T00:00:00.000Z' });
    nhanXet(b, 'ngung', '2030-01-01T00:00:00.000Z');
    assert(!tr.canChuY(conn, null).has(b), 'kết luận mới nhất Ngừng → không vào');
    /* Phạm vi QL: chỉ buổi lớp chi nhánh mình. */
    const e = themTutor('Thử Chú Ý E', 'HD');
    themBuoi(e, { fb: 0, lop: lopCua('HD') });
    assert(!tr.canChuY(conn, [cn('MB')]).has(e) && tr.canChuY(conn, [cn('HD')]).has(e), 'QL MB không tính buổi lớp HD');
    const n = tr.canChuY(conn, null).size;
    assert(tr.demChuY(HT).n === n && tr.demChuY(P.admin).n === n, 'số menu Head tutor / Quản trị = số Cần chú ý');
    assertThrows(() => tr.demChuY(QL), /quyền/, 'Head không có số menu');
    assert(navOf(HT).tutorSua && navOf(P.admin).tutorSua && !navOf(QL).tutorSua && navOf(QL).tutor, 'cờ nav tutorSua');
  }));

  // ------------------------------------------------------------------ TUB-2 · bảng + panel + phạm vi
  check('TUB-2a · bảng: Buổi / tỉ lệ (mẫu = buổi có trả lời) / đánh giá TB 1 chữ số; ngoài khoảng không đếm; thiếu SĐT / nơi dạy', () => thu(() => {
    ngayFu('2026-09-10T03:00:00.000Z');
    const a = themTutor('Thử Bảng A');
    themBuoi(a, { tl: 0, sao: 4 });
    themBuoi(a, { sao: 5 });
    themBuoi(a, { cb: null, tl: null, fb: null });
    const kq = tr.bangTutor(HT, K);
    const x = dong(kq, a);
    assert(x.buoi === 3 && x.chuanBi.join('/') === '2/2' && x.taiLieu.join('/') === '1/2' && x.feedbackGv.join('/') === '2/2', JSON.stringify(x));
    assert(x.danhGia === 4.5 && x.chuY === '1 lần không xin tài liệu đúng hạn', `đánh giá ${x.danhGia}, lý do ${x.chuY}`);
    assert(x.thieu.join(',') === 'sdt' && kq.coSua === true, `thiếu: ${x.thieu}`);
    const ngoai = tr.bangTutor(HT, { tu: '2026-10-05', den: '2026-10-11' });
    assert(dong(ngoai, a).buoi === 0 && dong(ngoai, a).danhGia === null, 'ngoài khoảng → 0 buổi, không đánh giá');
    assert(kq.goTay && kq.goTay.soTen >= 1 && kq.goTay.soBuoi >= kq.goTay.soTen, `dải tên gõ tay (Ms Mai của bộ demo): ${JSON.stringify(kq.goTay)}`);
  }));

  check('TUB-2b · QL MB: thấy tutor Bãi Cháy dạy em MB (chỉ đếm buổi MB); không thấy tutor chỉ dạy chi nhánh khác; panel không lộ buổi chi nhánh khác', () => thu(() => {
    ngayFu('2026-09-10T03:00:00.000Z');
    const bc = themTutor('Thử Bãi Cháy', 'BC', 'W1,W2');
    themBuoi(bc);
    themBuoi(bc, { lop: lopCua('BC') });
    themBuoi(bc, { lop: lopCua('BC') });
    const hd = themTutor('Thử Hải Dương', 'HD');
    themBuoi(hd, { lop: lopCua('HD') });
    const kq = tr.bangTutor(QL, K);
    assert(dong(kq, bc)?.buoi === 1, `QL MB: tutor BC 1 buổi MB: ${JSON.stringify(dong(kq, bc))}`);
    assert(!dong(kq, hd), 'QL MB không thấy tutor chỉ dạy HD');
    assert(kq.coSua === false && kq.coDanhBa === true && kq.goTay !== null && dong(kq, bc).thieu.length === 0 && dong(kq, bc).suaDuoc === false, 'Head (TU13): có dải gộp + sửa danh bạ chi nhánh mình, không nhận xét; tutor BC không sửa được, không nhãn thiếu');
    assert(tr.panelTutor(QL, bc, K).buoi.length === 1, 'panel QL: chỉ buổi MB');
    assert(tr.panelTutor(HT, bc, K).buoi.length === 3, 'panel Head tutor: mọi buổi');
    assertThrows(() => tr.panelTutor(QL, hd, K), /Không tìm thấy/, 'Head hỏi tutor ngoài phạm vi → 404');
    const hdQ = tr.bangTutor(P.cpManager, K);
    assert(!dong(hdQ, bc) && !dong(hdQ, hd), 'QL CP: không thấy tutor / buổi của MB, BC, HD');
    const mb = themTutor('Thử Monbay chưa dạy', 'MB');
    assert(dong(tr.bangTutor(QL, K), mb)?.buoi === 0, '"Tất cả" của QL có tutor nơi dạy chi nhánh mình chưa có buổi');
    /* Rà #477: tutor chi nhánh khác có buổi "Không" với em MB NGOÀI khoảng → vẫn trong Cần chú ý của QL MB (mọi thời gian), 0 buổi trong khoảng. */
    const cp = themTutor('Thử Cẩm Phả cũ', 'CP');
    themBuoi(cp, { fb: 0 });
    const ngoai = tr.bangTutor(QL, { tu: '2026-10-05', den: '2026-10-11' });
    assert(dong(ngoai, cp)?.chuY === '1 lần không gửi feedback cho GV' && dong(ngoai, cp).buoi === 0, `QL thấy tutor Cần chú ý ngoài khoảng: ${JSON.stringify(dong(ngoai, cp))}`);
    /* N56 ⑥: lý do kèm ngày lần ghi gần nhất + id dòng; panel theo `ids` hiện đúng dòng đó dù ngoài khoảng, vẫn trong phạm vi chi nhánh. */
    const x = dong(ngoai, cp);
    const ngayFuNay = one('SELECT observed_on FROM case_followups WHERE id = ?', FU).observed_on;
    assert(!!ngayFuNay && x.chuYNgay === ngayFuNay && x.chuYIds.length === 1, `ngày (observed_on ${ngayFuNay}) / id lý do: ${x.chuYNgay} ${JSON.stringify(x.chuYIds)}`);
    const pn = tr.panelTutor(QL, cp, { tu: '2026-10-05', den: '2026-10-11' }, x.chuYIds);
    assert(pn.buoi.length === 1 && pn.buoi[0].id === x.chuYIds[0] && pn.buoi[0].feedbackGv === false, `panel theo id: ${JSON.stringify(pn.buoi)}`);
    assert(tr.panelTutor(QL, bc, K, x.chuYIds).buoi.length === 0, 'id dòng của tutor khác → không dòng');
  }));

  check('TUB-2c · panel: 5 ô số, nhận xét (người ghi, coSua), buổi có HV + lớp + người ghi + KN; giờ VN 23:30 ngày cuối khoảng vẫn tính', () => thu(() => {
    const a = themTutor('Thử Panel', 'MB', 'L', '0911222333');
    themBuoi(a, { fb: 0, sao: 2 });
    nhanXet(a, 'on', '2026-09-01T00:00:00.000Z');
    ngayFu('2026-10-11T16:30:00.000Z');   // 23:30 VN ngày 11/10
    const p = tr.panelTutor(HT, a, { tu: '2026-10-05', den: '2026-10-11' });
    assert(p.buoi.length === 1 && p.so.buoi === 1 && p.so.feedbackGv.join('/') === '0/1' && p.so.danhGia === 2, JSON.stringify(p.so));
    const b = p.buoi[0];
    assert(b.ngay === '2026-10-11' && b.hocVien && b.nguoiGhi !== undefined && b.feedbackGv === false && b.chuanBi === true, JSON.stringify(b));
    assert(p.nhanXet.length === 1 && p.nhanXet[0].nguoi && p.tutor.sdt === '0911222333', 'nhận xét + SĐT đủ cho Head tutor');
    assert(tr.panelTutor(HT, a, { tu: '2026-10-12', den: '2026-10-18' }).buoi.length === 0, '00:30 VN ngày 12 chưa tới');
  }));

  await checkAsync('TUB-2d · HTTP: GV 403, Head tutor không mở HV, Head thêm tutor chưa nơi dạy 403, khoảng sai 400; trần câu SQL bảng / panel', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string, method = 'GET', body?: unknown) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
          method, headers: { cookie: `pisa_demo_session=${createSession(uid)}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
        });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const k = `kieu=tuy-chon&tu=${K.tu}&den=${K.den}`;
      assert((await goi(P.lrTeacher.userId, `/tutors?${k}`)).status === 403, 'GV /tutors → 403');
      assert((await goi(HT.userId, `/students/1`)).status === 403, 'Head tutor không mở hồ sơ HV');
      assert((await goi(QL.userId, `/tutors`, 'POST', { ten: 'X', kyNang: ['L'] })).status === 403, 'QL thêm tutor → 403');
      assert((await goi(HT.userId, `/tutors?kieu=tuy-chon&tu=2026-10-10&den=2026-10-01`)).status === 400, 'khoảng ngược → 400');
      let truoc = soCauSql();
      const bang = await goi(HT.userId, `/tutors?${k}`);
      const cauBang = soCauSql() - truoc;
      const id = bang.json.dong[0].id;
      truoc = soCauSql();
      const panel = await goi(HT.userId, `/tutors/${id}?${k}`);
      const cauPanel = soCauSql() - truoc;
      truoc = soCauSql();
      const ql = await goi(QL.userId, `/tutors?${k}`);
      const cauQl = soCauSql() - truoc;
      console.log(`      (đo: Head tutor /tutors ${cauBang} câu, ${bang.json.dong.length} tutor · /tutors/:id ${cauPanel} câu · QL /tutors ${cauQl} câu)`);
      assert(bang.status === 200 && panel.status === 200 && ql.status === 200, `${bang.status} ${panel.status} ${ql.status}`);
      assert(Math.max(cauBang, cauQl) <= TRAN_TUTOR_BANG && cauPanel <= TRAN_TUTOR_PANEL, `trần câu: ${cauBang}, ${cauQl}/${TRAN_TUTOR_BANG} · ${cauPanel}/${TRAN_TUTOR_PANEL}`);
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ TUB-3 · thêm / sửa / xoá + nhận xét
  check('TUB-3a · thêm / sửa / xoá tutor: chỉ Tên + Kỹ năng bắt buộc; SĐT chuẩn hoá + trùng → lỗi tại ô; trùng tên → nhắc; xoá khi có buổi → 400', () => thu(() => {
    const r = tr.luuTutor(HT, { ten: 'Thử Thêm', kyNang: ['R', 'L'] });
    const x = one('SELECT * FROM tutors WHERE id = ?', r.id);
    assert(x.ky_nang === 'L,R' && x.sdt === null && x.noi_day_branch_id === null && x.chi_online === 0 && r.trungTen === false, JSON.stringify(x));
    assertThrows(() => tr.luuTutor(HT, { ten: 'Thử', kyNang: [] }), /kỹ năng/i, 'thiếu kỹ năng');
    assertThrows(() => tr.luuTutor(HT, { ten: ' ', kyNang: ['L'] }), /tên/i, 'thiếu tên');
    const s = tr.luuTutor(HT, { ten: 'Thử SĐT', sdt: '+84 912.000.111', noiDay: 'online', kyNang: ['W1'] });
    assert(one('SELECT sdt, chi_online FROM tutors WHERE id = ?', s.id).sdt === '0912000111', 'SĐT +84 → 0…');
    assertThrows(() => tr.luuTutor(HT, { ten: 'Khác', sdt: '0912 000 111', kyNang: ['L'] }), /SĐT đã có: Thử SĐT/, 'SĐT trùng');
    assertThrows(() => tr.luuTutor(HT, { ten: 'Khác', sdt: '0912', kyNang: ['L'] }), /SĐT/, 'SĐT sai');
    assert(tr.luuTutor(HT, { ten: 'thử  thêm', kyNang: ['S'] }).trungTen === true, 'trùng tên (bỏ dấu, hoa thường) → nhắc, vẫn lưu');
    tr.luuTutor(HT, { ten: 'Thử SĐT 2', sdt: '0912000111', noiDay: cn('MB'), kyNang: ['L'] }, s.id);
    assert(one('SELECT ten, noi_day_branch_id, chi_online FROM tutors WHERE id = ?', s.id).noi_day_branch_id === cn('MB'), 'sửa giữ SĐT của chính mình');
    assertThrows(() => tr.luuTutor(QL, { ten: 'X', noiDay: cn('CP'), kyNang: ['L'] }), /chi nhánh/, 'Head không thêm tutor chi nhánh khác (TU13)');
    assertThrows(() => tr.luuTutor(P.lrTeacher, { ten: 'X', kyNang: ['L'] }), /quyền/, 'GV không thêm');
    /* Lưu đồng thời: người khác vừa lấy SĐT sau bước kiểm (trigger giả lập) → lỗi tại ô SĐT, không 500. */
    conn.exec(`CREATE TEMP TRIGGER tub_dua BEFORE INSERT ON tutors WHEN NEW.sdt = '0909111222' AND NEW.ten <> 'Người nhanh hơn'
      BEGIN INSERT INTO tutors (ten, sdt, ky_nang, created_at) VALUES ('Người nhanh hơn', NEW.sdt, 'L', 'x'); END`);
    let bat: any = null;
    try { tr.luuTutor(HT, { ten: 'Thử Đồng Thời', sdt: '0909111222', kyNang: ['L'] }); } catch (e) { bat = e; }
    conn.exec('DROP TRIGGER tub_dua');
    assert(bat?.status === 400 && /SĐT đã có/.test(bat.message) && bat.details?.loi?.sdt, `UNIQUE → 400 tại ô SĐT: ${bat?.status} ${bat?.message}`);
    themBuoi(s.id);
    assertThrows(() => tr.xoaTutor(HT, s.id), /Ngừng hợp tác/, 'có buổi → không xoá');
    nhanXet(r.id, 'on', '2026-09-01T00:00:00.000Z');
    tr.xoaTutor(HT, r.id);
    assert(!one('SELECT 1 FROM tutors WHERE id = ?', r.id), 'chưa có buổi → xoá (kèm nhận xét)');
  }));

  check('TUB-3b · nhận xét: kết luận * + ≥ 10 ký tự; chỉ người ghi sửa / xoá trong 24 giờ; QL đọc được, không ghi', () => thu(() => {
    const a = themTutor('Thử Nhận Xét');
    assertThrows(() => tr.ghiNhanXet(HT, a, { ketLuan: 'on', noiDung: 'ngắn' }), /8 ký tự/, '< 8 ký tự');
    assertThrows(() => tr.ghiNhanXet(HT, a, { ketLuan: 'tot', noiDung: 'Nội dung đủ dài rồi' }), /Kết luận/, 'kết luận lạ');
    const { id } = tr.ghiNhanXet(HT, a, { ketLuan: 'can_cai_thien', noiDung: 'Nhắc gửi feedback đều' });
    assertThrows(() => tr.suaNhanXet(P.lrTeacher, id, { ketLuan: 'on', noiDung: 'Người khác sửa thử' }), /người ghi/, 'người khác sửa');
    const luc = one('SELECT luc FROM tutor_nhan_xet WHERE id = ?', id).luc;
    tr.suaNhanXet(HT, id, { ketLuan: 'on', noiDung: 'Đã sửa trong 24 giờ' });
    const x = one('SELECT ket_luan, luc, sua_luc FROM tutor_nhan_xet WHERE id = ?', id);
    assert(x.ket_luan === 'on' && x.luc === luc && x.sua_luc, 'sửa: giữ luc, ghi sua_luc');
    run(`UPDATE tutor_nhan_xet SET luc = '2026-01-01T00:00:00.000Z' WHERE id = ?`, id);
    assertThrows(() => tr.xoaNhanXet(HT, id), /24 giờ/, 'quá 24 giờ');
    const b = tr.ghiNhanXet(HT, a, { ketLuan: 'ngung', noiDung: 'Dừng hợp tác từ tuần sau' });
    tr.xoaNhanXet(HT, b.id);
    assert(!one('SELECT 1 FROM tutor_nhan_xet WHERE id = ?', b.id), 'xoá trong 24 giờ');
    assert(one(`SELECT before_json FROM audit_logs WHERE entity_type = 'tutor_nhan_xet' AND entity_id = ? ORDER BY id DESC LIMIT 1`, b.id).before_json.includes('Dừng hợp tác'), 'nhật ký giữ nội dung');
    assertThrows(() => tr.ghiNhanXet(QL, a, { ketLuan: 'on', noiDung: 'Head thử ghi nhận xét' }), /quyền/, 'Head không ghi');
    themBuoi(a);
    ngayFu('2026-09-10T03:00:00.000Z');
    const p = tr.panelTutor(QL, a, K);
    assert(p.nhanXet.length === 1 && p.nhanXet[0].coXoa === false, 'QL đọc nhận xét, không xoá được (R2 C9: Head chi nhánh nơi dạy sửa được)');
  }));

  // ------------------------------------------------------------------ TUB-4 · tải danh sách
  check('E-8b · Hoàn tác tải danh sách: tutor mới ĐÃ SỬA sau khi tải thì giữ (không xoá); SĐT cũ đã thuộc tutor khác → bỏ qua dòng đó + báo, không 500', () => thu(() => {
    const luu = tl.taiLenTutor(HT, { rows: [['Họ tên', 'Số điện thoại', 'Nơi dạy', 'Kỹ năng'], ['Thử Tải E8b', '0901000809', 'Monbay', 'L']], luu: true });
    run("UPDATE tutors SET ten = 'Thử Tải E8b sửa', updated_at = ? WHERE ten = 'Thử Tải E8b'", new Date().toISOString());   // có người sửa sau lần tải
    /* Dòng Cập nhật (dựng nhật ký) có SĐT cũ nay thuộc tutor KHÁC → bỏ qua + báo (UNIQUE sdt không được ném 500). */
    const a2 = themTutor('Thử E8b A', 'MB', 'L,R', '0933000222'), b2 = themTutor('Thử E8b B', 'MB', 'L,R', '0933000333');
    const luc = '2026-11-25T01:00:00.000Z';
    run('UPDATE tutors SET updated_at = ? WHERE id = ?', luc, a2);
    const nk = JSON.parse(one('SELECT after_json FROM audit_logs WHERE id = ?', luu.nhatKyId).after_json);
    nk.hoanTac.luc = luc; nk.hoanTac.cu = [{ id: a2, ten: 'Thử E8b A', sdt: '0933000333', noi: null, online: 0, kn: 'L,R', ub: null, ua: null }];
    run('UPDATE audit_logs SET after_json = ? WHERE id = ?', JSON.stringify(nk), luu.nhatKyId);
    const kq = tl.hoanTacTaiLen(HT, { nhatKyId: luu.nhatKyId });
    assert(kq.xoa === 0 && kq.giu >= 1 && one("SELECT 1 x FROM tutors WHERE ten = 'Thử Tải E8b sửa'"), `tutor mới đã sửa phải giữ: ${JSON.stringify(kq)}`);
    assert(kq.boQua.includes('Thử E8b A') && kq.khoiPhuc === 0 && one('SELECT sdt FROM tutors WHERE id = ?', a2).sdt === '0933000222' && b2, `SĐT bị chiếm phải báo, không 500: ${JSON.stringify(kq)}`);
  }));
  check('E-8 · Hoàn tác tải danh sách (≤ 15 phút, chỉ người tải): xoá tutor MỚI còn trống, trả dòng Cập nhật về bản trước; lần hai 400; người khác 403; quá 15 phút 409', () => thu(() => {
    const rows = [['Họ tên', 'Số điện thoại', 'Nơi dạy', 'Kỹ năng'], ['Thử Tải E8', '0901000808', 'Monbay', 'L'], ['Nguyễn Thu Lan', '0912345908', '', 'L · R · S']];
    const truoc = one(`SELECT ky_nang, updated_at FROM tutors WHERE ten = 'Nguyễn Thu Lan'`);
    const luu = tl.taiLenTutor(HT, { rows, luu: true });
    assert(luu.soMoi === 1 && luu.soCapNhat === 1 && Number.isInteger(luu.nhatKyId), `lưu: ${JSON.stringify([luu.soMoi, luu.soCapNhat, luu.nhatKyId])}`);
    assert(ma(() => tl.hoanTacTaiLen(QT, { nhatKyId: luu.nhatKyId })) === 403, 'người khác hoàn tác → 403');
    conn.prepare("UPDATE audit_logs SET created_at = ? WHERE id = ?").run(new Date(Date.now() - 16 * 60_000).toISOString(), luu.nhatKyId);
    assert(ma(() => tl.hoanTacTaiLen(HT, { nhatKyId: luu.nhatKyId })) === 409, 'quá 15 phút → 409');
    conn.prepare("UPDATE audit_logs SET created_at = ? WHERE id = ?").run(new Date().toISOString(), luu.nhatKyId);
    const kq = tl.hoanTacTaiLen(HT, { nhatKyId: luu.nhatKyId });
    assert(kq.xoa === 1 && kq.khoiPhuc === 1 && kq.giu === 0, `hoàn tác: ${JSON.stringify(kq)}`);
    const lan = one(`SELECT ky_nang, updated_at FROM tutors WHERE ten = 'Nguyễn Thu Lan'`);
    assert(lan.ky_nang === truoc.ky_nang && (lan.updated_at ?? null) === (truoc.updated_at ?? null) && !one(`SELECT 1 x FROM tutors WHERE ten = 'Thử Tải E8'`), 'tutor mới bị xoá, dòng cập nhật về bản trước');
    assert(ma(() => tl.hoanTacTaiLen(HT, { nhatKyId: luu.nhatKyId })) === 400, 'lần hai → 400');
  }));

  check('TUB-4 · tải danh sách: tiêu đề có / không; lỗi từng dòng; Cập nhật trước → sau; ô trống không xoá; lưu lại → 0 mới 0 cập nhật; SĐT Excel mất số 0; > 500 → 400', () => thu(() => {
    const TD = ['Họ tên', 'Số điện thoại', 'Nơi dạy', 'Kỹ năng'];
    const rows = [TD,
      ['Thử Tải A', '0901 000 001', 'Monbay', 'L, R'],
      ['Thử Tải B', '901000002', 'BC', 'W'],
      ['Thử Tải C', '0901000003', 'Hạ Long', 'L'],
      ['Thử Tải D', '0901000004', 'Online', 'S'],
      ['Thử Tải E', '0901000004', '', 'R'],
      ['Thử Tải F', '0912', '', 'L'],
      ['Thử Tải G', '', '', ''],
      ['Nguyễn Thu Lan', '0912345908', '', 'L · R · S'],
      ['', '', '', ''],
    ];
    const kq = tl.taiLenTutor(HT, { rows, luu: false });
    const o = (so: number) => kq.dong.find((x: any) => x.so === so);
    assert(o(2).kq === 'moi' && o(2).kyNang === 'L,R', `A: ${JSON.stringify(o(2))}`);
    assert(o(3).kq === 'moi' && o(3).sdt === '0901000002' && o(3).kyNang === 'W1,W2', `B (Excel mất 0, W = W1 + W2): ${JSON.stringify(o(3))}`);
    assert(o(4).kq === 'loi' && o(4).loi.join() === 'Nơi dạy "Hạ Long" không có', `C: ${o(4).loi}`);
    assert(o(5).kq === 'loi' && o(5).loi.includes('Trùng SĐT với dòng 6') && o(6).loi.includes('Trùng SĐT với dòng 5'), 'D, E trùng SĐT → lỗi cả hai');
    assert(o(7).kq === 'loi' && /SĐT/.test(o(7).loi.join()), 'F SĐT sai');
    assert(o(8).kq === 'loi' && /kỹ năng/i.test(o(8).loi.join()), 'G thiếu kỹ năng');
    assert(o(9).kq === 'capNhat' && o(9).doi.join() === 'Kỹ năng: L · R → L · R · S', `Lan: ${JSON.stringify(o(9))}`);
    assert(kq.dong.length === 8 && kq.soMoi === 2 && kq.soCapNhat === 1 && kq.soLoi === 5, `đếm ${kq.soMoi}/${kq.soCapNhat}/${kq.soLoi}`);
    const luu = tl.taiLenTutor(HT, { rows, luu: true });
    assert(luu.soMoi === 2 && luu.soCapNhat === 1, 'lưu đúng dòng hợp lệ');
    const lan = one(`SELECT sdt, noi_day_branch_id, ky_nang FROM tutors WHERE ten = 'Nguyễn Thu Lan'`);
    assert(lan.ky_nang === 'L,R,S' && lan.noi_day_branch_id === cn('MB'), 'ô Nơi dạy trống không xoá nơi dạy cũ');
    const lai = tl.taiLenTutor(HT, { rows, luu: true });
    assert(lai.soMoi === 0 && lai.soCapNhat === 0, `lưu lại cùng tệp: ${lai.soMoi} mới, ${lai.soCapNhat} cập nhật`);
    /* Không tiêu đề: thứ tự 4 cột; trùng tên không SĐT với 2 tutor → lỗi "Trùng tên". */
    themTutor('Thử Trùng'); themTutor('Thử trùng');
    const k2 = tl.taiLenTutor(HT, { rows: [['Thử Tải H', '', 'cp', 'R'], ['thu trung', '', '', 'L']], luu: false });
    assert(k2.dong[0].kq === 'moi' && k2.dong[0].noiDay === cn('CP'), `không tiêu đề: ${JSON.stringify(k2.dong[0])}`);
    assert(k2.dong[1].kq === 'loi' && k2.dong[1].loi.join() === 'Trùng tên — thêm SĐT', `trùng tên: ${k2.dong[1].loi}`);
    /* Chốt planning 20/10: SĐT chưa có + tên khớp đúng một tutor CHƯA có SĐT → Cập nhật (bổ sung SĐT), không tạo trùng. */
    const k3 = tl.taiLenTutor(HT, { rows: [['Bùi Quang Minh', '0977 000 123', '', 'S']], luu: false });
    assert(k3.dong[0].kq === 'capNhat' && k3.dong[0].doi.join() === 'SĐT: trống → 0977000123', `bổ sung SĐT: ${JSON.stringify(k3.dong[0])}`);
    /* Hai dòng cùng một tutor (SĐT của tutor + tên của chính tutor đó) → lỗi cả hai. */
    const k4 = tl.taiLenTutor(HT, { rows: [['Phạm Đức Long', '0983220117', '', 'L'], ['Phạm Đức Long', '', '', 'S']], luu: false });
    assert(k4.dong.every((x: any) => x.kq === 'loi' && /Trùng tutor với dòng/.test(x.loi.join())), `trùng tutor: ${JSON.stringify(k4.dong)}`);
    assertThrows(() => tl.taiLenTutor(HT, { rows: Array.from({ length: 501 }, (_, i) => [`T${i}`, '', '', 'L']), luu: false }), /500/, '> 500 dòng');
    assertThrows(() => tl.taiLenTutor(P.lrTeacher, { rows, luu: false }), /quyền/, 'GV không tải');
    /* Giữa xem trước và lưu có người thêm tutor cùng SĐT: lưu chạy lại cùng hàm kiểm → dòng đó thành Cập nhật, không lỗi UNIQUE / không trùng. */
    const r3 = [['Thử Đua', '0909000999', '', 'L']];
    assert(tl.taiLenTutor(HT, { rows: r3, luu: false }).dong[0].kq === 'moi', 'xem trước: Mới');
    themTutor('Người khác', null, 'R', '0909000999');
    const l3 = tl.taiLenTutor(HT, { rows: r3, luu: true });
    assert(l3.soMoi === 0 && l3.soCapNhat === 1 && one(`SELECT COUNT(*) n FROM tutors WHERE sdt = '0909000999'`).n === 1, 'lưu: thành Cập nhật');
  }));

  // ------------------------------------------------------------------ TUB-6 · gộp tên gõ tay
  check('TUB-6 · gộp tên gõ tay: gom bỏ dấu / hoa thường / khoảng trắng; gộp đặt tutor_id (giữ tên); Hoàn tác chỉ đặt lại dòng còn trỏ tutor đó', () => thu(() => {
    const x1 = themBuoi(null, { ten: 'Cô  Thuỷ' });
    const x2 = themBuoi(null, { ten: 'cô thuỷ' });
    const ds = tr.tenGoTay(HT);
    const thuy = ds.find((r: any) => r.khoa === tr.khoaTen('Cô Thủy'));
    assert(thuy && thuy.soBuoi === 2, `một dòng 2 buổi: ${JSON.stringify(thuy)}`);
    const a = themTutor('Thử Gộp');
    const kq = tr.gopTen(HT, { muc: [{ khoa: thuy.khoa, tutorId: a }] });
    assert(kq.soBuoi === 2 && kq.nhatKyId > 0, `gộp: ${JSON.stringify(kq)}`);
    assertThrows(() => tr.hoanTacGop(P.admin, { nhatKyId: kq.nhatKyId }), /người gộp/, 'người khác không hoàn tác lần gộp của Head tutor');
    assert(all('SELECT tutor_id, tutor_ten FROM case_followup_buoi WHERE id IN (?,?)', x1, x2).every((r) => r.tutor_id === a && /thu/i.test(r.tutor_ten)), 'gộp: tutor_id đặt, giữ tên');
    assert(!tr.tenGoTay(HT).some((r: any) => r.khoa === thuy.khoa), 'tên đã gộp rời danh sách');
    const b = themTutor('Thử Gộp Khác');
    run('UPDATE case_followup_buoi SET tutor_id = ? WHERE id = ?', b, x2);
    tr.hoanTacGop(HT, { nhatKyId: kq.nhatKyId, buoiIds: [x2] });   // buoiIds web gửi bị bỏ qua — đọc từ nhật ký
    assert(one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', x1).tutor_id === null && one('SELECT tutor_id FROM case_followup_buoi WHERE id = ?', x2).tutor_id === b,
      'hoàn tác: dòng 1 về NULL, dòng đã sửa tay sang tutor khác giữ nguyên');
    assertThrows(() => tr.gopTen(P.lrTeacher, { muc: [{ khoa: thuy.khoa, tutorId: a }] }), /quyền/, 'GV không gộp');
  }));

  // ------------------------------------------------------------------ TUB-7 · chỉ mục nhóm chú ý
  check('TUB-7 · canChuY đọc qua chỉ mục một phần idx_followup_buoi_chu_y (không SCAN bảng buổi) — toàn hệ thống, QL một chi nhánh, một tutor', () => {
    for (const [ten, c] of [['toàn hệ thống', tr.cauChuY(null)], ['Head MB', tr.cauChuY([cn('MB')])], ['một tutor', tr.cauChuY(null, 1)]] as const) {
      const ke = (all(`EXPLAIN QUERY PLAN ${c.sql}`, ...c.args) as any[]).map((x) => String(x.detail));
      assert(!ke.some((d) => /SCAN (b|case_followup_buoi)\b/.test(d)) && ke.some((d) => /idx_followup_buoi_chu_y/.test(d)), `${ten}: ${ke.join(' | ')}`);
    }
  });
}
