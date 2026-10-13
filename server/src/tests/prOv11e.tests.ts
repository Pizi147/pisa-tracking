/**
 * PHÉP KIỂM PR-OV11e — Lịch Test đếm phần của bạn · Điểm theo lớp · huỷ / khôi phục nguyên trạng · KCK theo lượt (đặc tả rà soát 14/10):
 *   (1) TE-7: GV có phân công — dải số / khối 1 chỉ đếm bài của người xem (S Mock chấm chéo không tính); QL như cũ; badge lớp = số trang mở;
 *       CA3-12: GV Writing thấy W1 / W2 tách người;
 *   (2) TE-8: dòng "MT cũ chưa nhập" mở Điểm theo lớp đúng lượt + Chỉ ô còn trống, số em từng lượt cộng đúng;
 *   (3) TE-10: Điểm theo lớp "trống" không đếm ô chưa tới tuần thi; (4) TE-11: lượt mặc định hoà tuần → lượt nhiều ô trống;
 *   (5) PT-4: huỷ lượt → có người mở trang (quét yêu cầu) → khôi phục: yêu cầu duyệt về "cho" như trước;
 *   (6) HV-18 (Q8): KCK tích sau khi lượt chốt không đổi kết luận lượt đó; lượt chưa chốt theo KCK; migrate prOv11e chạy lặp không đổi;
 *   (7) HL-6: hồ sơ lớp → Điểm theo lớp giữ bước hồ sơ lớp; (8) TE-12: Kế hoạch Test lớp thường có chip trễ như FT.
 * Mỗi ca cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv11eTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const cham: any = await import('../cham/canCham.ts');
  const diemLuot: any = await import('../cham/diemTheoLuot.ts');
  const classes: any = await import('../classes/classes.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrOv11e } = await import('../migrate/prOv11e.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV11e · Lịch Test phần của bạn · Điểm theo lớp · huỷ / khôi phục · KCK theo lượt');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const FT101 = classId('MB FT 101'), FOU12 = classId('MB FOU 12');
  const tuanNay = week.ensurePeriod(week.mondayOf(TODAY)).id as number;
  const QL = P.mbManager;
  const gvS = P.sTeacher;   // GV Speaking MB FT 101 (S Mock = chấm chéo) — cũng dạy môn ở MB FOU 12
  const conCuaToi = (r: any) => r.no.reduce((n: number, x: any) => n + (x.phan ? x.phan.toi?.con ?? 0 : x.conBai), 0);

  check('OV11e-1 · TE-7: GV Speaking — "Quá hạn chấm" MB FT 101 = 0 (S Mock chấm chéo không tính); QL = cả lớp như cũ; badge lớp = số trang mở', () => thu(() => {
    xoaNho();
    const gv = cham.lichTest(gvS, tuanNay, null, TODAY, { classId: FT101, phamVi: 'tat-ca' });
    const ql = cham.lichTest(QL, tuanNay, null, TODAY, { classId: FT101 });
    assert(ql.tongQuan.no.bai > 0 && ql.tongQuan.no.bai === ql.no.reduce((n: number, x: any) => n + x.conBai, 0) && ql.no.every((x: any) => x.phan === null),
      `QL khối 1: ${ql.tongQuan.no.bai}`);
    assert(gv.no.length > 0 && gv.no.every((x: any) => x.phan && !x.phan.toi && !x.quaHan), `GV S: khối 1 phải tách phần, không đỏ: ${JSON.stringify(gv.no.map((x: any) => [x.key, x.phan, x.quaHan]))}`);
    assert(gv.tongQuan.no.bai === 0 && gv.tongQuan.no.lop === 0, `GV S "Quá hạn chấm": ${JSON.stringify(gv.tongQuan.no)}`);
    assert((gv.tongQuan.khac?.no ?? 0) === ql.tongQuan.no.bai, `phần GV khác: ${JSON.stringify(gv.tongQuan.khac)} ≠ ${ql.tongQuan.no.bai}`);
    /* Badge "n bài chờ chấm" (Học viên & Lớp, phần của mình) = số ở trang nó mở (Lịch Test lọc lớp: còn phải chấm + quá hạn). */
    for (const lop of [FT101, FOU12]) {
      const badge = classes.listClassSummaries(gvS, { classId: lop }).rows.find((c: any) => c.id === lop)?.needScores ?? 0;
      const tr = cham.lichTest(gvS, tuanNay, null, TODAY, { classId: lop });
      assert(badge === tr.tongQuan.conPhaiCham + tr.tongQuan.no.bai, `lớp ${lop}: badge ${badge} ≠ trang ${tr.tongQuan.conPhaiCham} + ${tr.tongQuan.no.bai}`);
      assert(conCuaToi(tr) === tr.tongQuan.no.bai, 'khối 1 cộng phần của mình = ô "Quá hạn chấm"');
    }
  }));

  check('OV11e-1b · CA3-12: GV Writing Task 2 — hàng lớp ghi W2 của bạn, W1 là GV khác (W1 / W2 tách người)', () => thu(() => {
    xoaNho();
    const r = cham.lichTest(P.w2Teacher, tuanNay, null, TODAY, { classId: FT101, phamVi: 'tat-ca' });
    const hang = [...(r.chamTuanNay ?? []), ...r.lop, ...r.no].filter((x: any) => x.phan);
    assert(hang.length > 0, 'không có hàng nào có phần');
    for (const h of hang) {
      assert(!(h.phan.toi?.kyNang ?? []).includes('writing1') && !(h.phan.toi?.kyNang ?? []).includes('writing'), `W1 không phải của GV W2: ${JSON.stringify(h.phan)}`);
      if ((h.phan.khac?.kyNang ?? []).some((k: string) => k.startsWith('writing'))) {
        assert(h.phan.khac.kyNang.includes('writing1'), `phần khác phải ghi W1: ${JSON.stringify(h.phan)}`);
      }
    }
  }));

  check('OV11e-2 · TE-8: "MT cũ chưa nhập" mở Điểm theo lớp đúng lượt + Chỉ ô còn trống; số em từng lượt khớp', () => thu(() => {
    xoaNho();
    const ds = cham.mtLichSuChuaNhap(QL, { classIds: [FT101] });
    assert(ds.length === 1, `MB FT 101 phải có dòng MT cũ: ${JSON.stringify(ds)}`);
    const n = ds[0];
    assert(n.luot.length >= 1 && n.luot.every((l: any) => l.href === `/test/diem-lop?lop=${FT101}&luot=mt:${l.so}&trong=1` && l.soEm > 0), `lượt: ${JSON.stringify(n.luot)}`);
    assert(n.href === n.luot[0].href, `href dòng = lượt đầu: ${n.href}`);
    for (const l of n.luot) {
      const em = one(`SELECT COUNT(DISTINCT student_id) n FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND attempt_no = ? AND lich_su = 1 AND status = 'planned'`, FT101, l.so).n;
      assert(l.soEm <= em, `MT${l.so}: ${l.soEm} em > ${em} lượt MT cũ`);
    }
  }));

  check('OV11e-3 · TE-10: Điểm theo lớp "trống" không đếm ô chưa tới tuần thi (T19)', () => thu(() => {
    const a = one(`SELECT id, attempt_no FROM assessment_attempts WHERE class_id = ? AND kind = 'mock' AND status != 'cancelled' AND lich_su = 0 ORDER BY attempt_no DESC, id LIMIT 1`, FT101);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(a.id);
    const dat = (ws: string) => {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`).run(week.ensurePeriod(ws).id, a.id);
      xoaNho();
      return diemLuot.danhSachLuot(QL, FT101, TODAY).luot.find((l: any) => l.ma === `mt:${a.attempt_no}`).oTrong as number;
    };
    const daToi = dat(week.mondayOf(TODAY)), chuaToi = dat(t.addDays(week.mondayOf(TODAY), 21));
    assert(daToi - chuaToi === 5, `5 ô của em thi 3 tuần sau không phải ô trống: tới tuần ${daToi}, chưa tới ${chuaToi}`);
  }));

  check('OV11e-3b · TE-10: "Chỉ ô còn trống" (web) bỏ ô chưa tới tuần / chưa xếp tuần — cùng nghĩa với số máy chủ', () => {
    const c = (o: object) => ({ required: true, progress: 'due', band: null, noShow: null, ...o });
    assert(d.oTrongLuotFt(c({})) && !d.oTrongLuotFt(c({ progress: 'upcoming' })) && !d.oTrongLuotFt(c({ progress: 'not_scheduled' })), 'FT');
    const r = (progress: string) => ({ skillSchedule: [{ skill: 'reading', progress, noShow: false, movedFrom: null, periodCode: 'P1' }], result: { skills: [{ skill: 'reading', score: null }] } });
    assert(d.hangThuongConTrong(r('due')) && !d.hangThuongConTrong(r('upcoming')) && !d.hangThuongConTrong(r('not_scheduled')), 'lớp thường');
  });

  check('OV11e-4 · TE-11: lượt mặc định hai lượt cùng tuần → lượt nhiều ô trống hơn (Final trước MT0)', () => {
    const l = (ma: string, oTrong: number) => ({ ma, nhan: ma, tuanStart: '2026-09-14', lichSu: false, duDiem: 0, coLich: 6, oTrong });
    assert(d.luotMacDinh([l('thuong:final', 20), l('thuong:mt0', 1)], TODAY) === 'thuong:final', 'Final trước');
    assert(d.luotMacDinh([l('thuong:mt0', 1), l('thuong:final', 20)], TODAY) === 'thuong:final', 'không theo thứ tự đầu vào');
  });

  check('OV11e-5 · PT-4: huỷ lượt → có người mở trang (quét yêu cầu) → khôi phục: yêu cầu duyệt về "cho", Case mở lại', () => thu(() => {
    const y = one(`SELECT y.id, y.doi_tuong_id AS cid, m.attempt_id AS aid FROM yeu_cau_duyet y
        JOIN sos_cases sc ON sc.id = y.doi_tuong_id AND sc.status != 'done'
        JOIN case_milestones m ON m.case_id = sc.id AND m.attempt_id IS NOT NULL
        JOIN assessment_attempts a ON a.id = m.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
       WHERE y.trang_thai = 'cho' AND y.doi_tuong_loai = 'sos_case' ORDER BY y.id LIMIT 1`);
    assert(y, 'demo cần một yêu cầu duyệt đang chờ trên Case của lượt Mock');
    assert(attempts.caseSinhRieng(y.aid).includes(y.cid), 'tiền đề: Case sinh riêng từ lượt');
    attempts.huyLuot(QL, y.aid, { lyDo: 'Thử huỷ' });
    xoaNho();
    yeuCau.quetYeuCau(TODAY);
    assert(one('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', y.id).trang_thai === 'tu_dong', 'tiền đề: quét đóng thẻ của Case đã đóng');
    attempts.reopenAttempt(QL, y.aid);
    xoaNho();
    yeuCau.quetYeuCau(TODAY);
    const sau = one('SELECT trang_thai, ly_do_dong, xu_ly_luc FROM yeu_cau_duyet WHERE id = ?', y.id);
    assert(sau.trang_thai === 'cho' && sau.ly_do_dong === null && sau.xu_ly_luc === null, `khôi phục phải trả yêu cầu về chờ: ${JSON.stringify(sau)}`);
    assert(one('SELECT status FROM sos_cases WHERE id = ?', y.cid).status !== 'done', 'Case mở lại');
  }));

  check('OV11e-6 · HV-18 (Q8): tích KCK sau khi lượt chốt — lượt đó giữ SOS + Case; lượt chưa chốt theo KCK; migrate prOv11e chạy lặp không đổi', () => thu(() => {
    const a = all(`SELECT DISTINCT a.*, cy.target_score, cy.id AS cy FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.khong_cam_ket = 0
        JOIN sos_cases sc ON sc.attempt_id = a.id AND sc.status != 'done' AND sc.kck = 0
       WHERE a.kind = 'mock' AND a.status != 'cancelled' AND a.class_id = ? AND cy.target_score IS NOT NULL ORDER BY a.id`, FT101)
      .find((x: any) => { const r = attempts.resultOf(x); return r.chot && (r.sosLevel ?? 0) > 0; });
    assert(a, 'demo cần một lượt MB FT 101 đã chốt SOS, có Case SOS đang mở');
    const kq0 = attempts.resultOf(a);
    assert(kq0.chot && (kq0.sosLevel ?? 0) > 0, `tiền đề: lượt đã chốt SOS: ${JSON.stringify({ chot: kq0.chot, sos: kq0.sosLevel })}`);
    const chuaChot = one(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND status != 'cancelled' AND id != ? ORDER BY attempt_no DESC LIMIT 1`, a.cy, a.id);
    cycles.reviseTarget(QL, a.cy, { newTarget: `${a.target_score} KCK`, reason: 'Thử KCK theo lượt' });
    xoaNho();
    const sau = one('SELECT * FROM assessment_attempts WHERE id = ?', a.id);
    assert(attempts.kckCuaLuot(sau) === false, 'lượt đã chốt giữ KCK lúc chốt (không KCK)');
    const kq1 = attempts.resultOf(sau);
    assert(kq1.sosLevel === kq0.sosLevel && !kq1.kckDuoi, `kết luận lượt đã chốt không đổi: ${JSON.stringify({ sos: kq1.sosLevel, kckDuoi: kq1.kckDuoi })}`);
    assert(one('SELECT COUNT(*) n FROM sos_cases WHERE attempt_id = ? AND status != ? AND kck = 0', a.id, 'done').n > 0, 'Case SOS giữ');
    if (chuaChot && !attempts.resultOf(chuaChot).chot) assert(attempts.kckCuaLuot(chuaChot) === true, 'lượt chưa chốt theo KCK hiện tại');
    /* migrate: bỏ cột rồi chạy — thêm cột + điền lượt đã chốt; chạy lần hai không ghi gì. */
    conn.exec('ALTER TABLE assessment_attempts DROP COLUMN kck_at_attempt');
    const ap: string[] = [];
    migratePrOv11e(conn, ap);
    assert(ap.length > 0 && one('SELECT kck_at_attempt k FROM assessment_attempts WHERE id = ?', a.id).k === 1, `migrate điền lượt đã chốt theo cờ hiện tại: ${ap.join(' | ')}`);
    const n0 = one('SELECT total_changes() n').n;
    const ap2: string[] = [];
    migratePrOv11e(conn, ap2);
    assert(one('SELECT total_changes() n').n === n0 && ap2.length === 0, `chạy lần hai còn đổi: ${ap2.join(' | ')}`);
  }));

  check('OV11e-7 · HL-6: hồ sơ lớp → Điểm theo lớp thêm bước hồ sơ lớp; đổi lượt giữ; về hồ sơ lớp cắt đúng bước', () => {
    const ds = { url: '/hoc-vien?view=lop', ten: 'Học viên & Lớp', cuon: 0 };
    const lop = { url: '/hoc-vien/lop/3', ten: 'Hồ sơ lớp', cuon: 120 };
    const vao = d.buocMoi([ds], { tu: lop, den: '/test/diem-lop?lop=3', kieu: 'PUSH' });
    assert(vao.chong.length === 2 && vao.chong[1].url === lop.url, JSON.stringify(vao));
    const doiLuot = d.buocMoi(vao.chong, { tu: { url: '/test/diem-lop?lop=3', ten: 'Điểm theo lớp', cuon: 0 }, den: '/test/diem-lop?lop=3&luot=mt:3', kieu: 'REPLACE' });
    assert(doiLuot.chong === vao.chong, 'đổi lượt (replace) không đổi chồng');
    const ve = d.buocMoi(vao.chong, { tu: { url: '/test/diem-lop?lop=3&luot=mt:3', ten: 'Điểm theo lớp', cuon: 0 }, den: lop.url, kieu: 'PUSH' });
    assert(ve.chong.length === 1 && ve.chong[0].url === ds.url && ve.cuonVe === 120, JSON.stringify(ve));
    const tuDs = d.buocMoi([], { tu: ds, den: '/test/diem-lop?lop=3', kieu: 'PUSH' });
    assert(tuDs.chong.length === 0, 'từ trang nguồn sang Điểm theo lớp: không thêm bước');
  });

  check('OV11e-8 · TE-12: Kế hoạch Test lớp thường — bài quá tuần chưa chấm có chip trễ như FT; chưa tới tuần thì không', () => thu(() => {
    const a = one(`SELECT a.id, a.kind FROM assessment_attempts a WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, FOU12);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(a.id);
    const dat = (ws: string) => {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1 WHERE attempt_id = ?`).run(week.ensurePeriod(ws).id, a.id);
      xoaNho();
      const kn = keHoach.luoiThuong(QL, FOU12, TODAY).hang.map((h: any) => h.dot[a.kind]).find((x: any) => x?.attemptId === a.id).kn;
      return Object.values(kn) as any[];
    };
    const qua = dat(t.addDays(week.mondayOf(TODAY), -14));
    assert(qua.length > 0 && qua.every((o) => o.trangThai === 'tre' && o.hanCham === null), JSON.stringify(qua.map((o) => [o.trangThai, o.hanCham])));
    const toi = dat(t.addDays(week.mondayOf(TODAY), 14));
    assert(toi.every((o) => o.trangThai === 'da-xep'), JSON.stringify(toi.map((o) => o.trangThai)));
  }));
}
