/** PHÉP KIỂM PR-K26 — Lộ trình tiếp theo theo dải % Cuối khoá (kế hoạch 2026-10-04-pr-k26-lo-trinh-tiep-theo-dai, K26-1 → K26-4). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrK26Tests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-K26 · Lộ trình tiếp theo theo dải % Final Test');

  // ------------------------------------------------------------------ K26-1 · luật hướng (thuần)
  check('K26-1 · chuanHoaHuong: chua_ro/xep_sau → chua_quyet; hợp lệ giữ; lạ → null', () => {
    assert(d.chuanHoaHuong('xep_sau') === 'chua_quyet' && d.chuanHoaHuong('chua_ro') === 'chua_quyet', 'gộp giá trị cũ');
    assert(d.chuanHoaHuong('hoc_lai') === 'hoc_lai' && d.chuanHoaHuong('chua_quyet') === 'chua_quyet', 'giữ giá trị hợp lệ');
    assert(d.chuanHoaHuong('abc') === null, 'lạ → null');
    assert(d.HUONG_TIEP.includes('chua_quyet') && d.HUONG_CHUYEN_TIEP.includes('chua_quyet'), 'hai bước cùng có chua_quyet');
    assert(!d.HUONG_TIEP.includes('chua_ro') && !d.HUONG_CHUYEN_TIEP.includes('xep_sau'), 'bỏ hai giá trị cũ');
  });
  check('K26-1 · nhãn Chưa quyết: đầy đủ không ngày; ngắn có ngày → "Chưa quyết · xem lại dd/mm"', () => {
    const ctx = { ma: 'FOU', maKe: 'BE' };
    assert(d.nhanHuong('chua_quyet', ctx) === 'Chưa quyết', d.nhanHuong('chua_quyet', ctx));
    assert(d.nhanHuongNgan('chua_quyet', { ...ctx, ngayXemLai: '2026-09-28' }) === 'Chưa quyết · xem lại 28/09', d.nhanHuongNgan('chua_quyet', { ...ctx, ngayXemLai: '2026-09-28' }));
    assert(d.nhanHuongNgan('chua_quyet', ctx) === 'Chưa quyết', 'không ngày');
    assert(d.tomTatChuyenTiep([{ huong: 'chua_quyet' }]).cau.join() === '1 em chưa quyết', 'tóm tắt');
  });
  check('K26-1 · xepHuongTheoGoiY: 50–59% → Lên + Học lại đầu; len → Lên; hoc_lai → Học lại; null → như cũ; ELE bỏ len_lop', () => {
    const ql = d.xepHuongTheoGoiY(d.HUONG_TIEP, { huong: null, canQuanLy: true });
    assert(ql.dau.join() === 'len_lop,hoc_lai', ql.dau.join());
    assert(!ql.khac.includes('len_lop') && !ql.khac.includes('hoc_lai') && ql.khac.length === d.HUONG_TIEP.length - 2, ql.khac.join());
    assert(d.xepHuongTheoGoiY(d.HUONG_TIEP, { huong: 'len', canQuanLy: false }).dau.join() === 'len_lop', 'len');
    assert(d.xepHuongTheoGoiY(d.HUONG_TIEP, { huong: 'hoc_lai', canQuanLy: false }).dau.join() === 'hoc_lai', 'hoc_lai');
    const khong = d.xepHuongTheoGoiY(d.HUONG_TIEP, null);
    assert(khong.dau.length === 0 && khong.khac.join() === d.HUONG_TIEP.join(), 'chưa đủ điểm: như cũ');
    const ele = d.xepHuongTheoGoiY(d.huongTiepKhaDung('ELE'), { huong: null, canQuanLy: true });
    assert(ele.dau.join() === 'hoc_lai' && !ele.khac.includes('len_lop'), `ELE: ${ele.dau.join()} | ${ele.khac.join()}`);
  });

  // ------------------------------------------------------------------ dựng dữ liệu chung (lớp thường MB, em + Cuối khoá)
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const transition: any = await import('../classes/transition.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));
  let seq = 0;
  /** Lớp thường `kind` đang ở tuần `tuan` (9 với FOU 8 tuần = hết khoá), `soEm` em có ghi danh + lộ trình; trả lượt Cuối khoá của từng em. */
  const taoLop = (kind: 'FOU' | 'BE' | 'ELE', tuan: number, soEm: number) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB K26-${seq}`, branchId: MB, kind, isFastTrack: false, startDate: thu2(tuan), startPeriodId: week.ensurePeriod(thu2(tuan)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `K26-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(tuan), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, NULL, ?, 'active', ?)`)
        .run(sid, kind, thu2(tuan), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    const luot = new Map<number, number>();
    for (const r of conn.prepare(`SELECT id, student_id FROM assessment_attempts WHERE class_id = ? AND kind = 'final'`).all(lop.id) as any[]) luot.set(r.student_id, r.id);
    return { classId: lop.id as number, sids, luot };
  };
  /** Cuối khoá bốn kỹ năng cùng điểm `diem`/40. */
  const ghiCuoiKhoa = (attemptId: number, diem: number) => {
    for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
      conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(attemptId, skill);
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total) VALUES (?,?,?,40)').run(attemptId, skill, diem);
    }
  };
  const ganGVCN = (classId: number, userId: number) => {
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, is_core, effective_from, status, created_at) VALUES (?, ?, 1, '2026-01-01', 'active', ?)`)
      .run(userId, classId, new Date().toISOString());
    return loadPrincipal(userId);
  };
  const chen = (sid: number, classId: number, huong: string, ngay: string | null) => {
    const now = new Date().toISOString();
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ly_do, ngay_xem_lai, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(sid, classId, huong, ngay ? 'Chờ phụ huynh' : null, ngay, now, now);
  };
  const banGhi = (sid: number) => get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ?', sid);

  // ------------------------------------------------------------------ K26-2 · migrate + máy chủ nhận giá trị cũ
  const { migratePrK26 } = await import('../migrate/prK26.ts');
  check('K26-2a · migratePrK26: chua_ro (không ngày) + xep_sau (ngày tương lai) → chua_quyet, giữ ngày + lý do; lần hai không làm gì', () => {
    const l = taoLop('FOU', 9, 2);
    const hen = addDays(TODAY, 14);
    chen(l.sids[0], l.classId, 'chua_ro', null);
    chen(l.sids[1], l.classId, 'xep_sau', hen);
    const lan1: string[] = [];
    migratePrK26(conn, lan1);
    assert(lan1.length === 1 && /PR-K26/.test(lan1[0]), lan1.join());
    const a = banGhi(l.sids[0]);
    const b = banGhi(l.sids[1]);
    assert(a.huong === 'chua_quyet' && a.ngay_xem_lai === null, JSON.stringify(a));
    assert(b.huong === 'chua_quyet' && b.ngay_xem_lai === hen && b.ly_do === 'Chờ phụ huynh', JSON.stringify(b));
    const lan2: string[] = [];
    migratePrK26(conn, lan2);
    assert(lan2.length === 0, `lần hai: ${lan2.join()}`);
  });
  check('K26-2b · sau gộp: em hẹn xem lại tương lai không vào đỏ Hết khoá; em Chưa quyết không ngày vẫn được nhắc ở hai tuần cuối', () => {
    const l = taoLop('FOU', 9, 2);
    assert(schedule.classProgress(l.classId).canXepLop === 2, 'tiền đề: 2 em cần xếp');
    chen(l.sids[0], l.classId, 'xep_sau', addDays(TODAY, 14));
    chen(l.sids[1], l.classId, 'chua_ro', null);
    migratePrK26(conn, []);
    assert(schedule.classProgress(l.classId).canXepLop === 1, `còn 1 em cần xếp: ${schedule.classProgress(l.classId).canXepLop}`);
    assert(schedule.classProgressMany([l.classId]).get(l.classId).canXepLop === 1, 'classProgressMany cùng số');
    const cur = (sid: number) => get(`SELECT * FROM enrollments WHERE student_id = ? AND status = 'active'`, sid);
    assert(loTrinh.lopHocCua(P.admin, l.sids[1], cur(l.sids[1])).nhacLoTrinh === true, 'không ngày → vẫn nhắc');
    assert(loTrinh.lopHocCua(P.admin, l.sids[0], cur(l.sids[0])).nhacLoTrinh === false, 'có hẹn ngày → không nhắc (như xep_sau cũ)');
  });
  check('K26-2c · ghiLoTrinhTiep nhận xep_sau/chua_ro từ form cũ → lưu chua_quyet; hướng lạ → 400; ngày xem lại tuỳ chọn', () => {
    const l = taoLop('FOU', 3, 1);
    const gvcn = ganGVCN(l.classId, P.normalCoreTeacher.userId);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'xep_sau' });
    assert(banGhi(sid).huong === 'chua_quyet', 'xep_sau → chua_quyet');
    loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'chua_ro' });
    assert(banGhi(sid).huong === 'chua_quyet', 'chua_ro → chua_quyet');
    assertThrows(() => loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'abc' }), /Hướng không hợp lệ/, 'hướng lạ');
    const r = loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'chua_quyet', ngayXemLai: addDays(TODAY, 7) });
    assert(r.banGhi.ngayXemLai === addDays(TODAY, 7), `ngày xem lại: ${JSON.stringify(r.banGhi)}`);
    assertThrows(() => loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'chua_quyet', ngayXemLai: '28/09' }), /Ngày xem lại/, 'ngày sai dạng');
    loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'len_lop', ngayXemLai: addDays(TODAY, 7) });
    assert(banGhi(sid).ngay_xem_lai === null, 'hướng khác thì không giữ ngày xem lại');
  });
  check('K26-2d · applyTransition nhận xep_sau cũ → ghi chua_quyet; Chưa quyết thiếu ngày xem lại → lỗi dòng', () => {
    const l = taoLop('FOU', 9, 2);
    const r = transition.applyTransition(P.mbManager, {
      fromClassId: l.classId, effectiveDate: TODAY,
      dongs: [
        { studentId: l.sids[0], huong: 'xep_sau', lyDo: 'Chờ phụ huynh', ngayXemLai: addDays(TODAY, 14) },
        { studentId: l.sids[1], huong: 'chua_quyet', lyDo: 'Chờ phụ huynh' },
      ],
    });
    assert(banGhi(l.sids[0])?.huong === 'chua_quyet', `xep_sau → chua_quyet: ${JSON.stringify(banGhi(l.sids[0]))}`);
    assert(r.failed.length === 1 && r.failed[0].studentId === l.sids[1] && /ngày xem lại/.test(r.failed[0].message), JSON.stringify(r.failed));
  });

  // ------------------------------------------------------------------ K26-3 · panel một em: gợi ý đứng đầu, 50–59% là đề xuất
  const fs = await import('node:fs');
  const nguon = (f: string) => fs.readFileSync(new URL(`../../../../web/src/${f}`, import.meta.url), 'utf8');
  check('K26-3a · layLoTrinhTiep: em Final Test 55% → goiY.canQuanLy; 78% → len; 45% → hoc_lai; thiếu điểm → không gợi ý', () => {
    const l = taoLop('BE', 11, 4);
    const gvcn = ganGVCN(l.classId, P.normalCoreTeacher.userId);
    ghiCuoiKhoa(l.luot.get(l.sids[0])!, 22);   // 55%
    ghiCuoiKhoa(l.luot.get(l.sids[1])!, 31);   // 77,5%
    ghiCuoiKhoa(l.luot.get(l.sids[2])!, 18);   // 45%
    const g = (i: number) => loTrinh.layLoTrinhTiep(gvcn, l.sids[i]).cuoiKhoa?.goiY ?? null;
    assert(g(0)?.canQuanLy === true && g(0)?.huong === null, `55%: ${JSON.stringify(g(0))}`);
    assert(g(1)?.huong === 'len' && !g(1)?.canQuanLy, '78%');
    assert(g(2)?.huong === 'hoc_lai', '45%');
    assert(g(3) === null, 'chưa có điểm → không gợi ý');
    /* Review Focus 4: em 50–59% đã lưu hoc_lai → hướng đó nằm trong hai hướng đầu, không bị giấu trong "Hướng khác". */
    loTrinh.ghiLoTrinhTiep(gvcn, l.sids[0], { huong: 'hoc_lai' });
    const r = loTrinh.layLoTrinhTiep(gvcn, l.sids[0]);
    const { dau } = d.xepHuongTheoGoiY(d.huongTiepKhaDung('BE'), r.cuoiKhoa.goiY);
    assert(dau.includes(r.banGhi.huong), `hướng đã lưu ${r.banGhi.huong} trong ${dau.join()}`);
  });
  check('K26-3b · panel: xếp hướng bằng xepHuongTheoGoiY, chữ đề xuất cho Quản lý, "Hướng khác", chân S3 qua chan.daSua (PR-SL I1); bảng Chuyển tiếp điền sẵn đề xuất GVCN', () => {
    const src = nguon('modules/students/LoTrinhTiepPanel.tsx');
    for (const chu of ['xepHuongTheoGoiY(', 'Hướng bạn đề xuất (Quản lý quyết)', 'Lưu đề xuất', 'Hướng khác', 'daSua, huy: {', 'Hệ thống gợi ý']) {
      assert(src.includes(chu), `thiếu ${chu}`);
    }
    assert(!/Chưa rõ|Xếp sau/.test(src), 'còn chữ cũ');
    assert(/s\.loTrinhTiep/.test(nguon('modules/classes/TransitionPanel.tsx')), 'Chuyển tiếp lớp đọc Lộ trình tiếp theo để điền sẵn');
  });

  // ------------------------------------------------------------------ K26-4 · ghi lộ trình tiếp theo cả lớp
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const soBanGhi = (classId: number) => get('SELECT COUNT(*) n FROM lo_trinh_tiep_theo WHERE class_id = ?', classId).n as number;
  check('K26-4a · ghiLoTrinhTiepCaLop: GVCN ghi 3 em một lần → 3 bản ghi + 3 dòng hành trình; giữ chi tiết đã lưu khi cùng hướng', () => {
    const l = taoLop('FOU', 8, 3);
    const gvcn = ganGVCN(l.classId, P.normalCoreTeacher.userId);
    const lopBe = intake.createClass(P.admin, { code: `MB K26-BE-${seq}`, branchId: MB, kind: 'BE', isFastTrack: false, startDate: thu2(1), startPeriodId: week.ensurePeriod(thu2(1)).id });
    loTrinh.ghiLoTrinhTiep(gvcn, l.sids[0], { huong: 'len_lop', lopDuKienId: lopBe.id });
    const truoc = get(`SELECT COUNT(*) n FROM journey_events WHERE event_type = 'next_step' AND student_id IN (?,?,?)`, ...l.sids).n;
    const r = loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [
      { studentId: l.sids[0], huong: 'len_lop', ghiChu: 'Lên cùng nhóm' },
      { studentId: l.sids[1], huong: 'hoc_lai' },
      { studentId: l.sids[2], huong: 'xep_sau' },
    ] });
    assert(r.daLuu === 3 && soBanGhi(l.classId) === 3, `daLuu ${r.daLuu}, bản ghi ${soBanGhi(l.classId)}`);
    const sau = get(`SELECT COUNT(*) n FROM journey_events WHERE event_type = 'next_step' AND student_id IN (?,?,?)`, ...l.sids).n;
    assert(sau - truoc === 3, `hành trình +${sau - truoc}`);
    assert(banGhi(l.sids[0]).lop_du_kien_id === lopBe.id && banGhi(l.sids[0]).ghi_chu === 'Lên cùng nhóm', `giữ lớp dự kiến: ${JSON.stringify(banGhi(l.sids[0]))}`);
    assert(banGhi(l.sids[2]).huong === 'chua_quyet', 'giá trị cũ → chua_quyet');
    const bang = loTrinh.layLoTrinhTiepCaLop(gvcn, l.classId);
    assert(bang.coTheGhi && bang.hocVien.length === 3 && bang.hocVien.every((h: any) => h.banGhi), 'GET cả lớp đọc lại đủ');
  });
  check('K26-4a · tất cả hoặc không: em ngoài lớp / lớp dự kiến sai → 400 có studentId, 0 bản ghi mới; GVBM 403; 61 dòng 400; rỗng 400', () => {
    const l = taoLop('FOU', 8, 2);
    const gvcn = ganGVCN(l.classId, P.normalCoreTeacher.userId);
    const ngoai = taoLop('FOU', 8, 1).sids[0];
    let e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: l.sids[0], huong: 'hoc_lai' }, { studentId: ngoai, huong: 'hoc_lai' }] }));
    assert(e?.status === 400 && e.details?.studentId === ngoai && soBanGhi(l.classId) === 0, `em ngoài lớp: ${e?.status} ${e?.message}`);
    e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [{ studentId: l.sids[0], huong: 'hoc_lai' }, { studentId: l.sids[1], huong: 'abc' }] }));
    assert(e?.status === 400 && e.details?.studentId === l.sids[1] && e.message.startsWith('Học viên K26-') && soBanGhi(l.classId) === 0,
      `dòng sai giữa chừng phải huỷ cả lô: ${e?.status} ${e?.message} · ${soBanGhi(l.classId)}`);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, is_core, effective_from, status, created_at) VALUES (?, ?, 0, '2026-01-01', 'active', ?)`)
      .run(P.normalSubjectTeacher.userId, l.classId, new Date().toISOString());
    e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(loadPrincipal(P.normalSubjectTeacher.userId), l.classId, { items: [{ studentId: l.sids[0], huong: 'hoc_lai' }] }));
    assert(e?.status === 403, `GVBM: ${e?.status} ${e?.message}`);
    e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: Array.from({ length: 61 }, () => ({ studentId: l.sids[0], huong: 'hoc_lai' })) }));
    assert(e?.status === 400 && /tối đa 60/.test(e.message), `61 dòng: ${e?.message}`);
    assert(loi(() => loTrinh.ghiLoTrinhTiepCaLop(gvcn, l.classId, { items: [] }))?.status === 400, 'rỗng');
    assert(soBanGhi(l.classId) === 0, 'không lưu gì');
  });
  check('K26-4b · GET cả lớp: số câu SQL không tăng theo số em (3 em vs 30 em)', () => {
    const dem = (fn: () => void): number => {
      let n = 0; const goc = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
      try { fn(); } finally { (conn as any).prepare = goc; }
      return n;
    };
    const it = taoLop('BE', 11, 3);
    const nhieu = taoLop('BE', 11, 30);
    for (const sid of nhieu.sids) ghiCuoiKhoa(nhieu.luot.get(sid)!, 25);
    for (const sid of it.sids) ghiCuoiKhoa(it.luot.get(sid)!, 25);
    const a = dem(() => loTrinh.layLoTrinhTiepCaLop(P.admin, it.classId));
    const b = dem(() => loTrinh.layLoTrinhTiepCaLop(P.admin, nhieu.classId));
    /* PR-MT0: +MT0 cả lớp (một câu) + tuần Final ở thanh đầu (`classProgress`) — trần 15 → 20, vẫn không tăng theo số em. */
    assert(a === b && b <= 20, `3 em ${a} câu · 30 em ${b} câu`);
  });
  check('K26-4c · hồ sơ lớp: mục ⋮ "Ghi lộ trình tiếp theo cả lớp" chỉ hiện khi có quyền ghi; panel cả lớp lỗi theo dòng', () => {
    const dau = nguon('modules/classes/DauTrangLop.tsx') + nguon('modules/classes/ClassOverviewPage.tsx');
    assert(dau.includes('Ghi lộ trình tiếp theo cả lớp') && /LoTrinhTiepCaLopPanel/.test(dau), 'mục menu + panel');
    const pn = nguon('modules/classes/LoTrinhTiepCaLopPanel.tsx');
    assert(pn.includes('aria-describedby') && pn.includes("rong=\"toan\"") && /Lưu \$\{/.test(pn), 'lỗi theo dòng, panel toàn màn, nút Lưu n em');
    assert(nguon('modules/classes/TransitionPanel.tsx').includes('GVCN đề xuất:'), 'Chuyển tiếp: dòng không điền sẵn được vẫn hiện đề xuất GVCN');
  });
  /* Sau rà mã: Turso tính mỗi câu một lượt mạng — ghi cả lớp phải đọc + ghi theo lô, không N câu cho N em trong một giao dịch. */
  check('K26-4d · PUT cả lớp: số câu SQL như nhau với 3 em và 32 em; ngày xem lại đã qua, ghi chú quá dài → 400 có studentId', () => {
    const dem = (fn: () => void): number => {
      let n = 0; const goc = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
      try { fn(); } finally { (conn as any).prepare = goc; }
      return n;
    };
    const it = taoLop('FOU', 8, 3);
    const nhieu = taoLop('FOU', 8, 32);
    const ghi = (l: { classId: number; sids: number[] }) => () => loTrinh.ghiLoTrinhTiepCaLop(P.admin, l.classId, { items: l.sids.map((sid) => ({ studentId: sid, huong: 'hoc_lai', ghiChu: 'x' })) });
    const a = dem(ghi(it));
    const b = dem(ghi(nhieu));
    assert(a === b && b <= 15, `3 em ${a} câu · 32 em ${b} câu`);
    assert(soBanGhi(nhieu.classId) === 32, `đủ 32 bản ghi: ${soBanGhi(nhieu.classId)}`);
    let e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(P.admin, it.classId, { items: [{ studentId: it.sids[0], huong: 'chua_quyet', ghiChu: 'y'.repeat(501) }] }));
    assert(e?.status === 400 && e.details?.studentId === it.sids[0] && /tối đa 500/.test(e.message), `ghi chú dài: ${e?.message}`);
    e = loi(() => loTrinh.ghiLoTrinhTiep(P.admin, it.sids[1], { huong: 'chua_quyet', ngayXemLai: addDays(TODAY, -1) }));
    assert(e?.status === 400 && /từ hôm nay/.test(e.message), `ngày đã qua: ${e?.message}`);
    /* Bản ghi cũ (migrate) có ngày đã qua: lưu lại cùng ngày vẫn được — không chặn người sửa ghi chú. */
    conn.prepare(`UPDATE lo_trinh_tiep_theo SET huong = 'chua_quyet', ngay_xem_lai = ? WHERE student_id = ?`).run(addDays(TODAY, -3), it.sids[2]);
    loTrinh.ghiLoTrinhTiepCaLop(P.admin, it.classId, { items: [{ studentId: it.sids[2], huong: 'chua_quyet', ghiChu: 'sửa ghi chú' }] });
    assert(banGhi(it.sids[2]).ngay_xem_lai === addDays(TODAY, -3), 'giữ ngày cũ khi cùng hướng');
  });
}
