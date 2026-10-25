/** PHÉP KIỂM PR-KCK (Q29-1) — Target "không cam kết": nhập, không SOS, không việc Điền target, đổi target ↔ KCK, quyền. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import { chotSan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrKckTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const { saveScore } = await import('../fasttrack/attempts.ts');
  const { LISTENING_BY_RAW, READING_BY_RAW } = await import('../fasttrack/scoring.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { missingForStudent } = await import('../classes/schedule.ts');
  const { migratePrKck } = await import('../migrate/prKck.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nPR-KCK · Target không cam kết');

  const maLoi = (fn: () => unknown): number | string => {
    try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); }
  };
  const ft = t.classId('MB FT 101');
  const hv = (ten: string) => conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
  const cy = (sid: number) => conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
  const luot = (sid: number) => conn.prepare('SELECT * FROM assessment_attempts WHERE student_id = ? ORDER BY attempt_no').all(sid) as any[];
  /* Em mới ở MB FT 101 mà MT1 rơi đúng 2 tuần trước ngày demo — nhập điểm được ngay (như bộ demo SOS v3). */
  const them = (fullName: string, target: unknown) => {
    const tuanThi = d.mondayOfDate(t.addDays(demoToday(), -14));
    const startWeek = t.addDays(tuanThi, -7 * (d.tuanHocCuaMt(d.lichMtGoc('LT1'), 1) - 1));
    intake.commitIntake(P.admin, { classId: ft, rows: [{ fullName, target, startWeek, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `kck-${fullName}` });
    const sid = hv(fullName).id;
    const mt1 = luot(sid)[0];
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(mt1.id);
    return { sid, cid: cy(sid).id, mt1 };
  };
  const cham = (attemptId: number, band: number) => {
    saveScore(P.admin, attemptId, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(band) });
    saveScore(P.admin, attemptId, 'reading', { rawScore: READING_BY_RAW.indexOf(band) });
    saveScore(P.admin, attemptId, 'speaking', { criteria: tieuChiThu(band) });
  };
  const n = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as any).n as number;

  check('KCK (1) · laKck nhận KCK/kck/-/không cam kết/khong cam ket; trống và số không phải KCK', () => {
    for (const s of ['KCK', 'kck', ' Kck ', '-', '–', 'không cam kết', 'Khong cam ket']) assert(d.laKck(s), `bỏ sót "${s}"`);
    for (const s of ['', null, undefined, '6.5', 6, 'không', 'k']) assert(!d.laKck(s), `nhận nhầm "${s}"`);
  });

  check('KCK (1) · migrate chạy lặp được; schema.sql đã có cột', () => {
    const a: string[] = []; migratePrKck(conn, a);
    assert(a.length === 0, `DB từ schema.sql vẫn phải thêm: ${a.join('; ')}`);
    const coCot = (bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
    assert(coCot('learning_cycles', 'khong_cam_ket') && coCot('cycle_target_revisions', 'new_khong_cam_ket'), 'thiếu cột');
  });

  check('KCK (2) · dán "-" / "không cam kết" hiện KCK; xem trước không báo lỗi/lưu ý ở ô Target; trống vẫn lưu ý "Chưa có"', () => {
    const r = intake.parsePaste('Họ và tên\tEmail\tTarget\nA\ta@b.vn\t-\nB\tb@c.vn\tkhông cam kết\nC\tc@d.vn\t6.5');
    assert(r.rows[0].target === 'KCK' && r.rows[1].target === 'KCK' && r.rows[2].target === '6.5', JSON.stringify(r.rows));
    const pv = intake.previewIntake(P.admin, { classId: ft, rows: [
      { fullName: 'A', dob: '2010-01-01', email: emailThu(), target: 'kck' }, { fullName: 'B', email: emailThu() },
    ] });
    assert(pv.rows[0].target === 'KCK' && !pv.rows[0].issues.some((i: any) => i.field === 'target'), JSON.stringify(pv.rows[0]));
    assert(pv.rows[1].issues.some((i: any) => i.field === 'target' && i.muc === 'luu_y'), 'ô trống phải còn lưu ý');
  });

  const han = them('KCK Nhập Chữ', 'KCK');
  const duc = them('KCK Nhập Gạch', '-');
  const trong = them('KCK Để Trống', '');

  check('KCK (2) · ghi: KCK và "-" → khong_cam_ket = 1, target NULL; trống → 0; lượt MT tự tạo, không kỳ vọng', () => {
    for (const x of [han, duc]) {
      const c = cy(x.sid);
      assert(c.khong_cam_ket === 1 && c.target_score === null, JSON.stringify(c));
      assert(luot(x.sid).length >= 1 && luot(x.sid).every((a) => a.target_at_attempt === null), 'lượt MT phải có, không target');
    }
    assert(cy(trong.sid).khong_cam_ket === 0, 'ô trống không phải KCK');
  });

  /* OV-9 (chủ SP 13/10): KCK là DẤU RIÊNG, Target giữ — em KCK chưa có Target cũng thiếu Target như em thường (đổi ý phép kiểm cũ "không việc Điền target"). */
  check('KCK (4) → OV-9 · em KCK chưa có Target vẫn có việc "Điền target" + "Thiếu thông tin" target (như ô trống); có Target thì không', () => {
    const keys = new Set((myWork(P.coreTeacher, { nguoi: 'toi' }).items ?? []).map((i: any) => i.key));
    assert(keys.has(`target:${han.sid}`) && keys.has(`target:${duc.sid}`), 'em KCK chưa có Target mất việc Điền target');
    assert(keys.has(`target:${trong.sid}`), 'em trống target mất việc Điền target');
    const thieu = (c: any) => missingForStudent({ cycle: { start_period_id: 1, exam_month: '2027-01', baseline: true, ...c },
      student: null, isFastTrack: true }).map((m: any) => m.key);
    assert(thieu({ target_score: null, khong_cam_ket: 1 }).includes('target'), 'KCK chưa có Target không báo thiếu');
    assert(!thieu({ target_score: 6.5, khong_cam_ket: 1 }).includes('target'), 'KCK có Target bị tính thiếu');
    assert(thieu({ target_score: null, khong_cam_ket: 0 }).includes('target'), 'trống mà không báo thiếu');
  });

  check('KCK (4) · MT dưới band không sinh Case / PA quy chế / Phối hợp SOS', () => {
    cham(han.mt1.id, 4);
    assert(n('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', han.sid) === 0, 'có Case SOS');
    assert(n('SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ?', han.mt1.id) === 0, 'có Phối hợp SOS');
    assert(n(`SELECT COUNT(*) n FROM case_interventions i JOIN sos_cases c ON c.id = i.case_id WHERE c.student_id = ?`, han.sid) === 0, 'có PA');
    /* Bộ demo cũng vậy (DEMO.md). */
    const demo = hv('Hồ Gia Hân');
    assert(demo && cy(demo.id).khong_cam_ket === 1 && n('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', demo.id) === 0, 'demo Hồ Gia Hân');
  });

  {
    const tongHop: any = await import('../phanTich/tongHop.ts');
    /* PR-Dọn (Q14): bảng tuần `/weekly-rollup` đã xoá (web không gọi) — chỉ còn Tổng hợp. */
    const dem = () => ({
      th: tongHop.oTongHop(P.admin, { branchId: null, ct: 'ft', soTuan: 52, classId: null, theo: 'lop', khoa: 'tong', cot: 'luot' }).n as number,
    });
    check('KCK (4) · số liệu: lượt đã chấm của em KCK ngoài mẫu số "Lượt MT" (Tổng hợp); bỏ KCK thì lại vào', () => {
      const co = dem();
      conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 0 WHERE id = ?').run(han.cid);
      const khong = dem();
      conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 1 WHERE id = ?').run(han.cid);
      assert(khong.th === co.th + 1, `Tổng hợp: ${JSON.stringify({ co, khong })}`);
    });
  }

  check('KCK (3) · đổi target → KCK: lượt chưa điểm bỏ kỳ vọng, lượt có điểm giữ, Case SOS đang mở giữ; KCK → target: lượt chưa điểm lấy target mới', () => {
    const x = them('KCK Đổi Qua Lại', '6.5');
    chotSan(conn, x.mt1.id);                                              // OV-1c: MT1 thiếu W — chốt sẵn để L/R/S sinh Case
    cham(x.mt1.id, 4);                                                    // MT1 kỳ vọng 5.5 → SOS
    const caseMo = n(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND status != 'done'`, x.sid);
    assert(caseMo > 0, 'chuẩn bị: MT1 phải sinh Case');
    cycles.reviseTarget(P.mbManager, x.cid, { newTarget: 'KCK', reason: 'Gia đình không đăng ký thi' });
    const ls = luot(x.sid);
    assert(cy(x.sid).khong_cam_ket === 1 && cy(x.sid).target_score === null, JSON.stringify(cy(x.sid)));
    assert(ls[0].target_at_attempt === 6.5, `MT1 đã có điểm bị viết lại: ${ls[0].target_at_attempt}`);
    assert(ls.length > 1 && ls.slice(1).every((a) => a.target_at_attempt === null), JSON.stringify(ls.map((a) => a.target_at_attempt)));
    assert(n(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND status != 'done'`, x.sid) === caseMo, 'Case đang mở bị đóng');
    const rev = conn.prepare('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC').get(x.cid) as any;
    assert(rev.old_target === 6.5 && rev.new_khong_cam_ket === 1 && rev.old_khong_cam_ket === 0, JSON.stringify(rev));
    assert(maLoi(() => cycles.reviseTarget(P.mbManager, x.cid, { newTarget: '-', reason: 'lặp' })) === 'không ném'
      && cycles.targetRevisions(x.cid).length === 1, 'đặt lại KCK lần hai phải là không đổi');

    cycles.reviseTarget(P.mbManager, x.cid, { newTarget: 7, reason: 'Gia đình đổi ý, đăng ký thi' });
    const ls2 = luot(x.sid);
    assert(cy(x.sid).khong_cam_ket === 0 && cy(x.sid).target_score === 7, JSON.stringify(cy(x.sid)));
    assert(ls2[0].target_at_attempt === 6.5 && ls2.slice(1).every((a) => a.target_at_attempt === 7), JSON.stringify(ls2.map((a) => a.target_at_attempt)));

    cycles.updateCycle(P.mbManager, x.cid, { targetScore: 'kck', lyDo: 'Em chưa cam kết Target' });      // PATCH lộ trình cũng nhận KCK
    assert(cy(x.sid).khong_cam_ket === 1 && luot(x.sid).slice(1).every((a) => a.target_at_attempt === null), 'PATCH KCK');
    cycles.updateCycle(P.mbManager, x.cid, { targetScore: 6, lyDo: 'Em đặt lại Target' });
    assert(cy(x.sid).khong_cam_ket === 0 && cy(x.sid).target_score === 6, 'PATCH số bỏ KCK');
  });

  check('KCK (3) · quyền: GVCN gửi thẳng API đặt KCK cho em đã có lộ trình → 403; OV-11d (Q8): Đề xuất sửa đổi dấu KCK → 403 (chỉ QL / Quản trị / TVV tích KCK)', () => {
    const x = them('KCK Quyền GVCN', '6.5');
    assert(maLoi(() => cycles.reviseTarget(P.coreTeacher, x.cid, { newTarget: 'KCK', reason: 'GVCN tự đặt' })) === 403, 'reviseTarget');
    assert(maLoi(() => cycles.updateCycle(P.coreTeacher, x.cid, { targetScore: 'KCK' })) === 403, 'PATCH targetScore');
    assert(maLoi(() => cycles.updateCycle(P.coreTeacher, x.cid, { khongCamKetGhi: 1 })) === 'không ném' && cy(x.sid).khong_cam_ket === 0,
      'khoá nội bộ gửi thẳng lọt qua');
    assert(maLoi(() => deXuat.guiDeXuatSua(P.coreTeacher, x.sid, { truong: 'target', moi: 'KCK', lyDo: 'Gia đình chưa đăng ký thi IELTS' })) === 403,
      'OV-11d: GVCN đề xuất đổi dấu KCK phải 403');
    cycles.reviseTarget(P.mbManager, x.cid, { newTarget: 'KCK', reason: 'Gia đình chưa đăng ký thi IELTS' });
    assert(cy(x.sid).khong_cam_ket === 1, 'QL tích KCK');
    assert(maLoi(() => deXuat.guiDeXuatSua(P.coreTeacher, x.sid, { truong: 'target', moi: '-', lyDo: 'Gia đình chưa đăng ký thi IELTS' })) === 400,
      'đề xuất KCK trùng hiện tại');
  });
}
