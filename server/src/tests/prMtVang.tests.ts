/**
 * PHÉP KIỂM PR-MT-VANG (chủ SP 05/11, N38 — đặc tả `docs/superpowers/specs/2026-11-04-luat-mt-thong-nhat-design.md` L1–L7 + lớp thường):
 * gõ "-" là dời sang tuần sau TUẦN THI · vắng 2 lần là huỷ (không chuông, không thẻ, không chặn đợt) · MT cũ theo TỪNG kỹ năng = Không dự thi ·
 * "-" không bao giờ sinh thẻ · chọn tuần = xếp lại từ đầu (kể cả đúng tuần cũ, rút thẻ cũ) · Bỏ khỏi đợt / Bỏ vắng giữ.
 * Mỗi ca dựng trạng thái bằng hàm máy chủ thật trong một giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { LUOT_LO_TRINH_CUOI_SQL } from '../students/tamDung.ts';

export async function runPrMtVangTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-MT-VANG · luật vắng / dời / huỷ MT thống nhất (L1–L7)');

  /* Tuần dựng ca: W = W1 NOV 2026 (02–08/11). TRONG = thứ Tư tuần thi; BU = thứ Tư W+1; QUA = thứ Tư W+2 (tuần thi W thành MT cũ). */
  const WS = '2026-11-02', W1S = '2026-11-09', W2S = '2026-11-16', W3S = '2026-11-23';
  const TRONG = '2026-11-04', BU = '2026-11-11', QUA = '2026-11-18';

  check('MV-0 · luật thuần: chuyenVang (tuần sau TUẦN THI, lần 2 huỷ, MT cũ theo kỹ năng) · laMtCuKyNang · luatVangThuong', () => {
    const cv = (o: object) => dm.chuyenVang({ lan: 0, tuanThi: WS, homNay: TRONG, ...o });
    const ca: Array<[string, object, string, string | null]> = [
      ['trong tuần thi', {}, 'doi', W1S],
      ['ghi muộn, tuần thi = tuần trước → tuần này (không theo tuần hiện tại)', { homNay: BU }, 'doi', W1S],
      ['ghi muộn CN tuần kế', { homNay: '2026-11-15' }, 'doi', W1S],
      ['tuần thi cách 2 tuần → Không dự thi', { homNay: QUA }, 'khong-du-thi', null],
      ['lần 2', { lan: 1, tuanThi: W1S, homNay: BU }, 'huy', null],
      ['lần 2 nhưng MT cũ → Không dự thi (không tính lần vắng)', { lan: 1, tuanThi: WS, homNay: QUA }, 'khong-du-thi', null],
    ];
    for (const [ten, vao, kq, tuan] of ca) {
      const r = cv(vao);
      assert(r.kq === kq && (r.tuanDich ?? null) === tuan, `ca ${ten}: ${JSON.stringify(r)}`);
    }
    assert(!dm.laMtCuKyNang(WS, '2026-11-15') && dm.laMtCuKyNang(WS, '2026-11-16') && dm.laMtCuKyNang('2026-10-26', QUA), 'mốc MT cũ = thứ Hai tuần thi + 14');
    const lt = (homNay: string) => dm.luatVangThuong(WS, homNay);
    assert(lt(TRONG).tuanMoi === W1S && lt(BU).tuanMoi === W1S && lt(QUA).khongDuThi === true, `lớp thường: ${JSON.stringify([lt(TRONG), lt(BU), lt(QUA)])}`);
    assert(!dm.cauDaGhiVang('L', 'Em', { kq: 'khong-du-thi' }).includes('huỷ') && dm.cauDaGhiVang('L', 'Em', { kq: 'khong-du-thi' }).includes('Không dự thi'), 'câu Không dự thi');
  });

  check('MV-0b · thao tác: hộp kỹ năng 3 nút Dời · Vắng · Bỏ khỏi đợt; không còn Xếp lại bài vắng / Đưa lại vào đợt / Không mock lại', () => {
    const q = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    const cu = ['xep-lai', 'dua-lai', 'khong-mock-lai'];
    for (const tt of ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su', 'huy-vang']) {
      const x = dm.thaoTacKyNang(tt, q);
      assert(![x.chinh, ...x.menu].some((m: string) => cu.includes(m)), `${tt}: ${JSON.stringify(x)}`);
    }
    for (const tt of ['vang', 'da-huy', 'huy-vang', 'khong-yeu-cau']) assert(dm.thaoTacKyNang(tt, q).chinh === 'doi-lich', `${tt} → Dời (L5)`);
    const m = dm.menuHopKyNang('huy-vang', q, false);
    assert(m.map((x: any) => x.muc).join(',') === 'doi-tuan,bao-vang,bo-ky-nang,doi-han,huy-diem,nhat-ky', JSON.stringify(m));
    assert(m[0].duoc && dm.CHU_MUC_HOP['doi-tuan'] === 'Dời' && dm.CHU_MUC_HOP['bao-vang'] === 'Vắng' && dm.CHU_MUC_HOP['bo-ky-nang'] === 'Bỏ khỏi đợt', 'chữ 3 nút');
    assert(dm.menuHopKyNang('dang-thi', q, false)[1].duoc && !dm.menuHopKyNang('chua-toi-tuan', q, false)[1].duoc, 'Vắng chỉ khi đã tới tuần Test');
    assert(dm.lyDoHuy({ huyVang: true }) === 'vắng 2 lần', 'nhãn Huỷ · vắng 2 lần');
  });
  if (!t.conn) return;

  const attempts: any = await import('../fasttrack/attempts.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const W = pid(WS), W1 = pid(W1S), W2 = pid(W2S), W3 = pid(W3S);
  const lop = classId('MB FT 101');
  const QL = P.mbManager, gvL = P.lrTeacher, gvcn = P.coreTeacher;
  const luot = all(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 2`, lop).map((r) => r.id as number);
  /** Trạng thái sạch: mọi kỹ năng ở tuần W, chưa điểm, chưa vắng; lượt khác của lớp rời các tuần dựng ca. */
  const dung = (aid: number, o: { lichSu?: boolean } = {}) => {
    ss.ensureSkillRows(aid);
    for (const b of ['assessment_scores', 'skill_move_requests', 'attempt_skill_skips', 'ket_qua_huy']) conn.prepare(`DELETE FROM ${b} WHERE attempt_id = ?`).run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = ?, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(o.lichSu ? 1 : 0, W, aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE planned_period_id IN (?, ?, ?, ?) AND attempt_id NOT IN (${luot.map(() => '?').join(',')})`)
      .run(W, W1, W2, W3, ...luot);
    xoaNho();
  };
  const ky = (aid: number, s: string) => one('SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = ?', aid, s);
  const dau = (aid: number, s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, s);
  const choDuyet = (aid: number) => all(`SELECT * FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`, aid);
  const theMoi = (aid: number) => all(`SELECT * FROM skill_move_requests WHERE attempt_id = ?`, aid).length;
  const chuongHuy = (aid: number) => (one(`SELECT COUNT(*) n FROM notifications WHERE kind = 'huy_vang' AND entity_id = ?`, aid).n as number);
  const vang = (aid: number, s: string, homNay: string, p = gvL) => attempts.saveScore(p, aid, s, { noShow: true }, homNay);

  check('MV-1 · L1: "-" lần 1 → dời TUẦN SAU TUẦN THI (trong tuần → W+1; ghi muộn tuần sau → vẫn W+1, không W+2), không thẻ', () => thu(() => {
    const a = luot[0];
    dung(a);
    const r = vang(a, 'listening', TRONG);
    let k = ky(a, 'listening');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled' && r.vang?.kq === 'doi', `trong tuần: ${JSON.stringify(k)}`);
    const r2 = vang(a, 'reading', BU);
    k = ky(a, 'reading');
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && r2.vang?.kq === 'doi', `ghi muộn: ${JSON.stringify(k)} ${JSON.stringify(r2.vang)}`);
    assert(!theMoi(a), 'không thẻ');
  }));

  check('MV-2 · L2: vắng lần 2 → huỷ (huy_vang), KHÔNG chuông / thẻ; không chặn đợt (completionWeekOf hợp lệ), là kỹ năng xong thiếu', () => thu(() => {
    const a = luot[0];
    dung(a);
    vang(a, 'listening', TRONG);
    const r = vang(a, 'listening', BU);
    const k = ky(a, 'listening');
    assert(k.sit_status === 'cancelled' && k.huy_vang === 1 && r.vang?.kq === 'huy', `lần 2: ${JSON.stringify(k)} ${JSON.stringify(r.vang)}`);
    assert(chuongHuy(a) === 0 && !theMoi(a), `chuông ${chuongHuy(a)}, thẻ ${theMoi(a)}`);
    const cw = ss.completionWeekOf(ss.ensureSkillRows(a));
    assert(cw.valid && !cw.blocking.length, `đợt không bị chặn: ${JSON.stringify(cw)}`);
    assert(dm.kyNangXongThieu(ss.ensureSkillRows(a), []).includes('listening'), 'xong thiếu');
    /* Nút Vắng (`baoVang`) cùng luật: R vắng lần 1 rồi lần 2 → huỷ, không chuông. */
    absence.baoVang(gvcn, a, 'reading', null, TRONG);
    const b = absence.baoVang(gvcn, a, 'reading', null, BU);
    assert(b.huyVang && ky(a, 'reading').sit_status === 'cancelled' && chuongHuy(a) === 0, JSON.stringify(b));
  }));

  check('MV-3 · L3: MT cũ xét TỪNG kỹ năng — L ở W (cách 2 tuần) "-" = Không dự thi, không chuông; R cùng lượt ở W+1 "-" dời; lượt lich_su có kỹ năng gần cũng dời', () => thu(() => {
    const a = luot[0];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'reading'`).run(W1, a);
    xoaNho();
    const r = vang(a, 'listening', QUA);
    const k = ky(a, 'listening');
    assert(dau(a, 'listening').no_show_cu === 1 && k.planned_period_id === W && k.absence_move_count === 0 && k.sit_status === 'scheduled', `L: ${JSON.stringify(k)}`);
    assert(r.vang?.kq === 'khong-du-thi' && chuongHuy(a) === 0, `kq L: ${JSON.stringify(r.vang)}`);
    const r2 = vang(a, 'reading', QUA);
    assert(ky(a, 'reading').planned_period_id === W2 && ky(a, 'reading').absence_move_count === 1 && r2.vang?.kq === 'doi', `R: ${JSON.stringify(ky(a, 'reading'))}`);
    const b = luot[1];
    dung(b, { lichSu: true });
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(W1, b);
    xoaNho();
    vang(b, 'speaking', BU, QL);
    assert(ky(b, 'speaking').planned_period_id === W2 && ky(b, 'speaking').absence_move_count === 1, `lich_su + kỹ năng gần: ${JSON.stringify(ky(b, 'speaking'))}`);
    assert(chuongHuy(b) === 0 && !theMoi(b), 'không chuông / thẻ');
  }));

  /* LUAT-NX-MT: giữa hai MT không còn chặn trùng / vượt — cảnh báo dời tay còn lại là "Chỉ cách MTn đúng một tuần" (MT0 ↔ MT1 vẫn chặn: thành cảnh báo). */
  check('MV-4 · L4: "-" lần 1 mà tuần đích vướng lượt khác (cảnh báo dời tay) → vẫn dời, có cảnh báo, không thẻ', () => thu(() => {
    const a = luot[0];
    dung(a);
    const truoc = one(`SELECT x.id FROM assessment_attempts x JOIN assessment_attempts a ON a.id = ? AND x.cycle_id = a.cycle_id
      WHERE x.kind = 'mock' AND x.id != a.id AND x.status != 'cancelled' ORDER BY x.attempt_no DESC LIMIT 1`, a);
    assert(!!truoc, 'tiền đề: em có MT trước');
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND required = 1 AND sit_status != 'cancelled'`).run(W, truoc.id);
    xoaNho();
    const r = vang(a, 'listening', TRONG);
    assert(ky(a, 'listening').planned_period_id === W1 && !theMoi(a) && r.vang?.kq === 'doi', `vướng vẫn dời: ${JSON.stringify(ky(a, 'listening'))}`);
    assert(typeof r.vang?.canhBao === 'string' && r.vang.canhBao.length > 0, `cảnh báo: ${JSON.stringify(r.vang)}`);
  }));

  check('MV-5 · L5: dời tay = xếp lại từ đầu — lần vắng 0, dấu "-" cũ xoá; "-" sau đó lại là lần 1 (dời, không huỷ)', () => thu(() => {
    const a = luot[0];
    dung(a);
    vang(a, 'listening', TRONG);
    ss.setSkillWeek(QL, a, 'listening', W2, { today: BU, force: true });
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W2 && k.absence_move_count === 0 && !dau(a, 'listening')?.no_show_period_id, `reset: ${JSON.stringify(k)}`);
    vang(a, 'listening', '2026-11-18');
    assert(ky(a, 'listening').planned_period_id === W3 && ky(a, 'listening').sit_status === 'scheduled' && ky(a, 'listening').absence_move_count === 1, 'lần 1 lại');
  }));

  check('MV-5b · L5: chọn ĐÚNG tuần đang có cũng là xếp lại (setSkillWeek + hộp `xepLai`)', () => thu(() => {
    const a = luot[0];
    dung(a);
    vang(a, 'listening', TRONG);
    vang(a, 'reading', TRONG);
    ss.setSkillWeek(QL, a, 'listening', W1, { today: TRONG, force: true });
    assert(ky(a, 'listening').planned_period_id === W1 && ky(a, 'listening').absence_move_count === 0, `cùng tuần: ${JSON.stringify(ky(a, 'listening'))}`);
    kh.luuDot(QL, { attemptId: a, kyNang: [{ skill: 'reading', periodId: W1, xepLai: true }], force: true });
    assert(ky(a, 'reading').absence_move_count === 0, `hộp: ${JSON.stringify(ky(a, 'reading'))}`);
  }));

  check('MV-5c · L5: kỹ năng huỷ vắng 2 lần / Không dự thi / bỏ khỏi đợt chọn tuần → đã xếp tuần đó, chuỗi mới', () => thu(() => {
    const a = luot[0];
    dung(a);
    vang(a, 'listening', TRONG); vang(a, 'listening', BU);
    kh.luuDot(QL, { attemptId: a, kyNang: [{ skill: 'listening', periodId: W2 }], force: true });
    let k = ky(a, 'listening');
    assert(k.sit_status === 'scheduled' && k.huy_vang === 0 && k.absence_move_count === 0 && k.planned_period_id === W2, `huỷ → xếp: ${JSON.stringify(k)}`);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'reading'`).run(W, a);
    vang(a, 'reading', QUA);
    assert(dau(a, 'reading').no_show_cu === 1, 'tiền đề Không dự thi');
    ss.setSkillWeek(QL, a, 'reading', W3, { today: QUA, force: true });
    assert(!dau(a, 'reading').no_show_cu && !dau(a, 'reading').no_show_period_id && ky(a, 'reading').planned_period_id === W3, 'Không dự thi → xếp lại');
    attempts.setSkillSkip(QL, a, 'speaking', true, 'thử');
    kh.luuDot(QL, { attemptId: a, kyNang: [{ skill: 'speaking', bo: false, periodId: W2 }], force: true });
    k = ky(a, 'speaking');
    assert(k.required === 1 && k.sit_status === 'scheduled' && k.planned_period_id === W2, `bỏ khỏi đợt → xếp: ${JSON.stringify(k)}`);
  }));

  check('MV-5d · L5: thẻ dời cũ đang chờ (dữ liệu trước PR) → dời tay tự rút thẻ, không chặn; hết hạn quét không huỷ lại', () => thu(() => {
    const a = luot[0];
    dung(a);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent', absent_from_no_show = 1, absence_move_count = 1 WHERE attempt_id = ? AND skill = 'listening'`).run(a);
    conn.prepare(`INSERT INTO skill_move_requests (attempt_id, skill, move_no, from_period_id, to_period_id, requested_on, decide_by, status, created_at)
      VALUES (?, 'listening', 2, ?, ?, ?, '2026-11-01', 'pending', ?)`).run(a, W, W1, TRONG, new Date().toISOString());
    xoaNho();
    const e = loi(() => ss.setSkillWeek(QL, a, 'listening', W2, { today: TRONG, force: true }));
    assert(e === null, `không chặn: ${e?.message}`);
    const k = ky(a, 'listening');
    assert(k.sit_status === 'scheduled' && k.absence_move_count === 0 && !choDuyet(a).length, `rút thẻ: ${JSON.stringify(k)}`);
    absence.sweepExpiredMoves();
    assert(ky(a, 'listening').sit_status === 'scheduled', 'quét hết hạn không huỷ lại');
  }));

  check('MV-7 · L7: Bỏ vắng (xoá "-" đã chốt) trả tuần gốc, trừ một lần vắng', () => thu(() => {
    const a = luot[0];
    dung(a);
    vang(a, 'listening', TRONG);
    attempts.saveScore(gvL, a, 'listening', { noShow: false }, TRONG);
    const k = ky(a, 'listening');
    assert(k.planned_period_id === W && k.absence_move_count === 0 && k.sit_status === 'scheduled', JSON.stringify(k));
  }));

  check('MV-8 · emCanXepLai / tóm tắt: kỹ năng huỷ vắng 2 lần không thành "cần xếp lại"', () => thu(() => {
    const a = luot[0];
    dung(a);
    const dem = () => { xoaNho(); return kh.danhSachLop(QL, {}).lop.find((l: any) => l.id === lop).canXepLai as number; };
    const truoc = dem();
    vang(a, 'listening', TRONG); vang(a, 'listening', BU);
    assert(ky(a, 'listening').huy_vang === 1 && dem() === truoc, `cần xếp lại ${truoc} → ${dem()}`);
  }));
}
