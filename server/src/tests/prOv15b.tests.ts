/**
 * PHÉP KIỂM OV-15b — lưới điểm, hồ sơ lớp, dán Excel, đường Nhập điểm. Kế hoạch: docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md (OV-15b).
 *  · 7: "Nhập bởi …" chỉ khi ô ĐÃ có điểm — máy chủ không gửi người nhập cho ô chưa có điểm (ô chỉ nhận xét, ô đã xoá điểm, GV chấm chéo đã phân công);
 *  · 2: dán từ Excel — hàm thuần (tách bảng, khớp tên bỏ dấu, trống ≠ 0 ≠ "-") + endpoint lô dùng lại kiểm ô của `saveScore`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15bTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY } = t as any;
  const { luuDiemLo } = await import('../cham/luuLo.ts');
  const lo = (p: any, dong: unknown) => luuDiemLo(p, dong);
  const svc: any = await import('../fasttrack/attempts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15b · Lưới điểm, dán Excel, "Nhập bởi" chỉ khi có điểm');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  check('OV15b-7 · ô chưa có điểm (chỉ nhận xét / đã gán người nhập cũ / GV chấm) không gửi người nhập; có điểm thì gửi', () => thu(() => {
    const a = one(`SELECT a.* FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
      WHERE c.is_fast_track = 1 AND a.status <> 'cancelled' AND a.kind = 'mock' ORDER BY a.id LIMIT 1`);
    assert(a, 'dữ liệu demo: phải có lượt Mock lớp FT');
    const u = P.admin.userId;
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill IN (?, ?)').run(a.id, 'speaking', 'listening');
    /* Ô S: chỉ nhận xét + GV chấm + entered_by (dữ liệu cũ / xoá điểm lớp thường để lại người xoá). */
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, comment, examiner_user_id, entered_by, entered_at)
      VALUES (?, 'speaking', 'Trôi chảy, cần mở rộng ý', ?, ?, '2026-09-14T03:00:00Z')`).run(a.id, u, u);
    /* Ô L: có điểm. */
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, band, entered_by, entered_at)
      VALUES (?, 'listening', 30, 7.0, ?, '2026-09-14T03:00:00Z')`).run(a.id, u);
    const cells = svc.skillCells(P.admin, a, svc.scoresOf(a.id), svc.skipsOf(a.id), TODAY) as any[];
    const s = cells.find((c) => c.skill === 'speaking'), l = cells.find((c) => c.skill === 'listening');
    assert(s.band === null && s.enteredByName === null && s.enteredById === null && s.enteredAt === null,
      `ô S chưa có điểm vẫn gửi người nhập: ${JSON.stringify({ n: s.enteredByName, id: s.enteredById })}`);
    assert(l.band === 7 && !!l.enteredByName && l.enteredById === u, 'ô L có điểm phải gửi người nhập');
  }));

  check('OV15b-1 · việc Nhập điểm mang đủ kỹ năng của việc (`kns` ⊇ `kn`, khớp chữ "Nhập điểm …") — panel chỉ hiện các cột này', () => {
    const viec = ((mywork.myWork(P.lrTeacher).dong ?? []) as any[]).flatMap((x) => (x.con?.length ? x.con : [x]))
      .filter((x) => x.group === 'score' && x.kn);
    assert(viec.length > 0, 'dữ liệu demo: GV L/R phải có việc Nhập điểm');
    for (const v of viec) {
      assert(Array.isArray(v.kns) && v.kns.includes(v.kn), `${v.key}: thiếu kns`);
      assert(v.kns.length === String(v.phu ?? v.reason).split(', ').length, `${v.key}: kns ${v.kns} ≠ "${v.phu}"`);
    }
  });

  check('OV15b-5 · bỏ tab "Điểm theo lớp": hàng tab Test không có; đường cũ /test/diem-lop vẫn mở được (panel lớp) cho người có testGrade', () => {
    const nav = (o: object) => ({ ...d.NAV_RONG, test: true, ...o });
    assert(!d.tabTestHienThi(nav({ testGrade: true, testPlan: true })).includes('diem-lop'), 'tab Điểm theo lớp vẫn còn');
    assert(d.tabTestTuDuong('diem-lop') === 'diem-lop', 'đường cũ không còn đọc được');
    assert(d.moDiemLopCu(nav({ testGrade: true })) && !d.moDiemLopCu(nav({ testPlan: true })) && !d.moDiemLopCu({ ...d.NAV_RONG, testGrade: true }),
      'link cũ: chỉ người có testGrade (và mục Test)');
  });

  check('OV15b-6 · Lịch Test: mặc định khung có bài của người xem; cả hai có bài → cả hai (null); URL thắng; không bài → theo lớp', () => {
    const f = (o: any) => d.khungLichTestMacDinh({ param: null, theoLop: null, coBai: { ft: 0, thuong: 0 }, dem: { ft: 3, thuong: 2 }, phamViHai: true, ...o });
    assert(f({ coBai: { ft: 4, thuong: 2 } }) === null, 'cả hai có bài phải hiện cả hai');
    assert(f({ coBai: { ft: 0, thuong: 2 } }) === 'thuong', 'chỉ lớp thường có bài → Lớp thường (không tự chọn Fast Track)');
    assert(f({ coBai: { ft: 5, thuong: 0 } }) === 'ft', 'chỉ FT có bài → Fast Track');
    assert(f({}) === null && f({ dem: { ft: 0, thuong: 2 } }) === 'thuong', 'không bài: theo lớp có trong tuần');
    assert(f({ param: 'ft', coBai: { ft: 0, thuong: 9 } }) === 'ft' && f({ param: 'tat-ca', coBai: { ft: 1, thuong: 0 } }) === null, 'URL thắng');
    assert(f({ param: 'ft', dem: { ft: 0, thuong: 2 }, phamViHai: false }) === 'thuong', 'URL khung rỗng ngoài phạm vi → bỏ');
    assert(f({ theoLop: 'thuong', coBai: { ft: 3, thuong: 0 } }) === 'thuong', 'lớp trên đường dẫn → khung của lớp đó');
  });

  /* ---------------------------------------------------------------- 2 · Dán từ Excel */
  const NAM = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  check('OV15b-2a · dán Excel: tách TSV (ngoặc kép, xuống dòng trong ô, CRLF); có tiêu đề map theo tên cột; không tiêu đề theo vị trí; một kỹ năng', () => {
    const tsv = 'Tên\tL\tNhận xét L\tR\tNhận xét R\r\nHồ Ngọc Diệp\t27\t"Nghe tốt\nPart 1–2"\t\t\r\n"Lê ""Huy"""\t28\tSót số Part 1\t31\tĐọc nhanh, sai T/F\r\n\r\n';
    const b = d.docBangDan(tsv, NAM);
    assert(b.coTieuDe, 'phải nhận hàng tiêu đề');
    assert(JSON.stringify(b.cot) === JSON.stringify(['Tên', 'L', 'Nhận xét L', 'R', 'Nhận xét R']), `cột đã nhận: ${JSON.stringify(b.cot)}`);
    assert(b.dong.length === 2, `bỏ dòng trống cuối: ${b.dong.length}`);
    const [a1, a2] = b.dong;
    const o = (r: any, k: string) => r.o.find((x: any) => x.skill === k);
    assert(a1.ten === 'Hồ Ngọc Diệp' && o(a1, 'listening').diem === '27' && o(a1, 'listening').nhanXet === 'Nghe tốt\nPart 1–2', 'ô ngoặc kép có xuống dòng');
    assert(o(a1, 'reading').diem === '' && !o(a1, 'writing1'), 'cột không dán → không có ô; ô trống giữ rỗng');
    assert(a2.ten === 'Lê "Huy"' && o(a2, 'reading').diem === '31' && a2.so === 3, `ngoặc kép kép + số dòng Excel: ${a2.ten} ${a2.so}`);
    /* Tiêu đề khác thứ tự + tên tiếng Anh: map theo tên, không theo vị trí. */
    const b2 = d.docBangDan('Học viên\tSpeaking\tW2\tNhận xét\nAn\t6 6 6.5 6\t7 7 7 7\tLập luận chặt, ví dụ tốt', NAM);
    assert(o(b2.dong[0], 'speaking').diem === '6 6 6.5 6' && o(b2.dong[0], 'writing2').nhanXet === 'Lập luận chặt, ví dụ tốt' && o(b2.dong[0], 'speaking').nhanXet === '',
      '"Nhận xét" không tên kỹ năng gắn với cột điểm ngay trước');
    /* Không tiêu đề: Tên | L | NX L | R | NX R … theo thứ tự cột đang mở. */
    const b3 = d.docBangDan('An\t30\tNghe tốt lắm luôn\t31\tĐọc ổn định', ['listening', 'reading']);
    assert(!b3.coTieuDe && o(b3.dong[0], 'reading').diem === '31' && o(b3.dong[0], 'listening').nhanXet === 'Nghe tốt lắm luôn', 'theo vị trí');
    const b4 = d.docBangDan('An\t6 6 6 6\tĐủ ý, ví dụ tốt', ['writing2']);
    assert(o(b4.dong[0], 'writing2').diem === '6 6 6 6' && o(b4.dong[0], 'writing2').nhanXet === 'Đủ ý, ví dụ tốt', 'một kỹ năng: Tên · điểm · nhận xét');
    const b5 = d.docBangDan('An\t30\t31\t6 6 6 6\t7 7 7 7\t6 6 6 6', NAM);
    assert(o(b5.dong[0], 'reading').diem === '31' && o(b5.dong[0], 'speaking').diem === '6 6 6 6' && o(b5.dong[0], 'listening').nhanXet === '', 'chỉ điểm, không cột nhận xét');
    assert(d.docBangDan('  \n ', NAM).dong.length === 0, 'khung rỗng');
  });

  check('OV15b-2b · khớp tên bỏ dấu (đ→d, hoa thường, khoảng trắng); email trong ô tên khớp email; trùng tên → ứng viên; không có trong lớp', () => {
    const ds = [
      { attemptId: 1, ten: 'Vũ Hải Đăng', email: 'dang@x.vn' },
      { attemptId: 2, ten: 'Nguyễn Minh An', email: 'an.nguyenminh@gmail.com' },
      { attemptId: 3, ten: 'Nguyễn Minh An', email: 'minhan.ng@gmail.com' },
    ];
    assert(d.khopHocVien('  vu  hai dang ', ds).attemptId === 1, 'bỏ dấu + đ→d');
    assert(JSON.stringify(d.khopHocVien('Nguyen Minh An', ds).trung) === '[2,3]', 'trùng tên → ứng viên, không đoán');
    assert(d.khopHocVien('Nguyễn Minh An minhan.ng@gmail.com', ds).attemptId === 3, 'email trong ô tên');
    assert(d.khopHocVien('MINHAN.NG@gmail.com', ds).attemptId === 3, 'chỉ email, hoa thường');
    assert(d.khopHocVien('Trần Văn Nam', ds).khongCo === true, 'không có trong lớp');
    assert(d.khopHocVien('', ds).khongCo === true, 'tên trống');
  });

  check('OV15b-2c · ô dán: trống bỏ qua ≠ 0 ≠ "-"; L/R Số câu / Band; W/S MT thường 4 tiêu chí (một band → lỗi, MT cũ nhận); nhận xét MT ngắn lỗi; dưới kỳ vọng cần nhóm', () => {
    const o = (k: string, x: object = {}) => ({ skill: k, required: true, canEdit: true, rawScore: null, band: null, criteria: [null, null, null, null],
      bandThang: false, batBuocNhanXet: true, kyVong: 6, nhanXet: null, nhomNguyenNhan: [], progress: 'scheduled', ...x });
    const x = (diem: string, nx: string, cell: object, che = 'cau') => d.xetODan({ diem, nhanXet: nx }, cell, che);
    const NX = 'Nghe tốt phần 1 và 2';
    assert(x('', '', o('listening')).loai === 'bo', 'trống = bỏ qua');
    const khong = x('0', NX, o('listening'));
    assert(khong.loai === 'ghi' && khong.patch.rawScore === 0, '0 là điểm, không phải trống');
    const vang = x('-', '', o('listening'));
    assert(vang.loai === 'ghi' && vang.patch.noShow === true && vang.patch.rawScore === undefined, '"-" là vắng, không phải 0');
    assert(x('-', '', o('listening', { rawScore: 30, band: 7 })).loai === 'loi', '"-" không xoá điểm đã có');
    const l = x('28', NX, o('listening'));
    assert(l.loai === 'ghi' && l.patch.rawScore === 28 && l.patch.nhanXet === NX && l.band === 6.5 && !l.canNhom && l.truoc === null, 'L số câu');
    assert(x('43', NX, o('listening')).loai === 'loi' && x('6.5', NX, o('listening')).loai === 'loi', 'Số câu: ngoài 0–40 / số lẻ → lỗi');
    const lb = x('6,5', NX, o('reading'), 'band');
    assert(lb.loai === 'ghi' && lb.patch.band === 6.5 && lb.patch.rawScore === undefined, 'Band cho cả lô, dấu phẩy thập phân');
    assert(x('9.5', NX, o('reading'), 'band').loai === 'loi', 'band ngoài 0–9');
    const w = x('5.5 6 6 5.5', 'Thiếu số liệu chính', o('writing1'));
    assert(w.loai === 'ghi' && JSON.stringify(w.patch.criteria) === '[5.5,6,6,5.5]' && w.band === 6 && !w.canNhom, `W 4 tiêu chí: ${JSON.stringify(w)}`);
    const wb = x('6.5', 'Thiếu số liệu chính', o('writing1'));
    assert(wb.loai === 'loi' && wb.loi === d.LOI_DAN_BAND, 'MT thường: một band ở W/S → lỗi (Band tự tính từ 4 tiêu chí)');
    const cu = x('6.5', '', o('speaking', { bandThang: true, batBuocNhanXet: false }));
    assert(cu.loai === 'ghi' && cu.patch.band === 6.5, 'MT cũ / MT0 nhận band thẳng');
    assert(x('6 6 6', NX, o('speaking')).loai === 'loi', 'thiếu tiêu chí');
    assert(x('28', 'Ngắn', o('listening')).loai === 'loi', 'nhận xét MT < 10 ký tự → lỗi');
    assert(x('28', '', o('listening')).loai === 'loi', 'MT có điểm phải có nhận xét');
    assert(x('28', '', o('listening', { nhanXet: 'Đã có nhận xét đủ dài' })).loai === 'ghi', 'nhận xét cũ của ô vẫn tính');
    const duoi = x('17', 'Hết giờ ở passage 3', o('listening'));
    assert(duoi.loai === 'ghi' && duoi.canNhom, 'dưới kỳ vọng → cần nhóm nguyên nhân');
    assert(!x('17', 'Hết giờ ở passage 3', o('listening', { nhomNguyenNhan: ['L1'] })).canNhom, 'ô đã có nhóm → không hỏi lại');
    assert(!x('17', '', o('listening', { batBuocNhanXet: false })).canNhom, 'MT cũ / MT0: nhóm không bắt buộc (như máy chủ)');
    const de = x('22', 'Part 2 tiến bộ rõ', o('listening', { rawScore: 17, band: 5 }));
    assert(de.loai === 'ghi' && de.truoc === '17' && de.sau === '22', 'ghi đè trước → sau');
    assert(x('17', '', o('listening', { rawScore: 17, band: 5, nhanXet: 'Nhận xét cũ đủ dài' })).loai === 'bo', 'giống hệt → bỏ qua');
    assert(x('28', NX, o('listening', { canEdit: false })).loai === 'loi', 'ô không được sửa → lỗi');
    /* Hoàn tác: lệnh trả lại như trước khi dán. */
    const tr = (cell: object, p: object) => JSON.stringify(d.patchTruoc(o('listening', cell), p));
    assert(tr({}, { rawScore: 28, nhanXet: NX }) === '{"rawScore":null,"nhanXet":null}', `ô trống → xoá: ${tr({}, { rawScore: 28, nhanXet: NX })}`);
    assert(tr({ rawScore: 17, band: 5, nhanXet: 'Cũ đủ mười ký tự' }, { rawScore: 22, nhanXet: NX }) === '{"rawScore":17,"nhanXet":"Cũ đủ mười ký tự"}', 'L có số câu → trả số câu');
    assert(tr({ rawScore: null, band: 6.5 }, { band: 7 }) === '{"band":6.5}', 'L chỉ band → trả band');
    assert(JSON.stringify(d.patchTruoc(o('writing1', { criteria: [6, 6, 6, 5.5], band: 6 }), { criteria: [7, 7, 7, 7], nhomNguyenNhan: ['x'] }))
      === '{"criteria":[6,6,6,5.5],"nhomNguyenNhan":[]}', 'W có tiêu chí → trả tiêu chí; nhóm cũ');
    assert(tr({}, { noShow: true }) === '{"noShow":false}', '"-" → gỡ dấu');
    assert(tr({ rawScore: 30, band: 7 }, { nhanXet: NX }) === '{"nhanXet":null}', 'chỉ nhận xét → không đụng điểm');
    assert(x('28', NX, o('listening', { required: false })).loai === 'loi', 'kỹ năng không thuộc lượt → lỗi');
  });

  check('OV15b-2d · lưu lô: mỗi dòng một giao dịch — ô sai môn 403 làm cả dòng không lưu, dòng khác vẫn lưu; nhận xét MT ngắn lỗi dòng đó', () => thu(() => {
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
      JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'listening' AND k.required = 1 AND k.sit_status NOT IN ('cancelled','absent')
      JOIN report_periods pr ON pr.id = k.planned_period_id AND pr.week_start <= ?
      WHERE c.code = 'MB FT 101' AND a.kind = 'mock' AND a.status <> 'cancelled' AND COALESCE(a.lich_su, 0) = 0
      ORDER BY a.id LIMIT 3`).all(TODAY) as any[];
    assert(ds.length === 3, `dữ liệu demo: cần 3 lượt MT có L tới tuần thi (${ds.length})`);
    for (const r of ds) conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).run(r.id);
    const [a1, a2, a3] = ds.map((r) => r.id);
    const NX = 'Nghe tốt phần 1 và 2';
    const c0 = soCauSql(), d0 = soDongSql();
    const kq = lo(P.lrTeacher, [
      { attemptId: a1, o: [{ skill: 'listening', rawScore: 30, nhanXet: NX }, { skill: 'writing1', criteria: [6, 6, 6, 6], nhanXet: 'Đủ ý, bố cục rõ ràng' }] },
      { attemptId: a2, o: [{ skill: 'listening', rawScore: 31, nhanXet: 'Ngắn' }] },
      { attemptId: a3, o: [{ skill: 'listening', rawScore: 32, nhanXet: NX }] },
    ]);
    console.log(`      [đo] lô 3 dòng (4 ô): ${soCauSql() - c0} câu, ${soDongSql() - d0} dòng đọc`);
    const diem = (id: number) => one(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, id)?.raw_score ?? null;
    assert(!kq.dong[0].ok && kq.dong[0].skill === 'writing1' && kq.dong[0].status === 403, `ô sai môn: ${JSON.stringify(kq.dong[0])}`);
    assert(diem(a1) === null, 'dòng có ô bị từ chối không được lưu nửa chừng (L của dòng đó phải chưa ghi)');
    assert(!kq.dong[1].ok && kq.dong[1].skill === 'listening' && /10 ký tự/.test(kq.dong[1].loi) && diem(a2) === null, `nhận xét ngắn: ${JSON.stringify(kq.dong[1])}`);
    assert(kq.dong[2].ok && diem(a3) === 32, 'dòng hợp lệ vẫn lưu');
    assert(kq.soDaLuu === 1, 'đếm dòng đã lưu');
    const nk = one(`SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'score.dan_excel'`)?.n;
    assert(nk >= 1, 'một lần lưu = một mục lịch sử dán Excel');
    assertThrows(() => lo(P.lrTeacher, [{ attemptId: a3, o: [{ skill: 'xyz', rawScore: 1 }] }]), /Kỹ năng/, 'kỹ năng lạ bị chặn ở cửa');
    assertThrows(() => lo(P.lrTeacher, [{ attemptId: 'x', o: [] }]), /Lượt/, 'lượt không hợp lệ');
    assertThrows(() => lo(P.lrTeacher, Array.from({ length: d.DAN_TOI_DA_DONG + 1 }, () => ({ attemptId: a3, o: [] }))), /tối đa/, 'lô quá lớn bị chặn ở cửa');
  }));
}
