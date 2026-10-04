/** PHÉP KIỂM PR-K26 — Lộ trình tiếp theo theo dải % Cuối khoá (kế hoạch 2026-10-04-pr-k26-lo-trinh-tiep-theo-dai, K26-1 → K26-4). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrK26Tests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-K26 · Lộ trình tiếp theo theo dải % Cuối khoá');

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
}
